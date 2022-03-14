import { UserRoles } from "./UserRoles";
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
    return new UserAuthWithContext(this, context);
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

export class UserAuthWithContext {
  /**
   * @type {UserAuth}
   */
  _userAuth;

  /**
   * @type {PermissionContext}
   */
  _context;

  /**
   * @type {User}
   */
  _user

  /**
   * @param {UserAuth} userAuth 
   * @param {PermissionContext} context 
   */
  constructor(userAuth, context) {
    this._userAuth = userAuth;
    this._context = context;
    this._user = userAuth.getUser();
  }

  /**
   * @param {string} role 
   */
  hasRole(role) {
    return this._context.hasRole(this._user, role);
  }

  /**
   * @param {string[]} roles 
   * @returns {boolean}
   */
  hasAllRoles(roles) {
    // How do we handle Host and Dev here?

    // Admin has access to everything
    if (this._user.admin) return true;

    return roles.every(role => {
      return this.hasRole(role);
    });
  }

  /**
   * @param {string[]} roles 
   * @returns {boolean}
   */
  hasAnyRole(roles) {
    // Host and developers have access to everything(?)
    const allowedRoles = [UserRoles.Host, UserRoles.Developer, ...roles];

    // Admin has access to everything
    if (this._user.admin) return true;

    allowedRoles.some(role => {
      return this.hasRole(role);
    });
  }
}