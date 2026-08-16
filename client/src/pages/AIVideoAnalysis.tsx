import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Video, Loader2, Sparkles, Play, Target, TrendingUp, Users, Download, ScanLine, Hash, Upload, X, CheckCircle2, UserCheck, ChevronDown, ChevronUp, Camera, Eye, AlertCircle, FileVideo, Zap, GitCompare, Star, ArrowRight, Award, Save, BookOpen, Trash2, FileDown, Share2, Link, Copy, Check } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AIBreadcrumb } from "@/components/AIBreadcrumb";
import { useLanguage } from "@/contexts/LanguageContext";
import { MarkdownContent } from "@/components/MarkdownContent";

interface SquadPlayer {
  id: number;
  name: string;
  jerseyNumber: number | null;
  position: string;
}

interface JerseyDetection {
  jersey_number: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export default function AIVideoAnalysis() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [videoUrl, setVideoUrl] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Team setup fields
  const [homeTeamName, setHomeTeamName] = useState("");
  const [awayTeamName, setAwayTeamName] = useState("");
  const [homeTeamColor, setHomeTeamColor] = useState("");
  const [awayTeamColor, setAwayTeamColor] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [venue, setVenue] = useState("");
  // Video type and player name for individual analysis
  const [videoType, setVideoType] = useState<'match' | 'training' | 'individual'>('match');
  const [playerName, setPlayerName] = useState('');
  // Frame capture state
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Roboflow jersey OCR state
  const [jerseyImage, setJerseyImage] = useState<string | null>(null);
  const [jerseyImageFile, setJerseyImageFile] = useState<File | null>(null);
  const [jerseyDetections, setJerseyDetections] = useState<JerseyDetection[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [roboflowApiKey, setRoboflowApiKey] = useState("");
  // Squad mapping state
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [jerseyToPlayer, setJerseyToPlayer] = useState<Record<string, number>>({});
  // Comparison tool state
  const [showComparison, setShowComparison] = useState(false);
  const [showSavedReports, setShowSavedReports] = useState(false);
  const [saveReportTitle, setSaveReportTitle] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [shareLinks, setShareLinks] = useState<Record<number, string>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [exportingId, setExportingId] = useState<number | null>(null);
  const [selectedBenchmark, setSelectedBenchmark] = useState<string>('');
  const [comparisonAnalysis, setComparisonAnalysis] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [showMapping, setShowMapping] = useState(false);
  const { data: allTeams } = trpc.teams.getAll.useQuery();
  const { data: squadPlayers } = trpc.teams.getPlayers.useQuery(
    { teamId: selectedTeamId! },
    { enabled: selectedTeamId !== null }
  );

  const saveReport = trpc.aiVideoAnalysis.saveReport.useMutation({
    onSuccess: () => { toast.success('Report saved successfully'); setShowSaveDialog(false); setSaveReportTitle(''); },
    onError: (e) => toast.error(e.message || 'Failed to save report'),
  });
  const { data: savedReports, refetch: refetchReports } = trpc.aiVideoAnalysis.getReports.useQuery(undefined, { enabled: showSavedReports });
  const deleteReport = trpc.aiVideoAnalysis.deleteReport.useMutation({
    onSuccess: () => { toast.success('Report deleted'); refetchReports(); },
  });

  const generateShareToken = trpc.aiVideoAnalysis.generateShareToken.useMutation({
    onSuccess: (data, variables) => {
      const link = `${window.location.origin}/shared-report/${data.token}`;
      setShareLinks(prev => ({ ...prev, [variables.id]: link }));
    },
    onError: (e) => toast.error(e.message || 'Failed to generate share link'),
  });

  const handleExportPDF = async (report: any) => {
    setExportingId(report.id);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 15;
      const maxW = pageW - margin * 2;
      let y = 20;
      // Header
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('AI Video Analysis Report', margin, y);
      y += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(report.title, margin, y);
      y += 7;
      const meta: string[] = [];
      if (report.player_name) meta.push(`Player: ${report.player_name}`);
      if (report.frames_analyzed > 0) meta.push(`${report.frames_analyzed} frames analyzed`);
      meta.push(new Date(report.created_at).toLocaleDateString());
      doc.setFontSize(10);
      doc.text(meta.join('  ·  '), margin, y);
      y += 8;
      doc.setTextColor(0);
      // Divider
      doc.setDrawColor(200);
      doc.line(margin, y, pageW - margin, y);
      y += 8;
      // Content — strip markdown
      const plain = (report.report_content || '')
        .replace(/#{1,6}\s*/g, '')
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/`(.+?)`/g, '$1')
        .replace(/^[-*+]\s/gm, '• ');
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(plain, maxW);
      const lineH = 5.5;
      for (const line of lines) {
        if (y + lineH > doc.internal.pageSize.getHeight() - 15) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, margin, y);
        y += lineH;
      }
      doc.save(`${report.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      toast.success('PDF exported successfully');
    } catch (err) {
      toast.error('Failed to export PDF');
    } finally {
      setExportingId(null);
    }
  };

  const handleCopyLink = (reportId: number, link: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(reportId);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const analyzeComparison = trpc.aiVideoAnalysis.compareWithBenchmark.useMutation();

  const analyzeVideo = trpc.videoAnalysis.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
      setIsAnalyzing(false);
      const analysisType = data.framesAnalyzed > 0 ? `Vision analysis complete — ${data.framesAnalyzed} frames analyzed` : 'Context-based analysis complete';
      toast.success(analysisType);
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error("Analysis failed: " + error.message);
    },
  });

  // Capture frames from the loaded video element using HTML5 Canvas
  const captureFrames = useCallback(async (): Promise<string[]> => {
    const videoEl = videoRef.current;
    if (!videoEl || !videoEl.duration || isNaN(videoEl.duration)) {
      toast.error('Video not loaded. Please wait for the video to load, then try again.');
      return [];
    }
    const frameCount = 10;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    // Scale down for faster processing while keeping quality
    const maxWidth = 640;
    const aspectRatio = videoEl.videoHeight / videoEl.videoWidth;
    canvas.width = maxWidth;
    canvas.height = Math.round(maxWidth * aspectRatio);
    const duration = videoEl.duration;
    const frames: string[] = [];
    const interval = duration / (frameCount + 1);
    for (let i = 1; i <= frameCount; i++) {
      const timestamp = interval * i;
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          videoEl.removeEventListener('seeked', onSeeked);
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          frames.push(dataUrl);
          setCaptureProgress(Math.round((i / frameCount) * 100));
          resolve();
        };
        videoEl.addEventListener('seeked', onSeeked);
        videoEl.currentTime = timestamp;
      });
    }
    return frames;
  }, []);

  const handleCaptureFrames = async () => {
    setIsCapturing(true);
    setCaptureProgress(0);
    setCapturedFrames([]);
    try {
      const frames = await captureFrames();
      setCapturedFrames(frames);
      if (frames.length > 0) {
        toast.success(`${frames.length} frames captured — ready for AI vision analysis`);
      }
    } catch (e: any) {
      toast.error('Frame capture failed: ' + (e.message || 'Unknown error'));
    } finally {
      setIsCapturing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!videoUrl.trim() && !videoDescription.trim() && capturedFrames.length === 0) {
      toast.error("Please provide a video URL, description, or capture frames from a video");
      return;
    }
    setIsAnalyzing(true);
    setAnalysis(null);

    // If video is loaded but no frames captured yet, try to capture automatically
    let framesToSend = capturedFrames;
    if (framesToSend.length === 0 && videoLoaded && videoRef.current) {
      try {
        setIsCapturing(true);
        setCaptureProgress(0);
        toast.info('Auto-capturing video frames for AI vision analysis...');
        const frames = await captureFrames();
        framesToSend = frames;
        setCapturedFrames(frames);
        setIsCapturing(false);
        if (frames.length > 0) {
          toast.success(`Captured ${frames.length} frames — sending to AI`);
        }
      } catch (e) {
        setIsCapturing(false);
      }
    }

    analyzeVideo.mutate({
      videoUrl: videoUrl.trim() || undefined,
      description: videoDescription.trim() || undefined,
      homeTeamName: homeTeamName.trim() || undefined,
      awayTeamName: awayTeamName.trim() || undefined,
      homeTeamColor: homeTeamColor.trim() || undefined,
      awayTeamColor: awayTeamColor.trim() || undefined,
      matchDate: matchDate.trim() || undefined,
      venue: venue.trim() || undefined,
      frameImages: framesToSend.length > 0 ? framesToSend : undefined,
      videoType: videoType,
      playerName: playerName.trim() || undefined,
    });
  };

  const handleSaveReport = () => {
    if (!analysis) return;
    const reportContent = analysis.fullAnalysis || JSON.stringify(analysis, null, 2);
    saveReport.mutate({
      title: saveReportTitle || `Video Analysis - ${new Date().toLocaleDateString()}`,
      videoUrl: videoUrl || undefined,
      playerName: playerName || undefined,
      analysisType: videoType,
      reportContent,
      framesAnalyzed: analysis.framesAnalyzed || 0,
    });
  };

  const handleExport = () => {
    if (!analysis) return;
    const report = `AI VIDEO ANALYSIS REPORT\n========================\nAnalysis Type: ${analysis.analysisType === 'vision' ? `Vision-based (${analysis.framesAnalyzed} frames analyzed)` : 'Context-based'}\nVideo: ${videoUrl || 'Description-based analysis'}\nDate: ${new Date().toLocaleDateString()}\n\n${analysis.fullAnalysis || ''}\n`;
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report exported!");
  };

  const handleJerseyDetect = async () => {
    if (!jerseyImage || !roboflowApiKey) return;
    setIsDetecting(true);
    setJerseyDetections([]);
    try {
      const base64 = jerseyImage.split(',')[1];
      const response = await fetch(
        `https://detect.roboflow.com/football-players-detection-3zvbc/1?api_key=${roboflowApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: base64,
        }
      );
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Roboflow API error');
      }
      const data = await response.json();
      const detections: JerseyDetection[] = (data.predictions || []).map((p: any) => ({
        jersey_number: p.class || '?',
        confidence: Math.round((p.confidence || 0) * 100),
        x: p.x, y: p.y, width: p.width, height: p.height,
      }));
      setJerseyDetections(detections);
      if (detections.length === 0) {
        toast.info('No players detected. Try a clearer image with visible jersey numbers.');
      } else {
        toast.success(`Detected ${detections.length} player(s)!`);
      }
    } catch (err: any) {
      toast.error('Detection failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDetecting(false);
    }
  };

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <AIBreadcrumb toolLabel={language === 'ar' ? 'تحليل الفيديو AI' : 'AI Video Analysis'} />
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Video className="h-8 w-8 text-primary" />
            AI Video Analysis
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload a match or training video — the AI captures real frames and analyzes tactical patterns, formations, and player movements using computer vision
          </p>
        </div>

        {/* Analysis Mode Selector */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: 'match', label: 'Match Analysis', icon: Users, desc: 'Tactical formations, pressing, transitions', color: 'blue' },
            { value: 'training', label: 'Training Session', icon: Target, desc: 'Drill execution, positioning, coaching points', color: 'green' },
            { value: 'individual', label: 'Individual Player', icon: Eye, desc: 'Technique, movement, decision-making', color: 'purple' },
          ].map(({ value, label, icon: Icon, desc, color }) => (
            <button
              key={value}
              onClick={() => setVideoType(value as any)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                videoType === value
                  ? `border-${color}-500 bg-${color}-500/10`
                  : 'border-border hover:border-muted-foreground/50'
              }`}
            >
              <Icon className={`h-5 w-5 mb-2 ${videoType === value ? `text-${color}-500` : 'text-muted-foreground'}`} />
              <p className={`font-semibold text-sm ${videoType === value ? `text-${color}-600 dark:text-${color}-400` : ''}`}>{label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </button>
          ))}
        </div>

        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileVideo className="h-5 w-5" />
              Video Input
            </CardTitle>
            <CardDescription>
              Provide a direct MP4/WebM URL for real frame-by-frame AI vision analysis, or paste a YouTube/Drive link for context-based analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Video URL + Player */}
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label htmlFor="videoUrl">
                  Video URL
                  <span className="ml-2 text-xs text-green-600 font-normal">
                    ✓ Direct MP4/WebM = real frame capture | YouTube/Drive = context analysis
                  </span>
                </Label>
                <Input
                  id="videoUrl"
                  type="url"
                  placeholder="https://example.com/match.mp4 or https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => { setVideoUrl(e.target.value); setVideoLoaded(false); setCapturedFrames([]); }}
                />
              </div>
              {videoType === 'individual' && (
                <div className="space-y-2">
                  <Label>Player Name (for personalized analysis)</Label>
                  <Input placeholder="e.g. Ahmed Hassan" value={playerName} onChange={e => setPlayerName(e.target.value)} />
                </div>
              )}
            </div>

            {/* Embedded Video Player with Frame Capture */}
            {videoUrl.trim() && (
              <div className="space-y-3 p-4 bg-muted/30 rounded-xl border">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Camera className="h-4 w-4 text-primary" />
                    Video Preview & Frame Capture
                  </h4>
                  {capturedFrames.length > 0 && (
                    <Badge className="bg-green-600 text-white">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {capturedFrames.length} frames captured
                    </Badge>
                  )}
                </div>
                <video
                  ref={videoRef}
                  src={videoUrl}
                  controls
                  crossOrigin="anonymous"
                  className="w-full rounded-lg max-h-64 bg-black"
                  onLoadedMetadata={() => { setVideoLoaded(true); toast.success('Video loaded — ready for frame capture'); }}
                  onError={() => setVideoLoaded(false)}
                />
                {videoLoaded && (
                  <div className="space-y-2">
                    {isCapturing ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Capturing frames...</span>
                          <span>{captureProgress}%</span>
                        </div>
                        <Progress value={captureProgress} className="h-2" />
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCaptureFrames}
                        className="gap-2 border-primary/50 text-primary hover:bg-primary/10"
                      >
                        <Camera className="h-4 w-4" />
                        {capturedFrames.length > 0 ? `Re-capture Frames (${capturedFrames.length} captured)` : 'Capture 10 Frames for AI Vision Analysis'}
                      </Button>
                    )}
                    {capturedFrames.length > 0 && (
                      <div className="flex gap-1 overflow-x-auto pb-1">
                        {capturedFrames.slice(0, 5).map((frame, i) => (
                          <img key={i} src={frame} alt={`Frame ${i + 1}`} className="h-12 w-20 object-cover rounded flex-shrink-0 border" />
                        ))}
                        {capturedFrames.length > 5 && (
                          <div className="h-12 w-20 flex-shrink-0 rounded border bg-muted flex items-center justify-center text-xs text-muted-foreground">
                            +{capturedFrames.length - 5} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {!videoLoaded && (
                  <div className="flex items-center gap-2 text-xs text-amber-600">
                    <AlertCircle className="h-3.5 w-3.5" />
                    Video not loaded. Direct MP4/WebM URLs work best. YouTube/Drive links require description-based analysis.
                  </div>
                )}
              </div>
            )}

            {/* Team Setup */}
            {videoType !== 'individual' && (
              <div className="p-4 bg-blue-950/40 border border-blue-700/40 rounded-lg space-y-3">
                <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-300 flex items-center gap-2">
                  <Users className="h-4 w-4" /> Team Setup (Required for accurate analysis)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Home Team Name</Label>
                    <Input placeholder="e.g. Future Stars FC" value={homeTeamName} onChange={e => setHomeTeamName(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Away Team Name</Label>
                    <Input placeholder="e.g. Zamalek SC" value={awayTeamName} onChange={e => setAwayTeamName(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Home Jersey Color</Label>
                    <Input placeholder="e.g. Red & White" value={homeTeamColor} onChange={e => setHomeTeamColor(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Away Jersey Color</Label>
                    <Input placeholder="e.g. Blue & Black" value={awayTeamColor} onChange={e => setAwayTeamColor(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Match Date</Label>
                    <Input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Venue / Stadium</Label>
                    <Input placeholder="e.g. Cairo International Stadium" value={venue} onChange={e => setVenue(e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <div className="flex-1 border-t"></div>
              <span className="text-sm text-muted-foreground">OR add context</span>
              <div className="flex-1 border-t"></div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Match / Session Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe what you observed — formations, key moments, tactical patterns, player performances..."
                value={videoDescription}
                onChange={(e) => setVideoDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing || isCapturing || (!videoUrl.trim() && !videoDescription.trim() && capturedFrames.length === 0)}
                className="flex-1 gap-2"
                size="lg"
              >
                {isAnalyzing ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> {isCapturing ? 'Capturing frames...' : 'Analyzing...'}</>
                ) : (
                  <><Sparkles className="h-5 w-5" /> {capturedFrames.length > 0 ? `Analyze with AI Vision (${capturedFrames.length} frames)` : 'Analyze with AI'}</>
                )}
              </Button>
            </div>

            {capturedFrames.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-700 dark:text-green-400">
                <Zap className="h-4 w-4 flex-shrink-0" />
                <span><strong>Vision Analysis Ready:</strong> {capturedFrames.length} frames captured from the video will be sent to the AI for real visual analysis — not just text description.</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isAnalyzing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="font-semibold">
                {capturedFrames.length > 0
                  ? `AI is analyzing ${capturedFrames.length} video frames with computer vision...`
                  : 'AI is generating tactical analysis...'}
              </p>
              <p className="text-sm text-muted-foreground">
                {capturedFrames.length > 0
                  ? 'The AI is examining each frame for formations, player positions, and tactical patterns'
                  : 'Generating professional tactical analysis from match context'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && !isAnalyzing && (
          <div className="space-y-4">
            {/* Analysis Type Banner */}
            <div className={`flex items-center gap-3 p-3 rounded-xl border ${
              analysis.analysisType === 'vision'
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}>
              {analysis.analysisType === 'vision' ? (
                <>
                  <Camera className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-green-700 dark:text-green-400 text-sm">Vision-Based Analysis</p>
                    <p className="text-xs text-green-600/80 dark:text-green-500/80">{analysis.framesAnalyzed} video frames were analyzed by the AI using computer vision</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-700 dark:text-amber-400 text-sm">Context-Based Analysis</p>
                    <p className="text-xs text-amber-600/80">Analysis generated from match description and context. For vision analysis, use a direct MP4 URL and capture frames.</p>
                  </div>
                </>
              )}
            </div>

            {analysis.formation && analysis.formation !== 'See full analysis' && (
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-5 w-5 text-blue-500" />
                    Formation Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">{analysis.formation}</div>
                  {analysis.formationDetails && (
                    <p className="text-sm text-muted-foreground">{analysis.formationDetails}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Full Analysis Report */}
            {analysis.fullAnalysis && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Full Analysis Report
                    </CardTitle>
                    <button
                      onClick={() => { setSaveReportTitle(`Video Analysis - ${new Date().toLocaleDateString()}`); setShowSaveDialog(true); }}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                      <Save className="h-3 w-3" /> Save Report
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <MarkdownContent content={analysis.fullAnalysis} />
                </CardContent>
              </Card>
            )}

            {/* Sectioned cards if sections were parsed */}
            {!analysis.fullAnalysis && (
              <>
                {analysis.tacticalPatterns && (
                  <Card className="border-green-500/20 bg-green-500/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <TrendingUp className="h-5 w-5 text-green-700 dark:text-green-500" />
                        Tactical Patterns
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MarkdownContent content={analysis.tacticalPatterns} />
                    </CardContent>
                  </Card>
                )}
                {analysis.playerMovements && (
                  <Card className="border-purple-500/20 bg-purple-500/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-5 w-5 text-purple-500" />
                        Player Movements & Positioning
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MarkdownContent content={analysis.playerMovements} />
                    </CardContent>
                  </Card>
                )}
                {analysis.recommendations && (
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Sparkles className="h-5 w-5 text-primary" />
                        AI Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <MarkdownContent content={analysis.recommendations} />
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Comparison Tool */}
            <Card className="border-purple-500/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GitCompare className="h-5 w-5 text-purple-500" />
                    Technique Comparison vs Professional Benchmark
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComparison(!showComparison)}
                    className="gap-1"
                  >
                    {showComparison ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    {showComparison ? 'Hide' : 'Compare'}
                  </Button>
                </div>
                {!showComparison && (
                  <p className="text-xs text-muted-foreground">Compare the player's technique against elite professional benchmarks to identify specific gaps and improvement areas.</p>
                )}
              </CardHeader>
              {showComparison && (
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground block mb-2">Select Professional Benchmark</Label>
                      <select
                        value={selectedBenchmark}
                        onChange={e => setSelectedBenchmark(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                      >
                        <option value="">— Choose a benchmark —</option>
                        <optgroup label="🏃 Dribbling & Ball Control">
                          <option value="messi_dribbling">Lionel Messi — Close Control Dribbling</option>
                          <option value="neymar_dribbling">Neymar Jr — Flair Dribbling & Feints</option>
                          <option value="mbappe_dribbling">Kylian Mbappé — Speed Dribbling</option>
                          <option value="salah_dribbling">Mohamed Salah — Direct Dribbling</option>
                        </optgroup>
                        <optgroup label="⚽ Shooting & Finishing">
                          <option value="ronaldo_shooting">Cristiano Ronaldo — Power Shooting</option>
                          <option value="lewandowski_finishing">Robert Lewandowski — Clinical Finishing</option>
                          <option value="benzema_finishing">Karim Benzema — Technical Finishing</option>
                          <option value="haaland_finishing">Erling Haaland — Aerial & Power Finishing</option>
                        </optgroup>
                        <optgroup label="🎯 Passing & Vision">
                          <option value="modric_passing">Luka Modrić — Short & Long Passing</option>
                          <option value="debruyne_passing">Kevin De Bruyne — Through Balls & Delivery</option>
                          <option value="xavi_passing">Xavi Hernández — Tiki-Taka Passing</option>
                          <option value="pirlo_passing">Andrea Pirlo — Deep-Lying Playmaker</option>
                        </optgroup>
                        <optgroup label="🛡️ Defending">
                          <option value="ramos_defending">Sergio Ramos — Aggressive Defending</option>
                          <option value="vanDijk_defending">Virgil van Dijk — Commanding CB</option>
                          <option value="kante_pressing">N'Golo Kanté — Pressing & Interceptions</option>
                          <option value="alisson_gk">Alisson Becker — Modern Goalkeeper</option>
                        </optgroup>
                        <optgroup label="💪 Physical Attributes">
                          <option value="mbappe_speed">Kylian Mbappé — Elite Speed & Acceleration</option>
                          <option value="ronaldo_athleticism">Cristiano Ronaldo — Peak Athleticism</option>
                          <option value="vinicius_agility">Vinícius Jr — Agility & Balance</option>
                        </optgroup>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={async () => {
                          if (!selectedBenchmark || !analysis) return;
                          setIsComparing(true);
                          try {
                            const result = await analyzeComparison.mutateAsync({
                              playerAnalysis: analysis.fullAnalysis || JSON.stringify(analysis),
                              benchmarkKey: selectedBenchmark,
                              videoType,
                              playerName: playerName || 'the player',
                            });
                            setComparisonAnalysis(result);
                          } catch (e: any) {
                            toast.error(e.message || 'Comparison failed');
                          } finally {
                            setIsComparing(false);
                          }
                        }}
                        disabled={!selectedBenchmark || !analysis || isComparing}
                        className="w-full gap-2"
                      >
                        {isComparing ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Comparing...</>
                        ) : (
                          <><GitCompare className="h-4 w-4" /> Run Comparison</>
                        )}
                      </Button>
                    </div>
                  </div>

                  {comparisonAnalysis && (
                    <div className="space-y-4 pt-2">
                      {/* Radar Chart Comparison */}
                      {comparisonAnalysis.radarData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-center mb-2 text-muted-foreground">PLAYER</p>
                            <ResponsiveContainer width="100%" height={220}>
                              <RadarChart data={comparisonAnalysis.radarData}>
                                <PolarGrid />
                                <PolarAngleAxis dataKey="attribute" tick={{ fontSize: 10 }} />
                                <Radar name="Player" dataKey="player" stroke="#dc2626" fill="#dc2626" fillOpacity={0.25} />
                                <Radar name="Benchmark" dataKey="benchmark" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
                                <RechartsTooltip />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attribute Comparison</p>
                            {comparisonAnalysis.radarData.map((item: any) => (
                              <div key={item.attribute} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="font-medium">{item.attribute}</span>
                                  <span className="text-muted-foreground">{item.player}/100 vs {item.benchmark}/100</span>
                                </div>
                                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                                  <div className="absolute h-full bg-indigo-500/30 rounded-full" style={{ width: `${item.benchmark}%` }} />
                                  <div className="absolute h-full bg-red-500 rounded-full" style={{ width: `${item.player}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Gap Analysis */}
                      {comparisonAnalysis.gaps && comparisonAnalysis.gaps.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Key Gaps to Close</p>
                          <div className="space-y-2">
                            {comparisonAnalysis.gaps.map((gap: any, i: number) => (
                              <div key={i} className="flex items-start gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
                                <div className="w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-xs font-bold text-red-600">{i + 1}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">{gap.area}</p>
                                  <p className="text-xs text-muted-foreground">{gap.description}</p>
                                  {gap.drill && (
                                    <p className="text-xs text-primary mt-1 flex items-center gap-1">
                                      <ArrowRight className="h-3 w-3" /> Recommended: {gap.drill}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Strengths matching benchmark */}
                      {comparisonAnalysis.similarities && comparisonAnalysis.similarities.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Strengths Matching Benchmark</p>
                          <div className="space-y-2">
                            {comparisonAnalysis.similarities.map((s: any, i: number) => (
                              <div key={i} className="flex items-start gap-3 p-3 bg-green-500/5 border border-green-500/20 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium">{s.area}</p>
                                  <p className="text-xs text-muted-foreground">{s.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Overall verdict */}
                      {comparisonAnalysis.verdict && (
                        <div className="p-4 bg-purple-500/5 border border-purple-500/20 rounded-lg">
                          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                            <Award className="h-3.5 w-3.5" /> Overall Comparison Verdict
                          </p>
                          <p className="text-sm leading-relaxed">{comparisonAnalysis.verdict}</p>
                          {comparisonAnalysis.similarityScore !== undefined && (
                            <div className="mt-2 flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Similarity to benchmark:</span>
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${comparisonAnalysis.similarityScore}%` }} />
                              </div>
                              <span className="text-xs font-bold text-purple-600">{comparisonAnalysis.similarityScore}%</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleExport} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!analysis && !isAnalyzing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Video className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">No Analysis Yet</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Provide a direct MP4 video URL for real AI vision analysis, or paste any video URL / description for context-based tactical analysis.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Roboflow Jersey Number Detection ─────────────────────────── */}
        <Card className="border-teal-500/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-teal-500/10">
                <ScanLine className="h-5 w-5 text-teal-700 dark:text-teal-500" />
              </div>
              <div>
                <CardTitle className="text-base">Jersey Number Detection</CardTitle>
                <CardDescription>
                  Powered by Roboflow Sports Vision — upload a match photo to detect player jersey numbers
                </CardDescription>
              </div>
              <Badge variant="outline" className="ml-auto border-teal-400 text-teal-600 text-xs flex-shrink-0">
                Free / Open Source
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Image Upload */}
              <div className="space-y-3">
                <Label>Match Image</Label>
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-teal-400 transition-colors min-h-[160px]"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      setJerseyImageFile(file);
                      const reader = new FileReader();
                      reader.onload = (ev) => setJerseyImage(ev.target?.result as string);
                      reader.readAsDataURL(file);
                      setJerseyDetections([]);
                    };
                    input.click();
                  }}
                >
                  {jerseyImage ? (
                    <div className="relative w-full">
                      <img src={jerseyImage} alt="Match" className="w-full h-40 object-contain rounded-lg" />
                      <button
                        className="absolute top-1 right-1 p-1 bg-background/80 rounded-full hover:bg-background border"
                        onClick={(e) => {
                          e.stopPropagation();
                          setJerseyImage(null);
                          setJerseyImageFile(null);
                          setJerseyDetections([]);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground text-center">
                        Click to upload a match photo<br />
                        <span className="text-xs">JPG, PNG up to 10MB</span>
                      </p>
                    </>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Roboflow API Key{" "}
                    <a
                      href="https://roboflow.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-teal-700 dark:text-teal-500 underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      (free at roboflow.com)
                    </a>
                  </Label>
                  <Input
                    type="password"
                    placeholder="rf_xxxxxxxxxxxxxxxx"
                    value={roboflowApiKey}
                    onChange={(e) => setRoboflowApiKey(e.target.value)}
                    className="text-xs h-8"
                  />
                </div>
                <Button
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={!jerseyImage || isDetecting || !roboflowApiKey}
                  onClick={handleJerseyDetect}
                >
                  {isDetecting ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Detecting...</>
                  ) : (
                    <><ScanLine className="h-4 w-4 mr-2" /> Detect Jersey Numbers</>
                  )}
                </Button>
              </div>

              {/* Detection Results + Squad Mapping */}
              <div className="space-y-3">
                <Label>Detection Results</Label>
                {jerseyDetections.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-teal-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>{jerseyDetections.length} player(s) detected</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {jerseyDetections.map((det, idx) => {
                        const mappedPlayerId = jerseyToPlayer[det.jersey_number];
                        const mappedPlayer = (squadPlayers as SquadPlayer[] | undefined)?.find(p => p.id === mappedPlayerId);
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 p-2 rounded-lg border ${
                              mappedPlayer ? 'bg-green-500/10 border-green-500/30' : 'bg-teal-500/10 border-teal-500/20'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                              {det.jersey_number}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium">#{det.jersey_number}</p>
                              {mappedPlayer ? (
                                <p className="text-xs text-green-600 truncate">{mappedPlayer.name}</p>
                              ) : (
                                <p className="text-xs text-muted-foreground">{det.confidence}% conf.</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Squad Mapping Section */}
                    <div className="border rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/60 transition-colors text-sm font-medium"
                        onClick={() => setShowMapping(!showMapping)}
                      >
                        <span className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-teal-700 dark:text-teal-500" />
                          Map to Squad Players
                        </span>
                        {showMapping ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                      {showMapping && (
                        <div className="p-3 space-y-3">
                          <div>
                            <Label className="text-xs">Select Team</Label>
                            <Select
                              value={selectedTeamId?.toString() ?? ''}
                              onValueChange={(v) => { setSelectedTeamId(Number(v)); setJerseyToPlayer({}); }}
                            >
                              <SelectTrigger className="h-8 text-xs mt-1">
                                <SelectValue placeholder="Pick a team..." />
                              </SelectTrigger>
                              <SelectContent>
                                {(allTeams as any[] | undefined)?.map((t: any) => (
                                  <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {selectedTeamId && squadPlayers && (
                            <div className="space-y-2">
                              {jerseyDetections.map((det, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {det.jersey_number}
                                  </div>
                                  <Select
                                    value={jerseyToPlayer[det.jersey_number]?.toString() ?? ''}
                                    onValueChange={(v) => setJerseyToPlayer(prev => ({ ...prev, [det.jersey_number]: Number(v) }))}
                                  >
                                    <SelectTrigger className="h-7 text-xs flex-1">
                                      <SelectValue placeholder="Assign player..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(squadPlayers as any[]).map((p: any) => (
                                        <SelectItem key={p.id} value={p.id.toString()}>
                                          {p.jerseyNumber ? `#${p.jerseyNumber} ` : ''}{p.name || `${p.firstName || ''} ${p.lastName || ''}`.trim()}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              ))}
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full text-xs border-teal-400 text-teal-600 hover:bg-teal-50"
                                onClick={() => {
                                  const mapped = Object.keys(jerseyToPlayer).length;
                                  toast.success(`${mapped} jersey number(s) mapped to squad players!`);
                                }}
                              >
                                <UserCheck className="h-3.5 w-3.5 mr-1" /> Confirm Mapping
                              </Button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex flex-col items-center justify-center gap-2 border rounded-xl bg-muted/30">
                    <Hash className="h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground text-center">
                      Upload an image and run detection<br />to see jersey numbers here
                    </p>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">How to get a free Roboflow API key:</p>
                  <ol className="list-decimal list-inside space-y-0.5">
                    <li>Go to <a href="https://roboflow.com" target="_blank" rel="noreferrer" className="text-teal-700 dark:text-teal-500 underline">roboflow.com</a> and sign up (free)</li>
                    <li>Navigate to Settings → API Keys</li>
                    <li>Copy your key and paste it above</li>
                  </ol>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Reports Button */}
        <div className="flex justify-end">
          <button
            onClick={() => { setShowSavedReports(!showSavedReports); }}
            className="flex items-center gap-2 text-sm px-4 py-2 border rounded-lg hover:bg-muted transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            {showSavedReports ? 'Hide Saved Reports' : 'View Saved Reports'}
          </button>
        </div>

        {/* Saved Reports Panel */}
        {showSavedReports && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5 text-primary" />
                Saved Analysis Reports
              </CardTitle>
              <CardDescription>Previously saved video analysis reports</CardDescription>
            </CardHeader>
            <CardContent>
              {!savedReports ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : savedReports.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                  <BookOpen className="h-10 w-10" />
                  <p className="text-sm">No saved reports yet. Analyze a video and save the report.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedReports.map((report: any) => (
                    <div key={report.id} className="flex flex-col gap-2 p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{report.title}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            {report.player_name && <span>Player: {report.player_name}</span>}
                            {report.analysis_type && <span className="capitalize">{report.analysis_type}</span>}
                            {report.frames_analyzed > 0 && <span>{report.frames_analyzed} frames</span>}
                            <span>{new Date(report.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteReport.mutate({ id: report.id })}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors flex-shrink-0"
                          title="Delete report"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {/* Action buttons */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleExportPDF(report)}
                          disabled={exportingId === report.id}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-blue-600/10 text-blue-600 dark:text-blue-400 rounded-md hover:bg-blue-600/20 transition-colors disabled:opacity-50"
                        >
                          {exportingId === report.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
                          Export PDF
                        </button>
                        {!shareLinks[report.id] ? (
                          <button
                            onClick={() => generateShareToken.mutate({ id: report.id })}
                            disabled={generateShareToken.isPending}
                            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 bg-green-600/10 text-green-600 dark:text-green-400 rounded-md hover:bg-green-600/20 transition-colors disabled:opacity-50"
                          >
                            {generateShareToken.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Share2 className="h-3 w-3" />}
                            Share Link
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <div className="flex-1 min-w-0 text-xs px-2 py-1.5 bg-muted rounded-md truncate font-mono text-muted-foreground">
                              {shareLinks[report.id]}
                            </div>
                            <button
                              onClick={() => handleCopyLink(report.id, shareLinks[report.id])}
                              className="flex items-center gap-1 text-xs px-2 py-1.5 bg-green-600/10 text-green-600 dark:text-green-400 rounded-md hover:bg-green-600/20 transition-colors flex-shrink-0"
                            >
                              {copiedId === report.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                              {copiedId === report.id ? 'Copied!' : 'Copy'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Save Report Dialog */}
        {showSaveDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowSaveDialog(false)}>
            <div className="bg-background border rounded-xl shadow-xl p-6 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2">
                <Save className="h-5 w-5 text-primary" />
                Save Analysis Report
              </h3>
              <p className="text-sm text-muted-foreground mb-4">Give this report a name to save it for future reference.</p>
              <div className="space-y-2 mb-4">
                <label className="text-sm font-medium">Report Title</label>
                <input
                  type="text"
                  value={saveReportTitle}
                  onChange={e => setSaveReportTitle(e.target.value)}
                  placeholder="e.g. Match vs Al Ahly - Tactical Analysis"
                  className="w-full px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveReport(); if (e.key === 'Escape') setShowSaveDialog(false); }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className="px-4 py-2 text-sm border rounded-md hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveReport}
                  disabled={saveReport.isPending || !saveReportTitle.trim()}
                  className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saveReport.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                  Save Report
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              What AI Vision Analysis Can Detect:
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
              {[
                'Team formations and tactical setups (4-3-3, 4-4-2, etc.)',
                'Player positioning and movement patterns',
                'Passing networks and build-up play',
                'Pressing triggers and defensive organization',
                'Transition moments (attack to defense and vice versa)',
                'Individual player technique and body mechanics',
                'Set piece routines and patterns',
                'Space creation and off-the-ball movement',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-700 dark:text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{item}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
