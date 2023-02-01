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
  maxTeamSize: number;
  stages: TourneyStage[];
  rankMin: number;
  rankMax: number;
  countries: string[];
  flags: string[];
  lobbyMaxSignups: number;
}

const Tournament = new Schema<ITournament>({
  code: String,
  registrationOpen: Boolean,
  teams: Boolean,
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
  flags: [String],
  lobbyMaxSignups: Number,
});

export { TourneyStage, ITournament };
export default model<ITournament>("Tournament", Tournament);
