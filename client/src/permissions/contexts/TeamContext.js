import { UserRoles } from "../UserRoles";

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
      case UserRoles.Captain:
        if (user.username === this._team.players[0].username) {
          return true;
        }
        break;
      case UserRoles.Player:
        if (this._team.players.some((player) => player.username === user.username)) {
          return true;
        }
        break;
    }

    return false;
  }
}