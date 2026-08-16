import { invokeLLM } from "./_core/llm";
import { extractFrameTimestamps, storeFrame, parseVideoMetadata, VideoMetadata } from "./videoFrameExtractor";

interface RealVideoAnalysisInput {
  videoUrl: string;
  frames: string[]; // Array of base64 encoded frame images
  playerName?: string;
  teamColor?: string;
  videoType?: string;
  metadata?: Partial<VideoMetadata>;
}

interface FrameAnalysis {
  frameIndex: number;
  timestamp: number;
  observations: string[];
  playerActions: string[];
  technicalNotes: string[];
  tacticalNotes: string[];
}

interface RealVideoAnalysisResult {
  analysisId: string;
  overallScore: number;
  frameAnalyses: FrameAnalysis[];
  aggregatedInsights: {
    movementPatterns: string[];
    technicalStrengths: string[];
    technicalWeaknesses: string[];
    tacticalObservations: string[];
    bodyPositioning: string[];
    ballHandling: string[];
  };
  movementAnalysis: {
    totalDistance: number;
    maxSpeed: number;
    avgSpeed: number;
    sprintCount: number;
    highIntensityRuns: number;
    accelerations: number;
    decelerations: number;
  };
  technicalAnalysis: {
    ballControl: number;
    passing: number;
    passingAccuracy: number;
    shooting: number;
    shootingAccuracy: number;
    dribbling: number;
    firstTouch: number;
    heading: number;
  };
  tacticalAnalysis: {
    positioning: number;
    spaceCreation: number;
    defensiveAwareness: number;
    pressingIntensity: number;
    offTheBallMovement: number;
  };
  strengths: string[];
  strengthsAr: string[];
  improvements: string[];
  improvementsAr: string[];
  drillRecommendations: {
    name: string;
    nameAr: string;
    duration: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    descriptionAr: string;
  }[];
  coachNotes: string;
  coachNotesAr: string;
  heatmapZones: {
    leftWing: number;
    leftMidfield: number;
    center: number;
    rightMidfield: number;
    rightWing: number;
    defensiveThird: number;
    middleThird: number;
    attackingThird: number;
  };
  keyMoments: {
    timestamp: string;
    description: string;
    descriptionAr: string;
    type: 'positive' | 'improvement' | 'highlight';
    frameIndex: number;
  }[];
  playerName?: string;
  teamColor?: string;
  videoType?: string;
  framesAnalyzed: number;
  analysisTimestamp: number;
}

/**
 * Analyze a single video frame using LLM vision capabilities
 */
async function analyzeFrame(
  frameBase64: string,
  frameIndex: number,
  timestamp: number,
  context: {
    playerName?: string;
    teamColor?: string;
    videoType?: string;
  }
): Promise<FrameAnalysis> {
  const systemPrompt = `You are an expert football coach and video analyst. Analyze this video frame from a football training/match session.

Context:
- Player Name: ${context.playerName || 'Unknown'}
- Team Jersey Color: ${context.teamColor || 'Not specified'}
- Video Type: ${context.videoType || 'training'}
- Frame Timestamp: ${timestamp}s

Analyze what you see in this frame and provide detailed observations about:
1. Player positioning and body posture
2. Ball handling technique (if ball is visible)
3. Movement patterns and direction
4. Tactical positioning relative to other players
5. Technical execution of any action being performed

Be specific and detailed in your observations. Focus on actionable coaching insights.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: frameBase64.startsWith('data:') ? frameBase64 : `data:image/jpeg;base64,${frameBase64}`,
                detail: "high"
              }
            },
            {
              type: "text",
              text: "Analyze this football video frame and provide detailed coaching observations."
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "frame_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              observations: {
                type: "array",
                items: { type: "string" },
                description: "General observations about the frame"
              },
              playerActions: {
                type: "array",
                items: { type: "string" },
                description: "Specific actions the player is performing"
              },
              technicalNotes: {
                type: "array",
                items: { type: "string" },
                description: "Technical aspects observed (ball control, passing, shooting, etc.)"
              },
              tacticalNotes: {
                type: "array",
                items: { type: "string" },
                description: "Tactical observations (positioning, movement, awareness)"
              }
            },
            required: ["observations", "playerActions", "technicalNotes", "tacticalNotes"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No analysis content received");
    }

    const analysis = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));

    return {
      frameIndex,
      timestamp,
      observations: analysis.observations || [],
      playerActions: analysis.playerActions || [],
      technicalNotes: analysis.technicalNotes || [],
      tacticalNotes: analysis.tacticalNotes || []
    };
  } catch (error) {
    console.error(`Error analyzing frame ${frameIndex}:`, error);
    // Return empty analysis on error
    return {
      frameIndex,
      timestamp,
      observations: ["Frame analysis unavailable"],
      playerActions: [],
      technicalNotes: [],
      tacticalNotes: []
    };
  }
}

/**
 * Aggregate frame analyses into comprehensive video analysis
 */
async function aggregateAnalyses(
  frameAnalyses: FrameAnalysis[],
  context: {
    playerName?: string;
    teamColor?: string;
    videoType?: string;
    duration?: number;
  }
): Promise<Omit<RealVideoAnalysisResult, 'analysisId' | 'frameAnalyses' | 'framesAnalyzed' | 'analysisTimestamp'>> {
  // Combine all observations from frames
  const allObservations = frameAnalyses.flatMap(f => f.observations);
  const allPlayerActions = frameAnalyses.flatMap(f => f.playerActions);
  const allTechnicalNotes = frameAnalyses.flatMap(f => f.technicalNotes);
  const allTacticalNotes = frameAnalyses.flatMap(f => f.tacticalNotes);

  const aggregationPrompt = `You are an expert football coach. Based on the following observations from analyzing multiple frames of a football video, provide a comprehensive analysis.

Player: ${context.playerName || 'Unknown'}
Team Color: ${context.teamColor || 'Not specified'}
Video Type: ${context.videoType || 'training'}
Video Duration: ${context.duration || 60} seconds
Frames Analyzed: ${frameAnalyses.length}

Frame Observations:
${allObservations.join('\n')}

Player Actions Observed:
${allPlayerActions.join('\n')}

Technical Notes:
${allTechnicalNotes.join('\n')}

Tactical Notes:
${allTacticalNotes.join('\n')}

Based on these real observations from the video, generate a comprehensive coaching analysis with specific, actionable insights.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert football coach providing detailed video analysis. Generate realistic metrics based on the actual observations from the video frames." },
        { role: "user", content: aggregationPrompt }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "aggregated_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              overallScore: { type: "integer", description: "Overall performance score 0-100 based on observations" },
              aggregatedInsights: {
                type: "object",
                properties: {
                  movementPatterns: { type: "array", items: { type: "string" } },
                  technicalStrengths: { type: "array", items: { type: "string" } },
                  technicalWeaknesses: { type: "array", items: { type: "string" } },
                  tacticalObservations: { type: "array", items: { type: "string" } },
                  bodyPositioning: { type: "array", items: { type: "string" } },
                  ballHandling: { type: "array", items: { type: "string" } }
                },
                required: ["movementPatterns", "technicalStrengths", "technicalWeaknesses", "tacticalObservations", "bodyPositioning", "ballHandling"],
                additionalProperties: false
              },
              movementAnalysis: {
                type: "object",
                properties: {
                  totalDistance: { type: "integer" },
                  maxSpeed: { type: "number" },
                  avgSpeed: { type: "number" },
                  sprintCount: { type: "integer" },
                  highIntensityRuns: { type: "integer" },
                  accelerations: { type: "integer" },
                  decelerations: { type: "integer" }
                },
                required: ["totalDistance", "maxSpeed", "avgSpeed", "sprintCount", "highIntensityRuns", "accelerations", "decelerations"],
                additionalProperties: false
              },
              technicalAnalysis: {
                type: "object",
                properties: {
                  ballControl: { type: "integer" },
                  passing: { type: "integer" },
                  passingAccuracy: { type: "integer" },
                  shooting: { type: "integer" },
                  shootingAccuracy: { type: "integer" },
                  dribbling: { type: "integer" },
                  firstTouch: { type: "integer" },
                  heading: { type: "integer" }
                },
                required: ["ballControl", "passing", "passingAccuracy", "shooting", "shootingAccuracy", "dribbling", "firstTouch", "heading"],
                additionalProperties: false
              },
              tacticalAnalysis: {
                type: "object",
                properties: {
                  positioning: { type: "integer" },
                  spaceCreation: { type: "integer" },
                  defensiveAwareness: { type: "integer" },
                  pressingIntensity: { type: "integer" },
                  offTheBallMovement: { type: "integer" }
                },
                required: ["positioning", "spaceCreation", "defensiveAwareness", "pressingIntensity", "offTheBallMovement"],
                additionalProperties: false
              },
              strengths: { type: "array", items: { type: "string" }, description: "3-5 strengths in English" },
              strengthsAr: { type: "array", items: { type: "string" }, description: "3-5 strengths in Arabic" },
              improvements: { type: "array", items: { type: "string" }, description: "3-5 improvements in English" },
              improvementsAr: { type: "array", items: { type: "string" }, description: "3-5 improvements in Arabic" },
              drillRecommendations: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    nameAr: { type: "string" },
                    duration: { type: "string" },
                    priority: { type: "string", enum: ["high", "medium", "low"] },
                    description: { type: "string" },
                    descriptionAr: { type: "string" }
                  },
                  required: ["name", "nameAr", "duration", "priority", "description", "descriptionAr"],
                  additionalProperties: false
                }
              },
              coachNotes: { type: "string", description: "Detailed coach notes in English" },
              coachNotesAr: { type: "string", description: "Detailed coach notes in Arabic" },
              heatmapZones: {
                type: "object",
                properties: {
                  leftWing: { type: "integer" },
                  leftMidfield: { type: "integer" },
                  center: { type: "integer" },
                  rightMidfield: { type: "integer" },
                  rightWing: { type: "integer" },
                  defensiveThird: { type: "integer" },
                  middleThird: { type: "integer" },
                  attackingThird: { type: "integer" }
                },
                required: ["leftWing", "leftMidfield", "center", "rightMidfield", "rightWing", "defensiveThird", "middleThird", "attackingThird"],
                additionalProperties: false
              },
              keyMoments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    timestamp: { type: "string" },
                    description: { type: "string" },
                    descriptionAr: { type: "string" },
                    type: { type: "string", enum: ["positive", "improvement", "highlight"] },
                    frameIndex: { type: "integer" }
                  },
                  required: ["timestamp", "description", "descriptionAr", "type", "frameIndex"],
                  additionalProperties: false
                }
              }
            },
            required: [
              "overallScore", "aggregatedInsights", "movementAnalysis", "technicalAnalysis", "tacticalAnalysis",
              "strengths", "strengthsAr", "improvements", "improvementsAr", "drillRecommendations",
              "coachNotes", "coachNotesAr", "heatmapZones", "keyMoments"
            ],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No aggregation content received");
    }

    const result = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content));
    return {
      ...result,
      playerName: context.playerName,
      teamColor: context.teamColor,
      videoType: context.videoType
    };
  } catch (error) {
    console.error("Error aggregating analyses:", error);
    throw error;
  }
}

/**
 * Main function to perform real video analysis with frame extraction
 */
export async function analyzeVideoWithVision(input: RealVideoAnalysisInput): Promise<RealVideoAnalysisResult> {
  const analysisId = `RVA-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  const metadata = parseVideoMetadata(input.metadata || {});
  
  console.log(`Starting real video analysis ${analysisId} with ${input.frames.length} frames`);

  // Analyze each frame
  const frameTimestamps = await extractFrameTimestamps(metadata.duration, input.frames.length);
  const frameAnalyses: FrameAnalysis[] = [];

  for (let i = 0; i < input.frames.length; i++) {
    console.log(`Analyzing frame ${i + 1}/${input.frames.length}`);
    const analysis = await analyzeFrame(
      input.frames[i],
      i,
      frameTimestamps[i] || (i * (metadata.duration / input.frames.length)),
      {
        playerName: input.playerName,
        teamColor: input.teamColor,
        videoType: input.videoType
      }
    );
    frameAnalyses.push(analysis);
  }

  // Aggregate all frame analyses
  console.log("Aggregating frame analyses...");
  const aggregatedResult = await aggregateAnalyses(frameAnalyses, {
    playerName: input.playerName,
    teamColor: input.teamColor,
    videoType: input.videoType,
    duration: metadata.duration
  });

  return {
    analysisId,
    ...aggregatedResult,
    frameAnalyses,
    framesAnalyzed: input.frames.length,
    analysisTimestamp: Date.now()
  };
}

export type { RealVideoAnalysisInput, RealVideoAnalysisResult, FrameAnalysis };
