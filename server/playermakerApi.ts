/**
 * PlayerMaker API Client
 * Based on Official PlayerMaker API Documentation
 * API Base URL: https://b2b.playermaker.co.uk/api/b2b/v1
 * Rate Limit: once every 15 minutes
 */

export interface PlayerMakerSettings {
  clientKey: string;
  clientSecret: string;
  clientTeamId: string;
  teamCode?: string;
  token?: string | null;
  tokenExpiresOn?: Date | null;
  clubName?: string | null;
}

interface LoginResponse {
  token: string;
  expiresOn: number; // epoch GMT in milliseconds
  userId: number;
  email: string;
  clubName: string;
  teams: Array<{
    id: number;
    teamName: string;
    seasonName: string;
    teamPicture?: string;
  }>;
}

interface SessionDataResponse {
  lastSessionEndTimeUTC: number;
  isLastBulk: boolean;
  headers: string[];
  values: any[][];
}

export interface Session {
  session_id: string;
  session_type: 'training' | 'match';
  date: string;
  duration?: number;
  location?: string;
  notes?: string;
}

export interface PlayerMetrics {
  session_id: string;
  player_id: string;
  player_name: string;
  age_group?: string;
  total_touches: number;
  left_foot_touches: number;
  right_foot_touches: number;
  distance_covered: number;
  top_speed: number;
  average_speed: number;
  sprint_count: number;
  acceleration_count: number;
  deceleration_count: number;
  high_intensity_distance: number;
}

const API_BASE_URL = 'https://b2b.playermaker.co.uk/api/b2b/v1';
const RATE_LIMIT_DELAY = 900000; // 15 minutes between requests (as per docs)
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 60000; // 1 minute initial retry delay

let lastRequestTime = 0;
let lastSuccessfulSyncTime = 0; // Track when we last successfully synced

/**
 * Check if we should wait before making another request
 * Returns the number of milliseconds to wait, or 0 if we can proceed
 */
export function getWaitTimeBeforeSync(): number {
  const now = Date.now();
  const timeSinceLastSync = now - lastSuccessfulSyncTime;
  
  // If we synced less than 15 minutes ago, return the remaining wait time
  if (lastSuccessfulSyncTime > 0 && timeSinceLastSync < RATE_LIMIT_DELAY) {
    return RATE_LIMIT_DELAY - timeSinceLastSync;
  }
  
  return 0;
}

/**
 * Format wait time as human-readable string
 */
export function formatWaitTime(ms: number): string {
  const minutes = Math.ceil(ms / 60000);
  if (minutes <= 1) return 'less than a minute';
  return `${minutes} minutes`;
}

/**
 * Rate limiter to ensure we don't exceed rate limits
 */
async function rateLimitedRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  // Only apply rate limit for data fetching, not for login
  if (timeSinceLastRequest < 1000) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  lastRequestTime = Date.now();
  return requestFn();
}

/**
 * Execute request with exponential backoff retry for rate limiting
 */
async function executeWithRetry<T>(
  requestFn: () => Promise<Response>,
  parseResponse: (response: Response) => Promise<T>,
  context: string
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await rateLimitedRequest(requestFn);
      
      // Check for rate limiting (412 or 429)
      if (response.status === 412 || response.status === 429) {
        const errorText = await response.text();
        let errorJson: any = {};
        try {
          errorJson = JSON.parse(errorText);
        } catch (e) {}
        
        // Calculate wait time with exponential backoff
        const waitTime = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        const waitMinutes = Math.ceil(waitTime / 60000);
        
        console.log(`[PlayerMaker] Rate limited (${response.status}), attempt ${attempt + 1}/${MAX_RETRIES}`);
        console.log(`[PlayerMaker] Waiting ${waitMinutes} minute(s) before retry...`);
        
        if (attempt < MAX_RETRIES - 1) {
          // Wait and retry
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          // Final attempt failed
          const waitTimeForUser = getWaitTimeBeforeSync();
          const waitMsg = waitTimeForUser > 0 
            ? `Please wait ${formatWaitTime(waitTimeForUser)} before trying again.`
            : 'Please wait 15 minutes before trying again.';
          
          throw new Error(
            `Rate limit exceeded. The PlayerMaker API limits requests to once every 15 minutes. ${waitMsg}`
          );
        }
      }
      
      // Check for other errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${context} failed: ${response.status} - ${errorText}`);
      }
      
      // Success - update last successful sync time
      lastSuccessfulSyncTime = Date.now();
      return parseResponse(response);
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry for non-rate-limit errors
      if (!lastError.message.includes('Rate limit') && 
          !lastError.message.includes('412') && 
          !lastError.message.includes('429') &&
          !lastError.message.includes('Too many requests')) {
        throw lastError;
      }
    }
  }
  
  throw lastError || new Error(`${context} failed after ${MAX_RETRIES} attempts`);
}

/**
 * Authenticate with PlayerMaker API and get access token
 * POST https://b2b.playermaker.co.uk/api/b2b/v1/account/login
 */
export async function authenticatePlayerMaker(
  clientKey: string,
  clientSecret: string,
  clientTeamId: string
): Promise<{ token: string; expiresAt: Date; clubName: string; teams: any[] }> {


  
  const response = await rateLimitedRequest(async () => {
    return fetch(`${API_BASE_URL}/account/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientSecret: clientSecret,
        clientKey: clientKey,
        clientTeamId: parseInt(clientTeamId, 10) || clientTeamId,
      }),
    });
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[PlayerMaker] Auth error:', errorText);
    
    let errorMessage = `PlayerMaker authentication failed: ${response.status}`;
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.errorMessageId === 'pmErrorClientLoginBadCredentials') {
        errorMessage = 'Invalid PlayerMaker credentials. Please check your Client Key and Client Secret.';
      } else if (errorJson.errorMessageId === 'pmErrorStaffNotRelatedToTeam') {
        errorMessage = 'Invalid Team ID. Please check that you are using the correct Team ID for your account.';
      } else if (errorJson.errorMessage) {
        errorMessage = errorJson.errorMessage;
      }
    } catch (e) {
      errorMessage += ` - ${errorText}`;
    }
    
    throw new Error(errorMessage);
  }

  const data: LoginResponse = await response.json();
  
  // expiresOn is epoch in milliseconds
  const expiresAt = new Date(data.expiresOn);

  return {
    token: data.token,
    expiresAt,
    clubName: data.clubName,
    teams: data.teams || [],
  };
}

/**
 * Check if token is expired or about to expire (within 30 minutes)
 * Token is valid for 5 hours from last usage
 */
export function isTokenExpired(tokenExpiresOn: Date | null | undefined): boolean {
  if (!tokenExpiresOn) return true;
  
  const now = new Date();
  const expiryTime = new Date(tokenExpiresOn);
  const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);
  
  return expiryTime <= thirtyMinutesFromNow;
}

/**
 * Get valid token, refreshing if necessary
 */
export async function getValidToken(settings: PlayerMakerSettings): Promise<string> {
  if (settings.token && !isTokenExpired(settings.tokenExpiresOn)) {
    return settings.token;
  }

  // Token expired or missing, get new one
  const { token } = await authenticatePlayerMaker(
    settings.clientKey,
    settings.clientSecret,
    settings.clientTeamId
  );

  return token;
}

/**
 * Fetch session data from PlayerMaker API
 * POST https://b2b.playermaker.co.uk/api/b2b/v1/team/{teamId}/session-data
 */
export async function fetchPlayerMakerSessions(
  token: string,
  teamId: string,
  options: {
    sessionType?: 'training' | 'match' | 'all';
    daysBack?: number;
  } = {}
): Promise<Session[]> {
  const { sessionType = 'all', daysBack = 30 } = options;

  const now = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - daysBack);
  
  // Convert to epoch milliseconds (13 digits)
  const epochStartDateGMT = fromDate.getTime();
  const epochEndDateGMT = now.getTime();

  const url = `${API_BASE_URL}/team/${teamId}/session-data`;

  const response = await rateLimitedRequest(async () => {
    return fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `berear ${token}`, // Note: typo is intentional per API docs
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionType: sessionType,
        epochStartDateGMT: epochStartDateGMT,
        epochEndDateGMT: epochEndDateGMT,
      }),
    });
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('[PlayerMaker] Sessions error:', error);
    throw new Error(`Failed to fetch sessions: ${response.status} - ${error}`);
  }

  const data: SessionDataResponse = await response.json();

  
  // Parse the response into Session objects
  // The API returns headers and values arrays
  const sessions: Session[] = [];
  
  if (data.values && data.headers) {
    const headerMap: Record<string, number> = {};
    data.headers.forEach((h, i) => headerMap[h.toLowerCase()] = i);
    
    for (const row of data.values) {
      // Try to extract session info from the row based on headers
      const session: Session = {
        session_id: String(row[headerMap['sessionid']] || row[headerMap['session_id']] || row[0] || ''),
        session_type: (row[headerMap['sessiontype']] || row[headerMap['session_type']] || 'training') as 'training' | 'match',
        date: String(row[headerMap['date']] || row[headerMap['sessiondate']] || new Date().toISOString()),
        duration: Number(row[headerMap['duration']] || row[headerMap['sessionduration']] || 0),
        notes: String(row[headerMap['notes']] || row[headerMap['tag']] || ''),
      };
      sessions.push(session);
    }
  }

  return sessions;
}

/**
 * Fetch player metrics for a specific session
 * Note: The API returns all metrics in the session-data response
 */
export async function fetchSessionMetrics(
  token: string,
  teamId: string,
  sessionId: string
): Promise<PlayerMetrics[]> {
  // In the PlayerMaker API, metrics are included in the session-data response
  // This function is kept for compatibility but may need adjustment based on actual API structure
  return [];
}

/**
 * Parse metrics from session data response
 */
export function parseMetricsFromSessionData(
  headers: string[],
  values: any[][]
): PlayerMetrics[] {
  const metrics: PlayerMetrics[] = [];
  
  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => headerMap[h.toLowerCase()] = i);
  
  for (const row of values) {
    const metric: PlayerMetrics = {
      session_id: String(row[headerMap['sessionid']] || row[headerMap['session_id']] || ''),
      player_id: String(row[headerMap['playerid']] || row[headerMap['player_id']] || ''),
      player_name: String(row[headerMap['playername']] || row[headerMap['player_name']] || row[headerMap['name']] || 'Unknown'),
      age_group: String(row[headerMap['agegroup']] || row[headerMap['age_group']] || ''),
      total_touches: Number(row[headerMap['totaltouches']] || row[headerMap['total_touches']] || row[headerMap['touches']] || 0),
      left_foot_touches: Number(row[headerMap['leftfoottouches']] || row[headerMap['left_foot_touches']] || row[headerMap['lefttouches']] || 0),
      right_foot_touches: Number(row[headerMap['rightfoottouches']] || row[headerMap['right_foot_touches']] || row[headerMap['righttouches']] || 0),
      distance_covered: Number(row[headerMap['distancecovered']] || row[headerMap['distance_covered']] || row[headerMap['distance']] || 0),
      top_speed: Number(row[headerMap['topspeed']] || row[headerMap['top_speed']] || row[headerMap['maxspeed']] || 0),
      average_speed: Number(row[headerMap['averagespeed']] || row[headerMap['average_speed']] || row[headerMap['avgspeed']] || 0),
      sprint_count: Number(row[headerMap['sprintcount']] || row[headerMap['sprint_count']] || row[headerMap['sprints']] || 0),
      acceleration_count: Number(row[headerMap['accelerationcount']] || row[headerMap['acceleration_count']] || row[headerMap['accelerations']] || 0),
      deceleration_count: Number(row[headerMap['decelerationcount']] || row[headerMap['deceleration_count']] || row[headerMap['decelerations']] || 0),
      high_intensity_distance: Number(row[headerMap['highintensitydistance']] || row[headerMap['high_intensity_distance']] || row[headerMap['hirdistance']] || 0),
    };
    
    if (metric.player_id || metric.player_name !== 'Unknown') {
      metrics.push(metric);
    }
  }
  
  return metrics;
}

/**
 * Test connection to PlayerMaker API
 */
export async function testPlayerMakerConnection(
  clientKey: string,
  clientSecret: string,
  teamId: string
): Promise<{ success: boolean; message: string; clubName?: string }> {
  try {
    
    // Try to authenticate
    const { token, clubName, teams } = await authenticatePlayerMaker(clientKey, clientSecret, teamId);



    return {
      success: true,
      message: `Connection successful! Connected to ${clubName}`,
      clubName: clubName,
    };
  } catch (error) {
    console.error('[PlayerMaker] Connection test failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Sync all data from PlayerMaker API with automatic retry for rate limiting
 */
export async function syncPlayerMakerData(
  settings: PlayerMakerSettings,
  options: {
    sessionType?: 'training' | 'match' | 'all';
    daysBack?: number;
  } = {}
): Promise<{
  sessions: Session[];
  metrics: PlayerMetrics[];
  token: string;
  tokenExpiresAt: Date;
}> {
  
  // Check if we should wait before syncing
  const waitTime = getWaitTimeBeforeSync();
  if (waitTime > 0) {
    const waitMsg = formatWaitTime(waitTime);
    throw new Error(
      `Rate limit active. Please wait ${waitMsg} before syncing again. ` +
      `The PlayerMaker API limits requests to once every 15 minutes.`
    );
  }
  
  // Get valid token (authenticate if needed)
  const { token, expiresAt, clubName } = await authenticatePlayerMaker(
    settings.clientKey,
    settings.clientSecret,
    settings.clientTeamId
  );

  // Fetch session data (includes metrics)
  const now = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - (options.daysBack || 30));
  
  const epochStartDateGMT = fromDate.getTime();
  const epochEndDateGMT = now.getTime();

  const url = `${API_BASE_URL}/team/${settings.clientTeamId}/session-data`;
  
  // Use executeWithRetry for automatic rate limit handling
  const data = await executeWithRetry<SessionDataResponse>(
    async () => {
      return fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `berear ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionType: options.sessionType || 'all',
          epochStartDateGMT: epochStartDateGMT,
          epochEndDateGMT: epochEndDateGMT,
        }),
      });
    },
    async (response) => response.json(),
    'Sync data'
  );



  // Parse sessions and metrics from the response
  const sessions: Session[] = [];
  const metrics: PlayerMetrics[] = [];
  
  if (data.values && data.headers) {
    const headerMap: Record<string, number> = {};
    data.headers.forEach((h, i) => headerMap[h.toLowerCase().replace(/\s+/g, '')] = i);
    
    console.log('[PlayerMaker] Header map:', Object.keys(headerMap));
    
    // Track unique sessions
    const sessionMap = new Map<string, Session>();
    
    for (const row of data.values) {
      // Extract session ID
      const sessionId = String(
        row[headerMap['sessionid']] || 
        row[headerMap['session_id']] || 
        row[headerMap['id']] || 
        `session_${Date.now()}_${Math.random()}`
      );
      
      // Add session if not already tracked
      if (!sessionMap.has(sessionId)) {
        const session: Session = {
          session_id: sessionId,
          session_type: (String(row[headerMap['sessiontype']] || row[headerMap['type']] || 'training').toLowerCase() === 'match' ? 'match' : 'training') as 'training' | 'match',
          date: String(row[headerMap['date']] || row[headerMap['sessiondate']] || new Date().toISOString()),
          duration: Number(row[headerMap['duration']] || row[headerMap['sessionduration']] || 0),
          notes: String(row[headerMap['notes']] || row[headerMap['tag']] || row[headerMap['phase']] || ''),
        };
        sessionMap.set(sessionId, session);
      }
      
      // Extract player metrics
      const metric: PlayerMetrics = {
        session_id: sessionId,
        player_id: String(row[headerMap['playerid']] || row[headerMap['player_id']] || row[headerMap['userid']] || ''),
        player_name: String(row[headerMap['playername']] || row[headerMap['name']] || row[headerMap['firstname']] || 'Unknown'),
        age_group: String(row[headerMap['agegroup']] || row[headerMap['teamname']] || ''),
        total_touches: Number(row[headerMap['totaltouches']] || row[headerMap['touches']] || 0),
        left_foot_touches: Number(row[headerMap['leftfoottouches']] || row[headerMap['lefttouches']] || 0),
        right_foot_touches: Number(row[headerMap['rightfoottouches']] || row[headerMap['righttouches']] || 0),
        distance_covered: Number(row[headerMap['distancecovered']] || row[headerMap['distance']] || row[headerMap['totaldistance']] || 0),
        top_speed: Number(row[headerMap['topspeed']] || row[headerMap['maxspeed']] || 0),
        average_speed: Number(row[headerMap['averagespeed']] || row[headerMap['avgspeed']] || 0),
        sprint_count: Number(row[headerMap['sprintcount']] || row[headerMap['sprints']] || row[headerMap['numberofsprints']] || 0),
        acceleration_count: Number(row[headerMap['accelerationcount']] || row[headerMap['accelerations']] || 0),
        deceleration_count: Number(row[headerMap['decelerationcount']] || row[headerMap['decelerations']] || 0),
        high_intensity_distance: Number(row[headerMap['highintensitydistance']] || row[headerMap['hirdistance']] || row[headerMap['hid']] || 0),
      };
      
      if (metric.player_id || metric.player_name !== 'Unknown') {
        metrics.push(metric);
      }
    }
    
    sessions.push(...sessionMap.values());
  }



  return {
    sessions,
    metrics,
    token,
    tokenExpiresAt: expiresAt,
  };
}
