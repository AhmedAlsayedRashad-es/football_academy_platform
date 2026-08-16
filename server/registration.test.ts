import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("registration router", () => {
  it("allows public submission of registration", { timeout: 15000 }, async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.registration.submit({
      parentName: "John Doe",
      parentEmail: "john@example.com",
      parentPhone: "+1234567890",
      childName: "Junior Doe",
      childDateOfBirth: "2015-05-15",
      childAge: 9,
    });

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("id");
  });

  it("admin can view all registrations", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.registration.getAll();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("gps router", () => {
  it("staff can import GPS data", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.gps.import({
      playerId: 1,
      deviceType: "statsports",
      recordedAt: new Date().toISOString(),
      totalDistance: 8500,
      maxSpeed: 32,
      avgHeartRate: 145,
    });

    expect(result).toHaveProperty("success", true);
  });

  it("staff can view player GPS data", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.gps.getPlayerData({
      playerId: 1,
      limit: 10,
    });

    expect(Array.isArray(result)).toBe(true);
  });
});
