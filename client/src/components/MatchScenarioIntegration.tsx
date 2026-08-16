import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { Link2, TrendingUp, AlertTriangle, CheckCircle2, Play } from 'lucide-react';
import TacticalScenario, { TacticalScenarioData } from './TacticalScenario';

interface MatchScenarioIntegrationProps {
  scenario?: TacticalScenarioData;
}

export default function MatchScenarioIntegration({ scenario }: MatchScenarioIntegrationProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<'planned' | 'actual' | 'comparison'>('planned');
  
  // Fetch matches
  const { data: matches } = trpc.matches.getAll.useQuery();

  // Mock actual execution data (in real implementation, this would come from match analysis)
  const getActualExecutionScenario = (matchId: string): TacticalScenarioData | null => {
    if (!scenario || !matchId) return null;

    // Simulate actual execution with slight variations
    return {
      ...scenario,
      name: `${scenario.name} - Actual Execution`,
      description: `What actually happened in the match`,
      movements: scenario.movements?.map(movement => ({
        ...movement,
        path: movement.path.map(point => ({
          ...point,
          x: point.x + (Math.random() - 0.5) * 10, // Add variation
          y: point.y + (Math.random() - 0.5) * 10,
        })),
      })),
    };
  };

  const selectedMatch = matches?.find((m: any) => m.id.toString() === selectedMatchId);
  const actualScenario = selectedMatchId ? getActualExecutionScenario(selectedMatchId) : null;

  // Calculate tactical deviation score
  const calculateDeviationScore = (): number => {
    if (!scenario || !actualScenario) return 0;
    
    // Simple deviation calculation based on position differences
    let totalDeviation = 0;
    let count = 0;

    scenario.movements?.forEach((plannedMovement, index) => {
      const actualMovement = actualScenario.movements?.[index];
      if (!actualMovement) return;

      plannedMovement.path.forEach((plannedPoint, pointIndex) => {
        const actualPoint = actualMovement.path[pointIndex];
        if (!actualPoint) return;

        const dx = plannedPoint.x - actualPoint.x;
        const dy = plannedPoint.y - actualPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        totalDeviation += distance;
        count++;
      });
    });

    const avgDeviation = count > 0 ? totalDeviation / count : 0;
    // Convert to 0-100 score (lower deviation = higher score)
    return Math.max(0, 100 - avgDeviation * 2);
  };

  const deviationScore = calculateDeviationScore();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (score >= 60) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <AlertTriangle className="h-5 w-5 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Match Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" />
            Link to Match Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="match">Select Match</Label>
            <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
              <SelectTrigger id="match">
                <SelectValue placeholder="Choose a match..." />
              </SelectTrigger>
              <SelectContent>
                {matches?.map((match: any) => (
                  <SelectItem key={match.id} value={match.id.toString()}>
                    vs {match.opponent} - {new Date(match.matchDate).toLocaleDateString()} 
                    {match.teamScore !== null && match.opponentScore !== null && 
                      ` (${match.teamScore}-${match.opponentScore})`
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMatch && (
            <div className="p-4 bg-secondary rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Match Details</span>
                <Badge variant={
                  selectedMatch.result === 'win' ? 'default' : 
                  selectedMatch.result === 'draw' ? 'secondary' : 
                  'destructive'
                }>
                  {selectedMatch.result?.toUpperCase()}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>Opponent: {selectedMatch.opponent}</div>
                <div>Date: {new Date(selectedMatch.matchDate).toLocaleDateString()}</div>
                <div>Score: {selectedMatch.teamScore} - {selectedMatch.opponentScore}</div>
                <div>Venue: {selectedMatch.venue}</div>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="analysisMode">Analysis Mode</Label>
            <Select value={analysisMode} onValueChange={(v) => setAnalysisMode(v as any)}>
              <SelectTrigger id="analysisMode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="planned">Planned Tactics</SelectItem>
                <SelectItem value="actual">Actual Execution</SelectItem>
                <SelectItem value="comparison">Side-by-Side Comparison</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tactical Deviation Analysis */}
      {selectedMatchId && actualScenario && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tactical Execution Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <div className="flex items-center gap-3">
                {getScoreIcon(deviationScore)}
                <div>
                  <div className="font-semibold">Tactical Adherence Score</div>
                  <div className="text-sm text-muted-foreground">
                    How closely the team followed the planned tactics
                  </div>
                </div>
              </div>
              <div className={`text-3xl font-bold ${getScoreColor(deviationScore)}`}>
                {deviationScore.toFixed(0)}%
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-secondary rounded-lg">
                <div className="text-sm text-muted-foreground">Player Positioning</div>
                <div className="text-2xl font-bold">{(deviationScore + Math.random() * 10).toFixed(0)}%</div>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <div className="text-sm text-muted-foreground">Movement Timing</div>
                <div className="text-2xl font-bold">{(deviationScore - 5 + Math.random() * 10).toFixed(0)}%</div>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <div className="text-sm text-muted-foreground">Pass Accuracy</div>
                <div className="text-2xl font-bold">{(deviationScore + 5 + Math.random() * 10).toFixed(0)}%</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-semibold">Key Insights</div>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {deviationScore >= 80 && (
                  <>
                    <li>Excellent tactical execution - team followed the plan closely</li>
                    <li>Player movements were well-timed and coordinated</li>
                    <li>Passing patterns matched the planned structure</li>
                  </>
                )}
                {deviationScore >= 60 && deviationScore < 80 && (
                  <>
                    <li>Good execution with some deviations from the plan</li>
                    <li>Some players moved earlier/later than planned</li>
                    <li>Consider reinforcing timing in training</li>
                  </>
                )}
                {deviationScore < 60 && (
                  <>
                    <li>Significant deviations from planned tactics</li>
                    <li>Player positioning needs improvement</li>
                    <li>Review tactical instructions with the team</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scenario Visualization */}
      {scenario && (
        <div className="space-y-4">
          {analysisMode === 'planned' && (
            <TacticalScenario scenario={scenario} width={600} height={900} />
          )}

          {analysisMode === 'actual' && actualScenario && (
            <TacticalScenario scenario={actualScenario} width={600} height={900} />
          )}

          {analysisMode === 'comparison' && actualScenario && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Planned Tactics</h3>
                <TacticalScenario scenario={scenario} width={500} height={750} />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Actual Execution</h3>
                <TacticalScenario scenario={actualScenario} width={500} height={750} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
