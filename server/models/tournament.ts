import { Schema, model } from "mongoose";

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
});

export { TourneyStage, ITournament };
export default model<ITournament>("Tournament", Tournament);
