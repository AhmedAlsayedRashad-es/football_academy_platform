import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { AlertTriangle, Plus, Calendar, Activity, Sparkles, Loader2, CheckCircle, RefreshCw, ArrowLeft, Pill, ClipboardList, FileText, ChevronDown, ChevronUp, Stethoscope, X, Printer } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLanguage } from '@/contexts/LanguageContext';

const SEVERITY_COLOR: Record<string, string> = {
  minor: "bg-yellow-100 text-yellow-800",
  moderate: "bg-orange-100 text-orange-800",
  severe: "bg-red-100 text-red-800",
};
const STATUS_COLOR: Record<string, string> = {
  active: "bg-red-100 text-red-800",
  recovering: "bg-blue-100 text-blue-800",
  recovered: "bg-green-100 text-green-800",
  chronic: "bg-purple-100 text-purple-800",
};

export default function InjuryTracking() {
  const [, setLocation] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"active" | "history" | "prescriptions">("active");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("none");
  const [injuryType, setInjuryType] = useState<string>("muscle_strain");
  const [bodyPart, setBodyPart] = useState<string>("");
  const [severity, setSeverity] = useState<string>("moderate");
  const [treatment, setTreatment] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [injuryDate, setInjuryDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedRecoveryDate, setExpectedRecoveryDate] = useState("");
  const [expandedInjury, setExpandedInjury] = useState<number | null>(null);
  const [prescriptionPlayerId, setPrescriptionPlayerId] = useState<string>("1003");
  const [aiRec, setAiRec] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const utils = trpc.useUtils();

  const { data: players } = trpc.players.getAll.useQuery();
  const { data: activeInjuries, isLoading: injuriesLoading } = trpc.injuries.getActive.useQuery();
  const { data: prescriptions, isLoading: prescriptionsLoading } = trpc.injuries.getPrescriptions.useQuery(
    { playerId: parseInt(prescriptionPlayerId) || 1003 },
    { enabled: !!prescriptionPlayerId && prescriptionPlayerId !== "none" }
  );

  const createInjury = trpc.injuries.create.useMutation({
    onSuccess: () => {
      toast.success("Injury recorded successfully");
      utils.injuries.getActive.invalidate();
      setShowAddForm(false);
      resetForm();
    },
    onError: (err) => toast.error("Failed: " + err.message),
  });

  const updateInjury = trpc.injuries.update.useMutation({
    onSuccess: () => { toast.success("Updated"); utils.injuries.getActive.invalidate(); },
    onError: (err) => toast.error("Failed: " + err.message),
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) { setLocation("/"); return null; }

  const resetForm = () => { setSelectedPlayerId("none"); setBodyPart(""); setTreatment(""); setNotes(""); };

  const handleSubmit = () => {
    if (selectedPlayerId === "none" || !bodyPart) { toast.error("Select player and body part"); return; }
    createInjury.mutate({ playerId: parseInt(selectedPlayerId), injuryType, bodyPart, severity: severity as any, injuryDate, expectedRecoveryDate: expectedRecoveryDate || undefined, treatment, notes });
  };

  const generateRecoveryMutation = trpc.injuries.generateRecoveryProtocol.useMutation({
    onSuccess: (data) => {
      setAiRec(data.protocol);
      setIsGenerating(false);
    },
    onError: (err) => {
      toast.error('Failed to generate protocol: ' + err.message);
      setIsGenerating(false);
    }
  });

  const handleGenerateAI = (injury: any) => {
    setIsGenerating(true);
    setAiRec('');
    generateRecoveryMutation.mutate({
      injuryId: injury.id,
      playerId: injury.playerId,
      injuryType: injury.injuryType || 'injury',
      bodyPart: injury.bodyPart,
      severity: injury.severity,
    });
  };

  const allInjuries = activeInjuries || [];
  const activeOnly = allInjuries.filter((i: any) => i.status === "active" || i.status === "recovering");
  const historyInjuries = allInjuries.filter((i: any) => i.status === "recovered" || i.status === "chronic");

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/medical-status")}><ArrowLeft className="h-4 w-4" /></Button>
            <div>
              <h1 className="text-2xl font-bold">{t("medical.injuryTracking")}</h1>
              <p className="text-sm text-muted-foreground">Monitor injuries, prescriptions, and recovery protocols</p>
            </div>
          </div>
          <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="h-4 w-4 mr-2" /> Record Injury
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-red-600">{activeOnly.length}</p><p className="text-xs text-muted-foreground">{t("medical.activeInjuries")}</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-blue-600">{allInjuries.filter((i: any) => i.status === "recovering").length}</p><p className="text-xs text-muted-foreground">In Recovery</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-600">{historyInjuries.length}</p><p className="text-xs text-muted-foreground">Recovered</p></CardContent></Card>
          <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-orange-600">{allInjuries.filter((i: any) => i.severity === "severe").length}</p><p className="text-xs text-muted-foreground">Severe Cases</p></CardContent></Card>
        </div>

        {showAddForm && (
          <Card className="border-red-200">
            <CardHeader><CardTitle className="text-red-700 flex items-center gap-2"><AlertTriangle className="h-5 w-5" />Record New Injury</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Player *</Label>
                  <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
                    <SelectTrigger><SelectValue placeholder="Select player" /></SelectTrigger>
                    <SelectContent>{(players||[]).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Body Part *</Label><Input value={bodyPart} onChange={e => setBodyPart(e.target.value)} placeholder="e.g. Left Hamstring" /></div>
                <div><Label>{t("medical.injuryType")}</Label>
                  <Select value={injuryType} onValueChange={setInjuryType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{["muscle_strain","sprain","fracture","contusion","tendinitis","concussion","overuse","other"].map(t => <SelectItem key={t} value={t}>{t.replace(/_/g," ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>{t("medical.severity")}</Label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="minor">Minor</SelectItem><SelectItem value="moderate">Moderate</SelectItem><SelectItem value="severe">Severe</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Injury Date</Label><Input type="date" value={injuryDate} onChange={e => setInjuryDate(e.target.value)} /></div>
                <div><Label>Expected Recovery</Label><Input type="date" value={expectedRecoveryDate} onChange={e => setExpectedRecoveryDate(e.target.value)} /></div>
              </div>
              <div><Label>Treatment Plan</Label><Textarea value={treatment} onChange={e => setTreatment(e.target.value)} rows={2} /></div>
              <div><Label>Notes</Label><Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} /></div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} disabled={createInjury.isPending} className="bg-red-600 hover:bg-red-700 text-white">
                  {createInjury.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Save
                </Button>
                <Button variant="outline" onClick={() => { setShowAddForm(false); resetForm(); }}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-1 border-b">
          {[{id:"active",label:"Active & Recovering",icon:AlertTriangle},{id:"history",label:"Injury History",icon:ClipboardList},{id:"prescriptions",label:"Prescriptions & Medicines",icon:Pill}].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={"flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors " + (activeTab === tab.id ? "border-red-500 text-red-600" : "border-transparent text-muted-foreground hover:text-gray-700")}>
              <tab.icon className="h-4 w-4" />{tab.label}
            </button>
          ))}
        </div>

        {activeTab === "active" && (
          <div className="space-y-4">
            {injuriesLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-red-500" /></div>
              : activeOnly.length === 0 ? <Card><CardContent className="p-8 text-center"><CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-700 dark:text-green-400" /><p>{t("medical.noActiveInjuries")}</p></CardContent></Card>
              : activeOnly.map((injury: any) => <InjuryCard key={injury.id} injury={injury} expanded={expandedInjury===injury.id} onToggle={() => setExpandedInjury(expandedInjury===injury.id?null:injury.id)} onUpdate={(id:number,data:any) => updateInjury.mutate({id,...data})} onGenerateAI={() => handleGenerateAI(injury)} aiRec={expandedInjury===injury.id?aiRec:""} isGenerating={isGenerating&&expandedInjury===injury.id} />)}
          </div>
        )}
        {activeTab === "history" && (
          <div className="space-y-4">
            {historyInjuries.length === 0 ? <Card><CardContent className="p-8 text-center"><Activity className="h-12 w-12 mx-auto mb-3 text-muted-foreground" /><p>No history records</p></CardContent></Card>
              : historyInjuries.map((injury: any) => <InjuryCard key={injury.id} injury={injury} expanded={expandedInjury===injury.id} onToggle={() => setExpandedInjury(expandedInjury===injury.id?null:injury.id)} onUpdate={(id:number,data:any) => updateInjury.mutate({id,...data})} onGenerateAI={() => handleGenerateAI(injury)} aiRec={expandedInjury===injury.id?aiRec:""} isGenerating={isGenerating&&expandedInjury===injury.id} />)}
          </div>
        )}
        {activeTab === "prescriptions" && (
          <div className="space-y-4">
            <Card><CardContent className="p-4 flex items-center gap-3">
              <Label className="whitespace-nowrap">Select Player:</Label>
              <Select value={prescriptionPlayerId} onValueChange={setPrescriptionPlayerId}>
                <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                <SelectContent>{(players||[]).map((p: any) => <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>)}</SelectContent>
              </Select>
            </CardContent></Card>
            {prescriptionsLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
              : !prescriptions||prescriptions.length===0 ? <Card><CardContent className="p-8 text-center"><Pill className="h-12 w-12 mx-auto mb-3 text-muted-foreground" /><p>No prescriptions found</p></CardContent></Card>
              : prescriptions.map((rx: any) => <PrescriptionCard key={rx.id} prescription={rx} />)}
          </div>
        )}
      </div>
    </>
  );
}

function InjuryCard({ injury, expanded, onToggle, onUpdate, onGenerateAI, aiRec, isGenerating }: any) {
  const { t, language } = useLanguage();
  const [newStatus, setNewStatus] = useState(injury.status);
  const daysLeft = injury.expectedRecoveryDate ? Math.ceil((new Date(injury.expectedRecoveryDate).getTime()-Date.now())/86400000) : null;
  return (
    <Card className={"border-l-4 " + (injury.status==="active"?"border-l-red-500":injury.status==="recovering"?"border-l-blue-500":"border-l-green-500")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold">{injury.playerName||"Player #"+injury.playerId}</span>
              <Badge className={SEVERITY_COLOR[injury.severity]||"bg-gray-100"}>{injury.severity}</Badge>
              <Badge className={STATUS_COLOR[injury.status]||"bg-gray-100"}>{injury.status}</Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1"><strong>{injury.bodyPart}</strong> — {(injury.injuryType||"").replace(/_/g," ")}</p>
            <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
              <span>Injured: {injury.injuryDate?new Date(injury.injuryDate).toLocaleDateString():"N/A"}</span>
              {daysLeft!==null && <span className={"font-medium "+(daysLeft<=0?"text-green-600":daysLeft<=7?"text-orange-600":"text-blue-600")}>{daysLeft<=0?"Return date passed":daysLeft+" days to return"}</span>}
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>{expanded?<ChevronUp className="h-4 w-4"/>:<ChevronDown className="h-4 w-4"/>}</Button>
        </div>
        {expanded && (
          <div className="mt-4 space-y-3 border-t pt-4">
            {injury.treatment && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{t("medical.treatment")}</p><p className="text-sm bg-blue-50 p-3 rounded">{injury.treatment}</p></div>}
            {injury.notes && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Notes</p><p className="text-sm text-gray-600">{injury.notes}</p></div>}
            {(injury.status==="active"||injury.status==="recovering") && (
              <div className="flex items-center gap-2">
                <Label className="text-xs">Update Status:</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="recovering">Recovering</SelectItem><SelectItem value="recovered">Recovered</SelectItem><SelectItem value="chronic">Chronic</SelectItem></SelectContent>
                </Select>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => onUpdate(injury.id,{status:newStatus,returnToPlayCleared:newStatus==="recovered"})}>
                  <RefreshCw className="h-3 w-3 mr-1"/>Update
                </Button>
              </div>
            )}
            <div>
              <Button size="sm" variant="outline" onClick={onGenerateAI} disabled={isGenerating} className="border-purple-300 text-purple-700 hover:bg-purple-50">
                {isGenerating?<Loader2 className="h-3 w-3 animate-spin mr-2"/>:<Sparkles className="h-3 w-3 mr-2"/>}Generate AI Recovery Protocol
              </Button>
              {aiRec && <div className="mt-3 bg-purple-50 border border-purple-200 rounded p-3"><p className="text-xs font-semibold text-purple-700 mb-2">AI Recovery Protocol</p><div className="text-xs text-gray-700 whitespace-pre-line">{aiRec}</div></div>}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PrescriptionCard({ prescription: rx }: { prescription: any }) {
  const { t, language } = useLanguage();
  const [expanded, setExpanded] = useState(true);

  const handlePrintPrescription = () => {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 20;
      let y = 20;

      // Header
      doc.setFillColor(30, 64, 175);
      doc.rect(0, 0, pageW, 35, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Football Academy', margin, 15);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Medical Department — Official Prescription', margin, 22);
      doc.text('FIFA/UEFA PCMA Protocol Compliant', margin, 28);
      y = 45;

      // Prescription info box
      doc.setDrawColor(200, 200, 200);
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, y, pageW - margin * 2, 28, 3, 3, 'FD');
      doc.setTextColor(30, 30, 30);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PRESCRIPTION', margin + 4, y + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Prescribing Physician: Dr. ${rx.prescribedBy || 'Team Doctor'}`, margin + 4, y + 15);
      doc.text(`Date: ${new Date(rx.prescriptionDate).toLocaleDateString('en-GB')}`, margin + 4, y + 21);
      if (rx.followUpDate) {
        doc.text(`Follow-up: ${new Date(rx.followUpDate).toLocaleDateString('en-GB')}`, pageW / 2, y + 21);
      }
      doc.text(`Status: ${(rx.status || '').toUpperCase()}`, pageW - margin - 30, y + 8);
      y += 35;

      // Diagnosis
      if (rx.diagnosis) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('DIAGNOSIS', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(9);
        const diagLines = doc.splitTextToSize(rx.diagnosis, pageW - margin * 2);
        doc.text(diagLines, margin, y);
        y += diagLines.length * 5 + 6;
      }

      // Medications
      if (rx.medications && rx.medications.length > 0) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('PRESCRIBED MEDICATIONS', margin, y);
        y += 6;
        rx.medications.forEach((med: any, idx: number) => {
          doc.setFillColor(239, 246, 255);
          doc.roundedRect(margin, y, pageW - margin * 2, 22, 2, 2, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 30, 30);
          doc.setFontSize(10);
          doc.text(`${idx + 1}. ${med.name}`, margin + 3, y + 7);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(80, 80, 80);
          doc.text(`Dose: ${med.dose}   Frequency: ${med.frequency}   Duration: ${med.duration}   Route: ${med.route || 'Oral'}`, margin + 3, y + 13);
          if (med.notes) {
            doc.setTextColor(180, 80, 0);
            doc.text(`Note: ${med.notes}`, margin + 3, y + 19);
          }
          y += 26;
        });
      }

      // Physiotherapy
      if (rx.physiotherapy) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('PHYSIOTHERAPY PROTOCOL', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(9);
        const physioLines = doc.splitTextToSize(rx.physiotherapy, pageW - margin * 2);
        doc.text(physioLines, margin, y);
        y += physioLines.length * 5 + 6;
      }

      // Restrictions
      if (rx.restrictions) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(185, 28, 28);
        doc.text('RESTRICTIONS', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 20, 20);
        doc.setFontSize(9);
        const restLines = doc.splitTextToSize(rx.restrictions, pageW - margin * 2);
        doc.text(restLines, margin, y);
        y += restLines.length * 5 + 6;
      }

      // Footer
      const footerY = doc.internal.pageSize.getHeight() - 20;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, footerY - 5, pageW - margin, footerY - 5);
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'italic');
      doc.text('This prescription is issued by the Football Academy Medical Department. Valid with physician signature and stamp.', margin, footerY);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - margin - 60, footerY);

      // Signature line
      doc.setDrawColor(100, 100, 100);
      doc.line(pageW - margin - 50, footerY - 15, pageW - margin, footerY - 15);
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      doc.setFont('helvetica', 'normal');
      doc.text('Physician Signature & Stamp', pageW - margin - 50, footerY - 10);

      doc.save(`prescription_${rx.prescribedBy?.replace(/\s+/g,'_') || 'doctor'}_${new Date(rx.prescriptionDate).toISOString().split('T')[0]}.pdf`);
    });
  };

  return (
    <Card className={"border-l-4 "+(rx.status==="active"?"border-l-blue-500":rx.status==="completed"?"border-l-green-500":"border-l-gray-400")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Stethoscope className="h-4 w-4 text-blue-600"/>
              <span className="font-semibold">{rx.bodyPart?""+rx.bodyPart+" — "+(rx.injuryType||"").replace(/_/g," "):"Medical Prescription"}</span>
              <Badge className={rx.status==="active"?"bg-blue-100 text-blue-800":rx.status==="completed"?"bg-green-100 text-green-800":"bg-gray-100"}>{rx.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Dr. <strong>{rx.prescribedBy}</strong> · {new Date(rx.prescriptionDate).toLocaleDateString()}{rx.followUpDate&&" · Follow-up: "+new Date(rx.followUpDate).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={handlePrintPrescription} className="border-blue-300 text-blue-700 hover:bg-blue-50 text-xs h-8">
              <Printer className="h-3 w-3 mr-1" />Print PDF
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>{expanded?<ChevronUp className="h-4 w-4"/>:<ChevronDown className="h-4 w-4"/>}</Button>
          </div>
        </div>
        {expanded && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {rx.diagnosis && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1"><FileText className="h-3 w-3"/>Diagnosis</p><p className="text-sm bg-yellow-50 border border-yellow-200 p-3 rounded">{rx.diagnosis}</p></div>}
            {rx.medications&&rx.medications.length>0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2 flex items-center gap-1"><Pill className="h-3 w-3"/>Prescribed Medications</p>
                <div className="space-y-2">
                  {rx.medications.map((med: any,idx: number) => (
                    <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-3">
                      <div className="flex items-center justify-between"><span className="font-semibold text-blue-800 text-sm">{med.name}</span><Badge className="bg-blue-100 text-blue-700 text-xs">{med.route||"Oral"}</Badge></div>
                      <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-gray-600">
                        <div><span className="font-medium">Dose:</span> {med.dose}</div>
                        <div><span className="font-medium">Frequency:</span> {med.frequency}</div>
                        <div><span className="font-medium">Duration:</span> {med.duration}</div>
                      </div>
                      {med.notes && <p className="text-xs text-orange-700 mt-1 italic">⚠ {med.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {rx.physiotherapy && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1 flex items-center gap-1"><Activity className="h-3 w-3"/>{t("medical.physiotherapy")}</p><p className="text-sm bg-green-50 border border-green-200 p-3 rounded whitespace-pre-line">{rx.physiotherapy}</p></div>}
            {rx.restrictions && <div><p className="text-xs font-semibold text-red-500 uppercase mb-1 flex items-center gap-1"><X className="h-3 w-3"/>Restrictions</p><p className="text-sm text-red-700 bg-red-50 border border-red-200 p-3 rounded">{rx.restrictions}</p></div>}
            {rx.notes && <div><p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{t("medical.doctorNotes")}</p><p className="text-sm text-gray-600 italic">{rx.notes}</p></div>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
