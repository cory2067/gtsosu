import { setup, teardown } from "./test-util";
import { IUser } from "../models/user";
import { UserAuth } from "../permissions/UserAuth";
import { UserRole } from "../permissions/UserRole";

beforeAll(setup);
afterAll(teardown);

type createTestUserParams = {
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
    username: "testUser",
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

function createUserRoleSet() {
  const set: Set<UserRole> = new Set();
  for (let item in UserRole) {
    set.add(UserRole[item]);
  }
  return set;
}

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