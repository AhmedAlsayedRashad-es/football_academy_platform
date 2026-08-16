import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Users,
  Plus,
  Trash2,
  Edit3,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  UserPlus,
  UserMinus,
  ArrowLeft,
  Shield,
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Star,
  Target,
  Loader2,
  BarChart3,
  Printer,
  FileText,
  CreditCard,
  DollarSign,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';
import CoachAnalyticsDashboard from '@/components/CoachAnalyticsDashboard';
import SubscriptionTeamMembers from '@/components/SubscriptionTeamMembers';
import { useLocation } from 'wouter';
import SessionPdfExport from '@/components/SessionPdfExport';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const SESSION_TYPES = [
  { value: 'technical', label: 'Technical', labelAr: 'تقني' },
  { value: 'tactical', label: 'Tactical', labelAr: 'تكتيكي' },
  { value: 'physical', label: 'Physical', labelAr: 'بدني' },
  { value: 'match', label: 'Match', labelAr: 'مباراة' },
  { value: 'recovery', label: 'Recovery', labelAr: 'تعافي' },
  { value: 'mixed', label: 'Mixed', labelAr: 'مختلط' },
];

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  in_progress: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
  completed: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
};

const ATTENDANCE_ICONS: Record<string, React.ReactNode> = {
  present: <CheckCircle2 className="w-4 h-4 text-green-700 dark:text-green-400" />,
  absent: <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />,
  late: <AlertCircle className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />,
  excused: <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
};

export default function CoachMyTeams() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'teams' | 'sessions' | 'analytics' | 'subscriptions'>('teams');
  const [subTeamId, setSubTeamId] = useState<number | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentPlayer, setPaymentPlayer] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(null);

  // Dialogs
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [showCreatePlayer, setShowCreatePlayer] = useState(false);
  const [newPlayerForm, setNewPlayerForm] = useState({
    firstName: '', lastName: '', dateOfBirth: '', position: 'midfielder' as any,
    ageGroup: '', jerseyNumber: '', height: '', weight: '', nationality: '', phone: '',
  });
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showEditSession, setShowEditSession] = useState(false);
  const [showAddSessionPlayer, setShowAddSessionPlayer] = useState(false);
  const [showSessionDetail, setShowSessionDetail] = useState(false);

  // Forms
  const [teamForm, setTeamForm] = useState({ name: '', description: '', ageGroup: '' });
  const [sessionForm, setSessionForm] = useState({
    title: '', description: '', sessionDate: '', startTime: '', endTime: '',
    location: '', sessionType: 'technical' as any, objectives: '', notes: '', teamId: '' as any,
  });
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [editingSession, setEditingSession] = useState<any>(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: myTeams = [], refetch: refetchTeams, isLoading: teamsLoading } = trpc.privateTeams.getMyTeams.useQuery();
  const { data: teamMembers = [], refetch: refetchMembers } = trpc.privateTeams.getTeamMembers.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );
  const { data: mySessions = [], refetch: refetchSessions, isLoading: sessionsLoading } = trpc.privateTeams.getMySessions.useQuery();
  const { data: sessionDetail, refetch: refetchSessionDetail } = trpc.privateTeams.getSessionDetail.useQuery(
    { sessionId: selectedSessionId! },
    { enabled: !!selectedSessionId }
  );
    // Only show players from coach's own teams (official + private)
  const { data: allPlayers = [] } = trpc.privateTeams.getCoachPlayers.useQuery();
  // ── Subscription mutations ─────────────────────────────────────────────────
  const recordPaymentMutation = trpc.privateSubscriptions.recordPayment.useMutation({
    onSuccess: () => {
      toast({ title: isRTL ? 'تم تسجيل الدفعة ✓' : 'Payment recorded ✓' });
      setShowPaymentDialog(false);
      setPaymentAmount('');
      setPaymentNotes('');
    },
    onError: () => toast({ title: 'Error recording payment', variant: 'destructive' }),
  });
  // ── Mutations ──────────────────────────────────────────────────────────────
  const createTeam = trpc.privateTeams.createTeam.useMutation({
    onSuccess: () => { refetchTeams(); setShowCreateTeam(false); setTeamForm({ name: '', description: '', ageGroup: '' }); toast({ title: isRTL ? 'تم إنشاء الفريق' : 'Team created!' }); },
  });
  const updateTeam = trpc.privateTeams.updateTeam.useMutation({
    onSuccess: () => { refetchTeams(); setShowEditTeam(false); toast({ title: isRTL ? 'تم تحديث الفريق' : 'Team updated!' }); },
  });
  const deleteTeam = trpc.privateTeams.deleteTeam.useMutation({
    onSuccess: () => { refetchTeams(); setSelectedTeamId(null); toast({ title: isRTL ? 'تم حذف الفريق' : 'Team deleted' }); },
  });
  const addMember = trpc.privateTeams.addTeamMember.useMutation({
    onSuccess: () => { refetchMembers(); setShowAddPlayer(false); toast({ title: isRTL ? 'تم إضافة اللاعب' : 'Player added!' }); },
    onError: (e) => toast({ title: e.message, variant: 'destructive' }),
  });
  const createPrivatePlayer = trpc.privateTeams.createPrivatePlayer.useMutation({
    onSuccess: () => {
      refetchMembers();
      setShowCreatePlayer(false);
      setNewPlayerForm({ firstName: '', lastName: '', dateOfBirth: '', position: 'midfielder', ageGroup: '', jerseyNumber: '', height: '', weight: '', nationality: '', phone: '' });
      toast({ title: isRTL ? 'تم إنشاء اللاعب وإضافته للفريق' : 'Player created and added to team!' });
    },
    onError: (e) => toast({ title: e.message, variant: 'destructive' }),
  });
  const removeMember = trpc.privateTeams.removeTeamMember.useMutation({
    onSuccess: () => { refetchMembers(); toast({ title: isRTL ? 'تم إزالة اللاعب' : 'Player removed' }); },
  });
  const createSession = trpc.privateTeams.createSession.useMutation({
    onSuccess: () => { refetchSessions(); setShowCreateSession(false); resetSessionForm(); toast({ title: isRTL ? 'تم إنشاء السيشن' : 'Session created!' }); },
  });
  const updateSession = trpc.privateTeams.updateSession.useMutation({
    onSuccess: () => { refetchSessions(); setShowEditSession(false); toast({ title: isRTL ? 'تم تحديث السيشن' : 'Session updated!' }); },
  });
  const deleteSession = trpc.privateTeams.deleteSession.useMutation({
    onSuccess: () => { refetchSessions(); setSelectedSessionId(null); setShowSessionDetail(false); toast({ title: isRTL ? 'تم حذف السيشن' : 'Session deleted' }); },
  });
  const addSessionPlayer = trpc.privateTeams.addSessionPlayer.useMutation({
    onSuccess: () => { refetchSessionDetail(); setShowAddSessionPlayer(false); toast({ title: isRTL ? 'تم إضافة اللاعب للسيشن' : 'Player added to session!' }); },
    onError: (e) => toast({ title: e.message, variant: 'destructive' }),
  });
  const removeSessionPlayer = trpc.privateTeams.removeSessionPlayer.useMutation({
    onSuccess: () => { refetchSessionDetail(); toast({ title: isRTL ? 'تم إزالة اللاعب' : 'Player removed' }); },
  });
  const updateSessionPlayer = trpc.privateTeams.updateSessionPlayer.useMutation({
    onSuccess: () => { refetchSessionDetail(); toast({ title: isRTL ? 'تم التحديث' : 'Updated!' }); },
  });
  const addTeamToSession = trpc.privateTeams.addTeamToSession.useMutation({
    onSuccess: (data) => { refetchSessionDetail(); toast({ title: `${data.added} ${isRTL ? 'لاعب تمت إضافتهم' : 'players added'}` }); },
  });

  const resetSessionForm = () => setSessionForm({
    title: '', description: '', sessionDate: '', startTime: '', endTime: '',
    location: '', sessionType: 'technical', objectives: '', notes: '', teamId: '',
  });

  const selectedTeam = myTeams.find((t: any) => t.id === selectedTeamId);
  const selectedSession = mySessions.find((s: any) => s.id === selectedSessionId);

  // Players not yet in the selected team
  const availablePlayersForTeam = allPlayers.filter(
    (p: any) => !teamMembers.some((m: any) => m.playerId === p.id)
  );

  // Players not yet in the selected session
  const availablePlayersForSession = allPlayers.filter(
    (p: any) => !sessionDetail?.players?.some((sp: any) => sp.playerId === p.id)
  );

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="sm" onClick={() => setLocation('/coach-dashboard')}>
            <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground" style={{color: '#0f0000'}}>
              {isRTL ? 'فرقي وسيشناتي الخاصة' : 'My Private Teams & Sessions'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL ? 'أنشئ فرقك الخاصة وتابع لاعبيك وسيشناتك' : 'Build your private teams, track your players and sessions'}
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-6">
            <TabsTrigger value="teams" className="gap-2">
              <Shield className="w-4 h-4" />
              {isRTL ? 'فرقي الخاصة' : 'My Private Teams'}
              {myTeams.length > 0 && (
                <Badge variant="secondary" className="ml-1">{myTeams.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sessions" className="gap-2">
              <Activity className="w-4 h-4" />
              {isRTL ? 'سيشناتي الخاصة' : 'My Private Sessions'}
              {mySessions.length > 0 && (
                <Badge variant="secondary" className="ml-1">{mySessions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              {isRTL ? 'الإحصائيات والتحليلات' : 'Analytics'}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="gap-2">
              <CreditCard className="w-4 h-4" />
              {isRTL ? 'الاشتراكات' : 'Subscriptions'}
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════ TEAMS TAB ═══════════════ */}
          <TabsContent value="teams">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Teams List */}
              <div className="lg:col-span-1 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {isRTL ? 'الفرق' : 'Teams'}
                  </h2>
                  <Button size="sm" onClick={() => setShowCreateTeam(true)} className="gap-1">
                    <Plus className="w-3 h-3" />
                    {isRTL ? 'فريق جديد' : 'New Team'}
                  </Button>
                </div>

                {teamsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <Skeleton className="w-8 h-8 rounded-lg" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-32" />
                              <Skeleton className="h-3 w-20" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : myTeams.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <Shield className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'ما عندكش فرق خاصة لسه' : "You don't have any private teams yet"}
                      </p>
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowCreateTeam(true)}>
                        {isRTL ? 'أنشئ أول فريق' : 'Create your first team'}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  myTeams.map((team: any) => (
                    <Card
                      key={team.id}
                      className={`cursor-pointer transition-all hover:border-primary/50 ${selectedTeamId === team.id ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => setSelectedTeamId(team.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-primary flex-shrink-0" />
                              <span className="font-semibold text-sm truncate">{team.name}</span>
                            </div>
                            {team.ageGroup && (
                              <Badge variant="outline" className="mt-1 text-xs">{team.ageGroup}</Badge>
                            )}
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Users className="w-3 h-3" />
                              <span>{team.memberCount} {isRTL ? 'لاعب' : 'players'}</span>
                            </div>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground flex-shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Team Detail */}
              <div className="lg:col-span-2">
                {!selectedTeamId ? (
                  <Card className="h-full border-dashed flex items-center justify-center">
                    <CardContent className="text-center py-12">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                      <p className="text-muted-foreground">
                        {isRTL ? 'اختر فريق لعرض لاعبيه' : 'Select a team to view its players'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-primary" />
                            {selectedTeam?.name}
                          </CardTitle>
                          {selectedTeam?.description && (
                            <p className="text-sm text-muted-foreground mt-1">{selectedTeam.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => {
                            if (!selectedTeam) return;
                            setEditingTeam(selectedTeam);
                            setTeamForm({ name: selectedTeam.name, description: selectedTeam.description || '', ageGroup: selectedTeam.ageGroup || '' });
                            setShowEditTeam(true);
                          }}>
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300" onClick={() => {
                            if (confirm(isRTL ? 'هل تريد حذف هذا الفريق؟' : 'Delete this team?')) {
                              deleteTeam.mutate({ teamId: selectedTeamId });
                            }
                          }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          <Button size="sm" onClick={() => setShowAddPlayer(true)} className="gap-1">
                            <UserPlus className="w-3 h-3" />
                            {isRTL ? 'أضف لاعب' : 'Add Player'}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {teamMembers.length === 0 ? (
                        <div className="text-center py-8">
                          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-30" />
                          <p className="text-sm text-muted-foreground">
                            {isRTL ? 'الفريق فاضي — أضف لاعبين' : 'Team is empty — add players'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {teamMembers.map((member: any) => (
                            <div key={member.memberId} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {member.photoUrl ? (
                                    <img src={member.photoUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-bold text-primary">
                                      {member.firstName?.[0]}{member.lastName?.[0]}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{member.firstName} {member.lastName}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {member.position && (
                                      <Badge variant="outline" className="text-xs py-0">{member.position || member.playerPosition}</Badge>
                                    )}
                                    {member.jerseyNumber && (
                                      <span className="text-xs text-muted-foreground">#{member.jerseyNumber}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => removeMember.mutate({ teamId: selectedTeamId, playerId: member.playerId })}
                              >
                                <UserMinus className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════ SESSIONS TAB ═══════════════ */}
          <TabsContent value="sessions">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sessions List */}
              <div className="lg:col-span-1 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {isRTL ? 'السيشنات' : 'Sessions'}
                  </h2>
                  <Button size="sm" onClick={() => setShowCreateSession(true)} className="gap-1">
                    <Plus className="w-3 h-3" />
                    {isRTL ? 'سيشن جديد' : 'New Session'}
                  </Button>
                </div>

                {sessionsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-36" />
                            <Skeleton className="h-3 w-24" />
                            <Skeleton className="h-5 w-16 rounded-full" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : mySessions.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                      <Activity className="w-10 h-10 text-muted-foreground mb-3 opacity-40" />
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? 'ما عندكش سيشنات خاصة لسه' : "No private sessions yet"}
                      </p>
                      <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowCreateSession(true)}>
                        {isRTL ? 'أنشئ أول سيشن' : 'Create your first session'}
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  mySessions.map((session: any) => (
                    <Card
                      key={session.id}
                      className={`cursor-pointer transition-all hover:border-primary/50 ${selectedSessionId === session.id ? 'border-primary bg-primary/5' : ''}`}
                      onClick={() => { setSelectedSessionId(session.id); setShowSessionDetail(false); }}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{session.title}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              <span>{session.sessionDate ? format(new Date(session.sessionDate), 'dd MMM yyyy') : '—'}</span>
                            </div>
                            {session.teamName && (
                              <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                <Shield className="w-3 h-3" />
                                <span>{session.teamName}</span>
                              </div>
                            )}
                          </div>
                          <Badge className={`text-xs border ${STATUS_COLORS[session.status] || ''}`}>
                            {session.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Session Detail */}
              <div className="lg:col-span-2">
                {!selectedSessionId ? (
                  <Card className="h-full border-dashed flex items-center justify-center">
                    <CardContent className="text-center py-12">
                      <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                      <p className="text-muted-foreground">
                        {isRTL ? 'اختر سيشن لعرض تفاصيله' : 'Select a session to view details'}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div>
                          <CardTitle className="text-lg">{selectedSession?.title}</CardTitle>
                          <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                            {selectedSession?.sessionDate && (
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(new Date(selectedSession.sessionDate), 'dd MMM yyyy')}
                              </span>
                            )}
                            {selectedSession?.startTime && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {selectedSession.startTime}{selectedSession?.endTime ? ` – ${selectedSession.endTime}` : ''}
                              </span>
                            )}
                            {selectedSession?.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {selectedSession.location}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => {
                            setEditingSession(selectedSession);
                            setSessionForm({
                              title: selectedSession?.title || '',
                              description: selectedSession?.description || '',
                              sessionDate: selectedSession?.sessionDate ? new Date(selectedSession.sessionDate).toISOString().split('T')[0] : '',
                              startTime: selectedSession?.startTime || '',
                              endTime: selectedSession?.endTime || '',
                              location: selectedSession?.location || '',
                              sessionType: selectedSession?.sessionType || 'technical',
                              objectives: selectedSession?.objectives || '',
                              notes: selectedSession?.notes || '',
                              teamId: selectedSession?.teamId || '',
                            });
                            setShowEditSession(true);
                          }}>
                            <Edit3 className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300" onClick={() => {
                            if (confirm(isRTL ? 'هل تريد حذف هذا السيشن؟' : 'Delete this session?')) {
                              deleteSession.mutate({ sessionId: selectedSessionId });
                            }
                          }}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          {selectedSession?.teamId && (
                            <Button size="sm" variant="outline" onClick={() => addTeamToSession.mutate({ sessionId: selectedSessionId, teamId: selectedSession.teamId as number })} className="gap-1">
                              <Users className="w-3 h-3" />
                              {isRTL ? 'أضف الفريق كله' : 'Add whole team'}
                            </Button>
                          )}
                          <Button size="sm" onClick={() => setShowAddSessionPlayer(true)} className="gap-1">
                            <UserPlus className="w-3 h-3" />
                            {isRTL ? 'أضف لاعب' : 'Add Player'}
                          </Button>
                          {selectedSessionId && (
                            <SessionPdfExport sessionId={selectedSessionId} />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedSession?.objectives && (
                        <div className="mb-4 p-3 rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2 mb-1">
                            <Target className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{isRTL ? 'الأهداف' : 'Objectives'}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{selectedSession.objectives}</p>
                        </div>
                      )}

                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {isRTL ? 'اللاعبون' : 'Players'}
                        {sessionDetail?.players && (
                          <Badge variant="secondary">{sessionDetail.players.length}</Badge>
                        )}
                      </h3>

                      {!sessionDetail?.players || sessionDetail.players.length === 0 ? (
                        <div className="text-center py-6">
                          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
                          <p className="text-sm text-muted-foreground">
                            {isRTL ? 'ما في لاعبين في هذا السيشن' : 'No players in this session yet'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {sessionDetail.players.map((sp: any) => (
                            <div key={sp.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {sp.photoUrl ? (
                                    <img src={sp.photoUrl} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-bold text-primary">
                                      {sp.firstName?.[0]}{sp.lastName?.[0]}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{sp.firstName} {sp.lastName}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {ATTENDANCE_ICONS[sp.attendance]}
                                    <span className="text-xs text-muted-foreground capitalize">{sp.attendance}</span>
                                    {sp.performanceRating && (
                                      <span className="flex items-center gap-0.5 text-xs text-yellow-700 dark:text-yellow-400">
                                        <Star className="w-3 h-3 fill-yellow-400" />
                                        {sp.performanceRating}/10
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {/* Quick attendance toggle */}
                                <Select
                                  value={sp.attendance}
                                  onValueChange={(v) => updateSessionPlayer.mutate({ sessionId: selectedSessionId, playerId: sp.playerId, attendance: v as any })}
                                >
                                  <SelectTrigger className="h-7 w-24 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="present">Present</SelectItem>
                                    <SelectItem value="absent">Absent</SelectItem>
                                    <SelectItem value="late">Late</SelectItem>
                                    <SelectItem value="excused">Excused</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/10 h-7 w-7 p-0"
                                  onClick={() => removeSessionPlayer.mutate({ sessionId: selectedSessionId, playerId: sp.playerId })}
                                >
                                  <UserMinus className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ═══════════════ ANALYTICS TAB ═══════════════ */}
          <TabsContent value="analytics">
            <CoachAnalyticsDashboard />
          </TabsContent>

          {/* ═══════════════ SUBSCRIPTIONS TAB ═══════════════ */}
          <TabsContent value="subscriptions">
            <div className="space-y-6">
              {/* Team selector */}
              <div className="flex items-center gap-3">
                <Label>{isRTL ? 'اختر الفريق:' : 'Select Team:'}</Label>
                <Select value={subTeamId ? String(subTeamId) : 'none'} onValueChange={(v) => setSubTeamId(v === 'none' ? null : Number(v))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={isRTL ? 'اختر فريق' : 'Choose team'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{isRTL ? 'كل الفرق' : 'All Teams'}</SelectItem>
                    {myTeams.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/10">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{isRTL ? 'إجمالي اللاعبين' : 'Total Players'}</p>
                        <p className="text-2xl font-bold">{myTeams.reduce((acc: number, t: any) => acc + (t.memberCount || 0), 0)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/10">
                        <DollarSign className="w-5 h-5 text-green-700 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{isRTL ? 'الرسوم الشهرية المتوقعة' : 'Expected Monthly Fees'}</p>
                        <p className="text-2xl font-bold">{isRTL ? 'من الفرق' : 'Per Teams'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-500/10">
                        <TrendingUp className="w-5 h-5 text-yellow-700 dark:text-yellow-400" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{isRTL ? 'الشهر الحالي' : 'Current Month'}</p>
                        <p className="text-2xl font-bold">{new Date().toLocaleString('default', { month: 'long' })}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Players subscription list */}
              {myTeams.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-center py-12">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground">{isRTL ? 'أنشئ فريقاً خاصاً أولاً لتتبع الاشتراكات' : 'Create a private team first to track subscriptions'}</p>
                    <Button className="mt-4" onClick={() => setActiveTab('teams')}>{isRTL ? 'إنشاء فريق' : 'Create Team'}</Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {(subTeamId ? myTeams.filter((t: any) => t.id === subTeamId) : myTeams).map((team: any) => (
                    <Card key={team.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="w-4 h-4 text-primary" />
                          {team.name}
                          <Badge variant="secondary">{team.memberCount} {isRTL ? 'لاعب' : 'players'}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <SubscriptionTeamMembers
                          teamId={team.id}
                          isRTL={isRTL}
                          currentMonth={currentMonth}
                          currentYear={currentYear}
                          onRecordPayment={(player) => {
                            setPaymentPlayer({ ...player, teamId: team.id });
                            setPaymentAmount(String(player.monthlyFee || ''));
                            setPaymentNotes('');
                            setShowPaymentDialog(true);
                          }}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isRTL ? 'تسجيل دفعة' : 'Record Payment'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{isRTL ? 'اللاعب' : 'Player'}</Label>
                    <p className="text-sm font-medium mt-1">{paymentPlayer?.firstName} {paymentPlayer?.lastName}</p>
                  </div>
                  <div>
                    <Label>{isRTL ? 'المبلغ (جنيه)' : 'Amount (EGP)'}</Label>
                    <Input type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} placeholder="500" />
                  </div>
                  <div>
                    <Label>{isRTL ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</Label>
                    <Input value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder={isRTL ? 'مثال: دفع نقداً' : 'e.g. Cash payment'} />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
                  <Button
                    onClick={() => {
                      if (!paymentPlayer || !paymentAmount) return;
                      recordPaymentMutation.mutate({
                        teamId: paymentPlayer.teamId,
                        playerId: paymentPlayer.playerId,
                        amount: Number(paymentAmount),
                        month: currentMonth,
                        year: currentYear,
                        notes: paymentNotes || undefined,
                      });
                    }}
                    disabled={!paymentAmount}
                  >
                    <CheckSquare className="w-4 h-4 mr-1" />
                    {isRTL ? 'تأكيد الدفع' : 'Confirm Payment'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>

        {/* ═══════════════ DIALOGS ═══════════════ */}

        {/* Create Team */}
        <Dialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRTL ? 'إنشاء فريق خاص جديد' : 'Create New Private Team'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{isRTL ? 'اسم الفريق *' : 'Team Name *'}</Label>
                <Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} placeholder={isRTL ? 'مثال: فريق U14 الخاص' : 'e.g. My U14 Squad'} />
              </div>
              <div>
                <Label>{isRTL ? 'الفئة العمرية' : 'Age Group'}</Label>
                <Input value={teamForm.ageGroup} onChange={(e) => setTeamForm({ ...teamForm, ageGroup: e.target.value })} placeholder="U12, U14, U16..." />
              </div>
              <div>
                <Label>{isRTL ? 'وصف (اختياري)' : 'Description (optional)'}</Label>
                <Textarea value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateTeam(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={() => createTeam.mutate(teamForm)} disabled={!teamForm.name || createTeam.isPending}>
                {createTeam.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRTL ? 'إنشاء' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Team */}
        <Dialog open={showEditTeam} onOpenChange={setShowEditTeam}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRTL ? 'تعديل الفريق' : 'Edit Team'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{isRTL ? 'اسم الفريق' : 'Team Name'}</Label>
                <Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
              </div>
              <div>
                <Label>{isRTL ? 'الفئة العمرية' : 'Age Group'}</Label>
                <Input value={teamForm.ageGroup} onChange={(e) => setTeamForm({ ...teamForm, ageGroup: e.target.value })} />
              </div>
              <div>
                <Label>{isRTL ? 'وصف' : 'Description'}</Label>
                <Textarea value={teamForm.description} onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditTeam(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={() => updateTeam.mutate({ teamId: editingTeam?.id, ...teamForm })} disabled={updateTeam.isPending}>
                {updateTeam.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRTL ? 'حفظ' : 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Player to Team */}
        <Dialog open={showAddPlayer} onOpenChange={setShowAddPlayer}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isRTL ? 'إضافة لاعب للفريق' : 'Add Player to Team'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full gap-2 border-dashed" onClick={() => { setShowAddPlayer(false); setShowCreatePlayer(true); }}>
                <Plus className="w-4 h-4" />
                {isRTL ? 'إنشاء لاعب جديد (غير مسجل في المنصة)' : 'Create New Player (not on platform)'}
              </Button>
              <div className="border-t pt-2">
                <p className="text-xs text-muted-foreground mb-2">{isRTL ? 'أو اختر من اللاعبين الموجودين:' : 'Or choose from existing players:'}</p>
              </div>
              {availablePlayersForTeam.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isRTL ? 'كل اللاعبين مضافين بالفعل' : 'All players already added'}
                </p>
              ) : (
                availablePlayersForTeam.map((player: any) => (
                  <div key={player.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {player.firstName?.[0]}{player.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{player.firstName} {player.lastName}</p>
                        <p className="text-xs text-muted-foreground">{player.position} · {player.ageGroup}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => addMember.mutate({ teamId: selectedTeamId!, playerId: player.id })} disabled={addMember.isPending}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Create New Private Player Dialog */}
        <Dialog open={showCreatePlayer} onOpenChange={setShowCreatePlayer}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isRTL ? 'إنشاء لاعب جديد' : 'Create New Player'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRTL ? 'الاسم الأول *' : 'First Name *'}</Label>
                  <Input value={newPlayerForm.firstName} onChange={e => setNewPlayerForm({...newPlayerForm, firstName: e.target.value})} placeholder={isRTL ? 'الاسم الأول' : 'First name'} />
                </div>
                <div>
                  <Label>{isRTL ? 'الاسم الأخير *' : 'Last Name *'}</Label>
                  <Input value={newPlayerForm.lastName} onChange={e => setNewPlayerForm({...newPlayerForm, lastName: e.target.value})} placeholder={isRTL ? 'الاسم الأخير' : 'Last name'} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRTL ? 'تاريخ الميلاد *' : 'Date of Birth *'}</Label>
                  <Input type="date" value={newPlayerForm.dateOfBirth} onChange={e => setNewPlayerForm({...newPlayerForm, dateOfBirth: e.target.value})} />
                </div>
                <div>
                  <Label>{isRTL ? 'المركز *' : 'Position *'}</Label>
                  <Select value={newPlayerForm.position} onValueChange={v => setNewPlayerForm({...newPlayerForm, position: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goalkeeper">{isRTL ? 'حارس مرمى' : 'Goalkeeper'}</SelectItem>
                      <SelectItem value="defender">{isRTL ? 'مدافع' : 'Defender'}</SelectItem>
                      <SelectItem value="midfielder">{isRTL ? 'وسط' : 'Midfielder'}</SelectItem>
                      <SelectItem value="forward">{isRTL ? 'مهاجم' : 'Forward'}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRTL ? 'الفئة العمرية' : 'Age Group'}</Label>
                  <Input value={newPlayerForm.ageGroup} onChange={e => setNewPlayerForm({...newPlayerForm, ageGroup: e.target.value})} placeholder="U12, U14, U16..." />
                </div>
                <div>
                  <Label>{isRTL ? 'رقم القميص' : 'Jersey Number'}</Label>
                  <Input type="number" value={newPlayerForm.jerseyNumber} onChange={e => setNewPlayerForm({...newPlayerForm, jerseyNumber: e.target.value})} placeholder="10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRTL ? 'الطول (سم)' : 'Height (cm)'}</Label>
                  <Input type="number" value={newPlayerForm.height} onChange={e => setNewPlayerForm({...newPlayerForm, height: e.target.value})} placeholder="175" />
                </div>
                <div>
                  <Label>{isRTL ? 'الوزن (كغ)' : 'Weight (kg)'}</Label>
                  <Input type="number" value={newPlayerForm.weight} onChange={e => setNewPlayerForm({...newPlayerForm, weight: e.target.value})} placeholder="70" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRTL ? 'الجنسية' : 'Nationality'}</Label>
                  <Input value={newPlayerForm.nationality} onChange={e => setNewPlayerForm({...newPlayerForm, nationality: e.target.value})} placeholder={isRTL ? 'مصري' : 'Egyptian'} />
                </div>
                <div>
                  <Label>{isRTL ? 'رقم الهاتف' : 'Phone'}</Label>
                  <Input value={newPlayerForm.phone} onChange={e => setNewPlayerForm({...newPlayerForm, phone: e.target.value})} placeholder="+20..." />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreatePlayer(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
              <Button
                onClick={() => createPrivatePlayer.mutate({
                  firstName: newPlayerForm.firstName,
                  lastName: newPlayerForm.lastName,
                  dateOfBirth: newPlayerForm.dateOfBirth || '2005-01-01',
                  position: newPlayerForm.position,
                  ageGroup: newPlayerForm.ageGroup || undefined,
                  jerseyNumber: newPlayerForm.jerseyNumber ? parseInt(newPlayerForm.jerseyNumber) : undefined,
                  height: newPlayerForm.height ? parseInt(newPlayerForm.height) : undefined,
                  weight: newPlayerForm.weight ? parseInt(newPlayerForm.weight) : undefined,
                  nationality: newPlayerForm.nationality || undefined,
                  phone: newPlayerForm.phone || undefined,
                  teamId: selectedTeamId || undefined,
                })}
                disabled={createPrivatePlayer.isPending || !newPlayerForm.firstName || !newPlayerForm.lastName}
              >
                {createPrivatePlayer.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {isRTL ? 'إنشاء اللاعب' : 'Create Player'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Create Session */}
        <Dialog open={showCreateSession} onOpenChange={setShowCreateSession}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isRTL ? 'إنشاء سيشن خاص جديد' : 'Create New Private Session'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{isRTL ? 'عنوان السيشن *' : 'Session Title *'}</Label>
                <Input value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} placeholder={isRTL ? 'مثال: تدريب تقني — الثلاثاء' : 'e.g. Technical Drill — Tuesday'} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRTL ? 'التاريخ *' : 'Date *'}</Label>
                  <Input type="date" value={sessionForm.sessionDate} onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })} />
                </div>
                <div>
                  <Label>{isRTL ? 'نوع السيشن' : 'Session Type'}</Label>
                  <Select value={sessionForm.sessionType} onValueChange={(v) => setSessionForm({ ...sessionForm, sessionType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SESSION_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{isRTL ? t.labelAr : t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRTL ? 'وقت البداية' : 'Start Time'}</Label>
                  <Input type="time" value={sessionForm.startTime} onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })} />
                </div>
                <div>
                  <Label>{isRTL ? 'وقت النهاية' : 'End Time'}</Label>
                  <Input type="time" value={sessionForm.endTime} onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>{isRTL ? 'المكان' : 'Location'}</Label>
                <Input value={sessionForm.location} onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })} placeholder={isRTL ? 'مثال: ملعب الأكاديمية' : 'e.g. Academy Pitch 1'} />
              </div>
              <div>
                <Label>{isRTL ? 'ربط بفريق (اختياري)' : 'Link to Team (optional)'}</Label>
                <Select value={sessionForm.teamId?.toString() || ''} onValueChange={(v) => setSessionForm({ ...sessionForm, teamId: (v && v !== 'none') ? parseInt(v) : '' })}>
                  <SelectTrigger><SelectValue placeholder={isRTL ? 'اختر فريق' : 'Select team'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{isRTL ? 'بدون فريق' : 'No team'}</SelectItem>
                    {myTeams.map((t: any) => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isRTL ? 'الأهداف' : 'Objectives'}</Label>
                <Textarea value={sessionForm.objectives} onChange={(e) => setSessionForm({ ...sessionForm, objectives: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>{isRTL ? 'ملاحظات' : 'Notes'}</Label>
                <Textarea value={sessionForm.notes} onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateSession(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={() => createSession.mutate({ ...sessionForm, teamId: sessionForm.teamId || undefined })} disabled={!sessionForm.title || !sessionForm.sessionDate || createSession.isPending}>
                {createSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRTL ? 'إنشاء' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Session */}
        <Dialog open={showEditSession} onOpenChange={setShowEditSession}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isRTL ? 'تعديل السيشن' : 'Edit Session'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{isRTL ? 'العنوان' : 'Title'}</Label>
                <Input value={sessionForm.title} onChange={(e) => setSessionForm({ ...sessionForm, title: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRTL ? 'التاريخ' : 'Date'}</Label>
                  <Input type="date" value={sessionForm.sessionDate} onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })} />
                </div>
                <div>
                  <Label>{isRTL ? 'الحالة' : 'Status'}</Label>
                  <Select value={editingSession?.status || 'scheduled'} onValueChange={(v) => setEditingSession({ ...editingSession, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>{isRTL ? 'وقت البداية' : 'Start Time'}</Label>
                  <Input type="time" value={sessionForm.startTime} onChange={(e) => setSessionForm({ ...sessionForm, startTime: e.target.value })} />
                </div>
                <div>
                  <Label>{isRTL ? 'وقت النهاية' : 'End Time'}</Label>
                  <Input type="time" value={sessionForm.endTime} onChange={(e) => setSessionForm({ ...sessionForm, endTime: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>{isRTL ? 'المكان' : 'Location'}</Label>
                <Input value={sessionForm.location} onChange={(e) => setSessionForm({ ...sessionForm, location: e.target.value })} />
              </div>
              <div>
                <Label>{isRTL ? 'الأهداف' : 'Objectives'}</Label>
                <Textarea value={sessionForm.objectives} onChange={(e) => setSessionForm({ ...sessionForm, objectives: e.target.value })} rows={2} />
              </div>
              <div>
                <Label>{isRTL ? 'ملاحظات' : 'Notes'}</Label>
                <Textarea value={sessionForm.notes} onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditSession(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={() => updateSession.mutate({ sessionId: editingSession?.id, ...sessionForm, status: editingSession?.status, teamId: sessionForm.teamId || undefined })} disabled={updateSession.isPending}>
                {updateSession.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRTL ? 'حفظ' : 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Player to Session */}
        <Dialog open={showAddSessionPlayer} onOpenChange={setShowAddSessionPlayer}>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isRTL ? 'إضافة لاعب للسيشن' : 'Add Player to Session'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {availablePlayersForSession.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {isRTL ? 'كل اللاعبين مضافين بالفعل' : 'All players already added'}
                </p>
              ) : (
                availablePlayersForSession.map((player: any) => (
                  <div key={player.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                        {player.firstName?.[0]}{player.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{player.firstName} {player.lastName}</p>
                        <p className="text-xs text-muted-foreground">{player.position} · {player.ageGroup}</p>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => addSessionPlayer.mutate({ sessionId: selectedSessionId!, playerId: player.id })} disabled={addSessionPlayer.isPending}>
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
