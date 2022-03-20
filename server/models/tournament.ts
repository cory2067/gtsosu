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
  stages: TourneyStage[];
  rankMin: number;
  rankMax: number;
  countries: string[];
  flags: string[];
}

const Tournament = new Schema<ITournament>({
  code: String,
  registrationOpen: Boolean,
  teams: Boolean,
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
});

export { TourneyStage, ITournament };
export default model<ITournament>("Tournament", Tournament);
