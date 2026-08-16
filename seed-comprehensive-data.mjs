#!/usr/bin/env node
/**
 * Comprehensive Data Population Script
 * Populates the database with realistic sample data for testing
 * Run with: node seed-comprehensive-data.mjs
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

console.log('🚀 Starting comprehensive data population...\n');

// Helper function to generate random date within range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random integer
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to generate random float
function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

try {
  // 1. Create Teams
  console.log('📋 Creating teams...');
  const teams = [
    { name: 'U9 Eagles', ageGroup: 'U9' },
    { name: 'U11 Lions', ageGroup: 'U11' },
    { name: 'U13 Tigers', ageGroup: 'U13' },
    { name: 'U15 Panthers', ageGroup: 'U15' },
    { name: 'U17 Falcons', ageGroup: 'U17' },
    { name: 'U19 Wolves', ageGroup: 'U19' },
  ];

  const teamIds = [];
  for (const team of teams) {
    const [result] = await connection.execute(
      'INSERT INTO teams (name, ageGroup) VALUES (?, ?)',
      [team.name, team.ageGroup]
    );
    teamIds.push(result.insertId);
  }
  console.log(`✅ Created ${teams.length} teams\n`);

  // 2. Create Players
  console.log('👤 Creating players...');
  const egyptianFirstNames = [
    'Ahmed', 'Mohamed', 'Omar', 'Ali', 'Hassan', 'Mahmoud', 'Youssef', 'Khaled',
    'Ibrahim', 'Abdullah', 'Mustafa', 'Karim', 'Tarek', 'Amr', 'Hossam', 'Sherif',
    'Fares', 'Ziad', 'Adam', 'Yasser', 'Sayed', 'Hamza', 'Nour', 'Marwan', 'Basel'
  ];
  const egyptianLastNames = [
    'Hassan', 'Mohamed', 'Ali', 'Ibrahim', 'Mahmoud', 'Ahmed', 'Youssef', 'Khaled',
    'Abdullah', 'Salem', 'Farouk', 'Nasser', 'Saad', 'Kamal', 'Rashid', 'Hamdi',
    'El-Sayed', 'Abdel-Rahman', 'El-Shenawy', 'Hegazy', 'Trezeguet', 'Salah'
  ];
  const positions = ['GK', 'DF', 'MF', 'FW'];

  const playerIds = [];
  let playerCount = 0;

  for (let teamIdx = 0; teamIdx < teamIds.length; teamIdx++) {
    const teamId = teamIds[teamIdx];
    const playersPerTeam = randomInt(15, 20);

    for (let i = 0; i < playersPerTeam; i++) {
      const firstName = egyptianFirstNames[randomInt(0, egyptianFirstNames.length - 1)];
      const lastName = egyptianLastNames[randomInt(0, egyptianLastNames.length - 1)];
      const position = positions[randomInt(0, positions.length - 1)];
      const positionEnum = position === 'GK' ? 'goalkeeper' : position === 'DF' ? 'defender' : position === 'MF' ? 'midfielder' : 'forward';
      const jerseyNumber = i + 1;
      const dateOfBirth = new Date(2005 + teamIdx, randomInt(0, 11), randomInt(1, 28)).toISOString().split('T')[0];
      const height = randomInt(150, 185);
      const weight = randomInt(45, 75);
      const ageGroup = teams[teamIdx].ageGroup;

      const [result] = await connection.execute(
        `INSERT INTO players (firstName, lastName, position, jerseyNumber, teamId, dateOfBirth, height, weight, preferredFoot, ageGroup, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [firstName, lastName, positionEnum, jerseyNumber, teamId, dateOfBirth, height, weight, Math.random() > 0.2 ? 'right' : 'left', ageGroup, 'active']
      );
      playerIds.push({ id: result.insertId, teamId, position });
      playerCount++;
    }
  }
  console.log(`✅ Created ${playerCount} players\n`);

  // 3. Create Training Sessions
  console.log('🏋️ Creating training sessions...');
  const sessionTypes = ['Technical', 'Tactical', 'Physical', 'Mental', 'Match Preparation'];
  const sessionCount = 30;

  for (let i = 0; i < sessionCount; i++) {
    const teamId = teamIds[randomInt(0, teamIds.length - 1)];
    const sessionDate = randomDate(new Date(2024, 0, 1), new Date());
    const sessionType = sessionTypes[randomInt(0, sessionTypes.length - 1)];
    const duration = randomInt(60, 120);
    const intensity = ['Low', 'Medium', 'High'][randomInt(0, 2)];

    await connection.execute(
      `INSERT INTO trainingSessions (teamId, date, type, duration, intensity, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [teamId, sessionDate, sessionType, duration, intensity, `${sessionType} training session`]
    );
  }
  console.log(`✅ Created ${sessionCount} training sessions\n`);

  // 4. Create Matches
  console.log('⚽ Creating matches...');
  const opponents = [
    'Al Ahly Academy', 'Zamalek Youth', 'Pyramids FC Youth', 'ENPPI Academy',
    'Ismaily Youth', 'Arab Contractors Youth', 'El Gouna Academy', 'Smouha Youth'
  ];
  const matchCount = 25;

  const matchIds = [];
  for (let i = 0; i < matchCount; i++) {
    const teamId = teamIds[randomInt(0, teamIds.length - 1)];
    const opponent = opponents[randomInt(0, opponents.length - 1)];
    const matchDate = randomDate(new Date(2024, 0, 1), new Date());
    const isHome = Math.random() > 0.5;
    const goalsFor = randomInt(0, 5);
    const goalsAgainst = randomInt(0, 4);
    const result = goalsFor > goalsAgainst ? 'win' : goalsFor < goalsAgainst ? 'loss' : 'draw';

    const [matchResult] = await connection.execute(
      `INSERT INTO matches (teamId, opponent, date, location, goalsFor, goalsAgainst, result, matchType)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [teamId, opponent, matchDate, isHome ? 'Home' : 'Away', goalsFor, goalsAgainst, result, 'League']
    );
    matchIds.push({ id: matchResult.insertId, teamId });
  }
  console.log(`✅ Created ${matchCount} matches\n`);

  // 5. Create Performance Metrics
  console.log('📊 Creating performance metrics...');
  let metricsCount = 0;

  for (const player of playerIds) {
    const numMetrics = randomInt(5, 15);
    for (let i = 0; i < numMetrics; i++) {
      const metricDate = randomDate(new Date(2024, 0, 1), new Date());

      await connection.execute(
        `INSERT INTO performanceMetrics 
         (playerId, date, technicalScore, physicalScore, tacticalScore, mentalScore, 
          distance, sprints, topSpeed, touches, passes, passAccuracy, shots, goals, assists)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          player.id, metricDate,
          randomInt(60, 95), randomInt(60, 95), randomInt(60, 95), randomInt(60, 95),
          randomFloat(5, 12, 1), randomInt(10, 40), randomFloat(25, 35, 1),
          randomInt(30, 80), randomInt(20, 60), randomFloat(70, 95, 1),
          randomInt(0, 8), randomInt(0, 3), randomInt(0, 2)
        ]
      );
      metricsCount++;
    }
  }
  console.log(`✅ Created ${metricsCount} performance metrics\n`);

  // 6. Create Mental Assessments
  console.log('🧠 Creating mental assessments...');
  let mentalCount = 0;

  for (const player of playerIds) {
    const numAssessments = randomInt(3, 8);
    for (let i = 0; i < numAssessments; i++) {
      const assessmentDate = randomDate(new Date(2024, 0, 1), new Date());

      await connection.execute(
        `INSERT INTO mentalAssessments 
         (playerId, date, anxietyLevel, confidenceLevel, focusLevel, resilienceScore, 
          stressLevel, motivationLevel, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          player.id, assessmentDate,
          randomInt(1, 10), randomInt(1, 10), randomInt(1, 10), randomInt(1, 10),
          randomInt(1, 10), randomInt(1, 10),
          'Regular mental assessment'
        ]
      );
      mentalCount++;
    }
  }
  console.log(`✅ Created ${mentalCount} mental assessments\n`);

  // 7. Create Nutrition Plans
  console.log('🍎 Creating nutrition plans...');
  const mealTypes = ['Pre-Training', 'Post-Training', 'Match Day', 'Recovery', 'General'];
  let nutritionCount = 0;

  for (const player of playerIds) {
    const numPlans = randomInt(2, 5);
    for (let i = 0; i < numPlans; i++) {
      const planDate = randomDate(new Date(2024, 0, 1), new Date());
      const mealType = mealTypes[randomInt(0, mealTypes.length - 1)];

      await connection.execute(
        `INSERT INTO nutritionPlans 
         (playerId, date, mealType, calories, protein, carbs, fats, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          player.id, planDate, mealType,
          randomInt(1800, 3000), randomInt(80, 150), randomInt(200, 350), randomInt(50, 90),
          `${mealType} nutrition plan`
        ]
      );
      nutritionCount++;
    }
  }
  console.log(`✅ Created ${nutritionCount} nutrition plans\n`);

  // 8. Create Physical Training Workouts
  console.log('💪 Creating physical workouts...');
  const workoutTypes = ['Strength', 'Endurance', 'Speed', 'Agility', 'Flexibility', 'Recovery'];
  let workoutCount = 0;

  for (const player of playerIds) {
    const numWorkouts = randomInt(5, 12);
    for (let i = 0; i < numWorkouts; i++) {
      const workoutDate = randomDate(new Date(2024, 0, 1), new Date());
      const workoutType = workoutTypes[randomInt(0, workoutTypes.length - 1)];

      await connection.execute(
        `INSERT INTO physicalWorkouts 
         (playerId, date, workoutType, duration, intensity, exercises, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          player.id, workoutDate, workoutType,
          randomInt(30, 90), ['Low', 'Medium', 'High'][randomInt(0, 2)],
          `${workoutType} exercises`, `${workoutType} workout session`
        ]
      );
      workoutCount++;
    }
  }
  console.log(`✅ Created ${workoutCount} physical workouts\n`);

  // 9. Create Individual Development Plans (IDPs)
  console.log('🎯 Creating development plans...');
  const goalCategories = ['Technical', 'Physical', 'Tactical', 'Mental'];
  let idpCount = 0;

  for (const player of playerIds) {
    const numGoals = randomInt(3, 6);
    for (let i = 0; i < numGoals; i++) {
      const category = goalCategories[randomInt(0, goalCategories.length - 1)];
      const startDate = randomDate(new Date(2024, 0, 1), new Date(2024, 6, 1));
      const targetDate = randomDate(new Date(2024, 6, 1), new Date(2024, 11, 31));
      const progress = randomInt(0, 100);

      await connection.execute(
        `INSERT INTO developmentPlans 
         (playerId, category, goal, startDate, targetDate, progress, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          player.id, category,
          `Improve ${category.toLowerCase()} skills`,
          startDate, targetDate, progress,
          progress >= 100 ? 'completed' : progress > 0 ? 'in_progress' : 'not_started'
        ]
      );
      idpCount++;
    }
  }
  console.log(`✅ Created ${idpCount} development plans\n`);

  // 10. Create Player Match Stats
  console.log('📈 Creating player match stats...');
  let matchStatsCount = 0;

  for (const match of matchIds) {
    // Get players from the match team
    const teamPlayers = playerIds.filter(p => p.teamId === match.teamId);
    const playingPlayers = teamPlayers.slice(0, randomInt(11, 16)); // 11-16 players per match

    for (const player of playingPlayers) {
      const minutesPlayed = randomInt(0, 90);
      const goals = player.position === 'FW' ? randomInt(0, 2) : player.position === 'MF' ? randomInt(0, 1) : 0;
      const assists = player.position !== 'GK' ? randomInt(0, 2) : 0;

      await connection.execute(
        `INSERT INTO playerMatchStats 
         (playerId, matchId, minutesPlayed, goals, assists, shots, shotsOnTarget, 
          passes, passAccuracy, tackles, interceptions, fouls, yellowCards, redCards)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          player.id, match.id, minutesPlayed, goals, assists,
          randomInt(0, 8), randomInt(0, 5), randomInt(10, 50), randomFloat(70, 95, 1),
          player.position === 'DF' ? randomInt(3, 10) : randomInt(0, 5),
          player.position === 'DF' ? randomInt(2, 8) : randomInt(0, 4),
          randomInt(0, 3), Math.random() > 0.9 ? 1 : 0, Math.random() > 0.98 ? 1 : 0
        ]
      );
      matchStatsCount++;
    }
  }
  console.log(`✅ Created ${matchStatsCount} player match stats\n`);

  console.log('✨ Data population complete!\n');
  console.log('📊 Summary:');
  console.log(`   - Teams: ${teams.length}`);
  console.log(`   - Players: ${playerCount}`);
  console.log(`   - Training Sessions: ${sessionCount}`);
  console.log(`   - Matches: ${matchCount}`);
  console.log(`   - Performance Metrics: ${metricsCount}`);
  console.log(`   - Mental Assessments: ${mentalCount}`);
  console.log(`   - Nutrition Plans: ${nutritionCount}`);
  console.log(`   - Physical Workouts: ${workoutCount}`);
  console.log(`   - Development Plans: ${idpCount}`);
  console.log(`   - Player Match Stats: ${matchStatsCount}`);
  console.log('\n🎉 All done! Your platform is now populated with realistic data.\n');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} finally {
  await connection.end();
}
