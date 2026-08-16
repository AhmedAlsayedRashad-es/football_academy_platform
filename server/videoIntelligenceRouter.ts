import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { invokeLLM, extractJSON, extractText } from './_core/llm';
import { getDb } from './db';
import { sql } from 'drizzle-orm';

// ── Tactical Data Schema extracted from video analysis ──────────────────────
interface TacticalExtraction {
  teamName: string;
  formation: string;
  avgGoalsScored: number;
  avgGoalsConceded: number;
  pressingIntensity: 'Very High' | 'High' | 'Medium' | 'Low' | 'None';
  defensiveLine: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
  buildupStyle: 'Short Passing' | 'Long Ball' | 'Mixed' | 'Counter-Attack' | 'Possession';
  strengths: string;
  weaknesses: string;
  setPieceStrengths: string;
  setPieceWeaknesses: string;
  keyPlayers: string;
  playingStyle: string;
  // Quantitative factors for simulation
  opponentStrengthFactor: number;   // 0.5 - 1.5 (how strong the opponent is)
  defensiveFactor: number;          // 0.5 - 1.5 (defensive density impact)
  setPieceBonus: number;            // 0 - 0.5 (extra goals from set pieces)
  keyPlayerImpact: number;          // 0.5 - 1.0 (suppression factor for key player)
  // Confidence
  confidence: 'high' | 'medium' | 'low';
  dataSource: string;
  // Pattern analysis
  scoringPatterns: string[];
  defensivePatterns: string[];
  transitionPatterns: string[];
  // Raw analysis text
  rawAnalysis: string;
}

// ── Helper: Build the tactical extraction prompt ─────────────────────────────
function buildTacticalPrompt(videoUrl: string, teamRole: 'our' | 'opponent', additionalContext?: string): string {
  return `You are an elite football tactical analyst. Analyze this match video/footage and extract comprehensive tactical intelligence.

VIDEO URL: ${videoUrl}
TEAM ROLE: ${teamRole === 'our' ? 'OUR TEAM (we want to understand our own strengths)' : 'OPPONENT (we want to scout and find weaknesses to exploit)'}
${additionalContext ? `ADDITIONAL CONTEXT: ${additionalContext}` : ''}

Watch the video carefully and extract the following tactical data. Be precise and data-driven.

Return a JSON object with EXACTLY this structure:
{
  "teamName": "Team name if identifiable, else 'Unknown'",
  "formation": "e.g. 4-3-3",
  "avgGoalsScored": 1.5,
  "avgGoalsConceded": 1.2,
  "pressingIntensity": "High",
  "defensiveLine": "Medium",
  "buildupStyle": "Short Passing",
  "strengths": "Detailed description of tactical strengths observed",
  "weaknesses": "Detailed description of tactical weaknesses and exploitable gaps",
  "setPieceStrengths": "Set piece attacking and defensive strengths",
  "setPieceWeaknesses": "Set piece vulnerabilities",
  "keyPlayers": "Key players and their roles/impact",
  "playingStyle": "Overall playing philosophy and style description",
  "opponentStrengthFactor": 0.85,
  "defensiveFactor": 0.90,
  "setPieceBonus": 0.15,
  "keyPlayerImpact": 0.80,
  "confidence": "high",
  "dataSource": "Video analysis",
  "scoringPatterns": ["Pattern 1", "Pattern 2", "Pattern 3"],
  "defensivePatterns": ["Pattern 1", "Pattern 2"],
  "transitionPatterns": ["Pattern 1", "Pattern 2"],
  "rawAnalysis": "Comprehensive narrative analysis of everything observed"
}

IMPORTANT CALIBRATION NOTES:
- opponentStrengthFactor: 1.0 = average, 0.7 = weak, 1.3 = very strong
- defensiveFactor: 1.0 = average defense, 0.7 = very solid defense, 1.3 = leaky defense
- setPieceBonus: 0 = no set piece threat, 0.3 = significant set piece threat
- keyPlayerImpact: 1.0 = no suppression needed, 0.6 = key player is decisive and must be suppressed
- Be realistic and honest — do not inflate or deflate numbers artificially
- If the video quality or content limits analysis, set confidence to "low" and explain in rawAnalysis`;
}

// ── Helper: Build match comparison prompt ────────────────────────────────────
function buildMatchComparisonPrompt(ourAnalysis: TacticalExtraction, oppAnalysis: TacticalExtraction): string {
  return `You are an elite football tactical analyst. Compare these two teams and provide a comprehensive pre-match intelligence report.

OUR TEAM: ${ourAnalysis.teamName}
- Formation: ${ourAnalysis.formation}
- Style: ${ourAnalysis.playingStyle}
- Strengths: ${ourAnalysis.strengths}
- Weaknesses: ${ourAnalysis.weaknesses}
- λ factor: ${ourAnalysis.defensiveFactor}

OPPONENT: ${oppAnalysis.teamName}
- Formation: ${oppAnalysis.formation}
- Style: ${oppAnalysis.playingStyle}
- Strengths: ${oppAnalysis.strengths}
- Weaknesses: ${oppAnalysis.weaknesses}
- Set Piece Threat: ${oppAnalysis.setPieceStrengths}
- Key Players: ${oppAnalysis.keyPlayers}
- Scoring Patterns: ${oppAnalysis.scoringPatterns.join(', ')}

Provide a detailed pre-match intelligence report with:
1. Formation matchup analysis
2. Five tactical gates to victory (specific and actionable)
3. Key player battles
4. Set piece strategy
5. Pressing triggers and transition opportunities
6. Risk assessment and contingency plans
7. Recommended starting approach

Write like a professional analyst preparing a pre-match dossier for a coach.`;
}

export const videoIntelligenceRouter = router({

  // ── Analyze a single video URL ────────────────────────────────────────────
  analyzeVideo: protectedProcedure
    .input(z.object({
      videoUrl: z.string().url(),
      teamRole: z.enum(['our', 'opponent']),
      additionalContext: z.string().optional(),
      saveAsOpponent: z.boolean().default(false),
      opponentName: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const prompt = buildTacticalPrompt(input.videoUrl, input.teamRole, input.additionalContext);

      // Use Gemini for video analysis (best multimodal model)
      const response = await invokeLLM({
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'file_url',
                file_url: {
                  url: input.videoUrl,
                  mime_type: 'video/mp4',
                },
              },
            ],
          },
        ],
        maxTokens: 8192,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'tactical_extraction',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                teamName: { type: 'string' },
                formation: { type: 'string' },
                avgGoalsScored: { type: 'number' },
                avgGoalsConceded: { type: 'number' },
                pressingIntensity: { type: 'string' },
                defensiveLine: { type: 'string' },
                buildupStyle: { type: 'string' },
                strengths: { type: 'string' },
                weaknesses: { type: 'string' },
                setPieceStrengths: { type: 'string' },
                setPieceWeaknesses: { type: 'string' },
                keyPlayers: { type: 'string' },
                playingStyle: { type: 'string' },
                opponentStrengthFactor: { type: 'number' },
                defensiveFactor: { type: 'number' },
                setPieceBonus: { type: 'number' },
                keyPlayerImpact: { type: 'number' },
                confidence: { type: 'string' },
                dataSource: { type: 'string' },
                scoringPatterns: { type: 'array', items: { type: 'string' } },
                defensivePatterns: { type: 'array', items: { type: 'string' } },
                transitionPatterns: { type: 'array', items: { type: 'string' } },
                rawAnalysis: { type: 'string' },
              },
              required: ['teamName', 'formation', 'avgGoalsScored', 'avgGoalsConceded',
                'pressingIntensity', 'defensiveLine', 'buildupStyle', 'strengths', 'weaknesses',
                'setPieceStrengths', 'setPieceWeaknesses', 'keyPlayers', 'playingStyle',
                'opponentStrengthFactor', 'defensiveFactor', 'setPieceBonus', 'keyPlayerImpact',
                'confidence', 'dataSource', 'scoringPatterns', 'defensivePatterns',
                'transitionPatterns', 'rawAnalysis'],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = extractText(response);
      const extraction = extractJSON<TacticalExtraction>(rawContent);

      // Optionally save as opponent profile
      if (input.saveAsOpponent && input.teamRole === 'opponent') {
        const db = (await getDb())!;
        const userId = ctx.user.id;
        const teamName = input.opponentName || extraction.teamName;
        await db.execute(sql`
          INSERT INTO match_opponent_profiles
            (created_by, team_name, typical_formation, playing_style, strengths, weaknesses,
             set_piece_strengths, set_piece_weaknesses, key_players, avg_goals_scored, avg_goals_conceded,
             pressing_intensity, defensive_line, buildup_style, notes)
          VALUES
            (${userId}, ${teamName}, ${extraction.formation}, ${extraction.playingStyle},
             ${extraction.strengths}, ${extraction.weaknesses}, ${extraction.setPieceStrengths},
             ${extraction.setPieceWeaknesses}, ${extraction.keyPlayers},
             ${extraction.avgGoalsScored}, ${extraction.avgGoalsConceded},
             ${extraction.pressingIntensity}, ${extraction.defensiveLine}, ${extraction.buildupStyle},
             ${`Auto-extracted from video analysis. Confidence: ${extraction.confidence}. Source: ${input.videoUrl}`})
        `);
      }

      return extraction;
    }),

  // ── Analyze YouTube URL (text-based extraction via description) ───────────
  analyzeYouTubeUrl: protectedProcedure
    .input(z.object({
      youtubeUrl: z.string(),
      teamRole: z.enum(['our', 'opponent']),
      matchContext: z.string().optional(), // e.g. "Egypt vs Argentina, World Cup 2026 Round of 16"
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // For YouTube, we use text-based analysis with the URL as context
      // The LLM will use its knowledge of the match if it's a known game
      const prompt = `You are an elite football tactical analyst with comprehensive knowledge of football matches.

YOUTUBE URL: ${input.youtubeUrl}
TEAM ROLE: ${input.teamRole === 'our' ? 'OUR TEAM' : 'OPPONENT TO SCOUT'}
${input.matchContext ? `MATCH CONTEXT: ${input.matchContext}` : ''}
${input.additionalContext ? `ADDITIONAL NOTES: ${input.additionalContext}` : ''}

Based on this YouTube video URL and any match context provided, perform a comprehensive tactical analysis.
If this is a known match, use your knowledge of that match. If it's a general tactical video, analyze the tactical concepts shown.

Extract and return tactical intelligence as a JSON object with EXACTLY this structure:
{
  "teamName": "Team name",
  "formation": "e.g. 4-3-3",
  "avgGoalsScored": 1.5,
  "avgGoalsConceded": 1.2,
  "pressingIntensity": "High",
  "defensiveLine": "Medium",
  "buildupStyle": "Short Passing",
  "strengths": "Detailed tactical strengths",
  "weaknesses": "Tactical weaknesses and exploitable gaps",
  "setPieceStrengths": "Set piece attacking strengths",
  "setPieceWeaknesses": "Set piece vulnerabilities",
  "keyPlayers": "Key players and their tactical roles",
  "playingStyle": "Overall playing philosophy",
  "opponentStrengthFactor": 0.85,
  "defensiveFactor": 0.90,
  "setPieceBonus": 0.15,
  "keyPlayerImpact": 0.80,
  "confidence": "medium",
  "dataSource": "YouTube video analysis",
  "scoringPatterns": ["Pattern 1", "Pattern 2", "Pattern 3"],
  "defensivePatterns": ["Pattern 1", "Pattern 2"],
  "transitionPatterns": ["Pattern 1", "Pattern 2"],
  "rawAnalysis": "Comprehensive narrative analysis"
}

CALIBRATION:
- opponentStrengthFactor: 1.0 = average, 0.7 = weak, 1.3 = very strong
- defensiveFactor: 1.0 = average, 0.7 = very solid, 1.3 = leaky
- setPieceBonus: 0 = no threat, 0.3 = significant threat
- keyPlayerImpact: 1.0 = no suppression needed, 0.6 = decisive player must be suppressed`;

      const response = await invokeLLM({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 8192,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'tactical_extraction',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                teamName: { type: 'string' },
                formation: { type: 'string' },
                avgGoalsScored: { type: 'number' },
                avgGoalsConceded: { type: 'number' },
                pressingIntensity: { type: 'string' },
                defensiveLine: { type: 'string' },
                buildupStyle: { type: 'string' },
                strengths: { type: 'string' },
                weaknesses: { type: 'string' },
                setPieceStrengths: { type: 'string' },
                setPieceWeaknesses: { type: 'string' },
                keyPlayers: { type: 'string' },
                playingStyle: { type: 'string' },
                opponentStrengthFactor: { type: 'number' },
                defensiveFactor: { type: 'number' },
                setPieceBonus: { type: 'number' },
                keyPlayerImpact: { type: 'number' },
                confidence: { type: 'string' },
                dataSource: { type: 'string' },
                scoringPatterns: { type: 'array', items: { type: 'string' } },
                defensivePatterns: { type: 'array', items: { type: 'string' } },
                transitionPatterns: { type: 'array', items: { type: 'string' } },
                rawAnalysis: { type: 'string' },
              },
              required: ['teamName', 'formation', 'avgGoalsScored', 'avgGoalsConceded',
                'pressingIntensity', 'defensiveLine', 'buildupStyle', 'strengths', 'weaknesses',
                'setPieceStrengths', 'setPieceWeaknesses', 'keyPlayers', 'playingStyle',
                'opponentStrengthFactor', 'defensiveFactor', 'setPieceBonus', 'keyPlayerImpact',
                'confidence', 'dataSource', 'scoringPatterns', 'defensivePatterns',
                'transitionPatterns', 'rawAnalysis'],
              additionalProperties: false,
            },
          },
        },
      });

      const rawContent = extractText(response);
      return extractJSON<TacticalExtraction>(rawContent);
    }),

  // ── Multi-video analysis: analyze multiple matches and aggregate ──────────
  analyzeMultipleVideos: protectedProcedure
    .input(z.object({
      videos: z.array(z.object({
        url: z.string(),
        matchContext: z.string().optional(),
        isYouTube: z.boolean().default(true),
      })),
      teamRole: z.enum(['our', 'opponent']),
      teamName: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Analyze each video and aggregate
      const analyses: TacticalExtraction[] = [];

      for (const video of input.videos.slice(0, 5)) { // Max 5 videos
        try {
          const prompt = `You are an elite football tactical analyst.

VIDEO: ${video.url}
${video.matchContext ? `MATCH: ${video.matchContext}` : ''}
TEAM ROLE: ${input.teamRole === 'our' ? 'OUR TEAM' : 'OPPONENT'}
${input.teamName ? `TEAM NAME: ${input.teamName}` : ''}

Analyze this match and extract tactical data. Return JSON:
{
  "teamName": "string",
  "formation": "string",
  "avgGoalsScored": 0,
  "avgGoalsConceded": 0,
  "pressingIntensity": "Medium",
  "defensiveLine": "Medium",
  "buildupStyle": "Mixed",
  "strengths": "string",
  "weaknesses": "string",
  "setPieceStrengths": "string",
  "setPieceWeaknesses": "string",
  "keyPlayers": "string",
  "playingStyle": "string",
  "opponentStrengthFactor": 1.0,
  "defensiveFactor": 1.0,
  "setPieceBonus": 0.0,
  "keyPlayerImpact": 1.0,
  "confidence": "medium",
  "dataSource": "string",
  "scoringPatterns": [],
  "defensivePatterns": [],
  "transitionPatterns": [],
  "rawAnalysis": "string"
}`;

          const response = await invokeLLM({
            messages: [{ role: 'user', content: prompt }],
            maxTokens: 4096,
          });
          const rawContent = extractText(response);
          const extraction = extractJSON<TacticalExtraction>(rawContent);
          analyses.push(extraction);
        } catch (err) {
          console.error(`Failed to analyze video ${video.url}:`, err);
        }
      }

      if (analyses.length === 0) {
        throw new Error('Failed to analyze any of the provided videos');
      }

      // Aggregate: average the numerical factors, combine text insights
      const avgGoalsScored = analyses.reduce((s, a) => s + a.avgGoalsScored, 0) / analyses.length;
      const avgGoalsConceded = analyses.reduce((s, a) => s + a.avgGoalsConceded, 0) / analyses.length;
      const opponentStrengthFactor = analyses.reduce((s, a) => s + a.opponentStrengthFactor, 0) / analyses.length;
      const defensiveFactor = analyses.reduce((s, a) => s + a.defensiveFactor, 0) / analyses.length;
      const setPieceBonus = analyses.reduce((s, a) => s + a.setPieceBonus, 0) / analyses.length;
      const keyPlayerImpact = analyses.reduce((s, a) => s + a.keyPlayerImpact, 0) / analyses.length;

      // Find most common formation
      const formationCounts: Record<string, number> = {};
      analyses.forEach(a => { formationCounts[a.formation] = (formationCounts[a.formation] || 0) + 1; });
      const dominantFormation = Object.entries(formationCounts).sort((a, b) => b[1] - a[1])[0][0];

      // Aggregate patterns
      const allScoringPatterns = [...new Set(analyses.flatMap(a => a.scoringPatterns))];
      const allDefensivePatterns = [...new Set(analyses.flatMap(a => a.defensivePatterns))];
      const allTransitionPatterns = [...new Set(analyses.flatMap(a => a.transitionPatterns))];

      // Build aggregated summary via LLM
      const summaryPrompt = `You are a football analyst. Here are tactical analyses from ${analyses.length} matches for ${input.teamName || 'a team'}:

${analyses.map((a, i) => `MATCH ${i + 1}:
Formation: ${a.formation}
Strengths: ${a.strengths}
Weaknesses: ${a.weaknesses}
Set Pieces: ${a.setPieceStrengths}
Key Players: ${a.keyPlayers}
Scoring Patterns: ${a.scoringPatterns.join(', ')}
`).join('\n')}

Write a consolidated tactical profile combining insights from all matches. Focus on:
1. Consistent patterns across matches
2. Recurring weaknesses to exploit
3. Reliable strengths
4. Set piece tendencies
5. Key player dependencies

Write 3-4 paragraphs, professional analyst style.`;

      const summaryResponse = await invokeLLM({
        messages: [{ role: 'user', content: summaryPrompt }],
        maxTokens: 2048,
      });

      const consolidatedAnalysis = extractText(summaryResponse);

      return {
        teamName: input.teamName || analyses[0].teamName,
        formation: dominantFormation,
        avgGoalsScored: Math.round(avgGoalsScored * 100) / 100,
        avgGoalsConceded: Math.round(avgGoalsConceded * 100) / 100,
        pressingIntensity: analyses[0].pressingIntensity,
        defensiveLine: analyses[0].defensiveLine,
        buildupStyle: analyses[0].buildupStyle,
        strengths: analyses.map(a => a.strengths).join(' | '),
        weaknesses: analyses.map(a => a.weaknesses).join(' | '),
        setPieceStrengths: analyses.map(a => a.setPieceStrengths).join(' | '),
        setPieceWeaknesses: analyses.map(a => a.setPieceWeaknesses).join(' | '),
        keyPlayers: analyses.map(a => a.keyPlayers).join(' | '),
        playingStyle: analyses.map(a => a.playingStyle).join(' | '),
        opponentStrengthFactor: Math.round(opponentStrengthFactor * 1000) / 1000,
        defensiveFactor: Math.round(defensiveFactor * 1000) / 1000,
        setPieceBonus: Math.round(setPieceBonus * 1000) / 1000,
        keyPlayerImpact: Math.round(keyPlayerImpact * 1000) / 1000,
        confidence: 'high' as const,
        dataSource: `Aggregated from ${analyses.length} match analyses`,
        scoringPatterns: allScoringPatterns.slice(0, 6),
        defensivePatterns: allDefensivePatterns.slice(0, 4),
        transitionPatterns: allTransitionPatterns.slice(0, 4),
        rawAnalysis: consolidatedAnalysis,
        matchCount: analyses.length,
      };
    }),

  // ── Generate pre-match intelligence from two analyses ────────────────────
  generateMatchIntelligence: protectedProcedure
    .input(z.object({
      ourAnalysis: z.object({
        teamName: z.string(),
        formation: z.string(),
        playingStyle: z.string(),
        strengths: z.string(),
        weaknesses: z.string(),
        avgGoalsScored: z.number(),
        avgGoalsConceded: z.number(),
        setPieceStrengths: z.string().optional(),
        defensiveFactor: z.number(),
      }),
      oppAnalysis: z.object({
        teamName: z.string(),
        formation: z.string(),
        playingStyle: z.string(),
        strengths: z.string(),
        weaknesses: z.string(),
        avgGoalsScored: z.number(),
        avgGoalsConceded: z.number(),
        setPieceStrengths: z.string().optional(),
        setPieceWeaknesses: z.string().optional(),
        keyPlayers: z.string().optional(),
        scoringPatterns: z.array(z.string()).optional(),
        defensiveFactor: z.number(),
        setPieceBonus: z.number(),
        keyPlayerImpact: z.number(),
      }),
    }))
    .mutation(async ({ input }) => {
      const prompt = buildMatchComparisonPrompt(
        input.ourAnalysis as TacticalExtraction,
        input.oppAnalysis as TacticalExtraction
      );

      const response = await invokeLLM({
        messages: [{ role: 'user', content: prompt }],
        maxTokens: 8192,
      });

      return { report: extractText(response) };
    }),

  // ── Dixon-Coles corrected simulation ─────────────────────────────────────
  // Corrects for low-scoring bias (0-0, 1-0, 0-1 happen more than Poisson predicts)
  runDixonColesSimulation: protectedProcedure
    .input(z.object({
      ourLambda: z.number(),
      oppLambda: z.number(),
      simCount: z.number().default(100000),
      rho: z.number().default(-0.13), // Dixon-Coles correlation parameter
    }))
    .mutation(async ({ input }) => {
      const { ourLambda, oppLambda, simCount, rho } = input;

      // Dixon-Coles correction factor τ(i,j,λ,μ,ρ)
      function tau(i: number, j: number, lambda: number, mu: number, r: number): number {
        if (i === 0 && j === 0) return 1 - lambda * mu * r;
        if (i === 0 && j === 1) return 1 + lambda * r;
        if (i === 1 && j === 0) return 1 + mu * r;
        if (i === 1 && j === 1) return 1 - r;
        return 1;
      }

      function poissonProb(k: number, lambda: number): number {
        let result = Math.exp(-lambda);
        for (let i = 1; i <= k; i++) result *= lambda / i;
        return result;
      }

      // Build score probability matrix (0-5 goals each)
      const maxGoals = 6;
      const scoreMatrix: number[][] = Array(maxGoals).fill(0).map(() => Array(maxGoals).fill(0));
      let totalProb = 0;

      for (let i = 0; i < maxGoals; i++) {
        for (let j = 0; j < maxGoals; j++) {
          const p = poissonProb(i, ourLambda) * poissonProb(j, oppLambda) * tau(i, j, ourLambda, oppLambda, rho);
          scoreMatrix[i][j] = Math.max(0, p);
          totalProb += Math.max(0, p);
        }
      }

      // Normalize
      let winProb = 0, drawProb = 0, lossProb = 0;
      const scoreProbabilities: { score: string; prob: number }[] = [];

      for (let i = 0; i < maxGoals; i++) {
        for (let j = 0; j < maxGoals; j++) {
          const p = scoreMatrix[i][j] / totalProb;
          if (p > 0.005) {
            scoreProbabilities.push({ score: `${i}-${j}`, prob: Math.round(p * 1000) / 10 });
          }
          if (i > j) winProb += p;
          else if (i === j) drawProb += p;
          else lossProb += p;
        }
      }

      // Sort score probabilities
      scoreProbabilities.sort((a, b) => b.prob - a.prob);

      // Also run Monte Carlo for comparison
      function poissonRandom(lambda: number): number {
        const L = Math.exp(-lambda);
        let k = 0, p = 1;
        do { k++; p *= Math.random(); } while (p > L);
        return k - 1;
      }

      let mcWins = 0, mcDraws = 0, mcLosses = 0;
      for (let i = 0; i < simCount; i++) {
        const ourGoals = poissonRandom(ourLambda);
        const oppGoals = poissonRandom(oppLambda);
        if (ourGoals > oppGoals) mcWins++;
        else if (ourGoals === oppGoals) mcDraws++;
        else mcLosses++;
      }

      return {
        // Dixon-Coles analytical results
        dixonColes: {
          winPct: Math.round(winProb * 1000) / 10,
          drawPct: Math.round(drawProb * 1000) / 10,
          lossPct: Math.round(lossProb * 1000) / 10,
          topScores: scoreProbabilities.slice(0, 8),
        },
        // Monte Carlo simulation results
        monteCarlo: {
          winPct: Math.round((mcWins / simCount) * 1000) / 10,
          drawPct: Math.round((mcDraws / simCount) * 1000) / 10,
          lossPct: Math.round((mcLosses / simCount) * 1000) / 10,
          scenarios: simCount,
        },
        // Consensus (average of both methods)
        consensus: {
          winPct: Math.round(((winProb + mcWins / simCount) / 2) * 1000) / 10,
          drawPct: Math.round(((drawProb + mcDraws / simCount) / 2) * 1000) / 10,
          lossPct: Math.round(((lossProb + mcLosses / simCount) / 2) * 1000) / 10,
        },
        ourLambda,
        oppLambda,
        rho,
      };
    }),

  // ── Sensitivity Analysis ──────────────────────────────────────────────────
  // Shows how win% changes as each factor varies (tornado chart data)
  runSensitivityAnalysis: protectedProcedure
    .input(z.object({
      ourLambda: z.number(),
      oppLambda: z.number(),
      factors: z.array(z.object({
        name: z.string(),
        baseValue: z.number(),
        lowValue: z.number(),
        highValue: z.number(),
        affectsOur: z.boolean(),
      })),
    }))
    .mutation(async ({ input }) => {
      function poissonRandom(lambda: number): number {
        const L = Math.exp(-lambda);
        let k = 0, p = 1;
        do { k++; p *= Math.random(); } while (p > L);
        return k - 1;
      }

      function simulate(ourL: number, oppL: number, n = 20000): number {
        let wins = 0;
        for (let i = 0; i < n; i++) {
          if (poissonRandom(ourL) > poissonRandom(oppL)) wins++;
        }
        return Math.round((wins / n) * 1000) / 10;
      }

      const baseWin = simulate(input.ourLambda, input.oppLambda);

      const results = input.factors.map(factor => {
        const lowLambdaOur = factor.affectsOur ? input.ourLambda * (factor.lowValue / factor.baseValue) : input.ourLambda;
        const lowLambdaOpp = !factor.affectsOur ? input.oppLambda * (factor.lowValue / factor.baseValue) : input.oppLambda;
        const highLambdaOur = factor.affectsOur ? input.ourLambda * (factor.highValue / factor.baseValue) : input.ourLambda;
        const highLambdaOpp = !factor.affectsOur ? input.oppLambda * (factor.highValue / factor.baseValue) : input.oppLambda;

        const lowWin = simulate(lowLambdaOur, lowLambdaOpp);
        const highWin = simulate(highLambdaOur, highLambdaOpp);

        return {
          name: factor.name,
          baseWin,
          lowWin,
          highWin,
          impact: Math.abs(highWin - lowWin),
          affectsOur: factor.affectsOur,
        };
      });

      // Sort by impact (tornado chart order)
      results.sort((a, b) => b.impact - a.impact);

      return { baseWin, factors: results };
    }),

  // ── Scenario Tree Analysis ────────────────────────────────────────────────
  runScenarioTree: protectedProcedure
    .input(z.object({
      ourLambda: z.number(),
      oppLambda: z.number(),
      setPieceBonus: z.number().default(0.15),
      earlyGoalBoost: z.number().default(0.3),
    }))
    .mutation(async ({ input }) => {
      function simulate(ourL: number, oppL: number, n = 30000): { win: number; draw: number; loss: number } {
        function poissonRandom(lambda: number): number {
          const L = Math.exp(-lambda);
          let k = 0, p = 1;
          do { k++; p *= Math.random(); } while (p > L);
          return k - 1;
        }
        let wins = 0, draws = 0, losses = 0;
        for (let i = 0; i < n; i++) {
          const og = poissonRandom(ourL);
          const oppg = poissonRandom(oppL);
          if (og > oppg) wins++;
          else if (og === oppg) draws++;
          else losses++;
        }
        return {
          win: Math.round((wins / n) * 1000) / 10,
          draw: Math.round((draws / n) * 1000) / 10,
          loss: Math.round((losses / n) * 1000) / 10,
        };
      }

      const base = simulate(input.ourLambda, input.oppLambda);
      const withSetPieces = simulate(input.ourLambda + input.setPieceBonus, input.oppLambda);
      const withEarlyGoal = simulate(input.ourLambda + input.earlyGoalBoost, input.oppLambda * 0.85);
      const withEarlyGoalAndSP = simulate(input.ourLambda + input.earlyGoalBoost + input.setPieceBonus, input.oppLambda * 0.85);
      const concedingEarly = simulate(input.ourLambda * 0.9, input.oppLambda + input.earlyGoalBoost);
      const dominatingPossession = simulate(input.ourLambda * 1.1, input.oppLambda * 0.9);
      const counterAttack = simulate(input.ourLambda * 0.85, input.oppLambda * 0.85);

      return {
        scenarios: [
          { id: 'base', label: 'Base Scenario', description: 'Standard match conditions', ...base, probability: 35 },
          { id: 'early_goal', label: 'Score Early (< 25 min)', description: 'We score in first 25 minutes', ...withEarlyGoal, probability: 20 },
          { id: 'set_pieces', label: 'Win Set Piece Battle', description: 'Dominate corners and free kicks', ...withSetPieces, probability: 25 },
          { id: 'early_goal_sp', label: 'Early Goal + Set Pieces', description: 'Best case: early goal and set piece dominance', ...withEarlyGoalAndSP, probability: 10 },
          { id: 'concede_early', label: 'Concede Early', description: 'Opponent scores in first 25 minutes', ...concedingEarly, probability: 20 },
          { id: 'possession', label: 'Possession Dominance', description: 'Control the game with 60%+ possession', ...dominatingPossession, probability: 15 },
          { id: 'counter', label: 'Counter-Attack Game', description: 'Low block, hit on the break', ...counterAttack, probability: 15 },
        ],
        ourLambda: input.ourLambda,
        oppLambda: input.oppLambda,
      };
    }),
});
