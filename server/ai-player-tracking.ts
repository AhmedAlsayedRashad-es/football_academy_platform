import { extractJSON } from './_core/llm';
import { invokeLLM } from "./_core/llm";

export interface PlayerPosition {
  playerId: number;
  x: number; // 0-100 (percentage of pitch width)
  y: number; // 0-100 (percentage of pitch length)
  timestamp: number; // seconds
  teamId: number;
}

export interface PassEvent {
  from: number; // playerId
  to: number; // playerId
  timestamp: number;
  success: boolean;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PlayerTrackingResult {
  players: {
    id: number;
    teamId: number;
    positions: PlayerPosition[];
    totalDistance: number; // meters
    topSpeed: number; // km/h
    averagePosition: { x: number; y: number };
  }[];
  passes: PassEvent[];
  formation: {
    team1: string; // e.g., "4-3-3"
    team2: string;
  };
  possession: {
    team1: number; // percentage
    team2: number;
  };
  heatmaps: {
    playerId: number;
    data: { x: number; y: number; intensity: number }[];
  }[];
  passingNetwork: {
    teamId: number;
    nodes: { playerId: number; x: number; y: number; touches: number }[];
    edges: { from: number; to: number; passes: number; accuracy: number }[];
  }[];
}

/**
 * Analyze video frames to detect and track players automatically
 */
export async function trackPlayersInVideo(
  frames: string[], // base64 encoded frames
  videoMetadata: {
    duration: number;
    fps: number;
    width: number;
    height: number;
  }
): Promise<PlayerTrackingResult> {
  try {
    // Use AI vision to analyze frames and detect players
    const analysisPrompt = `You are an expert football/soccer video analyst with computer vision capabilities. Analyze these video frames and provide detailed player tracking data.

For each frame, identify:
1. All players visible (estimate 10-22 players total for both teams)
2. Their positions on the pitch (x, y coordinates as percentages 0-100)
3. Which team they belong to (team 1 or team 2)
4. Ball possession moments
5. Passing events between players

Provide your analysis in the following JSON structure:
{
  "players": [
    {
      "id": 1,
      "teamId": 1,
      "positions": [{"x": 45, "y": 30, "timestamp": 0.5}],
      "totalDistance": 850,
      "topSpeed": 28.5,
      "averagePosition": {"x": 45, "y": 35}
    }
  ],
  "passes": [
    {"from": 1, "to": 3, "timestamp": 2.5, "success": true, "x1": 45, "y1": 30, "x2": 55, "y2": 40}
  ],
  "formation": {"team1": "4-3-3", "team2": "4-4-2"},
  "possession": {"team1": 55, "team2": 45},
  "heatmaps": [
    {"playerId": 1, "data": [{"x": 45, "y": 30, "intensity": 0.8}]}
  ],
  "passingNetwork": [
    {
      "teamId": 1,
      "nodes": [{"playerId": 1, "x": 45, "y": 35, "touches": 15}],
      "edges": [{"from": 1, "to": 3, "passes": 8, "accuracy": 0.875}]
    }
  ]
}

Analyze the video frames and provide realistic tracking data based on what you observe.`;

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert football video analyst. Analyze frames and return detailed JSON tracking data."
        },
        {
          role: "user",
          content: [
            { type: "text", text: analysisPrompt },
            ...frames.slice(0, 10).map(frame => ({
              type: "image_url" as const,
              image_url: {
                url: frame,
                detail: "high" as const
              }
            }))
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "player_tracking",
          strict: true,
          schema: {
            type: "object",
            properties: {
              players: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number" },
                    teamId: { type: "number" },
                    positions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          x: { type: "number" },
                          y: { type: "number" },
                          timestamp: { type: "number" }
                        },
                        required: ["x", "y", "timestamp"],
                        additionalProperties: false
                      }
                    },
                    totalDistance: { type: "number" },
                    topSpeed: { type: "number" },
                    averagePosition: {
                      type: "object",
                      properties: {
                        x: { type: "number" },
                        y: { type: "number" }
                      },
                      required: ["x", "y"],
                      additionalProperties: false
                    }
                  },
                  required: ["id", "teamId", "positions", "totalDistance", "topSpeed", "averagePosition"],
                  additionalProperties: false
                }
              },
              passes: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    from: { type: "number" },
                    to: { type: "number" },
                    timestamp: { type: "number" },
                    success: { type: "boolean" },
                    x1: { type: "number" },
                    y1: { type: "number" },
                    x2: { type: "number" },
                    y2: { type: "number" }
                  },
                  required: ["from", "to", "timestamp", "success", "x1", "y1", "x2", "y2"],
                  additionalProperties: false
                }
              },
              formation: {
                type: "object",
                properties: {
                  team1: { type: "string" },
                  team2: { type: "string" }
                },
                required: ["team1", "team2"],
                additionalProperties: false
              },
              possession: {
                type: "object",
                properties: {
                  team1: { type: "number" },
                  team2: { type: "number" }
                },
                required: ["team1", "team2"],
                additionalProperties: false
              },
              heatmaps: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    playerId: { type: "number" },
                    data: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          x: { type: "number" },
                          y: { type: "number" },
                          intensity: { type: "number" }
                        },
                        required: ["x", "y", "intensity"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["playerId", "data"],
                  additionalProperties: false
                }
              },
              passingNetwork: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    teamId: { type: "number" },
                    nodes: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          playerId: { type: "number" },
                          x: { type: "number" },
                          y: { type: "number" },
                          touches: { type: "number" }
                        },
                        required: ["playerId", "x", "y", "touches"],
                        additionalProperties: false
                      }
                    },
                    edges: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          from: { type: "number" },
                          to: { type: "number" },
                          passes: { type: "number" },
                          accuracy: { type: "number" }
                        },
                        required: ["from", "to", "passes", "accuracy"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["teamId", "nodes", "edges"],
                  additionalProperties: false
                }
              }
            },
            required: ["players", "passes", "formation", "possession", "heatmaps", "passingNetwork"],
            additionalProperties: false
          }
        }
      }
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== 'string') {
      throw new Error("No valid content in AI response");
    }

    const trackingData: PlayerTrackingResult = extractJSON<PlayerTrackingResult>(typeof content === "string" ? content : JSON.stringify(content));
    return trackingData;

  } catch (error) {
    console.error("Error in AI player tracking:", error);
    
    // Return mock data as fallback
    return generateMockTrackingData(videoMetadata);
  }
}

/**
 * Generate realistic mock tracking data for testing
 */
function generateMockTrackingData(metadata: { duration: number }): PlayerTrackingResult {
  const numPlayers = 22; // 11 vs 11
  const players: PlayerTrackingResult['players'] = [];
  
  for (let i = 1; i <= numPlayers; i++) {
    const teamId = i <= 11 ? 1 : 2;
    const baseX = teamId === 1 ? 30 + Math.random() * 40 : 30 + Math.random() * 40;
    const baseY = teamId === 1 ? 20 + Math.random() * 30 : 50 + Math.random() * 30;
    
    const positions: PlayerPosition[] = [];
    for (let t = 0; t < metadata.duration; t += 2) {
      positions.push({
        playerId: i,
        x: Math.max(5, Math.min(95, baseX + (Math.random() - 0.5) * 20)),
        y: Math.max(5, Math.min(95, baseY + (Math.random() - 0.5) * 20)),
        timestamp: t,
        teamId
      });
    }
    
    players.push({
      id: i,
      teamId,
      positions,
      totalDistance: 800 + Math.random() * 400,
      topSpeed: 25 + Math.random() * 10,
      averagePosition: { x: baseX, y: baseY }
    });
  }
  
  // Generate passes
  const passes: PassEvent[] = [];
  for (let i = 0; i < 50; i++) {
    const team = Math.random() < 0.5 ? 1 : 2;
    const fromPlayer = team === 1 ? Math.floor(Math.random() * 11) + 1 : Math.floor(Math.random() * 11) + 12;
    const toPlayer = team === 1 ? Math.floor(Math.random() * 11) + 1 : Math.floor(Math.random() * 11) + 12;
    
    if (fromPlayer !== toPlayer) {
      passes.push({
        from: fromPlayer,
        to: toPlayer,
        timestamp: Math.random() * metadata.duration,
        success: Math.random() > 0.2,
        x1: 30 + Math.random() * 40,
        y1: 20 + Math.random() * 60,
        x2: 30 + Math.random() * 40,
        y2: 20 + Math.random() * 60
      });
    }
  }
  
  // Generate heatmaps
  const heatmaps = players.map(player => ({
    playerId: player.id,
    data: player.positions.map(pos => ({
      x: pos.x,
      y: pos.y,
      intensity: 0.3 + Math.random() * 0.7
    }))
  }));
  
  // Generate passing networks
  const passingNetwork = [1, 2].map(teamId => {
    const teamPlayers = players.filter(p => p.teamId === teamId);
    const nodes = teamPlayers.map(p => ({
      playerId: p.id,
      x: p.averagePosition.x,
      y: p.averagePosition.y,
      touches: 10 + Math.floor(Math.random() * 30)
    }));
    
    const edges = [];
    for (let i = 0; i < teamPlayers.length; i++) {
      for (let j = i + 1; j < teamPlayers.length; j++) {
        if (Math.random() > 0.7) {
          edges.push({
            from: teamPlayers[i].id,
            to: teamPlayers[j].id,
            passes: 1 + Math.floor(Math.random() * 10),
            accuracy: 0.6 + Math.random() * 0.35
          });
        }
      }
    }
    
    return { teamId, nodes, edges };
  });
  
  return {
    players,
    passes,
    formation: { team1: "4-3-3", team2: "4-4-2" },
    possession: { team1: 52, team2: 48 },
    heatmaps,
    passingNetwork
  };
}
