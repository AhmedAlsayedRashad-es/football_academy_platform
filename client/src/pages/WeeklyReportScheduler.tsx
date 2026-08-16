import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CalendarClock, FileText, Send, Users, Activity, Heart, Star, Printer, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function WeeklyReportScheduler() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [previewPlayer, setPreviewPlayer] = useState<any>(null);
  const [sendingAll, setSendingAll] = useState(false);

  const { data: teams = [] } = trpc.teams.getAll.useQuery();
  const { data: players = [] } = trpc.players.getAll.useQuery();
  const { data: injuries = [] } = trpc.injuries.getActive.useQuery();

  const notifyParent = trpc.notifications.notifyParent.useMutation();

  const filteredPlayers = (selectedTeam && selectedTeam !== 'all')
    ? (players as any[]).filter((p: any) => p.teamId === Number(selectedTeam))
    : (players as any[]);

  const getPlayerInjury = (playerId: number) =>
    (injuries as any[]).find((i: any) => i.playerId === playerId && i.status === "active");

  const sendReport = async (player: any) => {
    const injury = getPlayerInjury(player.id);
    const title = isAr ? `التقرير الأسبوعي - ${player.name}` : `Weekly Report - ${player.name}`;
    const message = isAr
      ? `تقرير أسبوعي للاعب ${player.name}. المركز: ${player.position}. ${injury ? `⚠️ إصابة نشطة: ${injury.injuryType}` : "✅ لا توجد إصابات نشطة."}`
      : `Weekly report for ${player.name}. Position: ${player.position}. ${injury ? `⚠️ Active injury: ${injury.injuryType}` : "✅ No active injuries."}`;
    try {
      await notifyParent.mutateAsync({ playerId: player.id, title, message, type: "info", category: "performance" });
      toast({ title: isAr ? "تم الإرسال" : "Sent", description: `${isAr ? "تم إرسال تقرير" : "Report sent for"} ${player.name}` });
    } catch {
      toast({ title: isAr ? "خطأ" : "Error", description: isAr ? "فشل الإرسال" : "Failed to send", variant: "destructive" });
    }
  };

  const sendAllReports = async () => {
    setSendingAll(true);
    for (const player of filteredPlayers) {
      await sendReport(player);
    }
    setSendingAll(false);
    toast({ title: isAr ? "اكتمل الإرسال" : "All Sent", description: `${filteredPlayers.length} ${isAr ? "تقرير أُرسل" : "reports sent"}` });
  };

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" /> {isAr ? "رجوع" : "Back"}
            </Button>
            <CalendarClock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            <div>
              <PageBreadcrumb
                items={[
                  { label: "Reports", labelAr: "التقارير", href: "/reports" },
                  { label: isAr ? "جدول التقارير الأسبوعية" : "Weekly Report Scheduler" },
                ]}
                className="mb-1 text-muted-foreground"
              />
              <h1 className="text-2xl font-bold text-foreground">
                {isAr ? "التقارير الأسبوعية" : "Weekly Report Scheduler"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {isAr ? "أنشئ وأرسل تقارير أسبوعية لأولياء الأمور" : "Generate and send weekly player summaries to parents"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="bg-muted border-border text-foreground w-44">
                <SelectValue placeholder={isAr ? "جميع الفرق" : "All Teams"} />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="all" className="text-foreground">{isAr ? "جميع الفرق" : "All Teams"}</SelectItem>
                {(teams as any[]).map((t: any) => (
                  <SelectItem key={t.id} value={String(t.id)} className="text-foreground">{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={sendAllReports} disabled={sendingAll || filteredPlayers.length === 0} className="bg-green-600 hover:bg-green-700">
              <Users className="h-4 w-4 mr-2" />
              {sendingAll ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الكل" : "Send All")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-muted border-border">
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{filteredPlayers.length}</p>
              <p className="text-muted-foreground text-sm mt-1">{isAr ? "لاعبون" : "Players"}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted border-border">
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                {filteredPlayers.filter((p: any) => getPlayerInjury(p.id)).length}
              </p>
              <p className="text-muted-foreground text-sm mt-1">{isAr ? "إصابات نشطة" : "Active Injuries"}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted border-border">
            <CardContent className="pt-4 text-center">
              <p className="text-3xl font-bold text-green-700 dark:text-green-400">
                {filteredPlayers.filter((p: any) => !getPlayerInjury(p.id)).length}
              </p>
              <p className="text-muted-foreground text-sm mt-1">{isAr ? "لاعبون بصحة جيدة" : "Healthy Players"}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((player: any) => {
            const injury = getPlayerInjury(player.id);
            return (
              <Card key={player.id} className="bg-muted border-border">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-foreground font-semibold">{player.name}</p>
                      <p className="text-muted-foreground text-xs">{player.position} · #{player.jerseyNumber || "—"}</p>
                    </div>
                    {injury ? (
                      <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 text-xs">{isAr ? "مصاب" : "Injured"}</Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 text-xs">{isAr ? "سليم" : "Fit"}</Badge>
                    )}
                  </div>
                  {injury && (
                    <div className="text-xs text-red-600 dark:text-red-400 bg-red-500/10 rounded p-2 mb-3">
                      ⚠️ {injury.injuryType} — {injury.bodyPart}
                    </div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1 border-border text-muted-foreground hover:bg-muted text-xs" onClick={() => setPreviewPlayer(player)}>
                      <FileText className="h-3 w-3 mr-1" />{isAr ? "معاينة" : "Preview"}
                    </Button>
                    <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-xs" onClick={() => sendReport(player)} disabled={notifyParent.isPending}>
                      <Send className="h-3 w-3 mr-1" />{isAr ? "إرسال" : "Send"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{isAr ? "لا يوجد لاعبون" : "No players found"}</p>
          </div>
        )}

        <Dialog open={!!previewPlayer} onOpenChange={() => setPreviewPlayer(null)}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                {isAr ? "معاينة التقرير الأسبوعي" : "Weekly Report Preview"}
              </DialogTitle>
            </DialogHeader>
            {previewPlayer && (
              <div className="space-y-4 text-sm">
                <div className="brand-gradient-subtle p-4 rounded-lg border border-red-700/30">
                  <p className="text-foreground font-bold text-lg">{previewPlayer.name}</p>
                  <p className="text-muted-foreground">{previewPlayer.position}</p>
                  <p className="text-muted-foreground text-xs mt-1">{isAr ? "تقرير أسبوع" : "Week of"} {new Date().toLocaleDateString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Heart className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-muted-foreground text-xs">{isAr ? "الحالة الصحية" : "Health Status"}</span>
                    </div>
                    {getPlayerInjury(previewPlayer.id) ? (
                      <p className="text-red-600 dark:text-red-400 font-medium">{isAr ? "إصابة نشطة" : "Active Injury"}</p>
                    ) : (
                      <p className="text-green-700 dark:text-green-400 font-medium">{isAr ? "سليم" : "Fit & Healthy"}</p>
                    )}
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-muted-foreground text-xs">{isAr ? "المركز" : "Position"}</span>
                    </div>
                    <p className="text-foreground font-medium">{previewPlayer.position}</p>
                  </div>
                </div>
                {getPlayerInjury(previewPlayer.id) && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-600 dark:text-red-400 font-medium text-xs mb-1">⚠️ {isAr ? "تفاصيل الإصابة" : "Injury Details"}</p>
                    <p className="text-muted-foreground text-xs">{getPlayerInjury(previewPlayer.id)?.injuryType} — {getPlayerInjury(previewPlayer.id)?.bodyPart}</p>
                    <p className="text-muted-foreground text-xs">{isAr ? "الخطورة:" : "Severity:"} {getPlayerInjury(previewPlayer.id)?.severity}</p>
                  </div>
                )}
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />
                    <span className="text-muted-foreground text-xs font-medium">{isAr ? "ملاحظة المدرب" : "Coach Note"}</span>
                  </div>
                  <p className="text-muted-foreground text-xs italic">
                    {isAr
                      ? `${previewPlayer.name} يواصل التطور بشكل جيد. يُنصح بالاستمرار في التدريب المنتظم.`
                      : `${previewPlayer.name} continues to develop well. Consistent training attendance is recommended.`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => window.print()} variant="outline" className="flex-1 border-border text-muted-foreground hover:bg-muted">
                    <Printer className="h-4 w-4 mr-2" />{isAr ? "طباعة" : "Print"}
                  </Button>
                  <Button onClick={() => { sendReport(previewPlayer); setPreviewPlayer(null); }} className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4 mr-2" />{isAr ? "إرسال لولي الأمر" : "Send to Parent"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
