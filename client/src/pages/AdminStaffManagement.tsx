import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayoutSkeleton } from '@/components/DashboardLayoutSkeleton';
import { PageHelp } from '@/components/PageHelp';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import {
  Users2, UserCog, Trophy, Shield, ArrowLeft, Plus, Trash2,
  Search, Loader2, Star, Mail, Phone, Calendar, Clock,
  Building2, ChevronRight, User, MessageSquare, AlertCircle, UserX, Pencil
} from 'lucide-react';
import { toast } from 'sonner';

const STAFF_ROLE_GROUPS = [
  {
    group: 'Technical Staff', groupAr: 'الجهاز الفني',
    roles: [
      { value: 'head_coach', en: 'Head Coach', ar: 'المدرب الرئيسي', color: 'bg-red-500/10 text-red-600 border-red-200' },
      { value: 'assistant_coach', en: 'Assistant Coach', ar: 'مدرب مساعد', color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
      { value: 'goalkeeper_coach', en: 'Goalkeeper Coach', ar: 'مدرب حراس المرمى', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
      { value: 'fitness_coach', en: 'Fitness Coach', ar: 'مدرب اللياقة البدنية', color: 'bg-green-500/10 text-green-600 border-green-200' },
      { value: 'load_trainer', en: 'Load Trainer', ar: 'مدرب الأحمال', color: 'bg-lime-500/10 text-lime-700 border-lime-200' },
      { value: 'analyst', en: 'Performance Analyst', ar: 'محلل الأداء', color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
      { value: 'video_analyst', en: 'Video Analyst', ar: 'محلل الفيديو', color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200' },
      { value: 'technical_director', en: 'Technical Director', ar: 'المدير الفني', color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
      { value: 'sporting_director', en: 'Sporting Director', ar: 'المدير الرياضي', color: 'bg-violet-500/10 text-violet-600 border-violet-200' },
      { value: 'technical', en: 'Technical Staff', ar: 'طاقم فني', color: 'bg-zinc-500/10 text-zinc-600 border-zinc-200' },
    ]
  },
  {
    group: 'Medical Staff', groupAr: 'الجهاز الطبي',
    roles: [
      { value: 'team_doctor', en: 'Team Doctor', ar: 'طبيب الفريق', color: 'bg-teal-500/10 text-teal-700 border-teal-200' },
      { value: 'physiotherapist', en: 'Physiotherapist', ar: 'معالج فيزيائي', color: 'bg-cyan-500/10 text-cyan-700 border-cyan-200' },
      { value: 'nutritionist', en: 'Nutritionist', ar: 'أخصائي تغذية', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200' },
      { value: 'psychologist', en: 'Sports Psychologist', ar: 'أخصائي نفسي رياضي', color: 'bg-sky-500/10 text-sky-700 border-sky-200' },
      { value: 'medical', en: 'Medical Staff', ar: 'طاقم طبي', color: 'bg-teal-500/10 text-teal-600 border-teal-200' },
    ]
  },
  {
    group: 'Administrative Staff', groupAr: 'الجهاز الإداري',
    roles: [
      { value: 'team_manager', en: 'Team Manager', ar: 'مدير الفريق', color: 'bg-slate-500/10 text-slate-700 border-slate-200' },
      { value: 'kit_manager', en: 'Kit Manager', ar: 'مدير المعدات', color: 'bg-stone-500/10 text-stone-700 border-stone-200' },
      { value: 'admin', en: 'Admin / Manager', ar: 'مدير إداري', color: 'bg-gray-500/10 text-gray-600 border-gray-200' },
      { value: 'custom', en: 'Custom Role', ar: 'دور مخصص', color: 'bg-pink-500/10 text-pink-600 border-pink-200' },
    ]
  },
];
const STAFF_ROLES = STAFF_ROLE_GROUPS.flatMap(g => g.roles);

function getRoleInfo(role: string) {
  return STAFF_ROLES.find(r => r.value === role) ?? { en: role, ar: role, color: 'bg-muted text-muted-foreground border-border' };
}

function getInitials(name: string | null | undefined) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr: string | Date | null | undefined) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Staff Profile Drawer
function StaffProfileDrawer({
  staffUserId,
  staffName,
  staffEmail,
  open,
  onClose,
  isRTL,
  allAssignments,
}: {
  staffUserId: number | null;
  staffName: string;
  staffEmail: string;
  open: boolean;
  onClose: () => void;
  isRTL: boolean;
  allAssignments: any[];
}) {
  const { data: userProfile, isLoading: profileLoading } = trpc.users.getById.useQuery(
    { id: staffUserId! },
    { enabled: !!staffUserId && open }
  );
  const { data: staffTeams, isLoading: teamsLoading } = trpc.teams.getStaffTeams.useQuery(
    { userId: staffUserId! },
    { enabled: !!staffUserId && open }
  );

  const myAssignments = allAssignments.filter(a => a.coachUserId === staffUserId);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side={isRTL ? 'left' : 'right'} className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-bold text-lg border-2 border-purple-200 shrink-0">
              {getInitials(staffName)}
            </div>
            <div className="min-w-0">
              <div className="text-lg font-bold truncate">{staffName || '—'}</div>
              <div className="text-sm text-muted-foreground font-normal truncate">{staffEmail}</div>
            </div>
          </SheetTitle>
          <SheetDescription>
            {isRTL ? 'الملف الشخصي وتعيينات الفرق' : 'Staff profile and team assignments'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pt-2">
          {/* Contact Info */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {isRTL ? 'معلومات الاتصال' : 'Contact Information'}
            </h3>
            {profileLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isRTL ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{userProfile?.email || staffEmail}</span>
                </div>
                {userProfile?.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span>{userProfile.phone}</span>
                  </div>
                )}
                {userProfile?.whatsappPhone && (
                  <div className="flex items-center gap-3 text-sm">
                    <MessageSquare className="h-4 w-4 text-green-700 dark:text-green-500 shrink-0" />
                    <span>{userProfile.whatsappPhone}</span>
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200 bg-green-50">WhatsApp</Badge>
                  </div>
                )}
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="capitalize">{userProfile?.role?.replace(/_/g, ' ') || '—'}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{isRTL ? 'انضم في:' : 'Joined:'}</span>
                  <span>{formatDate(userProfile?.createdAt)}</span>
                </div>
                {userProfile?.lastSignedIn && (
                  <div className="flex items-center gap-3 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground">{isRTL ? 'آخر دخول:' : 'Last seen:'}</span>
                    <span>{formatDate(userProfile.lastSignedIn)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Current Assignments */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {isRTL ? 'تعيينات الفرق الحالية' : 'Current Team Assignments'}
              <span className="ml-2 font-normal">({myAssignments.length})</span>
            </h3>
            {myAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {isRTL ? 'لا توجد تعيينات حالية' : 'No current team assignments'}
              </p>
            ) : (
              <div className="space-y-2">
                {myAssignments.map((a) => {
                  const roleInfo = getRoleInfo(a.role);
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{a.teamName || `Team #${a.teamId}`}</div>
                          <div className="text-xs text-muted-foreground">{a.ageGroup} · {a.teamType === 'main' ? (isRTL ? 'رئيسي' : 'Main') : (isRTL ? 'أكاديمية' : 'Academy')}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {a.isPrimary && <Star className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-500 fill-yellow-500" />}
                        <Badge variant="outline" className={`text-xs ${roleInfo.color}`}>
                          {isRTL ? roleInfo.ar : roleInfo.en}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Separator />

          {/* Role History */}
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {isRTL ? 'سجل الأدوار' : 'Role History'}
            </h3>
            {teamsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isRTL ? 'جاري التحميل...' : 'Loading...'}
              </div>
            ) : !staffTeams || staffTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">
                {isRTL ? 'لا يوجد سجل أدوار' : 'No role history available'}
              </p>
            ) : (
              <div className="space-y-2">
                {(staffTeams as any[]).map((t, idx) => {
                  const roleInfo = getRoleInfo(t.role);
                  return (
                    <div key={idx} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${t.isPrimary ? 'bg-yellow-500' : 'bg-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.teamName}</div>
                        <div className="text-xs text-muted-foreground">{isRTL ? roleInfo.ar : roleInfo.en}</div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {userProfile && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {isRTL ? 'حالة الحساب' : 'Account Status'}
                </h3>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${userProfile.accountStatus === 'approved' ? 'bg-green-500' : userProfile.accountStatus === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  <span className="text-sm capitalize">{userProfile.accountStatus}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function AdminStaffManagement() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const utils = trpc.useUtils();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [assignForm, setAssignForm] = useState({ teamId: '', userId: '', role: 'assistant_coach', customRole: '', notes: '', isPrimary: false });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editForm, setEditForm] = useState<{ assignmentId: number; role: string; customRole: string; notes: string; isPrimary: boolean; name: string } | null>(null);
  function openEditDialog(a: any) {
    setEditForm({ assignmentId: a.id, role: a.role ?? 'assistant_coach', customRole: a.customRole ?? '', notes: a.notes ?? '', isPrimary: !!a.isPrimary, name: a.coachName ?? a.coachEmail ?? '' });
    setShowEditDialog(true);
  }
  const [profileDrawer, setProfileDrawer] = useState<{ open: boolean; userId: number | null; name: string; email: string }>({
    open: false, userId: null, name: '', email: '',
  });

  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: assignments, isLoading: assignmentsLoading } = trpc.teams.getAllCoachAssignments.useQuery();
  const { data: availableStaff, isLoading: staffLoading } = trpc.teams.getAvailableCoaches.useQuery();

  const assignMutation = trpc.teams.assignCoach.useMutation({
    onSuccess: () => {
      utils.teams.getAllCoachAssignments.invalidate();
      setShowAssignDialog(false);
      setAssignForm({ teamId: '', userId: '', role: 'assistant_coach', customRole: '', notes: '', isPrimary: false });
      toast.success(isRTL ? 'تم تعيين الموظف بنجاح' : 'Staff member assigned successfully');
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMutation = trpc.teams.removeCoach.useMutation({
    onSuccess: () => {
      utils.teams.getAllCoachAssignments.invalidate();
      toast.success(isRTL ? 'تم إزالة الموظف' : 'Staff member removed');
    },
    onError: (err) => toast.error(err.message),
  });
  const updateRoleMutation = trpc.teams.updateCoachRole.useMutation({
    onSuccess: () => {
      utils.teams.getAllCoachAssignments.invalidate();
      setShowEditDialog(false);
      toast.success(isRTL ? 'تم تحديث الدور' : 'Role updated successfully');
    },
    onError: (err) => toast.error(err.message),
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) { navigate('/'); return null; }
  if (user.role !== 'admin') {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <Card className="w-96">
            <CardContent className="pt-6 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
              <p className="text-muted-foreground">{isRTL ? 'هذه الصفحة للمسؤولين فقط' : 'Admin access required'}</p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const filtered = (assignments ?? []).filter(a => {
    const matchesSearch = !searchTerm ||
      (a.coachName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.teamName ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = filterTeam === 'all' || String(a.teamId) === filterTeam;
    const matchesRole = filterRole === 'all' || a.role === filterRole;
    return matchesSearch && matchesTeam && matchesRole;
  });

  const byTeam = filtered.reduce((acc, a) => {
    const key = String(a.teamId);
    if (!acc[key]) acc[key] = { teamName: a.teamName, teamType: a.teamType, ageGroup: a.ageGroup, members: [] };
    acc[key].members.push(a);
    return acc;
  }, {} as Record<string, { teamName: string | null; teamType: string | null; ageGroup: string | null; members: typeof filtered }>);

  const totalStaff = assignments?.length ?? 0;
  const uniqueStaff = new Set(assignments?.map(a => a.coachUserId)).size;
  const mainTeamStaff = assignments?.filter(a => a.teamType === 'main').length ?? 0;
  const academyStaff = assignments?.filter(a => a.teamType === 'academy').length ?? 0;

  return (
    <>
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/admin/team-management')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-3"
            >
              <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} />
              {isRTL ? 'إدارة الفرق' : 'Team Management'}
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <UserCog className="h-8 w-8 text-purple-500" />
              {isRTL ? 'إدارة الجهاز الفني والإداري' : 'Staff Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL ? 'عرض وإدارة جميع تعيينات الجهاز الفني والإداري للفرق' : 'View and manage all staff assignments across Main Teams and Academy Teams'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/admin/staff-directory')} className="gap-2">
              <Users2 className="h-4 w-4" />
              {isRTL ? 'دليل الجهاز' : 'Staff Directory'}
            </Button>
            <Button onClick={() => setShowAssignDialog(true)} className="gap-2 bg-purple-600 hover:bg-purple-700 text-white">
              <Plus className="h-4 w-4" />
              {isRTL ? 'تعيين موظف' : 'Assign Staff'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Users2, color: 'text-purple-500', bg: 'bg-purple-500/10', value: totalStaff, label: isRTL ? 'إجمالي التعيينات' : 'Total Assignments' },
            { icon: UserCog, color: 'text-blue-500', bg: 'bg-blue-500/10', value: uniqueStaff, label: isRTL ? 'أفراد الجهاز' : 'Unique Staff' },
            { icon: Trophy, color: 'text-yellow-700 dark:text-yellow-500', bg: 'bg-yellow-500/10', value: mainTeamStaff, label: isRTL ? 'الفريق الأول' : 'Main Team Staff' },
            { icon: Shield, color: 'text-green-700 dark:text-green-500', bg: 'bg-green-500/10', value: academyStaff, label: isRTL ? 'الأكاديمية' : 'Academy Staff' },
          ].map(({ icon: Icon, color, bg, value, label }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isRTL ? 'ابحث بالاسم أو الفريق...' : 'Search by staff name or team...'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterTeam} onValueChange={setFilterTeam}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={isRTL ? 'كل الفرق' : 'All Teams'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'كل الفرق' : 'All Teams'}</SelectItem>
                  {teams?.map(t => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder={isRTL ? 'كل الأدوار' : 'All Roles'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'كل الأدوار' : 'All Roles'}</SelectItem>
                  {STAFF_ROLES.map(r => (
                    <SelectItem key={r.value} value={r.value}>{isRTL ? r.ar : r.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Staff list grouped by team */}
        {assignmentsLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            {isRTL ? 'جاري التحميل...' : 'Loading staff assignments...'}
          </div>
        ) : Object.keys(byTeam).length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <UserX className="h-12 w-12 text-muted-foreground/40" />
              <div>
                <p className="font-medium text-muted-foreground">{isRTL ? 'لا يوجد جهاز فني مُعيَّن بعد' : 'No Staff Assigned Yet'}</p>
                <p className="text-sm text-muted-foreground mt-1">{isRTL ? 'ابدأ بتعيين موظفين للفرق' : 'Start by assigning staff members to teams'}</p>
              </div>
              <Button onClick={() => setShowAssignDialog(true)} className="bg-purple-600 hover:bg-purple-700 text-white gap-2">
                <Plus className="h-4 w-4" />
                {isRTL ? 'تعيين موظف' : 'Assign Staff'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(byTeam).map(([teamId, group]) => (
              <Card key={teamId}>
                <CardHeader className="pb-3 pt-4 px-5">
                  <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                    {group.teamType === 'main' ? <Trophy className="h-4 w-4 text-yellow-700 dark:text-yellow-500" /> : <Shield className="h-4 w-4 text-blue-500" />}
                    <span>{group.teamName ?? `Team #${teamId}`}</span>
                    <Badge variant="outline" className="text-xs">{group.ageGroup}</Badge>
                    <Badge variant={group.teamType === 'main' ? 'destructive' : 'secondary'} className="text-xs">
                      {group.teamType === 'main' ? (isRTL ? 'رئيسي' : 'Main') : (isRTL ? 'أكاديمية' : 'Academy')}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-normal ml-auto">
                      {group.members.length} {isRTL ? 'فرد' : 'member(s)'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-5 pb-4">
                  <div className="space-y-2">
                    {group.members.map(a => {
                      const roleInfo = getRoleInfo(a.role ?? '');
                      const displayRole = a.role === 'custom' && (a as any).customRole
                        ? (a as any).customRole
                        : (isRTL ? roleInfo.ar : roleInfo.en);
                      return (
                        <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                          <button
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            onClick={() => setProfileDrawer({ open: true, userId: a.coachUserId, name: a.coachName ?? '', email: a.coachEmail ?? '' })}
                          >
                            {(a as any).coachAvatar
                              ? <img src={(a as any).coachAvatar} alt={a.coachName ?? ''} className="w-9 h-9 rounded-full object-contain border-2 border-purple-200 shrink-0" />
                              : <div className="w-9 h-9 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 font-semibold text-sm border border-purple-200 shrink-0">{getInitials(a.coachName)}</div>
                            }
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate flex items-center gap-1.5">
                                {a.coachName ?? a.coachEmail ?? `User #${a.coachUserId}`}
                                {a.isPrimary && <Star className="h-3 w-3 text-yellow-700 dark:text-yellow-500 fill-yellow-500 shrink-0" />}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">{a.coachEmail}</div>
                              {(a as any).notes && <div className="text-xs text-muted-foreground/70 truncate italic">{(a as any).notes}</div>}
                            </div>
                          </button>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="outline" className={`text-xs ${roleInfo.color}`}>
                              {displayRole}
                            </Badge>
                            <button
                              onClick={() => openEditDialog(a)}
                              className="p-1.5 rounded text-muted-foreground hover:text-blue-600 dark:hover:text-blue-500 hover:bg-blue-50 transition-colors"
                              title={isRTL ? 'تعديل الدور' : 'Edit role'}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => removeMutation.mutate({ teamId: Number(teamId), coachUserId: a.coachUserId })}
                              disabled={removeMutation.isPending}
                              className="p-1.5 rounded text-muted-foreground hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Assign Staff Dialog */}
        <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5 text-purple-500" />
                {isRTL ? 'تعيين موظف للفريق' : 'Assign Staff to Team'}
              </DialogTitle>
              <DialogDescription>
                {isRTL ? 'اختر الفريق والموظف والدور' : 'Select the team, staff member, and their role'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'الفريق' : 'Team'}</Label>
                <Select value={assignForm.teamId} onValueChange={v => setAssignForm(f => ({ ...f, teamId: v }))}>
                  <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر الفريق' : 'Select team'} /></SelectTrigger>
                  <SelectContent>
                    {teams?.map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>
                        {t.name} ({t.ageGroup}) — {t.teamType === 'main' ? (isRTL ? 'رئيسي' : 'Main') : (isRTL ? 'أكاديمية' : 'Academy')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? 'الموظف' : 'Staff Member'}</Label>
                <Select value={assignForm.userId} onValueChange={v => setAssignForm(f => ({ ...f, userId: v }))}>
                  <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر الموظف' : 'Select staff member'} /></SelectTrigger>
                  <SelectContent>
                    {staffLoading ? (
                      <SelectItem value="loading" disabled>Loading...</SelectItem>
                    ) : availableStaff?.map(s => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name ?? s.email} ({s.role})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{isRTL ? 'الدور' : 'Role'}</Label>
                <select
                  value={assignForm.role}
                  onChange={e => setAssignForm(f => ({ ...f, role: e.target.value, customRole: '' }))}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {STAFF_ROLE_GROUPS.map(g => (
                    <optgroup key={g.group} label={isRTL ? g.groupAr : g.group}>
                      {g.roles.map(r => <option key={r.value} value={r.value}>{isRTL ? r.ar : r.en}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              {assignForm.role === 'custom' && (
                <div className="space-y-2">
                  <Label>{isRTL ? 'اسم الدور المخصص' : 'Custom Role Name'} *</Label>
                  <input
                    type="text"
                    value={assignForm.customRole}
                    onChange={e => setAssignForm(f => ({ ...f, customRole: e.target.value }))}
                    placeholder={isRTL ? 'مثال: مدرب الركلات الثابتة' : 'e.g. Set Piece Coach, Rehab Specialist...'}
                    className="w-full h-10 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    maxLength={100}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>{isRTL ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</Label>
                <textarea
                  value={assignForm.notes}
                  onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder={isRTL ? 'أي معلومات إضافية...' : 'Any additional information...'}
                  className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none h-16"
                  maxLength={500}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'المسؤول الرئيسي' : 'Primary / Head Role'}</Label>
                <Switch checked={assignForm.isPrimary} onCheckedChange={v => setAssignForm(f => ({ ...f, isPrimary: v }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAssignDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
              <Button
                onClick={() => {
                  if (!assignForm.teamId || !assignForm.userId) {
                    toast.error(isRTL ? 'يرجى اختيار الفريق والموظف' : 'Please select team and staff member');
                    return;
                  }
                  if (assignForm.role === 'custom' && !assignForm.customRole.trim()) {
                    toast.error(isRTL ? 'اكتب اسم الدور المخصص' : 'Please enter a custom role name');
                    return;
                  }
                  assignMutation.mutate({ teamId: Number(assignForm.teamId), coachUserId: Number(assignForm.userId), role: assignForm.role as any, customRole: assignForm.customRole || undefined, notes: assignForm.notes || undefined, isPrimary: assignForm.isPrimary });
                }}
                disabled={assignMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isRTL ? 'تعيين' : 'Assign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Staff Profile Drawer */}
        <StaffProfileDrawer
          staffUserId={profileDrawer.userId}
          staffName={profileDrawer.name}
          staffEmail={profileDrawer.email}
          open={profileDrawer.open}
          onClose={() => setProfileDrawer(p => ({ ...p, open: false }))}
          isRTL={isRTL}
          allAssignments={assignments ?? []}
        />

        {/* Edit Role Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5" />{isRTL ? 'تعديل دور الموظف' : 'Edit Staff Role'}</DialogTitle>
              <DialogDescription>{editForm?.name}</DialogDescription>
            </DialogHeader>
            {editForm && (
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label>{isRTL ? 'الدور' : 'Role'}</Label>
                  <select
                    value={editForm.role}
                    onChange={e => setEditForm(f => f ? { ...f, role: e.target.value, customRole: '' } : f)}
                    className="w-full h-10 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {STAFF_ROLE_GROUPS.map(g => (
                      <optgroup key={g.group} label={isRTL ? g.groupAr : g.group}>
                        {g.roles.map(r => <option key={r.value} value={r.value}>{isRTL ? r.ar : r.en}</option>)}
                      </optgroup>
                    ))}
                  </select>
                </div>
                {editForm.role === 'custom' && (
                  <div className="space-y-2">
                    <Label>{isRTL ? 'اسم الدور المخصص' : 'Custom Role Name'} *</Label>
                    <input
                      type="text"
                      value={editForm.customRole}
                      onChange={e => setEditForm(f => f ? { ...f, customRole: e.target.value } : f)}
                      placeholder={isRTL ? 'مثال: مدرب الركلات الثابتة' : 'e.g. Set Piece Coach'}
                      className="w-full h-10 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      maxLength={100}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>{isRTL ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</Label>
                  <textarea
                    value={editForm.notes}
                    onChange={e => setEditForm(f => f ? { ...f, notes: e.target.value } : f)}
                    placeholder={isRTL ? 'أي معلومات إضافية...' : 'Any additional information...'}
                    className="w-full px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring resize-none h-16"
                    maxLength={500}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>{isRTL ? 'المسؤول الرئيسي' : 'Primary / Head Role'}</Label>
                  <Switch checked={editForm.isPrimary} onCheckedChange={v => setEditForm(f => f ? { ...f, isPrimary: v } : f)} />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
              <Button
                onClick={() => {
                  if (!editForm) return;
                  if (editForm.role === 'custom' && !editForm.customRole.trim()) {
                    toast.error(isRTL ? 'اكتب اسم الدور المخصص' : 'Enter custom role name');
                    return;
                  }
                  updateRoleMutation.mutate({ assignmentId: editForm.assignmentId, role: editForm.role as any, customRole: editForm.customRole || undefined, notes: editForm.notes || undefined, isPrimary: editForm.isPrimary });
                }}
                disabled={updateRoleMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateRoleMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <PageHelp pageKey="staff-management" />
    </>
  );
}
