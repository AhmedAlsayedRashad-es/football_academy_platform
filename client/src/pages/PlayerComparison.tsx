import { useState } from "react";
import * as React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation, useSearch } from "wouter";
import { Users, Loader2, Sparkles, TrendingUp, Target, X, ArrowLeft} from 'lucide-react';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

export default function PlayerComparison() {
  // Team type filter
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const teamTypeFilter = searchParams.get('team') as 'main' | 'academy' | null;
  const [selectedTeamTypeFilter, setSelectedTeamTypeFilter] = React.useState<'all' | 'main' | 'academy'>(
    teamTypeFilter || 'all'
  );
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [comparison, setComparison] = useState<any>(null);
  const [isComparing, setIsComparing] = useState(false);

  const [selectorTeamId, setSelectorTeamId] = useState<number>(0);
  const { data: allTeams = [] } = trpc.teams.getAll.useQuery();
  const { data: players, isLoading: playersLoading } = trpc.players.getAll.useQuery();
  const mainTeams = (allTeams as any[]).filter((t: any) => t.teamType === 'main');
  const academyTeams = (allTeams as any[]).filter((t: any) => t.teamType === 'academy');

  const comparePlayers = trpc.playerComparison.compare.useMutation({
    onSuccess: (data) => {
      setComparison(data);
      setIsComparing(false);
      toast.success("Comparison complete!");
    },
    onError: (error) => {
      setIsComparing(false);
      toast.error("Failed to compare players: " + error.message);
    },
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const handleAddPlayer = (playerId: string) => {
    const id = parseInt(playerId);
    if (selectedPlayerIds.includes(id)) {
      toast.error("Player already selected");
      return;
    }
    if (selectedPlayerIds.length >= 4) {
      toast.error("Maximum 4 players can be compared");
      return;
    }
    setSelectedPlayerIds([...selectedPlayerIds, id]);
  };

  const handleRemovePlayer = (playerId: number) => {
    setSelectedPlayerIds(selectedPlayerIds.filter(id => id !== playerId));
  };

  const handleCompare = () => {
    if (selectedPlayerIds.length < 2) {
      toast.error("Please select at least 2 players to compare");
      return;
    }
    setIsComparing(true);
    setComparison(null);
    comparePlayers.mutate({ playerIds: selectedPlayerIds });
  };

  const selectedPlayers = players?.filter(p => selectedPlayerIds.includes(p.id)) || [];
  const filteredByTeam = selectedTeamTypeFilter === 'all' 
    ? (selectorTeamId > 0 ? players?.filter((p: any) => p.teamId === selectorTeamId) : players)
    : players?.filter((p: any) => {
        const teamMatch = selectorTeamId > 0 ? p.teamId === selectorTeamId : true;
        const typeMatch = p.teamType === selectedTeamTypeFilter || 
          (p.teams && p.teams.some((t: any) => t.teamType === selectedTeamTypeFilter));
        return teamMatch && typeMatch;
      });
  const availablePlayers = filteredByTeam?.filter(p => !selectedPlayerIds.includes(p.id)) || [];

  // Radar chart component for comparison
  const ComparisonRadar = ({ players }: { players: any[] }) => {
    const size = 300;
    const center = size / 2;
    const radius = 120;
    const skills = ['Technical', 'Physical', 'Tactical', 'Mental'];
    const angleStep = (2 * Math.PI) / skills.length;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

    return (
      <svg width={size} height={size} className="mx-auto">
        {/* Grid */}
        {[0.25, 0.5, 0.75, 1].map((level, i) => {
          const points = skills.map((_, idx) => {
            const angle = idx * angleStep - Math.PI / 2;
            const r = level * radius;
            return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
          });
          const path = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
          return <path key={i} d={path} fill="none" stroke="currentColor" strokeOpacity={0.1} />;
        })}
        
        {/* Axes */}
        {skills.map((_, i) => {
          const angle = i * angleStep - Math.PI / 2;
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + radius * Math.cos(angle)}
              y2={center + radius * Math.sin(angle)}
              stroke="currentColor"
              strokeOpacity={0.1}
            />
          );
        })}

        {/* Player data */}
        {players.map((player, pIdx) => {
          const scores = [
            player.technical || 50,
            player.physical || 50,
            player.tactical || 50,
            player.mental || 50
          ];
          
          const points = scores.map((score, idx) => {
            const angle = idx * angleStep - Math.PI / 2;
            const r = (score / 100) * radius;
            return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
          });
          
          const path = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
          
          return (
            <g key={pIdx}>
              <path 
                d={path} 
                fill={colors[pIdx]} 
                fillOpacity={0.2} 
                stroke={colors[pIdx]} 
                strokeWidth={2} 
              />
              {points.map((p, idx) => (
                <circle key={idx} cx={p.x} cy={p.y} r={4} fill={colors[pIdx]} />
              ))}
            </g>
          );
        })}

        {/* Labels */}
        {skills.map((skill, i) => {
          const angle = i * angleStep - Math.PI / 2;
          const x = center + (radius + 30) * Math.cos(angle);
          const y = center + (radius + 30) * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs fill-foreground font-medium"
            >
              {skill}
            </text>
          );
        })}
      </svg>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          
          <BackButton />
<h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Player Comparison
          </h1>
          <p className="text-muted-foreground mt-2">
            Compare multiple players side-by-side with AI-powered insights
          </p>
        </div>

        {/* Player Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Players to Compare</CardTitle>
            <CardDescription>Choose 2-4 players for detailed comparison (max 4)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Step 1: Team Type */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
                {language === 'ar' ? '① اختر نوع الفريق أولاً' : '① Select Team Type First'}
              </label>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => { setSelectedTeamTypeFilter('all'); setSelectorTeamId(0); }}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    selectedTeamTypeFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}>
                  {language === 'ar' ? 'الكل' : 'All Players'}
                </button>
                <button onClick={() => { setSelectedTeamTypeFilter('main'); setSelectorTeamId(0); }}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    selectedTeamTypeFilter === 'main' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}>
                  ⚽ {language === 'ar' ? 'الفريق الأول' : 'Main Team'}
                </button>
                <button onClick={() => { setSelectedTeamTypeFilter('academy'); setSelectorTeamId(0); }}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    selectedTeamTypeFilter === 'academy' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}>
                  🛡️ {language === 'ar' ? 'الأكاديمية' : 'Academy'}
                </button>
              </div>
            </div>
            {/* Step 2: Sub-team */}
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
                {language === 'ar' ? '② اختر الفريق الفرعي (اختياري)' : '② Filter by Sub-team (optional)'}
              </label>
              <Select value={selectorTeamId ? String(selectorTeamId) : ""} onValueChange={v => setSelectorTeamId(Number(v))}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder={language === 'ar' ? 'كل الفرق...' : 'All sub-teams...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{language === 'ar' ? 'كل الفرق' : 'All teams'}</SelectItem>
                  {(selectedTeamTypeFilter === 'all' || selectedTeamTypeFilter === 'main') && mainTeams.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                  {(selectedTeamTypeFilter === 'all' || selectedTeamTypeFilter === 'academy') && academyTeams.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Selected Players */}
            {selectedPlayers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedPlayers.map((player, idx) => (
                  <Badge 
                    key={player.id} 
                    variant="secondary" 
                    className="px-3 py-2 text-sm"
                    style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][idx] + '20' }}
                  >
                    {player.firstName} {player.lastName}
                    <button
                      onClick={() => handleRemovePlayer(player.id)}
                      className="ml-2 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Add Player */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Select onValueChange={handleAddPlayer} value="">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Add a player" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    {playersLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading players...
                      </SelectItem>
                    ) : availablePlayers.length > 0 ? (
                      availablePlayers.map((player) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.firstName} {player.lastName} - {player.position}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No more players available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleCompare} 
                disabled={selectedPlayerIds.length < 2 || isComparing}
                className="gap-2"
                size="lg"
              >
                {isComparing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Compare Players
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isComparing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing player data and generating comparison...</p>
            </CardContent>
          </Card>
        )}

        {/* Comparison Results */}
        {comparison && !isComparing && (
          <div className="space-y-4">
            {/* Radar Chart Comparison */}
            {comparison.players && comparison.players.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Performance Comparison
                  </CardTitle>
                  <CardDescription>Visual comparison of key performance areas</CardDescription>
                </CardHeader>
                <CardContent>
                  <ComparisonRadar players={comparison.players} />
                  <div className="flex justify-center gap-4 mt-6">
                    {comparison.players.map((player: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][idx] }}
                        />
                        <span className="text-sm">{player.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Table */}
            {comparison.stats && (
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Metric</th>
                          {comparison.players.map((player: any, idx: number) => (
                            <th key={idx} className="text-center p-2">{player.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {['Technical', 'Physical', 'Tactical', 'Mental'].map((metric) => (
                          <tr key={metric} className="border-b">
                            <td className="p-2 font-medium">{metric}</td>
                            {comparison.players.map((player: any, idx: number) => {
                              const value = player[metric.toLowerCase()] || 0;
                              const isHighest = value === Math.max(...comparison.players.map((p: any) => p[metric.toLowerCase()] || 0));
                              return (
                                <td key={idx} className="text-center p-2">
                                  <span className={isHighest ? 'font-bold text-green-700 dark:text-green-500' : ''}>
                                    {value}
                                  </span>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Analysis */}
            {comparison.analysis && (
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-500" />
                    AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">{comparison.analysis}</pre>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Formation Suggestions */}
            {comparison.formationSuggestions && (
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-700 dark:text-green-500" />
                    Formation Suggestions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{comparison.formationSuggestions}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!comparison && !isComparing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Users className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">No Comparison Yet</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Select 2-4 players from the dropdown above and click "Compare Players" to generate 
                  a detailed side-by-side comparison with AI-powered insights and formation suggestions.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
