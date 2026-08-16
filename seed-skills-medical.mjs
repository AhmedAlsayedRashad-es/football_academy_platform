/**
 * Seed skill scores and medical data with correct column names
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
console.log('✅ Connected');

const run = async (sql, params = []) => {
  try {
    const [result] = await conn.execute(sql, params);
    return result;
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return null;
    console.error('SQL Error:', e.code, e.message.slice(0, 120));
    return null;
  }
};

const PLAYERS = [
  { id: 1,      position: 'forward',    age: 17, height: 175, weight: 68 },
  { id: 2,      position: 'midfielder', age: 16, height: 172, weight: 65 },
  { id: 3,      position: 'defender',   age: 17, height: 180, weight: 72 },
  { id: 4,      position: 'goalkeeper', age: 16, height: 185, weight: 76 },
  { id: 1001,   position: 'goalkeeper', age: 17, height: 186, weight: 77 },
  { id: 1003,   position: 'midfielder', age: 16, height: 173, weight: 66 },
  { id: 1004,   position: 'forward',    age: 17, height: 176, weight: 69 },
  { id: 150066, position: 'defender',   age: 16, height: 181, weight: 73 },
  { id: 150068, position: 'midfielder', age: 15, height: 171, weight: 64 },
  { id: 150070, position: 'midfielder', age: 16, height: 174, weight: 67 },
  { id: 150074, position: 'forward',    age: 15, height: 177, weight: 70 },
  { id: 390001, position: 'midfielder', age: 17, height: 172, weight: 65 },
  { id: 390002, position: 'forward',    age: 17, height: 175, weight: 68 },
  { id: 390003, position: 'defender',   age: 16, height: 180, weight: 72 },
];

// ─── SKILL SCORES (correct columns) ──────────────────────────────────────────
console.log('\n⭐ Seeding skill scores with correct columns...');

const SKILLS = {
  forward: {
    ballControl: 84, firstTouch: 85, dribbling: 82, passing: 72, shooting: 87, crossing: 70,
    heading: 80, leftFootScore: 65, rightFootScore: 90, twoFootedScore: 72, weakFootUsage: 35,
    speed: 88, acceleration: 90, agility: 85, stamina: 78, strength: 76, jumping: 80,
    positioning: 88, vision: 76, composure: 80, decisionMaking: 78, workRate: 75,
    marking: 42, tackling: 45, interceptions: 48,
    technicalOverall: 82, physicalOverall: 82, mentalOverall: 78, defensiveOverall: 45,
    overallRating: 82, potentialRating: 88,
  },
  midfielder: {
    ballControl: 83, firstTouch: 85, dribbling: 80, passing: 88, shooting: 72, crossing: 78,
    heading: 70, leftFootScore: 72, rightFootScore: 85, twoFootedScore: 78, weakFootUsage: 55,
    speed: 76, acceleration: 78, agility: 80, stamina: 88, strength: 72, jumping: 70,
    positioning: 84, vision: 88, composure: 83, decisionMaking: 85, workRate: 88,
    marking: 68, tackling: 70, interceptions: 72,
    technicalOverall: 83, physicalOverall: 77, mentalOverall: 85, defensiveOverall: 70,
    overallRating: 79, potentialRating: 86,
  },
  defender: {
    ballControl: 72, firstTouch: 72, dribbling: 65, passing: 74, shooting: 45, crossing: 60,
    heading: 84, leftFootScore: 68, rightFootScore: 82, twoFootedScore: 74, weakFootUsage: 40,
    speed: 72, acceleration: 74, agility: 70, stamina: 82, strength: 84, jumping: 84,
    positioning: 86, vision: 72, composure: 80, decisionMaking: 78, workRate: 80,
    marking: 86, tackling: 85, interceptions: 83,
    technicalOverall: 70, physicalOverall: 82, mentalOverall: 79, defensiveOverall: 85,
    overallRating: 77, potentialRating: 83,
  },
  goalkeeper: {
    ballControl: 72, firstTouch: 72, dribbling: 42, passing: 68, shooting: 30, crossing: 45,
    heading: 70, leftFootScore: 60, rightFootScore: 75, twoFootedScore: 66, weakFootUsage: 30,
    speed: 55, acceleration: 58, agility: 82, stamina: 76, strength: 76, jumping: 80,
    positioning: 88, vision: 80, composure: 82, decisionMaking: 82, workRate: 78,
    marking: 75, tackling: 60, interceptions: 65,
    technicalOverall: 65, physicalOverall: 74, mentalOverall: 82, defensiveOverall: 82,
    overallRating: 80, potentialRating: 85,
  },
};

for (const player of PLAYERS) {
  const s = SKILLS[player.position] || SKILLS.midfielder;
  // Add slight variation per player
  const vary = (v) => Math.min(99, Math.max(30, v + Math.floor(Math.random() * 7 - 3)));
  await run(
    `INSERT INTO player_skill_scores
     (playerId, assessmentDate, ballControl, firstTouch, dribbling, passing, shooting, crossing,
      heading, leftFootScore, rightFootScore, twoFootedScore, weakFootUsage,
      speed, acceleration, agility, stamina, strength, jumping,
      positioning, vision, composure, decisionMaking, workRate,
      marking, tackling, interceptions,
      technicalOverall, physicalOverall, mentalOverall, defensiveOverall,
      overallRating, potentialRating, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       ballControl=VALUES(ballControl), firstTouch=VALUES(firstTouch), dribbling=VALUES(dribbling),
       passing=VALUES(passing), shooting=VALUES(shooting), crossing=VALUES(crossing),
       speed=VALUES(speed), acceleration=VALUES(acceleration), agility=VALUES(agility),
       stamina=VALUES(stamina), strength=VALUES(strength), positioning=VALUES(positioning),
       vision=VALUES(vision), composure=VALUES(composure), workRate=VALUES(workRate),
       marking=VALUES(marking), tackling=VALUES(tackling), interceptions=VALUES(interceptions),
       technicalOverall=VALUES(technicalOverall), physicalOverall=VALUES(physicalOverall),
       mentalOverall=VALUES(mentalOverall), defensiveOverall=VALUES(defensiveOverall),
       overallRating=VALUES(overallRating), potentialRating=VALUES(potentialRating)`,
    [player.id, '2025-06-01',
     vary(s.ballControl), vary(s.firstTouch), vary(s.dribbling), vary(s.passing),
     vary(s.shooting), vary(s.crossing), vary(s.heading),
     vary(s.leftFootScore), vary(s.rightFootScore), vary(s.twoFootedScore), s.weakFootUsage,
     vary(s.speed), vary(s.acceleration), vary(s.agility), vary(s.stamina), vary(s.strength), vary(s.jumping),
     vary(s.positioning), vary(s.vision), vary(s.composure), vary(s.decisionMaking), vary(s.workRate),
     vary(s.marking), vary(s.tackling), vary(s.interceptions),
     vary(s.technicalOverall), vary(s.physicalOverall), vary(s.mentalOverall), vary(s.defensiveOverall),
     vary(s.overallRating), vary(s.potentialRating),
     `Comprehensive skill assessment — ${player.position} profile. Assessed by head coach.`]
  );
}
console.log('✅ Skill scores seeded');

// ─── MEDICAL DATA (correct columns: height, weight, bodyFat, vo2max, etc.) ───
console.log('\n🏥 Seeding medical data with correct columns...');

const MEDICAL = {
  forward:    { bodyFat: 9.5, muscleMass: 38.2, bmi: 22.2, restingHR: 52, maxHR: 198, bpSys: 118, bpDia: 72, vo2max: 58.5, injuryRisk: 25, injuryLevel: 'low' },
  midfielder: { bodyFat: 9.8, muscleMass: 36.2, bmi: 22.0, restingHR: 50, maxHR: 200, bpSys: 116, bpDia: 70, vo2max: 60.2, injuryRisk: 20, injuryLevel: 'low' },
  defender:   { bodyFat: 11.0, muscleMass: 40.2, bmi: 22.2, restingHR: 54, maxHR: 196, bpSys: 120, bpDia: 74, vo2max: 56.8, injuryRisk: 30, injuryLevel: 'low' },
  goalkeeper: { bodyFat: 11.5, muscleMass: 41.6, bmi: 22.2, restingHR: 56, maxHR: 194, bpSys: 122, bpDia: 76, vo2max: 54.5, injuryRisk: 22, injuryLevel: 'low' },
};

const AI_ANALYSIS = {
  forward: 'Player shows excellent cardiovascular fitness with VO2max above U17 professional average (55 ml/kg/min). Body fat percentage is optimal for a forward. Injury risk is low. Recommend continued strength training to improve physical duels. Monitor hamstring flexibility.',
  midfielder: 'Outstanding aerobic capacity — highest in the squad. Lean muscle mass supports high work rate. Low injury risk profile. Recommend maintaining current fitness regime. Slight increase in protein intake recommended to support muscle development.',
  defender: 'Strong physical profile with high muscle mass. Body fat trending downward — positive sign. Moderate injury risk due to previous shoulder injury. Recommend continued shoulder strengthening exercises. VO2max slightly below optimal — interval training recommended.',
  goalkeeper: 'Good overall fitness profile. Body fat within optimal range for goalkeeper. Injury risk low. Recommend focus on explosive power training (plyometrics) to improve reaction speed. Wrist strengthening exercises recommended following previous injury.',
};

for (const player of PLAYERS) {
  const med = MEDICAL[player.position] || MEDICAL.midfielder;
  const vary = (v, range = 3) => +(v + (Math.random() * range * 2 - range)).toFixed(1);
  await run(
    `INSERT INTO player_medical_data
     (playerId, height, weight, bodyFat, muscleMass, bmi, restingHeartRate, maxHeartRate,
      bloodPressureSystolic, bloodPressureDiastolic, vo2max, injuryRiskScore, injuryRiskLevel, aiRiskAnalysis, assessmentDate, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       height=VALUES(height), weight=VALUES(weight), bodyFat=VALUES(bodyFat),
       muscleMass=VALUES(muscleMass), bmi=VALUES(bmi), restingHeartRate=VALUES(restingHeartRate),
       vo2max=VALUES(vo2max), injuryRiskScore=VALUES(injuryRiskScore),
       injuryRiskLevel=VALUES(injuryRiskLevel), aiRiskAnalysis=VALUES(aiRiskAnalysis),
       assessmentDate=VALUES(assessmentDate)`,
    [player.id, player.height, player.weight,
     vary(med.bodyFat, 1.5), vary(med.muscleMass, 2), vary(med.bmi, 0.5),
     Math.floor(vary(med.restingHR, 3)), Math.floor(vary(med.maxHR, 3)),
     Math.floor(vary(med.bpSys, 4)), Math.floor(vary(med.bpDia, 3)),
     vary(med.vo2max, 2), Math.floor(vary(med.injuryRisk, 5)), med.injuryLevel,
     AI_ANALYSIS[player.position] || AI_ANALYSIS.midfielder,
     '2025-06-01', 'Annual fitness assessment. All parameters within acceptable range for competitive play.']
  );
}
console.log('✅ Medical data seeded');

// ─── PLAYER STATS (goals, assists, appearances) ───────────────────────────────
console.log('\n📊 Seeding player stats...');

const [statTables] = await conn.execute("SHOW TABLES LIKE 'player_stats'");
if (statTables.length > 0) {
  const [statCols] = await conn.execute('DESCRIBE player_stats');
  const statColNames = statCols.map(c => c.Field);
  console.log('Player stats columns:', statColNames.join(', '));

  const STATS = {
    forward:    { appearances: 22, goals: 18, assists: 6, yellowCards: 2, redCards: 0, minutesPlayed: 1850, cleanSheets: 0 },
    midfielder: { appearances: 24, goals: 5, assists: 14, yellowCards: 3, redCards: 0, minutesPlayed: 2020, cleanSheets: 0 },
    defender:   { appearances: 23, goals: 2, assists: 3, yellowCards: 4, redCards: 0, minutesPlayed: 1980, cleanSheets: 12 },
    goalkeeper: { appearances: 22, goals: 0, assists: 1, yellowCards: 1, redCards: 0, minutesPlayed: 1980, cleanSheets: 14 },
  };

  for (const player of PLAYERS) {
    const st = STATS[player.position] || STATS.midfielder;
    if (statColNames.includes('appearances')) {
      await run(
        `INSERT INTO player_stats (playerId, season, appearances, goals, assists, yellowCards, redCards, minutesPlayed, cleanSheets)
         VALUES (?, '2024/25', ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE appearances=VALUES(appearances), goals=VALUES(goals), assists=VALUES(assists), minutesPlayed=VALUES(minutesPlayed)`,
        [player.id, st.appearances + Math.floor(Math.random() * 4 - 2),
         st.goals + Math.floor(Math.random() * 4 - 2),
         st.assists + Math.floor(Math.random() * 3 - 1),
         st.yellowCards, st.redCards, st.minutesPlayed, st.cleanSheets]
      );
    }
  }
  console.log('✅ Player stats seeded');
} else {
  console.log('⚠️ player_stats table not found');
}

// ─── TRAINING SESSIONS ────────────────────────────────────────────────────────
console.log('\n🏃 Seeding training sessions...');

const [trainTables] = await conn.execute("SHOW TABLES LIKE 'training_sessions'");
if (trainTables.length > 0) {
  const [trainCols] = await conn.execute('DESCRIBE training_sessions');
  const trainColNames = trainCols.map(c => c.Field);
  console.log('Training session columns:', trainColNames.join(', '));

  const [u17Rows] = await conn.execute("SELECT id FROM teams WHERE name = 'U17 Falcons' LIMIT 1");
  const u17Id = u17Rows[0]?.id || 2;

  const SESSION_DATES = [
    '2025-09-02', '2025-09-04', '2025-09-09', '2025-09-11', '2025-09-16',
    '2025-09-18', '2025-09-23', '2025-09-25', '2025-10-02', '2025-10-07',
    '2025-10-09', '2025-10-14', '2025-10-16', '2025-10-21', '2025-10-23',
  ];

  const SESSION_TYPES = ['tactical', 'technical', 'physical', 'set_pieces', 'scrimmage'];
  const SESSION_TITLES = {
    tactical: ['High Press System Training', 'Defensive Shape & Compactness', 'Counter-Attack Patterns', 'Build-Up Play from Back', 'Transition Defense to Attack'],
    technical: ['Passing & Combination Play', 'Finishing & Shooting Drills', 'Dribbling & 1v1 Skills', 'Crossing & Heading', 'First Touch & Ball Control'],
    physical: ['Pre-Season Fitness Test', 'Sprint & Agility Training', 'Strength & Conditioning', 'Recovery & Flexibility', 'Endurance Run'],
    set_pieces: ['Corner Kick Routines', 'Free Kick Attacking', 'Defensive Set Pieces', 'Penalty Practice'],
    scrimmage: ['11v11 Practice Match', 'Small-Sided Games', 'Positional Play Game'],
  };

  for (let i = 0; i < SESSION_DATES.length; i++) {
    const type = SESSION_TYPES[i % SESSION_TYPES.length];
    const titles = SESSION_TITLES[type];
    const title = titles[Math.floor(Math.random() * titles.length)];

    if (trainColNames.includes('title') && trainColNames.includes('teamId')) {
      await run(
        `INSERT INTO training_sessions (teamId, title, sessionType, sessionDate, duration, location, coachId, notes, attendanceCount, maxAttendance)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [u17Id, title, type, SESSION_DATES[i], 90, 'Al Ahly Training Ground - Pitch 2', 750031,
         `${title} — Focus on team shape and individual skill development. All players participated actively.`,
         18 + Math.floor(Math.random() * 3), 20]
      );
    } else if (trainColNames.includes('title')) {
      await run(
        `INSERT INTO training_sessions (title, sessionType, sessionDate, duration, location, coachId, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, type, SESSION_DATES[i], 90, 'Al Ahly Training Ground - Pitch 2', 750031,
         `${title} — Focus on team shape and individual skill development.`]
      );
    }
  }
  console.log('✅ Training sessions seeded');
} else {
  console.log('⚠️ training_sessions table not found');
}

// ─── MATCH DATA (enhance existing matches) ───────────────────────────────────
console.log('\n⚽ Checking match data...');

const [matchRows] = await conn.execute('SELECT id, homeTeamId, awayTeamId, homeScore, awayScore FROM matches ORDER BY id LIMIT 10');
console.log(`Found ${matchRows.length} matches`);

if (matchRows.length > 0) {
  // Update matches that have null scores
  for (const match of matchRows) {
    if (match.homeScore === null || match.homeScore === undefined) {
      const homeScore = Math.floor(Math.random() * 4);
      const awayScore = Math.floor(Math.random() * 3);
      await run(
        `UPDATE matches SET homeScore=?, awayScore=?, status='completed' WHERE id=?`,
        [homeScore, awayScore, match.id]
      );
    }
  }
  console.log('✅ Match scores updated');
}

await conn.end();
console.log('\n🎉 Skills & medical seed complete!');
