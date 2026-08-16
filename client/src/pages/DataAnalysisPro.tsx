import { useState, useRef, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { PageSkeleton } from '@/components/PageSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';
import {
  BarChart3, 
  TrendingUp, 
  Activity, 
  Target,
  MapPin,
  ArrowRight,
  Download,
  Filter,
  Users,
  Clock,
  Zap
, ArrowLeft } from 'lucide-react';



// Generate heatmap data
const generateHeatmapData = () => {
  const data: { x: number; y: number; intensity: number }[] = [];
  // Simulate player activity zones
  for (let i = 0; i < 50; i++) {
    data.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      intensity: Math.random()
    });
  }
  return data;
};

// Generate pass map data
const generatePassMapData = () => {
  return [
    { from: { x: 20, y: 50 }, to: { x: 40, y: 30 }, success: true, count: 12 },
    { from: { x: 40, y: 30 }, to: { x: 60, y: 40 }, success: true, count: 8 },
    { from: { x: 60, y: 40 }, to: { x: 80, y: 25 }, success: false, count: 3 },
    { from: { x: 40, y: 30 }, to: { x: 50, y: 60 }, success: true, count: 15 },
    { from: { x: 50, y: 60 }, to: { x: 70, y: 70 }, success: true, count: 6 },
    { from: { x: 20, y: 50 }, to: { x: 30, y: 70 }, success: true, count: 10 },
    { from: { x: 70, y: 70 }, to: { x: 85, y: 50 }, success: false, count: 4 },
    { from: { x: 60, y: 40 }, to: { x: 75, y: 60 }, success: true, count: 9 },
  ];
};

export default function DataAnalysisPro() {
  const [, navigate] = useLocation();
  const { data: players = [], isLoading: playersLoading } = trpc.dataAnalysis.getAllPlayers.useQuery();
  const { data: matches = [], isLoading: matchesLoading } = trpc.dataAnalysis.getAllMatches.useQuery();
  
  const { t, language } = useLanguage();
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedMatch, setSelectedMatch] = useState<string>('');
  const [activeTab, setActiveTab] = useState('heatmap');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Set default selections when data loads
  useEffect(() => {
    if (players.length > 0 && !selectedPlayer) {
      setSelectedPlayer(players[0].id.toString());
    }
  }, [players, selectedPlayer]);

  useEffect(() => {
    if (matches.length > 0 && !selectedMatch) {
      setSelectedMatch(matches[0].id.toString());
    }
  }, [matches, selectedMatch]);

  const player = players.find(p => p.id.toString() === selectedPlayer);
  const match = matches.find(m => m.id.toString() === selectedMatch);

  // Fetch player match stats
  const { data: matchStats } = trpc.dataAnalysis.getPlayerMatchStats.useQuery(
    {
      playerId: parseInt(selectedPlayer),
      matchId: parseInt(selectedMatch)
    },
    {
      enabled: !!selectedPlayer && !!selectedMatch
    }
  );

  // Draw heatmap
  useEffect(() => {
    if (activeTab === 'heatmap' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw field
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw field lines
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 10);
      ctx.lineTo(canvas.width / 2, canvas.height - 10);
      ctx.stroke();

      // Draw center circle
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
      ctx.stroke();

      // Draw heatmap points
      const heatmapData = generateHeatmapData();
      heatmapData.forEach(point => {
        const x = (point.x / 100) * canvas.width;
        const y = (point.y / 100) * canvas.height;
        const radius = 30 + point.intensity * 20;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(255, 0, 0, ${point.intensity * 0.6})`);
        gradient.addColorStop(0.5, `rgba(255, 165, 0, ${point.intensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
      });
    }
  }, [activeTab]);

  // Draw pass map
  useEffect(() => {
    if (activeTab === 'passmap' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw field
      ctx.fillStyle = '#16a34a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw field lines
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 10);
      ctx.lineTo(canvas.width / 2, canvas.height - 10);
      ctx.stroke();

      // Draw passes
      const passData = generatePassMapData();
      passData.forEach(pass => {
        const fromX = (pass.from.x / 100) * canvas.width;
        const fromY = (pass.from.y / 100) * canvas.height;
        const toX = (pass.to.x / 100) * canvas.width;
        const toY = (pass.to.y / 100) * canvas.height;

        // Draw arrow
        ctx.strokeStyle = pass.success ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        ctx.lineWidth = Math.min(pass.count / 2, 8);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(toY - fromY, toX - fromX);
        ctx.fillStyle = pass.success ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)';
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - 10 * Math.cos(angle - Math.PI / 6), toY - 10 * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(toX - 10 * Math.cos(angle + Math.PI / 6), toY - 10 * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();

        // Draw pass count
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2;
        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText(pass.count.toString(), midX, midY);
      });
    }
  }, [activeTab]);

  if (playersLoading || matchesLoading) {
    return (
      <>
        <PageSkeleton cards={4} rows={6} />
      </>
    );
  }
    return (
    <div >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="h-10 w-10 text-blue-600" />
            <div>
                        <BackButton />
          <h1 className="brand-gradient text-4xl font-bold bg-clip-text text-transparent">
                Advanced Data Analysis
              </h1>
              <p className="text-muted-foreground">InStat & Wyscout Style Analytics</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Player
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {playersLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : players.length === 0 ? (
                    <SelectItem value="none" disabled>No players found</SelectItem>
                  ) : (
                    players.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        #{p.jerseyNumber || '?'} {p.firstName} {p.lastName} ({p.position})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                Match
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedMatch} onValueChange={setSelectedMatch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {matchesLoading ? (
                    <SelectItem value="loading" disabled>Loading...</SelectItem>
                  ) : matches.length === 0 ? (
                    <SelectItem value="none" disabled>No matches found</SelectItem>
                  ) : (
                    matches.map(m => (
                      <SelectItem key={m.id} value={m.id.toString()}>
                        vs {m.opponent} - {m.result || 'N/A'} ({new Date(m.matchDate).toLocaleDateString()})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Distance</p>
                  <p className="text-2xl font-bold">10.2 km</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Passes</p>
                  <p className="text-2xl font-bold">67/82</p>
                  <Badge variant="secondary" className="mt-1">82% Accuracy</Badge>
                </div>
                <ArrowRight className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sprints</p>
                  <p className="text-2xl font-bold">23</p>
                </div>
                <Zap className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Touches</p>
                  <p className="text-2xl font-bold">94</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visualizations */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="heatmap">
              <MapPin className="h-4 w-4 mr-2" />
              Heatmap
            </TabsTrigger>
            <TabsTrigger value="passmap">
              <ArrowRight className="h-4 w-4 mr-2" />
              Pass Map
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="comparison">
              <TrendingUp className="h-4 w-4 mr-2" />
              Compare
            </TabsTrigger>
          </TabsList>

          <TabsContent value="heatmap" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity Heatmap</CardTitle>
                <CardDescription>
                  Player movement and activity zones during the match
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                  <canvas
                    ref={canvasRef}
                    width={1200}
                    height={900}
                    className="absolute top-0 left-0 w-full h-full border rounded-lg"
                  />
                </div>
                <div className="mt-4 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm">High Activity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-orange-500 rounded"></div>
                    <span className="text-sm">Medium Activity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-sm">Low Activity</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="passmap" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pass Map</CardTitle>
                <CardDescription>
                  Passing patterns and connections with teammates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full" style={{ paddingBottom: '75%' }}>
                  <canvas
                    ref={canvasRef}
                    width={1200}
                    height={900}
                    className="absolute top-0 left-0 w-full h-full border rounded-lg"
                  />
                </div>
                <div className="mt-4 flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded"></div>
                    <span className="text-sm">Successful Pass</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm">Failed Pass</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">Line Thickness = Pass Frequency</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Offensive Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Shots</span>
                      <span className="font-bold">4</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Key Passes</span>
                      <span className="font-bold">7</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Dribbles</span>
                      <span className="font-bold">12/15</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Crosses</span>
                      <span className="font-bold">3/8</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-orange-600 h-2 rounded-full" style={{ width: '37%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Defensive Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Tackles</span>
                      <span className="font-bold">5/7</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-red-600 h-2 rounded-full" style={{ width: '71%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Interceptions</span>
                      <span className="font-bold">8</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Clearances</span>
                      <span className="font-bold">3</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-pink-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm">Blocks</span>
                      <span className="font-bold">2</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '20%' }}></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>
                  Compare with team average and position average
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Pass Accuracy</span>
                      <div className="flex items-center gap-4">
                        <Badge>Player: 82%</Badge>
                        <Badge variant="outline">Team: 75%</Badge>
                        <Badge variant="secondary">Position: 78%</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 relative">
                      <div className="bg-blue-600 h-3 rounded-full absolute" style={{ width: '82%' }}></div>
                      <div className="border-l-2 border-gray-400 h-3 absolute" style={{ left: '75%' }}></div>
                      <div className="border-l-2 border-border h-3 absolute" style={{ left: '78%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Distance Covered (km)</span>
                      <div className="flex items-center gap-4">
                        <Badge>Player: 10.2</Badge>
                        <Badge variant="outline">Team: 9.5</Badge>
                        <Badge variant="secondary">Position: 10.0</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 relative">
                      <div className="bg-green-600 h-3 rounded-full absolute" style={{ width: '85%' }}></div>
                      <div className="border-l-2 border-gray-400 h-3 absolute" style={{ left: '79%' }}></div>
                      <div className="border-l-2 border-border h-3 absolute" style={{ left: '83%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Successful Dribbles</span>
                      <div className="flex items-center gap-4">
                        <Badge>Player: 12</Badge>
                        <Badge variant="outline">Team: 8</Badge>
                        <Badge variant="secondary">Position: 10</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 relative">
                      <div className="bg-purple-600 h-3 rounded-full absolute" style={{ width: '80%' }}></div>
                      <div className="border-l-2 border-gray-400 h-3 absolute" style={{ left: '53%' }}></div>
                      <div className="border-l-2 border-border h-3 absolute" style={{ left: '67%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">Defensive Actions</span>
                      <div className="flex items-center gap-4">
                        <Badge>Player: 16</Badge>
                        <Badge variant="outline">Team: 18</Badge>
                        <Badge variant="secondary">Position: 15</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3 relative">
                      <div className="bg-red-600 h-3 rounded-full absolute" style={{ width: '64%' }}></div>
                      <div className="border-l-2 border-gray-400 h-3 absolute" style={{ left: '72%' }}></div>
                      <div className="border-l-2 border-border h-3 absolute" style={{ left: '60%' }}></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Card */}
        <div className="mt-8">
          <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <BarChart3 className="h-8 w-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Professional Data Analysis</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This advanced analytics platform provides InStat and Wyscout-style visualizations and metrics used by professional clubs worldwide. Track player movements, passing patterns, and performance metrics to gain deep insights into match performance.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge>Heatmaps</Badge>
                    <Badge>Pass Networks</Badge>
                    <Badge>Performance Metrics</Badge>
                    <Badge>Comparative Analysis</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
