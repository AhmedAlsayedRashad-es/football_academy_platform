import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {Play, Pause, Square, Plus, Clock, Target, Activity, AlertCircle, Zap, TrendingUp, ArrowLeft} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import PlayerHeatmap from '@/components/PlayerHeatmap';
import GPSImportDialog from '@/components/GPSImportDialog';
import HalfComparison from '@/components/HalfComparison';
import FatigueAlert from '@/components/FatigueAlert';
import DangerZone from '@/components/DangerZone';
import AudioSettings from '@/components/AudioSettings';
import PostMatchReport from '@/components/PostMatchReport';
import WhatsAppSettings from '@/components/WhatsAppSettings';
import { useLocation } from 'wouter';
import { useOfflineMatchEvents } from '@/hooks/useOfflineMatchEvents';
import { WifiOff, Wifi } from 'lucide-react';


interface MatchTimer {
  isRunning: boolean;
  currentMinute: number;
  startTime: number | null;
}

export default function LiveMatchMode() {
  const [, navigate] = useLocation();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [liveMatchId, setLiveMatchId] = useState<number | null>(null);
  const [timer, setTimer] = useState<MatchTimer>({ isRunning: false, currentMinute: 0, startTime: null });
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [showTacticsDialog, setShowTacticsDialog] = useState(false);
  const [showGpsDialog, setShowGpsDialog] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  // Form states
  const [startForm, setStartForm] = useState({
    teamId: 'none',
    opponent: '',
    opponentFormation: 'none',
    currentFormation: '4-3-3',
    isHome: true,
  });

  const [eventForm, setEventForm] = useState({
    eventType: 'goal' as 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'injury' | 'penalty' | 'own_goal' | 'var_decision',
    playerName: '',
    assistPlayerName: '',
    substitutedPlayerName: '',
    description: '',
    isOurTeam: true,
  });

  const [tacticsForm, setTacticsForm] = useState({
    changeType: 'formation' as 'formation' | 'instruction' | 'player_role' | 'pressing_intensity' | 'defensive_line',
    fromValue: '',
    toValue: '',
    reason: '',
  });

  // Queries
  const { data: matchState, refetch: refetchMatchState } = trpc.liveMatch.getMatchState.useQuery(
    { id: liveMatchId! },
    { enabled: !!liveMatchId, refetchInterval: 5000 }
  );

  const { data: teams } = trpc.teams.getAll.useQuery();

  // Mutations
  const startMatch = trpc.liveMatch.start.useMutation({
    onSuccess: (data) => {
      setLiveMatchId(data.id);
      setShowStartDialog(false);
      toast({ title: t('matchStarted'), description: t('liveMatchModeActivated') });
    },
  });

  const updateTime = trpc.liveMatch.updateTime.useMutation();
  const updateScore = trpc.liveMatch.updateScore.useMutation();
  // ── OFFLINE MATCH EVENTS ──
  const {
    isOnline,
    pendingCount: offlinePendingCount,
    isSyncing: isSyncingEvents,
    recordEvent: recordEventOffline,
    syncPendingEvents,
    isRecording: isRecordingOffline,
  } = useOfflineMatchEvents(liveMatchId);

  const recordEvent = trpc.liveMatch.recordEvent.useMutation({
    onSuccess: () => {
      refetchMatchState();
      setShowEventDialog(false);
      setEventForm({
        eventType: 'goal',
        playerName: '',
        assistPlayerName: '',
        substitutedPlayerName: '',
        description: '',
        isOurTeam: true,
      });
      toast({ title: t('eventRecorded'), description: t('matchEventSaved') });
    },
  });

  const changeTactics = trpc.liveMatch.changeTactics.useMutation({
    onSuccess: () => {
      refetchMatchState();
      setShowTacticsDialog(false);
      setTacticsForm({
        changeType: 'formation',
        fromValue: '',
        toValue: '',
        reason: '',
      });
      toast({ title: t('tacticsChanged'), description: t('tacticalChangeSaved') });
    },
  });

  const getAIAdvice = trpc.liveMatch.getAIAdvice.useMutation({
    onSuccess: (data) => {
      setAiAdvice(typeof data.advice === "string" ? data.advice : JSON.stringify(data.advice));
      setLoadingAdvice(false);
    },
  });

  const finishMatch = trpc.liveMatch.finishMatch.useMutation({
    onSuccess: () => {
      toast({ title: t('matchFinished'), description: t('matchDataSaved') });
      setLiveMatchId(null);
      setTimer({ isRunning: false, currentMinute: 0, startTime: null });
    },
  });

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning && timer.startTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timer.startTime!) / 60000);
        setTimer(prev => ({ ...prev, currentMinute: elapsed }));
        
        // Update backend every minute
        if (liveMatchId && elapsed !== timer.currentMinute) {
          const status = elapsed < 45 ? 'first_half' : elapsed < 90 ? 'second_half' : 'extra_time';
          updateTime.mutate({ id: liveMatchId, currentMinute: elapsed, status });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.startTime, liveMatchId]);

  const handleStartMatch = () => {
    if (!startForm.teamId || startForm.teamId === 'none' || !startForm.opponent) {
      toast({ title: t('error'), description: t('fillAllFields'), variant: 'destructive' });
      return;
    }
    startMatch.mutate({
      teamId: parseInt(startForm.teamId),
      opponent: startForm.opponent,
      opponentFormation: (startForm.opponentFormation && startForm.opponentFormation !== 'none') ? startForm.opponentFormation : undefined,
      currentFormation: startForm.currentFormation,
      isHome: startForm.isHome,
    });
  };

  const handleStartTimer = () => {
    setTimer({ isRunning: true, currentMinute: 0, startTime: Date.now() });
  };

  const handlePauseTimer = () => {
    setTimer(prev => ({ ...prev, isRunning: false }));
  };

  const handleResumeTimer = () => {
    const pausedMinute = timer.currentMinute;
    setTimer({ isRunning: true, currentMinute: pausedMinute, startTime: Date.now() - (pausedMinute * 60000) });
  };

  const handleScoreChange = (type: 'home' | 'away', increment: number) => {
    if (!liveMatchId || !matchState?.match) return;
    const newHomeScore = type === 'home' ? (matchState.match.homeScore || 0) + increment : matchState.match.homeScore || 0;
    const newAwayScore = type === 'away' ? (matchState.match.awayScore || 0) + increment : matchState.match.awayScore || 0;
    updateScore.mutate({ id: liveMatchId, homeScore: newHomeScore, awayScore: newAwayScore });
  };

  const handleRecordEvent = async () => {
    if (!liveMatchId) return;
    try {
      await recordEventOffline({
        ...eventForm,
        minute: timer.currentMinute,
      });
      setShowEventDialog(false);
      setEventForm({
        eventType: 'goal',
        playerName: '',
        assistPlayerName: '',
        substitutedPlayerName: '',
        description: '',
        isOurTeam: true,
      });
      refetchMatchState();
    } catch {
      // Error toast already shown by hook
    }
  };

  const handleChangeTactics = () => {
    if (!liveMatchId) return;
    changeTactics.mutate({
      liveMatchId,
      minute: timer.currentMinute,
      ...tacticsForm,
    });
  };

  const handleGetAIAdvice = () => {
    if (!liveMatchId) return;
    setLoadingAdvice(true);
    getAIAdvice.mutate({ liveMatchId });
  };

  const handleFinishMatch = () => {
    if (!liveMatchId) return;
    if (confirm(t('confirmFinishMatch'))) {
      finishMatch.mutate({ id: liveMatchId });
    }
  };

  const formations = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '3-4-3', '5-3-2'];

  if (!liveMatchId) {
    return (
      <>
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <Activity className="w-16 h-16 mx-auto mb-4 text-primary" />
              
              <button onClick={() => navigate("/matches")} className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">

                <ArrowLeft className="w-5 h-5" />

              </button>
<h1 className="text-3xl font-bold mb-2">{t('liveMatchMode')}</h1>
              <p className="text-muted-foreground">{t('liveMatchModeDescription')}</p>
            </div>

            <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
              <DialogTrigger asChild>
                <Button size="lg" className="w-full">
                  <Play className="w-5 h-5 mr-2" />
                  {t('startNewMatch')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('startNewMatch')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t('selectTeam')}</Label>
                    <Select value={startForm.teamId} onValueChange={(value) => setStartForm(prev => ({ ...prev, teamId: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectTeam')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Select a team --</SelectItem>
                        {teams?.map((team: any) => (
                          <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('opponent')}</Label>
                    <Input
                      value={startForm.opponent}
                      onChange={(e) => setStartForm(prev => ({ ...prev, opponent: e.target.value }))}
                      placeholder={t('opponentName')}
                    />
                  </div>

                  <div>
                    <Label>{t('venue')}</Label>
                    <Select value={startForm.isHome.toString()} onValueChange={(value) => setStartForm(prev => ({ ...prev, isHome: value === 'true' }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">{t('home')}</SelectItem>
                        <SelectItem value="false">{t('away')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('ourFormation')}</Label>
                    <Select value={startForm.currentFormation} onValueChange={(value) => setStartForm(prev => ({ ...prev, currentFormation: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {formations.map((formation: any) => (
                          <SelectItem key={formation} value={formation}>{formation}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t('opponentFormation')} ({t('optional')})</Label>
                    <Select value={startForm.opponentFormation} onValueChange={(value) => setStartForm(prev => ({ ...prev, opponentFormation: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('selectFormation')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Not specified</SelectItem>
                        {formations.map((formation: any) => (
                          <SelectItem key={formation} value={formation}>{formation}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleStartMatch} className="w-full" disabled={startMatch.isPending}>
                    {startMatch.isPending ? t('starting') : t('startMatch')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </Card>
        </div>
      </div>
      </>
    );
  }

  const match = matchState?.match;
  if (!match) return <><div className="container mx-auto py-8 text-center">{t('loading')}</div></>;

  return (
    <>
    <div className="container mx-auto py-6 space-y-6">
      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">Offline mode — match events will be queued and synced when reconnected</span>
          {offlinePendingCount > 0 && (
            <span className="ml-auto text-xs bg-orange-500 text-white rounded-full px-2 py-0.5">{offlinePendingCount} queued</span>
          )}
        </div>
      )}
      {isOnline && offlinePendingCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400">
          <Wifi className="h-4 w-4 shrink-0" />
          <span className="text-sm font-medium">{offlinePendingCount} offline event{offlinePendingCount > 1 ? 's' : ''} pending sync</span>
          <button
            onClick={syncPendingEvents}
            disabled={isSyncingEvents}
            className="ml-auto text-xs bg-blue-500 text-white rounded px-2 py-0.5 hover:bg-blue-600 disabled:opacity-50"
          >
            {isSyncingEvents ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
      )}
      {/* Header with Timer and Score */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Timer */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">{t('matchTime')}</span>
            </div>
            <div className="text-4xl font-bold mb-4">{timer.currentMinute}'</div>
            <div className="flex gap-2 justify-center">
              {!timer.isRunning && timer.currentMinute === 0 && (
                <Button onClick={handleStartTimer} size="sm">
                  <Play className="w-4 h-4 mr-1" /> {t('start')}
                </Button>
              )}
              {timer.isRunning && (
                <Button onClick={handlePauseTimer} size="sm" variant="outline">
                  <Pause className="w-4 h-4 mr-1" /> {t('pause')}
                </Button>
              )}
              {!timer.isRunning && timer.currentMinute > 0 && (
                <Button onClick={handleResumeTimer} size="sm">
                  <Play className="w-4 h-4 mr-1" /> {t('resume')}
                </Button>
              )}
              <Button onClick={handleFinishMatch} size="sm" variant="destructive">
                <Square className="w-4 h-4 mr-1" /> {t('finish')}
              </Button>
            </div>
          </div>

          {/* Score */}
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground mb-2">{t('score')}</div>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-sm mb-1">{match.isHome ? t('us') : match.opponent}</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleScoreChange('home', -1)} disabled={(match.homeScore || 0) === 0}>-</Button>
                  <span className="text-5xl font-bold w-16">{match.homeScore || 0}</span>
                  <Button size="sm" variant="outline" onClick={() => handleScoreChange('home', 1)}>+</Button>
                </div>
              </div>
              <span className="text-3xl font-bold text-muted-foreground">:</span>
              <div className="text-center">
                <div className="text-sm mb-1">{match.isHome ? match.opponent : t('us')}</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleScoreChange('away', -1)} disabled={(match.awayScore || 0) === 0}>-</Button>
                  <span className="text-5xl font-bold w-16">{match.awayScore || 0}</span>
                  <Button size="sm" variant="outline" onClick={() => handleScoreChange('away', 1)}>+</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Formation */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">{t('formation')}</span>
            </div>
            <div className="text-3xl font-bold mb-2">{match.currentFormation}</div>
            <Button size="sm" variant="outline" onClick={() => setShowTacticsDialog(true)}>
              {t('changeTactics')}
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('quickActions')}</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEventForm(prev => ({ ...prev, eventType: 'goal' })); setShowEventDialog(true); }}>
              ⚽ {t('goal')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEventForm(prev => ({ ...prev, eventType: 'yellow_card' })); setShowEventDialog(true); }}>
              🟨 {t('yellowCard')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEventForm(prev => ({ ...prev, eventType: 'red_card' })); setShowEventDialog(true); }}>
              🟥 {t('redCard')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEventForm(prev => ({ ...prev, eventType: 'substitution' })); setShowEventDialog(true); }}>
              🔄 {t('substitution')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEventForm(prev => ({ ...prev, eventType: 'injury' })); setShowEventDialog(true); }}>
              🩹 {t('injury')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setEventForm(prev => ({ ...prev, eventType: 'penalty' })); setShowEventDialog(true); }}>
              ⚠️ {t('penalty')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowGpsDialog(true)} className="col-span-2">
              📡 {t('gpsSync')}
            </Button>
          </div>

          <div className="mt-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t('substitutionsUsed')}</span>
              <span className="font-semibold">{match.substitutionsUsed || 0} / 5</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t('yellowCards')}</span>
              <span className="font-semibold">{match.yellowCards || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>{t('redCards')}</span>
              <span className="font-semibold">{match.redCards || 0}</span>
            </div>
          </div>
        </Card>

        {/* Statistics */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('liveStatistics')}</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('possession')}</span>
                <span className="font-semibold">{match.possession}%</span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: `${match.possession}%` }} />
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span>{t('shots')}</span>
              <span className="font-semibold">{match.shots} ({match.shotsOnTarget} {t('onTarget')})</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>{t('opponentShots')}</span>
              <span className="font-semibold">{match.opponentShots} ({match.opponentShotsOnTarget} {t('onTarget')})</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>{t('corners')}</span>
              <span className="font-semibold">{match.corners} - {match.opponentCorners}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>{t('fouls')}</span>
              <span className="font-semibold">{match.fouls} - {match.opponentFouls}</span>
            </div>
          </div>
        </Card>

        {/* Audio Settings */}
        <AudioSettings />

        {/* WhatsApp Settings */}
        <WhatsAppSettings />

        {/* AI Assistant */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">{t('aiTacticalAssistant')}</h3>
          </div>
          
          <Button 
            onClick={handleGetAIAdvice} 
            className="w-full mb-4" 
            disabled={loadingAdvice}
          >
            {loadingAdvice ? t('analyzing') : t('getAIAdvice')}
          </Button>

          {aiAdvice && (
            <div className="bg-secondary/50 p-4 rounded-lg text-sm space-y-2">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <p className="whitespace-pre-wrap">{aiAdvice}</p>
              </div>
            </div>
          )}

          {!aiAdvice && !loadingAdvice && (
            <div className="text-center text-sm text-muted-foreground py-8">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>{t('clickToGetAIAdvice')}</p>
            </div>
          )}
        </Card>
      </div>

      {/* Events Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('matchEvents')}</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {matchState?.events && matchState.events.length > 0 ? (
            matchState.events.map((event) => (
              <div key={event.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                <span className="font-bold text-primary min-w-[40px]">{event.minute}'</span>
                <span className="text-lg">
                  {event.eventType === 'goal' && '⚽'}
                  {event.eventType === 'yellow_card' && '🟨'}
                  {event.eventType === 'red_card' && '🟥'}
                  {event.eventType === 'substitution' && '🔄'}
                  {event.eventType === 'injury' && '🩹'}
                  {event.eventType === 'penalty' && '⚠️'}
                </span>
                <div className="flex-1">
                  <div className="font-medium">{event.playerName}</div>
                  {event.assistPlayerName && (
                    <div className="text-sm text-muted-foreground">{t('assist')}: {event.assistPlayerName}</div>
                  )}
                  {event.description && (
                    <div className="text-sm text-muted-foreground">{event.description}</div>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded ${event.isOurTeam ? 'bg-primary/20 text-primary' : 'bg-destructive/20 text-destructive'}`}>
                  {event.isOurTeam ? t('us') : t('opponent')}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center text-muted-foreground py-8">{t('noEventsYet')}</div>
          )}
        </div>
      </Card>

      {/* Tactical Changes Timeline */}
      {matchState?.tacticalChanges && matchState.tacticalChanges.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">{t('tacticalChanges')}</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {matchState.tacticalChanges.map((change) => (
              <div key={change.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg">
                <span className="font-bold text-primary min-w-[40px]">{change.minute}'</span>
                <div className="flex-1">
                  <div className="font-medium">{change.changeType}</div>
                  <div className="text-sm text-muted-foreground">
                    {change.fromValue && `${change.fromValue} → `}{change.toValue}
                  </div>
                  {change.reason && (
                    <div className="text-sm text-muted-foreground mt-1">{change.reason}</div>
                  )}
                </div>
                {change.aiSuggested && (
                  <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                    AI
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Player Heatmap */}
      <PlayerHeatmap 
        liveMatchId={liveMatchId} 
        players={(teams?.find(t => t.id === (match.teamId ?? 0)) as any)?.players?.map((p: any) => ({ id: p.id, name: `${p.firstName || ''} ${p.lastName || ''}`.trim() })) || []}
      />

      {/* Half-by-Half Comparison */}
      {liveMatchId && (match.currentMinute ?? 0) > 45 && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">{t('halfByHalfComparison')}</h2>
          <HalfComparison matchId={liveMatchId} />
        </div>
      )}

      {/* Fatigue Alert System */}
      {liveMatchId && (match.currentMinute ?? 0) > 20 && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">{t('fatigueMonitoring')}</h2>
          <FatigueAlert matchId={liveMatchId} />
        </div>
      )}

      {/* Danger Zone Analysis */}
      {liveMatchId && (match.currentMinute ?? 0) > 10 && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">{t('dangerZoneAnalysis')}</h2>
          <DangerZone matchId={liveMatchId} />
        </div>
      )}

      {/* Post-Match Report */}
      {liveMatchId && (match.status === 'finished' || (match.currentMinute ?? 0) >= 90) && (
        <div className="mt-6">
          <h2 className="text-2xl font-bold mb-4">{t('postMatchReport')}</h2>
          <PostMatchReport matchId={liveMatchId} />
        </div>
      )}

      {/* GPS Import Dialog */}
      <GPSImportDialog
        open={showGpsDialog}
        onOpenChange={setShowGpsDialog}
        liveMatchId={liveMatchId}
        players={(teams?.find(t => t.id === (match.teamId ?? 0)) as any)?.players?.map((p: any) => ({ id: p.id, name: `${p.firstName || ''} ${p.lastName || ''}`.trim() })) || []}
      />

      {/* Event Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('recordEvent')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('eventType')}</Label>
              <Select value={eventForm.eventType} onValueChange={(value: any) => setEventForm(prev => ({ ...prev, eventType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goal">⚽ {t('goal')}</SelectItem>
                  <SelectItem value="yellow_card">🟨 {t('yellowCard')}</SelectItem>
                  <SelectItem value="red_card">🟥 {t('redCard')}</SelectItem>
                  <SelectItem value="substitution">🔄 {t('substitution')}</SelectItem>
                  <SelectItem value="injury">🩹 {t('injury')}</SelectItem>
                  <SelectItem value="penalty">⚠️ {t('penalty')}</SelectItem>
                  <SelectItem value="own_goal">⚽ {t('ownGoal')}</SelectItem>
                  <SelectItem value="var_decision">📹 {t('varDecision')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('team')}</Label>
              <Select value={eventForm.isOurTeam.toString()} onValueChange={(value) => setEventForm(prev => ({ ...prev, isOurTeam: value === 'true' }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{t('us')}</SelectItem>
                  <SelectItem value="false">{t('opponent')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{t('playerName')}</Label>
              <Input
                value={eventForm.playerName}
                onChange={(e) => setEventForm(prev => ({ ...prev, playerName: e.target.value }))}
                placeholder={t('enterPlayerName')}
              />
            </div>

            {eventForm.eventType === 'goal' && (
              <div>
                <Label>{t('assistBy')} ({t('optional')})</Label>
                <Input
                  value={eventForm.assistPlayerName}
                  onChange={(e) => setEventForm(prev => ({ ...prev, assistPlayerName: e.target.value }))}
                  placeholder={t('enterAssistPlayerName')}
                />
              </div>
            )}

            {eventForm.eventType === 'substitution' && (
              <div>
                <Label>{t('playerOut')}</Label>
                <Input
                  value={eventForm.substitutedPlayerName}
                  onChange={(e) => setEventForm(prev => ({ ...prev, substitutedPlayerName: e.target.value }))}
                  placeholder={t('enterPlayerName')}
                />
              </div>
            )}

            <div>
              <Label>{t('notes')} ({t('optional')})</Label>
              <Textarea
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder={t('additionalNotes')}
                rows={3}
              />
            </div>

            <Button onClick={handleRecordEvent} className="w-full" disabled={recordEvent.isPending}>
              {recordEvent.isPending ? t('recording') : t('recordEvent')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tactics Dialog */}
      <Dialog open={showTacticsDialog} onOpenChange={setShowTacticsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('changeTactics')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t('changeType')}</Label>
              <Select value={tacticsForm.changeType} onValueChange={(value: any) => setTacticsForm(prev => ({ ...prev, changeType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formation">{t('formation')}</SelectItem>
                  <SelectItem value="instruction">{t('tacticalInstruction')}</SelectItem>
                  <SelectItem value="player_role">{t('playerRole')}</SelectItem>
                  <SelectItem value="pressing_intensity">{t('pressingIntensity')}</SelectItem>
                  <SelectItem value="defensive_line">{t('defensiveLine')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {tacticsForm.changeType === 'formation' && (
              <div>
                <Label>{t('newFormation')}</Label>
                <Select value={tacticsForm.toValue} onValueChange={(value) => setTacticsForm(prev => ({ ...prev, toValue: value, fromValue: match.currentFormation }))}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectFormation')} />
                  </SelectTrigger>
                  <SelectContent>
                    {formations.map((formation: any) => (
                      <SelectItem key={formation} value={formation}>{formation}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {tacticsForm.changeType !== 'formation' && (
              <div>
                <Label>{t('newValue')}</Label>
                <Input
                  value={tacticsForm.toValue}
                  onChange={(e) => setTacticsForm(prev => ({ ...prev, toValue: e.target.value }))}
                  placeholder={t('enterNewValue')}
                />
              </div>
            )}

            <div>
              <Label>{t('reason')} ({t('optional')})</Label>
              <Textarea
                value={tacticsForm.reason}
                onChange={(e) => setTacticsForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder={t('whyThisChange')}
                rows={3}
              />
            </div>

            <Button onClick={handleChangeTactics} className="w-full" disabled={changeTactics.isPending}>
              {changeTactics.isPending ? t('saving') : t('saveTacticalChange')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
