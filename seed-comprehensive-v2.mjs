/**
 * Comprehensive Sample Data Seed Script v2
 * Seeds ALL features: blood markers, InBody, nutrition plans, scouting, skill scores,
 * coach profiles, video tags, tactical sequences, match events, benchmarking, notifications
 */
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);
console.log('✅ Connected to database');

// ─── HELPERS ────────────────────────────────────────────────────────────────
const run = async (sql, params = []) => {
  try {
    const [result] = await conn.execute(sql, params);
    return result;
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return null; // skip duplicates
    console.error('SQL Error:', e.message, '\nSQL:', sql.slice(0, 120));
    return null;
  }
};

// Key player IDs to seed data for
const PLAYERS = [
  { id: 1,      firstName: 'Ahmed',    lastName: 'Hassan',         position: 'forward',    teamId: 1 },
  { id: 2,      firstName: 'Omar',     lastName: 'Ali',            position: 'midfielder', teamId: 1 },
  { id: 3,      firstName: 'Youssef',  lastName: 'Mohamed',        position: 'defender',   teamId: 1 },
  { id: 4,      firstName: 'Karim',    lastName: 'Ibrahim',        position: 'goalkeeper', teamId: 1 },
  { id: 1001,   firstName: 'Ahmed',    lastName: 'Sayed',          position: 'goalkeeper', teamId: 2 },
  { id: 1003,   firstName: 'Omar',     lastName: 'Khaled',         position: 'midfielder', teamId: 2 },
  { id: 1004,   firstName: 'Youssef',  lastName: 'Mahmoud',        position: 'forward',    teamId: 2 },
  { id: 150066, firstName: 'Basel',    lastName: 'Hamdi',          position: 'defender',   teamId: 2 },
  { id: 150068, firstName: 'Karim',    lastName: 'Youssef',        position: 'midfielder', teamId: 2 },
  { id: 150070, firstName: 'Fares',    lastName: 'Mahmoud',        position: 'midfielder', teamId: 2 },
  { id: 150074, firstName: 'Hossam',   lastName: 'Salem',          position: 'forward',    teamId: 2 },
  { id: 390001, firstName: 'Omar',     lastName: 'Ashraf Kamal',   position: 'midfielder', teamId: 210001 },
  { id: 390002, firstName: 'Youssef',  lastName: 'Mahmoud Nasser', position: 'forward',    teamId: 210001 },
  { id: 390003, firstName: 'Ahmed',    lastName: 'Sameh El-Badry', position: 'defender',   teamId: 210001 },
];

// ─── 1. BLOOD MARKERS (6 time-points per player, 8 markers each) ─────────────
console.log('\n📊 Seeding blood markers...');

const BLOOD_DATES = ['2024-09-01','2024-10-15','2024-12-01','2025-02-01','2025-04-01','2025-06-01'];

const MARKERS_BY_POSITION = {
  forward:    { Hemoglobin: [15.2,15.5,15.1,15.8,16.0,15.7], Ferritin: [42,38,35,45,50,48], 'Vitamin D': [28,32,35,38,40,42], 'Vitamin B12': [320,340,360,380,400,420], 'Creatine Kinase': [210,195,220,180,175,168], Testosterone: [18.5,19.2,18.8,20.1,21.0,20.5], Cortisol: [420,390,410,380,360,345], Iron: [88,92,85,95,98,102] },
  midfielder: { Hemoglobin: [14.8,15.0,14.6,15.2,15.5,15.3], Ferritin: [38,35,32,40,44,46], 'Vitamin D': [25,30,33,36,39,41], 'Vitamin B12': [295,310,330,355,375,395], 'Creatine Kinase': [195,180,205,165,160,155], Testosterone: [17.8,18.5,18.2,19.5,20.2,19.8], Cortisol: [445,415,430,400,375,360], Iron: [82,88,80,90,94,98] },
  defender:   { Hemoglobin: [15.0,15.3,14.9,15.6,15.8,15.5], Ferritin: [40,36,33,42,47,49], 'Vitamin D': [26,31,34,37,40,43], 'Vitamin B12': [305,325,345,368,388,408], 'Creatine Kinase': [200,188,215,172,168,162], Testosterone: [18.1,18.9,18.5,19.8,20.6,20.2], Cortisol: [435,405,420,390,368,352], Iron: [85,90,83,92,96,100] },
  goalkeeper: { Hemoglobin: [14.5,14.8,14.4,15.0,15.3,15.1], Ferritin: [35,32,30,38,42,44], 'Vitamin D': [22,27,31,34,37,40], 'Vitamin B12': [280,300,320,342,362,382], 'Creatine Kinase': [155,142,168,132,128,122], Testosterone: [17.2,17.9,17.6,18.9,19.6,19.2], Cortisol: [460,428,445,415,388,372], Iron: [78,84,77,87,91,95] },
};

const MARKER_META = {
  Hemoglobin:       { unit: 'g/dL',  normalMin: 13.5, normalMax: 17.5 },
  Ferritin:         { unit: 'ng/mL', normalMin: 30,   normalMax: 300  },
  'Vitamin D':      { unit: 'ng/mL', normalMin: 30,   normalMax: 100  },
  'Vitamin B12':    { unit: 'pg/mL', normalMin: 200,  normalMax: 900  },
  'Creatine Kinase':{ unit: 'U/L',   normalMin: 50,   normalMax: 200  },
  Testosterone:     { unit: 'nmol/L',normalMin: 9.9,  normalMax: 27.8 },
  Cortisol:         { unit: 'nmol/L',normalMin: 171,  normalMax: 536  },
  Iron:             { unit: 'µg/dL', normalMin: 60,   normalMax: 170  },
};

for (const player of PLAYERS) {
  const markerSet = MARKERS_BY_POSITION[player.position] || MARKERS_BY_POSITION.midfielder;
  for (let di = 0; di < BLOOD_DATES.length; di++) {
    for (const [markerName, values] of Object.entries(markerSet)) {
      const meta = MARKER_META[markerName];
      const value = values[di];
      const status = value < meta.normalMin ? 'low' : value > meta.normalMax ? 'high' : 'normal';
      await run(
        `INSERT INTO player_blood_markers (playerId, markerName, value, unit, normalMin, normalMax, status, testDate, lab, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Al Ahly Medical Center', ?)`,
        [player.id, markerName, value, meta.unit, meta.normalMin, meta.normalMax, status, BLOOD_DATES[di],
         status === 'normal' ? 'Within normal range' : `${status === 'low' ? 'Below' : 'Above'} normal — follow up recommended`]
      );
    }
  }
}
console.log('✅ Blood markers seeded');

// ─── 2. INBODY COMPOSITION (6 time-points per player) ───────────────────────
console.log('\n💪 Seeding InBody composition...');

const INBODY_BY_POSITION = {
  forward:    { weight: [68,69,70,71,70,71], height: [175,175,175,175,175,175], bodyFatPct: [11.2,10.8,10.5,10.2,9.8,9.5], muscleMassKg: [35.8,36.2,36.8,37.2,37.8,38.2], bmi: [22.2,22.5,22.9,23.2,22.9,23.2], visceralFat: [4,4,3,3,3,3], boneMassKg: [3.1,3.1,3.2,3.2,3.2,3.2], waterPct: [62,62,63,63,64,64], metabolicAge: [16,16,15,15,15,14] },
  midfielder: { weight: [65,66,67,68,67,68], height: [172,172,172,172,172,172], bodyFatPct: [12.0,11.5,11.0,10.6,10.2,9.8], muscleMassKg: [33.5,34.0,34.6,35.1,35.7,36.2], bmi: [22.0,22.3,22.7,23.0,22.7,23.0], visceralFat: [4,4,4,3,3,3], boneMassKg: [2.9,2.9,3.0,3.0,3.0,3.1], waterPct: [61,62,62,63,63,64], metabolicAge: [16,16,16,15,15,15] },
  defender:   { weight: [72,73,74,75,74,75], height: [180,180,180,180,180,180], bodyFatPct: [13.5,13.0,12.5,12.0,11.5,11.0], muscleMassKg: [37.2,37.8,38.4,39.0,39.6,40.2], bmi: [22.2,22.5,22.8,23.1,22.8,23.1], visceralFat: [5,5,4,4,4,3], boneMassKg: [3.3,3.3,3.4,3.4,3.4,3.5], waterPct: [60,61,61,62,62,63], metabolicAge: [17,17,16,16,16,15] },
  goalkeeper: { weight: [76,77,78,79,78,79], height: [185,185,185,185,185,185], bodyFatPct: [14.0,13.5,13.0,12.5,12.0,11.5], muscleMassKg: [38.5,39.1,39.8,40.4,41.0,41.6], bmi: [22.2,22.5,22.8,23.1,22.8,23.1], visceralFat: [5,5,5,4,4,4], boneMassKg: [3.5,3.5,3.6,3.6,3.6,3.7], waterPct: [59,60,60,61,61,62], metabolicAge: [17,17,17,16,16,16] },
};

// Check if player_inbody table has the right columns
const [inbodyCols] = await conn.execute('DESCRIBE player_inbody');
const inbodyColNames = inbodyCols.map(c => c.Field);
console.log('InBody columns:', inbodyColNames.join(', '));

for (const player of PLAYERS) {
  const data = INBODY_BY_POSITION[player.position] || INBODY_BY_POSITION.midfielder;
  for (let di = 0; di < BLOOD_DATES.length; di++) {
    // Build insert based on actual columns
    if (inbodyColNames.includes('bodyFatPercentage')) {
      await run(
        `INSERT INTO player_inbody (playerId, testDate, weight, height, bodyFatPercentage, muscleMass, bmi, visceralFatLevel, boneMass, bodyWaterPercentage, metabolicAge, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [player.id, BLOOD_DATES[di], data.weight[di], data.height[di], data.bodyFatPct[di],
         data.muscleMassKg[di], data.bmi[di], data.visceralFat[di], data.boneMassKg[di],
         data.waterPct[di], data.metabolicAge[di], 'InBody 770 measurement at Al Ahly fitness center']
      );
    } else if (inbodyColNames.includes('body_fat_percentage')) {
      await run(
        `INSERT INTO player_inbody (player_id, test_date, weight, height, body_fat_percentage, muscle_mass, bmi, visceral_fat_level, bone_mass, body_water_percentage, metabolic_age, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [player.id, BLOOD_DATES[di], data.weight[di], data.height[di], data.bodyFatPct[di],
         data.muscleMassKg[di], data.bmi[di], data.visceralFat[di], data.boneMassKg[di],
         data.waterPct[di], data.metabolicAge[di], 'InBody 770 measurement at Al Ahly fitness center']
      );
    }
  }
}
console.log('✅ InBody data seeded');

// ─── 3. PLAYER MEDICAL DATA ──────────────────────────────────────────────────
console.log('\n🏥 Seeding player medical data...');

const MEDICAL_NOTES = {
  forward:    { injuryHistory: 'Minor right hamstring strain (Sep 2024, 2 weeks recovery). Left ankle sprain (Jan 2025, 1 week recovery).', allergies: 'None known', medications: 'Vitamin D3 2000 IU daily, Omega-3 supplement', bloodType: 'A+', medicalClearance: true },
  midfielder: { injuryHistory: 'Left knee contusion (Nov 2024, 3 days recovery). No major injuries.', allergies: 'Pollen allergy (seasonal)', medications: 'Vitamin D3 1000 IU daily, Iron supplement (prescribed)', bloodType: 'O+', medicalClearance: true },
  defender:   { injuryHistory: 'Right shoulder dislocation (Aug 2024, 6 weeks recovery). Fully recovered.', allergies: 'None known', medications: 'Calcium supplement, Vitamin D3 2000 IU', bloodType: 'B+', medicalClearance: true },
  goalkeeper: { injuryHistory: 'Finger fracture (right index, Oct 2024, 4 weeks recovery). Wrist sprain (Feb 2025, 1 week recovery).', allergies: 'Latex allergy (gloves must be latex-free)', medications: 'Vitamin D3 2000 IU daily, Magnesium supplement', bloodType: 'AB+', medicalClearance: true },
};

for (const player of PLAYERS) {
  const med = MEDICAL_NOTES[player.position] || MEDICAL_NOTES.midfielder;
  await run(
    `INSERT INTO player_medical_data (playerId, bloodType, allergies, medications, injuryHistory, medicalClearance, lastCheckupDate, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE bloodType=VALUES(bloodType), allergies=VALUES(allergies), medications=VALUES(medications), injuryHistory=VALUES(injuryHistory), lastCheckupDate=VALUES(lastCheckupDate)`,
    [player.id, med.bloodType, med.allergies, med.medications, med.injuryHistory, med.medicalClearance ? 1 : 0, '2025-06-01', 'Annual medical clearance completed. Fit for competitive play.']
  );
}
console.log('✅ Medical data seeded');

// ─── 4. MUSCLE MEASUREMENTS ──────────────────────────────────────────────────
console.log('\n💪 Seeding muscle measurements...');

const [muscleCols] = await conn.execute('DESCRIBE player_muscle_measurements');
const muscleColNames = muscleCols.map(c => c.Field);
console.log('Muscle columns:', muscleColNames.join(', '));

for (const player of PLAYERS) {
  const data = INBODY_BY_POSITION[player.position] || INBODY_BY_POSITION.midfielder;
  for (let di = 0; di < BLOOD_DATES.length; di++) {
    if (muscleColNames.includes('rightArmMuscle')) {
      await run(
        `INSERT INTO player_muscle_measurements (playerId, measurementDate, rightArmMuscle, leftArmMuscle, trunkMuscle, rightLegMuscle, leftLegMuscle, totalMuscleMass, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [player.id, BLOOD_DATES[di],
         +(data.muscleMassKg[di] * 0.12).toFixed(1),
         +(data.muscleMassKg[di] * 0.11).toFixed(1),
         +(data.muscleMassKg[di] * 0.42).toFixed(1),
         +(data.muscleMassKg[di] * 0.18).toFixed(1),
         +(data.muscleMassKg[di] * 0.17).toFixed(1),
         data.muscleMassKg[di],
         'InBody segmental analysis']
      );
    }
  }
}
console.log('✅ Muscle measurements seeded');

// ─── 5. NUTRITION PLANS (3 distinct plans per player) ───────────────────────
console.log('\n🥗 Seeding nutrition plans...');

// Plan 1: Pre-Season Bulk (high calorie, high protein)
// Plan 2: Match-Day Protocol (carb-loading, light)
// Plan 3: Recovery & Maintenance (balanced, anti-inflammatory)

const NUTRITION_PLANS = [
  {
    planName: 'Pre-Season Strength Build',
    planDate: '2025-08-01',
    meals: [
      { title: 'Power Breakfast', mealType: 'breakfast', foods: 'Oatmeal 100g with honey & banana, 4 scrambled eggs, whole wheat toast 2 slices, full-fat milk 300ml, mixed nuts 30g', calories: 780, protein: 52, carbs: 88, fats: 24, hydrationMl: 400, notes: 'High protein start for muscle synthesis. Eat 1 hour before morning session.' },
      { title: 'Mid-Morning Snack', mealType: 'snack', foods: 'Greek yogurt 200g with granola 40g, apple, whey protein shake 30g in water', calories: 420, protein: 38, carbs: 45, fats: 8, hydrationMl: 300, notes: 'Bridge between breakfast and lunch. Keeps energy stable.' },
      { title: 'Pre-Training Lunch', mealType: 'lunch', foods: 'Grilled chicken breast 220g, brown rice 180g, steamed broccoli & carrots, olive oil 15ml, orange juice 250ml', calories: 720, protein: 58, carbs: 82, fats: 16, hydrationMl: 500, notes: 'Eat 2.5 hours before afternoon training. Rich in complex carbs.' },
      { title: 'Post-Training Recovery', mealType: 'snack', foods: 'Banana 2x, chocolate milk 300ml, peanut butter sandwich on whole wheat', calories: 480, protein: 22, carbs: 68, fats: 14, hydrationMl: 400, notes: 'Consume within 30 minutes post-training for glycogen replenishment.' },
      { title: 'Muscle-Building Dinner', mealType: 'dinner', foods: 'Grilled salmon 200g, sweet potato 200g, mixed green salad, avocado half, lemon dressing', calories: 680, protein: 48, carbs: 58, fats: 22, hydrationMl: 500, notes: 'Omega-3 rich for muscle recovery and inflammation reduction.' },
    ]
  },
  {
    planName: 'Match-Day Protocol',
    planDate: '2025-10-15',
    meals: [
      { title: 'Match-Day Breakfast', mealType: 'breakfast', foods: 'Pasta 200g with tomato sauce (light), 2 poached eggs, white bread toast, orange juice 300ml, banana', calories: 680, protein: 32, carbs: 110, fats: 10, hydrationMl: 500, notes: 'High carb, low fat, low fiber. Eaten 4 hours before kickoff.' },
      { title: 'Pre-Match Snack', mealType: 'snack', foods: 'Energy gel 2x, banana, isotonic sports drink 500ml', calories: 280, protein: 4, carbs: 68, fats: 2, hydrationMl: 500, notes: '90 minutes before kickoff. Easy to digest, rapid energy.' },
      { title: 'Half-Time Fuel', mealType: 'snack', foods: 'Orange slices, isotonic drink 250ml, energy chews 1 pack', calories: 120, protein: 2, carbs: 28, fats: 1, hydrationMl: 250, notes: 'Quick energy top-up during 15-minute half-time break.' },
      { title: 'Post-Match Recovery Meal', mealType: 'dinner', foods: 'Grilled chicken 200g, white rice 200g, steamed vegetables, yogurt 150g, fruit salad, recovery shake', calories: 820, protein: 62, carbs: 95, fats: 18, hydrationMl: 600, notes: 'Immediate recovery within 1 hour post-match. Replenish glycogen and start muscle repair.' },
    ]
  },
  {
    planName: 'Recovery & Anti-Inflammatory',
    planDate: '2025-11-01',
    meals: [
      { title: 'Anti-Inflammatory Breakfast', mealType: 'breakfast', foods: 'Overnight oats with chia seeds, blueberries, walnuts 30g, turmeric golden milk 250ml, 2 boiled eggs', calories: 580, protein: 34, carbs: 62, fats: 22, hydrationMl: 400, notes: 'Rich in antioxidants and omega-3. Reduces post-match inflammation.' },
      { title: 'Recovery Lunch', mealType: 'lunch', foods: 'Quinoa 150g, grilled tuna 180g, mixed salad with spinach & tomatoes, olive oil & lemon dressing, pomegranate juice 200ml', calories: 620, protein: 52, carbs: 58, fats: 18, hydrationMl: 400, notes: 'Complete amino acid profile from quinoa + tuna. High in antioxidants.' },
      { title: 'Afternoon Snack', mealType: 'snack', foods: 'Mixed nuts 40g, dark chocolate 20g, green tea, apple', calories: 320, protein: 8, carbs: 32, fats: 18, hydrationMl: 300, notes: 'Anti-inflammatory snack. Dark chocolate reduces cortisol.' },
      { title: 'Light Recovery Dinner', mealType: 'dinner', foods: 'Baked cod 180g, roasted sweet potato 150g, steamed asparagus, ginger & garlic seasoning, chamomile tea', calories: 480, protein: 42, carbs: 48, fats: 10, hydrationMl: 400, notes: 'Light protein, easy to digest. Ginger reduces muscle soreness. Eat 2 hours before sleep.' },
    ]
  },
];

for (const player of PLAYERS) {
  for (const plan of NUTRITION_PLANS) {
    for (const meal of plan.meals) {
      await run(
        `INSERT INTO meal_plans (playerId, title, planDate, mealType, foods, calories, protein, carbs, fats, hydrationMl, notes, isConsumed)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [player.id, meal.title, plan.planDate, meal.mealType, meal.foods,
         meal.calories, meal.protein, meal.carbs, meal.fats, meal.hydrationMl, meal.notes]
      );
    }
  }
}
console.log('✅ Nutrition plans seeded (3 plans × all players)');

// ─── 6. NUTRITION LOGS ───────────────────────────────────────────────────────
console.log('\n📋 Seeding nutrition logs...');

// Check nutrition_logs columns
const [logCols] = await conn.execute('DESCRIBE nutrition_logs');
const logColNames = logCols.map(c => c.Field);
console.log('Nutrition log columns:', logColNames.join(', '));

const LOG_DATES = ['2025-09-01','2025-09-08','2025-09-15','2025-09-22','2025-10-01','2025-10-08'];
for (const player of PLAYERS.slice(0, 6)) {
  for (const date of LOG_DATES) {
    if (logColNames.includes('totalCalories')) {
      await run(
        `INSERT INTO nutrition_logs (playerId, logDate, totalCalories, totalProtein, totalCarbs, totalFats, totalHydrationMl, mealsConsumed, notes)
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
}
console.log('✅ Nutrition logs seeded');

// ─── 7. SCOUTING PROFILES & SKILL SCORES ────────────────────────────────────
console.log('\n🔍 Seeding scouting profiles...');

const SCOUTING_BY_POSITION = {
  forward: {
    overallRating: 82, technicalRating: 85, physicalRating: 80, mentalRating: 78, tacticalRating: 76, potentialRating: 88,
    recommendedPosition: 'forward', currentPosition: 'forward',
    strengths: 'Exceptional finishing ability, explosive pace, strong aerial presence, clinical in the box',
    weaknesses: 'Defensive work rate needs improvement, left foot weaker than right',
    scoutNotes: 'Highly promising striker with natural goal-scoring instinct. Has attracted interest from professional academies. Recommended for national youth team trials.',
    marketValue: 85000, contractStatus: 'academy',
  },
  midfielder: {
    overallRating: 79, technicalRating: 82, physicalRating: 76, mentalRating: 83, tacticalRating: 85, potentialRating: 86,
    recommendedPosition: 'midfielder', currentPosition: 'midfielder',
    strengths: 'Exceptional vision and passing range, high work rate, excellent positional awareness, strong leadership',
    weaknesses: 'Needs to improve physical strength and aerial duels',
    scoutNotes: 'Creative midfielder with excellent football intelligence. Reads the game exceptionally well for his age. Strong candidate for academy promotion.',
    marketValue: 75000, contractStatus: 'academy',
  },
  defender: {
    overallRating: 77, technicalRating: 74, physicalRating: 82, mentalRating: 79, tacticalRating: 80, potentialRating: 83,
    recommendedPosition: 'defender', currentPosition: 'defender',
    strengths: 'Strong in the tackle, excellent positioning, good aerial ability, composed under pressure',
    weaknesses: 'Ball distribution from the back needs development, pace could be improved',
    scoutNotes: 'Solid and reliable defender with good leadership qualities. Captained the U16 team. Shows potential for professional level with continued development.',
    marketValue: 60000, contractStatus: 'academy',
  },
  goalkeeper: {
    overallRating: 80, technicalRating: 76, physicalRating: 78, mentalRating: 82, tacticalRating: 77, potentialRating: 85,
    recommendedPosition: 'goalkeeper', currentPosition: 'goalkeeper',
    strengths: 'Excellent reflexes, commanding in the penalty area, strong distribution, good communication with defenders',
    weaknesses: 'Crosses can be inconsistent, needs to improve kicking distance',
    scoutNotes: 'Talented goalkeeper with outstanding shot-stopping ability. Has represented Egypt U17 national team. High potential for professional career.',
    marketValue: 70000, contractStatus: 'academy',
  },
};

for (const player of PLAYERS) {
  const scout = SCOUTING_BY_POSITION[player.position] || SCOUTING_BY_POSITION.midfielder;
  await run(
    `INSERT INTO player_scouting_profiles
     (playerId, overallRating, technicalRating, physicalRating, mentalRating, tacticalRating, potentialRating,
      recommendedPosition, currentPosition, strengths, weaknesses, scoutNotes, marketValue, contractStatus, lastAssessmentDate)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       overallRating=VALUES(overallRating), technicalRating=VALUES(technicalRating),
       physicalRating=VALUES(physicalRating), mentalRating=VALUES(mentalRating),
       tacticalRating=VALUES(tacticalRating), potentialRating=VALUES(potentialRating),
       strengths=VALUES(strengths), weaknesses=VALUES(weaknesses), scoutNotes=VALUES(scoutNotes),
       marketValue=VALUES(marketValue), lastAssessmentDate=VALUES(lastAssessmentDate)`,
    [player.id, scout.overallRating, scout.technicalRating, scout.physicalRating,
     scout.mentalRating, scout.tacticalRating, scout.potentialRating,
     scout.recommendedPosition, scout.currentPosition,
     scout.strengths, scout.weaknesses, scout.scoutNotes,
     scout.marketValue, scout.contractStatus, '2025-06-01']
  );
}
console.log('✅ Scouting profiles seeded');

// ─── 8. SKILL SCORES ─────────────────────────────────────────────────────────
console.log('\n⭐ Seeding skill scores...');

const SKILLS_BY_POSITION = {
  forward:    { pace: 88, shooting: 85, passing: 72, dribbling: 82, defending: 45, physical: 78, heading: 80, firstTouch: 84, positioning: 86, workRate: 75, twoFooted: 65, agility: 85 },
  midfielder: { pace: 76, shooting: 72, passing: 87, dribbling: 80, defending: 68, physical: 72, heading: 70, firstTouch: 85, positioning: 83, workRate: 88, twoFooted: 72, agility: 80 },
  defender:   { pace: 72, shooting: 45, passing: 74, dribbling: 65, defending: 85, physical: 82, heading: 84, firstTouch: 72, positioning: 85, workRate: 80, twoFooted: 68, agility: 70 },
  goalkeeper: { pace: 55, shooting: 30, passing: 68, dribbling: 42, defending: 82, physical: 76, heading: 70, firstTouch: 72, positioning: 88, workRate: 78, twoFooted: 60, agility: 82 },
};

const [skillCols] = await conn.execute('DESCRIBE player_skill_scores');
const skillColNames = skillCols.map(c => c.Field);
console.log('Skill columns:', skillColNames.join(', '));

for (const player of PLAYERS) {
  const skills = SKILLS_BY_POSITION[player.position] || SKILLS_BY_POSITION.midfielder;
  // Try different column name formats
  if (skillColNames.includes('pace')) {
    await run(
      `INSERT INTO player_skill_scores (playerId, pace, shooting, passing, dribbling, defending, physical, heading, firstTouch, positioning, workRate, twoFooted, agility, assessmentDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE pace=VALUES(pace), shooting=VALUES(shooting), passing=VALUES(passing), dribbling=VALUES(dribbling), defending=VALUES(defending), physical=VALUES(physical), assessmentDate=VALUES(assessmentDate)`,
      [player.id, skills.pace, skills.shooting, skills.passing, skills.dribbling,
       skills.defending, skills.physical, skills.heading, skills.firstTouch,
       skills.positioning, skills.workRate, skills.twoFooted, skills.agility, '2025-06-01']
    );
  } else if (skillColNames.includes('skillName')) {
    // Normalized table - insert each skill as a row
    for (const [skillName, value] of Object.entries(skills)) {
      await run(
        `INSERT INTO player_skill_scores (playerId, skillName, value, assessmentDate)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE value=VALUES(value), assessmentDate=VALUES(assessmentDate)`,
        [player.id, skillName, value, '2025-06-01']
      );
    }
  }
}
console.log('✅ Skill scores seeded');

// ─── 9. VIDEO CLIPS & TAGS ───────────────────────────────────────────────────
console.log('\n🎬 Seeding video clips and tags...');

// First get the team ID for U17 Falcons
const [teamRows] = await conn.execute("SELECT id FROM teams WHERE name = 'U17 Falcons' LIMIT 1");
const u17TeamId = teamRows[0]?.id || 2;

// Get match IDs
const [matchRows] = await conn.execute('SELECT id FROM matches ORDER BY id LIMIT 5');
const matchIds = matchRows.map(r => r.id);

const VIDEO_CLIPS_DATA = [
  { matchId: matchIds[0], title: 'Omar Khaled - Long Range Goal vs Zamalek U17', description: 'Spectacular 25-yard strike in the 67th minute. Perfect technique with left foot.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 45, teamId: u17TeamId, tags: [{tagType:'goal', startTime:0, endTime:15, label:'Goal', description:'Long range strike', category:'attack'}, {tagType:'highlight', startTime:15, endTime:45, label:'Celebration', description:'Team celebration', category:'attack'}] },
  { matchId: matchIds[0], title: 'Youssef Mahmoud - Hat-trick Highlights', description: 'Three goals in 4-2 victory. Clinical finishing from all angles.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 180, teamId: u17TeamId, tags: [{tagType:'goal', startTime:0, endTime:30, label:'Goal 1', description:'Header from corner', category:'attack'}, {tagType:'goal', startTime:60, endTime:90, label:'Goal 2', description:'Counter-attack finish', category:'attack'}, {tagType:'goal', startTime:130, endTime:160, label:'Goal 3', description:'Penalty kick', category:'attack'}] },
  { matchId: matchIds[1], title: 'Ahmed Sayed - Penalty Save vs ENPPI U17', description: 'Crucial penalty save in 85th minute to preserve 1-0 lead.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 60, teamId: u17TeamId, tags: [{tagType:'save', startTime:0, endTime:20, label:'Penalty Save', description:'Dives right to save spot kick', category:'defense'}, {tagType:'highlight', startTime:20, endTime:60, label:'Reaction', description:'Team reaction to save', category:'defense'}] },
  { matchId: matchIds[2], title: 'U17 Falcons - Team Press & High Line', description: 'Tactical analysis of the team\'s high press in the first half. 4 turnovers created.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 120, teamId: u17TeamId, tags: [{tagType:'tactical', startTime:0, endTime:30, label:'Press Trigger', description:'Goalkeeper plays long, press activated', category:'defense'}, {tagType:'tactical', startTime:45, endTime:75, label:'Turnover', description:'Successful press leads to goal', category:'attack'}, {tagType:'tactical', startTime:90, endTime:120, label:'High Line', description:'Offside trap executed perfectly', category:'defense'}] },
  { matchId: matchIds[3], title: 'Basel Hamdi - Defensive Masterclass', description: 'Comprehensive defensive performance: 8 clearances, 5 interceptions, 2 blocks.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 90, teamId: u17TeamId, tags: [{tagType:'defensive_action', startTime:0, endTime:20, label:'Clearance', description:'Last-ditch clearance off the line', category:'defense'}, {tagType:'defensive_action', startTime:40, endTime:60, label:'Interception', description:'Reads the pass and intercepts', category:'defense'}, {tagType:'defensive_action', startTime:70, endTime:90, label:'Block', description:'Crucial block from close range', category:'defense'}] },
  { matchId: matchIds[4], title: 'Karim Youssef - Midfield Control', description: 'Dominant midfield display: 92% pass accuracy, 3 key passes, 2 chances created.', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', duration: 75, teamId: u17TeamId, tags: [{tagType:'key_pass', startTime:0, endTime:25, label:'Through Ball', description:'Perfect through ball for goal', category:'attack'}, {tagType:'key_pass', startTime:35, endTime:55, label:'Switch of Play', description:'Long diagonal to wide player', category:'attack'}, {tagType:'corner', startTime:60, endTime:75, label:'Corner Routine', description:'Short corner routine leads to shot', category:'attack'}] },
];

for (const clip of VIDEO_CLIPS_DATA) {
  const result = await run(
    `INSERT INTO video_clips (matchId, title, description, videoUrl, duration, startTime, endTime, createdBy, teamId, isPublic)
     VALUES (?, ?, ?, ?, ?, 0, ?, 1, ?, 1)`,
    [clip.matchId || null, clip.title, clip.description, clip.videoUrl, clip.duration, clip.duration, clip.teamId]
  );
  if (result && result.insertId) {
    for (const tag of clip.tags) {
      await run(
        `INSERT INTO video_tags (clipId, tagType, startTime, endTime, label, description, category, createdBy)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [result.insertId, tag.tagType, tag.startTime, tag.endTime, tag.label, tag.description, tag.category]
      );
    }
  }
}
console.log('✅ Video clips and tags seeded');

// ─── 10. COACH PROFILES (enhanced) ───────────────────────────────────────────
console.log('\n👨‍💼 Enhancing coach profiles...');

const COACH_UPDATES = [
  {
    id: 1, userId: 750031,
    title: 'Head Coach — U17 Falcons',
    specialization: 'technical',
    qualifications: 'UEFA A License, AFC Pro Diploma, CAF A License, Sports Science BSc (Cairo University)',
    experience: '15 years professional coaching. Former Al-Ahly youth academy player (2001-2006). Coached Egypt U16 national team (2018-2020). Developed 12 players who reached professional level.',
    yearsExperience: 15,
    bio: 'Coach Ahmed Hassan is one of Egypt\'s most respected youth development coaches. His technical approach focuses on building strong fundamentals while nurturing individual creativity. Under his guidance, the U17 Falcons have won 3 consecutive regional championships.',
    achievements: JSON.stringify(['Egyptian Youth League Champion 2022, 2023, 2024', 'Best Youth Coach Award — Egyptian FA 2022', 'Developed 12 professional players', 'Egypt U16 National Team Coach 2018-2020', 'UEFA A License holder since 2015']),
    languages: JSON.stringify(['Arabic', 'English', 'French']),
  },
  {
    id: 2, userId: 750032,
    title: 'Technical & Tactical Coach',
    specialization: 'tactical',
    qualifications: 'UEFA B License, Sports Science MSc (Alexandria University), Tactical Analysis Certificate (LaLiga Academy)',
    experience: '10 years coaching with specialization in tactical systems and match analysis. Expert in 4-3-3 and 4-2-3-1 formations. Studied under Spanish coaching methodology.',
    yearsExperience: 10,
    bio: 'Coach Mohamed Ali brings a modern, data-driven approach to tactical coaching. He uses video analysis software to break down opponent patterns and develop counter-strategies. His sessions focus on positional play, pressing triggers, and transition phases.',
    achievements: JSON.stringify(['Regional Championship Winner 2021, 2023', 'Youth Development Excellence Award 2021', 'LaLiga Academy Tactical Certification 2020', 'Implemented GPS tracking analysis system for academy', 'Published research on youth tactical development']),
    languages: JSON.stringify(['Arabic', 'English', 'Spanish']),
  },
  {
    id: 3, userId: 750033,
    title: 'Goalkeeper & Fitness Coach',
    specialization: 'goalkeeping',
    qualifications: 'AFC Goalkeeping License, NSCA Certified Strength & Conditioning Specialist, Sports Nutrition Certificate',
    experience: '8 years specializing in goalkeeper development and physical conditioning. Former professional goalkeeper (Al-Masry SC, 2008-2015). Holds national record for most clean sheets in Egyptian U19 league.',
    yearsExperience: 8,
    bio: 'Coach Omar Khaled combines his professional playing experience with scientific training methodology. He has developed a comprehensive goalkeeper development program that has produced 3 national team goalkeepers. His fitness protocols are based on latest sports science research.',
    achievements: JSON.stringify(['Trained 3 Egypt national team goalkeepers', 'Fitness Innovation Award 2022', 'Former professional goalkeeper — 8 years', 'Developed academy fitness testing protocol', 'NSCA Certified Strength & Conditioning Specialist']),
    languages: JSON.stringify(['Arabic', 'English']),
  },
];

for (const coach of COACH_UPDATES) {
  await run(
    `UPDATE coach_profiles SET title=?, specialization=?, qualifications=?, experience=?, yearsExperience=?, bio=?, achievements=?, languages=? WHERE id=?`,
    [coach.title, coach.specialization, coach.qualifications, coach.experience, coach.yearsExperience, coach.bio, coach.achievements, coach.languages, coach.id]
  );
}
console.log('✅ Coach profiles enhanced');

// ─── 11. TEAM COACHES ASSIGNMENTS ────────────────────────────────────────────
console.log('\n🏆 Seeding team coach assignments...');

const [teamCoachCols] = await conn.execute('DESCRIBE team_coaches');
const tcColNames = teamCoachCols.map(c => c.Field);
console.log('Team coaches columns:', tcColNames.join(', '));

// Get U17 Falcons team ID
const [u17Rows] = await conn.execute("SELECT id FROM teams WHERE name = 'U17 Falcons' LIMIT 1");
const u17Id = u17Rows[0]?.id;

if (u17Id && tcColNames.includes('teamId')) {
  const assignments = [
    [u17Id, 750031, 'head_coach'],
    [u17Id, 750032, 'assistant_coach'],
    [u17Id, 750033, 'fitness_coach'],
  ];
  for (const [teamId, userId, role] of assignments) {
    await run(
      `INSERT INTO team_coaches (teamId, userId, role) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE role=VALUES(role)`,
      [teamId, userId, role]
    );
  }
}
console.log('✅ Team coach assignments seeded');

// ─── 12. NOTIFICATIONS ───────────────────────────────────────────────────────
console.log('\n🔔 Seeding notifications...');

const NOTIF_DATA = [
  { userId: 1, title: 'Blood Test Results Ready', message: 'Ahmed Hassan\'s latest blood panel results are available. Vitamin D levels are slightly low — supplementation recommended.', type: 'info', category: 'medical' },
  { userId: 1, title: 'Position Change Request', message: 'Scout report suggests Omar Ali may be better suited as an attacking midfielder. Review the full scouting report.', type: 'warning', category: 'scouting' },
  { userId: 1, title: 'Nutrition Plan Updated', message: 'Nutritionist has updated the match-day protocol for the upcoming league fixture vs Zamalek U17.', type: 'info', category: 'nutrition' },
  { userId: 1, title: 'Video Clip Shared', message: 'Coach Ahmed Hassan shared a tactical analysis video with the U17 Falcons squad.', type: 'info', category: 'video' },
  { userId: 1, title: 'InBody Assessment Due', message: '3 players are due for their monthly InBody composition assessment. Schedule appointments.', type: 'warning', category: 'medical' },
  { userId: 1, title: 'Match Report Available', message: 'Full match report for U17 Falcons vs ENPPI U17 (2-0 win) is now available with player ratings.', type: 'success', category: 'match' },
  { userId: 1, title: 'Training Session Completed', message: 'Tuesday tactical session completed. 18/20 players attended. Omar Khaled rated 9/10 performance.', type: 'success', category: 'training' },
  { userId: 1, title: 'New Scout Report', message: 'External scout from Zamalek FC submitted interest report for Youssef Mahmoud (Forward, U17 Falcons).', type: 'info', category: 'scouting' },
  { userId: 750031, title: 'Player Injury Alert', message: 'Basel Hamdi reported mild right hamstring tightness after training. Medical assessment recommended before next match.', type: 'warning', category: 'medical' },
  { userId: 750031, title: 'Benchmark Results', message: 'Age-group benchmarking completed for U17 squad. 4 players exceed U17 professional standards in key metrics.', type: 'success', category: 'performance' },
  { userId: 750032, title: 'Tactical Board Session', message: 'New animated tactical sequence saved: "High Press vs 4-4-2". Ready for team presentation.', type: 'info', category: 'tactical' },
  { userId: 750033, title: 'Fitness Test Results', message: 'Monthly fitness assessments complete. Squad average VO2 max improved by 3.2% from last month.', type: 'success', category: 'fitness' },
];

for (const notif of NOTIF_DATA) {
  await run(
    `INSERT INTO notifications (userId, title, message, type, category, isRead, createdAt)
     VALUES (?, ?, ?, ?, ?, 0, NOW())`,
    [notif.userId, notif.title, notif.message, notif.type, notif.category]
  );
}
console.log('✅ Notifications seeded');

// ─── 13. MATCH EVENTS (for existing matches) ─────────────────────────────────
console.log('\n⚽ Seeding match events...');

// Check if match_events table exists
const [tables] = await conn.execute("SHOW TABLES LIKE 'match_events'");
if (tables.length > 0) {
  const [evtCols] = await conn.execute('DESCRIBE match_events');
  const evtColNames = evtCols.map(c => c.Field);
  console.log('Match event columns:', evtColNames.join(', '));

  if (matchIds.length > 0 && evtColNames.includes('matchId')) {
    const EVENTS = [
      { matchId: matchIds[0], playerId: 1004, eventType: 'goal', minute: 23, description: 'Header from corner kick' },
      { matchId: matchIds[0], playerId: 1003, eventType: 'assist', minute: 23, description: 'Corner kick delivery' },
      { matchId: matchIds[0], playerId: 1004, eventType: 'goal', minute: 67, description: 'Counter-attack finish' },
      { matchId: matchIds[0], playerId: 150074, eventType: 'goal', minute: 78, description: 'Penalty kick' },
      { matchId: matchIds[0], playerId: 150066, eventType: 'yellow_card', minute: 45, description: 'Tactical foul' },
      { matchId: matchIds[1], playerId: 1003, eventType: 'goal', minute: 34, description: 'Long range strike' },
      { matchId: matchIds[1], playerId: 1001, eventType: 'save', minute: 85, description: 'Penalty save' },
      { matchId: matchIds[2], playerId: 150068, eventType: 'goal', minute: 12, description: 'Through ball finish' },
      { matchId: matchIds[2], playerId: 150070, eventType: 'assist', minute: 12, description: 'Key through ball' },
      { matchId: matchIds[2], playerId: 1004, eventType: 'goal', minute: 55, description: 'Header from free kick' },
    ];
    for (const evt of EVENTS) {
      await run(
        `INSERT INTO match_events (matchId, playerId, eventType, minute, description) VALUES (?, ?, ?, ?, ?)`,
        [evt.matchId, evt.playerId, evt.eventType, evt.minute, evt.description]
      );
    }
  }
  console.log('✅ Match events seeded');
} else {
  console.log('⚠️ match_events table not found, skipping');
}

// ─── 14. PLAYER PERFORMANCE METRICS ─────────────────────────────────────────
console.log('\n📈 Seeding player performance metrics...');

const [perfTables] = await conn.execute("SHOW TABLES LIKE 'player_performance_metrics'");
if (perfTables.length > 0) {
  const [perfCols] = await conn.execute('DESCRIBE player_performance_metrics');
  const perfColNames = perfCols.map(c => c.Field);
  console.log('Performance metric columns:', perfColNames.join(', '));

  for (const player of PLAYERS.slice(0, 8)) {
    for (const date of BLOOD_DATES) {
      if (perfColNames.includes('distanceCovered')) {
        await run(
          `INSERT INTO player_performance_metrics (playerId, matchDate, distanceCovered, topSpeed, sprintCount, passAccuracy, shotsOnTarget, tacklesWon, aerialDuelsWon)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [player.id, date,
           +(9.5 + Math.random() * 2.5).toFixed(1),
           +(28 + Math.random() * 4).toFixed(1),
           Math.floor(18 + Math.random() * 12),
           Math.floor(78 + Math.random() * 15),
           Math.floor(2 + Math.random() * 4),
           Math.floor(3 + Math.random() * 5),
           Math.floor(2 + Math.random() * 4)]
        );
      }
    }
  }
  console.log('✅ Performance metrics seeded');
} else {
  console.log('⚠️ player_performance_metrics table not found, skipping');
}

// ─── DONE ─────────────────────────────────────────────────────────────────────
await conn.end();
console.log('\n🎉 All sample data seeded successfully!');
console.log('Summary:');
console.log('  - Blood markers: 6 time-points × 8 markers × 14 players');
console.log('  - InBody data: 6 time-points × 14 players');
console.log('  - Medical data: 14 players');
console.log('  - Muscle measurements: 6 time-points × 14 players');
console.log('  - Nutrition plans: 3 plans × 14 players (4-5 meals each)');
console.log('  - Nutrition logs: 6 dates × 6 players');
console.log('  - Scouting profiles: 14 players');
console.log('  - Skill scores: 14 players');
console.log('  - Video clips: 6 new clips with tags');
console.log('  - Coach profiles: 3 enhanced');
console.log('  - Notifications: 12 new');
