/**
 * Football-Data.org API Integration Service
 * Fetches and syncs public football data from football-data.org
 */

import axios, { AxiosInstance } from 'axios';

interface FootballDataConfig {
  apiKey: string;
  baseUrl?: string;
}

interface Competition {
  id: number;
  name: string;
  code: string;
  areaName: string;
  type: string;
  currentSeason: {
    id: number;
    startDate: string;
    endDate: string;
    currentMatchday: number;
  };
}

interface Team {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  areaName: string;
  founded: number;
  venue: string;
}

interface Match {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group: string | null;
  lastUpdated: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  score: {
    winner: string | null;
    duration: string;
    fullTime: { home: number; away: number };
    halfTime: { home: number; away: number };
  };
  odds: any;
  referees: Array<{ id: number; name: string; role: string }>;
}

interface PlayerStats {
  id: number;
  name: string;
  position: string;
  dateOfBirth: string;
  countryOfBirth: string;
  nationality: string;
  shirtNumber: number;
}

export class FootballDataService {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(config: FootballDataConfig) {
    this.apiKey = config.apiKey;
    this.client = axios.create({
      baseURL: config.baseUrl || 'https://api.football-data.org/v4',
      headers: {
        'X-Auth-Token': this.apiKey,
      },
    });
  }

  /**
   * Fetch all available competitions
   */
  async getCompetitions(): Promise<Competition[]> {
    try {
      const response = await this.client.get('/competitions');
      return response.data.competitions || [];
    } catch (error) {
      console.error('Error fetching competitions:', error);
      return [];
    }
  }

  /**
   * Fetch teams for a specific competition
   */
  async getTeamsByCompetition(competitionCode: string): Promise<Team[]> {
    try {
      const response = await this.client.get(`/competitions/${competitionCode}/teams`);
      return response.data.teams || [];
    } catch (error) {
      console.error(`Error fetching teams for ${competitionCode}:`, error);
      return [];
    }
  }

  /**
   * Fetch matches for a specific competition
   */
  async getMatchesByCompetition(
    competitionCode: string,
    filters?: {
      status?: string;
      matchday?: number;
      dateFrom?: string;
      dateTo?: string;
    }
  ): Promise<Match[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.matchday) params.append('matchday', filters.matchday.toString());
      if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters?.dateTo) params.append('dateTo', filters.dateTo);

      const url = `/competitions/${competitionCode}/matches${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.client.get(url);
      return response.data.matches || [];
    } catch (error) {
      console.error(`Error fetching matches for ${competitionCode}:`, error);
      return [];
    }
  }

  /**
   * Fetch standings for a specific competition
   */
  async getStandings(competitionCode: string): Promise<any> {
    try {
      const response = await this.client.get(`/competitions/${competitionCode}/standings`);
      return response.data.standings || [];
    } catch (error) {
      console.error(`Error fetching standings for ${competitionCode}:`, error);
      return [];
    }
  }

  /**
   * Fetch scorers for a specific competition
   */
  async getTopScorers(competitionCode: string, limit: number = 10): Promise<any[]> {
    try {
      const response = await this.client.get(`/competitions/${competitionCode}/scorers?limit=${limit}`);
      return response.data.scorers || [];
    } catch (error) {
      console.error(`Error fetching scorers for ${competitionCode}:`, error);
      return [];
    }
  }

  /**
   * Fetch team details
   */
  async getTeamDetails(teamId: number): Promise<Team | null> {
    try {
      const response = await this.client.get(`/teams/${teamId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching team ${teamId}:`, error);
      return null;
    }
  }

  /**
   * Fetch team matches
   */
  async getTeamMatches(
    teamId: number,
    filters?: {
      status?: string;
      limit?: number;
    }
  ): Promise<Match[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const url = `/teams/${teamId}/matches${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.client.get(url);
      return response.data.matches || [];
    } catch (error) {
      console.error(`Error fetching matches for team ${teamId}:`, error);
      return [];
    }
  }

  /**
   * Fetch player details
   */
  async getPlayerDetails(playerId: number): Promise<PlayerStats | null> {
    try {
      const response = await this.client.get(`/persons/${playerId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching player ${playerId}:`, error);
      return null;
    }
  }

  /**
   * Fetch player matches
   */
  async getPlayerMatches(
    playerId: number,
    filters?: {
      status?: string;
      limit?: number;
    }
  ): Promise<Match[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const url = `/persons/${playerId}/matches${params.toString() ? '?' + params.toString() : ''}`;
      const response = await this.client.get(url);
      return response.data.matches || [];
    } catch (error) {
      console.error(`Error fetching matches for player ${playerId}:`, error);
      return [];
    }
  }

  /**
   * Fetch match details
   */
  async getMatchDetails(matchId: number): Promise<Match | null> {
    try {
      const response = await this.client.get(`/matches/${matchId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching match ${matchId}:`, error);
      return null;
    }
  }

  /**
   * Fetch head-to-head matches between two teams
   */
  async getHeadToHead(teamId1: number, teamId2: number, limit: number = 10): Promise<Match[]> {
    try {
      const response = await this.client.get(`/teams/${teamId1}/matches?opponents=${teamId2}&limit=${limit}`);
      return response.data.matches || [];
    } catch (error) {
      console.error(`Error fetching head-to-head for teams ${teamId1} vs ${teamId2}:`, error);
      return [];
    }
  }
}

/**
 * Create and export a singleton instance of FootballDataService
 */
export function createFootballDataService(): FootballDataService {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error('FOOTBALL_DATA_API_KEY environment variable is not set');
  }

  return new FootballDataService({
    apiKey,
    baseUrl: 'https://api.football-data.org/v4',
  });
}

export default FootballDataService;
