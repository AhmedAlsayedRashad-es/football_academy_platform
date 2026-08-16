import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Activity, Heart, AlertTriangle, CheckCircle, Clock, Shield,
  Stethoscope, Pill, Zap, Search, ArrowLeft, AlertCircle,
  Users, FileText, Phone, CalendarClock, Bandage
} from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  active:   { label: "Fit",      color: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400",  icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  injured:  { label: "Injured",  color: "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400",          icon: <AlertTriangle className="h-4 w-4 text-red-500" /> },
  inactive: { label: "Inactive", color: "bg-gray-500/10 border-gray-500/30 text-gray-700 dark:text-gray-400",      icon: <Shield className="h-4 w-4 text-muted-foreground" /> },
  trial:    { label: "Trial",    color: "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400",      icon: <Clock className="h-4 w-4 text-blue-500" /> },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string }> = {
  minor:    { label: "Minor",    color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  moderate: { label: "Moderate", color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30" },
  severe:   { label: "Severe",   color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" },
};

const riskColor = (score: number | null) => {
  if (!score) return "bg-gray-300";
  if (score >= 70) return "bg-red-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-green-500";
};

const riskLabel = (score: number | null) => {
  if (!score) return "—";
  if (score >= 70) return "High Risk";
  if (score >= 40) return "Moderate";
  return "Low Risk";
};

/** Returns days until return date (negative = overdue) */
function daysUntilReturn(expectedRecoveryDate: string | null): number | null {
  if (!expectedRecoveryDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(expectedRecoveryDate);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function ReturnCountdown({ expectedRecoveryDate }: { expectedRecoveryDate: string | null }) {
  const days = daysUntilReturn(expectedRecoveryDate);
  if (days === null) return null;
  if (days < 0) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-400 text-xs font-medium">
        <CalendarClock className="h-3.5 w-3.5" />
        <span>Overdue by {Math.abs(days)}d</span>
      </div>
    );
  }
  if (days === 0) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400 text-xs font-medium">
        <CalendarClock className="h-3.5 w-3.5" />
        <span>Return today</span>
      </div>
    );
  }
  const color = days <= 7 ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400" : "bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-400";
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${color} text-xs font-medium`}>
      <CalendarClock className="h-3.5 w-3.5" />
      <span>{days}d to return</span>
    </div>
  );
}

export default function MedicalStatusDashboard() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");

  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: allPlayers, isLoading } = trpc.players.getAllPlayersWithMedical.useQuery();

  const filtered = (allPlayers || []).filter((p: any) => {
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchSearch = !search || name.includes(search.toLowerCase());
    const matchTeam   = teamFilter === "all"   || String(p.teamId) === teamFilter;
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const score = p.injuryRiskScore || 0;
    const matchRisk   = riskFilter === "all"   ||
      (riskFilter === "high"     && score >= 70) ||
      (riskFilter === "moderate" && score >= 40 && score < 70) ||
      (riskFilter === "low"      && score < 40);
    return matchSearch && matchTeam && matchStatus && matchRisk;
  });

  const total        = allPlayers?.length || 0;
  const injured      = (allPlayers || []).filter((p: any) => p.status === "injured").length;
  const highRisk     = (allPlayers || []).filter((p: any) => (p.injuryRiskScore || 0) >= 70).length;
  const withFlags    = (allPlayers || []).filter((p: any) => p.chronicConditions || p.allergies).length;
  const fitPct       = total > 0 ? Math.round(((total - injured) / total) * 100) : 0;

  const byTeam = (teams || []).map((team: any) => ({
    team,
    players: (allPlayers || []).filter((p: any) => p.teamId === team.id),
  })).filter(t => t.players.length > 0);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <button onClick={() => navigate("/dashboard")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Stethoscope className="h-8 w-8 text-primary" />
              Medical Status Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Team Doctor view — all players' medical status across all teams</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/injury-prevention")} className="gap-2">
            <Activity className="h-4 w-4" /> Injury Prevention AI
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Squad Fitness</p>
                  <p className="text-3xl font-bold text-green-700 dark:text-green-500">{fitPct}%</p>
                  <p className="text-xs text-muted-foreground">{total - injured} of {total} fit</p>
                </div>
                <CheckCircle className="h-10 w-10 text-green-700 dark:text-green-500 opacity-20" />
              </div>
              <Progress value={fitPct} className="mt-2 h-1.5" />
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Injured</p>
                  <p className="text-3xl font-bold text-red-500">{injured}</p>
                  <p className="text-xs text-muted-foreground">Unavailable</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">High Risk</p>
                  <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-500">{highRisk}</p>
                  <p className="text-xs text-muted-foreground">Risk score ≥ 70</p>
                </div>
                <Zap className="h-10 w-10 text-yellow-700 dark:text-yellow-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Medical Flags</p>
                  <p className="text-3xl font-bold text-blue-500">{withFlags}</p>
                  <p className="text-xs text-muted-foreground">Conditions / allergies</p>
                </div>
                <Pill className="h-10 w-10 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full max-w-lg grid-cols-4">
            <TabsTrigger value="all">All Players</TabsTrigger>
            <TabsTrigger value="by-team">By Team</TabsTrigger>
            <TabsTrigger value="flagged">Flagged</TabsTrigger>
            <TabsTrigger value="injury-tracking" className="flex items-center gap-1">
              <Bandage className="h-3.5 w-3.5" />
              Injury Tracking
            </TabsTrigger>
          </TabsList>

          {/* ── All Players ── */}
          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap gap-3">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search player…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Select value={teamFilter} onValueChange={setTeamFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Teams" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teams</SelectItem>
                      {(teams || []).map((t: any) => <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Fit</SelectItem>
                      <SelectItem value="injured">Injured</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={riskFilter} onValueChange={setRiskFilter}>
                    <SelectTrigger className="w-[130px]"><SelectValue placeholder="Risk" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="low">Low Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No players match the current filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((p: any) => {
                  const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.active;
                  const hasFlags = p.chronicConditions || p.allergies;
                  const score = p.injuryRiskScore || 0;
                  const sevCfg = p.severity ? SEVERITY_CONFIG[p.severity] : null;
                  return (
                    <Card key={p.id} className={`border ${p.status === "injured" ? "border-red-500/40" : hasFlags ? "border-yellow-500/30" : "border-border"}`}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between gap-4 flex-wrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                              {p.firstName[0]}{p.lastName[0]}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold">{p.firstName} {p.lastName}</p>
                                {hasFlags && <AlertCircle className="h-4 w-4 text-yellow-700 dark:text-yellow-500" />}
                              </div>
                              <p className="text-xs text-muted-foreground capitalize">{p.position} · {p.teamName || "No Team"} · {p.ageGroup || ""}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${cfg.color}`}>
                              {cfg.icon} {cfg.label}
                            </div>
                            {score > 0 && (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                                  <div className={`h-full rounded-full ${riskColor(score)}`} style={{ width: `${score}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground">{riskLabel(score)}</span>
                              </div>
                            )}
                            {p.status === "injured" && (
                              <ReturnCountdown expectedRecoveryDate={p.expectedRecoveryDate} />
                            )}
                            <Button size="sm" variant="outline" onClick={() => navigate(`/players/${p.id}/medical`)} className="gap-1 text-xs h-7">
                              <FileText className="h-3 w-3" /> Medical File
                            </Button>
                          </div>
                        </div>

                        {/* Injury details for injured players */}
                        {p.status === "injured" && p.injuryType && (
                          <div className="mt-3 pt-3 border-t border-red-500/20 flex flex-wrap gap-3 items-center">
                            <div className="flex items-center gap-1.5 text-xs">
                              <Bandage className="h-3.5 w-3.5 text-red-500" />
                              <span className="font-medium text-muted-foreground">Injury:</span>
                              <span>{p.injuryType}</span>
                              {p.bodyPart && <span className="text-muted-foreground">({p.bodyPart})</span>}
                            </div>
                            {sevCfg && (
                              <Badge variant="outline" className={`text-xs ${sevCfg.color}`}>{sevCfg.label}</Badge>
                            )}
                            {p.injuryDate && (
                              <span className="text-xs text-muted-foreground">
                                Since {new Date(p.injuryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            )}
                            {p.expectedRecoveryDate && (
                              <span className="text-xs text-muted-foreground">
                                Est. return: <strong>{new Date(p.expectedRecoveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                              </span>
                            )}
                          </div>
                        )}

                        {hasFlags && (
                          <div className="mt-3 pt-3 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-2">
                            {p.chronicConditions && (
                              <div className="flex items-start gap-2 text-xs">
                                <Heart className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                                <span><span className="font-medium text-muted-foreground">Conditions: </span>{p.chronicConditions}</span>
                              </div>
                            )}
                            {p.allergies && (
                              <div className="flex items-start gap-2 text-xs">
                                <Pill className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-500 mt-0.5 shrink-0" />
                                <span><span className="font-medium text-muted-foreground">Allergies: </span>{p.allergies}</span>
                              </div>
                            )}
                            {p.bloodType && (
                              <div className="flex items-start gap-2 text-xs">
                                <Activity className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                                <span><span className="font-medium text-muted-foreground">Blood Type: </span><strong>{p.bloodType}</strong></span>
                              </div>
                            )}
                            {p.emergencyContact && (
                              <div className="flex items-start gap-2 text-xs">
                                <Phone className="h-3.5 w-3.5 text-green-700 dark:text-green-500 mt-0.5 shrink-0" />
                                <span><span className="font-medium text-muted-foreground">Emergency: </span>{p.emergencyContact}</span>
                              </div>
                            )}
                          </div>
                        )}
                        {p.notes && (
                          <p className="mt-2 text-xs text-muted-foreground bg-muted/30 rounded px-2 py-1">
                            <span className="font-medium">Note: </span>{p.notes}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── By Team ── */}
          <TabsContent value="by-team" className="space-y-6">
            {byTeam.map(({ team, players: tp }) => {
              const teamFit     = tp.filter((p: any) => p.status === "active").length;
              const teamInjured = tp.filter((p: any) => p.status === "injured").length;
              const teamRisk    = tp.filter((p: any) => (p.injuryRiskScore || 0) >= 70).length;
              return (
                <Card key={team.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Users className="h-5 w-5 text-primary" />
                        {team.name}
                        <Badge variant="outline" className="text-xs">{team.ageGroup}</Badge>
                      </CardTitle>
                      <div className="flex gap-3 text-sm">
                        <span className="text-green-700 dark:text-green-500 font-medium">{teamFit} Fit</span>
                        {teamInjured > 0 && <span className="text-red-500 font-medium">{teamInjured} Injured</span>}
                        {teamRisk    > 0 && <span className="text-yellow-700 dark:text-yellow-500 font-medium">{teamRisk} High Risk</span>}
                      </div>
                    </div>
                    <Progress value={tp.length > 0 ? (teamFit / tp.length) * 100 : 0} className="h-1.5 mt-1" />
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {tp.map((p: any) => {
                        const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.active;
                        const hasFlags = p.chronicConditions || p.allergies;
                        return (
                          <div key={p.id} className={`p-3 rounded-lg border ${p.status === "injured" ? "border-red-500/40 bg-red-500/5" : hasFlags ? "border-yellow-500/30 bg-yellow-500/5" : "border-border bg-muted/20"}`}>
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm">{p.firstName} {p.lastName}</p>
                                <p className="text-xs text-muted-foreground capitalize">{p.position}</p>
                              </div>
                              <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs ${cfg.color}`}>
                                {cfg.icon} {cfg.label}
                              </div>
                            </div>
                            {p.status === "injured" && p.injuryType && (
                              <div className="text-xs text-red-600 dark:text-red-400 mb-1">
                                <Bandage className="h-3 w-3 inline mr-1" />
                                {p.injuryType} {p.bodyPart ? `(${p.bodyPart})` : ""}
                              </div>
                            )}
                            {p.status === "injured" && (
                              <ReturnCountdown expectedRecoveryDate={p.expectedRecoveryDate} />
                            )}
                            <div className="flex justify-end mt-2">
                              <Button size="sm" variant="outline" onClick={() => navigate(`/players/${p.id}/medical`)} className="h-7 text-xs">File</Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* ── Flagged ── */}
          <TabsContent value="flagged" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Injured with return dates */}
              <Card className="border-red-500/30">
                <CardHeader>
                  <CardTitle className="text-red-500 flex items-center gap-2 text-base">
                    <AlertTriangle className="h-4 w-4" /> Injured Players ({injured})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {injured === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No injured players</p>
                  ) : (
                    <div className="space-y-3">
                      {(allPlayers || []).filter((p: any) => p.status === "injured").map((p: any) => {
                        const sevCfg = p.severity ? SEVERITY_CONFIG[p.severity] : null;
                        return (
                          <div key={p.id} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm">{p.firstName} {p.lastName}</p>
                                <p className="text-xs text-muted-foreground">{p.teamName}</p>
                              </div>
                              <Button size="sm" variant="outline" onClick={() => navigate(`/players/${p.id}/medical`)} className="h-7 text-xs">File</Button>
                            </div>
                            {p.injuryType && (
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className="text-xs flex items-center gap-1">
                                  <Bandage className="h-3 w-3 text-red-500" />
                                  {p.injuryType} {p.bodyPart ? `(${p.bodyPart})` : ""}
                                </span>
                                {sevCfg && <Badge variant="outline" className={`text-xs ${sevCfg.color}`}>{sevCfg.label}</Badge>}
                              </div>
                            )}
                            <div className="flex items-center gap-2 flex-wrap">
                              {p.injuryDate && (
                                <span className="text-xs text-muted-foreground">
                                  Injured: {new Date(p.injuryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                              <ReturnCountdown expectedRecoveryDate={p.expectedRecoveryDate} />
                            </div>
                            {p.expectedRecoveryDate && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Est. return: <strong>{new Date(p.expectedRecoveryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* High Risk */}
              <Card className="border-yellow-500/30">
                <CardHeader>
                  <CardTitle className="text-yellow-700 dark:text-yellow-500 flex items-center gap-2 text-base">
                    <Zap className="h-4 w-4" /> High Injury Risk ({highRisk})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {highRisk === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No high-risk players</p>
                  ) : (
                    <div className="space-y-2">
                      {(allPlayers || []).filter((p: any) => (p.injuryRiskScore || 0) >= 70).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                          <div>
                            <p className="font-medium text-sm">{p.firstName} {p.lastName}</p>
                            <p className="text-xs text-muted-foreground">{p.teamName} · Risk: {p.injuryRiskScore}%</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/players/${p.id}/medical`)} className="h-7 text-xs">File</Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Chronic Conditions */}
              <Card className="border-blue-500/30">
                <CardHeader>
                  <CardTitle className="text-blue-500 flex items-center gap-2 text-base">
                    <Heart className="h-4 w-4" /> Chronic Conditions ({(allPlayers || []).filter((p: any) => p.chronicConditions).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(allPlayers || []).filter((p: any) => p.chronicConditions).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recorded conditions</p>
                  ) : (
                    <div className="space-y-2">
                      {(allPlayers || []).filter((p: any) => p.chronicConditions).map((p: any) => (
                        <div key={p.id} className="p-2 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{p.firstName} {p.lastName}</p>
                            <span className="text-xs text-muted-foreground">{p.teamName}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{p.chronicConditions}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Allergies */}
              <Card className="border-orange-500/30">
                <CardHeader>
                  <CardTitle className="text-orange-700 dark:text-orange-500 flex items-center gap-2 text-base">
                    <Pill className="h-4 w-4" /> Allergies ({(allPlayers || []).filter((p: any) => p.allergies).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(allPlayers || []).filter((p: any) => p.allergies).length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recorded allergies</p>
                  ) : (
                    <div className="space-y-2">
                      {(allPlayers || []).filter((p: any) => p.allergies).map((p: any) => (
                        <div key={p.id} className="p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{p.firstName} {p.lastName}</p>
                            <span className="text-xs text-muted-foreground">{p.teamName}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{p.allergies}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ── Injury Tracking ── */}
          <TabsContent value="injury-tracking" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bandage className="h-5 w-5 text-red-500" />
                  Injury Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(allPlayers || []).filter((p: any) => p.status === 'injured' || (p.injuryRiskScore || 0) >= 40).length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-700 dark:text-green-500 opacity-50" />
                      <p className="font-medium">No active injuries or high-risk players</p>
                      <p className="text-sm mt-1">All players are fit and at low risk</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {/* Injured Players */}
                      {(allPlayers || []).filter((p: any) => p.status === 'injured').length > 0 && (
                        <div>
                          <h3 className="font-semibold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Currently Injured ({(allPlayers || []).filter((p: any) => p.status === 'injured').length})
                          </h3>
                          <div className="grid gap-3">
                            {(allPlayers || []).filter((p: any) => p.status === 'injured').map((p: any) => (
                              <div key={p.id} className="flex items-start justify-between p-4 rounded-lg border border-red-500/20 bg-red-500/5">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-red-500" />
                                  </div>
                                  <div>
                                    <p className="font-semibold">{p.firstName} {p.lastName}</p>
                                    <p className="text-sm text-muted-foreground">{p.position || 'Unknown position'}</p>
                                    {p.injuryType && (
                                      <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                                        {p.injuryType} {p.bodyPart ? `(${p.bodyPart})` : ''}
                                      </p>
                                    )}
                                    {p.injuryDate && (
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        Since {new Date(p.injuryDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <ReturnCountdown expectedRecoveryDate={p.expectedRecoveryDate} />
                                  {p.injuryRiskScore && (
                                    <div className="text-xs text-muted-foreground">Risk: {p.injuryRiskScore}%</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {/* High Risk Players */}
                      {(allPlayers || []).filter((p: any) => p.status !== 'injured' && (p.injuryRiskScore || 0) >= 70).length > 0 && (
                        <div>
                          <h3 className="font-semibold text-orange-600 dark:text-orange-400 mb-3 flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            High Injury Risk ({(allPlayers || []).filter((p: any) => p.status !== 'injured' && (p.injuryRiskScore || 0) >= 70).length})
                          </h3>
                          <div className="grid gap-3">
                            {(allPlayers || []).filter((p: any) => p.status !== 'injured' && (p.injuryRiskScore || 0) >= 70).map((p: any) => (
                              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-orange-500/20 bg-orange-500/5">
                                <div>
                                  <p className="font-semibold">{p.firstName} {p.lastName}</p>
                                  <p className="text-sm text-muted-foreground">{p.position || 'Unknown'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-muted rounded-full h-2">
                                    <div className={`h-2 rounded-full ${riskColor(p.injuryRiskScore)}`} style={{ width: `${p.injuryRiskScore}%` }} />
                                  </div>
                                  <span className="text-sm font-medium text-orange-600">{p.injuryRiskScore}%</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => navigate('/injury-prevention')} className="gap-2">
                <Activity className="h-4 w-4" /> Open Injury Prevention AI
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
