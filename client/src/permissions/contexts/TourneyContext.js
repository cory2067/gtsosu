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
   * @param {string[]} roles 
   * @returns {boolean}
   */
  hasRole(user, roles) {
    return (
      user.username &&
      user.roles.some((r) => r.tourney === this._tourney && roles.includes(r.role))
    );
  }
}