import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wallet, CheckCircle, Clock, AlertTriangle, XCircle, Loader2, CreditCard, Smartphone, ExternalLink , ArrowLeft } from "lucide-react";

const STATUS_CONFIG: Record<string, { en: string; ar: string; icon: typeof CheckCircle; color: string; badge: string }> = {
  paid:     { en: "Paid",     ar: "مدفوع",      icon: CheckCircle,   color: "text-green-600",  badge: "bg-green-100 text-green-700 border-green-200" },
  pending:  { en: "Pending",  ar: "معلق",       icon: Clock,         color: "text-amber-600",  badge: "bg-amber-100 text-amber-700 border-amber-200" },
  overdue:  { en: "Overdue",  ar: "متأخر",      icon: AlertTriangle, color: "text-red-600",    badge: "bg-red-100 text-red-700 border-red-200" },
  partial:  { en: "Partial",  ar: "جزئي",       icon: Clock,         color: "text-blue-600",   badge: "bg-blue-100 text-blue-700 border-blue-200" },
  waived:   { en: "Waived",   ar: "معفى",       icon: XCircle,       color: "text-muted-foreground",   badge: "bg-gray-100 text-gray-600 border-gray-200" },
};

const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const MONTHS_AR = ["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];

function formatEGP(cents: number, ar: boolean) {
  const egp = cents / 100;
  return ar ? `${egp.toLocaleString('ar-EG')} ج.م` : `EGP ${egp.toLocaleString('en-US')}`;
}

export default function MyFees() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const ar = language === "ar";
  const { data: fees, isLoading } = trpc.finance.getMyFees.useQuery();

  const totalDue = (fees || []).filter((f: any) => f.status === 'pending' || f.status === 'overdue' || f.status === 'partial')
    .reduce((s: number, f: any) => s + (f.amount - (f.paidAmount || 0)), 0);
  const totalPaid = (fees || []).filter((f: any) => f.status === 'paid')
    .reduce((s: number, f: any) => s + (f.paidAmount || 0), 0);
  const overdueCount = (fees || []).filter((f: any) => f.status === 'overdue').length;

  return (
    <>

      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Dashboard
      </button>
      <div className={`max-w-3xl mx-auto p-6 space-y-6 ${ar ? "rtl" : "ltr"}`}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-emerald-700 dark:text-emerald-500" />
            {ar ? "رسومي الأكاديمية" : "My Academy Fees"}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {ar ? "تتبع رسوم الاشتراك وسجل المدفوعات" : "Track your subscription fees and payment history"}
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{ar ? "المبلغ المستحق" : "Amount Due"}</p>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-400">{formatEGP(totalDue, ar)}</p>
              {overdueCount > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  {ar ? `${overdueCount} رسوم متأخرة` : `${overdueCount} overdue`}
                </p>
              )}
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{ar ? "إجمالي المدفوع" : "Total Paid"}</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatEGP(totalPaid, ar)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{ar ? "عدد الأشهر" : "Months Tracked"}</p>
              <p className="text-xl font-bold">{fees?.length || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Fee List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ar ? "سجل الرسوم" : "Fee History"}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !fees || fees.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">{ar ? "لا توجد رسوم مسجلة بعد" : "No fees recorded yet"}</p>
                <p className="text-sm">{ar ? "ستظهر رسوم الاشتراك هنا عند إنشائها من قبل الإدارة" : "Subscription fees will appear here once generated by admin"}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(fees as any[]).map((fee: any) => {
                  const s = STATUS_CONFIG[fee.status] || STATUS_CONFIG.pending;
                  const StatusIcon = s.icon;
                  const monthName = ar ? MONTHS_AR[fee.month - 1] : MONTHS_EN[fee.month - 1];
                  const remaining = fee.amount - (fee.paidAmount || 0);
                  return (
                    <div key={fee.id} className={`flex items-center justify-between p-3 rounded-lg border ${ar ? "flex-row-reverse" : ""}`}>
                      <div className={`flex items-center gap-3 ${ar ? "flex-row-reverse" : ""}`}>
                        <div className={`p-2 rounded-full ${fee.status === 'paid' ? 'bg-green-100' : fee.status === 'overdue' ? 'bg-red-100' : 'bg-amber-100'}`}>
                          <StatusIcon className={`h-4 w-4 ${s.color}`} />
                        </div>
                        <div className={ar ? "text-right" : ""}>
                          <p className="font-medium text-sm">
                            {monthName} {fee.year}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ar ? "موعد الاستحقاق:" : "Due:"} {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString(ar ? "ar-EG" : "en-GB") : "—"}
                          </p>
                          {fee.season && (
                            <p className="text-xs text-muted-foreground">{ar ? "الموسم:" : "Season:"} {fee.season}</p>
                          )}
                        </div>
                      </div>
                      <div className={`text-right ${ar ? "text-left" : ""} space-y-1`}>
                        <Badge className={`text-xs border ${s.badge}`}>
                          {ar ? s.ar : s.en}
                        </Badge>
                        <p className="text-sm font-semibold">{formatEGP(fee.amount, ar)}</p>
                        {fee.paidAmount > 0 && fee.status !== 'paid' && (
                          <p className="text-xs text-muted-foreground">
                            {ar ? `متبقي: ${formatEGP(remaining, ar)}` : `Remaining: ${formatEGP(remaining, ar)}`}
                          </p>
                        )}
                        {fee.paidDate && (
                          <p className="text-xs text-green-600">
                            {ar ? "دُفع في:" : "Paid:"} {new Date(fee.paidDate).toLocaleDateString(ar ? "ar-EG" : "en-GB")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Online Payment Options */}
        {totalDue > 0 && (
          <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                {ar ? "خيارات الدفع الإلكتروني" : "Online Payment Options"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {ar
                  ? `لديك ${formatEGP(totalDue, ar)} مستحقة. يمكنك الدفع عبر فوري أو إنستاباي:`
                  : `You have ${formatEGP(totalDue, ar)} outstanding. Pay online via Fawry or InstaPay:`}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Fawry */}
                <div className="flex flex-col gap-2 p-3 rounded-xl border bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2">
                    <div className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded">Fawry</div>
                    <span className="text-sm font-medium">{ar ? "فوري" : "Fawry"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ar
                      ? "ادفع في أي فرع فوري أو عبر تطبيق فوري بكود الأكاديمية"
                      : "Pay at any Fawry branch or via the Fawry app using the academy code"}
                  </p>
                  <div className="flex items-center gap-2 bg-orange-50 dark:bg-orange-950/30 rounded-lg px-3 py-2">
                    <Smartphone className="h-4 w-4 text-orange-700 dark:text-orange-500 shrink-0" />
                    <span className="text-sm font-mono font-bold text-orange-700 dark:text-orange-400">
                      {import.meta.env.VITE_FAWRY_CODE
                        ? import.meta.env.VITE_FAWRY_CODE
                        : (ar ? "تواصل مع الإدارة للحصول على الكود" : "Contact admin for Fawry code")}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950"
                    onClick={() => window.open("https://www.fawry.com", "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {ar ? "افتح تطبيق فوري" : "Open Fawry"}
                  </Button>
                </div>

                {/* InstaPay */}
                <div className="flex flex-col gap-2 p-3 rounded-xl border bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">InstaPay</div>
                    <span className="text-sm font-medium">{ar ? "إنستاباي" : "InstaPay"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ar
                      ? "حوّل المبلغ مباشرة عبر تطبيق البنك أو إنستاباي إلى حساب الأكاديمية"
                      : "Transfer directly via your bank app or InstaPay to the academy account"}
                  </p>
                  <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg px-3 py-2">
                    <Smartphone className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-sm font-mono font-bold text-blue-700 dark:text-blue-400">
                      {import.meta.env.VITE_INSTAPAY_HANDLE
                        ? import.meta.env.VITE_INSTAPAY_HANDLE
                        : (ar ? "تواصل مع الإدارة للحصول على الرقم" : "Contact admin for InstaPay handle")}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                    onClick={() => {
                      const phone = (import.meta.env.VITE_ACADEMY_WHATSAPP || "").replace(/\D/g, "");
                      const msg = ar
                        ? `مرحباً، أريد الدفع عبر إنستاباي. المبلغ المستحق: ${formatEGP(totalDue, ar)}`
                        : `Hello, I'd like to pay via InstaPay. Amount due: ${formatEGP(totalDue, ar)}`;
                      if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    {ar ? "تأكيد الدفع عبر واتساب" : "Confirm via WhatsApp"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contact Admin */}
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {ar
                ? "هل لديك استفسار عن الرسوم؟ تواصل مع إدارة الأكاديمية عبر واتساب أو من خلال صفحة الملف الشخصي."
                : "Have a question about your fees? Contact the academy admin via WhatsApp or through your Profile page."}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
