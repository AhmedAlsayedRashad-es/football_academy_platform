import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { 
  Plus, 
  Video, 
  Play,
  User,
  Calendar,
  Film,
  Brain,
  Loader2,
  X,
  ChevronRight,
  Shield,
  TrendingUp,
  AlertTriangle,
  Target, ArrowLeft, Tag, Check} from 'lucide-react';
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

// Extract YouTube video ID from URL
function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Get YouTube thumbnail URL
function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

// Get YouTube embed URL
function getYouTubeEmbed(url: string): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?autoplay=1`;
}

interface VideoPlayerModalProps {
  video: any;
  onClose: () => void;
}

function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  const embedUrl = getYouTubeEmbed(video.videoUrl);
  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-foreground text-xl font-bold">{video.title}</h2>
          <Button variant="ghost" size="icon" className="text-foreground hover:bg-white/20" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        {embedUrl ? (
          <div className="aspect-video w-full rounded-lg overflow-hidden">
            <iframe
              src={embedUrl}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          </div>
        ) : (
          <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
            <video
              src={video.videoUrl}
              controls
              autoPlay
              className="w-full h-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}

interface AIAnalysisResult {
  formation: string;
  tacticalPatterns: string;
  playerMovements: string;
  passingPatterns: string;
  keyMoments: string;
  recommendations: string;
  fullAnalysis: string;
}

interface AIAnalysisModalProps {
  video: any;
  onClose: () => void;
}

function AIAnalysisModal({ video, onClose }: AIAnalysisModalProps) {
  const { t, language } = useLanguage();
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeMutation = trpc.videoAnalysis.analyze.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setIsAnalyzing(false);
    },
    onError: (error) => {
      toast.error("Analysis failed: " + error.message);
      setIsAnalyzing(false);
    },
  });

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    analyzeMutation.mutate({
      videoUrl: video.videoUrl,
      description: `Video title: ${video.title}. Type: ${video.videoType}.`,
    });
  };

  // Parse strengths and weaknesses from recommendations
  const parseStrengths = (text: string): string[] => {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.filter(l => 
      l.toLowerCase().includes('strength') || 
      l.toLowerCase().includes('good') || 
      l.toLowerCase().includes('effective') ||
      l.toLowerCase().includes('well')
    ).slice(0, 4);
  };

  const parseWeaknesses = (text: string): string[] => {
    const lines = text.split('\n').filter(l => l.trim());
    return lines.filter(l => 
      l.toLowerCase().includes('weakness') || 
      l.toLowerCase().includes('improve') || 
      l.toLowerCase().includes('lack') ||
      l.toLowerCase().includes('vulnerability')
    ).slice(0, 4);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Tactical Analysis
          </DialogTitle>
          <DialogDescription>{video.title}</DialogDescription>
        </DialogHeader>

        {!result && !isAnalyzing && (
          <div className="py-8 text-center space-y-4">
            <Brain className="h-16 w-16 mx-auto text-purple-600 dark:text-purple-400" />
            <div>
              <h3 className="text-lg font-semibold">Analyze with AI</h3>
              <p className="text-muted-foreground text-sm mt-1">
                Our AI coach will analyze this video for team tactics, formation, strengths, and weaknesses.
              </p>
            </div>
            <Button onClick={handleAnalyze} className="bg-purple-600 hover:bg-purple-700">
              <Brain className="h-4 w-4 mr-2" />
              Start AI Analysis
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="py-12 text-center space-y-4">
            <Loader2 className="h-12 w-12 mx-auto text-purple-500 animate-spin" />
            <p className="text-muted-foreground">AI is analyzing the video tactics and team performance...</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Formation */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold text-blue-700 dark:text-blue-400">Formation Detected</h4>
                </div>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">{result.formation}</p>
              </CardContent>
            </Card>

            {/* Tactical Patterns */}
            {result.tacticalPatterns && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-emerald-600" />
                    <h4 className="font-semibold">Tactical Patterns</h4>
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{result.tacticalPatterns}</p>
                </CardContent>
              </Card>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <h4 className="font-semibold text-green-700 dark:text-green-400 text-sm">Strengths</h4>
                  </div>
                  <ul className="space-y-1">
                    {(parseStrengths(result.recommendations + ' ' + result.tacticalPatterns).length > 0
                      ? parseStrengths(result.recommendations + ' ' + result.tacticalPatterns)
                      : result.recommendations.split('\n').slice(0, 3)
                    ).map((item, i) => (
                      <li key={i} className="text-xs text-green-800 dark:text-green-300 flex items-start gap-1">
                        <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {item.replace(/^[-•*]\s*/, '')}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <h4 className="font-semibold text-red-700 dark:text-red-400 text-sm">Areas to Improve</h4>
                  </div>
                  <ul className="space-y-1">
                    {(parseWeaknesses(result.recommendations + ' ' + result.tacticalPatterns).length > 0
                      ? parseWeaknesses(result.recommendations + ' ' + result.tacticalPatterns)
                      : result.recommendations.split('\n').slice(3, 6)
                    ).map((item, i) => (
                      <li key={i} className="text-xs text-red-800 dark:text-red-300 flex items-start gap-1">
                        <ChevronRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {item.replace(/^[-•*]\s*/, '')}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Key Moments */}
            {result.keyMoments && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2 text-sm">Key Tactical Moments</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{result.keyMoments}</p>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {result.recommendations && (
              <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/30 dark:border-purple-800">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-purple-700 dark:text-purple-400 mb-2 text-sm">Coach Recommendations</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{result.recommendations}</p>
                </CardContent>
              </Card>
            )}

            <Button variant="outline" onClick={() => setResult(null)} className="w-full">
              Re-analyze
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Videos() {
  const [, navigate] = useLocation();
  // Bulk media tagging state
  const [taggingVideoId, setTaggingVideoId] = useState<number | null>(null);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [tagSuccess, setTagSuccess] = useState<number | null>(null);
  const { data: allPlayers } = trpc.players.getAll.useQuery();
  const tagInMedia = trpc.mediaTagging.tagInMedia.useMutation({
    onSuccess: () => {
      setTagSuccess(taggingVideoId);
      setTaggingVideoId(null);
      setSelectedPlayerIds([]);
      setTimeout(() => setTagSuccess(null), 3000);
    }
  });
  const playerOptions = (allPlayers || []).map((p: any) => ({
    value: String(p.id),
    label: p.firstName + ' ' + p.lastName,
  }));
  const handleTagPlayers = async (videoId: number) => {
    if (!selectedPlayerIds.length) return;
    for (const pid of selectedPlayerIds) {
      await tagInMedia.mutateAsync({ mediaId: videoId, taggedPlayerId: parseInt(pid, 10) });
    }
  };
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [analyzingVideo, setAnalyzingVideo] = useState<any>(null);

  const { data: videos, isLoading, refetch } = trpc.videos.getAll.useQuery();
  const { data: players } = trpc.players.getAll.useQuery();
  const { data: matches } = trpc.matches.getAll.useQuery();

  const createVideo = trpc.videos.create.useMutation({
    onSuccess: () => {
      toast.success("Video added successfully!");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [formData, setFormData] = useState({
    title: "",
    videoUrl: "",
    thumbnailUrl: "",
    playerId: "",
    matchId: "",
    videoType: "training_clip" as const,
    duration: 0,
    tags: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVideo.mutate({
      ...formData,
      playerId: formData.playerId ? parseInt(formData.playerId) : undefined,
      matchId: formData.matchId ? parseInt(formData.matchId) : undefined,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : undefined,
    });
  };

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const getVideoTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      match_highlight: "bg-amber-500",
      training_clip: "bg-blue-500",
      skill_demo: "bg-purple-500",
      analysis: "bg-emerald-500",
      full_match: "bg-red-500",
    };
    return <Badge className={`${colors[type] || "bg-gray-500"} text-white`}>{type.replace(/_/g, ' ')}</Badge>;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getThumbnail = (video: any) => {
    if (video.thumbnailUrl) return video.thumbnailUrl;
    const ytThumb = getYouTubeThumbnail(video.videoUrl);
    if (ytThumb) return ytThumb;
    return null;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            
            <BackButton />
<h1 className="text-3xl font-bold">Video Analysis</h1>
            <p className="text-muted-foreground">Match highlights and training clips</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Video
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Add New Video</DialogTitle>
                <DialogDescription>Add a YouTube link or direct video URL</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Video title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Video URL (YouTube or direct link)</Label>
                  <Input
                    value={formData.videoUrl}
                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                    placeholder="https://youtube.com/watch?v=... or https://..."
                    required
                  />
                  <p className="text-xs text-muted-foreground">YouTube links will automatically show thumbnails and play in an embedded player.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Video Type</Label>
                    <Select
                      value={formData.videoType}
                      onValueChange={(value: any) => setFormData({ ...formData, videoType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="training_clip">Training Clip</SelectItem>
                        <SelectItem value="match_highlight">Match Highlight</SelectItem>
                        <SelectItem value="skill_demo">Skill Demo</SelectItem>
                        <SelectItem value="analysis">Analysis</SelectItem>
                        <SelectItem value="full_match">Full Match</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Player (optional)</Label>
                    <Select
                      value={formData.playerId}
                      onValueChange={(value) => setFormData({ ...formData, playerId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players?.map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.firstName} {player.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Match (optional)</Label>
                    <Select
                      value={formData.matchId}
                      onValueChange={(value) => setFormData({ ...formData, matchId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select match" />
                      </SelectTrigger>
                      <SelectContent>
                        {matches?.map((match) => (
                          <SelectItem key={match.id} value={match.id.toString()}>
                            vs {match.opponent} ({new Date(match.matchDate).toLocaleDateString()})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags (comma-separated)</Label>
                  <Input
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="dribbling, goal, assist"
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createVideo.isPending}>
                    {createVideo.isPending ? "Adding..." : "Add Video"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Video Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => {
              const thumbnail = getThumbnail(video);
              const isYouTube = !!getYouTubeId(video.videoUrl);
              return (
                <Card key={video.id} className="overflow-hidden group hover:ring-2 hover:ring-primary/50 transition-all">
                  {/* Thumbnail - clickable to play */}
                  <div 
                    className="relative aspect-video bg-muted cursor-pointer"
                    onClick={() => setSelectedVideo(video)}
                  >
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Film className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="h-7 w-7 text-gray-900 ml-1" />
                      </div>
                    </div>
                    {/* YouTube badge */}
                    {isYouTube && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded font-medium">
                        YouTube
                      </div>
                    )}
                    {/* Duration badge */}
                    {(video.duration ?? 0) > 0 && (
                      <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                        {formatDuration(video.duration ?? 0)}
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold line-clamp-2 flex-1">{video.title}</h3>
                      {getVideoTypeBadge(video.videoType)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      {video.playerId && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>Player #{video.playerId}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(video.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {video.tags && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {(() => {
                          try {
                            return JSON.parse(video.tags).slice(0, 3).map((tag: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                            ));
                          } catch {
                            return null;
                          }
                        })()}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => setSelectedVideo(video)}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Play
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="flex-1 text-purple-600 border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                        onClick={() => setAnalyzingVideo(video)}
                      >
                        <Brain className="h-3 w-3 mr-1" />
                        AI Analysis
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-950/30"
                        onClick={() => { setTaggingVideoId(video.id); setSelectedPlayerIds([]); }}
                      >
                        <Tag className="h-3 w-3" />
                      </Button>
                    </div>
                    {taggingVideoId === video.id && (
                      <div className="mt-3 p-3 bg-muted rounded-lg border border-green-400">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-green-600 font-semibold">Tag Players in this Video</span>
                          <button onClick={() => setTaggingVideoId(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        <select
                          multiple
                          className="w-full bg-background text-foreground text-xs rounded p-2 border mb-2"
                          style={{ height: 80 }}
                          onChange={(e) => setSelectedPlayerIds(Array.from(e.target.selectedOptions, (o: any) => o.value))}
                        >
                          {playerOptions.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                        <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-xs"
                          onClick={() => handleTagPlayers(video.id)}
                          disabled={!selectedPlayerIds.length || tagInMedia.isPending}
                        >
                          <Check className="w-3 h-3 mr-1" />
                          {tagInMedia.isPending ? 'Tagging...' : 'Tag ' + selectedPlayerIds.length + ' Player(s)'}
                        </Button>
                        <p className="text-xs text-muted-foreground mt-1">Hold Ctrl/Cmd to select multiple</p>
                      </div>
                    )}
                    {tagSuccess === video.id && (
                      <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Players tagged successfully!
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Videos Yet</h3>
              <p className="text-muted-foreground mb-4">Start adding training clips and match highlights</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Video
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />
      )}

      {/* AI Analysis Modal */}
      {analyzingVideo && (
        <AIAnalysisModal video={analyzingVideo} onClose={() => setAnalyzingVideo(null)} />
      )}
    </>
  );
}
