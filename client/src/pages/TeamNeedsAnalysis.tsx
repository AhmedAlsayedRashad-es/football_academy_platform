import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "../hooks/use-toast";
import { trpc } from "../lib/trpc";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';
import {
  ArrowLeft, Search, TrendingUp, AlertTriangle, CheckCircle,
  Users, Target, Star, Zap, BarChart2, Brain,
  ChevronDown, ChevronUp, Filter, Award, Loader2
} from "lucide-react";

interface PositionGap {
  position: string;
  currentRating: number;
  requiredRating: number;
  gap: number;
  priority: "critical" | "high" | "medium" | "low";
  missingSkills: string[];
  recommendedProfile: string;
  currentPlayers: string[];
}
interface SkillGap {
  skill: string;
  category: string;
  teamAvg: number;
  benchmark: number;
  gap: number;
  playersBelow: number;
  impact: string;
}
interface RecruitmentTarget {
  position: string;
  profile: string;
  keyAttributes: string[];
  ageRange: string;
  urgency: "immediate" | "next_season" | "long_term";
  similarPlayers: string[];
}
interface AnalysisResult {
  teamId: number;
  teamName: string;
  ageGroup: string;
  playerCount: number;
  positionGaps: PositionGap[];
  skillGaps: SkillGap[];
  recruitmentTargets: RecruitmentTarget[];
  squadReadiness: number;
  summary: string;
}

const PRIORITY_CONFIG = {
  critical: { label: "CRITICAL", bg: "bg-red-900/40", text: "text-red-400", border: "border-red-500/30", dot: "bg-red-500" },
  high: { label: "HIGH", bg: "bg-orange-900/40", text: "text-orange-400", border: "border-orange-500/30", dot: "bg-orange-500" },
  medium: { label: "MEDIUM", bg: "bg-yellow-900/40", text: "text-yellow-400", border: "border-yellow-500/30", dot: "bg-yellow-500" },
  low: { label: "LOW", bg: "bg-green-900/40", text: "text-green-400", border: "border-green-500/30", dot: "bg-green-500" },
};
const URGENCY_CONFIG = {
  immediate: { label: "Immediate", bg: "bg-red-900/30", text: "text-red-600 dark:text-red-400", icon: "🚨" },
  next_season: { label: "Next Season", bg: "bg-yellow-900/30", text: "text-yellow-700 dark:text-yellow-400", icon: "📅" },
  long_term: { label: "Long Term", bg: "bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", icon: "🔮" },
};

export default function TeamNeedsAnalysis() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamTypeFilter, setTeamTypeFilter] = useState<"all" | "main" | "academy">("all");
  const [activeTab, setActiveTab] = useState<"gaps" | "skills" | "recruitment">("gaps");
  const [expandedGap, setExpandedGap] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);

  const { data: allTeams = [] } = trpc.teams.getAll.useQuery();
  const teams = teamTypeFilter === "all" ? allTeams : (allTeams as any[]).filter((t: any) => t.teamType === teamTypeFilter);

  const analyzeMutation = trpc.teamNeedsAnalysis.analyze.useMutation({
    onSuccess: (data: any) => {
      setAnalysisResult(data as AnalysisResult);
      toast({ title: "Analysis Complete", description: `Team needs analysis for ${data.teamName} is ready.` });
    },
    onError: (err: any) => {
      toast({ title: "Analysis Failed", description: err.message, variant: "destructive" });
    },
  });

  const handleRunAnalysis = () => {
    if (!selectedTeamId) {
      toast({ title: "Select a Team", description: "Please select a team to analyze.", variant: "destructive" });
      return;
    }
    setAnalysisResult(null);
    analyzeMutation.mutate({ teamId: selectedTeamId });
  };

  const selectedTeam = (teams as any[]).find((t: any) => t.id === selectedTeamId);
  const criticalGaps = analysisResult?.positionGaps.filter(g => g.priority === "critical").length ?? 0;
  const highGaps = analysisResult?.positionGaps.filter(g => g.priority === "high").length ?? 0;
  const avgSkillGap = analysisResult?.skillGaps.length
    ? Math.round(analysisResult.skillGaps.reduce((s, g) => s + g.gap, 0) / analysisResult.skillGaps.length)
    : 0;

  return (
    <>
    <div className="text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Search className="w-5 h-5 text-red-500" />
              Team Needs Analysis
            </h1>
            <p className="text-sm text-muted-foreground">AI-powered analysis based on real player data — inspired by Wyscout scouting intelligence</p>
          </div>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={analyzeMutation.isPending || !selectedTeamId}
          className="flex items-center gap-2 bg-red-700 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-lg font-semibold"
        >
          {analyzeMutation.isPending
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            : <><Zap className="w-4 h-4" /> Run Analysis</>}
        </button>
      </div>

      {/* Team Selector */}
      <div className="px-6 py-3 border-b border-border bg-card/50 flex items-center gap-4 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <div className="flex gap-1">
          {(["all", "main", "academy"] as const).map(type => (
            <button key={type} onClick={() => { setTeamTypeFilter(type); setSelectedTeamId(null); setAnalysisResult(null); }}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                teamTypeFilter === type ? "bg-red-700 border-red-600 text-white" : "bg-muted border-border text-muted-foreground hover:text-foreground"
              }`}>
              {type === "all" ? "All Teams" : type === "main" ? "Main Teams" : "Academy Teams"}
            </button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground">Analyzing team:</span>
        <select
          value={selectedTeamId ?? ""}
          onChange={(e) => {
            setSelectedTeamId(e.target.value ? Number(e.target.value) : null);
            setAnalysisResult(null);
          }}
          className="bg-muted border border-border text-foreground rounded-lg px-4 py-2 text-sm min-w-[220px] focus:outline-none focus:border-red-500"
        >
          <option value="">— Select a team —</option>
          {(teams as any[]).map((t: any) => (
            <option key={t.id} value={t.id}>{t.name} {t.ageGroup ? `(${t.ageGroup})` : ""}</option>
          ))}
        </select>
        {selectedTeam && (
          <span className="bg-green-900/20 text-green-700 dark:text-green-400 border border-green-700/40 px-3 py-1 rounded-full text-xs font-semibold">
            {(selectedTeam as any).ageGroup}
          </span>
        )}
      </div>

      {/* Loading */}
      {analyzeMutation.isPending && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-12 h-12 text-red-600 dark:text-red-400 animate-spin" />
          <p className="text-muted-foreground text-lg">Analyzing {selectedTeam?.name} squad data...</p>
          <p className="text-muted-foreground text-sm">Fetching player skills, identifying gaps, generating recruitment targets...</p>
        </div>
      )}

      {/* Empty state */}
      {!analyzeMutation.isPending && !analysisResult && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Search className="w-16 h-16 text-gray-700" />
          <p className="text-muted-foreground text-xl font-semibold">Select a Team to Analyze</p>
          <p className="text-muted-foreground text-sm max-w-md text-center">
            Choose a team from the dropdown above and click "Run Analysis" to get a real AI-powered needs assessment based on your players' actual skill scores.
          </p>
        </div>
      )}

      {/* Results */}
      {analysisResult && !analyzeMutation.isPending && (
        <div className="p-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: "Critical Gaps", value: criticalGaps, color: "text-red-600 dark:text-red-400", icon: <AlertTriangle className="w-4 h-4" /> },
              { label: "High Priority", value: highGaps, color: "text-orange-700 dark:text-orange-400", icon: <TrendingUp className="w-4 h-4" /> },
              { label: "Avg Skill Gap", value: `${avgSkillGap}pts`, color: "text-yellow-700 dark:text-yellow-400", icon: <BarChart2 className="w-4 h-4" /> },
              { label: "Positions Analyzed", value: analysisResult.positionGaps.length, color: "text-blue-600 dark:text-blue-400", icon: <Target className="w-4 h-4" /> },
              { label: "Recruitment Targets", value: analysisResult.recruitmentTargets.length, color: "text-green-700 dark:text-green-400", icon: <Users className="w-4 h-4" /> },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="bg-card rounded-xl p-4 border border-border">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">{icon} {label}</div>
              </div>
            ))}
          </div>

          {/* AI Summary */}
          {analysisResult.summary && (
            <div className="bg-card rounded-xl p-4 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">AI Summary — {analysisResult.teamName}</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">{analysisResult.summary}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border">
            {[
              { key: "gaps", label: "Position Gaps", icon: Target },
              { key: "skills", label: "Skill Gap Analysis", icon: BarChart2 },
              { key: "recruitment", label: "Recruitment Targets", icon: Users },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key ? "border-red-500 text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">

              {/* Position Gaps */}
              {activeTab === "gaps" && (
                <>
                  <h3 className="text-lg font-bold">Position Gap Analysis — {analysisResult.teamName}</h3>
                  {analysisResult.positionGaps.length === 0 ? (
                    <div className="bg-card rounded-xl p-8 text-center text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-700 dark:text-green-400" />
                      <p>No significant position gaps found. Squad looks well-balanced!</p>
                    </div>
                  ) : analysisResult.positionGaps.map((gap) => {
                    const config = PRIORITY_CONFIG[gap.priority] || PRIORITY_CONFIG.medium;
                    const isExpanded = expandedGap === gap.position;
                    return (
                      <div key={gap.position} className={`bg-card rounded-xl border ${config.border} overflow-hidden`}>
                        <div
                          className="p-4 cursor-pointer flex items-center justify-between"
                          onClick={() => setExpandedGap(isExpanded ? null : gap.position)}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${config.bg} ${config.text}`}>{config.label}</span>
                            <span className="font-semibold">{gap.position}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground">{gap.currentRating} → {gap.requiredRating}</span>
                            <span className={`text-lg font-bold ${config.text}`}>{gap.gap > 0 ? `-${gap.gap}` : `+${Math.abs(gap.gap)}`}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                          </div>
                        </div>
                        <div className="px-4 pb-3">
                          <div className="relative h-2 bg-muted rounded-full">
                            <div className="absolute h-2 bg-red-500 rounded-full" style={{ width: `${gap.currentRating}%` }} />
                            <div className="absolute h-2 w-0.5 bg-green-400" style={{ left: `${gap.requiredRating}%` }} />
                          </div>
                        </div>
                        {isExpanded && (
                          <div className="px-4 pb-4 border-t border-border pt-4 space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Current Players</p>
                              <div className="flex flex-wrap gap-2">
                                {gap.currentPlayers.map(p => (
                                  <span key={p} className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded">{p}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Missing Skills</p>
                              <div className="flex flex-wrap gap-2">
                                {gap.missingSkills.map(s => (
                                  <span key={s} className="bg-red-900/30 text-red-600 dark:text-red-300 text-xs px-2 py-1 rounded border border-red-500/20">{s}</span>
                                ))}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Recommended Profile</p>
                              <p className="text-sm text-muted-foreground">{gap.recommendedProfile}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}

              {/* Skill Gaps */}
              {activeTab === "skills" && (
                <>
                  <h3 className="text-lg font-bold">Skill Gap Analysis — {analysisResult.teamName}</h3>
                  {analysisResult.skillGaps.length === 0 ? (
                    <div className="bg-card rounded-xl p-8 text-center text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-700 dark:text-green-400" />
                      <p>No significant skill gaps identified.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {analysisResult.skillGaps.map(sg => (
                        <div key={sg.skill} className="bg-card rounded-xl p-4 border border-border">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-medium">{sg.skill}</span>
                              <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">{sg.category}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-red-600 dark:text-red-400 font-bold">-{sg.gap}pts</span>
                              <span className="text-xs text-muted-foreground ml-2">{sg.playersBelow} players below</span>
                            </div>
                          </div>
                          <div className="relative h-2 bg-muted rounded-full mb-2">
                            <div className="absolute h-2 bg-orange-500 rounded-full" style={{ width: `${sg.teamAvg}%` }} />
                            <div className="absolute h-2 w-0.5 bg-green-400" style={{ left: `${sg.benchmark}%` }} />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Team avg: {sg.teamAvg}</span>
                            <span>Benchmark: {sg.benchmark}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">{sg.impact}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Recruitment Targets */}
              {activeTab === "recruitment" && (
                <>
                  <h3 className="text-lg font-bold">Recruitment Targets — {analysisResult.teamName}</h3>
                  {analysisResult.recruitmentTargets.length === 0 ? (
                    <div className="bg-card rounded-xl p-8 text-center text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-700 dark:text-green-400" />
                      <p>No immediate recruitment targets identified.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analysisResult.recruitmentTargets.map(rt => {
                        const urgencyConfig = URGENCY_CONFIG[rt.urgency] || URGENCY_CONFIG.next_season;
                        return (
                          <div key={rt.position} className="bg-card rounded-xl p-5 border border-border">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-bold text-lg">{rt.position}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{rt.profile}</p>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${urgencyConfig.bg} ${urgencyConfig.text}`}>
                                  {urgencyConfig.icon} {urgencyConfig.label}
                                </span>
                                <span className="text-xs text-muted-foreground">Age {rt.ageRange}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">Required Attributes</p>
                                <div className="space-y-1">
                                  {rt.keyAttributes.map(attr => (
                                    <div key={attr} className="flex items-center gap-2 text-sm">
                                      <CheckCircle className="w-3 h-3 text-green-700 dark:text-green-400 flex-shrink-0" />
                                      <span className="text-muted-foreground">{attr}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">Similar Player Profiles</p>
                                <div className="space-y-1">
                                  {rt.similarPlayers.map(sp => (
                                    <div key={sp} className="flex items-center gap-2 text-sm">
                                      <Star className="w-3 h-3 text-yellow-700 dark:text-yellow-400 flex-shrink-0" />
                                      <span className="text-muted-foreground">{sp}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border">
                              <p className="text-xs text-muted-foreground">
                                Search in:{" "}
                                <a href="https://wyscout.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Wyscout</a>
                                {" · "}
                                <a href="https://www.transfermarkt.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Transfermarkt</a>
                                {" · "}
                                <a href="https://www.sofascore.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Sofascore</a>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              <div className="bg-card rounded-xl p-4 border border-border">
                <h4 className="font-semibold mb-3">Priority Breakdown</h4>
                {(["critical", "high", "medium", "low"] as const).map(p => {
                  const count = analysisResult.positionGaps.filter(g => g.priority === p).length;
                  const config = PRIORITY_CONFIG[p];
                  return (
                    <div key={p} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                        <span className="text-sm capitalize">{p}</span>
                      </div>
                      <span className={`font-bold ${config.text}`}>{count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-card rounded-xl p-4 border border-border">
                <h4 className="font-semibold mb-3">Overall Squad Readiness</h4>
                <div className="text-4xl font-bold text-green-700 dark:text-green-400 mb-1">{analysisResult.squadReadiness}%</div>
                <p className="text-xs text-muted-foreground mb-3">Current squad vs. target profile</p>
                <div className="relative h-3 bg-muted rounded-full">
                  <div
                    className={`h-3 rounded-full ${analysisResult.squadReadiness >= 75 ? "bg-green-500" : analysisResult.squadReadiness >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                    style={{ width: `${analysisResult.squadReadiness}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0%</span><span>Target: 85%</span><span>100%</span>
                </div>
              </div>

              <div className="bg-card rounded-xl p-4 border border-border">
                <h4 className="font-semibold mb-3">Urgency Timeline</h4>
                {(["immediate", "next_season", "long_term"] as const).map(u => {
                  const count = analysisResult.recruitmentTargets.filter(r => r.urgency === u).length;
                  const config = URGENCY_CONFIG[u];
                  return (
                    <div key={u} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <span className={`text-sm ${config.text}`}>{config.icon} {config.label}</span>
                      <span className={`font-bold ${config.text}`}>{count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-card rounded-xl p-4 border border-border">
                <h4 className="font-semibold mb-2">Squad Info</h4>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm">{analysisResult.playerCount} players in squad</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground mt-2">
                  <Award className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
                  <span className="text-sm">{analysisResult.ageGroup} age group</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
