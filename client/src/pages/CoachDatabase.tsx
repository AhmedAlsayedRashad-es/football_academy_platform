import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft, Plus, Search, Filter, Star, Edit2, Trash2, Eye,
  UserCheck, Globe, Award, Briefcase, Phone, Mail, Linkedin,
  CheckCircle, Clock, XCircle, ChevronDown, ChevronUp, X, Save, Calendar
} from "lucide-react";

const FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "4-1-4-1", "3-4-3", "4-3-2-1"];
const PLAYING_STYLES = [
  "High Press", "Tiki-Taka", "Counter Attack", "Possession-Based",
  "Direct Play", "Gegenpressing", "Low Block", "Wing Play",
  "Set Piece Specialist", "Youth Development", "Physical Intensity", "Technical Football"
];
const COACHING_STRENGTHS = [
  "Defending", "Attacking", "Set Pieces", "Player Development",
  "Fitness & Conditioning", "Mental Coaching", "Tactical Flexibility",
  "Youth Management", "Motivation", "Video Analysis", "Recruitment", "Team Building"
];
const CERTIFICATIONS = [
  "UEFA Pro License", "UEFA A License", "UEFA B License", "CAF A License",
  "CAF B License", "FIFA Coaching Certificate", "AFC A License", "AFC B License",
  "Sports Science Degree", "Physical Education Degree"
];
const LANGUAGES = ["Arabic", "English", "French", "Spanish", "Portuguese", "German", "Italian", "Turkish"];

type Coach = {
  id: number;
  name: string;
  nationality?: string;
  age?: number;
  email?: string;
  phone?: string;
  photo_url?: string;
  title?: string;
  years_experience: number;
  preferred_formation?: string;
  playing_styles: string[];
  coaching_strengths: string[];
  required_player_skills: string[];
  certifications: string[];
  languages: string[];
  bio?: string;
  achievements: string[];
  availability: "available" | "unavailable" | "negotiating";
  contract_status: "free" | "contracted" | "notice_period";
  linkedin_url?: string;
  rating: number;
};

const emptyForm = {
  name: "",
  nationality: "",
  age: undefined as number | undefined,
  email: "",
  phone: "",
  photoUrl: "",
  title: "",
  yearsExperience: 0,
  preferredFormation: "",
  playingStyles: [] as string[],
  coachingStrengths: [] as string[],
  requiredPlayerSkills: [] as string[],
  certifications: [] as string[],
  languages: [] as string[],
  bio: "",
  achievements: [] as string[],
  // Widened from `as const` so editing a coach can assign the other values.
  availability: "available" as "available" | "unavailable" | "negotiating",
  contractStatus: "free" as "free" | "contracted" | "notice_period",
  linkedinUrl: "",
  // The form renders an Expected Salary input, so the field has to exist here.
  expectedSalary: "",
  rating: 7,
};

export default function CoachDatabase() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [filterAvailability, setFilterAvailability] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingCoach, setViewingCoach] = useState<Coach | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [newAchievement, setNewAchievement] = useState("");
  const [newSkill, setNewSkill] = useState("");

  const { data: coaches, refetch } = trpc.coachCandidates.getAll.useQuery({ limit: 100 });
  const createMutation = trpc.coachCandidates.create.useMutation({ onSuccess: () => { refetch(); setShowForm(false); setForm({ ...emptyForm }); } });
  const updateMutation = trpc.coachCandidates.update.useMutation({ onSuccess: () => { refetch(); setShowForm(false); setEditingId(null); setForm({ ...emptyForm }); } });
  const deleteMutation = trpc.coachCandidates.delete.useMutation({ onSuccess: () => refetch() });

  const filtered = (coaches || []).filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.nationality || "").toLowerCase().includes(search.toLowerCase()) ||
      (c.title || "").toLowerCase().includes(search.toLowerCase());
    const matchAvail = !filterAvailability || c.availability === filterAvailability;
    return matchSearch && matchAvail;
  });

  const toggleArrayField = (field: keyof typeof form, value: string) => {
    const arr = form[field] as string[];
    setForm(prev => ({ ...prev, [field]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] }));
  };

  const handleEdit = (coach: Coach) => {
    setForm({
      name: coach.name,
      nationality: coach.nationality || "",
      age: coach.age,
      email: coach.email || "",
      phone: coach.phone || "",
      photoUrl: coach.photo_url || "",
      title: coach.title || "",
      yearsExperience: coach.years_experience,
      preferredFormation: coach.preferred_formation || "",
      playingStyles: coach.playing_styles,
      coachingStrengths: coach.coaching_strengths,
      requiredPlayerSkills: coach.required_player_skills,
      certifications: coach.certifications,
      languages: coach.languages,
      bio: coach.bio || "",
      achievements: coach.achievements,
      availability: coach.availability,
      contractStatus: coach.contract_status,
      expectedSalary: (coach as any).expectedSalary || "",
      linkedinUrl: coach.linkedin_url || "",
      rating: coach.rating,
    });
    setEditingId(coach.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      age: form.age || undefined,
      email: form.email || undefined,
      phone: form.phone || undefined,
      photoUrl: form.photoUrl || undefined,
      title: form.title || undefined,
      nationality: form.nationality || undefined,
      preferredFormation: form.preferredFormation || undefined,
      bio: form.bio || undefined,
      linkedinUrl: form.linkedinUrl || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const availabilityBadge = (av: string) => {
    if (av === "available") return <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-green-900/40 text-green-700 dark:text-green-400 rounded-full"><CheckCircle className="w-3 h-3" />Available</span>;
    if (av === "negotiating") return <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 rounded-full"><Clock className="w-3 h-3" />Negotiating</span>;
    return <span className="flex items-center gap-1 text-xs px-2 py-0.5 bg-red-900/40 text-red-600 dark:text-red-400 rounded-full"><XCircle className="w-3 h-3" />Unavailable</span>;
  };

  return (
    <>
    <div className="text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button onClick={() => navigate("/coach-selection")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /><span className="text-sm">Back to Coach Selection</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="brand-gradient text-3xl font-bold bg-clip-text text-transparent">
                Coach Database
              </h1>
              <p className="text-muted-foreground mt-1">Manage coach candidates — add, edit, and track availability for the Coach Selection AI</p>
            </div>
            <button onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...emptyForm }); }}
              className="flex items-center gap-2 bg-teal-700 hover:bg-teal-600 text-white px-4 py-2 rounded-xl font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Add Coach
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total Coaches", value: coaches?.length || 0, color: "text-foreground" },
            { label: "Available", value: coaches?.filter(c => c.availability === "available").length || 0, color: "text-green-700 dark:text-green-400" },
            { label: "Negotiating", value: coaches?.filter(c => c.availability === "negotiating").length || 0, color: "text-yellow-700 dark:text-yellow-400" },
            { label: "Avg Rating", value: coaches?.length ? (coaches.reduce((s, c) => s + Number(c.rating), 0) / coaches.length).toFixed(1) : "—", color: "text-amber-700 dark:text-amber-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-muted/60 rounded-xl p-4 border border-border text-center">
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, nationality, title..."
              className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:border-teal-500" />
          </div>
          <select value={filterAvailability} onChange={e => setFilterAvailability(e.target.value)}
            className="px-4 py-2 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:border-teal-500">
            <option value="">All Availability</option>
            <option value="available">Available</option>
            <option value="negotiating">Negotiating</option>
            <option value="unavailable">Unavailable</option>
          </select>
        </div>

        {/* Coach Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filtered.map(coach => (
            <div key={coach.id} className="bg-muted/60 border border-border rounded-xl p-5 hover:border-teal-700/50 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {coach.photo_url ? (
                    <img src={coach.photo_url} alt={coach.name} className="w-12 h-12 rounded-full object-cover border-2 border-teal-700/50" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-teal-900/40 border-2 border-teal-700/50 flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-teal-700 dark:text-teal-400" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold text-foreground">{coach.name}</div>
                    <div className="text-xs text-muted-foreground">{coach.title || "Coach"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 fill-amber-400" />
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{Number(coach.rating).toFixed(1)}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {availabilityBadge(coach.availability)}
                {coach.preferred_formation && (
                  <span className="text-xs px-2 py-0.5 bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-full">{coach.preferred_formation}</span>
                )}
                {coach.nationality && (
                  <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-full flex items-center gap-1">
                    <Globe className="w-3 h-3" />{coach.nationality}
                  </span>
                )}
              </div>

              <div className="text-xs text-muted-foreground mb-3 flex items-center gap-3">
                <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{coach.years_experience} yrs exp</span>
              </div>

              {coach.playing_styles.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {coach.playing_styles.slice(0, 3).map((s: string) => (
                    <span key={s} className="text-xs px-1.5 py-0.5 bg-violet-900/30 text-violet-600 dark:text-violet-300 rounded">{s}</span>
                  ))}
                  {coach.playing_styles.length > 3 && <span className="text-xs text-muted-foreground">+{coach.playing_styles.length - 3}</span>}
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-border">
                <button onClick={() => setViewingCoach(coach as Coach)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-muted hover:bg-gray-600 rounded-lg text-xs transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button onClick={() => handleEdit(coach as Coach)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-teal-900/40 hover:bg-teal-800/50 text-teal-700 dark:text-teal-400 rounded-lg text-xs transition-colors">
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => { if (confirm("Delete this coach?")) deleteMutation.mutate({ id: coach.id }); }}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-xs transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              <UserCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">No coaches found</p>
              <p className="text-sm mt-1">Add your first coach candidate to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 overflow-y-auto py-8">
          <div className="bg-card border border-border rounded-2xl w-full max-w-3xl mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">{editingId ? "Edit Coach Profile" : "Add New Coach Candidate"}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" placeholder="e.g. Mohamed Hassan" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Title / Role</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" placeholder="e.g. Head Coach, Assistant Coach" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Nationality</label>
                <input value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" placeholder="e.g. Egyptian" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Age</label>
                <input type="number" value={form.age || ""} onChange={e => setForm(p => ({ ...p, age: parseInt(e.target.value) || undefined }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" placeholder="e.g. 45" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
                <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" placeholder="coach@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Phone</label>
                <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" placeholder="+20 1xx xxx xxxx" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Years of Experience</label>
                <input type="number" value={form.yearsExperience} onChange={e => setForm(p => ({ ...p, yearsExperience: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Preferred Formation</label>
                <select value={form.preferredFormation} onChange={e => setForm(p => ({ ...p, preferredFormation: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500">
                  <option value="">Select formation</option>
                  {FORMATIONS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Availability</label>
                <select value={form.availability} onChange={e => setForm(p => ({ ...p, availability: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500">
                  <option value="available">Available</option>
                  <option value="negotiating">Negotiating</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Contract Status</label>
                <select value={form.contractStatus} onChange={e => setForm(p => ({ ...p, contractStatus: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500">
                  <option value="free">Free Agent</option>
                  <option value="contracted">Contracted</option>
                  <option value="notice_period">Notice Period</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Expected Salary</label>
                <input value={form.expectedSalary} onChange={e => setForm(p => ({ ...p, expectedSalary: e.target.value }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" placeholder="e.g. $5,000/month" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Rating (0–10)</label>
                <input type="number" min="0" max="10" step="0.5" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1">LinkedIn URL</label>
              <input value={form.linkedinUrl} onChange={e => setForm(p => ({ ...p, linkedinUrl: e.target.value }))}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" placeholder="https://linkedin.com/in/..." />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-1">Bio / Summary</label>
              <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} rows={3}
                className="w-full px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" placeholder="Brief description of coaching philosophy and background..." />
            </div>

            {/* Playing Styles */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Playing Styles (select all that apply)</label>
              <div className="flex flex-wrap gap-2">
                {PLAYING_STYLES.map(s => (
                  <button key={s} type="button" onClick={() => toggleArrayField("playingStyles", s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.playingStyles.includes(s) ? "bg-violet-700 border-violet-600 text-white" : "border-border text-muted-foreground hover:border-gray-500"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Coaching Strengths */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Coaching Strengths</label>
              <div className="flex flex-wrap gap-2">
                {COACHING_STRENGTHS.map(s => (
                  <button key={s} type="button" onClick={() => toggleArrayField("coachingStrengths", s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.coachingStrengths.includes(s) ? "bg-teal-700 border-teal-600 text-white" : "border-border text-muted-foreground hover:border-gray-500"}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Certifications */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Certifications / Licenses</label>
              <div className="flex flex-wrap gap-2">
                {CERTIFICATIONS.map(c => (
                  <button key={c} type="button" onClick={() => toggleArrayField("certifications", c)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.certifications.includes(c) ? "bg-amber-700 border-amber-600 text-white" : "border-border text-muted-foreground hover:border-gray-500"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Languages</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map(l => (
                  <button key={l} type="button" onClick={() => toggleArrayField("languages", l)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${form.languages.includes(l) ? "bg-blue-700 border-blue-600 text-white" : "border-border text-muted-foreground hover:border-gray-500"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Achievements */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-muted-foreground mb-2">Achievements</label>
              <div className="flex gap-2 mb-2">
                <input value={newAchievement} onChange={e => setNewAchievement(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && newAchievement.trim()) { setForm(p => ({ ...p, achievements: [...p.achievements, newAchievement.trim()] })); setNewAchievement(""); } }}
                  className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm focus:outline-none focus:border-teal-500" placeholder="e.g. Won Egyptian Premier League 2022" />
                <button type="button" onClick={() => { if (newAchievement.trim()) { setForm(p => ({ ...p, achievements: [...p.achievements, newAchievement.trim()] })); setNewAchievement(""); } }}
                  className="px-3 py-2 bg-teal-700 hover:bg-teal-600 rounded-lg text-sm">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.achievements.map((a, i) => (
                  <span key={i} className="flex items-center gap-1 text-xs px-2 py-1 bg-muted rounded-full">
                    <Award className="w-3 h-3 text-amber-700 dark:text-amber-400" />{a}
                    <button onClick={() => setForm(p => ({ ...p, achievements: p.achievements.filter((_, j) => j !== i) }))} className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 ml-1">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowForm(false); setEditingId(null); }}
                className="flex-1 py-2.5 bg-muted hover:bg-gray-600 rounded-xl text-sm font-semibold transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={!form.name || createMutation.isPending || updateMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-700 hover:bg-teal-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors">
                <Save className="w-4 h-4" />{editingId ? "Update Coach" : "Add Coach"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Coach Modal */}
      {viewingCoach && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-start justify-between mb-5">
              <div className="flex items-center gap-4">
                {viewingCoach.photo_url ? (
                  <img src={viewingCoach.photo_url} alt={viewingCoach.name} className="w-16 h-16 rounded-full object-cover border-2 border-teal-600" />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-teal-900/40 border-2 border-teal-700 flex items-center justify-center">
                    <UserCheck className="w-8 h-8 text-teal-700 dark:text-teal-400" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-foreground">{viewingCoach.name}</h2>
                  <p className="text-muted-foreground text-sm">{viewingCoach.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {availabilityBadge(viewingCoach.availability)}
                    <span className="flex items-center gap-1 text-sm text-amber-700 dark:text-amber-400 font-bold">
                      <Star className="w-4 h-4 fill-amber-400" />{Number(viewingCoach.rating).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setViewingCoach(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              {viewingCoach.nationality && <div><span className="text-muted-foreground">Nationality:</span> <span className="text-foreground">{viewingCoach.nationality}</span></div>}
              {viewingCoach.age && <div><span className="text-muted-foreground">Age:</span> <span className="text-foreground">{viewingCoach.age}</span></div>}
              <div><span className="text-muted-foreground">Experience:</span> <span className="text-foreground">{viewingCoach.years_experience} years</span></div>
              {viewingCoach.preferred_formation && <div><span className="text-muted-foreground">Formation:</span> <span className="text-foreground">{viewingCoach.preferred_formation}</span></div>}
              <div><span className="text-muted-foreground">Contract:</span> <span className="text-foreground capitalize">{viewingCoach.contract_status.replace("_", " ")}</span></div>
            </div>

            {viewingCoach.bio && <p className="text-muted-foreground text-sm mb-4 leading-relaxed">{viewingCoach.bio}</p>}

            {viewingCoach.playing_styles.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground font-medium mb-1">Playing Styles</div>
                <div className="flex flex-wrap gap-1">{viewingCoach.playing_styles.map(s => <span key={s} className="text-xs px-2 py-0.5 bg-violet-900/40 text-violet-600 dark:text-violet-300 rounded-full">{s}</span>)}</div>
              </div>
            )}
            {viewingCoach.coaching_strengths.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground font-medium mb-1">Coaching Strengths</div>
                <div className="flex flex-wrap gap-1">{viewingCoach.coaching_strengths.map(s => <span key={s} className="text-xs px-2 py-0.5 bg-teal-900/40 text-teal-700 dark:text-teal-300 rounded-full">{s}</span>)}</div>
              </div>
            )}
            {viewingCoach.certifications.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground font-medium mb-1">Certifications</div>
                <div className="flex flex-wrap gap-1">{viewingCoach.certifications.map(c => <span key={c} className="text-xs px-2 py-0.5 bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full">{c}</span>)}</div>
              </div>
            )}
            {viewingCoach.languages.length > 0 && (
              <div className="mb-3">
                <div className="text-xs text-muted-foreground font-medium mb-1">Languages</div>
                <div className="flex flex-wrap gap-1">{viewingCoach.languages.map(l => <span key={l} className="text-xs px-2 py-0.5 bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full">{l}</span>)}</div>
              </div>
            )}
            {viewingCoach.achievements.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-muted-foreground font-medium mb-1">Achievements</div>
                <ul className="space-y-1">{viewingCoach.achievements.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground"><Award className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />{a}</li>
                ))}</ul>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-border">
              {viewingCoach.email && (
                <a href={`mailto:${viewingCoach.email}`} className="flex items-center gap-1 text-xs px-3 py-2 bg-muted hover:bg-gray-600 rounded-lg transition-colors">
                  <Mail className="w-3.5 h-3.5" />{viewingCoach.email}
                </a>
              )}
              {viewingCoach.linkedin_url && (
                <a href={viewingCoach.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs px-3 py-2 bg-blue-900/40 hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 rounded-lg transition-colors">
                  <Linkedin className="w-3.5 h-3.5" />LinkedIn
                </a>
              )}
                <button onClick={() => navigate(`/book-private-session?coachId=${viewingCoach.id}`)}
                className="flex items-center gap-1 text-xs px-3 py-2 bg-green-900/40 hover:bg-green-800/50 text-green-700 dark:text-green-400 rounded-lg transition-colors">
                <Calendar className="w-3.5 h-3.5" />{language === 'ar' ? 'حجز جلسة' : 'Book Session'}
              </button>
              <button onClick={() => { setViewingCoach(null); handleEdit(viewingCoach); }}
                className="ml-auto flex items-center gap-1 text-xs px-3 py-2 bg-teal-900/40 hover:bg-teal-800/50 text-teal-700 dark:text-teal-400 rounded-lg transition-colors">
                <Edit2 className="w-3.5 h-3.5" />Edit Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
