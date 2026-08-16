import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Play, Pause, SkipBack, SkipForward, Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface VideoEvent {
  id: number;
  timestamp: number;
  duration: number;
  eventType: string;
  title?: string;
  description?: string;
  playerId?: number;
}

interface VideoTimelineProps {
  videoId: number;
  videoUrl: string;
  canEdit?: boolean;
}

const eventTypeColors: Record<string, string> = {
  goal: "bg-green-500",
  assist: "bg-blue-500",
  key_pass: "bg-cyan-500",
  tackle: "bg-orange-500",
  interception: "bg-purple-500",
  save: "bg-yellow-500",
  shot: "bg-red-500",
  dribble: "bg-pink-500",
  pass: "bg-gray-500",
  cross: "bg-indigo-500",
  foul: "bg-red-700",
  card_yellow: "bg-yellow-600",
  card_red: "bg-red-800",
  substitution: "bg-teal-500",
  corner: "bg-lime-500",
  freekick: "bg-amber-500",
  other: "bg-gray-400",
};

const eventTypeLabels: Record<string, string> = {
  goal: "Goal",
  assist: "Assist",
  key_pass: "Key Pass",
  tackle: "Tackle",
  interception: "Interception",
  save: "Save",
  shot: "Shot",
  dribble: "Dribble",
  pass: "Pass",
  cross: "Cross",
  foul: "Foul",
  card_yellow: "Yellow Card",
  card_red: "Red Card",
  substitution: "Substitution",
  corner: "Corner",
  freekick: "Free Kick",
  other: "Other",
};

export function VideoTimeline({ videoId, videoUrl, canEdit = false }: VideoTimelineProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [tagFormData, setTagFormData] = useState({
    eventType: "goal",
    title: "",
    description: "",
    playerId: "none",
  });

  const { data: events = [], refetch: refetchEvents } = trpc.videoEvents.getByVideo.useQuery({ videoId });
  const { data: players = [] } = trpc.players.getAll.useQuery();
  const utils = trpc.useUtils();

  const createEvent = trpc.videoEvents.create.useMutation({
    onSuccess: () => {
      toast.success("Event tagged successfully");
      setShowTagDialog(false);
      refetchEvents();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to tag event");
    },
  });

  const deleteEvent = trpc.videoEvents.delete.useMutation({
    onSuccess: () => {
      toast.success("Event deleted");
      refetchEvents();
    },
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, []);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const seekTo = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const handleTagEvent = () => {
    createEvent.mutate({
      videoId,
      timestamp: Math.floor(currentTime),
      eventType: tagFormData.eventType as any,
      title: tagFormData.title || undefined,
      description: tagFormData.description || undefined,
      playerId: tagFormData.playerId && tagFormData.playerId !== 'none' ? parseInt(tagFormData.playerId) : undefined,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getEventPosition = (timestamp: number) => {
    return duration > 0 ? (timestamp / duration) * 100 : 0;
  };

  return (
    <div className="space-y-4">
      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full aspect-video"
          onClick={togglePlayPause}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={() => skip(-10)}>
          <SkipBack className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={togglePlayPause}>
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button size="sm" variant="outline" onClick={() => skip(10)}>
          <SkipForward className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground mx-2">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        {canEdit && (
          <Button size="sm" variant="default" onClick={() => setShowTagDialog(true)} className="ml-auto">
            <Plus className="h-4 w-4 mr-1" />
            Tag Event
          </Button>
        )}
      </div>

      {/* Timeline with Event Markers */}
      <div className="relative">
        <div className="h-2 bg-muted rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percentage = x / rect.width;
          seekTo(percentage * duration);
        }}>
          <div
            className="h-full bg-primary"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        {/* Event Markers */}
        <div className="absolute inset-0 pointer-events-none">
          {events.map((event) => (
            <div
              key={event.id}
              className={`absolute top-0 w-1 h-2 ${eventTypeColors[event.eventType]} cursor-pointer pointer-events-auto`}
              style={{ left: `${getEventPosition(event.timestamp)}%` }}
              onClick={() => seekTo(event.timestamp)}
              title={`${eventTypeLabels[event.eventType]} - ${formatTime(event.timestamp)}`}
            />
          ))}
        </div>
      </div>

      {/* Event List */}
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">Tagged Events ({events.length})</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {events.map((event) => (
            <div key={event.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
              <Badge className={eventTypeColors[event.eventType]}>
                {eventTypeLabels[event.eventType]}
              </Badge>
              <button
                onClick={() => seekTo(event.timestamp)}
                className="text-sm hover:underline"
              >
                {formatTime(event.timestamp)}
              </button>
              {event.title && <span className="text-sm text-muted-foreground">{event.title}</span>}
              {canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteEvent.mutate({ id: event.id })}
                  className="ml-auto"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tag Event Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag Event at {formatTime(currentTime)}</DialogTitle>
            <DialogDescription>
              Add a marker to identify key moments in the video
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Event Type</Label>
              <Select
                value={tagFormData.eventType}
                onValueChange={(value) => setTagFormData({ ...tagFormData, eventType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(eventTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Player (Optional)</Label>
              <Select
                value={tagFormData.playerId}
                onValueChange={(value) => setTagFormData({ ...tagFormData, playerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select player" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {players.map((player: any) => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      {player.firstName} {player.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Title (Optional)</Label>
              <Input
                value={tagFormData.title}
                onChange={(e) => setTagFormData({ ...tagFormData, title: e.target.value })}
                placeholder="e.g., Great finish"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={tagFormData.description}
                onChange={(e) => setTagFormData({ ...tagFormData, description: e.target.value })}
                placeholder="Additional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTagEvent}>
              Tag Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
