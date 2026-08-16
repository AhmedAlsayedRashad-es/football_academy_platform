import { BackButton } from '@/components/BackButton';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useParentChild } from '@/contexts/ParentChildContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
  Plus, Coins, Trophy, Users, Search,
  TrendingUp, Gift, Award, Zap, ArrowLeft, Lock, CheckCircle2
} from 'lucide-react';
import { useLocation , useSearch} from 'wouter';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/contexts/LanguageContext';

const MILESTONES_STATIC = [
  { threshold: 100, title: 'First Steps', description: 'Earn your first 100 points', icon: '🌟' },
  { threshold: 250, title: 'Rising Star', description: 'Reach 250 total points', icon: '⭐' },
  { threshold: 500, title: 'Half Century', description: 'Cross the 500 points milestone', icon: '🏅' },
  { threshold: 1000, title: 'Champion', description: 'Earn 1,000 points', icon: '🥇' },
  { threshold: 2500, title: 'Elite Player', description: 'Reach 2,500 points — elite status!', icon: '🏆' },
  { threshold: 5000, title: 'Legend', description: 'Earn 5,000 points', icon: '👑' },
  { threshold: 10000, title: 'Academy Icon', description: 'Reach 10,000 points — an academy icon!', icon: '💎' },
];

const POINT_REASONS = [
  { value: 'attendance', label: 'Training Attendance', points: 10, type: 'attendance' as const },
  { value: 'match_attendance', label: 'Match Attendance', points: 20, type: 'attendance' as const },
  { value: 'goal', label: 'Goal Scored', points: 50, type: 'performance' as const },
  { value: 'assist', label: 'Assist', points: 30, type: 'performance' as const },
  { value: 'motm', label: 'Man of the Match', points: 100, type: 'achievement' as const },
  { value: 'improvement', label: 'Notable Improvement', points: 75, type: 'improvement' as const },
  { value: 'teamwork', label: 'Great Teamwork', points: 40, type: 'bonus' as const },
  { value: 'discipline', label: 'Excellent Discipline', points: 25, type: 'bonus' as const },
  { value: 'talent_bonus', label: 'Talent Bonus', points: 150, type: 'achievement' as const },
  { value: 'custom', label: 'Custom', points: 0, type: 'bonus' as const },
];

export default function PointsManagement() {
  const { user } = useAuth();
  const { selectedChildId, linkedPlayers: parentLinkedPlayers } = useParentChild();
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const teamType = searchParams.get('team') as 'main' | 'academy' | null;

  const isCoach = ['admin', 'coach'].includes(user?.role ?? '');
  const isPlayer = user?.role === 'player';
  const isParent = user?.role === 'parent';

  const selectedChildPlayer = isParent && selectedChildId
    ? parentLinkedPlayers.find((p: any) => p.id.toString() === selectedChildId)
    : null;

  const { t, language } = useLanguage();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [pointsAmount, setPointsAmount] = useState('');
  const [reason, setReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogTeamTypeFilter, setDialogTeamTypeFilter] = useState<'all' | 'main' | 'academy'>('all');
  const [dialogSelectorTeamId, setDialogSelectorTeamId] = useState<number>(0);

  // Player/parent target
  const targetPlayerId = isPlayer ? undefined : isParent && selectedChildPlayer ? selectedChildPlayer.id : undefined;

  // Queries
  const { data: allPlayers } = trpc.players.getAll.useQuery(undefined, { enabled: isCoach });
  const { data: allTeams = [] } = trpc.teams.getAll.useQuery(undefined, { enabled: isCoach });
  const mainTeams = (allTeams as any[]).filter((t: any) => t.teamType === 'main');
  const academyTeams = (allTeams as any[]).filter((t: any) => t.teamType === 'academy');
  const { data: leaderboard, refetch: refetchLeaderboard } = trpc.points.getLeaderboard.useQuery({ limit: 20 });
  const { data: playerPoints } = trpc.points.getPlayerPoints.useQuery(
    { playerId: targetPlayerId! },
    { enabled: !!targetPlayerId }
  );
  const { data: transactions } = trpc.points.getTransactions.useQuery(
    { playerId: targetPlayerId ?? (selectedPlayerId ? Number(selectedPlayerId) : 1), limit: 20 },
    { enabled: !!targetPlayerId || !!selectedPlayerId }
  );
  const { data: playerAchievements } = trpc.points.getPlayerAchievements.useQuery(
    { playerId: targetPlayerId! },
    { enabled: !!targetPlayerId }
  );

  // Award points mutation
  const awardPoints = trpc.points.awardPoints.useMutation({
    onSuccess: (result: any) => {
      const newMilestones = result?.newMilestones ?? [];
      if (newMilestones.length > 0) {
        toast.success(`Milestone unlocked: ${newMilestones.join(', ')}! Points awarded!`);
      } else {
        toast.success(`Successfully added ${pointsAmount} points!`);
      }
      setShowAddDialog(false);
      setSelectedPlayerId('');
      setPointsAmount('');
      setReason('');
      refetchLeaderboard();
    },
    onError: () => toast.error('Failed to award points'),
  });

  const handleReasonChange = (value: string) => {
    setReason(value);
    const r = POINT_REASONS.find(r => r.value === value);
    if (r && r.points > 0) setPointsAmount(String(r.points));
  };

  const handleAddPoints = () => {
    if (!selectedPlayerId || !pointsAmount || !reason) {
      toast.error('Please fill all fields');
      return;
    }
    const r = POINT_REASONS.find(r => r.value === reason);
    awardPoints.mutate({
      playerId: Number(selectedPlayerId),
      amount: Number(pointsAmount),
      type: r?.type ?? 'bonus',
      description: r?.label ?? reason,
    });
  };

  const filteredPlayers = (allPlayers ?? []).filter((p: any) =>
    searchTerm === '' ||
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.ageGroup ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPoints = (leaderboard ?? []).reduce((s: number, p: any) => s + (p.points ?? 0), 0);

  // ==================== PLAYER / PARENT VIEW ====================
  if (isPlayer || isParent) {
    const totalEarned = playerPoints?.totalEarned ?? 0;
    const currentLevel = playerPoints?.level ?? 1;
    const pointsInLevel = totalEarned % 1000;
    const levelProgress = (pointsInLevel / 1000) * 100;
    const nextMilestone = MILESTONES_STATIC.find(m => totalEarned < m.threshold);

    return (
      <>
        <div className="p-6 max-w-3xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <BackButton to={teamType ? `/team-dashboard?team=${teamType}` : undefined} />
            <div>
              <h1 className="text-2xl font-bold">My Points & Achievements</h1>
              <p className="text-muted-foreground text-sm">Track your earned points, levels, and milestone badges</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="brand-gradient text-white">
              <CardContent className="p-5 text-center">
                <div className="text-4xl font-black">{playerPoints?.points ?? 0}</div>
                <div className="text-sm opacity-80 mt-1">Available Points</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <div className="text-4xl font-black text-green-700 dark:text-green-500">{totalEarned}</div>
                <div className="text-sm text-muted-foreground mt-1">Total Earned</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 text-center">
                <div className="text-4xl font-black text-blue-500">Lv.{currentLevel}</div>
                <div className="text-sm text-muted-foreground mt-1">Current Level</div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardContent className="p-5">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Level {currentLevel}</span>
                <span className="text-muted-foreground">Level {currentLevel + 1}</span>
              </div>
              <Progress value={levelProgress} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">
                {1000 - pointsInLevel} points to next level
              </p>
            </CardContent>
          </Card>

          <Tabs defaultValue="milestones">
            <TabsList className="mb-4">
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="milestones">
              {nextMilestone && (
                <Card className="mb-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{nextMilestone.icon}</div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Next: {nextMilestone.title}</div>
                        <div className="text-xs text-muted-foreground mb-2">{nextMilestone.description}</div>
                        <Progress value={Math.round((totalEarned / nextMilestone.threshold) * 100)} className="h-2" />
                        <div className="text-xs text-muted-foreground mt-1">
                          {totalEarned} / {nextMilestone.threshold} points ({Math.round((totalEarned / nextMilestone.threshold) * 100)}%)
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              <div className="grid grid-cols-1 gap-3">
                {MILESTONES_STATIC.map((m) => {
                  const earned = totalEarned >= m.threshold;
                  const progress = Math.min(100, Math.round((totalEarned / m.threshold) * 100));
                  return (
                    <Card key={m.threshold} className={earned ? 'border-green-200 bg-green-50 dark:bg-green-950/20' : 'opacity-70'}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{m.icon}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm">{m.title}</span>
                              {earned ? (
                                <Badge className="bg-green-500 text-white text-xs">Earned!</Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs">{m.threshold} pts</Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">{m.description}</div>
                            {!earned && (
                              <>
                                <Progress value={progress} className="h-1.5" />
                                <div className="text-xs text-muted-foreground mt-1">{progress}% complete</div>
                              </>
                            )}
                          </div>
                          {earned ? (
                            <CheckCircle2 className="w-5 h-5 text-green-700 dark:text-green-500 shrink-0" />
                          ) : (
                            <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Points History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(transactions ?? []).length === 0 ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">No points earned yet. Attend sessions to start earning!</p>
                  ) : (
                    <div className="space-y-2">
                      {(transactions ?? []).map((tx: any) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                              <Coins className="w-4 h-4 text-amber-600" />
                            </div>
                            <div>
                              <div className="text-sm font-medium">{tx.description}</div>
                              <div className="text-xs text-muted-foreground capitalize">{tx.type} · {new Date(tx.createdAt).toLocaleDateString()}</div>
                            </div>
                          </div>
                          <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="achievements">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    Earned Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(playerAchievements ?? []).length === 0 ? (
                    <div className="text-center py-8">
                      <Award className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm">No achievements yet. Keep earning points to unlock milestone badges!</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(playerAchievements ?? []).map((ach: any) => (
                        <div key={ach.id} className="brand-gradient-subtle flex items-center gap-3 p-3 rounded-lg border border-amber-200">
                          <div className="text-2xl">{ach.iconType || '🏆'}</div>
                          <div>
                            <div className="font-semibold text-sm">{ach.title}</div>
                            <div className="text-xs text-muted-foreground">{ach.description}</div>
                            <div className="text-xs text-amber-600 mt-1">
                              Earned {new Date(ach.achievedDate).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </>
    );
  }

  // ==================== COACH / ADMIN VIEW ====================
  return (
    <>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BackButton to={teamType ? `/team-dashboard?team=${teamType}` : undefined} />
            <div>
              <h1 className="text-2xl font-bold">{t("points.management")}</h1>
              <p className="text-muted-foreground text-sm">Award and manage player points</p>
            </div>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Award Points
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="brand-gradient text-white">
            <CardContent className="p-5">
              <div className="text-3xl font-black">{totalPoints.toLocaleString()}</div>
              <div className="text-sm opacity-80 mt-1">Total Points Awarded</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-3xl font-black text-blue-500">{(leaderboard ?? []).length}</div>
              <div className="text-sm text-muted-foreground mt-1">Players on Board</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-3xl font-black text-green-700 dark:text-green-500">
                {(leaderboard ?? []).filter((p: any) => p.points >= 100).length}
              </div>
              <div className="text-sm text-muted-foreground mt-1">100+ Points</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="text-3xl font-black text-purple-500">
                {Math.max(...(leaderboard ?? []).map((p: any) => p.level ?? 1), 1)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">Highest Level</div>
            </CardContent>
          </Card>
        </div>

        {/* Milestone Badges Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-700 dark:text-amber-500" />
              Point Milestone Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {MILESTONES_STATIC.map((m) => (
                <div key={m.threshold} className="text-center p-3 rounded-lg border bg-muted/30">
                  <div className="text-2xl mb-1">{m.icon}</div>
                  <div className="text-xs font-semibold">{m.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.threshold} pts</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Milestones are automatically awarded when players reach the required total points. Players can view their earned badges in the My Points page.
            </p>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leaderboard */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-700 dark:text-amber-500" />
                    Points Leaderboard
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search players..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-9 w-52"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(leaderboard ?? [])
                    .filter((p: any) => searchTerm === '' || p.playerName?.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((player: any, index: number) => (
                      <div
                        key={player.playerId}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-amber-400 text-black' :
                            index === 1 ? 'bg-gray-300 text-gray-700' :
                            index === 2 ? 'bg-amber-700 text-white' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{player.playerName ?? `Player #${player.playerId}`}</div>
                            <div className="text-xs text-muted-foreground">Level {player.level ?? 1}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-black text-amber-700 dark:text-amber-500">{player.points}</div>
                            <div className="text-xs text-muted-foreground">pts</div>
                          </div>
                          {isCoach && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => { setSelectedPlayerId(String(player.playerId)); setShowAddDialog(true); }}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  {(leaderboard ?? []).length === 0 && (
                    <p className="text-center text-muted-foreground py-8 text-sm">No points awarded yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Bar chart */}
            {(leaderboard ?? []).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">Top Players by Points</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={(leaderboard ?? []).slice(0, 8).map((p: any) => ({
                      name: (p.playerName ?? 'Player').split(' ')[0],
                      points: p.points,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="points" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick actions */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-4 h-4" />
                  Quick Award
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {POINT_REASONS.filter(r => r.points > 0).slice(0, 6).map(r => (
                    <Button
                      key={r.value}
                      variant="outline"
                      className="h-auto py-3 flex-col text-center"
                      onClick={() => { setReason(r.value); setPointsAmount(String(r.points)); setShowAddDialog(true); }}
                    >
                      <span className="text-amber-700 dark:text-amber-500 font-bold">+{r.points}</span>
                      <span className="text-xs mt-0.5 text-muted-foreground">{r.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  Point Rules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {POINT_REASONS.filter(r => r.points > 0).map(r => (
                    <div key={r.value} className="flex justify-between">
                      <span className="text-muted-foreground">{r.label}</span>
                      <span className="font-bold text-amber-700 dark:text-amber-500">+{r.points}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Award Points Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-700 dark:text-amber-500" />
              Award Points
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Step 1: Team Type */}
            <div>
              <Label className="block mb-1 text-xs uppercase tracking-wide">
                {language === 'ar' ? '① نوع الفريق' : '① Team Type'}
              </Label>
              <div className="flex gap-2 flex-wrap">
                {[{v:'all',en:'All',ar:'الكل'},{v:'main',en:'Main',ar:'الأول'},{v:'academy',en:'Academy',ar:'الأكاديمية'}].map(opt => (
                  <button key={opt.v} type="button"
                    onClick={() => { setDialogTeamTypeFilter(opt.v as any); setDialogSelectorTeamId(0); setSelectedPlayerId(''); }}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors border ${
                      dialogTeamTypeFilter === opt.v ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input hover:bg-muted'
                    }`}>
                    {language === 'ar' ? opt.ar : opt.en}
                  </button>
                ))}
              </div>
            </div>
            {/* Step 2: Sub-team */}
            <div>
              <Label className="block mb-1 text-xs uppercase tracking-wide">
                {language === 'ar' ? '② الفريق الفرعي (اختياري)' : '② Sub-team (optional)'}
              </Label>
              <select
                value={dialogSelectorTeamId}
                onChange={e => { setDialogSelectorTeamId(Number(e.target.value)); setSelectedPlayerId(''); }}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value={0}>{language === 'ar' ? 'كل الفرق' : 'All teams'}</option>
                {(dialogTeamTypeFilter === 'all' || dialogTeamTypeFilter === 'main') && mainTeams.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
                {(dialogTeamTypeFilter === 'all' || dialogTeamTypeFilter === 'academy') && academyTeams.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            {/* Step 3: Player */}
            <div>
              <Label className="block mb-1">
                {language === 'ar' ? '③ اللاعب' : '③ Player'}
              </Label>
              <select
                value={selectedPlayerId}
                onChange={e => setSelectedPlayerId(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select player...</option>
                {(allPlayers ?? []).filter((p: any) => {
                  const typeMatch = dialogTeamTypeFilter === 'all' || 
                    (allTeams as any[]).some((t: any) => t.id === p.teamId && t.teamType === dialogTeamTypeFilter);
                  const teamMatch = dialogSelectorTeamId > 0 ? p.teamId === dialogSelectorTeamId : true;
                  return typeMatch && teamMatch;
                }).map((p: any) => (
                  <option key={p.id} value={String(p.id)}>
                    #{p.jerseyNumber ?? '-'} {p.firstName} {p.lastName} — {p.ageGroup ?? 'N/A'}
                  </option>
                ))}
              </select>
              {(allPlayers ?? []).length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">Loading players...</p>
              )}
            </div>
            <div>
              <Label className="block mb-1">{t("points.reason")}</Label>
              <select
                value={reason}
                onChange={e => handleReasonChange(e.target.value)}
                className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select reason...</option>
                {POINT_REASONS.map(r => (
                  <option key={r.value} value={r.value}>
                    {r.label}{r.points > 0 ? ` (+${r.points})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Points Amount</Label>
              <Input
                type="number"
                value={pointsAmount}
                onChange={e => setPointsAmount(e.target.value)}
                placeholder="0"
                min="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddPoints} disabled={awardPoints.isPending} className="gap-2">
              <Plus className="w-4 h-4" />
              {awardPoints.isPending ? 'Saving...' : 'Award Points'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
