import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AIBreadcrumb } from "@/components/AIBreadcrumb";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  Sparkles,
  MessageSquare,
  Trash2,
  Info,
  Zap,
  Brain,
  Save,
  History,
  ChevronRight,
  Clock,
  Target,
  Shield,
  Users,
  Dumbbell,
  Trophy,
  AlertTriangle,
  RefreshCw,
  Play,
  X,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "coach";
  text: string;
  timestamp: Date;
}

interface QuickCommand {
  icon: React.ElementType;
  label: string;
  prompt: string;
  color: string;
}

// Minimal Web Speech API typings (not included in TS's default DOM lib)
interface SpeechRecognitionResultItem {
  transcript: string;
}
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionResultItem;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

// Extend Window type for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

const ARABIC_QUICK_COMMANDS: QuickCommand[] = [
  { icon: Target, label: "اقترح تشكيلة", prompt: "اقترح لي أفضل تشكيلة لمواجهة فريق يلعب بضغط عالٍ وكيف أنظم الفريق تكتيكياً؟", color: "text-blue-500" },
  { icon: Shield, label: "الدفاع ضد الهجمات المرتدة", prompt: "كيف أنظم فريقي للدفاع بشكل فعال ضد الهجمات المرتدة السريعة؟", color: "text-red-500" },
  { icon: Zap, label: "ركلات الأركان", prompt: "أعطني 3 روتينات فعالة لركلات الأركان يمكن أن تفاجئ الخصم وتخلق فرص تسجيل.", color: "text-amber-700 dark:text-amber-500" },
  { icon: Users, label: "خطاب تحفيزي", prompt: "نخسر 0-1 في نهاية الشوط الأول. أعطني خطاباً تحفيزياً لقلب نتيجة المباراة.", color: "text-green-700 dark:text-green-500" },
  { icon: Dumbbell, label: "محفزات الضغط", prompt: "ما هي محفزات الضغط التي يجب أن أعلمها لفريقي للضغط بفعالية دون فقدان الشكل التكتيكي؟", color: "text-purple-500" },
  { icon: Trophy, label: "بناء عقلية الفوز", prompt: "كيف أبني عقلية الفوز والصمود في فريقي على مدار الموسم؟", color: "text-yellow-700 dark:text-yellow-500" },
  { icon: AlertTriangle, label: "أزمة الإصابات", prompt: "لدي 3 لاعبين أساسيين مصابون قبل مباراة مهمة. كيف أعيد التنظيم التكتيكي؟", color: "text-orange-700 dark:text-orange-500" },
  { icon: RefreshCw, label: "لعب الانتقال", prompt: "كيف أحسن انتقال فريقي من الدفاع إلى الهجوم بسرعة وفعالية؟", color: "text-teal-700 dark:text-teal-500" },
  { icon: Play, label: "البناء من الحارس", prompt: "ما أنماط اللعب التي يجب استخدامها للبناء من الحارس تحت الضغط؟", color: "text-cyan-700 dark:text-cyan-500" },
  { icon: Brain, label: "تحليل الخصم", prompt: "كيف أحلل نقاط ضعف الخصم من لقطات المباريات لاستغلالها في مباراتنا القادمة؟", color: "text-indigo-500" },
];

const QUICK_COMMANDS: QuickCommand[] = [
  { icon: Target, label: "Best formation vs high press", prompt: "What's the best formation to use against a team that plays a high press?", color: "text-blue-500" },
  { icon: Shield, label: "Defend counter attacks", prompt: "How do I organize my team to defend effectively against counter attacks?", color: "text-red-500" },
  { icon: Zap, label: "Set piece tips", prompt: "Give me 3 effective set piece routines for corners that can surprise the opponent.", color: "text-amber-700 dark:text-amber-500" },
  { icon: Users, label: "Half-time motivation", prompt: "We're losing 0-1 at half time. Give me a motivational team talk to turn the game around.", color: "text-green-700 dark:text-green-500" },
  { icon: Dumbbell, label: "Pressing triggers", prompt: "What pressing triggers should I teach my team to press effectively without losing shape?", color: "text-purple-500" },
  { icon: Trophy, label: "Winning mentality", prompt: "How do I build a winning mentality and resilience in my squad over the season?", color: "text-yellow-700 dark:text-yellow-500" },
  { icon: AlertTriangle, label: "Injury crisis", prompt: "I have 3 key players injured before a big match. How do I reorganize tactically?", color: "text-orange-700 dark:text-orange-500" },
  { icon: RefreshCw, label: "Transition play", prompt: "How do I improve my team's transition from defense to attack quickly and effectively?", color: "text-teal-700 dark:text-teal-500" },
  { icon: Play, label: "Build-up from GK", prompt: "What patterns of play should I use to build from the goalkeeper under pressure?", color: "text-cyan-700 dark:text-cyan-500" },
  { icon: Brain, label: "Opponent analysis", prompt: "How do I analyze an opponent's weaknesses from match footage to exploit in our next game?", color: "text-indigo-500" },
];

export default function VoiceCoach() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [isArabic, setIsArabic] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "coach",
      text: "Hello Coach! I'm your AI Voice Coach. Press the microphone button and ask me anything about tactics, training, player development, or match preparation. I'm here to help!",
      timestamp: new Date(),
    },
  ]);

  const toggleLanguage = () => {
    const newIsArabic = !isArabic;
    setIsArabic(newIsArabic);
    // Reset conversation with language-appropriate welcome
    setMessages([{
      id: "welcome",
      role: "coach",
      text: newIsArabic
        ? "مرحباً أيها المدرب! أنا مساعدك الذكي للتدريب الصوتي. اضغط على زر الميكروفون واسألني أي شيء عن التكتيكات أو التدريب أو تطوير اللاعبين أو الاستعداد للمباريات. أنا هنا للمساعدة!"
        : "Hello Coach! I'm your AI Voice Coach. Press the microphone button and ask me anything about tactics, training, player development, or match preparation. I'm here to help!",
      timestamp: new Date(),
    }]);
    toast.success(newIsArabic ? "تم التبديل إلى العربية 🇪🇬" : "Switched to English 🇬🇧");
  };
  const [isSupported, setIsSupported] = useState(true);
  const [activeTab, setActiveTab] = useState<"session" | "history">("session");
  const [isSavingSession, setIsSavingSession] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [loadingSessionId, setLoadingSessionId] = useState<number | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // tRPC
  const chatMutation = trpc.ai.chat.useMutation();
  const createContext = trpc.ai.createContext.useMutation();
  const contextIdRef = useRef<string | null>(null);
  // Squad context
  const { data: teamsData } = trpc.teams.getAll.useQuery();
  const [selectedContextTeam, setSelectedContextTeam] = useState<number | null>(null);
  const { data: squadPlayers } = trpc.players.getByTeam.useQuery(
    { teamId: selectedContextTeam! },
    { enabled: selectedContextTeam !== null }
  );
  const saveSessionMutation = trpc.tactical.saveVoiceSession.useMutation();
  const deleteSessionMutation = trpc.tactical.deleteVoiceSession.useMutation();
  const { data: sessionHistory, refetch: refetchHistory } = trpc.tactical.listVoiceSessions.useQuery();
  const getSessionQuery = trpc.tactical.getVoiceSession.useQuery(
    { id: loadingSessionId! },
    { enabled: loadingSessionId !== null }
  );

  // Initialize AI context on mount
  useEffect(() => {
    createContext.mutateAsync().then(res => {
      contextIdRef.current = res.contextId;
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load session when selected
  useEffect(() => {
    if (loadingSessionId !== null && getSessionQuery.data) {
      const session = getSessionQuery.data;
      const loadedMessages: Message[] = session.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
      setMessages(loadedMessages);
      setActiveTab("session");
      setLoadingSessionId(null);
      toast.success(`Session "${session.title}" loaded`);
    }
  }, [getSessionQuery.data, loadingSessionId]);

  const getCoachResponse = useCallback(async (userText: string): Promise<string> => {
    try {
      // Build squad context string
      let squadContext = "";
      if (squadPlayers && squadPlayers.length > 0 && teamsData) {
        const team = (teamsData as any[]).find((t: any) => t.id === selectedContextTeam);
        const teamName = team?.name || "Selected Team";
        const playerList = (squadPlayers as any[]).slice(0, 22).map((p: any) =>
          `#${p.jerseyNumber || "?"} ${p.firstName} ${p.lastName} (${p.position || "?"}, Age ${p.dateOfBirth ? new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear() : "?"})`
        ).join("; ");
        squadContext = `\n\n[SQUAD CONTEXT — ${teamName}]\nPlayers: ${playerList}\nPlease give specific advice referencing these real squad members where relevant.`;
      }
      const result = await chatMutation.mutateAsync({
        message: userText + squadContext,
        contextId: contextIdRef.current || undefined,
        currentPage: 'voice-coach',
      });
      // response may come back as structured content blocks rather than text.
      if (typeof result.response === "string" && result.response) return result.response;
      if (result.response) return JSON.stringify(result.response);
      return "I couldn't generate a response. Please try again.";
    } catch {
      return "I'm having trouble connecting right now. Please check your connection and try again.";
    }
  }, [chatMutation]);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }
    synthRef.current = window.speechSynthesis;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = isArabic ? "ar-EG" : "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }
      setTranscript(finalTranscript || interimTranscript);
      if (finalTranscript) {
        handleUserSpeech(finalTranscript);
      }
    };

    recognition.onerror = (event) => {
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast.error(`Microphone error: ${event.error}`);
      }
      setIsListening(false);
      setTranscript("");
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      synthRef.current?.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isArabic]);

  // Update recognition language when isArabic changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = isArabic ? "ar-EG" : "en-US";
    }
  }, [isArabic]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleUserSpeech = useCallback(async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      text: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setTranscript("");
    setIsProcessing(true);

    try {
      const response = await getCoachResponse(text.trim());
      const coachMsg: Message = {
        id: `coach-${Date.now()}`,
        role: "coach",
        text: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, coachMsg]);

      if (!isMuted && synthRef.current) {
        speakText(response);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [getCoachResponse, isMuted]);

  const speakText = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = isArabic ? 0.9 : 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    const voices = synthRef.current.getVoices();
    const preferred = isArabic
      ? (voices.find(v => v.lang === "ar-EG") || voices.find(v => v.lang.startsWith("ar")))
      : (voices.find(v => v.lang === "en-GB" && v.name.includes("Male"))
          || voices.find(v => v.lang === "en-US" && !v.name.includes("Female"))
          || voices.find(v => v.lang.startsWith("en")));
    if (preferred) utterance.voice = preferred;
    if (isArabic) utterance.lang = "ar-EG";
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.current.speak(utterance);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      synthRef.current?.cancel();
      setIsSpeaking(false);
      setTranscript("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        toast.error("Could not start microphone. Please allow microphone access.");
      }
    }
  };

  const toggleMute = () => {
    if (!isMuted && synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  const clearConversation = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
    setMessages([{
      id: "welcome",
      role: "coach",
      text: "Conversation cleared. Ready for a new session! Press the microphone to start.",
      timestamp: new Date(),
    }]);
  };

  const handleSaveSession = async () => {
    const title = sessionTitle.trim() || `Session ${new Date().toLocaleDateString()}`;
    const nonWelcomeMessages = messages.filter(m => m.id !== "welcome");
    if (nonWelcomeMessages.length === 0) {
      toast.error("No conversation to save yet.");
      return;
    }
    setIsSavingSession(true);
    try {
      await saveSessionMutation.mutateAsync({
        title,
        messages: nonWelcomeMessages.map(m => ({
          ...m,
          timestamp: m.timestamp.toISOString(),
        })),
      });
      toast.success(`Session "${title}" saved!`);
      setSaveDialogOpen(false);
      setSessionTitle("");
      refetchHistory();
    } catch {
      toast.error("Failed to save session.");
    } finally {
      setIsSavingSession(false);
    }
  };

  const handleDeleteSession = async (id: number) => {
    try {
      await deleteSessionMutation.mutateAsync({ id });
      toast.success("Session deleted.");
      refetchHistory();
    } catch {
      toast.error("Failed to delete session.");
    }
  };

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <AIBreadcrumb toolLabel="Voice Coach" />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Mic className="h-8 w-8 text-primary" />
                AI Voice Coach
              </h1>
              <p className="text-muted-foreground mt-2">
                Speak naturally with your AI coaching assistant — ask tactical questions, get training advice, and prepare for matches hands-free.
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
              {/* Squad Context Selector */}
              {teamsData && (teamsData as any[]).length > 0 && (
                <select
                  value={selectedContextTeam ?? ""}
                  onChange={e => setSelectedContextTeam(e.target.value ? Number(e.target.value) : null)}
                  className="text-xs bg-background border border-input rounded-md px-2 py-1.5 text-foreground h-9"
                  title={isArabic ? "اختر الفريق للسياق" : "Select squad for context-aware AI"}
                >
                  <option value="">{isArabic ? "بدون سياق الفريق" : "No squad context"}</option>
                  {(teamsData as any[]).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
              {/* Language Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLanguage}
                className={isArabic ? "border-green-500 text-green-600 bg-green-50 dark:bg-green-950" : ""}
                title={isArabic ? "Switch to English" : "التبديل إلى العربية"}
              >
                {isArabic ? "🇬🇧 English" : "🇪🇬 عربي"}
              </Button>
              <Button
                variant={activeTab === "session" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("session")}
              >
                <Mic className="h-4 w-4 mr-1" /> {isArabic ? "جلسة مباشرة" : "Live Session"}
              </Button>
              <Button
                variant={activeTab === "history" ? "default" : "outline"}
                size="sm"
                onClick={() => { setActiveTab("history"); refetchHistory(); }}
              >
                <History className="h-4 w-4 mr-1" /> {isArabic ? "السجل" : "History"}
                {sessionHistory && sessionHistory.length > 0 && (
                  <Badge className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {sessionHistory.length}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>

        {!isSupported && (
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-700 dark:text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-600">Voice not supported in this browser</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please use Google Chrome or Microsoft Edge for full voice support. You can still use the quick command buttons below.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── SESSION TAB ── */}
        {activeTab === "session" && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Voice Control Panel */}
              <div className="lg:col-span-1 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Zap className="h-4 w-4 text-primary" />
                      Voice Control
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    {/* Mic Button */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="relative">
                        {isListening && (
                          <span className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
                        )}
                        <button
                          onClick={toggleListening}
                          disabled={!isSupported || isProcessing}
                          className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                            isListening
                              ? "bg-red-500 hover:bg-red-600 text-white scale-110"
                              : isProcessing
                              ? "bg-muted text-muted-foreground cursor-not-allowed"
                              : "bg-primary hover:bg-primary/90 text-primary-foreground"
                          }`}
                        >
                          {isProcessing ? (
                            <Loader2 className="h-10 w-10 animate-spin" />
                          ) : isListening ? (
                            <MicOff className="h-10 w-10" />
                          ) : (
                            <Mic className="h-10 w-10" />
                          )}
                        </button>
                      </div>

                      <div className="text-center">
                        {isListening && (
                          <Badge variant="outline" className="border-red-400 text-red-500 animate-pulse">
                            Listening...
                          </Badge>
                        )}
                        {isProcessing && (
                          <Badge variant="outline" className="border-primary text-primary">
                            <Brain className="h-3 w-3 mr-1" />
                            Thinking...
                          </Badge>
                        )}
                        {isSpeaking && !isListening && !isProcessing && (
                          <Badge variant="outline" className="border-green-400 text-green-700 dark:text-green-500">
                            <Volume2 className="h-3 w-3 mr-1" />
                            Speaking...
                          </Badge>
                        )}
                        {!isListening && !isProcessing && !isSpeaking && (
                          <p className="text-xs text-muted-foreground">
                            {isSupported ? "Tap to speak" : "Voice unavailable"}
                          </p>
                        )}
                      </div>

                      {transcript && (
                        <div className="w-full p-3 bg-muted rounded-lg text-sm text-muted-foreground italic">
                          "{transcript}"
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={toggleMute}>
                        {isMuted ? <><VolumeX className="h-4 w-4 mr-1" /> Unmute</> : <><Volume2 className="h-4 w-4 mr-1" /> Mute</>}
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={clearConversation}>
                        <Trash2 className="h-4 w-4 mr-1" /> Clear
                      </Button>
                    </div>

                    {/* Save Session */}
                    {messages.filter(m => m.id !== "welcome").length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-primary/40 text-primary hover:bg-primary/10"
                        onClick={() => setSaveDialogOpen(true)}
                      >
                        <Save className="h-4 w-4 mr-1" /> Save Session
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Save Dialog */}
                {saveDialogOpen && (
                  <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">Save this session</p>
                        <button onClick={() => setSaveDialogOpen(false)}>
                          <X className="h-4 w-4 text-muted-foreground" />
                        </button>
                      </div>
                      <div>
                        <Label className="text-xs">Session Title</Label>
                        <Input
                          placeholder={`Session ${new Date().toLocaleDateString()}`}
                          value={sessionTitle}
                          onChange={e => setSessionTitle(e.target.value)}
                          className="h-8 text-sm mt-1"
                        />
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={handleSaveSession}
                        disabled={isSavingSession}
                      >
                        {isSavingSession ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                        Save
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Conversation Panel */}
              <div className="lg:col-span-2">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Coaching Session
                    </CardTitle>
                    <CardDescription>
                      {messages.filter(m => m.id !== "welcome").length} exchanges this session
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-y-auto max-h-[480px] space-y-4 pr-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.role === "coach"
                              ? "bg-primary/10 text-primary"
                              : "bg-blue-500/10 text-blue-500"
                          }`}
                        >
                          {msg.role === "coach" ? (
                            <Sparkles className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                        </div>
                        <div
                          className={`flex-1 max-w-[85%] p-3 rounded-xl text-sm ${
                            msg.role === "coach"
                              ? "bg-muted text-foreground"
                              : "bg-primary text-primary-foreground ml-auto"
                          }`}
                        >
                          <p className="leading-relaxed">{msg.text}</p>
                          <p className={`text-xs mt-1 ${msg.role === "coach" ? "text-muted-foreground" : "text-primary-foreground/70"}`}>
                            {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isProcessing && (
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div className="p-3 rounded-xl bg-muted">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Quick Commands Grid */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-700 dark:text-amber-500" />
                  {isArabic ? "أوامر سريعة" : "Quick Commands"}
                </CardTitle>
                <CardDescription>
                  {isArabic ? "اضغط على أي أمر للتحدث فوراً مع المدرب الذكي" : "Tap any command to instantly ask the AI Coach"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2" dir={isArabic ? 'rtl' : 'ltr'}>
                  {(isArabic ? ARABIC_QUICK_COMMANDS : QUICK_COMMANDS).map((cmd, idx) => {
                    const Icon = cmd.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleUserSpeech(cmd.prompt)}
                        disabled={isProcessing || isListening}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl bg-muted hover:bg-muted/70 border border-border hover:border-primary/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-center group"
                      >
                        <div className={`p-2 rounded-lg bg-background ${cmd.color} group-hover:scale-110 transition-transform`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-xs font-medium leading-tight">{cmd.label}</span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4 text-primary" />
                Saved Sessions
              </CardTitle>
              <CardDescription>
                {sessionHistory?.length ?? 0} saved coaching sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!sessionHistory || sessionHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <History className="h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">No saved sessions yet.</p>
                  <p className="text-sm text-muted-foreground">
                    Have a conversation and click "Save Session" to store it here.
                  </p>
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("session")}>
                    <Mic className="h-4 w-4 mr-1" /> Start a Session
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {sessionHistory.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-primary/10 text-primary flex-shrink-0">
                        <MessageSquare className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{session.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {session.messageCount} messages
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(session.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setLoadingSessionId(session.id)}
                          disabled={loadingSessionId === session.id}
                        >
                          {loadingSessionId === session.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <><ChevronRight className="h-3.5 w-3.5 mr-1" /> Load</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteSession(session.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Info Banner */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Powered by Gemini 2.5 Flash + Web Speech API</p>
                <p className="text-muted-foreground mt-0.5">
                  Voice recognition runs locally in your browser (free, no data sent). AI responses are generated by Google Gemini 2.5 Flash. For best results, use Chrome or Edge and allow microphone access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
