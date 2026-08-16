import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitCompare, TrendingUp, TrendingDown, Minus, Lightbulb, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { DualPitchComparison } from "@/components/DualPitchComparison";
import { useLanguage } from '@/contexts/LanguageContext';

export default function SessionComparison() {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [session1Id, setSession1Id] = useState<string>("");
  const [session2Id, setSession2Id] = useState<string>("");

  const { data: sessions = [], isLoading: sessionsLoading } = trpc.matchEventSessions.list.useQuery();
  const { data: session1Data } = trpc.matchEventSessions.get.useQuery(
    { sessionId: parseInt(session1Id) },
    { enabled: !!session1Id }
  );
  const { data: session2Data } = trpc.matchEventSessions.get.useQuery(
    { sessionId: parseInt(session2Id) },
    { enabled: !!session2Id }
  );

  if (authLoading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return null;
  }

  const calculateStats = (events: any[]) => {
    const shots = events.filter(e => e.type === "shot");
    const passes = events.filter(e => e.type === "pass");
    const defensive = events.filter(e => e.type === "defensive");

    const goals = shots.filter(s => s.outcome === "goal").length;
    const totalXG = shots.reduce((sum, s) => sum + (s.xG || 0), 0);
    const completedPasses = passes.filter(p => p.completed).length;
    const passAccuracy = passes.length > 0 ? (completedPasses / passes.length) * 100 : 0;
    const totalXA = passes.reduce((sum, p) => sum + (p.xA || 0), 0);
    const successfulDefensive = defensive.filter(d => d.success).length;
    const defensiveSuccessRate = defensive.length > 0 ? (successfulDefensive / defensive.length) * 100 : 0;

    // Phase distribution
    const phases = {
      inPossession: events.filter(e => e.phase === "inPossession").length,
      outOfPossession: events.filter(e => e.phase === "outOfPossession").length,
      attackingTransition: events.filter(e => e.phase === "attackingTransition").length,
      defensiveTransition: events.filter(e => e.phase === "defensiveTransition").length,
    };

    // Zone distribution
    const zones = {
      buildUp: events.filter(e => e.zone === "buildUp").length,
      progression: events.filter(e => e.zone === "progression").length,
      finishing: events.filter(e => e.zone === "finishing").length,
    };

    return {
      totalEvents: events.length,
      shots: shots.length,
      goals,
      totalXG,
      avgXG: shots.length > 0 ? totalXG / shots.length : 0,
      passes: passes.length,
      completedPasses,
      passAccuracy,
      totalXA,
      avgXA: passes.length > 0 ? totalXA / passes.length : 0,
      defensive: defensive.length,
      successfulDefensive,
      defensiveSuccessRate,
      phases,
      zones,
    };
  };

  const getDifference = (val1: number, val2: number) => {
    return val1 - val2;
  };

  const getPercentageDifference = (val1: number, val2: number) => {
    if (val2 === 0) return val1 > 0 ? 100 : 0;
    return ((val1 - val2) / val2) * 100;
  };

  const renderDifferenceIndicator = (diff: number, isPercentage: boolean = false) => {
    if (Math.abs(diff) < 0.01) {
      return (
        <Badge variant="outline" className="gap-1">
          <Minus className="h-3 w-3" />
          No change
        </Badge>
      );
    }

    if (diff > 0) {
      return (
        <Badge variant="default" className="gap-1 bg-green-600">
          <TrendingUp className="h-3 w-3" />
          +{diff.toFixed(isPercentage ? 1 : 2)}{isPercentage ? "%" : ""}
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="gap-1">
        <TrendingDown className="h-3 w-3" />
        {diff.toFixed(isPercentage ? 1 : 2)}{isPercentage ? "%" : ""}
      </Badge>
    );
  };

  const stats1 = session1Data ? calculateStats(session1Data.events) : null;
  const stats2 = session2Data ? calculateStats(session2Data.events) : null;

  const bothSelected = session1Id && session2Id;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/match-event-recording">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <GitCompare className="h-8 w-8" />
                Session Comparison
              </h1>
              <p className="text-muted-foreground">
                Compare two match event recording sessions side-by-side
              </p>
            </div>
          </div>
        </div>

        {/* Session Selectors */}
        <Card>
          <CardHeader>
            <CardTitle>Select Sessions to Compare</CardTitle>
            <CardDescription>
              Choose two saved sessions to analyze differences in performance and tactics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Session 1 Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Session 1</label>
                <Select value={session1Id} onValueChange={setSession1Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select first session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session: any) => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        {session.sessionName} ({session.events.length} events)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {session1Data && (
                  <div className="text-sm text-muted-foreground">
                    {session1Data.homeTeam && session1Data.awayTeam && (
                      <div>{session1Data.homeTeam} vs {session1Data.awayTeam}</div>
                    )}
                    <div>Updated: {new Date(session1Data.updatedAt).toLocaleDateString()}</div>
                  </div>
                )}
              </div>

              {/* Session 2 Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Session 2</label>
                <Select value={session2Id} onValueChange={setSession2Id}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select second session" />
                  </SelectTrigger>
                  <SelectContent>
                    {sessions.map((session: any) => (
                      <SelectItem key={session.id} value={session.id.toString()}>
                        {session.sessionName} ({session.events.length} events)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {session2Data && (
                  <div className="text-sm text-muted-foreground">
                    {session2Data.homeTeam && session2Data.awayTeam && (
                      <div>{session2Data.homeTeam} vs {session2Data.awayTeam}</div>
                    )}
                    <div>Updated: {new Date(session2Data.updatedAt).toLocaleDateString()}</div>
                  </div>
                )}
              </div>
            </div>

            {!bothSelected && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Select both sessions to view comparison
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {bothSelected && stats1 && stats2 && (
          <>
            {/* Overall Statistics Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Overall Statistics</CardTitle>
                <CardDescription>Key performance metrics comparison</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Total Events */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Events</div>
                      <div className="text-2xl font-bold">{stats1.totalEvents}</div>
                    </div>
                    <div className="flex justify-center">
                      {renderDifferenceIndicator(getDifference(stats2.totalEvents, stats1.totalEvents))}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total Events</div>
                      <div className="text-2xl font-bold">{stats2.totalEvents}</div>
                    </div>
                  </div>

                  <div className="border-t" />

                  {/* Shots */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Shots</div>
                      <div className="text-xl font-bold">{stats1.shots}</div>
                    </div>
                    <div className="flex justify-center">
                      {renderDifferenceIndicator(getDifference(stats2.shots, stats1.shots))}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Shots</div>
                      <div className="text-xl font-bold">{stats2.shots}</div>
                    </div>
                  </div>

                  {/* Goals */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Goals</div>
                      <div className="text-xl font-bold text-green-600">{stats1.goals}</div>
                    </div>
                    <div className="flex justify-center">
                      {renderDifferenceIndicator(getDifference(stats2.goals, stats1.goals))}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Goals</div>
                      <div className="text-xl font-bold text-green-600">{stats2.goals}</div>
                    </div>
                  </div>

                  {/* xG */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Total xG</div>
                      <div className="text-xl font-bold">{stats1.totalXG.toFixed(2)}</div>
                    </div>
                    <div className="flex justify-center">
                      {renderDifferenceIndicator(getDifference(stats2.totalXG, stats1.totalXG))}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total xG</div>
                      <div className="text-xl font-bold">{stats2.totalXG.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="border-t" />

                  {/* Passes */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Passes</div>
                      <div className="text-xl font-bold">{stats1.passes}</div>
                    </div>
                    <div className="flex justify-center">
                      {renderDifferenceIndicator(getDifference(stats2.passes, stats1.passes))}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Passes</div>
                      <div className="text-xl font-bold">{stats2.passes}</div>
                    </div>
                  </div>

                  {/* Pass Accuracy */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Pass Accuracy</div>
                      <div className="text-xl font-bold">{stats1.passAccuracy.toFixed(1)}%</div>
                    </div>
                    <div className="flex justify-center">
                      {renderDifferenceIndicator(getDifference(stats2.passAccuracy, stats1.passAccuracy), true)}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Pass Accuracy</div>
                      <div className="text-xl font-bold">{stats2.passAccuracy.toFixed(1)}%</div>
                    </div>
                  </div>

                  <div className="border-t" />

                  {/* Defensive Actions */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Defensive Actions</div>
                      <div className="text-xl font-bold">{stats1.defensive}</div>
                    </div>
                    <div className="flex justify-center">
                      {renderDifferenceIndicator(getDifference(stats2.defensive, stats1.defensive))}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Defensive Actions</div>
                      <div className="text-xl font-bold">{stats2.defensive}</div>
                    </div>
                  </div>

                  {/* Defensive Success Rate */}
                  <div className="grid grid-cols-3 gap-4 items-center">
                    <div>
                      <div className="text-sm text-muted-foreground">Defensive Success Rate</div>
                      <div className="text-xl font-bold">{stats1.defensiveSuccessRate.toFixed(1)}%</div>
                    </div>
                    <div className="flex justify-center">
                      {renderDifferenceIndicator(getDifference(stats2.defensiveSuccessRate, stats1.defensiveSuccessRate), true)}
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Defensive Success Rate</div>
                      <div className="text-xl font-bold">{stats2.defensiveSuccessRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phase Distribution Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Phase Distribution</CardTitle>
                <CardDescription>Actions per tactical phase</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats1.phases).map(([phase, count]) => {
                    const count2 = stats2.phases[phase as keyof typeof stats2.phases];
                    const phaseLabels: Record<string, string> = {
                      inPossession: "In Possession",
                      outOfPossession: "Out of Possession",
                      attackingTransition: "Attacking Transition",
                      defensiveTransition: "Defensive Transition",
                    };

                    return (
                      <div key={phase}>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <div>
                            <div className="text-sm text-muted-foreground">{phaseLabels[phase]}</div>
                            <div className="text-lg font-bold">{count}</div>
                          </div>
                          <div className="flex justify-center">
                            {renderDifferenceIndicator(getDifference(count2, count))}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">{phaseLabels[phase]}</div>
                            <div className="text-lg font-bold">{count2}</div>
                          </div>
                        </div>
                        {phase !== "defensiveTransition" && <div className="border-t mt-4" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Zone Distribution Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Zone Distribution</CardTitle>
                <CardDescription>Actions per pitch zone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats1.zones).map(([zone, count]) => {
                    const count2 = stats2.zones[zone as keyof typeof stats2.zones];
                    const zoneLabels: Record<string, string> = {
                      buildUp: "Build Up Zone",
                      progression: "Progression Zone",
                      finishing: "Finishing Zone",
                    };

                    return (
                      <div key={zone}>
                        <div className="grid grid-cols-3 gap-4 items-center">
                          <div>
                            <div className="text-sm text-muted-foreground">{zoneLabels[zone]}</div>
                            <div className="text-lg font-bold">{count}</div>
                          </div>
                          <div className="flex justify-center">
                            {renderDifferenceIndicator(getDifference(count2, count))}
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">{zoneLabels[zone]}</div>
                            <div className="text-lg font-bold">{count2}</div>
                          </div>
                        </div>
                        {zone !== "finishing" && <div className="border-t mt-4" />}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Visual Pitch Comparison */}
            {session1Data && session2Data && (
              <DualPitchComparison
                session1Name={session1Data.sessionName}
                session1Events={session1Data.events}
                session2Name={session2Data.sessionName}
                session2Events={session2Data.events}
              />
            )}

            {/* Automated Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Automated Insights
                </CardTitle>
                <CardDescription>
                  Key tactical observations from comparing both sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Attacking Performance */}
                  {stats2.totalXG > stats1.totalXG && (
                    <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-green-900">Improved Attacking Threat</div>
                        <div className="text-sm text-green-700">
                          Session 2 generated {stats2.totalXG.toFixed(2)} xG compared to {stats1.totalXG.toFixed(2)} xG in Session 1, 
                          representing a {((stats2.totalXG - stats1.totalXG) / stats1.totalXG * 100).toFixed(1)}% increase in shot quality.
                        </div>
                      </div>
                    </div>
                  )}

                  {stats2.totalXG < stats1.totalXG && stats1.totalXG > 0 && (
                    <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-900">Reduced Attacking Output</div>
                        <div className="text-sm text-red-700">
                          Session 2 generated only {stats2.totalXG.toFixed(2)} xG compared to {stats1.totalXG.toFixed(2)} xG in Session 1, 
                          a {((stats1.totalXG - stats2.totalXG) / stats1.totalXG * 100).toFixed(1)}% decrease in shot quality.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pass Accuracy */}
                  {stats2.passAccuracy > stats1.passAccuracy && (
                    <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-green-900">Better Ball Retention</div>
                        <div className="text-sm text-green-700">
                          Pass accuracy improved from {stats1.passAccuracy.toFixed(1)}% to {stats2.passAccuracy.toFixed(1)}%, 
                          indicating better control and decision-making in possession.
                        </div>
                      </div>
                    </div>
                  )}

                  {stats2.passAccuracy < stats1.passAccuracy && stats1.passAccuracy > 0 && (
                    <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-900">Decreased Passing Accuracy</div>
                        <div className="text-sm text-red-700">
                          Pass accuracy dropped from {stats1.passAccuracy.toFixed(1)}% to {stats2.passAccuracy.toFixed(1)}%, 
                          suggesting more risk-taking or pressure in possession.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Defensive Performance */}
                  {stats2.defensiveSuccessRate > stats1.defensiveSuccessRate && (
                    <div className="flex gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-green-900">Stronger Defensive Actions</div>
                        <div className="text-sm text-green-700">
                          Defensive success rate improved from {stats1.defensiveSuccessRate.toFixed(1)}% to {stats2.defensiveSuccessRate.toFixed(1)}%, 
                          showing better timing and positioning in defensive duels.
                        </div>
                      </div>
                    </div>
                  )}

                  {stats2.defensiveSuccessRate < stats1.defensiveSuccessRate && stats1.defensiveSuccessRate > 0 && (
                    <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-red-900">Weaker Defensive Duels</div>
                        <div className="text-sm text-red-700">
                          Defensive success rate declined from {stats1.defensiveSuccessRate.toFixed(1)}% to {stats2.defensiveSuccessRate.toFixed(1)}%, 
                          indicating struggles in 1v1 situations or pressing effectiveness.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Zone Analysis */}
                  {stats2.zones.finishing > stats1.zones.finishing && (
                    <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-blue-900">Increased Final Third Activity</div>
                        <div className="text-sm text-blue-700">
                          Actions in the finishing zone increased from {stats1.zones.finishing} to {stats2.zones.finishing}, 
                          suggesting more aggressive positioning and attacking intent.
                        </div>
                      </div>
                    </div>
                  )}

                  {stats2.zones.buildUp > stats1.zones.buildUp && (
                    <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-blue-900">More Patient Build-Up Play</div>
                        <div className="text-sm text-blue-700">
                          Build-up zone actions increased from {stats1.zones.buildUp} to {stats2.zones.buildUp}, 
                          indicating a more methodical approach to progressing the ball.
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Phase Analysis */}
                  {stats2.phases.attackingTransition > stats1.phases.attackingTransition && (
                    <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-blue-900">More Counter-Attack Opportunities</div>
                        <div className="text-sm text-blue-700">
                          Attacking transition actions increased from {stats1.phases.attackingTransition} to {stats2.phases.attackingTransition}, 
                          suggesting better ball recovery and quick transition play.
                        </div>
                      </div>
                    </div>
                  )}

                  {stats2.phases.defensiveTransition > stats1.phases.defensiveTransition && (
                    <div className="flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <Lightbulb className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-blue-900">Increased Counter-Pressing</div>
                        <div className="text-sm text-blue-700">
                          Defensive transition actions increased from {stats1.phases.defensiveTransition} to {stats2.phases.defensiveTransition}, 
                          indicating more aggressive pressing after losing possession.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Empty State */}
        {sessionsLoading && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                Loading sessions...
              </div>
            </CardContent>
          </Card>
        )}

        {!sessionsLoading && sessions.length === 0 && (
          <Card>
            <CardContent className="py-8">
              <div className="text-center space-y-2">
                <div className="text-muted-foreground">
                  No saved sessions found. Record and save match events first.
                </div>
                <Link href="/match-event-recording">
                  <Button>Go to Match Event Recording</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
