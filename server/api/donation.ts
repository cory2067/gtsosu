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
type PostKofiDonationBody = any; // TODO
type PostKofiDonationResponse = {};

donationRouter.postAsync(
  "/kofi-donation",
  async (req: Request<{}, PostKofiDonationBody>, res: Response<PostKofiDonationResponse>) => {
    console.log(req.body);
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
