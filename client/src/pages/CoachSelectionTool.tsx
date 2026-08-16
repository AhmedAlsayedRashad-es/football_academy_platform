import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { useToast } from "../hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft, Users, Brain, Star, CheckCircle, ChevronRight,
  Target, Zap, Shield, TrendingUp, RefreshCw, Award, BarChart2,
  Sliders, Search, Filter, AlertCircle, Info, Database, Mail, Phone,
  Globe, Clock, Briefcase, FileText, Plus, X
} from "lucide-react";

interface DBCoach {
  id: number;
  name: string;
  nationality: string;
  age: number;
  email: string;
  phone: string;
  title: string;
  years_experience: number;
  preferred_formation: string;
  playing_styles: string[];
  coaching_strengths: string[];
  required_player_skills: string[];
  certifications: string[];
  languages: string[];
  bio: string;
  achievements: string[];
  availability: string;
  contract_status: string;
  rating: number;
  matchScore: number;
  styleScore: number;
  skillScore: number;
  formationScore: number;
  weaknessScore: number;
}

interface TeamProfile {
  formations: string[];
  playingStyles: string[];
  strengths: string[];
  weaknesses: string[];
  keySkills: string[];
  ageGroup: string;
  teamSize: string;
  extraNotes: string;
}

const PLAYING_STYLES = [
  "High Press", "Possession-Based", "Counter Attack", "Tiki-Taka",
  "Gegenpressing", "Wing Play", "Defensive Solidity", "Vertical Play",
  "Positional Play", "Direct Play", "Fast Transitions", "Set Piece Specialist",
  "Technical Football", "Physical Intensity", "Youth Development"
];

const TEAM_SKILLS = [
  "Speed", "Dribbling", "Passing Accuracy", "First Touch", "Aerial Ability",
  "Physical Strength", "Stamina", "Pressing Intensity", "Spatial Awareness",
  "Quick Decision Making", "Technical Ability", "Defensive Positioning",
  "Creative Midfield", "Set Pieces", "Finishing"
];

const FORMATIONS_11 = ["4-3-3", "4-2-3-1", "4-4-2", "3-5-2", "4-4-2 Diamond", "5-3-2", "4-1-4-1", "3-4-3", "4-3-2-1"];
const FORMATIONS_9 = ["3-2-3", "3-3-2", "2-3-3", "3-2-2-1", "4-2-2"];
const FORMATIONS_7 = ["2-3-1", "3-2-1", "2-2-2", "1-3-2", "3-1-2"];

const WEAKNESSES = [
  "Defensive Organization", "Set Piece Defense", "Aerial Duels", "Transition Speed",
  "Ball Retention", "Physical Conditioning", "Creative Play", "Finishing",
  "Pressing Intensity", "Tactical Discipline"
];

const AVAILABILITY_COLORS: Record<string, string> = {
  available: "bg-green-900/40 text-green-700 dark:text-green-400 border-green-700/40",
  negotiating: "bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-700/40",
  contracted: "bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-700/40",
  unavailable: "bg-red-900/40 text-red-600 dark:text-red-400 border-red-700/40",
};

export default function CoachSelectionTool() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [step, setStep] = useState<"setup" | "results">("setup");
  const [analyzing, setAnalyzing] = useState(false);
  const [rankedCoaches, setRankedCoaches] = useState<DBCoach[]>([]);
  const [selectedCoach, setSelectedCoach] = useState<DBCoach | null>(null);
  const [queryInput, setQueryInput] = useState<{
    teamFormation: string;
    teamPlayingStyles: string[];
    teamSkills: string[];
    teamWeaknesses: string[];
  } | null>(null);
  const [filterAvailability, setFilterAvailability] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"match" | "experience" | "rating">("match");

  const [team, setTeam] = useState<TeamProfile>({
    formations: ["4-3-3"],
    playingStyles: [],
    strengths: [],
    weaknesses: [],
    keySkills: [],
    ageGroup: "U-21",
    teamSize: "11v11",
    extraNotes: ""
  });

  const matchQuery = trpc.coachCandidates.matchToTeam.useQuery(
    queryInput!,
    { enabled: !!queryInput }
  );

  useEffect(() => {
    if (matchQuery.data && analyzing) {
      setRankedCoaches(matchQuery.data as DBCoach[]);
      setAnalyzing(false);
      setStep("results");
      toast({ title: "Analysis Complete", description: `Found ${(matchQuery.data as DBCoach[]).length} coaches ranked by compatibility from your database.` });
    }
    if (matchQuery.error && analyzing) {
      setAnalyzing(false);
      toast({ title: "Error", description: "Could not fetch coaches from database.", variant: "destructive" });
    }
  }, [matchQuery.data, matchQuery.error]);

  const toggleArrayItem = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter(x => x !== item) : [...arr, item]);
  };

  const toggleFormation = (f: string) => {
    setTeam(t => ({
      ...t,
      formations: t.formations.includes(f)
        ? t.formations.filter(x => x !== f)
        : [...t.formations, f]
    }));
  };

  const handleAnalyze = () => {
    if (team.formations.length === 0) {
      toast({ title: "Incomplete Profile", description: "Please select at least one formation.", variant: "destructive" });
      return;
    }
    if (team.playingStyles.length === 0 || team.keySkills.length === 0) {
      toast({ title: "Incomplete Profile", description: "Please select at least one playing style and team skill.", variant: "destructive" });
      return;
    }
    setAnalyzing(true);
    // Use the primary formation (first selected) for matching, but pass all formations in notes context
    setQueryInput({
      teamFormation: team.formations[0],
      teamPlayingStyles: team.playingStyles,
      teamSkills: team.keySkills,
      teamWeaknesses: team.weaknesses,
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-700 dark:text-green-400";
    if (score >= 50) return "text-yellow-700 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 75) return "bg-green-900/30 border-green-700/40";
    if (score >= 50) return "bg-yellow-900/30 border-yellow-700/40";
    return "bg-red-900/30 border-red-700/40";
  };

  const buildMatchReasons = (coach: DBCoach): string[] => {
    const reasons: string[] = [];
    const styleMatches = team.playingStyles.filter(s => coach.playing_styles.includes(s));
    if (styleMatches.length > 0) reasons.push(`Style match: ${styleMatches.slice(0,2).join(", ")}`);
    const skillMatches = team.keySkills.filter(s => coach.required_player_skills.includes(s));
    if (skillMatches.length > 0) reasons.push(`Skills align: ${skillMatches.slice(0,2).join(", ")}`);
    const formationMatches = team.formations.filter(f => coach.preferred_formation === f);
    if (formationMatches.length > 0) reasons.push(`Formation match: ${formationMatches[0]}`);
    const weaknessCovered = team.weaknesses.some(w => coach.coaching_strengths.some(s => s.toLowerCase().includes(w.toLowerCase().split(" ")[0])));
    if (weaknessCovered) reasons.push("Coach strengths cover team weaknesses");
    return reasons;
  };

  // Enhanced match score that accounts for multiple formations
  const getEnhancedScore = (coach: DBCoach): number => {
    // Check if coach formation matches ANY of the selected formations
    const formationBonus = team.formations.includes(coach.preferred_formation) ? 15 : 0;
    // Base score already includes formation from backend (single formation)
    // Recalculate with multi-formation awareness
    const styleMatch = team.playingStyles.length > 0
      ? team.playingStyles.filter(s => coach.playing_styles.includes(s)).length / team.playingStyles.length
      : 0;
    const skillMatch = team.keySkills.length > 0
      ? team.keySkills.filter(s => coach.required_player_skills.includes(s)).length / team.keySkills.length
      : 0;
    const weaknessMatch = team.weaknesses.length > 0
      ? team.weaknesses.filter(w => coach.coaching_strengths.some(s => s.toLowerCase().includes(w.toLowerCase().split(" ")[0]))).length / team.weaknesses.length
      : 0;
    return Math.min(100, Math.round((styleMatch * 40) + (skillMatch * 35) + (formationBonus) + (weaknessMatch * 10)));
  };

  const getFormationsForSize = () => {
    if (team.teamSize === "7v7") return FORMATIONS_7;
    if (team.teamSize === "9v9") return FORMATIONS_9;
    return FORMATIONS_11;
  };

  const filteredAndSortedCoaches = [...rankedCoaches]
    .map(c => ({ ...c, enhancedScore: getEnhancedScore(c) }))
    .filter(c => filterAvailability === "all" || c.availability === filterAvailability)
    .sort((a, b) => {
      if (sortBy === "experience") return b.years_experience - a.years_experience;
      if (sortBy === "rating") return b.rating - a.rating;
      return b.enhancedScore - a.enhancedScore;
    });

  return (
    <>
    <div className="text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate("/features-hub")} className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={20}/>
          </button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Users size={22} className="text-red-500"/>
              AI Coach Selection Tool
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Match the right coach from your database to your team's playing style, skills, and tactical needs
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => navigate("/coach-database")}
              className="flex items-center gap-2 px-3 py-2 bg-teal-900/40 hover:bg-teal-800/50 text-teal-700 dark:text-teal-400 rounded-lg text-sm border border-teal-800/50 transition-colors"
            >
              <Database size={14}/> Manage Coach DB
            </button>
            {step === "results" && (
              <button
                onClick={() => { setStep("setup"); setQueryInput(null); setRankedCoaches([]); }}
                className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted rounded-lg text-sm text-muted-foreground"
              >
                <Sliders size={14}/> Adjust Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {step === "setup" && (
          <div className="grid grid-cols-2 gap-6">
            {/* Left: Team Profile Setup */}
            <div className="space-y-5">
              {/* Team Size + Formation */}
              <div className="bg-card rounded-xl p-5 border border-border">
                <h2 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                  <Target size={16} className="text-red-500"/> Team Format, Formation & Age Group
                </h2>

                {/* Team Size */}
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-2 block">Team Size</label>
                  <div className="flex gap-2">
                    {["7v7", "9v9", "11v11"].map(size => (
                      <button
                        key={size}
                        onClick={() => {
                          setTeam(t => ({ ...t, teamSize: size, formations: [] }));
                        }}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                          team.teamSize === size
                            ? "bg-red-700 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Multi-select Formations */}
                <div className="mb-4">
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                    <span>Formations</span>
                    <span className="text-gray-600 ml-1">(multi-select)</span>
                    {team.formations.length > 0 && (
                      <span className="ml-auto text-red-600 dark:text-red-400 font-semibold">{team.formations.length} selected</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {getFormationsForSize().map(f => (
                      <button
                        key={f}
                        onClick={() => toggleFormation(f)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-all relative ${
                          team.formations.includes(f)
                            ? "bg-red-700 text-white ring-2 ring-red-500"
                            : "bg-muted text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {f}
                        {team.formations.includes(f) && (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle size={10} className="text-foreground"/>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {team.formations.length > 0 && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      Primary: <span className="text-red-600 dark:text-red-400 font-semibold">{team.formations[0]}</span>
                      {team.formations.length > 1 && <span className="ml-1">+ {team.formations.length - 1} alternate(s)</span>}
                    </div>
                  )}
                </div>

                {/* Age Group */}
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Age Group</label>
                  <div className="flex flex-wrap gap-2">
                    {["U-10", "U-12", "U-15", "U-17", "U-19", "U-21", "Senior"].map(ag => (
                      <button
                        key={ag}
                        onClick={() => setTeam(t => ({ ...t, ageGroup: ag }))}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                          team.ageGroup === ag
                            ? "bg-blue-700 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {ag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Playing Style */}
              <div className="bg-card rounded-xl p-5 border border-border">
                <h2 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-yellow-700 dark:text-yellow-400"/> Playing Style
                  <span className="text-xs text-muted-foreground font-normal ml-auto">{team.playingStyles.length} selected</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {PLAYING_STYLES.map(style => (
                    <button
                      key={style}
                      onClick={() => toggleArrayItem(team.playingStyles, style, v => setTeam(t => ({ ...t, playingStyles: v })))}
                      className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                        team.playingStyles.includes(style)
                          ? "bg-yellow-700 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Team Key Skills */}
              <div className="bg-card rounded-xl p-5 border border-border">
                <h2 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                  <BarChart2 size={16} className="text-blue-600 dark:text-blue-400"/> Team Key Skills
                  <span className="text-xs text-muted-foreground font-normal ml-auto">{team.keySkills.length} selected</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {TEAM_SKILLS.map(skill => (
                    <button
                      key={skill}
                      onClick={() => toggleArrayItem(team.keySkills, skill, v => setTeam(t => ({ ...t, keySkills: v })))}
                      className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                        team.keySkills.includes(skill)
                          ? "bg-blue-700 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Weaknesses + Notes + Analyze */}
            <div className="space-y-5">
              <div className="bg-card rounded-xl p-5 border border-border">
                <h2 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                  <Shield size={16} className="text-orange-700 dark:text-orange-400"/> Team Weaknesses to Address
                  <span className="text-xs text-muted-foreground font-normal ml-auto">{team.weaknesses.length} selected</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {WEAKNESSES.map(w => (
                    <button
                      key={w}
                      onClick={() => toggleArrayItem(team.weaknesses, w, v => setTeam(t => ({ ...t, weaknesses: v })))}
                      className={`px-2.5 py-1 rounded-full text-xs transition-all ${
                        team.weaknesses.includes(w)
                          ? "bg-orange-700 text-white"
                          : "bg-muted text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra Notes Field */}
              <div className="bg-card rounded-xl p-5 border border-border">
                <h2 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                  <FileText size={16} className="text-purple-600 dark:text-purple-400"/> Additional Requirements & Notes
                  <span className="text-xs text-muted-foreground font-normal ml-1">(optional)</span>
                </h2>
                <textarea
                  value={team.extraNotes}
                  onChange={e => setTeam(t => ({ ...t, extraNotes: e.target.value }))}
                  placeholder="e.g. Must speak Arabic, experience with youth development in Egypt, UEFA Pro License required, available to start immediately, preference for Egyptian coaches, experience with African football..."
                  rows={4}
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-gray-600 focus:outline-none focus:border-purple-600 resize-none"
                />
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {["Arabic speaker", "Egyptian coach", "UEFA Pro License", "Youth specialist", "Immediate start", "African football exp"].map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        const current = team.extraNotes;
                        if (!current.includes(tag)) {
                          setTeam(t => ({ ...t, extraNotes: current ? `${current}, ${tag}` : tag }));
                        }
                      }}
                      className="text-xs bg-muted hover:bg-muted text-muted-foreground hover:text-purple-600 dark:hover:text-purple-400 border border-border px-2 py-0.5 rounded-full transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div className="bg-card rounded-xl p-5 border border-border">
                <h2 className="text-foreground font-semibold mb-3 flex items-center gap-2">
                  <Info size={16} className="text-teal-700 dark:text-teal-400"/> How It Works
                </h2>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">1</div>
                    <span>Select team format (7v7/9v9/11v11), <strong className="text-muted-foreground">multiple formations</strong>, playing style, skills, and areas to improve</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">2</div>
                    <span>AI queries your live Coach Database and scores each coach on 4 dimensions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">3</div>
                    <span>Coaches ranked by: 40% style, 35% skills, 15% formation (any selected), 10% weakness coverage</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">4</div>
                    <span>Review detailed profiles, contact info, and specific match reasons. Use notes to add extra criteria.</span>
                  </div>
                </div>
              </div>

              <div className="bg-teal-900/20 rounded-xl p-4 border border-teal-700/40">
                <div className="flex items-center gap-2 mb-2">
                  <Database size={14} className="text-teal-700 dark:text-teal-400"/>
                  <span className="text-teal-700 dark:text-teal-400 text-xs font-semibold">Live Database Connected</span>
                </div>
                <p className="text-muted-foreground text-xs">Results come from your real Coach Database. Add more coaches via the "Manage Coach DB" button above to improve match quality.</p>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={analyzing || matchQuery.isFetching}
                className="w-full bg-red-700 hover:bg-red-600 disabled:bg-muted text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 text-lg transition-all"
              >
                {(analyzing || matchQuery.isFetching) ? (
                  <><RefreshCw size={20} className="animate-spin"/> Searching Coach Database...</>
                ) : (
                  <><Brain size={20}/> Find Best Coach Match</>
                )}
              </button>
            </div>
          </div>
        )}

        {step === "results" && (
          <div className="grid grid-cols-3 gap-6">
            {/* Coach Rankings */}
            <div className="col-span-2 space-y-3">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div>
                  <h2 className="text-foreground font-semibold text-lg">
                    Coach Rankings · {team.teamSize} · {team.ageGroup}
                  </h2>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {team.formations.map(f => (
                      <span key={f} className="text-xs bg-red-900/30 text-red-600 dark:text-red-400 border border-red-700/30 px-2 py-0.5 rounded-full font-mono">{f}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={filterAvailability}
                    onChange={e => setFilterAvailability(e.target.value)}
                    className="bg-muted border border-border text-muted-foreground text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    <option value="all">All Availability</option>
                    <option value="available">Available</option>
                    <option value="negotiating">Negotiating</option>
                    <option value="contracted">Contracted</option>
                  </select>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as any)}
                    className="bg-muted border border-border text-muted-foreground text-xs rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    <option value="match">Sort: Best Match</option>
                    <option value="experience">Sort: Experience</option>
                    <option value="rating">Sort: Rating</option>
                  </select>
                  <span className="text-xs text-teal-700 dark:text-teal-400 flex items-center gap-1">
                    <Database size={11}/> {filteredAndSortedCoaches.length} coaches
                  </span>
                </div>
              </div>

              {/* Extra notes display */}
              {team.extraNotes && (
                <div className="bg-purple-900/20 border border-purple-700/30 rounded-lg px-4 py-2.5 flex items-start gap-2">
                  <FileText size={13} className="text-purple-600 dark:text-purple-400 mt-0.5 shrink-0"/>
                  <div>
                    <span className="text-purple-600 dark:text-purple-400 text-xs font-semibold">Additional Requirements: </span>
                    <span className="text-muted-foreground text-xs">{team.extraNotes}</span>
                  </div>
                </div>
              )}

              {filteredAndSortedCoaches.length === 0 && (
                <div className="bg-card rounded-xl p-8 border border-border text-center">
                  <AlertCircle size={32} className="text-gray-600 mx-auto mb-3"/>
                  <p className="text-muted-foreground">No coaches found in database. Add coaches via the Manage Coach DB button.</p>
                </div>
              )}
              {filteredAndSortedCoaches.map((coach, i) => {
                const reasons = buildMatchReasons(coach);
                const displayScore = coach.enhancedScore;
                return (
                  <div
                    key={coach.id}
                    onClick={() => setSelectedCoach(selectedCoach?.id === coach.id ? null : coach)}
                    className={`bg-card rounded-xl p-4 border cursor-pointer transition-all ${
                      selectedCoach?.id === coach.id
                        ? "border-red-600 bg-red-900/10"
                        : "border-border hover:border-border"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Rank badge */}
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                        i === 0 ? "bg-yellow-500 text-black" :
                        i === 1 ? "bg-gray-400 text-black" :
                        i === 2 ? "bg-orange-700 text-white" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {i + 1}
                      </div>

                      {/* Coach info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-foreground font-bold text-base">{coach.name}</h3>
                            <p className="text-muted-foreground text-xs">{coach.title} · {coach.nationality} · {coach.years_experience}y exp · {coach.preferred_formation}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-0.5 rounded-full border ${AVAILABILITY_COLORS[coach.availability] || "bg-muted text-muted-foreground border-border"}`}>
                                {coach.availability}
                              </span>
                              {team.formations.includes(coach.preferred_formation) && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/30 text-red-600 dark:text-red-400 border border-red-700/30">
                                  ✓ Formation Match
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Match score */}
                          <div className={`text-center px-3 py-2 rounded-lg border ${getScoreBg(displayScore)}`}>
                            <div className={`text-2xl font-black ${getScoreColor(displayScore)}`}>{displayScore}%</div>
                            <div className="text-xs text-muted-foreground">Match</div>
                          </div>
                        </div>

                        {/* Match reasons */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {reasons.slice(0, 3).map((reason, j) => (
                            <span key={j} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                              {reason}
                            </span>
                          ))}
                        </div>

                        {/* Score breakdown */}
                        <div className="flex gap-3 mt-2">
                          <span className="text-xs text-muted-foreground">Style: <span className={getScoreColor(coach.styleScore)}>{coach.styleScore}%</span></span>
                          <span className="text-xs text-muted-foreground">Skills: <span className={getScoreColor(coach.skillScore)}>{coach.skillScore}%</span></span>
                          <span className="text-xs text-muted-foreground">Formation: <span className={getScoreColor(coach.formationScore)}>{coach.formationScore}%</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded detail */}
                    {selectedCoach?.id === coach.id && (
                      <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-2 font-medium">Bio</div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{coach.bio}</p>
                          <div className="text-xs text-muted-foreground mt-3 mb-2 font-medium">Achievements</div>
                          {coach.achievements.map((a, j) => (
                            <div key={j} className="flex items-center gap-1.5 mb-1">
                              <Award size={11} className="text-yellow-700 dark:text-yellow-400"/>
                              <span className="text-xs text-muted-foreground">{a}</span>
                            </div>
                          ))}
                          <div className="text-xs text-muted-foreground mt-3 mb-2 font-medium">Contact</div>
                          <div className="space-y-1">
                            {coach.email && (
                              <a href={`mailto:${coach.email}`} className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">
                                <Mail size={11}/>{coach.email}
                              </a>
                            )}
                            {coach.phone && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Phone size={11}/>{coach.phone}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-3 mb-1 font-medium">Certifications</div>
                          <div className="flex flex-wrap gap-1">
                            {coach.certifications.map(c => (
                              <span key={c} className="text-xs bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-700/30 px-2 py-0.5 rounded-full">{c}</span>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground mt-2 mb-1 font-medium">Languages</div>
                          <div className="flex flex-wrap gap-1">
                            {coach.languages.map(l => (
                              <span key={l} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">{l}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-2 font-medium">Playing Styles</div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {coach.playing_styles.map(s => (
                              <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${
                                team.playingStyles.includes(s) ? "bg-yellow-700 text-white" : "bg-muted text-muted-foreground"
                              }`}>{s}</span>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground mb-2 font-medium">Coaching Strengths</div>
                          <div className="flex flex-wrap gap-1 mb-3">
                            {coach.coaching_strengths.map(s => (
                              <span key={s} className="text-xs bg-green-900/30 text-green-700 dark:text-green-400 border border-green-700/30 px-2 py-0.5 rounded-full">{s}</span>
                            ))}
                          </div>
                          <div className="text-xs text-muted-foreground mb-2 font-medium">Required Player Skills</div>
                          <div className="flex flex-wrap gap-1">
                            {coach.required_player_skills.map(s => (
                              <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${
                                team.keySkills.includes(s) ? "bg-blue-700 text-white" : "bg-muted text-muted-foreground"
                              }`}>{s}</span>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center gap-1">
                            {Array.from({ length: 10 }).map((_, j) => (
                              <div key={j} className={`w-3 h-3 rounded-sm ${j < Math.floor(coach.rating) ? "bg-yellow-400" : "bg-muted"}`}/>
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">{coach.rating}/10</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              {filteredAndSortedCoaches[0] && (
                <div className="bg-card rounded-xl p-5 border border-yellow-700/40">
                  <div className="text-yellow-700 dark:text-yellow-400 text-xs font-bold mb-3 flex items-center gap-1.5">
                    <Star size={12} className="fill-yellow-400"/> TOP RECOMMENDATION
                  </div>
                  <div className="text-foreground font-bold text-lg">{filteredAndSortedCoaches[0].name}</div>
                  <div className="text-muted-foreground text-sm mb-1">{filteredAndSortedCoaches[0].title}</div>
                  <div className="text-muted-foreground text-xs mb-3">{filteredAndSortedCoaches[0].nationality} · {filteredAndSortedCoaches[0].preferred_formation}</div>
                  <div className={`text-4xl font-black text-center py-3 rounded-lg ${getScoreBg(filteredAndSortedCoaches[0].enhancedScore)}`}>
                    <span className={getScoreColor(filteredAndSortedCoaches[0].enhancedScore)}>{filteredAndSortedCoaches[0].enhancedScore}%</span>
                    <div className="text-xs text-muted-foreground font-normal mt-1">Overall Match</div>
                  </div>
                  {filteredAndSortedCoaches[0].email && (
                    <a
                      href={`mailto:${filteredAndSortedCoaches[0].email}`}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 bg-blue-900/40 hover:bg-blue-800/50 text-blue-600 dark:text-blue-400 rounded-lg text-sm border border-blue-700/40 transition-colors"
                    >
                      <Mail size={14}/> Contact Coach
                    </a>
                  )}
                </div>
              )}

              <div className="bg-card rounded-xl p-5 border border-border">
                <div className="text-muted-foreground text-xs font-medium mb-3">Your Team Profile</div>
                <div className="space-y-2 text-xs">
                  <div><span className="text-muted-foreground">Team Size:</span> <span className="text-foreground font-semibold ml-2">{team.teamSize}</span></div>
                  <div><span className="text-muted-foreground">Age Group:</span> <span className="text-foreground font-semibold ml-2">{team.ageGroup}</span></div>
                  <div className="mt-2">
                    <span className="text-muted-foreground">Formations:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {team.formations.map(f => <span key={f} className="bg-red-900/30 text-red-600 dark:text-red-400 border border-red-700/30 px-1.5 py-0.5 rounded text-xs font-mono">{f}</span>)}
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-muted-foreground">Playing Styles:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {team.playingStyles.map(s => <span key={s} className="bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded text-xs">{s}</span>)}
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-muted-foreground">Key Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {team.keySkills.slice(0,6).map(s => <span key={s} className="bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded text-xs">{s}</span>)}
                      {team.keySkills.length > 6 && <span className="text-muted-foreground text-xs">+{team.keySkills.length - 6} more</span>}
                    </div>
                  </div>
                  {team.extraNotes && (
                    <div className="mt-2">
                      <span className="text-muted-foreground">Notes:</span>
                      <p className="text-muted-foreground text-xs mt-1 leading-relaxed">{team.extraNotes.slice(0, 80)}{team.extraNotes.length > 80 ? "..." : ""}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border border-border">
                <div className="text-muted-foreground text-xs font-medium mb-2">Score Legend</div>
                {([["75-100%","Excellent Match","text-green-700 dark:text-green-400"],["50-74%","Good Match","text-yellow-700 dark:text-yellow-400"],["0-49%","Partial Match","text-red-600 dark:text-red-400"]] as [string,string,string][]).map(([range, label, color]) => {
                  const bgColor = color.replace("text-","bg-");
                  return (
                  <div key={range} className="flex items-center gap-2 mb-1.5">
                    <div className={`w-2 h-2 rounded-full ${bgColor}`}/>
                    <span className={`text-xs font-bold ${color}`}>{range}</span>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
