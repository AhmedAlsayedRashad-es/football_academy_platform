import { useState } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, BookOpen, Zap, Shield, Target, Plus, Download } from 'lucide-react';
import TacticalScenario, { TacticalScenarioData } from '@/components/TacticalScenario';
import CustomScenarioBuilder from '@/components/CustomScenarioBuilder';
import MatchScenarioIntegration from '@/components/MatchScenarioIntegration';
import TacticalExportTools from '@/components/TacticalExportTools';
import { useLanguage } from '@/contexts/LanguageContext';

// Pre-defined tactical scenarios
const TACTICAL_SCENARIOS: TacticalScenarioData[] = [
  {
    id: 'counter_attack_433',
    name: '4-3-3 Counter-Attack',
    description: 'Quick transition from defense to attack with wingers making runs behind the defensive line',
    formation: '4-3-3',
    duration: 8,
    initialPositions: [
      { x: 50, y: 90, role: 'GK' },
      { x: 20, y: 75, role: 'RB', number: 2 },
      { x: 40, y: 75, role: 'CB', number: 4 },
      { x: 60, y: 75, role: 'CB', number: 5 },
      { x: 80, y: 75, role: 'LB', number: 3 },
      { x: 35, y: 55, role: 'CDM', number: 6 },
      { x: 50, y: 50, role: 'CM', number: 8 },
      { x: 65, y: 55, role: 'CM', number: 10 },
      { x: 15, y: 30, role: 'RW', number: 7 },
      { x: 50, y: 25, role: 'ST', number: 9 },
      { x: 85, y: 30, role: 'LW', number: 11 },
    ],
    movements: [
      {
        playerId: 1,
        role: 'GK',
        color: '#3b82f6',
        path: [
          { x: 50, y: 90, timestamp: 0 },
          { x: 50, y: 85, timestamp: 2 },
          { x: 50, y: 90, timestamp: 8 },
        ],
      },
      {
        playerId: 7,
        role: 'RW',
        color: '#10b981',
        path: [
          { x: 15, y: 30, timestamp: 0 },
          { x: 15, y: 40, timestamp: 2 },
          { x: 15, y: 15, timestamp: 6 },
          { x: 20, y: 10, timestamp: 8 },
        ],
      },
      {
        playerId: 9,
        role: 'ST',
        color: '#10b981',
        path: [
          { x: 50, y: 25, timestamp: 0 },
          { x: 50, y: 35, timestamp: 2 },
          { x: 50, y: 12, timestamp: 6 },
          { x: 50, y: 8, timestamp: 8 },
        ],
      },
      {
        playerId: 11,
        role: 'LW',
        color: '#10b981',
        path: [
          { x: 85, y: 30, timestamp: 0 },
          { x: 85, y: 40, timestamp: 2 },
          { x: 85, y: 15, timestamp: 6 },
          { x: 80, y: 10, timestamp: 8 },
        ],
      },
      {
        playerId: 8,
        role: 'CM',
        color: '#3b82f6',
        path: [
          { x: 50, y: 50, timestamp: 0 },
          { x: 50, y: 55, timestamp: 2 },
          { x: 50, y: 35, timestamp: 6 },
          { x: 50, y: 30, timestamp: 8 },
        ],
      },
    ],
    arrows: [
      { from: { x: 50, y: 85 }, to: { x: 50, y: 55 }, type: 'pass' },
      { from: { x: 50, y: 55 }, to: { x: 50, y: 25 }, type: 'pass' },
      { from: { x: 15, y: 40 }, to: { x: 15, y: 15 }, type: 'run' },
      { from: { x: 85, y: 40 }, to: { x: 85, y: 15 }, type: 'run' },
    ],
  },
  {
    id: 'high_press_442',
    name: '4-4-2 High Pressing',
    description: 'Coordinated pressing from forwards and midfielders to win the ball in the attacking third',
    formation: '4-4-2',
    duration: 6,
    initialPositions: [
      { x: 50, y: 90, role: 'GK' },
      { x: 20, y: 70, role: 'RB', number: 2 },
      { x: 40, y: 70, role: 'CB', number: 4 },
      { x: 60, y: 70, role: 'CB', number: 5 },
      { x: 80, y: 70, role: 'LB', number: 3 },
      { x: 20, y: 45, role: 'RM', number: 7 },
      { x: 40, y: 45, role: 'CM', number: 6 },
      { x: 60, y: 45, role: 'CM', number: 8 },
      { x: 80, y: 45, role: 'LM', number: 11 },
      { x: 40, y: 20, role: 'ST', number: 9 },
      { x: 60, y: 20, role: 'ST', number: 10 },
    ],
    movements: [
      {
        playerId: 9,
        role: 'ST',
        color: '#ef4444',
        path: [
          { x: 40, y: 20, timestamp: 0 },
          { x: 35, y: 12, timestamp: 2 },
          { x: 30, y: 8, timestamp: 4 },
          { x: 28, y: 6, timestamp: 6 },
        ],
      },
      {
        playerId: 10,
        role: 'ST',
        color: '#ef4444',
        path: [
          { x: 60, y: 20, timestamp: 0 },
          { x: 65, y: 12, timestamp: 2 },
          { x: 70, y: 8, timestamp: 4 },
          { x: 72, y: 6, timestamp: 6 },
        ],
      },
      {
        playerId: 6,
        role: 'CM',
        color: '#ef4444',
        path: [
          { x: 40, y: 45, timestamp: 0 },
          { x: 40, y: 35, timestamp: 2 },
          { x: 40, y: 25, timestamp: 4 },
          { x: 40, y: 20, timestamp: 6 },
        ],
      },
      {
        playerId: 8,
        role: 'CM',
        color: '#ef4444',
        path: [
          { x: 60, y: 45, timestamp: 0 },
          { x: 60, y: 35, timestamp: 2 },
          { x: 60, y: 25, timestamp: 4 },
          { x: 60, y: 20, timestamp: 6 },
        ],
      },
    ],
    arrows: [
      { from: { x: 40, y: 20 }, to: { x: 30, y: 8 }, type: 'press' },
      { from: { x: 60, y: 20 }, to: { x: 70, y: 8 }, type: 'press' },
      { from: { x: 40, y: 45 }, to: { x: 40, y: 25 }, type: 'press' },
      { from: { x: 60, y: 45 }, to: { x: 60, y: 25 }, type: 'press' },
    ],
  },
  {
    id: 'buildup_352',
    name: '3-5-2 Build-Up Play',
    description: 'Patient build-up from the back with wing-backs providing width and midfield overload',
    formation: '3-5-2',
    duration: 10,
    initialPositions: [
      { x: 50, y: 90, role: 'GK' },
      { x: 25, y: 75, role: 'CB', number: 4 },
      { x: 50, y: 75, role: 'CB', number: 5 },
      { x: 75, y: 75, role: 'CB', number: 6 },
      { x: 15, y: 50, role: 'RWB', number: 2 },
      { x: 35, y: 55, role: 'CM', number: 8 },
      { x: 50, y: 50, role: 'CDM', number: 6 },
      { x: 65, y: 55, role: 'CM', number: 10 },
      { x: 85, y: 50, role: 'LWB', number: 3 },
      { x: 40, y: 25, role: 'ST', number: 9 },
      { x: 60, y: 25, role: 'ST', number: 11 },
    ],
    movements: [
      {
        playerId: 2,
        role: 'RWB',
        color: '#10b981',
        path: [
          { x: 15, y: 50, timestamp: 0 },
          { x: 15, y: 45, timestamp: 3 },
          { x: 15, y: 30, timestamp: 7 },
          { x: 15, y: 20, timestamp: 10 },
        ],
      },
      {
        playerId: 3,
        role: 'LWB',
        color: '#10b981',
        path: [
          { x: 85, y: 50, timestamp: 0 },
          { x: 85, y: 45, timestamp: 3 },
          { x: 85, y: 30, timestamp: 7 },
          { x: 85, y: 20, timestamp: 10 },
        ],
      },
      {
        playerId: 8,
        role: 'CM',
        color: '#3b82f6',
        path: [
          { x: 35, y: 55, timestamp: 0 },
          { x: 35, y: 50, timestamp: 3 },
          { x: 35, y: 40, timestamp: 7 },
          { x: 35, y: 35, timestamp: 10 },
        ],
      },
    ],
    arrows: [
      { from: { x: 50, y: 85 }, to: { x: 50, y: 75 }, type: 'pass' },
      { from: { x: 50, y: 75 }, to: { x: 50, y: 50 }, type: 'pass' },
      { from: { x: 50, y: 50 }, to: { x: 35, y: 55 }, type: 'pass' },
      { from: { x: 15, y: 50 }, to: { x: 15, y: 30 }, type: 'run' },
      { from: { x: 85, y: 50 }, to: { x: 85, y: 30 }, type: 'run' },
    ],
  },
  {
    id: 'corner_kick_attack',
    name: 'Corner Kick - Near Post Attack',
    description: 'Attacking corner with near post flick-on and runners at the back post',
    formation: 'Set Piece',
    duration: 5,
    initialPositions: [
      { x: 90, y: 10, role: 'Corner', number: 7 },
      { x: 35, y: 12, role: 'Near', number: 9 },
      { x: 50, y: 15, role: 'Center', number: 4 },
      { x: 65, y: 12, role: 'Far', number: 5 },
      { x: 45, y: 25, role: 'Edge', number: 10 },
      { x: 55, y: 25, role: 'Edge', number: 8 },
    ],
    movements: [
      {
        playerId: 9,
        role: 'Near',
        color: '#10b981',
        path: [
          { x: 35, y: 12, timestamp: 0 },
          { x: 30, y: 10, timestamp: 2 },
          { x: 28, y: 8, timestamp: 3 },
        ],
      },
      {
        playerId: 5,
        role: 'Far',
        color: '#10b981',
        path: [
          { x: 65, y: 12, timestamp: 0 },
          { x: 70, y: 10, timestamp: 2 },
          { x: 75, y: 8, timestamp: 3 },
          { x: 78, y: 6, timestamp: 5 },
        ],
      },
      {
        playerId: 10,
        role: 'Edge',
        color: '#10b981',
        path: [
          { x: 45, y: 25, timestamp: 0 },
          { x: 45, y: 20, timestamp: 2 },
          { x: 45, y: 12, timestamp: 4 },
        ],
      },
    ],
    arrows: [
      { from: { x: 90, y: 10 }, to: { x: 30, y: 10 }, type: 'pass' },
      { from: { x: 30, y: 10 }, to: { x: 75, y: 8 }, type: 'pass' },
    ],
  },
];

export default function TacticalSimulationLab() {
  const { t, language } = useLanguage();
  const [selectedScenario, setSelectedScenario] = useState<TacticalScenarioData | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [secondScenario, setSecondScenario] = useState<TacticalScenarioData | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // Live data: teams and their saved formations
  const { data: teams = [] } = trpc.teams.getAll.useQuery();
  const selectedTeamIdNum = selectedTeamId ? parseInt(selectedTeamId) : undefined;
  const { data: savedFormations = [] } = trpc.tactics.getFormationsByTeam.useQuery(
    { teamId: selectedTeamIdNum! },
    { enabled: !!selectedTeamIdNum }
  );

  return (
    <>
    <div >
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/advanced-tactical-hub">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Tactical Simulation Lab</h1>
              <p className="text-muted-foreground">
                Visualize and analyze tactical scenarios with animated player movements
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {teams.length > 0 && (
              <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                <SelectTrigger className="w-44 h-9 text-sm">
                  <SelectValue placeholder="Filter by team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              variant={comparisonMode ? 'default' : 'outline'}
              onClick={() => setComparisonMode(!comparisonMode)}
            >
              {comparisonMode ? 'Single View' : 'Compare Scenarios'}
            </Button>
          </div>
        </div>

        {/* Tabs for different categories */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              <BookOpen className="h-4 w-4 mr-2" />
              All Scenarios
            </TabsTrigger>
            <TabsTrigger value="attacking">
              <Target className="h-4 w-4 mr-2" />
              Attacking
            </TabsTrigger>
            <TabsTrigger value="defending">
              <Shield className="h-4 w-4 mr-2" />
              Defending
            </TabsTrigger>
            <TabsTrigger value="setpieces">
              <Zap className="h-4 w-4 mr-2" />
              Set Pieces
            </TabsTrigger>
            <TabsTrigger value="create">
              <Plus className="h-4 w-4 mr-2" />
              Create Custom
            </TabsTrigger>
            <TabsTrigger value="match">
              <Target className="h-4 w-4 mr-2" />
              Match Analysis
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export & Share
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Scenario Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TACTICAL_SCENARIOS.map(scenario => (
                <Card
                  key={scenario.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => {
                    if (comparisonMode && !selectedScenario) {
                      setSelectedScenario(scenario);
                    } else if (comparisonMode && selectedScenario) {
                      setSecondScenario(scenario);
                    } else {
                      setSelectedScenario(scenario);
                    }
                  }}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{scenario.name}</span>
                      <Play className="h-4 w-4" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="px-2 py-1 bg-secondary rounded">{scenario.formation}</span>
                      <span>{scenario.duration}s</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Simulation Display */}
            {selectedScenario && !comparisonMode && (
              <div className="mt-8">
                <TacticalScenario scenario={selectedScenario} width={600} height={900} />
              </div>
            )}

            {/* Comparison Mode */}
            {comparisonMode && (selectedScenario || secondScenario) && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold mb-4">Scenario Comparison</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {selectedScenario && (
                    <TacticalScenario scenario={selectedScenario} width={500} height={750} />
                  )}
                  {secondScenario && (
                    <TacticalScenario scenario={secondScenario} width={500} height={750} />
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="attacking">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TACTICAL_SCENARIOS.filter(s => s.id.includes('counter') || s.id.includes('buildup')).map(scenario => (
                <Card
                  key={scenario.id}
                  className="cursor-pointer hover:border-primary"
                  onClick={() => setSelectedScenario(scenario)}
                >
                  <CardHeader>
                    <CardTitle>{scenario.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="defending">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TACTICAL_SCENARIOS.filter(s => s.id.includes('press')).map(scenario => (
                <Card
                  key={scenario.id}
                  className="cursor-pointer hover:border-primary"
                  onClick={() => setSelectedScenario(scenario)}
                >
                  <CardHeader>
                    <CardTitle>{scenario.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="setpieces">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TACTICAL_SCENARIOS.filter(s => s.id.includes('corner') || s.id.includes('kick')).map(scenario => (
                <Card
                  key={scenario.id}
                  className="cursor-pointer hover:border-primary"
                  onClick={() => setSelectedScenario(scenario)}
                >
                  <CardHeader>
                    <CardTitle>{scenario.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="create">
            <CustomScenarioBuilder />
          </TabsContent>

          <TabsContent value="match">
            {selectedScenario ? (
              <MatchScenarioIntegration scenario={selectedScenario} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Please select a scenario from the "All Scenarios" tab first
              </div>
            )}
          </TabsContent>

          <TabsContent value="export">
            <TacticalExportTools scenarios={TACTICAL_SCENARIOS} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
    </>
  );
}
