import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Ban, CheckCircle, Clock, Plus, RefreshCw, Shield, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";


const SUSPENSION_TYPE_LABELS: Record<string, { label: string; labelAr: string; color: string }> = {
  yellow_accumulation: { label: "3 Yellow Cards", labelAr: "تراكم 3 كروت صفراء", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  red_card: { label: "Direct Red Card", labelAr: "طرد مباشر", color: "bg-red-100 text-red-800 border-red-300" },
  double_yellow: { label: "2 Yellows in 1 Match", labelAr: "إنذاران في مباراة واحدة", color: "bg-orange-100 text-orange-800 border-orange-300" },
  manual: { label: "Manual / Other", labelAr: "يدوي / أخرى", color: "bg-purple-100 text-purple-800 border-purple-300" },
};

export default function SuspensionsManagement() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [manualOpen, setManualOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    playerId: "",
    banMatches: "1",
    reason: "",
  });

  const { data: teams = [] } = trpc.teams.getAll.useQuery();
  const { data: activeSuspensions = [], refetch: refetchActive } = trpc.suspensions.getActiveSuspensions.useQuery(
    { teamId: (selectedTeam && selectedTeam !== "all") ? parseInt(selectedTeam) : undefined }
  );
  const { data: suspensionHistory = [], refetch: refetchHistory } = trpc.suspensions.getAllSuspensions.useQuery(
    { teamId: (selectedTeam && selectedTeam !== "all") ? parseInt(selectedTeam) : undefined }
  );
  const { data: allPlayers = [] } = trpc.dataAnalysis.getAllPlayers.useQuery();

  const createManualSuspension = trpc.suspensions.createManualSuspension.useMutation({
    onSuccess: () => {
      toast({ title: isRTL ? "تم إضافة العقوبة" : "Suspension Added", description: isRTL ? "تم إضافة العقوبة اليدوية بنجاح" : "Manual suspension added successfully." });
      setManualOpen(false);
      setManualForm({ playerId: "", banMatches: "1", reason: "" });
      refetchActive();
      refetchHistory();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateSuspension = trpc.suspensions.updateSuspension.useMutation({
    onSuccess: () => {
      toast({ title: isRTL ? "تم رفع العقوبة" : "Suspension Lifted" });
      refetchActive();
      refetchHistory();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const getPlayerName = (playerId: number) => {
    const p = (allPlayers as any[]).find((pl: any) => pl.id === playerId);
    return p ? `${p.firstName} ${p.lastName}` : `Player #${playerId}`;
  };

  const filteredActive = activeSuspensions as any[];
  const filteredHistory = suspensionHistory as any[];

  return (
    <>
      <div className={`p-6 space-y-6 ${isRTL ? "rtl" : "ltr"}`}>
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>

            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-6 w-6 text-red-600" />
              {isRTL ? "إدارة العقوبات والإيقافات" : "Suspensions & Bans Management"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isRTL
                ? "تتبع الكروت الصفراء والحمراء والإيقافات التلقائية والعقوبات اليدوية"
                : "Track yellow/red cards, automatic bans, and manual suspensions"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Dialog open={manualOpen} onOpenChange={setManualOpen}>
              <DialogTrigger asChild>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  {isRTL ? "إضافة عقوبة يدوية" : "Add Manual Suspension"}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{isRTL ? "إضافة عقوبة يدوية" : "Add Manual Suspension"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>{isRTL ? "اللاعب" : "Player"}</Label>
                    <Select value={manualForm.playerId} onValueChange={v => setManualForm(f => ({ ...f, playerId: v }))}>
                      <SelectTrigger><SelectValue placeholder={isRTL ? "اختر لاعباً..." : "Select player..."} /></SelectTrigger>
                      <SelectContent>
                        {(allPlayers as any[]).map((p: any) => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isRTL ? "عدد المباريات الموقوف عنها" : "Matches Banned"}</Label>
                    <Input
                      type="number" min="1" max="10"
                      value={manualForm.banMatches}
                      onChange={e => setManualForm(f => ({ ...f, banMatches: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>{isRTL ? "سبب العقوبة" : "Reason"}</Label>
                    <Textarea
                      placeholder={isRTL ? "اكتب سبب العقوبة..." : "Enter reason for suspension..."}
                      value={manualForm.reason}
                      onChange={e => setManualForm(f => ({ ...f, reason: e.target.value }))}
                    />
                  </div>
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                    disabled={!manualForm.playerId || !manualForm.reason || createManualSuspension.isPending}
                    onClick={() => createManualSuspension.mutate({
                      playerId: parseInt(manualForm.playerId),
                      banMatches: parseInt(manualForm.banMatches),
                      reason: manualForm.reason,
                    })}
                  >
                    {createManualSuspension.isPending ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "تأكيد العقوبة" : "Confirm Suspension")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Rules Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-black font-bold text-lg flex-shrink-0">3</div>
                <div>
                  <p className="font-semibold text-yellow-900">{isRTL ? "تراكم الكروت الصفراء" : "Yellow Card Accumulation"}</p>
                  <p className="text-sm text-yellow-700 mt-1">{isRTL ? "كل 3 كروت صفراء = إيقاف مباراة واحدة" : "Every 3 yellow cards = 1 match ban"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  <Ban className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-red-900">{isRTL ? "الطرد المباشر" : "Direct Red Card"}</p>
                  <p className="text-sm text-red-700 mt-1">{isRTL ? "طرد مباشر = إيقاف مبارتين" : "Direct red card = 2 match ban"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">2Y</div>
                <div>
                  <p className="font-semibold text-orange-900">{isRTL ? "إنذاران في مباراة واحدة" : "Double Yellow in 1 Match"}</p>
                  <p className="text-sm text-orange-700 mt-1">{isRTL ? "إنذاران في نفس المباراة = إيقاف مباراة واحدة" : "2 yellows in same match = 1 match ban"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Filter */}
        <div className="flex items-center gap-3">
          <Users className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder={isRTL ? "كل الفرق" : "All Teams"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isRTL ? "كل الفرق" : "All Teams"}</SelectItem>
              {(teams as any[]).map((t: any) => (
                <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => { refetchActive(); refetchHistory(); }} className="flex items-center gap-1">
            <RefreshCw className="h-4 w-4 mr-1" />
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              {isRTL ? "الإيقافات الحالية" : "Active Suspensions"}
              {filteredActive.length > 0 && (
                <Badge className="bg-red-500 text-white text-xs ml-1">{filteredActive.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {isRTL ? "السجل الكامل" : "Full History"}
            </TabsTrigger>
          </TabsList>

          {/* Active Suspensions */}
          <TabsContent value="active" className="mt-4">
            {filteredActive.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-700 dark:text-green-500 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">{isRTL ? "لا توجد إيقافات حالية" : "No active suspensions"}</p>
                  <p className="text-muted-foreground text-sm mt-1">{isRTL ? "جميع اللاعبين متاحون للمشاركة" : "All players are available for selection"}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(filteredActive as any[]).map((s: any) => {
                  const typeInfo = SUSPENSION_TYPE_LABELS[s.suspensionType] || SUSPENSION_TYPE_LABELS.manual;
                  return (
                    <Card key={s.id} className="border-red-200">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                              <Ban className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{getPlayerName(s.playerId)}</p>
                              <Badge className={`text-xs mt-1 ${typeInfo.color}`}>
                                {isRTL ? typeInfo.labelAr : typeInfo.label}
                              </Badge>
                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">{isRTL ? "المباريات المتبقية:" : "Matches remaining:"}</span>{" "}
                                  <span className="text-red-600 font-bold">{s.banMatchesRemaining}</span>
                                </p>
                                {s.reason && (
                                  <p className="text-sm text-muted-foreground">
                                    <span className="font-medium">{isRTL ? "السبب:" : "Reason:"}</span> {s.reason}
                                  </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  {isRTL ? "تاريخ الإيقاف:" : "Suspended on:"}{" "}
                                  {new Date(s.createdAt).toLocaleDateString(isRTL ? "ar-EG" : "en-GB")}
                                </p>
                              </div>
                            </div>
                          </div>
                          {s.suspensionType === "manual" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 border-green-300 hover:bg-green-50 flex-shrink-0"
                              onClick={() => updateSuspension.mutate({ id: s.id, status: 'cancelled' })}
                              disabled={updateSuspension.isPending}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {isRTL ? "رفع العقوبة" : "Lift Ban"}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* History */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{isRTL ? "سجل جميع العقوبات" : "All Suspensions History"}</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredHistory.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{isRTL ? "لا يوجد سجل بعد" : "No history yet"}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-gray-50">
                          <th className="text-left p-3 font-medium text-gray-600">{isRTL ? "اللاعب" : "Player"}</th>
                          <th className="text-left p-3 font-medium text-gray-600">{isRTL ? "نوع العقوبة" : "Type"}</th>
                          <th className="text-left p-3 font-medium text-gray-600">{isRTL ? "المباريات" : "Matches"}</th>
                          <th className="text-left p-3 font-medium text-gray-600">{isRTL ? "الحالة" : "Status"}</th>
                          <th className="text-left p-3 font-medium text-gray-600">{isRTL ? "التاريخ" : "Date"}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(filteredHistory as any[]).map((s: any) => {
                          const typeInfo = SUSPENSION_TYPE_LABELS[s.suspensionType] || SUSPENSION_TYPE_LABELS.manual;
                          const isActive = s.isActive && s.matchesBanRemaining > 0;
                          return (
                            <tr key={s.id} className="border-b hover:bg-gray-50">
                              <td className="p-3 font-medium">{getPlayerName(s.playerId)}</td>
                              <td className="p-3">
                                <Badge className={`text-xs ${typeInfo.color}`}>
                                  {isRTL ? typeInfo.labelAr : typeInfo.label}
                                </Badge>
                              </td>
                              <td className="p-3">
                                <span className="font-medium">{s.matchesBanTotal}</span>
                                {isActive && (
                                  <span className="text-red-500 ml-1">({s.matchesBanRemaining} {isRTL ? "متبقي" : "left"})</span>
                                )}
                              </td>
                              <td className="p-3">
                                {isActive ? (
                                  <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    {isRTL ? "موقوف" : "Active"}
                                  </Badge>
                                ) : (
                                  <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {isRTL ? "منتهي" : "Served"}
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3 text-muted-foreground">
                                {new Date(s.createdAt).toLocaleDateString(isRTL ? "ar-EG" : "en-GB")}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
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
