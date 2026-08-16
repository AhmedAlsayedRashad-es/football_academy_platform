import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';
import {
  Video, 
  Search, 
  Filter, 
  Play, 
  BookOpen, 
  Users, 
  Target,
  TrendingUp,
  Shield,
  Globe
, ArrowLeft } from 'lucide-react';

// FIFA Training Centre video categories
const VIDEO_CATEGORIES = [
  {
    id: 'all',
    name: 'All Videos',
    nameAr: 'جميع الفيديوهات',
    icon: Video,
    count: 500
  },
  {
    id: 'coaching',
    name: 'Coaching Perspectives',
    nameAr: 'منظورات التدريب',
    icon: Users,
    count: 45
  },
  {
    id: 'tactics',
    name: 'Tactical Analysis',
    nameAr: 'التحليل التكتيكي',
    icon: Target,
    count: 78
  },
  {
    id: 'technical',
    name: 'Technical Skills',
    nameAr: 'المهارات الفنية',
    icon: TrendingUp,
    count: 120
  },
  {
    id: 'goalkeeping',
    name: 'Goalkeeping',
    nameAr: 'حراسة المرمى',
    icon: Shield,
    count: 56
  },
  {
    id: 'youth',
    name: 'Youth Development',
    nameAr: 'تطوير الشباب',
    icon: BookOpen,
    count: 201
  }
];

// Sample FIFA videos (in production, these would come from an API)
const SAMPLE_VIDEOS = [
  {
    id: 1,
    title: 'Roberto Martínez on the importance of 1v1s',
    titleAr: 'روبرتو مارتينيز عن أهمية المواجهات الفردية',
    category: 'coaching',
    ageGroup: 'All Ages',
    duration: '8:45',
    thumbnail: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
    description: 'Portugal manager discusses developing individual skills and creativity',
    descriptionAr: 'مدرب البرتغال يناقش تطوير المهارات الفردية والإبداع',
    embedUrl: 'https://www.youtube.com/embed/2fPsNFKXzZg',
    tags: ['1v1', 'Creativity', 'Individual Skills']
  },
  {
    id: 2,
    title: 'Building a 4-3-3 Formation',
    titleAr: 'بناء تشكيل 4-3-3',
    category: 'tactics',
    ageGroup: '12-15',
    duration: '12:30',
    thumbnail: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400',
    description: 'Learn how to organize and coach a 4-3-3 formation effectively',
    descriptionAr: 'تعلم كيفية تنظيم وتدريب تشكيل 4-3-3 بفعالية',
    embedUrl: 'https://www.youtube.com/embed/BXoiNjynJhE',
    tags: ['4-3-3', 'Formation', 'Tactics']
  },
  {
    id: 3,
    title: 'Passing Drills for Ages 8-12',
    titleAr: 'تمارين التمرير للأعمار 8-12',
    category: 'technical',
    ageGroup: '8-12',
    duration: '10:15',
    thumbnail: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400',
    description: 'Age-appropriate passing exercises to develop technique',
    descriptionAr: 'تمارين تمرير مناسبة للعمر لتطوير التقنية',
    embedUrl: 'https://www.youtube.com/embed/-V88Iy1X-is',
    tags: ['Passing', 'Youth', 'Drills']
  },
  {
    id: 4,
    title: 'Goalkeeper Positioning Fundamentals',
    titleAr: 'أساسيات موقع حارس المرمى',
    category: 'goalkeeping',
    ageGroup: 'All Ages',
    duration: '9:20',
    thumbnail: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?w=400',
    description: 'Master the basics of goalkeeper positioning and angles',
    descriptionAr: 'إتقان أساسيات موقع حارس المرمى والزوايا',
    embedUrl: 'https://www.youtube.com/embed/bKlB-sSlPIU',
    tags: ['Goalkeeper', 'Positioning', 'Fundamentals']
  },
  {
    id: 5,
    title: 'Play-Practice-Play Methodology',
    titleAr: 'منهجية اللعب-التدريب-اللعب',
    category: 'youth',
    ageGroup: '4-8',
    duration: '11:00',
    thumbnail: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400',
    description: 'Introduction to FIFA\'s recommended coaching approach for young players',
    descriptionAr: 'مقدمة لنهج التدريب الموصى به من FIFA للاعبين الصغار',
    embedUrl: 'https://www.youtube.com/embed/dpF2u-zLG7U',
    tags: ['Youth Development', 'Methodology', 'Grassroots']
  },
  {
    id: 6,
    title: 'Counter-Attacking Strategies',
    titleAr: 'استراتيجيات الهجوم المضاد',
    category: 'tactics',
    ageGroup: '15+',
    duration: '14:25',
    thumbnail: 'https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=400',
    description: 'Learn how to organize and execute effective counter-attacks',
    descriptionAr: 'تعلم كيفية تنظيم وتنفيذ الهجمات المضادة الفعالة',
    embedUrl: 'https://www.youtube.com/embed/jJGwvHb8fWs',
    tags: ['Counter-Attack', 'Tactics', 'Transitions']
  }
];

const AGE_GROUPS = ['All Ages', '4-8', '8-12', '12-15', '15+'];

export default function FIFAVideoLibrary() {
  const [, navigate] = useLocation();
  const { t, language, toggleLanguage } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('All Ages');
  const [selectedVideo, setSelectedVideo] = useState<typeof SAMPLE_VIDEOS[0] | null>(null);

  const filteredVideos = SAMPLE_VIDEOS.filter(video => {
    const matchesSearch = language === 'en'
      ? video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase())
      : video.titleAr.includes(searchQuery) ||
        video.descriptionAr.includes(searchQuery);
    
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    const matchesAgeGroup = selectedAgeGroup === 'All Ages' || video.ageGroup === selectedAgeGroup;
    
    return matchesSearch && matchesCategory && matchesAgeGroup;
  });

  return (
    <>
    <div >
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Video className="h-12 w-12 text-purple-600" />
                      <BackButton />
          <h1 className="brand-gradient text-4xl md:text-5xl font-bold bg-clip-text text-transparent">
              {language === 'en' ? 'FIFA Training Centre' : 'مركز FIFA التدريبي'}
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {language === 'en' 
              ? 'Access 500+ professional training videos from FIFA coaches and experts'
              : 'الوصول إلى أكثر من 500 فيديو تدريبي احترافي من مدربي وخبراء FIFA'}
          </p>
        </div>

        {/* Language Toggle & External Link */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-muted-foreground" />
            <Button
              variant={language === 'en' ? 'default' : 'outline'}
              onClick={() => language !== 'en' && toggleLanguage()}
              size="sm"
            >
              English
            </Button>
            <Button
              variant={language === 'ar' ? 'default' : 'outline'}
              onClick={() => language !== 'ar' && toggleLanguage()}
              size="sm"
            >
              العربية
            </Button>
          </div>

          <Button variant="outline" size="sm" asChild>
            <a href="https://www.fifatrainingcentre.com/" target="_blank" rel="noopener noreferrer">
              <Video className="h-4 w-4 mr-2" />
              {language === 'en' ? 'Visit FIFA Training Centre' : 'زيارة مركز FIFA التدريبي'}
            </a>
          </Button>
        </div>

        {/* Search & Filters */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder={language === 'en' ? 'Search videos...' : 'البحث في الفيديوهات...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Age Group Filter */}
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {language === 'en' ? 'Age Group:' : 'الفئة العمرية:'}
            </span>
            {AGE_GROUPS.map(age => (
              <Button
                key={age}
                variant={selectedAgeGroup === age ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedAgeGroup(age)}
              >
                {age}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-8">
          <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
            {VIDEO_CATEGORIES.map(category => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {language === 'en' ? category.name : category.nameAr}
                  </span>
                  <Badge variant="secondary" className="ml-1">{category.count}</Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(video => (
            <Card 
              key={video.id}
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500"
              onClick={() => setSelectedVideo(video)}
            >
              <div className="relative">
                <img 
                  src={video.thumbnail} 
                  alt={language === 'en' ? video.title : video.titleAr}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-t-lg">
                  <Play className="h-16 w-16 text-foreground" />
                </div>
                <Badge className="absolute top-2 right-2 bg-purple-600">
                  {video.duration}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className={`text-lg ${language === 'ar' ? 'text-right' : ''}`}>
                  {language === 'en' ? video.title : video.titleAr}
                </CardTitle>
                <CardDescription className={language === 'ar' ? 'text-right' : ''}>
                  {language === 'en' ? video.description : video.descriptionAr}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{video.ageGroup}</Badge>
                  {video.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="secondary">{tag}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredVideos.length === 0 && (
          <div className="text-center py-12">
            <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              {language === 'en' ? 'No videos found matching your search.' : 'لم يتم العثور على فيديوهات مطابقة لبحثك.'}
            </p>
          </div>
        )}

        {/* Video Player Modal */}
        {selectedVideo && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedVideo(null)}
          >
            <div 
              className="bg-white dark:bg-slate-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold">
                    {language === 'en' ? selectedVideo.title : selectedVideo.titleAr}
                  </h2>
                  <Button variant="ghost" onClick={() => setSelectedVideo(null)}>
                    ✕
                  </Button>
                </div>
                
                <div className="aspect-video bg-black rounded-lg mb-4">
                  <iframe
                    src={selectedVideo.embedUrl}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                    title={selectedVideo.title}
                  />
                </div>

                <p className="text-muted-foreground mb-4">
                  {language === 'en' ? selectedVideo.description : selectedVideo.descriptionAr}
                </p>

                <div className="flex flex-wrap gap-2">
                  <Badge>{selectedVideo.ageGroup}</Badge>
                  <Badge variant="secondary">{selectedVideo.duration}</Badge>
                  {selectedVideo.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">{tag}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FIFA Training Centre Info */}
        <div className="mt-12">
          <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4 mb-4">
                <Video className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-lg">
                    {language === 'en' ? 'About FIFA Training Centre' : 'عن مركز FIFA التدريبي'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'en' 
                      ? 'Official FIFA platform for coach education and development'
                      : 'المنصة الرسمية لـ FIFA لتعليم وتطوير المدربين'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {language === 'en'
                  ? 'The FIFA Training Centre provides world-class coaching content, including training sessions, tactical analysis, and expert insights from top coaches and technical leaders around the globe.'
                  : 'يوفر مركز FIFA التدريبي محتوى تدريبي عالمي المستوى، بما في ذلك جلسات التدريب والتحليل التكتيكي ورؤى الخبراء من كبار المدربين والقادة الفنيين حول العالم.'}
              </p>
              <Button variant="outline" asChild>
                <a href="https://www.fifatrainingcentre.com/" target="_blank" rel="noopener noreferrer">
                  {language === 'en' ? 'Explore More on FIFA.com' : 'استكشف المزيد على FIFA.com'}
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    </>
  );
}
