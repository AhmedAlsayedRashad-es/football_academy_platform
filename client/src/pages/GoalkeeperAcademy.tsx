import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  Shield, Target, Zap, Brain, TrendingUp, Award, Clock,
  Users, Play, Star, ChevronDown, ChevronUp, Loader2,
  BarChart3, Activity, Crosshair, Hand, Eye, Footprints
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface GKDrill {
  id: string;
  title: string;
  titleAr: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "pro";
  duration: number;
  players: string;
  equipment: string[];
  description: string;
  descriptionAr: string;
  coachingPoints: string[];
  coachingPointsAr: string[];
}

interface GKEvaluation {
  playerId: string;
  playerName: string;
  date: string;
  shotStopping: number;
  distribution: number;
  commanding: number;
  positioning: number;
  reflexes: number;
  oneOnOne: number;
  aerialAbility: number;
  communication: number;
  footwork: number;
  decisionMaking: number;
  notes: string;
}

// ─── GK Drills Database ──────────────────────────────────────────────────────
const GK_DRILLS: GKDrill[] = [
  {
    id: "gk-1", title: "Shot-Stopping: Low Dives", titleAr: "إيقاف التسديدات: الغطسات المنخفضة",
    category: "shot-stopping", difficulty: "beginner", duration: 15, players: "1-2",
    equipment: ["Balls (6-8)", "Cones", "Goal"],
    description: "Practice diving low to both sides. Server shoots low to corners. Focus on correct diving technique, hand positioning, and recovery.",
    descriptionAr: "تدريب الغطس المنخفض لكلا الجانبين. المُمرر يسدد منخفضاً للزوايا. التركيز على تقنية الغطس الصحيحة ووضع اليدين والتعافي.",
    coachingPoints: ["Lead with near hand", "Get body behind the ball", "Land on side, not stomach", "Quick recovery to feet"],
    coachingPointsAr: ["قُد باليد القريبة", "ضع جسمك خلف الكرة", "انزل على جانبك وليس بطنك", "تعافَ سريعاً للوقوف"]
  },
  {
    id: "gk-2", title: "Shot-Stopping: High Balls", titleAr: "إيقاف التسديدات: الكرات العالية",
    category: "shot-stopping", difficulty: "intermediate", duration: 15, players: "1-2",
    equipment: ["Balls (6-8)", "Goal"],
    description: "Practice catching and tipping high shots over the bar. Focus on footwork to get into position, W-grip, and decision to catch vs tip.",
    descriptionAr: "تدريب مسك وتحويل التسديدات العالية فوق العارضة. التركيز على حركة الأقدام للوصول للموقع وقبضة W وقرار المسك أو التحويل.",
    coachingPoints: ["W-shape hand grip", "Attack the ball at highest point", "Tip over with strong wrist", "Communicate 'AWAY' or 'MINE'"],
    coachingPointsAr: ["قبضة W", "هاجم الكرة في أعلى نقطة", "حوّل بمعصم قوي", "تواصل 'بعيد' أو 'لي'"]
  },
  {
    id: "gk-3", title: "1v1 Situations", titleAr: "مواقف 1 ضد 1",
    category: "1v1", difficulty: "advanced", duration: 20, players: "2-3",
    equipment: ["Balls", "Cones", "Goal"],
    description: "Practice narrowing the angle in 1v1 situations. When to stay, when to rush out, spread technique, and reading attacker's body.",
    descriptionAr: "تدريب تضييق الزاوية في مواقف 1 ضد 1. متى تبقى ومتى تندفع وتقنية الانتشار وقراءة جسم المهاجم.",
    coachingPoints: ["Stay big as long as possible", "Set position before attacker shoots", "Spread technique: lead with hands", "Read the attacker's hips, not the ball"],
    coachingPointsAr: ["ابقَ كبيراً أطول وقت ممكن", "ثبّت موقعك قبل أن يسدد المهاجم", "تقنية الانتشار: قُد بيديك", "اقرأ وركي المهاجم وليس الكرة"]
  },
  {
    id: "gk-4", title: "Distribution: Short & Long", titleAr: "التوزيع: قصير وطويل",
    category: "distribution", difficulty: "intermediate", duration: 15, players: "3-4",
    equipment: ["Balls", "Cones", "Bibs"],
    description: "Practice all distribution methods: rolling, throwing (overarm/sidearm), goal kicks, and playing out from the back with feet.",
    descriptionAr: "تدريب كل طرق التوزيع: الدحرجة والرمي (فوق/جانبي) وركلات المرمى واللعب من الخلف بالأقدام.",
    coachingPoints: ["Quick distribution to start counter", "Accuracy over distance", "Use overarm for distance, sidearm for speed", "Build-up: play to free player"],
    coachingPointsAr: ["توزيع سريع لبدء الهجمة المرتدة", "الدقة أهم من المسافة", "فوق الذراع للمسافة وجانبي للسرعة", "البناء: العب للاعب الحر"]
  },
  {
    id: "gk-5", title: "Crosses & Aerial Dominance", titleAr: "العرضيات والسيطرة الجوية",
    category: "crosses", difficulty: "advanced", duration: 20, players: "4-6",
    equipment: ["Balls", "Cones", "Goal", "Bibs"],
    description: "Practice claiming crosses under pressure. Decision-making: punch, catch, or stay. Communication with defenders.",
    descriptionAr: "تدريب الاستحواذ على العرضيات تحت الضغط. اتخاذ القرار: لكم أو مسك أو البقاء. التواصل مع المدافعين.",
    coachingPoints: ["Call early and loud: KEEPER or AWAY", "Attack the ball, don't wait", "Punch high and wide when in doubt", "Take off from one foot for height"],
    coachingPointsAr: ["نادِ مبكراً وبصوت عالٍ: حارس أو بعيد", "هاجم الكرة ولا تنتظر", "الكم عالياً وبعيداً عند الشك", "اقفز من قدم واحدة للارتفاع"]
  },
  {
    id: "gk-6", title: "Footwork & Positioning", titleAr: "حركة الأقدام والتمركز",
    category: "positioning", difficulty: "beginner", duration: 12, players: "1",
    equipment: ["Cones", "Balls", "Goal"],
    description: "Shuffle drills along the goal line. Practice getting set before the shot. Arc positioning relative to ball position.",
    descriptionAr: "تمارين التحرك على خط المرمى. تدريب التجهز قبل التسديدة. التمركز القوسي بالنسبة لموقع الكرة.",
    coachingPoints: ["Small quick steps, stay on toes", "Set position before shot", "Bisect the angle from ball to goal", "Never cross feet when shuffling"],
    coachingPointsAr: ["خطوات صغيرة سريعة على الأصابع", "ثبّت موقعك قبل التسديدة", "اقسم الزاوية من الكرة للمرمى", "لا تقاطع قدميك أثناء التحرك"]
  },
  {
    id: "gk-7", title: "Reaction Saves & Reflexes", titleAr: "التصديات الانعكاسية وردود الفعل",
    category: "reflexes", difficulty: "pro", duration: 15, players: "2-3",
    equipment: ["Balls (10+)", "Cones", "Goal", "Rebound Board"],
    description: "Rapid-fire shots from close range. Deflections, double saves, and reaction to unexpected ball direction. Builds lightning reflexes.",
    descriptionAr: "تسديدات سريعة متتالية من مسافة قريبة. انحرافات وتصديات مزدوجة ورد فعل لاتجاه غير متوقع. يبني ردود فعل خاطفة.",
    coachingPoints: ["Stay balanced, ready position", "React to the ball, not the shooter", "Use any body part to save", "Reset quickly between shots"],
    coachingPointsAr: ["ابقَ متوازناً في وضع الاستعداد", "تفاعل مع الكرة وليس المسدد", "استخدم أي جزء من جسمك للتصدي", "أعد ضبط نفسك سريعاً بين التسديدات"]
  },
  {
    id: "gk-8", title: "Penalty Saving Technique", titleAr: "تقنية صد ركلات الجزاء",
    category: "penalties", difficulty: "advanced", duration: 15, players: "2-4",
    equipment: ["Balls", "Goal"],
    description: "Practice penalty saving: reading body language, delayed dive, staying big, and psychological tactics.",
    descriptionAr: "تدريب صد ركلات الجزاء: قراءة لغة الجسد والغطس المتأخر والبقاء كبيراً والتكتيكات النفسية.",
    coachingPoints: ["Watch the hips, not the eyes", "Delay dive as long as possible", "Stay big and central initially", "Dive at 45 degrees, not flat"],
    coachingPointsAr: ["راقب الوركين وليس العيون", "أخّر الغطس أطول وقت ممكن", "ابقَ كبيراً ومركزياً في البداية", "اغطس بزاوية 45 درجة وليس مسطحاً"]
  },
  {
    id: "gk-9", title: "Playing Out from the Back", titleAr: "اللعب من الخلف",
    category: "distribution", difficulty: "pro", duration: 20, players: "5-6",
    equipment: ["Balls", "Cones", "Bibs", "Goal"],
    description: "Practice building from the back under high press. GK as sweeper-keeper, short passing options, and when to go long.",
    descriptionAr: "تدريب البناء من الخلف تحت ضغط عالٍ. الحارس كمنظف، خيارات التمرير القصير، ومتى تلعب طويلاً.",
    coachingPoints: ["Create passing triangles with CBs", "First touch away from pressure", "Know when to go long (safety first)", "Communicate constantly with defenders"],
    coachingPointsAr: ["اصنع مثلثات تمرير مع قلبي الدفاع", "اللمسة الأولى بعيداً عن الضغط", "اعرف متى تلعب طويلاً (الأمان أولاً)", "تواصل باستمرار مع المدافعين"]
  },
  {
    id: "gk-10", title: "GK Fitness & Agility", titleAr: "لياقة ورشاقة الحارس",
    category: "physical", difficulty: "intermediate", duration: 20, players: "1-2",
    equipment: ["Agility Ladder", "Cones", "Hurdles", "Balls"],
    description: "GK-specific fitness: lateral agility, explosive jumps, quick feet patterns, and recovery sprints between saves.",
    descriptionAr: "لياقة خاصة بالحارس: رشاقة جانبية وقفزات انفجارية وأنماط أقدام سريعة وعدوات تعافي بين التصديات.",
    coachingPoints: ["Explosive first step is everything", "Low center of gravity in ready position", "Quick feet through ladder then SAVE", "Recover to starting position fast"],
    coachingPointsAr: ["الخطوة الأولى الانفجارية هي كل شيء", "مركز ثقل منخفض في وضع الاستعداد", "أقدام سريعة عبر السلم ثم تصدي", "تعافَ لموقع البداية بسرعة"]
  }
];

const GK_CATEGORIES = [
  { id: "all", label: "All Drills", labelAr: "كل التمارين", icon: Shield },
  { id: "shot-stopping", label: "Shot Stopping", labelAr: "إيقاف التسديدات", icon: Hand },
  { id: "1v1", label: "1v1 Situations", labelAr: "مواقف 1ضد1", icon: Crosshair },
  { id: "distribution", label: "Distribution", labelAr: "التوزيع", icon: Target },
  { id: "crosses", label: "Crosses", labelAr: "العرضيات", icon: Zap },
  { id: "positioning", label: "Positioning", labelAr: "التمركز", icon: Eye },
  { id: "reflexes", label: "Reflexes", labelAr: "ردود الفعل", icon: Activity },
  { id: "penalties", label: "Penalties", labelAr: "ركلات الجزاء", icon: Crosshair },
  { id: "physical", label: "GK Fitness", labelAr: "لياقة الحارس", icon: Footprints },
];

// ─── Component ───────────────────────────────────────────────────────────────
export default function GoalkeeperAcademy() {
  const { language } = useLanguage();
  const isAr = language === "ar";

  const [activeTab, setActiveTab] = useState("drills");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedDrill, setExpandedDrill] = useState<string | null>(null);

  // Evaluation state
  const [evalPlayerName, setEvalPlayerName] = useState("");
  const [evalDate, setEvalDate] = useState(new Date().toISOString().split("T")[0]);
  const [evalScores, setEvalScores] = useState({
    shotStopping: 7, distribution: 6, commanding: 7, positioning: 7,
    reflexes: 7, oneOnOne: 6, aerialAbility: 6, communication: 7,
    footwork: 6, decisionMaking: 7
  });
  const [evalNotes, setEvalNotes] = useState("");
  const [savedEvaluations, setSavedEvaluations] = useState<GKEvaluation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");

  const aiChat = trpc.ai.chat.useMutation();

  const filteredDrills = GK_DRILLS.filter(d =>
    selectedCategory === "all" || d.category === selectedCategory
  );

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "intermediate": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "advanced": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "pro": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "";
    }
  };

  const getDifficultyLabel = (d: string) => {
    if (isAr) {
      switch (d) { case "beginner": return "مبتدئ"; case "intermediate": return "متوسط"; case "advanced": return "متقدم"; case "pro": return "احترافي"; default: return d; }
    }
    return d.charAt(0).toUpperCase() + d.slice(1);
  };

  const saveEvaluation = () => {
    if (!evalPlayerName) { toast.error(isAr ? "أدخل اسم الحارس" : "Enter goalkeeper name"); return; }
    const evaluation: GKEvaluation = {
      playerId: `gk-${Date.now()}`,
      playerName: evalPlayerName,
      date: evalDate,
      ...evalScores,
      notes: evalNotes
    };
    setSavedEvaluations([evaluation, ...savedEvaluations]);
    toast.success(isAr ? "تم حفظ التقييم!" : "Evaluation saved!");
  };

  const getAIAnalysis = async () => {
    if (!evalPlayerName) { toast.error(isAr ? "أدخل اسم الحارس أولاً" : "Enter goalkeeper name first"); return; }
    setIsAnalyzing(true);
    try {
      const prompt = isAr
        ? `أنت مدرب حراس مرمى محترف. حلل أداء الحارس "${evalPlayerName}" بناءً على التقييمات التالية (من 10):
إيقاف التسديدات: ${evalScores.shotStopping}/10
التوزيع: ${evalScores.distribution}/10
القيادة: ${evalScores.commanding}/10
التمركز: ${evalScores.positioning}/10
ردود الفعل: ${evalScores.reflexes}/10
مواقف 1ضد1: ${evalScores.oneOnOne}/10
القدرة الجوية: ${evalScores.aerialAbility}/10
التواصل: ${evalScores.communication}/10
حركة الأقدام: ${evalScores.footwork}/10
اتخاذ القرار: ${evalScores.decisionMaking}/10

قدم: 1) ملخص نقاط القوة 2) نقاط الضعف التي تحتاج تطوير 3) خطة تدريب مقترحة لمدة 4 أسابيع 4) تمارين محددة لتحسين نقاط الضعف. اكتب بالعربية.`
        : `You are a professional goalkeeper coach. Analyze goalkeeper "${evalPlayerName}" based on these ratings (out of 10):
Shot Stopping: ${evalScores.shotStopping}/10
Distribution: ${evalScores.distribution}/10
Commanding: ${evalScores.commanding}/10
Positioning: ${evalScores.positioning}/10
Reflexes: ${evalScores.reflexes}/10
1v1: ${evalScores.oneOnOne}/10
Aerial Ability: ${evalScores.aerialAbility}/10
Communication: ${evalScores.communication}/10
Footwork: ${evalScores.footwork}/10
Decision Making: ${evalScores.decisionMaking}/10

Provide: 1) Strengths summary 2) Weaknesses to develop 3) Suggested 4-week training plan 4) Specific drills to improve weaknesses.`;

      const result = await aiChat.mutateAsync({ message: prompt, currentPage: "goalkeeper evaluation" });
      // response can come back as structured content blocks rather than a string.
      setAiAnalysis(typeof result.response === "string" ? result.response : JSON.stringify(result.response ?? ""));
    } catch (err) {
      toast.error(isAr ? "خطأ في التحليل" : "Analysis error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const overallRating = Math.round(Object.values(evalScores).reduce((a, b) => a + b, 0) / 10 * 10) / 10;

  return (
    <>
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Shield className="w-7 h-7 text-yellow-700 dark:text-yellow-500" />
            {isAr ? "أكاديمية حراس المرمى" : "Goalkeeper Academy"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isAr ? "تدريبات متخصصة، تقييم أداء، وتحليل ذكي لحراس المرمى" : "Specialized drills, performance evaluation, and AI analysis for goalkeepers"}
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Shield className="w-4 h-4 mr-1" />
          {GK_DRILLS.length} {isAr ? "تمرين متخصص" : "specialized drills"}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="drills" className="gap-1"><Play className="w-3 h-3" />{isAr ? "التمارين" : "Drills"}</TabsTrigger>
          <TabsTrigger value="evaluation" className="gap-1"><BarChart3 className="w-3 h-3" />{isAr ? "التقييم" : "Evaluation"}</TabsTrigger>
          <TabsTrigger value="analysis" className="gap-1"><Brain className="w-3 h-3" />{isAr ? "تحليل AI" : "AI Analysis"}</TabsTrigger>
        </TabsList>

        {/* ═══════════════ TAB 1: GK Drills ═══════════════ */}
        <TabsContent value="drills" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-2">
            {GK_CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                className="gap-1"
              >
                <cat.icon className="w-3 h-3" />
                {isAr ? cat.labelAr : cat.label}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredDrills.map(drill => (
              <Card key={drill.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{isAr ? drill.titleAr : drill.title}</CardTitle>
                    <Badge className={getDifficultyColor(drill.difficulty)}>
                      {getDifficultyLabel(drill.difficulty)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {isAr ? drill.descriptionAr : drill.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{drill.duration} {isAr ? "دقيقة" : "min"}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{drill.players}</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {drill.equipment.map(eq => (
                      <Badge key={eq} variant="secondary" className="text-xs">{eq}</Badge>
                    ))}
                  </div>
                  <Button
                    variant="ghost" size="sm" className="w-full"
                    onClick={() => setExpandedDrill(expandedDrill === drill.id ? null : drill.id)}
                  >
                    {expandedDrill === drill.id ? <ChevronUp className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                    {isAr ? "نقاط تدريبية" : "Coaching Points"}
                  </Button>
                  {expandedDrill === drill.id && (
                    <div className="pt-2 border-t">
                      <ul className="space-y-1">
                        {(isAr ? drill.coachingPointsAr : drill.coachingPoints).map((point, i) => (
                          <li key={i} className="text-xs flex items-start gap-1">
                            <span className="text-yellow-700 dark:text-yellow-500 mt-0.5">★</span> {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══════════════ TAB 2: Evaluation ═══════════════ */}
        <TabsContent value="evaluation" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? "تقييم أداء الحارس" : "Goalkeeper Performance Evaluation"}</CardTitle>
              <CardDescription>{isAr ? "قيّم أداء الحارس في 10 مجالات رئيسية" : "Rate goalkeeper performance across 10 key areas"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>{isAr ? "اسم الحارس" : "Goalkeeper Name"}</Label>
                  <Input value={evalPlayerName} onChange={e => setEvalPlayerName(e.target.value)} placeholder={isAr ? "أدخل الاسم" : "Enter name"} />
                </div>
                <div>
                  <Label>{isAr ? "التاريخ" : "Date"}</Label>
                  <Input type="date" value={evalDate} onChange={e => setEvalDate(e.target.value)} />
                </div>
                <div className="flex items-end">
                  <div className="text-center w-full">
                    <p className="text-xs text-muted-foreground mb-1">{isAr ? "التقييم الإجمالي" : "Overall Rating"}</p>
                    <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-500">{overallRating}/10</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: "shotStopping", label: "Shot Stopping", labelAr: "إيقاف التسديدات", icon: Hand },
                  { key: "distribution", label: "Distribution", labelAr: "التوزيع", icon: Target },
                  { key: "commanding", label: "Commanding Area", labelAr: "السيطرة على المنطقة", icon: Shield },
                  { key: "positioning", label: "Positioning", labelAr: "التمركز", icon: Eye },
                  { key: "reflexes", label: "Reflexes", labelAr: "ردود الفعل", icon: Zap },
                  { key: "oneOnOne", label: "1v1 Ability", labelAr: "مواقف 1 ضد 1", icon: Crosshair },
                  { key: "aerialAbility", label: "Aerial Ability", labelAr: "القدرة الجوية", icon: TrendingUp },
                  { key: "communication", label: "Communication", labelAr: "التواصل", icon: Users },
                  { key: "footwork", label: "Footwork", labelAr: "حركة الأقدام", icon: Footprints },
                  { key: "decisionMaking", label: "Decision Making", labelAr: "اتخاذ القرار", icon: Brain },
                ].map(metric => (
                  <div key={metric.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs flex items-center gap-1">
                        <metric.icon className="w-3 h-3" />
                        {isAr ? metric.labelAr : metric.label}
                      </Label>
                      <span className="text-sm font-bold">{evalScores[metric.key as keyof typeof evalScores]}/10</span>
                    </div>
                    <input
                      type="range" min="1" max="10"
                      value={evalScores[metric.key as keyof typeof evalScores]}
                      onChange={e => setEvalScores({ ...evalScores, [metric.key]: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <Progress value={evalScores[metric.key as keyof typeof evalScores] * 10} className="h-1" />
                  </div>
                ))}
              </div>

              <div>
                <Label>{isAr ? "ملاحظات إضافية" : "Additional Notes"}</Label>
                <Textarea value={evalNotes} onChange={e => setEvalNotes(e.target.value)} placeholder={isAr ? "ملاحظات عن الأداء..." : "Performance notes..."} rows={3} />
              </div>

              <div className="flex gap-2">
                <Button onClick={saveEvaluation} className="gap-1"><Award className="w-4 h-4" />{isAr ? "حفظ التقييم" : "Save Evaluation"}</Button>
                <Button variant="outline" onClick={getAIAnalysis} disabled={isAnalyzing} className="gap-1">
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                  {isAr ? "تحليل AI وخطة تطوير" : "AI Analysis & Development Plan"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Saved Evaluations */}
          {savedEvaluations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isAr ? "التقييمات المحفوظة" : "Saved Evaluations"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedEvaluations.map(ev => (
                    <div key={ev.playerId} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium">{ev.playerName}</p>
                        <p className="text-xs text-muted-foreground">{ev.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-yellow-700 dark:text-yellow-500">
                          {(Math.round((ev.shotStopping + ev.distribution + ev.commanding + ev.positioning + ev.reflexes + ev.oneOnOne + ev.aerialAbility + ev.communication + ev.footwork + ev.decisionMaking) / 10 * 10) / 10)}/10
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══════════════ TAB 3: AI Analysis ═══════════════ */}
        <TabsContent value="analysis" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                {isAr ? "تحليل الذكاء الاصطناعي لحارس المرمى" : "AI Goalkeeper Analysis"}
              </CardTitle>
              <CardDescription>
                {isAr ? "أدخل تقييم الحارس في تبويب التقييم ثم اضغط 'تحليل AI' للحصول على خطة تطوير مخصصة" : "Enter GK evaluation in the Evaluation tab then click 'AI Analysis' for a personalized development plan"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {aiAnalysis ? (
                <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                  {aiAnalysis}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {isAr
                      ? "أدخل تقييم الحارس في تبويب 'التقييم' ثم اضغط 'تحليل AI وخطة تطوير'"
                      : "Enter goalkeeper evaluation in 'Evaluation' tab then click 'AI Analysis & Development Plan'"}
                  </p>
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
