import { Schema, model } from "mongoose";

interface IMatch {
  player1: string;
  player2: string;
  warmup1: string;
  warmup2: string;
  code: string;
  time: Date;
  score1: number;
  score2: number;
  link: string;
  referee: string;
  streamer: string;
  commentators: string[];
  tourney: string;
  stage: string;
}

// -1 for forfeit, -2 for no results yet
const MatchSchema = new Schema<IMatch>({
  // can be player names or team names
  player1: String,
  player2: String,
  warmup1: String,
  warmup2: String,
  code: String,
  time: Date,
  score1: { type: Number, default: -2 },
  score2: { type: Number, default: -2 },
  link: String,
  referee: String,
  streamer: String,
  commentators: [String],
  tourney: String,
  stage: String,
});

export { IMatch };
export default model<IMatch>("Match", MatchSchema);
