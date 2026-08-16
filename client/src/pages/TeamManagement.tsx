import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { useToast } from "../hooks/use-toast";
import { useLanguage } from "../contexts/LanguageContext";
import { PageHelp } from "../components/PageHelp";
import {
  ArrowLeft, Users, Plus, Edit2, Trash2, UserPlus, UserMinus,
  Shield, Trophy, Search, ChevronRight, X, Check,
  Dumbbell, Heart, Brain, Settings, Star, HelpCircle,
  AlertCircle, RefreshCw, Eye
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { BackButton } from '@/components/BackButton';

const STAFF_ROLES = [
  { value: "head_coach", label: "Head Coach", labelAr: "\u0627\u0644\u0645\u062f\u0631\u0628 \u0627\u0644\u0631\u0626\u064a\u0633\u064a", icon: Trophy, color: "text-yellow-700 dark:text-yellow-400" },
  { value: "assistant_coach", label: "Assistant Coach", labelAr: "\u0645\u062f\u0631\u0628 \u0645\u0633\u0627\u0639\u062f", icon: Users, color: "text-blue-600 dark:text-blue-400" },
  { value: "goalkeeper_coach", label: "Goalkeeper Coach", labelAr: "\u0645\u062f\u0631\u0628 \u062d\u0631\u0627\u0633 \u0627\u0644\u0645\u0631\u0645\u0649", icon: Shield, color: "text-green-700 dark:text-green-400" },
  { value: "fitness_coach", label: "Fitness Coach", labelAr: "\u0645\u062f\u0631\u0628 \u0627\u0644\u0644\u064a\u0627\u0642\u0629", icon: Dumbbell, color: "text-orange-700 dark:text-orange-400" },
  { value: "analyst", label: "Analyst", labelAr: "\u0645\u062d\u0644\u0644", icon: Brain, color: "text-purple-600 dark:text-purple-400" },
  { value: "medical", label: "Medical Staff", labelAr: "\u0627\u0644\u0637\u0627\u0642\u0645 \u0627\u0644\u0637\u0628\u064a", icon: Heart, color: "text-red-600 dark:text-red-400" },
  { value: "admin", label: "Admin", labelAr: "\u0625\u062f\u0627\u0631\u064a", icon: Settings, color: "text-muted-foreground" },
  { value: "technical", label: "Technical Director", labelAr: "\u0627\u0644\u0645\u062f\u064a\u0631 \u0627\u0644\u0641\u0646\u064a", icon: Star, color: "text-teal-700 dark:text-teal-400" },
];

const DEFAULT_AGE_GROUPS = ["U-8","U-10","U-12","U-14","U-16","U-18","U-21","Senior","Women","Other"];

function NativeSelect({ value, onChange, children, placeholder, className = "" }: {
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

function HelpTooltip({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle size={14} className="text-muted-foreground cursor-help inline-block ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default function TeamManagement() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [activeTab, setActiveTab] = useState<"main" | "academy">("main");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddPlayerDialog, setShowAddPlayerDialog] = useState(false);
  const [showAssignStaffDialog, setShowAssignStaffDialog] = useState(false);
  const [showAgeGroupDialog, setShowAgeGroupDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any>(null);
  const [newTeamForm, setNewTeamForm] = useState({
    name: "", ageGroup: "", teamType: "academy" as "main" | "academy", description: "",
    initialStaff: [] as { userId: string; role: string }[],
  });
  const [newStaffEntry, setNewStaffEntry] = useState({ userId: "", role: "head_coach" });
  const [staffForm, setStaffForm] = useState({ userId: "", role: "head_coach", isPrimary: false });
  const [playerSearchQuery, setPlayerSearchQuery] = useState("");
  const [newAgeGroupInput, setNewAgeGroupInput] = useState("");

  const { data: systemAgeGroups, refetch: refetchAgeGroups } = trpc.admin.getAgeGroups.useQuery();
  const saveAgeGroupsMutation = trpc.admin.saveAgeGroups.useMutation({
    onSuccess: () => { refetchAgeGroups(); toast({ title: "Age groups saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const AGE_GROUPS: string[] = (systemAgeGroups as string[] | undefined) || DEFAULT_AGE_GROUPS;

  const { data: allTeams, refetch: refetchTeams, isLoading: teamsLoading } = trpc.teams.getAll.useQuery();
  const { data: allUsers } = trpc.users.getAll.useQuery();
  const { data: allPlayers } = trpc.players.getAll.useQuery();
  const selectedTeam = (allTeams as any[] | undefined)?.find((t: any) => t.id === selectedTeamId);
  const { data: teamPlayers, refetch: refetchPlayers } = trpc.teams.getPlayers.useQuery(
    { teamId: selectedTeamId! }, { enabled: !!selectedTeamId }
  );
  const { data: teamStaff, refetch: refetchStaff } = trpc.teams.getStaff.useQuery(
    { teamId: selectedTeamId! }, { enabled: !!selectedTeamId }
  );

  const createTeamMutation = trpc.teams.create.useMutation({
    onSuccess: async (data: any) => {
      if (newTeamForm.initialStaff.length > 0 && data?.id) {
        for (const s of newTeamForm.initialStaff) {
          try { await assignStaffMutation.mutateAsync({ teamId: data.id, userId: parseInt(s.userId), role: s.role as any, isPrimary: s.role === "head_coach" }); } catch {}
        }
      }
      refetchTeams();
      setShowCreateDialog(false);
      setNewTeamForm({ name: "", ageGroup: "", teamType: "academy", description: "", initialStaff: [] });
      setNewStaffEntry({ userId: "", role: "head_coach" });
      toast({ title: isRTL ? "\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0641\u0631\u064a\u0642" : "Team created successfully" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const updateTeamMutation = trpc.teams.update.useMutation({
    onSuccess: () => { refetchTeams(); setShowEditDialog(false); toast({ title: "Team updated" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteTeamMutation = trpc.teams.delete.useMutation({
    onSuccess: () => { refetchTeams(); setShowDeleteDialog(false); setSelectedTeamId(null); toast({ title: "Team deleted" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const addPlayerMutation = trpc.teams.addPlayer.useMutation({
    onSuccess: () => { refetchPlayers(); setShowAddPlayerDialog(false); toast({ title: "Player added" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const removePlayerMutation = trpc.teams.removePlayer.useMutation({
    onSuccess: () => { refetchPlayers(); toast({ title: "Player removed" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const assignStaffMutation = trpc.teams.assignStaff.useMutation({
    onSuccess: () => { refetchStaff(); setShowAssignStaffDialog(false); setStaffForm({ userId: "", role: "head_coach", isPrimary: false }); toast({ title: "Staff assigned" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const removeStaffMutation = trpc.teams.removeStaff.useMutation({
    onSuccess: () => { refetchStaff(); toast({ title: "Staff removed" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filteredTeams = (allTeams as any[] | undefined)?.filter((t: any) =>
    t.teamType === activeTab &&
    (t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (t.ageGroup || "").toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const availablePlayers = (allPlayers as any[] | undefined)?.filter((p: any) =>
    !(teamPlayers as any[])?.some((tp: any) => tp.id === p.id) &&
    ((p.name || "").toLowerCase().includes(playerSearchQuery.toLowerCase()) ||
     (p.position || "").toLowerCase().includes(playerSearchQuery.toLowerCase()))
  ) || [];

  const handleCreateTeam = () => {
    if (!newTeamForm.name || !newTeamForm.ageGroup) {
      toast({ title: "Please fill in team name and age group", variant: "destructive" }); return;
    }
    createTeamMutation.mutate({ name: newTeamForm.name, ageGroup: newTeamForm.ageGroup, teamType: newTeamForm.teamType, description: newTeamForm.description });
  };

  const handleUpdateTeam = () => {
    if (!editingTeam) return;
    updateTeamMutation.mutate({ id: editingTeam.id, name: editingTeam.name, ageGroup: editingTeam.ageGroup, teamType: editingTeam.teamType, description: editingTeam.description });
  };

  const handleAssignStaff = () => {
    if (!selectedTeamId || !staffForm.userId) return;
    assignStaffMutation.mutate({ teamId: selectedTeamId, userId: parseInt(staffForm.userId), role: staffForm.role as any, isPrimary: staffForm.isPrimary });
  };

  const addInitialStaff = () => {
    if (!newStaffEntry.userId) return;
    if (newTeamForm.initialStaff.some(s => s.userId === newStaffEntry.userId)) {
      toast({ title: "User already added", variant: "destructive" }); return;
    }
    setNewTeamForm(p => ({ ...p, initialStaff: [...p.initialStaff, { ...newStaffEntry }] }));
    setNewStaffEntry({ userId: "", role: "head_coach" });
  };

  const getRoleInfo = (role: string) => STAFF_ROLES.find(r => r.value === role) || STAFF_ROLES[0];

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users size={24} className="text-red-500" />
              {isRTL ? "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0641\u0631\u0642" : "Team Management"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRTL ? "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0641\u0631\u0642 \u0648\u062a\u0639\u064a\u064a\u0646 \u0627\u0644\u0644\u0627\u0639\u0628\u064a\u0646 \u0648\u0627\u0644\u062c\u0647\u0627\u0632 \u0627\u0644\u0641\u0646\u064a" : "Create teams, assign players and technical staff"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: isRTL ? "\u0627\u0644\u0641\u0631\u0642 \u0627\u0644\u0623\u0648\u0644\u0649" : "Main Teams", value: (allTeams as any[])?.filter((t: any) => t.teamType === "main").length || 0, icon: Trophy, color: "text-yellow-700 dark:text-yellow-500" },
            { label: isRTL ? "\u0641\u0631\u0642 \u0627\u0644\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629" : "Academy Teams", value: (allTeams as any[])?.filter((t: any) => t.teamType === "academy").length || 0, icon: Shield, color: "text-blue-500" },
            { label: isRTL ? "\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0641\u0631\u0642" : "Total Teams", value: (allTeams as any[])?.length || 0, icon: Users, color: "text-green-700 dark:text-green-500" },
            { label: isRTL ? "\u0627\u0644\u0644\u0627\u0639\u0628\u0648\u0646 \u0627\u0644\u0645\u0639\u064a\u0646\u0648\u0646" : "Assigned Players", value: (allPlayers as any[])?.filter((p: any) => p.teamId).length || 0, icon: Users, color: "text-purple-500" },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1"><Icon size={16} className={stat.color} /><span className="text-xs text-muted-foreground">{stat.label}</span></div>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            );
          })}
        </div>

        <Tabs value={activeTab} onValueChange={v => { setActiveTab(v as any); setSelectedTeamId(null); }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <TabsList>
              <TabsTrigger value="main"><Trophy size={14} className="mr-1.5 text-yellow-700 dark:text-yellow-500" />{isRTL ? "\u0627\u0644\u0641\u0631\u064a\u0642 \u0627\u0644\u0623\u0648\u0644" : "Main Teams"}</TabsTrigger>
              <TabsTrigger value="academy"><Shield size={14} className="mr-1.5 text-blue-500" />{isRTL ? "\u0627\u0644\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629" : "Academy Teams"}</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={isRTL ? "\u0628\u062d\u062b..." : "Search..."} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-8 h-9 w-44" />
              </div>
              <Button onClick={() => setShowAgeGroupDialog(true)} variant="outline" className="h-9 text-sm">
                <Settings size={14} className="mr-1.5" />{isRTL ? "\u0627\u0644\u0641\u0626\u0627\u062a \u0627\u0644\u0639\u0645\u0631\u064a\u0629" : "Age Groups"}
              </Button>
              <Button onClick={() => { setNewTeamForm({ name: "", ageGroup: "", teamType: activeTab, description: "", initialStaff: [] }); setShowCreateDialog(true); }} className="bg-red-700 hover:bg-red-600 text-white h-9 text-sm">
                <Plus size={14} className="mr-1.5" />{isRTL ? "\u0625\u0646\u0634\u0627\u0621 \u0641\u0631\u064a\u0642" : "Create Team"}
              </Button>
            </div>
          </div>

          {(["main", "academy"] as const).map(tab => (
            <TabsContent key={tab} value={tab}>
              {teamsLoading ? (
                <div className="flex items-center justify-center py-12 text-muted-foreground">
                  <RefreshCw size={20} className="animate-spin mr-2" />{isRTL ? "\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0645\u064a\u0644..." : "Loading..."}
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    {filteredTeams.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <Users size={40} className="mx-auto mb-2 opacity-20" />
                        <p className="text-sm">{isRTL ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0631\u0642" : "No teams found"}</p>
                        <Button onClick={() => { setNewTeamForm({ name: "", ageGroup: "", teamType: tab, description: "", initialStaff: [] }); setShowCreateDialog(true); }} className="mt-3 bg-red-700 hover:bg-red-600 text-white text-sm h-8">
                          <Plus size={12} className="mr-1" />{isRTL ? "\u0625\u0646\u0634\u0627\u0621 \u0641\u0631\u064a\u0642" : "Create Team"}
                        </Button>
                      </div>
                    ) : filteredTeams.map((team: any) => (
                      <div key={team.id} onClick={() => setSelectedTeamId(team.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedTeamId === team.id ? "border-red-500 bg-red-500/5" : "border-border bg-card hover:border-muted-foreground/40"}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-sm">{team.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{team.ageGroup} · {team.teamType === "main" ? (isRTL ? "\u0627\u0644\u0641\u0631\u064a\u0642 \u0627\u0644\u0623\u0648\u0644" : "Main") : (isRTL ? "\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629" : "Academy")}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={e => { e.stopPropagation(); setEditingTeam({ ...team }); setShowEditDialog(true); }} className="p-1 rounded hover:bg-muted text-muted-foreground"><Edit2 size={12} /></button>
                            <button onClick={e => { e.stopPropagation(); setEditingTeam(team); setShowDeleteDialog(true); }} className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-red-600 dark:hover:text-red-500"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedTeam ? (
                    <div className="lg:col-span-2 space-y-4">
                      <div className="rounded-xl border border-border bg-card p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h2 className="text-lg font-bold">{selectedTeam.name}</h2>
                            <p className="text-sm text-muted-foreground">{selectedTeam.ageGroup}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/admin/teams/${selectedTeam.id}`)} className="text-xs">
                            <Eye size={12} className="mr-1" />{isRTL ? "\u0639\u0631\u0636 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644" : "Full Details"}
                          </Button>
                        </div>
                        {selectedTeam.description && <p className="text-sm text-muted-foreground">{selectedTeam.description}</p>}
                      </div>

                      <div className="rounded-xl border border-border p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold flex items-center gap-2">
                            <Users size={16} className="text-blue-600 dark:text-blue-400" />
                            {isRTL ? "\u0627\u0644\u0644\u0627\u0639\u0628\u0648\u0646" : "Players"}
                            <Badge variant="secondary" className="text-xs">{(teamPlayers as any[])?.length || 0}</Badge>
                          </h3>
                          <Button size="sm" onClick={() => setShowAddPlayerDialog(true)} className="bg-blue-700 hover:bg-blue-600 text-white text-xs">
                            <UserPlus size={12} className="mr-1" />{isRTL ? "\u0625\u0636\u0627\u0641\u0629 \u0644\u0627\u0639\u0628" : "Add Player"}
                          </Button>
                        </div>
                        {(teamPlayers as any[])?.length > 0 ? (
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {(teamPlayers as any[]).map((player: any) => (
                              <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold">{(player.name || "?").charAt(0)}</div>
                                  <div>
                                    <button onClick={() => navigate(`/player/${player.id}`)} className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-500 transition-colors">{player.name}</button>
                                    <p className="text-xs text-muted-foreground">{player.position} · #{player.jerseyNumber || "—"}</p>
                                  </div>
                                </div>
                                <button onClick={() => removePlayerMutation.mutate({ playerId: player.id })} className="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-500/10"><UserMinus size={12} /></button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm text-center py-4">{isRTL ? "\u0644\u0627 \u064a\u0648\u062c\u062f \u0644\u0627\u0639\u0628\u0648\u0646 \u0645\u0639\u064a\u0646\u0648\u0646" : "No players assigned yet"}</p>
                        )}
                      </div>

                      <div className="rounded-xl border border-border p-4 bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-bold flex items-center gap-2">
                            <Shield size={16} className="text-yellow-700 dark:text-yellow-400" />
                            {isRTL ? "\u0627\u0644\u062c\u0647\u0627\u0632 \u0627\u0644\u0641\u0646\u064a \u0648\u0627\u0644\u0625\u062f\u0627\u0631\u064a" : "Technical & Admin Staff"}
                          </h3>
                          <Button size="sm" onClick={() => setShowAssignStaffDialog(true)} className="bg-yellow-700 hover:bg-yellow-600 text-black text-xs">
                            <UserPlus size={12} className="mr-1" />{isRTL ? "\u062a\u0639\u064a\u064a\u0646 \u0645\u0648\u0638\u0641" : "Assign Staff"}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {STAFF_ROLES.map(role => {
                            const roleStaff = (teamStaff as any[])?.filter((s: any) => s.role === role.value) || [];
                            const RoleIcon = role.icon;
                            return (
                              <div key={role.value} className="bg-muted rounded-lg p-2.5">
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <RoleIcon size={12} className={role.color} />
                                  <span className="text-xs font-medium">{isRTL ? role.labelAr : role.label}</span>
                                </div>
                                {roleStaff.length > 0 ? roleStaff.map((s: any) => (
                                  <div key={s.id} className="flex items-center justify-between">
                                    <span className="text-xs font-medium">{s.coachName || `User #${s.coachUserId}`}</span>
                                    <button onClick={() => removeStaffMutation.mutate({ teamId: selectedTeamId!, userId: s.coachUserId })} className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 p-0.5"><X size={10} /></button>
                                  </div>
                                )) : <p className="text-xs text-muted-foreground italic">{isRTL ? "\u063a\u064a\u0631 \u0645\u0639\u064a\u0646" : "Not assigned"}</p>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="lg:col-span-2 flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <ChevronRight size={48} className="mx-auto mb-2 opacity-20" />
                        <p>{isRTL ? "\u0627\u062e\u062a\u0631 \u0641\u0631\u064a\u0642\u064b\u0627 \u0644\u0639\u0631\u0636 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644" : "Select a team to view details"}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {/* CREATE TEAM DIALOG */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Plus size={18} className="text-red-500" />
                {isRTL ? "\u0625\u0646\u0634\u0627\u0621 \u0641\u0631\u064a\u0642 \u062c\u062f\u064a\u062f" : "Create New Team"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isRTL ? "\u0627\u0633\u0645 \u0627\u0644\u0641\u0631\u064a\u0642" : "Team Name"} <span className="text-red-500">*</span></label>
                <Input placeholder={isRTL ? "\u0645\u062b\u0627\u0644: \u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629 \u062a\u062d\u062a 15" : "e.g. U15 Academy A"} value={newTeamForm.name} onChange={e => setNewTeamForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{isRTL ? "\u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0639\u0645\u0631\u064a\u0629" : "Age Group"} <span className="text-red-500">*</span></label>
                  <NativeSelect value={newTeamForm.ageGroup} onChange={v => setNewTeamForm(p => ({ ...p, ageGroup: v }))} placeholder={isRTL ? "\u0627\u062e\u062a\u0631..." : "Select..."}>
                    {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                  </NativeSelect>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{isRTL ? "\u0646\u0648\u0639 \u0627\u0644\u0641\u0631\u064a\u0642" : "Team Type"}</label>
                  <NativeSelect value={newTeamForm.teamType} onChange={v => setNewTeamForm(p => ({ ...p, teamType: v as any }))}>
                    <option value="academy">{isRTL ? "\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629" : "Academy"}</option>
                    <option value="main">{isRTL ? "\u0627\u0644\u0641\u0631\u064a\u0642 \u0627\u0644\u0623\u0648\u0644" : "Main Team"}</option>
                  </NativeSelect>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isRTL ? "\u0627\u0644\u0648\u0635\u0641 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)" : "Description (optional)"}</label>
                <Textarea placeholder={isRTL ? "\u0648\u0635\u0641 \u0627\u0644\u0641\u0631\u064a\u0642..." : "Team description..."} value={newTeamForm.description} onChange={e => setNewTeamForm(p => ({ ...p, description: e.target.value }))} className="resize-none h-16" />
              </div>
              <div className="border-t border-border pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Shield size={14} className="text-yellow-700 dark:text-yellow-500" />
                  {isRTL ? "\u062a\u0639\u064a\u064a\u0646 \u0627\u0644\u062c\u0647\u0627\u0632 \u0627\u0644\u0641\u0646\u064a \u0648\u0627\u0644\u0625\u062f\u0627\u0631\u064a (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)" : "Assign Technical & Admin Staff (optional)"}
                </h4>
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <NativeSelect value={newStaffEntry.userId} onChange={v => setNewStaffEntry(p => ({ ...p, userId: v }))} placeholder={isRTL ? "\u0627\u062e\u062a\u0631 \u0645\u0648\u0638\u0641\u064b\u0627..." : "Select staff member..."}>
                      {(allUsers as any[] | undefined)?.filter((u: any) => u.role !== "player" && u.role !== "parent").map((u: any) => (
                        <option key={u.id} value={u.id.toString()}>{u.name || u.email} ({u.role})</option>
                      ))}
                    </NativeSelect>
                  </div>
                  <div className="w-36">
                    <NativeSelect value={newStaffEntry.role} onChange={v => setNewStaffEntry(p => ({ ...p, role: v }))}>
                      {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{isRTL ? r.labelAr : r.label}</option>)}
                    </NativeSelect>
                  </div>
                  <Button type="button" size="sm" onClick={addInitialStaff} disabled={!newStaffEntry.userId} className="bg-green-700 hover:bg-green-600 text-white px-3 shrink-0">
                    <Plus size={14} />
                  </Button>
                </div>
                {newTeamForm.initialStaff.length > 0 && (
                  <div className="space-y-1.5">
                    {newTeamForm.initialStaff.map(s => {
                      const user = (allUsers as any[])?.find((u: any) => u.id.toString() === s.userId);
                      const roleInfo = getRoleInfo(s.role);
                      const RoleIcon = roleInfo.icon;
                      return (
                        <div key={s.userId} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            <RoleIcon size={12} className={roleInfo.color} />
                            <span className="text-sm font-medium">{user?.name || user?.email}</span>
                            <Badge variant="secondary" className="text-xs">{isRTL ? roleInfo.labelAr : roleInfo.label}</Badge>
                          </div>
                          <button onClick={() => setNewTeamForm(p => ({ ...p, initialStaff: p.initialStaff.filter(x => x.userId !== s.userId) }))} className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"><X size={14} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>{isRTL ? "\u0625\u0644\u063a\u0627\u0621" : "Cancel"}</Button>
              <Button onClick={handleCreateTeam} disabled={createTeamMutation.isPending} className="bg-red-700 hover:bg-red-600 text-white">
                {createTeamMutation.isPending ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Plus size={14} className="mr-2" />}
                {isRTL ? "\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u0641\u0631\u064a\u0642" : "Create Team"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* EDIT TEAM DIALOG */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Edit2 size={18} className="text-blue-600 dark:text-blue-400" />{isRTL ? "\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u0641\u0631\u064a\u0642" : "Edit Team"}</DialogTitle></DialogHeader>
            {editingTeam && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{isRTL ? "\u0627\u0633\u0645 \u0627\u0644\u0641\u0631\u064a\u0642" : "Team Name"}</label>
                  <Input value={editingTeam.name} onChange={e => setEditingTeam((p: any) => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isRTL ? "\u0627\u0644\u0641\u0626\u0629 \u0627\u0644\u0639\u0645\u0631\u064a\u0629" : "Age Group"}</label>
                    <NativeSelect value={editingTeam.ageGroup} onChange={v => setEditingTeam((p: any) => ({ ...p, ageGroup: v }))}>
                      {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{ag}</option>)}
                    </NativeSelect>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">{isRTL ? "\u0646\u0648\u0639 \u0627\u0644\u0641\u0631\u064a\u0642" : "Team Type"}</label>
                    <NativeSelect value={editingTeam.teamType} onChange={v => setEditingTeam((p: any) => ({ ...p, teamType: v }))}>
                      <option value="academy">{isRTL ? "\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629" : "Academy"}</option>
                      <option value="main">{isRTL ? "\u0627\u0644\u0641\u0631\u064a\u0642 \u0627\u0644\u0623\u0648\u0644" : "Main Team"}</option>
                    </NativeSelect>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{isRTL ? "\u0627\u0644\u0648\u0635\u0641" : "Description"}</label>
                  <Textarea value={editingTeam.description || ""} onChange={e => setEditingTeam((p: any) => ({ ...p, description: e.target.value }))} className="resize-none h-20" />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowEditDialog(false)}>{isRTL ? "\u0625\u0644\u063a\u0627\u0621" : "Cancel"}</Button>
              <Button onClick={handleUpdateTeam} disabled={updateTeamMutation.isPending} className="bg-blue-700 hover:bg-blue-600 text-white">
                {updateTeamMutation.isPending ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Check size={14} className="mr-2" />}
                {isRTL ? "\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a" : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DELETE TEAM DIALOG */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle className="flex items-center gap-2 text-red-500"><AlertCircle size={18} />{isRTL ? "\u062d\u0630\u0641 \u0627\u0644\u0641\u0631\u064a\u0642" : "Delete Team"}</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">{isRTL ? `\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u062d\u0630\u0641 "${editingTeam?.name}"?` : `Are you sure you want to delete "${editingTeam?.name}"? This cannot be undone.`}</p>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowDeleteDialog(false)}>{isRTL ? "\u0625\u0644\u063a\u0627\u0621" : "Cancel"}</Button>
              <Button onClick={() => deleteTeamMutation.mutate({ id: editingTeam?.id })} disabled={deleteTeamMutation.isPending} variant="destructive">
                {deleteTeamMutation.isPending ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Trash2 size={14} className="mr-2" />}
                {isRTL ? "\u062d\u0630\u0641" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ADD PLAYER DIALOG */}
        <Dialog open={showAddPlayerDialog} onOpenChange={setShowAddPlayerDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><UserPlus size={18} className="text-blue-600 dark:text-blue-400" />{isRTL ? "\u0625\u0636\u0627\u0641\u0629 \u0644\u0627\u0639\u0628" : "Add Player"} — {selectedTeam?.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={isRTL ? "\u0628\u062d\u062b \u0639\u0646 \u0644\u0627\u0639\u0628..." : "Search players..."} value={playerSearchQuery} onChange={e => setPlayerSearchQuery(e.target.value)} className="pl-8" />
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {availablePlayers.length === 0 ? (
                  <p className="text-center text-muted-foreground text-sm py-6">{isRTL ? "\u0644\u0627 \u064a\u0648\u062c\u062f \u0644\u0627\u0639\u0628\u0648\u0646 \u0645\u062a\u0627\u062d\u0648\u0646" : "No available players"}</p>
                ) : availablePlayers.map((player: any) => (
                  <div key={player.id} className="flex items-center justify-between p-2.5 bg-muted rounded-lg">
                    <div>
                      <p className="text-sm font-medium">{player.name}</p>
                      <p className="text-xs text-muted-foreground">{player.position} · {player.ageGroup || "—"}</p>
                    </div>
                    <Button size="sm" onClick={() => addPlayerMutation.mutate({ teamId: selectedTeamId!, playerId: player.id })} disabled={addPlayerMutation.isPending} className="bg-blue-700 hover:bg-blue-600 text-white text-xs h-7">
                      <Plus size={12} className="mr-1" />{isRTL ? "\u0625\u0636\u0627\u0641\u0629" : "Add"}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAddPlayerDialog(false)}>{isRTL ? "\u0625\u063a\u0644\u0627\u0642" : "Close"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ASSIGN STAFF DIALOG */}
        <Dialog open={showAssignStaffDialog} onOpenChange={setShowAssignStaffDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield size={18} className="text-yellow-700 dark:text-yellow-400" />{isRTL ? "\u062a\u0639\u064a\u064a\u0646 \u0645\u0648\u0638\u0641" : "Assign Staff"} — {selectedTeam?.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isRTL ? "\u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0648\u0638\u0641" : "Select Staff Member"}</label>
                <NativeSelect value={staffForm.userId} onChange={v => setStaffForm(p => ({ ...p, userId: v }))} placeholder={isRTL ? "\u0627\u062e\u062a\u0631 \u0645\u0633\u062a\u062e\u062f\u0645\u064b\u0627..." : "Select a user..."}>
                  {(allUsers as any[] | undefined)?.map((u: any) => (
                    <option key={u.id} value={u.id.toString()}>{u.name || u.email} ({u.role})</option>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isRTL ? "\u0627\u0644\u062f\u0648\u0631" : "Role"}</label>
                <NativeSelect value={staffForm.role} onChange={v => setStaffForm(p => ({ ...p, role: v }))}>
                  {STAFF_ROLES.map(r => <option key={r.value} value={r.value}>{isRTL ? r.labelAr : r.label}</option>)}
                </NativeSelect>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isPrimary" checked={staffForm.isPrimary} onChange={e => setStaffForm(p => ({ ...p, isPrimary: e.target.checked }))} className="rounded" />
                <label htmlFor="isPrimary" className="text-sm">{isRTL ? "\u0645\u0648\u0638\u0641 \u0631\u0626\u064a\u0633\u064a \u0644\u0647\u0630\u0627 \u0627\u0644\u062f\u0648\u0631" : "Primary staff member for this role"}</label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAssignStaffDialog(false)}>{isRTL ? "\u0625\u0644\u063a\u0627\u0621" : "Cancel"}</Button>
              <Button onClick={handleAssignStaff} disabled={assignStaffMutation.isPending || !staffForm.userId} className="bg-yellow-700 hover:bg-yellow-600 text-black">
                {assignStaffMutation.isPending ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Check size={14} className="mr-2" />}
                {isRTL ? "\u062a\u0639\u064a\u064a\u0646" : "Assign"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AGE GROUP DIALOG */}
        <Dialog open={showAgeGroupDialog} onOpenChange={setShowAgeGroupDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="flex items-center gap-2"><Settings size={18} className="text-blue-600 dark:text-blue-400" />{isRTL ? "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0641\u0626\u0627\u062a \u0627\u0644\u0639\u0645\u0631\u064a\u0629" : "Manage Age Groups"}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{isRTL ? "\u0623\u0636\u0641 \u0623\u0648 \u0627\u062d\u0630\u0641 \u0627\u0644\u0641\u0626\u0627\u062a \u0627\u0644\u0639\u0645\u0631\u064a\u0629 \u0627\u0644\u0645\u062a\u0627\u062d\u0629." : "Add or remove age groups available for team creation."}</p>
              <div className="flex flex-wrap gap-2 min-h-12 bg-muted rounded-lg p-3 border border-border">
                {AGE_GROUPS.map((ag: string) => (
                  <span key={ag} className="flex items-center gap-1 bg-background text-xs px-2 py-1 rounded-full border border-border">
                    {ag}
                    <button onClick={() => saveAgeGroupsMutation.mutate({ ageGroups: AGE_GROUPS.filter((g: string) => g !== ag) })} className="text-muted-foreground hover:text-destructive ml-1"><X size={10} /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder={isRTL ? "\u0645\u062b\u0627\u0644: U-9..." : "e.g., U-9, U-11..."} value={newAgeGroupInput} onChange={e => setNewAgeGroupInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && newAgeGroupInput.trim()) { const t = newAgeGroupInput.trim(); if (!AGE_GROUPS.includes(t)) { saveAgeGroupsMutation.mutate({ ageGroups: [...AGE_GROUPS, t] }); setNewAgeGroupInput(""); } } }}
                  className="flex-1" />
                <Button onClick={() => { const t = newAgeGroupInput.trim(); if (t && !AGE_GROUPS.includes(t)) { saveAgeGroupsMutation.mutate({ ageGroups: [...AGE_GROUPS, t] }); setNewAgeGroupInput(""); } }} disabled={!newAgeGroupInput.trim() || saveAgeGroupsMutation.isPending} className="bg-blue-700 hover:bg-blue-600 text-white">
                  <Plus size={14} className="mr-1" />{isRTL ? "\u0625\u0636\u0627\u0641\u0629" : "Add"}
                </Button>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowAgeGroupDialog(false)}>{isRTL ? "\u0625\u063a\u0644\u0627\u0642" : "Close"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <PageHelp pageKey="team-management" />
      </div>
    </>
  );
}
