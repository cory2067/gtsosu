import { UserRoles } from "../roles";

/**
 * implements PermissionContext
 */
export class TourneyContext {
  /**
   * @type {string}
   */
  _tourney;

  /**
   * @param {string} tourney 
   */
  constructor(tourney) {
    this._tourney = tourney;
  }

  /**
   * @param {User} user 
   * @param {string} roles 
   * @returns 
   */
  hasRoles(user, roles) {
    const userRoles = [UserRoles.Host, UserRoles.Developer, ...roles];
    return (
      user.username &&
      user.roles.some((r) => r.tourney === tourney && userRoles.includes(r.role))
    );
  }
}