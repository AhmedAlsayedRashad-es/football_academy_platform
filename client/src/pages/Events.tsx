import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Trophy, 
  Dumbbell, 
  GraduationCap,
  Target,
  Tent,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Filter
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageToggle from "@/components/LanguageToggle";

const eventTypeIcons: Record<string, React.ReactNode> = {
  training: <Dumbbell className="w-5 h-5" />,
  tournament: <Trophy className="w-5 h-5" />,
  trial: <Target className="w-5 h-5" />,
  camp: <Tent className="w-5 h-5" />,
  workshop: <GraduationCap className="w-5 h-5" />,
  match: <Trophy className="w-5 h-5" />,
  meeting: <MessageSquare className="w-5 h-5" />,
  other: <Calendar className="w-5 h-5" />,
};

const eventTypeColors: Record<string, string> = {
  training: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  tournament: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20",
  trial: "bg-green-500/10 text-green-700 dark:text-green-500 border-green-500/20",
  camp: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  workshop: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  match: "bg-orange-500/10 text-orange-700 dark:text-orange-500 border-orange-500/20",
  meeting: "bg-gray-500/10 text-muted-foreground border-gray-500/20",
  other: "bg-slate-500/10 text-muted-foreground border-slate-500/20",
};

export default function Events() {
  const { language, isRTL } = useLanguage();
  const { data: dbEvents, isLoading } = trpc.events.getPublic.useQuery();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const content = {
    en: {
      title: "Academy Events",
      subtitle: "Upcoming training, tournaments & more",
      registerNow: "Register Now",
      upcomingEvents: "Upcoming Events",
      heroTitle: "Join Our Academy Events",
      heroSubtitle: "From training camps to tournaments, discover opportunities to develop your skills and showcase your talent",
      filter: "Filter:",
      allEvents: "All Events",
      eventTypes: {
        training: "Training",
        tournament: "Tournament",
        trial: "Trial",
        camp: "Camp",
        workshop: "Workshop",
        match: "Match",
        meeting: "Meeting",
      },
      upcoming: "Upcoming",
      spotsFilled: "spots filled",
      registerInterest: "Register Interest",
      noEventsTitle: "No Events Found",
      noEventsText: "Check back soon for upcoming events!",
      noEventsFiltered: "events scheduled at the moment.",
      ctaTitle: "Can't Find What You're Looking For?",
      ctaSubtitle: "Contact us to learn about private training sessions, custom camps, or to schedule a trial for your child.",
      registerChild: "Register Your Child",
      backToHome: "Back to Home",
      copyright: "© 2024 Future Stars Academy. All rights reserved.",
      sampleEvents: [
        { title: "U-12 Technical Training Camp", description: "Intensive 3-day camp focusing on ball control, passing accuracy, and first touch development. Led by our UEFA-licensed coaches.", location: "Future Stars Academy Training Ground" },
        { title: "Open Trial Day - All Age Groups", description: "Showcase your talent! Open trials for players aged 6-18. Bring your boots, shin guards, and water bottle. Parents welcome to watch.", location: "The Square Compound, New Cairo" },
        { title: "Winter Tournament 2025", description: "Annual inter-academy tournament featuring teams from across Egypt. Compete for the Future Stars FC Cup!", location: "National Sports Stadium" },
        { title: "Goalkeeper Masterclass", description: "Specialized workshop for goalkeepers focusing on positioning, diving technique, and distribution. Limited spots available.", location: "Future Stars Academy Training Ground" },
        { title: "Parents Information Evening", description: "Learn about our academy philosophy, development pathway, and how we support your child's football journey. Q&A session included.", location: "Academy Conference Room" },
        { title: "Weekly Training Session - U-14", description: "Regular training session for U-14 squad members. Focus on tactical awareness and team play.", location: "Future Stars Academy Training Ground" },
      ],
    },
    ar: {
      title: "فعاليات الأكاديمية",
      subtitle: "التدريبات والبطولات القادمة والمزيد",
      registerNow: "سجل الآن",
      upcomingEvents: "الفعاليات القادمة",
      heroTitle: "انضم لفعاليات أكاديميتنا",
      heroSubtitle: "من معسكرات التدريب إلى البطولات، اكتشف فرص تطوير مهاراتك وإظهار موهبتك",
      filter: "تصفية:",
      allEvents: "جميع الفعاليات",
      eventTypes: {
        training: "تدريب",
        tournament: "بطولة",
        trial: "تجربة",
        camp: "معسكر",
        workshop: "ورشة عمل",
        match: "مباراة",
        meeting: "اجتماع",
      },
      upcoming: "قادم",
      spotsFilled: "مقعد محجوز",
      registerInterest: "سجل اهتمامك",
      noEventsTitle: "لا توجد فعاليات",
      noEventsText: "تابعنا قريباً للفعاليات القادمة!",
      noEventsFiltered: "فعاليات مجدولة حالياً.",
      ctaTitle: "لم تجد ما تبحث عنه؟",
      ctaSubtitle: "تواصل معنا للتعرف على جلسات التدريب الخاصة أو المعسكرات المخصصة أو لحجز تجربة لطفلك.",
      registerChild: "سجل طفلك",
      backToHome: "العودة للرئيسية",
      copyright: "© 2024 فيوتشر ستارز. جميع الحقوق محفوظة.",
      sampleEvents: [
        { title: "معسكر التدريب الفني U-12", description: "معسكر مكثف لمدة 3 أيام يركز على التحكم بالكرة ودقة التمرير واللمسة الأولى. بإشراف مدربينا المرخصين من UEFA.", location: "ملعب فيوتشر ستارز" },
        { title: "يوم التجارب المفتوحة - جميع الأعمار", description: "أظهر موهبتك! تجارب مفتوحة للاعبين من 6-18 سنة. أحضر حذاءك وواقي الساق وزجاجة ماء. مرحب بأولياء الأمور.", location: "كمبوند ذا سكوير، القاهرة الجديدة" },
        { title: "بطولة الشتاء 2025", description: "البطولة السنوية بين الأكاديميات من جميع أنحاء مصر. تنافس على كأس فيوتشر ستارز!", location: "الاستاد الرياضي الوطني" },
        { title: "ماستركلاس حراس المرمى", description: "ورشة عمل متخصصة لحراس المرمى تركز على التموضع وتقنية الغطس والتوزيع. أماكن محدودة.", location: "ملعب فيوتشر ستارز" },
        { title: "أمسية معلومات أولياء الأمور", description: "تعرف على فلسفة أكاديميتنا ومسار التطوير وكيف ندعم رحلة طفلك الكروية. جلسة أسئلة وأجوبة.", location: "قاعة المؤتمرات" },
        { title: "جلسة التدريب الأسبوعية - U-14", description: "جلسة تدريب منتظمة لفريق U-14. التركيز على الوعي التكتيكي واللعب الجماعي.", location: "ملعب فيوتشر ستارز" },
      ],
    }
  };

  const c = content[language];

  // Sample events for display when database is empty
  const sampleEvents = [
    { id: 1, eventType: "camp" as const, startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), ageGroups: JSON.stringify(["U-12"]), maxParticipants: 24, currentParticipants: 18, status: "upcoming" as const, ...c.sampleEvents[0] },
    { id: 2, eventType: "trial" as const, startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), endDate: null, ageGroups: JSON.stringify(["U-8", "U-10", "U-12", "U-14", "U-16", "U-18"]), maxParticipants: 100, currentParticipants: 45, status: "upcoming" as const, ...c.sampleEvents[1] },
    { id: 3, eventType: "tournament" as const, startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000), ageGroups: JSON.stringify(["U-14", "U-16"]), maxParticipants: 16, currentParticipants: 12, status: "upcoming" as const, ...c.sampleEvents[2] },
    { id: 4, eventType: "workshop" as const, startDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), endDate: null, ageGroups: JSON.stringify(["U-12", "U-14", "U-16"]), maxParticipants: 12, currentParticipants: 8, status: "upcoming" as const, ...c.sampleEvents[3] },
    { id: 5, eventType: "meeting" as const, startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), endDate: null, ageGroups: null, maxParticipants: 50, currentParticipants: 22, status: "upcoming" as const, ...c.sampleEvents[4] },
    { id: 6, eventType: "training" as const, startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), endDate: null, ageGroups: JSON.stringify(["U-14"]), maxParticipants: null, currentParticipants: null, status: "upcoming" as const, ...c.sampleEvents[5] },
  ];
  
  // Use sample events if database is empty
  const events = dbEvents && dbEvents.length > 0 ? dbEvents : sampleEvents;
  
  const filteredEvents = selectedType 
    ? events.filter(e => e.eventType === selectedType)
    : events;

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getAgeGroups = (ageGroupsJson: string | null) => {
    if (!ageGroupsJson) return [];
    try {
      return JSON.parse(ageGroupsJson);
    } catch {
      return [];
    }
  };

  const eventTypes = ['training', 'tournament', 'trial', 'camp', 'workshop', 'match', 'meeting'];

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <img src="/logo-transparent.png" alt="Future Stars Academy" className="h-10 w-10" />
                <div>
                  <h1 className="text-xl font-bold">{c.title}</h1>
                  <p className="text-sm text-muted-foreground">{c.subtitle}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Link href="/register">
                <Button className="bg-primary hover:bg-primary/90">
                  {c.registerNow}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <CalendarDays className="w-5 h-5" />
            <span className="font-medium">{c.upcomingEvents}</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            {c.heroTitle}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {c.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Filter Section */}
      <section className="py-6 border-b border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <div className="flex items-center gap-2 text-muted-foreground mr-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">{c.filter}</span>
            </div>
            <Button
              variant={selectedType === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType(null)}
              className="whitespace-nowrap"
            >
              {c.allEvents}
            </Button>
            {eventTypes.map(type => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(type)}
                className="whitespace-nowrap capitalize"
              >
                {eventTypeIcons[type]}
                <span className="ml-1">{c.eventTypes[type as keyof typeof c.eventTypes]}</span>
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-muted rounded mb-4" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{c.noEventsTitle}</h3>
              <p className="text-muted-foreground">
                {selectedType 
                  ? `${c.eventTypes[selectedType as keyof typeof c.eventTypes]} ${c.noEventsFiltered}`
                  : c.noEventsText}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge 
                        variant="outline" 
                        className={`${eventTypeColors[event.eventType]} capitalize flex items-center gap-1`}
                      >
                        {eventTypeIcons[event.eventType]}
                        {c.eventTypes[event.eventType as keyof typeof c.eventTypes]}
                      </Badge>
                      {event.status === 'upcoming' && (
                        <Badge variant="secondary" className="bg-green-500/10 text-green-700 dark:text-green-500">
                          {c.upcoming}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-3 group-hover:text-primary transition-colors">
                      {event.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {event.description && (
                      <CardDescription className="line-clamp-3">
                        {event.description}
                      </CardDescription>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>
                          {formatDate(event.startDate)}
                          {event.endDate && ` - ${formatDate(event.endDate)}`}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{formatTime(event.startDate)}</span>
                      </div>
                      
                      {event.location && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 text-primary" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      
                      {event.maxParticipants && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Users className="w-4 h-4 text-primary" />
                          <span>
                            {event.currentParticipants || 0} / {event.maxParticipants} {c.spotsFilled}
                          </span>
                        </div>
                      )}
                    </div>

                    {getAgeGroups(event.ageGroups as string | null).length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {getAgeGroups(event.ageGroups as string | null).map((age: string) => (
                          <Badge key={age} variant="secondary" className="text-xs">
                            {age}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <Link href="/register">
                      <Button className="w-full mt-4" variant="outline">
                        {c.registerInterest}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold mb-4">{c.ctaTitle}</h3>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            {c.ctaSubtitle}
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button className="bg-primary hover:bg-primary/90">
                {c.registerChild}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline">
                {c.backToHome}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>{c.copyright}</p>
        </div>
      </footer>
    </div>
  );
}
