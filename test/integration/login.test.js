require("dotenv").config();

const supertest = require("supertest");
const mongoose = require("mongoose");
const app = require("../../app");

const { DB_HOST } = process.env;

describe("login", () => {
  beforeEach(async () => {
    await mongoose.connect(DB_HOST);
  });

  afterEach(async () => {
    await mongoose.disconnect(DB_HOST);
  });

  it("should login user", async () => {
    const response = await supertest(app).post("/api/auth/login").send({
      email: "kliu.test@mail.com",
      password: "kliu123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBe(response.body.token);
    expect(response.body.user).toStrictEqual({
      email: "kliu.test@mail.com",
      subscription: "starter",
    });
  });

  it("should not login because user not found", async () => {
    const response = await supertest(app).post("/api/auth/login").send({
      email: "kliu.notfound.test@mail.com",
      password: "kliu123",
    });

    expect(response.statusCode).toBe(401);
  });
});
