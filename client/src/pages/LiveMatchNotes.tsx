import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Clock,
  Target,
  AlertTriangle,
  Star,
  Users,
  Flag,
  Zap,
  MessageSquare,
  Download,
  Share2,
  FileDown,
} from "lucide-react";
import { exportMatchBriefingPDF } from "@/lib/pdfExport";
import { useLanguage } from '@/contexts/LanguageContext';

interface MatchNote {
  id: number;
  timestamp: number; // in seconds
  type: "goal" | "chance" | "tactical" | "substitution" | "injury" | "card" | "general";
  team: "home" | "away";
  content: string;
  player?: string;
  importance: "high" | "medium" | "low";
}

const NOTE_TYPES = [
  { id: "goal", label: "Goal", icon: Target, color: "bg-green-500" },
  { id: "chance", label: "Chance", icon: Zap, color: "bg-yellow-500" },
  { id: "tactical", label: "Tactical", icon: Flag, color: "bg-blue-500" },
  { id: "substitution", label: "Substitution", icon: Users, color: "bg-purple-500" },
  { id: "injury", label: "Injury", icon: AlertTriangle, color: "bg-red-500" },
  { id: "card", label: "Card", icon: AlertTriangle, color: "bg-orange-500" },
  { id: "general", label: "General", icon: MessageSquare, color: "bg-slate-500" },
];

export default function LiveMatchNotes() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [isRunning, setIsRunning] = useState(false);
  const [matchTime, setMatchTime] = useState(0); // in seconds
  const [half, setHalf] = useState<1 | 2>(1);
  const [notes, setNotes] = useState<MatchNote[]>([]);
  const [homeTeam, setHomeTeam] = useState("Our Team");
  const [awayTeam, setAwayTeam] = useState("Opponent");

  // Live data: fetch active live matches and recent past matches
  const { data: liveMatches = [] } = trpc.liveMatch.getAll.useQuery();
  const { data: allMatches = [] } = trpc.matches.getAll.useQuery();
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  // When a match is selected, pre-populate team names
  const handleMatchSelect = (id: string) => {
    setSelectedMatchId(id);
    if (id.startsWith('live-')) {
      const m = liveMatches.find((x: any) => `live-${x.id}` === id);
      if (m) { setHomeTeam('Our Team'); setAwayTeam(m.opponent || 'Opponent'); }
    } else if (id.startsWith('past-')) {
      const m = allMatches.find((x: any) => `past-${x.id}` === id);
      // The row stores the opponent plus a home/away flag rather than two team
      // names, so derive the sides from isHome.
      if (m) {
        const opponent = m.opponent || 'Opponent';
        setHomeTeam(m.isHome ? 'Our Team' : opponent);
        setAwayTeam(m.isHome ? opponent : 'Our Team');
      }
    }
  };

  const matchOptions = [
    ...liveMatches.map((m: any) => ({ id: `live-${m.id}`, label: `LIVE: ${m.teamName || 'Our Team'} vs ${m.opponent}` })),
    ...allMatches.slice(0, 8).map((m: any) => ({ id: `past-${m.id}`, label: `${m.homeTeam || 'Home'} vs ${m.awayTeam || 'Away'}` })),
  ];
  const [homeScore, setHomeScore] = useState(0);
  const [awayScore, setAwayScore] = useState(0);

  // Quick note form
  const [noteType, setNoteType] = useState<MatchNote["type"]>("general");
  const [noteTeam, setNoteTeam] = useState<"home" | "away">("home");
  const [noteContent, setNoteContent] = useState("");
  const [notePlayer, setNotePlayer] = useState("");
  const [noteImportance, setNoteImportance] = useState<"high" | "medium" | "low">("medium");

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setMatchTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getMatchMinute = () => {
    const baseMinute = half === 1 ? 0 : 45;
    return baseMinute + Math.floor(matchTime / 60);
  };

  const addNote = () => {
    if (!noteContent.trim()) return;

    const newNote: MatchNote = {
      id: Date.now(),
      timestamp: matchTime,
      type: noteType,
      team: noteTeam,
      content: noteContent,
      player: notePlayer || undefined,
      importance: noteImportance,
    };

    // Update score if it's a goal
    if (noteType === "goal") {
      if (noteTeam === "home") {
        setHomeScore((prev) => prev + 1);
      } else {
        setAwayScore((prev) => prev + 1);
      }
    }

    setNotes([newNote, ...notes]);
    setNoteContent("");
    setNotePlayer("");
  };

  const removeNote = (id: number) => {
    const note = notes.find((n) => n.id === id);
    if (note?.type === "goal") {
      if (note.team === "home") {
        setHomeScore((prev) => Math.max(0, prev - 1));
      } else {
        setAwayScore((prev) => Math.max(0, prev - 1));
      }
    }
    setNotes(notes.filter((n) => n.id !== id));
  };

  const startSecondHalf = () => {
    setHalf(2);
    setMatchTime(0);
    setIsRunning(false);
  };

  const resetMatch = () => {
    setMatchTime(0);
    setHalf(1);
    setIsRunning(false);
    setNotes([]);
    setHomeScore(0);
    setAwayScore(0);
  };

  const getNoteTypeInfo = (type: string) => {
    return NOTE_TYPES.find((t) => t.id === type) || NOTE_TYPES[6];
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high":
        return "border-red-500 bg-red-500/10";
      case "medium":
        return "border-yellow-500 bg-yellow-500/10";
      case "low":
        return "border-slate-500 bg-slate-500/10";
      default:
        return "border-slate-500";
    }
  };

  return (
    <>
    <div >
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/parent-dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Live Match Notes</h1>
                <p className="text-muted-foreground text-sm">Real-time note-taking during matches</p>
                {matchOptions.length > 0 && (
                  <Select value={selectedMatchId} onValueChange={handleMatchSelect}>
                    <SelectTrigger className="mt-1 h-7 text-xs bg-muted border-border text-foreground w-56">
                      <SelectValue placeholder="Load a match..." />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {matchOptions.map(opt => (
                        <SelectItem key={opt.id} value={opt.id} className="text-foreground text-xs">{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-border text-muted-foreground"
                onClick={() => {
                  exportMatchBriefingPDF({
                    matchTitle: `${homeTeam} vs ${awayTeam}`,
                    date: new Date().toISOString().split('T')[0],
                    opponent: awayTeam,
                    venue: 'TBD',
                    formation: '4-3-3',
                    keyPoints: notes
                      .filter(n => n.importance === 'high')
                      .map(n => `[${formatTime(n.timestamp)}] ${n.content}`),
                    playerInstructions: notes
                      .filter(n => n.player)
                      .map(n => ({
                        player: n.player || 'Unknown',
                        role: n.type,
                        instructions: n.content,
                      })),
                  });
                }}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" size="sm" className="border-border text-muted-foreground">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6">
        {/* Match Header */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              {/* Home Team */}
              <div className="flex-1 text-center">
                <Input
                  value={homeTeam}
                  onChange={(e) => setHomeTeam(e.target.value)}
                  className="text-xl font-bold bg-transparent border-none text-foreground text-center focus-visible:ring-0"
                />
                <div className="text-5xl font-bold text-foreground mt-2">{homeScore}</div>
              </div>

              {/* Timer */}
              <div className="flex-1 text-center">
                <div className="text-6xl font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-2">
                  {formatTime(matchTime)}
                </div>
                <Badge className="bg-blue-600 text-white mb-4">
                  {half === 1 ? "1st Half" : "2nd Half"} • {getMatchMinute()}'
                </Badge>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsRunning(!isRunning)}
                    className={isRunning ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700"}
                  >
                    {isRunning ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                    {isRunning ? "Pause" : "Start"}
                  </Button>
                  {half === 1 && matchTime > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startSecondHalf}
                      className="border-border text-muted-foreground"
                    >
                      2nd Half
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resetMatch}
                    className="border-border text-muted-foreground"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Away Team */}
              <div className="flex-1 text-center">
                <Input
                  value={awayTeam}
                  onChange={(e) => setAwayTeam(e.target.value)}
                  className="text-xl font-bold bg-transparent border-none text-foreground text-center focus-visible:ring-0"
                />
                <div className="text-5xl font-bold text-foreground mt-2">{awayScore}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Note Form */}
          <div className="lg:col-span-1">
            <Card className="bg-card border-border sticky top-24">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Note
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Note Type */}
                <div className="grid grid-cols-4 gap-2">
                  {NOTE_TYPES.slice(0, 4).map((type) => (
                    <Button
                      key={type.id}
                      variant={noteType === type.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNoteType(type.id as MatchNote["type"])}
                      className={`${noteType === type.id ? type.color : "border-border text-muted-foreground"} flex-col h-auto py-2`}
                    >
                      <type.icon className="w-4 h-4 mb-1" />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {NOTE_TYPES.slice(4).map((type) => (
                    <Button
                      key={type.id}
                      variant={noteType === type.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setNoteType(type.id as MatchNote["type"])}
                      className={`${noteType === type.id ? type.color : "border-border text-muted-foreground"} flex-col h-auto py-2`}
                    >
                      <type.icon className="w-4 h-4 mb-1" />
                      <span className="text-xs">{type.label}</span>
                    </Button>
                  ))}
                </div>

                {/* Team Selection */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={noteTeam === "home" ? "default" : "outline"}
                    onClick={() => setNoteTeam("home")}
                    className={noteTeam === "home" ? "bg-blue-600" : "border-border text-muted-foreground"}
                  >
                    {homeTeam}
                  </Button>
                  <Button
                    variant={noteTeam === "away" ? "default" : "outline"}
                    onClick={() => setNoteTeam("away")}
                    className={noteTeam === "away" ? "bg-red-600" : "border-border text-muted-foreground"}
                  >
                    {awayTeam}
                  </Button>
                </div>

                {/* Player */}
                <Input
                  value={notePlayer}
                  onChange={(e) => setNotePlayer(e.target.value)}
                  placeholder="Player name/number (optional)"
                  className="bg-muted border-border text-foreground"
                />

                {/* Content */}
                <Textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  placeholder="What happened?"
                  className="bg-muted border-border text-foreground"
                  rows={3}
                />

                {/* Importance */}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Importance:</span>
                  <div className="flex gap-1">
                    {["low", "medium", "high"].map((imp) => (
                      <Button
                        key={imp}
                        size="sm"
                        variant={noteImportance === imp ? "default" : "outline"}
                        onClick={() => setNoteImportance(imp as "high" | "medium" | "low")}
                        className={`${
                          noteImportance === imp
                            ? imp === "high"
                              ? "bg-red-600"
                              : imp === "medium"
                              ? "bg-yellow-600"
                              : "bg-slate-600"
                            : "border-border text-muted-foreground"
                        } capitalize`}
                      >
                        {imp}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={addNote}
                  disabled={!noteContent.trim()}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Note at {getMatchMinute()}'
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Notes Timeline */}
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Match Timeline
                  </span>
                  <Badge variant="outline" className="border-slate-500 text-muted-foreground">
                    {notes.length} notes
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {notes.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No notes yet. Start the match and add notes as events happen.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notes.map((note) => {
                      const typeInfo = getNoteTypeInfo(note.type);
                      const minute = (half === 1 ? 0 : 45) + Math.floor(note.timestamp / 60);
                      return (
                        <div
                          key={note.id}
                          className={`p-4 rounded-lg border-l-4 ${getImportanceColor(note.importance)}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                                <typeInfo.icon className="w-4 h-4 text-foreground" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="border-slate-500 text-muted-foreground">
                                    {minute}'
                                  </Badge>
                                  <Badge
                                    className={note.team === "home" ? "bg-blue-600" : "bg-red-600"}
                                  >
                                    {note.team === "home" ? homeTeam : awayTeam}
                                  </Badge>
                                  {note.player && (
                                    <span className="text-muted-foreground text-sm">#{note.player}</span>
                                  )}
                                </div>
                                <p className="text-foreground">{note.content}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeNote(note.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
