import request from "supertest";
import { app } from "../server";
import { setup, teardown, loginMockUser, logoutMockUser } from "./test-util";
import User, { IUser } from "../models/user";

beforeAll(setup);
afterAll(teardown);

describe("Basic api functions", () => {
  test("GET /api/whoami when logged in", async () => {
    const user = new User({ username: "Cychloryn" });
    loginMockUser(user);

    const res = await request(app).get("/api/whoami");
    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual(JSON.parse(JSON.stringify(user)));
  });

  test("GET /api/whoami when logged out", async () => {
    logoutMockUser();
    const res = await request(app).get("/api/whoami");
    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual({});
  });
});
