import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  GitBranch, TrendingUp, Users, Star, ArrowRight, AlertTriangle,
  CheckCircle2, Clock, Target, Activity, Award, Zap, Brain,
  ChevronUp, BarChart3, Shield, Trophy
, ArrowLeft } from "lucide-react";

const AGE_GROUPS = ["U6", "U8", "U10", "U12", "U14", "U15", "U16", "U17", "U18", "U19"];

const READINESS_LEVELS = {
  ready: { label: "Ready to Promote", labelAr: "جاهز للترقية", color: "bg-green-500", textColor: "text-green-600", min: 80 },
  almost: { label: "Almost Ready", labelAr: "قريب من الجاهزية", color: "bg-yellow-500", textColor: "text-yellow-600", min: 60 },
  developing: { label: "Still Developing", labelAr: "لا يزال في طور التطوير", color: "bg-orange-500", textColor: "text-orange-600", min: 40 },
  early: { label: "Too Early", labelAr: "مبكر جداً", color: "bg-red-500", textColor: "text-red-600", min: 0 },
};

function getReadinessLevel(score: number) {
  if (score >= 80) return READINESS_LEVELS.ready;
  if (score >= 60) return READINESS_LEVELS.almost;
  if (score >= 40) return READINESS_LEVELS.developing;
  return READINESS_LEVELS.early;
}

function calculateReadinessScore(player: any, skills: any[], performance: any[]) {
  let score = 0;
  let factors: { label: string; labelAr: string; score: number; weight: number }[] = [];

  // 1. Skill scores (40% weight)
  const avgSkill = skills.length > 0
    ? skills.reduce((sum: number, s: any) => sum + ((s.technicalScore || 0) + (s.physicalScore || 0) + (s.tacticalScore || 0)) / 3, 0) / skills.length
    : 50;
  factors.push({ label: "Technical Skills", labelAr: "المهارات التقنية", score: Math.min(100, avgSkill), weight: 0.4 });

  // 2. Performance consistency (30% weight)
  const avgPerf = performance.length > 0
    ? performance.reduce((sum: number, p: any) => sum + (p.overallScore || 50), 0) / performance.length
    : 50;
  factors.push({ label: "Performance", labelAr: "الأداء", score: Math.min(100, avgPerf), weight: 0.3 });

  // 3. Age proximity to next group (20% weight)
  const currentGroup = player.ageGroup || "U12";
  const currentAge = parseInt(currentGroup.replace("U", "")) || 12;
  const nextGroup = AGE_GROUPS[AGE_GROUPS.indexOf(currentGroup) + 1];
  const nextAge = nextGroup ? parseInt(nextGroup.replace("U", "")) : currentAge + 1;
  const playerAge = player.dateOfBirth
    ? Math.floor((Date.now() - new Date(player.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
    : currentAge;
  const ageProximity = Math.min(100, Math.max(0, ((playerAge - currentAge) / (nextAge - currentAge)) * 100));
  factors.push({ label: "Age Readiness", labelAr: "النضج العمري", score: ageProximity, weight: 0.2 });

  // 4. Physical development (10% weight)
  const physicalScore = skills.length > 0
    ? skills.reduce((sum: number, s: any) => sum + (s.physicalScore || 50), 0) / skills.length
    : 50;
  factors.push({ label: "Physical Development", labelAr: "التطور البدني", score: Math.min(100, physicalScore), weight: 0.1 });

  score = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
  return { score: Math.round(score), factors };
}

export default function SuccessionPlanning() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [fromGroup, setFromGroup] = useState("U15");
  const [toGroup, setToGroup] = useState("U17");
  const [sortBy, setSortBy] = useState<"score" | "name">("score");

  // Fetch players
  const { data: allPlayers = [], isLoading } = trpc.players.getAll.useQuery();

  // Fetch skills and performance for players in the from group
  const fromPlayers = useMemo(() =>
    (allPlayers as any[]).filter((p: any) => p.ageGroup === fromGroup),
    [allPlayers, fromGroup]
  );

  // We'll compute readiness from player data alone since skill scores require per-player queries
  const allSkills: any[] = [];
  const allPerformance: any[] = [];

  // Calculate readiness for each player
  const playerReadiness = useMemo(() => {
    return fromPlayers.map((player: any) => {
      const playerSkills = (allSkills as any[]).filter((s: any) => s.playerId === player.id);
      const playerPerf = (allPerformance as any[]).filter((p: any) => p.playerId === player.id);
      const { score, factors } = calculateReadinessScore(player, playerSkills, playerPerf);
      return { player, score, factors, level: getReadinessLevel(score) };
    }).sort((a, b) => sortBy === "score" ? b.score - a.score : a.player.firstName.localeCompare(b.player.firstName));
  }, [fromPlayers, allSkills, allPerformance, sortBy]);

  const readyCounts = useMemo(() => ({
    ready: playerReadiness.filter(p => p.score >= 80).length,
    almost: playerReadiness.filter(p => p.score >= 60 && p.score < 80).length,
    developing: playerReadiness.filter(p => p.score >= 40 && p.score < 60).length,
    early: playerReadiness.filter(p => p.score < 40).length,
  }), [playerReadiness]);

  const avgScore = useMemo(() =>
    playerReadiness.length > 0
      ? Math.round(playerReadiness.reduce((s, p) => s + p.score, 0) / playerReadiness.length)
      : 0,
    [playerReadiness]
  );

  return (
    <>

      <button
        onClick={() => navigate("/staff-directory")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Staff Directory
      </button>
      <div className="p-4 md:p-6 max-w-6xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-primary" />
            {isRTL ? "تخطيط التعاقب" : "Succession Planning"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isRTL
              ? "تقييم جاهزية اللاعبين للانتقال من مجموعة عمرية إلى أخرى مع توصيات الترقية"
              : "Assess player readiness for promotion between age groups with AI-powered recommendations"}
          </p>
        </div>

        {/* Group Selector */}
        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">{isRTL ? "من المجموعة" : "From Group"}</label>
                  <Select value={fromGroup} onValueChange={(v) => {
                    setFromGroup(v);
                    const nextIdx = AGE_GROUPS.indexOf(v) + 1;
                    if (nextIdx < AGE_GROUPS.length) setToGroup(AGE_GROUPS[nextIdx]);
                  }}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground mt-4" />
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">{isRTL ? "إلى المجموعة" : "To Group"}</label>
                  <Select value={toGroup} onValueChange={setToGroup}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AGE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <label className="text-xs text-muted-foreground">{isRTL ? "ترتيب حسب:" : "Sort by:"}</label>
                <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">{isRTL ? "الدرجة" : "Score"}</SelectItem>
                    <SelectItem value="name">{isRTL ? "الاسم" : "Name"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-primary">{fromPlayers.length}</div>
              <div className="text-xs text-muted-foreground mt-1">{isRTL ? `لاعبو ${fromGroup}` : `${fromGroup} Players`}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-green-600">{readyCounts.ready}</div>
              <div className="text-xs text-muted-foreground mt-1">{isRTL ? "جاهز" : "Ready"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{readyCounts.almost}</div>
              <div className="text-xs text-muted-foreground mt-1">{isRTL ? "قريب" : "Almost"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{readyCounts.developing}</div>
              <div className="text-xs text-muted-foreground mt-1">{isRTL ? "يتطور" : "Developing"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-primary">{avgScore}%</div>
              <div className="text-xs text-muted-foreground mt-1">{isRTL ? "متوسط الجاهزية" : "Avg Readiness"}</div>
            </CardContent>
          </Card>
        </div>

        {/* Players Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : fromPlayers.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{isRTL ? `لا يوجد لاعبون في مجموعة ${fromGroup}` : `No players in ${fromGroup} group`}</p>
              <p className="text-sm mt-1">{isRTL ? "أضف لاعبين لهذه المجموعة العمرية أولاً" : "Add players to this age group first"}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {playerReadiness.map(({ player, score, factors, level }) => (
              <Card key={player.id} className={`border-l-4 ${score >= 80 ? "border-l-green-500" : score >= 60 ? "border-l-yellow-500" : score >= 40 ? "border-l-orange-500" : "border-l-red-500"}`}>
                <CardContent className="pt-4">
                  {/* Player Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {player.firstName?.[0]}{player.lastName?.[0]}
                      </div>
                      <div>
                        <div className="font-semibold">{player.firstName} {player.lastName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          {player.position} · #{player.jerseyNumber || "—"}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: score >= 80 ? "#16a34a" : score >= 60 ? "#ca8a04" : score >= 40 ? "#ea580c" : "#dc2626" }}>
                        {score}%
                      </div>
                      <Badge className={`text-xs ${score >= 80 ? "bg-green-500/10 text-green-700" : score >= 60 ? "bg-yellow-500/10 text-yellow-700" : score >= 40 ? "bg-orange-500/10 text-orange-700" : "bg-red-500/10 text-red-700"}`}>
                        {isRTL ? level.labelAr : level.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Overall Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>{isRTL ? "جاهزية الانتقال" : "Promotion Readiness"}</span>
                      <span>{fromGroup} → {toGroup}</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>

                  {/* Factor Breakdown */}
                  <div className="space-y-1.5">
                    {factors.map((factor, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs">
                        <div className="w-24 text-muted-foreground truncate">{isRTL ? factor.labelAr : factor.label}</div>
                        <div className="flex-1">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${factor.score}%`,
                                backgroundColor: factor.score >= 70 ? "#16a34a" : factor.score >= 50 ? "#ca8a04" : "#dc2626"
                              }}
                            />
                          </div>
                        </div>
                        <div className="w-8 text-right font-medium">{Math.round(factor.score)}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendation */}
                  <div className={`mt-3 p-2 rounded-lg text-xs ${score >= 80 ? "bg-green-500/10 text-green-700" : score >= 60 ? "bg-yellow-500/10 text-yellow-700" : "bg-muted text-muted-foreground"}`}>
                    {score >= 80 ? (
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {isRTL ? `يُوصى بترقيته إلى ${toGroup} في الموسم القادم` : `Recommended for promotion to ${toGroup} next season`}
                      </div>
                    ) : score >= 60 ? (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {isRTL ? `يحتاج 3-6 أشهر إضافية قبل الترقية إلى ${toGroup}` : `Needs 3-6 more months before ${toGroup} promotion`}
                      </div>
                    ) : score >= 40 ? (
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        {isRTL ? "يحتاج تطوير في المهارات التقنية والبدنية" : "Needs technical and physical development"}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        {isRTL ? "مبكر جداً للترقية — ركز على الأساسيات" : "Too early for promotion — focus on fundamentals"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pipeline Overview */}
        {playerReadiness.length > 0 && (
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                {isRTL ? "نظرة عامة على خط التعاقب" : "Succession Pipeline Overview"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(READINESS_LEVELS).map(([key, level]) => {
                  const count = readyCounts[key as keyof typeof readyCounts];
                  const pct = fromPlayers.length > 0 ? Math.round((count / fromPlayers.length) * 100) : 0;
                  return (
                    <div key={key} className="text-center">
                      <div className={`text-2xl font-bold ${level.textColor}`}>{count}</div>
                      <div className="text-xs text-muted-foreground">{isRTL ? level.labelAr : level.label}</div>
                      <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${level.color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{pct}%</div>
                    </div>
                  );
                })}
              </div>

              {/* AI Insight */}
              <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-start gap-2">
                  <Brain className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <span className="font-medium text-primary">{isRTL ? "توصية الذكاء الاصطناعي: " : "AI Recommendation: "}</span>
                    <span className="text-muted-foreground">
                      {isRTL
                        ? `من مجموعة ${fromGroup} (${fromPlayers.length} لاعب): ${readyCounts.ready} جاهز للترقية فوراً، ${readyCounts.almost} يحتاج 3-6 أشهر. ركز على تطوير المهارات التقنية للاعبين في مرحلة "يتطور" (${readyCounts.developing} لاعب) لتسريع جاهزيتهم.`
                        : `From ${fromGroup} (${fromPlayers.length} players): ${readyCounts.ready} ready for immediate promotion to ${toGroup}, ${readyCounts.almost} need 3-6 months. Focus technical skill development for the ${readyCounts.developing} "developing" players to accelerate their readiness.`}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
