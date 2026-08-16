import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Play, CheckCircle2, ClipboardList, Users, Star, Activity,
  Calendar, Clock, CloudSun, Target, ChevronRight, BarChart3,
  Plus, ArrowLeft, Zap, TrendingUp, AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";

type AttendanceStatus = "present" | "absent" | "late" | "injured" | "excused";

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  in_progress: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};

const ATTENDANCE_COLORS: Record<AttendanceStatus, string> = {
  present: "bg-green-500 text-white",
  absent: "bg-red-500 text-white",
  late: "bg-yellow-500 text-black",
  injured: "bg-orange-500 text-white",
  excused: "bg-blue-500 text-white",
};

export default function SessionExecution() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // State
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);
  const [activeExecutionId, setActiveExecutionId] = useState<number | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  const [tab, setTab] = useState("sessions");

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    actualDuration: 90,
    coachNotes: "",
    overallRating: 7,
    energyLevel: 7,
    focusLevel: 7,
    pitchCondition: "good" as "excellent" | "good" | "fair" | "poor",
    weatherConditions: "",
  });

  // Attendance state: playerId → status
  const [attendanceMap, setAttendanceMap] = useState<Record<number, { status: AttendanceStatus; rating: number; notes: string }>>({});

  // Queries
  // react-query v5 dropped per-query onError callbacks.
  const { data: sessions = [], isLoading: sessionsLoading } = trpc.training.getAll.useQuery({ limit: 50 });

  const { data: executions = [], refetch: refetchExecutions } = trpc.sessionExecution.getBySession.useQuery(
    { trainingSessionId: selectedSessionId! },
    { enabled: !!selectedSessionId }
  );

  const { data: attendanceData = [], refetch: refetchAttendance } = trpc.sessionExecution.getAttendance.useQuery(
    { sessionExecutionId: activeExecutionId! },
    { enabled: !!activeExecutionId }
  );

  const { data: players = [] } = trpc.players.getAll.useQuery({} as any);

  // Mutations
  const createExecution = trpc.sessionExecution.create.useMutation({
    onSuccess: (data) => {
      setActiveExecutionId(data.id);
      setShowStartDialog(false);
      setTab("attendance");
      refetchExecutions();
      toast({ title: isRTL ? "تم بدء الجلسة ✓" : "Session started ✓", description: isRTL ? "سجّل الحضور الآن" : "Record attendance now" });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const completeExecution = trpc.sessionExecution.complete.useMutation({
    onSuccess: () => {
      setShowReviewDialog(false);
      refetchExecutions();
      toast({ title: isRTL ? "تم إكمال الجلسة ✓" : "Session completed ✓", description: isRTL ? "تم حفظ التقييم" : "Review saved successfully" });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const recordAttendance = trpc.sessionExecution.recordAttendance.useMutation({
    onSuccess: (data) => {
      refetchAttendance();
      toast({ title: isRTL ? `تم تسجيل الحضور (${data.count} لاعب)` : `Attendance recorded (${data.count} players)` });
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleStartSession = () => {
    if (!selectedSessionId) return;
    createExecution.mutate({
      trainingSessionId: selectedSessionId,
      executionDate: new Date().toISOString().split("T")[0],
      status: "in_progress",
    });
  };

  const handleSaveAttendance = () => {
    if (!activeExecutionId) return;
    const attendance = Object.entries(attendanceMap).map(([playerId, data]) => ({
      playerId: Number(playerId),
      status: data.status,
      performanceRating: data.rating || undefined,
      notes: data.notes || undefined,
    }));
    recordAttendance.mutate({ sessionExecutionId: activeExecutionId, attendance });
  };

  const handleCompleteSession = () => {
    if (!activeExecutionId) return;
    completeExecution.mutate({ id: activeExecutionId, ...reviewForm });
  };

  const selectedSession = useMemo(() => (sessions as any[]).find((s: any) => s.id === selectedSessionId), [sessions, selectedSessionId]);
  const activeExecution = useMemo(() => (executions as any[]).find((e: any) => e.id === activeExecutionId), [executions, activeExecutionId]);

  // Sort sessions: today first, then upcoming, then past
  const today = new Date().toISOString().split('T')[0];
  const sortedSessions = useMemo(() => {
    const arr = [...(sessions as any[])];
    return arr.sort((a, b) => {
      const aDate = String(a.sessionDate || '');
      const bDate = String(b.sessionDate || '');
      // Today's sessions first
      const aIsToday = aDate === today;
      const bIsToday = bDate === today;
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      // Then upcoming (future) before past
      const aIsFuture = aDate >= today;
      const bIsFuture = bDate >= today;
      if (aIsFuture && !bIsFuture) return -1;
      if (!aIsFuture && bIsFuture) return 1;
      // Within same category, sort by date ascending
      return aDate.localeCompare(bDate);
    });
  }, [sessions, today]);

  const presentCount = Object.values(attendanceMap).filter(a => a.status === "present" || a.status === "late").length;
  const totalPlayers = Object.keys(attendanceMap).length;

  // Today's and upcoming sessions for the summary banner
  const todaySessions = sortedSessions.filter((s: any) => s.sessionDate === today);
  const upcomingSessions = sortedSessions.filter((s: any) => s.sessionDate > today).slice(0, 3);

  return (
    <>
      <div className="p-4 md:p-6 max-w-6xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/training")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Play className="w-6 h-6 text-primary" />
              {isRTL ? "تنفيذ الجلسات التدريبية" : "Session Execution"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isRTL ? "خطط → نفّذ → راجع — دورة كاملة لكل جلسة تدريبية" : "Plan → Execute → Review — complete loop for every training session"}
            </p>
          </div>
        </div>

        {/* Today's Sessions Banner */}
        {(todaySessions.length > 0 || upcomingSessions.length > 0) && (
          <div className="mb-5 space-y-2">
            {todaySessions.length > 0 && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    {isRTL ? `${todaySessions.length} جلسة اليوم` : `${todaySessions.length} session${todaySessions.length > 1 ? 's' : ''} today`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {todaySessions.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSessionId(s.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selectedSessionId === s.id
                          ? 'bg-green-500 text-white border-green-500'
                          : 'border-green-500/40 text-green-700 dark:text-green-400 hover:bg-green-500/10'
                      }`}
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {upcomingSessions.length > 0 && (
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    {isRTL ? 'الجلسات القادمة' : 'Upcoming Sessions'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {upcomingSessions.map((s: any) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSessionId(s.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                        selectedSessionId === s.id
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-blue-500/30 text-blue-700 dark:text-blue-400 hover:bg-blue-500/10'
                      }`}
                    >
                      {s.title} <span className="opacity-60 ml-1">{s.sessionDate}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Session Selector */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  {isRTL ? "اختر جلسة تدريبية" : "Select Training Session"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-96 overflow-y-auto">
                {sessionsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
                  </div>
                ) : (sessions as any[]).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    {isRTL ? "لا توجد جلسات مجدولة" : "No sessions scheduled"}
                  </div>
                ) : (
                  sortedSessions.slice(0, 25).map((session: any) => {
                    const isToday = session.sessionDate === today;
                    const isUpcoming = session.sessionDate > today;
                    return (
                      <button
                        key={session.id}
                        onClick={() => setSelectedSessionId(session.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedSessionId === session.id
                            ? "border-primary bg-primary/5"
                            : isToday
                            ? "border-green-500/50 bg-green-500/5 hover:bg-green-500/10"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-sm truncate flex-1">{session.title}</div>
                          {isToday && (
                            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-green-500 text-white font-semibold flex-shrink-0">
                              {isRTL ? 'اليوم' : 'Today'}
                            </span>
                          )}
                          {isUpcoming && !isToday && (
                            <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-600 font-medium flex-shrink-0">
                              {isRTL ? 'قادم' : 'Soon'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <Calendar className="w-3 h-3" />
                          {session.sessionDate}
                          <Badge variant="outline" className="text-xs py-0 px-1">{session.sessionType}</Badge>
                        </div>
                      </button>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {selectedSessionId && (
              <Card className="mt-4">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{isRTL ? "عدد التنفيذات" : "Executions"}</span>
                    <Badge variant="secondary">{(executions as any[]).length}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{isRTL ? "مكتملة" : "Completed"}</span>
                    <Badge className="bg-green-500/10 text-green-600">{(executions as any[]).filter((e: any) => e.status_se === "completed").length}</Badge>
                  </div>
                  <Button
                    className="w-full gap-2"
                    onClick={() => setShowStartDialog(true)}
                    disabled={!selectedSessionId}
                  >
                    <Play className="w-4 h-4" />
                    {isRTL ? "ابدأ تنفيذ الجلسة" : "Start Session Execution"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Main Content */}
          <div className="lg:col-span-2">
            {!selectedSessionId ? (
              <Card className="h-full flex items-center justify-center min-h-64">
                <div className="text-center text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{isRTL ? "اختر جلسة تدريبية للبدء" : "Select a training session to begin"}</p>
                  <p className="text-sm mt-1">{isRTL ? "اختر من القائمة على اليسار" : "Choose from the list on the left"}</p>
                </div>
              </Card>
            ) : (
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="sessions" className="gap-2">
                    <ClipboardList className="w-4 h-4" />
                    {isRTL ? "التنفيذات" : "Executions"}
                  </TabsTrigger>
                  <TabsTrigger value="attendance" className="gap-2" disabled={!activeExecutionId}>
                    <Users className="w-4 h-4" />
                    {isRTL ? "الحضور" : "Attendance"}
                    {totalPlayers > 0 && (
                      <Badge className="ml-1 bg-primary/10 text-primary text-xs py-0">{presentCount}/{totalPlayers}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="review" className="gap-2" disabled={!activeExecutionId}>
                    <Star className="w-4 h-4" />
                    {isRTL ? "التقييم" : "Review"}
                  </TabsTrigger>
                </TabsList>

                {/* Executions Tab */}
                <TabsContent value="sessions">
                  <div className="space-y-3">
                    {selectedSession && (
                      <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{selectedSession.title}</h3>
                              <p className="text-sm text-muted-foreground mt-1">{selectedSession.description || (isRTL ? "لا يوجد وصف" : "No description")}</p>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                <Badge variant="outline">{selectedSession.sessionType}</Badge>
                                <Badge variant="outline" className="gap-1">
                                  <Clock className="w-3 h-3" />
                                  {selectedSession.startTime || "—"}
                                </Badge>
                                {selectedSession.location && (
                                  <Badge variant="outline">{selectedSession.location}</Badge>
                                )}
                              </div>
                            </div>
                            <Button size="sm" className="gap-1" onClick={() => setShowStartDialog(true)}>
                              <Play className="w-3 h-3" />
                              {isRTL ? "نفّذ" : "Execute"}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {(executions as any[]).length === 0 ? (
                      <Card>
                        <CardContent className="py-10 text-center text-muted-foreground">
                          <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p>{isRTL ? "لا توجد تنفيذات بعد لهذه الجلسة" : "No executions yet for this session"}</p>
                          <Button className="mt-4 gap-2" onClick={() => setShowStartDialog(true)}>
                            <Plus className="w-4 h-4" />
                            {isRTL ? "ابدأ أول تنفيذ" : "Start First Execution"}
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      (executions as any[]).map((exec: any) => (
                        <Card key={exec.id} className={exec.id === activeExecutionId ? "ring-2 ring-primary" : ""}>
                          <CardContent className="pt-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${exec.status_se === "completed" ? "bg-green-500" : exec.status_se === "in_progress" ? "bg-yellow-500 animate-pulse" : "bg-blue-500"}`} />
                                <div>
                                  <div className="font-medium text-sm">
                                    {isRTL ? "تنفيذ" : "Execution"} #{exec.id}
                                    <span className="text-muted-foreground ml-2">{exec.executionDate_se}</span>
                                  </div>
                                  <div className="flex gap-2 mt-1">
                                    <Badge className={`text-xs ${STATUS_COLORS[exec.status_se] || ""}`}>
                                      {exec.status_se}
                                    </Badge>
                                    {exec.overallRating_se && (
                                      <Badge variant="outline" className="text-xs gap-1">
                                        <Star className="w-3 h-3 text-yellow-700 dark:text-yellow-500" />
                                        {exec.overallRating_se}/10
                                      </Badge>
                                    )}
                                    {exec.actualDuration_se && (
                                      <Badge variant="outline" className="text-xs gap-1">
                                        <Clock className="w-3 h-3" />
                                        {exec.actualDuration_se} min
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                {exec.status_se !== "completed" && (
                                  <Button size="sm" variant="outline" onClick={() => {
                                    setActiveExecutionId(exec.id);
                                    setTab("attendance");
                                  }}>
                                    <Users className="w-3 h-3 mr-1" />
                                    {isRTL ? "حضور" : "Attendance"}
                                  </Button>
                                )}
                                {exec.status_se === "in_progress" && (
                                  <Button size="sm" onClick={() => {
                                    setActiveExecutionId(exec.id);
                                    setShowReviewDialog(true);
                                  }}>
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {isRTL ? "أكمل" : "Complete"}
                                  </Button>
                                )}
                              </div>
                            </div>
                            {exec.coachNotes_se && (
                              <p className="text-sm text-muted-foreground mt-2 border-t pt-2">{exec.coachNotes_se}</p>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* Attendance Tab */}
                <TabsContent value="attendance">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" />
                          {isRTL ? "تسجيل الحضور" : "Record Attendance"}
                        </CardTitle>
                        <div className="flex gap-2 items-center">
                          <span className="text-sm text-muted-foreground">
                            {presentCount}/{totalPlayers} {isRTL ? "حاضر" : "present"}
                          </span>
                          <Button size="sm" onClick={handleSaveAttendance} disabled={recordAttendance.isPending}>
                            {isRTL ? "حفظ" : "Save"}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Quick select all */}
                      <div className="flex gap-2 mb-4 flex-wrap">
                        <Button size="sm" variant="outline" className="gap-1 text-green-600" onClick={() => {
                          const newMap: typeof attendanceMap = {};
                          (players as any[]).forEach((p: any) => {
                            newMap[p.id] = { status: "present", rating: attendanceMap[p.id]?.rating || 7, notes: attendanceMap[p.id]?.notes || "" };
                          });
                          setAttendanceMap(newMap);
                        }}>
                          <CheckCircle2 className="w-3 h-3" />
                          {isRTL ? "الكل حاضر" : "All Present"}
                        </Button>
                        <Button size="sm" variant="outline" className="gap-1 text-red-600" onClick={() => {
                          const newMap: typeof attendanceMap = {};
                          (players as any[]).forEach((p: any) => {
                            newMap[p.id] = { status: "absent", rating: 0, notes: "" };
                          });
                          setAttendanceMap(newMap);
                        }}>
                          <AlertCircle className="w-3 h-3" />
                          {isRTL ? "الكل غائب" : "All Absent"}
                        </Button>
                      </div>

                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {(players as any[]).slice(0, 30).map((player: any) => {
                          const att = attendanceMap[player.id] || { status: "present" as AttendanceStatus, rating: 7, notes: "" };
                          return (
                            <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                {player.firstName?.[0]}{player.lastName?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{player.firstName} {player.lastName}</div>
                                <div className="text-xs text-muted-foreground">{player.ageGroup} · {player.position}</div>
                              </div>
                              <div className="flex gap-1">
                                {(["present", "absent", "late", "injured", "excused"] as AttendanceStatus[]).map(s => (
                                  <button
                                    key={s}
                                    onClick={() => setAttendanceMap(prev => ({ ...prev, [player.id]: { ...att, status: s } }))}
                                    className={`text-xs px-2 py-1 rounded-md border transition-all ${att.status === s ? ATTENDANCE_COLORS[s] : "border-border text-muted-foreground hover:border-primary/50"}`}
                                    title={s}
                                  >
                                    {s === "present" ? "✓" : s === "absent" ? "✗" : s === "late" ? "⏰" : s === "injured" ? "🩹" : "📋"}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-700 dark:text-yellow-500" />
                                <Input
                                  type="number"
                                  min={1} max={10}
                                  value={att.rating || ""}
                                  onChange={e => setAttendanceMap(prev => ({ ...prev, [player.id]: { ...att, rating: Number(e.target.value) } }))}
                                  className="w-12 h-7 text-xs text-center p-1"
                                  placeholder="—"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Review Tab */}
                <TabsContent value="review">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-primary" />
                        {isRTL ? "تقييم الجلسة" : "Session Review"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">{isRTL ? "المدة الفعلية (دقيقة)" : "Actual Duration (min)"}</Label>
                          <Input
                            type="number"
                            value={reviewForm.actualDuration}
                            onChange={e => setReviewForm(p => ({ ...p, actualDuration: Number(e.target.value) }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label className="text-sm">{isRTL ? "حالة الملعب" : "Pitch Condition"}</Label>
                          <Select value={reviewForm.pitchCondition} onValueChange={(v: any) => setReviewForm(p => ({ ...p, pitchCondition: v }))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="excellent">{isRTL ? "ممتاز" : "Excellent"}</SelectItem>
                              <SelectItem value="good">{isRTL ? "جيد" : "Good"}</SelectItem>
                              <SelectItem value="fair">{isRTL ? "مقبول" : "Fair"}</SelectItem>
                              <SelectItem value="poor">{isRTL ? "سيء" : "Poor"}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm">{isRTL ? "أحوال الطقس" : "Weather Conditions"}</Label>
                        <Input
                          value={reviewForm.weatherConditions}
                          onChange={e => setReviewForm(p => ({ ...p, weatherConditions: e.target.value }))}
                          placeholder={isRTL ? "مثال: مشمس، 28 درجة" : "e.g., Sunny, 28°C"}
                          className="mt-1"
                        />
                      </div>

                      {/* Rating sliders */}
                      {[
                        { key: "overallRating", labelEn: "Overall Session Rating", labelAr: "تقييم الجلسة الإجمالي", icon: Star },
                        { key: "energyLevel", labelEn: "Team Energy Level", labelAr: "مستوى طاقة الفريق", icon: Zap },
                        { key: "focusLevel", labelEn: "Team Focus Level", labelAr: "مستوى تركيز الفريق", icon: Target },
                      ].map(({ key, labelEn, labelAr, icon: Icon }) => (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <Label className="text-sm flex items-center gap-1">
                              <Icon className="w-3 h-3" />
                              {isRTL ? labelAr : labelEn}
                            </Label>
                            <span className="text-sm font-bold text-primary">{(reviewForm as any)[key]}/10</span>
                          </div>
                          <input
                            type="range"
                            min={1} max={10}
                            value={(reviewForm as any)[key]}
                            onChange={e => setReviewForm(p => ({ ...p, [key]: Number(e.target.value) }))}
                            className="w-full accent-primary"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                            <span>{isRTL ? "منخفض" : "Low"}</span>
                            <span>{isRTL ? "عالي" : "High"}</span>
                          </div>
                        </div>
                      ))}

                      <div>
                        <Label className="text-sm">{isRTL ? "ملاحظات المدرب" : "Coach Notes"}</Label>
                        <Textarea
                          value={reviewForm.coachNotes}
                          onChange={e => setReviewForm(p => ({ ...p, coachNotes: e.target.value }))}
                          placeholder={isRTL ? "ملاحظات وتوصيات للجلسة القادمة..." : "Notes and recommendations for next session..."}
                          className="mt-1"
                          rows={4}
                        />
                      </div>

                      <Button
                        className="w-full gap-2"
                        onClick={handleCompleteSession}
                        disabled={completeExecution.isPending}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {isRTL ? "إكمال وحفظ التقييم" : "Complete & Save Review"}
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>

        {/* Start Session Dialog */}
        <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                {isRTL ? "بدء تنفيذ الجلسة" : "Start Session Execution"}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground text-sm">
                {isRTL
                  ? `هل تريد بدء تنفيذ جلسة "${selectedSession?.title}"؟ سيتم تسجيل الوقت والحضور.`
                  : `Start executing session "${selectedSession?.title}"? Attendance and time will be recorded.`}
              </p>
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
                <div className="flex items-center gap-2 text-primary font-medium mb-2">
                  <Activity className="w-4 h-4" />
                  {isRTL ? "ما سيحدث:" : "What happens next:"}
                </div>
                <ol className="space-y-1 text-muted-foreground list-decimal list-inside">
                  <li>{isRTL ? "تسجيل حضور اللاعبين" : "Record player attendance"}</li>
                  <li>{isRTL ? "تتبع التمارين المنجزة" : "Track completed drills"}</li>
                  <li>{isRTL ? "تقييم الجلسة بعد الانتهاء" : "Review session after completion"}</li>
                </ol>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowStartDialog(false)}>{isRTL ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleStartSession} disabled={createExecution.isPending} className="gap-2">
                <Play className="w-4 h-4" />
                {isRTL ? "ابدأ الآن" : "Start Now"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
