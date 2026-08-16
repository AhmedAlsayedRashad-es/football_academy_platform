import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';
import {Video, 
  BookOpen, 
  Trophy, 
  Users, 
  Calendar, 
  TrendingUp,
  Star,
  Play,
  FileText,
  Award,
  Target,
  Zap, ArrowLeft} from 'lucide-react';

export default function Explore() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();

  const exploreCategories = [
    {
      id: 'training-videos',
      icon: Video,
      titleEn: 'Training Videos',
      titleAr: 'فيديوهات التدريب',
      descriptionEn: 'Professional training drills and techniques',
      descriptionAr: 'تمارين وتقنيات تدريبية احترافية',
      count: 150,
      color: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      path: '/coach-education/videos'
    },
    {
      id: 'courses',
      icon: BookOpen,
      titleEn: 'Coaching Courses',
      titleAr: 'دورات التدريب',
      descriptionEn: 'FIFA and UEFA certified coaching programs',
      descriptionAr: 'برامج تدريبية معتمدة من الفيفا واليويفا',
      count: 25,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      path: '/coach-education/courses'
    },
    {
      id: 'challenges',
      icon: Trophy,
      titleEn: 'Weekly Challenges',
      titleAr: 'التحديات الأسبوعية',
      descriptionEn: 'Compete with others and earn rewards',
      descriptionAr: 'تنافس مع الآخرين واكسب المكافآت',
      count: 8,
      color: 'text-yellow-700 dark:text-yellow-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      path: '/gamification'
    },
    {
      id: 'community',
      icon: Users,
      titleEn: 'Community',
      titleAr: 'المجتمع',
      descriptionEn: 'Connect with coaches and players',
      descriptionAr: 'تواصل مع المدربين واللاعبين',
      count: 500,
      color: 'text-green-700 dark:text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      path: '/community'
    },
    {
      id: 'events',
      icon: Calendar,
      titleEn: 'Upcoming Events',
      titleAr: 'الفعاليات القادمة',
      descriptionEn: 'Tournaments, workshops, and camps',
      descriptionAr: 'البطولات وورش العمل والمعسكرات',
      count: 12,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
      path: '/events'
    },
    {
      id: 'performance',
      icon: TrendingUp,
      titleEn: 'Performance Analytics',
      titleAr: 'تحليلات الأداء',
      descriptionEn: 'Track your progress and stats',
      descriptionAr: 'تتبع تقدمك وإحصائياتك',
      count: null,
      color: 'text-orange-700 dark:text-orange-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
      path: '/performance-dashboard'
    }
  ];

  const featuredContent = [
    {
      type: 'video',
      titleEn: 'Advanced Passing Techniques',
      titleAr: 'تقنيات التمرير المتقدمة',
      author: 'Coach Ahmed',
      views: 1250,
      rating: 4.8
    },
    {
      type: 'course',
      titleEn: 'Youth Development Strategies',
      titleAr: 'استراتيجيات تطوير الشباب',
      author: 'FIFA Academy',
      views: 850,
      rating: 4.9
    },
    {
      type: 'article',
      titleEn: 'Building Team Chemistry',
      titleAr: 'بناء كيمياء الفريق',
      author: 'Coach Sarah',
      views: 620,
      rating: 4.7
    }
  ];

  return (
    <>
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        
        <BackButton />
<h1 className="text-4xl font-bold mb-2">
          {language === 'ar' ? 'استكشف' : 'Explore'}
        </h1>
        <p className="text-muted-foreground">
          {language === 'ar' ? 'اكتشف محتوى جديد وطور مهاراتك' : 'Discover new content and develop your skills'}
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
        {exploreCategories.map((category) => {
          const Icon = category.icon;
          return (
            <Card 
              key={category.id} 
              className={`hover:shadow-lg transition-all cursor-pointer ${category.bgColor} border-2`}
              onClick={() => navigate(category.path)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${category.bgColor}`}>
                    <Icon className={`h-6 w-6 ${category.color}`} />
                  </div>
                  {category.count && (
                    <Badge variant="secondary">{category.count}+</Badge>
                  )}
                </div>
                <CardTitle className="mt-4">
                  {language === 'ar' ? category.titleAr : category.titleEn}
                </CardTitle>
                <CardDescription>
                  {language === 'ar' ? category.descriptionAr : category.descriptionEn}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="ghost" className="w-full">
                  {language === 'ar' ? 'استكشف' : 'Explore'} →
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Featured Content */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          {language === 'ar' ? 'محتوى مميز' : 'Featured Content'}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {featuredContent.map((content, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  {content.type === 'video' && <Video className="h-4 w-4 text-red-500" />}
                  {content.type === 'course' && <BookOpen className="h-4 w-4 text-blue-500" />}
                  {content.type === 'article' && <FileText className="h-4 w-4 text-green-700 dark:text-green-500" />}
                  <Badge variant="outline" className="text-xs">
                    {content.type.toUpperCase()}
                  </Badge>
                </div>
                <CardTitle className="text-lg">
                  {language === 'ar' ? content.titleAr : content.titleEn}
                </CardTitle>
                <CardDescription>{content.author}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Play className="h-3 w-3" />
                    {content.views} {language === 'ar' ? 'مشاهدة' : 'views'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-700 dark:text-yellow-500" />
                    {content.rating}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'ابدأ رحلتك التعليمية' : 'Start your learning journey'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <Button variant="outline" className="justify-start">
              <Zap className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'ابدأ دورة' : 'Start a Course'}
            </Button>
            <Button variant="outline" className="justify-start">
              <Target className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'انضم لتحدي' : 'Join Challenge'}
            </Button>
            <Button variant="outline" className="justify-start">
              <Award className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'اكسب شارة' : 'Earn Badge'}
            </Button>
            <Button variant="outline" className="justify-start">
              <Users className="h-4 w-4 mr-2" />
              {language === 'ar' ? 'انضم للمجتمع' : 'Join Community'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
