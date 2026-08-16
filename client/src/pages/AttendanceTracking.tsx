import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useParentChild } from "@/contexts/ParentChildContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useOfflineAttendance } from "@/hooks/useOfflineAttendance";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft, Calendar, CheckCircle2, XCircle, Clock, AlertCircle,
  Users, TrendingUp, ClipboardList, Plus, Search, Filter, Download,
  Wifi, WifiOff, RefreshCw, FileSpreadsheet
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts";

type AttendanceStatus = "present" | "absent" | "late" | "excused";

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  present: { label: "Present", color: "text-green-600", bg: "bg-green-100", icon: <CheckCircle2 className="w-4 h-4 text-green-600" /> },
  absent: { label: "Absent", color: "text-red-600", bg: "bg-red-100", icon: <XCircle className="w-4 h-4 text-red-600" /> },
  late: { label: "Late", color: "text-amber-600", bg: "bg-amber-100", icon: <Clock className="w-4 h-4 text-amber-600" /> },
  excused: { label: "Excused", color: "text-blue-600", bg: "bg-blue-100", icon: <AlertCircle className="w-4 h-4 text-blue-600" /> },
};

function SendReportButton({ playerId }: { playerId: number }) {
  const sendReport = trpc.attendance.sendMonthlyReport.useMutation({
    onSuccess: (data: any) => {
      if (data.sent > 0) {
        toast.success(`Monthly report sent to ${data.sent} parent(s) via WhatsApp`);
      } else {
        toast.info('No parents with WhatsApp linked to this player.');
      }
    },
    onError: () => toast.error('Failed to send report'),
  });
  const month = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  return (
    <Button
      size="sm"
      variant="ghost"
      className="gap-1 text-xs text-green-700 hover:bg-green-50"
      disabled={sendReport.isPending}
      onClick={() => sendReport.mutate({ playerId, month })}
    >
      <Download className="w-3 h-3" />
      {sendReport.isPending ? '...' : 'Send'}
    </Button>
  );
}

export default function AttendanceTracking() {
  const { user } = useAuth();
  const { selectedChildId, linkedPlayers: parentLinkedPlayers } = useParentChild();
  const [, navigate] = useLocation();

  const isCoach = ["admin", "coach"].includes(user?.role ?? "");
  const isPlayer = user?.role === "player";
  const isParent = user?.role === "parent";

  const selectedChildPlayer = isParent && selectedChildId
    ? parentLinkedPlayers.find((p: any) => p.id.toString() === selectedChildId)
    : null;

  // Coach state
  const { t, language } = useLanguage();
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessionType, setSessionType] = useState<"training" | "match" | "trial" | "assessment">("training");
  const [sessionTitle, setSessionTitle] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<Record<number, { status: AttendanceStatus; notes: string }>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | AttendanceStatus>("all");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>();
  const [dateRange, setDateRange] = useState<"week" | "month" | "season" | "all">("month");
  // Player/parent target
  const targetPlayerId = isPlayer ? undefined : isParent && selectedChildPlayer ? selectedChildPlayer.id : undefined;

  // Queries
  const { data: allPlayers, isLoading: playersLoading } = trpc.players.getAll.useQuery(undefined, { enabled: isCoach });
  const { data: teams } = trpc.teams.getAll.useQuery(undefined, { enabled: isCoach });
  const { data: teamAttendance, refetch: refetchTeam } = trpc.attendance.getTeamAttendance.useQuery(
    { teamId: selectedTeamId },
    { enabled: isCoach }
  );
  const { data: playerAttendance } = trpc.attendance.getPlayerAttendance.useQuery(
    { playerId: targetPlayerId!, dateRange },
    { enabled: !!targetPlayerId }
  );

  // Mutations
  const bulkRecord = trpc.attendance.bulkRecord.useMutation({
    onSuccess: (data) => {
      toast.success(`Attendance recorded for ${data.recorded} players!`);
      if (data.bonusAwarded && data.bonusAwarded > 0) {
        setTimeout(() => {
          toast.success(`🏆 ${data.bonusAwarded} player(s) earned 100 bonus points for 90%+ attendance this month!`);
        }, 800);
      }
      setShowBulkDialog(false);
      setAttendanceMap({});
      refetchTeam();
    },
    onError: () => toast.error("Failed to record attendance"),
  });

  // Offline attendance sync
  const { isOnline, pendingCount, isSyncing, submitAttendance, syncNow } = useOfflineAttendance({
    bulkRecordFn: (data) => bulkRecord.mutateAsync(data),
    onSyncComplete: (synced) => {
      toast.success(`Synced ${synced} offline attendance record(s)!`);
      refetchTeam();
    },
    onSyncError: (failed) => toast.error(`${failed} record(s) failed to sync.`),
  });

  // Filter players
  const filteredPlayers = (allPlayers ?? []).filter((p: any) => {
    const matchesSearch = searchQuery === "" ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(p.jerseyNumber).includes(searchQuery);
    const matchesTeam = !selectedTeamId || p.teamId === selectedTeamId;
    return matchesSearch && matchesTeam;
  });

  const handleStatusChange = (playerId: number, status: AttendanceStatus) => {
    setAttendanceMap(prev => ({ ...prev, [playerId]: { ...prev[playerId], status, notes: prev[playerId]?.notes ?? "" } }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newMap: Record<number, { status: AttendanceStatus; notes: string }> = {};
    filteredPlayers.forEach((p: any) => {
      newMap[p.id] = { status, notes: "" };
    });
    setAttendanceMap(newMap);
  };

  const handleSubmitAttendance = async () => {
    const records = filteredPlayers.map((p: any) => ({
      playerId: p.id,
      status: attendanceMap[p.id]?.status ?? "absent",
      notes: attendanceMap[p.id]?.notes ?? "",
    }));
    try {
      const result = await submitAttendance({ sessionType, sessionDate, records });
      if (result === 'queued') {
        toast.warning("You are offline. Attendance saved locally and will sync when you reconnect.");
        setShowBulkDialog(false);
        setAttendanceMap({});
      }
    } catch (err) {
      toast.error("Failed to save attendance");
    }
  };

  const presentCount = Object.values(attendanceMap).filter(v => v.status === "present").length;
  const absentCount = Object.values(attendanceMap).filter(v => v.status === "absent").length;
  const lateCount = Object.values(attendanceMap).filter(v => v.status === "late").length;

  // Advanced date filter state for export
  const [exportDateFrom, setExportDateFrom] = useState('');
  const [exportDateTo, setExportDateTo] = useState('');
  const [showExportFilters, setShowExportFilters] = useState(false);

  // Filtered report query (for export with date range)
  const { data: reportData, isFetching: reportFetching } = trpc.attendance.getReportData.useQuery(
    { teamId: selectedTeamId, dateFrom: exportDateFrom || undefined, dateTo: exportDateTo || undefined },
    { enabled: isCoach, staleTime: 0 }
  );

  const [isExporting, setIsExporting] = useState(false);
  const handleExportExcel = async () => {
    const rows = (reportData ?? []) as any[];
    if (!rows.length) { toast.error('No attendance data to export'); return; }
    setIsExporting(true);
    try {
      const XLSX = await import('xlsx');
      // Sheet 1: Summary per player
      const summary = rows.map((r: any) => ({
        'Jersey #': r.jerseyNumber ?? '',
        'Player Name': r.playerName ?? '',
        'Position': r.position ?? '',
        'Age Group': r.ageGroup ?? '',
        'Total Sessions': r.totalSessions ?? 0,
        'Present': r.present ?? 0,
        'Absent': r.absent ?? 0,
        'Late': r.late ?? 0,
        'Excused': r.excused ?? 0,
        'Attendance Rate %': r.attendanceRate ?? 0,
      }));
      const ws1 = XLSX.utils.json_to_sheet(summary);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
      // Sheet 2: Per-session detail
      const detail: Record<string, any>[] = [];
      rows.forEach((r: any) => {
        (r.sessions ?? []).forEach((s: any) => {
          detail.push({
            'Player Name': r.playerName ?? '',
            'Date': s.date ?? '',
            'Session Type': s.type ?? '',
            'Status': s.status ?? '',
            'Notes': s.notes ?? '',
          });
        });
      });
      if (detail.length) {
        const ws2 = XLSX.utils.json_to_sheet(detail);
        XLSX.utils.book_append_sheet(wb, ws2, 'Session Detail');
      }
      const teamName = (teams as any[])?.find((t: any) => t.id === selectedTeamId)?.name ?? 'AllTeams';
      const suffix = exportDateFrom && exportDateTo
        ? `_${exportDateFrom}_to_${exportDateTo}`
        : `_${new Date().toISOString().split('T')[0]}`;
      XLSX.writeFile(wb, `${teamName}_Attendance${suffix}.xlsx`);
      toast.success('Attendance report exported!');
    } catch { toast.error('Export failed'); }
    finally { setIsExporting(false); }
  };

  // ==================== PLAYER / PARENT VIEW ====================
  if (isPlayer || isParent) {
    return (
      <>
        <div className="p-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/players")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t('attendance.myAttendance')}</h1>
              <p className="text-muted-foreground text-sm">{t('attendance.trackAttendance')}</p>
            </div>
          </div>

          {/* Date range selector */}
          <div className="flex gap-2 mb-6">
            {(["week", "month", "season", "all"] as const).map(r => (
              <Button
                key={r}
                size="sm"
                variant={dateRange === r ? "default" : "outline"}
                onClick={() => setDateRange(r)}
                className="capitalize"
              >
                {r === "season" ? "6 Months" : r.charAt(0).toUpperCase() + r.slice(1)}
              </Button>
            ))}
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-black text-green-700 dark:text-green-500">{playerAttendance?.attendanceRate ?? 0}%</div>
                <div className="text-xs text-muted-foreground mt-1">{t('attendance.overallRate')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-black text-blue-500">{playerAttendance?.totalSessions ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">{t('attendance.totalSessions')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-black text-green-600">{playerAttendance?.presentSessions ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">{t('attendance.attended')}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-black text-red-500">
                  {(playerAttendance?.totalSessions ?? 0) - (playerAttendance?.presentSessions ?? 0)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{t('attendance.missed')}</div>
              </CardContent>
            </Card>
          </div>

          {/* Attendance trend chart */}
          {playerAttendance?.attendanceHistory && playerAttendance.attendanceHistory.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="w-4 h-4" />
                  {language === 'ar' ? 'اتجاه الحضور' : 'Attendance Trend'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={playerAttendance.attendanceHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v) => [`${v}%`, "Attendance Rate"]} />
                    <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Calendar Heatmap */}
          {playerAttendance?.recentSessions && playerAttendance.recentSessions.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Attendance Calendar
                </CardTitle>
                <CardDescription>Color-coded by attendance status — last 3 months</CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Build a map of date → status from recentSessions
                  const sessionMap: Record<string, string> = {};
                  (playerAttendance.recentSessions ?? []).forEach((s: any) => {
                    if (s.date) sessionMap[s.date] = s.status;
                  });

                  // Generate last 3 months of days
                  const today = new Date();
                  const months: { year: number; month: number; label: string; days: { date: string; day: number; status: string | null; isCurrentMonth: boolean }[] }[] = [];
                  for (let m = 2; m >= 0; m--) {
                    const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
                    const year = d.getFullYear();
                    const month = d.getMonth();
                    const label = d.toLocaleString('default', { month: 'long', year: 'numeric' });
                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const days = [];
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      days.push({ date: dateStr, day, status: sessionMap[dateStr] ?? null, isCurrentMonth: month === today.getMonth() && year === today.getFullYear() });
                    }
                    months.push({ year, month, label, days });
                  }

                  const statusColor: Record<string, string> = {
                    present: 'bg-green-500',
                    late: 'bg-amber-400',
                    excused: 'bg-blue-400',
                    absent: 'bg-red-500',
                  };

                  return (
                    <div className="space-y-4">
                      {months.map(({ label, days, month, year }) => (
                        <div key={`${year}-${month}`}>
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</div>
                          <div className="flex flex-wrap gap-1">
                            {days.map(({ date, day, status }) => (
                              <div
                                key={date}
                                title={`${date}${status ? ` — ${status}` : ''}`}
                                className={`w-7 h-7 rounded flex items-center justify-center text-xs font-medium cursor-default transition-all ${
                                  status ? `${statusColor[status]} text-white` : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {day}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {/* Legend */}
                      <div className="flex flex-wrap gap-3 pt-2">
                        {Object.entries({ present: 'Present', late: 'Late', excused: 'Excused', absent: 'Absent' }).map(([k, v]) => (
                          <div key={k} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded ${statusColor[k]}`} />
                            <span className="text-xs text-muted-foreground">{v}</span>
                          </div>
                        ))}
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded bg-muted" />
                          <span className="text-xs text-muted-foreground">{t('attendance.noSession')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Recent sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="w-4 h-4" />
                Recent Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {playerAttendance?.recentSessions?.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No sessions recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {playerAttendance?.recentSessions?.map((session: any, i: number) => {
                    const cfg = STATUS_CONFIG[session.status as AttendanceStatus] ?? STATUS_CONFIG.absent;
                    return (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
                        <div className="flex items-center gap-3">
                          {cfg.icon}
                          <div>
                            <div className="text-sm font-medium">{session.date}</div>
                            <div className="text-xs text-muted-foreground capitalize">{session.status}</div>
                          </div>
                        </div>
                        <Badge className={`${cfg.bg} ${cfg.color} border-0`}>{cfg.label}</Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // ==================== COACH VIEW ====================
  return (
    <>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Offline status banner */}
        {!isOnline && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-amber-800 text-sm">
            <WifiOff className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium">You are offline.</span>
            <span className="ml-1">Attendance will be saved locally and synced when you reconnect.</span>
          </div>
        )}
        {isOnline && pendingCount > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-200 px-4 py-2 text-blue-800 text-sm">
            <Wifi className="h-4 w-4 flex-shrink-0" />
            <span>{pendingCount} offline attendance record(s) pending sync.</span>
            <Button size="sm" variant="outline" className="ml-auto h-7 text-xs" onClick={syncNow} disabled={isSyncing}>
              <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? "animate-spin" : ""}`} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/players")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t("attendance.tracking")}</h1>
              <p className="text-muted-foreground text-sm">Record and monitor player attendance</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowExportFilters(v => !v)}>
              <Filter className="w-4 h-4" />
              {showExportFilters ? 'Hide Filters' : 'Filter Export'}
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExportExcel} disabled={isExporting || reportFetching}>
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : reportFetching ? 'Loading...' : 'Export Excel'}
            </Button>
          <Dialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Take Attendance
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Record Session Attendance</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Session details */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Session Date</Label>
                    <Input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Session Type</Label>
                    <Select value={sessionType} onValueChange={(v: any) => setSessionType(v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="match">Match</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="assessment">Assessment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Quick actions */}
                <div className="flex gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground self-center">Mark all:</span>
                  {(["present", "absent", "late", "excused"] as AttendanceStatus[]).map(s => (
                    <Button key={s} size="sm" variant="outline" onClick={() => handleMarkAll(s)}
                      className={`gap-1 ${STATUS_CONFIG[s].color}`}>
                      {STATUS_CONFIG[s].icon}
                      {STATUS_CONFIG[s].label}
                    </Button>
                  ))}
                </div>

                {/* Summary bar */}
                <div className="flex gap-4 p-3 rounded-lg bg-muted/50 text-sm">
                  <span className="text-green-600 font-medium">✓ {presentCount} present</span>
                  <span className="text-red-600 font-medium">✗ {absentCount} absent</span>
                  <span className="text-amber-600 font-medium">⏱ {lateCount} late</span>
                  <span className="text-muted-foreground ml-auto">{filteredPlayers.length} total</span>
                </div>

                {/* Player list */}
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {filteredPlayers.map((player: any) => {
                    const current = attendanceMap[player.id];
                    return (
                      <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                          {player.jerseyNumber ?? "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{player.firstName} {player.lastName}</div>
                          <div className="text-xs text-muted-foreground capitalize">{player.position} · {player.ageGroup}</div>
                        </div>
                        <div className="flex gap-1">
                          {(["present", "late", "excused", "absent"] as AttendanceStatus[]).map(s => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(player.id, s)}
                              className={`p-1.5 rounded-md transition-all ${current?.status === s
                                ? `${STATUS_CONFIG[s].bg} ring-2 ring-offset-1 ring-current`
                                : "hover:bg-muted"}`}
                              title={STATUS_CONFIG[s].label}
                            >
                              {STATUS_CONFIG[s].icon}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  className="w-full"
                  onClick={handleSubmitAttendance}
                  disabled={bulkRecord.isPending || Object.keys(attendanceMap).length === 0}
                >
                  {bulkRecord.isPending ? "Saving..." : !isOnline ? `Save Offline (${Object.keys(attendanceMap).length} players)` : `Save Attendance (${Object.keys(attendanceMap).length} players)`}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
        {/* Export date range filter panel */}
        {showExportFilters && (
          <div className="mb-4 p-4 rounded-lg border bg-muted/30 flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Date From</label>
              <Input type="date" value={exportDateFrom} onChange={e => setExportDateFrom(e.target.value)} className="w-40 h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Date To</label>
              <Input type="date" value={exportDateTo} onChange={e => setExportDateTo(e.target.value)} className="w-40 h-8 text-sm" />
            </div>
            <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setExportDateFrom(''); setExportDateTo(''); }}>
              Clear
            </Button>
            <p className="text-xs text-muted-foreground self-center">
              {exportDateFrom || exportDateTo
                ? `Filtering: ${exportDateFrom || 'start'} → ${exportDateTo || 'today'}`
                : 'No date filter — exporting all records'}
            </p>
          </div>
        )}
        {/* Filters */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 w-56"
            />
          </div>
          <Select value={selectedTeamId !== undefined ? String(selectedTeamId) : "all"} onValueChange={(v) => setSelectedTeamId(v === "all" ? undefined : Number(v))}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams?.map((t: any) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Team attendance overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Stats summary */}
          <div className="grid grid-cols-2 gap-3 lg:col-span-1">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-black text-blue-500">{teamAttendance?.length ?? 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Players</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-black text-green-700 dark:text-green-500">
                  {teamAttendance?.length
                    ? Math.round(teamAttendance.reduce((s: number, p: any) => s + p.attendanceRate, 0) / teamAttendance.length)
                    : 0}%
                </div>
                <div className="text-xs text-muted-foreground mt-1">Avg Rate</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-black text-amber-700 dark:text-amber-500">
                  {teamAttendance?.filter((p: any) => p.attendanceRate < 70).length ?? 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">At Risk</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-500">
                  {teamAttendance?.filter((p: any) => p.attendanceRate >= 90).length ?? 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Excellent</div>
              </CardContent>
            </Card>
          </div>

          {/* Bar chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Attendance Rate by Player</CardTitle>
              <CardDescription>Top 10 players by attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={(teamAttendance ?? []).slice(0, 10).map((p: any) => ({
                  name: p.playerName.split(" ")[1] ?? p.playerName.split(" ")[0],
                  rate: p.attendanceRate,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                  <Tooltip formatter={(v) => [`${v}%`, "Rate"]} />
                  <Bar dataKey="rate" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Summary Stats Bar */}
        {(teamAttendance ?? []).length > 0 && (() => {
          const filtered = (teamAttendance ?? []).filter((p: any) => {
            const name = p.playerName.toLowerCase();
            return searchQuery === "" || name.includes(searchQuery.toLowerCase());
          });
          const totalSessions = filtered.reduce((s: number, p: any) => s + (p.totalSessions || 0), 0);
          const totalPresent = filtered.reduce((s: number, p: any) => s + (p.presentSessions || 0), 0);
          const totalAbsent = totalSessions - totalPresent;
          const overallRate = totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;
          const rateColor = overallRate >= 90 ? 'text-green-600' : overallRate >= 70 ? 'text-amber-600' : 'text-red-600';
          const rateBarColor = overallRate >= 90 ? 'bg-green-500' : overallRate >= 70 ? 'bg-amber-500' : 'bg-red-500';
          return (
            <div className="mb-4 p-4 rounded-xl border bg-muted/20 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-green-600">{totalPresent}</div>
                  <div className="text-xs text-muted-foreground">Total Present</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <XCircle className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">{totalAbsent}</div>
                  <div className="text-xs text-muted-foreground">Total Absent</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-lg font-bold">{filtered.length}</div>
                  <div className="text-xs text-muted-foreground">Players Shown</div>
                </div>
              </div>
              <div className="flex-1 min-w-[160px]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">Overall Attendance Rate</span>
                  <span className={`text-sm font-bold ${rateColor}`}>{overallRate}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                  <div className={`h-full rounded-full ${rateBarColor} transition-all`} style={{ width: `${overallRate}%` }} />
                </div>
                {(exportDateFrom || exportDateTo) && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Period: {exportDateFrom || 'start'} → {exportDateTo || 'today'}
                  </p>
                )}
              </div>
              {/* Quick Export Button */}
              <button
                onClick={handleExportExcel}
                disabled={isExporting || reportFetching}
                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium flex-shrink-0"
                title="Export attendance data as Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                {isExporting ? 'Exporting...' : reportFetching ? 'Loading...' : 'Export Excel'}
              </button>
            </div>
          );
        })()}

        {/* Player attendance table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Player Attendance Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">#</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">{t("common.player")}</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Position</th>
                    <th className="text-left py-2 px-3 font-medium text-muted-foreground">Group</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Sessions</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Attended</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Rate</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">{t("common.status")}</th>
                    <th className="text-center py-2 px-3 font-medium text-muted-foreground">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {(teamAttendance ?? [])
                    .filter((p: any) => {
                      const name = p.playerName.toLowerCase();
                      return searchQuery === "" || name.includes(searchQuery.toLowerCase());
                    })
                    .map((p: any) => {
                      const rate = p.attendanceRate;
                      const rateColor = rate >= 90 ? "text-green-600" : rate >= 70 ? "text-amber-600" : "text-red-600";
                      const statusLabel = rate >= 90 ? "Excellent" : rate >= 70 ? "Good" : "At Risk";
                      const statusBg = rate >= 90 ? "bg-green-100 text-green-700" : rate >= 70 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
                      return (
                        <tr key={p.playerId} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="py-2 px-3 text-muted-foreground">{p.jerseyNumber ?? "-"}</td>
                          <td className="py-2 px-3 font-medium">{p.playerName}</td>
                          <td className="py-2 px-3 capitalize text-muted-foreground">{p.position}</td>
                          <td className="py-2 px-3 text-muted-foreground">{p.ageGroup ?? "-"}</td>
                          <td className="py-2 px-3 text-center">{p.totalSessions}</td>
                          <td className="py-2 px-3 text-center text-green-600 font-medium">{p.presentSessions}</td>
                          <td className={`py-2 px-3 text-center font-bold ${rateColor}`}>{rate}%</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBg}`}>{statusLabel}</span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <SendReportButton playerId={p.playerId} />
                          </td>
                        </tr>
                      );
                    })}
                  {(teamAttendance ?? []).length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-muted-foreground">
                        No attendance data yet. Click "Take Attendance" to record your first session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
