import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { Users, Shield, Settings as SettingsIcon, Link2, UserPlus, Building2, UserCog, Video, ArrowLeft} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


const ROLE_LABELS_EN: Record<string, string> = {
  admin: 'Administrator',
  coach: 'Coach',
  nutritionist: 'Nutritionist',
  mental_coach: 'Mental Coach',
  physical_trainer: 'Physical Trainer',
  parent: 'Parent',
  player: 'Player',
};
const ROLE_LABELS_AR: Record<string, string> = {
  admin: 'مدير',
  coach: 'مدرب',
  nutritionist: 'أخصائي تغذية',
  mental_coach: 'مدرب نفسي',
  physical_trainer: 'مدرب لياقة',
  parent: 'ولي أمر',
  player: 'لاعب',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-500',
  coach: 'bg-primary/20 text-primary',
  nutritionist: 'bg-chart-4/20 text-chart-4',
  mental_coach: 'bg-chart-3/20 text-chart-3',
  physical_trainer: 'bg-chart-2/20 text-chart-2',
  parent: 'bg-blue-500/20 text-blue-500',
  player: 'bg-muted text-muted-foreground',
};

function LinkParentDialog() {
  const { t, language } = useLanguage();
  const ROLE_LABELS = language === 'ar' ? ROLE_LABELS_AR : ROLE_LABELS_EN;
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    parentUserId: '',
    playerId: '',
    relationship: 'guardian',
    isPrimary: true,
  });

  const { data: users } = trpc.users.getAll.useQuery();
  const { data: players } = trpc.players.getAll.useQuery();
  const utils = trpc.useUtils();

  const linkParent = trpc.parentRelations.link.useMutation({
    onSuccess: () => {
      toast.success('Parent linked to player successfully');
      setOpen(false);
      utils.parentRelations.getRelations.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to link parent');
    },
  });

  const parentUsers = users?.filter(u => u.role === 'parent') || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.parentUserId || !formData.playerId) {
      toast.error('Please select both parent and player');
      return;
    }
    linkParent.mutate({
      parentUserId: parseInt(formData.parentUserId),
      playerId: parseInt(formData.playerId),
      relationship: formData.relationship,
      isPrimary: formData.isPrimary,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Link2 className="h-4 w-4 mr-2" />
          {t('settings.linkParentToPlayer')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('settings.linkParentToPlayer')}</DialogTitle>
          <DialogDescription>
            {language === 'ar' ? 'ربط حساب ولي الأمر بملف اللاعب' : 'Connect a parent account to their child\'s player profile.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'ولي الأمر' : 'Parent'}</Label>
              <Select
                value={formData.parentUserId}
                onValueChange={(value) => setFormData({ ...formData, parentUserId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent user" />
                </SelectTrigger>
                <SelectContent>
                  {parentUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name || user.email || `User ${user.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === 'ar' ? 'اللاعب' : 'Player'}</Label>
              <Select
                value={formData.playerId}
                onValueChange={(value) => setFormData({ ...formData, playerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  {players?.map((player) => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      {player.firstName} {player.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.relationship')}</Label>
              <Select
                value={formData.relationship}
                onValueChange={(value) => setFormData({ ...formData, relationship: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">{t('settings.father')}</SelectItem>
                  <SelectItem value="mother">{t('settings.mother')}</SelectItem>
                  <SelectItem value="guardian">{t('settings.guardian')}</SelectItem>
                  <SelectItem value="other">{language === 'ar' ? 'أخرى' : 'Other'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={linkParent.isPending}>
              {linkParent.isPending ? (language === 'ar' ? 'جارٍ الربط...' : 'Linking...') : t('settings.linkParentToPlayer')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function UserRoleManager({ user, onUpdate }: { user: any; onUpdate: () => void }) {
  const { language } = useLanguage();
  const ROLE_LABELS = language === 'ar' ? ROLE_LABELS_AR : ROLE_LABELS_EN;
  const [selectedRole, setSelectedRole] = useState(user.role);
  
  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success('User role updated');
      onUpdate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update role');
    },
  });

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole);
    updateRole.mutate({ userId: user.id, role: newRole as any });
  };

  return (
    <Select value={selectedRole} onValueChange={handleRoleChange}>
      <SelectTrigger className="w-40">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="admin">{ROLE_LABELS.admin}</SelectItem>
        <SelectItem value="coach">{ROLE_LABELS.coach}</SelectItem>
        <SelectItem value="nutritionist">{ROLE_LABELS.nutritionist}</SelectItem>
        <SelectItem value="mental_coach">{ROLE_LABELS.mental_coach}</SelectItem>
        <SelectItem value="physical_trainer">{ROLE_LABELS.physical_trainer}</SelectItem>
        <SelectItem value="parent">{ROLE_LABELS.parent}</SelectItem>
        <SelectItem value="player">{ROLE_LABELS.player}</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function Settings() {
  const { t, language } = useLanguage();
  const ROLE_LABELS = language === 'ar' ? ROLE_LABELS_AR : ROLE_LABELS_EN;
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { data: users, refetch: refetchUsers } = trpc.users.getAll.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();

  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <>
        <div className="flex items-center justify-center h-[60vh]">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">{t('settings.accessRestricted')}</h2>
              <p className="text-muted-foreground">
                {language === 'ar' ? 'يمكن للمديرين فقط الوصول إلى صفحة الإعدادات.' : 'Only administrators can access the settings page.'}
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const usersByRole = users?.reduce((acc: Record<string, number>, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <>
      <div className="space-y-6">
        <div>
          
          <BackButton />
<h1 className="text-2xl font-bold tracking-tight">{t("common.settings")}</h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'إدارة المستخدمين والأدوار وإعدادات الأكاديمية' : 'Manage users, roles, and academy configuration'}
          </p>
        </div>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'المستخدمون' : 'Users'}
            </TabsTrigger>
            <TabsTrigger value="roles">
              <Shield className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'الأدوار' : 'Roles'}
            </TabsTrigger>
            <TabsTrigger value="academy">
              <Building2 className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'الأكاديمية' : 'Academy'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">{t('settings.userManagement')}</h2>
                <p className="text-sm text-muted-foreground">
                  {users?.length || 0} {language === 'ar' ? 'مستخدم مسجل' : 'registered users'}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href="/user-management">
                  <Button variant="outline">
                    <UserCog className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إدارة التسجيلات' : 'Manage Registrations'}
                  </Button>
                </Link>
                <Link href="/video-management">
                  <Button variant="outline">
                    <Video className="w-4 h-4 mr-2" />
                    {language === 'ar' ? 'إدارة الفيديوهات' : 'Manage Videos'}
                  </Button>
                </Link>
                <LinkParentDialog />
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === 'ar' ? 'المستخدم' : 'User'}</TableHead>
                      <TableHead>{language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</TableHead>
                      <TableHead>{language === 'ar' ? 'الدور' : 'Role'}</TableHead>
                      <TableHead>{t('settings.lastActive')}</TableHead>
                      <TableHead>{t('settings.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              {(u.name?.[0] || u.email?.[0] || 'U').toUpperCase()}
                            </div>
                            <span className="font-medium">{u.name || 'Unnamed User'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.email || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={ROLE_COLORS[u.role]}>
                            {ROLE_LABELS[u.role]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <UserRoleManager user={u} onUpdate={() => refetchUsers()} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roles" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">{language === 'ar' ? 'توزيع الأدوار' : 'Role Distribution'}</h2>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'نظرة عامة على أدوار المستخدمين في الأكاديمية' : 'Overview of user roles in the academy'}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(language === 'ar' ? ROLE_LABELS_AR : ROLE_LABELS_EN).map(([role, label]) => (
                <Card key={role}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">{label}</p>
                        <p className="text-2xl font-bold">{usersByRole[role] || 0}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ROLE_COLORS[role]}`}>
                        <Users className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Role Permissions</CardTitle>
                <CardDescription>Access levels for each role in the system</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                    <div>Role</div>
                    <div>Players</div>
                    <div>Performance</div>
                    <div>Training</div>
                    <div>Nutrition</div>
                    <div>Admin</div>
                  </div>
                  {[
                    { role: 'admin', players: '✓', performance: '✓', training: '✓', nutrition: '✓', admin: '✓' },
                    { role: 'coach', players: '✓', performance: '✓', training: '✓', nutrition: 'View', admin: '✗' },
                    { role: 'nutritionist', players: 'View', performance: 'View', training: 'View', nutrition: '✓', admin: '✗' },
                    { role: 'mental_coach', players: 'View', performance: '✓', training: 'View', nutrition: 'View', admin: '✗' },
                    { role: 'physical_trainer', players: 'View', performance: '✓', training: '✓', nutrition: 'View', admin: '✗' },
                    { role: 'parent', players: 'Own', performance: 'Own', training: 'View', nutrition: 'Own', admin: '✗' },
                    { role: 'player', players: 'Own', performance: 'Own', training: 'View', nutrition: 'Own', admin: '✗' },
                  ].map((row) => (
                    <div key={row.role} className="grid grid-cols-6 gap-2 text-sm py-2 border-b border-border/50">
                      <div className="font-medium">{ROLE_LABELS[row.role]}</div>
                      <div className={row.players === '✓' ? 'text-green-700 dark:text-green-500' : row.players === '✗' ? 'text-red-500' : 'text-muted-foreground'}>{row.players}</div>
                      <div className={row.performance === '✓' ? 'text-green-700 dark:text-green-500' : row.performance === '✗' ? 'text-red-500' : 'text-muted-foreground'}>{row.performance}</div>
                      <div className={row.training === '✓' ? 'text-green-700 dark:text-green-500' : row.training === '✗' ? 'text-red-500' : 'text-muted-foreground'}>{row.training}</div>
                      <div className={row.nutrition === '✓' ? 'text-green-700 dark:text-green-500' : row.nutrition === '✗' ? 'text-red-500' : 'text-muted-foreground'}>{row.nutrition}</div>
                      <div className={row.admin === '✓' ? 'text-green-700 dark:text-green-500' : 'text-red-500'}>{row.admin}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academy" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Academy Settings</h2>
              <p className="text-sm text-muted-foreground">
                Configure academy-wide settings and preferences
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Academy Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <img src="/logo-transparent.png" alt="Future Stars Academy" className="w-16 h-16 object-contain" />
                    <div>
                      <h3 className="font-semibold">Future Stars Academy</h3>
                      <p className="text-sm text-muted-foreground">Technology-Driven Football Academy</p>
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-muted-foreground">Total Teams</Label>
                      <p className="font-medium">{teams?.length || 0}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Age Groups</Label>
                      <p className="font-medium">U10, U12, U14, U16, U18</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Development Framework</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">Technical Development</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-chart-2/10">
                      <div className="w-2 h-2 rounded-full bg-chart-2" />
                      <span className="text-sm">Physical Conditioning</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-chart-3/10">
                      <div className="w-2 h-2 rounded-full bg-chart-3" />
                      <span className="text-sm">Mental Coaching</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-chart-4/10">
                      <div className="w-2 h-2 rounded-full bg-chart-4" />
                      <span className="text-sm">Nutrition Planning</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
