import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Plus, Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight, ArrowLeft, List, CalendarDays, Info } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from "sonner";
import { useLocation, useSearch } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

const SESSION_TYPE_COLORS: Record<string, string> = {
  technical: 'bg-blue-500',
  tactical: 'bg-purple-500',
  physical: 'bg-orange-500',
  match: 'bg-red-500',
  recovery: 'bg-green-500',
  mixed: 'bg-slate-500',
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  technical: 'Technical',
  tactical: 'Tactical',
  physical: 'Physical',
  match: 'Match',
  recovery: 'Recovery',
  mixed: 'Mixed',
};

function QuickAddDialog({
  open,
  onClose,
  defaultDate,
  defaultTeamId,
}: {
  open: boolean;
  onClose: () => void;
  defaultDate: string;
  defaultTeamId?: string;
}) {
  const { t, language } = useLanguage();
  const [formData, setFormData] = useState({
    teamId: defaultTeamId || '',
    title: '',
    description: '',
    sessionDate: defaultDate,
    startTime: '09:00',
    endTime: '11:00',
    location: '',
    sessionType: 'mixed' as const,
    objectives: '',
  });

  const { data: teams } = trpc.teams.getAll.useQuery();
  const utils = trpc.useUtils();

  const createSession = trpc.training.create.useMutation({
    onSuccess: () => {
      toast.success('Training session created');
      onClose();
      utils.training.getUpcoming.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create session');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a session title');
      return;
    }
    createSession.mutate({
      ...formData,
      teamId: formData.teamId && formData.teamId !== 'none' ? parseInt(formData.teamId) : undefined,
    });
  };

  const displayDate = defaultDate
    ? new Date(defaultDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Training Session</DialogTitle>
          <DialogDescription>{displayDate}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Arabic description banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800" dir="rtl">
            <p className="font-semibold text-right">جلسة تدريبية جديدة</p>
            <p className="text-right text-xs mt-1">أدخل تفاصيل الجلسة التدريبية — اختر الفريق، نوع التدريب، الوقت، والأهداف</p>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">Team <span className="text-muted-foreground text-xs">(الفريق)</span></Label>
            <Select value={formData.teamId} onValueChange={(v) => setFormData(p => ({ ...p, teamId: v }))}>
              <SelectTrigger><SelectValue placeholder="Select team (optional)" /></SelectTrigger>
              <SelectContent className="z-[10001]">
                <SelectItem value="none">No specific team</SelectItem>
                {teams?.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name} ({t.ageGroup})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">Session Title * <span className="text-muted-foreground text-xs">(عنوان الجلسة)</span></Label>
            <Input
              placeholder="e.g. Passing & Movement Drill — مثال: تمرين التمرير والحركة"
              value={formData.title}
              onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">Date <span className="text-muted-foreground text-xs">(التاريخ)</span></Label>
              <Input type="date" value={formData.sessionDate} onChange={(e) => setFormData(p => ({ ...p, sessionDate: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">{t("training.sessionType")} <span className="text-muted-foreground text-xs">(نوع التدريب)</span>
                <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 text-blue-600 dark:text-blue-400 cursor-help" /></TooltipTrigger><TooltipContent className="max-w-xs text-right" dir="rtl"><p className="font-semibold">نوع الجلسة التدريبية</p><p className="text-xs mt-1">تقني = مهارات الكرة | تكتيكي = خطط اللعب | بدني = اللياقة | مباراة = تدريب تنافسي | تعافي = جلسة استشفاء</p></TooltipContent></Tooltip></TooltipProvider>
              </Label>
              <Select value={formData.sessionType} onValueChange={(v: any) => setFormData(p => ({ ...p, sessionType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="z-[10001]">
                  {Object.entries(SESSION_TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">Start Time <span className="text-muted-foreground text-xs">(البداية)</span></Label>
              <Input type="time" value={formData.startTime} onChange={(e) => setFormData(p => ({ ...p, startTime: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">End Time <span className="text-muted-foreground text-xs">(النهاية)</span></Label>
              <Input type="time" value={formData.endTime} onChange={(e) => setFormData(p => ({ ...p, endTime: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1">Location <span className="text-muted-foreground text-xs">(الملعب)</span></Label>
              <Input placeholder="Pitch A — الملعب أ" value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1">Objectives <span className="text-muted-foreground text-xs">(أهداف الجلسة)</span>
              <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 text-blue-600 dark:text-blue-400 cursor-help" /></TooltipTrigger><TooltipContent className="max-w-xs text-right" dir="rtl"><p className="text-xs">اكتب الأهداف التدريبية للجلسة — مثال: تحسين الضغط الدفاعي، تطوير اللعب من الخلف</p></TooltipContent></Tooltip></TooltipProvider>
            </Label>
            <Textarea placeholder="Session goals and focus areas... — أهداف وتركيز الجلسة" value={formData.objectives} onChange={(e) => setFormData(p => ({ ...p, objectives: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={createSession.isPending}>
              {createSession.isPending ? 'Creating...' : 'Create Session'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SessionBadge({ session }: { session: any }) {
  const color = SESSION_TYPE_COLORS[session.sessionType] || 'bg-slate-500';
  return (
    <div
      className={`${color} text-white text-xs px-1.5 py-0.5 rounded truncate`}
      title={`${session.title}${session.startTime ? ` (${session.startTime})` : ''}`}
    >
      {session.startTime ? `${session.startTime} ` : ''}{session.title}
    </div>
  );
}

export default function Training() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const teamType = params.get('team') as 'main' | 'academy' | null;
  const { t, language } = useLanguage();
  const [, navigate] = useLocation();
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddDate, setQuickAddDate] = useState('');

  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: upcomingSessions, isLoading: sessionsLoading } = trpc.training.getUpcoming.useQuery({
    teamId: selectedTeam && selectedTeam !== 'all' ? parseInt(selectedTeam) : undefined,
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const sessionsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    upcomingSessions?.forEach(s => {
      const d = new Date(s.sessionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(s);
    });
    return map;
  }, [upcomingSessions]);

  const groupedSessions = useMemo(() => {
    const acc: Record<string, any[]> = {};
    upcomingSessions?.forEach(s => {
      const date = new Date(s.sessionDate).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(s);
    });
    return acc;
  }, [upcomingSessions]);

  const calendarDays: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);
  while (calendarDays.length % 7 !== 0) calendarDays.push(null);

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setQuickAddDate(dateStr);
    setQuickAddOpen(true);
  };

  if (sessionsLoading) {
    return (
      <>
        <div className="space-y-6 p-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        </div>
      </>
    );
  }
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
              <BackButton />
            <h1 className="text-2xl font-bold tracking-tight">
              {teamType === 'main'
                ? (language === 'ar' ? 'الفريق الأول — جلسات التدريب' : 'Main Team — Training Sessions')
                : teamType === 'academy'
                ? (language === 'ar' ? 'فريق الأكاديمية — جلسات التدريب' : 'Academy Team — Training Sessions')
                : (language === 'ar' ? 'جلسات التدريب' : t('training.sessions'))}
            </h1>
            <p className="text-muted-foreground">
              {language === 'ar' ? 'جدول، أدر، وتتبع جلسات تدريب الفريق' : 'Schedule and manage team training sessions'}
            </p>
            {language === 'ar' && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-200 text-right">
                <span className="font-semibold">دليل الاستخدام: </span>
                اضغط "جدولة جلسة" لإضافة تدريب جديد. اختر الفريق لتصفية الجلسات. يمكنك التبديل بين عرض التقويم وعرض القائمة.
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}>
              {viewMode === 'calendar' ? <List className="h-4 w-4 mr-2" /> : <CalendarDays className="h-4 w-4 mr-2" />}
              {viewMode === 'calendar' ? 'List View' : 'Calendar View'}
            </Button>
            <Button onClick={() => { setQuickAddDate(new Date().toISOString().split('T')[0]); setQuickAddOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Session
            </Button>
          </div>
        </div>

        {/* Team Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap font-medium">Team:</Label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="All teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{teamType === 'main' ? (language === 'ar' ? 'كل فرق الفريق الأول' : 'All Main Teams') : teamType === 'academy' ? (language === 'ar' ? 'كل فرق الأكاديمية' : 'All Academy Teams') : (language === 'ar' ? 'كل الفرق' : 'All Teams')}</SelectItem>
                  {(teamType ? teams?.filter((t: any) => t.teamType === teamType) : teams)?.map((team: any) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name} ({team.ageGroup})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTeam && selectedTeam !== 'all' && (
                <Badge variant="secondary">
                  {teams?.find(t => t.id.toString() === selectedTeam)?.name}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        {viewMode === 'calendar' && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  {monthName}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Today</Button>
                  <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                ))}
              </div>
              {/* Calendar grid */}
              <div className="grid grid-cols-7 border-l border-t">
                {calendarDays.map((day, idx) => {
                  const dateKey = day
                    ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    : '';
                  const daySessions = day ? (sessionsByDate[dateKey] || []) : [];
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  const isPast = day
                    ? new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
                    : false;

                  return (
                    <div
                      key={idx}
                      className={`border-r border-b min-h-[90px] p-1 ${day ? 'cursor-pointer hover:bg-muted/50 transition-colors' : 'bg-muted/20'} ${isPast && day ? 'opacity-60' : ''}`}
                      onClick={() => day && handleDayClick(day)}
                    >
                      {day && (
                        <>
                          <div className={`text-xs font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                            {day}
                          </div>
                          <div className="space-y-0.5">
                            {daySessions.slice(0, 2).map((s: any) => (
                              <SessionBadge key={s.id} session={s} />
                            ))}
                            {daySessions.length > 2 && (
                              <div className="text-xs text-muted-foreground pl-1">+{daySessions.length - 2} more</div>
                            )}
                            {daySessions.length === 0 && !isPast && (
                              <div className="text-xs text-muted-foreground/30 pl-1 pt-1 select-none">+ Add</div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
                {Object.entries(SESSION_TYPE_COLORS).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <div className={`w-3 h-3 rounded-sm ${color}`} />
                    <span className="text-xs text-muted-foreground">{SESSION_TYPE_LABELS[type]}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <div className="space-y-6">
            {groupedSessions && Object.keys(groupedSessions).length > 0 ? (
              Object.entries(groupedSessions).map(([date, sessions]) => (
                <div key={date}>
                  <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {date}
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2">
                    {sessions.map((session: any) => (
                      <Card key={session.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-semibold">{session.title}</h3>
                              {session.teamName && <p className="text-xs text-muted-foreground">{session.teamName}</p>}
                            </div>
                            <Badge className={`${SESSION_TYPE_COLORS[session.sessionType]} text-white border-0`}>
                              {SESSION_TYPE_LABELS[session.sessionType]}
                            </Badge>
                          </div>
                          {session.description && <p className="text-sm text-muted-foreground mb-3">{session.description}</p>}
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            {session.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {session.startTime}{session.endTime ? ` - ${session.endTime}` : ''}
                              </span>
                            )}
                            {session.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {session.location}
                              </span>
                            )}
                            {session.attendanceCount != null && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {session.attendanceCount} attended
                              </span>
                            )}
                          </div>
                          {session.objectives && (
                            <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                              <strong>Objectives:</strong> {session.objectives}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No upcoming sessions</h3>
                  <p className="text-muted-foreground mb-4">Schedule your first training session</p>
                  <Button onClick={() => { setQuickAddDate(new Date().toISOString().split('T')[0]); setQuickAddOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Schedule Session
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Quick Add Dialog */}
        <QuickAddDialog
          open={quickAddOpen}
          onClose={() => setQuickAddOpen(false)}
          defaultDate={quickAddDate}
          defaultTeamId={selectedTeam !== 'all' ? selectedTeam : undefined}
        />
      </div>
    </>
  );
}
