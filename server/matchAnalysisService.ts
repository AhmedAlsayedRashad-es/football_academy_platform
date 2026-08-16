/**
 * Match Analysis AI Service
 * Provides comprehensive match analysis with performance metrics and insights
 */

interface PlayerPerformanceData {
  playerId: number;
  playerName: string;
  position: string;
  minutesPlayed: number;
  goals: number;
  assists: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  fouls: number;
  yellowCards: number;
  redCards: number;
  dribbles: number;
  dribbleSuccessRate: number;
  aerialDuels: number;
  aerialDuelSuccessRate: number;
  keyPasses: number;
  crossesAccurate: number;
  distanceCovered: number;
  sprintCount: number;
}

interface MatchPerformanceMetrics {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  passes: number;
  passAccuracy: number;
  tackles: number;
  interceptions: number;
  fouls: number;
  corners: number;
  crosses: number;
  crossAccuracy: number;
  offsides: number;
  yellowCards: number;
  redCards: number;
}

interface MatchAnalysisResult {
  matchId: number;
  homeTeamAnalysis: {
    teamName: string;
    metrics: MatchPerformanceMetrics;
    playerAnalysis: PlayerPerformanceData[];
    formationUsed: string;
    tacticalApproach: string;
    strengths: string[];
    weaknesses: string[];
    keyPerformers: string[];
    rating: number;
  };
  awayTeamAnalysis: {
    teamName: string;
    metrics: MatchPerformanceMetrics;
    playerAnalysis: PlayerPerformanceData[];
    formationUsed: string;
    tacticalApproach: string;
    strengths: string[];
    weaknesses: string[];
    keyPerformers: string[];
    rating: number;
  };
  matchInsights: {
    keyMoments: Array<{
      minute: number;
      description: string;
      type: 'goal' | 'chance' | 'tackle' | 'substitution' | 'injury' | 'red_card';
      team: string;
    }>;
    turningPoints: string[];
    tacticalShifts: Array<{
      minute: number;
      team: string;
      description: string;
    }>;
    decisionMoments: string[];
  };
  performanceComparison: {
    dominantTeam: string;
    possessionDifference: number;
    shotAccuracy: {
      home: number;
      away: number;
    };
    passingAccuracy: {
      home: number;
      away: number;
    };
    defensiveStats: {
      home: { tackles: number; interceptions: number };
      away: { tackles: number; interceptions: number };
    };
  };
  predictiveInsights: {
    expectedGoals: {
      home: number;
      away: number;
    };
    matchQuality: number;
    entertaintmentValue: number;
    predictedOutcome: string;
  };
}

export class MatchAnalysisService {
  /**
   * Analyze a complete match
   */
  static analyzeMatch(
    matchData: any,
    homeTeamStats: any,
    awayTeamStats: any
  ): MatchAnalysisResult {
    const homeAnalysis = this.analyzeTeamPerformance(
      matchData.homeTeam,
      homeTeamStats,
      'home'
    );
    const awayAnalysis = this.analyzeTeamPerformance(
      matchData.awayTeam,
      awayTeamStats,
      'away'
    );

    return {
      matchId: matchData.id,
      homeTeamAnalysis: homeAnalysis,
      awayTeamAnalysis: awayAnalysis,
      matchInsights: this.generateMatchInsights(matchData, homeAnalysis, awayAnalysis),
      performanceComparison: this.compareTeamPerformance(homeAnalysis, awayAnalysis),
      predictiveInsights: this.generatePredictiveInsights(
        homeAnalysis,
        awayAnalysis,
        matchData
      ),
    };
  }

  /**
   * Analyze individual team performance
   */
  private static analyzeTeamPerformance(
    teamData: any,
    teamStats: any,
    side: 'home' | 'away'
  ): MatchAnalysisResult['homeTeamAnalysis'] {
    const metrics = this.extractMetrics(teamData);
    const playerAnalysis = this.analyzePlayerPerformances(teamData.squad || []);

    return {
      teamName: teamData.name,
      metrics,
      playerAnalysis,
      formationUsed: this.detectFormation(playerAnalysis),
      tacticalApproach: this.determineTacticalApproach(metrics),
      strengths: this.identifyStrengths(metrics, playerAnalysis),
      weaknesses: this.identifyWeaknesses(metrics, playerAnalysis),
      keyPerformers: this.identifyKeyPerformers(playerAnalysis),
      rating: this.calculateTeamRating(metrics, playerAnalysis),
    };
  }

  /**
   * Extract performance metrics from team data
   */
  private static extractMetrics(teamData: any): MatchPerformanceMetrics {
    return {
      possession: teamData.possession || 50,
      shots: teamData.shots || 0,
      shotsOnTarget: teamData.shotsOnTarget || 0,
      passes: teamData.passes || 0,
      passAccuracy: teamData.passAccuracy || 0,
      tackles: teamData.tackles || 0,
      interceptions: teamData.interceptions || 0,
      fouls: teamData.fouls || 0,
      corners: teamData.corners || 0,
      crosses: teamData.crosses || 0,
      crossAccuracy: teamData.crossAccuracy || 0,
      offsides: teamData.offsides || 0,
      yellowCards: teamData.yellowCards || 0,
      redCards: teamData.redCards || 0,
    };
  }

  /**
   * Analyze individual player performances
   */
  private static analyzePlayerPerformances(squad: any[]): PlayerPerformanceData[] {
    return squad.map((player) => ({
      playerId: player.id,
      playerName: player.name || ((player.firstName || "") + " " + (player.lastName || "")).trim() || "Unknown",
      position: player.position,
      minutesPlayed: player.minutesPlayed || 0,
      goals: player.goals || 0,
      assists: player.assists || 0,
      shots: player.shots || 0,
      shotsOnTarget: player.shotsOnTarget || 0,
      passes: player.passes || 0,
      passAccuracy: player.passAccuracy || 0,
      tackles: player.tackles || 0,
      interceptions: player.interceptions || 0,
      fouls: player.fouls || 0,
      yellowCards: player.yellowCards || 0,
      redCards: player.redCards || 0,
      dribbles: player.dribbles || 0,
      dribbleSuccessRate: player.dribbleSuccessRate || 0,
      aerialDuels: player.aerialDuels || 0,
      aerialDuelSuccessRate: player.aerialDuelSuccessRate || 0,
      keyPasses: player.keyPasses || 0,
      crossesAccurate: player.crossesAccurate || 0,
      distanceCovered: player.distanceCovered || 0,
      sprintCount: player.sprintCount || 0,
    }));
  }

  /**
   * Detect formation from player positions
   */
  private static detectFormation(players: PlayerPerformanceData[]): string {
    const positions = players.map((p) => p.position).filter(Boolean);
    const defenders = positions.filter((p) => p.includes('D')).length;
    const midfielders = positions.filter((p) => p.includes('M')).length;
    const forwards = positions.filter((p) => p.includes('F')).length;

    return `${defenders}-${midfielders}-${forwards}`;
  }

  /**
   * Determine tactical approach from metrics
   */
  private static determineTacticalApproach(metrics: MatchPerformanceMetrics): string {
    if (metrics.possession > 60) return 'Possession-based, controlling the game';
    if (metrics.possession < 40) return 'Counter-attacking, exploiting spaces';
    if (metrics.shots > 15) return 'Aggressive attacking approach';
    if (metrics.tackles > 20) return 'Defensive, compact shape';
    return 'Balanced approach';
  }

  /**
   * Identify team strengths
   */
  private static identifyStrengths(
    metrics: MatchPerformanceMetrics,
    players: PlayerPerformanceData[]
  ): string[] {
    const strengths: string[] = [];

    if (metrics.possession > 55) strengths.push('Excellent ball possession');
    if (metrics.passAccuracy > 85) strengths.push('High passing accuracy');
    if (metrics.shotsOnTarget / metrics.shots > 0.4)
      strengths.push('Clinical finishing');
    if (metrics.tackles + metrics.interceptions > 25)
      strengths.push('Strong defensive presence');
    if (metrics.crosses > 10 && metrics.crossAccuracy > 30)
      strengths.push('Effective crossing game');

    const topScorer = players.find((p) => p.goals > 0);
    if (topScorer) strengths.push(`Key player: ${topScorer.playerName}`);

    return strengths;
  }

  /**
   * Identify team weaknesses
   */
  private static identifyWeaknesses(
    metrics: MatchPerformanceMetrics,
    players: PlayerPerformanceData[]
  ): string[] {
    const weaknesses: string[] = [];

    if (metrics.possession < 45) weaknesses.push('Low possession control');
    if (metrics.passAccuracy < 75) weaknesses.push('Poor passing accuracy');
    if (metrics.shots < 5) weaknesses.push('Limited attacking opportunities');
    if (metrics.tackles < 10) weaknesses.push('Weak defensive commitment');
    if (metrics.fouls > 15) weaknesses.push('Excessive fouls and discipline issues');

    const injuredPlayers = players.filter((p) => p.minutesPlayed === 0);
    if (injuredPlayers.length > 2)
      weaknesses.push('Missing key players due to injuries');

    return weaknesses;
  }

  /**
   * Identify key performers
   */
  private static identifyKeyPerformers(players: PlayerPerformanceData[]): string[] {
    return players
      .filter((p) => p.goals > 0 || p.assists > 0 || p.keyPasses > 5)
      .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
      .slice(0, 3)
      .map((p) => `${p.playerName} (${p.goals}G, ${p.assists}A)`);
  }

  /**
   * Calculate overall team rating
   */
  private static calculateTeamRating(
    metrics: MatchPerformanceMetrics,
    players: PlayerPerformanceData[]
  ): number {
    let rating = 50;

    // Possession bonus
    if (metrics.possession > 55) rating += 10;
    if (metrics.possession < 45) rating -= 10;

    // Shooting efficiency
    const shotAccuracy = metrics.shots > 0 ? metrics.shotsOnTarget / metrics.shots : 0;
    rating += shotAccuracy * 20;

    // Passing accuracy
    rating += (metrics.passAccuracy / 100) * 15;

    // Defensive solidity
    const defensiveActions = metrics.tackles + metrics.interceptions;
    if (defensiveActions > 20) rating += 10;

    // Player performance
    const topPerformers = players.filter((p) => p.goals > 0 || p.assists > 0);
    rating += topPerformers.length * 5;

    return Math.min(100, Math.max(0, rating));
  }

  /**
   * Generate match insights
   */
  private static generateMatchInsights(
    matchData: any,
    homeAnalysis: any,
    awayAnalysis: any
  ): MatchAnalysisResult['matchInsights'] {
    return {
      keyMoments: this.extractKeyMoments(matchData),
      turningPoints: this.identifyTurningPoints(matchData),
      tacticalShifts: this.identifyTacticalShifts(matchData),
      decisionMoments: this.identifyDecisionMoments(matchData, homeAnalysis, awayAnalysis),
    };
  }

  /**
   * Extract key moments from match
   */
  private static extractKeyMoments(
    matchData: any
  ): MatchAnalysisResult['matchInsights']['keyMoments'] {
    const moments: MatchAnalysisResult['matchInsights']['keyMoments'] = [];

    // Add goals
    if (matchData.goals) {
      matchData.goals.forEach((goal: any) => {
        moments.push({
          minute: goal.minute,
          description: `${goal.scorer} scored for ${goal.team}`,
          type: 'goal',
          team: goal.team,
        });
      });
    }

    // Add red cards
    if (matchData.redCards) {
      matchData.redCards.forEach((card: any) => {
        moments.push({
          minute: card.minute,
          description: `${card.player} received red card`,
          type: 'red_card',
          team: card.team,
        });
      });
    }

    return moments.sort((a, b) => a.minute - b.minute);
  }

  /**
   * Identify turning points in match
   */
  private static identifyTurningPoints(matchData: any): string[] {
    const turningPoints: string[] = [];

    if (matchData.goals && matchData.goals.length > 0) {
      const firstGoal = matchData.goals[0];
      turningPoints.push(
        `First goal at ${firstGoal.minute}' changed match momentum`
      );
    }

    if (matchData.redCards && matchData.redCards.length > 0) {
      turningPoints.push('Red card significantly impacted match dynamics');
    }

    if (matchData.substitutions && matchData.substitutions.length > 2) {
      turningPoints.push('Multiple substitutions changed team shape');
    }

    return turningPoints;
  }

  /**
   * Identify tactical shifts
   */
  private static identifyTacticalShifts(matchData: any): MatchAnalysisResult['matchInsights']['tacticalShifts'] {
    const shifts: MatchAnalysisResult['matchInsights']['tacticalShifts'] = [];

    if (matchData.substitutions) {
      matchData.substitutions.forEach((sub: any) => {
        shifts.push({
          minute: sub.minute,
          team: sub.team,
          description: `${sub.playerOut} replaced by ${sub.playerIn}`,
        });
      });
    }

    return shifts;
  }

  /**
   * Identify decision moments
   */
  private static identifyDecisionMoments(
    matchData: any,
    homeAnalysis: any,
    awayAnalysis: any
  ): string[] {
    const moments: string[] = [];

    if (matchData.penalties) {
      moments.push('Penalty decision was crucial moment');
    }

    if (homeAnalysis.rating > awayAnalysis.rating + 10) {
      moments.push('Home team dominated - clear performance difference');
    }

    if (Math.abs(homeAnalysis.rating - awayAnalysis.rating) < 5) {
      moments.push('Evenly matched teams - any moment could decide result');
    }

    return moments;
  }

  /**
   * Compare team performances
   */
  private static compareTeamPerformance(
    homeAnalysis: any,
    awayAnalysis: any
  ): MatchAnalysisResult['performanceComparison'] {
    return {
      dominantTeam:
        homeAnalysis.rating > awayAnalysis.rating
          ? homeAnalysis.teamName
          : awayAnalysis.teamName,
      possessionDifference: Math.abs(
        homeAnalysis.metrics.possession - awayAnalysis.metrics.possession
      ),
      shotAccuracy: {
        home:
          homeAnalysis.metrics.shots > 0
            ? (homeAnalysis.metrics.shotsOnTarget / homeAnalysis.metrics.shots) * 100
            : 0,
        away:
          awayAnalysis.metrics.shots > 0
            ? (awayAnalysis.metrics.shotsOnTarget / awayAnalysis.metrics.shots) * 100
            : 0,
      },
      passingAccuracy: {
        home: homeAnalysis.metrics.passAccuracy,
        away: awayAnalysis.metrics.passAccuracy,
      },
      defensiveStats: {
        home: {
          tackles: homeAnalysis.metrics.tackles,
          interceptions: homeAnalysis.metrics.interceptions,
        },
        away: {
          tackles: awayAnalysis.metrics.tackles,
          interceptions: awayAnalysis.metrics.interceptions,
        },
      },
    };
  }

  /**
   * Generate predictive insights
   */
  private static generatePredictiveInsights(
    homeAnalysis: any,
    awayAnalysis: any,
    matchData: any
  ): MatchAnalysisResult['predictiveInsights'] {
    const homeExpectedGoals = this.calculateExpectedGoals(homeAnalysis);
    const awayExpectedGoals = this.calculateExpectedGoals(awayAnalysis);

    return {
      expectedGoals: {
        home: homeExpectedGoals,
        away: awayExpectedGoals,
      },
      matchQuality: (homeAnalysis.rating + awayAnalysis.rating) / 2,
      entertaintmentValue: this.calculateEntertainmentValue(
        homeAnalysis,
        awayAnalysis,
        matchData
      ),
      predictedOutcome:
        homeExpectedGoals > awayExpectedGoals
          ? 'Home team likely to win'
          : awayExpectedGoals > homeExpectedGoals
            ? 'Away team likely to win'
            : 'Likely draw',
    };
  }

  /**
   * Calculate expected goals (xG)
   */
  private static calculateExpectedGoals(teamAnalysis: any): number {
    const { shots, shotsOnTarget, passAccuracy } = teamAnalysis.metrics;
    const shotQuality = shotsOnTarget / Math.max(shots, 1);
    const passQuality = passAccuracy / 100;

    return (shots * shotQuality * passQuality) / 10;
  }

  /**
   * Calculate entertainment value
   */
  private static calculateEntertainmentValue(
    homeAnalysis: any,
    awayAnalysis: any,
    matchData: any
  ): number {
    let value = 50;

    // Close match rating
    if (Math.abs(homeAnalysis.rating - awayAnalysis.rating) < 10) value += 15;

    // High scoring
    const totalGoals = (matchData.goals || []).length;
    if (totalGoals > 3) value += 20;
    if (totalGoals > 5) value += 10;

    // Exciting play
    const totalShots =
      homeAnalysis.metrics.shots + awayAnalysis.metrics.shots;
    if (totalShots > 20) value += 10;

    // Red cards add drama
    if (matchData.redCards && matchData.redCards.length > 0) value += 10;

    return Math.min(100, value);
  }
}

export default MatchAnalysisService;
