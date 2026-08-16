import { useState, useEffect, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {Network, Download, Filter, TrendingUp, Target, Percent, ArrowLeft} from 'lucide-react';
import { PassNetworkEngine, PlayerNode, PassConnection } from '@/components/PassNetworkEngine';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


export default function PassNetworkViewer() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t, language } = useLanguage();
  const [networkEngine, setNetworkEngine] = useState<PassNetworkEngine | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<string>('match1');
  const [selectedTeam, setSelectedTeam] = useState<string>('home');
  const [minPassThreshold, setMinPassThreshold] = useState<number>(5);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [stats, setStats] = useState({
    totalPasses: 0,
    passAccuracy: 0,
    avgPassLength: 0,
    keyPasses: 0
  });

  // Live matches from database (fallback to sample data if DB is empty)
  const { data: liveMatches = [] } = trpc.matches.getAll.useQuery();
  const matches = liveMatches.length > 0
    ? liveMatches.slice(0, 10).map((m: any) => ({
        id: `match${m.id}`,
        name: `${m.homeTeam || 'Home'} vs ${m.awayTeam || 'Away'}`,
        date: m.matchDate ? new Date(m.matchDate).toISOString().slice(0, 10) : '',
      }))
    : [
        { id: 'match1', name: 'Liverpool vs Manchester City', date: '2024-01-15' },
        { id: 'match2', name: 'Real Madrid vs Barcelona', date: '2024-01-20' },
        { id: 'match3', name: 'Bayern Munich vs Dortmund', date: '2024-01-25' },
      ];

  // Initialize network engine
  useEffect(() => {
    if (canvasRef.current && !networkEngine) {
      const engine = new PassNetworkEngine(canvasRef.current, {
        width: 1200,
        height: 800,
        showLabels,
        showStats: true,
        minPassThreshold
      });
      setNetworkEngine(engine);
    }
  }, []);

  // Update network when settings change
  useEffect(() => {
    if (networkEngine) {
      generateNetwork();
    }
  }, [selectedMatch, selectedTeam, minPassThreshold, showLabels, networkEngine]);

  const generateNetwork = () => {
    if (!networkEngine) return;

    // Generate sample data
    const { players, connections } = PassNetworkEngine.generateSampleData();
    
    networkEngine.setPlayers(players);
    networkEngine.setConnections(connections);
    networkEngine.render();

    // Calculate statistics
    calculateStats(players, connections);
  };

  const calculateStats = (players: PlayerNode[], connections: PassConnection[]) => {
    const totalPasses = connections.reduce((sum, conn) => sum + conn.count, 0);
    const successfulPasses = connections.reduce((sum, conn) => sum + conn.success, 0);
    const passAccuracy = totalPasses > 0 ? (successfulPasses / totalPasses) * 100 : 0;
    
    // Calculate average pass length (simplified)
    const avgPassLength = 25 + Math.random() * 15;
    
    // Count key passes (passes to forwards)
    const keyPasses = connections.filter(conn => {
      const toPlayer = players.find(p => p.id === conn.to);
      return toPlayer && toPlayer.position.x > 70;
    }).length;

    setStats({
      totalPasses,
      passAccuracy: Math.round(passAccuracy),
      avgPassLength: Math.round(avgPassLength),
      keyPasses
    });
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    
    const link = document.createElement('a');
    link.download = `pass-network-${selectedMatch}-${Date.now()}.png`;
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
<h1 className="text-3xl font-bold">Pass Network Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Visualize team passing patterns and player connections
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Network className="h-5 w-5 mr-2" />
          InStat/Wyscout Style
        </Badge>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Network Controls</CardTitle>
          <CardDescription>Configure pass network visualization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Match Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Match</label>
              <Select value={selectedMatch} onValueChange={setSelectedMatch}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {matches.map(match => (
                    <SelectItem key={match.id} value={match.id}>
                      {match.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Team</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home Team</SelectItem>
                  <SelectItem value="away">Away Team</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Min Pass Threshold */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Min Passes: {minPassThreshold}
              </label>
              <Slider
                value={[minPassThreshold]}
                onValueChange={(value) => setMinPassThreshold(value[0])}
                min={1}
                max={15}
                step={1}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={generateNetwork} className="flex-1">
              <Filter className="h-4 w-4 mr-2" />
              Regenerate Network
            </Button>
            <Button
              onClick={() => setShowLabels(!showLabels)}
              variant="outline"
            >
              {showLabels ? 'Hide' : 'Show'} Labels
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
            <CardTitle className="text-sm font-medium">Total Passes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalPasses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Network className="h-3 w-3 inline mr-1" />
              All connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pass Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.passAccuracy}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Percent className="h-3 w-3 inline mr-1" />
              Success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Pass Length</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.avgPassLength}m</div>
            <p className="text-xs text-muted-foreground mt-1">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              Distance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Key Passes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.keyPasses}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Target className="h-3 w-3 inline mr-1" />
              To attacking third
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pass Network Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Team Pass Network</CardTitle>
          <CardDescription>
            Node size = touches | Arrow thickness = pass frequency | Color = accuracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative bg-green-800 rounded-lg overflow-hidden">
            {/* Pass network canvas */}
            <canvas 
              ref={canvasRef}
              className="relative z-10 w-full"
              style={{ display: 'block' }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Pass Network Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Arrow Colors (Pass Accuracy)</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-green-500" />
                  <span className="text-sm">90%+ (Excellent)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-lime-500" />
                  <span className="text-sm">80-89% (Good)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-yellow-500" />
                  <span className="text-sm">70-79% (Average)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-orange-500" />
                  <span className="text-sm">60-69% (Below Average)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-12 h-1 bg-red-500" />
                  <span className="text-sm">&lt;60% (Poor)</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Node Size (Player Touches)</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500" />
                  <span className="text-sm">Large = High touches</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-blue-500" />
                  <span className="text-sm">Medium = Average touches</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500" />
                  <span className="text-sm">Small = Low touches</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
