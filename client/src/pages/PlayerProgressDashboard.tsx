import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import {
  ArrowLeft, Brain, Dumbbell, Heart, Activity, TrendingUp, TrendingDown,
  Minus, Star, AlertTriangle, CheckCircle, RefreshCw, Play, Search,
  BarChart3, Target, Zap, Award, ChevronRight, HelpCircle, Calendar,
  ArrowUpRight, ArrowDownRight, Minus as MinusIcon, MessageSquare
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend,
  BarChart, Bar, Cell, ReferenceLine
} from "recharts";

function HelpIcon({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help inline ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-muted border-border text-foreground">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ProgressBadge({ value, prev }: { value: number | null; prev: number | null }) {
  if (!value || !prev) return null;
  const diff = value - prev;
  if (diff > 0) return <span className="text-xs text-green-700 dark:text-green-400 flex items-center gap-0.5"><TrendingUp size={10}/> +{diff.toFixed(1)}</span>;
  if (diff < 0) return <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-0.5"><TrendingDown size={10}/> {diff.toFixed(1)}</span>;
  return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus size={10}/> 0</span>;
}

function ScoreRing({ value, max = 10, color, label }: { value: number; max?: number; color: string; label: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r={r} fill="none" stroke="#374151" strokeWidth="5" />
          <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="5"
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-foreground font-bold text-sm">{value.toFixed(0)}</span>
      </div>
      <span className="text-xs text-muted-foreground mt-1">{label}</span>
    </div>
  );
}

// Skill groups for the progression tab
const SKILL_GROUPS = [
  {
    label: "Technical Skills",
    color: "#3b82f6",
    skills: [
      { key: "ballControl", label: "Ball Control" },
      { key: "firstTouch", label: "First Touch" },
      { key: "dribbling", label: "Dribbling" },
      { key: "passing", label: "Passing" },
      { key: "shooting", label: "Shooting" },
      { key: "crossing", label: "Crossing" },
      { key: "heading", label: "Heading" },
    ]
  },
  {
    label: "Physical Skills",
    color: "#10b981",
    skills: [
      { key: "speed", label: "Speed" },
      { key: "acceleration", label: "Acceleration" },
      { key: "agility", label: "Agility" },
      { key: "stamina", label: "Stamina" },
      { key: "strength", label: "Strength" },
      { key: "jumping", label: "Jumping" },
    ]
  },
  {
    label: "Mental Skills",
    color: "#8b5cf6",
    skills: [
      { key: "positioning", label: "Positioning" },
      { key: "vision", label: "Vision" },
      { key: "composure", label: "Composure" },
      { key: "decisionMaking", label: "Decision Making" },
      { key: "workRate", label: "Work Rate" },
    ]
  },
  {
    label: "Defensive Skills",
    color: "#ef4444",
    skills: [
      { key: "marking", label: "Marking" },
      { key: "tackling", label: "Tackling" },
      { key: "interceptions", label: "Interceptions" },
    ]
  },
];

function SkillProgressBar({ label, baseline, current, color }: { label: string; baseline: number; current: number; color: string }) {
  const diff = current - baseline;
  const diffColor = diff > 0 ? "text-green-700 dark:text-green-400" : diff < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground";
  const diffIcon = diff > 0 ? <ArrowUpRight size={12} /> : diff < 0 ? <ArrowDownRight size={12} /> : <MinusIcon size={12} />;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Baseline: {baseline}</span>
          <span className="text-foreground font-bold">Now: {current}</span>
          <span className={`flex items-center gap-0.5 font-bold ${diffColor}`}>
            {diffIcon}{diff > 0 ? '+' : ''}{diff}
          </span>
        </div>
      </div>
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        {/* Baseline bar */}
        <div className="absolute h-full rounded-full opacity-30" style={{ width: `${baseline}%`, backgroundColor: color }} />
        {/* Current bar */}
        <div className="absolute h-full rounded-full" style={{ width: `${current}%`, backgroundColor: color }} />
        {/* Baseline marker */}
        <div className="absolute top-0 h-full w-0.5 bg-white/60" style={{ left: `${baseline}%` }} />
      </div>
    </div>
  );
}

export default function PlayerProgressDashboard() {
  const { id } = useParams<{ id: string }>();
  const playerId = parseInt(id || "0");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "skills" | "trends" | "radar" | "ai">("overview");

  const { data: player } = trpc.players.getById.useQuery({ id: playerId }, { enabled: !!playerId });
  const { data: weeklyProgress } = trpc.feedback.getWeeklyProgress.useQuery({ playerId, weeks: 4 }, { enabled: !!playerId });
  const { data: sessions = [] } = trpc.medical.getSessionPerformance.useQuery(
    { playerId, limit: 20 },
    { enabled: !!playerId }
  );
  const { data: skillHistory = [] } = trpc.skillScores.getHistory.useQuery(
    { playerId },
    { enabled: !!playerId }
  );
  const analyzeProgress = trpc.medical.analyzePlayerProgress.useMutation();

  const sessionList = Array.isArray(sessions) ? sessions : [];
  const skillList = Array.isArray(skillHistory) ? [...skillHistory].reverse() : [];

  // Baseline = oldest skill assessment (enrollment), current = latest
  const baselineSkills = skillList[0] || null;
  const currentSkills = skillList[skillList.length - 1] || null;

  // Build chart data from sessions (oldest first)
  const chartData = [...sessionList].reverse().map((s: any, i: number) => ({
    session: `S${i + 1}`,
    date: s.sessionDate ? new Date(s.sessionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : `S${i + 1}`,
    physical: s.physicalScore || 0,
    technical: s.technicalScore || 0,
    mental: s.mentalScore || 0,
    medical: s.medicalScore || 0,
    rpe: s.rpe || 0,
  }));

  // Skill timeline chart data (overall rating over time)
  const skillChartData = skillList.map((s: any, i: number) => ({
    date: s.assessmentDate ? new Date(s.assessmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : `A${i + 1}`,
    overall: s.overallRating || 0,
    technical: s.technicalOverall || 0,
    physical: s.physicalOverall || 0,
    mental: s.mentalOverall || 0,
    defensive: s.defensiveOverall || 0,
    label: i === 0 ? 'Enrollment' : s.notes || `Assessment ${i + 1}`,
  }));

  // Latest and previous session for comparison
  const latest = sessionList[0];
  const prev = sessionList[1];

  // Progress ratio: average improvement across last 5 vs previous 5
  const last5 = sessionList.slice(0, 5);
  const prev5 = sessionList.slice(5, 10);
  const avgScore = (arr: any[]) => arr.length === 0 ? 0 :
    arr.reduce((sum, s) => sum + ((s.physicalScore || 0) + (s.technicalScore || 0) + (s.mentalScore || 0)) / 3, 0) / arr.length;
  const last5Avg = avgScore(last5);
  const prev5Avg = avgScore(prev5);
  const progressRatio = prev5Avg > 0 ? ((last5Avg - prev5Avg) / prev5Avg) * 100 : 0;

  // Radar data from latest session
  const radarData = latest ? [
    { subject: "Physical", A: latest.physicalScore || 0, fullMark: 10 },
    { subject: "Technical", A: latest.technicalScore || 0, fullMark: 10 },
    { subject: "Mental", A: latest.mentalScore || 0, fullMark: 10 },
    { subject: "Medical", A: latest.medicalScore || 0, fullMark: 10 },
    { subject: "Speed", A: latest.speed || 0, fullMark: 10 },
    { subject: "Endurance", A: latest.endurance || 0, fullMark: 10 },
    { subject: "Passing", A: latest.passing || 0, fullMark: 10 },
    { subject: "Shooting", A: latest.shooting || 0, fullMark: 10 },
  ] : [];

  // Skill radar from skill assessments
  const skillRadarData = currentSkills ? [
    { subject: "Ball Control", A: currentSkills.ballControl || 0, B: baselineSkills?.ballControl || 0, fullMark: 100 },
    { subject: "Dribbling", A: currentSkills.dribbling || 0, B: baselineSkills?.dribbling || 0, fullMark: 100 },
    { subject: "Passing", A: currentSkills.passing || 0, B: baselineSkills?.passing || 0, fullMark: 100 },
    { subject: "Shooting", A: currentSkills.shooting || 0, B: baselineSkills?.shooting || 0, fullMark: 100 },
    { subject: "Speed", A: currentSkills.speed || 0, B: baselineSkills?.speed || 0, fullMark: 100 },
    { subject: "Stamina", A: currentSkills.stamina || 0, B: baselineSkills?.stamina || 0, fullMark: 100 },
    { subject: "Positioning", A: currentSkills.positioning || 0, B: baselineSkills?.positioning || 0, fullMark: 100 },
    { subject: "Tackling", A: currentSkills.tackling || 0, B: baselineSkills?.tackling || 0, fullMark: 100 },
  ] : [];

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeProgress.mutateAsync({ playerId });
      setAiResult(result);
      setActiveTab("ai");
      toast({ title: "AI Analysis Complete", description: "Progress report and skill recommendations ready." });
    } catch {
      toast({ title: "Analysis Failed", description: "Could not run AI analysis. Try again.", variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const playerName = player ? `${(player as any).firstName} ${(player as any).lastName}` : `Player #${playerId}`;

  // Calculate total improvement for skill summary
  const totalImprovement = (baselineSkills && currentSkills)
    ? (currentSkills.overallRating || 0) - (baselineSkills.overallRating || 0)
    : null;

  return (
    <>
    <div className="text-foreground">
      {/* Header */}
      <div className="bg-gradient-to-r from-card to-muted border-b border-border px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(`/player/${playerId}`)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <PageBreadcrumb
                items={[
                  { label: "Players", labelAr: "اللاعبين", href: "/players" },
                  { label: playerName, href: "/player/" + playerId },
                  { label: "Progress Dashboard", labelAr: "لوحة التقدم" },
                ]}
                className="mb-1 text-muted-foreground"
              />
              <h1 className="text-foreground font-bold text-lg">{playerName} — Progress Dashboard</h1>
              <p className="text-muted-foreground text-xs">
                {sessionList.length} training sessions · {skillList.length} skill assessments
                {baselineSkills && ` · Enrolled ${new Date(baselineSkills.assessmentDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing || sessionList.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-700 hover:bg-purple-600 disabled:bg-muted text-white text-sm font-semibold rounded-lg transition-all"
          >
            {analyzing ? <><RefreshCw size={14} className="animate-spin"/> Analyzing...</> : <><Brain size={14}/> AI Analysis</>}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-4">
        {/* Weekly Coach Feedback Progress */}
        {weeklyProgress && (weeklyProgress as any).weeklyScore !== null && (
          <div className="bg-card rounded-xl border border-yellow-700/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-yellow-900/40 border-2 border-yellow-600/60 flex items-center justify-center">
                  <span className="text-yellow-700 dark:text-yellow-400 font-bold text-lg">{(weeklyProgress as any).weeklyScore}</span>
                </div>
                <div>
                  <div className="text-foreground font-semibold text-sm flex items-center gap-2">
                    Weekly Coach Rating Score
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      (weeklyProgress as any).trend === 'improving' ? 'bg-green-900/40 text-green-700 dark:text-green-400 border border-green-700/40' :
                      (weeklyProgress as any).trend === 'declining' ? 'bg-red-900/40 text-red-600 dark:text-red-400 border border-red-700/40' :
                      'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {(weeklyProgress as any).trend === 'improving' ? '↑ Improving' : (weeklyProgress as any).trend === 'declining' ? '↓ Declining' : '→ Stable'}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-0.5">Based on last 4 weeks of coach feedback ratings (out of 100)</p>
                </div>
              </div>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(s => (
                  <Star key={s} size={16} className={s <= Math.round(((weeklyProgress as any).weeklyScore || 0) / 20) ? 'text-yellow-700 dark:text-yellow-400 fill-yellow-400' : 'text-gray-700'} />
                ))}
              </div>
            </div>
            {Array.isArray((weeklyProgress as any).recentFeedbacks) && (weeklyProgress as any).recentFeedbacks.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">Recent feedback:</p>
                {(weeklyProgress as any).recentFeedbacks.slice(0, 3).map((fb: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 bg-muted rounded-lg px-3 py-2">
                    <div className="flex gap-0.5 mt-0.5 flex-shrink-0">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={10} className={s <= fb.rating ? 'text-yellow-700 dark:text-yellow-400 fill-yellow-400' : 'text-gray-600'} />
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      {fb.strengths && <p className="text-xs text-green-700 dark:text-green-400 truncate">✓ {fb.strengths}</p>}
                      {fb.areasToImprove && <p className="text-xs text-orange-700 dark:text-orange-400 truncate">↑ {fb.areasToImprove}</p>}
                    </div>
                    <span className="text-xs text-gray-600 flex-shrink-0">{fb.feedbackDate ? new Date(fb.feedbackDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              Sessions <HelpIcon text="Total training sessions recorded." />
            </div>
            <div className="text-2xl font-bold text-foreground">{sessionList.length}</div>
          </div>
          <div className={`bg-card rounded-xl p-4 border ${progressRatio >= 0 ? 'border-green-700/40' : 'border-red-700/40'}`}>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              Session Trend <HelpIcon text="Compares last 5 sessions vs previous 5." />
            </div>
            <div className={`text-2xl font-bold ${progressRatio >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {progressRatio >= 0 ? '+' : ''}{progressRatio.toFixed(1)}%
            </div>
          </div>
          <div className="bg-card rounded-xl p-4 border border-blue-700/40">
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              Skill Assessments <HelpIcon text="Number of formal skill assessments since enrollment." />
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{skillList.length}</div>
          </div>
          <div className={`bg-card rounded-xl p-4 border ${totalImprovement !== null && totalImprovement >= 0 ? 'border-green-700/40' : 'border-red-700/40'}`}>
            <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
              Overall Skill Growth <HelpIcon text="Change in overall skill rating since enrollment baseline." />
            </div>
            <div className={`text-2xl font-bold ${totalImprovement !== null && totalImprovement >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {totalImprovement !== null ? `${totalImprovement >= 0 ? '+' : ''}${totalImprovement}` : '—'}
              {totalImprovement !== null && <span className="text-sm text-muted-foreground ml-1">pts</span>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto">
          {[
            { id: "overview", label: "Overview" },
            { id: "skills", label: "Skill Progression" },
            { id: "trends", label: "Trend Charts" },
            { id: "radar", label: "Radar Profile" },
            { id: "ai", label: "AI Insights" },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${activeTab === tab.id ? 'border-red-500 text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ==================== OVERVIEW TAB ==================== */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Latest Session Scores */}
            {latest && (
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-foreground font-semibold text-sm">Latest Session Scores</h2>
                  <span className="text-xs text-muted-foreground">{latest.sessionDate ? new Date(latest.sessionDate).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }) : 'Recent'}</span>
                </div>
                <div className="flex justify-around">
                  <div className="text-center">
                    <ScoreRing value={latest.physicalScore || 0} color="#3b82f6" label="Physical" />
                    <ProgressBadge value={latest.physicalScore} prev={prev?.physicalScore} />
                  </div>
                  <div className="text-center">
                    <ScoreRing value={latest.technicalScore || 0} color="#10b981" label="Technical" />
                    <ProgressBadge value={latest.technicalScore} prev={prev?.technicalScore} />
                  </div>
                  <div className="text-center">
                    <ScoreRing value={latest.mentalScore || 0} color="#8b5cf6" label="Mental" />
                    <ProgressBadge value={latest.mentalScore} prev={prev?.mentalScore} />
                  </div>
                  <div className="text-center">
                    <ScoreRing value={latest.medicalScore || 0} color="#ef4444" label="Health" />
                    <ProgressBadge value={latest.medicalScore} prev={prev?.medicalScore} />
                  </div>
                </div>
                {latest.notes && (
                  <div className="mt-3 px-3 py-2 bg-muted rounded-lg text-xs text-muted-foreground border border-border">
                    <span className="text-muted-foreground font-semibold">Coach Note: </span>{latest.notes}
                  </div>
                )}
              </div>
            )}

            {sessionList.length === 0 && (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <Activity size={48} className="text-gray-700 mx-auto mb-3" />
                <h2 className="text-foreground font-semibold text-lg mb-2">No Session Data Yet</h2>
                <p className="text-muted-foreground text-sm mb-4">Record training sessions using the Session Recorder to start tracking this player's progress.</p>
                <button onClick={() => navigate('/training-session-recorder')} className="px-6 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm font-semibold">
                  Go to Session Recorder
                </button>
              </div>
            )}

            <h2 className="text-foreground font-semibold text-sm">Session History</h2>
            <div className="space-y-2">
              {sessionList.slice(0, 10).map((s: any, i: number) => {
                const avg = (((s.physicalScore || 0) + (s.technicalScore || 0) + (s.mentalScore || 0)) / 3);
                return (
                  <div key={s.id || i} className="bg-card rounded-lg border border-border p-3 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-muted-foreground font-bold">
                      {sessionList.length - i}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-foreground font-medium">{s.sessionName || `Training Session`}</div>
                      <div className="text-xs text-muted-foreground">{s.sessionDate ? new Date(s.sessionDate).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }) : '—'}</div>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <span className="text-blue-600 dark:text-blue-400">P: {s.physicalScore || '—'}</span>
                      <span className="text-green-700 dark:text-green-400">T: {s.technicalScore || '—'}</span>
                      <span className="text-purple-600 dark:text-purple-400">M: {s.mentalScore || '—'}</span>
                      <span className="text-red-600 dark:text-red-400">H: {s.medicalScore || '—'}</span>
                    </div>
                    <div className={`text-sm font-bold ${avg >= 7 ? 'text-green-700 dark:text-green-400' : avg >= 5 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {avg.toFixed(1)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== SKILL PROGRESSION TAB ==================== */}
        {activeTab === "skills" && (
          <div className="space-y-4">
            {!baselineSkills ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <BarChart3 size={48} className="text-gray-700 mx-auto mb-3" />
                <h2 className="text-foreground font-semibold text-lg mb-2">No Skill Assessment Data</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  Complete a skill assessment for this player to start tracking their skill progression.
                  The first assessment becomes the enrollment baseline.
                </p>
                <button onClick={() => navigate('/skill-assessment')} className="px-6 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold">
                  Go to Skill Assessment
                </button>
              </div>
            ) : (
              <>
                {/* Assessment Timeline Summary */}
                <div className="bg-card rounded-xl border border-border p-4">
                  <h2 className="text-foreground font-semibold text-sm mb-3 flex items-center gap-2">
                    <Calendar size={14} className="text-blue-600 dark:text-blue-400" /> Assessment Timeline
                    <HelpIcon text="Each point represents a formal skill assessment. The first (leftmost) is the enrollment baseline." />
                  </h2>
                  <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    {skillList.map((s: any, i: number) => (
                      <div key={s.id || i} className="flex flex-col items-center gap-1 min-w-[80px]">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${i === 0 ? 'bg-yellow-600/20 border-yellow-500 text-yellow-700 dark:text-yellow-400' : i === skillList.length - 1 ? 'bg-green-600/20 border-green-500 text-green-700 dark:text-green-400' : 'bg-muted border-border text-muted-foreground'}`}>
                          {s.overallRating || 0}
                        </div>
                        <span className="text-xs text-muted-foreground text-center">
                          {i === 0 ? 'Baseline' : i === skillList.length - 1 ? 'Current' : `Q${i}`}
                        </span>
                        <span className="text-xs text-gray-600">
                          {s.assessmentDate ? new Date(s.assessmentDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Overall Rating Chart */}
                {skillList.length > 1 && (
                  <div className="bg-card rounded-xl border border-border p-4">
                    <h2 className="text-foreground font-semibold text-sm mb-4 flex items-center gap-2">
                      <TrendingUp size={14} className="text-green-700 dark:text-green-400" /> Overall Rating Progression
                    </h2>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={skillChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                        <RechartsTooltip
                          contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                          formatter={(value: any, name: string) => [value, name]}
                        />
                        <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
                        <Line type="monotone" dataKey="overall" stroke="#f59e0b" strokeWidth={3} dot={{ r: 5, fill: '#f59e0b' }} name="Overall" />
                        <Line type="monotone" dataKey="technical" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Technical" />
                        <Line type="monotone" dataKey="physical" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Physical" />
                        <Line type="monotone" dataKey="mental" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Mental" />
                        <Line type="monotone" dataKey="defensive" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Defensive" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Skill Radar: Baseline vs Current */}
                {skillList.length >= 2 && (
                  <div className="bg-card rounded-xl border border-border p-4">
                    <h2 className="text-foreground font-semibold text-sm mb-4 flex items-center gap-2">
                      <Target size={14} className="text-teal-700 dark:text-teal-400" /> Skill Radar: Baseline vs Current
                    </h2>
                    <div className="flex items-center gap-4 mb-3 text-xs">
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/> Current</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block opacity-50"/> Enrollment Baseline</span>
                    </div>
                    <ResponsiveContainer width="100%" height={320}>
                      <RadarChart data={skillRadarData}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 9 }} />
                        <Radar name="Baseline" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeDasharray="5 5" />
                        <Radar name="Current" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
                        <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Individual Skill Bars by Group */}
                {SKILL_GROUPS.map(group => (
                  <div key={group.label} className="bg-card rounded-xl border border-border p-4">
                    <h2 className="text-foreground font-semibold text-sm mb-4 flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: group.color }} />
                      {group.label}
                      <HelpIcon text={`White bar = current value. Faded bar = enrollment baseline. White line = baseline marker.`} />
                    </h2>
                    <div className="space-y-3">
                      {group.skills.map(skill => {
                        const baseline = (baselineSkills as any)?.[skill.key] ?? 50;
                        const current = (currentSkills as any)?.[skill.key] ?? 50;
                        return (
                          <SkillProgressBar
                            key={skill.key}
                            label={skill.label}
                            baseline={baseline}
                            current={current}
                            color={group.color}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Assessment Notes */}
                <div className="bg-card rounded-xl border border-border p-4">
                  <h2 className="text-foreground font-semibold text-sm mb-3">Assessment Notes</h2>
                  <div className="space-y-2">
                    {skillList.map((s: any, i: number) => (
                      <div key={s.id || i} className="flex items-start gap-3 text-sm">
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${i === 0 ? 'bg-yellow-700/30 text-yellow-700 dark:text-yellow-400' : i === skillList.length - 1 ? 'bg-green-700/30 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>
                          {i === 0 ? 'Baseline' : i === skillList.length - 1 ? 'Latest' : `Q${i}`}
                        </span>
                        <span className="text-muted-foreground shrink-0">
                          {s.assessmentDate ? new Date(s.assessmentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                        </span>
                        <span className="text-muted-foreground">{s.notes || 'No notes'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== TRENDS TAB ==================== */}
        {activeTab === "trends" && (
          <div className="space-y-4">
            {chartData.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-12 text-center">
                <BarChart3 size={48} className="text-gray-700 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No session data to display trends.</p>
              </div>
            ) : (
              <>
                <div className="bg-card rounded-xl border border-border p-4">
                  <h2 className="text-foreground font-semibold text-sm mb-4 flex items-center gap-2">
                    <BarChart3 size={14} className="text-blue-600 dark:text-blue-400" /> Performance Trends Over Sessions
                    <HelpIcon text="Shows how each performance domain has changed across all recorded sessions." />
                  </h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis domain={[0, 10]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <RechartsTooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                      <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 11 }} />
                      <Line type="monotone" dataKey="physical" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Physical" />
                      <Line type="monotone" dataKey="technical" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Technical" />
                      <Line type="monotone" dataKey="mental" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} name="Mental" />
                      <Line type="monotone" dataKey="medical" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} name="Medical" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                  <h2 className="text-foreground font-semibold text-sm mb-4 flex items-center gap-2">
                    <Zap size={14} className="text-yellow-700 dark:text-yellow-400" /> RPE (Perceived Effort) Trend
                    <HelpIcon text="Rate of Perceived Exertion (1-10). Consistently high RPE with low scores may indicate overtraining." />
                  </h2>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <YAxis domain={[0, 10]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <RechartsTooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                      <Line type="monotone" dataKey="rpe" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="RPE" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==================== RADAR TAB ==================== */}
        {activeTab === "radar" && (
          <div className="bg-card rounded-xl border border-border p-4">
            <h2 className="text-foreground font-semibold text-sm mb-4 flex items-center gap-2">
              <Target size={14} className="text-teal-700 dark:text-teal-400" /> Player Performance Radar (Latest Session)
              <HelpIcon text="Shows the player's performance profile across all dimensions in their most recent session." />
            </h2>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#374151" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 9 }} />
                  <Radar name="Player" dataKey="A" stroke="#ef4444" fill="#ef4444" fillOpacity={0.25} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-8">No session data to display radar</div>
            )}
          </div>
        )}

        {/* ==================== AI INSIGHTS TAB ==================== */}
        {activeTab === "ai" && (
          <div className="space-y-4">
            {!aiResult ? (
              <div className="bg-card rounded-xl border border-border p-10 text-center">
                <Brain size={48} className="text-gray-700 mx-auto mb-3" />
                <h2 className="text-foreground font-semibold mb-2">AI Analysis Not Run Yet</h2>
                <p className="text-muted-foreground text-sm mb-4">Click the "AI Analysis" button above to generate a personalized progress report and skill video recommendations.</p>
                <button onClick={handleAnalyze} disabled={analyzing}
                  className="px-6 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold flex items-center gap-2 mx-auto">
                  {analyzing ? <><RefreshCw size={14} className="animate-spin"/> Analyzing...</> : <><Brain size={14}/> Run AI Analysis</>}
                </button>
              </div>
            ) : (
              <>
                <div className="bg-card rounded-xl border border-purple-700/40 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain size={16} className="text-purple-600 dark:text-purple-400" />
                    <h2 className="text-foreground font-semibold text-sm">AI Progress Analysis</h2>
                    <span className="text-xs bg-purple-900/40 text-purple-600 dark:text-purple-400 border border-purple-700/40 px-2 py-0.5 rounded-full ml-auto">AI Generated</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{aiResult.analysis}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {aiResult.strengths?.length > 0 && (
                    <div className="bg-card rounded-xl border border-green-700/40 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle size={14} className="text-green-700 dark:text-green-400" />
                        <h3 className="text-foreground font-semibold text-sm">{t("player.strengths")}</h3>
                      </div>
                      <ul className="space-y-2">
                        {aiResult.strengths.map((s: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Star size={12} className="text-green-700 dark:text-green-400 mt-0.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiResult.keyDevelopmentAreas?.length > 0 && (
                    <div className="bg-card rounded-xl border border-orange-700/40 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={14} className="text-orange-700 dark:text-orange-400" />
                        <h3 className="text-foreground font-semibold text-sm">Key Areas to Develop</h3>
                      </div>
                      <ul className="space-y-2">
                        {aiResult.keyDevelopmentAreas.map((a: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <Target size={12} className="text-orange-700 dark:text-orange-400 mt-0.5 shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {aiResult.recommendations?.length > 0 && (
                  <div className="bg-card rounded-xl border border-blue-700/40 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Award size={14} className="text-blue-600 dark:text-blue-400" />
                      <h3 className="text-foreground font-semibold text-sm">Coach Recommendations</h3>
                    </div>
                    <div className="space-y-2">
                      {aiResult.recommendations.map((r: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2 bg-muted rounded-lg border border-border">
                          <ChevronRight size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                          <span className="text-sm text-muted-foreground">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
