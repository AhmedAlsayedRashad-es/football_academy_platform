import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft, Activity, HelpCircle,
  TrendingUp, TrendingDown, Minus, RefreshCw, BarChart3, Users, AlertTriangle
} from "lucide-react";
import {
  ResponsiveContainer, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip,
  ReferenceLine, ReferenceArea
} from 'recharts';

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

function RiskBadge({ ratio }: { ratio: number }) {
  if (ratio < 0.8) return <Badge className="bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-700/50 text-xs">Low Load</Badge>;
  if (ratio <= 1.3) return <Badge className="bg-green-900/40 text-green-700 dark:text-green-300 border-green-700/50 text-xs">✓ Optimal</Badge>;
  if (ratio <= 1.5) return <Badge className="bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-700/50 text-xs">Moderate Risk</Badge>;
  return <Badge className="bg-red-900/40 text-red-600 dark:text-red-300 border-red-700/50 text-xs">High Risk</Badge>;
}

function RiskFactorPanel({ ratio, rpe, totalMinutes }: { ratio: number; rpe?: number; totalMinutes?: number }) {
  const factors: { label: string; value: string; status: string; description: string; range: string }[] = [
    {
      label: "A:C Ratio",
      value: ratio.toFixed(2),
      status: ratio > 1.5 ? "critical" : ratio > 1.3 ? "warning" : ratio >= 0.8 ? "good" : "low",
      description: ratio > 1.5
        ? "CRITICAL — Acute load far exceeds chronic baseline. Very high injury risk. Reduce training volume immediately and consider a rest day."
        : ratio > 1.3
        ? "WARNING — Load is rising faster than the body can adapt. Avoid high-intensity sessions. Monitor for fatigue signs."
        : ratio >= 0.8
        ? "OPTIMAL — Player is in the ideal training zone. Fitness is building safely. Maintain current load."
        : "LOW — Player is underloaded relative to their baseline. Consider progressive overload to build match fitness.",
      range: "Safe: 0.8–1.3 | Warning: 1.3–1.5 | Critical: >1.5"
    },
    ...(rpe !== undefined ? [{
      label: "Session RPE (Effort)",
      value: `${rpe}/10`,
      status: rpe > 8 ? "critical" : rpe > 6 ? "warning" : "good",
      description: rpe > 8
        ? "Very high perceived effort. Risk of overtraining if repeated. Ensure 48h recovery before next intense session."
        : rpe > 6
        ? "Moderate-high effort. Appropriate for peak training blocks. Ensure adequate sleep and nutrition."
        : "Low-moderate effort. Good for recovery, technical, or tactical sessions.",
      range: "Easy: 1–4 | Moderate: 5–6 | Hard: 7–8 | Max: 9–10"
    }] : []),
    ...(totalMinutes !== undefined ? [{
      label: "Session Volume",
      value: `${totalMinutes} min`,
      status: totalMinutes > 120 ? "warning" : totalMinutes > 90 ? "good" : "low",
      description: totalMinutes > 120
        ? "Long session (>2h). Ensure adequate recovery time (24–48h) before next session. Monitor for fatigue."
        : totalMinutes > 90
        ? "Standard full session. Appropriate for match preparation and fitness building."
        : "Short session. Good for recovery days, activation, or focused technical work.",
      range: "Recovery: <60 min | Standard: 60–90 min | Long: >90 min"
    }] : [])
  ];
  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wide mb-2">Risk Factor Analysis</p>
      {factors.map(f => (
        <div key={f.label} className={`rounded-lg p-2.5 border text-xs ${
          f.status === 'critical' ? 'bg-red-900/20 border-red-700/40' :
          f.status === 'warning' ? 'bg-yellow-900/20 border-yellow-700/40' :
          f.status === 'low' ? 'bg-blue-900/20 border-blue-700/40' :
          'bg-green-900/20 border-green-700/40'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-muted-foreground">{f.label}</span>
            <span className={`font-bold ${
              f.status === 'critical' ? 'text-red-600 dark:text-red-400' :
              f.status === 'warning' ? 'text-yellow-700 dark:text-yellow-400' :
              f.status === 'low' ? 'text-blue-600 dark:text-blue-400' : 'text-green-700 dark:text-green-400'
            }`}>{f.value}</span>
          </div>
          <p className="text-muted-foreground leading-relaxed">{f.description}</p>
          <p className="text-muted-foreground mt-1 italic">{f.range}</p>
        </div>
      ))}
    </div>
  );
}

function TrendIcon({ value }: { value: number }) {
  if (value > 0.1) return <TrendingUp size={14} className="text-red-600 dark:text-red-400" />;
  if (value < -0.1) return <TrendingDown size={14} className="text-green-700 dark:text-green-400" />;
  return <Minus size={14} className="text-muted-foreground" />;
}

function getRatioColor(ratio: number | null) {
  if (ratio === null) return 'bg-muted/60 border-border/40 text-muted-foreground';
  if (ratio > 1.5) return 'bg-red-900/50 border-red-600/60 text-red-600 dark:text-red-300';
  if (ratio > 1.3) return 'bg-yellow-900/50 border-yellow-600/60 text-yellow-700 dark:text-yellow-300';
  if (ratio >= 0.8) return 'bg-green-900/50 border-green-600/60 text-green-700 dark:text-green-300';
  return 'bg-blue-900/50 border-blue-600/60 text-blue-600 dark:text-blue-300';
}

function getRatioLabel(ratio: number | null) {
  if (ratio === null) return 'No Data';
  if (ratio > 1.5) return 'High Risk';
  if (ratio > 1.3) return 'Moderate';
  if (ratio >= 0.8) return '✓ Optimal';
  return 'Low Load';
}

export default function LoadManagementDashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("player");
  const [showHighRiskWarning, setShowHighRiskWarning] = useState(false);
  const [pendingSave, setPendingSave] = useState<null | (() => void)>(null);
  const [newLoad, setNewLoad] = useState({
    acuteLoad: "", chronicLoad: "", sessionRPE: "", sessionDuration: "",
    date: new Date().toISOString().split("T")[0]
  });

  const { data: allTeams } = trpc.teams.getAll.useQuery();
  const { data: teamPlayers } = trpc.teams.getPlayers.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );
  const { data: loadData, refetch: refetchLoad, isLoading: loadLoading } = trpc.medical.getTrainingLoad.useQuery(
    { playerId: selectedPlayerId! },
    { enabled: !!selectedPlayerId }
  );
  const { data: teamLoadSummary, isLoading: teamLoadLoading, refetch: refetchTeamLoad } = trpc.medical.getTeamLoadSummary.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId && activeTab === 'overview' }
  );

  // Auto-load data from PlayerMaker device sessions
  const { data: autoLoadData, isLoading: autoLoadLoading } = trpc.deviceIntegration.getAutoLoadData.useQuery(
    { playerId: selectedPlayerId! },
    { enabled: !!selectedPlayerId }
  );

  const handleAutoFill = () => {
    if (!autoLoadData) return;
    setNewLoad(p => ({
      ...p,
      acuteLoad: autoLoadData.acuteLoad !== null ? String(autoLoadData.acuteLoad) : p.acuteLoad,
      chronicLoad: autoLoadData.chronicLoad !== null ? String(autoLoadData.chronicLoad) : p.chronicLoad,
      sessionRPE: autoLoadData.estimatedRPE !== null ? String(autoLoadData.estimatedRPE) : p.sessionRPE,
      sessionDuration: autoLoadData.sessionDuration !== null ? String(autoLoadData.sessionDuration) : p.sessionDuration,
    }));
    toast({ title: "Auto-filled from Smart Shoe", description: `Based on ${autoLoadData.sessionsLast7} sessions in last 7 days` });
  };

  const saveLoadMutation = trpc.medical.saveTrainingLoad.useMutation({
    onSuccess: () => {
      toast({ title: "Load data saved" });
      refetchLoad();
      setNewLoad({ acuteLoad: "", chronicLoad: "", sessionRPE: "", sessionDuration: "", date: new Date().toISOString().split("T")[0] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const doSaveLoad = (acute: number, chronic: number) => {
    if (!selectedPlayerId) return;
    const acRatio = chronic > 0 ? (acute / chronic).toFixed(2) : "0";
    const riskLevel = parseFloat(acRatio) > 1.5 ? "very_high" : parseFloat(acRatio) > 1.3 ? "high" : parseFloat(acRatio) > 0.8 ? "low" : "moderate";
    saveLoadMutation.mutate({
      playerId: selectedPlayerId,
      weekStart: newLoad.date,
      acuteLoad: acute,
      chronicLoad: chronic,
      acRatio,
      riskLevel,
      rpe: newLoad.sessionRPE ? parseFloat(newLoad.sessionRPE) : undefined,
      totalMinutes: newLoad.sessionDuration ? parseInt(newLoad.sessionDuration) : undefined,
    });
  };

  const handleSaveLoad = () => {
    if (!selectedPlayerId) return;
    const acute = parseFloat(newLoad.acuteLoad);
    const chronic = parseFloat(newLoad.chronicLoad);
    if (isNaN(acute) || isNaN(chronic)) {
      toast({ title: "Please enter valid load values", variant: "destructive" });
      return;
    }
    const ratio = chronic > 0 ? acute / chronic : 0;
    if (ratio > 1.5) {
      // Show warning popup before saving
      setPendingSave(() => () => doSaveLoad(acute, chronic));
      setShowHighRiskWarning(true);
      return;
    }
    doSaveLoad(acute, chronic);
  };

  const loadEntries = Array.isArray(loadData) ? loadData : [];
  const teamSummaryData = Array.isArray(teamLoadSummary) ? teamLoadSummary : [];

  // Team average comparison
  const teamAvgAcute = useMemo(() => {
    const valid = teamSummaryData.filter((p: any) => p.acuteLoad != null);
    return valid.length > 0 ? valid.reduce((s: number, p: any) => s + parseFloat(p.acuteLoad || 0), 0) / valid.length : null;
  }, [teamSummaryData]);
  const teamAvgChronic = useMemo(() => {
    const valid = teamSummaryData.filter((p: any) => p.chronicLoad != null);
    return valid.length > 0 ? valid.reduce((s: number, p: any) => s + parseFloat(p.chronicLoad || 0), 0) / valid.length : null;
  }, [teamSummaryData]);
  const teamAvgRatio = useMemo(() => {
    const valid = teamSummaryData.filter((p: any) => p.acRatio != null);
    return valid.length > 0 ? valid.reduce((s: number, p: any) => s + parseFloat(p.acRatio || 0), 0) / valid.length : null;
  }, [teamSummaryData]);

  // Team overview stats
  const highRiskCount = teamSummaryData.filter((p: any) => p.acRatio !== null && p.acRatio > 1.5).length;
  const moderateRiskCount = teamSummaryData.filter((p: any) => p.acRatio !== null && p.acRatio > 1.3 && p.acRatio <= 1.5).length;
  const optimalCount = teamSummaryData.filter((p: any) => p.acRatio !== null && p.acRatio >= 0.8 && p.acRatio <= 1.3).length;
  const noDataCount = teamSummaryData.filter((p: any) => p.acRatio === null).length;

  return (
    <>
    <div className="text-foreground">
      {/* ── High Risk ACWR Warning Dialog ── */}
      <AlertDialog open={showHighRiskWarning} onOpenChange={setShowHighRiskWarning}>
        <AlertDialogContent className="bg-card border border-red-700/60 text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              High Injury Risk Detected
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              The calculated A:C Ratio exceeds <span className="font-bold text-red-600 dark:text-red-400">1.5</span> — this is in the <span className="font-bold text-red-600 dark:text-red-400">danger zone</span> for injury risk.
              <br /><br />
              Saving this entry will flag the player as high risk. Consider reducing training load before the next session.
              <br /><br />
              <span className="text-yellow-700 dark:text-yellow-300 text-sm">Are you sure you want to save this load entry?</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted" onClick={() => { setShowHighRiskWarning(false); setPendingSave(null); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-700 hover:bg-red-600 text-white" onClick={() => { pendingSave?.(); setShowHighRiskWarning(false); setPendingSave(null); }}>Save Anyway</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/load-management")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Activity size={22} className="text-orange-700 dark:text-orange-500" />
              Load Management Dashboard
              <HelpIcon text="Monitor player training load using the Acute:Chronic Workload Ratio (A:C Ratio). A:C ratio between 0.8 and 1.3 is optimal. Above 1.5 indicates high injury risk." />
            </h1>
            <p className="text-muted-foreground text-sm">Monitor A:C workload ratio and injury risk for each player</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Team Selector */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6">
          <h3 className="font-bold text-foreground mb-3 text-sm">Select Team</h3>
          <Select value={selectedTeamId?.toString() || ""} onValueChange={v => { setSelectedTeamId(parseInt(v)); setSelectedPlayerId(null); }}>
            <SelectTrigger className="bg-muted border-border text-foreground max-w-xs">
              <SelectValue placeholder="Select team..." />
            </SelectTrigger>
            <SelectContent className="bg-muted border-border">
              {(() => {
                const mainTeams = (allTeams as any[] || []).filter((t: any) => t.teamType === 'main');
                const academyTeams = (allTeams as any[] || []).filter((t: any) => t.teamType !== 'main');
                return (
                  <>
                    {mainTeams.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-muted-foreground text-xs px-2 py-1">Main Team</SelectLabel>
                        {mainTeams.map((t: any) => (
                          <SelectItem key={t.id} value={t.id.toString()} className="text-foreground hover:bg-muted">{t.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {academyTeams.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-muted-foreground text-xs px-2 py-1">Academy Teams</SelectLabel>
                        {academyTeams.map((t: any) => (
                          <SelectItem key={t.id} value={t.id.toString()} className="text-foreground hover:bg-muted">{t.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </>
                );
              })()}
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card border border-border mb-6">
            <TabsTrigger value="player" className="data-[state=active]:bg-orange-700 data-[state=active]:text-white text-muted-foreground gap-2">
              <BarChart3 size={14} />
              Individual Load
            </TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-orange-700 data-[state=active]:text-white text-muted-foreground gap-2" disabled={!selectedTeamId}>
              <Users size={14} />
              Group Load
              {highRiskCount > 0 && selectedTeamId && (
                <span className="ml-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">{highRiskCount}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* ── Player Load Tab ── */}
          <TabsContent value="player">
            {/* Player selector */}
            <div className="bg-card rounded-xl border border-border p-4 mb-4">
              <h3 className="font-bold text-foreground mb-3 text-sm">Select Player</h3>
              <Select value={selectedPlayerId?.toString() || ""} onValueChange={v => setSelectedPlayerId(parseInt(v))} disabled={!selectedTeamId}>
                <SelectTrigger className="bg-muted border-border text-foreground max-w-xs">
                  <SelectValue placeholder={selectedTeamId ? "Select player..." : "Select a team first"} />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {Array.isArray(teamPlayers) && teamPlayers.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()} className="text-foreground hover:bg-muted">
                      {p.firstName} {p.lastName} {p.position ? `— ${p.position}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPlayerId ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="font-bold text-foreground mb-3 text-sm flex items-center gap-2">
                    <BarChart3 size={14} className="text-orange-700 dark:text-orange-400" />
                    Record Load
                    <HelpIcon text="Acute Load = average load over last 7 days. Chronic Load = average load over last 28 days. Session RPE = Rate of Perceived Exertion (1-10). Duration in minutes." />
                  </h3>

                  {/* Auto-fill from Smart Shoe banner */}
                  {autoLoadData && (autoLoadData.acuteLoad !== null || autoLoadData.chronicLoad !== null) && (
                    <div className="mb-3 rounded-lg bg-blue-900/20 border border-blue-700/40 p-2.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-300 flex items-center gap-1.5">
                          <Activity size={12} />
                          Smart Shoe Data Available
                        </span>
                        {autoLoadData.acwr !== null && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            autoLoadData.acwr > 1.5 ? 'bg-red-900/60 text-red-600 dark:text-red-300' :
                            autoLoadData.acwr > 1.3 ? 'bg-yellow-900/60 text-yellow-700 dark:text-yellow-300' :
                            autoLoadData.acwr >= 0.8 ? 'bg-green-900/60 text-green-700 dark:text-green-300' :
                            'bg-blue-900/60 text-blue-600 dark:text-blue-300'
                          }`}>ACWR {autoLoadData.acwr}</span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-2">
                        {autoLoadData.acuteLoad !== null && <span>Acute: <span className="text-foreground font-medium">{autoLoadData.acuteLoad}</span></span>}
                        {autoLoadData.chronicLoad !== null && <span>Chronic: <span className="text-foreground font-medium">{autoLoadData.chronicLoad}</span></span>}
                        {autoLoadData.estimatedRPE !== null && <span>Est. RPE: <span className="text-foreground font-medium">{autoLoadData.estimatedRPE}/10</span></span>}
                        {autoLoadData.sessionDuration !== null && <span>Duration: <span className="text-foreground font-medium">{autoLoadData.sessionDuration} min</span></span>}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{autoLoadData.sessionsLast7} sessions in last 7 days · Trend: <span className={autoLoadData.loadTrend === 'increasing' ? 'text-red-600 dark:text-red-400' : autoLoadData.loadTrend === 'decreasing' ? 'text-green-700 dark:text-green-400' : 'text-muted-foreground'}>{autoLoadData.loadTrend}</span></span>
                        <Button size="sm" onClick={handleAutoFill} disabled={autoLoadLoading} className="h-6 text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-0">
                          {autoLoadLoading ? '...' : 'Auto-fill'}
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Week Start Date</label>
                      <Input type="date" value={newLoad.date} onChange={e => setNewLoad(p => ({ ...p, date: e.target.value }))} className="bg-muted border-border text-foreground" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Acute Load (7-day avg)
                        <HelpIcon text="Average training load over the past 7 days (e.g., total RPE x duration)" />
                      </label>
                      <Input type="number" placeholder="e.g. 450" value={newLoad.acuteLoad} onChange={e => setNewLoad(p => ({ ...p, acuteLoad: e.target.value }))} className="bg-muted border-border text-foreground" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Chronic Load (28-day avg)
                        <HelpIcon text="Average training load over the past 28 days" />
                      </label>
                      <Input type="number" placeholder="e.g. 400" value={newLoad.chronicLoad} onChange={e => setNewLoad(p => ({ ...p, chronicLoad: e.target.value }))} className="bg-muted border-border text-foreground" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">
                        Session RPE (1-10)
                        <HelpIcon text="Rate of Perceived Exertion: how hard was the session? 1=very easy, 10=maximum effort" />
                      </label>
                      <Input type="number" min="1" max="10" placeholder="e.g. 7" value={newLoad.sessionRPE} onChange={e => setNewLoad(p => ({ ...p, sessionRPE: e.target.value }))} className="bg-muted border-border text-foreground" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground block mb-1">Session Duration (min)</label>
                      <Input type="number" placeholder="e.g. 90" value={newLoad.sessionDuration} onChange={e => setNewLoad(p => ({ ...p, sessionDuration: e.target.value }))} className="bg-muted border-border text-foreground" />
                    </div>
                    <Button onClick={handleSaveLoad} disabled={saveLoadMutation.isPending} className="w-full bg-orange-700 hover:bg-orange-600 text-white text-sm mt-1">
                      {saveLoadMutation.isPending ? "Saving..." : "Save Load Entry"}
                    </Button>
                  </div>
                </div>

                <div className="md:col-span-2 bg-card rounded-xl border border-border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <TrendingUp size={14} className="text-orange-700 dark:text-orange-400" />
                      Load History and A:C Ratio
                      <HelpIcon text="The Acute:Chronic Workload Ratio (ACWR) is the key injury risk indicator. Optimal zone: 0.8 to 1.3. Above 1.5 = high injury risk (the danger zone)." />
                    </h3>
                    <button onClick={() => refetchLoad()} className="text-muted-foreground hover:text-foreground">
                      <RefreshCw size={14} />
                    </button>
                  </div>

                  {loadLoading ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <RefreshCw size={24} className="mx-auto mb-2 animate-spin" />
                      <p className="text-sm">Loading data...</p>
                    </div>
                  ) : loadEntries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Activity size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No load data recorded yet</p>
                      <p className="text-xs mt-1">Use the form on the left to add the first load entry</p>
                    </div>
                  ) : (
                    <>
                    {loadEntries.length > 1 && (
                      <div className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2">A:C Ratio Trend</p>
                        <ResponsiveContainer width="100%" height={140}>
                          <LineChart data={[...loadEntries].reverse().map((e: any) => ({
                            date: new Date(e.sessionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                            ratio: parseFloat(e.acRatio) || 0,
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9ca3af' }} />
                            <YAxis domain={[0, 2]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                            <ReTooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', fontSize: 11 }} />
                            <ReferenceArea y1={0.8} y2={1.3} fill="#22c55e" fillOpacity={0.08} />
                            <ReferenceLine y={1.5} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
                            <ReferenceLine y={1.3} stroke="#f59e0b" strokeDasharray="4 4" strokeWidth={1} />
                            <ReferenceLine y={0.8} stroke="#3b82f6" strokeDasharray="4 4" strokeWidth={1} />
                            <Line type="monotone" dataKey="ratio" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} />
                          </LineChart>
                        </ResponsiveContainer>
                        <div className="flex gap-3 text-[10px] text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block"></span>0.8 low</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-400 inline-block"></span>0.8–1.3 optimal</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-400 inline-block"></span>1.3 caution</span>
                          <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block"></span>1.5 danger</span>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {loadEntries.length > 0 && (() => {
                        const latest = loadEntries[0] as any;
                        const ratio = parseFloat(latest.acRatio) || 0;
                        return (
                          <div className={`rounded-lg p-3 mb-3 border ${
                            ratio > 1.5 ? "bg-red-900/20 border-red-700/40" :
                            ratio > 1.3 ? "bg-yellow-900/20 border-yellow-700/40" :
                            ratio >= 0.8 ? "bg-green-900/20 border-green-700/40" :
                            "bg-blue-900/20 border-blue-700/40"
                          }`}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-muted-foreground">Current A:C Ratio</p>
                                <p className="text-2xl font-bold text-foreground">{ratio.toFixed(2)}</p>
                              </div>
                              <div className="text-right">
                                <RiskBadge ratio={ratio} />
                                <p className="text-xs text-muted-foreground mt-1">
                                  {ratio > 1.5 ? "Reduce training load immediately" :
                                   ratio > 1.3 ? "Monitor closely, approaching risk zone" :
                                   ratio >= 0.8 ? "Optimal training zone" :
                                   "Consider increasing training load"}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                              <div className="bg-black/20 rounded p-1.5">
                                <p className="text-xs text-muted-foreground">Acute</p>
                                <p className="text-sm font-bold text-foreground">{latest.acuteLoad ? parseFloat(latest.acuteLoad).toFixed(0) : 'N/A'}</p>
                              </div>
                              <div className="bg-black/20 rounded p-1.5">
                                <p className="text-xs text-muted-foreground">Chronic</p>
                                <p className="text-sm font-bold text-foreground">{latest.chronicLoad ? parseFloat(latest.chronicLoad).toFixed(0) : 'N/A'}</p>
                              </div>
                              <div className="bg-black/20 rounded p-1.5">
                                <p className="text-xs text-muted-foreground">RPE</p>
                                <p className="text-sm font-bold text-foreground">{latest.rpe ? parseFloat(latest.rpe).toFixed(1) : "N/A"}</p>
                              </div>
                            </div>
                            <RiskFactorPanel
                              ratio={ratio}
                              rpe={latest.rpe ? parseFloat(latest.rpe) : undefined}
                              totalMinutes={latest.totalMinutes ? parseInt(latest.totalMinutes) : undefined}
                            />
                          </div>
                        );
                      })()}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground border-b border-border">
                              <th className="text-left py-2 pr-3">Date</th>
                              <th className="text-right py-2 pr-3">Acute</th>
                              <th className="text-right py-2 pr-3">Chronic</th>
                              <th className="text-right py-2 pr-3">A:C Ratio</th>
                              <th className="text-right py-2 pr-3">RPE</th>
                              <th className="text-right py-2">Risk</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loadEntries.map((entry: any, i: number) => {
                              const ratio = parseFloat(entry.acRatio) || 0;
                              const prevRatio = i < loadEntries.length - 1 ? parseFloat((loadEntries[i + 1] as any).acRatio) || 0 : ratio;
                              return (
                                <tr key={entry.id} className="border-b border-border/50 hover:bg-muted/30">
                                  <td className="py-2 pr-3 text-muted-foreground">{new Date(entry.weekStart).toLocaleDateString()}</td>
                                  <td className="py-2 pr-3 text-right text-foreground">{parseFloat(entry.acuteLoad).toFixed(0)}</td>
                                  <td className="py-2 pr-3 text-right text-foreground">{parseFloat(entry.chronicLoad).toFixed(0)}</td>
                                  <td className="py-2 pr-3 text-right">
                                    <span className="flex items-center justify-end gap-1">
                                      <TrendIcon value={ratio - prevRatio} />
                                      <span className={`font-bold ${ratio > 1.5 ? "text-red-600 dark:text-red-400" : ratio > 1.3 ? "text-yellow-700 dark:text-yellow-400" : ratio >= 0.8 ? "text-green-700 dark:text-green-400" : "text-blue-600 dark:text-blue-400"}`}>
                                        {ratio.toFixed(2)}
                                      </span>
                                    </span>
                                  </td>
                                  <td className="py-2 pr-3 text-right text-muted-foreground">{entry.rpe ? parseFloat(entry.rpe).toFixed(1) : "N/A"}</td>
                                  <td className="py-2 text-right"><RiskBadge ratio={ratio} /></td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <Activity size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-lg">Select a team and player to view load data</p>
                <p className="text-sm mt-2">Track Acute:Chronic Workload Ratio to prevent injuries and optimize performance</p>
                <div className="mt-6 grid grid-cols-3 gap-4 max-w-lg mx-auto text-xs">
                  <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3">
                    <p className="text-blue-600 dark:text-blue-300 font-bold">A:C below 0.8</p>
                    <p className="text-muted-foreground mt-1">Under-training, consider increasing load</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
                    <p className="text-green-700 dark:text-green-300 font-bold">A:C 0.8 to 1.3</p>
                    <p className="text-muted-foreground mt-1">Optimal zone, low injury risk</p>
                  </div>
                  <div className="bg-red-900/20 border border-red-700/30 rounded-lg p-3">
                    <p className="text-red-600 dark:text-red-300 font-bold">A:C above 1.5</p>
                    <p className="text-muted-foreground mt-1">Danger zone, high injury risk</p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* ── Team Overview Tab ── */}
          <TabsContent value="overview">
            {!selectedTeamId ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-lg">Select a team to view the team overview</p>
              </div>
            ) : teamLoadLoading ? (
              <div className="text-center py-16 text-muted-foreground">
                <RefreshCw size={32} className="mx-auto mb-3 animate-spin opacity-50" />
                <p>Loading team load data...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Summary bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 text-center">
                    <AlertTriangle size={20} className="mx-auto mb-1 text-red-600 dark:text-red-400" />
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{highRiskCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">High Risk (A:C &gt;1.5)</p>
                  </div>
                  <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-xl p-4 text-center">
                    <Activity size={20} className="mx-auto mb-1 text-yellow-700 dark:text-yellow-400" />
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{moderateRiskCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Moderate Risk (1.3–1.5)</p>
                  </div>
                  <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4 text-center">
                    <TrendingUp size={20} className="mx-auto mb-1 text-green-700 dark:text-green-400" />
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">{optimalCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">Optimal Zone (0.8–1.3)</p>
                  </div>
                  <div className="bg-muted/40 border border-border/30 rounded-xl p-4 text-center">
                    <Minus size={20} className="mx-auto mb-1 text-muted-foreground" />
                    <p className="text-2xl font-bold text-muted-foreground">{noDataCount}</p>
                    <p className="text-xs text-muted-foreground mt-1">No Data Recorded</p>
                  </div>
                </div>

                {/* Color-coded player grid */}
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Users size={14} className="text-orange-700 dark:text-orange-400" />
                      Squad A:C Ratio Overview
                      <HelpIcon text="Each card shows the player's latest A:C ratio. Color indicates risk level: Green = Optimal, Yellow = Moderate Risk, Red = High Risk, Blue = Low Load, Gray = No data." />
                    </h3>
                    <button onClick={() => refetchTeamLoad()} className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs">
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>

                  {teamSummaryData.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <Users size={32} className="mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No players found in this team</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {teamSummaryData.map((player: any) => (
                        <div
                          key={player.playerId}
                          className={`rounded-xl border p-3 cursor-pointer transition-all hover:scale-105 ${getRatioColor(player.acRatio)}`}
                          onClick={() => { setSelectedPlayerId(player.playerId); setActiveTab('player'); }}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center text-xs font-bold">
                              {player.playerName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-xs opacity-70 capitalize">{player.position}</span>
                          </div>
                          <p className="text-xs font-semibold leading-tight mb-1 truncate">{player.playerName}</p>
                          <p className={`text-xl font-bold ${player.acRatio === null ? 'text-muted-foreground' : player.acRatio > 1.5 ? 'text-red-600 dark:text-red-300' : player.acRatio > 1.3 ? 'text-yellow-700 dark:text-yellow-300' : player.acRatio >= 0.8 ? 'text-green-700 dark:text-green-300' : 'text-blue-600 dark:text-blue-300'}`}>
                            {player.acRatio !== null ? player.acRatio.toFixed(2) : '—'}
                          </p>
                          <p className="text-xs opacity-70 mt-0.5">{getRatioLabel(player.acRatio)}</p>
                          {player.weekStart && (
                            <p className="text-xs opacity-50 mt-1">{new Date(player.weekStart).toLocaleDateString()}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-600/60 inline-block" /> High Risk (A:C &gt; 1.5)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-600/60 inline-block" /> Moderate Risk (1.3 – 1.5)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-600/60 inline-block" /> Optimal (0.8 – 1.3)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-600/60 inline-block" /> Low Load (&lt; 0.8)</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-muted inline-block" /> No Data</span>
                  <span className="ml-2 italic text-muted-foreground">Click any player card to view their full load history</span>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}
