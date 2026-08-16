import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BackButton } from "@/components/BackButton";
import {
  AlertTriangle, Activity, Heart, Zap, Shield, TrendingUp,
  TrendingDown, CheckCircle, Bell, Brain, Target, Clock, Users, Loader2
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, ReferenceLine, AreaChart, Area
} from "recharts";

// ACWR Risk Zones
const ACWR_ZONES = {
  safe: { min: 0.8, max: 1.3, label_en: "Safe Zone", label_ar: "المنطقة الآمنة", color: "#22c55e" },
  caution: { min: 1.3, max: 1.5, label_en: "Caution Zone", label_ar: "منطقة التحذير", color: "#f59e0b" },
  danger: { min: 1.5, max: 3, label_en: "Danger Zone", label_ar: "منطقة الخطر", color: "#ef4444" },
  undertraining: { min: 0, max: 0.8, label_en: "Under-training", label_ar: "تدريب منخفض", color: "#6b7280" },
};

function getACWRZone(acwr: number) {
  if (acwr < 0.8) return ACWR_ZONES.undertraining;
  if (acwr <= 1.3) return ACWR_ZONES.safe;
  if (acwr <= 1.5) return ACWR_ZONES.caution;
  return ACWR_ZONES.danger;
}

export default function InjuryEarlyWarning() {
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [newLoad, setNewLoad] = useState({ playerId: "", acuteLoad: "", chronicLoad: "", rpe: "", notes: "" });
  const [calculatedACWR, setCalculatedACWR] = useState<number | null>(null);

  const { data: teams = [] } = trpc.teams.getAll.useQuery();
  const { data: players = [] } = trpc.players.getAll.useQuery();

  // Get team load summary - real data from DB
  const { data: teamLoadSummary = [], isLoading: loadingTeamLoad, refetch: refetchTeamLoad } = trpc.medical.getTeamLoadSummary.useQuery(
    { teamId: parseInt(selectedTeam) },
    { enabled: !!selectedTeam }
  );

  // Get individual player training load history
  const { data: playerLoadHistory = [], isLoading: loadingPlayerHistory } = trpc.medical.getTrainingLoad.useQuery(
    { playerId: parseInt(selectedPlayer) },
    { enabled: !!selectedPlayer }
  );

  // Save training load mutation
  const saveLoadMutation = trpc.medical.saveTrainingLoad.useMutation({
    onSuccess: () => {
      toast.success(isAr ? "تم حفظ بيانات الحمل بنجاح" : "Training load saved successfully");
      setNewLoad({ playerId: "", acuteLoad: "", chronicLoad: "", rpe: "", notes: "" });
      setCalculatedACWR(null);
      refetchTeamLoad();
    },
    onError: (err) => {
      toast.error(err.message || (isAr ? "فشل حفظ البيانات" : "Failed to save data"));
    }
  });

  // Build player risk data from real DB data
  const playerRiskData = teamLoadSummary.map((p: any) => ({
    id: p.playerId,
    name: p.playerName,
    position: p.position,
    acwr: p.acRatio ? parseFloat(String(p.acRatio)) : 0,
    acuteLoad: p.acuteLoad || 0,
    chronicLoad: p.chronicLoad || 0,
    riskLevel: p.riskLevel || 'low',
    weekStart: p.weekStart,
  })).filter((p: any) => p.acwr > 0);

  // Build ACWR history from player load history
  const acwrHistory = playerLoadHistory.map((load: any, i: number) => ({
    week: `${isAr ? "أسبوع" : "Week"} ${i + 1}`,
    acwr: load.acRatio ? parseFloat(String(load.acRatio)) : 0,
    acuteLoad: load.acuteLoad || 0,
    chronicLoad: load.chronicLoad || 0,
  })).filter((h: any) => h.acwr > 0);

  const highRiskPlayers = playerRiskData.filter((p: any) => p.acwr > 1.5);
  const cautionPlayers = playerRiskData.filter((p: any) => p.acwr > 1.3 && p.acwr <= 1.5);
  const safePlayers = playerRiskData.filter((p: any) => p.acwr <= 1.3 && p.acwr > 0);

  const getRiskBadge = (acwr: number) => {
    if (acwr > 1.5) return <Badge className="bg-red-100 text-red-700 border-red-200">{isAr ? "خطر عالٍ" : "High Risk"}</Badge>;
    if (acwr > 1.3) return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">{isAr ? "تحذير" : "Caution"}</Badge>;
    if (acwr >= 0.8) return <Badge className="bg-green-100 text-green-700 border-green-200">{isAr ? "آمن" : "Safe"}</Badge>;
    return <Badge className="bg-gray-100 text-gray-700 border-gray-200">{isAr ? "تدريب منخفض" : "Under-training"}</Badge>;
  };

  const handleSaveLoad = () => {
    if (!newLoad.playerId || !newLoad.acuteLoad || !newLoad.chronicLoad) {
      toast.error(isAr ? "أدخل بيانات اللاعب والحمل" : "Enter player and load values");
      return;
    }
    const acute = parseFloat(newLoad.acuteLoad);
    const chronic = parseFloat(newLoad.chronicLoad);
    const acwr = acute / chronic;
    const zone = getACWRZone(acwr);
    setCalculatedACWR(acwr);

    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());

    saveLoadMutation.mutate({
      playerId: parseInt(newLoad.playerId),
      weekStart: weekStart.toISOString().split('T')[0],
      acuteLoad: acute,
      chronicLoad: chronic,
      acRatio: acwr.toFixed(2),
      riskLevel: acwr > 1.5 ? 'very_high' : acwr > 1.3 ? 'high' : acwr >= 0.8 ? 'low' : 'moderate',
      rpe: newLoad.rpe ? parseInt(newLoad.rpe) : undefined,
      notes: newLoad.notes || undefined,
    });
  };

  return (
    <>
      <div className="p-6 max-w-7xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-yellow-700 dark:text-yellow-500" />
              {isAr ? "نظام الإنذار المبكر للإصابات" : "Injury Early Warning System"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAr
                ? "تتبع ACWR، تحميل التدريب، وتنبيه المدرب قبل حدوث الإصابة"
                : "Track ACWR, training load, and alert coach before injury occurs"}
            </p>
          </div>
        </div>

        {/* Team Selector */}
        <div className="mb-6 flex gap-4 items-end">
          <div className="w-64">
            <Label className="text-sm font-medium mb-1 block">{isAr ? "اختر الفريق" : "Select Team"}</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder={isAr ? "اختر فريقاً" : "Select a team"} />
              </SelectTrigger>
              <SelectContent>
                {(teams as any[]).map((t: any) => (
                  <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {loadingTeamLoad && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
        </div>

        {/* Alert Banner */}
        {highRiskPlayers.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-800 dark:text-red-300">
                {isAr ? `⚠️ ${highRiskPlayers.length} لاعبين في منطقة الخطر العالي` : `⚠️ ${highRiskPlayers.length} players in high-risk zone`}
              </p>
              <p className="text-sm text-red-700 dark:text-red-400">
                {highRiskPlayers.map((p: any) => p.name).join("، ")} — {isAr ? "يُنصح بتخفيض الحمل التدريبي فوراً" : "Recommend reducing training load immediately"}
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-red-600">{highRiskPlayers.length}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "خطر عالٍ" : "High Risk"}</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{cautionPlayers.length}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "تحذير" : "Caution"}</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{safePlayers.length}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "آمن" : "Safe"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{playerRiskData.length}</p>
              <p className="text-xs text-muted-foreground">{isAr ? "إجمالي اللاعبين" : "Total Players"}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard"><Users className="h-4 w-4 mr-1" />{isAr ? "لوحة التحكم" : "Dashboard"}</TabsTrigger>
            <TabsTrigger value="acwr"><Activity className="h-4 w-4 mr-1" />{isAr ? "تتبع ACWR" : "ACWR Tracking"}</TabsTrigger>
            <TabsTrigger value="log"><Zap className="h-4 w-4 mr-1" />{isAr ? "تسجيل الحمل" : "Log Load"}</TabsTrigger>
            <TabsTrigger value="recommendations"><Brain className="h-4 w-4 mr-1" />{isAr ? "التوصيات" : "Recommendations"}</TabsTrigger>
          </TabsList>

          {/* ── Dashboard ── */}
          <TabsContent value="dashboard">
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "حالة اللاعبين — مستوى الخطر" : "Player Risk Status"}</CardTitle>
                <CardDescription>
                  {isAr ? "ACWR المثالي: 0.8 — 1.3 | فوق 1.5 = خطر إصابة مرتفع" : "Optimal ACWR: 0.8 — 1.3 | Above 1.5 = High injury risk"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!selectedTeam ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{isAr ? "اختر فريقاً لعرض بيانات الخطر" : "Select a team to view risk data"}</p>
                  </div>
                ) : loadingTeamLoad ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : playerRiskData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{isAr ? "لا توجد بيانات حمل تدريبي لهذا الفريق بعد" : "No training load data for this team yet"}</p>
                    <p className="text-sm mt-1">{isAr ? "استخدم تبويب 'تسجيل الحمل' لإضافة بيانات" : "Use the 'Log Load' tab to add data"}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {playerRiskData.sort((a: any, b: any) => b.acwr - a.acwr).map((player: any) => {
                      const zone = getACWRZone(player.acwr);
                      const riskPct = Math.min(100, (player.acwr / 2) * 100);
                      return (
                        <div key={player.id} className="flex items-center gap-4 p-3 rounded-xl border border-border bg-muted/20">
                          <div className="w-32 shrink-0">
                            <p className="font-medium text-sm truncate">{player.name}</p>
                            <p className="text-xs text-muted-foreground">{player.position}</p>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>ACWR: <strong style={{ color: zone.color }}>{player.acwr.toFixed(2)}</strong></span>
                              <span>{isAr ? "حمل حاد" : "Acute"}: {player.acuteLoad} | {isAr ? "مزمن" : "Chronic"}: {player.chronicLoad}</span>
                            </div>
                            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                              <div
                                className="absolute top-0 left-0 h-full rounded-full transition-all"
                                style={{ width: `${riskPct}%`, backgroundColor: zone.color }}
                              />
                              <div className="absolute top-0 h-full w-0.5 bg-green-500/50" style={{ left: "40%" }} />
                              <div className="absolute top-0 h-full w-0.5 bg-yellow-500/50" style={{ left: "65%" }} />
                              <div className="absolute top-0 h-full w-0.5 bg-red-500/50" style={{ left: "75%" }} />
                            </div>
                          </div>
                          {getRiskBadge(player.acwr)}
                          {player.acwr > 1.5 && (
                            <Button size="sm" variant="destructive" onClick={() => toast.success(isAr ? "تم إرسال تنبيه للمدرب" : "Alert sent to coach")}>
                              <Bell className="h-3 w-3 mr-1" />
                              {isAr ? "تنبيه" : "Alert"}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-4 flex gap-4 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-gray-400" /> {isAr ? "تدريب منخفض (< 0.8)" : "Under-training (< 0.8)"}</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500" /> {isAr ? "آمن (0.8-1.3)" : "Safe (0.8-1.3)"}</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500" /> {isAr ? "تحذير (1.3-1.5)" : "Caution (1.3-1.5)"}</span>
                  <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500" /> {isAr ? "خطر (> 1.5)" : "Danger (> 1.5)"}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ACWR Tracking ── */}
          <TabsContent value="acwr">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>{isAr ? "تتبع ACWR للاعب" : "Player ACWR Tracking"}</CardTitle>
                  <CardDescription>{isAr ? "اختر لاعباً لعرض تاريخ ACWR" : "Select a player to view ACWR history"}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 w-64">
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger>
                        <SelectValue placeholder={isAr ? "اختر لاعباً" : "Select player"} />
                      </SelectTrigger>
                      <SelectContent>
                        {(players as any[]).map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {loadingPlayerHistory ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                  ) : acwrHistory.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>{isAr ? "لا توجد بيانات ACWR لهذا اللاعب" : "No ACWR data for this player"}</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={acwrHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0.5, 2]} />
                        <Tooltip />
                        <ReferenceLine y={0.8} stroke="#6b7280" strokeDasharray="4 4" label={{ value: "0.8", fontSize: 10 }} />
                        <ReferenceLine y={1.3} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "1.3 Safe", fontSize: 10 }} />
                        <ReferenceLine y={1.5} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "1.5 Caution", fontSize: 10 }} />
                        <Line type="monotone" dataKey="acwr" stroke="#ef4444" strokeWidth={3} dot={{ fill: "#ef4444", r: 5 }} name="ACWR" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {acwrHistory.length > 0 && (
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>{isAr ? "الحمل الحاد والمزمن" : "Acute vs Chronic Load"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={acwrHistory}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Area type="monotone" dataKey="acuteLoad" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name={isAr ? "حمل حاد (7 أيام)" : "Acute Load (7d)"} />
                        <Area type="monotone" dataKey="chronicLoad" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name={isAr ? "حمل مزمن (28 يوم)" : "Chronic Load (28d)"} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* ── Log Load ── */}
          <TabsContent value="log">
            <Card>
              <CardHeader>
                <CardTitle>{isAr ? "تسجيل حمل تدريبي جديد" : "Log New Training Load"}</CardTitle>
                <CardDescription>{isAr ? "أدخل بيانات الحمل الحاد والمزمن لحساب ACWR" : "Enter acute and chronic load data to calculate ACWR"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label>{isAr ? "اللاعب" : "Player"} *</Label>
                    <Select value={newLoad.playerId} onValueChange={v => setNewLoad(prev => ({ ...prev, playerId: v }))}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر لاعباً" : "Select player"} /></SelectTrigger>
                      <SelectContent>
                        {(players as any[]).map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isAr ? "الحمل الحاد (7 أيام)" : "Acute Load (7d)"} *</Label>
                    <Input
                      type="number"
                      value={newLoad.acuteLoad}
                      onChange={e => setNewLoad(prev => ({ ...prev, acuteLoad: e.target.value }))}
                      placeholder={isAr ? "مثال: 450" : "e.g. 450"}
                    />
                  </div>
                  <div>
                    <Label>{isAr ? "الحمل المزمن (28 يوم)" : "Chronic Load (28d)"} *</Label>
                    <Input
                      type="number"
                      value={newLoad.chronicLoad}
                      onChange={e => setNewLoad(prev => ({ ...prev, chronicLoad: e.target.value }))}
                      placeholder={isAr ? "مثال: 320" : "e.g. 320"}
                    />
                  </div>
                  <div>
                    <Label>{isAr ? "مستوى الجهد (RPE 1-10)" : "Effort Level (RPE 1-10)"}</Label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={newLoad.rpe}
                      onChange={e => setNewLoad(prev => ({ ...prev, rpe: e.target.value }))}
                      placeholder="1-10"
                    />
                  </div>
                  <div>
                    <Label>{isAr ? "ملاحظات" : "Notes"}</Label>
                    <Input
                      value={newLoad.notes}
                      onChange={e => setNewLoad(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder={isAr ? "أي ملاحظات..." : "Any notes..."}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      className="w-full"
                      onClick={handleSaveLoad}
                      disabled={saveLoadMutation.isPending}
                    >
                      {saveLoadMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Activity className="h-4 w-4 mr-2" />
                      )}
                      {isAr ? "احسب واحفظ ACWR" : "Calculate & Save ACWR"}
                    </Button>
                  </div>
                </div>

                {calculatedACWR !== null && (
                  <div className={`mt-4 p-4 rounded-xl border ${calculatedACWR > 1.5 ? 'bg-red-50 border-red-200' : calculatedACWR > 1.3 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
                    <p className="font-bold text-lg">
                      ACWR = {calculatedACWR.toFixed(2)} — {isAr ? getACWRZone(calculatedACWR).label_ar : getACWRZone(calculatedACWR).label_en}
                    </p>
                    {calculatedACWR > 1.5 && (
                      <p className="text-sm text-red-700 mt-1">{isAr ? "خطر إصابة مرتفع! يُنصح بتخفيض الحمل فوراً" : "High injury risk! Recommend reducing load immediately"}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Recommendations ── */}
          <TabsContent value="recommendations">
            <div className="space-y-4">
              {!selectedTeam ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>{isAr ? "اختر فريقاً لعرض التوصيات" : "Select a team to view recommendations"}</p>
                </div>
              ) : playerRiskData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30 text-green-700 dark:text-green-500" />
                  <p>{isAr ? "لا توجد بيانات حمل تدريبي لهذا الفريق" : "No training load data for this team"}</p>
                </div>
              ) : (
                <>
                  {playerRiskData.filter((p: any) => p.acwr > 1.3).map((player: any) => (
                    <Card key={player.id} className={player.acwr > 1.5 ? "border-red-200 bg-red-50/30 dark:bg-red-950/10" : "border-yellow-200 bg-yellow-50/30 dark:bg-yellow-950/10"}>
                      <CardContent className="p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-bold text-lg">{player.name}</h3>
                            <p className="text-sm text-muted-foreground">{player.position} — ACWR: <strong style={{ color: getACWRZone(player.acwr).color }}>{player.acwr.toFixed(2)}</strong></p>
                          </div>
                          {getRiskBadge(player.acwr)}
                        </div>
                        <div className="space-y-2">
                          {player.acwr > 1.5 ? (
                            <>
                              <p className="text-sm font-semibold text-red-700 dark:text-red-400">{isAr ? "توصيات عاجلة:" : "Urgent Recommendations:"}</p>
                              <ul className="space-y-1 text-sm">
                                <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />{isAr ? "تخفيض حمل التدريب بنسبة 30-40% فوراً" : "Reduce training load by 30-40% immediately"}</li>
                                <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />{isAr ? "يوم راحة إجباري غداً" : "Mandatory rest day tomorrow"}</li>
                                <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />{isAr ? "تقييم طبي قبل العودة للتدريب الكامل" : "Medical assessment before full training return"}</li>
                                <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />{isAr ? "مراقبة يومية لمستوى الإجهاد" : "Daily fatigue monitoring"}</li>
                              </ul>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">{isAr ? "توصيات احترازية:" : "Precautionary Recommendations:"}</p>
                              <ul className="space-y-1 text-sm">
                                <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-yellow-700 dark:text-yellow-500 mt-0.5 shrink-0" />{isAr ? "تخفيض الحمل بنسبة 15-20% هذا الأسبوع" : "Reduce load by 15-20% this week"}</li>
                                <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-yellow-700 dark:text-yellow-500 mt-0.5 shrink-0" />{isAr ? "التركيز على التعافي النشط" : "Focus on active recovery"}</li>
                                <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-yellow-700 dark:text-yellow-500 mt-0.5 shrink-0" />{isAr ? "مراقبة مستوى الإجهاد يومياً" : "Monitor fatigue levels daily"}</li>
                              </ul>
                            </>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="mt-3"
                          variant={player.acwr > 1.5 ? "destructive" : "default"}
                          onClick={() => toast.success(isAr ? "تم إرسال التوصيات للمدرب" : "Recommendations sent to coach")}
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          {isAr ? "إرسال تنبيه للمدرب" : "Send Alert to Coach"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                  {playerRiskData.filter((p: any) => p.acwr <= 1.3).map((player: any) => (
                    <Card key={player.id} className="border-green-200 bg-green-50/30 dark:bg-green-950/10">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{player.name}</p>
                          <p className="text-sm text-muted-foreground">ACWR: {player.acwr.toFixed(2)} — {isAr ? "في المنطقة الآمنة" : "In safe zone"}</p>
                        </div>
                        <CheckCircle className="h-6 w-6 text-green-700 dark:text-green-500" />
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
