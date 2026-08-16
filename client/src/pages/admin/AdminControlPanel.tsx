import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users, UserCheck, Shield, Baby, AlertCircle, Calendar,
  TrendingUp, Clock, UserPlus, Activity, ChevronRight,
  Trophy, Dumbbell, Heart, DollarSign, RefreshCw
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AdminControlPanel() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isAr = language === "ar";

  const { data: stats, isLoading, refetch, isFetching } = trpc.analytics.getAdminControlPanelStats.useQuery(undefined, {
    refetchInterval: 60_000, // auto-refresh every minute
  });

  const statCards = stats ? [
    {
      label: isAr ? "إجمالي اللاعبين" : "Total Players",
      value: stats.totalPlayers,
      icon: <Users className="w-5 h-5" />,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      link: "/players",
    },
    {
      label: isAr ? "المدربون" : "Coaches",
      value: stats.totalCoaches,
      icon: <UserCheck className="w-5 h-5" />,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
      link: "/staff",
    },
    {
      label: isAr ? "الفرق" : "Teams",
      value: stats.totalTeams,
      icon: <Shield className="w-5 h-5" />,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
      link: "/teams",
    },
    {
      label: isAr ? "أولياء الأمور" : "Parents",
      value: stats.totalParents,
      icon: <Baby className="w-5 h-5" />,
      color: "text-amber-600",
      bg: "bg-amber-50 dark:bg-amber-950",
      link: "/user-management",
    },
    {
      label: isAr ? "طلبات الانتظار" : "Pending Approvals",
      value: stats.pendingApprovals,
      icon: <Clock className="w-5 h-5" />,
      color: stats.pendingApprovals > 0 ? "text-red-600" : "text-muted-foreground",
      bg: stats.pendingApprovals > 0 ? "bg-red-50 dark:bg-red-950" : "bg-gray-50 dark:bg-gray-900",
      link: "/user-management",
      urgent: stats.pendingApprovals > 0,
    },
    {
      label: isAr ? "إصابات نشطة" : "Active Injuries",
      value: stats.activeInjuries,
      icon: <Heart className="w-5 h-5" />,
      color: stats.activeInjuries > 0 ? "text-orange-600" : "text-muted-foreground",
      bg: stats.activeInjuries > 0 ? "bg-orange-50 dark:bg-orange-950" : "bg-gray-50 dark:bg-gray-900",
      link: "/injuries",
    },
    {
      label: isAr ? "تدريبات هذا الأسبوع" : "Sessions This Week",
      value: stats.sessionsThisWeek,
      icon: <Dumbbell className="w-5 h-5" />,
      color: "text-indigo-600",
      bg: "bg-indigo-50 dark:bg-indigo-950",
      link: "/training",
    },
    {
      label: isAr ? "تدريبات قادمة (7 أيام)" : "Upcoming Sessions (7d)",
      value: stats.upcomingSessions,
      icon: <Calendar className="w-5 h-5" />,
      color: "text-teal-600",
      bg: "bg-teal-50 dark:bg-teal-950",
      link: "/training",
    },
    {
      label: isAr ? "نسبة الحضور (30 يوم)" : "Attendance Rate (30d)",
      value: `${stats.attendanceRate30Days}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      color: stats.attendanceRate30Days >= 80 ? "text-green-600" : stats.attendanceRate30Days >= 60 ? "text-amber-600" : "text-red-600",
      bg: stats.attendanceRate30Days >= 80 ? "bg-green-50 dark:bg-green-950" : "bg-amber-50 dark:bg-amber-950",
      link: "/attendance-tracking",
    },
    {
      label: isAr ? "مسجلون هذا الأسبوع" : "New Users This Week",
      value: stats.newUsersThisWeek,
      icon: <UserPlus className="w-5 h-5" />,
      color: "text-cyan-600",
      bg: "bg-cyan-50 dark:bg-cyan-950",
      link: "/user-management",
    },
  ] : [];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {isAr ? "لوحة التحكم الرئيسية" : "Admin Control Panel"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAr ? "نظرة شاملة على الأكاديمية في الوقت الفعلي" : "Real-time academy overview — auto-refreshes every minute"}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            {isAr ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {statCards.map((card, i) => (
                <button
                  key={i}
                  onClick={() => card.link && navigate(card.link)}
                  className={`rounded-xl p-4 text-left transition-all hover:scale-105 hover:shadow-md ${card.bg} border ${card.urgent ? "border-red-300 dark:border-red-700 ring-2 ring-red-200 dark:ring-red-800" : "border-transparent"}`}
                >
                  <div className={`${card.color} mb-2`}>{card.icon}</div>
                  <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-tight">{card.label}</div>
                  {card.urgent && (
                    <Badge variant="destructive" className="mt-2 text-xs">
                      {isAr ? "يحتاج مراجعة" : "Action needed"}
                    </Badge>
                  )}
                </button>
              ))}
            </div>

            {/* Teams Overview */}
            {stats && stats.teams.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-700 dark:text-amber-500" />
                    {isAr ? "الفرق والأعداد" : "Teams Overview"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {stats.teams.map((team: any) => (
                      <button
                        key={team.id}
                        onClick={() => navigate(`/teams`)}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-left">
                          <div className="font-medium text-sm truncate max-w-[120px]">{team.name}</div>
                          <div className="text-xs text-muted-foreground">{team.ageGroup || "—"}</div>
                        </div>
                        <div className="flex items-center gap-1 text-blue-600">
                          <Users className="w-3 h-3" />
                          <span className="font-bold text-sm">{team.playerCount}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  {isAr ? "إجراءات سريعة" : "Quick Actions"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: isAr ? "إدارة المستخدمين" : "User Management", icon: <Users className="w-4 h-4" />, link: "/user-management" },
                    { label: isAr ? "سجل الحضور" : "Attendance Tracking", icon: <TrendingUp className="w-4 h-4" />, link: "/attendance-tracking" },
                    { label: isAr ? "الجدول والمباريات" : "Match Schedule", icon: <Calendar className="w-4 h-4" />, link: "/team-schedule" },
                    { label: isAr ? "الإصابات" : "Injuries", icon: <Heart className="w-4 h-4" />, link: "/injuries" },
                    { label: isAr ? "الأداء المالي" : "Financial Overview", icon: <DollarSign className="w-4 h-4" />, link: "/financial" },
                    { label: isAr ? "اللاعبون" : "Players", icon: <Users className="w-4 h-4" />, link: "/players" },
                    { label: isAr ? "التدريبات" : "Training Sessions", icon: <Dumbbell className="w-4 h-4" />, link: "/training" },
                    { label: isAr ? "الفرق" : "Teams", icon: <Shield className="w-4 h-4" />, link: "/teams" },
                  ].map((action, i) => (
                    <button
                      key={i}
                      onClick={() => navigate(action.link)}
                      className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:bg-primary/5 hover:border-primary/30 transition-colors text-left"
                    >
                      <span className="text-primary">{action.icon}</span>
                      <span className="text-sm font-medium flex-1">{action.label}</span>
                      <ChevronRight className="w-3 h-3 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
