import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { BackButton } from "@/components/BackButton";
import {
  Video, Upload, Brain, Target, TrendingUp, TrendingDown, Users, Shield,
  Activity, Zap, AlertCircle, CheckCircle, Loader2, Play, Camera,
  FileText, Download, Eye, Crosshair, ArrowRight, BarChart3, Radar,
  Swords, Flag, Timer, Footprints, MapPin, Flame, Wind, CircleDot
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────
interface MatchAnalysisResult {
  report: string;
}

interface TacticalAnalysisResult {
  formation: string;
  tacticalPatterns: string;
  playerMovements: string;
  passingPatterns: string;
  keyMoments: string;
  recommendations: string;
  fullAnalysis: string;
}

interface OpponentAnalysisResult {
  playingStyle: string;
  strengths: string[];
  weaknesses: string[];
  keyPlayers: string[];
  recommendedFormation: string;
  tacticalApproach: string;
  keyFocusAreas: string[];
  playerInstructions: Record<string, string>;
  setPieceStrategy: string;
  predictedOutcome: string;
  confidence: number;
}

interface PlayerComparisonResult {
  analysis: string;
}

// ─── Frame Extraction ───────────────────────────────────────────────────────
function extractFramesFromVideo(videoFile: File, numFrames: number = 8): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    const url = URL.createObjectURL(videoFile);
    video.src = url;
    video.onloadedmetadata = () => {
      const duration = video.duration;
      const interval = duration / (numFrames + 1);
      const frames: string[] = [];
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      canvas.width = 640;
      canvas.height = 360;
      let currentFrame = 0;
      const captureFrame = () => {
        if (currentFrame >= numFrames) {
          URL.revokeObjectURL(url);
          resolve(frames);
          return;
        }
        video.currentTime = interval * (currentFrame + 1);
      };
      video.onseeked = () => {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL("image/jpeg", 0.7));
        currentFrame++;
        captureFrame();
      };
      captureFrame();
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load video"));
    };
  });
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ProMatchAnalysis() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [activeTab, setActiveTab] = useState("match-analysis");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");

  // Match Analysis State
  const [team1Name, setTeam1Name] = useState("");
  const [team2Name, setTeam2Name] = useState("");
  const [team1Color, setTeam1Color] = useState("#ff0000");
  const [team2Color, setTeam2Color] = useState("#0000ff");
  const [team1PlayerCount, setTeam1PlayerCount] = useState<number>(11);
  const [team2PlayerCount, setTeam2PlayerCount] = useState<number>(11);
  const [matchDate, setMatchDate] = useState("");
  const [matchResult, setMatchResult] = useState<MatchAnalysisResult | null>(null);

  // Color similarity check
  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return { r, g, b };
  };
  const colorDistance = (c1: string, c2: string) => {
    const a = hexToRgb(c1), b2 = hexToRgb(c2);
    return Math.sqrt((a.r-b2.r)**2 + (a.g-b2.g)**2 + (a.b-b2.b)**2);
  };
  const colorsAreTooSimilar = colorDistance(team1Color, team2Color) < 80;

  // Tactical Analysis State
  const [tacticalVideoUrl, setTacticalVideoUrl] = useState("");
  const [tacticalDescription, setTacticalDescription] = useState("");
  const [tacticalResult, setTacticalResult] = useState<TacticalAnalysisResult | null>(null);

  // Opponent Scouting State
  const [opponentName, setOpponentName] = useState("");
  const [opponentFormation, setOpponentFormation] = useState("");
  const [opponentPrevResults, setOpponentPrevResults] = useState("");
  const [opponentKeyPlayers, setOpponentKeyPlayers] = useState("");
  const [opponentNotes, setOpponentNotes] = useState("");
  const [opponentResult, setOpponentResult] = useState<OpponentAnalysisResult | null>(null);

  // Player vs Player State
  const [player1Name, setPlayer1Name] = useState("");
  const [player1Position, setPlayer1Position] = useState("");
  const [player1Stats, setPlayer1Stats] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [player2Position, setPlayer2Position] = useState("");
  const [player2Stats, setPlayer2Stats] = useState("");
  const [playerCompResult, setPlayerCompResult] = useState<PlayerComparisonResult | null>(null);

  // Team DNA State
  const [dnaTeamName, setDnaTeamName] = useState("");
  const [dnaFormation, setDnaFormation] = useState("");
  const [dnaPlayStyle, setDnaPlayStyle] = useState("");
  const [dnaResult, setDnaResult] = useState<string | null>(null);

  // tRPC mutations
  const analyzeMatch = trpc.videoAnalysis.analyzeMatch.useMutation();
  const analyzeTactical = trpc.videoAnalysis.analyze.useMutation();
  const analyzeOpponentMut = trpc.ai.analyzeOpponent.useMutation();
  const aiChat = trpc.ai.chat.useMutation();

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 200 * 1024 * 1024) {
        toast.error(isAr ? "حجم الفيديو يتجاوز 200 ميجابايت" : "Video exceeds 200MB limit");
        return;
      }
      setVideoFile(file);
      setVideoPreviewUrl(URL.createObjectURL(file));
    }
  }, [isAr]);

  const handleMatchAnalysis = async () => {
    if (!team1Name || !team2Name) {
      toast.error(isAr ? "أدخل اسم الفريقين" : "Enter both team names");
      return;
    }
    if (colorsAreTooSimilar) {
      toast.error(isAr ? "ألوان القميصين متشابهة جداً! سيؤثر ذلك على دقة التحليل. اختر ألواناً مختلفة." : "Jersey colors are too similar! This will affect analysis accuracy. Please choose distinct colors.");
      return;
    }
    if (team1PlayerCount < 9 || team2PlayerCount < 9) {
      toast.error(isAr ? "يجب أن يكون كل فريق 9 لاعبين على الأقل لتحديد الخطة التكتيكية" : "Each team must have at least 9 players to identify a tactical formation");
      return;
    }
    setIsProcessing(true);
    setProgress(10);
    setProgressText(isAr ? "جاري استخراج الإطارات..." : "Extracting frames...");

    try {
      let frameImages: string[] = [];
      if (videoFile) {
        setProgress(20);
        setProgressText(isAr ? "تحليل الفيديو..." : "Analyzing video frames...");
        frameImages = await extractFramesFromVideo(videoFile, 8);
        setProgress(50);
      }

      setProgressText(isAr ? "تحليل تكتيكي بالذكاء الاصطناعي..." : "AI tactical analysis in progress...");
      setProgress(60);

      const result = await analyzeMatch.mutateAsync({
        team1Name: `${team1Name} (${team1PlayerCount} players)`,
        team2Name: `${team2Name} (${team2PlayerCount} players)`,
        team1Color,
        team2Color,
        framesAnalyzed: frameImages.length,
        videoDuration: videoFile ? 90 * 60 : 0,
        colorGroupsDetected: 2,
        matchDate,
        frameImages: frameImages.length > 0 ? frameImages : undefined,
      });

      setProgress(100);
      setMatchResult(result);
      toast.success(isAr ? "تم التحليل بنجاح!" : "Analysis complete!");
    } catch (error: any) {
      toast.error(error.message || "Analysis failed");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleTacticalAnalysis = async () => {
    if (!tacticalVideoUrl && !tacticalDescription) {
      toast.error(isAr ? "أدخل رابط الفيديو أو وصف" : "Enter video URL or description");
      return;
    }
    setIsProcessing(true);
    try {
      const result = await analyzeTactical.mutateAsync({
        videoUrl: tacticalVideoUrl || undefined,
        description: tacticalDescription || "Analyze this match tactically",
      });
      setTacticalResult(result as any);
      toast.success(isAr ? "تم التحليل التكتيكي!" : "Tactical analysis complete!");
    } catch (error: any) {
      toast.error(error.message || "Analysis failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpponentScouting = async () => {
    if (!opponentName) {
      toast.error(isAr ? "أدخل اسم الخصم" : "Enter opponent name");
      return;
    }
    setIsProcessing(true);
    try {
      const result = await analyzeOpponentMut.mutateAsync({
        teamName: opponentName,
        recentMatches: opponentPrevResults.split(",").map(r => ({ result: r.trim() })),
        keyPlayers: opponentKeyPlayers.split(",").map(p => ({ name: p.trim() })),
        formation: opponentFormation || "4-4-2",
      });
      setOpponentResult(result.analysis as any);
      toast.success(isAr ? "تم تحليل الخصم!" : "Opponent analysis complete!");
    } catch (error: any) {
      toast.error(error.message || "Analysis failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePlayerComparison = async () => {
    if (!player1Name || !player2Name) {
      toast.error(isAr ? "أدخل اسم اللاعبين" : "Enter both player names");
      return;
    }
    setIsProcessing(true);
    try {
      const result = await aiChat.mutateAsync({
        message: `As an elite football performance analyst (Barcelona/Real Madrid level), provide a comprehensive head-to-head comparison between these two players:

**Player 1:** ${player1Name} (Position: ${player1Position || "Unknown"})
Stats/Notes: ${player1Stats || "No specific stats provided"}

**Player 2:** ${player2Name} (Position: ${player2Position || "Unknown"})
Stats/Notes: ${player2Stats || "No specific stats provided"}

Provide analysis in this structure:
## Overall Comparison
## Technical Skills Comparison
- Ball Control, Passing, Shooting, Dribbling, First Touch
## Physical Attributes
- Speed, Stamina, Strength, Agility, Aerial Ability
## Tactical Intelligence
- Positioning, Decision Making, Vision, Work Rate
## Mental Attributes
- Composure, Leadership, Consistency, Big Game Performance
## Key Strengths (each player)
## Key Weaknesses (each player)
## Matchup Analysis
- Who wins in direct confrontation and why
## Development Recommendations
- Specific training focus for each player

Be specific, use football terminology, and provide actionable insights.`,
        currentPage: "pro-match-analysis",
      });
      setPlayerCompResult({ analysis: typeof result.response === 'string' ? result.response : '' });
      toast.success(isAr ? "تم مقارنة اللاعبين!" : "Player comparison complete!");
    } catch (error: any) {
      toast.error(error.message || "Comparison failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTeamDNA = async () => {
    if (!dnaTeamName) {
      toast.error(isAr ? "أدخل اسم الفريق" : "Enter team name");
      return;
    }
    setIsProcessing(true);
    try {
      const result = await aiChat.mutateAsync({
        message: `As an elite football tactical analyst (Barcelona Performance Analysis Department level), provide a comprehensive "Team Tactical DNA" analysis for:

**Team:** ${dnaTeamName}
**Formation:** ${dnaFormation || "Not specified"}
**Playing Style Notes:** ${dnaPlayStyle || "Not specified"}

Provide a COMPLETE tactical DNA report covering:

## Team Identity & Philosophy
## Formation & Shape
### In Possession (Attacking Shape)
### Out of Possession (Defensive Shape)
### Transition Moments

## Build-Up Play Analysis
- Short/Long/Mixed patterns
- GK involvement in build-up
- Progression channels (central vs wide)
- Key build-up players

## Pressing & Counter-Pressing
- Pressing triggers (when do they press?)
- Pressing intensity zones
- Counter-pressing recovery time
- PPDA (Passes Per Defensive Action) estimation

## Attacking Patterns
- Final third entries (central penetration vs wide overloads)
- Crossing patterns (early vs cutback)
- Chance creation methods
- Set piece routines

## Defensive Organization
- Defensive line height (high/mid/low block)
- Compactness (vertical & horizontal)
- Marking system (zonal/man/hybrid)
- Recovery runs and cover shadows

## Transitions
- Attack to Defense (counter-press vs retreat)
- Defense to Attack (direct vs patient)
- Transition speed and key players

## Width & Depth
- Attacking width (fullback overlap vs inverted)
- Defensive width (narrow vs wide)
- Depth in attack and defense

## Key Tactical Metrics
- Expected possession %
- Pressing intensity rating
- Directness rating
- Defensive solidity rating

## Strengths to Exploit
## Weaknesses to Target
## Recommended Counter-Strategy

Be extremely specific and use professional football analytics terminology.`,
        currentPage: "pro-match-analysis",
      });
      setDnaResult(typeof result.response === 'string' ? result.response : '');
      toast.success(isAr ? "تم تحليل DNA الفريق!" : "Team DNA analysis complete!");
    } catch (error: any) {
      toast.error(error.message || "Analysis failed");
    } finally {
      setIsProcessing(false);
    }
  };

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) { setLocation("/"); return null; }

  return (
    <>
      <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto" dir={isAr ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <BackButton />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Brain className="w-8 h-8 text-blue-500" />
              {isAr ? "التحليل الاحترافي للمباريات" : "Pro Match Analysis"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isAr 
                ? "نظام تحليل أداء على مستوى برشلونة — تحليل تكتيكي، استكشاف الخصم، مقارنة اللاعبين، DNA الفريق"
                : "Barcelona-level performance analysis — tactical breakdown, opponent scouting, player comparison, team DNA"}
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto gap-1">
            <TabsTrigger value="match-analysis" className="text-xs md:text-sm">
              <Video className="w-4 h-4 mr-1" />
              {isAr ? "تحليل المباراة" : "Match Analysis"}
            </TabsTrigger>
            <TabsTrigger value="tactical" className="text-xs md:text-sm">
              <Target className="w-4 h-4 mr-1" />
              {isAr ? "تحليل تكتيكي" : "Tactical"}
            </TabsTrigger>
            <TabsTrigger value="opponent" className="text-xs md:text-sm">
              <Swords className="w-4 h-4 mr-1" />
              {isAr ? "استكشاف الخصم" : "Opponent Scout"}
            </TabsTrigger>
            <TabsTrigger value="player-vs-player" className="text-xs md:text-sm">
              <Users className="w-4 h-4 mr-1" />
              {isAr ? "لاعب ضد لاعب" : "Player vs Player"}
            </TabsTrigger>
            <TabsTrigger value="team-dna" className="text-xs md:text-sm">
              <Radar className="w-4 h-4 mr-1" />
              {isAr ? "DNA الفريق" : "Team DNA"}
            </TabsTrigger>
          </TabsList>

          {/* ═══════════════ TAB 1: Match Video Analysis ═══════════════ */}
          <TabsContent value="match-analysis" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-500" />
                  {isAr ? "تحليل فيديو المباراة بالذكاء الاصطناعي" : "AI Match Video Analysis"}
                </CardTitle>
                <CardDescription>
                  {isAr
                    ? "ارفع فيديو المباراة وسيقوم الذكاء الاصطناعي بتحليل التشكيل والتكتيك ونقاط القوة والضعف لكلا الفريقين"
                    : "Upload match video and AI will analyze formation, tactics, strengths & weaknesses for both teams"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Video Upload */}
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}>
                  <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                  {videoFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="w-10 h-10 text-green-700 dark:text-green-500 mx-auto" />
                      <p className="font-medium">{videoFile.name}</p>
                      <p className="text-sm text-muted-foreground">{(videoFile.size / 1024 / 1024).toFixed(1)} MB</p>
                      {videoPreviewUrl && (
                        <video src={videoPreviewUrl} className="max-h-48 mx-auto rounded-lg mt-2" controls />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto" />
                      <p className="font-medium">{isAr ? "اضغط لرفع فيديو المباراة" : "Click to upload match video"}</p>
                      <p className="text-sm text-muted-foreground">{isAr ? "حتى 200 ميجابايت — MP4, MOV, AVI" : "Up to 200MB — MP4, MOV, AVI"}</p>
                    </div>
                  )}
                </div>

                {/* Team Details */}
                {colorsAreTooSimilar && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-300 text-yellow-800 dark:text-yellow-200 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {isAr ? "ألوان القميصين متشابهة جداً! يجب اختيار ألوان مختلفة لضمان دقة التحليل." : "Jersey colors are too similar! Choose distinct colors for accurate player detection."}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3 p-4 rounded-lg bg-red-50 dark:bg-red-950/20">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      {isAr ? "فريقنا" : "Our Team"}
                    </h3>
                    <div>
                      <Label>{isAr ? "اسم الفريق" : "Team Name"}</Label>
                      <Input value={team1Name} onChange={e => setTeam1Name(e.target.value)} placeholder={isAr ? "مثال: فيوتشر ستارز" : "e.g., Future Stars FC"} />
                    </div>
                    <div>
                      <Label>{isAr ? "لون القميص" : "Jersey Color"}</Label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={team1Color} onChange={e => setTeam1Color(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                        <span className="text-sm text-muted-foreground">{team1Color}</span>
                      </div>
                    </div>
                    <div>
                      <Label>{isAr ? "عدد اللاعبين في الفريق" : "Number of Players"}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number" min={9} max={11}
                          value={team1PlayerCount}
                          onChange={e => setTeam1PlayerCount(Math.min(11, Math.max(1, parseInt(e.target.value) || 11)))}
                          className="w-24"
                        />
                        <span className="text-xs text-muted-foreground">{isAr ? "(9 على الأقل لتحديد الخطة)" : "(min 9 to detect formation)"}</span>
                      </div>
                      {team1PlayerCount < 9 && (
                        <p className="text-xs text-red-500 mt-1">{isAr ? "أقل من 9 لاعبين — لا يمكن تحديد الخطة التكتيكية" : "Below 9 players — formation cannot be determined"}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Swords className="w-4 h-4" />
                      {isAr ? "الفريق المنافس" : "Opponent Team"}
                    </h3>
                    <div>
                      <Label>{isAr ? "اسم الفريق" : "Team Name"}</Label>
                      <Input value={team2Name} onChange={e => setTeam2Name(e.target.value)} placeholder={isAr ? "مثال: الزمالك" : "e.g., Zamalek"} />
                    </div>
                    <div>
                      <Label>{isAr ? "لون القميص" : "Jersey Color"}</Label>
                      <div className="flex gap-2 items-center">
                        <input type="color" value={team2Color} onChange={e => setTeam2Color(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
                        <span className="text-sm text-muted-foreground">{team2Color}</span>
                      </div>
                    </div>
                    <div>
                      <Label>{isAr ? "عدد اللاعبين في الفريق" : "Number of Players"}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number" min={9} max={11}
                          value={team2PlayerCount}
                          onChange={e => setTeam2PlayerCount(Math.min(11, Math.max(1, parseInt(e.target.value) || 11)))}
                          className="w-24"
                        />
                        <span className="text-xs text-muted-foreground">{isAr ? "(9 على الأقل لتحديد الخطة)" : "(min 9 to detect formation)"}</span>
                      </div>
                      {team2PlayerCount < 9 && (
                        <p className="text-xs text-red-500 mt-1">{isAr ? "أقل من 9 لاعبين — لا يمكن تحديد الخطة التكتيكية" : "Below 9 players — formation cannot be determined"}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>{isAr ? "تاريخ المباراة" : "Match Date"}</Label>
                  <Input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} />
                </div>

                {/* Progress */}
                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={progress} />
                    <p className="text-sm text-center text-muted-foreground">{progressText}</p>
                  </div>
                )}

                <Button onClick={handleMatchAnalysis} disabled={isProcessing} className="w-full" size="lg">
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
                  {isAr ? "تحليل المباراة بالذكاء الاصطناعي" : "Analyze Match with AI"}
                </Button>

                {/* Results */}
                {matchResult && (
                  <Card className="mt-4 border-green-200 dark:border-green-800">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        {isAr ? "نتائج التحليل" : "Analysis Results"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                        {matchResult.report}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ TAB 2: Tactical Analysis ═══════════════ */}
          <TabsContent value="tactical" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  {isAr ? "التحليل التكتيكي المتقدم" : "Advanced Tactical Analysis"}
                </CardTitle>
                <CardDescription>
                  {isAr
                    ? "تحليل التشكيل، أنماط التمرير، حركة اللاعبين، اللحظات المفتاحية، والتوصيات"
                    : "Formation, passing patterns, player movements, key moments, and recommendations"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>{isAr ? "رابط الفيديو (اختياري)" : "Video URL (optional)"}</Label>
                  <Input value={tacticalVideoUrl} onChange={e => setTacticalVideoUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label>{isAr ? "وصف المباراة / ملاحظات تكتيكية" : "Match Description / Tactical Notes"}</Label>
                  <Textarea value={tacticalDescription} onChange={e => setTacticalDescription(e.target.value)}
                    placeholder={isAr ? "اكتب ملاحظاتك عن المباراة — التشكيل، الأسلوب، الملاحظات..." : "Describe the match — formation, style, observations..."}
                    rows={5} />
                </div>
                <Button onClick={handleTacticalAnalysis} disabled={isProcessing} className="w-full">
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Target className="w-4 h-4 mr-2" />}
                  {isAr ? "تحليل تكتيكي" : "Run Tactical Analysis"}
                </Button>

                {tacticalResult && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-purple-200 dark:border-purple-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-1"><Crosshair className="w-4 h-4" /> {isAr ? "التشكيل" : "Formation"}</CardTitle>
                        </CardHeader>
                        <CardContent><Badge variant="secondary" className="text-lg">{tacticalResult.formation}</Badge></CardContent>
                      </Card>
                      <Card className="border-purple-200 dark:border-purple-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-1"><Activity className="w-4 h-4" /> {isAr ? "أنماط تكتيكية" : "Tactical Patterns"}</CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-sm">{tacticalResult.tacticalPatterns}</p></CardContent>
                      </Card>
                      <Card className="border-purple-200 dark:border-purple-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-1"><Footprints className="w-4 h-4" /> {isAr ? "حركة اللاعبين" : "Player Movements"}</CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-sm">{tacticalResult.playerMovements}</p></CardContent>
                      </Card>
                      <Card className="border-purple-200 dark:border-purple-800">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-1"><Wind className="w-4 h-4" /> {isAr ? "أنماط التمرير" : "Passing Patterns"}</CardTitle>
                        </CardHeader>
                        <CardContent><p className="text-sm">{tacticalResult.passingPatterns}</p></CardContent>
                      </Card>
                    </div>
                    <Card className="border-yellow-200 dark:border-yellow-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-1"><Flame className="w-4 h-4" /> {isAr ? "اللحظات المفتاحية" : "Key Moments"}</CardTitle>
                      </CardHeader>
                      <CardContent><p className="text-sm whitespace-pre-wrap">{tacticalResult.keyMoments}</p></CardContent>
                    </Card>
                    <Card className="border-green-200 dark:border-green-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {isAr ? "التوصيات" : "Recommendations"}</CardTitle>
                      </CardHeader>
                      <CardContent><p className="text-sm whitespace-pre-wrap">{tacticalResult.recommendations}</p></CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ TAB 3: Opponent Scouting ═══════════════ */}
          <TabsContent value="opponent" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Swords className="w-5 h-5 text-red-500" />
                  {isAr ? "تقرير استكشاف الخصم" : "Opponent Scouting Report"}
                </CardTitle>
                <CardDescription>
                  {isAr
                    ? "تحليل شامل للفريق المنافس — نقاط القوة والضعف، اللاعبين الخطرين، التكتيك المضاد"
                    : "Comprehensive opponent analysis — strengths, weaknesses, danger players, counter-tactics"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>{isAr ? "اسم الفريق المنافس" : "Opponent Team Name"} *</Label>
                    <Input value={opponentName} onChange={e => setOpponentName(e.target.value)} placeholder={isAr ? "مثال: الزمالك" : "e.g., Zamalek"} />
                  </div>
                  <div>
                    <Label>{isAr ? "التشكيل المعروف" : "Known Formation"}</Label>
                    <Select value={opponentFormation} onValueChange={setOpponentFormation}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر التشكيل" : "Select formation"} /></SelectTrigger>
                      <SelectContent>
                        {["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "3-4-3", "5-3-2", "5-4-1", "4-1-4-1", "4-5-1"].map(f => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>{isAr ? "النتائج السابقة (مفصولة بفاصلة)" : "Previous Results (comma-separated)"}</Label>
                  <Input value={opponentPrevResults} onChange={e => setOpponentPrevResults(e.target.value)} placeholder="W 3-1, L 0-2, D 1-1" />
                </div>
                <div>
                  <Label>{isAr ? "اللاعبين الأساسيين (مفصولة بفاصلة)" : "Key Players (comma-separated)"}</Label>
                  <Input value={opponentKeyPlayers} onChange={e => setOpponentKeyPlayers(e.target.value)} placeholder={isAr ? "محمد - مهاجم, أحمد - وسط" : "Mohamed - Striker, Ahmed - Midfielder"} />
                </div>
                <div>
                  <Label>{isAr ? "ملاحظات إضافية" : "Additional Notes"}</Label>
                  <Textarea value={opponentNotes} onChange={e => setOpponentNotes(e.target.value)}
                    placeholder={isAr ? "أي ملاحظات عن أسلوب لعبهم..." : "Any notes about their playing style..."}
                    rows={3} />
                </div>
                <Button onClick={handleOpponentScouting} disabled={isProcessing} className="w-full">
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Swords className="w-4 h-4 mr-2" />}
                  {isAr ? "تحليل الخصم بالذكاء الاصطناعي" : "Scout Opponent with AI"}
                </Button>

                {opponentResult && (
                  <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-blue-200 dark:border-blue-800">
                        <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "أسلوب اللعب" : "Playing Style"}</CardTitle></CardHeader>
                        <CardContent><p className="text-sm">{opponentResult.playingStyle}</p></CardContent>
                      </Card>
                      <Card className="border-green-200 dark:border-green-800">
                        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><TrendingUp className="w-4 h-4 text-green-700 dark:text-green-500" /> {isAr ? "نقاط القوة" : "Strengths"}</CardTitle></CardHeader>
                        <CardContent><ul className="text-sm space-y-1">{opponentResult.strengths?.map((s: string, i: number) => <li key={i} className="flex items-start gap-1"><CheckCircle className="w-3 h-3 mt-1 text-green-700 dark:text-green-500 shrink-0" />{s}</li>)}</ul></CardContent>
                      </Card>
                      <Card className="border-red-200 dark:border-red-800">
                        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><TrendingDown className="w-4 h-4 text-red-500" /> {isAr ? "نقاط الضعف" : "Weaknesses"}</CardTitle></CardHeader>
                        <CardContent><ul className="text-sm space-y-1">{opponentResult.weaknesses?.map((w: string, i: number) => <li key={i} className="flex items-start gap-1"><AlertCircle className="w-3 h-3 mt-1 text-red-500 shrink-0" />{w}</li>)}</ul></CardContent>
                      </Card>
                    </div>
                    <Card className="border-orange-200 dark:border-orange-800">
                      <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1"><Users className="w-4 h-4" /> {isAr ? "اللاعبين الخطرين" : "Danger Players"}</CardTitle></CardHeader>
                      <CardContent><ul className="text-sm space-y-1">{opponentResult.keyPlayers?.map((p: string, i: number) => <li key={i} className="flex items-start gap-1"><Zap className="w-3 h-3 mt-1 text-orange-700 dark:text-orange-500 shrink-0" />{p}</li>)}</ul></CardContent>
                    </Card>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="border-purple-200 dark:border-purple-800">
                        <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "التشكيل المضاد المقترح" : "Recommended Counter-Formation"}</CardTitle></CardHeader>
                        <CardContent><Badge variant="secondary" className="text-lg">{opponentResult.recommendedFormation}</Badge></CardContent>
                      </Card>
                      <Card className="border-purple-200 dark:border-purple-800">
                        <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "الثقة في التحليل" : "Analysis Confidence"}</CardTitle></CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2">
                            <Progress value={opponentResult.confidence} className="flex-1" />
                            <span className="text-sm font-bold">{opponentResult.confidence}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    <Card className="border-indigo-200 dark:border-indigo-800">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "النهج التكتيكي المقترح" : "Recommended Tactical Approach"}</CardTitle></CardHeader>
                      <CardContent><p className="text-sm whitespace-pre-wrap">{opponentResult.tacticalApproach}</p></CardContent>
                    </Card>
                    <Card className="border-amber-200 dark:border-amber-800">
                      <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "استراتيجية الكرات الثابتة" : "Set Piece Strategy"}</CardTitle></CardHeader>
                      <CardContent><p className="text-sm">{opponentResult.setPieceStrategy}</p></CardContent>
                    </Card>
                    {opponentResult.playerInstructions && (
                      <Card className="border-cyan-200 dark:border-cyan-800">
                        <CardHeader className="pb-2"><CardTitle className="text-sm">{isAr ? "تعليمات لكل خط" : "Player Instructions by Line"}</CardTitle></CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {Object.entries(opponentResult.playerInstructions).map(([pos, instr]) => (
                              <div key={pos} className="flex gap-2">
                                <Badge variant="outline" className="shrink-0">{pos}</Badge>
                                <p className="text-sm">{instr as string}</p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ TAB 4: Player vs Player ═══════════════ */}
          <TabsContent value="player-vs-player" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-700 dark:text-green-500" />
                  {isAr ? "مقارنة لاعب ضد لاعب" : "Player vs Player Comparison"}
                </CardTitle>
                <CardDescription>
                  {isAr
                    ? "مقارنة شاملة بين لاعبين — تقنية، بدنية، تكتيكية، ذهنية"
                    : "Comprehensive head-to-head — technical, physical, tactical, mental attributes"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Player 1 */}
                  <div className="space-y-3 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                    <h3 className="font-semibold text-emerald-700 dark:text-emerald-400">
                      {isAr ? "اللاعب الأول" : "Player 1"}
                    </h3>
                    <div>
                      <Label>{isAr ? "الاسم" : "Name"} *</Label>
                      <Input value={player1Name} onChange={e => setPlayer1Name(e.target.value)} placeholder={isAr ? "اسم اللاعب" : "Player name"} />
                    </div>
                    <div>
                      <Label>{isAr ? "المركز" : "Position"}</Label>
                      <Select value={player1Position} onValueChange={setPlayer1Position}>
                        <SelectTrigger><SelectValue placeholder={isAr ? "اختر المركز" : "Select position"} /></SelectTrigger>
                        <SelectContent>
                          {["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF"].map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{isAr ? "إحصائيات / ملاحظات" : "Stats / Notes"}</Label>
                      <Textarea value={player1Stats} onChange={e => setPlayer1Stats(e.target.value)}
                        placeholder={isAr ? "أهداف: 5, تمريرات حاسمة: 3, سرعة عالية..." : "Goals: 5, Assists: 3, High speed..."}
                        rows={3} />
                    </div>
                  </div>
                  {/* Player 2 */}
                  <div className="space-y-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/20">
                    <h3 className="font-semibold text-amber-700 dark:text-amber-400">
                      {isAr ? "اللاعب الثاني" : "Player 2"}
                    </h3>
                    <div>
                      <Label>{isAr ? "الاسم" : "Name"} *</Label>
                      <Input value={player2Name} onChange={e => setPlayer2Name(e.target.value)} placeholder={isAr ? "اسم اللاعب" : "Player name"} />
                    </div>
                    <div>
                      <Label>{isAr ? "المركز" : "Position"}</Label>
                      <Select value={player2Position} onValueChange={setPlayer2Position}>
                        <SelectTrigger><SelectValue placeholder={isAr ? "اختر المركز" : "Select position"} /></SelectTrigger>
                        <SelectContent>
                          {["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF"].map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{isAr ? "إحصائيات / ملاحظات" : "Stats / Notes"}</Label>
                      <Textarea value={player2Stats} onChange={e => setPlayer2Stats(e.target.value)}
                        placeholder={isAr ? "أهداف: 3, تمريرات حاسمة: 7, تحكم ممتاز..." : "Goals: 3, Assists: 7, Excellent control..."}
                        rows={3} />
                    </div>
                  </div>
                </div>
                <Button onClick={handlePlayerComparison} disabled={isProcessing} className="w-full">
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                  {isAr ? "مقارنة اللاعبين بالذكاء الاصطناعي" : "Compare Players with AI"}
                </Button>

                {playerCompResult && (
                  <Card className="mt-4 border-green-200 dark:border-green-800">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-700 dark:text-green-500" />
                        {isAr ? "نتيجة المقارنة" : "Comparison Result"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                        {playerCompResult.analysis}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══════════════ TAB 5: Team DNA ═══════════════ */}
          <TabsContent value="team-dna" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radar className="w-5 h-5 text-indigo-500" />
                  {isAr ? "DNA الفريق التكتيكي" : "Team Tactical DNA"}
                </CardTitle>
                <CardDescription>
                  {isAr
                    ? "تحليل شامل لهوية الفريق — أسلوب اللعب، الضغط، البناء، الدفاع، الانتقالات"
                    : "Complete team identity analysis — playing style, pressing, build-up, defense, transitions"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>{isAr ? "اسم الفريق" : "Team Name"} *</Label>
                    <Input value={dnaTeamName} onChange={e => setDnaTeamName(e.target.value)} placeholder={isAr ? "مثال: فيوتشر ستارز" : "e.g., Future Stars FC"} />
                  </div>
                  <div>
                    <Label>{isAr ? "التشكيل الأساسي" : "Primary Formation"}</Label>
                    <Select value={dnaFormation} onValueChange={setDnaFormation}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                      <SelectContent>
                        {["4-4-2", "4-3-3", "4-2-3-1", "3-5-2", "3-4-3", "5-3-2", "5-4-1", "4-1-4-1"].map(f => (
                          <SelectItem key={f} value={f}>{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{isAr ? "أسلوب اللعب" : "Playing Style"}</Label>
                    <Select value={dnaPlayStyle} onValueChange={setDnaPlayStyle}>
                      <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="possession">{isAr ? "استحواذ" : "Possession-based"}</SelectItem>
                        <SelectItem value="counter">{isAr ? "هجمة مرتدة" : "Counter-attack"}</SelectItem>
                        <SelectItem value="high-press">{isAr ? "ضغط عالي" : "High Press"}</SelectItem>
                        <SelectItem value="direct">{isAr ? "لعب مباشر" : "Direct Play"}</SelectItem>
                        <SelectItem value="mixed">{isAr ? "مختلط" : "Mixed/Hybrid"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleTeamDNA} disabled={isProcessing} className="w-full">
                  {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Radar className="w-4 h-4 mr-2" />}
                  {isAr ? "تحليل DNA الفريق" : "Analyze Team DNA"}
                </Button>

                {dnaResult && (
                  <Card className="mt-4 border-indigo-200 dark:border-indigo-800">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-indigo-500" />
                        {isAr ? "تقرير DNA الفريق" : "Team DNA Report"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose dark:prose-invert max-w-none text-sm whitespace-pre-wrap">
                        {dnaResult}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("match-analysis")}>
            <CardContent className="p-4 text-center">
              <Video className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-xs font-medium">{isAr ? "تحليل فيديو" : "Video Analysis"}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("opponent")}>
            <CardContent className="p-4 text-center">
              <Swords className="w-8 h-8 mx-auto mb-2 text-red-500" />
              <p className="text-xs font-medium">{isAr ? "استكشاف الخصم" : "Scout Opponent"}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("player-vs-player")}>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-green-700 dark:text-green-500" />
              <p className="text-xs font-medium">{isAr ? "لاعب ضد لاعب" : "Player vs Player"}</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("team-dna")}>
            <CardContent className="p-4 text-center">
              <Radar className="w-8 h-8 mx-auto mb-2 text-indigo-500" />
              <p className="text-xs font-medium">{isAr ? "DNA الفريق" : "Team DNA"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
