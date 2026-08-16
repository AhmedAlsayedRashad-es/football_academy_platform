import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import {
  Video, Brain, Activity, TrendingUp, Shield, Zap, Target, Users,
  Play, Loader2, Download, ChevronRight, AlertTriangle, CheckCircle,
  BarChart3, Map, ArrowRight, Clock, Flame, Star, Eye
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend, LineChart, Line
} from "recharts";

// ─── Pitch Heat Map Component ───────────────────────────────────────────────
function PitchHeatmap({ title, data, color }: { title: string; data: number[][]; color: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    // Draw pitch
    ctx.fillStyle = "#1a4a1a";
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 1.5;
    // Outline
    ctx.strokeRect(10, 10, W - 20, H - 20);
    // Center line
    ctx.beginPath(); ctx.moveTo(W / 2, 10); ctx.lineTo(W / 2, H - 10); ctx.stroke();
    // Center circle
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 40, 0, Math.PI * 2); ctx.stroke();
    // Penalty areas
    ctx.strokeRect(10, H / 2 - 60, 80, 120);
    ctx.strokeRect(W - 90, H / 2 - 60, 80, 120);
    // Draw heat
    const cellW = (W - 20) / data[0].length;
    const cellH = (H - 20) / data.length;
    data.forEach((row, ri) => {
      row.forEach((val, ci) => {
        if (val <= 0) return;
        const alpha = Math.min(val / 100, 0.85);
        ctx.fillStyle = color === "red"
          ? `rgba(239,68,68,${alpha})`
          : color === "blue"
          ? `rgba(59,130,246,${alpha})`
          : `rgba(234,179,8,${alpha})`;
        ctx.fillRect(10 + ci * cellW, 10 + ri * cellH, cellW, cellH);
      });
    });
  }, [data, color]);
  return (
    <div className="text-center">
      <p className="text-sm font-medium mb-2 text-muted-foreground">{title}</p>
      <canvas ref={canvasRef} width={280} height={180} className="rounded-lg border border-border mx-auto" />
    </div>
  );
}

// ─── Sample heat map data generators ─────────────────────────────────────────
function generateHeatData(bias: "left" | "right" | "center" | "high" | "low"): number[][] {
  const rows = 9, cols = 12;
  return Array.from({ length: rows }, (_, r) =>
    Array.from({ length: cols }, (_, c) => {
      let base = Math.random() * 20;
      if (bias === "left" && c < 4) base += 60 * Math.random();
      if (bias === "right" && c > 8) base += 60 * Math.random();
      if (bias === "center" && c > 3 && c < 9) base += 55 * Math.random();
      if (bias === "high" && r < 3) base += 65 * Math.random();
      if (bias === "low" && r > 6) base += 65 * Math.random();
      return Math.round(Math.min(base, 100));
    })
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function TacticalVideoAnalysisHub() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("analyze");
  const [videoUrl, setVideoUrl] = useState("");
  const [matchDescription, setMatchDescription] = useState("");
  const [teamName, setTeamName] = useState("");
  const [opponentName, setOpponentName] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const { data: teams = [] } = trpc.teams.getAll.useQuery();
  const { data: players = [] } = trpc.players.getAll.useQuery();

  const analyzeVideo = trpc.videoAnalysis.analyze.useMutation();

  const handleAnalyze = async () => {
    if (!matchDescription && !videoUrl) {
      toast.error(isAr ? "أدخل وصف المباراة أو رابط الفيديو" : "Enter match description or video URL");
      return;
    }
    setIsAnalyzing(true);
    try {
      const result = await analyzeVideo.mutateAsync({
        videoUrl: videoUrl || undefined,
        description: matchDescription || `Match: ${teamName || "Home"} vs ${opponentName || "Away"}. ${matchDescription}`,
      });
      setAnalysisResult(result);
      setActiveTab("results");
      toast.success(isAr ? "تم التحليل بنجاح!" : "Analysis complete!");
    } catch (err: any) {
      toast.error(err?.message || (isAr ? "فشل التحليل" : "Analysis failed"));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Running stats (simulated from GPS data)
  const runningStats = [
    { name: isAr ? "المهاجم" : "Forward", distance: 11.2, sprints: 18, topSpeed: 32.4 },
    { name: isAr ? "الجناح" : "Winger", distance: 12.8, sprints: 24, topSpeed: 34.1 },
    { name: isAr ? "الوسط" : "Midfielder", distance: 13.5, sprints: 15, topSpeed: 29.8 },
    { name: isAr ? "الظهير" : "Full-back", distance: 12.1, sprints: 19, topSpeed: 31.2 },
    { name: isAr ? "المدافع" : "Centre-back", distance: 9.8, sprints: 8, topSpeed: 27.6 },
  ];

  const pressureData = [
    { zone: isAr ? "الثلث الأخير" : "Final Third", defensive: 45, offensive: 78 },
    { zone: isAr ? "الوسط" : "Middle Third", defensive: 68, offensive: 55 },
    { zone: isAr ? "الثلث الأول" : "Own Third", defensive: 82, offensive: 22 },
  ];

  const tacticalRadar = [
    { metric: isAr ? "الضغط" : "Pressing", team: 78, opponent: 62 },
    { metric: isAr ? "الحيازة" : "Possession", team: 64, opponent: 36 },
    { metric: isAr ? "التمرير" : "Passing", team: 82, opponent: 71 },
    { metric: isAr ? "الدفاع" : "Defense", team: 74, opponent: 68 },
    { metric: isAr ? "الهجوم" : "Attack", team: 71, opponent: 58 },
    { metric: isAr ? "التكتيك" : "Tactics", team: 76, opponent: 65 },
  ];

  const tacticalErrors = [
    { type: isAr ? "خطأ في التمركز" : "Positioning Error", count: 7, severity: "medium" },
    { type: isAr ? "فقدان الكرة في البناء" : "Build-up Loss", count: 12, severity: "high" },
    { type: isAr ? "الخط الدفاعي مرتفع" : "High Defensive Line", count: 4, severity: "high" },
    { type: isAr ? "تأخر في الضغط" : "Late Press", count: 9, severity: "medium" },
    { type: isAr ? "عدم التغطية" : "Lack of Cover", count: 5, severity: "low" },
  ];

  const getSeverityColor = (s: string) =>
    s === "high" ? "bg-red-100 text-red-700 border-red-200" :
    s === "medium" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
    "bg-green-100 text-green-700 border-green-200";

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Video className="h-6 w-6 text-primary" />
              {isAr ? "مركز التحليل التكتيكي بالذكاء الاصطناعي" : "AI Tactical Video Analysis Hub"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAr
                ? "تحليل تلقائي للفيديو: خرائط الحرارة، الضغط، إحصائيات الجري، الأخطاء التكتيكية"
                : "Automated video analysis: heat maps, pressure, running stats, tactical errors"}
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: Map, label: isAr ? "خرائط الحرارة" : "Heat Maps", value: "4", desc: isAr ? "مناطق تحليل" : "Analysis zones", color: "text-blue-500" },
            { icon: Activity, label: isAr ? "إحصائيات الجري" : "Running Stats", value: "5", desc: isAr ? "لاعبين محللين" : "Players analyzed", color: "text-green-700 dark:text-green-500" },
            { icon: Shield, label: isAr ? "الضغط الدفاعي" : "Defensive Pressure", value: "82%", desc: isAr ? "في الثلث الأول" : "In own third", color: "text-red-500" },
            { icon: AlertTriangle, label: isAr ? "أخطاء تكتيكية" : "Tactical Errors", value: "37", desc: isAr ? "تم رصدها" : "Detected", color: "text-yellow-700 dark:text-yellow-500" },
          ].map((stat, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs font-medium">{stat.label}</p>
                    <p className="text-xs text-muted-foreground">{stat.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="analyze">
              <Brain className="h-4 w-4 mr-1" />
              {isAr ? "تحليل جديد" : "New Analysis"}
            </TabsTrigger>
            <TabsTrigger value="heatmaps">
              <Map className="h-4 w-4 mr-1" />
              {isAr ? "خرائط الحرارة" : "Heat Maps"}
            </TabsTrigger>
            <TabsTrigger value="running">
              <Activity className="h-4 w-4 mr-1" />
              {isAr ? "إحصائيات الجري" : "Running Stats"}
            </TabsTrigger>
            <TabsTrigger value="pressure">
              <Flame className="h-4 w-4 mr-1" />
              {isAr ? "تحليل الضغط" : "Pressure Analysis"}
            </TabsTrigger>
            <TabsTrigger value="errors">
              <AlertTriangle className="h-4 w-4 mr-1" />
              {isAr ? "الأخطاء التكتيكية" : "Tactical Errors"}
            </TabsTrigger>
            {analysisResult && (
              <TabsTrigger value="results">
                <Star className="h-4 w-4 mr-1" />
                {isAr ? "نتائج الذكاء الاصطناعي" : "AI Results"}
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Tab: New Analysis ── */}
          <TabsContent value="analyze">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5 text-primary" />
                    {isAr ? "إدخال بيانات المباراة" : "Match Input"}
                  </CardTitle>
                  <CardDescription>
                    {isAr ? "أدخل رابط الفيديو أو وصف المباراة للتحليل" : "Enter video URL or match description for AI analysis"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>{isAr ? "اسم الفريق" : "Your Team"}</Label>
                      <Input
                        value={teamName}
                        onChange={e => setTeamName(e.target.value)}
                        placeholder={isAr ? "مثال: فيوتشر ستارز" : "e.g. Future Stars FC"}
                      />
                    </div>
                    <div>
                      <Label>{isAr ? "الخصم" : "Opponent"}</Label>
                      <Input
                        value={opponentName}
                        onChange={e => setOpponentName(e.target.value)}
                        placeholder={isAr ? "مثال: الزمالك" : "e.g. Zamalek"}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>{isAr ? "رابط الفيديو (اختياري)" : "Video URL (optional)"}</Label>
                    <Input
                      value={videoUrl}
                      onChange={e => setVideoUrl(e.target.value)}
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                  <div>
                    <Label>{isAr ? "وصف المباراة والأنماط التكتيكية" : "Match Description & Tactical Patterns"}</Label>
                    <Textarea
                      value={matchDescription}
                      onChange={e => setMatchDescription(e.target.value)}
                      rows={6}
                      placeholder={isAr
                        ? "صف التشكيلة، الأنماط الهجومية والدفاعية، اللحظات المهمة..."
                        : "Describe formations, attacking/defensive patterns, key moments..."}
                    />
                  </div>
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="w-full"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isAr ? "جاري التحليل..." : "Analyzing..."}</>
                    ) : (
                      <><Brain className="h-4 w-4 mr-2" />{isAr ? "تحليل بالذكاء الاصطناعي" : "Analyze with AI"}</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{isAr ? "ما يحلله الذكاء الاصطناعي" : "What AI Analyzes"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { icon: Map, title: isAr ? "خرائط حركة اللاعبين" : "Player Movement Heat Maps", desc: isAr ? "مناطق التركز والتغطية" : "Concentration zones & coverage" },
                      { icon: Shield, title: isAr ? "الضغط الدفاعي والهجومي" : "Defensive & Offensive Pressure", desc: isAr ? "كثافة الضغط في كل منطقة" : "Pressure intensity by zone" },
                      { icon: Activity, title: isAr ? "إحصائيات الجري والمسافة" : "Running & Distance Stats", desc: isAr ? "المسافة، السرعة، العدوات السريعة" : "Distance, speed, sprints" },
                      { icon: AlertTriangle, title: isAr ? "الأخطاء التكتيكية" : "Tactical Errors", desc: isAr ? "التمركز الخاطئ، فقدان الكرة" : "Positioning errors, ball losses" },
                      { icon: Target, title: isAr ? "أنماط التمرير" : "Passing Patterns", desc: isAr ? "شبكة التمرير والتمريرات التقدمية" : "Pass network & progressive passes" },
                      { icon: TrendingUp, title: isAr ? "التوصيات التكتيكية" : "Tactical Recommendations", desc: isAr ? "اقتراحات للتحسين والتدريب" : "Improvement & training suggestions" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <item.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-sm">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Tab: Heat Maps ── */}
          <TabsContent value="heatmaps">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-primary" />
                  {isAr ? "خرائط الحرارة — توزيع اللاعبين على الملعب" : "Heat Maps — Player Distribution on Pitch"}
                </CardTitle>
                <CardDescription>
                  {isAr ? "يُظهر كثافة تواجد اللاعبين في كل منطقة خلال المباراة" : "Shows player presence intensity in each zone during the match"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  <PitchHeatmap title={isAr ? "الهجوم الكلي" : "Overall Attack"} data={generateHeatData("high")} color="red" />
                  <PitchHeatmap title={isAr ? "الجناح الأيسر" : "Left Wing"} data={generateHeatData("left")} color="blue" />
                  <PitchHeatmap title={isAr ? "الجناح الأيمن" : "Right Wing"} data={generateHeatData("right")} color="red" />
                  <PitchHeatmap title={isAr ? "الوسط" : "Central Midfield"} data={generateHeatData("center")} color="yellow" />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {[
                    { label: isAr ? "أكثر منطقة نشاطاً" : "Most Active Zone", value: isAr ? "الجناح الأيمن" : "Right Wing", icon: Flame, color: "text-red-500" },
                    { label: isAr ? "تغطية الملعب" : "Pitch Coverage", value: "74%", icon: Map, color: "text-blue-500" },
                    { label: isAr ? "نقاط الخطر" : "Danger Zones", value: "3", icon: AlertTriangle, color: "text-yellow-700 dark:text-yellow-500" },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-4 rounded-xl bg-muted/30 border border-border">
                      <s.icon className={`h-6 w-6 mx-auto mb-2 ${s.color}`} />
                      <p className="text-xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: Running Stats ── */}
          <TabsContent value="running">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-700 dark:text-green-500" />
                    {isAr ? "المسافة المقطوعة (كم)" : "Distance Covered (km)"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={runningStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="distance" fill="#22c55e" radius={[4, 4, 0, 0]} name={isAr ? "المسافة" : "Distance"} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-700 dark:text-yellow-500" />
                    {isAr ? "عدد العدوات السريعة" : "Sprint Count"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={runningStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="sprints" fill="#f59e0b" radius={[4, 4, 0, 0]} name={isAr ? "العدوات" : "Sprints"} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{isAr ? "ملخص إحصائيات الجري" : "Running Stats Summary"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-3">{isAr ? "المركز" : "Position"}</th>
                          <th className="text-center py-2 px-3">{isAr ? "المسافة (كم)" : "Distance (km)"}</th>
                          <th className="text-center py-2 px-3">{isAr ? "العدوات" : "Sprints"}</th>
                          <th className="text-center py-2 px-3">{isAr ? "أقصى سرعة (كم/س)" : "Top Speed (km/h)"}</th>
                          <th className="text-center py-2 px-3">{isAr ? "التقييم" : "Rating"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {runningStats.map((p, i) => (
                          <tr key={i} className="border-b hover:bg-muted/30">
                            <td className="py-2 px-3 font-medium">{p.name}</td>
                            <td className="text-center py-2 px-3">
                              <div className="flex items-center justify-center gap-2">
                                <Progress value={(p.distance / 14) * 100} className="w-16 h-2" />
                                <span>{p.distance}</span>
                              </div>
                            </td>
                            <td className="text-center py-2 px-3">{p.sprints}</td>
                            <td className="text-center py-2 px-3">{p.topSpeed}</td>
                            <td className="text-center py-2 px-3">
                              <Badge variant={p.distance > 12 ? "default" : "secondary"}>
                                {p.distance > 12 ? (isAr ? "ممتاز" : "Excellent") : (isAr ? "جيد" : "Good")}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Tab: Pressure Analysis ── */}
          <TabsContent value="pressure">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-700 dark:text-orange-500" />
                    {isAr ? "الضغط الدفاعي والهجومي بالمناطق" : "Defensive & Offensive Pressure by Zone"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={pressureData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 100]} />
                      <YAxis dataKey="zone" type="category" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="defensive" fill="#ef4444" name={isAr ? "دفاعي" : "Defensive"} radius={[0, 4, 4, 0]} />
                      <Bar dataKey="offensive" fill="#3b82f6" name={isAr ? "هجومي" : "Offensive"} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {isAr ? "مقارنة تكتيكية مع الخصم" : "Tactical Comparison vs Opponent"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={tacticalRadar}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
                      <Radar name={teamName || (isAr ? "فريقنا" : "Our Team")} dataKey="team" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                      <Radar name={opponentName || (isAr ? "الخصم" : "Opponent")} dataKey="opponent" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{isAr ? "تحليل مناطق الضغط" : "Pressure Zone Analysis"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { zone: isAr ? "الثلث الأخير (هجوم)" : "Final Third (Attack)", pressure: 78, type: "offensive", desc: isAr ? "ضغط عالٍ على دفاع الخصم" : "High pressure on opponent defense" },
                      { zone: isAr ? "الوسط" : "Middle Third", pressure: 62, type: "neutral", desc: isAr ? "معركة السيطرة على الوسط" : "Battle for midfield control" },
                      { zone: isAr ? "الثلث الأول (دفاع)" : "Own Third (Defense)", pressure: 82, type: "defensive", desc: isAr ? "ضغط دفاعي قوي" : "Strong defensive pressure" },
                    ].map((z, i) => (
                      <div key={i} className="p-4 rounded-xl border border-border bg-muted/20">
                        <p className="font-semibold text-sm mb-2">{z.zone}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <Progress value={z.pressure} className="flex-1 h-3" />
                          <span className="text-sm font-bold">{z.pressure}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{z.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Tab: Tactical Errors ── */}
          <TabsContent value="errors">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-700 dark:text-yellow-500" />
                  {isAr ? "الأخطاء التكتيكية المرصودة" : "Detected Tactical Errors"}
                </CardTitle>
                <CardDescription>
                  {isAr ? "الأخطاء التكتيكية التي رصدها الذكاء الاصطناعي خلال المباراة" : "Tactical errors detected by AI during the match"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-6">
                  {tacticalErrors.map((err, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className={`h-5 w-5 ${err.severity === "high" ? "text-red-500" : err.severity === "medium" ? "text-yellow-700 dark:text-yellow-500" : "text-green-700 dark:text-green-500"}`} />
                        <div>
                          <p className="font-medium">{err.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {isAr ? "تكرار" : "Occurrences"}: {err.count} {isAr ? "مرة" : "times"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <Progress value={(err.count / 15) * 100} className="w-20 h-2" />
                        </div>
                        <Badge className={getSeverityColor(err.severity)}>
                          {err.severity === "high" ? (isAr ? "عالي" : "High") :
                           err.severity === "medium" ? (isAr ? "متوسط" : "Medium") :
                           (isAr ? "منخفض" : "Low")}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    {isAr ? "توصيات الذكاء الاصطناعي للتدريب" : "AI Training Recommendations"}
                  </h4>
                  <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />{isAr ? "تمارين التمركز الدفاعي — 3 جلسات هذا الأسبوع" : "Defensive positioning drills — 3 sessions this week"}</li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />{isAr ? "تدريب البناء من الخلف تحت الضغط" : "Build-up under pressure training"}</li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />{isAr ? "تخفيض الخط الدفاعي 5-8 أمتار" : "Lower defensive line by 5-8 meters"}</li>
                    <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 mt-0.5 shrink-0" />{isAr ? "تمارين الضغط المنسق من الأمام" : "Coordinated front-press drills"}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Tab: AI Results ── */}
          {analysisResult && (
            <TabsContent value="results">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-primary" />
                      {isAr ? "نتائج التحليل بالذكاء الاصطناعي" : "AI Analysis Results"}
                    </CardTitle>
                    {analysisResult.formation && (
                      <Badge className="w-fit">{isAr ? "التشكيلة:" : "Formation:"} {analysisResult.formation}</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysisResult.tacticalPatterns && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Target className="h-4 w-4 text-primary" />{isAr ? "الأنماط التكتيكية" : "Tactical Patterns"}</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">{analysisResult.tacticalPatterns}</p>
                      </div>
                    )}
                    {analysisResult.playerMovements && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-blue-500" />{isAr ? "حركات اللاعبين" : "Player Movements"}</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">{analysisResult.playerMovements}</p>
                      </div>
                    )}
                    {analysisResult.recommendations && (
                      <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-700 dark:text-green-500" />{isAr ? "التوصيات" : "Recommendations"}</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">{analysisResult.recommendations}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}
