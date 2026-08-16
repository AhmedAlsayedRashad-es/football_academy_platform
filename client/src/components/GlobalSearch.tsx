import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Search, X, Users, Activity, Calendar, Video, BarChart3, Brain, Trophy, BookOpen, Settings, ClipboardList, Heart, Dumbbell, Swords, ChevronRight, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

// Breadcrumb trail mapping: category → parent section label
const CATEGORY_BREADCRUMB: Record<string, string[]> = {
  "Player Management": ["Dashboard", "Players"],
  "Players": ["Dashboard", "Players"],
  "Team": ["Dashboard", "Teams"],
  "Training": ["Dashboard", "Training"],
  "Matches": ["Dashboard", "Matches"],
  "Tactics": ["Dashboard", "Tactics & Formations"],
  "Video": ["Dashboard", "Video Analysis"],
  "Advanced Tools": ["Dashboard", "Advanced Tools"],
  "Analytics": ["Dashboard", "Analytics"],
  "Staff Tools": ["Dashboard", "Medical & Staff"],
  "Education": ["Dashboard", "Coaching Education"],
  "Admin": ["Dashboard", "Admin"],
};

const RECENT_SEARCHES_KEY = "footy_recent_searches";
const MAX_RECENT = 5;

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  path: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Static navigation items for quick access
const STATIC_RESULTS: SearchResult[] = [
  // Players
  { id: "players", title: "Players", subtitle: "View all players", path: "/players", category: "Player Management", icon: Users },
  { id: "skill-assessment", title: "Skill Assessment", subtitle: "Assess player skills", path: "/skill-assessment", category: "Player Management", icon: ClipboardList },
  { id: "player-comparison", title: "Player Comparison", subtitle: "Compare player stats", path: "/coach/player-comparison", category: "Player Management", icon: Users },
  { id: "attendance", title: "Attendance Tracking", subtitle: "Track player attendance", path: "/attendance", category: "Player Management", icon: ClipboardList },
  
  // Team Management
  { id: "team-management", title: "Team Management", subtitle: "Manage team staff & players", path: "/team-management", category: "Team", icon: Users },
  { id: "load-management", title: "Load Management", subtitle: "A:C ratio & muscle alerts", path: "/load-management", category: "Team", icon: Activity },
  { id: "training-session-recorder", title: "Session Recorder", subtitle: "Record training sessions", path: "/training-session-recorder", category: "Team", icon: ClipboardList },
  { id: "team-dashboard", title: "Team Dashboard", subtitle: "Team overview", path: "/team-dashboard", category: "Team", icon: Trophy },
  
  // Training
  { id: "training", title: "Training", subtitle: "Training management", path: "/training", category: "Training", icon: Calendar },
  { id: "training-library", title: "Training Library", subtitle: "Browse training drills", path: "/training-library", category: "Training", icon: BookOpen },
  { id: "training-innovation-hub", title: "Training Innovation Hub", subtitle: "AI session planner & drills", path: "/training-innovation-hub", category: "Training", icon: Brain },
  { id: "player-development-plan", title: "Player Development Plan", subtitle: "Individual development plans", path: "/player-development-plan", category: "Training", icon: ClipboardList },
  
  // Matches & Tactics
  { id: "matches", title: "Matches", subtitle: "Match management", path: "/matches", category: "Matches", icon: Swords },
  { id: "tactical-board", title: "Tactical Board", subtitle: "Professional tactical board", path: "/professional-tactical-board", category: "Tactics", icon: Trophy },
  { id: "formation-builder", title: "Formation Builder", subtitle: "Build team formations", path: "/formation-builder", category: "Tactics", icon: Users },
  { id: "ai-match-coach", title: "AI Match Coach", subtitle: "Real-time AI coaching", path: "/ai-match-coach", category: "Advanced Tools", icon: Brain },
  
  // Video Analysis
  { id: "videos", title: "Video Library", subtitle: "Browse training videos", path: "/videos", category: "Video", icon: Video },
  { id: "ai-video-recommendations", title: "AI Video Recommendations", subtitle: "AI-powered skill videos", path: "/ai-video-recommendations", category: "Video", icon: Brain },
  
  // Advanced Tools
  { id: "features-hub", title: "Features Hub", subtitle: "All AI tools", path: "/features-hub", category: "Advanced Tools", icon: Brain },
  { id: "ai-coach", title: "AI Coach Assistant", subtitle: "AI coaching assistant", path: "/ai-coach", category: "Advanced Tools", icon: Brain },
  { id: "advanced-tactical-hub", title: "Advanced Tactical Hub", subtitle: "xG, heatmaps, counter plans", path: "/advanced-tactical-hub", category: "Advanced Tools", icon: Brain },
  { id: "team-needs-analysis", title: "Team Needs Analysis", subtitle: "Position & skill gap analysis", path: "/team-needs-analysis", category: "Advanced Tools", icon: Brain },
  { id: "coach-selection", title: "Coach Selection Tool", subtitle: "Match coaches to team style", path: "/coach-selection", category: "Advanced Tools", icon: Brain },
  
  // Analytics
  { id: "analytics", title: "Performance Analytics", subtitle: "Team & player analytics", path: "/analytics", category: "Analytics", icon: BarChart3 },
  { id: "xg-analytics", title: "xG Analytics", subtitle: "Expected goals analysis", path: "/xg-analytics", category: "Analytics", icon: BarChart3 },
  { id: "match-reports", title: "Match Reports", subtitle: "View match reports", path: "/match-reports", category: "Analytics", icon: BarChart3 },
  
  // Staff Tools
  { id: "mental", title: "Mental Coaching", subtitle: "Mental performance tools", path: "/mental", category: "Staff Tools", icon: Brain },
  { id: "physical", title: "Physical Training", subtitle: "Physical conditioning", path: "/physical", category: "Staff Tools", icon: Dumbbell },
  { id: "nutrition", title: "Nutrition", subtitle: "Nutrition tracking", path: "/nutrition", category: "Staff Tools", icon: Heart },
  { id: "injury-tracking", title: "Injury Tracking", subtitle: "Track player injuries", path: "/coach/injury-tracking", category: "Staff Tools", icon: Heart },
  
  // Education
  { id: "coaching-courses", title: "Coaching Courses", subtitle: "UEFA/CAF courses", path: "/coach-education/courses", category: "Education", icon: BookOpen },
  { id: "football-laws", title: "Football Laws", subtitle: "FIFA laws of the game", path: "/coach-education/laws", category: "Education", icon: BookOpen },
  { id: "coach-database", title: "Coach Database", subtitle: "Browse coach candidates", path: "/coach-database", category: "Education", icon: Users },
  
  // Admin
  { id: "settings", title: "Settings", subtitle: "Platform settings", path: "/settings", category: "Admin", icon: Settings },
  { id: "user-management", title: "User Management", subtitle: "Manage platform users", path: "/user-management", category: "Admin", icon: Users },
  { id: "enrollment-admin", title: "Enrollment Review", subtitle: "Review enrollment requests", path: "/enrollment-admin", category: "Admin", icon: ClipboardList },
];

const CATEGORY_ORDER = ["Team", "Player Management", "Training", "Matches", "Tactics", "Video", "Advanced Tools", "Analytics", "Staff Tools", "Education", "Admin"];

// Recent searches helpers
function getRecentSearches(): SearchResult[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(result: SearchResult) {
  try {
    const recent = getRecentSearches().filter(r => r.id !== result.id);
    // Re-attach icon from STATIC_RESULTS (icons can't be serialized)
    const withIcon = { ...result, icon: result.icon };
    const updated = [withIcon, ...recent].slice(0, MAX_RECENT);
    // Store without icon (will be resolved on load)
    const toStore = updated.map(({ icon: _icon, ...rest }) => rest);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(toStore));
  } catch {}
}

function resolveRecentSearches(): SearchResult[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const stored: Omit<SearchResult, "icon">[] = JSON.parse(raw);
    return stored.map(item => {
      const found = STATIC_RESULTS.find(s => s.id === item.id);
      return { ...item, icon: found?.icon || Users } as SearchResult;
    });
  } catch {
    return [];
  }
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Search players from DB
  const { data: playersData } = trpc.players.getAll.useQuery(undefined, {
    enabled: open && query.length >= 2,
    staleTime: 60000,
  });
  const playersList = Array.isArray(playersData) ? playersData : [];

  // Filter static results
  const filteredStatic = query.length < 1
    ? STATIC_RESULTS.slice(0, 8)
    : STATIC_RESULTS.filter(r =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
        r.category.toLowerCase().includes(query.toLowerCase())
      );

  // Filter players
  const filteredPlayers: SearchResult[] = query.length >= 2 && playersList.length > 0
    ? playersList
        .filter((p: any) =>
          `${p.firstName} ${p.lastName}`.toLowerCase().includes(query.toLowerCase()) ||
          p.position?.toLowerCase().includes(query.toLowerCase())
        )
        .slice(0, 5)
        .map((p: any) => ({
          id: `player-${p.id}`,
          title: `${p.firstName} ${p.lastName}`,
          subtitle: `${p.position || "Player"} • ${p.teamName || "No team"}`,
          path: `/player/${p.id}`,
          category: "Players",
          icon: Users,
        }))
    : [];

  // Show recent searches when no query
  const recentSearches = query.length < 1 ? resolveRecentSearches() : [];

  const allResults = [...filteredPlayers, ...filteredStatic];

  // Flat list for keyboard navigation
  const flatResults: SearchResult[] = query.length < 1
    ? [...recentSearches, ...STATIC_RESULTS.slice(0, 8)]
    : [...filteredPlayers, ...filteredStatic];

  // Group by category
  const grouped = allResults.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const sortedCategories = Object.keys(grouped).sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a);
    const bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const handleSelect = useCallback((result: SearchResult) => {
    saveRecentSearch(result);
    navigate(result.path);
    setOpen(false);
    setQuery("");
    setActiveIndex(-1);
  }, [navigate]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.querySelector(`[data-idx="${activeIndex}"]`) as HTMLElement;
      activeEl?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // Keyboard shortcut: Ctrl+K or Cmd+K + arrow navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        setActiveIndex(-1);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Arrow key navigation inside the dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, flatResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && flatResults[activeIndex]) {
        handleSelect(flatResults[activeIndex]);
      }
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
        setActiveIndex(-1);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Build flat index map for keyboard highlight
  const flatIndexMap = new Map<string, number>();
  let flatIdx = 0;
  if (query.length < 1) {
    recentSearches.forEach(r => { flatIndexMap.set(`recent-${r.id}`, flatIdx++); });
    STATIC_RESULTS.slice(0, 8).forEach(r => { flatIndexMap.set(r.id, flatIdx++); });
  } else {
    filteredPlayers.forEach(r => { flatIndexMap.set(r.id, flatIdx++); });
    filteredStatic.forEach(r => { flatIndexMap.set(r.id, flatIdx++); });
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search trigger button */}
      <button
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 50);
        }}
        className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-md border border-input bg-background text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors min-w-[120px] sm:min-w-[180px] max-w-full"
        title="Search platform (Ctrl+K)"
      >
        <Search className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-60">
          ⌘K
        </kbd>
      </button>

      {/* Search dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 w-[500px] max-w-[calc(100vw-2rem)] bg-popover border rounded-lg shadow-xl z-50 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search players, pages, tools..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              autoFocus
            />
            {query && (
              <button onClick={() => { setQuery(""); setActiveIndex(-1); }} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto py-1">
            {/* Recent Searches (shown when no query) */}
            {query.length < 1 && recentSearches.length > 0 && (
              <div>
                <div className="px-3 py-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent</span>
                  <button
                    onClick={() => { localStorage.removeItem(RECENT_SEARCHES_KEY); setQuery(" "); setTimeout(() => setQuery(""), 0); }}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.map((result) => {
                  const Icon = result.icon;
                  const idx = flatIndexMap.get(`recent-${result.id}`) ?? -1;
                  return (
                    <button
                      key={`recent-${result.id}`}
                      data-idx={idx}
                      onClick={() => handleSelect(result)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors group",
                        activeIndex === idx ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <div className="flex-shrink-0 w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{result.title}</div>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {(CATEGORY_BREADCRUMB[result.category] || ["Dashboard", result.category]).map((crumb, cidx, arr) => (
                            <span key={cidx} className="flex items-center gap-0.5">
                              <span className="text-[10px] text-muted-foreground/60 truncate max-w-[80px]">{crumb}</span>
                              {cidx < arr.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40 flex-shrink-0" />}
                            </span>
                          ))}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Main results */}
            {allResults.length === 0 && query.length > 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                No results found for "{query}"
              </div>
            ) : (
              sortedCategories.map((category) => (
                <div key={category}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30">
                    {category}
                  </div>
                  {grouped[category].map((result) => {
                    const Icon = result.icon;
                    const idx = flatIndexMap.get(result.id) ?? -1;
                    return (
                      <button
                        key={result.id}
                        data-idx={idx}
                        onClick={() => handleSelect(result)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors group",
                          activeIndex === idx ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <div className="flex-shrink-0 w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{result.title}</div>
                          {/* Breadcrumb trail */}
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {(CATEGORY_BREADCRUMB[result.category] || ["Dashboard", result.category]).map((crumb, cidx, arr) => (
                              <span key={cidx} className="flex items-center gap-0.5">
                                <span className="text-[10px] text-muted-foreground/60 truncate max-w-[80px]">{crumb}</span>
                                {cidx < arr.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40 flex-shrink-0" />}
                              </span>
                            ))}
                            {result.subtitle && (
                              <span className="flex items-center gap-0.5">
                                <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40 flex-shrink-0" />
                                <span className="text-[10px] text-muted-foreground/60 truncate max-w-[100px]">{result.title}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-muted-foreground/50 truncate max-w-[120px] hidden group-hover:block">{result.subtitle}</div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer hint */}
          <div className="border-t px-3 py-2 flex items-center gap-3 text-xs text-muted-foreground bg-muted/20">
            <span>↑↓ navigate</span>
            <span>↵ select</span>
            <span>Esc close</span>
            <span className="ml-auto opacity-60">{flatResults.length} results</span>
          </div>
        </div>
      )}
    </div>
  );
}
