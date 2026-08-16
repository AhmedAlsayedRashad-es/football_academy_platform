import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Sparkles, 
  FileText, 
  Calendar, 
  Users, 
  TrendingUp, 
  Target,
  Brain,
  Activity,
  ArrowRight,
  Zap,
  ArrowLeft,
  Flame,
  Star,
  ExternalLink,
  Video,
  BarChart2,
  Cpu,
  MessageSquare,
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { BackButton } from '@/components/BackButton';

export default function AIDashboard() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t, isRTL } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<string>('All');

  // Fetch usage stats
  const { data: usageStats } = trpc.tactical.getAIToolUsageStats.useQuery(undefined, {
    enabled: !!user,
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const aiTools = [
    { titleKey: "aiDashboard.playerAnalysis", descKey: "aiDashboard.playerAnalysisDesc", icon: Users, color: "text-blue-500", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20", path: "/players", actionKey: "aiDashboard.viewPlayers", category: "Player AI" },
    { titleKey: "aiDashboard.matchReportGen", descKey: "aiDashboard.matchReportGenDesc", icon: FileText, color: "text-green-700 dark:text-green-500", bgColor: "bg-green-500/10", borderColor: "border-green-500/20", path: "/coach/match-report-generator", actionKey: "aiDashboard.generateReport", category: "Coaching AI" },
    { titleKey: "aiDashboard.trainingPlanner", descKey: "aiDashboard.trainingPlannerDesc", icon: Calendar, color: "text-purple-500", bgColor: "bg-purple-500/10", borderColor: "border-purple-500/20", path: "/coach/training-planner", actionKey: "aiDashboard.planTraining", category: "Coaching AI" },
    { titleKey: "aiDashboard.aiCalendar", descKey: "aiDashboard.aiCalendarDesc", icon: Calendar, color: "text-orange-700 dark:text-orange-500", bgColor: "bg-orange-500/10", borderColor: "border-orange-500/20", path: "/coach/ai-calendar", actionKey: "aiDashboard.viewCalendar", category: "Coaching AI" },
    { titleKey: "aiDashboard.playerComparison", descKey: "aiDashboard.playerComparisonDesc", icon: Users, color: "text-pink-500", bgColor: "bg-pink-500/10", borderColor: "border-pink-500/20", path: "/coach/player-comparison", actionKey: "aiDashboard.comparePlayers", category: "Player AI" },
    { titleKey: "aiDashboard.tacticalHub", descKey: "aiDashboard.tacticalHubDesc", icon: Target, color: "text-indigo-500", bgColor: "bg-indigo-500/10", borderColor: "border-indigo-500/20", path: "/tactical-hub", actionKey: "aiDashboard.openHub", category: "Tactical AI" },
    { titleKey: "aiDashboard.aiCoach", descKey: "aiDashboard.aiCoachDesc", icon: Brain, color: "text-cyan-700 dark:text-cyan-500", bgColor: "bg-cyan-500/10", borderColor: "border-cyan-500/20", path: "/coach/ai-assistant", actionKey: "aiDashboard.askAICoach", category: "Coaching AI" },
    { titleKey: "aiDashboard.aiVideoAnalysis", descKey: "aiDashboard.aiVideoAnalysisDesc", icon: Activity, color: "text-teal-700 dark:text-teal-500", bgColor: "bg-teal-500/10", borderColor: "border-teal-500/20", path: "/coach/ai-video-analysis", actionKey: "aiDashboard.analyzeVideo", category: "Video AI" },
    { titleKey: "aiDashboard.performancePrediction", descKey: "aiDashboard.performancePredictionDesc", icon: TrendingUp, color: "text-violet-500", bgColor: "bg-violet-500/10", borderColor: "border-violet-500/20", path: "/coach/performance-prediction", actionKey: "aiDashboard.viewPredictions", category: "Analytics AI" },
    { titleKey: "aiDashboard.emergencyMode", descKey: "aiDashboard.emergencyModeDesc", icon: Zap, color: "text-red-500", bgColor: "bg-red-500/10", borderColor: "border-red-500/20", path: "/ai-emergency-enhanced", actionKey: "aiEmergency.title", category: "Coaching AI" },
  ];

  const insights = [
    { titleKey: "aiDashboard.teamTrend", value: t("aiDashboard.improving"), change: "+12%", icon: TrendingUp, color: "text-green-700 dark:text-green-500" },
    { titleKey: "aiDashboard.analysesThisWeek", value: "23", change: "+5", icon: Activity, color: "text-blue-500" },
    { titleKey: "aiDashboard.trainingPlans", value: "8", change: "+3", icon: Calendar, color: "text-purple-500" },
    { titleKey: "aiDashboard.matchReports", value: "5", change: "+2", icon: FileText, color: "text-orange-700 dark:text-orange-500" },
  ];

  // Free & Open AI tools for football (updated March 2026)
  const freeAITools = [
    {
      name: "Google Gemini 2.5 Flash",
      description: "Free tier: 15 RPM, 1M tokens/day. Multimodal (text + video + image). Powers AI Coach, Match Reports, and Video Analysis.",
      icon: Sparkles,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      status: "Active",
      statusColor: "bg-green-500/20 text-green-600",
      capabilities: ["Text Analysis", "Video Understanding", "Structured Output"],
    },
    {
      name: "Gemini 2.5 Flash (Live Audio)",
      description: "Real-time audio-to-audio dialogue. Free tier available. Powers the Voice Coach for live hands-free tactical feedback in Arabic & English.",
      icon: MessageSquare,
      color: "text-orange-700 dark:text-orange-500",
      bgColor: "bg-orange-500/10",
      status: "Active — Voice Coach",
      statusColor: "bg-green-500/20 text-green-600",
      capabilities: ["Arabic Voice", "English Voice", "Live Match Feedback"],
    },
    {
      name: "Roboflow Sports Vision",
      description: "Open-source football player detection, ball tracking, jersey number OCR, and team clustering. Free for non-commercial use.",
      icon: Video,
      color: "text-teal-700 dark:text-teal-500",
      bgColor: "bg-teal-500/10",
      status: "Active — Video Analysis",
      statusColor: "bg-green-500/20 text-green-600",
      capabilities: ["Player Detection", "Ball Tracking", "Jersey OCR"],
    },
    {
      name: "Sports2D Pose Estimation",
      description: "Free open-source tool computing 2D joint positions and segment angles from video. Ideal for biomechanics and technique analysis.",
      icon: Activity,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
      status: "Open Source",
      statusColor: "bg-teal-500/20 text-teal-600",
      capabilities: ["Pose Detection", "Angle Analysis", "Technique Scoring"],
    },
    {
      name: "StatsBomb Open Data",
      description: "Free high-quality event data including StatsBomb360 (player positions for every event). Includes Euro 2025 data released Jul 2025.",
      icon: BarChart2,
      color: "text-green-700 dark:text-green-500",
      bgColor: "bg-green-500/10",
      status: "Free Dataset",
      statusColor: "bg-green-500/20 text-green-600",
      capabilities: ["Event Data", "360 Positions", "xG Models"],
    },
    {
      name: "SkillCorner Tracking",
      description: "AI-driven player & ball tracking from broadcast video — no dedicated cameras needed. Free 10-match dataset with event + positioning data.",
      icon: Target,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      status: "Free Dataset",
      statusColor: "bg-purple-500/20 text-purple-600",
      capabilities: ["Player Tracking", "Speed Data", "Formation Detection"],
    },
    {
      name: "SoccerNet (2025 Challenges)",
      description: "Open benchmark dataset for computer vision in football: action spotting, player re-ID, camera calibration. 2025 challenges ongoing.",
      icon: Cpu,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
      status: "Open Source",
      statusColor: "bg-teal-500/20 text-teal-600",
      capabilities: ["Action Spotting", "Player Re-ID", "Camera Calibration"],
    },
    {
      name: "Groq LLaMA 3 (Free Tier)",
      description: "Ultra-fast LLM inference via Groq API. Free tier with generous limits. Ideal for instant coaching Q&A and drill generation.",
      icon: Zap,
      color: "text-amber-700 dark:text-amber-500",
      bgColor: "bg-amber-500/10",
      status: "Available Free",
      statusColor: "bg-amber-500/20 text-amber-600",
      capabilities: ["Fast Inference", "Coaching Q&A", "Drill Generation"],
    },
    {
      name: "API-Football (Free Tier)",
      description: "REST API with free tier for match data, standings, player stats across all major leagues. Useful for opponent research and benchmarking.",
      icon: TrendingUp,
      color: "text-cyan-700 dark:text-cyan-500",
      bgColor: "bg-cyan-500/10",
      status: "Free Tier",
      statusColor: "bg-cyan-500/20 text-cyan-600",
      capabilities: ["Match Data", "Player Stats", "League Tables"],
    },
    {
      name: "Zone7 AI Injury Prediction",
      description: "AI injury prediction used by 50+ clubs. 72% accuracy across 423 injuries. Analyzes 200M hours of football data for load-based risk.",
      icon: Brain,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      status: "Commercial (Research)",
      statusColor: "bg-orange-500/20 text-orange-600",
      capabilities: ["Injury Prediction", "Load Analysis", "72% Accuracy"],
    },
  ];

  // Build set of "most used this week" tool paths
  const topToolPaths = new Set((usageStats?.topTools || []).map(t => t.toolPath));
  const myTopPaths = new Set((usageStats?.myTopTools || []).map(t => t.toolPath));

  return (
    <>
      <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div>
          <BackButton />
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            {t("aiDashboard.title")}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t("aiDashboard.subtitle")}
          </p>
        </div>

        {/* Quick Launch: Top 3 Most Used Tools */}
        {usageStats && usageStats.myTopTools.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">{isRTL ? 'الأدوات الأكثر استخداماً' : 'Quick Launch'}</h2>
              <span className="text-xs text-muted-foreground">{isRTL ? '— أدواتك المفضلة' : '— your most used tools'}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {usageStats.myTopTools.slice(0, 3).map((tool, idx) => {
                const matchedTool = aiTools.find(at => at.path === tool.toolPath);
                const Icon = matchedTool?.icon || Brain;
                return (
                  <button
                    key={idx}
                    onClick={() => setLocation(tool.toolPath)}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all hover:scale-[1.02] hover:shadow-md ${
                      idx === 0 ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' :
                      idx === 1 ? 'border-slate-300 bg-slate-50 dark:bg-slate-800/40' :
                      'border-amber-300 bg-amber-50 dark:bg-amber-900/20'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-600' :
                      idx === 1 ? 'bg-slate-200 text-slate-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{tool.toolLabel}</p>
                      <p className="text-xs text-muted-foreground">{tool.count}× {isRTL ? 'استخدام' : 'uses'}</p>
                    </div>
                    <div className="text-lg">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((insight, idx) => {
            const Icon = insight.icon;
            return (
              <Card key={idx}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{t(insight.titleKey)}</p>
                      <p className="text-2xl font-bold mt-1">{insight.value}</p>
                      <p className={`text-xs mt-1 ${insight.color}`}>{insight.change} {t("aiDashboard.thisWeek")}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${insight.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Most Used This Week Banner */}
        {usageStats && usageStats.topTools.length > 0 && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="h-5 w-5 text-amber-700 dark:text-amber-500" />
                <span className="font-semibold text-amber-600">Most Used This Week</span>
                <span className="text-xs text-muted-foreground ml-1">— across all coaches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {usageStats.topTools.map((tool, idx) => (
                  <button
                    key={idx}
                    onClick={() => setLocation(tool.toolPath)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors text-sm"
                  >
                    <Flame className="h-3.5 w-3.5 text-amber-700 dark:text-amber-500" />
                    <span className="font-medium">{tool.toolLabel}</span>
                    <span className="text-xs text-amber-600 font-bold">{tool.count}×</span>
                  </button>
                ))}
              </div>
              {usageStats.myTopTools.length > 0 && (
                <div className="mt-3 pt-3 border-t border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-700 dark:text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-600">Your Most Used</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {usageStats.myTopTools.map((tool, idx) => (
                      <button
                        key={idx}
                        onClick={() => setLocation(tool.toolPath)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 hover:bg-yellow-500/20 transition-colors text-sm"
                      >
                        <Star className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-500" />
                        <span className="font-medium">{tool.toolLabel}</span>
                        <span className="text-xs text-yellow-600 font-bold">{tool.count}×</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Advanced Tools Grid */}
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-xl font-semibold">{t("aiDashboard.aiTools")}</h2>
            <div className="flex flex-wrap gap-2">
              {['All', 'Coaching AI', 'Tactical AI', 'Player AI', 'Video AI', 'Analytics AI'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                    activeCategory === cat
                      ? cat === 'All' ? 'bg-primary text-primary-foreground border-primary'
                        : cat === 'Coaching AI' ? 'bg-green-500 text-white border-green-500'
                        : cat === 'Tactical AI' ? 'bg-indigo-500 text-white border-indigo-500'
                        : cat === 'Player AI' ? 'bg-blue-500 text-white border-blue-500'
                        : cat === 'Video AI' ? 'bg-teal-500 text-white border-teal-500'
                        : 'bg-violet-500 text-white border-violet-500'
                      : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiTools.filter(tool => activeCategory === 'All' || (tool as any).category === activeCategory).map((tool, idx) => {
              const Icon = tool.icon;
              const isMostUsed = topToolPaths.has(tool.path);
              const isMyTop = myTopPaths.has(tool.path);
              return (
                <Card 
                  key={idx} 
                  className={`${tool.borderColor} hover:shadow-lg transition-all cursor-pointer group relative ${isMostUsed ? 'ring-1 ring-amber-400/50' : ''}`}
                  onClick={() => setLocation(tool.path)}
                >
                  {isMostUsed && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-black text-xs font-bold shadow-md">
                        <Flame className="h-3 w-3" />
                        Hot
                      </span>
                    </div>
                  )}
                  {!isMostUsed && isMyTop && (
                    <div className="absolute -top-2 -right-2 z-10">
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500 text-black text-xs font-bold shadow-md">
                        <Star className="h-3 w-3" />
                        My Fav
                      </span>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-3 rounded-lg ${tool.bgColor}`}>
                        <Icon className={`h-6 w-6 ${tool.color}`} />
                      </div>
                      <Badge variant="outline" className={`text-xs ${
                        (tool as any).category === 'Player AI' ? 'border-blue-300 text-blue-600' :
                        (tool as any).category === 'Coaching AI' ? 'border-green-300 text-green-600' :
                        (tool as any).category === 'Tactical AI' ? 'border-indigo-300 text-indigo-600' :
                        (tool as any).category === 'Video AI' ? 'border-teal-300 text-teal-600' :
                        (tool as any).category === 'Analytics AI' ? 'border-violet-300 text-violet-600' :
                        'border-gray-300 text-gray-600'
                      }`}>
                        {(tool as any).category || 'AI'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-4">{t(tool.titleKey)}</CardTitle>
                    <CardDescription className="text-sm">
                      {t(tool.descKey)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      variant="ghost" 
                      className="w-full group-hover:bg-primary/10 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(tool.path);
                      }}
                    >
                      {t(tool.actionKey)}
                      <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Free AI Technologies Section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Free AI Technologies Powering This Platform</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            The academy platform leverages the best free and open-source AI tools available — no paid API keys required for core functionality.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {freeAITools.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <Card key={idx} className="hover:shadow-md transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-lg ${tool.bgColor} flex-shrink-0`}>
                        <Icon className={`h-5 w-5 ${tool.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-semibold text-sm">{tool.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tool.statusColor}`}>
                            {tool.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{tool.description}</p>
                        <div className="flex flex-wrap gap-1">
                          {tool.capabilities.map((cap, ci) => (
                            <span key={ci} className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">{t("aiDashboard.needHelp")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("aiDashboard.aiCoachDesc")}
                </p>
              </div>
              <Button 
                size="lg"
                onClick={() => setLocation("/coach/ai-assistant")}
                className="gap-2"
              >
                <Brain className="h-5 w-5" />
                {t("aiDashboard.askAI")}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
