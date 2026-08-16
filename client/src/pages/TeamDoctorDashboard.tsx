import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft, Stethoscope, AlertTriangle, CheckCircle2, Clock, Users,
  Activity, Shield, TrendingDown, Calendar, Loader2, RefreshCw,
  HeartPulse, Bandage, Zap, Filter, Printer, FileText, TrendingUp,
  Paperclip, Upload, Trash2, ExternalLink, Image, X,
  ZoomIn, ZoomOut, RotateCcw, Minus, Plus
} from "lucide-react";
import { BackButton } from '@/components/BackButton';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';

const SEVERITY_COLORS: Record<string, string> = {
  minor: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
  moderate: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  severe: "bg-red-500/10 text-red-600 border-red-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-red-500/10 text-red-600 border-red-500/30",
  recovering: "bg-orange-500/10 text-orange-600 border-orange-500/30",
  recovered: "bg-green-500/10 text-green-600 border-green-500/30",
  chronic: "bg-purple-500/10 text-purple-600 border-purple-500/30",
};

const BODY_PART_ICONS: Record<string, string> = {
  knee: "🦵", ankle: "🦶", hamstring: "🦵", shoulder: "💪",
  back: "🔙", hip: "🦴", calf: "🦵", foot: "🦶", head: "🧠",
  wrist: "✋", thigh: "🦵", groin: "🩺",
};

export default function TeamDoctorDashboard() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const { t, language } = useLanguage();
  const [filterTeam, setFilterTeam] = useState("all");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterBodyPart, setFilterBodyPart] = useState<string | null>(null);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [selectedInjury, setSelectedInjury] = useState<any>(null);
  const [clearNotes, setClearNotes] = useState("");
  const [newRecoveryDate, setNewRecoveryDate] = useState("");
  const [showAttachDialog, setShowAttachDialog] = useState(false);
  const [attachInjury, setAttachInjury] = useState<any>(null);
  const [attachLabel, setAttachLabel] = useState("");
  const [attachUploading, setAttachUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxLabel, setLightboxLabel] = useState<string>("");
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const openLightbox = (url: string, label: string) => {
    setLightboxUrl(url);
    setLightboxLabel(label);
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  };

  const { data: injuries, isLoading, refetch } = trpc.injuries.getActiveWithPlayerInfo.useQuery();
  const { data: allTeams } = trpc.teams.getAll.useQuery();

  const { data: attachments, refetch: refetchAttachments } = trpc.injuries.getAttachments.useQuery(
    { injuryId: attachInjury?.id ?? 0 },
    { enabled: !!attachInjury }
  );

  const addAttachmentMutation = trpc.injuries.addAttachment.useMutation({
    onSuccess: () => {
      toast({ title: "Attachment uploaded!", description: "File saved to injury record." });
      setAttachLabel("");
      refetchAttachments();
      setAttachUploading(false);
    },
    onError: (err) => {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setAttachUploading(false);
    },
  });

  const deleteAttachmentMutation = trpc.injuries.deleteAttachment.useMutation({
    onSuccess: () => { refetchAttachments(); },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !attachInjury) return;
    setAttachUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      addAttachmentMutation.mutate({
        injuryId: attachInjury.id,
        playerId: attachInjury.playerId,
        fileData: base64,
        fileName: file.name,
        contentType: file.type,
        label: attachLabel || undefined,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const updateInjuryMutation = trpc.injuries.update.useMutation({
    onSuccess: () => {
      toast({ title: "Injury updated!", description: "Player status has been updated." });
      setShowClearDialog(false);
      refetch();
    },
    onError: (err) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) { navigate("/"); return null; }

  const allInjuries = injuries || [];

  // Filter
  const filtered = allInjuries.filter((inj: any) => {
    if (filterTeam !== "all" && String(inj.teamId) !== filterTeam) return false;
    if (filterSeverity !== "all" && inj.severity !== filterSeverity) return false;
    if (filterBodyPart && (inj.bodyPart || "").toLowerCase() !== filterBodyPart) return false;
    return true;
  });

  // Summary stats
  const totalInjured = allInjuries.length;
  const severeCount = allInjuries.filter((i: any) => i.severity === 'severe').length;
  const activeCount = allInjuries.filter((i: any) => i.status === 'active').length;
  const recoveringCount = allInjuries.filter((i: any) => i.status === 'recovering').length;
  const clearedToday = allInjuries.filter((i: any) => {
    if (!i.expectedRecoveryDate) return false;
    const today = new Date().toDateString();
    return new Date(i.expectedRecoveryDate).toDateString() === today;
  }).length;
  const avgDaysInjured = allInjuries.length > 0
    ? Math.round(allInjuries.reduce((s: number, i: any) => s + (i.daysInjured || 0), 0) / allInjuries.length)
    : 0;

  // Body part breakdown
  const bodyPartMap: Record<string, number> = {};
  allInjuries.forEach((i: any) => {
    const bp = (i.bodyPart || "other").toLowerCase();
    bodyPartMap[bp] = (bodyPartMap[bp] || 0) + 1;
  });
  const bodyParts = Object.entries(bodyPartMap).sort((a, b) => b[1] - a[1]);

  // Team breakdown
  const teamMap: Record<string, { name: string; count: number }> = {};
  allInjuries.forEach((i: any) => {
    const key = i.teamName || "Unknown";
    if (!teamMap[key]) teamMap[key] = { name: key, count: 0 };
    teamMap[key].count++;
  });
  const teamBreakdown = Object.values(teamMap).sort((a, b) => b.count - a.count);

  function printMedicalReport() {
    const reportDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const printContent = `
      <html>
      <head>
        <title>Medical Report - Team Doctor Dashboard</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
          h1 { color: #1a1a2e; font-size: 22px; border-bottom: 2px solid #e53935; padding-bottom: 8px; }
          h2 { color: #333; font-size: 16px; margin-top: 20px; }
          .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
          .summary { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
          .stat { border: 1px solid #ddd; border-radius: 6px; padding: 10px 16px; text-align: center; min-width: 80px; }
          .stat .num { font-size: 22px; font-weight: bold; color: #e53935; }
          .stat .label { font-size: 11px; color: #666; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 8px; }
          th { background: #f0f0f0; padding: 7px 10px; text-align: left; border: 1px solid #ddd; font-weight: 600; }
          td { padding: 6px 10px; border: 1px solid #eee; vertical-align: top; }
          tr:nth-child(even) { background: #fafafa; }
          .badge-severe { background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
          .badge-moderate { background: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
          .badge-minor { background: #fef9c3; color: #854d0e; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
          .badge-active { background: #fee2e2; color: #b91c1c; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
          .badge-recovering { background: #ffedd5; color: #c2410c; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
          .badge-recovered { background: #dcfce7; color: #15803d; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
          @media print { body { margin: 10px; } }
        </style>
      </head>
      <body>
        <h1>&#x1F3E5; Team Doctor Medical Report</h1>
        <p class="meta">Generated: ${reportDate} &nbsp;|&nbsp; Prepared by: ${user?.name || 'Team Doctor'}</p>
        <h2>Summary</h2>
        <div class="summary">
          <div class="stat"><div class="num">${totalInjured}</div><div class="label">Total Injured</div></div>
          <div class="stat"><div class="num">${activeCount}</div><div class="label">Active</div></div>
          <div class="stat"><div class="num">${recoveringCount}</div><div class="label">Recovering</div></div>
          <div class="stat"><div class="num">${severeCount}</div><div class="label">Severe</div></div>
          <div class="stat"><div class="num">${clearedToday}</div><div class="label">Due Today</div></div>
          <div class="stat"><div class="num">${avgDaysInjured}</div><div class="label">Avg Days Out</div></div>
        </div>
        <h2>Active Injury List (${filtered.length} records)</h2>
        <table>
          <thead>
            <tr>
              <th>#</th><th>Player</th><th>Team</th><th>Injury</th><th>Body Part</th>
              <th>Severity</th><th>Status</th><th>Days Out</th><th>Expected Recovery</th><th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map((inj: any, idx: number) => `
              <tr>
                <td>${idx + 1}</td>
                <td>${inj.playerName || '-'}</td>
                <td>${inj.teamName || '-'}</td>
                <td>${inj.injuryType || '-'}</td>
                <td>${inj.bodyPart || '-'}</td>
                <td><span class="badge-${inj.severity}">${(inj.severity || '').toUpperCase()}</span></td>
                <td><span class="badge-${inj.status}">${(inj.status || '').toUpperCase()}</span></td>
                <td>${inj.daysInjured || '-'}</td>
                <td>${inj.expectedRecoveryDate ? new Date(inj.expectedRecoveryDate).toLocaleDateString() : '-'}</td>
                <td>${inj.notes || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <h2>Injury by Body Part</h2>
        <table>
          <thead><tr><th>Body Part</th><th>Count</th></tr></thead>
          <tbody>${bodyParts.map(([bp, cnt]) => `<tr><td>${bp}</td><td>${cnt}</td></tr>`).join('')}</tbody>
        </table>
        <h2>Injury by Team</h2>
        <table>
          <thead><tr><th>Team</th><th>Count</th></tr></thead>
          <tbody>${teamBreakdown.map(t => `<tr><td>${t.name}</td><td>${t.count}</td></tr>`).join('')}</tbody>
        </table>
        <p style="margin-top:30px;font-size:11px;color:#999;">This report is confidential and intended for medical staff only.</p>
      </body>
      </html>
    `;
    const win = window.open('', '_blank', 'width=900,height=700');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  }

  function openClearDialog(inj: any) {
    setSelectedInjury(inj);
    setClearNotes("");
    setNewRecoveryDate(inj.expectedRecoveryDate ? new Date(inj.expectedRecoveryDate).toISOString().split("T")[0] : "");
    setShowClearDialog(true);
  }

  function handleMarkRecovered() {
    if (!selectedInjury) return;
    updateInjuryMutation.mutate({
      id: selectedInjury.id,
      status: "recovered",
      actualRecoveryDate: new Date().toISOString().split("T")[0],
      returnToPlayCleared: true,
      notes: clearNotes || undefined,
    });
  }

  function handleUpdateRecoveryDate() {
    if (!selectedInjury || !newRecoveryDate) return;
    updateInjuryMutation.mutate({
      id: selectedInjury.id,
      notes: clearNotes || undefined,
    });
  }

  function handleMarkRecovering() {
    if (!selectedInjury) return;
    updateInjuryMutation.mutate({
      id: selectedInjury.id,
      status: "recovering",
      notes: clearNotes || undefined,
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
              <Stethoscope className="h-8 w-8 text-primary" />
              Team Doctor Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Medical status across all teams — active injuries and clearance tracking</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={printMedicalReport} className="gap-2">
              <Printer className="h-4 w-4" /> Print Report
            </Button>
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-4 pb-4 text-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-500">{totalInjured}</p>
              <p className="text-xs text-muted-foreground">Total Injured</p>
            </CardContent>
          </Card>
          <Card className="border-red-500/30 bg-red-500/5">
            <CardContent className="pt-4 pb-4 text-center">
              <Activity className="h-6 w-6 text-red-600 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-600">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </CardContent>
          </Card>
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="pt-4 pb-4 text-center">
              <HeartPulse className="h-6 w-6 text-orange-700 dark:text-orange-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-orange-700 dark:text-orange-500">{recoveringCount}</p>
              <p className="text-xs text-muted-foreground">Recovering</p>
            </CardContent>
          </Card>
          <Card className="border-red-700/30 bg-red-700/5">
            <CardContent className="pt-4 pb-4 text-center">
              <Zap className="h-6 w-6 text-red-700 mx-auto mb-1" />
              <p className="text-2xl font-bold text-red-700">{severeCount}</p>
              <p className="text-xs text-muted-foreground">Severe Cases</p>
            </CardContent>
          </Card>
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="pt-4 pb-4 text-center">
              <CheckCircle2 className="h-6 w-6 text-green-700 dark:text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-700 dark:text-green-500">{clearedToday}</p>
              <p className="text-xs text-muted-foreground">Due Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4 text-center">
              <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
              <p className="text-2xl font-bold">{avgDaysInjured}</p>
              <p className="text-xs text-muted-foreground">Avg Days Out</p>
            </CardContent>
          </Card>
        </div>

        {/* Injury Trend Chart */}
        <InjuryTrendChart />

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
          </div>
          <Select value={filterTeam} onValueChange={setFilterTeam}>
            <SelectTrigger className="w-48 h-8 text-xs">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {(allTeams || []).filter((t: any) => t.id != null).map((t: any) => (
                <SelectItem key={`team-${t.id}`} value={String(t.id)}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSeverity} onValueChange={setFilterSeverity}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue placeholder="All Severity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              <SelectItem value="minor">Minor</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="severe">Severe</SelectItem>
            </SelectContent>
          </Select>
          {(filterTeam !== "all" || filterSeverity !== "all") && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFilterTeam("all"); setFilterSeverity("all"); }}>
              Clear Filters
            </Button>
          )}
        </div>

        {/* Active Injuries Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bandage className="h-5 w-5 text-primary" />
              Active Injuries
              <Badge variant="secondary" className="ml-2">{filtered.length}</Badge>
            </CardTitle>
            <CardDescription>All players currently injured or in recovery across all teams</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-700 dark:text-green-500 opacity-50" />
                <p className="text-lg font-medium text-green-600">All clear!</p>
                <p className="text-sm mt-1">No active injuries found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 font-semibold">Player</th>
                      <th className="pb-3 font-semibold">Team</th>
                      <th className="pb-3 font-semibold">Injury</th>
                      <th className="pb-3 font-semibold">Body Part</th>
                      <th className="pb-3 font-semibold text-center">Severity</th>
                      <th className="pb-3 font-semibold text-center">Status</th>
                      <th className="pb-3 font-semibold text-center">Days Out</th>
                      <th className="pb-3 font-semibold text-center">Expected Return</th>
                      <th className="pb-3 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inj: any) => (
                      <tr key={`inj-${inj.id}`} className={`border-b border-border/50 hover:bg-muted/30 transition-colors ${inj.severity === 'severe' ? 'bg-red-500/3' : ''}`}>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {inj.playerName?.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-medium">{inj.playerName}</p>
                              <p className="text-xs text-muted-foreground">{inj.playerPosition}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="text-xs bg-muted px-2 py-1 rounded-full">{inj.teamName}</span>
                        </td>
                        <td className="py-3">
                          <p className="font-medium">{inj.injuryType}</p>
                          {inj.treatment && <p className="text-xs text-muted-foreground truncate max-w-[120px]">{inj.treatment}</p>}
                        </td>
                        <td className="py-3">
                          <span>{BODY_PART_ICONS[inj.bodyPart?.toLowerCase()] || "🩺"} {inj.bodyPart}</span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${SEVERITY_COLORS[inj.severity] || "bg-muted"}`}>
                            {inj.severity}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`text-xs px-2 py-1 rounded-full border font-medium ${STATUS_COLORS[inj.status] || "bg-muted"}`}>
                            {inj.status}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`font-bold ${(inj.daysInjured || 0) > 30 ? "text-red-500" : (inj.daysInjured || 0) > 14 ? "text-orange-700 dark:text-orange-500" : "text-yellow-700 dark:text-yellow-500"}`}>
                            {inj.daysInjured || 0}d
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          {inj.expectedRecoveryDate ? (
                            <div>
                              <p className="font-medium text-xs">{new Date(inj.expectedRecoveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                              {inj.daysRemaining !== null && (
                                <p className={`text-xs ${inj.daysRemaining === 0 ? "text-green-700 dark:text-green-500 font-bold" : inj.daysRemaining <= 3 ? "text-orange-700 dark:text-orange-500" : "text-muted-foreground"}`}>
                                  {inj.daysRemaining === 0 ? "Today!" : `${inj.daysRemaining}d left`}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">TBD</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="outline" onClick={() => openClearDialog(inj)} className="h-7 text-xs gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Update
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => { setAttachInjury(inj); setShowAttachDialog(true); }} className="h-7 text-xs gap-1">
                              <Paperclip className="h-3 w-3" />
                              Files
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom row: Body Part Chart + Team Breakdown */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Body Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-primary" />
                Injury Body Map
              </CardTitle>
              <CardDescription>Click a dot to filter the injury list by body part • Hover for details</CardDescription>
            </CardHeader>
            <CardContent>
              {filterBodyPart && (
                <div className="mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-sm">
                  <span className="font-medium capitalize">Filtering by: {filterBodyPart}</span>
                  <button onClick={() => setFilterBodyPart(null)} className="ml-auto text-xs text-muted-foreground hover:text-foreground underline">Clear filter</button>
                </div>
              )}
              <BodyMap bodyPartMap={bodyPartMap} maxCount={bodyParts[0]?.[1] || 1} selectedBodyPart={filterBodyPart} onSelectBodyPart={setFilterBodyPart} />
              {bodyParts.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {bodyParts.map(([part, count]) => (
                    <span key={part} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-muted border border-border">
                      {BODY_PART_ICONS[part] || '🩺'} <span className="capitalize">{part}</span>
                      <span className="font-bold text-primary ml-0.5">{count}</span>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Injury by Team */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                Injuries by Team
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamBreakdown.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">No data</p>
              ) : (
                <div className="space-y-3">
                  {teamBreakdown.map((t) => (
                    <div key={t.name} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium text-sm">{t.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {Array.from({ length: Math.min(t.count, 8) }).map((_, i) => (
                            <div key={i} className="w-2 h-6 rounded-sm bg-primary/60" />
                          ))}
                        </div>
                        <span className="font-bold text-primary">{t.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Update Injury Dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Update Injury Status
            </DialogTitle>
          </DialogHeader>
          {selectedInjury && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <p className="font-semibold">{selectedInjury.playerName}</p>
                <p className="text-sm text-muted-foreground">{selectedInjury.injuryType} — {selectedInjury.bodyPart}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Injured: {new Date(selectedInjury.injuryDate).toLocaleDateString('en-GB')} · {selectedInjury.daysInjured} days ago
                </p>
              </div>

              <div>
                <Label className="text-xs mb-1 block">New Expected Recovery Date</Label>
                <Input
                  type="date"
                  value={newRecoveryDate}
                  onChange={(e) => setNewRecoveryDate(e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs mb-1 block">Notes (optional)</Label>
                <Textarea
                  placeholder="Add medical notes or update..."
                  value={clearNotes}
                  onChange={(e) => setClearNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkRecovering}
                  disabled={updateInjuryMutation.isPending}
                  className="text-orange-700 dark:text-orange-500 border-orange-500/30 hover:bg-orange-500/10"
                >
                  {updateInjuryMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Recovering"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUpdateRecoveryDate}
                  disabled={updateInjuryMutation.isPending || !newRecoveryDate}
                >
                  {updateInjuryMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Update Date"}
                </Button>
                <Button
                  size="sm"
                  onClick={handleMarkRecovered}
                  disabled={updateInjuryMutation.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updateInjuryMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "✓ Cleared"}
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowClearDialog(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Medical Attachments Dialog */}
      <Dialog open={showAttachDialog} onOpenChange={(open) => { setShowAttachDialog(open); if (!open) setAttachInjury(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Paperclip className="h-5 w-5 text-primary" />
              Medical Attachments
            </DialogTitle>
          </DialogHeader>
          {attachInjury && (
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-muted/30 border text-sm">
                <p className="font-semibold">{attachInjury.playerName}</p>
                <p className="text-muted-foreground">{attachInjury.injuryType} — {attachInjury.bodyPart}</p>
              </div>

              {/* Upload new file */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Upload File (X-Ray, MRI, Lab Results, etc.)</Label>
                <Input
                  placeholder="Label (e.g. MRI Scan, X-Ray, Lab Results)"
                  value={attachLabel}
                  onChange={(e) => setAttachLabel(e.target.value)}
                  className="text-sm"
                />
                <label className={`flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                  attachUploading ? 'border-muted opacity-50 cursor-not-allowed' : 'border-primary/40 hover:border-primary hover:bg-primary/5'
                }`}>
                  {attachUploading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /><span className="text-sm">Uploading...</span></>
                  ) : (
                    <><Upload className="h-4 w-4 text-primary" /><span className="text-sm text-primary">Click to choose file</span></>
                  )}
                  <input type="file" className="hidden" disabled={attachUploading} onChange={handleFileUpload}
                    accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx" />
                </label>
                <p className="text-xs text-muted-foreground">Supported: Images, PDF, Word, Excel</p>
              </div>

              {/* Existing attachments */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Saved Files ({(attachments || []).length})</Label>
                {(attachments || []).length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    <Paperclip className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No attachments yet
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(attachments || []).map((att: any) => (
                      <div key={att.id} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/20">
                        {att.contentType?.startsWith('image/') ? (
                          <button
                            onClick={() => { setLightboxUrl(att.fileUrl); setLightboxLabel(att.label || att.fileName); }}
                            className="flex-shrink-0 w-10 h-10 rounded overflow-hidden border border-border hover:opacity-80 transition-opacity"
                          >
                            <img src={att.fileUrl} alt={att.label || att.fileName} className="w-full h-full object-cover" />
                          </button>
                        ) : (
                          <FileText className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{att.label || att.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {att.uploadedByName} · {att.createdAt ? new Date(att.createdAt).toLocaleDateString('en-GB') : ''}
                          </p>
                          {att.contentType?.startsWith('image/') && (
                            <button
                              onClick={() => { setLightboxUrl(att.fileUrl); setLightboxLabel(att.label || att.fileName); }}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-0.5"
                            >
                              View full size
                            </button>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <a href={att.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </a>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                            onClick={() => deleteAttachmentMutation.mutate({ attachmentId: att.id })}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setShowAttachDialog(false); setAttachInjury(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
          onClick={() => setLightboxUrl(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-foreground text-sm font-medium truncate max-w-xs">{lightboxLabel}</p>
              <div className="flex items-center gap-2">
                {/* Zoom controls */}
                <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1">
                  <button
                    onClick={() => setLightboxZoom(z => Math.max(0.5, z - 0.25))}
                    className="text-foreground/80 hover:text-foreground p-0.5 rounded hover:bg-white/20 transition-colors"
                    title="Zoom out"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-foreground text-xs w-10 text-center">{Math.round(lightboxZoom * 100)}%</span>
                  <button
                    onClick={() => setLightboxZoom(z => Math.min(4, z + 0.25))}
                    className="text-foreground/80 hover:text-foreground p-0.5 rounded hover:bg-white/20 transition-colors"
                    title="Zoom in"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => { setLightboxZoom(1); setLightboxPan({ x: 0, y: 0 }); }}
                    className="text-foreground/80 hover:text-foreground p-0.5 rounded hover:bg-white/20 transition-colors ml-1"
                    title="Reset zoom"
                  >
                    <RotateCcw className="h-3 w-3" />
                  </button>
                </div>
                <a
                  href={lightboxUrl!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded bg-white/20 text-foreground hover:bg-white/30 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" /> Open Original
                </a>
                <button
                  onClick={() => setLightboxUrl(null)}
                  className="text-foreground/80 hover:text-foreground p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            {/* Image with zoom/pan */}
            <div
              className="overflow-hidden rounded-lg bg-black/50 flex items-center justify-center"
              style={{ height: '75vh', cursor: lightboxZoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
              onWheel={(e) => {
                e.preventDefault();
                const delta = e.deltaY > 0 ? -0.15 : 0.15;
                setLightboxZoom(z => Math.min(4, Math.max(0.5, z + delta)));
              }}
              onMouseDown={(e) => {
                if (lightboxZoom > 1) {
                  setIsDragging(true);
                  setDragStart({ x: e.clientX - lightboxPan.x, y: e.clientY - lightboxPan.y });
                }
              }}
              onMouseMove={(e) => {
                if (isDragging) {
                  setLightboxPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
                }
              }}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              <img
                src={lightboxUrl!}
                alt={lightboxLabel}
                draggable={false}
                style={{
                  transform: `scale(${lightboxZoom}) translate(${lightboxPan.x / lightboxZoom}px, ${lightboxPan.y / lightboxZoom}px)`,
                  transformOrigin: 'center center',
                  transition: isDragging ? 'none' : 'transform 0.15s ease',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  userSelect: 'none',
                }}
              />
            </div>
            <p className="text-foreground/40 text-xs text-center mt-1.5">
              Scroll to zoom · Drag to pan · Click outside to close
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Injury Trend Chart Component ────────────────────────────────────────────
function InjuryTrendChart() {
  const { data: trendData, isLoading } = trpc.injuries.getWeeklyTrend.useQuery();

  if (isLoading) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading trend data...
      </div>
    );
  }

  const hasData = trendData && trendData.some((w: any) => w.active + w.recovering + w.severe > 0);

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold text-base">Injury Trend — Last 13 Weeks</h3>
          <p className="text-xs text-muted-foreground">Active and recovering injuries per week to spot seasonal spikes</p>
        </div>
      </div>

      {!hasData ? (
        <div className="h-48 flex flex-col items-center justify-center text-muted-foreground gap-2">
          <Activity className="h-8 w-8 opacity-30" />
          <p className="text-sm">No injury data in the last 3 months</p>
          <p className="text-xs opacity-60">Injuries logged in the system will appear here week by week</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <defs>
              <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorRecovering" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSevere" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis
              dataKey="weekLabel"
              tick={{ fontSize: 10, fill: '#888' }}
              tickLine={false}
              axisLine={false}
              interval={1}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#888' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              width={28}
            />
            <RechartsTooltip
              contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }}
              labelStyle={{ fontWeight: 600, marginBottom: 4 }}
              formatter={(value: any, name: string) => [value, name === 'active' ? 'Active' : name === 'recovering' ? 'Recovering' : 'Severe']}
            />
            <Legend
              formatter={(value) => value === 'active' ? 'Active' : value === 'recovering' ? 'Recovering' : 'Severe'}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11 }}
            />
            <Area type="monotone" dataKey="active" stroke="#ef4444" strokeWidth={2} fill="url(#colorActive)" dot={{ r: 3, fill: '#ef4444' }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="recovering" stroke="#f97316" strokeWidth={2} fill="url(#colorRecovering)" dot={{ r: 3, fill: '#f97316' }} activeDot={{ r: 5 }} />
            <Area type="monotone" dataKey="severe" stroke="#7c3aed" strokeWidth={2} fill="url(#colorSevere)" dot={{ r: 3, fill: '#7c3aed' }} activeDot={{ r: 5 }} strokeDasharray="4 2" />
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Legend note */}
      <p className="text-xs text-muted-foreground mt-2 text-right">
        Each point = week starting that date · Severe shown as dashed purple line
      </p>
    </div>
  );
}

// ── Body Map Component ─────────────────────────────────────────────────────
// Maps body part names to (cx, cy) positions on a 160×320 SVG silhouette
const BODY_ZONES: Record<string, { cx: number; cy: number; label: string }> = {
  head:      { cx: 80, cy: 22,  label: "Head" },
  shoulder:  { cx: 80, cy: 62,  label: "Shoulder" },
  back:      { cx: 80, cy: 90,  label: "Back" },
  chest:     { cx: 80, cy: 75,  label: "Chest" },
  hip:       { cx: 80, cy: 120, label: "Hip" },
  groin:     { cx: 80, cy: 135, label: "Groin" },
  thigh:     { cx: 80, cy: 160, label: "Thigh" },
  hamstring: { cx: 80, cy: 175, label: "Hamstring" },
  knee:      { cx: 80, cy: 200, label: "Knee" },
  calf:      { cx: 80, cy: 230, label: "Calf" },
  ankle:     { cx: 80, cy: 258, label: "Ankle" },
  foot:      { cx: 80, cy: 278, label: "Foot" },
  wrist:     { cx: 38, cy: 130, label: "Wrist" },
};

function BodyMap({ bodyPartMap, maxCount, selectedBodyPart, onSelectBodyPart }: { bodyPartMap: Record<string, number>; maxCount: number; selectedBodyPart: string | null; onSelectBodyPart: (part: string | null) => void }) {
  const [hovered, setHovered] = useState<string | null>(null);

  function dotColor(count: number, max: number) {
    const ratio = count / Math.max(max, 1);
    if (ratio >= 0.7) return "#ef4444"; // red — high
    if (ratio >= 0.4) return "#f97316"; // orange — moderate
    return "#eab308"; // yellow — low
  }

  return (
    <div className="flex items-center justify-center gap-6">
      {/* SVG Silhouette */}
      <svg viewBox="0 0 160 320" width={130} height={260} className="shrink-0">
        {/* Simple human silhouette outline */}
        {/* Head */}
        <ellipse cx="80" cy="22" rx="16" ry="18" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Neck */}
        <rect x="74" y="38" width="12" height="10" rx="3" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Torso */}
        <rect x="54" y="48" width="52" height="80" rx="8" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Left arm */}
        <path d="M54 52 Q32 80 30 130" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Right arm */}
        <path d="M106 52 Q128 80 130 130" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Left hand */}
        <ellipse cx="30" cy="136" rx="6" ry="8" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Right hand */}
        <ellipse cx="130" cy="136" rx="6" ry="8" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Hips */}
        <rect x="52" y="128" width="56" height="28" rx="6" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Left leg */}
        <path d="M64 156 Q60 210 62 280" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Right leg */}
        <path d="M96 156 Q100 210 98 280" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Left foot */}
        <ellipse cx="60" cy="286" rx="10" ry="6" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />
        {/* Right foot */}
        <ellipse cx="100" cy="286" rx="10" ry="6" fill="none" stroke="hsl(var(--border))" strokeWidth="1.5" />

        {/* Injury dots */}
        {Object.entries(BODY_ZONES).map(([part, { cx, cy, label }]) => {
          const count = bodyPartMap[part] || 0;
          if (count === 0) return null;
          const r = Math.max(6, Math.min(14, 6 + (count / maxCount) * 8));
          const col = dotColor(count, maxCount);
          const isHovered = hovered === part;
          return (
            <g key={part}
              onMouseEnter={() => setHovered(part)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectBodyPart(selectedBodyPart === part ? null : part)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={cx} cy={cy} r={r + (isHovered ? 3 : 0)} fill={col} opacity={selectedBodyPart && selectedBodyPart !== part ? 0.35 : 0.9} />
              <circle cx={cx} cy={cy} r={r + (isHovered ? 3 : 0)} fill="none" stroke={selectedBodyPart === part ? 'white' : 'white'} strokeWidth={selectedBodyPart === part ? 2.5 : 1} opacity={0.7} />
              <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
                fontSize="8" fontWeight="bold" fill="white">{count}</text>
              {isHovered && (
                <g>
                  <rect x={cx - 28} y={cy - 28} width={56} height={18} rx={4} fill="hsl(var(--card))" stroke={col} strokeWidth="1" />
                  <text x={cx} y={cy - 16} textAnchor="middle" dominantBaseline="middle"
                    fontSize="8" fill="hsl(var(--foreground))" fontWeight="600">{label}: {count}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div className="space-y-2 text-xs">
        <p className="font-semibold text-sm mb-3">Injury Zones</p>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> High frequency</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 inline-block" /> Moderate</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500 inline-block" /> Low</div>
        <p className="text-muted-foreground mt-3 text-xs leading-relaxed max-w-28">Dot size scales with injury count. Hover for details.</p>
      </div>
    </div>
  );
}
