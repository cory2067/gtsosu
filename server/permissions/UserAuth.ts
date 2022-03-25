import { textChangeRangeIsUnchanged } from "typescript";
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

  // Do not access these directly -- use hasSuperRole()
  private _superRoleLoaded: boolean = false;
  private _hasSuperRole: boolean = false;

  constructor(user: IUser | undefined, context: PermissionContext) {
    super(user);
    this.context = context;
  }

  private async hasSuperRole() {
    const user = this.user;
    if (!user) return false;
    if (user.admin) return true;
    if (this._superRoleLoaded) return this._hasSuperRole;

    this._hasSuperRole = await Promise.all(
      SUPER_ROLES.map((role) => this.context.hasRole(user, role))
    ).then((results) => results.some((result) => result));

    this._superRoleLoaded = true;
    return this._hasSuperRole;
  }

  public async hasRole(role: UserRole) {
    if (!this.user) return false;
    if (await this.hasSuperRole()) return true;

    return this.context.hasRole(this.user, role);
  }

  public async hasAllRoles(roles: UserRole[]) {
    if (!this.user) return false;
    if (await this.hasSuperRole()) return true;

    for (const role of roles) {
      if (!(await this.context.hasRole(this.user, role))) return false;
    }
    return true;
  }

  public async hasAnyRole(roles: UserRole[]) {
    if (!this.user) return false;
    if (await this.hasSuperRole()) return true;

    for (const role of roles) {
      if (await this.context.hasRole(this.user, role)) return true;
    }
    return false;
  }
}
