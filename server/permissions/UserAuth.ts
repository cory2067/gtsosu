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
  protected user?: IUser;

  constructor(user?: IUser) {
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
  private superRoleLoaded: boolean = false;
  private userHasSuperRole: boolean = false;

  constructor(user: IUser, context: PermissionContext) {
    super(user);
    this.context = context;
  }

  private async hasSuperRole() {
    if (this.superRoleLoaded && this.userHasSuperRole) return true;
    if (this.user?.admin) {
      this.userHasSuperRole = true;
    } else {
      this.userHasSuperRole = await Promise.all(
        SUPER_ROLES.map((role) => this.context.hasRole(this.user, role))
      ).then((results) => results.some((result) => result));
    }
    return this.userHasSuperRole;
  }

  public async hasRole(role: UserRole) {
    if (!this.user) return false;
    return (await this.hasSuperRole()) || (await this.context.hasRole(this.user, role));
  }

  public async hasAllRoles(roles: UserRole[]) {
    if (await this.hasSuperRole()) return true;
    for (const role of roles) {
      if (!(await this.context.hasRole(this.user, role))) return false;
    }
    return true;
  }

  public async hasAnyRole(roles: UserRole[]) {
    if (await this.hasSuperRole()) return true;
    for (const role of roles) {
      if (await this.context.hasRole(this.user, role)) return true;
    }
    return false;
  }
}
