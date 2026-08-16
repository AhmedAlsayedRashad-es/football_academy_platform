import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Shield, Save, RefreshCw, CheckCircle, XCircle,
  ChevronDown, ChevronRight, Eye, EyeOff, Settings, Users,
  LayoutDashboard, Trophy, Activity, Calendar, Swords, Video,
  BarChart3, Brain, Heart, GraduationCap, MessageSquare, Target,
  Zap, ClipboardList, BookOpen, Globe, Gamepad2, GitCompare,
  Map, Network, TrendingUp, FileText, UserCircle, Gift, Flame,
  UserCog, UserCheck, Stethoscope, BellRing, CalendarClock,
  Tag, Pencil, Film, Camera, Star, CheckSquare, CreditCard,
  Play, Users2, Dumbbell, Apple, Satellite, Award, Copy, UserPlus, Lock, Unlock
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

// ---- Replicate the same nav structure from DashboardLayout ----
const ALL_MODULES = [
  {
    id: 'dashboard', label: 'Dashboard',
    items: [
      { path: '/dashboard', label: 'Overview' },
      { path: '/coach-dashboard', label: 'Coach Dashboard' },
    ]
  },
  {
    id: 'main-team', label: 'Main Team',
    items: [
      { path: '/team-dashboard?team=main', label: 'Dashboard' },
      { path: '/players?team=main', label: 'Players' },
      { path: '/performance?team=main', label: 'Performance' },
      { path: '/training?team=main', label: 'Training' },
      { path: '/matches?team=main', label: 'Matches' },
      { path: '/videos?team=main', label: 'Videos' },
      { path: '/analytics?team=main', label: 'Analytics' },
      { path: '/professional-tactical-board?team=main', label: 'Tactics' },
      { path: '/ai-coach?team=main', label: 'Advanced Tools' },
      { path: '/team-management?team=main', label: 'Team Management' },
      { path: '/load-management?team=main', label: 'Load Management' },
      { path: '/training-session-recorder?team=main', label: 'Session Recorder' },
    ]
  },
  {
    id: 'academy-team', label: 'Academy Team',
    items: [
      { path: '/team-dashboard?team=academy', label: 'Dashboard' },
      { path: '/players?team=academy', label: 'Players' },
      { path: '/performance?team=academy', label: 'Performance' },
      { path: '/training?team=academy', label: 'Training' },
      { path: '/matches?team=academy', label: 'Matches' },
      { path: '/videos?team=academy', label: 'Videos' },
      { path: '/analytics?team=academy', label: 'Analytics' },
      { path: '/professional-tactical-board?team=academy', label: 'Tactics' },
      { path: '/ai-coach?team=academy', label: 'Advanced Tools' },
      { path: '/team-management?team=academy', label: 'Team Management' },
      { path: '/load-management?team=academy', label: 'Load Management' },
      { path: '/training-session-recorder?team=academy', label: 'Session Recorder' },
    ]
  },
  {
    id: 'players', label: 'Player Management',
    items: [
      { path: '/skill-assessment', label: 'Skill Assessment' },
      { path: '/coach/player-comparison', label: 'Player Comparison' },
      { path: '/attendance', label: 'Attendance Tracking' },
      { path: '/staff-attendance', label: 'Staff Attendance' },
      { path: '/player-card', label: 'Player Card' },
      { path: '/points-management', label: 'Points Management' },
      { path: '/enrollment', label: 'Academy Enrollment' },
      { path: '/enrollment-admin', label: 'Enrollment Review' },
      { path: '/player-full-report', label: 'Full Player Report' },
      { path: '/coach-registration', label: 'Coach Registration' },
      { path: '/player-documents', label: 'Player Documents' },
    ]
  },
  {
    id: 'training', label: 'Training',
    items: [
      { path: '/training', label: 'Training' },
      { path: '/training-library', label: 'Training Library' },
      { path: '/private-training', label: 'Private Training' },
      { path: '/my-bookings', label: 'My Bookings' },
      { path: '/coach-availability', label: 'Availability' },
      { path: '/talent-portal', label: 'Talent Portal' },
    ]
  },
  {
    id: 'matches', label: 'Match & Tactics',
    items: [
      { path: '/matches', label: 'Match Management' },
      { path: '/team-schedule', label: 'Match Schedule Calendar' },
      { path: '/coach/live-match', label: 'Live Match Mode' },
      { path: '/multi-match-comparison', label: 'Multi-Match Comparison' },
      { path: '/professional-tactical-board', label: 'Tactical Board' },
      { path: '/animated-tactical-board', label: 'Animated Tactics' },
      { path: '/formation-builder', label: 'Formation Builder' },
      { path: '/set-piece-designer', label: 'Set Piece Designer' },
      { path: '/set-piece-simulation', label: 'Set Piece Simulation' },
      { path: '/match-event-recording', label: 'Record Match Events' },
      { path: '/league', label: 'League Fixtures' },
      { path: '/coach-performance', label: 'Coach Performance' },
    ]
  },
  {
    id: 'video', label: 'Video Analysis',
    items: [
      { path: '/videos', label: 'Video Library' },
      { path: '/video-clip-library', label: 'Video Clips' },
      { path: '/ai-video-recommendations', label: 'AI Video Recommendations' },
      { path: '/coach/ai-video-analysis', label: 'AI Video Analysis (Coach)' },
      { path: '/video-analysis-player', label: 'AI Video Analysis (Player)' },
      { path: '/match-video-detection', label: 'Match Player Detection' },
      { path: '/match-video-tagger', label: 'Video Tagging & Timeline' },
      { path: '/video-telestration', label: 'Video Telestration' },
      { path: '/professional-heatmap', label: 'Heatmap Analysis' },
      { path: '/pass-network', label: 'Pass Network' },
    ]
  },
  {
    id: 'ai', label: 'Advanced Tools',
    items: [
      { path: '/ai-coach', label: 'AI Coach Assistant' },
      { path: '/ai-match-coach', label: 'AI Match Coach' },
      { path: '/ai-emergency-mode', label: 'AI Emergency Mode' },
      { path: '/coach/performance-prediction', label: 'Performance Prediction' },
      { path: '/coach/ai-calendar', label: 'AI Calendar' },
      { path: '/ai-formation-recommendation', label: 'AI Formation Advisor' },
      { path: '/features-hub', label: 'Features Hub' },
      { path: '/ai-formation-simulation', label: 'AI Formation Simulation' },
      { path: '/player-development-plan', label: 'Player Development AI' },
      { path: '/coach-selection-tool', label: 'Coach Selection Tool' },
      { path: '/player-scouting-report', label: 'Scouting Report' },
      { path: '/player-progress-dashboard', label: 'Player Progress' },
    ]
  },
  {
    id: 'analytics', label: 'Analytics & Reports',
    items: [
      { path: '/analytics', label: 'Performance Analytics' },
      { path: '/xg-analytics', label: 'xG Analytics' },
      { path: '/age-group-benchmarking', label: 'Age-Group Benchmarking' },
      { path: '/season-stats', label: 'Season Statistics' },
      { path: '/match-reports', label: 'Match Reports' },
      { path: '/coach/match-report-generator', label: 'AI Report Generator' },
    ]
  },
  {
    id: 'staff', label: 'Staff Tools',
    items: [
      { path: '/mental', label: 'Mental Coaching' },
      { path: '/physical', label: 'Physical Training' },
      { path: '/nutrition', label: 'Nutrition' },
      { path: '/nutrition-plan-assignment', label: 'Assign Nutrition Plan' },
      { path: '/coach/injury-tracking', label: 'Injury Tracking' },
      { path: '/gps-tracker', label: 'GPS Tracker' },
      { path: '/load-management', label: 'Load Management' },
      { path: '/training-session-recorder', label: 'Session Recorder' },
      { path: '/team-progress-comparison', label: 'Team Progress' },
      { path: '/drill-video-library', label: 'Drill Library' },
      { path: '/medical-status-dashboard', label: 'Medical Dashboard' },
      { path: '/medical-trends', label: 'Blood & InBody Trends' },
      { path: '/team-doctor', label: 'Team Doctor' },
      { path: '/full-player-report', label: 'Full Player Report' },
      { path: '/parent-notification-center', label: 'Parent Notifications' },
      { path: '/weekly-report-scheduler', label: 'Weekly Reports' },
    ]
  },
  {
    id: 'education', label: 'Education',
    items: [
      { path: '/coach-education/laws', label: 'Football Laws' },
      { path: '/coach-education/courses', label: 'Coaching Courses' },
      { path: '/coach-education/videos', label: 'Training Videos' },
      { path: '/coach-assessment', label: 'Coach Assessment' },
    ]
  },
  {
    id: 'community', label: 'Community',
    items: [
      { path: '/parent-portal', label: 'Parent Portal' },
      { path: '/forum', label: 'Forum' },
      { path: '/leaderboard', label: 'Leaderboard' },
      { path: '/rewards', label: 'Rewards' },
      { path: '/streak', label: 'Daily Streak' },
    ]
  },
  {
    id: 'admin', label: 'Admin',
    items: [
      { path: '/settings', label: 'Settings' },
      { path: '/user-management', label: 'User Management' },
      { path: '/admin/role-permissions', label: 'Role Permissions' },
      { path: '/admin/role-management', label: 'Role Management' },
      { path: '/admin/data-management', label: 'Data Management' },
      { path: '/admin/home-content', label: 'Home Content' },
      { path: '/admin/team-assignment', label: 'Team Assignment' },
      { path: '/admin/coach-assignment', label: 'Coach Assignment' },
      { path: '/admin/team-management', label: 'Team Management' },
      { path: '/admin/staff-management', label: 'Staff Management' },
      { path: '/staff-directory', label: 'Staff Directory' },
      { path: '/team-rosters', label: 'Team Rosters' },
    ]
  },
];

// Default permissions per role (used when no DB config exists)
const DEFAULT_PERMISSIONS: Record<string, { modules: Record<string, boolean>; items: Record<string, boolean> }> = {
  admin: {
    modules: Object.fromEntries(ALL_MODULES.map(m => [m.id, true])),
    items: Object.fromEntries(ALL_MODULES.flatMap(m => m.items.map(i => [i.path, true]))),
  },
  coach: {
    modules: Object.fromEntries(ALL_MODULES.map(m => [m.id, m.id !== 'admin'])),
    items: Object.fromEntries(ALL_MODULES.flatMap(m => m.items.map(i => [i.path, m.id !== 'admin']))),
  },
  assistant_coach: {
    modules: Object.fromEntries(ALL_MODULES.map(m => [m.id, ['dashboard', 'main-team', 'academy-team', 'players', 'training', 'matches', 'video', 'analytics', 'staff'].includes(m.id)])),
    items: Object.fromEntries(ALL_MODULES.flatMap(m => m.items.map(i => [i.path, ['dashboard', 'main-team', 'academy-team', 'players', 'training', 'matches', 'video', 'analytics', 'staff'].includes(m.id)]))),
  },
  nutritionist: {
    modules: Object.fromEntries(ALL_MODULES.map(m => [m.id, ['dashboard', 'players', 'staff', 'community'].includes(m.id)])),
    items: Object.fromEntries(ALL_MODULES.flatMap(m => m.items.map(i => [i.path, ['dashboard', 'players', 'staff', 'community'].includes(m.id)]))),
  },
  mental_coach: {
    modules: Object.fromEntries(ALL_MODULES.map(m => [m.id, ['dashboard', 'players', 'staff', 'community'].includes(m.id)])),
    items: Object.fromEntries(ALL_MODULES.flatMap(m => m.items.map(i => [i.path, ['dashboard', 'players', 'staff', 'community'].includes(m.id)]))),
  },
  physical_trainer: {
    modules: Object.fromEntries(ALL_MODULES.map(m => [m.id, ['dashboard', 'players', 'training', 'staff', 'community'].includes(m.id)])),
    items: Object.fromEntries(ALL_MODULES.flatMap(m => m.items.map(i => [i.path, ['dashboard', 'players', 'training', 'staff', 'community'].includes(m.id)]))),
  },
  doctor: {
    modules: Object.fromEntries(ALL_MODULES.map(m => [m.id, ['dashboard', 'players', 'staff'].includes(m.id)])),
    items: Object.fromEntries(ALL_MODULES.flatMap(m => m.items.map(i => [i.path, ['dashboard', 'players', 'staff'].includes(m.id)]))),
  },
  parent: {
    modules: Object.fromEntries(ALL_MODULES.map(m => [m.id, ['dashboard', 'community'].includes(m.id)])),
    items: Object.fromEntries(ALL_MODULES.flatMap(m => m.items.map(i => [i.path, ['dashboard', 'community'].includes(m.id)]))),
  },
  player: {
    modules: Object.fromEntries(ALL_MODULES.map(m => [m.id, ['dashboard', 'training', 'community'].includes(m.id)])),
    items: Object.fromEntries(ALL_MODULES.flatMap(m => m.items.map(i => [i.path, ['dashboard', 'training', 'community'].includes(m.id)]))),
  },
};

// Inheritance map: which role each role inherits from as base
const ROLE_INHERITANCE: Record<string, string | null> = {
  admin: null,
  coach: null,
  assistant_coach: 'coach',
  nutritionist: null,
  mental_coach: null,
  physical_trainer: 'coach',
  doctor: null,
  parent: null,
  player: null,
};

const ROLES = [
  { id: 'admin', label: 'Admin', color: 'bg-red-600', desc: 'Full platform access' },
  { id: 'coach', label: 'Head Coach', color: 'bg-blue-600', desc: 'All coaching tools' },
  { id: 'assistant_coach', label: 'Assistant Coach', color: 'bg-blue-500', desc: 'Training & match tools' },
  { id: 'nutritionist', label: 'Nutritionist', color: 'bg-green-600', desc: 'Nutrition & player health' },
  { id: 'mental_coach', label: 'Mental Coach', color: 'bg-purple-600', desc: 'Mental coaching tools' },
  { id: 'physical_trainer', label: 'Physical Trainer', color: 'bg-orange-600', desc: 'Physical training tools' },
  { id: 'doctor', label: 'Team Doctor', color: 'bg-pink-600', desc: 'Medical & injury tools' },
  { id: 'parent', label: 'Parent', color: 'bg-yellow-600', desc: 'Child progress & portal' },
  { id: 'player', label: 'Player', color: 'bg-teal-600', desc: 'Personal dashboard & training' },
];

type Config = { modules: Record<string, boolean>; items: Record<string, boolean> };
type UserOverride = { userId: number; userName: string; role: string; grantedPaths: string[]; revokedPaths: string[] };

export default function RolePermissionManager() {
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [mainTab, setMainTab] = useState('roles');
  const [selectedRole, setSelectedRole] = useState('coach');
  const [configs, setConfigs] = useState<Record<string, Config>>({});
  const [expandedModules, setExpandedModules] = useState<string[]>(['dashboard']);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [userOverrides, setUserOverrides] = useState<UserOverride[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedOverrideUser, setSelectedOverrideUser] = useState<UserOverride | null>(null);

  const { data: allPermissions, refetch } = trpc.rolePermissions.getAll.useQuery();
  const upsertMutation = trpc.rolePermissions.upsert.useMutation();
  const resetMutation = trpc.rolePermissions.reset.useMutation();
  const { data: allUsers } = trpc.users.getAll.useQuery();

  // Load DB configs into local state, falling back to defaults
  useEffect(() => {
    const dbConfigs: Record<string, Config> = {};
    if (allPermissions) {
      for (const row of allPermissions as any[]) {
        dbConfigs[row.role] = row.config as Config;
      }
    }
    // Merge with defaults for roles not yet in DB
    const merged: Record<string, Config> = {};
    for (const role of ROLES) {
      merged[role.id] = dbConfigs[role.id] || DEFAULT_PERMISSIONS[role.id] || { modules: {}, items: {} };
    }
    setConfigs(merged);
    setHasChanges(false);
  }, [allPermissions]);

  const currentConfig = configs[selectedRole] || { modules: {}, items: {} };

  const toggleModule = (moduleId: string, enabled: boolean) => {
    const module = ALL_MODULES.find(m => m.id === moduleId);
    if (!module) return;
    setConfigs(prev => {
      const cfg = { ...prev[selectedRole] };
      cfg.modules = { ...cfg.modules, [moduleId]: enabled };
      // Toggle all items in the module too
      const newItems = { ...cfg.items };
      for (const item of module.items) {
        newItems[item.path] = enabled;
      }
      cfg.items = newItems;
      return { ...prev, [selectedRole]: cfg };
    });
    setHasChanges(true);
  };

  const toggleItem = (path: string, enabled: boolean) => {
    setConfigs(prev => {
      const cfg = { ...prev[selectedRole] };
      cfg.items = { ...cfg.items, [path]: enabled };
      // Update module state: enabled if any item is enabled
      const module = ALL_MODULES.find(m => m.items.some(i => i.path === path));
      if (module) {
        const anyEnabled = module.items.some(i => (i.path === path ? enabled : cfg.items[i.path]));
        cfg.modules = { ...cfg.modules, [module.id]: anyEnabled };
      }
      return { ...prev, [selectedRole]: cfg };
    });
    setHasChanges(true);
  };

  // Inheritance: copy config from parent role
  const inheritFromParent = () => {
    const parentRole = ROLE_INHERITANCE[selectedRole];
    if (!parentRole) return;
    const parentConfig = configs[parentRole];
    if (!parentConfig) return;
    setConfigs(prev => ({ ...prev, [selectedRole]: { ...parentConfig } }));
    setHasChanges(true);
    toast({ title: `Inherited from ${parentRole}`, description: 'You can now customize further.' });
  };

  const enableAll = () => {
    setConfigs(prev => ({
      ...prev,
      [selectedRole]: {
        modules: Object.fromEntries(ALL_MODULES.map(m => [m.id, true])),
        items: Object.fromEntries(ALL_MODULES.flatMap(m => m.items.map(i => [i.path, true]))),
      }
    }));
    setHasChanges(true);
  };

  const disableAll = () => {
    setConfigs(prev => ({
      ...prev,
      [selectedRole]: {
        modules: Object.fromEntries(ALL_MODULES.map(m => [m.id, false])),
        items: Object.fromEntries(ALL_MODULES.flatMap(m => m.items.map(i => [i.path, false]))),
      }
    }));
    setHasChanges(true);
  };

  const resetToDefault = async () => {
    const def = DEFAULT_PERMISSIONS[selectedRole];
    if (!def) return;
    setConfigs(prev => ({ ...prev, [selectedRole]: def }));
    setHasChanges(true);
    try {
      await resetMutation.mutateAsync({ role: selectedRole as any });
      toast({ title: 'Reset to defaults', description: `${selectedRole} permissions reset.` });
      refetch();
    } catch {
      toast({ title: 'Reset failed', variant: 'destructive' });
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await upsertMutation.mutateAsync({
        role: selectedRole as any,
        config: currentConfig,
      });
      setHasChanges(false);
      toast({ title: 'Permissions saved!', description: `${selectedRole} navigation permissions updated.` });
      refetch();
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const getModuleStats = (moduleId: string) => {
    const module = ALL_MODULES.find(m => m.id === moduleId);
    if (!module) return { enabled: 0, total: 0 };
    const enabled = module.items.filter(i => currentConfig.items[i.path]).length;
    return { enabled, total: module.items.length };
  };

  const toggleModuleExpand = (moduleId: string) => {
    setExpandedModules(prev =>
      prev.includes(moduleId) ? prev.filter(id => id !== moduleId) : [...prev, moduleId]
    );
  };

  const totalEnabled = Object.values(currentConfig.items).filter(Boolean).length;
  const totalItems = ALL_MODULES.flatMap(m => m.items).length;

  return (
    <div className="text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield size={22} className="text-blue-600 dark:text-blue-400" />
                Role Permission Manager
              </h1>
              <p className="text-muted-foreground text-sm">Control which navigation tabs each role can access</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge className="bg-yellow-700 text-white text-xs">Unsaved changes</Badge>
            )}
            <Button size="sm" variant="outline" onClick={resetToDefault} className="border-border text-muted-foreground text-xs">
              <RefreshCw size={12} className="mr-1" /> Reset to Default
            </Button>
            <Button size="sm" onClick={saveConfig} disabled={saving || !hasChanges} className="bg-blue-700 hover:bg-blue-600 text-white text-xs">
              <Save size={12} className="mr-1" /> {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="max-w-7xl mx-auto px-6 pt-4">
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="roles" className="data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-300 text-muted-foreground">
              <Shield size={14} className="mr-1.5" /> Role Permissions
            </TabsTrigger>
            <TabsTrigger value="inheritance" className="data-[state=active]:bg-purple-900/40 data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-300 text-muted-foreground">
              <Copy size={14} className="mr-1.5" /> Inheritance
            </TabsTrigger>
            <TabsTrigger value="overrides" className="data-[state=active]:bg-yellow-900/40 data-[state=active]:text-yellow-700 dark:data-[state=active]:text-yellow-300 text-muted-foreground">
              <UserPlus size={14} className="mr-1.5" /> Per-User Overrides
            </TabsTrigger>
          </TabsList>

          {/* ===== INHERITANCE TAB ===== */}
          <TabsContent value="inheritance" className="mt-4 pb-8">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-foreground font-bold text-lg flex items-center gap-2">
                  <Copy size={18} className="text-purple-600 dark:text-purple-400" /> Role Inheritance
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Copy permissions from a parent role as a starting point, then customize further.
                  This does not create a live link — it's a one-time copy.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ROLES.filter(r => ROLE_INHERITANCE[r.id]).map(role => {
                  const parentId = ROLE_INHERITANCE[role.id]!;
                  const parent = ROLES.find(r => r.id === parentId);
                  return (
                    <div key={role.id} className="bg-muted rounded-lg p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${role.color}`} />
                        <div>
                          <p className="text-foreground font-medium text-sm">{role.label}</p>
                          <p className="text-muted-foreground text-xs">inherits from <span className="text-purple-600 dark:text-purple-400">{parent?.label}</span></p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => { setSelectedRole(role.id); inheritFromParent(); setMainTab('roles'); }}
                        className="bg-purple-800 hover:bg-purple-700 text-white text-xs"
                      >
                        <Copy size={12} className="mr-1" /> Copy from {parent?.label}
                      </Button>
                    </div>
                  );
                })}
              </div>
              <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
                <p className="font-medium text-muted-foreground mb-1">How inheritance works:</p>
                <p>1. Click "Copy from [Parent Role]" to copy that role's current permission config to the child role.</p>
                <p>2. Switch to the Role Permissions tab to fine-tune the copied config.</p>
                <p>3. Save the changes. The child role will now have its own independent config.</p>
              </div>
            </div>
          </TabsContent>

          {/* ===== PER-USER OVERRIDES TAB ===== */}
          <TabsContent value="overrides" className="mt-4 pb-8">
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-foreground font-bold text-lg flex items-center gap-2">
                  <UserPlus size={18} className="text-yellow-700 dark:text-yellow-400" /> Per-User Page Overrides
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Grant or revoke specific pages for individual users, overriding their role's default config.
                  This is stored in the user's profile and takes precedence over role permissions.
                </p>
              </div>
              <div className="bg-yellow-900/20 border border-yellow-700/30 rounded-lg p-3 text-sm text-yellow-700 dark:text-yellow-300">
                <strong>Note:</strong> Per-user overrides are applied on top of role permissions.
                A granted page will be visible even if the role has it disabled.
                A revoked page will be hidden even if the role has it enabled.
              </div>
              {/* User search */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Search User</label>
                <Input
                  placeholder="Type a name or email..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="bg-muted border-border text-foreground max-w-sm"
                />
              </div>
              {/* User list */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {(allUsers as any[] || []).filter((u: any) =>
                  !userSearch || `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
                ).slice(0, 20).map((u: any) => (
                  <div key={u.id} className="bg-muted rounded-lg p-3 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-foreground text-sm font-medium">{u.firstName} {u.lastName}</p>
                      <p className="text-muted-foreground text-xs">{u.email} · <span className="text-blue-600 dark:text-blue-400">{u.role}</span></p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => setSelectedOverrideUser({ userId: u.id, userName: `${u.firstName} ${u.lastName}`, role: u.role, grantedPaths: [], revokedPaths: [] })}
                      className="bg-yellow-700 hover:bg-yellow-600 text-black text-xs"
                    >
                      <Settings size={12} className="mr-1" /> Configure
                    </Button>
                  </div>
                ))}
              </div>
              {/* Override editor */}
              {selectedOverrideUser && (
                <div className="bg-muted rounded-xl p-4 space-y-3 border border-yellow-700/30">
                  <div className="flex items-center justify-between">
                    <h3 className="text-foreground font-semibold">{selectedOverrideUser.userName} — Override Config</h3>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedOverrideUser(null)} className="text-muted-foreground">
                      <XCircle size={14} />
                    </Button>
                  </div>
                  <p className="text-muted-foreground text-xs">Role: <span className="text-blue-600 dark:text-blue-400">{selectedOverrideUser.role}</span> · Select pages to grant (green) or revoke (red)</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {ALL_MODULES.flatMap(m => m.items).map(item => {
                      const isGranted = selectedOverrideUser.grantedPaths.includes(item.path);
                      const isRevoked = selectedOverrideUser.revokedPaths.includes(item.path);
                      return (
                        <div key={item.path} className="flex gap-1">
                          <button
                            onClick={() => setSelectedOverrideUser(prev => prev ? {
                              ...prev,
                              grantedPaths: isGranted ? prev.grantedPaths.filter(p => p !== item.path) : [...prev.grantedPaths.filter(p => p !== item.path), item.path],
                              revokedPaths: prev.revokedPaths.filter(p => p !== item.path),
                            } : prev)}
                            className={`flex-1 flex items-center gap-1.5 p-2 rounded-lg text-xs transition-colors ${
                              isGranted ? 'bg-green-900/40 border border-green-700/50 text-green-700 dark:text-green-300' : 'bg-muted border border-border text-muted-foreground hover:border-green-700/50'
                            }`}
                          >
                            <Unlock size={10} className={isGranted ? 'text-green-700 dark:text-green-400' : 'text-gray-600'} />
                            <span className="truncate">{item.label}</span>
                          </button>
                          <button
                            onClick={() => setSelectedOverrideUser(prev => prev ? {
                              ...prev,
                              revokedPaths: isRevoked ? prev.revokedPaths.filter(p => p !== item.path) : [...prev.revokedPaths.filter(p => p !== item.path), item.path],
                              grantedPaths: prev.grantedPaths.filter(p => p !== item.path),
                            } : prev)}
                            className={`p-2 rounded-lg text-xs transition-colors ${
                              isRevoked ? 'bg-red-900/40 border border-red-700/50 text-red-600 dark:text-red-300' : 'bg-muted border border-border text-muted-foreground hover:border-red-700/50'
                            }`}
                          >
                            <Lock size={10} className={isRevoked ? 'text-red-600 dark:text-red-400' : 'text-gray-600'} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        toast({ title: 'Overrides saved (UI demo)', description: `${selectedOverrideUser.grantedPaths.length} granted, ${selectedOverrideUser.revokedPaths.length} revoked for ${selectedOverrideUser.userName}` });
                        setSelectedOverrideUser(null);
                      }}
                      className="bg-yellow-700 hover:bg-yellow-600 text-black"
                    >
                      <Save size={12} className="mr-1" /> Save Overrides
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedOverrideUser(null)} className="text-muted-foreground">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ===== ROLE PERMISSIONS TAB ===== */}
          <TabsContent value="roles" className="mt-4">
      <div className="px-0 py-2 flex flex-col md:flex-row gap-4 md:gap-6">
        {/* Role Selector Panel */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-card rounded-xl border border-border p-4 sticky top-24">
            <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
              <Users size={14} className="text-blue-600 dark:text-blue-400" /> Roles
            </h3>
            <div className="space-y-1.5">
              {ROLES.map(role => {
                const dbRow = (allPermissions as any[] || []).find((r: any) => r.role === role.id);
                const isCustomized = !!dbRow;
                return (
                  <button
                    key={role.id}
                    onClick={() => { setSelectedRole(role.id); setHasChanges(false); }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedRole === role.id
                        ? 'bg-blue-900/40 border border-blue-700/50'
                        : 'bg-muted hover:bg-muted border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${role.color}`} />
                        <span className="text-sm font-medium text-foreground">{role.label}</span>
                      </div>
                      {isCustomized && (
                        <Badge className="bg-green-900/40 text-green-700 dark:text-green-400 border border-green-700/40 text-xs px-1.5 py-0">Custom</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-4">{role.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Permission Grid */}
        <div className="flex-1 min-w-0">
          {/* Role Header */}
          <div className="bg-card rounded-xl border border-border p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${ROLES.find(r => r.id === selectedRole)?.color || 'bg-muted'} flex items-center justify-center`}>
                  <Shield size={18} className="text-foreground" />
                </div>
                <div>
                  <h2 className="text-foreground font-bold">{ROLES.find(r => r.id === selectedRole)?.label} Permissions</h2>
                  <p className="text-muted-foreground text-xs">{totalEnabled} / {totalItems} pages enabled</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={enableAll} className="bg-green-800 hover:bg-green-700 text-white text-xs">
                  <Eye size={12} className="mr-1" /> Enable All
                </Button>
                <Button size="sm" onClick={disableAll} className="bg-red-900 hover:bg-red-800 text-white text-xs">
                  <EyeOff size={12} className="mr-1" /> Disable All
                </Button>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-3">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${totalItems > 0 ? (totalEnabled / totalItems) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{Math.round(totalItems > 0 ? (totalEnabled / totalItems) * 100 : 0)}% of pages accessible</p>
            </div>
          </div>

          {/* Module Cards */}
          <div className="space-y-3">
            {ALL_MODULES.map(module => {
              const { enabled, total } = getModuleStats(module.id);
              const moduleEnabled = currentConfig.modules[module.id] ?? false;
              const isExpanded = expandedModules.includes(module.id);

              return (
                <div key={module.id} className={`bg-card rounded-xl border transition-colors ${
                  moduleEnabled ? 'border-border' : 'border-border opacity-70'
                }`}>
                  {/* Module Header */}
                  <div className="flex items-center gap-3 p-4">
                    {/* Module Toggle */}
                    <button
                      onClick={() => toggleModule(module.id, !moduleEnabled)}
                      className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${moduleEnabled ? 'bg-blue-600' : 'bg-muted'}`}
                    >
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${moduleEnabled ? 'left-6' : 'left-1'}`} />
                    </button>

                    {/* Module Name & Stats */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold text-sm ${moduleEnabled ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {module.label}
                        </span>
                        <Badge className={`text-xs px-1.5 py-0 ${
                          enabled === total ? 'bg-green-900/40 text-green-700 dark:text-green-400 border border-green-700/40' :
                          enabled > 0 ? 'bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border border-yellow-700/40' :
                          'bg-muted text-muted-foreground border border-border'
                        }`}>
                          {enabled}/{total}
                        </Badge>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleModuleExpand(module.id)}
                      className="text-muted-foreground hover:text-foreground p-1"
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>

                  {/* Items Grid */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-border pt-3">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {module.items.map(item => {
                          const itemEnabled = currentConfig.items[item.path] ?? false;
                          return (
                            <button
                              key={item.path}
                              onClick={() => toggleItem(item.path, !itemEnabled)}
                              className={`flex items-center gap-2 p-2.5 rounded-lg text-left transition-colors text-xs ${
                                itemEnabled
                                  ? 'bg-blue-900/30 border border-blue-700/40 text-blue-600 dark:text-blue-300'
                                  : 'bg-muted border border-border text-muted-foreground hover:border-border'
                              }`}
                            >
                              {itemEnabled
                                ? <CheckCircle size={12} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                : <XCircle size={12} className="text-gray-600 flex-shrink-0" />
                              }
                              <span className="truncate">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
