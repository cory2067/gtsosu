export enum UserRole {
  Admin = "Admin",
  Host = "Host",
  Player = "Player",
  Captain = "Captain",
  Referee = "Referee",
  Streamer = "Streamer",
  Commentator = "Commentator",
  Mapper = "Mapper",
  Developer = "Developer",
  Mappooler = "Mappooler",
  AllStarMappooler = "All-Star Mappooler",
  HeadPooler = "Head Pooler",
  Showcase = "Showcase",
  Playtester = "Playtester",
}

// The managerial roles that osu! officially considers as "staff"
export const managementRoles = [
  UserRole.Admin,
  UserRole.Host,
  UserRole.Referee,
  UserRole.Mappooler,
  UserRole.AllStarMappooler,
  UserRole.HeadPooler,
  UserRole.Mapper,
  UserRole.Developer,
  UserRole.Showcase,
  UserRole.Playtester,
];
