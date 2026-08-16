import { useState, useMemo } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Search, Play, Clock, Users, Dumbbell, Target, Footprints,
  Shield, Zap, Brain, Star, BookOpen, X,
  ChevronDown, ChevronUp, Award, Crosshair, Youtube,
  CheckCircle, Video, UserPlus, Send
} from "lucide-react";
import { BackButton } from "@/components/BackButton";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";

interface Drill {
  id: string;
  title: string;
  titleAr: string;
  category: string;
  ageGroups: string[];
  difficulty: "beginner" | "intermediate" | "advanced" | "pro";
  duration: number;
  players: string;
  equipment: string[];
  description: string;
  descriptionAr: string;
  coachingPoints: string[];
  coachingPointsAr: string[];
  videoId: string;
}

const DRILLS_DATABASE: Drill[] = [
  {
    id: "pass-1", title: "Passing Drills — Speed & Accuracy", titleAr: "تمارين التمرير — السرعة والدقة",
    category: "passing", ageGroups: ["U10","U12","U14","U16","U18"], difficulty: "beginner", duration: 15, players: "3-6",
    equipment: ["Cones","Balls"],
    description: "Improve passing speed and accuracy with progressive drills. Focus on weight of pass, timing of run, and first touch angle.",
    descriptionAr: "حسّن سرعة ودقة التمرير بتمارين تدريجية. التركيز على قوة التمريرة وتوقيت الجري وزاوية اللمسة الأولى.",
    coachingPoints: ["Pass to feet, not space","Accelerate after the pass","Open body shape to receive","Communicate before passing"],
    coachingPointsAr: ["مرر للقدم وليس للفراغ","تسارع بعد التمريرة","افتح جسمك لاستقبال الكرة","تواصل قبل التمرير"],
    videoId: "-V88Iy1X-is"
  },
  {
    id: "pass-2", title: "Passing & 1st Touch Combinations", titleAr: "تمريرات وتوليفات اللمسة الأولى",
    category: "passing", ageGroups: ["U12","U14","U16","U18"], difficulty: "intermediate", duration: 20, players: "4-6",
    equipment: ["Cones","Balls","Bibs"],
    description: "Complex passing patterns with movement. Develops quick decision-making, body orientation, and passing accuracy under pressure.",
    descriptionAr: "أنماط تمرير معقدة مع الحركة. يطور سرعة اتخاذ القرار وتوجيه الجسم ودقة التمرير تحت الضغط.",
    coachingPoints: ["Always have 2 passing options","Move after passing","Body open to see all options","One-touch when possible"],
    coachingPointsAr: ["دائماً وفر خيارين للتمرير","تحرك بعد التمرير","افتح جسمك لرؤية كل الخيارات","لمسة واحدة عند الإمكان"],
    videoId: "-F6OecCUHLA"
  },
  {
    id: "pass-3", title: "Tight Space Passing Drills", titleAr: "تمارين التمرير في المساحات الضيقة",
    category: "passing", ageGroups: ["U12","U14","U16","U18"], difficulty: "advanced", duration: 15, players: "4-8",
    equipment: ["Cones","Balls"],
    description: "Passing drills designed for tight spaces — ideal for training quick combinations under pressure in congested areas.",
    descriptionAr: "تمارين تمرير مصممة للمساحات الضيقة — مثالية لتدريب التوليفات السريعة تحت الضغط في المناطق المزدحمة.",
    coachingPoints: ["Quick release under pressure","Use body to shield before passing","Play away from pressure","Communicate constantly"],
    coachingPointsAr: ["إطلاق سريع تحت الضغط","استخدم جسمك للحماية قبل التمرير","العب بعيداً عن الضغط","تواصل باستمرار"],
    videoId: "9aHmBjWdRIk"
  },
  {
    id: "drib-1", title: "5 Essential Dribbling Drills", titleAr: "5 تمارين مراوغة أساسية",
    category: "dribbling", ageGroups: ["U8","U10","U12","U14"], difficulty: "beginner", duration: 15, players: "1",
    equipment: ["Cones (8-10)","Ball"],
    description: "Master the 5 essential dribbling drills every player should know. Focus on close ball control, soft touches, and keeping head up.",
    descriptionAr: "أتقن 5 تمارين مراوغة أساسية يجب أن يعرفها كل لاعب. التركيز على التحكم القريب بالكرة واللمسات الناعمة ورفع الرأس.",
    coachingPoints: ["Small touches, ball close to feet","Use both feet equally","Keep head up between cones","Increase speed gradually"],
    coachingPointsAr: ["لمسات صغيرة، الكرة قريبة من القدم","استخدم كلتا القدمين بالتساوي","ارفع رأسك بين الأقماع","زد السرعة تدريجياً"],
    videoId: "feA7KafbwdQ"
  },
  {
    id: "drib-2", title: "1v1 Attacking Moves & Feints", titleAr: "حركات هجومية وخدع 1 ضد 1",
    category: "dribbling", ageGroups: ["U10","U12","U14","U16","U18"], difficulty: "intermediate", duration: 20, players: "2",
    equipment: ["Cones","Ball","Mini Goals"],
    description: "Practice various 1v1 moves: step-over, scissors, body feint, Cruyff turn. Attacker vs defender in a confined channel.",
    descriptionAr: "تدريب حركات 1 ضد 1 المتنوعة: الخطوة فوق الكرة، المقص، خداع الجسم، لفة كرويف. مهاجم ضد مدافع في ممر محدود.",
    coachingPoints: ["Approach at speed","Drop shoulder to sell the fake","Explode past defender after the move","Protect the ball with body"],
    coachingPointsAr: ["اقترب بسرعة","أسقط الكتف لبيع الخدعة","انفجر بعد الحركة","احمِ الكرة بجسمك"],
    videoId: "jwIHc9rz7yo"
  },
  {
    id: "drib-3", title: "Close Control Dribbling Mastery", titleAr: "إتقان المراوغة بتحكم قريب",
    category: "dribbling", ageGroups: ["U12","U14","U16","U18"], difficulty: "advanced", duration: 20, players: "1-2",
    equipment: ["Cones","Ball"],
    description: "Advanced close control dribbling techniques. Develop the ability to manipulate the ball in tight spaces with precision.",
    descriptionAr: "تقنيات مراوغة متقدمة بتحكم قريب. طور القدرة على التعامل مع الكرة في المساحات الضيقة بدقة.",
    coachingPoints: ["Push ball 2-3 yards ahead in space","Sprint between touches","Head up to assess options","Decide early: shoot, pass, or dribble"],
    coachingPointsAr: ["ادفع الكرة 2-3 ياردات في الفراغ","اعدُ بين اللمسات","ارفع رأسك لتقييم الخيارات","قرر مبكراً: تسديد أو تمرير أو مراوغة"],
    videoId: "Hs4ByFF_AE0"
  },
  {
    id: "shoot-1", title: "How to Shoot a Football — Full Tutorial", titleAr: "كيفية التسديد في كرة القدم — دليل كامل",
    category: "shooting", ageGroups: ["U10","U12","U14","U16","U18"], difficulty: "beginner", duration: 20, players: "2-4",
    equipment: ["Balls","Goals","Cones"],
    description: "Complete shooting tutorial covering technique, body position, and placement. Learn the fundamentals of striking a football correctly.",
    descriptionAr: "دليل تسديد كامل يغطي التقنية ووضعية الجسم والتوجيه. تعلم أساسيات ضرب كرة القدم بشكل صحيح.",
    coachingPoints: ["Plant foot next to ball, pointing at target","Strike through the center or top half","Body over the ball to keep it down","Follow through completely"],
    coachingPointsAr: ["ضع قدم الارتكاز بجانب الكرة مشيرة للهدف","اضرب من المنتصف أو النصف العلوي","الجسم فوق الكرة لإبقائها منخفضة","أكمل حركة المتابعة"],
    videoId: "bHGW2apqfEE"
  },
  {
    id: "shoot-2", title: "Striking the Ball — Step by Step", titleAr: "ضرب الكرة — خطوة بخطوة",
    category: "shooting", ageGroups: ["U12","U14","U16","U18"], difficulty: "intermediate", duration: 15, players: "2-4",
    equipment: ["Balls","Goals"],
    description: "Step-by-step guide to striking the ball with power and accuracy. Covers approach angle, contact point, and follow-through.",
    descriptionAr: "دليل خطوة بخطوة لضرب الكرة بقوة ودقة. يغطي زاوية الاقتراب ونقطة الاتصال وحركة المتابعة.",
    coachingPoints: ["See the shot, TAKE the shot","Strike the center of the ball","Non-kicking foot beside the ball","Head down through contact"],
    coachingPointsAr: ["شاهد التسديدة، خذها","اضرب مركز الكرة","القدم غير الضاربة بجانب الكرة","الرأس لأسفل أثناء الاتصال"],
    videoId: "QDb5-cMIbjM"
  },
  {
    id: "touch-1", title: "5 First Touch Exercises", titleAr: "5 تمارين اللمسة الأولى",
    category: "first-touch", ageGroups: ["U10","U12","U14","U16","U18"], difficulty: "beginner", duration: 15, players: "2-3",
    equipment: ["Cones","Balls"],
    description: "Perfect your first touch with 5 simple exercises. Develop the ability to control the ball and get it on the move efficiently.",
    descriptionAr: "أتقن لمستك الأولى بـ 5 تمارين بسيطة. طور القدرة على التحكم بالكرة وتحريكها بكفاءة.",
    coachingPoints: ["Check shoulder before receiving","Open body to play forward","Cushion the ball away from pressure","First touch sets up next action"],
    coachingPointsAr: ["تحقق من كتفك قبل الاستقبال","افتح جسمك للعب للأمام","امتص الكرة بعيداً عن الضغط","اللمسة الأولى تجهز الحركة التالية"],
    videoId: "el7QvVnprOk"
  },
  {
    id: "def-1", title: "How to Defend in Soccer — 3 Drills", titleAr: "كيفية الدفاع في كرة القدم — 3 تمارين",
    category: "defending", ageGroups: ["U10","U12","U14","U16","U18"], difficulty: "beginner", duration: 20, players: "2-4",
    equipment: ["Cones","Ball"],
    description: "3 essential soccer drills that will help you become a stronger, smarter, and more effective defender.",
    descriptionAr: "3 تمارين كرة قدم أساسية ستساعدك على أن تصبح مدافعاً أقوى وأذكى وأكثر فعالية.",
    coachingPoints: ["Stay on your feet, don't dive in","Side-on stance, low center of gravity","Watch the ball, not the player's body","Force to weaker foot or touchline"],
    coachingPointsAr: ["ابقَ على قدميك ولا تندفع","وقفة جانبية ومركز ثقل منخفض","راقب الكرة وليس جسم اللاعب","أجبره على قدمه الضعيفة أو خط التماس"],
    videoId: "LR9ifmPXGhI"
  },
  {
    id: "def-2", title: "High Pressing & Defensive Attributes", titleAr: "الضغط العالي والصفات الدفاعية",
    category: "defending", ageGroups: ["U14","U16","U18"], difficulty: "advanced", duration: 25, players: "8-11",
    equipment: ["Cones","Balls","Bibs","Goals"],
    description: "Coach defensive attributes every footballer needs — pressing triggers, compactness, and winning the ball high up the pitch.",
    descriptionAr: "تدريب الصفات الدفاعية التي يحتاجها كل لاعب كرة قدم — محفزات الضغط والتضام وكسب الكرة في مناطق عالية.",
    coachingPoints: ["Press as a unit, not individually","Identify the trigger and GO","Cut passing lanes while pressing","Second defender covers, third balances"],
    coachingPointsAr: ["اضغط كوحدة وليس فردياً","حدد المحفز وانطلق","اقطع خطوط التمرير أثناء الضغط","المدافع الثاني يغطي والثالث يوازن"],
    videoId: "uBlSzlbvsvo"
  },
  {
    id: "gk-1", title: "Goalkeeper Speed & Reaction Drills", titleAr: "تمارين سرعة وردود فعل الحارس",
    category: "goalkeeping", ageGroups: ["U12","U14","U16","U18"], difficulty: "intermediate", duration: 30, players: "1-2",
    equipment: ["Balls","Cones","Goal"],
    description: "Goalkeeper speed drills and reaction training. Covers footwork, diving, and cut-back saves essential for modern goalkeepers.",
    descriptionAr: "تمارين سرعة وتدريب ردود فعل الحارس. يغطي حركة الأقدام والانقضاض وتصدي الكرات المرتدة الضرورية للحراس المعاصرين.",
    coachingPoints: ["Set position before every shot","Dive through the ball, not around it","Quick recovery after save","Communicate with defenders constantly"],
    coachingPointsAr: ["وضعية الاستعداد قبل كل تسديدة","انقض عبر الكرة وليس حولها","تعافَ بسرعة بعد التصدي","تواصل مع المدافعين باستمرار"],
    videoId: "TviVDUBTQVU"
  },
  {
    id: "tact-1", title: "Positional Play Principles", titleAr: "مبادئ اللعب الموضعي",
    category: "tactical", ageGroups: ["U14","U16","U18"], difficulty: "advanced", duration: 30, players: "11",
    equipment: ["Cones","Balls","Bibs","Goals"],
    description: "Full team exercise focusing on positional play: width, depth, numerical superiority in zones, and creating overloads.",
    descriptionAr: "تمرين كامل للفريق يركز على اللعب الموضعي: العرض والعمق والتفوق العددي في المناطق وخلق الأفضلية.",
    coachingPoints: ["Maintain width and depth","Create triangles and diamonds","Numerical superiority in the zone of the ball","Free man should always be available"],
    coachingPointsAr: ["حافظ على العرض والعمق","اصنع مثلثات ومعينات","تفوق عددي في منطقة الكرة","الرجل الحر يجب أن يكون متاحاً دائماً"],
    videoId: "uBlSzlbvsvo"
  },
  {
    id: "phys-1", title: "Agility Ladder & Speed Work", titleAr: "سلم الرشاقة وتمارين السرعة",
    category: "physical", ageGroups: ["U10","U12","U14","U16","U18"], difficulty: "beginner", duration: 15, players: "1-6",
    equipment: ["Agility Ladder","Cones"],
    description: "Footwork patterns through agility ladder followed by sprint acceleration. Develops quick feet, coordination, and explosive speed.",
    descriptionAr: "أنماط حركة الأقدام عبر سلم الرشاقة متبوعة بتسارع العدو. يطور سرعة الأقدام والتنسيق والسرعة الانفجارية.",
    coachingPoints: ["Quick feet, light on toes","Arms drive the speed","Transition from ladder to sprint explosively","Quality over speed initially"],
    coachingPointsAr: ["أقدام سريعة وخفيفة على الأصابع","الذراعان تقودان السرعة","انتقل من السلم للعدو بشكل انفجاري","الجودة أولاً ثم السرعة"],
    videoId: "jwIHc9rz7yo"
  },
];

const CATEGORIES = [
  { id: "all", label: "All Skills", labelAr: "كل المهارات", icon: BookOpen, color: "bg-slate-500" },
  { id: "passing", label: "Passing", labelAr: "التمرير", icon: Target, color: "bg-blue-500" },
  { id: "dribbling", label: "Dribbling", labelAr: "المراوغة", icon: Zap, color: "bg-yellow-500" },
  { id: "shooting", label: "Shooting", labelAr: "التسديد", icon: Crosshair, color: "bg-red-500" },
  { id: "first-touch", label: "First Touch", labelAr: "اللمسة الأولى", icon: Footprints, color: "bg-green-500" },
  { id: "defending", label: "Defending", labelAr: "الدفاع", icon: Shield, color: "bg-indigo-500" },
  { id: "goalkeeping", label: "Goalkeeping", labelAr: "حراسة المرمى", icon: Shield, color: "bg-cyan-500" },
  { id: "tactical", label: "Tactical", labelAr: "تكتيكي", icon: Brain, color: "bg-purple-500" },
  { id: "physical", label: "Physical", labelAr: "بدني", icon: Dumbbell, color: "bg-teal-500" },
];

const AGE_GROUPS = ["All", "U8", "U10", "U12", "U14", "U16", "U18"];
const DIFFICULTIES = ["all", "beginner", "intermediate", "advanced", "pro"];

const DIFF_COLORS: Record<string, string> = {
  beginner: "bg-green-500/20 text-green-700 dark:text-green-400 border border-green-500/30",
  intermediate: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border border-yellow-500/30",
  advanced: "bg-orange-500/20 text-orange-700 dark:text-orange-400 border border-orange-500/30",
  pro: "bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30",
};

const DIFF_LABELS_AR: Record<string, string> = {
  beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم", pro: "احترافي",
};

export default function SkillsLibrary() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAgeGroup, setSelectedAgeGroup] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [expandedDrill, setExpandedDrill] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [assignDrill, setAssignDrill] = useState<Drill | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");

  const { data: players = [] } = trpc.players.getAll.useQuery();
  const sendMessage = trpc.lockerRoom.sendMessage.useMutation({
    onSuccess: () => {
      toast({ title: isAr ? "تم الإرسال!" : "Video Assigned!", description: isAr ? "تم إرسال الفيديو للاعب في غرفة الملابس" : "Video sent to player's locker room" });
      setAssignDrill(null);
      setSelectedPlayerId("");
    },
  });

  function handleAssignVideo(drill: Drill) {
    if (!selectedPlayerId) return;
    const pid = parseInt(selectedPlayerId);
    sendMessage.mutate({
      playerId: pid,
      messageType: "tactical",
      content: `Watch this training video to improve your skills:\n\n**${drill.title}**\n${drill.description}\n\nKey coaching points:\n${drill.coachingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}`,
      attachedVideoId: drill.videoId,
      attachedVideoTitle: drill.title,
      attachedVideoCategory: drill.category,
    });
  }

  const filteredDrills = useMemo(() => {
    return DRILLS_DATABASE.filter(drill => {
      const matchesSearch = searchQuery === "" ||
        drill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drill.titleAr.includes(searchQuery) ||
        drill.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "all" || drill.category === selectedCategory;
      const matchesAge = selectedAgeGroup === "All" || drill.ageGroups.includes(selectedAgeGroup);
      const matchesDifficulty = selectedDifficulty === "all" || drill.difficulty === selectedDifficulty;
      return matchesSearch && matchesCategory && matchesAge && matchesDifficulty;
    });
  }, [searchQuery, selectedCategory, selectedAgeGroup, selectedDifficulty]);

  const getDiffLabel = (d: string) => isAr ? (DIFF_LABELS_AR[d] || d) : d.charAt(0).toUpperCase() + d.slice(1);
  const getCategoryInfo = (catId: string) => CATEGORIES.find(c => c.id === catId) || CATEGORIES[0];

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                <Video className="w-7 h-7 text-blue-500" />
                {isAr ? "مكتبة مهارات كرة القدم" : "Football Skills Library"}
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {isAr ? "مكتبة شاملة من التمارين مع فيديوهات تدريبية حقيقية" : "Comprehensive drill library with real YouTube training videos"}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-sm px-3 py-1.5 w-fit">
            <Youtube className="w-3.5 h-3.5 mr-1.5 text-red-500" />
            {filteredDrills.length} {isAr ? "فيديو تدريبي" : "training videos"}
          </Badge>
        </div>

        {/* Search & Filters */}
        <div className="bg-card border rounded-xl p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={isAr ? "ابحث عن تمرين أو مهارة..." : "Search drills or skills..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCategory === cat.id ? `${cat.color} text-white shadow-md` : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <cat.icon className="w-3 h-3" />
                {isAr ? cat.labelAr : cat.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={isAr ? "الفئة العمرية" : "Age Group"} />
              </SelectTrigger>
              <SelectContent>
                {AGE_GROUPS.map(ag => (
                  <SelectItem key={ag} value={ag}>{ag === "All" ? (isAr ? "كل الأعمار" : "All Ages") : ag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder={isAr ? "المستوى" : "Difficulty"} />
              </SelectTrigger>
              <SelectContent>
                {DIFFICULTIES.map(d => (
                  <SelectItem key={d} value={d}>{d === "all" ? (isAr ? "كل المستويات" : "All Levels") : getDiffLabel(d)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Video Modal */}
        {playingVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPlayingVideo(null)}>
            <div className="relative w-full max-w-4xl bg-black rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 bg-card">
                <span className="text-foreground font-semibold text-sm flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-red-500" />
                  {isAr ? "فيديو تدريبي" : "Training Video"}
                </span>
                <button onClick={() => setPlayingVideo(null)} className="text-muted-foreground hover:text-foreground p-1 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${playingVideo}?autoplay=1&rel=0`}
                  title="Training Video"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        )}

        {/* Drills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDrills.map(drill => {
            const catInfo = getCategoryInfo(drill.category);
            const isExpanded = expandedDrill === drill.id;
            return (
              <div key={drill.id} className="bg-card border rounded-xl overflow-hidden hover:shadow-lg transition-all">
                <div className="relative group cursor-pointer" onClick={() => setPlayingVideo(drill.videoId)}>
                  <img
                    src={`https://img.youtube.com/vi/${drill.videoId}/hqdefault.jpg`}
                    alt={drill.title}
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-foreground ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${DIFF_COLORS[drill.difficulty]}`}>
                      {getDiffLabel(drill.difficulty)}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full text-white ${catInfo.color}`}>
                      {isAr ? catInfo.labelAr : catInfo.label}
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    <Youtube className="w-3 h-3 text-red-400" />
                    YouTube
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm leading-tight">{isAr ? drill.titleAr : drill.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{isAr ? drill.descriptionAr : drill.description}</p>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{drill.duration} {isAr ? "د" : "min"}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{drill.players}</span>
                    <div className="flex flex-wrap gap-1">
                      {drill.ageGroups.slice(0, 3).map(ag => (
                        <span key={ag} className="bg-muted px-1.5 py-0.5 rounded text-xs">{ag}</span>
                      ))}
                      {drill.ageGroups.length > 3 && <span className="text-xs text-muted-foreground">+{drill.ageGroups.length - 3}</span>}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {drill.equipment.map(eq => (
                      <span key={eq} className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">{eq}</span>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => setPlayingVideo(drill.videoId)}
                    >
                      <Play className="w-3.5 h-3.5" />
                      {isAr ? "شاهد الفيديو" : "Watch Video"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => setExpandedDrill(isExpanded ? null : drill.id)}
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {isAr ? "نقاط" : "Tips"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
                      title={isAr ? "أرسل للاعب" : "Assign to Player"}
                      onClick={() => { setAssignDrill(drill); setSelectedPlayerId(""); }}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="pt-2 border-t space-y-2">
                      <h4 className="text-xs font-semibold flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-700 dark:text-yellow-500" />
                        {isAr ? "النقاط التدريبية الرئيسية" : "Key Coaching Points"}
                      </h4>
                      <ul className="space-y-1.5">
                        {(isAr ? drill.coachingPointsAr : drill.coachingPoints).map((point, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5">
                            <CheckCircle className="w-3 h-3 text-green-700 dark:text-green-500 mt-0.5 shrink-0" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredDrills.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">{isAr ? "لا توجد تمارين مطابقة" : "No drills found"}</h3>
            <p className="text-muted-foreground text-sm">{isAr ? "جرب تغيير الفلاتر أو البحث بكلمات مختلفة" : "Try changing filters or search terms"}</p>
          </div>
        )}
      </div>

      {/* Assign Video to Player Dialog */}
      <Dialog open={!!assignDrill} onOpenChange={() => setAssignDrill(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              {isAr ? "إرسال الفيديو للاعب" : "Assign Video to Player"}
            </DialogTitle>
          </DialogHeader>
          {assignDrill && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Youtube className="w-4 h-4 text-red-500" />
                  <span className="font-semibold text-sm">{assignDrill.title}</span>
                </div>
                <p className="text-xs text-muted-foreground">{assignDrill.description}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">{isAr ? "اختر اللاعب" : "Select Player"}</label>
                <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isAr ? "اختر لاعباً..." : "Choose a player..."} />
                  </SelectTrigger>
                  <SelectContent>
                    {(players as any[]).map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} {p.position ? `— ${p.position}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setAssignDrill(null)}>
                  {isAr ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!selectedPlayerId || sendMessage.isPending}
                  onClick={() => handleAssignVideo(assignDrill)}
                >
                  <Send className="w-4 h-4" />
                  {sendMessage.isPending ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال للاعب" : "Send to Player")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
