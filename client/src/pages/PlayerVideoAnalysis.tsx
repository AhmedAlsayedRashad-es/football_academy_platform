import { useState, useRef, useCallback } from "react";
import { useLocation } from 'wouter';
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Video, Upload, Sparkles, Download, Save, History, Play, X,
  Target, TrendingUp, Users, Star, ChevronDown, ChevronUp, Loader2, CheckCircle, ArrowLeft} from 'lucide-react';
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { useLanguage } from '@/contexts/LanguageContext';

const VIDEO_TYPES = [
  { value: "match_highlight", label: "Match Highlight" },
  { value: "training_clip", label: "Training Clip" },
  { value: "skill_demo", label: "Skill Demo" },
  { value: "analysis", label: "Tactical Analysis" },
  { value: "full_match", label: "Full Match" },
] as const;

const TEAM_COLORS = [
  { label: "Red", value: "red", hex: "#ef4444" },
  { label: "White", value: "white", hex: "#f9fafb" },
  { label: "Blue", value: "blue", hex: "#3b82f6" },
  { label: "Green", value: "green", hex: "#22c55e" },
  { label: "Yellow", value: "yellow", hex: "#eab308" },
  { label: "Black", value: "black", hex: "#1f2937" },
  { label: "Orange", value: "orange", hex: "#f97316" },
  { label: "Purple", value: "purple", hex: "#a855f7" },
];

function ScoreRing({ score, label }: { score: number; label: string }) {
  const pct = Math.min(100, Math.max(0, score));
  const r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 75 ? "#22c55e" : pct >= 50 ? "#eab308" : "#ef4444";
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#374151" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeDashoffset={circ / 4}
          strokeLinecap="round"
        />
        <text x="36" y="40" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">{score}</text>
      </svg>
      <span className="text-muted-foreground text-xs text-center">{label}</span>
    </div>
  );
}

function renderSectionContent(content: any) {
  if (!content) return null;

  if (typeof content === "string") {
    return <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">{content}</p>;
  }

  if (Array.isArray(content)) {
    return (
      <ul className="space-y-2">
        {content.map((item: any, idx: number) => {
          if (typeof item === "string") {
            return (
              <li key={idx} className="flex items-start gap-2 text-muted-foreground text-sm">
                <span className="text-red-600 dark:text-red-400 font-bold">•</span>
                <span>{item}</span>
              </li>
            );
          }
          if (typeof item === "object" && item !== null) {
            return (
              <li key={idx} className="bg-card/60 p-3 rounded-lg border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground text-sm">{item.name || item.nameAr || `Recommendation ${idx + 1}`}</span>
                  <div className="flex items-center gap-2">
                    {item.priority && (
                      <Badge className={item.priority === 'high' ? 'bg-red-800 text-white text-xs' : 'bg-muted text-muted-foreground text-xs'}>
                        {item.priority}
                      </Badge>
                    )}
                    {item.duration && <span className="text-muted-foreground text-xs">{item.duration}</span>}
                  </div>
                </div>
                {(item.description || item.descriptionAr) && (
                  <p className="text-muted-foreground text-xs leading-normal mt-1">{item.description || item.descriptionAr}</p>
                )}
              </li>
            );
          }
          return null;
        })}
      </ul>
    );
  }

  if (typeof content === "object" && content !== null) {
    const formatKey = (key: string) => {
      return key
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());
    };

    const formatValue = (key: string, val: any) => {
      if (typeof val === "number") {
        if (key.toLowerCase().includes("distance")) return `${val.toLocaleString()} m`;
        if (key.toLowerCase().includes("speed")) return `${val} km/h`;
        if (key.toLowerCase().includes("accuracy")) return `${val}%`;
      }
      return String(val);
    };

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
        {Object.entries(content).map(([key, val]) => (
          <div key={key} className="bg-card/70 p-2.5 rounded-lg border border-border flex flex-col">
            <span className="text-muted-foreground text-xs">{formatKey(key)}</span>
            <span className="text-foreground font-bold text-sm mt-0.5">{formatValue(key, val)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-muted-foreground text-sm">{String(content)}</p>;
}

function AnalysisSection({ title, icon, content, color }: { title: string; icon: React.ReactNode; content: any; color: string }) {
  const [open, setOpen] = useState(true);
  if (!content) return null;
  return (
    <div className={`rounded-lg border ${color} overflow-hidden`}>
      <button className="w-full flex items-center justify-between p-3 text-left" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2 text-foreground font-semibold text-sm">
          {icon} {title}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-3 pb-3">
          {renderSectionContent(content)}
        </div>
      )}
    </div>
  );
}

export default function PlayerVideoAnalysis() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [teamColor, setTeamColor] = useState("red");
  const [videoType, setVideoType] = useState<typeof VIDEO_TYPES[number]["value"]>("match_highlight");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState("");

  // Analysis state
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);

  const analyzeMutation = trpc.aiVideoAnalysis.analyze.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
      setAnalyzing(false);
      toast({ title: "Analysis complete!", description: "AI coaching report is ready." });
    },
    onError: (err) => {
      setAnalyzing(false);
      toast({ title: "Analysis failed", description: err.message, variant: "destructive" });
    },
  });
  const analyzeWithVisionMutation = trpc.aiVideoAnalysis.analyzeWithVision.useMutation({
    onSuccess: (data) => {
      setAnalysis(data);
      setAnalyzing(false);
      toast({ title: "Vision Analysis complete!", description: "AI has analyzed actual video frames." });
    },
    onError: (err) => {
      setAnalyzing(false);
      // Fall back to metadata-only analysis
      toast({ title: "Vision analysis unavailable", description: "Falling back to standard analysis.", variant: "default" });
      analyzeMutation.mutate({
        videoUrl: uploadedUrl || videoUrl || "local-upload",
        playerName: playerName || undefined,
        teamColor,
        videoType,
        fileSizeMb: videoFile ? Math.round(videoFile.size / (1024 * 1024)) : undefined,
      });
    },
  });

  const saveMutation = trpc.aiVideoAnalysis.save.useMutation({
    onSuccess: () => {
      toast({ title: "Saved!", description: "Analysis saved to your history." });
      historyQuery.refetch();
    },
    onError: (err) => toast({ title: "Save failed", description: err.message, variant: "destructive" }),
  });

  const historyQuery = trpc.aiVideoAnalysis.getHistory.useQuery({ limit: 20 });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 200 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 200MB.", variant: "destructive" });
      return;
    }
    setVideoFile(file);
    setVideoUrl("");
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("video/")) {
      if (file.size > 200 * 1024 * 1024) {
        toast({ title: "File too large", description: "Maximum file size is 200MB.", variant: "destructive" });
        return;
      }
      setVideoFile(file);
      setVideoUrl("");
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
    }
  }, [title]);

  const uploadFile = async (): Promise<string> => {
    if (!videoFile) return videoUrl;
    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("video", videoFile);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        setUploading(false);
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText);
          setUploadedUrl(data.url);
          resolve(data.url);
        } else {
          reject(new Error("Upload failed"));
        }
      };
      xhr.onerror = () => { setUploading(false); reject(new Error("Upload failed")); };
      xhr.open("POST", "/upload-video");
      xhr.send(formData);
    });
  };

  const handleAnalyze = async () => {
    if (!videoFile && !videoUrl.trim()) {
      toast({ title: "No video", description: "Please upload a video file or enter a URL.", variant: "destructive" });
      return;
    }
    setAnalysis(null);
    setAnalyzing(true);

    let finalUrl = videoUrl;
    if (videoFile && !uploadedUrl) {
      try {
        finalUrl = await uploadFile();
      } catch {
        setAnalyzing(false);
        toast({ title: "Upload failed", description: "Could not upload video. Please try again.", variant: "destructive" });
        return;
      }
    } else if (uploadedUrl) {
      finalUrl = uploadedUrl;
    }

    // Try to extract frames for real vision analysis if we have a file
    if (videoFile) {
      try {
        const frames = await extractVideoFrames(videoFile, 5);
        if (frames.length > 0) {
          analyzeWithVisionMutation.mutate({
            videoUrl: finalUrl || "local-upload",
            frames,
            playerName: playerName || undefined,
            teamColor,
            videoType,
            metadata: {
              duration: videoFile.size / (1024 * 1024) * 8, // rough estimate
            },
          });
          return;
        }
      } catch {
        // Frame extraction failed, fall through to metadata analysis
      }
    }
    // Fallback: metadata-only analysis
    analyzeMutation.mutate({
      videoUrl: finalUrl || "local-upload",
      playerName: playerName || undefined,
      teamColor,
      videoType,
      fileSizeMb: videoFile ? Math.round(videoFile.size / (1024 * 1024)) : undefined,
    });
  };

  // Extract frames from a video file as base64 images
  const extractVideoFrames = (file: File, count: number): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      video.src = url;
      video.muted = true;
      video.crossOrigin = 'anonymous';
      const frames: string[] = [];
      video.addEventListener('loadedmetadata', () => {
        const duration = video.duration;
        if (!duration || duration === Infinity) { URL.revokeObjectURL(url); resolve([]); return; }
        const interval = duration / (count + 1);
        let captured = 0;
        const captureFrame = (time: number) => {
          video.currentTime = time;
        };
        video.addEventListener('seeked', () => {
          const canvas = document.createElement('canvas');
          canvas.width = 640;
          canvas.height = 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, 640, 360);
            frames.push(canvas.toDataURL('image/jpeg', 0.7));
          }
          captured++;
          if (captured < count) {
            captureFrame(interval * (captured + 1));
          } else {
            URL.revokeObjectURL(url);
            resolve(frames);
          }
        });
        captureFrame(interval);
      });
      video.addEventListener('error', () => { URL.revokeObjectURL(url); reject(new Error('Video load failed')); });
      video.load();
    });
  };

  const handleSave = () => {
    if (!analysis) return;
    saveMutation.mutate({
      title: title || `Analysis ${new Date().toLocaleDateString()}`,
      videoUrl: uploadedUrl || videoUrl || "local-upload",
      playerName: playerName || undefined,
      teamColor,
      videoType,
      fileSizeMb: videoFile ? Math.round(videoFile.size / (1024 * 1024)) : undefined,
      overallScore: analysis.overallScore,
      movementAnalysis: analysis.movementAnalysis,
      technicalAnalysis: analysis.technicalAnalysis,
      tacticalAnalysis: analysis.tacticalAnalysis,
      strengths: analysis.strengths,
      improvements: analysis.improvements,
      drillRecommendations: analysis.drillRecommendations,
      coachNotes: notes || undefined,
    });
  };

  const handleExport = () => {
    if (!analysis) return;
    const formatBlock = (data: any) => {
      if (!data) return "";
      if (typeof data === "string") return data;
      if (Array.isArray(data)) {
        return data.map((item) => (typeof item === "object" ? `- ${item.name || item.nameAr || "Drill"}: ${item.description || item.descriptionAr || ""}` : `- ${item}`)).join("\n");
      }
      if (typeof data === "object") {
        return Object.entries(data).map(([k, v]) => `${k}: ${v}`).join("\n");
      }
      return String(data);
    };

    const lines = [
      `AL AHLY ACADEMY — AI VIDEO ANALYSIS REPORT`,
      `============================================`,
      `Title: ${title || "Untitled"}`,
      `Player: ${playerName || "—"}`,
      `Team Color: ${teamColor}`,
      `Type: ${videoType}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Overall Score: ${analysis.overallScore ?? "—"}/100`,
      ``,
      analysis.movementAnalysis ? `MOVEMENT ANALYSIS\n${formatBlock(analysis.movementAnalysis)}\n` : "",
      analysis.technicalAnalysis ? `TECHNICAL ANALYSIS\n${formatBlock(analysis.technicalAnalysis)}\n` : "",
      analysis.tacticalAnalysis ? `TACTICAL ANALYSIS\n${formatBlock(analysis.tacticalAnalysis)}\n` : "",
      analysis.strengths ? `STRENGTHS\n${formatBlock(analysis.strengths)}\n` : "",
      analysis.improvements ? `AREAS FOR IMPROVEMENT\n${formatBlock(analysis.improvements)}\n` : "",
      analysis.drillRecommendations ? `DRILL RECOMMENDATIONS\n${formatBlock(analysis.drillRecommendations)}\n` : "",
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `analysis-${Date.now()}.txt`;
    a.click();
  };

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) { setLocation("/"); return null; }

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            
            <button onClick={() => navigate('/videos')} className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">

              <ArrowLeft className="w-5 h-5" />

            </button>
<h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-red-600 dark:text-red-400" /> AI Video Analysis
            </h1>
            <p className="text-muted-foreground text-sm">Upload a match or training clip for detailed AI coaching feedback</p>
          </div>
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setShowHistory(!showHistory)}
          >
            <History className="w-4 h-4 mr-2" /> History
          </Button>
        </div>

        {/* History panel */}
        {showHistory && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground text-sm">Analysis History</CardTitle>
            </CardHeader>
            <CardContent>
              {historyQuery.isLoading ? (
                <p className="text-muted-foreground text-sm">Loading...</p>
              ) : !historyQuery.data?.length ? (
                <p className="text-muted-foreground text-sm">No saved analyses yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {historyQuery.data.map((h: any) => (
                    <div key={h.id} className="flex items-center justify-between bg-card rounded-lg px-3 py-2">
                      <div>
                        <div className="text-foreground text-sm font-semibold">{h.title || "Untitled"}</div>
                        <div className="text-muted-foreground text-xs">{h.playerName || "—"} · {h.videoType} · {h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ""}</div>
                      </div>
                      <Badge className="bg-red-800 text-white text-xs">{h.overallScore ?? "—"}/100</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Upload & Config */}
          <div className="space-y-4">
            {/* Video upload */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                  <Upload className="w-4 h-4 text-red-600 dark:text-red-400" /> Upload Video
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Drop zone */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${videoFile ? "border-green-600 bg-green-900/10" : "border-border hover:border-red-500 bg-card"}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {videoFile ? (
                    <div className="space-y-1">
                      <CheckCircle className="w-8 h-8 text-green-700 dark:text-green-400 mx-auto" />
                      <p className="text-green-700 dark:text-green-400 font-semibold text-sm">{videoFile.name}</p>
                      <p className="text-muted-foreground text-xs">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 text-xs"
                        onClick={(e) => { e.stopPropagation(); setVideoFile(null); setUploadedUrl(""); setUploadProgress(0); }}
                      >
                        <X className="w-3 h-3 mr-1" /> Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Video className="w-10 h-10 text-muted-foreground mx-auto" />
                      <p className="text-muted-foreground text-sm">Drag & drop or click to upload</p>
                      <p className="text-gray-600 text-xs">MP4, MOV, AVI · Max 200MB</p>
                    </div>
                  )}
                  <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                </div>

                {uploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading...</span><span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </div>
                )}

                <div className="text-center text-muted-foreground text-xs">— or paste a video URL —</div>
                <Input
                  value={videoUrl}
                  onChange={(e) => { setVideoUrl(e.target.value); setVideoFile(null); }}
                  placeholder="https://example.com/match.mp4"
                  className="bg-background border-border text-foreground text-sm"
                  disabled={!!videoFile}
                />
              </CardContent>
            </Card>

            {/* Analysis config */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground text-sm">Analysis Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-sm">Analysis Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. U14 Match vs Zamalek" className="bg-background border-border text-foreground mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Player Name (optional)</Label>
                  <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="e.g. Ahmed Mohamed" className="bg-background border-border text-foreground mt-1 text-sm" />
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Video Type</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {VIDEO_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => setVideoType(t.value)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${videoType === t.value ? "bg-red-700 border-red-600 text-white" : "bg-card border-border text-muted-foreground hover:border-gray-400"}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Team Color (for player tracking)</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {TEAM_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setTeamColor(c.value)}
                        title={c.label}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${teamColor === c.value ? "border-white scale-110" : "border-border"}`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">Selected: <span className="text-foreground capitalize">{teamColor}</span></p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-sm">Coach Notes (optional)</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add context for the AI coach..." className="bg-background border-border text-foreground mt-1 text-sm" rows={2} />
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={analyzing || uploading || (!videoFile && !videoUrl.trim())}
                  className="w-full bg-red-700 hover:bg-red-600 text-white font-bold"
                >
                  {analyzing || uploading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {uploading ? `Uploading ${uploadProgress}%...` : "Analyzing..."}</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Analyze with AI</>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Analysis results */}
          <div className="space-y-4">
            {analyzing && (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center space-y-3">
                  <Loader2 className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto animate-spin" />
                  <p className="text-foreground font-semibold">AI Coach is analyzing your video...</p>
                  <p className="text-muted-foreground text-sm">Detecting formations, movements, and technical skills</p>
                </CardContent>
              </Card>
            )}

            {analysis && !analyzing && (() => {
              const calcScore = (data: any, topKey: string) => {
                if (typeof analysis?.[topKey] === 'number') return analysis[topKey];
                if (typeof data === 'object' && data !== null) {
                  const nums = Object.values(data).filter((v): v is number => typeof v === 'number');
                  if (nums.length > 0) {
                    const avg = Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
                    return avg > 100 ? Math.min(100, Math.round(avg / 120)) : avg;
                  }
                }
                return undefined;
              };
              const techScore = calcScore(analysis.technicalAnalysis, 'technicalScore');
              const tactScore = calcScore(analysis.tacticalAnalysis, 'tacticalScore');
              const physScore = calcScore(analysis.movementAnalysis, 'physicalScore');

              return (
                <>
                  {/* Score overview */}
                  {analysis.overallScore !== undefined && (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground text-sm flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-700 dark:text-yellow-400" /> Performance Score
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-4 justify-around">
                          <ScoreRing score={analysis.overallScore ?? 0} label="Overall" />
                          {techScore !== undefined && <ScoreRing score={techScore} label="Technical" />}
                          {tactScore !== undefined && <ScoreRing score={tactScore} label="Tactical" />}
                          {physScore !== undefined && <ScoreRing score={physScore} label="Physical" />}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Analysis sections */}
                <div className="space-y-2">
                  <AnalysisSection title="Movement Analysis" icon={<TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />} content={analysis.movementAnalysis} color="border-blue-800 bg-blue-900/10" />
                  <AnalysisSection title="Technical Analysis" icon={<Target className="w-4 h-4 text-green-700 dark:text-green-400" />} content={analysis.technicalAnalysis} color="border-green-800 bg-green-900/10" />
                  <AnalysisSection title="Tactical Analysis" icon={<Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />} content={analysis.tacticalAnalysis} color="border-purple-800 bg-purple-900/10" />
                  <AnalysisSection title="Strengths" icon={<Star className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />} content={analysis.strengths} color="border-yellow-800 bg-yellow-900/10" />
                  <AnalysisSection title="Areas for Improvement" icon={<TrendingUp className="w-4 h-4 text-red-600 dark:text-red-400" />} content={analysis.improvements} color="border-red-800 bg-red-900/10" />
                  <AnalysisSection title="Drill Recommendations" icon={<Play className="w-4 h-4 text-orange-700 dark:text-orange-400" />} content={analysis.drillRecommendations} color="border-orange-800 bg-orange-900/10" />
                  {analysis.fullAnalysis && (
                    <AnalysisSection title="Full Analysis" icon={<Sparkles className="w-4 h-4 text-muted-foreground" />} content={analysis.fullAnalysis} color="border-border bg-card/50" />
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <Button onClick={handleSave} disabled={saveMutation.isPending} className="flex-1 bg-green-700 hover:bg-green-600 text-white">
                    <Save className="w-4 h-4 mr-2" /> {saveMutation.isPending ? "Saving..." : "Save Report"}
                  </Button>
                  <Button onClick={handleExport} variant="outline" className="border-border text-muted-foreground hover:text-foreground">
                    <Download className="w-4 h-4 mr-2" /> Export
                  </Button>
                </div>
              </>
            );
          })()}

            {!analysis && !analyzing && (
              <Card className="bg-card border-border">
                <CardContent className="py-12 text-center space-y-3">
                  <Video className="w-12 h-12 text-gray-600 mx-auto" />
                  <p className="text-foreground font-semibold">No Analysis Yet</p>
                  <p className="text-muted-foreground text-sm">Upload a video and click "Analyze with AI" to get a detailed coaching report.</p>
                  <div className="text-left bg-card rounded-lg p-4 mt-2">
                    <p className="text-muted-foreground text-sm font-semibold mb-2">What the AI detects:</p>
                    <ul className="text-muted-foreground text-xs space-y-1 list-disc list-inside">
                      <li>Team formations and tactical setups</li>
                      <li>Player positioning and movement patterns</li>
                      <li>Technical skills: passing, dribbling, shooting</li>
                      <li>Pressing triggers and defensive organization</li>
                      <li>Individual player roles and work rate</li>
                      <li>Personalized drill recommendations</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
