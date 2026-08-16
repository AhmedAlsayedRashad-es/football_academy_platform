import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  TrendingUp, TrendingDown, DollarSign, Users, AlertTriangle,
  BarChart3, PieChart, Target, Award, Clock
, ArrowLeft } from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, ArcElement
} from "chart.js";
import { Bar, Line, Doughnut } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement);

function formatEGP(amount: number) {
  return `EGP ${(amount / 100).toLocaleString("en-EG", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function KPICard({ title, value, subtitle, icon: Icon, color, trend }: {
  title: string; value: string; subtitle?: string; icon: any; color: string; trend?: number;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {Math.abs(trend)}% vs last month
              </div>
            )}
          </div>
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ExecutiveDashboard() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const { data: stats } = trpc.finance.getStats.useQuery();
  const { data: chartData } = trpc.finance.getMonthlyChart.useQuery();
  const { data: allFees } = trpc.finance.getPlayerFees.useQuery({});
  const { data: schStats } = trpc.scholarships.getStats.useQuery();
  const { data: staffSummary } = trpc.staffCosts.getMonthSummary.useQuery({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const { data: allPlayers } = trpc.players.getAll.useQuery();

  // Derived metrics
  const totalRevenue = stats?.totalRevenue || 0;
  const totalExpenses = stats?.totalExpenses || 0;
  const netProfit = totalRevenue - totalExpenses - (staffSummary?.totalSalaries || 0);
  const pendingFees = stats?.pendingFees || 0;
  const collectionRate = stats?.collectionRate || 0;
  const overdueCount = stats?.overdueCount || 0;
  const activePlayers = (allPlayers || []).filter((p: any) => p.status === "active").length;
  const avgRevenuePerPlayer = activePlayers > 0 ? Math.round(totalRevenue / activePlayers) : 0;

  // Chart: Revenue vs Expenses (6 months)
  const months = chartData || [];
  const revenueVsExpensesData = {
    labels: months.map((m: any) => m.label),
    datasets: [
      {
        label: isRTL ? "الإيرادات" : "Revenue",
        data: months.map((m: any) => m.revenue / 100),
        backgroundColor: "rgba(16,185,129,0.8)",
        borderColor: "rgb(16,185,129)",
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: isRTL ? "المصروفات" : "Expenses",
        data: months.map((m: any) => m.expenses / 100),
        backgroundColor: "rgba(239,68,68,0.7)",
        borderColor: "rgb(239,68,68)",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  // Chart: Net Profit trend
  const netProfitData = {
    labels: months.map((m: any) => m.label),
    datasets: [
      {
        label: isRTL ? "صافي الربح" : "Net Profit",
        data: months.map((m: any) => (m.revenue - m.expenses) / 100),
        borderColor: "rgb(99,102,241)",
        backgroundColor: "rgba(99,102,241,0.1)",
        borderWidth: 2,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: "rgb(99,102,241)",
      },
    ],
  };

  // Fee status breakdown
  const fees = allFees || [];
  const paidFees = fees.filter((f: any) => f.fee?.status === "paid").length;
  const pendingFeesCount = fees.filter((f: any) => f.fee?.status === "pending").length;
  const overdueFeesCount = fees.filter((f: any) => f.fee?.status === "overdue").length;
  const partialFeesCount = fees.filter((f: any) => f.fee?.status === "partial").length;

  const feeStatusData = {
    labels: [
      isRTL ? "مدفوع" : "Paid",
      isRTL ? "معلق" : "Pending",
      isRTL ? "متأخر" : "Overdue",
      isRTL ? "جزئي" : "Partial",
    ],
    datasets: [{
      data: [paidFees, pendingFeesCount, overdueFeesCount, partialFeesCount],
      backgroundColor: ["#10b981", "#f59e0b", "#ef4444", "#6366f1"],
      borderWidth: 0,
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" as const, labels: { font: { size: 11 } } } },
    scales: { y: { beginAtZero: true, ticks: { font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } },
  };

  return (
    <>

      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </button>
      <div className={`space-y-6 ${isRTL ? "rtl" : "ltr"}`}>
        {/* Header Banner */}
        <div className="brand-gradient rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="h-6 w-6 text-yellow-400" />
                <h1 className="text-2xl font-bold">
                  {isRTL ? "لوحة القيادة التنفيذية" : "Executive Revenue Dashboard"}
                </h1>
              </div>
              <p className="text-red-200 text-sm">
                {isRTL ? "نظرة شاملة على الأداء المالي للأكاديمية" : "Comprehensive financial performance overview for academy leadership"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-28 bg-white/10 border-white/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* KPI Cards Row 1 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title={isRTL ? "إيرادات الشهر الحالي" : "Monthly Revenue"}
            value={formatEGP(totalRevenue)}
            subtitle={isRTL ? "إجمالي المحصل" : "Total collected"}
            icon={TrendingUp}
            color="bg-emerald-100 text-emerald-600"
          />
          <KPICard
            title={isRTL ? "صافي الربح" : "Net Profit"}
            value={formatEGP(Math.max(0, netProfit))}
            subtitle={isRTL ? "بعد المصروفات والرواتب" : "After expenses & salaries"}
            icon={DollarSign}
            color={netProfit >= 0 ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"}
          />
          <KPICard
            title={isRTL ? "معدل التحصيل" : "Collection Rate"}
            value={`${collectionRate}%`}
            subtitle={isRTL ? `${overdueCount} رسوم متأخرة` : `${overdueCount} overdue fees`}
            icon={Target}
            color={collectionRate >= 80 ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}
          />
          <KPICard
            title={isRTL ? "الرسوم المعلقة" : "Outstanding Debt"}
            value={formatEGP(pendingFees)}
            subtitle={isRTL ? "في انتظار التحصيل" : "Awaiting collection"}
            icon={AlertTriangle}
            color="bg-orange-100 text-orange-600"
          />
        </div>

        {/* KPI Cards Row 2 */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title={isRTL ? "اللاعبون النشطون" : "Active Players"}
            value={String(activePlayers)}
            subtitle={isRTL ? "مسجلون حالياً" : "Currently enrolled"}
            icon={Users}
            color="bg-purple-100 text-purple-600"
          />
          <KPICard
            title={isRTL ? "متوسط الإيراد/لاعب" : "Avg Revenue / Player"}
            value={formatEGP(avgRevenuePerPlayer)}
            subtitle={isRTL ? "هذا الشهر" : "This month"}
            icon={DollarSign}
            color="bg-indigo-100 text-indigo-600"
          />
          <KPICard
            title={isRTL ? "المنح الدراسية النشطة" : "Active Scholarships"}
            value={String(schStats?.active || 0)}
            subtitle={isRTL ? `إجمالي قيمة الخصم: ${formatEGP(schStats?.totalDiscountValue || 0)}` : `Total discount: ${formatEGP(schStats?.totalDiscountValue || 0)}`}
            icon={Award}
            color="bg-yellow-100 text-yellow-600"
          />
          <KPICard
            title={isRTL ? "رواتب الموظفين المعلقة" : "Pending Staff Salaries"}
            value={String(staffSummary?.pendingCount || 0)}
            subtitle={isRTL ? `إجمالي الرواتب: ${formatEGP(staffSummary?.totalSalaries || 0)}` : `Total payroll: ${formatEGP(staffSummary?.totalSalaries || 0)}`}
            icon={Clock}
            color="bg-red-100 text-red-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Revenue vs Expenses Bar Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-700 dark:text-emerald-500" />
                {isRTL ? "الإيرادات مقابل المصروفات (6 أشهر)" : "Revenue vs Expenses (6 Months)"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: 260 }}>
                {months.length > 0 ? (
                  <Bar data={revenueVsExpensesData} options={chartOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    {isRTL ? "لا توجد بيانات بعد — قم بتسجيل رسوم أو مصروفات" : "No data yet — record fees or expenses to see chart"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fee Status Doughnut */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <PieChart className="h-4 w-4 text-indigo-500" />
                {isRTL ? "توزيع حالة الرسوم" : "Fee Status Breakdown"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: 260 }}>
                {fees.length > 0 ? (
                  <Doughnut
                    data={feeStatusData}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom", labels: { font: { size: 11 } } } } }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                    {isRTL ? "لا توجد رسوم مسجلة" : "No fees recorded yet"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Net Profit Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-500" />
              {isRTL ? "اتجاه صافي الربح (6 أشهر)" : "Net Profit Trend (6 Months)"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 220 }}>
              {months.length > 0 ? (
                <Line data={netProfitData} options={{ ...chartOptions, scales: { y: { ticks: { font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } } }} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  {isRTL ? "لا توجد بيانات بعد" : "No data yet"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Financial Health Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              {isRTL ? "ملخص الصحة المالية" : "Financial Health Summary"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className={`text-3xl font-bold ${collectionRate >= 80 ? "text-emerald-600" : collectionRate >= 60 ? "text-yellow-600" : "text-red-600"}`}>
                  {collectionRate}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">{isRTL ? "معدل التحصيل" : "Collection Rate"}</div>
                <Badge variant={collectionRate >= 80 ? "default" : "destructive"} className="mt-2 text-xs">
                  {collectionRate >= 80 ? (isRTL ? "ممتاز" : "Excellent") : collectionRate >= 60 ? (isRTL ? "جيد" : "Good") : (isRTL ? "يحتاج تحسين" : "Needs Improvement")}
                </Badge>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className={`text-3xl font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {netProfit >= 0 ? "+" : ""}{formatEGP(netProfit)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{isRTL ? "صافي الربح هذا الشهر" : "Net Profit This Month"}</div>
                <Badge variant={netProfit >= 0 ? "default" : "destructive"} className="mt-2 text-xs">
                  {netProfit >= 0 ? (isRTL ? "ربح" : "Profitable") : (isRTL ? "خسارة" : "Loss")}
                </Badge>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <div className={`text-3xl font-bold ${overdueCount === 0 ? "text-emerald-600" : overdueCount <= 5 ? "text-yellow-600" : "text-red-600"}`}>
                  {overdueCount}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{isRTL ? "رسوم متأخرة" : "Overdue Fees"}</div>
                <Badge variant={overdueCount === 0 ? "default" : "destructive"} className="mt-2 text-xs">
                  {overdueCount === 0 ? (isRTL ? "لا توجد" : "None") : (isRTL ? "تحتاج متابعة" : "Needs Follow-up")}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Forecasting */}
        {months.length >= 3 && (() => {
          // Simple linear regression on last 6 months
          const revenuePoints = months.map((m: any, i: number) => ({ x: i, y: m.revenue / 100 }));
          const n = revenuePoints.length;
          const sumX = revenuePoints.reduce((s: number, p: any) => s + p.x, 0);
          const sumY = revenuePoints.reduce((s: number, p: any) => s + p.y, 0);
          const sumXY = revenuePoints.reduce((s: number, p: any) => s + p.x * p.y, 0);
          const sumX2 = revenuePoints.reduce((s: number, p: any) => s + p.x * p.x, 0);
          const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX) || 0;
          const intercept = (sumY - slope * sumX) / n;
          // Forecast next 3 months
          const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          const MONTH_NAMES_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
          const lastMonth = months[months.length - 1];
          const forecastMonths = [1, 2, 3].map(offset => {
            const d = new Date(lastMonth.year, lastMonth.month - 1 + offset, 1);
            const forecastY = Math.max(0, Math.round(slope * (n - 1 + offset) + intercept));
            return {
              label: (isRTL ? MONTH_NAMES_AR : MONTH_NAMES)[d.getMonth()] + ' ' + String(d.getFullYear()).slice(2),
              forecast: forecastY,
              isForecast: true,
            };
          });
          const combinedData = [
            ...months.map((m: any) => ({ label: m.label, actual: Math.round(m.revenue / 100), isForecast: false })),
            ...forecastMonths,
          ];
          const forecastChartData = {
            labels: combinedData.map((d: any) => d.label),
            datasets: [
              {
                label: isRTL ? 'الإيرادات الفعلية' : 'Actual Revenue',
                data: combinedData.map((d: any) => d.actual ?? null),
                borderColor: 'rgb(16,185,129)',
                backgroundColor: 'rgba(16,185,129,0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 5,
              },
              {
                label: isRTL ? 'التوقع' : 'Forecast',
                data: combinedData.map((d: any) => d.forecast ?? null),
                borderColor: 'rgb(99,102,241)',
                backgroundColor: 'rgba(99,102,241,0.1)',
                borderWidth: 2,
                borderDash: [6, 3],
                fill: false,
                tension: 0.3,
                pointRadius: 5,
                pointStyle: 'triangle',
              },
            ],
          };
          const trend = slope > 0 ? 'up' : slope < 0 ? 'down' : 'flat';
          return (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-indigo-500" />
                  {isRTL ? 'توقع الإيرادات (3 أشهر قادمة)' : 'Revenue Forecast (Next 3 Months)'}
                  <Badge className={`text-xs ml-2 ${trend === 'up' ? 'bg-green-100 text-green-700' : trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                    {trend === 'up' ? (isRTL ? '↑ اتجاه صاعد' : '↑ Upward Trend') : trend === 'down' ? (isRTL ? '↓ اتجاه هابط' : '↓ Downward Trend') : (isRTL ? '→ مستقر' : '→ Stable')}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: 240 }}>
                  <Line data={forecastChartData} options={{ ...chartOptions, scales: { y: { beginAtZero: false, ticks: { font: { size: 11 } } }, x: { ticks: { font: { size: 11 } } } } }} />
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {forecastMonths.map((fm: any) => (
                    <div key={fm.label} className="text-center p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/50">
                      <p className="text-xs text-muted-foreground">{fm.label}</p>
                      <p className="text-lg font-bold text-indigo-700 dark:text-indigo-400">{fm.forecast.toLocaleString(isRTL ? 'ar-EG' : 'en-US')} {isRTL ? 'ج.م' : 'EGP'}</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'متوقع' : 'Projected'}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {isRTL ? '* التوقع مبني على الانحدار الخطي للأشهر الستة الماضية' : '* Forecast based on linear regression of the past 6 months'}
                </p>
              </CardContent>
            </Card>
          );
        })()}
      </div>
    </>
  );
}
