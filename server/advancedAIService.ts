/**
 * Advanced AI Features Service
 * Provides player comparison, predictions, and career analysis
 */

interface PlayerComparison {
  player1: {
    id: number;
    name: string;
    position: string;
    rating: number;
  };
  player2: {
    id: number;
    name: string;
    position: string;
    rating: number;
  };
  comparison: {
    metric: string;
    player1Value: number;
    player2Value: number;
    advantage: 'player1' | 'player2' | 'equal';
    difference: number;
  }[];
  overallAdvantage: 'player1' | 'player2' | 'equal';
  recommendation: string;
  synergy: number;
}

interface CareerPrediction {
  playerId: number;
  playerName: string;
  currentLevel: string;
  predictions: {
    year: number;
    projectedLevel: string;
    projectedRating: number;
    keyMilestones: string[];
    probability: number;
  }[];
  riskFactors: string[];
  opportunities: string[];
  recommendedPath: string;
}

interface PlayerSynergy {
  player1Id: number;
  player2Id: number;
  synergyScore: number;
  compatibilityFactors: {
    factor: string;
    score: number;
    description: string;
  }[];
  recommendedFormation: string;
  playingTogether: string;
}

interface InjuryRiskPrediction {
  playerId: number;
  playerName: string;
  overallRiskScore: number;
  riskFactors: {
    factor: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }[];
  predictedInjuryTypes: {
    injuryType: string;
    probability: number;
    preventionMeasures: string[];
  }[];
  recommendations: string[];
  monitoringPriority: 'low' | 'medium' | 'high';
}

interface DevelopmentPathway {
  playerId: number;
  playerName: string;
  currentPosition: string;
  recommendedPositions: {
    position: string;
    suitability: number;
    advantages: string[];
    developmentNeeds: string[];
  }[];
  careerStages: {
    stage: string;
    ageRange: string;
    focus: string;
    expectedRating: number;
  }[];
  milestones: {
    age: number;
    milestone: string;
    expectedAchievement: string;
  }[];
  successFactors: string[];
}

export class AdvancedAIService {
  /**
   * Compare two players comprehensively
   */
  static comparePlayersDetailed(
    player1Data: any,
    player2Data: any
  ): PlayerComparison {
    const metrics = [
      'speed',
      'strength',
      'ballControl',
      'passing',
      'shooting',
      'positioning',
      'gameReading',
      'teamwork',
      'confidence',
      'resilience',
    ];

    const comparison = metrics.map((metric) => ({
      metric: this.formatMetricName(metric),
      player1Value: player1Data[metric] || 50,
      player2Value: player2Data[metric] || 50,
      advantage: this.determineAdvantage(
        player1Data[metric] || 50,
        player2Data[metric] || 50
      ),
      difference: Math.abs((player1Data[metric] || 50) - (player2Data[metric] || 50)),
    }));

    const player1Advantages = comparison.filter((c) => c.advantage === 'player1').length;
    const player2Advantages = comparison.filter((c) => c.advantage === 'player2').length;

    return {
      player1: {
        id: player1Data.id,
        name: player1Data.name,
        position: player1Data.position,
        rating: player1Data.overallRating || 70,
      },
      player2: {
        id: player2Data.id,
        name: player2Data.name,
        position: player2Data.position,
        rating: player2Data.overallRating || 70,
      },
      comparison,
      overallAdvantage:
        player1Advantages > player2Advantages
          ? 'player1'
          : player2Advantages > player1Advantages
            ? 'player2'
            : 'equal',
      recommendation: this.generateComparisonRecommendation(
        player1Data,
        player2Data,
        player1Advantages,
        player2Advantages
      ),
      synergy: this.calculatePlayerSynergy(player1Data, player2Data),
    };
  }

  /**
   * Format metric name for display
   */
  private static formatMetricName(metric: string): string {
    return metric
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  }

  /**
   * Determine advantage between two values
   */
  private static determineAdvantage(
    value1: number,
    value2: number
  ): 'player1' | 'player2' | 'equal' {
    if (value1 > value2 + 5) return 'player1';
    if (value2 > value1 + 5) return 'player2';
    return 'equal';
  }

  /**
   * Generate comparison recommendation
   */
  private static generateComparisonRecommendation(
    player1: any,
    player2: any,
    p1Advantages: number,
    p2Advantages: number
  ): string {
    if (p1Advantages > p2Advantages) {
      return `${player1.name} has more strengths overall. Better suited for ${player1.position} position.`;
    } else if (p2Advantages > p1Advantages) {
      return `${player2.name} has more strengths overall. Better suited for ${player2.position} position.`;
    } else {
      return `Both players have complementary strengths. Could work well together in a team.`;
    }
  }

  /**
   * Calculate player synergy
   */
  private static calculatePlayerSynergy(player1: any, player2: any): number {
    // Higher synergy if players have complementary skills
    const complementarySkills = [
      { skill1: 'speed', skill2: 'strength' },
      { skill1: 'passing', skill2: 'shooting' },
      { skill1: 'positioning', skill2: 'gameReading' },
    ];

    let synergyScore = 50;

    complementarySkills.forEach((pair) => {
      const p1Skill1 = player1[pair.skill1] || 50;
      const p1Skill2 = player1[pair.skill2] || 50;
      const p2Skill1 = player2[pair.skill1] || 50;
      const p2Skill2 = player2[pair.skill2] || 50;

      // If player1 is strong in skill1 and player2 is strong in skill2, increase synergy
      if (p1Skill1 > 65 && p2Skill2 > 65) synergyScore += 10;
      if (p2Skill1 > 65 && p1Skill2 > 65) synergyScore += 10;
    });

    // Penalize if both are weak in same areas
    if (
      (player1.passing || 50) < 60 &&
      (player2.passing || 50) < 60
    ) {
      synergyScore -= 10;
    }

    return Math.min(100, Math.max(0, synergyScore));
  }

  /**
   * Predict career trajectory
   */
  static predictCareerTrajectory(playerData: any): CareerPrediction {
    const currentRating = playerData.overallRating || 70;
    const age = playerData.age || 16;
    const predictions: CareerPrediction['predictions'] = [];

    for (let year = 1; year <= 10; year++) {
      const projectedAge = age + year;
      const projectedRating = this.projectRating(currentRating, age, year);
      const level = this.determineLevel(projectedRating);

      predictions.push({
        year,
        projectedLevel: level,
        projectedRating,
        keyMilestones: this.generateMilestones(projectedAge, level),
        probability: this.calculateProbability(currentRating, year),
      });
    }

    return {
      playerId: playerData.id,
      playerName: playerData.name,
      currentLevel: this.determineLevel(currentRating),
      predictions,
      riskFactors: this.identifyRiskFactors(playerData),
      opportunities: this.identifyOpportunities(playerData),
      recommendedPath: this.generateCareerPath(playerData, currentRating),
    };
  }

  /**
   * Project player rating over time
   */
  private static projectRating(
    currentRating: number,
    currentAge: number,
    yearsAhead: number
  ): number {
    const peakAge = 28;
    const projectedAge = currentAge + yearsAhead;

    // Growth phase (until ~23)
    if (projectedAge <= 23) {
      const growthRate = (100 - currentRating) * 0.15; // 15% of remaining potential per year
      return Math.min(100, currentRating + growthRate * yearsAhead);
    }

    // Peak phase (23-28)
    if (projectedAge <= peakAge) {
      return Math.min(100, currentRating + 2); // Slight improvement
    }

    // Decline phase (after 28)
    const yearsAfterPeak = projectedAge - peakAge;
    return Math.max(50, currentRating - yearsAfterPeak * 1.5);
  }

  /**
   * Determine player level from rating
   */
  private static determineLevel(rating: number): string {
    if (rating >= 90) return 'Elite Professional';
    if (rating >= 80) return 'Professional';
    if (rating >= 70) return 'Semi-Professional';
    if (rating >= 60) return 'Competitive Amateur';
    return 'Developing';
  }

  /**
   * Generate career milestones
   */
  private static generateMilestones(age: number, level: string): string[] {
    const milestones: string[] = [];

    if (age >= 16 && age <= 18) {
      milestones.push('Youth academy development');
      if (level.includes('Professional')) milestones.push('Professional contract opportunity');
    } else if (age >= 19 && age <= 23) {
      milestones.push('First team breakthrough');
      milestones.push('International youth recognition');
    } else if (age >= 24 && age <= 28) {
      milestones.push('Peak performance years');
      if (level === 'Elite Professional') milestones.push('Senior international selection');
    } else if (age >= 29) {
      milestones.push('Veteran leadership role');
      milestones.push('Mentoring younger players');
    }

    return milestones;
  }

  /**
   * Calculate prediction probability
   */
  private static calculateProbability(currentRating: number, yearsAhead: number): number {
    // Probability decreases with time
    const baseProbability = 0.95;
    const decayFactor = Math.pow(0.95, yearsAhead);

    return Math.round(baseProbability * decayFactor * 100);
  }

  /**
   * Identify risk factors
   */
  private static identifyRiskFactors(playerData: any): string[] {
    const risks: string[] = [];

    if ((playerData.confidence || 50) < 60) risks.push('Low confidence levels');
    if ((playerData.resilience || 50) < 60) risks.push('Difficulty handling pressure');
    if ((playerData.strength || 50) < 60) risks.push('Physical development concerns');
    if (playerData.injuryHistory) risks.push('Previous injury history');
    if ((playerData.workRate || 50) < 60) risks.push('Inconsistent effort levels');

    return risks;
  }

  /**
   * Identify opportunities
   */
  private static identifyOpportunities(playerData: any): string[] {
    const opportunities: string[] = [];

    if ((playerData.speed || 50) > 75) opportunities.push('Pace-based attacking opportunities');
    if ((playerData.passing || 50) > 75) opportunities.push('Playmaking role potential');
    if ((playerData.leadership || 50) > 75) opportunities.push('Leadership and captaincy path');
    if ((playerData.shooting || 50) > 75) opportunities.push('Striker/forward specialization');
    if ((playerData.positioning || 50) > 75) opportunities.push('Defensive specialist potential');

    return opportunities;
  }

  /**
   * Generate career path recommendation
   */
  private static generateCareerPath(playerData: any, rating: number): string {
    if (rating >= 80) {
      return 'Professional pathway: Focus on specialization and elite development';
    } else if (rating >= 70) {
      return 'Semi-professional pathway: Develop consistency and competitive experience';
    } else if (rating >= 60) {
      return 'Competitive amateur pathway: Build fundamental skills and game understanding';
    } else {
      return 'Development pathway: Focus on foundational skills and physical development';
    }
  }

  /**
   * Predict injury risk
   */
  static predictInjuryRisk(playerData: any): InjuryRiskPrediction {
    const overallRiskScore = this.calculateInjuryRiskScore(playerData);

    return {
      playerId: playerData.id,
      playerName: playerData.name,
      overallRiskScore,
      riskFactors: this.analyzeInjuryRiskFactors(playerData),
      predictedInjuryTypes: this.predictInjuryTypes(playerData),
      recommendations: this.generateInjuryPreventionRecommendations(playerData),
      monitoringPriority: this.determinePriority(overallRiskScore),
    };
  }

  /**
   * Calculate overall injury risk score
   */
  private static calculateInjuryRiskScore(playerData: any): number {
    let score = 30; // Base risk

    // Fatigue factor
    if ((playerData.endurance || 50) < 60) score += 15;

    // Overtraining factor
    if ((playerData.trainingLoad || 50) > 80) score += 20;

    // Recovery factor
    if ((playerData.recoveryTime || 50) < 60) score += 15;

    // Previous injury
    if (playerData.previousInjuries > 0) score += playerData.previousInjuries * 10;

    // Age factor (younger players have higher risk)
    if (playerData.age < 20) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Analyze injury risk factors
   */
  private static analyzeInjuryRiskFactors(playerData: any): InjuryRiskPrediction['riskFactors'] {
    const factors: InjuryRiskPrediction['riskFactors'] = [];

    if ((playerData.trainingLoad || 50) > 80) {
      factors.push({
        factor: 'High Training Load',
        riskLevel: 'high',
        description: 'Player is training at high intensity - increased injury risk',
      });
    }

    if ((playerData.endurance || 50) < 60) {
      factors.push({
        factor: 'Low Endurance',
        riskLevel: 'medium',
        description: 'Fatigue increases injury susceptibility',
      });
    }

    if ((playerData.strength || 50) < 60) {
      factors.push({
        factor: 'Low Strength',
        riskLevel: 'medium',
        description: 'Weak muscles cannot support joints properly',
      });
    }

    if (playerData.previousInjuries > 1) {
      factors.push({
        factor: 'Injury History',
        riskLevel: 'high',
        description: 'Multiple previous injuries indicate vulnerability',
      });
    }

    return factors;
  }

  /**
   * Predict likely injury types
   */
  private static predictInjuryTypes(playerData: any): InjuryRiskPrediction['predictedInjuryTypes'] {
    const injuries: InjuryRiskPrediction['predictedInjuryTypes'] = [];

    if ((playerData.speed || 50) > 75 && (playerData.strength || 50) < 65) {
      injuries.push({
        injuryType: 'Hamstring Strain',
        probability: 35,
        preventionMeasures: [
          'Increase hamstring flexibility work',
          'Strengthen posterior chain',
          'Proper warm-up before high-speed activities',
        ],
      });
    }

    if ((playerData.agility || 50) > 75) {
      injuries.push({
        injuryType: 'Ankle Sprain',
        probability: 30,
        preventionMeasures: [
          'Ankle strengthening exercises',
          'Balance and proprioception training',
          'Proper footwear',
        ],
      });
    }

    if ((playerData.trainingLoad || 50) > 80) {
      injuries.push({
        injuryType: 'Overuse Injury',
        probability: 40,
        preventionMeasures: [
          'Reduce training load',
          'Increase recovery time',
          'Cross-training activities',
        ],
      });
    }

    return injuries;
  }

  /**
   * Generate injury prevention recommendations
   */
  private static generateInjuryPreventionRecommendations(playerData: any): string[] {
    const recommendations: string[] = [];

    recommendations.push('Implement proper warm-up and cool-down routines');
    recommendations.push('Increase flexibility and mobility work');
    recommendations.push('Focus on core strength training');
    recommendations.push('Ensure adequate recovery between sessions');

    if ((playerData.trainingLoad || 50) > 80) {
      recommendations.push('Reduce training intensity or frequency');
    }

    if ((playerData.endurance || 50) < 60) {
      recommendations.push('Build aerobic capacity gradually');
    }

    return recommendations;
  }

  /**
   * Determine monitoring priority
   */
  private static determinePriority(
    riskScore: number
  ): InjuryRiskPrediction['monitoringPriority'] {
    if (riskScore >= 70) return 'high';
    if (riskScore >= 50) return 'medium';
    return 'low';
  }

  /**
   * Generate development pathway
   */
  static generateDevelopmentPathway(playerData: any): DevelopmentPathway {
    const currentPosition = playerData.position || 'Midfielder';
    const currentRating = playerData.overallRating || 70;

    return {
      playerId: playerData.id,
      playerName: playerData.name,
      currentPosition,
      recommendedPositions: this.recommendPositions(playerData),
      careerStages: this.generateCareerStages(playerData.age || 16, currentRating),
      milestones: this.generateCareerMilestones(playerData.age || 16),
      successFactors: this.identifySuccessFactors(playerData),
    };
  }

  /**
   * Recommend positions
   */
  private static recommendPositions(
    playerData: any
  ): DevelopmentPathway['recommendedPositions'] {
    const positions: DevelopmentPathway['recommendedPositions'] = [];

    const speed = playerData.speed || 50;
    const strength = playerData.strength || 50;
    const passing = playerData.passing || 50;
    const shooting = playerData.shooting || 50;
    const positioning = playerData.positioning || 50;

    if (speed > 75 && shooting > 70) {
      positions.push({
        position: 'Winger/Forward',
        suitability: 95,
        advantages: ['Pace advantage', 'Finishing ability'],
        developmentNeeds: ['Crossing accuracy', 'Defensive positioning'],
      });
    }

    if (passing > 75 && positioning > 75) {
      positions.push({
        position: 'Midfielder',
        suitability: 90,
        advantages: ['Game vision', 'Positioning sense'],
        developmentNeeds: ['Physical strength', 'Defensive awareness'],
      });
    }

    if (strength > 75 && positioning > 75) {
      positions.push({
        position: 'Defender',
        suitability: 85,
        advantages: ['Physical presence', 'Positioning'],
        developmentNeeds: ['Speed development', 'Aerial ability'],
      });
    }

    return positions;
  }

  /**
   * Generate career stages
   */
  private static generateCareerStages(
    age: number,
    rating: number
  ): DevelopmentPathway['careerStages'] {
    return [
      {
        stage: 'Foundation (16-18)',
        ageRange: '16-18',
        focus: 'Technical skill development and physical growth',
        expectedRating: Math.min(75, rating + 5),
      },
      {
        stage: 'Development (19-23)',
        ageRange: '19-23',
        focus: 'Tactical understanding and competitive experience',
        expectedRating: Math.min(85, rating + 15),
      },
      {
        stage: 'Peak Performance (24-28)',
        ageRange: '24-28',
        focus: 'Consistency and leadership',
        expectedRating: Math.min(95, rating + 25),
      },
      {
        stage: 'Veteran (29+)',
        ageRange: '29+',
        focus: 'Experience and mentoring',
        expectedRating: Math.max(70, rating + 15),
      },
    ];
  }

  /**
   * Generate career milestones
   */
  private static generateCareerMilestones(age: number): DevelopmentPathway['milestones'] {
    return [
      {
        age: age + 2,
        milestone: 'First team debut',
        expectedAchievement: 'Establish as regular starter',
      },
      {
        age: age + 5,
        milestone: 'Senior recognition',
        expectedAchievement: 'International or elite league selection',
      },
      {
        age: age + 8,
        milestone: 'Peak performance',
        expectedAchievement: 'Consistent high-level performances',
      },
      {
        age: age + 12,
        milestone: 'Leadership role',
        expectedAchievement: 'Captain or senior mentor position',
      },
    ];
  }

  /**
   * Identify success factors
   */
  private static identifySuccessFactors(playerData: any): string[] {
    return [
      'Consistent training commitment',
      'Mental resilience and confidence',
      'Continuous skill improvement',
      'Professional attitude and discipline',
      'Strong support system (coaches, family)',
      'Injury prevention and recovery',
      'Tactical flexibility and adaptability',
      'Team contribution and leadership',
    ];
  }
}

export default AdvancedAIService;
