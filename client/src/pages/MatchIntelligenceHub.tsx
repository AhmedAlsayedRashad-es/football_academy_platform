import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Brain, Target, TrendingUp, Users, Shield, Zap, BarChart3, FileText,
  Plus, Trash2, Save, RefreshCw, ChevronRight, AlertTriangle, CheckCircle,
  Star, Activity, Crosshair, Flag, Clock, Trophy, User, BookOpen, Loader2,
  Download, Eye, Edit, ArrowLeft, Calculator, Dices, Swords, GitCompare,
  Video, Link2, Sparkles, ChevronDown, ChevronUp, Info, X
} from "lucide-react";
import { Bar, Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";
import { ComparePanel } from "@/components/ComparePanel";
import { MatchInfographic, type InfographicData } from "@/components/MatchInfographic";

// ── MatchInfographicTab helper ────────────────────────────────────────────────
function MatchInfographicTab({
  simResult, ourTeam, oppTeam, ourFormation, oppFormation,
  competition, matchDate, setPieceBonus, aiReport
}: {
  simResult: any; ourTeam: string; oppTeam: string;
  ourFormation: string; oppFormation: string;
  competition: string; matchDate: string;
  setPieceBonus: number; aiReport: string | null;
}) {
  // Parse AI report for narrative sections if available
  const data: InfographicData = {
    ourTeam, oppTeam, competition, matchDate,
    ourFormation, oppFormation,
    ourLambda: simResult.ourLambda,
    oppLambda: simResult.oppLambda,
    winPct: simResult.winPct,
    drawPct: simResult.drawPct,
    lossPct: simResult.lossPct,
    winPctSP: simResult.winPctWithSetPieces,
    drawPctSP: simResult.drawPctWithSetPieces,
    lossPctSP: simResult.lossPctWithSetPieces,
    setPieceImpact: setPieceBonus,
    simCount: simResult.scenarios || 100000,
    summary: aiReport ? aiReport.split('\n').find(l => l.includes('خلاصة') || l.includes('ملخص') || l.length > 80) || undefined : undefined,
  };
  return <MatchInfographic data={data} />;
}
ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const FORMATIONS = ["4-3-3","4-4-2","4-2-3-1","3-5-2","3-4-3","5-3-2","5-4-1","4-1-4-1","4-3-2-1","4-5-1","3-6-1","4-4-1-1"];
const PRESSING = ["Very High","High","Medium","Low","None"];
const DEF_LINE = ["Very High","High","Medium","Low","Very Low"];
const BUILDUP = ["Short Passing","Long Ball","Mixed","Counter-Attack","Possession"];

// ── Probability Ring ──────────────────────────────────────────────────────────
function ProbRing({ value, label, color }: { value: number; label: string; color: string }) {
  const r = 36, circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="88" height="88" viewBox="0 0 88 88">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 44 44)" />
        <text x="44" y="48" textAnchor="middle" fontSize="14" fontWeight="700" fill={color}>{value}%</text>
      </svg>
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

// ── Score Matrix ──────────────────────────────────────────────────────────────
function ScoreMatrix({ scores }: { scores: { ourGoals: number; oppGoals: number; probability: number }[] }) {
  if (!scores.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Top Score Probabilities</p>
      <div className="grid grid-cols-2 gap-1.5">
        {scores.slice(0, 8).map((s, i) => (
          <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${i === 0 ? 'bg-green-100 dark:bg-green-900/30 font-bold' : 'bg-muted/50'}`}>
            <span>{s.ourGoals} – {s.oppGoals}</span>
            <span className="text-xs text-muted-foreground">{s.probability}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Markdown Renderer (simple) ────────────────────────────────────────────────
function MarkdownReport({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (line.startsWith('## ')) return <h3 key={i} className="text-base font-bold mt-4 mb-1 text-primary">{line.replace('## ', '')}</h3>;
        if (line.startsWith('### ')) return <h4 key={i} className="text-sm font-semibold mt-3 mb-1">{line.replace('### ', '')}</h4>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold">{line.replace(/\*\*/g, '')}</p>;
        if (line.startsWith('- ') || line.startsWith('• ')) return <li key={i} className="ml-4 list-disc">{line.replace(/^[-•] /, '')}</li>;
        if (line.trim() === '') return <div key={i} className="h-1" />;
        // inline bold
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((p, j) => p.startsWith('**') ? <strong key={j}>{p.replace(/\*\*/g, '')}</strong> : p)}
          </p>
        );
      })}
    </div>
  );
}

// ── Dot Matrix Visualization ──────────────────────────────────────────────────
function DotMatrix({ winPct, drawPct, lossPct }: { winPct: number; drawPct: number; lossPct: number }) {
  const total = 100;
  const wins = Math.round(winPct);
  const draws = Math.round(drawPct);
  const dots = Array.from({ length: total }, (_, i) => {
    if (i < wins) return 'win';
    if (i < wins + draws) return 'draw';
    return 'loss';
  });
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dot Matrix — 100 Scenarios</p>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(10, 1fr)' }}>
        {dots.map((type, i) => (
          <div key={i} className={`w-full aspect-square rounded-sm ${
            type === 'win' ? 'bg-green-500' : type === 'draw' ? 'bg-yellow-400' : 'bg-red-500'
          }`} />
        ))}
      </div>
      <div className="flex gap-3 text-xs">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />Win {wins}%</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-yellow-400 inline-block" />Draw {draws}%</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />Loss {100 - wins - draws}%</span>
      </div>
    </div>
  );
}

// ── Tornado Chart (Sensitivity) ───────────────────────────────────────────────
function TornadoChart({ factors, baseWin }: { factors: any[]; baseWin: number }) {
  if (!factors?.length) return null;
  const maxImpact = Math.max(...factors.map(f => f.impact), 1);
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Sensitivity Analysis — Win% Impact</p>
      <div className="space-y-2">
        {factors.map((f: any) => {
          const lowDelta = f.lowWin - baseWin;
          const highDelta = f.highWin - baseWin;
          return (
            <div key={f.name} className="space-y-0.5">
              <div className="flex justify-between text-xs">
                <span className="font-medium truncate max-w-[140px]">{f.name}</span>
                <span className="text-muted-foreground font-mono">±{f.impact.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1 h-5">
                <div className="flex-1 flex justify-end">
                  <div className={`h-4 rounded-l ${lowDelta < 0 ? 'bg-red-400' : 'bg-green-400'}`}
                    style={{ width: `${Math.abs(lowDelta) / maxImpact * 50}%` }} />
                </div>
                <div className="w-px h-5 bg-border" />
                <div className="flex-1">
                  <div className={`h-4 rounded-r ${highDelta > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.abs(highDelta) / maxImpact * 50}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>← Pessimistic</span>
        <span className="font-mono font-bold text-primary">Base {baseWin}%</span>
        <span>Optimistic →</span>
      </div>
    </div>
  );
}

// ── Scenario Tree ─────────────────────────────────────────────────────────────
function ScenarioTree({ scenarios }: { scenarios: any[] }) {
  if (!scenarios?.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Scenario Analysis</p>
      <div className="space-y-1.5">
        {scenarios.map((s: any) => (
          <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors">
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.win > 50 ? '#22c55e' : s.win > 35 ? '#eab308' : '#ef4444' }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold truncate">{s.label}</span>
                <div className="flex gap-2 text-xs ml-2 flex-shrink-0">
                  <span className="text-green-600 font-mono">{s.win}%</span>
                  <span className="text-yellow-600 font-mono">{s.draw}%</span>
                  <span className="text-red-600 font-mono">{s.loss}%</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground truncate">{s.description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-3 text-xs text-muted-foreground">
        <span className="text-green-600">■ Win</span>
        <span className="text-yellow-600">■ Draw</span>
        <span className="text-red-600">■ Loss</span>
      </div>
    </div>
  );
}

// ── Tactical Extraction Card ──────────────────────────────────────────────────
function TacticalCard({ data, role }: { data: any; role: 'our' | 'opponent' }) {
  const [expanded, setExpanded] = useState(false);
  const isOur = role === 'our';
  return (
    <div className={`rounded-xl border-2 p-4 space-y-3 ${isOur ? 'border-blue-200 bg-blue-50/50 dark:bg-blue-900/10' : 'border-red-200 bg-red-50/50 dark:bg-red-900/10'}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase tracking-wide ${isOur ? 'text-blue-600' : 'text-red-600'}`}>{isOur ? 'Our Team' : 'Opponent'}</span>
            <Badge variant="outline" className="text-xs">{data.formation}</Badge>
            <Badge variant={data.confidence === 'high' ? 'default' : data.confidence === 'medium' ? 'secondary' : 'destructive'} className="text-xs">{data.confidence} confidence</Badge>
          </div>
          <h3 className="font-bold text-base mt-0.5">{data.teamName}</h3>
          <p className="text-xs text-muted-foreground">{data.playingStyle}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Avg Goals</p>
          <p className="font-mono font-bold">{data.avgGoalsScored} / {data.avgGoalsConceded}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-background/60 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Pressing</p>
          <p className="text-xs font-semibold">{data.pressingIntensity}</p>
        </div>
        <div className="bg-background/60 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Def Line</p>
          <p className="text-xs font-semibold">{data.defensiveLine}</p>
        </div>
        <div className="bg-background/60 rounded-lg p-2">
          <p className="text-xs text-muted-foreground">Build-up</p>
          <p className="text-xs font-semibold truncate">{data.buildupStyle}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div>
          <p className="text-xs font-semibold text-green-700 mb-0.5">Strengths</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{data.strengths}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-red-700 mb-0.5">Weaknesses</p>
          <p className="text-xs text-muted-foreground line-clamp-2">{data.weaknesses}</p>
        </div>
      </div>
      {data.scoringPatterns?.length > 0 && (
        <div>
          <p className="text-xs font-semibold mb-1">Scoring Patterns</p>
          <div className="flex flex-wrap gap-1">
            {data.scoringPatterns.slice(0, 3).map((p: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
            ))}
          </div>
        </div>
      )}
      <button className="text-xs text-primary flex items-center gap-1" onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Show less' : 'Full analysis'}
      </button>
      {expanded && (
        <div className="space-y-2 border-t pt-2">
          <div>
            <p className="text-xs font-semibold mb-0.5">Set Pieces</p>
            <p className="text-xs text-muted-foreground">{data.setPieceStrengths}</p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-0.5">Key Players</p>
            <p className="text-xs text-muted-foreground">{data.keyPlayers}</p>
          </div>
          <div>
            <p className="text-xs font-semibold mb-0.5">Full Analysis</p>
            <p className="text-xs text-muted-foreground">{data.rawAnalysis}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs bg-muted/30 rounded-lg p-2">
            <div><span className="text-muted-foreground">Strength Factor: </span><strong>{data.opponentStrengthFactor}</strong></div>
            <div><span className="text-muted-foreground">Def Factor: </span><strong>{data.defensiveFactor}</strong></div>
            <div><span className="text-muted-foreground">Set Piece Bonus: </span><strong>+{data.setPieceBonus}</strong></div>
            <div><span className="text-muted-foreground">Key Player: </span><strong>{data.keyPlayerImpact}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MatchIntelligenceHub() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("analyses");

  // ── Analyses list ──────────────────────────────────────────────────────────
  const { data: analyses = [], refetch: refetchAnalyses } = trpc.matchIntelligence.listAnalyses.useQuery();
  const { data: opponents = [], refetch: refetchOpponents } = trpc.matchIntelligence.listOpponents.useQuery();
  const { data: coaches = [], refetch: refetchCoaches } = trpc.matchIntelligence.listCoaches.useQuery();

  // ── New Analysis state ─────────────────────────────────────────────────────
  const [analysisTitle, setAnalysisTitle] = useState("");
  const [ourTeam, setOurTeam] = useState("");
  const [oppTeam, setOppTeam] = useState("");
  const [ourFormation, setOurFormation] = useState("4-3-3");
  const [oppFormation, setOppFormation] = useState("4-4-2");
  const [competition, setCompetition] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>("none");
  const [selectedCoachId, setSelectedCoachId] = useState<string>("none");
  const [language, setLanguage] = useState<"ar" | "en">("ar");

  // ── Simulation params ──────────────────────────────────────────────────────
  const [ourRawAvg, setOurRawAvg] = useState(1.5);
  const [oppRawAvg, setOppRawAvg] = useState(1.2);
  const [ourStrengthFactor, setOurStrengthFactor] = useState(1.0);
  const [ourDefFactor, setOurDefFactor] = useState(1.0);
  const [oppStrengthFactor, setOppStrengthFactor] = useState(1.0);
  const [oppDefFactor, setOppDefFactor] = useState(1.0);
  const [setPieceBonus, setSetPieceBonus] = useState(0.15);

  // ── Simulation results ─────────────────────────────────────────────────────
  const [simResult, setSimResult] = useState<any>(null);
  const [aiReport, setAiReport] = useState("");
  const [currentAnalysisId, setCurrentAnalysisId] = useState<number | null>(null);
  const [viewingAnalysis, setViewingAnalysis] = useState<any>(null);

  // ── Opponent form ──────────────────────────────────────────────────────────
  const [oppForm, setOppForm] = useState({
    id: undefined as number | undefined,
    teamName: "", country: "", league: "", typicalFormation: "4-4-2",
    playingStyle: "", strengths: "", weaknesses: "",
    setPieceStrengths: "", setPieceWeaknesses: "", keyPlayers: "",
    avgGoalsScored: 1.2, avgGoalsConceded: 1.1,
    matchesPlayed: 0, wins: 0, draws: 0, losses: 0,
    pressingIntensity: "Medium", defensiveLine: "Medium", buildupStyle: "Mixed", notes: ""
  });
  const [showOppForm, setShowOppForm] = useState(false);

  // ── Coach form ─────────────────────────────────────────────────────────────
  const [coachForm, setCoachForm] = useState({
    id: undefined as number | undefined,
    name: "", nationality: "", age: undefined as number | undefined,
    teamName: "", yearsExperience: undefined as number | undefined,
    preferredFormation: "4-4-2", tacticalPhilosophy: "",
    pressingStyle: "", defensiveApproach: "", attackingApproach: "",
    substitutionPatterns: "", bigMatchRecord: "", setPieceApproach: "",
    knownWeaknesses: "", careerHighlights: "", winRate: undefined as number | undefined, notes: ""
  });
  const [showCoachForm, setShowCoachForm] = useState(false);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const runSimMutation = trpc.matchIntelligence.runSimulation.useMutation();
  const genAIMutation = trpc.matchIntelligence.generateAIAnalysis.useMutation();
  const saveAnalysisMutation = trpc.matchIntelligence.saveAnalysis.useMutation();
  const deleteAnalysisMutation = trpc.matchIntelligence.deleteAnalysis.useMutation();
  const saveOppMutation = trpc.matchIntelligence.saveOpponent.useMutation();
  const deleteOppMutation = trpc.matchIntelligence.deleteOpponent.useMutation();
  const saveCoachMutation = trpc.matchIntelligence.saveCoach.useMutation();
  const deleteCoachMutation = trpc.matchIntelligence.deleteCoach.useMutation();

  const selectedOpponent = selectedOpponentId !== "none" ? opponents.find(o => String(o.id) === selectedOpponentId) : undefined;
  const selectedCoach = selectedCoachId !== "none" ? coaches.find(c => String(c.id) === selectedCoachId) : undefined;

  // ── Video Intelligence state ───────────────────────────────────────────────
  const [videoUrls, setVideoUrls] = useState<string[]>(['']);
  const [videoContexts, setVideoContexts] = useState<string[]>(['']);
  const [videoRole, setVideoRole] = useState<'our' | 'opponent'>('opponent');
  const [videoTeamName, setVideoTeamName] = useState('');
  const [videoAdditionalContext, setVideoAdditionalContext] = useState('');
  const [videoAnalysisResult, setVideoAnalysisResult] = useState<any>(null);
  const [videoAnalysisLoading, setVideoAnalysisLoading] = useState(false);
  const [videoLoadingStep, setVideoLoadingStep] = useState(0);
  const [videoLoadingStepText, setVideoLoadingStepText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [sensitivityResult, setSensitivityResult] = useState<any>(null);
  const [scenarioResult, setScenarioResult] = useState<any>(null);
  const [dcResult, setDcResult] = useState<any>(null);
  const [showAdvancedViz, setShowAdvancedViz] = useState(false);

  // ── Data source tracking ──────────────────────────────────────────────────────
  // 'default' = never touched, 'manual' = user adjusted sliders, 'video' = from video analysis, 'profile' = from opponent DB
  const [ourDataSource, setOurDataSource] = useState<'default' | 'manual' | 'video' | 'profile'>('default');
  const [oppDataSource, setOppDataSource] = useState<'default' | 'manual' | 'video' | 'profile'>('default');

  // Validation: require at least one video analysis to have been completed
  const videoAnalyzed = ourDataSource === 'video' || oppDataSource === 'video';
  const canRunSim = ourTeam.trim() !== '' && oppTeam.trim() !== '' && videoAnalyzed;

  const analyzeYTMutation = trpc.videoIntelligence.analyzeYouTubeUrl.useMutation();
  const analyzeMultiMutation = trpc.videoIntelligence.analyzeMultipleVideos.useMutation();
  const runDCMutation = trpc.videoIntelligence.runDixonColesSimulation.useMutation();
  const runSensitivityMutation = trpc.videoIntelligence.runSensitivityAnalysis.useMutation();
  const runScenarioMutation = trpc.videoIntelligence.runScenarioTree.useMutation();

  const VIDEO_LOADING_STEPS = [
    { step: 1, text: 'جاري تحميل الفيديو وتحليل الإطارات...' },
    { step: 2, text: 'الذكاء الاصطناعي يرصد التشكيل والمواضع...' },
    { step: 3, text: 'استخراج أنماط الهجوم والضغط...' },
    { step: 4, text: 'تحليل الكرات الثابتة ونقاط الضعف...' },
    { step: 5, text: 'حساب معاملات λ وبناء النموذج الإحصائي...' },
    { step: 6, text: 'اكتمل التحليل — جاري تحويل البيانات للـ Simulator...' },
  ];

  async function handleVideoAnalysis() {
    const validUrls = videoUrls.filter(u => u.trim());
    const hasFiles = uploadedFiles.length > 0;
    if (!validUrls.length && !hasFiles) {
      toast({ title: 'أضف رابط فيديو أو ارفع ملف', variant: 'destructive' });
      return;
    }
    setVideoAnalysisLoading(true);
    setVideoLoadingStep(0);
    setVideoLoadingStepText('');
    setVideoAnalysisResult(null);
    // Animate loading steps
    let stepIdx = 0;
    const stepInterval = setInterval(() => {
      if (stepIdx < VIDEO_LOADING_STEPS.length - 1) {
        stepIdx++;
        setVideoLoadingStep(VIDEO_LOADING_STEPS[stepIdx].step);
        setVideoLoadingStepText(VIDEO_LOADING_STEPS[stepIdx].text);
      }
    }, 2800);
    try {
      let result: any;
      if (validUrls.length === 1) {
        result = await analyzeYTMutation.mutateAsync({
          youtubeUrl: validUrls[0],
          teamRole: videoRole,
          matchContext: videoContexts[0] || undefined,
          additionalContext: videoAdditionalContext || undefined,
        });
      } else {
        result = await analyzeMultiMutation.mutateAsync({
          videos: validUrls.map((url, i) => ({ url, matchContext: videoContexts[i] || undefined, isYouTube: true })),
          teamRole: videoRole,
          teamName: videoTeamName || undefined,
        });
      }
      setVideoAnalysisResult(result);
      if (videoRole === 'opponent') {
        setOppRawAvg(result.avgGoalsScored || 1.2);
        setOppStrengthFactor(result.opponentStrengthFactor || 1.0);
        setOppDefFactor(result.defensiveFactor || 1.0);
        setSetPieceBonus(result.setPieceBonus || 0.15);
        if (result.teamName && result.teamName !== 'Unknown') setOppTeam(result.teamName);
        if (result.formation) setOppFormation(result.formation);
        setOppDataSource('video');
        toast({ title: 'Video analyzed!', description: 'Simulation params auto-populated. Switch to Simulator tab.' });
      } else {
        setOurRawAvg(result.avgGoalsScored || 1.5);
        setOurStrengthFactor(result.opponentStrengthFactor || 1.0);
        setOurDefFactor(result.defensiveFactor || 1.0);
        if (result.teamName && result.teamName !== 'Unknown') setOurTeam(result.teamName);
        if (result.formation) setOurFormation(result.formation);
        setOurDataSource('video');
        toast({ title: 'Video analyzed!', description: 'Our team params auto-populated.' });
      }
      clearInterval(stepInterval);
      setVideoLoadingStep(6);
      setVideoLoadingStepText(VIDEO_LOADING_STEPS[5].text);
    } catch (err: any) {
      clearInterval(stepInterval);
      toast({ title: 'فشل التحليل', description: err?.message || 'تعذّر تحليل الفيديو', variant: 'destructive' });
    } finally {
      setVideoAnalysisLoading(false);
    }
  }

  async function handleRunAdvancedSim() {
    const ourL = ourRawAvg * ourStrengthFactor * ourDefFactor;
    const oppL = oppRawAvg * oppStrengthFactor * oppDefFactor;
    setShowAdvancedViz(true);
    try {
      const [dc, sens, scen] = await Promise.all([
        runDCMutation.mutateAsync({ ourLambda: ourL, oppLambda: oppL }),
        runSensitivityMutation.mutateAsync({
          ourLambda: ourL, oppLambda: oppL,
          factors: [
            { name: 'Our Attack Rate', baseValue: ourRawAvg, lowValue: ourRawAvg * 0.7, highValue: ourRawAvg * 1.3, affectsOur: true },
            { name: 'Opp Defensive Factor', baseValue: oppDefFactor, lowValue: oppDefFactor * 0.8, highValue: oppDefFactor * 1.2, affectsOur: false },
            { name: 'Opp Attack Rate', baseValue: oppRawAvg, lowValue: oppRawAvg * 0.7, highValue: oppRawAvg * 1.3, affectsOur: false },
            { name: 'Key Player Suppression', baseValue: 1, lowValue: 0.6, highValue: 1.0, affectsOur: false },
            { name: 'Set Piece Bonus', baseValue: 1, lowValue: 0.5, highValue: 1.5, affectsOur: true },
          ],
        }),
        runScenarioMutation.mutateAsync({ ourLambda: ourL, oppLambda: oppL, setPieceBonus }),
      ]);
      setDcResult(dc);
      setSensitivityResult(sens);
      setScenarioResult(scen);
      toast({ title: 'Advanced analysis complete!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err?.message, variant: 'destructive' });
    }
  }

  // ── Run Simulation ─────────────────────────────────────────────────────────
  async function handleRunSim() {
    try {
      const result = await runSimMutation.mutateAsync({
        ourRawAvg, oppRawAvg,
        ourOpponentStrengthFactor: ourStrengthFactor, ourDefensiveFactor: ourDefFactor,
        oppOpponentStrengthFactor: oppStrengthFactor, oppDefensiveFactor: oppDefFactor,
        ourSetPieceBonus: setPieceBonus, oppSetPieceBonus: 0, simCount: 100000,
      });
      console.log('[SimResult raw]', JSON.stringify(result));
      // Safely flatten nested result — handle both nested and flat structures
      const base = (result as any).base || {};
      const withSP = (result as any).withSetPieces || {};
      const flat = {
        ourLambda: Number((result as any).ourLambda ?? 0),
        oppLambda: Number((result as any).oppLambda ?? 0),
        ourLambdaWithSP: Number((result as any).ourLambdaWithSP ?? 0),
        oppLambdaWithSP: Number((result as any).oppLambdaWithSP ?? 0),
        winPct: Number(base.winPct ?? (result as any).winPct ?? 0),
        drawPct: Number(base.drawPct ?? (result as any).drawPct ?? 0),
        lossPct: Number(base.lossPct ?? (result as any).lossPct ?? 0),
        winPctWithSetPieces: Number(withSP.winPct ?? (result as any).winPctWithSetPieces ?? 0),
        drawPctWithSetPieces: Number(withSP.drawPct ?? (result as any).drawPctWithSetPieces ?? 0),
        lossPctWithSetPieces: Number(withSP.lossPct ?? (result as any).lossPctWithSetPieces ?? 0),
        scenarios: Number(base.scenarios ?? (result as any).scenarios ?? 100000),
        scoreProbabilities: [],
      };
      console.log('[SimResult flat]', JSON.stringify(flat));
      setSimResult(flat);
      toast({ title: "Simulation complete", description: `${flat.scenarios.toLocaleString()} scenarios run` });
    } catch (err: any) {
      console.error('[SimError]', err);
      toast({ title: "Error", description: err?.message || "Simulation failed", variant: "destructive" });
    }
  }

  // ── Generate AI Report ─────────────────────────────────────────────────────
  async function handleGenerateAI() {
    if (!simResult) {
      toast({ title: "Run simulation first", description: "Please run the Monte Carlo simulation before generating AI analysis", variant: "destructive" });
      return;
    }
    if (!ourTeam || !oppTeam) {
      toast({ title: "Missing info", description: "Please enter both team names", variant: "destructive" });
      return;
    }
    try {
      const result = await genAIMutation.mutateAsync({
        ourTeam, opponentTeam: oppTeam,
        ourFormation, opponentFormation: oppFormation,
        ourLambda: simResult.ourLambda,
        oppLambda: simResult.oppLambda,
        winPct: simResult.winPct,
        drawPct: simResult.drawPct,
        lossPct: simResult.lossPct,
        opponentProfile: selectedOpponent ? JSON.stringify({
          playingStyle: selectedOpponent.playing_style,
          strengths: selectedOpponent.strengths,
          weaknesses: selectedOpponent.weaknesses,
          setPieceStrengths: selectedOpponent.set_piece_strengths,
          setPieceWeaknesses: selectedOpponent.set_piece_weaknesses,
          keyPlayers: selectedOpponent.key_players,
          pressingIntensity: selectedOpponent.pressing_intensity,
          defensiveLine: selectedOpponent.defensive_line,
          buildupStyle: selectedOpponent.buildup_style,
        }) : undefined,
        coachProfile: selectedCoach ? JSON.stringify({
          name: selectedCoach.name,
          tacticalPhilosophy: selectedCoach.tactical_philosophy,
          preferredFormation: selectedCoach.preferred_formation,
          pressingStyle: selectedCoach.pressing_style,
          substitutionPatterns: selectedCoach.substitution_patterns,
          bigMatchRecord: selectedCoach.big_match_record,
          setPieceApproach: selectedCoach.set_piece_approach,
          knownWeaknesses: selectedCoach.known_weaknesses,
        }) : undefined,
      });
      setAiReport((result as any).report || String(result));
      toast({ title: "AI Analysis ready!" });
    } catch {
      toast({ title: "Error", description: "AI analysis failed", variant: "destructive" });
    }
  }

  // ── Save Analysis ──────────────────────────────────────────────────────────
  async function handleSaveAnalysis() {
    if (!ourTeam || !oppTeam) {
      toast({ title: "Missing info", description: "Enter team names first", variant: "destructive" });
      return;
    }
    try {
      const result = await saveAnalysisMutation.mutateAsync({
        id: currentAnalysisId || undefined,
        title: analysisTitle || `${ourTeam} vs ${oppTeam}`,
        ourTeam, opponentTeam: oppTeam,
        opponentProfileId: selectedOpponentId && selectedOpponentId !== "none" ? Number(selectedOpponentId) : undefined,
        coachProfileId: selectedCoachId && selectedCoachId !== "none" ? Number(selectedCoachId) : undefined,
        matchDate: matchDate || undefined,
        competition: competition || undefined,
        ourFormation, opponentFormation: oppFormation,
        ourLambda: simResult?.ourLambda,
        oppLambda: simResult?.oppLambda,
        ourRawAvg, oppRawAvg,
        winProbability: simResult?.winPct,
        drawProbability: simResult?.drawPct,
        lossProbability: simResult?.lossPct,
        winProbabilityWithSetPieces: simResult?.winPctWithSetPieces,
        simulationResults: simResult ? JSON.stringify(simResult) : undefined,
        aiFullReport: aiReport || undefined,
        status: 'completed',
      });
      setCurrentAnalysisId(result.id);
      refetchAnalyses();
      toast({ title: "Analysis saved!" });
    } catch {
      toast({ title: "Error", description: "Save failed", variant: "destructive" });
    }
  }

  // ── Save Opponent ──────────────────────────────────────────────────────────
  async function handleSaveOpponent() {
    try {
      await saveOppMutation.mutateAsync(oppForm);
      refetchOpponents();
      setShowOppForm(false);
      setOppForm({ id: undefined, teamName: "", country: "", league: "", typicalFormation: "4-4-2", playingStyle: "", strengths: "", weaknesses: "", setPieceStrengths: "", setPieceWeaknesses: "", keyPlayers: "", avgGoalsScored: 1.2, avgGoalsConceded: 1.1, matchesPlayed: 0, wins: 0, draws: 0, losses: 0, pressingIntensity: "Medium", defensiveLine: "Medium", buildupStyle: "Mixed", notes: "" });
      toast({ title: "Opponent profile saved!" });
    } catch {
      toast({ title: "Error", description: "Save failed", variant: "destructive" });
    }
  }

  // ── Save Coach ─────────────────────────────────────────────────────────────
  async function handleSaveCoach() {
    try {
      await saveCoachMutation.mutateAsync(coachForm);
      refetchCoaches();
      setShowCoachForm(false);
      setCoachForm({ id: undefined, name: "", nationality: "", age: undefined, teamName: "", yearsExperience: undefined, preferredFormation: "4-4-2", tacticalPhilosophy: "", pressingStyle: "", defensiveApproach: "", attackingApproach: "", substitutionPatterns: "", bigMatchRecord: "", setPieceApproach: "", knownWeaknesses: "", careerHighlights: "", winRate: undefined, notes: "" });
      toast({ title: "Coach profile saved!" });
    } catch {
      toast({ title: "Error", description: "Save failed", variant: "destructive" });
    }
  }

  function loadAnalysis(a: any) {
    setOurTeam(a.our_team || "");
    setOppTeam(a.opponent_team || "");
    setAnalysisTitle(a.title || "");
    setOurFormation(a.our_formation || "4-3-3");
    setOppFormation(a.opponent_formation || "4-4-2");
    setCompetition(a.competition || "");
    setMatchDate(a.match_date ? a.match_date.split('T')[0] : "");
    setSelectedOpponentId(a.opponent_profile_id ? String(a.opponent_profile_id) : "none");
    setSelectedCoachId(a.coach_profile_id ? String(a.coach_profile_id) : "none");
    setOurRawAvg(a.our_raw_avg || 1.5);
    setOppRawAvg(a.opponent_raw_avg || 1.2);
    setCurrentAnalysisId(a.id);
    if (a.simulation_results) {
      try { setSimResult(JSON.parse(a.simulation_results)); } catch {}
    }
    setAiReport(a.ai_full_report || "");
    setActiveTab("simulator");
    toast({ title: "Analysis loaded" });
  }

  // ── Export report as text ──────────────────────────────────────────────────
  function exportReport() {
    const content = `MATCH INTELLIGENCE REPORT\n${'='.repeat(50)}\n${analysisTitle || `${ourTeam} vs ${oppTeam}`}\n\nSIMULATION RESULTS\n${'-'.repeat(30)}\nOur λ: ${simResult?.ourLambda} | Opp λ: ${simResult?.oppLambda}\nWin: ${simResult?.winPct}% | Draw: ${simResult?.drawPct}% | Loss: ${simResult?.lossPct}%\nWith Set Pieces: ${simResult?.winPctWithSetPieces}%\n\nAI ANALYSIS\n${'-'.repeat(30)}\n${aiReport}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `match-intelligence-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-7 w-7 text-primary" />
            Match Intelligence Hub
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            AI-powered opponent analysis · Poisson modeling · Monte Carlo simulation · Tactical recommendations
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select value={language} onValueChange={(v) => setLanguage(v as "ar" | "en")}>
            <SelectTrigger className="w-28 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ar">🇪🇬 عربي</SelectItem>
              <SelectItem value="en">🇬🇧 English</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" onClick={handleSaveAnalysis} disabled={saveAnalysisMutation.isPending}>
            <Save className="h-4 w-4 mr-1" /> Save
          </Button>
          {aiReport && (
            <Button size="sm" variant="outline" onClick={exportReport}>
              <Download className="h-4 w-4 mr-1" /> Export
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/50 p-1">
          <TabsTrigger value="analyses" className="text-xs"><FileText className="h-3.5 w-3.5 mr-1" />Saved Analyses</TabsTrigger>
          <TabsTrigger value="simulator" className="text-xs"><Dices className="h-3.5 w-3.5 mr-1" />Simulator</TabsTrigger>
          <TabsTrigger value="video-intel" className="text-xs bg-blue-50 dark:bg-blue-950/30 data-[state=active]:bg-blue-600 data-[state=active]:text-white"><Video className="h-3.5 w-3.5 mr-1" />Video Intel</TabsTrigger>
          <TabsTrigger value="infographic" className="text-xs bg-purple-50 dark:bg-purple-950/30 data-[state=active]:bg-purple-600 data-[state=active]:text-white"><Sparkles className="h-3.5 w-3.5 mr-1" />Infographic</TabsTrigger>
          <TabsTrigger value="ai-report" className="text-xs"><Brain className="h-3.5 w-3.5 mr-1" />AI Report</TabsTrigger>
          <TabsTrigger value="opponents" className="text-xs"><Shield className="h-3.5 w-3.5 mr-1" />Opponents</TabsTrigger>
          <TabsTrigger value="coaches" className="text-xs"><User className="h-3.5 w-3.5 mr-1" />Coaches</TabsTrigger>
          <TabsTrigger value="compare" className="text-xs"><GitCompare className="h-3.5 w-3.5 mr-1" />Compare</TabsTrigger>
        </TabsList>

        {/* ── SAVED ANALYSES ─────────────────────────────────────────────── */}
        <TabsContent value="analyses" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Saved Match Analyses ({analyses.length})</h2>
            <Button size="sm" onClick={() => { setCurrentAnalysisId(null); setSimResult(null); setAiReport(""); setOurTeam(""); setOppTeam(""); setAnalysisTitle(""); setActiveTab("simulator"); }}>
              <Plus className="h-4 w-4 mr-1" /> New Analysis
            </Button>
          </div>
          {analyses.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No analyses yet. Create your first match analysis.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {analyses.map((a: any) => (
                <Card key={a.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => loadAnalysis(a)}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-sm font-semibold line-clamp-2">{a.title}</CardTitle>
                      <Badge variant={a.status === 'completed' ? 'default' : 'secondary'} className="text-xs ml-2 shrink-0">
                        {a.status}
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">{a.competition} · {a.match_date ? new Date(a.match_date).toLocaleDateString() : 'No date'}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-blue-600">{a.our_team}</span>
                      <span className="text-muted-foreground text-xs">vs</span>
                      <span className="font-medium text-red-600">{a.opponent_team}</span>
                    </div>
                    {a.win_probability && (
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-600 font-medium">W {a.win_probability}%</span>
                        <span className="text-yellow-600 font-medium">D {a.draw_probability}%</span>
                        <span className="text-red-600 font-medium">L {a.loss_probability}%</span>
                      </div>
                    )}
                    <div className="flex gap-1 pt-1" onClick={e => e.stopPropagation()}>
                      <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => loadAnalysis(a)}>
                        <Edit className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => {
                        deleteAnalysisMutation.mutate({ id: a.id }, { onSuccess: () => refetchAnalyses() });
                      }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── SIMULATOR ──────────────────────────────────────────────────── */}
        <TabsContent value="simulator" className="space-y-5 mt-4">
          <div className="grid gap-5 lg:grid-cols-2">
            {/* Match Setup */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Swords className="h-4 w-4" /> Match Setup</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Analysis Title</Label>
                  <Input value={analysisTitle} onChange={e => setAnalysisTitle(e.target.value)} placeholder="e.g. Semi-Final vs Al Ahly" className="h-8 text-sm mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Our Team</Label>
                    <Input value={ourTeam} onChange={e => setOurTeam(e.target.value)} placeholder="Team name" className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Opponent</Label>
                    <Input value={oppTeam} onChange={e => setOppTeam(e.target.value)} placeholder="Opponent name" className="h-8 text-sm mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Our Formation</Label>
                    <Select value={ourFormation} onValueChange={setOurFormation}>
                      <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{FORMATIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Opponent Formation</Label>
                    <Select value={oppFormation} onValueChange={setOppFormation}>
                      <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{FORMATIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Competition</Label>
                    <Input value={competition} onChange={e => setCompetition(e.target.value)} placeholder="League / Cup" className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Match Date</Label>
                    <Input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="h-8 text-sm mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Opponent Profile</Label>
                    <Select value={selectedOpponentId} onValueChange={setSelectedOpponentId}>
                      <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {opponents.map((o: any) => <SelectItem key={o.id} value={String(o.id)}>{o.team_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Coach Profile</Label>
                    <Select value={selectedCoachId} onValueChange={setSelectedCoachId}>
                      <SelectTrigger className="h-8 text-sm mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">— None —</SelectItem>
                        {coaches.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Poisson Parameters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4" /> Poisson + Monte Carlo Parameters</CardTitle>
                <CardDescription className="text-xs">Adjust λ factors to model match context accurately</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-blue-600">Our Team</Label>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span>Raw Avg Goals/90</span><span className="font-mono font-bold">{ourRawAvg.toFixed(2)}</span></div>
                        <Slider min={0.1} max={4} step={0.05} value={[ourRawAvg]} onValueChange={([v]) => { setOurRawAvg(v); setOurDataSource(s => s === 'default' ? 'manual' : s); }} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span>Opponent Strength ×</span><span className="font-mono font-bold">{ourStrengthFactor.toFixed(2)}</span></div>
                        <Slider min={0.3} max={1.5} step={0.05} value={[ourStrengthFactor]} onValueChange={([v]) => { setOurStrengthFactor(v); setOurDataSource(s => s === 'default' ? 'manual' : s); }} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span>Defensive Density ×</span><span className="font-mono font-bold">{ourDefFactor.toFixed(2)}</span></div>
                        <Slider min={0.3} max={1.5} step={0.05} value={[ourDefFactor]} onValueChange={([v]) => { setOurDefFactor(v); setOurDataSource(s => s === 'default' ? 'manual' : s); }} className="h-1.5" />
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1 text-xs text-center">
                        λ = <strong>{(ourRawAvg * ourStrengthFactor * ourDefFactor).toFixed(3)}</strong>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-red-600">Opponent</Label>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span>Raw Avg Goals/90</span><span className="font-mono font-bold">{oppRawAvg.toFixed(2)}</span></div>
                        <Slider min={0.1} max={4} step={0.05} value={[oppRawAvg]} onValueChange={([v]) => { setOppRawAvg(v); setOppDataSource(s => s === 'default' ? 'manual' : s); }} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span>Our Strength ×</span><span className="font-mono font-bold">{oppStrengthFactor.toFixed(2)}</span></div>
                        <Slider min={0.3} max={1.5} step={0.05} value={[oppStrengthFactor]} onValueChange={([v]) => { setOppStrengthFactor(v); setOppDataSource(s => s === 'default' ? 'manual' : s); }} className="h-1.5" />
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1"><span>Defensive Density ×</span><span className="font-mono font-bold">{oppDefFactor.toFixed(2)}</span></div>
                        <Slider min={0.3} max={1.5} step={0.05} value={[oppDefFactor]} onValueChange={([v]) => { setOppDefFactor(v); setOppDataSource(s => s === 'default' ? 'manual' : s); }} className="h-1.5" />
                      </div>
                      <div className="bg-red-50 dark:bg-red-900/20 rounded px-2 py-1 text-xs text-center">
                        λ = <strong>{(oppRawAvg * oppStrengthFactor * oppDefFactor).toFixed(3)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>Set Piece Bonus (our attack) ×</span><span className="font-mono font-bold">+{(setPieceBonus * 100).toFixed(0)}%</span></div>
                  <Slider min={0} max={0.5} step={0.01} value={[setPieceBonus]} onValueChange={([v]) => setSetPieceBonus(v)} className="h-1.5" />
                </div>
                {/* Data source badges */}
                <div className="flex flex-wrap gap-1.5">
                  <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                    ourDataSource === 'video' ? 'bg-blue-100 border-blue-300 text-blue-700' :
                    ourDataSource === 'manual' ? 'bg-green-100 border-green-300 text-green-700' :
                    ourDataSource === 'profile' ? 'bg-purple-100 border-purple-300 text-purple-700' :
                    'bg-muted border-border text-muted-foreground'
                  }`}>
                    <span>Our Team:</span>
                    <strong>{ourDataSource === 'video' ? '📹 Video' : ourDataSource === 'manual' ? '✏️ Manual' : ourDataSource === 'profile' ? '📋 Profile' : '⚠️ Default'}</strong>
                  </div>
                  <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${
                    oppDataSource === 'video' ? 'bg-blue-100 border-blue-300 text-blue-700' :
                    oppDataSource === 'manual' ? 'bg-green-100 border-green-300 text-green-700' :
                    selectedOpponentId !== 'none' ? 'bg-purple-100 border-purple-300 text-purple-700' :
                    'bg-muted border-border text-muted-foreground'
                  }`}>
                    <span>Opponent:</span>
                    <strong>{oppDataSource === 'video' ? '📹 Video' : oppDataSource === 'manual' ? '✏️ Manual' : selectedOpponentId !== 'none' ? '📋 Profile' : '⚠️ Default'}</strong>
                  </div>
                </div>

                {!canRunSim && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 rounded-lg p-4 text-sm space-y-3">
                    <p className="font-bold text-amber-800 text-base">المحاكاة موقفة حتى تحليل فيديو</p>
                    <ul className="text-amber-700 space-y-1 list-disc ml-4 text-xs">
                      {!ourTeam.trim() && <li>أدخل <strong>اسم فريقنا</strong> في حقل Our Team</li>}
                      {!oppTeam.trim() && <li>أدخل <strong>اسم المنافس</strong> في حقل Opponent</li>}
                      {ourTeam.trim() && oppTeam.trim() && !videoAnalyzed && (
                        <li>الذكاء الاصطناعي يحتاج أن <strong>يشاهد فيديو المباراة</strong> أولاً ليستخرج البيانات</li>
                      )}
                    </ul>
                    {ourTeam.trim() && oppTeam.trim() && !videoAnalyzed && (
                      <button
                        className="w-full mt-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"
                        onClick={() => setActiveTab('video-intel')}
                      >
                        اذهب إلى Video Intel وارفع فيديو المباراة
                      </button>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={handleRunSim} disabled={runSimMutation.isPending || !canRunSim}>
                    {runSimMutation.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running...</> : <><Dices className="h-4 w-4 mr-2" />Dixon-Coles + Poisson</>}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleRunAdvancedSim} disabled={runDCMutation.isPending || runSensitivityMutation.isPending || !canRunSim}>
                    {(runDCMutation.isPending || runSensitivityMutation.isPending) ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running...</> : <><BarChart3 className="h-4 w-4 mr-2" />Advanced Analysis</>}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Simulation Results */}
          {simResult && (
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Simulation Results — 100,000 Scenarios
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Distribution Charts — Grouped Bar + Doughnut */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Base vs Set Piece Boost</p>
                    <div style={{height: '200px'}}>
                      <Bar
                        data={{
                          labels: ['Win', 'Draw', 'Loss'],
                          datasets: [
                            {
                              label: 'Base',
                              data: [simResult.winPct, simResult.drawPct, simResult.lossPct],
                              backgroundColor: ['rgba(34,197,94,0.55)', 'rgba(234,179,8,0.55)', 'rgba(239,68,68,0.55)'],
                              borderColor: ['#16a34a','#ca8a04','#dc2626'],
                              borderWidth: 2,
                              borderRadius: 4,
                            },
                            {
                              label: '+ Set Pieces',
                              data: [simResult.winPctWithSetPieces, simResult.drawPctWithSetPieces, simResult.lossPctWithSetPieces],
                              backgroundColor: ['rgba(34,197,94,0.9)', 'rgba(234,179,8,0.9)', 'rgba(239,68,68,0.9)'],
                              borderColor: ['#16a34a','#ca8a04','#dc2626'],
                              borderWidth: 2,
                              borderRadius: 4,
                            }
                          ]
                        }}
                        options={{
                          responsive: true, maintainAspectRatio: false,
                          plugins: {
                            legend: { position: 'bottom' as const, labels: { font: { size: 11 } } },
                            tooltip: { callbacks: { label: (c: any) => ` ${c.dataset.label}: ${c.raw}%` } }
                          },
                          scales: { y: { beginAtZero: true, max: 100, ticks: { callback: (v: any) => `${v}%`, font: { size: 10 } } } }
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Outcome Distribution</p>
                    <div style={{height: '200px'}}>
                      <Doughnut
                        data={{
                          labels: [`Win ${simResult.winPct}%`, `Draw ${simResult.drawPct}%`, `Loss ${simResult.lossPct}%`],
                          datasets: [{
                            data: [simResult.winPct, simResult.drawPct, simResult.lossPct],
                            backgroundColor: ['rgba(34,197,94,0.85)', 'rgba(234,179,8,0.85)', 'rgba(239,68,68,0.85)'],
                            borderColor: ['#16a34a','#ca8a04','#dc2626'],
                            borderWidth: 2,
                            hoverOffset: 8,
                          }]
                        }}
                        options={{
                          responsive: true, maintainAspectRatio: false,
                          cutout: '62%',
                          plugins: {
                            legend: { position: 'bottom' as const, labels: { font: { size: 11 }, padding: 8 } },
                            tooltip: { callbacks: { label: (c: any) => ` ${c.label}` } }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
                {/* λ comparison bars */}
                <div className="mb-5 bg-muted/30 rounded-xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Expected Goals (λ) Comparison</p>
                  <div className="space-y-3">
                    {[
                      { label: `Our Team (Base)`, val: simResult.ourLambda, color: 'bg-blue-500', textColor: 'text-blue-600' },
                      { label: `Our Team (+ Set Pieces)`, val: simResult.ourLambdaWithSP, color: 'bg-green-500', textColor: 'text-green-600' },
                      { label: `Opponent (Base)`, val: simResult.oppLambda, color: 'bg-red-500', textColor: 'text-red-600' },
                    ].map(({ label, val, color, textColor }) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className={`font-medium ${textColor}`}>{label}</span>
                          <span className={`font-mono font-bold ${textColor}`}>{val}</span>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full`} style={{width: `${Math.min((val / 4) * 100, 100)}%`}} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div className="flex justify-around">
                      <ProbRing value={simResult.winPct} label="Win" color="#22c55e" />
                      <ProbRing value={simResult.drawPct} label="Draw" color="#eab308" />
                      <ProbRing value={simResult.lossPct} label="Loss" color="#ef4444" />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Our λ</p>
                        <p className="text-xl font-bold text-blue-600">{simResult.ourLambda}</p>
                        <p className="text-xs text-muted-foreground">goals/90 expected</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center">
                        <p className="text-xs text-muted-foreground">Opp λ</p>
                        <p className="text-xl font-bold text-red-600">{simResult.oppLambda}</p>
                        <p className="text-xs text-muted-foreground">goals/90 expected</p>
                      </div>
                    </div>
                    {simResult.winPctWithSetPieces > simResult.winPct && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 flex items-center gap-2">
                        <Flag className="h-4 w-4 text-green-600 shrink-0" />
                        <div className="text-sm">
                          <span className="font-semibold text-green-700">With Set Pieces: {simResult.winPctWithSetPieces}%</span>
                          <span className="text-green-600 text-xs ml-1">(+{(simResult.winPctWithSetPieces - simResult.winPct).toFixed(1)}%)</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <ScoreMatrix scores={simResult.scoreProbabilities || []} />
                </div>

                {/* Dot Matrix */}
                <div className="mt-4">
                  <DotMatrix winPct={simResult.winPct} drawPct={simResult.drawPct} lossPct={simResult.lossPct} />
                </div>

                <Separator className="my-4" />
                <Button className="w-full" onClick={handleGenerateAI} disabled={genAIMutation.isPending}>
                  {genAIMutation.isPending
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating AI Analysis...</>
                    : <><Brain className="h-4 w-4 mr-2" />Generate Full AI Tactical Analysis</>}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Advanced Visualizations */}
          {showAdvancedViz && (dcResult || sensitivityResult || scenarioResult) && (
            <div className="space-y-4">
              <h3 className="font-bold flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Advanced Analysis Results</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {dcResult && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Dixon-Coles Model</CardTitle>
                      <CardDescription className="text-xs">Corrects for low-score bias (0-0, 1-0, 0-1)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">Win</p>
                          <p className="text-xl font-bold text-green-600">{dcResult.dixonColes.winPct}%</p>
                        </div>
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">Draw</p>
                          <p className="text-xl font-bold text-yellow-600">{dcResult.dixonColes.drawPct}%</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">Loss</p>
                          <p className="text-xl font-bold text-red-600">{dcResult.dixonColes.lossPct}%</p>
                        </div>
                      </div>
                      {dcResult.dixonColes.topScores?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Most Likely Scorelines</p>
                          <div className="grid grid-cols-2 gap-1">
                            {dcResult.dixonColes.topScores.slice(0, 6).map((s: any, i: number) => (
                              <div key={i} className={`flex justify-between text-xs px-2 py-1 rounded ${ i === 0 ? 'bg-green-100 dark:bg-green-900/30 font-bold' : 'bg-muted/50'}`}>
                                <span>{s.score}</span>
                                <span className="text-muted-foreground">{s.prob}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="bg-muted/30 rounded-lg p-2 text-xs">
                        <p className="font-semibold mb-1">Consensus (avg of both models)</p>
                        <div className="flex gap-3">
                          <span className="text-green-600">W: {dcResult.consensus.winPct}%</span>
                          <span className="text-yellow-600">D: {dcResult.consensus.drawPct}%</span>
                          <span className="text-red-600">L: {dcResult.consensus.lossPct}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {sensitivityResult && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Sensitivity Analysis</CardTitle>
                      <CardDescription className="text-xs">Which factors impact win% the most</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <TornadoChart factors={sensitivityResult.factors} baseWin={sensitivityResult.baseWin} />
                    </CardContent>
                  </Card>
                )}
              </div>
              {scenarioResult && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Scenario Analysis</CardTitle>
                    <CardDescription className="text-xs">Win probability under different match scenarios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScenarioTree scenarios={scenarioResult.scenarios} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── VIDEO INTEL ────────────────────────────────────────────────── */}
        <TabsContent value="video-intel" className="mt-4 space-y-4">
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-500" />
                Video Intelligence Engine
              </CardTitle>
              <CardDescription>الصق لينك YouTube أو فيديو مباراة — الـ AI يحلله ويستخرج البيانات التكتيكية تلقائياً</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Role selector */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={videoRole === 'opponent' ? 'default' : 'outline'}
                  onClick={() => setVideoRole('opponent')}
                  className="flex-1"
                >
                  تحليل المنافس
                </Button>
                <Button
                  size="sm"
                  variant={videoRole === 'our' ? 'default' : 'outline'}
                  onClick={() => setVideoRole('our')}
                  className="flex-1"
                >
                  تحليل فريقنا
                </Button>
              </div>

              {/* Team name hint */}
              <div>
                <Label className="text-xs">اسم الفريق (اختياري — للمساعدة في التعرف)</Label>
                <Input
                  value={videoTeamName}
                  onChange={e => setVideoTeamName(e.target.value)}
                  placeholder={videoRole === 'opponent' ? oppTeam || 'اسم المنافس' : ourTeam || 'اسم فريقنا'}
                  className="h-8 text-sm mt-1"
                />
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">رفع ملف فيديو من جهازك</Label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-blue-300 dark:border-blue-700 rounded-lg cursor-pointer hover:border-blue-500 transition-colors bg-blue-50/30 dark:bg-blue-900/10">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                      {uploadedFiles.length > 0 ? `✅ ${uploadedFiles.length} ملف محدد` : 'اضغط لاختيار ملف فيديو'}
                    </p>
                    <p className="text-xs text-muted-foreground">MP4, AVI, MOV, MKV (حتى 500MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    multiple
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files || []);
                      setUploadedFiles(files);
                    }}
                  />
                </label>
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1">
                        <span className="text-xs truncate flex-1">{f.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                        <Button size="sm" variant="ghost" className="h-5 w-5 p-0 ml-1" onClick={() => setUploadedFiles(uploadedFiles.filter((_, j) => j !== i))}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="flex-1 border-t" />
                <span>أو</span>
                <div className="flex-1 border-t" />
              </div>

              {/* Video URL inputs */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">روابط الفيديوهات (حتى 5 روابط)</Label>
                {videoUrls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="flex-1 relative">
                      <Link2 className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={url}
                        onChange={e => {
                          const next = [...videoUrls];
                          next[i] = e.target.value;
                          setVideoUrls(next);
                        }}
                        placeholder="https://youtube.com/watch?v=... أو رابط فيديو مباشر"
                        className="h-9 text-sm pl-8"
                      />
                    </div>
                    <Input
                      value={videoContexts[i] || ''}
                      onChange={e => {
                        const next = [...videoContexts];
                        next[i] = e.target.value;
                        setVideoContexts(next);
                      }}
                      placeholder="سياق (اختياري: مثلاً 'الشوط الثاني')"
                      className="h-9 text-sm w-40"
                    />
                    {videoUrls.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 w-9 p-0 text-destructive"
                        onClick={() => {
                          setVideoUrls(videoUrls.filter((_, j) => j !== i));
                          setVideoContexts(videoContexts.filter((_, j) => j !== i));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {videoUrls.length < 5 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setVideoUrls([...videoUrls, '']); setVideoContexts([...videoContexts, '']); }}
                    className="w-full h-8 text-xs border-dashed"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> أضف رابط فيديو آخر
                  </Button>
                )}
              </div>

              {/* Additional context */}
              <div>
                <Label className="text-xs">سياق إضافي (اختياري)</Label>
                <Textarea
                  value={videoAdditionalContext}
                  onChange={e => setVideoAdditionalContext(e.target.value)}
                  placeholder="مثلاً: المباراة كانت في دور الـ 16 كأس العالم، المنافس لعب بضغط عالي..."
                  rows={2}
                  className="text-sm mt-1"
                />
              </div>

              {/* Analyze button */}
              <Button
                className="w-full"
                onClick={handleVideoAnalysis}
                disabled={videoAnalysisLoading || (!videoUrls.some(u => u.trim()) && uploadedFiles.length === 0)}
                style={{ background: '#2563eb' }}
              >
                {videoAnalysisLoading
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />جاري التحليل...</>
                  : <><Video className="h-4 w-4 mr-2" />استخراج البيانات التكتيكية</>}
              </Button>

              {/* Animated loading steps */}
              {videoAnalysisLoading && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-3">الذكاء الاصطناعي يعمل...</p>
                  {VIDEO_LOADING_STEPS.map((s) => (
                    <div key={s.step} className={`flex items-center gap-2 text-xs transition-all duration-500 ${
                      videoLoadingStep >= s.step
                        ? 'text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-muted-foreground opacity-40'
                    }`}>
                      {videoLoadingStep > s.step ? (
                        <span className="text-green-700 dark:text-green-500 text-sm">✓</span>
                      ) : videoLoadingStep === s.step ? (
                        <Loader2 className="h-3 w-3 animate-spin text-blue-500 flex-shrink-0" />
                      ) : (
                        <span className="h-3 w-3 rounded-full border border-muted-foreground/30 flex-shrink-0 inline-block" />
                      )}
                      <span>{s.text}</span>
                    </div>
                  ))}
                  <div className="mt-2">
                    <div className="h-1.5 bg-blue-100 dark:bg-blue-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-700"
                        style={{ width: `${(videoLoadingStep / VIDEO_LOADING_STEPS.length) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-1">{videoLoadingStepText}</p>
                  </div>
                </div>
              )}

              {/* Result */}
              {videoAnalysisResult && (
                <div className="space-y-3">
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">تم التحليل — البيانات مُحوَّلة للـ Simulator تلقائياً</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {videoAnalysisResult.formation && (
                        <div><span className="text-muted-foreground">التشكيل:</span> <strong>{videoAnalysisResult.formation}</strong></div>
                      )}
                      {videoAnalysisResult.pressingIntensity && (
                        <div><span className="text-muted-foreground">الضغط:</span> <strong>{videoAnalysisResult.pressingIntensity}</strong></div>
                      )}
                      {videoAnalysisResult.avgGoalsScored !== undefined && (
                        <div><span className="text-muted-foreground">متوسط الأهداف:</span> <strong>{videoAnalysisResult.avgGoalsScored.toFixed(2)}</strong></div>
                      )}
                      {videoAnalysisResult.defensiveLine && (
                        <div><span className="text-muted-foreground">الخط الدفاعي:</span> <strong>{videoAnalysisResult.defensiveLine}</strong></div>
                      )}
                    </div>
                    {videoAnalysisResult.keyPlayers?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">اللاعبون المؤثرون:</p>
                        <div className="flex flex-wrap gap-1">
                          {videoAnalysisResult.keyPlayers.slice(0, 5).map((p: string, i: number) => (
                            <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {videoAnalysisResult.setPieceStrengths?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">الكرات الثابتة:</p>
                        <div className="flex flex-wrap gap-1">
                          {videoAnalysisResult.setPieceStrengths.slice(0, 3).map((s: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {videoAnalysisResult.weaknesses?.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">نقاط الضعف:</p>
                        {videoAnalysisResult.weaknesses.slice(0, 3).map((w: string, i: number) => (
                          <p key={i} className="text-xs text-red-600">• {w}</p>
                        ))}
                      </div>
                    )}
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => setActiveTab('simulator')}
                    >
                      <Dices className="h-4 w-4 mr-2" /> اذهب للـ Simulator وشغّل التحليل
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── INFOGRAPHIC ────────────────────────────────────────────────── */}
        <TabsContent value="infographic" className="mt-4">
          {!simResult ? (
            <Card className="text-center py-16">
              <CardContent>
                <Sparkles className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">لا توجد نتائج بعد</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  شغّل الـ Simulation أولاً، ثم ارجع هنا لتوليد الإنفوجرافيك
                </p>
                <Button onClick={() => setActiveTab('simulator')}>
                  <Dices className="h-4 w-4 mr-2" /> اذهب للـ Simulator
                </Button>
              </CardContent>
            </Card>
          ) : (
            <MatchInfographicTab
              simResult={simResult}
              ourTeam={ourTeam}
              oppTeam={oppTeam}
              ourFormation={ourFormation}
              oppFormation={oppFormation}
              competition={competition}
              matchDate={matchDate}
              setPieceBonus={setPieceBonus}
              aiReport={aiReport}
            />
          )}
        </TabsContent>

        {/* ── AI REPORT ──────────────────────────────────────────────────── */}
        <TabsContent value="ai-report" className="mt-4">
          {!aiReport ? (
            <Card className="text-center py-16">
              <CardContent>
                <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No AI Report Yet</h3>
                <p className="text-muted-foreground text-sm mb-4">Run the simulation first, then click "Generate Full AI Tactical Analysis"</p>
                <Button onClick={() => setActiveTab("simulator")}>
                  <Dices className="h-4 w-4 mr-2" /> Go to Simulator
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Tactical Analysis Report
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={handleGenerateAI} disabled={genAIMutation.isPending}>
                      <RefreshCw className={`h-3.5 w-3.5 mr-1 ${genAIMutation.isPending ? 'animate-spin' : ''}`} /> Regenerate
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportReport}>
                      <Download className="h-3.5 w-3.5 mr-1" /> Export
                    </Button>
                  </div>
                </div>
                {simResult && (
                  <div className="flex gap-3 text-xs mt-2 flex-wrap">
                    <Badge variant="outline" className="text-green-600">Win {simResult.winPct}%</Badge>
                    <Badge variant="outline" className="text-yellow-600">Draw {simResult.drawPct}%</Badge>
                    <Badge variant="outline" className="text-red-600">Loss {simResult.lossPct}%</Badge>
                    <Badge variant="outline">λ Our: {simResult.ourLambda}</Badge>
                    <Badge variant="outline">λ Opp: {simResult.oppLambda}</Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  <MarkdownReport content={aiReport} />
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── OPPONENTS ──────────────────────────────────────────────────── */}
        <TabsContent value="opponents" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Opponent Profiles ({opponents.length})</h2>
            <Button size="sm" onClick={() => { setOppForm({ id: undefined, teamName: "", country: "", league: "", typicalFormation: "4-4-2", playingStyle: "", strengths: "", weaknesses: "", setPieceStrengths: "", setPieceWeaknesses: "", keyPlayers: "", avgGoalsScored: 1.2, avgGoalsConceded: 1.1, matchesPlayed: 0, wins: 0, draws: 0, losses: 0, pressingIntensity: "Medium", defensiveLine: "Medium", buildupStyle: "Mixed", notes: "" }); setShowOppForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Opponent
            </Button>
          </div>

          {showOppForm && (
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{oppForm.id ? 'Edit' : 'New'} Opponent Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="col-span-2 md:col-span-1">
                    <Label className="text-xs">Team Name *</Label>
                    <Input value={oppForm.teamName} onChange={e => setOppForm(f => ({...f, teamName: e.target.value}))} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Country</Label>
                    <Input value={oppForm.country} onChange={e => setOppForm(f => ({...f, country: e.target.value}))} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">League</Label>
                    <Input value={oppForm.league} onChange={e => setOppForm(f => ({...f, league: e.target.value}))} className="h-8 text-sm mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <Label className="text-xs">Formation</Label>
                    <Select value={oppForm.typicalFormation} onValueChange={v => setOppForm(f => ({...f, typicalFormation: v}))}>
                      <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{FORMATIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Pressing</Label>
                    <Select value={oppForm.pressingIntensity} onValueChange={v => setOppForm(f => ({...f, pressingIntensity: v}))}>
                      <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{PRESSING.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Def. Line</Label>
                    <Select value={oppForm.defensiveLine} onValueChange={v => setOppForm(f => ({...f, defensiveLine: v}))}>
                      <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{DEF_LINE.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Buildup</Label>
                    <Select value={oppForm.buildupStyle} onValueChange={v => setOppForm(f => ({...f, buildupStyle: v}))}>
                      <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{BUILDUP.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Avg Goals Scored</Label>
                    <Input type="number" step="0.1" value={oppForm.avgGoalsScored} onChange={e => setOppForm(f => ({...f, avgGoalsScored: Number(e.target.value)}))} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Avg Goals Conceded</Label>
                    <Input type="number" step="0.1" value={oppForm.avgGoalsConceded} onChange={e => setOppForm(f => ({...f, avgGoalsConceded: Number(e.target.value)}))} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Matches Played</Label>
                    <Input type="number" value={oppForm.matchesPlayed} onChange={e => setOppForm(f => ({...f, matchesPlayed: Number(e.target.value)}))} className="h-8 text-sm mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Playing Style</Label>
                  <Textarea value={oppForm.playingStyle} onChange={e => setOppForm(f => ({...f, playingStyle: e.target.value}))} rows={2} className="text-sm mt-1" placeholder="Describe their overall playing style..." />
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Strengths</Label>
                    <Textarea value={oppForm.strengths} onChange={e => setOppForm(f => ({...f, strengths: e.target.value}))} rows={2} className="text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Weaknesses</Label>
                    <Textarea value={oppForm.weaknesses} onChange={e => setOppForm(f => ({...f, weaknesses: e.target.value}))} rows={2} className="text-sm mt-1" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Set Piece Strengths</Label>
                    <Textarea value={oppForm.setPieceStrengths} onChange={e => setOppForm(f => ({...f, setPieceStrengths: e.target.value}))} rows={2} className="text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Set Piece Weaknesses</Label>
                    <Textarea value={oppForm.setPieceWeaknesses} onChange={e => setOppForm(f => ({...f, setPieceWeaknesses: e.target.value}))} rows={2} className="text-sm mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Key Players</Label>
                  <Textarea value={oppForm.keyPlayers} onChange={e => setOppForm(f => ({...f, keyPlayers: e.target.value}))} rows={2} className="text-sm mt-1" placeholder="List key players and their roles..." />
                </div>
                <div>
                  <Label className="text-xs">Notes</Label>
                  <Textarea value={oppForm.notes} onChange={e => setOppForm(f => ({...f, notes: e.target.value}))} rows={2} className="text-sm mt-1" />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowOppForm(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveOpponent} disabled={saveOppMutation.isPending}>
                    {saveOppMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {opponents.map((o: any) => (
              <Card key={o.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">{o.team_name}</CardTitle>
                      <CardDescription className="text-xs">{o.country} · {o.league}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">{o.typical_formation}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 space-y-2">
                  <div className="grid grid-cols-3 gap-1 text-xs text-center">
                    <div className="bg-muted/50 rounded p-1"><p className="font-bold text-green-600">{o.avg_goals_scored}</p><p className="text-muted-foreground">Scored</p></div>
                    <div className="bg-muted/50 rounded p-1"><p className="font-bold text-red-600">{o.avg_goals_conceded}</p><p className="text-muted-foreground">Conceded</p></div>
                    <div className="bg-muted/50 rounded p-1"><p className="font-bold">{o.matches_played}</p><p className="text-muted-foreground">Matches</p></div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => { setOppForm({ id: o.id, teamName: o.team_name, country: o.country||"", league: o.league||"", typicalFormation: o.typical_formation||"4-4-2", playingStyle: o.playing_style||"", strengths: o.strengths||"", weaknesses: o.weaknesses||"", setPieceStrengths: o.set_piece_strengths||"", setPieceWeaknesses: o.set_piece_weaknesses||"", keyPlayers: o.key_players||"", avgGoalsScored: o.avg_goals_scored||1.2, avgGoalsConceded: o.avg_goals_conceded||1.1, matchesPlayed: o.matches_played||0, wins: o.wins||0, draws: o.draws||0, losses: o.losses||0, pressingIntensity: o.pressing_intensity||"Medium", defensiveLine: o.defensive_line||"Medium", buildupStyle: o.buildup_style||"Mixed", notes: o.notes||"" }); setShowOppForm(true); }}>
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteOppMutation.mutate({ id: o.id }, { onSuccess: () => refetchOpponents() })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── COMPARE ────────────────────────────────────────────────────── */}
        <TabsContent value="compare" className="space-y-5 mt-4">
          <ComparePanel opponents={opponents} coaches={coaches} />
        </TabsContent>

        {/* ── COACHES ────────────────────────────────────────────────────── */}
        <TabsContent value="coaches" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Coach Profiles ({coaches.length})</h2>
            <Button size="sm" onClick={() => { setCoachForm({ id: undefined, name: "", nationality: "", age: undefined, teamName: "", yearsExperience: undefined, preferredFormation: "4-4-2", tacticalPhilosophy: "", pressingStyle: "", defensiveApproach: "", attackingApproach: "", substitutionPatterns: "", bigMatchRecord: "", setPieceApproach: "", knownWeaknesses: "", careerHighlights: "", winRate: undefined, notes: "" }); setShowCoachForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> Add Coach
            </Button>
          </div>

          {showCoachForm && (
            <Card className="border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">{coachForm.id ? 'Edit' : 'New'} Coach Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="col-span-2">
                    <Label className="text-xs">Coach Name *</Label>
                    <Input value={coachForm.name} onChange={e => setCoachForm(f => ({...f, name: e.target.value}))} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Nationality</Label>
                    <Input value={coachForm.nationality} onChange={e => setCoachForm(f => ({...f, nationality: e.target.value}))} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Age</Label>
                    <Input type="number" value={coachForm.age||""} onChange={e => setCoachForm(f => ({...f, age: Number(e.target.value)||undefined}))} className="h-8 text-sm mt-1" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div>
                    <Label className="text-xs">Team</Label>
                    <Input value={coachForm.teamName} onChange={e => setCoachForm(f => ({...f, teamName: e.target.value}))} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Preferred Formation</Label>
                    <Select value={coachForm.preferredFormation} onValueChange={v => setCoachForm(f => ({...f, preferredFormation: v}))}>
                      <SelectTrigger className="h-8 text-sm mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>{FORMATIONS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Win Rate (%)</Label>
                    <Input type="number" step="0.1" value={coachForm.winRate||""} onChange={e => setCoachForm(f => ({...f, winRate: Number(e.target.value)||undefined}))} className="h-8 text-sm mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Tactical Philosophy</Label>
                  <Textarea value={coachForm.tacticalPhilosophy} onChange={e => setCoachForm(f => ({...f, tacticalPhilosophy: e.target.value}))} rows={2} className="text-sm mt-1" placeholder="Describe their coaching philosophy..." />
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Pressing Style</Label>
                    <Input value={coachForm.pressingStyle} onChange={e => setCoachForm(f => ({...f, pressingStyle: e.target.value}))} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Defensive Approach</Label>
                    <Input value={coachForm.defensiveApproach} onChange={e => setCoachForm(f => ({...f, defensiveApproach: e.target.value}))} className="h-8 text-sm mt-1" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Attacking Approach</Label>
                    <Input value={coachForm.attackingApproach} onChange={e => setCoachForm(f => ({...f, attackingApproach: e.target.value}))} className="h-8 text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Substitution Patterns</Label>
                    <Input value={coachForm.substitutionPatterns} onChange={e => setCoachForm(f => ({...f, substitutionPatterns: e.target.value}))} className="h-8 text-sm mt-1" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Big Match Record</Label>
                    <Textarea value={coachForm.bigMatchRecord} onChange={e => setCoachForm(f => ({...f, bigMatchRecord: e.target.value}))} rows={2} className="text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Set Piece Approach</Label>
                    <Textarea value={coachForm.setPieceApproach} onChange={e => setCoachForm(f => ({...f, setPieceApproach: e.target.value}))} rows={2} className="text-sm mt-1" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Known Weaknesses</Label>
                    <Textarea value={coachForm.knownWeaknesses} onChange={e => setCoachForm(f => ({...f, knownWeaknesses: e.target.value}))} rows={2} className="text-sm mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs">Career Highlights</Label>
                    <Textarea value={coachForm.careerHighlights} onChange={e => setCoachForm(f => ({...f, careerHighlights: e.target.value}))} rows={2} className="text-sm mt-1" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setShowCoachForm(false)}>Cancel</Button>
                  <Button size="sm" onClick={handleSaveCoach} disabled={saveCoachMutation.isPending}>
                    {saveCoachMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />} Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((c: any) => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">{c.name}</CardTitle>
                      <CardDescription className="text-xs">{c.nationality} · {c.team_name}</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-xs">{c.preferred_formation}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-3 space-y-2">
                  {c.win_rate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Trophy className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-500" />
                      <span>Win Rate: <strong>{c.win_rate}%</strong></span>
                    </div>
                  )}
                  {c.tactical_philosophy && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.tactical_philosophy}</p>
                  )}
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="h-7 text-xs flex-1" onClick={() => { setCoachForm({ id: c.id, name: c.name, nationality: c.nationality||"", age: c.age||undefined, teamName: c.team_name||"", yearsExperience: c.years_experience||undefined, preferredFormation: c.preferred_formation||"4-4-2", tacticalPhilosophy: c.tactical_philosophy||"", pressingStyle: c.pressing_style||"", defensiveApproach: c.defensive_approach||"", attackingApproach: c.attacking_approach||"", substitutionPatterns: c.substitution_patterns||"", bigMatchRecord: c.big_match_record||"", setPieceApproach: c.set_piece_approach||"", knownWeaknesses: c.known_weaknesses||"", careerHighlights: c.career_highlights||"", winRate: c.win_rate||undefined, notes: c.notes||"" }); setShowCoachForm(true); }}>
                      <Edit className="h-3 w-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteCoachMutation.mutate({ id: c.id }, { onSuccess: () => refetchCoaches() })}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
