import { getDb } from './db';
import { 
  progressReportHistory, 
  players, 
  playerSkillScores, 
  playerActivities,
  playerMatchStats,
  users 
} from '../drizzle/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

interface ReportData {
  player: {
    id: number;
    name: string;
    position: string;
    ageGroup: string;
    photo?: string;
  };
  period: {
    start: Date;
    end: Date;
    type: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom';
  };
  ratings: {
    overall: number;
    technical: number;
    physical: number;
    tactical: number;
    mental: number;
  };
  statistics: {
    matchesPlayed: number;
    trainingAttendance: number;
    goalsScored: number;
    assists: number;
    distanceCovered: number;
    topSpeed: number;
  };
  coachFeedback: {
    comments: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
  };
}

/**
 * Generate progress report data for a player
 */
export async function generateReportData(
  playerId: number,
  periodStart: Date,
  periodEnd: Date,
  reportType: 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'custom'
): Promise<ReportData> {
  const database = (await getDb())!;
  if (!database) {
    throw new Error('Database not available');
  }

  // Get player info
  const player = await database
    .select({
      id: players.id,
      firstName: players.firstName,
      lastName: players.lastName,
      position: players.position,
      ageGroup: players.ageGroup,
      photo: players.photoUrl,
    })
    .from(players)
    .where(eq(players.id, playerId))
    .limit(1);

  if (!player || player.length === 0) {
    throw new Error('Player not found');
  }

  const playerInfo = player[0];

  // Get latest skill scores
  const latestSkills = await database
    .select()
    .from(playerSkillScores)
    .where(eq(playerSkillScores.playerId, playerId))
    .orderBy(desc(playerSkillScores.id))
    .limit(1);

  const skillRow = latestSkills[0];
  const skills = {
    overallRating: skillRow?.overallRating || 0,
    technicalAvg: skillRow?.technicalOverall || 0,
    physicalAvg: skillRow?.physicalOverall || 0,
    tacticalAvg: skillRow?.mentalOverall || 0,
    mentalAvg: skillRow?.mentalOverall || 0,
  };

  // Get match statistics for the period
  const matchStats = await database
    .select({
      matchesPlayed: sql<number>`COUNT(DISTINCT ${playerMatchStats.matchId})`,
      goalsScored: sql<number>`SUM(${playerMatchStats.goals})`,
      assists: sql<number>`SUM(${playerMatchStats.assists})`,
      avgDistance: sql<number>`AVG(${playerMatchStats.distanceCovered})`,
      maxSpeed: sql<number>`MAX(${playerMatchStats.topSpeed})`,
    })
    .from(playerMatchStats)
    .where(eq(playerMatchStats.playerId, playerId));

  // Get training attendance
  const trainingActivities = await database
    .select({
      total: sql<number>`COUNT(*)`,
      attended: sql<number>`COUNT(*)`,
    })
    .from(playerActivities)
    .where(
      and(
        eq(playerActivities.playerId, playerId),
        gte(playerActivities.activityDate, periodStart),
        lte(playerActivities.activityDate, periodEnd)
      )
    );

  const attendance = trainingActivities[0];
  const attendancePercentage = attendance?.total 
    ? Math.round(((attendance.attended || 0) / attendance.total) * 100)
    : 0;

  const stats = matchStats[0] || {
    matchesPlayed: 0,
    goalsScored: 0,
    assists: 0,
    avgDistance: 0,
    maxSpeed: 0,
  };

  // Generate AI-powered coach feedback (placeholder - integrate with LLM later)
  const coachFeedback = {
    comments: `${playerInfo.firstName} has shown consistent progress during this period. Performance metrics indicate strong development across multiple areas.`,
    strengths: [
      skills.technicalAvg > 70 ? 'Excellent technical skills' : 'Developing technical abilities',
      skills.physicalAvg > 70 ? 'Strong physical conditioning' : 'Improving physical fitness',
      stats.goalsScored > 3 ? 'Clinical finishing' : 'Contributing to team play',
    ],
    areasForImprovement: [
      skills.tacticalAvg < 60 ? 'Tactical awareness and positioning' : 'Advanced tactical concepts',
      skills.mentalAvg < 60 ? 'Mental resilience under pressure' : 'Leadership qualities',
      attendancePercentage < 80 ? 'Training attendance consistency' : 'Injury prevention',
    ],
    recommendations: [
      'Continue focused training on identified improvement areas',
      'Increase match experience through competitive play',
      'Work with sports psychologist for mental development',
      'Maintain consistent training attendance',
    ],
  };

  return {
    player: {
      id: playerInfo.id,
      name: `${playerInfo.firstName} ${playerInfo.lastName}`,
      position: playerInfo.position,
      ageGroup: playerInfo.ageGroup || 'N/A',
      photo: playerInfo.photo || undefined,
    },
    period: {
      start: periodStart,
      end: periodEnd,
      type: reportType,
    },
    ratings: {
      overall: skills.overallRating || 0,
      technical: skills.technicalAvg || 0,
      physical: skills.physicalAvg || 0,
      tactical: skills.tacticalAvg || 0,
      mental: skills.mentalAvg || 0,
    },
    statistics: {
      matchesPlayed: Number(stats.matchesPlayed) || 0,
      trainingAttendance: attendancePercentage,
      goalsScored: Number(stats.goalsScored) || 0,
      assists: Number(stats.assists) || 0,
      distanceCovered: Number(stats.avgDistance) || 0,
      topSpeed: Number(stats.maxSpeed) || 0,
    },
    coachFeedback,
  };
}

/**
 * Generate HTML report (can be converted to PDF using browser print or puppeteer)
 */
export function generateHTMLReport(data: ReportData): string {
  const { player, period, ratings, statistics, coachFeedback } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Progress Report - ${player.name}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #ff6b00;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #ff6b00;
      margin: 0;
    }
    .player-info {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #ff6b00;
      border-bottom: 2px solid #ff6b00;
      padding-bottom: 10px;
    }
    .ratings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .rating-card {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }
    .rating-value {
      font-size: 32px;
      font-weight: bold;
      color: #ff6b00;
    }
    .rating-label {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-top: 15px;
    }
    .stat-item {
      background: #f9f9f9;
      padding: 15px;
      border-radius: 8px;
    }
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    .stat-label {
      font-size: 12px;
      color: #666;
      margin-top: 5px;
    }
    ul {
      line-height: 1.8;
    }
    .footer {
      margin-top: 50px;
      text-align: center;
      color: #999;
      font-size: 12px;
      border-top: 1px solid #ddd;
      padding-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Player Progress Report</h1>
    <p>Future Stars FC Academy</p>
  </div>

  <div class="player-info">
    <h2>${player.name}</h2>
    <p><strong>Position:</strong> ${player.position}</p>
    <p><strong>Age Group:</strong> ${player.ageGroup}</p>
    <p><strong>Report Period:</strong> ${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}</p>
    <p><strong>Report Type:</strong> ${period.type.charAt(0).toUpperCase() + period.type.slice(1)}</p>
  </div>

  <div class="section">
    <h2>Performance Ratings</h2>
    <div class="ratings-grid">
      <div class="rating-card">
        <div class="rating-value">${ratings.overall}</div>
        <div class="rating-label">Overall</div>
      </div>
      <div class="rating-card">
        <div class="rating-value">${ratings.technical}</div>
        <div class="rating-label">Technical</div>
      </div>
      <div class="rating-card">
        <div class="rating-value">${ratings.physical}</div>
        <div class="rating-label">Physical</div>
      </div>
      <div class="rating-card">
        <div class="rating-value">${ratings.tactical}</div>
        <div class="rating-label">Tactical</div>
      </div>
      <div class="rating-card">
        <div class="rating-value">${ratings.mental}</div>
        <div class="rating-label">Mental</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Statistics</h2>
    <div class="stats-grid">
      <div class="stat-item">
        <div class="stat-value">${statistics.matchesPlayed}</div>
        <div class="stat-label">Matches Played</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${statistics.trainingAttendance}%</div>
        <div class="stat-label">Training Attendance</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${statistics.goalsScored}</div>
        <div class="stat-label">Goals Scored</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${statistics.assists}</div>
        <div class="stat-label">Assists</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${(statistics.distanceCovered / 1000).toFixed(1)} km</div>
        <div class="stat-label">Avg Distance Covered</div>
      </div>
      <div class="stat-item">
        <div class="stat-value">${statistics.topSpeed} km/h</div>
        <div class="stat-label">Top Speed</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Coach Feedback</h2>
    <p>${coachFeedback.comments}</p>
    
    <h3>Strengths</h3>
    <ul>
      ${coachFeedback.strengths.map(s => `<li>${s}</li>`).join('')}
    </ul>
    
    <h3>Areas for Improvement</h3>
    <ul>
      ${coachFeedback.areasForImprovement.map(a => `<li>${a}</li>`).join('')}
    </ul>
    
    <h3>Recommendations</h3>
    <ul>
      ${coachFeedback.recommendations.map(r => `<li>${r}</li>`).join('')}
    </ul>
  </div>

  <div class="footer">
    <p>Generated on ${new Date().toLocaleDateString()}</p>
    <p>Future Stars FC Academy - Where Champions Are Made</p>
  </div>
</body>
</html>
  `;
}

/**
 * Save report to database
 */
export async function saveReportToDatabase(
  playerId: number,
  reportData: ReportData,
  pdfUrl: string,
  generatedBy: number
): Promise<number> {
  const database = (await getDb())!;
  if (!database) {
    throw new Error('Database not available');
  }

  const result = await database.insert(progressReportHistory).values({
    playerId,
    reportDate: new Date(),
    reportType: reportData.period.type,
    reportPeriodStart: reportData.period.start,
    reportPeriodEnd: reportData.period.end,
    overallRating: reportData.ratings.overall,
    technicalRating: reportData.ratings.technical,
    physicalRating: reportData.ratings.physical,
    tacticalRating: reportData.ratings.tactical,
    mentalRating: reportData.ratings.mental,
    matchesPlayed: reportData.statistics.matchesPlayed,
    trainingAttendance: reportData.statistics.trainingAttendance,
    goalsScored: reportData.statistics.goalsScored,
    assists: reportData.statistics.assists,
    coachComments: reportData.coachFeedback.comments,
    strengths: reportData.coachFeedback.strengths.join('\n'),
    areasForImprovement: reportData.coachFeedback.areasForImprovement.join('\n'),
    recommendations: reportData.coachFeedback.recommendations.join('\n'),
    pdfUrl,
    generatedBy,
    emailSent: false,
  });

  return Number(result[0].insertId);
}
