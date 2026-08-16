import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Wallet, CheckCircle, Clock, AlertTriangle, XCircle, CreditCard,
  Star, Trophy, Target, TrendingUp, Gift, Zap, Crown, Shield,
  Calendar, ChevronRight, ExternalLink, Loader2, User, Activity,
  Award, Flame, BarChart2, ArrowUpRight
, ArrowLeft } from "lucide-react";

const STATUS_CONFIG: Record<string, { en: string; ar: string; icon: typeof CheckCircle; color: string; badge: string }> = {
  paid:    { en: "Paid",    ar: "مدفوع",  icon: CheckCircle,   color: "text-green-600",  badge: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400" },
  pending: { en: "Pending", ar: "معلق",   icon: Clock,         color: "text-amber-600",  badge: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400" },
  overdue: { en: "Overdue", ar: "متأخر",  icon: AlertTriangle, color: "text-red-600",    badge: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400" },
  partial: { en: "Partial", ar: "جزئي",   icon: Clock,         color: "text-blue-600",   badge: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400" },
  waived:  { en: "Waived",  ar: "معفى",   icon: XCircle,       color: "text-muted-foreground",   badge: "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400" },
};

const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function formatEGP(cents: number, ar: boolean) {
  const egp = cents / 100;
  return ar ? `${egp.toLocaleString('ar-EG')} ج.م` : `EGP ${egp.toLocaleString('en-US')}`;
}

function GoalCategoryBadge({ category, ar }: { category: string; ar: boolean }) {
  const map: Record<string, { label: string; labelAr: string; color: string }> = {
    technical: { label: "Technical", labelAr: "فني", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    physical:  { label: "Physical",  labelAr: "بدني", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
    tactical:  { label: "Tactical",  labelAr: "تكتيكي", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    mental:    { label: "Mental",    labelAr: "عقلي", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
  };
  const cfg = map[category] || { label: category, labelAr: category, color: "bg-gray-100 text-gray-600" };
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cfg.color}`}>{ar ? cfg.labelAr : cfg.label}</span>;
}

export default function ParentFeePortal() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const ar = language === "ar";
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  // Fetch parent's children
  const { data: children = [] } = trpc.players.getForParent.useQuery(undefined, { retry: false });
  const activeChild = selectedChildId
    ? (children as any[]).find((c: any) => c.id === selectedChildId)
    : (children as any[])[0];
  const childId = activeChild?.id;

  // Fees
  const { data: fees = [], isLoading: feesLoading } = trpc.finance.getMyFees.useQuery();

  // Child development goals
  const { data: goals = [] } = trpc.playerDevelopmentGoals.getByPlayer.useQuery(
    { playerId: childId! },
    { enabled: !!childId }
  );

  // Child points & gamification
  const { data: pointsData } = trpc.points.getPlayerPoints.useQuery(
    { playerId: childId! },
    { enabled: !!childId }
  );
  const { data: achievements = [] } = trpc.points.getPlayerAchievements.useQuery(
    { playerId: childId! },
    { enabled: !!childId }
  );
  const { data: milestones = [] } = trpc.points.getMilestones.useQuery(
    { playerId: childId! },
    { enabled: !!childId }
  );

  // Subscription plans
  const { data: plans = [] } = trpc.billing.getPlans.useQuery();
  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast({ title: ar ? "جاري التحويل..." : "Redirecting to checkout...", description: ar ? "سيتم فتح صفحة الدفع في تبويب جديد" : "Payment page opening in a new tab" });
        window.open(data.url, "_blank");
      }
    },
    onError: (err) => {
      toast({ title: ar ? "خطأ" : "Error", description: err.message, variant: "destructive" });
    },
    onSettled: () => setLoadingPlan(null),
  });

  const handleSubscribe = (planKey: string) => {
    if (!user) {
      toast({ title: ar ? "يجب تسجيل الدخول أولاً" : "Please log in first", variant: "destructive" });
      return;
    }
    setLoadingPlan(planKey);
    createCheckout.mutate({ planKey: planKey as "monthly" | "quarterly" | "annual" });
  };

  // Fee summary
  const totalDue = (fees as any[]).filter((f: any) => ["pending","overdue","partial"].includes(f.status))
    .reduce((s: number, f: any) => s + (f.amount - (f.paidAmount || 0)), 0);
  const totalPaid = (fees as any[]).filter((f: any) => f.status === "paid")
    .reduce((s: number, f: any) => s + (f.paidAmount || 0), 0);
  const overdueCount = (fees as any[]).filter((f: any) => f.status === "overdue").length;
  const nextDue = (fees as any[]).filter((f: any) => f.status === "pending" || f.status === "overdue")
    .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0];

  // Goals summary
  const activeGoals = (goals as any[]).filter((g: any) => !g.completed);
  const completedGoals = (goals as any[]).filter((g: any) => g.completed);
  const avgProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((s: number, g: any) => s + (g.progress || 0), 0) / activeGoals.length)
    : 0;

  const planIcons: Record<string, any> = {
    monthly: <Zap className="w-5 h-5" />,
    quarterly: <Star className="w-5 h-5" />,
    annual: <Crown className="w-5 h-5" />,
  };
  const planColors: Record<string, string> = {
    monthly: "border-blue-500/40 bg-blue-500/5",
    quarterly: "border-green-500/40 bg-green-500/5",
    annual: "border-amber-500/40 bg-amber-500/5",
  };

  return (
    <>

      <button
        onClick={() => navigate("/parent-portal")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Parent Portal
      </button>
      <div className={`max-w-5xl mx-auto p-6 space-y-6 ${ar ? "rtl" : "ltr"}`}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Wallet className="h-6 w-6 text-emerald-700 dark:text-emerald-500" />
              {ar ? "بوابة الرسوم والمتابعة" : "Parent Fee Portal"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {ar ? "إدارة الرسوم ومتابعة تقدم طفلك" : "Manage fees and track your child's progress"}
            </p>
          </div>
          {/* Child selector */}
          {(children as any[]).length > 1 && (
            <div className="flex gap-2 flex-wrap">
              {(children as any[]).map((child: any) => (
                <Button
                  key={child.id}
                  size="sm"
                  variant={childId === child.id ? "default" : "outline"}
                  onClick={() => setSelectedChildId(child.id)}
                  className="gap-2"
                >
                  <User className="w-3 h-3" />
                  {child.firstName} {child.lastName}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{ar ? "المبلغ المستحق" : "Amount Due"}</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-400">{formatEGP(totalDue, ar)}</p>
              {overdueCount > 0 && (
                <p className="text-xs text-red-600 mt-1">{ar ? `${overdueCount} متأخرة` : `${overdueCount} overdue`}</p>
              )}
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{ar ? "إجمالي المدفوع" : "Total Paid"}</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatEGP(totalPaid, ar)}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{ar ? "الأهداف النشطة" : "Active Goals"}</p>
              <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{activeGoals.length}</p>
              <p className="text-xs text-muted-foreground mt-1">{ar ? `متوسط التقدم ${avgProgress}%` : `Avg. progress ${avgProgress}%`}</p>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{ar ? "النقاط المكتسبة" : "Points Earned"}</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{(pointsData as any)?.totalEarned ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{ar ? `${(achievements as any[]).length} إنجاز` : `${(achievements as any[]).length} achievements`}</p>
            </CardContent>
          </Card>
        </div>

        {/* Next Due Alert */}
        {nextDue && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border ${nextDue.status === "overdue" ? "border-red-300 bg-red-50 dark:bg-red-950/20" : "border-amber-300 bg-amber-50 dark:bg-amber-950/20"}`}>
            <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${nextDue.status === "overdue" ? "text-red-600" : "text-amber-600"}`} />
            <div className="flex-1">
              <p className="font-medium text-sm">
                {ar ? "الدفعة القادمة" : "Next Payment Due"}: {formatEGP(nextDue.amount - (nextDue.paidAmount || 0), ar)}
              </p>
              <p className="text-xs text-muted-foreground">
                {ar ? "تاريخ الاستحقاق" : "Due"}: {new Date(nextDue.dueDate).toLocaleDateString(ar ? "ar-EG" : "en-GB")}
                {nextDue.description && ` — ${nextDue.description}`}
              </p>
            </div>
            <Badge className={STATUS_CONFIG[nextDue.status]?.badge || ""}>
              {ar ? STATUS_CONFIG[nextDue.status]?.ar : STATUS_CONFIG[nextDue.status]?.en}
            </Badge>
          </div>
        )}

        <Tabs defaultValue="fees">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="fees" className="gap-1.5 text-xs sm:text-sm">
              <Wallet className="w-3.5 h-3.5" />{ar ? "الرسوم" : "Fees"}
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-1.5 text-xs sm:text-sm">
              <Target className="w-3.5 h-3.5" />{ar ? "الأهداف" : "Goals"}
            </TabsTrigger>
            <TabsTrigger value="points" className="gap-1.5 text-xs sm:text-sm">
              <Trophy className="w-3.5 h-3.5" />{ar ? "النقاط" : "Points"}
            </TabsTrigger>
            <TabsTrigger value="subscribe" className="gap-1.5 text-xs sm:text-sm">
              <CreditCard className="w-3.5 h-3.5" />{ar ? "الاشتراك" : "Subscribe"}
            </TabsTrigger>
          </TabsList>

          {/* ── FEES TAB ── */}
          <TabsContent value="fees" className="mt-4 space-y-3">
            {feesLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : (fees as any[]).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{ar ? "لا توجد رسوم مسجلة" : "No fees recorded yet"}</p>
                <p className="text-sm mt-1">{ar ? "ستظهر رسوم الاشتراك هنا عند إضافتها" : "Subscription fees will appear here once added"}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(fees as any[]).map((fee: any) => {
                  const cfg = STATUS_CONFIG[fee.status] || STATUS_CONFIG.pending;
                  const Icon = cfg.icon;
                  const d = new Date(fee.dueDate);
                  const monthLabel = ar ? MONTHS_AR[d.getMonth()] : MONTHS_EN[d.getMonth()];
                  return (
                    <div key={fee.id} className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                      <div className="w-12 h-12 rounded-lg bg-muted flex flex-col items-center justify-center text-center flex-shrink-0">
                        <span className="text-xs font-medium text-muted-foreground">{monthLabel}</span>
                        <span className="text-sm font-bold">{d.getFullYear()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{fee.description || (ar ? "رسوم الاشتراك الشهري" : "Monthly Subscription Fee")}</p>
                        <p className="text-xs text-muted-foreground">
                          {ar ? "الاستحقاق" : "Due"}: {d.toLocaleDateString(ar ? "ar-EG" : "en-GB")}
                          {fee.paidDate && ` · ${ar ? "الدفع" : "Paid"}: ${new Date(fee.paidDate).toLocaleDateString(ar ? "ar-EG" : "en-GB")}`}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm">{formatEGP(fee.amount, ar)}</p>
                        {fee.paidAmount > 0 && fee.paidAmount < fee.amount && (
                          <p className="text-xs text-muted-foreground">{ar ? `مدفوع: ${formatEGP(fee.paidAmount, ar)}` : `Paid: ${formatEGP(fee.paidAmount, ar)}`}</p>
                        )}
                      </div>
                      <Badge className={`${cfg.badge} border text-xs flex-shrink-0`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {ar ? cfg.ar : cfg.en}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── GOALS TAB ── */}
          <TabsContent value="goals" className="mt-4 space-y-4">
            {!childId ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{ar ? "لم يتم ربط حساب لاعب بحسابك" : "No player linked to your account"}</p>
              </div>
            ) : (goals as any[]).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{ar ? "لا توجد أهداف تطويرية بعد" : "No development goals yet"}</p>
                <p className="text-sm mt-1">{ar ? "سيضيف المدرب أهداف التطوير لطفلك قريباً" : "Your coach will add development goals soon"}</p>
              </div>
            ) : (
              <>
                {/* Overall progress */}
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{ar ? "التقدم الإجمالي" : "Overall Progress"}</span>
                      <span className="text-sm font-bold text-primary">{avgProgress}%</span>
                    </div>
                    <Progress value={avgProgress} className="h-2" />
                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-blue-500" />{activeGoals.length} {ar ? "نشط" : "active"}</span>
                      <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-green-700 dark:text-green-500" />{completedGoals.length} {ar ? "مكتمل" : "completed"}</span>
                    </div>
                  </CardContent>
                </Card>
                {/* Goals list */}
                <div className="space-y-3">
                  {(goals as any[]).map((goal: any) => (
                    <Card key={goal.id} className={goal.completed ? "opacity-70" : ""}>
                      <CardContent className="pt-4 pb-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <GoalCategoryBadge category={goal.category} ar={ar} />
                              {goal.completed && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">{ar ? "مكتمل" : "Completed"}</Badge>}
                              {goal.priority === "high" && !goal.completed && <Badge className="bg-red-100 text-red-700 text-xs">{ar ? "أولوية عالية" : "High Priority"}</Badge>}
                            </div>
                            <p className="font-medium text-sm">{goal.title}</p>
                            {goal.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{goal.description}</p>}
                            {goal.targetDate && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {ar ? "الهدف" : "Target"}: {new Date(goal.targetDate).toLocaleDateString(ar ? "ar-EG" : "en-GB")}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-lg font-bold text-primary">{goal.progress}%</p>
                          </div>
                        </div>
                        {!goal.completed && (
                          <div className="mt-3">
                            <Progress value={goal.progress || 0} className="h-1.5" />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* ── POINTS & GAMIFICATION TAB ── */}
          <TabsContent value="points" className="mt-4 space-y-4">
            {!childId ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{ar ? "لم يتم ربط حساب لاعب بحسابك" : "No player linked to your account"}</p>
              </div>
            ) : (
              <>
                {/* Points summary */}
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                    <CardContent className="pt-4 pb-4 text-center">
                      <Trophy className="w-6 h-6 text-amber-700 dark:text-amber-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{(pointsData as any)?.totalEarned ?? 0}</p>
                      <p className="text-xs text-muted-foreground">{ar ? "إجمالي النقاط" : "Total Points"}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
                    <CardContent className="pt-4 pb-4 text-center">
                      <Star className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{(pointsData as any)?.currentBalance ?? 0}</p>
                      <p className="text-xs text-muted-foreground">{ar ? "الرصيد الحالي" : "Current Balance"}</p>
                    </CardContent>
                  </Card>
                  <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/20">
                    <CardContent className="pt-4 pb-4 text-center">
                      <Award className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                      <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{(achievements as any[]).length}</p>
                      <p className="text-xs text-muted-foreground">{ar ? "الإنجازات" : "Achievements"}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Milestones */}
                {(milestones as any[]).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-700 dark:text-orange-500" />
                        {ar ? "مسار الإنجازات" : "Milestone Track"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {(milestones as any[]).slice(0, 5).map((m: any) => (
                        <div key={m.threshold} className={`flex items-center gap-3 ${m.earned ? "" : "opacity-50"}`}>
                          <span className="text-xl">{m.icon}</span>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium">{m.title}</span>
                              <span className="text-xs text-muted-foreground">{m.threshold} {ar ? "نقطة" : "pts"}</span>
                            </div>
                            <Progress value={m.progress} className="h-1.5" />
                          </div>
                          {m.earned && <CheckCircle className="w-4 h-4 text-green-700 dark:text-green-500 flex-shrink-0" />}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Recent achievements */}
                {(achievements as any[]).length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-700 dark:text-yellow-500" />
                        {ar ? "آخر الإنجازات" : "Recent Achievements"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-2">
                        {(achievements as any[]).slice(0, 6).map((ach: any) => (
                          <div key={ach.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                            <span className="text-xl">{ach.iconType || "🏅"}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{ach.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{ach.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ── SUBSCRIBE TAB ── */}
          <TabsContent value="subscribe" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              {ar
                ? "اشترك في خطة لتفعيل الوصول الكامل لبوابة اللاعب وتتبع التقدم والتقارير."
                : "Subscribe to a plan to activate full access to the player portal, progress tracking, and reports."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(plans as any[]).map((plan: any) => (
                <Card key={plan.key} className={`border-2 ${planColors[plan.key] || ""} relative`}>
                  {plan.key === "quarterly" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-green-500 text-white text-xs px-3">
                        {ar ? "الأكثر شيوعاً" : "Most Popular"}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2 pt-5">
                    <div className="flex items-center gap-2 mb-1">
                      {planIcons[plan.key]}
                      <CardTitle className="text-base">{ar ? plan.nameAr : plan.name}</CardTitle>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">{Math.round(plan.amount / 100).toLocaleString(ar ? "ar-EG" : "en-US")}</span>
                      <span className="text-sm text-muted-foreground">{ar ? "ج.م" : "EGP"} / {ar ? (plan.interval === "year" ? "سنة" : "شهر") : plan.interval}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <ul className="space-y-1.5">
                      {(ar ? plan.featuresAr : plan.features).map((f: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-700 dark:text-green-500 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full gap-2"
                      onClick={() => handleSubscribe(plan.key)}
                      disabled={!!loadingPlan}
                    >
                      {loadingPlan === plan.key ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />{ar ? "جاري التحويل..." : "Redirecting..."}</>
                      ) : (
                        <><CreditCard className="w-4 h-4" />{ar ? "اشترك الآن" : "Subscribe Now"}<ExternalLink className="w-3 h-3" /></>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {ar ? "الدفع آمن عبر Stripe. يمكن الإلغاء في أي وقت." : "Secure payment via Stripe. Cancel anytime."}
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
