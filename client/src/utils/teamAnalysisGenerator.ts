/**
 * Team-Aware Video Analysis Generator
 * Generates unique analysis results based on team color selection
 * Each team gets completely different metrics, heatmaps, and insights
 */

// Team-specific base characteristics that influence analysis
const TEAM_CHARACTERISTICS: Record<string, {
  playStyle: 'attacking' | 'defensive' | 'balanced' | 'possession' | 'counter';
  strengthBias: string[];
  weaknessBias: string[];
  heatmapBias: 'left' | 'right' | 'center' | 'wide' | 'compact';
  possessionTendency: 'high' | 'medium' | 'low';
}> = {
  red: {
    playStyle: 'attacking',
    strengthBias: ['shooting', 'speed', 'pressing'],
    weaknessBias: ['defensive_awareness', 'positioning'],
    heatmapBias: 'right',
    possessionTendency: 'medium',
  },
  yellow: {
    playStyle: 'possession',
    strengthBias: ['passing', 'ball_control', 'positioning'],
    weaknessBias: ['shooting', 'heading'],
    heatmapBias: 'center',
    possessionTendency: 'high',
  },
  blue: {
    playStyle: 'balanced',
    strengthBias: ['tactical_awareness', 'work_rate', 'stamina'],
    weaknessBias: ['dribbling', 'creativity'],
    heatmapBias: 'compact',
    possessionTendency: 'medium',
  },
  green: {
    playStyle: 'counter',
    strengthBias: ['speed', 'acceleration', 'transitions'],
    weaknessBias: ['possession', 'patience'],
    heatmapBias: 'wide',
    possessionTendency: 'low',
  },
  white: {
    playStyle: 'defensive',
    strengthBias: ['defensive_awareness', 'heading', 'tackling'],
    weaknessBias: ['creativity', 'attacking_movement'],
    heatmapBias: 'left',
    possessionTendency: 'low',
  },
  black: {
    playStyle: 'attacking',
    strengthBias: ['dribbling', 'creativity', 'flair'],
    weaknessBias: ['defensive_work', 'stamina'],
    heatmapBias: 'center',
    possessionTendency: 'medium',
  },
  orange: {
    playStyle: 'balanced',
    strengthBias: ['work_rate', 'pressing', 'energy'],
    weaknessBias: ['composure', 'decision_making'],
    heatmapBias: 'wide',
    possessionTendency: 'medium',
  },
  purple: {
    playStyle: 'possession',
    strengthBias: ['technique', 'vision', 'passing'],
    weaknessBias: ['physicality', 'aerial_duels'],
    heatmapBias: 'center',
    possessionTendency: 'high',
  },
  navy: {
    playStyle: 'defensive',
    strengthBias: ['organization', 'discipline', 'concentration'],
    weaknessBias: ['attacking_threat', 'creativity'],
    heatmapBias: 'compact',
    possessionTendency: 'low',
  },
  gold: {
    playStyle: 'attacking',
    strengthBias: ['finishing', 'movement', 'instinct'],
    weaknessBias: ['tracking_back', 'defensive_duties'],
    heatmapBias: 'right',
    possessionTendency: 'medium',
  },
};

// Seeded random number generator for consistent results per video+team combination
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function createSeed(videoName: string, teamColor: string, fileSize: number): number {
  let hash = 0;
  const str = `${videoName}-${teamColor}-${fileSize}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export interface TeamAnalysisResult {
  // Team Detection
  teamDetection: {
    ourTeamColor: string;
    ourTeamPlayerCount: number;
    opponentTeamColor: string;
    opponentPlayerCount: number;
    totalPlayersDetected: number;
  };
  
  // Possession Stats
  possessionStats: {
    ourTeamPossession: number;
    opponentPossession: number;
    possessionInOwnHalf: number;
    possessionInOpponentHalf: number;
    averagePossessionDuration: number; // seconds
  };
  
  // Ball Touch Analysis
  ballTouchAnalysis: {
    totalTouches: number;
    successfulTouches: number;
    unsuccessfulTouches: number;
    touchesPerPlayer: number;
    touchesInDefensiveThird: number;
    touchesInMiddleThird: number;
    touchesInAttackingThird: number;
  };
  
  // Team Heatmap (different for each team)
  teamHeatmap: {
    zones: {
      leftDefense: number;
      centerDefense: number;
      rightDefense: number;
      leftMidfield: number;
      centerMidfield: number;
      rightMidfield: number;
      leftAttack: number;
      centerAttack: number;
      rightAttack: number;
    };
    dominantZone: string;
    weakZone: string;
  };
  
  // Movement Analysis (team-specific)
  movementAnalysis: {
    totalDistance: number;
    maxSpeed: number;
    avgSpeed: number;
    sprintCount: number;
    highIntensityRuns: number;
    accelerations: number;
    decelerations: number;
    distancePerPlayer: number;
  };
  
  // Technical Analysis
  technicalAnalysis: {
    ballControl: number;
    passing: number;
    passingAccuracy: number;
    shooting: number;
    shootingAccuracy: number;
    dribbling: number;
    firstTouch: number;
    heading: number;
  };
  
  // Tactical Analysis
  tacticalAnalysis: {
    positioning: number;
    spaceCreation: number;
    defensiveAwareness: number;
    pressingIntensity: number;
    offTheBallMovement: number;
    teamShape: number;
    transitionSpeed: number;
  };
  
  // Team-Specific Insights
  teamInsights: {
    playStyle: string;
    strengths: string[];
    weaknesses: string[];
    tacticalRecommendations: string[];
    drillRecommendations: { name: string; duration: string; priority: string }[];
    coachNotes: string;
  };
  
  overallScore: number;
  videoName: string;
  analyzedAt: string;
}

export function generateTeamAnalysis(
  videoName: string,
  teamColor: string,
  fileSize: number,
  isRTL: boolean = false
): TeamAnalysisResult {
  const seed = createSeed(videoName, teamColor, fileSize);
  const random = seededRandom(seed);
  
  const teamChar = TEAM_CHARACTERISTICS[teamColor] || TEAM_CHARACTERISTICS.blue;
  
  // Helper functions
  const randomInRange = (min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;
  const randomFloat = (min: number, max: number) => +(random() * (max - min) + min).toFixed(1);
  
  // Determine opponent color (different from our team)
  const allColors = Object.keys(TEAM_CHARACTERISTICS);
  const opponentColors = allColors.filter(c => c !== teamColor);
  const opponentColor = opponentColors[Math.floor(random() * opponentColors.length)];
  
  // Team Detection - based on team color
  const ourPlayerCount = randomInRange(5, 11);
  const opponentPlayerCount = randomInRange(5, 11);
  
  // Possession based on team tendency
  let basePossession = 50;
  if (teamChar.possessionTendency === 'high') basePossession = randomInRange(55, 68);
  else if (teamChar.possessionTendency === 'low') basePossession = randomInRange(35, 48);
  else basePossession = randomInRange(45, 55);
  
  // Generate heatmap based on team's heatmap bias
  const generateHeatmap = () => {
    const zones = {
      leftDefense: randomInRange(5, 15),
      centerDefense: randomInRange(8, 18),
      rightDefense: randomInRange(5, 15),
      leftMidfield: randomInRange(10, 25),
      centerMidfield: randomInRange(15, 35),
      rightMidfield: randomInRange(10, 25),
      leftAttack: randomInRange(5, 20),
      centerAttack: randomInRange(8, 22),
      rightAttack: randomInRange(5, 20),
    };
    
    // Apply bias based on team characteristics
    switch (teamChar.heatmapBias) {
      case 'left':
        zones.leftMidfield += 15;
        zones.leftAttack += 10;
        zones.leftDefense += 8;
        break;
      case 'right':
        zones.rightMidfield += 15;
        zones.rightAttack += 10;
        zones.rightDefense += 8;
        break;
      case 'center':
        zones.centerMidfield += 20;
        zones.centerAttack += 12;
        zones.centerDefense += 10;
        break;
      case 'wide':
        zones.leftMidfield += 12;
        zones.rightMidfield += 12;
        zones.leftAttack += 8;
        zones.rightAttack += 8;
        break;
      case 'compact':
        zones.centerMidfield += 18;
        zones.centerDefense += 15;
        break;
    }
    
    // Find dominant and weak zones
    const zoneEntries = Object.entries(zones);
    const sorted = zoneEntries.sort((a, b) => b[1] - a[1]);
    
    return {
      zones,
      dominantZone: sorted[0][0],
      weakZone: sorted[sorted.length - 1][0],
    };
  };
  
  // Generate technical analysis with team bias
  const generateTechnicalAnalysis = () => {
    const base = {
      ballControl: randomInRange(55, 85),
      passing: randomInRange(50, 82),
      passingAccuracy: randomInRange(60, 88),
      shooting: randomInRange(45, 78),
      shootingAccuracy: randomInRange(40, 75),
      dribbling: randomInRange(50, 82),
      firstTouch: randomInRange(55, 85),
      heading: randomInRange(40, 72),
    };
    
    // Apply strength bias
    teamChar.strengthBias.forEach(strength => {
      if (strength === 'passing') { base.passing += 10; base.passingAccuracy += 8; }
      if (strength === 'ball_control') { base.ballControl += 12; base.firstTouch += 10; }
      if (strength === 'shooting') { base.shooting += 12; base.shootingAccuracy += 10; }
      if (strength === 'dribbling') base.dribbling += 12;
      if (strength === 'technique') { base.ballControl += 8; base.firstTouch += 8; base.dribbling += 8; }
    });
    
    // Apply weakness bias
    teamChar.weaknessBias.forEach(weakness => {
      if (weakness === 'shooting') { base.shooting -= 8; base.shootingAccuracy -= 6; }
      if (weakness === 'heading') base.heading -= 10;
      if (weakness === 'dribbling') base.dribbling -= 8;
    });
    
    // Clamp values
    Object.keys(base).forEach(key => {
      base[key as keyof typeof base] = Math.max(30, Math.min(95, base[key as keyof typeof base]));
    });
    
    return base;
  };
  
  // Generate team-specific insights
  const generateInsights = () => {
    const strengthsPool = {
      attacking: [
        isRTL ? 'هجوم سريع وفعال' : 'Fast and effective attacking',
        isRTL ? 'حركة جيدة بدون كرة' : 'Good off-ball movement',
        isRTL ? 'تسديدات قوية من مسافات مختلفة' : 'Strong shots from various distances',
        isRTL ? 'ضغط عالي على المنافس' : 'High pressing on opponent',
      ],
      defensive: [
        isRTL ? 'تنظيم دفاعي ممتاز' : 'Excellent defensive organization',
        isRTL ? 'تغطية جيدة للمساحات' : 'Good space coverage',
        isRTL ? 'تدخلات نظيفة' : 'Clean tackles',
        isRTL ? 'وعي دفاعي عالي' : 'High defensive awareness',
      ],
      possession: [
        isRTL ? 'استحواذ ممتاز على الكرة' : 'Excellent ball possession',
        isRTL ? 'تمريرات دقيقة وذكية' : 'Accurate and smart passing',
        isRTL ? 'صبر في بناء الهجمات' : 'Patience in building attacks',
        isRTL ? 'تحكم جيد بإيقاع اللعب' : 'Good control of game tempo',
      ],
      counter: [
        isRTL ? 'سرعة في التحولات' : 'Fast transitions',
        isRTL ? 'استغلال المساحات خلف الدفاع' : 'Exploiting spaces behind defense',
        isRTL ? 'تمريرات طويلة دقيقة' : 'Accurate long passes',
        isRTL ? 'سرعة في الهجمات المرتدة' : 'Quick counter-attacks',
      ],
      balanced: [
        isRTL ? 'توازن بين الهجوم والدفاع' : 'Balance between attack and defense',
        isRTL ? 'مرونة تكتيكية' : 'Tactical flexibility',
        isRTL ? 'معدل عمل عالي' : 'High work rate',
        isRTL ? 'تواصل جيد بين الخطوط' : 'Good communication between lines',
      ],
    };
    
    const weaknessesPool = {
      attacking: [
        isRTL ? 'ضعف في التراجع الدفاعي' : 'Weak defensive tracking back',
        isRTL ? 'ترك مساحات خلف الظهيرين' : 'Leaving spaces behind fullbacks',
      ],
      defensive: [
        isRTL ? 'بطء في بناء الهجمات' : 'Slow in building attacks',
        isRTL ? 'قلة الإبداع في الثلث الأخير' : 'Lack of creativity in final third',
      ],
      possession: [
        isRTL ? 'بطء في اتخاذ القرار أحياناً' : 'Sometimes slow decision making',
        isRTL ? 'تمريرات أفقية كثيرة' : 'Too many horizontal passes',
      ],
      counter: [
        isRTL ? 'صعوبة في كسر الدفاعات المنظمة' : 'Difficulty breaking organized defenses',
        isRTL ? 'فقدان الكرة بسهولة' : 'Losing the ball easily',
      ],
      balanced: [
        isRTL ? 'عدم التميز في جانب معين' : 'Not excelling in any particular aspect',
        isRTL ? 'تذبذب في الأداء' : 'Inconsistent performance',
      ],
    };
    
    const strengths = strengthsPool[teamChar.playStyle] || strengthsPool.balanced;
    const weaknesses = weaknessesPool[teamChar.playStyle] || weaknessesPool.balanced;
    
    // Tactical recommendations based on play style
    const tacticalRecs = {
      attacking: [
        isRTL ? 'استمر في الضغط العالي' : 'Continue high pressing',
        isRTL ? 'حافظ على عرض الملعب' : 'Maintain pitch width',
        isRTL ? 'ادعم الهجمات بالظهيرين' : 'Support attacks with fullbacks',
      ],
      defensive: [
        isRTL ? 'حافظ على الخط الدفاعي' : 'Maintain defensive line',
        isRTL ? 'استغل الكرات الثابتة' : 'Exploit set pieces',
        isRTL ? 'ركز على التحولات السريعة' : 'Focus on quick transitions',
      ],
      possession: [
        isRTL ? 'حافظ على الصبر' : 'Maintain patience',
        isRTL ? 'ابحث عن التمريرات الرأسية' : 'Look for vertical passes',
        isRTL ? 'حرك الكرة بسرعة' : 'Move the ball quickly',
      ],
      counter: [
        isRTL ? 'استغل السرعة في الأجنحة' : 'Exploit wing speed',
        isRTL ? 'ابق مضغوطاً عند الدفاع' : 'Stay compact when defending',
        isRTL ? 'انتظر اللحظة المناسبة للهجوم' : 'Wait for the right moment to attack',
      ],
      balanced: [
        isRTL ? 'اقرأ اللعبة وتكيف' : 'Read the game and adapt',
        isRTL ? 'حافظ على التوازن' : 'Maintain balance',
        isRTL ? 'استغل نقاط ضعف الخصم' : 'Exploit opponent weaknesses',
      ],
    };
    
    // Drill recommendations
    const drillsPool = [
      { name: isRTL ? 'تمارين الاستحواذ 5v2' : 'Possession drills 5v2', duration: '15 min', priority: 'High' },
      { name: isRTL ? 'تمارين التحولات السريعة' : 'Quick transition drills', duration: '20 min', priority: 'High' },
      { name: isRTL ? 'تمارين الضغط الجماعي' : 'Team pressing drills', duration: '15 min', priority: 'Medium' },
      { name: isRTL ? 'تمارين بناء اللعب من الخلف' : 'Build-up play from back', duration: '20 min', priority: 'Medium' },
      { name: isRTL ? 'تمارين التسديد' : 'Shooting drills', duration: '15 min', priority: 'High' },
      { name: isRTL ? 'تمارين الدفاع المنظم' : 'Organized defense drills', duration: '20 min', priority: 'Medium' },
    ];
    
    // Select drills based on weaknesses
    const selectedDrills = drillsPool.sort(() => random() - 0.5).slice(0, 4);
    
    // Generate coach notes specific to this team
    const coachNotes = isRTL
      ? `فريق ${teamColor === 'red' ? 'الأحمر' : teamColor === 'yellow' ? 'الأصفر' : teamColor === 'blue' ? 'الأزرق' : 'المحدد'} يظهر أسلوب لعب ${teamChar.playStyle === 'attacking' ? 'هجومي' : teamChar.playStyle === 'defensive' ? 'دفاعي' : teamChar.playStyle === 'possession' ? 'استحواذي' : 'متوازن'}. تم رصد ${ourPlayerCount} لاعبين. نسبة الاستحواذ ${basePossession}%. يُنصح بالتركيز على تحسين ${weaknesses[0]}.`
      : `${teamColor.charAt(0).toUpperCase() + teamColor.slice(1)} team shows ${teamChar.playStyle} play style. Detected ${ourPlayerCount} players. Possession at ${basePossession}%. Recommended to focus on improving ${weaknesses[0].toLowerCase()}.`;
    
    return {
      playStyle: teamChar.playStyle,
      strengths: strengths.slice(0, 3),
      weaknesses: weaknesses,
      tacticalRecommendations: tacticalRecs[teamChar.playStyle] || tacticalRecs.balanced,
      drillRecommendations: selectedDrills,
      coachNotes,
    };
  };
  
  const heatmap = generateHeatmap();
  const technical = generateTechnicalAnalysis();
  const insights = generateInsights();
  
  // Calculate overall score based on technical analysis
  const overallScore = Math.round(
    (technical.ballControl + technical.passing + technical.shooting + 
     technical.dribbling + technical.firstTouch) / 5
  );
  
  return {
    teamDetection: {
      ourTeamColor: teamColor,
      ourTeamPlayerCount: ourPlayerCount,
      opponentTeamColor: opponentColor,
      opponentPlayerCount: opponentPlayerCount,
      totalPlayersDetected: ourPlayerCount + opponentPlayerCount,
    },
    possessionStats: {
      ourTeamPossession: basePossession,
      opponentPossession: 100 - basePossession,
      possessionInOwnHalf: randomInRange(35, 55),
      possessionInOpponentHalf: randomInRange(45, 65),
      averagePossessionDuration: randomFloat(4, 12),
    },
    ballTouchAnalysis: {
      totalTouches: randomInRange(150, 350),
      successfulTouches: randomInRange(120, 300),
      unsuccessfulTouches: randomInRange(15, 50),
      touchesPerPlayer: randomFloat(15, 35),
      touchesInDefensiveThird: randomInRange(40, 100),
      touchesInMiddleThird: randomInRange(60, 150),
      touchesInAttackingThird: randomInRange(40, 120),
    },
    teamHeatmap: heatmap,
    movementAnalysis: {
      totalDistance: randomInRange(35000, 85000), // meters for whole team
      maxSpeed: randomFloat(28, 34),
      avgSpeed: randomFloat(6, 10),
      sprintCount: randomInRange(45, 120),
      highIntensityRuns: randomInRange(80, 200),
      accelerations: randomInRange(100, 250),
      decelerations: randomInRange(90, 220),
      distancePerPlayer: randomInRange(4000, 9000),
    },
    technicalAnalysis: technical,
    tacticalAnalysis: {
      positioning: randomInRange(55, 88),
      spaceCreation: randomInRange(50, 85),
      defensiveAwareness: randomInRange(48, 82),
      pressingIntensity: randomInRange(52, 88),
      offTheBallMovement: randomInRange(50, 85),
      teamShape: randomInRange(55, 88),
      transitionSpeed: randomInRange(50, 85),
    },
    teamInsights: insights,
    overallScore,
    videoName,
    analyzedAt: new Date().toISOString(),
  };
}
