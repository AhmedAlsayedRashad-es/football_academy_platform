import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageHelp } from '@/components/PageHelp';
import { DashboardLayoutSkeleton } from '@/components/DashboardLayoutSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Native select used inside dialogs to avoid z-index issues
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import {Users,
  UserPlus,
  Trash2,
  Shield,
  Edit,
  Loader2,
  CheckCircle2,
  AlertCircle, ArrowLeft} from 'lucide-react';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';

const roleLabels: Record<string, { en: string; ar: string }> = {
  head_coach: { en: 'Head Coach', ar: 'المدرب الرئيسي' },
  assistant_coach: { en: 'Assistant Coach', ar: 'مدرب مساعد' },
  goalkeeper_coach: { en: 'Goalkeeper Coach', ar: 'مدرب حراس المرمى' },
  fitness_coach: { en: 'Fitness Coach', ar: 'مدرب اللياقة' },
  analyst: { en: 'Analyst', ar: 'محلل' },
  medical: { en: 'Medical Staff', ar: 'الطاقم الطبي' },
  admin: { en: 'Admin', ar: 'إداري' },
  technical: { en: 'Technical Director', ar: 'المدير الفني' },
};

function NativeSelect({ value, onChange, children, placeholder, className = '' }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; placeholder?: string; className?: string;
}) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      className={`w-full h-10 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${className}`}>
      {placeholder && <option value="" disabled>{placeholder}</option>}
      {children}
    </select>
  );
}

const teamTypeLabels: Record<string, { en: string; ar: string }> = {
  main: { en: 'Main Team', ar: 'الفريق الأول' },
  academy: { en: 'Academy Team', ar: 'فريق الأكاديمية' },
};

export default function AdminCoachAssignment() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('assistant_coach');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<any>(null);

  const utils = trpc.useUtils();

  const { data: teams, isLoading: teamsLoading } = trpc.teams.getAll.useQuery();
  const { data: coaches, isLoading: coachesLoading } = trpc.teams.getAvailableCoaches.useQuery();
  const { data: assignments, isLoading: assignmentsLoading } = trpc.teams.getAllCoachAssignments.useQuery();

  const assignCoach = trpc.teams.assignCoach.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تعيين المدرب بنجاح' : 'Coach assigned successfully');
      utils.teams.getAllCoachAssignments.invalidate();
      setIsAssignDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const removeCoach = trpc.teams.removeCoach.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم إزالة المدرب بنجاح' : 'Coach removed successfully');
      utils.teams.getAllCoachAssignments.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateCoachRole = trpc.teams.updateCoachRole.useMutation({
    onSuccess: () => {
      toast.success(language === 'ar' ? 'تم تحديث الدور بنجاح' : 'Role updated successfully');
      utils.teams.getAllCoachAssignments.invalidate();
      setEditingAssignment(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const resetForm = () => {
    setSelectedTeam(null);
    setSelectedCoach(null);
    setSelectedRole('assistant_coach');
    setIsPrimary(false);
  };

  const handleAssignCoach = () => {
    if (!selectedTeam || !selectedCoach) {
      toast.error(language === 'ar' ? 'يرجى اختيار الفريق والمدرب' : 'Please select team and coach');
      return;
    }
    assignCoach.mutate({
      teamId: selectedTeam,
      coachUserId: selectedCoach,
      role: selectedRole as any,
      isPrimary,
    });
  };

  const handleRemoveCoach = (teamId: number, coachUserId: number) => {
    if (confirm(language === 'ar' ? 'هل أنت متأكد من إزالة هذا المدرب؟' : 'Are you sure you want to remove this coach?')) {
      removeCoach.mutate({ teamId, coachUserId });
    }
  };

  const handleUpdateRole = () => {
    if (!editingAssignment) return;
    updateCoachRole.mutate({
      assignmentId: editingAssignment.id,
      role: editingAssignment.role,
      isPrimary: editingAssignment.isPrimary,
    });
  };

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation('/');
    return null;
  }

  if (user.role !== 'admin') {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <Card className="w-96">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {language === 'ar' 
                  ? 'هذه الصفحة متاحة للمسؤولين فقط' 
                  : 'This page is only available to admins'}
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const isLoading = teamsLoading || coachesLoading || assignmentsLoading;

  // Group assignments by team
  const assignmentsByTeam = assignments?.reduce((acc, assignment) => {
    const teamId = assignment.teamId;
    if (!acc[teamId]) {
      acc[teamId] = {
        teamName: assignment.teamName,
        teamType: assignment.teamType,
        ageGroup: assignment.ageGroup,
        coaches: [],
      };
    }
    acc[teamId].coaches.push(assignment);
    return acc;
  }, {} as Record<number, { teamName: string | null; teamType: string | null; ageGroup: string | null; coaches: any[] }>);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            
            <BackButton />
<h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              {language === 'ar' ? 'تعيين المدربين' : 'Coach Assignment'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' 
                ? 'إدارة تعيين المدربين للفرق' 
                : 'Manage coach assignments to teams'}
            </p>
          </div>
          <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                {language === 'ar' ? 'تعيين مدرب' : 'Assign Coach'}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {language === 'ar' ? 'تعيين مدرب جديد' : 'Assign New Coach'}
                </DialogTitle>
                <DialogDescription>
                  {language === 'ar' 
                    ? 'اختر الفريق والمدرب والدور' 
                    : 'Select the team, coach, and role'}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الفريق' : 'Team'}</Label>
                  <NativeSelect value={selectedTeam?.toString() || ''} onChange={v => setSelectedTeam(Number(v))} placeholder={language === 'ar' ? 'اختر الفريق...' : 'Select team...'}>
                    {teams?.map((team: any) => (
                      <option key={team.id} value={team.id.toString()}>
                        {team.name} ({team.ageGroup}) - {teamTypeLabels[team.teamType || 'academy'][language]}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الموظف / المدرب' : 'Staff / Coach'}</Label>
                  <NativeSelect value={selectedCoach?.toString() || ''} onChange={v => setSelectedCoach(Number(v))} placeholder={language === 'ar' ? 'اختر موظفاً...' : 'Select staff member...'}>
                    {coaches?.map((coach: any) => (
                      <option key={coach.id} value={coach.id.toString()}>
                        {coach.name || coach.email} ({coach.role})
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الدور' : 'Role'}</Label>
                  <NativeSelect value={selectedRole} onChange={setSelectedRole}>
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label[language]}</option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="flex items-center justify-between">
                  <Label>{language === 'ar' ? 'المدرب الرئيسي' : 'Primary Coach'}</Label>
                  <Switch checked={isPrimary} onCheckedChange={setIsPrimary} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </Button>
                <Button onClick={handleAssignCoach} disabled={assignCoach.isPending}>
                  {assignCoach.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {language === 'ar' ? 'تعيين' : 'Assign'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'إجمالي الفرق' : 'Total Teams'}
                  </p>
                  <p className="text-2xl font-bold">{teams?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'المدربين المتاحين' : 'Available Coaches'}
                  </p>
                  <p className="text-2xl font-bold">{coaches?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {language === 'ar' ? 'التعيينات النشطة' : 'Active Assignments'}
                  </p>
                  <p className="text-2xl font-bold">{assignments?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Teams with Assignments */}
        {!isLoading && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">
              {language === 'ar' ? 'تعيينات الفرق' : 'Team Assignments'}
            </h2>
            
            {teams?.map((team) => {
              const teamAssignments = assignmentsByTeam?.[team.id];
              return (
                <Card key={team.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {team.name}
                          <Badge variant={team.teamType === 'main' ? 'default' : 'secondary'}>
                            {teamTypeLabels[team.teamType || 'academy'][language]}
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          {team.ageGroup} - {team.description || (language === 'ar' ? 'لا يوجد وصف' : 'No description')}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {teamAssignments?.coaches && teamAssignments.coaches.length > 0 ? (
                      <div className="space-y-2">
                        {teamAssignments.coaches.map((assignment) => (
                          <div 
                            key={assignment.id} 
                            className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium">{assignment.coachName || assignment.coachEmail}</p>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {roleLabels[assignment.role]?.[language] || assignment.role}
                                  </Badge>
                                  {assignment.isPrimary && (
                                    <Badge className="text-xs bg-yellow-500">
                                      {language === 'ar' ? 'رئيسي' : 'Primary'}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setEditingAssignment(assignment)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                onClick={() => handleRemoveCoach(assignment.teamId, assignment.coachUserId)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground py-4">
                        <AlertCircle className="h-4 w-4" />
                        {language === 'ar' ? 'لم يتم تعيين مدربين لهذا الفريق' : 'No coaches assigned to this team'}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Role Dialog */}
        <Dialog open={!!editingAssignment} onOpenChange={(open) => !open && setEditingAssignment(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {language === 'ar' ? 'تعديل دور المدرب' : 'Edit Coach Role'}
              </DialogTitle>
              <DialogDescription>
                {editingAssignment?.coachName}
              </DialogDescription>
            </DialogHeader>
            {editingAssignment && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>{language === 'ar' ? 'الدور' : 'Role'}</Label>
                  <NativeSelect value={editingAssignment.role} onChange={v => setEditingAssignment({ ...editingAssignment, role: v })}>
                    {Object.entries(roleLabels).map(([key, label]) => (
                      <option key={key} value={key}>{label[language]}</option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="flex items-center justify-between">
                  <Label>{language === 'ar' ? 'المدرب الرئيسي' : 'Primary Coach'}</Label>
                  <Switch 
                    checked={editingAssignment.isPrimary} 
                    onCheckedChange={(v) => setEditingAssignment({ ...editingAssignment, isPrimary: v })}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingAssignment(null)}>
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </Button>
              <Button onClick={handleUpdateRole} disabled={updateCoachRole.isPending}>
                {updateCoachRole.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {language === 'ar' ? 'حفظ' : 'Save'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <PageHelp pageKey="coach-assignment" />
    </>
  );
}
