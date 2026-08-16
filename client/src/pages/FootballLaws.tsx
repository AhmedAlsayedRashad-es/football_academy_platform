import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Book, Search, Download, PlayCircle, FileText, Globe, Languages , ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useLocation } from 'wouter';
import { BackButton } from '@/components/BackButton';


// The 17 Laws of Football
const FOOTBALL_LAWS = [
  {
    number: 1,
    titleEn: "The Field of Play",
    titleAr: "ملعب اللعب",
    summaryEn: "Defines the dimensions, markings, and specifications of the football field including goals, penalty areas, and center circle.",
    summaryAr: "يحدد أبعاد وعلامات ومواصفات ملعب كرة القدم بما في ذلك المرمى ومنطقة الجزاء ودائرة المنتصف.",
    icon: "🏟️",
    category: "Field & Equipment"
  },
  {
    number: 2,
    titleEn: "The Ball",
    titleAr: "الكرة",
    summaryEn: "Specifies the size, weight, material, and pressure requirements for the match ball.",
    summaryAr: "يحدد حجم ووزن ومادة ومتطلبات ضغط كرة المباراة.",
    icon: "⚽",
    category: "Field & Equipment"
  },
  {
    number: 3,
    titleEn: "The Players",
    titleAr: "اللاعبون",
    summaryEn: "Covers the number of players, substitution procedures, and player obligations including captain responsibilities.",
    summaryAr: "يغطي عدد اللاعبين وإجراءات الاستبدال والتزامات اللاعبين بما في ذلك مسؤوليات القائد.",
    icon: "👥",
    category: "Players & Officials"
  },
  {
    number: 4,
    titleEn: "The Players' Equipment",
    titleAr: "معدات اللاعبين",
    summaryEn: "Defines required and prohibited equipment, safety standards, and jersey regulations.",
    summaryAr: "يحدد المعدات المطلوبة والممنوعة ومعايير السلامة ولوائح القمصان.",
    icon: "👕",
    category: "Players & Officials"
  },
  {
    number: 5,
    titleEn: "The Referee",
    titleAr: "الحكم",
    summaryEn: "Establishes the referee's authority, powers, and duties during the match.",
    summaryAr: "يحدد سلطة الحكم وصلاحياته وواجباته أثناء المباراة.",
    icon: "👨‍⚖️",
    category: "Players & Officials"
  },
  {
    number: 6,
    titleEn: "The Other Match Officials",
    titleAr: "مساعدو الحكم الآخرون",
    summaryEn: "Describes the roles of assistant referees, fourth official, VAR, and additional assistant referees.",
    summaryAr: "يصف أدوار مساعدي الحكم والحكم الرابع وتقنية VAR ومساعدي الحكم الإضافيين.",
    icon: "🚩",
    category: "Players & Officials"
  },
  {
    number: 7,
    titleEn: "The Duration of the Match",
    titleAr: "مدة المباراة",
    summaryEn: "Specifies match periods, half-time interval, and added time procedures.",
    summaryAr: "يحدد فترات المباراة وفترة الاستراحة وإجراءات الوقت الإضافي.",
    icon: "⏱️",
    category: "Match Procedures"
  },
  {
    number: 8,
    titleEn: "The Start and Restart of Play",
    titleAr: "بدء اللعب واستئنافه",
    summaryEn: "Covers kick-off procedures and dropped ball situations.",
    summaryAr: "يغطي إجراءات ضربة البداية ومواقف الكرة الساقطة.",
    icon: "🎯",
    category: "Match Procedures"
  },
  {
    number: 9,
    titleEn: "The Ball In and Out of Play",
    titleAr: "الكرة داخل وخارج اللعب",
    summaryEn: "Defines when the ball is in play and when it is out of play.",
    summaryAr: "يحدد متى تكون الكرة في اللعب ومتى تكون خارج اللعب.",
    icon: "🔄",
    category: "Match Procedures"
  },
  {
    number: 10,
    titleEn: "Determining the Outcome",
    titleAr: "تحديد نتيجة المباراة",
    summaryEn: "Explains how goals are scored, how winners are determined, and penalty shootout procedures.",
    summaryAr: "يشرح كيفية تسجيل الأهداف وتحديد الفائزين وإجراءات ركلات الترجيح.",
    icon: "🏆",
    category: "Match Procedures"
  },
  {
    number: 11,
    titleEn: "Offside",
    titleAr: "التسلل",
    summaryEn: "Defines offside position and offside offence, including exceptions.",
    summaryAr: "يحدد موقف التسلل ومخالفة التسلل بما في ذلك الاستثناءات.",
    icon: "🚫",
    category: "Fouls & Misconduct"
  },
  {
    number: 12,
    titleEn: "Fouls and Misconduct",
    titleAr: "الأخطاء وسوء السلوك",
    summaryEn: "Lists all types of fouls, misconduct, and disciplinary sanctions including yellow and red cards.",
    summaryAr: "يسرد جميع أنواع الأخطاء وسوء السلوك والعقوبات التأديبية بما في ذلك البطاقات الصفراء والحمراء.",
    icon: "🟨🟥",
    category: "Fouls & Misconduct"
  },
  {
    number: 13,
    titleEn: "Free Kicks",
    titleAr: "الركلات الحرة",
    summaryEn: "Explains direct and indirect free kicks, their procedures, and requirements.",
    summaryAr: "يشرح الركلات الحرة المباشرة وغير المباشرة وإجراءاتها ومتطلباتها.",
    icon: "🦵",
    category: "Restarts"
  },
  {
    number: 14,
    titleEn: "The Penalty Kick",
    titleAr: "ركلة الجزاء",
    summaryEn: "Details penalty kick procedures, player positions, and goalkeeper restrictions.",
    summaryAr: "تفاصيل إجراءات ركلة الجزاء ومواقف اللاعبين وقيود حارس المرمى.",
    icon: "⚡",
    category: "Restarts"
  },
  {
    number: 15,
    titleEn: "The Throw-In",
    titleAr: "رمية التماس",
    summaryEn: "Specifies throw-in procedures, technique requirements, and infringements.",
    summaryAr: "يحدد إجراءات رمية التماس ومتطلبات التقنية والمخالفات.",
    icon: "🤾",
    category: "Restarts"
  },
  {
    number: 16,
    titleEn: "The Goal Kick",
    titleAr: "ركلة المرمى",
    summaryEn: "Explains when and how goal kicks are taken.",
    summaryAr: "يشرح متى وكيف يتم تنفيذ ركلات المرمى.",
    icon: "🥅",
    category: "Restarts"
  },
  {
    number: 17,
    titleEn: "The Corner Kick",
    titleAr: "الركلة الركنية",
    summaryEn: "Describes corner kick procedures and requirements.",
    summaryAr: "يصف إجراءات ومتطلبات الركلة الركنية.",
    icon: "📐",
    category: "Restarts"
  }
];

const CATEGORIES = [
  "All",
  "Field & Equipment",
  "Players & Officials",
  "Match Procedures",
  "Fouls & Misconduct",
  "Restarts"
];

export default function FootballLaws() {
  const [, navigate] = useLocation();
  const { language, toggleLanguage } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLaw, setSelectedLaw] = useState<number | null>(null);

  const filteredLaws = FOOTBALL_LAWS.filter(law => {
    const matchesSearch = language === 'en' 
      ? law.titleEn.toLowerCase().includes(searchQuery.toLowerCase()) || 
        law.summaryEn.toLowerCase().includes(searchQuery.toLowerCase())
      : law.titleAr.includes(searchQuery) || 
        law.summaryAr.includes(searchQuery);
    
    const matchesCategory = selectedCategory === 'All' || law.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <>
    <div >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Book className="h-12 w-12 text-blue-600" />
                      <BackButton />
          <h1 className="brand-gradient text-4xl md:text-5xl font-bold bg-clip-text text-transparent">
              {language === 'en' ? 'Laws of the Game' : 'قوانين اللعبة'}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {language === 'en' 
              ? 'The 17 official laws of football as defined by IFAB (International Football Association Board)'
              : 'القوانين الـ17 الرسمية لكرة القدم كما حددها مجلس الاتحاد الدولي لكرة القدم (IFAB)'}
          </p>
        </div>

        {/* Language Toggle & Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <Button 
            onClick={toggleLanguage}
            variant="outline"
            size="lg"
            className="border-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300"
          >
            <Languages className="w-5 h-5 mr-2" />
            {language === 'en' ? 'عربي' : 'English'}
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="https://www.theifab.com/laws-of-the-game-documents/" target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-2" />
                {language === 'en' ? 'Download PDF' : 'تحميل PDF'}
              </a>
            </Button>
            <Button variant="outline" size="sm">
              <PlayCircle className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Video Tutorials' : 'دروس فيديو'}
            </Button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={language === 'en' ? 'Search laws...' : 'البحث في القوانين...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)} style={{color: '#ffffff'}}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Laws Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLaws.map(law => (
            <Card 
              key={law.number}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500"
              onClick={() => setSelectedLaw(law.number)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="text-4xl">{law.icon}</div>
                  <Badge variant="secondary">
                    {language === 'en' ? `Law ${law.number}` : `القانون ${law.number}`}
                  </Badge>
                </div>
                <CardTitle className={language === 'ar' ? 'text-right' : ''}>
                  {language === 'en' ? law.titleEn : law.titleAr}
                </CardTitle>
                <CardDescription className={language === 'ar' ? 'text-right' : ''}>
                  {language === 'en' ? law.summaryEn : law.summaryAr}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{law.category}</Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`https://www.theifab.com/laws/latest/the-field-of-play/`, '_blank')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {language === 'en' ? 'Read More' : 'اقرأ المزيد'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredLaws.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              {language === 'en' ? 'No laws found matching your search.' : 'لم يتم العثور على قوانين مطابقة لبحثك.'}
            </p>
          </div>
        )}

        {/* IFAB Reference */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'en' 
                  ? 'Official source: International Football Association Board (IFAB)'
                  : 'المصدر الرسمي: مجلس الاتحاد الدولي لكرة القدم (IFAB)'}
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.theifab.com/" target="_blank" rel="noopener noreferrer">
                    {language === 'en' ? 'Visit IFAB Website' : 'زيارة موقع IFAB'}
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://www.theifab.com/laws-of-the-game-documents/" target="_blank" rel="noopener noreferrer">
                    {language === 'en' ? 'Download Official PDFs' : 'تحميل ملفات PDF الرسمية'}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
