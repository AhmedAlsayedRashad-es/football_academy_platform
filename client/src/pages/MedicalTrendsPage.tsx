import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Activity, FlaskConical, Scale, TrendingUp, TrendingDown, Minus, Upload, CheckCircle, AlertCircle, Loader2, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";

// Known blood markers with display metadata
const BLOOD_MARKER_META: Record<string, { label: string; unit: string; normalMin: number; normalMax: number; color: string }> = {
  "Hemoglobin":      { label: "Hemoglobin",      unit: "g/dL",   normalMin: 13.5, normalMax: 17.5, color: "#f472b6" },
  "Ferritin":        { label: "Ferritin",         unit: "ng/mL",  normalMin: 20,   normalMax: 300,  color: "#fb923c" },
  "Vitamin D":       { label: "Vitamin D",        unit: "ng/mL",  normalMin: 30,   normalMax: 100,  color: "#facc15" },
  "Vitamin B12":     { label: "Vitamin B12",      unit: "pg/mL",  normalMin: 200,  normalMax: 900,  color: "#34d399" },
  "Creatine Kinase": { label: "Creatine Kinase",  unit: "U/L",    normalMin: 55,   normalMax: 400,  color: "#f87171" },
  "Testosterone":    { label: "Testosterone",     unit: "ng/dL",  normalMin: 300,  normalMax: 1000, color: "#a78bfa" },
  "Cortisol":        { label: "Cortisol",         unit: "μg/dL",  normalMin: 6,    normalMax: 23,   color: "#60a5fa" },
  "Magnesium":       { label: "Magnesium",        unit: "mg/dL",  normalMin: 1.7,  normalMax: 2.2,  color: "#4ade80" },
  "Glucose":         { label: "Glucose",          unit: "mg/dL",  normalMin: 70,   normalMax: 100,  color: "#fbbf24" },
  "Iron":            { label: "Iron",             unit: "μg/dL",  normalMin: 60,   normalMax: 170,  color: "#e879f9" },
};

const INBODY_METRICS = [
  { key: "bodyFatPercent",     label: "Body Fat %",      unit: "%",   normalMin: 6,    normalMax: 18,   color: "#f87171" },
  { key: "skeletalMuscleMass", label: "Skeletal Muscle", unit: "kg",  normalMin: 30,   normalMax: 45,   color: "#34d399" },
  { key: "bmi",                label: "BMI",             unit: "",    normalMin: 18.5, normalMax: 24.9, color: "#60a5fa" },
  { key: "weight",             label: "Weight",          unit: "kg",  normalMin: 60,   normalMax: 90,   color: "#a78bfa" },
  { key: "inBodyScore",        label: "InBody Score",    unit: "",    normalMin: 70,   normalMax: 100,  color: "#facc15" },
];

function TrendIndicator({ values }: { values: number[] }) {
  if (values.length < 2) return <Minus className="h-4 w-4 text-muted-foreground" />;
  const diff = values[values.length - 1] - values[0];
  if (Math.abs(diff) < 0.01) return <Minus className="h-4 w-4 text-muted-foreground" />;
  if (diff > 0) return <TrendingUp className="h-4 w-4 text-green-700 dark:text-green-400" />;
  return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
}

function StatusBadge({ value, min, max }: { value: number; min: number; max: number }) {
  if (value < min) return <Badge className="bg-blue-900/40 text-blue-600 dark:text-blue-300 border-blue-700/40 text-xs">Low</Badge>;
  if (value > max) return <Badge className="bg-red-900/40 text-red-600 dark:text-red-300 border-red-700/40 text-xs">High</Badge>;
  return <Badge className="bg-green-900/40 text-green-700 dark:text-green-300 border-green-700/40 text-xs">Normal</Badge>;
}

// Pivot normalized rows [{markerName, value, testDate, ...}] into chart-friendly format:
// [{date: "01 Jan", "Hemoglobin": 15.2, "Ferritin": 68, ...}, ...]
function pivotBloodData(rows: any[]): { chartData: any[]; markerNames: string[] } {
  const dateMap: Record<string, Record<string, number>> = {};
  const markerSet = new Set<string>();
  for (const row of rows) {
    const dateStr = row.testDate
      ? new Date(row.testDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
      : "—";
    if (!dateMap[dateStr]) dateMap[dateStr] = {};
    dateMap[dateStr][row.markerName] = parseFloat(row.value);
    markerSet.add(row.markerName);
  }
  const chartData = Object.entries(dateMap).map(([date, vals]) => ({ date, ...vals }));
  return { chartData, markerNames: Array.from(markerSet) };
}

export default function MedicalTrendsPage() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [activeTab, setActiveTab] = useState("blood");
  const [selectedBloodMarker, setSelectedBloodMarker] = useState<string>("Hemoglobin");
  const { toast } = useToast();

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string>("");
  const [extractedMarkers, setExtractedMarkers] = useState<any[]>([]);
  const [uploadLab, setUploadLab] = useState("");
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const extractMutation = trpc.medical.extractBloodMarkersFromFile.useMutation();
  const utils = trpc.useUtils();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setExtractedMarkers([]);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setUploadPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setUploadPreview('');
    }
  };

  const handleExtract = async () => {
    if (!uploadFile || !selectedPlayer) return;
    setIsExtracting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        const result = await extractMutation.mutateAsync({
          playerId: parseInt(selectedPlayer),
          fileBase64: base64,
          mimeType: uploadFile.type,
          saveToDb: false,
        });
        setExtractedMarkers(result.markers);
        toast({ title: `Extracted ${result.count} markers`, description: 'Review and save to database' });
      };
      reader.readAsDataURL(uploadFile);
    } catch (err: any) {
      toast({ title: 'Extraction failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSaveMarkers = async () => {
    if (!uploadFile || !selectedPlayer || extractedMarkers.length === 0) return;
    setIsSaving(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(',')[1];
        await extractMutation.mutateAsync({
          playerId: parseInt(selectedPlayer),
          fileBase64: base64,
          mimeType: uploadFile.type,
          saveToDb: true,
          testDate: uploadDate,
          lab: uploadLab || 'Uploaded Report',
        });
        toast({ title: 'Saved successfully', description: `${extractedMarkers.length} markers saved to database` });
        utils.medical.getBloodMarkersRaw.invalidate({ playerId: parseInt(selectedPlayer) });
        setExtractedMarkers([]);
        setUploadFile(null);
        setUploadPreview('');
      };
      reader.readAsDataURL(uploadFile);
    } catch (err: any) {
      toast({ title: 'Save failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const { data: players } = trpc.players.getAll.useQuery();
  const playerId = parseInt(selectedPlayer) || 0;

  const { data: bloodMarkersRaw, isLoading: bloodLoading } = trpc.medical.getBloodMarkersRaw.useQuery(
    { playerId },
    { enabled: !!playerId }
  );
  const { data: inBodyRaw, isLoading: inBodyLoading } = trpc.medical.getInBodyData.useQuery(
    { playerId },
    { enabled: !!playerId }
  );

  // Pivot blood markers data
  const { chartData: bloodChartData, markerNames: availableMarkers } = bloodMarkersRaw
    ? pivotBloodData(bloodMarkersRaw as any[])
    : { chartData: [], markerNames: [] };

  // Format InBody data for chart
  const inBodyData = Array.isArray(inBodyRaw)
    ? (inBodyRaw as any[]).map((b: any) => ({
        date: b.testDate
          ? new Date(b.testDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" })
          : "—",
        bodyFatPercent: parseFloat(b.bodyFatPercent) || null,
        skeletalMuscleMass: parseFloat(b.skeletalMuscleMass) || null,
        bmi: parseFloat(b.bmi) || null,
        weight: parseFloat(b.weight) || null,
        inBodyScore: parseFloat(b.inBodyScore) || null,
      }))
    : [];

  // Latest values
  const latestBloodByMarker: Record<string, any> = {};
  if (bloodMarkersRaw) {
    for (const row of (bloodMarkersRaw as any[])) {
      if (!latestBloodByMarker[row.markerName] || new Date(row.testDate) > new Date(latestBloodByMarker[row.markerName].testDate)) {
        latestBloodByMarker[row.markerName] = row;
      }
    }
  }
  const latestInBody = inBodyData[inBodyData.length - 1];
  const selectedPlayerData = players?.find((p: any) => p.id.toString() === selectedPlayer);

  const markerMeta = BLOOD_MARKER_META[selectedBloodMarker];
  const markerValues = bloodChartData.map((d: any) => d[selectedBloodMarker]).filter((v: any) => v != null) as number[];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/medical-status-dashboard")}
            className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Activity className="h-6 w-6 text-pink-600 dark:text-pink-400" />
              Medical Trends Dashboard
            </h1>
            <p className="text-sm text-muted-foreground">Blood marker & InBody composition trends over time</p>
          </div>
        </div>

        {/* Player Selector */}
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">Select Player</label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue placeholder="Choose a player to view trends..." />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    {players?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()} className="text-foreground hover:bg-muted">
                        {p.firstName} {p.lastName} — {p.position || "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedPlayerData && (
                <div className="text-right">
                  <p className="text-foreground font-semibold">{selectedPlayerData.firstName} {selectedPlayerData.lastName}</p>
                  <p className="text-sm text-muted-foreground">{selectedPlayerData.position || "No position"} · #{selectedPlayerData.jerseyNumber || "—"}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {!selectedPlayer ? (
          <div className="text-center py-20 text-muted-foreground">
            <Activity className="h-16 w-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg">Select a player to view medical trends</p>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-card border border-border">
              <TabsTrigger value="blood" className="data-[state=active]:bg-pink-900/40 data-[state=active]:text-pink-600 dark:data-[state=active]:text-pink-300 text-muted-foreground">
                <FlaskConical className="h-4 w-4 mr-2" />
                Blood Markers
              </TabsTrigger>
              <TabsTrigger value="inbody" className="data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-300 text-muted-foreground">
                <Scale className="h-4 w-4 mr-2" />
                InBody Composition
              </TabsTrigger>
              <TabsTrigger value="upload" className="data-[state=active]:bg-yellow-900/40 data-[state=active]:text-yellow-700 dark:data-[state=active]:text-yellow-300 text-muted-foreground">
                <Upload className="h-4 w-4 mr-2" />
                Upload Report
              </TabsTrigger>
            </TabsList>

            {/* ==================== BLOOD MARKERS TAB ==================== */}
            <TabsContent value="blood" className="space-y-4 mt-4">
              {bloodLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading blood markers...</div>
              ) : bloodChartData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FlaskConical className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No blood marker data available for this player</p>
                </div>
              ) : (
                <>
                  {/* Latest Values Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {Object.entries(latestBloodByMarker).map(([name, row]: [string, any]) => {
                      const meta = BLOOD_MARKER_META[name];
                      const val = parseFloat(row.value);
                      const min = meta?.normalMin ?? parseFloat(row.normalMin) ?? 0;
                      const max = meta?.normalMax ?? parseFloat(row.normalMax) ?? 999;
                      return (
                        <Card
                          key={name}
                          className={`bg-card border-border cursor-pointer transition-all ${selectedBloodMarker === name ? 'ring-2 ring-pink-500' : ''}`}
                          onClick={() => setSelectedBloodMarker(name)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-xs text-muted-foreground truncate">{name}</p>
                              <TrendIndicator values={bloodChartData.map((d: any) => d[name]).filter((v: any) => v != null)} />
                            </div>
                            <p className="text-xl font-bold text-foreground">{val.toFixed(1)}</p>
                            <p className="text-xs text-muted-foreground">{row.unit}</p>
                            <div className="mt-1">
                              <StatusBadge value={val} min={min} max={max} />
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Marker Selector */}
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-muted-foreground">View trend for:</label>
                    <Select value={selectedBloodMarker} onValueChange={setSelectedBloodMarker}>
                      <SelectTrigger className="w-48 bg-muted border-border text-foreground">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-muted border-border">
                        {availableMarkers.map((name) => (
                          <SelectItem key={name} value={name} className="text-foreground hover:bg-muted">{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Single Marker Trend Chart */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground text-base flex items-center gap-2">
                        <span style={{ color: markerMeta?.color || "#f472b6" }}>●</span>
                        {selectedBloodMarker} Trend
                        {markerMeta && (
                          <span className="text-xs text-muted-foreground font-normal ml-2">
                            Normal: {markerMeta.normalMin}–{markerMeta.normalMax} {markerMeta.unit}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={bloodChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="markerGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={markerMeta?.color || "#f472b6"} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={markerMeta?.color || "#f472b6"} stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                              labelStyle={{ color: "#f9fafb" }}
                              itemStyle={{ color: markerMeta?.color || "#f472b6" }}
                            />
                            {markerMeta && (
                              <>
                                <ReferenceLine y={markerMeta.normalMin} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Min", fill: "#22c55e", fontSize: 10 }} />
                                <ReferenceLine y={markerMeta.normalMax} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Max", fill: "#ef4444", fontSize: 10 }} />
                              </>
                            )}
                            <Area
                              type="monotone"
                              dataKey={selectedBloodMarker}
                              stroke={markerMeta?.color || "#f472b6"}
                              strokeWidth={2.5}
                              fill="url(#markerGrad)"
                              dot={{ fill: markerMeta?.color || "#f472b6", r: 4 }}
                              activeDot={{ r: 6 }}
                              connectNulls
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* All Markers Overview Chart */}
                  {availableMarkers.length > 1 && (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground text-base">All Markers Overview</CardTitle>
                        <CardDescription className="text-muted-foreground">Normalized comparison (values scaled to %, relative to normal range)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div style={{ height: 280 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart
                              data={bloodChartData.map((d: any) => {
                                const normalized: any = { date: d.date };
                                for (const name of availableMarkers) {
                                  const meta = BLOOD_MARKER_META[name];
                                  if (meta && d[name] != null) {
                                    const range = meta.normalMax - meta.normalMin;
                                    normalized[name] = range > 0 ? Math.round(((d[name] - meta.normalMin) / range) * 100) : 50;
                                  }
                                }
                                return normalized;
                              })}
                              margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} domain={[-20, 120]} unit="%" />
                              <Tooltip
                                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                                labelStyle={{ color: "#f9fafb" }}
                              />
                              <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 11 }} />
                              <ReferenceLine y={0} stroke="#3b82f6" strokeDasharray="4 4" label={{ value: "Min", fill: "#3b82f6", fontSize: 10 }} />
                              <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Max", fill: "#ef4444", fontSize: 10 }} />
                              {availableMarkers.map((name) => (
                                <Line
                                  key={name}
                                  type="monotone"
                                  dataKey={name}
                                  stroke={BLOOD_MARKER_META[name]?.color || "#888"}
                                  strokeWidth={1.5}
                                  dot={false}
                                  connectNulls
                                />
                              ))}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>

            {/* ==================== INBODY TAB ==================== */}
            <TabsContent value="inbody" className="space-y-4 mt-4">
              {inBodyLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading InBody data...</div>
              ) : inBodyData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Scale className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No InBody data available for this player</p>
                </div>
              ) : (
                <>
                  {/* Latest InBody Summary */}
                  {latestInBody && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {INBODY_METRICS.map((m) => {
                        const val = latestInBody[m.key as keyof typeof latestInBody];
                        if (val == null) return null;
                        const allVals = inBodyData.map((d: any) => d[m.key]).filter((v: any) => v != null);
                        return (
                          <Card key={m.key} className="bg-card border-border">
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-muted-foreground truncate">{m.label}</p>
                                <TrendIndicator values={allVals} />
                              </div>
                              <p className="text-xl font-bold text-foreground">{parseFloat(String(val)).toFixed(1)}</p>
                              {m.unit && <p className="text-xs text-muted-foreground">{m.unit}</p>}
                              <div className="mt-1">
                                <StatusBadge value={parseFloat(String(val))} min={m.normalMin} max={m.normalMax} />
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}

                  {/* Body Composition Chart */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground text-base">Body Composition Over Time</CardTitle>
                      <CardDescription className="text-muted-foreground">Fat %, Muscle Mass, and BMI trends</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={inBodyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                              labelStyle={{ color: "#f9fafb" }}
                            />
                            <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 11 }} />
                            <Line type="monotone" dataKey="bodyFatPercent" name="Body Fat %" stroke="#f87171" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                            <Line type="monotone" dataKey="bmi" name="BMI" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Muscle Mass & Weight Chart */}
                  <Card className="bg-card border-border">
                    <CardHeader>
                      <CardTitle className="text-foreground text-base">Muscle Mass & Weight</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div style={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={inBodyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="muscleGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                              </linearGradient>
                              <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                            <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                              labelStyle={{ color: "#f9fafb" }}
                            />
                            <Legend wrapperStyle={{ color: "#9ca3af", fontSize: 11 }} />
                            <Area type="monotone" dataKey="skeletalMuscleMass" name="Skeletal Muscle (kg)" stroke="#34d399" fill="url(#muscleGrad)" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                            <Area type="monotone" dataKey="weight" name="Weight (kg)" stroke="#a78bfa" fill="url(#weightGrad)" strokeWidth={2} dot={{ r: 4 }} connectNulls />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* InBody Score Chart */}
                  {inBodyData.some((d: any) => d.inBodyScore != null) && (
                    <Card className="bg-card border-border">
                      <CardHeader>
                        <CardTitle className="text-foreground text-base">InBody Score Trend</CardTitle>
                        <CardDescription className="text-muted-foreground">Overall body composition score (70–100 is ideal)</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div style={{ height: 220 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={inBodyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#facc15" stopOpacity={0.02} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                              <XAxis dataKey="date" tick={{ fill: "#9ca3af", fontSize: 11 }} />
                              <YAxis domain={[50, 100]} tick={{ fill: "#9ca3af", fontSize: 11 }} />
                              <Tooltip
                                contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151", borderRadius: "8px" }}
                                labelStyle={{ color: "#f9fafb" }}
                              />
                              <ReferenceLine y={70} stroke="#22c55e" strokeDasharray="4 4" label={{ value: "Target 70", fill: "#22c55e", fontSize: 10 }} />
                              <Area type="monotone" dataKey="inBodyScore" name="InBody Score" stroke="#facc15" fill="url(#scoreGrad)" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
            {/* ==================== UPLOAD TAB ==================== */}
            <TabsContent value="upload" className="space-y-4 mt-4">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground text-base flex items-center gap-2">
                    <Upload className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                    Upload Blood Test or InBody Report
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Upload a PDF or photo of a blood test result or InBody scan. AI will automatically extract all markers.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Drop Zone */}
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-yellow-500/60 hover:bg-yellow-900/10 transition-all">
                    <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleFileSelect} />
                    {uploadFile ? (
                      <div className="text-center">
                        {uploadPreview ? (
                          <img src={uploadPreview} alt="preview" className="h-24 mx-auto object-contain rounded mb-2" />
                        ) : (
                          <FlaskConical className="h-10 w-10 text-yellow-700 dark:text-yellow-400 mx-auto mb-2" />
                        )}
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">{uploadFile.name}</p>
                        <p className="text-xs text-muted-foreground">{(uploadFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="h-10 w-10 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                        <p className="text-xs text-gray-600 mt-1">Supports: JPG, PNG, WEBP, PDF</p>
                      </div>
                    )}
                  </label>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Test Date</label>
                      <Input
                        type="date"
                        value={uploadDate}
                        onChange={(e) => setUploadDate(e.target.value)}
                        className="bg-muted border-border text-foreground text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Laboratory Name (optional)</label>
                      <Input
                        placeholder="e.g. Central Health Lab"
                        value={uploadLab}
                        onChange={(e) => setUploadLab(e.target.value)}
                        className="bg-muted border-border text-foreground text-sm"
                      />
                    </div>
                  </div>

                  {/* Extract Button */}
                  <Button
                    onClick={handleExtract}
                    disabled={!uploadFile || !selectedPlayer || isExtracting}
                    className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-semibold"
                  >
                    {isExtracting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extracting markers with AI...</>
                    ) : (
                      <><FlaskConical className="h-4 w-4 mr-2" /> Extract Markers from File</>
                    )}
                  </Button>

                  {/* Extracted Results */}
                  {extractedMarkers.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-foreground font-semibold flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-400" />
                          {extractedMarkers.length} Markers Extracted
                        </h3>
                        <Button
                          onClick={handleSaveMarkers}
                          disabled={isSaving}
                          size="sm"
                          className="bg-green-700 hover:bg-green-600 text-white"
                        >
                          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                          Save All to Database
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-80 overflow-y-auto">
                        {extractedMarkers.map((m, i) => (
                          <div key={i} className={`p-3 rounded-lg border text-sm ${
                            m.status === 'high' ? 'bg-red-900/20 border-red-700/40' :
                            m.status === 'low' ? 'bg-blue-900/20 border-blue-700/40' :
                            m.status === 'critical' ? 'bg-orange-900/20 border-orange-700/40' :
                            'bg-muted border-border'
                          }`}>
                            <p className="text-muted-foreground text-xs truncate">{m.markerName}</p>
                            <p className="text-foreground font-bold">{m.value} <span className="text-muted-foreground text-xs font-normal">{m.unit}</span></p>
                            <div className="flex items-center gap-1 mt-1">
                              {m.status === 'normal' && <CheckCircle className="h-3 w-3 text-green-700 dark:text-green-400" />}
                              {(m.status === 'low' || m.status === 'high') && <AlertCircle className="h-3 w-3 text-yellow-700 dark:text-yellow-400" />}
                              {m.status === 'critical' && <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />}
                              <span className={`text-xs capitalize ${
                                m.status === 'normal' ? 'text-green-700 dark:text-green-400' :
                                m.status === 'critical' ? 'text-red-600 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'
                              }`}>{m.status}</span>
                            </div>
                            {m.normalMin != null && m.normalMax != null && (
                              <p className="text-gray-600 text-xs mt-0.5">Ref: {m.normalMin}–{m.normalMax}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

          </Tabs>
        )}
      </div>
    </>
  );
}
