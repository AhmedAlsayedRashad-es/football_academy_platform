/**
 * Seed training sessions and match data with correct column names
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

// ─── Check matches table structure ───────────────────────────────────────────
const [matchCols] = await conn.execute('DESCRIBE matches');
const matchColNames = matchCols.map(c => c.Field);
console.log('Match columns:', matchColNames.join(', '));

// ─── TRAINING SESSIONS (correct columns) ─────────────────────────────────────
console.log('\n🏃 Seeding training sessions...');

const [u17Rows] = await conn.execute("SELECT id FROM teams WHERE name = 'U17 Falcons' LIMIT 1");
const u17Id = u17Rows[0]?.id || 2;

const SESSION_DATA = [
  { date: '2025-09-02', type: 'tactical', title: 'High Press System Training', start: '09:00:00', end: '10:30:00', objectives: 'Master the high press triggers and compactness', drills: 'Rondo 4v2, High press game 8v8, Transition drill' },
  { date: '2025-09-04', type: 'technical', title: 'Passing & Combination Play', start: '09:00:00', end: '10:30:00', objectives: 'Improve quick passing and movement off the ball', drills: 'One-touch passing circuits, Triangle passing, Combination finishing' },
  { date: '2025-09-09', type: 'physical', title: 'Sprint & Agility Training', start: '08:00:00', end: '09:30:00', objectives: 'Improve explosive speed and change of direction', drills: '40m sprint intervals, Ladder drills, Cone agility course' },
  { date: '2025-09-11', type: 'tactical', title: 'Defensive Shape & Compactness', start: '09:00:00', end: '10:30:00', objectives: 'Maintain defensive structure and prevent through balls', drills: 'Shadow defending, Defensive block 11v11, Pressing triggers' },
  { date: '2025-09-16', type: 'set_pieces', title: 'Corner Kick Routines', start: '09:00:00', end: '10:30:00', objectives: 'Develop attacking and defensive corner routines', drills: 'Near post run, Far post delivery, Short corner combinations, Defensive zonal marking' },
  { date: '2025-09-18', type: 'technical', title: 'Finishing & Shooting Drills', start: '09:00:00', end: '10:30:00', objectives: 'Improve composure and accuracy in front of goal', drills: 'Shooting from crosses, 1v1 with goalkeeper, Volleys and half-volleys' },
  { date: '2025-09-23', type: 'scrimmage', title: '11v11 Practice Match', start: '09:00:00', end: '11:00:00', objectives: 'Apply tactical concepts in match conditions', drills: 'Full match with tactical instructions, Set piece practice' },
  { date: '2025-09-25', type: 'physical', title: 'Strength & Conditioning', start: '08:00:00', end: '09:30:00', objectives: 'Build muscular strength and endurance', drills: 'Resistance band work, Core stability, Plyometric jumps' },
  { date: '2025-10-02', type: 'tactical', title: 'Counter-Attack Patterns', start: '09:00:00', end: '10:30:00', objectives: 'Execute fast transitions from defense to attack', drills: '4v3 counter-attack, Long ball to striker, Wing counter patterns' },
  { date: '2025-10-07', type: 'technical', title: 'Dribbling & 1v1 Skills', start: '09:00:00', end: '10:30:00', objectives: 'Improve confidence and success rate in 1v1 situations', drills: 'Cone dribbling, 1v1 channel game, Skill moves practice' },
  { date: '2025-10-09', type: 'tactical', title: 'Build-Up Play from Back', start: '09:00:00', end: '10:30:00', objectives: 'Develop goalkeeper and defender distribution', drills: 'GK distribution, 3v2 build-up, Pressing resistance' },
  { date: '2025-10-14', type: 'set_pieces', title: 'Free Kick Attacking', start: '09:00:00', end: '10:30:00', objectives: 'Develop direct and indirect free kick routines', drills: 'Direct free kick technique, Wall routines, Indirect combinations' },
  { date: '2025-10-16', type: 'scrimmage', title: 'Small-Sided Games', start: '09:00:00', end: '10:30:00', objectives: 'High intensity game with quick decision making', drills: '5v5 possession, 7v7 with goals, Pressing game' },
  { date: '2025-10-21', type: 'physical', title: 'Recovery & Flexibility', start: '09:00:00', end: '10:00:00', objectives: 'Active recovery and injury prevention', drills: 'Yoga stretching, Foam rolling, Light jogging, Pool recovery' },
  { date: '2025-10-23', type: 'technical', title: 'Crossing & Heading', start: '09:00:00', end: '10:30:00', objectives: 'Improve delivery quality and aerial challenge success', drills: 'Crossing from wide positions, Heading accuracy, Defensive heading' },
];

for (const session of SESSION_DATA) {
  await run(
    `INSERT INTO training_sessions (teamId, title, description, sessionDate, startTime, endTime, location, sessionType, objectives, drills, status, attendanceCount, coachId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?)`,
    [u17Id, session.title,
     `${session.title} — Focus on team development and individual skill improvement.`,
     session.date, session.start, session.end,
     'Al Ahly Training Ground - Pitch 2',
     session.type, session.objectives, session.drills,
     18 + Math.floor(Math.random() * 3), 750031]
  );
}
console.log('✅ Training sessions seeded');

// ─── MATCHES (check actual column names) ─────────────────────────────────────
console.log('\n⚽ Seeding match data...');
console.log('Match columns:', matchColNames.join(', '));

const [existingMatches] = await conn.execute('SELECT id FROM matches LIMIT 5');
console.log(`Found ${existingMatches.length} existing matches`);

// Update existing matches with scores if they don't have them
if (matchColNames.includes('homeScore') || matchColNames.includes('home_score')) {
  const scoreCol = matchColNames.includes('homeScore') ? 'homeScore' : 'home_score';
  const awayScoreCol = matchColNames.includes('awayScore') ? 'awayScore' : 'away_score';
  const statusCol = matchColNames.includes('status') ? 'status' : null;

  for (const match of existingMatches) {
    const homeScore = Math.floor(Math.random() * 4);
    const awayScore = Math.floor(Math.random() * 3);
    if (statusCol) {
      await run(
        `UPDATE matches SET ${scoreCol}=?, ${awayScoreCol}=?, ${statusCol}='completed' WHERE id=? AND ${scoreCol} IS NULL`,
        [homeScore, awayScore, match.id]
      );
    } else {
      await run(
        `UPDATE matches SET ${scoreCol}=?, ${awayScoreCol}=? WHERE id=? AND ${scoreCol} IS NULL`,
        [homeScore, awayScore, match.id]
      );
    }
  }
  console.log('✅ Match scores updated');
}

// ─── LIVE MATCH EVENTS (correct columns) ─────────────────────────────────────
console.log('\n🎯 Seeding live match events...');

const [liveMatchCols] = await conn.execute('DESCRIBE match_events');
const liveMatchColNames = liveMatchCols.map(c => c.Field);
console.log('Match event columns:', liveMatchColNames.join(', '));

// match_events has: id, liveMatchId, eventType, minute, playerId, playerName, assistPlayerId, assistPlayerName, substitutedPlayerId, substitutedPlayerName, isOurTeam, description, createdAt
// Get live matches
const [liveMatchRows] = await conn.execute("SHOW TABLES LIKE 'live_matches'");
if (liveMatchRows.length > 0) {
  const [liveMatches] = await conn.execute('SELECT id FROM live_matches ORDER BY id LIMIT 5');
  if (liveMatches.length > 0) {
    const liveMatchId = liveMatches[0].id;
    const EVENTS = [
      { eventType: 'goal', minute: 12, playerId: 1004, playerName: 'Youssef Mahmoud', assistPlayerId: 1003, assistPlayerName: 'Omar Khaled', isOurTeam: 1, description: 'Header from corner kick — Youssef Mahmoud rises highest to power home' },
      { eventType: 'yellow_card', minute: 23, playerId: 150066, playerName: 'Basel Hamdi', isOurTeam: 1, description: 'Tactical foul to stop counter-attack' },
      { eventType: 'goal', minute: 34, playerId: 1003, playerName: 'Omar Khaled', assistPlayerId: 150070, assistPlayerName: 'Fares Mahmoud', isOurTeam: 1, description: 'Long range strike — Omar Khaled fires into top corner from 25 yards' },
      { eventType: 'save', minute: 45, playerId: 1001, playerName: 'Ahmed Sayed', isOurTeam: 1, description: 'Crucial save to keep clean sheet at half time' },
      { eventType: 'goal', minute: 67, playerId: 1004, playerName: 'Youssef Mahmoud', isOurTeam: 1, description: 'Counter-attack finish — one-on-one with goalkeeper, clinical finish' },
      { eventType: 'substitution', minute: 72, playerId: 150074, playerName: 'Hossam Salem', substitutedPlayerId: 1004, substitutedPlayerName: 'Youssef Mahmoud', isOurTeam: 1, description: 'Tactical substitution — fresh legs for the final 20 minutes' },
      { eventType: 'goal', minute: 85, playerId: 150074, playerName: 'Hossam Salem', isOurTeam: 1, description: 'Penalty kick — composed finish to seal the victory' },
    ];
    for (const evt of EVENTS) {
      await run(
        `INSERT INTO match_events (liveMatchId, eventType, minute, playerId, playerName, assistPlayerId, assistPlayerName, substitutedPlayerId, substitutedPlayerName, isOurTeam, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [liveMatchId, evt.eventType, evt.minute, evt.playerId || null, evt.playerName || null,
         evt.assistPlayerId || null, evt.assistPlayerName || null,
         evt.substitutedPlayerId || null, evt.substitutedPlayerName || null,
         evt.isOurTeam, evt.description]
      );
    }
    console.log('✅ Live match events seeded');
  }
}

// ─── TRAINING ATTENDANCE ─────────────────────────────────────────────────────
console.log('\n📋 Seeding training attendance...');

const [attendTables] = await conn.execute("SHOW TABLES LIKE 'training_attendance'");
if (attendTables.length > 0) {
  const [attendCols] = await conn.execute('DESCRIBE training_attendance');
  const attendColNames = attendCols.map(c => c.Field);
  console.log('Attendance columns:', attendColNames.join(', '));

  const [sessions] = await conn.execute('SELECT id FROM training_sessions ORDER BY id DESC LIMIT 15');
  const PLAYER_IDS = [1001, 1003, 1004, 150066, 150068, 150070, 150074, 390001, 390002, 390003];

  for (const session of sessions) {
    for (const playerId of PLAYER_IDS) {
      const attended = Math.random() > 0.1; // 90% attendance rate
      const rating = attended ? Math.floor(6 + Math.random() * 4) : null;
      if (attendColNames.includes('attended')) {
        await run(
          `INSERT INTO training_attendance (sessionId, playerId, attended, performanceRating, notes)
           VALUES (?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE attended=VALUES(attended), performanceRating=VALUES(performanceRating)`,
          [session.id, playerId, attended ? 1 : 0, rating, attended ? 'Present and engaged' : 'Absent — notified coach']
        );
      } else if (attendColNames.includes('status')) {
        await run(
          `INSERT INTO training_attendance (sessionId, playerId, status, performanceRating)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE status=VALUES(status)`,
          [session.id, playerId, attended ? 'present' : 'absent', rating]
        );
      }
    }
  }
  console.log('✅ Training attendance seeded');
} else {
  console.log('⚠️ training_attendance table not found');
}

await conn.end();
console.log('\n🎉 Training & match seed complete!');
