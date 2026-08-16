import { PageSkeleton, EmptyState } from "@/components/PageSkeleton";
import { useAuth } from "@/_core/hooks/useAuth";
import { useParentChild } from "@/contexts/ParentChildContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Plus, Activity, Zap, Target, TrendingUp, Footprints, Timer, ArrowLeft} from 'lucide-react';
import { toast } from "sonner";
import { useLocation, useSearch } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';


function MetricCard({ 
  label, 
  value, 
  unit, 
  icon: Icon, 
  trend,
  color = "primary" 
}: { 
  label: string; 
  value: number | string; 
  unit?: string;
  icon: React.ElementType;
  trend?: number;
  color?: string;
}) {
  return (
    <div className="p-4 rounded-xl bg-muted/50 border border-border">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`h-5 w-5 text-${color}`} />
        {trend !== undefined && (
          <span className={`text-xs ${trend >= 0 ? 'text-primary' : 'text-destructive'}`}>
            {trend >= 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function RecordPerformanceDialog() {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [formData, setFormData] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    sessionType: 'training' as const,
    touches: '',
    passes: '',
    passAccuracy: '',
    shots: '',
    shotsOnTarget: '',
    dribbles: '',
    successfulDribbles: '',
    distanceCovered: '',
    topSpeed: '',
    sprints: '',
    technicalScore: '',
    physicalScore: '',
    tacticalScore: '',
    overallScore: '',
    notes: '',
  });

  const [dialogTeamType, setDialogTeamType] = useState<'all' | 'main' | 'academy'>('all');
  const [dialogTeamId, setDialogTeamId] = useState<number>(0);
  const [playerSearch, setPlayerSearch] = useState('');
  const { data: allPlayers, isLoading: playersLoading } = trpc.players.getAll.useQuery();
  const { data: allTeams } = trpc.teams.getAll.useQuery();
  const mainTeams = (allTeams as any[] || []).filter((t: any) => t.teamType === 'main');
  const academyTeams = (allTeams as any[] || []).filter((t: any) => t.teamType === 'academy');
  const players = (allPlayers as any[] || []).filter((p: any) => {
    const typeMatch = dialogTeamType === 'all' || (allTeams as any[] || []).some((t: any) => t.id === p.teamId && t.teamType === dialogTeamType);
    const teamMatch = dialogTeamId === 0 || p.teamId === dialogTeamId;
    const searchMatch = !playerSearch || `${p.firstName} ${p.lastName}`.toLowerCase().includes(playerSearch.toLowerCase()) || (p.jerseyNumber?.toString() || '').includes(playerSearch);
    return typeMatch && teamMatch && searchMatch;
  });
  const utils = trpc.useUtils();
  
  const createMetric = trpc.performance.create.useMutation({
    onSuccess: () => {
      toast.success('Performance recorded successfully');
      setOpen(false);
      utils.performance.getPlayerMetrics.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record performance');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) {
      toast.error('Please select a player');
      return;
    }
    createMetric.mutate({
      playerId: parseInt(selectedPlayer),
      ...formData,
      touches: formData.touches ? parseInt(formData.touches) : undefined,
      passes: formData.passes ? parseInt(formData.passes) : undefined,
      passAccuracy: formData.passAccuracy ? parseInt(formData.passAccuracy) : undefined,
      shots: formData.shots ? parseInt(formData.shots) : undefined,
      shotsOnTarget: formData.shotsOnTarget ? parseInt(formData.shotsOnTarget) : undefined,
      dribbles: formData.dribbles ? parseInt(formData.dribbles) : undefined,
      successfulDribbles: formData.successfulDribbles ? parseInt(formData.successfulDribbles) : undefined,
      distanceCovered: formData.distanceCovered ? parseFloat(formData.distanceCovered) : undefined,
      topSpeed: formData.topSpeed ? parseFloat(formData.topSpeed) : undefined,
      sprints: formData.sprints ? parseInt(formData.sprints) : undefined,
      technicalScore: formData.technicalScore ? parseInt(formData.technicalScore) : undefined,
      physicalScore: formData.physicalScore ? parseInt(formData.physicalScore) : undefined,
      tacticalScore: formData.tacticalScore ? parseInt(formData.tacticalScore) : undefined,
      overallScore: formData.overallScore ? parseInt(formData.overallScore) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Record Performance
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Performance Metrics</DialogTitle>
          <DialogDescription>
            Enter performance data from training or match sessions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Player</Label>
                <div className="space-y-1">
                  <div className="flex gap-1 mb-1">
                    {(['all', 'main', 'academy'] as const).map(t => (
                      <button key={t} type="button"
                        onClick={() => { setDialogTeamType(t); setDialogTeamId(0); setSelectedPlayer(''); }}
                        className={"text-xs px-2 py-0.5 rounded " + (dialogTeamType === t ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                        {t === 'all' ? 'All' : t === 'main' ? 'Main' : 'Academy'}
                      </button>
                    ))}
                  </div>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground dark:bg-gray-800 dark:text-white"
                    value={dialogTeamId}
                    onChange={e => { setDialogTeamId(Number(e.target.value)); setSelectedPlayer(''); }}
                    style={{ position: 'relative', zIndex: 10 }}
                  >
                    <option value={0}>All Teams</option>
                    {(dialogTeamType === 'all' || dialogTeamType === 'main') && mainTeams.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                    {(dialogTeamType === 'all' || dialogTeamType === 'academy') && academyTeams.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {/* Search bar for player filtering */}
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by name or #..."
                      value={playerSearch}
                      onChange={e => { setPlayerSearch(e.target.value); setSelectedPlayer(''); }}
                      className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground dark:bg-gray-800 dark:text-white pl-7"
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">🔍</span>
                    {playerSearch && (
                      <button type="button" onClick={() => setPlayerSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">×</button>
                    )}
                  </div>
                  <select
                    className="w-full border rounded px-2 py-1.5 text-sm bg-background text-foreground dark:bg-gray-800 dark:text-white"
                    value={selectedPlayer}
                    onChange={e => setSelectedPlayer(e.target.value)}
                    style={{ position: 'relative', zIndex: 10 }}
                    size={players.length > 0 && players.length <= 8 ? players.length + 1 : 6}
                  >
                    <option value="">{playersLoading ? "Loading..." : players.length === 0 ? (playerSearch ? `No results for "${playerSearch}"` : 'No players found') : `${players.length} player${players.length !== 1 ? 's' : ''} — select one`}</option>
                    {players.map((player: any) => (
                      <option key={player.id} value={player.id.toString()}>
                        {player.jerseyNumber ? `#${player.jerseyNumber} ` : ''}{player.firstName} {player.lastName} {player.position ? `(${player.position})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Session Type</Label>
                <Select
                  value={formData.sessionType}
                  onValueChange={(value: any) => setFormData({ ...formData, sessionType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="match">Match</SelectItem>
                    <SelectItem value="assessment">Assessment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Session Date</Label>
              <Input
                type="date"
                value={formData.sessionDate}
                onChange={(e) => setFormData({ ...formData, sessionDate: e.target.value })}
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Technical Metrics</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Touches</Label>
                  <Input
                    type="number"
                    value={formData.touches}
                    onChange={(e) => setFormData({ ...formData, touches: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Passes</Label>
                  <Input
                    type="number"
                    value={formData.passes}
                    onChange={(e) => setFormData({ ...formData, passes: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Pass Accuracy %</Label>
                  <Input
                    type="number"
                    value={formData.passAccuracy}
                    onChange={(e) => setFormData({ ...formData, passAccuracy: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Shots</Label>
                  <Input
                    type="number"
                    value={formData.shots}
                    onChange={(e) => setFormData({ ...formData, shots: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Shots on Target</Label>
                  <Input
                    type="number"
                    value={formData.shotsOnTarget}
                    onChange={(e) => setFormData({ ...formData, shotsOnTarget: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Dribbles</Label>
                  <Input
                    type="number"
                    value={formData.dribbles}
                    onChange={(e) => setFormData({ ...formData, dribbles: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Physical Metrics</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Distance (km)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.distanceCovered}
                    onChange={(e) => setFormData({ ...formData, distanceCovered: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Top Speed (km/h)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.topSpeed}
                    onChange={(e) => setFormData({ ...formData, topSpeed: e.target.value })}
                    placeholder="0.0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Sprints</Label>
                  <Input
                    type="number"
                    value={formData.sprints}
                    onChange={(e) => setFormData({ ...formData, sprints: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Overall Scores (0-100)</h4>
              <div className="grid grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Technical</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.technicalScore}
                    onChange={(e) => setFormData({ ...formData, technicalScore: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Physical</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.physicalScore}
                    onChange={(e) => setFormData({ ...formData, physicalScore: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tactical</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.tacticalScore}
                    onChange={(e) => setFormData({ ...formData, tacticalScore: e.target.value })}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Overall</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.overallScore}
                    onChange={(e) => setFormData({ ...formData, overallScore: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional observations..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMetric.isPending}>
              {createMetric.isPending ? 'Saving...' : 'Save Performance'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Performance() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { selectedChildId } = useParentChild();
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [comparePlayer, setComparePlayer] = useState<string>('');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  
   // Get team type from URL query parameter (e.g., ?team=main or ?team=academy)
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const teamType = params.get('team') as 'main' | 'academy' | null;

  // Fetch only teams of the given type for the team filter
  const { data: teamsOfType } = trpc.teams.getByType.useQuery(
    { teamType: teamType! },
    { enabled: !!teamType }
  );
  // Fallback: fetch all teams only when no teamType is in URL
  const { data: allTeamsData } = trpc.teams.getAll.useQuery(
    undefined,
    { enabled: !teamType }
  );
  // Deduplicate teams by id to prevent duplicate tabs (e.g. U17 Falcons appearing twice)
  const allTeams = (() => {
    const raw = teamType ? teamsOfType : allTeamsData;
    if (!raw) return raw;
    const seen = new Set<number>();
    return raw.filter((t: any) => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
  })();

  // Fetch players for selected team or all players
  const { data: teamPlayers } = trpc.teams.getPlayers.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );
  // Fetch players by team type when teamType is set but no specific team selected
  const { data: teamTypePlayers } = trpc.players.getByTeamType.useQuery(
    { teamType: teamType! },
    { enabled: !!teamType && !selectedTeamId }
  );
  // For parents, get their linked children; for staff, get all players
  const { data: allPlayers, isLoading: playersLoading } = user?.role === 'parent' 
    ? trpc.parentRelations.getLinkedPlayers.useQuery()
    : trpc.players.getAll.useQuery(undefined, { enabled: !teamType });
  const players = selectedTeamId ? teamPlayers : (teamType ? teamTypePlayers : allPlayers);
  const { isLoading: metricsLoading } = trpc.performance.getPlayerMetrics.useQuery(
    { playerId: parseInt(selectedPlayer), limit: 1 },
    { enabled: !!selectedPlayer }
  );
  
  // Auto-select child for parents
  useEffect(() => {
    if (user?.role === 'parent' && selectedChildId && !selectedPlayer) {
      setSelectedPlayer(selectedChildId);
    }
  }, [user, selectedChildId, selectedPlayer]);
  
  const { data: metrics } = trpc.performance.getPlayerMetrics.useQuery(
    { playerId: parseInt(selectedPlayer), limit: 10 },
    { enabled: !!selectedPlayer }
  );

  const { data: compareMetrics } = trpc.performance.getPlayerMetrics.useQuery(
    { playerId: parseInt(comparePlayer), limit: 10 },
    { enabled: !!comparePlayer && comparePlayer !== selectedPlayer }
  );

  const latestMetric = metrics?.[0];
  const latestCompareMetric = compareMetrics?.[0];
  if (playersLoading) return <><PageSkeleton cards={4} rows={5} /></>;
  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            
            <button onClick={() => teamType ? navigate(`/team-dashboard?team=${teamType}`) : navigate("/dashboard")} className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">

              <ArrowLeft className="w-5 h-5" />

            </button>
<h1 className="text-2xl font-bold tracking-tight">
              {teamType === 'main'
                ? (language === 'ar' ? 'الفريق الأول — تتبع الأداء' : 'Main Team — Performance Tracking')
                : teamType === 'academy'
                ? (language === 'ar' ? 'فريق الأكاديمية — تتبع الأداء' : 'Academy Team — Performance Tracking')
                : (language === 'ar' ? 'تتبع الأداء' : 'Performance Tracking')}
            </h1>
            <p className="text-muted-foreground">
              {teamType === 'main'
                ? (language === 'ar' ? 'راقب وحلل مؤشرات أداء لاعبي الفريق الأول — السرعة، التحمل، التسديد، التمرير، والمزيد' : 'Monitor and analyze main team player performance metrics')
                : teamType === 'academy'
                ? (language === 'ar' ? 'راقب وحلل مؤشرات أداء لاعبي الأكاديمية — تتبع التطور والتقدم لكل لاعب' : 'Monitor and analyze academy player performance metrics')
                : (language === 'ar' ? 'راقب وحلل مؤشرات أداء اللاعبين' : 'Monitor and analyze player performance metrics')}
            </p>
            {language === 'ar' && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200 text-right">
                <span className="font-semibold">دليل الاستخدام: </span>
                اختر الفريق ثم اللاعب لعرض بياناته. اضغط "تسجيل الأداء" لإضافة جلسة جديدة. تظهر الرسوم البيانية مقارنة الأداء عبر الزمن.
              </div>
            )}
          </div>
          <RecordPerformanceDialog />
        </div>

        {/* Team + Player Selection */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {user?.role !== 'parent' && allTeams && allTeams.length > 0 && (
              <div className="space-y-3">
                {/* Step 1: Team Type (only when no teamType in URL) */}
                {!teamType && (
                  <div>
                    <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                      ① Team Type
                    </Label>
                    <div className="flex gap-2 flex-wrap">
                      {[{v:'',en:'All',ar:'الكل'},{v:'main',en:'Main Team',ar:'الفريق الأول'},{v:'academy',en:'Academy',ar:'الأكاديمية'}].map((opt: any) => (
                        <button key={opt.v}
                          onClick={() => { setSelectedTeamId(null); setSelectedPlayer(''); navigate(`/performance${opt.v ? `?team=${opt.v}` : ''}`); }}
                          className="px-3 py-1 rounded-full text-xs font-medium transition-colors bg-muted hover:bg-muted/80">
                          {opt.en}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Step 2: Sub-team filter */}
                <div>
                  <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                    {teamType ? '①' : '②'} {teamType === 'main' ? 'Main Team — Filter:' : teamType === 'academy' ? 'Academy — Filter:' : 'Filter by Team:'}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setSelectedTeamId(null); setSelectedPlayer(''); }}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        !selectedTeamId ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {teamType ? 'All' : 'All Teams'}
                    </button>
                    {allTeams.map((team: any) => (
                      <button
                        key={team.id}
                        onClick={() => { setSelectedTeamId(team.id); setSelectedPlayer(''); }}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          selectedTeamId === team.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {team.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <Label className="whitespace-nowrap">Player 1:</Label>
                <Select value={selectedPlayer} onValueChange={(v) => { setSelectedPlayer(v); if (v === comparePlayer) setComparePlayer(''); }}>
                  <SelectTrigger className="max-w-xs">
                    <SelectValue placeholder="Choose a player to view" />
                  </SelectTrigger>
                  <SelectContent>
                    {players?.map((player: any) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPlayer && (
                <div className="flex items-center gap-3">
                  <Label className="whitespace-nowrap text-muted-foreground">Compare with:</Label>
                  <Select value={comparePlayer || 'none'} onValueChange={(v) => setComparePlayer(v === 'none' ? '' : v)}>
                    <SelectTrigger className="max-w-xs">
                      <SelectValue placeholder="Select player to compare" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {players?.filter((p: any) => p.id.toString() !== selectedPlayer).map((player: any) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.firstName} {player.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {comparePlayer && (
                    <button onClick={() => setComparePlayer('')} className="text-xs text-muted-foreground hover:text-foreground underline">Clear</button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedPlayer && latestMetric ? (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="technical">Technical</TabsTrigger>
              <TabsTrigger value="physical">Physical</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Score Cards */}
              <div className="grid gap-4 md:grid-cols-4">
                <Card className="stat-glow">
                  <CardContent className="p-6 text-center">
                    <div className="text-5xl font-bold text-primary mb-2">
                      {latestMetric.overallScore || '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-chart-1 mb-2">
                      {latestMetric.technicalScore || '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Technical</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-chart-2 mb-2">
                      {latestMetric.physicalScore || '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Physical</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl font-bold text-chart-3 mb-2">
                      {latestMetric.tacticalScore || '--'}
                    </div>
                    <div className="text-sm text-muted-foreground">Tactical</div>
                  </CardContent>
                </Card>
              </div>

              {/* Radar Chart: Player vs Team Average vs Compare Player */}
              {metrics && metrics.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Performance Radar</CardTitle>
                    <CardDescription>{comparePlayer && latestCompareMetric ? 'Head-to-head comparison between two players' : 'Player scores vs session average across all dimensions'}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4 items-center">
                      <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={[
                          { subject: 'Technical', player: latestMetric.technicalScore || 0, avg: Math.round((metrics.reduce((s: number, m: any) => s + (m.technicalScore || 0), 0) / metrics.length)), compare: latestCompareMetric?.technicalScore || 0 },
                          { subject: 'Physical', player: latestMetric.physicalScore || 0, avg: Math.round((metrics.reduce((s: number, m: any) => s + (m.physicalScore || 0), 0) / metrics.length)), compare: latestCompareMetric?.physicalScore || 0 },
                          { subject: 'Tactical', player: latestMetric.tacticalScore || 0, avg: Math.round((metrics.reduce((s: number, m: any) => s + (m.tacticalScore || 0), 0) / metrics.length)), compare: latestCompareMetric?.tacticalScore || 0 },
                          { subject: 'Passing', player: latestMetric.passAccuracy || 0, avg: Math.round((metrics.reduce((s: number, m: any) => s + (m.passAccuracy || 0), 0) / metrics.length)), compare: latestCompareMetric?.passAccuracy || 0 },
                          { subject: 'Sprints', player: Math.min(100, (latestMetric.sprints || 0) * 2.5), avg: Math.min(100, Math.round((metrics.reduce((s: number, m: any) => s + (m.sprints || 0), 0) / metrics.length) * 2.5)), compare: Math.min(100, (latestCompareMetric?.sprints || 0) * 2.5) },
                          { subject: 'Overall', player: latestMetric.overallScore || 0, avg: Math.round((metrics.reduce((s: number, m: any) => s + (m.overallScore || 0), 0) / metrics.length)), compare: latestCompareMetric?.overallScore || 0 },
                        ]}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9 }} />
                          <Radar name="Player 1" dataKey="player" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
                          {comparePlayer && latestCompareMetric ? (
                            <Radar name="Player 2" dataKey="compare" stroke="#f97316" fill="#f97316" fillOpacity={0.2} strokeWidth={2} />
                          ) : (
                            <Radar name="Session Avg" dataKey="avg" stroke="#64748b" fill="#64748b" fillOpacity={0.15} strokeWidth={1.5} strokeDasharray="4 4" />
                          )}
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                      <div className="space-y-3">
                        {[
                          { label: 'Technical', value: latestMetric.technicalScore || 0, compare: latestCompareMetric?.technicalScore || 0, avg: Math.round(metrics.reduce((s: number, m: any) => s + (m.technicalScore || 0), 0) / metrics.length), color: 'hsl(var(--chart-1))' },
                          { label: 'Physical', value: latestMetric.physicalScore || 0, compare: latestCompareMetric?.physicalScore || 0, avg: Math.round(metrics.reduce((s: number, m: any) => s + (m.physicalScore || 0), 0) / metrics.length), color: 'hsl(var(--chart-2))' },
                          { label: 'Tactical', value: latestMetric.tacticalScore || 0, compare: latestCompareMetric?.tacticalScore || 0, avg: Math.round(metrics.reduce((s: number, m: any) => s + (m.tacticalScore || 0), 0) / metrics.length), color: 'hsl(var(--chart-3))' },
                          { label: 'Overall', value: latestMetric.overallScore || 0, compare: latestCompareMetric?.overallScore || 0, avg: Math.round(metrics.reduce((s: number, m: any) => s + (m.overallScore || 0), 0) / metrics.length), color: 'hsl(var(--primary))' },
                        ].map(({ label, value, compare, avg, color }) => (
                          <div key={label}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">{label}</span>
                              <span className="flex items-center gap-2">
                                <span className="font-bold" style={{ color }}>{value}</span>
                                {comparePlayer && latestCompareMetric ? (
                                  <span className="font-bold text-orange-700 dark:text-orange-500">vs {compare}</span>
                                ) : (
                                  <span className="text-muted-foreground text-xs">/ avg {avg}</span>
                                )}
                              </span>
                            </div>
                            <div className="relative w-full bg-muted rounded-full h-2.5">
                              <div className="h-2.5 rounded-full" style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }} />
                              {comparePlayer && latestCompareMetric ? (
                                <div className="absolute top-0 h-2.5 w-1 rounded-full bg-orange-500 opacity-80" style={{ left: `${Math.max(0, Math.min(100, compare) - 0.5)}%` }} />
                              ) : (
                                <div className="absolute top-0 h-2.5 w-0.5 bg-gray-400" style={{ left: `${Math.min(100, avg)}%` }} />
                              )}
                            </div>
                          </div>
                        ))}
                        <p className="text-xs text-muted-foreground mt-2">
                          {comparePlayer && latestCompareMetric ? 'Blue = Player 1 · 🟠 Orange = Player 2' : 'Gray line = session average'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Latest Session Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Latest Session</CardTitle>
                  <CardDescription>
                    {latestMetric.sessionType} on {new Date(latestMetric.sessionDate).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <MetricCard
                      label="Touches"
                      value={latestMetric.touches || 0}
                      icon={Footprints}
                      color="primary"
                    />
                    <MetricCard
                      label="Passes"
                      value={latestMetric.passes || 0}
                      icon={Activity}
                      color="chart-2"
                    />
                    <MetricCard
                      label="Pass Accuracy"
                      value={latestMetric.passAccuracy || 0}
                      unit="%"
                      icon={Target}
                      color="chart-3"
                    />
                    <MetricCard
                      label="Distance"
                      value={latestMetric.distanceCovered || 0}
                      unit="km"
                      icon={TrendingUp}
                      color="chart-4"
                    />
                    <MetricCard
                      label="Top Speed"
                      value={latestMetric.topSpeed || 0}
                      unit="km/h"
                      icon={Zap}
                      color="accent"
                    />
                    <MetricCard
                      label="Sprints"
                      value={latestMetric.sprints || 0}
                      icon={Timer}
                      color="primary"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="technical" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Ball Control &amp; Passing</CardTitle>
                    <CardDescription>Touches, dribbles, and pass accuracy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={[
                        { name: 'Touches', value: latestMetric.touches || 0 },
                        { name: 'Passes', value: latestMetric.passes || 0 },
                        { name: 'Dribbles', value: latestMetric.dribbles || 0 },
                        { name: 'Succ. Drib.', value: latestMetric.successfulDribbles || 0 },
                      ]} barCategoryGap="30%">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between p-2 rounded bg-muted/50">
                        <span className="text-muted-foreground">Pass Accuracy</span>
                        <span className="font-semibold text-green-700 dark:text-green-500">{latestMetric.passAccuracy || 0}%</span>
                      </div>
                      <div className="flex justify-between p-2 rounded bg-muted/50">
                        <span className="text-muted-foreground">Dribble Success</span>
                        <span className="font-semibold text-yellow-700 dark:text-yellow-500">{latestMetric.dribbles ? Math.round((latestMetric.successfulDribbles || 0) / latestMetric.dribbles * 100) : 0}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Shooting &amp; Defense</CardTitle>
                    <CardDescription>Shot accuracy and defensive actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 mt-2">
                      {[
                        { label: 'Shots on Target', value: latestMetric.shotsOnTarget || 0, max: Math.max(latestMetric.shots || 1, 1), color: '#ef4444' },
                        { label: 'Tackles Won', value: latestMetric.tackles || 0, max: 20, color: '#3b82f6' },
                        { label: 'Interceptions', value: latestMetric.interceptions || 0, max: 15, color: '#8b5cf6' },
                        // performanceMetrics has no goals/assists columns, so these
                        // two always read 0 until the metric is actually recorded.
                        { label: 'Goals', value: (latestMetric as any).goals || 0, max: 5, color: '#f59e0b' },
                        { label: 'Assists', value: (latestMetric as any).assists || 0, max: 5, color: '#22c55e' },
                      ].map(({ label, value, max, color }) => (
                        <div key={label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-semibold" style={{ color }}>{value}</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: color }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="physical" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Speed &amp; Movement</CardTitle>
                    <CardDescription>Distance, top speed, sprints, and accelerations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {[
                        { label: 'Distance', value: `${latestMetric.distanceCovered || 0}`, unit: 'km', color: '#3b82f6', bg: 'bg-blue-500/10' },
                        { label: 'Top Speed', value: `${latestMetric.topSpeed || 0}`, unit: 'km/h', color: '#ef4444', bg: 'bg-red-500/10' },
                        { label: 'Sprints', value: `${latestMetric.sprints || 0}`, unit: '', color: '#f59e0b', bg: 'bg-yellow-500/10' },
                        { label: 'Accelerations', value: `${latestMetric.accelerations || 0}`, unit: '', color: '#22c55e', bg: 'bg-green-500/10' },
                      ].map(({ label, value, unit, color, bg }) => (
                        <div key={label} className={`${bg} rounded-xl p-4 text-center`}>
                          <div className="text-3xl font-bold" style={{ color }}>{value}<span className="text-sm font-normal ml-1">{unit}</span></div>
                          <div className="text-xs text-muted-foreground mt-1">{label}</div>
                        </div>
                      ))}
                    </div>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={[
                        { name: 'Dist (km)', value: latestMetric.distanceCovered || 0 },
                        { name: 'Speed', value: latestMetric.topSpeed || 0 },
                        { name: 'Sprints', value: latestMetric.sprints || 0 },
                        { name: 'Accel.', value: latestMetric.accelerations || 0 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Physical Benchmarks</CardTitle>
                    <CardDescription>Comparison against elite thresholds</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-5 mt-2">
                      {[
                        { label: 'Distance Covered', value: latestMetric.distanceCovered || 0, benchmark: 12, unit: 'km', color: '#3b82f6' },
                        { label: 'Top Speed', value: latestMetric.topSpeed || 0, benchmark: 35, unit: 'km/h', color: '#ef4444' },
                        { label: 'Sprints', value: latestMetric.sprints || 0, benchmark: 40, unit: '', color: '#f59e0b' },
                        { label: 'Accelerations', value: latestMetric.accelerations || 0, benchmark: 60, unit: '', color: '#22c55e' },
                      ].map(({ label, value, benchmark, unit, color }) => (
                        <div key={label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{label}</span>
                            <span className="text-xs">
                              <span className="font-bold" style={{ color }}>{value}{unit}</span>
                              <span className="text-muted-foreground"> / {benchmark}{unit}</span>
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5">
                            <div className="h-2.5 rounded-full" style={{ width: `${Math.min(100, (value / benchmark) * 100)}%`, backgroundColor: color }} />
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">{Math.round((value / benchmark) * 100)}% of elite benchmark</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              {metrics && metrics.length > 1 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Score Trend</CardTitle>
                    <CardDescription>Overall, Technical, Physical &amp; Tactical over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={[...metrics].reverse().map((m: any) => ({
                        date: new Date(m.sessionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
                        Overall: m.overallScore || 0,
                        Technical: m.technicalScore || 0,
                        Physical: m.physicalScore || 0,
                        Tactical: m.tacticalScore || 0,
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                        <ReferenceLine y={70} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
                        <Line type="monotone" dataKey="Overall" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="Technical" stroke="#3b82f6" strokeWidth={1.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Physical" stroke="#22c55e" strokeWidth={1.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Tactical" stroke="#f59e0b" strokeWidth={1.5} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Performance History</CardTitle>
                  <CardDescription>Recent session records</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics?.map((metric, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                        <div className="text-center min-w-[80px]">
                          <div className="text-2xl font-bold text-primary">{metric.overallScore || '--'}</div>
                          <div className="text-xs text-muted-foreground">Overall</div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium capitalize">{metric.sessionType}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(metric.sessionDate).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>Tech: {metric.technicalScore || '--'}</span>
                            <span>Phys: {metric.physicalScore || '--'}</span>
                            <span>Tact: {metric.tacticalScore || '--'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : selectedPlayer ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No performance data</h3>
              <p className="text-muted-foreground mb-4">
                Start recording performance metrics for this player
              </p>
              <RecordPerformanceDialog />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
              <p className="text-muted-foreground">
                Choose a player from the dropdown above to view their performance data
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
