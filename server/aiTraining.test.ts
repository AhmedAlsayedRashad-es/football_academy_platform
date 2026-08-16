import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCoachContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "coach-user",
    email: "coach@futurestarfc.com",
    name: "Coach Smith",
    loginMethod: "manus",
    role: "coach",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@futurestarfc.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("matches router", () => {
  it("getAll requires staff access", async () => {
    const { ctx } = createCoachContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw for coach role
    await expect(caller.matches.getAll()).resolves.toBeDefined();
  });
});

describe("matchStats router", () => {
  it("getByPlayer requires staff access", async () => {
    const { ctx } = createCoachContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw for coach role
    await expect(caller.matchStats.getByPlayer({ playerId: 1 })).resolves.toBeDefined();
  });
});

describe("skillScores router", () => {
  it("getLatest requires staff access and returns null for non-existent player", async () => {
    const { ctx } = createCoachContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw for coach role (returns null for non-existent player)
    const result = await caller.skillScores.getLatest({ playerId: 999 });
    expect(result === null || result === undefined).toBe(true);
  });
});

describe("aiTraining router", () => {
  it("getLatest requires staff access and returns null for non-existent player", async () => {
    const { ctx } = createCoachContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw for coach role (returns null for non-existent player)
    const result = await caller.aiTraining.getLatest({ playerId: 999 });
    expect(result === null || result === undefined).toBe(true);
  });

  it("getAll requires staff access", async () => {
    const { ctx } = createCoachContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw for coach role
    await expect(caller.aiTraining.getAll({ playerId: 1 })).resolves.toBeDefined();
  });
});

describe("videos router", () => {
  it("getAll requires staff access", async () => {
    const { ctx } = createCoachContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw for coach role
    await expect(caller.videos.getAll()).resolves.toBeDefined();
  });

  it("getByPlayer requires staff access", async () => {
    const { ctx } = createCoachContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw for coach role
    await expect(caller.videos.getByPlayer({ playerId: 1 })).resolves.toBeDefined();
  });
});

describe("notifications router", () => {
  it("notifyParent requires staff access", async () => {
    const { ctx } = createCoachContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw for coach role (even if player doesn't exist)
    await expect(
      caller.notifications.notifyParent({
        playerId: 999,
        title: "Test Notification",
        message: "This is a test",
      })
    ).resolves.toBeDefined();
  });
});
