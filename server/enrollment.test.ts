import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';

describe('Enrollment Submission', () => {
  const uniqueEmail = `test-${Date.now()}@enrollment.com`;

  it('should submit enrollment application successfully', async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const enrollmentData = {
      studentFirstName: 'Test',
      studentLastName: 'Student',
      dateOfBirth: '2010-01-01',
      gender: 'male',
      parentFirstName: 'Test',
      parentLastName: 'Parent',
      parentEmail: uniqueEmail,
      parentPhone: '+1234567890',
      program: 'beginner',
      ageGroup: 'U12',
      preferredPosition: 'midfielder',
      previousExperience: 'Played for school team',
      medicalConditions: 'None',
      emergencyContact: '+0987654321',
    };

    const result = await caller.enrollments.submit(enrollmentData);
    expect(result.success).toBe(true);
  });

  it('should validate required fields', async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const invalidData = {
      studentFirstName: '',
      studentLastName: 'Student',
      dateOfBirth: '2010-01-01',
      gender: 'male',
      parentFirstName: 'Test',
      parentLastName: 'Parent',
      parentEmail: `test-invalid-${Date.now()}@enrollment.com`,
      parentPhone: '+1234567890',
      program: 'beginner',
      ageGroup: '',
      preferredPosition: '',
      previousExperience: '',
      medicalConditions: '',
      emergencyContact: '',
    };

    await expect(caller.enrollments.submit(invalidData)).rejects.toThrow();
  });

  it('should allow admin to fetch all enrollments', async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, role: 'admin', name: 'Admin', email: 'admin@test.com', openId: 'admin123' },
      req: {} as any,
      res: {} as any,
    });

    const enrollments = await caller.enrollments.getAll();
    expect(Array.isArray(enrollments)).toBe(true);
  });
});
