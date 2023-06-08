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
  Mapsetter = "Mapsetter",
  AllStarMapSetter = "All-Star Mapsetter",
  HeadPooler = "Head Pooler",
  Showcase = "Showcase",
  Playtester = "Playtester",
}

// The managerial roles that osu! officially considers as "staff"
export const managementRoles = [
  UserRole.Admin,
  UserRole.Host,
  UserRole.Referee,
  UserRole.Mapsetter,
  UserRole.AllStarMapSetter,
  UserRole.HeadPooler,
  UserRole.Mapper,
  UserRole.Developer,
  UserRole.Showcase,
  UserRole.Playtester,
];
