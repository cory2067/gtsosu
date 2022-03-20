import { Schema, model } from "mongoose";

interface UserTourneyStats {
  tourney: string;
  seedName: string;
  seedNum: number;
  group: string;
  regTime: Date;
}

interface IUser {
  username: string;
  userid: string;
  country: string;
  avatar: string;
  discord: string;
  timezone: number;
  rank: number;
  admin: boolean;
  roles: { tourney: string; role: string }[];
  stats: UserTourneyStats[];
  tournies: string[];
}

const UserSchema = new Schema<IUser>({
  username: String,
  userid: String,
  country: String,
  avatar: String,
  discord: String,
  timezone: Number,
  rank: Number,
  admin: Boolean,
  roles: [
    {
      tourney: String,
      role: String,
    },
  ],
  stats: [
    {
      tourney: String,
      seedName: String,
      seedNum: Number,
      group: String,
      regTime: Date,
    },
  ],
  tournies: [String], // map from tourney code to list of roles
});

export { UserTourneyStats, IUser };
export default model<IUser>("User", UserSchema);
