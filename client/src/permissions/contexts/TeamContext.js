import { UserRole } from "../UserRole";

export class TeamContext {
  /**
   * @type {Team}
   */
  _team;

  constructor(team) {
    this._team = team;
  }

  /**
   * @param {User} user
   * @param {string} role
   * @returns {boolean}
   */
  hasRole(user, role) {
    switch (role) {
      case UserRole.Captain:
        if (user.username === this._team.players[0].username) {
          return true;
        }
        break;
      case UserRole.Player:
        if (this._team.players.some((player) => player.username === user.username)) {
          return true;
        }
        break;
    }

    return false;
  }
}