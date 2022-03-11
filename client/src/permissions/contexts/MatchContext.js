import { UserRoles } from "../UserRoles";
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
   * @type {Map<string, Team>} // should probably be {[k: string] => Team} when TS is configured
   */
  _teams;

  hasRole = undefined;

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
      this.hasRole = this.hasRoleTeam;
    } else {
      this.hasRole = this.hasRoleIndividual;
    }
  }

  /**
   * hasRole for individual tournies
   * 
   * @param {User} user 
   * @param {string[]} roles 
   * @returns {boolean}
   */
  hasRoleIndividual(user, roles) {
    for (let i = 0, n = roles.length; i < n; ++i) {
      switch (roles[i]) {
        // For individual tournies captain and player means the same thing
        case UserRoles.Captain:
        case UserRoles.Player:
          if (this._playerNo) {
            if (this._match[`player${this._playerNo}`] === user.username) {
              return true;
            }
          } else {
            if (this._match.player1 === user.username || this._match.player2 === user.username) {
              return true;
            }
          }
          break;
      }
    }

    return false;
  }

  /**
   * hasRole for team tournies
   * 
   * @param {User} user 
   * @param {string[]} roles 
   * @returns {boolean}
   */
  hasRoleTeam(user, roles) {
    if (this._playerNo) {
      const team = this.getTeam(this._playerNo);
      if (!team) return false;
      return new TeamContext(team).hasRole(user, roles);
    } else {
      const allTeams = [this.getTeam(1), this.getTeam(2)];
      return allTeams.some((team) => new TeamContext(team).hasRole(user, roles));
    }
  }

  getTeam(playerNo) {
    if (this._teams) {
      return this._teams[this._match[`player${playerNo}`]];
    } else {
      return undefined;
    }
  }
}