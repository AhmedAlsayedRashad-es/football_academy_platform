import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, Eye, EyeOff } from "lucide-react";

interface DualPitchComparisonProps {
  session1Name: string;
  session1Events: any[];
  session2Name: string;
  session2Events: any[];
}

export function DualPitchComparison({
  session1Name,
  session1Events,
  session2Name,
  session2Events,
}: DualPitchComparisonProps) {
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [showOverlay, setShowOverlay] = useState(false);

  const PITCH_WIDTH = 800;
  const PITCH_HEIGHT = 520;

  useEffect(() => {
    if (canvas1Ref.current) {
      drawPitch(canvas1Ref.current, session1Events, eventFilter, "#3b82f6"); // Blue for session 1
    }
  }, [session1Events, eventFilter]);

  useEffect(() => {
    if (canvas2Ref.current) {
      drawPitch(canvas2Ref.current, session2Events, eventFilter, "#10b981"); // Green for session 2
    }
  }, [session2Events, eventFilter]);

  useEffect(() => {
    if (overlayCanvasRef.current && showOverlay) {
      drawOverlayPitch(overlayCanvasRef.current, session1Events, session2Events, eventFilter);
    }
  }, [session1Events, session2Events, eventFilter, showOverlay]);

  const drawPitch = (canvas: HTMLCanvasElement, events: any[], filter: string, color: string) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    // Draw pitch background
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    // Draw pitch markings
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;

    // Outer lines
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
    ctx.strokeRect(0, PITCH_HEIGHT / 2 - 120, 120, 240);
    ctx.strokeRect(PITCH_WIDTH - 120, PITCH_HEIGHT / 2 - 120, 120, 240);

    // Goal areas
    ctx.strokeRect(0, PITCH_HEIGHT / 2 - 60, 40, 120);
    ctx.strokeRect(PITCH_WIDTH - 40, PITCH_HEIGHT / 2 - 60, 40, 120);

    // Filter events
    const filteredEvents = filter === "all" 
      ? events 
      : events.filter(e => e.type === filter);

    // Draw events
    filteredEvents.forEach(event => {
      const x = (event.x / 100) * PITCH_WIDTH;
      const y = (event.y / 100) * PITCH_HEIGHT;

      // Draw event marker
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Draw pass arrow if applicable
      if (event.type === "pass" && event.endX !== undefined && event.endY !== undefined) {
        const endX = (event.endX / 100) * PITCH_WIDTH;
        const endY = (event.endY / 100) * PITCH_HEIGHT;

        ctx.strokeStyle = event.completed ? color : "#ef4444";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Draw arrowhead
        const angle = Math.atan2(endY - y, endX - x);
        ctx.fillStyle = event.completed ? color : "#ef4444";
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - 10 * Math.cos(angle - Math.PI / 6),
          endY - 10 * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - 10 * Math.cos(angle + Math.PI / 6),
          endY - 10 * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
    });
  };

  const drawOverlayPitch = (canvas: HTMLCanvasElement, events1: any[], events2: any[], filter: string) => {
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    // Draw pitch background
    ctx.fillStyle = "#16a34a";
    ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    // Draw pitch markings (same as above)
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);
    ctx.beginPath();
    ctx.moveTo(PITCH_WIDTH / 2, 0);
    ctx.lineTo(PITCH_WIDTH / 2, PITCH_HEIGHT);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH / 2, PITCH_HEIGHT / 2, 60, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeRect(0, PITCH_HEIGHT / 2 - 120, 120, 240);
    ctx.strokeRect(PITCH_WIDTH - 120, PITCH_HEIGHT / 2 - 120, 120, 240);
    ctx.strokeRect(0, PITCH_HEIGHT / 2 - 60, 40, 120);
    ctx.strokeRect(PITCH_WIDTH - 40, PITCH_HEIGHT / 2 - 60, 40, 120);

    // Filter events
    const filteredEvents1 = filter === "all" ? events1 : events1.filter(e => e.type === filter);
    const filteredEvents2 = filter === "all" ? events2 : events2.filter(e => e.type === filter);

    // Draw session 1 events (blue)
    filteredEvents1.forEach(event => {
      const x = (event.x / 100) * PITCH_WIDTH;
      const y = (event.y / 100) * PITCH_HEIGHT;

      ctx.fillStyle = "#3b82f6";
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (event.type === "pass" && event.endX !== undefined && event.endY !== undefined) {
        const endX = (event.endX / 100) * PITCH_WIDTH;
        const endY = (event.endY / 100) * PITCH_HEIGHT;

        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });

    // Draw session 2 events (green)
    filteredEvents2.forEach(event => {
      const x = (event.x / 100) * PITCH_WIDTH;
      const y = (event.y / 100) * PITCH_HEIGHT;

      ctx.fillStyle = "#10b981";
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (event.type === "pass" && event.endX !== undefined && event.endY !== undefined) {
        const endX = (event.endX / 100) * PITCH_WIDTH;
        const endY = (event.endY / 100) * PITCH_HEIGHT;

        ctx.strokeStyle = "#10b981";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visual Pitch Comparison</CardTitle>
        <CardDescription>
          Side-by-side event visualization on football pitch
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Button
              variant={eventFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setEventFilter("all")}
            >
              All Events
            </Button>
            <Button
              variant={eventFilter === "shot" ? "default" : "outline"}
              size="sm"
              onClick={() => setEventFilter("shot")}
            >
              Shots
            </Button>
            <Button
              variant={eventFilter === "pass" ? "default" : "outline"}
              size="sm"
              onClick={() => setEventFilter("pass")}
            >
              Passes
            </Button>
            <Button
              variant={eventFilter === "defensive" ? "default" : "outline"}
              size="sm"
              onClick={() => setEventFilter("defensive")}
            >
              Defensive
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowOverlay(!showOverlay)}
          >
            {showOverlay ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Hide Overlay
              </>
            ) : (
              <>
                <Layers className="h-4 w-4 mr-2" />
                Show Overlay
              </>
            )}
          </Button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>{session1Name}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>{session2Name}</span>
          </div>
        </div>

        {/* Pitch Canvases */}
        {!showOverlay ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Session 1 Pitch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-blue-50 border-blue-500">
                  {session1Name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {eventFilter === "all" 
                    ? session1Events.length 
                    : session1Events.filter(e => e.type === eventFilter).length} events
                </span>
              </div>
              <canvas
                ref={canvas1Ref}
                width={PITCH_WIDTH}
                height={PITCH_HEIGHT}
                className="w-full border rounded-lg"
              />
            </div>

            {/* Session 2 Pitch */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="bg-green-50 border-green-500">
                  {session2Name}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {eventFilter === "all" 
                    ? session2Events.length 
                    : session2Events.filter(e => e.type === eventFilter).length} events
                </span>
              </div>
              <canvas
                ref={canvas2Ref}
                width={PITCH_WIDTH}
                height={PITCH_HEIGHT}
                className="w-full border rounded-lg"
              />
            </div>
          </div>
        ) : (
          /* Overlay View */
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Overlay: {session1Name} vs {session2Name}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Blue: {eventFilter === "all" 
                  ? session1Events.length 
                  : session1Events.filter(e => e.type === eventFilter).length} | 
                Green: {eventFilter === "all" 
                  ? session2Events.length 
                  : session2Events.filter(e => e.type === eventFilter).length}
              </span>
            </div>
            <canvas
              ref={overlayCanvasRef}
              width={PITCH_WIDTH}
              height={PITCH_HEIGHT}
              className="w-full border rounded-lg"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
