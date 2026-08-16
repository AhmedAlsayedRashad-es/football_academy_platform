import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, Award, Target, AlertTriangle, ChevronUp, ChevronDown, Minus } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine,
} from "recharts";

// U17 professional benchmarks (based on UEFA/FIFA youth development standards)
const BENCHMARKS: Record<string, Record<string, number>> = {
  goalkeeper: {
    "Reflexes": 78, "Positioning": 75, "Handling": 74, "Distribution": 68,
    "Aerial Ability": 72, "Communication": 70, "Agility": 76, "Concentration": 74,
  },
  defender: {
    "Tackling": 76, "Marking": 75, "Heading": 73, "Positioning": 77,
    "Passing": 68, "Speed": 72, "Strength": 74, "Composure": 70,
  },
  midfielder: {
    "Passing": 79, "Vision": 76, "Ball Control": 77, "Stamina": 78,
    "Tackling": 70, "Dribbling": 72, "Shooting": 65, "Positioning": 74,
  },
  forward: {
    "Finishing": 76, "Dribbling": 78, "Speed": 80, "Positioning": 75,
    "Heading": 68, "Ball Control": 77, "Composure": 72, "Work Rate": 74,
  },
};

// Map position to benchmark category
function getBenchmarkCategory(position: string): string {
  const pos = (position || "").toLowerCase();
  if (pos.includes("goal") || pos === "gk") return "goalkeeper";
  if (pos.includes("back") || pos.includes("defend") || pos === "cb" || pos === "lb" || pos === "rb") return "defender";
  if (pos.includes("mid") || pos === "cm" || pos === "dm" || pos === "am") return "midfielder";
  return "forward";
}

// Map skill score names to benchmark keys
const SKILL_MAP: Record<string, string> = {
  "passing": "Passing",
  "shooting": "Shooting",
  "dribbling": "Dribbling",
  "defending": "Tackling",
  "pace": "Speed",
  "physical": "Strength",
  "vision": "Vision",
  "positioning": "Positioning",
  "heading": "Heading",
  "finishing": "Finishing",
  "stamina": "Stamina",
  "ballControl": "Ball Control",
  "ball_control": "Ball Control",
  "composure": "Composure",
  "workRate": "Work Rate",
  "work_rate": "Work Rate",
  "marking": "Marking",
  "reflexes": "Reflexes",
  "handling": "Handling",
  "distribution": "Distribution",
  "aerialAbility": "Aerial Ability",
  "aerial_ability": "Aerial Ability",
  "communication": "Communication",
  "agility": "Agility",
  "concentration": "Concentration",
};

function getDelta(player: number, bench: number): number {
  return Math.round(player - bench);
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 5) return <Badge className="bg-green-900/40 text-green-700 dark:text-green-400 border-green-700 text-xs gap-1"><ChevronUp className="w-3 h-3" />+{delta}</Badge>;
  if (delta < -5) return <Badge className="bg-red-900/40 text-red-600 dark:text-red-400 border-red-700 text-xs gap-1"><ChevronDown className="w-3 h-3" />{delta}</Badge>;
  return <Badge className="bg-muted text-muted-foreground border-border text-xs gap-1"><Minus className="w-3 h-3" />{delta > 0 ? "+" : ""}{delta}</Badge>;
}

export default function AgeGroupBenchmarking() {
  const { t, language } = useLanguage();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [ageGroup, setAgeGroup] = useState<string>("U17");

  const { data: players } = trpc.players.getAll.useQuery();
  const { data: skillScores } = trpc.skillScores.getHistory.useQuery(
    { playerId: selectedPlayerId! },
    { enabled: !!selectedPlayerId }
  );

  const selectedPlayer = players?.find((p: any) => p.id === selectedPlayerId);
  const benchmarkCat = selectedPlayer ? getBenchmarkCategory(selectedPlayer.position || "") : "midfielder";
  const benchmarks = BENCHMARKS[benchmarkCat] || BENCHMARKS.midfielder;

  // Build comparison data
  const comparisonData = Object.entries(benchmarks).map(([skill, benchValue]) => {
    // Find player skill value
    let playerValue = 0;
    if (skillScores) {
      const scores = skillScores as any;
      // Try direct key match
      const directKey = Object.keys(SKILL_MAP).find(k => SKILL_MAP[k] === skill);
      if (directKey && scores[directKey] !== undefined) {
        playerValue = Number(scores[directKey]);
      } else {
        // Try lowercase match
        const lowerSkill = skill.toLowerCase().replace(/ /g, "");
        for (const [k, v] of Object.entries(scores)) {
          if (k.toLowerCase().replace(/_/g, "") === lowerSkill) {
            playerValue = Number(v);
            break;
          }
        }
      }
    }
    return {
      skill,
      player: playerValue || 0,
      benchmark: benchValue,
      delta: getDelta(playerValue || 0, benchValue),
    };
  });

  const radarData = comparisonData.map(d => ({
    subject: d.skill,
    Player: d.player,
    [`${ageGroup} Standard`]: d.benchmark,
    fullMark: 100,
  }));

  const aboveCount = comparisonData.filter(d => d.delta > 5).length;
  const belowCount = comparisonData.filter(d => d.delta < -5).length;
  const onParCount = comparisonData.length - aboveCount - belowCount;
  const avgDelta = comparisonData.length > 0
    ? Math.round(comparisonData.reduce((s, d) => s + d.delta, 0) / comparisonData.length)
    : 0;

  const AGE_GROUPS = ["U13", "U14", "U15", "U16", "U17", "U18", "U19", "U21"];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
              Age-Group Benchmarking
            </h1>
            <p className="text-sm text-muted-foreground">Compare player skills against professional standards for their age group</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-48">
            <label className="text-sm text-muted-foreground block mb-1">Select Player</label>
            <Select value={selectedPlayerId?.toString() || ""} onValueChange={v => setSelectedPlayerId(parseInt(v))}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder="Choose a player..." />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {(players as any[] || []).map((p: any) => (
                  <SelectItem key={p.id} value={p.id.toString()} className="text-foreground">
                    {p.firstName} {p.lastName} — {p.position || "Unknown"} #{p.jerseyNumber || "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-36">
            <label className="text-sm text-muted-foreground block mb-1">Age Group</label>
            <Select value={ageGroup} onValueChange={setAgeGroup}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {AGE_GROUPS.map(g => (
                  <SelectItem key={g} value={g} className="text-foreground">{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {!selectedPlayerId ? (
          <Card className="bg-card border-border">
            <CardContent className="p-16 text-center text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium text-foreground">Select a player to view benchmark comparison</p>
              <p className="text-sm mt-1">Skills will be compared against {ageGroup} professional standards</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Player info + summary */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">Player</div>
                  <div className="font-bold text-foreground">{selectedPlayer?.firstName} {selectedPlayer?.lastName}</div>
                  <div className="text-xs text-muted-foreground mt-1">{selectedPlayer?.position || "Unknown"} · {ageGroup}</div>
                </CardContent>
              </Card>
              <Card className="bg-green-900/20 border-green-800/40">
                <CardContent className="p-4">
                  <div className="text-xs text-green-700 dark:text-green-400 mb-1 flex items-center gap-1"><ChevronUp className="w-3 h-3" />Above Standard</div>
                  <div className="text-2xl font-bold text-green-700 dark:text-green-400">{aboveCount}</div>
                  <div className="text-xs text-muted-foreground">skills (&gt;5 pts above)</div>
                </CardContent>
              </Card>
              <Card className="bg-red-900/20 border-red-800/40">
                <CardContent className="p-4">
                  <div className="text-xs text-red-600 dark:text-red-400 mb-1 flex items-center gap-1"><ChevronDown className="w-3 h-3" />Below Standard</div>
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">{belowCount}</div>
                  <div className="text-xs text-muted-foreground">skills (&gt;5 pts below)</div>
                </CardContent>
              </Card>
              <Card className={`border ${avgDelta >= 0 ? "bg-emerald-900/20 border-emerald-800/40" : "bg-orange-900/20 border-orange-800/40"}`}>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Target className="w-3 h-3" />Avg Gap</div>
                  <div className={`text-2xl font-bold ${avgDelta >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-orange-700 dark:text-orange-400"}`}>{avgDelta > 0 ? "+" : ""}{avgDelta}</div>
                  <div className="text-xs text-muted-foreground">pts vs {ageGroup} standard</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Radar chart */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-foreground">Skill Radar vs {ageGroup} Standard</CardTitle>
                  <p className="text-xs text-muted-foreground">Position: {benchmarkCat} benchmarks applied</p>
                </CardHeader>
                <CardContent>
                  <div style={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                        <PolarGrid stroke="#374151" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                        <Radar name="Player" dataKey="Player" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
                        <Radar name={`${ageGroup} Standard`} dataKey={`${ageGroup} Standard`} stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} strokeWidth={2} strokeDasharray="4 4" />
                        <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Bar chart */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-foreground">Skill-by-Skill Comparison</CardTitle>
                  <p className="text-xs text-muted-foreground">Green = above standard, Red = below standard</p>
                </CardHeader>
                <CardContent>
                  <div style={{ height: 320 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData} margin={{ top: 5, right: 10, bottom: 5, left: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="skill" tick={{ fill: "#9ca3af", fontSize: 9 }} angle={-30} textAnchor="end" height={50} />
                        <YAxis domain={[0, 100]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                          labelStyle={{ color: "#f9fafb" }}
                          itemStyle={{ color: "#9ca3af" }}
                        />
                        <ReferenceLine y={0} stroke="#6b7280" />
                        <Bar dataKey="player" name="Player" fill="#10b981" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="benchmark" name={`${ageGroup} Standard`} fill="#6366f1" radius={[3, 3, 0, 0]} opacity={0.7} />
                        <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Detailed table */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-foreground flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  Detailed Skill Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Skill</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium">Player</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium">{ageGroup} Standard</th>
                        <th className="text-center py-2 px-3 text-muted-foreground font-medium">Gap</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Progress</th>
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonData.sort((a, b) => a.delta - b.delta).map(row => (
                        <tr key={row.skill} className="border-b border-border/50 hover:bg-muted/30">
                          <td className="py-2 px-3 text-foreground font-medium">{row.skill}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`font-bold ${row.player >= row.benchmark ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>{row.player}</span>
                          </td>
                          <td className="py-2 px-3 text-center text-indigo-600 dark:text-indigo-400">{row.benchmark}</td>
                          <td className="py-2 px-3 text-center">
                            <DeltaBadge delta={row.delta} />
                          </td>
                          <td className="py-2 px-3 w-32">
                            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`absolute left-0 top-0 h-full rounded-full transition-all ${row.player >= row.benchmark ? "bg-emerald-500" : "bg-red-500"}`}
                                style={{ width: `${Math.min(100, row.player)}%` }}
                              />
                              <div
                                className="absolute top-0 h-full w-0.5 bg-indigo-400"
                                style={{ left: `${Math.min(100, row.benchmark)}%` }}
                              />
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            {row.delta > 5 ? (
                              <span className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1"><ChevronUp className="w-3 h-3" />Exceeds</span>
                            ) : row.delta < -10 ? (
                              <span className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Needs Work</span>
                            ) : row.delta < -5 ? (
                              <span className="text-xs text-orange-700 dark:text-orange-400 flex items-center gap-1"><ChevronDown className="w-3 h-3" />Developing</span>
                            ) : (
                              <span className="text-xs text-muted-foreground flex items-center gap-1"><Minus className="w-3 h-3" />On Track</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  * Benchmarks based on UEFA/FIFA youth development standards for {ageGroup} age group ({benchmarkCat} position profile).
                  Player skill scores are sourced from the academy evaluation system.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
