import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  User,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  MapPin,
  Printer,
  Activity,
  Target,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { format } from 'date-fns';

const ATTENDANCE_COLORS: Record<string, string> = {
  present: '#22c55e',
  absent: '#ef4444',
  late: '#f59e0b',
  excused: '#3b82f6',
};

const SESSION_TYPE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

const ATTENDANCE_LABELS: Record<string, { en: string; ar: string }> = {
  present: { en: 'Present', ar: 'حاضر' },
  absent: { en: 'Absent', ar: 'غائب' },
  late: { en: 'Late', ar: 'متأخر' },
  excused: { en: 'Excused', ar: 'معذور' },
};

export default function CoachPlayerReport() {
  const params = useParams<{ playerId: string }>();
  const playerId = parseInt(params.playerId || '0');
  const [, setLocation] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const { data, isLoading, error } = trpc.privateTeams.getPlayerReport.useQuery(
    { playerId },
    { enabled: !!playerId }
  );

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <div className="p-6 text-center text-muted-foreground">
          {isRTL ? 'لم يتم العثور على بيانات اللاعب' : 'Player data not found'}
        </div>
      </>
    );
  }

  const { player, stats, typeBreakdown, sessionHistory } = data;

  // Chart data: performance over time
  const performanceChartData = sessionHistory
    .filter((s) => s.rating != null)
    .map((s) => ({
      date: s.date ? format(new Date(s.date), 'dd/MM') : '',
      rating: s.rating,
      type: s.type,
    }));

  // Attendance pie data
  const attendancePieData = [
    { name: isRTL ? 'حاضر' : 'Present', value: stats.present, color: ATTENDANCE_COLORS.present },
    { name: isRTL ? 'غائب' : 'Absent', value: stats.absent, color: ATTENDANCE_COLORS.absent },
    { name: isRTL ? 'متأخر' : 'Late', value: stats.late, color: ATTENDANCE_COLORS.late },
    { name: isRTL ? 'معذور' : 'Excused', value: stats.excused, color: ATTENDANCE_COLORS.excused },
  ].filter((d) => d.value > 0);

  // Session type breakdown bar data
  const typeBarData = Object.entries(typeBreakdown).map(([type, count]) => ({
    type: type.charAt(0).toUpperCase() + type.slice(1),
    count,
  }));

  const fullName = `${player.firstName} ${player.lastName}`;

  return (
    <>
      <div className="p-6 max-w-6xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Print styles */}
        <style>{`
          @media print {
            .no-print { display: none !important; }
            .print-break { page-break-before: always; }
            body { background: white !important; color: black !important; }
            .bg-card, .bg-background { background: white !important; }
          }
        `}</style>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 no-print">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/coach/my-teams')}>
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {isRTL ? `تقرير اللاعب: ${fullName}` : `Player Report: ${fullName}`}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isRTL ? 'تحليل الأداء والحضور عبر جميع السيشنات' : 'Performance & attendance analysis across all sessions'}
              </p>
            </div>
          </div>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="w-4 h-4" />
            {isRTL ? 'طباعة / PDF' : 'Print / PDF'}
          </Button>
        </div>

        {/* Print Header */}
        <div className="hidden print:block mb-6 text-center border-b pb-4">
          <h1 className="text-2xl font-bold">{isRTL ? `تقرير اللاعب: ${fullName}` : `Player Report: ${fullName}`}</h1>
          <p className="text-sm text-muted-foreground">{isRTL ? 'تاريخ التقرير:' : 'Report Date:'} {format(new Date(), 'dd/MM/yyyy')}</p>
        </div>

        {/* Player Info Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-6">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={fullName} className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="w-10 h-10 text-primary" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground">{fullName}</h2>
                <div className="flex flex-wrap gap-3 mt-2">
                  {player.position && (
                    <Badge variant="secondary">{player.position}</Badge>
                  )}
                  {player.jerseyNumber && (
                    <Badge variant="outline">#{player.jerseyNumber}</Badge>
                  )}
                  {player.nationality && (
                    <Badge variant="outline">{player.nationality}</Badge>
                  )}
                  {player.dateOfBirth && (
                    <span className="text-sm text-muted-foreground">
                      {isRTL ? 'تاريخ الميلاد:' : 'DOB:'} {format(new Date(player.dateOfBirth), 'dd/MM/yyyy')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
          {[
            { label: isRTL ? 'إجمالي السيشنات' : 'Total Sessions', value: stats.totalSessions, icon: <Calendar className="w-5 h-5" />, color: 'text-blue-600 dark:text-blue-400' },
            { label: isRTL ? 'معدل الحضور' : 'Attendance Rate', value: `${stats.attendanceRate}%`, icon: <TrendingUp className="w-5 h-5" />, color: stats.attendanceRate >= 70 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400' },
            { label: isRTL ? 'متوسط الأداء' : 'Avg Rating', value: stats.avgRating != null ? `${stats.avgRating}/10` : '—', icon: <Star className="w-5 h-5" />, color: 'text-yellow-700 dark:text-yellow-400' },
            { label: isRTL ? 'حاضر' : 'Present', value: stats.present, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-green-700 dark:text-green-400' },
            { label: isRTL ? 'غائب' : 'Absent', value: stats.absent, icon: <XCircle className="w-5 h-5" />, color: 'text-red-600 dark:text-red-400' },
            { label: isRTL ? 'متأخر' : 'Late', value: stats.late, icon: <AlertCircle className="w-5 h-5" />, color: 'text-yellow-700 dark:text-yellow-400' },
          ].map((kpi, i) => (
            <Card key={i}>
              <CardContent className="pt-4 pb-4">
                <div className={`${kpi.color} mb-1`}>{kpi.icon}</div>
                <div className="text-xl font-bold text-foreground">{kpi.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{kpi.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Performance Over Time */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                {isRTL ? 'تطور الأداء عبر الزمن' : 'Performance Over Time'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={performanceChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }}
                      labelStyle={{ color: '#f9fafb' }}
                    />
                    <Line type="monotone" dataKey="rating" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} name={isRTL ? 'التقييم' : 'Rating'} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  {isRTL ? 'لا توجد تقييمات بعد' : 'No ratings yet'}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attendance Pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                {isRTL ? 'توزيع الحضور' : 'Attendance Breakdown'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendancePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {attendancePieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">
                  {isRTL ? 'لا توجد بيانات' : 'No data yet'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session Type Breakdown */}
        {typeBarData.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                {isRTL ? 'أنواع السيشنات' : 'Session Types'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={typeBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis type="category" dataKey="type" tick={{ fill: '#9ca3af', fontSize: 11 }} width={80} />
                  <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 8 }} />
                  <Bar dataKey="count" name={isRTL ? 'عدد السيشنات' : 'Sessions'} radius={[0, 4, 4, 0]}>
                    {typeBarData.map((_, index) => (
                      <Cell key={index} fill={SESSION_TYPE_COLORS[index % SESSION_TYPE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Session History Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              {isRTL ? 'سجل السيشنات الكامل' : 'Full Session History'}
              <Badge variant="secondary">{sessionHistory.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessionHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {isRTL ? 'لا توجد سيشنات بعد' : 'No sessions yet'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-start py-2 px-3 text-muted-foreground font-medium">{isRTL ? 'التاريخ' : 'Date'}</th>
                      <th className="text-start py-2 px-3 text-muted-foreground font-medium">{isRTL ? 'السيشن' : 'Session'}</th>
                      <th className="text-start py-2 px-3 text-muted-foreground font-medium">{isRTL ? 'النوع' : 'Type'}</th>
                      <th className="text-start py-2 px-3 text-muted-foreground font-medium">{isRTL ? 'الحضور' : 'Attendance'}</th>
                      <th className="text-start py-2 px-3 text-muted-foreground font-medium">{isRTL ? 'التقييم' : 'Rating'}</th>
                      <th className="text-start py-2 px-3 text-muted-foreground font-medium">{isRTL ? 'ملاحظات' : 'Notes'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessionHistory.map((s, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-2 px-3 text-muted-foreground">
                          {s.date ? format(new Date(s.date), 'dd/MM/yyyy') : '—'}
                        </td>
                        <td className="py-2 px-3 text-foreground font-medium">{s.title}</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="text-xs capitalize">{s.type}</Badge>
                        </td>
                        <td className="py-2 px-3">
                          <span className="flex items-center gap-1">
                            {s.attendance === 'present' && <CheckCircle2 className="w-3.5 h-3.5 text-green-700 dark:text-green-400" />}
                            {s.attendance === 'absent' && <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />}
                            {s.attendance === 'late' && <AlertCircle className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-400" />}
                            {s.attendance === 'excused' && <AlertCircle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                            <span className="text-xs capitalize">
                              {s.attendance ? (ATTENDANCE_LABELS[s.attendance]?.[isRTL ? 'ar' : 'en'] || s.attendance) : '—'}
                            </span>
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {s.rating != null ? (
                            <span className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-400 fill-yellow-400" />
                              <span className="font-medium text-foreground">{s.rating}/10</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-muted-foreground text-xs max-w-[200px] truncate">
                          {s.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
