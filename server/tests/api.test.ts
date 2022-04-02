import request from "supertest";
import { app } from "../server";
import { setup, teardown } from "./test-util";

beforeAll(setup);
afterAll(teardown);

describe("Basic api functions", () => {
  test("GET /api/whoami when logged out", async () => {
    const res = await request(app).get("/api/whoami");
    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual({});
  });
});
