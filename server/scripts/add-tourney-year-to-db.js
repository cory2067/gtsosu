/**
 * Intended as a single-use script to perform a database migration on 4/11/21
 *
 * The 'tourney' field is being changed to include the year of the tournament.
 * This is necessary in order to support different iterations of a tourney across multiple years.
 *
 * e.g. "igts" -> "igts_2020"
 */

require("dotenv").config();
const db = require("../db");

const User = require("../models/user");
const Team = require("../models/team");
const Map = require("../models/tourney-map");
const Tournament = require("../models/tournament");
const Match = require("../models/match");
const QualifiersLobby = require("../models/qualifiers-lobby");

function updateTourney(tourney) {
  if (tourney.includes("cgts")) {
    return `${tourney}_2021`;
  }
  return `${tourney}_2020`;
}

async function main() {
  await db.init();

  const users = await User.find();
  for (const user of users) {
    if (!user.roles.length && !user.stats.length && !user.tournies.length) {
      console.log(`${user.username} has no tournies, skipping`);
      continue;
    }

    for (const role of user.roles) {
      role.tourney = updateTourney(role.tourney);
    }

    for (const stat of user.stats) {
      stat.tourney = updateTourney(stat.tourney);
    }

    user.tournies = user.tournies.map((t) => updateTourney(t));

    console.log(user);
    // await user.save();
  }

  const teams = await Team.find();
  for (const team of teams) {
    team.tourney = updateTourney(team.tourney);
    console.log(team);
    // await team.save();
  }

  const maps = await Map.find();
  for (const map of maps) {
    map.tourney = updateTourney(map.tourney);
    console.log(map);
    // await map.save();
  }

  const tournaments = await Tournament.find();
  for (const tourney of tournaments) {
    tourney.code = updateTourney(tourney.code);
    console.log(tourney);
    // await tourney.save();
  }

  const matches = await Match.find();
  for (const match of matches) {
    match.tourney = updateTourney(match.tourney);
    console.log(match);
    //await match.save();
  }

  const lobbies = await QualifiersLobby.find();
  for (const lobby of lobbies) {
    lobby.tourney = updateTourney(lobby.tourney);
    console.log(lobby);
    // await lobby.save();
  }

  db.getConnection().close();
}

main().then(() => console.log("Done"));
