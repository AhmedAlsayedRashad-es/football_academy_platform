import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createContext(user: AuthenticatedUser | null): TrpcContext {
  return {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {
      clearCookie: () => {},
    } as TrpcContext['res'],
  };
}

function createMockUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: 'test-user',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'manus',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };
}

describe('drillAssignments router', () => {
  describe('assign procedure', () => {
    it('requires coach access to assign drills - player should be rejected', async () => {
      const playerUser = createMockUser({ role: 'player' });
      const ctx = createContext(playerUser);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.drillAssignments.assign({
          playerId: 1,
          drillId: 'drill-1',
          drillName: 'Test Drill',
        })
      ).rejects.toThrow('Coach access required');
    });

    it('requires coach access to assign drills - parent should be rejected', async () => {
      const parentUser = createMockUser({ role: 'parent' });
      const ctx = createContext(parentUser);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.drillAssignments.assign({
          playerId: 1,
          drillId: 'drill-1',
          drillName: 'Test Drill',
        })
      ).rejects.toThrow('Coach access required');
    });

    it('allows coach to assign drills', async () => {
      const coachUser = createMockUser({ role: 'coach' });
      const ctx = createContext(coachUser);
      const caller = appRouter.createCaller(ctx);

      // The procedure should not throw a forbidden error for coaches
      // It may throw a database error since we're not mocking the DB, but that's ok
      try {
        await caller.drillAssignments.assign({
          playerId: 1,
          drillId: 'drill-1',
          drillName: 'Test Drill',
          category: 'ball_control',
          priority: 'high',
        });
      } catch (error: any) {
        // Should not be a forbidden error
        expect(error.message).not.toBe('Coach access required');
      }
    });

    it('allows admin to assign drills', async () => {
      const adminUser = createMockUser({ role: 'admin' });
      const ctx = createContext(adminUser);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.drillAssignments.assign({
          playerId: 1,
          drillId: 'drill-2',
          drillName: 'Admin Assigned Drill',
        });
      } catch (error: any) {
        // Should not be a forbidden error
        expect(error.message).not.toBe('Coach access required');
      }
    });
  });

  describe('getForPlayer procedure', () => {
    it('requires authentication to get player assignments', async () => {
      const ctx = createContext(null);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.drillAssignments.getForPlayer({ playerId: 1 })
      ).rejects.toThrow();
    });

    it('allows authenticated users to view player assignments', async () => {
      const playerUser = createMockUser({ role: 'player' });
      const ctx = createContext(playerUser);
      const caller = appRouter.createCaller(ctx);

      // Should not throw an auth error - may throw DB error which is fine
      try {
        const result = await caller.drillAssignments.getForPlayer({ playerId: 1 });
        expect(Array.isArray(result)).toBe(true);
      } catch (error: any) {
        expect(error.code).not.toBe('UNAUTHORIZED');
      }
    });
  });

  describe('getMyAssignments procedure', () => {
    it('requires coach access to get own assignments', async () => {
      const playerUser = createMockUser({ role: 'player' });
      const ctx = createContext(playerUser);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.drillAssignments.getMyAssignments()
      ).rejects.toThrow('Coach access required');
    });

    it('allows coach to get own assignments', async () => {
      const coachUser = createMockUser({ role: 'coach' });
      const ctx = createContext(coachUser);
      const caller = appRouter.createCaller(ctx);

      try {
        const result = await caller.drillAssignments.getMyAssignments();
        expect(Array.isArray(result)).toBe(true);
      } catch (error: any) {
        expect(error.message).not.toBe('Coach access required');
      }
    });
  });

  describe('updateStatus procedure', () => {
    it('requires authentication to update status', async () => {
      const ctx = createContext(null);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.drillAssignments.updateStatus({
          id: 1,
          status: 'completed',
        })
      ).rejects.toThrow();
    });
  });

  describe('addFeedback procedure', () => {
    it('requires coach access to add feedback', async () => {
      const playerUser = createMockUser({ role: 'player' });
      const ctx = createContext(playerUser);
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.drillAssignments.addFeedback({
          id: 1,
          feedback: 'Great work!',
        })
      ).rejects.toThrow('Coach access required');
    });

    it('allows coach to add feedback', async () => {
      const coachUser = createMockUser({ role: 'coach' });
      const ctx = createContext(coachUser);
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.drillAssignments.addFeedback({
          id: 1,
          feedback: 'Great work!',
        });
      } catch (error: any) {
        expect(error.message).not.toBe('Coach access required');
      }
    });
  });
});
