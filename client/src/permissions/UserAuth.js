import { UserRole } from "./UserRole";
import "./typedefs"
import { GlobalContext } from "./contexts/GlobalContext";
import { TourneyContext } from "./contexts/TourneyContext";
import { MatchContext } from "./contexts/MatchContext";

export class UserAuth {
  /**
   * @type {User}
   */
  _user;

  /**
   * @param {User} user
   */
  constructor(user) {
    this._user = user;
  }

  /**
   * @returns {User}
   */
  getUser() {
    return this._user;
  }

  /**
   * @param {string} context 
   * @returns 
   */
  withContext(context) {
    return new UserAuthWithContext(this._user, context);
  }

  forGlobal() {
    return this.withContext(new GlobalContext());
  }

  /**
   * @param {string} tourney 
   * @returns {UserAuthWithContext}
   */
  forTourney(tourney) {
    return this.withContext(new TourneyContext(tourney));
  }

  /**
   * @param {Match} match 
   * @param {number | undefined} playerNo
   * @param {Map<string, Team> | Team[]} teams
   * @returns {UserAuthWithContext}
   */
  forMatch(match, playerNo, teams) {
    return this.withContext(new MatchContext(match, playerNo, teams));
  }

  /**
   * @param {Team} match 
   * @returns {UserAuthWithContext}
   */
  forTeam(team) {
    return this.withContext(new TeamContext(team));
  }
}

/**
 * Tournament roles that override checks and return true for all permissions
 */
const SUPER_ROLES = [UserRole.Host, UserRole.Developer];

export class UserAuthWithContext extends UserAuth {
  /**
   * @type {PermissionContext}
   */
  _context;

  /**
   * @type {boolean}
   */
  _hasSuperRole = false;

  /**
   * @param {User} user 
   * @param {PermissionContext} context 
   */
  constructor(user, context) {
    super(user);
    this._context = context;
    this._hasSuperRole = this._user.admin || SUPER_ROLES.some(role => this._context.hasRole(this._user, role));
  }

  /**
   * @param {string} role 
   */
  hasRole(role) {
    return this._hasSuperRole || this._context.hasRole(this._user, role);
  }

  /**
   * @param {string[]} roles 
   * @returns {boolean}
   */
  hasAllRoles(roles) {
    return this._hasSuperRole || roles.every(role => {
      return this.hasRole(role);
    });
  }

  /**
   * @param {string[]} roles 
   * @returns {boolean}
   */
  hasAnyRole(roles) {
    return this._hasSuperRole || roles.some(role => {
      return this.hasRole(role);
    });
  }
}