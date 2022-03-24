import { IMatch } from "../models/match";
import { ITeam, PopulatedTeam } from "../models/team";
import { IUser } from "../models/user";
import { Populate } from "../types";
import { PermissionContext } from "./contexts/context";
import { MatchContext, MatchContextParams } from "./contexts/MatchContext";
import { TeamContext } from "./contexts/TeamContext";
import { TourneyContext } from "./contexts/TourneyContext";
import { UserRole } from "./UserRole";

export class UserAuth {
  protected user: IUser;

  constructor(user: IUser) {
    if (!user) {
      throw new Error("User is not defined");
    }
    this.user = user;
  }

  public getUser() {
    return this.user;
  }

  public withContext(context: PermissionContext) {
    return new UserAuthWithContext(this.user, context);
  }

  public forMatch(match: IMatch, params: MatchContextParams) {
    return this.withContext(new MatchContext(match, params));
  }

  public forTeam(team: Populate<ITeam, PopulatedTeam>) {
    return this.withContext(new TeamContext(team));
  }

  public forTourney(tourney: string) {
    return this.withContext(new TourneyContext(tourney));
  }
}

/**
 * Tournament roles that override checks and return true for all permissions
 */
const SUPER_ROLES = [UserRole.Host, UserRole.Developer];

export class UserAuthWithContext extends UserAuth {
  private context: PermissionContext;
  private hasSuperRole: boolean = false;

  constructor(user: IUser, context: PermissionContext) {
    super(user);
    this.context = context;
    this.hasSuperRole =
      this.user.admin || SUPER_ROLES.some((role) => this.context.hasRole(this.user, role));
  }

  public async hasRole(role: UserRole) {
    return this.hasSuperRole || (await this.context.hasRole(this.user, role));
  }

  public async hasAllRoles(roles: UserRole[]) {
    if (this.hasSuperRole) return true;
    for (const role of roles) {
      if (!(await this.context.hasRole(this.user, role))) return false;
    }
    return true;
  }

  public async hasAnyRole(roles: UserRole[]) {
    if (this.hasSuperRole) return true;
    for (const role of roles) {
      if (await this.context.hasRole(this.user, role)) return true;
    }
    return false;
  }
}
