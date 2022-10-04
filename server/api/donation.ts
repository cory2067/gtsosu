import express, { Response } from "express";
import pino from "pino";

import ensure from "../ensure";
import Tournament from "../models/tournament";
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
    res.send([]);
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
    logger.warn(donation);
    if (donation.verificationToken !== process.env.KOFI_TOKEN) {
      logger.warn(`Received unverified donation from ${donation.fromName}!`);
      res.send({});
      return;
    }

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
  async (req: Request<{}, PostManualDonationBody>, res: Response<PostManualDonationResponse>) => {}
);

export default donationRouter;
