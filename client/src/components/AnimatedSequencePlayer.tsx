import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, SkipBack, SkipForward, Rewind, FastForward } from 'lucide-react';
import { toast } from 'sonner';

interface AnimatedSequencePlayerProps {
  events: any[];
}

export function AnimatedSequencePlayer({ events }: AnimatedSequencePlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);

  const PITCH_WIDTH = 800;
  const PITCH_HEIGHT = 520;
  const EVENT_DURATION = 1000; // Duration to show each event in ms

  useEffect(() => {
    drawPitch();
    if (events.length > 0) {
      drawEvent(currentEventIndex);
    }
  }, [currentEventIndex, events]);

  useEffect(() => {
    if (isPlaying && events.length > 0) {
      lastUpdateTimeRef.current = Date.now();
      const animateFrame = () => {
        const currentTime = Date.now();
        const elapsed = currentTime - lastUpdateTimeRef.current;

        if (elapsed >= EVENT_DURATION / playbackSpeed) {
          lastUpdateTimeRef.current = currentTime;
          
          if (currentEventIndex < events.length - 1) {
            setCurrentEventIndex(prev => prev + 1);
          } else {
            setIsPlaying(false);
            toast.success('Animation complete');
            return;
          }
        }

        animationFrameRef.current = requestAnimationFrame(animateFrame);
      };
      
      animationFrameRef.current = requestAnimationFrame(animateFrame);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, currentEventIndex, events.length]);

  const drawPitch = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    // Draw pitch background
    ctx.fillStyle = '#1a472a';
    ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    // Draw pitch markings
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    // Center line
    ctx.beginPath();
    ctx.moveTo(PITCH_WIDTH / 2, 0);
    ctx.lineTo(PITCH_WIDTH / 2, PITCH_HEIGHT);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH / 2, PITCH_HEIGHT / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty areas
    ctx.strokeRect(0, PITCH_HEIGHT / 2 - 100, 120, 200);
    ctx.strokeRect(PITCH_WIDTH - 120, PITCH_HEIGHT / 2 - 100, 120, 200);

    // Goal areas
    ctx.strokeRect(0, PITCH_HEIGHT / 2 - 50, 40, 100);
    ctx.strokeRect(PITCH_WIDTH - 40, PITCH_HEIGHT / 2 - 50, 40, 100);

    // Zone lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([5, 5]);
    
    ctx.beginPath();
    ctx.moveTo(PITCH_WIDTH * 0.3333, 0);
    ctx.lineTo(PITCH_WIDTH * 0.3333, PITCH_HEIGHT);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(PITCH_WIDTH * 0.6666, 0);
    ctx.lineTo(PITCH_WIDTH * 0.6666, PITCH_HEIGHT);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  const drawEvent = (index: number) => {
    if (index < 0 || index >= events.length) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const event = events[index];
    const x = (event.x / 100) * PITCH_WIDTH;
    const y = (event.y / 100) * PITCH_HEIGHT;

    // Draw event marker
    ctx.save();

    // Event type colors
    const colors = {
      shot: '#ef4444',
      pass: '#3b82f6',
      defensive: '#f59e0b',
    };

    const color = colors[event.type as keyof typeof colors] || '#ffffff';

    // Draw pulsing circle
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 15, 0, Math.PI * 2);
    ctx.stroke();

    // Draw pass arrow if applicable
    if (event.type === 'pass' && event.endX !== undefined && event.endY !== undefined) {
      const endX = (event.endX / 100) * PITCH_WIDTH;
      const endY = (event.endY / 100) * PITCH_HEIGHT;

      ctx.strokeStyle = event.completed ? '#10b981' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash([]);

      // Draw line
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(endY - y, endX - x);
      const arrowLength = 15;
      
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle - Math.PI / 6),
        endY - arrowLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle + Math.PI / 6),
        endY - arrowLength * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();

      // Draw end marker
      ctx.fillStyle = event.completed ? '#10b981' : '#ef4444';
      ctx.beginPath();
      ctx.arc(endX, endY, 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw event label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(event.type.toUpperCase(), x, y - 25);

    // Draw event details
    ctx.font = '12px sans-serif';
    if (event.type === 'shot') {
      ctx.fillText(`xG: ${(event.xG || 0).toFixed(2)}`, x, y + 35);
    } else if (event.type === 'pass') {
      ctx.fillText(event.completed ? 'Completed' : 'Incomplete', x, y + 35);
    }

    ctx.restore();

    // Draw trail of previous events (faded)
    for (let i = Math.max(0, index - 5); i < index; i++) {
      const prevEvent = events[i];
      const prevX = (prevEvent.x / 100) * PITCH_WIDTH;
      const prevY = (prevEvent.y / 100) * PITCH_HEIGHT;
      const opacity = 0.1 + (i - Math.max(0, index - 5)) * 0.15;

      ctx.fillStyle = colors[prevEvent.type as keyof typeof colors] || '#ffffff';
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc(prevX, prevY, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  };



  const handlePlayPause = () => {
    if (!isPlaying) {
      lastUpdateTimeRef.current = Date.now();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentEventIndex(0);
  };

  const handlePrevious = () => {
    setIsPlaying(false);
    setCurrentEventIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentEventIndex(prev => Math.min(events.length - 1, prev + 1));
  };

  const handleSliderChange = (value: number[]) => {
    setIsPlaying(false);
    setCurrentEventIndex(value[0]);
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    toast.success(`Playback speed: ${speed}x`);
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Animated Tactical Sequences</CardTitle>
          <CardDescription>
            Record events to visualize animated tactical sequences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No events recorded yet. Start tagging to create animated sequences.
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentEvent = events[currentEventIndex];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Animated Tactical Sequences</CardTitle>
            <CardDescription>
              Playback recorded events with timeline controls
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Event {currentEventIndex + 1} / {events.length}
            </Badge>
            {currentEvent && (
              <Badge variant={currentEvent.type === 'shot' ? 'destructive' : currentEvent.type === 'pass' ? 'default' : 'secondary'}>
                {currentEvent.type}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Canvas */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={PITCH_WIDTH}
            height={PITCH_HEIGHT}
            className="w-full h-auto"
          />
        </div>

        {/* Timeline Slider */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Timeline</Label>
          <Slider
            value={[currentEventIndex]}
            onValueChange={handleSliderChange}
            max={events.length - 1}
            step={1}
            className="w-full"
          />
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            <SkipBack className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentEventIndex === 0}>
            <Rewind className="h-4 w-4" />
          </Button>
          <Button onClick={handlePlayPause} size="lg">
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </Button>
          <Button variant="outline" size="sm" onClick={handleNext} disabled={currentEventIndex === events.length - 1}>
            <FastForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Speed:</span>
          {[0.5, 1, 2, 4].map(speed => (
            <Button
              key={speed}
              variant={playbackSpeed === speed ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSpeedChange(speed)}
            >
              {speed}x
            </Button>
          ))}
        </div>

        {/* Current Event Details */}
        {currentEvent && (
          <Card className="bg-accent/50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Type:</span>
                  <div className="font-semibold capitalize">{currentEvent.type}</div>
                </div>
                {currentEvent.type === 'shot' && (
                  <>
                    <div>
                      <span className="text-muted-foreground">xG:</span>
                      <div className="font-semibold">{(currentEvent.xG || 0).toFixed(2)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Outcome:</span>
                      <div className="font-semibold capitalize">{currentEvent.outcome}</div>
                    </div>
                  </>
                )}
                {currentEvent.type === 'pass' && (
                  <>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="font-semibold">{currentEvent.completed ? 'Completed' : 'Incomplete'}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">xA:</span>
                      <div className="font-semibold">{(currentEvent.xA || 0).toFixed(2)}</div>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-muted-foreground">Phase:</span>
                  <div className="font-semibold capitalize">{currentEvent.phase || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Zone:</span>
                  <div className="font-semibold capitalize">{currentEvent.zone || 'N/A'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
