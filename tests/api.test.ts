import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import type { AppContext } from "../src/app.js";

describe("finance dashboard backend", () => {
  let ctx: AppContext;

  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret";
    ctx = createApp(":memory:");
  });

  afterEach(() => {
    ctx.db.close();
  });

  async function login(email: string, password: string) {
    const response = await request(ctx.app).post("/api/auth/login").send({ email, password });
    return response.body.token as string;
  }

  async function registerUser(input: {
    name: string;
    email: string;
    password: string;
    role: "viewer" | "analyst";
  }) {
    return request(ctx.app).post("/api/auth/register").send(input);
  }

  it("lets admin create a financial record and expose it in dashboard totals", async () => {
    const token = await login("admin@financedash.local", "Admin@123");

    const createResponse = await request(ctx.app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 999.5,
        type: "expense",
        category: "Travel",
        date: "2026-03-25",
        notes: "Client visit",
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data.category).toBe("Travel");

    const summaryResponse = await request(ctx.app)
      .get("/api/dashboard/summary")
      .set("Authorization", `Bearer ${token}`);

    expect(summaryResponse.status).toBe(200);
    expect(summaryResponse.body.data.totals.expenses).toBeGreaterThan(999);
  });

  it("blocks a viewer from reading detailed records", async () => {
    await registerUser({
      name: "Viewer User",
      email: "viewer@financedash.local",
      password: "Viewer@123",
      role: "viewer",
    });
    const token = await login("viewer@financedash.local", "Viewer@123");

    const response = await request(ctx.app)
      .get("/api/records")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
  });

  it("lets an analyst read records but not create them", async () => {
    await registerUser({
      name: "Analyst User",
      email: "analyst@financedash.local",
      password: "Analyst@123",
      role: "analyst",
    });
    const token = await login("analyst@financedash.local", "Analyst@123");

    const listResponse = await request(ctx.app)
      .get("/api/records?page=1&pageSize=5")
      .set("Authorization", `Bearer ${token}`);

    expect(listResponse.status).toBe(200);
    expect(Array.isArray(listResponse.body.data)).toBe(true);
    expect(listResponse.body.meta.total).toBeGreaterThanOrEqual(0);

    const createResponse = await request(ctx.app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: 120,
        type: "income",
        category: "Bonus",
        date: "2026-03-10",
        notes: "Restricted attempt",
      });

    expect(createResponse.status).toBe(403);
  });

  it("returns validation errors for bad record payloads", async () => {
    const token = await login("admin@financedash.local", "Admin@123");

    const response = await request(ctx.app)
      .post("/api/records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        amount: -100,
        type: "expense",
        category: "",
        date: "not-a-date",
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed.");
  });

  it("allows public registration for non-admin roles", async () => {
    const response = await request(ctx.app).post("/api/auth/register").send({
      name: "Fresh Analyst",
      email: "fresh-analyst@financedash.local",
      password: "Fresh@123",
      role: "analyst",
    });

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe("analyst");
    expect(response.body.token).toBeTruthy();
  });
});
