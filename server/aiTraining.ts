import { invokeLLM, extractJSON } from "./_core/llm";
import { getDb } from "./db";
import { 
  players, 
  playerSkillScores, 
  performanceMetrics, 
  playerMatchStats,
  aiTrainingRecommendations,
  InsertAITrainingRecommendation
} from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

// Drill library based on skill areas
const DRILL_LIBRARY = {
  ballControl: [
    { name: "Cone Dribbling", duration: 15, description: "Weave through cones at varying speeds", difficulty: "beginner" },
    { name: "Wall Passes", duration: 10, description: "Pass against wall and control return", difficulty: "beginner" },
    { name: "Juggling Challenge", duration: 10, description: "Keep ball in air using all body parts", difficulty: "intermediate" },
  ],
  firstTouch: [
    { name: "Cushion Control", duration: 10, description: "Receive high balls and control softly", difficulty: "beginner" },
    { name: "Turn and Control", duration: 15, description: "Receive pass, turn, and accelerate", difficulty: "intermediate" },
    { name: "One-Touch Passing", duration: 15, description: "Quick one-touch passing in triangles", difficulty: "intermediate" },
  ],
  dribbling: [
    { name: "Speed Dribbling", duration: 15, description: "Dribble at pace through gates", difficulty: "beginner" },
    { name: "1v1 Moves", duration: 20, description: "Practice step-overs, feints, and cuts", difficulty: "intermediate" },
    { name: "Close Control Maze", duration: 15, description: "Navigate tight spaces with ball", difficulty: "advanced" },
  ],
  passing: [
    { name: "Short Passing Accuracy", duration: 15, description: "Hit targets from 10-15m", difficulty: "beginner" },
    { name: "Long Ball Practice", duration: 15, description: "Accurate long passes to zones", difficulty: "intermediate" },
    { name: "Through Ball Timing", duration: 20, description: "Weight and timing of through passes", difficulty: "advanced" },
  ],
  shooting: [
    { name: "Finishing Drill", duration: 20, description: "Shots from various angles", difficulty: "beginner" },
    { name: "One-Touch Finishing", duration: 15, description: "Quick shots from crosses", difficulty: "intermediate" },
    { name: "Power vs Placement", duration: 20, description: "Practice both shooting techniques", difficulty: "intermediate" },
  ],
  weakFoot: [
    { name: "Weak Foot Passing", duration: 15, description: "All passes with weak foot only", difficulty: "beginner" },
    { name: "Weak Foot Shooting", duration: 15, description: "Finishing with non-dominant foot", difficulty: "intermediate" },
    { name: "Weak Foot Dribbling", duration: 15, description: "Dribble using weak foot only", difficulty: "intermediate" },
  ],
  speed: [
    { name: "Sprint Intervals", duration: 15, description: "30m sprints with recovery", difficulty: "beginner" },
    { name: "Acceleration Bursts", duration: 15, description: "Quick 10m explosive starts", difficulty: "intermediate" },
    { name: "Speed Endurance", duration: 20, description: "Repeated sprints with short rest", difficulty: "advanced" },
  ],
  agility: [
    { name: "Ladder Drills", duration: 15, description: "Quick feet through agility ladder", difficulty: "beginner" },
    { name: "Cone Agility", duration: 15, description: "Sharp direction changes around cones", difficulty: "intermediate" },
    { name: "Reactive Agility", duration: 15, description: "React to visual cues and change direction", difficulty: "advanced" },
  ],
  stamina: [
    { name: "Continuous Running", duration: 20, description: "Steady pace jogging", difficulty: "beginner" },
    { name: "Interval Training", duration: 25, description: "Alternate high and low intensity", difficulty: "intermediate" },
    { name: "Match Simulation", duration: 30, description: "Game-like intensity patterns", difficulty: "advanced" },
  ],
  positioning: [
    { name: "Shadow Play", duration: 20, description: "Move into space without ball", difficulty: "beginner" },
    { name: "Positional Awareness", duration: 20, description: "Find space in small-sided games", difficulty: "intermediate" },
    { name: "Tactical Movement", duration: 25, description: "Position-specific movement patterns", difficulty: "advanced" },
  ],
  defending: [
    { name: "1v1 Defending", duration: 15, description: "Contain and tackle practice", difficulty: "beginner" },
    { name: "Pressing Triggers", duration: 20, description: "When and how to press", difficulty: "intermediate" },
    { name: "Defensive Shape", duration: 20, description: "Maintain team defensive structure", difficulty: "advanced" },
  ],
};

interface PlayerAnalysis {
  playerId: number;
  playerName: string;
  position: string;
  preferredFoot: string;
  skillScores: Record<string, number>;
  recentPerformance: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
}

async function analyzePlayer(playerId: number): Promise<PlayerAnalysis | null> {
  const db = (await getDb())!;
  if (!db) return null;

  // Get player info
  const [player] = await db.select().from(players).where(eq(players.id, playerId)).limit(1);
  if (!player) return null;

  // Get latest skill scores
  const [latestSkills] = await db
    .select()
    .from(playerSkillScores)
    .where(eq(playerSkillScores.playerId, playerId))
    .orderBy(desc(playerSkillScores.assessmentDate))
    .limit(1);

  // Get recent performance metrics (last 5 sessions)
  const recentMetrics = await db
    .select()
    .from(performanceMetrics)
    .where(eq(performanceMetrics.playerId, playerId))
    .orderBy(desc(performanceMetrics.sessionDate))
    .limit(5);

  // Calculate averages from recent performance
  const avgPerformance: Record<string, number> = {};
  if (recentMetrics.length > 0) {
    avgPerformance.technicalScore = Math.round(
      recentMetrics.reduce((sum, m) => sum + (m.technicalScore || 0), 0) / recentMetrics.length
    );
    avgPerformance.physicalScore = Math.round(
      recentMetrics.reduce((sum, m) => sum + (m.physicalScore || 0), 0) / recentMetrics.length
    );
    avgPerformance.tacticalScore = Math.round(
      recentMetrics.reduce((sum, m) => sum + (m.tacticalScore || 0), 0) / recentMetrics.length
    );
    avgPerformance.passAccuracy = Math.round(
      recentMetrics.reduce((sum, m) => sum + (m.passAccuracy || 0), 0) / recentMetrics.length
    );
  }

  // Build skill scores object
  const skillScores: Record<string, number> = latestSkills ? {
    ballControl: latestSkills.ballControl || 50,
    firstTouch: latestSkills.firstTouch || 50,
    dribbling: latestSkills.dribbling || 50,
    passing: latestSkills.passing || 50,
    shooting: latestSkills.shooting || 50,
    leftFootScore: latestSkills.leftFootScore || 50,
    rightFootScore: latestSkills.rightFootScore || 50,
    twoFootedScore: latestSkills.twoFootedScore || 50,
    speed: latestSkills.speed || 50,
    acceleration: latestSkills.acceleration || 50,
    agility: latestSkills.agility || 50,
    stamina: latestSkills.stamina || 50,
    positioning: latestSkills.positioning || 50,
    tackling: latestSkills.tackling || 50,
    workRate: latestSkills.workRate || 50,
  } : {};

  // Identify strengths (scores >= 70) and weaknesses (scores < 50)
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  
  for (const [skill, score] of Object.entries(skillScores)) {
    if (score >= 70) strengths.push(skill);
    else if (score < 50) weaknesses.push(skill);
  }

  // Check weak foot
  const preferredFoot = player.preferredFoot || 'right';
  if (preferredFoot === 'right' && skillScores.leftFootScore < 50) {
    weaknesses.push('weakFoot');
  } else if (preferredFoot === 'left' && skillScores.rightFootScore < 50) {
    weaknesses.push('weakFoot');
  }

  return {
    playerId,
    playerName: `${player.firstName} ${player.lastName}`,
    position: player.position,
    preferredFoot,
    skillScores,
    recentPerformance: avgPerformance,
    strengths,
    weaknesses,
  };
}

function selectDrillsForArea(area: string, count: number = 2): typeof DRILL_LIBRARY.ballControl {
  const drills = DRILL_LIBRARY[area as keyof typeof DRILL_LIBRARY] || [];
  return drills.slice(0, count);
}

export async function generateAITrainingRecommendations(playerId: number): Promise<InsertAITrainingRecommendation | null> {
  const analysis = await analyzePlayer(playerId);
  if (!analysis) return null;

  // Use LLM to generate personalized recommendations
  const prompt = `You are an expert football coach AI. Analyze this player's data and provide training recommendations.

Player: ${analysis.playerName}
Position: ${analysis.position}
Preferred Foot: ${analysis.preferredFoot}

Skill Scores (0-100):
${Object.entries(analysis.skillScores).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Recent Performance Averages:
${Object.entries(analysis.recentPerformance).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Identified Strengths: ${analysis.strengths.join(', ') || 'None identified'}
Identified Weaknesses: ${analysis.weaknesses.join(', ') || 'None identified'}

Based on this analysis, provide:
1. Top 3 priority areas to focus on
2. Specific training recommendations for each weak area
3. How to maintain and enhance strengths
4. Position-specific advice for a ${analysis.position}
5. Weak foot development plan if needed

Format your response as JSON with this structure:
{
  "priorityAreas": ["area1", "area2", "area3"],
  "weaknessTraining": { "area": "specific recommendation" },
  "strengthMaintenance": "advice for maintaining strengths",
  "positionAdvice": "position-specific training advice",
  "weakFootPlan": "weak foot development recommendation or null",
  "weeklyFocus": { "monday": "focus area", "wednesday": "focus area", "friday": "focus area" }
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert football coach AI that provides personalized training recommendations. Always respond with valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "training_recommendations",
          strict: true,
          schema: {
            type: "object",
            properties: {
              priorityAreas: { type: "array", items: { type: "string" } },
              weaknessTraining: { type: "object", additionalProperties: { type: "string" } },
              strengthMaintenance: { type: "string" },
              positionAdvice: { type: "string" },
              weakFootPlan: { type: "string" },
              weeklyFocus: { type: "object", additionalProperties: { type: "string" } }
            },
            required: ["priorityAreas", "weaknessTraining", "strengthMaintenance", "positionAdvice", "weakFootPlan", "weeklyFocus"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    const aiRecommendations = extractJSON<{
      priorityAreas: string[];
      weaknessTraining: string;
      strengthMaintenance: string;
      positionAdvice: string;
      weakFootPlan: string;
      weeklyFocus: Record<string, string>;
    }>(typeof content === 'string' ? content : JSON.stringify(content) || "{}");

    // Build drill recommendations based on weaknesses
    const recommendedDrills: any[] = [];
    for (const weakness of analysis.weaknesses.slice(0, 3)) {
      const drills = selectDrillsForArea(weakness);
      recommendedDrills.push(...drills.map(d => ({ ...d, targetArea: weakness })));
    }

    // Build weekly plan
    const weeklyPlan = {
      monday: { focus: aiRecommendations.weeklyFocus?.monday || analysis.weaknesses[0], drills: selectDrillsForArea(analysis.weaknesses[0] || 'ballControl') },
      tuesday: { focus: "recovery", drills: [] },
      wednesday: { focus: aiRecommendations.weeklyFocus?.wednesday || analysis.weaknesses[1], drills: selectDrillsForArea(analysis.weaknesses[1] || 'passing') },
      thursday: { focus: "strength_maintenance", drills: selectDrillsForArea(analysis.strengths[0] || 'ballControl', 1) },
      friday: { focus: aiRecommendations.weeklyFocus?.friday || "match_prep", drills: selectDrillsForArea('positioning') },
      saturday: { focus: "match_day", drills: [] },
      sunday: { focus: "rest", drills: [] },
    };

    const recommendation: InsertAITrainingRecommendation = {
      playerId,
      generatedDate: new Date(),
      strengthsIdentified: JSON.stringify(analysis.strengths),
      weaknessesIdentified: JSON.stringify(analysis.weaknesses),
      recommendedDrills: JSON.stringify(recommendedDrills),
      focusAreas: JSON.stringify(aiRecommendations.priorityAreas),
      weeklyPlan: JSON.stringify(weeklyPlan),
      priorityMetric1: aiRecommendations.priorityAreas?.[0] || null,
      priorityMetric2: aiRecommendations.priorityAreas?.[1] || null,
      priorityMetric3: aiRecommendations.priorityAreas?.[2] || null,
      dominantFootTraining: aiRecommendations.strengthMaintenance,
      weakFootTraining: aiRecommendations.weakFootPlan,
      positionSpecificDrills: aiRecommendations.positionAdvice,
      isActive: true,
      isAccepted: false,
      completionProgress: 0,
    };

    return recommendation;
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    
    // Fallback to rule-based recommendations
    const recommendedDrills: any[] = [];
    for (const weakness of analysis.weaknesses.slice(0, 3)) {
      const drills = selectDrillsForArea(weakness);
      recommendedDrills.push(...drills.map(d => ({ ...d, targetArea: weakness })));
    }

    return {
      playerId,
      generatedDate: new Date(),
      strengthsIdentified: JSON.stringify(analysis.strengths),
      weaknessesIdentified: JSON.stringify(analysis.weaknesses),
      recommendedDrills: JSON.stringify(recommendedDrills),
      focusAreas: JSON.stringify(analysis.weaknesses.slice(0, 3)),
      weeklyPlan: JSON.stringify({}),
      priorityMetric1: analysis.weaknesses[0] || null,
      priorityMetric2: analysis.weaknesses[1] || null,
      priorityMetric3: analysis.weaknesses[2] || null,
      dominantFootTraining: "Continue practicing with your dominant foot to maintain skill level",
      weakFootTraining: analysis.weaknesses.includes('weakFoot') ? "Dedicate 15 minutes per session to weak foot practice" : null,
      positionSpecificDrills: `Focus on ${analysis.position}-specific movements and positioning`,
      isActive: true,
      isAccepted: false,
      completionProgress: 0,
    };
  }
}

// Save recommendation to database
export async function saveAIRecommendation(recommendation: InsertAITrainingRecommendation) {
  const db = (await getDb())!;
  if (!db) return null;

  const result = await db.insert(aiTrainingRecommendations).values(recommendation);
  return result;
}

// Get latest recommendation for a player
export async function getLatestRecommendation(playerId: number) {
  const db = (await getDb())!;
  if (!db) return null;

  const [recommendation] = await db
    .select()
    .from(aiTrainingRecommendations)
    .where(eq(aiTrainingRecommendations.playerId, playerId))
    .orderBy(desc(aiTrainingRecommendations.generatedDate))
    .limit(1);

  return recommendation;
}

// Get all recommendations for a player
export async function getPlayerRecommendations(playerId: number) {
  const db = (await getDb())!;
  if (!db) return [];

  return db
    .select()
    .from(aiTrainingRecommendations)
    .where(eq(aiTrainingRecommendations.playerId, playerId))
    .orderBy(desc(aiTrainingRecommendations.generatedDate));
}

// Update recommendation progress
export async function updateRecommendationProgress(recommendationId: number, progress: number) {
  const db = (await getDb())!;
  if (!db) return;

  await db
    .update(aiTrainingRecommendations)
    .set({ completionProgress: progress })
    .where(eq(aiTrainingRecommendations.id, recommendationId));
}

// Accept recommendation
export async function acceptRecommendation(recommendationId: number) {
  const db = (await getDb())!;
  if (!db) return;

  await db
    .update(aiTrainingRecommendations)
    .set({ isAccepted: true, acceptedAt: new Date() })
    .where(eq(aiTrainingRecommendations.id, recommendationId));
}
