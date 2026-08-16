import { extractJSON } from './_core/llm';
import { invokeLLM } from "./_core/llm";

interface DetectedShot {
  timestamp: number;
  x: number;
  y: number;
  outcome: "goal" | "miss" | "saved";
  bodyPart: "foot" | "head" | "other";
  assistType: "open_play" | "corner" | "free_kick" | "through_ball" | "cross";
  xG: number;
  confidence: number;
}

interface DetectedPass {
  timestamp: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  completed: boolean;
  xA: number;
  confidence: number;
}

interface DetectedDefensiveAction {
  timestamp: number;
  x: number;
  y: number;
  actionType: "tackle" | "interception" | "block" | "clearance";
  success: boolean;
  confidence: number;
}

interface VideoEventDetectionResult {
  shots: DetectedShot[];
  passes: DetectedPass[];
  defensiveActions: DetectedDefensiveAction[];
  summary: {
    totalShots: number;
    totalGoals: number;
    totalPasses: number;
    passAccuracy: number;
    totalDefensiveActions: number;
  };
}

/**
 * Detect match events from video using AI vision analysis
 * @param videoUrl URL of the match video
 * @param teamName Name of the team to focus analysis on
 * @returns Detected events with timestamps and locations
 */
export async function detectEventsFromVideo(
  videoUrl: string,
  teamName: string = "Home Team"
): Promise<VideoEventDetectionResult> {
  try {
    // Use LLM with vision to analyze video frames
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are an expert football match analyst. Analyze the video and detect all match events including shots, passes, and defensive actions. 
          
For each event, provide:
- Timestamp (in seconds)
- Location on pitch (x, y coordinates as percentages, where 0,0 is top-left, 100,100 is bottom-right)
- Event details (outcome, body part, completion status, etc.)
- Confidence score (0-1)

Focus on ${teamName}'s actions.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this football match video and detect all shots, passes, and defensive actions. Return the data in JSON format.`,
            },
            {
              type: "file_url",
              file_url: {
                url: videoUrl,
                mime_type: "video/mp4",
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "match_events",
          strict: true,
          schema: {
            type: "object",
            properties: {
              shots: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    timestamp: { type: "number" },
                    x: { type: "number" },
                    y: { type: "number" },
                    outcome: { type: "string", enum: ["goal", "miss", "saved"] },
                    bodyPart: { type: "string", enum: ["foot", "head", "other"] },
                    assistType: { type: "string", enum: ["open_play", "corner", "free_kick", "through_ball", "cross"] },
                    confidence: { type: "number" },
                  },
                  required: ["timestamp", "x", "y", "outcome", "bodyPart", "assistType", "confidence"],
                  additionalProperties: false,
                },
              },
              passes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    timestamp: { type: "number" },
                    startX: { type: "number" },
                    startY: { type: "number" },
                    endX: { type: "number" },
                    endY: { type: "number" },
                    completed: { type: "boolean" },
                    confidence: { type: "number" },
                  },
                  required: ["timestamp", "startX", "startY", "endX", "endY", "completed", "confidence"],
                  additionalProperties: false,
                },
              },
              defensiveActions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    timestamp: { type: "number" },
                    x: { type: "number" },
                    y: { type: "number" },
                    actionType: { type: "string", enum: ["tackle", "interception", "block", "clearance"] },
                    success: { type: "boolean" },
                    confidence: { type: "number" },
                  },
                  required: ["timestamp", "x", "y", "actionType", "success", "confidence"],
                  additionalProperties: false,
                },
              },
            },
            required: ["shots", "passes", "defensiveActions"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const detectedEvents = (typeof content === "string" ? extractJSON(content) : content) as any;

    // Calculate xG and xA for detected events
    const shotsWithXG: DetectedShot[] = detectedEvents.shots.map((shot: any) => ({
      ...shot,
      xG: calculateXG(shot.x, shot.y, shot.outcome, shot.bodyPart),
    }));

    const passesWithXA: DetectedPass[] = detectedEvents.passes.map((pass: any) => ({
      ...pass,
      xA: calculateXA(pass.startX, pass.startY, pass.endX, pass.endY, pass.completed),
    }));

    // Calculate summary statistics
    const totalGoals = shotsWithXG.filter((s) => s.outcome === "goal").length;
    const completedPasses = passesWithXA.filter((p) => p.completed).length;
    const passAccuracy = passesWithXA.length > 0 ? (completedPasses / passesWithXA.length) * 100 : 0;

    return {
      shots: shotsWithXG,
      passes: passesWithXA,
      defensiveActions: detectedEvents.defensiveActions,
      summary: {
        totalShots: shotsWithXG.length,
        totalGoals,
        totalPasses: passesWithXA.length,
        passAccuracy,
        totalDefensiveActions: detectedEvents.defensiveActions.length,
      },
    };
  } catch (error) {
    console.error("Error detecting events from video:", error);
    
    // Fallback: Return empty result
    return {
      shots: [],
      passes: [],
      defensiveActions: [],
      summary: {
        totalShots: 0,
        totalGoals: 0,
        totalPasses: 0,
        passAccuracy: 0,
        totalDefensiveActions: 0,
      },
    };
  }
}

function calculateXG(x: number, y: number, outcome: string, bodyPart: string): number {
  const goalX = 100;
  const goalY = 50;
  const distance = Math.sqrt(Math.pow(goalX - x, 2) + Math.pow(goalY - y, 2));
  
  let baseXG = Math.max(0, 1 - (distance / 100));
  
  if (bodyPart === "head") baseXG *= 0.7;
  if (bodyPart === "other") baseXG *= 0.5;
  
  if (outcome === "goal") baseXG = Math.max(baseXG, 0.3);
  
  return Math.min(1, Math.max(0, baseXG));
}

function calculateXA(startX: number, startY: number, endX: number, endY: number, completed: boolean): number {
  const goalX = 100;
  const goalY = 50;
  const distanceToGoal = Math.sqrt(Math.pow(goalX - endX, 2) + Math.pow(goalY - endY, 2));
  
  let baseXA = Math.max(0, 1 - (distanceToGoal / 80));
  
  if (!completed) baseXA = 0;
  
  return Math.min(0.8, Math.max(0, baseXA));
}
