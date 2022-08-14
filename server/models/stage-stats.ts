import { Schema, model } from "mongoose";

interface MapScores {
  mapId: number;
  playerScores: { userId: number; score: number }[];
  teamScores: { teamName: string; score: number }[];
}

interface IStageStats {
  tourney: string;
  stage: string;
  maps: MapScores[];
  seedSize: number;
}

const StageStatsSchema = new Schema<IStageStats>({
  tourney: String,
  stage: String,
  maps: [
    {
      mapId: Number,
      playerScores: [{ userId: Number, score: Number }],
      teamScores: [{ teamName: String, score: Number }],
    },
  ],
  seedSize: Number,
});

export { MapScores, IStageStats };
export default model<IStageStats>("StageStats", StageStatsSchema);
