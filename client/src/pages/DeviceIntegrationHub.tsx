/**
 * Smart Shoe Pro — Device Integration Hub
 * Redesigned with:
 *  - Bluetooth auto-sync flow (simulated, mirrors real app)
 *  - All metrics from Smart Shoe app videos
 *  - Premium dark navy UI with framer-motion animations
 *  - Session comparison vs previous session & pro benchmarks
 *  - PDF export
 *  - Jump Impact Distribution, Impact Zone, Calories, Sprint Fatigue,
 *    Possession Chain, Agility Symmetry, Work-to-Rest Ratio, Intensity Over Time
 */
import React, { useState, useRef, useCallback, useEffect } from "react";
import SmartShoeAPISection from "@/components/SmartShoeAPISection";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  Bluetooth, LayoutDashboard, Zap, Dumbbell, TrendingUp,
  Footprints, CircleDot, ClipboardList, Trophy, GraduationCap,
  type LucideIcon,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, AreaChart, Area,
  ScatterChart, Scatter, ZAxis, Cell, ReferenceLine,
} from "recharts";

// ─── Pro Benchmarks ───────────────────────────────────────────────────────────
const PRO: Record<string, number> = {
  totalTurns: 120, turnsWithBall: 60, avgEntrySpeedKph: 12,
  topSpeedKph: 28, totalSprints: 25, sprintDistanceM: 800,
  kickingPowerKph: 80, totalAccelerations: 40, jumps: 20,
  totalDistanceKm: 5.5, workCalories: 500, activeTimePct: 75,
  oneTouchPossessions: 120, multiTouchPossessions: 60,
};

// ─── Colour palette ───────────────────────────────────────────────────────────
const C = {
  blue: "#3b82f6", green: "#22c55e", amber: "#f59e0b",
  red: "#ef4444", purple: "#a855f7", cyan: "#06b6d4",
  orange: "#f97316", pink: "#ec4899",
};

// ─── Tiny helpers ─────────────────────────────────────────────────────────────
const n = (v: any, d: number = 0): number => (v !== undefined && v !== null ? Number(v) : d);
const pct = (a: number, b: number) => (a + b > 0 ? Math.round((a / (a + b)) * 100) : 0);

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp: Variants = {
  enter: { opacity: 0, y: 18 },
  center: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.16 } },
};
const slideX = (dir: number) => ({
  enter: { x: dir > 0 ? 56 : -56, opacity: 0 },
  center: { x: 0, opacity: 1, transition: { type: "spring", stiffness: 320, damping: 30 } },
  exit: { x: dir > 0 ? -56 : 56, opacity: 0, transition: { duration: 0.16 } },
});

// ─── Circular Gauge ───────────────────────────────────────────────────────────
function CircularGauge({ value, size = 110, strokeWidth = 9, color, label }: {
  value: number; size?: number; strokeWidth?: number; color: string; label: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(value / 100, 1) * circ * 0.75;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(135deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e2d40"
            strokeWidth={strokeWidth} strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeLinecap="round" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circ - dash + circ * 0.25}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.9s cubic-bezier(.4,0,.2,1)", filter: `drop-shadow(0 0 6px ${color}88)` }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-white font-black" style={{ fontSize: size * 0.22 }}>{value}</span>
        </div>
      </div>
      <span className="text-white/60 text-xs font-semibold text-center leading-tight">{label}</span>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, unit, sub, color, delta }: {
  icon: string; label: string; value: string | number; unit?: string;
  sub?: string; color?: string; delta?: number | null;
}) {
  return (
    <div className="bg-white/5 rounded-2xl p-4 border border-white/8 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-xl">{icon}</span>
        {delta != null && (
          <span className={`text-xs font-bold ${delta >= 0 ? "text-green-400" : "text-red-400"}`}>
            {delta >= 0 ? "▲" : "▼"}{Math.abs(delta).toFixed(0)}
          </span>
        )}
      </div>
      <div className="text-white/60 text-xs">{label}</div>
      <div className="flex items-end gap-1">
        <span className="text-white font-black text-2xl" style={color ? { color } : {}}>{value}</span>
        {unit && <span className="text-white/60 text-xs mb-0.5">{unit}</span>}
      </div>
      {sub && <div className="text-white/60 text-xs">{sub}</div>}
    </div>
  );
}

// ─── Metric Row ───────────────────────────────────────────────────────────────
function MetricRow({ icon, label, value, unit, prevVal, proVal }: {
  icon: string; label: string; value: string | number; unit?: string;
  prevVal?: number | null; proVal?: number | null;
}) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <span className="text-lg w-6">{icon}</span>
        <span className="text-white/60 text-sm">{label}</span>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        <span className="text-white font-black text-lg">{value}</span>
        {unit && <span className="text-white/60 text-xs">{unit}</span>}
        {prevVal != null && !isNaN(num) && (() => {
          const d = num - prevVal;
          return <span className={`text-xs font-bold ${d >= 0 ? "text-green-400" : "text-red-400"}`}>{d >= 0 ? "▲" : "▼"}{Math.abs(d).toFixed(1)}</span>;
        })()}
        {proVal != null && !isNaN(num) && (
          <span className="text-xs text-yellow-400">{num >= proVal ? "✅" : `/${proVal}`}</span>
        )}
      </div>
    </div>
  );
}

// ─── Pro Benchmark Bar ────────────────────────────────────────────────────────
function BenchBar({ label, val, pro, unit }: { label: string; val: number; pro: number; unit?: string }) {
  const reached = val >= pro;
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/60">{label}</span>
        <span className={reached ? "text-green-400 font-bold" : "text-orange-400"}>
          {val.toFixed(1)}{unit} / {pro}{unit} {reached ? "✅" : ""}
        </span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${reached ? "bg-green-500" : "bg-orange-500"}`}
          style={{ width: `${Math.min(val / pro, 1.2) * 100}%` }} />
      </div>
    </div>
  );
}

// ─── Tooltip Component ───────────────────────────────────────────────────────
function MetricTooltip({ text, isAr }: { text: string; isAr: boolean }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onTouchStart={() => setShow(v => !v)}
        className="w-4 h-4 rounded-full bg-white/10 border border-white/20 text-white/60 text-xs flex items-center justify-center hover:bg-white/20 transition-all"
      >?</button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className={`absolute z-50 bottom-6 ${isAr ? 'right-0' : 'left-0'} w-52 bg-white/5 border border-white/20 rounded-xl p-3 shadow-2xl`}
          >
            <p className="text-white text-xs leading-relaxed">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Daily Goals Panel ────────────────────────────────────────────────────────
function DailyGoalsPanel({ isAr, ins, latestSession, trendData, goals: externalGoals }: { isAr: boolean; ins: Record<string, any>; latestSession: any; trendData: any[]; goals: { calories: number; maxSpeed: number; sprints: number; touches: number; distance: number } }) {
  const n = (v: any, d: number = 0): number => (v !== undefined && v !== null ? Number(v) : d);
  const [goals, setGoals] = useState(externalGoals ?? {
    calories: 500, maxSpeed: 28, sprints: 20, touches: 150, distance: 5000,
  });
  const [editing, setEditing] = useState(false);
  const [trendMetric, setTrendMetric] = useState<"calories" | "sprints" | "touches">("calories");
  const [draft, setDraft] = useState({ ...goals });
  const actual = {
    calories: Math.round(n(ins.work_calories_kcal, latestSession?.workCaloriesKcal ?? 0)),
    maxSpeed: n(ins.top_speed_kph, Number(latestSession?.topSpeedKph ?? 0)),
    sprints: n(ins.total_sprints, latestSession?.totalSprints ?? 0),
    touches: n(ins.total_touches, latestSession?.totalTouches ?? 0),
    distance: n(ins.total_distance_m, Number(latestSession?.totalDistanceM ?? 0)),
  };
  const items = [
    { key: 'calories' as const, icon: '🔥', label: isAr ? 'سعرات' : 'Calories', unit: 'kcal', color: '#f59e0b' },
    { key: 'maxSpeed' as const, icon: '💨', label: isAr ? 'أقصى سرعة' : 'Max Speed', unit: 'kph', color: '#06b6d4' },
    { key: 'sprints' as const, icon: '⚡', label: isAr ? 'عدوات' : 'Sprints', unit: '#', color: '#3b82f6' },
    { key: 'touches' as const, icon: '⚽', label: isAr ? 'لمسات' : 'Touches', unit: '#', color: '#22c55e' },
    { key: 'distance' as const, icon: '📏', label: isAr ? 'مسافة' : 'Distance', unit: 'm', color: '#a855f7' },
  ];
  return (
    <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-sm">🎯 {isAr ? 'الأهداف اليومية' : 'Daily Goals'}</h3>
        <button onClick={() => { if (editing) setGoals(draft); setEditing(v => !v); }}
          className="text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/40 text-blue-400 hover:bg-blue-500/10 transition-all">
          {editing ? (isAr ? 'حفظ' : 'Save') : (isAr ? 'تعديل' : 'Edit')}
        </button>
      </div>
      <div className="space-y-3">
        {items.map(item => {
          const pct = Math.min((actual[item.key] / goals[item.key]) * 100, 100);
          const done = actual[item.key] >= goals[item.key];
          return (
            <div key={item.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span>{item.icon}</span>
                  <span className="text-white/60 text-xs">{item.label}</span>
                  {done && <span className="text-green-400 text-xs">✅</span>}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs" style={{ color: item.color }}>
                    {item.key === 'distance' ? (actual[item.key] / 1000).toFixed(1) + ' km' : actual[item.key].toFixed(item.key === 'maxSpeed' ? 1 : 0) + ' ' + item.unit}
                  </span>
                  <span className="text-white/60 text-xs">/ </span>
                  {editing ? (
                    <input type="number" value={draft[item.key]}
                      onChange={e => setDraft(d => ({ ...d, [item.key]: Number(e.target.value) }))}
                      className="w-16 bg-white/10 border border-white/20 text-white text-xs text-center rounded-lg px-1 py-0.5 outline-none" />
                  ) : (
                    <span className="text-white/60 text-xs">
                      {item.key === 'distance' ? (goals[item.key] / 1000).toFixed(1) + ' km' : goals[item.key] + ' ' + item.unit}
                    </span>
                  )}
                </div>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full"
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  style={{ background: done ? '#22c55e' : item.color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Bluetooth Sync Panel ───────────────────────────────────────────────────
function BluetoothSyncPanel({ onSynced, isAr, selectedPlayerId, sessionType, setSessionType, durationMinutes, setDurationMinutes }: {
  onSynced: (data: Record<string, any>) => void;
  isAr: boolean; selectedPlayerId: number | null;
  sessionType: string; setSessionType: (v: any) => void;
  durationMinutes: number; setDurationMinutes: (v: number) => void;
}) {
  const [stage, setStage] = useState<"idle" | "scanning" | "connecting" | "syncing" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [battery, setBattery] = useState<number | null>(null);
  const [signal, setSignal] = useState<string | null>(null);
  const [memKb, setMemKb] = useState<number | null>(null);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const { toast } = useToast();

  const startSync = () => {
    if (!selectedPlayerId) {
      toast({ title: isAr ? "اختر لاعباً أولاً" : "Select a player first", variant: "destructive" });
      return;
    }
    setStage("scanning"); setProgress(0);
    // Simulate BT scan → connect → sync
    setTimeout(() => { setStage("connecting"); setProgress(20); }, 1200);
    setTimeout(() => { setStage("syncing"); setProgress(45); setBattery(94); setSignal("STRONG"); }, 2600);
    let p = 45;
    const interval = setInterval(() => {
      p += Math.random() * 8 + 4;
      if (p >= 100) {
        p = 100; clearInterval(interval);
        setMemKb(19.92); setMatchCount(20);
        setStage("done"); setProgress(100);
        // Build demo session data matching the Smart Shoe app output
        const demoData = {
          total_touches: 516, total_strikes: 42, total_passes: 38,
          total_possessions: 164, total_possession_time_min: 27.2,
          avg_possession_duration_s: 9.9, total_sprints: 18,
          total_turns: 28, turns_with_ball: 15,
          avg_turn_entry_speed_ms: 3.8 / 3.6, max_turn_entry_speed_ms: 6.1 / 3.6,
          left_turns: 16, right_turns: 9, back_turns: 3, intense_turns: 7,
          avg_turn_exit_speed_ms: 2.9 / 3.6,
          total_accelerations: 32, total_decelerations: 28,
          total_distance_m: 4850.2, sprint_distance_m: 620,
          valid_steps: 6800, jumps: 12, work_calories_kcal: 420.5,
          active_time_percent: 68.5, work_rate_per_min: 107.8,
          sprint_with_ball_count: 5, sprint_without_ball_count: 13,
          top_speed_kph: 25.4, kicking_power_kph: 56.5,
          first_step_accelerations: 18, intense_accelerations: 9,
          left_foot_touches: 210, right_foot_touches: 306,
          left_foot_releases: 88, right_foot_releases: 120,
          left_foot_kicking_power: 48.2, right_foot_kicking_power: 62.1,
          laces_releases: 68, inside_releases: 78, other_releases: 7,
          one_touch_possessions: 113, multi_touch_possessions: 51,
          multi_touch_duration_s: 18.4,
          // Extra metrics from video
          jump_impact_4_6g: 5, jump_impact_6_8g: 4, jump_impact_8_10g: 2, jump_impact_10g_plus: 1,
          sprint_fatigue: [
            { t: 5, spd: 7.1 }, { t: 15, spd: 7.4 }, { t: 25, spd: 6.9 },
            { t: 35, spd: 6.5 }, { t: 45, spd: 6.0 },
          ],
          intensity_segments: [
            { seg: 1, load: 72 }, { seg: 2, load: 85 }, { seg: 3, load: 68 },
            { seg: 4, load: 91 }, { seg: 5, load: 60 },
          ],
          possession_chain: [
            { touches: "1-touch", freq: 113 }, { touches: "2-touch", freq: 34 }, { touches: "3+touch", freq: 17 },
          ],
          accel_decel_scatter: [
            { accel: 2.1, decel: -2.4 }, { accel: 2.8, decel: -3.1 }, { accel: 1.9, decel: -2.0 },
            { accel: 3.2, decel: -2.7 }, { accel: 2.5, decel: -1.8 }, { accel: 1.7, decel: -3.3 },
          ],
          work_rest_ratio: [
            { t: 5, active: 1, rest: 0 }, { t: 10, active: 0, rest: 1 }, { t: 15, active: 1, rest: 0 },
            { t: 20, active: 1, rest: 0 }, { t: 25, active: 0, rest: 1 }, { t: 30, active: 1, rest: 0 },
            { t: 35, active: 1, rest: 0 }, { t: 40, active: 0, rest: 1 }, { t: 45, active: 1, rest: 0 },
          ],
          // Agility symmetry (left vs right turn entry speed)
          agility_symmetry: [
            { axis: "Left Entry Spd", val: 3.6 }, { axis: "Right Entry Spd", val: 4.1 },
            { axis: "Left Freq", val: 57 }, { axis: "Right Freq", val: 32 },
            { axis: "Intense Turns", val: 25 }, { axis: "With Ball", val: 54 },
          ],
          // Impact zone (foot strike zones as %)
          impact_zone: { laces: 40, inside: 46, outside: 8, heel: 6 },
          // Kicking power scatter
          kicking_scatter: [
            { type: "Pass-Inside", power: 115, peakG: 9.5 },
            { type: "Pass-Outside", power: 140, peakG: 11.2 },
            { type: "Pass-Heel", power: 85, peakG: 6.5 },
            { type: "Strike-Laces", power: 210, peakG: 18 },
            { type: "Strike-Inside", power: 175, peakG: 14.2 },
          ],
        };
        onSynced(demoData);
      } else {
        setProgress(Math.round(p));
      }
    }, 180);
  };

  const stageLabel: Record<string, string> = {
    idle: isAr ? "جاهز للمزامنة" : "Ready to Sync",
    scanning: isAr ? "جاري البحث عن الجهاز..." : "Scanning for device...",
    connecting: isAr ? "جاري الاتصال..." : "Connecting...",
    syncing: isAr ? "جاري مزامنة البيانات..." : "Syncing data...",
    done: isAr ? "اكتملت المزامنة ✅" : "Sync Complete ✅",
    error: isAr ? "فشل الاتصال" : "Connection failed",
  };

  return (
    <div className="space-y-4">
      {/* Session config */}
      <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
        <h3 className="text-white font-bold text-sm mb-4">⚙️ {isAr ? "إعداد الجلسة" : "Session Setup"}</h3>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { v: "training", label: isAr ? "تدريب" : "Training", icon: Footprints },
            { v: "match", label: isAr ? "مباراة" : "Match", icon: CircleDot },
            { v: "assessment", label: isAr ? "تقييم" : "Assessment", icon: ClipboardList },
          ].map(opt => (
            <button key={opt.v} onClick={() => setSessionType(opt.v)}
              className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                sessionType === opt.v ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/5 hover:border-white/30"
              }`}>
              <opt.icon className="h-6 w-6" />
              <span className="text-xs font-semibold text-white">{opt.label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label className="text-white/60 text-xs flex-shrink-0">{isAr ? "المدة (دقيقة)" : "Duration (min)"}</label>
          <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))}
            className="flex-1 bg-white/10 border border-white/20 text-white text-center text-lg font-bold h-10 rounded-xl outline-none" />
        </div>
      </div>

      {/* BT Sync card */}
      <div className="brand-gradient-subtle rounded-2xl p-6 border border-blue-500/30">
        {/* Device icon */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl border-4 ${
              stage === "done" ? "border-green-400 bg-green-400/10" :
              stage === "error" ? "border-red-400 bg-red-400/10" :
              stage === "idle" ? "border-blue-500/40 bg-blue-500/10" :
              "border-blue-400 bg-blue-400/10"
            }`}>
              {stage === "done" ? "✅" : stage === "error" ? "❌" : "👟"}
            </div>
            {(stage === "scanning" || stage === "connecting" || stage === "syncing") && (
              <div className="absolute inset-0 rounded-full border-4 border-blue-400/30 animate-ping" />
            )}
          </div>
        </div>

        {/* Status */}
        <div className="text-center mb-5">
          <div className="text-white font-bold text-base mb-1">{stageLabel[stage]}</div>
          {stage !== "idle" && stage !== "error" && (
            <div className="text-white/60 text-xs">Smart Shoe Pro Sensor</div>
          )}
          {battery != null && (
            <div className="flex items-center justify-center gap-3 mt-2 text-xs">
              <span className="text-green-400">🔋 {battery}%</span>
              <span className="text-blue-400">📶 {signal}</span>
              {memKb && <span className="text-purple-400">💾 {memKb} KB</span>}
              {matchCount && <span className="text-amber-400">📁 {matchCount} {isAr ? "جلسات" : "sessions"}</span>}
            </div>
          )}
        </div>

        {/* Progress bar */}
        {stage !== "idle" && (
          <div className="mb-5">
            <div className="flex justify-between text-xs text-white/60 mb-1.5">
              <span>{isAr ? "التقدم" : "Progress"}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }} />
            </div>
          </div>
        )}

        {/* Action button */}
        {stage === "idle" && (
          <button onClick={startSync}
            className="brand-gradient w-full py-4 rounded-2xl font-black text-base transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-3">
            <span className="text-2xl">📡</span>
            {isAr ? "مزامنة تلقائية عبر Bluetooth" : "Auto-Sync via Bluetooth"}
          </button>
        )}
        {stage === "done" && (
          <button onClick={() => setStage("idle")}
            className="w-full py-3 rounded-2xl font-bold text-sm bg-green-600/20 border border-green-500/40 text-green-400 hover:bg-green-600/30 transition-all">
            🔄 {isAr ? "مزامنة جديدة" : "New Sync"}
          </button>
        )}
        {stage === "error" && (
          <button onClick={() => setStage("idle")}
            className="w-full py-3 rounded-2xl font-bold text-sm bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30 transition-all">
            🔁 {isAr ? "إعادة المحاولة" : "Retry"}
          </button>
        )}
      </div>

      {/* How to use */}
      <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
        <h3 className="text-white font-bold text-sm mb-3">📖 {isAr ? "كيفية الاستخدام" : "How to use"}</h3>
        <ol className="space-y-2">
          {(isAr ? [
            "تأكد من تشغيل جهاز Smart Shoe Sensor",
            "اختر اللاعب ونوع الجلسة",
            "اضغط 'مزامنة تلقائية عبر Bluetooth'",
            "انتظر اكتمال المزامنة (تلقائي 100%)",
            "انتقل إلى تبويب Dashboard لعرض النتائج",
          ] : [
            "Ensure Smart Shoe Sensor is powered on",
            "Select player and session type",
            "Press 'Auto-Sync via Bluetooth'",
            "Wait for sync to complete (automatic)",
            "Navigate to Dashboard tab to view results",
          ]).map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-white/60">
              <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ─── Impact Zone Foot Diagram ─────────────────────────────────────────────────
function ImpactZone({ laces, inside, outside, heel, isAr }: {
  laces: number; inside: number; outside: number; heel: number; isAr: boolean;
}) {
  const total = laces + inside + outside + heel;
  const zones = [
    { label: isAr ? "رباط" : "Laces", val: laces, color: C.blue },
    { label: isAr ? "داخلي" : "Inside", val: inside, color: C.green },
    { label: isAr ? "خارجي" : "Outside", val: outside, color: C.amber },
    { label: isAr ? "كعب" : "Heel", val: heel, color: C.red },
  ];
  return (
    <div>
      <h4 className="text-white/60 text-xs font-semibold mb-3">⚡ {isAr ? "مناطق الإطلاق (Impact Zone)" : "Impact Zone"}</h4>
      <div className="flex items-center gap-4">
        {/* Foot SVG */}
        <svg width="80" height="120" viewBox="0 0 80 120" className="flex-shrink-0">
          <ellipse cx="40" cy="60" rx="28" ry="50" fill="#1e2d40" stroke="#334155" strokeWidth="1.5" />
          {/* Laces (top) */}
          <ellipse cx="40" cy="22" rx="18" ry="14" fill={C.blue} opacity={0.7} />
          {/* Inside */}
          <ellipse cx="24" cy="60" rx="10" ry="22" fill={C.green} opacity={0.7} />
          {/* Outside */}
          <ellipse cx="56" cy="60" rx="10" ry="22" fill={C.amber} opacity={0.7} />
          {/* Heel */}
          <ellipse cx="40" cy="98" rx="18" ry="14" fill={C.red} opacity={0.7} />
          <text x="40" y="26" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{laces}%</text>
          <text x="24" y="64" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{inside}%</text>
          <text x="56" y="64" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{outside}%</text>
          <text x="40" y="102" textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">{heel}%</text>
        </svg>
        <div className="flex-1 space-y-2">
          {zones.map(z => (
            <div key={z.label}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-white/60">{z.label}</span>
                <span className="font-bold" style={{ color: z.color }}>{z.val}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${z.val}%`, background: z.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DeviceIntegrationHub() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  const TABS = ["sync", "dashboard", "agility", "workload", "progress"] as const;
  type Tab = typeof TABS[number];

  const [activeTab, setActiveTab] = useState<Tab>("sync");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [sessionType, setSessionType] = useState("training");
  const [sessionSortBy, setSessionSortBy] = useState<"date" | "maxSpeed" | "calories" | "sprints" | "touches" | "overall">("date");
  const [sessionSortDir, setSessionSortDir] = useState<"desc" | "asc">("desc");
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [syncedData, setSyncedData] = useState<Record<string, any> | null>(null);
  const [pillarDir, setPillarDir] = useState(1);
  const [activePillar, setActivePillar] = useState<string>("agility");
  const [pdfLoading, setPdfLoading] = useState(false);
  // Hierarchical player selection: category → team → player
  const [selectedCategory, setSelectedCategory] = useState<'main' | 'academy' | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [syncDaysBack, setSyncDaysBack] = useState<7 | 14 | 30>(30);

  const { data: allTeams } = trpc.teams.getAll.useQuery();
  const teamsForCategory = (allTeams as any[] ?? []).filter((t: any) =>
    !selectedCategory || t.teamType === selectedCategory
  );
  const { data: teamPlayers } = trpc.players.getByTeam.useQuery(
    { teamId: selectedTeamId! }, { enabled: !!selectedTeamId }
  );
  const { data: playerSessions, refetch: refetchSessions } = trpc.deviceIntegration.getPlayerSessions.useQuery(
    { playerId: selectedPlayerId! }, { enabled: !!selectedPlayerId }
  );
  const { data: playerTrends } = trpc.deviceIntegration.getPlayerTrends.useQuery(
    { playerId: selectedPlayerId!, sessions: 12 }, { enabled: !!selectedPlayerId }
  );

  const uploadSession = trpc.deviceIntegration.uploadSession.useMutation({
    onSuccess: () => {
      toast({ title: isAr ? "تم حفظ الجلسة" : "Session Saved" });
      refetchSessions();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleSynced = useCallback((data: Record<string, any>) => {
    setSyncedData(data);
    if (!selectedPlayerId) return;
    const g = (keys: string[], def = 0) => { for (const k of keys) if (data[k] !== undefined) return Number(data[k]); return def; };
    uploadSession.mutate({
      playerId: selectedPlayerId, sessionType: sessionType as any, durationMinutes,
      rawInsights: data,
      totalTouches: g(["total_touches"]),
      totalStrikes: g(["total_strikes"]),
      totalPasses: g(["total_passes"]),
      totalPossessions: g(["total_possessions"]),
      totalPossessionTimeMin: g(["total_possession_time_min"]),
      avgPossessionDurationS: g(["avg_possession_duration_s"]),
      totalSprints: g(["total_sprints"]),
      totalTurns: g(["total_turns"]),
      turnsWithBall: g(["turns_with_ball"]),
      avgTurnEntrySpeedMs: g(["avg_turn_entry_speed_ms"]),
      maxTurnEntrySpeedMs: g(["max_turn_entry_speed_ms"]),
      leftTurns: g(["left_turns"]),
      rightTurns: g(["right_turns"]),
      backTurns: g(["back_turns"]),
      intenseTurns: g(["intense_turns"]),
      avgTurnExitSpeedMs: g(["avg_turn_exit_speed_ms"]),
      totalAccelerations: g(["total_accelerations"]),
      totalDecelerations: g(["total_decelerations"]),
      totalDistanceM: g(["total_distance_m"]),
      sprintDistanceM: g(["sprint_distance_m"]),
      validSteps: g(["valid_steps"]),
      jumps: g(["jumps"]),
      workCaloriesKcal: g(["work_calories_kcal"]),
      activeTimePercent: g(["active_time_percent"]),
      workRatePerMin: g(["work_rate_per_min"]),
      sprintWithBallCount: g(["sprint_with_ball_count"]),
      sprintWithoutBallCount: g(["sprint_without_ball_count"]),
      topSpeedKph: g(["top_speed_kph"]),
      kickingPowerKph: g(["kicking_power_kph"]),
      firstStepAccelerations: g(["first_step_accelerations"]),
      intenseAccelerations: g(["intense_accelerations"]),
      leftFootTouches: g(["left_foot_touches"]),
      rightFootTouches: g(["right_foot_touches"]),
      leftFootReleases: g(["left_foot_releases"]),
      rightFootReleases: g(["right_foot_releases"]),
      leftFootKickingPower: g(["left_foot_kicking_power"]),
      rightFootKickingPower: g(["right_foot_kicking_power"]),
      lacesReleases: g(["laces_releases"]),
      insideReleases: g(["inside_releases"]),
      otherReleases: g(["other_releases"]),
      oneTouchPossessions: g(["one_touch_possessions"]),
      multiTouchPossessions: g(["multi_touch_possessions"]),
      multiTouchDurationS: g(["multi_touch_duration_s"]),
    });
    setActiveTab("dashboard");
  }, [selectedPlayerId, sessionType, durationMinutes, uploadSession]);

  const latestSession = playerSessions?.[0];
  const prevSession = playerSessions?.[1] ?? null;
  const ins = (syncedData ?? latestSession?.rawInsights ?? {}) as Record<string, any>;

  // Build chart data from ins
  const jumpDistData = [
    { range: "4-6g", count: n(ins.jump_impact_4_6g, 5) },
    { range: "6-8g", count: n(ins.jump_impact_6_8g, 4) },
    { range: "8-10g", count: n(ins.jump_impact_8_10g, 2) },
    { range: "10g+", count: n(ins.jump_impact_10g_plus, 1) },
  ];
  const sprintFatigue = ins.sprint_fatigue ?? [
    { t: 5, spd: 7.1 }, { t: 15, spd: 7.4 }, { t: 25, spd: 6.9 }, { t: 35, spd: 6.5 }, { t: 45, spd: 6.0 },
  ];
  const intensitySegs = ins.intensity_segments ?? [
    { seg: 1, load: 72 }, { seg: 2, load: 85 }, { seg: 3, load: 68 }, { seg: 4, load: 91 }, { seg: 5, load: 60 },
  ];
  const possessionChain = ins.possession_chain ?? [
    { touches: "1-touch", freq: n(ins.one_touch_possessions, 113) },
    { touches: "2-touch", freq: 34 },
    { touches: "3+touch", freq: 17 },
  ];
  const accelDecel = ins.accel_decel_scatter ?? [
    { accel: 2.1, decel: -2.4 }, { accel: 2.8, decel: -3.1 }, { accel: 1.9, decel: -2.0 },
    { accel: 3.2, decel: -2.7 }, { accel: 2.5, decel: -1.8 }, { accel: 1.7, decel: -3.3 },
  ];
  const workRest = ins.work_rest_ratio ?? [
    { t: 5, active: 1 }, { t: 10, active: 0 }, { t: 15, active: 1 }, { t: 20, active: 1 },
    { t: 25, active: 0 }, { t: 30, active: 1 }, { t: 35, active: 1 }, { t: 40, active: 0 }, { t: 45, active: 1 },
  ];
  const agilitySymmetry = ins.agility_symmetry ?? [
    { axis: "L Entry Spd", val: 3.6 }, { axis: "R Entry Spd", val: 4.1 },
    { axis: "L Freq", val: 57 }, { axis: "R Freq", val: 32 },
    { axis: "Intense", val: 25 }, { axis: "W/ Ball", val: 54 },
  ];
  const kickingScatter = ins.kicking_scatter ?? [
    { type: "Pass-Inside", power: 115, peakG: 9.5 },
    { type: "Pass-Outside", power: 140, peakG: 11.2 },
    { type: "Strike-Laces", power: 210, peakG: 18 },
    { type: "Pass-Heel", power: 85, peakG: 6.5 },
  ];
  const impactZone = ins.impact_zone ?? { laces: 40, inside: 46, outside: 8, heel: 6 };

  const trendData = playerTrends?.map((s: any) => ({
    date: new Date(s.sessionDate).toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    ballControl: s.ballControlScore, agility: s.agilityScore,
    workload: s.workloadScore, overall: s.overallScore,
    distance: Math.round(Number(s.totalDistanceM)),
    sprints: s.totalSprints, touches: s.totalTouches,
  })) ?? [];

  const radarData = latestSession ? [
    { metric: isAr ? "ثنائي القدم" : "Two-footed", value: n(ins.twoFootedScore), pro: 75 },
    { metric: isAr ? "مراوغة" : "Dribbling", value: n(ins.dribblingScore), pro: 75 },
    { metric: isAr ? "أول لمسة" : "First touch", value: n(ins.firstTouchScore), pro: 75 },
    { metric: isAr ? "رشاقة" : "Agility", value: n(latestSession.agilityScore), pro: 75 },
    { metric: isAr ? "سرعة" : "Speed", value: n(ins.speedScore), pro: 75 },
    { metric: isAr ? "قوة" : "Power", value: n(ins.powerScore), pro: 75 },
  ] : [];

  // PDF export
  const handlePDF = useCallback(async () => {
    if (!reportRef.current) return;
    setPdfLoading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"), import("html2canvas"),
      ]);
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: "#0d1b2a" });
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * pdfW) / canvas.width;
      let heightLeft = imgH, pos = 0;
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, pos, pdfW, imgH);
      heightLeft -= pdfH;
      while (heightLeft > 0) {
        pos = heightLeft - imgH; pdf.addPage();
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, pos, pdfW, imgH);
        heightLeft -= pdfH;
      }
      const pl = (teamPlayers as any[] ?? []).find((p: any) => p.id === selectedPlayerId);
      pdf.save(`SmartShoe_${pl ? pl.firstName + "_" + pl.lastName : "Report"}_${new Date().toISOString().slice(0, 10)}.pdf`);
      toast({ title: isAr ? "تم تصدير PDF" : "PDF Exported" });
    } catch { toast({ title: "Error", description: "PDF export failed", variant: "destructive" }); }
    finally { setPdfLoading(false); }
  }, [selectedPlayerId, teamPlayers, isAr, toast]);

  const tabCfg: { key: string; icon: LucideIcon; label: string }[] = [
    { key: "sync", icon: Bluetooth, label: isAr ? "مزامنة" : "Sync" },
    { key: "dashboard", icon: LayoutDashboard, label: isAr ? "لوحة" : "Dashboard" },
    { key: "agility", icon: Zap, label: isAr ? "رشاقة" : "Agility" },
    { key: "workload", icon: Dumbbell, label: isAr ? "حمل" : "Workload" },
    { key: "progress", icon: TrendingUp, label: isAr ? "تطور" : "Progress" },
  ];

  const hasData = !!(syncedData || latestSession);

  return (
    <>
    <div className="text-white" style={{ background: "linear-gradient(160deg, #0d1b2a 0%, #0f2040 40%, #0a1628 100%)" }} dir={isAr ? "rtl" : "ltr"}>

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-20 backdrop-blur-xl border-b border-white/10" style={{ background: "rgba(13,27,42,0.93)" }}>
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-black text-white tracking-tight">Smart Shoe Pro</h1>
              <p className="text-blue-400 text-xs">{isAr ? "تحليل الأداء الذكي — مزامنة تلقائية" : "Intelligent Performance Analytics — Auto Sync"}</p>
            </div>
            <div className="flex items-center gap-2">
              {hasData && (
                <button onClick={handlePDF} disabled={pdfLoading}
                  className="flex items-center gap-1.5 bg-red-600/20 border border-red-500/40 text-red-400 hover:bg-red-600/30 text-xs font-semibold px-3 py-1.5 rounded-full transition-all disabled:opacity-50">
                  {pdfLoading ? "⏳" : "📄"} PDF
                </button>
              )}
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                <span className="text-green-400 text-xs font-semibold">{isAr ? "متصل" : "Live"}</span>
              </div>
            </div>
          </div>
          {/* Hierarchical selector: Category → Team → Player */}
          <div className="space-y-2">
            {/* Step 1: Category */}
            <div className="grid grid-cols-2 gap-2">
              {[{v: 'main' as const, label: isAr ? 'فريق رئيسي' : 'Main Team', icon: Trophy}, {v: 'academy' as const, label: isAr ? 'أكاديمية' : 'Academy', icon: GraduationCap}].map(opt => (
                <button key={opt.v} onClick={() => { setSelectedCategory(selectedCategory === opt.v ? null : opt.v); setSelectedTeamId(null); setSelectedPlayerId(null); }}
                  className={`flex items-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    selectedCategory === opt.v ? 'border-blue-400 bg-blue-400/15 text-white' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'
                  }`}>
                  <opt.icon className="h-3.5 w-3.5" /><span>{opt.label}</span>
                </button>
              ))}
            </div>
            {/* Step 2: Team */}
            {teamsForCategory.length > 0 && (
              <Select value={selectedTeamId ? String(selectedTeamId) : ''} onValueChange={v => { setSelectedTeamId(Number(v)); setSelectedPlayerId(null); }}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 rounded-xl text-sm">
                  <SelectValue placeholder={isAr ? 'اختر الفريق...' : 'Select team...'} />
                </SelectTrigger>
                <SelectContent className="bg-white/5 border-white/10">
                  {teamsForCategory.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)} className="text-white hover:bg-white/10">
                      {t.name} {t.ageGroup ? `• ${t.ageGroup}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {/* Step 3: Player */}
            {selectedTeamId && (
              <Select value={selectedPlayerId ? String(selectedPlayerId) : ''} onValueChange={v => setSelectedPlayerId(Number(v))}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white h-9 rounded-xl text-sm">
                  <SelectValue placeholder={isAr ? 'اختر لاعباً...' : 'Select player...'} />
                </SelectTrigger>
                <SelectContent className="bg-white/5 border-white/10">
                  {(teamPlayers as any[] ?? []).map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)} className="text-white hover:bg-white/10">
                      {p.firstName} {p.lastName} {p.position ? `— ${p.position}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        {/* Tab bar */}
        <div className="max-w-2xl mx-auto px-4 pb-3 pt-2">
          <div className="flex gap-1 bg-white/5 rounded-2xl p-1 overflow-x-auto scrollbar-hide">
            {tabCfg.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key as Tab)}
                className={`flex-shrink-0 flex-1 py-2 text-xs font-semibold transition-all rounded-xl flex flex-col items-center gap-0.5 min-w-[56px] ${
                  activeTab === t.key ? "bg-white text-gray-900 shadow-lg" : "text-white/60 hover:text-white"
                }`}>
                <t.icon className="h-4 w-4" />
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PDF hidden capture zone ── */}
      <div ref={reportRef} style={{ position: "absolute", left: "-9999px", top: 0, width: "800px", background: "#0d1b2a", padding: "24px", color: "white", fontFamily: "sans-serif" }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, marginBottom: 4 }}>Smart Shoe Pro — Analytics Report</h1>
        <p style={{ color: "#60a5fa", fontSize: 12, marginBottom: 16 }}>{new Date().toLocaleDateString()} · {sessionType} · {durationMinutes} min</p>
        {hasData && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { l: "Overall", v: latestSession?.overallScore ?? "—", c: "#f59e0b" },
              { l: "Ball Control", v: latestSession?.ballControlScore ?? "—", c: "#3b82f6" },
              { l: "Agility", v: latestSession?.agilityScore ?? "—", c: "#22c55e" },
              { l: "Workload", v: latestSession?.workloadScore ?? "—", c: "#a855f7" },
            ].map((m, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
                <div style={{ color: "#9ca3af", fontSize: 10, marginBottom: 4 }}>{m.l}</div>
                <div style={{ color: m.c, fontSize: 24, fontWeight: 900 }}>{m.v}</div>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 8 }}>
          {[
            { l: "Total Distance", v: `${(n(ins.total_distance_m) / 1000).toFixed(1)} km` },
            { l: "Ball Touches", v: `${n(ins.total_touches)} #` },
            { l: "Sprints", v: `${n(ins.total_sprints)} #` },
            { l: "Turns", v: `${n(ins.total_turns)} #` },
            { l: "Kicking Power", v: `${n(ins.kicking_power_kph).toFixed(1)} kph` },
            { l: "Top Speed", v: `${n(ins.top_speed_kph).toFixed(1)} kph` },
            { l: "Calories", v: `${Math.round(n(ins.work_calories_kcal))} kcal` },
            { l: "Jumps", v: `${n(ins.jumps)} #` },
            { l: "Active Time", v: `${n(ins.active_time_percent).toFixed(0)}%` },
            { l: "Work Rate", v: `${n(ins.work_rate_per_min).toFixed(1)} m/min` },
          ].map((m, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "8px 12px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#9ca3af", fontSize: 11 }}>{m.l}</span>
              <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>{m.v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* ══════════ TAB: SYNC ══════════ */}
        <AnimatePresence mode="wait">
          {activeTab === "sync" && (
            <motion.div key="sync" variants={fadeUp} initial="enter" animate="center" exit="exit" className="space-y-4">
              {/* Session Setup */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <h3 className="text-white font-bold text-sm mb-4">⚙️ {isAr ? "إعداد الجلسة" : "Session Setup"}</h3>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { v: "training", label: isAr ? "تدريب" : "Training", icon: Footprints },
                    { v: "match", label: isAr ? "مباراة" : "Match", icon: CircleDot },
                    { v: "assessment", label: isAr ? "تقييم" : "Assessment", icon: ClipboardList },
                  ].map(opt => (
                    <button key={opt.v} onClick={() => setSessionType(opt.v)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                        sessionType === opt.v ? "border-blue-400 bg-blue-400/10" : "border-white/10 bg-white/5 hover:border-white/30"
                      }`}>
                      <opt.icon className="h-6 w-6" />
                      <span className="text-xs font-semibold text-white">{opt.label}</span>
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-white/60 text-xs flex-shrink-0">{isAr ? "المدة (دقيقة)" : "Duration (min)"}</label>
                  <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))}
                    className="flex-1 bg-white/10 border border-white/20 text-white text-center text-lg font-bold h-10 rounded-xl outline-none" />
                </div>
              </div>

              {/* Smart Shoe Tracker API */}
              <SmartShoeAPISection isAr={isAr} />
              {/* Daily Goals */}
              {hasData && <DailyGoalsPanel isAr={isAr} ins={ins} latestSession={latestSession} trendData={trendData} goals={{ calories: 500, maxSpeed: 28, sprints: 20, touches: 150, distance: 5000 }} />}

              {/* Session Filter & Sort */}
              {playerSessions && playerSessions.length > 0 && (
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-sm">🔍 {isAr ? "تصفية الجلسات" : "Filter Sessions"}</h3>
                    <span className="text-white/60 text-xs">{playerSessions.length} {isAr ? "جلسة" : "sessions"}</span>
                  </div>
                  {/* Sort by */}
                  <div className="mb-3">
                    <p className="text-white/60 text-xs mb-2">{isAr ? "ترتيب حسب:" : "Sort by:"}</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { k: "date", label: isAr ? "التاريخ" : "Date", icon: "📅" },
                        { k: "maxSpeed", label: isAr ? "أقصى سرعة" : "Max Speed", icon: "💨" },
                        { k: "calories", label: isAr ? "سعرات" : "Calories", icon: "🔥" },
                        { k: "sprints", label: isAr ? "عدوات" : "Sprints", icon: "⚡" },
                        { k: "touches", label: isAr ? "لمسات" : "Touches", icon: "⚽" },
                        { k: "overall", label: isAr ? "التقييم" : "Overall", icon: "⭐" },
                      ].map(opt => (
                        <button key={opt.k}
                          onClick={() => setSessionSortBy(opt.k as any)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            sessionSortBy === opt.k
                              ? "border-blue-400 bg-blue-400/20 text-blue-300"
                              : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                          }`}>
                          {opt.icon} {opt.label}
                          {sessionSortBy === opt.k && <span className="ml-1">{sessionSortDir === "desc" ? "↓" : "↑"}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Sort direction */}
                  <div className="flex gap-2 mb-4">
                    {(["desc", "asc"] as const).map(dir => (
                      <button key={dir} onClick={() => setSessionSortDir(dir)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          sessionSortDir === dir ? "border-blue-400 bg-blue-400/20 text-blue-300" : "border-white/10 bg-white/5 text-white/60"
                        }`}>
                        {dir === "desc" ? (isAr ? "↓ الأعلى أولاً" : "↓ Highest first") : (isAr ? "↑ الأدنى أولاً" : "↑ Lowest first")}
                      </button>
                    ))}
                  </div>
                  {/* Sorted session list */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {[...playerSessions]
                      .sort((a: any, b: any) => {
                        const getVal = (s: any) => {
                          if (sessionSortBy === "date") return new Date(s.sessionDate).getTime();
                          if (sessionSortBy === "maxSpeed") return Number(s.topSpeedKph ?? 0);
                          if (sessionSortBy === "calories") return Number(s.workCaloriesKcal ?? 0);
                          if (sessionSortBy === "sprints") return Number(s.totalSprints ?? 0);
                          if (sessionSortBy === "touches") return Number(s.totalTouches ?? 0);
                          if (sessionSortBy === "overall") return Number(s.overallScore ?? 0);
                          return 0;
                        };
                        return sessionSortDir === "desc" ? getVal(b) - getVal(a) : getVal(a) - getVal(b);
                      })
                      .slice(0, 8)
                      .map((s: any, i: number) => (
                        <div key={s.id ?? i} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                          <div>
                            <div className="text-white text-xs font-semibold">
                              {new Date(s.sessionDate).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { month: "short", day: "numeric" })}
                              <span className="ml-2 text-white/60 capitalize">{s.sessionType}</span>
                            </div>
                            <div className="text-white/60 text-xs mt-0.5">
                              {Number(s.topSpeedKph ?? 0).toFixed(1)} kph · {s.totalSprints ?? 0} sprints · {Math.round(Number(s.workCaloriesKcal ?? 0))} kcal
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-blue-400 font-black text-sm">{Number(s.overallScore ?? 0).toFixed(0)}</div>
                            <div className="text-white/60 text-xs">{isAr ? "تقييم" : "score"}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Session Filter & Sort */}
              {playerSessions && playerSessions.length > 0 && (
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-sm">🔍 {isAr ? "تصفية الجلسات" : "Filter Sessions"}</h3>
                    <span className="text-white/60 text-xs">{playerSessions.length} {isAr ? "جلسة" : "sessions"}</span>
                  </div>
                  <div className="mb-3">
                    <p className="text-white/60 text-xs mb-2">{isAr ? "ترتيب حسب:" : "Sort by:"}</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { k: "date", label: isAr ? "التاريخ" : "Date", icon: "📅" },
                        { k: "maxSpeed", label: isAr ? "أقصى سرعة" : "Max Speed", icon: "💨" },
                        { k: "calories", label: isAr ? "سعرات" : "Calories", icon: "🔥" },
                        { k: "sprints", label: isAr ? "عدوات" : "Sprints", icon: "⚡" },
                        { k: "touches", label: isAr ? "لمسات" : "Touches", icon: "⚽" },
                        { k: "overall", label: isAr ? "التقييم" : "Overall", icon: "⭐" },
                      ].map(opt => (
                        <button key={opt.k}
                          onClick={() => setSessionSortBy(opt.k as any)}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            sessionSortBy === opt.k
                              ? "border-blue-400 bg-blue-400/20 text-blue-300"
                              : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                          }`}>
                          {opt.icon} {opt.label}
                          {sessionSortBy === opt.k && <span className="ml-1">{sessionSortDir === "desc" ? "↓" : "↑"}</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 mb-4">
                    {(["desc", "asc"] as const).map(dir => (
                      <button key={dir} onClick={() => setSessionSortDir(dir)}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                          sessionSortDir === dir ? "border-blue-400 bg-blue-400/20 text-blue-300" : "border-white/10 bg-white/5 text-white/60"
                        }`}>
                        {dir === "desc" ? (isAr ? "↓ الأعلى أولاً" : "↓ Highest first") : (isAr ? "↑ الأدنى أولاً" : "↑ Lowest first")}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {[...playerSessions]
                      .sort((a: any, b: any) => {
                        const getVal = (s: any) => {
                          if (sessionSortBy === "date") return new Date(s.sessionDate).getTime();
                          if (sessionSortBy === "maxSpeed") return Number(s.topSpeedKph ?? 0);
                          if (sessionSortBy === "calories") return Number(s.workCaloriesKcal ?? 0);
                          if (sessionSortBy === "sprints") return Number(s.totalSprints ?? 0);
                          if (sessionSortBy === "touches") return Number(s.totalTouches ?? 0);
                          if (sessionSortBy === "overall") return Number(s.overallScore ?? 0);
                          return 0;
                        };
                        return sessionSortDir === "desc" ? getVal(b) - getVal(a) : getVal(a) - getVal(b);
                      })
                      .slice(0, 8)
                      .map((s: any, i: number) => (
                        <div key={s.id ?? i} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2 border border-white/5">
                          <div>
                            <div className="text-white text-xs font-semibold">
                              {new Date(s.sessionDate).toLocaleDateString(isAr ? "ar-EG" : "en-GB", { month: "short", day: "numeric" })}
                              <span className="ml-2 text-white/60 capitalize">{s.sessionType}</span>
                            </div>
                            <div className="text-white/60 text-xs mt-0.5">
                              {Number(s.topSpeedKph ?? 0).toFixed(1)} kph · {s.totalSprints ?? 0} sprints · {Math.round(Number(s.workCaloriesKcal ?? 0))} kcal
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-blue-400 font-black text-sm">{Number(s.overallScore ?? 0).toFixed(0)}</div>
                            <div className="text-white/60 text-xs">{isAr ? "تقييم" : "score"}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* How it works */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <h3 className="text-white font-bold text-sm mb-3">📖 {isAr ? "كيف تعمل" : "How it works"}</h3>
                <ol className="space-y-2">
                  {(isAr ? [
                    "اختر اللاعب ونوع الجلسة والمدة",
                    "اختر اللاعب ونوع الجلسة",
                    "ارفع ملف CSV من جهاز الحذاء الذكي أو استخدم Smart Shoe Tracker API للمزامنة التلقائية",
                    "يتم حفظ الجلسات تلقائياً في قاعدة البيانات",
                    "انتقل إلى تبويب Dashboard لعرض النتائج",
                  ] : [
                    "Select a player, session type and duration",
                    "Select a player and session type",
                    "Upload a CSV from the Smart Shoe device or use Smart Shoe Tracker API auto-sync",
                    "Sessions are saved automatically to the database",
                    "Navigate to Dashboard tab to view results",
                  ]).map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-white/60">
                      <span className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════ TAB: DASHBOARD ══════════ */}
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div key="dashboard" variants={fadeUp} initial="enter" animate="center" exit="exit" className="space-y-4">
              {!hasData ? (
                <div className="text-center py-20 text-white/60">
                  <div className="text-5xl mb-3">📡</div>
                  <p>{isAr ? "قم بمزامنة جلسة أولاً" : "Sync a session first"}</p>
                </div>
              ) : (
                <>
                  {/* Session comparison banner */}
                  {latestSession && prevSession && (
                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-white font-bold text-sm">📊 {isAr ? "مقارنة الجلسات" : "Session Comparison"}</h3>
                        <span className="text-white/60 text-xs">{isAr ? "الحالية vs السابقة" : "Current vs Previous"}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { l: isAr ? "الإجمالي" : "Overall", cur: latestSession.overallScore, prev: prevSession.overallScore, c: C.amber },
                          { l: isAr ? "تحكم" : "Ball Ctrl", cur: latestSession.ballControlScore, prev: prevSession.ballControlScore, c: C.blue },
                          { l: isAr ? "رشاقة" : "Agility", cur: latestSession.agilityScore, prev: prevSession.agilityScore, c: C.green },
                          { l: isAr ? "حمل" : "Workload", cur: latestSession.workloadScore, prev: prevSession.workloadScore, c: C.purple },
                        ].map((m, i) => {
                          const delta = m.prev != null ? (n(m.cur) - n(m.prev)) : null;
                          return (
                            <div key={i} className="text-center bg-white/5 rounded-xl p-2.5">
                              <div className="text-xs text-white/60 mb-1">{m.l}</div>
                              <div className="font-black text-xl" style={{ color: m.c }}>{m.cur || "—"}</div>
                              {delta != null && (
                                <div className={`text-xs mt-0.5 font-semibold ${delta >= 0 ? "text-green-400" : "text-red-400"}`}>
                                  {delta >= 0 ? "▲" : "▼"}{Math.abs(delta).toFixed(0)}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 5 big stat cards matching the app dashboard */}
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard icon="💨" label={isAr ? "عدوات / أعلى سرعة" : "Sprints / Max Speed"}
                      value={n(ins.total_sprints, latestSession?.totalSprints ?? 0)} unit="#"
                      sub={`${n(ins.top_speed_kph, 0).toFixed(1)} kph`}
                      color={C.blue}
                      delta={prevSession ? n(ins.total_sprints) - n(prevSession.totalSprints) : null} />
                    <StatCard icon="🦘" label={isAr ? "قفزات / تأثير" : "Jump Impact"}
                      value={n(ins.jumps, latestSession?.jumps ?? 0)} unit={isAr ? "قفزة" : "jumps"}
                      sub={`${jumpDistData.reduce((a, d) => a + d.count, 0)} ${isAr ? "إجمالي" : "total"}`}
                      color={C.purple}
                      delta={prevSession ? n(ins.jumps) - n(prevSession.jumps) : null} />
                    <StatCard icon="🔥" label={isAr ? "سعرات / حمل" : "Workload / Calories"}
                      value={Math.round(n(ins.work_calories_kcal, Number(latestSession?.workCaloriesKcal ?? 0)))} unit="kcal"
                      sub={`${n(ins.active_time_percent, 0).toFixed(0)}% ${isAr ? "نشاط" : "active"}`}
                      color={C.amber}
                      delta={prevSession ? Math.round(n(ins.work_calories_kcal) - n(Number(prevSession.workCaloriesKcal))) : null} />
                    <StatCard icon="⚽" label={isAr ? "الاستحواذات" : "Total Possessions"}
                      value={n(ins.total_possessions, latestSession?.totalPossessions ?? 0)} unit="#"
                      sub={`${n(ins.avg_possession_duration_s, 0).toFixed(1)}s ${isAr ? "متوسط" : "avg"}`}
                      color={C.green}
                      delta={prevSession ? n(ins.total_possessions) - n(prevSession.totalPossessions) : null} />
                    <div className="col-span-2">
                      <StatCard icon="🦵" label={isAr ? "قوة الركل / ضربات" : "Kicking Power / Strikes"}
                        value={n(ins.kicking_power_kph, 0).toFixed(1)} unit="kph"
                        sub={`${n(ins.total_strikes, latestSession?.totalStrikes ?? 0)} ${isAr ? "ضربة" : "hits"}`}
                        color={C.red}
                        delta={prevSession ? n(ins.kicking_power_kph) - n((prevSession.rawInsights as any)?.kicking_power_kph ?? 0) : null} />
                    </div>
                  </div>

                  {/* Possession Chain Histogram */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-sm">⛓️ {isAr ? "سلسلة الاستحواذ" : "Possession Chain"}</h3>
                      <MetricTooltip isAr={isAr} text={isAr ? "يوضح عدد اللمسات لكل حيازة: لمسة واحدة تعني أسرع معالجة، ولمسات متعددة تعني تحكماً أكثر" : "Shows number of touches per possession: 1-touch = faster processing, multi-touch = more control. Elite players average 1.3 touches per possession."} />
                    </div>
                    <p className="text-white/60 text-xs mb-3">{isAr ? "تكرار عدد اللمسات لكل استحواذ" : "Frequency of touch counts per possession"}</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={possessionChain}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="touches" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "10px" }} />
                        <Bar dataKey="freq" name={isAr ? "تكرار" : "Frequency"} fill={C.blue} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Kicking Power Scatter */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-sm">🦵 {isAr ? "ثبات قوة الركل" : "Kicking Power Consistency"}</h3>
                      <MetricTooltip isAr={isAr} text={isAr ? "يقارن قوة الركل (kph) مع ذروة التأثير (g) لكل ضربة. الضربات العالية في الزاوية اليمنى العليا تعني ضربات قوية" : "Compares kick power (kph) vs peak impact (g) per strike. High values in top-right corner = powerful strikes. Consistency = tight cluster."} />
                    </div>
                    <p className="text-white/60 text-xs mb-3">{isAr ? "التباين بين التمريرات والضربات" : "Variance between passes and strikes"}</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="power" name={isAr ? "القوة" : "Power"} tick={{ fill: "#9ca3af", fontSize: 10 }} label={{ value: isAr ? "القوة" : "Power", position: "insideBottom", offset: -2, fill: "#6b7280", fontSize: 10 }} />
                        <YAxis dataKey="peakG" name="Peak G" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <ZAxis range={[60, 200]} />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "10px" }} />
                        <Scatter data={kickingScatter} fill={C.amber}>
                          {kickingScatter.map((_: any, i: number) => (
                            <Cell key={i} fill={i < 3 ? C.blue : C.red} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 justify-center mt-2">
                      <span className="flex items-center gap-1.5 text-xs text-blue-400"><span className="w-3 h-3 rounded-full bg-blue-400 inline-block" /> {isAr ? "تمريرات" : "Passes"}</span>
                      <span className="flex items-center gap-1.5 text-xs text-red-400"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> {isAr ? "ضربات" : "Strikes"}</span>
                    </div>
                  </div>

                  {/* Impact Zone */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <ImpactZone
                      laces={impactZone.laces} inside={impactZone.inside}
                      outside={impactZone.outside} heel={impactZone.heel}
                      isAr={isAr}
                    />
                  </div>

                  {/* Touch Involvement Timeline placeholder */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-bold text-sm mb-1">⏱️ {isAr ? "توزيع اللمسات عبر الوقت" : "Touch Involvement Timeline"}</h3>
                    <p className="text-white/60 text-xs mb-3">{isAr ? "أحداث اللمس على مدار 45 دقيقة" : "Touch events mapped over 45 minutes"}</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={intensitySegs.map((s: any) => ({ ...s, touches: Math.round(n(ins.total_touches, 516) / 5 * (0.8 + Math.random() * 0.4)) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="seg" tickFormatter={(v) => `${v * 9}m`} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "10px" }} />
                        <defs>
                          <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C.green} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={C.green} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="touches" stroke={C.green} fill="url(#tg)" strokeWidth={2} name={isAr ? "لمسات" : "Touches"} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════ TAB: AGILITY ══════════ */}
        <AnimatePresence mode="wait">
          {activeTab === "agility" && (
            <motion.div key="agility" variants={fadeUp} initial="enter" animate="center" exit="exit" className="space-y-4">
              {!hasData ? (
                <div className="text-center py-20 text-white/60"><div className="text-5xl mb-3">⚡</div><p>{isAr ? "قم بمزامنة جلسة أولاً" : "Sync a session first"}</p></div>
              ) : (
                <>
                  {/* Agility summary cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard icon="🔄" label={isAr ? "إجمالي الاستدارات" : "Total Turns"} value={n(ins.total_turns, latestSession?.totalTurns ?? 0)} unit="#" color={C.green} delta={prevSession ? n(ins.total_turns) - n(Number(prevSession.totalTurns)) : null} />
                    <StatCard icon="⚽" label={isAr ? "استدارات بالكرة" : "With Ball"} value={n(ins.turns_with_ball, latestSession?.turnsWithBall ?? 0)} unit="#" color={C.blue} />
                    <StatCard icon="⚡" label={isAr ? "سرعة الدخول (متوسط)" : "Avg Entry Spd"} value={(n(ins.avg_turn_entry_speed_ms, Number(latestSession?.avgTurnEntrySpeedMs ?? 0)) * 3.6).toFixed(1)} unit="kph" color={C.amber} />
                    <StatCard icon="🔥" label={isAr ? "سرعة الدخول (أقصى)" : "Max Entry Spd"} value={(n(ins.max_turn_entry_speed_ms, Number(latestSession?.maxTurnEntrySpeedMs ?? 0)) * 3.6).toFixed(1)} unit="kph" color={C.red} />
                    <StatCard icon="💨" label={isAr ? "عدوات" : "Sprints"} value={n(ins.total_sprints, latestSession?.totalSprints ?? 0)} unit="#" color={C.cyan} />
                    <StatCard icon="🌀" label={isAr ? "استدارات مكثفة" : "Intense Turns"} value={n(ins.intense_turns, latestSession?.intenseTurns ?? 0)} unit="#" color={C.orange} />
                  </div>

                  {/* Turn direction */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-bold text-sm mb-4">🔄 {isAr ? "اتجاه الاستدارات" : "Turn Direction"}</h3>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { icon: "↰", count: n(ins.left_turns, latestSession?.leftTurns ?? 0), label: isAr ? "يسار" : "Left", color: C.blue },
                        { icon: "↕", count: n(ins.back_turns, latestSession?.backTurns ?? 0), label: isAr ? "خلف" : "Back", color: C.purple },
                        { icon: "↱", count: n(ins.right_turns, latestSession?.rightTurns ?? 0), label: isAr ? "يمين" : "Right", color: C.green },
                      ].map((d, i) => {
                        const total = n(ins.left_turns, latestSession?.leftTurns ?? 0) + n(ins.back_turns, latestSession?.backTurns ?? 0) + n(ins.right_turns, latestSession?.rightTurns ?? 0);
                        return (
                          <div key={i} className="text-center bg-white/5 rounded-xl p-3">
                            <div className="text-3xl mb-1">{d.icon}</div>
                            <div className="text-white font-black text-2xl">{d.count}</div>
                            <div className="text-white/60 text-xs">{d.label}</div>
                            {total > 0 && <div className="text-xs mt-1 font-semibold" style={{ color: d.color }}>({Math.round(d.count / total * 100)}%)</div>}
                          </div>
                        );
                      })}
                    </div>
                    {/* Balance bar */}
                    {(() => {
                      const L = n(ins.left_turns, latestSession?.leftTurns ?? 0);
                      const R = n(ins.right_turns, latestSession?.rightTurns ?? 0);
                      const B = n(ins.back_turns, latestSession?.backTurns ?? 0);
                      const T = L + R + B;
                      return T > 0 ? (
                        <div>
                          <div className="h-2.5 bg-white/10 rounded-full overflow-hidden flex mb-1">
                            <div className="bg-blue-500 h-full" style={{ width: `${L / T * 100}%` }} />
                            <div className="bg-purple-500 h-full" style={{ width: `${B / T * 100}%` }} />
                            <div className="bg-green-500 h-full" style={{ width: `${R / T * 100}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-white/60">
                            <span className="text-blue-400">{isAr ? "يسار" : "Left"}</span>
                            <span className="text-purple-400">{isAr ? "خلف" : "Back"}</span>
                            <span className="text-green-400">{isAr ? "يمين" : "Right"}</span>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Sprint Context Breakdown */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-bold text-sm mb-1">💨 {isAr ? "تحليل العدو" : "Sprint Context Breakdown"}</h3>
                    <p className="text-white/60 text-xs mb-3">{isAr ? "بالكرة مقابل بدون كرة" : "With Ball vs Without Ball"}</p>
                    <div className="mb-3">
                      {(() => {
                        const wb = n(ins.sprint_with_ball_count, latestSession?.sprintWithBallCount ?? 0);
                        const wo = n(ins.sprint_without_ball_count, latestSession?.sprintWithoutBallCount ?? 0);
                        const t = wb + wo;
                        return (
                          <>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span className="text-green-400 font-semibold">{isAr ? "بالكرة" : "With ball"} ({t > 0 ? Math.round(wb / t * 100) : 0}%)</span>
                              <span className="text-orange-400 font-semibold">{isAr ? "بدون كرة" : "Without ball"} ({t > 0 ? Math.round(wo / t * 100) : 0}%)</span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden flex">
                              <div className="bg-green-500 h-full rounded-l-full" style={{ width: `${t > 0 ? wb / t * 100 : 50}%` }} />
                              <div className="bg-orange-500 h-full rounded-r-full" style={{ width: `${t > 0 ? wo / t * 100 : 50}%` }} />
                            </div>
                            <div className="flex justify-between text-xs text-white/60 mt-1">
                              <span>{wb} #</span><span>{isAr ? "إجمالي" : "Total"}: {t}</span><span>{wo} #</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={[
                        { name: isAr ? "بدون كرة" : "W/O Ball", val: n(ins.sprint_without_ball_count, latestSession?.sprintWithoutBallCount ?? 0) },
                        { name: isAr ? "بالكرة" : "W/ Ball", val: n(ins.sprint_with_ball_count, latestSession?.sprintWithBallCount ?? 0) },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "10px" }} />
                        <Bar dataKey="val" name={isAr ? "عدوات" : "Sprints"} radius={[6, 6, 0, 0]}>
                          <Cell fill={C.orange} />
                          <Cell fill={C.green} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Agility Symmetry Radar with Injury Risk Alert */}
                  {(() => {
                    // Compute asymmetry score: compare L vs R values
                    const lEntry = agilitySymmetry.find((d: any) => d.axis === "L Entry Spd")?.val ?? 0;
                    const rEntry = agilitySymmetry.find((d: any) => d.axis === "R Entry Spd")?.val ?? 0;
                    const lFreq  = agilitySymmetry.find((d: any) => d.axis === "L Freq")?.val ?? 0;
                    const rFreq  = agilitySymmetry.find((d: any) => d.axis === "R Freq")?.val ?? 0;
                    const speedAsymm = lEntry + rEntry > 0 ? Math.abs(lEntry - rEntry) / ((lEntry + rEntry) / 2) * 100 : 0;
                    const freqAsymm  = lFreq + rFreq > 0 ? Math.abs(lFreq - rFreq) / ((lFreq + rFreq) / 2) * 100 : 0;
                    const asymmScore = (speedAsymm + freqAsymm) / 2;
                    const riskLevel = asymmScore > 35 ? "high" : asymmScore > 20 ? "medium" : "low";
                    const riskColor = riskLevel === "high" ? "#ef4444" : riskLevel === "medium" ? "#f59e0b" : "#22c55e";
                    const riskBg    = riskLevel === "high" ? "bg-red-500/10 border-red-500/30" : riskLevel === "medium" ? "bg-amber-500/10 border-amber-500/30" : "bg-green-500/10 border-green-500/30";
                    const riskLabel = riskLevel === "high"
                      ? (isAr ? "خطر إصابة عالٍ — عدم تماثل كبير" : "High Injury Risk — Major Asymmetry")
                      : riskLevel === "medium"
                      ? (isAr ? "خطر متوسط — عدم تماثل ملحوظ" : "Medium Risk — Notable Asymmetry")
                      : (isAr ? "خطر منخفض — تماثل جيد" : "Low Risk — Good Symmetry");
                    const riskDesc = riskLevel === "high"
                      ? (isAr ? `فارق ${speedAsymm.toFixed(0)}% في سرعة الدخول و${freqAsymm.toFixed(0)}% في التكرار — يُنصح بفحص طبي` : `${speedAsymm.toFixed(0)}% entry speed gap & ${freqAsymm.toFixed(0)}% frequency gap — medical check advised`)
                      : riskLevel === "medium"
                      ? (isAr ? `فارق ${speedAsymm.toFixed(0)}% في السرعة — تمارين تقوية الجانب الأضعف موصى بها` : `${speedAsymm.toFixed(0)}% speed gap — strengthening weaker side recommended`)
                      : (isAr ? `فارق ${speedAsymm.toFixed(0)}% فقط — أداء متوازن ممتاز` : `Only ${speedAsymm.toFixed(0)}% gap — excellent balanced performance`);
                    return (
                      <div className={`rounded-2xl p-5 border ${riskLevel === "high" ? "border-red-500/30 bg-red-500/5" : "bg-white/5 border-white/10"}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-white font-bold text-sm">🎯 {isAr ? "تماثل الرشاقة" : "Agility Symmetry"}</h3>
                          <MetricTooltip isAr={isAr} text={isAr ? "يقيس التوازن بين جانبي الجسم في الاستدارات والتسارعات. اللاعب المتوازن يظهر قيماً متساوية في اليسار واليمين" : "Measures left-right body balance in turns and accelerations. A balanced player shows equal values on left and right axes. Asymmetry may indicate injury risk or skill gap."} />
                          {/* Injury Risk Badge */}
                          <div className={`ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold border ${riskBg}`} style={{ color: riskColor }}>
                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: riskColor }} />
                            {riskLevel === "high" ? (isAr ? "خطر عالٍ" : "High Risk") : riskLevel === "medium" ? (isAr ? "خطر متوسط" : "Med Risk") : (isAr ? "آمن" : "Safe")}
                          </div>
                        </div>
                        {/* Risk Alert Banner */}
                        <div className={`rounded-xl p-3 mb-3 border ${riskBg}`}>
                          <p className="text-xs font-semibold" style={{ color: riskColor }}>{riskLabel}</p>
                          <p className="text-xs text-white/60 mt-0.5">{riskDesc}</p>
                          {/* Asymmetry bars */}
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white/60 text-xs w-24">{isAr ? "سرعة الدخول" : "Entry Speed"}</span>
                              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(speedAsymm, 100)}%`, background: riskColor }} />
                              </div>
                              <span className="text-xs font-bold" style={{ color: riskColor }}>{speedAsymm.toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-white/60 text-xs w-24">{isAr ? "تكرار الاستدارة" : "Turn Frequency"}</span>
                              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(freqAsymm, 100)}%`, background: riskColor }} />
                              </div>
                              <span className="text-xs font-bold" style={{ color: riskColor }}>{freqAsymm.toFixed(0)}%</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-white/60 text-xs mb-3">{isAr ? "سرعة دخول وتكرار الاستدارات يسار/يمين" : "Left vs Right turn entry speed & frequency"}</p>
                        <ResponsiveContainer width="100%" height={220}>
                          <RadarChart data={agilitySymmetry}>
                            <PolarGrid stroke="#ffffff15" />
                            <PolarAngleAxis dataKey="axis" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                            <PolarRadiusAxis angle={90} tick={{ fill: "#6b7280", fontSize: 8 }} />
                            <Radar name={isAr ? "القيمة" : "Value"} dataKey="val"
                              stroke={riskLevel === "high" ? "#ef4444" : C.cyan}
                              fill={riskLevel === "high" ? "#ef4444" : C.cyan}
                              fillOpacity={0.2} strokeWidth={2} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}

                  {/* Sprint Fatigue Curve */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-bold text-sm mb-1">📉 {isAr ? "منحنى إجهاد العدو" : "Sprint Fatigue Curve"}</h3>
                    <p className="text-white/60 text-xs mb-3">{isAr ? "أقصى سرعة لكل عدو عبر الوقت" : "Max speed of individual sprints over time"}</p>
                    <ResponsiveContainer width="100%" height={170}>
                      <LineChart data={sprintFatigue}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="t" tickFormatter={v => `${v}m`} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <YAxis domain={[4, 10]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "10px" }} />
                        <Line type="monotone" dataKey="spd" name={isAr ? "سرعة (م/ث)" : "Speed (m/s)"} stroke={C.red} strokeWidth={2.5} dot={{ fill: C.red, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Accel/Decel G-Force Scatter */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-bold text-sm mb-1">🚀 {isAr ? "خريطة قوة التسارع/التباطؤ" : "Accel/Decel G-Force Map"}</h3>
                    <p className="text-white/60 text-xs mb-3">{isAr ? "التسارعات الشديدة مقابل التباطؤات الشديدة" : "Hard accelerations vs hard decelerations"}</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <ScatterChart>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="accel" name={isAr ? "تسارع" : "Accel"} unit=" m/s²" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <YAxis dataKey="decel" name={isAr ? "تباطؤ" : "Decel"} unit=" m/s²" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <ZAxis range={[60, 120]} />
                        <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "10px" }} />
                        <Scatter data={accelDecel} fill={C.purple} />
                      </ScatterChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <div className="text-green-400 text-xs mb-1">{isAr ? "تسارعات إجمالية" : "Total Accl."}</div>
                        <div className="text-white font-bold text-xl">{n(ins.total_accelerations, latestSession?.totalAccelerations ?? 0)} <span className="text-white/60 text-xs">#</span></div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-3 text-center">
                        <div className="text-red-400 text-xs mb-1">{isAr ? "تباطؤات إجمالية" : "Total Decl."}</div>
                        <div className="text-white font-bold text-xl">{n(ins.total_decelerations, latestSession?.totalDecelerations ?? 0)} <span className="text-white/60 text-xs">#</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Two-footed */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-bold text-sm mb-4">👟 {isAr ? "ثنائية القدم" : "Two-footed Analysis"}</h3>
                    {(() => {
                      const lt = n(ins.left_foot_touches, Number(latestSession?.leftFootTouches ?? 0));
                      const rt = n(ins.right_foot_touches, Number(latestSession?.rightFootTouches ?? 0));
                      const lk = n(ins.left_foot_kicking_power, Number(latestSession?.leftFootKickingPower ?? 0));
                      const rk = n(ins.right_foot_kicking_power, Number(latestSession?.rightFootKickingPower ?? 0));
                      const lr = n(ins.left_foot_releases, Number(latestSession?.leftFootReleases ?? 0));
                      const rr = n(ins.right_foot_releases, Number(latestSession?.rightFootReleases ?? 0));
                      const laces = n(ins.laces_releases, Number(latestSession?.lacesReleases ?? 0));
                      const inside = n(ins.inside_releases, latestSession?.insideReleases ?? 0);
                      const other = n(ins.other_releases, latestSession?.otherReleases ?? 0);
                      return (
                        <>
                          <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                            <div className="text-center">
                              <div className="text-3xl mb-1">🦶</div>
                              <div className="text-blue-400 font-bold text-xl">{lt}</div>
                              <div className="text-white/60 text-xs">{isAr ? "يسار" : "Left"}</div>
                            </div>
                            <div className="text-center">
                              <div className="bg-yellow-400 text-gray-900 text-xs font-bold px-3 py-1 rounded-full mb-1">{isAr ? "المهيمنة" : "Dominant"}</div>
                              <div className="text-white text-sm font-semibold">{rt >= lt ? (isAr ? "اليمنى" : "Right") : (isAr ? "اليسرى" : "Left")}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-3xl mb-1">🦶</div>
                              <div className="text-green-400 font-bold text-xl">{rt}</div>
                              <div className="text-white/60 text-xs">{isAr ? "يمين" : "Right"}</div>
                            </div>
                          </div>
                          {[
                            { label: isAr ? "لمسات" : "Touches", lv: lt, rv: rt },
                            { label: isAr ? "إطلاق" : "Releases", lv: lr, rv: rr },
                            { label: isAr ? "قوة ركل (kph)" : "Kicking (kph)", lv: lk, rv: rk },
                          ].map((row, i) => {
                            const T = row.lv + row.rv;
                            return (
                              <div key={i} className="mb-3">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-white font-semibold">{row.lv.toFixed(i === 2 ? 1 : 0)} ({T > 0 ? Math.round(row.lv / T * 100) : 0}%)</span>
                                  <span className="text-white/60">{row.label}</span>
                                  <span className="text-white font-semibold">{row.rv.toFixed(i === 2 ? 1 : 0)} ({T > 0 ? Math.round(row.rv / T * 100) : 0}%)</span>
                                </div>
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden flex">
                                  <div className="bg-blue-400 h-full" style={{ width: `${T > 0 ? row.lv / T * 100 : 50}%` }} />
                                  <div className="bg-green-400 h-full" style={{ width: `${T > 0 ? row.rv / T * 100 : 50}%` }} />
                                </div>
                              </div>
                            );
                          })}
                          <div className="pt-3 border-t border-white/10">
                            <div className="text-white/60 text-xs mb-2">{isAr ? "منطقة إطلاق الكرة" : "Ball release footzone"} — {isAr ? "إجمالي" : "Total"}: {laces + inside + other}#</div>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { icon: "👟", count: laces, label: isAr ? "رباط" : "Laces" },
                                { icon: "🦶", count: inside, label: isAr ? "داخلي" : "Inside" },
                                { icon: "⚽", count: other, label: isAr ? "أخرى" : "Other" },
                              ].map((z, i) => (
                                <div key={i} className="text-center bg-white/5 rounded-xl p-3">
                                  <div className="text-2xl mb-1">{z.icon}</div>
                                  <div className="text-white font-bold text-lg">{z.count}</div>
                                  <div className="text-white/60 text-xs">{z.label}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════ TAB: WORKLOAD ══════════ */}
        <AnimatePresence mode="wait">
          {activeTab === "workload" && (
            <motion.div key="workload" variants={fadeUp} initial="enter" animate="center" exit="exit" className="space-y-4">
              {!hasData ? (
                <div className="text-center py-20 text-white/60"><div className="text-5xl mb-3">💪</div><p>{isAr ? "قم بمزامنة جلسة أولاً" : "Sync a session first"}</p></div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard icon="📏" label={isAr ? "المسافة الإجمالية" : "Total Distance"} value={(n(ins.total_distance_m, Number(latestSession?.totalDistanceM ?? 0)) / 1000).toFixed(1)} unit="km" color={C.blue} delta={prevSession ? (n(ins.total_distance_m) - n(Number(prevSession.totalDistanceM))) / 1000 : null} />
                    <StatCard icon="🔥" label={isAr ? "سعرات محروقة" : "Work Calories"} value={Math.round(n(ins.work_calories_kcal, Number(latestSession?.workCaloriesKcal ?? 0)))} unit="kcal" color={C.amber} delta={prevSession ? Math.round(n(ins.work_calories_kcal) - n(Number(prevSession.workCaloriesKcal))) : null} />
                    <StatCard icon="⚡" label={isAr ? "معدل العمل" : "Work Rate"} value={n(ins.work_rate_per_min, Number(latestSession?.workRatePerMin ?? 0)).toFixed(1)} unit="m/min" color={C.green} />
                    <StatCard icon="🦘" label={isAr ? "قفزات" : "Jumps"} value={n(ins.jumps, latestSession?.jumps ?? 0)} unit="#" color={C.purple} delta={prevSession ? n(ins.jumps) - n(prevSession.jumps) : null} />
                  </div>

                  {/* Activity Ring */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-bold text-sm mb-4">🔵 {isAr ? "حلقة النشاط" : "Activity Ring"}</h3>
                    <div className="flex items-center gap-6">
                      <div className="relative flex-shrink-0" style={{ width: 120, height: 120 }}>
                        <svg width="120" height="120">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="#1e2d40" strokeWidth="12" />
                          <circle cx="60" cy="60" r="50" fill="none" stroke={C.blue} strokeWidth="12"
                            strokeDasharray={`${n(ins.active_time_percent, Number(latestSession?.activeTimePercent ?? 68.5)) / 100 * 314} 314`}
                            strokeLinecap="round" transform="rotate(-90 60 60)"
                            style={{ filter: `drop-shadow(0 0 8px ${C.blue}88)` }} />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-white font-black text-xl">{n(ins.active_time_percent, Number(latestSession?.activeTimePercent ?? 68.5)).toFixed(0)}%</span>
                          <span className="text-white/60 text-xs">{isAr ? "نشاط" : "Active"}</span>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <MetricRow icon="📏" label={isAr ? "المسافة" : "Distance"} value={(n(ins.total_distance_m, Number(latestSession?.totalDistanceM ?? 0)) / 1000).toFixed(1)} unit="km" proVal={PRO.totalDistanceKm} />
                        <MetricRow icon="👣" label={isAr ? "خطوات صالحة" : "Valid Steps"} value={n(ins.valid_steps, latestSession?.validSteps ?? 0)} unit="#" />
                        <MetricRow icon="⚡" label={isAr ? "معدل العمل" : "Work Rate"} value={n(ins.work_rate_per_min, Number(latestSession?.workRatePerMin ?? 0)).toFixed(1)} unit="m/min" />
                      </div>
                    </div>
                  </div>

                  {/* Intensity Over Time */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-bold text-sm mb-1">💓 {isAr ? "الكثافة عبر الوقت" : "Intensity Over Time"}</h3>
                    <p className="text-white/60 text-xs mb-3">{isAr ? "النبضة البدنية للاعب" : "Physical heartbeat of the player"}</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <AreaChart data={intensitySegs}>
                        <defs>
                          <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={C.red} stopOpacity={0.35} />
                            <stop offset="95%" stopColor={C.red} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="seg" tickFormatter={v => `Seg ${v}`} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "10px" }} />
                        <Area type="monotone" dataKey="load" name={isAr ? "الحمل" : "Load"} stroke={C.red} fill="url(#ig)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Jump Impact Distribution */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-sm">🦘 {isAr ? "توزيع تأثير القفز" : "Jump Impact Distribution"}</h3>
                      <MetricTooltip isAr={isAr} text={isAr ? "يصنف القفزات حسب قوة الارتطام (g-force). 4-6g = عادي، 6-8g = متوسط، 8-10g = عالي، 10g+ = مكثف جداً" : "Classifies jumps by landing impact force (g-force). 4-6g = normal, 6-8g = moderate, 8-10g = high, 10g+ = very intense. High counts in 10g+ may indicate injury risk."} />
                    </div>
                    <p className="text-white/60 text-xs mb-3">{isAr ? "قوى الحمل المفصلي عند الهبوط" : "Joint load forces absorbed upon landing"}</p>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={jumpDistData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="range" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "10px" }} />
                        <Bar dataKey="count" name={isAr ? "تكرار" : "Count"} radius={[4, 4, 0, 0]}>
                          {jumpDistData.map((_, i) => (
                            <Cell key={i} fill={[C.green, C.amber, C.orange, C.red][i]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-4 gap-2 mt-3">
                      {jumpDistData.map((d, i) => (
                        <div key={i} className="text-center bg-white/5 rounded-xl p-2">
                          <div className="text-xs text-white/60 mb-0.5">{d.range}</div>
                          <div className="font-bold text-lg" style={{ color: [C.green, C.amber, C.orange, C.red][i] }}>{d.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Work-to-Rest Ratio */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-bold text-sm">⚖️ {isAr ? "نسبة العمل/الراحة" : "Work-to-Rest Ratio"}</h3>
                      <MetricTooltip isAr={isAr} text={isAr ? "يوضح فترات النشاط والراحة عبر المباراة. اللاعب المثالي يحافظ على نسبة 1:3 (عمل:راحة)" : "Shows active vs rest periods throughout the match. Ideal ratio is 1:3 (work:rest). High work periods with short rest may lead to fatigue."} />
                    </div>
                    <p className="text-white/60 text-xs mb-3">{isAr ? "كتل النشاط العالي مقابل الاسترداد" : "Blocks of high activity stacked against recovery"}</p>
                    <ResponsiveContainer width="100%" height={120}>
                      <BarChart data={workRest} barSize={16}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="t" tickFormatter={v => `${v}m`} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "10px" }} />
                        <Bar dataKey="active" name={isAr ? "نشاط" : "Active"} radius={[3, 3, 0, 0]}>
                          {workRest.map((d: any, i: number) => (
                            <Cell key={i} fill={d.active ? C.blue : "#374151"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex gap-4 justify-center mt-2">
                      <span className="flex items-center gap-1.5 text-xs text-blue-400"><span className="w-3 h-3 rounded-sm bg-blue-400 inline-block" />{isAr ? "نشاط" : "Active"}</span>
                      <span className="flex items-center gap-1.5 text-xs text-white/60"><span className="w-3 h-3 rounded-sm bg-white/10 inline-block" />{isAr ? "راحة" : "Rest"}</span>
                    </div>
                  </div>

                  {/* Possession details */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-bold text-sm mb-4">⚽ {isAr ? "تفاصيل الاستحواذ" : "Ball Possession Details"}</h3>
                    <MetricRow icon="⚽" label={isAr ? "لمسة واحدة" : "One touch"} value={n(ins.one_touch_possessions, latestSession?.oneTouchPossessions ?? 0)} unit="#" proVal={PRO.oneTouchPossessions} />
                    <MetricRow icon="⚽" label={isAr ? "لمسات متعددة" : "Multi-touch"} value={n(ins.multi_touch_possessions, latestSession?.multiTouchPossessions ?? 0)} unit="#" proVal={PRO.multiTouchPossessions} />
                    <MetricRow icon="⏱️" label={isAr ? "مدة اللمسات المتعددة" : "Multi-touch duration"} value={n(ins.multi_touch_duration_s, Number(latestSession?.multiTouchDurationS ?? 0))} unit="sec" />
                    <MetricRow icon="📊" label={isAr ? "متوسط مدة الاستحواذ" : "Avg possession"} value={n(ins.avg_possession_duration_s, Number(latestSession?.avgPossessionDurationS ?? 0)).toFixed(1)} unit="sec" />
                    <MetricRow icon="🏃" label={isAr ? "إجمالي اللمسات" : "Total touches"} value={n(ins.total_touches, latestSession?.totalTouches ?? 0)} unit="#" />
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════ TAB: PROGRESS ══════════ */}
        <AnimatePresence mode="wait">
          {activeTab === "progress" && (
            <motion.div key="progress" variants={fadeUp} initial="enter" animate="center" exit="exit" className="space-y-4">
              {!selectedPlayerId ? (
                <div className="text-center py-20 text-white/60"><div className="text-5xl mb-3">📈</div><p>{isAr ? "اختر لاعباً لعرض تطوره" : "Select a player to view progress"}</p></div>
              ) : trendData.length === 0 ? (
                <div className="text-center py-20 text-white/60"><div className="text-5xl mb-3">📊</div><p>{isAr ? "لا توجد بيانات كافية" : "Not enough data yet"}</p></div>
              ) : (
                <>
                  {/* Skills Radar: player vs pro */}
                  {radarData.length > 0 && (
                    <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                      <h3 className="text-white font-bold text-sm mb-1">🎯 {isAr ? "بروفايل المهارات" : "Skills Profile"}</h3>
                      <p className="text-white/60 text-xs mb-3">{isAr ? "اللاعب (أزرق) مقابل المحترف (أصفر)" : "Player (blue) vs Pro benchmark (yellow)"}</p>
                      <ResponsiveContainer width="100%" height={260}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="#ffffff15" />
                          <PolarAngleAxis dataKey="metric" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "#6b7280", fontSize: 9 }} />
                          <Radar name={isAr ? "اللاعب" : "Player"} dataKey="value" stroke={C.blue} fill={C.blue} fillOpacity={0.25} strokeWidth={2} />
                          <Radar name={isAr ? "المحترف" : "Pro"} dataKey="pro" stroke={C.amber} fill={C.amber} fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 2" />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Score trends */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-bold text-sm mb-3">📈 {isAr ? "اتجاهات الدرجات" : "Score Trends"}</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={trendData}>
                        <defs>
                          {[["bc", C.blue], ["ag", C.green], ["ov", C.amber]].map(([id, c]) => (
                            <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={c} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={c} stopOpacity={0} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px" }} />
                        <Legend />
                        <Area type="monotone" dataKey="ballControl" name={isAr ? "تحكم" : "Ball Control"} stroke={C.blue} fill="url(#bc)" strokeWidth={2} />
                        <Area type="monotone" dataKey="agility" name={isAr ? "رشاقة" : "Agility"} stroke={C.green} fill="url(#ag)" strokeWidth={2} />
                        <Area type="monotone" dataKey="overall" name={isAr ? "إجمالي" : "Overall"} stroke={C.amber} fill="url(#ov)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Physical load */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-bold text-sm mb-3">💪 {isAr ? "الحمل البدني" : "Physical Load"}</h3>
                    <ResponsiveContainer width="100%" height={190}>
                      <BarChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px" }} />
                        <Legend />
                        <Bar dataKey="distance" name={isAr ? "مسافة (م)" : "Distance (m)"} fill={C.blue} radius={[4, 4, 0, 0]} />
                        <Bar dataKey="sprints" name={isAr ? "عدوات" : "Sprints"} fill={C.amber} radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Touch trend */}
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                    <h3 className="text-white font-bold text-sm mb-3">⚽ {isAr ? "اتجاه اللمسات" : "Touch Trend"}</h3>
                    <ResponsiveContainer width="100%" height={170}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <YAxis tick={{ fill: "#9ca3af", fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: "12px" }} />
                        <Line type="monotone" dataKey="touches" name={isAr ? "لمسات" : "Touches"} stroke={C.purple} strokeWidth={2.5} dot={{ fill: C.purple, r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
    </>
  );
}
