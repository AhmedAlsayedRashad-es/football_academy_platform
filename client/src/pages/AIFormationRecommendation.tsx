import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain, Users, Target, Star, Activity,
  TrendingUp, AlertTriangle, CheckCircle, Info, Users2, ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AIBreadcrumb } from "@/components/AIBreadcrumb";
import { useLanguage } from '@/contexts/LanguageContext';


// ─────────────────────────────────────────────
// Formation definitions by player count
// ─────────────────────────────────────────────
const FORMATIONS_11: { value: string; label: string; positions: string[] }[] = [
  { value: "4-3-3", label: "4-3-3 (Attacking)", positions: ["GK","RB","CB","CB","LB","CM","CM","CM","RW","ST","LW"] },
  { value: "4-4-2", label: "4-4-2 (Balanced)", positions: ["GK","RB","CB","CB","LB","RM","CM","CM","LM","ST","ST"] },
  { value: "4-2-3-1", label: "4-2-3-1 (Defensive)", positions: ["GK","RB","CB","CB","LB","CDM","CDM","CAM","CAM","CAM","ST"] },
  { value: "3-5-2", label: "3-5-2 (Wing Play)", positions: ["GK","CB","CB","CB","RWB","CM","CDM","CM","LWB","ST","ST"] },
  { value: "5-3-2", label: "5-3-2 (Ultra Defensive)", positions: ["GK","RB","CB","CB","CB","LB","CM","CM","CM","ST","ST"] },
];

const FORMATIONS_9: { value: string; label: string; positions: string[] }[] = [
  { value: "3-3-2", label: "3-3-2 (Balanced)", positions: ["GK","CB","CB","CB","CM","CM","CM","ST","ST"] },
  { value: "2-4-2", label: "2-4-2 (Midfield)", positions: ["GK","CB","CB","CM","CM","CM","CM","ST","ST"] },
  { value: "3-2-3", label: "3-2-3 (Attacking)", positions: ["GK","CB","CB","CB","CM","CM","RW","ST","LW"] },
];

const FORMATIONS_7: { value: string; label: string; positions: string[] }[] = [
  { value: "2-3-1", label: "2-3-1 (Balanced)", positions: ["GK","CB","CB","CM","CM","CM","ST"] },
  { value: "1-3-2-1", label: "1-3-2-1 (Attacking)", positions: ["GK","CB","CM","CM","CM","ST","ST"] },
  { value: "2-2-2", label: "2-2-2 (Open)", positions: ["GK","CB","CB","CM","CM","ST","ST"] },
];

const POSITION_GROUPS: Record<string, string> = {
  GK: "Goalkeeper", RB: "Right Back", LB: "Left Back", CB: "Centre Back",
  CDM: "Defensive Mid", CM: "Central Mid", CAM: "Attacking Mid",
  RM: "Right Mid", LM: "Left Mid", RW: "Right Wing", LW: "Left Wing",
  RWB: "Right Wing Back", LWB: "Left Wing Back", ST: "Striker", CF: "Centre Forward"
};

// Position-specific skill weights
const POSITION_WEIGHTS: Record<string, [string, number][]> = {
  GK: [["composure",0.20],["positioning",0.20],["strength",0.15],["jumping",0.15],["decisionMaking",0.15],["vision",0.15]],
  CB: [["tackling",0.25],["marking",0.20],["heading",0.15],["strength",0.15],["interceptions",0.15],["composure",0.10]],
  RB: [["tackling",0.20],["speed",0.20],["stamina",0.15],["crossing",0.15],["marking",0.15],["acceleration",0.15]],
  LB: [["tackling",0.20],["speed",0.20],["stamina",0.15],["crossing",0.15],["marking",0.15],["acceleration",0.15]],
  RWB: [["speed",0.25],["stamina",0.20],["crossing",0.20],["tackling",0.15],["acceleration",0.20]],
  LWB: [["speed",0.25],["stamina",0.20],["crossing",0.20],["tackling",0.15],["acceleration",0.20]],
  CDM: [["tackling",0.25],["interceptions",0.20],["positioning",0.15],["passing",0.15],["strength",0.15],["workRate",0.10]],
  CM: [["passing",0.20],["vision",0.20],["stamina",0.15],["decisionMaking",0.15],["ballControl",0.15],["workRate",0.15]],
  CAM: [["vision",0.25],["passing",0.20],["dribbling",0.20],["shooting",0.15],["decisionMaking",0.20]],
  RM: [["speed",0.20],["crossing",0.20],["dribbling",0.20],["stamina",0.15],["passing",0.15],["acceleration",0.10]],
  LM: [["speed",0.20],["crossing",0.20],["dribbling",0.20],["stamina",0.15],["passing",0.15],["acceleration",0.10]],
  RW: [["speed",0.25],["dribbling",0.25],["shooting",0.15],["acceleration",0.20],["crossing",0.15]],
  LW: [["speed",0.25],["dribbling",0.25],["shooting",0.15],["acceleration",0.20],["crossing",0.15]],
  ST: [["shooting",0.30],["positioning",0.20],["speed",0.15],["heading",0.15],["firstTouch",0.20]],
  CF: [["shooting",0.25],["dribbling",0.20],["vision",0.20],["passing",0.15],["positioning",0.20]],
};

function scorePlayerForPosition(player: any, pos: string): number {
  const s = player.skills;
  if (!s) return 50;
  const weights = POSITION_WEIGHTS[pos] || POSITION_WEIGHTS["CM"];
  let total = 0, wSum = 0;
  for (const [key, w] of weights) {
    const val = s[key] ?? 50;
    total += val * w;
    wSum += w;
  }
  return Math.round(total / wSum);
}

// Build optimal lineup: pick best N players from squad and assign to positions
function buildOptimalLineup(players: any[], formation: { value: string; label: string; positions: string[] }): Record<string, any> {
  const lineup: Record<string, any> = {};
  const usedIds = new Set<number>();
  const n = formation.positions.length; // 7, 9, or 11

  // Group positions to handle duplicates
  const positionGroups: Record<string, number[]> = {};
  formation.positions.forEach((pos, idx) => {
    if (!positionGroups[pos]) positionGroups[pos] = [];
    positionGroups[pos].push(idx);
  });

  // First, select the best N players from the squad based on overall rating
  // (prioritize players with skill data, then by overall rating)
  const sortedPlayers = [...players].sort((a, b) => {
    const aRating = a.skills?.overallRating ?? a.overallRating ?? 60;
    const bRating = b.skills?.overallRating ?? b.overallRating ?? 60;
    // Prioritize players with skill assessments
    const aHasSkills = a.skills ? 1 : 0;
    const bHasSkills = b.skills ? 1 : 0;
    if (bHasSkills !== aHasSkills) return bHasSkills - aHasSkills;
    return bRating - aRating;
  });

  // Take the best N players
  const selectedPlayers = sortedPlayers.slice(0, Math.min(n, sortedPlayers.length));

  // Assign players to positions using greedy best-fit
  for (const [pos, indices] of Object.entries(positionGroups)) {
    for (let i = 0; i < indices.length; i++) {
      const available = selectedPlayers.filter(p => !usedIds.has(p.id));
      if (available.length === 0) break;
      const scored = available
        .map(p => ({ ...p, posScore: scorePlayerForPosition(p, pos) }))
        .sort((a, b) => b.posScore - a.posScore);
      const best = scored[0];
      usedIds.add(best.id);
      lineup[`${pos}_${indices[i]}`] = { ...best, suggestedPos: pos };
    }
  }
  return lineup;
}

function getPitchCoords(pos: string, idx: number, positionGroups: Record<string, number[]>): { x: number; y: number } {
  const groupIdx = positionGroups[pos]?.indexOf(idx) ?? 0;
  const groupSize = positionGroups[pos]?.length ?? 1;
  const xSlots = (n: number, i: number) => {
    if (n === 1) return 50;
    const step = 70 / (n + 1);
    return 15 + step * (i + 1);
  };
  switch (pos) {
    case "GK":  return { x: 50, y: 88 };
    case "RB":  return { x: 82, y: 72 };
    case "LB":  return { x: 18, y: 72 };
    case "CB":  return { x: xSlots(groupSize, groupIdx), y: 72 };
    case "CDM": return { x: xSlots(groupSize, groupIdx), y: 57 };
    case "CM":  return { x: xSlots(groupSize, groupIdx), y: 45 };
    case "CAM": return { x: xSlots(groupSize, groupIdx), y: 35 };
    case "RM":  return { x: 85, y: 45 };
    case "LM":  return { x: 15, y: 45 };
    case "RWB": return { x: 85, y: 55 };
    case "LWB": return { x: 15, y: 55 };
    case "RW":  return { x: 82, y: 22 };
    case "LW":  return { x: 18, y: 22 };
    case "ST":  return { x: xSlots(groupSize, groupIdx), y: 12 };
    case "CF":  return { x: 50, y: 12 };
    default:    return { x: 50, y: 50 };
  }
}

export default function AIFormationRecommendation() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [playerCount, setPlayerCount] = useState<"11" | "9" | "7">("11");
  const [selectedFormation, setSelectedFormation] = useState("4-3-3");
  const [lineup, setLineup] = useState<Record<string, any>>({});
  const [showAnalysis, setShowAnalysis] = useState(false);

  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: squadWithSkills, isLoading: loadingSquad } = trpc.skillScores.getSquadWithSkills.useQuery(
    { teamId: parseInt(selectedTeam) },
    { enabled: !!selectedTeam }
  );

  // Fetch active suspensions to exclude suspended players
  const { data: activeSuspensions = [] } = trpc.suspensions.getActiveSuspensions.useQuery(
    { teamId: parseInt(selectedTeam) },
    { enabled: !!selectedTeam }
  );
  const suspendedPlayerIds = new Set((activeSuspensions as any[]).map((s: any) => s.playerId));

  // Available squad = not suspended AND not injured
  const availableSquad = (squadWithSkills as any[] || []).filter((p: any) =>
    !suspendedPlayerIds.has(p.id) &&
    p.medicalStatus !== 'injured' && p.status !== 'injured'
  );
  const unavailablePlayers = (squadWithSkills as any[] || []).filter((p: any) =>
    suspendedPlayerIds.has(p.id) || p.medicalStatus === 'injured' || p.status === 'injured'
  );

  const formationList = playerCount === "11" ? FORMATIONS_11 : playerCount === "9" ? FORMATIONS_9 : FORMATIONS_7;
  const formation = formationList.find(f => f.value === selectedFormation) || formationList[0];

  const positionGroups = useMemo(() => {
    const groups: Record<string, number[]> = {};
    formation.positions.forEach((pos, idx) => {
      if (!groups[pos]) groups[pos] = [];
      groups[pos].push(idx);
    });
    return groups;
  }, [formation]);

  const handlePlayerCountChange = (count: "11" | "9" | "7") => {
    setPlayerCount(count);
    const newList = count === "11" ? FORMATIONS_11 : count === "9" ? FORMATIONS_9 : FORMATIONS_7;
    setSelectedFormation(newList[0].value);
    setLineup({});
    setShowAnalysis(false);
  };

  const handleSuggestLineup = () => {
    if (!squadWithSkills || (squadWithSkills as any[]).length === 0) {
      toast({ title: "No players found", description: "Select a team with players first.", variant: "destructive" });
      return;
    }
    if (availableSquad.length < parseInt(playerCount)) {
      toast({
        title: "Not enough available players",
        description: `Need ${playerCount} players. Only ${availableSquad.length} available (${unavailablePlayers.length} suspended/injured excluded).`,
        variant: "destructive"
      });
      return;
    }
    const newLineup = buildOptimalLineup(availableSquad, formation);
    setLineup(newLineup);
    setShowAnalysis(true);
    const suspendedCount = (activeSuspensions as any[]).length;
    toast({
      title: "Lineup Generated",
      description: `AI selected the best ${playerCount} for ${formation.value}. ${suspendedCount > 0 ? `${suspendedCount} suspended player(s) excluded.` : 'All players available.'}`
    });
  };

  const lineupPlayers = Object.values(lineup) as any[];
  const avgRating = lineupPlayers.length
    ? Math.round(lineupPlayers.reduce((s, p) => s + (p.skills?.overallRating ?? p.overallRating ?? 70), 0) / lineupPlayers.length)
    : 0;
  const injuredInLineup = lineupPlayers.filter(p => p.medicalStatus === "injured" || p.status === "injured");
  const hasSkillData = lineupPlayers.some(p => p.skills !== null);

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <PageBreadcrumb
                items={[
                  { label: "Tactical Hub", labelAr: "مركز التكتيك", href: "/advanced-tactical-hub" },
                  { label: "AI Formation Selector", labelAr: "مختار التشكيلة بالذكاء الاصطناعي" },
                ]}
                className="mb-1"
              />
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                AI Formation Best Player Selector
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                AI picks the optimal lineup from your squad based on assessed skill scores
              </p>
            </div>
          </div>
          {hasSkillData && (
            <Badge className="bg-green-100 text-green-800 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Skill Data Available
            </Badge>
          )}
        </div>

        {/* Player Count Tabs */}
        <Tabs value={playerCount} onValueChange={v => handlePlayerCountChange(v as "11" | "9" | "7")}>
          <TabsList className="grid w-full grid-cols-3 max-w-sm">
            <TabsTrigger value="11" className="flex items-center gap-1">
              <Users2 className="h-4 w-4" /> 11-a-side
            </TabsTrigger>
            <TabsTrigger value="9" className="flex items-center gap-1">
              <Users className="h-4 w-4" /> 9-a-side
            </TabsTrigger>
            <TabsTrigger value="7" className="flex items-center gap-1">
              <Users className="h-4 w-4" /> 7-a-side
            </TabsTrigger>
          </TabsList>

          {(["11","9","7"] as const).map(count => (
            <TabsContent key={count} value={count} className="mt-4">
              {/* Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Select Team</label>
                  <Select value={selectedTeam} onValueChange={v => { setSelectedTeam(v); setLineup({}); setShowAnalysis(false); }}>
                    <SelectTrigger><SelectValue placeholder="Choose a team..." /></SelectTrigger>
                    <SelectContent>
                      {(teams as any[])?.map((team: any) => (
                        <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Formation ({count} players)</label>
                  <Select value={selectedFormation} onValueChange={v => { setSelectedFormation(v); setLineup({}); setShowAnalysis(false); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {formationList.map(f => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleSuggestLineup}
                    disabled={!selectedTeam || loadingSquad}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    {loadingSquad ? "Loading..." : `Generate Best ${count} XI`}
                  </Button>
                </div>
              </div>

              {/* Squad info */}
              {selectedTeam && squadWithSkills && (
                <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2 mt-4">
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {(squadWithSkills as any[]).length} in squad</span>
                  <span className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-700 dark:text-yellow-500" /> {(squadWithSkills as any[]).filter((p:any) => p.skills).length} assessed</span>
                  <span className="flex items-center gap-1 text-purple-600"><Target className="h-4 w-4" /> Selecting best {count} for {formation.value}</span>
                  {injuredInLineup.length > 0 && (
                    <span className="flex items-center gap-1 text-red-600"><AlertTriangle className="h-4 w-4" /> {injuredInLineup.length} injured in lineup</span>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pitch */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-green-600" />
                {formation.value} — {playerCount}-a-side Pitch View
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-green-700 rounded-lg overflow-hidden" style={{ paddingBottom: '145%' }}>
                <div className="absolute inset-0 p-2">
                  <div className="absolute inset-x-4 top-4 bottom-4 border-2 border-white/25 rounded" />
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-2 border-white/25" />
                  <div className="absolute left-1/2 top-1/2 w-0.5 h-full bg-white/15 -translate-x-1/2" />
                  <div className="absolute left-1/2 -translate-x-1/2 top-4 w-20 h-8 border-2 border-white/20" />
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-4 w-20 h-8 border-2 border-white/20" />

                  {formation.positions.map((pos, idx) => {
                    const posKey = `${pos}_${idx}`;
                    const player = lineup[posKey];
                    const { x, y } = getPitchCoords(pos, idx, positionGroups);
                    const posScore = player ? scorePlayerForPosition(player, pos) : 0;
                    const isInjured = player?.medicalStatus === "injured" || player?.status === "injured";

                    return (
                      <div
                        key={posKey}
                        className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center"
                        style={{ left: `${x}%`, top: `${y}%` }}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 shadow-md
                          ${player
                            ? isInjured ? 'bg-red-500 border-red-200 text-white'
                              : posScore >= 80 ? 'bg-blue-600 border-yellow-300 text-white'
                              : 'bg-blue-600 border-white text-white'
                            : 'bg-white/20 border-white/40 text-foreground/60'
                          }`}
                        >
                          {player
                            ? `${player.firstName?.[0] ?? ''}${player.lastName?.[0] ?? ''}`.toUpperCase() || pos.slice(0,2)
                            : pos.slice(0, 2)
                          }
                        </div>
                        <div className="text-foreground text-xs mt-0.5 font-medium drop-shadow-md leading-tight">
                          {player ? (player.firstName ?? player.name?.split(' ')[0] ?? pos) : pos}
                        </div>
                        {player?.skills && (
                          <div className="text-yellow-700 dark:text-yellow-300 text-xs font-bold drop-shadow">{posScore}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">Score below initials = position suitability (0–100)</p>
            </CardContent>
          </Card>

          {/* Lineup List */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    Best {playerCount} Starting Lineup
                  </span>
                  {lineupPlayers.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Avg: <span className="font-bold ml-1">{avgRating}</span>
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(lineup).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="h-10 w-10 mx-auto mb-2 text-foreground" />
                    <p className="text-sm">Select a team and click "Generate Best {playerCount} XI"</p>
                    <p className="text-xs mt-1 text-muted-foreground">AI selects the top {playerCount} players and assigns them to optimal positions</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {formation.positions.map((pos, idx) => {
                      const posKey = `${pos}_${idx}`;
                      const player = lineup[posKey];
                      const posScore = player ? scorePlayerForPosition(player, pos) : 0;
                      const isInjured = player?.medicalStatus === "injured" || player?.status === "injured";
                      const hasSkills = player?.skills !== null && player?.skills !== undefined;

                      return (
                        <div key={posKey} className={`flex items-center justify-between p-2 rounded-lg border ${isInjured ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-transparent'}`}>
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-xs w-12 text-center justify-center shrink-0">{pos}</Badge>
                            <div>
                              <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                                {player
                                  ? `${player.firstName ?? ''} ${player.lastName ?? player.name ?? ''}`.trim()
                                  : <span className="text-muted-foreground italic">No player assigned</span>
                                }
                                {isInjured && <AlertTriangle className="h-3 w-3 text-red-500" />}
                              </p>
                              <p className="text-xs text-muted-foreground">{POSITION_GROUPS[pos] || pos}</p>
                            </div>
                          </div>
                          {player && (
                            <div className="flex items-center gap-2 shrink-0">
                              {hasSkills ? (
                                <div className="text-right">
                                  <div className="text-xs text-muted-foreground">Fit</div>
                                  <div className={`text-sm font-bold ${posScore >= 80 ? 'text-green-600' : posScore >= 65 ? 'text-blue-600' : 'text-orange-700 dark:text-orange-500'}`}>
                                    {posScore}
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Info className="h-3 w-3" />
                                  <span className="text-xs">No assessment</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 text-yellow-700 dark:text-yellow-500" />
                                <span className="text-sm font-bold text-gray-700">
                                  {player.skills?.overallRating ?? player.overallRating ?? "—"}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Full Squad Ratings */}
            {squadWithSkills && (squadWithSkills as any[]).length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Full Squad Ratings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 max-h-52 overflow-y-auto">
                    {(squadWithSkills as any[])
                      .sort((a: any, b: any) => (b.skills?.overallRating ?? 0) - (a.skills?.overallRating ?? 0))
                      .map((p: any, i: number) => (
                        <div key={p.id} className="flex items-center justify-between text-sm py-1 border-b last:border-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold w-5 ${i < parseInt(playerCount) ? 'text-purple-600' : 'text-muted-foreground'}`}>
                              {i + 1}
                            </span>
                            <span className="text-gray-800 font-medium">{p.firstName} {p.lastName}</span>
                            <Badge variant="outline" className="text-xs capitalize">{p.position || 'N/A'}</Badge>
                            {i < parseInt(playerCount) && (
                              <Badge className="text-xs bg-purple-100 text-purple-700 border-purple-200">Selected</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-700 dark:text-yellow-500" />
                            <span className="font-bold text-gray-700">{p.skills?.overallRating ?? p.overallRating ?? '—'}</span>
                          </div>
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Purple = selected in lineup. Top {playerCount} players chosen.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* AI Tactical Analysis */}
        {showAnalysis && lineupPlayers.length > 0 && (
          <Card className="border-purple-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2 text-purple-700">
                <Brain className="h-4 w-4" />
                AI Tactical Analysis — {formation.value} ({playerCount}-a-side)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-purple-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-700">{avgRating}</div>
                  <div className="text-xs text-purple-500 mt-1">Average Overall Rating</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">
                    {lineupPlayers.filter(p => p.skills && scorePlayerForPosition(p, p.suggestedPos) >= 75).length}
                  </div>
                  <div className="text-xs text-blue-500 mt-1">Ideal Position Fit (≥75)</div>
                </div>
                <div className={`rounded-lg p-3 text-center ${injuredInLineup.length > 0 ? 'bg-red-50' : 'bg-green-50'}`}>
                  <div className={`text-2xl font-bold ${injuredInLineup.length > 0 ? 'text-red-700' : 'text-green-700'}`}>
                    {injuredInLineup.length > 0 ? injuredInLineup.length : "✓"}
                  </div>
                  <div className={`text-xs mt-1 ${injuredInLineup.length > 0 ? 'text-red-500' : 'text-green-700 dark:text-green-500'}`}>
                    {injuredInLineup.length > 0 ? "Injured in Lineup" : "No Injury Concerns"}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Position Suitability
                </h4>
                {formation.positions.map((pos, idx) => {
                  const posKey = `${pos}_${idx}`;
                  const player = lineup[posKey];
                  if (!player) return null;
                  const score = scorePlayerForPosition(player, pos);
                  return (
                    <div key={posKey} className="flex items-center gap-3">
                      <Badge variant="outline" className="text-xs w-12 text-center justify-center shrink-0">{pos}</Badge>
                      <span className="text-sm text-gray-700 w-32 shrink-0">
                        {player.firstName} {player.lastName?.charAt(0)}.
                      </span>
                      <div className="flex-1">
                        <Progress value={score} className="h-2" />
                      </div>
                      <span className={`text-xs font-bold w-12 text-right ${score >= 80 ? 'text-green-600' : score >= 65 ? 'text-blue-600' : 'text-orange-700 dark:text-orange-500'}`}>
                        {score}/100
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 bg-purple-50 rounded-lg p-4 space-y-2 text-sm text-gray-700">
                <p className="font-semibold text-purple-800">Tactical Recommendations</p>
                <p>
                  <strong>Formation:</strong> {formation.label} selected for {playerCount}-a-side.
                  {avgRating >= 78
                    ? " Strong squad — press high and play possession-based football."
                    : " Focus on compact defending and quick transitions to exploit pace."}
                </p>
                <p>
                  <strong>Key Players:</strong>{" "}
                  {lineupPlayers
                    .sort((a, b) => (b.skills?.overallRating ?? 0) - (a.skills?.overallRating ?? 0))
                    .slice(0, 3)
                    .map(p => `${p.firstName} ${p.lastName} (${p.suggestedPos}, ${p.skills?.overallRating ?? '—'})`)
                    .join(", ")}
                </p>
                {injuredInLineup.length > 0 && (
                  <p className="text-red-700 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    <strong>Injury Alert:</strong>{" "}
                    {injuredInLineup.map(p => `${p.firstName} ${p.lastName}`).join(", ")} are currently injured.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
