import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Star, Zap, Crown, ArrowRight, ArrowLeft, Users, Calendar, Target, Award, Brain, Utensils, MessageSquare } from "lucide-react";
import { WhatsAppInlineButton } from "@/components/WhatsAppButton";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";
import TestimonialCarousel from "@/components/TestimonialCarousel";
import { trpc } from "@/lib/trpc";

export default function Pricing() {
  const { language, isRTL } = useLanguage();
  const { data: approvedTestimonials } = trpc.testimonials.getApproved.useQuery();

  const content = {
    en: {
      backToHome: "Back to Home",
      events: "Events",
      badge: "Membership Plans",
      title1: "Invest in Your Child's",
      title2: "Football Future",
      subtitle: "Choose the plan that fits your commitment level. All plans include full access to our world-class coaching, facilities, and development programs.",
      plans: [
        { name: "Monthly", description: "Perfect for trying out our academy", duration: "1 Month", savings: null },
        { name: "Quarterly", description: "Great value for committed players", duration: "3 Months", savings: "Save 750 EGP" },
        { name: "Semi-Annual", description: "Most popular choice for serious development", duration: "6 Months", savings: "Save 2,500 EGP" },
        { name: "Annual", description: "Best value for long-term commitment", duration: "12 Months", savings: "Save 6,000 EGP" },
      ],
      mostPopular: "MOST POPULAR",
      durationLabel: "Duration",
      getStarted: "Get Started",
      includedTitle: "What's Included in Every Plan",
      includedSubtitle: "All membership plans include full access to our comprehensive training program",
      features: [
        "Professional Coaching Sessions",
        "Age-Appropriate Training Programs",
        "Mental Performance Coaching",
        "Nutrition Guidance",
        "Parent Portal Access",
        "Progress Reports",
        "Weekly Training Schedule",
      ],
      notIncludedTitle: "Additional Costs (Not Included)",
      notIncludedSubtitle: "The following items require separate payment",
      notIncluded: [
        "Football Kits & Equipment",
        "Tournament Entry Fees",
        "Special Events & Camps",
        "Private 1-on-1 Sessions",
        "International Tours",
      ],
      questionsTitle: "Have Questions?",
      questionsSubtitle: "Contact us to learn more about our programs and find the best plan for your child",
      contactUs: "Contact Us",
      registerNow: "Register Now",
      ctaTitle: "Ready to Start Your Journey?",
      ctaSubtitle: "Join hundreds of families who have trusted Future Stars Academy to develop their children into complete athletes",
      registerToday: "Register Your Child Today",
    },
    ar: {
      backToHome: "العودة للرئيسية",
      events: "الفعاليات",
      badge: "خطط العضوية",
      title1: "استثمر في مستقبل طفلك",
      title2: "الكروي",
      subtitle: "اختر الخطة التي تناسب مستوى التزامك. جميع الخطط تشمل الوصول الكامل لتدريبنا العالمي والمرافق وبرامج التطوير.",
      plans: [
        { name: "شهري", description: "مثالي لتجربة أكاديميتنا", duration: "شهر واحد", savings: null },
        { name: "ربع سنوي", description: "قيمة رائعة للاعبين الملتزمين", duration: "3 أشهر", savings: "وفر 750 جنيه" },
        { name: "نصف سنوي", description: "الخيار الأكثر شعبية للتطوير الجاد", duration: "6 أشهر", savings: "وفر 2,500 جنيه" },
        { name: "سنوي", description: "أفضل قيمة للالتزام طويل المدى", duration: "12 شهر", savings: "وفر 6,000 جنيه" },
      ],
      mostPopular: "الأكثر شعبية",
      durationLabel: "المدة",
      getStarted: "ابدأ الآن",
      includedTitle: "ما يشمله كل اشتراك",
      includedSubtitle: "جميع خطط العضوية تشمل الوصول الكامل لبرنامج التدريب الشامل",
      features: [
        "جلسات تدريب احترافية",
        "برامج تدريب مناسبة للعمر",
        "تدريب الأداء النفسي",
        "إرشادات التغذية",
        "الوصول لبوابة أولياء الأمور",
        "تقارير التقدم",
        "جدول التدريب الأسبوعي",
      ],
      notIncludedTitle: "تكاليف إضافية (غير مشمولة)",
      notIncludedSubtitle: "العناصر التالية تتطلب دفع منفصل",
      notIncluded: [
        "أطقم كرة القدم والمعدات",
        "رسوم دخول البطولات",
        "الفعاليات والمعسكرات الخاصة",
        "جلسات خاصة فردية",
        "الجولات الدولية",
      ],
      questionsTitle: "لديك أسئلة؟",
      questionsSubtitle: "تواصل معنا لمعرفة المزيد عن برامجنا وإيجاد أفضل خطة لطفلك",
      contactUs: "تواصل معنا",
      registerNow: "سجل الآن",
      ctaTitle: "مستعد لبدء رحلتك؟",
      ctaSubtitle: "انضم لمئات العائلات التي وثقت في فيوتشر ستارز لتطوير أطفالهم إلى رياضيين متكاملين",
      registerToday: "سجل طفلك اليوم",
    }
  };

  const c = content[language];

  const pricingPlans = [
    { price: 1250, period: language === 'ar' ? "شهر" : "month", popular: false, icon: Zap, color: "from-blue-500 to-blue-600" },
    { price: 3000, period: language === 'ar' ? "3 أشهر" : "3 months", popular: false, icon: Star, color: "from-purple-500 to-purple-600" },
    { price: 5000, period: language === 'ar' ? "6 أشهر" : "6 months", popular: true, icon: Crown, color: "from-orange-500 to-orange-600" },
    { price: 9000, period: language === 'ar' ? "سنة" : "year", popular: false, icon: Award, color: "from-emerald-500 to-emerald-600" },
  ];

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo-transparent.png" alt="Future Stars Academy" className="h-8 w-8" />
            <span className="font-bold text-lg">Future Stars Academy</span>
          </Link>
          <div className="flex items-center gap-4">
            <LanguageToggle />
            <Link href="/events">
              <Button variant="ghost">{c.events}</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="gap-2">
                {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                {c.backToHome}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="brand-gradient-subtle absolute inset-0" />
        <div className="container relative">
          <div className="text-center max-w-3xl mx-auto">
            <Badge className="mb-4 bg-orange-500/10 text-orange-700 dark:text-orange-500 border-orange-500/20">
              <Crown className="h-3 w-3 mr-1" />
              {c.badge}
            </Badge>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {c.title1}{" "}
              <span className="brand-gradient text-transparent bg-clip-text">
                {c.title2}
              </span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {c.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 -mt-8">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pricingPlans.map((plan, index) => {
              const Icon = plan.icon;
              const planContent = c.plans[index];
              return (
                <Card 
                  key={index} 
                  className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                    plan.popular ? "border-orange-500 shadow-lg shadow-orange-500/20" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'}`}>
                      <div className={`bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-4 py-1 ${isRTL ? 'rounded-br-lg' : 'rounded-bl-lg'}`}>
                        {c.mostPopular}
                      </div>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}>
                      <Icon className="h-6 w-6 text-foreground" />
                    </div>
                    <CardTitle className="text-xl">{planContent.name}</CardTitle>
                    <CardDescription>{planContent.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="mb-4">
                      <span className="text-4xl font-bold">{plan.price.toLocaleString()}</span>
                      <span className="text-muted-foreground mx-1">{language === 'ar' ? 'جنيه' : 'EGP'}</span>
                      <div className="text-sm text-muted-foreground">/{plan.period}</div>
                    </div>
                    {planContent.savings && (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20">
                        {planContent.savings}
                      </Badge>
                    )}
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="text-sm font-medium text-muted-foreground">{c.durationLabel}</div>
                      <div className="text-lg font-semibold">{planContent.duration}</div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href="/register" className="w-full">
                      <Button 
                        className={`w-full gap-2 ${
                          plan.popular 
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700" 
                            : ""
                        }`}
                        variant={plan.popular ? "default" : "outline"}
                      >
                        {c.getStarted}
                        <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{c.includedTitle}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {c.includedSubtitle}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {c.features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-4 rounded-lg bg-background border border-border"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-700 dark:text-green-500" />
                </div>
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Not Included */}
      <section className="py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto">
            <Card className="border-orange-500/20 bg-orange-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                    <X className="h-4 w-4 text-orange-700 dark:text-orange-500" />
                  </div>
                  {c.notIncludedTitle}
                </CardTitle>
                <CardDescription>
                  {c.notIncludedSubtitle}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {c.notIncluded.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-muted-foreground">
                      <X className="h-4 w-4 text-orange-500/60" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Preview */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">{c.questionsTitle}</h2>
            <p className="text-muted-foreground mb-8">
              {c.questionsSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <WhatsAppInlineButton 
                size="lg" 
                variant="solid"
                label={isRTL ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}
                labelAr="تواصل عبر واتساب"
                message="Hello! I'm interested in the membership plans at Future Stars Academy. Can you help me choose the right one?"
                messageAr="مرحباً! أنا مهتم بخطط العضوية في Future Stars Academy. هل يمكنكم مساعدتي في اختيار الخطة المناسبة؟"
              />
              <Link href="/contact">
                <Button size="lg" variant="outline" className="gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {c.contactUs}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="gap-2">
                  {c.registerNow}
                  <ArrowRight className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              {language === 'ar' ? 'ماذا يقول عملاؤنا' : 'What Our Families Say'}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {language === 'ar' 
                ? 'استمع إلى تجارب اللاعبين وأولياء الأمور مع أكاديميتنا'
                : 'Hear from our players and parents about their experience'}
            </p>
          </div>
          <TestimonialCarousel 
            testimonials={approvedTestimonials?.slice(0, 5) || []} 
            variant="default"
            autoPlay={true}
            interval={5000}
          />
        </div>
      </section>

      {/* Footer CTA */}
      <section className="brand-gradient py-16">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {c.ctaTitle}
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            {c.ctaSubtitle}
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              {c.registerToday}
              <ArrowRight className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
