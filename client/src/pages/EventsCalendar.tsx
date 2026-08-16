import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  MapPin,
  Users,
  Filter,
  CalendarDays,
  LayoutGrid,
  Sun,
  Sunset,
  Moon,
  Star,
  Heart,
  Zap,
  Target,
  Plus,
  CheckCircle,
  X,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type AcademyEvent = {
  id: number;
  title: string;
  description?: string | null;
  eventType: string;
  location?: string | null;
  startDate: string | Date;
  endDate?: string | Date | null;
  maxParticipants?: number | null;
  currentParticipants?: number | null;
  ageGroups?: string | null;
  status?: string | null;
  isPublic?: boolean | null;
};

// ─── Event type config ────────────────────────────────────────────────────────
const EVENT_CONFIG: Record<string, { label: string; labelAr: string; bg: string; text: string; border: string; icon: React.ReactNode }> = {
  "open-day":    { label: "Open Day",    labelAr: "يوم الأبواب المفتوحة", bg: "bg-[#4ECDC4]",  text: "text-foreground", border: "border-[#3dbdb5]", icon: <Star className="w-3 h-3" /> },
  "parent-day":  { label: "Parent Day",  labelAr: "يوم أولياء الأمور",     bg: "bg-[#FF6B6B]",  text: "text-foreground", border: "border-[#e85555]", icon: <Heart className="w-3 h-3" /> },
  "fun-day":     { label: "Fun Day",     labelAr: "يوم المرح",              bg: "bg-[#FFE66D]",  text: "text-gray-800", border: "border-[#f0d44a]", icon: <Zap className="w-3 h-3" /> },
  "trial-day":   { label: "Trial Day",   labelAr: "يوم التجارب",            bg: "bg-[#A8E6CF]",  text: "text-gray-800", border: "border-[#7dd4b0]", icon: <Target className="w-3 h-3" /> },
  training:      { label: "Training",    labelAr: "تدريب",                  bg: "bg-[#4A90D9]",  text: "text-foreground", border: "border-[#3070b9]", icon: <Zap className="w-3 h-3" /> },
  tournament:    { label: "Tournament",  labelAr: "بطولة",                  bg: "bg-[#F7A44A]",  text: "text-foreground", border: "border-[#d8852a]", icon: <Star className="w-3 h-3" /> },
  trial:         { label: "Trial",       labelAr: "اختبار",                 bg: "bg-[#A8E6CF]",  text: "text-gray-800", border: "border-[#7dd4b0]", icon: <Target className="w-3 h-3" /> },
  camp:          { label: "Camp",        labelAr: "معسكر",                  bg: "bg-[#C9B1FF]",  text: "text-foreground", border: "border-[#a88de0]", icon: <Sun className="w-3 h-3" /> },
  workshop:      { label: "Workshop",    labelAr: "ورشة عمل",               bg: "bg-[#FF8ED4]",  text: "text-foreground", border: "border-[#e06ab0]", icon: <Star className="w-3 h-3" /> },
  match:         { label: "Match",       labelAr: "مباراة",                 bg: "bg-[#F7A44A]",  text: "text-foreground", border: "border-[#d8852a]", icon: <Zap className="w-3 h-3" /> },
  meeting:       { label: "Meeting",     labelAr: "اجتماع",                 bg: "bg-[#B0BEC5]",  text: "text-foreground", border: "border-[#90a4ae]", icon: <Users className="w-3 h-3" /> },
  other:         { label: "Other",       labelAr: "أخرى",                   bg: "bg-[#CFD8DC]",  text: "text-gray-700", border: "border-[#b0bec5]", icon: <Calendar className="w-3 h-3" /> },
};

// Capacity color: green = plenty, yellow = filling, red = almost full, gray = full
function getCapacityColor(current: number, max: number): string {
  if (max === 0) return "bg-gray-100";
  const ratio = current / max;
  if (ratio < 0.6) return "bg-[#4ECDC4]";
  if (ratio < 0.85) return "bg-[#FFE66D]";
  if (ratio < 1.0) return "bg-[#FF6B6B]";
  return "bg-gray-300";
}

function getCapacityTextColor(current: number, max: number): string {
  if (max === 0) return "text-muted-foreground";
  const ratio = current / max;
  if (ratio < 0.6) return "text-foreground";
  if (ratio < 0.85) return "text-gray-800";
  return "text-foreground";
}

function getTimeSlot(date: Date): "morning" | "afternoon" | "evening" {
  const h = date.getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ─── Event Card ───────────────────────────────────────────────────────────────
function EventCard({ event, ar, onRegister }: { event: AcademyEvent; ar: boolean; onRegister: (ev: AcademyEvent) => void }) {
  const cfg = EVENT_CONFIG[event.eventType] || EVENT_CONFIG.other;
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : null;
  const current = event.currentParticipants ?? 0;
  const max = event.maxParticipants ?? 0;
  const capColor = max > 0 ? getCapacityColor(current, max) : "";
  const capText = max > 0 ? getCapacityTextColor(current, max) : "";
  const isFull = max > 0 && current >= max;

  return (
    <div className={`rounded-xl p-3 mb-2 ${cfg.bg} ${cfg.text} border ${cfg.border} shadow-sm min-w-0 cursor-pointer hover:opacity-90 transition-opacity`}>
      <div className="flex items-center gap-1 mb-1 opacity-80 text-xs font-medium">
        {cfg.icon}
        <span>{ar ? cfg.labelAr : cfg.label}</span>
      </div>
      <div className="font-bold text-sm leading-tight mb-2">{event.title}</div>
      {event.ageGroups && (
        <div className="text-xs opacity-75 mb-1">
          {(() => { try { const a = JSON.parse(event.ageGroups!); return Array.isArray(a) ? a.join(", ") : event.ageGroups; } catch { return event.ageGroups; } })()}
        </div>
      )}
      <div className="flex items-center gap-1 text-xs opacity-90 mb-1">
        <Clock className="w-3 h-3 flex-shrink-0" />
        <span>{formatTime(start)}{end ? ` › ${formatTime(end)}` : ""}</span>
      </div>
      {max > 0 && (
        <div className="flex items-center gap-1 text-xs opacity-90 mb-1">
          <Users className="w-3 h-3 flex-shrink-0" />
          <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${capColor} ${capText}`}>{current}/{max}</span>
        </div>
      )}
      {event.location && (
        <div className="flex items-center gap-1 text-xs opacity-80 mb-2">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{event.location}</span>
        </div>
      )}
      {/* RSVP Button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRegister(event); }}
        disabled={isFull}
        className={`w-full mt-1 py-1 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
          isFull
            ? "bg-black/20 text-foreground/60 cursor-not-allowed"
            : "bg-white/30 hover:bg-white/50 text-inherit border border-white/40"
        }`}
      >
        {isFull ? (
          <><X className="w-3 h-3" />{ar ? "ممتلئ" : "Full"}</>
        ) : (
          <><CheckCircle className="w-3 h-3" />{ar ? "تسجيل" : "Register"}</>
        )}
      </button>
    </div>
  );
}

// ─── Time Slot Header ─────────────────────────────────────────────────────────
function SlotHeader({ slot, ar }: { slot: "morning" | "afternoon" | "evening"; ar: boolean }) {
  const labels = {
    morning:   { en: "Morning",   ar: "الصباح",   icon: <Sun className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-500" /> },
    afternoon: { en: "Afternoon", ar: "الظهيرة",  icon: <Sunset className="w-3.5 h-3.5 text-orange-700 dark:text-orange-400" /> },
    evening:   { en: "Evening",   ar: "المساء",   icon: <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> },
  };
  const l = labels[slot];
  return (
    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground dark:text-gray-400 mt-3 mb-1.5 px-1">
      {l.icon}
      <span>{ar ? l.ar : l.en}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EventsCalendar() {
  const [, navigate] = useLocation();
  const { language, isRTL } = useLanguage();
  const ar = language === "ar";
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const { toast } = useToast();

  const [viewMode, setViewMode] = useState<"week" | "day">("week");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [capacityFilter, setCapacityFilter] = useState<"all" | "available" | "filling" | "full">("all");

  // RSVP modal state
  const [rsvpEvent, setRsvpEvent] = useState<AcademyEvent | null>(null);
  const [rsvpForm, setRsvpForm] = useState({ playerName: "", playerAge: "", parentName: "", parentEmail: "", parentPhone: "", notes: "" });

  // Create Event modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: "", description: "", eventType: "open-day", location: "",
    startDate: "", endDate: "", ageGroups: "", maxParticipants: "", isPublic: true,
  });

  const { data: events = [], isLoading, refetch } = trpc.events.getPublic.useQuery();

  const registerMutation = trpc.eventRegistrations.register.useMutation({
    onSuccess: (_, variables) => {
      toast({ title: ar ? "تم التسجيل بنجاح!" : "Registered successfully!", description: ar ? "سنتواصل معك قريباً لتأكيد التسجيل" : "We'll contact you soon to confirm your registration." });
      // Send WhatsApp confirmation to parent
      const whatsappNumber = import.meta.env.VITE_ACADEMY_WHATSAPP?.replace(/[^0-9]/g, '') || '201004186970';
      const eventTitle = rsvpEvent?.title || '';
      const eventDate = rsvpEvent?.startDate ? new Date(rsvpEvent.startDate).toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '';
      const msg = ar
        ? `مرحباً ${variables.parentName}،\n\nتم تسجيل ${variables.playerName} بنجاح في فعالية:\n📅 ${eventTitle}\n🗓️ ${eventDate}\n\nسيتواصل معك فريق الأكاديمية لتأكيد التفاصيل.\n\nشكراً لاختياركم أكاديمية النجوم المصرية ⭐`
        : `Hello ${variables.parentName},\n\n${variables.playerName} has been successfully registered for:\n📅 ${eventTitle}\n🗓️ ${eventDate}\n\nOur academy team will contact you to confirm details.\n\nThank you for choosing Egyptian Stars Academy ⭐`;
      const waUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`;
      setTimeout(() => window.open(waUrl, '_blank'), 800);
      setRsvpEvent(null);
      setRsvpForm({ playerName: "", playerAge: "", parentName: "", parentEmail: "", parentPhone: "", notes: "" });
      refetch();
    },
    onError: (err) => toast({ title: ar ? "خطأ في التسجيل" : "Registration failed", description: err.message, variant: "destructive" }),
  });

  const createMutation = trpc.events.create.useMutation({
    onSuccess: () => {
      toast({ title: ar ? "تم إنشاء الفعالية!" : "Event created successfully!" });
      setShowCreate(false);
      setCreateForm({ title: "", description: "", eventType: "open-day", location: "", startDate: "", endDate: "", ageGroups: "", maxParticipants: "", isPublic: true });
      refetch();
    },
    onError: (err) => toast({ title: ar ? "خطأ في الإنشاء" : "Create failed", description: err.message, variant: "destructive" }),
  });

  const handleRsvpSubmit = () => {
    if (!rsvpEvent) return;
    if (!rsvpForm.playerName || !rsvpForm.parentName || !rsvpForm.parentEmail || !rsvpForm.parentPhone) {
      toast({ title: ar ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields", variant: "destructive" });
      return;
    }
    registerMutation.mutate({
      eventId: rsvpEvent.id,
      playerName: rsvpForm.playerName,
      playerAge: Number(rsvpForm.playerAge) || 10,
      parentName: rsvpForm.parentName,
      parentEmail: rsvpForm.parentEmail,
      parentPhone: rsvpForm.parentPhone,
      notes: rsvpForm.notes || undefined,
    });
  };

  const handleCreateSubmit = () => {
    if (!createForm.title || !createForm.startDate) {
      toast({ title: ar ? "العنوان والتاريخ مطلوبان" : "Title and start date are required", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title: createForm.title,
      description: createForm.description || undefined,
      eventType: createForm.eventType as any,
      location: createForm.location || undefined,
      startDate: createForm.startDate,
      endDate: createForm.endDate || undefined,
      ageGroups: createForm.ageGroups || undefined,
      maxParticipants: createForm.maxParticipants ? Number(createForm.maxParticipants) : undefined,
      isPublic: createForm.isPublic,
    });
  };

  // Derive week days
  const weekStart = useMemo(() => startOfWeek(currentDate), [currentDate]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const displayDays = viewMode === "day" ? [currentDate] : weekDays;

  // Filter events
  const filteredEvents = useMemo(() => {
    return (events as AcademyEvent[]).filter(ev => {
      if (selectedType && ev.eventType !== selectedType) return false;
      if (capacityFilter !== "all") {
        const cur = ev.currentParticipants ?? 0;
        const max = ev.maxParticipants ?? 0;
        if (max === 0) return capacityFilter === "available";
        const ratio = cur / max;
        if (capacityFilter === "available" && ratio >= 0.85) return false;
        if (capacityFilter === "filling" && (ratio < 0.6 || ratio >= 1.0)) return false;
        if (capacityFilter === "full" && ratio < 1.0) return false;
      }
      return true;
    });
  }, [events, selectedType, capacityFilter]);

  // Group events by day and time slot
  const eventsByDaySlot = useMemo(() => {
    const map: Record<string, Record<"morning" | "afternoon" | "evening", AcademyEvent[]>> = {};
    displayDays.forEach(day => {
      const key = day.toDateString();
      map[key] = { morning: [], afternoon: [], evening: [] };
    });
    filteredEvents.forEach(ev => {
      const d = new Date(ev.startDate);
      const key = d.toDateString();
      if (map[key]) {
        const slot = getTimeSlot(d);
        map[key][slot].push(ev);
      }
    });
    return map;
  }, [filteredEvents, displayDays]);

  const navigateCal = (dir: 1 | -1) => {
    if (viewMode === "week") setCurrentDate(prev => addDays(prev, dir * 7));
    else setCurrentDate(prev => addDays(prev, dir));
  };
  const goToday = () => setCurrentDate(new Date());
  const monthLabel = weekStart.toLocaleDateString(ar ? "ar-EG" : "en-GB", { month: "long", year: "numeric" });
  const dayNames = ar
    ? ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"]
    : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const today = new Date();

  return (
    <>
      <div className="p-4 md:p-6 max-w-full" dir={isRTL ? "rtl" : "ltr"}>
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {ar ? "تقويم الفعاليات" : "Events Calendar"}
            </h1>
            <p className="text-sm text-muted-foreground dark:text-gray-400 mt-0.5">
              {ar ? "أيام مفتوحة · أيام أولياء الأمور · أيام المرح · أيام الاختبار" : "Open Days · Parent Days · Fun Days · Trial Days"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Admin Create Event button */}
            {isAdmin && (
              <Button onClick={() => setShowCreate(true)} size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" />
                {ar ? "إنشاء فعالية" : "Create Event"}
              </Button>
            )}
            {/* View toggle */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode("day")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "day" ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "text-muted-foreground hover:text-gray-700"}`}
              >
                <div className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{ar ? "يوم" : "Day"}</div>
              </button>
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${viewMode === "week" ? "bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white" : "text-muted-foreground hover:text-gray-700"}`}
              >
                <div className="flex items-center gap-1.5"><LayoutGrid className="w-4 h-4" />{ar ? "أسبوع" : "Week"}</div>
              </button>
            </div>
          </div>
        </div>

        {/* ── Controls Bar ── */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-sm">
            <button onClick={() => navigateCal(-1)} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 min-w-[140px] text-center">{monthLabel}</span>
            <button onClick={() => navigateCal(1)} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={goToday}
            className="px-3 py-2 text-sm font-medium bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
          >
            {ar ? "اليوم" : "Today"}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">{ar ? "السعة:" : "Capacity:"}</span>
            {(["all", "available", "filling", "full"] as const).map(c => (
              <button
                key={c}
                onClick={() => setCapacityFilter(c)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                  capacityFilter === c
                    ? "bg-muted text-foreground border-border dark:bg-white dark:text-gray-900"
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                {c === "all" ? (ar ? "الكل" : "All") : c === "available" ? (ar ? "متاح" : "Available") : c === "filling" ? (ar ? "يمتلئ" : "Filling") : (ar ? "ممتلئ" : "Full")}
              </button>
            ))}
          </div>
        </div>

        {/* ── Event Type Filter Pills ── */}
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setSelectedType(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              selectedType === null
                ? "bg-muted text-foreground border-border dark:bg-white dark:text-gray-900 dark:border-white"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400"
            }`}
          >
            <Filter className="w-3 h-3" />
            {ar ? "جميع الفعاليات" : "All Events"}
          </button>
          {["open-day", "parent-day", "fun-day", "trial-day", "training", "tournament", "camp", "workshop"].map(type => {
            const cfg = EVENT_CONFIG[type];
            if (!cfg) return null;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? null : type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  selectedType === type
                    ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                    : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-400"
                }`}
              >
                {cfg.icon}
                {ar ? cfg.labelAr : cfg.label}
              </button>
            );
          })}
        </div>

        {/* ── Capacity Legend ── */}
        <div className="flex flex-wrap items-center gap-4 mb-5 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
          <span className="text-xs font-semibold text-muted-foreground dark:text-gray-400">{ar ? "مستوى السعة:" : "Capacity levels:"}</span>
          {[
            { color: "bg-[#4ECDC4]", label: ar ? "متاح" : "Available (< 60%)" },
            { color: "bg-[#FFE66D]", label: ar ? "يمتلئ" : "Filling (60–85%)" },
            { color: "bg-[#FF6B6B]", label: ar ? "شبه ممتلئ" : "Almost full (85–99%)" },
            { color: "bg-gray-300",  label: ar ? "ممتلئ" : "Full (100%)" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className={`w-4 h-4 rounded ${color}`} />
              <span className="text-xs text-gray-600 dark:text-gray-300">{label}</span>
            </div>
          ))}
        </div>

        {/* ── Calendar Grid ── */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <Calendar className="w-8 h-8 animate-pulse" />
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-x-auto">
            <div
              className="grid min-w-[700px]"
              style={{ gridTemplateColumns: `repeat(${displayDays.length}, minmax(160px, 1fr))` }}
            >
              {/* Day headers */}
              {displayDays.map((day, idx) => {
                const isToday = isSameDay(day, today);
                return (
                  <div
                    key={day.toDateString()}
                    className={`px-3 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800 ${isToday ? "bg-blue-50 dark:bg-blue-900/20" : ""} ${idx < displayDays.length - 1 ? "border-r border-gray-100 dark:border-gray-800" : ""}`}
                  >
                    <div className="text-xs font-semibold text-muted-foreground dark:text-gray-500 uppercase tracking-wide">
                      {dayNames[idx % 7]}
                    </div>
                    <div className={`text-lg font-bold mt-0.5 ${isToday ? "text-blue-600 dark:text-blue-400" : "text-gray-800 dark:text-gray-100"}`}>
                      {day.getDate()}
                    </div>
                    {isToday && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1" />}
                  </div>
                );
              })}

              {/* Event cells */}
              {displayDays.map((day, idx) => {
                const key = day.toDateString();
                const slots = eventsByDaySlot[key] || { morning: [], afternoon: [], evening: [] };
                const hasAny = slots.morning.length + slots.afternoon.length + slots.evening.length > 0;
                return (
                  <div
                    key={key}
                    className={`px-2 py-2 min-h-[200px] align-top ${idx < displayDays.length - 1 ? "border-r border-gray-100 dark:border-gray-800" : ""}`}
                  >
                    {!hasAny && (
                      <div className="flex items-center justify-center h-20 text-xs text-muted-foreground dark:text-gray-600">
                        {ar ? "لا توجد فعاليات" : "No events"}
                      </div>
                    )}
                    {(["morning", "afternoon", "evening"] as const).map(slot => {
                      const evs = slots[slot];
                      if (evs.length === 0) return null;
                      return (
                        <div key={slot}>
                          <SlotHeader slot={slot} ar={ar} />
                          {evs.map(ev => (
                            <EventCard key={ev.id} event={ev} ar={ar} onRegister={setRsvpEvent} />
                          ))}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {!isLoading && filteredEvents.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">{ar ? "لا توجد فعاليات هذا الأسبوع" : "No events this week"}</p>
            <p className="text-sm mt-1">{ar ? "جرب تغيير الفلتر أو الانتقال لأسبوع آخر" : "Try changing the filter or navigating to another week"}</p>
          </div>
        )}
      </div>

      {/* ── RSVP Registration Modal ── */}
      <Dialog open={!!rsvpEvent} onOpenChange={() => setRsvpEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-700 dark:text-green-500" />
              {ar ? "تسجيل في الفعالية" : "Register for Event"}
            </DialogTitle>
          </DialogHeader>
          {rsvpEvent && (
            <div className="space-y-4">
              <div className={`p-3 rounded-lg ${EVENT_CONFIG[rsvpEvent.eventType]?.bg || "bg-gray-100"} ${EVENT_CONFIG[rsvpEvent.eventType]?.text || "text-gray-800"}`}>
                <div className="font-bold">{rsvpEvent.title}</div>
                <div className="text-xs opacity-80 mt-0.5">
                  {new Date(rsvpEvent.startDate).toLocaleDateString(ar ? "ar-EG" : "en-GB", { weekday: "long", day: "numeric", month: "long" })}
                  {" · "}{formatTime(new Date(rsvpEvent.startDate))}
                  {rsvpEvent.location && ` · ${rsvpEvent.location}`}
                </div>
                {rsvpEvent.maxParticipants && (
                  <div className="text-xs opacity-80 mt-0.5">
                    {ar ? "المتبقي:" : "Spots left:"} {rsvpEvent.maxParticipants - (rsvpEvent.currentParticipants ?? 0)}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{ar ? "اسم اللاعب *" : "Player Name *"}</Label>
                  <Input value={rsvpForm.playerName} onChange={e => setRsvpForm(f => ({ ...f, playerName: e.target.value }))} placeholder={ar ? "الاسم الكامل" : "Full name"} />
                </div>
                <div>
                  <Label className="text-xs">{ar ? "العمر" : "Age"}</Label>
                  <Input type="number" value={rsvpForm.playerAge} onChange={e => setRsvpForm(f => ({ ...f, playerAge: e.target.value }))} placeholder="10" />
                </div>
              </div>
              <div>
                <Label className="text-xs">{ar ? "اسم ولي الأمر *" : "Parent Name *"}</Label>
                <Input value={rsvpForm.parentName} onChange={e => setRsvpForm(f => ({ ...f, parentName: e.target.value }))} placeholder={ar ? "اسم ولي الأمر" : "Parent full name"} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">{ar ? "البريد الإلكتروني *" : "Email *"}</Label>
                  <Input type="email" value={rsvpForm.parentEmail} onChange={e => setRsvpForm(f => ({ ...f, parentEmail: e.target.value }))} placeholder="email@example.com" />
                </div>
                <div>
                  <Label className="text-xs">{ar ? "رقم الهاتف *" : "Phone *"}</Label>
                  <Input value={rsvpForm.parentPhone} onChange={e => setRsvpForm(f => ({ ...f, parentPhone: e.target.value }))} placeholder="+20..." />
                </div>
              </div>
              <div>
                <Label className="text-xs">{ar ? "ملاحظات (اختياري)" : "Notes (optional)"}</Label>
                <Textarea value={rsvpForm.notes} onChange={e => setRsvpForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder={ar ? "أي معلومات إضافية..." : "Any additional info..."} />
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setRsvpEvent(null)} className="flex-1">{ar ? "إلغاء" : "Cancel"}</Button>
                <Button onClick={handleRsvpSubmit} disabled={registerMutation.isPending} className="flex-1">
                  {registerMutation.isPending ? (ar ? "جارٍ التسجيل..." : "Registering...") : (ar ? "تأكيد التسجيل" : "Confirm Registration")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Admin Create Event Modal ── */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-500" />
              {ar ? "إنشاء فعالية جديدة" : "Create New Event"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">{ar ? "عنوان الفعالية *" : "Event Title *"}</Label>
              <Input value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder={ar ? "مثال: يوم الأبواب المفتوحة 2026" : "e.g. Open Day 2026"} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{ar ? "نوع الفعالية" : "Event Type"}</Label>
                <Select value={createForm.eventType} onValueChange={v => setCreateForm(f => ({ ...f, eventType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_CONFIG).map(([key, cfg]) => (
                      <SelectItem key={key} value={key}>{ar ? cfg.labelAr : cfg.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{ar ? "الموقع" : "Location"}</Label>
                <Input value={createForm.location} onChange={e => setCreateForm(f => ({ ...f, location: e.target.value }))} placeholder={ar ? "ملعب الأكاديمية" : "Academy Pitch"} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{ar ? "تاريخ ووقت البدء *" : "Start Date & Time *"}</Label>
                <Input type="datetime-local" value={createForm.startDate} onChange={e => setCreateForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">{ar ? "تاريخ ووقت الانتهاء" : "End Date & Time"}</Label>
                <Input type="datetime-local" value={createForm.endDate} onChange={e => setCreateForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{ar ? "الحد الأقصى للمشاركين" : "Max Participants"}</Label>
                <Input type="number" value={createForm.maxParticipants} onChange={e => setCreateForm(f => ({ ...f, maxParticipants: e.target.value }))} placeholder="50" />
              </div>
              <div>
                <Label className="text-xs">{ar ? "الفئات العمرية" : "Age Groups"}</Label>
                <Input value={createForm.ageGroups} onChange={e => setCreateForm(f => ({ ...f, ageGroups: e.target.value }))} placeholder="U8, U10, U12" />
              </div>
            </div>
            <div>
              <Label className="text-xs">{ar ? "الوصف (اختياري)" : "Description (optional)"}</Label>
              <Textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} rows={2} placeholder={ar ? "تفاصيل الفعالية..." : "Event details..."} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPublic" checked={createForm.isPublic} onChange={e => setCreateForm(f => ({ ...f, isPublic: e.target.checked }))} className="rounded" />
              <Label htmlFor="isPublic" className="text-xs cursor-pointer">{ar ? "فعالية عامة (مرئية للجميع)" : "Public event (visible to everyone)"}</Label>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">{ar ? "إلغاء" : "Cancel"}</Button>
              <Button onClick={handleCreateSubmit} disabled={createMutation.isPending} className="flex-1">
                {createMutation.isPending ? (ar ? "جارٍ الإنشاء..." : "Creating...") : (ar ? "إنشاء الفعالية" : "Create Event")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
