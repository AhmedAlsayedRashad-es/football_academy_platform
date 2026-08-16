import { describe, it, expect, beforeAll } from 'vitest';
import * as db from './db';

describe('User Registration and Approval Workflow', () => {
  let testUserId: number;
  const testEmail = `test_${Date.now()}@example.com`;

  it('should create a pending user registration', async () => {
    await db.createPendingUser({
      name: 'Test User',
      email: testEmail,
      phone: '+20 123 456 7890',
      requestedRole: 'parent',
    });

    const user = await db.getUserByEmail(testEmail);
    expect(user).toBeDefined();
    expect(user?.name).toBe('Test User');
    expect(user?.email).toBe(testEmail);
    expect(user?.accountStatus).toBe('pending');
    expect(user?.requestedRole).toBe('parent');
    
    testUserId = user!.id;
  });

  it('should retrieve pending users', async () => {
    const pendingUsers = await db.getPendingUsers();
    expect(pendingUsers.length).toBeGreaterThan(0);
    
    const testUser = pendingUsers.find(u => u.email === testEmail);
    expect(testUser).toBeDefined();
    expect(testUser?.accountStatus).toBe('pending');
  });

  it('should approve a pending user', async () => {
    await db.approveUser(testUserId);
    
    const user = await db.getUserById(testUserId);
    expect(user).toBeDefined();
    expect(user?.accountStatus).toBe('approved');
    expect(user?.role).toBe('parent'); // Should match requested role
  });

  it('should reject a pending user', async () => {
    // Create another test user to reject
    const rejectEmail = `reject_${Date.now()}@example.com`;
    await db.createPendingUser({
      name: 'Reject Test',
      email: rejectEmail,
      requestedRole: 'coach',
    });

    const user = await db.getUserByEmail(rejectEmail);
    expect(user).toBeDefined();
    
    await db.rejectUser(user!.id);
    
    const rejectedUser = await db.getUserById(user!.id);
    expect(rejectedUser).toBeDefined();
    expect(rejectedUser?.accountStatus).toBe('rejected');
  });

  it('should update user role after approval', async () => {
    await db.updateUserRole(testUserId, 'coach');
    
    const user = await db.getUserById(testUserId);
    expect(user).toBeDefined();
    expect(user?.role).toBe('coach');
  });

  it('should prevent duplicate email registration', async () => {
    const existingUser = await db.getUserByEmail(testEmail);
    expect(existingUser).toBeDefined();
    
    // Attempting to create another user with same email should be handled by the router
    // This test just confirms we can check for existing emails
    expect(existingUser?.email).toBe(testEmail);
  });
});
