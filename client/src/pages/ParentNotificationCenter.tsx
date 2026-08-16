import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BellRing, Send, Users, History, AlertTriangle, Info, CheckCircle, Search, ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function ParentNotificationCenter() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const [playerId, setPlayerId] = useState<string>("");
  const [bulkTeamId, setBulkTeamId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [msgType, setMsgType] = useState<"info" | "success" | "warning" | "alert">("info");
  const [category, setCategory] = useState<"general" | "performance" | "injury" | "achievement">("general");
  const [historySearch, setHistorySearch] = useState("");

  const { data: players = [] } = trpc.players.getAll.useQuery();
  const { data: teams = [] } = trpc.teams.getAll.useQuery();
  const { data: history = [], refetch: refetchHistory } = trpc.notifications.getNotificationHistory.useQuery({ limit: 100 });

  const notifyParent = trpc.notifications.notifyParent.useMutation({
    onSuccess: (data: any) => {
      toast({ title: isAr ? "تم الإرسال" : "Sent", description: `${data.count} ${isAr ? "إشعار أُرسل" : "notification(s) sent"}` });
      setTitle(""); setMessage("");
      refetchHistory();
    },
    onError: () => toast({ title: isAr ? "خطأ" : "Error", description: isAr ? "فشل الإرسال" : "Failed to send", variant: "destructive" }),
  });

  const notifyAll = trpc.notifications.notifyAllParents.useMutation({
    onSuccess: (data: any) => {
      toast({ title: isAr ? "تم الإرسال" : "Sent", description: `${data.count} ${isAr ? "إشعار أُرسل" : "notification(s) sent"}` });
      setTitle(""); setMessage("");
      refetchHistory();
    },
    onError: () => toast({ title: isAr ? "خطأ" : "Error", description: isAr ? "فشل الإرسال" : "Failed to send", variant: "destructive" }),
  });

  const handleSendToPlayer = () => {
    if (!playerId || !title || !message) return;
    notifyParent.mutate({ playerId: Number(playerId), title, message, type: msgType, category });
  };

  const handleSendBulk = () => {
    if (!title || !message) return;
    notifyAll.mutate({ title, message, type: msgType, category, teamId: (bulkTeamId && bulkTeamId !== 'all') ? Number(bulkTeamId) : undefined });
  };

  const typeIcon = (t: string) => {
    if (t === "alert") return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />;
    if (t === "warning") return <AlertTriangle className="h-4 w-4 text-yellow-700 dark:text-yellow-400" />;
    if (t === "success") return <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />;
    return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
  };

  const filteredHistory = (history as any[]).filter((n: any) =>
    !historySearch ||
    n.title?.toLowerCase().includes(historySearch.toLowerCase()) ||
    n.message?.toLowerCase().includes(historySearch.toLowerCase())
  );

  const FormFields = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-muted-foreground text-sm">{isAr ? "النوع" : "Type"}</Label>
          <Select value={msgType} onValueChange={(v) => setMsgType(v as any)}>
            <SelectTrigger className="bg-muted border-border text-foreground mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-muted border-border">
              <SelectItem value="info" className="text-foreground">Info</SelectItem>
              <SelectItem value="success" className="text-foreground">Success</SelectItem>
              <SelectItem value="warning" className="text-foreground">Warning</SelectItem>
              <SelectItem value="alert" className="text-foreground">Alert</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-muted-foreground text-sm">{isAr ? "الفئة" : "Category"}</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as any)}>
            <SelectTrigger className="bg-muted border-border text-foreground mt-1"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-muted border-border">
              <SelectItem value="general" className="text-foreground">{isAr ? "عام" : "General"}</SelectItem>
              <SelectItem value="performance" className="text-foreground">{isAr ? "الأداء" : "Performance"}</SelectItem>
              <SelectItem value="injury" className="text-foreground">{isAr ? "إصابة" : "Injury"}</SelectItem>
              <SelectItem value="achievement" className="text-foreground">{isAr ? "إنجاز" : "Achievement"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="text-muted-foreground text-sm">{isAr ? "العنوان" : "Title"}</Label>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder={isAr ? "عنوان الإشعار..." : "Notification title..."} className="bg-muted border-border text-foreground mt-1" />
      </div>
      <div>
        <Label className="text-muted-foreground text-sm">{isAr ? "الرسالة" : "Message"}</Label>
        <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder={isAr ? "نص الرسالة..." : "Message text..."} rows={3} className="bg-muted border-border text-foreground mt-1" />
      </div>
    </>
  );

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> {isAr ? "رجوع" : "Back"}
          </Button>
          <BellRing className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isAr ? "مركز إشعارات أولياء الأمور" : "Parent Notification Center"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isAr ? "أرسل إشعارات لأولياء الأمور يدوياً أو بشكل جماعي" : "Send targeted or broadcast notifications to parents"}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-600 dark:text-blue-300">
            <p className="font-medium mb-1">{isAr ? "الإشعارات التلقائية مفعّلة" : "Auto-Notifications Active"}</p>
            <p className="text-blue-600 dark:text-blue-400">
              {isAr
                ? "يتم إرسال إشعارات تلقائية عند: تسجيل إصابة جديدة، إضافة وصفة طبية، أو إضافة تقييم مدرب مرئي لأولياء الأمور."
                : "Parents are automatically notified on: new injury recorded, prescription added, or coach feedback marked visible to parents."}
            </p>
          </div>
        </div>

        <Tabs defaultValue="player" className="space-y-4">
          <TabsList className="bg-muted border border-border">
            <TabsTrigger value="player" className="data-[state=active]:bg-blue-600">
              <Send className="h-4 w-4 mr-2" />{isAr ? "إرسال لولي أمر" : "Send to Parent"}
            </TabsTrigger>
            <TabsTrigger value="bulk" className="data-[state=active]:bg-blue-600">
              <Users className="h-4 w-4 mr-2" />{isAr ? "إرسال جماعي" : "Bulk Send"}
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-blue-600">
              <History className="h-4 w-4 mr-2" />{isAr ? "السجل" : "History"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="player">
            <Card className="bg-muted border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-base">{isAr ? "إرسال لولي أمر لاعب محدد" : "Send to a Specific Player's Parent"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">{isAr ? "اختر اللاعب" : "Select Player"}</Label>
                  <Select value={playerId} onValueChange={setPlayerId}>
                    <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                      <SelectValue placeholder={isAr ? "اختر لاعباً..." : "Choose a player..."} />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      {(players as any[]).map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)} className="text-foreground">{p.name} — {p.position}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormFields />
                <Button onClick={handleSendToPlayer} disabled={!playerId || !title || !message || notifyParent.isPending} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Send className="h-4 w-4 mr-2" />
                  {notifyParent.isPending ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال الإشعار" : "Send Notification")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bulk">
            <Card className="bg-muted border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-base">{isAr ? "إرسال جماعي لجميع أولياء الأمور" : "Broadcast to All Parents"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-sm">{isAr ? "تصفية حسب الفريق (اختياري)" : "Filter by Team (optional)"}</Label>
                  <Select value={bulkTeamId} onValueChange={setBulkTeamId}>
                    <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                      <SelectValue placeholder={isAr ? "جميع الفرق" : "All teams"} />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      <SelectItem value="all" className="text-foreground">{isAr ? "جميع الفرق" : "All Teams"}</SelectItem>
                      {(teams as any[]).map((t: any) => (
                        <SelectItem key={t.id} value={String(t.id)} className="text-foreground">{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <FormFields />
                <Button onClick={handleSendBulk} disabled={!title || !message || notifyAll.isPending} className="w-full bg-green-600 hover:bg-green-700">
                  <Users className="h-4 w-4 mr-2" />
                  {notifyAll.isPending ? (isAr ? "جاري الإرسال..." : "Sending...") : (isAr ? "إرسال لجميع أولياء الأمور" : "Send to All Parents")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card className="bg-muted border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-base flex items-center justify-between">
                  <span>{isAr ? "سجل الإشعارات" : "Notification History"}</span>
                  <Badge variant="outline" className="text-muted-foreground border-border">{filteredHistory.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder={isAr ? "بحث في الإشعارات..." : "Search notifications..."} className="bg-muted border-border text-foreground pl-9" />
                </div>
                {filteredHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-8">{isAr ? "لا توجد إشعارات بعد" : "No notifications yet"}</p>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredHistory.map((n: any) => (
                      <div key={n.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        {typeIcon(n.type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-foreground text-sm font-medium truncate">{n.title}</p>
                            <Badge variant="outline" className="text-xs text-muted-foreground border-border flex-shrink-0">{n.category}</Badge>
                          </div>
                          <p className="text-muted-foreground text-xs mt-0.5 line-clamp-2">{n.message}</p>
                          <p className="text-muted-foreground text-xs mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
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
