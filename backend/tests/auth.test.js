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

test("POST /api/auth/register should reject duplicate email", async () => {
  const email = `duplicate${Date.now()}@example.com`;

  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Test User",
      email,
      password: "Password123",
    });

  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Test User",
      email,
      password: "Password123",
    });

  expect(res.statusCode).toBe(400);
  expect(res.body.message).toBe("User already exists");
});

test("POST /api/auth/login should login with correct credentials", async () => {
  const email = `login${Date.now()}@example.com`;
  const password = "Password123";

  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Login User",
      email,
      password,
    });

  const res = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    });

  expect(res.statusCode).toBe(200);
  expect(res.body.message).toBe("Login successful");
  expect(res.body.accessToken).toBeDefined();
  expect(res.body.refreshToken).toBeDefined();
});

test("POST /api/auth/login should reject wrong password", async () => {
  const email = `wrongpass${Date.now()}@example.com`;

  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Wrong Password User",
      email,
      password: "Password123",
    });

  const res = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password: "WrongPassword123",
    });

  expect(res.statusCode).toBe(400);
  expect(res.body.message).toBe("Invalid password");
});

test("POST /api/auth/logout should logout successfully", async () => {
  const email = `logout${Date.now()}@example.com`;
  const password = "Password123";

  // Register the user
  await request(app)
    .post("/api/auth/register")
    .send({
      name: "Logout User",
      email,
      password,
    });

  // Login to get a refresh token
  const loginRes = await request(app)
    .post("/api/auth/login")
    .send({
      email,
      password,
    });

  const res = await request(app)
    .post("/api/auth/logout")
    .send({
      refreshToken: loginRes.body.refreshToken,
    });

  expect(res.statusCode).toBe(200);
  expect(res.body.message).toBe("Logged out successfully");
});
