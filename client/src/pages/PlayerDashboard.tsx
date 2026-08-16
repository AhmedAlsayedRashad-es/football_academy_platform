import { useState } from 'react';
import { toast } from 'sonner';
import { Link, useParams , useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import SkillsRadar from '@/components/SkillsRadar';
import PlayerCard from '@/components/PlayerCard';
import { 
  User, Activity, Target, TrendingUp, Gift, 
  Calendar, Clock, Trophy, Star, ChevronRight,
  Play, Award, Zap, Settings, ArrowLeft, Dumbbell, CheckCircle2, Stethoscope, BarChart3, FileText, Share2, Globe, Lock, MessageSquare, Swords, Brain, Sparkles, TrendingDown, Minus, Loader2
} from 'lucide-react';

export default function PlayerDashboard() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const playerId = parseInt(id || '0');
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';
  
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  const [activeTab, setActiveTab] = useState('me');

  // Fetch player data
  const { data: player } = trpc.players.getByIdProtected.useQuery({ id: playerId }, { enabled: !!playerId });
  const { data: skillScore } = trpc.skillScores.getLatest.useQuery({ playerId }, { enabled: !!playerId });
  const { data: activities } = trpc.activities.getPlayerActivities.useQuery({ playerId, limit: 10 }, { enabled: !!playerId });
  const { data: weeklyTargets } = trpc.weeklyTargets.getPlayerTargets.useQuery({ playerId }, { enabled: !!playerId });
  const { data: points } = trpc.points.getPlayerPoints.useQuery({ playerId }, { enabled: !!playerId });
  const { data: attendance } = trpc.attendance.getPlayerRate.useQuery({ playerId }, { enabled: !!playerId });
  const { data: assignedDrills } = trpc.drillAssignments.getForPlayer.useQuery({ playerId }, { enabled: !!playerId });
  const { data: devGoals } = trpc.playerDevelopmentGoals.getByPlayer.useQuery({ playerId }, { enabled: !!playerId });
  const { data: achievements } = trpc.achievements.getPlayerAchievements.useQuery({ playerId }, { enabled: !!playerId });
  const { data: coachFeedback } = trpc.coachFeedback.getPlayerFeedback.useQuery({ playerId }, { enabled: !!playerId });
  const { data: matchHistoryData } = trpc.players.getMyMatchHistory.useQuery({ playerId, limit: 15 }, { enabled: !!playerId });
  const { data: matchInsightsData, isLoading: insightsLoading } = trpc.players.getMyMatchInsights.useQuery({ playerId }, { enabled: !!playerId && activeTab === 'matches' });
  const togglePublicProfile = trpc.players.togglePublicProfile.useMutation({
    onSuccess: () => { window.location.reload(); }
  });
  const isPublic = (player as any)?.isPublicProfile ?? false;
  const shareUrl = `${window.location.origin}/public/player/${playerId}`;
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
    }
    navigator.clipboard.writeText(shareUrl).then(() => toast.success('Profile link copied to clipboard!')).catch(() => toast.info('Share URL: ' + shareUrl));
  };

  // Transform skill score to expected format or use mock data
  // Map existing schema fields to display fields
  const mockSkills = {
    twoFooted: (skillScore as any)?.weakFootAbility ?? 46,
    dribbling: skillScore?.dribbling ?? 62,
    firstTouch: skillScore?.firstTouch ?? 60,
    agility: skillScore?.agility ?? 97,
    speed: skillScore?.speed ?? 70,
    power: (skillScore as any)?.strength ?? 71,
  };

  const mockPlayer = {
    name: player ? `${player.firstName} ${player.lastName}` : 'Player Name',
    position: player?.position || 'DM',
    photoUrl: player?.photoUrl || '',
    club: 'Future Stars Academy',
    nationality: 'Egypt',
  };

  const mockActivities = activities || [
    { id: 1, activityType: 'match', activityDate: new Date(), durationMinutes: 108, opponent: 'Future Stars FC', score: '2:0', possessions: 129, workRate: 43.9 },
    { id: 2, activityType: 'match', activityDate: new Date(Date.now() - 86400000), durationMinutes: 15, possessions: 8, workRate: 73.3 },
    { id: 3, activityType: 'training', activityDate: new Date(Date.now() - 172800000), durationMinutes: 96, ballTouches: 76 },
  ];

  const mockTargets = weeklyTargets || [
    { id: 1, targetType: 'speed_actions', targetValue: 50, currentValue: 35, isCompleted: false },
    { id: 2, targetType: 'ball_touches', targetValue: 100, currentValue: 76, isCompleted: false },
  ];

  return (
    <>
    <div className={` ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-background text-foreground sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/players')}
                className="text-foreground hover:bg-card"
              >
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
              <Link href="/">
                <img src="/logo-transparent.png" alt="Future Stars Academy" className="h-10" />
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/player/${playerId}/progress`)}
                className="text-foreground hover:bg-card flex items-center gap-1.5 text-xs border border-purple-700/40"
              >
                <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                Progress
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/player/${playerId}/medical`)}
                className="text-foreground hover:bg-card flex items-center gap-1.5 text-xs border border-cyan-700/40"
              >
                <Stethoscope className="h-4 w-4 text-cyan-700 dark:text-cyan-400" />
                Medical
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/player/${playerId}/scouting`)}
                className="text-foreground hover:bg-card flex items-center gap-1.5 text-xs border border-yellow-700/40"
              >
                <Target className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                Scouting
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/player/${playerId}/report`)}
                className="text-foreground hover:bg-card flex items-center gap-1.5 text-xs border border-green-700/40"
              >
                <FileText className="h-4 w-4 text-green-700 dark:text-green-400" />
                Full Report
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(activeTab === 'matches' ? 'me' : 'matches')}
                className={`hover:bg-card flex items-center gap-1.5 text-xs border ${activeTab === 'matches' ? 'text-orange-700 dark:text-orange-300 border-orange-400' : 'text-foreground border-orange-700/40'}`}
              >
                <Swords className="h-4 w-4 text-orange-700 dark:text-orange-400" />
                {isRTL ? 'المباريات' : 'Matches'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab(activeTab === 'notes' ? 'me' : 'notes')}
                className={`hover:bg-card flex items-center gap-1.5 text-xs border ${activeTab === 'notes' ? 'text-purple-600 dark:text-purple-300 border-purple-400' : 'text-foreground border-purple-700/40'}`}
              >
                <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                {isRTL ? 'ملاحظات' : 'Notes'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-foreground hover:bg-card flex items-center gap-1.5 text-xs border border-blue-700/40"
                title="Share public profile link"
              >
                <Share2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Share
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => togglePublicProfile.mutate({ playerId, isPublic: !isPublic })}
                className={`text-white hover:bg-card flex items-center gap-1.5 text-xs border ${isPublic ? 'border-green-700/40' : 'border-border/40'}`}
                title={isPublic ? 'Profile is public - click to make private' : 'Profile is private - click to make public'}
              >
                {isPublic ? <Globe className="h-4 w-4 text-green-700 dark:text-green-400" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                {isPublic ? 'Public' : 'Private'}
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Player Profile Header */}
      <div className="brand-gradient text-white py-6">
        <div className="container">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full bg-gray-300 overflow-hidden cursor-pointer border-2 border-cyan-400"
              onClick={() => setShowPlayerCard(true)}
            >
              {mockPlayer.photoUrl ? (
                <img src={mockPlayer.photoUrl} alt={mockPlayer.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl text-gray-600">
                  {mockPlayer.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-xl font-bold">{mockPlayer.name}</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <div className="w-5 h-3 flex flex-col rounded overflow-hidden">
                    <div className="flex-1 bg-red-600" />
                    <div className="flex-1 bg-white" />
                    <div className="flex-1 bg-black" />
                  </div>
                </span>
                <span>{mockPlayer.position}</span>
                <span>•</span>
                <span>{mockPlayer.club || 'Future Stars Academy'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Targets */}
      <div className="bg-card py-4 border-b border-border">
        <div className="container">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-foreground font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              {isRTL ? 'الأهداف الأسبوعية' : 'Weekly targets'}
            </h2>
            <Button variant="link" className="text-cyan-700 dark:text-cyan-400 text-sm p-0">
              + {isRTL ? 'إضافة' : 'Add'} <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {mockTargets.map((target: any) => (
              <Card key={target.id} className="bg-muted/50 border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {target.targetType === 'speed_actions' ? (
                      <Zap className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                    ) : (
                      <Activity className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                    )}
                    <span className="text-sm text-muted-foreground">
                      {target.targetType === 'speed_actions' 
                        ? (isRTL ? 'حركات السرعة' : 'Speed actions')
                        : (isRTL ? 'لمسات الكرة' : 'Ball touches')}
                    </span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {target.currentValue || '--'} / {target.targetValue || '--'}
                  </div>
                  <Progress 
                    value={target.currentValue ? (target.currentValue / target.targetValue) * 100 : 0} 
                    className="h-1 mt-2"
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Assigned Drills Section */}
      {assignedDrills && assignedDrills.length > 0 && (
        <div className="brand-gradient-subtle py-4 border-b border-border">
          <div className="container">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-foreground font-semibold flex items-center gap-2">
                <Dumbbell className="h-4 w-4 text-cyan-700 dark:text-cyan-400" />
                {isRTL ? 'التمارين المعينة لك' : 'Assigned Drills'}
              </h2>
              <Badge className="bg-cyan-600">
                {assignedDrills.filter((d: any) => d.status === 'pending').length} {isRTL ? 'معلق' : 'pending'}
              </Badge>
            </div>
            <div className="space-y-3">
              {assignedDrills.slice(0, 3).map((drill: any) => (
                <Card key={drill.id} className={`border ${drill.status === 'completed' ? 'bg-green-900/20 border-green-700' : 'bg-muted/50 border-border'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${drill.status === 'completed' ? 'bg-green-600' : 'bg-cyan-600'}`}>
                          {drill.status === 'completed' ? (
                            <CheckCircle2 className="h-5 w-5 text-foreground" />
                          ) : (
                            <Dumbbell className="h-5 w-5 text-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="text-foreground font-medium">{isRTL ? drill.drillNameAr || drill.drillName : drill.drillName}</p>
                          <p className="text-xs text-muted-foreground">
                            {drill.category && <span className="capitalize">{drill.category.replace('_', ' ')}</span>}
                            {drill.dueDate && (
                              <span className="ml-2">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(drill.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${drill.priority === 'high' ? 'bg-red-600' : drill.priority === 'medium' ? 'bg-yellow-600' : 'bg-green-600'}`}>
                          {drill.priority}
                        </Badge>
                        {drill.status !== 'completed' && (
                          <Link href="/training-library">
                            <Button size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-xs">
                              {isRTL ? 'ابدأ' : 'Start'}
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                    {drill.reason && (
                      <p className="text-xs text-muted-foreground mt-2 italic">
                        {isRTL ? 'ملاحظة المدرب: ' : 'Coach note: '}{drill.reason}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {assignedDrills.length > 3 && (
                <Button variant="link" className="text-cyan-700 dark:text-cyan-400 text-sm w-full">
                  {isRTL ? `عرض الكل (${assignedDrills.length})` : `View all (${assignedDrills.length})`}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Development Goals Section */}
      {devGoals && devGoals.length > 0 && (
        <div className="brand-gradient-subtle py-4 border-b border-border">
          <div className="container">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-foreground font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                {isRTL ? 'أهداف التطوير' : 'Development Goals'}
              </h2>
              <Badge className="bg-purple-700">
                {devGoals.filter((g: any) => g.progress < 100).length} {isRTL ? 'نشط' : 'active'}
              </Badge>
            </div>
            <div className="space-y-3">
              {devGoals.slice(0, 4).map((goal: any) => (
                <Card key={goal.id} className={`border ${
                  goal.progress >= 100 ? 'bg-green-900/20 border-green-700' : 'bg-muted/50 border-purple-900/40'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-foreground font-medium text-sm">{goal.title}</span>
                          <Badge className={`text-xs ${
                            goal.priority === 'high' ? 'bg-red-700' :
                            goal.priority === 'medium' ? 'bg-yellow-700' : 'bg-green-700'
                          }`}>{goal.category}</Badge>
                        </div>
                        {goal.description && (
                          <p className="text-xs text-muted-foreground mb-2">{goal.description}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Progress value={goal.progress || 0} className="h-1.5 flex-1" />
                          <span className="text-xs text-purple-600 dark:text-purple-300 font-bold whitespace-nowrap">{goal.progress || 0}%</span>
                        </div>
                        {goal.targetDate && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(goal.targetDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {goal.progress >= 100 && (
                        <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {devGoals.length > 4 && (
                <p className="text-xs text-center text-muted-foreground">
                  +{devGoals.length - 4} {isRTL ? 'هدف آخر' : 'more goals'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Badges & Achievements Section */}
      {achievements && achievements.length > 0 && (
        <div className="container py-4">
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                {isRTL ? 'الإنجازات والشارات' : 'Achievements & Badges'}
                <span className="ml-auto text-xs font-normal text-muted-foreground">{achievements.length} {isRTL ? 'إنجاز' : 'earned'}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {achievements.map((ach: any) => {
                  const categoryColors: Record<string, string> = {
                    /* Translucent accent tints rather than solid dark stops, so the
                       card sits on whichever surface the active theme provides and
                       the token-coloured text inside stays readable in both. */
                    technical: 'from-blue-500/15 to-blue-500/5 border-blue-500/30',
                    physical: 'from-green-500/15 to-green-500/5 border-green-500/30',
                    mental: 'from-purple-500/15 to-purple-500/5 border-purple-500/30',
                    nutritional: 'from-orange-500/15 to-orange-500/5 border-orange-500/30',
                    milestone: 'from-yellow-500/15 to-yellow-500/5 border-yellow-500/30',
                    award: 'from-red-500/15 to-red-500/5 border-red-500/30',
                  };
                  const categoryIcons: Record<string, string> = {
                    technical: '⚽', physical: '💪', mental: '🧠',
                    nutritional: '🥗', milestone: '🏆', award: '🥇',
                  };
                  const colorClass = categoryColors[ach.category] || 'from-muted to-muted/40 border-border';
                  const icon = ach.iconType || categoryIcons[ach.category] || '🌟';
                  return (
                    <div
                      key={ach.id}
                      className={`rounded-xl border bg-gradient-to-br ${colorClass} p-3 flex flex-col items-center text-center gap-1`}
                    >
                      <div className="text-2xl mb-1">{icon}</div>
                      <p className="text-foreground text-xs font-semibold leading-tight">{ach.title}</p>
                      {ach.description && (
                        <p className="text-muted-foreground text-xs leading-tight line-clamp-2">{ach.description}</p>
                      )}
                      <p className="text-muted-foreground text-xs mt-1">
                        {new Date(ach.achievedDate).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Completed Goals as Milestone Badges */}
      {devGoals && devGoals.filter((g: any) => g.progress >= 100).length > 0 && (
        <div className="container pb-4">
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-green-700 dark:text-green-400" />
                {isRTL ? 'أهداف مكتملة' : 'Completed Goals'}
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {devGoals.filter((g: any) => g.progress >= 100).length} {isRTL ? 'مكتمل' : 'completed'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {devGoals.filter((g: any) => g.progress >= 100).map((goal: any) => (
                  <div
                    key={goal.id}
                    className="flex items-center gap-3 rounded-xl bg-green-900/20 border border-green-700/50 px-4 py-3"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-foreground text-sm font-semibold truncate">{goal.title}</p>
                      <p className="text-green-700 dark:text-green-400 text-xs">{goal.category} · 100% {isRTL ? 'مكتمل' : 'complete'}</p>
                    </div>
                    <div className="ml-auto text-xl flex-shrink-0">🎯</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Skills Section */}
      <div className="container py-6">
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                {isRTL ? 'المهارات' : 'Skills'}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-cyan-700 dark:text-cyan-400"
                onClick={() => setShowPlayerCard(true)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <SkillsRadar skills={mockSkills} size={280} showLabels={true} showTrends={true} />
            <p className="text-xs text-muted-foreground text-center mt-4">
              * {isRTL ? 'بناءً على الأنشطة منذ' : 'Based on activities since'} November 14, 2025
              <br />
              {isRTL ? 'محسوب لـ' : 'Calculated for'} {mockPlayer.position}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Match History Section */}
      {activeTab === 'matches' && (
        <div className="container py-4">
          {/* Career Totals Summary */}
          {matchHistoryData?.totals && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <Card className="bg-card/80 border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-foreground">{matchHistoryData.totals.matchesPlayed}</p>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'مباريات' : 'Matches'}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{matchHistoryData.totals.goals}</p>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'أهداف' : 'Goals'}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{matchHistoryData.totals.assists}</p>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'تمريرات حاسمة' : 'Assists'}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-green-700 dark:text-green-400">{matchHistoryData.totals.minutesPlayed}</p>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'دقيقة' : 'Minutes'}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{matchHistoryData.totals.avgRating ?? '--'}</p>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'متوسط التقييم' : 'Avg Rating'}</p>
                </CardContent>
              </Card>
              <Card className="bg-card/80 border-border">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{matchHistoryData.totals.yellowCards}<span className="text-red-600 dark:text-red-400">/{matchHistoryData.totals.redCards}</span></p>
                  <p className="text-xs text-muted-foreground">{isRTL ? 'بطاقات ص/ح' : 'Y/R Cards'}</p>
                </CardContent>
              </Card>
            </div>
          )}
          {/* AI Insights Section */}
          <Card className="brand-gradient-subtle border-purple-700/50 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                {isRTL ? 'تحليل الأداء بالذكاء الاصطناعي' : 'AI Performance Insights'}
                {matchInsightsData?.matchesAnalyzed && (
                  <span className="ml-auto text-xs font-normal text-purple-600 dark:text-purple-300">{isRTL ? `بناءً على ${matchInsightsData.matchesAnalyzed} مباريات` : `Based on ${matchInsightsData.matchesAnalyzed} matches`}</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {insightsLoading ? (
                <div className="flex items-center justify-center py-8 gap-3">
                  <Loader2 className="h-6 w-6 text-purple-600 dark:text-purple-400 animate-spin" />
                  <p className="text-muted-foreground text-sm">{isRTL ? 'جاري تحليل بيانات مبارياتك...' : 'Analyzing your match data...'}</p>
                </div>
              ) : matchInsightsData ? (
                <div className="space-y-4">
                  {/* Trend + Score Row */}
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                      matchInsightsData.performanceTrend === 'improving' ? 'bg-green-900/30 border-green-700 text-green-700 dark:text-green-400' :
                      matchInsightsData.performanceTrend === 'declining' ? 'bg-red-900/30 border-red-700 text-red-600 dark:text-red-400' :
                      matchInsightsData.performanceTrend === 'stable' ? 'bg-blue-900/30 border-blue-700 text-blue-600 dark:text-blue-400' :
                      'bg-muted/50 border-border text-muted-foreground'
                    }`}>
                      {matchInsightsData.performanceTrend === 'improving' ? <TrendingUp className="h-4 w-4" /> :
                       matchInsightsData.performanceTrend === 'declining' ? <TrendingDown className="h-4 w-4" /> :
                       matchInsightsData.performanceTrend === 'stable' ? <Minus className="h-4 w-4" /> :
                       <Brain className="h-4 w-4" />}
                      <span className="text-sm font-semibold">
                        {matchInsightsData.performanceTrend === 'improving' ? (isRTL ? 'أداء في تحسن' : 'Improving') :
                         matchInsightsData.performanceTrend === 'declining' ? (isRTL ? 'أداء في تراجع' : 'Declining') :
                         matchInsightsData.performanceTrend === 'stable' ? (isRTL ? 'أداء مستقر' : 'Stable') :
                         (isRTL ? 'بيانات غير كافية' : 'Insufficient Data')}
                      </span>
                    </div>
                    {matchInsightsData.overallScore !== null && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-900/30 border border-purple-700">
                        <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-purple-600 dark:text-purple-300 font-bold text-sm">{matchInsightsData.overallScore}/100</span>
                        <span className="text-muted-foreground text-xs">{isRTL ? 'نقاط الأداء' : 'Performance Score'}</span>
                      </div>
                    )}
                  </div>
                  {/* Trend Reason */}
                  {matchInsightsData.trendReason && (
                    <p className="text-muted-foreground text-sm leading-relaxed italic">{matchInsightsData.trendReason}</p>
                  )}
                  {/* Strengths & Focus Areas */}
                  <div className="grid grid-cols-1 gap-3">
                    {matchInsightsData.topStrengths.length > 0 && (
                      <div className="rounded-lg bg-green-900/20 border border-green-800/50 p-3">
                        <p className="text-green-700 dark:text-green-400 text-xs font-semibold uppercase tracking-wider mb-2">{isRTL ? 'نقاط القوة' : 'Strengths'}</p>
                        <ul className="space-y-1">
                          {matchInsightsData.topStrengths.map((s: string, i: number) => (
                            <li key={i} className="text-muted-foreground text-sm flex items-start gap-2"><span className="text-green-700 dark:text-green-400 mt-0.5">•</span>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {matchInsightsData.focusAreas.length > 0 && (
                      <div className="rounded-lg bg-orange-900/20 border border-orange-800/50 p-3">
                        <p className="text-orange-700 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">{isRTL ? 'مجالات التطوير' : 'Focus Areas'}</p>
                        <ul className="space-y-1">
                          {matchInsightsData.focusAreas.map((f: string, i: number) => (
                            <li key={i} className="text-muted-foreground text-sm flex items-start gap-2"><span className="text-orange-700 dark:text-orange-400 mt-0.5">•</span>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  {/* Training Recommendations */}
                  {matchInsightsData.trainingRecommendations.length > 0 && (
                    <div className="rounded-lg bg-blue-900/20 border border-blue-800/50 p-3">
                      <p className="text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">{isRTL ? 'تمارين مقترحة' : 'Training Recommendations'}</p>
                      <ul className="space-y-1">
                        {matchInsightsData.trainingRecommendations.map((r: string, i: number) => (
                          <li key={i} className="text-muted-foreground text-sm flex items-start gap-2"><span className="text-blue-600 dark:text-blue-400 mt-0.5">{i + 1}.</span>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Weekly Goal */}
                  {matchInsightsData.weeklyGoal && (
                    <div className="rounded-lg bg-yellow-900/20 border border-yellow-800/50 p-3">
                      <p className="text-yellow-700 dark:text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-1">{isRTL ? 'هدف المباراة القادمة' : 'Next Match Goal'}</p>
                      <p className="text-foreground text-sm font-medium">{matchInsightsData.weeklyGoal}</p>
                    </div>
                  )}
                  {/* Motivational Message */}
                  {matchInsightsData.motivationalMessage && (
                    <div className="rounded-lg bg-purple-900/20 border border-purple-800/50 p-3 flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                      <p className="text-purple-800 dark:text-purple-200 text-sm italic">{matchInsightsData.motivationalMessage}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">{isRTL ? 'لا تتوفر بيانات مباريات كافية للتحليل' : 'Not enough match data for AI analysis yet'}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Match List */}
          <Card className="bg-card/80 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Swords className="h-5 w-5 text-orange-700 dark:text-orange-400" />
                {isRTL ? 'سجل المباريات' : 'Match History'}
                {matchHistoryData?.matches && <span className="ml-auto text-xs font-normal text-muted-foreground">{matchHistoryData.matches.length} {isRTL ? 'مباراة' : 'matches'}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {matchHistoryData?.matches && matchHistoryData.matches.length > 0 ? (
                <div className="space-y-3">
                  {matchHistoryData.matches.map((match: any) => {
                    const resultColor = match.result === 'win' ? 'text-green-700 dark:text-green-400 border-green-700' : match.result === 'loss' ? 'text-red-600 dark:text-red-400 border-red-700' : 'text-yellow-700 dark:text-yellow-400 border-yellow-700';
                    const resultBg = match.result === 'win' ? 'bg-green-900/20' : match.result === 'loss' ? 'bg-red-900/20' : 'bg-yellow-900/20';
                    const resultLabel = match.result === 'win' ? (isRTL ? 'فوز' : 'W') : match.result === 'loss' ? (isRTL ? 'خسارة' : 'L') : (isRTL ? 'تعادل' : 'D');
                    return (
                      <div key={match.id} className={`rounded-lg border p-3 ${resultBg} border-border`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded border ${resultColor}`}>{resultLabel}</span>
                            <div>
                              <p className="text-foreground text-sm font-semibold">{isRTL ? 'ضد' : 'vs'} {match.opponent || (isRTL ? 'منافس' : 'Opponent')}</p>
                              <p className="text-muted-foreground text-xs">
                                {match.matchDate ? new Date(match.matchDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US') : ''}
                                {match.matchType && <span className="ml-2 capitalize">{match.matchType.replace('_', ' ')}</span>}
                              </p>
                            </div>
                          </div>
                          {(match.teamScore !== null || match.opponentScore !== null) && (
                            <div className="text-right">
                              <p className="text-foreground font-bold">{match.teamScore ?? 0} - {match.opponentScore ?? 0}</p>
                              <p className="text-muted-foreground text-xs">{match.isHome ? (isRTL ? 'ملعبنا' : 'Home') : (isRTL ? 'ملعب الخصم' : 'Away')}</p>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-border">
                          <div className="text-center">
                            <p className="text-yellow-700 dark:text-yellow-400 font-bold text-sm">{match.goals ?? 0}</p>
                            <p className="text-muted-foreground text-xs">{isRTL ? 'أهداف' : 'Goals'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-cyan-700 dark:text-cyan-400 font-bold text-sm">{match.assists ?? 0}</p>
                            <p className="text-muted-foreground text-xs">{isRTL ? 'تمريرات' : 'Assists'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-green-700 dark:text-green-400 font-bold text-sm">{match.minutesPlayed ?? 0}'</p>
                            <p className="text-muted-foreground text-xs">{isRTL ? 'دقائق' : 'Mins'}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-purple-600 dark:text-purple-400 font-bold text-sm">{match.coachRating ? `${match.coachRating}/10` : '--'}</p>
                            <p className="text-muted-foreground text-xs">{isRTL ? 'تقييم' : 'Rating'}</p>
                          </div>
                        </div>
                        {(match.shots > 0 || match.passes > 0 || match.tackles > 0) && (
                          <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-border/50">
                            {match.shots > 0 && <div className="text-center"><p className="text-orange-700 dark:text-orange-400 text-xs font-semibold">{match.shots} ({match.shotsOnTarget ?? 0})</p><p className="text-gray-600 text-xs">{isRTL ? 'تسديدات' : 'Shots'}</p></div>}
                            {match.passes > 0 && <div className="text-center"><p className="text-blue-600 dark:text-blue-400 text-xs font-semibold">{match.passes} ({match.passAccuracy ?? 0}%)</p><p className="text-gray-600 text-xs">{isRTL ? 'تمريرات' : 'Passes'}</p></div>}
                            {match.tackles > 0 && <div className="text-center"><p className="text-red-600 dark:text-red-400 text-xs font-semibold">{match.tackles}</p><p className="text-gray-600 text-xs">{isRTL ? 'تدخلات' : 'Tackles'}</p></div>}
                          </div>
                        )}
                        {match.notes && <p className="text-muted-foreground text-xs mt-2 italic">{match.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Swords className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">{isRTL ? 'لا توجد مباريات مسجلة بعد' : 'No match history yet'}</p>
                  <p className="text-sm mt-1 text-muted-foreground">{isRTL ? 'ستظهر هنا إحصائيات مبارياتك عند إضافتها' : 'Your match statistics will appear here when added by your coach'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Coach Notes Section */}
      {activeTab === 'notes' && (
        <div className="container py-4">
          <Card className="bg-card/80 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                {isRTL ? 'ملاحظات المدرب' : "Coach's Notes"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(coachFeedback as any[])?.length ? (
                <div className="space-y-4">
                  {(coachFeedback as any[]).map((fb: any) => (
                    <div key={fb.id} className="p-4 rounded-lg bg-muted/60 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                            {(fb.coachName || 'C')[0]}
                          </div>
                          <div>
                            <p className="text-foreground text-sm font-semibold">{fb.coachName || (isRTL ? 'المدرب' : 'Coach')}</p>
                            <p className="text-muted-foreground text-xs">{fb.feedbackDate ? new Date(fb.feedbackDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-US') : ''}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-3 w-3 ${i < Math.round((fb.rating || 0) / 2) ? 'text-yellow-700 dark:text-yellow-400 fill-yellow-400' : 'text-gray-600'}`} />
                          ))}
                          <span className="text-yellow-700 dark:text-yellow-400 text-sm font-bold ml-1">{fb.rating || 0}/10</span>
                        </div>
                      </div>
                      {fb.category && <Badge className="mb-2 text-xs bg-purple-900/50 text-purple-600 dark:text-purple-300 border-purple-700">{fb.category}</Badge>}
                      {fb.strengths && <div className="mb-2"><p className="text-green-700 dark:text-green-400 text-xs font-semibold mb-1">{isRTL ? 'نقاط القوة:' : 'Strengths:'}</p><p className="text-muted-foreground text-sm">{fb.strengths}</p></div>}
                      {fb.areasToImprove && <div className="mb-2"><p className="text-orange-700 dark:text-orange-400 text-xs font-semibold mb-1">{isRTL ? 'مجالات التحسين:' : 'Areas to Improve:'}</p><p className="text-muted-foreground text-sm">{fb.areasToImprove}</p></div>}
                      {fb.recommendations && <div><p className="text-cyan-700 dark:text-cyan-400 text-xs font-semibold mb-1">{isRTL ? 'التوصيات:' : 'Recommendations:'}</p><p className="text-muted-foreground text-sm">{fb.recommendations}</p></div>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">{isRTL ? 'لا توجد ملاحظات من المدرب بعد' : 'No coach notes yet'}</p>
                  <p className="text-sm mt-1 text-muted-foreground">{isRTL ? 'ستظهر هنا ملاحظات المدرب عند إضافتها' : 'Coach feedback will appear here when added'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around py-2">
          <button 
            onClick={() => setActiveTab('me')}
            className={`flex flex-col items-center p-2 ${activeTab === 'me' ? 'text-cyan-600' : 'text-muted-foreground'}`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">{isRTL ? 'أنا' : 'Me'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('activities')}
            className={`flex flex-col items-center p-2 ${activeTab === 'activities' ? 'text-cyan-600' : 'text-muted-foreground'}`}
          >
            <Activity className="h-5 w-5" />
            <span className="text-xs mt-1">{isRTL ? 'الأنشطة' : 'Activities'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('targets')}
            className={`flex flex-col items-center p-2 ${activeTab === 'targets' ? 'text-cyan-600' : 'text-muted-foreground'}`}
          >
            <Target className="h-5 w-5" />
            <span className="text-xs mt-1">{isRTL ? 'الأهداف' : 'Targets'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('trends')}
            className={`flex flex-col items-center p-2 ${activeTab === 'trends' ? 'text-cyan-600' : 'text-muted-foreground'}`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs mt-1">{isRTL ? 'التطور' : 'Trends'}</span>
          </button>
          <button 
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center p-2 relative ${activeTab === 'explore' ? 'text-cyan-600' : 'text-muted-foreground'}`}
          >
            <div className="relative">
              <Play className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs rounded-full w-4 h-4 flex items-center justify-center">
                4
              </span>
            </div>
            <span className="text-xs mt-1">{isRTL ? 'استكشف' : 'Explore'}</span>
          </button>
        </div>
      </nav>

      {/* Player Card Modal */}
      {showPlayerCard && (
        <PlayerCard
          player={{
            name: mockPlayer.name,
            position: mockPlayer.position,
            photoUrl: mockPlayer.photoUrl,
            club: mockPlayer.club,
            nationality: mockPlayer.nationality,
            skills: mockSkills,
          }}
          onClose={() => setShowPlayerCard(false)}
        />
      )}

      {/* Spacer for bottom nav */}
      <div className="h-20" />
    </div>
    </>
  );
}
