/**
 * AI Position Recommendation Engine
 * Analyzes player skills and recommends optimal positions
 *
 * Key design principle: speed is a CRITICAL attribute for ALL outfield positions,
 * especially defenders (CB, LB, RB) who must track fast attackers.
 * A player recommended as a defender MUST have adequate speed, or the system
 * will flag it as a required improvement — not silently recommend the position.
 */

export interface PlayerSkills {
  // Physical attributes
  speed: number;          // 0-100
  agility: number;        // 0-100
  power: number;          // 0-100
  stamina: number;        // 0-100

  // Technical skills
  dribbling: number;      // 0-100
  firstTouch: number;     // 0-100
  passing: number;        // 0-100
  shooting: number;       // 0-100
  heading: number;        // 0-100
  tackling: number;       // 0-100

  // Tactical attributes
  positioning: number;    // 0-100
  vision: number;         // 0-100
  decisionMaking: number; // 0-100

  // Mental attributes
  composure: number;      // 0-100
  leadership: number;     // 0-100
  workRate: number;       // 0-100

  // Goalkeeper specific (optional)
  reflexes?: number;      // 0-100
  handling?: number;      // 0-100
  distribution?: number;  // 0-100
}

export interface PositionRecommendation {
  position: string;
  suitabilityScore: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  strengths: string[];
  improvements: string[];
  /** Human-readable labels for improvements */
  improvementLabels?: string[];
  /** Whether this recommendation has a critical gap (e.g. low speed for defender) */
  hasCriticalGap?: boolean;
  criticalGapNote?: string;
}

// ─── POSITION REQUIREMENTS ────────────────────────────────────────────────────
// Weights reflect modern football demands.
// Speed is now properly weighted for ALL outfield positions.
// Defenders (CB/LB/RB) need speed to track fast attackers — weight raised to 0.15.
const POSITION_REQUIREMENTS: Record<string, Record<string, number>> = {
  GK: {
    reflexes: 0.25,
    handling: 0.20,
    positioning: 0.15,
    composure: 0.15,
    distribution: 0.10,
    heading: 0.05,
    power: 0.05,
    decisionMaking: 0.05,
  },
  CB: {
    tackling: 0.20,
    heading: 0.15,
    positioning: 0.15,
    // Speed is critical for CBs — must track fast strikers and wingers
    speed: 0.15,
    power: 0.10,
    composure: 0.10,
    passing: 0.10,
    leadership: 0.05,
  },
  LB: {
    speed: 0.25,       // Full-backs are speed-critical: must track wingers and overlap
    stamina: 0.15,
    tackling: 0.15,
    positioning: 0.10,
    passing: 0.10,
    dribbling: 0.10,
    agility: 0.10,
    workRate: 0.05,
  },
  RB: {
    speed: 0.25,       // Same as LB — speed is the primary physical requirement
    stamina: 0.15,
    tackling: 0.15,
    positioning: 0.10,
    passing: 0.10,
    dribbling: 0.10,
    agility: 0.10,
    workRate: 0.05,
  },
  CDM: {
    tackling: 0.20,
    positioning: 0.15,
    passing: 0.15,
    stamina: 0.10,
    workRate: 0.10,
    composure: 0.10,
    decisionMaking: 0.10,
    power: 0.10,
  },
  CM: {
    passing: 0.20,
    vision: 0.15,
    stamina: 0.15,
    positioning: 0.10,
    dribbling: 0.10,
    workRate: 0.10,
    decisionMaking: 0.10,
    firstTouch: 0.10,
  },
  CAM: {
    vision: 0.20,
    passing: 0.20,
    dribbling: 0.15,
    shooting: 0.15,
    firstTouch: 0.10,
    decisionMaking: 0.10,
    agility: 0.05,
    composure: 0.05,
  },
  LW: {
    speed: 0.25,       // Wingers are the most speed-dependent position
    dribbling: 0.20,
    agility: 0.15,
    shooting: 0.15,
    firstTouch: 0.10,
    passing: 0.10,
    workRate: 0.05,
  },
  RW: {
    speed: 0.25,
    dribbling: 0.20,
    agility: 0.15,
    shooting: 0.15,
    firstTouch: 0.10,
    passing: 0.10,
    workRate: 0.05,
  },
  ST: {
    shooting: 0.25,
    positioning: 0.15,
    firstTouch: 0.15,
    speed: 0.15,       // Modern strikers need pace to beat the offside trap
    heading: 0.10,
    power: 0.10,
    composure: 0.10,
  },
};

// ─── MINIMUM THRESHOLDS ───────────────────────────────────────────────────────
// These are HARD minimums. If a player falls below these for a critical attribute
// of a position, the recommendation is flagged with a critical gap.
const CRITICAL_MINIMUMS: Record<string, Record<string, number>> = {
  CB:  { speed: 55, tackling: 55 },
  LB:  { speed: 60, stamina: 55 },
  RB:  { speed: 60, stamina: 55 },
  LW:  { speed: 65, dribbling: 55 },
  RW:  { speed: 65, dribbling: 55 },
  ST:  { shooting: 60, speed: 55 },
  CDM: { tackling: 55 },
  GK:  { reflexes: 60, handling: 55 },
};

// ─── HUMAN-READABLE ATTRIBUTE LABELS ─────────────────────────────────────────
const ATTRIBUTE_LABELS: Record<string, string> = {
  speed: 'Speed / Pace',
  agility: 'Agility',
  power: 'Physical Power',
  stamina: 'Stamina / Endurance',
  dribbling: 'Dribbling',
  firstTouch: 'First Touch',
  passing: 'Passing',
  shooting: 'Shooting',
  heading: 'Heading',
  tackling: 'Tackling',
  positioning: 'Positioning',
  vision: 'Vision',
  decisionMaking: 'Decision Making',
  composure: 'Composure',
  leadership: 'Leadership',
  workRate: 'Work Rate',
  reflexes: 'Reflexes',
  handling: 'Handling',
  distribution: 'Distribution',
};

// ─── POSITION DESCRIPTIONS ───────────────────────────────────────────────────
export const POSITION_DESCRIPTIONS: Record<string, string> = {
  GK:  'Goalkeeper — shot-stopping, commanding the box, distribution',
  CB:  'Centre-Back — defending, heading, reading the game; requires pace to track fast attackers',
  LB:  'Left-Back — overlapping runs, tracking wingers; pace is the #1 physical requirement',
  RB:  'Right-Back — overlapping runs, tracking wingers; pace is the #1 physical requirement',
  CDM: 'Defensive Midfielder — breaking up play, protecting the back line',
  CM:  'Central Midfielder — box-to-box engine, passing range, stamina',
  CAM: 'Attacking Midfielder — creativity, vision, final-third link play',
  LW:  'Left Winger — pace and dribbling to beat defenders wide',
  RW:  'Right Winger — pace and dribbling to beat defenders wide',
  ST:  'Striker — finishing, movement, pace to beat the offside trap',
};

// ─── SCORE CALCULATION ────────────────────────────────────────────────────────
function calculatePositionScore(
  skills: PlayerSkills,
  requirements: Record<string, number>
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const [attribute, weight] of Object.entries(requirements)) {
    const skillValue = (skills as any)[attribute] ?? 50;
    totalScore += skillValue * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

// ─── STRENGTHS ────────────────────────────────────────────────────────────────
function getPositionStrengths(skills: PlayerSkills, position: string): string[] {
  const strengths: string[] = [];
  const requirements = POSITION_REQUIREMENTS[position];
  if (!requirements) return strengths;

  for (const [attribute, weight] of Object.entries(requirements)) {
    const skillValue = (skills as any)[attribute] ?? 50;
    // A strength = high-weight attribute where player is genuinely good
    if (weight >= 0.10 && skillValue >= 70) {
      strengths.push(attribute);
    }
  }
  return strengths;
}

// ─── IMPROVEMENTS ─────────────────────────────────────────────────────────────
function getPositionImprovements(skills: PlayerSkills, position: string): string[] {
  const improvements: string[] = [];
  const requirements = POSITION_REQUIREMENTS[position];
  if (!requirements) return improvements;

  for (const [attribute, weight] of Object.entries(requirements)) {
    const skillValue = (skills as any)[attribute] ?? 50;
    // Flag any attribute with ≥10% weight that is below 65
    if (weight >= 0.10 && skillValue < 65) {
      improvements.push(attribute);
    }
  }
  return improvements;
}

// ─── CRITICAL GAP CHECK ───────────────────────────────────────────────────────
function checkCriticalGap(
  skills: PlayerSkills,
  position: string
): { hasCriticalGap: boolean; criticalGapNote: string } {
  const minimums = CRITICAL_MINIMUMS[position];
  if (!minimums) return { hasCriticalGap: false, criticalGapNote: '' };

  const gaps: string[] = [];
  for (const [attribute, minValue] of Object.entries(minimums)) {
    const skillValue = (skills as any)[attribute] ?? 50;
    if (skillValue < minValue) {
      const label = ATTRIBUTE_LABELS[attribute] || attribute;
      gaps.push(`${label} (${skillValue}/100, minimum ${minValue})`);
    }
  }

  if (gaps.length === 0) return { hasCriticalGap: false, criticalGapNote: '' };

  const posDesc = POSITION_DESCRIPTIONS[position] || position;
  return {
    hasCriticalGap: true,
    criticalGapNote: `⚠️ Critical gaps for ${position}: ${gaps.join('; ')}. ${posDesc}`,
  };
}

// ─── MAIN EXPORT: recommendPositions ─────────────────────────────────────────
export function recommendPositions(skills: PlayerSkills): PositionRecommendation[] {
  const recommendations: PositionRecommendation[] = [];

  for (const [position, requirements] of Object.entries(POSITION_REQUIREMENTS)) {
    const score = calculatePositionScore(skills, requirements);
    const strengths = getPositionStrengths(skills, position);
    const improvements = getPositionImprovements(skills, position);
    const { hasCriticalGap, criticalGapNote } = checkCriticalGap(skills, position);

    // Penalise score when there are critical gaps — prevents bad recommendations
    const adjustedScore = hasCriticalGap ? score * 0.75 : score;

    let confidence: 'high' | 'medium' | 'low';
    if (adjustedScore >= 72 && improvements.length <= 1 && !hasCriticalGap) {
      confidence = 'high';
    } else if (adjustedScore >= 58 && improvements.length <= 3 && !hasCriticalGap) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    recommendations.push({
      position,
      suitabilityScore: Math.round(adjustedScore),
      confidence,
      strengths,
      improvements,
      improvementLabels: improvements.map(attr => ATTRIBUTE_LABELS[attr] || attr),
      hasCriticalGap,
      criticalGapNote: hasCriticalGap ? criticalGapNote : undefined,
    });
  }

  // Sort: non-critical-gap positions first, then by score
  recommendations.sort((a, b) => {
    if (a.hasCriticalGap !== b.hasCriticalGap) return a.hasCriticalGap ? 1 : -1;
    return b.suitabilityScore - a.suitabilityScore;
  });

  return recommendations;
}

// ─── TOP N RECOMMENDATIONS ────────────────────────────────────────────────────
export function getTopPositionRecommendations(
  skills: PlayerSkills,
  topN: number = 3
): PositionRecommendation[] {
  return recommendPositions(skills).slice(0, topN);
}

// ─── POSITION TRANSITION SUGGESTIONS ─────────────────────────────────────────
export function getPositionTransitionSuggestions(
  currentPosition: string,
  skills: PlayerSkills
): { targetPosition: string; requiredImprovements: string[] }[] {
  const transitions: { targetPosition: string; requiredImprovements: string[] }[] = [];

  const transitionPaths: Record<string, string[]> = {
    CM:  ['CAM', 'CDM'],
    CAM: ['CM', 'LW', 'RW'],
    CDM: ['CM', 'CB'],
    LB:  ['LW', 'CB'],
    RB:  ['RW', 'CB'],
    CB:  ['CDM', 'LB', 'RB'],
    LW:  ['CAM', 'ST'],
    RW:  ['CAM', 'ST'],
    ST:  ['CAM', 'LW', 'RW'],
  };

  const possibleTransitions = transitionPaths[currentPosition] || [];

  for (const targetPosition of possibleTransitions) {
    const improvements = getPositionImprovements(skills, targetPosition);
    if (improvements.length > 0 && improvements.length <= 3) {
      transitions.push({
        targetPosition,
        requiredImprovements: improvements,
      });
    }
  }

  return transitions;
}
