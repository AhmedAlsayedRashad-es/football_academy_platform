import { useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft, Heart, Activity, Dumbbell, BarChart3,
  Plus, Upload, FileText, AlertTriangle, CheckCircle, Scale,
  Download, Save, HelpCircle, Stethoscope, FlaskConical, Brain
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

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    low: "bg-green-900/40 text-green-700 dark:text-green-400 border-green-700/40",
    moderate: "bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-700/40",
    high: "bg-red-900/40 text-red-600 dark:text-red-400 border-red-700/40",
    very_high: "bg-red-900/60 text-red-600 dark:text-red-300 border-red-600/60",
    critical: "bg-red-900/60 text-red-600 dark:text-red-300 border-red-600/60",
  };
  return <Badge className={"text-xs border " + (colors[level] || colors.low)}>{level}</Badge>;
}

export default function PlayerMedicalProfile() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const playerId = parseInt(id || "0");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addDialogType, setAddDialogType] = useState<"medical" | "physical" | "muscle" | "blood" | "load">("medical");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [reportAnalysis, setReportAnalysis] = useState<any>(null);
  const [isAnalyzingReport, setIsAnalyzingReport] = useState(false);
  const reportFileRef = useRef<HTMLInputElement>(null);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvImporting, setCsvImporting] = useState(false);
  const csvFileRef = useRef<HTMLInputElement>(null);

  const { data: player } = trpc.players.getById.useQuery({ id: playerId }, { enabled: !!playerId });
  const { data: injuries } = trpc.injuries.getPlayerInjuries.useQuery({ playerId }, { enabled: !!playerId });
  const { data: medicalData, refetch: refetchMedical } = trpc.medical.getMedicalData.useQuery({ playerId }, { enabled: !!playerId });
  const { data: physicalTests, refetch: refetchPhysical } = trpc.medical.getPhysicalTests.useQuery({ playerId }, { enabled: !!playerId });
  const { data: muscleData, refetch: refetchMuscle } = trpc.medical.getMuscleMeasurements.useQuery({ playerId }, { enabled: !!playerId });
  const { data: bloodMarkers, refetch: refetchBlood } = trpc.medical.getBloodMarkers.useQuery({ playerId }, { enabled: !!playerId });
  const { data: trainingLoad, refetch: refetchLoad } = trpc.medical.getTrainingLoad.useQuery({ playerId }, { enabled: !!playerId });
  const { data: sessionPerf } = trpc.medical.getSessionPerformance.useQuery({ playerId, limit: 10 }, { enabled: !!playerId });

  const saveMedicalMutation = trpc.medical.saveMedicalData.useMutation({
    onSuccess: () => { refetchMedical(); setShowAddDialog(false); setFormData({}); toast({ title: "Medical data saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const savePhysicalMutation = trpc.medical.savePhysicalTest.useMutation({
    onSuccess: () => { refetchPhysical(); setShowAddDialog(false); setFormData({}); toast({ title: "Physical test saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const saveMuscleMutation = trpc.medical.saveMuscleMeasurement.useMutation({
    onSuccess: () => { refetchMuscle(); setShowAddDialog(false); setFormData({}); toast({ title: "Muscle measurement saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const saveBloodMutation = trpc.medical.saveBloodMarkers.useMutation({
    onSuccess: () => { refetchBlood(); setShowAddDialog(false); setFormData({}); toast({ title: "Blood markers saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const saveLoadMutation = trpc.medical.saveTrainingLoad.useMutation({
    onSuccess: () => { refetchLoad(); setShowAddDialog(false); setFormData({}); toast({ title: "Training load saved" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
  const analyzeProgressMutation = trpc.medical.analyzePlayerProgress.useMutation({
    onSuccess: (data: any) => { setAiAnalysis(data); toast({ title: "AI Analysis complete" }); },
    onError: (e: any) => toast({ title: "Analysis failed", description: e.message, variant: "destructive" }),
  });

  const latestLoad = Array.isArray(trainingLoad) && trainingLoad.length > 0 ? trainingLoad[0] : null;
  const acRatio = latestLoad?.acRatio ? parseFloat(latestLoad.acRatio) : null;
  const acRiskLevel = acRatio ? (acRatio > 1.5 ? "high" : acRatio > 1.3 ? "moderate" : "low") : "low";

  const playerName = player
    ? ((player as any).name || `${(player as any).firstName || ""} ${(player as any).lastName || ""}`.trim())
    : "Player";

  const openAddDialog = (type: typeof addDialogType) => {
    setAddDialogType(type);
    setFormData({});
    setShowAddDialog(true);
  };

  const handleSave = () => {
    const data = { playerId, ...formData };
    if (addDialogType === "medical") saveMedicalMutation.mutate(data);
    else if (addDialogType === "physical") savePhysicalMutation.mutate(data);
    else if (addDialogType === "muscle") saveMuscleMutation.mutate(data);
    else if (addDialogType === "blood") saveBloodMutation.mutate(data);
    else if (addDialogType === "load") saveLoadMutation.mutate({ ...data, weekStart: (data as any).weekStart || new Date().toISOString().split("T")[0] });
  };

  const saveMedicalBulk = trpc.medical.saveMedicalData.useMutation();

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
      const rows = lines.slice(1).map(line => {
        const vals = line.split(',');
        return headers.reduce((obj: any, h, i) => { obj[h] = vals[i]?.trim() || ''; return obj; }, {});
      });
      setCsvPreview(rows);
      setShowCsvImport(true);
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (csvPreview.length === 0) return;
    setCsvImporting(true);
    try {
      // Map CSV fields to medical data fields
      const row = csvPreview[0]; // Import first row for this player
      await saveMedicalBulk.mutateAsync({
        playerId,
        bloodType: row.blood_type || row.bloodtype || row.blood || '',
        allergies: row.allergies || row.allergy || '',
        chronicConditions: row.chronic_conditions || row.conditions || row.chronic || '',
        emergencyContact: row.emergency_contact || row.emergency || '',
        notes: row.notes || row.note || row.medical_notes || '',
        height: row.height || '',
        weight: row.weight || '',
        bmi: row.bmi || '',
        restingHR: row.resting_hr ? parseInt(row.resting_hr) : undefined,
        bloodPressure: row.blood_pressure || row.bp || '',
      });
      toast({ title: 'Medical data imported', description: `Imported ${csvPreview.length} record(s) successfully.` });
      setShowCsvImport(false);
      setCsvPreview([]);
    } catch {
      toast({ title: 'Import failed', variant: 'destructive' });
    } finally {
      setCsvImporting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      toast({ title: "File uploaded", description: file.name + " uploaded successfully" });
      setFormData(p => ({ ...p, documentUrl: data.url, documentName: file.name }));
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const exportReport = () => {
    const report = {
      player: playerName,
      exportDate: new Date().toISOString(),
      medicalData,
      physicalTests,
      muscleData,
      bloodMarkers,
      trainingLoad,
      injuries,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = playerName.replace(/\s+/g, "_") + "_medical_report.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report exported" });
  };

  return (
    <>
    <div className="text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/player/" + playerId)} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={20} />
              </button>
              <div>
                <PageBreadcrumb
                  items={[
                    { label: "Players", labelAr: "اللاعبين", href: "/players" },
                    { label: playerName, href: "/player/" + playerId },
                    { label: "Medical Profile", labelAr: "الملف الطبي" },
                  ]}
                  className="mb-1 text-muted-foreground"
                />
                <h1 className="text-xl font-bold flex items-center gap-2">
                  <Stethoscope size={22} className="text-red-500" />
                  Medical Profile
                  <HelpIcon text="Complete medical and physical profile. All data is stored securely and accessible only to authorized staff." />
                </h1>
                <p className="text-muted-foreground text-sm">{playerName} · {(player as any)?.position}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={exportReport} className="border-border text-muted-foreground hover:bg-muted text-xs">
                <Download size={12} className="mr-1" /> Export
              </Button>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.png,.doc,.docx" className="hidden" onChange={handleFileUpload} />
              <input ref={csvFileRef} type="file" accept=".csv" className="hidden" onChange={handleCsvFile} />
              <Button size="sm" onClick={() => csvFileRef.current?.click()} className="bg-green-700 hover:bg-green-600 text-white text-xs">
                <Upload size={12} className="mr-1" /> Import CSV
              </Button>
              <Button size="sm" onClick={() => fileInputRef.current?.click()} className="bg-blue-700 hover:bg-blue-600 text-white text-xs">
                <Upload size={12} className="mr-1" /> {isUploading ? "Uploading..." : "Upload File"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted border border-border mb-6 flex flex-wrap gap-1 h-auto p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-red-700 data-[state=active]:text-white text-xs">
              <Activity size={12} className="mr-1" /> Overview
            </TabsTrigger>
            <TabsTrigger value="physical" className="data-[state=active]:bg-blue-700 data-[state=active]:text-white text-xs">
              <Dumbbell size={12} className="mr-1" /> Physical Tests
            </TabsTrigger>
            <TabsTrigger value="muscles" className="data-[state=active]:bg-green-700 data-[state=active]:text-white text-xs">
              <Scale size={12} className="mr-1" /> Muscle Measurements
            </TabsTrigger>
            <TabsTrigger value="load" className="data-[state=active]:bg-orange-700 data-[state=active]:text-white text-xs">
              <BarChart3 size={12} className="mr-1" /> Training Load
            </TabsTrigger>
            <TabsTrigger value="medical" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white text-xs">
              <FileText size={12} className="mr-1" /> Medical History
            </TabsTrigger>
            <TabsTrigger value="blood" className="data-[state=active]:bg-pink-700 data-[state=active]:text-white text-xs">
              <FlaskConical size={12} className="mr-1" /> Blood Markers
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-indigo-700 data-[state=active]:text-white text-xs">
              <Brain size={12} className="mr-1" /> AI Progress
            </TabsTrigger>
            <TabsTrigger value="ai_report" className="data-[state=active]:bg-green-700 data-[state=active]:text-white text-xs">
              <Upload size={12} className="mr-1" /> AI Report Analysis
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Activity size={16} className="text-blue-600 dark:text-blue-400" /> Body Composition
                    <HelpIcon text="Latest body composition measurements. Height, weight, BMI, body fat %, and VO2 max." />
                  </h3>
                  <Button size="sm" onClick={() => openAddDialog("medical")} className="bg-blue-700 hover:bg-blue-600 text-white text-xs h-7">
                    <Plus size={10} className="mr-1" /> Record
                  </Button>
                </div>
                {medicalData ? (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Height", value: (medicalData as any).height ? (medicalData as any).height + " cm" : "—" },
                      { label: "Weight", value: (medicalData as any).weight ? (medicalData as any).weight + " kg" : "—" },
                      { label: "BMI", value: (medicalData as any).bmi || "—" },
                      { label: "Body Fat", value: (medicalData as any).bodyFatPercent ? (medicalData as any).bodyFatPercent + "%" : "—" },
                      { label: "Muscle Mass", value: (medicalData as any).muscleMassKg ? (medicalData as any).muscleMassKg + " kg" : "—" },
                      { label: "Resting HR", value: (medicalData as any).restingHR ? (medicalData as any).restingHR + " bpm" : "—" },
                    ].map(item => (
                      <div key={item.label} className="bg-muted rounded-lg p-2.5">
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="text-lg font-bold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No body composition data yet</p>
                    <Button size="sm" onClick={() => openAddDialog("medical")} className="mt-2 bg-blue-700 hover:bg-blue-600 text-white text-xs">
                      Record First Measurement
                    </Button>
                  </div>
                )}
              </div>

              <div className="bg-card rounded-xl border border-border p-4">
                <h3 className="font-bold text-foreground flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-yellow-700 dark:text-yellow-400" /> Injury Risk Assessment
                  <HelpIcon text="Injury risk based on training load A:C ratio, muscle imbalances, and injury history." />
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Training Load Risk</span>
                    <RiskBadge level={acRiskLevel} />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Active Injuries</span>
                    <Badge className="bg-muted text-muted-foreground text-xs">
                      {Array.isArray(injuries) ? injuries.filter((i: any) => i.status === "active").length : 0}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">Total Injury History</span>
                    <Badge className="bg-muted text-muted-foreground text-xs">
                      {Array.isArray(injuries) ? injuries.length : 0} records
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm text-muted-foreground">A:C Ratio</span>
                    <span className={`font-bold text-sm ${acRiskLevel === "high" ? "text-red-600 dark:text-red-400" : acRiskLevel === "moderate" ? "text-yellow-700 dark:text-yellow-400" : "text-green-700 dark:text-green-400"}`}>
                      {acRatio ? acRatio.toFixed(2) : "—"}
                    </span>
                  </div>
                  {(medicalData as any)?.bloodType && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Blood Type</span>
                      <Badge className="bg-red-900/40 text-red-600 dark:text-red-400 border-red-700/40 text-xs border">{(medicalData as any).bloodType}</Badge>
                    </div>
                  )}
                  {(medicalData as any)?.dominantFoot && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <span className="text-sm text-muted-foreground">Dominant Foot</span>
                      <Badge className="bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-700/40 text-xs border capitalize">{(medicalData as any).dominantFoot}</Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* ===== BLOOD MARKERS SUMMARY ===== */}
              {Array.isArray(bloodMarkers) && bloodMarkers.length > 0 && (() => {
                const latest = bloodMarkers[0];
                const keyMarkers = [
                  { label: "Hemoglobin", value: latest.hemoglobin, unit: "g/dL", normal: [13.5, 17.5] },
                  { label: "Testosterone", value: latest.testosterone, unit: "ng/dL", normal: [300, 1000] },
                  { label: "Vitamin D", value: latest.vitaminD, unit: "ng/mL", normal: [30, 100] },
                  { label: "Iron", value: (latest as any).iron, unit: "μg/dL", normal: [60, 170] },
                  { label: "Cortisol", value: latest.cortisol, unit: "mcg/dL", normal: [6, 23] },
                  { label: "Glucose", value: latest.glucose, unit: "mg/dL", normal: [70, 100] },
                ].filter(m => m.value !== null && m.value !== undefined);
                return (
                  <div className="md:col-span-2 bg-card rounded-xl border border-pink-700/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <FlaskConical size={16} className="text-pink-600 dark:text-pink-400" /> Blood Markers
                        <span className="text-xs text-muted-foreground font-normal ml-1">Latest: {latest.testDate ? new Date(latest.testDate).toLocaleDateString() : "—"}</span>
                      </h3>
                      <Button size="sm" onClick={() => setActiveTab("blood")} className="bg-pink-700 hover:bg-pink-600 text-white text-xs h-7">View All</Button>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {keyMarkers.map(m => {
                        const v = parseFloat(String(m.value));
                        const isLow = !isNaN(v) && v < m.normal[0];
                        const isHigh = !isNaN(v) && v > m.normal[1];
                        const color = isLow ? "text-yellow-700 dark:text-yellow-400" : isHigh ? "text-red-600 dark:text-red-400" : "text-green-700 dark:text-green-400";
                        return (
                          <div key={m.label} className="bg-muted rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground mb-0.5">{m.label}</p>
                            <p className={`text-base font-bold ${color}`}>{m.value}</p>
                            <p className="text-xs text-muted-foreground">{m.unit}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* ===== INBODY COMPOSITION SUMMARY ===== */}
              {Array.isArray(muscleData) && muscleData.length > 0 && (() => {
                const latest = muscleData[0];
                const inbodyItems = [
                  { label: "Body Fat %", value: (latest as any).bodyFatPercent !== null ? (latest as any).bodyFatPercent + "%" : "—", color: "text-orange-700 dark:text-orange-400" },
                  { label: "Skeletal Muscle", value: (latest as any).skeletalMuscleMass !== null ? (latest as any).skeletalMuscleMass + " kg" : "—", color: "text-blue-600 dark:text-blue-400" },
                  { label: "BMI", value: (latest as any).bmi !== null ? (latest as any).bmi : "—", color: "text-purple-600 dark:text-purple-400" },
                  { label: "Weight", value: (latest as any).weight !== null ? (latest as any).weight + " kg" : "—", color: "text-foreground" },
                  { label: "InBody Score", value: (latest as any).inBodyScore !== null ? (latest as any).inBodyScore : "—", color: "text-green-700 dark:text-green-400" },
                  { label: "Visceral Fat", value: (latest as any).visceralFatLevel !== null ? "Level " + (latest as any).visceralFatLevel : "—", color: "text-yellow-700 dark:text-yellow-400" },
                ].filter(m => m.value !== "—");
                return (
                  <div className="md:col-span-2 bg-card rounded-xl border border-cyan-700/30 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-foreground flex items-center gap-2">
                        <Scale size={16} className="text-cyan-700 dark:text-cyan-400" /> InBody Composition
                        <span className="text-xs text-muted-foreground font-normal ml-1">Latest: {latest.measurementDate ? new Date(latest.measurementDate).toLocaleDateString() : "—"}</span>
                      </h3>
                      <Button size="sm" onClick={() => setActiveTab("muscles")} className="bg-cyan-700 hover:bg-cyan-600 text-white text-xs h-7">View All</Button>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {inbodyItems.map(item => (
                        <div key={item.label} className="bg-muted rounded-lg p-2 text-center">
                          <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                          <p className={`text-base font-bold ${item.color}`}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {(medicalData as any)?.allergies || (medicalData as any)?.chronicConditions ? (
                <div className="md:col-span-2 bg-card rounded-xl border border-yellow-700/30 p-4">
                  <h3 className="font-bold text-yellow-700 dark:text-yellow-400 flex items-center gap-2 mb-3">
                    <AlertTriangle size={16} /> Medical Alerts
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {(medicalData as any)?.allergies && (
                      <div className="bg-yellow-900/20 rounded-lg p-3 border border-yellow-700/30">
                        <p className="text-xs text-yellow-700 dark:text-yellow-400 font-medium mb-1">Allergies</p>
                        <p className="text-sm text-foreground">{(medicalData as any).allergies}</p>
                      </div>
                    )}
                    {(medicalData as any)?.chronicConditions && (
                      <div className="bg-orange-900/20 rounded-lg p-3 border border-orange-700/30">
                        <p className="text-xs text-orange-700 dark:text-orange-400 font-medium mb-1">Chronic Conditions</p>
                        <p className="text-sm text-foreground">{(medicalData as any).chronicConditions}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          </TabsContent>

          {/* PHYSICAL TESTS TAB */}
          <TabsContent value="physical">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Dumbbell size={16} className="text-blue-600 dark:text-blue-400" /> Physical Test Results
                  <HelpIcon text="Record speed (sprint times), strength (1RM), endurance (Beep/Yo-Yo), flexibility (sit and reach), and agility (T-test) benchmarks. Track progress over time." />
                </h3>
                <Button size="sm" onClick={() => openAddDialog("physical")} className="bg-blue-700 hover:bg-blue-600 text-white text-xs">
                  <Plus size={12} className="mr-1" /> Add Test
                </Button>
              </div>
              {Array.isArray(physicalTests) && physicalTests.length > 0 ? (
                <div className="space-y-3">
                  {physicalTests.map((test: any) => (
                    <div key={test.id} className="bg-muted rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground text-sm">Physical Test — {test.testDate ? new Date(test.testDate).toLocaleDateString() : "—"}</span>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {test.sprintMax && <div className="text-center bg-muted/50 rounded p-2"><p className="text-sm font-bold text-yellow-700 dark:text-yellow-400">{test.sprintMax}s</p><p className="text-xs text-muted-foreground">Sprint Max</p></div>}
                        {test.verticalJump && <div className="text-center bg-muted/50 rounded p-2"><p className="text-sm font-bold text-blue-600 dark:text-blue-400">{test.verticalJump}cm</p><p className="text-xs text-muted-foreground">Vert. Jump</p></div>}
                        {test.broadJump && <div className="text-center bg-muted/50 rounded p-2"><p className="text-sm font-bold text-green-700 dark:text-green-400">{test.broadJump}cm</p><p className="text-xs text-muted-foreground">Broad Jump</p></div>}
                        {test.benchPress && <div className="text-center bg-muted/50 rounded p-2"><p className="text-sm font-bold text-red-600 dark:text-red-400">{test.benchPress}kg</p><p className="text-xs text-muted-foreground">Bench Press</p></div>}
                        {test.squat && <div className="text-center bg-muted/50 rounded p-2"><p className="text-sm font-bold text-orange-700 dark:text-orange-400">{test.squat}kg</p><p className="text-xs text-muted-foreground">Squat</p></div>}
                        {test.beepTestLevel && <div className="text-center bg-muted/50 rounded p-2"><p className="text-sm font-bold text-purple-600 dark:text-purple-400">{test.beepTestLevel}</p><p className="text-xs text-muted-foreground">Beep Test</p></div>}
                        {test.agilityT && <div className="text-center bg-muted/50 rounded p-2"><p className="text-sm font-bold text-pink-600 dark:text-pink-400">{test.agilityT}s</p><p className="text-xs text-muted-foreground">Agility T</p></div>}
                        {test.sitAndReach && <div className="text-center bg-muted/50 rounded p-2"><p className="text-sm font-bold text-teal-700 dark:text-teal-400">{test.sitAndReach}cm</p><p className="text-xs text-muted-foreground">Flexibility</p></div>}
                      </div>
                      {test.notes && <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{test.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No physical tests recorded yet</p>
                  <Button size="sm" onClick={() => openAddDialog("physical")} className="mt-3 bg-blue-700 hover:bg-blue-600 text-white text-xs">
                    Record First Test
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* MUSCLE MEASUREMENTS TAB */}
          <TabsContent value="muscles">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Scale size={16} className="text-green-700 dark:text-green-400" /> Muscle Measurements
                  <HelpIcon text="Bilateral circumference measurements (cm) for quads, hamstrings, calves, biceps, chest, waist, and hip. Imbalances greater than 10% between left and right are flagged as injury risk factors." />
                </h3>
                <Button size="sm" onClick={() => openAddDialog("muscle")} className="bg-green-700 hover:bg-green-600 text-white text-xs">
                  <Plus size={12} className="mr-1" /> Add Measurement
                </Button>
              </div>
              {Array.isArray(muscleData) && muscleData.length > 0 ? (
                <div className="space-y-4">
                  {muscleData.map((m: any) => {
                    const pairs = [
                      { label: "Quadriceps", left: m.leftQuad, right: m.rightQuad },
                      { label: "Hamstrings", left: m.leftHamstring, right: m.rightHamstring },
                      { label: "Calves", left: m.leftCalf, right: m.rightCalf },
                      { label: "Biceps", left: m.leftBicep, right: m.rightBicep },
                    ].filter(p => p.left || p.right);
                    const singles = [
                      { label: "Chest", value: m.chest },
                      { label: "Waist", value: m.waist },
                      { label: "Hip", value: m.hip },
                    ].filter(p => p.value);
                    return (
                      <div key={m.id} className="bg-muted rounded-lg p-3">
                        <p className="text-xs text-muted-foreground mb-3">{m.measurementDate ? new Date(m.measurementDate).toLocaleDateString() : "—"}</p>
                        {pairs.length > 0 && (
                          <div className="space-y-2 mb-3">
                            {pairs.map(pair => {
                              const l = parseFloat(pair.left || "0");
                              const r = parseFloat(pair.right || "0");
                              const diff = l && r ? Math.abs((l - r) / Math.max(l, r) * 100) : 0;
                              const isImbalanced = diff > 10;
                              return (
                                <div key={pair.label} className={`rounded p-2 ${isImbalanced ? "bg-yellow-900/20 border border-yellow-700/40" : "bg-muted/50"}`}>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-muted-foreground">{pair.label}</span>
                                    {isImbalanced && <Badge className="bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-700/40 text-xs border">⚠ {diff.toFixed(1)}% imbalance</Badge>}
                                  </div>
                                  <div className="flex gap-4 mt-1">
                                    {pair.left && <span className="text-xs text-blue-600 dark:text-blue-400">L: {pair.left} cm</span>}
                                    {pair.right && <span className="text-xs text-green-700 dark:text-green-400">R: {pair.right} cm</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {singles.length > 0 && (
                          <div className="flex gap-3">
                            {singles.map(s => (
                              <div key={s.label} className="bg-muted/50 rounded p-2 text-center">
                                <p className="text-sm font-bold text-foreground">{s.value} cm</p>
                                <p className="text-xs text-muted-foreground">{s.label}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {m.notes && <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{m.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Scale size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No muscle measurements recorded yet</p>
                  <Button size="sm" onClick={() => openAddDialog("muscle")} className="mt-3 bg-green-700 hover:bg-green-600 text-white text-xs">
                    Record First Measurement
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TRAINING LOAD TAB */}
          <TabsContent value="load">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <BarChart3 size={16} className="text-orange-700 dark:text-orange-400" /> Training Load Management
                  <HelpIcon text="Acute:Chronic Workload Ratio (ACWR). Optimal range is 0.8–1.3. Above 1.5 indicates high injury risk. Acute = 7-day load. Chronic = 28-day average." />
                </h3>
                <Button size="sm" onClick={() => openAddDialog("load")} className="bg-orange-700 hover:bg-orange-600 text-white text-xs">
                  <Plus size={12} className="mr-1" /> Record Load
                </Button>
              </div>
              {latestLoad ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{latestLoad.acuteLoad || "—"}</p>
                      <p className="text-xs text-muted-foreground">Acute Load (7d)</p>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{latestLoad.chronicLoad || "—"}</p>
                      <p className="text-xs text-muted-foreground">Chronic Load (28d)</p>
                    </div>
                    <div className={`bg-muted rounded-lg p-3 text-center border ${acRiskLevel === "high" ? "border-red-700/50" : acRiskLevel === "moderate" ? "border-yellow-700/50" : "border-green-700/50"}`}>
                      <p className={`text-2xl font-bold ${acRiskLevel === "high" ? "text-red-600 dark:text-red-400" : acRiskLevel === "moderate" ? "text-yellow-700 dark:text-yellow-400" : "text-green-700 dark:text-green-400"}`}>
                        {latestLoad.acRatio || "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mb-1">A:C Ratio</p>
                      <RiskBadge level={latestLoad.riskLevel || acRiskLevel} />
                    </div>
                  </div>
                  {Array.isArray(trainingLoad) && trainingLoad.length > 1 && (
                    <div className="bg-muted rounded-lg p-3">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Load History (Last 12 Weeks)</h4>
                      <div className="space-y-1.5">
                        {trainingLoad.map((h: any) => (
                          <div key={h.id} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground w-24">{h.weekStart ? new Date(h.weekStart).toLocaleDateString() : "—"}</span>
                            <span className="text-orange-700 dark:text-orange-400">Acute: {h.acuteLoad || "—"}</span>
                            <span className="text-blue-600 dark:text-blue-400">Chronic: {h.chronicLoad || "—"}</span>
                            <span className="text-foreground">A:C: {h.acRatio || "—"}</span>
                            <RiskBadge level={h.riskLevel || "low"} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <BarChart3 size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No training load data yet</p>
                  <p className="text-xs mt-1">Record weekly load data to track A:C ratio and injury risk</p>
                  <Button size="sm" onClick={() => openAddDialog("load")} className="mt-3 bg-orange-700 hover:bg-orange-600 text-white text-xs">
                    Record First Load Entry
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* MEDICAL HISTORY TAB */}
          <TabsContent value="medical">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <FileText size={16} className="text-purple-600 dark:text-purple-400" /> Medical History and Injuries
                  <HelpIcon text="Complete injury and medical history records. All injuries, treatments, and recovery timelines are tracked here." />
                </h3>
              </div>
              {Array.isArray(injuries) && injuries.length > 0 ? (
                <div className="space-y-3">
                  {injuries.map((injury: any) => (
                    <div key={injury.id} className="bg-muted rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-foreground text-sm">{injury.injuryType}</span>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs border ${injury.status === "active" ? "bg-red-900/40 text-red-600 dark:text-red-400 border-red-700/40" : "bg-green-900/40 text-green-700 dark:text-green-400 border-green-700/40"}`}>
                            {injury.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {injury.injuryDate ? new Date(injury.injuryDate).toLocaleDateString() : "—"}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{injury.bodyPart} · Severity: {injury.severity}</p>
                      {injury.description && <p className="text-xs text-muted-foreground mt-1">{injury.description}</p>}
                      {injury.expectedReturnDate && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Expected return: {new Date(injury.expectedReturnDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle size={40} className="mx-auto mb-3 opacity-30 text-green-700 dark:text-green-500" />
                  <p>No injury history recorded</p>
                  <p className="text-xs mt-1">Injuries are recorded via the Injury Tracker</p>
                </div>
              )}
              {(medicalData as any)?.notes && (
                <div className="mt-4 bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Medical Notes</p>
                  <p className="text-sm text-foreground">{(medicalData as any).notes}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* BLOOD MARKERS TAB */}
          <TabsContent value="blood">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <FlaskConical size={16} className="text-pink-600 dark:text-pink-400" /> Blood Markers
                  <HelpIcon text="Track key blood biomarkers: Ferritin (iron stores), CK (muscle damage indicator), Hemoglobin (oxygen transport), Testosterone, Cortisol (stress), Vitamin D, B12, Magnesium, and more." />
                </h3>
                <Button size="sm" onClick={() => openAddDialog("blood")} className="bg-pink-700 hover:bg-pink-600 text-white text-xs">
                  <Plus size={12} className="mr-1" /> Add Results
                </Button>
              </div>
              {Array.isArray(bloodMarkers) && bloodMarkers.length > 0 ? (
                <div className="space-y-4">
                  {bloodMarkers.slice(0, 3).map((b: any, idx: number) => (
                    <div key={b.id} className={idx === 0 ? "bg-muted rounded-lg p-3 border border-blue-700/30" : "bg-muted/50 rounded-lg p-3"}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{idx === 0 ? "Latest Results" : "Previous Results"}</span>
                        <span className="text-xs text-muted-foreground">{b.testDate ? new Date(b.testDate).toLocaleDateString() : "—"}</span>
                      </div>
                      <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                        {[
                          { label: "Ferritin", value: b.ferritin, unit: "ng/mL", normal: "20–300", color: "text-red-600 dark:text-red-400" },
                          { label: "CK", value: b.creatineKinase, unit: "U/L", normal: "55–170", color: "text-orange-700 dark:text-orange-400" },
                          { label: "Hemoglobin", value: b.hemoglobin, unit: "g/dL", normal: "13.5–17.5", color: "text-pink-600 dark:text-pink-400" },
                          { label: "Testosterone", value: b.testosterone, unit: "ng/dL", normal: "300–1000", color: "text-yellow-700 dark:text-yellow-400" },
                          { label: "Cortisol", value: b.cortisol, unit: "μg/dL", normal: "6–23", color: "text-purple-600 dark:text-purple-400" },
                          { label: "Vitamin D", value: b.vitaminD, unit: "ng/mL", normal: "30–100", color: "text-blue-600 dark:text-blue-400" },
                          { label: "Vitamin B12", value: b.vitaminB12, unit: "pg/mL", normal: "200–900", color: "text-teal-700 dark:text-teal-400" },
                          { label: "Magnesium", value: b.magnesium, unit: "mg/dL", normal: "1.7–2.2", color: "text-green-700 dark:text-green-400" },
                        ].filter(m => m.value !== null && m.value !== undefined && m.value !== "").map(marker => (
                          <div key={marker.label} className="bg-muted/50 rounded p-2">
                            <p className="text-xs text-muted-foreground mb-0.5">{marker.label}</p>
                            <p className={`text-base font-bold ${marker.color}`}>{marker.value}</p>
                            <p className="text-xs text-muted-foreground">{marker.unit}</p>
                          </div>
                        ))}
                      </div>
                      {b.notes && <p className="text-xs text-muted-foreground mt-2 border-t border-border pt-2">{b.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <FlaskConical size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No blood marker data yet</p>
                  <Button size="sm" onClick={() => openAddDialog("blood")} className="mt-3 bg-pink-700 hover:bg-pink-600 text-white text-xs">
                    Add Blood Results
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* AI PROGRESS TAB */}
          <TabsContent value="progress">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <Brain size={16} className="text-indigo-600 dark:text-indigo-400" /> AI Progress Analysis
                  <HelpIcon text="AI analyzes training session performance data (physical, technical, mental, medical scores) to identify progress trends, key development areas, and recommend skill videos." />
                </h3>
                <Button
                  size="sm"
                  onClick={() => analyzeProgressMutation.mutate({ playerId })}
                  disabled={analyzeProgressMutation.isPending}
                  className="bg-indigo-700 hover:bg-indigo-600 text-white text-xs"
                >
                  <Brain size={12} className="mr-1" />
                  {analyzeProgressMutation.isPending ? "Analyzing..." : "Run AI Analysis"}
                </Button>
              </div>
              {Array.isArray(sessionPerf) && sessionPerf.length > 0 ? (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Recent Session Performance</h4>
                  <div className="space-y-2">
                    {sessionPerf.slice(0, 5).map((s: any) => (
                      <div key={s.id} className="bg-muted rounded-lg p-2.5 grid grid-cols-5 gap-2 text-xs">
                        <span className="text-muted-foreground">{s.sessionDate ? new Date(s.sessionDate).toLocaleDateString() : "—"}</span>
                        <div className="text-center"><p className="text-blue-600 dark:text-blue-400 font-bold">{s.physicalScore || "—"}</p><p className="text-muted-foreground">Physical</p></div>
                        <div className="text-center"><p className="text-green-700 dark:text-green-400 font-bold">{s.technicalScore || "—"}</p><p className="text-muted-foreground">Technical</p></div>
                        <div className="text-center"><p className="text-purple-600 dark:text-purple-400 font-bold">{s.mentalScore || "—"}</p><p className="text-muted-foreground">Mental</p></div>
                        <div className="text-center"><p className="text-red-600 dark:text-red-400 font-bold">{s.medicalScore || "—"}</p><p className="text-muted-foreground">Medical</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-muted rounded-lg p-4 mb-4 text-center text-muted-foreground">
                  <Brain size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No session performance data yet</p>
                  <p className="text-xs mt-1">Record training sessions via the Training Session Recorder to enable AI analysis</p>
                </div>
              )}
              {aiAnalysis && (
                <div className="space-y-3">
                  <div className="bg-indigo-900/20 border border-indigo-700/40 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2">AI Analysis</h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiAnalysis.analysis}</p>
                  </div>
                  {Array.isArray(aiAnalysis.recommendations) && aiAnalysis.recommendations.length > 0 && (
                    <div className="bg-green-900/20 border border-green-700/40 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-green-700 dark:text-green-400 mb-2">Development Recommendations</h4>
                      <ul className="space-y-1">
                        {aiAnalysis.recommendations.map((r: string, i: number) => (
                          <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-green-700 dark:text-green-400 mt-0.5">•</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {Array.isArray(aiAnalysis.skillVideos) && aiAnalysis.skillVideos.length > 0 && (
                    <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">Recommended Skill Videos</h4>
                      <div className="space-y-2">
                        {aiAnalysis.skillVideos.map((v: any, i: number) => (
                          <a key={i} href={v.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300 hover:text-blue-200 hover:underline">
                            <span className="text-blue-600 dark:text-blue-400">▶</span> {v.title}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
           <TabsContent value="ai_report">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText size={16} className="text-green-700 dark:text-green-400" />
                <h3 className="font-bold text-foreground">AI Medical Report Analysis</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">Upload a medical report (PDF, image, or document). The AI will extract key findings, flag concerns, and provide recommendations based on international sports medicine protocols (FIFA Medical Centre of Excellence, UEFA Medical Regulations, IOC Consensus Statements).</p>
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-green-600 transition-colors"
                onClick={() => reportFileRef.current?.click()}
              >
                <input
                  ref={reportFileRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setReportFile(f); }}
                />
                <Upload size={32} className="mx-auto mb-2 text-muted-foreground" />
                {reportFile ? (
                  <div>
                    <p className="text-green-700 dark:text-green-400 font-medium">{reportFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(reportFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-muted-foreground">Click to upload medical report</p>
                    <p className="text-xs text-gray-600 mt-1">PDF, JPG, PNG, DOC up to 10MB</p>
                  </div>
                )}
              </div>
              {reportFile && (
                <Button
                  className="w-full mt-4 bg-green-700 hover:bg-green-600 text-white"
                  disabled={isAnalyzingReport}
                  onClick={async () => {
                    setIsAnalyzingReport(true);
                    try {
                      const fd = new FormData();
                      fd.append('file', reportFile);
                      const res = await fetch('/api/upload', { method: 'POST', body: fd });
                      const uploadData = await res.json();
                      const fileUrl = uploadData.url || uploadData.path || '';
                      const analysisRes = await fetch('/api/analyze-medical-report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ fileUrl, playerId, playerName })
                      });
                      if (analysisRes.ok) {
                        const data = await analysisRes.json();
                        setReportAnalysis(data);
                        toast({ title: 'Report analyzed successfully' });
                      } else {
                        toast({ title: 'Analysis failed', variant: 'destructive' });
                      }
                    } catch (e: any) {
                      toast({ title: 'Error', description: e.message, variant: 'destructive' });
                    } finally {
                      setIsAnalyzingReport(false);
                    }
                  }}
                >
                  <Brain size={14} className="mr-2" />
                  {isAnalyzingReport ? 'Analyzing with AI...' : 'Analyze Report with AI'}
                </Button>
              )}
              {reportAnalysis && (
                <div className="mt-4 space-y-3">
                  {reportAnalysis.summary && (
                    <div className="bg-blue-900/20 border border-blue-700/40 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">Summary</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reportAnalysis.summary}</p>
                    </div>
                  )}
                  {Array.isArray(reportAnalysis.findings) && reportAnalysis.findings.length > 0 && (
                    <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-yellow-700 dark:text-yellow-400 mb-2">Key Findings</h4>
                      <ul className="space-y-1">{reportAnalysis.findings.map((f: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-yellow-700 dark:text-yellow-400 mt-0.5">•</span> {f}</li>
                      ))}</ul>
                    </div>
                  )}
                  {Array.isArray(reportAnalysis.concerns) && reportAnalysis.concerns.length > 0 && (
                    <div className="bg-red-900/20 border border-red-700/40 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-2">Concerns / Red Flags</h4>
                      <ul className="space-y-1">{reportAnalysis.concerns.map((c: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><AlertTriangle size={12} className="text-red-600 dark:text-red-400 mt-0.5 shrink-0" /> {c}</li>
                      ))}</ul>
                    </div>
                  )}
                  {Array.isArray(reportAnalysis.recommendations) && reportAnalysis.recommendations.length > 0 && (
                    <div className="bg-green-900/20 border border-green-700/40 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-green-700 dark:text-green-400 mb-2">Recommendations</h4>
                      <ul className="space-y-1">{reportAnalysis.recommendations.map((r: string, i: number) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><CheckCircle size={12} className="text-green-700 dark:text-green-400 mt-0.5 shrink-0" /> {r}</li>
                      ))}</ul>
                    </div>
                  )}
                  {reportAnalysis.protocol && (
                    <div className="bg-purple-900/20 border border-purple-700/40 rounded-lg p-4">
                      <h4 className="text-sm font-bold text-purple-600 dark:text-purple-400 mb-2">International Protocol Reference</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{reportAnalysis.protocol}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      {/* Add Data Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-card border-border text-foreground max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Plus size={18} className="text-blue-600 dark:text-blue-400" />
              {addDialogType === "medical" && "Record Body Composition & Medical Info"}
              {addDialogType === "physical" && "Record Physical Test Results"}
              {addDialogType === "muscle" && "Record Muscle Measurements"}
              {addDialogType === "blood" && "Record Blood Markers"}
              {addDialogType === "load" && "Record Training Load"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {addDialogType === "medical" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground block mb-1">Height (cm)</label><Input value={formData.height || ""} onChange={e => setFormData(p => ({ ...p, height: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Weight (kg)</label><Input value={formData.weight || ""} onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">BMI</label><Input value={formData.bmi || ""} onChange={e => setFormData(p => ({ ...p, bmi: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Body Fat %</label><Input value={formData.bodyFatPercent || ""} onChange={e => setFormData(p => ({ ...p, bodyFatPercent: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Muscle Mass (kg)</label><Input value={formData.muscleMassKg || ""} onChange={e => setFormData(p => ({ ...p, muscleMassKg: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Resting HR (bpm)</label><Input type="number" value={formData.restingHR || ""} onChange={e => setFormData(p => ({ ...p, restingHR: parseInt(e.target.value) }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Blood Pressure</label><Input value={formData.bloodPressure || ""} placeholder="120/80" onChange={e => setFormData(p => ({ ...p, bloodPressure: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Dominant Foot</label>
                    <Select value={formData.dominantFoot || ""} onValueChange={v => setFormData(p => ({ ...p, dominantFoot: v }))}>
                      <SelectTrigger className="bg-muted border-border text-foreground"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent className="bg-muted border-border">
                        {["right", "left", "both"].map(r => <SelectItem key={r} value={r} className="text-foreground hover:bg-muted capitalize">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Blood Type</label><Input value={formData.bloodType || ""} placeholder="A+, B-, O+..." onChange={e => setFormData(p => ({ ...p, bloodType: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                </div>
                <div><label className="text-xs text-muted-foreground block mb-1">Allergies</label><Input value={formData.allergies || ""} onChange={e => setFormData(p => ({ ...p, allergies: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                <div><label className="text-xs text-muted-foreground block mb-1">Chronic Conditions</label><Input value={formData.chronicConditions || ""} onChange={e => setFormData(p => ({ ...p, chronicConditions: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                <div><label className="text-xs text-muted-foreground block mb-1">Emergency Contact</label><Input value={formData.emergencyContact || ""} onChange={e => setFormData(p => ({ ...p, emergencyContact: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                <div><label className="text-xs text-muted-foreground block mb-1">Notes</label><Textarea value={formData.notes || ""} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} className="bg-muted border-border text-foreground resize-none h-16" /></div>
              </>
            )}
            {addDialogType === "physical" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground block mb-1">Sprint Max (s)</label><Input value={formData.sprintMax || ""} onChange={e => setFormData(p => ({ ...p, sprintMax: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Vertical Jump (cm)</label><Input value={formData.verticalJump || ""} onChange={e => setFormData(p => ({ ...p, verticalJump: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Broad Jump (cm)</label><Input value={formData.broadJump || ""} onChange={e => setFormData(p => ({ ...p, broadJump: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Bench Press 1RM (kg)</label><Input value={formData.benchPress || ""} onChange={e => setFormData(p => ({ ...p, benchPress: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Squat 1RM (kg)</label><Input value={formData.squat || ""} onChange={e => setFormData(p => ({ ...p, squat: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Beep Test Level</label><Input value={formData.beepTestLevel || ""} placeholder="e.g. 12.4" onChange={e => setFormData(p => ({ ...p, beepTestLevel: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Sit & Reach (cm)</label><Input value={formData.sitAndReach || ""} onChange={e => setFormData(p => ({ ...p, sitAndReach: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Agility T-Test (s)</label><Input value={formData.agilityT || ""} onChange={e => setFormData(p => ({ ...p, agilityT: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                </div>
                <div><label className="text-xs text-muted-foreground block mb-1">Notes</label><Textarea value={formData.notes || ""} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} className="bg-muted border-border text-foreground resize-none h-16" /></div>
              </>
            )}
            {addDialogType === "muscle" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground block mb-1">Left Quad (cm)</label><Input value={formData.leftQuad || ""} onChange={e => setFormData(p => ({ ...p, leftQuad: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Right Quad (cm)</label><Input value={formData.rightQuad || ""} onChange={e => setFormData(p => ({ ...p, rightQuad: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Left Hamstring (cm)</label><Input value={formData.leftHamstring || ""} onChange={e => setFormData(p => ({ ...p, leftHamstring: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Right Hamstring (cm)</label><Input value={formData.rightHamstring || ""} onChange={e => setFormData(p => ({ ...p, rightHamstring: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Left Calf (cm)</label><Input value={formData.leftCalf || ""} onChange={e => setFormData(p => ({ ...p, leftCalf: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Right Calf (cm)</label><Input value={formData.rightCalf || ""} onChange={e => setFormData(p => ({ ...p, rightCalf: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Left Bicep (cm)</label><Input value={formData.leftBicep || ""} onChange={e => setFormData(p => ({ ...p, leftBicep: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Right Bicep (cm)</label><Input value={formData.rightBicep || ""} onChange={e => setFormData(p => ({ ...p, rightBicep: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Chest (cm)</label><Input value={formData.chest || ""} onChange={e => setFormData(p => ({ ...p, chest: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Waist (cm)</label><Input value={formData.waist || ""} onChange={e => setFormData(p => ({ ...p, waist: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Hip (cm)</label><Input value={formData.hip || ""} onChange={e => setFormData(p => ({ ...p, hip: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                </div>
                <div><label className="text-xs text-muted-foreground block mb-1">Notes</label><Textarea value={formData.notes || ""} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} className="bg-muted border-border text-foreground resize-none h-16" /></div>
              </>
            )}
            {addDialogType === "blood" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground block mb-1">Ferritin (ng/mL)</label><Input value={formData.ferritin || ""} onChange={e => setFormData(p => ({ ...p, ferritin: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">CK — Creatine Kinase (U/L)</label><Input value={formData.creatineKinase || ""} onChange={e => setFormData(p => ({ ...p, creatineKinase: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Hemoglobin (g/dL)</label><Input value={formData.hemoglobin || ""} onChange={e => setFormData(p => ({ ...p, hemoglobin: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Testosterone (ng/dL)</label><Input value={formData.testosterone || ""} onChange={e => setFormData(p => ({ ...p, testosterone: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Cortisol (μg/dL)</label><Input value={formData.cortisol || ""} onChange={e => setFormData(p => ({ ...p, cortisol: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Vitamin D (ng/mL)</label><Input value={formData.vitaminD || ""} onChange={e => setFormData(p => ({ ...p, vitaminD: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Vitamin B12 (pg/mL)</label><Input value={formData.vitaminB12 || ""} onChange={e => setFormData(p => ({ ...p, vitaminB12: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Magnesium (mg/dL)</label><Input value={formData.magnesium || ""} onChange={e => setFormData(p => ({ ...p, magnesium: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                </div>
                <div><label className="text-xs text-muted-foreground block mb-1">Test Date</label><Input type="date" value={formData.testDate || ""} onChange={e => setFormData(p => ({ ...p, testDate: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                <div><label className="text-xs text-muted-foreground block mb-1">Notes</label><Textarea value={formData.notes || ""} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} className="bg-muted border-border text-foreground resize-none h-16" /></div>
              </>
            )}
            {addDialogType === "load" && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-muted-foreground block mb-1">Week Start Date</label><Input type="date" value={formData.weekStart || ""} onChange={e => setFormData(p => ({ ...p, weekStart: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Sessions Count</label><Input type="number" value={formData.sessionsCount || ""} onChange={e => setFormData(p => ({ ...p, sessionsCount: parseInt(e.target.value) }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Total Minutes</label><Input type="number" value={formData.totalMinutes || ""} onChange={e => setFormData(p => ({ ...p, totalMinutes: parseInt(e.target.value) }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">RPE (1–10)</label><Input type="number" min="1" max="10" value={formData.rpe || ""} onChange={e => setFormData(p => ({ ...p, rpe: parseInt(e.target.value) }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Acute Load (7d)</label><Input type="number" value={formData.acuteLoad || ""} onChange={e => setFormData(p => ({ ...p, acuteLoad: parseInt(e.target.value) }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">Chronic Load (28d)</label><Input type="number" value={formData.chronicLoad || ""} onChange={e => setFormData(p => ({ ...p, chronicLoad: parseInt(e.target.value) }))} className="bg-muted border-border text-foreground" /></div>
                  <div><label className="text-xs text-muted-foreground block mb-1">A:C Ratio</label><Input value={formData.acRatio || ""} placeholder="e.g. 1.15" onChange={e => setFormData(p => ({ ...p, acRatio: e.target.value }))} className="bg-muted border-border text-foreground" /></div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Risk Level</label>
                    <Select value={formData.riskLevel || "low"} onValueChange={v => setFormData(p => ({ ...p, riskLevel: v }))}>
                      <SelectTrigger className="bg-muted border-border text-foreground"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-muted border-border">
                        {["low", "moderate", "high", "very_high"].map(r => <SelectItem key={r} value={r} className="text-foreground hover:bg-muted">{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><label className="text-xs text-muted-foreground block mb-1">Notes</label><Textarea value={formData.notes || ""} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} className="bg-muted border-border text-foreground resize-none h-16" /></div>
              </>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => setShowAddDialog(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <Button onClick={handleSave} className="bg-blue-700 hover:bg-blue-600 text-white">
              <Save size={14} className="mr-2" /> Save Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV Import Dialog */}
      <Dialog open={showCsvImport} onOpenChange={setShowCsvImport}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Upload size={16} className="text-green-700 dark:text-green-400" /> Import Medical Data from CSV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted rounded-lg p-3 border border-border">
              <p className="text-xs text-muted-foreground mb-2">Expected CSV columns (any order):</p>
              <div className="flex flex-wrap gap-1">
                {['blood_type','height','weight','bmi','resting_hr','blood_pressure','allergies','chronic_conditions','emergency_contact','notes'].map(col => (
                  <span key={col} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-mono">{col}</span>
                ))}
              </div>
            </div>
            {csvPreview.length > 0 && (
              <div className="overflow-x-auto">
                <p className="text-xs text-muted-foreground mb-2">{csvPreview.length} row(s) detected. Preview:</p>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-muted">
                      {Object.keys(csvPreview[0]).slice(0, 6).map(k => (
                        <th key={k} className="text-left px-2 py-1 text-muted-foreground border border-border">{k}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvPreview.slice(0, 3).map((row, i) => (
                      <tr key={i} className="border-b border-border">
                        {Object.values(row).slice(0, 6).map((v: any, j) => (
                          <td key={j} className="px-2 py-1 text-muted-foreground border border-border">{v || '—'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <DialogFooter>
            <button onClick={() => { setShowCsvImport(false); setCsvPreview([]); }} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <Button onClick={handleCsvImport} disabled={csvImporting} className="bg-green-700 hover:bg-green-600 text-white">
              {csvImporting ? 'Importing...' : `Import ${csvPreview.length} Record(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
