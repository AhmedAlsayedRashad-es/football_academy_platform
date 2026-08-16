import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import {
  Trophy, TrendingUp, Target, Shield, Swords, Star,
  Activity, Users, Calendar, ChevronUp, ChevronDown, Minus, ArrowLeft
} from "lucide-react";

const COLORS = ["#dc2626", "#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2", "#be185d"];

const FORM_COLORS: Record<string, string> = {
  W: "bg-green-500 text-white",
  D: "bg-yellow-500 text-black",
  L: "bg-red-500 text-white",
};

export default function SeasonStatsDashboard() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [selectedTeamId, setSelectedTeamId] = useState<number>(2);

  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: matches = [] } = trpc.matches.getByTeam.useQuery({ teamId: selectedTeamId });
  const { data: topScorers = [] } = trpc.teams.getTopScorers.useQuery({ teamId: selectedTeamId, limit: 10 });
  const { data: teamPlayers = [] } = trpc.players.getByTeam.useQuery({ teamId: selectedTeamId });

  // Compute season stats from matches
  const seasonStats = useMemo(() => {
    const completed = matches.filter((m: any) => m.result);
    const wins = completed.filter((m: any) => m.result === "win").length;
    const draws = completed.filter((m: any) => m.result === "draw").length;
    const losses = completed.filter((m: any) => m.result === "loss").length;
    const goalsFor = completed.reduce((s: number, m: any) => s + (m.teamScore ?? 0), 0);
    const goalsAgainst = completed.reduce((s: number, m: any) => s + (m.opponentScore ?? 0), 0);
    const points = wins * 3 + draws;
    const cleanSheets = completed.filter((m: any) => (m.opponentScore ?? 0) === 0).length;
    const bigWins = completed.filter((m: any) => (m.teamScore ?? 0) - (m.opponentScore ?? 0) >= 3).length;
    const homeMatches = completed.filter((m: any) => m.isHome);
    const awayMatches = completed.filter((m: any) => !m.isHome);
    const homeWins = homeMatches.filter((m: any) => m.result === "win").length;
    const awayWins = awayMatches.filter((m: any) => m.result === "win").length;
    const winRate = completed.length > 0 ? Math.round((wins / completed.length) * 100) : 0;
    const avgGoalsFor = completed.length > 0 ? (goalsFor / completed.length).toFixed(1) : "0.0";
    const avgGoalsAgainst = completed.length > 0 ? (goalsAgainst / completed.length).toFixed(1) : "0.0";

    // Form (last 5)
    const last5 = [...completed].sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime()).slice(0, 5);
    const form = last5.map((m: any) => m.result === "win" ? "W" : m.result === "draw" ? "D" : "L");

    return {
      played: completed.length, wins, draws, losses, goalsFor, goalsAgainst,
      goalDiff: goalsFor - goalsAgainst, points, cleanSheets, bigWins,
      homeWins, awayWins, homeMatches: homeMatches.length, awayMatches: awayMatches.length,
      winRate, avgGoalsFor, avgGoalsAgainst, form,
    };
  }, [matches]);

  // Monthly goals chart
  const monthlyData = useMemo(() => {
    const byMonth: Record<string, { month: string; scored: number; conceded: number; wins: number; losses: number }> = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    matches.filter((m: any) => m.result).forEach((m: any) => {
      const d = new Date(m.matchDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!byMonth[key]) byMonth[key] = { month: monthNames[d.getMonth()] + " " + d.getFullYear().toString().slice(2), scored: 0, conceded: 0, wins: 0, losses: 0 };
      byMonth[key].scored += m.teamScore ?? 0;
      byMonth[key].conceded += m.opponentScore ?? 0;
      if (m.result === "win") byMonth[key].wins++;
      if (m.result === "loss") byMonth[key].losses++;
    });
    return Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month));
  }, [matches]);

  // Match type breakdown
  const matchTypeData = useMemo(() => {
    const types: Record<string, { wins: number; draws: number; losses: number }> = {};
    matches.filter((m: any) => m.result).forEach((m: any) => {
      const t = m.matchType || "other";
      if (!types[t]) types[t] = { wins: 0, draws: 0, losses: 0 };
      if (m.result === "win") types[t].wins++;
      else if (m.result === "draw") types[t].draws++;
      else types[t].losses++;
    });
    return Object.entries(types).map(([name, v]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      ...v,
      total: v.wins + v.draws + v.losses,
    }));
  }, [matches]);

  // Result distribution for pie chart
  const resultPieData = [
    { name: "Wins", value: seasonStats.wins, color: "#16a34a" },
    { name: "Draws", value: seasonStats.draws, color: "#d97706" },
    { name: "Losses", value: seasonStats.losses, color: "#dc2626" },
  ].filter(d => d.value > 0);

  // Home vs Away radar
  const homeAwayData = [
    { subject: "Win Rate", home: seasonStats.homeMatches > 0 ? Math.round((seasonStats.homeWins / seasonStats.homeMatches) * 100) : 0, away: seasonStats.awayMatches > 0 ? Math.round((seasonStats.awayWins / seasonStats.awayMatches) * 100) : 0 },
    { subject: "Goals/Match", home: 70, away: 55 },
    { subject: "Clean Sheets", home: 65, away: 45 },
    { subject: "Possession", home: 58, away: 48 },
    { subject: "Shots on Target", home: 72, away: 60 },
  ];

  // Recent matches list
  const recentMatches = useMemo(() => {
    return [...matches]
      .filter((m: any) => m.result)
      .sort((a: any, b: any) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime())
      .slice(0, 8);
  }, [matches]);

  const StatCard = ({ icon: Icon, label, value, sub, color = "text-red-600" }: any) => (
    <Card>
      <CardContent className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          <div className={`p-2 rounded-lg bg-muted`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <>
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div>
            <PageBreadcrumb
              items={[
                { label: "Analytics", labelAr: "التحليلات", href: "/analytics" },
                { label: "Season Statistics", labelAr: "إحصائيات الموسم" },
              ]}
              className="mb-1"
            />
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-700 dark:text-yellow-500" />
              Season Statistics Dashboard
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Full season performance overview — 2024/25</p>
          </div>
        </div>
        <Select value={String(selectedTeamId)} onValueChange={v => setSelectedTeamId(Number(v))}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Select team" />
          </SelectTrigger>
          <SelectContent>
            {(teams ?? []).map((t: any) => (
              <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Key Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard icon={Calendar} label={language === 'ar' ? 'المباريات' : 'Played'} value={seasonStats.played} color="text-blue-600" />
        <StatCard icon={Trophy} label={language === 'ar' ? 'انتصارات' : 'Wins'} value={seasonStats.wins} sub={language === 'ar' ? `${seasonStats.winRate}% نسبة الفوز` : `${seasonStats.winRate}% win rate`} color="text-green-600" />
        <StatCard icon={Minus} label={language === 'ar' ? 'تعادلات' : 'Draws'} value={seasonStats.draws} color="text-yellow-600" />
        <StatCard icon={ChevronDown} label={language === 'ar' ? 'خسائر' : 'Losses'} value={seasonStats.losses} color="text-red-600" />
        <StatCard icon={Target} label={language === 'ar' ? 'النقاط' : 'Points'} value={seasonStats.points} sub={language === 'ar' ? 'نقاط الدوري' : 'League points'} color="text-purple-600" />
        <StatCard icon={Swords} label={language === 'ar' ? 'أهداف مسجلة' : 'Goals For'} value={seasonStats.goalsFor} sub={`${seasonStats.avgGoalsFor}/${language === 'ar' ? 'مباراة' : 'match'}`} color="text-green-600" />
        <StatCard icon={Shield} label={language === 'ar' ? 'أهداف مستقبلة' : 'Goals Against'} value={seasonStats.goalsAgainst} sub={`${seasonStats.avgGoalsAgainst}/${language === 'ar' ? 'مباراة' : 'match'}`} color="text-red-600" />
        <StatCard icon={Star} label={language === 'ar' ? 'شباك نظيفة' : 'Clean Sheets'} value={seasonStats.cleanSheets} color="text-cyan-600" />
      </div>

      {/* Form & Goal Difference */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" /> {language === 'ar' ? 'الشكل الأخير (آخر 5)' : 'Recent Form (Last 5)'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {seasonStats.form.length > 0 ? seasonStats.form.map((f, i) => (
                <span key={i} className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${FORM_COLORS[f] ?? "bg-muted"}`}>{f}</span>
              )) : <span className="text-muted-foreground text-sm">{language === 'ar' ? 'لا توجد مباريات بعد' : 'No matches yet'}</span>}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{language === 'ar' ? 'سجل الملعب:' : 'Home record:'}</span>
                <span className="font-medium">{seasonStats.homeWins}W / {seasonStats.homeMatches - seasonStats.homeWins}D+L</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">{language === 'ar' ? 'سجل الخارج:' : 'Away record:'}</span>
                <span className="font-medium">{seasonStats.awayWins}W / {seasonStats.awayMatches - seasonStats.awayWins}D+L</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" /> {language === 'ar' ? 'فارق الأهداف والانتصارات الكبيرة' : 'Goal Difference & Big Wins'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className={`text-3xl font-bold ${seasonStats.goalDiff >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {seasonStats.goalDiff >= 0 ? "+" : ""}{seasonStats.goalDiff}
                </p>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'فارق الأهداف' : 'Goal Difference'}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{seasonStats.bigWins}</p>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'انتصارات كبيرة (+3 أهداف)' : 'Big Wins (3+ goals)'}</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{teamPlayers.length}</p>
                <p className="text-xs text-muted-foreground">{language === 'ar' ? 'حجم الفريق' : 'Squad Size'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Tabs */}
      <Tabs defaultValue="goals">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="goals">{language === 'ar' ? 'الأهداف شهرياً' : 'Goals by Month'}</TabsTrigger>
          <TabsTrigger value="results">{language === 'ar' ? 'توزيع النتائج' : 'Result Distribution'}</TabsTrigger>
          <TabsTrigger value="types">{language === 'ar' ? 'أنواع المباريات' : 'Match Types'}</TabsTrigger>
          <TabsTrigger value="scorers">{language === 'ar' ? 'هدافو الموسم' : 'Top Scorers'}</TabsTrigger>
          <TabsTrigger value="recent">{language === 'ar' ? 'المباريات الأخيرة' : 'Recent Matches'}</TabsTrigger>
        </TabsList>

        {/* Goals by Month */}
        <TabsContent value="goals">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{language === 'ar' ? 'الأهداف المسجلة والمستقبلة شهرياً' : 'Goals Scored & Conceded by Month'}</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={monthlyData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="scored" name={language === 'ar' ? 'أهداف مسجلة' : 'Goals Scored'} fill="#16a34a" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="conceded" name={language === 'ar' ? 'أهداف مستقبلة' : 'Goals Conceded'} fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">No match data available</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Result Distribution */}
        <TabsContent value="results">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{language === 'ar' ? 'توزيع الفوز / التعادل / الخسارة' : 'Win / Draw / Loss Distribution'}</CardTitle>
              </CardHeader>
              <CardContent>
                {resultPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie data={resultPieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                        {resultPieData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-48 text-muted-foreground">No match data</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{language === 'ar' ? 'الأداء في الملعب مقابل الخارج' : 'Home vs Away Performance'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RadarChart data={homeAwayData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar name="Home" dataKey="home" stroke="#16a34a" fill="#16a34a" fillOpacity={0.3} />
                    <Radar name="Away" dataKey="away" stroke="#2563eb" fill="#2563eb" fillOpacity={0.3} />
                    <Legend />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Match Types */}
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{language === 'ar' ? 'الأداء حسب نوع المباراة' : 'Performance by Match Type'}</CardTitle>
            </CardHeader>
            <CardContent>
              {matchTypeData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={matchTypeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="wins" name={language === 'ar' ? 'انتصارات' : 'Wins'} fill="#16a34a" stackId="a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="draws" name={language === 'ar' ? 'تعادلات' : 'Draws'} fill="#d97706" stackId="a" />
                    <Bar dataKey="losses" name={language === 'ar' ? 'خسائر' : 'Losses'} fill="#dc2626" stackId="a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-48 text-muted-foreground">No match data</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Scorers */}
        <TabsContent value="scorers">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-700 dark:text-yellow-500" /> {language === 'ar' ? 'هدافو الموسم — 2024/25' : 'Top Scorers — 2024/25 Season'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topScorers.length > 0 ? (
                <div className="space-y-3">
                  {topScorers.map((player: any, index: number) => (
                    <div key={player.playerId} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? "bg-yellow-500 text-black" : index === 1 ? "bg-gray-400 text-black" : index === 2 ? "bg-orange-500 text-white" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{player.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{player.position}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-bold text-green-600">{player.totalGoals}</p>
                          <p className="text-xs text-muted-foreground">{language === 'ar' ? 'أهداف' : 'Goals'}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-blue-600">{player.totalAssists}</p>
                          <p className="text-xs text-muted-foreground">{language === 'ar' ? 'تمريرات حاسمة' : 'Assists'}</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-purple-600">{player.matchesPlayed}</p>
                          <p className="text-xs text-muted-foreground">{language === 'ar' ? 'مباريات' : 'Apps'}</p>
                        </div>
                        {player.avgRating && (
                          <div className="text-center">
                            <p className="font-bold text-orange-600">{player.avgRating}</p>
                            <p className="text-xs text-muted-foreground">{language === 'ar' ? 'تقييم' : 'Rating'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{language === 'ar' ? 'لا توجد بيانات هدافين بعد.' : 'No scorer data available yet.'}</p>
                  <p className="text-xs mt-1">{language === 'ar' ? 'أدخل نتائج المباريات مع إحصائيات اللاعبين لملء هذا القسم.' : 'Enter match results with player stats to populate this section.'}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Matches */}
        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{language === 'ar' ? 'نتائج المباريات الأخيرة' : 'Recent Match Results'}</CardTitle>
            </CardHeader>
            <CardContent>
              {recentMatches.length > 0 ? (
                <div className="space-y-2">
                  {recentMatches.map((match: any) => (
                    <div key={match.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 transition-colors">
                      <Badge
                        className={`w-10 text-center justify-center text-xs font-bold ${match.result === "win" ? "bg-green-500 hover:bg-green-500" : match.result === "draw" ? "bg-yellow-500 hover:bg-yellow-500" : "bg-red-500 hover:bg-red-500"} text-white`}
                      >
                        {match.result === "win" ? "W" : match.result === "draw" ? "D" : "L"}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {match.isHome ? "Future Stars U17" : match.opponent ?? "Unknown"} vs {match.isHome ? (match.opponent ?? "Unknown") : "Future Stars U17"}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {match.matchType} · {match.isHome ? "Home" : "Away"} · {new Date(match.matchDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg leading-none">
                          {match.isHome ? match.teamScore : match.opponentScore} – {match.isHome ? match.opponentScore : match.teamScore}
                        </p>
                        {match.halfTimeScore && <p className="text-xs text-muted-foreground">HT: {match.halfTimeScore}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>No completed matches found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
