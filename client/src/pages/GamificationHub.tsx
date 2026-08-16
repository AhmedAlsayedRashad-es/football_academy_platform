import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import {
  Trophy, Star, Award, Zap, Target, Users, Calendar, Gift,
  Crown, Medal, Flame, Shield, CheckCircle, Lock, TrendingUp
} from "lucide-react";

interface Badge {
  id: string;
  name_ar: string;
  name_en: string;
  desc_ar: string;
  desc_en: string;
  icon: string;
  color: string;
  earned: boolean;
  earnedDate?: string;
  progress?: number;
  target?: number;
}

const BADGES: Badge[] = [
  { id: "first_goal", name_ar: "أول هدف", name_en: "First Goal", desc_ar: "سجّل أول هدف في مسيرتك", desc_en: "Score your first goal", icon: "⚽", color: "bg-yellow-100 dark:bg-yellow-500/15 border-yellow-300 dark:border-yellow-500/40", earned: true, earnedDate: "مارس 2025" },
  { id: "100_sessions", name_ar: "100 جلسة", name_en: "100 Sessions", desc_ar: "حضر 100 جلسة تدريبية", desc_en: "Attend 100 training sessions", icon: "💯", color: "bg-blue-100 dark:bg-blue-500/15 border-blue-300 dark:border-blue-500/40", earned: true, earnedDate: "أبريل 2025" },
  { id: "best_player", name_ar: "أفضل لاعب", name_en: "Best Player", desc_ar: "فاز بجائزة أفضل لاعب في الشهر", desc_en: "Won best player of the month", icon: "🏆", color: "bg-purple-100 dark:bg-purple-500/15 border-purple-300 dark:border-purple-500/40", earned: true, earnedDate: "مايو 2025" },
  { id: "perfect_attendance", name_ar: "حضور مثالي", name_en: "Perfect Attendance", desc_ar: "حضر جميع جلسات شهر كامل", desc_en: "Attended all sessions for a full month", icon: "✅", color: "bg-green-100 dark:bg-green-500/15 border-green-300 dark:border-green-500/40", earned: true, earnedDate: "يونيو 2025" },
  { id: "hat_trick", name_ar: "هاتريك", name_en: "Hat-Trick", desc_ar: "سجّل 3 أهداف في مباراة واحدة", desc_en: "Score 3 goals in one match", icon: "🎩", color: "bg-red-100 dark:bg-red-500/15 border-red-300 dark:border-red-500/40", earned: false, progress: 2, target: 3 },
  { id: "assist_king", name_ar: "ملك التمريرات", name_en: "Assist King", desc_ar: "قدّم 10 تمريرات حاسمة في الموسم", desc_en: "Provide 10 assists in the season", icon: "🎯", color: "bg-orange-100 dark:bg-orange-500/15 border-orange-300 dark:border-orange-500/40", earned: false, progress: 7, target: 10 },
  { id: "iron_man", name_ar: "رجل الحديد", name_en: "Iron Man", desc_ar: "لعب 20 مباراة متتالية بدون إصابة", desc_en: "Play 20 consecutive matches without injury", icon: "🦾", color: "bg-gray-100 dark:bg-gray-500/15 border-gray-300 dark:border-gray-500/40", earned: false, progress: 14, target: 20 },
  { id: "speed_demon", name_ar: "عفريت السرعة", name_en: "Speed Demon", desc_ar: "سجّل سرعة 30+ كم/س في التدريب", desc_en: "Record 30+ km/h speed in training", icon: "⚡", color: "bg-yellow-100 dark:bg-yellow-500/15 border-yellow-300 dark:border-yellow-500/40", earned: false, progress: 0, target: 1 },
];

const LEADERBOARD = [
  { rank: 1, name: "أحمد محمد", points: 2450, badges: 8, team: "U-15", avatar: "أ" },
  { rank: 2, name: "كريم علي", points: 2280, badges: 7, team: "U-15", avatar: "ك" },
  { rank: 3, name: "محمد حسن", points: 2100, badges: 6, team: "U-17", avatar: "م" },
  { rank: 4, name: "عمر إبراهيم", points: 1950, badges: 5, team: "U-17", avatar: "ع" },
  { rank: 5, name: "يوسف خالد", points: 1820, badges: 5, team: "U-15", avatar: "ي" },
  { rank: 6, name: "سامي طارق", points: 1700, badges: 4, team: "U-18", avatar: "س" },
  { rank: 7, name: "علي محمود", points: 1580, badges: 4, team: "U-18", avatar: "ع" },
  { rank: 8, name: "حسن أحمد", points: 1420, badges: 3, team: "U-15", avatar: "ح" },
];

const WEEKLY_CHALLENGES = [
  {
    id: 1, title_ar: "تحدي الحضور", title_en: "Attendance Challenge",
    desc_ar: "احضر جميع جلسات هذا الأسبوع", desc_en: "Attend all sessions this week",
    reward: 150, icon: "📅", deadline: "الأحد", progress: 3, target: 4, completed: false,
  },
  {
    id: 2, title_ar: "تحدي الأهداف", title_en: "Goals Challenge",
    desc_ar: "سجّل هدفاً في تدريب هذا الأسبوع", desc_en: "Score a goal in this week's training",
    reward: 200, icon: "⚽", deadline: "الجمعة", progress: 1, target: 1, completed: true,
  },
  {
    id: 3, title_ar: "تحدي اللياقة", title_en: "Fitness Challenge",
    desc_ar: "أكمل 3 جلسات لياقة بدنية هذا الأسبوع", desc_en: "Complete 3 fitness sessions this week",
    reward: 100, icon: "💪", deadline: "السبت", progress: 2, target: 3, completed: false,
  },
  {
    id: 4, title_ar: "تحدي الفريق", title_en: "Team Challenge",
    desc_ar: "فريقك يفوز في مباراة هذا الأسبوع", desc_en: "Your team wins this week's match",
    reward: 300, icon: "🏆", deadline: "السبت", progress: 0, target: 1, completed: false,
  },
];

const REWARDS = [
  { id: 1, name_ar: "خصم 20% على الاشتراك", name_en: "20% Subscription Discount", points: 1000, icon: "💳", available: true },
  { id: 2, name_ar: "قميص الأكاديمية", name_en: "Academy Jersey", points: 2000, icon: "👕", available: true },
  { id: 3, name_ar: "جلسة تدريب خاصة مع المدرب", name_en: "Private Coaching Session", points: 1500, icon: "⚽", available: true },
  { id: 4, name_ar: "شهادة تميز", name_en: "Excellence Certificate", points: 500, icon: "📜", available: true },
  { id: 5, name_ar: "كرة قدم احترافية", name_en: "Professional Football", points: 3000, icon: "🏅", available: false },
];

export default function GamificationHub() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("overview");

  const playerPoints = 2450;
  const earnedBadges = BADGES.filter(b => b.earned);
  const pendingBadges = BADGES.filter(b => !b.earned);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-700 dark:text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-yellow-700 dark:text-yellow-500" />
              {isAr ? "نظام الشارات والإنجازات" : "Badges & Achievements System"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAr
                ? "اكسب نقاطاً، احصل على شارات، وتنافس مع زملائك"
                : "Earn points, collect badges, and compete with teammates"}
            </p>
          </div>
        </div>

        {/* Player Stats Banner */}
        <Card className="brand-gradient-subtle mb-6 border-yellow-300/30">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 border-2 border-yellow-400">
                  <AvatarFallback className="text-xl font-bold bg-yellow-100 text-yellow-700">أ</AvatarFallback>
                </Avatar>
                <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
                  <Crown className="h-3 w-3 text-foreground" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{isAr ? "أحمد محمد" : "Ahmed Mohamed"}</h2>
                <p className="text-sm text-muted-foreground">{isAr ? "المركز الأول في الأكاديمية" : "Rank #1 in Academy"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Flame className="h-4 w-4 text-orange-700 dark:text-orange-500" />
                  <span className="text-sm font-medium text-orange-600">{isAr ? "سلسلة 12 يوم متتالي" : "12-day streak"}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-yellow-600">{playerPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{isAr ? "نقطة" : "Points"}</p>
                <p className="text-xs text-primary mt-1">{earnedBadges.length} {isAr ? "شارة" : "badges"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap h-auto gap-1">
            <TabsTrigger value="overview"><Star className="h-4 w-4 mr-1" />{isAr ? "نظرة عامة" : "Overview"}</TabsTrigger>
            <TabsTrigger value="badges"><Award className="h-4 w-4 mr-1" />{isAr ? "الشارات" : "Badges"}</TabsTrigger>
            <TabsTrigger value="leaderboard"><Trophy className="h-4 w-4 mr-1" />{isAr ? "المتصدرون" : "Leaderboard"}</TabsTrigger>
            <TabsTrigger value="challenges"><Target className="h-4 w-4 mr-1" />{isAr ? "التحديات" : "Challenges"}</TabsTrigger>
            <TabsTrigger value="rewards"><Gift className="h-4 w-4 mr-1" />{isAr ? "المكافآت" : "Rewards"}</TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{isAr ? "آخر الإنجازات" : "Recent Achievements"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {earnedBadges.map((badge) => (
                      <div key={badge.id} className={`flex items-center gap-3 p-3 rounded-xl border ${badge.color}`}>
                        <span className="text-2xl">{badge.icon}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{isAr ? badge.name_ar : badge.name_en}</p>
                          <p className="text-xs text-muted-foreground">{isAr ? badge.desc_ar : badge.desc_en}</p>
                        </div>
                        <div className="text-right">
                          <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-500" />
                          <p className="text-xs text-muted-foreground">{badge.earnedDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{isAr ? "التحديات الأسبوعية" : "Weekly Challenges"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {WEEKLY_CHALLENGES.map((c) => (
                      <div key={c.id} className={`p-3 rounded-xl border ${c.completed ? "bg-green-50 border-green-200 dark:bg-green-950/20" : "bg-muted/20 border-border"}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{c.icon}</span>
                            <div>
                              <p className="font-medium text-sm">{isAr ? c.title_ar : c.title_en}</p>
                              <p className="text-xs text-muted-foreground">{isAr ? c.desc_ar : c.desc_en}</p>
                            </div>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">+{c.reward}</Badge>
                        </div>
                        {!c.completed && (
                          <div>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>{c.progress}/{c.target}</span>
                              <span>{isAr ? `ينتهي: ${c.deadline}` : `Ends: ${c.deadline}`}</span>
                            </div>
                            <Progress value={(c.progress / c.target) * 100} className="h-2" />
                          </div>
                        )}
                        {c.completed && (
                          <div className="flex items-center gap-1 text-green-600 text-xs font-medium">
                            <CheckCircle className="h-4 w-4" />
                            {isAr ? "مكتمل!" : "Completed!"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Badges ── */}
          <TabsContent value="badges">
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-700 dark:text-green-500" />
                  {isAr ? `الشارات المكتسبة (${earnedBadges.length})` : `Earned Badges (${earnedBadges.length})`}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {earnedBadges.map((badge) => (
                    <Card key={badge.id} className={`border-2 ${badge.color} text-center`}>
                      <CardContent className="p-4">
                        <span className="text-4xl block mb-2">{badge.icon}</span>
                        <p className="font-bold text-sm">{isAr ? badge.name_ar : badge.name_en}</p>
                        <p className="text-xs text-muted-foreground mt-1">{badge.earnedDate}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  {isAr ? `الشارات المتبقية (${pendingBadges.length})` : `Remaining Badges (${pendingBadges.length})`}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {pendingBadges.map((badge) => (
                    <Card key={badge.id} className="border-2 border-dashed border-muted-foreground/30 text-center opacity-70">
                      <CardContent className="p-4">
                        <span className="text-4xl block mb-2 grayscale">{badge.icon}</span>
                        <p className="font-bold text-sm">{isAr ? badge.name_ar : badge.name_en}</p>
                        <p className="text-xs text-muted-foreground mt-1">{isAr ? badge.desc_ar : badge.desc_en}</p>
                        {badge.progress !== undefined && badge.target !== undefined && (
                          <div className="mt-2">
                            <Progress value={(badge.progress / badge.target) * 100} className="h-1.5" />
                            <p className="text-xs text-muted-foreground mt-1">{badge.progress}/{badge.target}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ── Leaderboard ── */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-700 dark:text-yellow-500" />
                  {isAr ? "لوحة المتصدرين — موسم 2024/2025" : "Leaderboard — Season 2024/2025"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {LEADERBOARD.map((player) => (
                    <div
                      key={player.rank}
                      className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${player.rank === 1 ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20" : player.rank <= 3 ? "bg-muted/30 border-border" : "bg-muted/10 border-border/50"}`}
                    >
                      <div className="w-8 flex justify-center">
                        {getRankIcon(player.rank)}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={`font-bold ${player.rank === 1 ? "bg-yellow-100 text-yellow-700" : "bg-primary/10 text-primary"}`}>
                          {player.avatar}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{player.name}</p>
                        <p className="text-xs text-muted-foreground">{player.team} • {player.badges} {isAr ? "شارة" : "badges"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-primary">{player.points.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{isAr ? "نقطة" : "pts"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Challenges ── */}
          <TabsContent value="challenges">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {WEEKLY_CHALLENGES.map((c) => (
                <Card key={c.id} className={c.completed ? "border-green-200 bg-green-50/30 dark:bg-green-950/10" : ""}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{c.icon}</span>
                        <div>
                          <h3 className="font-bold">{isAr ? c.title_ar : c.title_en}</h3>
                          <p className="text-sm text-muted-foreground">{isAr ? c.desc_ar : c.desc_en}</p>
                        </div>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 shrink-0">
                        +{c.reward} {isAr ? "نقطة" : "pts"}
                      </Badge>
                    </div>
                    {!c.completed ? (
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{isAr ? "التقدم" : "Progress"}: {c.progress}/{c.target}</span>
                          <span className="text-muted-foreground">{isAr ? `ينتهي: ${c.deadline}` : `Ends: ${c.deadline}`}</span>
                        </div>
                        <Progress value={(c.progress / c.target) * 100} className="h-3" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle className="h-5 w-5" />
                        {isAr ? "تم إكمال التحدي! النقاط أضيفت لرصيدك" : "Challenge completed! Points added to your balance"}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Rewards ── */}
          <TabsContent value="rewards">
            <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
              <div>
                <p className="font-semibold">{isAr ? "رصيدك الحالي" : "Your Current Balance"}</p>
                <p className="text-sm text-muted-foreground">{isAr ? "يمكنك استبدال نقاطك بمكافآت حقيقية" : "Redeem your points for real rewards"}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">{playerPoints.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">{isAr ? "نقطة متاحة" : "available points"}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REWARDS.map((reward) => {
                const canAfford = playerPoints >= reward.points;
                return (
                  <Card key={reward.id} className={!reward.available ? "opacity-50" : ""}>
                    <CardContent className="p-5 text-center">
                      <span className="text-4xl block mb-3">{reward.icon}</span>
                      <h3 className="font-bold mb-1">{isAr ? reward.name_ar : reward.name_en}</h3>
                      <p className="text-lg font-bold text-primary mb-3">{reward.points.toLocaleString()} {isAr ? "نقطة" : "pts"}</p>
                      <Button
                        className="w-full"
                        disabled={!canAfford || !reward.available}
                        variant={canAfford && reward.available ? "default" : "outline"}
                        onClick={() => toast.success(isAr ? `تم استبدال ${reward.name_ar}!` : `Redeemed ${reward.name_en}!`)}
                      >
                        {!reward.available ? (isAr ? "غير متاح" : "Unavailable") :
                         !canAfford ? (isAr ? `تحتاج ${(reward.points - playerPoints).toLocaleString()} نقطة` : `Need ${(reward.points - playerPoints).toLocaleString()} more pts`) :
                         (isAr ? "استبدل الآن" : "Redeem Now")}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
