/**
 * Smart Shoe API Section
 * Integrates with https://soccer-kpi-tracker.duckdns.org
 * Used inside DeviceIntegrationHub Sync tab
 */
import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

interface Props {
  isAr: boolean;
}

// ── Category colour map ────────────────────────────────────────────────────────
const catColor: Record<string, { badge: string; row: string; dot: string }> = {
  Sprint:       { badge: "text-yellow-300 bg-yellow-400/15 border-yellow-400/40",  row: "border-yellow-400/20 bg-yellow-400/5",  dot: "bg-yellow-400" },
  Jump:         { badge: "text-blue-300   bg-blue-400/15   border-blue-400/40",    row: "border-blue-400/20   bg-blue-400/5",    dot: "bg-blue-400" },
  Pass:         { badge: "text-green-300  bg-green-400/15  border-green-400/40",   row: "border-green-400/20  bg-green-400/5",   dot: "bg-green-400" },
  Step:         { badge: "text-white/60   bg-gray-400/15   border-gray-400/40",    row: "border-gray-400/20   bg-gray-400/5",    dot: "bg-white/10" },
  Acceleration: { badge: "text-orange-300 bg-orange-400/15 border-orange-400/40",  row: "border-orange-400/20 bg-orange-400/5",  dot: "bg-orange-400" },
  Deceleration: { badge: "text-red-300    bg-red-400/15    border-red-400/40",     row: "border-red-400/20    bg-red-400/5",     dot: "bg-red-400" },
  Turn:         { badge: "text-purple-300 bg-purple-400/15 border-purple-400/40",  row: "border-purple-400/20 bg-purple-400/5",  dot: "bg-purple-400" },
  Strike:       { badge: "text-pink-300   bg-pink-400/15   border-pink-400/40",    row: "border-pink-400/20   bg-pink-400/5",    dot: "bg-pink-400" },
};
const defaultCat = { badge: "text-white/60 bg-gray-400/15 border-gray-400/40", row: "border-gray-400/20 bg-gray-400/5", dot: "bg-white/10" };

const catEmoji: Record<string, string> = {
  Sprint: "⚡", Jump: "🦘", Pass: "⚽", Step: "👣",
  Acceleration: "🚀", Deceleration: "🛑", Turn: "🔄", Strike: "🥊",
};

// ── Insight icon map ───────────────────────────────────────────────────────────
const insightIcons: Record<string, string> = {
  Total_Distance_m: "📏", Total_Sprints: "⚡", Jumps: "🦘",
  Total_Passes: "⚽", Total_Touches: "👟", Top_Speed_kph: "💨",
  Work_Calories_kcal: "🔥", Valid_Steps: "👣", Total_Strikes: "🥊",
  Total_Turns: "🔄", Turns_With_Ball: "⚽", Total_Accelerations: "🚀",
  Total_Decelerations: "🛑", Total_Possessions: "🏃", Total_Possession_Time_s: "⏱️",
  Raw_Steps: "👣", total_distance: "📏", sprints: "⚡",
};

function insightCards(insights: Record<string, any>) {
  return Object.entries(insights)
    .filter(([, val]) => val !== 0 && val !== 0.0 && val !== null && val !== undefined)
    .map(([key, val]) => ({
      key,
      icon: insightIcons[key] ?? "📊",
      label: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      value: typeof val === "number"
        ? (Number.isInteger(val) ? String(val) : val.toFixed(2))
        : String(val),
    }));
}

// ── Session Detail Modal ───────────────────────────────────────────────────────
function SessionDetailModal({
  session,
  isAr,
  onClose,
}: {
  session: any;
  isAr: boolean;
  onClose: () => void;
}) {
  const cards = insightCards(session.insights ?? {});
  const logs: any[] = session.logs ?? [];
  const categories = ["All", ...Array.from(new Set(logs.map((l) => l.category).filter(Boolean)))];
  const [activeCategory, setActiveCategory] = useState("All");

  const filteredLogs = activeCategory === "All"
    ? logs
    : logs.filter((l) => l.category === activeCategory);

  // Count per category
  const catCount = logs.reduce<Record<string, number>>((acc, l) => {
    if (l.category) acc[l.category] = (acc[l.category] ?? 0) + 1;
    return acc;
  }, {});

  // Key insight highlights
  const highlights = [
    { icon: "📏", label: isAr ? "المسافة" : "Distance",
      value: session.insights?.Total_Distance_m
        ? `${(Number(session.insights.Total_Distance_m) / 1000).toFixed(2)} km`
        : session.insights?.total_distance
          ? `${Number(session.insights.total_distance).toFixed(2)} km`
          : "—" },
    { icon: "⚡", label: isAr ? "العدوات" : "Sprints",
      value: String(session.insights?.Total_Sprints ?? session.insights?.sprints ?? "—") },
    { icon: "💨", label: isAr ? "أقصى سرعة" : "Top Speed",
      value: session.insights?.Top_Speed_kph
        ? `${Number(session.insights.Top_Speed_kph).toFixed(1)} kph`
        : "—" },
    { icon: "🔥", label: isAr ? "سعرات" : "Calories",
      value: session.insights?.Work_Calories_kcal
        ? `${Math.round(Number(session.insights.Work_Calories_kcal))} kcal`
        : "—" },
    { icon: "⚽", label: isAr ? "لمسات" : "Touches",
      value: String(session.insights?.Total_Touches ?? "—") },
    { icon: "🦘", label: isAr ? "قفزات" : "Jumps",
      value: String(session.insights?.Jumps ?? "—") },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: "linear-gradient(135deg,#0d1b2a 0%,#0f2235 100%)", border: "1px solid rgba(255,255,255,0.12)" }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-white font-black text-base">
              📋 {isAr ? "تفاصيل الجلسة" : "Session Details"}
            </h2>
            <p className="text-white/60 text-xs mt-0.5 font-mono">
              ID: {session.id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white flex items-center justify-center transition-all text-sm font-bold"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Highlight strip ── */}
          <div className="grid grid-cols-3 gap-2">
            {highlights.map((h) => (
              <div key={h.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/8">
                <p className="text-xl mb-1">{h.icon}</p>
                <p className="text-white font-black text-sm">{h.value}</p>
                <p className="text-white/60 text-xs mt-0.5">{h.label}</p>
              </div>
            ))}
          </div>

          {/* ── Full insights grid ── */}
          {cards.length > 0 && (
            <div>
              <h3 className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-3">
                {isAr ? "جميع المؤشرات" : "All Calculated Insights"}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {cards.map((c) => (
                  <div key={c.key} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5 border border-white/8">
                    <span className="text-lg flex-shrink-0">{c.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white/60 text-xs truncate">{c.label}</p>
                      <p className="text-white font-bold text-sm">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Timeline ── */}
          {logs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white/60 text-xs font-semibold uppercase tracking-widest">
                  {isAr ? "أحداث الجلسة" : "Timeline Events"}
                  <span className="ml-2 text-gray-600 normal-case">({filteredLogs.length})</span>
                </h3>
              </div>

              {/* Category filter tabs */}
              <div className="flex gap-1.5 flex-wrap mb-3">
                {categories.map((cat) => {
                  const colors = cat === "All" ? null : catColor[cat] ?? defaultCat;
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all ${
                        isActive
                          ? colors
                            ? colors.badge
                            : "text-white bg-white/15 border-white/30"
                          : "text-white/60 bg-white/5 border-white/10 hover:border-white/20 hover:text-white"
                      }`}
                    >
                      {cat !== "All" && <span>{catEmoji[cat] ?? "📌"}</span>}
                      {cat === "All" ? (isAr ? "الكل" : "All") : cat}
                      {cat !== "All" && catCount[cat] && (
                        <span className="opacity-60">({catCount[cat]})</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Event rows */}
              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {filteredLogs.map((log, i) => {
                  const colors = catColor[log.category] ?? defaultCat;
                  return (
                    <div
                      key={i}
                      className={`flex items-start gap-3 px-3 py-2.5 rounded-xl border ${colors.row}`}
                    >
                      {/* Time */}
                      <div className="flex-shrink-0 flex flex-col items-center gap-1 pt-0.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
                        <span className="text-gray-600 text-xs font-mono leading-none">
                          {log.time ?? "—"}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md border ${colors.badge}`}>
                            {catEmoji[log.category] ?? "📌"} {log.category}
                          </span>
                          {log.isGroupEnd && (
                            <span className="text-gray-600 text-xs italic">
                              {isAr ? "نهاية المجموعة" : "Group End"}
                            </span>
                          )}
                        </div>
                        <p className="text-white text-xs font-medium">{log.event}</p>
                        {log.metrics && Object.keys(log.metrics).length > 0 && (
                          <p className="text-white/60 text-xs mt-0.5">
                            {Object.entries(log.metrics)
                              .map(([k, v]) => `${k.replace(/_/g, " ")}: ${typeof v === "number" ? (Number.isInteger(v) ? v : Number(v).toFixed(2)) : v}`)
                              .join("  ·  ")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {logs.length === 0 && (
            <p className="text-gray-600 text-sm text-center py-6">
              {isAr ? "لا توجد أحداث في هذه الجلسة" : "No timeline events for this session"}
            </p>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-white/10 flex-shrink-0 flex items-center justify-between">
          <p className="text-gray-600 text-xs">
            {logs.length} {isAr ? "حدث" : "events"} · {cards.length} {isAr ? "مؤشر" : "insights"}
          </p>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white/60 text-xs font-semibold transition-all"
          >
            {isAr ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function SmartShoeAPISection({ isAr }: Props) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedShoePlayer, setSelectedShoePlayer] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [uploadPlayerName, setUploadPlayerName] = useState("");
  const [uploadPosition, setUploadPosition] = useState("Forward");
  const [uploadSessionType, setUploadSessionType] = useState<"Training" | "Match">("Training");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // ── tRPC queries ───────────────────────────────────────────────────────────
  const { data: apiHealth } = trpc.smartShoe.healthCheck.useQuery(undefined, {
    retry: 1,
    staleTime: 30_000,
  });

  const {
    data: shoePlayers,
    isLoading: loadingPlayers,
    refetch: refetchPlayers,
  } = trpc.smartShoe.getPlayers.useQuery(undefined, {
    retry: 1,
    staleTime: 60_000,
  });

  const {
    data: shoeSessions,
    isLoading: loadingSessions,
    refetch: refetchSessions,
  } = trpc.smartShoe.getSessions.useQuery(undefined, {
    retry: 1,
    staleTime: 30_000,
  });

  const analyzeSession = trpc.smartShoe.analyzeSession.useMutation({
    onSuccess: (data) => {
      toast({
        title: isAr ? "تم تحليل الجلسة بنجاح" : "Session Analyzed Successfully",
        description: isAr
          ? `المسافة: ${data?.insights?.total_distance ?? "-"} كم | العدوات: ${data?.insights?.sprints ?? "-"}`
          : `Distance: ${data?.insights?.total_distance ?? "-"} km | Sprints: ${data?.insights?.sprints ?? "-"}`,
      });
      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      refetchSessions();
      refetchPlayers();
      // Auto-open the detail modal for the freshly analyzed session
      setSelectedSession(data);
    },
    onError: (err) => {
      toast({
        title: isAr ? "خطأ في التحليل" : "Analysis Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setCsvFile(f);
  };

  const handleUpload = async () => {
    if (!csvFile || !uploadPlayerName.trim()) {
      toast({
        title: isAr ? "بيانات ناقصة" : "Missing Data",
        description: isAr ? "يرجى اختيار ملف CSV وإدخال اسم اللاعب" : "Please select a CSV file and enter player name",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);
    try {
      const arrayBuffer = await csvFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      await analyzeSession.mutateAsync({
        csvBase64: base64,
        fileName: csvFile.name,
        playerName: uploadPlayerName.trim(),
        position: uploadPosition,
        sessionType: uploadSessionType,
        sensorStatus: "Active",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Session detail modal — rendered via portal so it escapes any overflow:hidden containers */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          isAr={isAr}
          onClose={() => setSelectedSession(null)}
        />
      )}

      <div className="space-y-4">
        {/* ── Header card ── */}
        <div className="bg-gradient-to-br from-emerald-900/40 to-teal-900/30 rounded-2xl p-5 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-white font-black text-base">
                👟 {isAr ? "محلل الحذاء الذكي" : "Smart Shoe Tracker API"}
              </h3>
              <p className="text-white/60 text-xs mt-0.5">
                soccer-kpi-tracker.duckdns.org
              </p>
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                apiHealth?.ok
                  ? "bg-green-500/10 border-green-500/30 text-green-400"
                  : "bg-red-500/10 border-red-500/30 text-red-400"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  apiHealth?.ok ? "bg-green-400 animate-pulse" : "bg-red-400"
                }`}
              />
              {apiHealth?.ok
                ? isAr ? "متصل" : "Connected"
                : isAr ? "غير متصل" : "Offline"}
            </div>
          </div>
        </div>

        {/* ── Players from Smart Shoe API ── */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-bold text-sm">
              🏃 {isAr ? "اللاعبون المسجلون" : "Registered Players"}
            </h4>
            <button
              onClick={() => refetchPlayers()}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isAr ? "تحديث" : "Refresh"}
            </button>
          </div>
          {loadingPlayers ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            </div>
          ) : shoePlayers && shoePlayers.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {shoePlayers.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedShoePlayer(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    selectedShoePlayer === p.id
                      ? "border-emerald-400 bg-emerald-400/10"
                      : "border-white/10 bg-white/5 hover:border-white/20"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm flex-shrink-0">
                    {(p.name ?? "?")[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-white/60 text-xs">
                      {p.position ?? "—"}{p.weight_kg ? ` · ${p.weight_kg} kg` : ""}
                      {p.height_m ? ` · ${p.height_m} m` : ""}
                    </p>
                  </div>
                  {selectedShoePlayer === p.id && (
                    <span className="text-emerald-400 text-xs font-semibold flex-shrink-0">
                      {isAr ? "محدد" : "Selected"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-white/60 text-xs text-center py-4">
              {isAr ? "لا يوجد لاعبون مسجلون بعد" : "No players registered yet"}
            </p>
          )}
        </div>

        {/* ── Sessions from Smart Shoe API ── */}
        <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-white font-bold text-sm">
              📊 {isAr ? "الجلسات المحللة" : "Analyzed Sessions"}
            </h4>
            <button
              onClick={() => refetchSessions()}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              {isAr ? "تحديث" : "Refresh"}
            </button>
          </div>
          {loadingSessions ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            </div>
          ) : shoeSessions && shoeSessions.length > 0 ? (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {shoeSessions.map((s: any) => {
                const isExpanded = expandedSession === s.id;
                const cards = insightCards(s.insights ?? {});
                return (
                  <div
                    key={s.id}
                    className="border border-white/10 rounded-xl overflow-hidden"
                  >
                    {/* Use div instead of button to avoid nested <button> inside <button> */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedSession(isExpanded ? null : s.id)}
                      onKeyDown={(e) => e.key === "Enter" && setExpandedSession(isExpanded ? null : s.id)}
                      className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/8 transition-all text-left cursor-pointer"
                    >
                      <span className="text-lg">📋</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-xs font-semibold truncate">
                          {isAr ? "جلسة" : "Session"} #{s.id.slice(0, 8)}…
                        </p>
                        <p className="text-white/60 text-xs">
                          {cards.slice(0, 3).map((c) => `${c.icon} ${c.value}`).join(" · ")}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedSession(s); }}
                          className="text-xs bg-blue-500/20 border border-blue-500/30 text-blue-400 px-2 py-1 rounded-lg hover:bg-blue-500/30 transition-all"
                        >
                          {isAr ? "عرض" : "View"}
                        </button>
                        <span className="text-white/60 text-xs self-center">
                          {isExpanded ? "▲" : "▼"}
                        </span>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="p-3 bg-black/20 border-t border-white/5">
                        <div className="grid grid-cols-3 gap-2">
                          {cards.map((c) => (
                            <div key={c.key} className="bg-white/5 rounded-lg p-2 text-center">
                              <p className="text-lg">{c.icon}</p>
                              <p className="text-white text-sm font-bold">{c.value}</p>
                              <p className="text-white/60 text-xs leading-tight">{c.label}</p>
                            </div>
                          ))}
                        </div>
                        {/* Open full modal from expanded state too */}
                        <button
                          onClick={() => setSelectedSession(s)}
                          className="mt-3 w-full py-2 rounded-xl text-xs font-semibold border border-blue-500/30 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 transition-all"
                        >
                          {isAr ? "عرض الجلسة الكاملة" : "View Full Session Details"}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-white/60 text-xs text-center py-4">
              {isAr ? "لا توجد جلسات محللة بعد" : "No analyzed sessions yet"}
            </p>
          )}
        </div>

        {/* ── CSV Upload ── */}
        <div className="bg-gradient-to-br from-purple-900/30 to-indigo-900/20 rounded-2xl p-5 border border-purple-500/30">
          <h4 className="text-white font-bold text-sm mb-4">
            📤 {isAr ? "رفع بيانات المستشعر (CSV)" : "Upload Sensor Data (CSV)"}
          </h4>
          <p className="text-white/60 text-xs mb-4">
            {isAr
              ? "أعمدة مطلوبة: Time_s, Ax_raw, Ay_raw, Az_raw, Gx_raw, Gy_raw, Gz_raw"
              : "Required columns: Time_s, Ax_raw, Ay_raw, Az_raw, Gx_raw, Gy_raw, Gz_raw"}
          </p>

          {/* Player name */}
          <div className="mb-3">
            <label className="text-white/60 text-xs mb-1 block">
              {isAr ? "اسم اللاعب" : "Player Name"}
            </label>
            <input
              type="text"
              value={uploadPlayerName}
              onChange={(e) => setUploadPlayerName(e.target.value)}
              placeholder={isAr ? "أدخل اسم اللاعب..." : "Enter player name..."}
              className="w-full bg-white/10 border border-white/20 text-white text-sm px-3 py-2 rounded-xl outline-none placeholder-gray-600 focus:border-purple-400 transition-colors"
            />
          </div>

          {/* Position + Session Type */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-white/60 text-xs mb-1 block">
                {isAr ? "المركز" : "Position"}
              </label>
              <select
                value={uploadPosition}
                onChange={(e) => setUploadPosition(e.target.value)}
                className="w-full bg-white/10 border border-white/20 text-white text-sm px-3 py-2 rounded-xl outline-none focus:border-purple-400 transition-colors"
              >
                {["Forward", "Midfielder", "Defender", "Goalkeeper"].map((p) => (
                  <option key={p} value={p} className="bg-white/5">
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-white/60 text-xs mb-1 block">
                {isAr ? "نوع الجلسة" : "Session Type"}
              </label>
              <div className="flex gap-2">
                {(["Training", "Match"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setUploadSessionType(t)}
                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      uploadSessionType === t
                        ? "border-purple-400 bg-purple-400/20 text-purple-300"
                        : "border-white/10 bg-white/5 text-white/60"
                    }`}
                  >
                    {t === "Training" ? (isAr ? "تدريب" : "Training") : isAr ? "مباراة" : "Match"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* File picker */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all mb-3 ${
              csvFile
                ? "border-purple-400 bg-purple-400/10"
                : "border-white/20 hover:border-purple-400/50 hover:bg-white/5"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            {csvFile ? (
              <div>
                <p className="text-purple-300 text-sm font-semibold">✅ {csvFile.name}</p>
                <p className="text-white/60 text-xs mt-1">
                  {(csvFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-white/60 text-sm">
                  {isAr ? "اضغط لاختيار ملف CSV" : "Click to select CSV file"}
                </p>
                <p className="text-gray-600 text-xs mt-1">
                  {isAr ? "بيانات المستشعر الخام" : "Raw sensor data"}
                </p>
              </div>
            )}
          </div>

          {/* Upload button */}
          <button
            onClick={handleUpload}
            disabled={isUploading || !csvFile || !uploadPlayerName.trim()}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              background:
                !isUploading && csvFile && uploadPlayerName.trim()
                  ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                  : "rgba(255,255,255,0.05)",
              color: "white",
            }}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {isAr ? "جاري التحليل..." : "Analyzing..."}
              </>
            ) : (
              <>
                <span>🚀</span>
                {isAr ? "رفع وتحليل البيانات" : "Upload & Analyze"}
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
