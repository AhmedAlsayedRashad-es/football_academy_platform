import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { getLoginUrl } from '@/const';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayoutSkeleton } from '@/components/DashboardLayoutSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Trophy, Shield, Users, UserCog, Calendar, Star,
  Loader2, Activity, Clock, MapPin, Swords, BarChart3,
  Edit, Plus, Trash2, RefreshCw, TrendingUp, Target, Zap, Pencil
} from 'lucide-react';

const DEFAULT_AGE_GROUPS = ["U-8","U-10","U-12","U-14","U-16","U-18","U-21","Senior","Women","Other"];

// Grouped staff roles
const STAFF_ROLE_GROUPS = [
  {
    group: "Technical Staff", groupAr: "الجهاز الفني",
    roles: [
      { value: "head_coach", en: "Head Coach", ar: "المدرب الرئيسي", color: "bg-red-500/10 text-red-600 border-red-200" },
      { value: "assistant_coach", en: "Assistant Coach", ar: "مدرب مساعد", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
      { value: "goalkeeper_coach", en: "Goalkeeper Coach", ar: "مدرب حراس المرمى", color: "bg-yellow-500/10 text-yellow-600 border-yellow-200" },
      { value: "fitness_coach", en: "Fitness Coach", ar: "مدرب اللياقة البدنية", color: "bg-green-500/10 text-green-600 border-green-200" },
      { value: "load_trainer", en: "Load Trainer", ar: "مدرب الأحمال", color: "bg-lime-500/10 text-lime-700 border-lime-200" },
      { value: "analyst", en: "Performance Analyst", ar: "محلل الأداء", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
      { value: "video_analyst", en: "Video Analyst", ar: "محلل الفيديو", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
      { value: "technical_director", en: "Technical Director", ar: "المدير الفني", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
      { value: "sporting_director", en: "Sporting Director", ar: "المدير الرياضي", color: "bg-violet-500/10 text-violet-600 border-violet-200" },
      { value: "technical", en: "Technical Staff", ar: "طاقم فني", color: "bg-zinc-500/10 text-zinc-600 border-zinc-200" },
    ]
  },
  {
    group: "Medical Staff", groupAr: "الجهاز الطبي",
    roles: [
      { value: "team_doctor", en: "Team Doctor", ar: "طبيب الفريق", color: "bg-teal-500/10 text-teal-700 border-teal-200" },
      { value: "physiotherapist", en: "Physiotherapist", ar: "معالج فيزيائي", color: "bg-cyan-500/10 text-cyan-700 border-cyan-200" },
      { value: "nutritionist", en: "Nutritionist", ar: "أخصائي تغذية", color: "bg-emerald-500/10 text-emerald-700 border-emerald-200" },
      { value: "psychologist", en: "Sports Psychologist", ar: "أخصائي نفسي رياضي", color: "bg-sky-500/10 text-sky-700 border-sky-200" },
      { value: "medical", en: "Medical Staff", ar: "طاقم طبي", color: "bg-teal-500/10 text-teal-600 border-teal-200" },
    ]
  },
  {
    group: "Administrative Staff", groupAr: "الجهاز الإداري",
    roles: [
      { value: "team_manager", en: "Team Manager", ar: "مدير الفريق", color: "bg-slate-500/10 text-slate-700 border-slate-200" },
      { value: "kit_manager", en: "Kit Manager", ar: "مدير المعدات", color: "bg-stone-500/10 text-stone-700 border-stone-200" },
      { value: "admin", en: "Admin / Manager", ar: "مدير إداري", color: "bg-gray-500/10 text-gray-600 border-gray-200" },
      { value: "custom", en: "Custom Role → specify below", ar: "دور مخصص ← حدد أدناه", color: "bg-pink-500/10 text-pink-600 border-pink-200" },
    ]
  },
];
const STAFF_ROLES = STAFF_ROLE_GROUPS.flatMap(g => g.roles);
const ROLE_LABELS: Record<string, { en: string; ar: string; color?: string }> = Object.fromEntries(
  STAFF_ROLES.map(r => [r.value, { en: r.en, ar: r.ar, color: r.color }])
);

const RESULT_COLORS: Record<string, string> = {
  win: "text-green-600 bg-green-50 border-green-200",
  draw: "text-yellow-600 bg-yellow-50 border-yellow-200",
  loss: "text-red-600 bg-red-50 border-red-200",
};

function getInitials(name: string | null | undefined) {
  if (!name) return "?";
  return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
}

function formatDate(d: string | Date | null | undefined, short = false) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", short
    ? { day: "2-digit", month: "short" }
    : { day: "2-digit", month: "short", year: "numeric" });
}

const nativeSelectCls = "w-full h-10 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring";

export default function TeamDetailPage() {
  const [, params] = useRoute("/admin/teams/:id");
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { toast } = useToast();
  const teamId = params?.id ? Number(params.id) : null;
  const [activeTab, setActiveTab] = useState("squad");

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [showAssignStaffDialog, setShowAssignStaffDialog] = useState(false);

  const [editForm, setEditForm] = useState({ name: "", ageGroup: "", teamType: "academy" as "main" | "academy", description: "" });
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [staffForm, setStaffForm] = useState({ userId: "", role: "assistant_coach", customRole: "", notes: "", isPrimary: false });

  const { data: team, isLoading: teamLoading, refetch: refetchTeam } = trpc.teams.getById.useQuery(
    { id: teamId! }, { enabled: !!teamId }
  );
  const { data: players, isLoading: playersLoading, refetch: refetchPlayers } = trpc.teams.getPlayers.useQuery(
    { teamId: teamId! }, { enabled: !!teamId }
  );
  const { data: staff, isLoading: staffLoading, refetch: refetchStaff } = trpc.teams.getStaff.useQuery(
    { teamId: teamId! }, { enabled: !!teamId }
  );
  const { data: matches } = trpc.matches.getByTeam.useQuery(
    { teamId: teamId! }, { enabled: !!teamId }
  );
  const { data: attendanceStats, isLoading: attendanceLoading } = trpc.attendance.getTeamAttendance.useQuery(
    { teamId: teamId! }, { enabled: !!teamId }
  );
  const { data: allPlayers } = trpc.players.getAll.useQuery(undefined, { enabled: showAddPlayerDialog });
  const { data: allUsers } = trpc.teams.getAvailableCoaches.useQuery(undefined, { enabled: showAssignStaffDialog });
  const { data: systemAgeGroups } = trpc.admin.getAgeGroups.useQuery();
  const { data: topScorers, isLoading: topScorersLoading } = trpc.teams.getTopScorers.useQuery(
    { teamId: teamId!, limit: 10 }, { enabled: !!teamId && activeTab === 'performance' }
  );
  const AGE_GROUPS = (systemAgeGroups as string[] | undefined) || DEFAULT_AGE_GROUPS;

  const updateTeam = trpc.teams.update.useMutation({
    onSuccess: () => { toast({ title: isRTL ? "تم تحديث الفريق" : "Team updated" }); setShowEditDialog(false); refetchTeam(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const addPlayer = trpc.teams.addPlayer.useMutation({
    onSuccess: () => { toast({ title: isRTL ? "تم إضافة اللاعب" : "Player added" }); setShowAddPlayerDialog(false); setSelectedPlayerId(""); refetchPlayers(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const removePlayer = trpc.teams.removePlayer.useMutation({
    onSuccess: () => { toast({ title: isRTL ? "تم إزالة اللاعب" : "Player removed" }); refetchPlayers(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const assignStaff = trpc.teams.assignStaff.useMutation({
    onSuccess: () => { toast({ title: isRTL ? "تم تعيين الموظف" : "Staff assigned" }); setShowAssignStaffDialog(false); setStaffForm({ userId: "", role: "assistant_coach", customRole: "", notes: "", isPrimary: false }); refetchStaff(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const removeStaff = trpc.teams.removeStaff.useMutation({
    onSuccess: () => { toast({ title: isRTL ? "تم إزالة الموظف" : "Staff removed" }); refetchStaff(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const updateCoachRole = trpc.teams.updateCoachRole.useMutation({
    onSuccess: () => { toast({ title: isRTL ? "تم تحديث الدور" : "Role updated" }); setShowEditStaffDialog(false); refetchStaff(); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const [showEditStaffDialog, setShowEditStaffDialog] = useState(false);
  const [editStaffForm, setEditStaffForm] = useState<{ assignmentId: number; coachUserId: number; role: string; customRole: string; notes: string; isPrimary: boolean; name: string; currentAvatar?: string | null } | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const updateUserAvatar = trpc.upload.updateUserAvatar.useMutation({
    onSuccess: () => { refetchStaff(); toast({ title: isRTL ? 'تم تحديث الصورة' : 'Photo updated' }); },
    onError: (e) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });
  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editStaffForm) return;
    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = (ev.target?.result as string).split(',')[1];
        // Posted directly rather than through the tRPC client so the base64
        // payload streams as a plain request body.
        const result = await fetch('/api/trpc/upload.uploadFile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ json: { fileData: base64, fileName: file.name, contentType: file.type } }),
        });
        const data = await result.json();
        const url = data?.result?.data?.json?.url;
        if (url) {
          await updateUserAvatar.mutateAsync({ userId: editStaffForm.coachUserId, avatarUrl: url });
          setEditStaffForm(f => f ? { ...f, currentAvatar: url } : f);
        }
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadingAvatar(false);
    }
  }
  function openEditStaff(s: any) {
    setEditStaffForm({ assignmentId: s.id, coachUserId: s.coachUserId, role: s.role ?? 'assistant_coach', customRole: s.customRole ?? '', notes: s.notes ?? '', isPrimary: !!s.isPrimary, name: s.coachName ?? s.coachEmail ?? '', currentAvatar: s.coachAvatar });
    setShowEditStaffDialog(true);
  }

  if (authLoading || teamLoading) return <DashboardLayoutSkeleton />;
  if (!user) { window.location.href = getLoginUrl(); return null; }
  if (!team) return (
    <>
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Shield className="h-12 w-12 mb-4 opacity-30" />
        <p>{isRTL ? "لم يتم العثور على الفريق" : "Team not found"}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/team-management")}>{isRTL ? "العودة" : "Go Back"}</Button>
      </div>
    </>
  );

  const completedMatches = (matches ?? []).filter((m: any) => m.result);
  const wins = completedMatches.filter((m: any) => m.result === "win").length;
  const draws = completedMatches.filter((m: any) => m.result === "draw").length;
  const losses = completedMatches.filter((m: any) => m.result === "loss").length;
  const goalsFor = completedMatches.reduce((s: number, m: any) => s + (m.teamScore ?? 0), 0);
  const goalsAgainst = completedMatches.reduce((s: number, m: any) => s + (m.opponentScore ?? 0), 0);
  const upcomingMatches = (matches ?? []).filter((m: any) => !m.result && m.matchDate && new Date(m.matchDate) >= new Date());
  const recentMatches = completedMatches.slice(-5).reverse();
  const avgAttendance = attendanceStats && (attendanceStats as any[]).length > 0
    ? Math.round((attendanceStats as any[]).reduce((s: number, p: any) => s + (p.attendanceRate ?? 0), 0) / (attendanceStats as any[]).length)
    : 0;
  const unassignedPlayers = (allPlayers as any[] | undefined)?.filter((p: any) => !p.teamId || p.teamId !== teamId) ?? [];

  function openEditDialog() {
    setEditForm({ name: (team as any).name || "", ageGroup: (team as any).ageGroup || "", teamType: (team as any).teamType || "academy", description: (team as any).description || "" });
    setShowEditDialog(true);
  }

  return (
    <>
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div>
          <button onClick={() => navigate("/admin/team-management")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-4">
            <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} />
            {isRTL ? "إدارة الفرق" : "Team Management"}
          </button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${(team as any).teamType === "main" ? "bg-yellow-500/10" : "bg-blue-500/10"}`}>
                {(team as any).teamType === "main" ? <Trophy className="h-8 w-8 text-yellow-700 dark:text-yellow-500" /> : <Shield className="h-8 w-8 text-blue-500" />}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{(team as any).name}</h1>
                <div className="flex items-center gap-2 mt-1.5">
                  <Badge variant="outline">{(team as any).ageGroup}</Badge>
                  <Badge variant={(team as any).teamType === "main" ? "destructive" : "secondary"}>
                    {(team as any).teamType === "main" ? (isRTL ? "رئيسي" : "Main Team") : (isRTL ? "أكاديمية" : "Academy")}
                  </Badge>
                </div>
                {(team as any).description && <p className="text-sm text-muted-foreground mt-1">{(team as any).description}</p>}
              </div>
            </div>
            {user.role === "admin" && (
              <Button variant="outline" size="sm" onClick={openEditDialog} className="shrink-0 gap-2">
                <Edit className="h-4 w-4" />{isRTL ? "تعديل الفريق" : "Edit Team"}
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Users className="h-5 w-5 text-blue-500" />, bg: "bg-blue-500/10", value: (players as any[])?.length ?? 0, label: isRTL ? "اللاعبون" : "Players" },
            { icon: <UserCog className="h-5 w-5 text-purple-500" />, bg: "bg-purple-500/10", value: (staff as any[])?.length ?? 0, label: isRTL ? "الجهاز الفني" : "Staff" },
            { icon: <Swords className="h-5 w-5 text-green-700 dark:text-green-500" />, bg: "bg-green-500/10", value: completedMatches.length, label: isRTL ? "المباريات" : "Matches" },
            { icon: <Activity className="h-5 w-5 text-orange-700 dark:text-orange-500" />, bg: "bg-orange-500/10", value: `${avgAttendance}%`, label: isRTL ? "الحضور" : "Avg Attendance" },
          ].map((s, i) => (
            <Card key={i}><CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>{s.icon}</div>
              <div><div className="text-2xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
            </CardContent></Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="squad"><Users className="h-4 w-4 mr-1" />{isRTL ? "الفريق" : "Squad"}</TabsTrigger>
            <TabsTrigger value="staff"><UserCog className="h-4 w-4 mr-1" />{isRTL ? "الجهاز" : "Staff"}</TabsTrigger>
            <TabsTrigger value="fixtures"><Calendar className="h-4 w-4 mr-1" />{isRTL ? "المباريات" : "Fixtures"}</TabsTrigger>
            <TabsTrigger value="attendance"><BarChart3 className="h-4 w-4 mr-1" />{isRTL ? "الحضور" : "Attendance"}</TabsTrigger>
            <TabsTrigger value="performance"><TrendingUp className="h-4 w-4 mr-1" />{isRTL ? "الأداء" : "Performance"}</TabsTrigger>
            <TabsTrigger value="scouting"><Target className="h-4 w-4 mr-1" />{isRTL ? "الكشافة" : "Scouting"}</TabsTrigger>
          </TabsList>

          {/* Squad */}
          <TabsContent value="squad" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base">{isRTL ? `قائمة اللاعبين (${(players as any[])?.length ?? 0})` : `Squad (${(players as any[])?.length ?? 0} players)`}</h3>
              {user.role === "admin" && <Button size="sm" onClick={() => setShowAddPlayerDialog(true)} className="bg-red-700 hover:bg-red-600 text-white gap-1.5"><Plus className="h-4 w-4" />{isRTL ? "إضافة لاعب" : "Add Player"}</Button>}
            </div>
            {playersLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            : !players || (players as any[]).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>{isRTL ? "لا يوجد لاعبون مُعيَّنون لهذا الفريق" : "No players assigned to this team yet"}</p>
                {user.role === "admin" && <Button size="sm" className="mt-3 bg-red-700 hover:bg-red-600 text-white" onClick={() => setShowAddPlayerDialog(true)}><Plus className="h-4 w-4 mr-1" />{isRTL ? "إضافة لاعب" : "Add Player"}</Button>}
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(players as any[]).map((p: any) => (
                  <Card key={p.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0 cursor-pointer" onClick={() => navigate(`/players/${p.id}`)}>
                        {p.jerseyNumber ? `#${p.jerseyNumber}` : getInitials(`${p.firstName} ${p.lastName}`)}
                      </div>
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/players/${p.id}`)}>
                        <div className="font-medium text-sm truncate">{p.firstName} {p.lastName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 capitalize">{p.position?.replace(/_/g, " ") || "—"}{p.ageGroup ? ` · ${p.ageGroup}` : ""}</div>
                      </div>
                      {user.role === "admin" && (
                        <button onClick={() => removePlayer.mutate({ playerId: p.id })} className="text-muted-foreground hover:text-destructive p-1 shrink-0" title={isRTL ? "إزالة" : "Remove"}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Staff */}
          <TabsContent value="staff" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base">{isRTL ? `الجهاز الفني والإداري (${(staff as any[])?.length ?? 0})` : `Technical & Admin Staff (${(staff as any[])?.length ?? 0})`}</h3>
              {user.role === "admin" && <Button size="sm" onClick={() => setShowAssignStaffDialog(true)} className="bg-red-700 hover:bg-red-600 text-white gap-1.5"><Plus className="h-4 w-4" />{isRTL ? "تعيين موظف" : "Assign Staff"}</Button>}
            </div>
            {staffLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            : !staff || (staff as any[]).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <UserCog className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>{isRTL ? "لا يوجد جهاز فني مُعيَّن لهذا الفريق" : "No staff assigned to this team yet"}</p>
                {user.role === "admin" && <Button size="sm" className="mt-3 bg-red-700 hover:bg-red-600 text-white" onClick={() => setShowAssignStaffDialog(true)}><Plus className="h-4 w-4 mr-1" />{isRTL ? "تعيين موظف" : "Assign Staff"}</Button>}
              </CardContent></Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(staff as any[]).map((s: any, idx: number) => {
                  const roleInfo = ROLE_LABELS[s.role] ?? { en: s.role, ar: s.role, color: "bg-muted text-muted-foreground border-border" };
                  const displayRole = s.role === "custom" && s.customRole
                    ? s.customRole
                    : (isRTL ? roleInfo.ar : roleInfo.en);
                  return (
                    <Card key={idx}><CardContent className="p-4 flex items-center gap-3">
                      {s.coachAvatar
                        ? <img src={s.coachAvatar} alt={s.coachName ?? ''} className="w-11 h-11 rounded-full object-contain border-2 border-purple-200 shrink-0" />
                        : <div className="w-11 h-11 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold text-sm border border-purple-200 shrink-0">{getInitials(s.coachName)}</div>
                      }
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm flex items-center gap-1.5">
                          <span className="truncate">{s.coachName ?? s.coachEmail ?? `User #${s.coachUserId}`}</span>
                          {s.isPrimary && <Star className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-500 fill-yellow-500 shrink-0" />}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{s.coachEmail}</div>
                        {s.notes && <div className="text-xs text-muted-foreground/70 truncate mt-0.5 italic">{s.notes}</div>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="outline" className={`text-xs ${roleInfo.color ?? ""}`}>{displayRole}</Badge>
                        {user.role === "admin" && (
                          <>
                            <button onClick={() => openEditStaff(s)} className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-500 p-1" title={isRTL ? 'تعديل الدور' : 'Edit role'}><Pencil className="h-3.5 w-3.5" /></button>
                            <button onClick={() => removeStaff.mutate({ teamId: teamId!, userId: s.coachUserId })} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="h-3.5 w-3.5" /></button>
                          </>
                        )}
                      </div>
                    </CardContent></Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Edit Staff Dialog */}
          <Dialog open={showEditStaffDialog} onOpenChange={setShowEditStaffDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5" />{isRTL ? 'تعديل دور الموظف' : 'Edit Staff Role'}</DialogTitle>
                <DialogDescription>{editStaffForm?.name}</DialogDescription>
              </DialogHeader>
              {editStaffForm && (
                <div className="space-y-4 py-2">
                  {/* Photo Upload */}
                  <div className="flex items-center gap-4">
                    {editStaffForm.currentAvatar
                      ? <img src={editStaffForm.currentAvatar} alt={editStaffForm.name} className="w-16 h-16 rounded-full object-contain border-2 border-border" />
                      : <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold text-xl border-2 border-purple-200">{getInitials(editStaffForm.name)}</div>
                    }
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">{isRTL ? 'صورة الموظف' : 'Staff Photo'}</Label>
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                        <Button type="button" variant="outline" size="sm" disabled={uploadingAvatar} asChild>
                          <span>{uploadingAvatar ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}{isRTL ? 'رفع صورة' : 'Upload Photo'}</span>
                        </Button>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>{isRTL ? 'الدور' : 'Role'}</Label>
                    <select
                      value={editStaffForm.role}
                      onChange={e => setEditStaffForm(f => f ? { ...f, role: e.target.value, customRole: '' } : f)}
                      className="w-full h-10 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      {STAFF_ROLE_GROUPS.map(g => (
                        <optgroup key={g.group} label={isRTL ? g.groupAr : g.group}>
                          {g.roles.map(r => <option key={r.value} value={r.value}>{isRTL ? r.ar : r.en}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  {editStaffForm.role === 'custom' && (
                    <div className="space-y-2">
                      <Label>{isRTL ? 'اسم الدور المخصص' : 'Custom Role Name'} *</Label>
                      <input
                        type="text"
                        value={editStaffForm.customRole}
                        onChange={e => setEditStaffForm(f => f ? { ...f, customRole: e.target.value } : f)}
                        placeholder={isRTL ? 'مثال: مدرب الركلات الثابتة' : 'e.g. Set Piece Coach'}
                        className="w-full h-10 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        maxLength={100}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label>{isRTL ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</Label>
                    <textarea
                      value={editStaffForm.notes}
                      onChange={e => setEditStaffForm(f => f ? { ...f, notes: e.target.value } : f)}
                      placeholder={isRTL ? 'أي معلومات إضافية...' : 'Any additional information...'}
                      className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none h-16"
                      maxLength={500}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>{isRTL ? 'المسؤول الرئيسي' : 'Primary / Head Role'}</Label>
                    <Switch checked={editStaffForm.isPrimary} onCheckedChange={v => setEditStaffForm(f => f ? { ...f, isPrimary: v } : f)} />
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowEditStaffDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
                <Button
                  onClick={() => {
                    if (!editStaffForm) return;
                    if (editStaffForm.role === 'custom' && !editStaffForm.customRole.trim()) {
                      toast({ title: isRTL ? 'اكتب اسم الدور المخصص' : 'Enter custom role name', variant: 'destructive' });
                      return;
                    }
                    updateCoachRole.mutate({ assignmentId: editStaffForm.assignmentId, role: editStaffForm.role as any, customRole: editStaffForm.customRole || undefined, notes: editStaffForm.notes || undefined, isPrimary: editStaffForm.isPrimary });
                  }}
                  disabled={updateCoachRole.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {updateCoachRole.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Fixtures */}
          <TabsContent value="fixtures" className="mt-4 space-y-4">
            {completedMatches.length > 0 && (
              <Card><CardHeader className="pb-3"><CardTitle className="text-base">{isRTL ? "سجل المباريات" : "Match Record"}</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-5 gap-2 text-center">
                    {[{v:wins,l:isRTL?"فوز":"W",c:"text-green-600"},{v:draws,l:isRTL?"تعادل":"D",c:"text-yellow-600"},{v:losses,l:isRTL?"خسارة":"L",c:"text-red-600"},{v:goalsFor,l:isRTL?"أهداف":"GF",c:""},{v:goalsAgainst,l:isRTL?"عليه":"GA",c:""}].map((s,i) => (
                      <div key={i}><div className={`text-2xl font-bold ${s.c}`}>{s.v}</div><div className="text-xs text-muted-foreground">{s.l}</div></div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            {upcomingMatches.length > 0 && (
              <Card><CardHeader className="pb-3"><CardTitle className="text-base">{isRTL ? "المباريات القادمة" : "Upcoming Matches"}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {upcomingMatches.slice(0,5).map((m: any) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center"><Swords className="h-4 w-4 text-blue-500" /></div>
                        <div>
                          <div className="font-medium text-sm">vs {m.opponent || (isRTL ? "منافس" : "Opponent")}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(m.matchDate)}{m.venue && <><MapPin className="h-3 w-3 ml-1" />{m.venue}</>}</div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{m.matchType || "match"}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {recentMatches.length > 0 && (
              <Card><CardHeader className="pb-3"><CardTitle className="text-base">{isRTL ? "آخر النتائج" : "Recent Results"}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {recentMatches.map((m: any) => (
                    <div key={m.id} className={`flex items-center justify-between p-3 rounded-lg border ${RESULT_COLORS[m.result] || ""}`}>
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-sm uppercase w-6 text-center">{m.result?.[0]?.toUpperCase()}</div>
                        <div><div className="font-medium text-sm">vs {m.opponent || (isRTL ? "منافس" : "Opponent")}</div><div className="text-xs opacity-70">{formatDate(m.matchDate, true)}</div></div>
                      </div>
                      <div className="font-bold text-lg">{m.teamScore ?? "?"} – {m.opponentScore ?? "?"}</div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {completedMatches.length === 0 && upcomingMatches.length === 0 && (
              <Card><CardContent className="py-12 text-center text-muted-foreground"><Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" /><p>{isRTL ? "لا توجد مباريات مسجلة بعد" : "No matches recorded yet"}</p></CardContent></Card>
            )}
          </TabsContent>

          {/* Performance Dashboard */}
          <TabsContent value="performance" className="mt-4">
            {completedMatches.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <TrendingUp className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>{isRTL ? "لا توجد بيانات أداء بعد — سجّل مباريات أولاً" : "No performance data yet — record some matches first"}</p>
              </CardContent></Card>
            ) : (() => {
              const totalMatches = completedMatches.length;
              const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
              const goalDiff = goalsFor - goalsAgainst;
              const avgGoalsFor = totalMatches > 0 ? (goalsFor / totalMatches).toFixed(1) : "0.0";
              const avgGoalsAgainst = totalMatches > 0 ? (goalsAgainst / totalMatches).toFixed(1) : "0.0";
              // Form guide: last 5 matches
              const formGuide = completedMatches.slice(-5).reverse();
              // Top scorers from match stats (use teamScore as proxy)
              const cleanSheets = completedMatches.filter((m: any) => (m.opponentScore ?? 0) === 0).length;
              return (
                <div className="space-y-4">
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { icon: <TrendingUp className="h-5 w-5 text-green-700 dark:text-green-500" />, bg: "bg-green-500/10", value: `${winRate}%`, label: isRTL ? "نسبة الفوز" : "Win Rate" },
                      { icon: <Target className="h-5 w-5 text-blue-500" />, bg: "bg-blue-500/10", value: avgGoalsFor, label: isRTL ? "أهداف/مباراة" : "Goals/Match" },
                      { icon: <Zap className="h-5 w-5 text-yellow-700 dark:text-yellow-500" />, bg: "bg-yellow-500/10", value: goalDiff >= 0 ? `+${goalDiff}` : `${goalDiff}`, label: isRTL ? "فارق الأهداف" : "Goal Diff" },
                      { icon: <Shield className="h-5 w-5 text-purple-500" />, bg: "bg-purple-500/10", value: cleanSheets, label: isRTL ? "شباك نظيفة" : "Clean Sheets" },
                    ].map((s, i) => (
                      <Card key={i}><CardContent className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>{s.icon}</div>
                        <div><div className="text-2xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
                      </CardContent></Card>
                    ))}
                  </div>

                  {/* Win/Draw/Loss Breakdown */}
                  <Card>
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4" />{isRTL ? "توزيع النتائج" : "Result Breakdown"}</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {[
                          { label: isRTL ? "فوز" : "Wins", value: wins, total: totalMatches, color: "bg-green-500" },
                          { label: isRTL ? "تعادل" : "Draws", value: draws, total: totalMatches, color: "bg-yellow-500" },
                          { label: isRTL ? "خسارة" : "Losses", value: losses, total: totalMatches, color: "bg-red-500" },
                        ].map((r, i) => (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{r.label}</span>
                              <span className="text-sm font-bold">{r.value} / {r.total}</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full ${r.color} rounded-full transition-all`} style={{ width: `${r.total > 0 ? (r.value / r.total) * 100 : 0}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Goals Analysis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />{isRTL ? "تحليل الأهداف" : "Goals Analysis"}</CardTitle></CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div className="p-3 rounded-lg bg-green-500/10">
                            <div className="text-3xl font-bold text-green-600">{goalsFor}</div>
                            <div className="text-xs text-muted-foreground mt-1">{isRTL ? "أهداف مسجلة" : "Goals Scored"}</div>
                            <div className="text-xs text-green-600 font-medium">{avgGoalsFor}/match</div>
                          </div>
                          <div className="p-3 rounded-lg bg-red-500/10">
                            <div className="text-3xl font-bold text-red-600">{goalsAgainst}</div>
                            <div className="text-xs text-muted-foreground mt-1">{isRTL ? "أهداف مستقبلة" : "Goals Conceded"}</div>
                            <div className="text-xs text-red-600 font-medium">{avgGoalsAgainst}/match</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Form Guide */}
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4" />{isRTL ? "آخر 5 مباريات" : "Last 5 Matches Form"}</CardTitle></CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2 mb-3">
                          {formGuide.map((m: any, i: number) => (
                            <div key={i} title={`vs ${m.opponent || 'Opponent'} — ${m.teamScore}:${m.opponentScore}`}
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                                m.result === 'win' ? 'bg-green-500' : m.result === 'draw' ? 'bg-yellow-500' : 'bg-red-500'
                              }`}>
                              {m.result?.[0]?.toUpperCase()}
                            </div>
                          ))}
                          {formGuide.length === 0 && <span className="text-sm text-muted-foreground">{isRTL ? "لا توجد مباريات" : "No matches yet"}</span>}
                        </div>
                        <div className="space-y-1.5">
                          {formGuide.map((m: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground truncate max-w-[120px]">vs {m.opponent || (isRTL ? 'منافس' : 'Opponent')}</span>
                              <span className={`font-bold px-2 py-0.5 rounded ${
                                m.result === 'win' ? 'text-green-700 bg-green-50' : m.result === 'draw' ? 'text-yellow-700 bg-yellow-50' : 'text-red-700 bg-red-50'
                              }`}>{m.teamScore ?? '?'} – {m.opponentScore ?? '?'}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Home vs Away */}
                  {(() => {
                    const homeMatches = completedMatches.filter((m: any) => m.isHome === true);
                    const awayMatches = completedMatches.filter((m: any) => m.isHome === false);
                    const homeWins = homeMatches.filter((m: any) => m.result === 'win').length;
                    const awayWins = awayMatches.filter((m: any) => m.result === 'win').length;
                    if (homeMatches.length === 0 && awayMatches.length === 0) return null;
                    return (
                      <Card>
                        <CardHeader className="pb-3"><CardTitle className="text-base">{isRTL ? "ملعب الفريق مقابل الخارج" : "Home vs Away Performance"}</CardTitle></CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-center">
                            <div className="p-3 rounded-lg bg-blue-500/10">
                              <div className="text-2xl font-bold text-blue-600">{homeMatches.length > 0 ? Math.round((homeWins/homeMatches.length)*100) : 0}%</div>
                              <div className="text-xs text-muted-foreground mt-1">{isRTL ? "نسبة الفوز في الملعب" : "Home Win Rate"}</div>
                              <div className="text-xs text-blue-600">{homeWins}W / {homeMatches.length - homeWins}L+D</div>
                            </div>
                            <div className="p-3 rounded-lg bg-orange-500/10">
                              <div className="text-2xl font-bold text-orange-600">{awayMatches.length > 0 ? Math.round((awayWins/awayMatches.length)*100) : 0}%</div>
                              <div className="text-xs text-muted-foreground mt-1">{isRTL ? "نسبة الفوز خارج الملعب" : "Away Win Rate"}</div>
                              <div className="text-xs text-orange-600">{awayWins}W / {awayMatches.length - awayWins}L+D</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })()}
                </div>
              );
            })()}
            {/* Top Scorers Leaderboard */}
            {teamId && (
              <Card className="mt-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Target className="h-4 w-4 text-red-500" />
                    {isRTL ? "هدافو الفريق" : "Top Scorers Leaderboard"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topScorersLoading ? (
                    <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                  ) : !topScorers || (topScorers as any[]).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{isRTL ? "لا توجد إحصائيات مباريات بعد" : "No match statistics recorded yet"}</p>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-12 text-xs font-medium text-muted-foreground px-2 pb-1 border-b">
                        <div className="col-span-1">#</div>
                        <div className="col-span-5">{isRTL ? "اللاعب" : "Player"}</div>
                        <div className="col-span-2 text-center">{isRTL ? "أهداف" : "Goals"}</div>
                        <div className="col-span-2 text-center">{isRTL ? "تمريرات" : "Assists"}</div>
                        <div className="col-span-2 text-center">{isRTL ? "مباريات" : "MP"}</div>
                      </div>
                      {(topScorers as any[]).map((s: any, i: number) => (
                        <div key={s.playerId} className={`grid grid-cols-12 items-center text-sm px-2 py-1.5 rounded-md ${i < 3 ? "bg-amber-50 border border-amber-100" : "hover:bg-muted/50"}`}>
                          <div className="col-span-1">
                            {i === 0 ? <span className="text-amber-700 dark:text-amber-500 font-bold">🥇</span>
                            : i === 1 ? <span className="text-muted-foreground font-bold">🥈</span>
                            : i === 2 ? <span className="text-amber-700 font-bold">🥉</span>
                            : <span className="text-muted-foreground font-medium">{i + 1}</span>}
                          </div>
                          <div className="col-span-5">
                            <div className="font-medium truncate">{s.name}</div>
                            <div className="text-xs text-muted-foreground capitalize">{s.position}</div>
                          </div>
                          <div className="col-span-2 text-center"><span className="font-bold text-red-600">{s.totalGoals}</span></div>
                          <div className="col-span-2 text-center"><span className="font-medium text-blue-600">{s.totalAssists}</span></div>
                          <div className="col-span-2 text-center text-muted-foreground">{s.matchesPlayed}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Attendance */}
          <TabsContent value="attendance" className="mt-4">
            {attendanceLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            : !attendanceStats || (attendanceStats as any[]).length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground"><Activity className="h-10 w-10 mx-auto mb-3 opacity-40" /><p>{isRTL ? "لا توجد بيانات حضور بعد" : "No attendance data available yet"}</p></CardContent></Card>
            ) : (
              <div className="space-y-4">
                <Card><CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">{isRTL ? "متوسط الحضور للفريق" : "Team Average Attendance"}</span>
                    <span className={`text-2xl font-bold ${avgAttendance >= 80 ? "text-green-600" : avgAttendance >= 60 ? "text-yellow-600" : "text-red-600"}`}>{avgAttendance}%</span>
                  </div>
                  <Progress value={avgAttendance} className="h-2" />
                </CardContent></Card>
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base">{isRTL ? "حضور اللاعبين" : "Player Attendance"}</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {(attendanceStats as any[]).sort((a,b) => (b.attendanceRate??0)-(a.attendanceRate??0)).map((p: any) => (
                      <div key={p.playerId} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{getInitials(p.playerName)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{p.playerName}</span>
                            <span className={`text-sm font-bold ml-2 shrink-0 ${(p.attendanceRate??0)>=80?"text-green-600":(p.attendanceRate??0)>=60?"text-yellow-600":"text-red-600"}`}>{p.attendanceRate??0}%</span>
                          </div>
                          <Progress value={p.attendanceRate??0} className="h-1.5" />
                          <div className="text-xs text-muted-foreground mt-0.5">{p.presentSessions}/{p.totalSessions} {isRTL?"جلسة":"sessions"}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          {/* Scouting Tab */}
          <TabsContent value="scouting" className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                {isRTL ? "تقارير الكشافة" : "Team Scouting Reports"}
              </h3>
              <Button size="sm" variant="outline" onClick={() => navigate(`/team/${teamId}/scouting`)}>
                <Target className="h-4 w-4 mr-1" />
                {isRTL ? "عرض تقارير الكشافة" : "Full Scouting Overview"}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(players as any[] ?? []).map((p: any) => (
                <Card key={p.id} className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/player/${p.id}/scouting`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {p.jerseyNumber ? `#${p.jerseyNumber}` : getInitials(`${p.firstName} ${p.lastName}`)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{p.position?.replace(/_/g, ' ') || '—'}</p>
                      </div>
                      <Target className="h-4 w-4 text-muted-foreground shrink-0" />
                    </div>
                    <p className="text-xs text-muted-foreground">{isRTL ? "اضغط لعرض تقرير الكشافة" : "Click to view scouting report"}</p>
                  </CardContent>
                </Card>
              ))}
              {(!players || (players as any[]).length === 0) && (
                <Card className="col-span-3"><CardContent className="py-12 text-center text-muted-foreground">
                  <Target className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p>{isRTL ? "لا يوجد لاعبون في هذا الفريق" : "No players in this team yet"}</p>
                </CardContent></Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Team Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit className="h-5 w-5" />{isRTL ? "تعديل الفريق" : "Edit Team"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{isRTL ? "اسم الفريق *" : "Team Name *"}</label>
              <Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} placeholder={isRTL ? "مثال: أكاديمية تحت 15" : "e.g. U15 Academy A"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isRTL ? "الفئة العمرية *" : "Age Group *"}</label>
                <select value={editForm.ageGroup} onChange={e => setEditForm(p => ({ ...p, ageGroup: e.target.value }))} className={nativeSelectCls}>
                  <option value="" disabled>{isRTL ? "اختر..." : "Select..."}</option>
                  {AGE_GROUPS.map((ag: string) => <option key={ag} value={ag}>{ag}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isRTL ? "نوع الفريق" : "Team Type"}</label>
                <select value={editForm.teamType} onChange={e => setEditForm(p => ({ ...p, teamType: e.target.value as any }))} className={nativeSelectCls}>
                  <option value="academy">{isRTL ? "أكاديمية" : "Academy"}</option>
                  <option value="main">{isRTL ? "الفريق الأول" : "Main Team"}</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{isRTL ? "الوصف (اختياري)" : "Description (optional)"}</label>
              <Textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} placeholder={isRTL ? "وصف الفريق..." : "Team description..."} className="resize-none h-16" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowEditDialog(false)}>{isRTL ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => { if (!editForm.name || !editForm.ageGroup) { toast({ title: isRTL ? "بيانات ناقصة" : "Missing fields", variant: "destructive" }); return; } updateTeam.mutate({ id: teamId!, ...editForm }); }} disabled={updateTeam.isPending} className="bg-red-700 hover:bg-red-600 text-white">
              {updateTeam.isPending && <RefreshCw className="h-4 w-4 animate-spin mr-2" />}
              {isRTL ? "حفظ التغييرات" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Player Dialog */}
      <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5" />{isRTL ? "إضافة لاعب للفريق" : "Add Player to Team"}</DialogTitle>
            <DialogDescription>{isRTL ? "اختر لاعباً من القائمة لإضافته لهذا الفريق" : "Select a player to add to this team"}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <label className="text-sm font-medium mb-1.5 block">{isRTL ? "اختر اللاعب" : "Select Player"}</label>
            <select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)} className={nativeSelectCls}>
              <option value="" disabled>{isRTL ? "اختر لاعباً..." : "Choose a player..."}</option>
              {unassignedPlayers.map((p: any) => (
                <option key={p.id} value={p.id.toString()}>{p.firstName} {p.lastName}{p.ageGroup ? ` (${p.ageGroup})` : ""}</option>
              ))}
            </select>
            {unassignedPlayers.length === 0 && <p className="text-xs text-muted-foreground mt-2">{isRTL ? "لا يوجد لاعبون متاحون" : "No available players found"}</p>}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowAddPlayerDialog(false); setSelectedPlayerId(""); }}>{isRTL ? "إلغاء" : "Cancel"}</Button>
            <Button onClick={() => { if (selectedPlayerId) addPlayer.mutate({ teamId: teamId!, playerId: parseInt(selectedPlayerId) }); }} disabled={!selectedPlayerId || addPlayer.isPending} className="bg-red-700 hover:bg-red-600 text-white">
              {addPlayer.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-1" />}
              {isRTL ? "إضافة للفريق" : "Add to Team"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Staff Dialog */}
      <Dialog open={showAssignStaffDialog} onOpenChange={setShowAssignStaffDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserCog className="h-5 w-5" />{isRTL ? "تعيين موظف للفريق" : "Assign Staff to Team"}</DialogTitle>
            <DialogDescription>{isRTL ? "اختر موظفاً ودوره في هذا الفريق" : "Select a staff member and assign their role. You can add unlimited staff per team."}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block">{isRTL ? "الموظف" : "Staff Member"}</label>
              <select value={staffForm.userId} onChange={e => setStaffForm(p => ({ ...p, userId: e.target.value }))} className={nativeSelectCls}>
                <option value="" disabled>{isRTL ? "اختر موظفاً..." : "Choose a staff member..."}</option>
                {(allUsers as any[] | undefined)?.filter((u: any) => u.role !== "player" && u.role !== "parent").map((u: any) => (
                  <option key={u.id} value={u.id.toString()}>{u.name || u.email} ({u.role})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{isRTL ? "الدور" : "Role"}</label>
              <select value={staffForm.role} onChange={e => setStaffForm(p => ({ ...p, role: e.target.value, customRole: "" }))} className={nativeSelectCls}>
                {STAFF_ROLE_GROUPS.map(g => (
                  <optgroup key={g.group} label={isRTL ? g.groupAr : g.group}>
                    {g.roles.map(r => <option key={r.value} value={r.value}>{isRTL ? r.ar : r.en}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            {staffForm.role === "custom" && (
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isRTL ? "اسم الدور المخصص" : "Custom Role Name"} *</label>
                <input
                  type="text"
                  value={staffForm.customRole}
                  onChange={e => setStaffForm(p => ({ ...p, customRole: e.target.value }))}
                  placeholder={isRTL ? "مثال: مدرب الحراس" : "e.g. Set Piece Coach, Rehab Specialist..."}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  maxLength={100}
                />
              </div>
            )}
            <div>
              <label className="text-sm font-medium mb-1.5 block">{isRTL ? "ملاحظات (اختياري)" : "Notes (optional)"}</label>
              <textarea
                value={staffForm.notes}
                onChange={e => setStaffForm(p => ({ ...p, notes: e.target.value }))}
                placeholder={isRTL ? "أي معلومات إضافية..." : "Any additional information about this assignment..."}
                className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none h-16"
                maxLength={500}
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPrimaryStaff" checked={staffForm.isPrimary} onChange={e => setStaffForm(p => ({ ...p, isPrimary: e.target.checked }))} className="h-4 w-4 rounded border-gray-300" />
              <label htmlFor="isPrimaryStaff" className="text-sm font-medium cursor-pointer">{isRTL ? "مسؤول رئيسي" : "Mark as primary / head of department"}</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowAssignStaffDialog(false); setStaffForm({ userId: "", role: "assistant_coach", customRole: "", notes: "", isPrimary: false }); }}>{isRTL ? "إلغاء" : "Cancel"}</Button>
            <Button
              onClick={() => {
                if (!staffForm.userId) return;
                if (staffForm.role === "custom" && !staffForm.customRole.trim()) {
                  toast({ title: isRTL ? "اكتب اسم الدور" : "Please enter a custom role name", variant: "destructive" });
                  return;
                }
                assignStaff.mutate({
                  teamId: teamId!,
                  userId: parseInt(staffForm.userId),
                  role: staffForm.role as any,
                  customRole: staffForm.customRole || undefined,
                  notes: staffForm.notes || undefined,
                  isPrimary: staffForm.isPrimary,
                });
              }}
              disabled={!staffForm.userId || assignStaff.isPending}
              className="bg-red-700 hover:bg-red-600 text-white"
            >
              {assignStaff.isPending ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-1" />}
              {isRTL ? "تعيين" : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
