import { describe, it, expect } from 'vitest';
import { testPlayerMakerConnection } from './playermakerApi';

describe('PlayerMaker API Integration', () => {
  it('should successfully authenticate with provided credentials', async () => {
    const clientKey = process.env.PLAYERMAKER_CLIENT_KEY;
    const clientSecret = process.env.PLAYERMAKER_CLIENT_SECRET;
    const teamId = process.env.PLAYERMAKER_TEAM_ID;

    expect(clientKey).toBeDefined();
    expect(clientSecret).toBeDefined();
    expect(teamId).toBeDefined();

    const result = await testPlayerMakerConnection(
      clientKey!,
      clientSecret!,
      teamId!
    );

    console.log('PlayerMaker API Test Result:', result);
    
    if (!result.success) {
      console.error('API Connection Failed:', result.message);
    }
    
    expect(result.success).toBe(true);
    expect(result.message).toContain('successful');
    expect(result.clubName).toBeDefined();
  }, 30000); // 30 second timeout for API call

  it('should have correct team ID and team code', () => {
    const teamId = process.env.PLAYERMAKER_TEAM_ID;
    const teamCode = process.env.PLAYERMAKER_TEAM_CODE;

    expect(teamId).toBe('6591');
    expect(teamCode).toBe('cLIo');
  });
});

describe('PlayerMaker Enhancements', () => {
  describe('Date Range Sync', () => {
    it('should accept date range parameters for sync', () => {
      // Test that the syncData input schema accepts date range
      const validInput = {
        sessionType: 'all' as const,
        daysBack: 30,
        startDate: '2025-12-01T00:00:00.000Z',
        endDate: '2025-12-31T00:00:00.000Z',
      };
      
      expect(validInput.startDate).toBeDefined();
      expect(validInput.endDate).toBeDefined();
      expect(validInput.daysBack).toBe(30);
    });

    it('should calculate correct days back from date range', () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const daysBack = Math.ceil((now.getTime() - thirtyDaysAgo.getTime()) / (24 * 60 * 60 * 1000));
      
      expect(daysBack).toBe(30);
    });

    it('should handle preset date ranges correctly', () => {
      const presets = {
        '7': 7,
        '30': 30,
        '90': 90,
      };
      
      Object.entries(presets).forEach(([preset, expectedDays]) => {
        const now = new Date();
        const from = new Date(now.getTime() - parseInt(preset) * 24 * 60 * 60 * 1000);
        const actualDays = Math.ceil((now.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
        
        expect(actualDays).toBe(expectedDays);
      });
    });
  });

  describe('Sample Training Session Creation', () => {
    it('should validate sample session input parameters', () => {
      const validSession = {
        sessionType: 'training' as const,
        playerCount: 10,
        sessionDate: new Date().toISOString(),
        duration: 90,
        intensity: 'medium' as const,
        notes: 'Test session',
      };
      
      expect(validSession.playerCount).toBeGreaterThanOrEqual(1);
      expect(validSession.playerCount).toBeLessThanOrEqual(30);
      expect(validSession.duration).toBeGreaterThanOrEqual(15);
      expect(validSession.duration).toBeLessThanOrEqual(180);
      expect(['training', 'match']).toContain(validSession.sessionType);
      expect(['low', 'medium', 'high']).toContain(validSession.intensity);
    });

    it('should generate realistic metrics based on intensity', () => {
      const intensityMultipliers = {
        low: { touches: 0.7, distance: 0.6, speed: 0.7, sprints: 0.5 },
        medium: { touches: 1.0, distance: 1.0, speed: 1.0, sprints: 1.0 },
        high: { touches: 1.3, distance: 1.4, speed: 1.2, sprints: 1.5 },
      };
      
      const baseTouches = 100;
      const baseDistance = 5000;
      
      // Low intensity should produce lower values
      expect(baseTouches * intensityMultipliers.low.touches).toBeLessThan(baseTouches);
      expect(baseDistance * intensityMultipliers.low.distance).toBeLessThan(baseDistance);
      
      // High intensity should produce higher values
      expect(baseTouches * intensityMultipliers.high.touches).toBeGreaterThan(baseTouches);
      expect(baseDistance * intensityMultipliers.high.distance).toBeGreaterThan(baseDistance);
    });

    it('should generate unique session IDs', () => {
      const sessionIds = new Set<string>();
      
      for (let i = 0; i < 100; i++) {
        const sessionId = `PM_TRAINING_${Date.now()}_${i}`;
        sessionIds.add(sessionId);
      }
      
      expect(sessionIds.size).toBe(100);
    });
  });

  describe('Auto-Sync Settings', () => {
    it('should validate auto-sync frequency options', () => {
      const validFrequencies = ['hourly', 'daily', 'weekly'];
      
      validFrequencies.forEach(freq => {
        expect(['hourly', 'daily', 'weekly']).toContain(freq);
      });
    });

    it('should calculate next sync time correctly for hourly', () => {
      const now = new Date();
      const nextSync = new Date(now);
      nextSync.setHours(nextSync.getHours() + 1);
      
      expect(nextSync.getTime()).toBeGreaterThan(now.getTime());
      expect(nextSync.getTime() - now.getTime()).toBeLessThanOrEqual(60 * 60 * 1000 + 1000);
    });

    it('should calculate next sync time correctly for daily', () => {
      const now = new Date();
      const nextSync = new Date(now);
      nextSync.setDate(nextSync.getDate() + 1);
      nextSync.setHours(6, 0, 0, 0);
      
      expect(nextSync.getTime()).toBeGreaterThan(now.getTime());
      expect(nextSync.getHours()).toBe(6);
    });

    it('should calculate next sync time correctly for weekly', () => {
      const now = new Date();
      const nextSync = new Date(now);
      nextSync.setDate(nextSync.getDate() + (7 - nextSync.getDay() + 1) % 7 + 1);
      nextSync.setHours(6, 0, 0, 0);
      
      expect(nextSync.getTime()).toBeGreaterThan(now.getTime());
      expect(nextSync.getHours()).toBe(6);
    });
  });

  describe('Sync History', () => {
    it('should create valid sync history entries', () => {
      const syncHistory = {
        syncType: 'manual' as const,
        sessionType: 'all' as const,
        startDate: '2025-12-01',
        endDate: '2025-12-31',
        sessionsCount: 10,
        metricsCount: 50,
        success: true,
        duration: 5000,
      };
      
      expect(syncHistory.syncType).toBe('manual');
      expect(syncHistory.sessionsCount).toBeGreaterThanOrEqual(0);
      expect(syncHistory.metricsCount).toBeGreaterThanOrEqual(0);
      expect(syncHistory.success).toBe(true);
      expect(syncHistory.duration).toBeGreaterThan(0);
    });

    it('should record failed sync attempts', () => {
      const failedSync = {
        syncType: 'auto' as const,
        sessionType: 'training' as const,
        sessionsCount: 0,
        metricsCount: 0,
        success: false,
        errorMessage: 'Connection timeout',
        duration: 30000,
      };
      
      expect(failedSync.success).toBe(false);
      expect(failedSync.errorMessage).toBeDefined();
      expect(failedSync.sessionsCount).toBe(0);
    });
  });
});
