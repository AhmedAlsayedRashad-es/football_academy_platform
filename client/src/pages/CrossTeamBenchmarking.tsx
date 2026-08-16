import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BarChart2, Users, Activity, TrendingUp, AlertTriangle, Wallet, Trophy, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line,
} from "recharts";

const COLORS = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#06b6d4"];

function KPICard({ title, value, subtitle, icon: Icon, color }: { title: string; value: string | number; subtitle?: string; icon: any; color: string }) {
  return (
    <Card className={`border-${color}-200 bg-${color}-50/40 dark:bg-${color}-950/20`}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold text-${color}-700 dark:text-${color}-400`}>{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <Icon className={`w-5 h-5 text-${color}-500 mt-1`} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function CrossTeamBenchmarking() {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  const ar = language === "ar";

  const { data: kpis = [], isLoading } = trpc.finance.getCrossTeamKPIs.useQuery();

  const teams = kpis as any[];
  const totalPlayers = teams.reduce((s: number, t: any) => s + t.playerCount, 0);
  const avgAttendance = teams.length > 0
    ? Math.round(teams.reduce((s: number, t: any) => s + t.avgAttendanceRate, 0) / teams.length)
    : 0;
  const totalRevenue = teams.reduce((s: number, t: any) => s + t.revenue, 0);
  const avgInjuryRate = teams.length > 0
    ? Math.round(teams.reduce((s: number, t: any) => s + t.injuryRate, 0) / teams.length)
    : 0;

  // Prepare chart data
  const attendanceData = teams.map((t: any) => ({
    name: t.ageGroup,
    [ar ? "معدل الحضور" : "Attendance %"]: t.avgAttendanceRate,
  }));

  const skillData = teams.map((t: any) => ({
    name: t.ageGroup,
    [ar ? "متوسط المهارة" : "Avg Skill"]: t.avgSkillScore,
  }));

  const injuryData = teams.map((t: any) => ({
    name: t.ageGroup,
    [ar ? "معدل الإصابة" : "Injury Rate %"]: t.injuryRate,
  }));

  const revenueData = teams.map((t: any) => ({
    name: t.ageGroup,
    [ar ? "الإيرادات" : "Revenue (EGP)"]: Math.round(t.revenue / 100),
  }));

  // Radar data (normalized 0-100)
  const radarData = teams.map((t: any) => ({
    subject: t.ageGroup,
    [ar ? "الحضور" : "Attendance"]: t.avgAttendanceRate,
    [ar ? "المهارة" : "Skill"]: t.avgSkillScore,
    [ar ? "السلامة" : "Safety"]: 100 - t.injuryRate,
    [ar ? "اللاعبون" : "Players"]: Math.min(100, Math.round((t.playerCount / 30) * 100)),
  }));

  const getAttendanceBadge = (rate: number) => {
    if (rate >= 85) return { label: ar ? "ممتاز" : "Excellent", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    if (rate >= 70) return { label: ar ? "جيد" : "Good", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
    if (rate >= 55) return { label: ar ? "متوسط" : "Average", cls: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
    return { label: ar ? "ضعيف" : "Poor", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className={`max-w-6xl mx-auto p-6 space-y-6 ${ar ? "rtl" : "ltr"}`}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart2 className="w-6 h-6 text-blue-500" />
              {ar ? "مقارنة الفرق عبر المجموعات العمرية" : "Cross-Team Benchmarking"}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {ar ? "مقارنة مؤشرات الأداء الرئيسية عبر جميع المجموعات العمرية" : "Compare KPIs across all age groups in one view"}
            </p>
          </div>
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPICard title={ar ? "إجمالي اللاعبين" : "Total Players"} value={totalPlayers} icon={Users} color="blue" />
          <KPICard title={ar ? "متوسط الحضور" : "Avg Attendance"} value={`${avgAttendance}%`} icon={Activity} color="green" />
          <KPICard title={ar ? "معدل الإصابة" : "Avg Injury Rate"} value={`${avgInjuryRate}%`} icon={AlertTriangle} color="red" />
          <KPICard title={ar ? "إجمالي الإيرادات" : "Total Revenue"} value={`${Math.round(totalRevenue / 100).toLocaleString(ar ? "ar-EG" : "en-US")} ${ar ? "ج.م" : "EGP"}`} icon={Wallet} color="amber" />
        </div>

        {/* Age Group Summary Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-700 dark:text-amber-500" />
              {ar ? "ملخص المجموعات العمرية" : "Age Group Summary"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">{ar ? "المجموعة" : "Group"}</th>
                    <th className="text-center py-2 px-3 font-medium">{ar ? "اللاعبون" : "Players"}</th>
                    <th className="text-center py-2 px-3 font-medium">{ar ? "الحضور" : "Attendance"}</th>
                    <th className="text-center py-2 px-3 font-medium">{ar ? "المهارة" : "Skill"}</th>
                    <th className="text-center py-2 px-3 font-medium">{ar ? "الإصابات" : "Injuries"}</th>
                    <th className="text-center py-2 px-3 font-medium">{ar ? "الإيرادات" : "Revenue"}</th>
                    <th className="text-center py-2 px-3 font-medium">{ar ? "التقييم" : "Rating"}</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t: any, i: number) => {
                    const badge = getAttendanceBadge(t.avgAttendanceRate);
                    return (
                      <tr key={t.ageGroup} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="py-3 pr-4 font-semibold">{t.ageGroup}</td>
                        <td className="py-3 px-3 text-center">{t.playerCount}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={t.avgAttendanceRate >= 70 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {t.avgAttendanceRate}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={t.avgSkillScore >= 70 ? "text-blue-600 font-medium" : "text-muted-foreground"}>
                            {t.avgSkillScore > 0 ? `${t.avgSkillScore}/100` : "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={t.injuryRate > 15 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                            {t.injuredCount} ({t.injuryRate}%)
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-sm">
                          {Math.round(t.revenue / 100).toLocaleString(ar ? "ar-EG" : "en-US")} {ar ? "ج.م" : "EGP"}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Badge className={`${badge.cls} text-xs border-0`}>{badge.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendance Rate Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-700 dark:text-green-500" />
                {ar ? "معدل الحضور حسب المجموعة" : "Attendance Rate by Group"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={attendanceData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey={ar ? "معدل الحضور" : "Attendance %"} fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Skill Score Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                {ar ? "متوسط المهارة حسب المجموعة" : "Avg Skill Score by Group"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={skillData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey={ar ? "متوسط المهارة" : "Avg Skill"} fill="#3b82f6" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Injury Rate Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                {ar ? "معدل الإصابة حسب المجموعة" : "Injury Rate by Group"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={injuryData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Bar dataKey={ar ? "معدل الإصابة" : "Injury Rate %"} fill="#ef4444" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-700 dark:text-amber-500" />
                {ar ? "الإيرادات حسب المجموعة" : "Revenue by Group"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={revenueData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => `${v.toLocaleString()} EGP`} />
                  <Bar dataKey={ar ? "الإيرادات" : "Revenue (EGP)"} fill="#f59e0b" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Insights */}
        {teams.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{ar ? "الرؤى التلقائية" : "Automated Insights"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(() => {
                const insights: string[] = [];
                const best = [...teams].sort((a: any, b: any) => b.avgAttendanceRate - a.avgAttendanceRate)[0];
                const worst = [...teams].sort((a: any, b: any) => a.avgAttendanceRate - b.avgAttendanceRate)[0];
                const highInjury = teams.filter((t: any) => t.injuryRate > 20);
                if (best) insights.push(ar ? `${best.ageGroup} لديها أعلى معدل حضور (${best.avgAttendanceRate}%)` : `${best.ageGroup} has the highest attendance rate (${best.avgAttendanceRate}%)`);
                if (worst && worst.avgAttendanceRate < 70) insights.push(ar ? `⚠️ ${worst.ageGroup} لديها أدنى معدل حضور (${worst.avgAttendanceRate}%) — تحتاج متابعة` : `⚠️ ${worst.ageGroup} has the lowest attendance (${worst.avgAttendanceRate}%) — needs attention`);
                if (highInjury.length > 0) insights.push(ar ? `⚠️ ${highInjury.map((t: any) => t.ageGroup).join(', ')} لديها معدل إصابة مرتفع (>20%)` : `⚠️ ${highInjury.map((t: any) => t.ageGroup).join(', ')} have high injury rates (>20%)`);
                const topRevenue = [...teams].sort((a: any, b: any) => b.revenue - a.revenue)[0];
                if (topRevenue && topRevenue.revenue > 0) insights.push(ar ? `${topRevenue.ageGroup} تولد أعلى إيرادات` : `${topRevenue.ageGroup} generates the highest revenue`);
                if (insights.length === 0) insights.push(ar ? "لا توجد بيانات كافية لتوليد رؤى" : "Insufficient data to generate insights");
                return insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/40">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{ins}</span>
                  </div>
                ));
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
