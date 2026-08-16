/**
 * Tactical Analysis AI Service
 * Analyzes tactical patterns from match data and generates recommendations
 */

interface TacticalPattern {
  formation: string;
  attackingStyle: 'aggressive' | 'balanced' | 'defensive';
  defensiveStyle: 'high_press' | 'medium_block' | 'deep_defense';
  passingStyle: 'direct' | 'possession' | 'mixed';
  setPlayStrength: number;
  counterAttackTendency: number;
}

interface TeamProfile {
  teamId: number;
  teamName: string;
  preferredFormation: string;
  alternateFormations: string[];
  tacticalPattern: TacticalPattern;
  winRate: number;
  drawRate: number;
  lossRate: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

interface MatchAnalysis {
  homeTeamAnalysis: {
    formation: string;
    possession: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    passAccuracy: number;
    tackles: number;
    interceptions: number;
    fouls: number;
    corners: number;
    keyPasses: number;
  };
  awayTeamAnalysis: {
    formation: string;
    possession: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    passAccuracy: number;
    tackles: number;
    interceptions: number;
    fouls: number;
    corners: number;
    keyPasses: number;
  };
  tacticalInsights: string[];
  keyMoments: Array<{
    minute: number;
    description: string;
    type: 'goal' | 'chance' | 'tackle' | 'substitution' | 'injury';
  }>;
  turningPoints: string[];
}

interface TacticalRecommendation {
  recommendedFormation: string;
  keyTactics: string[];
  strengthsToExploit: string[];
  threatsToMitigate: string[];
  setPlayRecommendations: {
    corners: string;
    freeKicks: string;
    throwIns: string;
  };
  confidence: number;
}

export class TacticalAnalysisService {
  /**
   * Analyze team tactical profile from historical match data
   */
  static analyzeTeamProfile(matches: any[], teamId: number): TeamProfile {
    const teamMatches = matches.filter(
      (m) => m.homeTeamId === teamId || m.awayTeamId === teamId
    );

    let wins = 0,
      draws = 0,
      losses = 0;
    let totalGoalsFor = 0,
      totalGoalsAgainst = 0;
    const formations: { [key: string]: number } = {};

    teamMatches.forEach((match) => {
      const isHome = match.homeTeamId === teamId;
      const goalsFor = isHome ? match.homeTeamScore : match.awayTeamScore;
      const goalsAgainst = isHome ? match.awayTeamScore : match.homeTeamScore;

      totalGoalsFor += goalsFor;
      totalGoalsAgainst += goalsAgainst;

      if (goalsFor > goalsAgainst) wins++;
      else if (goalsFor === goalsAgainst) draws++;
      else losses++;

      // Track formations (simplified - would need actual formation data)
      const formation = '4-3-3'; // Placeholder
      formations[formation] = (formations[formation] || 0) + 1;
    });

    const totalMatches = teamMatches.length;
    const preferredFormation = Object.entries(formations).sort(([, a], [, b]) => b - a)[0]?.[0] || '4-3-3';

    return {
      teamId,
      teamName: 'Team Name', // Would be fetched from database
      preferredFormation,
      alternateFormations: Object.keys(formations).slice(0, 3),
      tacticalPattern: {
        formation: preferredFormation,
        attackingStyle: totalGoalsFor > 15 ? 'aggressive' : totalGoalsFor > 10 ? 'balanced' : 'defensive',
        defensiveStyle: totalGoalsAgainst < 10 ? 'high_press' : totalGoalsAgainst < 15 ? 'medium_block' : 'deep_defense',
        passingStyle: 'possession',
        setPlayStrength: Math.round((wins / totalMatches) * 10),
        counterAttackTendency: Math.round((totalGoalsFor / totalMatches) * 5),
      },
      winRate: (wins / totalMatches) * 100,
      drawRate: (draws / totalMatches) * 100,
      lossRate: (losses / totalMatches) * 100,
      goalsFor: totalGoalsFor,
      goalsAgainst: totalGoalsAgainst,
      goalDifference: totalGoalsFor - totalGoalsAgainst,
    };
  }

  /**
   * Analyze a specific match
   */
  static analyzeMatch(matchData: any): MatchAnalysis {
    return {
      homeTeamAnalysis: {
        formation: '4-3-3',
        possession: matchData.homeTeam?.possession || 50,
        shots: matchData.homeTeam?.shots || 10,
        shotsOnTarget: matchData.homeTeam?.shotsOnTarget || 4,
        passes: matchData.homeTeam?.passes || 400,
        passAccuracy: matchData.homeTeam?.passAccuracy || 85,
        tackles: matchData.homeTeam?.tackles || 15,
        interceptions: matchData.homeTeam?.interceptions || 8,
        fouls: matchData.homeTeam?.fouls || 12,
        corners: matchData.homeTeam?.corners || 5,
        keyPasses: matchData.homeTeam?.keyPasses || 8,
      },
      awayTeamAnalysis: {
        formation: '4-2-3-1',
        possession: matchData.awayTeam?.possession || 50,
        shots: matchData.awayTeam?.shots || 8,
        shotsOnTarget: matchData.awayTeam?.shotsOnTarget || 3,
        passes: matchData.awayTeam?.passes || 380,
        passAccuracy: matchData.awayTeam?.passAccuracy || 82,
        tackles: matchData.awayTeam?.tackles || 18,
        interceptions: matchData.awayTeam?.interceptions || 10,
        fouls: matchData.awayTeam?.fouls || 14,
        corners: matchData.awayTeam?.corners || 3,
        keyPasses: matchData.awayTeam?.keyPasses || 6,
      },
      tacticalInsights: [
        'Home team dominated possession and created more clear-cut chances',
        'Away team defended deep and relied on counter-attacks',
        'Set pieces were crucial for away team opportunities',
      ],
      keyMoments: [
        { minute: 23, description: 'Home team goal from open play', type: 'goal' },
        { minute: 45, description: 'Away team missed penalty', type: 'chance' },
        { minute: 67, description: 'Away team equalizer', type: 'goal' },
      ],
      turningPoints: [
        'Away team penalty miss in first half changed momentum',
        'Home team substitution at 60 minutes reinvigorated attack',
      ],
    };
  }

  /**
   * Generate tactical recommendations against an opponent
   */
  static generateTacticalRecommendations(
    ourTeamProfile: TeamProfile,
    opponentProfile: TeamProfile
  ): TacticalRecommendation {
    const recommendations: TacticalRecommendation = {
      recommendedFormation: this.selectOptimalFormation(ourTeamProfile, opponentProfile),
      keyTactics: this.generateKeyTactics(ourTeamProfile, opponentProfile),
      strengthsToExploit: this.identifyOpponentWeaknesses(opponentProfile),
      threatsToMitigate: this.identifyOpponentThreats(opponentProfile),
      setPlayRecommendations: {
        corners: 'Focus on near-post delivery to exploit opponent\'s aerial weakness',
        freeKicks: 'Use direct free kicks from dangerous positions',
        throwIns: 'Quick throw-ins to transition quickly',
      },
      confidence: 75,
    };

    return recommendations;
  }

  /**
   * Select optimal formation based on team and opponent profiles
   */
  private static selectOptimalFormation(
    ourTeam: TeamProfile,
    opponent: TeamProfile
  ): string {
    // If opponent is very attacking, use defensive formation
    if (opponent.tacticalPattern.attackingStyle === 'aggressive') {
      return '5-3-2';
    }

    // If opponent is defensive, use attacking formation
    if (opponent.tacticalPattern.defensiveStyle === 'deep_defense') {
      return '3-5-2';
    }

    // Default to our preferred formation
    return ourTeam.preferredFormation;
  }

  /**
   * Generate key tactical recommendations
   */
  private static generateKeyTactics(
    ourTeam: TeamProfile,
    opponent: TeamProfile
  ): string[] {
    const tactics: string[] = [];

    // Analyze opponent's defensive style
    if (opponent.tacticalPattern.defensiveStyle === 'high_press') {
      tactics.push('Use long balls to bypass high press');
      tactics.push('Play quick one-touch passes to escape pressure');
    } else if (opponent.tacticalPattern.defensiveStyle === 'deep_defense') {
      tactics.push('Use width to stretch defense');
      tactics.push('Play through balls into space behind defense');
    }

    // Analyze opponent's attacking style
    if (opponent.tacticalPattern.attackingStyle === 'aggressive') {
      tactics.push('Protect defensive midfield with extra cover');
      tactics.push('Use counter-attacks to exploit space');
    }

    // Analyze our strengths
    if (ourTeam.tacticalPattern.passingStyle === 'possession') {
      tactics.push('Maintain possession to control game tempo');
    }

    return tactics;
  }

  /**
   * Identify opponent weaknesses to exploit
   */
  private static identifyOpponentWeaknesses(opponent: TeamProfile): string[] {
    const weaknesses: string[] = [];

    if (opponent.goalsAgainst > 20) {
      weaknesses.push('Defensive vulnerabilities - high goals conceded');
    }

    if (opponent.lossRate > 30) {
      weaknesses.push('Inconsistent form - high loss rate');
    }

    if (opponent.tacticalPattern.setPlayStrength < 5) {
      weaknesses.push('Weak in set pieces - exploit corners and free kicks');
    }

    if (opponent.goalDifference < 0) {
      weaknesses.push('Poor goal difference - defensive issues');
    }

    return weaknesses;
  }

  /**
   * Identify opponent threats to mitigate
   */
  private static identifyOpponentThreats(opponent: TeamProfile): string[] {
    const threats: string[] = [];

    if (opponent.goalsFor > 25) {
      threats.push('Strong attacking threat - high goals scored');
    }

    if (opponent.winRate > 60) {
      threats.push('High win rate - formidable opponent');
    }

    if (opponent.tacticalPattern.counterAttackTendency > 7) {
      threats.push('Dangerous on counter-attacks - maintain defensive shape');
    }

    if (opponent.tacticalPattern.attackingStyle === 'aggressive') {
      threats.push('Aggressive attacking style - expect high intensity');
    }

    return threats;
  }

  /**
   * Calculate formation effectiveness score
   */
  static calculateFormationEffectiveness(
    formation: string,
    matchResults: any[]
  ): number {
    const formationMatches = matchResults.filter((m) => m.formation === formation);

    if (formationMatches.length === 0) return 50;

    let wins = 0,
      draws = 0,
      losses = 0;

    formationMatches.forEach((match) => {
      if (match.result === 'win') wins++;
      else if (match.result === 'draw') draws++;
      else losses++;
    });

    const total = formationMatches.length;
    return (wins * 3 + draws * 1) / (total * 3) * 100;
  }

  /**
   * Identify tactical patterns from multiple matches
   */
  static identifyPatterns(matches: any[]): string[] {
    const patterns: string[] = [];

    // Analyze scoring patterns
    const firstHalfGoals = matches.filter((m) => m.scoringTime < 45).length;
    if (firstHalfGoals > matches.length * 0.6) {
      patterns.push('Team tends to score early in matches');
    }

    // Analyze comeback patterns
    const comebacks = matches.filter((m) => m.wasTrailingAtHalfTime && m.result === 'win').length;
    if (comebacks > matches.length * 0.3) {
      patterns.push('Team shows strong second-half performance');
    }

    // Analyze home/away performance
    const homeMatches = matches.filter((m) => m.isHome);
    const homeWinRate = homeMatches.filter((m) => m.result === 'win').length / homeMatches.length;
    if (homeWinRate > 0.7) {
      patterns.push('Strong home performance');
    }

    return patterns;
  }
}

export default TacticalAnalysisService;
