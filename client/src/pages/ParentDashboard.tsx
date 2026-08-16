import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {User, Calendar, Bell, FileText, TrendingUp, Clock,
  MapPin, Phone, Mail, BookOpen, Award, Activity, ArrowLeft,
  CheckCircle2, XCircle, AlertCircle, ChevronRight, X, CalendarPlus, ExternalLink} from 'lucide-react';
import { Link , useLocation } from 'wouter';
import { format } from 'date-fns';


export default function ParentDashboard() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  
  // Simple translation helper
  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      'common.loading': { en: 'Loading...', ar: 'جاري التحميل...' },
      'common.viewAll': { en: 'View All', ar: 'عرض الكل' },
      'common.download': { en: 'Download', ar: 'تحميل' },
      'parentDashboard.title': { en: 'Parent Dashboard', ar: 'لوحة تحكم ولي الأمر' },
      'parentDashboard.subtitle': { en: 'Monitor your children\'s progress and upcoming activities', ar: 'راقب تقدم أطفالك والأنشطة القادمة' },
      'parentDashboard.bookSession': { en: 'Book Session', ar: 'حجز جلسة' },
      'parentDashboard.viewReports': { en: 'View Reports', ar: 'عرض التقارير' },
      'parentDashboard.age': { en: 'Age', ar: 'العمر' },
      'parentDashboard.overallRating': { en: 'Overall', ar: 'التقييم الإجمالي' },
      'parentDashboard.activities30Days': { en: '30 Days', ar: '30 يوم' },
      'parentDashboard.upcomingSessions': { en: 'Upcoming Sessions', ar: 'الجلسات القادمة' },
      'parentDashboard.with': { en: 'with', ar: 'مع' },
      'parentDashboard.noUpcomingSessions': { en: 'No upcoming sessions scheduled', ar: 'لا توجد جلسات قادمة مجدولة' },
      'parentDashboard.bookFirstSession': { en: 'Book Your First Session', ar: 'احجز جلستك الأولى' },
      'parentDashboard.recentReports': { en: 'Recent Reports', ar: 'التقارير الأخيرة' },
      'parentDashboard.noReports': { en: 'No reports available yet', ar: 'لا توجد تقارير متاحة بعد' },
      'parentDashboard.notifications': { en: 'Notifications', ar: 'الإشعارات' },
      'parentDashboard.noNotifications': { en: 'No new notifications', ar: 'لا توجد إشعارات جديدة' },
      'parentDashboard.quickActions': { en: 'Quick Actions', ar: 'إجراءات سريعة' },
      'parentDashboard.myBookings': { en: 'My Bookings', ar: 'حجوزاتي' },
      'parentDashboard.contactCoach': { en: 'Contact Coach', ar: 'اتصل بالمدرب' },
      'skills.technical': { en: 'Technical', ar: 'فني' },
      'skills.physical': { en: 'Physical', ar: 'بدني' },
      'skills.tactical': { en: 'Tactical', ar: 'تكتيكي' },
      'skills.mental': { en: 'Mental', ar: 'عقلي' },
    };
    return translations[key]?.[language] || key;
  };
  // Calendar export helpers
  const buildGoogleCalendarUrl = (title: string, date: string, startTime: string, location?: string, description?: string) => {
    const dateStr = date.replace(/-/g, '');
    const [h, m] = (startTime || '09:00').split(':');
    const startDt = `${dateStr}T${h.padStart(2,'0')}${(m||'00').padStart(2,'0')}00`;
    const endH = String(parseInt(h) + 1).padStart(2, '0');
    const endDt = `${dateStr}T${endH}${(m||'00').padStart(2,'0')}00`;
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates: `${startDt}/${endDt}`,
      details: description || 'Training session',
      location: location || '',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const buildAppleCalendarUrl = (title: string, date: string, startTime: string, location?: string) => {
    const dateStr = date.replace(/-/g, '');
    const [h, m] = (startTime || '09:00').split(':');
    const startDt = `${dateStr}T${h.padStart(2,'0')}${(m||'00').padStart(2,'0')}00`;
    const endH = String(parseInt(h) + 1).padStart(2, '0');
    const endDt = `${dateStr}T${endH}${(m||'00').padStart(2,'0')}00`;
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `DTSTART:${startDt}`,
      `DTEND:${endDt}`,
      `SUMMARY:${title}`,
      `LOCATION:${location || ''}`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    return URL.createObjectURL(blob);
  };

  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [showChildDetail, setShowChildDetail] = useState(false);

  // Child detail data
  const { data: childData, isLoading: childDataLoading } = trpc.parentDashboard.getChildData.useQuery(
    { playerId: selectedChild! },
    { enabled: !!selectedChild && showChildDetail }
  );

  // Fetch comprehensive dashboard data
  const { data: dashboardData, isLoading } = trpc.parentDashboard.getDashboardData.useQuery(undefined, { retry: false });
  const { data: childrenSummary } = trpc.parentDashboard.getChildrenSummary.useQuery(undefined, { retry: false });

  if (isLoading) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
          </div>
        </div>
      </>
    );
  }

  const children = dashboardData?.children || [];
  const upcomingSessions = dashboardData?.upcomingSessions || [];
  const recentNotifications = dashboardData?.recentNotifications || [];
  const recentReports = dashboardData?.recentReports || [];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            
            <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">

              <ArrowLeft className="w-5 h-5" />

            </button>
<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('parentDashboard.title')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('parentDashboard.subtitle')}
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/private-training">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Calendar className="w-4 h-4 mr-2" />
                {t('parentDashboard.bookSession')}
              </Button>
            </Link>
            <Link to="/report-history">
              <Button variant="outline">
                <FileText className="w-4 h-4 mr-2" />
                {t('parentDashboard.viewReports')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Children Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.filter((child): child is NonNullable<typeof child> => child != null).map((child) => (
            <Card key={child.playerId} className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => { setSelectedChild(child.playerId); setShowChildDetail(true); }}>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                  {child.playerPhoto ? (
                    <img src={child.playerPhoto} alt={child.playerName || ''} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    child.playerName?.charAt(0) || '?'
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {child.playerName}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {child.playerPosition} • {child.playerTeam}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('parentDashboard.age')}: {child.playerAge}
                  </p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {t('parentDashboard.overallRating')}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {(child as any).latestSkills?.overallRating || 0}
                  </p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {t('parentDashboard.activities30Days')}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {(child as any).recentActivities ?? 0}
                  </p>
                </div>
              </div>

              {/* Skills Breakdown */}
              {(child as any).latestSkills && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('skills.technical')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {(child as any).latestSkills.technicalAvg}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('skills.physical')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {(child as any).latestSkills.physicalAvg}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('skills.tactical')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {(child as any).latestSkills.tacticalAvg}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{t('skills.mental')}</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {(child as any).latestSkills.mentalAvg}
                    </span>
                  </div>
                </div>
              )}

              {/* Upcoming Bookings */}
              {(child as any).upcomingBookings > 0 && (
                <div className="mt-4 flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {(child as any).upcomingBookings} {t('parentDashboard.upcomingSessions')}
                  </span>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Child Detail Panel */}
        {showChildDetail && selectedChild && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setShowChildDetail(false)}>
                  <X className="w-5 h-5" />
                </Button>
                <div>
                  <h2 className="text-xl font-bold">
                    {children.find((c: any) => c?.playerId === selectedChild)?.playerName || 'Player'}
                  </h2>
                  <p className="text-sm text-muted-foreground">Training Schedule & Attendance</p>
                </div>
              </div>
            </div>
            {childDataLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : childData ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Training Sessions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Upcoming Training Sessions
                    </h3>
                    {(childData.upcomingSessions as any[])?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <a
                          href={(() => {
                            const sessions = (childData.upcomingSessions as any[]);
                            if (!sessions?.length) return '#';
                            // Build a multi-event Google Calendar URL for the first session
                            // (Google Calendar only supports one event per URL, so we open the first one
                            // and provide ICS for all)
                            const s = sessions[0];
                            return buildGoogleCalendarUrl(
                              `Training Schedule (${sessions.length} sessions)`,
                              s.sessionDate?.split('T')[0] || new Date().toISOString().split('T')[0],
                              s.startTime || '09:00',
                              s.location,
                              sessions.map((x: any) => `${x.title || 'Training'} - ${x.sessionDate?.split('T')[0] || ''} ${x.startTime || ''} @ ${x.location || ''}`).join('\n')
                            );
                          })()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors font-medium"
                        >
                          <CalendarPlus className="w-3 h-3" /> Add All to Google
                        </a>
                        <button
                          onClick={() => {
                            const sessions = (childData.upcomingSessions as any[]);
                            const events = sessions.map((s: any) => {
                              const dateStr = (s.sessionDate?.split('T')[0] || '').replace(/-/g, '');
                              const [h, m] = (s.startTime || '09:00').split(':');
                              const startDt = `${dateStr}T${h.padStart(2,'0')}${(m||'00').padStart(2,'0')}00`;
                              const endH = String(parseInt(h) + 1).padStart(2, '0');
                              const endDt = `${dateStr}T${endH}${(m||'00').padStart(2,'0')}00`;
                              return [
                                'BEGIN:VEVENT',
                                `DTSTART:${startDt}`,
                                `DTEND:${endDt}`,
                                `SUMMARY:${s.title || s.sessionType || 'Training'}`,
                                `LOCATION:${s.location || ''}`,
                                'END:VEVENT'
                              ].join('\n');
                            });
                            const icsContent = ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events, 'END:VCALENDAR'].join('\n');
                            const blob = new Blob([icsContent], { type: 'text/calendar' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'training-schedule.ics';
                            a.click();
                            URL.revokeObjectURL(url);
                          }}
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                        >
                          <CalendarPlus className="w-3 h-3" /> Apple / Outlook
                        </button>
                      </div>
                    )}
                  </div>
                  {(childData.upcomingSessions ?? []).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No upcoming sessions in the next 14 days</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(childData.upcomingSessions as any[]).map((s: any) => (
                        <div key={s.id} className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-800 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{s.title || s.sessionType || 'Training'}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{s.sessionDate ? format(new Date(s.sessionDate), 'EEE, MMM d') : ''}</span>
                              {s.startTime && <span>• {s.startTime}</span>}
                            </div>
                            {s.location && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span>{s.location}</span>
                              </div>
                            )}
                            {/* Calendar buttons */}
                            {s.sessionDate && (
                              <div className="flex items-center gap-1 mt-2">
                                <a
                                  href={buildGoogleCalendarUrl(s.title || s.sessionType || 'Training', s.sessionDate.split('T')[0], s.startTime || '09:00', s.location)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition-colors"
                                >
                                  <CalendarPlus className="w-3 h-3" /> Google
                                </a>
                                <a
                                  href={buildAppleCalendarUrl(s.title || s.sessionType || 'Training', s.sessionDate.split('T')[0], s.startTime || '09:00', s.location)}
                                  download={`training-${s.id}.ics`}
                                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                                >
                                  <CalendarPlus className="w-3 h-3" /> Apple
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Attendance History */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-base flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-600" />
                      Attendance History
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-black ${
                        (childData.attendance?.rate ?? 0) >= 80 ? 'text-green-600' :
                        (childData.attendance?.rate ?? 0) >= 60 ? 'text-amber-700 dark:text-amber-500' : 'text-red-500'
                      }`}>{childData.attendance?.rate ?? 0}%</span>
                      <span className="text-xs text-muted-foreground">attendance rate</span>
                    </div>
                  </div>
                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="text-xl font-bold text-green-600">{childData.attendance?.present ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Present</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                      <p className="text-xl font-bold text-amber-600">{childData.attendance?.late ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Late</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <p className="text-xl font-bold text-red-600">{childData.attendance?.absent ?? 0}</p>
                      <p className="text-xs text-muted-foreground">Absent</p>
                    </div>
                  </div>
                  {/* Recent records */}
                  <div className="space-y-2">
                    {((childData.attendance?.recent ?? []) as any[]).slice(0, 8).map((r: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div className="flex items-center gap-2">
                          {r.status === 'present' && <CheckCircle2 className="w-4 h-4 text-green-700 dark:text-green-500" />}
                          {r.status === 'absent' && <XCircle className="w-4 h-4 text-red-500" />}
                          {r.status === 'late' && <Clock className="w-4 h-4 text-amber-700 dark:text-amber-500" />}
                          {r.status === 'excused' && <AlertCircle className="w-4 h-4 text-blue-500" />}
                          <span className="text-sm">{r.sessionDate ? format(new Date(r.sessionDate), 'MMM d, yyyy') : ''}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground capitalize">{r.sessionType || 'Training'}</span>
                          <span className={`text-xs font-medium capitalize px-2 py-0.5 rounded-full ${
                            r.status === 'present' ? 'bg-green-100 text-green-700' :
                            r.status === 'absent' ? 'bg-red-100 text-red-700' :
                            r.status === 'late' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>{r.status}</span>
                        </div>
                      </div>
                    ))}
                    {((childData.attendance?.recent ?? []) as any[]).length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No attendance records yet</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No data available</p>
            )}
          </Card>
        )}

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upcoming Sessions & Reports */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming Sessions */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  {t('parentDashboard.upcomingSessions')}
                </h2>
                <Link to="/my-bookings">
                  <Button variant="ghost" size="sm">
                    {t('common.viewAll')}
                  </Button>
                </Link>
              </div>

              {upcomingSessions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t('parentDashboard.noUpcomingSessions')}</p>
                  <Link to="/private-training">
                    <Button className="mt-4" size="sm">
                      {t('parentDashboard.bookFirstSession')}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingSessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {session.sessionType}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {t('parentDashboard.with')} {session.coachName}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            session.status === 'confirmed' 
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {session.sessionDate ? format(new Date(session.sessionDate), 'MMM dd, yyyy') : ''} • {session.startTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {session.playerName}
                          </div>
                        </div>
                        {/* Add to Calendar buttons */}
                        {session.sessionDate && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Add to:</span>
                            <a
                              href={buildGoogleCalendarUrl(
                                session.sessionType,
                                new Date(session.sessionDate).toISOString().split('T')[0],
                                session.startTime || '09:00',
                                undefined,
                                `Training with ${session.coachName}`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 transition-colors"
                            >
                              <CalendarPlus className="w-3 h-3" /> Google Calendar
                            </a>
                            <a
                              href={buildAppleCalendarUrl(
                                session.sessionType,
                                new Date(session.sessionDate).toISOString().split('T')[0],
                                session.startTime || '09:00'
                              )}
                              download={`session-${session.id}.ics`}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 border border-gray-200 dark:border-gray-700 transition-colors"
                            >
                              <CalendarPlus className="w-3 h-3" /> Apple / Outlook
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Recent Reports */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  {t('parentDashboard.recentReports')}
                </h2>
                <Link to="/report-history">
                  <Button variant="ghost" size="sm">
                    {t('common.viewAll')}
                  </Button>
                </Link>
              </div>

              {recentReports.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t('parentDashboard.noReports')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentReports.map((report) => (
                    <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {report.reportType} - {report.playerName}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {report.reportDate ? format(new Date(report.reportDate), 'MMM dd, yyyy') : ''}
                          </p>
                        </div>
                      </div>
                      <a href={report.pdfUrl || '#'} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                          {t('common.download')}
                        </Button>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Notifications */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-600" />
                  {t('parentDashboard.notifications')}
                </h2>
                {recentNotifications.filter((n: any) => !n.isRead).length > 0 && (
                  <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5 font-bold">
                    {recentNotifications.filter((n: any) => !n.isRead).length} new
                  </span>
                )}
              </div>

              {recentNotifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground dark:text-gray-400">
                  <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t('parentDashboard.noNotifications')}</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {recentNotifications.map((notification: any) => {
                    // Detect training-related notifications for special styling
                    const isTrainingNew = notification.title?.includes('📅') || notification.title?.includes('New Training');
                    const isTrainingUpdate = notification.title?.includes('📝') || notification.title?.includes('Updated');
                    const isTrainingCancel = notification.title?.includes('❌') || notification.title?.includes('Cancelled');
                    const isTraining = isTrainingNew || isTrainingUpdate || isTrainingCancel;

                    let borderColor = notification.isRead
                      ? 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
                    if (!notification.isRead && isTrainingNew) borderColor = 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700';
                    if (!notification.isRead && isTrainingUpdate) borderColor = 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700';
                    if (!notification.isRead && isTrainingCancel) borderColor = 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';

                    const iconColor = notification.isRead ? 'text-muted-foreground'
                      : isTrainingNew ? 'text-green-600'
                      : isTrainingUpdate ? 'text-amber-600'
                      : isTrainingCancel ? 'text-red-600'
                      : 'text-blue-600';

                    return (
                      <div key={notification.id} className={`p-3 rounded-lg border ${borderColor}`}>
                        <div className="flex items-start gap-2">
                          <Bell className={`w-4 h-4 mt-1 flex-shrink-0 ${iconColor}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                {notification.title}
                              </h4>
                              {isTraining && !notification.isRead && (
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0 ${
                                  isTrainingNew ? 'bg-green-100 text-green-700'
                                  : isTrainingUpdate ? 'bg-amber-100 text-amber-700'
                                  : 'bg-red-100 text-red-700'
                                }`}>
                                  {isTrainingNew ? 'New Session' : isTrainingUpdate ? 'Updated' : 'Cancelled'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {notification.createdAt ? format(new Date(notification.createdAt), 'MMM dd, HH:mm') : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {t('parentDashboard.quickActions')}
              </h2>
              <div className="space-y-2">
                <Link to="/private-training">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-2" />
                    {t('parentDashboard.bookSession')}
                  </Button>
                </Link>
                <Link to="/report-history">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    {t('parentDashboard.viewReports')}
                  </Button>
                </Link>
                <Link to="/my-bookings">
                  <Button variant="outline" className="w-full justify-start">
                    <BookOpen className="w-4 h-4 mr-2" />
                    {t('parentDashboard.myBookings')}
                  </Button>
                </Link>
                <a href={`https://wa.me/201004186970`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="w-4 h-4 mr-2" />
                    {t('parentDashboard.contactCoach')}
                  </Button>
                </a>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
