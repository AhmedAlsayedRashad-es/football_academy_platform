/**
 * Fix seed script with correct column names based on actual DB schema
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

const PLAYERS = [
  { id: 1,      position: 'forward',    weight: 68, height: 175 },
  { id: 2,      position: 'midfielder', weight: 65, height: 172 },
  { id: 3,      position: 'defender',   weight: 72, height: 180 },
  { id: 4,      position: 'goalkeeper', weight: 76, height: 185 },
  { id: 1001,   position: 'goalkeeper', weight: 77, height: 186 },
  { id: 1003,   position: 'midfielder', weight: 66, height: 173 },
  { id: 1004,   position: 'forward',    weight: 69, height: 176 },
  { id: 150066, position: 'defender',   weight: 73, height: 181 },
  { id: 150068, position: 'midfielder', weight: 64, height: 171 },
  { id: 150070, position: 'midfielder', weight: 67, height: 174 },
  { id: 150074, position: 'forward',    weight: 70, height: 177 },
  { id: 390001, position: 'midfielder', weight: 65, height: 172 },
  { id: 390002, position: 'forward',    weight: 68, height: 175 },
  { id: 390003, position: 'defender',   weight: 72, height: 180 },
];

const DATES = ['2024-09-01','2024-10-15','2024-12-01','2025-02-01','2025-04-01','2025-06-01'];

// ─── 1. InBody with correct columns ─────────────────────────────────────────
console.log('\n💪 Seeding InBody with correct columns...');

const INBODY_PROGRESSION = {
  forward:    { bodyFatPct: [11.2,10.8,10.5,10.2,9.8,9.5], muscleMass: [35.8,36.2,36.8,37.2,37.8,38.2], bmi: [22.2,22.5,22.9,23.2,22.9,23.2], visceralFat: [4,4,3,3,3,3], bmr: [1820,1835,1850,1865,1880,1895], inBodyScore: [72,74,76,78,80,82] },
  midfielder: { bodyFatPct: [12.0,11.5,11.0,10.6,10.2,9.8], muscleMass: [33.5,34.0,34.6,35.1,35.7,36.2], bmi: [22.0,22.3,22.7,23.0,22.7,23.0], visceralFat: [4,4,4,3,3,3], bmr: [1780,1795,1810,1825,1840,1855], inBodyScore: [70,72,74,76,78,80] },
  defender:   { bodyFatPct: [13.5,13.0,12.5,12.0,11.5,11.0], muscleMass: [37.2,37.8,38.4,39.0,39.6,40.2], bmi: [22.2,22.5,22.8,23.1,22.8,23.1], visceralFat: [5,5,4,4,4,3], bmr: [1860,1875,1890,1905,1920,1935], inBodyScore: [68,70,72,74,76,78] },
  goalkeeper: { bodyFatPct: [14.0,13.5,13.0,12.5,12.0,11.5], muscleMass: [38.5,39.1,39.8,40.4,41.0,41.6], bmi: [22.2,22.5,22.8,23.1,22.8,23.1], visceralFat: [5,5,5,4,4,4], bmr: [1900,1915,1930,1945,1960,1975], inBodyScore: [66,68,70,72,74,76] },
};

for (const player of PLAYERS) {
  const prog = INBODY_PROGRESSION[player.position] || INBODY_PROGRESSION.midfielder;
  for (let di = 0; di < DATES.length; di++) {
    const w = player.weight + di * 0.2;
    const fatMass = +(w * prog.bodyFatPct[di] / 100).toFixed(2);
    const leanMass = +(w - fatMass).toFixed(2);
    const muscleMass = prog.muscleMass[di];
    const totalWater = +(leanMass * 0.73).toFixed(2);
    await run(
      `INSERT INTO player_inbody (playerId, testDate, weight, height, bmi, bodyFatPercent, bodyFatMass, leanBodyMass, skeletalMuscleMass, totalBodyWater, intracellularWater, extracellularWater, proteinMass, mineralMass, visceralFatLevel, basalMetabolicRate, inBodyScore, rightArmMuscle, leftArmMuscle)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [player.id, DATES[di], w, player.height, prog.bmi[di],
       prog.bodyFatPct[di], fatMass, leanMass, muscleMass,
       totalWater, +(totalWater * 0.62).toFixed(2), +(totalWater * 0.38).toFixed(2),
       +(leanMass * 0.19).toFixed(2), +(leanMass * 0.06).toFixed(2),
       prog.visceralFat[di], prog.bmr[di], prog.inBodyScore[di],
       +(muscleMass * 0.12).toFixed(2), +(muscleMass * 0.11).toFixed(2)]
    );
  }
}
console.log('✅ InBody seeded');

// ─── 2. Scouting profiles with correct columns ───────────────────────────────
console.log('\n🔍 Seeding scouting profiles with correct columns...');

const SCOUTING = {
  forward: {
    overallRating: 82, technicalRating: 85, physicalRating: 80, mentalRating: 78, tacticalRating: 76,
    potentialRating: 'high', recommendedPosition: 'forward', futurePosition: 'forward',
    strengthPoints: ['Exceptional finishing ability', 'Explosive pace off the mark', 'Strong aerial presence', 'Clinical in the penalty box', 'Excellent movement off the ball'],
    weakPoints: ['Defensive work rate needs improvement', 'Left foot weaker than right', 'Tendency to drift offside'],
    developmentPoints: ['Improve left foot technique', 'Increase defensive pressing intensity', 'Work on off-ball movement patterns'],
    coachNotes: 'Highly promising striker with natural goal-scoring instinct. Has attracted interest from professional academies. Recommended for national youth team trials. Scored 18 goals in 22 matches this season.',
    futurePositionRationale: 'Natural finisher with pace and power. Could develop into a complete striker at senior level.',
  },
  midfielder: {
    overallRating: 79, technicalRating: 82, physicalRating: 76, mentalRating: 83, tacticalRating: 85,
    potentialRating: 'high', recommendedPosition: 'midfielder', futurePosition: 'attacking_midfielder',
    strengthPoints: ['Exceptional vision and passing range', 'High work rate and pressing', 'Excellent positional awareness', 'Strong leadership qualities', 'Composed under pressure'],
    weakPoints: ['Needs to improve physical strength', 'Aerial duels need work', 'Can be too conservative in final third'],
    developmentPoints: ['Strength and conditioning program', 'Heading and aerial challenge training', 'Encourage more forward runs into the box'],
    coachNotes: 'Creative midfielder with excellent football intelligence. Reads the game exceptionally well for his age. Strong candidate for academy promotion. 87% pass accuracy this season.',
    futurePositionRationale: 'Technical ability and vision suggest he could develop into an attacking midfielder or playmaker at senior level.',
  },
  defender: {
    overallRating: 77, technicalRating: 74, physicalRating: 82, mentalRating: 79, tacticalRating: 80,
    potentialRating: 'medium', recommendedPosition: 'defender', futurePosition: 'center_back',
    strengthPoints: ['Strong in the tackle', 'Excellent positioning and reading of play', 'Good aerial ability', 'Composed under pressure', 'Strong leadership on the pitch'],
    weakPoints: ['Ball distribution from the back needs development', 'Pace could be improved', 'Tendency to commit early in challenges'],
    developmentPoints: ['Ball-playing defender training', 'Speed and agility work', 'Improve decision-making in 1v1 situations'],
    coachNotes: 'Solid and reliable defender with good leadership qualities. Captained the U16 team. Shows potential for professional level with continued development. 4.2 clearances per game average.',
    futurePositionRationale: 'Physical attributes and reading of play suggest he could develop into a commanding center-back.',
  },
  goalkeeper: {
    overallRating: 80, technicalRating: 76, physicalRating: 78, mentalRating: 82, tacticalRating: 77,
    potentialRating: 'high', recommendedPosition: 'goalkeeper', futurePosition: 'goalkeeper',
    strengthPoints: ['Excellent reflexes and shot-stopping', 'Commanding in the penalty area', 'Strong distribution and kicking', 'Good communication with defenders', 'Calm under pressure'],
    weakPoints: ['Crosses can be inconsistent', 'Kicking distance needs improvement', 'Positioning for long shots'],
    developmentPoints: ['Cross claiming and aerial work', 'Long kicking technique', 'Sweeper-keeper positioning'],
    coachNotes: 'Talented goalkeeper with outstanding shot-stopping ability. Has represented Egypt U17 national team. High potential for professional career. 68% save percentage this season.',
    futurePositionRationale: 'Natural shot-stopper with good distribution. Could develop into a modern sweeper-keeper.',
  },
};

for (const player of PLAYERS) {
  const scout = SCOUTING[player.position] || SCOUTING.midfielder;
  await run(
    `INSERT INTO player_scouting_profiles
     (playerId, assessmentDate, overallRating, technicalRating, physicalRating, mentalRating, tacticalRating,
      potentialRating, recommendedPosition, futurePosition, futurePositionRationale,
      strengthPoints, weakPoints, developmentPoints, coachNotes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       overallRating=VALUES(overallRating), technicalRating=VALUES(technicalRating),
       physicalRating=VALUES(physicalRating), mentalRating=VALUES(mentalRating),
       tacticalRating=VALUES(tacticalRating), potentialRating=VALUES(potentialRating),
       strengthPoints=VALUES(strengthPoints), weakPoints=VALUES(weakPoints),
       developmentPoints=VALUES(developmentPoints), coachNotes=VALUES(coachNotes)`,
    [player.id, '2025-06-01',
     scout.overallRating, scout.technicalRating, scout.physicalRating,
     scout.mentalRating, scout.tacticalRating, scout.potentialRating,
     scout.recommendedPosition, scout.futurePosition, scout.futurePositionRationale,
     JSON.stringify(scout.strengthPoints), JSON.stringify(scout.weakPoints),
     JSON.stringify(scout.developmentPoints), scout.coachNotes]
  );
}
console.log('✅ Scouting profiles seeded');

// ─── 3. Nutrition logs with correct columns ───────────────────────────────────
console.log('\n📋 Seeding nutrition logs...');

const LOG_DATES = ['2025-09-01','2025-09-08','2025-09-15','2025-09-22','2025-10-01','2025-10-08','2025-10-15','2025-10-22','2025-11-01','2025-11-08','2025-11-15','2025-11-22'];

for (const player of PLAYERS) {
  for (const date of LOG_DATES) {
    await run(
      `INSERT INTO nutrition_logs (playerId, logDate, totalCalories, totalProtein, totalCarbs, totalFats, hydrationMl, mealsLogged, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [player.id, date,
       Math.floor(2400 + Math.random() * 400),
       Math.floor(140 + Math.random() * 40),
       Math.floor(280 + Math.random() * 60),
       Math.floor(65 + Math.random() * 20),
       Math.floor(2800 + Math.random() * 600),
       Math.floor(4 + Math.random() * 2),
       'Daily nutrition log recorded by nutritionist']
    );
  }
}
console.log('✅ Nutrition logs seeded');

// ─── 4. Video tags with correct columns ──────────────────────────────────────
console.log('\n🎬 Seeding video tags...');

// Get video clip IDs
const [clipRows] = await conn.execute('SELECT id, title FROM video_clips ORDER BY id DESC LIMIT 15');
console.log(`Found ${clipRows.length} video clips`);

const TAG_TYPES = ['goal', 'assist', 'save', 'tackle', 'key_pass', 'corner', 'foul', 'yellow_card', 'highlight', 'tactical'];
const TAG_DESCRIPTIONS = {
  goal: ['Header from corner kick', 'Long range strike', 'Counter-attack finish', 'Penalty kick', 'One-on-one with goalkeeper', 'Volley from edge of box'],
  assist: ['Through ball for goal', 'Cross for header', 'Corner kick delivery', 'Free kick assist', 'Quick pass in final third'],
  save: ['Penalty save', 'Point-blank save', 'Long range shot save', 'One-on-one save', 'Reflex save'],
  tackle: ['Last-ditch tackle', 'Sliding tackle to win ball', 'Interception in midfield', 'Block in penalty area'],
  key_pass: ['Through ball splitting defense', 'Long diagonal switch', 'Quick one-two combination', 'Lofted pass over defense'],
  corner: ['Short corner routine', 'Inswinging corner for header', 'Corner leading to goal'],
  foul: ['Tactical foul in midfield', 'Professional foul to stop counter', 'Dangerous tackle'],
  yellow_card: ['Tactical foul', 'Dissent', 'Dangerous play'],
  highlight: ['Individual skill move', 'Team combination play', 'Defensive organization'],
  tactical: ['High press trigger', 'Offside trap', 'Set piece routine', 'Transition from defense to attack'],
};

for (const clip of clipRows) {
  // Add 3-5 tags per clip
  const numTags = 3 + Math.floor(Math.random() * 3);
  for (let t = 0; t < numTags; t++) {
    const tagType = TAG_TYPES[Math.floor(Math.random() * TAG_TYPES.length)];
    const descriptions = TAG_DESCRIPTIONS[tagType] || ['Notable moment'];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];
    const timestamp = Math.floor(t * 25 + Math.random() * 20);
    await run(
      `INSERT INTO video_tags (clipId, tagType, timestamp, description, createdBy) VALUES (?, ?, ?, ?, 1)`,
      [clip.id, tagType, timestamp, description]
    );
  }
}
console.log('✅ Video tags seeded');

// ─── 5. Team coach assignments with correct column ────────────────────────────
console.log('\n🏆 Seeding team coach assignments...');

const [u17Rows] = await conn.execute("SELECT id FROM teams WHERE name = 'U17 Falcons' LIMIT 1");
const u17Id = u17Rows[0]?.id;
const [u12Rows] = await conn.execute("SELECT id FROM teams WHERE name = 'Al Ahly U12 - Main Team' LIMIT 1");
const u12Id = u12Rows[0]?.id;

if (u17Id) {
  const assignments = [
    [u17Id, 750031, 'head_coach', 1],
    [u17Id, 750032, 'assistant_coach', 0],
    [u17Id, 750033, 'fitness_coach', 0],
  ];
  for (const [teamId, coachUserId, role, isPrimary] of assignments) {
    await run(
      `INSERT INTO team_coaches (teamId, coachUserId, role, isPrimary) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE role=VALUES(role), isPrimary=VALUES(isPrimary)`,
      [teamId, coachUserId, role, isPrimary]
    );
  }
}
if (u12Id) {
  await run(
    `INSERT INTO team_coaches (teamId, coachUserId, role, isPrimary) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE role=VALUES(role)`,
    [u12Id, 750031, 'head_coach', 1]
  );
}
console.log('✅ Team coach assignments seeded');

// ─── 6. Notifications with correct category enum ─────────────────────────────
console.log('\n🔔 Seeding notifications...');

// Check what the category enum allows
const [notifCols] = await conn.execute('DESCRIBE notifications');
const categoryCol = notifCols.find(c => c.Field === 'category');
console.log('Category type:', categoryCol?.Type);

// Use 'general' as safe category since we don't know the enum values
const NOTIFS = [
  { userId: 1, title: 'Blood Test Results Ready', message: 'Ahmed Hassan\'s latest blood panel results are available. Vitamin D levels are slightly low — supplementation recommended.', type: 'info' },
  { userId: 1, title: 'Position Change Request Received', message: 'Scout report suggests Omar Ali may be better suited as an attacking midfielder. Review the full scouting report and approve or reject the position change.', type: 'warning' },
  { userId: 1, title: 'Nutrition Plan Updated', message: 'Nutritionist has updated the match-day protocol for the upcoming league fixture vs Zamalek U17. 3 meal plans modified.', type: 'info' },
  { userId: 1, title: 'InBody Assessment Due', message: '3 players are due for their monthly InBody composition assessment: Ahmed Hassan, Omar Ali, Youssef Mohamed. Please schedule appointments.', type: 'warning' },
  { userId: 1, title: 'Match Report Available', message: 'Full match report for U17 Falcons vs ENPPI U17 (2-0 win) is now available with individual player ratings and performance analysis.', type: 'success' },
  { userId: 1, title: 'External Scout Interest', message: 'External scout from Zamalek FC submitted interest report for Youssef Mahmoud (Forward, U17 Falcons). Market value assessed at EGP 85,000.', type: 'info' },
  { userId: 1, title: 'Training Session Completed', message: 'Tuesday tactical session completed. 18/20 players attended. Omar Khaled rated 9/10 performance. Session video uploaded.', type: 'success' },
  { userId: 1, title: 'Benchmark Results Ready', message: 'Age-group benchmarking completed for U17 squad. 4 players exceed U17 professional standards in key metrics. Full report available.', type: 'success' },
  { userId: 750031, title: 'Player Injury Alert', message: 'Basel Hamdi reported mild right hamstring tightness after training. Medical assessment recommended before next match on Saturday.', type: 'warning' },
  { userId: 750031, title: 'Video Analysis Shared', message: 'New tactical analysis video uploaded: "High Press vs 4-4-2 Formation". Shared with U17 Falcons squad for review.', type: 'info' },
  { userId: 750032, title: 'Tactical Board Session Saved', message: 'New animated tactical sequence saved: "Counter-Attack Pattern A". 6 steps recorded. Ready for team presentation.', type: 'info' },
  { userId: 750033, title: 'Monthly Fitness Results', message: 'Monthly fitness assessments complete. Squad average VO2 max improved by 3.2% from last month. Full report attached.', type: 'success' },
  { userId: 750033, title: 'Nutrition Compliance Alert', message: '2 players reported below-target calorie intake this week. Follow up with nutritionist recommended.', type: 'warning' },
  { userId: 1, title: 'New Scouting Report', message: 'Coach Ahmed Hassan submitted new scouting assessment for 5 U17 Falcons players. Average rating: 79/100.', type: 'info' },
  { userId: 1, title: 'Video Telestration Saved', message: 'Coach Mohamed Ali saved annotated video analysis for the Zamalek match. 8 tactical annotations added.', type: 'info' },
];

for (const notif of NOTIFS) {
  await run(
    `INSERT INTO notifications (userId, title, message, type, isRead, createdAt) VALUES (?, ?, ?, ?, 0, NOW())`,
    [notif.userId, notif.title, notif.message, notif.type]
  );
}
console.log('✅ Notifications seeded');

// ─── 7. Skill scores with correct structure ───────────────────────────────────
console.log('\n⭐ Seeding skill scores...');

const [skillCols] = await conn.execute('DESCRIBE player_skill_scores');
const skillColNames = skillCols.map(c => c.Field);
console.log('Skill score columns:', skillColNames.join(', '));

const SKILLS_BY_POSITION = {
  forward:    { pace: 88, shooting: 85, passing: 72, dribbling: 82, defending: 45, physical: 78, heading: 80, firstTouch: 84, positioning: 86, workRate: 75, twoFooted: 65, agility: 85 },
  midfielder: { pace: 76, shooting: 72, passing: 87, dribbling: 80, defending: 68, physical: 72, heading: 70, firstTouch: 85, positioning: 83, workRate: 88, twoFooted: 72, agility: 80 },
  defender:   { pace: 72, shooting: 45, passing: 74, dribbling: 65, defending: 85, physical: 82, heading: 84, firstTouch: 72, positioning: 85, workRate: 80, twoFooted: 68, agility: 70 },
  goalkeeper: { pace: 55, shooting: 30, passing: 68, dribbling: 42, defending: 82, physical: 76, heading: 70, firstTouch: 72, positioning: 88, workRate: 78, twoFooted: 60, agility: 82 },
};

for (const player of PLAYERS) {
  const skills = SKILLS_BY_POSITION[player.position] || SKILLS_BY_POSITION.midfielder;
  if (skillColNames.includes('pace')) {
    // Wide table format
    const cols = Object.keys(skills).filter(k => skillColNames.includes(k));
    if (cols.length > 0) {
      const setClauses = cols.map(c => `${c}=VALUES(${c})`).join(', ');
      const insertCols = ['playerId', ...cols, 'assessmentDate'].join(', ');
      const placeholders = Array(cols.length + 2).fill('?').join(', ');
      await run(
        `INSERT INTO player_skill_scores (${insertCols}) VALUES (${placeholders})
         ON DUPLICATE KEY UPDATE ${setClauses}`,
        [player.id, ...cols.map(c => skills[c]), '2025-06-01']
      );
    }
  } else if (skillColNames.includes('skillName') || skillColNames.includes('skill_name')) {
    const nameCol = skillColNames.includes('skillName') ? 'skillName' : 'skill_name';
    const valueCol = skillColNames.includes('value') ? 'value' : 'score';
    for (const [skillName, value] of Object.entries(skills)) {
      await run(
        `INSERT INTO player_skill_scores (playerId, ${nameCol}, ${valueCol}, assessmentDate)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE ${valueCol}=VALUES(${valueCol})`,
        [player.id, skillName, value, '2025-06-01']
      );
    }
  }
}
console.log('✅ Skill scores seeded');

// ─── 8. Player medical data with correct columns ──────────────────────────────
console.log('\n🏥 Checking medical data columns...');

const [medCols] = await conn.execute('DESCRIBE player_medical_data');
const medColNames = medCols.map(c => c.Field);
console.log('Medical columns:', medColNames.join(', '));

const MEDICAL = {
  forward:    { bloodType: 'A+',  allergies: 'None known', medications: 'Vitamin D3 2000 IU daily, Omega-3 supplement', injuryHistory: 'Minor right hamstring strain (Sep 2024, 2 weeks recovery). Left ankle sprain (Jan 2025, 1 week recovery).', medicalClearance: 1 },
  midfielder: { bloodType: 'O+',  allergies: 'Pollen allergy (seasonal)', medications: 'Vitamin D3 1000 IU daily, Iron supplement (prescribed)', injuryHistory: 'Left knee contusion (Nov 2024, 3 days recovery). No major injuries.', medicalClearance: 1 },
  defender:   { bloodType: 'B+',  allergies: 'None known', medications: 'Calcium supplement, Vitamin D3 2000 IU', injuryHistory: 'Right shoulder dislocation (Aug 2024, 6 weeks recovery). Fully recovered.', medicalClearance: 1 },
  goalkeeper: { bloodType: 'AB+', allergies: 'Latex allergy (gloves must be latex-free)', medications: 'Vitamin D3 2000 IU daily, Magnesium supplement', injuryHistory: 'Finger fracture (right index, Oct 2024, 4 weeks recovery). Wrist sprain (Feb 2025, 1 week recovery).', medicalClearance: 1 },
};

for (const player of PLAYERS) {
  const med = MEDICAL[player.position] || MEDICAL.midfielder;
  if (medColNames.includes('bloodType')) {
    await run(
      `INSERT INTO player_medical_data (playerId, bloodType, allergies, medications, injuryHistory, medicalClearance, lastCheckupDate, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE bloodType=VALUES(bloodType), allergies=VALUES(allergies), medications=VALUES(medications), injuryHistory=VALUES(injuryHistory), lastCheckupDate=VALUES(lastCheckupDate)`,
      [player.id, med.bloodType, med.allergies, med.medications, med.injuryHistory, med.medicalClearance, '2025-06-01', 'Annual medical clearance completed. Fit for competitive play.']
    );
  }
}
console.log('✅ Medical data seeded');

await conn.end();
console.log('\n🎉 Fix seed complete!');
