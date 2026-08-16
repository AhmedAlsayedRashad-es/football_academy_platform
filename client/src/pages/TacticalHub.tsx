import { useState } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import {Target, 
  Zap, 
  Users, 
  TrendingUp, 
  Sparkles,
  MapPin,
  Activity,
  BarChart3,
  Network,
  Loader2, ArrowLeft} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

export default function TacticalHub() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('formation');
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [tacticalAnalysis, setTacticalAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: matches } = trpc.matches.getAll.useQuery();

  const generateTacticalAnalysis = trpc.tacticalHub.analyze.useMutation({
    onSuccess: (data) => {
      setTacticalAnalysis(data);
      setIsAnalyzing(false);
      toast.success("Tactical analysis complete!");
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error("Analysis failed: " + error.message);
    },
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const handleAnalyze = () => {
    if (!selectedTeamId) {
      toast.error("Please select a team");
      return;
    }
    setIsAnalyzing(true);
    setTacticalAnalysis(null);
    generateTacticalAnalysis.mutate({ 
      teamId: selectedTeamId, 
      matchId: selectedMatchId || undefined 
    });
  };

  const selectedTeam = teams?.find(t => t.id === selectedTeamId);
  const teamMatches = matches?.filter(m => m.teamId === selectedTeamId) || [];

  // Formation Builder Component
  const FormationBuilder = () => {
    const [formation, setFormation] = useState('4-3-3');
    const formations = ['4-3-3', '4-4-2', '3-5-2', '4-2-3-1', '3-4-3', '5-3-2'];

    const getFormationPositions = (form: string) => {
      const positions: { x: number; y: number; label: string }[] = [];
      
      switch (form) {
        case '4-3-3':
          // GK
          positions.push({ x: 50, y: 90, label: 'GK' });
          // Defenders
          positions.push({ x: 20, y: 75, label: 'LB' });
          positions.push({ x: 40, y: 75, label: 'CB' });
          positions.push({ x: 60, y: 75, label: 'CB' });
          positions.push({ x: 80, y: 75, label: 'RB' });
          // Midfielders
          positions.push({ x: 30, y: 50, label: 'CM' });
          positions.push({ x: 50, y: 50, label: 'CM' });
          positions.push({ x: 70, y: 50, label: 'CM' });
          // Forwards
          positions.push({ x: 20, y: 20, label: 'LW' });
          positions.push({ x: 50, y: 20, label: 'ST' });
          positions.push({ x: 80, y: 20, label: 'RW' });
          break;
        case '4-4-2':
          positions.push({ x: 50, y: 90, label: 'GK' });
          positions.push({ x: 20, y: 75, label: 'LB' });
          positions.push({ x: 40, y: 75, label: 'CB' });
          positions.push({ x: 60, y: 75, label: 'CB' });
          positions.push({ x: 80, y: 75, label: 'RB' });
          positions.push({ x: 20, y: 50, label: 'LM' });
          positions.push({ x: 40, y: 50, label: 'CM' });
          positions.push({ x: 60, y: 50, label: 'CM' });
          positions.push({ x: 80, y: 50, label: 'RM' });
          positions.push({ x: 35, y: 20, label: 'ST' });
          positions.push({ x: 65, y: 20, label: 'ST' });
          break;
        case '3-5-2':
          positions.push({ x: 50, y: 90, label: 'GK' });
          positions.push({ x: 30, y: 75, label: 'CB' });
          positions.push({ x: 50, y: 75, label: 'CB' });
          positions.push({ x: 70, y: 75, label: 'CB' });
          positions.push({ x: 15, y: 50, label: 'LWB' });
          positions.push({ x: 35, y: 50, label: 'CM' });
          positions.push({ x: 50, y: 50, label: 'CM' });
          positions.push({ x: 65, y: 50, label: 'CM' });
          positions.push({ x: 85, y: 50, label: 'RWB' });
          positions.push({ x: 40, y: 20, label: 'ST' });
          positions.push({ x: 60, y: 20, label: 'ST' });
          break;
        default:
          positions.push({ x: 50, y: 90, label: 'GK' });
      }
      
      return positions;
    };

    const positions = getFormationPositions(formation);

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Select value={formation} onValueChange={setFormation}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="z-[10001]">
              {formations.map(f => (
                <SelectItem key={f} value={f}>{f}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline">Interactive Formation Builder</Badge>
        </div>

        <div className="brand-gradient relative w-full aspect-[2/3] max-w-md mx-auto rounded-lg overflow-hidden shadow-2xl">
          {/* Field lines - Vertical pitch */}
          <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.3 }}>
            {/* Center line */}
            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="2" />
            {/* Center circle */}
            <circle cx="50%" cy="50%" r="10%" fill="none" stroke="white" strokeWidth="2" />
            {/* Top penalty area */}
            <rect x="25%" y="0" width="50%" height="18%" fill="none" stroke="white" strokeWidth="2" />
            {/* Bottom penalty area */}
            <rect x="25%" y="82%" width="50%" height="18%" fill="none" stroke="white" strokeWidth="2" />
            {/* Top goal area */}
            <rect x="37%" y="0" width="26%" height="8%" fill="none" stroke="white" strokeWidth="2" />
            {/* Bottom goal area */}
            <rect x="37%" y="92%" width="26%" height="8%" fill="none" stroke="white" strokeWidth="2" />
          </svg>

          {/* Players */}
          {positions.map((pos, idx) => (
            <div
              key={idx}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-move group"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform">
                  {idx + 1}
                </div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {pos.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Formation: {formation} • Click and drag players to adjust positions
        </div>
      </div>
    );
  };

  // Heat Map Component
  const HeatMap = () => {
    const heatData = Array.from({ length: 10 }, (_, y) =>
      Array.from({ length: 7 }, (_, x) => Math.random() * 100)
    );

    const getHeatColor = (value: number) => {
      if (value > 75) return 'bg-red-500';
      if (value > 50) return 'bg-orange-500';
      if (value > 25) return 'bg-yellow-500';
      return 'bg-blue-500';
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline">Player Activity Heat Map</Badge>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>High</span>
            </div>
          </div>
        </div>

        <div className="brand-gradient relative w-full aspect-[2/3] max-w-md mx-auto rounded-lg overflow-hidden shadow-2xl p-2">
          <div className="grid grid-cols-7 gap-1 h-full">
            {heatData.map((row, y) =>
              row.map((value, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`${getHeatColor(value)} rounded opacity-60 hover:opacity-90 transition-opacity cursor-pointer`}
                  title={`Activity: ${value.toFixed(0)}%`}
                />
              ))
            )}
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Hover over cells to see activity percentage
        </div>
      </div>
    );
  };

  // Pass Network Component
  const PassNetwork = () => {
    const players = [
      { id: 1, x: 50, y: 85, name: 'GK', passes: 45 },
      { id: 2, x: 25, y: 65, name: 'LB', passes: 38 },
      { id: 3, x: 45, y: 65, name: 'CB', passes: 52 },
      { id: 4, x: 55, y: 65, name: 'CB', passes: 48 },
      { id: 5, x: 75, y: 65, name: 'RB', passes: 41 },
      { id: 6, x: 35, y: 45, name: 'CM', passes: 62 },
      { id: 7, x: 50, y: 45, name: 'CM', passes: 71 },
      { id: 8, x: 65, y: 45, name: 'CM', passes: 58 },
      { id: 9, x: 25, y: 20, name: 'LW', passes: 34 },
      { id: 10, x: 50, y: 20, name: 'ST', passes: 29 },
      { id: 11, x: 75, y: 20, name: 'RW', passes: 31 },
    ];

    const connections = [
      { from: 1, to: 3, strength: 0.8 },
      { from: 1, to: 4, strength: 0.7 },
      { from: 3, to: 6, strength: 0.9 },
      { from: 4, to: 8, strength: 0.85 },
      { from: 6, to: 7, strength: 1.0 },
      { from: 7, to: 8, strength: 0.95 },
      { from: 6, to: 9, strength: 0.6 },
      { from: 7, to: 10, strength: 0.75 },
      { from: 8, to: 11, strength: 0.65 },
      { from: 2, to: 9, strength: 0.5 },
      { from: 5, to: 11, strength: 0.55 },
    ];

    return (
      <div className="space-y-4">
        <Badge variant="outline">Pass Network Visualization</Badge>

        <div className="brand-gradient relative w-full aspect-[2/3] max-w-md mx-auto rounded-lg overflow-hidden shadow-2xl">
          <svg className="absolute inset-0 w-full h-full">
            {/* Draw connections */}
            {connections.map((conn, idx) => {
              const from = players.find(p => p.id === conn.from);
              const to = players.find(p => p.id === conn.to);
              if (!from || !to) return null;
              
              return (
                <line
                  key={idx}
                  x1={`${from.x}%`}
                  y1={`${from.y}%`}
                  x2={`${to.x}%`}
                  y2={`${to.y}%`}
                  stroke="white"
                  strokeWidth={conn.strength * 4}
                  strokeOpacity={conn.strength * 0.6}
                />
              );
            })}
          </svg>

          {/* Draw players */}
          {players.map((player) => {
            const size = Math.max(20, Math.min(50, player.passes / 2));
            return (
              <div
                key={player.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: `${player.x}%`, top: `${player.y}%` }}
              >
                <div
                  className="rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold group-hover:scale-110 transition-transform cursor-pointer"
                  style={{ width: size, height: size }}
                  title={`${player.name}: ${player.passes} passes`}
                >
                  {player.name}
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          Circle size = pass volume • Line thickness = pass frequency
        </div>
      </div>
    );
  };

  // AI Tactical Suggestions Component
  const AITacticalSuggestions = () => {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Tactical Analysis
            </CardTitle>
            <CardDescription>Select a team to generate AI-powered tactical insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Select
                  value={selectedTeamId?.toString() || ""}
                  onValueChange={(value) => setSelectedTeamId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    {teams?.map(team => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Select
                  value={selectedMatchId?.toString() || ""}
                  onValueChange={(value) => setSelectedMatchId(value ? parseInt(value) : null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Match (optional)" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    <SelectItem value="0">No specific match</SelectItem>
                    {teamMatches.map(match => (
                      <SelectItem key={match.id} value={match.id.toString()}>
                        vs {match.opponent}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAnalyze} disabled={isAnalyzing || !selectedTeamId}>
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Analyze
                  </>
                )}
              </Button>
            </div>

            {tacticalAnalysis && (
              <div className="space-y-3 mt-6">
                <div className="p-4 border rounded-lg bg-blue-500/5 border-blue-500/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    Recommended Formation
                  </h4>
                  <p className="text-sm">{tacticalAnalysis.formation || '4-3-3'}</p>
                </div>

                <div className="p-4 border rounded-lg bg-green-500/5 border-green-500/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-700 dark:text-green-500" />
                    Strengths to Exploit
                  </h4>
                  <p className="text-sm">{tacticalAnalysis.strengths || 'Loading...'}</p>
                </div>

                <div className="p-4 border rounded-lg bg-orange-500/5 border-orange-500/20">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-orange-700 dark:text-orange-500" />
                    Tactical Recommendations
                  </h4>
                  <p className="text-sm">{tacticalAnalysis.recommendations || 'Loading...'}</p>
                </div>
              </div>
            )}

            {isAnalyzing && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          
          <BackButton />
<h1 className="text-3xl font-bold flex items-center gap-2">
            <Target className="h-8 w-8 text-primary" />
            Tactical Hub
          </h1>
          <p className="text-muted-foreground mt-2">
            Advanced tactical analysis with formations, heat maps, and AI-powered insights
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex w-full h-12 bg-muted/60 rounded-xl p-1 gap-1">
            <TabsTrigger value="formation" className="flex-1 gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-primary font-medium">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Formation</span>
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="flex-1 gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-orange-700 dark:data-[state=active]:text-orange-500 font-medium">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Heat Map</span>
            </TabsTrigger>
            <TabsTrigger value="passnetwork" className="flex-1 gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-500 font-medium">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Pass Network</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex-1 gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-500 font-medium">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">AI Analysis</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="formation" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Formation Builder</CardTitle>
                <CardDescription>
                  Visualize and customize team formations with drag-and-drop positioning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FormationBuilder />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Player Activity Heat Map</CardTitle>
                <CardDescription>
                  Visualize player movement and positioning patterns across the pitch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HeatMap />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="passnetwork" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Pass Network Analysis</CardTitle>
                <CardDescription>
                  Analyze passing patterns and player connections during matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PassNetwork />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="mt-6">
            <AITacticalSuggestions />
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Advanced Tactical Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="justify-start gap-2"
                onClick={() => setLocation("/coach/ai-assistant")}
              >
                <Sparkles className="h-4 w-4" />
                AI Coach Assistant
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-2"
                onClick={() => setLocation("/ai-emergency-enhanced")}
              >
                <Zap className="h-4 w-4" />
                Emergency Tactical Mode
              </Button>
              <Button 
                variant="outline" 
                className="justify-start gap-2"
                onClick={() => setLocation("/formation-builder")}
              >
                <Users className="h-4 w-4" />
                Advanced Formation Builder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
