import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createStaffContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-coach",
    email: "coach@futurestarsfc.com",
    name: "Test Coach",
    loginMethod: "manus",
    role: "coach",
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

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin",
    email: "admin@futurestarsfc.com",
    name: "Test Admin",
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

function createParentContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "test-parent",
    email: "parent@example.com",
    name: "Test Parent",
    loginMethod: "manus",
    role: "parent",
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

describe("players router", () => {
  it("staff can access getAll players", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);

    // This should not throw - staff has access
    const result = await caller.players.getAll();
    expect(Array.isArray(result)).toBe(true);
  });

  it("admin can access getAll players", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.players.getAll();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("teams router", () => {
  it("authenticated user can get all teams", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.teams.getAll();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("analytics router", () => {
  it("staff can access academy stats", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.analytics.getAcademyStats();
    expect(result).toHaveProperty('totalPlayers');
    expect(result).toHaveProperty('totalTeams');
    expect(result).toHaveProperty('activeInjuries');
    expect(result).toHaveProperty('upcomingSessions');
  });
});

describe("auth router", () => {
  it("returns user info for authenticated user", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.email).toBe("coach@futurestarsfc.com");
    expect(result?.role).toBe("coach");
  });

  it("returns null for unauthenticated user", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: () => {},
      } as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.me();
    expect(result).toBeNull();
  });
});

describe("idp router", () => {
  it("staff can access all IDPs", async () => {
    const ctx = createStaffContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.idp.getAll();
    expect(Array.isArray(result)).toBe(true);
  });
});
