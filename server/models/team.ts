import { Schema, Types, model } from "mongoose";
import { IUser } from "./user";

interface ITeam {
  name: string;
  country: string;
  players: Types.ObjectId[];
  seedName: string;
  seedNum: number;
  group: string;
  tourney: string;
  icon: string;
}

interface PopulatedTeam {
  players: IUser[];
}

// players[0] is the captain
const TeamSchema = new Schema<ITeam>({
  name: String,
  country: String,
  players: [{ type: Schema.Types.ObjectId, ref: "User" }],
  seedName: String,
  seedNum: Number,
  group: String,
  tourney: String,
  icon: String,
});

export { ITeam, PopulatedTeam };
export default model<ITeam>("Team", TeamSchema);
