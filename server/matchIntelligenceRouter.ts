import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import { getDb } from './db';
import { sql } from 'drizzle-orm';
import { invokeLLM } from './_core/llm';

// ── Poisson + Monte Carlo simulation (server-side) ──────────────────────────
function poissonRandom(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= Math.random(); } while (p > L);
  return k - 1;
}

function runMonteCarloSimulation(
  ourLambda: number,
  oppLambda: number,
  simCount: number = 100000
): { wins: number; draws: number; losses: number; scenarios: number } {
  let wins = 0, draws = 0, losses = 0;
  for (let i = 0; i < simCount; i++) {
    const ourGoals = poissonRandom(ourLambda);
    const oppGoals = poissonRandom(oppLambda);
    if (ourGoals > oppGoals) wins++;
    else if (ourGoals === oppGoals) draws++;
    else losses++;
  }
  return { wins, draws, losses, scenarios: simCount };
}

export const matchIntelligenceRouter = router({
  // ── Opponent Profiles ────────────────────────────────────────────────────
  listOpponents: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const userId = ctx.user.id;
    const rows = await db.execute(
      sql`SELECT id, team_name, country, league, typical_formation, avg_goals_scored, avg_goals_conceded,
          matches_played, wins, draws, losses, playing_style, pressing_intensity, defensive_line,
          buildup_style, strengths, weaknesses, set_piece_strengths, created_at
          FROM match_opponent_profiles WHERE created_by = ${userId} ORDER BY team_name ASC`
    );
    return (rows[0] as unknown as any[]) || [];
  }),

  getOpponent: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const userId = ctx.user.id;
      const id = input.id;
      const rows = await db.execute(
        sql`SELECT * FROM match_opponent_profiles WHERE id = ${id} AND created_by = ${userId}`
      );
      const arr = (rows[0] as unknown as any[]) || [];
      return arr.length > 0 ? arr[0] : null;
    }),

  saveOpponent: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      teamName: z.string(),
      country: z.string().optional(),
      league: z.string().optional(),
      typicalFormation: z.string().optional(),
      playingStyle: z.string().optional(),
      strengths: z.string().optional(),
      weaknesses: z.string().optional(),
      setPieceStrengths: z.string().optional(),
      setPieceWeaknesses: z.string().optional(),
      keyPlayers: z.string().optional(),
      avgGoalsScored: z.number().optional(),
      avgGoalsConceded: z.number().optional(),
      matchesPlayed: z.number().optional(),
      wins: z.number().optional(),
      draws: z.number().optional(),
      losses: z.number().optional(),
      pressingIntensity: z.string().optional(),
      defensiveLine: z.string().optional(),
      buildupStyle: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const userId = ctx.user.id;
      if (input.id) {
        const id = input.id;
        await db.execute(sql`
          UPDATE match_opponent_profiles SET
            team_name=${input.teamName}, country=${input.country ?? null}, league=${input.league ?? null},
            typical_formation=${input.typicalFormation ?? null}, playing_style=${input.playingStyle ?? null},
            strengths=${input.strengths ?? null}, weaknesses=${input.weaknesses ?? null},
            set_piece_strengths=${input.setPieceStrengths ?? null}, set_piece_weaknesses=${input.setPieceWeaknesses ?? null},
            key_players=${input.keyPlayers ?? null}, avg_goals_scored=${input.avgGoalsScored ?? 0},
            avg_goals_conceded=${input.avgGoalsConceded ?? 0}, matches_played=${input.matchesPlayed ?? 0},
            wins=${input.wins ?? 0}, draws=${input.draws ?? 0}, losses=${input.losses ?? 0},
            pressing_intensity=${input.pressingIntensity ?? null}, defensive_line=${input.defensiveLine ?? null},
            buildup_style=${input.buildupStyle ?? null}, notes=${input.notes ?? null}
          WHERE id=${id} AND created_by=${userId}
        `);
        return { id: input.id };
      } else {
        const result = await db.execute(sql`
          INSERT INTO match_opponent_profiles
            (created_by, team_name, country, league, typical_formation, playing_style, strengths, weaknesses,
             set_piece_strengths, set_piece_weaknesses, key_players, avg_goals_scored, avg_goals_conceded,
             matches_played, wins, draws, losses, pressing_intensity, defensive_line, buildup_style, notes)
          VALUES
            (${userId}, ${input.teamName}, ${input.country ?? null}, ${input.league ?? null},
             ${input.typicalFormation ?? null}, ${input.playingStyle ?? null}, ${input.strengths ?? null},
             ${input.weaknesses ?? null}, ${input.setPieceStrengths ?? null}, ${input.setPieceWeaknesses ?? null},
             ${input.keyPlayers ?? null}, ${input.avgGoalsScored ?? 0}, ${input.avgGoalsConceded ?? 0},
             ${input.matchesPlayed ?? 0}, ${input.wins ?? 0}, ${input.draws ?? 0}, ${input.losses ?? 0},
             ${input.pressingIntensity ?? null}, ${input.defensiveLine ?? null}, ${input.buildupStyle ?? null},
             ${input.notes ?? null})
        `);
        return { id: (result[0] as any).insertId };
      }
    }),

  deleteOpponent: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const userId = ctx.user.id;
      const id = input.id;
      await db.execute(sql`DELETE FROM match_opponent_profiles WHERE id=${id} AND created_by=${userId}`);
      return { success: true };
    }),

  // ── Coach Profiles ───────────────────────────────────────────────────────
  listCoaches: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const userId = ctx.user.id;
    const rows = await db.execute(
      sql`SELECT id, name, nationality, team_name, preferred_formation, win_rate, years_experience,
          tactical_philosophy, pressing_style, known_weaknesses, big_match_record, created_at
          FROM match_coach_profiles WHERE created_by = ${userId} ORDER BY name ASC`
    );
    return (rows[0] as unknown as any[]) || [];
  }),

  getCoach: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const userId = ctx.user.id;
      const id = input.id;
      const rows = await db.execute(
        sql`SELECT * FROM match_coach_profiles WHERE id = ${id} AND created_by = ${userId}`
      );
      const arr = (rows[0] as unknown as any[]) || [];
      return arr.length > 0 ? arr[0] : null;
    }),

  saveCoach: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      name: z.string(),
      nationality: z.string().optional(),
      age: z.number().optional(),
      teamName: z.string().optional(),
      yearsExperience: z.number().optional(),
      preferredFormation: z.string().optional(),
      tacticalPhilosophy: z.string().optional(),
      pressingStyle: z.string().optional(),
      defensiveApproach: z.string().optional(),
      attackingApproach: z.string().optional(),
      substitutionPatterns: z.string().optional(),
      bigMatchRecord: z.string().optional(),
      setPieceApproach: z.string().optional(),
      knownWeaknesses: z.string().optional(),
      careerHighlights: z.string().optional(),
      winRate: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const userId = ctx.user.id;
      if (input.id) {
        const id = input.id;
        await db.execute(sql`
          UPDATE match_coach_profiles SET
            name=${input.name}, nationality=${input.nationality ?? null}, age=${input.age ?? null},
            team_name=${input.teamName ?? null}, years_experience=${input.yearsExperience ?? null},
            preferred_formation=${input.preferredFormation ?? null}, tactical_philosophy=${input.tacticalPhilosophy ?? null},
            pressing_style=${input.pressingStyle ?? null}, defensive_approach=${input.defensiveApproach ?? null},
            attacking_approach=${input.attackingApproach ?? null}, substitution_patterns=${input.substitutionPatterns ?? null},
            big_match_record=${input.bigMatchRecord ?? null}, set_piece_approach=${input.setPieceApproach ?? null},
            known_weaknesses=${input.knownWeaknesses ?? null}, career_highlights=${input.careerHighlights ?? null},
            win_rate=${input.winRate ?? null}, notes=${input.notes ?? null}
          WHERE id=${id} AND created_by=${userId}
        `);
        return { id: input.id };
      } else {
        const result = await db.execute(sql`
          INSERT INTO match_coach_profiles
            (created_by, name, nationality, age, team_name, years_experience, preferred_formation,
             tactical_philosophy, pressing_style, defensive_approach, attacking_approach,
             substitution_patterns, big_match_record, set_piece_approach, known_weaknesses,
             career_highlights, win_rate, notes)
          VALUES
            (${userId}, ${input.name}, ${input.nationality ?? null}, ${input.age ?? null},
             ${input.teamName ?? null}, ${input.yearsExperience ?? null}, ${input.preferredFormation ?? null},
             ${input.tacticalPhilosophy ?? null}, ${input.pressingStyle ?? null}, ${input.defensiveApproach ?? null},
             ${input.attackingApproach ?? null}, ${input.substitutionPatterns ?? null}, ${input.bigMatchRecord ?? null},
             ${input.setPieceApproach ?? null}, ${input.knownWeaknesses ?? null}, ${input.careerHighlights ?? null},
             ${input.winRate ?? null}, ${input.notes ?? null})
        `);
        return { id: (result[0] as any).insertId };
      }
    }),

  deleteCoach: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const userId = ctx.user.id;
      const id = input.id;
      await db.execute(sql`DELETE FROM match_coach_profiles WHERE id=${id} AND created_by=${userId}`);
      return { success: true };
    }),

  // ── Monte Carlo Simulation ───────────────────────────────────────────────
  runSimulation: protectedProcedure
    .input(z.object({
      ourRawAvg: z.number(),
      oppRawAvg: z.number(),
      ourOpponentStrengthFactor: z.number().default(1),
      ourDefensiveFactor: z.number().default(1),
      oppOpponentStrengthFactor: z.number().default(1),
      oppDefensiveFactor: z.number().default(1),
      ourSetPieceBonus: z.number().default(0),
      oppSetPieceBonus: z.number().default(0),
      keyPlayerSuppressionFactor: z.number().default(1),
      simCount: z.number().default(100000),
    }))
    .mutation(async ({ input }) => {
      const ourLambda = input.ourRawAvg * input.ourOpponentStrengthFactor * input.ourDefensiveFactor;
      const oppLambda = input.oppRawAvg * input.oppOpponentStrengthFactor * input.oppDefensiveFactor * input.keyPlayerSuppressionFactor;
      const ourLambdaWithSP = ourLambda + input.ourSetPieceBonus;
      const oppLambdaWithSP = oppLambda + input.oppSetPieceBonus;

      const base = runMonteCarloSimulation(ourLambda, oppLambda, input.simCount);
      const withSP = runMonteCarloSimulation(ourLambdaWithSP, oppLambdaWithSP, input.simCount);

      const toProb = (n: number, total: number) => Math.round((n / total) * 1000) / 10;

      return {
        ourLambda: Math.round(ourLambda * 1000) / 1000,
        oppLambda: Math.round(oppLambda * 1000) / 1000,
        ourLambdaWithSP: Math.round(ourLambdaWithSP * 1000) / 1000,
        oppLambdaWithSP: Math.round(oppLambdaWithSP * 1000) / 1000,
        base: {
          winPct: toProb(base.wins, base.scenarios),
          drawPct: toProb(base.draws, base.scenarios),
          lossPct: toProb(base.losses, base.scenarios),
          scenarios: base.scenarios,
        },
        withSetPieces: {
          winPct: toProb(withSP.wins, withSP.scenarios),
          drawPct: toProb(withSP.draws, withSP.scenarios),
          lossPct: toProb(withSP.losses, withSP.scenarios),
          scenarios: withSP.scenarios,
        },
      };
    }),

  // ── AI Analysis ──────────────────────────────────────────────────────────
  generateAIAnalysis: protectedProcedure
    .input(z.object({
      ourTeam: z.string(),
      ourFormation: z.string(),
      opponentTeam: z.string(),
      opponentFormation: z.string(),
      ourLambda: z.number(),
      oppLambda: z.number(),
      winPct: z.number(),
      drawPct: z.number(),
      lossPct: z.number(),
      opponentProfile: z.string().optional(),
      coachProfile: z.string().optional(),
      analysisType: z.enum(['full', 'patterns', 'tactical', 'set_pieces']).default('full'),
    }))
    .mutation(async ({ input }) => {
      const prompt = `You are an elite football tactical analyst. Analyze this upcoming match and provide a comprehensive intelligence report.

MATCH: ${input.ourTeam} (${input.ourFormation}) vs ${input.opponentTeam} (${input.opponentFormation})

MONTE CARLO SIMULATION RESULTS (100,000 scenarios):
- Win probability: ${input.winPct}%
- Draw probability: ${input.drawPct}%
- Loss probability: ${input.lossPct}%
- Our adjusted λ (expected goals): ${input.ourLambda}
- Opponent adjusted λ: ${input.oppLambda}

${input.opponentProfile ? `OPPONENT PROFILE:\n${input.opponentProfile}\n` : ''}
${input.coachProfile ? `COACH PROFILE:\n${input.coachProfile}\n` : ''}

Provide a detailed tactical intelligence report covering:

1. **FORMATION MATCHUP ANALYSIS** — How ${input.ourFormation} matches up against ${input.opponentFormation}. Key structural advantages and vulnerabilities.

2. **PATTERN DETECTION** — Based on the opponent profile, identify recurring patterns: when do they score, from where, what triggers their best attacks, what defensive patterns repeat.

3. **FIVE GATES TO VICTORY** — Five specific tactical keys that, if executed, dramatically increase win probability. Be specific and actionable.

4. **KEY PLAYER BATTLES** — The 3-4 individual matchups that will decide the game. Include how to neutralize the opponent's key threat.

5. **SET PIECE STRATEGY** — Specific set piece plans for both attack and defense based on opponent tendencies.

6. **PRESSING & TRANSITION TRIGGERS** — Specific moments and zones to press, and how to exploit transitions.

7. **SUBSTITUTION STRATEGY** — Recommended substitution plan with timing and scenarios.

8. **COACH TACTICAL TENDENCIES** — If coach profile provided, how their tendencies can be exploited.

9. **RISK ASSESSMENT** — Main threats to our game plan and contingency responses.

10. **FINAL VERDICT** — One paragraph summary with the single most important tactical instruction.

Be specific, data-driven, and actionable. Write like a professional analyst preparing a pre-match dossier.`;

      // invokeLLM takes an InvokeParams object, not a bare prompt string, and
      // returns a completion envelope rather than the text itself.
      const response = await invokeLLM({
        messages: [{ role: "user", content: prompt }],
      });
      const content = response.choices[0]?.message?.content ?? "";
      return { report: typeof content === "string" ? content : JSON.stringify(content) };
    }),

  // ── Save Analysis ────────────────────────────────────────────────────────
  saveAnalysis: protectedProcedure
    .input(z.object({
      id: z.number().optional(),
      title: z.string(),
      ourTeam: z.string(),
      opponentTeam: z.string(),
      opponentProfileId: z.number().optional(),
      coachProfileId: z.number().optional(),
      matchDate: z.string().optional(),
      competition: z.string().optional(),
      venue: z.string().optional(),
      ourFormation: z.string().optional(),
      opponentFormation: z.string().optional(),
      ourLambda: z.number().optional(),
      oppLambda: z.number().optional(),
      ourRawAvg: z.number().optional(),
      oppRawAvg: z.number().optional(),
      winProbability: z.number().optional(),
      drawProbability: z.number().optional(),
      lossProbability: z.number().optional(),
      winProbabilityWithSetPieces: z.number().optional(),
      simulationResults: z.string().optional(),
      patternAnalysis: z.string().optional(),
      tacticalRecommendations: z.string().optional(),
      fiveGates: z.string().optional(),
      keyBattles: z.string().optional(),
      setPiecePlan: z.string().optional(),
      substitutionStrategy: z.string().optional(),
      aiFullReport: z.string().optional(),
      status: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const userId = ctx.user.id;
      if (input.id) {
        const id = input.id;
        await db.execute(sql`
          UPDATE match_analyses SET
            title=${input.title}, our_team=${input.ourTeam}, opponent_team=${input.opponentTeam},
            opponent_profile_id=${input.opponentProfileId ?? null}, coach_profile_id=${input.coachProfileId ?? null},
            match_date=${input.matchDate || null}, competition=${input.competition ?? null}, venue=${input.venue ?? null},
            our_formation=${input.ourFormation ?? null}, opponent_formation=${input.opponentFormation ?? null},
            our_lambda=${input.ourLambda ?? null}, opponent_lambda=${input.oppLambda ?? null},
            our_raw_avg=${input.ourRawAvg ?? null}, opponent_raw_avg=${input.oppRawAvg ?? null},
            win_probability=${input.winProbability ?? null}, draw_probability=${input.drawProbability ?? null},
            loss_probability=${input.lossProbability ?? null}, win_probability_with_set_pieces=${input.winProbabilityWithSetPieces ?? null},
            simulation_results=${input.simulationResults ?? null}, pattern_analysis=${input.patternAnalysis ?? null},
            tactical_recommendations=${input.tacticalRecommendations ?? null}, five_gates=${input.fiveGates ?? null},
            key_battles=${input.keyBattles ?? null}, set_piece_plan=${input.setPiecePlan ?? null},
            substitution_strategy=${input.substitutionStrategy ?? null}, ai_full_report=${input.aiFullReport ?? null},
            status=${input.status ?? 'draft'}
          WHERE id=${id} AND created_by=${userId}
        `);
        return { id: input.id };
      } else {
        const result = await db.execute(sql`
          INSERT INTO match_analyses
            (created_by, title, our_team, opponent_team, opponent_profile_id, coach_profile_id,
             match_date, competition, venue, our_formation, opponent_formation,
             our_lambda, opponent_lambda, our_raw_avg, opponent_raw_avg,
             win_probability, draw_probability, loss_probability, win_probability_with_set_pieces,
             simulation_results, pattern_analysis, tactical_recommendations, five_gates,
             key_battles, set_piece_plan, substitution_strategy, ai_full_report, status)
          VALUES
            (${userId}, ${input.title}, ${input.ourTeam}, ${input.opponentTeam},
             ${input.opponentProfileId ?? null}, ${input.coachProfileId ?? null},
             ${/* the date input posts "" when untouched; MySQL rejects that for a DATE column */
               input.matchDate || null}, ${input.competition ?? null}, ${input.venue ?? null},
             ${input.ourFormation ?? null}, ${input.opponentFormation ?? null},
             ${input.ourLambda ?? null}, ${input.oppLambda ?? null},
             ${input.ourRawAvg ?? null}, ${input.oppRawAvg ?? null},
             ${input.winProbability ?? null}, ${input.drawProbability ?? null},
             ${input.lossProbability ?? null}, ${input.winProbabilityWithSetPieces ?? null},
             ${input.simulationResults ?? null}, ${input.patternAnalysis ?? null},
             ${input.tacticalRecommendations ?? null}, ${input.fiveGates ?? null},
             ${input.keyBattles ?? null}, ${input.setPiecePlan ?? null},
             ${input.substitutionStrategy ?? null}, ${input.aiFullReport ?? null},
             ${input.status ?? 'draft'})
        `);
        return { id: (result[0] as any).insertId };
      }
    }),

  listAnalyses: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const userId = ctx.user.id;
    const rows = await db.execute(
      sql`SELECT id, title, our_team, opponent_team, our_formation, opponent_formation,
          win_probability, draw_probability, loss_probability, match_date, competition, status, created_at
          FROM match_analyses WHERE created_by = ${userId} ORDER BY created_at DESC LIMIT 50`
    );
    return (rows[0] as unknown as any[]) || [];
  }),

  getAnalysis: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const userId = ctx.user.id;
      const id = input.id;
      const rows = await db.execute(
        sql`SELECT * FROM match_analyses WHERE id = ${id} AND created_by = ${userId}`
      );
      const arr = (rows[0] as unknown as any[]) || [];
      return arr.length > 0 ? arr[0] : null;
    }),

  deleteAnalysis: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const userId = ctx.user.id;
      const id = input.id;
      await db.execute(sql`DELETE FROM match_analyses WHERE id=${id} AND created_by=${userId}`);
      return { success: true };
    }),
});
