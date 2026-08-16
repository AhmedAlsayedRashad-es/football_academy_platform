import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the database module
vi.mock('./db', () => ({
  getCoachesWithRatings: vi.fn().mockResolvedValue([
    {
      id: 1,
      userId: 10,
      name: 'Coach Ahmed',
      avatarUrl: null,
      specialization: 'technical',
      experience: '10 years experience',
      bio: 'Professional coach',
      qualifications: 'UEFA A License',
      isPublic: true,
      photoUrl: null,
      averageRating: 4.5,
      reviewCount: 12,
      availableSlots: 5,
    },
  ]),
  getCoachReviews: vi.fn().mockResolvedValue([
    { id: 1, coachId: 10, rating: 5, comment: 'Great coach!', createdAt: new Date() },
    { id: 2, coachId: 10, rating: 4, comment: 'Very helpful', createdAt: new Date() },
  ]),
  getCoachAverageRating: vi.fn().mockResolvedValue({ average: 4.5, count: 12 }),
  getAvailableCoachSlots: vi.fn().mockResolvedValue([
    { id: 1, coachId: 10, dayOfWeek: 1, startTime: '09:00', endTime: '10:00', pricePerSession: 500 },
    { id: 2, coachId: 10, dayOfWeek: 3, startTime: '14:00', endTime: '15:00', pricePerSession: 500 },
  ]),
  getActiveTrainingLocations: vi.fn().mockResolvedValue([
    { id: 1, name: 'Main Field', nameAr: 'الملعب الرئيسي', capacity: 2, isActive: true },
    { id: 2, name: 'Indoor Court', nameAr: 'الملعب الداخلي', capacity: 1, isActive: true },
  ]),
  checkBookingConflict: vi.fn().mockResolvedValue(false),
  createPrivateTrainingBooking: vi.fn().mockResolvedValue(1),
  getPlayerPrivateTrainingBookings: vi.fn().mockResolvedValue([
    {
      id: 1,
      coachId: 10,
      playerId: 5,
      sessionDate: new Date('2025-01-15'),
      startTime: '09:00',
      endTime: '10:00',
      status: 'confirmed',
    },
  ]),
  getCoachPrivateTrainingBookings: vi.fn().mockResolvedValue([]),
  createCoachReview: vi.fn().mockResolvedValue(1),
  createCoachScheduleSlot: vi.fn().mockResolvedValue(1),
  getCoachScheduleSlots: vi.fn().mockResolvedValue([]),
  updateCoachScheduleSlot: vi.fn().mockResolvedValue(undefined),
  deleteCoachScheduleSlot: vi.fn().mockResolvedValue(undefined),
  createTrainingLocation: vi.fn().mockResolvedValue(1),
  getAllTrainingLocations: vi.fn().mockResolvedValue([]),
  updateTrainingLocation: vi.fn().mockResolvedValue(undefined),
  getParentPlayerRelations: vi.fn().mockResolvedValue([{ playerId: 5 }]),
  updatePrivateTrainingBooking: vi.fn().mockResolvedValue(undefined),
  cancelPrivateTrainingBooking: vi.fn().mockResolvedValue(undefined),
  getAllPrivateTrainingBookings: vi.fn().mockResolvedValue([]),
}));

import * as db from './db';

describe('privateTraining router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCoaches procedure', () => {
    it('returns coaches with ratings and availability', async () => {
      const coaches = await db.getCoachesWithRatings();
      
      expect(coaches).toHaveLength(1);
      expect(coaches[0].name).toBe('Coach Ahmed');
      expect(coaches[0].averageRating).toBe(4.5);
      expect(coaches[0].reviewCount).toBe(12);
      expect(coaches[0].availableSlots).toBe(5);
    });
  });

  describe('getCoachDetails procedure', () => {
    it('returns coach reviews and rating', async () => {
      const reviews = await db.getCoachReviews(10);
      const rating = await db.getCoachAverageRating(10);
      const slots = await db.getAvailableCoachSlots(10);
      
      expect(reviews).toHaveLength(2);
      expect(rating.average).toBe(4.5);
      expect(rating.count).toBe(12);
      expect(slots).toHaveLength(2);
    });
  });

  describe('getLocations procedure', () => {
    it('returns active training locations', async () => {
      const locations = await db.getActiveTrainingLocations();
      
      expect(locations).toHaveLength(2);
      expect(locations[0].name).toBe('Main Field');
      expect(locations[1].name).toBe('Indoor Court');
    });
  });

  describe('booking conflict check', () => {
    it('returns false when no conflict exists', async () => {
      const hasConflict = await db.checkBookingConflict(1, '2025-01-15', '09:00', '10:00');
      expect(hasConflict).toBe(false);
    });

    it('returns true when conflict exists', async () => {
      vi.mocked(db.checkBookingConflict).mockResolvedValueOnce(true);
      const hasConflict = await db.checkBookingConflict(1, '2025-01-15', '09:00', '10:00');
      expect(hasConflict).toBe(true);
    });
  });

  describe('book procedure', () => {
    it('creates a booking when no conflict', async () => {
      const bookingId = await db.createPrivateTrainingBooking({
        coachId: 10,
        playerId: 5,
        bookedBy: 1,
        locationId: 1,
        sessionDate: new Date('2025-01-15'),
        startTime: '09:00',
        endTime: '10:00',
        status: 'pending',
      });
      
      expect(bookingId).toBe(1);
      expect(db.createPrivateTrainingBooking).toHaveBeenCalled();
    });
  });

  describe('getPlayerBookings procedure', () => {
    it('returns bookings for a player', async () => {
      const bookings = await db.getPlayerPrivateTrainingBookings(5);
      
      expect(bookings).toHaveLength(1);
      expect(bookings[0].playerId).toBe(5);
      expect(bookings[0].status).toBe('confirmed');
    });
  });

  describe('submitReview procedure', () => {
    it('creates a coach review', async () => {
      const reviewId = await db.createCoachReview({
        coachId: 10,
        reviewerId: 1,
        rating: 5,
        comment: 'Excellent session!',
      });
      
      expect(reviewId).toBe(1);
      expect(db.createCoachReview).toHaveBeenCalled();
    });
  });

  describe('coach schedule management', () => {
    it('creates a schedule slot', async () => {
      const slotId = await db.createCoachScheduleSlot({
        coachId: 10,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:00',
        pricePerSession: 500,
        isRecurring: true,
      });
      
      expect(slotId).toBe(1);
    });

    it('updates a schedule slot', async () => {
      await db.updateCoachScheduleSlot(1, { isAvailable: false });
      expect(db.updateCoachScheduleSlot).toHaveBeenCalledWith(1, { isAvailable: false });
    });

    it('deletes a schedule slot', async () => {
      await db.deleteCoachScheduleSlot(1);
      expect(db.deleteCoachScheduleSlot).toHaveBeenCalledWith(1);
    });
  });

  describe('location management', () => {
    it('creates a training location', async () => {
      const locationId = await db.createTrainingLocation({
        name: 'New Field',
        nameAr: 'ملعب جديد',
        capacity: 2,
      });
      
      expect(locationId).toBe(1);
    });
  });

  describe('booking status updates', () => {
    it('confirms a booking', async () => {
      await db.updatePrivateTrainingBooking(1, { status: 'confirmed' });
      expect(db.updatePrivateTrainingBooking).toHaveBeenCalledWith(1, { status: 'confirmed' });
    });

    it('cancels a booking', async () => {
      await db.cancelPrivateTrainingBooking(1, 'Schedule conflict');
      expect(db.cancelPrivateTrainingBooking).toHaveBeenCalledWith(1, 'Schedule conflict');
    });
  });
});
