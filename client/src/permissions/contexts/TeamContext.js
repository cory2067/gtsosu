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
   * @param {string[]} roles
   * @returns {boolean}
   */
  hasRole(user, roles) {
    for (let i = 0, n = roles.length; i < n; ++i) {
      switch (roles[i]) {
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
    }

    return false;
  }
}