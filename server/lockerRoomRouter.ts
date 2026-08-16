import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, sql } from "drizzle-orm";
import { lockerRoomMessages, players, users, teams } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";

export const lockerRoomRouter = router({
  // AI: Generate a coaching message suggestion
  generateMessageSuggestion: protectedProcedure
    .input(z.object({
      playerName: z.string(),
      playerPosition: z.string().optional(),
      messageType: z.enum(["feedback", "praise", "correction", "tactical", "motivation", "challenge"]),
      context: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const typeDescriptions: Record<string, string> = {
        feedback: "constructive performance feedback",
        praise: "genuine praise and encouragement",
        correction: "a specific technical correction",
        tactical: "tactical instructions or game plan advice",
        motivation: "motivational message to boost confidence",
        challenge: "a personal challenge or goal to achieve",
      };
      const prompt = `You are an experienced football academy coach. Write a short, professional, and personal ${typeDescriptions[input.messageType]} message for a player named ${input.playerName}${input.playerPosition ? ` who plays as ${input.playerPosition}` : ""}.${input.context ? ` Context: ${input.context}.` : ""}

Requirements:
- Be specific and actionable
- Use the player's first name
- Keep it under 150 words
- Sound like a real coach, not a robot
- Do NOT include a subject line, just the message body`;
      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
      });
      const suggestion = response?.choices?.[0]?.message?.content ?? "";
      return { suggestion: typeof suggestion === "string" ? suggestion.trim() : "" };
    }),

  // Coach: Send a message/feedback to a player
  sendMessage: protectedProcedure
    .input(z.object({
      playerId: z.number(),
      messageType: z.enum(["feedback", "praise", "correction", "tactical", "motivation", "challenge"]),
      subject: z.string().max(255).optional(),
      content: z.string().min(1).max(5000),
      videoTimestamp: z.number().optional(),
      priority: z.enum(["low", "normal", "high"]).default("normal"),
      clipId: z.number().optional(),
      videoSessionId: z.number().optional(),
      attachedVideoId: z.string().max(50).optional(),
      attachedVideoTitle: z.string().max(255).optional(),
      attachedVideoCategory: z.string().max(50).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(lockerRoomMessages).values({
        playerId: input.playerId,
        fromUserId: ctx.user.id,
        messageType: input.messageType,
        subject: input.subject,
        content: input.content,
        videoTimestamp: input.videoTimestamp,
        priority: input.priority,
        clipId: input.clipId,
        videoSessionId: input.videoSessionId,
        attachedVideoId: input.attachedVideoId,
        attachedVideoTitle: input.attachedVideoTitle,
        attachedVideoCategory: input.attachedVideoCategory,
        isRead: false,
      });
      return { success: true, id: result.insertId };
    }),

  // Coach: Get all messages sent by this coach
  getCoachMessages: protectedProcedure
    .input(z.object({
      playerId: z.number().optional(),
      messageType: z.enum(["feedback", "praise", "correction", "tactical", "motivation", "challenge", "all"]).optional(),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const conditions = [eq(lockerRoomMessages.fromUserId, ctx.user.id)];
      if (input.playerId) {
        conditions.push(eq(lockerRoomMessages.playerId, input.playerId));
      }
      if (input.messageType && input.messageType !== "all") {
        conditions.push(eq(lockerRoomMessages.messageType, input.messageType));
      }
      const messages = await db
        .select({
          id: lockerRoomMessages.id,
          playerId: lockerRoomMessages.playerId,
          messageType: lockerRoomMessages.messageType,
          subject: lockerRoomMessages.subject,
          content: lockerRoomMessages.content,
          videoTimestamp: lockerRoomMessages.videoTimestamp,
          isRead: lockerRoomMessages.isRead,
          playerResponse: lockerRoomMessages.playerResponse,
          playerRespondedAt: lockerRoomMessages.playerRespondedAt,
          priority: lockerRoomMessages.priority,
          attachedVideoId: lockerRoomMessages.attachedVideoId,
          attachedVideoTitle: lockerRoomMessages.attachedVideoTitle,
          attachedVideoCategory: lockerRoomMessages.attachedVideoCategory,
          createdAt: lockerRoomMessages.createdAt,
          playerFirstName: players.firstName,
          playerLastName: players.lastName,
          playerPosition: players.position,
          playerPhoto: players.photoUrl,
        })
        .from(lockerRoomMessages)
        .leftJoin(players, eq(lockerRoomMessages.playerId, players.id))
        .where(and(...conditions))
        .orderBy(desc(lockerRoomMessages.createdAt))
        .limit(input.limit);
      return messages;
    }),

  // Player: Get messages received by this player
  getPlayerMessages: protectedProcedure
    .input(z.object({
      unreadOnly: z.boolean().default(false),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Find player record for this user
      const [playerRecord] = await db
        .select({ id: players.id })
        .from(players)
        .where(eq(players.userId, ctx.user.id))
        .limit(1);

      if (!playerRecord) {
        return [];
      }

      const conditions = [eq(lockerRoomMessages.playerId, playerRecord.id)];
      if (input.unreadOnly) {
        conditions.push(eq(lockerRoomMessages.isRead, false));
      }

      const messages = await db
        .select({
          id: lockerRoomMessages.id,
          messageType: lockerRoomMessages.messageType,
          subject: lockerRoomMessages.subject,
          content: lockerRoomMessages.content,
          videoTimestamp: lockerRoomMessages.videoTimestamp,
          isRead: lockerRoomMessages.isRead,
          playerResponse: lockerRoomMessages.playerResponse,
          playerRespondedAt: lockerRoomMessages.playerRespondedAt,
          priority: lockerRoomMessages.priority,
          attachedVideoId: lockerRoomMessages.attachedVideoId,
          attachedVideoTitle: lockerRoomMessages.attachedVideoTitle,
          attachedVideoCategory: lockerRoomMessages.attachedVideoCategory,
          createdAt: lockerRoomMessages.createdAt,
          fromUserName: users.name,
          fromUserAvatar: users.avatarUrl,
          fromUserRole: users.role,
        })
        .from(lockerRoomMessages)
        .leftJoin(users, eq(lockerRoomMessages.fromUserId, users.id))
        .where(and(...conditions))
        .orderBy(desc(lockerRoomMessages.createdAt))
        .limit(input.limit);

      return messages;
    }),

  // Player: Respond to a message
  respondToMessage: protectedProcedure
    .input(z.object({
      messageId: z.number(),
      response: z.string().min(1).max(2000),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Verify the player owns this message
      const [playerRecord] = await db
        .select({ id: players.id })
        .from(players)
        .where(eq(players.userId, ctx.user.id))
        .limit(1);

      if (!playerRecord) {
        throw new TRPCError({ code: "FORBIDDEN", message: "No player profile found" });
      }

      const [msg] = await db
        .select({ playerId: lockerRoomMessages.playerId })
        .from(lockerRoomMessages)
        .where(eq(lockerRoomMessages.id, input.messageId))
        .limit(1);

      if (!msg || msg.playerId !== playerRecord.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      await db
        .update(lockerRoomMessages)
        .set({
          playerResponse: input.response,
          playerRespondedAt: new Date(),
          isRead: true,
        })
        .where(eq(lockerRoomMessages.id, input.messageId));

      return { success: true };
    }),

  // Mark message as read
  markAsRead: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db
        .update(lockerRoomMessages)
        .set({ isRead: true })
        .where(eq(lockerRoomMessages.id, input.messageId));
      return { success: true };
    }),

  // Delete a message (coach only)
  deleteMessage: protectedProcedure
    .input(z.object({ messageId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db
        .delete(lockerRoomMessages)
        .where(and(
          eq(lockerRoomMessages.id, input.messageId),
          eq(lockerRoomMessages.fromUserId, ctx.user.id)
        ));
      return { success: true };
    }),

  // Get stats for coach dashboard
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const [stats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        unread: sql<number>`SUM(CASE WHEN ${lockerRoomMessages.isRead} = 0 THEN 1 ELSE 0 END)`,
        responded: sql<number>`SUM(CASE WHEN ${lockerRoomMessages.playerResponse} IS NOT NULL THEN 1 ELSE 0 END)`,
      })
      .from(lockerRoomMessages)
      .where(eq(lockerRoomMessages.fromUserId, ctx.user.id));

    return {
      total: Number(stats?.total ?? 0),
      unread: Number(stats?.unread ?? 0),
      responded: Number(stats?.responded ?? 0),
    };
  }),

  // Get players for a coach to send messages to
  getMyPlayers: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const allPlayers = await db
      .select({
        id: players.id,
        firstName: players.firstName,
        lastName: players.lastName,
        position: players.position,
        ageGroup: players.ageGroup,
        photoUrl: players.photoUrl,
        teamId: players.teamId,
      })
      .from(players)
      .orderBy(players.firstName);
    return allPlayers;
  }),
});
