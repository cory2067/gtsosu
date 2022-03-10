/**
 * implements PermissionContext
 */
export class MatchContext {
  /**
   * @type {string}
   */
  _match;

  /**
   * @type {number | undefined}
   */
  _playerNo;

  /**
   * @param {Match} match 
   * @param {number | undefined} playerNo 
   */
  constructor(match, playerNo) {
    this._match = match;
    this._playerNo = playerNo;
  }

  /**
   * @param {User} user 
   * @param {string[]} roles 
   * @returns {boolean}
   */
  hasRoles(user, roles) {
  }
}