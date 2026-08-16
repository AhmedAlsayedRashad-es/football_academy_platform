import { useState, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation, useSearch } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft, FileText, Printer, Download, User, Calendar, Activity,
  Shield, Star, TrendingUp, AlertTriangle, Award, Target, Zap,
  CheckCircle, Clock, BarChart2, Dumbbell
} from "lucide-react";

const PERIOD_OPTIONS = [
  { label: "Last 30 Days", days: 30 },
  { label: "Last 90 Days", days: 90 },
  { label: "Last 6 Months", days: 180 },
  { label: "Full Season", days: 365 },
  { label: "All Time", days: 0 },
];

function SectionHeader({ icon: Icon, title, color = "text-primary" }: { icon: any; title: string; color?: string }) {
  return (
    <div className={`flex items-center gap-2 mb-4 pb-2 border-b border-border`}>
      <Icon className={`h-5 w-5 ${color}`} />
      <h3 className="font-bold text-lg">{title}</h3>
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="text-center p-3 rounded-xl bg-muted/40 border border-border">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="text-xs font-medium mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function SkillBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3 mb-2">
      <span className="text-xs w-28 text-right text-muted-foreground">{label}</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-bold w-8 text-right">{value}</span>
    </div>
  );
}

export default function FullPlayerReport() {
  // Team type filter
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const teamTypeFilter = searchParams.get('team') as 'main' | 'academy' | null;
  const [selectedTeamTypeFilter, setSelectedTeamTypeFilter] = useState<'all' | 'main' | 'academy'>(
    teamTypeFilter || 'all'
  );
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  const { t, language } = useLanguage();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [periodDays, setPeriodDays] = useState(90);
  const [selectorTeamId, setSelectorTeamId] = useState<number>(0);

  const { data: allPlayers, isLoading: playersLoading } = trpc.players.getAll.useQuery();
  const { data: allTeams } = trpc.teams.getAll.useQuery();
  const mainTeams = (allTeams || []).filter((t: any) => t.teamType === 'main');
  const academyTeams = (allTeams || []).filter((t: any) => t.teamType === 'academy');

  const fromDate = periodDays > 0
    ? new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    : undefined;

  const { data: report, isLoading: reportLoading } = trpc.players.getFullReport.useQuery(
    { playerId: selectedPlayerId!, fromDate },
    { enabled: !!selectedPlayerId }
  );
  const { data: positionRecs } = trpc.scoutingProfiles.getPositionRecommendations.useQuery(
    { playerId: selectedPlayerId! },
    { enabled: !!selectedPlayerId }
  );

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) { navigate("/"); return null; }

  const teamMap = Object.fromEntries((allTeams || []).map((t: any) => [t.id, t.name]));

  async function handlePrint() {
    if (!report) return;
    window.print();
  }

  async function handleExportPDF() {
    if (!report || !reportRef.current) return;
    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");
      toast({ title: "Generating PDF...", description: "Please wait" });
      const canvas = await html2canvas(reportRef.current, { scale: 1.5, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let yPos = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      while (yPos < pdfHeight) {
        if (yPos > 0) pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, -yPos, pdfWidth, pdfHeight);
        yPos += pageHeight;
      }
      const playerName = report.player ? `${report.player.firstName}_${report.player.lastName}` : "player";
      pdf.save(`${playerName}_report.pdf`);
      toast({ title: "PDF exported!", description: `${playerName}_report.pdf` });
    } catch (e) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  }

  const p = report?.player;
  const att = report?.attendance;
  const perf = report?.performance;
  const skills = report?.skills;
  const injuries = report?.injuries || [];
  const achievements = report?.achievements || [];
  const pts = report?.points;
  const feedback = report?.feedback || [];

  const activeInjuries = injuries.filter((i: any) => i.status === 'active' || i.status === 'recovering');
  const recoveredInjuries = injuries.filter((i: any) => i.status === 'recovered');

  const latestSkill = skills?.latest;
  const baselineSkill = skills?.baseline;

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between no-print">
          <div>
            <button onClick={() => teamTypeFilter ? navigate(`/team-dashboard?team=${teamTypeFilter}`) : navigate("/players")} className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Full Player Report
            </h1>
            <p className="text-muted-foreground mt-1">Comprehensive player analysis with all metrics</p>
          </div>
          {report && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button onClick={handleExportPDF} className="gap-2">
                <Download className="h-4 w-4" /> Export PDF
              </Button>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 no-print">
          {/* Step 1: Team Type */}
          <div className="p-3 bg-muted/50 rounded-lg w-full">
            <label className="block text-xs font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
              {language === 'ar' ? '① اختر نوع الفريق أولاً' : '① Select Team Type First'}
            </label>
            <div className="flex gap-2 flex-wrap">
              {(['all', 'main', 'academy'] as const).map((type) => (
                <button key={type}
                  onClick={() => { setSelectedTeamTypeFilter(type); setSelectedPlayerId(null); setSelectorTeamId(0); }}
                  className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                    selectedTeamTypeFilter === type ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}>
                  {type === 'all' ? (language === 'ar' ? 'الكل' : 'All Players') :
                   type === 'main' ? `⚽ ${language === 'ar' ? 'الفريق الأول' : 'Main Team'}` :
                   `🛡️ ${language === 'ar' ? 'الأكاديمية' : 'Academy'}`}
                </button>
              ))}
            </div>
          </div>
          {/* Step 2: Sub-team */}
          <div>
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-muted-foreground">
              {language === 'ar' ? '② اختر الفريق الفرعي (اختياري)' : '② Filter by Sub-team (optional)'}
            </label>
            <Select value={selectorTeamId ? String(selectorTeamId) : ""} onValueChange={v => { setSelectorTeamId(Number(v)); setSelectedPlayerId(null); }}>
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
          {/* Step 3: Player */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-muted-foreground">
              {language === 'ar' ? '③ اختر اللاعب' : '③ Select Player'}
            </label>
            <Select
              value={selectedPlayerId?.toString() || ""}
              onValueChange={(v) => setSelectedPlayerId(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue placeholder={playersLoading ? "Loading players..." : "Select a player..."} />
              </SelectTrigger>
              <SelectContent>
                {(allPlayers || []).filter((pl: any) => {
                  const typeMatch = selectedTeamTypeFilter === 'all' || 
                    (allTeams || []).some((t: any) => t.id === pl.teamId && t.teamType === selectedTeamTypeFilter);
                  const teamMatch = selectorTeamId > 0 ? pl.teamId === selectorTeamId : true;
                  return typeMatch && teamMatch;
                }).map((pl: any) => (
                  <SelectItem key={pl.id} value={pl.id.toString()}>
                    {pl.firstName} {pl.lastName} — {teamMap[pl.teamId] || "No Team"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Select value={periodDays.toString()} onValueChange={(v) => setPeriodDays(parseInt(v))}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((opt) => (
                <SelectItem key={opt.days} value={opt.days.toString()}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selectedPlayerId && (
          <Card>
            <CardContent className="py-16 text-center text-muted-foreground">
              <User className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a player to generate their full report</p>
              <p className="text-sm mt-2">Choose a player from the dropdown above</p>
            </CardContent>
          </Card>
        )}

        {selectedPlayerId && reportLoading && (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
          </div>
        )}

        {report && (
          <div ref={reportRef} className="space-y-6">
            {/* Player Profile Header */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-3xl font-bold text-primary border-2 border-primary/30">
                    {p?.firstName?.[0]}{p?.lastName?.[0]}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold">{p?.firstName} {p?.lastName}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="secondary">{p?.position || "Unknown Position"}</Badge>
                      <Badge variant="outline">{p?.teamName || "No Team"}</Badge>
                      {p?.jerseyNumber && <Badge variant="outline">#{p.jerseyNumber}</Badge>}
                      {p?.nationality && <Badge variant="outline">{p.nationality}</Badge>}
                    </div>
                    {positionRecs?.recommendations?.[0] && (() => {
                      const aiPos = positionRecs.recommendations[0].position;
                      const curPos = p?.position;
                      const mismatch = aiPos && curPos && aiPos !== curPos;
                      return (
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-muted-foreground">Current:</span>
                            <span className="font-semibold text-green-600">{curPos || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm">
                            <span className="text-muted-foreground">AI Recommended:</span>
                            <span className={`font-semibold ${mismatch ? 'text-orange-700 dark:text-orange-500' : 'text-primary'}`}>{aiPos}</span>
                            <span className="text-xs text-muted-foreground">({positionRecs.recommendations[0].suitabilityScore}/100)</span>
                          </div>
                          {mismatch && (
                            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full border border-orange-300 dark:border-orange-700">
                              Position Mismatch
                            </span>
                          )}
                        </div>
                      );
                    })()}
                    <p className="text-sm text-muted-foreground mt-2">
                      {p?.dateOfBirth ? `Age: ${new Date().getFullYear() - new Date(p.dateOfBirth).getFullYear()} yrs` : ""}
                      {p?.height ? ` · ${p.height} cm` : ""}
                      {p?.weight ? ` · ${p.weight} kg` : ""}
                      {p?.preferredFoot ? ` · ${p.preferredFoot} foot` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Report Period</p>
                    <p className="font-bold">{PERIOD_OPTIONS.find(o => o.days === periodDays)?.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">Generated {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Attendance */}
              <Card>
                <CardHeader className="pb-3">
                  <SectionHeader icon={Calendar} title="Attendance" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <StatBox label="Sessions" value={att?.total || 0} />
                    <StatBox label="Attendance Rate" value={att?.rate ? `${Math.round(att.rate)}%` : "N/A"} />
                    <StatBox
                      label="Status"
                      value={(att?.rate ?? 0) >= 80 ? "✓ Good" : (att?.rate ?? 0) >= 60 ? "~ Fair" : "✗ Low"}
                    />
                  </div>
                  {att?.records && att.records.length > 0 && (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {att.records.slice(0, 10).map((rec: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50">
                          <span className="text-muted-foreground">{new Date(rec.sessionDate || rec.date || rec.createdAt).toLocaleDateString('en-GB')}</span>
                          <Badge variant={rec.status === 'present' ? 'default' : rec.status === 'late' ? 'secondary' : 'destructive'} className="text-xs h-5">
                            {rec.status || 'present'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Summary */}
              <Card>
                <CardHeader className="pb-3">
                  <SectionHeader icon={Activity} title="Performance Metrics" />
                </CardHeader>
                <CardContent>
                  {perf?.summary ? (
                    <div className="grid grid-cols-2 gap-3">
                      <StatBox label="Avg Passes" value={perf.summary.avgPasses} sub="per session" />
                      <StatBox label="Pass Accuracy" value={`${perf.summary.avgPassAccuracy}%`} />
                      <StatBox label="Avg Distance" value={`${(perf.summary.avgDistance / 1000).toFixed(1)} km`} sub="per session" />
                      <StatBox label="Avg Sprints" value={perf.summary.avgSprints} sub="per session" />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart2 className="h-10 w-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No performance data for this period</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Skills Assessment */}
            <Card>
              <CardHeader className="pb-3">
                <SectionHeader icon={Dumbbell} title="Skills Assessment" />
                {latestSkill && baselineSkill && latestSkill.id !== baselineSkill.id && (
                  <CardDescription>Comparing latest vs baseline assessment</CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {latestSkill ? (
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <p className="text-sm font-semibold mb-3 text-muted-foreground">Technical Skills</p>
                      <SkillBar label="Ball Control" value={latestSkill.ballControl || 0} />
                      <SkillBar label="First Touch" value={latestSkill.firstTouch || 0} />
                      <SkillBar label="Dribbling" value={latestSkill.dribbling || 0} />
                      <SkillBar label="Passing" value={latestSkill.passing || 0} />
                      <SkillBar label="Shooting" value={latestSkill.shooting || 0} />
                      <SkillBar label="Heading" value={latestSkill.heading || 0} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold mb-3 text-muted-foreground">Physical & Tactical</p>
                      <SkillBar label="Speed" value={latestSkill.speed || 0} />
                      <SkillBar label="Stamina" value={latestSkill.stamina || 0} />
                      <SkillBar label="Strength" value={latestSkill.strength || 0} />
                      <SkillBar label="Agility" value={latestSkill.agility || 0} />
                      <SkillBar label="Positioning" value={latestSkill.positioning || 0} />
                      <SkillBar label="Teamwork" value={latestSkill.workRate || 0} />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No skill assessments recorded yet</p>
                  </div>
                )}
                {latestSkill && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Overall Rating: </span>
                        <span className="font-bold text-primary text-lg">{latestSkill.overallRating || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Assessment Date: </span>
                        <span className="font-medium">{latestSkill.assessmentDate ? new Date(latestSkill.assessmentDate).toLocaleDateString('en-GB') : "N/A"}</span>
                      </div>
                      {latestSkill.assessedBy && (
                        <div>
                          <span className="text-muted-foreground">Assessed By: </span>
                          <span className="font-medium">{latestSkill.assessedBy}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Injury History */}
              <Card>
                <CardHeader className="pb-3">
                  <SectionHeader icon={AlertTriangle} title="Injury History" color="text-orange-700 dark:text-orange-500" />
                </CardHeader>
                <CardContent>
                  {injuries.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-10 w-10 mx-auto mb-2 text-green-700 dark:text-green-500 opacity-70" />
                      <p className="text-sm font-medium text-green-600">No injury history</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeInjuries.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-semibold text-orange-700 dark:text-orange-500 mb-2">ACTIVE / RECOVERING</p>
                          {activeInjuries.map((inj: any) => (
                            <div key={inj.id} className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/5 mb-2">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{inj.injuryType}</span>
                                <Badge variant={inj.severity === 'severe' ? 'destructive' : inj.severity === 'moderate' ? 'secondary' : 'outline'} className="text-xs">
                                  {inj.severity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{inj.bodyPart} · {new Date(inj.injuryDate).toLocaleDateString('en-GB')}</p>
                              {inj.expectedRecoveryDate && (
                                <p className="text-xs text-orange-700 dark:text-orange-500 mt-1">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  Expected recovery: {new Date(inj.expectedRecoveryDate).toLocaleDateString('en-GB')}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {recoveredInjuries.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-green-700 dark:text-green-500 mb-2">RECOVERED ({recoveredInjuries.length})</p>
                          {recoveredInjuries.slice(0, 4).map((inj: any) => (
                            <div key={inj.id} className="flex items-center justify-between py-1.5 border-b border-border/50 text-xs">
                              <span>{inj.injuryType} — {inj.bodyPart}</span>
                              <span className="text-muted-foreground">{new Date(inj.injuryDate).toLocaleDateString('en-GB')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Achievements & Points */}
              <Card>
                <CardHeader className="pb-3">
                  <SectionHeader icon={Award} title="Achievements & Points" color="text-yellow-700 dark:text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <StatBox label="Total Points" value={pts?.points || 0} />
                    <StatBox label="Achievements" value={achievements.length} />
                  </div>
                  {achievements.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {achievements.slice(0, 6).map((ach: any) => (
                        <div key={ach.id} className="flex items-center gap-3 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                          <Star className="h-4 w-4 text-yellow-700 dark:text-yellow-500 shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{ach.title || ach.achievementType}</p>
                            {ach.description && <p className="text-xs text-muted-foreground">{ach.description}</p>}
                          </div>
                          {ach.points && <span className="ml-auto text-xs font-bold text-yellow-700 dark:text-yellow-500">+{ach.points} pts</span>}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <Star className="h-8 w-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No achievements yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coach Feedback */}
            {feedback.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <SectionHeader icon={TrendingUp} title="Coach Feedback" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {feedback.slice(0, 5).map((fb: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">{fb.feedbackDate ? new Date(fb.feedbackDate).toLocaleDateString('en-GB') : ""}</span>
                          {fb.rating && (
                            <div className="flex gap-0.5">
                              {Array.from({ length: 5 }).map((_, j) => (
                                <Star key={j} className={`h-3 w-3 ${j < fb.rating ? "text-yellow-700 dark:text-yellow-500 fill-yellow-500" : "text-muted"}`} />
                              ))}
                            </div>
                          )}
                        </div>
                        {fb.strengths && <p className="text-xs text-green-600 mb-1"><span className="font-semibold">Strengths:</span> {fb.strengths}</p>}
                        {fb.areasForImprovement && <p className="text-xs text-orange-600 mb-1"><span className="font-semibold">Improve:</span> {fb.areasForImprovement}</p>}
                        {fb.notes && <p className="text-xs text-muted-foreground">{fb.notes}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report Footer */}
            <div className="text-center py-4 text-xs text-muted-foreground border-t border-border">
              Future Stars Academy · Confidential Player Report · Generated {new Date().toLocaleString('en-GB')}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
