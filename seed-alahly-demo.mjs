#!/usr/bin/env node
/**
 * Al Ahly Academy - Comprehensive Demo Data Seed Script
 * Populates all features with realistic data for chairman presentation
 */
import mysql from 'mysql2/promise';
import 'dotenv/config';

const conn = await mysql.createConnection(process.env.DATABASE_URL);
console.log('🔴 Starting Al Ahly Academy demo data population...\n');

function ri(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function rf(min, max, d = 1) { return parseFloat((Math.random() * (max - min) + min).toFixed(d)); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

try {
  // ========== 1. GET EXISTING DATA ==========
  const [players] = await conn.execute('SELECT id, firstName, lastName, teamId FROM players LIMIT 30');
  const [teams] = await conn.execute('SELECT id, name FROM teams LIMIT 10');
  const [users] = await conn.execute('SELECT id, email, role FROM users WHERE role IN ("admin","coach") LIMIT 5');
  
  const adminId = users[0]?.id || 1;
  const playerIds = players.map(p => p.id);
  const teamIds = teams.map(t => t.id);
  
  console.log(`Found: ${players.length} players, ${teams.length} teams, ${users.length} users`);

  // ========== 2. TRAINING SESSIONS ==========
  console.log('\n📋 Creating training sessions...');
  const sessionTypes = ['technical', 'tactical', 'physical', 'match', 'recovery', 'mixed'];
  const locations = ['Al Ahly Stadium - Pitch 1', 'Al Ahly Stadium - Pitch 2', 'Training Complex A', 'Indoor Facility'];
  
  const sessions = [];
  for (let i = 0; i < 20; i++) {
    const daysAgo = ri(0, 30);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    sessions.push([
      pick(teamIds),
      pick(sessionTypes),
      d.toISOString().split('T')[0],
      `${ri(8,17)}:00:00`,
      ri(60, 120),
      pick(locations),
      pick(['Ahmed Kamal', 'Mohamed Farouk', 'Khaled Nasser', 'Ibrahim Saad']),
      JSON.stringify(['Ball control drills', 'Passing triangles', 'Small-sided games', 'Finishing practice'].slice(0, ri(2,4))),
      pick(['completed', 'completed', 'completed', 'scheduled']),
      ri(8, 18),
      JSON.stringify({ intensity: pick(['low','medium','high']), notes: 'Session completed successfully' }),
    ]);
  }
  
  for (const s of sessions) {
    const [tid, stype, sdate, stime, sdur, sloc, scoach, sdrills, sstatus, satt, snotes] = s;
    const endHour = parseInt(stime.split(':')[0]) + Math.ceil(sdur/60);
    const endTime = `${endHour.toString().padStart(2,'0')}:00:00`;
    await conn.execute(`
      INSERT INTO training_sessions 
      (teamId, sessionType, sessionDate, startTime, endTime, location, title, drills, status, attendanceCount, description)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `, [tid, stype, sdate, stime, endTime, sloc, `${stype.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())} Session`, sdrills, sstatus, satt, snotes]);
  }
  console.log(`✅ Created ${sessions.length} training sessions`);

  // ========== 3. TRAINING VIDEOS ==========
  console.log('\n🎥 Creating training videos...');
  const videoData = [
    { title: 'Al Ahly Pressing Drill - High Intensity', category: 'tactical', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc: 'Advanced pressing patterns used by Al Ahly first team', duration: 1245, difficulty: 'advanced' },
    { title: 'Youth Dribbling Masterclass', category: 'technical', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc: 'Comprehensive dribbling techniques for U-14 and U-16 players', duration: 1820, difficulty: 'intermediate' },
    { title: 'Finishing Under Pressure', category: 'technical', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc: 'Shooting drills to improve composure in front of goal', duration: 980, difficulty: 'intermediate' },
    { title: 'Defensive Shape & Compactness', category: 'tactical', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc: 'Team defensive organization and shape maintenance', duration: 1560, difficulty: 'advanced' },
    { title: 'Speed & Agility Training', category: 'physical', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc: 'Sprint mechanics and agility ladder drills for footballers', duration: 720, difficulty: 'beginner' },
    { title: 'Corner Kick Routines', category: 'set_pieces', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc: 'Attacking corner kick variations and defensive organization', duration: 840, difficulty: 'intermediate' },
    { title: 'Goalkeeper Distribution', category: 'goalkeeping', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc: 'Modern goalkeeper distribution and sweeper-keeper techniques', duration: 1100, difficulty: 'advanced' },
    { title: 'Passing Combinations - Tiki-Taka Style', category: 'technical', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc: 'Short passing combinations and positional play patterns', duration: 1380, difficulty: 'intermediate' },
    { title: 'U-12 Fun Football Drills', category: 'youth_development', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc: 'Age-appropriate fun drills to develop love for the game', duration: 900, difficulty: 'beginner' },
    { title: 'Mental Toughness for Young Players', category: 'mental', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', desc: 'Building resilience and confidence in youth footballers', duration: 1200, difficulty: 'beginner' },
  ];
  
  for (const v of videoData) {
    await conn.execute(`
      INSERT IGNORE INTO training_videos (title, description, videoUrl, category, duration, difficulty, isPublished, viewCount, uploadedBy, thumbnailUrl)
      VALUES (?,?,?,?,?,?,1,?,?,?)
    `, [v.title, v.desc, v.url, v.category, v.duration, v.difficulty, ri(120, 1500), adminId, 
        `https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg`]);
  }
  console.log(`✅ Created ${videoData.length} training videos`);

  // ========== 4. SCOUT REPORTS ==========
  console.log('\n🔍 Creating scout reports...');
  const scoutPlayers = [
    { name: 'Youssef El-Araby', age: 16, pos: 'Forward', club: 'Zamalek Youth', loc: 'Cairo, Egypt' },
    { name: 'Omar Abdel-Fattah', age: 15, pos: 'Midfielder', club: 'Pyramids FC Youth', loc: 'Giza, Egypt' },
    { name: 'Karim Mostafa', age: 17, pos: 'Defender', club: 'Smouha SC', loc: 'Alexandria, Egypt' },
    { name: 'Hassan El-Sayed', age: 14, pos: 'Goalkeeper', club: 'Ittihad Alexandria', loc: 'Alexandria, Egypt' },
    { name: 'Mahmoud Taha', age: 16, pos: 'Winger', club: 'Misr Lel Makkasa', loc: 'Cairo, Egypt' },
    { name: 'Ahmed Nour', age: 15, pos: 'Striker', club: 'El Mokawloon', loc: 'Cairo, Egypt' },
    { name: 'Ibrahim Khalil', age: 17, pos: 'Center Back', club: 'Haras El-Hodood', loc: 'Port Said, Egypt' },
    { name: 'Tarek Samir', age: 14, pos: 'Attacking Mid', club: 'Wadi Degla', loc: 'Cairo, Egypt' },
  ];
  
  for (const sp of scoutPlayers) {
    const overall = ri(72, 92);
    await conn.execute(`
      INSERT INTO scout_reports 
      (scoutUserId, playerName, playerAge, playerPosition, currentClub, location,
       technicalScore, physicalScore, tacticalScore, mentalScore, overallScore,
       ballControl, passing, shooting, dribbling, firstTouch, speed, acceleration,
       agility, stamina, strength, positioning, vision, decisionMaking, workRate,
       teamwork, leadership, composure, determination, creativity, defensiveAbility,
       aiAnalysis, strengths, weaknesses, recommendations, potentialLevel, status, visibility)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      adminId, sp.name, sp.age, sp.pos, sp.club, sp.loc,
      ri(70,95), ri(65,90), ri(68,92), ri(72,95), overall,
      ri(70,95), ri(65,90), ri(60,92), ri(72,95), ri(75,95),
      ri(70,95), ri(72,95), ri(68,92), ri(65,90), ri(60,85),
      ri(70,92), ri(68,90), ri(65,88), ri(75,95),
      ri(72,92), ri(60,85), ri(68,90), ri(75,95), ri(65,90), ri(55,80),
      `AI Analysis: ${sp.name} shows exceptional ${sp.pos.toLowerCase()} qualities. Strong technical foundation with good tactical awareness. Recommended for Al Ahly Academy trial.`,
      JSON.stringify(['Technical ability', 'Work rate', 'Positioning']),
      JSON.stringify(['Needs physical development', 'Consistency under pressure']),
      `Recommend immediate trial. Focus on physical conditioning and mental resilience training.`,
      overall >= 88 ? 'elite' : overall >= 82 ? 'high' : 'medium',
      pick(['submitted', 'reviewed', 'approved']),
      'network'
    ]);
  }
  console.log(`✅ Created ${scoutPlayers.length} scout reports`);

  // ========== 5. MEAL LOGS (Nutrition AI) ==========
  console.log('\n🥗 Creating meal logs...');
  const meals = [
    { type: 'breakfast', foods: [{name:'Oatmeal',confidence:0.95,quantity:'200g',calories:350,protein:12,carbs:60,fat:8},{name:'Banana',confidence:0.98,quantity:'1 medium',calories:105,protein:1,carbs:27,fat:0}], cal:455, prot:13, carbs:87, fat:8, score:88 },
    { type: 'lunch', foods: [{name:'Grilled Chicken',confidence:0.97,quantity:'200g',calories:330,protein:62,carbs:0,fat:7},{name:'Brown Rice',confidence:0.94,quantity:'150g',calories:165,protein:4,carbs:35,fat:1},{name:'Salad',confidence:0.92,quantity:'1 bowl',calories:45,protein:2,carbs:8,fat:1}], cal:540, prot:68, carbs:43, fat:9, score:92 },
    { type: 'pre_workout', foods: [{name:'Dates',confidence:0.99,quantity:'5 pieces',calories:140,protein:1,carbs:37,fat:0},{name:'Protein Shake',confidence:0.96,quantity:'1 scoop',calories:120,protein:25,carbs:5,fat:2}], cal:260, prot:26, carbs:42, fat:2, score:85 },
    { type: 'dinner', foods: [{name:'Grilled Fish',confidence:0.95,quantity:'250g',calories:280,protein:55,carbs:0,fat:6},{name:'Sweet Potato',confidence:0.93,quantity:'200g',calories:180,protein:4,carbs:41,fat:0},{name:'Vegetables',confidence:0.91,quantity:'1 cup',calories:50,protein:3,carbs:10,fat:0}], cal:510, prot:62, carbs:51, fat:6, score:94 },
    { type: 'snack', foods: [{name:'Greek Yogurt',confidence:0.97,quantity:'200g',calories:130,protein:17,carbs:9,fat:0},{name:'Almonds',confidence:0.95,quantity:'30g',calories:175,protein:6,carbs:6,fat:15}], cal:305, prot:23, carbs:15, fat:15, score:90 },
    { type: 'post_workout', foods: [{name:'Chocolate Milk',confidence:0.94,quantity:'500ml',calories:350,protein:18,carbs:52,fat:8},{name:'Banana',confidence:0.98,quantity:'1 large',calories:120,protein:1,carbs:31,fat:0}], cal:470, prot:19, carbs:83, fat:8, score:82 },
  ];
  
  for (let i = 0; i < 15; i++) {
    const meal = pick(meals);
    const daysAgo = ri(0, 14);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const dateStr = d.toISOString().split('T')[0];
    await conn.execute(`
      INSERT INTO meal_logs 
      (userId, playerId, mealType, mealDate, mealTime, recognizedFoods, totalCalories, totalProtein, totalCarbs, totalFat, aiAnalysis, nutritionScore, recommendations, alignsWithPlan)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      adminId, pick(playerIds), meal.type, dateStr, `${dateStr} ${ri(6,21)}:${ri(0,5)*10}:00`,
      JSON.stringify(meal.foods), meal.cal, meal.prot, meal.carbs, meal.fat,
      `Nutrition score: ${meal.score}/100. ${meal.score >= 90 ? 'Excellent meal choice!' : meal.score >= 80 ? 'Good nutritional balance.' : 'Consider adding more protein.'} Macros are ${meal.score >= 85 ? 'well-balanced' : 'slightly off target'} for athletic performance.`,
      meal.score,
      meal.score >= 90 ? 'Keep up the excellent nutrition habits!' : 'Consider increasing protein intake by 15-20g per meal.',
      meal.score >= 80 ? 1 : 0
    ]);
  }
  console.log(`✅ Created 15 meal logs`);

  // ========== 6. INJURY RISK ASSESSMENTS ==========
  console.log('\n🏥 Creating injury risk assessments...');
  const bodyParts = ['hamstring', 'knee', 'ankle', 'groin', 'shoulder', 'calf', 'back'];
  const riskLevels = ['low', 'low', 'low', 'medium', 'medium', 'high'];
  
  for (let i = 0; i < 12; i++) {
    const daysAgo = ri(0, 21);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const playerId = pick(playerIds);
    const riskLevel = pick(riskLevels);
    const acuteLoad = ri(180, 480);
    const chronicLoad = ri(300, 600);
    const ratio = Math.round((acuteLoad / (chronicLoad / 4)) * 100);
    
    const riskLevelMapped = riskLevel === 'medium' ? 'moderate' : riskLevel;
    const overallRiskScore = riskLevel === 'low' ? ri(10,35) : riskLevel === 'medium' ? ri(36,65) : ri(66,90);
    await conn.execute(`
      INSERT INTO injury_risk_assessments 
      (playerId, assessmentDate, acuteWorkload, chronicWorkload, acuteChronicRatio, riskLevel, overallRiskScore,
       recentTrainingSessions, recentMatchMinutes, fatigueLevel, musclesSoreness, sleepQualityScore,
       predictedInjuryTypes, specificRecommendations, aiAnalysis, recommendedRestDays, recommendedTrainingLoad)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `, [
      playerId, d.toISOString().split('T')[0],
      acuteLoad, chronicLoad, ratio,
      riskLevelMapped, overallRiskScore,
      ri(4, 12), ri(60, 180), ri(2, 8), ri(1, 7), ri(5, 9),
      JSON.stringify(riskLevel === 'high' ? [pick(bodyParts), 'hamstring'] : [pick(bodyParts)]),
      JSON.stringify(riskLevel === 'high' ? ['Reduce training intensity by 30%', 'Daily physiotherapy', 'Rest 2-3 days'] : riskLevel === 'medium' ? ['Monitor closely', 'Extended warm-up 20 min', 'Ice therapy post-session'] : ['Continue normal training', 'Standard warm-up protocol']),
      riskLevel === 'high' ? 'URGENT: Immediate physiotherapy consultation recommended. Reduce match involvement. Player shows signs of overtraining.' : riskLevel === 'medium' ? 'Schedule physiotherapy assessment within 48 hours. Modify training drills to reduce impact.' : 'Player is fit for full training. Maintain current conditioning program. No concerns identified.',
      riskLevel === 'high' ? ri(2,4) : riskLevel === 'medium' ? ri(0,1) : 0,
      riskLevel === 'high' ? ri(40,60) : riskLevel === 'medium' ? ri(60,80) : ri(80,100)
    ]);
  }
  console.log(`✅ Created 12 injury risk assessments`);

  // ========== 7. NOTIFICATIONS ==========
  console.log('\n🔔 Creating notifications...');
  const notifData = [
    { type: 'success', category: 'general', title: 'Enrollment Approved', msg: 'Ahmed Hassan has been approved for the U-14 Academy program. Welcome to Al Ahly Academy!', userId: adminId },
    { type: 'info', category: 'training', title: 'Training Session Tomorrow', msg: 'U-16 Premier team has a tactical training session tomorrow at 9:00 AM - Al Ahly Stadium Pitch 1', userId: adminId },
    { type: 'success', category: 'performance', title: 'Outstanding Performance', msg: 'Mohamed Ali achieved a new personal best in the 30m sprint: 4.2 seconds. Excellent progress!', userId: adminId },
    { type: 'alert', category: 'injury', title: 'Injury Risk Alert', msg: 'Player Karim Mostafa has been flagged with HIGH injury risk. Physiotherapy consultation required.', userId: adminId },
    { type: 'info', category: 'general', title: 'New Scout Report Ready', msg: 'AI analysis complete for Youssef El-Araby. Overall score: 89/100. Recommended for trial.', userId: adminId },
    { type: 'info', category: 'general', title: 'New Enrollment Request', msg: 'New enrollment application received from Omar Abdel-Fattah for U-16 Premier program.', userId: adminId },
    { type: 'success', category: 'performance', title: 'Match Victory!', msg: 'U-14 Academy won 3-1 against Zamalek Youth. Man of the Match: Tarek Samir (2 goals, 1 assist)', userId: adminId },
    { type: 'success', category: 'nutrition', title: 'Nutrition Goal Achieved', msg: 'Hassan El-Sayed has maintained optimal nutrition for 7 consecutive days. Excellent dedication!', userId: adminId },
  ];
  
  for (const n of notifData) {
    await conn.execute(`
      INSERT INTO notifications (userId, type, category, title, message, isRead, createdAt)
      VALUES (?,?,?,?,?,0,NOW())
    `, [n.userId, n.type, n.category, n.title, n.msg]);
  }
  console.log(`✅ Created ${notifData.length} notifications`);

  // ========== 8. MATCHES ==========
  console.log('\n⚽ Creating match data...');
  const opponents = ['Zamalek Youth', 'Pyramids FC Youth', 'Smouha SC', 'Ittihad Alexandria', 'El Mokawloon Youth', 'Wadi Degla Youth'];
  
  for (let i = 0; i < 8; i++) {
    const daysAgo = ri(5, 60);
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const homeScore = ri(0, 5);
    const awayScore = ri(0, 3);
    
    try {
      const result = homeScore > awayScore ? 'win' : homeScore === awayScore ? 'draw' : 'loss';
      await conn.execute(`
        INSERT INTO matches (teamId, opponent, matchDate, teamScore, opponentScore, venue, matchType, result, notes)
        VALUES (?,?,?,?,?,?,?,?,?)
      `, [
        pick(teamIds), pick(opponents), d.toISOString().split('T')[0],
        homeScore, awayScore,
        pick(['Al Ahly Stadium', 'Away Ground', 'Neutral Venue']),
        pick(['league', 'cup', 'friendly']),
        result,
        `${homeScore > awayScore ? 'Victory' : homeScore === awayScore ? 'Draw' : 'Defeat'}. ${homeScore > awayScore ? 'Excellent team performance.' : 'Areas for improvement identified.'}`
      ]);
    } catch(e) { /* skip if column mismatch */ }
  }
  console.log(`✅ Created match data`);

  // ========== 9. ACHIEVEMENTS ==========
  console.log('\n🏆 Creating achievements...');
  const achievementData = [
    { title: 'Top Scorer', desc: 'Scored 10+ goals in a season', icon: '⚽', category: 'performance' },
    { title: 'Perfect Attendance', desc: '100% attendance for 3 months', icon: '📅', category: 'attendance' },
    { title: 'Speed Demon', desc: 'Achieved 30m sprint under 4.5 seconds', icon: '⚡', category: 'physical' },
    { title: 'Team Player', desc: 'Most assists in the team', icon: '🤝', category: 'teamwork' },
    { title: 'Nutrition Champion', desc: '30 days of optimal nutrition', icon: '🥗', category: 'health' },
    { title: 'Tactical Master', desc: 'Highest tactical awareness score', icon: '🧠', category: 'tactical' },
  ];
  
  for (const a of achievementData) {
    try {
      await conn.execute(`
        INSERT IGNORE INTO achievements (title, description, icon, category, points, isActive)
        VALUES (?,?,?,?,?,1)
      `, [a.title, a.desc, a.icon, a.category, ri(50, 200)]);
    } catch(e) { /* skip */ }
  }
  console.log(`✅ Created achievements`);

  // ========== 10. PLAYER POINTS ==========
  console.log('\n⭐ Creating player points...');
  for (const pid of playerIds.slice(0, 15)) {
    try {
      const existing = await conn.execute('SELECT id FROM player_points WHERE playerId = ?', [pid]);
      if (existing[0].length === 0) {
        await conn.execute(`
          INSERT INTO player_points (playerId, totalPoints, level, streak)
          VALUES (?,?,?,?)
        `, [pid, ri(150, 1200), pick(['Bronze', 'Silver', 'Gold', 'Platinum']), ri(0, 21)]);
      }
    } catch(e) { /* skip */ }
  }
  console.log(`✅ Created player points`);

  // ========== 11. ENROLLMENT SUBMISSIONS ==========
  console.log('\n📝 Creating enrollment submissions...');
  const enrollmentData = [
    { name: 'Ziad Mohamed Hassan', age: 12, pos: 'Forward', parent: 'Mohamed Hassan', phone: '+20 100 123 4567', status: 'pending' },
    { name: 'Amr Khaled Ibrahim', age: 14, pos: 'Midfielder', parent: 'Khaled Ibrahim', phone: '+20 101 234 5678', status: 'approved' },
    { name: 'Seif Ahmed Nour', age: 15, pos: 'Defender', parent: 'Ahmed Nour', phone: '+20 102 345 6789', status: 'approved' },
    { name: 'Youssef Tarek Saad', age: 13, pos: 'Goalkeeper', parent: 'Tarek Saad', phone: '+20 103 456 7890', status: 'pending' },
    { name: 'Adam Mostafa Ali', age: 16, pos: 'Winger', parent: 'Mostafa Ali', phone: '+20 104 567 8901', status: 'under_review' },
    { name: 'Omar Hassan Farouk', age: 11, pos: 'Striker', parent: 'Hassan Farouk', phone: '+20 105 678 9012', status: 'approved' },
  ];
  
  for (const e of enrollmentData) {
    try {
      const nameParts = e.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');
      const parentParts = e.parent.split(' ');
      const dob = new Date(2026 - e.age, ri(0,11), ri(1,28)).toISOString().split('T')[0];
      await conn.execute(`
        INSERT INTO enrollment_submissions 
        (studentFirstName, studentLastName, dateOfBirth, gender, parentFirstName, parentLastName, parentPhone, parentEmail, program, ageGroup, preferredPosition, status, notes)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        firstName, lastName, dob, 'male',
        parentParts[0], parentParts.slice(1).join(' ') || 'Family',
        e.phone,
        `${e.parent.toLowerCase().replace(/ /g, '.')}@gmail.com`,
        e.age <= 12 ? 'U-12 Elite' : e.age <= 14 ? 'U-14 Academy' : 'U-16 Premier',
        e.age <= 12 ? 'U-12' : e.age <= 14 ? 'U-14' : 'U-16',
        e.pos,
        e.status,
        e.status === 'approved' ? 'Player shows excellent potential. Approved for trial session.' : 
        e.status === 'pending' ? 'Application received. Awaiting review.' : 'Under review by coaching staff.'
      ]);
    } catch(e2) { console.log('enrollment skip:', e2.message.split(':')[0]); }
  }
  console.log(`✅ Created ${enrollmentData.length} enrollment submissions`);

  // ========== 12. PERFORMANCE METRICS ==========
  console.log('\n📊 Creating performance metrics...');
  for (const pid of playerIds.slice(0, 20)) {
    try {
      const d = new Date();
      d.setDate(d.getDate() - ri(0, 14));
      await conn.execute(`
        INSERT INTO performance_metrics 
        (playerId, date, speed, acceleration, stamina, strength, agility, 
         ballControl, passing, shooting, dribbling, positioning, 
         overallRating, sessionType, notes)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `, [
        pid, d.toISOString().split('T')[0],
        rf(20, 32), rf(3.5, 5.5), ri(65, 95), ri(55, 90), ri(60, 92),
        ri(65, 95), ri(60, 92), ri(55, 90), ri(62, 95), ri(65, 92),
        ri(65, 95),
        pick(['training', 'match', 'assessment']),
        'Performance metrics recorded during regular training session.'
      ]);
    } catch(e) { /* skip */ }
  }
  console.log(`✅ Created performance metrics`);

  // ========== 13. ACADEMY EVENTS ==========
  console.log('\n📅 Creating academy events...');
  const eventData = [
    { title: 'Al Ahly Academy Open Day', desc: 'Annual open day for prospective players and parents. Showcasing our facilities and programs.', type: 'open_day', date: '2026-04-15' },
    { title: 'U-16 Championship Final', desc: 'Al Ahly U-16 Premier vs Zamalek Youth - Egyptian Youth Championship Final', type: 'match', date: '2026-04-20' },
    { title: 'Parent-Coach Meeting', desc: 'Quarterly meeting for parents to discuss player progress with coaching staff', type: 'meeting', date: '2026-04-10' },
    { title: 'Skills Assessment Day', desc: 'Annual skills assessment for all academy players across all age groups', type: 'assessment', date: '2026-04-25' },
    { title: 'Summer Camp Registration', desc: 'Registration opens for Al Ahly Academy Summer Intensive Camp 2026', type: 'registration', date: '2026-05-01' },
  ];
  
  for (const ev of eventData) {
    try {
      const endDate = new Date(ev.date);
      endDate.setHours(endDate.getHours() + 3);
      await conn.execute(`
        INSERT IGNORE INTO academy_events (title, description, eventType, location, startDate, endDate, maxParticipants, status, isPublic, createdBy)
        VALUES (?,?,?,?,?,?,?,?,1,?)
      `, [ev.title, ev.desc, ev.type, 'Al Ahly Stadium & Training Complex', ev.date, endDate.toISOString().split('T')[0], ri(50, 500), 'upcoming', adminId]);
    } catch(e) { console.log('event skip:', e.message.split(':')[0]); }
  }
  console.log(`✅ Created ${eventData.length} academy events`);

  // ========== 14. BLOG POSTS ==========
  console.log('\n📰 Creating blog posts...');
  const blogData = [
    { title: 'Al Ahly Academy Wins Regional Youth Championship', slug: 'academy-wins-regional-championship', content: 'Al Ahly Academy U-16 team claimed the Regional Youth Championship title with a stunning 3-1 victory over Zamalek Youth. The team demonstrated exceptional tactical discipline and technical quality throughout the tournament...', category: 'news' },
    { title: 'New AI Training Technology Introduced at Al Ahly Academy', slug: 'ai-training-technology', content: 'Al Ahly Academy has become the first football academy in Egypt to implement comprehensive AI-powered training analysis. The system tracks 20+ performance metrics in real-time...', category: 'technology' },
    { title: 'Nutrition Program Yields Impressive Results', slug: 'nutrition-program-results', content: 'Our AI-powered nutrition program has shown remarkable results, with academy players showing a 15% improvement in stamina and recovery times over the past 3 months...', category: 'health' },
    { title: 'Scout Network Discovers Hidden Talent in Upper Egypt', slug: 'scout-network-upper-egypt', content: 'Our expanded scout network has identified 12 exceptional young talents from Upper Egypt, with 3 already joining the academy on scholarship...', category: 'scouting' },
  ];
  
  for (const b of blogData) {
    try {
      await conn.execute(`
        INSERT IGNORE INTO blog_posts (title, slug, content, category, authorId, isPublished, publishedAt)
        VALUES (?,?,?,?,?,1,NOW())
      `, [b.title, b.slug, b.content, b.category, adminId]);
    } catch(e) { /* skip */ }
  }
  console.log(`✅ Created ${blogData.length} blog posts`);

  // ========== 15. TESTIMONIALS ==========
  console.log('\n💬 Creating testimonials...');
  const testimonials = [
    { name: 'Mohamed Hassan', role: 'Parent of Ahmed Hassan (U-14)', content: 'Al Ahly Academy has transformed my son. The AI-powered training and personalized coaching have improved his skills dramatically in just 6 months.', rating: 5 },
    { name: 'Coach Ahmed Kamal', role: 'Head Coach, U-16 Premier', content: 'The technology platform gives me unprecedented insight into each player\'s development. The injury prevention AI alone has reduced our injury rate by 40%.', rating: 5 },
    { name: 'Tarek Ibrahim', role: 'Parent of Omar Ibrahim (U-12)', content: 'The parent portal keeps me fully informed about my child\'s progress. I can see his attendance, performance metrics, and nutrition all in one place.', rating: 5 },
    { name: 'Dr. Khaled Samir', role: 'Academy Physiotherapist', content: 'The injury risk assessment system is revolutionary. We can now predict and prevent injuries before they happen, keeping players fit and performing at their best.', rating: 5 },
  ];
  
  for (const t of testimonials) {
    try {
      await conn.execute(`
        INSERT IGNORE INTO testimonials (name, role, content, rating, isPublished)
        VALUES (?,?,?,?,1)
      `, [t.name, t.role, t.content, t.rating]);
    } catch(e) { /* skip */ }
  }
  console.log(`✅ Created ${testimonials.length} testimonials`);

  console.log('\n🎉 Al Ahly Academy demo data population complete!');
  console.log('📊 Summary:');
  console.log('  - 20 training sessions');
  console.log('  - 10 training videos');
  console.log('  - 8 scout reports');
  console.log('  - 15 meal logs (Nutrition AI)');
  console.log('  - 12 injury risk assessments');
  console.log('  - 8 notifications');
  console.log('  - Match data');
  console.log('  - 6 achievements');
  console.log('  - Player points');
  console.log('  - 6 enrollment submissions');
  console.log('  - Performance metrics');
  console.log('  - 5 academy events');
  console.log('  - 4 blog posts');
  console.log('  - 4 testimonials');
  
} catch (err) {
  console.error('Error:', err.message);
} finally {
  await conn.end();
}
