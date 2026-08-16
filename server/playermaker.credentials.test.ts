import { describe, it, expect } from 'vitest';
import { authenticatePlayerMaker } from './playermakerApi';

describe('PlayerMaker API Credentials Test', () => {
  it('should successfully authenticate with PlayerMaker API using provided credentials', async () => {
    const clientKey = process.env.PLAYERMAKER_CLIENT_KEY;
    const clientSecret = process.env.PLAYERMAKER_CLIENT_SECRET;
    const teamId = process.env.PLAYERMAKER_TEAM_ID;
    const teamCode = process.env.PLAYERMAKER_TEAM_CODE;

    // Verify environment variables are set
    expect(clientKey).toBeDefined();
    expect(clientSecret).toBeDefined();
    expect(teamId).toBe('6591');
    expect(teamCode).toBe('cLIo');

    // Test authentication
    try {
      const result = await authenticatePlayerMaker(clientKey!, clientSecret!);
      
      // Verify we got a token
      expect(result.token).toBeDefined();
      expect(typeof result.token).toBe('string');
      expect(result.token.length).toBeGreaterThan(0);
      
      // Verify expiration date is in the future
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
      
      console.log('✅ PlayerMaker API authentication successful');
      console.log(`Token expires at: ${result.expiresAt.toISOString()}`);
    } catch (error) {
      // If authentication fails, provide detailed error
      console.error('❌ PlayerMaker API authentication failed:', error);
      throw error;
    }
  }, 30000); // 30 second timeout for API call
});
