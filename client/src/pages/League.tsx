import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';
import {
  Trophy, 
  Calendar, 
  Star, 
  TrendingUp, 
  TrendingDown,
  Minus,
  Medal,
  Target,
  ArrowLeft,
  ClipboardEdit,
  CheckCircle2,
  Users,
  Swords,
  Loader2,
} from 'lucide-react';

interface PlayerRating {
  playerId: number;
  playerName: string;
  minutesPlayed: number;
  started: boolean;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  coachRating: number;
}

// Form indicator component
function FormIndicator({ result }: { result: string }) {
  /* Text colour travels with the background so the unknown-result fallback
     does not end up white-on-light. */
  const colors: Record<string, string> = {
    W: "bg-green-500 text-white",
    D: "bg-yellow-500 text-black",
    L: "bg-red-500 text-white",
  };
  return (
    <span className={`w-6 h-6 rounded-full ${colors[result] || "bg-muted text-muted-foreground"} flex items-center justify-center text-xs font-bold`}>
      {result}
    </span>
  );
}

export default function League() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Result entry state
  const { t, language } = useLanguage();
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [teamScore, setTeamScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [halfTimeScore, setHalfTimeScore] = useState("");
  const [matchNotes, setMatchNotes] = useState("");
  const [playerRatings, setPlayerRatings] = useState<PlayerRating[]>([]);
  const [activeStep, setActiveStep] = useState<"score" | "players">("score");

  const { data: standings, isLoading: standingsLoading, refetch: refetchStandings } = trpc.league.getStandings.useQuery({
    season: "2025-2026",
    leagueName: "Future Stars Academy League"
  });

  const { data: upcomingMatches, isLoading: matchesLoading, refetch: refetchMatches } = trpc.matches.getAll.useQuery();
  const { data: recentResults } = trpc.matches.getAll.useQuery();

  const { data: teamPlayers } = trpc.players.getByTeam.useQuery(
    { teamId: selectedMatch?.teamId || 0 },
    { enabled: !!selectedMatch?.teamId }
  );

  const enterResultMutation = trpc.matches.enterResult.useMutation({
    onSuccess: () => {
      toast({ title: "Result saved!", description: "Match result and player ratings have been recorded. Standings updated." });
      setShowResultDialog(false);
      refetchMatches();
      refetchStandings();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const isLoading = standingsLoading || matchesLoading;
  const canEnterResults = user.role === 'admin' || user.role === 'coach';

  // Sort matches by date
  const sortedMatches = upcomingMatches?.sort((a: any, b: any) => 
    new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime()
  ) || [];

  const upcoming = sortedMatches.filter((m: any) => new Date(m.matchDate) >= new Date());
  const past = sortedMatches.filter((m: any) => new Date(m.matchDate) < new Date()).reverse();
  const noResult = sortedMatches.filter((m: any) => new Date(m.matchDate) < new Date() && !m.result);

  function openResultDialog(match: any) {
    setSelectedMatch(match);
    setTeamScore(match.teamScore || 0);
    setOpponentScore(match.opponentScore || 0);
    setHalfTimeScore(match.halfTimeScore || '');
    setMatchNotes(match.notes || '');
    setActiveStep('score');
    setPlayerRatings([]);
    setShowResultDialog(true);
  }

  function initPlayerRatings() {
    if (!teamPlayers) return;
    setPlayerRatings((teamPlayers as any[]).map((p: any) => ({
      playerId: p.id,
      playerName: `${p.firstName} ${p.lastName}`,
      minutesPlayed: 90,
      started: true,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
      coachRating: 7,
    })));
    setActiveStep('players');
  }

  function updatePlayerRating(playerId: number, field: keyof PlayerRating, value: any) {
    setPlayerRatings(prev => prev.map(p => p.playerId === playerId ? { ...p, [field]: value } : p));
  }

  function submitResult() {
    if (!selectedMatch) return;
    enterResultMutation.mutate({
      matchId: selectedMatch.id,
      teamScore,
      opponentScore,
      halfTimeScore: halfTimeScore || undefined,
      notes: matchNotes || undefined,
      season: '2025-2026',
      leagueName: 'Future Stars Academy League',
      playerRatings: playerRatings.length > 0 ? playerRatings : undefined,
    });
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            
            <BackButton />
<h1 className="text-3xl font-bold flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              League & Fixtures
            </h1>
            <p className="text-muted-foreground mt-1">
              Season 2025-2026 standings and match schedule
            </p>
          </div>
        </div>

        <Tabs defaultValue="standings" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* League Standings */}
          <TabsContent value="standings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Medal className="h-5 w-5 text-primary" />
                  Future Stars FC League - 2025/26
                </CardTitle>
                <CardDescription>Current league standings</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : standings && standings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="pb-3 pl-2 w-12">#</th>
                          <th className="pb-3">Team</th>
                          <th className="pb-3 text-center">P</th>
                          <th className="pb-3 text-center">W</th>
                          <th className="pb-3 text-center">D</th>
                          <th className="pb-3 text-center">L</th>
                          <th className="pb-3 text-center">GF</th>
                          <th className="pb-3 text-center">GA</th>
                          <th className="pb-3 text-center">GD</th>
                          <th className="pb-3 text-center font-bold">Pts</th>
                          <th className="pb-3 text-center">Form</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((team, index) => (
                          <tr 
                            key={team.id} 
                            className={`border-b border-border/50 hover:bg-muted/50 transition-colors ${
                              index < 3 ? "bg-primary/5" : ""
                            }`}
                          >
                            <td className="py-3 pl-2">
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 ? "bg-yellow-500 text-black" :
                                index === 1 ? "bg-gray-400 text-black" :
                                index === 2 ? "bg-amber-700 text-white" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {index + 1}
                              </span>
                            </td>
                            <td className="py-3 font-medium">{team.teamName || `Team ${team.teamId}`}</td>
                            <td className="py-3 text-center text-muted-foreground">{team.played}</td>
                            <td className="py-3 text-center text-green-700 dark:text-green-500 font-medium">{team.won}</td>
                            <td className="py-3 text-center text-yellow-700 dark:text-yellow-500">{team.drawn}</td>
                            <td className="py-3 text-center text-red-500">{team.lost}</td>
                            <td className="py-3 text-center">{team.goalsFor}</td>
                            <td className="py-3 text-center">{team.goalsAgainst}</td>
                            <td className="py-3 text-center">
                              <span className={(team.goalDifference ?? 0) > 0 ? "text-green-700 dark:text-green-500" : (team.goalDifference ?? 0) < 0 ? "text-red-500" : ""}>
                                {(team.goalDifference ?? 0) > 0 ? "+" : ""}{team.goalDifference ?? 0}
                              </span>
                            </td>
                            <td className="py-3 text-center font-bold text-lg text-primary">{team.points}</td>
                            <td className="py-3">
                              <div className="flex gap-1 justify-center">
                                {team.form?.split("").slice(-5).map((result: string, i: number) => (
                                  <FormIndicator key={i} result={result} />
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No standings data available yet</p>
                    <p className="text-sm mt-2">League standings will appear here once matches are played</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Scorers */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Top Scorers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Ahmed Hassan", team: "U-14 Elite", goals: 12 },
                      { name: "Mohamed Ali", team: "U-16 Premier", goals: 10 },
                      { name: "Omar Khaled", team: "U-14 Elite", goals: 8 },
                      { name: "Youssef Nour", team: "U-12 Stars", goals: 7 },
                      { name: "Karim Mostafa", team: "U-18 Academy", goals: 6 },
                    ].map((player, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? "bg-yellow-500 text-black" :
                            i === 1 ? "bg-gray-400 text-black" :
                            i === 2 ? "bg-amber-700 text-white" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-xs text-muted-foreground">{player.team}</p>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-primary">{player.goals}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Top Assists
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "Ali Ibrahim", team: "U-16 Premier", assists: 9 },
                      { name: "Hassan Mahmoud", team: "U-14 Elite", assists: 7 },
                      { name: "Tarek Samir", team: "U-18 Academy", assists: 6 },
                      { name: "Nabil Fathy", team: "U-12 Stars", assists: 5 },
                      { name: "Amr Salah", team: "U-14 Elite", assists: 5 },
                    ].map((player, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            i === 0 ? "bg-yellow-500 text-black" :
                            i === 1 ? "bg-gray-400 text-black" :
                            i === 2 ? "bg-amber-700 text-white" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-xs text-muted-foreground">{player.team}</p>
                          </div>
                        </div>
                        <span className="text-xl font-bold text-primary">{player.assists}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Upcoming Fixtures */}
          <TabsContent value="fixtures" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Fixtures
                </CardTitle>
                <CardDescription>Scheduled matches</CardDescription>
              </CardHeader>
              <CardContent>
                {upcoming.length > 0 ? (
                  <div className="space-y-4">
                    {upcoming.map((match: any) => (
                      <div key={match.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className="text-right flex-1">
                              <p className="font-bold">{match.isHome ? "Future Stars Academy" : match.opponent}</p>
                              <p className="text-xs text-muted-foreground">{match.isHome ? "Home" : "Away"}</p>
                            </div>
                            <div className="text-center px-4">
                              <p className="text-2xl font-bold text-muted-foreground">vs</p>
                            </div>
                            <div className="text-left flex-1">
                              <p className="font-bold">{match.isHome ? match.opponent : "Future Stars Academy"}</p>
                              <p className="text-xs text-muted-foreground">{match.isHome ? "Away" : "Home"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-medium">{new Date(match.matchDate).toLocaleDateString()}</p>
                          <Badge variant="outline" className="mt-1">{match.matchType}</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{match.venue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No upcoming fixtures scheduled</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Match Results */}
          <TabsContent value="results" className="space-y-6">
            {/* Pending results alert */}
            {canEnterResults && noResult.length > 0 && (
              <Card className="border-yellow-500/50 bg-yellow-500/5">
                <CardHeader className="pb-3">
                  <CardTitle className="text-yellow-700 dark:text-yellow-500 flex items-center gap-2 text-base">
                    <ClipboardEdit className="h-4 w-4" />
                    {noResult.length} Match{noResult.length > 1 ? 'es' : ''} Awaiting Result Entry
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {noResult.map((match: any) => (
                      <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                        <div>
                          <p className="font-medium text-sm">
                            {match.isHome ? 'Future Stars Academy' : match.opponent} vs {match.isHome ? match.opponent : 'Future Stars Academy'}
                          </p>
                          <p className="text-xs text-muted-foreground">{new Date(match.matchDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} · {match.matchType}</p>
                        </div>
                        <Button size="sm" onClick={() => openResultDialog(match)} className="gap-2">
                          <ClipboardEdit className="h-3 w-3" />
                          Enter Result
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Match Results
                </CardTitle>
                <CardDescription>{past.length} completed matches</CardDescription>
              </CardHeader>
              <CardContent>
                {past.length > 0 ? (
                  <div className="space-y-4">
                    {past.map((match: any) => (
                      <div key={match.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            <div className="text-right flex-1">
                              <p className="font-bold">{match.isHome ? 'Future Stars Academy' : match.opponent}</p>
                            </div>
                            <div className="text-center px-4">
                              {match.result ? (
                                <div className={`text-2xl font-bold px-4 py-1 rounded-lg ${
                                  match.result === 'win' ? 'bg-green-500/20 text-green-700 dark:text-green-500' :
                                  match.result === 'loss' ? 'bg-red-500/20 text-red-500' :
                                  'bg-yellow-500/20 text-yellow-700 dark:text-yellow-500'
                                }`}>
                                  {match.teamScore} - {match.opponentScore}
                                </div>
                              ) : (
                                <div className="text-lg font-bold text-muted-foreground px-4 py-1">? - ?</div>
                              )}
                              {match.halfTimeScore && <p className="text-xs text-muted-foreground mt-1">HT: {match.halfTimeScore}</p>}
                            </div>
                            <div className="text-left flex-1">
                              <p className="font-bold">{match.isHome ? match.opponent : 'Future Stars Academy'}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4 min-w-[140px]">
                          <p className="font-medium text-sm">{new Date(match.matchDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                          {match.result ? (
                            <Badge variant={
                              match.result === 'win' ? 'default' :
                              match.result === 'loss' ? 'destructive' :
                              'secondary'
                            } className="mt-1">
                              {match.result === 'win' ? <><TrendingUp className="h-3 w-3 mr-1" /> Win</> :
                               match.result === 'loss' ? <><TrendingDown className="h-3 w-3 mr-1" /> Loss</> :
                               <><Minus className="h-3 w-3 mr-1" /> Draw</>}
                            </Badge>
                          ) : canEnterResults ? (
                            <Button size="sm" variant="outline" onClick={() => openResultDialog(match)} className="mt-1 gap-1 text-xs h-7">
                              <ClipboardEdit className="h-3 w-3" />
                              Enter Result
                            </Button>
                          ) : (
                            <Badge variant="outline" className="mt-1">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No match results yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Match Result Entry Dialog */}
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Swords className="h-5 w-5 text-primary" />
                Enter Match Result
              </DialogTitle>
              <DialogDescription>
                {selectedMatch && (
                  <span>
                    {selectedMatch.isHome ? 'Future Stars Academy' : selectedMatch.opponent} vs {selectedMatch.isHome ? selectedMatch.opponent : 'Future Stars Academy'} — {selectedMatch.matchDate ? new Date(selectedMatch.matchDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : ''}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-2 mb-4">
              <button onClick={() => setActiveStep('score')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeStep === 'score' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>1. Score & Details</button>
              <button onClick={() => activeStep === 'players' && setActiveStep('players')} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${activeStep === 'players' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>2. Player Ratings</button>
            </div>

            {activeStep === 'score' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div className="text-center">
                    <Label className="text-xs text-muted-foreground mb-2 block">{selectedMatch?.isHome ? 'Future Stars Academy (Home)' : (selectedMatch?.opponent || '') + ' (Away)'}</Label>
                    <Input type="number" min={0} max={20} value={teamScore} onChange={(e) => setTeamScore(parseInt(e.target.value) || 0)} className="text-center text-3xl font-bold h-16" />
                  </div>
                  <div className="text-center"><p className="text-2xl font-bold text-muted-foreground">—</p></div>
                  <div className="text-center">
                    <Label className="text-xs text-muted-foreground mb-2 block">{selectedMatch?.isHome ? (selectedMatch?.opponent || '') + ' (Away)' : 'Future Stars Academy (Home)'}</Label>
                    <Input type="number" min={0} max={20} value={opponentScore} onChange={(e) => setOpponentScore(parseInt(e.target.value) || 0)} className="text-center text-3xl font-bold h-16" />
                  </div>
                </div>
                <div className={`text-center py-2 rounded-lg font-bold ${
                  teamScore > opponentScore ? 'bg-green-500/20 text-green-700 dark:text-green-500' :
                  teamScore < opponentScore ? 'bg-red-500/20 text-red-500' :
                  'bg-yellow-500/20 text-yellow-700 dark:text-yellow-500'
                }`}>
                  {teamScore > opponentScore ? '✓ WIN' : teamScore < opponentScore ? '✗ LOSS' : '= DRAW'}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs mb-1 block">Half-time Score (e.g. 1-0)</Label>
                    <Input placeholder="e.g. 1-0" value={halfTimeScore} onChange={(e) => setHalfTimeScore(e.target.value)} />
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Match Type</Label>
                    <Input value={selectedMatch?.matchType || ''} disabled className="bg-muted" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs mb-1 block">Match Notes</Label>
                  <Textarea placeholder="Any notes about the match performance..." value={matchNotes} onChange={(e) => setMatchNotes(e.target.value)} rows={3} />
                </div>
              </div>
            )}

            {activeStep === 'players' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Rate each player's performance (1-10). Adjust minutes played and stats.</p>
                {playerRatings.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No players loaded.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {playerRatings.map((p) => (
                      <div key={p.playerId} className="p-3 rounded-lg border border-border bg-muted/20">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{p.playerName}</p>
                          <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                            <input type="checkbox" checked={p.started} onChange={(e) => updatePlayerRating(p.playerId, 'started', e.target.checked)} className="rounded" />
                            Started
                          </label>
                        </div>
                        <div className="grid grid-cols-5 gap-2 text-xs">
                          <div>
                            <Label className="text-xs text-muted-foreground">Mins</Label>
                            <Input type="number" min={0} max={120} value={p.minutesPlayed} onChange={(e) => updatePlayerRating(p.playerId, 'minutesPlayed', parseInt(e.target.value) || 0)} className="h-7 text-xs text-center" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Goals</Label>
                            <Input type="number" min={0} max={20} value={p.goals} onChange={(e) => updatePlayerRating(p.playerId, 'goals', parseInt(e.target.value) || 0)} className="h-7 text-xs text-center" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Assists</Label>
                            <Input type="number" min={0} max={20} value={p.assists} onChange={(e) => updatePlayerRating(p.playerId, 'assists', parseInt(e.target.value) || 0)} className="h-7 text-xs text-center" />
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">YC / RC</Label>
                            <div className="flex gap-1">
                              <Input type="number" min={0} max={2} value={p.yellowCards} onChange={(e) => updatePlayerRating(p.playerId, 'yellowCards', parseInt(e.target.value) || 0)} className="h-7 text-xs text-center w-full" />
                              <Input type="number" min={0} max={1} value={p.redCards} onChange={(e) => updatePlayerRating(p.playerId, 'redCards', parseInt(e.target.value) || 0)} className="h-7 text-xs text-center w-full" />
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-muted-foreground">Rating</Label>
                            <Select value={String(p.coachRating)} onValueChange={(v) => updatePlayerRating(p.playerId, 'coachRating', parseInt(v))}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{[1,2,3,4,5,6,7,8,9,10].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => setShowResultDialog(false)}>Cancel</Button>
              {activeStep === 'score' && (
                <>
                  <Button variant="outline" onClick={submitResult} disabled={enterResultMutation.isPending}>
                    {enterResultMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Save Score Only
                  </Button>
                  <Button onClick={initPlayerRatings} disabled={!selectedMatch?.teamId}>
                    <Users className="h-4 w-4 mr-2" />
                    Next: Player Ratings
                  </Button>
                </>
              )}
              {activeStep === 'players' && (
                <>
                  <Button variant="outline" onClick={() => setActiveStep('score')}>Back</Button>
                  <Button onClick={submitResult} disabled={enterResultMutation.isPending}>
                    {enterResultMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                    Save Result & Ratings
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
