import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Calendar, Clock, MapPin, Users, Plus, Trash2, Edit2, ArrowLeft,
  RefreshCw, CheckCircle, Target, Dumbbell, Brain, Zap, Shield, Activity
} from "lucide-react";

const SESSION_TYPES = [
  { value: "technical", label: "Technical", icon: Zap, color: "bg-blue-500" },
  { value: "tactical", label: "Tactical", icon: Brain, color: "bg-purple-500" },
  { value: "physical", label: "Physical", icon: Dumbbell, color: "bg-orange-500" },
  { value: "match", label: "Match", icon: Target, color: "bg-red-500" },
  { value: "recovery", label: "Recovery", icon: Activity, color: "bg-green-500" },
  { value: "mixed", label: "Mixed", icon: Shield, color: "bg-gray-500" },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TrainingSessionManager() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"list" | "create" | "recurring">("list");
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>();
  const [editingSession, setEditingSession] = useState<any>(null);

  // Single session form
  const [form, setForm] = useState({
    title: "",
    description: "",
    sessionDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "11:00",
    location: "Future Stars FC Training Ground",
    sessionType: "technical" as const,
    objectives: "",
  });

  // Recurring session form
  const [recurringForm, setRecurringForm] = useState({
    title: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    daysOfWeek: [1, 3] as number[], // Mon, Wed
    startTime: "09:00",
    endTime: "11:00",
    location: "Future Stars FC Training Ground",
    sessionType: "technical" as const,
    objectives: "",
  });

  const { data: teams = [] } = trpc.teams.getAll.useQuery();
  const { data: sessions = [], refetch } = trpc.training.getAll.useQuery({
    teamId: selectedTeamId,
    limit: 100,
  });

  const createSession = trpc.training.create.useMutation({
    onSuccess: () => {
      toast({ title: "Session Created", description: "Training session added successfully" });
      refetch();
      setActiveTab("list");
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const createBulk = trpc.training.createBulk.useMutation({
    onSuccess: (result) => {
      toast({
        title: `✅ ${result.count} Sessions Created`,
        description: `Recurring training schedule set up successfully`,
      });
      refetch();
      setActiveTab("list");
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteSession = trpc.training.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Session Deleted" });
      refetch();
    },
  });

  const updateSession = trpc.training.update.useMutation({
    onSuccess: () => {
      toast({ title: "Session Updated" });
      setEditingSession(null);
      refetch();
    },
  });

  const handleCreateSingle = () => {
    createSession.mutate({
      ...form,
      teamId: selectedTeamId,
    });
  };

  const handleCreateRecurring = () => {
    if (recurringForm.daysOfWeek.length === 0) {
      toast({ title: "Error", description: "Select at least one day of the week", variant: "destructive" });
      return;
    }
    createBulk.mutate({
      ...recurringForm,
      teamId: selectedTeamId,
    });
  };

  const toggleDay = (day: number) => {
    setRecurringForm(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort(),
    }));
  };

  const groupedSessions = sessions.reduce((acc: Record<string, any[]>, session) => {
    const date = new Date(session.sessionDate).toLocaleDateString("en-GB", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  const getTypeConfig = (type: string) => SESSION_TYPES.find(t => t.value === type) || SESSION_TYPES[5];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate("/coach/training-planner")}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Training Planner</span>
            </button>
            <h1 className="text-2xl font-bold text-foreground">Training Session Manager</h1>
            <p className="text-muted-foreground text-sm">Create, edit, and manage recurring training schedules</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("create")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" /> Single Session
            </button>
            <button
              onClick={() => setActiveTab("recurring")}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Recurring Schedule
            </button>
          </div>
        </div>

        {/* Team Filter */}
        <div className="flex items-center gap-3">
          <label className="text-muted-foreground text-sm">Filter by Team:</label>
          <select
            value={selectedTeamId || ""}
            onChange={(e) => setSelectedTeamId(e.target.value ? parseInt(e.target.value) : undefined)}
            className="px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
          >
            <option value="">All Teams</option>
            {teams.map((team: any) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          <span className="text-muted-foreground text-sm">{sessions.length} sessions</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border pb-2">
          {[
            { id: "list", label: "Session List" },
            { id: "create", label: "Create Single" },
            { id: "recurring", label: "Recurring Schedule" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-muted text-foreground border-b-2 border-red-500"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Session List */}
        {activeTab === "list" && (
          <div className="space-y-4">
            {Object.keys(groupedSessions).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg">No training sessions scheduled</p>
                <p className="text-sm mt-1">Create a single session or set up a recurring schedule</p>
              </div>
            ) : (
              Object.entries(groupedSessions).map(([date, dateSessions]) => (
                <div key={date}>
                  <h3 className="text-muted-foreground text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {date}
                  </h3>
                  <div className="space-y-2">
                    {dateSessions.map((session: any) => {
                      const typeConfig = getTypeConfig(session.sessionType);
                      const TypeIcon = typeConfig.icon;
                      return (
                        <div
                          key={session.id}
                          className="bg-muted border border-border rounded-lg p-4 flex items-center gap-4"
                        >
                          <div className={`p-2 rounded-lg ${typeConfig.color}`}>
                            <TypeIcon className="w-5 h-5 text-foreground" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-foreground font-medium">{session.title}</h4>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                session.status === 'completed' ? 'bg-green-700 text-white' :
                                session.status === 'cancelled' ? 'bg-red-700 text-white' :
                                'bg-blue-700 text-white'
                              }`}>
                                {session.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              {session.startTime && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {session.startTime} - {session.endTime}
                                </span>
                              )}
                              {session.location && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {session.location}
                                </span>
                              )}
                              <span className="capitalize text-xs px-2 py-0.5 bg-muted rounded">
                                {session.sessionType}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateSession.mutate({ id: session.id, status: 'completed' })}
                              className="p-2 text-green-700 dark:text-green-400 hover:bg-green-900/30 rounded-lg transition-colors"
                              title="Mark Complete"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteSession.mutate({ id: session.id })}
                              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Create Single Session */}
        {activeTab === "create" && (
          <div className="bg-muted border border-border rounded-xl p-6 max-w-2xl">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Create Training Session
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground text-sm mb-1">Session Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                    placeholder="e.g., Passing & Movement Drill"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground text-sm mb-1">Session Type *</label>
                  <select
                    value={form.sessionType}
                    onChange={(e) => setForm({ ...form, sessionType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                  >
                    {SESSION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-muted-foreground text-sm mb-1">Date *</label>
                  <input
                    type="date"
                    value={form.sessionDate}
                    onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground text-sm mb-1">Start Time</label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground text-sm mb-1">End Time</label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-muted-foreground text-sm mb-1">Location</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                  placeholder="Future Stars FC Training Ground, Field A"
                />
              </div>
              <div>
                <label className="block text-muted-foreground text-sm mb-1">Session Objectives</label>
                <textarea
                  value={form.objectives}
                  onChange={(e) => setForm({ ...form, objectives: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                  placeholder="What should players achieve in this session?"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateSingle}
                  disabled={!form.title || createSession.isPending}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  {createSession.isPending ? "Creating..." : "Create Session"}
                </button>
                <button
                  onClick={() => setActiveTab("list")}
                  className="px-6 py-2 bg-muted hover:bg-muted text-foreground rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Recurring Schedule */}
        {activeTab === "recurring" && (
          <div className="bg-muted border border-border rounded-xl p-6 max-w-2xl">
            <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Create Recurring Schedule
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Automatically generate multiple sessions for a date range and selected days of the week.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground text-sm mb-1">Session Title *</label>
                  <input
                    type="text"
                    value={recurringForm.title}
                    onChange={(e) => setRecurringForm({ ...recurringForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                    placeholder="e.g., Weekly Training Session"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground text-sm mb-1">Session Type *</label>
                  <select
                    value={recurringForm.sessionType}
                    onChange={(e) => setRecurringForm({ ...recurringForm, sessionType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                  >
                    {SESSION_TYPES.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground text-sm mb-2">Days of Week *</label>
                <div className="flex gap-2">
                  {DAY_NAMES.map((day, index) => (
                    <button
                      key={day}
                      onClick={() => toggleDay(index)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                        recurringForm.daysOfWeek.includes(index)
                          ? "bg-purple-600 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground text-sm mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={recurringForm.startDate}
                    onChange={(e) => setRecurringForm({ ...recurringForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground text-sm mb-1">End Date *</label>
                  <input
                    type="date"
                    value={recurringForm.endDate}
                    onChange={(e) => setRecurringForm({ ...recurringForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-muted-foreground text-sm mb-1">Start Time</label>
                  <input
                    type="time"
                    value={recurringForm.startTime}
                    onChange={(e) => setRecurringForm({ ...recurringForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-muted-foreground text-sm mb-1">End Time</label>
                  <input
                    type="time"
                    value={recurringForm.endTime}
                    onChange={(e) => setRecurringForm({ ...recurringForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-muted-foreground text-sm mb-1">Location</label>
                <input
                  type="text"
                  value={recurringForm.location}
                  onChange={(e) => setRecurringForm({ ...recurringForm, location: e.target.value })}
                  className="w-full px-3 py-2 bg-muted border border-border text-foreground rounded-lg text-sm"
                  placeholder="Future Stars FC Training Ground"
                />
              </div>

              {/* Preview */}
              {recurringForm.daysOfWeek.length > 0 && recurringForm.startDate && recurringForm.endDate && (
                <div className="bg-purple-900/30 border border-purple-700/50 rounded-lg p-3">
                  <p className="text-purple-600 dark:text-purple-300 text-sm">
                    <strong>Preview:</strong> Sessions on{" "}
                    {recurringForm.daysOfWeek.map(d => DAY_NAMES[d]).join(", ")} from{" "}
                    {new Date(recurringForm.startDate).toLocaleDateString()} to{" "}
                    {new Date(recurringForm.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-purple-600 dark:text-purple-400 text-xs mt-1">
                    Estimated: ~{Math.round(
                      (new Date(recurringForm.endDate).getTime() - new Date(recurringForm.startDate).getTime()) /
                      (7 * 24 * 60 * 60 * 1000) * recurringForm.daysOfWeek.length
                    )} sessions
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateRecurring}
                  disabled={!recurringForm.title || recurringForm.daysOfWeek.length === 0 || createBulk.isPending}
                  className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  {createBulk.isPending ? "Creating..." : "Create Recurring Schedule"}
                </button>
                <button
                  onClick={() => setActiveTab("list")}
                  className="px-6 py-2 bg-muted hover:bg-muted text-foreground rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
