import { TeamContext } from "./TeamContext";

/**
 * implements PermissionContext
 */
export class MatchContext {
  /**
   * @type {Match}
   */
  _match;

  /**
   * @type {number | undefined}
   */
  _playerNo;

  /**
   * @type {Map<string, Team>}
   */
  _teams;

  hasRoles = undefined;

  /**
   * @param {Match} match 
   * @param {number | undefined} playerNo If undefined, this will check for both teams/players, and vice versa
   * @param {Map<string, Team> | Team[]} teams Teams data, leave undefined in the case of individual tournies
   */
  constructor(match, playerNo, teams) {
    this._match = match;
    this._playerNo = playerNo;
    if (Array.isArray(teams)) {
      this._teams = new Map();
      for (let i = 0, n = teams.length; i < n; ++i) {
        this._teams.set(teams[i].name, teams[i]);
      }
    } else {
      this._teams = teams;
    }

    if (this._teams) {
      this.hasRoles = this.hasRolesTeam;
    } else {
      this.hasRoles = this.hasRolesIndividual;
    }
  }

  /**
   * hasRoles for individual tournies
   * 
   * @param {User} user 
   * @param {string[]} roles 
   * @returns {boolean}
   */
  hasRolesIndividual(user, roles) {
    for (let i = 0, n = roles.length; i < n; ++i) {
      switch (roles[i]) {
        case UserRoles.Captain: {
          if (user.username === this._match.players[0].username) {
            return true;
          }
        }
        case UserRoles.Player: {
          if (this._match.players.some((player) => player.username === user.username)) {
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * hasRoles for team tournies
   * 
   * @param {User} user 
   * @param {string[]} roles 
   * @returns {boolean}
   */
  hasRolesTeam(user, roles) {
    if (this._playerNo) {
      const team = this.getTeam(this._playerNo);
      return new TeamContext(team).hasRoles(user, roles);
    } else {
      const allTeams = [this.getTeam(1), this.getTeam(2)];
      return allTeams.some((team) => new TeamContext(team).hasRoles(user, roles));
    }
  }

  getTeam(playerNo) {
    return this._teams?.get(this._match[`player${playerNo}`]);
  }
}