import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import {
  AlertTriangle, Shield, XCircle, Clock, DollarSign, Dumbbell,
  Bell, MoreHorizontal, Plus, Filter, Search, CheckCircle2,
  ArrowLeft, Trash2, ChevronDown, Calendar, User, Users,
  TrendingUp, BarChart2, RefreshCw
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

// ─── Types ────────────────────────────────────────────────────────────────────
type PunishmentType = "yellow_card" | "red_card" | "suspension" | "fine" | "extra_training" | "warning" | "other";

const TYPE_CONFIG: Record<PunishmentType, { label: string; labelAr: string; icon: any; color: string; bg: string; border: string }> = {
  yellow_card:    { label: "Yellow Card",    labelAr: "كرت أصفر",     icon: "🟨", color: "text-yellow-700 dark:text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  red_card:       { label: "Red Card",       labelAr: "كرت أحمر",     icon: "🟥", color: "text-red-600 dark:text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30" },
  suspension:     { label: "Suspension",     labelAr: "إيقاف",        icon: "🚫", color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30" },
  fine:           { label: "Fine",           labelAr: "غرامة",        icon: "💰", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  extra_training: { label: "Extra Training", labelAr: "تدريب إضافي",  icon: "🏋️", color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30" },
  warning:        { label: "Warning",        labelAr: "إنذار",        icon: "⚠️", color: "text-amber-700 dark:text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30" },
  other:          { label: "Other",          labelAr: "أخرى",         icon: "📋", color: "text-muted-foreground",   bg: "bg-gray-500/10",   border: "border-gray-500/30" },
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${color}`}>
      <span className="text-2xl">{icon}</span>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
function TypeBadge({ type, isAr }: { type: PunishmentType; isAr: boolean }) {
  const cfg = TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.icon} {isAr ? cfg.labelAr : cfg.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Punishments() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isAr = language === "ar";

  // ── State ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"list" | "add" | "stats">("list");
  const [filterType, setFilterType] = useState<PunishmentType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [resolveId, setResolveId] = useState<number | null>(null);
  const [resolveNote, setResolveNote] = useState("");

  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    playerId: "",
    type: "yellow_card" as PunishmentType,
    matchOrSession: "",
    opponent: "",
    reason: "",
    description: "",
    suspensionGames: "0",
    fineAmount: "",
    incidentDate: new Date().toISOString().split("T")[0],
  });

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: allPunishments = [], refetch } = trpc.punishments.list.useQuery({ limit: 200 });
  const { data: teamStats = [] } = trpc.punishments.teamSummary.useQuery();
  const { data: players = [] } = trpc.players.getAll.useQuery();

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = trpc.punishments.create.useMutation({
    onSuccess: () => {
      toast.success(isAr ? "تم تسجيل العقوبة بنجاح" : "Punishment recorded successfully");
      refetch();
      setActiveTab("list");
      setForm({ playerId: "", type: "yellow_card", matchOrSession: "", opponent: "", reason: "", description: "", suspensionGames: "0", fineAmount: "", incidentDate: new Date().toISOString().split("T")[0] });
    },
    onError: (e) => toast.error(e.message),
  });

  const resolveMutation = trpc.punishments.resolve.useMutation({
    onSuccess: () => {
      toast.success(isAr ? "تم حل العقوبة" : "Punishment resolved");
      refetch();
      setResolveId(null);
      setResolveNote("");
    },
  });

  const deleteMutation = trpc.punishments.delete.useMutation({
    onSuccess: () => {
      toast.success(isAr ? "تم الحذف" : "Deleted");
      refetch();
    },
  });

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return (allPunishments as any[]).filter((p: any) => {
      const name = `${p.playerFirstName} ${p.playerLastName}`.toLowerCase();
      if (searchQuery && !name.includes(searchQuery.toLowerCase()) && !p.reason?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterType !== "all" && p.type !== filterType) return false;
      if (filterStatus === "active" && !p.isActive) return false;
      if (filterStatus === "resolved" && p.isActive) return false;
      return true;
    });
  }, [allPunishments, searchQuery, filterType, filterStatus]);

  // ── Summary counts ─────────────────────────────────────────────────────────
  const counts = useMemo(() => {
    const all = allPunishments as any[];
    return {
      total: all.length,
      active: all.filter((p: any) => p.isActive).length,
      yellow: all.filter((p: any) => p.type === "yellow_card").length,
      red: all.filter((p: any) => p.type === "red_card").length,
      suspension: all.filter((p: any) => p.type === "suspension").length,
      warning: all.filter((p: any) => p.type === "warning").length,
    };
  }, [allPunishments]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!form.playerId || !form.reason) {
      toast.error(isAr ? "اختر اللاعب وأدخل السبب" : "Select player and enter reason");
      return;
    }
    createMutation.mutate({
      playerId: parseInt(form.playerId),
      type: form.type,
      matchOrSession: form.matchOrSession || undefined,
      opponent: form.opponent || undefined,
      reason: form.reason,
      description: form.description || undefined,
      suspensionGames: parseInt(form.suspensionGames) || 0,
      fineAmount: form.fineAmount ? parseFloat(form.fineAmount) : undefined,
      incidentDate: form.incidentDate,
    });
  };

  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  return (
    <>
    <div className="text-foreground" dir={isAr ? "rtl" : "ltr"}>
      {/* ── Header ── */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Shield size={22} className="text-red-500" />
                {isAr ? "لوحة العقوبات والكروت" : "Punishments & Cards"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">{isAr ? "تسجيل ومتابعة الكروت والعقوبات والإيقافات" : "Track cards, suspensions, fines & coach penalties"}</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab("add")}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} />
            {isAr ? "إضافة عقوبة" : "Add Punishment"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon="📊" value={counts.total}      label={isAr ? "الإجمالي" : "Total"}       color="bg-muted/60 border-border/50" />
          <StatCard icon="🔴" value={counts.active}     label={isAr ? "نشطة" : "Active"}          color="bg-red-950/40 border-red-800/30" />
          <StatCard icon="🟨" value={counts.yellow}     label={isAr ? "كروت صفراء" : "Yellow Cards"} color="bg-yellow-950/40 border-yellow-800/30" />
          <StatCard icon="🟥" value={counts.red}        label={isAr ? "كروت حمراء" : "Red Cards"}    color="bg-red-950/40 border-red-800/30" />
          <StatCard icon="🚫" value={counts.suspension} label={isAr ? "إيقافات" : "Suspensions"}   color="bg-orange-950/40 border-orange-800/30" />
          <StatCard icon="⚠️" value={counts.warning}   label={isAr ? "إنذارات" : "Warnings"}      color="bg-amber-950/40 border-amber-800/30" />
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 bg-card rounded-xl p-1 w-fit border border-border">
          {(["list", "add", "stats"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab ? "bg-white text-gray-900 shadow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "list" ? (isAr ? "القائمة" : "List") :
               tab === "add"  ? (isAr ? "إضافة" : "Add") :
                                (isAr ? "إحصائيات" : "Stats")}
            </button>
          ))}
        </div>

        {/* ══════════ TAB: LIST ══════════ */}
        {activeTab === "list" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={isAr ? "بحث باسم اللاعب أو السبب..." : "Search by player or reason..."}
                  className="w-full pl-9 pr-4 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-blue-500"
              >
                <option value="all">{isAr ? "كل الأنواع" : "All Types"}</option>
                {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {isAr ? v.labelAr : v.label}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-blue-500"
              >
                <option value="all">{isAr ? "كل الحالات" : "All Status"}</option>
                <option value="active">{isAr ? "نشطة" : "Active"}</option>
                <option value="resolved">{isAr ? "محلولة" : "Resolved"}</option>
              </select>
              <button onClick={() => refetch()} className="p-2 bg-muted border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw size={15} />
              </button>
            </div>

            {/* Table */}
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Shield size={48} className="mx-auto mb-3 opacity-30" />
                <p>{isAr ? "لا توجد عقوبات" : "No punishments found"}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-card border-b border-border">
                    <tr>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">{isAr ? "اللاعب" : "Player"}</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">{isAr ? "النوع" : "Type"}</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">{isAr ? "السبب" : "Reason"}</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">{isAr ? "المباراة/الجلسة" : "Match/Session"}</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">{isAr ? "التاريخ" : "Date"}</th>
                      <th className="text-left px-4 py-3 text-muted-foreground font-medium">{isAr ? "الحالة" : "Status"}</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p: any) => (
                      <tr key={p.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold">
                              {p.playerFirstName?.[0]}{p.playerLastName?.[0]}
                            </div>
                            <span className="font-medium text-foreground">{p.playerFirstName} {p.playerLastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><TypeBadge type={p.type} isAr={isAr} /></td>
                        <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{p.reason}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{p.matchOrSession || (p.opponent ? `vs ${p.opponent}` : "—")}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(p.incidentDate)}</td>
                        <td className="px-4 py-3">
                          {p.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                              {isAr ? "نشطة" : "Active"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
                              <CheckCircle2 size={10} />
                              {isAr ? "محلولة" : "Resolved"}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {p.isActive && (
                              <button
                                onClick={() => setResolveId(p.id)}
                                className="p-1.5 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 transition-colors"
                                title={isAr ? "حل العقوبة" : "Resolve"}
                              >
                                <CheckCircle2 size={14} />
                              </button>
                            )}
                            <button
                              onClick={() => { if (confirm(isAr ? "هل تريد الحذف؟" : "Delete this punishment?")) deleteMutation.mutate({ id: p.id }); }}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors"
                              title={isAr ? "حذف" : "Delete"}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Resolve Dialog */}
            {resolveId && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-green-400" />
                    {isAr ? "حل العقوبة" : "Resolve Punishment"}
                  </h3>
                  <textarea
                    value={resolveNote}
                    onChange={e => setResolveNote(e.target.value)}
                    placeholder={isAr ? "ملاحظة الحل (اختياري)..." : "Resolution note (optional)..."}
                    rows={3}
                    className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-green-500 resize-none"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setResolveId(null); setResolveNote(""); }} className="flex-1 px-4 py-2 bg-muted border border-border rounded-lg text-sm hover:bg-muted transition-colors">
                      {isAr ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                      onClick={() => resolveMutation.mutate({ id: resolveId, resolvedNote: resolveNote || undefined })}
                      className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors"
                    >
                      {isAr ? "تأكيد الحل" : "Confirm Resolve"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ TAB: ADD ══════════ */}
        {activeTab === "add" && (
          <div className="max-w-2xl space-y-5">
            <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Plus size={18} className="text-red-600 dark:text-red-400" />
                {isAr ? "تسجيل عقوبة جديدة" : "Record New Punishment"}
              </h2>

              {/* Player */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">{isAr ? "اللاعب *" : "Player *"}</label>
                <select
                  value={form.playerId}
                  onChange={e => setForm(f => ({ ...f, playerId: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-red-500"
                >
                  <option value="">{isAr ? "اختر اللاعب..." : "Select player..."}</option>
                  {(players as any[]).map((p: any) => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.position}</option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">{isAr ? "نوع العقوبة *" : "Punishment Type *"}</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(TYPE_CONFIG).map(([k, v]) => (
                    <button
                      key={k}
                      onClick={() => setForm(f => ({ ...f, type: k as PunishmentType }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-medium transition-all ${
                        form.type === k
                          ? `${v.bg} ${v.color} ${v.border} ring-1 ring-current`
                          : "bg-muted border-border text-muted-foreground hover:border-border"
                      }`}
                    >
                      <span className="text-lg">{v.icon}</span>
                      {isAr ? v.labelAr : v.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">{isAr ? "السبب *" : "Reason *"}</label>
                <input
                  value={form.reason}
                  onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder={isAr ? "مثال: كرت أصفر بسبب احتجاج على الحكم" : "e.g., Yellow card for dissent"}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-red-500"
                />
              </div>

              {/* Match / Opponent */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">{isAr ? "المباراة/الجلسة" : "Match/Session"}</label>
                  <input
                    value={form.matchOrSession}
                    onChange={e => setForm(f => ({ ...f, matchOrSession: e.target.value }))}
                    placeholder={isAr ? "مثال: جولة 5" : "e.g., Round 5"}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">{isAr ? "الخصم" : "Opponent"}</label>
                  <input
                    value={form.opponent}
                    onChange={e => setForm(f => ({ ...f, opponent: e.target.value }))}
                    placeholder={isAr ? "مثال: الزمالك" : "e.g., Zamalek"}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Suspension games + Fine */}
              <div className="grid grid-cols-2 gap-3">
                {(form.type === "suspension" || form.type === "red_card") && (
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">{isAr ? "عدد مباريات الإيقاف" : "Suspension Games"}</label>
                    <input
                      type="number" min="0"
                      value={form.suspensionGames}
                      onChange={e => setForm(f => ({ ...f, suspensionGames: e.target.value }))}
                      className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
                {form.type === "fine" && (
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1.5">{isAr ? "مبلغ الغرامة (جنيه)" : "Fine Amount (EGP)"}</label>
                    <input
                      type="number" min="0"
                      value={form.fineAmount}
                      onChange={e => setForm(f => ({ ...f, fineAmount: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-red-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">{isAr ? "تاريخ الحادثة *" : "Incident Date *"}</label>
                  <input
                    type="date"
                    value={form.incidentDate}
                    onChange={e => setForm(f => ({ ...f, incidentDate: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm text-muted-foreground mb-1.5">{isAr ? "تفاصيل إضافية" : "Additional Details"}</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={3}
                  placeholder={isAr ? "أي تفاصيل إضافية..." : "Any additional details..."}
                  className="w-full px-3 py-2.5 bg-muted border border-border rounded-lg text-sm text-foreground placeholder-gray-500 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setActiveTab("list")}
                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-xl text-sm hover:bg-muted transition-colors"
                >
                  {isAr ? "إلغاء" : "Cancel"}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  {createMutation.isPending ? (
                    <><RefreshCw size={15} className="animate-spin" /> {isAr ? "جاري الحفظ..." : "Saving..."}</>
                  ) : (
                    <><Shield size={15} /> {isAr ? "تسجيل العقوبة" : "Record Punishment"}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════ TAB: STATS ══════════ */}
        {activeTab === "stats" && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <BarChart2 size={18} className="text-blue-600 dark:text-blue-400" />
              {isAr ? "إحصائيات العقوبات حسب اللاعب" : "Punishment Stats by Player"}
            </h2>
            {(teamStats as any[]).length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <BarChart2 size={48} className="mx-auto mb-3 opacity-30" />
                <p>{isAr ? "لا توجد بيانات" : "No data yet"}</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {(teamStats as any[]).map((p: any) => (
                  <div key={p.playerId} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {p.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-foreground truncate">{p.name}</div>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {p.yellowCards > 0 && <span className="text-xs text-yellow-700 dark:text-yellow-400">🟨 {p.yellowCards}</span>}
                        {p.redCards > 0 && <span className="text-xs text-red-600 dark:text-red-400">🟥 {p.redCards}</span>}
                        {p.suspensions > 0 && <span className="text-xs text-orange-700 dark:text-orange-400">🚫 {p.suspensions}</span>}
                        {p.warnings > 0 && <span className="text-xs text-amber-700 dark:text-amber-400">⚠️ {p.warnings}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-2xl font-bold text-foreground">{p.total}</div>
                      <div className="text-xs text-muted-foreground">{isAr ? "إجمالي" : "total"}</div>
                      {p.active > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400 mt-0.5">{p.active} {isAr ? "نشطة" : "active"}</div>
                      )}
                    </div>
                    {/* Bar */}
                    <div className="w-24 hidden sm:block">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-full"
                          style={{ width: `${Math.min((p.total / Math.max(...(teamStats as any[]).map((x: any) => x.total), 1)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
