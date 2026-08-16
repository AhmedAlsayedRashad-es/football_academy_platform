import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { 
  ArrowLeft, Target, TrendingUp, Activity, Zap, 
  Download, BarChart3, Database, ExternalLink, RefreshCw, AlertCircle
} from "lucide-react";

// ─── Mock academy match data ────────────────────────────────────────────────
const mockMatchData = {
  matchId: 1,
  homeTeam: "Future Stars Academy U16",
  awayTeam: "Elite Academy U16",
  date: "2025-12-20",
  score: { home: 2, away: 1 },
  shots: [
    { id: 1, teamId: 1, playerId: 5, playerName: "Ahmed Hassan", x: 85, y: 45, xG: 0.32, isGoal: true, minute: 15 },
    { id: 2, teamId: 1, playerId: 10, playerName: "Mohamed Salah Jr", x: 75, y: 30, xG: 0.15, isGoal: false, minute: 22 },
    { id: 3, teamId: 2, playerId: 15, playerName: "Opponent Player", x: 20, y: 50, xG: 0.45, isGoal: true, minute: 35 },
    { id: 4, teamId: 1, playerId: 7, playerName: "Omar Ali", x: 90, y: 55, xG: 0.65, isGoal: true, minute: 58 },
    { id: 5, teamId: 2, playerId: 18, playerName: "Opponent Player 2", x: 15, y: 40, xG: 0.22, isGoal: false, minute: 67 },
    { id: 6, teamId: 1, playerId: 10, playerName: "Mohamed Salah Jr", x: 80, y: 60, xG: 0.18, isGoal: false, minute: 75 },
    { id: 7, teamId: 2, playerId: 16, playerName: "Opponent Player 3", x: 25, y: 35, xG: 0.28, isGoal: false, minute: 82 },
  ],
  passes: [
    { id: 1, teamId: 1, from: 5, to: 10, fromName: "Ahmed Hassan", toName: "Mohamed Salah Jr", x1: 60, y1: 40, x2: 75, y2: 30, xA: 0.12, success: true },
    { id: 2, teamId: 1, from: 10, to: 7, fromName: "Mohamed Salah Jr", toName: "Omar Ali", x1: 75, y1: 30, x2: 85, y2: 45, xA: 0.28, success: true },
    { id: 3, teamId: 2, from: 15, to: 18, fromName: "Opponent", toName: "Opponent 2", x1: 40, y1: 50, x2: 20, y2: 50, xA: 0.35, success: true },
  ],
  defensiveActions: [
    { id: 1, teamId: 1, playerId: 3, playerName: "Defender 1", type: "tackle", x: 35, y: 45, success: true, minute: 12 },
    { id: 2, teamId: 1, playerId: 4, playerName: "Defender 2", type: "interception", x: 40, y: 55, success: true, minute: 28 },
    { id: 3, teamId: 2, playerId: 20, playerName: "Opp Defender", type: "block", x: 65, y: 50, success: true, minute: 45 },
  ],
  teamStats: {
    home: { xG: 1.30, actualGoals: 2, shots: 4, shotsOnTarget: 3, passAccuracy: 82, possession: 58 },
    away: { xG: 0.95, actualGoals: 1, shots: 3, shotsOnTarget: 2, passAccuracy: 76, possession: 42 }
  },
  playerStats: [
    { playerId: 5, name: "Ahmed Hassan", xG: 0.32, xA: 0.12, shots: 1, keyPasses: 2, touches: 45 },
    { playerId: 10, name: "Mohamed Salah Jr", xG: 0.33, xA: 0.28, shots: 2, keyPasses: 3, touches: 52 },
    { playerId: 7, name: "Omar Ali", xG: 0.65, xA: 0.05, shots: 1, keyPasses: 1, touches: 38 },
  ]
};

// ─── StatsBomb Open Data competitions list (subset) ─────────────────────────
const STATSBOMB_COMPETITIONS = [
  { competition_id: 2, season_id: 44, label: "Premier League 2003/04" },
  { competition_id: 11, season_id: 90, label: "La Liga 2020/21" },
  { competition_id: 37, season_id: 42, label: "Women's World Cup 2019" },
  { competition_id: 43, season_id: 106, label: "FIFA World Cup 2022" },
  { competition_id: 55, season_id: 43, label: "UEFA Euro 2020" },
  { competition_id: 55, season_id: 282, label: "UEFA Euro 2024" },
];

interface SBShot {
  id: string;
  index: number;
  minute: number;
  player: { name: string };
  team: { name: string };
  location: [number, number];
  shot: { statsbomb_xg: number; outcome: { name: string }; technique: { name: string } };
}

interface SBMatchSummary {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  homeXG: number;
  awayXG: number;
  shots: SBShot[];
}

// ─── StatsBomb Open Data fetcher ─────────────────────────────────────────────
const SB_BASE = "https://raw.githubusercontent.com/statsbomb/open-data/master/data";

async function fetchSBMatches(competitionId: number, seasonId: number) {
  const res = await fetch(`${SB_BASE}/matches/${competitionId}/${seasonId}.json`);
  if (!res.ok) throw new Error("Failed to fetch matches");
  return res.json();
}

async function fetchSBEvents(matchId: number): Promise<SBShot[]> {
  const res = await fetch(`${SB_BASE}/events/${matchId}.json`);
  if (!res.ok) throw new Error("Failed to fetch events");
  const events = await res.json();
  return events.filter((e: any) => e.type?.name === "Shot");
}

// ─── Pitch renderer ──────────────────────────────────────────────────────────
function PitchWithShots({ shots, homeTeam, awayTeam }: { shots: SBShot[]; homeTeam: string; awayTeam: string }) {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState<"all" | "home" | "away">("all");
  const filtered = shots.filter(s => {
    if (filter === "home") return s.team.name === homeTeam;
    if (filter === "away") return s.team.name === awayTeam;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(["all", "home", "away"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filter === f ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted"}`}
          >
            {f === "all" ? "All Teams" : f === "home" ? homeTeam : awayTeam}
          </button>
        ))}
        <span className="text-xs text-muted-foreground self-center ml-2">{filtered.length} shots</span>
      </div>
      <div className="relative w-full bg-green-800 rounded-lg overflow-hidden" style={{ aspectRatio: "105/68" }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 105 68">
          {/* Pitch outline */}
          <rect x="0" y="0" width="105" height="68" fill="#2d6a2d" />
          <rect x="0" y="0" width="105" height="68" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          {/* Centre line */}
          <line x1="52.5" y1="0" x2="52.5" y2="68" stroke="white" strokeWidth="0.5" opacity="0.7" />
          {/* Centre circle */}
          <circle cx="52.5" cy="34" r="9.15" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          {/* Left penalty area */}
          <rect x="0" y="13.84" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          {/* Right penalty area */}
          <rect x="88.5" y="13.84" width="16.5" height="40.32" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          {/* Left 6-yard box */}
          <rect x="0" y="24.84" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          {/* Right 6-yard box */}
          <rect x="99.5" y="24.84" width="5.5" height="18.32" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          {/* Goals */}
          <rect x="-1" y="30.34" width="1" height="7.32" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          <rect x="105" y="30.34" width="1" height="7.32" fill="none" stroke="white" strokeWidth="0.5" opacity="0.7" />
          {/* Shot markers */}
          {filtered.map((shot) => {
            const [x, y] = shot.location;
            const xG = shot.shot.statsbomb_xg;
            const isGoal = shot.shot.outcome.name === "Goal";
            const isHome = shot.team.name === homeTeam;
            const r = 1.2 + xG * 3;
            return (
              <g key={shot.id}>
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={isGoal ? "#22c55e" : isHome ? "#3b82f6" : "#ef4444"}
                  opacity={0.75}
                  stroke="white"
                  strokeWidth="0.3"
                />
                <title>{shot.player.name} ({shot.team.name}) — xG: {xG.toFixed(2)} — {shot.shot.outcome.name} ({shot.minute}')</title>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Goal</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> Home shot</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Away shot</span>
        <span className="ml-2">Circle size = xG value · Hover for details</span>
      </div>
    </div>
  );
}

export default function XGAnalytics() {
  const [, navigate] = useLocation();
  const [selectedTeam, setSelectedTeam] = useState<number>(1);
  const [selectedView, setSelectedView] = useState<'shots' | 'passes' | 'defensive'>('shots');
  const [mainTab, setMainTab] = useState<"academy" | "statsbomb">("academy");
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const { data: academyMatches = [] } = trpc.matches.getAll.useQuery(undefined, { retry: false });
  const { data: xgMatchData, isLoading: xgLoading } = trpc.xgAnalytics.getMatchData.useQuery(
    { matchId: selectedMatchId! },
    { enabled: !!selectedMatchId }
  );
  // Use real data if available, otherwise fall back to mock
  const matchData = xgMatchData || mockMatchData;

  // StatsBomb state
  const [sbComp, setSbComp] = useState(STATSBOMB_COMPETITIONS[3]); // World Cup 2022
  const [sbSelectedPlayer, setSbSelectedPlayer] = useState<string>("all");
  const [sbMatches, setSbMatches] = useState<any[]>([]);
  const [sbMatchId, setSbMatchId] = useState<number | null>(null);
  const [sbSummary, setSbSummary] = useState<SBMatchSummary | null>(null);
  const [sbLoading, setSbLoading] = useState(false);
  const [sbError, setSbError] = useState<string | null>(null);

  // Load matches when competition changes
  useEffect(() => {
    if (mainTab !== "statsbomb") return;
    setSbMatches([]);
    setSbMatchId(null);
    setSbSummary(null);
    setSbError(null);
    setSbLoading(true);
    fetchSBMatches(sbComp.competition_id, sbComp.season_id)
      .then(data => {
        setSbMatches(data.slice(0, 30)); // limit to 30
        setSbLoading(false);
      })
      .catch(e => { setSbError(e.message); setSbLoading(false); });
  }, [sbComp, mainTab]);

  // Load events when match changes
  const loadSBMatch = async (matchId: number, match: any) => {
    setSbMatchId(matchId);
    setSbSummary(null);
    setSbError(null);
    setSbLoading(true);
    try {
      const shots = await fetchSBEvents(matchId);
      const homeTeam = match.home_team.home_team_name;
      const awayTeam = match.away_team.away_team_name;
      const homeShots = shots.filter((s: SBShot) => s.team.name === homeTeam);
      const awayShots = shots.filter((s: SBShot) => s.team.name === awayTeam);
      const homeXG = homeShots.reduce((sum: number, s: SBShot) => sum + (s.shot.statsbomb_xg || 0), 0);
      const awayXG = awayShots.reduce((sum: number, s: SBShot) => sum + (s.shot.statsbomb_xg || 0), 0);
      setSbSummary({
        matchId,
        homeTeam,
        awayTeam,
        homeScore: match.home_score,
        awayScore: match.away_score,
        homeXG,
        awayXG,
        shots,
      });
    } catch (e: any) {
      setSbError(e.message);
    } finally {
      setSbLoading(false);
    }
  };

  // ── Pitch renderer (academy tab) ──────────────────────────────────────────
  const renderPitch = (children: React.ReactNode) => (
    <div className="relative w-full aspect-[2/3] bg-green-700 rounded-lg overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 150">
        <rect x="2" y="2" width="96" height="146" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
        <line x1="2" y1="75" x2="98" y2="75" stroke="white" strokeWidth="0.3" opacity="0.6" />
        <circle cx="50" cy="75" r="9" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
        <rect x="20" y="2" width="60" height="16" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
        <rect x="20" y="132" width="60" height="16" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
        <rect x="35" y="2" width="30" height="6" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
        <rect x="35" y="142" width="30" height="6" fill="none" stroke="white" strokeWidth="0.3" opacity="0.6" />
      </svg>
      {children}
    </div>
  );

  const renderShotMap = () => {
    const filteredShots = matchData.shots.filter(s => s.teamId === selectedTeam);
    return renderPitch(
      <div className="absolute inset-0">
        {filteredShots.map(shot => {
          const size = 20 + shot.xG * 30;
          const color = shot.isGoal ? '#22c55e' : '#ef4444';
          return (
            <div key={shot.id} className="absolute group cursor-pointer" style={{ left: `${shot.x}%`, top: `${shot.y}%`, transform: 'translate(-50%, -50%)' }}>
              <div className="rounded-full border-2 border-white transition-transform hover:scale-125" style={{ width: `${size}px`, height: `${size}px`, backgroundColor: color, opacity: 0.7 }} />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-card text-foreground text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                <div className="font-bold">{shot.playerName}</div>
                <div>xG: {shot.xG.toFixed(2)}</div>
                <div>{shot.isGoal ? 'Goal' : 'Miss'}</div>
                <div>{shot.minute}'</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPassMap = () => {
    const filteredPasses = matchData.passes.filter(p => p.teamId === selectedTeam);
    return renderPitch(
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 150">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
          </marker>
        </defs>
        {filteredPasses.map(pass => (
          <g key={pass.id}>
            <line x1={pass.x1} y1={pass.y1} x2={pass.x2} y2={pass.y2} stroke={pass.success ? '#3b82f6' : '#ef4444'} strokeWidth={0.5 + pass.xA * 2} opacity={pass.success ? 0.8 : 0.3} markerEnd="url(#arrowhead)" />
            <circle cx={pass.x1} cy={pass.y1} r="1.5" fill={pass.success ? '#3b82f6' : '#ef4444'} opacity={pass.success ? 0.8 : 0.3} />
            <circle cx={pass.x2} cy={pass.y2} r="1.5" fill={pass.success ? '#3b82f6' : '#ef4444'} opacity={pass.success ? 0.8 : 0.3} />
          </g>
        ))}
      </svg>
    );
  };

  const renderDefensiveMap = () => {
    const filteredActions = matchData.defensiveActions.filter(a => a.teamId === selectedTeam);
    const colors: Record<string, string> = { tackle: '#f59e0b', interception: '#3b82f6', block: '#ef4444' };
    const icons: Record<string, string> = { tackle: '🦵', interception: '✋', block: '🛡️' };
    return renderPitch(
      <div className="absolute inset-0">
        {filteredActions.map(action => (
          <div key={action.id} className="absolute group cursor-pointer" style={{ left: `${action.x}%`, top: `${action.y}%`, transform: 'translate(-50%, -50%)' }}>
            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-lg transition-transform hover:scale-125" style={{ backgroundColor: colors[action.type], opacity: action.success ? 0.9 : 0.4 }}>
              {icons[action.type]}
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-card text-foreground text-xs rounded px-2 py-1 whitespace-nowrap z-10">
              <div className="font-bold">{action.playerName}</div>
              <div className="capitalize">{action.type}</div>
              <div>{action.success ? '✓ Success' : '✗ Failed'}</div>
              <div>{action.minute}'</div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const homeXG = matchData.teamStats.home.xG;
  const awayXG = matchData.teamStats.away.xG;

  // The live xG feed doesn't carry possession/passAccuracy the way the mock
  // does, so read them defensively instead of assuming the mock's shape.
  const teamStat = (
    side: typeof matchData.teamStats.home | typeof matchData.teamStats.away,
    key: "possession" | "passAccuracy"
  ): number => (key in side ? Number((side as Record<string, unknown>)[key]) || 0 : 0);

  return (
    <>
    <div >
      {/* Header */}
      <header className="bg-card/50 border-b border-border sticky top-0 z-10 backdrop-blur-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate(-1 as any)}>
                <ArrowLeft className="w-4 h-4 mr-2" />Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">xG Analytics Dashboard</h1>
                <p className="text-muted-foreground text-sm">Expected Goals & Match Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-xs">
                <Database className="w-3 h-3 mr-1" />StatsBomb Open Data
              </Badge>
              <Button variant="outline" size="sm" className="border-border text-muted-foreground">
                <Download className="w-4 h-4 mr-2" />Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-6">
        {/* Main tabs: Academy vs StatsBomb */}
        <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as any)}>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="academy" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Target className="w-4 h-4 mr-2" />Academy Match
            </TabsTrigger>
            <TabsTrigger value="statsbomb" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Database className="w-4 h-4 mr-2" />StatsBomb Open Data
            </TabsTrigger>
          </TabsList>

          {/* ── ACADEMY TAB ── */}
          <TabsContent value="academy" className="space-y-6 mt-6">
            {/* Match Selector */}
            {(academyMatches as any[]).length > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm font-medium">Select Match:</span>
                <Select value={selectedMatchId ? String(selectedMatchId) : ""} onValueChange={v => setSelectedMatchId(v ? Number(v) : null)}>
                  <SelectTrigger className="w-64 bg-card border-border text-foreground">
                    <SelectValue placeholder="Choose a match..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {(academyMatches as any[]).map((m: any) => (
                      <SelectItem key={m.id} value={String(m.id)} className="text-foreground hover:bg-muted">
                        {m.opponent || 'Unknown'} — {m.matchDate ? new Date(m.matchDate).toLocaleDateString() : 'No date'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {xgLoading && <span className="text-muted-foreground text-sm animate-pulse">Loading xG data...</span>}
                {!selectedMatchId && <span className="text-muted-foreground text-xs">(Showing demo data)</span>}
              </div>
            )}
            {/* Match Header */}
            <Card className="bg-card border-border">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold text-foreground mb-2">{matchData.homeTeam}</div>
                    <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-500">{matchData.teamStats.home.actualGoals}</div>
                    <div className="text-sm text-muted-foreground mt-2">xG: {homeXG.toFixed(2)}</div>
                  </div>
                  <div className="text-center px-8">
                    <div className="text-muted-foreground text-sm mb-2">{matchData.date}</div>
                    <div className="text-2xl font-bold text-foreground">VS</div>
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-2xl font-bold text-foreground mb-2">{matchData.awayTeam}</div>
                    <div className="text-4xl font-bold text-red-500">{matchData.teamStats.away.actualGoals}</div>
                    <div className="text-sm text-muted-foreground mt-2">xG: {awayXG.toFixed(2)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-card border-border">
                <CardHeader className="pb-3"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Target className="w-4 h-4" />Shots</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-center"><div className="text-2xl font-bold text-foreground">{matchData.teamStats.home.shots}</div><div className="text-xs text-muted-foreground">{matchData.teamStats.home.shotsOnTarget} on target</div></div>
                    <div className="text-muted-foreground">vs</div>
                    <div className="text-center"><div className="text-2xl font-bold text-foreground">{matchData.teamStats.away.shots}</div><div className="text-xs text-muted-foreground">{matchData.teamStats.away.shotsOnTarget} on target</div></div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader className="pb-3"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4" />Possession</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm"><span className="text-foreground">{teamStat(matchData.teamStats.home, 'possession')}%</span><span className="text-foreground">{teamStat(matchData.teamStats.away, 'possession')}%</span></div>
                    <div className="w-full bg-muted rounded-full h-3 flex overflow-hidden">
                      <div className="bg-emerald-500" style={{ width: `${teamStat(matchData.teamStats.home, 'possession')}%` }} />
                      <div className="bg-red-500" style={{ width: `${teamStat(matchData.teamStats.away, 'possession')}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardHeader className="pb-3"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Zap className="w-4 h-4" />Pass Accuracy</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-center"><div className="text-2xl font-bold text-foreground">{teamStat(matchData.teamStats.home, 'passAccuracy')}%</div></div>
                    <div className="text-muted-foreground">vs</div>
                    <div className="text-center"><div className="text-2xl font-bold text-foreground">{teamStat(matchData.teamStats.away, 'passAccuracy')}%</div></div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Visualization */}
            <Card className="bg-card border-border">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">Match Visualization</CardTitle>
                  <Select value={selectedTeam.toString()} onValueChange={(v) => setSelectedTeam(parseInt(v))}>
                    <SelectTrigger className="w-48 bg-muted border-border text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      <SelectItem value="1">{matchData.homeTeam}</SelectItem>
                      <SelectItem value="2">{matchData.awayTeam}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
                  <TabsList className="bg-muted border-border">
                    <TabsTrigger value="shots">Shot Map</TabsTrigger>
                    <TabsTrigger value="passes">Pass Map</TabsTrigger>
                    <TabsTrigger value="defensive">Defensive Actions</TabsTrigger>
                  </TabsList>
                  <div className="mt-6">
                    <TabsContent value="shots" className="m-0">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500" /><span className="text-muted-foreground">Goal</span></div>
                          <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-red-500" /><span className="text-muted-foreground">Miss</span></div>
                          <div className="text-muted-foreground ml-4">Circle size = xG value</div>
                        </div>
                        {renderShotMap()}
                      </div>
                    </TabsContent>
                    <TabsContent value="passes" className="m-0">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-blue-500" /><span className="text-muted-foreground">Successful</span></div>
                          <div className="flex items-center gap-2"><div className="w-8 h-0.5 bg-red-500" /><span className="text-muted-foreground">Failed</span></div>
                          <div className="text-muted-foreground ml-4">Thickness = xA</div>
                        </div>
                        {renderPassMap()}
                      </div>
                    </TabsContent>
                    <TabsContent value="defensive" className="m-0">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">🦵</div><span className="text-muted-foreground">Tackle</span></div>
                          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">✋</div><span className="text-muted-foreground">Interception</span></div>
                          <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">🛡️</div><span className="text-muted-foreground">Block</span></div>
                        </div>
                        {renderDefensiveMap()}
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>

            {/* Player Stats */}
            <Card className="bg-card border-border">
              <CardHeader><CardTitle className="text-foreground">Player Statistics</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground font-medium">Player</th>
                        <th className="text-center py-3 px-4 text-muted-foreground font-medium">xG</th>
                        <th className="text-center py-3 px-4 text-muted-foreground font-medium">xA</th>
                        <th className="text-center py-3 px-4 text-muted-foreground font-medium">Shots</th>
                        <th className="text-center py-3 px-4 text-muted-foreground font-medium">Key Passes</th>
                        <th className="text-center py-3 px-4 text-muted-foreground font-medium">Touches</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchData.playerStats.map(player => (
                        <tr key={player.playerId} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-3 px-4 text-foreground font-medium">{player.name}</td>
                          <td className="py-3 px-4 text-center text-emerald-700 dark:text-emerald-400 font-bold">{player.xG.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center text-blue-600 dark:text-blue-400 font-bold">{player.xA.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{player.shots}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{player.keyPasses}</td>
                          <td className="py-3 px-4 text-center text-muted-foreground">{player.touches}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── STATSBOMB TAB ── */}
          <TabsContent value="statsbomb" className="space-y-6 mt-6">
            {/* Info banner */}
            <Card className="bg-blue-900/20 border-blue-500/30">
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-600 dark:text-blue-300 font-medium text-sm">StatsBomb Open Data — Real Match Events</p>
                    <p className="text-blue-400/70 text-xs mt-1">
                      Free high-quality event data from StatsBomb including xG values for every shot. Data is fetched live from the{" "}
                      <a href="https://github.com/statsbomb/open-data" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 dark:hover:text-blue-300 inline-flex items-center gap-1">
                        StatsBomb GitHub repository <ExternalLink className="w-3 h-3" />
                      </a>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Competition selector */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-base">Select Competition & Match</CardTitle>
                <CardDescription className="text-muted-foreground">Choose a competition to browse real match data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Competition</label>
                    <Select
                      value={`${sbComp.competition_id}-${sbComp.season_id}`}
                      onValueChange={(v) => {
                        const [cid, sid] = v.split("-").map(Number);
                        const found = STATSBOMB_COMPETITIONS.find(c => c.competition_id === cid && c.season_id === sid);
                        if (found) setSbComp(found);
                      }}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-muted border-border">
                        {STATSBOMB_COMPETITIONS.map(c => (
                          <SelectItem key={`${c.competition_id}-${c.season_id}`} value={`${c.competition_id}-${c.season_id}`}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Match ({sbMatches.length} available)</label>
                    <Select
                      value={sbMatchId?.toString() ?? ""}
                      onValueChange={(v) => {
                        const match = sbMatches.find((m: any) => m.match_id === parseInt(v));
                        if (match) loadSBMatch(parseInt(v), match);
                      }}
                      disabled={sbLoading || sbMatches.length === 0}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground">
                        <SelectValue placeholder={sbLoading ? "Loading matches..." : "Select a match"} />
                      </SelectTrigger>
                      <SelectContent className="bg-muted border-border max-h-60">
                        {sbMatches.map((m: any) => (
                          <SelectItem key={m.match_id} value={m.match_id.toString()}>
                            {m.home_team.home_team_name} {m.home_score}–{m.away_score} {m.away_team.away_team_name} ({m.match_date})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error */}
            {sbError && (
              <Card className="bg-red-900/20 border-red-500/30">
                <CardContent className="py-4 flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{sbError}</span>
                </CardContent>
              </Card>
            )}

            {/* Loading */}
            {sbLoading && (
              <div className="flex items-center justify-center py-12 gap-3 text-muted-foreground">
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Fetching StatsBomb data...</span>
              </div>
            )}

            {/* Match summary */}
            {sbSummary && !sbLoading && (
              <div className="space-y-6">
                {/* Score card */}
                <Card className="bg-card border-border">
                  <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                      <div className="text-center flex-1">
                        <div className="text-xl font-bold text-foreground mb-2">{sbSummary.homeTeam}</div>
                        <div className="text-4xl font-bold text-emerald-700 dark:text-emerald-500">{sbSummary.homeScore}</div>
                        <div className="text-sm text-muted-foreground mt-2">xG: {sbSummary.homeXG.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground mt-1">{sbSummary.shots.filter(s => s.team.name === sbSummary!.homeTeam).length} shots</div>
                      </div>
                      <div className="text-center px-6">
                        <div className="text-xl font-bold text-muted-foreground">VS</div>
                        <div className="text-xs text-muted-foreground mt-2">StatsBomb xG</div>
                        <Badge className="mt-2 bg-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs">Real Data</Badge>
                      </div>
                      <div className="text-center flex-1">
                        <div className="text-xl font-bold text-foreground mb-2">{sbSummary.awayTeam}</div>
                        <div className="text-4xl font-bold text-red-500">{sbSummary.awayScore}</div>
                        <div className="text-sm text-muted-foreground mt-2">xG: {sbSummary.awayXG.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground mt-1">{sbSummary.shots.filter(s => s.team.name === sbSummary!.awayTeam).length} shots</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shot map */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Target className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
                      Shot Map — StatsBomb xG
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {sbSummary.shots.length} shots · Circle size = xG value · Hover for details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <PitchWithShots shots={sbSummary.shots} homeTeam={sbSummary.homeTeam} awayTeam={sbSummary.awayTeam} />
                  </CardContent>
                </Card>

                {/* Player Shot Map */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      Player Shot Map
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Select a player to see their individual shot locations and xG profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <select
                        value={sbSelectedPlayer}
                        onChange={e => setSbSelectedPlayer(e.target.value)}
                        className="bg-muted border border-border text-foreground text-sm rounded-lg px-3 py-2 w-full max-w-sm"
                      >
                        <option value="all">All Players ({sbSummary.shots.length} shots)</option>
                        {Array.from(new Set(sbSummary.shots.map(s => s.player.name))).sort().map(name => {
                          const ps = sbSummary.shots.filter(s => s.player.name === name);
                          const txg = ps.reduce((sum, s) => sum + s.shot.statsbomb_xg, 0);
                          const goals = ps.filter(s => s.shot.outcome.name === "Goal").length;
                          return <option key={name} value={name}>{name} — {ps.length} shots, {goals}G, xG {txg.toFixed(2)}</option>;
                        })}
                      </select>
                    </div>
                    {sbSelectedPlayer !== "all" && (() => {
                      const ps = sbSummary.shots.filter(s => s.player.name === sbSelectedPlayer);
                      const txg = ps.reduce((sum, s) => sum + s.shot.statsbomb_xg, 0);
                      const goals = ps.filter(s => s.shot.outcome.name === "Goal").length;
                      const onTarget = ps.filter(s => ["Goal", "Saved"].includes(s.shot.outcome.name)).length;
                      return (
                        <div className="grid grid-cols-4 gap-3 mb-4">
                          <div className="bg-muted/50 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-foreground">{ps.length}</div>
                            <div className="text-xs text-muted-foreground mt-1">Shots</div>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{goals}</div>
                            <div className="text-xs text-muted-foreground mt-1">Goals</div>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{onTarget}</div>
                            <div className="text-xs text-muted-foreground mt-1">On Target</div>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3 text-center">
                            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{txg.toFixed(2)}</div>
                            <div className="text-xs text-muted-foreground mt-1">Total xG</div>
                          </div>
                        </div>
                      );
                    })()}
                    <PitchWithShots
                      shots={sbSelectedPlayer === "all" ? sbSummary.shots : sbSummary.shots.filter(s => s.player.name === sbSelectedPlayer)}
                      homeTeam={sbSummary.homeTeam}
                      awayTeam={sbSummary.awayTeam}
                    />
                  </CardContent>
                </Card>
                {/* Top shots table */}
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      Top Shots by xG
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 text-muted-foreground">Player</th>
                            <th className="text-left py-2 px-3 text-muted-foreground">Team</th>
                            <th className="text-center py-2 px-3 text-muted-foreground">xG</th>
                            <th className="text-center py-2 px-3 text-muted-foreground">Outcome</th>
                            <th className="text-center py-2 px-3 text-muted-foreground">Technique</th>
                            <th className="text-center py-2 px-3 text-muted-foreground">Min</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...sbSummary.shots]
                            .sort((a, b) => b.shot.statsbomb_xg - a.shot.statsbomb_xg)
                            .slice(0, 10)
                            .map((shot) => (
                              <tr key={shot.id} className="border-b border-border/50 hover:bg-muted/30">
                                <td className="py-2 px-3 text-foreground">{shot.player.name}</td>
                                <td className="py-2 px-3 text-muted-foreground text-xs">{shot.team.name}</td>
                                <td className="py-2 px-3 text-center">
                                  <span className={`font-bold ${shot.shot.statsbomb_xg >= 0.3 ? "text-emerald-700 dark:text-emerald-400" : shot.shot.statsbomb_xg >= 0.1 ? "text-yellow-700 dark:text-yellow-400" : "text-muted-foreground"}`}>
                                    {shot.shot.statsbomb_xg.toFixed(3)}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <Badge className={shot.shot.outcome.name === "Goal" ? "bg-emerald-600/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" : "bg-muted text-muted-foreground border-border"}>
                                    {shot.shot.outcome.name}
                                  </Badge>
                                </td>
                                <td className="py-2 px-3 text-center text-muted-foreground text-xs">{shot.shot.technique.name}</td>
                                <td className="py-2 px-3 text-center text-muted-foreground">{shot.minute}'</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Empty state */}
            {!sbSummary && !sbLoading && !sbError && sbMatches.length > 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <Target className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>Select a match above to load real StatsBomb xG data</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}
