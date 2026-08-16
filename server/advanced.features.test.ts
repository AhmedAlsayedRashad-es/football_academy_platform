import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("Advanced Features Integration Tests", () => {
  let testPlayerId: number;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const testUser = {
      openId: `test-advanced-${Date.now()}`,
      name: "Test Advanced User",
      email: `advanced-${Date.now()}@test.com`,
      role: "admin" as const,
      accountStatus: "approved" as const,
    };
    await db.upsertUser(testUser);
    testUserId = testUser.openId;

    // Create test player
    testPlayerId = await db.createPlayer({
      firstName: "Test",
      lastName: "Player",
      dateOfBirth: "2010-01-01",
      position: "midfielder",
      jerseyNumber: 10,
    });

    // Note: Video events can reference any video ID for testing purposes
  });

  describe("Video Event Tagging System", () => {
    it("should create video event tag", async () => {
      const caller = appRouter.createCaller({
        user: { openId: testUserId, role: "admin" },
      });

      const event = await caller.videoEvents.create({
        videoId: 1,
        timestamp: 45,
        eventType: "goal",
        title: "Amazing goal",
        description: "Player scored from 30 yards",
        playerId: testPlayerId,
      });

      expect(event).toBeDefined();
      expect(event.eventType).toBe("goal");
      expect(event.timestamp).toBe(45);
    });

    it("should retrieve video events by video ID", async () => {
      const caller = appRouter.createCaller({
        user: { openId: testUserId, role: "admin" },
      });

      // Create multiple events
      await caller.videoEvents.create({
        videoId: 1,
        timestamp: 60,
        eventType: "assist",
        playerId: testPlayerId,
      });

      await caller.videoEvents.create({
        videoId: 1,
        timestamp: 120,
        eventType: "tackle",
        playerId: testPlayerId,
      });

      const events = await caller.videoEvents.getByVideo({ videoId: 1 });

      expect(events.length).toBeGreaterThanOrEqual(3); // At least 3 events
      expect(events.some((e: any) => e.eventType === "goal")).toBe(true);
      expect(events.some((e: any) => e.eventType === "assist")).toBe(true);
    });

    it("should get highlight reel by event types", async () => {
      const caller = appRouter.createCaller({
        user: { openId: testUserId, role: "admin" },
      });

      const highlights = await caller.videoEvents.getHighlights({
        videoId: 1,
        eventTypes: ["goal", "assist"],
      });

      expect(highlights.length).toBeGreaterThanOrEqual(2);
      expect(highlights.every((e: any) => ["goal", "assist"].includes(e.eventType))).toBe(true);
    });

    it("should delete video event", async () => {
      const caller = appRouter.createCaller({
        user: { openId: testUserId, role: "admin" },
      });

      const event = await caller.videoEvents.create({
        videoId: 1,
        timestamp: 200,
        eventType: "foul",
      });

      await caller.videoEvents.delete({ id: event.id });

      const events = await caller.videoEvents.getByVideo({ videoId: 1 });
      expect(events.find((e: any) => e.id === event.id)).toBeUndefined();
    });
  });

  describe("GPS Data and Heatmap", () => {
    it("should import GPS data for player", async () => {
      const caller = appRouter.createCaller({
        user: { openId: testUserId, role: "admin" },
      });

      await caller.gps.import({
        playerId: testPlayerId,
        deviceType: "catapult",
        recordedAt: new Date().toISOString(),
        totalDistance: 8500,
        highSpeedDistance: 1200,
        sprintDistance: 450,
        maxSpeed: 32,
        avgSpeed: 12,
        accelerations: 45,
        decelerations: 38,
        avgHeartRate: 165,
        maxHeartRate: 185,
        playerLoad: 420,
      });

      const gpsData = await caller.gps.getPlayerData({ playerId: testPlayerId, limit: 10 });

      expect(gpsData.length).toBeGreaterThan(0);
      expect(gpsData[0].totalDistance).toBe(8500);
      expect(gpsData[0].maxSpeed).toBe(32);
    });

    it("should retrieve GPS data for heatmap visualization", async () => {
      const caller = appRouter.createCaller({
        user: { openId: testUserId, role: "admin" },
      });

      const gpsData = await caller.gps.getPlayerData({ playerId: testPlayerId, limit: 20 });

      expect(Array.isArray(gpsData)).toBe(true);
      expect(gpsData.length).toBeGreaterThan(0);
      
      // Verify data structure for heatmap
      const firstEntry = gpsData[0];
      expect(firstEntry).toHaveProperty("avgSpeed");
      expect(firstEntry).toHaveProperty("totalDistance");
    });
  });

  describe("Parent Dashboard Filtering", () => {
    it("should retrieve only linked children for parent", async () => {
      // Create parent user
      const parentUser = {
        openId: `parent-test-${Date.now()}`,
        name: "Test Parent",
        email: `parent-${Date.now()}@test.com`,
        role: "parent" as const,
        accountStatus: "approved" as const,
        onboardingCompleted: true,
      };
      await db.upsertUser(parentUser);

      // Link parent to player
      await db.linkParentToPlayer(parentUser.openId, testPlayerId, "guardian");

      const caller = appRouter.createCaller({
        user: { openId: parentUser.openId, role: "parent" },
      });

      const linkedPlayers = await caller.parentRelations.getLinkedPlayers();

      expect(linkedPlayers.length).toBeGreaterThan(0);
      expect(linkedPlayers.some((p: any) => p.id === testPlayerId)).toBe(true);
    });

    it("should support multiple children for parent", async () => {
      const parentUser = {
        openId: `parent-multi-${Date.now()}`,
        name: "Multi Child Parent",
        email: `multi-parent-${Date.now()}@test.com`,
        role: "parent" as const,
        accountStatus: "approved" as const,
        onboardingCompleted: true,
      };
      await db.upsertUser(parentUser);

      // Create second child
      const child2Id = await db.createPlayer({
        firstName: "Second",
        lastName: "Child",
        dateOfBirth: "2012-05-15",
        position: "forward",
        jerseyNumber: 9,
      });

      // Link parent to both children
      await db.linkParentToPlayer(parentUser.openId, testPlayerId, "guardian");
      await db.linkParentToPlayer(parentUser.openId, child2Id, "guardian");

      const caller = appRouter.createCaller({
        user: { openId: parentUser.openId, role: "parent" },
      });

      const linkedPlayers = await caller.parentRelations.getLinkedPlayers();

      expect(linkedPlayers.length).toBe(2);
      expect(linkedPlayers.some((p: any) => p.id === testPlayerId)).toBe(true);
      expect(linkedPlayers.some((p: any) => p.id === child2Id)).toBe(true);
    });
  });

  describe("Small-Sided Game Formations", () => {
    it("should create 5v5 formation", async () => {
      const caller = appRouter.createCaller({
        user: { openId: testUserId, role: "admin" },
      });

      const formation = await caller.formations.create({
        name: "Test 5v5 Formation",
        formation: "2-1-1 (5v5)",
        description: "Youth 5v5 setup",
        positions: JSON.stringify([
          { x: 50, y: 90, role: "GK" },
          { x: 30, y: 70, role: "CB" },
          { x: 70, y: 70, role: "CB" },
          { x: 50, y: 45, role: "CM" },
          { x: 50, y: 20, role: "ST" },
        ]),
      });

      expect(formation).toBeDefined();
      expect(formation.formation).toBe("2-1-1 (5v5)");
    });

    it("should create 7v7 formation", async () => {
      const caller = appRouter.createCaller({
        user: { openId: testUserId, role: "admin" },
      });

      const formation = await caller.formations.create({
        name: "Test 7v7 Formation",
        formation: "3-2-1 (7v7)",
        description: "Youth 7v7 setup",
        positions: JSON.stringify([
          { x: 50, y: 90, role: "GK" },
          { x: 25, y: 70, role: "CB" },
          { x: 50, y: 70, role: "CB" },
          { x: 75, y: 70, role: "CB" },
          { x: 35, y: 45, role: "CM" },
          { x: 65, y: 45, role: "CM" },
          { x: 50, y: 20, role: "ST" },
        ]),
      });

      expect(formation).toBeDefined();
      expect(formation.formation).toBe("3-2-1 (7v7)");
    });

    it("should create 9v9 formation", async () => {
      const caller = appRouter.createCaller({
        user: { openId: testUserId, role: "admin" },
      });

      const formation = await caller.formations.create({
        name: "Test 9v9 Formation",
        formation: "3-3-2 (9v9)",
        description: "Youth 9v9 setup",
        positions: JSON.stringify([
          { x: 50, y: 90, role: "GK" },
          { x: 25, y: 70, role: "CB" },
          { x: 50, y: 70, role: "CB" },
          { x: 75, y: 70, role: "CB" },
          { x: 20, y: 45, role: "LM" },
          { x: 50, y: 45, role: "CM" },
          { x: 80, y: 45, role: "RM" },
          { x: 35, y: 20, role: "ST" },
          { x: 65, y: 20, role: "ST" },
        ]),
      });

      expect(formation).toBeDefined();
      expect(formation.formation).toBe("3-3-2 (9v9)");
    });
  });
});
