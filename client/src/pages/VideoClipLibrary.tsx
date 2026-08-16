import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Film, Search, Plus, Play, Grid3x3, List, Filter, X, Upload, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { useLanguage } from '@/contexts/LanguageContext';

export default function VideoClipLibrary() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedClip, setSelectedClip] = useState<any | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);

  // Fetch real clips from database
  const { data: clipsData = [], isLoading } = trpc.videoClips.list.useQuery({ limit: 100 });

  const handleClipClick = (clip: any) => {
    setSelectedClip(clip);
    setShowPlayer(true);
  };

  // Transform database clips to match component format
  const clips = clipsData.map((clip: any) => ({
    id: clip.id,
    title: clip.title,
    duration: clip.duration ? `${Math.floor(clip.duration / 60)}:${(clip.duration % 60).toString().padStart(2, '0')}` : '0:00',
    tags: [] as string[], // Tags will be fetched separately if needed
    videoUrl: clip.videoUrl,
    thumbnail: clip.thumbnailUrl,
    date: new Date(clip.createdAt).toISOString().split('T')[0],
    description: clip.description,
  }));

  const allTags = [
    { name: "goal", label: "Goals", count: 15 },
    { name: "assist", label: "Assists", count: 8 },
    { name: "key_pass", label: "Key Passes", count: 23 },
    { name: "tackle", label: "Tackles", count: 18 },
    { name: "defensive_action", label: "Defensive Actions", count: 31 },
    { name: "save", label: "Saves", count: 12 },
    { name: "passing", label: "Passing", count: 45 },
    { name: "tactical", label: "Tactical", count: 27 },
    { name: "counter_attack", label: "Counter Attacks", count: 9 },
    { name: "goalkeeper", label: "Goalkeeper", count: 14 },
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredClips = clips.filter(clip => {
    const matchesSearch = clip.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => clip.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  return (
    <>
    <div className="space-y-6">
      {/* Back Arrow */}
      <button onClick={() => navigate('/video-analysis')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium">
        <ArrowLeft className="h-4 w-4" /> Back to Video Analysis
      </button>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Video Clip Library</h1>
          <p className="text-muted-foreground mt-1">
            Tagged highlights and key moments from matches and training
          </p>
        </div>
        {user && ['admin', 'coach'].includes(user.role) && (
          <Link href="/create-video-clip">
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tag Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-base">Filter by Tags</CardTitle>
          </div>
          <CardDescription>Click tags to filter clips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <Badge
                key={tag.name}
                variant={selectedTags.includes(tag.name) ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/90 transition-colors"
                onClick={() => toggleTag(tag.name)}
              >
                {tag.label} ({tag.count})
              </Badge>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTags([])}
              className="mt-3"
            >
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Clips Grid/List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-muted-foreground">Loading clips...</p>
          </div>
        ) : clips.length === 0 ? (
          <Card className="p-12 text-center">
            <Film className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No video clips yet</h3>
            <p className="text-muted-foreground mb-4">
              Upload videos and create clips to build your library
            </p>
            {user && ['admin', 'coach'].includes(user.role) && (
              <Link href="/create-video-clip">
                <Button>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload First Video
                </Button>
              </Link>
            )}
          </Card>
        ) : filteredClips.length === 0 ? (
          <Card className="p-12 text-center">
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No clips match your filters</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </Card>
        ) : (
        <>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {filteredClips.length} Clips
            {selectedTags.length > 0 && ` (filtered)`}
          </h2>
        </div>

        {viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClips.map((clip) => (
              <Card key={clip.id} className="card-hover cursor-pointer group" onClick={() => handleClipClick(clip)}>
                <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                      <Play className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-background/90 px-2 py-1 rounded text-xs font-medium">
                    {clip.duration}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-1">{clip.title}</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {clip.tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag.replace("_", " ")}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{clip.date}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredClips.map((clip) => (
              <Card key={clip.id} className="card-hover cursor-pointer" onClick={() => handleClipClick(clip)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-32 h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                    <Play className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold mb-1">{clip.title}</h3>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {clip.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">{clip.date}</p>
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {clip.duration}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Film className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">How to Create Clips</h4>
              <p className="text-sm text-muted-foreground">
                Go to <strong>Video Analysis</strong>, upload a video, then use the timeline to select start/end times and add tags. 
                Clips are automatically saved here for easy access and organization.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Video Player Modal */}
      <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedClip?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              {selectedClip?.videoUrl ? (
                <video
                  src={selectedClip.videoUrl}
                  controls
                  autoPlay
                  className="w-full h-full rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <Film className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Video not available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    This is a placeholder clip. Upload a video to see it here.
                  </p>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedClip?.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag.replace("_", " ")}
                </Badge>
              ))}
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Duration: {selectedClip?.duration}</span>
              <span>{selectedClip?.date}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
