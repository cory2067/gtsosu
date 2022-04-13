import { setup, teardown } from "./test-util";
import { IUser } from "../models/user";
import { UserAuth } from "../permissions/UserAuth";
import { UserRole } from "../permissions/UserRole";
import { ITeam, PopulatedTeam } from "../models/team";
import { Populate } from "../types";
import match, { IMatch } from "../models/match";

type createTestUserParams = {
  username?: string,
  tournies?: string[],
  roles?: { tourney: string, role: string }[],
  admin?: boolean
}
function createTestUser(params: createTestUserParams): IUser {
  const roles: { tourney: string, role: string }[] = params.roles || [];
  const tournies = params.tournies || [];

  tournies.forEach((tourney) => {
    roles.push({
      role: UserRole.Player,
      tourney
    });
  });

  return {
    username: params.username || "testUser",
    admin: params.admin || false,
    avatar: "",
    country: "",
    discord: "",
    rank: 1,
    roles,
    stats: [],
    timezone: 0,
    tournies,
    userid: "testUser"
  }
};

function createTestMatch(params: Partial<IMatch>): IMatch {
  return {
    code: "A",
    commentators: [],
    link: "",
    player1: "player1",
    player2: "player2",
    referee: "",
    score1: 0,
    score2: 0,
    stage: "",
    streamer: "",
    time: new Date(),
    tourney: "testTourney",
    warmup1: "",
    warmup2: "",
    ...params
  }
}

function createTestTeam(params: Partial<Populate<ITeam, PopulatedTeam>>) {
  return {
    country: "",
    group: "",
    icon: "",
    name: "team1",
    players: [],
    seedName: "",
    seedNum: 1,
    tourney: "testTourney",
    ...params
  }
}

function createUserRoleSet() {
  const set: Set<UserRole> = new Set();
  for (let item in UserRole) {
    set.add(UserRole[item]);
  }
  return set;
}

test("Admin in global context", () => {
  const userRoles = createUserRoleSet();
  const admin = createTestUser({ admin: true });
  const auth = new UserAuth(admin).forGlobal();
  userRoles.forEach(role => {
    expect(auth.hasRole(role)).toBe(true);
  })
});

test("Player in a tourney", () => {
  const user = createTestUser({ tournies: ["testTourney"] });
  let auth = new UserAuth(user).forTourney("testTourney");
  const userRoleSet = createUserRoleSet();
  userRoleSet.delete(UserRole.Player);
  expect(auth.hasRole(UserRole.Player)).toBe(true);
  userRoleSet.forEach(role => {
    expect(auth.hasRole(role)).toBe(false);
  });
});

test("hasAnyRole in a tourney", () => {
  const user = createTestUser({ tournies: ["testTourney"] });
  let auth = new UserAuth(user).forTourney("testTourney");
  expect(auth.hasAnyRole([UserRole.Player, UserRole.Commentator])).toBe(true);
  expect(auth.hasAnyRole([UserRole.Commentator, UserRole.HeadPooler])).toBe(false);
  expect(auth.hasAnyRole([])).toBe(false);
});

test("hasAllRoles in a tourney", () => {
  const user = createTestUser({
    roles: [{
      tourney: "testTourney",
      role: UserRole.Commentator
    }, {
      tourney: "testTourney",
      role: UserRole.Mapper
    }, {
      tourney: "testTourney",
      role: UserRole.Referee
    }]
  });
  const auth = new UserAuth(user).forTourney("testTourney");
  expect(auth.hasAllRoles([UserRole.Commentator, UserRole.Mapper, UserRole.Referee])).toBe(true);
  expect(auth.hasAllRoles([UserRole.Commentator, UserRole.Referee])).toBe(true);
  expect(auth.hasAllRoles([UserRole.Commentator, UserRole.Streamer])).toBe(false);
  expect(auth.hasAllRoles([])).toBe(true);
});

test("Super role in a tourney", () => {
  const userRoleSet = Array.from(createUserRoleSet());
  function testUser(user: IUser, tourney: string) {
    let auth = new UserAuth(admin).forTourney(tourney);
    userRoleSet.forEach(role => {
      expect(auth.hasRole(role)).toBe(true);
    });
    expect(auth.hasAllRoles(userRoleSet)).toBe(true);
    expect(auth.hasAnyRole(userRoleSet)).toBe(true);
    expect(auth.hasAllRoles([])).toBe(true);
    expect(auth.hasAnyRole([])).toBe(true);
  }

  const admin = createTestUser({ admin: true });
  testUser(admin, "testTourney");

  const host = createTestUser({
    roles: [{
      tourney: "testTourney",
      role: UserRole.Host
    }]
  });
  testUser(host, "testTourney");
  // Not testing dev since it's the same logic for host
});

test("Player/Captain in a team match", () => {
  // Tests both the correct and wrong team
  function testInTeam(user: IUser, match: IMatch, teamMap: { [k: string]: any }, playerNo: 1 | 2, role: UserRole, expectTrue: boolean = true) {
    const auth1 = new UserAuth(user).forMatch({
      match, teams: teamMap, playerNo
    });
    expect(auth1.hasRole(role)).toBe(expectTrue);
    const auth2 = new UserAuth(user).forMatch({
      match, teams: teamMap, playerNo: playerNo == 1 ? 2 : 1
    })
    expect(auth2.hasRole(role)).toBe(false);
  }

  function testInMatch(user: IUser, match: IMatch, teamMap: { [k: string]: any }, role: UserRole, expectTrue: boolean = true) {
    const auth = new UserAuth(user).forMatch({
      match, teams: teamMap
    });
    expect(auth.hasRole(role)).toBe(expectTrue);
  }

  const testUsers1 = [createTestUser({ username: "testUser1" }), createTestUser({ username: "testUser2" })];
  const testUsers2 = [createTestUser({ username: "testUser3" }), createTestUser({ username: "testUser4" })];
  const testTeam1 = createTestTeam({
    name: "testTeam1",
    players: testUsers1
  });
  const testTeam2 = createTestTeam({
    name: "testTeam2",
    players: testUsers2
  });
  const teamMap = { testTeam1, testTeam2 }
  const testMatch = createTestMatch({
    player1: testTeam1.name,
    player2: testTeam2.name
  });

  // Test users
  testUsers1.forEach(user => {
    testInTeam(user, testMatch, teamMap, 1, UserRole.Player);
    testInMatch(user, testMatch, teamMap, UserRole.Player);
  })
  testUsers2.forEach(user => {
    testInTeam(user, testMatch, teamMap, 2, UserRole.Player);
    testInMatch(user, testMatch, teamMap, UserRole.Player);
  });

  // Test captains
  testInTeam(testUsers1[0], testMatch, teamMap, 1, UserRole.Captain);
  testInMatch(testUsers1[0], testMatch, teamMap, UserRole.Captain);
  testInTeam(testUsers2[0], testMatch, teamMap, 2, UserRole.Captain);
  testInMatch(testUsers2[0], testMatch, teamMap, UserRole.Captain);

  // Test user not in match
  const notPlayer = createTestUser({
    username: "notPlayer"
  });
  testInTeam(notPlayer, testMatch, teamMap, 1, UserRole.Player, false);
  testInTeam(notPlayer, testMatch, teamMap, 2, UserRole.Player, false);
  testInTeam(notPlayer, testMatch, teamMap, 1, UserRole.Captain, false);
  testInTeam(notPlayer, testMatch, teamMap, 2, UserRole.Captain, false);
  testInMatch(notPlayer, testMatch, teamMap, UserRole.Player, false);
  testInMatch(notPlayer, testMatch, teamMap, UserRole.Captain, false);
});

test("Player in an individual match", () => {
  // Should we test for captain and expect users to be their own captain too?

  /** Tests both the correct and wrong player no. */
  function testPlayerNo(user: IUser, match: IMatch, playerNo: 1 | 2, expectTrue: boolean = true) {
    const auth1 = new UserAuth(user).forMatch({ match, playerNo });
    expect(auth1.hasRole(UserRole.Player)).toBe(expectTrue);
    const auth2 = new UserAuth(user).forMatch({ match, playerNo: playerNo == 1 ? 2 : 1 });
    expect(auth2.hasRole(UserRole.Player)).toBe(false);
  }

  function testInMatch(user: IUser, match: IMatch, expectTrue: boolean = true) {
    const auth = new UserAuth(user).forMatch({ match });
    expect(auth.hasRole(UserRole.Player)).toBe(expectTrue);
  }

  const testUser1 = createTestUser({
    username: "testUser1"
  });
  const testUser2 = createTestUser({
    username: "testUser2"
  });
  const testMatch = createTestMatch({
    player1: testUser1.username,
    player2: testUser2.username
  });

  testPlayerNo(testUser1, testMatch, 1, true);
  testPlayerNo(testUser2, testMatch, 2, true);
  testInMatch(testUser1, testMatch, true);
  testInMatch(testUser2, testMatch, true);

  // Test user not in match
  const notPlayer = createTestUser({
    username: "notPlayer"
  });
  testPlayerNo(notPlayer, testMatch, 1, false);
  testPlayerNo(notPlayer, testMatch, 2, false);
  testInMatch(notPlayer, testMatch, false);
});