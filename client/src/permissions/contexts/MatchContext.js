import { UserRole } from "../UserRole";
import { TeamContext } from "./TeamContext";
import { TourneyContext } from "./TourneyContext";

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

  /**
   * @type {TourneyContext}
   *
   * For forwarding non player/captain roles to tourney context
   */
  _tourneyContext;

  hasRole = undefined;

  /**
   * @param {Match} match
   * @param {number | undefined} playerNo If undefined, this will check for both teams/players, and vice versa
   * @param {Map<string, Team> | Team[]} teams Teams data, leave undefined in the case of individual tournies
   */
  constructor(match, playerNo, teams) {
    this._match = match;
    this._tourneyContext = new TourneyContext(match.tourney);
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
   * @param {string} role
   * @returns {boolean}
   */
  hasRoleIndividual(user, role) {
    switch (role) {
      // For individual tournies captain and player means the same thing
      case UserRole.Captain:
      case UserRole.Player:
        if (this._playerNo) {
          return this._match[`player${this._playerNo}`] === user.username;
        } else {
          return this._match.player1 === user.username || this._match.player2 === user.username;
        }
      default:
        return this._tourneyContext.hasRole(user, role);
    }
  }

  /**
   * hasRole for team tournies
   *
   * @param {User} user
   * @param {string} role
   * @returns {boolean}
   */
  hasRoleTeam(user, role) {
    switch (role) {
      case UserRole.Player:
      case UserRole.Captain:
        if (this._playerNo) {
          const team = this.getTeam(this._playerNo);
          if (!team) return false;
          return new TeamContext(team).hasRole(user, role);
        } else {
          const allTeams = [this.getTeam(1), this.getTeam(2)];
          return allTeams.some((team) => new TeamContext(team).hasRole(user, role));
        }
      default:
        return this._tourneyContext.hasRole(user, role);
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
