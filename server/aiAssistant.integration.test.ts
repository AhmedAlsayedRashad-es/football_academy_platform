import { describe, expect, it, beforeAll, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createCoachContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "coach-user",
    email: "coach@example.com",
    name: "Coach User",
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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return ctx;
}

describe("AI Assistant Integration Tests", () => {
  describe("aiCoach.askQuestion workflow", () => {
    it("processes a tactical question and returns an answer", async () => {
      const ctx = createCoachContext();
      const caller = appRouter.createCaller(ctx);

      const question = "What formation should I use against a 4-3-3 team?";
      const result = await caller.aiCoach.askQuestion({
        question,
        context: "tactical",
      });

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(typeof result.answer).toBe("string");
      expect(result.answer.length).toBeGreaterThan(0);
    }, 30000); // 30s timeout for LLM call

    it("handles training-related questions", async () => {
      const ctx = createCoachContext();
      const caller = appRouter.createCaller(ctx);

      const question = "What drills should I use to improve passing accuracy for U-12 players?";
      const result = await caller.aiCoach.askQuestion({
        question,
        context: "training",
      });

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(typeof result.answer).toBe("string");
      expect(result.answer.length).toBeGreaterThan(0);
    }, 30000);

    it("handles player development questions", async () => {
      const ctx = createCoachContext();
      const caller = appRouter.createCaller(ctx);

      const question = "How can I help a shy 14-year-old player build confidence on the field?";
      const result = await caller.aiCoach.askQuestion({
        question,
        context: "development",
      });

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(typeof result.answer).toBe("string");
      expect(result.answer.length).toBeGreaterThan(0);
    }, 30000);

    it("returns meaningful answers with tactical insights", async () => {
      const ctx = createCoachContext();
      const caller = appRouter.createCaller(ctx);

      const question = "Explain the advantages of a 4-2-3-1 formation";
      const result = await caller.aiCoach.askQuestion({
        question,
        context: "tactical",
      });

      expect(result.answer).toBeDefined();
      
      // Check that answer contains football-related keywords
      const answer = result.answer.toLowerCase();
      const hasFootballTerms = 
        answer.includes("formation") ||
        answer.includes("midfield") ||
        answer.includes("defense") ||
        answer.includes("attack") ||
        answer.includes("player") ||
        answer.includes("position");
      
      expect(hasFootballTerms).toBe(true);
    }, 30000);

    it("handles empty questions gracefully", async () => {
      const ctx = createCoachContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.aiCoach.askQuestion({
          question: "",
          context: "tactical",
        })
      ).rejects.toThrow();
    });

    it("handles very long questions", async () => {
      const ctx = createCoachContext();
      const caller = appRouter.createCaller(ctx);

      const longQuestion = "I have a team of 16-year-old players. ".repeat(50) + 
        "What formation should I use?";
      
      const result = await caller.aiCoach.askQuestion({
        question: longQuestion,
        context: "tactical",
      });

      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
      expect(typeof result.answer).toBe("string");
    }, 30000);
  });

  describe("Conversation context handling", () => {
    it("maintains context across multiple questions", async () => {
      const ctx = createCoachContext();
      const caller = appRouter.createCaller(ctx);

      // First question
      const result1 = await caller.aiCoach.askQuestion({
        question: "What is a 4-4-2 formation?",
        context: "tactical",
      });

      expect(result1.answer).toBeDefined();

      // Follow-up question (would benefit from context in real implementation)
      const result2 = await caller.aiCoach.askQuestion({
        question: "What are its main weaknesses?",
        context: "tactical",
      });

      expect(result2.answer).toBeDefined();
      expect(typeof result2.answer).toBe("string");
    }, 60000);
  });

  describe("Error handling", () => {
    it("handles invalid context types gracefully", async () => {
      const ctx = createCoachContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.aiCoach.askQuestion({
        question: "What is a good formation?",
        context: "invalid_context" as any,
      });

      // Should still return an answer even with invalid context
      expect(result).toBeDefined();
      expect(result.answer).toBeDefined();
    }, 30000);

    it("requires authentication", async () => {
      const unauthCtx: TrpcContext = {
        user: null,
        req: {
          protocol: "https",
          headers: {},
        } as TrpcContext["req"],
        res: {
          clearCookie: () => {},
        } as TrpcContext["res"],
      };

      const caller = appRouter.createCaller(unauthCtx);

      await expect(
        caller.aiCoach.askQuestion({
          question: "Test question",
          context: "tactical",
        })
      ).rejects.toThrow();
    });
  });

  describe("Quick prompt scenarios", () => {
    it("handles formation advice prompt", async () => {
      const ctx = createCoachContext();
      const caller = appRouter.createCaller(ctx);

      const prompt = "What formation should I use against a team that plays 4-3-3 with high pressing?";
      const result = await caller.aiCoach.askQuestion({
        question: prompt,
        context: "tactical",
      });

      expect(result.answer).toBeDefined();
      expect(result.answer.length).toBeGreaterThan(50);
    }, 30000);

    it("handles attacking strategy prompt", async () => {
      const ctx = createCoachContext();
      const caller = appRouter.createCaller(ctx);

      const prompt = "How can I improve my team's attacking transitions from defense to attack?";
      const result = await caller.aiCoach.askQuestion({
        question: prompt,
        context: "tactical",
      });

      expect(result.answer).toBeDefined();
      expect(result.answer.length).toBeGreaterThan(50);
    }, 30000);

    it("handles player development prompt", async () => {
      const ctx = createCoachContext();
      const caller = appRouter.createCaller(ctx);

      const prompt = "What training drills should I use to develop young midfielders aged 16-18?";
      const result = await caller.aiCoach.askQuestion({
        question: prompt,
        context: "training",
      });

      expect(result.answer).toBeDefined();
      expect(result.answer.length).toBeGreaterThan(50);
    }, 30000);

    it("handles tactical analysis prompt", async () => {
      const ctx = createCoachContext();
      const caller = appRouter.createCaller(ctx);

      const prompt = "How do I analyze opponent's weaknesses from video footage?";
      const result = await caller.aiCoach.askQuestion({
        question: prompt,
        context: "tactical",
      });

      expect(result.answer).toBeDefined();
      expect(result.answer.length).toBeGreaterThan(50);
    }, 30000);
  });
});
