import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, Star, Crown, CreditCard, AlertCircle , ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SubscriptionPlans() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const isRTL = language === 'ar';

  const { data: plans = [], isLoading } = trpc.billing.getPlans.useQuery();
  const createCheckout = trpc.billing.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        toast({ title: isRTL ? 'جاري التحويل...' : 'Redirecting to checkout...', description: isRTL ? 'سيتم فتح صفحة الدفع في تبويب جديد' : 'Payment page opening in a new tab' });
        window.open(data.url, '_blank');
      }
    },
    onError: (err) => {
      toast({ title: isRTL ? 'خطأ' : 'Error', description: err.message, variant: 'destructive' });
    },
    onSettled: () => setLoadingPlan(null),
  });

  const handleSubscribe = (planKey: string) => {
    if (!user) {
      toast({ title: isRTL ? 'يجب تسجيل الدخول أولاً' : 'Please log in first', variant: 'destructive' });
      return;
    }
    setLoadingPlan(planKey);
    createCheckout.mutate({ planKey: planKey as 'monthly' | 'quarterly' | 'annual' });
  };

  const planIcons: Record<string, any> = {
    monthly: <Zap className="w-6 h-6" />,
    quarterly: <Star className="w-6 h-6" />,
    annual: <Crown className="w-6 h-6" />,
  };

  const planColors: Record<string, string> = {
    monthly: 'border-blue-500/30 bg-blue-500/5',
    quarterly: 'border-green-500/30 bg-green-500/5',
    annual: 'border-yellow-500/30 bg-yellow-500/5 ring-2 ring-yellow-500/30',
  };

  const planBadge: Record<string, string> = {
    monthly: '',
    quarterly: isRTL ? 'وفر 10%' : 'Save 10%',
    annual: isRTL ? 'الأفضل قيمة — وفر 20%' : 'Best Value — Save 20%',
  };

  return (
    <>

      <button
        onClick={() => navigate("/settings")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Settings
      </button>
      <div className="p-6 max-w-5xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <CreditCard className="w-4 h-4" />
            {isRTL ? 'خطط الاشتراك' : 'Subscription Plans'}
          </div>
          <h1 className="text-3xl font-bold mb-2">
            {isRTL ? 'اختر الخطة المناسبة لك' : 'Choose Your Plan'}
          </h1>
          <p className="text-muted-foreground text-lg">
            {isRTL ? 'اشترك وادفع تلقائياً كل شهر — لا مزيد من المتابعة اليدوية' : 'Subscribe and pay automatically — no more manual follow-up'}
          </p>
        </div>

        {/* Test mode notice */}
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-lg px-4 py-3 mb-8 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {isRTL
              ? 'وضع الاختبار: استخدم بطاقة 4242 4242 4242 4242 (أي تاريخ مستقبلي، أي CVV) لاختبار الدفع'
              : 'Test mode: Use card 4242 4242 4242 4242 (any future date, any CVV) to test payments'}
          </span>
        </div>

        {/* Plans grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="h-96 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan: any) => (
              <Card key={plan.key} className={`relative flex flex-col ${planColors[plan.key] || ''}`}>
                {planBadge[plan.key] && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-yellow-500 text-yellow-950 font-semibold px-3 py-1">
                      {planBadge[plan.key]}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-3 text-primary">
                    {planIcons[plan.key]}
                  </div>
                  <CardTitle className="text-xl">
                    {isRTL ? plan.nameAr : plan.name}
                  </CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">
                      {plan.currency === 'egp' ? 'EGP' : plan.currency.toUpperCase()} {(plan.amount / 100).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-sm ml-1">
                      {plan.interval === 'month' ? (isRTL ? '/شهر' : '/mo') : plan.interval === 'year' ? (isRTL ? '/سنة' : '/yr') : ''}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <ul className="space-y-2 mb-6 flex-1">
                    {(isRTL ? plan.featuresAr : plan.features).map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-700 dark:text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full"
                    variant={plan.key === 'annual' ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.key)}
                    disabled={loadingPlan === plan.key}
                  >
                    {loadingPlan === plan.key
                      ? (isRTL ? 'جاري التحميل...' : 'Loading...')
                      : (isRTL ? 'اشترك الآن' : 'Subscribe Now')}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Features comparison note */}
        <div className="mt-10 text-center text-sm text-muted-foreground">
          <p>{isRTL ? 'جميع الخطط تشمل الوصول الكامل للمنصة. يمكن إلغاء الاشتراك في أي وقت.' : 'All plans include full platform access. Cancel anytime.'}</p>
        </div>
      </div>
    </>
  );
}
