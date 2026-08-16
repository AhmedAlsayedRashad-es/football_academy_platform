import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Play, Plus, Search, Filter, Upload, Tag, Clock, Eye, Dumbbell,
  Brain, Activity, Stethoscope, Target, Zap, Trash2, Edit2, BookOpen, Sparkles, X
} from "lucide-react";
import { HelpTooltip } from "@/components/HelpTooltip";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";

const SKILL_AREAS = [
  { value: "physical", label: "Physical", icon: Dumbbell, color: "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30" },
  { value: "technical", label: "Technical", icon: Activity, color: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30" },
  { value: "mental", label: "Mental", icon: Brain, color: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30" },
  { value: "medical", label: "Medical / Recovery", icon: Stethoscope, color: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30" },
  { value: "passing", label: "Passing", icon: Target, color: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/30" },
  { value: "shooting", label: "Shooting", icon: Zap, color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  { value: "dribbling", label: "Dribbling", icon: Activity, color: "bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30" },
  { value: "defending", label: "Defending", icon: Dumbbell, color: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30" },
  { value: "tactical", label: "Tactical", icon: BookOpen, color: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30" },
];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"];
const AGE_GROUPS = ["All", "U8", "U10", "U12", "U14", "U16", "U18", "Senior"];

function SkillBadge({ area }: { area: string }) {
  const found = SKILL_AREAS.find(s => s.value === area);
  if (!found) return <Badge variant="outline" className="text-xs">{area}</Badge>;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${found.color}`}>
      <found.icon className="w-3 h-3" />
      {found.label}
    </span>
  );
}

function VideoCard({ video, onDelete, onEdit, isAdmin, language }: { video: any; onDelete: () => void; onEdit: () => void; isAdmin: boolean; language: string }) {
  const [showPlayer, setShowPlayer] = useState(false);
  const displayTitle = (language === 'ar' && video.titleAr) ? video.titleAr : video.title;
  const displayDescription = (language === 'ar' && video.descriptionAr) ? video.descriptionAr : video.description;
  const isYoutube = video.videoUrl && (video.videoUrl.includes("youtube.com") || video.videoUrl.includes("youtu.be"));
  const isExternal = video.videoUrl && (video.videoUrl.startsWith("http://") || video.videoUrl.startsWith("https://"));

  const getEmbedUrl = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden hover:border-blue-500/50 transition-colors group">
      {/* Thumbnail / Preview */}
      <div className="relative bg-muted aspect-video flex items-center justify-center cursor-pointer" onClick={() => setShowPlayer(true)}>
        {video.thumbnailUrl ? (
          <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-600">
            <Play className="w-12 h-12" />
            <span className="text-xs">Click to play</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-10 h-10 text-foreground" />
        </div>
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, "0")}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-foreground text-sm leading-tight">{displayTitle}</h3>
          {isAdmin && (
            <div className="flex gap-1 shrink-0">
              <button onClick={onEdit} className="text-muted-foreground hover:text-blue-600 dark:hover:text-blue-400 p-1"><Edit2 className="w-3 h-3" /></button>
              <button onClick={onDelete} className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 p-1"><Trash2 className="w-3 h-3" /></button>
            </div>
          )}
        </div>
        {displayDescription && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{displayDescription}</p>}
        <div className="flex flex-wrap gap-1 mb-2">
          <SkillBadge area={video.skillArea} />
          {video.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${
              video.difficulty === "beginner" ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20" :
              video.difficulty === "intermediate" ? "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20" :
              "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
            }`}>{video.difficulty}</span>
          )}
          {video.ageGroup && video.ageGroup !== "All" && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">{video.ageGroup}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{video.viewCount || 0} views</span>
          {video.tags && (
            <span className="flex items-center gap-1 truncate max-w-32">
              <Tag className="w-3 h-3 shrink-0" />
              <span className="truncate">{video.tags}</span>
            </span>
          )}
        </div>
      </div>

      {/* Video Player Dialog */}
      {showPlayer && (
        <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
          <DialogContent className="bg-card border-border max-w-3xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">{displayTitle}</DialogTitle>
            </DialogHeader>
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              {isYoutube ? (
                <iframe src={getEmbedUrl(video.videoUrl)} className="w-full h-full" allowFullScreen title={video.title} />
              ) : isExternal ? (
                <video src={video.videoUrl} controls className="w-full h-full" />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No video URL provided</p>
                </div>
              )}
            </div>
            {displayDescription && <p className="text-muted-foreground text-sm">{displayDescription}</p>}
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function DrillVideoLibrary() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [ageFilter, setAgeFilter] = useState<string>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"library" | "recommended">("library");
  const [recommendPlayerId, setRecommendPlayerId] = useState<number | null>(null);

  const { data: currentUser } = trpc.auth.me.useQuery();
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "coach";

  const { data: videos, refetch } = trpc.drillLibrary.getAll.useQuery({
    skillArea: (skillFilter && skillFilter !== 'all') ? skillFilter : undefined,
    ageGroup: (ageFilter && ageFilter !== 'all') ? ageFilter : undefined,
    difficulty: (difficultyFilter && difficultyFilter !== 'all') ? difficultyFilter : undefined,
    search: search || undefined,
  });

  const { data: players } = trpc.players.getAll.useQuery();
  const { data: recommendations } = trpc.drillLibrary.getRecommendations.useQuery(
    { playerId: recommendPlayerId! },
    { enabled: !!recommendPlayerId }
  );

  const createMutation = trpc.drillLibrary.create.useMutation({
    onSuccess: () => { refetch(); setShowAddDialog(false); toast({ title: "Video added to library!" }); }
  });
  const updateMutation = trpc.drillLibrary.update.useMutation({
    onSuccess: () => { refetch(); setEditingVideo(null); toast({ title: "Video updated!" }); }
  });
  const deleteMutation = trpc.drillLibrary.delete.useMutation({
    onSuccess: () => { refetch(); toast({ title: "Video removed from library" }); }
  });

  const [form, setForm] = useState({
    title: "", titleAr: "", description: "", descriptionAr: "", skillArea: "technical", ageGroup: "All",
    difficulty: "intermediate", duration: "", videoUrl: "", thumbnailUrl: "", tags: ""
  });

  const handleSubmit = () => {
    const data = { ...form, duration: form.duration ? parseInt(form.duration) : undefined };
    if (editingVideo) {
      updateMutation.mutate({ id: editingVideo.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEdit = (video: any) => {
    setForm({
      title: video.title, titleAr: video.titleAr || "",
      description: video.description || "", descriptionAr: video.descriptionAr || "",
      skillArea: video.skillArea, ageGroup: video.ageGroup || "All",
      difficulty: video.difficulty || "intermediate",
      duration: video.duration ? String(video.duration) : "",
      videoUrl: video.videoUrl || "", thumbnailUrl: video.thumbnailUrl || "",
      tags: video.tags || ""
    });
    setEditingVideo(video);
    setShowAddDialog(true);
  };

  return (
    <>
    <div className="text-foreground p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/training")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Play className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              Drill Video Library
              <HelpTooltip content="Upload and manage training drill videos organized by skill area. Coaches can add videos with tags, difficulty levels, and age groups. The AI recommends videos based on each player's weakest areas from their session data." />
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Internal drill video library with AI-powered skill recommendations</p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditingVideo(null); setForm({ title: "", titleAr: "", description: "", descriptionAr: "", skillArea: "technical", ageGroup: "All", difficulty: "intermediate", duration: "", videoUrl: "", thumbnailUrl: "", tags: "" }); setShowAddDialog(true); }}
            className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> Add Drill Video
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("library")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "library" ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          <BookOpen className="w-4 h-4 inline mr-2" />
          Full Library ({videos?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab("recommended")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "recommended" ? "bg-purple-600 text-white" : "bg-muted text-muted-foreground hover:text-foreground"}`}
        >
          <Sparkles className="w-4 h-4 inline mr-2" />
          AI Recommendations
        </button>
      </div>

      {activeTab === "library" && (
        <>
          {/* Filters */}
          <div className="bg-card rounded-xl p-4 mb-6 border border-border">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-48">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search drills..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-9 bg-muted border-border text-foreground"
                  />
                </div>
              </div>
              <Select value={skillFilter} onValueChange={setSkillFilter}>
                <SelectTrigger className="w-44 bg-muted border-border text-foreground">
                  <SelectValue placeholder="Skill Area" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  <SelectItem value="all" className="text-foreground">All Skills</SelectItem>
                  {SKILL_AREAS.map(s => (
                    <SelectItem key={s.value} value={s.value} className="text-foreground">{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="w-40 bg-muted border-border text-foreground">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  <SelectItem value="all" className="text-foreground">All Levels</SelectItem>
                  {DIFFICULTIES.map(d => (
                    <SelectItem key={d} value={d} className="text-foreground capitalize">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={ageFilter} onValueChange={setAgeFilter}>
                <SelectTrigger className="w-36 bg-muted border-border text-foreground">
                  <SelectValue placeholder="Age Group" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  <SelectItem value="all" className="text-foreground">All Ages</SelectItem>
                  {AGE_GROUPS.map(a => (
                    <SelectItem key={a} value={a} className="text-foreground">{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(skillFilter || difficultyFilter || ageFilter || search) && (
                <Button variant="ghost" size="sm" onClick={() => { setSkillFilter("all"); setDifficultyFilter("all"); setAgeFilter("all"); setSearch(""); }} className="text-muted-foreground">
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
              )}
            </div>
          </div>

          {/* Skill Area Quick Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {SKILL_AREAS.map(area => (
              <button
                key={area.value}
                onClick={() => setSkillFilter(skillFilter === area.value ? "all" : area.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  skillFilter === area.value ? area.color : "bg-muted text-muted-foreground border-border hover:border-gray-500"
                }`}
              >
                <area.icon className="w-3 h-3" />
                {area.label}
              </button>
            ))}
          </div>

          {/* Video Grid */}
          {!videos || videos.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <Upload className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg mb-2">No drill videos yet</p>
              <p className="text-sm mb-4">Add your first drill video to start building the library</p>
              {isAdmin && (
                <Button onClick={() => setShowAddDialog(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" /> Add First Video
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {videos.map(video => (
                <VideoCard
                  key={video.id}
                  video={video}
                  isAdmin={isAdmin}
                  language={language}
                  onEdit={() => openEdit(video)}
                  onDelete={() => deleteMutation.mutate({ id: video.id })}
                />
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "recommended" && (
        <div>
          <div className="bg-card rounded-xl p-4 mb-6 border border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Select a player to get AI-powered drill recommendations based on their weakest performance areas from recent training sessions.
            </p>
            <Select onValueChange={(v) => setRecommendPlayerId(parseInt(v))}>
              <SelectTrigger className="w-72 bg-muted border-border text-foreground">
                <SelectValue placeholder="Select a player..." />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {(players || []).map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)} className="text-foreground">
                    {p.firstName} {p.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {recommendPlayerId && !recommendations && (
            <div className="text-center py-10 text-muted-foreground">
              <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p>Analyzing player performance...</p>
            </div>
          )}

          {recommendPlayerId && recommendations && recommendations.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg mb-2">No recommendations available yet</p>
              <p className="text-sm">Either no session data exists for this player, or no matching drill videos are in the library.</p>
              <p className="text-sm mt-1">Add drill videos to the library and record training sessions to enable AI recommendations.</p>
            </div>
          )}

          {recommendations && recommendations.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-foreground font-semibold">AI Recommended Drills</h3>
                <span className="text-xs text-muted-foreground">Based on weakest performance areas</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recommendations.map(video => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    isAdmin={isAdmin}
                    language={language}
                    onEdit={() => openEdit(video)}
                    onDelete={() => deleteMutation.mutate({ id: video.id })}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(o) => { setShowAddDialog(o); if (!o) setEditingVideo(null); }}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVideo ? "Edit Drill Video" : "Add Drill Video"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-muted-foreground">Title (English) *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Rondo Passing Drill" className="bg-muted border-border text-foreground mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground">Title (Arabic) <span className="text-muted-foreground font-normal">اختياري</span></Label>
              <Input value={form.titleAr} onChange={e => setForm(f => ({ ...f, titleAr: e.target.value }))}
                placeholder="مثال: تمرين التمرير الدائري" className="bg-muted border-border text-foreground mt-1" dir="rtl" />
            </div>
            <div>
              <Label className="text-muted-foreground">Description (English)</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the drill objectives and instructions..." className="bg-muted border-border text-foreground mt-1" rows={2} />
            </div>
            <div>
              <Label className="text-muted-foreground">Description (Arabic) <span className="text-muted-foreground font-normal">اختياري</span></Label>
              <Textarea value={form.descriptionAr} onChange={e => setForm(f => ({ ...f, descriptionAr: e.target.value }))}
                placeholder="صف أهداف التمرين وتعليماته..." className="bg-muted border-border text-foreground mt-1" rows={2} dir="rtl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground">Skill Area *</Label>
                <Select value={form.skillArea} onValueChange={v => setForm(f => ({ ...f, skillArea: v }))}>
                  <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    {SKILL_AREAS.map(s => (
                      <SelectItem key={s.value} value={s.value} className="text-foreground">{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground">Difficulty</Label>
                <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
                  <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    {DIFFICULTIES.map(d => (
                      <SelectItem key={d} value={d} className="text-foreground capitalize">{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-muted-foreground">Age Group</Label>
                <Select value={form.ageGroup} onValueChange={v => setForm(f => ({ ...f, ageGroup: v }))}>
                  <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    {AGE_GROUPS.map(a => (
                      <SelectItem key={a} value={a} className="text-foreground">{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-muted-foreground">Duration (seconds)</Label>
                <Input type="number" value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                  placeholder="e.g. 300 = 5 min" className="bg-muted border-border text-foreground mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">Video URL</Label>
              <Input value={form.videoUrl} onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                placeholder="YouTube URL or direct video link" className="bg-muted border-border text-foreground mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Supports YouTube links and direct video URLs (MP4)</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Thumbnail URL</Label>
              <Input value={form.thumbnailUrl} onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                placeholder="Image URL for thumbnail" className="bg-muted border-border text-foreground mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground">Tags</Label>
              <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="e.g. passing, possession, warm-up" className="bg-muted border-border text-foreground mt-1" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={!form.title || createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700">
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingVideo ? "Update Video" : "Add to Library"}
              </Button>
              <Button variant="outline" onClick={() => { setShowAddDialog(false); setEditingVideo(null); }}
                className="border-border text-muted-foreground hover:bg-muted">Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
