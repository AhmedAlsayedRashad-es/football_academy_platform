import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BackButton } from '@/components/BackButton';
import {
  ArrowLeft, Users, Activity, Brain,
  Save, CheckCircle, HelpCircle, Star, AlertTriangle,
  ChevronRight, MessageSquare, ThumbsUp, TrendingUp, Eye, EyeOff,
  Plus, Trash2, Link, Video, Dumbbell, ExternalLink, Play
} from "lucide-react";

function HelpIcon({ text }: { text: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help inline ml-1" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-muted border-border text-foreground">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ScoreInput({ label, value, onChange, color, help }: {
  label: string; value: number | ""; onChange: (v: number | "") => void; color: string; help?: string;
}) {
  return (
    <div className="bg-muted rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <label className={`text-xs font-medium ${color}`}>{label}{help && <HelpIcon text={help} />}</label>
        <span className={`text-lg font-bold ${color}`}>{value || "—"}</span>
      </div>
      <input
        type="range" min="1" max="10" step="1"
        value={value || 5}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-600"
      />
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>1 (Poor)</span><span>5 (Average)</span><span>10 (Excellent)</span>
      </div>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            size={22}
            className={`transition-colors ${(hovered || value) >= star ? "text-yellow-700 dark:text-yellow-400 fill-yellow-400" : "text-gray-600"}`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-muted-foreground self-center">
        {value === 1 ? "Poor" : value === 2 ? "Below Average" : value === 3 ? "Average" : value === 4 ? "Good" : "Excellent"}
      </span>
    </div>
  );
}

type PlayerRecord = {
  playerId: number;
  playerName: string;
  physicalScore: number | "";
  technicalScore: number | "";
  mentalScore: number | "";
  medicalScore: number | "";
  notes: string;
  attended: boolean;
};

type DrillItem = {
  id: string;
  name: string;
  description: string;
  duration: string;
  youtubeUrl: string;
};

type VideoLinkItem = {
  id: string;
  title: string;
  url: string;
};

type PlayerFeedback = {
  playerId: number;
  playerName: string;
  rating: number;
  category: 'technical' | 'physical' | 'mental' | 'tactical' | 'general';
  strengths: string;
  areasToImprove: string;
  recommendations: string;
  drills: DrillItem[];
  videoLinks: VideoLinkItem[];
  isVisibleToParent: boolean;
};

function DrillsSection({ drills, onChange }: {
  drills: DrillItem[];
  onChange: (drills: DrillItem[]) => void;
}) {
  const addDrill = () => {
    onChange([...drills, { id: Date.now().toString(), name: '', description: '', duration: '', youtubeUrl: '' }]);
  };
  const removeDrill = (id: string) => onChange(drills.filter(d => d.id !== id));
  const updateDrill = (id: string, field: keyof DrillItem, value: string) => {
    onChange(drills.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
          <Dumbbell size={12} /> Recommended Training Drills
        </label>
        <button
          type="button"
          onClick={addDrill}
          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/40 px-2 py-1 rounded-md transition-colors"
        >
          <Plus size={10} /> Add Drill
        </button>
      </div>

      {drills.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-3 text-center text-muted-foreground text-xs">
          No drills added yet. Click "Add Drill" to attach a specific training exercise.
        </div>
      )}

      <div className="space-y-3">
        {drills.map((drill, idx) => (
          <div key={drill.id} className="bg-muted rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Drill {idx + 1}</span>
              <button
                type="button"
                onClick={() => removeDrill(drill.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 p-0.5 rounded"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Drill Name *</label>
                <Input
                  value={drill.name}
                  onChange={e => updateDrill(drill.id, 'name', e.target.value)}
                  placeholder="e.g. Cone Dribbling Circuit"
                  className="bg-muted border-border text-foreground text-xs h-8"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Duration</label>
                <Input
                  value={drill.duration}
                  onChange={e => updateDrill(drill.id, 'duration', e.target.value)}
                  placeholder="e.g. 15 mins"
                  className="bg-muted border-border text-foreground text-xs h-8"
                />
              </div>
            </div>
            <div className="mb-2">
              <label className="text-xs text-muted-foreground block mb-1">Description</label>
              <Textarea
                value={drill.description}
                onChange={e => updateDrill(drill.id, 'description', e.target.value)}
                placeholder="Brief description of the drill and what it targets..."
                className="bg-muted border-border text-foreground resize-none h-14 text-xs"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                <Video size={10} /> YouTube / Video Link (optional)
              </label>
              <div className="flex gap-2">
                <Input
                  value={drill.youtubeUrl}
                  onChange={e => updateDrill(drill.id, 'youtubeUrl', e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="bg-muted border-border text-foreground text-xs h-8 flex-1"
                />
                {drill.youtubeUrl && (
                  <a
                    href={drill.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 bg-red-900/20 px-2 rounded"
                  >
                    <Play size={10} /> Preview
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function VideoLinksSection({ videoLinks, onChange }: {
  videoLinks: VideoLinkItem[];
  onChange: (links: VideoLinkItem[]) => void;
}) {
  const addLink = () => {
    onChange([...videoLinks, { id: Date.now().toString(), title: '', url: '' }]);
  };
  const removeLink = (id: string) => onChange(videoLinks.filter(l => l.id !== id));
  const updateLink = (id: string, field: keyof VideoLinkItem, value: string) => {
    onChange(videoLinks.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
          <Link size={12} /> Reference Video Links
        </label>
        <button
          type="button"
          onClick={addLink}
          className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 bg-purple-900/20 hover:bg-purple-900/40 px-2 py-1 rounded-md transition-colors"
        >
          <Plus size={10} /> Add Link
        </button>
      </div>

      {videoLinks.length === 0 && (
        <div className="border border-dashed border-border rounded-lg p-3 text-center text-muted-foreground text-xs">
          No video links added. Attach reference videos to help the player improve.
        </div>
      )}

      <div className="space-y-2">
        {videoLinks.map((link, idx) => (
          <div key={link.id} className="bg-muted rounded-lg p-3 border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Video {idx + 1}</span>
              <button
                type="button"
                onClick={() => removeLink(link.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 p-0.5 rounded"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Title *</label>
                <Input
                  value={link.title}
                  onChange={e => updateLink(link.id, 'title', e.target.value)}
                  placeholder="e.g. Defensive Positioning Tutorial"
                  className="bg-muted border-border text-foreground text-xs h-8"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">URL *</label>
                <div className="flex gap-2">
                  <Input
                    value={link.url}
                    onChange={e => updateLink(link.id, 'url', e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or any video URL"
                    className="bg-muted border-border text-foreground text-xs h-8 flex-1"
                  />
                  {link.url && (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 bg-purple-900/20 px-2 rounded"
                    >
                      <ExternalLink size={10} /> Open
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TrainingSessionRecorder() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessionType, setSessionType] = useState("training");
  const [sessionNotes, setSessionNotes] = useState("");
  const [playerRecords, setPlayerRecords] = useState<PlayerRecord[]>([]);
  const [activePlayer, setActivePlayer] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiAnalyses, setAiAnalyses] = useState<Record<number, any>>({});

  // Feedback step
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbacks, setFeedbacks] = useState<PlayerFeedback[]>([]);
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [activeFeedbackPlayer, setActiveFeedbackPlayer] = useState<number | null>(null);
  const [feedbackTab, setFeedbackTab] = useState<'feedback' | 'drills' | 'videos'>('feedback');

  const { data: allTeams } = trpc.teams.getAll.useQuery();
  const { data: teamPlayers } = trpc.teams.getPlayers.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );

  const saveSessionMutation = trpc.medical.saveSessionPerformance.useMutation({
    onSuccess: () => {},
    onError: (e: any) => toast({ title: "Error saving", description: e.message, variant: "destructive" }),
  });

  const analyzeProgressMutation = trpc.medical.analyzePlayerProgress.useMutation({
    onSuccess: (data: any, variables: any) => {
      setAiAnalyses(prev => ({ ...prev, [variables.playerId]: data }));
      toast({ title: "AI Analysis complete" });
    },
    onError: (e: any) => toast({ title: "Analysis failed", description: e.message, variant: "destructive" }),
  });

  const createBulkFeedback = trpc.feedback.createBulk.useMutation();

  // When session is saved, initialize feedback for attending players
  useEffect(() => {
    if (saved && playerRecords.length > 0) {
      const attending = playerRecords.filter(r => r.attended);
      const initialFeedbacks = attending.map(r => ({
        playerId: r.playerId,
        playerName: r.playerName,
        rating: 3,
        category: 'general' as const,
        strengths: '',
        areasToImprove: '',
        recommendations: '',
        drills: [] as DrillItem[],
        videoLinks: [] as VideoLinkItem[],
        isVisibleToParent: true,
      }));
      setFeedbacks(initialFeedbacks);
      if (initialFeedbacks.length > 0) setActiveFeedbackPlayer(initialFeedbacks[0].playerId);
    }
  }, [saved]);

  const handleSaveFeedback = async () => {
    if (feedbacks.length === 0) return;
    setSavingFeedback(true);
    try {
      await createBulkFeedback.mutateAsync({
        sessionDate,
        feedbacks: feedbacks.map(fb => ({
          playerId: fb.playerId,
          category: fb.category,
          rating: fb.rating,
          strengths: fb.strengths || undefined,
          areasToImprove: fb.areasToImprove || undefined,
          recommendations: fb.recommendations || undefined,
          recommendedDrills: fb.drills.length > 0
            ? JSON.stringify(fb.drills.map(({ id, ...rest }) => rest))
            : undefined,
          videoLinks: fb.videoLinks.length > 0
            ? JSON.stringify(fb.videoLinks.map(({ id, ...rest }) => rest))
            : undefined,
          isVisibleToParent: fb.isVisibleToParent,
        })),
      });
      setFeedbackSaved(true);
      toast({ title: 'Feedback saved!', description: `Ratings for ${feedbacks.length} players saved successfully.` });
    } catch (e) {
      toast({ title: 'Error saving feedback', variant: 'destructive' });
    } finally {
      setSavingFeedback(false);
    }
  };

  const updateFeedback = (playerId: number, field: keyof PlayerFeedback, value: any) => {
    setFeedbacks(prev => prev.map(fb => fb.playerId === playerId ? { ...fb, [field]: value } : fb));
  };

  const handleTeamSelect = (teamId: number) => {
    setSelectedTeamId(teamId);
    setPlayerRecords([]);
    setActivePlayer(null);
    setSaved(false);
    setShowFeedback(false);
    setFeedbackSaved(false);
  };

  const initializePlayerRecords = () => {
    if (!teamPlayers) return;
    const records: PlayerRecord[] = (teamPlayers as any[]).map((p: any) => ({
      playerId: p.id,
      playerName: p.name || `${p.firstName || ""} ${p.lastName || ""}`.trim(),
      physicalScore: "",
      technicalScore: "",
      mentalScore: "",
      medicalScore: "",
      notes: "",
      attended: true,
    }));
    setPlayerRecords(records);
    if (records.length > 0) setActivePlayer(records[0].playerId);
    toast({ title: "Players loaded", description: `${records.length} players ready for recording` });
  };

  const updateRecord = (playerId: number, field: keyof PlayerRecord, value: any) => {
    setPlayerRecords(prev => prev.map(r => r.playerId === playerId ? { ...r, [field]: value } : r));
  };

  const handleSaveAll = async () => {
    const attendedRecords = playerRecords.filter(r => r.attended);
    if (attendedRecords.length === 0) {
      toast({ title: "No records to save", variant: "destructive" });
      return;
    }
    setSaving(true);
    let successCount = 0;
    for (const record of attendedRecords) {
      try {
        await saveSessionMutation.mutateAsync({
          playerId: record.playerId,
          sessionDate,
          // The endpoint has no sessionType field — it was being stripped anyway.
          physicalScore: record.physicalScore ? Number(record.physicalScore) : undefined,
          technicalScore: record.technicalScore ? Number(record.technicalScore) : undefined,
          mentalScore: record.mentalScore ? Number(record.mentalScore) : undefined,
          medicalScore: record.medicalScore ? Number(record.medicalScore) : undefined,
          notes: record.notes || undefined,
          teamId: selectedTeamId || undefined,
        });
        successCount++;
      } catch {}
    }
    setSaving(false);
    setSaved(true);
    toast({ title: "Session saved", description: `${successCount}/${attendedRecords.length} player records saved` });
  };

  const handleAnalyzeAll = () => {
    const attendedRecords = playerRecords.filter(r => r.attended);
    attendedRecords.forEach(r => {
      analyzeProgressMutation.mutate({ playerId: r.playerId });
    });
  };

  const activeRecord = playerRecords.find(r => r.playerId === activePlayer);
  const activeFeedback = feedbacks.find(fb => fb.playerId === activeFeedbackPlayer);

  return (
    <>
    <div className="text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BackButton />
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Activity size={22} className="text-green-700 dark:text-green-500" />
                Training Session Recorder
                <HelpIcon text="Record physical, technical, mental, and medical scores for each player. AI analyzes the data to identify progress and recommend development areas." />
              </h1>
              <p className="text-muted-foreground text-sm">
                {showFeedback ? "Step 2: Rate each player's performance & attach drills" : "Step 1: Record session data"}
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {/* Step indicator */}
            <div className="flex items-center gap-1 mr-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${!showFeedback ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'}`}>1</div>
              <div className="w-8 h-0.5 bg-muted" />
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${showFeedback ? 'bg-yellow-600 text-black' : 'bg-muted text-muted-foreground'}`}>2</div>
            </div>
            {!showFeedback ? (
              <>
                {saved && playerRecords.length > 0 && (
                  <>
                    <Button size="sm" onClick={handleAnalyzeAll} disabled={analyzeProgressMutation.isPending} className="bg-indigo-700 hover:bg-indigo-600 text-white text-xs">
                      <Brain size={12} className="mr-1" /> {analyzeProgressMutation.isPending ? "Analyzing..." : "AI Analyze All"}
                    </Button>
                    <Button size="sm" onClick={() => setShowFeedback(true)} className="bg-yellow-600 hover:bg-yellow-500 text-black text-xs">
                      <MessageSquare size={12} className="mr-1" /> Rate Players
                    </Button>
                  </>
                )}
                <Button size="sm" onClick={handleSaveAll} disabled={saving || playerRecords.length === 0} className="bg-green-700 hover:bg-green-600 text-white text-xs">
                  <Save size={12} className="mr-1" /> {saving ? "Saving..." : saved ? "Saved ✓" : "Save Session"}
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setShowFeedback(false)} className="border-border text-muted-foreground text-xs">
                  <ArrowLeft size={12} className="mr-1" /> Back to Session
                </Button>
                {!feedbackSaved ? (
                  <Button size="sm" onClick={handleSaveFeedback} disabled={savingFeedback} className="bg-yellow-600 hover:bg-yellow-500 text-black text-xs">
                    <Save size={12} className="mr-1" /> {savingFeedback ? "Saving..." : "Save All Ratings"}
                  </Button>
                ) : (
                  <Badge className="bg-green-700 text-white text-xs px-3 py-1">
                    <CheckCircle size={12} className="mr-1" /> Feedback Saved
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* STEP 1: Session Recording */}
        {!showFeedback && (
          <>
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                <Activity size={16} className="text-green-700 dark:text-green-400" /> Session Setup
                <HelpIcon text="Select the team, session date, and type before loading players." />
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Team</label>
                  <Select value={selectedTeamId?.toString() || ""} onValueChange={v => handleTeamSelect(parseInt(v))}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue placeholder="Select team..." />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      {(() => {
                        const mainTeams = (allTeams as any[] || []).filter((t: any) => t.teamType === 'main');
                        const academyTeams = (allTeams as any[] || []).filter((t: any) => t.teamType !== 'main');
                        return (
                          <>
                            {mainTeams.length > 0 && (
                              <SelectGroup>
                                <SelectLabel className="text-yellow-700 dark:text-yellow-400">Main Teams</SelectLabel>
                                {mainTeams.map((t: any) => (
                                  <SelectItem key={t.id} value={t.id.toString()} className="text-foreground">{t.name}</SelectItem>
                                ))}
                              </SelectGroup>
                            )}
                            {academyTeams.length > 0 && (
                              <SelectGroup>
                                <SelectLabel className="text-blue-600 dark:text-blue-400">Academy Teams</SelectLabel>
                                {academyTeams.map((t: any) => (
                                  <SelectItem key={t.id} value={t.id.toString()} className="text-foreground">{t.name}</SelectItem>
                                ))}
                              </SelectGroup>
                            )}
                          </>
                        );
                      })()}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Session Date</label>
                  <Input
                    type="date"
                    value={sessionDate}
                    onChange={e => setSessionDate(e.target.value)}
                    className="bg-muted border-border text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Session Type</label>
                  <Select value={sessionType} onValueChange={setSessionType}>
                    <SelectTrigger className="bg-muted border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      {['training', 'match', 'assessment', 'recovery'].map(t => (
                        <SelectItem key={t} value={t} className="text-foreground capitalize">{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={initializePlayerRecords}
                    disabled={!selectedTeamId || !teamPlayers}
                    className="w-full bg-green-700 hover:bg-green-600 text-white text-xs"
                  >
                    <Users size={12} className="mr-1" /> Load Players
                  </Button>
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs text-muted-foreground block mb-1">Session Notes (optional)</label>
                <Textarea
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  placeholder="Session objectives, weather conditions, special notes..."
                  className="bg-muted border-border text-foreground resize-none h-16 text-sm"
                />
              </div>
            </div>

            {playerRecords.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Player List */}
                <div className="bg-card rounded-xl border border-border p-4">
                  <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 text-sm">
                    <Users size={14} className="text-green-700 dark:text-green-400" /> Players ({playerRecords.length})
                  </h3>
                  <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
                    {playerRecords.map(r => (
                      <button
                        key={r.playerId}
                        onClick={() => setActivePlayer(r.playerId)}
                        className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-colors ${
                          activePlayer === r.playerId ? "bg-green-900/40 border border-green-700/50" : "bg-muted hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${r.attended ? 'bg-green-400' : 'bg-gray-600'}`} />
                          <span className="text-sm text-foreground">{r.playerName}</span>
                        </div>
                        {(r.physicalScore || r.technicalScore) && (
                          <CheckCircle size={12} className="text-green-700 dark:text-green-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Player Detail */}
                <div className="md:col-span-2">
                  {activeRecord ? (
                    <div className="bg-card rounded-xl border border-border p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-foreground">{activeRecord.playerName}</h3>
                        <button
                          onClick={() => updateRecord(activeRecord.playerId, 'attended', !activeRecord.attended)}
                          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                            activeRecord.attended ? 'bg-green-900/40 text-green-700 dark:text-green-400 border border-green-700/40' : 'bg-muted text-muted-foreground border border-border'
                          }`}
                        >
                          <CheckCircle size={12} />
                          {activeRecord.attended ? 'Present' : 'Absent'}
                        </button>
                      </div>
                      {activeRecord.attended ? (
                        <div className="grid grid-cols-2 gap-3">
                          <ScoreInput label="Physical" value={activeRecord.physicalScore} onChange={v => updateRecord(activeRecord.playerId, 'physicalScore', v)} color="text-blue-600 dark:text-blue-400" help="Speed, stamina, strength, agility" />
                          <ScoreInput label="Technical" value={activeRecord.technicalScore} onChange={v => updateRecord(activeRecord.playerId, 'technicalScore', v)} color="text-green-700 dark:text-green-400" help="Ball control, passing, shooting, dribbling" />
                          <ScoreInput label="Mental" value={activeRecord.mentalScore} onChange={v => updateRecord(activeRecord.playerId, 'mentalScore', v)} color="text-purple-600 dark:text-purple-400" help="Focus, attitude, teamwork, decision-making" />
                          <ScoreInput label="Medical" value={activeRecord.medicalScore} onChange={v => updateRecord(activeRecord.playerId, 'medicalScore', v)} color="text-red-600 dark:text-red-400" help="Fitness level, any physical concerns" />
                          <div className="col-span-2">
                            <label className="text-xs text-muted-foreground block mb-1">Notes</label>
                            <Textarea
                              value={activeRecord.notes}
                              onChange={e => updateRecord(activeRecord.playerId, 'notes', e.target.value)}
                              placeholder="Any observations for this player..."
                              className="bg-muted border-border text-foreground resize-none h-16 text-sm"
                            />
                          </div>
                          {aiAnalyses[activeRecord.playerId] && (
                            <div className="col-span-2 bg-indigo-900/20 border border-indigo-700/40 rounded-lg p-3">
                              <p className="text-xs text-indigo-600 dark:text-indigo-300 font-medium mb-1 flex items-center gap-1"><Brain size={12} /> AI Analysis</p>
                              <p className="text-xs text-muted-foreground">{aiAnalyses[activeRecord.playerId].summary || 'Analysis complete'}</p>
                              {aiAnalyses[activeRecord.playerId].recommendations?.length > 0 && (
                                <ul className="mt-2 space-y-0.5">
                                  {aiAnalyses[activeRecord.playerId].recommendations.map((r: string, i: number) => (
                                    <li key={i} className="text-xs text-muted-foreground">• {r}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertTriangle size={32} className="mx-auto mb-2 opacity-30" />
                          <p className="text-sm">Player marked as absent</p>
                          <p className="text-xs mt-1">Toggle attendance to record performance data</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                      <Users size={40} className="mx-auto mb-3 opacity-30" />
                      <p>Select a player from the list to record their performance</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {playerRecords.length === 0 && selectedTeamId && (
              <div className="text-center py-16 text-muted-foreground">
                <Users size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-lg">Team selected — click "Load Players" to start recording</p>
              </div>
            )}

            {!selectedTeamId && (
              <div className="text-center py-16 text-muted-foreground">
                <Activity size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-lg">Select a team and session date to begin</p>
                <p className="text-sm mt-2">You can record physical, technical, mental, and medical scores for each player</p>
              </div>
            )}
          </>
        )}

        {/* STEP 2: Feedback Panel */}
        {showFeedback && feedbacks.length > 0 && (
          <div>
            <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4 mb-6 flex items-start gap-3">
              <MessageSquare size={20} className="text-yellow-700 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-700 dark:text-yellow-300 font-medium text-sm">Rate each player's performance and attach training resources</p>
                <p className="text-yellow-400/70 text-xs mt-0.5">
                  Attach specific training drills and video links to help players improve their flagged weaknesses. Feedback is visible to parents by default.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Player List */}
              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2 text-sm">
                  <Users size={14} className="text-yellow-700 dark:text-yellow-400" /> Players ({feedbacks.length})
                </h3>
                <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
                  {feedbacks.map(fb => (
                    <button
                      key={fb.playerId}
                      onClick={() => { setActiveFeedbackPlayer(fb.playerId); setFeedbackTab('feedback'); }}
                      className={`w-full text-left p-2.5 rounded-lg flex items-center justify-between transition-colors ${
                        activeFeedbackPlayer === fb.playerId ? "bg-yellow-900/40 border border-yellow-700/50" : "bg-muted hover:bg-muted"
                      }`}
                    >
                      <span className="text-sm text-foreground">{fb.playerName}</span>
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={10} className={s <= fb.rating ? "text-yellow-700 dark:text-yellow-400 fill-yellow-400" : "text-gray-600"} />
                          ))}
                        </div>
                        {(fb.strengths || fb.areasToImprove) && <CheckCircle size={10} className="text-green-700 dark:text-green-400 ml-1" />}
                        {fb.drills.length > 0 && <Dumbbell size={10} className="text-blue-600 dark:text-blue-400 ml-0.5" />}
                        {fb.videoLinks.length > 0 && <Video size={10} className="text-purple-600 dark:text-purple-400 ml-0.5" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Form */}
              <div className="md:col-span-2">
                {activeFeedback ? (
                  <div className="bg-card rounded-xl border border-border p-5">
                    {/* Player header */}
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <Star size={16} className="text-yellow-700 dark:text-yellow-400" />
                        {activeFeedback.playerName}
                      </h3>
                      <button
                        onClick={() => updateFeedback(activeFeedback.playerId, 'isVisibleToParent', !activeFeedback.isVisibleToParent)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors ${
                          activeFeedback.isVisibleToParent ? 'bg-green-900/40 text-green-700 dark:text-green-400 border border-green-700/40' : 'bg-muted text-muted-foreground border border-border'
                        }`}
                      >
                        {activeFeedback.isVisibleToParent ? <Eye size={12} /> : <EyeOff size={12} />}
                        {activeFeedback.isVisibleToParent ? 'Visible to Parent' : 'Hidden from Parent'}
                      </button>
                    </div>

                    {/* Tabs: Feedback / Drills / Videos */}
                    <div className="flex gap-1 mb-4 bg-muted rounded-lg p-1">
                      {[
                        { key: 'feedback', label: 'Feedback', icon: <MessageSquare size={12} /> },
                        { key: 'drills', label: activeFeedback.drills.length > 0 ? `Drills (${activeFeedback.drills.length})` : 'Drills', icon: <Dumbbell size={12} /> },
                        { key: 'videos', label: activeFeedback.videoLinks.length > 0 ? `Videos (${activeFeedback.videoLinks.length})` : 'Videos', icon: <Video size={12} /> },
                      ].map(tab => (
                        <button
                          key={tab.key}
                          onClick={() => setFeedbackTab(tab.key as any)}
                          className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-md font-medium transition-colors ${
                            feedbackTab === tab.key
                              ? 'bg-yellow-600 text-black'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {tab.icon} {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Tab: Feedback */}
                    {feedbackTab === 'feedback' && (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs text-muted-foreground block mb-2 font-medium">Overall Rating</label>
                          <StarRating value={activeFeedback.rating} onChange={v => updateFeedback(activeFeedback.playerId, 'rating', v)} />
                        </div>

                        <div>
                          <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Feedback Category</label>
                          <div className="flex flex-wrap gap-2">
                            {(['technical', 'physical', 'mental', 'tactical', 'general'] as const).map(cat => (
                              <button
                                key={cat}
                                onClick={() => updateFeedback(activeFeedback.playerId, 'category', cat)}
                                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                                  activeFeedback.category === cat
                                    ? 'bg-yellow-600 text-black'
                                    : 'bg-muted text-muted-foreground hover:bg-muted'
                                }`}
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-xs text-green-700 dark:text-green-400 block mb-1.5 font-medium flex items-center gap-1">
                            <ThumbsUp size={12} /> Strengths / What went well
                          </label>
                          <Textarea
                            value={activeFeedback.strengths}
                            onChange={e => updateFeedback(activeFeedback.playerId, 'strengths', e.target.value)}
                            placeholder="e.g. Excellent first touch, strong in aerial duels, good positioning..."
                            className="bg-muted border-border text-foreground resize-none h-20 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-orange-700 dark:text-orange-400 block mb-1.5 font-medium flex items-center gap-1">
                            <TrendingUp size={12} /> Areas to Improve
                          </label>
                          <Textarea
                            value={activeFeedback.areasToImprove}
                            onChange={e => updateFeedback(activeFeedback.playerId, 'areasToImprove', e.target.value)}
                            placeholder="e.g. Needs to work on weak foot, defensive positioning, decision-making under pressure..."
                            className="bg-muted border-border text-foreground resize-none h-20 text-sm"
                          />
                        </div>

                        <div>
                          <label className="text-xs text-yellow-700 dark:text-yellow-400 block mb-1.5 font-medium flex items-center gap-1">
                            <CheckCircle size={12} /> Coach Recommendations
                          </label>
                          <Textarea
                            value={activeFeedback.recommendations}
                            onChange={e => updateFeedback(activeFeedback.playerId, 'recommendations', e.target.value)}
                            placeholder="e.g. Focus on 1v1 defending drills, practice weak foot finishing 15 mins per session..."
                            className="bg-muted border-border text-foreground resize-none h-16 text-sm"
                          />
                        </div>

                        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 flex items-start gap-2">
                          <Dumbbell size={14} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-blue-600 dark:text-blue-300">
                            Use the <strong>Drills</strong> and <strong>Videos</strong> tabs above to attach specific training exercises and reference videos to help this player improve.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tab: Drills */}
                    {feedbackTab === 'drills' && (
                      <DrillsSection
                        drills={activeFeedback.drills}
                        onChange={drills => updateFeedback(activeFeedback.playerId, 'drills', drills)}
                      />
                    )}

                    {/* Tab: Videos */}
                    {feedbackTab === 'videos' && (
                      <VideoLinksSection
                        videoLinks={activeFeedback.videoLinks}
                        onChange={links => updateFeedback(activeFeedback.playerId, 'videoLinks', links)}
                      />
                    )}

                    {/* Navigate to next player */}
                    {feedbacks.indexOf(activeFeedback) < feedbacks.length - 1 && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          size="sm"
                          onClick={() => {
                            const idx = feedbacks.indexOf(activeFeedback);
                            setActiveFeedbackPlayer(feedbacks[idx + 1].playerId);
                            setFeedbackTab('feedback');
                          }}
                          className="bg-muted hover:bg-muted text-foreground text-xs"
                        >
                          Next Player <ChevronRight size={12} className="ml-1" />
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-card rounded-xl border border-border p-8 text-center text-muted-foreground">
                    <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                    <p>Select a player to add feedback</p>
                  </div>
                )}
              </div>
            </div>

            {feedbackSaved && (
              <div className="mt-6 bg-green-900/20 border border-green-700/40 rounded-xl p-4 text-center">
                <CheckCircle size={32} className="text-green-700 dark:text-green-400 mx-auto mb-2" />
                <p className="text-green-700 dark:text-green-300 font-medium">All feedback saved successfully!</p>
                <p className="text-green-400/70 text-xs mt-1">Player ratings, drills, and video links will appear in their progress dashboard and parent portal.</p>
                <BackButton />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
