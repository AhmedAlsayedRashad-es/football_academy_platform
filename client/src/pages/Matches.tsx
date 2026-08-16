import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useLocation, useSearch } from "wouter";
import { useState } from "react";
import { 
  Plus, 
  Calendar, 
  MapPin, 
  Trophy, 
  Users,
  Target,
  Clock,
  ChevronRight,
  Star,
  Award, ArrowLeft} from 'lucide-react';
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

export default function Matches() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const teamType = params.get('team') as 'main' | 'academy' | null;
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [motmDialogOpen, setMotmDialogOpen] = useState(false);
  const [selectedMatchForMotm, setSelectedMatchForMotm] = useState<any>(null);
  const [motmData, setMotmData] = useState({ playerId: "", rating: 8, reason: "" });
  const [matchTypeFilter, setMatchTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: matches, isLoading, refetch } = trpc.matches.getAll.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: players } = trpc.players.getAll.useQuery();

  const setMotm = trpc.motm.set.useMutation({
    onSuccess: () => {
      toast.success("Man of the Match selected!");
      setMotmDialogOpen(false);
      setSelectedMatchForMotm(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const createMatch = trpc.matches.create.useMutation({
    onSuccess: () => {
      toast.success("Match created successfully!");
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const [formData, setFormData] = useState({
    teamId: "",
    matchDate: new Date().toISOString().split('T')[0],
    // `as const` pinned this to the literal, so the league/cup/tournament
    // branches (e.g. the Competition Name field) could never match.
    matchType: "training_match" as "friendly" | "league" | "cup" | "tournament" | "training_match",
    competitionName: "",
    opponent: "",
    venue: "",
    isHome: true,
    teamScore: 0,
    opponentScore: 0,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMatch.mutate({
      ...formData,
      teamId: formData.teamId ? parseInt(formData.teamId) : undefined,
      matchDate: formData.matchDate,
      competitionName: formData.competitionName || undefined,
    });
  };

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    navigate("/");
    return null;
  }

  const getResultBadge = (result?: string | null) => {
    switch (result) {
      case 'win':
        return <Badge className="bg-green-500">Win</Badge>;
      case 'draw':
        return <Badge className="bg-yellow-500">Draw</Badge>;
      case 'loss':
        return <Badge className="bg-red-500">Loss</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getMatchTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      friendly: "bg-blue-500",
      league: "bg-purple-500",
      cup: "bg-amber-500",
      tournament: "bg-emerald-500",
      training_match: "bg-gray-500",
    };
    return <Badge className={colors[type] || "bg-gray-500"}>{type.replace('_', ' ')}</Badge>;
  };

  // Stats summary
  const stats = matches?.reduce(
    (acc, match) => ({
      total: acc.total + 1,
      wins: acc.wins + (match.result === 'win' ? 1 : 0),
      draws: acc.draws + (match.result === 'draw' ? 1 : 0),
      losses: acc.losses + (match.result === 'loss' ? 1 : 0),
      goalsFor: acc.goalsFor + (match.teamScore || 0),
      goalsAgainst: acc.goalsAgainst + (match.opponentScore || 0),
    }),
    { total: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
  ) || { total: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            
            <button onClick={() => teamType ? navigate(`/team-dashboard?team=${teamType}`) : navigate("/dashboard")} className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">

              <ArrowLeft className="w-5 h-5" />

            </button>
<h1 className="text-3xl font-bold">
              {teamType === 'main'
                ? (language === 'ar' ? 'سجل مباريات الفريق الأول' : 'Main Team Match Records')
                : teamType === 'academy'
                ? (language === 'ar' ? 'سجل مباريات الأكاديمية' : 'Academy Match Records')
                : (language === 'ar' ? 'سجل المباريات' : 'Match Records')}
            </h1>
            <p className="text-muted-foreground">{language === 'ar' ? 'تتبع المباريات التدريبية والتنافسية' : 'Track training matches and competitive games'}</p>
            {language === 'ar' && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-800 dark:text-green-200 text-right">
                <span className="font-semibold">دليل الاستخدام: </span>
                استخدم البحث للعثور على مباراة بعينها. فلتر حسب نوع المباراة أو الفريق. اضغط على أي مباراة لعرض تفاصيلها وإحصائياتها.
              </div>
            )}
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Match
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Match</DialogTitle>
                <DialogDescription>Record a new training match or competitive game</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Match Date</Label>
                    <Input
                      type="date"
                      value={formData.matchDate}
                      onChange={(e) => setFormData({ ...formData, matchDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "ar" ? "نوع المباراة" : "Match Type"}</Label>
                    <Select
                      value={formData.matchType}
                      onValueChange={(value: any) => setFormData({ ...formData, matchType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[10001]">
                        <SelectItem value="training_match">{language === "ar" ? "مباراة تدريبية" : "Training Match"}</SelectItem>
                        <SelectItem value="friendly">{language === "ar" ? "ودية" : "Friendly"}</SelectItem>
                        <SelectItem value="league">{language === "ar" ? "دوري" : "League"}</SelectItem>
                        <SelectItem value="cup">{language === "ar" ? "كأس" : "Cup"}</SelectItem>
                        <SelectItem value="tournament">{language === "ar" ? "بطولة" : "Tournament"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Competition Name - shown for league, cup, tournament */}
                {(formData.matchType === 'league' || formData.matchType === 'cup' || formData.matchType === 'tournament') && (
                  <div className="space-y-2">
                    <Label>
                      {language === 'ar' ? 'اسم البطولة / الدوري / الكأس' : 'Competition Name'}
                      <span className="text-xs text-muted-foreground ml-1">{language === 'ar' ? '(مثال: دوري النجوم، كأس مصر)' : '(e.g. Premier League, FA Cup)'}</span>
                    </Label>
                    <Input
                      value={formData.competitionName}
                      onChange={(e) => setFormData({ ...formData, competitionName: e.target.value })}
                      placeholder={language === 'ar' ? 'أدخل اسم البطولة...' : 'Enter competition name...'}
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Team</Label>
                    <Select
                      value={formData.teamId}
                      onValueChange={(value) => setFormData({ ...formData, teamId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent className="z-[10001]">
                        {teams?.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Opponent</Label>
                    <Input
                      value={formData.opponent}
                      onChange={(e) => setFormData({ ...formData, opponent: e.target.value })}
                      placeholder="Opponent team name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("matches.venue")}</Label>
                    <Input
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      placeholder="Match venue"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Home/Away</Label>
                    <Select
                      value={formData.isHome ? "home" : "away"}
                      onValueChange={(value) => setFormData({ ...formData, isHome: value === "home" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="z-[10001]">
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="away">Away</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Our Score</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.teamScore}
                      onChange={(e) => setFormData({ ...formData, teamScore: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Opponent Score</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.opponentScore}
                      onChange={(e) => setFormData({ ...formData, opponentScore: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Match notes, observations..."
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMatch.isPending}>
                    {createMatch.isPending ? "Creating..." : "Create Match"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Matches</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-700 dark:text-green-500">{stats.wins}</div>
              <div className="text-sm text-muted-foreground">Wins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-500">{stats.draws}</div>
              <div className="text-sm text-muted-foreground">Draws</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-500">{stats.losses}</div>
              <div className="text-sm text-muted-foreground">Losses</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.goalsFor}</div>
              <div className="text-sm text-muted-foreground">Goals For</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{stats.goalsAgainst}</div>
              <div className="text-sm text-muted-foreground">Goals Against</div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={language === 'ar' ? 'بحث عن مباراة...' : 'Search by opponent or competition...'}
              className="w-full px-3 py-1.5 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 pr-8"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-base">×</button>
            )}
          </div>
        </div>
        {/* Match Type Filter */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-muted-foreground">{language === 'ar' ? 'تصفية:' : 'Filter:'}</span>
          {[
            { value: 'all', label: language === 'ar' ? 'الكل' : 'All', labelEn: 'All' },
            { value: 'league', label: language === 'ar' ? 'دوري' : 'League', labelEn: 'League' },
            { value: 'cup', label: language === 'ar' ? 'كأس' : 'Cup', labelEn: 'Cup' },
            { value: 'friendly', label: language === 'ar' ? 'ودية' : 'Friendly', labelEn: 'Friendly' },
            { value: 'tournament', label: language === 'ar' ? 'بطولة' : 'Tournament', labelEn: 'Tournament' },
            { value: 'training_match', label: language === 'ar' ? 'تدريبية' : 'Training', labelEn: 'Training' },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setMatchTypeFilter(value)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                matchTypeFilter === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Matches Table */}
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'سجل المباريات' : 'Match History'}</CardTitle>
            <CardDescription>{language === 'ar' ? 'جميع المباريات المسجلة والنتائج' : 'All recorded matches and results'}</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : matches && (matchTypeFilter === 'all' ? matches : matches.filter((m: any) => m.matchType === matchTypeFilter)).filter((m: any) => !searchQuery || (m.opponent || '').toLowerCase().includes(searchQuery.toLowerCase()) || (m.competitionName || '').toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Opponent</TableHead>
                    <TableHead>{t("matches.venue")}</TableHead>
                    <TableHead className="text-center">{t("common.score")}</TableHead>
                    <TableHead>{t("matches.result")}</TableHead>
                    <TableHead>MOTM</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(matchTypeFilter === 'all' ? matches : matches.filter((m: any) => m.matchType === matchTypeFilter)).filter((m: any) => !searchQuery || (m.opponent || '').toLowerCase().includes(searchQuery.toLowerCase()) || (m.competitionName || '').toLowerCase().includes(searchQuery.toLowerCase())).map((match) => (
                    <TableRow key={match.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(match.matchDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>{getMatchTypeBadge(match.matchType)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            {match.opponent || "TBD"}
                          </div>
                          {match.competitionName && (
                            <span className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              {match.competitionName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          {match.venue || "-"}
                          {match.isHome && <Badge variant="outline" className="ml-1">H</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {match.teamScore ?? "-"} - {match.opponentScore ?? "-"}
                      </TableCell>
                      <TableCell>{getResultBadge(match.result)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-primary"
                          onClick={() => {
                            setSelectedMatchForMotm(match);
                            setMotmDialogOpen(true);
                          }}
                        >
                          <Star className="h-4 w-4 mr-1" />
                          MOTM
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/matches/${match.id}`)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Matches Recorded</h3>
                <p className="text-muted-foreground mb-4">Start tracking your team's matches</p>
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Match
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Man of the Match Dialog */}
        <Dialog open={motmDialogOpen} onOpenChange={setMotmDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Select Man of the Match
              </DialogTitle>
              <DialogDescription>
                {selectedMatchForMotm && (
                  <span>
                    {selectedMatchForMotm.opponent} - {new Date(selectedMatchForMotm.matchDate).toLocaleDateString()}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Player</Label>
                <Select
                  value={motmData.playerId}
                  onValueChange={(value) => setMotmData({ ...motmData, playerId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose the best player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players?.map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName} - {player.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rating (1-10)</Label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={motmData.rating}
                  onChange={(e) => setMotmData({ ...motmData, rating: parseInt(e.target.value) || 8 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea
                  value={motmData.reason}
                  onChange={(e) => setMotmData({ ...motmData, reason: e.target.value })}
                  placeholder="Why was this player selected as MOTM?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMotmDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (selectedMatchForMotm && motmData.playerId) {
                    setMotm.mutate({
                      matchId: selectedMatchForMotm.id,
                      playerId: parseInt(motmData.playerId),
                      rating: motmData.rating,
                      reason: motmData.reason,
                    });
                  }
                }}
                disabled={!motmData.playerId || setMotm.isPending}
              >
                {setMotm.isPending ? "Saving..." : "Select MOTM"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
