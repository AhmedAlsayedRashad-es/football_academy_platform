import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BackButton } from '@/components/BackButton';
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Users, Activity, Brain, Dumbbell, Stethoscope, Trophy, AlertTriangle, ChevronRight } from "lucide-react";
import { HelpTooltip } from "@/components/HelpTooltip";
import { useLanguage } from '@/contexts/LanguageContext';

const SKILL_AREAS = [
  { key: "avgPhysical", label: "Physical", icon: Dumbbell, color: "text-orange-700 dark:text-orange-400", bg: "bg-orange-400/20" },
  { key: "avgTechnical", label: "Technical", icon: Activity, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-400/20" },
  { key: "avgMental", label: "Mental", icon: Brain, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-400/20" },
  { key: "avgMedical", label: "Medical", icon: Stethoscope, color: "text-green-700 dark:text-green-400", bg: "bg-green-400/20" },
];

function ProgressBadge({ ratio }: { ratio: number }) {
  if (ratio > 5) return <span className="flex items-center gap-1 text-green-700 dark:text-green-400 text-sm font-bold"><TrendingUp className="w-4 h-4" />+{ratio}%</span>;
  if (ratio < -5) return <span className="flex items-center gap-1 text-red-600 dark:text-red-400 text-sm font-bold"><TrendingDown className="w-4 h-4" />{ratio}%</span>;
  return <span className="flex items-center gap-1 text-muted-foreground text-sm"><Minus className="w-4 h-4" />Stable</span>;
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-muted rounded-full h-2">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-xs text-muted-foreground w-8 text-right">{value}</span>
    </div>
  );
}

export default function TeamProgressComparison() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"progressRatio" | "avgPhysical" | "avgTechnical" | "avgMental">("progressRatio");
  const [filterStatus, setFilterStatus] = useState<"all" | "improving" | "declining" | "stable">("all");

  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: progressData, isLoading } = trpc.medical.getTeamProgressSummary.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );
  const { data: teamPlayers } = trpc.teams.getPlayers.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );

  // Build player name map
  const playerNames: Record<number, string> = {};
  if (teamPlayers) {
    for (const p of teamPlayers) {
      playerNames[p.id] = `${p.firstName} ${p.lastName}`;
    }
  }

  const filteredData = (progressData || []).filter(p => {
    if (filterStatus === "improving") return p.progressRatio > 5;
    if (filterStatus === "declining") return p.progressRatio < -5;
    if (filterStatus === "stable") return p.progressRatio >= -5 && p.progressRatio <= 5;
    return true;
  }).sort((a, b) => {
    if (sortBy === "progressRatio") return b.progressRatio - a.progressRatio;
    return (b as any)[sortBy] - (a as any)[sortBy];
  });

  const improving = (progressData || []).filter(p => p.progressRatio > 5).length;
  const declining = (progressData || []).filter(p => p.progressRatio < -5).length;
  const stable = (progressData || []).filter(p => p.progressRatio >= -5 && p.progressRatio <= 5).length;
  const teamAvg = (key: string) => progressData && progressData.length > 0
    ? Math.round(progressData.reduce((s, p) => s + ((p as any)[key] || 0), 0) / progressData.length)
    : 0;

  return (
    <>
    <div className="text-foreground p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            Team Progress Comparison
            <HelpTooltip content="Compare all players in a team side by side. See who is improving, declining, or stable based on their recent training session scores. Use this to prioritize coaching attention." />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Compare player progress ratios across the team</p>
        </div>
      </div>

      {/* Team Selector */}
      <div className="bg-card rounded-xl p-4 mb-6 border border-border">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Select Team</label>
            <Select onValueChange={(v) => setSelectedTeamId(parseInt(v))}>
              <SelectTrigger className="w-64 bg-muted border-border text-foreground">
                <SelectValue placeholder="Choose a team..." />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {(teams || []).map(t => (
                  <SelectItem key={t.id} value={String(t.id)} className="text-foreground hover:bg-muted">
                    {t.name} ({t.ageGroup})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {progressData && (
            <>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Sort By</label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                  <SelectTrigger className="w-48 bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    <SelectItem value="progressRatio" className="text-foreground">Progress Ratio</SelectItem>
                    <SelectItem value="avgPhysical" className="text-foreground">Physical Score</SelectItem>
                    <SelectItem value="avgTechnical" className="text-foreground">Technical Score</SelectItem>
                    <SelectItem value="avgMental" className="text-foreground">Mental Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Filter</label>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                  <SelectTrigger className="w-40 bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    <SelectItem value="all" className="text-foreground">All Players</SelectItem>
                    <SelectItem value="improving" className="text-foreground">Improving</SelectItem>
                    <SelectItem value="stable" className="text-foreground">Stable</SelectItem>
                    <SelectItem value="declining" className="text-foreground">Needs Attention</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </div>
      </div>

      {!selectedTeamId && (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg">Select a team to view player progress comparison</p>
        </div>
      )}

      {selectedTeamId && isLoading && (
        <div className="text-center py-20 text-muted-foreground">
          <div className="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading team progress data...</p>
        </div>
      )}

      {selectedTeamId && !isLoading && progressData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-card rounded-xl p-4 border border-border text-center">
              <div className="text-3xl font-bold text-foreground">{progressData.length}</div>
              <div className="text-sm text-muted-foreground mt-1">Players Tracked</div>
            </div>
            <div className="bg-green-900/30 rounded-xl p-4 border border-green-800/50 text-center cursor-pointer" onClick={() => setFilterStatus("improving")}>
              <div className="text-3xl font-bold text-green-700 dark:text-green-400">{improving}</div>
              <div className="text-sm text-green-700 dark:text-green-300 mt-1 flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" /> Improving</div>
            </div>
            <div className="bg-yellow-900/30 rounded-xl p-4 border border-yellow-800/50 text-center cursor-pointer" onClick={() => setFilterStatus("stable")}>
              <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">{stable}</div>
              <div className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 flex items-center justify-center gap-1"><Minus className="w-3 h-3" /> Stable</div>
            </div>
            <div className="bg-red-900/30 rounded-xl p-4 border border-red-800/50 text-center cursor-pointer" onClick={() => setFilterStatus("declining")}>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{declining}</div>
              <div className="text-sm text-red-600 dark:text-red-300 mt-1 flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3" /> Needs Attention</div>
            </div>
          </div>

          {/* Team Averages */}
          <div className="bg-card rounded-xl p-4 border border-border mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Team Averages (Last 5 Sessions)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SKILL_AREAS.map(area => (
                <div key={area.key} className={`rounded-lg p-3 ${area.bg}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <area.icon className={`w-4 h-4 ${area.color}`} />
                    <span className="text-xs text-muted-foreground">{area.label}</span>
                  </div>
                  <div className={`text-2xl font-bold ${area.color}`}>{teamAvg(area.key)}</div>
                  <Progress value={teamAvg(area.key)} className="mt-2 h-1" />
                </div>
              ))}
            </div>
          </div>

          {/* Player Cards */}
          {filteredData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No players found with session data for this filter.</p>
              <p className="text-sm mt-1">Record training sessions to see progress comparisons.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredData.map((player, idx) => {
                const name = playerNames[player.playerId] || `Player #${player.playerId}`;
                const isTop = idx < 3 && sortBy === "progressRatio" && player.progressRatio > 5;
                return (
                  <div
                    key={player.playerId}
                    className={`bg-card rounded-xl p-4 border cursor-pointer hover:border-blue-500 transition-colors ${
                      player.progressRatio > 5 ? "border-green-800/60" :
                      player.progressRatio < -5 ? "border-red-800/60" :
                      "border-border"
                    }`}
                    onClick={() => navigate(`/player-progress/${player.playerId}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          isTop ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" : "bg-muted text-muted-foreground"
                        }`}>
                          {isTop ? <Trophy className="w-5 h-5" /> : name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground text-sm">{name}</div>
                          <div className="text-xs text-muted-foreground">{player.sessionCount} sessions recorded</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <ProgressBadge ratio={player.progressRatio} />
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      {SKILL_AREAS.map(area => (
                        <div key={area.key}>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span className="flex items-center gap-1">
                              <area.icon className={`w-3 h-3 ${area.color}`} />
                              {area.label}
                            </span>
                          </div>
                          <ScoreBar value={(player as any)[area.key] || 0} color={
                            area.key === "avgPhysical" ? "bg-orange-400" :
                            area.key === "avgTechnical" ? "bg-blue-400" :
                            area.key === "avgMental" ? "bg-purple-400" : "bg-green-400"
                          } />
                        </div>
                      ))}
                    </div>

                    {player.avgRpe > 0 && (
                      <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
                        <span>Avg RPE: <span className={`font-semibold ${player.avgRpe > 7 ? "text-red-600 dark:text-red-400" : player.avgRpe > 5 ? "text-yellow-700 dark:text-yellow-400" : "text-green-700 dark:text-green-400"}`}>{player.avgRpe}/10</span></span>
                        {player.lastSession && (
                          <span>Last: {new Date(player.lastSession).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}
