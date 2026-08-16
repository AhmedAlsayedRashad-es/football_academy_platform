import { useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Video, Plus, Tag, Play, Clock, User, Star, Trash2, Share2, Zap, Shield, Target, Flag, AlertTriangle, X, Send, ExternalLink, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

const TAG_TYPES = [
  { value: "goal", label: "Goal", color: "bg-green-500/10 text-green-700" },
  { value: "assist", label: "Assist", color: "bg-blue-500/10 text-blue-700" },
  { value: "shot", label: "Shot", color: "bg-orange-500/10 text-orange-700" },
  { value: "pass", label: "Pass", color: "bg-purple-500/10 text-purple-700" },
  { value: "dribble", label: "Dribble", color: "bg-yellow-500/10 text-yellow-700" },
  { value: "tackle", label: "Tackle", color: "bg-red-500/10 text-red-700" },
  { value: "interception", label: "Interception", color: "bg-teal-500/10 text-teal-700" },
  { value: "save", label: "Save", color: "bg-cyan-500/10 text-cyan-700" },
  { value: "error", label: "Error", color: "bg-red-700/10 text-red-800" },
  { value: "highlight", label: "Highlight", color: "bg-amber-500/10 text-amber-700" },
  { value: "custom", label: "Custom", color: "bg-gray-500/10 text-gray-700" },
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m + ":" + s.toString().padStart(2, "0");
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  // Handle youtube.com/watch?v=ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
  if (watchMatch) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?enablejsapi=1&rel=0&modestbranding=1`;
  }
  // Handle youtube.com/embed/ID
  if (url.includes('youtube.com/embed/')) return url;
  return null;
}

function VideoPlayer({ url }: { url: string }) {
  const { t, language } = useLanguage();
  const [embedError, setEmbedError] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(url);

  if (!embedUrl) {
    // Direct video file or unsupported URL
    return (
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <video
          src={url}
          controls
          className="absolute inset-0 w-full h-full rounded-lg bg-black"
          onError={() => setEmbedError(true)}
        />
        {embedError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-card rounded-lg">
            <AlertTriangle className="w-8 h-8 text-yellow-700 dark:text-yellow-500 mb-2" />
            <p className="text-foreground text-sm">Unable to load video</p>
            <a href={url} target="_blank" rel="noopener noreferrer" className="mt-2 text-blue-600 dark:text-blue-400 text-xs underline">Open in new tab</a>
          </div>
        )}
      </div>
    );
  }

  if (embedError) {
    return (
      <div className="relative w-full bg-card rounded-lg" style={{ paddingBottom: '56.25%' }}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <Youtube className="w-12 h-12 text-red-500 mb-3" />
          <h3 className="text-foreground font-semibold mb-1">Video Cannot Be Embedded</h3>
          <p className="text-muted-foreground text-sm mb-4">
            This video has embedding disabled by the uploader (Error 153).
            You can still watch it directly on YouTube.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Watch on YouTube
          </a>
          <p className="text-muted-foreground text-xs mt-3">
            Tip: Use videos with embedding enabled, or upload directly to the platform.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full rounded-lg"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Match Video"
        onError={() => setEmbedError(true)}
      />
    </div>
  );
}

export default function MatchVideoTagger() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const [showAddClip, setShowAddClip] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [clipTitle, setClipTitle] = useState("");
  const [clipUrl, setClipUrl] = useState("");
  const [clipDescription, setClipDescription] = useState("");
  const [tagType, setTagType] = useState("highlight");
  const [tagTimestamp, setTagTimestamp] = useState("");
  const [tagDescription, setTagDescription] = useState("");
  const [tagPlayerId, setTagPlayerId] = useState("");
  const [tagRating, setTagRating] = useState("");

  const { data: clips, refetch: refetchClips } = trpc.videoClips.list.useQuery({});
  const { data: tags, refetch: refetchTags } = trpc.videoTags.getByClip.useQuery(
    { clipId: selectedClipId! },
    { enabled: !!selectedClipId }
  );
  const { data: players } = trpc.players.getAll.useQuery();

  const createClip = trpc.videoClips.create.useMutation({
    onSuccess: () => {
      refetchClips();
      setShowAddClip(false);
      setClipTitle(""); setClipUrl(""); setClipDescription("");
      toast({ title: "Video clip added successfully" });
    },
  });

  const createTag = trpc.videoTags.create.useMutation({
    onSuccess: () => {
      refetchTags();
      setShowAddTag(false);
      setTagType("highlight"); setTagTimestamp(""); setTagDescription(""); setTagPlayerId(""); setTagRating("");
      toast({ title: "Tag added successfully" });
    },
  });

  const deleteTag = trpc.videoTags.delete.useMutation({
    onSuccess: () => { refetchTags(); toast({ title: "Tag deleted" }); },
  });

  const selectedClip = clips?.find((c: any) => c.id === selectedClipId);

  const getTagColor = (type: string) => {
    return TAG_TYPES.find(t => t.value === type)?.color || "bg-gray-500/10 text-gray-700";
  };

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <BackButton />
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Video className="w-6 h-6 text-primary" />
              Match Video Tagger
            </h1>
            <p className="text-muted-foreground">Tag key moments in match videos and link them to players</p>
          </div>
          <Dialog open={showAddClip} onOpenChange={setShowAddClip}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />Add Video Clip</Button>
            </DialogTrigger>
            <DialogContent className="bg-card text-foreground border-border">
              <DialogHeader><DialogTitle>Add Match Video Clip</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input value={clipTitle} onChange={e => setClipTitle(e.target.value)}
                    placeholder="e.g. Future Stars FC vs Zamalek - First Half"
                    className="bg-muted border-border text-foreground mt-1" />
                </div>
                <div>
                  <Label>Video URL (YouTube or direct link)</Label>
                  <Input value={clipUrl} onChange={e => setClipUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="bg-muted border-border text-foreground mt-1" />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea value={clipDescription} onChange={e => setClipDescription(e.target.value)}
                    placeholder="Match context, opponent, date..."
                    className="bg-muted border-border text-foreground mt-1" rows={2} />
                </div>
                <Button onClick={() => createClip.mutate({ title: clipTitle, videoUrl: clipUrl, description: clipDescription, duration: 0 })}
                  disabled={!clipTitle || !clipUrl || createClip.isPending} className="w-full">
                  {createClip.isPending ? "Adding..." : "Add Clip"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Video Clips</h2>
            {!clips || clips.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  <Video className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No video clips yet. Add your first match video.</p>
                </CardContent>
              </Card>
            ) : clips.map((clip: any) => (
              <Card key={clip.id}
                className={"cursor-pointer transition-colors " + (selectedClipId === clip.id ? "border-primary bg-primary/5" : "hover:bg-muted/30")}
                onClick={() => setSelectedClipId(clip.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Play className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{clip.title}</div>
                      {clip.description && <div className="text-xs text-muted-foreground mt-0.5 truncate">{clip.description}</div>}
                      <div className="text-xs text-muted-foreground mt-1">{new Date(clip.createdAt).toLocaleDateString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {!selectedClip ? (
              <Card>
                <CardContent className="p-12 text-center text-muted-foreground">
                  <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Select a video clip to view and add tags</p>
                  <p className="text-sm mt-1">Tags let you mark key moments and link them to players</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Play className="w-4 h-4" />{selectedClip.title}
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={selectedClip.videoUrl} target="_blank" rel="noopener noreferrer" className="gap-1">
                            <ExternalLink className="w-3 h-3" />Open in YouTube
                          </a>
                        </Button>
                        <Dialog open={showAddTag} onOpenChange={setShowAddTag}>
                          <DialogTrigger asChild>
                            <Button size="sm" className="gap-1"><Tag className="w-3 h-3" />Add Tag</Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card text-foreground border-border">
                            <DialogHeader><DialogTitle>Tag a Moment</DialogTitle></DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>Tag Type</Label>
                                  <Select value={tagType} onValueChange={setTagType}>
                                    <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-muted border-border">
                                      {TAG_TYPES.map(t => (
                                        <SelectItem key={t.value} value={t.value} className="text-foreground">{t.label}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Timestamp (seconds)</Label>
                                  <Input value={tagTimestamp} onChange={e => setTagTimestamp(e.target.value)}
                                    type="number" placeholder="e.g. 1385 = 23:05"
                                    className="bg-muted border-border text-foreground mt-1" />
                                </div>
                              </div>
                              <div>
                                <Label>Player (optional)</Label>
                                <Select value={tagPlayerId} onValueChange={setTagPlayerId}>
                                  <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                                    <SelectValue placeholder="Select player..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-muted border-border">
                                    {players?.map((p: any) => (
                                      <SelectItem key={p.id} value={p.id.toString()} className="text-foreground">
                                        {p.firstName} {p.lastName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Rating (1-5, optional)</Label>
                                <Select value={tagRating} onValueChange={setTagRating}>
                                  <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                                    <SelectValue placeholder="Rate this moment..." />
                                  </SelectTrigger>
                                  <SelectContent className="bg-muted border-border">
                                    {[1,2,3,4,5].map(n => (
                                      <SelectItem key={n} value={n.toString()} className="text-foreground">{"★".repeat(n)} {n}/5</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label>Description</Label>
                                <Textarea value={tagDescription} onChange={e => setTagDescription(e.target.value)}
                                  placeholder="Describe what happened at this moment..."
                                  className="bg-muted border-border text-foreground mt-1" rows={2} />
                              </div>
                              <Button onClick={() => createTag.mutate({
                                clipId: selectedClipId!,
                                tagType: tagType as any,
                                timestamp: parseInt(tagTimestamp) || 0,
                                playerId: tagPlayerId ? parseInt(tagPlayerId) : undefined,
                                rating: tagRating ? parseInt(tagRating) : undefined,
                                description: tagDescription || undefined,
                              })} disabled={!tagTimestamp || createTag.isPending} className="w-full">
                                {createTag.isPending ? "Saving..." : "Save Tag"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <VideoPlayer url={selectedClip.videoUrl} />
                    {selectedClip.description && (
                      <p className="text-sm text-muted-foreground mt-3">{selectedClip.description}</p>
                    )}
                    <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        <strong>Note:</strong> If you see Error 153, the video owner has disabled embedding. Use the "Open in YouTube" button above, or add videos from channels that allow embedding.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Tagged Moments ({tags?.length || 0})</h3>
                  {!tags || tags.length === 0 ? (
                    <Card>
                      <CardContent className="p-6 text-center text-muted-foreground">
                        <Tag className="w-6 h-6 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">No tags yet. Click "Add Tag" to mark key moments.</p>
                      </CardContent>
                    </Card>
                  ) : [...tags].sort((a: any, b: any) => a.timestamp - b.timestamp).map((tag: any) => {
                    const player = players?.find((p: any) => p.id === tag.playerId);
                    return (
                      <Card key={tag.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-sm font-mono font-medium">{formatTime(tag.timestamp)}</span>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="outline" className={"text-xs " + getTagColor(tag.tagType)}>
                                    {TAG_TYPES.find(t => t.value === tag.tagType)?.label || tag.tagType}
                                  </Badge>
                                  {player && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <User className="w-3 h-3" />{player.firstName} {player.lastName}
                                    </span>
                                  )}
                                  {tag.rating && (
                                    <span className="text-xs text-amber-700 dark:text-amber-500 flex items-center gap-0.5">
                                      <Star className="w-3 h-3 fill-current" />{tag.rating}/5
                                    </span>
                                  )}
                                </div>
                                {tag.description && <p className="text-sm text-muted-foreground mt-1">{tag.description}</p>}
                              </div>
                            </div>
                            <button onClick={() => deleteTag.mutate({ id: tag.id })}
                              className="p-1.5 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-500 rounded transition-colors shrink-0">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
