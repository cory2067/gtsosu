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
   * @param {string} role
   * @returns {boolean}
   */
  hasRole(user, role) {
    return (
      user.username &&
      user.roles.some((r) => r.tourney === this._tourney && role == r.role)
    );
  }
}