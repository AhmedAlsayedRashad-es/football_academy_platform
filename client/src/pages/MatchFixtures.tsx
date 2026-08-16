import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Trophy, MapPin, Plus, Edit, Home, Plane, ArrowLeft} from 'lucide-react';
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


const ACADEMY_LOGO = "/logo-transparent.png";

function ResultBadge({ result }: { result: string | null }) {
  if (!result) return <Badge className="bg-muted text-muted-foreground">Upcoming</Badge>;
  if (result === "win") return <Badge className="bg-green-700 text-white">Win</Badge>;
  if (result === "draw") return <Badge className="bg-yellow-700 text-white">Draw</Badge>;
  return <Badge className="bg-red-700 text-white">Loss</Badge>;
}

type MatchType = "friendly" | "league" | "cup" | "tournament" | "training_match";
type ResultType = "win" | "draw" | "loss";

export default function MatchFixtures() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [addOpen, setAddOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [filter, setFilter] = useState<"all" | "upcoming" | "results">("all");

  const [newMatch, setNewMatch] = useState({
    matchDate: "",
    matchType: "league" as MatchType,
    opponent: "",
    venue: "",
    isHome: true,
    notes: "",
  });

  const [scoreUpdate, setScoreUpdate] = useState({
    teamScore: 0,
    opponentScore: 0,
    result: "win" as ResultType,
    notes: "",
  });

  const { data: allMatches = [], refetch } = trpc.matches.getAll.useQuery();

  const createMutation = trpc.matches.create.useMutation({
    onSuccess: () => {
      toast({ title: "Match added", description: "Fixture created successfully." });
      setAddOpen(false);
      setNewMatch({ matchDate: "", matchType: "league", opponent: "", venue: "", isHome: true, notes: "" });
      refetch();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const updateMutation = trpc.matches.update.useMutation({
    onSuccess: () => {
      toast({ title: "Result updated", description: "Match result saved successfully." });
      setUpdateOpen(false);
      refetch();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const isCoach = user && ["admin", "coach"].includes(user.role);
  const today = new Date().toISOString().split("T")[0];

  const filteredMatches = allMatches.filter((m: any) => {
    const matchDate = m.matchDate instanceof Date ? m.matchDate.toISOString().split("T")[0] : String(m.matchDate).split("T")[0];
    if (filter === "upcoming") return matchDate >= today && !m.result;
    if (filter === "results") return m.result;
    return true;
  });

  const wins = allMatches.filter((m: any) => m.result === "win").length;
  const draws = allMatches.filter((m: any) => m.result === "draw").length;
  const losses = allMatches.filter((m: any) => m.result === "loss").length;
  const played = wins + draws + losses;

  return (
    <>
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          
          <BackButton />
<h1 className="text-2xl font-bold text-foreground">Match Fixtures & Results</h1>
          <p className="text-muted-foreground text-sm">Schedule, results, and match history</p>
        </div>
        {isCoach && (
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-red-700 hover:bg-red-600 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add Fixture
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">Add New Fixture</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-muted-foreground">Opponent *</Label>
                  <Input value={newMatch.opponent} onChange={(e) => setNewMatch(s => ({ ...s, opponent: e.target.value }))} className="bg-muted border-border text-foreground mt-1" placeholder="e.g. Zamalek SC" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Match Date *</Label>
                  <Input type="date" value={newMatch.matchDate} onChange={(e) => setNewMatch(s => ({ ...s, matchDate: e.target.value }))} className="bg-muted border-border text-foreground mt-1" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Match Type</Label>
                  <Select value={newMatch.matchType} onValueChange={(v) => setNewMatch(s => ({ ...s, matchType: v as MatchType }))}>
                    <SelectTrigger className="bg-muted border-border text-foreground mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="league">League</SelectItem>
                      <SelectItem value="cup">Cup</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="tournament">Tournament</SelectItem>
                      <SelectItem value="training_match">Training Match</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Venue</Label>
                  <Input value={newMatch.venue} onChange={(e) => setNewMatch(s => ({ ...s, venue: e.target.value }))} className="bg-muted border-border text-foreground mt-1" placeholder="Stadium name" />
                </div>
                <div>
                  <Label className="text-muted-foreground">Home or Away</Label>
                  <Select value={newMatch.isHome ? "home" : "away"} onValueChange={(v) => setNewMatch(s => ({ ...s, isHome: v === "home" }))}>
                    <SelectTrigger className="bg-muted border-border text-foreground mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home">Home</SelectItem>
                      <SelectItem value="away">Away</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <Textarea value={newMatch.notes} onChange={(e) => setNewMatch(s => ({ ...s, notes: e.target.value }))} className="bg-muted border-border text-foreground mt-1" rows={2} />
                </div>
                <Button onClick={() => createMutation.mutate({ ...newMatch, matchDate: newMatch.matchDate })} disabled={createMutation.isPending || !newMatch.opponent || !newMatch.matchDate} className="w-full bg-red-700 hover:bg-red-600">
                  {createMutation.isPending ? "Adding..." : "Add Fixture"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Season Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Played", value: played, color: "text-foreground" },
          { label: "Wins", value: wins, color: "text-green-700 dark:text-green-400" },
          { label: "Draws", value: draws, color: "text-yellow-700 dark:text-yellow-400" },
          { label: "Losses", value: losses, color: "text-red-600 dark:text-red-400" },
          { label: "Points", value: wins * 3 + draws, color: "text-blue-600 dark:text-blue-400" },
        ].map((stat) => (
          <Card key={stat.label} className="bg-muted border-border">
            <CardContent className="pt-3 pb-3 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-muted-foreground text-xs">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(["all", "upcoming", "results"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className={filter === f ? "bg-red-700 text-white" : "border-border text-muted-foreground hover:text-foreground"}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {/* Matches List */}
      <Card className="bg-muted border-border">
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-600 dark:text-red-400" /> Fixtures & Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMatches.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-muted-foreground">No matches found. Add your first fixture above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMatches.map((match: any) => {
                const matchDate = match.matchDate instanceof Date ? match.matchDate : new Date(match.matchDate);
                const dateStr = matchDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                const isPast = match.result;
                return (
                  <div key={match.id} className="flex items-center gap-4 p-4 bg-card rounded-lg">
                    <div className="text-center min-w-[60px]">
                      <div className="text-muted-foreground text-xs">{dateStr}</div>
                      <div className="text-muted-foreground text-xs capitalize">{match.matchType?.replace("_", " ")}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <img src={ACADEMY_LOGO} alt="Future Stars FC" className="w-8 h-8 object-contain" />
                      <div className="text-center min-w-[60px]">
                        {isPast ? (
                          <div className="text-foreground font-bold text-lg">{match.teamScore ?? 0} – {match.opponentScore ?? 0}</div>
                        ) : (
                          <div className="text-muted-foreground text-sm font-medium">vs</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-foreground font-semibold">{match.opponent || "TBD"}</div>
                        {match.venue && (
                          <div className="text-muted-foreground text-xs flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {match.venue}
                            {match.isHome ? <span className="text-green-700 dark:text-green-400 ml-1 flex items-center gap-0.5"><Home className="w-3 h-3" /> Home</span> : <span className="text-blue-600 dark:text-blue-400 ml-1 flex items-center gap-0.5"><Plane className="w-3 h-3" /> Away</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ResultBadge result={match.result} />
                      {isCoach && (
                        <Dialog open={updateOpen && selectedMatch?.id === match.id} onOpenChange={(o) => { setUpdateOpen(o); if (o) { setSelectedMatch(match); setScoreUpdate({ teamScore: match.teamScore ?? 0, opponentScore: match.opponentScore ?? 0, result: match.result ?? "win", notes: match.notes ?? "" }); } }}>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="border-border text-muted-foreground hover:text-foreground">
                              <Edit className="w-3 h-3" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-card border-border max-w-sm">
                            <DialogHeader>
                              <DialogTitle className="text-foreground">Update Result: vs {selectedMatch?.opponent}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label className="text-muted-foreground">Future Stars FC Score</Label>
                                  <Input type="number" min={0} value={scoreUpdate.teamScore} onChange={(e) => setScoreUpdate(s => ({ ...s, teamScore: Number(e.target.value) }))} className="bg-muted border-border text-foreground mt-1" />
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Opponent Score</Label>
                                  <Input type="number" min={0} value={scoreUpdate.opponentScore} onChange={(e) => setScoreUpdate(s => ({ ...s, opponentScore: Number(e.target.value) }))} className="bg-muted border-border text-foreground mt-1" />
                                </div>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Result</Label>
                                <Select value={scoreUpdate.result} onValueChange={(v) => setScoreUpdate(s => ({ ...s, result: v as ResultType }))}>
                                  <SelectTrigger className="bg-muted border-border text-foreground mt-1"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="win">Win</SelectItem>
                                    <SelectItem value="draw">Draw</SelectItem>
                                    <SelectItem value="loss">Loss</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-muted-foreground">Notes</Label>
                                <Textarea value={scoreUpdate.notes} onChange={(e) => setScoreUpdate(s => ({ ...s, notes: e.target.value }))} className="bg-muted border-border text-foreground mt-1" rows={2} />
                              </div>
                              <Button onClick={() => updateMutation.mutate({ id: selectedMatch.id, ...scoreUpdate })} disabled={updateMutation.isPending} className="w-full bg-red-700 hover:bg-red-600">
                                {updateMutation.isPending ? "Saving..." : "Save Result"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
