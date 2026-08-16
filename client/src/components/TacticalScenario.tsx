import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

export interface PlayerMovement {
  playerId: number;
  path: { x: number; y: number; timestamp: number }[];
  role: string;
  color: string;
}

export interface TacticalScenarioData {
  id: string;
  name: string;
  description: string;
  formation: string;
  initialPositions: { x: number; y: number; role: string; number?: number }[];
  movements?: PlayerMovement[];
  duration: number; // seconds
  arrows?: { from: { x: number; y: number }; to: { x: number; y: number }; type: 'pass' | 'run' | 'press' }[];
}

interface TacticalScenarioProps {
  scenario: TacticalScenarioData;
  width?: number;
  height?: number;
  autoPlay?: boolean;
}

export default function TacticalScenario({ scenario, width = 600, height = 900, autoPlay = false }: TacticalScenarioProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number>(0);

  // Draw football pitch
  const drawPitch = (ctx: CanvasRenderingContext2D) => {
    const pitchColor = '#2d5016';
    const lineColor = '#ffffff';
    const lineWidth = 2;

    // Background
    ctx.fillStyle = pitchColor;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;

    // Outer boundary
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Center line
    ctx.beginPath();
    ctx.moveTo(20, height / 2);
    ctx.lineTo(width - 20, height / 2);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Center spot
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Penalty areas
    const penaltyAreaWidth = 200;
    const penaltyAreaHeight = 100;
    const goalAreaWidth = 120;
    const goalAreaHeight = 40;

    // Top penalty area
    ctx.strokeRect((width - penaltyAreaWidth) / 2, 20, penaltyAreaWidth, penaltyAreaHeight);
    ctx.strokeRect((width - goalAreaWidth) / 2, 20, goalAreaWidth, goalAreaHeight);

    // Bottom penalty area
    ctx.strokeRect((width - penaltyAreaWidth) / 2, height - 20 - penaltyAreaHeight, penaltyAreaWidth, penaltyAreaHeight);
    ctx.strokeRect((width - goalAreaWidth) / 2, height - 20 - goalAreaHeight, goalAreaWidth, goalAreaHeight);

    // Penalty spots
    ctx.beginPath();
    ctx.arc(width / 2, 20 + 70, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width / 2, height - 20 - 70, 3, 0, Math.PI * 2);
    ctx.fill();

    // Goals
    ctx.fillStyle = lineColor;
    ctx.fillRect((width - 60) / 2, 15, 60, 5);
    ctx.fillRect((width - 60) / 2, height - 20, 60, 5);
  };

  // Draw arrows (passes, runs, pressing)
  const drawArrows = (ctx: CanvasRenderingContext2D) => {
    if (!scenario.arrows) return;

    scenario.arrows.forEach(arrow => {
      const fromX = (arrow.from.x / 100) * (width - 40) + 20;
      const fromY = (arrow.from.y / 100) * (height - 40) + 20;
      const toX = (arrow.to.x / 100) * (width - 40) + 20;
      const toY = (arrow.to.y / 100) * (height - 40) + 20;

      ctx.strokeStyle = arrow.type === 'pass' ? '#3b82f6' : arrow.type === 'run' ? '#10b981' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash(arrow.type === 'run' ? [5, 5] : []);

      // Draw line
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      // Draw arrowhead
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const arrowSize = 10;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle - Math.PI / 6),
        toY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle + Math.PI / 6),
        toY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
      ctx.setLineDash([]);
    });
  };

  // Draw players
  const drawPlayers = (ctx: CanvasRenderingContext2D, time: number) => {
    const positions = scenario.movements
      ? scenario.movements.map(movement => {
          // Find position at current time
          const pathPoint = movement.path.find((p, i) => {
            const nextPoint = movement.path[i + 1];
            return p.timestamp <= time && (!nextPoint || nextPoint.timestamp > time);
          });

          if (!pathPoint) return null;

          // Interpolate between points if there's a next point
          const nextPoint = movement.path.find(p => p.timestamp > time);
          let x = pathPoint.x;
          let y = pathPoint.y;

          if (nextPoint) {
            const progress = (time - pathPoint.timestamp) / (nextPoint.timestamp - pathPoint.timestamp);
            x = pathPoint.x + (nextPoint.x - pathPoint.x) * progress;
            y = pathPoint.y + (nextPoint.y - pathPoint.y) * progress;
          }

          return { x, y, role: movement.role, color: movement.color };
        })
      : scenario.initialPositions.map(pos => ({ ...pos, color: '#3b82f6' }));

    positions.forEach(pos => {
      if (!pos) return;

      const x = (pos.x / 100) * (width - 40) + 20;
      const y = (pos.y / 100) * (height - 40) + 20;

      // Draw player circle
      ctx.fillStyle = pos.color || '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Draw role text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(pos.role, x, y);
    });
  };

  // Animation loop
  const animate = (timestamp: number) => {
    if (!isPlaying) return;

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    const deltaTime = (timestamp - lastTimeRef.current) / 1000 * playbackSpeed;
    lastTimeRef.current = timestamp;

    setCurrentTime(prev => {
      const newTime = prev + deltaTime;
      if (newTime >= scenario.duration) {
        setIsPlaying(false);
        return scenario.duration;
      }
      return newTime;
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Wrapper to satisfy useEffect dependency
  const startAnimation = () => {
    lastTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Start/stop animation
  useEffect(() => {
    if (isPlaying) {
      startAnimation();
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, playbackSpeed]);

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw pitch
    drawPitch(ctx);

    // Draw arrows
    drawArrows(ctx);

    // Draw players
    drawPlayers(ctx, currentTime);
  }, [currentTime, scenario]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
    lastTimeRef.current = 0;
  };

  const handleSpeedChange = () => {
    setPlaybackSpeed(prev => {
      if (prev === 1) return 2;
      if (prev === 2) return 0.5;
      return 1;
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{scenario.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{scenario.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className="border rounded-lg mx-auto"
            style={{ maxWidth: '100%', height: 'auto' }}
          />

          <div className="flex items-center justify-center gap-2">
            <Button onClick={handlePlayPause} size="sm">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button onClick={handleReset} size="sm" variant="outline">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button onClick={handleSpeedChange} size="sm" variant="outline">
              <FastForward className="h-4 w-4 mr-1" />
              {playbackSpeed}x
            </Button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>Time: {currentTime.toFixed(1)}s</span>
              <span>Duration: {scenario.duration}s</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${(currentTime / scenario.duration) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
