import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {Activity, Clock, TrendingUp, MapPin, Filter, Download, ArrowLeft} from 'lucide-react';
import { HeatmapEngine, HeatmapPoint } from '@/components/HeatmapEngine';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


export default function ProfessionalHeatmap() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t, language } = useLanguage();
  const [heatmapEngine, setHeatmapEngine] = useState<HeatmapEngine | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('player1');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('full');
  const [radius, setRadius] = useState<number>(40);
  const [opacity, setOpacity] = useState<number>(0.6);
  const [stats, setStats] = useState({
    totalTouches: 0,
    avgPosition: { x: 0, y: 0 },
    coverage: 0,
    hotspots: 0
  });

  // Live players from database (fallback to sample data if DB is empty)
  const { data: livePlayers = [] } = trpc.players.getAll.useQuery();
  const players = livePlayers.length > 0
    ? livePlayers.slice(0, 8).map((p: any, i: number) => ({
        id: `player${p.id}`,
        name: `${p.firstName} ${p.lastName}`,
        position: p.position || 'CM',
        number: p.jerseyNumber || i + 1,
      }))
    : [
        { id: 'player1', name: 'Mohamed Salah', position: 'RW', number: 11 },
        { id: 'player2', name: 'Kevin De Bruyne', position: 'CM', number: 17 },
        { id: 'player3', name: 'Virgil van Dijk', position: 'CB', number: 4 },
        { id: 'player4', name: 'Erling Haaland', position: 'ST', number: 9 },
      ];

  // Initialize heatmap engine
  useEffect(() => {
    if (canvasRef.current && !heatmapEngine) {
      const engine = new HeatmapEngine(canvasRef.current, {
        width: 1200,
        height: 800,
        radius,
        opacity
      });
      setHeatmapEngine(engine);
    }
  }, []);

  // Update heatmap when settings change
  useEffect(() => {
    if (heatmapEngine) {
      generateHeatmap();
    }
  }, [selectedPlayer, selectedPeriod, radius, opacity, heatmapEngine]);

  const generateHeatmap = () => {
    if (!heatmapEngine) return;

    // Clear previous data
    heatmapEngine.clearPoints();

    // Generate sample data based on player position
    const player = players.find(p => p.id === selectedPlayer);
    if (!player) return;

    const points = generatePlayerData(player.position, selectedPeriod);
    
    heatmapEngine.addPoints(points);
    heatmapEngine.render();

    // Calculate statistics
    calculateStats(points);
  };

  const generatePlayerData = (position: string, period: string): HeatmapPoint[] => {
    const pointCount = period === 'full' ? 150 : 75;
    const points: HeatmapPoint[] = [];

    // Position-specific data generation
    let baseX = 50, baseY = 50, rangeX = 30, rangeY = 30;

    switch (position) {
      case 'RW': // Right Winger
        baseX = 70; baseY = 20; rangeX = 20; rangeY = 40;
        break;
      case 'CM': // Central Midfielder
        baseX = 50; baseY = 50; rangeX = 25; rangeY = 30;
        break;
      case 'CB': // Center Back
        baseX = 20; baseY = 50; rangeX = 15; rangeY = 25;
        break;
      case 'ST': // Striker
        baseX = 80; baseY = 50; rangeX = 15; rangeY = 30;
        break;
    }

    for (let i = 0; i < pointCount; i++) {
      // Gaussian distribution around base position
      const x = baseX + (Math.random() - 0.5) * rangeX * 2;
      const y = baseY + (Math.random() - 0.5) * rangeY * 2;

      points.push({
        x: Math.max(5, Math.min(95, x)),
        y: Math.max(5, Math.min(95, y)),
        intensity: 0.4 + Math.random() * 0.6,
        timestamp: Math.floor(Math.random() * (period === 'full' ? 90 : 45))
      });
    }

    return points;
  };

  const calculateStats = (points: HeatmapPoint[]) => {
    if (points.length === 0) return;

    // Calculate average position
    const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
    const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

    // Calculate coverage area (simplified)
    const xRange = Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x));
    const yRange = Math.max(...points.map(p => p.y)) - Math.min(...points.map(p => p.y));
    const coverage = Math.round((xRange * yRange) / 100);

    // Count hotspots (high intensity clusters)
    const hotspots = points.filter(p => p.intensity > 0.7).length;

    setStats({
      totalTouches: points.length,
      avgPosition: { x: Math.round(avgX), y: Math.round(avgY) },
      coverage,
      hotspots
    });
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `heatmap-${selectedPlayer}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <>
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          
          <BackButton />
<h1 className="text-3xl font-bold">Professional Heatmap Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Advanced player positioning and movement analysis
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Activity className="h-5 w-5 mr-2" />
          InStat/Wyscout Style
        </Badge>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Controls</CardTitle>
          <CardDescription>Configure heatmap visualization parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Player Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Player</label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {players.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      #{player.number} {player.name} ({player.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Period Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Match Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full">Full Match (90')</SelectItem>
                  <SelectItem value="first">First Half (45')</SelectItem>
                  <SelectItem value="second">Second Half (45')</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Blur Radius */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Blur Radius: {radius}px</label>
              <Slider
                value={[radius]}
                onValueChange={(value) => setRadius(value[0])}
                min={20}
                max={80}
                step={5}
              />
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Opacity: {Math.round(opacity * 100)}%</label>
              <Slider
                value={[opacity * 100]}
                onValueChange={(value) => setOpacity(value[0] / 100)}
                min={20}
                max={100}
                step={5}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateHeatmap} className="flex-1">
              <Filter className="h-4 w-4 mr-2" />
              Regenerate Heatmap
            </Button>
            <Button onClick={handleDownload} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export PNG
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Touches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalTouches}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Activity className="h-3 w-3 inline mr-1" />
              Ball contacts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Position</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats.avgPosition.x}%, {stats.avgPosition.y}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <MapPin className="h-3 w-3 inline mr-1" />
              Field coordinates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Coverage Area</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.coverage}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Field coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Hotspots</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.hotspots}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3 inline mr-1" />
              High activity zones
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Player Movement Heatmap</CardTitle>
          <CardDescription>
            Red = High activity | Yellow = Medium activity | Blue = Low activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative bg-green-800 rounded-lg overflow-hidden">
            {/* Football pitch background */}
            <div className="absolute inset-0 opacity-30">
              <svg width="100%" height="100%" viewBox="0 0 1200 800">
                {/* Pitch outline */}
                <rect x="50" y="50" width="1100" height="700" fill="none" stroke="white" strokeWidth="3" />
                {/* Center line */}
                <line x1="600" y1="50" x2="600" y2="750" stroke="white" strokeWidth="3" />
                {/* Center circle */}
                <circle cx="600" cy="400" r="80" fill="none" stroke="white" strokeWidth="3" />
                {/* Penalty areas */}
                <rect x="50" y="250" width="150" height="300" fill="none" stroke="white" strokeWidth="3" />
                <rect x="1000" y="250" width="150" height="300" fill="none" stroke="white" strokeWidth="3" />
              </svg>
            </div>
            
            {/* Heatmap canvas */}
            <canvas 
              ref={canvasRef}
              className="relative z-10"
              style={{ width: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Heatmap Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-blue-500" />
              <span className="text-sm">Low Activity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-green-500" />
              <span className="text-sm">Medium Activity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-yellow-500" />
              <span className="text-sm">High Activity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-red-500" />
              <span className="text-sm">Very High Activity</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
