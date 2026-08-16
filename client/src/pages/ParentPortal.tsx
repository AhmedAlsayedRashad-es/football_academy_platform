import { useState } from "react";
import { Link, useLocation} from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import SkillsRadar from "@/components/SkillsRadar";
import PlayerCard from "@/components/PlayerCard";
import { 
  User, Activity, Brain, Dumbbell, Apple, Target, TrendingUp, 
  Calendar, Bell, MessageSquare, Star, Award, Clock, ArrowLeft,
  Gift, Zap, Trophy, CheckCircle2, XCircle, Video, FileText,
  Stethoscope, Search, BarChart3, BookOpen, ClipboardList, ChevronRight
} from "lucide-react";

function ProgressRing({ value, label, color }: { value: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="100" height="100" className="transform -rotate-90">
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={color}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{value}</span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground mt-2">{label}</span>
    </div>
  );
}

export default function ParentPortal() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [showPlayerCard, setShowPlayerCard] = useState(false);
  
  // players.getAll is staff-only, so it 403s for the very role this page is for
  // and the child selector stayed empty. Parents read their linked children;
  // staff opening this page keep the full roster.
  const { user } = useAuth();
  const isParent = user?.role === "parent";
  const { data: allPlayers } = trpc.players.getAll.useQuery(undefined, { enabled: !!user && !isParent });
  const { data: children } = trpc.parentDashboard.getChildrenSummary.useQuery(undefined, { enabled: isParent });
  // Only id/firstName/lastName are needed to populate the child selector.
  const players = isParent
    ? children?.flatMap(c => (c && c.playerId != null
        ? [{ id: c.playerId, firstName: c.firstName, lastName: c.lastName }]
        : []))
    : allPlayers;
  const { data: performance } = trpc.performance.getPlayerMetrics.useQuery(
    { playerId: parseInt(selectedChild), limit: 1 },
    { enabled: !!selectedChild }
  );
  const { data: mental } = trpc.mental.getPlayerAssessments.useQuery(
    { playerId: parseInt(selectedChild), limit: 1 },
    { enabled: !!selectedChild }
  );
  const { data: attendance } = trpc.attendance.getPlayerAttendance.useQuery(
    { playerId: parseInt(selectedChild) },
    { enabled: !!selectedChild }
  );
  const { data: playerPoints } = trpc.points.getPlayerPoints.useQuery(
    { playerId: parseInt(selectedChild) },
    { enabled: !!selectedChild }
  );
  const { data: skillScore } = trpc.skillScores.getLatest.useQuery(
    { playerId: parseInt(selectedChild) },
    { enabled: !!selectedChild }
  );
  const { data: playerActivities } = trpc.activities.getPlayerActivities.useQuery(
    { playerId: parseInt(selectedChild), limit: 5 },
    { enabled: !!selectedChild }
  );
  const { data: weeklyTargetsData } = trpc.weeklyTargets.getPlayerTargets.useQuery(
    { playerId: parseInt(selectedChild) },
    { enabled: !!selectedChild }
  );
  const { data: assignedDrills } = trpc.drillAssignments.getForPlayer.useQuery(
    { playerId: parseInt(selectedChild) },
    { enabled: !!selectedChild }
  );
  const { data: playerFees } = trpc.finance.getPlayerFees.useQuery(
    { playerId: parseInt(selectedChild) } as any,
    { enabled: !!selectedChild }
  );
  const utils = trpc.useUtils();
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null);
  const [goalCommentText, setGoalCommentText] = useState('');
  const addGoalComment = trpc.goalComments.add.useMutation({
    onSuccess: () => {
      setGoalCommentText('');
      utils.goalComments.getByGoal.invalidate();
    },
  });
  const { data: developmentGoals } = trpc.playerDevelopmentGoals.getByPlayer.useQuery(
    { playerId: parseInt(selectedChild) },
    { enabled: !!selectedChild }
  );

  const latestPerformance = performance?.[0];
  const latestMental = mental?.[0];
  // Full record for the chosen child. getByIdProtected is role-aware: staff may
  // read any player, a parent only one they are linked to — so this works for
  // both without handing parents the whole roster.
  const { data: selectedPlayer } = trpc.players.getByIdProtected.useQuery(
    { id: parseInt(selectedChild) },
    { enabled: !!selectedChild }
  );

  // Attendance rate is pre-computed by the server
  const attendanceRate = attendance?.attendanceRate ?? 0;

  // Mock skills data (in real app, would come from player data)
  const mockSkills = {
    twoFooted: 46,
    dribbling: 62,
    firstTouch: 60,
    agility: 97,
    speed: 70,
    power: 71,
  };

  // Mock weekly targets
  const weeklyTargets = [
    { name: isRTL ? 'إجراءات السرعة' : 'Speed actions', current: 35, target: 50, icon: Zap },
    { name: isRTL ? 'لمسات الكرة' : 'Ball touches', current: 76, target: 100, icon: Target },
    { name: isRTL ? 'جلسات التدريب' : 'Training sessions', current: 4, target: 5, icon: Activity },
  ];

  // Mock activities
  const recentActivities = [
    { 
      type: 'training', 
      title: isRTL ? 'تدريب تقني' : 'Technical Training',
      date: new Date(Date.now() - 86400000),
      duration: 90,
      attended: true,
      workRate: 85,
      possessions: 47
    },
    { 
      type: 'match', 
      title: isRTL ? 'مباراة ودية' : 'Friendly Match',
      date: new Date(Date.now() - 172800000),
      duration: 70,
      attended: true,
      workRate: 92,
      possessions: 38,
      goals: 1,
      assists: 0
    },
    { 
      type: 'training', 
      title: isRTL ? 'تدريب بدني' : 'Physical Training',
      date: new Date(Date.now() - 259200000),
      duration: 60,
      attended: true,
      workRate: 78,
      possessions: 0
    },
  ];

  // Mock upcoming events
  const upcomingEvents = [
    { title: isRTL ? 'تدريب تقني' : 'Technical Training', date: new Date(Date.now() + 86400000), time: '09:00', type: 'training' },
    { title: isRTL ? 'مباراة الدوري' : 'U-14 League Match', date: new Date(Date.now() + 172800000), time: '14:00', type: 'match' },
    { title: isRTL ? 'استشارة التغذية' : 'Nutrition Consultation', date: new Date(Date.now() + 259200000), time: '11:00', type: 'appointment' },
  ];

  // Mock achievements
  const achievements = [
    { title: isRTL ? 'سريع البرق' : 'Speed Demon', description: isRTL ? 'وصل لسرعة 28 كم/س' : 'Reached top speed of 28 km/h' },
    { title: isRTL ? 'لاعب فريق' : 'Team Player', description: isRTL ? 'أعلى تمريرات حاسمة هذا الشهر' : 'Highest assist count this month' },
    { title: isRTL ? 'إرادة حديدية' : 'Iron Will', description: isRTL ? 'حضور مثالي لـ 30 يوم' : 'Perfect attendance for 30 days' },
  ];

  return (
    <>
    <div className={` ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-background text-foreground sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-foreground hover:bg-card"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
              <Link href="/">
                <img src="/logo-transparent.png" alt="Future Stars Academy" className="h-10" />
              </Link>
              <h1 className="text-xl font-bold">{isRTL ? 'بوابة الوالدين' : 'Parent Portal'}</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-foreground">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-foreground">
                <MessageSquare className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Child Selection */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap text-foreground">
                {isRTL ? 'اختر طفلك:' : 'Select Child:'}
              </Label>
              <Select value={selectedChild} onValueChange={setSelectedChild}>
                <SelectTrigger className="max-w-xs bg-muted border-border text-foreground">
                  <SelectValue placeholder={isRTL ? 'اختر طفلك' : 'Choose your child'} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {players?.map((player) => (
                    <SelectItem key={player.id} value={player.id.toString()} className="text-foreground hover:bg-muted">
                      {player.firstName} {player.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedChild && selectedPlayer ? (
          <>
            {/* Player Profile Header - FIFA Style */}
            <div className="brand-gradient rounded-xl p-6">
              <div className="flex items-center gap-6">
                <div 
                  className="relative cursor-pointer"
                  onClick={() => setShowPlayerCard(true)}
                >
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                    <User className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-yellow-500 rounded-full p-1">
                    <Star className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white">
                    {selectedPlayer.firstName} {selectedPlayer.lastName}
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge className="bg-cyan-600">{selectedPlayer.position || 'MF'}</Badge>
                    <Badge variant="outline" className="text-muted-foreground border-border">
                      {isRTL ? 'العمر:' : 'Age:'} {selectedPlayer.dateOfBirth ? 
                        Math.floor((Date.now() - new Date(selectedPlayer.dateOfBirth).getTime()) / 31557600000) : 'N/A'
                      }
                    </Badge>
                    <Badge variant="outline" className="text-muted-foreground border-border capitalize">
                      {selectedPlayer.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1">
                      <Gift className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                      <span className="text-yellow-700 dark:text-yellow-400 font-bold">{playerPoints?.points || 0}</span>
                      <span className="text-muted-foreground text-sm">{isRTL ? 'نقطة' : 'pts'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-400 font-bold">{attendanceRate}%</span>
                      <span className="text-muted-foreground text-sm">{isRTL ? 'حضور' : 'attendance'}</span>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-5xl font-bold text-cyan-700 dark:text-cyan-400">
                    {latestPerformance?.overallScore || 78}
                  </div>
                  <p className="text-sm text-muted-foreground">{isRTL ? 'التقييم العام' : 'Overall Rating'}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="bg-card/50 border border-border">
                <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600">
                  {isRTL ? 'نظرة عامة' : 'Overview'}
                </TabsTrigger>
                <TabsTrigger value="skills" className="data-[state=active]:bg-cyan-600">
                  {isRTL ? 'المهارات' : 'Skills'}
                </TabsTrigger>
                <TabsTrigger value="activities" className="data-[state=active]:bg-cyan-600">
                  {isRTL ? 'الأنشطة' : 'Activities'}
                </TabsTrigger>
                <TabsTrigger value="targets" className="data-[state=active]:bg-cyan-600">
                  {isRTL ? 'الأهداف' : 'Targets'}
                </TabsTrigger>
                <TabsTrigger value="attendance" className="data-[state=active]:bg-cyan-600">
                  {isRTL ? 'الحضور' : 'Attendance'}
                </TabsTrigger>
                <TabsTrigger value="fees" className="data-[state=active]:bg-cyan-600">
                  {isRTL ? 'الرسوم' : 'Fees'}
                </TabsTrigger>
                <TabsTrigger value="goals" className="data-[state=active]:bg-cyan-600">
                  {isRTL ? 'أهداف التطوير' : 'Dev Goals'}
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="bg-card/50 border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-700 dark:text-cyan-400">
                          <Target className="h-5 w-5" />
                        </div>
                        <Badge className="bg-green-600 text-xs">+5%</Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{isRTL ? 'تقني' : 'Technical'}</h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-foreground">{latestPerformance?.technicalScore || 75}</span>
                        <span className="text-sm text-muted-foreground">/100</span>
                      </div>
                      <Progress value={latestPerformance?.technicalScore || 75} className="h-1.5" />
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-green-600/20 text-green-700 dark:text-green-400">
                          <Dumbbell className="h-5 w-5" />
                        </div>
                        <Badge className="bg-green-600 text-xs">+3%</Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{isRTL ? 'بدني' : 'Physical'}</h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-foreground">{latestPerformance?.physicalScore || 72}</span>
                        <span className="text-sm text-muted-foreground">/100</span>
                      </div>
                      <Progress value={latestPerformance?.physicalScore || 72} className="h-1.5" />
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-purple-600/20 text-purple-600 dark:text-purple-400">
                          <Brain className="h-5 w-5" />
                        </div>
                        <Badge className="bg-yellow-600 text-xs">-2%</Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{isRTL ? 'ذهني' : 'Mental'}</h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-foreground">{latestMental?.overallMentalScore || 80}</span>
                        <span className="text-sm text-muted-foreground">/100</span>
                      </div>
                      <Progress value={latestMental?.overallMentalScore || 80} className="h-1.5" />
                    </CardContent>
                  </Card>

                  <Card className="bg-card/50 border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-yellow-600/20 text-yellow-700 dark:text-yellow-400">
                          <Activity className="h-5 w-5" />
                        </div>
                        <Badge className="bg-green-600 text-xs">+8%</Badge>
                      </div>
                      <h3 className="font-semibold text-foreground mb-1">{isRTL ? 'تكتيكي' : 'Tactical'}</h3>
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold text-foreground">{latestPerformance?.tacticalScore || 68}</span>
                        <span className="text-sm text-muted-foreground">/100</span>
                      </div>
                      <Progress value={latestPerformance?.tacticalScore || 68} className="h-1.5" />
                    </CardContent>
                  </Card>
                </div>

                {/* Upcoming Events */}
                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                      {isRTL ? 'الأحداث القادمة' : 'Upcoming Events'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingEvents.map((event, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="p-2 rounded-lg bg-cyan-600/20 text-cyan-700 dark:text-cyan-400">
                            <Calendar className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-foreground text-sm">{event.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(event.date).toLocaleDateString()} at {event.time}
                            </p>
                          </div>
                          <Badge variant="outline" className="capitalize text-muted-foreground border-border">
                            {event.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                      {isRTL ? 'الإنجازات' : 'Achievements'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-3">
                      {achievements.map((achievement, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <div className="p-2 rounded-full bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">
                            <Award className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">{achievement.title}</p>
                            <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Skills Tab - FIFA Style Radar */}
              <TabsContent value="skills" className="space-y-6">
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-foreground flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                        {isRTL ? 'مهارات اللاعب' : 'Player Skills'}
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-cyan-700 dark:text-cyan-400"
                        onClick={() => setShowPlayerCard(true)}
                      >
                        {isRTL ? 'عرض البطاقة' : 'View Card'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <SkillsRadar skills={mockSkills} size={320} showLabels={true} />
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      * {isRTL ? 'بناءً على الأنشطة منذ' : 'Based on activities since'} November 14, 2025
                    </p>
                  </CardContent>
                </Card>

                {/* Skill Breakdown */}
                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">{isRTL ? 'تفاصيل المهارات' : 'Skill Breakdown'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(mockSkills).map(([skill, value]) => (
                      <div key={skill} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {isRTL ? {
                              twoFooted: 'استخدام القدمين',
                              dribbling: 'المراوغة',
                              firstTouch: 'اللمسة الأولى',
                              agility: 'الرشاقة',
                              speed: 'السرعة',
                              power: 'القوة'
                            }[skill] : skill.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className={`font-bold ${
                            value >= 80 ? 'text-green-700 dark:text-green-400' : 
                            value >= 60 ? 'text-yellow-700 dark:text-yellow-400' : 
                            value >= 40 ? 'text-orange-700 dark:text-orange-400' : 'text-red-600 dark:text-red-400'
                          }`}>{value}</span>
                        </div>
                        <Progress value={value} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Activities Tab */}
              <TabsContent value="activities" className="space-y-6">
                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Activity className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                      {isRTL ? 'الأنشطة الأخيرة' : 'Recent Activities'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity, i) => (
                        <div key={i} className="p-4 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                activity.type === 'match' ? 'bg-green-600/20 text-green-700 dark:text-green-400' : 'bg-cyan-600/20 text-cyan-700 dark:text-cyan-400'
                              }`}>
                                {activity.type === 'match' ? <Trophy className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{activity.title}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(activity.date).toLocaleDateString()} • {activity.duration} min
                                </p>
                              </div>
                            </div>
                            {activity.attended ? (
                              <Badge className="bg-green-600">{isRTL ? 'حضر' : 'Attended'}</Badge>
                            ) : (
                              <Badge className="bg-red-600">{isRTL ? 'غائب' : 'Absent'}</Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="p-2 rounded bg-card/50">
                              <p className="text-lg font-bold text-foreground">{activity.workRate}%</p>
                              <p className="text-xs text-muted-foreground">{isRTL ? 'معدل العمل' : 'Work Rate'}</p>
                            </div>
                            <div className="p-2 rounded bg-card/50">
                              <p className="text-lg font-bold text-foreground">{activity.possessions}</p>
                              <p className="text-xs text-muted-foreground">{isRTL ? 'الاستحواذات' : 'Possessions'}</p>
                            </div>
                            {activity.type === 'match' && (
                              <div className="p-2 rounded bg-card/50">
                                <p className="text-lg font-bold text-foreground">{activity.goals}G / {activity.assists}A</p>
                                <p className="text-xs text-muted-foreground">{isRTL ? 'أهداف/تمريرات' : 'Goals/Assists'}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Targets Tab */}
              <TabsContent value="targets" className="space-y-6">
                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <Target className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                      {isRTL ? 'الأهداف الأسبوعية' : 'Weekly Targets'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {weeklyTargets.map((target, i) => {
                        const percentage = Math.round((target.current / target.target) * 100);
                        const Icon = target.icon;
                        return (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Icon className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                                <span className="text-foreground font-medium">{target.name}</span>
                              </div>
                              <span className="text-muted-foreground">
                                <span className="text-foreground font-bold">{target.current}</span>/{target.target}
                              </span>
                            </div>
                            <Progress value={percentage} className="h-3" />
                            <p className="text-xs text-muted-foreground text-right">
                              {percentage}% {isRTL ? 'مكتمل' : 'complete'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="bg-green-900/20 border-green-700">
                    <CardContent className="p-6 text-center">
                      <CheckCircle2 className="h-10 w-10 text-green-700 dark:text-green-400 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-green-700 dark:text-green-400">{attendanceRate}%</p>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'نسبة الحضور' : 'Attendance Rate'}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-cyan-900/20 border-cyan-700">
                    <CardContent className="p-6 text-center">
                      <Activity className="h-10 w-10 text-cyan-700 dark:text-cyan-400 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">{attendance?.presentSessions ?? 0}</p>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'جلسات حضرها' : 'Sessions Attended'}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-red-900/20 border-red-700">
                    <CardContent className="p-6 text-center">
                      <XCircle className="h-10 w-10 text-red-600 dark:text-red-400 mx-auto mb-2" />
                      <p className="text-3xl font-bold text-red-600 dark:text-red-400">{(attendance?.totalSessions ?? 0) - (attendance?.presentSessions ?? 0)}</p>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'جلسات غائب' : 'Sessions Missed'}</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-card/50 border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground">{isRTL ? 'سجل الحضور' : 'Attendance History'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(attendance?.recentSessions ?? []).map((record, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              record.status === 'present' ? 'bg-green-600/20 text-green-700 dark:text-green-400' : 'bg-red-600/20 text-red-600 dark:text-red-400'
                            }`}>
                              {record.status === 'present' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{record.date}</p>
                            </div>
                          </div>
                          <Badge className={record.status === 'present' ? 'bg-green-600' : 'bg-red-600'}>
                            {record.status === 'present' ? (isRTL ? 'حاضر' : 'Present') : (isRTL ? 'غائب' : 'Absent')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Fees Tab */}
              <TabsContent value="fees" className="space-y-4">
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <span>💳</span>
                      {isRTL ? 'الرسوم والمدفوعات' : 'Fees & Payments'}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">{isRTL ? 'سجل الرسوم الشهرية وحالة الدفع' : 'Monthly fee records and payment status'}</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {!playerFees || playerFees.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <span className="text-4xl block mb-2">📋</span>
                        <p>{isRTL ? 'لا توجد رسوم مسجلة' : 'No fees recorded yet'}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(playerFees as any[]).map((item: any) => {
                          const fee = item.fee || item;
                          const isPaid = fee.status === 'paid';
                          const isOverdue = fee.status === 'overdue';
                          const amount = (fee.amount || 0) / 100;
                          const paid = (fee.paidAmount || 0) / 100;
                          return (
                            <div key={fee.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
                              <div>
                                <p className="text-foreground font-medium text-sm">{fee.month}/{fee.year} — {fee.season || ''}</p>
                                <p className="text-muted-foreground text-xs">{isRTL ? `المبلغ: ${amount} ج.م` : `Amount: EGP ${amount}`}</p>
                                {paid > 0 && paid < amount && (
                                  <p className="text-cyan-700 dark:text-cyan-400 text-xs">{isRTL ? `مدفوع: ${paid} ج.م` : `Paid: EGP ${paid}`}</p>
                                )}
                              </div>
                              <Badge className={isPaid ? 'bg-green-600' : isOverdue ? 'bg-red-600' : 'bg-yellow-600'}>
                                {isPaid ? (isRTL ? 'مدفوع' : 'Paid') : isOverdue ? (isRTL ? 'متأخر' : 'Overdue') : (isRTL ? 'معلق' : 'Pending')}
                              </Badge>
                            </div>
                          );
                        })}
                        <div className="mt-4 p-3 rounded-lg bg-cyan-900/30 border border-cyan-700">
                          <p className="text-cyan-700 dark:text-cyan-300 text-sm font-medium">
                            {isRTL ? 'ملاحظة: للدفع أو الاستفسار، تواصل مع إدارة الأكاديمية' : 'To pay or inquire, contact the academy administration'}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Development Goals Tab */}
              <TabsContent value="goals" className="space-y-4">
                <Card className="bg-card/50 border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-foreground flex items-center gap-2">
                      <span>🎯</span>
                      {isRTL ? 'أهداف التطوير' : 'Development Goals'}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm">{isRTL ? 'الأهداف التي وضعها المدرب لتطوير لاعبك' : 'Goals set by the coach for your player'}</p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {!developmentGoals || developmentGoals.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <span className="text-4xl block mb-2">🎯</span>
                        <p>{isRTL ? 'لا توجد أهداف تطوير بعد' : 'No development goals set yet'}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(developmentGoals as any[]).map((goal: any) => (
                          <div key={goal.id} className="p-3 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-foreground font-medium text-sm">{goal.title}</p>
                                <p className="text-muted-foreground text-xs capitalize">{goal.category} • {goal.priority} priority</p>
                                {goal.description && <p className="text-muted-foreground text-xs mt-1">{goal.description}</p>}
                              </div>
                              <Badge className={goal.progress >= 100 ? 'bg-green-600' : goal.progress >= 50 ? 'bg-cyan-600' : 'bg-yellow-600'}>
                                {goal.progress}%
                              </Badge>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div
                                className="bg-cyan-500 h-1.5 rounded-full transition-all"
                                style={{ width: `${Math.min(goal.progress, 100)}%` }}
                              />
                            </div>
                            {goal.targetDate && (
                              <p className="text-muted-foreground text-xs mt-1">🗓 {isRTL ? 'الهدف:' : 'Target:'} {new Date(goal.targetDate).toLocaleDateString()}</p>
                            )}
                            <button
                              onClick={() => setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id)}
                              className="text-cyan-700 dark:text-cyan-400 text-xs mt-2 hover:text-cyan-700 dark:hover:text-cyan-300 flex items-center gap-1"
                            >
                              💬 {isRTL ? 'التعليقات' : 'Comments'}
                            </button>
                            {expandedGoalId === goal.id && (
                              <GoalCommentSection goalId={goal.id} isRTL={isRTL} commentText={goalCommentText} setCommentText={setGoalCommentText} addComment={addGoalComment} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
            {/* Quick Actions */}
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-sm">{isRTL ? 'روابط سريعة' : 'Quick Links'}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                  {selectedChild && (
                    <>
                      <Link href={`/player/${selectedChild}/progress`}>
                        <Button variant="outline" className="w-full border-purple-700/40 text-purple-600 dark:text-purple-300 hover:bg-purple-900/20 flex items-center gap-1.5 text-xs justify-start">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {isRTL ? 'تقرير التقدم' : 'Progress Report'}
                        </Button>
                      </Link>
                      <Link href={`/player/${selectedChild}/medical`}>
                        <Button variant="outline" className="w-full border-cyan-700/40 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-900/20 flex items-center gap-1.5 text-xs justify-start">
                          <Stethoscope className="h-3.5 w-3.5" />
                          {isRTL ? 'الملف الطبي' : 'Medical Profile'}
                        </Button>
                      </Link>
                      <Link href={`/player/${selectedChild}/scouting`}>
                        <Button variant="outline" className="w-full border-yellow-700/40 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-900/20 flex items-center gap-1.5 text-xs justify-start">
                          <Search className="h-3.5 w-3.5" />
                          {isRTL ? 'تقرير الكشافة' : 'Scouting Report'}
                        </Button>
                      </Link>
                      <Link href={`/player/${selectedChild}/report`}>
                        <Button variant="outline" className="w-full border-green-700/40 text-green-700 dark:text-green-300 hover:bg-green-900/20 flex items-center gap-1.5 text-xs justify-start">
                          <FileText className="h-3.5 w-3.5" />
                          {isRTL ? 'التقرير الكامل' : 'Full Report'}
                        </Button>
                      </Link>
                      <Link href={`/player-documents?playerId=${selectedChild}`}>
                        <Button variant="outline" className="w-full border-border text-muted-foreground hover:bg-muted flex items-center gap-1.5 text-xs justify-start">
                          <ClipboardList className="h-3.5 w-3.5" />
                          {isRTL ? 'الوثائق' : 'Documents'}
                        </Button>
                      </Link>
                    </>
                  )}
                  <Link href="/video-analysis">
                    <Button variant="outline" className="w-full border-cyan-600/40 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-900/20 flex items-center gap-1.5 text-xs justify-start">
                      <Video className="h-3.5 w-3.5" />
                      {isRTL ? 'تحليل الفيديو' : 'Video Analysis'}
                    </Button>
                  </Link>
                  <Link href="/rewards">
                    <Button variant="outline" className="w-full border-yellow-500/40 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-500/10 flex items-center gap-1.5 text-xs justify-start">
                      <Gift className="h-3.5 w-3.5" />
                      {isRTL ? 'المكافآت' : 'Rewards'} ({playerPoints?.points || 0} pts)
                    </Button>
                  </Link>
                  <Link href="/explore">
                    <Button variant="outline" className="w-full border-border text-muted-foreground hover:bg-muted flex items-center gap-1.5 text-xs justify-start">
                      <BookOpen className="h-3.5 w-3.5" />
                      {isRTL ? 'استكشف' : 'Explore'}
                    </Button>
                  </Link>
                </div>

                {/* Assigned Drills */}
                {assignedDrills && assignedDrills.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <ClipboardList className="h-3.5 w-3.5" />
                      {isRTL ? 'التمارين المعيّنة' : 'Assigned Drills'}
                    </p>
                    <div className="space-y-1.5">
                      {assignedDrills.slice(0, 3).map((drill: any, i: number) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-400" />
                            <span className="text-xs text-foreground">{drill.drill?.name || drill.drillName || 'Drill'}</span>
                          </div>
                          <Badge className={`text-[10px] ${drill.completed ? 'bg-green-700' : 'bg-orange-700'}`}>
                            {drill.completed ? (isRTL ? 'مكتمل' : 'Done') : (isRTL ? 'معلق' : 'Pending')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="bg-card/50 border-border">
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {isRTL ? 'اختر طفلك' : 'Select Your Child'}
              </h3>
              <p className="text-muted-foreground">
                {isRTL 
                  ? 'اختر طفلك من القائمة أعلاه لعرض تقدمه في التطوير'
                  : 'Choose your child from the dropdown above to view their development progress'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Player Card Modal */}
      {showPlayerCard && selectedPlayer && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowPlayerCard(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <PlayerCard
              player={{
                name: `${selectedPlayer.firstName} ${selectedPlayer.lastName}`,
                position: selectedPlayer.position || 'MF',
                nationality: 'Egypt',
                club: 'Future Stars Academy',
                
                skills: mockSkills,
              }}
              onClose={() => setShowPlayerCard(false)}
            />
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function GoalCommentSection({
  goalId,
  isRTL,
  commentText,
  setCommentText,
  addComment,
}: {
  goalId: number;
  isRTL: boolean;
  commentText: string;
  setCommentText: (value: string) => void;
  addComment: ReturnType<typeof trpc.goalComments.add.useMutation>;
}) {
  const { data: comments, isLoading } = trpc.goalComments.getByGoal.useQuery({ goalId });

  return (
    <div className="mt-3 pt-3 border-t border-border space-y-2">
      {isLoading ? (
        <p className="text-muted-foreground text-xs">{isRTL ? 'جارٍ التحميل...' : 'Loading...'}</p>
      ) : !comments || comments.length === 0 ? (
        <p className="text-muted-foreground text-xs">{isRTL ? 'لا توجد تعليقات بعد' : 'No comments yet'}</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {comments.map((c: any) => (
            <div key={c.id} className="bg-card/50 rounded p-2">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-cyan-700 dark:text-cyan-400 text-xs font-medium">{c.firstName} {c.lastName}</span>
                <span className="text-muted-foreground text-[10px]">{new Date(c.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-muted-foreground text-xs">{c.comment}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={isRTL ? 'اكتب تعليقاً...' : 'Write a comment...'}
          className="flex-1 bg-card border border-border rounded px-2 py-1 text-xs text-foreground placeholder:text-gray-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && commentText.trim()) {
              addComment.mutate({ goalId, comment: commentText.trim() });
            }
          }}
        />
        <Button
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={!commentText.trim() || addComment.isPending}
          onClick={() => addComment.mutate({ goalId, comment: commentText.trim() })}
        >
          {isRTL ? 'إرسال' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
