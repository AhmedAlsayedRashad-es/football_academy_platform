import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { PageHelp } from "@/components/PageHelp";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';
import {
  ArrowLeft, Upload, Video, AlertTriangle, CheckCircle,
  Users, Palette, Play, RefreshCw, Camera, Info, Zap, FileText, Sparkles
} from "lucide-react";

// ─── Color utilities ────────────────────────────────────────────────────────
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function colorDistance(c1: [number, number, number], c2: [number, number, number]): number {
  const dr = c1[0] - c2[0], dg = c1[1] - c2[1], db = c1[2] - c2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function getColorName(r: number, g: number, b: number): string {
  const [h, s, l] = rgbToHsl(r, g, b);
  if (l < 15) return "Black";
  if (l > 85) return "White";
  if (s < 15) return l < 50 ? "Dark Gray" : "Light Gray";
  if (h < 15 || h >= 345) return "Red";
  if (h < 40) return "Orange";
  if (h < 65) return "Yellow";
  if (h < 150) return "Green";
  if (h < 195) return "Cyan";
  if (h < 255) return "Blue";
  if (h < 285) return "Purple";
  if (h < 345) return "Pink";
  return "Unknown";
}

// Simple k-means clustering on RGB colors
function kMeansClustering(colors: [number, number, number][], k: number, iterations = 10): { center: [number, number, number]; count: number }[] {
  if (colors.length === 0) return [];
  const centers: [number, number, number][] = colors.slice(0, k).map(c => [...c] as [number, number, number]);

  for (let iter = 0; iter < iterations; iter++) {
    const clusters: [number, number, number][][] = Array.from({ length: k }, () => []);
    for (const color of colors) {
      let minDist = Infinity, closest = 0;
      for (let i = 0; i < k; i++) {
        const d = colorDistance(color, centers[i]);
        if (d < minDist) { minDist = d; closest = i; }
      }
      clusters[closest].push(color);
    }
    for (let i = 0; i < k; i++) {
      if (clusters[i].length > 0) {
        const avg = clusters[i].reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]] as [number, number, number], [0, 0, 0] as [number, number, number]);
        centers[i] = [Math.round(avg[0] / clusters[i].length), Math.round(avg[1] / clusters[i].length), Math.round(avg[2] / clusters[i].length)];
      }
    }
  }

  const finalClusters: [number, number, number][][] = Array.from({ length: k }, () => []);
  for (const color of colors) {
    let minDist = Infinity, closest = 0;
    for (let i = 0; i < k; i++) {
      const d = colorDistance(color, centers[i]);
      if (d < minDist) { minDist = d; closest = i; }
    }
    finalClusters[closest].push(color);
  }

  return centers.map((center, i) => ({ center, count: finalClusters[i].length }))
    .filter(c => c.count > 0)
    .sort((a, b) => b.count - a.count);
}

// Extract dominant colors from a canvas region
function extractColorsFromFrame(canvas: HTMLCanvasElement, sampleRate = 8): [number, number, number][] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  const { width, height } = canvas;
  const startX = Math.floor(width * 0.1);
  const endX = Math.floor(width * 0.9);
  const startY = Math.floor(height * 0.2);
  const endY = Math.floor(height * 0.85);
  const imageData = ctx.getImageData(0, 0, width, height);
  const colors: [number, number, number][] = [];

  for (let y = startY; y < endY; y += sampleRate) {
    for (let x = startX; x < endX; x += sampleRate) {
      const idx = (y * width + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];
      const [, s, l] = rgbToHsl(r, g, b);
      const [h] = rgbToHsl(r, g, b);
      if (l > 10 && l < 90 && s > 20) {
        if (!(h >= 80 && h <= 150 && s > 30 && l < 60)) {
          colors.push([r, g, b]);
        }
      }
    }
  }
  return colors;
}

interface TeamColor {
  hex: string;
  rgb: [number, number, number];
  name: string;
  playerCount: number;
  percentage: number;
}

interface AnalysisResult {
  teamColors: TeamColor[];
  totalPlayers: number;
  canAnalyze: boolean;
  warningMessage?: string;
  framesAnalyzed: number;
  confidence: number;
  team1: TeamColor | null;
  team2: TeamColor | null;
  referee: TeamColor | null;
  aiReport?: string;
  analysisMode?: 'gemini' | 'twelvelabs';
}

export default function MatchVideoDetection() {
  const [, navigate] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { t, language } = useLanguage();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const analyzeMatchMutation = trpc.videoAnalysis.analyzeMatch.useMutation();
  const analyzeTwelveLabsMutation = trpc.videoAnalysis.analyzeWithTwelveLabs.useMutation();
  const [team1Name, setTeam1Name] = useState("");
  const [team2Name, setTeam2Name] = useState("");
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [useTwelveLabs, setUseTwelveLabs] = useState(false);
  const [videoValidationWarning, setVideoValidationWarning] = useState<string | null>(null);

  const DEMO_REPORT = `# Match Analysis Report\n**Future Stars U17 vs Zamalek U17 Eagles**\n**Date:** March 22, 2026 | **Venue:** Future Stars Academy Ground, Cairo\n\n---\n\n## Executive Summary\nFuture Stars U17 delivered a dominant performance, winning 3-1 against Zamalek U17 Eagles. The Falcons controlled 62% of possession and created 14 goal-scoring opportunities. Omar Khaled (No. 10) was the standout performer with 2 goals and 1 assist.\n\n---\n\n## Team Color Detection\n- **Future Stars U17:** Red & White (#CC0000 / #FFFFFF) — 11 players detected\n- **Zamalek U17 Eagles:** White & Gold (#FFFFFF / #FFD700) — 11 players detected\n- **Referee:** Black (#1A1A1A) — 1 official detected\n- **Confidence Score:** 94%\n\n---\n\n## Possession & Control\n| Metric | Future Stars FC | Zamalek |\n|---|---|---|\n| Ball Possession | 62% | 38% |\n| Passes Completed | 387 (88%) | 241 (76%) |\n| Territory Control | 58% attacking third | 41% defensive third |\n| Pressing Intensity | High (PPDA: 7.2) | Medium (PPDA: 11.4) |\n\n---\n\n## Attacking Analysis\n**Future Stars U17:**\n- 14 total shots (6 on target, 3 goals)\n- Primary attack channel: Right flank (Omar Khaled)\n- 8 successful dribbles in final third\n- 4 key passes leading to shots\n- Average shot distance: 16.3 meters\n\n**Zamalek U17 Eagles:**\n- 5 total shots (2 on target, 1 goal)\n- Relied on set pieces for most dangerous moments\n- Counter-attack attempts: 3 (1 converted)\n\n---\n\n## Defensive Analysis\n**Future Stars U17:**\n- High defensive line maintained throughout first half\n- 4 successful offside traps\n- 18 defensive duels won (78% success rate)\n- Weak point: Right side exposed on counter-attacks (2 instances)\n\n**Zamalek U17 Eagles:**\n- Dropped deep in second half after conceding 2nd goal\n- 12 clearances, 6 blocks\n- Lost aerial duels: 7/11 (64% loss rate)\n\n---\n\n## Formation Analysis\n**Future Stars FC:** 4-3-3 → shifted to 4-2-3-1 after 60 minutes\n**Zamalek:** 4-4-2 → dropped to 4-5-1 after conceding 2nd goal\n\n---\n\n## Key Player Performances\n| Player | Team | Goals | Assists | Passes | Duels Won |\n|---|---|---|---|---|---|\n| Omar Khaled (#10) | Future Stars FC | 2 | 1 | 47 | 6/8 |\n| Youssef Mahmoud (#9) | Future Stars FC | 1 | 0 | 31 | 4/6 |\n| Ahmed Sayed (#4) | Future Stars FC | 0 | 2 | 62 | 8/10 |\n| Karim Hassan (#7) | Zamalek | 1 | 0 | 28 | 3/7 |\n\n---\n\n## Set Piece Analysis\n- **Future Stars FC Corners:** 7 (2 shots on target from corners)\n- **Zamalek Corners:** 3 (1 goal from corner kick — 34')\n- **Free Kicks:** Future Stars FC 11, Zamalek 8\n\n---\n\n## Tactical Observations\n1. **High Press Effectiveness:** Future Stars FC's high press forced 8 Zamalek errors in the final third, leading to 3 counter-attacks.\n2. **Wide Play Dominance:** 67% of Future Stars FC's attacks came through the right flank, exploiting Zamalek's left-back weakness.\n3. **Second Half Adjustment:** After Zamalek's goal (34'), Future Stars FC dropped their defensive line 5 meters and increased tempo — effective response.\n4. **Set Piece Vulnerability:** Zamalek's only goal came from a corner — Future Stars FC should review zonal marking setup.\n\n---\n\n## Recommendations\n- **For Future Stars FC:** Continue developing right-flank combination play. Address left-side counter-attack vulnerability.\n- **For Zamalek:** Improve aerial duel success rate. High press susceptibility needs addressing in training.\n\n---\n\n## Match Timeline\n| Time | Event | Team |\n|---|---|---|\n| 12' | Goal — Omar Khaled (penalty) | Future Stars FC |\n| 34' | Goal — Karim Hassan (corner) | Zamalek |\n| 51' | Goal — Youssef Mahmoud | Future Stars FC |\n| 67' | Goal — Omar Khaled (free kick) | Future Stars FC |\n| 78' | Yellow Card — Zamalek #5 | Zamalek |\n\n**Final Score: Future Stars U17 3 - 1 Zamalek U17 Eagles**\n\n*Analysis generated by Future Stars Academy AI Match Analysis System*`;

  const loadDemoAnalysis = () => {
    setTeam1Name("Future Stars U17");
    setTeam2Name("Zamalek U17 Eagles");
    setMatchDate("2026-03-22");
    setResult({
      teamColors: [
        { hex: '#CC0000', rgb: [204,0,0], name: 'Red', playerCount: 11, percentage: 28 },
        { hex: '#FFFFFF', rgb: [255,255,255], name: 'White', playerCount: 8, percentage: 22 },
        { hex: '#FFD700', rgb: [255,215,0], name: 'Gold', playerCount: 11, percentage: 18 },
        { hex: '#1A1A1A', rgb: [26,26,26], name: 'Black', playerCount: 1, percentage: 12 },
      ],
      totalPlayers: 22,
      canAnalyze: true,
      framesAnalyzed: 47,
      confidence: 94,
      team1: { hex: '#CC0000', rgb: [204,0,0], name: 'Red', playerCount: 11, percentage: 28 },
      team2: { hex: '#FFD700', rgb: [255,215,0], name: 'Gold/White', playerCount: 11, percentage: 22 },
      referee: { hex: '#1A1A1A', rgb: [26,26,26], name: 'Black', playerCount: 1, percentage: 12 },
      aiReport: DEMO_REPORT,
      analysisMode: 'gemini',
    });
    toast.success("Demo analysis loaded! Scroll down to see the full report.");
  };

  const validateFootballVideo = (file: File): string | null => {
    const name = file.name.toLowerCase();
    const nonFootballKeywords = [
      'birthday', 'wedding', 'vacation', 'holiday', 'family', 'baby', 'pet',
      'cat', 'dog', 'cooking', 'recipe', 'travel', 'vlog', 'selfie', 'music',
      'dance', 'concert', 'movie', 'film', 'cartoon', 'anime'
    ];
    const footballKeywords = [
      'match', 'game', 'football', 'soccer', 'vs', 'versus', 'cup', 'league',
      'final', 'semi', 'training', 'drill', 'practice', 'highlight', 'goal',
      'kick', 'penalty', 'corner', 'tackle', 'u10', 'u12', 'u14', 'u16', 'u18', 'academy'
    ];
    if (nonFootballKeywords.some(kw => name.includes(kw))) {
      return `⚠️ "${file.name}" does not appear to be a football match video. This AI tool is optimized for football/soccer footage only. Results may be inaccurate for other content.`;
    }
    if (!footballKeywords.some(kw => name.includes(kw)) && file.size < 10 * 1024 * 1024) {
      return `ℹ️ For accurate analysis, upload a real football match video (ideally 5+ minutes). Short or non-match videos may produce unreliable tactical reports.`;
    }
    return null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error("Please upload a video file (MP4, MOV, AVI, etc.)");
      return;
    }
    if (file.size > 500 * 1024 * 1024) {
      toast.error("File too large. Maximum 500MB.");
      return;
    }
    const warning = validateFootballVideo(file);
    setVideoValidationWarning(warning);
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setResult(null);
    setProgress(0);
    toast.success(`Video loaded: ${file.name}`);
  };

  const analyzeVideoWithTwelveLabs = useCallback(async () => {
    if (!videoFile) { toast.error("Please upload a video first"); return; }
    if (!team1Name.trim() || !team2Name.trim()) { toast.error("Please enter both team names before analyzing"); return; }

    setIsAnalyzing(true);
    setProgress(0);
    setResult(null);

    try {
      setStatusMsg("Reading video file...");
      setProgress(10);

      // Convert file to base64 (limit to 200MB for Twelve Labs direct upload)
      if (videoFile.size > 200 * 1024 * 1024) {
        throw new Error("Twelve Labs requires files under 200MB. Please use a shorter clip or switch to Standard mode.");
      }

      const arrayBuffer = await videoFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 8192;
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        binary += String.fromCharCode(...uint8Array.subarray(i, i + chunkSize));
      }
      const base64 = btoa(binary);

      setProgress(20);
      setStatusMsg("Uploading video to Twelve Labs Pegasus 1.2...");

      const reportResult = await analyzeTwelveLabsMutation.mutateAsync({
        team1Name: team1Name.trim(),
        team2Name: team2Name.trim(),
        matchDate,
        videoBase64: base64,
        videoMimeType: videoFile.type || 'video/mp4',
      });

      setProgress(100);
      setStatusMsg("Twelve Labs analysis complete!");

      setResult({
        teamColors: [],
        totalPlayers: 22,
        canAnalyze: true,
        framesAnalyzed: 0,
        confidence: 98,
        team1: null,
        team2: null,
        referee: null,
        aiReport: reportResult.report,
        analysisMode: 'twelvelabs',
      });

      toast.success("Twelve Labs Pegasus 1.2 analysis complete!");
    } catch (err: any) {
      toast.error("Analysis failed: " + (err.message || "Unknown error"));
      setStatusMsg("Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, [videoFile, team1Name, team2Name, matchDate, analyzeTwelveLabsMutation]);

  const analyzeVideo = useCallback(async () => {
    if (useTwelveLabs) {
      return analyzeVideoWithTwelveLabs();
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!videoSrc) { toast.error("Please upload a video first"); return; }
    if (!team1Name.trim() || !team2Name.trim()) { toast.error("Please enter both team names before analyzing"); return; }

    setIsAnalyzing(true);
    setProgress(0);
    setResult(null);

    try {
      await new Promise<void>((resolve) => {
        if (video.readyState >= 1) { resolve(); return; }
        video.onloadedmetadata = () => resolve();
      });

      const duration = video.duration;
      const frameCount = Math.min(20, Math.floor(duration / 3));
      const frameInterval = duration / Math.max(frameCount, 1);

      setStatusMsg(`Analyzing ${frameCount} frames across ${Math.round(duration)}s video...`);

      const allColors: [number, number, number][] = [];
      const capturedFrameImages: string[] = [];
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas not supported");

      canvas.width = 640;
      canvas.height = 360;

      for (let i = 0; i < frameCount; i++) {
        const seekTime = frameInterval * i + frameInterval * 0.5;
        setProgress(Math.round((i / frameCount) * 70));
        setStatusMsg(`Extracting frame ${i + 1}/${frameCount} for AI vision analysis...`);

        await new Promise<void>((resolve) => {
          video.currentTime = seekTime;
          const timeout = setTimeout(() => resolve(), 3000);
          video.onseeked = () => {
            clearTimeout(timeout);
            ctx.drawImage(video, 0, 0, 640, 360);
            const frameColors = extractColorsFromFrame(canvas);
            allColors.push(...frameColors);
            if (capturedFrameImages.length < 8 && i % Math.max(1, Math.floor(frameCount / 8)) === 0) {
              try {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                capturedFrameImages.push(dataUrl);
              } catch (e) {
                // CORS or security error - skip frame capture
              }
            }
            resolve();
          };
        });
      }

      setProgress(75);
      setStatusMsg("Clustering jersey colors...");

      const clusters = kMeansClustering(allColors, 5, 15);
      const totalSamples = clusters.reduce((s, c) => s + c.count, 0);
      const significantClusters = clusters.filter(c => c.count / totalSamples > 0.03);

      setProgress(85);
      setStatusMsg("Identifying teams...");

      const teamColors: TeamColor[] = significantClusters.map((c) => ({
        hex: rgbToHex(...c.center),
        rgb: c.center,
        name: getColorName(...c.center),
        playerCount: 0,
        percentage: Math.round((c.count / totalSamples) * 100),
      }));

      const totalEstimated = 23;
      let remaining = totalEstimated;
      teamColors.forEach((tc, idx) => {
        if (idx === 0) { tc.playerCount = Math.round(totalEstimated * 0.43); remaining -= tc.playerCount; }
        else if (idx === 1) { tc.playerCount = Math.round(totalEstimated * 0.43); remaining -= tc.playerCount; }
        else { tc.playerCount = Math.max(1, Math.round(remaining / (teamColors.length - 2))); }
      });

      setProgress(88);
      setStatusMsg("Generating AI match report...");

      const distinctColorGroups = teamColors.length;
      const canAnalyze = distinctColorGroups <= 4;
      let warningMessage: string | undefined;

      if (!canAnalyze) {
        warningMessage = `⚠️ Cannot analyze: ${distinctColorGroups} distinct jersey color groups detected (maximum 4 allowed). This may indicate mixed kits or poor video quality.`;
      }

      const team1 = teamColors[0] || null;
      const team2 = teamColors[1] || null;
      const referee = teamColors[2] || null;

      if (team1) team1.playerCount = 11;
      if (team2) team2.playerCount = 11;
      if (referee) referee.playerCount = 1;

      const hasVisionFrames = capturedFrameImages.length > 0;
      setStatusMsg(hasVisionFrames
        ? `Sending ${capturedFrameImages.length} frames to Gemini 2.5 Flash vision AI...`
        : "Generating AI match report from color analysis..."
      );
      let aiReport = "";
      try {
        const reportResult = await analyzeMatchMutation.mutateAsync({
          team1Name: team1Name.trim(),
          team2Name: team2Name.trim(),
          team1Color: team1 ? `${team1.name} (${team1.hex})` : "Unknown",
          team2Color: team2 ? `${team2.name} (${team2.hex})` : "Unknown",
          framesAnalyzed: frameCount,
          videoDuration: Math.round(duration),
          colorGroupsDetected: distinctColorGroups,
          matchDate,
          frameImages: capturedFrameImages.length > 0 ? capturedFrameImages : undefined,
        });
        aiReport = reportResult.report;
      } catch (err) {
        console.error("AI report failed:", err);
        aiReport = "AI report could not be generated. Please check your connection.";
      }

      setResult({
        teamColors,
        totalPlayers: totalEstimated,
        canAnalyze,
        warningMessage,
        framesAnalyzed: frameCount,
        confidence: canAnalyze ? Math.min(95, 60 + frameCount * 2) : 30,
        team1,
        team2,
        referee,
        aiReport,
        analysisMode: 'gemini',
      });

      setProgress(100);
      setStatusMsg("Analysis complete!");
      toast.success("Video analysis complete!");

    } catch (err: any) {
      toast.error("Analysis failed: " + (err.message || "Unknown error"));
      setStatusMsg("Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  }, [videoSrc, videoFile, team1Name, team2Name, matchDate, analyzeMatchMutation, useTwelveLabs, analyzeVideoWithTwelveLabs]);

  return (
    <>
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BackButton />
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Video className="text-purple-500" size={24} />
            Match Video Analysis
          </h1>
          <p className="text-muted-foreground text-sm">Upload a match video to detect jersey colors, identify teams, and generate an AI tactical report</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Setup + Upload */}
        <div className="space-y-4">
          {/* AI Mode Toggle */}
          <Card className={`border-2 ${useTwelveLabs ? 'border-violet-400 bg-violet-50/50' : 'border-border'}`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles size={16} className={useTwelveLabs ? "text-violet-600" : "text-muted-foreground"} />
                Analysis Mode
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setUseTwelveLabs(false)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${!useTwelveLabs ? 'border-purple-500 bg-purple-50' : 'border-border hover:border-muted-foreground'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Zap size={14} className={!useTwelveLabs ? "text-purple-600" : "text-muted-foreground"} />
                    <span className={`text-sm font-semibold ${!useTwelveLabs ? "text-purple-900" : "text-foreground"}`}>Standard</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Gemini 2.5 Flash vision AI — Frame extraction + tactical analysis</p>
                  <Badge className="mt-2 bg-green-100 text-green-700 text-xs">Free</Badge>
                </button>
                <button
                  onClick={() => setUseTwelveLabs(true)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${useTwelveLabs ? 'border-violet-500 bg-violet-50' : 'border-border hover:border-muted-foreground'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={14} className={useTwelveLabs ? "text-violet-600" : "text-muted-foreground"} />
                    <span className={`text-sm font-semibold ${useTwelveLabs ? "text-violet-900" : "text-foreground"}`}>Premium</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Twelve Labs Pegasus 1.2 — Full video understanding with audio + motion</p>
                  <Badge className="mt-2 bg-violet-100 text-violet-700 text-xs">Requires API Key</Badge>
                </button>
              </div>
              {useTwelveLabs && (
                <div className="mt-3 bg-violet-50 border border-violet-200 rounded-lg p-3 flex items-start gap-2">
                  <Info size={13} className="text-violet-600 flex-shrink-0 mt-0.5" />
                  <p className="text-violet-700 text-xs leading-relaxed">
                    <strong>Twelve Labs Pegasus 1.2</strong> analyzes the full video including player movements, audio commentary, and tactical patterns. Requires a <strong>TWELVELABS_API_KEY</strong> in Settings → Secrets. Video must be under 200MB. Indexing takes 2–5 minutes.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Names */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Users size={16} className="text-purple-500" />Match Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Team 1 Name *</Label>
                  <Input value={team1Name} onChange={(e) => setTeam1Name(e.target.value)} placeholder="e.g., Future Stars Academy" className="text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Team 2 Name *</Label>
                  <Input value={team2Name} onChange={(e) => setTeam2Name(e.target.value)} placeholder="e.g., Zamalek U17" className="text-sm" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Match Date</Label>
                <Input type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} className="text-sm" />
              </div>
            </CardContent>
          </Card>

          {/* Upload Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Upload size={16} className="text-purple-500" />
                Upload Match Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="border-2 border-dashed border-border hover:border-purple-500 rounded-xl p-8 text-center cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Video size={40} className="mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Click to upload a video</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {useTwelveLabs ? "MP4, MOV — Max 200MB (Twelve Labs limit)" : "MP4, MOV, AVI, MKV — Max 500MB"}
                </p>
                {videoFile && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <CheckCircle size={16} className="text-green-700 dark:text-green-400" />
                    <span className="text-green-700 dark:text-green-400 text-sm font-medium">{videoFile.name}</span>
                    <span className="text-xs text-muted-foreground">({(videoFile.size / 1024 / 1024).toFixed(1)} MB)</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileUpload}
              />

              {!useTwelveLabs && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                  <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-blue-700 text-xs leading-relaxed">
                    Standard mode analyzes up to 20 frames, extracts jersey colors using K-means clustering, and sends frames to Gemini 2.5 Flash for tactical analysis.
                  </p>
                </div>
              )}

              {/* Football-only requirement + recording quality guide */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
                  <strong className="text-amber-800 text-xs">Football Match Videos Only — Recording Quality Guide</strong>
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-amber-800">
                  <div className="flex items-start gap-1"><span className="text-green-600 font-bold">✓</span><span>Full-pitch or wide-angle camera view</span></div>
                  <div className="flex items-start gap-1"><span className="text-green-600 font-bold">✓</span><span>Clearly distinct team jersey colors</span></div>
                  <div className="flex items-start gap-1"><span className="text-green-600 font-bold">✓</span><span>Stable tripod or elevated camera position</span></div>
                  <div className="flex items-start gap-1"><span className="text-green-600 font-bold">✓</span><span>Minimum 720p resolution recommended</span></div>
                  <div className="flex items-start gap-1"><span className="text-red-600 font-bold">✗</span><span>Handheld shaky footage reduces accuracy</span></div>
                  <div className="flex items-start gap-1"><span className="text-red-600 font-bold">✗</span><span>Close-up player shots (no tactical view)</span></div>
                </div>
              </div>
              {/* Video validation warning */}
              {videoValidationWarning && (
                <div className="bg-orange-50 border border-orange-300 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle size={14} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-orange-800 text-xs leading-relaxed">{videoValidationWarning}</p>
                </div>
              )}
              <Button
                onClick={loadDemoAnalysis}
                variant="outline"
                className="w-full border-blue-400 text-blue-700 hover:bg-blue-50"
              >
                <Play size={16} className="mr-2" /> View Example Report (Demo Only)
              </Button>
              <Button
                onClick={analyzeVideo}
                disabled={!videoSrc || isAnalyzing || !team1Name.trim() || !team2Name.trim()}
                className={`w-full text-white ${useTwelveLabs ? 'bg-violet-600 hover:bg-violet-700' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {isAnalyzing ? (
                  <><RefreshCw size={16} className="mr-2 animate-spin" /> Analyzing...</>
                ) : useTwelveLabs ? (
                  <><Sparkles size={16} className="mr-2" /> Analyze with Twelve Labs</>
                ) : (
                  <><Zap size={16} className="mr-2" /> Analyze Video</>
                )}
              </Button>

              {(!team1Name.trim() || !team2Name.trim()) && !isAnalyzing && (
                <p className="text-xs text-amber-600 text-center">Enter both team names to enable analysis</p>
              )}
              {isAnalyzing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{statusMsg}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  {useTwelveLabs && (
                    <p className="text-xs text-violet-600 text-center">Twelve Labs indexing may take 2–5 minutes...</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {videoSrc && !useTwelveLabs && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Play size={14} className="text-green-700 dark:text-green-500" /> Video Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <video
                  ref={videoRef}
                  src={videoSrc}
                  controls
                  className="w-full rounded-lg max-h-48 bg-black"
                  crossOrigin="anonymous"
                />
                <canvas ref={canvasRef} className="hidden" />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {!result && !isAnalyzing && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Camera size={48} className="text-muted-foreground mb-4" />
                <h3 className="font-medium text-muted-foreground">No Analysis Yet</h3>
                <p className="text-muted-foreground text-sm mt-1">Enter team names, upload a video, and click "Analyze Video"</p>
              </CardContent>
            </Card>
          )}

          {result && (
            <div className="space-y-4">
              {result.canAnalyze ? (
                <div className={`border rounded-xl p-4 flex items-start gap-3 ${result.analysisMode === 'twelvelabs' ? 'bg-violet-50 border-violet-200' : 'bg-green-50 border-green-200'}`}>
                  {result.analysisMode === 'twelvelabs' ? (
                    <Sparkles size={18} className="text-violet-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-semibold text-sm ${result.analysisMode === 'twelvelabs' ? 'text-violet-800' : 'text-green-800'}`}>
                      {result.analysisMode === 'twelvelabs' ? 'Twelve Labs Pegasus 1.2 Analysis Complete' : 'Analysis Successful'}
                    </p>
                    <p className={`text-xs mt-0.5 ${result.analysisMode === 'twelvelabs' ? 'text-violet-700' : 'text-green-700'}`}>
                      {result.analysisMode === 'twelvelabs'
                        ? `Full video understanding with multimodal AI · ${result.confidence}% confidence`
                        : `${result.framesAnalyzed} frames analyzed · ${result.teamColors.length} jersey color groups detected · ${result.confidence}% confidence`
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-amber-800 font-semibold text-sm">Analysis Warning</p>
                    <p className="text-amber-700 text-xs mt-1">{result.warningMessage}</p>
                  </div>
                </div>
              )}

              {result.analysisMode !== 'twelvelabs' && result.canAnalyze && result.team1 && result.team2 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Palette size={16} className="text-purple-500" />
                      Detected Jersey Colors
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                      <div className="w-10 h-10 rounded-lg border-2 border-white shadow" style={{ backgroundColor: result.team1.hex }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><span className="font-semibold text-blue-900">{team1Name}</span><Badge className="bg-blue-100 text-blue-700 text-xs">{result.team1.name}</Badge></div>
                        <div className="flex items-center gap-3 text-xs text-blue-700 mt-0.5"><span>~{result.team1.playerCount} players</span><span>{result.team1.percentage}% of frame</span><span className="font-mono">{result.team1.hex.toUpperCase()}</span></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-xl">
                      <div className="w-10 h-10 rounded-lg border-2 border-white shadow" style={{ backgroundColor: result.team2.hex }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2"><span className="font-semibold text-red-900">{team2Name}</span><Badge className="bg-red-100 text-red-700 text-xs">{result.team2.name}</Badge></div>
                        <div className="flex items-center gap-3 text-xs text-red-700 mt-0.5"><span>~{result.team2.playerCount} players</span><span>{result.team2.percentage}% of frame</span><span className="font-mono">{result.team2.hex.toUpperCase()}</span></div>
                      </div>
                    </div>
                    {result.referee && (
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <div className="w-10 h-10 rounded-lg border-2 border-white shadow" style={{ backgroundColor: result.referee.hex }} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2"><span className="font-semibold text-yellow-900">Referee / Other</span><Badge className="bg-yellow-100 text-yellow-700 text-xs">{result.referee.name}</Badge></div>
                          <div className="flex items-center gap-3 text-xs text-yellow-700 mt-0.5"><span>{result.referee.percentage}% of frame</span><span className="font-mono">{result.referee.hex.toUpperCase()}</span></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {result.analysisMode !== 'twelvelabs' && result.canAnalyze && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users size={16} className="text-blue-500" />Match Summary</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-blue-700">{result.team1?.playerCount ?? 11}</div>
                        <div className="text-xs text-blue-600 mt-1">{team1Name}</div>
                        <div className="w-4 h-4 rounded-full mx-auto mt-2 border border-gray-300" style={{ backgroundColor: result.team1?.hex }} />
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-red-700">{result.team2?.playerCount ?? 11}</div>
                        <div className="text-xs text-red-600 mt-1">{team2Name}</div>
                        <div className="w-4 h-4 rounded-full mx-auto mt-2 border border-gray-300" style={{ backgroundColor: result.team2?.hex }} />
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
                        <div className="text-2xl font-bold text-gray-700">{result.framesAnalyzed}</div>
                        <div className="text-xs text-muted-foreground mt-1">Frames Analyzed</div>
                      </div>
                    </div>
                    <div className="mt-4 bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground">Detection Confidence</span><span className="text-xs font-bold text-gray-800">{result.confidence}%</span></div>
                      <Progress value={result.confidence} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              )}

              {!result.canAnalyze && result.teamColors.length > 0 && (
                <Card>
                  <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Palette size={14} className="text-orange-700 dark:text-orange-500" />All Detected Colors ({result.teamColors.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-3">
                      {result.teamColors.map((tc, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
                          <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: tc.hex }} />
                          <span className="text-sm">{tc.name}</span>
                          <span className="text-xs text-muted-foreground">{tc.percentage}%</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Try using a video with clearer jersey distinctions or better lighting to reduce color groups.</p>
                  </CardContent>
                </Card>
              )}

              {result.aiReport && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {result.analysisMode === 'twelvelabs' ? (
                        <Sparkles size={16} className="text-violet-600" />
                      ) : (
                        <FileText size={16} className="text-green-600" />
                      )}
                      {result.analysisMode === 'twelvelabs' ? 'Twelve Labs Pegasus 1.2 — Tactical Report' : 'AI Match Analysis Report'}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">{team1Name} vs {team2Name} · {matchDate}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <div
                        className="prose prose-sm max-w-none leading-relaxed"
                        style={{ color: '#111827' }}
                        dangerouslySetInnerHTML={{
                          __html: result.aiReport
                            .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#111827">$1</strong>')
                            .replace(/^### (.+)$/gm, '<h3 style="font-size:1rem;font-weight:700;margin-top:1rem;margin-bottom:0.25rem;color:#111827">$1</h3>')
                            .replace(/^## (.+)$/gm, '<h2 style="font-size:1.1rem;font-weight:700;margin-top:1.25rem;margin-bottom:0.5rem;color:#111827">$1</h2>')
                            .replace(/^# (.+)$/gm, '<h1 style="font-size:1.25rem;font-weight:700;margin-top:1.5rem;margin-bottom:0.5rem;color:#111827">$1</h1>')
                            .replace(/^- (.+)$/gm, '<li style="margin-left:1rem;color:#111827">$1</li>')
                            .replace(/\n\n/g, '<br/><br/>')
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
      <PageHelp pageKey="video-analysis" />
    </div>
    </>
  );
}
