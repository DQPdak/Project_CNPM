const request = require("supertest");
const express = require("express");
const { connectDB, closeDB, clearDB } = require("./setup/dbSetup");
const authRoutes = require("../src/routes/auth.routes");
const User = require("../src/models/UserModel");
const AuthSession = require("../src/modules/auth/models/AuthSessionModel");
const { hashPassword } = require("../src/modules/auth/utils/password");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use((error, req, res, next) =>
  res.status(error.status || 500).json({
    error: {
      code: error.code || "INTERNAL_SERVER_ERROR",
      message: error.message || "Unexpected error",
    },
  }),
);

jest.setTimeout(120000);

beforeAll(async () => await connectDB());
afterEach(async () => await clearDB());
afterAll(async () => await closeDB());

describe("Authentication API", () => {
  const createUser = async (overrides = {}) =>
    User.create({
      name: "Auth User",
      email: "auth@example.com",
      password: await hashPassword("password123"),
      role: "Mangaka",
      status: "Active",
      ...overrides,
    });

  it("logs in with valid credentials", async () => {
    await createUser();

    const response = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeTruthy();
    expect(response.body.refreshToken).toBeTruthy();
    expect(response.body.user.email).toBe("auth@example.com");

    const sessions = await AuthSession.find();
    expect(sessions).toHaveLength(1);
  });

  it("rejects invalid credentials", async () => {
    await createUser();

    const response = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "wrong-password",
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe("AUTH_INVALID_CREDENTIALS");
  });

  it("rejects suspended accounts", async () => {
    await createUser({ status: "Suspended" });

    const response = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("AUTH_ACCOUNT_SUSPENDED");
  });

  it("returns current user for a valid access token", async () => {
    await createUser();

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe("auth@example.com");
    expect(response.body.user.password).toBeUndefined();
  });

  it("refreshes tokens and revokes the previous refresh token", async () => {
    await createUser();

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const refreshResponse = await request(app).post("/api/auth/refresh").send({
      refreshToken: loginResponse.body.refreshToken,
    });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.accessToken).toBeTruthy();
    expect(refreshResponse.body.refreshToken).toBeTruthy();
    expect(refreshResponse.body.refreshToken).not.toBe(
      loginResponse.body.refreshToken,
    );

    const secondRefreshResponse = await request(app)
      .post("/api/auth/refresh")
      .send({
        refreshToken: loginResponse.body.refreshToken,
      });

    expect(secondRefreshResponse.status).toBe(401);
    expect(secondRefreshResponse.body.error.code).toBe("AUTH_REFRESH_INVALID");
  });

  it("logs out by revoking the refresh token", async () => {
    await createUser();

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const logoutResponse = await request(app).post("/api/auth/logout").send({
      refreshToken: loginResponse.body.refreshToken,
    });

    expect(logoutResponse.status).toBe(200);

    const refreshResponse = await request(app).post("/api/auth/refresh").send({
      refreshToken: loginResponse.body.refreshToken,
    });

    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.error.code).toBe("AUTH_REFRESH_INVALID");
  });
});
