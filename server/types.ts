import * as express from "express";
import { IUser } from "./models/user";
import { HydratedDocument } from "mongoose";

// User interface + mongoose document builtins (e.g. _id, .save())
// This added to the base express Request object as req.user
interface UserDocument extends IUser, HydratedDocument<IUser> {}
interface Request extends express.Request {
  user: UserDocument;
}

export { Request, UserDocument };
