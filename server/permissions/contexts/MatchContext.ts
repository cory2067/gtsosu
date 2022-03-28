import { PermissionContext } from "./context";
import { IMatch } from "../../models/match";
import Tournament, { ITournament } from "../../models/tournament";
import { IUser } from "../../models/user";
import Team, { ITeam, PopulatedTeam } from "../../models/team";
import { UserRole } from "../UserRole";
import { TourneyContext } from "./TourneyContext";
import { TeamContext } from "./TeamContext";
import { Populate } from "../../types";
import { getPlayerName } from "../../util";
import assert from "assert";

export type MatchContextParams = {
  match: IMatch;
  /** If undefined, this will check for both teams/players */
  playerNo?: 1 | 2;
  /** Teams data, leave undefined in the case of individual tourneys */
  teams?: { [team: string]: Populate<ITeam, PopulatedTeam> };
};

export class MatchContext implements PermissionContext {
  private match: IMatch;
  private teams?: { [team: string]: Populate<ITeam, PopulatedTeam> };
  private playerNo?: 1 | 2;
  private tourneyContext: TourneyContext;

  constructor({ match, playerNo, teams }: MatchContextParams) {
    this.match = match;
    this.teams = teams;
    this.playerNo = playerNo;
    this.tourneyContext = new TourneyContext(match.tourney);
  }

  public hasRole(user: IUser, role: UserRole) {
    return !!this.teams ? this.hasRoleTeam(user, role) : this.hasRoleIndividual(user, role);
  }

  private hasRoleIndividual(user: IUser, role: UserRole) {
    assert(!this.teams);
    switch (role) {
      case UserRole.Captain:
      case UserRole.Player:
        if (this.playerNo) {
          return getPlayerName(this.match, this.playerNo) === user.username;
        } else {
          return this.match.player1 === user.username || this.match.player2 === user.username;
        }
      default:
        return this.tourneyContext.hasRole(user, role);
    }
  }

  private hasRoleTeam(user: IUser, role: UserRole) {
    assert(this.teams);
    switch (role) {
      case UserRole.Player:
      case UserRole.Captain:
        if (this.playerNo) {
          const team = this.getTeam(this.playerNo);
          if (!team) return false;
          return new TeamContext(team).hasRole(user, role);
        } else {
          const allTeams = [this.getTeam(1), this.getTeam(2)];
          return allTeams.some((team) => team && new TeamContext(team).hasRole(user, role));
        }
      default:
        return this.tourneyContext.hasRole(user, role);
    }
  }

  private getTeam(playerNo: 1 | 2) {
    if (this.teams) {
      return this.teams[getPlayerName(this.match, playerNo)];
    }
    return null;
  }
}
