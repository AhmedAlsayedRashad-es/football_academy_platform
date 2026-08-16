import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Navigation, 
  Shield, 
  TrendingUp,
  Activity,
  CheckCircle2,
  XCircle,
  Circle
} from "lucide-react";
import { useEffect, useState } from "react";

interface RealTimeStatsPanelProps {
  events: any[];
}

export function RealTimeStatsPanel({ events }: RealTimeStatsPanelProps) {
  const [stats, setStats] = useState({
    totalEvents: 0,
    shots: {
      total: 0,
      goals: 0,
      saved: 0,
      missed: 0,
      totalXG: 0,
      avgXG: 0,
    },
    passes: {
      total: 0,
      completed: 0,
      incomplete: 0,
      completionRate: 0,
      totalXA: 0,
      avgXA: 0,
    },
    defensive: {
      total: 0,
      successful: 0,
      failed: 0,
      successRate: 0,
      tackles: 0,
      interceptions: 0,
      blocks: 0,
      clearances: 0,
    },
    phases: {
      inPossession: 0,
      outPossession: 0,
      attackingTransition: 0,
      defensiveTransition: 0,
    },
    zones: {
      buildUp: 0,
      progression: 0,
      finishing: 0,
    },
  });

  // Recalculate stats whenever events change
  useEffect(() => {
    const shots = events.filter(e => e.type === "shot");
    const passes = events.filter(e => e.type === "pass");
    const defensive = events.filter(e => e.type === "defensive");

    const goals = shots.filter(s => s.outcome === "goal").length;
    const saved = shots.filter(s => s.outcome === "saved").length;
    const missed = shots.filter(s => s.outcome === "miss").length;
    const totalXG = shots.reduce((sum, s) => sum + (s.xG || 0), 0);

    const completedPasses = passes.filter(p => p.completed).length;
    const incompletePasses = passes.filter(p => !p.completed).length;
    const totalXA = passes.reduce((sum, p) => sum + (p.xA || 0), 0);

    const successfulDefensive = defensive.filter(d => d.success).length;
    const failedDefensive = defensive.filter(d => !d.success).length;

    const tackles = defensive.filter(d => d.actionType === "tackle").length;
    const interceptions = defensive.filter(d => d.actionType === "interception").length;
    const blocks = defensive.filter(d => d.actionType === "block").length;
    const clearances = defensive.filter(d => d.actionType === "clearance").length;

    const inPossession = events.filter(e => e.phase === "in_possession").length;
    const outPossession = events.filter(e => e.phase === "out_possession").length;
    const attackingTransition = events.filter(e => e.phase === "attacking_transition").length;
    const defensiveTransition = events.filter(e => e.phase === "defensive_transition").length;

    const buildUp = events.filter(e => e.zone === "build_up").length;
    const progression = events.filter(e => e.zone === "progression").length;
    const finishing = events.filter(e => e.zone === "finishing").length;

    setStats({
      totalEvents: events.length,
      shots: {
        total: shots.length,
        goals,
        saved,
        missed,
        totalXG,
        avgXG: shots.length > 0 ? totalXG / shots.length : 0,
      },
      passes: {
        total: passes.length,
        completed: completedPasses,
        incomplete: incompletePasses,
        completionRate: passes.length > 0 ? (completedPasses / passes.length) * 100 : 0,
        totalXA,
        avgXA: passes.length > 0 ? totalXA / passes.length : 0,
      },
      defensive: {
        total: defensive.length,
        successful: successfulDefensive,
        failed: failedDefensive,
        successRate: defensive.length > 0 ? (successfulDefensive / defensive.length) * 100 : 0,
        tackles,
        interceptions,
        blocks,
        clearances,
      },
      phases: {
        inPossession,
        outPossession,
        attackingTransition,
        defensiveTransition,
      },
      zones: {
        buildUp,
        progression,
        finishing,
      },
    });
  }, [events]);

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-primary" />
          Live Match Statistics
          <Badge variant="secondary" className="ml-auto">
            {stats.totalEvents} Events
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Shots Statistics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Target className="h-4 w-4 text-orange-600" />
            <span>Shots</span>
            <Badge variant="outline" className="ml-auto">{stats.shots.total}</Badge>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 bg-green-50 dark:bg-green-950 rounded text-center">
              <p className="text-xs text-muted-foreground">Goals</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.shots.goals}</p>
            </div>
            <div className="p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-center">
              <p className="text-xs text-muted-foreground">Saved</p>
              <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.shots.saved}</p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-950 rounded text-center">
              <p className="text-xs text-muted-foreground">Missed</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.shots.missed}</p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-center">
              <p className="text-xs text-muted-foreground">Total xG</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.shots.totalXG.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Passes Statistics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Navigation className="h-4 w-4 text-blue-600" />
            <span>Passes</span>
            <Badge variant="outline" className="ml-auto">{stats.passes.total}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-green-50 dark:bg-green-950 rounded text-center">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.passes.completed}</p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-950 rounded text-center">
              <p className="text-xs text-muted-foreground">Incomplete</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.passes.incomplete}</p>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-950 rounded text-center">
              <p className="text-xs text-muted-foreground">Accuracy</p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.passes.completionRate.toFixed(0)}%</p>
            </div>
          </div>
          <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-center">
            <p className="text-xs text-muted-foreground">Total xA (Expected Assists)</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.passes.totalXA.toFixed(2)}</p>
          </div>
        </div>

        {/* Defensive Statistics */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Shield className="h-4 w-4 text-red-600" />
            <span>Defensive Actions</span>
            <Badge variant="outline" className="ml-auto">{stats.defensive.total}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-green-50 dark:bg-green-950 rounded text-center">
              <p className="text-xs text-muted-foreground">Successful</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.defensive.successful}</p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-950 rounded text-center">
              <p className="text-xs text-muted-foreground">Success Rate</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.defensive.successRate.toFixed(0)}%</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2 bg-muted rounded text-center">
              <p className="text-xs text-muted-foreground">Tackles</p>
              <p className="text-sm font-bold">{stats.defensive.tackles}</p>
            </div>
            <div className="p-2 bg-muted rounded text-center">
              <p className="text-xs text-muted-foreground">Intercept</p>
              <p className="text-sm font-bold">{stats.defensive.interceptions}</p>
            </div>
            <div className="p-2 bg-muted rounded text-center">
              <p className="text-xs text-muted-foreground">Blocks</p>
              <p className="text-sm font-bold">{stats.defensive.blocks}</p>
            </div>
            <div className="p-2 bg-muted rounded text-center">
              <p className="text-xs text-muted-foreground">Clears</p>
              <p className="text-sm font-bold">{stats.defensive.clearances}</p>
            </div>
          </div>
        </div>

        {/* Phase Distribution */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span>Phase Distribution</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded">
              <p className="text-xs text-muted-foreground">In Possession</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.phases.inPossession}</p>
            </div>
            <div className="p-2 bg-red-50 dark:bg-red-950 rounded">
              <p className="text-xs text-muted-foreground">Out of Possession</p>
              <p className="text-lg font-bold text-red-600 dark:text-red-400">{stats.phases.outPossession}</p>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-950 rounded">
              <p className="text-xs text-muted-foreground">Attack Transition</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.phases.attackingTransition}</p>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded">
              <p className="text-xs text-muted-foreground">Defense Transition</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.phases.defensiveTransition}</p>
            </div>
          </div>
        </div>

        {/* Zone Distribution */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Circle className="h-4 w-4 text-purple-600" />
            <span>Zone Distribution</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950 rounded text-center">
              <p className="text-xs text-muted-foreground">Build Up</p>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.zones.buildUp}</p>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-950 rounded text-center">
              <p className="text-xs text-muted-foreground">Progression</p>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">{stats.zones.progression}</p>
            </div>
            <div className="p-2 bg-orange-50 dark:bg-orange-950 rounded text-center">
              <p className="text-xs text-muted-foreground">Finishing</p>
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{stats.zones.finishing}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
