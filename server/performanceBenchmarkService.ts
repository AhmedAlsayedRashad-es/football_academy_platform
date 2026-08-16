/**
 * Performance Benchmarking & Talent Identification Service
 * Compares player performance against benchmarks and identifies talent
 */

interface BenchmarkData {
  benchmarkType: 'position' | 'age_group' | 'league' | 'global';
  category: string;
  metric: string;
  value: number;
  percentile: number;
  sampleSize: number;
  season: number;
}

interface PlayerBenchmarkComparison {
  playerId: number;
  playerName: string;
  position: string;
  playerValue: number;
  benchmarkValue: number;
  percentile: number;
  variance: number;
  interpretation: string;
  trend: 'improving' | 'stable' | 'declining';
}

interface TalentScore {
  playerId: number;
  playerName: string;
  position: string;
  talentScore: number;
  technicalScore: number;
  physicalScore: number;
  mentalScore: number;
  tacticalScore: number;
  potentialRating: number;
  recommendedPosition: string;
  developmentAreas: string[];
  strengths: string[];
  talentCategory: 'elite' | 'high_potential' | 'developing' | 'emerging';
  projectedLevel: string;
  marketValue: number;
}

export class PerformanceBenchmarkService {
  /**
   * Get benchmarks for a specific metric
   */
  static getBenchmarks(
    benchmarkType: BenchmarkData['benchmarkType'],
    category: string,
    season: number
  ): BenchmarkData[] {
    // In production, this would fetch from database
    // For now, returning sample benchmarks
    const benchmarks: BenchmarkData[] = [];

    if (benchmarkType === 'position' && category === 'Midfielder') {
      benchmarks.push({
        benchmarkType,
        category,
        metric: 'Passes per Match',
        value: 65,
        percentile: 50,
        sampleSize: 500,
        season,
      });

      benchmarks.push({
        benchmarkType,
        category,
        metric: 'Pass Accuracy',
        value: 82,
        percentile: 50,
        sampleSize: 500,
        season,
      });

      benchmarks.push({
        benchmarkType,
        category,
        metric: 'Tackles per Match',
        value: 3.5,
        percentile: 50,
        sampleSize: 500,
        season,
      });

      benchmarks.push({
        benchmarkType,
        category,
        metric: 'Key Passes per Match',
        value: 2.8,
        percentile: 50,
        sampleSize: 500,
        season,
      });
    } else if (benchmarkType === 'age_group' && category === 'U17') {
      benchmarks.push({
        benchmarkType,
        category,
        metric: 'Goals per Match',
        value: 0.5,
        percentile: 50,
        sampleSize: 300,
        season,
      });

      benchmarks.push({
        benchmarkType,
        category,
        metric: 'Assists per Match',
        value: 0.3,
        percentile: 50,
        sampleSize: 300,
        season,
      });

      benchmarks.push({
        benchmarkType,
        category,
        metric: 'Distance Covered (km)',
        value: 9.5,
        percentile: 50,
        sampleSize: 300,
        season,
      });
    }

    return benchmarks;
  }

  /**
   * Compare player performance against benchmarks
   */
  static comparePlayerToBenchmark(
    playerData: any,
    benchmarkData: BenchmarkData
  ): PlayerBenchmarkComparison {
    const playerValue = this.extractPlayerMetricValue(playerData, benchmarkData.metric);
    const benchmarkValue = benchmarkData.value;
    const variance = ((playerValue - benchmarkValue) / benchmarkValue) * 100;
    const percentile = this.calculatePercentile(variance);

    return {
      playerId: playerData.id,
      playerName: playerData.name,
      position: playerData.position,
      playerValue,
      benchmarkValue,
      percentile,
      variance,
      interpretation: this.interpretVariance(variance, benchmarkData.metric),
      trend: this.determineTrend(playerData),
    };
  }

  /**
   * Extract player metric value
   */
  private static extractPlayerMetricValue(playerData: any, metric: string): number {
    const metricMap: { [key: string]: string } = {
      'Passes per Match': 'passesPerMatch',
      'Pass Accuracy': 'passAccuracy',
      'Tackles per Match': 'tacklesPerMatch',
      'Key Passes per Match': 'keyPassesPerMatch',
      'Goals per Match': 'goalsPerMatch',
      'Assists per Match': 'assistsPerMatch',
      'Distance Covered (km)': 'distanceCovered',
      'Sprint Count': 'sprintCount',
      'Dribbles per Match': 'dribblesPerMatch',
    };

    const key = metricMap[metric];
    return playerData[key] || 0;
  }

  /**
   * Calculate percentile based on variance
   */
  private static calculatePercentile(variance: number): number {
    // Assuming normal distribution
    // variance of 0 = 50th percentile
    // variance of +10 = ~84th percentile
    // variance of -10 = ~16th percentile

    const percentile = 50 + variance * 3.4; // Approximate conversion
    return Math.min(100, Math.max(0, percentile));
  }

  /**
   * Interpret variance
   */
  private static interpretVariance(variance: number, metric: string): string {
    if (variance > 20)
      return `Significantly above benchmark in ${metric} - excellent performance`;
    if (variance > 10)
      return `Above benchmark in ${metric} - strong performance`;
    if (variance > -10)
      return `Close to benchmark in ${metric} - average performance`;
    if (variance > -20)
      return `Below benchmark in ${metric} - needs improvement`;
    return `Significantly below benchmark in ${metric} - requires focused development`;
  }

  /**
   * Determine performance trend
   */
  private static determineTrend(
    playerData: any
  ): PlayerBenchmarkComparison['trend'] {
    const recentPerformance = playerData.recentPerformance || 0;
    const previousPerformance = playerData.previousPerformance || 0;

    if (recentPerformance > previousPerformance * 1.1) return 'improving';
    if (recentPerformance < previousPerformance * 0.9) return 'declining';
    return 'stable';
  }

  /**
   * Calculate comprehensive talent score
   */
  static calculateTalentScore(playerData: any): TalentScore {
    const technicalScore = this.calculateTechnicalScore(playerData);
    const physicalScore = this.calculatePhysicalScore(playerData);
    const mentalScore = this.calculateMentalScore(playerData);
    const tacticalScore = this.calculateTacticalScore(playerData);

    const talentScore = (technicalScore + physicalScore + mentalScore + tacticalScore) / 4;
    const potentialRating = this.calculatePotential(playerData, talentScore);

    return {
      playerId: playerData.id,
      playerName: playerData.name,
      position: playerData.position,
      talentScore: Math.round(talentScore),
      technicalScore: Math.round(technicalScore),
      physicalScore: Math.round(physicalScore),
      mentalScore: Math.round(mentalScore),
      tacticalScore: Math.round(tacticalScore),
      potentialRating: Math.round(potentialRating),
      recommendedPosition: this.recommendPosition(playerData),
      developmentAreas: this.identifyDevelopmentAreas(playerData),
      strengths: this.identifyStrengths(playerData),
      talentCategory: this.categorizeTalent(talentScore),
      projectedLevel: this.projectLevel(talentScore, playerData.age),
      marketValue: this.estimateMarketValue(talentScore, playerData.age),
    };
  }

  /**
   * Calculate technical score
   */
  private static calculateTechnicalScore(playerData: any): number {
    const skills = [
      playerData.ballControl || 50,
      playerData.passing || 50,
      playerData.shooting || 50,
      playerData.dribbling || 50,
      playerData.heading || 50,
      playerData.firstTouch || 50,
    ];

    return skills.reduce((a, b) => a + b) / skills.length;
  }

  /**
   * Calculate physical score
   */
  private static calculatePhysicalScore(playerData: any): number {
    const attributes = [
      playerData.speed || 50,
      playerData.strength || 50,
      playerData.endurance || 50,
      playerData.agility || 50,
      playerData.balance || 50,
      playerData.acceleration || 50,
    ];

    return attributes.reduce((a, b) => a + b) / attributes.length;
  }

  /**
   * Calculate mental score
   */
  private static calculateMentalScore(playerData: any): number {
    const mental = [
      playerData.confidence || 50,
      playerData.concentration || 50,
      playerData.resilience || 50,
      playerData.leadership || 50,
      playerData.decisionMaking || 50,
      playerData.workRate || 50,
    ];

    return mental.reduce((a, b) => a + b) / mental.length;
  }

  /**
   * Calculate tactical score
   */
  private static calculateTacticalScore(playerData: any): number {
    const tactical = [
      playerData.positioning || 50,
      playerData.gameReading || 50,
      playerData.teamwork || 50,
      playerData.offTheBallMovement || 50,
      playerData.defensiveAwareness || 50,
      playerData.setPlayUnderstanding || 50,
    ];

    return tactical.reduce((a, b) => a + b) / tactical.length;
  }

  /**
   * Calculate potential rating
   */
  private static calculatePotential(playerData: any, currentScore: number): number {
    const age = playerData.age || 16;
    const developmentYears = Math.max(0, 23 - age); // Peak age ~23

    // Potential increases with age up to peak, then plateaus
    const ageMultiplier = Math.min(1.3, 1 + (developmentYears / 10) * 0.3);
    const improvementCapacity = 100 - currentScore; // Room for improvement

    return currentScore + (improvementCapacity * ageMultiplier * 0.7);
  }

  /**
   * Recommend position
   */
  private static recommendPosition(playerData: any): string {
    const speed = playerData.speed || 50;
    const strength = playerData.strength || 50;
    const passing = playerData.passing || 50;
    const shooting = playerData.shooting || 50;
    const positioning = playerData.positioning || 50;

    if (shooting > 70 && speed > 65) return 'Forward / Winger';
    if (passing > 75 && positioning > 70) return 'Midfielder';
    if (strength > 70 && positioning > 75) return 'Defender';
    if (strength > 75 && speed > 60) return 'Fullback';
    if (positioning > 80) return 'Goalkeeper';

    return playerData.position || 'Midfielder';
  }

  /**
   * Identify development areas
   */
  private static identifyDevelopmentAreas(playerData: any): string[] {
    const areas: string[] = [];
    const threshold = 60;

    if ((playerData.ballControl || 50) < threshold) areas.push('Ball Control');
    if ((playerData.passing || 50) < threshold) areas.push('Passing Accuracy');
    if ((playerData.shooting || 50) < threshold) areas.push('Shooting');
    if ((playerData.speed || 50) < threshold) areas.push('Speed');
    if ((playerData.strength || 50) < threshold) areas.push('Strength');
    if ((playerData.positioning || 50) < threshold) areas.push('Positioning');
    if ((playerData.gameReading || 50) < threshold) areas.push('Game Reading');

    return areas.slice(0, 3); // Top 3 areas
  }

  /**
   * Identify strengths
   */
  private static identifyStrengths(playerData: any): string[] {
    const strengths: string[] = [];
    const threshold = 75;

    if ((playerData.speed || 50) > threshold) strengths.push('Pace');
    if ((playerData.passing || 50) > threshold) strengths.push('Passing');
    if ((playerData.shooting || 50) > threshold) strengths.push('Shooting');
    if ((playerData.strength || 50) > threshold) strengths.push('Physical Strength');
    if ((playerData.positioning || 50) > threshold) strengths.push('Positioning');
    if ((playerData.leadership || 50) > threshold) strengths.push('Leadership');

    return strengths.slice(0, 3); // Top 3 strengths
  }

  /**
   * Categorize talent level
   */
  private static categorizeTalent(talentScore: number): TalentScore['talentCategory'] {
    if (talentScore >= 85) return 'elite';
    if (talentScore >= 75) return 'high_potential';
    if (talentScore >= 60) return 'developing';
    return 'emerging';
  }

  /**
   * Project player level
   */
  private static projectLevel(talentScore: number, age: number): string {
    const yearsToMaturity = Math.max(0, 23 - age);
    const projectedScore = talentScore + (yearsToMaturity * 2);

    if (projectedScore >= 90) return 'Professional / Elite Level';
    if (projectedScore >= 80) return 'Professional Level';
    if (projectedScore >= 70) return 'Semi-Professional Level';
    if (projectedScore >= 60) return 'Competitive Amateur Level';
    return 'Recreational Level';
  }

  /**
   * Estimate market value
   */
  private static estimateMarketValue(talentScore: number, age: number): number {
    // Simplified market value calculation (in thousands)
    const baseValue = talentScore * 50;
    const ageMultiplier = age < 20 ? 0.8 : age < 25 ? 1.2 : age < 30 ? 1 : 0.7;

    return Math.round(baseValue * ageMultiplier);
  }

  /**
   * Generate talent development report
   */
  static generateTalentReport(playerData: any): {
    summary: string;
    recommendations: string[];
    timeline: string;
  } {
    const talentScore = this.calculateTalentScore(playerData);
    const category = talentScore.talentCategory;

    let summary = '';
    let recommendations: string[] = [];
    let timeline = '';

    if (category === 'elite') {
      summary = `${playerData.name} is an elite prospect with exceptional potential. Focus on specialization and professional pathway.`;
      recommendations = [
        'Consider professional academy pathway',
        'Work with specialized coaches',
        'Develop mental resilience for high-pressure situations',
        'Build professional habits and discipline',
      ];
      timeline = '2-3 years to professional level';
    } else if (category === 'high_potential') {
      summary = `${playerData.name} shows high potential and should continue focused development.`;
      recommendations = [
        'Specialize in specific position',
        'Increase training intensity',
        'Work on identified weaknesses',
        'Gain competitive match experience',
      ];
      timeline = '3-4 years to professional level';
    } else if (category === 'developing') {
      summary = `${playerData.name} is developing well. Continue consistent training and improvement.`;
      recommendations = [
        'Focus on fundamental skills',
        'Build consistency in performance',
        'Increase match experience',
        'Work on physical development',
      ];
      timeline = '4-5 years to semi-professional level';
    } else {
      summary = `${playerData.name} is emerging. Focus on building solid foundations.`;
      recommendations = [
        'Master basic technical skills',
        'Build physical fitness',
        'Develop game understanding',
        'Increase training frequency',
      ];
      timeline = '5+ years for competitive level';
    }

    return { summary, recommendations, timeline };
  }
}

export default PerformanceBenchmarkService;
