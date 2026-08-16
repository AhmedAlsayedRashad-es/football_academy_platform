/**
 * Seed player_muscle_measurements table with realistic data for all players
 * Measurements in centimeters (circumference)
 * Multiple measurement dates to show progress over time
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
    console.error('SQL Error:', e.code, e.message.slice(0, 120));
    return null;
  }
};

// Get all player IDs from the database
const [players] = await conn.execute('SELECT id, firstName, lastName, position FROM players ORDER BY id LIMIT 30');
console.log(`Found ${players.length} players`);

// Position-based baseline measurements (in cm)
const BASELINES = {
  forward: {
    leftQuad: 54, rightQuad: 55, leftHamstring: 48, rightHamstring: 49,
    leftCalf: 37, rightCalf: 38, leftBicep: 32, rightBicep: 33,
    chest: 96, waist: 78, hip: 94
  },
  midfielder: {
    leftQuad: 52, rightQuad: 53, leftHamstring: 47, rightHamstring: 48,
    leftCalf: 36, rightCalf: 37, leftBicep: 31, rightBicep: 32,
    chest: 94, waist: 76, hip: 92
  },
  defender: {
    leftQuad: 56, rightQuad: 57, leftHamstring: 50, rightHamstring: 51,
    leftCalf: 38, rightCalf: 39, leftBicep: 34, rightBicep: 35,
    chest: 98, waist: 80, hip: 96
  },
  goalkeeper: {
    leftQuad: 57, rightQuad: 58, leftHamstring: 51, rightHamstring: 52,
    leftCalf: 39, rightCalf: 40, leftBicep: 36, rightBicep: 37,
    chest: 100, waist: 82, hip: 98
  }
};

// Vary a measurement slightly
const vary = (base, range = 2) => {
  const delta = (Math.random() - 0.5) * range * 2;
  return (base + delta).toFixed(1);
};

// Measurement dates - 3 sessions over the past 6 months
const DATES = [
  '2025-10-01 09:00:00',
  '2026-01-15 09:00:00',
  '2026-03-20 09:00:00',
];

console.log('\n💪 Seeding player_muscle_measurements...');
let inserted = 0;

for (const player of players) {
  const position = player.position || 'midfielder';
  const baseline = BASELINES[position] || BASELINES.midfielder;
  
  for (let dateIdx = 0; dateIdx < DATES.length; dateIdx++) {
    const date = DATES[dateIdx];
    // Slight improvement over time (0.5% per session)
    const improvement = 1 + (dateIdx * 0.005);
    
    const result = await run(
      `INSERT INTO player_muscle_measurements 
       (playerId, measurementDate, leftQuad, rightQuad, leftHamstring, rightHamstring, 
        leftCalf, rightCalf, leftBicep, rightBicep, chest, waist, hip, notes, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        player.id,
        date,
        vary(baseline.leftQuad * improvement),
        vary(baseline.rightQuad * improvement),
        vary(baseline.leftHamstring * improvement),
        vary(baseline.rightHamstring * improvement),
        vary(baseline.leftCalf * improvement),
        vary(baseline.rightCalf * improvement),
        vary(baseline.leftBicep * improvement),
        vary(baseline.rightBicep * improvement),
        vary(baseline.chest * improvement),
        vary(baseline.waist * (2 - improvement * 0.3)), // waist decreases slightly
        vary(baseline.hip * improvement),
        dateIdx === 2 ? 'Latest measurement - good progress noted' : 
          dateIdx === 1 ? 'Mid-season check - on track' : 'Pre-season baseline measurement',
        date,
      ]
    );
    
    if (result) inserted++;
  }
  
  console.log(`  ✓ ${player.firstName} ${player.lastName} (${position}) - 3 measurement sessions`);
}

console.log(`\n✅ Inserted ${inserted} muscle measurement records for ${players.length} players`);

// Verify
const [count] = await conn.execute('SELECT COUNT(*) as cnt FROM player_muscle_measurements');
console.log(`📊 Total records in player_muscle_measurements: ${count[0].cnt}`);

await conn.end();
console.log('Done!');
