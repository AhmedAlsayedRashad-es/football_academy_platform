/**
 * REST endpoint: GET /api/sessions
 * Returns all analyzed sessions from the Smart Shoe API,
 * shaped as SessionResponse objects with insights + logs.
 *
 * Spec:
 *   GET /api/sessions → 200 OK → SessionResponse[]
 *
 * SessionResponse:
 *   id        string (UUID)
 *   insights  { total_distance: number, sprints: number, ...any }
 *   logs      Array<{ time, category, event, metrics, isGroupEnd }>
 */
import { Router } from "express";
import https from "https";

const SMART_SHOE_BASE = "https://soccer-kpi-tracker.duckdns.org";

// Allow self-signed cert for this specific API only
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

async function smartShoeGet(path: string): Promise<unknown> {
  const res = await fetch(`${SMART_SHOE_BASE}${path}`, {
    headers: { Accept: "application/json" },
    // @ts-ignore — Node fetch accepts agent
    agent: insecureAgent,
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Smart Shoe API error ${res.status}: ${text}`);
  }
  return res.json();
}

export interface SessionLog {
  time: string;
  category: string;
  event: string;
  metrics: Record<string, unknown>;
  isGroupEnd: boolean;
}

export interface SessionInsights {
  total_distance: number;
  sprints: number;
  [key: string]: unknown;
}

export interface SessionResponse {
  id: string;
  insights: SessionInsights;
  logs: SessionLog[];
}

export function createSessionsRestRouter(): Router {
  const router = Router();

  /**
   * GET /api/sessions
   * Retrieve all analyzed sessions, including their calculated insights and timeline events.
   */
  router.get("/sessions", async (_req, res) => {
    try {
      const data = (await smartShoeGet("/api/sessions")) as SessionResponse[];
      const sessions: SessionResponse[] = Array.isArray(data)
        ? data.map((s: any) => ({
            id: s.id ?? s.session_id ?? "",
            insights: {
              total_distance: Number(s.insights?.total_distance ?? s.insights?.total_distance_m ?? 0),
              sprints: Number(s.insights?.sprints ?? s.insights?.total_sprints ?? 0),
              ...(s.insights ?? {}),
            },
            logs: Array.isArray(s.logs)
              ? s.logs.map((log: any) => ({
                  time: log.time ?? log.timestamp ?? "",
                  category: log.category ?? "",
                  event: log.event ?? log.event_type ?? "",
                  metrics: log.metrics ?? {},
                  isGroupEnd: Boolean(log.isGroupEnd ?? log.is_group_end ?? false),
                }))
              : [],
          }))
        : [];
      res.json(sessions);
    } catch (err: any) {
      console.error("[GET /api/sessions] Error:", err.message);
      res.status(502).json({
        error: "Failed to retrieve sessions from Smart Shoe API",
        detail: err.message,
      });
    }
  });

  /**
   * GET /api/sessions/:id
   * Retrieve a single analyzed session by UUID.
   */
  router.get("/sessions/:id", async (req, res) => {
    const { id } = req.params;
    // Basic UUID validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      res.status(400).json({ error: "Invalid session ID — must be a UUID" });
      return;
    }
    try {
      const s = (await smartShoeGet(`/api/sessions/${id}`)) as any;
      const session: SessionResponse = {
        id: s.id ?? s.session_id ?? id,
        insights: {
          total_distance: Number(s.insights?.total_distance ?? s.insights?.total_distance_m ?? 0),
          sprints: Number(s.insights?.sprints ?? s.insights?.total_sprints ?? 0),
          ...(s.insights ?? {}),
        },
        logs: Array.isArray(s.logs)
          ? s.logs.map((log: any) => ({
              time: log.time ?? log.timestamp ?? "",
              category: log.category ?? "",
              event: log.event ?? log.event_type ?? "",
              metrics: log.metrics ?? {},
              isGroupEnd: Boolean(log.isGroupEnd ?? log.is_group_end ?? false),
            }))
          : [],
      };
      res.json(session);
    } catch (err: any) {
      console.error(`[GET /api/sessions/${id}] Error:`, err.message);
      const status = err.message.includes("404") ? 404 : 502;
      res.status(status).json({
        error: status === 404 ? "Session not found" : "Failed to retrieve session",
        detail: err.message,
      });
    }
  });

  return router;
}
