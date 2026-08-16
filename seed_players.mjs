/**
 * Seed 5 players with full data:
 * 1. Malek Kamal - U12 Main Team, rising performance each month
 * 2. Omar Khaled - U14 Academy, solid midfielder
 * 3. Ahmed Hassan - U12 Main Team, goalkeeper
 * 4. Youssef Ibrahim - U14 Academy, forward
 * 5. Karim Mostafa - U12 Academy, defender
 */

import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';
dotenv.config();

const db = await createConnection(process.env.DATABASE_URL);

async function run() {
  try {
    // 1. Ensure U12 Main Team exists
    const [teams] = await db.execute("SELECT id FROM teams WHERE ageGroup = 'U12' AND teamType = 'main' LIMIT 1");
    let mainTeamU12Id;
    if (teams.length === 0) {
      const [res] = await db.execute(
        "INSERT INTO teams (name, ageGroup, teamType, description) VALUES (?, ?, ?, ?)",
        ['Al-Ahly U12 Main', 'U12', 'main', 'Main team for U12 age group - competitive squad']
      );
      mainTeamU12Id = res.insertId;
      console.log('Created U12 Main team:', mainTeamU12Id);
    } else {
      mainTeamU12Id = teams[0].id;
      console.log('Found U12 Main team:', mainTeamU12Id);
    }

    // 2. Ensure U14 Academy Team exists
    const [teams2] = await db.execute("SELECT id FROM teams WHERE ageGroup = 'U14' AND teamType = 'academy' LIMIT 1");
    let academyTeamU14Id;
    if (teams2.length === 0) {
      const [res] = await db.execute(
        "INSERT INTO teams (name, ageGroup, teamType, description) VALUES (?, ?, ?, ?)",
        ['Al-Ahly U14 Academy', 'U14', 'academy', 'Academy development team for U14 age group']
      );
      academyTeamU14Id = res.insertId;
      console.log('Created U14 Academy team:', academyTeamU14Id);
    } else {
      academyTeamU14Id = teams2[0].id;
      console.log('Found U14 Academy team:', academyTeamU14Id);
    }

    // 3. Ensure U12 Academy Team exists
    const [teams3] = await db.execute("SELECT id FROM teams WHERE ageGroup = 'U12' AND teamType = 'academy' LIMIT 1");
    let academyTeamU12Id;
    if (teams3.length === 0) {
      const [res] = await db.execute(
        "INSERT INTO teams (name, ageGroup, teamType, description) VALUES (?, ?, ?, ?)",
        ['Al-Ahly U12 Academy', 'U12', 'academy', 'Academy development team for U12 age group']
      );
      academyTeamU12Id = res.insertId;
    } else {
      academyTeamU12Id = teams3[0].id;
    }

    // 4. Define the 5 players
    const players = [
      {
        firstName: 'Malek', lastName: 'Kamal',
        dateOfBirth: '2012-03-15', position: 'midfielder',
        preferredFoot: 'right', height: 148, weight: 42,
        jerseyNumber: 10, ageGroup: 'U12', teamId: mainTeamU12Id,
        teamType: 'main', status: 'active', joinDate: '2023-09-01',
        nationality: 'Egyptian',
        bio: 'Talented young midfielder with exceptional vision and ball control. Shows remarkable improvement every month. Strong leadership qualities for his age.',
        academyCode: 'AHY-U12-MK10',
        // Rising performance: starts at 65, reaches 88 by month 6
        monthlyScores: [
          { month: '2024-09-01', tech: 65, phys: 62, tact: 60, overall: 62 },
          { month: '2024-10-01', tech: 68, phys: 65, tact: 63, overall: 65 },
          { month: '2024-11-01', tech: 72, phys: 68, tact: 67, overall: 69 },
          { month: '2024-12-01', tech: 75, phys: 71, tact: 70, overall: 72 },
          { month: '2025-01-01', tech: 79, phys: 74, tact: 74, overall: 76 },
          { month: '2025-02-01', tech: 83, phys: 78, tact: 78, overall: 80 },
          { month: '2025-03-01', tech: 86, phys: 81, tact: 82, overall: 83 },
          { month: '2025-04-01', tech: 88, phys: 84, tact: 85, overall: 86 },
        ],
        skillScores: {
          ballControl: 87, firstTouch: 85, dribbling: 84, passing: 88,
          shooting: 72, crossing: 75, heading: 65,
          leftFootScore: 70, rightFootScore: 88, twoFootedScore: 72, weakFootUsage: 18,
          speed: 80, acceleration: 82, agility: 83, stamina: 79, strength: 65, jumping: 68,
          positioning: 85, vision: 88, composure: 82, decisionMaking: 84, workRate: 90,
          marking: 70, tackling: 72, interceptions: 74,
          technicalOverall: 86, physicalOverall: 78
        }
      },
      {
        firstName: 'Omar', lastName: 'Khaled',
        dateOfBirth: '2010-07-22', position: 'midfielder',
        preferredFoot: 'right', height: 162, weight: 55,
        jerseyNumber: 8, ageGroup: 'U14', teamId: academyTeamU14Id,
        teamType: 'academy', status: 'active', joinDate: '2022-09-01',
        nationality: 'Egyptian',
        bio: 'Consistent box-to-box midfielder with strong defensive awareness. Captain material with excellent communication skills on the pitch.',
        academyCode: 'AHY-U14-OK08',
        monthlyScores: [
          { month: '2024-09-01', tech: 74, phys: 76, tact: 75, overall: 75 },
          { month: '2024-10-01', tech: 75, phys: 77, tact: 76, overall: 76 },
          { month: '2024-11-01', tech: 76, phys: 78, tact: 77, overall: 77 },
          { month: '2024-12-01', tech: 77, phys: 78, tact: 78, overall: 78 },
          { month: '2025-01-01', tech: 78, phys: 79, tact: 79, overall: 79 },
          { month: '2025-02-01', tech: 79, phys: 80, tact: 80, overall: 80 },
          { month: '2025-03-01', tech: 80, phys: 80, tact: 81, overall: 80 },
          { month: '2025-04-01', tech: 81, phys: 81, tact: 82, overall: 81 },
        ],
        skillScores: {
          ballControl: 80, firstTouch: 79, dribbling: 76, passing: 83,
          shooting: 74, crossing: 72, heading: 75,
          leftFootScore: 68, rightFootScore: 83, twoFootedScore: 70, weakFootUsage: 15,
          speed: 78, acceleration: 77, agility: 76, stamina: 84, strength: 78, jumping: 74,
          positioning: 82, vision: 80, composure: 80, decisionMaking: 81, workRate: 88,
          marking: 79, tackling: 80, interceptions: 81,
          technicalOverall: 79, physicalOverall: 80
        }
      },
      {
        firstName: 'Ahmed', lastName: 'Hassan',
        dateOfBirth: '2012-11-05', position: 'goalkeeper',
        preferredFoot: 'right', height: 155, weight: 50,
        jerseyNumber: 1, ageGroup: 'U12', teamId: mainTeamU12Id,
        teamType: 'main', status: 'active', joinDate: '2023-09-01',
        nationality: 'Egyptian',
        bio: 'Commanding goalkeeper with excellent reflexes and strong distribution. Vocal leader who organizes the defense well.',
        academyCode: 'AHY-U12-AH01',
        monthlyScores: [
          { month: '2024-09-01', tech: 70, phys: 72, tact: 68, overall: 70 },
          { month: '2024-10-01', tech: 72, phys: 73, tact: 70, overall: 72 },
          { month: '2024-11-01', tech: 73, phys: 74, tact: 71, overall: 73 },
          { month: '2024-12-01', tech: 74, phys: 75, tact: 73, overall: 74 },
          { month: '2025-01-01', tech: 75, phys: 76, tact: 74, overall: 75 },
          { month: '2025-02-01', tech: 76, phys: 77, tact: 75, overall: 76 },
          { month: '2025-03-01', tech: 77, phys: 77, tact: 76, overall: 77 },
          { month: '2025-04-01', tech: 78, phys: 78, tact: 77, overall: 78 },
        ],
        skillScores: {
          ballControl: 72, firstTouch: 70, dribbling: 60, passing: 74,
          shooting: 55, crossing: 58, heading: 72,
          leftFootScore: 72, rightFootScore: 74, twoFootedScore: 68, weakFootUsage: 25,
          speed: 70, acceleration: 68, agility: 75, stamina: 72, strength: 74, jumping: 80,
          positioning: 82, vision: 78, composure: 83, decisionMaking: 80, workRate: 82,
          marking: 65, tackling: 60, interceptions: 62,
          technicalOverall: 68, physicalOverall: 74
        }
      },
      {
        firstName: 'Youssef', lastName: 'Ibrahim',
        dateOfBirth: '2010-04-18', position: 'forward',
        preferredFoot: 'left', height: 165, weight: 58,
        jerseyNumber: 9, ageGroup: 'U14', teamId: academyTeamU14Id,
        teamType: 'academy', status: 'active', joinDate: '2022-01-15',
        nationality: 'Egyptian',
        bio: 'Explosive forward with natural finishing ability. Left-footed with excellent off-the-ball movement. Top scorer in the U14 league last season.',
        academyCode: 'AHY-U14-YI09',
        monthlyScores: [
          { month: '2024-09-01', tech: 80, phys: 82, tact: 76, overall: 79 },
          { month: '2024-10-01', tech: 81, phys: 83, tact: 77, overall: 80 },
          { month: '2024-11-01', tech: 82, phys: 83, tact: 78, overall: 81 },
          { month: '2024-12-01', tech: 82, phys: 84, tact: 79, overall: 82 },
          { month: '2025-01-01', tech: 83, phys: 84, tact: 80, overall: 82 },
          { month: '2025-02-01', tech: 84, phys: 85, tact: 80, overall: 83 },
          { month: '2025-03-01', tech: 84, phys: 85, tact: 81, overall: 83 },
          { month: '2025-04-01', tech: 85, phys: 86, tact: 82, overall: 84 },
        ],
        skillScores: {
          ballControl: 84, firstTouch: 83, dribbling: 85, passing: 76,
          shooting: 88, crossing: 80, heading: 74,
          leftFootScore: 88, rightFootScore: 72, twoFootedScore: 74, weakFootUsage: 22,
          speed: 87, acceleration: 88, agility: 85, stamina: 80, strength: 72, jumping: 76,
          positioning: 84, vision: 80, composure: 78, decisionMaking: 79, workRate: 82,
          marking: 55, tackling: 58, interceptions: 60,
          technicalOverall: 83, physicalOverall: 82
        }
      },
      {
        firstName: 'Karim', lastName: 'Mostafa',
        dateOfBirth: '2012-08-30', position: 'defender',
        preferredFoot: 'right', height: 150, weight: 45,
        jerseyNumber: 5, ageGroup: 'U12', teamId: academyTeamU12Id,
        teamType: 'academy', status: 'active', joinDate: '2023-09-01',
        nationality: 'Egyptian',
        bio: 'Solid central defender with excellent reading of the game. Strong in the air and composed under pressure. Potential future captain.',
        academyCode: 'AHY-U12-KM05',
        monthlyScores: [
          { month: '2024-09-01', tech: 66, phys: 70, tact: 72, overall: 69 },
          { month: '2024-10-01', tech: 67, phys: 71, tact: 73, overall: 70 },
          { month: '2024-11-01', tech: 68, phys: 72, tact: 74, overall: 71 },
          { month: '2024-12-01', tech: 69, phys: 73, tact: 75, overall: 72 },
          { month: '2025-01-01', tech: 70, phys: 74, tact: 76, overall: 73 },
          { month: '2025-02-01', tech: 71, phys: 75, tact: 77, overall: 74 },
          { month: '2025-03-01', tech: 72, phys: 75, tact: 78, overall: 75 },
          { month: '2025-04-01', tech: 73, phys: 76, tact: 79, overall: 76 },
        ],
        skillScores: {
          ballControl: 70, firstTouch: 68, dribbling: 65, passing: 74,
          shooting: 60, crossing: 65, heading: 78,
          leftFootScore: 65, rightFootScore: 74, twoFootedScore: 66, weakFootUsage: 12,
          speed: 72, acceleration: 70, agility: 68, stamina: 76, strength: 78, jumping: 80,
          positioning: 82, vision: 74, composure: 80, decisionMaking: 78, workRate: 85,
          marking: 84, tackling: 82, interceptions: 80,
          technicalOverall: 69, physicalOverall: 75
        }
      }
    ];

    for (const p of players) {
      // Check if player already exists
      const [existing] = await db.execute(
        "SELECT id FROM players WHERE academyCode = ?", [p.academyCode]
      );
      
      let playerId;
      if (existing.length > 0) {
        playerId = existing[0].id;
        console.log(`Player ${p.firstName} ${p.lastName} already exists (id: ${playerId}), updating...`);
        await db.execute(
          `UPDATE players SET firstName=?, lastName=?, dateOfBirth=?, position=?, preferredFoot=?, 
           height=?, weight=?, jerseyNumber=?, ageGroup=?, teamId=?, teamType=?, status=?, 
           joinDate=?, nationality=?, bio=? WHERE id=?`,
          [p.firstName, p.lastName, p.dateOfBirth, p.position, p.preferredFoot,
           p.height, p.weight, p.jerseyNumber, p.ageGroup, p.teamId, p.teamType, p.status,
           p.joinDate, p.nationality, p.bio, playerId]
        );
      } else {
        const [res] = await db.execute(
          `INSERT INTO players (firstName, lastName, dateOfBirth, position, preferredFoot, 
           height, weight, jerseyNumber, ageGroup, teamId, teamType, status, joinDate, 
           nationality, bio, academyCode) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [p.firstName, p.lastName, p.dateOfBirth, p.position, p.preferredFoot,
           p.height, p.weight, p.jerseyNumber, p.ageGroup, p.teamId, p.teamType, p.status,
           p.joinDate, p.nationality, p.bio, p.academyCode]
        );
        playerId = res.insertId;
        console.log(`Created player ${p.firstName} ${p.lastName} (id: ${playerId})`);
      }

      // Seed monthly performance metrics
      for (const score of p.monthlyScores) {
        const [existingMetric] = await db.execute(
          "SELECT id FROM performance_metrics WHERE playerId=? AND sessionDate=? AND sessionType='assessment'",
          [playerId, score.month]
        );
        if (existingMetric.length === 0) {
          await db.execute(
            `INSERT INTO performance_metrics 
             (playerId, sessionDate, sessionType, passes, passAccuracy, shots, shotsOnTarget, 
              dribbles, successfulDribbles, distanceCovered, topSpeed, sprints, 
              possessionWon, possessionLost, interceptions, tackles,
              technicalScore, physicalScore, tacticalScore, overallScore, notes)
             VALUES (?, ?, 'assessment', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [playerId, score.month,
             Math.round(score.tech * 0.8), score.tech, // passes, passAccuracy
             Math.round(score.tech * 0.15), Math.round(score.tech * 0.1), // shots, shotsOnTarget
             Math.round(score.tech * 0.2), Math.round(score.tech * 0.15), // dribbles, successfulDribbles
             Math.round(score.phys * 90), Math.round(score.phys * 0.35), // distanceCovered, topSpeed
             Math.round(score.phys * 0.12), // sprints
             Math.round(score.tact * 0.08), Math.round(score.tact * 0.06), // possessionWon, possessionLost
             Math.round(score.tact * 0.05), Math.round(score.tact * 0.04), // interceptions, tackles
             score.tech, score.phys, score.tact, score.overall,
             `Monthly assessment - ${score.month}`]
          );
        }
      }
      console.log(`  Seeded ${p.monthlyScores.length} performance records for ${p.firstName}`);

      // Seed skill scores (latest assessment)
      const s = p.skillScores;
      const latestDate = p.monthlyScores[p.monthlyScores.length - 1].month;
      const [existingSkill] = await db.execute(
        "SELECT id FROM player_skill_scores WHERE playerId=? AND assessmentDate=?",
        [playerId, latestDate]
      );
      if (existingSkill.length === 0) {
        await db.execute(
          `INSERT INTO player_skill_scores 
           (playerId, assessmentDate, ballControl, firstTouch, dribbling, passing, shooting, crossing, heading,
            leftFootScore, rightFootScore, twoFootedScore, weakFootUsage,
            speed, acceleration, agility, stamina, strength, jumping,
            positioning, vision, composure, decisionMaking, workRate,
            marking, tackling, interceptions, technicalOverall, physicalOverall)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [playerId, latestDate,
           s.ballControl, s.firstTouch, s.dribbling, s.passing, s.shooting, s.crossing, s.heading,
           s.leftFootScore, s.rightFootScore, s.twoFootedScore, s.weakFootUsage,
           s.speed, s.acceleration, s.agility, s.stamina, s.strength, s.jumping,
           s.positioning, s.vision, s.composure, s.decisionMaking, s.workRate,
           s.marking, s.tackling, s.interceptions, s.technicalOverall, s.physicalOverall]
        );
        console.log(`  Seeded skill scores for ${p.firstName}`);
      }
    }

    console.log('\n✅ All 5 players seeded successfully!');
    console.log('Players: Malek Kamal (U12 Main), Omar Khaled (U14 Academy), Ahmed Hassan (U12 Main), Youssef Ibrahim (U14 Academy), Karim Mostafa (U12 Academy)');
  } catch (err) {
    console.error('Error seeding players:', err.message);
    throw err;
  } finally {
    await db.end();
  }
}

run();
