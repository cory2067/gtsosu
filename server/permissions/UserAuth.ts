import { IMatch } from "../models/match";
import { ITeam, PopulatedTeam } from "../models/team";
import { IUser } from "../models/user";
import { Populate } from "../types";
import { PermissionContext } from "./contexts/context";
import { GlobalContext } from "./contexts/GlobalContext";
import { MatchContext, MatchContextParams } from "./contexts/MatchContext";
import { TeamContext } from "./contexts/TeamContext";
import { TourneyContext } from "./contexts/TourneyContext";
import { UserRole } from "./UserRole";

export class UserAuth {
  protected user: IUser | undefined;

  constructor(user: IUser | undefined) {
    this.user = user;
  }

  public getUser() {
    return this.user;
  }

  public withContext(context: PermissionContext) {
    return new UserAuthWithContext(this.user, context);
  }

  public forMatch(params: MatchContextParams) {
    return this.withContext(new MatchContext(params));
  }

  public forTeam(team: Populate<ITeam, PopulatedTeam>) {
    return this.withContext(new TeamContext(team));
  }

  public forTourney(tourney: string) {
    return this.withContext(new TourneyContext(tourney));
  }

  public forGlobal() {
    return this.withContext(new GlobalContext());
  }
}

/**
 * Tournament roles that override checks and return true for all permissions
 */
const SUPER_ROLES = [UserRole.Host, UserRole.Developer];

export class UserAuthWithContext extends UserAuth {
  private context: PermissionContext;
  private hasSuperRole: boolean;

  constructor(user: IUser | undefined, context: PermissionContext) {
    super(user);
    this.context = context;
    this.hasSuperRole =
      !!user && (user.admin || SUPER_ROLES.some((role) => this.context.hasRole(user, role)));
  }

  public hasRole(role: UserRole) {
    if (!this.user) return false;
    if (this.hasSuperRole) return true;

    return this.context.hasRole(this.user, role);
  }

  public hasAllRoles(roles: UserRole[]) {
    if (this.hasSuperRole) return true;
    return roles.every((role) => this.hasRole(role));
  }

  public hasAnyRole(roles: UserRole[]) {
    if (this.hasSuperRole) return true;
    return roles.some((role) => this.hasRole(role));
  }
}
