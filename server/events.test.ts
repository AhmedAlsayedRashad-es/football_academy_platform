import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";

// Mock the database module
vi.mock("./db", () => ({
  getPublicEvents: vi.fn().mockResolvedValue([
    {
      id: 1,
      title: "U-12 Training Camp",
      description: "Summer training camp for U-12 players",
      eventType: "camp",
      location: "Training Ground",
      startDate: new Date("2025-01-15"),
      endDate: new Date("2025-01-17"),
      ageGroups: JSON.stringify(["U-12"]),
      maxParticipants: 24,
      currentParticipants: 18,
      isPublic: true,
      status: "upcoming",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 2,
      title: "Open Trial Day",
      description: "Open trials for all age groups",
      eventType: "trial",
      location: "Main Stadium",
      startDate: new Date("2025-01-20"),
      endDate: null,
      ageGroups: JSON.stringify(["U-10", "U-12", "U-14"]),
      maxParticipants: 100,
      currentParticipants: 45,
      isPublic: true,
      status: "upcoming",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]),
  getUpcomingEvents: vi.fn().mockResolvedValue([
    {
      id: 1,
      title: "U-12 Training Camp",
      eventType: "camp",
      startDate: new Date("2025-01-15"),
      isPublic: true,
      status: "upcoming",
    },
  ]),
  getEventById: vi.fn().mockImplementation((id: number) => {
    if (id === 1) {
      return Promise.resolve({
        id: 1,
        title: "U-12 Training Camp",
        description: "Summer training camp",
        eventType: "camp",
        startDate: new Date("2025-01-15"),
        isPublic: true,
      });
    }
    return Promise.resolve(null);
  }),
  getAllAcademyEvents: vi.fn().mockResolvedValue([]),
  createAcademyEvent: vi.fn().mockResolvedValue(1),
  updateAcademyEvent: vi.fn().mockResolvedValue(undefined),
  deleteAcademyEvent: vi.fn().mockResolvedValue(undefined),
}));

describe("events router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getPublic returns public events without authentication", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const events = await caller.events.getPublic();
    
    expect(events).toBeDefined();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBe(2);
    expect(events[0].title).toBe("U-12 Training Camp");
    expect(events[0].eventType).toBe("camp");
    expect(events[1].title).toBe("Open Trial Day");
    expect(events[1].eventType).toBe("trial");
  });

  it("getUpcoming returns upcoming events without authentication", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const events = await caller.events.getUpcoming({ limit: 10 });
    
    expect(events).toBeDefined();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBe(1);
    expect(events[0].status).toBe("upcoming");
  });

  it("getById returns event details without authentication", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const event = await caller.events.getById({ id: 1 });
    
    expect(event).toBeDefined();
    expect(event?.id).toBe(1);
    expect(event?.title).toBe("U-12 Training Camp");
    expect(event?.eventType).toBe("camp");
  });

  it("getById returns null for non-existent event", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const event = await caller.events.getById({ id: 999 });
    
    expect(event).toBeNull();
  });
});
