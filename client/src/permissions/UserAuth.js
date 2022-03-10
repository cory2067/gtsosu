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
   * @returns {UserAuthWithContext}
   */
  forMatch(match) {
    return this.withContext(new MatchContext(match));
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
   * @param {string[]} roles 
   * @returns {boolean}
   */
  hasRole(roles) {
    if (!this._context) {
      throw new Error("Permission context not set");
    }

    // Admin has access to everything
    if (this._user.admin) return true;

    // Host and developers have access to everything(?)
    return this._context.hasRole(this._user, [UserRoles.Host, UserRoles.Developer, ...roles]);
  }
}