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
  hasRoles(user, roles) {
    for (let i = 0, n = roles.length; i < n; ++i) {
      switch (roles) {
        case UserRoles.Captain: {
          if (user.username === this._team.players[0].username) {
            return true;
          }
        }
        case UserRoles.Player: {
          if (this._team.players.some((player) => player.username === user.username)) {
            return true;
          }
        }
      }
    }

    return false;
  }
}