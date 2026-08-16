import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { useToast } from "../hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft, Brain, Dumbbell, Target, User, TrendingUp, CheckCircle,
  Calendar, ChevronDown, ChevronUp, Plus, Edit2, Save, Clock,
  BarChart2, Award, Users, Filter, X, Layers, Trash2, Loader2
} from "lucide-react";

interface GroupPlan {
  id: string;
  name: string;
  playerIds: number[];
  goals: LocalGroupGoal[];
  createdAt: string;
  notes: string;
}
interface LocalGroupGoal {
  id: string;
  category: "physical" | "tactical" | "mental";
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  priority: "high" | "medium" | "low";
  completed: boolean;
}

const CATEGORY_CONFIG = {
  technical: { label: "Technical", icon: Target, color: "text-green-700 dark:text-green-400", bg: "bg-green-900/20", border: "border-green-700/40", badge: "bg-green-900/40 text-green-700 dark:text-green-400" },
  physical: { label: "Physical", icon: Dumbbell, color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-900/20", border: "border-orange-700/40", badge: "bg-orange-900/40 text-orange-700 dark:text-orange-400" },
  tactical: { label: "Tactical", icon: Target, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-900/20", border: "border-blue-700/40", badge: "bg-blue-900/40 text-blue-600 dark:text-blue-400" },
  mental: { label: "Mental", icon: Brain, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-900/20", border: "border-purple-700/40", badge: "bg-purple-900/40 text-purple-600 dark:text-purple-400" },
};
const PRIORITY_COLORS = {
  high: "bg-red-900/40 text-red-600 dark:text-red-400 border-red-700/40",
  medium: "bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-700/40",
  low: "bg-green-900/40 text-green-700 dark:text-green-400 border-green-700/40",
};
const POSITIONS = ["All Positions", "goalkeeper", "defender", "midfielder", "forward"];
const ALL_CATEGORIES = ["technical", "physical", "tactical", "mental"] as const;

export default function PlayerDevelopmentPlan() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();

  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"individual" | "group">("individual");
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedTeamType, setSelectedTeamType] = useState<string>("all");
  const [selectedPosition, setSelectedPosition] = useState<string>("All Positions");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<typeof ALL_CATEGORIES[number]>("technical");
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"goals" | "timeline" | "stats">("goals");
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", description: "", targetDate: "", priority: "medium" as "high" | "medium" | "low", drills: "" });
  const [editingProgressId, setEditingProgressId] = useState<number | null>(null);
  const [progressValue, setProgressValue] = useState(0);

  // Group mode (local state, not DB-backed yet)
  const [groupPlans, setGroupPlans] = useState<GroupPlan[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupPlayerIds, setSelectedGroupPlayerIds] = useState<number[]>([]);
  const [groupGoalCategory, setGroupGoalCategory] = useState<"physical" | "tactical" | "mental">("physical");
  const [showAddGroupGoal, setShowAddGroupGoal] = useState(false);
  const [newGroupGoal, setNewGroupGoal] = useState({ title: "", description: "", targetDate: "", priority: "medium" as "high" | "medium" | "low" });

  // Data queries
  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: allPlayers } = trpc.players.getAll.useQuery();
  const { data: teamPlayers } = trpc.players.getByTeam.useQuery({ teamId: selectedTeamId! }, { enabled: !!selectedTeamId });

  // DB-backed goals for selected player
  const { data: dbGoals, isLoading: goalsLoading, refetch: refetchGoals } = trpc.playerDevelopmentGoals.getByPlayer.useQuery(
    { playerId: selectedPlayerId! },
    { enabled: !!selectedPlayerId }
  );

  // Mutations
  const createGoalMutation = trpc.playerDevelopmentGoals.create.useMutation({
    onSuccess: () => { refetchGoals(); setShowAddGoal(false); setNewGoal({ title: "", description: "", targetDate: "", priority: "medium", drills: "" }); toast({ title: "Goal Added", description: "Development goal saved to database." }); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const updateGoalMutation = trpc.playerDevelopmentGoals.update.useMutation({
    onSuccess: () => { refetchGoals(); setEditingProgressId(null); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const [goalCommentText, setGoalCommentText] = useState<Record<number, string>>({});
  const addGoalComment = trpc.goalComments.add.useMutation({
    onSuccess: (_, vars) => {
      setGoalCommentText(prev => ({ ...prev, [vars.goalId]: '' }));
      utils.goalComments.getByGoal.invalidate({ goalId: vars.goalId });
    },
  });
  const updateProgressMutation = trpc.playerDevelopmentGoals.updateProgress.useMutation({
    onSuccess: () => { refetchGoals(); setEditingProgressId(null); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const deleteGoalMutation = trpc.playerDevelopmentGoals.delete.useMutation({
    onSuccess: () => { refetchGoals(); toast({ title: "Goal Deleted" }); },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const basePlayerList = useMemo(() => {
    const list = (selectedTeamId ? (teamPlayers || []) : (allPlayers || [])) as any[];
    if (selectedPosition === "All Positions") return list;
    return list.filter((p: any) => p.position === selectedPosition);
  }, [selectedTeamId, teamPlayers, allPlayers, selectedPosition]);

  const selectedPlayer = (allPlayers as any[])?.find((p: any) => p.id === selectedPlayerId);
  const selectedGroup = groupPlans.find(g => g.id === selectedGroupId);
  const getPlayerName = (p: any) => p?.name || `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Player";

  // Normalize DB goals for display
  const goals = (dbGoals || []).map((g: any) => ({
    ...g,
    drills: g.drills ? (() => { try { return JSON.parse(g.drills); } catch { return []; } })() : [],
    targetDate: g.targetDate ? (typeof g.targetDate === 'string' ? g.targetDate : new Date(g.targetDate).toISOString().split('T')[0]) : "",
  }));

  const categoryGoals = goals.filter((g: any) => g.category === activeCategory);
  const completedCount = goals.filter((g: any) => g.completed).length;
  const totalGoals = goals.length;

  const handleAddGoal = () => {
    if (!selectedPlayerId || !newGoal.title) return;
    const drillsArray = newGoal.drills ? newGoal.drills.split(",").map(d => d.trim()).filter(Boolean) : [];
    createGoalMutation.mutate({
      playerId: selectedPlayerId,
      category: activeCategory,
      title: newGoal.title,
      description: newGoal.description || undefined,
      targetDate: newGoal.targetDate || undefined,
      progress: 0,
      priority: newGoal.priority,
      drills: drillsArray.length > 0 ? drillsArray : undefined,
    });
  };

  const handleSaveProgress = (goalId: number) => {
    updateProgressMutation.mutate({ id: goalId, progress: progressValue });
  };

  const handleDeleteGoal = (goalId: number) => {
    if (!confirm("Delete this development goal?")) return;
    deleteGoalMutation.mutate({ id: goalId });
  };

  const createGroupPlan = () => {
    if (!newGroupName || selectedGroupPlayerIds.length === 0) return;
    const group: GroupPlan = { id: `group-${Date.now()}`, name: newGroupName, playerIds: selectedGroupPlayerIds, goals: [], createdAt: new Date().toISOString(), notes: "" };
    setGroupPlans(prev => [...prev, group]);
    setSelectedGroupId(group.id);
    setShowCreateGroup(false);
    setNewGroupName("");
    setSelectedGroupPlayerIds([]);
    toast({ title: "Group Plan Created", description: `"${group.name}" with ${group.playerIds.length} players.` });
  };

  const addGroupGoal = () => {
    if (!selectedGroupId || !newGroupGoal.title) return;
    const goal: LocalGroupGoal = { id: `gg-${Date.now()}`, category: groupGoalCategory, title: newGroupGoal.title, description: newGroupGoal.description, targetDate: newGroupGoal.targetDate || "2026-06-30", progress: 0, priority: newGroupGoal.priority, completed: false };
    setGroupPlans(prev => prev.map(g => g.id === selectedGroupId ? { ...g, goals: [...g.goals, goal] } : g));
    setNewGroupGoal({ title: "", description: "", targetDate: "", priority: "medium" });
    setShowAddGroupGoal(false);
    toast({ title: "Goal Added to Group" });
  };

  const timelineEvents = goals.length > 0 ? [
    ...goals.map((g: any) => ({ id: String(g.id), date: g.targetDate || "2026-12-31", title: g.title, category: g.category, progress: g.progress, completed: g.completed, type: g.completed ? "completed" : g.progress > 0 ? "in-progress" : "upcoming", description: g.description || "" })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) : [];

  return (
    <>
    <div className="text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/features-hub")} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={20} /></button>
          <div className="flex-1">
            <h1 className="text-xl font-bold flex items-center gap-2"><TrendingUp size={22} className="text-green-700 dark:text-green-500" /> {language === 'ar' ? 'خطط التطوير الشخصية للاعبين' : 'Personalized Player Development Plans'}</h1>
            <p className="text-muted-foreground text-sm mt-0.5">{language === 'ar' ? 'خرائط التطوير الفردية والجماعية' : 'Individual & group technical, physical, tactical, and mental development roadmaps'}</p>
          </div>
          <div className="flex bg-muted rounded-lg p-1 gap-1">
            <button onClick={() => setMode("individual")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === "individual" ? "bg-green-700 text-white" : "text-muted-foreground hover:text-foreground"}`}><User size={14} /> {language === 'ar' ? 'فردي' : 'Individual'}</button>
            <button onClick={() => setMode("group")} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${mode === "group" ? "bg-blue-700 text-white" : "text-muted-foreground hover:text-foreground"}`}><Users size={14} /> {language === 'ar' ? 'جماعي' : 'Group'}</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 flex gap-6">
        {/* LEFT SIDEBAR */}
        <div className="w-72 shrink-0 space-y-3">
          {/* Filters */}
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-3"><Filter size={14} className="text-muted-foreground" /><span className="text-sm font-semibold text-muted-foreground">{language === 'ar' ? 'الفلاتر' : 'Filters'}</span></div>
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">{language === 'ar' ? 'نوع الفريق' : 'Team Type'}</label>
              <select value={selectedTeamType} onChange={e => { setSelectedTeamType(e.target.value); setSelectedTeamId(null); setSelectedPlayerId(null); }} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                <option value="all">{language === 'ar' ? 'كل الفرق' : 'All Teams'}</option>
                <option value="academy">🏫 {language === 'ar' ? 'فرق الأكاديمية' : 'Academy Teams'}</option>
                <option value="main">⚽ {language === 'ar' ? 'الفريق الأول' : 'Main Team'}</option>
              </select>
            </div>
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">{language === 'ar' ? 'اختر الفريق' : 'Select Team'}</label>
              <select value={selectedTeamId ?? ""} onChange={e => { setSelectedTeamId(e.target.value ? Number(e.target.value) : null); setSelectedPlayerId(null); }} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                <option value="">{language === 'ar' ? 'كل الفرق' : 'All Teams'}</option>
                {(teams as any[])?.filter((t: any) => selectedTeamType === 'all' || t.teamType === selectedTeamType).map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{language === 'ar' ? 'المركز' : 'Position'}</label>
              <select value={selectedPosition} onChange={e => { setSelectedPosition(e.target.value); setSelectedPlayerId(null); }} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground capitalize">
                {POSITIONS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
            </div>
          </div>

          {/* Individual: Player List */}
          {mode === "individual" && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><User size={14} className="text-green-700 dark:text-green-400" /> {language === 'ar' ? 'اللاعبون' : 'Players'} <span className="text-xs text-gray-600">({basePlayerList.length})</span></h2>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 340px)" }}>
                {basePlayerList.length === 0 && <div className="p-4 text-center text-muted-foreground text-sm">{allPlayers ? (language === 'ar' ? 'لا يوجد لاعبون' : 'No players match filters') : (language === 'ar' ? 'جاري التحميل...' : 'Loading...')}</div>}
                {basePlayerList.map((player: any) => (
                  <button key={player.id} onClick={() => setSelectedPlayerId(player.id)} className={`w-full text-left px-4 py-3 border-b border-border/50 transition-all ${selectedPlayerId === player.id ? "bg-green-900/20 border-l-2 border-l-green-500" : "hover:bg-muted/50"}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-foreground">{getPlayerName(player)}</div>
                        <div className="text-xs text-muted-foreground capitalize">{player.position || "Unknown"}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group: Group List */}
          {mode === "group" && (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-2"><Layers size={14} className="text-blue-600 dark:text-blue-400" /> {language === 'ar' ? 'خطط المجموعات' : 'Group Plans'}</h2>
                <button onClick={() => setShowCreateGroup(true)} className="text-xs bg-blue-700 hover:bg-blue-600 text-white px-2 py-1 rounded-md flex items-center gap-1"><Plus size={10} /> {language === 'ar' ? 'جديد' : 'New'}</button>
              </div>
              {groupPlans.length === 0 && <div className="p-4 text-center text-muted-foreground text-sm">{language === 'ar' ? 'لا توجد خطط مجموعات بعد' : 'No group plans yet.'}</div>}
              {groupPlans.map(group => (
                <button key={group.id} onClick={() => setSelectedGroupId(group.id)} className={`w-full text-left px-4 py-3 border-b border-border/50 transition-all ${selectedGroupId === group.id ? "bg-blue-900/20 border-l-2 border-l-blue-500" : "hover:bg-muted/50"}`}>
                  <div className="text-sm font-medium text-foreground">{group.name}</div>
                  <div className="text-xs text-muted-foreground">{group.playerIds.length} {language === 'ar' ? 'لاعبين' : 'players'} · {group.goals.length} {language === 'ar' ? 'أهداف' : 'goals'}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MAIN CONTENT */}
        {mode === "individual" && !selectedPlayerId && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <TrendingUp size={48} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-muted-foreground text-lg font-semibold mb-2">{language === 'ar' ? 'اختر لاعباً' : 'Select a Player'}</h3>
              <p className="text-gray-600 text-sm">{language === 'ar' ? 'استخدم الفلاتر لاختيار لاعب' : 'Use the filters to find a player by team and position, then click their name'}</p>
            </div>
          </div>
        )}

        {mode === "individual" && selectedPlayerId && (
          <div className="flex-1 space-y-5">
            {/* Player Header */}
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-700 to-teal-700 flex items-center justify-center text-white font-bold text-xl">{getPlayerName(selectedPlayer).charAt(0)}</div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{getPlayerName(selectedPlayer)}</h2>
                    <p className="text-muted-foreground text-sm capitalize">{selectedPlayer?.position || "Unknown Position"}</p>
                    <span className="text-xs bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full border border-green-700/40 mt-1 inline-block">{completedCount}/{totalGoals} {language === 'ar' ? 'أهداف مكتملة' : 'Goals Complete'}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  {ALL_CATEGORIES.map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const catGoals = goals.filter((g: any) => g.category === cat);
                    const avg = catGoals.length ? Math.round(catGoals.reduce((s: number, g: any) => s + g.progress, 0) / catGoals.length) : 0;
                    return (
                      <div key={cat} className={`text-center px-3 py-2 rounded-lg ${cfg.bg} border ${cfg.border}`}>
                        <div className={`text-lg font-bold ${cfg.color}`}>{avg}%</div>
                        <div className="text-xs text-muted-foreground capitalize">{cat}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-card rounded-xl border border-border p-1">
              {[{ id: "goals", label: language === 'ar' ? 'الأهداف' : 'Goals', icon: Target }, { id: "timeline", label: language === 'ar' ? 'الجدول الزمني' : 'Timeline', icon: Calendar }, { id: "stats", label: language === 'ar' ? 'الإحصائيات' : 'Stats', icon: BarChart2 }].map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id as any)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === id ? "bg-green-700 text-white" : "text-muted-foreground hover:text-foreground"}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* GOALS TAB */}
            {activeTab === "goals" && (
              <div>
                <div className="flex gap-2 mb-4 flex-wrap">
                  {ALL_CATEGORIES.map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    return (
                      <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${activeCategory === cat ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
                        <cfg.icon size={14} /> {cfg.label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{goals.filter((g: any) => g.category === cat).length}</span>
                      </button>
                    );
                  })}
                  <button onClick={() => setShowAddGoal(true)} className="ml-auto flex items-center gap-1.5 px-3 py-2 bg-green-700 hover:bg-green-600 rounded-lg text-sm font-medium text-white"><Plus size={14} /> {language === 'ar' ? 'إضافة هدف' : 'Add Goal'}</button>
                </div>

                {showAddGoal && (
                  <div className="bg-card rounded-xl border border-green-700/40 p-4 mb-4">
                    <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-green-700 dark:text-green-400">{language === 'ar' ? `هدف ${CATEGORY_CONFIG[activeCategory].label} جديد` : `New ${CATEGORY_CONFIG[activeCategory].label} Goal`}</h3><button onClick={() => setShowAddGoal(false)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button></div>
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder={language === 'ar' ? 'عنوان الهدف' : 'Goal title'} value={newGoal.title} onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))} className="col-span-2 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                      <input placeholder={language === 'ar' ? 'الوصف' : 'Description'} value={newGoal.description} onChange={e => setNewGoal(p => ({ ...p, description: e.target.value }))} className="col-span-2 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                      <input placeholder={language === 'ar' ? 'التمارين (مفصولة بفاصلة)' : 'Drills (comma separated)'} value={newGoal.drills} onChange={e => setNewGoal(p => ({ ...p, drills: e.target.value }))} className="col-span-2 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                      <input type="date" value={newGoal.targetDate} onChange={e => setNewGoal(p => ({ ...p, targetDate: e.target.value }))} className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                      <select value={newGoal.priority} onChange={e => setNewGoal(p => ({ ...p, priority: e.target.value as any }))} className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                        <option value="high">{language === 'ar' ? 'أولوية عالية' : 'High Priority'}</option>
                        <option value="medium">{language === 'ar' ? 'أولوية متوسطة' : 'Medium Priority'}</option>
                        <option value="low">{language === 'ar' ? 'أولوية منخفضة' : 'Low Priority'}</option>
                      </select>
                    </div>
                    <button onClick={handleAddGoal} disabled={createGoalMutation.isPending || !newGoal.title} className="mt-3 w-full py-2 bg-green-700 hover:bg-green-600 disabled:bg-muted rounded-lg text-sm font-medium text-white flex items-center justify-center gap-2">
                      {createGoalMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                      {language === 'ar' ? 'حفظ الهدف' : 'Save Goal'}
                    </button>
                  </div>
                )}

                {goalsLoading && <div className="flex items-center justify-center py-12 text-muted-foreground"><Loader2 size={24} className="animate-spin mr-2" /> {language === 'ar' ? 'جاري التحميل...' : 'Loading goals...'}</div>}

                <div className="space-y-3">
                  {!goalsLoading && categoryGoals.length === 0 && <div className="text-center py-8 text-gray-600">{language === 'ar' ? `لا توجد أهداف ${CATEGORY_CONFIG[activeCategory].label} بعد` : `No ${CATEGORY_CONFIG[activeCategory].label} goals yet.`}</div>}
                  {categoryGoals.map((goal: any) => (
                    <div key={goal.id} className={`bg-card rounded-xl border overflow-hidden ${expandedGoalId === goal.id ? "border-green-700/60" : "border-border"}`}>
                      <div className="p-4 cursor-pointer" onClick={() => { setExpandedGoalId(expandedGoalId === goal.id ? null : goal.id); setProgressValue(goal.progress); }}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${goal.completed ? "bg-green-500 border-green-500" : "border-border"}`}>{goal.completed && <CheckCircle size={12} className="text-white" />}</div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-foreground">{goal.title}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[goal.priority as keyof typeof PRIORITY_COLORS]}`}>{goal.priority}</span>
                              </div>
                              {goal.targetDate && <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2"><Calendar size={10} /> {goal.targetDate}</div>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-sm font-bold text-foreground">{goal.progress}%</div>
                              <div className="w-16 h-1.5 bg-muted rounded-full mt-1"><div className={`h-full rounded-full ${goal.completed ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${goal.progress}%` }} /></div>
                            </div>
                            <button onClick={e => { e.stopPropagation(); handleDeleteGoal(goal.id); }} className="text-gray-600 hover:text-red-600 dark:hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                            {expandedGoalId === goal.id ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                          </div>
                        </div>
                      </div>
                      {expandedGoalId === goal.id && (
                        <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                          {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}
                          {goal.drills && goal.drills.length > 0 && (
                            <div>
                              <div className="text-xs text-muted-foreground mb-1.5">{language === 'ar' ? 'التمارين الموصى بها' : 'Recommended Drills'}</div>
                              <div className="flex flex-wrap gap-1.5">{goal.drills.map((d: string) => <span key={d} className="text-xs bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full">{d}</span>)}</div>
                            </div>
                          )}
                          <div>
                            <div className="text-xs text-muted-foreground mb-1.5">{language === 'ar' ? `تحديث التقدم: ${editingProgressId === goal.id ? progressValue : goal.progress}%` : `Update Progress: ${editingProgressId === goal.id ? progressValue : goal.progress}%`}</div>
                            <input type="range" min="0" max="100" value={editingProgressId === goal.id ? progressValue : goal.progress} onChange={e => { setEditingProgressId(goal.id); setProgressValue(Number(e.target.value)); }} className="w-full accent-green-500" />
                            {editingProgressId === goal.id && (
                              <button onClick={() => handleSaveProgress(goal.id)} disabled={updateProgressMutation.isPending} className="mt-2 px-4 py-1.5 bg-green-700 hover:bg-green-600 disabled:bg-muted rounded-lg text-xs font-medium text-white flex items-center gap-1.5">
                                {updateProgressMutation.isPending && <Loader2 size={12} className="animate-spin" />}
                                <Save size={12} /> {language === 'ar' ? 'حفظ التقدم' : 'Save Progress'}
                              </button>
                            )}
                          </div>
                                                  <GoalCommentsSection goalId={goal.id} language={language} commentText={goalCommentText[goal.id] || ''} setCommentText={(t) => setGoalCommentText(prev => ({ ...prev, [goal.id]: t }))} addComment={addGoalComment} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* TIMELINE TAB */}
            {activeTab === "timeline" && (
              <div className="bg-card rounded-xl border border-border p-5">
                <h3 className="text-sm font-semibold text-muted-foreground mb-4 flex items-center gap-2"><Calendar size={14} className="text-green-700 dark:text-green-400" /> {language === 'ar' ? 'الجدول الزمني للتقدم' : 'Progress Timeline'}</h3>
                {timelineEvents.length === 0 && <div className="text-center py-8 text-gray-600">{language === 'ar' ? 'لا توجد أهداف بعد' : 'No goals yet. Add goals to see the timeline.'}</div>}
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted" />
                  <div className="space-y-4">
                    {timelineEvents.map(event => (
                      <div key={event.id} className="flex gap-4 pl-10 relative">
                        <div className={`absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${event.completed ? "bg-green-500 border-green-500" : "bg-muted border-border"}`}>
                          {event.completed && <CheckCircle size={10} className="text-foreground" />}
                        </div>
                        <div className={`flex-1 p-3 rounded-lg border ${event.completed ? "bg-green-900/10 border-green-800/30" : "bg-muted/50 border-border"}`}>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">{event.title}</span>
                            <span className="text-xs text-muted-foreground">{event.date}</span>
                          </div>
                          {event.description && <p className="text-xs text-muted-foreground mt-1">{event.description}</p>}
                          <div className="mt-2 flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-muted rounded-full"><div className={`h-full rounded-full ${event.completed ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${event.progress}%` }} /></div>
                            <span className="text-xs text-muted-foreground">{event.progress}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STATS TAB */}
            {activeTab === "stats" && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  {ALL_CATEGORIES.map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    const catGoals = goals.filter((g: any) => g.category === cat);
                    const avgProgress = catGoals.length ? Math.round(catGoals.reduce((s: number, g: any) => s + g.progress, 0) / catGoals.length) : 0;
                    const completed = catGoals.filter((g: any) => g.completed).length;
                    return (
                      <div key={cat} className={`bg-card rounded-xl border ${cfg.border} p-4`}>
                        <div className={`text-xs font-medium ${cfg.color} mb-2 flex items-center gap-1.5`}><cfg.icon size={12} /> {cfg.label}</div>
                        <div className={`text-3xl font-bold ${cfg.color}`}>{avgProgress}%</div>
                        <div className="text-xs text-muted-foreground mt-1">{language === 'ar' ? 'متوسط التقدم' : 'Avg Progress'}</div>
                        <div className="mt-3 text-xs text-muted-foreground">{completed}/{catGoals.length} {language === 'ar' ? 'أهداف مكتملة' : 'goals complete'}</div>
                        <div className="mt-2 h-1.5 bg-muted rounded-full"><div className={`h-full rounded-full ${cat === "physical" ? "bg-orange-500" : cat === "tactical" ? "bg-blue-500" : cat === "mental" ? "bg-purple-500" : "bg-green-500"}`} style={{ width: `${avgProgress}%` }} /></div>
                      </div>
                    );
                  })}
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">{language === 'ar' ? 'توزيع الأولويات' : 'Priority Breakdown'}</h3>
                  <div className="space-y-2">
                    {(["high", "medium", "low"] as const).map(p => {
                      const count = goals.filter((g: any) => g.priority === p).length;
                      const pct = totalGoals ? Math.round((count / totalGoals) * 100) : 0;
                      return (
                        <div key={p} className="flex items-center gap-3">
                          <span className={`text-xs w-14 ${PRIORITY_COLORS[p].split(" ")[1]}`}>{p}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full"><div className={`h-full rounded-full ${p === "high" ? "bg-red-500" : p === "medium" ? "bg-yellow-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} /></div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2"><Clock size={14} /> {language === 'ar' ? 'المواعيد النهائية القادمة' : 'Upcoming Deadlines'}</h3>
                  <div className="space-y-2">
                    {goals.filter((g: any) => !g.completed && g.targetDate).sort((a: any, b: any) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime()).slice(0, 5).map((g: any) => (
                      <div key={g.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{g.title}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock size={10} /> {g.targetDate}</span>
                      </div>
                    ))}
                    {goals.filter((g: any) => !g.completed && g.targetDate).length === 0 && <div className="text-gray-600 text-sm">{language === 'ar' ? 'لا توجد مواعيد نهائية' : 'No upcoming deadlines.'}</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* GROUP MODE */}
        {mode === "group" && (
          <div className="flex-1">
            {showCreateGroup && (
              <div className="bg-card rounded-xl border border-blue-700/40 p-5 mb-4">
                <div className="flex items-center justify-between mb-4"><h3 className="text-base font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2"><Users size={16} /> {language === 'ar' ? 'إنشاء خطة تطوير جماعية' : 'Create Group Development Plan'}</h3><button onClick={() => setShowCreateGroup(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button></div>
                <input placeholder={language === 'ar' ? 'اسم المجموعة' : 'Group name (e.g. U-17 Defenders)'} value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground mb-3" />
                <div className="text-xs text-muted-foreground mb-2">{language === 'ar' ? `اختر اللاعبين (${selectedGroupPlayerIds.length} مختار):` : `Select players (${selectedGroupPlayerIds.length} selected):`}</div>
                <div className="max-h-48 overflow-y-auto space-y-1 mb-4">
                  {basePlayerList.map((player: any) => (
                    <label key={player.id} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted cursor-pointer">
                      <input type="checkbox" checked={selectedGroupPlayerIds.includes(player.id)} onChange={e => { if (e.target.checked) setSelectedGroupPlayerIds(prev => [...prev, player.id]); else setSelectedGroupPlayerIds(prev => prev.filter(id => id !== player.id)); }} className="accent-blue-500" />
                      <span className="text-sm text-foreground">{getPlayerName(player)}</span>
                      <span className="text-xs text-muted-foreground capitalize ml-auto">{player.position}</span>
                    </label>
                  ))}
                  {basePlayerList.length === 0 && <div className="text-muted-foreground text-sm text-center py-4">{language === 'ar' ? 'لا يوجد لاعبون' : 'No players match current filters'}</div>}
                </div>
                <button onClick={createGroupPlan} disabled={!newGroupName || selectedGroupPlayerIds.length === 0} className="w-full py-2 bg-blue-700 hover:bg-blue-600 disabled:bg-muted rounded-lg text-sm font-medium text-white">{language === 'ar' ? 'إنشاء الخطة الجماعية' : 'Create Group Plan'}</button>
              </div>
            )}

            {!selectedGroupId && !showCreateGroup && (
              <div className="flex-1 flex items-center justify-center h-64">
                <div className="text-center">
                  <Users size={48} className="text-gray-700 mx-auto mb-4" />
                  <h3 className="text-muted-foreground text-lg font-semibold mb-2">{language === 'ar' ? 'لا توجد مجموعة مختارة' : 'No Group Selected'}</h3>
                  <p className="text-gray-600 text-sm mb-4">{language === 'ar' ? 'أنشئ خطة تطوير جماعية' : 'Create a group development plan for multiple players'}</p>
                  <button onClick={() => setShowCreateGroup(true)} className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium text-white flex items-center gap-2 mx-auto"><Plus size={14} /> {language === 'ar' ? 'إنشاء خطة جماعية' : 'Create Group Plan'}</button>
                </div>
              </div>
            )}

            {selectedGroup && (
              <div className="space-y-5">
                <div className="bg-card rounded-xl border border-border p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-foreground flex items-center gap-2"><Users size={20} className="text-blue-600 dark:text-blue-400" /> {selectedGroup.name}</h2>
                      <p className="text-muted-foreground text-sm mt-1">{selectedGroup.playerIds.length} {language === 'ar' ? 'لاعبين' : 'players'} · {selectedGroup.goals.length} {language === 'ar' ? 'أهداف مشتركة' : 'shared goals'}</p>
                    </div>
                    <button onClick={() => setShowAddGroupGoal(true)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium text-white"><Plus size={14} /> {language === 'ar' ? 'إضافة هدف' : 'Add Goal'}</button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedGroup.playerIds.map(pid => {
                      const p = (allPlayers as any[])?.find((pl: any) => pl.id === pid);
                      return p ? <span key={pid} className="text-xs bg-muted text-muted-foreground border border-border px-2.5 py-1 rounded-full">{getPlayerName(p)}</span> : null;
                    })}
                  </div>
                </div>

                <div className="flex gap-2">
                  {(["physical", "tactical", "mental"] as const).map(cat => {
                    const cfg = CATEGORY_CONFIG[cat];
                    return (
                      <button key={cat} onClick={() => setGroupGoalCategory(cat)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${groupGoalCategory === cat ? `${cfg.bg} ${cfg.border} ${cfg.color}` : "bg-card border-border text-muted-foreground hover:text-foreground"}`}>
                        <cfg.icon size={14} /> {cfg.label}
                        <span className={`text-xs px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{selectedGroup.goals.filter(g => g.category === cat).length}</span>
                      </button>
                    );
                  })}
                </div>

                {showAddGroupGoal && (
                  <div className="bg-card rounded-xl border border-blue-700/40 p-4">
                    <div className="flex items-center justify-between mb-3"><h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400">{language === 'ar' ? `هدف جماعي جديد (${CATEGORY_CONFIG[groupGoalCategory].label})` : `New Group Goal (${CATEGORY_CONFIG[groupGoalCategory].label})`}</h3><button onClick={() => setShowAddGroupGoal(false)} className="text-muted-foreground hover:text-foreground"><X size={14} /></button></div>
                    <div className="grid grid-cols-2 gap-3">
                      <input placeholder={language === 'ar' ? 'عنوان الهدف' : 'Goal title'} value={newGroupGoal.title} onChange={e => setNewGroupGoal(p => ({ ...p, title: e.target.value }))} className="col-span-2 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                      <input placeholder={language === 'ar' ? 'الوصف' : 'Description'} value={newGroupGoal.description} onChange={e => setNewGroupGoal(p => ({ ...p, description: e.target.value }))} className="col-span-2 bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                      <input type="date" value={newGroupGoal.targetDate} onChange={e => setNewGroupGoal(p => ({ ...p, targetDate: e.target.value }))} className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground" />
                      <select value={newGroupGoal.priority} onChange={e => setNewGroupGoal(p => ({ ...p, priority: e.target.value as any }))} className="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                        <option value="high">{language === 'ar' ? 'أولوية عالية' : 'High Priority'}</option>
                        <option value="medium">{language === 'ar' ? 'أولوية متوسطة' : 'Medium Priority'}</option>
                        <option value="low">{language === 'ar' ? 'أولوية منخفضة' : 'Low Priority'}</option>
                      </select>
                    </div>
                    <button onClick={addGroupGoal} className="mt-3 w-full py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium text-white">{language === 'ar' ? 'إضافة الهدف للمجموعة' : 'Add Goal to Group'}</button>
                  </div>
                )}

                <div className="space-y-3">
                  {selectedGroup.goals.filter(g => g.category === groupGoalCategory).length === 0 && <div className="text-center py-8 text-gray-600">{language === 'ar' ? `لا توجد أهداف ${CATEGORY_CONFIG[groupGoalCategory].label} لهذه المجموعة بعد` : `No ${CATEGORY_CONFIG[groupGoalCategory].label} goals for this group yet.`}</div>}
                  {selectedGroup.goals.filter(g => g.category === groupGoalCategory).map(goal => (
                    <div key={goal.id} className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-foreground">{goal.title}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{goal.description}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[goal.priority]}`}>{goal.priority}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar size={10} /> {goal.targetDate}</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1"><span>{language === 'ar' ? 'تقدم المجموعة' : 'Group Progress'}</span><span>{goal.progress}%</span></div>
                        <input type="range" min="0" max="100" value={goal.progress} onChange={e => { const val = Number(e.target.value); setGroupPlans(prev => prev.map(g => g.id === selectedGroupId ? { ...g, goals: g.goals.map(gl => gl.id === goal.id ? { ...gl, progress: val, completed: val === 100 } : gl) } : g)); }} className="w-full accent-blue-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

function GoalCommentsSection({ goalId, language, commentText, setCommentText, addComment }: {
  goalId: number;
  language: string;
  commentText: string;
  setCommentText: (t: string) => void;
  addComment: any;
}) {
  const { data: comments = [] } = trpc.goalComments.getByGoal.useQuery({ goalId });
  const isRTL = language === 'ar';
  return (
    <div className="mt-3 border-t border-border pt-3 space-y-2">
      <div className="text-xs text-muted-foreground font-medium">💬 {isRTL ? 'التعليقات' : 'Comments'}</div>
      {(comments as any[]).map((c: any) => (
        <div key={c.id} className="text-xs bg-muted rounded p-2">
          <span className="text-green-700 dark:text-green-400 font-medium">{c.firstName} {c.lastName}</span>
          <span className="text-muted-foreground ml-1 capitalize">({c.role})</span>
          <p className="text-muted-foreground mt-0.5">{c.comment}</p>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder={isRTL ? 'أضف تعليقاً...' : 'Add a comment...'}
          className="flex-1 text-xs bg-muted border border-border rounded px-2 py-1 text-foreground placeholder-gray-500 focus:outline-none focus:border-green-500"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && commentText.trim()) {
              addComment.mutate({ goalId, comment: commentText.trim() });
            }
          }}
        />
        <button
          onClick={() => commentText.trim() && addComment.mutate({ goalId, comment: commentText.trim() })}
          disabled={!commentText.trim() || addComment.isPending}
          className="text-xs bg-green-700 hover:bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50"
        >
          {isRTL ? 'إرسال' : 'Send'}
        </button>
      </div>
    </div>
  );
}
