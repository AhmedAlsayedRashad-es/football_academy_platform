import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Maximize,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Circle,
  ArrowRight,
  Minus,
  Undo,
  Redo,
  Download,
  Trash2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DrawingPoint {
  x: number;
  y: number;
  color: string;
  tool: 'line' | 'arrow' | 'circle' | 'free';
}

interface Drawing {
  points: DrawingPoint[];
  tool: 'line' | 'arrow' | 'circle' | 'free';
  color: string;
}

interface AdvancedVideoPlayerProps {
  videoUrl: string;
  onTimeUpdate?: (currentTime: number) => void;
}

export default function AdvancedVideoPlayer({ videoUrl, onTimeUpdate }: AdvancedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Drawing state
  const [drawingMode, setDrawingMode] = useState(false);
  const [currentTool, setCurrentTool] = useState<'line' | 'arrow' | 'circle' | 'free'>('arrow');
  const [currentColor, setCurrentColor] = useState('#FF0000');
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [undoStack, setUndoStack] = useState<Drawing[][]>([]);

  // Video controls
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      onTimeUpdate?.(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    if (videoRef.current) {
      const newVolume = value[0];
      videoRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changePlaybackRate = (rate: string) => {
    const newRate = parseFloat(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = newRate;
      setPlaybackRate(newRate);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds));
    }
  };

  const frameStep = (forward: boolean) => {
    if (videoRef.current) {
      // Approximate frame duration (assuming 30fps)
      const frameDuration = 1 / 30;
      videoRef.current.currentTime += forward ? frameDuration : -frameDuration;
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Drawing functions
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingMode) return;
    setIsDrawing(true);
    const coords = getCanvasCoordinates(e);
    setCurrentDrawing([{ ...coords, color: currentColor, tool: currentTool }]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingMode) return;
    const coords = getCanvasCoordinates(e);
    setCurrentDrawing(prev => [...prev, { ...coords, color: currentColor, tool: currentTool }]);
  };

  const endDrawing = () => {
    if (!isDrawing || currentDrawing.length === 0) return;
    
    setUndoStack(prev => [...prev, drawings]);
    setDrawings(prev => [...prev, { points: currentDrawing, tool: currentTool, color: currentColor }]);
    setCurrentDrawing([]);
    setIsDrawing(false);
  };

  const undo = () => {
    if (drawings.length === 0) return;
    setUndoStack(prev => [...prev, drawings]);
    setDrawings(prev => prev.slice(0, -1));
  };

  const clearDrawings = () => {
    setUndoStack(prev => [...prev, drawings]);
    setDrawings([]);
  };

  const downloadFrame = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    // Create a temporary canvas to combine video and drawings
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = video.videoWidth;
    tempCanvas.height = video.videoHeight;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0);
    
    // Draw annotations
    drawings.forEach(drawing => {
      renderDrawing(ctx, drawing, tempCanvas.width, tempCanvas.height);
    });

    // Download
    const link = document.createElement('a');
    link.download = `frame-${Math.floor(currentTime)}.png`;
    link.href = tempCanvas.toDataURL();
    link.click();
  };

  const renderDrawing = (ctx: CanvasRenderingContext2D, drawing: Drawing, width: number, height: number) => {
    const points = drawing.points;
    if (points.length === 0) return;

    ctx.strokeStyle = drawing.color;
    ctx.fillStyle = drawing.color;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (drawing.tool === 'free') {
      ctx.beginPath();
      ctx.moveTo(points[0].x * width, points[0].y * height);
      points.forEach(point => {
        ctx.lineTo(point.x * width, point.y * height);
      });
      ctx.stroke();
    } else if (drawing.tool === 'line' || drawing.tool === 'arrow') {
      const start = points[0];
      const end = points[points.length - 1];
      
      ctx.beginPath();
      ctx.moveTo(start.x * width, start.y * height);
      ctx.lineTo(end.x * width, end.y * height);
      ctx.stroke();

      if (drawing.tool === 'arrow') {
        // Draw arrowhead
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        const headLength = 20;
        ctx.beginPath();
        ctx.moveTo(end.x * width, end.y * height);
        ctx.lineTo(
          end.x * width - headLength * Math.cos(angle - Math.PI / 6),
          end.y * height - headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(end.x * width, end.y * height);
        ctx.lineTo(
          end.x * width - headLength * Math.cos(angle + Math.PI / 6),
          end.y * height - headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    } else if (drawing.tool === 'circle') {
      const start = points[0];
      const end = points[points.length - 1];
      const radius = Math.sqrt(Math.pow((end.x - start.x) * width, 2) + Math.pow((end.y - start.y) * height, 2));
      
      ctx.beginPath();
      ctx.arc(start.x * width, start.y * height, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };

  // Render drawings on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render all drawings
    drawings.forEach(drawing => {
      renderDrawing(ctx, drawing, canvas.width, canvas.height);
    });

    // Render current drawing
    if (currentDrawing.length > 0) {
      renderDrawing(ctx, { points: currentDrawing, tool: currentTool, color: currentColor }, canvas.width, canvas.height);
    }
  }, [drawings, currentDrawing, currentTool, currentColor]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(5);
          break;
        case ',':
          e.preventDefault();
          frameStep(false);
          break;
        case '.':
          e.preventDefault();
          frameStep(true);
          break;
        case 'j':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'l':
          e.preventDefault();
          skipTime(10);
          break;
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, currentTime, duration]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="relative bg-black rounded-lg overflow-hidden">
      {/* Video and Canvas */}
      <div className="relative aspect-video">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-auto"
          style={{ cursor: drawingMode ? 'crosshair' : 'default' }}
          width={1920}
          height={1080}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
        />
      </div>

      {/* Drawing Tools */}
      {drawingMode && (
        <div className="absolute top-4 left-4 bg-slate-800/90 rounded-lg p-2 flex gap-2">
          <Button
            size="sm"
            variant={currentTool === 'arrow' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('arrow')}
            className="border-slate-600"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'line' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('line')}
            className="border-slate-600"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'circle' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('circle')}
            className="border-slate-600"
          >
            <Circle className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'free' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('free')}
            className="border-slate-600"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          
          <div className="w-px bg-slate-600" />
          
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer"
          />
          
          <Button size="sm" variant="outline" onClick={undo} className="border-slate-600">
            <Undo className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={downloadFrame} className="border-slate-600">
            <Download className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={clearDrawings} className="border-slate-600">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={handleSeek}
          className="mb-4"
        />

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button size="sm" variant="ghost" onClick={togglePlay} className="text-white hover:bg-white/20">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            {/* Frame Step */}
            <Button size="sm" variant="ghost" onClick={() => frameStep(false)} className="text-white hover:bg-white/20">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => frameStep(true)} className="text-white hover:bg-white/20">
              <ChevronRight className="w-5 h-5" />
            </Button>

            {/* Skip */}
            <Button size="sm" variant="ghost" onClick={() => skipTime(-10)} className="text-white hover:bg-white/20">
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button size="sm" variant="ghost" onClick={() => skipTime(10)} className="text-white hover:bg-white/20">
              <SkipForward className="w-5 h-5" />
            </Button>

            {/* Time */}
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            {/* Volume */}
            <Button size="sm" variant="ghost" onClick={toggleMute} className="text-white hover:bg-white/20">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            <Slider
              value={[volume]}
              max={1}
              step={0.1}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Playback Speed */}
            <Select value={playbackRate.toString()} onValueChange={changePlaybackRate}>
              <SelectTrigger className="w-20 h-8 bg-slate-800 border-slate-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-600">
                <SelectItem value="0.25">0.25x</SelectItem>
                <SelectItem value="0.5">0.5x</SelectItem>
                <SelectItem value="0.75">0.75x</SelectItem>
                <SelectItem value="1">1x</SelectItem>
                <SelectItem value="1.25">1.25x</SelectItem>
                <SelectItem value="1.5">1.5x</SelectItem>
                <SelectItem value="2">2x</SelectItem>
              </SelectContent>
            </Select>

            {/* Drawing Mode Toggle */}
            <Button
              size="sm"
              variant={drawingMode ? 'default' : 'ghost'}
              onClick={() => setDrawingMode(!drawingMode)}
              className={drawingMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'text-white hover:bg-white/20'}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Draw
            </Button>

            {/* Fullscreen */}
            <Button size="sm" variant="ghost" onClick={toggleFullscreen} className="text-white hover:bg-white/20">
              <Maximize className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
