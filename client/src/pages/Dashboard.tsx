import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Users,
  Activity,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Trophy,
  Target,
  Brain,
  Dumbbell,
  Apple,
  BookOpen,
  Video,
  BarChart3,
  GraduationCap,
  Star,
  Zap,
  Shield,
  ChevronRight,
  Clock,
  Award,
} from "lucide-react";
import { AdvancedFeaturesWidgets } from "@/components/AdvancedFeaturesWidgets";
import { OnboardingTour } from "@/components/OnboardingTour";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  iconColor = "text-blue-500",
  iconBg = "bg-blue-50",
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: { value: number; positive: boolean };
  iconColor?: string;
  iconBg?: string;
}) {
  return (
    <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
            <div className="text-3xl font-bold text-foreground mb-1">{value}</div>
            {description && <p className="text-xs text-muted-foreground/70">{description}</p>}
            {trend && (
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.positive ? "text-green-600" : "text-red-500"}`}>
                <TrendingUp className={`h-3 w-3 ${!trend.positive && "rotate-180"}`} />
                <span>{trend.positive ? "+" : ""}{trend.value}% from last month</span>
              </div>
            )}
          </div>
          <div className={`p-2.5 rounded-lg ${iconBg} shrink-0`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Quick Action Card ─────────────────────────────────────────────────────────
function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  onClick,
  iconColor = "text-gray-600",
  iconBg = "bg-gray-100",
  badge,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
  iconColor?: string;
  iconBg?: string;
  badge?: string;
}) {
  const inner = (
    <Card
      className="group bg-card border shadow-sm hover:shadow-md transition-all cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${iconBg} shrink-0 group-hover:scale-105 transition-transform`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground truncate">{title}</h3>
            {badge && (
              <Badge variant="secondary" className="text-xs shrink-0 bg-amber-100 text-amber-700 border-0">
                {badge}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

// ─── Staff Dashboard ───────────────────────────────────────────────────────────
function UpcomingMatchesWidget() {
  const { t, language } = useLanguage();
  const { data: upcomingMatches, isLoading } = trpc.analytics.getUpcomingMatches.useQuery({ limit: 5 });
  const matchTypeColor: Record<string, string> = {
    league: "bg-blue-100 text-blue-700",
    cup: "bg-yellow-100 text-yellow-700",
    friendly: "bg-green-100 text-green-700",
    tournament: "bg-purple-100 text-purple-700",
    training_match: "bg-gray-100 text-gray-700",
  };
  return (
    <Card className="bg-card border shadow-sm">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-foreground text-base">{t("dashboard.upcomingMatches")}</CardTitle>
          </div>
          <Link href="/team-schedule">
            <span className="text-xs text-blue-500 hover:underline cursor-pointer">{t("common.viewAll")}</span>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{t('dashboard.upcomingFixtures')}</p>
      </CardHeader>
      <CardContent className="pt-4 space-y-2">
        {isLoading ? (
          [1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)
        ) : !upcomingMatches || (upcomingMatches as any[]).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">{t('dashboard.noUpcomingMatches')}</p>
        ) : (
          (upcomingMatches as any[]).map((match) => (
            <div key={match.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground truncate">
                    vs {match.opponent || 'TBD'}
                  </span>
                  <Badge className={`text-xs shrink-0 border-0 ${matchTypeColor[match.matchType] || 'bg-gray-100 text-gray-700'}`}>
                    {match.matchType}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{match.teamName}</span>
                  {match.venue && (
                    <span className="flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" />{match.venue}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-medium text-foreground">
                  {match.matchDate ? new Date(match.matchDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'TBD'}
                </div>
                <div className="text-xs text-muted-foreground">
                  {match.isHome ? 'Home' : 'Away'}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function StaffDashboard() {
  const { t, language } = useLanguage();
  const { data: stats, isLoading } = trpc.analytics.getAcademyStats.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="bg-white border border-gray-200">
              <CardContent className="p-5">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <OnboardingTour />
      <div className="space-y-8">

        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("common.dashboard")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('dashboard.welcomeBack')}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={language === 'ar' ? 'إجمالي اللاعبين' : 'Total Players'}
            value={stats?.totalPlayers || 0}
            description={language === 'ar' ? 'أعضاء الأكاديمية النشطون' : 'Active academy members'}
            icon={Users}
            trend={{ value: 12, positive: true }}
            iconColor="text-blue-500"
            iconBg="bg-blue-50"
          />
          <StatCard
            title={language === 'ar' ? 'الفرق' : 'Teams'}
            value={stats?.totalTeams || 0}
            description={language === 'ar' ? 'فرق الفئات العمرية' : 'Age group teams'}
            icon={Shield}
            iconColor="text-yellow-700 dark:text-yellow-500"
            iconBg="bg-yellow-50"
          />
          <StatCard
            title={language === 'ar' ? 'الإصابات النشطة' : 'Active Injuries'}
            value={stats?.activeInjuries || 0}
            description={language === 'ar' ? 'لاعبون مصابون حالياً' : 'Players currently injured'}
            icon={AlertTriangle}
            iconColor="text-red-500"
            iconBg="bg-red-50"
          />
          <StatCard
            title={language === 'ar' ? 'الجلسات القادمة' : 'Upcoming Sessions'}
            value={stats?.upcomingSessions || 0}
            description={language === 'ar' ? 'جلسات تدريب مجدولة' : 'Scheduled training sessions'}
            icon={Calendar}
            iconColor="text-orange-700 dark:text-orange-500"
            iconBg="bg-orange-50"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">{t("dashboard.quickActions")}</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <QuickActionCard
              title={language === 'ar' ? 'تسجيل الأداء' : 'Record Performance'}
              description={language === 'ar' ? 'تسجيل مقاييس اللاعب من التدريب أو المباراة' : 'Log player metrics from training or match'}
              icon={Activity}
              iconColor="text-blue-500"
              iconBg="bg-blue-50"
              href="/performance"
            />
            <QuickActionCard
              title={language === 'ar' ? 'التقييم النفسي' : 'Mental Assessment'}
              description={language === 'ar' ? 'إجراء تقييم نفسي' : 'Conduct psychological evaluation'}
              icon={Brain}
              iconColor="text-yellow-700 dark:text-yellow-500"
              iconBg="bg-yellow-50"
              href="/mental"
            />
            <QuickActionCard
              title={language === 'ar' ? 'إنشاء تدريب' : 'Create Workout'}
              description={language === 'ar' ? 'تصميم خطة تدريب جديدة' : 'Design a new training plan'}
              icon={Dumbbell}
              iconColor="text-red-500"
              iconBg="bg-red-50"
              href="/training"
            />
            <QuickActionCard
              title={language === 'ar' ? 'تخطيط الوجبات' : 'Meal Planning'}
              description={language === 'ar' ? 'إنشاء خطة غذائية للاعبين' : 'Create nutrition plan for players'}
              icon={Apple}
              iconColor="text-green-700 dark:text-green-500"
              iconBg="bg-green-50"
              href="/nutrition"
            />
            <QuickActionCard
              title={language === 'ar' ? 'تحديد الأهداف' : 'Set Goals'}
              description={language === 'ar' ? 'تحديد أهداف التطوير' : 'Define development objectives'}
              icon={Target}
              iconColor="text-orange-700 dark:text-orange-500"
              iconBg="bg-orange-50"
              href="/idp"
            />
            <QuickActionCard
              title={language === 'ar' ? 'منح إنجاز' : 'Award Achievement'}
              description={language === 'ar' ? 'تكريم إنجازات اللاعب' : 'Recognize player accomplishments'}
              icon={Trophy}
              iconColor="text-purple-500"
              iconBg="bg-purple-50"
              href="/points-management"
            />
            <QuickActionCard
              title={language === 'ar' ? 'قوانين كرة القدم' : 'Football Laws'}
              description={language === 'ar' ? 'دراسة القوانين الـ 17 للعبة' : 'Study the 17 laws of the game'}
              icon={BookOpen}
              iconColor="text-gray-600"
              iconBg="bg-gray-100"
              href="/coach-education/laws"
            />
            <QuickActionCard
              title={language === 'ar' ? 'شهادة المدرب' : 'Coach Certification'}
              description={language === 'ar' ? 'مسار رخصة التدريب الفيفا' : 'FIFA coaching license pathway'}
              icon={GraduationCap}
              iconColor="text-gray-600"
              iconBg="bg-gray-100"
              href="/coach-education/courses"
            />
            <QuickActionCard
              title={language === 'ar' ? 'فيديوهات التدريب' : 'Training Videos'}
              description={language === 'ar' ? 'مكتبة مركز تدريب الفيفا' : 'FIFA Training Centre library'}
              icon={Video}
              iconColor="text-gray-600"
              iconBg="bg-gray-100"
              href="/coach-education/videos"
            />
            <QuickActionCard
              title={language === 'ar' ? 'تحليلات متقدمة' : 'Advanced Analytics'}
              description={language === 'ar' ? 'تحليل بأسلوب InStat/Wyscout' : 'InStat/Wyscout style analysis'}
              icon={BarChart3}
              iconColor="text-gray-600"
              iconBg="bg-gray-100"
              href="/data-analysis-pro"
              badge="Pro"
            />
          </div>
        </div>

        {/* Professional Analytics */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-4">{t('dashboard.professionalAnalytics')}</h2>
          <AdvancedFeaturesWidgets />
        </div>

        {/* Upcoming Matches */}
        <UpcomingMatchesWidget />

        {/* Bottom Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Development Areas */}
          <Card className="bg-card border shadow-sm">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-700 dark:text-amber-500" />
                <CardTitle className="text-foreground text-base">{t('dashboard.developmentAreas')}</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.holisticTracking')}</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              {[
                { name: language === 'ar' ? 'المهارات التقنية' : 'Technical Skills', score: 78, color: "bg-red-500" },
                { name: language === 'ar' ? 'اللياقة البدنية' : 'Physical Fitness', score: 82, color: "bg-amber-500" },
                { name: language === 'ar' ? 'القوة الذهنية' : 'Mental Strength', score: 71, color: "bg-yellow-500" },
                { name: language === 'ar' ? 'الوعي التكتيكي' : 'Tactical Awareness', score: 75, color: "bg-orange-500" },
                { name: language === 'ar' ? 'الالتزام الغذائي' : 'Nutrition Compliance', score: 68, color: "bg-green-500" },
              ].map((area) => (
                <div key={area.name} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{area.name}</span>
                    <span className="font-semibold text-foreground">{area.score}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full ${area.color} rounded-full transition-all duration-700`}
                      style={{ width: `${area.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-card border shadow-sm">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-foreground text-base">{t("dashboard.recentActivity")}</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t('dashboard.latestUpdates')}</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {[
                { action: "Performance recorded", detail: "Ahmed Hassan — Technical session", time: "2h ago", color: "bg-blue-500" },
                { action: "Injury update", detail: "Mohamed Ali — Cleared to train", time: "4h ago", color: "bg-green-500" },
                { action: "Training session", detail: "U17 — Tactical drills completed", time: "6h ago", color: "bg-amber-500" },
                { action: "New enrollment", detail: "Youssef Kamal — Application received", time: "1d ago", color: "bg-purple-500" },
                { action: "Match result", detail: "Academy U15 vs Zamalek — 2:1 Win", time: "2d ago", color: "bg-red-500" },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full ${item.color} mt-1.5 shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{item.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                  </div>
                  <span className="text-xs text-muted-foreground/60 shrink-0">{item.time}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

      </div>
    </>
  );
}

// ─── Parent Dashboard ──────────────────────────────────────────────────────────
function ParentDashboard() {
  const { t, language } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("common.dashboard")}</h1>
        <p className="text-muted-foreground text-sm mt-1">Track your child's progress at Future Stars Academy</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Attendance Rate" value="92%" description="This month" icon={Calendar} iconColor="text-green-700 dark:text-green-500" iconBg="bg-green-50" />
        <StatCard title="Overall Score" value="76" description="Development rating" icon={Star} iconColor="text-yellow-700 dark:text-yellow-500" iconBg="bg-yellow-50" />
        <StatCard title="Points Earned" value="340" description="Total academy points" icon={Trophy} iconColor="text-orange-700 dark:text-orange-500" iconBg="bg-orange-50" />
        <StatCard title="Achievements" value="8" description="Total earned" icon={Award} iconColor="text-purple-500" iconBg="bg-purple-50" />
      </div>
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-700 dark:text-amber-500" />
            <CardTitle className="text-gray-800 text-base">Latest Coach Feedback</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          <div className="p-4 rounded-xl bg-gray-50 border-l-4 border-red-500">
            <p className="text-sm italic text-gray-600">"Excellent improvement in ball control this week. Keep up the great work!"</p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">— Coach Martinez, Technical Training</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-50 border-l-4 border-amber-500">
            <p className="text-sm italic text-gray-600">"Showing great mental resilience during challenging drills. Very proud of the progress."</p>
            <p className="text-xs text-muted-foreground mt-2 font-medium">— Dr. Thompson, Mental Coach</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Player Dashboard ──────────────────────────────────────────────────────────
function PlayerDashboard() {
  const { t, language } = useLanguage();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("common.dashboard")}</h1>
        <p className="text-muted-foreground text-sm mt-1">Your development journey at Future Stars Academy</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Technical" value="78" icon={Activity} iconColor="text-blue-500" iconBg="bg-blue-50" />
        <StatCard title="Physical" value="82" icon={Dumbbell} iconColor="text-green-700 dark:text-green-500" iconBg="bg-green-50" />
        <StatCard title="Mental" value="71" icon={Brain} iconColor="text-purple-500" iconBg="bg-purple-50" />
        <StatCard title="Tactical" value="75" icon={Target} iconColor="text-orange-700 dark:text-orange-500" iconBg="bg-orange-50" />
      </div>
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500" />
            <CardTitle className="text-gray-800 text-base">Today's Schedule</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4 space-y-2">
          {[
            { time: "09:00", activity: "Technical Training", location: "Field A" },
            { time: "11:00", activity: "Gym Session", location: "Fitness Center" },
            { time: "14:00", activity: "Tactical Analysis", location: "Video Room" },
            { time: "16:00", activity: "Team Practice", location: "Main Pitch" },
          ].map((session, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="text-sm font-mono font-bold text-red-500 w-12 shrink-0">{session.time}</div>
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-800">{session.activity}</p>
                <p className="text-xs text-muted-foreground">{session.location}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { t, language } = useLanguage();
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const role = user?.role || "player";

  // Redirect coach to their dedicated workspace — wait for auth to resolve first
  useEffect(() => {
    if (loading) return; // wait until we know the real role
    if (role === 'coach') {
      setLocation('/coach/home');
    }
  }, [role, loading]);

  const renderDashboard = () => {
    if (loading) return null; // show nothing while auth loads
    if (role === 'coach') {
      // Will redirect via useEffect above
      return null;
    } else if (["admin", "nutritionist", "mental_coach", "physical_trainer"].includes(role)) {
      return <StaffDashboard />;
    } else if (role === "parent") {
      return <ParentDashboard />;
    } else {
      return <PlayerDashboard />;
    }
  };

  return (
    <>
      <div className="-m-4 lg:-m-6 p-4 lg:p-6">
        {renderDashboard()}
      </div>
    </>
  );
}
