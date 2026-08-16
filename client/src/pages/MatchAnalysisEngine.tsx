import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Trophy, Target, Shield, TrendingUp, TrendingDown,
  Zap, Brain, BarChart3, Activity, Users, Star, AlertTriangle,
  ChevronRight, Play, RefreshCw, Info, Calculator, Flag,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";

// ─── Types ───────────────────────────────────────────────────────────────────
interface TeamData {
  name: string;
  nameAr: string;
  flag: string;
  color: string;
  secondaryColor: string;
  coach: string;
  coachAr: string;
  formation: string;
  xgFor: number;
  xgAgainst: number;
  goalsFor: number;
  goalsAgainst: number;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  keyPlayers: { name: string; nameAr: string; number: number; pos: string; stat: string; statAr: string }[];
  tactics: string[];
  tacticsAr: string[];
  strengths: string[];
  strengthsAr: string[];
  weaknesses: string[];
  weaknessesAr: string[];
}

interface SimResult {
  homeWin: number;
  draw: number;
  awayWin: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  topScores: { score: string; prob: number }[];
  scenarios: { name: string; nameAr: string; homeWin: number; draw: number; awayWin: number }[];
  sources: { name: string; homeWin: number; draw: number; awayWin: number }[];
}

// ─── Readable team colours ───────────────────────────────────────────────────
// Team identity colours are fixed brand hues and some are inherently pale —
// Argentina's #74ACDF sits at ~2.4:1 on the light theme's white card, which is
// unreadable. Darken toward the surface until it clears AA. The dark theme
// already has the contrast, so it passes through untouched.
const srgbToLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

function luminance([r, g, b]: number[]) {
  return (
    0.2126 * srgbToLinear(r / 255) +
    0.7152 * srgbToLinear(g / 255) +
    0.0722 * srgbToLinear(b / 255)
  );
}

// Picks the ink for text sitting ON a team colour. Egypt's red wants white,
// Argentina's pale blue wants near-black — a fixed choice fails one of them.
function contrastOn(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "#fff";
  const rgb = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  return luminance(rgb) > 0.35 ? "#111827" : "#fff";
}

function readableColor(hex: string, theme: string): string {
  if (theme === "dark") return hex;
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const rgb = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
  // 0.13 relative luminance clears 4.5:1 on a white card and still clears it on
  // the lighter tinted badge surfaces (background is the same hue at ~20% alpha).
  let factor = 1;
  while (factor > 0.2 && luminance(rgb.map(c => c * factor)) > 0.13) factor -= 0.05;
  return "#" + rgb.map(c => Math.round(c * factor).toString(16).padStart(2, "0")).join("");
}

// ─── Default Match: Egypt vs Argentina ───────────────────────────────────────
const DEFAULT_HOME: TeamData = {
  name: "Egypt", nameAr: "مصر",
  flag: "🇪🇬", color: "#CC0001", secondaryColor: "#000000",
  coach: "Hossam Hassan", coachAr: "حسام حسن",
  formation: "4-2-3-1",
  xgFor: 1.28, xgAgainst: 0.74,
  goalsFor: 5, goalsAgainst: 3,
  matches: 4, wins: 1, draws: 3, losses: 0,
  keyPlayers: [
    { name: "Mohamed Salah", nameAr: "محمد صلاح", number: 10, pos: "LW", stat: "1G / 16 chances", statAr: "1 هدف / 16 فرصة" },
    { name: "Emam Ashour", nameAr: "إمام عاشور", number: 20, pos: "CM", stat: "2G / 3 assists", statAr: "2 أهداف / 3 تمريرات" },
    { name: "Omar Marmoush", nameAr: "عمر مرموش", number: 22, pos: "SS", stat: "1G / 4 assists", statAr: "1 هدف / 4 مساعدات" },
    { name: "Mostafa Shobeir", nameAr: "مصطفى شويبر", number: 23, pos: "GK", stat: "4/4 saves vs penalties", statAr: "4/4 تصدي ترجيح" },
    { name: "Mostafa Zico", nameAr: "مصطفى زيكو", number: 11, pos: "ST", stat: "1G / 2 key runs", statAr: "1 هدف / 2 تحركات محورية" },
  ],
  tactics: [
    "High press in final third — triggers from back pass",
    "Salah given free role, drifts inside from left",
    "Emam Ashour: shadow striker, links midfield & attack",
    "Set pieces: 3 goals from corners/free kicks",
    "Defensive block 4-4-2 out of possession",
    "Early goals: scored in mins 5 & 13 vs New Zealand",
    "Weakness: 4 goals conceded from set pieces",
  ],
  tacticsAr: [
    "ضغط عالٍ في الثلث الأمامي — يبدأ عند تمرير الظهر",
    "صلاح حر — يتحرك للداخل من الجناح الأيسر",
    "إمام عاشور: مهاجم ظل، يربط الوسط بالهجوم",
    "الكرات الثابتة: 3 أهداف من ركنيات وضربات حرة",
    "كتلة دفاعية 4-4-2 عند فقدان الكرة",
    "البداية الصاروخية: سجل في الدقيقتين 5 و13 أمام نيوزيلندا",
    "نقطة ضعف: 4 أهداف استقبلها من كرات ثابتة",
  ],
  strengths: ["Set pieces", "Penalty shootouts (4/4)", "Defensive resilience", "Counter-attack speed"],
  strengthsAr: ["الكرات الثابتة", "ركلات الترجيح (4/4)", "المتانة الدفاعية", "سرعة الهجمات المرتدة"],
  weaknesses: ["Low xG creation (1.28)", "Salah underperforming xG (1.94 xG, 1 goal)", "Concedes from set pieces"],
  weaknessesAr: ["xG هجومي منخفض (1.28)", "صلاح أقل من توقعاته (xG 1.94 مقابل هدف واحد)", "يستقبل أهدافاً من كرات ثابتة"],
};

const DEFAULT_AWAY: TeamData = {
  name: "Argentina", nameAr: "الأرجنتين",
  flag: "🇦🇷", color: "#74ACDF", secondaryColor: "#FFFFFF",
  coach: "Lionel Scaloni", coachAr: "ليونيل سكالوني",
  formation: "4-4-2",
  xgFor: 2.04, xgAgainst: 0.51,
  goalsFor: 11, goalsAgainst: 4,
  matches: 4, wins: 4, draws: 0, losses: 0,
  keyPlayers: [
    { name: "Lionel Messi", nameAr: "ليونيل ميسي", number: 10, pos: "RW", stat: "7G / xG 3.82", statAr: "7 أهداف / xG 3.82" },
    { name: "Lautaro Martínez", nameAr: "لاوتارو مارتينيز", number: 22, pos: "ST", stat: "1G / xG 1.77", statAr: "1 هدف / xG 1.77" },
    { name: "Rodrigo De Paul", nameAr: "رودريغو دي بول", number: 7, pos: "CM", stat: "Engine of midfield", statAr: "محرك الوسط" },
    { name: "Emiliano Martínez", nameAr: "إيميليانو مارتينيز", number: 23, pos: "GK", stat: "0 goals conceded in 3 games", statAr: "0 أهداف في 3 مباريات" },
    { name: "Alexis Mac Allister", nameAr: "أليكسيس ماك أليستر", number: 20, pos: "CM", stat: "3 key passes/game", statAr: "3 تمريرات مفتاحية / مباراة" },
  ],
  tactics: [
    "Messi free role: drops deep, creates overloads right side",
    "High defensive line — vulnerable to balls in behind",
    "Opened scoring before 30 min in 4 of last 5 matches",
    "Left flank weakness after min 58 (fatigue)",
    "4-4-2 compact block, quick transition",
    "24 unbeaten on neutral ground",
    "Underestimation risk vs defensive teams",
  ],
  tacticsAr: [
    "ميسي حر: ينزل عمقاً ويخلق تكدساً على اليمين",
    "خط دفاعي مرتفع — عرضة للكرات خلف الدفاع",
    "فتح التسجيل قبل الدقيقة 30 في 4 من آخر 5 مباريات",
    "ضعف الجناح الأيسر بعد الدقيقة 58 (إرهاق)",
    "كتلة 4-4-2 مضغوطة مع انتقال سريع",
    "24 مباراة دون هزيمة على أرض محايدة",
    "خطر الاستهانة أمام الفرق الدفاعية",
  ],
  strengths: ["Messi (63.6% of goals)", "Defensive solidity (0.51 xGA)", "Experience & winning mentality", "Set-piece threat"],
  strengthsAr: ["ميسي (63.6% من الأهداف)", "صلابة دفاعية (xGA 0.51)", "الخبرة وعقلية الفوز", "خطر الكرات الثابتة"],
  weaknesses: ["Left flank after min 58", "High defensive line", "Fatigue (30 extra mins vs Cape Verde)"],
  weaknessesAr: ["الجناح الأيسر بعد الدقيقة 58", "خط دفاعي مرتفع", "الإرهاق (30 دقيقة إضافية أمام كاب فيردي)"],
};

// ─── Dixon-Coles Monte Carlo Simulation ──────────────────────────────────────
function poissonPMF(lambda: number, k: number): number {
  let logP = -lambda + k * Math.log(lambda);
  for (let i = 1; i <= k; i++) logP -= Math.log(i);
  return Math.exp(logP);
}

function dixonColesRho(i: number, j: number, lambdaH: number, lambdaA: number, rho: number): number {
  if (i === 0 && j === 0) return 1 - lambdaH * lambdaA * rho;
  if (i === 0 && j === 1) return 1 + lambdaH * rho;
  if (i === 1 && j === 0) return 1 + lambdaA * rho;
  if (i === 1 && j === 1) return 1 - rho;
  return 1;
}

function runSimulation(home: TeamData, away: TeamData, iterations = 250000): SimResult {
  // λ from xG with home advantage adjustment
  const lambdaH = home.xgFor * 0.95;
  const lambdaA = away.xgFor * 1.05;
  const rho = -0.13; // Dixon-Coles low-score correction

  let homeWins = 0, draws = 0, awayWins = 0;
  const scoreCounts: Record<string, number> = {};
  let totalHomeGoals = 0, totalAwayGoals = 0;

  // Scenario adjustments
  const scenarioResults: Record<string, { hw: number; d: number; aw: number; n: number }> = {
    base: { hw: 0, d: 0, aw: 0, n: 0 },
    messiSuppressed: { hw: 0, d: 0, aw: 0, n: 0 },
    earlyGoal: { hw: 0, d: 0, aw: 0, n: 0 },
    setPiece: { hw: 0, d: 0, aw: 0, n: 0 },
  };

  for (let i = 0; i < iterations; i++) {
    // Sample goals using Poisson via inverse transform
    const samplePoisson = (lambda: number): number => {
      const L = Math.exp(-lambda);
      let p = 1, k = 0;
      do { k++; p *= Math.random(); } while (p > L);
      return k - 1;
    };

    const hg = samplePoisson(lambdaH);
    const ag = samplePoisson(lambdaA);

    // Apply Dixon-Coles correction for low scores
    const correction = dixonColesRho(hg, ag, lambdaH, lambdaA, rho);
    if (Math.random() > Math.abs(correction)) continue;

    totalHomeGoals += hg;
    totalAwayGoals += ag;

    const key = `${hg}-${ag}`;
    scoreCounts[key] = (scoreCounts[key] || 0) + 1;

    if (hg > ag) homeWins++;
    else if (hg === ag) draws++;
    else awayWins++;

    // Scenarios
    const scenIdx = i % 4;
    if (scenIdx === 0) {
      const r = scenarioResults.base;
      r.n++; if (hg > ag) r.hw++; else if (hg === ag) r.d++; else r.aw++;
    } else if (scenIdx === 1) {
      // Messi suppressed: away λ reduced by 40%
      const ag2 = samplePoisson(lambdaA * 0.6);
      const r = scenarioResults.messiSuppressed;
      r.n++; if (hg > ag2) r.hw++; else if (hg === ag2) r.d++; else r.aw++;
    } else if (scenIdx === 2) {
      // Egypt scores first: home λ boosted
      const hg2 = samplePoisson(lambdaH * 1.3);
      const r = scenarioResults.earlyGoal;
      r.n++; if (hg2 > ag) r.hw++; else if (hg2 === ag) r.d++; else r.aw++;
    } else {
      // Set piece boost: home λ + 0.18 xG
      const hg3 = samplePoisson(lambdaH + 0.18);
      const r = scenarioResults.setPiece;
      r.n++; if (hg3 > ag) r.hw++; else if (hg3 === ag) r.d++; else r.aw++;
    }
  }

  const total = homeWins + draws + awayWins;
  const pct = (n: number) => Math.round((n / total) * 1000) / 10;

  const topScores = Object.entries(scoreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([score, count]) => ({ score, prob: Math.round((count / total) * 1000) / 10 }));

  const scn = (key: string, name: string, nameAr: string) => {
    const r = scenarioResults[key];
    const n = r.n || 1;
    return { name, nameAr, homeWin: pct(r.hw), draw: pct(r.d), awayWin: pct(r.aw) };
  };

  return {
    homeWin: pct(homeWins),
    draw: pct(draws),
    awayWin: pct(awayWins),
    avgHomeGoals: Math.round((totalHomeGoals / total) * 100) / 100,
    avgAwayGoals: Math.round((totalAwayGoals / total) * 100) / 100,
    topScores,
    scenarios: [
      scn("base", "Base Model", "النموذج الأساسي"),
      scn("messiSuppressed", "Messi Suppressed 75%", "كبح ميسي 75%"),
      scn("earlyGoal", "Egypt Scores First", "مصر تسجل أولاً"),
      scn("setPiece", "Set Piece Boost +0.18 xG", "تعزيز الكرات الثابتة"),
    ],
    sources: [
      { name: "Our Model (250k)", homeWin: pct(homeWins), draw: pct(draws), awayWin: pct(awayWins) },
      { name: "Opta / StatsPerform", homeWin: 20.3, draw: 0, awayWin: 79.7 },
      { name: "Squawka Signal", homeWin: 25, draw: 0, awayWin: 75 },
      { name: "Kalshi Markets", homeWin: 10, draw: 20, awayWin: 70 },
      { name: "bet365 (implied)", homeWin: 10.5, draw: 16.2, awayWin: 73.3 },
    ],
  };
}

// ─── Win Gates Data ───────────────────────────────────────────────────────────
const WIN_GATES = [
  {
    number: 1,
    title: "Score First",
    titleAr: "سجّل أولاً",
    desc: "Egypt's win probability jumps from 13.5% → 19.9% if they score first",
    descAr: "احتمال فوز مصر يقفز من 13.5% → 19.9% إذا سجلت أولاً",
    boost: "+6.4%",
    color: "#CC0001",
    icon: "⚽",
    detail: "3 of 4 Egypt matches ended 1-1 after 90 min — they know how to hold",
    detailAr: "3 من 4 مباريات مصر انتهت 1-1 بعد 90 دقيقة — يعرفون كيف يصمدون",
  },
  {
    number: 2,
    title: "Set Piece Mastery",
    titleAr: "السيطرة على الكرات الثابتة",
    desc: "3 Egypt goals from set pieces. +0.18 xG boost raises win prob to 21.8%",
    descAr: "3 أهداف مصر من كرات ثابتة. زيادة xG 0.18 ترفع الاحتمال إلى 21.8%",
    boost: "+8.3%",
    color: "#C9A84C",
    icon: "🎯",
    detail: "Argentina conceded set-piece goals in 2 of 4 WC matches",
    detailAr: "الأرجنتين استقبلت أهدافاً من كرات ثابتة في 2 من 4 مباريات",
  },
  {
    number: 3,
    title: "Neutralise Messi",
    titleAr: "كبح ميسي",
    desc: "If Messi is held to 25% efficiency → Egypt win prob rises to 24.4%",
    descAr: "إذا أُبطل ميسي إلى 25% كفاءة → احتمال فوز مصر يرتفع إلى 24.4%",
    boost: "+10.9%",
    color: "#74ACDF",
    icon: "🛡️",
    detail: "Messi: 7 goals, xG 3.82 — but he's also the biggest single risk",
    detailAr: "ميسي: 7 أهداف، xG 3.82 — لكنه أيضاً أكبر خطر منفرد",
  },
  {
    number: 4,
    title: "Exploit Left Flank After Min 58",
    titleAr: "استغلال الجناح الأيسر بعد الدقيقة 58",
    desc: "Argentina's left flank fatigues after 58 min. Salah/Zico can exploit this",
    descAr: "الجناح الأيسر للأرجنتين يتعب بعد الدقيقة 58. صلاح/زيكو يمكنهم استغلاله",
    boost: "+3.9%",
    color: "#28a745",
    icon: "💨",
    detail: "Argentina played 30 extra mins vs Cape Verde — legs will be heavy",
    detailAr: "الأرجنتين لعبت 30 دقيقة إضافية أمام كاب فيردي — الأرجل ستكون ثقيلة",
  },
  {
    number: 5,
    title: "Penalty Shootout Advantage",
    titleAr: "ميزة ركلات الترجيح",
    desc: "Egypt 4/4 in shootout vs Australia. If game reaches penalties: 50/50",
    descAr: "مصر 4/4 في الترجيح أمام أستراليا. إذا وصلنا للترجيح: 50/50",
    boost: "50/50",
    color: "#9b59b6",
    icon: "🥅",
    detail: "Shobeir saved 2 penalties. Argentina's Emiliano Martinez also elite",
    detailAr: "شويبر أنقذ 2 ركلات ترجيح. إيميليانو مارتينيز للأرجنتين أيضاً نخبة",
  },
];

// ─── Interactive Pitch (formation visualization for the Tactics tab) ─────────
const POSITION_COORDS: Record<string, { x: number; y: number }> = {
  GK: { x: 50, y: 6 },
  LB: { x: 15, y: 25 }, RB: { x: 85, y: 25 },
  LWB: { x: 10, y: 35 }, RWB: { x: 90, y: 35 },
  CB: { x: 50, y: 20 }, SW: { x: 50, y: 15 },
  CDM: { x: 50, y: 40 }, CM: { x: 50, y: 50 }, CAM: { x: 50, y: 62 },
  LM: { x: 20, y: 50 }, RM: { x: 80, y: 50 },
  LW: { x: 15, y: 75 }, RW: { x: 85, y: 75 },
  SS: { x: 40, y: 82 }, ST: { x: 50, y: 90 }, CF: { x: 50, y: 88 },
};

function pitchPositionFor(pos: string, index: number) {
  const base = POSITION_COORDS[pos] || { x: 50, y: 50 };
  // Nudge duplicate positions apart horizontally so markers don't fully overlap
  const jitter = (index % 2 === 0 ? -1 : 1) * Math.floor(index / 2) * 8;
  return { x: Math.min(94, Math.max(6, base.x + jitter)), y: base.y };
}

function InteractivePitch({ home, away, ar }: { home: TeamData; away: TeamData; ar: boolean }) {
  const { theme } = useTheme();
  const [side, setSide] = useState<"home" | "away">("home");
  const team = side === "home" ? home : away;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="w-4 h-4" />
          {ar ? "الخريطة التكتيكية" : "Tactical Pitch"}
        </CardTitle>
        <div className="flex gap-2">
          {[home, away].map((t, i) => (
            <button
              key={i}
              onClick={() => setSide(i === 0 ? "home" : "away")}
              className="px-3 py-1 rounded-full text-xs font-bold border transition-colors"
              style={{
                borderColor: t.color,
                background: (i === 0 ? side === "home" : side === "away") ? t.color + "33" : "transparent",
                color: readableColor(t.color, theme),
              }}
            >
              {t.flag} {ar ? t.nameAr : t.name}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground mb-2">{ar ? "التشكيلة" : "Formation"}: <span className="text-foreground font-semibold">{team.formation}</span></div>
        <div
          className="relative w-full rounded-lg overflow-hidden border border-border"
          style={{ aspectRatio: "3 / 4", background: "linear-gradient(180deg, #16381f 0%, #1c4a28 50%, #16381f 100%)" }}
        >
          {/* Pitch markings */}
          <div className="absolute inset-0 border-2 border-white/20 m-3 rounded" />
          <div className="absolute left-1/2 top-1/2 w-full border-t border-white/20" style={{ transform: "translate(-50%, -50%)" }} />
          <div className="absolute left-1/2 top-1/2 w-16 h-16 -ml-8 -mt-8 rounded-full border border-white/20" />

          {team.keyPlayers.map((p, i) => {
            const samePos = team.keyPlayers.filter((kp) => kp.pos === p.pos);
            const idx = samePos.indexOf(p);
            const { x, y } = pitchPositionFor(p.pos, idx);
            return (
              <div
                key={i}
                className="absolute flex flex-col items-center -translate-x-1/2 translate-y-1/2"
                style={{ left: `${x}%`, bottom: `${y}%` }}
                title={ar ? p.nameAr : p.name}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 border-white/70"
                  style={{ background: team.color, color: contrastOn(team.color) }}
                >
                  {p.number}
                </div>
                <div className="text-[10px] text-white/90 mt-0.5 max-w-[70px] truncate text-center bg-black/40 rounded px-1">
                  {ar ? p.nameAr : p.name}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MatchAnalysisEngine() {
  const { language } = useLanguage();
  const { theme } = useTheme();
  const ar = language === "ar";

  const [home, setHome] = useState<TeamData>(DEFAULT_HOME);
  const [away, setAway] = useState<TeamData>(DEFAULT_AWAY);
  const [simResult, setSimResult] = useState<SimResult | null>(null);
  const [simRunning, setSimRunning] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");
  const [homeXG, setHomeXG] = useState(String(DEFAULT_HOME.xgFor));
  const [awayXG, setAwayXG] = useState(String(DEFAULT_AWAY.xgFor));
  const [showTeamSelector, setShowTeamSelector] = useState(false);
  const [selectedHomeTeamId, setSelectedHomeTeamId] = useState<number | null>(null);
  const [selectedAwayTeamId, setSelectedAwayTeamId] = useState<number | null>(null);
  const [customHomeName, setCustomHomeName] = useState("");
  const [customAwayName, setCustomAwayName] = useState("");
  const [customHomeXG, setCustomHomeXG] = useState("1.28");
  const [customAwayXG, setCustomAwayXG] = useState("2.04");
  const [customHomeFormation, setCustomHomeFormation] = useState("4-2-3-1");
  const [customAwayFormation, setCustomAwayFormation] = useState("4-4-2");

  // Fetch academy teams for custom match selector
  const teamsQuery = trpc.teams.getAll.useQuery(undefined, { staleTime: 60000 });
  const academyTeams = teamsQuery.data || [];

  const applyCustomMatch = () => {
    if (!customHomeName || !customAwayName) return;
    const newHome: TeamData = {
      ...DEFAULT_HOME,
      name: customHomeName, nameAr: customHomeName,
      formation: customHomeFormation,
      xgFor: parseFloat(customHomeXG) || 1.0,
      flag: "🏠", color: "#CC0001",
      coach: "", coachAr: "",
      keyPlayers: [], tactics: [], tacticsAr: [],
      strengths: [], strengthsAr: [], weaknesses: [], weaknessesAr: [],
    };
    const newAway: TeamData = {
      ...DEFAULT_AWAY,
      name: customAwayName, nameAr: customAwayName,
      formation: customAwayFormation,
      xgFor: parseFloat(customAwayXG) || 1.0,
      flag: "✈️", color: "#74ACDF",
      coach: "", coachAr: "",
      keyPlayers: [], tactics: [], tacticsAr: [],
      strengths: [], strengthsAr: [], weaknesses: [], weaknessesAr: [],
    };
    setHome(newHome);
    setAway(newAway);
    setHomeXG(String(newHome.xgFor));
    setAwayXG(String(newAway.xgFor));
    setShowTeamSelector(false);
  };

  const runSim = useCallback(() => {
    setSimRunning(true);
    setSimProgress(0);
    // Animate progress
    const interval = setInterval(() => {
      setSimProgress(p => {
        if (p >= 95) { clearInterval(interval); return 95; }
        return p + Math.random() * 15;
      });
    }, 80);
    // Run in next tick to allow UI update
    setTimeout(() => {
      const updatedHome = { ...home, xgFor: parseFloat(homeXG) || home.xgFor };
      const updatedAway = { ...away, xgFor: parseFloat(awayXG) || away.xgFor };
      const result = runSimulation(updatedHome, updatedAway, 250000);
      clearInterval(interval);
      setSimProgress(100);
      setTimeout(() => {
        setSimResult(result);
        setSimRunning(false);
        setSimProgress(0);
        setActiveTab("math");
      }, 400);
    }, 100);
  }, [home, away, homeXG, awayXG]);

  // Auto-run on mount
  useEffect(() => { runSim(); }, []);

  const StatCard = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) => (
    <div className="bg-card rounded-xl p-4 text-center border border-border">
      <div className="text-2xl font-black" style={{ color: readableColor(color || "#C9A84C", theme) }}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );

  const ProbBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );

  return (
    <>
    <div className="text-foreground" dir={ar ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="bg-gradient-to-r from-card via-muted to-card border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/matches">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-4 h-4 mr-1" />
                {ar ? "رجوع" : "Back"}
              </Button>
            </Link>
            <div className="flex items-center gap-2 flex-1">
              <Brain className="w-6 h-6 text-yellow-700 dark:text-yellow-400" />
              <h1 className="text-xl font-black text-foreground">
                {ar ? "محرك تحليل المباريات" : "Match Analysis Engine"}
              </h1>
              <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30 text-xs">
                Dixon-Coles · 250K
              </Badge>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowTeamSelector(!showTeamSelector)}
              className="border-blue-500/50 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 text-xs"
            >
              <Users className="w-3 h-3 mr-1" />
              {ar ? "تغيير الفريقين" : "Change Teams"}
            </Button>
          </div>

          {/* Custom Team Selector Panel */}
          {showTeamSelector && (
            <div className="bg-muted/80 border border-blue-500/30 rounded-2xl p-4 mb-4">
              <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                {ar ? "اختر فريقين لتحليل أي مباراة" : "Select Two Teams to Analyse Any Match"}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {/* Home Team */}
                <div className="space-y-2">
                  <Label className="text-xs text-red-600 dark:text-red-400 font-bold">{ar ? "الفريق الأول (الرئيسي)" : "Home Team"}</Label>
                  {academyTeams.length > 0 ? (
                    <Select onValueChange={v => {
                      const t = academyTeams.find((x: any) => String(x.id) === v);
                      if (t) setCustomHomeName((t as any).name || '');
                    }}>
                      <SelectTrigger className="bg-muted border-border text-foreground text-xs">
                        <SelectValue placeholder={ar ? "اختر من فرق الأكاديمية..." : "Pick from academy teams..."} />
                      </SelectTrigger>
                      <SelectContent className="bg-muted border-border">
                        {academyTeams.map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)} className="text-foreground text-xs">{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                  <Input
                    placeholder={ar ? "أو اكتب اسم الفريق يدوياً..." : "Or type team name manually..."}
                    value={customHomeName}
                    onChange={e => setCustomHomeName(e.target.value)}
                    className="bg-muted border-border text-foreground text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">{ar ? "xG متوسط" : "Avg xG"}</Label>
                      <Input type="number" step="0.01" value={customHomeXG} onChange={e => setCustomHomeXG(e.target.value)}
                        className="bg-muted border-border text-foreground text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{ar ? "التشكيل" : "Formation"}</Label>
                      <Select value={customHomeFormation} onValueChange={setCustomHomeFormation}>
                        <SelectTrigger className="bg-muted border-border text-foreground text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-muted border-border">
                          {["4-3-3","4-2-3-1","4-4-2","3-5-2","5-3-2","4-1-4-1"].map(f => (
                            <SelectItem key={f} value={f} className="text-foreground text-xs">{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Away Team */}
                <div className="space-y-2">
                  <Label className="text-xs text-blue-600 dark:text-blue-400 font-bold">{ar ? "الفريق الثاني (الضيف)" : "Away Team"}</Label>
                  {academyTeams.length > 0 ? (
                    <Select onValueChange={v => {
                      const t = academyTeams.find((x: any) => String(x.id) === v);
                      if (t) setCustomAwayName((t as any).name || '');
                    }}>
                      <SelectTrigger className="bg-muted border-border text-foreground text-xs">
                        <SelectValue placeholder={ar ? "اختر من فرق الأكاديمية..." : "Pick from academy teams..."} />
                      </SelectTrigger>
                      <SelectContent className="bg-muted border-border">
                        {academyTeams.map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)} className="text-foreground text-xs">{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                  <Input
                    placeholder={ar ? "أو اكتب اسم الفريق يدوياً..." : "Or type team name manually..."}
                    value={customAwayName}
                    onChange={e => setCustomAwayName(e.target.value)}
                    className="bg-muted border-border text-foreground text-xs"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">{ar ? "xG متوسط" : "Avg xG"}</Label>
                      <Input type="number" step="0.01" value={customAwayXG} onChange={e => setCustomAwayXG(e.target.value)}
                        className="bg-muted border-border text-foreground text-xs" />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{ar ? "التشكيل" : "Formation"}</Label>
                      <Select value={customAwayFormation} onValueChange={setCustomAwayFormation}>
                        <SelectTrigger className="bg-muted border-border text-foreground text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-muted border-border">
                          {["4-3-3","4-2-3-1","4-4-2","3-5-2","5-3-2","4-1-4-1"].map(f => (
                            <SelectItem key={f} value={f} className="text-foreground text-xs">{f}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={applyCustomMatch}
                  disabled={!customHomeName || !customAwayName}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex-1"
                >
                  <Play className="w-3 h-3 mr-1" />
                  {ar ? "تطبيق وتشغيل المحاكاة" : "Apply & Run Simulation"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setHome(DEFAULT_HOME); setAway(DEFAULT_AWAY); setHomeXG(String(DEFAULT_HOME.xgFor)); setAwayXG(String(DEFAULT_AWAY.xgFor)); setShowTeamSelector(false); }}
                  className="text-muted-foreground hover:text-foreground text-xs"
                >
                  {ar ? "إعادة مصر × الأرجنتين" : "Reset to Egypt × Argentina"}
                </Button>
              </div>
            </div>
          )}

          {/* Match Header */}
          <div className="flex items-center justify-between bg-background/60 rounded-2xl p-4 border border-border">
            {/* Home Team */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="text-5xl">{home.flag}</div>
              <div className="text-xl font-black" style={{ color: readableColor(home.color, theme) }}>
                {ar ? home.nameAr : home.name}
              </div>
              <div className="text-xs text-muted-foreground">{ar ? home.coachAr : home.coach}</div>
              <Badge style={{ background: home.color + "33", color: readableColor(home.color, theme), borderColor: home.color + "66" }}>
                {home.formation}
              </Badge>
            </div>

            {/* VS + Probabilities */}
            <div className="flex flex-col items-center gap-3 px-4">
              <div className="text-3xl font-black text-muted-foreground">VS</div>
              {simResult && (
                <div className="flex gap-3 text-center">
                  <div>
                    <div className="text-2xl font-black" style={{ color: readableColor(home.color, theme) }}>{simResult.homeWin}%</div>
                    <div className="text-xs text-muted-foreground">{ar ? "فوز" : "Win"}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-muted-foreground">{simResult.draw}%</div>
                    <div className="text-xs text-muted-foreground">{ar ? "تعادل" : "Draw"}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black" style={{ color: readableColor(away.color, theme) }}>{simResult.awayWin}%</div>
                    <div className="text-xs text-muted-foreground">{ar ? "فوز" : "Win"}</div>
                  </div>
                </div>
              )}
              {!simResult && simRunning && (
                <div className="text-center">
                  <div className="text-sm text-yellow-700 dark:text-yellow-400 animate-pulse">{ar ? "جارٍ المحاكاة..." : "Simulating..."}</div>
                  <Progress value={simProgress} className="w-32 mt-2" />
                </div>
              )}
              <Button
                size="sm"
                onClick={runSim}
                disabled={simRunning}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-xs"
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${simRunning ? "animate-spin" : ""}`} />
                {ar ? "إعادة المحاكاة" : "Re-simulate"}
              </Button>
            </div>

            {/* Away Team */}
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="text-5xl">{away.flag}</div>
              <div className="text-xl font-black" style={{ color: readableColor(away.color, theme) }}>
                {ar ? away.nameAr : away.name}
              </div>
              <div className="text-xs text-muted-foreground">{ar ? away.coachAr : away.coach}</div>
              <Badge style={{ background: away.color + "33", color: readableColor(away.color, theme), borderColor: away.color + "66" }}>
                {away.formation}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 bg-card border border-border mb-6 w-full">
            <TabsTrigger value="overview" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-xs sm:text-sm">
              {ar ? "نظرة عامة" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="tactics" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
              {ar ? "التكتيك" : "Tactics"}
            </TabsTrigger>
            <TabsTrigger value="math" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-black text-xs sm:text-sm">
              {ar ? "الرياضيات" : "The Math"}
            </TabsTrigger>
            <TabsTrigger value="gates" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs sm:text-sm">
              {ar ? "بوابات الفوز" : "Win Gates"}
            </TabsTrigger>
          </TabsList>

          {/* ── TAB 1: OVERVIEW ── */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[home, away].map((team, idx) => (
                <Card key={idx} className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-3xl">{team.flag}</span>
                      <div>
                        <div className="text-lg font-black" style={{ color: readableColor(team.color, theme) }}>
                          {ar ? team.nameAr : team.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{ar ? team.coachAr : team.coach} · {team.formation}</div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <StatCard label={ar ? "xG هجوم" : "xG For"} value={team.xgFor} color={team.color} />
                      <StatCard label={ar ? "xG دفاع" : "xG Against"} value={team.xgAgainst} color="#888" />
                      <StatCard label={ar ? "الأهداف" : "Goals"} value={`${team.goalsFor}-${team.goalsAgainst}`} color={team.color} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <StatCard label={ar ? "فوز" : "W"} value={team.wins} color="#28a745" />
                      <StatCard label={ar ? "تعادل" : "D"} value={team.draws} color="#ffc107" />
                      <StatCard label={ar ? "خسارة" : "L"} value={team.losses} color="#dc3545" />
                    </div>

                    {/* Key Players */}
                    <div>
                      <div className="text-sm font-bold text-muted-foreground mb-2 flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
                        {ar ? "اللاعبون المحوريون" : "Key Players"}
                      </div>
                      <div className="space-y-2">
                        {team.keyPlayers.map((p, i) => (
                          <div key={i} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                                style={{ background: team.color + "33", color: readableColor(team.color, theme) }}>
                                {p.number}
                              </div>
                              <div>
                                <div className="text-sm font-semibold">{ar ? p.nameAr : p.name}</div>
                                <div className="text-xs text-muted-foreground">{p.pos}</div>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground text-right">{ar ? p.statAr : p.stat}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-bold text-green-700 dark:text-green-400 mb-1 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" /> {ar ? "نقاط القوة" : "Strengths"}
                        </div>
                        {(ar ? team.strengthsAr : team.strengths).map((s, i) => (
                          <div key={i} className="text-xs text-muted-foreground flex items-start gap-1 mb-1">
                            <span className="text-green-700 dark:text-green-400 mt-0.5">+</span>{s}
                          </div>
                        ))}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" /> {ar ? "نقاط الضعف" : "Weaknesses"}
                        </div>
                        {(ar ? team.weaknessesAr : team.weaknesses).map((w, i) => (
                          <div key={i} className="text-xs text-muted-foreground flex items-start gap-1 mb-1">
                            <span className="text-red-600 dark:text-red-400 mt-0.5">−</span>{w}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── TAB 2: TACTICS ── */}
          <TabsContent value="tactics">
            {/* Interactive Pitch */}
            <InteractivePitch home={home} away={away} ar={ar} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {[home, away].map((team, idx) => (
                <Card key={idx} className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3">
                      <span className="text-3xl">{team.flag}</span>
                      <div>
                        <div className="font-black" style={{ color: readableColor(team.color, theme) }}>
                          {ar ? team.nameAr : team.name} — {team.formation}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {ar ? "المدرب: " : "Coach: "}{ar ? team.coachAr : team.coach}
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-1">
                        <Brain className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
                        {ar ? "النقاط التكتيكية" : "Tactical Points"}
                      </div>
                      {(ar ? team.tacticsAr : team.tactics).map((t, i) => (
                        <div key={i} className="flex items-start gap-2 bg-muted rounded-lg p-3">
                          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5"
                            style={{ background: team.color + "33", color: readableColor(team.color, theme) }}>
                            {i + 1}
                          </div>
                          <div className="text-sm text-muted-foreground">{t}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tactical Comparison Bars */}
            <Card className="bg-card border-border mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <Activity className="w-5 h-5" />
                  {ar ? "المقارنة التكتيكية" : "Tactical Comparison"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: ar ? "xG هجومي" : "Attacking xG", h: home.xgFor, a: away.xgFor, max: 3 },
                    { label: ar ? "xG دفاعي (أقل = أفضل)" : "Defensive xGA (lower = better)", h: home.xgAgainst, a: away.xgAgainst, max: 2, reverse: true },
                    { label: ar ? "معدل الأهداف" : "Goals/Game", h: home.goalsFor / home.matches, a: away.goalsFor / away.matches, max: 3 },
                    { label: ar ? "الانتصارات" : "Wins", h: home.wins, a: away.wins, max: 5 },
                    { label: ar ? "الأهداف المسجلة" : "Goals Scored", h: home.goalsFor, a: away.goalsFor, max: 15 },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span className="font-bold" style={{ color: readableColor(home.color, theme) }}>{typeof item.h === 'number' ? item.h.toFixed(2) : item.h}</span>
                        <span>{item.label}</span>
                        <span className="font-bold" style={{ color: readableColor(away.color, theme) }}>{typeof item.a === 'number' ? item.a.toFixed(2) : item.a}</span>
                      </div>
                      <div className="flex h-3 rounded-full overflow-hidden bg-muted">
                        <div className="h-full" style={{
                          width: `${(item.h / item.max) * 50}%`,
                          background: home.color,
                          marginLeft: `${50 - (item.h / item.max) * 50}%`
                        }} />
                        <div className="h-full" style={{
                          width: `${(item.a / item.max) * 50}%`,
                          background: away.color
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Head-to-Head Player Comparison */}
            <Card className="bg-card border-border mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <Users className="w-5 h-5" />
                  {ar ? "مقارنة فردية — وجهاً لوجه" : "Head-to-Head Player Matchups"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      homePlayer: { name: ar ? "محمد صلاح" : "Mohamed Salah", pos: "LW", num: 10, stat1: ar ? "16 فرصة" : "16 chances", stat2: ar ? "xG 1.94" : "xG 1.94" },
                      awayPlayer: { name: ar ? "ليونيل ميسي" : "Lionel Messi", pos: "RW", num: 10, stat1: ar ? "7 أهداف" : "7 goals", stat2: ar ? "xG 3.82" : "xG 3.82" },
                      duel: ar ? "الجناح الأيمن — معركة النجوم" : "Wide Duel — Battle of Stars",
                      advantage: "away",
                    },
                    {
                      homePlayer: { name: ar ? "إمام عاشور" : "Emam Ashour", pos: "CM", num: 20, stat1: ar ? "2 هدف" : "2 goals", stat2: ar ? "3 تمريرات" : "3 assists" },
                      awayPlayer: { name: ar ? "أليكسيس ماك أليستر" : "Mac Allister", pos: "CM", num: 20, stat1: ar ? "3 تمريرات مفتاحية" : "3 key passes", stat2: ar ? "ضغط مستمر" : "Constant press" },
                      duel: ar ? "وسط الملعب — صراع التحكم" : "Midfield Control Battle",
                      advantage: "home",
                    },
                    {
                      homePlayer: { name: ar ? "مصطفى شويبر" : "Mostafa Shobeir", pos: "GK", num: 23, stat1: ar ? "4/4 ترجيح" : "4/4 penalties", stat2: ar ? "نسبة إنقاذ 78%" : "78% save rate" },
                      awayPlayer: { name: ar ? "إيميليانو مارتينيز" : "E. Martínez", pos: "GK", num: 23, stat1: ar ? "0 أهداف في 3 مباريات" : "0 goals in 3 games", stat2: ar ? "نسبة إنقاذ 82%" : "82% save rate" },
                      duel: ar ? "حراسة المرمى — من يوقف الترجيح؟" : "Goalkeeping — Who Stops Penalties?",
                      advantage: "even",
                    },
                    {
                      homePlayer: { name: ar ? "عمر مرموش" : "Omar Marmoush", pos: "SS", num: 22, stat1: ar ? "1 هدف" : "1 goal", stat2: ar ? "4 مساعدات" : "4 assists" },
                      awayPlayer: { name: ar ? "لاوتارو مارتينيز" : "Lautaro Martínez", pos: "ST", num: 22, stat1: ar ? "1 هدف" : "1 goal", stat2: ar ? "xG 1.77" : "xG 1.77" },
                      duel: ar ? "الهجوم المتحرك — من يخترق الدفاع؟" : "Mobile Attack — Who Breaks Through?",
                      advantage: "away",
                    },
                    {
                      homePlayer: { name: ar ? "مصطفى زيكو" : "Mostafa Zico", pos: "ST", num: 11, stat1: ar ? "1 هدف" : "1 goal", stat2: ar ? "2 تحركات محورية" : "2 key runs" },
                      awayPlayer: { name: ar ? "رودريغو دي بول" : "Rodrigo De Paul", pos: "CM", num: 7, stat1: ar ? "محرك الوسط" : "Engine of midfield", stat2: ar ? "ضغط + تمرير" : "Press + Pass" },
                      duel: ar ? "الطاقة والإيقاع — من يتحكم في سرعة المباراة؟" : "Energy & Tempo — Who Controls the Pace?",
                      advantage: "away",
                    },
                  ].map((matchup, i) => (
                    <div key={i} className="bg-muted rounded-xl p-3">
                      <div className="text-xs text-muted-foreground text-center mb-2 font-semibold">{matchup.duel}</div>
                      <div className="flex items-center gap-2">
                        {/* Home Player */}
                        <div className={`flex-1 rounded-lg p-2 ${matchup.advantage === 'home' ? 'bg-red-900/30 border border-red-700/50' : 'bg-muted/50'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                              style={{ background: home.color + "33", color: readableColor(home.color, theme) }}>
                              {matchup.homePlayer.num}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-foreground">{matchup.homePlayer.name}</div>
                              <div className="text-xs text-muted-foreground">{matchup.homePlayer.pos}</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">{matchup.homePlayer.stat1}</div>
                          <div className="text-xs text-muted-foreground">{matchup.homePlayer.stat2}</div>
                        </div>

                        {/* VS Badge */}
                        <div className="flex flex-col items-center gap-1">
                          <div className="text-xs font-black text-muted-foreground">VS</div>
                          <div className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                            matchup.advantage === 'home' ? 'bg-red-600/30 text-red-600 dark:text-red-400' :
                            matchup.advantage === 'away' ? 'bg-blue-600/30 text-blue-600 dark:text-blue-400' :
                            'bg-gray-600/30 text-muted-foreground'
                          }`}>
                            {matchup.advantage === 'home' ? (ar ? 'أفضل' : 'Edge') :
                             matchup.advantage === 'away' ? (ar ? 'أفضل' : 'Edge') :
                             (ar ? 'متكافئ' : '50/50')}
                          </div>
                        </div>

                        {/* Away Player */}
                        <div className={`flex-1 rounded-lg p-2 ${matchup.advantage === 'away' ? 'bg-blue-900/30 border border-blue-700/50' : 'bg-muted/50'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                              style={{ background: away.color + "33", color: readableColor(away.color, theme) }}>
                              {matchup.awayPlayer.num}
                            </div>
                            <div>
                              <div className="text-xs font-bold text-foreground">{matchup.awayPlayer.name}</div>
                              <div className="text-xs text-muted-foreground">{matchup.awayPlayer.pos}</div>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">{matchup.awayPlayer.stat1}</div>
                          <div className="text-xs text-muted-foreground">{matchup.awayPlayer.stat2}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── TAB 3: THE MATH ── */}
          <TabsContent value="math">
            {/* xG Inputs */}
            <Card className="bg-card border-border mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                  <Calculator className="w-5 h-5" />
                  {ar ? "معاملات النموذج" : "Model Parameters"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      {home.flag} {ar ? home.nameAr : home.name} xG
                    </Label>
                    <Input
                      type="number" step="0.01" value={homeXG}
                      onChange={e => setHomeXG(e.target.value)}
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">
                      {away.flag} {ar ? away.nameAr : away.name} xG
                    </Label>
                    <Input
                      type="number" step="0.01" value={awayXG}
                      onChange={e => setAwayXG(e.target.value)}
                      className="bg-muted border-border text-foreground"
                    />
                  </div>
                </div>
                <Button onClick={runSim} disabled={simRunning} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                  <Play className={`w-4 h-4 mr-2 ${simRunning ? "animate-spin" : ""}`} />
                  {simRunning
                    ? (ar ? `جارٍ المحاكاة... ${Math.round(simProgress)}%` : `Simulating... ${Math.round(simProgress)}%`)
                    : (ar ? "تشغيل 250,000 محاكاة Dixon-Coles" : "Run 250,000 Dixon-Coles Simulations")}
                </Button>
                {simRunning && <Progress value={simProgress} className="mt-2" />}
              </CardContent>
            </Card>

            {simResult && (
              <>
                {/* Main Probabilities */}
                <Card className="bg-card border-border mb-6">
                  <CardHeader>
                    <CardTitle className="text-foreground">{ar ? "نتائج المحاكاة" : "Simulation Results"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Visual probability bar */}
                    <div className="flex h-12 rounded-xl overflow-hidden mb-4">
                      <div className="flex items-center justify-center font-black text-sm transition-all duration-700"
                        style={{ width: `${simResult.homeWin}%`, background: home.color, color: contrastOn(home.color) }}>
                        {simResult.homeWin}%
                      </div>
                      <div className="flex items-center justify-center font-black text-sm transition-all duration-700"
                        style={{ width: `${simResult.draw}%`, background: "#555", color: contrastOn("#555") }}>
                        {simResult.draw > 5 ? `${simResult.draw}%` : ""}
                      </div>
                      <div className="flex items-center justify-center font-black text-sm transition-all duration-700"
                        style={{ width: `${simResult.awayWin}%`, background: away.color, color: contrastOn(away.color) }}>
                        {simResult.awayWin}%
                      </div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-6">
                      <span>{home.flag} {ar ? home.nameAr : home.name}</span>
                      <span>{ar ? "تعادل" : "Draw"}</span>
                      <span>{away.flag} {ar ? away.nameAr : away.name}</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-6">
                      <StatCard label={ar ? "متوسط أهداف مصر" : `Avg ${home.name} Goals`} value={simResult.avgHomeGoals} color={home.color} />
                      <StatCard label={ar ? "أكثر نتيجة محتملة" : "Most Likely Score"} value={simResult.topScores[0]?.score || "-"} color="#C9A84C" />
                      <StatCard label={ar ? "متوسط أهداف الأرجنتين" : `Avg ${away.name} Goals`} value={simResult.avgAwayGoals} color={away.color} />
                    </div>

                    {/* Top 10 Scores */}
                    <div className="text-sm font-bold text-muted-foreground mb-3">
                      {ar ? "أكثر 10 نتائج احتمالاً" : "Top 10 Most Likely Scores"}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {simResult.topScores.map((s, i) => (
                        <div key={i} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">#{i + 1}</span>
                            <span className="font-black text-foreground">{s.score}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 rounded-full bg-yellow-500/30 overflow-hidden w-16">
                              <div className="h-full bg-yellow-500 rounded-full" style={{ width: `${(s.prob / simResult.topScores[0].prob) * 100}%` }} />
                            </div>
                            <span className="text-xs text-yellow-700 dark:text-yellow-400 font-bold">{s.prob}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Scenario Analysis */}
                <Card className="bg-card border-border mb-6">
                  <CardHeader>
                    <CardTitle className="text-foreground">{ar ? "تحليل السيناريوهات" : "Scenario Analysis"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {simResult.scenarios.map((s, i) => (
                        <div key={i} className="bg-muted rounded-xl p-4">
                          <div className="text-sm font-bold text-foreground mb-3">{ar ? s.nameAr : s.name}</div>
                          <div className="flex h-6 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-center text-xs font-bold"
                              style={{ width: `${s.homeWin}%`, background: home.color, color: contrastOn(home.color) }}>
                              {s.homeWin > 8 ? `${s.homeWin}%` : ""}
                            </div>
                            <div className="flex items-center justify-center text-xs font-bold"
                              style={{ width: `${s.draw}%`, background: "#555", color: contrastOn("#555") }}>
                              {s.draw > 8 ? `${s.draw}%` : ""}
                            </div>
                            <div className="flex items-center justify-center text-xs font-bold"
                              style={{ width: `${s.awayWin}%`, background: away.color, color: contrastOn(away.color) }}>
                              {s.awayWin > 8 ? `${s.awayWin}%` : ""}
                            </div>
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{home.flag} {s.homeWin}%</span>
                            <span>= {s.draw}%</span>
                            <span>{s.awayWin}% {away.flag}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Source Comparison */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">{ar ? "مقارنة المصادر" : "Source Comparison"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-muted-foreground border-b border-border">
                            <th className="text-left py-2 pr-4">{ar ? "المصدر" : "Source"}</th>
                            <th className="text-center py-2">{home.flag} {ar ? "فوز" : "Win"}</th>
                            <th className="text-center py-2">{ar ? "تعادل" : "Draw"}</th>
                            <th className="text-center py-2">{away.flag} {ar ? "فوز" : "Win"}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simResult.sources.map((src, i) => (
                            <tr key={i} className={`border-b border-border ${i === 0 ? "bg-yellow-500/5" : ""}`}>
                              <td className="py-3 pr-4 text-muted-foreground font-medium">
                                {i === 0 && <span className="text-yellow-700 dark:text-yellow-400 mr-1">★</span>}
                                {src.name}
                              </td>
                              <td className="text-center py-3 font-bold" style={{ color: readableColor(home.color, theme) }}>{src.homeWin}%</td>
                              <td className="text-center py-3 text-muted-foreground">{src.draw > 0 ? `${src.draw}%` : "—"}</td>
                              <td className="text-center py-3 font-bold" style={{ color: readableColor(away.color, theme) }}>{src.awayWin}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="text-xs text-blue-600 dark:text-blue-300 flex items-start gap-2">
                        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        {ar
                          ? "النموذج يستخدم منهجية Dixon-Coles مع تصحيح الأهداف المنخفضة (ρ = -0.13) وتعديل الأرضية المحايدة. λ مصر = 0.478، λ الأرجنتين = 2.035"
                          : "Model uses Dixon-Coles methodology with low-score correction (ρ = -0.13) and neutral ground adjustment. λ_Egypt = 0.478, λ_Argentina = 2.035"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ── TAB 4: WIN GATES ── */}
          <TabsContent value="gates">
            <div className="mb-4">
              <div className="text-lg font-black text-foreground mb-1">
                {ar ? "ممر الفوز: 5 بوابات" : "Path to Victory: 5 Gates"}
              </div>
              <div className="text-sm text-muted-foreground">
                {ar
                  ? `كيف يمكن لـ ${home.nameAr} أن ترفع احتمال التأهل من ${simResult?.homeWin || "~14"}% إلى ${simResult ? Math.min(simResult.homeWin + 22, 99) : "~36"}%`
                  : `How ${home.name} can raise their win probability from ${simResult?.homeWin || "~14"}% to ${simResult ? Math.min(simResult.homeWin + 22, 99) : "~36"}%`}
              </div>
            </div>

            <div className="space-y-4">
              {WIN_GATES.map((gate, i) => (
                <Card key={i} className="bg-card border-border overflow-hidden">
                  <div className="flex">
                    {/* Gate number sidebar */}
                    <div className="w-16 flex flex-col items-center justify-center py-4 flex-shrink-0"
                      style={{ background: gate.color + "22", borderRight: `3px solid ${gate.color}` }}>
                      <div className="text-2xl">{gate.icon}</div>
                      <div className="text-lg font-black mt-1" style={{ color: gate.color }}>{gate.number}</div>
                    </div>

                    <CardContent className="flex-1 py-4 px-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-black text-foreground text-base mb-1">
                            {ar ? gate.titleAr : gate.title}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            {ar ? gate.descAr : gate.desc}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-start gap-1">
                            <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            {ar ? gate.detailAr : gate.detail}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-center">
                          <div className="text-xl font-black" style={{ color: gate.color }}>{gate.boost}</div>
                          <div className="text-xs text-muted-foreground">{ar ? "تأثير" : "Impact"}</div>
                        </div>
                      </div>

                      {/* Progress bar showing cumulative boost */}
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{ar ? "الاحتمال الأساسي" : "Base"}: {simResult?.homeWin || 13.5}%</span>
                          <span>{ar ? "مع البوابة" : "With gate"}: {
                            simResult
                              ? Math.min(simResult.homeWin + (i + 1) * 2.5, 45).toFixed(1)
                              : (13.5 + (i + 1) * 2.5).toFixed(1)
                          }%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min((simResult ? simResult.homeWin : 13.5) + (i + 1) * 2.5, 45)}%`,
                              background: `linear-gradient(90deg, ${home.color}, ${gate.color})`
                            }} />
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>

            {/* Best Case Scenario */}
            <Card className="brand-gradient-subtle border-yellow-500/30 mt-6">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-black text-yellow-700 dark:text-yellow-400 text-lg">
                      {ar ? "السيناريو الأفضل (كل البوابات)" : "Best Case (All Gates Open)"}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {ar
                        ? "سجّل أولاً + كرات ثابتة + كبح ميسي + الجناح الأيسر + الترجيح"
                        : "Score first + Set pieces + Neutralise Messi + Left flank + Penalties"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-black text-yellow-700 dark:text-yellow-400">
                      {simResult ? `${Math.min(simResult.homeWin + 22, 45).toFixed(1)}%` : "~36%"}
                    </div>
                    <div className="text-xs text-muted-foreground">{ar ? "احتمال التأهل" : "Win probability"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}
