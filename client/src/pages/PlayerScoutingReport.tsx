import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target, TrendingUp, AlertTriangle, Star, Brain, Zap, Shield,
  ArrowLeft, Edit, Loader2, Sparkles, CheckCircle2, MapPin, Calendar,
  ChevronRight, User, BarChart3, Cpu, Trophy, Info, Send, CheckCircle,
  Download, PenLine, Save, X, SlidersHorizontal, ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";

const POSITIONS = [
  "GK", "RB", "CB", "LB", "RWB", "LWB",
  "CDM", "CM", "CAM", "RM", "LM",
  "RW", "LW", "CF", "ST", "SS"
];

const POTENTIAL_COLORS: Record<string, string> = {
  elite: "bg-yellow-500 text-yellow-950",
  high: "bg-green-500 text-white",
  medium: "bg-blue-500 text-white",
  low: "bg-gray-400 text-white",
};

const POTENTIAL_LABELS: Record<string, string> = {
  elite: "Elite Potential",
  high: "High Potential",
  medium: "Medium Potential",
  low: "Development Potential",
};

const CONFIDENCE_CONFIG: Record<string, { color: string; label: string }> = {
  high:   { color: "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400", label: "High Confidence" },
  medium: { color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400", label: "Medium Confidence" },
  low:    { color: "bg-gray-500/10 border-gray-500/30 text-gray-700 dark:text-gray-400", label: "Low Confidence" },
};

const POSITION_FULL_NAMES: Record<string, string> = {
  GK: "Goalkeeper", RB: "Right Back", CB: "Centre Back", LB: "Left Back",
  RWB: "Right Wing Back", LWB: "Left Wing Back", CDM: "Defensive Midfielder",
  CM: "Central Midfielder", CAM: "Attacking Midfielder", RM: "Right Midfielder",
  LM: "Left Midfielder", RW: "Right Winger", LW: "Left Winger",
  CF: "Centre Forward", ST: "Striker", SS: "Second Striker",
};

function RatingBar({ label, value, color = "bg-primary" }: { label: string; value: number; color?: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}/100</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function TagList({ items, color }: { items: string[]; color: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <Badge key={i} variant="outline" className={`text-sm py-1 px-3 ${color}`}>
          {item}
        </Badge>
      ))}
    </div>
  );
}

function PositionRecommendationCard({ rec, rank }: { rec: any; rank: number }) {
  const cfg = CONFIDENCE_CONFIG[rec.confidence] || CONFIDENCE_CONFIG.medium;
  const rankColors = ["text-yellow-500", "text-muted-foreground", "text-orange-700 dark:text-orange-400", "text-muted-foreground", "text-muted-foreground"];
  const rankIcons = ["🥇", "🥈", "🥉", "4th", "5th"];
  return (
    <Card className={`border ${rank === 0 ? "border-primary/50 bg-primary/5" : "border-border"}`}>
      <CardContent className="pt-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className={`text-2xl font-bold ${rankColors[rank]}`}>{rankIcons[rank]}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-primary">{rec.position}</span>
                <span className="text-sm text-muted-foreground">{POSITION_FULL_NAMES[rec.position] || rec.position}</span>
              </div>
              <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium mt-1 ${cfg.color}`}>
                {cfg.label}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{rec.suitabilityScore}</p>
            <p className="text-xs text-muted-foreground">/ 100</p>
          </div>
        </div>
        <Progress value={rec.suitabilityScore} className="h-2 mb-3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rec.strengths?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1.5 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Strengths for this position
              </p>
              <div className="space-y-1">
                {rec.strengths.map((s: string, i: number) => (
                  <div key={i} className="text-xs flex items-start gap-1.5 text-muted-foreground">
                    <span className="text-green-700 dark:text-green-500 mt-0.5">•</span> {s}
                  </div>
                ))}
              </div>
            </div>
          )}
          {rec.improvements?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-1.5 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Areas to develop
              </p>
              <div className="space-y-1">
                {rec.improvements.map((s: string, i: number) => (
                  <div key={i} className="text-xs flex items-start gap-1.5 text-muted-foreground">
                    <span className="text-orange-700 dark:text-orange-500 mt-0.5">•</span> {s}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function PlayerScoutingReport() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number>(0);
  const routePlayerId = parseInt(params.id || "0");
  const playerId = routePlayerId || selectedPlayerId;

  // Load all teams and players for the selector when no ID in URL
  const { data: allTeams = [] } = trpc.teams.getAll.useQuery(undefined, { enabled: !routePlayerId });
  const [selectorTeamId, setSelectorTeamId] = useState<number>(0);
  const [teamTypeFilter, setTeamTypeFilter] = useState<'all' | 'main' | 'academy'>('all');
  const mainTeams = (allTeams as any[]).filter((t: any) => t.teamType === 'main');
  const academyTeams = (allTeams as any[]).filter((t: any) => t.teamType === 'academy');
  const { data: selectorPlayers = [] } = trpc.players.getByTeam.useQuery(
    { teamId: selectorTeamId },
    { enabled: !routePlayerId && selectorTeamId > 0 }
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [isEditingAI, setIsEditingAI] = useState(false);
  const [editedAnalysis, setEditedAnalysis] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [showFocusPanel, setShowFocusPanel] = useState(false);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [customFocus, setCustomFocus] = useState("");

  const FOCUS_PRESETS = [
    { label: "Speed & Acceleration", value: "speed and acceleration" },
    { label: "Technical Skills", value: "technical skills (ball control, passing, dribbling)" },
    { label: "Defensive Positioning", value: "defensive positioning and marking" },
    { label: "Shooting & Finishing", value: "shooting technique and finishing" },
    { label: "Physical Conditioning", value: "physical conditioning and stamina" },
    { label: "Mental Resilience", value: "mental resilience and decision-making under pressure" },
    { label: "Tactical Awareness", value: "tactical awareness and positional play" },
    { label: "Aerial Ability", value: "aerial ability and heading" },
    { label: "Crossing & Delivery", value: "crossing and ball delivery" },
    { label: "Leadership", value: "leadership and communication on the pitch" },
  ];

  const toggleFocusPreset = (value: string) => {
    setFocusAreas(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handleGenerateAI = () => {
    const allFocus = [
      ...focusAreas,
      ...(customFocus.trim() ? [customFocus.trim()] : []),
    ];
    aiMutation.mutate({ playerId, focusAreas: allFocus.length > 0 ? allFocus : undefined });
    setShowFocusPanel(false);
  };

  const { data: profile, refetch } = trpc.scoutingProfiles.getByPlayer.useQuery(
    { playerId },
    { enabled: !!playerId }
  );

  const { data: player } = trpc.players.getById.useQuery(
    { id: playerId },
    { enabled: !!playerId, retry: false }
  );

  const { data: positionRecs, isLoading: recsLoading } = trpc.scoutingProfiles.getPositionRecommendations.useQuery(
    { playerId },
    { enabled: !!playerId }
  );

  const upsertMutation = trpc.scoutingProfiles.upsert.useMutation({
    onSuccess: () => {
      toast.success("Scouting report saved successfully");
      refetch();
      setIsEditOpen(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const aiMutation = trpc.scoutingProfiles.generateAIAnalysis.useMutation({
    onSuccess: () => {
      toast.success("AI analysis generated");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });
  const saveAIAnalysisMutation = trpc.scoutingProfiles.saveAIAnalysis.useMutation({
    onSuccess: () => { toast.success("AI analysis saved"); refetch(); setIsEditingAI(false); },
    onError: (e) => toast.error(e.message),
  });
  const requestPositionChangeMutation = trpc.scoutingProfiles.requestPositionChange.useMutation({
    onSuccess: (data) => {
      toast.success(`Position change request sent to ${data.notified} coach(es)/admin(s)`);
    },
    onError: (e) => toast.error(e.message),
  });
  // Skill history for trend charts
  const { data: skillHistory = [] } = trpc.skillScores.getHistory.useQuery(
    { playerId },
    { enabled: !!playerId }
  );

  const openEdit = () => {
    const topRec = positionRecs?.recommendations?.[0]?.position;
    if (profile) {
      setEditForm({
        strengthPoints: profile.strengthPoints?.join("\n") ?? "",
        weakPoints: profile.weakPoints?.join("\n") ?? "",
        developmentPoints: profile.developmentPoints?.join("\n") ?? "",
        recommendedPosition: profile.recommendedPosition ?? topRec ?? "",
        futurePosition: profile.futurePosition ?? "",
        futurePositionRationale: profile.futurePositionRationale ?? "",
        potentialRating: profile.potentialRating ?? "medium",
        overallRating: profile.overallRating ?? 50,
        technicalRating: profile.technicalRating ?? 50,
        physicalRating: profile.physicalRating ?? 50,
        mentalRating: profile.mentalRating ?? 50,
        tacticalRating: profile.tacticalRating ?? 50,
        coachNotes: profile.coachNotes ?? "",
        assessmentDate: profile.assessmentDate ?? new Date().toISOString().split("T")[0],
      });
    } else {
      setEditForm({
        strengthPoints: "", weakPoints: "", developmentPoints: "",
        recommendedPosition: topRec ?? player?.position ?? "",
        futurePosition: player?.position ?? "",
        futurePositionRationale: "",
        potentialRating: "medium",
        overallRating: 50, technicalRating: 50, physicalRating: 50,
        mentalRating: 50, tacticalRating: 50,
        coachNotes: "",
        assessmentDate: new Date().toISOString().split("T")[0],
      });
    }
    setIsEditOpen(true);
  };

  const handleSave = () => {
    if (!editForm) return;
    upsertMutation.mutate({
      playerId,
      assessmentDate: editForm.assessmentDate,
      strengthPoints: editForm.strengthPoints.split("\n").map((s: string) => s.trim()).filter(Boolean),
      weakPoints: editForm.weakPoints.split("\n").map((s: string) => s.trim()).filter(Boolean),
      developmentPoints: editForm.developmentPoints.split("\n").map((s: string) => s.trim()).filter(Boolean),
      recommendedPosition: editForm.recommendedPosition,
      futurePosition: editForm.futurePosition,
      futurePositionRationale: editForm.futurePositionRationale,
      potentialRating: editForm.potentialRating,
      overallRating: Number(editForm.overallRating),
      technicalRating: Number(editForm.technicalRating),
      physicalRating: Number(editForm.physicalRating),
      mentalRating: Number(editForm.mentalRating),
      tacticalRating: Number(editForm.tacticalRating),
      coachNotes: editForm.coachNotes,
    });
  };

  const topRec = positionRecs?.recommendations?.[0];

  const openEditAI = () => {
    if (!profile?.aiAnalysis) return;
    setEditedAnalysis(profile.aiAnalysis);
    setCustomNotes("");
    setIsEditingAI(true);
  };

  const handleSaveAI = () => {
    saveAIAnalysisMutation.mutate({ playerId, analysis: editedAnalysis, customNotes: customNotes.trim() || undefined });
  };

  const handleExportPDF = async () => {
    if (!profile || !player) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      const RED = [220, 38, 38] as [number, number, number];
      const DARK = [15, 15, 15] as [number, number, number];
      const GRAY = [100, 100, 100] as [number, number, number];
      const LIGHT_GRAY = [245, 245, 245] as [number, number, number];
      const WHITE = [255, 255, 255] as [number, number, number];

      const checkPage = (needed = 10) => {
        if (y + needed > pageHeight - 15) { doc.addPage(); y = margin; }
      };

      const addText = (text: string, fontSize = 10, bold = false, color: [number,number,number] = DARK, indent = 0) => {
        doc.setFontSize(fontSize);
        doc.setFont("helvetica", bold ? "bold" : "normal");
        doc.setTextColor(...color);
        const lines = doc.splitTextToSize(text, contentWidth - indent);
        checkPage(lines.length * (fontSize * 0.38) + 2);
        doc.text(lines, margin + indent, y);
        y += lines.length * (fontSize * 0.38) + 2;
      };

      const addSectionHeader = (title: string) => {
        checkPage(12);
        y += 3;
        doc.setFillColor(...RED);
        doc.roundedRect(margin, y, contentWidth, 8, 1, 1, "F");
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...WHITE);
        doc.text(title.toUpperCase(), margin + 3, y + 5.5);
        y += 12;
      };

      const addRatingBar = (label: string, value: number, maxVal = 100) => {
        checkPage(8);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK);
        doc.text(label, margin, y);
        doc.setFont("helvetica", "bold");
        doc.text(`${value}/${maxVal}`, margin + contentWidth - 15, y);
        y += 4;
        const barW = contentWidth - 20;
        doc.setFillColor(...LIGHT_GRAY);
        doc.roundedRect(margin, y, barW, 3, 1, 1, "F");
        const fillW = (value / maxVal) * barW;
        const fillColor: [number,number,number] = value >= 80 ? [34,197,94] : value >= 60 ? [59,130,246] : value >= 40 ? [234,179,8] : [239,68,68];
        doc.setFillColor(...fillColor);
        doc.roundedRect(margin, y, fillW, 3, 1, 1, "F");
        y += 7;
      };

      const addBullet = (text: string, color: [number,number,number] = DARK) => {
        checkPage(6);
        doc.setFillColor(...color);
        doc.circle(margin + 2, y - 1, 1, "F");
        addText(text, 9, false, DARK, 6);
      };

      // ── COVER PAGE ──────────────────────────────────────────────────────────
      // Red header band
      doc.setFillColor(...RED);
      doc.rect(0, 0, pageWidth, 42, "F");

      // Academy name
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...WHITE);
      doc.text("AL AHLY FOOTBALL ACADEMY", margin, 10);

      // Report type
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("SCOUTING REPORT", margin, 22);

      // Player name
      doc.setFontSize(13);
      doc.setFont("helvetica", "normal");
      doc.text(`${player.firstName} ${player.lastName}  ·  ${player.position}  ·  #${player.jerseyNumber ?? "—"}`, margin, 32);

      // Date stamp
      doc.setFontSize(8);
      doc.setTextColor(255,200,200);
      doc.text(`Generated: ${new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" })}`, margin, 39);

      // Potential badge
      const potLabel = POTENTIAL_LABELS[profile.potentialRating ?? "medium"] ?? "Medium Potential";
      const potBg: [number,number,number] = profile.potentialRating === "elite" ? [234,179,8] : profile.potentialRating === "high" ? [34,197,94] : [59,130,246];
      doc.setFillColor(...potBg);
      doc.roundedRect(pageWidth - margin - 38, 8, 38, 10, 2, 2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...WHITE);
      doc.text(potLabel.toUpperCase(), pageWidth - margin - 36, 14.5);

      y = 52;

      // ── PLAYER OVERVIEW ─────────────────────────────────────────────────────
      addSectionHeader("1. Player Overview");
      const overviewData = [
        ["Full Name", `${player.firstName} ${player.lastName}`],
        ["Date of Birth", player.dateOfBirth ?? "—"],
        ["Nationality", player.nationality ?? "—"],
        ["Position", `${player.position} — ${POSITION_FULL_NAMES[player.position] ?? player.position}`],
        ["Preferred Foot", (player as any).preferredFoot ?? "—"],
        ["Height / Weight", `${(player as any).height ?? "—"} cm  /  ${(player as any).weight ?? "—"} kg`],
        ["Team", (player as any).teamName ?? "—"],
        ["Age Group", (player as any).ageGroup ?? "—"],
        ["Academy Status", player.status ?? "—"],
      ];
      overviewData.forEach(([label, val]) => {
        checkPage(6);
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...GRAY);
        doc.text(label + ":", margin, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...DARK);
        doc.text(String(val), margin + 42, y);
        y += 5.5;
      });
      y += 2;

      // ── PERFORMANCE RATINGS ──────────────────────────────────────────────────
      addSectionHeader("2. Performance Ratings");
      [
        ["Overall Rating", profile.overallRating ?? 50],
        ["Technical", profile.technicalRating ?? 50],
        ["Physical", profile.physicalRating ?? 50],
        ["Mental", profile.mentalRating ?? 50],
        ["Tactical", profile.tacticalRating ?? 50],
      ].forEach(([label, val]) => addRatingBar(String(label), Number(val)));
      y += 2;

      // ── POSITION ASSESSMENT ──────────────────────────────────────────────────
      addSectionHeader("3. Position Assessment");
      const topRec = positionRecs?.recommendations?.[0];
      addText(`Current Position: ${player.position} — ${POSITION_FULL_NAMES[player.position] ?? player.position}`, 9, true);
      addText(`Recommended Position: ${profile.recommendedPosition ?? topRec?.position ?? "Not set"}`, 9);
      addText(`Future Position: ${profile.futurePosition ?? "Not set"}`, 9);
      if (profile.futurePositionRationale) addText(`Rationale: ${profile.futurePositionRationale}`, 9, false, GRAY);
      if (topRec) {
        y += 2;
        addText(`AI Suitability Score: ${topRec.suitabilityScore ?? "—"}/100`, 9, true);
        if (topRec.strengths?.length) addText(topRec.strengths.join(", "), 9, false, GRAY);
      }
      y += 2;

      // ── STRENGTHS ────────────────────────────────────────────────────────────
      if (profile.strengthPoints?.length) {
        addSectionHeader("4. Strengths");
        profile.strengthPoints.forEach((s: string) => addBullet(s, [34,197,94]));
        y += 2;
      }

      // ── AREAS FOR IMPROVEMENT ────────────────────────────────────────────────
      if (profile.weakPoints?.length) {
        addSectionHeader("5. Areas for Improvement");
        profile.weakPoints.forEach((s: string) => addBullet(s, [239,68,68]));
        y += 2;
      }

      // ── DEVELOPMENT PLAN ─────────────────────────────────────────────────────
      if (profile.developmentPoints?.length) {
        addSectionHeader("6. Development Plan");
        profile.developmentPoints.forEach((s: string, i: number) => {
          addText(`${i + 1}. ${s}`, 9);
        });
        y += 2;
      }

      // ── COACH NOTES ──────────────────────────────────────────────────────────
      if (profile.coachNotes) {
        addSectionHeader("7. Coach Notes");
        doc.setFillColor(...LIGHT_GRAY);
        const noteLines = doc.splitTextToSize(profile.coachNotes, contentWidth - 6);
        const noteH = noteLines.length * 4 + 6;
        checkPage(noteH + 4);
        doc.roundedRect(margin, y, contentWidth, noteH, 2, 2, "F");
        doc.setFontSize(9);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(...GRAY);
        doc.text(noteLines, margin + 3, y + 5);
        y += noteH + 4;
      }

      // ── AI SCOUT ANALYSIS ────────────────────────────────────────────────────
      if (profile.aiAnalysis) {
        addSectionHeader("8. AI Scout Analysis");
        // Split into sections by the ═══ dividers if present
        const analysisText = String(profile.aiAnalysis);
        const sections = analysisText.split(/\n(?=═+|#{1,3} |\*\*[A-Z])/);
        sections.forEach(section => {
          const trimmed = section.trim();
          if (!trimmed) return;
          // Check if it's a section header
          if (trimmed.startsWith("═") || trimmed.startsWith("#") || /^\*\*[A-Z]/.test(trimmed)) {
            const headerText = trimmed.replace(/^[═#\*\s]+/, '').replace(/[═#\*\s]+$/, '').trim();
            if (headerText.length > 0 && headerText.length < 80) {
              checkPage(8);
              y += 2;
              doc.setFontSize(9);
              doc.setFont("helvetica", "bold");
              doc.setTextColor(...RED);
              doc.text("▶ " + headerText, margin, y);
              y += 5;
            }
          } else {
            // Regular text - clean markdown
            const cleaned = trimmed
              .replace(/\*\*(.*?)\*\*/g, '$1')
              .replace(/\*(.*?)\*/g, '$1')
              .replace(/^[-•]\s*/gm, '• ')
              .replace(/═+/g, '');
            addText(cleaned, 8.5, false, DARK);
          }
        });
      }

      // ── FOOTER on all pages ──────────────────────────────────────────────────
      const totalPages = (doc.internal as any).getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...RED);
        doc.rect(0, pageHeight - 10, pageWidth, 10, "F");
        doc.setFontSize(7);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...WHITE);
        doc.text("Al Ahly Football Academy  ·  Confidential Scouting Report", margin, pageHeight - 4);
        doc.text(`Page ${i} / ${totalPages}`, pageWidth - margin - 15, pageHeight - 4);
      }

      doc.save(`scouting_report_${player.firstName}_${player.lastName}_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success("Branded PDF exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF");
    }
  };
  // Detect mismatch between player's current position and AI recommendation
  const currentPosition = player?.position ?? null;
  const aiRecommendedPos = topRec?.position ?? null;
  const positionMismatch = aiRecommendedPos && currentPosition && aiRecommendedPos !== currentPosition;
  return (
    <>
      <div className="container py-6 max-w-6xl">
        {/* Player Selector — shown when no player ID in URL */}
        {!routePlayerId && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Select a Player to View Scouting Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Step 1: Team Type */}
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground block mb-1">
                    {language === 'ar' ? '① نوع الفريق' : '① Team Type'}
                  </Label>
                  <div className="flex gap-2 flex-wrap">
                    {[{v:'all',en:'All',ar:'الكل'},{v:'main',en:'Main Team',ar:'الفريق الأول'},{v:'academy',en:'Academy',ar:'الأكاديمية'}].map(opt => (
                      <button key={opt.v} type="button"
                        onClick={() => { setTeamTypeFilter(opt.v as any); setSelectorTeamId(0); setSelectedPlayerId(0); }}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                          teamTypeFilter === opt.v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                        }`}>
                        {language === 'ar' ? opt.ar : opt.en}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 items-end">
                  {/* Step 2: Sub-team */}
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      {language === 'ar' ? '② الفريق' : '② Team'}
                    </Label>
                    <Select value={selectorTeamId ? String(selectorTeamId) : ""} onValueChange={v => { setSelectorTeamId(Number(v)); setSelectedPlayerId(0); }}>
                      <SelectTrigger className="w-52">
                        <SelectValue placeholder="Select team..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(teamTypeFilter === 'all' || teamTypeFilter === 'main') && mainTeams.map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                        ))}
                        {(teamTypeFilter === 'all' || teamTypeFilter === 'academy') && academyTeams.map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* Step 3: Player */}
                  {selectorTeamId > 0 && (
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        {language === 'ar' ? '③ اللاعب' : '③ Player'}
                      </Label>
                      <Select value={selectedPlayerId ? String(selectedPlayerId) : ""} onValueChange={v => setSelectedPlayerId(Number(v))}>
                        <SelectTrigger className="w-64">
                          <SelectValue placeholder="Select player..." />
                        </SelectTrigger>
                        <SelectContent>
                          {(selectorPlayers as any[]).map((p: any) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {p.firstName} {p.lastName} — {p.position} #{p.jerseyNumber}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <PageBreadcrumb
                items={[
                  { label: "Players", labelAr: "اللاعبين", href: "/players" },
                  { label: player ? `${player.firstName} ${player.lastName}` : "Player", href: playerId ? "/player/" + playerId : "/players" },
                  { label: "Scouting Report", labelAr: "تقرير الاستكشاف" },
                ]}
                className="mb-1"
              />
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Scouting Report
              </h1>
              {player && (
                <p className="text-muted-foreground text-sm">
                  {player.firstName} {player.lastName} · {player.position} · #{player.jerseyNumber}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {profile && (
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" /> Export PDF
              </Button>
            )}
            <div className="relative">
              <div className="flex">
                <Button
                  variant="outline"
                  onClick={handleGenerateAI}
                  disabled={aiMutation.isPending || !profile}
                  className="rounded-r-none border-r-0"
                >
                  {aiMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Generate AI Analysis
                  {focusAreas.length > 0 || customFocus.trim() ? (
                    <span className="ml-2 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                      {focusAreas.length + (customFocus.trim() ? 1 : 0)}
                    </span>
                  ) : null}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFocusPanel(v => !v)}
                  disabled={aiMutation.isPending || !profile}
                  className="rounded-l-none px-2"
                  title="Set focus areas"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </div>
              {showFocusPanel && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-background border rounded-lg shadow-xl p-4 w-80">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold">Focus Areas for AI Analysis</p>
                    <button onClick={() => setShowFocusPanel(false)} className="text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Select areas you want the AI to focus on. Leave empty for a general analysis.</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {FOCUS_PRESETS.map(p => (
                      <button
                        key={p.value}
                        onClick={() => toggleFocusPreset(p.value)}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          focusAreas.includes(p.value)
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-foreground border-border hover:border-primary/50"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="mb-3">
                    <Input
                      placeholder="Custom focus area (e.g. left foot technique)"
                      value={customFocus}
                      onChange={e => setCustomFocus(e.target.value)}
                      className="text-sm h-8"
                    />
                  </div>
                  {(focusAreas.length > 0 || customFocus.trim()) && (
                    <div className="mb-3 p-2 bg-primary/5 rounded text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Focus: </span>
                      {[...focusAreas, ...(customFocus.trim() ? [customFocus.trim()] : [])].join(" · ")}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleGenerateAI} disabled={!profile} className="flex-1">
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" /> Generate
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => { setFocusAreas([]); setCustomFocus(""); }}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <Button onClick={openEdit}>
              <Edit className="h-4 w-4 mr-2" />
              {profile ? "Edit Report" : "Create Report"}
            </Button>
          </div>
        </div>

        {/* AI Position Recommendations — always shown if skill data exists */}
        <div className="mb-6">
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Cpu className="h-5 w-5" />
                AI Position Recommendations
                <Badge variant="outline" className="text-xs ml-2">Based on Skill Assessment</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="h-4 w-4 animate-spin" /> Analysing player skills…
                </div>
              ) : !positionRecs ? (
                <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
                  <Info className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">No skill assessment data available</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Complete a skill assessment for this player first (via Skill Assessment page) to enable AI position recommendations.
                    </p>
                    <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => navigate("/skill-assessment")}>
                      Go to Skill Assessment
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Based on assessment from {positionRecs.assessmentDate ? new Date(positionRecs.assessmentDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : "Unknown date"}
                  </div>
                  <div className="space-y-3">
                    {positionRecs.recommendations.map((rec: any, i: number) => (
                      <PositionRecommendationCard key={rec.position} rec={rec} rank={i} />
                    ))}
                  </div>
                  {topRec && (
                    <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-primary shrink-0" />
                      <p className="text-sm">
                        <strong>AI Verdict:</strong> This player is best suited as a{" "}
                        <strong className="text-primary">{POSITION_FULL_NAMES[topRec.position] || topRec.position}</strong>{" "}
                        with a suitability score of <strong>{topRec.suitabilityScore}/100</strong>.
                        {topRec.confidence === 'high' && " High confidence based on strong skill alignment."}
                        {topRec.confidence === 'medium' && " Moderate confidence — further development will improve fit."}
                        {topRec.confidence === 'low' && " Low confidence — player may need to develop key attributes for this role."}
                      </p>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {!profile ? (
          <Card className="p-12 text-center">
            <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Scouting Report Yet</h2>
            <p className="text-muted-foreground mb-6">Create a comprehensive scouting report for this player to track their strengths, development areas, and career pathway.</p>
            <Button onClick={openEdit}>
              <Edit className="h-4 w-4 mr-2" /> Create Scouting Report
            </Button>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Overview Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Overall Rating</p>
                <p className="text-4xl font-bold text-primary">{profile.overallRating}</p>
                <p className="text-xs text-muted-foreground">/ 100</p>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Potential</p>
                <Badge className={`text-sm px-3 py-1 mt-1 ${POTENTIAL_COLORS[profile.potentialRating ?? 'medium']}`}>
                  {POTENTIAL_LABELS[profile.potentialRating ?? 'medium']}
                </Badge>
              </Card>
              <Card className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Current Position</p>
                <p className="text-3xl font-bold text-green-600">{currentPosition ?? profile.recommendedPosition ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{currentPosition ? POSITION_FULL_NAMES[currentPosition] || currentPosition : "Registered position"}</p>
              </Card>
              <Card className={`p-4 text-center ${positionMismatch ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/20' : ''}`}>
                <p className="text-sm text-muted-foreground mb-1">AI Recommended</p>
                <p className="text-3xl font-bold text-primary">{topRec?.position ?? "—"}</p>
                <p className="text-xs text-muted-foreground">{topRec ? `${topRec.suitabilityScore}/100 suitability` : "No data"}</p>
                {positionMismatch && <p className="text-xs text-orange-600 font-semibold mt-1">Differs from current</p>}
              </Card>
            </div>

            {/* Ratings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" /> Attribute Ratings
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <RatingBar label="Technical" value={profile.technicalRating ?? 50} color="bg-blue-500" />
                <RatingBar label="Physical" value={profile.physicalRating ?? 50} color="bg-green-500" />
                <RatingBar label="Mental" value={profile.mentalRating ?? 50} color="bg-purple-500" />
                <RatingBar label="Tactical" value={profile.tacticalRating ?? 50} color="bg-orange-500" />
              </CardContent>
            </Card>

            <Tabs defaultValue="strengths">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="strengths"><CheckCircle2 className="h-4 w-4 mr-1" />Strengths</TabsTrigger>
                <TabsTrigger value="weaknesses"><AlertTriangle className="h-4 w-4 mr-1" />Weaknesses</TabsTrigger>
                <TabsTrigger value="development"><TrendingUp className="h-4 w-4 mr-1" />Development</TabsTrigger>
                <TabsTrigger value="pathway"><MapPin className="h-4 w-4 mr-1" />Career Path</TabsTrigger>
              </TabsList>

              <TabsContent value="strengths" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-600 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" /> Strength Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(profile.strengthPoints ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No strength points recorded yet.</p>
                      ) : (profile.strengthPoints ?? []).map((s: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{s}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="weaknesses" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-red-600 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" /> Weak Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(profile.weakPoints ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No weak points recorded yet.</p>
                      ) : (profile.weakPoints ?? []).map((w: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{w}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="development" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-blue-600 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" /> Development Points
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {(profile.developmentPoints ?? []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No development points recorded yet.</p>
                      ) : (profile.developmentPoints ?? []).map((d: string, i: number) => (
                        <div key={i} className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <ChevronRight className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{d}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="pathway" className="mt-4">
                {positionMismatch && (
                  <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-300 dark:border-orange-700 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-700 dark:text-orange-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-orange-700 dark:text-orange-300">Position Mismatch Detected</p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        This player is currently registered as <strong>{currentPosition}</strong> ({POSITION_FULL_NAMES[currentPosition!] || currentPosition}),
                        but based on their latest skill assessment, the AI recommends <strong>{aiRecommendedPos}</strong> ({POSITION_FULL_NAMES[aiRecommendedPos!] || aiRecommendedPos}) with a suitability score of <strong>{topRec?.suitabilityScore}/100</strong>.
                        Consider discussing a position change with the coaching staff.
                      </p>
                      <Button
                        size="sm"
                        className="mt-2 bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1"
                        disabled={requestPositionChangeMutation.isPending}
                        onClick={() => {
                          if (!currentPosition || !aiRecommendedPos) return;
                          requestPositionChangeMutation.mutate({
                            playerId,
                            currentPosition: currentPosition,
                            recommendedPosition: aiRecommendedPos,
                            reason: `AI suitability score: ${topRec?.suitabilityScore}/100`,
                          });
                        }}
                      >
                        {requestPositionChangeMutation.isPending ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : requestPositionChangeMutation.isSuccess ? (
                          <CheckCircle className="h-3 w-3" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        {requestPositionChangeMutation.isSuccess ? "Request Sent!" : "Request Position Change"}
                      </Button>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-600 flex items-center gap-2">
                        <MapPin className="h-5 w-5" /> Current Position
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <span className="text-5xl font-bold text-green-600">{currentPosition ?? profile.recommendedPosition ?? "—"}</span>
                        <p className="text-sm text-muted-foreground mt-2">
                          {(currentPosition || profile.recommendedPosition) ? POSITION_FULL_NAMES[currentPosition || profile.recommendedPosition] || (currentPosition || profile.recommendedPosition) : "Not set yet"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Player's registered position</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-blue-600 flex items-center gap-2">
                        <Star className="h-5 w-5" /> Future Position
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4">
                        <span className="text-5xl font-bold text-blue-600">{profile.futurePosition ?? "—"}</span>
                        <p className="text-sm text-muted-foreground mt-2">
                          {profile.futurePosition ? POSITION_FULL_NAMES[profile.futurePosition] || profile.futurePosition : "Not set yet"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Projected with full development</p>
                      </div>
                    </CardContent>
                  </Card>
                  {profile.futurePositionRationale && (
                    <Card className="md:col-span-2">
                      <CardHeader><CardTitle>Career Pathway Rationale</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-sm leading-relaxed">{profile.futurePositionRationale}</p>
                      </CardContent>
                    </Card>
                  )}
                  {topRec && (
                    <Card className="md:col-span-2 border-primary/30 bg-primary/5">
                      <CardHeader>
                        <CardTitle className="text-primary flex items-center gap-2">
                          <Cpu className="h-5 w-5" /> AI Recommended Position
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <span className="text-5xl font-bold text-primary">{topRec.position}</span>
                            <p className="text-sm text-muted-foreground mt-1">{POSITION_FULL_NAMES[topRec.position]}</p>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Suitability</span>
                              <span className="font-bold">{topRec.suitabilityScore}/100</span>
                            </div>
                            <Progress value={topRec.suitabilityScore} className="h-3" />
                            <p className="text-xs text-muted-foreground mt-2">
                              Confidence: <strong>{topRec.confidence}</strong>
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Trend Charts — Skill History */}
            {skillHistory.length >= 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" /> Performance Trends
                    <Badge variant="outline" className="ml-auto text-xs">{skillHistory.length} assessments</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="technical">
                    <TabsList className="grid w-full grid-cols-3 mb-4">
                      <TabsTrigger value="technical">Technical</TabsTrigger>
                      <TabsTrigger value="physical">Physical</TabsTrigger>
                      <TabsTrigger value="overall">Overall</TabsTrigger>
                    </TabsList>

                    {/* Technical Skills Trend */}
                    <TabsContent value="technical">
                      <p className="text-xs text-muted-foreground mb-3">Historical progression of technical skill scores across all assessments.</p>
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={[...skillHistory].reverse().map((s: any) => ({
                          date: new Date(s.assessmentDate).toLocaleDateString('en-GB', { month:'short', year:'2-digit' }),
                          "Ball Control": s.ballControl,
                          "Dribbling": s.dribbling,
                          "Passing": s.passing,
                          "Shooting": s.shooting,
                          "First Touch": s.firstTouch,
                        }))} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="Ball Control" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="Dribbling" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="Passing" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="Shooting" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="First Touch" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </TabsContent>

                    {/* Physical Skills Trend */}
                    <TabsContent value="physical">
                      <p className="text-xs text-muted-foreground mb-3">Historical progression of physical attributes across all assessments.</p>
                      <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={[...skillHistory].reverse().map((s: any) => ({
                          date: new Date(s.assessmentDate).toLocaleDateString('en-GB', { month:'short', year:'2-digit' }),
                          "Speed": s.speed,
                          "Acceleration": s.acceleration,
                          "Agility": s.agility,
                          "Stamina": s.stamina,
                          "Strength": s.strength,
                        }))} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Line type="monotone" dataKey="Speed" stroke="#dc2626" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="Acceleration" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="Agility" stroke="#16a34a" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="Stamina" stroke="#d97706" strokeWidth={2} dot={{ r: 3 }} />
                          <Line type="monotone" dataKey="Strength" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </TabsContent>

                    {/* Overall Scores Trend */}
                    <TabsContent value="overall">
                      <p className="text-xs text-muted-foreground mb-3">Overall composite scores showing the player's development trajectory.</p>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={[...skillHistory].reverse().map((s: any) => ({
                          date: new Date(s.assessmentDate).toLocaleDateString('en-GB', { month:'short', year:'2-digit' }),
                          "Overall": s.overallRating,
                          "Technical": s.technicalOverall,
                          "Physical": s.physicalOverall,
                          "Mental": s.mentalOverall,
                          "Defensive": s.defensiveOverall,
                        }))} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip contentStyle={{ fontSize: 12 }} />
                          <Legend wrapperStyle={{ fontSize: 11 }} />
                          <Bar dataKey="Overall" fill="#dc2626" radius={[3,3,0,0]} />
                          <Bar dataKey="Technical" fill="#2563eb" radius={[3,3,0,0]} />
                          <Bar dataKey="Physical" fill="#16a34a" radius={[3,3,0,0]} />
                          <Bar dataKey="Mental" fill="#d97706" radius={[3,3,0,0]} />
                          <Bar dataKey="Defensive" fill="#7c3aed" radius={[3,3,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                      {/* Improvement delta */}
                      {skillHistory.length >= 2 && (() => {
                        const latest = skillHistory[0];
                        const oldest = skillHistory[skillHistory.length - 1];
                        const delta = (latest.overallRating ?? 50) - (oldest.overallRating ?? 50);
                        return (
                          <div className={`mt-3 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${delta > 0 ? 'bg-green-500/10 text-green-700 dark:text-green-400' : delta < 0 ? 'bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-muted text-muted-foreground'}`}>
                            <TrendingUp className="h-4 w-4" />
                            Overall rating changed by <strong>{delta > 0 ? '+' : ''}{delta} points</strong> over {skillHistory.length} assessments
                            {delta > 5 ? ' — Strong improvement trajectory' : delta > 0 ? ' — Steady progress' : delta === 0 ? ' — Stable performance' : ' — Needs attention'}
                          </div>
                        );
                      })()}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* Coach Notes */}
            {profile.coachNotes && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" /> Coach Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed italic text-muted-foreground">"{profile.coachNotes}"</p>
                </CardContent>
              </Card>
            )}

            {/* AI Analysis — skeleton while generating, edit mode, or display */}
            {aiMutation.isPending ? (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Loader2 className="h-5 w-5 animate-spin" /> Generating AI Scout Analysis…
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div>
                  <div className="space-y-2 pt-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-4 w-full" /></div>
                  <div className="space-y-2 pt-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>
                  <p className="text-xs text-muted-foreground pt-2 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" /> AI is analysing player data — this takes 10–20 seconds…
                  </p>
                </CardContent>
              </Card>
            ) : isEditingAI ? (
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <PenLine className="h-5 w-5" /> Edit AI Scout Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">AI-Generated Analysis</Label>
                    <Textarea value={editedAnalysis} onChange={e => setEditedAnalysis(e.target.value)} rows={16} className="font-mono text-sm leading-relaxed" />
                    <p className="text-xs text-muted-foreground mt-1">Edit or rewrite the AI-generated text above.</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-1.5 block">Custom Coach Notes (optional)</Label>
                    <Textarea value={customNotes} onChange={e => setCustomNotes(e.target.value)} rows={4} placeholder="Add your own observations that will be appended to the analysis…" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveAI} disabled={saveAIAnalysisMutation.isPending} className="flex-1">
                      {saveAIAnalysisMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Analysis
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditingAI(false)}><X className="h-4 w-4 mr-1" /> Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            ) : profile.aiAnalysis ? (
              <Card className="border-primary/30">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5" /> AI Scout Analysis</CardTitle>
                    <Button variant="ghost" size="sm" onClick={openEditAI}><PenLine className="h-4 w-4 mr-1" /> Edit</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
                    {profile.aiAnalysis}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Assessment Date */}
            <p className="text-xs text-muted-foreground text-right flex items-center justify-end gap-1">
              <Calendar className="h-3 w-3" />
              Last assessed: {profile.assessmentDate ? new Date(profile.assessmentDate).toLocaleDateString() : "Unknown"}
            </p>
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Scouting Report — {player?.firstName} {player?.lastName}</DialogTitle>
            </DialogHeader>
            {editForm && (
              <div className="space-y-4">
                {/* AI position suggestion banner */}
                {topRec && (
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 flex items-center gap-3">
                    <Cpu className="h-4 w-4 text-primary shrink-0" />
                    <p className="text-xs">
                      <strong>AI Suggestion:</strong> Based on skill assessment, the recommended position is{" "}
                      <strong className="text-primary">{topRec.position}</strong> ({topRec.suitabilityScore}/100 suitability).{" "}
                      <button
                        className="underline text-primary"
                        onClick={() => setEditForm({ ...editForm, recommendedPosition: topRec.position })}
                      >
                        Use this
                      </button>
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Assessment Date</Label>
                    <Input type="date" value={editForm.assessmentDate} onChange={e => setEditForm({ ...editForm, assessmentDate: e.target.value })} />
                  </div>
                  <div>
                    <Label>Potential Rating</Label>
                    <Select value={editForm.potentialRating} onValueChange={v => setEditForm({ ...editForm, potentialRating: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="elite">Elite</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Recommended Position</Label>
                    <Select value={editForm.recommendedPosition} onValueChange={v => setEditForm({ ...editForm, recommendedPosition: v })}>
                      <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                      <SelectContent>{POSITIONS.map(p => <SelectItem key={p} value={p}>{p} — {POSITION_FULL_NAMES[p]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Future Position</Label>
                    <Select value={editForm.futurePosition} onValueChange={v => setEditForm({ ...editForm, futurePosition: v })}>
                      <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                      <SelectContent>{POSITIONS.map(p => <SelectItem key={p} value={p}>{p} — {POSITION_FULL_NAMES[p]}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: "overallRating", label: "Overall Rating" },
                    { key: "technicalRating", label: "Technical" },
                    { key: "physicalRating", label: "Physical" },
                    { key: "mentalRating", label: "Mental" },
                    { key: "tacticalRating", label: "Tactical" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <Label>{label} (0-100): {editForm[key]}</Label>
                      <Input type="range" min="0" max="100" value={editForm[key]}
                        onChange={e => setEditForm({ ...editForm, [key]: Number(e.target.value) })} />
                    </div>
                  ))}
                </div>

                <div>
                  <Label>Strength Points (one per line)</Label>
                  <Textarea rows={4} value={editForm.strengthPoints}
                    onChange={e => setEditForm({ ...editForm, strengthPoints: e.target.value })}
                    placeholder="Excellent reflexes&#10;Good shot-stopping&#10;Strong command of penalty area" />
                </div>
                <div>
                  <Label>Weak Points (one per line)</Label>
                  <Textarea rows={4} value={editForm.weakPoints}
                    onChange={e => setEditForm({ ...editForm, weakPoints: e.target.value })}
                    placeholder="Weak distribution with feet&#10;Needs to improve communication" />
                </div>
                <div>
                  <Label>Development Points (one per line)</Label>
                  <Textarea rows={4} value={editForm.developmentPoints}
                    onChange={e => setEditForm({ ...editForm, developmentPoints: e.target.value })}
                    placeholder="Focus on distribution drills 3x/week&#10;Improve communication with defenders" />
                </div>
                <div>
                  <Label>Future Position Rationale</Label>
                  <Textarea rows={2} value={editForm.futurePositionRationale}
                    onChange={e => setEditForm({ ...editForm, futurePositionRationale: e.target.value })} />
                </div>
                <div>
                  <Label>Coach Notes</Label>
                  <Textarea rows={3} value={editForm.coachNotes}
                    onChange={e => setEditForm({ ...editForm, coachNotes: e.target.value })} />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" onClick={handleSave} disabled={upsertMutation.isPending}>
                    {upsertMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Save Report
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
