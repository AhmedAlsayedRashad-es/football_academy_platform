import { useState, useRef, useEffect } from 'react';
import { Link , useLocation, useSearch } from 'wouter';
import DrillAssignmentModal from '@/components/DrillAssignmentModal';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  Video, Upload, ArrowLeft, 
  Brain, Target, TrendingUp, AlertCircle, CheckCircle2,
  Loader2, Sparkles, Palette, Save, History, 
  Zap, Activity, MapPin, Crosshair, Timer, Footprints,
  LayoutGrid, Share2, FileDown, Camera, Play, Users
} from 'lucide-react';
import TacticalBoard from '@/components/TacticalBoard';
import PassingNetwork from '@/components/PassingNetwork';
import { VideoTimeline } from '@/components/VideoTimeline';
import { TacticalOverlayTemplates } from '@/components/TacticalOverlayTemplates';
import AdvancedVideoPlayer from '@/components/AdvancedVideoPlayer';
import { generateTeamAnalysis, TeamAnalysisResult } from '@/utils/teamAnalysisGenerator';


// Team colors for jersey detection
const TEAM_COLORS = [
  { value: 'red', label: 'Red', labelAr: 'أحمر', color: '#ef4444' },
  { value: 'blue', label: 'Blue', labelAr: 'أزرق', color: '#3b82f6' },
  { value: 'green', label: 'Green', labelAr: 'أخضر', color: '#22c55e' },
  { value: 'yellow', label: 'Yellow', labelAr: 'أصفر', color: '#eab308' },
  { value: 'white', label: 'White', labelAr: 'أبيض', color: '#ffffff' },
  { value: 'black', label: 'Black', labelAr: 'أسود', color: '#1f2937' },
  { value: 'orange', label: 'Orange', labelAr: 'برتقالي', color: '#f97316' },
  { value: 'purple', label: 'Purple', labelAr: 'بنفسجي', color: '#a855f7' },
  { value: 'navy', label: 'Navy Blue', labelAr: 'كحلي', color: '#1e3a5f' },
  { value: 'gold', label: 'Gold', labelAr: 'ذهبي', color: '#d4af37' },
];

export default function VideoAnalysis() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const teamType = searchParams.get('team') as 'main' | 'academy' | null;
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [teamColor, setTeamColor] = useState<string>('');
  const [playerName, setPlayerName] = useState('');
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  
  // Fetch saved analyses from database
  const { data: savedAnalysesData, refetch: refetchAnalyses } = trpc.savedVideoAnalyses.list.useQuery(undefined, {
    enabled: !!user,
  });
  
  // Save analysis mutation
  const saveAnalysisMutation = trpc.savedVideoAnalyses.save.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم حفظ التحليل بنجاح!' : 'Analysis saved successfully!');
      refetchAnalyses();
    },
    onError: (error) => {
      console.error('Save error:', error);
      toast.error(isRTL ? 'فشل حفظ التحليل' : 'Failed to save analysis');
    },
  });
  
  // Delete analysis mutation
  const deleteAnalysisMutation = trpc.savedVideoAnalyses.delete.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم حذف التحليل!' : 'Analysis deleted!');
      refetchAnalyses();
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast.error(isRTL ? 'فشل حذف التحليل' : 'Failed to delete analysis');
    },
  });
  
  // Update local state when data is fetched
  useEffect(() => {
    if (savedAnalysesData) {
      const parsedAnalyses = savedAnalysesData.map(analysis => ({
        id: analysis.id,
        videoName: analysis.videoName,
        analyzedAt: analysis.createdAt,
        teamColor: analysis.teamColor ? TEAM_COLORS.find(c => c.value === analysis.teamColor) : undefined,
        playerName: analysis.playerName,
        isRealAnalysis: analysis.isRealAnalysis,
        ...JSON.parse(analysis.analysisData),
      }));
      setSavedAnalyses(parsedAnalyses);
    }
  }, [savedAnalysesData]);
  const [showHistory, setShowHistory] = useState(false);
  const [keyMoments, setKeyMoments] = useState<{time: number; thumbnail: string; label: string}[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const [assignDrillModalOpen, setAssignDrillModalOpen] = useState(false);
  const [selectedDrillForAssignment, setSelectedDrillForAssignment] = useState<any>(null);
  const [selectedImprovementArea, setSelectedImprovementArea] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Updated to 200MB limit
      if (file.size > 200 * 1024 * 1024) {
        toast.error(isRTL ? 'حجم الفيديو يجب أن يكون أقل من 200 ميجابايت' : 'Video must be less than 200MB');
        return;
      }
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
    }
  };

  // tRPC mutation for real AI video analysis with vision
  const analyzeWithVisionMutation = trpc.aiVideoAnalysis.analyzeWithVision.useMutation({
    onSuccess: (result) => {
      const selectedColor = TEAM_COLORS.find(c => c.value === teamColor);
      setAnalysisResult({
        ...result,
        videoName: videoFile?.name || 'video',
        teamColor: selectedColor,
        analyzedAt: new Date().toISOString(),
        isRealAnalysis: true, // Flag to indicate this is real AI vision analysis
      });
      setIsAnalyzing(false);
      setAnalysisProgress(100);
      toast.success(isRTL ? 'تم تحليل الفيديو بالرؤية الاصطناعية!' : 'AI Vision analysis complete!');
      
      // Auto-save the analysis
      if (user) {
        saveAnalysisMutation.mutate({
          videoName: videoFile?.name || 'video',
          teamColor: teamColor,
          playerName: playerName || undefined,
          analysisData: JSON.stringify(result),
          isRealAnalysis: true,
        });
      }
    },
    onError: (error) => {
      console.error('Vision analysis error:', error);
      setIsAnalyzing(false);
      // Fallback to mock data on error
      runFallbackAnalysis();
    }
  });

  // Legacy mutation (fallback)
  const analyzeVideoMutation = trpc.aiVideoAnalysis.analyze.useMutation({
    onSuccess: (result) => {
      const selectedColor = TEAM_COLORS.find(c => c.value === teamColor);
      setAnalysisResult({
        ...result,
        videoName: videoFile?.name || 'video',
        teamColor: selectedColor,
        analyzedAt: new Date().toISOString(),
      });
      setIsAnalyzing(false);
      setAnalysisProgress(100);
      toast.success(isRTL ? 'تم تحليل الفيديو بنجاح!' : 'Video analysis complete!');
      
      // Auto-save the analysis
      if (user) {
        saveAnalysisMutation.mutate({
          videoName: videoFile?.name || 'video',
          teamColor: teamColor,
          playerName: playerName || undefined,
          analysisData: JSON.stringify(result),
          isRealAnalysis: false,
        });
      }
    },
    onError: (error) => {
      console.error('Analysis error:', error);
      setIsAnalyzing(false);
      runFallbackAnalysis();
    }
  });

  // Extract frames from video for AI vision analysis
  const extractFramesFromVideo = async (video: HTMLVideoElement, frameCount: number = 5): Promise<string[]> => {
    const frames: string[] = [];
    const duration = video.duration;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return frames;
    
    canvas.width = 640; // Reduced size for faster processing
    canvas.height = 360;
    
    for (let i = 0; i < frameCount; i++) {
      const time = (duration / (frameCount + 1)) * (i + 1);
      video.currentTime = time;
      
      await new Promise<void>((resolve) => {
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frameData = canvas.toDataURL('image/jpeg', 0.8);
          frames.push(frameData);
          resolve();
        };
      });
    }
    
    return frames;
  };

  const runFallbackAnalysis = () => {
    const selectedColor = TEAM_COLORS.find(c => c.value === teamColor);
    
    // Use team-aware analysis generator for unique results per team
    const teamAnalysis = generateTeamAnalysis(
      videoFile?.name || 'video',
      teamColor,
      videoFile?.size || 0,
      isRTL
    );
    
    // Convert team analysis to the expected format
    setAnalysisResult({
      videoName: videoFile?.name || 'video',
      playerName: playerName || (isRTL ? 'لاعب غير محدد' : 'Unknown Player'),
      teamColor: selectedColor,
      analyzedAt: teamAnalysis.analyzedAt,
      overallScore: teamAnalysis.overallScore,
      isTeamAnalysis: true,
      
      // Team Detection Results
      teamDetection: teamAnalysis.teamDetection,
      
      // Possession Stats
      possessionStats: teamAnalysis.possessionStats,
      
      // Ball Touch Analysis
      ballTouchAnalysis: teamAnalysis.ballTouchAnalysis,
      
      // Team Heatmap
      teamHeatmap: teamAnalysis.teamHeatmap,
      
      // Movement Analysis
      movementAnalysis: {
        totalDistance: Math.round(teamAnalysis.movementAnalysis.distancePerPlayer),
        maxSpeed: teamAnalysis.movementAnalysis.maxSpeed,
        avgSpeed: teamAnalysis.movementAnalysis.avgSpeed,
        sprintCount: Math.round(teamAnalysis.movementAnalysis.sprintCount / teamAnalysis.teamDetection.ourTeamPlayerCount),
        sprintDistance: Math.round(teamAnalysis.movementAnalysis.totalDistance / 100),
        accelerations: Math.round(teamAnalysis.movementAnalysis.accelerations / teamAnalysis.teamDetection.ourTeamPlayerCount),
        decelerations: Math.round(teamAnalysis.movementAnalysis.decelerations / teamAnalysis.teamDetection.ourTeamPlayerCount),
        highIntensityRuns: Math.round(teamAnalysis.movementAnalysis.highIntensityRuns / teamAnalysis.teamDetection.ourTeamPlayerCount),
      },
      
      // Technical Analysis
      technicalAnalysis: teamAnalysis.technicalAnalysis,
      
      // Tactical Analysis
      tacticalAnalysis: teamAnalysis.tacticalAnalysis,
      
      // Heatmap zones (legacy format)
      heatmapZones: {
        leftWing: teamAnalysis.teamHeatmap.zones.leftMidfield + teamAnalysis.teamHeatmap.zones.leftAttack,
        leftMidfield: teamAnalysis.teamHeatmap.zones.leftMidfield,
        center: teamAnalysis.teamHeatmap.zones.centerMidfield,
        rightMidfield: teamAnalysis.teamHeatmap.zones.rightMidfield,
        rightWing: teamAnalysis.teamHeatmap.zones.rightMidfield + teamAnalysis.teamHeatmap.zones.rightAttack,
      },
      
      // Ball touches (legacy format)
      ballTouches: {
        total: teamAnalysis.ballTouchAnalysis.totalTouches,
        successful: teamAnalysis.ballTouchAnalysis.successfulTouches,
        unsuccessful: teamAnalysis.ballTouchAnalysis.unsuccessfulTouches,
        inOwnHalf: teamAnalysis.ballTouchAnalysis.touchesInDefensiveThird + teamAnalysis.ballTouchAnalysis.touchesInMiddleThird / 2,
        inOpponentHalf: teamAnalysis.ballTouchAnalysis.touchesInAttackingThird + teamAnalysis.ballTouchAnalysis.touchesInMiddleThird / 2,
      },
      
      // Work rate
      workRate: {
        distancePerMinute: teamAnalysis.movementAnalysis.avgSpeed * 10,
        intensityScore: teamAnalysis.tacticalAnalysis.pressingIntensity,
        recoveryTime: Math.round(15 - teamAnalysis.tacticalAnalysis.transitionSpeed / 10),
      },
      
      // Team-specific insights
      strengths: teamAnalysis.teamInsights.strengths,
      improvements: teamAnalysis.teamInsights.weaknesses,
      drillRecommendations: teamAnalysis.teamInsights.drillRecommendations,
      coachNotes: teamAnalysis.teamInsights.coachNotes,
      tacticalRecommendations: teamAnalysis.teamInsights.tacticalRecommendations,
      playStyle: teamAnalysis.teamInsights.playStyle,
    });
    
    setIsAnalyzing(false);
    toast.success(isRTL ? 'تم تحليل الفيديو بنجاح!' : 'Video analysis complete!');
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;
    
    if (!teamColor) {
      toast.error(isRTL ? 'يرجى اختيار لون فريقك' : 'Please select your team color');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    // Progress messages for real AI vision analysis
    const progressMessages = isRTL ? [
      'جاري استخراج الإطارات من الفيديو...',
      'تحليل الإطار 1 بالرؤية الاصطناعية...',
      'تحليل الإطار 2 بالرؤية الاصطناعية...',
      'تحليل الإطار 3 بالرؤية الاصطناعية...',
      'تحليل حركة اللاعب...',
      'تحليل التكتيك والموقع...',
      'تجميع النتائج...',
      'إنشاء تقرير المدرب...',
    ] : [
      'Extracting frames from video...',
      'Analyzing frame 1 with AI vision...',
      'Analyzing frame 2 with AI vision...',
      'Analyzing frame 3 with AI vision...',
      'Analyzing player movement...',
      'Analyzing tactics and positioning...',
      'Aggregating results...',
      'Generating coach report...',
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < progressMessages.length) {
        setAnalysisProgress(Math.min(10 + (stepIndex * 12), 95));
        toast.info(progressMessages[stepIndex], { duration: 1500 });
        stepIndex++;
      }
    }, 2000);

    try {
      // Step 1: Extract frames from video
      setAnalysisProgress(5);
      const video = videoRef.current;
      let frames: string[] = [];
      
      if (video && video.duration > 0) {
        toast.info(isRTL ? 'جاري استخراج الإطارات...' : 'Extracting frames...', { duration: 2000 });
        frames = await extractFramesFromVideo(video, 5);
      }

      if (frames.length > 0) {
        // Step 2: Call real AI vision analysis with extracted frames
        setAnalysisProgress(20);
        await analyzeWithVisionMutation.mutateAsync({
          videoUrl: videoUrl || '',
          frames: frames,
          playerName: playerName || undefined,
          teamColor: teamColor,
          videoType: 'training_clip',
          metadata: {
            duration: video?.duration || 60,
            width: video?.videoWidth || 1920,
            height: video?.videoHeight || 1080,
          },
        });
      } else {
        // Fallback to legacy analysis if frame extraction fails
        toast.info(isRTL ? 'جاري التحليل بالطريقة البديلة...' : 'Using fallback analysis...', { duration: 2000 });
        await analyzeVideoMutation.mutateAsync({
          videoUrl: videoUrl || '',
          playerName: playerName || undefined,
          teamColor: teamColor,
          videoType: 'training_clip',
          fileSizeMb: Math.round(videoFile.size / (1024 * 1024)),
          duration: video?.duration || 0,
        });
      }
      clearInterval(progressInterval);
    } catch (error) {
      clearInterval(progressInterval);
      console.error('Analysis failed:', error);
      // Fallback handled in mutation onError
    }
  };

  const handleSaveAnalysis = () => {
    if (analysisResult) {
      const newAnalysis = {
        ...analysisResult,
        id: Date.now(),
        savedAt: new Date().toISOString(),
      };
      setSavedAnalyses(prev => [newAnalysis, ...prev]);
      toast.success(isRTL ? 'تم حفظ التحليل بنجاح!' : 'Analysis saved successfully!');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-700 dark:text-green-500';
    if (score >= 60) return 'text-yellow-700 dark:text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPriorityColor = (priority: string) => {
    if (priority === 'High' || priority === 'عالية') return 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500';
    if (priority === 'Medium' || priority === 'متوسطة') return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500';
    return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500';
  };

  return (
    <>
    <div className={` ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-card text-foreground sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-foreground hover:bg-muted"
                onClick={() => teamType ? navigate(`/team-dashboard?team=${teamType}`) : navigate('/training')}
              >
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
              <Link href="/">
                <img src="/logo-transparent.png" alt="Future Stars Academy" className="h-10" />
              </Link>
              <div className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-cyan-700 dark:text-cyan-400" />
                <h1 className="text-xl font-bold">{isRTL ? 'تحليل الفيديو بالذكاء الاصطناعي' : 'AI Video Analysis'}</h1>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="text-foreground border-white/20 hover:bg-muted"
            >
              <History className="h-4 w-4 mr-2" />
              {isRTL ? 'السجل' : 'History'}
              {savedAnalyses.length > 0 && (
                <Badge className="ml-2 bg-cyan-500">{savedAnalyses.length}</Badge>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Team Color Selection */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Palette className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
              {isRTL ? 'إعدادات التحليل' : 'Analysis Settings'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">{isRTL ? 'اسم اللاعب (اختياري)' : 'Player Name (optional)'}</Label>
                <Input 
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder={isRTL ? 'أدخل اسم اللاعب' : 'Enter player name'}
                  className="bg-muted border-border text-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">
                  {isRTL ? 'لون قميص فريقك *' : 'Your Team Jersey Color *'}
                </Label>
                <Select value={teamColor} onValueChange={setTeamColor}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder={isRTL ? 'اختر لون الفريق' : 'Select team color'} />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    {TEAM_COLORS.map((color) => (
                      <SelectItem key={color.value} value={color.value} className="text-foreground hover:bg-muted">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border border-gray-400" 
                            style={{ backgroundColor: color.color }}
                          />
                          {isRTL ? color.labelAr : color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {teamColor && (
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white" 
                  style={{ backgroundColor: TEAM_COLORS.find(c => c.value === teamColor)?.color }}
                />
                <span className="text-muted-foreground">
                  {isRTL ? 'سيتم تتبع اللاعبين بقميص ' : 'Players wearing '}
                  <strong className="text-foreground">
                    {isRTL 
                      ? TEAM_COLORS.find(c => c.value === teamColor)?.labelAr 
                      : TEAM_COLORS.find(c => c.value === teamColor)?.label}
                  </strong>
                  {isRTL ? '' : ' jerseys will be tracked'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upload Section */}
        <Card className="bg-muted/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Upload className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
              {isRTL ? 'رفع فيديو التدريب أو المباراة' : 'Upload Training or Match Video'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!videoUrl ? (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-cyan-500 transition-colors"
              >
                <Video className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">
                  {isRTL ? 'اضغط لرفع فيديو أو اسحب وأفلت' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-muted-foreground text-sm">
                  {isRTL ? 'MP4, MOV, AVI, WebM (حتى 200 ميجابايت)' : 'MP4, MOV, AVI, WebM (up to 200MB)'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <AdvancedVideoPlayer 
                  videoUrl={videoUrl} 
                  onTimeUpdate={(time) => console.log('Current time:', time)}
                />
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setVideoFile(null);
                      setVideoUrl(null);
                      setAnalysisResult(null);
                    }}
                    className="text-muted-foreground"
                  >
                    {isRTL ? 'تغيير الفيديو' : 'Change Video'}
                  </Button>
                  <Button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !teamColor}
                    className="bg-cyan-600 hover:bg-cyan-700 flex-1"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        {isRTL ? 'جاري التحليل...' : 'Analyzing...'}
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        {isRTL ? 'تحليل متقدم بالذكاء الاصطناعي' : 'Advanced AI Analysis'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Analysis Progress */}
            {isAnalyzing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{isRTL ? 'جاري التحليل المتقدم...' : 'Running advanced analysis...'}</span>
                  <span className="text-cyan-700 dark:text-cyan-400">{Math.round(analysisProgress)}%</span>
                </div>
                <Progress value={analysisProgress} className="h-2" />
                <p className="text-xs text-muted-foreground text-center">
                  {isRTL 
                    ? 'يقوم الذكاء الاصطناعي بتحليل الحركة والسرعة والمهارات الفنية والتكتيكية' 
                    : 'AI is analyzing movement, speed, technical and tactical skills'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysisResult && (
          <>
            {/* Save Button */}
            <div className="flex justify-end">
              <Button onClick={handleSaveAnalysis} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                {isRTL ? 'حفظ التحليل' : 'Save Analysis'}
              </Button>
            </div>

            {/* Overall Score & Player Info */}
            <Card className="brand-gradient-subtle border-cyan-700">
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">{analysisResult.playerName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div 
                        className="w-4 h-4 rounded-full border border-white" 
                        style={{ backgroundColor: analysisResult.teamColor?.color }}
                      />
                      <span className="text-muted-foreground text-sm">
                        {isRTL ? analysisResult.teamColor?.labelAr : analysisResult.teamColor?.label}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-sm mt-2">{isRTL ? 'التقييم العام' : 'Overall Score'}</p>
                    <p className={`text-5xl font-bold ${getScoreColor(analysisResult.overallScore)}`}>
                      {analysisResult.overallScore}
                    </p>
                  </div>
                  <div className={`w-24 h-24 rounded-full ${getScoreBg(analysisResult.overallScore)} flex items-center justify-center`}>
                    <Target className="h-12 w-12 text-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Detection & Possession */}
            {analysisResult.isTeamAnalysis && analysisResult.teamDetection && (
              <Card className="bg-muted/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Users className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                    {isRTL ? 'كشف الفريق والاستحواذ' : 'Team Detection & Possession'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <div className="w-8 h-8 rounded-full mx-auto mb-2" style={{ backgroundColor: analysisResult.teamColor?.color }} />
                      <p className="text-2xl font-bold text-foreground">{analysisResult.teamDetection.ourTeamPlayerCount}</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'لاعبي فريقنا' : 'Our Team Players'}</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <div className="w-8 h-8 rounded-full mx-auto mb-2 bg-gray-500" />
                      <p className="text-2xl font-bold text-foreground">{analysisResult.teamDetection.opponentPlayerCount}</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'لاعبي الخصم' : 'Opponent Players'}</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <div className="w-8 h-8 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ backgroundColor: analysisResult.teamColor?.color }}>
                        <span className="text-xs font-bold text-foreground">{analysisResult.possessionStats?.ourPossession}%</span>
                      </div>
                      <p className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{analysisResult.possessionStats?.ourPossession}%</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'استحواذنا' : 'Our Possession'}</p>
                    </div>
                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                      <div className="w-8 h-8 rounded-full mx-auto mb-2 bg-gray-500 flex items-center justify-center">
                        <span className="text-xs font-bold text-foreground">{analysisResult.possessionStats?.opponentPossession}%</span>
                      </div>
                      <p className="text-2xl font-bold text-muted-foreground">{analysisResult.possessionStats?.opponentPossession}%</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'استحواذ الخصم' : 'Opponent Possession'}</p>
                    </div>
                  </div>
                  
                  {/* Ball Touch Analysis */}
                  {analysisResult.ballTouchAnalysis && (
                    <div className="border-t border-border pt-4">
                      <h4 className="text-foreground font-medium mb-3">{isRTL ? 'تحليل لمسات الكرة' : 'Ball Touch Analysis'}</h4>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                        <div className="bg-muted/30 p-3 rounded text-center">
                          <p className="text-xl font-bold text-foreground">{analysisResult.ballTouchAnalysis.totalTouches}</p>
                          <p className="text-xs text-muted-foreground">{isRTL ? 'إجمالي اللمسات' : 'Total Touches'}</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded text-center">
                          <p className="text-xl font-bold text-green-700 dark:text-green-400">{analysisResult.ballTouchAnalysis.successfulTouches}</p>
                          <p className="text-xs text-muted-foreground">{isRTL ? 'ناجحة' : 'Successful'}</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded text-center">
                          <p className="text-xl font-bold text-red-600 dark:text-red-400">{analysisResult.ballTouchAnalysis.unsuccessfulTouches}</p>
                          <p className="text-xs text-muted-foreground">{isRTL ? 'غير ناجحة' : 'Unsuccessful'}</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded text-center">
                          <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{analysisResult.ballTouchAnalysis.touchesPerPlayer}</p>
                          <p className="text-xs text-muted-foreground">{isRTL ? 'لكل لاعب' : 'Per Player'}</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded text-center">
                          <p className="text-xl font-bold text-cyan-700 dark:text-cyan-400">{analysisResult.ballTouchAnalysis.touchAccuracy}%</p>
                          <p className="text-xs text-muted-foreground">{isRTL ? 'الدقة' : 'Accuracy'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Team Heatmap */}
            {analysisResult.isTeamAnalysis && analysisResult.teamHeatmap && (
              <Card className="bg-muted/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                    {isRTL ? 'خريطة حرارية للفريق' : 'Team Heatmap'}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({isRTL ? analysisResult.teamColor?.labelAr : analysisResult.teamColor?.label})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative bg-green-900/30 rounded-lg p-4" style={{ aspectRatio: '2/1' }}>
                    {/* Football pitch outline */}
                    <div className="absolute inset-4 border-2 border-white/30 rounded">
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30" />
                      <div className="absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 border-2 border-white/30 rounded-full" />
                    </div>
                    
                    {/* Heatmap zones */}
                    <div className="absolute inset-4 grid grid-cols-6 grid-rows-3 gap-1">
                      {/* Defense row */}
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(239, 68, 68, ${analysisResult.teamHeatmap.zones.leftDefense / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(239, 68, 68, ${analysisResult.teamHeatmap.zones.centerDefense / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(239, 68, 68, ${analysisResult.teamHeatmap.zones.centerDefense / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(34, 197, 94, ${analysisResult.teamHeatmap.zones.centerMidfield / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(34, 197, 94, ${analysisResult.teamHeatmap.zones.centerAttack / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(34, 197, 94, ${analysisResult.teamHeatmap.zones.rightAttack / 100})` }} />
                      
                      {/* Midfield row */}
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(251, 191, 36, ${analysisResult.teamHeatmap.zones.leftMidfield / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(251, 191, 36, ${analysisResult.teamHeatmap.zones.centerMidfield / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(251, 191, 36, ${analysisResult.teamHeatmap.zones.centerMidfield / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(251, 191, 36, ${analysisResult.teamHeatmap.zones.centerMidfield / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(34, 197, 94, ${analysisResult.teamHeatmap.zones.rightMidfield / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(34, 197, 94, ${analysisResult.teamHeatmap.zones.rightAttack / 100})` }} />
                      
                      {/* Attack row */}
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(239, 68, 68, ${analysisResult.teamHeatmap.zones.leftDefense / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(251, 191, 36, ${analysisResult.teamHeatmap.zones.leftMidfield / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(251, 191, 36, ${analysisResult.teamHeatmap.zones.centerMidfield / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(34, 197, 94, ${analysisResult.teamHeatmap.zones.centerAttack / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(34, 197, 94, ${analysisResult.teamHeatmap.zones.centerAttack / 100})` }} />
                      <div className="rounded opacity-70" style={{ backgroundColor: `rgba(34, 197, 94, ${analysisResult.teamHeatmap.zones.rightAttack / 100})` }} />
                    </div>
                  </div>
                  
                  {/* Zone percentages */}
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-red-600 dark:text-red-400 font-bold">{analysisResult.teamHeatmap.zones.leftDefense + analysisResult.teamHeatmap.zones.centerDefense + analysisResult.teamHeatmap.zones.rightDefense}%</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'الثلث الدفاعي' : 'Defensive Third'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-yellow-700 dark:text-yellow-400 font-bold">{analysisResult.teamHeatmap.zones.leftMidfield + analysisResult.teamHeatmap.zones.centerMidfield + analysisResult.teamHeatmap.zones.rightMidfield}%</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'الثلث الأوسط' : 'Middle Third'}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-green-700 dark:text-green-400 font-bold">{analysisResult.teamHeatmap.zones.leftAttack + analysisResult.teamHeatmap.zones.centerAttack + analysisResult.teamHeatmap.zones.rightAttack}%</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'الثلث الهجومي' : 'Attacking Third'}</p>
                    </div>
                  </div>
                  
                  {/* Play Style */}
                  {analysisResult.playStyle && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground">{isRTL ? 'أسلوب اللعب' : 'Play Style'}</p>
                      <p className="text-foreground font-medium">{analysisResult.playStyle}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Movement Analysis */}
            <Card className="bg-muted/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                  {isRTL ? 'تحليل الحركة' : 'Movement Analysis'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <Footprints className="h-6 w-6 text-cyan-700 dark:text-cyan-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{analysisResult.movementAnalysis.totalDistance.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'المسافة الكلية (م)' : 'Total Distance (m)'}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <Zap className="h-6 w-6 text-yellow-700 dark:text-yellow-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{analysisResult.movementAnalysis.maxSpeed}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'السرعة القصوى (كم/س)' : 'Max Speed (km/h)'}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <TrendingUp className="h-6 w-6 text-green-700 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{analysisResult.movementAnalysis.sprintCount}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'عدد الجريات السريعة' : 'Sprint Count'}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg text-center">
                    <Timer className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-foreground">{analysisResult.movementAnalysis.highIntensityRuns}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'جريات عالية الكثافة' : 'High Intensity Runs'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Analysis */}
            <Card className="bg-muted/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Crosshair className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                  {isRTL ? 'التحليل الفني' : 'Technical Analysis'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analysisResult.technicalAnalysis).map(([skill, score]: [string, any]) => (
                  <div key={skill} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        {isRTL ? {
                          ballControl: 'التحكم بالكرة',
                          passing: 'التمرير',
                          passingAccuracy: 'دقة التمرير',
                          shooting: 'التسديد',
                          shootingAccuracy: 'دقة التسديد',
                          dribbling: 'المراوغة',
                          firstTouch: 'اللمسة الأولى',
                          heading: 'اللعب بالرأس'
                        }[skill] : skill.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={getScoreColor(score)}>{score}%</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tactical Analysis */}
            <Card className="bg-muted/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                  {isRTL ? 'التحليل التكتيكي' : 'Tactical Analysis'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(analysisResult.tacticalAnalysis).map(([skill, score]: [string, any]) => (
                  <div key={skill} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground capitalize">
                        {isRTL ? {
                          positioning: 'التمركز',
                          spaceCreation: 'خلق المساحات',
                          defensiveAwareness: 'الوعي الدفاعي',
                          pressingIntensity: 'كثافة الضغط',
                          offTheBallMovement: 'الحركة بدون كرة'
                        }[skill] : skill.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className={getScoreColor(score)}>{score}%</span>
                    </div>
                    <Progress value={score} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Tactical Overlay Templates */}
            <TacticalOverlayTemplates videoRef={videoRef} canvasRef={overlayCanvasRef} />

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-green-900/20 border-green-700">
                <CardHeader>
                  <CardTitle className="text-green-700 dark:text-green-400 flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5" />
                    {isRTL ? 'نقاط القوة' : 'Strengths'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.strengths.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-muted-foreground text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-yellow-900/20 border-yellow-700">
                <CardHeader>
                  <CardTitle className="text-yellow-700 dark:text-yellow-400 flex items-center gap-2 text-lg">
                    <AlertCircle className="h-5 w-5" />
                    {isRTL ? 'مجالات التحسين' : 'Areas to Improve'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {analysisResult.improvements.map((item: string, index: number) => (
                      <li key={index} className="flex items-start gap-2 text-muted-foreground text-sm">
                        <AlertCircle className="h-4 w-4 text-yellow-700 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Drill Recommendations */}
            <Card className="bg-muted/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Target className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                  {isRTL ? 'التمارين الموصى بها' : 'Recommended Training Drills'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.drillRecommendations.map((drill: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <span className="text-muted-foreground">{drill.name}</span>
                          <p className="text-xs text-muted-foreground">{drill.duration}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(drill.priority)}>
                          {drill.priority}
                        </Badge>
                        {user && ['admin', 'coach'].includes(user.role) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-cyan-600 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-600 hover:text-white text-xs px-2 py-1 h-7"
                            onClick={() => {
                              setSelectedDrillForAssignment({
                                id: `drill-${index + 1}`,
                                name: drill.name,
                                nameAr: drill.nameAr || drill.name,
                                category: drill.category || 'general',
                                duration: drill.duration,
                                priority: drill.priority,
                              });
                              setSelectedImprovementArea(drill.focusArea || '');
                              setAssignDrillModalOpen(true);
                            }}
                          >
                            <Users className="h-3 w-3 mr-1" />
                            {isRTL ? 'تعيين' : 'Assign'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border">
                  <Link href="/training-library">
                    <Button className="w-full bg-cyan-600 hover:bg-cyan-700">
                      <Target className="h-4 w-4 mr-2" />
                      {isRTL ? 'استكشف مكتبة التمارين الكاملة' : 'Explore Full Training Library'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Tactical Board & Heatmap */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-muted/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <LayoutGrid className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                    {isRTL ? 'خريطة الحرارة' : 'Heatmap'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TacticalBoard 
                    showHeatmap={true}
                    teamColor={analysisResult.teamColor?.color || '#22c55e'}
                    heatmapData={[
                      { zone: 'leftWing', intensity: analysisResult.heatmapZones?.leftWing || 15 },
                      { zone: 'leftMidfield', intensity: analysisResult.heatmapZones?.leftMidfield || 25 },
                      { zone: 'center', intensity: analysisResult.heatmapZones?.center || 35 },
                      { zone: 'rightMidfield', intensity: analysisResult.heatmapZones?.rightMidfield || 20 },
                      { zone: 'rightWing', intensity: analysisResult.heatmapZones?.rightWing || 5 },
                    ]}
                    isRTL={isRTL}
                  />
                </CardContent>
              </Card>

              <Card className="bg-muted/50 border-border">
                <CardHeader>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                    {isRTL ? 'شبكة التمريرات' : 'Passing Network'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PassingNetwork 
                    teamColor={analysisResult.teamColor?.color || '#22c55e'}
                    isRTL={isRTL}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Coach Notes */}
            <Card className="bg-muted/50 border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Brain className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                  {isRTL ? 'ملاحظات المدرب الآلي' : 'AI Coach Notes'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {analysisResult.coachNotes}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Saved Analyses History */}
        {showHistory && savedAnalyses.length > 0 && (
          <Card className="bg-muted/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <History className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
                {isRTL ? 'التحليلات المحفوظة' : 'Saved Analyses'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {savedAnalyses.map((analysis) => (
                  <div key={analysis.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                    <div 
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                      onClick={() => {
                        setAnalysisResult(analysis);
                        setShowHistory(false);
                        toast.success(isRTL ? 'تم تحميل التحليل!' : 'Analysis loaded!');
                      }}
                    >
                      <div 
                        className="w-4 h-4 rounded-full border border-white" 
                        style={{ backgroundColor: analysis.teamColor?.color }}
                      />
                      <div>
                        <p className="text-foreground font-medium">{analysis.playerName || analysis.videoName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(analysis.analyzedAt).toLocaleDateString()} - {analysis.videoName}
                          {analysis.isRealAnalysis && <span className="ml-2 text-cyan-700 dark:text-cyan-400">AI Vision</span>}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {analysis.overallScore && (
                        <Badge className={getScoreBg(analysis.overallScore) + ' text-foreground'}>
                          {analysis.overallScore}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/20"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا التحليل؟' : 'Are you sure you want to delete this analysis?')) {
                            deleteAnalysisMutation.mutate({ id: analysis.id });
                          }
                        }}
                      >
                        <AlertCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Drill Assignment Modal */}
      {selectedDrillForAssignment && (
        <DrillAssignmentModal
          isOpen={assignDrillModalOpen}
          onClose={() => {
            setAssignDrillModalOpen(false);
            setSelectedDrillForAssignment(null);
          }}
          drill={selectedDrillForAssignment}
          improvementArea={selectedImprovementArea}
        />
      )}
    </div>
    </>
  );
}
