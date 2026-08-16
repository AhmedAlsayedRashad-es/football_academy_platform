import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  MessageSquare, Send, CheckCheck, Clock, Trophy, Target, Zap,
  Brain, Heart, Star, Filter, Search, ChevronDown, ChevronUp,
  User, Video, AlertTriangle, TrendingUp, Plus, X, Eye, Reply,
  Inbox, BarChart2
} from "lucide-react";

const MESSAGE_TYPES = [
  { value: "feedback", label: "Feedback", labelAr: "تغذية راجعة", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  { value: "praise", label: "Praise", labelAr: "إطراء", icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { value: "correction", label: "Correction", labelAr: "تصحيح", icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  { value: "tactical", label: "Tactical", labelAr: "تكتيكي", icon: Brain, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  { value: "motivation", label: "Motivation", labelAr: "تحفيز", icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  { value: "challenge", label: "Challenge", labelAr: "تحدي", icon: Zap, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-white/60",
  normal: "text-blue-400",
  high: "text-red-400",
};

function timeAgo(date: string | Date, isRTL: boolean) {
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return isRTL ? "الآن" : "just now";
  if (mins < 60) return isRTL ? `منذ ${mins} دقيقة` : `${mins}m ago`;
  if (hours < 24) return isRTL ? `منذ ${hours} ساعة` : `${hours}h ago`;
  return isRTL ? `منذ ${days} يوم` : `${days}d ago`;
}

export default function DigitalLockerRoom() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  // Form state
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [messageType, setMessageType] = useState<string>("feedback");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<string>("normal");
  const [showForm, setShowForm] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Data
  const { data: players = [] } = trpc.lockerRoom.getMyPlayers.useQuery();
  const { data: messages = [], refetch } = trpc.lockerRoom.getCoachMessages.useQuery({ limit: 100 });
  const { data: stats } = trpc.lockerRoom.getStats.useQuery();

  const sendMutation = trpc.lockerRoom.sendMessage.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? "تم إرسال الرسالة بنجاح!" : "Message sent successfully!");
      setShowForm(false);
      setContent("");
      setSubject("");
      setSelectedPlayerId(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = trpc.lockerRoom.deleteMessage.useMutation({
    onSuccess: () => { toast.success(isRTL ? "تم الحذف" : "Deleted"); refetch(); },
  });

  const aiSuggestMutation = trpc.lockerRoom.generateMessageSuggestion.useMutation({
    onSuccess: (data) => {
      if (data.suggestion) {
        setContent(data.suggestion);
        toast.success(isRTL ? "تم توليد الرسالة بالذكاء الاصطناعي" : "AI message generated!");
      }
    },
    onError: (e) => toast.error("AI suggestion failed: " + e.message),
  });

  const handleAISuggest = () => {
    const player = (players as any[]).find((p: any) => p.id === selectedPlayerId);
    if (!player) return toast.error(isRTL ? "اختر لاعباً أولاً" : "Select a player first");
    aiSuggestMutation.mutate({
      playerName: `${player.firstName} ${player.lastName}`,
      playerPosition: player.position ?? undefined,
      messageType: messageType as any,
      context: subject || undefined,
    });
  };

  const handleSend = () => {
    if (!selectedPlayerId) return toast.error(isRTL ? "اختر لاعباً" : "Select a player");
    if (!content.trim()) return toast.error(isRTL ? "اكتب رسالة" : "Write a message");
    sendMutation.mutate({
      playerId: selectedPlayerId,
      messageType: messageType as any,
      subject: subject || undefined,
      content,
      priority: priority as any,
    });
  };

  // Filter messages
  const filtered = messages.filter((m: any) => {
    const name = `${m.playerFirstName ?? ""} ${m.playerLastName ?? ""}`.toLowerCase();
    const matchSearch = !searchQuery || name.includes(searchQuery.toLowerCase()) || (m.subject ?? "").toLowerCase().includes(searchQuery.toLowerCase()) || m.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === "all" || m.messageType === filterType;
    return matchSearch && matchType;
  });

  const getTypeInfo = (type: string) => MESSAGE_TYPES.find(t => t.value === type) ?? MESSAGE_TYPES[0];

  return (
    <>
      <div  style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a1628 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <BackButton />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <Inbox className="w-4 h-4 text-white" />
                </div>
                {isRTL ? "غرفة الملابس الرقمية" : "Digital Locker Room"}
              </h1>
              <p className="text-white/60 text-sm mt-0.5">
                {isRTL ? "أرسل تغذية راجعة وتحديات مباشرة للاعبين" : "Send feedback, challenges & praise directly to players"}
              </p>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="brand-gradient text-white gap-2"
            >
              {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isRTL ? "رسالة جديدة" : "New Message"}
            </Button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: isRTL ? "إجمالي الرسائل" : "Total Sent", value: stats?.total ?? 0, icon: MessageSquare, color: "from-blue-500 to-indigo-600" },
              { label: isRTL ? "لم تُقرأ" : "Unread", value: stats?.unread ?? 0, icon: Eye, color: "from-orange-500 to-red-600" },
              { label: isRTL ? "ردود اللاعبين" : "Player Replies", value: stats?.responded ?? 0, icon: Reply, color: "from-green-500 to-emerald-600" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-white/10 p-4" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center`}>
                    <s.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{s.value}</div>
                    <div className="text-xs text-white/60">{s.label}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compose Form */}
          {showForm && (
            <div className="rounded-2xl border border-indigo-500/30 p-6 mb-6" style={{ background: "rgba(99,102,241,0.05)" }}>
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
                {isRTL ? "إرسال رسالة جديدة" : "Compose New Message"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Player Select */}
                <div>
                  <label className="text-xs text-white/60 mb-1 block">{isRTL ? "اختر اللاعب" : "Select Player"}</label>
                  <Select onValueChange={(v) => setSelectedPlayerId(Number(v))}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder={isRTL ? "اختر لاعباً..." : "Choose a player..."} />
                    </SelectTrigger>
                    <SelectContent className="bg-white/5 border-white/10">
                      {players.map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)} className="text-white hover:bg-white/10">
                          {p.firstName} {p.lastName} — {p.position ?? ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Message Type */}
                <div>
                  <label className="text-xs text-white/60 mb-1 block">{isRTL ? "نوع الرسالة" : "Message Type"}</label>
                  <div className="flex flex-wrap gap-2">
                    {MESSAGE_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setMessageType(t.value)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${messageType === t.value ? t.bg + " " + t.color : "border-white/10 text-white/60 hover:border-white/20"}`}
                      >
                        <t.icon className="w-3 h-3" />
                        {isRTL ? t.labelAr : t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                  <label className="text-xs text-white/60 mb-1 block">{isRTL ? "الموضوع (اختياري)" : "Subject (optional)"}</label>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={isRTL ? "مثال: أداء التمرير في المباراة الأخيرة" : "e.g. Passing performance in last match"}
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/60 mb-1 block">{isRTL ? "الأولوية" : "Priority"}</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white/5 border-white/10">
                      <SelectItem value="low" className="text-white/60">🔵 {isRTL ? "منخفضة" : "Low"}</SelectItem>
                      <SelectItem value="normal" className="text-blue-400">🟡 {isRTL ? "عادية" : "Normal"}</SelectItem>
                      <SelectItem value="high" className="text-red-400">🔴 {isRTL ? "عالية" : "High"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-white/60">{isRTL ? "الرسالة" : "Message"}</label>
                  <button
                    type="button"
                    onClick={handleAISuggest}
                    disabled={aiSuggestMutation.isPending || !selectedPlayerId}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-purple-600/20 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Brain className="w-3 h-3" />
                    {aiSuggestMutation.isPending ? (isRTL ? "جاري التوليد..." : "Generating...") : (isRTL ? "اقتراح بالذكاء الاصطناعي" : "AI Suggest")}
                  </button>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  placeholder={isRTL ? "اكتب رسالتك للاعب هنا، أو اضغط 'اقتراح بالذكاء الاصطناعي'..." : "Write your message here, or click 'AI Suggest' to generate one..."}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none"
                />
                <div className="text-right text-xs text-white/60 mt-1">{content.length}/5000</div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={() => setShowForm(false)} className="text-white/60 hover:text-white">
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={sendMutation.isPending}
                  className="brand-gradient text-white gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sendMutation.isPending ? (isRTL ? "جاري الإرسال..." : "Sending...") : (isRTL ? "إرسال" : "Send")}
                </Button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? "بحث باسم اللاعب أو الموضوع..." : "Search by player or subject..."}
                className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {["all", ...MESSAGE_TYPES.map(t => t.value)].map((type) => {
                const info = MESSAGE_TYPES.find(t => t.value === type);
                return (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className={`px-3 py-1.5 rounded-lg text-xs border transition-all ${filterType === type
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "border-white/10 text-white/60 hover:border-white/20"
                    }`}
                  >
                    {type === "all" ? (isRTL ? "الكل" : "All") : (isRTL ? info?.labelAr : info?.label)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messages List */}
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="text-center py-16 text-white/60">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{isRTL ? "لا توجد رسائل" : "No messages yet"}</p>
                <p className="text-sm mt-1">{isRTL ? "ابدأ بإرسال رسالة لأحد اللاعبين" : "Start by sending a message to a player"}</p>
              </div>
            )}
            {filtered.map((msg: any) => {
              const typeInfo = getTypeInfo(msg.messageType);
              const isExpanded = expandedId === msg.id;
              return (
                <div
                  key={msg.id}
                  className={`rounded-xl border transition-all ${typeInfo.bg}`}
                >
                  <div
                    className="flex items-start gap-4 p-4 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                  >
                    {/* Type Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInfo.bg}`}>
                      <typeInfo.icon className={`w-5 h-5 ${typeInfo.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-medium">
                          {msg.playerFirstName} {msg.playerLastName}
                        </span>
                        <Badge className={`text-xs px-2 py-0 ${typeInfo.bg} ${typeInfo.color} border-0`}>
                          {isRTL ? typeInfo.labelAr : typeInfo.label}
                        </Badge>
                        {msg.priority === "high" && (
                          <Badge className="text-xs px-2 py-0 bg-red-500/20 text-red-400 border-0">
                            🔴 {isRTL ? "عاجل" : "High"}
                          </Badge>
                        )}
                        {msg.playerResponse && (
                          <Badge className="text-xs px-2 py-0 bg-green-500/20 text-green-400 border-0">
                            <Reply className="w-3 h-3 mr-1 inline" />
                            {isRTL ? "رد" : "Replied"}
                          </Badge>
                        )}
                        {!msg.isRead && (
                          <Badge className="text-xs px-2 py-0 bg-orange-500/20 text-orange-400 border-0">
                            {isRTL ? "لم يُقرأ" : "Unread"}
                          </Badge>
                        )}
                      </div>
                      {msg.subject && (
                        <p className="text-white/60 text-sm font-medium mb-0.5">{msg.subject}</p>
                      )}
                      <p className="text-white/60 text-sm line-clamp-2">{msg.content}</p>
                      <p className="text-slate-600 text-xs mt-1">{timeAgo(msg.createdAt, isRTL)}</p>
                    </div>

                    {/* Expand */}
                    <button className="text-white/60 hover:text-white flex-shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-4">
                      <div className="bg-white/5 rounded-lg p-4 mb-4">
                        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {msg.playerResponse && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Reply className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">
                              {isRTL ? "رد اللاعب" : "Player's Reply"}
                            </span>
                            {msg.playerRespondedAt && (
                              <span className="text-white/60 text-xs">{timeAgo(msg.playerRespondedAt, isRTL)}</span>
                            )}
                          </div>
                          <p className="text-white/60 text-sm whitespace-pre-wrap">{msg.playerResponse}</p>
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate({ messageId: msg.id })}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs"
                        >
                          <X className="w-3 h-3 mr-1" />
                          {isRTL ? "حذف" : "Delete"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
