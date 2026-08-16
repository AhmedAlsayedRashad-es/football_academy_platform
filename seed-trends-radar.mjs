/**
 * Seed training session performance + skill score history for all players
 * This populates the Trends Charts and Radar Profile in the Player Progress Dashboard
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
console.log('✅ Connected to database');

const run = async (sql, params = []) => {
  try {
    const [result] = await conn.execute(sql, params);
    return result;
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return null;
    console.error('SQL Error:', e.code, e.message.slice(0, 100));
    return null;
  }
};

// Get all players
const [players] = await conn.execute('SELECT id, firstName, lastName, position, teamId FROM players ORDER BY id LIMIT 30');
console.log(`Found ${players.length} players`);

// Get teams
const [teams] = await conn.execute('SELECT id FROM teams LIMIT 5');
const defaultTeamId = teams[0]?.id || 1;

// ============================================================
// 1. TRAINING SESSION PERFORMANCE (for Trends Charts)
// ============================================================
console.log('\n📊 Seeding training_session_performance...');

// Check if table exists
const [tableCheck] = await conn.execute(`SHOW TABLES LIKE 'training_session_performance'`);
if (tableCheck.length === 0) {
  console.log('⚠️  training_session_performance table not found, skipping...');
} else {
  let inserted = 0;
  
  // 12 sessions over 6 months (bi-weekly)
  const sessionDates = [
    '2025-10-05', '2025-10-19', '2025-11-02', '2025-11-16',
    '2025-12-01', '2025-12-15', '2026-01-05', '2026-01-19',
    '2026-02-02', '2026-02-16', '2026-03-02', '2026-03-16',
  ];
  
  const sessionNames = [
    'Pre-Season Fitness', 'Technical Drills', 'Tactical Training', 'Match Simulation',
    'Speed & Agility', 'Ball Control Session', 'Defensive Drills', 'Attacking Patterns',
    'Set Piece Practice', 'Recovery Session', 'Competitive Scrimmage', 'Final Prep'
  ];
  
  for (const player of players) {
    const teamId = player.teamId || defaultTeamId;
    
    for (let i = 0; i < sessionDates.length; i++) {
      const date = sessionDates[i];
      const progress = i / (sessionDates.length - 1); // 0 to 1
      
      // Scores improve over time with some variation
      const base = (val, variance = 8) => {
        const improved = val + progress * 15;
        const noise = (Math.random() - 0.5) * variance;
        return Math.min(100, Math.max(40, Math.round(improved + noise)));
      };
      
      // Position-based base scores
      const isGK = player.position === 'goalkeeper';
      const isFW = player.position === 'forward';
      const isMF = player.position === 'midfielder';
      
      const physBase = isGK ? 70 : isFW ? 75 : 68;
      const techBase = isGK ? 65 : isFW ? 72 : isMF ? 78 : 70;
      const mentalBase = isGK ? 80 : isMF ? 75 : 70;
      
      const physicalScore = base(physBase);
      const technicalScore = base(techBase);
      const mentalScore = base(mentalBase);
      const rpe = Math.round(5 + Math.random() * 4); // 5-9
      
      await run(
        `INSERT INTO training_session_performance 
         (playerId, teamId, sessionDate, sessionName, physicalScore, speed, endurance, strength, agility,
          technicalScore, passing, shooting, dribbling, defending,
          mentalScore, focus, attitude, leadership, resilience,
          rpe, notes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          player.id, teamId, date, sessionNames[i],
          physicalScore, base(physBase-5), base(physBase+5), base(physBase-3), base(physBase+3),
          technicalScore, base(techBase+2), base(techBase-5), base(techBase), base(techBase-8),
          mentalScore, base(mentalBase+5), base(mentalBase), base(mentalBase-5), base(mentalBase+3),
          rpe,
          i === sessionDates.length - 1 ? 'Excellent session - player showing great improvement' :
            i % 3 === 0 ? 'Good effort, needs more work on positioning' : null,
          `${date} 09:00:00`,
        ]
      );
      inserted++;
    }
    console.log(`  ✓ ${player.firstName} ${player.lastName} - 12 sessions`);
  }
  console.log(`✅ Inserted ${inserted} session performance records`);
}

// ============================================================
// 2. PLAYER SKILL SCORES (for Radar Profile)
// ============================================================
console.log('\n🎯 Seeding player_skill_scores...');

const [skillTableCheck] = await conn.execute(`SHOW TABLES LIKE 'player_skill_scores'`);
if (skillTableCheck.length === 0) {
  console.log('⚠️  player_skill_scores table not found, skipping...');
} else {
  let inserted = 0;
  
  // 4 assessment dates
  const assessmentDates = [
    '2025-10-01', '2025-12-01', '2026-02-01', '2026-03-15'
  ];
  
  const positionSkills = {
    goalkeeper: {
      ballControl: 65, firstTouch: 70, dribbling: 55, passing: 72, shooting: 45, crossing: 50,
      heading: 75, leftFootScore: 65, rightFootScore: 70, twoFootedScore: 60, weakFootUsage: 55,
      speed: 68, acceleration: 65, agility: 75, stamina: 78, strength: 80, jumping: 85,
      positioning: 90, vision: 85, composure: 88, decisionMaking: 87, workRate: 80,
      marking: 70, tackling: 65, interceptions: 72,
    },
    defender: {
      ballControl: 68, firstTouch: 70, dribbling: 62, passing: 72, shooting: 55, crossing: 65,
      heading: 82, leftFootScore: 68, rightFootScore: 75, twoFootedScore: 65, weakFootUsage: 60,
      speed: 72, acceleration: 70, agility: 68, stamina: 80, strength: 85, jumping: 80,
      positioning: 85, vision: 72, composure: 80, decisionMaking: 78, workRate: 85,
      marking: 88, tackling: 85, interceptions: 82,
    },
    midfielder: {
      ballControl: 82, firstTouch: 85, dribbling: 78, passing: 88, shooting: 72, crossing: 80,
      heading: 70, leftFootScore: 75, rightFootScore: 82, twoFootedScore: 72, weakFootUsage: 68,
      speed: 75, acceleration: 72, agility: 80, stamina: 88, strength: 72, jumping: 70,
      positioning: 82, vision: 88, composure: 82, decisionMaking: 85, workRate: 90,
      marking: 72, tackling: 75, interceptions: 78,
    },
    forward: {
      ballControl: 85, firstTouch: 88, dribbling: 88, passing: 75, shooting: 90, crossing: 72,
      heading: 75, leftFootScore: 78, rightFootScore: 88, twoFootedScore: 75, weakFootUsage: 72,
      speed: 90, acceleration: 92, agility: 88, stamina: 80, strength: 75, jumping: 78,
      positioning: 88, vision: 80, composure: 85, decisionMaking: 82, workRate: 82,
      marking: 55, tackling: 52, interceptions: 55,
    },
  };
  
  for (const player of players) {
    const position = player.position || 'midfielder';
    const base = positionSkills[position] || positionSkills.midfielder;
    
    for (let i = 0; i < assessmentDates.length; i++) {
      const date = assessmentDates[i];
      const progress = i * 3; // +3 points per assessment
      
      const s = (val) => Math.min(99, Math.max(40, Math.round(val + progress + (Math.random() - 0.5) * 6)));
      
      const techOverall = Math.round((s(base.ballControl) + s(base.firstTouch) + s(base.dribbling) + s(base.passing) + s(base.shooting) + s(base.crossing)) / 6);
      const physOverall = Math.round((s(base.speed) + s(base.acceleration) + s(base.agility) + s(base.stamina) + s(base.strength)) / 5);
      const mentalOverall = Math.round((s(base.positioning) + s(base.vision) + s(base.composure) + s(base.decisionMaking) + s(base.workRate)) / 5);
      const defOverall = Math.round((s(base.marking) + s(base.tackling) + s(base.interceptions)) / 3);
      const overallRating = Math.round(techOverall * 0.35 + physOverall * 0.25 + mentalOverall * 0.25 + defOverall * 0.15);
      
      await run(
        `INSERT INTO player_skill_scores 
         (playerId, assessmentDate, ballControl, firstTouch, dribbling, passing, shooting, crossing,
          heading, leftFootScore, rightFootScore, twoFootedScore, weakFootUsage,
          speed, acceleration, agility, stamina, strength, jumping,
          positioning, vision, composure, decisionMaking, workRate,
          marking, tackling, interceptions,
          technicalOverall, physicalOverall, mentalOverall, defensiveOverall, overallRating, potentialRating,
          notes, assessedBy, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          player.id, date,
          s(base.ballControl), s(base.firstTouch), s(base.dribbling), s(base.passing), s(base.shooting), s(base.crossing),
          s(base.heading), s(base.leftFootScore), s(base.rightFootScore), s(base.twoFootedScore), s(base.weakFootUsage),
          s(base.speed), s(base.acceleration), s(base.agility), s(base.stamina), s(base.strength), s(base.jumping),
          s(base.positioning), s(base.vision), s(base.composure), s(base.decisionMaking), s(base.workRate),
          s(base.marking), s(base.tackling), s(base.interceptions),
          techOverall, physOverall, mentalOverall, defOverall, overallRating, Math.min(99, overallRating + 8),
          i === assessmentDates.length - 1 ? 'Latest assessment - showing consistent improvement' : null,
          1, // assessedBy coach id 1
          `${date} 10:00:00`,
        ]
      );
      inserted++;
    }
    console.log(`  ✓ ${player.firstName} ${player.lastName} - 4 skill assessments`);
  }
  console.log(`✅ Inserted ${inserted} skill score records`);
}

// ============================================================
// 3. WEEKLY PROGRESS (for the feedback.getWeeklyProgress)
// ============================================================
console.log('\n📈 Checking weekly_progress table...');
const [wpCheck] = await conn.execute(`SHOW TABLES LIKE 'weekly_progress'`);
if (wpCheck.length > 0) {
  let inserted = 0;
  const weeks = ['2026-03-02', '2026-03-09', '2026-03-16', '2026-03-23'];
  for (const player of players.slice(0, 10)) {
    for (const week of weeks) {
      const r = await run(
        `INSERT INTO weekly_progress (playerId, weekStart, sessionsAttended, sessionsTotal, avgPhysical, avgTechnical, avgMental, notes, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [player.id, week, 3 + Math.floor(Math.random() * 2), 4, 
         70 + Math.round(Math.random() * 20), 72 + Math.round(Math.random() * 18), 75 + Math.round(Math.random() * 15),
         null, `${week} 10:00:00`]
      );
      if (r) inserted++;
    }
  }
  console.log(`✅ Inserted ${inserted} weekly progress records`);
}

// Verify counts
const [sp] = await conn.execute('SELECT COUNT(*) as cnt FROM training_session_performance');
const [ss] = await conn.execute('SELECT COUNT(*) as cnt FROM player_skill_scores');
console.log(`\n📊 Final counts:`);
console.log(`  training_session_performance: ${sp[0].cnt}`);
console.log(`  player_skill_scores: ${ss[0].cnt}`);

await conn.end();
console.log('\n✅ Done seeding trends & radar data!');
