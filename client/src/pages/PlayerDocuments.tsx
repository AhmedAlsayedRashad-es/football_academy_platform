import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Upload, CheckCircle, AlertCircle, Clock,
  User, Shield, Baby, CreditCard, Eye, Download, ArrowLeft,
  Heart, Phone, Users
} from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useLanguage } from '@/contexts/LanguageContext';

// Sample players with their ages, document status, blood type, and parent info
type PlayerDocument = {
  status: string;
  filename: string | null;
  uploadDate: string | null;
  verifiedBy: string | null;
};

type PlayerDocumentRow = {
  id: string;
  name: string;
  nameAr: string;
  dob: string;
  age: number;
  team: string;
  teamType: string;
  position: string;
  requiresNationalId: boolean;
  bloodType: string;
  parentName: string;
  parentId: string;
  parentPhone: string;
  // Document keys vary per player, and a missing document is stored as null.
  documents: Record<string, PlayerDocument | null>;
};

const PLAYERS: PlayerDocumentRow[] = [
  {
    id: "1003", name: "Omar Khaled", nameAr: "عمر خالد", dob: "2007-04-15", age: 17,
    team: "Future Stars U17", teamType: "main", position: "Central Midfielder",
    requiresNationalId: true,
    bloodType: "A+",
    parentName: "Khaled Hassan", parentId: "29901012345678", parentPhone: "+20 100 123 4567",
    documents: {
      birthCertificate: { status: "approved", filename: "omar_birth_cert.pdf", uploadDate: "2023-09-01", verifiedBy: "Admin" },
      nationalId: { status: "approved", filename: "omar_national_id.jpg", uploadDate: "2024-01-15", verifiedBy: "Admin" },
      medicalReport: { status: "approved", filename: "omar_medical_2024.pdf", uploadDate: "2024-02-01", verifiedBy: "Dr. Ahmed" },
    }
  },
  {
    id: "1004", name: "Youssef Mahmoud", nameAr: "يوسف محمود", dob: "2007-08-22", age: 17,
    team: "Future Stars U17", teamType: "main", position: "Striker",
    requiresNationalId: true,
    bloodType: "O+",
    parentName: "Mahmoud Ali", parentId: "29805154321098", parentPhone: "+20 111 987 6543",
    documents: {
      birthCertificate: { status: "approved", filename: "youssef_birth_cert.pdf", uploadDate: "2023-09-01", verifiedBy: "Admin" },
      nationalId: { status: "pending", filename: "youssef_national_id.jpg", uploadDate: "2025-03-10", verifiedBy: null },
      medicalReport: { status: "missing", filename: null, uploadDate: null, verifiedBy: null },
    }
  },
  {
    id: "1001", name: "Ahmed Sayed", nameAr: "أحمد سيد", dob: "2007-01-10", age: 18,
    team: "Future Stars U17", teamType: "main", position: "Goalkeeper",
    requiresNationalId: true,
    bloodType: "B+",
    parentName: "Sayed Ibrahim", parentId: "29701011234567", parentPhone: "+20 122 456 7890",
    documents: {
      birthCertificate: { status: "approved", filename: "ahmed_birth_cert.pdf", uploadDate: "2023-09-01", verifiedBy: "Admin" },
      nationalId: { status: "missing", filename: null, uploadDate: null, verifiedBy: null },
      medicalReport: { status: "approved", filename: "ahmed_medical_2024.pdf", uploadDate: "2024-03-15", verifiedBy: "Dr. Ahmed" },
    }
  },
  {
    id: "2001", name: "Karim Tarek", nameAr: "كريم طارق", dob: "2012-05-20", age: 13,
    team: "Future Stars FC U13", teamType: "academy", position: "Winger",
    requiresNationalId: false,
    bloodType: "AB+",
    parentName: "Tarek Mostafa", parentId: "29005205678901", parentPhone: "+20 100 234 5678",
    documents: {
      birthCertificate: { status: "approved", filename: "karim_birth_cert.pdf", uploadDate: "2024-09-01", verifiedBy: "Admin" },
      nationalId: null,
      medicalReport: { status: "approved", filename: "karim_medical_2024.pdf", uploadDate: "2024-09-15", verifiedBy: "Dr. Sara" },
    }
  },
  {
    id: "2002", name: "Hassan Nabil", nameAr: "حسن نبيل", dob: "2011-11-03", age: 14,
    team: "Future Stars FC U15", teamType: "academy", position: "Defender",
    requiresNationalId: false,
    bloodType: "O-",
    parentName: "Nabil Fathy", parentId: "29111034567890", parentPhone: "+20 115 345 6789",
    documents: {
      birthCertificate: { status: "missing", filename: null, uploadDate: null, verifiedBy: null },
      nationalId: null,
      medicalReport: { status: "missing", filename: null, uploadDate: null, verifiedBy: null },
    }
  },
  {
    id: "2003", name: "Mohamed Ashraf", nameAr: "محمد أشرف", dob: "2013-03-12", age: 12,
    team: "Future Stars FC U13", teamType: "academy", position: "Forward",
    requiresNationalId: false,
    bloodType: "A-",
    parentName: "Ashraf Kamal", parentId: "29303126789012", parentPhone: "+20 106 456 7891",
    documents: {
      birthCertificate: { status: "pending", filename: "mohamed_birth_cert.pdf", uploadDate: "2025-01-20", verifiedBy: null },
      nationalId: null,
      medicalReport: { status: "pending", filename: "mohamed_medical.pdf", uploadDate: "2025-01-20", verifiedBy: null },
    }
  },
];

type DocStatus = "approved" | "pending" | "missing" | "rejected";

const statusConfig: Record<DocStatus, { label: string; labelAr: string; color: string; icon: any }> = {
  approved: { label: "Approved", labelAr: "معتمد", color: "bg-green-100 text-green-700", icon: CheckCircle },
  pending: { label: "Pending Review", labelAr: "قيد المراجعة", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  missing: { label: "Not Uploaded", labelAr: "لم يُرفع", color: "bg-red-100 text-red-700", icon: AlertCircle },
  rejected: { label: "Rejected", labelAr: "مرفوض", color: "bg-red-100 text-red-700", icon: AlertCircle },
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function DocumentCard({
  title, titleAr, icon: Icon, docType, player, onUpload, language
}: {
  title: string;
  titleAr: string;
  icon: any;
  docType: "birthCertificate" | "nationalId" | "medicalReport";
  player: typeof PLAYERS[0];
  onUpload: (playerId: string, docType: string, file: File) => void;
  language: string;
}) {
  const doc = player.documents[docType];
  if (!doc) return null;

  const status = doc.status as DocStatus;
  const cfg = statusConfig[status];
  const StatusIcon = cfg.icon;
  const isRTL = language === 'ar';

  return (
    <div className={`border rounded-lg p-4 ${status === 'missing' ? 'border-red-200 bg-red-50' : status === 'pending' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${status === 'approved' ? 'bg-green-100' : status === 'pending' ? 'bg-yellow-100' : 'bg-red-100'}`}>
            <Icon className={`h-4 w-4 ${status === 'approved' ? 'text-green-600' : status === 'pending' ? 'text-yellow-600' : 'text-red-600'}`} />
          </div>
          <div>
            <p className="font-medium text-sm">{isRTL ? titleAr : title}</p>
            {docType === "nationalId" && (
              <p className="text-xs text-blue-600">{isRTL ? 'مطلوب للاعبين 15 سنة فأكثر' : 'Required for players 15+'}</p>
            )}
            {docType === "medicalReport" && (
              <p className="text-xs text-purple-600">{isRTL ? 'تقرير طبي سنوي مطلوب' : 'Annual medical report required'}</p>
            )}
          </div>
        </div>
        <Badge className={`text-xs ${cfg.color}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {isRTL ? cfg.labelAr : cfg.label}
        </Badge>
      </div>

      {doc.filename && (
        <div className="bg-white rounded p-2 mb-3 flex items-center justify-between border">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-gray-600">{doc.filename}</span>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Eye className="h-3 w-3 text-blue-500" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Download className="h-3 w-3 text-muted-foreground" />
            </Button>
          </div>
        </div>
      )}

      {doc.uploadDate && (
        <p className="text-xs text-muted-foreground mb-2">
          {isRTL ? 'تاريخ الرفع:' : 'Uploaded:'} {doc.uploadDate}
          {doc.verifiedBy && ` · ${isRTL ? 'تحقق بواسطة:' : 'Verified by:'} ${doc.verifiedBy}`}
        </p>
      )}

      <label className="cursor-pointer w-full">
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) onUpload(player.id, docType, file);
          }}
        />
        <Button
          type="button"
          variant={status === "missing" ? "default" : "outline"}
          size="sm"
          className={`w-full gap-2 ${status === "missing" ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
          asChild
        >
          <span>
            <Upload className="h-3 w-3" />
            {status === "missing" 
              ? (isRTL ? 'رفع المستند' : 'Upload Document')
              : status === "rejected" 
              ? (isRTL ? 'إعادة الرفع' : 'Re-upload Document')
              : (isRTL ? 'استبدال المستند' : 'Replace Document')}
          </span>
        </Button>
      </label>
    </div>
  );
}

export default function PlayerDocuments() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const teamType = searchParams.get('team') as 'main' | 'academy' | null;
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [players, setPlayers] = useState(PLAYERS);
  const [filter, setFilter] = useState<"all" | "missing" | "pending" | "complete">("all");
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const handleUpload = (playerId: string, docType: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: isRTL ? "الملف كبير جداً" : "File too large", description: isRTL ? "يجب أن يكون المستند أقل من 10 ميجابايت" : "Documents must be under 10MB", variant: "destructive" });
      return;
    }
    setPlayers(prev => prev.map(p => {
      if (p.id !== playerId) return p;
      return {
        ...p,
        documents: {
          ...p.documents,
          [docType]: {
            status: "pending",
            filename: file.name,
            uploadDate: new Date().toISOString().split("T")[0],
            verifiedBy: null,
          }
        }
      };
    }));
    toast({ title: isRTL ? "تم رفع المستند" : "Document uploaded", description: isRTL ? `${file.name} قيد مراجعة الإدارة` : `${file.name} is pending admin review.` });
  };

  // Filter by team type from URL if present
  const teamsFiltered = teamType 
    ? PLAYERS.filter(p => p.teamType === teamType)
    : PLAYERS;
  const teams = ["all", ...Array.from(new Set(teamsFiltered.map(p => p.team)))];

  const filteredPlayers = players.filter(p => {
    if (teamType && p.teamType !== teamType) return false;
    if (selectedTeam !== "all" && p.team !== selectedTeam) return false;
    if (filter === "missing") {
      return Object.values(p.documents).some(d => d && d.status === "missing");
    }
    if (filter === "pending") {
      return Object.values(p.documents).some(d => d && d.status === "pending");
    }
    if (filter === "complete") {
      return Object.values(p.documents).every(d => !d || d.status === "approved");
    }
    return true;
  });

  // Stats
  const relevantPlayers = teamType ? players.filter(p => p.teamType === teamType) : players;
  const totalPlayers = relevantPlayers.length;
  const completeCount = relevantPlayers.filter(p => Object.values(p.documents).every(d => !d || d.status === "approved")).length;
  const missingCount = relevantPlayers.filter(p => Object.values(p.documents).some(d => d && d.status === "missing")).length;
  const pendingCount = relevantPlayers.filter(p => Object.values(p.documents).some(d => d && d.status === "pending")).length;

  return (
    <>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => teamType ? navigate(`/team-dashboard?team=${teamType}`) : navigate('/players')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> {isRTL ? 'رجوع' : 'Back'}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-6 w-6 text-red-600" />
              {isRTL ? 'وثائق اللاعبين' : 'Player Documents'}
              {teamType && (
                <Badge className={teamType === 'main' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                  {teamType === 'main' ? (isRTL ? 'الفريق الأول' : 'Main Team') : (isRTL ? 'الأكاديمية' : 'Academy')}
                </Badge>
              )}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isRTL 
                ? 'إدارة وثائق هوية اللاعبين. شهادة الميلاد مطلوبة للجميع. بطاقة الهوية مطلوبة للاعبين 15 سنة فأكثر.'
                : 'Manage player identity documents. Birth certificates required for all. National ID required for players 15+.'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: isRTL ? 'إجمالي اللاعبين' : 'Total Players', value: totalPlayers, color: "text-gray-700", bg: "bg-gray-50" },
            { label: isRTL ? 'مكتملة' : 'Complete', value: completeCount, color: "text-green-600", bg: "bg-green-50" },
            { label: isRTL ? 'قيد المراجعة' : 'Pending Review', value: pendingCount, color: "text-yellow-600", bg: "bg-yellow-50" },
            { label: isRTL ? 'وثائق ناقصة' : 'Missing Docs', value: missingCount, color: "text-red-600", bg: "bg-red-50" },
          ].map((s, i) => (
            <Card key={i} className={s.bg}>
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Policy Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">{isRTL ? 'سياسة الوثائق' : 'Document Policy'}</p>
            <ul className="space-y-1 text-xs">
              <li>• <strong>{isRTL ? 'جميع اللاعبين:' : 'All players:'}</strong> {isRTL ? 'شهادة الميلاد (أصل أو صورة معتمدة) مطلوبة عند التسجيل' : 'Birth certificate (original or certified copy) required at enrollment'}</li>
              <li>• <strong>{isRTL ? 'اللاعبون 15 سنة فأكثر:' : 'Players 15+ years:'}</strong> {isRTL ? 'بطاقة الهوية الوطنية (وجهان) مطلوبة للمنافسات الرسمية' : 'National ID card (front and back) required for official competitions'}</li>
              <li>• <strong>{isRTL ? 'جميع اللاعبين:' : 'All players:'}</strong> {isRTL ? 'تقرير طبي سنوي مطلوب — يشمل فصيلة الدم' : 'Annual medical report required — includes blood type'}</li>
              <li>• <strong>{isRTL ? 'الصيغ المقبولة:' : 'Accepted formats:'}</strong> PDF, JPG, PNG — {isRTL ? 'الحد الأقصى 10 ميجابايت لكل ملف' : 'max 10MB per file'}</li>
            </ul>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {teams.map(t => <SelectItem key={t} value={t}>{t === "all" ? (isRTL ? 'كل الفرق' : 'All Teams') : t}</SelectItem>)}
            </SelectContent>
          </Select>
  
          <div className="flex gap-2 flex-wrap">
            {(["all", "missing", "pending", "complete"] as const).map(f => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(f)}
                className={filter === f ? "bg-red-700 text-white" : ""}
              >
                {isRTL 
                  ? f === 'all' ? 'الكل' : f === 'missing' ? 'ناقص' : f === 'pending' ? 'قيد المراجعة' : 'مكتمل'
                  : f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Player Cards */}
        <div className="space-y-4">
          {filteredPlayers.map(player => {
            const isExpanded = expandedPlayer === player.id;
            const hasIssue = Object.values(player.documents).some(d => d && d.status === "missing");
            const isComplete = Object.values(player.documents).every(d => !d || d.status === "approved");

            return (
              <Card key={player.id} className={`${hasIssue ? "border-red-200" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{isRTL ? player.nameAr : player.name}</h3>
                        <p className="text-xs text-muted-foreground">{player.position} · {player.team} · {isRTL ? 'العمر' : 'Age'} {player.age}</p>
                        {/* Blood Type Badge */}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-red-50 text-red-700 text-xs gap-1 border border-red-200">
                            <Heart className="h-3 w-3" />
                            {isRTL ? 'فصيلة الدم:' : 'Blood:'} {player.bloodType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {player.requiresNationalId && (
                        <Badge className="bg-blue-100 text-blue-700 text-xs gap-1">
                          <CreditCard className="h-3 w-3" /> {isRTL ? 'هوية مطلوبة' : 'ID Required'}
                        </Badge>
                      )}
                      {isComplete && (
                        <Badge className="bg-green-100 text-green-700 text-xs gap-1">
                          <CheckCircle className="h-3 w-3" /> {isRTL ? 'مكتمل' : 'Complete'}
                        </Badge>
                      )}
                      {hasIssue && (
                        <Badge className="bg-red-100 text-red-700 text-xs gap-1">
                          <AlertCircle className="h-3 w-3" /> {isRTL ? 'يتطلب إجراء' : 'Action Required'}
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
                        className="text-xs"
                      >
                        {isExpanded ? (isRTL ? 'إخفاء' : 'Hide') : (isRTL ? 'عرض التفاصيل' : 'View Details')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="space-y-4">
                    {/* Parent / Guardian Info */}
                    <div className="bg-gray-50 rounded-lg p-3 border">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {isRTL ? 'بيانات ولي الأمر' : 'Parent / Guardian Info'}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-gray-600">
                        <div>
                          <span className="font-medium text-muted-foreground">{isRTL ? 'الاسم:' : 'Name:'}</span>
                          <span className="ml-1">{player.parentName}</span>
                        </div>
                        <div>
                          <span className="font-medium text-muted-foreground">{isRTL ? 'رقم الهوية:' : 'National ID:'}</span>
                          <span className="ml-1 font-mono">{player.parentId}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span>{player.parentPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Documents Grid */}
                    <div className={`grid gap-4 ${player.requiresNationalId ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1 md:grid-cols-2"}`}>
                      <DocumentCard
                        title="Birth Certificate"
                        titleAr="شهادة الميلاد"
                        icon={Baby}
                        docType="birthCertificate"
                        player={player}
                        onUpload={handleUpload}
                        language={language}
                      />
                      {player.requiresNationalId && player.documents.nationalId && (
                        <DocumentCard
                          title="National ID Card"
                          titleAr="بطاقة الهوية الوطنية"
                          icon={CreditCard}
                          docType="nationalId"
                          player={player}
                          onUpload={handleUpload}
                          language={language}
                        />
                      )}
                      <DocumentCard
                        title="Medical Report"
                        titleAr="التقرير الطبي"
                        icon={Heart}
                        docType="medicalReport"
                        player={player}
                        onUpload={handleUpload}
                        language={language}
                      />
                    </div>
                  </CardContent>
                )}

                {/* Collapsed summary */}
                {!isExpanded && (
                  <CardContent className="pt-0 pb-3">
                    <div className={`grid gap-3 ${player.requiresNationalId ? "grid-cols-3" : "grid-cols-2"}`}>
                      {[
                        { key: 'birthCertificate', label: isRTL ? 'شهادة الميلاد' : 'Birth Cert', labelShort: 'BC' },
                        ...(player.requiresNationalId ? [{ key: 'nationalId', label: isRTL ? 'بطاقة الهوية' : 'National ID', labelShort: 'ID' }] : []),
                        { key: 'medicalReport', label: isRTL ? 'التقرير الطبي' : 'Medical', labelShort: 'Med' },
                      ].map(({ key, label }) => {
                        const doc = player.documents[key as keyof typeof player.documents];
                        if (!doc) return null;
                        const status = doc.status as DocStatus;
                        const cfg = statusConfig[status];
                        const StatusIcon = cfg.icon;
                        return (
                          <div key={key} className={`flex items-center gap-2 p-2 rounded text-xs ${cfg.color}`}>
                            <StatusIcon className="h-3 w-3 flex-shrink-0" />
                            <span>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
            <p>{isRTL ? 'لا يوجد لاعبون يطابقون الفلاتر المحددة' : 'No players match the selected filters'}</p>
          </div>
        )}
      </div>
    </>
  );
}
