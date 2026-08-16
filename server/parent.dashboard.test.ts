import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';
import { appRouter } from './routers';

describe('Parent Dashboard Filtering & Multi-Child Support', () => {
  let testParentUserId: number;
  let testChild1Id: number;
  let testChild2Id: number;

  beforeAll(async () => {
    // Create test parent user
    const parentEmail = `parent-test-${Date.now()}@test.com`;
    testParentUserId = await db.createPendingUser({
      email: parentEmail,
      name: 'Test Parent',
      requestedRole: 'parent',
    });
    
    // Approve parent
    await db.approveUser(testParentUserId);
    await db.markOnboardingComplete(testParentUserId);

    // Create two test children (players)
    testChild1Id = await db.createPlayer({
      firstName: 'Child',
      lastName: 'One',
      dateOfBirth: new Date('2010-01-01'),
      position: 'Forward',
      jerseyNumber: 10,
      teamId: 1,
    });

    testChild2Id = await db.createPlayer({
      firstName: 'Child',
      lastName: 'Two',
      dateOfBirth: new Date('2012-01-01'),
      position: 'Midfielder',
      jerseyNumber: 8,
      teamId: 1,
    });

    // Link both children to parent
    await db.linkParentToPlayer(testParentUserId, testChild1Id, 'guardian', true);
    await db.linkParentToPlayer(testParentUserId, testChild2Id, 'guardian', false);
  });

  it('should retrieve multiple linked children for a parent', async () => {
    const caller = appRouter.createCaller({
      user: { id: testParentUserId, role: 'parent', name: 'Test Parent', openId: 'test', email: 'test@test.com', createdAt: new Date(), accountStatus: 'approved', onboardingCompleted: true },
      req: {} as any,
      res: {} as any,
    });
    const linkedPlayers = await caller.parentRelations.getLinkedPlayers();

    expect(linkedPlayers).toBeDefined();
    expect(linkedPlayers.length).toBe(2);
    expect(linkedPlayers.some((p: any) => p.id === testChild1Id)).toBe(true);
    expect(linkedPlayers.some((p: any) => p.id === testChild2Id)).toBe(true);
  });

  it('should return player details with proper structure', async () => {
    const caller = appRouter.createCaller({
      user: { id: testParentUserId, role: 'parent', name: 'Test Parent', openId: 'test', email: 'test@test.com', createdAt: new Date(), accountStatus: 'approved', onboardingCompleted: true },
      req: {} as any,
      res: {} as any,
    });
    const linkedPlayers = await caller.parentRelations.getLinkedPlayers();

    const child1 = linkedPlayers.find((p: any) => p.id === testChild1Id);
    expect(child1).toBeDefined();
    expect(child1.firstName).toBe('Child');
    expect(child1.lastName).toBe('One');
    expect(child1.jerseyNumber).toBe(10);
  });

  it('should allow parent to view only linked children (not all players)', async () => {
    const caller = appRouter.createCaller({
      user: { id: testParentUserId, role: 'parent', name: 'Test Parent', openId: 'test', email: 'test@test.com', createdAt: new Date(), accountStatus: 'approved', onboardingCompleted: true },
      req: {} as any,
      res: {} as any,
    });
    
    // Create another player NOT linked to this parent
    const unlinkedPlayerId = await db.createPlayer({
      firstName: 'Unlinked',
      lastName: 'Player',
      dateOfBirth: new Date('2011-01-01'),
      position: 'Defender',
      jerseyNumber: 5,
      teamId: 1,
    });

    const linkedPlayers = await caller.parentRelations.getLinkedPlayers();
    
    // Should only see the 2 linked children, not the unlinked player
    expect(linkedPlayers.length).toBe(2);
    expect(linkedPlayers.some((p: any) => p.id === unlinkedPlayerId)).toBe(false);
  });

  it('should support primary and secondary parent relationships', async () => {
    const relations = await db.getParentPlayerRelations(testParentUserId);
    
    expect(relations.length).toBe(2);
    
    const primaryRelation = relations.find((r: any) => r.playerId === testChild1Id);
    const secondaryRelation = relations.find((r: any) => r.playerId === testChild2Id);
    
    expect(primaryRelation?.isPrimary).toBe(true);
    expect(secondaryRelation?.isPrimary).toBe(false);
  });
});
