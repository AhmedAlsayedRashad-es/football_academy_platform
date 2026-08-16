import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Play, Search, Star, Zap, Target, Brain, Shield, Dumbbell,
  ChevronRight, Eye, Clock, TrendingUp, Sparkles, Filter,
  Video, BookOpen, Award, ArrowLeft, ExternalLink
} from "lucide-react";
import { useLocation } from "wouter";

// ─── Skill Categories ────────────────────────────────────────────────────────
const SKILL_CATEGORIES = [
  { id: "all",           label: "All Videos",        labelAr: "جميع الفيديوهات",  icon: Video,    color: "bg-gray-500" },
  { id: "ball_control",  label: "Ball Control",       labelAr: "التحكم بالكرة",    icon: Target,   color: "bg-yellow-500" },
  { id: "passing",       label: "Passing",            labelAr: "التمرير",          icon: ChevronRight, color: "bg-blue-500" },
  { id: "shooting",      label: "Shooting",           labelAr: "التسديد",          icon: Zap,      color: "bg-red-500" },
  { id: "dribbling",     label: "Dribbling",          labelAr: "المراوغة",         icon: Star,     color: "bg-purple-500" },
  { id: "speed_agility", label: "Speed & Agility",    labelAr: "السرعة والرشاقة",  icon: Dumbbell, color: "bg-green-500" },
  { id: "positioning",   label: "Positioning",        labelAr: "التمركز",          icon: Brain,    color: "bg-indigo-500" },
  { id: "heading",       label: "Heading",            labelAr: "الكرة الرأسية",    icon: Shield,   color: "bg-orange-500" },
  { id: "fitness",       label: "Fitness",            labelAr: "اللياقة البدنية",  icon: Dumbbell, color: "bg-teal-500" },
  { id: "tactical",      label: "Tactical",           labelAr: "التكتيك",          icon: Brain,    color: "bg-pink-500" },
  { id: "goalkeeping",   label: "Goalkeeping",        labelAr: "حراسة المرمى",     icon: Shield,   color: "bg-cyan-500" },
];

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner:     "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",
  intermediate: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  advanced:     "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
};

// ─── Demo videos (shown when DB is empty) ────────────────────────────────────
const DEMO_VIDEOS = [
  { id: 1, title: "Ball Mastery — 10 Essential Drills", titleAr: "إتقان الكرة — 10 تمارين أساسية", category: "ball_control", difficulty: "beginner", duration: 900, viewCount: 1240, videoUrl: "https://www.youtube.com/watch?v=el7QvVnprOk", thumbnailUrl: null, description: "Master the fundamentals of ball control with these 10 essential drills used by professional academies worldwide.", tags: '["beginner","ball","control"]' },
  { id: 2, title: "Advanced Dribbling Techniques", titleAr: "تقنيات المراوغة المتقدمة", category: "dribbling", difficulty: "advanced", duration: 1200, viewCount: 890, videoUrl: "https://www.youtube.com/watch?v=Hs4ByFF_AE0", thumbnailUrl: null, description: "Learn advanced dribbling moves including the Cruyff turn, elastico, and step-over combinations.", tags: '["advanced","dribbling","moves"]' },
  { id: 3, title: "Shooting Power & Accuracy", titleAr: "قوة ودقة التسديد", category: "shooting", difficulty: "intermediate", duration: 1200, viewCount: 2100, videoUrl: "https://www.youtube.com/watch?v=bHGW2apqfEE", thumbnailUrl: null, description: "Develop powerful and accurate shooting technique with proper body mechanics and follow-through.", tags: '["shooting","power","accuracy"]' },
  { id: 4, title: "Short & Long Passing Fundamentals", titleAr: "أساسيات التمرير القصير والطويل", category: "passing", difficulty: "beginner", duration: 900, viewCount: 1560, videoUrl: "https://www.youtube.com/watch?v=-V88Iy1X-is", thumbnailUrl: null, description: "Master both short and long passing with correct technique, weight, and timing.", tags: '["passing","technique","fundamentals"]' },
  { id: 5, title: "Speed & Agility Ladder Drills", titleAr: "تمارين السرعة والرشاقة بالسلم", category: "speed_agility", difficulty: "intermediate", duration: 900, viewCount: 3200, videoUrl: "https://www.youtube.com/watch?v=jwIHc9rz7yo", thumbnailUrl: null, description: "Improve your speed, agility, and coordination with these ladder and cone drills.", tags: '["speed","agility","fitness"]' },
  { id: 6, title: "Tactical Positioning — Attacking Phase", titleAr: "التمركز التكتيكي — مرحلة الهجوم", category: "tactical", difficulty: "advanced", duration: 1500, viewCount: 780, videoUrl: "https://www.youtube.com/watch?v=uBlSzlbvsvo", thumbnailUrl: null, description: "Understand attacking positioning, movement patterns, and creating space in the final third.", tags: '["tactical","positioning","attacking"]' },
  { id: 7, title: "Heading Technique & Timing", titleAr: "تقنية وتوقيت الكرة الرأسية", category: "heading", difficulty: "intermediate", duration: 720, viewCount: 650, videoUrl: "https://www.youtube.com/watch?v=bHGW2apqfEE", thumbnailUrl: null, description: "Learn proper heading technique, timing your jump, and directing headers on goal.", tags: '["heading","aerial","timing"]' },
  { id: 8, title: "Goalkeeper Footwork & Distribution", titleAr: "حركة قدم الحارس وتوزيع الكرة", category: "goalkeeping", difficulty: "intermediate", duration: 1800, viewCount: 420, videoUrl: "https://www.youtube.com/watch?v=TviVDUBTQVU", thumbnailUrl: null, description: "Essential goalkeeper footwork patterns and distribution techniques for modern goalkeepers.", tags: '["goalkeeping","footwork","distribution"]' },
  { id: 9, title: "Fitness & Endurance Training", titleAr: "تدريب اللياقة والتحمل", category: "fitness", difficulty: "beginner", duration: 900, viewCount: 1890, videoUrl: "https://www.youtube.com/watch?v=jwIHc9rz7yo", thumbnailUrl: null, description: "Build your aerobic base and football-specific endurance with these training protocols.", tags: '["fitness","endurance","conditioning"]' },
  { id: 10, title: "Weak Foot Training Program", titleAr: "برنامج تدريب القدم الضعيفة", category: "ball_control", difficulty: "intermediate", duration: 1080, viewCount: 2340, videoUrl: "https://www.youtube.com/watch?v=el7QvVnprOk", thumbnailUrl: null, description: "A structured 4-week program to develop your weaker foot and become truly two-footed.", tags: '["weak_foot","two_footed","development"]' },
  { id: 11, title: "Defensive Positioning & Tackling", titleAr: "التمركز الدفاعي والتدخل", category: "positioning", difficulty: "intermediate", duration: 1200, viewCount: 970, videoUrl: "https://www.youtube.com/watch?v=LR9ifmPXGhI", thumbnailUrl: null, description: "Master defensive positioning, jockeying, and timing your tackles effectively.", tags: '["defending","positioning","tackling"]' },
  { id: 12, title: "First Touch Mastery", titleAr: "إتقان اللمسة الأولى", category: "ball_control", difficulty: "beginner", duration: 900, viewCount: 1670, videoUrl: "https://www.youtube.com/watch?v=el7QvVnprOk", thumbnailUrl: null, description: "Develop a reliable first touch in all directions and under pressure with these progressive drills.", tags: '["first_touch","control","receiving"]' },
  { id: 13, title: "High Pressing — Tactical Masterclass", titleAr: "الضغط العالي — درس تكتيكي", category: "tactical", difficulty: "advanced", duration: 1500, viewCount: 1434, videoUrl: "https://www.youtube.com/watch?v=uBlSzlbvsvo", thumbnailUrl: null, description: "Learn how to implement a high press system with pressing triggers and compactness.", tags: '["pressing","tactical","advanced"]' },
  { id: 14, title: "Positional Play Principles", titleAr: "مبادئ اللعب الموضعي", category: "tactical", difficulty: "advanced", duration: 1800, viewCount: 1143, videoUrl: "https://www.youtube.com/watch?v=uBlSzlbvsvo", thumbnailUrl: null, description: "Understand positional play, third-man combinations, and creating overloads in key zones.", tags: '["tactical","positional_play","possession"]' },
  { id: 15, title: "1v1 Attacking Moves & Feints", titleAr: "حركات هجومية وخدع 1 ضد 1", category: "dribbling", difficulty: "intermediate", duration: 1200, viewCount: 823, videoUrl: "https://www.youtube.com/watch?v=jwIHc9rz7yo", thumbnailUrl: null, description: "Learn the best 1v1 moves and feints to beat defenders in tight spaces.", tags: '["dribbling","1v1","feints"]' },
  { id: 16, title: "Tiki-Taka Passing Combinations", titleAr: "توليفات التمرير بأسلوب تيكي-تاكا", category: "tactical", difficulty: "advanced", duration: 1380, viewCount: 646, videoUrl: "https://www.youtube.com/watch?v=9aHmBjWdRIk", thumbnailUrl: null, description: "Master the tiki-taka style with quick one-touch passing combinations in tight spaces.", tags: '["passing","tiki_taka","tactical"]' },
  { id: 17, title: "Defensive Shape & Compactness", titleAr: "الشكل الدفاعي والتماسك", category: "tactical", difficulty: "advanced", duration: 1560, viewCount: 702, videoUrl: "https://www.youtube.com/watch?v=uBlSzlbvsvo", thumbnailUrl: null, description: "How to maintain defensive shape, compactness, and block spaces as a unit.", tags: '["defending","shape","tactical"]' },
  { id: 18, title: "Corner Kick Routines & Set Pieces", titleAr: "روتينات الركنيات والكرات الثابتة", category: "tactical", difficulty: "intermediate", duration: 840, viewCount: 1030, videoUrl: "https://www.youtube.com/watch?v=9aHmBjWdRIk", thumbnailUrl: null, description: "Professional corner kick routines and set piece strategies used by top clubs.", tags: '["set_pieces","corners","tactical"]' },
  { id: 19, title: "Counter-Attack Transitions", titleAr: "الانتقال للهجمة المرتدة", category: "tactical", difficulty: "advanced", duration: 1500, viewCount: 796, videoUrl: "https://www.youtube.com/watch?v=uBlSzlbvsvo", thumbnailUrl: null, description: "Master the art of counter-attacking transitions from defense to attack.", tags: '["counter_attack","transition","tactical"]' },
  { id: 20, title: "4-3-3 Formation Attacking Movements", titleAr: "تشكيل 4-3-3 الحركات الهجومية", category: "tactical", difficulty: "advanced", duration: 1560, viewCount: 302, videoUrl: "https://www.youtube.com/watch?v=uBlSzlbvsvo", thumbnailUrl: null, description: "Understand the attacking movements, rotations, and overloads in a 4-3-3 formation.", tags: '["tactical","formation","attacking"]' },
];

// ─── Skill score → category weakness map ─────────────────────────────────────
function getWeakCategories(skillScore: any): string[] {
  if (!skillScore) return [];
  const map: Record<string, number> = {
    ball_control:  skillScore.ballControl  ?? 50,
    passing:       skillScore.passing      ?? 50,
    shooting:      skillScore.shooting     ?? 50,
    dribbling:     skillScore.dribbling    ?? 50,
    speed_agility: Math.round(((skillScore.speed ?? 50) + (skillScore.agility ?? 50)) / 2),
    positioning:   skillScore.positioning  ?? 50,
    heading:       skillScore.heading      ?? 50,
    fitness:       skillScore.stamina      ?? 50,
    tactical:      skillScore.decisionMaking ?? 50,
  };
  return Object.entries(map)
    .filter(([, v]) => v < 65)
    .sort(([, a], [, b]) => a - b)
    .map(([k]) => k);
}

// ─── Video Card ───────────────────────────────────────────────────────────────
function VideoCard({ video, onPlay, recommended, reason }: {
  video: any; onPlay: (v: any) => void; recommended?: boolean; reason?: string;
}) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const title = (isRTL && video.titleAr) ? video.titleAr : video.title;
  const cat = SKILL_CATEGORIES.find(c => c.id === video.category);
  const mins = video.duration ? Math.floor(video.duration / 60) : null;

  return (
    <div
      onClick={() => onPlay(video)}
      className={`group relative rounded-xl border cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${
        recommended
          ? "border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-500/60"
          : "border-border bg-card hover:border-primary/40"
      }`}
    >
      {/* Thumbnail / Placeholder */}
      <div className="relative h-36 rounded-t-xl overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${cat?.color ?? "bg-gray-500"} bg-opacity-20`}>
            {cat ? <cat.icon className="w-12 h-12 opacity-30" /> : <Video className="w-12 h-12 opacity-30" />}
          </div>
        )}
        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-black ml-0.5" />
          </div>
        </div>
        {/* Duration badge */}
        {mins && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
            {mins}m
          </div>
        )}
        {/* Recommended badge */}
        {recommended && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
            <Sparkles className="w-3 h-3" /> AI Pick
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold leading-tight line-clamp-2">{title}</h3>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1.5">
          {video.difficulty && (
            <span className={`text-xs px-1.5 py-0.5 rounded border ${DIFFICULTY_COLORS[video.difficulty] ?? ""}`}>
              {video.difficulty}
            </span>
          )}
          {cat && (
            <span className="text-xs text-muted-foreground">{isRTL ? cat.labelAr : cat.label}</span>
          )}
          {video.viewCount != null && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5 ml-auto">
              <Eye className="w-3 h-3" /> {video.viewCount.toLocaleString()}
            </span>
          )}
        </div>
        {reason && (
          <p className="text-xs text-yellow-700 dark:text-yellow-500 mt-1.5 flex items-center gap-1">
            <TrendingUp className="w-3 h-3 shrink-0" /> {reason}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SkillsVideos() {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [, navigate] = useLocation();

  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [playingVideo, setPlayingVideo] = useState<any>(null);
  const [showRecommendedOnly, setShowRecommendedOnly] = useState(false);

  // Fetch published videos from DB (fallback to demo)
  const { data: dbVideos = [], isLoading: videosLoading } = trpc.trainingVideos.getPublished.useQuery(undefined);
  const videos = dbVideos.length > 0 ? dbVideos : DEMO_VIDEOS;

  // Fetch AI recommendations
  const { data: aiData, isLoading: aiLoading } = trpc.trainingVideos.getAIRecommendations.useQuery(
    { playerId: undefined },
    { retry: false }
  );
  const aiRecommendations = aiData?.recommendations ?? [];
  const skillProfile = aiData?.skillProfile;
  const weakCategories = getWeakCategories(skillProfile);
  const recommendedIds = new Set(aiRecommendations.map((r: any) => r.id));

  // Filter logic
  const filteredVideos = useMemo(() => {
    let list = showRecommendedOnly
      ? videos.filter(v => recommendedIds.has(v.id))
      : videos;

    if (activeCategory !== "all") {
      list = list.filter(v => v.category === activeCategory);
    }
    if (difficulty !== "all") {
      list = list.filter(v => v.difficulty === difficulty);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(v =>
        v.title?.toLowerCase().includes(q) ||
        v.titleAr?.toLowerCase().includes(q) ||
        v.description?.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [videos, activeCategory, difficulty, searchQuery, showRecommendedOnly, recommendedIds]);

  // Stats
  const totalVideos = videos.length;
  const totalMinutes = Math.round(videos.reduce((s, v) => s + (v.duration ?? 0), 0) / 60);

  // Get YouTube embed URL
  const getEmbedUrl = (url: string) => {
    if (!url) return null;
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    return url;
  };

  return (
    <>
      <div className="p-4 md:p-6 max-w-7xl mx-auto" dir={isRTL ? "rtl" : "ltr"}>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/training")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Video className="w-6 h-6 text-primary" />
              {isRTL ? "مكتبة فيديوهات المهارات" : "Skills Video Library"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isRTL
                ? "فيديوهات تدريبية مصنّفة حسب المهارة + توصيات الذكاء الاصطناعي بناءً على تقاريرك"
                : "Categorized training videos + AI recommendations based on your reports & assessments"}
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: Video,    label: isRTL ? "إجمالي الفيديوهات" : "Total Videos",        value: totalVideos },
            { icon: Clock,    label: isRTL ? "إجمالي الدقائق"    : "Total Minutes",        value: `${totalMinutes}m` },
            { icon: Sparkles, label: isRTL ? "توصيات الذكاء"     : "AI Recommendations",   value: aiRecommendations.length },
            { icon: TrendingUp, label: isRTL ? "مجالات للتحسين"  : "Areas to Improve",     value: weakCategories.length },
          ].map(({ icon: Icon, label, value }) => (
            <Card key={label} className="p-3">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-primary shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-bold">{value}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* AI Skill Profile Banner */}
        {skillProfile && weakCategories.length > 0 && (
          <Card className="mb-6 border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-yellow-700 dark:text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-700 dark:text-yellow-500 mb-2">
                    {isRTL ? "توصيات الذكاء الاصطناعي بناءً على تقييمك" : "AI Recommendations Based on Your Assessment"}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {isRTL
                      ? `تم تحديد ${weakCategories.length} مجالات تحتاج إلى تحسين. الفيديوهات المُوصى بها مُعلَّمة بـ "AI Pick"`
                      : `${weakCategories.length} skill areas identified for improvement. Recommended videos are marked with "AI Pick"`}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {weakCategories.slice(0, 4).map(cat => {
                      const catInfo = SKILL_CATEGORIES.find(c => c.id === cat);
                      const score = (() => {
                        const m: Record<string, number> = {
                          ball_control: skillProfile.ballControl ?? 50,
                          passing: skillProfile.passing ?? 50,
                          shooting: skillProfile.shooting ?? 50,
                          dribbling: skillProfile.dribbling ?? 50,
                          speed_agility: Math.round(((skillProfile.speed ?? 50) + (skillProfile.agility ?? 50)) / 2),
                          positioning: skillProfile.positioning ?? 50,
                          heading: skillProfile.heading ?? 50,
                          fitness: skillProfile.stamina ?? 50,
                          tactical: skillProfile.decisionMaking ?? 50,
                        };
                        return m[cat] ?? 50;
                      })();
                      return (
                        <div key={cat} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{isRTL ? catInfo?.labelAr : catInfo?.label}</span>
                            <span className="text-yellow-700 dark:text-yellow-500 font-bold">{score}/100</span>
                          </div>
                          <Progress value={score} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 border-yellow-500/40 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-500/10"
                    onClick={() => setShowRecommendedOnly(!showRecommendedOnly)}
                  >
                    <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                    {showRecommendedOnly
                      ? (isRTL ? "عرض جميع الفيديوهات" : "Show All Videos")
                      : (isRTL ? "عرض التوصيات فقط" : "Show Recommended Only")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isRTL ? "ابحث عن فيديو..." : "Search videos..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-full md:w-44">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              <SelectValue placeholder={isRTL ? "المستوى" : "Difficulty"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "جميع المستويات" : "All Levels"}</SelectItem>
              <SelectItem value="beginner">{isRTL ? "مبتدئ" : "Beginner"}</SelectItem>
              <SelectItem value="intermediate">{isRTL ? "متوسط" : "Intermediate"}</SelectItem>
              <SelectItem value="advanced">{isRTL ? "متقدم" : "Advanced"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
          {SKILL_CATEGORIES.map(cat => {
            const isWeak = weakCategories.includes(cat.id);
            const count = cat.id === "all" ? videos.length : videos.filter(v => v.category === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : isWeak
                    ? "border-yellow-500/40 text-yellow-700 dark:text-yellow-500 hover:bg-yellow-500/10"
                    : "border-border hover:border-primary/40 hover:bg-muted"
                }`}
              >
                <cat.icon className="w-3.5 h-3.5" />
                {isRTL ? cat.labelAr : cat.label}
                {count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeCategory === cat.id ? "bg-white/20" : "bg-muted"
                  }`}>
                    {count}
                  </span>
                )}
                {isWeak && cat.id !== "all" && (
                  <TrendingUp className="w-3 h-3 text-yellow-700 dark:text-yellow-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* AI Recommended Section (shown when not filtering) */}
        {!showRecommendedOnly && activeCategory === "all" && !searchQuery && aiRecommendations.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-yellow-700 dark:text-yellow-500" />
              <h2 className="font-semibold text-yellow-700 dark:text-yellow-500">
                {isRTL ? "موصى به لك بالذكاء الاصطناعي" : "AI Recommended for You"}
              </h2>
              <Badge variant="outline" className="border-yellow-500/40 text-yellow-700 dark:text-yellow-500 text-xs">
                {isRTL ? "بناءً على تقييمك" : "Based on your assessment"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {aiRecommendations.slice(0, 4).map((video: any) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onPlay={setPlayingVideo}
                  recommended
                  reason={video.reason}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Video Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">
              {showRecommendedOnly
                ? (isRTL ? "الفيديوهات الموصى بها" : "Recommended Videos")
                : activeCategory === "all"
                ? (isRTL ? "جميع الفيديوهات" : "All Videos")
                : (isRTL
                  ? SKILL_CATEGORIES.find(c => c.id === activeCategory)?.labelAr
                  : SKILL_CATEGORIES.find(c => c.id === activeCategory)?.label)}
            </h2>
            <span className="text-sm text-muted-foreground">
              {filteredVideos.length} {isRTL ? "فيديو" : "videos"}
            </span>
          </div>

          {videosLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Video className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{isRTL ? "لا توجد فيديوهات" : "No videos found"}</p>
              <p className="text-sm mt-1">
                {isRTL ? "جرّب تغيير الفلتر أو البحث" : "Try changing the filter or search query"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredVideos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onPlay={setPlayingVideo}
                  recommended={recommendedIds.has(video.id)}
                  reason={aiRecommendations.find((r: any) => r.id === video.id)?.reason}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upload CTA for coaches */}
        <Card className="mt-8 border-dashed">
          <CardContent className="p-6 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="font-medium text-muted-foreground">
              {isRTL ? "هل أنت مدرب؟ أضف فيديوهات تدريبية للمكتبة" : "Are you a coach? Add training videos to the library"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => navigate("/video-clip-library")}
            >
              <Video className="w-3.5 h-3.5 mr-1.5" />
              {isRTL ? "إدارة الفيديوهات" : "Manage Videos"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Video Player Dialog */}
      <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="text-base">
              {playingVideo && ((isRTL && playingVideo.titleAr) ? playingVideo.titleAr : playingVideo?.title)}
            </DialogTitle>
          </DialogHeader>
          {playingVideo && (
            <div className="p-4 pt-3">
              {/* Video Player */}
              <div className="aspect-video rounded-lg overflow-hidden bg-black mb-3">
                {getEmbedUrl(playingVideo.videoUrl) ? (
                  <iframe
                    src={getEmbedUrl(playingVideo.videoUrl)!}
                    className="w-full h-full"
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <Play className="w-12 h-12" />
                  </div>
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 flex-wrap text-sm text-muted-foreground mb-3">
                {playingVideo.difficulty && (
                  <span className={`px-2 py-0.5 rounded border text-xs ${DIFFICULTY_COLORS[playingVideo.difficulty]}`}>
                    {playingVideo.difficulty}
                  </span>
                )}
                {playingVideo.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {Math.floor(playingVideo.duration / 60)}m {playingVideo.duration % 60}s
                  </span>
                )}
                {playingVideo.viewCount != null && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {playingVideo.viewCount.toLocaleString()} views
                  </span>
                )}
                <a
                  href={playingVideo.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-auto flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {isRTL ? "فتح في YouTube" : "Open in YouTube"}
                </a>
              </div>

              {/* Description */}
              {playingVideo.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {playingVideo.description}
                </p>
              )}

              {/* AI Reason */}
              {recommendedIds.has(playingVideo.id) && (
                <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <p className="text-xs text-yellow-700 dark:text-yellow-500 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <strong>{isRTL ? "لماذا هذا الفيديو؟" : "Why this video?"}</strong>
                    {" "}
                    {aiRecommendations.find((r: any) => r.id === playingVideo.id)?.reason}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
