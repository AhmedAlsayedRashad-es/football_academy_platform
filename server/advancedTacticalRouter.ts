import { router } from "./_core/trpc";
import { protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "./db";
import { sql } from "drizzle-orm";
import { invokeLLM, extractJSON, extractText } from "./_core/llm";

const coachProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!["admin", "coach"].includes(ctx.user.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Coach access required" });
  }
  return next({ ctx });
});

export const advancedTacticalRouter = router({
  // ── Sessions ──────────────────────────────────────────────────────────────
  saveSession: coachProcedure
    .input(z.object({
      id: z.number().optional(),
      title: z.string().min(1),
      description: z.string().optional(),
      sessionType: z.enum(["training","match_prep","post_match","set_piece","free"]).default("free"),
      homeFormation: z.string().default("4-3-3"),
      awayFormation: z.string().default("4-4-2"),
      homeTeamName: z.string().default("Home"),
      awayTeamName: z.string().default("Away"),
      homePlayers: z.any(),
      awayPlayers: z.any(),
      layers: z.any(),
      tags: z.array(z.string()).optional(),
      matchDate: z.string().optional(),
      opponent: z.string().optional(),
      isTemplate: z.boolean().default(false),
      isPublic: z.boolean().default(false),
      thumbnailData: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = (await getDb())!;
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const hp = JSON.stringify(input.homePlayers ?? []);
      const ap = JSON.stringify(input.awayPlayers ?? []);
      const ly = JSON.stringify(input.layers ?? []);
      const tg = JSON.stringify(input.tags ?? []);
      if (input.id) {
        await database.execute(sql`
          UPDATE tactical_sessions SET
            title=${input.title}, description=${input.description ?? null},
            sessionType_tac=${input.sessionType},
            homeFormation=${input.homeFormation}, awayFormation=${input.awayFormation},
            homeTeamName=${input.homeTeamName}, awayTeamName=${input.awayTeamName},
            homePlayers=${hp}, awayPlayers=${ap}, layers=${ly}, tags=${tg},
            matchDate=${input.matchDate ?? null}, opponent=${input.opponent ?? null},
            isTemplate=${input.isTemplate ? 1 : 0}, isPublic=${input.isPublic ? 1 : 0},
            thumbnailData=${input.thumbnailData ?? null}, updatedAt_ts=NOW()
          WHERE id=${input.id} AND createdBy=${ctx.user.id}
        `);
        return { success: true, id: input.id };
      } else {
        const [result] = await database.execute(sql`
          INSERT INTO tactical_sessions
            (createdBy,title,description,sessionType_tac,homeFormation,awayFormation,homeTeamName,awayTeamName,homePlayers,awayPlayers,layers,tags,matchDate,opponent,isTemplate,isPublic,thumbnailData)
          VALUES
            (${ctx.user.id},${input.title},${input.description ?? null},${input.sessionType},${input.homeFormation},${input.awayFormation},${input.homeTeamName},${input.awayTeamName},${hp},${ap},${ly},${tg},${input.matchDate ?? null},${input.opponent ?? null},${input.isTemplate ? 1 : 0},${input.isPublic ? 1 : 0},${input.thumbnailData ?? null})
        `) as any;
        return { success: true, id: (result as any).insertId };
      }
    }),

  listSessions: coachProcedure.query(async ({ ctx }) => {
    const database = (await getDb())!;
    if (!database) return [];
    const [rows] = await database.execute(sql`
      SELECT id, title, description, sessionType_tac as sessionType, homeFormation, awayFormation,
             homeTeamName, awayTeamName, opponent, matchDate, isTemplate, isPublic,
             createdAt_ts as createdAt, updatedAt_ts as updatedAt
      FROM tactical_sessions WHERE createdBy=${ctx.user.id} ORDER BY updatedAt_ts DESC
    `) as any;
    return rows as any[];
  }),

  getSession: coachProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const database = (await getDb())!;
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [rows] = await database.execute(sql`
        SELECT * FROM tactical_sessions WHERE id=${input.id} AND (createdBy=${ctx.user.id} OR isPublic=1)
      `) as any;
      if (!rows || rows.length === 0) throw new TRPCError({ code: "NOT_FOUND" });
      const session = rows[0];
      for (const field of ["homePlayers","awayPlayers","layers","tags"]) {
        if (typeof session[field] === "string") {
          try { session[field] = JSON.parse(session[field]); } catch { session[field] = []; }
        }
      }
      return session;
    }),

  deleteSession: coachProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const database = (await getDb())!;
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.execute(sql`DELETE FROM tactical_sessions WHERE id=${input.id} AND createdBy=${ctx.user.id}`);
      return { success: true };
    }),

  // ── Phases ────────────────────────────────────────────────────────────────
  savePhase: coachProcedure
    .input(z.object({
      id: z.number().optional(),
      sessionId: z.number(),
      phaseNumber: z.number(),
      title: z.string(),
      description: z.string().optional(),
      homePlayers: z.any(),
      awayPlayers: z.any(),
      layers: z.any(),
      durationSeconds: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const hp = JSON.stringify(input.homePlayers ?? []);
      const ap = JSON.stringify(input.awayPlayers ?? []);
      const ly = JSON.stringify(input.layers ?? []);
      if (input.id) {
        await database.execute(sql`
          UPDATE tactical_phases SET title=${input.title}, description=${input.description ?? null},
          homePlayers=${hp}, awayPlayers=${ap}, layers=${ly}, durationSeconds=${input.durationSeconds}
          WHERE id=${input.id}
        `);
        return { success: true, id: input.id };
      } else {
        const [result] = await database.execute(sql`
          INSERT INTO tactical_phases (sessionId,phaseNumber,title,description,homePlayers,awayPlayers,layers,durationSeconds)
          VALUES (${input.sessionId},${input.phaseNumber},${input.title},${input.description ?? null},${hp},${ap},${ly},${input.durationSeconds})
        `) as any;
        return { success: true, id: (result as any).insertId };
      }
    }),

  getPhases: coachProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const database = (await getDb())!;
      if (!database) return [];
      const [rows] = await database.execute(sql`
        SELECT * FROM tactical_phases WHERE sessionId=${input.sessionId} ORDER BY phaseNumber ASC
      `) as any;
      return (rows as any[]).map(p => {
        for (const field of ["homePlayers","awayPlayers","layers"]) {
          if (typeof p[field] === "string") { try { p[field] = JSON.parse(p[field]); } catch { p[field] = []; } }
        }
        return p;
      });
    }),

  deletePhase: coachProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const database = (await getDb())!;
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.execute(sql`DELETE FROM tactical_phases WHERE id=${input.id}`);
      return { success: true };
    }),

  // ── Analysis Notes ────────────────────────────────────────────────────────
  addNote: coachProcedure
    .input(z.object({
      sessionId: z.number(),
      category: z.enum(["strength","weakness","opportunity","threat","general","set_piece","pressing","transition"]).default("general"),
      content: z.string().min(1),
      priority: z.enum(["low","medium","high"]).default("medium"),
      relatedPhaseId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = (await getDb())!;
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await database.execute(sql`
        INSERT INTO tactical_analysis_notes (sessionId,createdBy,category_tan,content,priority_tan,relatedPhaseId)
        VALUES (${input.sessionId},${ctx.user.id},${input.category},${input.content},${input.priority},${input.relatedPhaseId ?? null})
      `) as any;
      return { success: true, id: (result as any).insertId };
    }),

  getNotes: coachProcedure
    .input(z.object({ sessionId: z.number() }))
    .query(async ({ input }) => {
      const database = (await getDb())!;
      if (!database) return [];
      const [rows] = await database.execute(sql`
        SELECT n.id, n.sessionId, n.category_tan as category, n.content, n.priority_tan as priority,
               n.relatedPhaseId, n.createdAt_tan as createdAt, u.name as authorName
        FROM tactical_analysis_notes n
        LEFT JOIN users u ON u.id = n.createdBy
        WHERE n.sessionId=${input.sessionId} ORDER BY n.createdAt_tan DESC
      `) as any;
      return rows as any[];
    }),

  deleteNote: coachProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const database = (await getDb())!;
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await database.execute(sql`DELETE FROM tactical_analysis_notes WHERE id=${input.id} AND createdBy=${ctx.user.id}`);
      return { success: true };
    }),

  // ── Templates ─────────────────────────────────────────────────────────────
  getTemplates: coachProcedure.query(async ({ ctx }) => {
    const database = (await getDb())!;
    if (!database) return [];
    const [rows] = await database.execute(sql`
      SELECT * FROM tactical_templates WHERE isSystem=1 OR createdBy=${ctx.user.id} ORDER BY isSystem DESC, name ASC
    `) as any;
    return (rows as any[]).map(t => {
      for (const field of ["homePlayers","awayPlayers","layers"]) {
        if (typeof t[field] === "string") { try { t[field] = JSON.parse(t[field]); } catch { t[field] = []; } }
      }
      return t;
    });
  }),

  saveAsTemplate: coachProcedure
    .input(z.object({
      name: z.string().min(1),
      category: z.enum(["attack","defense","set_piece","pressing","transition","custom"]).default("custom"),
      homeFormation: z.string(),
      awayFormation: z.string().optional(),
      homePlayers: z.any(),
      awayPlayers: z.any(),
      layers: z.any(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const database = (await getDb())!;
      if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await database.execute(sql`
        INSERT INTO tactical_templates (createdBy,name,category_tt,homeFormation,awayFormation,homePlayers,awayPlayers,layers,description,isSystem)
        VALUES (${ctx.user.id},${input.name},${input.category},${input.homeFormation},${input.awayFormation ?? null},${JSON.stringify(input.homePlayers ?? [])},${JSON.stringify(input.awayPlayers ?? [])},${JSON.stringify(input.layers ?? [])},${input.description ?? null},0)
      `) as any;
      return { success: true, id: (result as any).insertId };
    }),

  // ── AI Analysis ───────────────────────────────────────────────────────────
  analyzeSession: coachProcedure
    .input(z.object({
      sessionId: z.number().optional(),
      homeFormation: z.string(),
      awayFormation: z.string(),
      homeTeamName: z.string().default("Our Team"),
      awayTeamName: z.string().default("Opponent"),
      sessionType: z.string().default("match_prep"),
      notes: z.string().optional(),
      phases: z.array(z.object({ title: z.string(), description: z.string().optional() })).optional(),
    }))
    .mutation(async ({ input }) => {
      const phaseText = input.phases && input.phases.length > 0
        ? `TACTICAL PHASES:\n${input.phases.map((p, i) => `  Phase ${i+1}: ${p.title}${p.description ? " - " + p.description : ""}`).join("\n")}`
        : "";
      const prompt = `You are an elite football tactical analyst. Analyze this tactical setup and provide comprehensive insights.

SESSION TYPE: ${input.sessionType}
HOME TEAM (${input.homeTeamName}): ${input.homeFormation} formation
AWAY TEAM (${input.awayTeamName}): ${input.awayFormation} formation
${input.notes ? `COACH NOTES: ${input.notes}` : ""}
${phaseText}

Provide a JSON response with this exact structure:
{
  "overallAssessment": "2-3 sentence summary",
  "formationMatchup": "Analysis of how the formations interact",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "vulnerabilities": ["vulnerability 1", "vulnerability 2"],
  "keyBattles": ["Key matchup 1", "Key matchup 2", "Key matchup 3"],
  "recommendations": [
    {"phase": "Attacking", "instruction": "specific instruction", "priority": "high"},
    {"phase": "Defending", "instruction": "specific instruction", "priority": "medium"},
    {"phase": "Transitions", "instruction": "specific instruction", "priority": "high"},
    {"phase": "Set Pieces", "instruction": "specific instruction", "priority": "medium"}
  ],
  "pressureTriggers": ["trigger 1", "trigger 2"],
  "setPieceAdvantages": "Brief set piece analysis",
  "substitutionStrategy": "When and how to make changes",
  "successProbability": 72
}

Return ONLY valid JSON.`;
      try {
        const response = await invokeLLM({ messages: [{ role: "user", content: prompt }], max_tokens: 1500 });
        const text = extractText(response);
        const analysis = extractJSON(text);
        return { success: true, analysis };
      } catch {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "AI analysis failed" });
      }
    }),
});
