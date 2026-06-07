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

  it("lets admin list users", async () => {
    await createUser({ role: "Admin" });
    await createUser({
      email: "employee@example.com",
      role: "Assistant",
    });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const response = await request(app)
      .get("/api/auth/users")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.users).toHaveLength(2);
    expect(response.body.users[0].password).toBeUndefined();
  });

  it("lets admin create an employee account", async () => {
    await createUser({ role: "Admin" });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const response = await request(app)
      .post("/api/auth/users")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
      .send({
        name: "Assistant User",
        email: "assistant@example.com",
        password: "password456",
        role: "Assistant",
        status: "Active",
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe("assistant@example.com");
    expect(response.body.user.password).toBeUndefined();

    const employeeLogin = await request(app).post("/api/auth/login").send({
      email: "assistant@example.com",
      password: "password456",
    });
    expect(employeeLogin.status).toBe(200);
  });

  it("blocks non-admin users from creating employee accounts", async () => {
    await createUser({ role: "Mangaka" });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const response = await request(app)
      .post("/api/auth/users")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
      .send({
        name: "Assistant User",
        email: "assistant@example.com",
        password: "password456",
        role: "Assistant",
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("AUTHZ_ROLE_DENIED");
  });

  it("rejects duplicate employee email", async () => {
    await createUser({ role: "Admin" });

    const loginResponse = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const response = await request(app)
      .post("/api/auth/users")
      .set("Authorization", `Bearer ${loginResponse.body.accessToken}`)
      .send({
        name: "Duplicate User",
        email: "auth@example.com",
        password: "password456",
        role: "Assistant",
      });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("AUTH_EMAIL_ALREADY_EXISTS");
  });

  it("lets admin reset employee password and revokes existing sessions", async () => {
    await createUser({ role: "Admin" });
    const employee = await createUser({
      email: "employee@example.com",
      role: "Assistant",
    });

    const employeeLogin = await request(app).post("/api/auth/login").send({
      email: "employee@example.com",
      password: "password123",
    });
    expect(employeeLogin.status).toBe(200);

    const adminLogin = await request(app).post("/api/auth/login").send({
      email: "auth@example.com",
      password: "password123",
    });

    const resetResponse = await request(app)
      .post(`/api/auth/users/${employee._id}/reset-password`)
      .set("Authorization", `Bearer ${adminLogin.body.accessToken}`)
      .send({ newPassword: "newpass123" });

    expect(resetResponse.status).toBe(200);

    const oldPasswordLogin = await request(app).post("/api/auth/login").send({
      email: "employee@example.com",
      password: "password123",
    });
    expect(oldPasswordLogin.status).toBe(401);

    const newPasswordLogin = await request(app).post("/api/auth/login").send({
      email: "employee@example.com",
      password: "newpass123",
    });
    expect(newPasswordLogin.status).toBe(200);

    const oldRefreshResponse = await request(app).post("/api/auth/refresh").send({
      refreshToken: employeeLogin.body.refreshToken,
    });
    expect(oldRefreshResponse.status).toBe(401);
  });
});
