import { PermissionContext } from "./context";
import { IMatch } from "../../models/match";
import Tournament, { ITournament } from "../../models/tournament";
import { IUser } from "../../models/user";
import Team, { ITeam, PopulatedTeam } from "../../models/team";
import { UserRole } from "../UserRole";
import { TourneyContext } from "./TourneyContext";
import { TeamContext } from "./TeamContext";
import { Populate } from "../../types";

export type MatchContextParams = {
  tourney?: ITournament;
  teams?: { [team: string]: Populate<ITeam, PopulatedTeam> };
  playerNo?: 1 | 2;
};

export class MatchContext implements PermissionContext {
  private match: IMatch;
  private teamCache: { [team: string]: Populate<ITeam, PopulatedTeam> } = {};
  private playerNo?: 1 | 2;
  /**
   * Do not use this directly, use getTourney instead.
   */
  private tourneyCache?: ITournament;
  private tourneyContext: TourneyContext;

  constructor(match: IMatch, params: MatchContextParams) {
    this.match = match;
    this.tourneyCache = params.tourney;
    this.teamCache = params.teams || {};
    this.playerNo = params.playerNo;
  }

  public async hasRole(user: IUser, role: UserRole) {
    const tourney = await this.getTourney();
    return tourney.teams ? this.hasRoleTeam(user, role) : this.hasRoleIndividual(user, role);
  }

  private async hasRoleIndividual(user: IUser, role: UserRole) {
    switch (role) {
      case UserRole.Captain:
      case UserRole.Player:
        if (this.playerNo) {
          return this.match[`player${this.playerNo}`] === user.username;
        } else {
          return this.match.player1 === user.username || this.match.player2 === user.username;
        }
      default:
        return this.tourneyContext.hasRole(user, role);
    }
  }

  private async hasRoleTeam(user: IUser, role: UserRole) {
    switch (role) {
      case UserRole.Player:
      case UserRole.Captain:
        if (this.playerNo) {
          const team = await this.getTeam(this.playerNo);
          if (!team) return false;
          return new TeamContext(team).hasRole(user, role);
        }
      default:
        return this.tourneyContext.hasRole(user, role);
    }
  }

  private async getTeam(playerNo: 1 | 2) {
    const team = this.match[`player1${playerNo}`];

    if (!this.teamCache[team]) {
      this.teamCache[team] = await Team.findOne({ name: team }, null, {
        populate: ["players"],
      });
    }
    return this.teamCache[team];
  }

  /**
   * Returns the tourney for this match, fetching it if necessary.
   */
  private async getTourney() {
    if (!this.tourneyCache) {
      this.tourneyCache = await Tournament.findOne({ code: this.match.tourney });
      this.tourneyContext = new TourneyContext(this.match.tourney);
    }

    return this.tourneyCache!;
  }
}
