// Comprehensive AI Service for Football Academy Platform
// Provides intelligent analysis, predictions, recommendations, and insights

import { invokeLLM } from "./_core/llm";
import type { Message } from "./_core/llm";
import * as aiCache from "./aiCacheService";

// ==================== AI CONFIGURATION ====================

const AI_CONFIG = {
  temperature: 0.7,
  maxTokens: 2000,
  defaultModel: "gpt-4o-mini", // Uses platform default
};

// ==================== AI CONTEXT MANAGEMENT ====================

interface AIContext {
  userId: number;
  userRole: string;
  conversationHistory: Message[];
  platformData?: any;
}

const contextStore = new Map<string, AIContext>();

export function createAIContext(userId: number, userRole: string): string {
  const contextId = `${userId}-${Date.now()}`;
  contextStore.set(contextId, {
    userId,
    userRole,
    conversationHistory: [],
  });
  return contextId;
}

export function getAIContext(contextId: string): AIContext | undefined {
  return contextStore.get(contextId);
}

export function updateAIContext(contextId: string, message: Message) {
  const context = contextStore.get(contextId);
  if (context) {
    context.conversationHistory.push(message);
    // Keep only last 10 messages for context window
    if (context.conversationHistory.length > 10) {
      context.conversationHistory = context.conversationHistory.slice(-10);
    }
  }
}

export function clearAIContext(contextId: string) {
  contextStore.delete(contextId);
}

// ==================== AI PLAYER ANALYSIS ====================

export async function analyzePlayerPerformance(playerData: {
  name: string;
  position: string;
  recentStats: any[];
  age: number;
  ageGroup: string;
}) {
  // Check cache first
  const cached = await aiCache.getCachedResponse('playerAnalysis', playerData);
  if (cached) return cached;
  const prompt = `You are an expert football coach analyzing player performance.

Player: ${playerData.name}
Position: ${playerData.position}
Age: ${playerData.age} (${playerData.ageGroup})

Recent Performance Data:
${JSON.stringify(playerData.recentStats, null, 2)}

Provide a comprehensive analysis including:
1. **Overall Performance Rating** (1-10 with explanation)
2. **Key Strengths** (3-5 specific strengths with examples)
3. **Areas for Improvement** (3-5 specific weaknesses)
4. **Development Recommendations** (actionable steps)
5. **Position Suitability** (is this the best position?)
6. **Comparison to Age Group Standards** (above/at/below average)
7. **Injury Risk Assessment** (based on workload patterns)
8. **Next Steps** (immediate focus areas)

Be specific, data-driven, and constructive. Use football terminology appropriately.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert football coach and performance analyst." },
      { role: "user", content: prompt }
    ],
  });

  const result = (typeof response.choices[0].message.content === "string" ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || "Unable to generate analysis.";
  await aiCache.setCachedResponse('playerAnalysis', playerData, result);
  return result;
}

export async function predictInjuryRisk(playerData: {
  name: string;
  recentWorkload: any[];
  injuryHistory: any[];
  age: number;
}) {
  const cached = await aiCache.getCachedResponse('injuryPrediction', playerData);
  if (cached) return cached;
  const prompt = `Analyze injury risk for player: ${playerData.name}

Recent Workload (last 4 weeks):
${JSON.stringify(playerData.recentWorkload, null, 2)}

Injury History:
${JSON.stringify(playerData.injuryHistory, null, 2)}

Age: ${playerData.age}

Provide:
1. **Injury Risk Level** (Low/Medium/High with percentage)
2. **Risk Factors** (specific concerns from data)
3. **Warning Signs** (patterns indicating elevated risk)
4. **Prevention Recommendations** (specific actions)
5. **Load Management Suggestions** (training adjustments)
6. **Recovery Protocols** (rest and recovery needs)

Be conservative and prioritize player safety.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a sports medicine expert specializing in injury prevention." },
      { role: "user", content: prompt }
    ], // Lower temperature for medical advice
  });

  const result = (typeof response.choices[0].message.content === "string" ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || "Unable to predict injury risk.";
  await aiCache.setCachedResponse('injuryPrediction', playerData, result);
  return result;
}

export async function recommendOptimalPosition(playerData: {
  name: string;
  currentPosition: string;
  skillScores: Record<string, number>;
  physicalAttributes: any;
  playingStyle: string;
}) {
  const cached = await aiCache.getCachedResponse('playerAnalysis', playerData);
  if (cached) return cached;
  const prompt = `Analyze optimal position for: ${playerData.name}

Current Position: ${playerData.currentPosition}

Skill Scores (1-10):
${JSON.stringify(playerData.skillScores, null, 2)}

Physical Attributes:
${JSON.stringify(playerData.physicalAttributes, null, 2)}

Playing Style: ${playerData.playingStyle}

Provide:
1. **Recommended Primary Position** (with confidence %)
2. **Alternative Positions** (2-3 options with rationale)
3. **Position-Specific Strengths** (why they suit this position)
4. **Skills to Develop** (for optimal performance in recommended position)
5. **Tactical Role** (specific role within position)
6. **Comparison to Professional Players** (similar player archetypes)

Be specific about tactical roles (e.g., "box-to-box midfielder" not just "midfielder").`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a tactical analyst and player development expert." },
      { role: "user", content: prompt }
    ],
  });

  const result = (typeof response.choices[0].message.content === "string" ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || "Unable to recommend position.";
  await aiCache.setCachedResponse('playerAnalysis', playerData, result);
  return result;
}

// ==================== AI TRAINING RECOMMENDATIONS ====================

export async function generateTrainingPlan(playerData: {
  name: string;
  position: string;
  weaknesses: string[];
  strengths: string[];
  availableTime: number; // hours per week
  ageGroup: string;
}) {
  const cached = await aiCache.getCachedResponse('trainingPlan', playerData);
  if (cached) return cached;
  const prompt = `Create a personalized training plan for: ${playerData.name}

Position: ${playerData.position}
Age Group: ${playerData.ageGroup}
Available Training Time: ${playerData.availableTime} hours/week

Strengths: ${playerData.strengths.join(", ")}
Weaknesses: ${playerData.weaknesses.join(", ")}

Create a 4-week training plan with:
1. **Weekly Structure** (breakdown of training types)
2. **Specific Drills** (name, duration, focus area, progression)
3. **Technical Focus** (skills to develop)
4. **Physical Conditioning** (fitness components)
5. **Tactical Understanding** (game intelligence)
6. **Progress Milestones** (measurable goals)
7. **Recovery Schedule** (rest days and active recovery)

Focus on addressing weaknesses while maintaining strengths. Include specific drill names and descriptions.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an expert football coach specializing in player development." },
      { role: "user", content: prompt }
    ],
  });

  const result = (typeof response.choices[0].message.content === "string" ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || "Unable to generate training plan.";
  await aiCache.setCachedResponse('trainingPlan', playerData, result);
  return result;
}

export async function recommendDrills(focusArea: string, ageGroup: string, skillLevel: string) {
  const params = { focusArea, ageGroup, skillLevel };
  const cached = await aiCache.getCachedResponse('trainingPlan', params);
  if (cached) return cached;
  const prompt = `Recommend specific football drills for:

Focus Area: ${focusArea}
Age Group: ${ageGroup}
Skill Level: ${skillLevel}

Provide 5-7 drills with:
1. **Drill Name**
2. **Setup** (equipment, space, players needed)
3. **Instructions** (step-by-step)
4. **Duration** (recommended time)
5. **Progressions** (how to make it harder)
6. **Regressions** (how to make it easier)
7. **Key Coaching Points** (what to emphasize)
8. **Common Mistakes** (what to avoid)

Make drills age-appropriate and engaging.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a professional football coach with expertise in training methodologies." },
      { role: "user", content: prompt }
    ],
  });

  const result = (typeof response.choices[0].message.content === "string" ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || "Unable to recommend drills.";
  await aiCache.setCachedResponse('trainingPlan', params, result);
  return result;
}

// ==================== AI TACTICAL INTELLIGENCE ====================

export async function generateMatchStrategy(matchData: {
  ourTeam: any;
  opponentTeam: any;
  matchImportance: string;
  conditions: string;
}) {
  const cached = await aiCache.getCachedResponse('matchStrategy', matchData);
  if (cached) return cached;
  const prompt = `Create a match strategy:

Our Team:
${JSON.stringify(matchData.ourTeam, null, 2)}

Opponent Team:
${JSON.stringify(matchData.opponentTeam, null, 2)}

Match Importance: ${matchData.matchImportance}
Conditions: ${matchData.conditions}

Provide:
1. **Recommended Formation** (with rationale)
2. **Tactical Approach** (attacking/defensive/balanced)
3. **Key Matchups** (player vs player battles)
4. **Set Piece Strategy** (corners, free kicks)
5. **In-Game Adjustments** (if winning/losing/drawing)
6. **Substitution Plan** (when and who)
7. **Opposition Weaknesses to Exploit**
8. **Our Vulnerabilities to Protect**
9. **Motivational Key Messages** (pre-match talk points)

Be tactical and specific.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a professional football tactical analyst and match strategist." },
      { role: "user", content: prompt }
    ],
  });

  const result = (typeof response.choices[0].message.content === "string" ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || "Unable to generate match strategy.";
  await aiCache.setCachedResponse('matchStrategy', matchData, result);
  return result;
}

export async function analyzeOpponent(opponentData: {
  teamName: string;
  recentMatches: any[];
  keyPlayers: any[];
  formation: string;
}) {
  const cached = await aiCache.getCachedResponse('opponentAnalysis', opponentData);
  if (cached) return cached;
  const prompt = `Analyze opponent team: ${opponentData.teamName}

Formation: ${opponentData.formation}

Recent Matches:
${JSON.stringify(opponentData.recentMatches, null, 2)}

Key Players:
${JSON.stringify(opponentData.keyPlayers, null, 2)}

Provide:
1. **Playing Style** (how they play)
2. **Strengths** (what they do well)
3. **Weaknesses** (vulnerabilities to exploit)
4. **Key Players to Watch** (danger men)
5. **Tactical Patterns** (common strategies)
6. **Set Piece Threats** (corners, free kicks)
7. **Defensive Vulnerabilities** (how to attack them)
8. **Counter-Attack Strategy** (how to defend against them)
9. **Recommended Approach** (how to beat them)

Be detailed and tactical.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a professional football scout and opposition analyst." },
      { role: "user", content: prompt }
    ],
  });

  const result = (typeof response.choices[0].message.content === "string" ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || "Unable to analyze opponent.";
  await aiCache.setCachedResponse('opponentAnalysis', opponentData, result);
  return result;
}

// ==================== AI PARENT COMMUNICATION ====================

export async function generateParentReport(playerData: {
  name: string;
  period: string;
  performance: any;
  attendance: any;
  behavior: any;
  development: any;
}) {
  const cached = await aiCache.getCachedResponse('parentReport', playerData);
  if (cached) return cached;
  const prompt = `Create a parent progress report for: ${playerData.name}

Period: ${playerData.period}

Performance Summary:
${JSON.stringify(playerData.performance, null, 2)}

Attendance: ${JSON.stringify(playerData.attendance, null, 2)}
Behavior: ${JSON.stringify(playerData.behavior, null, 2)}
Development: ${JSON.stringify(playerData.development, null, 2)}

Write a positive, encouraging report that includes:
1. **Opening** (warm greeting)
2. **Performance Highlights** (achievements and progress)
3. **Technical Development** (skills improved)
4. **Tactical Understanding** (game intelligence growth)
5. **Physical Development** (fitness and athleticism)
6. **Social/Behavioral** (teamwork, attitude, leadership)
7. **Areas for Growth** (constructive, not negative)
8. **Next Steps** (what to focus on)
9. **Home Practice Suggestions** (what parents can help with)
10. **Closing** (encouraging message)

Tone: Professional, warm, encouraging, specific. Avoid generic statements.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an experienced youth football coach writing to parents." },
      { role: "user", content: prompt }
    ], // Slightly higher for more natural writing
  });

  const result = (typeof response.choices[0].message.content === "string" ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || "Unable to generate parent report.";
  await aiCache.setCachedResponse('parentReport', playerData, result);
  return result;
}

export async function draftCoachMessage(context: {
  purpose: string;
  recipient: string;
  keyPoints: string[];
  tone: string;
}) {
  const prompt = `Draft a message for a coach:

Purpose: ${context.purpose}
Recipient: ${context.recipient}
Tone: ${context.tone}

Key Points to Include:
${context.keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Write a clear, professional message that:
- Opens appropriately
- Covers all key points naturally
- Maintains the requested tone
- Closes with clear next steps or call-to-action
- Is concise but complete

Keep it under 200 words unless more detail is necessary.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a communication assistant helping coaches write effective messages." },
      { role: "user", content: prompt }
    ],
  });

  return response.choices[0].message.content;
}

// ==================== AI NUTRITION & WELLNESS ====================

export async function generateMealPlan(playerData: {
  name: string;
  age: number;
  weight: number;
  height: number;
  activityLevel: string;
  goals: string[];
  dietaryRestrictions: string[];
}) {
  const cached = await aiCache.getCachedResponse('nutritionPlan', playerData);
  if (cached) return cached;
  const prompt = `Create a nutrition plan for young athlete: ${playerData.name}

Age: ${playerData.age}
Weight: ${playerData.weight}kg
Height: ${playerData.height}cm
Activity Level: ${playerData.activityLevel}
Goals: ${playerData.goals.join(", ")}
Dietary Restrictions: ${playerData.dietaryRestrictions.join(", ")}

Provide:
1. **Daily Calorie Target** (with macronutrient breakdown)
2. **Sample Meal Plan** (breakfast, lunch, dinner, snacks)
3. **Pre-Training Nutrition** (what to eat before sessions)
4. **Post-Training Nutrition** (recovery meals)
5. **Match Day Nutrition** (pre-match, half-time, post-match)
6. **Hydration Guidelines** (daily water intake)
7. **Supplement Recommendations** (if any, age-appropriate)
8. **Foods to Emphasize** (performance-enhancing foods)
9. **Foods to Limit** (performance-hindering foods)
10. **Practical Tips** (meal prep, timing, portions)

Keep recommendations age-appropriate, realistic, and family-friendly.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a sports nutritionist specializing in youth athletes." },
      { role: "user", content: prompt }
    ],
  });

  const result = (typeof response.choices[0].message.content === "string" ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || "Unable to generate meal plan.";
  await aiCache.setCachedResponse('nutritionPlan', playerData, result);
  return result;
}

// ==================== AI VIDEO ANALYSIS ====================

export async function generateVideoInsights(videoData: {
  playerName: string;
  matchOrTraining: string;
  keyMoments: any[];
  focus: string;
}) {
  const cached = await aiCache.getCachedResponse('videoAnalysis', videoData);
  if (cached) return cached;
  const prompt = `Analyze video performance for: ${videoData.playerName}

Type: ${videoData.matchOrTraining}
Focus: ${videoData.focus}

Key Moments Captured:
${JSON.stringify(videoData.keyMoments, null, 2)}

Provide:
1. **Performance Summary** (overall assessment)
2. **Technical Analysis** (ball control, passing, shooting, etc.)
3. **Tactical Analysis** (positioning, decision-making, awareness)
4. **Physical Analysis** (movement, speed, stamina)
5. **Positive Highlights** (what they did well - be specific with timestamps)
6. **Improvement Areas** (what to work on - be constructive)
7. **Coaching Points** (specific feedback for player)
8. **Drill Recommendations** (to address weaknesses seen)

Reference specific moments by timestamp when possible.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a video analyst specializing in football performance analysis." },
      { role: "user", content: prompt }
    ],
  });

  const result = (typeof response.choices[0].message.content === "string" ? response.choices[0].message.content : JSON.stringify(response.choices[0].message.content)) || "Unable to generate video insights.";
  await aiCache.setCachedResponse('videoAnalysis', videoData, result);
  return result;
}

// ==================== AI MATCH ANALYSIS ====================

export async function generateMatchReport(matchData: {
  homeTeam: string;
  awayTeam: string;
  score: string;
  playerStats: any[];
  keyEvents: any[];
  formation: string;
}) {
  const prompt = `Create a comprehensive match report:

${matchData.homeTeam} ${matchData.score} ${matchData.awayTeam}
Formation: ${matchData.formation}

Player Statistics:
${JSON.stringify(matchData.playerStats, null, 2)}

Key Events:
${JSON.stringify(matchData.keyEvents, null, 2)}

Provide:
1. **Match Summary** (narrative overview)
2. **Tactical Analysis** (formation effectiveness, tactical approach)
3. **Key Moments** (turning points in the match)
4. **Player Ratings** (top 3 performers with explanations)
5. **Team Performance** (strengths and weaknesses shown)
6. **Opposition Analysis** (what we learned about them)
7. **Areas for Improvement** (constructive feedback)
8. **Positive Takeaways** (what to build on)
9. **Training Focus** (what to work on this week)

Write in a professional, analytical style.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a professional football match analyst and reporter." },
      { role: "user", content: prompt }
    ],
  });

  return response.choices[0].message.content;
}

// ==================== AI CHAT ASSISTANT ====================

export async function chatWithAI(params: {
  userMessage: string;
  contextId?: string;
  userRole: string;
  currentPage?: string;
  relevantData?: any;
}) {
  let messages: Message[] = [
    {
      role: "system",
      content: `You are an intelligent AI assistant for a football academy platform.

User Role: ${params.userRole}
Current Page: ${params.currentPage || "Unknown"}

You help with:
- Player performance analysis
- Training recommendations
- Tactical advice
- Match strategy
- Nutrition guidance
- Parent communication
- Administrative tasks
- Data insights
- General football knowledge

Be helpful, specific, and actionable. Use data when provided. Adapt your language to the user's role.`
    }
  ];

  // Add conversation history if context exists
  if (params.contextId) {
    const context = getAIContext(params.contextId);
    if (context) {
      messages = [...messages, ...context.conversationHistory];
    }
  }

  // Add relevant data if provided
  if (params.relevantData) {
    messages.push({
      role: "system",
      content: `Relevant data for context:\n${JSON.stringify(params.relevantData, null, 2)}`
    });
  }

  // Add user message
  messages.push({
    role: "user",
    content: params.userMessage
  });

  const response = await invokeLLM({
    messages,
  });

  const assistantMessage = response.choices[0].message.content;

  // Update context if provided
  if (params.contextId) {
    updateAIContext(params.contextId, { role: "user", content: params.userMessage });
    updateAIContext(params.contextId, { role: "assistant", content: assistantMessage });
  }

  return assistantMessage;
}

// ==================== AI DATA INSIGHTS ====================

export async function generateDataInsights(data: {
  dataType: string;
  dataset: any[];
  timeframe: string;
  focus?: string;
}) {
  const prompt = `Analyze this ${data.dataType} data and provide insights:

Timeframe: ${data.timeframe}
${data.focus ? `Focus: ${data.focus}` : ""}

Dataset:
${JSON.stringify(data.dataset, null, 2)}

Provide:
1. **Key Trends** (patterns over time)
2. **Notable Changes** (significant increases/decreases)
3. **Comparisons** (benchmarks and standards)
4. **Anomalies** (unusual data points)
5. **Correlations** (relationships between metrics)
6. **Predictions** (likely future trends)
7. **Recommendations** (actions based on data)
8. **Visualizations Suggested** (best chart types for this data)

Be data-driven and specific with numbers.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are a data analyst specializing in sports performance analytics." },
      { role: "user", content: prompt }
    ], // Lower for analytical tasks
  });

  return response.choices[0].message.content;
}

// ==================== AI ADMINISTRATIVE ASSISTANCE ====================

export async function optimizeSchedule(scheduleData: {
  activities: any[];
  constraints: string[];
  preferences: string[];
  timeframe: string;
}) {
  const prompt = `Optimize this schedule:

Timeframe: ${scheduleData.timeframe}

Activities to Schedule:
${JSON.stringify(scheduleData.activities, null, 2)}

Constraints:
${scheduleData.constraints.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Preferences:
${scheduleData.preferences.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Provide:
1. **Optimized Schedule** (day-by-day breakdown)
2. **Rationale** (why this schedule works)
3. **Conflict Resolution** (how constraints were handled)
4. **Alternative Options** (2-3 backup schedules)
5. **Efficiency Gains** (improvements over current schedule)
6. **Recommendations** (further optimizations)

Consider travel time, recovery needs, and facility availability.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: "You are an operations specialist focusing on scheduling optimization." },
      { role: "user", content: prompt }
    ],
  });

  return response.choices[0].message.content;
}

// ==================== EXPORT ALL FUNCTIONS ====================

export const AIService = {
  // Context Management
  createAIContext,
  getAIContext,
  updateAIContext,
  clearAIContext,
  
  // Player Analysis
  analyzePlayerPerformance,
  predictInjuryRisk,
  recommendOptimalPosition,
  
  // Training
  generateTrainingPlan,
  recommendDrills,
  
  // Tactical
  generateMatchStrategy,
  analyzeOpponent,
  
  // Communication
  generateParentReport,
  draftCoachMessage,
  
  // Nutrition
  generateMealPlan,
  
  // Video
  generateVideoInsights,
  
  // Match
  generateMatchReport,
  
  // Chat
  chatWithAI,
  
  // Data
  generateDataInsights,
  
  // Admin
  optimizeSchedule,
};
