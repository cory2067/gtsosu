import { Schema, model } from "mongoose";

interface IQualifiersLobby {
  time: Date;
  referee: string;
  players: string[];
  link: string;
  tourney: string;
}

const QualifiersLobbySchema = new Schema<IQualifiersLobby>({
  time: Date,
  referee: String,
  players: [String],
  link: String,
  tourney: String,
});

export { IQualifiersLobby };
export default model<IQualifiersLobby>("QualifiersLobby", QualifiersLobbySchema);
