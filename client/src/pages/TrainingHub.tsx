import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Zap, Users, User, CheckCircle2, XCircle, Clock, AlertCircle,
  ChevronDown, ChevronUp, Send, Brain, Loader2, CheckSquare,
  Edit3, Eye, RefreshCw, MessageSquare, Sparkles
} from "lucide-react";

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

interface PlayerRecord {
  playerId: number;
  firstName: string;
  lastName: string;
  position?: string;
  status: AttendanceStatus;
  passing?: number;
  shooting?: number;
  dribbling?: number;
  firstTouch?: number;
  defending?: number;
  heading?: number;
  positioning?: number;
  instructionCompliance?: number;
  effort?: number;
  coachNote?: string;
  sendToLockerRoom: boolean;
  expanded: boolean;
}

interface FeedbackPreview {
  playerId: number;
  firstName: string;
  lastName: string;
  message: string;
  sendToLockerRoom: boolean;
  edited: boolean;
}

const SKILL_LABELS = [
  { key: 'passing', label: 'Passing', color: 'text-blue-600 dark:text-blue-400' },
  { key: 'shooting', label: 'Shooting', color: 'text-red-600 dark:text-red-400' },
  { key: 'dribbling', label: 'Dribbling', color: 'text-yellow-700 dark:text-yellow-400' },
  { key: 'firstTouch', label: 'First Touch', color: 'text-green-700 dark:text-green-400' },
  { key: 'defending', label: 'Defending', color: 'text-purple-600 dark:text-purple-400' },
  { key: 'heading', label: 'Heading', color: 'text-orange-700 dark:text-orange-400' },
  { key: 'positioning', label: 'Positioning', color: 'text-cyan-700 dark:text-cyan-400' },
  { key: 'instructionCompliance', label: 'Instruction Compliance', color: 'text-pink-600 dark:text-pink-400' },
  { key: 'effort', label: 'Effort', color: 'text-emerald-700 dark:text-emerald-400' },
] as const;

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  present: { label: 'Present', icon: <CheckCircle2 className="w-4 h-4" />, color: 'text-green-700 dark:text-green-400', bg: 'bg-green-500/20 border-green-500/40' },
  absent: { label: 'Absent', icon: <XCircle className="w-4 h-4" />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-500/20 border-red-500/40' },
  late: { label: 'Late', icon: <Clock className="w-4 h-4" />, color: 'text-yellow-700 dark:text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/40' },
  excused: { label: 'Excused', icon: <AlertCircle className="w-4 h-4" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/20 border-blue-500/40' },
};

function SkillSlider({ label, value, onChange, color }: { label: string; value: number | undefined; onChange: (v: number) => void; color: string }) {
  const current = value ?? 5;
  const getColor = (v: number) => v >= 8 ? 'text-green-700 dark:text-green-400' : v >= 6 ? 'text-yellow-700 dark:text-yellow-400' : v >= 4 ? 'text-orange-700 dark:text-orange-400' : 'text-red-600 dark:text-red-400';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium ${color}`}>{label}</span>
        <span className={`text-sm font-bold ${getColor(current)}`}>{current}/10</span>
      </div>
      <Slider
        min={1}
        max={10}
        step={1}
        value={[current]}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
    </div>
  );
}

export default function TrainingHub() {
  const { toast } = useToast();
  const [sessionMode, setSessionMode] = useState<'team' | 'individual'>('team');
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>();
  const [selectedIndividualId, setSelectedIndividualId] = useState<number | undefined>();
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionName, setSessionName] = useState('');
  const [sessionType, setSessionType] = useState<'technical' | 'tactical' | 'physical' | 'match' | 'recovery' | 'mixed'>('technical');
  const [durationMinutes, setDurationMinutes] = useState<number>(90);
  const [coachNotes, setCoachNotes] = useState('');
  const [players, setPlayers] = useState<PlayerRecord[]>([]);

  // Two-step flow state
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [feedbackPreviews, setFeedbackPreviews] = useState<FeedbackPreview[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedResult, setSavedResult] = useState<{ totalPlayers: number; presentCount: number; lockerRoomSent: number } | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: allPlayers } = trpc.players.getAll.useQuery();
  const { data: teamPlayers } = trpc.players.getByTeam.useQuery(
    { teamId: selectedTeamId! },
    { enabled: sessionMode === 'team' && !!selectedTeamId }
  );
  const { data: recentSessions } = trpc.trainingHub.getRecentSessions.useQuery({ limit: 5 });

  const generatePreviewMutation = trpc.trainingHub.generateFeedbackPreview.useMutation({
    onSuccess: (data) => {
      const previews: FeedbackPreview[] = data.previews
        .filter(p => p.sendToLockerRoom && p.message)
        .map(p => ({ ...p, edited: false }));
      setFeedbackPreviews(previews);
      setIsGeneratingPreviews(false);
      setShowPreviewDialog(true);
    },
    onError: (err) => {
      toast({ title: 'Error generating previews', description: err.message, variant: 'destructive' });
      setIsGeneratingPreviews(false);
    },
  });

  const saveSessionMutation = trpc.trainingHub.saveSession.useMutation({
    onSuccess: (data) => {
      const lockerRoomSent = data.results.filter(r => r.lockerRoomSent).length;
      setSavedResult({ totalPlayers: data.totalPlayers, presentCount: data.presentCount, lockerRoomSent });
      setShowPreviewDialog(false);
      setShowResultDialog(true);
      setIsSaving(false);
    },
    onError: (err) => {
      toast({ title: 'Error saving session', description: err.message, variant: 'destructive' });
      setIsSaving(false);
    },
  });

  // When team changes, load team players
  useEffect(() => {
    if (sessionMode === 'team' && teamPlayers) {
      setPlayers(teamPlayers.map((p: any) => ({
        playerId: p.id,
        firstName: p.firstName,
        lastName: p.lastName,
        position: p.position,
        status: 'present' as AttendanceStatus,
        sendToLockerRoom: true,
        expanded: false,
      })));
    }
  }, [teamPlayers, sessionMode]);

  // When individual player selected
  useEffect(() => {
    if (sessionMode === 'individual' && selectedIndividualId && allPlayers) {
      const p = allPlayers.find((pl: any) => pl.id === selectedIndividualId);
      if (p) {
        setPlayers([{
          playerId: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          position: p.position,
          status: 'present' as AttendanceStatus,
          sendToLockerRoom: true,
          expanded: true,
        }]);
      }
    }
  }, [selectedIndividualId, sessionMode, allPlayers]);

  const updatePlayer = (idx: number, updates: Partial<PlayerRecord>) => {
    setPlayers(prev => prev.map((p, i) => i === idx ? { ...p, ...updates } : p));
  };

  const setAllStatus = (status: AttendanceStatus) => {
    setPlayers(prev => prev.map(p => ({ ...p, status })));
  };

  const presentCount = players.filter(p => p.status === 'present').length;
  const absentCount = players.filter(p => p.status === 'absent').length;
  const lateCount = players.filter(p => p.status === 'late').length;

  const playersWithFeedback = players.filter(p => p.sendToLockerRoom && (p.status === 'present' || p.status === 'late'));

  // Step 1: Generate previews (or skip if no locker room messages needed)
  const handleGenerateAndPreview = () => {
    if (!sessionName.trim()) {
      toast({ title: 'Session name required', variant: 'destructive' });
      return;
    }
    if (players.length === 0) {
      toast({ title: 'No players loaded', description: 'Select a team or individual player first', variant: 'destructive' });
      return;
    }

    if (playersWithFeedback.length === 0) {
      // No AI feedback needed — go straight to save
      handleConfirmSave([]);
      return;
    }

    setIsGeneratingPreviews(true);
    generatePreviewMutation.mutate({
      sessionName: sessionName.trim(),
      sessionType,
      sessionDate,
      coachNotes,
      players: players.map(p => ({
        playerId: p.playerId,
        firstName: p.firstName,
        lastName: p.lastName,
        status: p.status,
        passing: p.passing,
        shooting: p.shooting,
        dribbling: p.dribbling,
        firstTouch: p.firstTouch,
        defending: p.defending,
        heading: p.heading,
        positioning: p.positioning,
        instructionCompliance: p.instructionCompliance,
        effort: p.effort,
        coachNote: p.coachNote,
        sendToLockerRoom: p.sendToLockerRoom,
      })),
    });
  };

  // Update a preview message
  const updatePreview = (playerId: number, message: string) => {
    setFeedbackPreviews(prev => prev.map(p =>
      p.playerId === playerId ? { ...p, message, edited: true } : p
    ));
  };

  // Toggle whether to send a specific preview
  const togglePreviewSend = (playerId: number) => {
    setFeedbackPreviews(prev => prev.map(p =>
      p.playerId === playerId ? { ...p, sendToLockerRoom: !p.sendToLockerRoom } : p
    ));
  };

  // Step 2: Confirm and save with pre-written messages
  const handleConfirmSave = (previews: FeedbackPreview[]) => {
    setIsSaving(true);
    // Build a map of playerId -> approved message
    const messageMap = new Map(previews.filter(p => p.sendToLockerRoom).map(p => [p.playerId, p.message]));

    saveSessionMutation.mutate({
      sessionMode,
      teamId: sessionMode === 'team' ? selectedTeamId : undefined,
      sessionDate,
      sessionName: sessionName.trim(),
      sessionType,
      durationMinutes,
      coachNotes,
      players: players.map(p => ({
        playerId: p.playerId,
        firstName: p.firstName,
        lastName: p.lastName,
        status: p.status,
        passing: p.passing,
        shooting: p.shooting,
        dribbling: p.dribbling,
        firstTouch: p.firstTouch,
        defending: p.defending,
        heading: p.heading,
        positioning: p.positioning,
        instructionCompliance: p.instructionCompliance,
        effort: p.effort,
        coachNote: p.coachNote,
        sendToLockerRoom: p.sendToLockerRoom && messageMap.has(p.playerId),
        preWrittenMessage: messageMap.get(p.playerId) || undefined,
      })),
    });
  };

  return (
    <>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-yellow-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Training Session Hub</h1>
            <p className="text-sm text-muted-foreground">Record attendance, rate skills, and send AI feedback to players</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Session Setup */}
          <div className="space-y-4">
            {/* Session Mode */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Session Mode</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={sessionMode === 'team' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setSessionMode('team'); setPlayers([]); }}
                    className={sessionMode === 'team' ? 'bg-yellow-500 text-black font-bold' : 'border-border text-muted-foreground'}
                  >
                    <Users className="w-4 h-4 mr-2" /> Team
                  </Button>
                  <Button
                    variant={sessionMode === 'individual' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => { setSessionMode('individual'); setPlayers([]); }}
                    className={sessionMode === 'individual' ? 'bg-yellow-500 text-black font-bold' : 'border-border text-muted-foreground'}
                  >
                    <User className="w-4 h-4 mr-2" /> Individual
                  </Button>
                </div>

                {sessionMode === 'team' ? (
                  <Select value={selectedTeamId?.toString()} onValueChange={v => setSelectedTeamId(Number(v))}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select team..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {teams?.map((t: any) => (
                        <SelectItem key={t.id} value={t.id.toString()} className="text-foreground">{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select value={selectedIndividualId?.toString()} onValueChange={v => setSelectedIndividualId(Number(v))}>
                    <SelectTrigger className="bg-background border-border text-foreground">
                      <SelectValue placeholder="Select player..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {allPlayers?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()} className="text-foreground">{p.firstName} {p.lastName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Session Details */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Session Name *</Label>
                  <Input
                    value={sessionName}
                    onChange={e => setSessionName(e.target.value)}
                    placeholder="e.g. Tuesday Technical Training"
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground"
                  />
                  {/* Quick fill from recent sessions */}
                  {recentSessions && recentSessions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {recentSessions.slice(0, 3).map((s: any, i: number) => (
                        <button key={i} onClick={() => setSessionName(s.sessionName)}
                          className="text-xs text-muted-foreground hover:text-yellow-700 dark:hover:text-yellow-400 border border-border hover:border-yellow-500/40 rounded px-2 py-0.5 transition-colors">
                          {s.sessionName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Date</Label>
                  <Input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)}
                    className="bg-background border-border text-foreground" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
                    <Select value={sessionType} onValueChange={(v: any) => setSessionType(v)}>
                      <SelectTrigger className="bg-background border-border text-foreground text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {['technical', 'tactical', 'physical', 'match', 'recovery', 'mixed'].map(t => (
                          <SelectItem key={t} value={t} className="text-foreground capitalize">{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Duration (min)</Label>
                    <Input type="number" value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))}
                      className="bg-background border-border text-foreground" min={15} max={180} step={15} />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Session Notes</Label>
                  <Textarea
                    value={coachNotes}
                    onChange={e => setCoachNotes(e.target.value)}
                    placeholder="Overall session observations..."
                    className="bg-background border-border text-foreground placeholder:text-muted-foreground text-sm"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attendance Summary */}
            {players.length > 0 && (
              <Card className="bg-card border-border">
                <CardContent className="pt-4">
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-green-500/10 rounded-lg p-2 border border-green-500/20">
                      <div className="text-xl font-bold text-green-700 dark:text-green-400">{presentCount}</div>
                      <div className="text-xs text-muted-foreground">Present</div>
                    </div>
                    <div className="bg-red-500/10 rounded-lg p-2 border border-red-500/20">
                      <div className="text-xl font-bold text-red-600 dark:text-red-400">{absentCount}</div>
                      <div className="text-xs text-muted-foreground">Absent</div>
                    </div>
                    <div className="bg-yellow-500/10 rounded-lg p-2 border border-yellow-500/20">
                      <div className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{lateCount}</div>
                      <div className="text-xs text-muted-foreground">Late</div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1 text-xs border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-500/10"
                      onClick={() => setAllStatus('present')}>All Present</Button>
                    <Button size="sm" variant="outline" className="flex-1 text-xs border-red-500/40 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                      onClick={() => setAllStatus('absent')}>All Absent</Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Feedback Info */}
            {playersWithFeedback.length > 0 && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-xs text-purple-600 dark:text-purple-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
                <span>
                  <strong>{playersWithFeedback.length} player{playersWithFeedback.length > 1 ? 's' : ''}</strong> will receive AI-generated feedback.
                  You'll be able to <strong>review and edit</strong> each message before it's sent.
                </span>
              </div>
            )}

            {/* Save Button */}
            <Button
              onClick={handleGenerateAndPreview}
              disabled={isGeneratingPreviews || isSaving || players.length === 0 || !sessionName.trim()}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 text-base"
            >
              {isGeneratingPreviews ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Generating AI Feedback...</>
              ) : playersWithFeedback.length > 0 ? (
                <><Eye className="w-5 h-5 mr-2" /> Preview Feedback & Save</>
              ) : (
                <><Send className="w-5 h-5 mr-2" /> Save Session</>
              )}
            </Button>
          </div>

          {/* Right: Player Cards */}
          <div className="xl:col-span-2">
            {players.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border border-dashed border-border rounded-xl">
                <Users className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-lg font-medium">No players loaded</p>
                <p className="text-sm">Select a team or individual player to begin</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-medium text-muted-foreground">{players.length} Players</h2>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground"
                      onClick={() => setPlayers(prev => prev.map(p => ({ ...p, expanded: true })))}>
                      <ChevronDown className="w-3 h-3 mr-1" /> Expand All
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs text-muted-foreground"
                      onClick={() => setPlayers(prev => prev.map(p => ({ ...p, expanded: false })))}>
                      <ChevronUp className="w-3 h-3 mr-1" /> Collapse All
                    </Button>
                  </div>
                </div>

                {players.map((player, idx) => {
                  const statusCfg = STATUS_CONFIG[player.status];
                  const isActive = player.status === 'present' || player.status === 'late';
                  return (
                    <Card key={player.playerId} className={`bg-card border transition-all ${isActive ? 'border-border' : 'border-border opacity-70'}`}>
                      {/* Player Header */}
                      <div className="flex items-center gap-3 p-4 cursor-pointer" onClick={() => updatePlayer(idx, { expanded: !player.expanded })}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/30 to-orange-500/30 flex items-center justify-center text-sm font-bold text-yellow-700 dark:text-yellow-400">
                          {player.firstName[0]}{player.lastName[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-foreground truncate">{player.firstName} {player.lastName}</div>
                          {player.position && <div className="text-xs text-muted-foreground">{player.position}</div>}
                        </div>
                        {/* Status Buttons */}
                        <div className="flex gap-1">
                          {(['present', 'absent', 'late', 'excused'] as AttendanceStatus[]).map(s => {
                            const cfg = STATUS_CONFIG[s];
                            return (
                              <button
                                key={s}
                                onClick={e => { e.stopPropagation(); updatePlayer(idx, { status: s }); }}
                                className={`p-1.5 rounded-lg border text-xs transition-all ${player.status === s ? `${cfg.bg} ${cfg.color}` : 'border-border text-muted-foreground hover:border-muted-foreground'}`}
                                title={cfg.label}
                              >
                                {cfg.icon}
                              </button>
                            );
                          })}
                        </div>
                        <Badge variant="outline" className={`${statusCfg.bg} ${statusCfg.color} border-0 text-xs hidden sm:flex`}>
                          {statusCfg.label}
                        </Badge>
                        {player.expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                      </div>

                      {/* Expanded: Skill Ratings */}
                      {player.expanded && isActive && (
                        <div className="px-4 pb-4 border-t border-border pt-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                            {SKILL_LABELS.map(({ key, label, color }) => (
                              <SkillSlider
                                key={key}
                                label={label}
                                color={color}
                                value={(player as any)[key]}
                                onChange={v => updatePlayer(idx, { [key]: v })}
                              />
                            ))}
                          </div>
                          {/* Coach Note */}
                          <div className="mb-3">
                            <Label className="text-xs text-muted-foreground mb-1 block">Personal Note for {player.firstName}</Label>
                            <Textarea
                              value={player.coachNote || ''}
                              onChange={e => updatePlayer(idx, { coachNote: e.target.value })}
                              placeholder={`Specific feedback for ${player.firstName}...`}
                              className="bg-background border-border text-foreground placeholder:text-muted-foreground text-sm"
                              rows={2}
                            />
                          </div>
                          {/* Send to Locker Room toggle */}
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={player.sendToLockerRoom}
                              onCheckedChange={v => updatePlayer(idx, { sendToLockerRoom: v })}
                              id={`locker-${player.playerId}`}
                            />
                            <Label htmlFor={`locker-${player.playerId}`} className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1">
                              <Brain className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              Generate AI feedback for Locker Room
                            </Label>
                          </div>
                        </div>
                      )}
                      {player.expanded && !isActive && (
                        <div className="px-4 pb-4 text-xs text-muted-foreground italic border-t border-border pt-3">
                          Skill ratings not recorded for absent/excused players.
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ===== FEEDBACK PREVIEW DIALOG ===== */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="bg-card border-border text-foreground max-w-3xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                <Brain className="w-5 h-5" />
                Review AI-Generated Feedback
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Review and edit each message before sending to players' Locker Rooms. Toggle off to skip sending to a specific player.
              </p>
            </DialogHeader>

            <ScrollArea className="flex-1 overflow-y-auto pr-2 max-h-[55vh]">
              <div className="space-y-4 py-2">
                {feedbackPreviews.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No AI feedback messages generated.</div>
                ) : (
                  feedbackPreviews.map((preview) => (
                    <div key={preview.playerId} className={`rounded-xl border p-4 transition-all ${preview.sendToLockerRoom ? 'border-purple-500/30 bg-purple-500/5' : 'border-border bg-muted/30 opacity-60'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400">
                            {preview.firstName[0]}{preview.lastName[0]}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{preview.firstName} {preview.lastName}</div>
                            {preview.edited && (
                              <Badge variant="outline" className="text-xs border-yellow-500/40 text-yellow-700 dark:text-yellow-400 bg-yellow-500/10 px-1.5 py-0">
                                <Edit3 className="w-2.5 h-2.5 mr-1" />Edited
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground flex items-center gap-1 cursor-pointer">
                            <Switch
                              checked={preview.sendToLockerRoom}
                              onCheckedChange={() => togglePreviewSend(preview.playerId)}
                              className="scale-75"
                            />
                            Send
                          </Label>
                        </div>
                      </div>
                      <Textarea
                        value={preview.message}
                        onChange={e => updatePreview(preview.playerId, e.target.value)}
                        disabled={!preview.sendToLockerRoom}
                        className="bg-background border-border text-foreground text-sm min-h-[100px] resize-none"
                        rows={4}
                      />
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <MessageSquare className="w-3 h-3" />
                        <span>Will be sent as a Feedback message in the Digital Locker Room</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <DialogFooter className="flex gap-2 pt-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}
                className="border-border text-muted-foreground hover:bg-muted">
                Cancel
              </Button>
              <Button
                onClick={() => handleConfirmSave(feedbackPreviews)}
                disabled={isSaving}
                className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold flex-1"
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Confirm & Send {feedbackPreviews.filter(p => p.sendToLockerRoom).length} Messages</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ===== SUCCESS DIALOG ===== */}
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent className="bg-card border-border text-foreground max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckSquare className="w-5 h-5" />
                Session Saved Successfully!
              </DialogTitle>
            </DialogHeader>
            {savedResult && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{savedResult.totalPlayers}</div>
                    <div className="text-xs text-muted-foreground">Total Players</div>
                  </div>
                  <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                    <div className="text-2xl font-bold text-green-700 dark:text-green-400">{savedResult.presentCount}</div>
                    <div className="text-xs text-muted-foreground">Present</div>
                  </div>
                  <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{savedResult.lockerRoomSent}</div>
                    <div className="text-xs text-muted-foreground">Msgs Sent</div>
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-700 dark:text-green-300">
                  Attendance recorded, skill ratings saved, and feedback sent to each player's Digital Locker Room.
                </div>
                <Button onClick={() => { setShowResultDialog(false); setPlayers([]); setSessionName(''); setCoachNotes(''); }}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold">
                  Start New Session
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
