import { useState } from "react";
import { useLocation } from "wouter";
import { PageSkeleton } from "@/components/PageSkeleton";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, Plus, Search, Download, RefreshCw, CreditCard, Receipt,
  BarChart3, Wallet, Users, FileText, ChevronRight, Banknote,
  ArrowUpRight, ArrowDownRight, Filter, Calendar, Zap
, ArrowLeft } from "lucide-react";

import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

const EXPENSE_CATEGORIES: Record<string, { en: string; ar: string; color: string }> = {
  equipment: { en: "Equipment", ar: "معدات", color: "bg-blue-100 text-blue-700" },
  facilities: { en: "Facilities", ar: "مرافق", color: "bg-purple-100 text-purple-700" },
  salaries: { en: "Salaries", ar: "رواتب", color: "bg-green-100 text-green-700" },
  transport: { en: "Transport", ar: "مواصلات", color: "bg-yellow-100 text-yellow-700" },
  medical: { en: "Medical", ar: "طبي", color: "bg-red-100 text-red-700" },
  training: { en: "Training", ar: "تدريب", color: "bg-orange-100 text-orange-700" },
  marketing: { en: "Marketing", ar: "تسويق", color: "bg-pink-100 text-pink-700" },
  utilities: { en: "Utilities", ar: "مرافق عامة", color: "bg-gray-100 text-gray-700" },
  other: { en: "Other", ar: "أخرى", color: "bg-slate-100 text-slate-700" },
};

const PAYMENT_METHODS: Record<string, { en: string; ar: string }> = {
  cash: { en: "Cash", ar: "نقداً" },
  bank_transfer: { en: "Bank Transfer", ar: "تحويل بنكي" },
  instapay: { en: "InstaPay", ar: "إنستاباي" },
  vodafone_cash: { en: "Vodafone Cash", ar: "فودافون كاش" },
  check: { en: "Check", ar: "شيك" },
  other: { en: "Other", ar: "أخرى" },
};

function formatEGP(cents: number, lang: string) {
  const egp = cents / 100;
  return lang === 'ar'
    ? `${egp.toLocaleString('ar-EG')} ج.م`
    : `EGP ${egp.toLocaleString('en-US')}`;
}

function StatCard({ title, value, subtitle, icon: Icon, trend, color }: any) {
  return (
    <Card className="bg-card border shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
            <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${color} shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-3 text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span>{Math.abs(trend)}% vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Generate Monthly Fees Dialog ─────────────────────────────────────────────
function GenerateFeesDialog({ onSuccess }: { onSuccess: () => void }) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const now = new Date();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [amount, setAmount] = useState("90000"); // 900 EGP default
  const [season, setSeason] = useState(`${now.getFullYear()}-${now.getFullYear() + 1}`);

  const generate = trpc.finance.generateMonthlyFees.useMutation({
    onSuccess: (data) => {
      toast({ title: language === 'ar' ? `تم إنشاء ${data.created} رسوم` : `Created ${data.created} fees` });
      setOpen(false);
      onSuccess();
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <RefreshCw className="h-4 w-4" />
          {language === 'ar' ? 'توليد رسوم شهرية' : 'Generate Monthly Fees'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? 'توليد الرسوم الشهرية' : 'Generate Monthly Fees'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{language === 'ar' ? 'الشهر' : 'Month'}</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MONTHS_EN.map((m, i) => (
                    <SelectItem key={i+1} value={String(i+1)}>
                      {language === 'ar' ? MONTHS_AR[i] : m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === 'ar' ? 'السنة' : 'Year'}</Label>
              <Input value={year} onChange={e => setYear(e.target.value)} type="number" />
            </div>
          </div>
          <div>
            <Label>{language === 'ar' ? 'المبلغ (قروش)' : 'Amount (piastres)'}</Label>
            <Input value={amount} onChange={e => setAmount(e.target.value)} type="number" placeholder="90000 = 900 EGP" />
            <p className="text-xs text-muted-foreground mt-1">
              {language === 'ar' ? `= ${Number(amount)/100} ج.م` : `= EGP ${Number(amount)/100}`}
            </p>
          </div>
          <div>
            <Label>{language === 'ar' ? 'الموسم' : 'Season'}</Label>
            <Input value={season} onChange={e => setSeason(e.target.value)} placeholder="2025-2026" />
          </div>
          <Button
            className="w-full"
            onClick={() => generate.mutate({ month: Number(month), year: Number(year), amount: Number(amount), season })}
            disabled={generate.isPending}
          >
            {generate.isPending
              ? (language === 'ar' ? 'جاري التوليد...' : 'Generating...')
              : (language === 'ar' ? 'توليد الرسوم' : 'Generate Fees')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Record Payment Dialog ─────────────────────────────────────────────────────
function RecordPaymentDialog({ fee, playerName, onSuccess }: { fee: any; playerName: string; onSuccess: () => void }) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String((fee.amount - (fee.paidAmount || 0)) / 100));
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const record = trpc.finance.recordPayment.useMutation({
    onSuccess: () => {
      toast({ title: language === 'ar' ? 'تم تسجيل الدفعة بنجاح' : 'Payment recorded successfully' });
      setOpen(false);
      onSuccess();
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 h-7 text-xs">
          <CreditCard className="h-3 w-3" />
          {language === 'ar' ? 'دفع' : 'Pay'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? `تسجيل دفعة - ${playerName}` : `Record Payment - ${playerName}`}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>{language === 'ar' ? 'المبلغ (ج.م)' : 'Amount (EGP)'}</Label>
            <Input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" />
          </div>
          <div>
            <Label>{language === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{language === 'ar' ? v.ar : v.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{language === 'ar' ? 'رقم المرجع' : 'Reference Number'}</Label>
            <Input value={reference} onChange={e => setReference(e.target.value)} placeholder={language === 'ar' ? 'اختياري' : 'Optional'} />
          </div>
          <div>
            <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} />
          </div>
          <Button
            className="w-full"
            onClick={() => record.mutate({ feeId: fee.id, amount: Math.round(Number(amount) * 100), method: method as any, reference: reference || undefined, notes: notes || undefined })}
            disabled={record.isPending}
          >
            {record.isPending ? (language === 'ar' ? 'جاري التسجيل...' : 'Recording...') : (language === 'ar' ? 'تسجيل الدفعة' : 'Record Payment')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add Expense Dialog ────────────────────────────────────────────────────────
function AddExpenseDialog({ onSuccess }: { onSuccess: () => void }) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "equipment", description: "", amount: "", expenseDate: new Date().toISOString().split('T')[0], vendor: "", notes: "" });

  const create = trpc.finance.createExpense.useMutation({
    onSuccess: () => {
      toast({ title: language === 'ar' ? 'تم إضافة المصروف' : 'Expense added' });
      setOpen(false);
      onSuccess();
    },
    onError: (e) => toast({ title: e.message, variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          {language === 'ar' ? 'إضافة مصروف' : 'Add Expense'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{language === 'ar' ? 'إضافة مصروف جديد' : 'Add New Expense'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <Label>{language === 'ar' ? 'الفئة' : 'Category'}</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{language === 'ar' ? v.ar : v.en}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{language === 'ar' ? 'الوصف' : 'Description'}</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{language === 'ar' ? 'المبلغ (ج.م)' : 'Amount (EGP)'}</Label>
              <Input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" step="0.01" />
            </div>
            <div>
              <Label>{language === 'ar' ? 'التاريخ' : 'Date'}</Label>
              <Input value={form.expenseDate} onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))} type="date" />
            </div>
          </div>
          <div>
            <Label>{language === 'ar' ? 'المورد' : 'Vendor'}</Label>
            <Input value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} placeholder={language === 'ar' ? 'اختياري' : 'Optional'} />
          </div>
          <div>
            <Label>{language === 'ar' ? 'ملاحظات' : 'Notes'}</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} />
          </div>
          <Button
            className="w-full"
            onClick={() => create.mutate({ ...form, category: form.category as "training" | "other" | "medical" | "equipment" | "facilities" | "salaries" | "transport" | "marketing" | "utilities", amount: Math.round(Number(form.amount) * 100), vendor: form.vendor || undefined, notes: form.notes || undefined })}
            disabled={create.isPending || !form.description || !form.amount}
          >
            {create.isPending ? (language === 'ar' ? 'جاري الحفظ...' : 'Saving...') : (language === 'ar' ? 'حفظ المصروف' : 'Save Expense')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Fee Status Badge ──────────────────────────────────────────────────────────
function FeeStatusBadge({ status, language }: { status: string; language: string }) {
  const config: Record<string, { en: string; ar: string; class: string }> = {
    paid: { en: "Paid", ar: "مدفوع", class: "bg-green-100 text-green-700 border-green-200" },
    pending: { en: "Pending", ar: "معلق", class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    overdue: { en: "Overdue", ar: "متأخر", class: "bg-red-100 text-red-700 border-red-200" },
    partial: { en: "Partial", ar: "جزئي", class: "bg-blue-100 text-blue-700 border-blue-200" },
    waived: { en: "Waived", ar: "معفى", class: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const c = config[status] || config.pending;
  return <Badge className={`text-xs border ${c.class}`}>{language === 'ar' ? c.ar : c.en}</Badge>;
}

// ─── Main Finance Page ─────────────────────────────────────────────────────────
function MonthlyChart({ data, isRTL }: { data: { label: string; revenue: number; expenses: number }[]; isRTL: boolean }) {
  if (!data.length) return <div className="h-64 flex items-center justify-center text-muted-foreground">{isRTL ? 'لا توجد بيانات بعد' : 'No data yet — generate fees or add expenses to see chart'}</div>;

  const chartData = {
    labels: data.map(d => d.label),
    datasets: [
      { label: isRTL ? 'الإيرادات' : 'Revenue', data: data.map(d => d.revenue / 100), backgroundColor: 'rgba(16,185,129,0.7)', borderColor: 'rgb(16,185,129)', borderWidth: 1, borderRadius: 4 },
      { label: isRTL ? 'المصروفات' : 'Expenses', data: data.map(d => d.expenses / 100), backgroundColor: 'rgba(239,68,68,0.7)', borderColor: 'rgb(239,68,68)', borderWidth: 1, borderRadius: 4 },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const }, tooltip: { callbacks: { label: (c: any) => `EGP ${Number(c.raw).toLocaleString()}` } } },
    scales: { y: { beginAtZero: true, ticks: { callback: (v: any) => `EGP ${Number(v).toLocaleString()}` } } },
  };

  return (
    <div style={{ height: '320px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default function Finance() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRTL = language === 'ar';
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(String(now.getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()));
  const [feeStatusFilter, setFeeStatusFilter] = useState("all");
  const [expenseCatFilter, setExpenseCatFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = trpc.finance.getStats.useQuery();
  const { data: chartData } = trpc.finance.getMonthlyChart.useQuery();
  const { data: teamsData } = trpc.teams.getAll.useQuery();
  const markOverdue = trpc.finance.markOverdueFees.useMutation({
    onSuccess: (res) => {
      toast({ title: isRTL ? `تم تحديث ${res.updated} رسوم متأخرة` : `Marked ${res.updated} fees as overdue` });
      refetchFees(); refetchStats();
    },
  });
  const { data: feesData, refetch: refetchFees } = trpc.finance.getPlayerFees.useQuery({
    month: Number(selectedMonth),
    year: Number(selectedYear),
    status: feeStatusFilter !== "all" ? feeStatusFilter : undefined,
    teamId: teamFilter !== "all" ? Number(teamFilter) : undefined,
  });;
  const { data: expensesData, refetch: refetchExpenses } = trpc.finance.getExpenses.useQuery({
    category: expenseCatFilter !== "all" ? expenseCatFilter : undefined,
  });
  const { data: invoicesData } = trpc.finance.getInvoices.useQuery({});

  const approveExpense = trpc.finance.approveExpense.useMutation({
    onSuccess: () => refetchExpenses(),
  });

  const filteredFees = (feesData || []).filter((f: any) => {
    if (!search) return true;
    const name = `${f.player?.firstName || ''} ${f.player?.lastName || ''}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const totalFeeAmount = filteredFees.reduce((s: number, f: any) => s + (f.fee?.amount || 0), 0);
  const totalPaidAmount = filteredFees.reduce((s: number, f: any) => s + (f.fee?.paidAmount || 0), 0);
  if (statsLoading) return <><PageSkeleton cards={4} rows={6} /></>;
  return (
    <>
      <div className={`space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Wallet className="h-6 w-6 text-emerald-700 dark:text-emerald-500" />
              {isRTL ? 'الإدارة المالية' : 'Finance Management'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isRTL ? 'إدارة الرسوم والمدفوعات والمصروفات والفواتير' : 'Manage fees, payments, expenses, and invoices'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <GenerateFeesDialog onSuccess={() => { refetchFees(); refetchStats(); }} />
            <AddExpenseDialog onSuccess={() => { refetchExpenses(); refetchStats(); }} />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title={isRTL ? 'الإيرادات هذا الشهر' : 'Revenue This Month'}
            value={formatEGP(stats?.totalRevenue || 0, language)}
            subtitle={isRTL ? 'إجمالي المدفوعات المحصلة' : 'Total collected payments'}
            icon={TrendingUp}
            color="bg-emerald-100 text-emerald-600"
          />
          <StatCard
            title={isRTL ? 'المصروفات هذا الشهر' : 'Expenses This Month'}
            value={formatEGP(stats?.totalExpenses || 0, language)}
            subtitle={isRTL ? 'المصروفات المعتمدة' : 'Approved expenses'}
            icon={TrendingDown}
            color="bg-red-100 text-red-600"
          />
          <StatCard
            title={isRTL ? 'الرسوم المعلقة' : 'Pending Fees'}
            value={formatEGP(stats?.pendingFees || 0, language)}
            subtitle={isRTL ? 'في انتظار التحصيل' : 'Awaiting collection'}
            icon={Clock}
            color="bg-yellow-100 text-yellow-600"
          />
          <StatCard
            title={isRTL ? 'معدل التحصيل' : 'Collection Rate'}
            value={`${stats?.collectionRate || 0}%`}
            subtitle={isRTL ? `${stats?.overdueCount || 0} رسوم متأخرة` : `${stats?.overdueCount || 0} overdue fees`}
            icon={BarChart3}
            color="bg-blue-100 text-blue-600"
          />
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="fees" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-xl">
            <TabsTrigger value="fees" className="gap-1.5">
              <Users className="h-4 w-4" />
              {isRTL ? 'الرسوم' : 'Fees'}
            </TabsTrigger>
            <TabsTrigger value="chart" className="gap-1.5">
              <BarChart3 className="h-4 w-4" />
              {isRTL ? 'الرسم البياني' : 'Chart'}
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1.5">
              <Receipt className="h-4 w-4" />
              {isRTL ? 'المصروفات' : 'Expenses'}
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5">
              <FileText className="h-4 w-4" />
              {isRTL ? 'الفواتير' : 'Invoices'}
            </TabsTrigger>
          </TabsList>

          {/* ─── Monthly Chart Tab ─────────────────────────────────────────── */}
          <TabsContent value="chart" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{isRTL ? 'الإيرادات مقابل المصروفات (آخر 6 أشهر)' : 'Revenue vs Expenses (Last 6 Months)'}</CardTitle>
                <Button size="sm" variant="outline" onClick={() => markOverdue.mutate()} disabled={markOverdue.isPending}>
                  <Zap className="h-4 w-4 mr-2" />
                  {isRTL ? 'تحديث الرسوم المتأخرة' : 'Mark Overdue Fees'}
                </Button>
              </CardHeader>
              <CardContent>
                <MonthlyChart data={chartData || []} isRTL={isRTL} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Player Fees Tab ─────────────────────────────────────────── */}
          <TabsContent value="fees" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS_EN.map((m, i) => (
                      <SelectItem key={i+1} value={String(i+1)}>
                        {isRTL ? MONTHS_AR[i] : m}
                      </SelectItem>
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
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-44">
                  <Users className="h-4 w-4 mr-1 text-muted-foreground" />
                  <SelectValue placeholder={isRTL ? 'كل الفرق' : 'All Teams'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'كل الفرق' : 'All Teams'}</SelectItem>
                  {(teamsData || []).map((team: any) => (
                    <SelectItem key={team.id} value={String(team.id)}>
                      {team.name} {team.ageGroup ? `(${team.ageGroup})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={feeStatusFilter} onValueChange={setFeeStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'الكل' : 'All'}</SelectItem>
                  <SelectItem value="pending">{isRTL ? 'معلق' : 'Pending'}</SelectItem>
                  <SelectItem value="paid">{isRTL ? 'مدفوع' : 'Paid'}</SelectItem>
                  <SelectItem value="overdue">{isRTL ? 'متأخر' : 'Overdue'}</SelectItem>
                  <SelectItem value="partial">{isRTL ? 'جزئي' : 'Partial'}</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder={isRTL ? 'بحث باسم اللاعب...' : 'Search player name...'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Summary bar */}
            {filteredFees.length > 0 && (
              <div className="flex gap-4 p-3 bg-muted/50 rounded-lg text-sm">
                <span className="text-muted-foreground">{isRTL ? 'الإجمالي:' : 'Total:'} <strong>{formatEGP(totalFeeAmount, language)}</strong></span>
                <span className="text-green-600">{isRTL ? 'محصّل:' : 'Collected:'} <strong>{formatEGP(totalPaidAmount, language)}</strong></span>
                <span className="text-yellow-600">{isRTL ? 'متبقي:' : 'Remaining:'} <strong>{formatEGP(totalFeeAmount - totalPaidAmount, language)}</strong></span>
              </div>
            )}

            {/* Fees Table */}
            <Card>
              <CardContent className="p-0">
                {filteredFees.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Banknote className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{isRTL ? 'لا توجد رسوم لهذا الشهر' : 'No fees for this month'}</p>
                    <p className="text-sm mt-1">{isRTL ? 'استخدم "توليد رسوم شهرية" لإنشاء الرسوم' : 'Use "Generate Monthly Fees" to create fees'}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'اللاعب' : 'Player'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'الفئة العمرية' : 'Age Group'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'المبلغ' : 'Amount'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'المدفوع' : 'Paid'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'الحالة' : 'Status'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'إجراء' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFees.map((f: any) => (
                          <tr key={f.fee.id} className="border-b hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-medium">
                              {f.player ? `${f.player.firstName} ${f.player.lastName}` : `#${f.fee.playerId}`}
                            </td>
                            <td className="p-3 text-muted-foreground">{f.player?.ageGroup || '—'}</td>
                            <td className="p-3">{formatEGP(f.fee.amount, language)}</td>
                            <td className="p-3 text-green-600">{formatEGP(f.fee.paidAmount || 0, language)}</td>
                            <td className="p-3 text-muted-foreground">
                              {f.fee.dueDate ? new Date(f.fee.dueDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-GB') : '—'}
                            </td>
                            <td className="p-3"><FeeStatusBadge status={f.fee.status} language={language} /></td>
                            <td className="p-3">
                              {f.fee.status !== 'paid' && f.fee.status !== 'waived' && (
                                <RecordPaymentDialog
                                  fee={f.fee}
                                  playerName={f.player ? `${f.player.firstName} ${f.player.lastName}` : `#${f.fee.playerId}`}
                                  onSuccess={() => { refetchFees(); refetchStats(); }}
                                />
                              )}
                              {f.fee.status === 'paid' && (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  {isRTL ? 'مكتمل' : 'Complete'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Expenses Tab ─────────────────────────────────────────────── */}
          <TabsContent value="expenses" className="space-y-4">
            <div className="flex gap-3 items-center flex-wrap">
              <Select value={expenseCatFilter} onValueChange={setExpenseCatFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'كل الفئات' : 'All Categories'}</SelectItem>
                  {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{isRTL ? v.ar : v.en}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardContent className="p-0">
                {!expensesData || expensesData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Receipt className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{isRTL ? 'لا توجد مصروفات مسجلة' : 'No expenses recorded'}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'الوصف' : 'Description'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'الفئة' : 'Category'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'المبلغ' : 'Amount'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'المورد' : 'Vendor'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'التاريخ' : 'Date'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'الحالة' : 'Status'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'إجراء' : 'Action'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expensesData.map((exp: any) => {
                          const cat = EXPENSE_CATEGORIES[exp.category] || EXPENSE_CATEGORIES.other;
                          return (
                            <tr key={exp.id} className="border-b hover:bg-muted/20 transition-colors">
                              <td className="p-3 font-medium">{exp.description}</td>
                              <td className="p-3">
                                <Badge className={`text-xs border-0 ${cat.color}`}>{isRTL ? cat.ar : cat.en}</Badge>
                              </td>
                              <td className="p-3 font-semibold text-red-600">{formatEGP(exp.amount, language)}</td>
                              <td className="p-3 text-muted-foreground">{exp.vendor || '—'}</td>
                              <td className="p-3 text-muted-foreground">
                                {exp.expenseDate ? new Date(exp.expenseDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-GB') : '—'}
                              </td>
                              <td className="p-3">
                                <Badge className={`text-xs border ${
                                  exp.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200' :
                                  exp.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' :
                                  'bg-yellow-100 text-yellow-700 border-yellow-200'
                                }`}>
                                  {exp.status === 'approved' ? (isRTL ? 'معتمد' : 'Approved') :
                                   exp.status === 'rejected' ? (isRTL ? 'مرفوض' : 'Rejected') :
                                   (isRTL ? 'معلق' : 'Pending')}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {exp.status === 'pending' && (
                                  <div className="flex gap-1">
                                    <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                      onClick={() => approveExpense.mutate({ id: exp.id, status: 'approved' })}>
                                      {isRTL ? 'اعتماد' : 'Approve'}
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                      onClick={() => approveExpense.mutate({ id: exp.id, status: 'rejected' })}>
                                      {isRTL ? 'رفض' : 'Reject'}
                                    </Button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── Invoices Tab ─────────────────────────────────────────────── */}
          <TabsContent value="invoices" className="space-y-4">
            <Card>
              <CardContent className="p-0">
                {!invoicesData || invoicesData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">{isRTL ? 'لا توجد فواتير' : 'No invoices yet'}</p>
                    <p className="text-sm mt-1">{isRTL ? 'سيتم إنشاء الفواتير تلقائياً عند تسجيل المدفوعات' : 'Invoices are created when payments are recorded'}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'رقم الفاتورة' : 'Invoice #'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'اللاعب' : 'Player'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'المبلغ الكلي' : 'Total'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'المدفوع' : 'Paid'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                          <th className="text-start p-3 font-medium text-muted-foreground">{isRTL ? 'الحالة' : 'Status'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoicesData.map((inv: any) => (
                          <tr key={inv.invoice.id} className="border-b hover:bg-muted/20 transition-colors">
                            <td className="p-3 font-mono text-xs font-semibold text-blue-600">{inv.invoice.invoiceNumber}</td>
                            <td className="p-3">{inv.player ? `${inv.player.firstName} ${inv.player.lastName}` : '—'}</td>
                            <td className="p-3 font-semibold">{formatEGP(inv.invoice.totalAmount, language)}</td>
                            <td className="p-3 text-green-600">{formatEGP(inv.invoice.paidAmount || 0, language)}</td>
                            <td className="p-3 text-muted-foreground">
                              {inv.invoice.dueDate ? new Date(inv.invoice.dueDate).toLocaleDateString(isRTL ? 'ar-EG' : 'en-GB') : '—'}
                            </td>
                            <td className="p-3">
                              <Badge className={`text-xs border ${
                                inv.invoice.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' :
                                inv.invoice.status === 'overdue' ? 'bg-red-100 text-red-700 border-red-200' :
                                inv.invoice.status === 'sent' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                inv.invoice.status === 'cancelled' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                'bg-yellow-100 text-yellow-700 border-yellow-200'
                              }`}>
                                {inv.invoice.status === 'paid' ? (isRTL ? 'مدفوع' : 'Paid') :
                                 inv.invoice.status === 'overdue' ? (isRTL ? 'متأخر' : 'Overdue') :
                                 inv.invoice.status === 'sent' ? (isRTL ? 'مرسل' : 'Sent') :
                                 inv.invoice.status === 'cancelled' ? (isRTL ? 'ملغي' : 'Cancelled') :
                                 (isRTL ? 'مسودة' : 'Draft')}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
