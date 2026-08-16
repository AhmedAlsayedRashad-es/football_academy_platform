/**
 * Smart Shoe API Router
 * Proxies requests to https://soccer-kpi-tracker.duckdns.org
 * API Docs: See /upload/api_documentation.pdf
 * Note: The API uses a self-signed SSL certificate — we use NODE_TLS_REJECT_UNAUTHORIZED=0
 * scoped to these calls only via a custom https agent.
 */
import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import https from "https";

const SMART_SHOE_BASE = "https://soccer-kpi-tracker.duckdns.org";

// Allow self-signed cert for this specific API only
const insecureAgent = new https.Agent({ rejectUnauthorized: false });

// ─── Helper ──────────────────────────────────────────────────────────────────
async function smartShoeGet(path: string) {
  const res = await fetch(`${SMART_SHOE_BASE}${path}`, {
    headers: { "Accept": "application/json" },
    // @ts-ignore — Node fetch accepts agent
    agent: insecureAgent,
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Smart Shoe API error ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Router ──────────────────────────────────────────────────────────────────
export const smartShoeRouter = router({
  /** Health check — is the Smart Shoe API reachable? */
  healthCheck: protectedProcedure.query(async () => {
    try {
      const data = await smartShoeGet("/");
      return { ok: true, message: data?.message ?? "Connected" };
    } catch (err: any) {
      return { ok: false, message: err?.message ?? "Unreachable" };
    }
  }),

  /** GET /api/players — list all players registered in the Smart Shoe system */
  getPlayers: protectedProcedure.query(async () => {
    try {
      const data = await smartShoeGet("/api/players");
      // data is an array of { id, name, position?, weight_kg?, height_m? }
      return (data as any[]) ?? [];
    } catch {
      return [];
    }
  }),

  /** GET /api/sessions — list all analyzed sessions with insights + logs */
  getSessions: protectedProcedure.query(async () => {
    try {
      const data = await smartShoeGet("/api/sessions");
      return (data as any[]) ?? [];
    } catch {
      return [];
    }
  }),

  /** GET /api/sessions/:id — get a specific session by UUID */
  getSession: protectedProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ input }) => {
      const data = await smartShoeGet(`/api/sessions/${input.sessionId}`);
      return data as any;
    }),

  /**
   * POST /api/analyze-session
   * Accepts a CSV file (base64-encoded) + metadata and forwards to the Smart Shoe API.
   * The CSV must contain columns: Time_s, Ax_raw, Ay_raw, Az_raw, Gx_raw, Gy_raw, Gz_raw
   */
  analyzeSession: protectedProcedure
    .input(
      z.object({
        /** Base64-encoded CSV file content */
        csvBase64: z.string(),
        /** Original filename */
        fileName: z.string().default("sensor_data.csv"),
        /** Player name (matches or creates player in Smart Shoe system) */
        playerName: z.string(),
        /** Playing position */
        position: z.string().optional(),
        /** "Training" | "Match" */
        sessionType: z.enum(["Training", "Match"]).default("Training"),
        /** "Active" | "Battery Low" */
        sensorStatus: z.string().default("Active"),
        /** Optional processing config overrides */
        configs: z
          .object({
            step_peak_height_g: z.number().optional(),
            min_step_interval_s: z.number().optional(),
            jump_impact_g: z.number().optional(),
            impact_strike_g: z.number().optional(),
            impact_pass_g: z.number().optional(),
            running_spm_thresh: z.number().optional(),
            player_weight_kg: z.number().optional(),
            player_height_m: z.number().optional(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Decode base64 CSV to binary
      const csvBuffer = Buffer.from(input.csvBase64, "base64");
      const csvBlob = new Blob([csvBuffer], { type: "text/csv" });

      const formData = new FormData();
      formData.append("file", csvBlob, input.fileName);

      const metadata = {
        playerName: input.playerName,
        position: input.position ?? "",
        sessionType: input.sessionType,
        sensorStatus: input.sensorStatus,
      };
      formData.append("metadata", JSON.stringify(metadata));

      if (input.configs && Object.keys(input.configs).length > 0) {
        formData.append("configs", JSON.stringify(input.configs));
      }

      const res = await fetch(`${SMART_SHOE_BASE}/api/analyze-session`, {
        method: "POST",
        body: formData,
        // Do NOT set Content-Type manually — browser/node sets it with boundary
        // @ts-ignore — Node fetch accepts agent for self-signed cert
        agent: insecureAgent,
        signal: AbortSignal.timeout(30000), // 30s for processing
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Smart Shoe analyze error ${res.status}: ${text}`);
      }

      return (await res.json()) as any;
    }),
});
