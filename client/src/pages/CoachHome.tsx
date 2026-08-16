import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users,
  Calendar,
  Shield,
  BarChart3,
  TrendingUp,
  Star,
  CheckCircle2,
  Clock,
  Plus,
  ChevronRight,
  Activity,
  Target,
  Printer,
  Brain,
  Video,
  Dumbbell,
  Trophy,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';

// ─── Skeleton sub-components ───────────────────────────────────────────────

function KpiCardSkeleton() {
  return (
    <Card className="border border-border">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <Skeleton className="h-8 w-16 mb-2" />
        <Skeleton className="h-3 w-24" />
      </CardContent>
    </Card>
  );
}

function QuickActionSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-border">
      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="w-4 h-4 rounded shrink-0" />
    </div>
  );
}

function SessionItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/10">
      <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-5 w-16 rounded-full shrink-0" />
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function CoachHome() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === 'ar';

  // Fetch coach-specific data
  const { data: myTeams = [], isLoading: teamsLoading } = trpc.privateTeams.getMyTeams.useQuery();
  const { data: mySessions = [], isLoading: sessionsLoading } = trpc.privateTeams.getMySessions.useQuery();
  const { data: analyticsStats, isLoading: statsLoading } = trpc.privateTeams.getFilteredStats.useQuery({ teamId: undefined });

  const isLoading = teamsLoading || sessionsLoading || statsLoading;

  const upcomingSessions = (mySessions as any[]).filter((s: any) => {
    if (!s.sessionDate) return false;
    return new Date(s.sessionDate) >= new Date();
  }).slice(0, 3);

  const recentSessions = (mySessions as any[]).filter((s: any) => {
    if (!s.sessionDate) return false;
    return new Date(s.sessionDate) < new Date();
  }).slice(0, 3);

  const quickActions = [
    {
      icon: Shield,
      label: isRTL ? 'فرقي وسيشناتي' : 'My Teams & Sessions',
      desc: isRTL ? 'إدارة فرقك الخاصة وسيشناتك' : 'Manage your private teams and sessions',
      path: '/coach/my-teams',
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10',
      badge: isRTL ? 'جديد' : 'New',
    },
    {
      icon: BarChart3,
      label: isRTL ? 'الإحصائيات والتحليلات' : 'Analytics Dashboard',
      desc: isRTL ? 'أداء وحضور لاعبيك' : 'Your players performance & attendance',
      path: '/coach/my-teams?tab=analytics',
      color: 'text-green-700 dark:text-green-400',
      bg: 'bg-green-500/10',
      badge: isRTL ? 'جديد' : 'New',
    },
    {
      icon: Calendar,
      label: isRTL ? 'جدولي' : 'My Schedule',
      desc: isRTL ? 'جدول تدريباتك القادمة' : 'Your upcoming training schedule',
      path: '/coach-schedule',
      color: 'text-blue-600 dark:text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Dumbbell,
      label: isRTL ? 'التدريب' : 'Training',
      desc: isRTL ? 'إدارة خطط التدريب' : 'Manage training plans',
      path: '/training',
      color: 'text-orange-700 dark:text-orange-400',
      bg: 'bg-orange-500/10',
    },
    {
      icon: Video,
      label: isRTL ? 'تحليل الفيديو' : 'Video Analysis',
      desc: isRTL ? 'تحليل مباريات وتدريبات' : 'Analyze matches and training',
      path: '/coach/ai-video-analysis',
      color: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      icon: Brain,
      label: isRTL ? 'مساعد الذكاء الاصطناعي' : 'AI Coach Assistant',
      desc: isRTL ? 'تكتيكات وتحليلات ذكية' : 'Smart tactics and analysis',
      path: '/coach/ai-assistant',
      color: 'text-pink-600 dark:text-pink-400',
      bg: 'bg-pink-500/10',
    },
  ];

  const coachName = user?.name || (isRTL ? 'المدرب' : 'Coach');

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>

        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-64 mb-2" />
                  <Skeleton className="h-4 w-80" />
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-foreground">
                    {isRTL ? `مرحباً، ${coachName} 👋` : `Welcome back, ${coachName} 👋`}
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    {isRTL ? 'لوحة تحكم المدرب — إدارة فرقك وسيشناتك الخاصة' : 'Coach Workspace — Manage your private teams and sessions'}
                  </p>
                </>
              )}
            </div>
            <Button onClick={() => setLocation('/coach/my-teams')} className="gap-2" disabled={isLoading}>
              <Plus className="w-4 h-4" />
              {isRTL ? 'إنشاء سيشن جديد' : 'New Session'}
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <KpiCardSkeleton key={i} />)
          ) : (
            [
              {
                label: isRTL ? 'فرقي الخاصة' : 'My Private Teams',
                value: (myTeams as any[]).length,
                icon: <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
                color: 'border-indigo-500/30 bg-indigo-500/5',
              },
              {
                label: isRTL ? 'إجمالي السيشنات' : 'Total Sessions',
                value: (mySessions as any[]).length,
                icon: <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
                color: 'border-blue-500/30 bg-blue-500/5',
              },
              {
                label: isRTL ? 'معدل الحضور' : 'Avg Attendance',
                value: analyticsStats ? `${analyticsStats.attendanceRate}%` : '—',
                icon: <CheckCircle2 className="w-5 h-5 text-green-700 dark:text-green-400" />,
                color: 'border-green-500/30 bg-green-500/5',
              },
              {
                label: isRTL ? 'متوسط الأداء' : 'Avg Performance',
                value: analyticsStats?.avgPerformance != null ? `${analyticsStats.avgPerformance}/10` : '—',
                icon: <Star className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />,
                color: 'border-yellow-500/30 bg-yellow-500/5',
              },
            ].map((kpi, i) => (
              <Card key={i} className={`border ${kpi.color}`}>
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    {kpi.icon}
                  </div>
                  <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
            {isRTL ? 'الوصول السريع' : 'Quick Access'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <QuickActionSkeleton key={i} />)
              : quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => setLocation(action.path)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-start group"
                  >
                    <div className={`p-2.5 rounded-lg ${action.bg} shrink-0`}>
                      <action.icon className={`w-5 h-5 ${action.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">{action.label}</span>
                        {action.badge && (
                          <Badge className="text-xs bg-primary/20 text-primary border-0 shrink-0">{action.badge}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">{action.desc}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                  </button>
                ))
            }
          </div>
        </div>

        {/* Sessions Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Upcoming Sessions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {isRTL ? 'السيشنات القادمة' : 'Upcoming Sessions'}
                </span>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setLocation('/coach/my-teams')}>
                  {isRTL ? 'عرض الكل' : 'View All'}
                  <ChevronRight className={`w-3 h-3 ms-1 ${isRTL ? 'rotate-180' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <SessionItemSkeleton key={i} />)}
                </div>
              ) : upcomingSessions.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{isRTL ? 'لا توجد سيشنات قادمة' : 'No upcoming sessions'}</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => setLocation('/coach/my-teams')}>
                    <Plus className="w-3 h-3" />
                    {isRTL ? 'أنشئ سيشن' : 'Create Session'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingSessions.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => setLocation('/coach/my-teams')}>
                      <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.sessionDate ? format(new Date(s.sessionDate), 'dd MMM yyyy') : '—'}
                          {s.startTime ? ` · ${s.startTime}` : ''}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize shrink-0">{s.sessionType}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Private Teams */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  {isRTL ? 'فرقي الخاصة' : 'My Private Teams'}
                </span>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setLocation('/coach/my-teams')}>
                  {isRTL ? 'إدارة الفرق' : 'Manage Teams'}
                  <ChevronRight className={`w-3 h-3 ms-1 ${isRTL ? 'rotate-180' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <SessionItemSkeleton key={i} />)}
                </div>
              ) : (myTeams as any[]).length === 0 ? (
                <div className="text-center py-6">
                  <Shield className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">{isRTL ? 'لم تنشئ أي فريق خاص بعد' : 'No private teams yet'}</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1" onClick={() => setLocation('/coach/my-teams')}>
                    <Plus className="w-3 h-3" />
                    {isRTL ? 'أنشئ فريق' : 'Create Team'}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {(myTeams as any[]).slice(0, 4).map((team: any) => (
                    <div key={team.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => setLocation('/coach/my-teams')}>
                      <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{team.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {team.memberCount || 0} {isRTL ? 'لاعب' : 'players'}
                          {team.description ? ` · ${team.description}` : ''}
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        {sessionsLoading ? (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-700 dark:text-green-400" />
                <Skeleton className="h-4 w-40" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => <SessionItemSkeleton key={i} />)}
              </div>
            </CardContent>
          </Card>
        ) : recentSessions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-700 dark:text-green-400" />
                {isRTL ? 'آخر السيشنات المنتهية' : 'Recent Completed Sessions'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentSessions.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setLocation('/coach/my-teams')}>
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-green-700 dark:text-green-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.sessionDate ? format(new Date(s.sessionDate), 'dd MMM yyyy') : '—'}
                        {s.teamName ? ` · ${s.teamName}` : ''}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs capitalize shrink-0">{s.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
