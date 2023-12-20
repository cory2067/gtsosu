// These models are copied from backend. Should these be shared between
// frontend and backend?

interface UserTourneyStats {
  tourney: string;
  seedName: string;
  seedNum: number;
  group: string;
  regTime: Date;
}

export interface User {
  _id: any;
  username: string;
  userid: string;
  country: string;
  avatar: string;
  discord: string;
  timezone: number;
  rank: number;
  admin: boolean;
  roles: { tourney: string; role: string }[];
  stats: UserTourneyStats[];
  tournies: string[];
  donations: number;
  cardImage: string;
  discordId: string;
}
