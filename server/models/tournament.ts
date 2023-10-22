import { Schema, model } from "mongoose";
import { GameMode } from "../types";

interface TourneyStage {
  name: string;
  poolVisible: boolean;
  mappack: string;
  statsVisible: boolean;
}

interface ITournament {
  code: string;
  registrationOpen: boolean;
  teams: boolean;
  minTeamSize: number;
  maxTeamSize: number;
  stages: TourneyStage[];
  rankMin: number;
  rankMax: number;
  countries: string[];
  requiredCountries: string[];
  flags: string[];
  lobbyMaxSignups: number;
  blacklist: number[];
  discordServerId: string;
  mode: GameMode;
}

const Tournament = new Schema<ITournament>({
  code: String,
  registrationOpen: Boolean,
  teams: Boolean,
  minTeamSize: Number,
  maxTeamSize: Number,
  stages: [
    {
      name: String,
      poolVisible: Boolean,
      mappack: String,
      statsVisible: Boolean,
    },
  ],
  rankMin: Number,
  rankMax: Number,
  countries: [String],
  requiredCountries: [String],
  flags: [String],
  lobbyMaxSignups: Number,
  blacklist: [Number],
  discordServerId: String,
  mode: String,
});

export { TourneyStage, ITournament };
export default model<ITournament>("Tournament", Tournament);
