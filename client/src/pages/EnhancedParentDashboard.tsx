import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BackButton } from "@/components/BackButton";
import {
  Users, Bell, Activity, CreditCard, MessageSquare,
  CheckCircle, XCircle, Clock, Star, TrendingUp, Calendar,
  Trophy, AlertTriangle, Heart, Loader2, Swords, Stethoscope, BarChart2
} from "lucide-react";

export default function EnhancedParentDashboard() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);

  const { data: parentData, isLoading: dashLoading } = trpc.parentDashboard.getDashboardData.useQuery();
  const children = (parentData?.children || []) as any[];
  const activeChildId = selectedChildId ?? children[0]?.playerId ?? null;
  const activeChild = children.find((c: any) => c.playerId === activeChildId) ?? children[0];

  const { data: childData, isLoading: childLoading } = trpc.parentDashboard.getChildData.useQuery(
    { playerId: activeChildId! },
    { enabled: !!activeChildId }
  );

  const getStatusIcon = (status: string) => {
    if (status === "present") return <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-500" />;
    if (status === "absent") return <XCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-yellow-700 dark:text-yellow-500" />;
  };
  const getStatusBadge = (status: string) => {
    if (status === "present") return <Badge className="bg-green-100 text-green-700">{isAr ? "حاضر" : "Present"}</Badge>;
    if (status === "absent") return <Badge className="bg-red-100 text-red-700">{isAr ? "غائب" : "Absent"}</Badge>;
    return <Badge className="bg-yellow-100 text-yellow-700">{isAr ? "متأخر" : "Late"}</Badge>;
  };

  if (dashLoading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6" dir={isAr ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-2xl font-bold">{isAr ? "بوابة ولي الأمر" : "Parent Portal"}</h1>
              <p className="text-muted-foreground text-sm">{isAr ? "تابع تطور أبنائك" : "Track your children's progress"}</p>
            </div>
          </div>
          {children.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{isAr ? "اختر الابن:" : "Select child:"}</span>
              <Select value={activeChildId?.toString() ?? ""} onValueChange={(v) => setSelectedChildId(Number(v))}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder={isAr ? "اختر..." : "Select..."} />
                </SelectTrigger>
                <SelectContent>
                  {children.map((c: any) => (
                    <SelectItem key={c.playerId} value={c.playerId.toString()}>
                      {c.playerName || `${c.firstName || ""} ${c.lastName || ""}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {children.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{isAr ? "لا يوجد أبناء مرتبطون" : "No children linked"}</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {isAr ? "تواصل مع إدارة الأكاديمية لربط حساب ابنك" : "Contact the academy to link your child's account."}
              </p>
            </CardContent>
          </Card>
        )}

        {activeChild && (
          <>
            {/* Child Card */}
            <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  <Avatar className="h-20 w-20 border-4 border-primary/20">
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {(activeChild.firstName || "P")[0]}{(activeChild.lastName || "")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold">{activeChild.playerName || `${activeChild.firstName || ""} ${activeChild.lastName || ""}`}</h2>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {activeChild.playerPosition && <Badge variant="outline">{activeChild.playerPosition}</Badge>}
                      {activeChild.ageGroup && <Badge variant="outline">{activeChild.ageGroup}</Badge>}
                      {activeChild.playerTeam && <Badge className="bg-blue-100 text-blue-700">{activeChild.playerTeam}</Badge>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: isAr ? "التقييم" : "Rating", value: activeChild.overallRating || 0, color: "text-primary" },
                      { label: isAr ? "الحضور" : "Attendance", value: `${childData?.attendance?.rate ?? 0}%`, color: "text-green-600" },
                      { label: isAr ? "المباريات" : "Matches", value: childData?.matchHistory?.length ?? 0, color: "text-blue-600" },
                      { label: isAr ? "إصابات نشطة" : "Injuries", value: childData?.injuries?.filter((i: any) => i.status === "active").length ?? 0, color: "text-orange-600" },
                    ].map((s, i) => (
                      <div key={i} className="text-center">
                        <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                        <div className="text-xs text-muted-foreground">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 sm:grid-cols-5 w-full">
                <TabsTrigger value="overview"><BarChart2 className="h-4 w-4 mr-1" />{isAr ? "نظرة عامة" : "Overview"}</TabsTrigger>
                <TabsTrigger value="attendance"><Calendar className="h-4 w-4 mr-1" />{isAr ? "الحضور" : "Attendance"}</TabsTrigger>
                <TabsTrigger value="feedback"><MessageSquare className="h-4 w-4 mr-1" />{isAr ? "ملاحظات المدرب" : "Coach Notes"}</TabsTrigger>
                <TabsTrigger value="matches"><Swords className="h-4 w-4 mr-1" />{isAr ? "المباريات" : "Matches"}</TabsTrigger>
                <TabsTrigger value="fees"><CreditCard className="h-4 w-4 mr-1" />{isAr ? "الرسوم" : "Fees"}</TabsTrigger>
              </TabsList>

              {/* OVERVIEW */}
              <TabsContent value="overview" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-base">{isAr ? "مستوى المهارات" : "Skills Level"}</CardTitle></CardHeader>
                    <CardContent>
                      {[
                        { label: isAr ? "تقني" : "Technical", value: activeChild.technicalAvg || 0 },
                        { label: isAr ? "بدني" : "Physical", value: activeChild.physicalAvg || 0 },
                        { label: isAr ? "تكتيكي" : "Tactical", value: activeChild.tacticalAvg || 0 },
                        { label: isAr ? "ذهني" : "Mental", value: activeChild.mentalAvg || 0 },
                      ].map((s) => (
                        <div key={s.label} className="mb-3">
                          <div className="flex justify-between text-sm mb-1"><span>{s.label}</span><span className="font-semibold">{s.value}/100</span></div>
                          <Progress value={s.value} className="h-2" />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base">{isAr ? "الجلسات القادمة" : "Upcoming Sessions"}</CardTitle></CardHeader>
                    <CardContent>
                      {childLoading ? <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                        : childData?.upcomingSessions?.length ? (
                          <div className="space-y-3">
                            {childData.upcomingSessions.map((s: any) => (
                              <div key={s.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                                <Calendar className="h-4 w-4 text-primary shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{s.title}</p>
                                  <p className="text-xs text-muted-foreground">{s.sessionDate ? new Date(s.sessionDate).toLocaleDateString(isAr ? "ar-EG" : "en-US") : ""}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : <div className="text-center py-8 text-muted-foreground text-sm">{isAr ? "لا توجد جلسات قادمة" : "No upcoming sessions"}</div>}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Stethoscope className="h-4 w-4 text-red-500" />{isAr ? "الإصابات" : "Injuries"}</CardTitle></CardHeader>
                    <CardContent>
                      {childLoading ? <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin" /></div>
                        : childData?.injuries?.length ? (
                          <div className="space-y-3">
                            {childData.injuries.map((inj: any) => (
                              <div key={inj.id} className="flex items-start gap-3 p-2 rounded-lg bg-red-50 border border-red-100">
                                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{inj.injuryType} — {inj.bodyPart}</p>
                                  <p className="text-xs text-muted-foreground">{inj.injuryDate ? new Date(inj.injuryDate).toLocaleDateString(isAr ? "ar-EG" : "en-US") : ""}</p>
                                </div>
                                <Badge className={inj.status === "active" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}>{inj.status}</Badge>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            <Heart className="h-8 w-8 mx-auto mb-2 text-green-700 dark:text-green-400" />
                            {isAr ? "لا توجد إصابات — الابن بصحة جيدة!" : "No injuries — your child is healthy!"}
                          </div>
                        )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader><CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" />{isAr ? "الإشعارات الأخيرة" : "Recent Notifications"}</CardTitle></CardHeader>
                    <CardContent>
                      {parentData?.recentNotifications?.length ? (
                        <div className="space-y-2">
                          {(parentData.recentNotifications as any[]).slice(0, 5).map((n: any) => (
                            <div key={n.id} className={`flex items-start gap-2 p-2 rounded-lg ${!n.isRead ? "bg-primary/5 border border-primary/10" : "bg-muted/30"}`}>
                              <Bell className="h-3 w-3 mt-1 text-primary shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{n.message}</p>
                                <p className="text-xs text-muted-foreground">{n.createdAt ? new Date(n.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US") : ""}</p>
                              </div>
                              {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0" />}
                            </div>
                          ))}
                        </div>
                      ) : <div className="text-center py-8 text-muted-foreground text-sm">{isAr ? "لا توجد إشعارات" : "No notifications"}</div>}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* ATTENDANCE */}
              <TabsContent value="attendance" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: isAr ? "نسبة الحضور" : "Rate", value: `${childData?.attendance?.rate ?? 0}%`, color: "text-green-600" },
                    { label: isAr ? "إجمالي الجلسات" : "Total", value: childData?.attendance?.total ?? 0, color: "text-blue-600" },
                    { label: isAr ? "حاضر" : "Present", value: childData?.attendance?.present ?? 0, color: "text-green-600" },
                    { label: isAr ? "غائب" : "Absent", value: childData?.attendance?.absent ?? 0, color: "text-red-600" },
                  ].map((s, i) => (
                    <Card key={i}><CardContent className="pt-6 text-center"><div className={`text-3xl font-bold ${s.color}`}>{s.value}</div><div className="text-sm text-muted-foreground mt-1">{s.label}</div></CardContent></Card>
                  ))}
                </div>
                <Card>
                  <CardHeader><CardTitle className="text-base">{isAr ? "سجل الحضور الأخير" : "Recent Attendance"}</CardTitle></CardHeader>
                  <CardContent>
                    {childLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                      : childData?.attendance?.recent?.length ? (
                        <div className="space-y-2">
                          {childData.attendance.recent.map((rec: any, i: number) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
                              {getStatusIcon(rec.status)}
                              <div className="flex-1">
                                <p className="text-sm font-medium">{rec.sessionDate ? new Date(rec.sessionDate).toLocaleDateString(isAr ? "ar-EG" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : ""}</p>
                                <p className="text-xs text-muted-foreground">{rec.sessionType}</p>
                              </div>
                              {getStatusBadge(rec.status)}
                            </div>
                          ))}
                        </div>
                      ) : <div className="text-center py-12 text-muted-foreground"><Calendar className="h-10 w-10 mx-auto mb-3 opacity-40" /><p>{isAr ? "لا توجد سجلات حضور بعد" : "No attendance records yet"}</p></div>}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* COACH NOTES */}
              <TabsContent value="feedback" className="space-y-4 mt-4">
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><MessageSquare className="h-4 w-4 text-primary" />{isAr ? "ملاحظات المدرب" : "Coach Feedback"}</CardTitle></CardHeader>
                  <CardContent>
                    {childLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                      : childData?.feedback?.length ? (
                        <div className="space-y-4">
                          {childData.feedback.map((fb: any) => (
                            <div key={fb.id} className="p-4 rounded-lg border bg-card">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8"><AvatarFallback className="text-xs">{(fb.coachName || "C")[0]}</AvatarFallback></Avatar>
                                  <div>
                                    <p className="text-sm font-semibold">{fb.coachName || (isAr ? "المدرب" : "Coach")}</p>
                                    <p className="text-xs text-muted-foreground">{fb.feedbackDate ? new Date(fb.feedbackDate).toLocaleDateString(isAr ? "ar-EG" : "en-US") : ""}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`h-4 w-4 ${i < Math.round((fb.rating || 0) / 2) ? "text-yellow-700 dark:text-yellow-400 fill-yellow-400" : "text-foreground"}`} />
                                  ))}
                                  <span className="text-sm font-semibold ml-1">{fb.rating || 0}/10</span>
                                </div>
                              </div>
                              <Badge variant="outline" className="mb-3 text-xs">{fb.category}</Badge>
                              {fb.strengths && <div className="mb-2"><p className="text-xs font-semibold text-green-600 mb-1">{isAr ? "نقاط القوة:" : "Strengths:"}</p><p className="text-sm text-muted-foreground">{fb.strengths}</p></div>}
                              {fb.areasToImprove && <div className="mb-2"><p className="text-xs font-semibold text-orange-600 mb-1">{isAr ? "مجالات التحسين:" : "Areas to Improve:"}</p><p className="text-sm text-muted-foreground">{fb.areasToImprove}</p></div>}
                              {fb.recommendations && <div><p className="text-xs font-semibold text-blue-600 mb-1">{isAr ? "التوصيات:" : "Recommendations:"}</p><p className="text-sm text-muted-foreground">{fb.recommendations}</p></div>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
                          <p className="font-medium">{isAr ? "لا توجد ملاحظات من المدرب بعد" : "No coach feedback yet"}</p>
                          <p className="text-sm mt-1">{isAr ? "سيظهر هنا ملاحظات المدرب عندما يتم مشاركتها معك" : "Coach notes will appear here when shared with you"}</p>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* MATCHES */}
              <TabsContent value="matches" className="space-y-4 mt-4">
                <Card>
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Swords className="h-4 w-4 text-primary" />{isAr ? "تاريخ المباريات" : "Match History"}</CardTitle></CardHeader>
                  <CardContent>
                    {childLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                      : childData?.matchHistory?.length ? (
                        <div className="space-y-3">
                          {childData.matchHistory.map((m: any) => (
                            <div key={m.id} className="p-4 rounded-lg border">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <p className="text-sm font-semibold">{m.homeTeam} <span className="text-muted-foreground">vs</span> {m.awayTeam}</p>
                                  <p className="text-xs text-muted-foreground">{m.matchDate ? new Date(m.matchDate).toLocaleDateString(isAr ? "ar-EG" : "en-US") : ""}</p>
                                </div>
                                <div className="text-lg font-bold">{m.homeScore ?? "-"} : {m.awayScore ?? "-"}</div>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                                {[
                                  { label: isAr ? "دقائق" : "Mins", value: m.minutesPlayed ?? 0 },
                                  { label: isAr ? "أهداف" : "Goals", value: m.goals ?? 0 },
                                  { label: isAr ? "تمريرات حاسمة" : "Assists", value: m.assists ?? 0 },
                                  { label: isAr ? "تقييم" : "Rating", value: m.coachRating ? `${m.coachRating}/10` : "-" },
                                ].map((s, i) => (
                                  <div key={i} className="text-center p-2 bg-muted/50 rounded">
                                    <div className="text-base font-bold">{s.value}</div>
                                    <div className="text-xs text-muted-foreground">{s.label}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-muted-foreground">
                          <Trophy className="h-10 w-10 mx-auto mb-3 opacity-40" />
                          <p>{isAr ? "لا توجد مباريات مسجلة بعد" : "No match history yet"}</p>
                        </div>
                      )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* FEES */}
              <TabsContent value="fees" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: isAr ? "إجمالي الرسوم" : "Total Fees", value: `${childData?.fees?.total?.toLocaleString() ?? 0} ${isAr ? "ج.م" : "EGP"}`, color: "text-blue-600" },
                    { label: isAr ? "المدفوع" : "Paid", value: `${childData?.fees?.paid?.toLocaleString() ?? 0} ${isAr ? "ج.م" : "EGP"}`, color: "text-green-600" },
                    { label: isAr ? "المتبقي" : "Pending", value: `${childData?.fees?.pending?.toLocaleString() ?? 0} ${isAr ? "ج.م" : "EGP"}`, color: "text-orange-600" },
                  ].map((s, i) => (
                    <Card key={i}><CardContent className="pt-6 text-center"><div className={`text-2xl font-bold ${s.color}`}>{s.value}</div><div className="text-sm text-muted-foreground mt-1">{s.label}</div></CardContent></Card>
                  ))}
                </div>
                {childData?.fees?.nextDue && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-700 dark:text-orange-500" />
                        <div>
                          <p className="font-semibold text-orange-700">{isAr ? "القسط القادم" : "Next Payment Due"}</p>
                          <p className="text-sm text-orange-600">
                            {isAr ? "المبلغ:" : "Amount:"} {(childData.fees.nextDue as any).amount?.toLocaleString()} {isAr ? "ج.م" : "EGP"} —
                            {isAr ? " تاريخ الاستحقاق:" : " Due:"} {(childData.fees.nextDue as any).dueDate ? new Date((childData.fees.nextDue as any).dueDate).toLocaleDateString(isAr ? "ar-EG" : "en-US") : ""}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                <Card>
                  <CardHeader><CardTitle className="text-base">{isAr ? "سجل الرسوم" : "Fee Records"}</CardTitle></CardHeader>
                  <CardContent>
                    {childLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                      : childData?.fees?.records?.length ? (
                        <div className="space-y-2">
                          {childData.fees.records.map((fee: any) => (
                            <div key={fee.id} className="flex items-center justify-between p-3 rounded-lg border">
                              <div>
                                <p className="text-sm font-medium">{isAr ? `شهر ${fee.month}` : `Month ${fee.month}`}</p>
                                <p className="text-xs text-muted-foreground">{fee.dueDate ? new Date(fee.dueDate).toLocaleDateString(isAr ? "ar-EG" : "en-US") : ""}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-semibold">{fee.amount?.toLocaleString()} {isAr ? "ج.م" : "EGP"}</p>
                                <Badge className={fee.status === "paid" ? "bg-green-100 text-green-700" : fee.status === "overdue" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>{fee.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : <div className="text-center py-12 text-muted-foreground"><CreditCard className="h-10 w-10 mx-auto mb-3 opacity-40" /><p>{isAr ? "لا توجد سجلات رسوم" : "No fee records"}</p></div>}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </>
  );
}
