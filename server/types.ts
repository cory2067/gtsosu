import * as express from "express";
import { Query } from "express-serve-static-core";

import { IUser } from "./models/user";
import { HydratedDocument } from "mongoose";
import { UserAuthWithContext } from "./permissions/UserAuth";

// User interface + mongoose document builtins (e.g. _id, .save())
// This added to the base express Request object as req.user
interface UserDocument extends IUser, HydratedDocument<IUser> {}
interface Request<Q extends Query, B> extends express.Request {
  query: Q;
  body: B;
  user?: UserDocument;
  auth: UserAuthWithContext;
}
type Populate<T, R> = Omit<T, keyof R> & R;

export { Request, UserDocument, Populate };
