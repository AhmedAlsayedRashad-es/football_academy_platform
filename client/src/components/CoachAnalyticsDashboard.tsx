import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, ComposedChart, Area,
} from 'recharts';
import {
  Users, Shield, Activity, CheckCircle2, TrendingUp, Star,
  BarChart3, Target, Loader2, Award, Download, Filter,
} from 'lucide-react';

const TYPE_COLORS: Record<string, string> = {
  technical: '#6366f1',
  tactical: '#f59e0b',
  physical: '#22c55e',
  match: '#ef4444',
  recovery: '#3b82f6',
  mixed: '#a855f7',
};

const TYPE_LABELS_AR: Record<string, string> = {
  technical: 'تقني',
  tactical: 'تكتيكي',
  physical: 'بدني',
  match: 'مباراة',
  recovery: 'تعافي',
  mixed: 'مختلط',
};

function StatCard({
  icon: Icon, label, value, sub, color = 'text-primary', bg = 'bg-primary/10',
}: { icon: any; label: string; value: string | number; sub?: string; color?: string; bg?: string }) {
  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium text-foreground mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}{p.unit || ''}</span></p>
        ))}
      </div>
    );
  }
  return null;
};

export default function CoachAnalyticsDashboard() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>(undefined);

  // Fetch teams for the filter
  const { data: myTeams = [] } = trpc.privateTeams.getMyTeams.useQuery();

  // Overall stats (for KPI cards at top — always all teams)
  const { data: overallStats, isLoading: overallLoading } = trpc.privateTeams.getDashboardStats.useQuery();

  // Filtered stats (charts + tables)
  const { data: filteredStats, isLoading: filteredLoading } = trpc.privateTeams.getFilteredStats.useQuery(
    { teamId: selectedTeamId },
  );

  // Session comparison
  const { data: sessionComparison = [], isLoading: compLoading } = trpc.privateTeams.getSessionComparison.useQuery(
    { teamId: selectedTeamId },
  );

  // Player stats filtered
  const { data: playerStats = [], isLoading: playersLoading } = trpc.privateTeams.getFilteredPlayerStats.useQuery(
    { teamId: selectedTeamId },
  );

  const isLoading = overallLoading || filteredLoading || compLoading || playersLoading;

  // PDF Export via print
  const handleExportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !printRef.current) return;

    const teamName = selectedTeamId
      ? myTeams.find((t: any) => t.id === selectedTeamId)?.name || 'All Teams'
      : (isRTL ? 'جميع الفرق' : 'All Teams');

    const styles = `
      body { font-family: Arial, sans-serif; padding: 24px; color: #111; background: #fff; }
      h1 { font-size: 22px; margin-bottom: 4px; }
      h2 { font-size: 16px; margin: 20px 0 8px; border-bottom: 2px solid #6366f1; padding-bottom: 4px; }
      .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
      .kpi { background: #f4f4f8; border-radius: 8px; padding: 12px; }
      .kpi-label { font-size: 11px; color: #666; text-transform: uppercase; }
      .kpi-value { font-size: 24px; font-weight: bold; color: #6366f1; }
      table { width: 100%; border-collapse: collapse; font-size: 13px; }
      th { background: #6366f1; color: white; padding: 8px 10px; text-align: left; }
      td { padding: 7px 10px; border-bottom: 1px solid #eee; }
      tr:nth-child(even) td { background: #f9f9f9; }
      .green { color: #16a34a; font-weight: bold; }
      .red { color: #dc2626; font-weight: bold; }
      .yellow { color: #d97706; font-weight: bold; }
      @media print { body { padding: 0; } }
    `;

    const kpis = filteredStats ? [
      { label: isRTL ? 'إجمالي السيشنات' : 'Total Sessions', value: filteredStats.totalSessions },
      { label: isRTL ? 'سيشنات مكتملة' : 'Completed', value: filteredStats.completedSessions },
      { label: isRTL ? 'معدل الحضور' : 'Attendance Rate', value: `${filteredStats.attendanceRate}%` },
      { label: isRTL ? 'متوسط الأداء' : 'Avg Performance', value: filteredStats.avgPerformance ? `${filteredStats.avgPerformance}/10` : '—' },
      { label: isRTL ? 'عدد اللاعبين' : 'Players', value: playerStats.length },
      { label: isRTL ? 'الفريق' : 'Team', value: teamName },
    ] : [];

    const rows = playerStats.map((p: any) => `
      <tr>
        <td>${p.firstName} ${p.lastName}</td>
        <td>${p.position || '—'}</td>
        <td>${p.totalSessions}</td>
        <td class="green">${p.present}</td>
        <td class="red">${p.absent}</td>
        <td class="${p.attendanceRate >= 80 ? 'green' : p.attendanceRate >= 60 ? 'yellow' : 'red'}">${p.attendanceRate}%</td>
        <td>${p.avgRating != null ? `${p.avgRating}/10` : '—'}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Scouta Report — ${teamName}</title><style>${styles}</style></head>
      <body>
        <h1>Scouta — ${isRTL ? 'تقرير الأداء والحضور' : 'Performance & Attendance Report'}</h1>
        <p style="color:#666;font-size:13px;">${teamName} · ${new Date().toLocaleDateString()}</p>
        <h2>${isRTL ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators'}</h2>
        <div class="kpi-grid">${kpis.map(k => `<div class="kpi"><div class="kpi-label">${k.label}</div><div class="kpi-value">${k.value}</div></div>`).join('')}</div>
        <h2>${isRTL ? 'إحصائيات اللاعبين' : 'Player Statistics'}</h2>
        <table>
          <thead><tr>
            <th>${isRTL ? 'اللاعب' : 'Player'}</th>
            <th>${isRTL ? 'المركز' : 'Position'}</th>
            <th>${isRTL ? 'سيشنات' : 'Sessions'}</th>
            <th>${isRTL ? 'حضر' : 'Present'}</th>
            <th>${isRTL ? 'غائب' : 'Absent'}</th>
            <th>${isRTL ? 'معدل الحضور' : 'Attendance'}</th>
            <th>${isRTL ? 'متوسط الأداء' : 'Avg Rating'}</th>
          </tr></thead>
          <tbody>${rows || `<tr><td colspan="7" style="text-align:center;color:#999">${isRTL ? 'لا توجد بيانات' : 'No data'}</td></tr>`}</tbody>
        </table>
        <p style="margin-top:32px;font-size:11px;color:#aaa;text-align:center">Generated by Scouta Platform · ${new Date().toISOString()}</p>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = filteredStats;
  const hasData = overallStats && (overallStats.totalSessions > 0 || overallStats.totalTeams > 0);

  const topPerformers = [...playerStats]
    .filter((p: any) => p.avgRating != null)
    .sort((a: any, b: any) => b.avgRating - a.avgRating)
    .slice(0, 5);

  const topAttendance = [...playerStats]
    .filter((p: any) => p.totalSessions > 0)
    .sort((a: any, b: any) => b.attendanceRate - a.attendanceRate)
    .slice(0, 5);

  const attendanceChartData = playerStats
    .filter((p: any) => p.totalSessions > 0)
    .sort((a: any, b: any) => b.attendanceRate - a.attendanceRate)
    .slice(0, 8)
    .map((p: any) => ({
      name: `${p.firstName} ${p.lastName?.charAt(0)}.`,
      attendance: p.attendanceRate,
      rating: p.avgRating || 0,
    }));

  const sessionTypeData = stats?.sessionsByType?.map((t: any) => ({
    ...t,
    name: isRTL ? (TYPE_LABELS_AR[t.name] || t.name) : t.name,
    fill: TYPE_COLORS[t.name] || '#6366f1',
  })) || [];

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'} ref={printRef}>

      {/* Header + Filter + Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {isRTL ? 'لوحة الإحصائيات والتحليلات' : 'Analytics Dashboard'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {isRTL ? 'نظرة شاملة على أداء وحضور لاعبيك' : 'Overview of your players\' performance and attendance'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Team Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select
              value={selectedTeamId ? String(selectedTeamId) : 'all'}
              onValueChange={(v) => setSelectedTeamId(v === 'all' ? undefined : Number(v))}
            >
              <SelectTrigger className="w-44 h-9 text-sm">
                <SelectValue placeholder={isRTL ? 'كل الفرق' : 'All Teams'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'كل الفرق' : 'All Teams'}</SelectItem>
                {myTeams.map((t: any) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name_cpt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Export PDF */}
          <Button size="sm" variant="outline" onClick={handleExportPDF} className="gap-2 h-9">
            <Download className="w-4 h-4" />
            {isRTL ? 'تصدير PDF' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* KPI Cards — always show overall */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          icon={Shield}
          label={isRTL ? 'الفرق الخاصة' : 'Private Teams'}
          value={overallStats?.totalTeams ?? 0}
          color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-500/10"
        />
        <StatCard
          icon={Activity}
          label={isRTL ? 'إجمالي السيشنات' : 'Total Sessions'}
          value={stats?.totalSessions ?? 0}
          color="text-purple-600 dark:text-purple-400" bg="bg-purple-500/10"
        />
        <StatCard
          icon={Users}
          label={isRTL ? 'اللاعبون' : 'Players'}
          value={playerStats.length}
          color="text-blue-600 dark:text-blue-400" bg="bg-blue-500/10"
        />
        <StatCard
          icon={CheckCircle2}
          label={isRTL ? 'سيشنات مكتملة' : 'Completed'}
          value={stats?.completedSessions ?? 0}
          color="text-green-700 dark:text-green-400" bg="bg-green-500/10"
        />
        <StatCard
          icon={TrendingUp}
          label={isRTL ? 'معدل الحضور' : 'Attendance Rate'}
          value={`${stats?.attendanceRate ?? 0}%`}
          color={(stats?.attendanceRate ?? 0) >= 80 ? 'text-green-700 dark:text-green-400' : (stats?.attendanceRate ?? 0) >= 60 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}
          bg={(stats?.attendanceRate ?? 0) >= 80 ? 'bg-green-500/10' : (stats?.attendanceRate ?? 0) >= 60 ? 'bg-yellow-500/10' : 'bg-red-500/10'}
        />
        <StatCard
          icon={Star}
          label={isRTL ? 'متوسط الأداء' : 'Avg. Performance'}
          value={stats?.avgPerformance ? `${stats.avgPerformance}/10` : '—'}
          color="text-yellow-700 dark:text-yellow-400" bg="bg-yellow-500/10"
        />
      </div>

      {!hasData ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="w-12 h-12 text-muted-foreground mb-3 opacity-30" />
            <p className="text-muted-foreground font-medium">
              {isRTL ? 'لا توجد بيانات كافية بعد' : 'Not enough data yet'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL ? 'أنشئ سيشنات وأضف لاعبين لتظهر الإحصائيات هنا' : 'Create sessions and add players to see analytics here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Row 1: Monthly Line + Session Types Pie */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" />
                  {isRTL ? 'السيشنات خلال آخر 6 أشهر' : 'Sessions — Last 6 Months'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats?.monthlyData || []} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#888' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#888' }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line type="monotone" dataKey="sessions" name={isRTL ? 'سيشنات' : 'Sessions'}
                        stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  {isRTL ? 'أنواع السيشنات' : 'Session Types'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {sessionTypeData.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    {isRTL ? 'لا توجد بيانات' : 'No data'}
                  </div>
                ) : (
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sessionTypeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                          {sessionTypeData.map((entry: any, index: number) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: '#aaa' }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Session Comparison Chart (NEW) */}
          {sessionComparison.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-700 dark:text-green-400" />
                  {isRTL ? 'مقارنة أداء وحضور السيشنات' : 'Session Performance & Attendance Comparison'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: 230 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={sessionComparison} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#888' }} />
                      <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#888' }} domain={[0, 100]} unit="%" />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#888' }} domain={[0, 10]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: '#aaa' }}>{v}</span>} />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="attendanceRate"
                        name={isRTL ? 'الحضور %' : 'Attendance %'}
                        fill="#22c55e20"
                        stroke="#22c55e"
                        strokeWidth={2}
                        unit="%"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="avgRating"
                        name={isRTL ? 'متوسط الأداء' : 'Avg Rating'}
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{ fill: '#f59e0b', r: 4 }}
                        connectNulls
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Row 3: Attendance Pie + Player Attendance Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-700 dark:text-green-400" />
                  {isRTL ? 'توزيع الحضور' : 'Attendance Breakdown'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(stats?.attendanceBreakdown?.every((b: any) => b.value === 0)) ? (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    {isRTL ? 'لا توجد بيانات حضور' : 'No attendance data'}
                  </div>
                ) : (
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats?.attendanceBreakdown?.filter((b: any) => b.value > 0)}
                          cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                          {stats?.attendanceBreakdown?.filter((b: any) => b.value > 0).map((entry: any, index: number) => (
                            <Cell key={index} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: '#aaa' }}>{v}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {isRTL ? 'معدل حضور اللاعبين (أعلى 8)' : 'Player Attendance Rate (Top 8)'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendanceChartData.length === 0 ? (
                  <div className="flex items-center justify-center h-[200px] text-muted-foreground text-sm">
                    {isRTL ? 'لا توجد بيانات' : 'No data'}
                  </div>
                ) : (
                  <div style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#888' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#888' }} domain={[0, 100]} unit="%" />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="attendance" name={isRTL ? 'الحضور %' : 'Attendance %'} radius={[4, 4, 0, 0]}>
                          {attendanceChartData.map((entry: any, index: number) => (
                            <Cell key={index}
                              fill={entry.attendance >= 80 ? '#22c55e' : entry.attendance >= 60 ? '#f59e0b' : '#ef4444'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Leaderboards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
                  {isRTL ? 'أفضل اللاعبين أداءً' : 'Top Performers'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topPerformers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isRTL ? 'لا توجد تقييمات بعد' : 'No ratings yet'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {topPerformers.map((p: any, i: number) => (
                      <div key={p.playerId} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-yellow-700 dark:text-yellow-400' : i === 1 ? 'text-muted-foreground' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            #{i + 1}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary overflow-hidden flex-shrink-0">
                            {p.photoUrl ? <img src={p.photoUrl} alt="" className="w-full h-full object-cover" /> : `${p.firstName?.[0]}${p.lastName?.[0]}`}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                            <p className="text-xs text-muted-foreground">{p.position} · {p.totalSessions} {isRTL ? 'سيشن' : 'sessions'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                          <Star className="w-3.5 h-3.5 fill-yellow-400" />
                          <span className="text-sm font-bold">{p.avgRating}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-700 dark:text-green-400" />
                  {isRTL ? 'أعلى حضوراً' : 'Best Attendance'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topAttendance.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isRTL ? 'لا توجد بيانات حضور بعد' : 'No attendance data yet'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {topAttendance.map((p: any, i: number) => (
                      <div key={p.playerId} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold w-5 text-center ${i === 0 ? 'text-yellow-700 dark:text-yellow-400' : i === 1 ? 'text-muted-foreground' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                            #{i + 1}
                          </span>
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary overflow-hidden flex-shrink-0">
                            {p.photoUrl ? <img src={p.photoUrl} alt="" className="w-full h-full object-cover" /> : `${p.firstName?.[0]}${p.lastName?.[0]}`}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{p.firstName} {p.lastName}</p>
                            <p className="text-xs text-muted-foreground">{p.present}/{p.totalSessions} {isRTL ? 'حضر' : 'attended'}</p>
                          </div>
                        </div>
                        <Badge className={`text-xs border ${p.attendanceRate >= 80 ? 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' : p.attendanceRate >= 60 ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'}`}>
                          {p.attendanceRate}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Full Player Stats Table */}
          {playerStats.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  {isRTL ? 'إحصائيات جميع اللاعبين' : 'All Players Statistics'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {[
                          isRTL ? 'اللاعب' : 'Player',
                          isRTL ? 'سيشنات' : 'Sessions',
                          isRTL ? 'حضر' : 'Present',
                          isRTL ? 'غائب' : 'Absent',
                          isRTL ? 'معدل الحضور' : 'Attendance',
                          isRTL ? 'متوسط الأداء' : 'Avg Rating',
                        ].map((h) => (
                          <th key={h} className="text-start py-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {playerStats.map((p: any) => (
                        <tr key={p.playerId} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary overflow-hidden flex-shrink-0">
                                {p.photoUrl ? <img src={p.photoUrl} alt="" className="w-full h-full object-cover" /> : `${p.firstName?.[0]}${p.lastName?.[0]}`}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{p.firstName} {p.lastName}</p>
                                <p className="text-xs text-muted-foreground">{p.position}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-center py-2 px-3 text-muted-foreground">{p.totalSessions}</td>
                          <td className="text-center py-2 px-3 text-green-700 dark:text-green-400 font-medium">{p.present}</td>
                          <td className="text-center py-2 px-3 text-red-600 dark:text-red-400 font-medium">{p.absent}</td>
                          <td className="text-center py-2 px-3">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${p.attendanceRate >= 80 ? 'bg-green-500' : p.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                  style={{ width: `${p.attendanceRate}%` }} />
                              </div>
                              <span className={`text-xs font-bold ${p.attendanceRate >= 80 ? 'text-green-700 dark:text-green-400' : p.attendanceRate >= 60 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                                {p.attendanceRate}%
                              </span>
                            </div>
                          </td>
                          <td className="text-center py-2 px-3">
                            {p.avgRating != null ? (
                              <span className="flex items-center justify-center gap-1 text-yellow-700 dark:text-yellow-400">
                                <Star className="w-3 h-3 fill-yellow-400" />
                                <span className="font-bold text-xs">{p.avgRating}</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
