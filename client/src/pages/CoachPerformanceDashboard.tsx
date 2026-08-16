import { useState, useRef } from "react";
import { useLocation } from 'wouter';
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Star, TrendingUp, Award, Users, BarChart2, Plus, ChevronDown, ChevronUp,
  History, FileText, Upload, Download, Trash2, CheckCircle, AlertCircle, ArrowLeft} from 'lucide-react';
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from '@/contexts/LanguageContext';
import {

  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

function ScoreSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <Label className="text-muted-foreground text-sm">{label}</Label>
        <span className="text-yellow-700 dark:text-yellow-400 font-bold text-sm">{value}/10</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-red-500" />
    </div>
  );
}

function RatingBadge({ score }: { score: number }) {
  if (score >= 9) return <Badge className="bg-green-700 text-white">Excellent</Badge>;
  if (score >= 7) return <Badge className="bg-blue-700 text-white">Good</Badge>;
  if (score >= 5) return <Badge className="bg-yellow-700 text-white">Average</Badge>;
  return <Badge className="bg-red-700 text-white">Needs Improvement</Badge>;
}

function CoachHistoryPanel({ coachId, coachName }: { coachId: number; coachName: string }) {
  const { data: history = [] } = trpc.coachPerformance.getCoachHistory.useQuery({ coachUserId: coachId });

  const chartData = history.map((h, i) => ({
    eval: `#${history.length - i}`,
    "Session Quality": h.sessionQuality,
    "Player Engagement": h.playerEngagement,
    "Technical Knowledge": h.technicalKnowledge,
    "Communication": h.communication,
    "Punctuality": h.punctuality,
    "Overall": Math.round((h.sessionQuality + h.playerEngagement + h.technicalKnowledge + h.communication + h.punctuality) / 5),
    date: h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) : "",
  })).reverse();

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <History className="w-10 h-10 text-gray-600 mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">No evaluations yet for {coachName}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Evaluations", value: history.length },
          { label: "Best Score", value: `${Math.max(...history.map(h => Math.round((h.sessionQuality + h.playerEngagement + h.technicalKnowledge + h.communication + h.punctuality) / 5)))}/10` },
          { label: "Latest Score", value: `${Math.round((history[0].sessionQuality + history[0].playerEngagement + history[0].technicalKnowledge + history[0].communication + history[0].punctuality) / 5)}/10` },
        ].map(stat => (
          <div key={stat.label} className="bg-muted rounded-lg p-3 text-center">
            <div className="text-foreground font-bold text-lg">{stat.value}</div>
            <div className="text-muted-foreground text-xs">{stat.label}</div>
          </div>
        ))}
      </div>

      {chartData.length >= 2 ? (
        <div>
          <h4 className="text-muted-foreground text-sm font-semibold mb-2">Score Trends Over Time</h4>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="eval" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px", color: "#fff" }} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#9ca3af" }} />
                <Line type="monotone" dataKey="Overall" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Session Quality" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Player Engagement" stroke="#10b981" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Technical Knowledge" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Communication" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="Punctuality" stroke="#ec4899" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs text-center">Add at least 2 evaluations to see trend chart.</p>
      )}

      <div>
        <h4 className="text-muted-foreground text-sm font-semibold mb-2">Evaluation History</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {history.map((h) => {
            const overall = Math.round((h.sessionQuality + h.playerEngagement + h.technicalKnowledge + h.communication + h.punctuality) / 5);
            return (
              <div key={h.id} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 text-sm">
                <div className="text-muted-foreground text-xs">{h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"}</div>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>SQ:{h.sessionQuality}</span>
                  <span>PE:{h.playerEngagement}</span>
                  <span>TK:{h.technicalKnowledge}</span>
                  <span>CM:{h.communication}</span>
                  <span>PT:{h.punctuality}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-bold">{overall}/10</span>
                  <RatingBadge score={overall} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface CertTemplate {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  type: string;
  assignedTo?: string;
}

export default function CoachPerformanceDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'certificates'>('leaderboard');
  const [open, setOpen] = useState(false);
  const [expandedCoach, setExpandedCoach] = useState<number | null>(null);
  const [selectedCoach, setSelectedCoach] = useState<{ id: number; name: string } | null>(null);
  const [scores, setScores] = useState({ sessionQuality: 7, playerEngagement: 7, technicalKnowledge: 7, communication: 7, punctuality: 7 });
  const [notes, setNotes] = useState("");

  // Certificate state
  const [certTemplates, setCertTemplates] = useState<CertTemplate[]>([]);
  const [uploadingCert, setUploadingCert] = useState(false);
  const [assignCoach, setAssignCoach] = useState<string>("");
  const certFileRef = useRef<HTMLInputElement>(null);

  const { data: coachRatings = [], refetch } = trpc.coachPerformance.getAllCoachRatings.useQuery();
  const rateMutation = trpc.coachPerformance.rateCoach.useMutation({
    onSuccess: () => {
      toast({ title: "Rating submitted", description: "Coach evaluation saved successfully." });
      setOpen(false);
      setNotes("");
      setScores({ sessionQuality: 7, playerEngagement: 7, technicalKnowledge: 7, communication: 7, punctuality: 7 });
      refetch();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleRate = () => {
    if (!selectedCoach) return;
    rateMutation.mutate({ coachUserId: selectedCoach.id, ...scores, notes });
  };

  const handleCertUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCert(true);
    try {
      const formData = new FormData();
      formData.append('certificate', file);
      const res = await fetch('/api/upload-certificate', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) {
        const newTemplate: CertTemplate = {
          id: Date.now().toString(),
          name: file.name,
          url: data.url,
          uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          type: file.type.includes('pdf') ? 'PDF' : 'Image',
          assignedTo: assignCoach || undefined,
        };
        setCertTemplates(prev => [newTemplate, ...prev]);
        toast({ title: 'Certificate template uploaded', description: `${file.name} is ready to assign to coaches.` });
        setAssignCoach("");
      } else {
        toast({ title: 'Upload failed', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Upload failed', description: 'Network error. Please try again.', variant: 'destructive' });
    } finally {
      setUploadingCert(false);
      if (certFileRef.current) certFileRef.current.value = '';
    }
  };

  const handleDeleteCert = (id: string) => {
    setCertTemplates(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Certificate removed', description: 'Template deleted from the list.' });
  };

  const isAdmin = user?.role === "admin";
  const topCoach = coachRatings.length > 0 ? coachRatings.reduce((best, c) => c.avgScore > best.avgScore ? c : best, coachRatings[0]) : null;
  const avgOverall = coachRatings.length > 0 ? Math.round(coachRatings.reduce((s, c) => s + c.avgScore, 0) / coachRatings.length) : 0;

  // Coaches who pass evaluation (score >= 7)
  const passingCoaches = coachRatings.filter(c => c.avgScore >= 7);

  return (
    <>
    <div className="p-6 space-y-6">
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          
          <button onClick={() => navigate("/dashboard")} className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">

            <ArrowLeft className="w-5 h-5" />

          </button>
<h1 className="text-2xl font-bold text-foreground">Coach Performance Dashboard</h1>
          <p className="text-muted-foreground text-sm">Evaluate and track coaching staff performance over time</p>
        </div>
        <div className="flex gap-1 bg-muted rounded-lg p-1 self-start">
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'leaderboard' ? 'bg-red-700 text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'certificates' ? 'bg-red-700 text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4" /> Certificates
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />, value: coachRatings.length, label: "Total Coaches" },
          { icon: <BarChart2 className="w-8 h-8 text-green-700 dark:text-green-400" />, value: `${avgOverall}/10`, label: "Academy Average" },
          { icon: <Award className="w-8 h-8 text-yellow-700 dark:text-yellow-400" />, value: topCoach?.coach.name?.split(" ")[0] || "—", label: "Top Coach" },
          { icon: <CheckCircle className="w-8 h-8 text-emerald-700 dark:text-emerald-400" />, value: passingCoaches.length, label: "Passed Evaluation" },
        ].map((stat, i) => (
          <Card key={i} className="bg-muted border-border">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                {stat.icon}
                <div>
                  <div className="text-xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-muted-foreground text-xs">{stat.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* LEADERBOARD TAB */}
      {activeTab === 'leaderboard' && (
        <Card className="bg-muted border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-700 dark:text-yellow-400" /> Coach Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            {coachRatings.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-muted-foreground">No coaches found. Coaches will appear here once added to the system.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {[...coachRatings].sort((a, b) => b.avgScore - a.avgScore).map((item, idx) => (
                  <div key={item.coach.id} className="bg-card rounded-lg overflow-hidden">
                    <div className="flex items-center gap-4 p-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${idx === 0 ? "bg-yellow-600 text-black" : idx === 1 ? "bg-gray-400 text-black" : idx === 2 ? "bg-amber-700 text-white" : "bg-muted text-muted-foreground"}`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-semibold truncate">{item.coach.name || "Unknown Coach"}</span>
                          {item.avgScore >= 7 && (
                            <span title="Passed evaluation" className="shrink-0 inline-flex">
                              <CheckCircle className="w-4 h-4 text-green-700 dark:text-green-400" />
                            </span>
                          )}
                        </div>
                        <div className="text-muted-foreground text-xs">{item.totalEvals} evaluation{item.totalEvals !== 1 ? "s" : ""}</div>
                      </div>
                      <div className="hidden md:flex gap-1 items-end h-6">
                        {[item.avgScore, item.avgScore * 0.95, item.avgScore * 1.05, item.avgScore * 0.9, item.avgScore].map((v, i) => (
                          <div key={i} className="w-1.5 bg-red-700 rounded-sm" style={{ height: `${Math.min(100, (v / 10) * 100)}%` }} />
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-foreground font-bold">{item.avgScore}/10</div>
                          <RatingBadge score={item.avgScore} />
                        </div>
                        <div className="flex gap-1">
                          {isAdmin && (
                            <Dialog open={open && selectedCoach?.id === item.coach.id} onOpenChange={(o) => { setOpen(o); if (o) setSelectedCoach({ id: item.coach.id, name: item.coach.name || "Coach" }); }}>
                              <DialogTrigger asChild>
                                <Button size="sm" className="bg-red-700 hover:bg-red-600 text-white">
                                  <Plus className="w-3 h-3 mr-1" /> Rate
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="bg-card border-border max-w-md">
                                <DialogHeader>
                                  <DialogTitle className="text-foreground">Rate {selectedCoach?.name}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-2">
                                  <ScoreSlider label="Session Quality" value={scores.sessionQuality} onChange={(v) => setScores(s => ({ ...s, sessionQuality: v }))} />
                                  <ScoreSlider label="Player Engagement" value={scores.playerEngagement} onChange={(v) => setScores(s => ({ ...s, playerEngagement: v }))} />
                                  <ScoreSlider label="Technical Knowledge" value={scores.technicalKnowledge} onChange={(v) => setScores(s => ({ ...s, technicalKnowledge: v }))} />
                                  <ScoreSlider label="Communication" value={scores.communication} onChange={(v) => setScores(s => ({ ...s, communication: v }))} />
                                  <ScoreSlider label="Punctuality" value={scores.punctuality} onChange={(v) => setScores(s => ({ ...s, punctuality: v }))} />
                                  <div className="bg-muted rounded-lg p-3 text-center">
                                    <div className="text-muted-foreground text-xs mb-1">Overall Score</div>
                                    <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                                      {Math.round((scores.sessionQuality + scores.playerEngagement + scores.technicalKnowledge + scores.communication + scores.punctuality) / 5)}/10
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Notes (optional)</Label>
                                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-muted border-border text-foreground mt-1" placeholder="Additional feedback..." rows={3} />
                                  </div>
                                  <Button onClick={handleRate} disabled={rateMutation.isPending} className="w-full bg-red-700 hover:bg-red-600">
                                    {rateMutation.isPending ? "Saving..." : "Submit Evaluation"}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => setExpandedCoach(expandedCoach === item.coach.id ? null : item.coach.id)}>
                            {expandedCoach === item.coach.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                    {expandedCoach === item.coach.id && (
                      <div className="border-t border-border p-4 bg-card/50">
                        <div className="flex items-center gap-2 mb-3">
                          <History className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <h3 className="text-foreground font-semibold text-sm">Evaluation History — {item.coach.name}</h3>
                        </div>
                        <CoachHistoryPanel coachId={item.coach.id} coachName={item.coach.name || "Coach"} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CERTIFICATES TAB */}
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          {/* Upload section */}
          <Card className="bg-muted border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Upload className="w-5 h-5 text-red-600 dark:text-red-400" /> Upload Certificate Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm">
                Upload certificate templates (PDF or image) to award to coaches who pass their evaluation (score ≥ 7/10).
                Accepted formats: PDF, PNG, JPG, JPEG — max 20MB.
              </p>

              {/* Assign to coach (optional) */}
              <div>
                <Label className="text-muted-foreground text-sm">Assign to Coach (optional)</Label>
                <select
                  value={assignCoach}
                  onChange={(e) => setAssignCoach(e.target.value)}
                  className="w-full mt-1 bg-muted border border-border text-foreground rounded-md px-3 py-2 text-sm"
                >
                  <option value="">— General template (not assigned) —</option>
                  {passingCoaches.map(c => (
                    <option key={c.coach.id} value={c.coach.name || ""}>{c.coach.name} ({c.avgScore}/10)</option>
                  ))}
                </select>
              </div>

              {/* File input */}
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-red-500 transition-colors"
                onClick={() => certFileRef.current?.click()}
              >
                <input
                  ref={certFileRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleCertUpload}
                  disabled={uploadingCert}
                />
                {uploadingCert ? (
                  <div className="space-y-2">
                    <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-muted-foreground text-sm">Uploading certificate template...</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto" />
                    <p className="text-foreground font-medium">Click to upload certificate template</p>
                    <p className="text-muted-foreground text-xs">PDF, PNG, JPG up to 20MB</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Passing coaches notice */}
          {passingCoaches.length > 0 && (
            <Card className="bg-muted border-green-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-700 dark:text-green-400 shrink-0" />
                  <div>
                    <div className="text-foreground font-semibold text-sm">
                      {passingCoaches.length} coach{passingCoaches.length !== 1 ? 'es' : ''} eligible for certificates
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {passingCoaches.map(c => c.coach.name).join(', ')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {passingCoaches.length === 0 && (
            <Card className="bg-muted border-yellow-800">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-yellow-700 dark:text-yellow-400 shrink-0" />
                  <div>
                    <div className="text-foreground font-semibold text-sm">No coaches have passed evaluation yet</div>
                    <div className="text-muted-foreground text-xs">Coaches with an average score of 7/10 or above are eligible for certificates.</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Uploaded templates list */}
          <Card className="bg-muted border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-yellow-700 dark:text-yellow-400" /> Certificate Templates ({certTemplates.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {certTemplates.length === 0 ? (
                <div className="text-center py-10">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-muted-foreground">No certificate templates uploaded yet.</p>
                  <p className="text-muted-foreground text-sm">Upload a template above to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {certTemplates.map((cert) => (
                    <div key={cert.id} className="flex items-center gap-4 bg-card rounded-lg p-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${cert.type === 'PDF' ? 'bg-red-900' : 'bg-blue-900'}`}>
                        <FileText className={`w-5 h-5 ${cert.type === 'PDF' ? 'text-red-400' : 'text-blue-400'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-foreground font-medium text-sm truncate">{cert.name}</div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-muted-foreground text-xs">{cert.type}</span>
                          <span className="text-muted-foreground text-xs">Uploaded {cert.uploadedAt}</span>
                          {cert.assignedTo && (
                            <span className="text-green-700 dark:text-green-400 text-xs flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> {cert.assignedTo}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <a href={cert.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="ghost" className="text-blue-600 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-900/30">
                            <Download className="w-4 h-4" />
                          </Button>
                        </a>
                        {isAdmin && (
                          <Button size="sm" variant="ghost" className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-900/30" onClick={() => handleDeleteCert(cert.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </>
  );
}
