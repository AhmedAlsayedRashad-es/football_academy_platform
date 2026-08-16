import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { TRPCError } from '@trpc/server';
import { getDb } from './db';
import { conversations, messages, users, players, parentPlayerRelations } from '../drizzle/schema';
import { eq, and, or, desc, sql } from 'drizzle-orm';

export const messagingRouter = router({
  /**
   * Get all conversations for the current user
   */
  getConversations: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      const userId = ctx.user.id;
      const userRole = ctx.user.role;

      // Get conversations where user is either parent or coach
      const userConversations = await database
        .select({
          id: conversations.id,
          parentUserId: conversations.parentUserId,
          coachUserId: conversations.coachUserId,
          playerId: conversations.playerId,
          subject: conversations.subject,
          status: conversations.status,
          lastMessageAt: conversations.lastMessageAt,
          createdAt: conversations.createdAt,
          parentName: sql<string>`parent.name`,
          coachName: sql<string>`coach.name`,
          playerName: sql<string>`CONCAT(${players.firstName}, ' ', ${players.lastName})`,
        })
        .from(conversations)
        .leftJoin(sql`${users} as parent`, eq(conversations.parentUserId, sql`parent.id`))
        .leftJoin(sql`${users} as coach`, eq(conversations.coachUserId, sql`coach.id`))
        .leftJoin(players, eq(conversations.playerId, players.id))
        .where(
          or(
            eq(conversations.parentUserId, userId),
            eq(conversations.coachUserId, userId)
          )
        )
        .orderBy(desc(conversations.lastMessageAt));

      // Get unread message count for each conversation
      const conversationsWithUnread = await Promise.all(
        userConversations.map(async (conv) => {
          const unreadCount = await database
            .select({ count: sql<number>`COUNT(*)` })
            .from(messages)
            .where(
              and(
                eq(messages.conversationId, conv.id),
                eq(messages.isRead, false),
                sql`${messages.senderUserId} != ${userId}`
              )
            );

          return {
            ...conv,
            unreadCount: Number(unreadCount[0]?.count || 0),
          };
        })
      );

      return conversationsWithUnread;
    }),

  /**
   * Get messages for a specific conversation
   */
  getMessages: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      const userId = ctx.user.id;

      // Verify user has access to this conversation
      const conversation = await database
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (!conversation || conversation.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      const conv = conversation[0];
      if (conv.parentUserId !== userId && conv.coachUserId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      // Get messages
      const conversationMessages = await database
        .select({
          id: messages.id,
          conversationId: messages.conversationId,
          senderUserId: messages.senderUserId,
          senderName: users.name,
          messageText: messages.messageText,
          attachmentUrl: messages.attachmentUrl,
          attachmentType: messages.attachmentType,
          isRead: messages.isRead,
          readAt: messages.readAt,
          createdAt: messages.createdAt,
        })
        .from(messages)
        .leftJoin(users, eq(messages.senderUserId, users.id))
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Mark messages as read
      await database
        .update(messages)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(messages.conversationId, input.conversationId),
            eq(messages.isRead, false),
            sql`${messages.senderUserId} != ${userId}`
          )
        );

      return conversationMessages.reverse();
    }),

  /**
   * Send a new message
   */
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      messageText: z.string().min(1),
      attachmentUrl: z.string().optional(),
      attachmentType: z.enum(['image', 'pdf', 'video', 'document']).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      const userId = ctx.user.id;

      // Verify user has access to this conversation
      const conversation = await database
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (!conversation || conversation.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      const conv = conversation[0];
      if (conv.parentUserId !== userId && conv.coachUserId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      // Insert message
      const result = await database.insert(messages).values({
        conversationId: input.conversationId,
        senderUserId: userId,
        messageText: input.messageText,
        attachmentUrl: input.attachmentUrl,
        attachmentType: input.attachmentType,
        isRead: false,
      });

      // Update conversation lastMessageAt
      await database
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, input.conversationId));

      return {
        success: true,
        messageId: Number(result[0].insertId),
      };
    }),

  /**
   * Start a new conversation
   */
  startConversation: protectedProcedure
    .input(z.object({
      recipientUserId: z.number(),
      playerId: z.number().optional(),
      subject: z.string().min(1),
      initialMessage: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      const userId = ctx.user.id;
      const userRole = ctx.user.role;

      // Verify recipient exists and has appropriate role
      const recipient = await database
        .select()
        .from(users)
        .where(eq(users.id, input.recipientUserId))
        .limit(1);

      if (!recipient || recipient.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Recipient not found' });
      }

      const recipientRole = recipient[0].role;

      // Determine parent and coach IDs
      let parentUserId: number;
      let coachUserId: number;

      if (userRole === 'parent' && ['coach', 'admin'].includes(recipientRole)) {
        parentUserId = userId;
        coachUserId = input.recipientUserId;
      } else if (['coach', 'admin'].includes(userRole) && recipientRole === 'parent') {
        parentUserId = input.recipientUserId;
        coachUserId = userId;
      } else {
        throw new TRPCError({ 
          code: 'BAD_REQUEST', 
          message: 'Conversations are only allowed between parents and coaches' 
        });
      }

      // Check if conversation already exists
      const existingConv = await database
        .select()
        .from(conversations)
        .where(
          and(
            eq(conversations.parentUserId, parentUserId),
            eq(conversations.coachUserId, coachUserId),
            input.playerId ? eq(conversations.playerId, input.playerId) : sql`${conversations.playerId} IS NULL`
          )
        )
        .limit(1);

      let conversationId: number;

      if (existingConv && existingConv.length > 0) {
        // Use existing conversation
        conversationId = existingConv[0].id;
        
        // Update lastMessageAt
        await database
          .update(conversations)
          .set({ lastMessageAt: new Date(), status: 'active' })
          .where(eq(conversations.id, conversationId));
      } else {
        // Create new conversation
        const result = await database.insert(conversations).values({
          parentUserId,
          coachUserId,
          playerId: input.playerId,
          subject: input.subject,
          status: 'active',
          lastMessageAt: new Date(),
        });

        conversationId = Number(result[0].insertId);
      }

      // Send initial message
      await database.insert(messages).values({
        conversationId,
        senderUserId: userId,
        messageText: input.initialMessage,
        isRead: false,
      });

      return {
        success: true,
        conversationId,
      };
    }),

  /**
   * Get available coaches for messaging
   */
  getAvailableCoaches: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      if (ctx.user.role !== 'parent') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Parent access only' });
      }

      // Get all coaches
      const coaches = await database
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(
          or(
            eq(users.role, 'coach'),
            eq(users.role, 'admin')
          )
        );

      return coaches;
    }),

  /**
   * Get parents for a coach to message
   */
  getParentsForCoach: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      if (!['coach', 'admin'].includes(ctx.user.role)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Coach access only' });
      }

      // Get all parents
      const parents = await database
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
        })
        .from(users)
        .where(eq(users.role, 'parent'));

      return parents;
    }),

  /**
   * Archive a conversation
   */
  archiveConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      const userId = ctx.user.id;

      // Verify access
      const conversation = await database
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (!conversation || conversation.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Conversation not found' });
      }

      const conv = conversation[0];
      if (conv.parentUserId !== userId && conv.coachUserId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
      }

      // Archive conversation
      await database
        .update(conversations)
        .set({ status: 'archived' })
        .where(eq(conversations.id, input.conversationId));

      return { success: true };
    }),

  /**
   * Get unread message count
   */
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const database = await getDb();
      if (!database) {
        throw new Error('Database not available');
      }

      const userId = ctx.user.id;

      // Get all conversations for user
      const userConversations = await database
        .select({ id: conversations.id })
        .from(conversations)
        .where(
          or(
            eq(conversations.parentUserId, userId),
            eq(conversations.coachUserId, userId)
          )
        );

      const conversationIds = userConversations.map(c => c.id);

      if (conversationIds.length === 0) {
        return 0;
      }

      // Count unread messages
      const unreadCount = await database
        .select({ count: sql<number>`COUNT(*)` })
        .from(messages)
        .where(
          and(
            sql`${messages.conversationId} IN (${conversationIds.join(',')})`,
            eq(messages.isRead, false),
            sql`${messages.senderUserId} != ${userId}`
          )
        );

      return Number(unreadCount[0]?.count || 0);
    }),
});
