import { IUser } from "../../models/user";
import { UserRole } from "../UserRole";
import { PermissionContext } from "./context";

export class TourneyContext implements PermissionContext {
  private tourney: string;

  constructor(tourney) {
    this.tourney = tourney;
  }

  public async hasRole(user: IUser, role: UserRole) {
    return user.roles.some((r) => r.tourney === this.tourney && r.role === role.toString());
  }
}
