import { invokeLLM, extractJSON } from "./_core/llm";

export interface OpponentAnalysisInput {
  opponentName: string;
  videoUrls?: string[];
  previousResults?: string[]; // e.g., ["W 3-1", "L 0-2"]
  knownFormation?: string;
  knownPlayers?: string[];
  additionalNotes?: string;
}

export interface OpponentAnalysisOutput {
  playingStyle: string;
  strengths: string[];
  weaknesses: string[];
  keyPlayers: string[];
  recommendedFormation: string;
  tacticalApproach: string;
  keyFocusAreas: string[];
  playerInstructions: Record<string, string>;
  setPieceStrategy: string;
  predictedOutcome: string;
  confidence: number; // 0-100
}

/**
 * Analyze opponent using AI based on videos and data
 */
export async function analyzeOpponent(
  input: OpponentAnalysisInput
): Promise<OpponentAnalysisOutput> {
  const prompt = `You are an expert football tactical analyst. Analyze the following opponent team and provide detailed tactical insights.

**Opponent:** ${input.opponentName}
**Known Formation:** ${input.knownFormation || "Unknown"}
**Previous Results:** ${input.previousResults?.join(", ") || "No data"}
**Known Players:** ${input.knownPlayers?.join(", ") || "No data"}
**Additional Notes:** ${input.additionalNotes || "None"}

Based on this information, provide a comprehensive tactical analysis in the following JSON format:

{
  "playingStyle": "Detailed description of their playing style (possession-based, counter-attack, high press, etc.)",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "keyPlayers": ["Player 1 - Role/Position", "Player 2 - Role/Position"],
  "recommendedFormation": "Best formation to counter them (e.g., 4-3-3, 4-4-2)",
  "tacticalApproach": "Detailed tactical approach to exploit their weaknesses",
  "keyFocusAreas": ["Focus area 1", "Focus area 2", "Focus area 3"],
  "playerInstructions": {
    "GK": "Goalkeeper instructions",
    "Defense": "Defensive line instructions",
    "Midfield": "Midfield instructions",
    "Attack": "Attacking instructions"
  },
  "setPieceStrategy": "Strategy for corners, free kicks, and set pieces",
  "predictedOutcome": "Predicted match outcome with reasoning",
  "confidence": 75
}

Provide actionable, specific tactical advice that a youth football coach can implement.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert football tactical analyst specializing in youth football. Provide detailed, actionable tactical analysis.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "opponent_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              playingStyle: { type: "string" },
              strengths: {
                type: "array",
                items: { type: "string" },
              },
              weaknesses: {
                type: "array",
                items: { type: "string" },
              },
              keyPlayers: {
                type: "array",
                items: { type: "string" },
              },
              recommendedFormation: { type: "string" },
              tacticalApproach: { type: "string" },
              keyFocusAreas: {
                type: "array",
                items: { type: "string" },
              },
              playerInstructions: {
                type: "object",
                properties: {
                  GK: { type: "string" },
                  Defense: { type: "string" },
                  Midfield: { type: "string" },
                  Attack: { type: "string" },
                },
                required: ["GK", "Defense", "Midfield", "Attack"],
                additionalProperties: false,
              },
              setPieceStrategy: { type: "string" },
              predictedOutcome: { type: "string" },
              confidence: { type: "integer" },
            },
            required: [
              "playingStyle",
              "strengths",
              "weaknesses",
              "keyPlayers",
              "recommendedFormation",
              "tacticalApproach",
              "keyFocusAreas",
              "playerInstructions",
              "setPieceStrategy",
              "predictedOutcome",
              "confidence",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    return extractJSON<OpponentAnalysisOutput>(content as string);
  } catch (error) {
    console.error("Error analyzing opponent:", error);
    throw new Error("Failed to analyze opponent");
  }
}

/**
 * Analyze team performance using AI
 */
export async function analyzeTeamPerformance(input: {
  teamName: string;
  recentMatches: Array<{
    opponent: string;
    result: string;
    goalsFor: number;
    goalsAgainst: number;
    possession?: number;
    shots?: number;
    passAccuracy?: number;
  }>;
  playerStats?: Array<{
    name: string;
    position: string;
    goals: number;
    assists: number;
    rating: number;
  }>;
}): Promise<{
  overallAssessment: string;
  strengths: string[];
  weaknesses: string[];
  trainingFocus: string[];
  tacticalRecommendations: string[];
  playerDevelopmentPriorities: string[];
}> {
  const prompt = `You are an expert football performance analyst. Analyze the following team performance data and provide actionable insights.

**Team:** ${input.teamName}

**Recent Matches:**
${input.recentMatches.map((m) => `- vs ${m.opponent}: ${m.result} (${m.goalsFor}-${m.goalsAgainst})`).join("\n")}

**Player Statistics:**
${input.playerStats?.map((p) => `- ${p.name} (${p.position}): ${p.goals}G, ${p.assists}A, Rating: ${p.rating}`).join("\n") || "No player data available"}

Provide a comprehensive performance analysis in JSON format with:
- Overall assessment of team performance
- Key strengths to maintain
- Weaknesses to address
- Training focus areas
- Tactical recommendations
- Player development priorities`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert football performance analyst specializing in youth development.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "performance_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallAssessment: { type: "string" },
              strengths: { type: "array", items: { type: "string" } },
              weaknesses: { type: "array", items: { type: "string" } },
              trainingFocus: { type: "array", items: { type: "string" } },
              tacticalRecommendations: { type: "array", items: { type: "string" } },
              playerDevelopmentPriorities: { type: "array", items: { type: "string" } },
            },
            required: [
              "overallAssessment",
              "strengths",
              "weaknesses",
              "trainingFocus",
              "tacticalRecommendations",
              "playerDevelopmentPriorities",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    return extractJSON(content as string);
  } catch (error) {
    console.error("Error analyzing team performance:", error);
    throw new Error("Failed to analyze team performance");
  }
}
