import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import {Brain, Send, Loader2, Lightbulb, TrendingUp, Users, Target, User, Shield,
  Dumbbell, Calendar, Zap, Trophy, Activity, RefreshCw, Copy, Download,
  MessageSquare, ChevronRight, Star, AlertCircle, CheckCircle, Clipboard, ArrowLeft} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { AIBreadcrumb } from "@/components/AIBreadcrumb";



interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  mode?: string;
}

const QUICK_PROMPTS = {
  general: [
    { icon: Users, title: 'Formation vs 4-3-3', titleAr: 'تشكيلة ضد 4-3-3', q: 'What formation and tactical approach should I use against a team that plays 4-3-3 with high pressing and fast wingers?', qAr: 'ما التشكيلة والنهج التكتيكي المناسب لمواجهة فريق يلعب 4-3-3 مع ضغط عالٍ وأجنحة سريعة؟' },
    { icon: Target, title: 'Attacking Transitions', titleAr: 'التحولات الهجومية', q: 'How can I improve my team\'s attacking transitions from defense to attack? What specific drills and patterns should I implement?', qAr: 'كيف أحسّن تحولات فريقي من الدفاع إلى الهجوم؟ ما التمارين والأنماط التي يجب تطبيقها؟' },
    { icon: TrendingUp, title: 'Youth Development', titleAr: 'تطوير الشباب', q: 'What is the best training methodology for developing young midfielders aged 14-16? Include weekly schedule and key skills to focus on.', qAr: 'ما أفضل منهجية تدريب لتطوير لاعبي وسط الشباب بين 14-16 سنة؟ اذكر الجدول الأسبوعي والمهارات الأساسية.' },
    { icon: Shield, title: 'Defensive Shape', titleAr: 'الشكل الدفاعي', q: 'How do I set up a solid defensive shape that is hard to break down while still being able to transition quickly to attack?', qAr: 'كيف أضع شكلاً دفاعياً متيناً يصعب اختراقه مع القدرة على التحول السريع للهجوم؟' },
    { icon: Zap, title: 'Set Piece Strategy', titleAr: 'استراتيجية الكرات الثابتة', q: 'Design an effective corner kick routine and free kick strategy for my team. Include both attacking and defensive set pieces.', qAr: 'صمّم روتين ركلة زاوية فعالة واستراتيجية ضربات حرة لفريقي. شمل الكرات الثابتة هجوماً ودفاعاً.' },
    { icon: Activity, title: 'Pre-Match Preparation', titleAr: 'التحضير للمباراة', q: 'What should be the complete pre-match preparation routine for the day before and day of an important match?', qAr: 'ما هو برنامج التحضير الكامل لليوم السابق ويوم المباراة المهمة؟' },
  ],
  player: [
    { icon: User, title: 'Technical Drills', titleAr: 'تمارين تقنية', q: 'What specific technical drills should I use to improve this player\'s weakest skills? Give me a 4-week progressive plan.', qAr: 'ما التمارين التقنية المحددة لتحسين أضعف مهارات هذا اللاعب؟ أعطني خطة تطويرية لمدة 4 أسابيع.' },
    { icon: TrendingUp, title: '3-Month Plan', titleAr: 'خطة 3 أشهر', q: 'Create a comprehensive 3-month development plan for this player based on their position and current performance data.', qAr: 'أنشئ خطة تطوير شاملة لمدة 3 أشهر لهذا اللاعب بناءً على مركزه وبيانات أدائه الحالية.' },
    { icon: Target, title: 'Position Fit', titleAr: 'أنسب مركز', q: 'Based on this player\'s physical and technical profile, what position or role suits them best? Should we consider repositioning them?', qAr: 'بناءً على الملف البدني والتقني لهذا اللاعب، ما المركز الأنسب له؟ هل يجب تغيير مركزه؟' },
    { icon: Brain, title: 'Mental Coaching', titleAr: 'التدريب الذهني', q: 'What mental coaching strategies should I use to help this player improve their decision-making and confidence under pressure?', qAr: 'ما استراتيجيات التدريب الذهني لتحسين اتخاذ القرار والثقة تحت الضغط؟' },
  ],
  team: [
    { icon: Shield, title: 'Team Strengths', titleAr: 'نقاط قوة الفريق', q: 'Analyze this team\'s composition and identify the main strengths I should build our tactics around.', qAr: 'حلل تشكيلة هذا الفريق وحدد نقاط القوة الرئيسية التي يجب بناء تكتيكاتنا حولها.' },
    { icon: Users, title: 'Best Formation', titleAr: 'أفضل تشكيلة', q: 'Based on this team\'s player profiles and positions, what formation and style of play would maximize our potential?', qAr: 'بناءً على ملفات لاعبي هذا الفريق، ما التشكيلة وأسلوب اللعب الأمثل؟' },
    { icon: Target, title: 'Training Priority', titleAr: 'أولويات التدريب', q: 'What should be the top 3 training priorities for this team this month based on their performance data?', qAr: 'ما أهم 3 أولويات تدريبية لهذا الفريق هذا الشهر بناءً على بيانات الأداء؟' },
    { icon: Zap, title: 'Match Tactics', titleAr: 'تكتيكات المباراة', q: 'Design a complete tactical game plan for this team for an upcoming match. Include formation, pressing triggers, and set pieces.', qAr: 'صمّم خطة تكتيكية كاملة لمباراة قادمة. شمل التشكيلة ومحفزات الضغط والكرات الثابتة.' },
  ],
  drills: [
    { icon: Dumbbell, title: 'Passing & Movement', titleAr: 'تمرير وتحرك', q: 'Design 5 progressive passing and movement drills suitable for a 90-minute training session. Include diagrams description, player numbers, and coaching points.', qAr: 'صمّم 5 تمارين تمرير وتحرك تدريجية لجلسة 90 دقيقة. شمل وصف الرسومات وعدد اللاعبين ونقاط التدريب.' },
    { icon: Zap, title: 'Pressing Drills', titleAr: 'تمارين الضغط', q: 'Create a series of pressing and counter-pressing exercises that teach players when and how to press effectively as a team.', qAr: 'أنشئ سلسلة تمارين ضغط وضغط مضاد تعلّم اللاعبين متى وكيف يضغطون بفعالية كفريق.' },
    { icon: Target, title: 'Finishing Drills', titleAr: 'تمارين التسديد', q: 'Design 4 finishing drills that progress from simple to complex, focusing on composure in front of goal and different finishing techniques.', qAr: 'صمّم 4 تمارين تسديد تتدرج من البسيط للمعقد، مع التركيز على الهدوء أمام المرمى وتقنيات التسديد.' },
    { icon: Activity, title: 'Physical Conditioning', titleAr: 'التكييف البدني', q: 'Create a football-specific conditioning session that improves both aerobic capacity and explosive speed. Include warm-up, main session, and cool-down.', qAr: 'أنشئ جلسة تكييف خاصة بكرة القدم تحسّن القدرة الهوائية والسرعة الانفجارية. شمل الإحماء والجلسة الرئيسية والتهدئة.' },
  ],
};

export default function AICoachAssistantEnhanced() {
  const [, navigate] = useLocation();
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState<Message[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('none');
  const [selectedTeam, setSelectedTeam] = useState<string>('none');
  const [activeTab, setActiveTab] = useState<string>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [matchOpponent, setMatchOpponent] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [matchFormation, setMatchFormation] = useState('4-3-3');
  const [isGeneratingMatchPlan, setIsGeneratingMatchPlan] = useState(false);
  const [matchPlan, setMatchPlan] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language } = useLanguage();

  const { data: players } = trpc.players.getAll.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();

  const askCoachMutation = trpc.aiCoach.askQuestion.useMutation({
    onSuccess: (response) => {
      setConversation(prev => [...prev, {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        mode: activeTab,
      }]);
      setIsLoading(false);
      setIsGeneratingMatchPlan(false);
    },
    onError: (err) => {
      toast.error('AI Coach error: ' + err.message);
      setIsLoading(false);
      setIsGeneratingMatchPlan(false);
    },
  });

  const analyzePlayerMutation = trpc.aiCoach.analyzePlayer.useMutation({
    onSuccess: (response) => {
      setConversation(prev => [
        ...prev,
        { role: 'user', content: `Full analysis of player: ${response.playerName}`, timestamp: new Date(), mode: 'player' },
        { role: 'assistant', content: response.analysis, timestamp: new Date(), mode: 'player' },
      ]);
      setIsLoading(false);
    },
    onError: (err) => {
      toast.error('Analysis error: ' + err.message);
      setIsLoading(false);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleAsk = (overrideQuestion?: string) => {
    const q = overrideQuestion || question;
    if (!q.trim()) return;

    const playerId = selectedPlayer !== 'none' ? parseInt(selectedPlayer) : undefined;
    const teamId = selectedTeam !== 'none' ? parseInt(selectedTeam) : undefined;

    // Build context-aware question
    let contextualQ = q;
    if (playerId) {
      const player = players?.find((p: any) => p.id === playerId);
      if (player) contextualQ = `[Context: Analyzing player ${player.firstName} ${player.lastName}, ${player.position}, Age Group: ${player.ageGroup}]\n\n${q}`;
    }
    if (teamId) {
      const team = teams?.find((t: any) => t.id === teamId);
      if (team) contextualQ = `[Context: Analyzing team ${team.name}, Age Group: ${team.ageGroup}]\n\n${q}`;
    }

    setConversation(prev => [...prev, { role: 'user', content: q, timestamp: new Date(), mode: activeTab }]);
    setIsLoading(true);
    setQuestion('');

    askCoachMutation.mutate({
      question: contextualQ,
      context: (activeTab === 'drills' ? 'training' : activeTab === 'team' ? 'tactical' : activeTab) as any,
      playerId,
      teamId,
    });
  };

  const handleAnalyzePlayer = () => {
    if (selectedPlayer === 'none') return;
    setIsLoading(true);
    analyzePlayerMutation.mutate({ playerId: parseInt(selectedPlayer) });
  };

  const generateMatchPrep = async () => {
    if (!matchOpponent) { toast.error('Please enter opponent name'); return; }
    setIsGeneratingMatchPlan(true);
    setMatchPlan('');
    const teamId = selectedTeam !== 'none' ? parseInt(selectedTeam) : undefined;
    const team = teamId ? teams?.find((t: any) => t.id === teamId) : null;

    const prompt = `Create a comprehensive match preparation plan for Future Stars Academy${team ? ` (${team.name})` : ''} vs ${matchOpponent}${matchDate ? ` on ${matchDate}` : ''}.

Our formation: ${matchFormation}

Please provide:
## 1. Pre-Match Analysis
- Expected opponent formation and style
- Key threats to neutralize
- Areas to exploit

## 2. Tactical Game Plan
- Formation and shape
- Pressing triggers and defensive line
- Build-up play patterns
- Attacking combinations

## 3. Set Pieces
- Corner kick routines (attacking & defending)
- Free kick positions
- Throw-in patterns

## 4. Training Focus (3 days before)
- Day 1: Tactical shape and set pieces
- Day 2: Pressing and transitions
- Day 3: Light activation

## 5. Match Day Instructions
- Team talk key messages
- Starting lineup considerations
- Substitution strategy

## 6. Key Performance Indicators
- What defines success in this match`;

    try {
      askCoachMutation.mutate({ question: prompt, context: 'tactical', teamId });
    } catch {
      setIsGeneratingMatchPlan(false);
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const clearConversation = () => {
    setConversation([]);
    setMatchPlan('');
  };

  const currentQuickPrompts = activeTab === 'player' ? QUICK_PROMPTS.player
    : activeTab === 'team' ? QUICK_PROMPTS.team
    : activeTab === 'drills' ? QUICK_PROMPTS.drills
    : QUICK_PROMPTS.general;

  return (
    <>
      <div className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            
            <AIBreadcrumb toolLabel={language === 'ar' ? 'مساعد المدرب المتقدم' : 'AI Coach (Enhanced)'}/>
<h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-500" />
              {language === 'ar' ? 'مساعد المدرب بالذكاء الاصطناعي' : 'AI Coach Assistant'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' ? 'ذكاء تكتيكي متقدم مدعوم ببيانات الأكاديمية الحقيقية' : 'Advanced tactical intelligence powered by real academy data'}
            </p>
          </div>
          <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 text-sm px-3 py-1">
              <Zap className="w-3 h-3 mr-1" />{language === 'ar' ? 'مدعوم بالذكاء الاصطناعي' : 'AI-Powered'}
            </Badge>
            {conversation.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearConversation}>
                <RefreshCw className="w-4 h-4 mr-1" />{language === 'ar' ? 'جلسة جديدة' : 'New Session'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Controls */}
          <div className="space-y-4">
            {/* Mode Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{language === 'ar' ? 'وضع التحليل' : 'Analysis Mode'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-2 w-full gap-1 h-auto p-1 bg-muted/60 rounded-xl">
                    <TabsTrigger value="general" className="gap-1.5 text-xs py-2 data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm rounded-lg">
                      <Brain className="h-3.5 w-3.5" />{language === 'ar' ? 'عام' : 'General'}
                    </TabsTrigger>
                    <TabsTrigger value="player" className="gap-1.5 text-xs py-2 data-[state=active]:bg-background data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-500 data-[state=active]:shadow-sm rounded-lg">
                      <User className="h-3.5 w-3.5" />{language === 'ar' ? 'لاعب' : 'Player'}
                    </TabsTrigger>
                    <TabsTrigger value="team" className="gap-1.5 text-xs py-2 data-[state=active]:bg-background data-[state=active]:text-green-700 dark:data-[state=active]:text-green-500 data-[state=active]:shadow-sm rounded-lg">
                      <Shield className="h-3.5 w-3.5" />{language === 'ar' ? 'فريق' : 'Team'}
                    </TabsTrigger>
                    <TabsTrigger value="drills" className="gap-1.5 text-xs py-2 data-[state=active]:bg-background data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-500 data-[state=active]:shadow-sm rounded-lg">
                      <Dumbbell className="h-3.5 w-3.5" />{language === 'ar' ? 'تمارين' : 'Drills'}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>

                {activeTab === 'player' && (
                  <div className="space-y-2">
                    <Label className="text-xs">{language === 'ar' ? 'اختر لاعباً' : 'Select Player'}</Label>
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder={language === 'ar' ? 'اختر لاعباً...' : 'Choose player...'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{language === 'ar' ? 'اختر لاعباً...' : 'Choose a player...'}</SelectItem>
                        {players?.map((p: any) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.firstName} {p.lastName} — {p.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      className="w-full text-sm"
                      onClick={handleAnalyzePlayer}
                      disabled={selectedPlayer === 'none' || isLoading}
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                      {language === 'ar' ? 'تحليل شامل للاعب' : 'Full Player Analysis'}
                    </Button>
                  </div>
                )}

                {activeTab === 'team' && (
                  <div className="space-y-2">
                    <Label className="text-xs">{language === 'ar' ? 'اختر فريقاً' : 'Select Team'}</Label>
                    <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                      <SelectTrigger className="text-sm"><SelectValue placeholder={language === 'ar' ? 'اختر فريقاً...' : 'Choose team...'} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">{language === 'ar' ? 'اختر فريقاً...' : 'Choose a team...'}</SelectItem>
                        {teams?.map((t: any) => (
                          <SelectItem key={t.id} value={t.id.toString()}>
                            {t.name} ({t.ageGroup})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Match Preparation Tool */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  {language === 'ar' ? 'التحضير للمباراة' : 'Match Preparation'}
                </CardTitle>
                <CardDescription className="text-xs">{language === 'ar' ? 'أنشئ خطة تحضير كاملة للمباراة' : 'Generate a complete match prep plan'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs">{language === 'ar' ? 'اسم الفريق المنافس *' : 'Opponent Team *'}</Label>
                  <Input
                    value={matchOpponent}
                    onChange={e => setMatchOpponent(e.target.value)}
                    placeholder={language === 'ar' ? 'مثل: الزمالك تحت 18' : 'e.g., Zamalek U18'}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{language === 'ar' ? 'تاريخ المباراة' : 'Match Date'}</Label>
                  <Input
                    type="date"
                    value={matchDate}
                    onChange={e => setMatchDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{language === 'ar' ? 'تشكيلتنا' : 'Our Formation'}</Label>
                  <Select value={matchFormation} onValueChange={setMatchFormation}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '5-3-2', '4-1-4-1'].map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full text-sm"
                  onClick={generateMatchPrep}
                  disabled={isLoading || !matchOpponent}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trophy className="w-4 h-4 mr-2" />}
                  {language === 'ar' ? 'إنشاء خطة المباراة' : 'Generate Match Plan'}
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-700 dark:text-yellow-500" />
                  {language === 'ar' ? 'إحصائيات الجلسة' : 'Session Stats'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'ar' ? 'عدد الرسائل' : 'Messages'}</span>
                    <span className="font-medium">{conversation.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'ar' ? 'اللاعبون المتاحون' : 'Players available'}</span>
                    <span className="font-medium">{players?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{language === 'ar' ? 'الفرق المتاحة' : 'Teams available'}</span>
                    <span className="font-medium">{teams?.length || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Chat */}
          <div className="lg:col-span-2 space-y-4">
            {/* Quick Prompts (shown when no conversation) */}
            {conversation.length === 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  {language === 'ar' ? 'ابدأ سريعاً — اضغط على أي سؤال أدناه' : 'Quick Start — Click any prompt below'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentQuickPrompts.map((prompt, i) => (
                    <Card
                      key={i}
                      className="cursor-pointer hover:border-purple-400 hover:shadow-md transition-all"
                      onClick={() => {
                        if (activeTab === 'player' && selectedPlayer === 'none') {
                          toast.error(language === 'ar' ? 'يرجى اختيار لاعب أولاً' : 'Please select a player first');
                          return;
                        }
                        if (activeTab === 'team' && selectedTeam === 'none') {
                          toast.error(language === 'ar' ? 'يرجى اختيار فريق أولاً' : 'Please select a team first');
                          return;
                        }
                        handleAsk(language === 'ar' ? (prompt as any).qAr || prompt.q : prompt.q);
                      }}
                    >
                      <CardContent className="pt-4 pb-3">
                        <div className="flex items-start gap-2">
                          <prompt.icon className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{language === 'ar' ? (prompt as any).titleAr || prompt.title : prompt.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{language === 'ar' ? (prompt as any).qAr || prompt.q : prompt.q}</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation */}
            {conversation.length > 0 && (
              <Card>
                <CardContent className="pt-4 space-y-4 max-h-[500px] overflow-y-auto">
                  {conversation.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                          <Brain className="w-4 h-4 text-purple-600" />
                        </div>
                      )}
                      <div className={`max-w-[85%] rounded-lg p-3 text-sm ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        {msg.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{msg.content}</div>
                        ) : (
                          <p>{msg.content}</p>
                        )}
                        <div className={`flex items-center justify-between mt-2 gap-2 ${msg.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          <span className="text-xs">{msg.timestamp.toLocaleTimeString()}</span>
                          {msg.role === 'assistant' && (
                            <div className="flex gap-1">
                              <button onClick={() => copyMessage(msg.content)} className="hover:text-foreground transition-colors">
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {msg.role === 'user' && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        <Brain className="w-4 h-4 text-purple-600" />
                      </div>
                      <div className="bg-muted rounded-lg p-3 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                        <span className="text-sm text-muted-foreground">{language === 'ar' ? 'المدرب الذكي يفكر...' : 'AI Coach is thinking...'}</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </CardContent>
              </Card>
            )}

            {/* Input Area */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex gap-2">
                  <Textarea
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder={
                      language === 'ar'
                        ? activeTab === 'player' ? 'اسأل عن تطوير اللاعب أو تمارينه أو تحليله...'
                          : activeTab === 'team' ? 'اسأل عن تكتيكات الفريق أو التشكيلة أو محور التدريب...'
                          : activeTab === 'drills' ? 'صف نوع التمرين وعدد اللاعبين وهدف التدريب...'
                          : 'اطرح أي سؤال تدريبي — تكتيكات، تدريب، تطوير اللاعبين...'
                        : activeTab === 'player' ? "Ask about this player's development, drills, or analysis..."
                          : activeTab === 'team' ? "Ask about team tactics, formation, or training focus..."
                          : activeTab === 'drills' ? "Describe the drill type, player count, or training objective..."
                          : "Ask any coaching question — tactics, training, player development..."
                    }
                    className="min-h-[80px] resize-none"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAsk();
                      }
                    }}
                  />
                  <Button
                    onClick={() => handleAsk()}
                    disabled={!question.trim() || isLoading}
                    className="self-end px-4"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{language === 'ar' ? 'اضغط Enter للإرسال، Shift+Enter لسطر جديد' : 'Press Enter to send, Shift+Enter for new line'}</p>
              </CardContent>
            </Card>

            {/* Feature Highlights */}
            {conversation.length === 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: Brain, label: 'Tactical Analysis', labelAr: 'تحليل تكتيكي', desc: 'Formation & strategy advice', descAr: 'نصائح التشكيلة والاستراتيجية' },
                  { icon: Dumbbell, label: 'Drill Generator', labelAr: 'مولد التمارين', desc: 'Custom training sessions', descAr: 'جلسات تدريب مخصصة' },
                  { icon: Trophy, label: 'Match Prep', labelAr: 'تحضير المباراة', desc: 'Complete game plans', descAr: 'خطط لعب كاملة' },
                  { icon: TrendingUp, label: 'Player Dev', labelAr: 'تطوير اللاعب', desc: 'Personalized growth plans', descAr: 'خطط نمو شخصية' },
                ].map((f, i) => (
                  <div key={i} className="text-center p-3 rounded-lg bg-muted/50">
                    <f.icon className="w-6 h-6 mx-auto mb-1 text-purple-500" />
                    <p className="text-xs font-medium">{language === 'ar' ? (f as any).labelAr || f.label : f.label}</p>
                    <p className="text-xs text-muted-foreground">{language === 'ar' ? (f as any).descAr || f.desc : f.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
