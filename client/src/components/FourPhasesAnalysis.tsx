import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowRight, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Target,
  Shield,
  Zap
} from "lucide-react";

export type MatchPhase = "in_possession" | "out_possession" | "attacking_transition" | "defensive_transition";
export type PitchZone = "build_up" | "progression" | "finishing";

interface PhaseEvent {
  type: string;
  phase: MatchPhase;
  zone?: PitchZone;
  x: number;
  y: number;
  [key: string]: any;
}

interface FourPhasesAnalysisProps {
  events: PhaseEvent[];
}

export function FourPhasesAnalysis({ events }: FourPhasesAnalysisProps) {
  // Calculate phase statistics
  const getPhaseStats = (phase: MatchPhase) => {
    const phaseEvents = events.filter(e => e.phase === phase);
    const shots = phaseEvents.filter(e => e.type === "shot");
    const passes = phaseEvents.filter(e => e.type === "pass");
    const defensive = phaseEvents.filter(e => e.type === "defensive");
    
    return {
      total: phaseEvents.length,
      shots: shots.length,
      passes: passes.length,
      defensive: defensive.length,
      passCompletion: passes.length > 0 
        ? ((passes.filter(p => p.completed).length / passes.length) * 100).toFixed(1)
        : "0.0",
    };
  };

  // Calculate zone statistics
  const getZoneStats = (zone: PitchZone) => {
    const zoneEvents = events.filter(e => e.zone === zone);
    const shots = zoneEvents.filter(e => e.type === "shot");
    const passes = zoneEvents.filter(e => e.type === "pass");
    
    return {
      total: zoneEvents.length,
      shots: shots.length,
      passes: passes.length,
      passCompletion: passes.length > 0 
        ? ((passes.filter(p => p.completed).length / passes.length) * 100).toFixed(1)
        : "0.0",
      totalXG: shots.reduce((sum, s) => sum + (s.xG || 0), 0).toFixed(2),
    };
  };

  const inPossessionStats = getPhaseStats("in_possession");
  const outPossessionStats = getPhaseStats("out_possession");
  const attackingTransitionStats = getPhaseStats("attacking_transition");
  const defensiveTransitionStats = getPhaseStats("defensive_transition");

  const buildUpStats = getZoneStats("build_up");
  const progressionStats = getZoneStats("progression");
  const finishingStats = getZoneStats("finishing");

  return (
    <div className="space-y-6">
      {/* Four Phases Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Four Phases of Play Analysis
          </CardTitle>
          <CardDescription>
            Tactical analysis framework breaking down match into four distinct phases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="in_possession" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="in_possession" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                In Possession
              </TabsTrigger>
              <TabsTrigger value="out_possession" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Out of Possession
              </TabsTrigger>
              <TabsTrigger value="attacking_transition" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                Attack Transition
              </TabsTrigger>
              <TabsTrigger value="defensive_transition" className="text-xs">
                <TrendingDown className="h-3 w-3 mr-1" />
                Defense Transition
              </TabsTrigger>
            </TabsList>

            <TabsContent value="in_possession" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Actions</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{inPossessionStats.total}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Passes</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{inPossessionStats.passes}</p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Shots</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{inPossessionStats.shots}</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Pass Accuracy</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{inPossessionStats.passCompletion}%</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Key Principles</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Build-up patterns and player positioning</li>
                  <li>• Progression through the thirds</li>
                  <li>• Creating and finishing chances</li>
                  <li>• Maintaining possession under pressure</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="out_possession" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Actions</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{outPossessionStats.total}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Defensive Actions</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{outPossessionStats.defensive}</p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Interceptions</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {events.filter(e => e.phase === "out_possession" && e.actionType === "interception").length}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Tackles</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {events.filter(e => e.phase === "out_possession" && e.actionType === "tackle").length}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Key Principles</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Defensive shape and organization</li>
                  <li>• Pressing triggers and intensity</li>
                  <li>• Compactness and defensive lines</li>
                  <li>• Ball recovery locations</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="attacking_transition" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Actions</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">{attackingTransitionStats.total}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Quick Passes</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{attackingTransitionStats.passes}</p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Counter Shots</p>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{attackingTransitionStats.shots}</p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Pass Accuracy</p>
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{attackingTransitionStats.passCompletion}%</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Key Principles</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Speed of counter-attack execution</li>
                  <li>• Forward runs and support play</li>
                  <li>• Exploiting defensive disorganization</li>
                  <li>• Decision-making in transition moments</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="defensive_transition" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Total Actions</p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">{defensiveTransitionStats.total}</p>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Counter-Press</p>
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{defensiveTransitionStats.defensive}</p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Recoveries</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {events.filter(e => e.phase === "defensive_transition" && e.success).length}
                  </p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {defensiveTransitionStats.defensive > 0 
                      ? ((events.filter(e => e.phase === "defensive_transition" && e.success).length / defensiveTransitionStats.defensive) * 100).toFixed(0)
                      : "0"}%
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Key Principles</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Immediate pressure after losing possession</li>
                  <li>• Delaying opponent's counter-attack</li>
                  <li>• Recovering defensive shape quickly</li>
                  <li>• Preventing dangerous counter opportunities</li>
                </ul>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Pitch Zone Division */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Pitch Zone Division Analysis
          </CardTitle>
          <CardDescription>
            Breaking down actions by Build Up, Progression, and Finishing zones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Build Up Zone */}
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-900 dark:text-blue-100">Build Up Zone</CardTitle>
                <CardDescription className="text-xs text-blue-700 dark:text-blue-300">
                  Defensive third (0-33%)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Actions</p>
                    <p className="text-xl font-bold">{buildUpStats.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Passes</p>
                    <p className="text-xl font-bold">{buildUpStats.passes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pass Accuracy</p>
                    <p className="text-xl font-bold">{buildUpStats.passCompletion}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Shots</p>
                    <p className="text-xl font-bold">{buildUpStats.shots}</p>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-medium">Focus Areas:</p>
                  <ul className="text-muted-foreground space-y-0.5">
                    <li>• Playing out from the back</li>
                    <li>• Goalkeeper distribution</li>
                    <li>• +1 overload principles</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Progression Zone */}
            <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-green-900 dark:text-green-100">Progression Zone</CardTitle>
                <CardDescription className="text-xs text-green-700 dark:text-green-300">
                  Middle third (33-66%)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Actions</p>
                    <p className="text-xl font-bold">{progressionStats.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Passes</p>
                    <p className="text-xl font-bold">{progressionStats.passes}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pass Accuracy</p>
                    <p className="text-xl font-bold">{progressionStats.passCompletion}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Shots</p>
                    <p className="text-xl font-bold">{progressionStats.shots}</p>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-medium">Focus Areas:</p>
                  <ul className="text-muted-foreground space-y-0.5">
                    <li>• Breaking defensive lines</li>
                    <li>• Vertical progression</li>
                    <li>• Positional rotations</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Finishing Zone */}
            <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-orange-900 dark:text-orange-100">Finishing Zone</CardTitle>
                <CardDescription className="text-xs text-orange-700 dark:text-orange-300">
                  Attacking third (66-100%)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Actions</p>
                    <p className="text-xl font-bold">{finishingStats.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Shots</p>
                    <p className="text-xl font-bold">{finishingStats.shots}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total xG</p>
                    <p className="text-xl font-bold">{finishingStats.totalXG}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Passes</p>
                    <p className="text-xl font-bold">{finishingStats.passes}</p>
                  </div>
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-medium">Focus Areas:</p>
                  <ul className="text-muted-foreground space-y-0.5">
                    <li>• Combination play</li>
                    <li>• Crosses and cut-backs</li>
                    <li>• Individual player traits</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
