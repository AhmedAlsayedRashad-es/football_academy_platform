import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Award, Plus, Trash2, CheckCircle, XCircle, Clock, Users , ArrowLeft } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  expired: "bg-gray-100 text-gray-600 border-gray-200",
  revoked: "bg-red-100 text-red-700 border-red-200",
};

const TYPE_LABELS: Record<string, { en: string; ar: string }> = {
  full: { en: "Full Scholarship", ar: "منحة كاملة" },
  partial: { en: "Partial Scholarship", ar: "منحة جزئية" },
  merit: { en: "Merit-Based", ar: "منحة تفوق" },
  need_based: { en: "Need-Based", ar: "منحة احتياج" },
  trial: { en: "Trial Period", ar: "فترة تجريبية" },
};

function AddScholarshipDialog({ players, onSuccess }: { players: any[]; onSuccess: () => void }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    playerId: "", type: "partial", discountPercent: "0", discountAmount: "0",
    reason: "", startDate: new Date().toISOString().split("T")[0], endDate: "", notes: "",
  });

  const create = trpc.scholarships.create.useMutation({
    onSuccess: () => {
      toast({ title: isRTL ? "تم إضافة المنحة" : "Scholarship added" });
      setOpen(false);
      setForm({ playerId: "", type: "partial", discountPercent: "0", discountAmount: "0", reason: "", startDate: new Date().toISOString().split("T")[0], endDate: "", notes: "" });
      onSuccess();
    },
    onError: (e) => toast({ title: isRTL ? "خطأ" : "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
          <Plus className="h-4 w-4 mr-1" />
          {isRTL ? "إضافة منحة" : "Add Scholarship"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isRTL ? "إضافة منحة دراسية جديدة" : "Add New Scholarship"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>{isRTL ? "اللاعب" : "Player"}</Label>
            <Select value={form.playerId} onValueChange={v => setForm(f => ({ ...f, playerId: v }))}>
              <SelectTrigger><SelectValue placeholder={isRTL ? "اختر لاعباً" : "Select player"} /></SelectTrigger>
              <SelectContent>
                {players.map((p: any) => (
                  <SelectItem key={p.id} value={String(p.id)}>
                    {p.firstName} {p.lastName} — {p.ageGroup}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRTL ? "نوع المنحة" : "Scholarship Type"}</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{isRTL ? v.ar : v.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRTL ? "نسبة الخصم (%)" : "Discount %"}</Label>
              <Input type="number" min="0" max="100" value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>{isRTL ? "مبلغ الخصم الثابت (قرش)" : "Fixed Discount Amount (piastres)"}</Label>
            <Input type="number" min="0" value={form.discountAmount} onChange={e => setForm(f => ({ ...f, discountAmount: e.target.value }))} placeholder="e.g. 50000 = EGP 500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRTL ? "تاريخ البداية" : "Start Date"}</Label>
              <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <Label>{isRTL ? "تاريخ الانتهاء" : "End Date"}</Label>
              <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label>{isRTL ? "سبب المنحة" : "Reason"}</Label>
            <Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={2} placeholder={isRTL ? "سبب منح المنحة..." : "Reason for granting scholarship..."} />
          </div>
          <Button
            className="w-full"
            disabled={!form.playerId || create.isPending}
            onClick={() => create.mutate({
              playerId: Number(form.playerId),
              type: form.type as any,
              discountPercent: Number(form.discountPercent),
              discountAmount: Number(form.discountAmount),
              reason: form.reason,
              startDate: form.startDate,
              endDate: form.endDate || undefined,
              notes: form.notes,
            })}
          >
            {create.isPending ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ المنحة" : "Save Scholarship")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ScholarshipManagement() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: scholarshipsData, refetch } = trpc.scholarships.getAll.useQuery();
  const { data: stats } = trpc.scholarships.getStats.useQuery();
  const { data: allPlayers } = trpc.players.getAll.useQuery();

  const updateStatus = trpc.scholarships.updateStatus.useMutation({
    onSuccess: () => { toast({ title: isRTL ? "تم التحديث" : "Updated" }); refetch(); },
  });
  const deleteScholarship = trpc.scholarships.delete.useMutation({
    onSuccess: () => { toast({ title: isRTL ? "تم الحذف" : "Deleted" }); refetch(); },
  });

  const scholarships = (scholarshipsData || []).filter((s: any) =>
    statusFilter === "all" || s.sch?.status === statusFilter
  );

  return (
    <>

      <button
        onClick={() => navigate("/admin/data-management")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Data Management
      </button>
      <div className={`space-y-6 ${isRTL ? "rtl" : "ltr"}`}>
        {/* Header */}
        <div className="brand-gradient rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-6 w-6 text-white" />
                <h1 className="text-2xl font-bold">{isRTL ? "إدارة المنح الدراسية" : "Scholarship Management"}</h1>
              </div>
              <p className="text-yellow-100 text-sm">
                {isRTL ? "إدارة المنح والخصومات وتتبع الإعفاءات المالية للاعبين" : "Manage scholarships, discounts, and financial aid for players"}
              </p>
            </div>
            <AddScholarshipDialog players={allPlayers || []} onSuccess={() => { refetch(); }} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600"><Award className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{isRTL ? "إجمالي المنح" : "Total Scholarships"}</p>
                  <p className="text-2xl font-bold">{stats?.total || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600"><CheckCircle className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{isRTL ? "المنح النشطة" : "Active Scholarships"}</p>
                  <p className="text-2xl font-bold">{stats?.active || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-600"><Users className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{isRTL ? "إجمالي قيمة الخصومات" : "Total Discount Value"}</p>
                  <p className="text-2xl font-bold">EGP {((stats?.totalDiscountValue || 0) / 100).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-2 flex-wrap">
          {["all", "active", "pending", "expired", "revoked"].map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? "default" : "outline"} onClick={() => setStatusFilter(s)}>
              {s === "all" ? (isRTL ? "الكل" : "All") : s === "active" ? (isRTL ? "نشط" : "Active") : s === "pending" ? (isRTL ? "معلق" : "Pending") : s === "expired" ? (isRTL ? "منتهي" : "Expired") : (isRTL ? "ملغي" : "Revoked")}
            </Button>
          ))}
        </div>

        {/* Scholarships List */}
        <div className="space-y-3">
          {scholarships.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground">{isRTL ? "لا توجد منح دراسية بعد" : "No scholarships yet"}</p>
                <p className="text-sm text-muted-foreground mt-1">{isRTL ? "انقر على 'إضافة منحة' لإضافة أول منحة" : "Click 'Add Scholarship' to create the first one"}</p>
              </CardContent>
            </Card>
          ) : (
            scholarships.map((item: any) => {
              const sch = item.sch;
              const player = item.player;
              return (
                <Card key={sch.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600 mt-0.5">
                          <Award className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{player?.firstName} {player?.lastName}</span>
                            <Badge variant="outline" className="text-xs">{player?.ageGroup}</Badge>
                            <Badge className={`text-xs border ${STATUS_COLORS[sch.status]}`}>{sch.status}</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mt-0.5">
                            {isRTL ? TYPE_LABELS[sch.type]?.ar : TYPE_LABELS[sch.type]?.en} — {sch.discountPercent}% {isRTL ? "خصم" : "discount"}
                            {sch.discountAmount > 0 && ` + EGP ${(sch.discountAmount / 100).toLocaleString()} ${isRTL ? "ثابت" : "fixed"}`}
                          </div>
                          {sch.reason && <p className="text-xs text-muted-foreground mt-1">{sch.reason}</p>}
                          <div className="text-xs text-muted-foreground mt-1">
                            {isRTL ? "من" : "From"} {sch.startDate} {sch.endDate ? `${isRTL ? "إلى" : "to"} ${sch.endDate}` : (isRTL ? "(مفتوح)" : "(open-ended)")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {sch.status === "pending" && (
                          <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            onClick={() => updateStatus.mutate({ id: sch.id, status: "active" })}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {isRTL ? "تفعيل" : "Activate"}
                          </Button>
                        )}
                        {sch.status === "active" && (
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => updateStatus.mutate({ id: sch.id, status: "revoked" })}>
                            <XCircle className="h-3 w-3 mr-1" />
                            {isRTL ? "إلغاء" : "Revoke"}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-50"
                          onClick={() => { if (confirm(isRTL ? "هل أنت متأكد من الحذف؟" : "Delete this scholarship?")) deleteScholarship.mutate({ id: sch.id }); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
