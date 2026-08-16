import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { BackButton } from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MessageSquare, Trophy, AlertTriangle, Brain, Heart, Zap,
  ChevronDown, ChevronUp, Reply, CheckCheck, Clock, Inbox,
  Star, Send, X
} from "lucide-react";

const MESSAGE_TYPES: Record<string, { label: string; labelAr: string; icon: any; color: string; bg: string }> = {
  feedback: { label: "Feedback", labelAr: "تغذية راجعة", icon: MessageSquare, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
  praise: { label: "Praise", labelAr: "إطراء", icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20" },
  correction: { label: "Correction", labelAr: "تصحيح", icon: AlertTriangle, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/20" },
  tactical: { label: "Tactical", labelAr: "تكتيكي", icon: Brain, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
  motivation: { label: "Motivation", labelAr: "تحفيز", icon: Heart, color: "text-pink-400", bg: "bg-pink-500/10 border-pink-500/20" },
  challenge: { label: "Challenge", labelAr: "تحدي", icon: Zap, color: "text-green-400", bg: "bg-green-500/10 border-green-500/20" },
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

export default function PlayerLockerRoom() {
  const { language } = useLanguage();
  const isRTL = language === "ar";

  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<number | null>(null);

  const { data: messages = [], refetch } = trpc.lockerRoom.getPlayerMessages.useQuery({ limit: 100 });

  const respondMutation = trpc.lockerRoom.respondToMessage.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? "تم إرسال ردك!" : "Reply sent!");
      setReplyingTo(null);
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const markReadMutation = trpc.lockerRoom.markAsRead.useMutation({
    onSuccess: () => refetch(),
  });

  const handleExpand = (id: number, isRead: boolean) => {
    setExpandedId(expandedId === id ? null : id);
    if (!isRead) markReadMutation.mutate({ messageId: id });
  };

  const handleReply = (msgId: number) => {
    const text = replyText[msgId];
    if (!text?.trim()) return toast.error(isRTL ? "اكتب رداً" : "Write a reply");
    respondMutation.mutate({ messageId: msgId, response: text });
  };

  const unreadCount = messages.filter((m: any) => !m.isRead).length;

  return (
    <>
      <div  style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a1628 100%)" }}>
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <BackButton />
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <Inbox className="w-4 h-4 text-white" />
                </div>
                {isRTL ? "صندوق رسائل المدرب" : "Coach Messages"}
                {unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <p className="text-white/60 text-sm mt-0.5">
                {isRTL ? "رسائل وتغذية راجعة من المدرب" : "Feedback, challenges & praise from your coach"}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: isRTL ? "إجمالي الرسائل" : "Total Messages", value: messages.length, color: "from-blue-500 to-indigo-600" },
              { label: isRTL ? "غير مقروءة" : "Unread", value: unreadCount, color: "from-orange-500 to-red-600" },
              { label: isRTL ? "ردودي" : "My Replies", value: messages.filter((m: any) => m.playerResponse).length, color: "from-green-500 to-emerald-600" },
            ].map((s, i) => (
              <div key={i} className="rounded-xl border border-white/10 p-4 text-center" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className={`text-2xl font-bold bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>{s.value}</div>
                <div className="text-xs text-white/60 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Messages */}
          <div className="space-y-3">
            {messages.length === 0 && (
              <div className="text-center py-16 text-white/60">
                <Inbox className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{isRTL ? "لا توجد رسائل من المدرب بعد" : "No messages from your coach yet"}</p>
              </div>
            )}
            {messages.map((msg: any) => {
              const typeInfo = MESSAGE_TYPES[msg.messageType] ?? MESSAGE_TYPES.feedback;
              const isExpanded = expandedId === msg.id;
              const isReplying = replyingTo === msg.id;

              return (
                <div
                  key={msg.id}
                  className={`rounded-xl border transition-all ${!msg.isRead ? "ring-1 ring-indigo-500/30" : ""} ${typeInfo.bg}`}
                >
                  <div
                    className="flex items-start gap-4 p-4 cursor-pointer"
                    onClick={() => handleExpand(msg.id, msg.isRead)}
                  >
                    {/* Type Icon */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInfo.bg}`}>
                      <typeInfo.icon className={`w-5 h-5 ${typeInfo.color}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-white font-medium text-sm">
                          {isRTL ? "من المدرب" : "From Coach"}
                        </span>
                        <Badge className={`text-xs px-2 py-0 ${typeInfo.bg} ${typeInfo.color} border-0`}>
                          {isRTL ? typeInfo.labelAr : typeInfo.label}
                        </Badge>
                        {msg.priority === "high" && (
                          <Badge className="text-xs px-2 py-0 bg-red-500/20 text-red-400 border-0">
                            🔴 {isRTL ? "عاجل" : "Urgent"}
                          </Badge>
                        )}
                        {!msg.isRead && (
                          <Badge className="text-xs px-2 py-0 bg-indigo-500/20 text-indigo-400 border-0">
                            <Clock className="w-3 h-3 mr-1 inline" />
                            {isRTL ? "جديد" : "New"}
                          </Badge>
                        )}
                        {msg.playerResponse && (
                          <Badge className="text-xs px-2 py-0 bg-green-500/20 text-green-400 border-0">
                            <CheckCheck className="w-3 h-3 mr-1 inline" />
                            {isRTL ? "رددت" : "Replied"}
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

                  {/* Expanded */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-4">
                      {/* Full message */}
                      <div className="bg-white/5 rounded-lg p-4 mb-4">
                        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      </div>

                      {/* Existing reply */}
                      {msg.playerResponse && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Reply className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 text-sm font-medium">
                              {isRTL ? "ردك" : "Your Reply"}
                            </span>
                            {msg.playerRespondedAt && (
                              <span className="text-white/60 text-xs">{timeAgo(msg.playerRespondedAt, isRTL)}</span>
                            )}
                          </div>
                          <p className="text-white/60 text-sm whitespace-pre-wrap">{msg.playerResponse}</p>
                        </div>
                      )}

                      {/* Reply form */}
                      {!msg.playerResponse && (
                        <div>
                          {!isReplying ? (
                            <Button
                              size="sm"
                              onClick={() => setReplyingTo(msg.id)}
                              className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs"
                            >
                              <Reply className="w-3 h-3" />
                              {isRTL ? "رد على المدرب" : "Reply to Coach"}
                            </Button>
                          ) : (
                            <div className="space-y-3">
                              <Textarea
                                value={replyText[msg.id] ?? ""}
                                onChange={(e) => setReplyText(prev => ({ ...prev, [msg.id]: e.target.value }))}
                                rows={3}
                                placeholder={isRTL ? "اكتب ردك هنا..." : "Write your reply here..."}
                                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 resize-none text-sm"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleReply(msg.id)}
                                  disabled={respondMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700 text-white gap-2 text-xs"
                                >
                                  <Send className="w-3 h-3" />
                                  {respondMutation.isPending ? (isRTL ? "جاري الإرسال..." : "Sending...") : (isRTL ? "إرسال" : "Send")}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setReplyingTo(null)}
                                  className="text-white/60 hover:text-white text-xs"
                                >
                                  <X className="w-3 h-3 mr-1" />
                                  {isRTL ? "إلغاء" : "Cancel"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
