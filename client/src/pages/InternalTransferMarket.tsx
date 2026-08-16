import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import {
  ArrowLeftRight, Star, TrendingUp, Search, Filter, Eye, Send,
  CheckCircle, Clock, XCircle, Zap, Brain, Shield, Users, DollarSign,
  Award, ChevronRight, Globe, BarChart3, Target, Heart, Footprints,
  FileText, UserCheck, AlertTriangle, Sparkles, Activity, Ruler,
  Weight, Timer, Percent, Trophy, MapPin, Calendar, Phone, Mail
} from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// ENHANCED PLAYER PROFILE INTERFACE
// ═══════════════════════════════════════════════════════════════

interface PlayerProfile {
  id: number;
  name: string;
  nameEn: string;
  position: string;
  preferredFoot: "right" | "left" | "both";
  ageGroup: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  academy: string;
  nationality: string;
  contractEnd: string;
  photo?: string;
  // Ratings (0-99)
  overall: number;
  technical: { passing: number; shooting: number; dribbling: number; firstTouch: number; crossing: number; heading: number };
  physical: { pace: number; stamina: number; strength: number; agility: number; jumping: number };
  tactical: { positioning: number; vision: number; decisionMaking: number; workRate: number; leadership: number };
  mental: { composure: number; concentration: number; aggression: number; determination: number };
  // Market info
  aiValue: number;
  previousValue: number;
  valueChange: number; // percentage
  status: "available" | "under_offer" | "transferred" | "not_for_sale" | "loan_available";
  // Performance
  seasonStats: { matches: number; goals: number; assists: number; cleanSheets: number; minutesPlayed: number; rating: number };
  highlights: string[];
  weaknesses: string[];
  scoutingNotes: string;
  injuryHistory: { type: string; duration: string; date: string }[];
  // AI Scouting
  aiScoutReport: {
    potential: number;
    developmentCurve: "early_bloomer" | "steady" | "late_bloomer";
    bestRole: string;
    comparison: string; // "Plays like..."
    recommendation: "must_sign" | "highly_recommended" | "recommended" | "monitor" | "pass";
    strengths: string[];
    areasToImprove: string[];
    projectedValue12Months: number;
  };
}

interface TransferOffer {
  id: number;
  player: string;
  fromAcademy: string;
  toAcademy: string;
  amount: number;
  offerType: "permanent" | "loan" | "loan_with_option";
  loanDuration?: string;
  buyOption?: number;
  status: "pending" | "accepted" | "rejected" | "negotiating" | "withdrawn";
  date: string;
  expiresIn: string;
  notes: string;
  counterOffer?: number;
}

// ═══════════════════════════════════════════════════════════════
// COMPREHENSIVE DEMO DATA
// ═══════════════════════════════════════════════════════════════

const PLAYER_PROFILES: PlayerProfile[] = [
  {
    id: 1, name: "أحمد محمد الشريف", nameEn: "Ahmed Mohamed El-Sherif", position: "ST", preferredFoot: "right",
    ageGroup: "U-17", age: 16, height: 178, weight: 68, academy: "أكاديمية النجوم", nationality: "مصري",
    contractEnd: "يونيو 2026",
    overall: 82,
    technical: { passing: 72, shooting: 88, dribbling: 80, firstTouch: 78, crossing: 65, heading: 75 },
    physical: { pace: 85, stamina: 78, strength: 72, agility: 82, jumping: 76 },
    tactical: { positioning: 84, vision: 70, decisionMaking: 75, workRate: 80, leadership: 65 },
    mental: { composure: 78, concentration: 72, aggression: 75, determination: 85 },
    aiValue: 85000, previousValue: 60000, valueChange: 41.7, status: "available",
    seasonStats: { matches: 22, goals: 14, assists: 5, cleanSheets: 0, minutesPlayed: 1760, rating: 7.8 },
    highlights: ["أفضل هداف في الدوري U-17", "سرعة 33.2 كم/س (أسرع لاعب)", "هاتريك ضد أكاديمية فيوتشر ستارز", "14 هدف في 22 مباراة"],
    weaknesses: ["التمريرات الطويلة", "اللعب بالظهر للمرمى", "الأداء الدفاعي"],
    scoutingNotes: "مهاجم واعد بحركة ذكية وتسديد قوي. يحتاج تطوير في الربط مع الزملاء.",
    injuryHistory: [{ type: "شد عضلي", duration: "أسبوعين", date: "أكتوبر 2024" }],
    aiScoutReport: {
      potential: 89, developmentCurve: "early_bloomer", bestRole: "مهاجم صريح / Poacher",
      comparison: "يلعب بأسلوب مشابه لـ محمد صلاح في بداياته",
      recommendation: "must_sign",
      strengths: ["حركة بدون كرة استثنائية", "تسديد بالقدمين", "سرعة انطلاق عالية", "غريزة التهديف"],
      areasToImprove: ["البناء من الخلف", "الضغط العالي", "اللعب الجوي"],
      projectedValue12Months: 150000,
    }
  },
  {
    id: 2, name: "كريم علي حسن", nameEn: "Karim Ali Hassan", position: "CM", preferredFoot: "left",
    ageGroup: "U-15", age: 14, height: 168, weight: 58, academy: "أكاديمية المستقبل", nationality: "مصري",
    contractEnd: "يونيو 2027",
    overall: 79,
    technical: { passing: 86, shooting: 68, dribbling: 78, firstTouch: 84, crossing: 72, heading: 55 },
    physical: { pace: 72, stamina: 80, strength: 62, agility: 78, jumping: 60 },
    tactical: { positioning: 80, vision: 88, decisionMaking: 82, workRate: 85, leadership: 78 },
    mental: { composure: 82, concentration: 80, aggression: 60, determination: 88 },
    aiValue: 65000, previousValue: 45000, valueChange: 44.4, status: "available",
    seasonStats: { matches: 20, goals: 4, assists: 12, cleanSheets: 0, minutesPlayed: 1650, rating: 7.5 },
    highlights: ["أفضل صانع ألعاب U-15", "12 تمريرة حاسمة", "دقة تمرير 89%", "قائد الفريق"],
    weaknesses: ["القوة البدنية", "التسديد من بعيد", "اللعب الجوي"],
    scoutingNotes: "صانع ألعاب ذكي برؤية استثنائية. يحتاج بناء عضلي وتحسين التسديد.",
    injuryHistory: [],
    aiScoutReport: {
      potential: 91, developmentCurve: "steady", bestRole: "صانع ألعاب / Playmaker",
      comparison: "يشبه أسلوب تشافي هيرنانديز في التحكم بالإيقاع",
      recommendation: "must_sign",
      strengths: ["رؤية استثنائية", "تمرير دقيق بالقدمين", "قراءة اللعب", "هدوء تحت الضغط"],
      areasToImprove: ["البنية الجسدية", "التسديد", "الأداء في المباريات الكبيرة"],
      projectedValue12Months: 120000,
    }
  },
  {
    id: 3, name: "محمد حسن إبراهيم", nameEn: "Mohamed Hassan Ibrahim", position: "CB", preferredFoot: "right",
    ageGroup: "U-18", age: 17, height: 186, weight: 78, academy: "أكاديمية فيوتشر ستارز", nationality: "مصري",
    contractEnd: "يونيو 2025",
    overall: 81,
    technical: { passing: 72, shooting: 55, dribbling: 65, firstTouch: 70, crossing: 60, heading: 85 },
    physical: { pace: 75, stamina: 82, strength: 88, agility: 70, jumping: 86 },
    tactical: { positioning: 85, vision: 68, decisionMaking: 80, workRate: 82, leadership: 80 },
    mental: { composure: 82, concentration: 85, aggression: 78, determination: 80 },
    aiValue: 72000, previousValue: 55000, valueChange: 30.9, status: "under_offer",
    seasonStats: { matches: 24, goals: 2, assists: 1, cleanSheets: 14, minutesPlayed: 2100, rating: 7.6 },
    highlights: ["14 مباراة بدون أهداف", "5.8 قطع/مباراة", "أفضل مدافع في البطولة", "قائد خط الدفاع"],
    weaknesses: ["السرعة في المساحات الكبيرة", "التمرير تحت الضغط", "المراوغة"],
    scoutingNotes: "مدافع قوي بقراءة ممتازة للعب. يحتاج تحسين في البناء من الخلف.",
    injuryHistory: [{ type: "التواء كاحل", duration: "3 أسابيع", date: "مارس 2025" }],
    aiScoutReport: {
      potential: 85, developmentCurve: "steady", bestRole: "قلب دفاع / Ball-Playing CB",
      comparison: "يشبه أسلوب فيرجيل فان دايك في القوة والقراءة",
      recommendation: "highly_recommended",
      strengths: ["قراءة اللعب", "القوة الجوية", "القيادة", "التمركز الدفاعي"],
      areasToImprove: ["البناء من الخلف", "السرعة", "التمرير الطويل"],
      projectedValue12Months: 100000,
    }
  },
  {
    id: 4, name: "عمر إبراهيم سعيد", nameEn: "Omar Ibrahim Said", position: "GK", preferredFoot: "right",
    ageGroup: "U-16", age: 15, height: 182, weight: 72, academy: "أكاديمية الزمالك", nationality: "مصري",
    contractEnd: "يونيو 2027",
    overall: 77,
    technical: { passing: 68, shooting: 30, dribbling: 45, firstTouch: 72, crossing: 35, heading: 40 },
    physical: { pace: 65, stamina: 75, strength: 72, agility: 85, jumping: 82 },
    tactical: { positioning: 80, vision: 72, decisionMaking: 76, workRate: 70, leadership: 75 },
    mental: { composure: 80, concentration: 82, aggression: 55, determination: 78 },
    aiValue: 45000, previousValue: 30000, valueChange: 50, status: "available",
    seasonStats: { matches: 18, goals: 0, assists: 0, cleanSheets: 10, minutesPlayed: 1620, rating: 7.4 },
    highlights: ["نسبة إنقاذ 81%", "10 مباريات نظيفة", "ردود فعل استثنائية", "توزيع دقيق"],
    weaknesses: ["الخروج من المرمى", "اللعب بالقدمين تحت الضغط", "قيادة خط الدفاع"],
    scoutingNotes: "حارس واعد بردود فعل ممتازة. يحتاج تطوير في اللعب بالقدمين والخروج.",
    injuryHistory: [],
    aiScoutReport: {
      potential: 84, developmentCurve: "late_bloomer", bestRole: "حارس مرمى / Shot-Stopper",
      comparison: "يشبه أسلوب تيبو كورتوا في الطول وردود الفعل",
      recommendation: "recommended",
      strengths: ["ردود فعل سريعة", "التصدي للتسديدات القريبة", "الثبات النفسي", "الطول والامتداد"],
      areasToImprove: ["اللعب بالقدمين", "قيادة الدفاع", "الخروج من المرمى", "الكرات العرضية"],
      projectedValue12Months: 70000,
    }
  },
  {
    id: 5, name: "يوسف طارق عبدالله", nameEn: "Youssef Tarek Abdullah", position: "LW", preferredFoot: "right",
    ageGroup: "U-16", age: 15, height: 172, weight: 62, academy: "أكاديمية بيراميدز", nationality: "مصري",
    contractEnd: "يونيو 2027",
    overall: 80,
    technical: { passing: 75, shooting: 78, dribbling: 88, firstTouch: 82, crossing: 76, heading: 58 },
    physical: { pace: 90, stamina: 75, strength: 60, agility: 88, jumping: 65 },
    tactical: { positioning: 72, vision: 74, decisionMaking: 70, workRate: 72, leadership: 55 },
    mental: { composure: 70, concentration: 68, aggression: 65, determination: 80 },
    aiValue: 95000, previousValue: 55000, valueChange: 72.7, status: "available",
    seasonStats: { matches: 19, goals: 8, assists: 9, cleanSheets: 0, minutesPlayed: 1520, rating: 7.7 },
    highlights: ["أسرع لاعب في البطولة (34.1 كم/س)", "8 أهداف + 9 تمريرات حاسمة", "مراوغة ناجحة 4.2/مباراة", "لاعب الشهر مرتين"],
    weaknesses: ["الثبات في الأداء", "الأداء الدفاعي", "اتخاذ القرار النهائي"],
    scoutingNotes: "جناح سريع جداً بمراوغة استثنائية. يحتاج تحسين في اتخاذ القرار والثبات.",
    injuryHistory: [{ type: "إجهاد عضلي", duration: "10 أيام", date: "يناير 2025" }],
    aiScoutReport: {
      potential: 90, developmentCurve: "early_bloomer", bestRole: "جناح قاطع / Inverted Winger",
      comparison: "يشبه أسلوب فينيسيوس جونيور في السرعة والمراوغة",
      recommendation: "must_sign",
      strengths: ["سرعة انفجارية", "مراوغة 1v1", "خلق الفرص", "الجري بالكرة"],
      areasToImprove: ["اتخاذ القرار", "الثبات", "العمل الدفاعي", "اللعب الجوي"],
      projectedValue12Months: 180000,
    }
  },
  {
    id: 6, name: "سيف الدين أحمد", nameEn: "Seif El-Din Ahmed", position: "RB", preferredFoot: "right",
    ageGroup: "U-17", age: 16, height: 175, weight: 67, academy: "أكاديمية إنبي", nationality: "مصري",
    contractEnd: "يونيو 2026",
    overall: 76,
    technical: { passing: 74, shooting: 60, dribbling: 72, firstTouch: 70, crossing: 80, heading: 65 },
    physical: { pace: 82, stamina: 85, strength: 70, agility: 78, jumping: 72 },
    tactical: { positioning: 76, vision: 72, decisionMaking: 74, workRate: 90, leadership: 68 },
    mental: { composure: 72, concentration: 75, aggression: 72, determination: 82 },
    aiValue: 42000, previousValue: 35000, valueChange: 20, status: "loan_available",
    seasonStats: { matches: 21, goals: 1, assists: 7, cleanSheets: 9, minutesPlayed: 1850, rating: 7.2 },
    highlights: ["7 تمريرات حاسمة من الظهير", "أعلى معدل عمل في الفريق", "عروض مميزة في الدربي"],
    weaknesses: ["المواجهات الفردية 1v1 دفاعياً", "التمركز عند الكرات العرضية"],
    scoutingNotes: "ظهير نشيط بقدرة هجومية جيدة. يحتاج تحسين في الجانب الدفاعي.",
    injuryHistory: [],
    aiScoutReport: {
      potential: 82, developmentCurve: "steady", bestRole: "ظهير هجومي / Attacking Full-Back",
      comparison: "يشبه أسلوب ترينت أرنولد في العرضيات",
      recommendation: "recommended",
      strengths: ["العرضيات", "اللياقة البدنية", "الانضمام للهجوم", "معدل العمل"],
      areasToImprove: ["الدفاع 1v1", "التمركز", "القوة البدنية"],
      projectedValue12Months: 60000,
    }
  },
];

const TRANSFER_OFFERS: TransferOffer[] = [
  { id: 1, player: "أحمد محمد الشريف", fromAcademy: "أكاديمية المستقبل", toAcademy: "أكاديمية النجوم", amount: 75000, offerType: "permanent", status: "pending", date: "5 يونيو 2025", expiresIn: "3 أيام", notes: "مهتمون جداً بالانضمام لبرنامج تطوير المهاجمين" },
  { id: 2, player: "كريم علي حسن", fromAcademy: "أكاديمية فيوتشر ستارز", toAcademy: "أكاديمية المستقبل", amount: 55000, offerType: "permanent", status: "negotiating", date: "3 يونيو 2025", expiresIn: "5 أيام", notes: "نريد ضمه لبرنامج الناشئين", counterOffer: 70000 },
  { id: 3, player: "سيف الدين أحمد", fromAcademy: "أكاديمية النجوم", toAcademy: "أكاديمية إنبي", amount: 0, offerType: "loan", loanDuration: "6 أشهر", buyOption: 50000, status: "pending", date: "4 يونيو 2025", expiresIn: "7 أيام", notes: "إعارة مع خيار شراء" },
];

const TRANSFER_HISTORY = [
  { player: "يوسف خالد", from: "أكاديمية النجوم", to: "فيوتشر ستارز FC (أول فريق)", date: "مارس 2025", value: 250000, type: "professional", status: "completed" },
  { player: "سامي طارق", from: "أكاديمية فيوتشر ستارز", to: "أكاديمية النجوم", date: "يناير 2025", value: 45000, type: "academy", status: "completed" },
  { player: "علي محمود", from: "أكاديمية الزمالك", to: "أكاديمية المستقبل", date: "نوفمبر 2024", value: 35000, type: "academy", status: "completed" },
  { player: "حسام فتحي", from: "أكاديمية النجوم", to: "أكاديمية بيراميدز", date: "سبتمبر 2024", value: 28000, type: "loan", status: "completed" },
  { player: "مروان سعيد", from: "أكاديمية إنبي", to: "نادي المصري (أول فريق)", date: "أغسطس 2024", value: 180000, type: "professional", status: "completed" },
];

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function InternalTransferMarket() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("marketplace");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPosition, setFilterPosition] = useState("all");
  const [filterAge, setFilterAge] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("overall");
  const [filterValue, setFilterValue] = useState("all");
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerProfile | null>(null);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerType, setOfferType] = useState("permanent");
  const [offerNote, setOfferNote] = useState("");
  const [loanDuration, setLoanDuration] = useState("6");
  const [buyOptionAmount, setBuyOptionAmount] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [comparePlayer1, setComparePlayer1] = useState<PlayerProfile | null>(null);
  const [comparePlayer2, setComparePlayer2] = useState<PlayerProfile | null>(null);

  // AI Valuation mutation
  const aiValuation = trpc.ai.analyzeOpponent.useMutation();
  // ── Real backend data ──────────────────────────────────────────────────────
  const { data: squadData = [], isLoading: squadLoading } = trpc.transferMarket.getSquadWithValuations.useQuery({ teamType: 'all' });
  const { data: marketListingsData = [], refetch: refetchListings } = trpc.transferMarket.getListings.useQuery({ status: 'all', listingType: 'all', limit: 100 });
  const { data: marketStats } = trpc.transferMarket.getMarketStats.useQuery();
  const { data: allOffersData = [] } = trpc.transferMarket.getAllOffers.useQuery({ status: 'all' });
  const makeOfferMutation = trpc.transferMarket.makeOffer.useMutation({ onSuccess: () => { refetchListings(); toast(isAr ? 'تم إرسال العرض ✓' : 'Offer submitted ✓'); } });
  const createListingMutation = trpc.transferMarket.createListing.useMutation({ onSuccess: () => { refetchListings(); toast(isAr ? 'تم إضافة اللاعب للسوق ✓' : 'Player listed ✓'); } });
  // Merge real players with demo data as fallback
  const realPlayers: PlayerProfile[] = squadData.map(({ player, valuation, listing }: any) => ({
    id: player.id,
    name: `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'Unknown',
    nameEn: `${player.firstName || ''} ${player.lastName || ''}`.trim(),
    position: player.position || 'MF',
    preferredFoot: player.preferredFoot || 'right',
    ageGroup: player.ageGroup || 'U-17',
    age: player.dateOfBirth ? Math.floor((Date.now() - new Date(player.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)) : 16,
    height: player.height || 175, weight: player.weight || 68,
    academy: 'Future Stars Academy', nationality: 'مصري', contractEnd: 'يونيو 2027',
    overall: player.overallRating || 75,
    technical: { passing: 75, shooting: 75, dribbling: 75, firstTouch: 75, crossing: 70, heading: 70 },
    physical: { pace: 75, stamina: 75, strength: 70, agility: 75, jumping: 70 },
    tactical: { positioning: 75, vision: 75, decisionMaking: 75, workRate: 80, leadership: 70 },
    mental: { composure: 75, concentration: 75, aggression: 70, determination: 80 },
    aiValue: valuation?.estimatedValue || 50000,
    previousValue: (valuation?.estimatedValue || 50000) * 0.85, valueChange: 17.6,
    status: listing ? 'available' as const : 'available' as const,
    seasonStats: { matches: player.matchesPlayed || 0, goals: player.goals || 0, assists: player.assists || 0, cleanSheets: 0, minutesPlayed: 0, rating: 7.0 },
    highlights: [], weaknesses: [], scoutingNotes: '', injuryHistory: [],
    aiScoutReport: { potential: (player.overallRating || 75) + 5, developmentCurve: 'steady' as const, bestRole: player.position || 'MF', comparison: '', recommendation: 'consider' as any, strengths: [], areasToImprove: [], projectedValue12Months: (valuation?.estimatedValue || 50000) * 1.2 },
  }));
  const allProfiles = realPlayers.length > 0 ? realPlayers : PLAYER_PROFILES;

  const filteredListings = allProfiles.filter(p => {
    const matchSearch = !searchTerm || p.name.includes(searchTerm) || p.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || p.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPos = filterPosition === "all" || p.position === filterPosition;
    const matchAge = filterAge === "all" ||
      (filterAge === "u15" && p.age <= 15) ||
      (filterAge === "u16" && p.age <= 16) ||
      (filterAge === "u17" && p.age <= 17) ||
      (filterAge === "u18" && p.age <= 18);
    const matchStatus = filterStatus === "all" || p.status === filterStatus;
    const matchValue = filterValue === "all" ||
      (filterValue === "u50k" && p.aiValue < 50000) ||
      (filterValue === "50k-100k" && p.aiValue >= 50000 && p.aiValue < 100000) ||
      (filterValue === "100k-200k" && p.aiValue >= 100000 && p.aiValue < 200000) ||
      (filterValue === "200k+" && p.aiValue >= 200000);
    return matchSearch && matchPos && matchAge && matchStatus && matchValue;
  }).sort((a, b) => {
    if (sortBy === "overall") return b.overall - a.overall;
    if (sortBy === "value") return b.aiValue - a.aiValue;
    if (sortBy === "potential") return b.aiScoutReport.potential - a.aiScoutReport.potential;
    if (sortBy === "age") return a.age - b.age;
    return 0;
  });

  const formatValue = (v: number) => isAr ? `${v.toLocaleString()} ج.م` : `${v.toLocaleString()} EGP`;

  const getStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      available: { bg: "bg-green-100", text: "text-green-700", label: isAr ? "متاح" : "Available" },
      under_offer: { bg: "bg-yellow-100", text: "text-yellow-700", label: isAr ? "تحت عرض" : "Under Offer" },
      transferred: { bg: "bg-gray-100", text: "text-gray-700", label: isAr ? "منتقل" : "Transferred" },
      not_for_sale: { bg: "bg-red-100", text: "text-red-700", label: isAr ? "غير متاح" : "Not For Sale" },
      loan_available: { bg: "bg-blue-100", text: "text-blue-700", label: isAr ? "متاح للإعارة" : "Loan Available" },
    };
    const s = map[status] || map.available;
    return <Badge className={`${s.bg} ${s.text} border-none`}>{s.label}</Badge>;
  };

  const getRecommendationBadge = (rec: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      must_sign: { bg: "bg-green-600", text: "text-white", label: isAr ? "يجب التعاقد" : "Must Sign" },
      highly_recommended: { bg: "bg-blue-600", text: "text-white", label: isAr ? "موصى به بشدة" : "Highly Recommended" },
      recommended: { bg: "bg-purple-600", text: "text-white", label: isAr ? "موصى به" : "Recommended" },
      monitor: { bg: "bg-yellow-600", text: "text-white", label: isAr ? "مراقبة" : "Monitor" },
      pass: { bg: "bg-gray-600", text: "text-white", label: isAr ? "تجاوز" : "Pass" },
    };
    const s = map[rec] || map.monitor;
    return <Badge className={`${s.bg} ${s.text}`}>{s.label}</Badge>;
  };

  const getOfferStatusBadge = (status: string) => {
    const map: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: isAr ? "قيد الانتظار" : "Pending" },
      accepted: { bg: "bg-green-100", text: "text-green-700", label: isAr ? "مقبول" : "Accepted" },
      rejected: { bg: "bg-red-100", text: "text-red-700", label: isAr ? "مرفوض" : "Rejected" },
      negotiating: { bg: "bg-blue-100", text: "text-blue-700", label: isAr ? "تفاوض" : "Negotiating" },
      withdrawn: { bg: "bg-gray-100", text: "text-gray-700", label: isAr ? "مسحوب" : "Withdrawn" },
    };
    const s = map[status] || map.pending;
    return <Badge className={`${s.bg} ${s.text} border-none`}>{s.label}</Badge>;
  };

  const getAvgTechnical = (t: PlayerProfile["technical"]) => Math.round((t.passing + t.shooting + t.dribbling + t.firstTouch + t.crossing + t.heading) / 6);
  const getAvgPhysical = (p: PlayerProfile["physical"]) => Math.round((p.pace + p.stamina + p.strength + p.agility + p.jumping) / 5);
  const getAvgTactical = (t: PlayerProfile["tactical"]) => Math.round((t.positioning + t.vision + t.decisionMaking + t.workRate + t.leadership) / 5);
  const getAvgMental = (m: PlayerProfile["mental"]) => Math.round((m.composure + m.concentration + m.aggression + m.determination) / 4);

  // ═══════════════════════════════════════════════════════════════
  // FULL PLAYER PROFILE MODAL
  // ═══════════════════════════════════════════════════════════════
  const renderFullProfile = () => {
    if (!selectedPlayer || !showFullProfile) return null;
    const p = selectedPlayer;
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-background rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border-4 border-primary/30">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">{p.name[0]}{p.name.split(" ")[1]?.[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">{p.name}</h2>
                <p className="text-muted-foreground">{p.nameEn}</p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary">{p.position}</Badge>
                  <Badge variant="outline">{p.ageGroup}</Badge>
                  {getStatusBadge(p.status)}
                  {getRecommendationBadge(p.aiScoutReport.recommendation)}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowFullProfile(false)}>✕</Button>
          </div>

          {/* Bio Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            {[
              { icon: Calendar, label: isAr ? "العمر" : "Age", value: `${p.age} ${isAr ? "سنة" : "years"}` },
              { icon: Ruler, label: isAr ? "الطول" : "Height", value: `${p.height} cm` },
              { icon: Weight, label: isAr ? "الوزن" : "Weight", value: `${p.weight} kg` },
              { icon: Footprints, label: isAr ? "القدم" : "Foot", value: p.preferredFoot === "right" ? (isAr ? "يمنى" : "Right") : p.preferredFoot === "left" ? (isAr ? "يسرى" : "Left") : (isAr ? "كلتاهما" : "Both") },
              { icon: MapPin, label: isAr ? "الأكاديمية" : "Academy", value: p.academy },
              { icon: FileText, label: isAr ? "نهاية العقد" : "Contract", value: p.contractEnd },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/30 text-center">
                <item.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Season Stats */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{isAr ? "إحصائيات الموسم" : "Season Statistics"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {[
                  { label: isAr ? "مباريات" : "Matches", value: p.seasonStats.matches, color: "text-blue-600" },
                  { label: isAr ? "أهداف" : "Goals", value: p.seasonStats.goals, color: "text-green-600" },
                  { label: isAr ? "تمريرات حاسمة" : "Assists", value: p.seasonStats.assists, color: "text-purple-600" },
                  { label: isAr ? "شباك نظيفة" : "Clean Sheets", value: p.seasonStats.cleanSheets, color: "text-yellow-600" },
                  { label: isAr ? "دقائق" : "Minutes", value: p.seasonStats.minutesPlayed, color: "text-orange-600" },
                  { label: isAr ? "التقييم" : "Rating", value: p.seasonStats.rating, color: "text-primary" },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Detailed Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Technical */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  {isAr ? "المهارات التقنية" : "Technical"} — {getAvgTechnical(p.technical)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(p.technical).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs w-24 text-muted-foreground capitalize">{key === "firstTouch" ? (isAr ? "لمسة أولى" : "First Touch") : key === "passing" ? (isAr ? "تمرير" : "Passing") : key === "shooting" ? (isAr ? "تسديد" : "Shooting") : key === "dribbling" ? (isAr ? "مراوغة" : "Dribbling") : key === "crossing" ? (isAr ? "عرضيات" : "Crossing") : (isAr ? "رأسيات" : "Heading")}</span>
                    <Progress value={val} className="flex-1 h-2" />
                    <span className="text-xs font-bold w-8">{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            {/* Physical */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-700 dark:text-green-500" />
                  {isAr ? "القدرات البدنية" : "Physical"} — {getAvgPhysical(p.physical)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(p.physical).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs w-24 text-muted-foreground capitalize">{key === "pace" ? (isAr ? "سرعة" : "Pace") : key === "stamina" ? (isAr ? "تحمل" : "Stamina") : key === "strength" ? (isAr ? "قوة" : "Strength") : key === "agility" ? (isAr ? "رشاقة" : "Agility") : (isAr ? "قفز" : "Jumping")}</span>
                    <Progress value={val} className="flex-1 h-2" />
                    <span className="text-xs font-bold w-8">{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            {/* Tactical */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  {isAr ? "الوعي التكتيكي" : "Tactical"} — {getAvgTactical(p.tactical)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(p.tactical).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs w-24 text-muted-foreground capitalize">{key === "positioning" ? (isAr ? "تمركز" : "Positioning") : key === "vision" ? (isAr ? "رؤية" : "Vision") : key === "decisionMaking" ? (isAr ? "قرارات" : "Decisions") : key === "workRate" ? (isAr ? "معدل عمل" : "Work Rate") : (isAr ? "قيادة" : "Leadership")}</span>
                    <Progress value={val} className="flex-1 h-2" />
                    <span className="text-xs font-bold w-8">{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            {/* Mental */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Brain className="h-4 w-4 text-orange-700 dark:text-orange-500" />
                  {isAr ? "القوة الذهنية" : "Mental"} — {getAvgMental(p.mental)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.entries(p.mental).map(([key, val]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className="text-xs w-24 text-muted-foreground capitalize">{key === "composure" ? (isAr ? "هدوء" : "Composure") : key === "concentration" ? (isAr ? "تركيز" : "Focus") : key === "aggression" ? (isAr ? "شراسة" : "Aggression") : (isAr ? "إصرار" : "Determination")}</span>
                    <Progress value={val} className="flex-1 h-2" />
                    <span className="text-xs font-bold w-8">{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* AI Scout Report */}
          <Card className="mb-6 border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {isAr ? "تقرير الاستكشاف بالذكاء الاصطناعي" : "AI Scouting Report"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
                  <p className="text-3xl font-bold text-primary">{p.aiScoutReport.potential}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "الإمكانية القصوى" : "Max Potential"}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <p className="text-sm font-bold">{p.aiScoutReport.bestRole}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "أفضل دور" : "Best Role"}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30 text-center">
                  <p className="text-sm font-bold text-green-600">{formatValue(p.aiScoutReport.projectedValue12Months)}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "القيمة المتوقعة (12 شهر)" : "Projected Value (12m)"}</p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/20 mb-4">
                <p className="text-sm italic text-muted-foreground">"{p.aiScoutReport.comparison}"</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> {isAr ? "نقاط القوة" : "Strengths"}
                  </h4>
                  <ul className="space-y-1">
                    {p.aiScoutReport.strengths.map((s, i) => (
                      <li key={i} className="text-xs flex items-center gap-1"><Star className="h-3 w-3 text-green-700 dark:text-green-500 shrink-0" />{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-2 text-orange-600 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" /> {isAr ? "مجالات التطوير" : "Areas to Improve"}
                  </h4>
                  <ul className="space-y-1">
                    {p.aiScoutReport.areasToImprove.map((s, i) => (
                      <li key={i} className="text-xs flex items-center gap-1"><Target className="h-3 w-3 text-orange-700 dark:text-orange-500 shrink-0" />{s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Injury History */}
              {p.injuryHistory.length > 0 && (
                <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                  <h4 className="font-semibold text-sm mb-1 text-red-600 flex items-center gap-1">
                    <Heart className="h-4 w-4" /> {isAr ? "سجل الإصابات" : "Injury History"}
                  </h4>
                  {p.injuryHistory.map((inj, i) => (
                    <p key={i} className="text-xs text-red-600">{inj.type} — {inj.duration} ({inj.date})</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Market Value */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {isAr ? "القيمة السوقية" : "Market Valuation"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-primary">{formatValue(p.aiValue)}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "القيمة الحالية" : "Current Value"}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold text-muted-foreground">{formatValue(p.previousValue)}</p>
                  <p className="text-xs text-muted-foreground">{isAr ? "القيمة السابقة" : "Previous Value"}</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className={`text-2xl font-bold ${p.valueChange > 0 ? "text-green-600" : "text-red-600"}`}>
                    {p.valueChange > 0 ? "+" : ""}{p.valueChange.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">{isAr ? "التغيير" : "Change"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {p.status === "available" && (
              <Button className="flex-1" onClick={() => { setShowFullProfile(false); setActiveTab("offers"); }}>
                <Send className="h-4 w-4 mr-2" />
                {isAr ? "تقديم عرض انتقال" : "Submit Transfer Offer"}
              </Button>
            )}
            <Button variant="outline" className="flex-1" onClick={() => {
              if (!comparePlayer1) { setComparePlayer1(p); toast.info(isAr ? "اختر لاعب ثاني للمقارنة" : "Select 2nd player to compare"); }
              else { setComparePlayer2(p); setCompareMode(true); }
              setShowFullProfile(false);
            }}>
              <BarChart3 className="h-4 w-4 mr-2" />
              {isAr ? "إضافة للمقارنة" : "Add to Compare"}
            </Button>
            <Button variant="ghost" onClick={() => setShowFullProfile(false)}>
              {isAr ? "إغلاق" : "Close"}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // COMPARISON VIEW
  // ═══════════════════════════════════════════════════════════════
  const renderComparison = () => {
    if (!compareMode || !comparePlayer1 || !comparePlayer2) return null;
    const p1 = comparePlayer1;
    const p2 = comparePlayer2;
    const metrics = [
      { label: isAr ? "التقييم الكلي" : "Overall", v1: p1.overall, v2: p2.overall },
      { label: isAr ? "تقني" : "Technical", v1: getAvgTechnical(p1.technical), v2: getAvgTechnical(p2.technical) },
      { label: isAr ? "بدني" : "Physical", v1: getAvgPhysical(p1.physical), v2: getAvgPhysical(p2.physical) },
      { label: isAr ? "تكتيكي" : "Tactical", v1: getAvgTactical(p1.tactical), v2: getAvgTactical(p2.tactical) },
      { label: isAr ? "ذهني" : "Mental", v1: getAvgMental(p1.mental), v2: getAvgMental(p2.mental) },
      { label: isAr ? "الإمكانية" : "Potential", v1: p1.aiScoutReport.potential, v2: p2.aiScoutReport.potential },
      { label: isAr ? "أهداف" : "Goals", v1: p1.seasonStats.goals, v2: p2.seasonStats.goals },
      { label: isAr ? "تمريرات حاسمة" : "Assists", v1: p1.seasonStats.assists, v2: p2.seasonStats.assists },
      { label: isAr ? "التقييم" : "Rating", v1: p1.seasonStats.rating * 10, v2: p2.seasonStats.rating * 10 },
    ];
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-background rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{isAr ? "مقارنة اللاعبين" : "Player Comparison"}</h2>
            <Button variant="ghost" size="sm" onClick={() => { setCompareMode(false); setComparePlayer1(null); setComparePlayer2(null); }}>✕</Button>
          </div>

          {/* Player Headers */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-blue-500">
                <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-lg">{p1.name[0]}</AvatarFallback>
              </Avatar>
              <p className="font-bold">{p1.name}</p>
              <p className="text-xs text-muted-foreground">{p1.position} | {p1.ageGroup}</p>
              <Badge className="mt-1 bg-blue-100 text-blue-700">{p1.overall}</Badge>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-2xl font-bold text-muted-foreground">VS</span>
            </div>
            <div className="text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2 border-2 border-red-500">
                <AvatarFallback className="bg-red-100 text-red-700 font-bold text-lg">{p2.name[0]}</AvatarFallback>
              </Avatar>
              <p className="font-bold">{p2.name}</p>
              <p className="text-xs text-muted-foreground">{p2.position} | {p2.ageGroup}</p>
              <Badge className="mt-1 bg-red-100 text-red-700">{p2.overall}</Badge>
            </div>
          </div>

          {/* Comparison Bars */}
          <div className="space-y-3">
            {metrics.map((m, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <div className="flex items-center gap-2 justify-end">
                  <span className={`text-sm font-bold ${m.v1 > m.v2 ? "text-green-600" : m.v1 < m.v2 ? "text-red-600" : ""}`}>{typeof m.v1 === "number" && m.v1 % 1 !== 0 ? m.v1.toFixed(1) : m.v1}</span>
                  <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(m.v1, 99)}%`, marginLeft: "auto" }} />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-20 text-center">{m.label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(m.v2, 99)}%` }} />
                  </div>
                  <span className={`text-sm font-bold ${m.v2 > m.v1 ? "text-green-600" : m.v2 < m.v1 ? "text-red-600" : ""}`}>{typeof m.v2 === "number" && m.v2 % 1 !== 0 ? m.v2.toFixed(1) : m.v2}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Value Comparison */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-center">
              <p className="text-lg font-bold text-blue-600">{formatValue(p1.aiValue)}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "القيمة السوقية" : "Market Value"}</p>
            </div>
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-center">
              <p className="text-lg font-bold text-red-600">{formatValue(p2.aiValue)}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "القيمة السوقية" : "Market Value"}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════
  return (
    <>
      <div className="p-6 max-w-7xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
        {renderFullProfile()}
        {renderComparison()}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <ArrowLeftRight className="h-6 w-6 text-primary" />
                {isAr ? "سوق الانتقالات الداخلي" : "Internal Transfer Market"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {isAr ? "استكشاف اللاعبين، تقارير AI، عروض الانتقال، ومقارنة اللاعبين" : "Scout players, AI reports, transfer offers, and player comparison"}
              </p>
            </div>
          </div>
          {(comparePlayer1 && !comparePlayer2) && (
            <Badge className="bg-blue-100 text-blue-700 animate-pulse">
              {isAr ? `تم اختيار ${comparePlayer1.name} — اختر لاعب ثاني` : `${comparePlayer1.nameEn} selected — pick 2nd`}
            </Badge>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Card className="border-green-200 dark:border-green-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{PLAYER_PROFILES.filter(p => p.status === "available").length}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "متاحون" : "Available"}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 dark:border-yellow-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-600">{TRANSFER_OFFERS.filter(o => o.status === "pending" || o.status === "negotiating").length}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "عروض نشطة" : "Active Offers"}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 dark:border-blue-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{PLAYER_PROFILES.filter(p => p.status === "loan_available").length}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "متاح للإعارة" : "Loan Available"}</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200 dark:border-purple-800">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-purple-600">{TRANSFER_HISTORY.length}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "انتقالات مكتملة" : "Completed"}</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{formatValue(PLAYER_PROFILES.reduce((s, p) => s + p.aiValue, 0))}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي القيمة" : "Total Value"}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="marketplace"><Globe className="h-4 w-4 mr-1" />{isAr ? "السوق" : "Marketplace"}</TabsTrigger>
            <TabsTrigger value="scouting"><Sparkles className="h-4 w-4 mr-1" />{isAr ? "الاستكشاف AI" : "AI Scouting"}</TabsTrigger>
            <TabsTrigger value="offers"><Send className="h-4 w-4 mr-1" />{isAr ? "العروض" : "Offers"}</TabsTrigger>
            <TabsTrigger value="history"><Clock className="h-4 w-4 mr-1" />{isAr ? "السجل" : "History"}</TabsTrigger>
            <TabsTrigger value="valuation"><DollarSign className="h-4 w-4 mr-1" />{isAr ? "التقييم" : "Valuation"}</TabsTrigger>
          </TabsList>

          {/* ═══ MARKETPLACE TAB ═══ */}
          <TabsContent value="marketplace">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-4">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input className="pl-9" placeholder={isAr ? "ابحث بالاسم أو المركز..." : "Search name or position..."} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              <Select value={filterPosition} onValueChange={setFilterPosition}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "كل المراكز" : "All"}</SelectItem>
                  <SelectItem value="ST">{isAr ? "مهاجم" : "ST"}</SelectItem>
                  <SelectItem value="LW">{isAr ? "جناح أيسر" : "LW"}</SelectItem>
                  <SelectItem value="RW">{isAr ? "جناح أيمن" : "RW"}</SelectItem>
                  <SelectItem value="CM">{isAr ? "وسط" : "CM"}</SelectItem>
                  <SelectItem value="CB">{isAr ? "قلب دفاع" : "CB"}</SelectItem>
                  <SelectItem value="RB">{isAr ? "ظهير أيمن" : "RB"}</SelectItem>
                  <SelectItem value="LB">{isAr ? "ظهير أيسر" : "LB"}</SelectItem>
                  <SelectItem value="GK">{isAr ? "حارس" : "GK"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterAge} onValueChange={setFilterAge}>
                <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "كل الأعمار" : "All"}</SelectItem>
                  <SelectItem value="u15">U-15</SelectItem>
                  <SelectItem value="u16">U-16</SelectItem>
                  <SelectItem value="u17">U-17</SelectItem>
                  <SelectItem value="u18">U-18</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "كل الحالات" : "All Status"}</SelectItem>
                  <SelectItem value="available">{isAr ? "متاح" : "Available"}</SelectItem>
                  <SelectItem value="loan_available">{isAr ? "إعارة" : "Loan"}</SelectItem>
                  <SelectItem value="under_offer">{isAr ? "تحت عرض" : "Under Offer"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterValue} onValueChange={setFilterValue}>
                <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "كل القيم" : "All Values"}</SelectItem>
                  <SelectItem value="u50k">{isAr ? "أقل من 50,000" : "Under 50K"}</SelectItem>
                  <SelectItem value="50k-100k">{isAr ? "50,000 – 100,000" : "50K – 100K"}</SelectItem>
                  <SelectItem value="100k-200k">{isAr ? "100,000 – 200,000" : "100K – 200K"}</SelectItem>
                  <SelectItem value="200k+">{isAr ? "أكثر من 200,000" : "200K+"}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">{isAr ? "التقييم" : "Rating"}</SelectItem>
                  <SelectItem value="value">{isAr ? "القيمة" : "Value"}</SelectItem>
                  <SelectItem value="potential">{isAr ? "الإمكانية" : "Potential"}</SelectItem>
                  <SelectItem value="age">{isAr ? "العمر" : "Age"}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Count */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">
                {isAr ? `يظهر ${filteredListings.length} لاعب` : `Showing ${filteredListings.length} player${filteredListings.length !== 1 ? 's' : ''}`}
                {(searchTerm || filterPosition !== 'all' || filterAge !== 'all' || filterStatus !== 'all' || filterValue !== 'all') && (
                  <button onClick={() => { setSearchTerm(''); setFilterPosition('all'); setFilterAge('all'); setFilterStatus('all'); setFilterValue('all'); }} className="ml-2 text-primary hover:underline text-xs">
                    {isAr ? 'إعادة تعيين' : 'Clear filters'}
                  </button>
                )}
              </p>
            </div>
            {/* Player Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredListings.map((player) => (
                <Card key={player.id} className="hover:border-primary/50 transition-colors cursor-pointer group" onClick={() => { setSelectedPlayer(player); setShowFullProfile(true); }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="h-14 w-14 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{player.name[0]}</AvatarFallback>
                          </Avatar>
                          <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">{player.overall}</div>
                        </div>
                        <div>
                          <h3 className="font-bold text-sm">{player.name}</h3>
                          <p className="text-xs text-muted-foreground">{player.nameEn}</p>
                          <div className="flex gap-1 mt-0.5">
                            <Badge variant="secondary" className="text-xs">{player.position}</Badge>
                            <Badge variant="outline" className="text-xs">{player.ageGroup}</Badge>
                          </div>
                        </div>
                      </div>
                      {getStatusBadge(player.status)}
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-4 gap-1 mb-3">
                      {[
                        { label: "TEC", val: getAvgTechnical(player.technical), color: "text-blue-500" },
                        { label: "PHY", val: getAvgPhysical(player.physical), color: "text-green-700 dark:text-green-500" },
                        { label: "TAC", val: getAvgTactical(player.tactical), color: "text-purple-500" },
                        { label: "MEN", val: getAvgMental(player.mental), color: "text-orange-700 dark:text-orange-500" },
                      ].map((s, i) => (
                        <div key={i} className="text-center p-1.5 rounded bg-muted/30">
                          <p className={`text-sm font-bold ${s.color}`}>{s.val}</p>
                          <p className="text-[10px] text-muted-foreground">{s.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Season Performance */}
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3 px-1">
                      <span>{player.seasonStats.matches} {isAr ? "مباراة" : "matches"}</span>
                      <span>{player.seasonStats.goals} {isAr ? "هدف" : "goals"}</span>
                      <span>{player.seasonStats.assists} {isAr ? "صناعة" : "assists"}</span>
                      <span>⭐ {player.seasonStats.rating}</span>
                    </div>

                    {/* AI Value + Potential */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-1">
                        <Brain className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium">{formatValue(player.aiValue)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-green-700 dark:text-green-500" />
                        <span className="text-xs font-medium text-green-600">+{player.valueChange.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-500" />
                        <span className="text-xs font-medium">{player.aiScoutReport.potential}</span>
                      </div>
                    </div>

                    {/* AI Recommendation */}
                    <div className="mt-2 flex items-center justify-between">
                      {getRecommendationBadge(player.aiScoutReport.recommendation)}
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                        {isAr ? "عرض الملف الكامل" : "View Full Profile"} <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ═══ AI SCOUTING TAB ═══ */}
          <TabsContent value="scouting">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Prospects */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-700 dark:text-yellow-500" />
                    {isAr ? "أفضل المواهب (Must Sign)" : "Top Prospects (Must Sign)"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {PLAYER_PROFILES.filter(p => p.aiScoutReport.recommendation === "must_sign").map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20 cursor-pointer hover:bg-green-100/50" onClick={() => { setSelectedPlayer(p); setShowFullProfile(true); }}>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-green-100 text-green-700 font-bold">{p.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.position} | {p.ageGroup} | {isAr ? "إمكانية:" : "Potential:"} {p.aiScoutReport.potential}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">{formatValue(p.aiValue)}</p>
                        <p className="text-xs text-green-600">+{p.valueChange.toFixed(0)}%</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Value Risers */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-700 dark:text-green-500" />
                    {isAr ? "أكبر ارتفاع في القيمة" : "Biggest Value Risers"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...PLAYER_PROFILES].sort((a, b) => b.valueChange - a.valueChange).slice(0, 4).map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border cursor-pointer hover:bg-muted/30" onClick={() => { setSelectedPlayer(p); setShowFullProfile(true); }}>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{p.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.position} | {p.academy}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">+{p.valueChange.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">{formatValue(p.previousValue)} → {formatValue(p.aiValue)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Position Needs */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {isAr ? "تحليل الاحتياجات حسب المركز" : "Position Needs Analysis"}
                  </CardTitle>
                  <CardDescription>{isAr ? "بناءً على تحليل AI لتشكيلة فريقك الحالية" : "Based on AI analysis of your current squad"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { pos: isAr ? "مهاجم" : "Striker", need: "high", reason: isAr ? "هداف واحد فقط بأكثر من 10 أهداف" : "Only 1 striker with 10+ goals", available: 1 },
                      { pos: isAr ? "جناح أيسر" : "Left Wing", need: "medium", reason: isAr ? "لاعب واحد متخصص" : "Only 1 specialist", available: 1 },
                      { pos: isAr ? "ظهير أيمن" : "Right Back", need: "low", reason: isAr ? "مغطى بلاعبين" : "Well covered", available: 1 },
                      { pos: isAr ? "حارس مرمى" : "Goalkeeper", need: "medium", reason: isAr ? "الحارس الأساسي كبير في السن" : "Main GK aging out", available: 1 },
                    ].map((item, i) => (
                      <div key={i} className={`p-4 rounded-xl border ${item.need === "high" ? "border-red-300 bg-red-50 dark:bg-red-950/20" : item.need === "medium" ? "border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20" : "border-green-300 bg-green-50 dark:bg-green-950/20"}`}>
                        <p className="font-bold text-sm">{item.pos}</p>
                        <Badge className={`mt-1 ${item.need === "high" ? "bg-red-600 text-white" : item.need === "medium" ? "bg-yellow-600 text-black" : "bg-green-600 text-white"}`}>
                          {item.need === "high" ? (isAr ? "أولوية عالية" : "High Priority") : item.need === "medium" ? (isAr ? "أولوية متوسطة" : "Medium") : (isAr ? "أولوية منخفضة" : "Low")}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2">{item.reason}</p>
                        <p className="text-xs mt-1">{item.available} {isAr ? "متاح في السوق" : "available"}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══ OFFERS TAB ═══ */}
          <TabsContent value="offers">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Submit Offer Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5 text-primary" />
                    {isAr ? "تقديم عرض انتقال" : "Submit Transfer Offer"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label>{isAr ? "اللاعب" : "Player"}</Label>
                      <Select value={selectedPlayer ? String(selectedPlayer.id) : ""} onValueChange={v => setSelectedPlayer(PLAYER_PROFILES.find(p => String(p.id) === v) || null)}>
                        <SelectTrigger><SelectValue placeholder={isAr ? "اختر لاعباً" : "Select player"} /></SelectTrigger>
                        <SelectContent>
                          {PLAYER_PROFILES.filter(p => p.status === "available" || p.status === "loan_available").map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.name} — {p.position} ({p.ageGroup})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPlayer && (
                      <div className="p-3 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold">{selectedPlayer.name}</p>
                            <p className="text-xs text-muted-foreground">{selectedPlayer.position} | {selectedPlayer.ageGroup} | {selectedPlayer.academy}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-primary">{formatValue(selectedPlayer.aiValue)}</p>
                            <p className="text-xs text-muted-foreground">{isAr ? "القيمة السوقية" : "Market Value"}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>{isAr ? "نوع العرض" : "Offer Type"}</Label>
                      <Select value={offerType} onValueChange={setOfferType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="permanent">{isAr ? "انتقال دائم" : "Permanent Transfer"}</SelectItem>
                          <SelectItem value="loan">{isAr ? "إعارة" : "Loan"}</SelectItem>
                          <SelectItem value="loan_with_option">{isAr ? "إعارة مع خيار شراء" : "Loan with Buy Option"}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {offerType !== "loan" && (
                      <div>
                        <Label>{isAr ? "قيمة العرض (ج.م)" : "Offer Amount (EGP)"}</Label>
                        <Input type="number" value={offerAmount} onChange={e => setOfferAmount(e.target.value)} placeholder={selectedPlayer ? String(Math.round(selectedPlayer.aiValue * 0.9)) : ""} />
                        {selectedPlayer && offerAmount && Number(offerAmount) < selectedPlayer.aiValue * 0.7 && (
                          <p className="text-xs text-yellow-600 mt-1">⚠️ {isAr ? "العرض أقل من 70% من القيمة السوقية — احتمال الرفض عالي" : "Offer below 70% of market value — high rejection risk"}</p>
                        )}
                      </div>
                    )}

                    {(offerType === "loan" || offerType === "loan_with_option") && (
                      <div>
                        <Label>{isAr ? "مدة الإعارة (أشهر)" : "Loan Duration (months)"}</Label>
                        <Select value={loanDuration} onValueChange={setLoanDuration}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="3">3 {isAr ? "أشهر" : "months"}</SelectItem>
                            <SelectItem value="6">6 {isAr ? "أشهر" : "months"}</SelectItem>
                            <SelectItem value="12">12 {isAr ? "شهر" : "months"}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {offerType === "loan_with_option" && (
                      <div>
                        <Label>{isAr ? "قيمة خيار الشراء (ج.م)" : "Buy Option Amount (EGP)"}</Label>
                        <Input type="number" value={buyOptionAmount} onChange={e => setBuyOptionAmount(e.target.value)} />
                      </div>
                    )}

                    <div>
                      <Label>{isAr ? "ملاحظات" : "Notes"}</Label>
                      <Textarea value={offerNote} onChange={e => setOfferNote(e.target.value)} placeholder={isAr ? "أسباب الاهتمام، خطة التطوير المقترحة..." : "Reasons for interest, proposed development plan..."} rows={3} />
                    </div>

                    <Button className="w-full" onClick={() => {
                      if (!selectedPlayer) { toast.error(isAr ? "اختر لاعباً" : "Select a player"); return; }
                      if (offerType !== "loan" && !offerAmount) { toast.error(isAr ? "أدخل قيمة العرض" : "Enter offer amount"); return; }
                      toast.success(isAr ? `تم إرسال العرض لـ ${selectedPlayer.academy} بنجاح` : `Offer sent to ${selectedPlayer.academy} successfully`);
                      setOfferAmount(""); setOfferNote(""); setBuyOptionAmount("");
                    }}>
                      <Send className="h-4 w-4 mr-2" />
                      {isAr ? "إرسال العرض" : "Submit Offer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Active Offers */}
              <Card>
                <CardHeader>
                  <CardTitle>{isAr ? "العروض النشطة" : "Active Offers"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {TRANSFER_OFFERS.map((offer) => (
                    <div key={offer.id} className="p-4 rounded-xl border border-border">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{offer.player}</p>
                          <p className="text-xs text-muted-foreground">
                            {isAr ? "من:" : "From:"} {offer.fromAcademy} → {offer.toAcademy}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {offer.offerType === "permanent" ? (isAr ? "انتقال دائم" : "Permanent") : offer.offerType === "loan" ? (isAr ? `إعارة ${offer.loanDuration}` : `Loan ${offer.loanDuration}`) : (isAr ? `إعارة + خيار شراء ${formatValue(offer.buyOption || 0)}` : `Loan + Buy ${formatValue(offer.buyOption || 0)}`)}
                          </p>
                        </div>
                        <div className="text-right">
                          {offer.amount > 0 && <p className="font-bold text-primary">{formatValue(offer.amount)}</p>}
                          {getOfferStatusBadge(offer.status)}
                          <p className="text-xs text-muted-foreground mt-1">{isAr ? "ينتهي:" : "Expires:"} {offer.expiresIn}</p>
                        </div>
                      </div>
                      {offer.counterOffer && (
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 mb-2">
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            {isAr ? `عرض مضاد: ${formatValue(offer.counterOffer)}` : `Counter offer: ${formatValue(offer.counterOffer)}`}
                          </p>
                        </div>
                      )}
                      {offer.status === "pending" && (
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => toast.success(isAr ? "تم قبول العرض" : "Offer accepted")}>
                            <CheckCircle className="h-4 w-4 mr-1" />{isAr ? "قبول" : "Accept"}
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.info(isAr ? "أدخل عرضك المضاد" : "Enter counter offer")}>
                            {isAr ? "تفاوض" : "Counter"}
                          </Button>
                          <Button size="sm" variant="destructive" className="flex-1" onClick={() => toast.info(isAr ? "تم رفض العرض" : "Offer rejected")}>
                            <XCircle className="h-4 w-4 mr-1" />{isAr ? "رفض" : "Reject"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══ HISTORY TAB ═══ */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {isAr ? "سجل الانتقالات الكامل" : "Complete Transfer History"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {TRANSFER_HISTORY.map((t, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">{t.player[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{t.player}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <span>{t.from}</span>
                          <ArrowLeftRight className="h-3 w-3" />
                          <span>{t.to}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{formatValue(t.value)}</p>
                        <p className="text-xs text-muted-foreground">{t.date}</p>
                      </div>
                      <Badge className={t.type === "professional" ? "bg-purple-100 text-purple-700" : t.type === "loan" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}>
                        {t.type === "professional" ? (isAr ? "احترافي" : "Professional") : t.type === "loan" ? (isAr ? "إعارة" : "Loan") : (isAr ? "أكاديمي" : "Academy")}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ VALUATION TAB ═══ */}
          <TabsContent value="valuation">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    {isAr ? "تقييم القيمة السوقية بالذكاء الاصطناعي" : "AI Market Valuation"}
                  </CardTitle>
                  <CardDescription>{isAr ? "العوامل المؤثرة في تحديد القيمة السوقية" : "Factors influencing market value determination"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { factor: isAr ? "العمر والإمكانية" : "Age & Potential", weight: 25, desc: isAr ? "اللاعبون الأصغر سناً بإمكانية عالية يحصلون على تقييم أعلى" : "Younger players with high potential get higher valuations" },
                      { factor: isAr ? "الأداء الموسمي" : "Season Performance", weight: 30, desc: isAr ? "الأهداف، التمريرات، التقييم، الدقائق" : "Goals, assists, rating, minutes played" },
                      { factor: isAr ? "المهارات التقنية" : "Technical Skills", weight: 20, desc: isAr ? "التمرير، التسديد، المراوغة، اللمسة الأولى" : "Passing, shooting, dribbling, first touch" },
                      { factor: isAr ? "القدرات البدنية" : "Physical Attributes", weight: 15, desc: isAr ? "السرعة، القوة، التحمل، الرشاقة" : "Pace, strength, stamina, agility" },
                      { factor: isAr ? "مدة العقد" : "Contract Length", weight: 10, desc: isAr ? "عقد أطول = قيمة أعلى" : "Longer contract = higher value" },
                    ].map((item, i) => (
                      <div key={i}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{item.factor}</span>
                          <span className="text-sm font-bold text-primary">{item.weight}%</span>
                        </div>
                        <Progress value={item.weight} className="h-2 mb-1" />
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    {isAr ? "ترتيب اللاعبين حسب القيمة" : "Player Value Rankings"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[...PLAYER_PROFILES].sort((a, b) => b.aiValue - a.aiValue).map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedPlayer(p); setShowFullProfile(true); }}>
                        <span className="text-lg font-bold text-muted-foreground w-6">#{i + 1}</span>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{p.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.position} | {p.ageGroup}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{formatValue(p.aiValue)}</p>
                          <p className={`text-xs ${p.valueChange > 0 ? "text-green-600" : "text-red-600"}`}>
                            {p.valueChange > 0 ? "↑" : "↓"} {p.valueChange.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
