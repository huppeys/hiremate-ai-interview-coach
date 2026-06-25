const request = require("supertest");
const app = require("../src/index");

describe("Auth API", () => {
  test("POST /api/auth/register should register a new user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Test User",
        email: `test${Date.now()}@example.com`,
        password: "Password123",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });
});