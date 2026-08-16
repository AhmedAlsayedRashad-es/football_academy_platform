import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BackButton } from "@/components/BackButton";
import {
  BarChart3, TrendingUp, Globe, Target, Star, Award, Users,
  ArrowUp, ArrowDown, Minus, Trophy, Shield, Zap, Brain
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, LineChart, Line, ReferenceLine
} from "recharts";

// Benchmark standards data
const BENCHMARKS = {
  academy: { technical: 68, physical: 65, tactical: 60, mental: 62, overall: 64 },
  egyptian_league: { technical: 74, physical: 72, tactical: 70, mental: 68, overall: 71 },
  la_masia: { technical: 88, physical: 82, tactical: 86, mental: 84, overall: 85 },
  ajax: { technical: 85, physical: 84, tactical: 88, mental: 82, overall: 85 },
  international: { technical: 90, physical: 88, tactical: 87, mental: 86, overall: 88 },
};

const BENCHMARK_LABELS: Record<string, { en: string; ar: string; color: string }> = {
  academy: { en: "Academy Average", ar: "متوسط الأكاديمية", color: "#6b7280" },
  egyptian_league: { en: "Egyptian League U18", ar: "الدوري المصري تحت 18", color: "#f59e0b" },
  la_masia: { en: "La Masía Standard", ar: "معيار لا ماسيا", color: "#dc2626" },
  ajax: { en: "Ajax Academy", ar: "أكاديمية أياكس", color: "#7c3aed" },
  international: { en: "International Elite", ar: "النخبة الدولية", color: "#0ea5e9" },
};

export default function PlayerBenchmarkingHub() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>("academy");
  const [activeTab, setActiveTab] = useState("compare");

  const { data: players = [] } = trpc.players.getAll.useQuery();
  const { data: teams = [] } = trpc.teams.getAll.useQuery();

  // Get real skill data for selected player
  const { data: skillData = [] } = trpc.performance.getPlayerSkills.useQuery(
    { playerId: parseInt(selectedPlayer) },
    { enabled: !!selectedPlayer && !isNaN(parseInt(selectedPlayer)) }
  );
  const { data: perfHistoryData } = trpc.players.getPerformanceHistory.useQuery(
    { playerId: parseInt(selectedPlayer), matchCount: 6 },
    { enabled: !!selectedPlayer && !isNaN(parseInt(selectedPlayer)) }
  );
  const perfHistory = perfHistoryData?.matches ?? [];

  const selectedPlayerInfo = (players as any[]).find((p: any) => String(p.id) === selectedPlayer);
  // skillData is either an array of rows or a single aggregate object.
  const latestSkill = Array.isArray(skillData) && skillData.length > 0 ? (skillData as any[])[0] : null;

  // Player stats - use real data if available
  const playerStats = {
    technical: latestSkill?.technicalOverall ?? 0,
    physical: latestSkill?.physicalOverall ?? 0,
    tactical: latestSkill?.mentalOverall ?? 0,
    mental: latestSkill?.mentalOverall ?? 0,
    overall: latestSkill ? Math.round(((latestSkill.technicalOverall ?? 0) + (latestSkill.physicalOverall ?? 0) + (latestSkill.mentalOverall ?? 0)) / 3) : 0,
    name: selectedPlayerInfo ? `${selectedPlayerInfo.firstName} ${selectedPlayerInfo.lastName}` : (isAr ? 'اختر لاعباً' : 'Select a player'),
    position: selectedPlayerInfo?.position || 'Unknown',
    ageGroup: selectedPlayerInfo?.ageGroup || 'Unknown',
  };

  const benchmark = BENCHMARKS[selectedBenchmark as keyof typeof BENCHMARKS] || BENCHMARKS.academy;
  const benchmarkLabel = BENCHMARK_LABELS[selectedBenchmark] || BENCHMARK_LABELS.academy;

  const getVariance = (playerVal: number, benchVal: number) => playerVal - benchVal;
  const getVarianceIcon = (v: number) =>
    v > 5 ? <ArrowUp className="h-4 w-4 text-green-700 dark:text-green-500" /> :
    v < -5 ? <ArrowDown className="h-4 w-4 text-red-500" /> :
    <Minus className="h-4 w-4 text-yellow-700 dark:text-yellow-500" />;
  const getVarianceBadge = (v: number) =>
    v > 5 ? "bg-green-100 text-green-700 border-green-200" :
    v < -5 ? "bg-red-100 text-red-700 border-red-200" :
    "bg-yellow-100 text-yellow-700 border-yellow-200";

  const comparisonData = [
    { skill: isAr ? "تقني" : "Technical", player: playerStats.technical, benchmark: benchmark.technical },
    { skill: isAr ? "بدني" : "Physical", player: playerStats.physical, benchmark: benchmark.physical },
    { skill: isAr ? "تكتيكي" : "Tactical", player: playerStats.tactical, benchmark: benchmark.tactical },
    { skill: isAr ? "ذهني" : "Mental", player: playerStats.mental, benchmark: benchmark.mental },
  ];

  const radarData = [
    { metric: isAr ? "تقني" : "Technical", player: playerStats.technical, benchmark: benchmark.technical },
    { metric: isAr ? "بدني" : "Physical", player: playerStats.physical, benchmark: benchmark.physical },
    { metric: isAr ? "تكتيكي" : "Tactical", player: playerStats.tactical, benchmark: benchmark.tactical },
    { metric: isAr ? "ذهني" : "Mental", player: playerStats.mental, benchmark: benchmark.mental },
  ];

  // Build progression data from real performance history
  const progressionData = (() => {
    if ((perfHistory as any[]).length > 0) {
      return (perfHistory as any[]).slice(-6).map((entry: any) => {
        const date = new Date(entry.sessionDate || entry.createdAt);
        const monthNames = isAr
          ? ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"]
          : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
        const overall = Math.round(((entry.technicalOverall ?? 0) + (entry.physicalOverall ?? 0) + (entry.mentalOverall ?? 0)) / 3);
        return {
          month: monthNames[date.getMonth()],
          player: overall,
          academy: BENCHMARKS.academy.overall,
          egyptian: BENCHMARKS.egyptian_league.overall,
        };
      });
    }
    // Fallback: show current score as flat line
    const months = isAr
      ? ["يناير","فبراير","مارس","أبريل","مايو","يونيو"]
      : ["Jan","Feb","Mar","Apr","May","Jun"];
    return months.map(month => ({
      month,
      player: playerStats.overall || 0,
      academy: BENCHMARKS.academy.overall,
      egyptian: BENCHMARKS.egyptian_league.overall,
    }));
  })();

  const allBenchmarkComparison = Object.entries(BENCHMARKS).map(([key, vals]) => ({
    name: isAr ? BENCHMARK_LABELS[key].ar : BENCHMARK_LABELS[key].en,
    value: vals.overall,
    color: BENCHMARK_LABELS[key].color,
    player: playerStats.overall,
  }));

  // Percentile calculation
  const getPercentile = (playerVal: number, benchVal: number) => {
    const ratio = playerVal / benchVal;
    return Math.min(99, Math.round(ratio * 50));
  };

  const overallPercentile = getPercentile(playerStats.overall, benchmark.overall);

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              {isAr ? "نظام التقييم المقارن" : "Player Benchmarking System"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAr
                ? "قارن أداء اللاعبين مع معايير الأكاديمية، الدوري المصري، لا ماسيا، وأياكس"
                : "Compare player performance against academy, Egyptian league, La Masía, and Ajax standards"}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={isAr ? "اختر لاعباً" : "Select Player"} />
            </SelectTrigger>
            <SelectContent>
              {players.slice(0, 20).map((p: any) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.firstName} {p.lastName}
                </SelectItem>
              ))}
              {players.length === 0 && (
                <SelectItem value="demo">{isAr ? "أحمد محمد (تجريبي)" : "Ahmed Mohamed (Demo)"}</SelectItem>
              )}
            </SelectContent>
          </Select>
          <Select value={selectedBenchmark} onValueChange={setSelectedBenchmark}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder={isAr ? "اختر المعيار" : "Select Benchmark"} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(BENCHMARK_LABELS).map(([key, val]) => (
                <SelectItem key={key} value={key}>{isAr ? val.ar : val.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="brand-gradient-subtle border-primary/20">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{playerStats.overall}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "التقييم الكلي" : "Overall Rating"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold">{benchmark.overall}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "معيار المقارنة" : "Benchmark"}</p>
              <p className="text-xs font-medium text-primary truncate">{isAr ? benchmarkLabel.ar : benchmarkLabel.en}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className={`text-3xl font-bold ${playerStats.overall >= benchmark.overall ? "text-green-600" : "text-red-600"}`}>
                {playerStats.overall >= benchmark.overall ? "+" : ""}{playerStats.overall - benchmark.overall}
              </p>
              <p className="text-xs text-muted-foreground">{isAr ? "الفارق" : "Variance"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-purple-600">{overallPercentile}th</p>
              <p className="text-xs text-muted-foreground">{isAr ? "المئيني" : "Percentile"}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="compare"><BarChart3 className="h-4 w-4 mr-1" />{isAr ? "مقارنة المهارات" : "Skills Comparison"}</TabsTrigger>
            <TabsTrigger value="radar"><Target className="h-4 w-4 mr-1" />{isAr ? "مخطط الرادار" : "Radar Chart"}</TabsTrigger>
            <TabsTrigger value="progression"><TrendingUp className="h-4 w-4 mr-1" />{isAr ? "التطور عبر الزمن" : "Progression"}</TabsTrigger>
            <TabsTrigger value="all-benchmarks"><Globe className="h-4 w-4 mr-1" />{isAr ? "كل المعايير" : "All Benchmarks"}</TabsTrigger>
          </TabsList>

          {/* ── Skills Comparison ── */}
          <TabsContent value="compare">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{isAr ? "مقارنة المهارات" : "Skills Comparison"}</CardTitle>
                  <CardDescription>
                    {isAr ? `مقارنة مع: ${benchmarkLabel.ar}` : `Compared to: ${benchmarkLabel.en}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="skill" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="player" fill="#3b82f6" name={isAr ? "اللاعب" : "Player"} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="benchmark" fill={benchmarkLabel.color} name={isAr ? benchmarkLabel.ar : benchmarkLabel.en} radius={[4, 4, 0, 0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{isAr ? "تفاصيل الفوارق" : "Variance Details"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: isAr ? "تقني" : "Technical", player: playerStats.technical, bench: benchmark.technical },
                      { label: isAr ? "بدني" : "Physical", player: playerStats.physical, bench: benchmark.physical },
                      { label: isAr ? "تكتيكي" : "Tactical", player: playerStats.tactical, bench: benchmark.tactical },
                      { label: isAr ? "ذهني" : "Mental", player: playerStats.mental, bench: benchmark.mental },
                    ].map((item, i) => {
                      const variance = getVariance(item.player, item.bench);
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{item.label}</span>
                            <div className="flex items-center gap-2">
                              {getVarianceIcon(variance)}
                              <Badge className={getVarianceBadge(variance)}>
                                {variance > 0 ? "+" : ""}{variance}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex gap-2 items-center">
                            <div className="flex-1">
                              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>{isAr ? "اللاعب" : "Player"}: {item.player}</span>
                                <span>{isAr ? "المعيار" : "Benchmark"}: {item.bench}</span>
                              </div>
                              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="absolute top-0 left-0 h-full bg-blue-500 rounded-full"
                                  style={{ width: `${item.player}%` }}
                                />
                                <div
                                  className="absolute top-0 h-full w-0.5 bg-red-500"
                                  style={{ left: `${item.bench}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border">
                    <p className="text-xs text-muted-foreground">
                      {isAr ? "الخط الأحمر = معيار المقارنة | الشريط الأزرق = اللاعب" : "Red line = Benchmark | Blue bar = Player"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Radar Chart ── */}
          <TabsContent value="radar">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  {isAr ? "مخطط الرادار — مقارنة شاملة" : "Radar Chart — Comprehensive Comparison"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ResponsiveContainer width="100%" height={320}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 13 }} />
                      <Radar
                        name={isAr ? "اللاعب" : "Player"}
                        dataKey="player"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.4}
                      />
                      <Radar
                        name={isAr ? benchmarkLabel.ar : benchmarkLabel.en}
                        dataKey="benchmark"
                        stroke={benchmarkLabel.color}
                        fill={benchmarkLabel.color}
                        fillOpacity={0.2}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                  <div className="space-y-4">
                    <h3 className="font-semibold">{isAr ? "تحليل الرادار" : "Radar Analysis"}</h3>
                    {[
                      { label: isAr ? "تقني" : "Technical", player: playerStats.technical, bench: benchmark.technical, icon: Star },
                      { label: isAr ? "بدني" : "Physical", player: playerStats.physical, bench: benchmark.physical, icon: Zap },
                      { label: isAr ? "تكتيكي" : "Tactical", player: playerStats.tactical, bench: benchmark.tactical, icon: Brain },
                      { label: isAr ? "ذهني" : "Mental", player: playerStats.mental, bench: benchmark.mental, icon: Shield },
                    ].map((item, i) => {
                      const pct = getPercentile(item.player, item.bench);
                      return (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border">
                          <item.icon className="h-5 w-5 text-primary shrink-0" />
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="font-medium">{item.label}</span>
                              <span className="text-muted-foreground">{item.player} / {item.bench}</span>
                            </div>
                            <Progress value={pct} className="h-2" />
                          </div>
                          <Badge variant="outline" className="text-xs">{pct}th</Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Progression ── */}
          <TabsContent value="progression">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-700 dark:text-green-500" />
                  {isAr ? "تطور اللاعب مقارنة بالمعايير" : "Player Development vs Benchmarks"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={progressionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis domain={[55, 80]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="player" stroke="#3b82f6" strokeWidth={3} dot={{ fill: "#3b82f6", r: 5 }} name={isAr ? "اللاعب" : "Player"} />
                    <Line type="monotone" dataKey="academy" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" name={isAr ? "متوسط الأكاديمية" : "Academy Avg"} />
                    <Line type="monotone" dataKey="egyptian" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name={isAr ? "الدوري المصري" : "Egyptian League"} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    {isAr ? "تحليل التطور" : "Development Analysis"}
                  </h4>
                  <ul className="space-y-1 text-sm text-green-700 dark:text-green-400">
                    <li>✅ {isAr ? "اللاعب يتطور بمعدل +7 نقاط في 6 أشهر" : "Player improving at +7 points over 6 months"}</li>
                    <li>✅ {isAr ? "تجاوز متوسط الأكاديمية منذ مارس" : "Surpassed academy average since March"}</li>
                    <li>🎯 {isAr ? "على مسار الوصول لمعيار الدوري المصري خلال 3 أشهر" : "On track to reach Egyptian League standard in 3 months"}</li>
                    <li>📈 {isAr ? "يحتاج 14 نقطة للوصول لمعيار لا ماسيا" : "Needs 14 more points to reach La Masía standard"}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── All Benchmarks ── */}
          <TabsContent value="all-benchmarks">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {isAr ? "مقارنة مع جميع المعايير" : "Comparison Against All Benchmarks"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(BENCHMARKS).map(([key, vals]) => {
                    const label = BENCHMARK_LABELS[key];
                    const variance = playerStats.overall - vals.overall;
                    const pct = Math.round((playerStats.overall / vals.overall) * 100);
                    return (
                      <div key={key} className="p-4 rounded-xl border border-border bg-muted/20">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />
                            <span className="font-semibold">{isAr ? label.ar : label.en}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={variance >= 0 ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                              {variance >= 0 ? "+" : ""}{variance}
                            </Badge>
                            <Badge variant="outline">{pct}%</Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: isAr ? "تقني" : "Tech", player: playerStats.technical, bench: vals.technical },
                            { label: isAr ? "بدني" : "Phys", player: playerStats.physical, bench: vals.physical },
                            { label: isAr ? "تكتيكي" : "Tact", player: playerStats.tactical, bench: vals.tactical },
                            { label: isAr ? "ذهني" : "Ment", player: playerStats.mental, bench: vals.mental },
                          ].map((s, i) => (
                            <div key={i} className="text-center">
                              <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
                              <p className={`text-sm font-bold ${s.player >= s.bench ? "text-green-600" : "text-red-600"}`}>
                                {s.player} / {s.bench}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
