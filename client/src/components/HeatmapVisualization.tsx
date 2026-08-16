import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface HeatmapVisualizationProps {
  events: any[];
}

type Zone = 'buildUp' | 'progression' | 'finishing';

export function HeatmapVisualization({ events }: HeatmapVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [selectedZone, setSelectedZone] = useState<Zone | 'all'>('all');
  const [heatmapData, setHeatmapData] = useState<Map<string, number>>(new Map());

  const PITCH_WIDTH = 800;
  const PITCH_HEIGHT = 520;
  const GRID_SIZE = 20; // Size of each heatmap cell

  useEffect(() => {
    calculateHeatmap();
  }, [events, selectedZone]);

  useEffect(() => {
    if (showHeatmap) {
      drawHeatmap();
    }
  }, [heatmapData, showHeatmap]);

  const getZoneFromPosition = (x: number): Zone => {
    if (x < 33.33) return 'buildUp';
    if (x < 66.66) return 'progression';
    return 'finishing';
  };

  const calculateHeatmap = () => {
    const densityMap = new Map<string, number>();

    // Filter events by zone if specific zone is selected
    const filteredEvents = selectedZone === 'all' 
      ? events 
      : events.filter(e => {
          const zone = getZoneFromPosition(e.x);
          return zone === selectedZone;
        });

    // Count events in each grid cell
    filteredEvents.forEach(event => {
      if (event.x !== undefined && event.y !== undefined) {
        const gridX = Math.floor((event.x / 100) * (PITCH_WIDTH / GRID_SIZE));
        const gridY = Math.floor((event.y / 100) * (PITCH_HEIGHT / GRID_SIZE));
        const key = `${gridX},${gridY}`;
        
        densityMap.set(key, (densityMap.get(key) || 0) + 1);
      }

      // Also count end positions for passes
      if (event.type === 'pass' && event.endX !== undefined && event.endY !== undefined) {
        const gridX = Math.floor((event.endX / 100) * (PITCH_WIDTH / GRID_SIZE));
        const gridY = Math.floor((event.endY / 100) * (PITCH_HEIGHT / GRID_SIZE));
        const key = `${gridX},${gridY}`;
        
        densityMap.set(key, (densityMap.get(key) || 0) + 0.5); // Weight end positions less
      }
    });

    setHeatmapData(densityMap);
  };

  const getHeatmapColor = (density: number, maxDensity: number): string => {
    if (density === 0) return 'rgba(0, 0, 0, 0)';
    
    const intensity = Math.min(density / maxDensity, 1);
    
    // Color gradient: blue (low) -> green -> yellow -> orange -> red (high)
    if (intensity < 0.2) {
      return `rgba(0, 0, 255, ${0.2 + intensity * 2})`;
    } else if (intensity < 0.4) {
      return `rgba(0, 255, 0, ${0.3 + intensity * 2})`;
    } else if (intensity < 0.6) {
      return `rgba(255, 255, 0, ${0.4 + intensity * 2})`;
    } else if (intensity < 0.8) {
      return `rgba(255, 165, 0, ${0.5 + intensity * 2})`;
    } else {
      return `rgba(255, 0, 0, ${0.6 + intensity * 2})`;
    }
  };

  const drawHeatmap = () => {
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
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

    // Zone lines (33% and 66%)
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

    // Find max density for normalization
    const maxDensity = Math.max(...Array.from(heatmapData.values()), 1);

    // Draw heatmap
    heatmapData.forEach((density, key) => {
      const [gridX, gridY] = key.split(',').map(Number);
      const x = gridX * GRID_SIZE;
      const y = gridY * GRID_SIZE;

      ctx.fillStyle = getHeatmapColor(density, maxDensity);
      ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
    });

    // Draw zone labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    
    ctx.fillText('Build Up', PITCH_WIDTH * 0.1666, 30);
    ctx.fillText('Progression', PITCH_WIDTH * 0.5, 30);
    ctx.fillText('Finishing', PITCH_WIDTH * 0.8333, 30);
  };

  const handleExportHeatmap = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `heatmap_${selectedZone}_${new Date().toISOString().split('T')[0]}.png`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success('Heatmap exported successfully');
      }
    });
  };

  const getZoneStats = () => {
    const buildUpEvents = events.filter(e => getZoneFromPosition(e.x) === 'buildUp');
    const progressionEvents = events.filter(e => getZoneFromPosition(e.x) === 'progression');
    const finishingEvents = events.filter(e => getZoneFromPosition(e.x) === 'finishing');

    return {
      buildUp: {
        count: buildUpEvents.length,
        percentage: events.length > 0 ? ((buildUpEvents.length / events.length) * 100).toFixed(1) : '0',
      },
      progression: {
        count: progressionEvents.length,
        percentage: events.length > 0 ? ((progressionEvents.length / events.length) * 100).toFixed(1) : '0',
      },
      finishing: {
        count: finishingEvents.length,
        percentage: events.length > 0 ? ((finishingEvents.length / events.length) * 100).toFixed(1) : '0',
      },
    };
  };

  const zoneStats = getZoneStats();

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Heatmap Visualization</CardTitle>
          <CardDescription>
            Record events to see activity density across pitch zones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No events recorded yet. Start tagging to generate heatmap.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Heatmap Visualization</CardTitle>
            <CardDescription>
              Activity density across tactical zones
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={showHeatmap}
                onCheckedChange={setShowHeatmap}
                id="heatmap-toggle"
              />
              <Label htmlFor="heatmap-toggle" className="cursor-pointer">
                {showHeatmap ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Label>
            </div>
            <Button onClick={handleExportHeatmap} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone Filter */}
        <div className="flex gap-2">
          <Button
            variant={selectedZone === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedZone('all')}
          >
            All Zones
          </Button>
          <Button
            variant={selectedZone === 'buildUp' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedZone('buildUp')}
          >
            Build Up
          </Button>
          <Button
            variant={selectedZone === 'progression' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedZone('progression')}
          >
            Progression
          </Button>
          <Button
            variant={selectedZone === 'finishing' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedZone('finishing')}
          >
            Finishing
          </Button>
        </div>

        {/* Heatmap Canvas */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={PITCH_WIDTH}
            height={PITCH_HEIGHT}
            className="w-full h-auto"
            style={{ display: showHeatmap ? 'block' : 'none' }}
          />
          {!showHeatmap && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Heatmap hidden
            </div>
          )}
        </div>

        {/* Zone Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="bg-blue-900/20 border-blue-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-400">Build Up Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{zoneStats.buildUp.count}</div>
              <div className="text-xs text-muted-foreground">{zoneStats.buildUp.percentage}% of actions</div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-900/20 border-yellow-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-400">Progression Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{zoneStats.progression.count}</div>
              <div className="text-xs text-muted-foreground">{zoneStats.progression.percentage}% of actions</div>
            </CardContent>
          </Card>

          <Card className="bg-green-900/20 border-green-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-400">Finishing Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{zoneStats.finishing.count}</div>
              <div className="text-xs text-muted-foreground">{zoneStats.finishing.percentage}% of actions</div>
            </CardContent>
          </Card>
        </div>

        {/* Color Legend */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Low Activity</span>
          <div className="flex gap-1">
            <div className="w-6 h-4 rounded" style={{ background: 'rgba(0, 0, 255, 0.4)' }} />
            <div className="w-6 h-4 rounded" style={{ background: 'rgba(0, 255, 0, 0.5)' }} />
            <div className="w-6 h-4 rounded" style={{ background: 'rgba(255, 255, 0, 0.6)' }} />
            <div className="w-6 h-4 rounded" style={{ background: 'rgba(255, 165, 0, 0.7)' }} />
            <div className="w-6 h-4 rounded" style={{ background: 'rgba(255, 0, 0, 0.8)' }} />
          </div>
          <span>High Activity</span>
        </div>
      </CardContent>
    </Card>
  );
}
