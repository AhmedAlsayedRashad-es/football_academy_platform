import { useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayoutSkeleton } from '@/components/DashboardLayoutSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import {
  Users2, UserCog, Trophy, Shield, ArrowLeft, Search,
  Loader2, Star, Mail, Building2, AlertCircle, UserX, Filter
} from 'lucide-react';

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
const ALL_ROLES = STAFF_ROLE_GROUPS.flatMap(g => g.roles);
const TECHNICAL_VALUES = new Set(STAFF_ROLE_GROUPS[0].roles.map(r => r.value));
const MEDICAL_VALUES = new Set(STAFF_ROLE_GROUPS[1].roles.map(r => r.value));
const ADMIN_VALUES = new Set(STAFF_ROLE_GROUPS[2].roles.map(r => r.value));

function getRoleInfo(role: string) {
  return ALL_ROLES.find(r => r.value === role) ?? { en: role, ar: role, color: 'bg-muted text-muted-foreground border-border' };
}
function getInitials(name: string | null | undefined) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function getCategoryForRole(role: string): string {
  if (TECHNICAL_VALUES.has(role)) return 'technical';
  if (MEDICAL_VALUES.has(role)) return 'medical';
  if (ADMIN_VALUES.has(role)) return 'admin';
  return 'admin';
}

const AVATAR_COLORS = [
  'bg-red-500/10 text-red-600 border-red-200',
  'bg-blue-500/10 text-blue-600 border-blue-200',
  'bg-green-500/10 text-green-600 border-green-200',
  'bg-purple-500/10 text-purple-600 border-purple-200',
  'bg-orange-500/10 text-orange-600 border-orange-200',
  'bg-teal-500/10 text-teal-700 border-teal-200',
  'bg-indigo-500/10 text-indigo-600 border-indigo-200',
];
function avatarColor(name: string | null | undefined) {
  if (!name) return AVATAR_COLORS[0];
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function StaffDirectory() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterTeam, setFilterTeam] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const { data: assignments, isLoading } = trpc.teams.getAllCoachAssignments.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();

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
    const name = (a.coachName ?? '').toLowerCase();
    const email = (a.coachEmail ?? '').toLowerCase();
    const teamName = (a.teamName ?? '').toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchSearch = !searchTerm || name.includes(search) || email.includes(search) || teamName.includes(search);
    const matchTeam = filterTeam === 'all' || String(a.teamId) === filterTeam;
    const category = getCategoryForRole(a.role ?? '');
    const matchCategory = filterCategory === 'all' || category === filterCategory;
    return matchSearch && matchTeam && matchCategory;
  });

  // Group by unique staff member (coachUserId), collecting all their teams
  const byStaff = useMemo(() => {
    const map = new Map<number, { name: string; email: string; assignments: typeof filtered }>();
    filtered.forEach(a => {
      const id = a.coachUserId;
      if (!map.has(id)) {
        map.set(id, { name: a.coachName ?? a.coachEmail ?? `User #${id}`, email: a.coachEmail ?? '', assignments: [] });
      }
      map.get(id)!.assignments.push(a);
    });
    return Array.from(map.entries()).map(([id, v]) => ({ id, ...v }));
  }, [filtered]);

  const totalAssignments = assignments?.length ?? 0;
  const uniqueStaff = new Set(assignments?.map(a => a.coachUserId)).size;
  const technicalCount = (assignments ?? []).filter(a => TECHNICAL_VALUES.has(a.role ?? '')).length;
  const medicalCount = (assignments ?? []).filter(a => MEDICAL_VALUES.has(a.role ?? '')).length;
  const adminCount = (assignments ?? []).filter(a => ADMIN_VALUES.has(a.role ?? '')).length;

  return (
    <>
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <button
              onClick={() => navigate('/admin/staff-management')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-3"
            >
              <ArrowLeft size={16} className={isRTL ? 'rotate-180' : ''} />
              {isRTL ? 'إدارة الجهاز الفني' : 'Staff Management'}
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users2 className="h-8 w-8 text-blue-500" />
              {isRTL ? 'دليل الجهاز الفني والإداري' : 'Staff Directory'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL
                ? 'عرض شامل لجميع أعضاء الجهاز الفني والطبي والإداري عبر جميع الفرق'
                : 'Comprehensive view of all technical, medical, and administrative staff across all teams'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              {isRTL ? 'بطاقات' : 'Cards'}
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              {isRTL ? 'جدول' : 'Table'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { icon: Users2, color: 'text-blue-500', bg: 'bg-blue-500/10', value: uniqueStaff, label: isRTL ? 'إجمالي الأفراد' : 'Total Staff' },
            { icon: UserCog, color: 'text-muted-foreground', bg: 'bg-gray-500/10', value: totalAssignments, label: isRTL ? 'التعيينات' : 'Assignments' },
            { icon: Trophy, color: 'text-orange-700 dark:text-orange-500', bg: 'bg-orange-500/10', value: technicalCount, label: isRTL ? 'الجهاز الفني' : 'Technical' },
            { icon: Shield, color: 'text-teal-700 dark:text-teal-500', bg: 'bg-teal-500/10', value: medicalCount, label: isRTL ? 'الجهاز الطبي' : 'Medical' },
            { icon: Building2, color: 'text-muted-foreground', bg: 'bg-slate-500/10', value: adminCount, label: isRTL ? 'الجهاز الإداري' : 'Administrative' },
          ].map(({ icon: Icon, color, bg, value, label }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
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
                  placeholder={isRTL ? 'ابحث بالاسم أو البريد أو الفريق...' : 'Search by name, email, or team...'}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-52">
                  <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder={isRTL ? 'كل الفئات' : 'All Categories'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'كل الفئات' : 'All Categories'}</SelectItem>
                  <SelectItem value="technical">{isRTL ? 'الجهاز الفني' : 'Technical Staff'}</SelectItem>
                  <SelectItem value="medical">{isRTL ? 'الجهاز الطبي' : 'Medical Staff'}</SelectItem>
                  <SelectItem value="admin">{isRTL ? 'الجهاز الإداري' : 'Administrative Staff'}</SelectItem>
                </SelectContent>
              </Select>
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
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? `عرض ${byStaff.length} فرد (${filtered.length} تعيين)`
              : `Showing ${byStaff.length} staff member${byStaff.length !== 1 ? 's' : ''} (${filtered.length} assignment${filtered.length !== 1 ? 's' : ''})`}
          </p>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            {isRTL ? 'جاري التحميل...' : 'Loading staff directory...'}
          </div>
        ) : byStaff.length === 0 ? (
          <Card>
            <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
              <UserX className="h-12 w-12 text-muted-foreground/40" />
              <div>
                <p className="font-medium text-muted-foreground">{isRTL ? 'لا يوجد نتائج' : 'No staff found'}</p>
                <p className="text-sm text-muted-foreground mt-1">{isRTL ? 'جرب تغيير معايير البحث' : 'Try adjusting your search or filters'}</p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'cards' ? (
          /* Card View — grouped by staff member */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {byStaff.map(({ id, name, email, assignments: staffAssignments }) => {
              const aColor = avatarColor(name);
              const primaryAssignment = staffAssignments.find(a => a.isPrimary) ?? staffAssignments[0];
              const primaryRoleInfo = getRoleInfo(primaryAssignment?.role ?? '');
              const primaryDisplayRole = primaryAssignment?.role === 'custom' && (primaryAssignment as any).customRole
                ? (primaryAssignment as any).customRole
                : (isRTL ? primaryRoleInfo.ar : primaryRoleInfo.en);
              return (
                <Card key={id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg border-2 shrink-0 ${aColor}`}>
                        {getInitials(name)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-base flex items-center gap-1.5 flex-wrap">
                          <span className="truncate">{name}</span>
                          {primaryAssignment?.isPrimary && <Star className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-500 fill-yellow-500 shrink-0" />}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{email}</span>
                        </div>
                        <div className="mt-2">
                          <Badge variant="outline" className={`text-xs ${primaryRoleInfo.color}`}>
                            {primaryDisplayRole}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Team assignments */}
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {isRTL ? 'الفرق' : 'Teams'} ({staffAssignments.length})
                      </p>
                      {staffAssignments.map((a, idx) => {
                        const rInfo = getRoleInfo(a.role ?? '');
                        const dRole = a.role === 'custom' && (a as any).customRole
                          ? (a as any).customRole
                          : (isRTL ? rInfo.ar : rInfo.en);
                        return (
                          <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border">
                            <div className="flex items-center gap-2 min-w-0">
                              {a.teamType === 'main'
                                ? <Trophy className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-500 shrink-0" />
                                : <Shield className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                              <div className="min-w-0">
                                <div className="text-xs font-medium truncate">{a.teamName ?? `Team #${a.teamId}`}</div>
                                <div className="text-xs text-muted-foreground">{a.ageGroup}</div>
                              </div>
                            </div>
                            <Badge variant="outline" className={`text-xs shrink-0 ml-2 ${rInfo.color}`}>
                              {dRole}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>

                    {/* Notes */}
                    {staffAssignments.some(a => (a as any).notes) && (
                      <div className="mt-3 text-xs text-muted-foreground italic border-t pt-2">
                        {staffAssignments.filter(a => (a as any).notes).map((a, i) => (
                          <div key={i}>{(a as any).notes}</div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isRTL ? 'قائمة الجهاز الفني والإداري' : 'Staff List'}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{isRTL ? 'الاسم' : 'Name'}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{isRTL ? 'الدور' : 'Role'}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{isRTL ? 'الفريق' : 'Team'}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{isRTL ? 'النوع' : 'Type'}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{isRTL ? 'الفئة' : 'Age Group'}</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">{isRTL ? 'ملاحظات' : 'Notes'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((a, idx) => {
                      const rInfo = getRoleInfo(a.role ?? '');
                      const dRole = a.role === 'custom' && (a as any).customRole
                        ? (a as any).customRole
                        : (isRTL ? rInfo.ar : rInfo.en);
                      return (
                        <tr key={idx} className="border-b hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs border shrink-0 ${avatarColor(a.coachName)}`}>
                                {getInitials(a.coachName)}
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium truncate flex items-center gap-1">
                                  {a.coachName ?? a.coachEmail ?? `User #${a.coachUserId}`}
                                  {a.isPrimary && <Star className="h-3 w-3 text-yellow-700 dark:text-yellow-500 fill-yellow-500 shrink-0" />}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">{a.coachEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className={`text-xs ${rInfo.color}`}>{dRole}</Badge>
                          </td>
                          <td className="px-4 py-3 font-medium">{a.teamName ?? `Team #${a.teamId}`}</td>
                          <td className="px-4 py-3">
                            <Badge variant={a.teamType === 'main' ? 'destructive' : 'secondary'} className="text-xs">
                              {a.teamType === 'main' ? (isRTL ? 'رئيسي' : 'Main') : (isRTL ? 'أكاديمية' : 'Academy')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{a.ageGroup ?? '—'}</td>
                          <td className="px-4 py-3 text-muted-foreground text-xs italic max-w-[200px] truncate">
                            {(a as any).notes ?? '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
