import { Schema, model } from "mongoose";

interface ITourneyMap {
  mapId: number;
  mod: "NM" | "HD" | "HR" | "DT" | "FM" | "HT" | "HDHR" | "EZ" | "CV" | "EX" | "TB";
  index: number;
  title: string;
  artist: string;
  creator: string;
  pooler: string;
  diff: string;
  bpm: number;
  sr: number;
  od: number;
  hp: number;
  length: string;
  image: string;
  tourney: string;
  stage: string;
  customMap: boolean;
  customSong: boolean;
}

const TourneyMapSchema = new Schema<ITourneyMap>({
  mapId: Number,
  mod: { type: String, enum: ["NM", "HD", "HR", "DT", "FM", "HT", "HDHR", "EZ", "CV", "EX", "TB"] },
  index: Number,
  title: String,
  artist: String,
  creator: String,
  pooler: String,
  diff: String,
  bpm: Number,
  sr: Number,
  od: Number,
  hp: Number,
  length: String,
  image: String,
  tourney: String,
  stage: String,
  customMap: Boolean,
  customSong: Boolean,
});

export { ITourneyMap };
export default model<ITourneyMap>("Map", TourneyMapSchema);
