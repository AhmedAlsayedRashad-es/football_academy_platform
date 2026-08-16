import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';
import {
  Users, ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle,
  Calendar, ClipboardList, BarChart3, UserCheck, Swords, Dumbbell,
  Save, RefreshCw
} from "lucide-react";

const STATUS_OPTIONS = [
  { value: "present", label: "Present", icon: <CheckCircle className="h-4 w-4 text-green-500" />, color: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400" },
  { value: "absent",  label: "Absent",  icon: <XCircle className="h-4 w-4 text-red-500" />,     color: "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400" },
  { value: "late",    label: "Late",    icon: <Clock className="h-4 w-4 text-yellow-500" />,     color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400" },
  { value: "excused", label: "Excused", icon: <AlertCircle className="h-4 w-4 text-blue-500" />, color: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400" },
];

const SESSION_TYPES = [
  { value: "training", label: "Training Session", icon: <Dumbbell className="h-4 w-4" /> },
  { value: "match",    label: "Match Day",         icon: <Swords className="h-4 w-4" /> },
  { value: "meeting",  label: "Team Meeting",      icon: <Users className="h-4 w-4" /> },
  { value: "medical",  label: "Medical Session",   icon: <ClipboardList className="h-4 w-4" /> },
  { value: "other",    label: "Other",             icon: <Calendar className="h-4 w-4" /> },
];

const ROLE_LABELS: Record<string, string> = {
  head_coach: "Head Coach", assistant_coach: "Assistant Coach", goalkeeper_coach: "GK Coach",
  fitness_coach: "Fitness Coach", load_trainer: "Load Trainer", analyst: "Analyst",
  video_analyst: "Video Analyst", team_doctor: "Team Doctor", physiotherapist: "Physiotherapist",
  nutritionist: "Nutritionist", psychologist: "Sports Psychologist", medical: "Medical Staff",
  technical: "Technical Staff", technical_director: "Technical Director",
  sporting_director: "Sporting Director", team_manager: "Team Manager",
  kit_manager: "Kit Manager", admin: "Admin", custom: "Staff",
};

export default function StaffAttendanceTracker() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { t, language } = useLanguage();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [sessionType, setSessionType] = useState<string>("training");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessionLabel, setSessionLabel] = useState("");
  const [attendanceMap, setAttendanceMap] = useState<Record<number, { status: string; notes: string }>>({});
  const [isSaving, setIsSaving] = useState(false);

  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: teamStaff, isLoading: staffLoading } = trpc.teams.getCoaches.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );
  const { data: summary, refetch: refetchSummary } = trpc.staffAttendance.getSummary.useQuery(
    { teamId: selectedTeamId ?? undefined },
    { enabled: !!selectedTeamId }
  );
  const { data: recentRecords, refetch: refetchRecent } = trpc.staffAttendance.getByTeam.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );

  const bulkRecord = trpc.staffAttendance.bulkRecord.useMutation({
    onSuccess: (data) => {
      toast({ title: "Attendance saved", description: `${data.count} records saved successfully.` });
      setAttendanceMap({});
      refetchSummary();
      refetchRecent();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleStatusChange = (staffUserId: number, status: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [staffUserId]: { ...prev[staffUserId], status },
    }));
  };

  const handleNotesChange = (staffUserId: number, notes: string) => {
    setAttendanceMap(prev => ({
      ...prev,
      [staffUserId]: { ...prev[staffUserId], notes },
    }));
  };

  const handleSave = async () => {
    if (!selectedTeamId) return;
    const records = Object.entries(attendanceMap).map(([id, val]) => ({
      staffUserId: Number(id),
      status: val.status as any,
      notes: val.notes,
    }));
    if (records.length === 0) {
      toast({ title: "No records", description: "Please mark attendance for at least one staff member.", variant: "destructive" });
      return;
    }
    setIsSaving(true);
    try {
      await bulkRecord.mutateAsync({
        records,
        teamId: selectedTeamId,
        sessionType: sessionType as any,
        sessionDate,
        sessionLabel: sessionLabel || undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusCfg = (status: string) => STATUS_OPTIONS.find(s => s.value === status) || STATUS_OPTIONS[0];

  // Group recent records by session date + label
  const groupedRecords: Record<string, any[]> = {};
  for (const rec of recentRecords || []) {
    const key = `${rec.sessionDate}__${rec.sessionLabel || rec.sessionType}`;
    if (!groupedRecords[key]) groupedRecords[key] = [];
    groupedRecords[key].push(rec);
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
              <BackButton />
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <UserCheck className="h-8 w-8 text-primary" />
              Staff Attendance Tracker
            </h1>
            <p className="text-muted-foreground mt-1">Record and monitor staff attendance for matches and training sessions</p>
          </div>
        </div>

        {/* Team Selection */}
        <Card>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <Label>Team</Label>
                <Select value={selectedTeamId ? String(selectedTeamId) : ""} onValueChange={v => { setSelectedTeamId(Number(v)); setAttendanceMap({}); }}>
                  <SelectTrigger><SelectValue placeholder="Select team…" /></SelectTrigger>
                  <SelectContent>
                    {(teams || []).map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Session Type</Label>
                <Select value={sessionType} onValueChange={setSessionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Date</Label>
                <Input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Session Label (optional)</Label>
                <Input placeholder="e.g. vs Future Stars FC - League" value={sessionLabel} onChange={e => setSessionLabel(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedTeamId && (
          <Tabs defaultValue="record" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="record">Record Attendance</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            {/* ── Record Attendance ── */}
            <TabsContent value="record" className="space-y-4">
              {staffLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
              ) : !teamStaff || teamStaff.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No staff assigned to this team yet.</p>
                    <p className="text-sm mt-1">Add staff via Team Management → Staff tab.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-3">
                    {(teamStaff || []).map((staff: any) => {
                      const current = attendanceMap[staff.coachUserId];
                      const statusCfg = current?.status ? getStatusCfg(current.status) : null;
                      return (
                        <Card key={staff.coachUserId} className={`border ${current?.status === 'absent' ? 'border-red-500/30' : current?.status === 'present' ? 'border-green-500/30' : 'border-border'}`}>
                          <CardContent className="pt-4">
                            <div className="flex items-start gap-4 flex-wrap">
                              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                  {(staff.coachName || staff.name || "?")[0]}
                                </div>
                                <div>
                                  <p className="font-semibold">{staff.coachName || staff.name || "Unknown"}</p>
                                  <p className="text-xs text-muted-foreground capitalize">{ROLE_LABELS[staff.role] || staff.role}</p>
                                </div>
                              </div>
                              <div className="flex gap-2 flex-wrap">
                                {STATUS_OPTIONS.map(opt => (
                                  <button
                                    key={opt.value}
                                    onClick={() => handleStatusChange(staff.coachUserId, opt.value)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                                      current?.status === opt.value
                                        ? opt.color + " ring-2 ring-offset-1 ring-current"
                                        : "border-border bg-muted/30 text-muted-foreground hover:border-primary/50"
                                    }`}
                                  >
                                    {opt.icon} {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {(current?.status === 'absent' || current?.status === 'late' || current?.status === 'excused') && (
                              <div className="mt-3">
                                <Textarea
                                  placeholder="Reason / notes…"
                                  value={current?.notes || ""}
                                  onChange={e => handleNotesChange(staff.coachUserId, e.target.value)}
                                  className="h-16 text-sm"
                                />
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Summary bar */}
                  <Card className="border-primary/20 bg-primary/5">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex gap-4 text-sm">
                          {STATUS_OPTIONS.map(opt => {
                            const count = Object.values(attendanceMap).filter(v => v.status === opt.value).length;
                            return count > 0 ? (
                              <div key={opt.value} className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${opt.color}`}>
                                {opt.icon} {count} {opt.label}
                              </div>
                            ) : null;
                          })}
                          <span className="text-muted-foreground">
                            {Object.keys(attendanceMap).length} / {(teamStaff || []).length} marked
                          </span>
                        </div>
                        <Button onClick={handleSave} disabled={isSaving || Object.keys(attendanceMap).length === 0} className="gap-2">
                          {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Save Attendance
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* ── History ── */}
            <TabsContent value="history" className="space-y-4">
              {Object.keys(groupedRecords).length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No attendance records yet for this team.</p>
                  </CardContent>
                </Card>
              ) : (
                Object.entries(groupedRecords).map(([key, records]) => {
                  const [date, label] = key.split("__");
                  const present = records.filter(r => r.status === "present").length;
                  const absent  = records.filter(r => r.status === "absent").length;
                  const late    = records.filter(r => r.status === "late").length;
                  return (
                    <Card key={key}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            {new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                          </CardTitle>
                          <div className="flex gap-2 items-center">
                            <Badge variant="outline" className="text-xs capitalize">{label}</Badge>
                            <span className="text-xs text-green-700 dark:text-green-500 font-medium">{present} Present</span>
                            {absent > 0 && <span className="text-xs text-red-500 font-medium">{absent} Absent</span>}
                            {late > 0 && <span className="text-xs text-yellow-700 dark:text-yellow-500 font-medium">{late} Late</span>}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {records.map((rec: any) => {
                            const cfg = getStatusCfg(rec.status);
                            return (
                              <div key={rec.id} className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${cfg.color}`}>
                                {cfg.icon}
                                <span className="font-medium truncate">{rec.staffName || "Unknown"}</span>
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* ── Summary ── */}
            <TabsContent value="summary" className="space-y-4">
              {!summary || summary.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No attendance data to summarize yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {(summary || []).map((s: any) => {
                    const attendancePct = s.total > 0 ? Math.round((s.present / s.total) * 100) : 0;
                    return (
                      <Card key={s.staffUserId}>
                        <CardContent className="pt-4">
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                                {(s.staffName || "?")[0]}
                              </div>
                              <div>
                                <p className="font-semibold">{s.staffName}</p>
                                <p className="text-xs text-muted-foreground capitalize">{ROLE_LABELS[s.role] || s.role}</p>
                              </div>
                            </div>
                            <div className="flex gap-4 text-sm flex-wrap">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-primary">{attendancePct}%</p>
                                <p className="text-xs text-muted-foreground">Attendance</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-semibold text-green-700 dark:text-green-500">{s.present}</p>
                                <p className="text-xs text-muted-foreground">Present</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-semibold text-red-500">{s.absent}</p>
                                <p className="text-xs text-muted-foreground">Absent</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-semibold text-yellow-700 dark:text-yellow-500">{s.late}</p>
                                <p className="text-xs text-muted-foreground">Late</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-semibold text-blue-500">{s.excused}</p>
                                <p className="text-xs text-muted-foreground">Excused</p>
                              </div>
                              <div className="text-center">
                                <p className="text-lg font-semibold text-muted-foreground">{s.total}</p>
                                <p className="text-xs text-muted-foreground">Total</p>
                              </div>
                            </div>
                            <div className="w-full mt-2">
                              <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${attendancePct >= 80 ? "bg-green-500" : attendancePct >= 60 ? "bg-yellow-500" : "bg-red-500"}`}
                                  style={{ width: `${attendancePct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!selectedTeamId && (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Select a team to get started</p>
              <p className="text-sm mt-1">Choose a team above to record or view staff attendance</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
