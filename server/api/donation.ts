import express, { Response } from "express";
import pino from "pino";

import { User as OsuUser } from "node-osu";
import ensure from "../ensure";
import Tournament from "../models/tournament";
import User from "../models/user";
import TourneyMap, { ITourneyMap } from "../models/tourney-map";
import { IUser } from "../models/user";
import { Request, UserDocument } from "../types";
import { getOsuApi, checkPermissions, assertUser } from "../util";

import { addAsync } from "@awaitjs/express";
const donationRouter = addAsync(express.Router());

const logger = pino();
const osuApi = getOsuApi();

type KofiDonation = {
  fromName: string;
  message: string;
  amount: number;
  verificationToken: string;
};
const parseKofiDonation = (rawData: string): KofiDonation => {
  const data = JSON.parse(rawData);
  return {
    fromName: data.from_name,
    message: data.message,
    amount: parseFloat(data.amount),
    verificationToken: data.verification_token,
  };
};

const getUserFromDonation = async (donation: KofiDonation): Promise<OsuUser | null> => {
  try {
    // See if the fromName corresponds to a real user
    return await osuApi.getUser({ u: donation.fromName, m: 1 });
  } catch (e) {}

  // Check for profile link in the message as a fallback
  const userRegex = /https:\/\/osu\.ppy\.sh\/(u|users)\/([^\s]+)/;
  const match = donation.message.match(userRegex);
  if (!match) {
    return null;
  }

  try {
    return await osuApi.getUser({ u: match[2], m: 1 });
  } catch (e) {
    return null;
  }
};

const applyDonation = async (userData: OsuUser, donationAmount: number): Promise<IUser> => {
  // Use their GTS account, or create one if it doesn't exist
  return await User.findOneAndUpdate(
    { userid: userData.id },
    {
      $set: {
        username: userData.name,
        country: userData.country,
        avatar: `https://a.ppy.sh/${userData.id}`,
      },
      $inc: { donations: donationAmount },
    },
    { new: true, upsert: true }
  );
};

/**
 * GET /api/donors
 * Gets all users who have donated before
 */
type GetDonorsQuery = {
  // No args
};
type GetDonorsResponse = IUser[];

donationRouter.getAsync(
  "/donors",
  async (req: Request<{}, GetDonorsQuery>, res: Response<GetDonorsResponse>) => {
    const donors = await User.find({ donations: { $gt: 0 } }).sort({ donations: "desc" });
    res.send(donors);
  }
);

/**
 * POST /api/kofi-donation
 * Registers a Ko-fi donation with the GTS website
 * To be called only as a webhook configured with the Ko-fi API
 */
type PostKofiDonationBody = {
  data: string; // json string that can be parsed into KofiDonationData
};
type PostKofiDonationResponse = {};
donationRouter.postAsync(
  "/kofi-donation",
  async (req: Request<{}, PostKofiDonationBody>, res: Response<PostKofiDonationResponse>) => {
    const donation = parseKofiDonation(req.body.data);
    logger.info(donation);
    if (donation.verificationToken !== process.env.KOFI_TOKEN) {
      logger.warn(`Received unverified donation from ${donation.fromName}!`);
      res.send({});
      return;
    }

    const userData = await getUserFromDonation(donation);
    if (!userData) {
      logger.info(`Couldn't identify donor ${donation.fromName}`);
      res.send({});
      return;
    }

    await applyDonation(userData, donation.amount);
    logger.info(`Succesfully processed $${donation.amount} donation from ${userData.name}`);

    res.send({});
  }
);

/**
 * POST /api/manual-donation
 * Registered a donation manually submitted by an admin
 * Returns the updated user object
 */
type PostManualDonationBody = {
  username: string;
  donation: number;
};
type PostManualDonationResponse = IUser;

donationRouter.postAsync(
  "/manual-donation",
  ensure.isAdmin,
  async (req: Request<{}, PostManualDonationBody>, res: Response<PostManualDonationResponse>) => {
    const userData = await osuApi.getUser({ u: req.body.username, m: 1 });
    const updatedUser = await applyDonation(userData, req.body.donation);
    logger.info(`Manually added $${req.body.donation} donation from ${userData.name}`);
    res.send(updatedUser);
  }
);

export default donationRouter;
