import { useEffect } from "react";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, CreditCard , ArrowLeft } from "lucide-react";

export default function BillingSuccess() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <>

      <button
        onClick={() => navigate("/billing/plans")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Subscription Plans
      </button>
      <div className="p-6 max-w-lg mx-auto text-center mt-16" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-700 dark:text-green-500" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-3">
          {isRTL ? 'تم الدفع بنجاح! 🎉' : 'Payment Successful! 🎉'}
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          {isRTL
            ? 'شكراً لاشتراكك في منصة النجوم المستقبلية للأكاديمية. تم تفعيل اشتراكك وسيتم تجديده تلقائياً.'
            : 'Thank you for subscribing to Future Stars Academy Platform. Your subscription is now active and will renew automatically.'}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => navigate('/dashboard')} className="gap-2">
            <Home className="w-4 h-4" />
            {isRTL ? 'الرئيسية' : 'Go to Dashboard'}
          </Button>
          <Button variant="outline" onClick={() => navigate('/billing/plans')} className="gap-2">
            <CreditCard className="w-4 h-4" />
            {isRTL ? 'إدارة الاشتراك' : 'Manage Subscription'}
          </Button>
        </div>
      </div>
    </>
  );
}
