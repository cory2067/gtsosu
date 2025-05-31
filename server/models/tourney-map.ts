import { Schema, model } from "mongoose";
import { GameMode } from "../types";

interface ITourneyMap {
  mapId: number;
  mod: "NM" | "HD" | "HR" | "DT" | "FM" | "HT" | "HDHR" | "EZ" | "FL" | "CV" | "EX" | "TB";
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
  ar?: number; // Not used for taiko
  cs?: number; // Not used for taiko
  length: string;
  image: string;
  tourney: string;
  stage: string;
  customMap: boolean;
  customSong: boolean;
  mode?: GameMode;
}

const TourneyMapSchema = new Schema<ITourneyMap>({
  mapId: Number,
  mod: {
    type: String,
    enum: ["NM", "HD", "HR", "DT", "FM", "HT", "HDHR", "EZ", "FL", "CV", "EX", "TB"],
  },
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
  ar: Number,
  cs: Number,
  length: String,
  image: String,
  tourney: String,
  stage: String,
  customMap: Boolean,
  customSong: Boolean,
  mode: String,
});

export { ITourneyMap };
export default model<ITourneyMap>("Map", TourneyMapSchema);
