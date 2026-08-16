import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { teamCoaches, teams, users } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

describe('Team Coach Assignment', () => {
  let db: Awaited<ReturnType<typeof getDb>>;
  let testTeamId: number;
  let testCoachUserId: number;
  let testAssignmentId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Check if we have existing teams and coaches to use
    const existingTeams = await db.select().from(teams).limit(1);
    const existingCoaches = await db.select().from(users).where(eq(users.role, 'coach')).limit(1);

    if (existingTeams.length > 0) {
      testTeamId = existingTeams[0].id;
    } else {
      // Create a test team
      const result = await db.insert(teams).values({
        name: 'Test Team for Coach Assignment',
        ageGroup: 'U16',
        teamType: 'academy',
      });
      testTeamId = result[0].insertId;
    }

    if (existingCoaches.length > 0) {
      testCoachUserId = existingCoaches[0].id;
    } else {
      // Create a test coach user
      const result = await db.insert(users).values({
        openId: `test_coach_${Date.now()}`,
        name: 'Test Coach',
        email: 'testcoach@test.com',
        role: 'coach',
        accountStatus: 'approved',
      });
      testCoachUserId = result[0].insertId;
    }
  });

  afterAll(async () => {
    // Clean up test assignment if created
    if (db && testAssignmentId) {
      await db.delete(teamCoaches).where(eq(teamCoaches.id, testAssignmentId));
    }
  });

  it('should create a team coach assignment', async () => {
    if (!db) throw new Error('Database not available');

    // First, clean up any existing assignment for this coach-team pair
    await db.delete(teamCoaches).where(
      and(
        eq(teamCoaches.teamId, testTeamId),
        eq(teamCoaches.coachUserId, testCoachUserId)
      )
    );

    const result = await db.insert(teamCoaches).values({
      teamId: testTeamId,
      coachUserId: testCoachUserId,
      role: 'assistant_coach',
      isPrimary: false,
    });

    testAssignmentId = result[0].insertId;
    expect(testAssignmentId).toBeGreaterThan(0);
  });

  it('should retrieve team coaches', async () => {
    if (!db) throw new Error('Database not available');

    const coaches = await db.select({
      id: teamCoaches.id,
      teamId: teamCoaches.teamId,
      coachUserId: teamCoaches.coachUserId,
      role: teamCoaches.role,
      isPrimary: teamCoaches.isPrimary,
      coachName: users.name,
    })
    .from(teamCoaches)
    .leftJoin(users, eq(teamCoaches.coachUserId, users.id))
    .where(eq(teamCoaches.teamId, testTeamId));

    expect(coaches.length).toBeGreaterThanOrEqual(1);
    const ourAssignment = coaches.find(c => c.id === testAssignmentId);
    expect(ourAssignment).toBeDefined();
    expect(ourAssignment?.role).toBe('assistant_coach');
  });

  it('should update coach role', async () => {
    if (!db || !testAssignmentId) throw new Error('Test setup incomplete');

    await db.update(teamCoaches)
      .set({ role: 'head_coach', isPrimary: true })
      .where(eq(teamCoaches.id, testAssignmentId));

    const updated = await db.select()
      .from(teamCoaches)
      .where(eq(teamCoaches.id, testAssignmentId))
      .limit(1);

    expect(updated[0].role).toBe('head_coach');
    expect(updated[0].isPrimary).toBe(true);
  });

  it('should get coach teams', async () => {
    if (!db) throw new Error('Database not available');

    const coachTeams = await db.select({
      id: teamCoaches.id,
      teamId: teamCoaches.teamId,
      role: teamCoaches.role,
      teamName: teams.name,
      teamType: teams.teamType,
    })
    .from(teamCoaches)
    .leftJoin(teams, eq(teamCoaches.teamId, teams.id))
    .where(eq(teamCoaches.coachUserId, testCoachUserId));

    expect(coachTeams.length).toBeGreaterThanOrEqual(1);
  });

  it('should remove coach from team', async () => {
    if (!db || !testAssignmentId) throw new Error('Test setup incomplete');

    await db.delete(teamCoaches).where(eq(teamCoaches.id, testAssignmentId));

    const deleted = await db.select()
      .from(teamCoaches)
      .where(eq(teamCoaches.id, testAssignmentId))
      .limit(1);

    expect(deleted.length).toBe(0);
    testAssignmentId = 0; // Reset so cleanup doesn't try to delete again
  });
});

describe('Teams by Type', () => {
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
  });

  it('should get teams by type', async () => {
    if (!db) throw new Error('Database not available');

    const mainTeams = await db.select()
      .from(teams)
      .where(eq(teams.teamType, 'main'));

    const academyTeams = await db.select()
      .from(teams)
      .where(eq(teams.teamType, 'academy'));

    // Just verify the queries work - actual counts depend on data
    expect(Array.isArray(mainTeams)).toBe(true);
    expect(Array.isArray(academyTeams)).toBe(true);
  });
});
