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
import { Users, Plus, Trash2, CheckCircle, DollarSign, Clock, TrendingDown , ArrowLeft } from "lucide-react";

const MONTHS = [
  { en: "January", ar: "يناير" }, { en: "February", ar: "فبراير" },
  { en: "March", ar: "مارس" }, { en: "April", ar: "أبريل" },
  { en: "May", ar: "مايو" }, { en: "June", ar: "يونيو" },
  { en: "July", ar: "يوليو" }, { en: "August", ar: "أغسطس" },
  { en: "September", ar: "سبتمبر" }, { en: "October", ar: "أكتوبر" },
  { en: "November", ar: "نوفمبر" }, { en: "December", ar: "ديسمبر" },
];

function AddStaffCostDialog({ onSuccess }: { onSuccess: () => void }) {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [form, setForm] = useState({
    staffName: "", role: "", salaryAmount: "", month: String(now.getMonth() + 1), year: String(now.getFullYear()), notes: "",
  });

  const create = trpc.staffCosts.create.useMutation({
    onSuccess: () => {
      toast({ title: isRTL ? "تم إضافة الراتب" : "Staff cost added" });
      setOpen(false);
      setForm({ staffName: "", role: "", salaryAmount: "", month: String(now.getMonth() + 1), year: String(now.getFullYear()), notes: "" });
      onSuccess();
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="h-4 w-4 mr-1" />
          {isRTL ? "إضافة راتب" : "Add Staff Cost"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isRTL ? "إضافة راتب موظف" : "Add Staff Cost"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>{isRTL ? "اسم الموظف" : "Staff Name"}</Label>
            <Input value={form.staffName} onChange={e => setForm(f => ({ ...f, staffName: e.target.value }))} placeholder={isRTL ? "الاسم الكامل" : "Full name"} />
          </div>
          <div>
            <Label>{isRTL ? "الوظيفة / الدور" : "Role / Position"}</Label>
            <Input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder={isRTL ? "مثال: مدرب، مدير إداري" : "e.g. Coach, Admin Manager"} />
          </div>
          <div>
            <Label>{isRTL ? "الراتب الشهري (قرش)" : "Monthly Salary (piastres)"}</Label>
            <Input type="number" min="0" value={form.salaryAmount} onChange={e => setForm(f => ({ ...f, salaryAmount: e.target.value }))} placeholder="e.g. 500000 = EGP 5,000" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRTL ? "الشهر" : "Month"}</Label>
              <Select value={form.month} onValueChange={v => setForm(f => ({ ...f, month: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{isRTL ? m.ar : m.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRTL ? "السنة" : "Year"}</Label>
              <Select value={form.year} onValueChange={v => setForm(f => ({ ...f, year: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>{isRTL ? "ملاحظات" : "Notes"}</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <Button
            className="w-full"
            disabled={!form.staffName || !form.salaryAmount || create.isPending}
            onClick={() => create.mutate({
              staffName: form.staffName,
              role: form.role,
              salaryAmount: Number(form.salaryAmount),
              month: Number(form.month),
              year: Number(form.year),
              notes: form.notes,
            })}
          >
            {create.isPending ? (isRTL ? "جاري الحفظ..." : "Saving...") : (isRTL ? "حفظ" : "Save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function StaffCostTracking() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const { toast } = useToast();
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));

  const { data: costs, refetch } = trpc.staffCosts.getAll.useQuery({
    month: Number(selectedMonth),
    year: Number(selectedYear),
  });
  const { data: summary } = trpc.staffCosts.getMonthSummary.useQuery({
    month: Number(selectedMonth),
    year: Number(selectedYear),
  });

  const markPaid = trpc.staffCosts.markPaid.useMutation({
    onSuccess: () => { toast({ title: isRTL ? "تم تسجيل الدفع" : "Payment recorded" }); refetch(); },
  });
  const deleteCost = trpc.staffCosts.delete.useMutation({
    onSuccess: () => { toast({ title: isRTL ? "تم الحذف" : "Deleted" }); refetch(); },
  });

  const totalSalaries = summary?.totalSalaries || 0;
  const paidSalaries = summary?.paidSalaries || 0;
  const pendingCount = summary?.pendingCount || 0;
  const paymentRate = totalSalaries > 0 ? Math.round((paidSalaries / totalSalaries) * 100) : 0;

  return (
    <>

      <button
        onClick={() => navigate("/finance")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Finance
      </button>
      <div className={`space-y-6 ${isRTL ? "rtl" : "ltr"}`}>
        {/* Header */}
        <div className="bg-gradient-to-r from-card to-muted border border-border rounded-xl p-6 text-foreground">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                <h1 className="text-2xl font-bold">{isRTL ? "تتبع تكاليف الموظفين" : "Staff Cost Tracking"}</h1>
              </div>
              <p className="text-muted-foreground text-sm">
                {isRTL ? "إدارة رواتب الموظفين وتتبع المدفوعات الشهرية" : "Manage staff salaries and track monthly payroll payments"}
              </p>
            </div>
            <AddStaffCostDialog onSuccess={() => refetch()} />
          </div>
        </div>

        {/* Month/Year Filter */}
        <div className="flex gap-3 flex-wrap items-center">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>{isRTL ? m.ar : m.en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(y => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-100 text-red-600"><TrendingDown className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{isRTL ? "إجمالي الرواتب" : "Total Payroll"}</p>
                  <p className="text-xl font-bold">EGP {(totalSalaries / 100).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600"><CheckCircle className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{isRTL ? "المدفوع" : "Paid"}</p>
                  <p className="text-xl font-bold">EGP {(paidSalaries / 100).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600"><Clock className="h-5 w-5" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{isRTL ? "رواتب معلقة" : "Pending Salaries"}</p>
                  <p className="text-xl font-bold">{pendingCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${paymentRate >= 80 ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{isRTL ? "نسبة الصرف" : "Payment Rate"}</p>
                  <p className="text-xl font-bold">{paymentRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff List */}
        <div className="space-y-3">
          {(costs || []).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground">{isRTL ? "لا توجد رواتب مسجلة لهذا الشهر" : "No staff costs recorded for this month"}</p>
                <p className="text-sm text-muted-foreground mt-1">{isRTL ? "انقر على 'إضافة راتب' لإضافة أول راتب" : "Click 'Add Staff Cost' to add the first entry"}</p>
              </CardContent>
            </Card>
          ) : (
            (costs || []).map((cost: any) => (
              <Card key={cost.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600 mt-0.5">
                        <Users className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{cost.staffName_sc}</span>
                          <Badge variant="outline" className="text-xs">{cost.role_sc}</Badge>
                          <Badge
                            className={`text-xs border ${cost.paymentStatus_sc === "paid" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : cost.paymentStatus_sc === "partial" ? "bg-yellow-100 text-yellow-700 border-yellow-200" : "bg-red-100 text-red-700 border-red-200"}`}
                          >
                            {cost.paymentStatus_sc === "paid" ? (isRTL ? "مدفوع" : "Paid") : cost.paymentStatus_sc === "partial" ? (isRTL ? "جزئي" : "Partial") : (isRTL ? "معلق" : "Pending")}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-0.5">
                          {isRTL ? "الراتب:" : "Salary:"} EGP {(cost.salaryAmount_sc / 100).toLocaleString()}
                          {cost.paidAmount_sc > 0 && ` | ${isRTL ? "المدفوع:" : "Paid:"} EGP ${(cost.paidAmount_sc / 100).toLocaleString()}`}
                        </div>
                        {cost.notes_sc && <p className="text-xs text-muted-foreground mt-1">{cost.notes_sc}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {cost.paymentStatus_sc !== "paid" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          onClick={() => markPaid.mutate({ id: cost.id, paidAmount: cost.salaryAmount_sc })}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {isRTL ? "تسجيل دفع" : "Mark Paid"}
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50"
                        onClick={() => { if (confirm(isRTL ? "هل أنت متأكد من الحذف؟" : "Delete this entry?")) deleteCost.mutate({ id: cost.id }); }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </>
  );
}
