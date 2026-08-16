import { useState, useRef } from 'react';
import { Link , useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import VideoUploadModal from '@/components/VideoUploadModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ArrowLeft, Play, Clock, Target, Star, Search, Filter,
  Dumbbell, Footprints, Crosshair, Zap, MapPin, Trophy,
  ChevronRight, CheckCircle2, Lock, Sparkles, X, Upload, Video, Eye
} from 'lucide-react';

// Drill categories with icons and colors
const CATEGORIES = [
  { id: 'all', label: 'All Drills', labelAr: 'جميع التمارين', icon: Dumbbell, color: 'bg-cyan-500' },
  { id: 'ball_control', label: 'Ball Control', labelAr: 'التحكم بالكرة', icon: Footprints, color: 'bg-green-500' },
  { id: 'passing', label: 'Passing & First Touch', labelAr: 'التمرير واللمسة الأولى', icon: Target, color: 'bg-blue-500' },
  { id: 'shooting', label: 'Shooting & Finishing', labelAr: 'التسديد والإنهاء', icon: Crosshair, color: 'bg-red-500' },
  { id: 'dribbling', label: 'Dribbling & 1v1', labelAr: 'المراوغة و1ضد1', icon: Zap, color: 'bg-yellow-500' },
  { id: 'speed_agility', label: 'Speed & Agility', labelAr: 'السرعة والرشاقة', icon: Zap, color: 'bg-purple-500' },
  { id: 'positioning', label: 'Positioning & Tactical', labelAr: 'التمركز والتكتيك', icon: MapPin, color: 'bg-orange-500' },
  { id: 'goalkeeper', label: 'Goalkeeper', labelAr: 'حارس المرمى', icon: Trophy, color: 'bg-pink-500' },
];

const DIFFICULTY_LABELS = {
  beginner: { en: 'Beginner', ar: 'مبتدئ', color: 'bg-green-500' },
  intermediate: { en: 'Intermediate', ar: 'متوسط', color: 'bg-yellow-500' },
  advanced: { en: 'Advanced', ar: 'متقدم', color: 'bg-orange-500' },
  elite: { en: 'Elite', ar: 'نخبة', color: 'bg-red-500' },
};

// Mock drills data (will be replaced with real data from database)
const MOCK_DRILLS = [
  {
    id: 1,
    title: 'Cone Dribbling Circuit',
    titleAr: 'دائرة المراوغة بالأقماع',
    description: 'Improve close ball control and quick feet through a series of cone obstacles.',
    descriptionAr: 'تحسين التحكم القريب بالكرة وسرعة القدمين من خلال سلسلة من عوائق الأقماع.',
    category: 'ball_control',
    difficulty: 'beginner',
    duration: 15,
    videoUrl: 'https://www.youtube.com/embed/QqjaavLXdHs',
    thumbnailUrl: 'https://img.youtube.com/vi/QqjaavLXdHs/hqdefault.jpg',
    pointsReward: 15,
    targetsBallControl: true,
    targetsDribbling: true,
    viewCount: 1250,
    completionCount: 890,
    avgRating: 92,
  },
  {
    id: 2,
    title: 'Wall Pass Mastery',
    titleAr: 'إتقان التمريرة الجدارية',
    description: 'Practice one-touch passing and first touch control against a wall or rebounder.',
    descriptionAr: 'تدرب على التمريرة باللمسة الواحدة والتحكم باللمسة الأولى ضد الحائط.',
    category: 'passing',
    difficulty: 'intermediate',
    duration: 20,
    videoUrl: 'https://www.youtube.com/embed/-V88Iy1X-is',
    thumbnailUrl: 'https://img.youtube.com/vi/-V88Iy1X-is/hqdefault.jpg',
    pointsReward: 20,
    targetsPassing: true,
    targetsFirstTouch: true,
    viewCount: 980,
    completionCount: 650,
    avgRating: 88,
  },
  {
    id: 3,
    title: 'Finishing Under Pressure',
    titleAr: 'الإنهاء تحت الضغط',
    description: 'Simulate match scenarios with quick shots after receiving the ball.',
    descriptionAr: 'محاكاة سيناريوهات المباراة مع تسديدات سريعة بعد استلام الكرة.',
    category: 'shooting',
    difficulty: 'advanced',
    duration: 25,
    videoUrl: 'https://www.youtube.com/embed/s9YMGhu-xfY',
    thumbnailUrl: 'https://img.youtube.com/vi/s9YMGhu-xfY/hqdefault.jpg',
    pointsReward: 30,
    targetsShooting: true,
    targetsPositioning: true,
    viewCount: 1500,
    completionCount: 420,
    avgRating: 95,
  },
  {
    id: 4,
    title: '1v1 Attack Moves',
    titleAr: 'حركات الهجوم 1ضد1',
    description: 'Learn essential moves to beat defenders: step-overs, feints, and body movements.',
    descriptionAr: 'تعلم الحركات الأساسية للتغلب على المدافعين: الخطوات الوهمية والمراوغات.',
    category: 'dribbling',
    difficulty: 'intermediate',
    duration: 20,
    videoUrl: 'https://www.youtube.com/embed/2fPsNFKXzZg',
    thumbnailUrl: 'https://img.youtube.com/vi/2fPsNFKXzZg/hqdefault.jpg',
    pointsReward: 25,
    targetsDribbling: true,
    targetsSpeed: true,
    viewCount: 2100,
    completionCount: 1200,
    avgRating: 94,
  },
  {
    id: 5,
    title: 'Speed Ladder Drills',
    titleAr: 'تمارين سلم السرعة',
    description: 'Improve footwork speed and coordination with ladder exercises.',
    descriptionAr: 'تحسين سرعة القدمين والتنسيق مع تمارين السلم.',
    category: 'speed_agility',
    difficulty: 'beginner',
    duration: 15,
    videoUrl: 'https://www.youtube.com/embed/kohO8MIcM2M',
    thumbnailUrl: 'https://img.youtube.com/vi/kohO8MIcM2M/hqdefault.jpg',
    pointsReward: 15,
    targetsSpeed: true,
    viewCount: 1800,
    completionCount: 1400,
    avgRating: 90,
  },
  {
    id: 6,
    title: 'Defensive Positioning',
    titleAr: 'التمركز الدفاعي',
    description: 'Learn proper body positioning and angles when defending.',
    descriptionAr: 'تعلم وضعية الجسم الصحيحة والزوايا عند الدفاع.',
    category: 'positioning',
    difficulty: 'intermediate',
    duration: 20,
    videoUrl: 'https://www.youtube.com/embed/jJGwvHb8fWs',
    thumbnailUrl: 'https://img.youtube.com/vi/jJGwvHb8fWs/hqdefault.jpg',
    pointsReward: 20,
    targetsPositioning: true,
    viewCount: 750,
    completionCount: 380,
    avgRating: 86,
  },
  {
    id: 7,
    title: 'Goalkeeper Diving Technique',
    titleAr: 'تقنية الغوص للحارس',
    description: 'Master the proper diving technique to save shots in all corners.',
    descriptionAr: 'إتقان تقنية الغوص الصحيحة لإنقاذ التسديدات في جميع الزوايا.',
    category: 'goalkeeper',
    difficulty: 'advanced',
    duration: 30,
    videoUrl: 'https://www.youtube.com/embed/bKlB-sSlPIU',
    thumbnailUrl: 'https://img.youtube.com/vi/bKlB-sSlPIU/hqdefault.jpg',
    pointsReward: 35,
    viewCount: 620,
    completionCount: 280,
    avgRating: 93,
  },
  {
    id: 8,
    title: 'Rondo Passing Game',
    titleAr: 'لعبة الروندو للتمرير',
    description: 'Classic possession game to improve quick passing and movement.',
    descriptionAr: 'لعبة الاستحواذ الكلاسيكية لتحسين التمرير السريع والحركة.',
    category: 'passing',
    difficulty: 'elite',
    duration: 25,
    videoUrl: 'https://www.youtube.com/embed/yEcxh0gEtjE',
    thumbnailUrl: 'https://img.youtube.com/vi/yEcxh0gEtjE/hqdefault.jpg',
    pointsReward: 40,
    targetsPassing: true,
    targetsPositioning: true,
    targetsFirstTouch: true,
    viewCount: 3200,
    completionCount: 890,
    avgRating: 97,
  },
  {
    id: 9,
    title: 'Explosive Sprint Training',
    titleAr: 'تدريب السرعة الانفجارية',
    description: 'Develop explosive acceleration and top speed for match situations.',
    descriptionAr: 'تطوير التسارع الانفجاري والسرعة القصوى لمواقف المباراة.',
    category: 'speed_agility',
    difficulty: 'advanced',
    duration: 20,
    videoUrl: 'https://www.youtube.com/embed/lagdObfKtbA',
    thumbnailUrl: 'https://img.youtube.com/vi/lagdObfKtbA/hqdefault.jpg',
    pointsReward: 30,
    targetsSpeed: true,
    viewCount: 1650,
    completionCount: 720,
    avgRating: 91,
  },
  {
    id: 10,
    title: 'Heading Accuracy Drill',
    titleAr: 'تمرين دقة الرأسيات',
    description: 'Improve heading technique and accuracy for both attacking and defensive headers.',
    descriptionAr: 'تحسين تقنية الرأسيات والدقة للرأسيات الهجومية والدفاعية.',
    category: 'heading',
    difficulty: 'intermediate',
    duration: 15,
    videoUrl: 'https://www.youtube.com/embed/40i5EZ26gGQ',
    thumbnailUrl: 'https://img.youtube.com/vi/40i5EZ26gGQ/hqdefault.jpg',
    pointsReward: 20,
    targetsHeading: true,
    viewCount: 890,
    completionCount: 450,
    avgRating: 85,
  },
  {
    id: 11,
    title: 'First Touch Control',
    titleAr: 'التحكم باللمسة الأولى',
    description: 'Master receiving the ball from different angles and heights.',
    descriptionAr: 'إتقان استلام الكرة من زوايا وارتفاعات مختلفة.',
    category: 'ball_control',
    difficulty: 'intermediate',
    duration: 20,
    videoUrl: 'https://www.youtube.com/embed/DugiSbxgqzE',
    thumbnailUrl: 'https://img.youtube.com/vi/DugiSbxgqzE/hqdefault.jpg',
    pointsReward: 25,
    targetsBallControl: true,
    targetsFirstTouch: true,
    viewCount: 2400,
    completionCount: 1600,
    avgRating: 94,
  },
  {
    id: 12,
    title: 'Volley Finishing',
    titleAr: 'الإنهاء بالطائرة',
    description: 'Perfect your volley technique for spectacular goals.',
    descriptionAr: 'أتقن تقنية الضربة الطائرة للأهداف المذهلة.',
    category: 'shooting',
    difficulty: 'elite',
    duration: 25,
    videoUrl: 'https://www.youtube.com/embed/s9YMGhu-xfY',
    thumbnailUrl: 'https://img.youtube.com/vi/s9YMGhu-xfY/hqdefault.jpg',
    pointsReward: 45,
    targetsShooting: true,
    viewCount: 1100,
    completionCount: 320,
    avgRating: 96,
  },
];

// Mock recommended drills based on AI analysis
const MOCK_RECOMMENDATIONS = [
  { drillId: 1, reason: 'Based on your video analysis, improving ball control will help your overall game.', reasonAr: 'بناءً على تحليل الفيديو، تحسين التحكم بالكرة سيساعد لعبك بشكل عام.' },
  { drillId: 4, reason: 'Your 1v1 situations showed room for improvement in dribbling moves.', reasonAr: 'أظهرت مواقف 1ضد1 مجالاً للتحسين في حركات المراوغة.' },
  { drillId: 5, reason: 'Increasing your sprint speed will enhance your attacking runs.', reasonAr: 'زيادة سرعة العدو ستعزز هجماتك.' },
];

export default function TrainingLibrary() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === 'ar';
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDrill, setSelectedDrill] = useState<typeof MOCK_DRILLS[0] | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [completedDrills, setCompletedDrills] = useState<number[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'drills' | 'videos'>('drills');
  const videoRef = useRef<HTMLIFrameElement>(null);

  // Check if user is coach or admin
  const isStaff = user?.role === 'admin' || user?.role === 'coach';

  // Fetch published training videos
  const { data: trainingVideos = [], refetch: refetchVideos } = trpc.trainingVideos.getPublished.useQuery(
    { category: selectedCategory === 'all' ? undefined : selectedCategory },
    { enabled: activeTab === 'videos' }
  );

  // Filter drills based on category and search
  const filteredDrills = MOCK_DRILLS.filter(drill => {
    const matchesCategory = selectedCategory === 'all' || drill.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      drill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drill.titleAr?.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // Get recommended drills
  const recommendedDrills = MOCK_RECOMMENDATIONS.map(rec => ({
    ...rec,
    drill: MOCK_DRILLS.find(d => d.id === rec.drillId)!
  })).filter(rec => rec.drill);

  const handleCompleteDrill = (drillId: number) => {
    if (!completedDrills.includes(drillId)) {
      setCompletedDrills([...completedDrills, drillId]);
      const drill = MOCK_DRILLS.find(d => d.id === drillId);
      if (drill) {
        toast.success(
          isRTL 
            ? `أحسنت! حصلت على ${drill.pointsReward} نقطة` 
            : `Great job! You earned ${drill.pointsReward} points`
        );
      }
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.icon || Dumbbell;
  };

  const getCategoryColor = (categoryId: string) => {
    const category = CATEGORIES.find(c => c.id === categoryId);
    return category?.color || 'bg-gray-500';
  };

  return (
    <>
    <div className={` ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-background text-foreground sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-foreground hover:bg-card"
                onClick={() => navigate('/training')}
              >
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
              </Button>
              <Link href="/">
                <img src="/logo-transparent.png" alt="Future Stars Academy" className="h-10" />
              </Link>
              <div className="flex items-center gap-2">
                <Dumbbell className="h-6 w-6 text-cyan-700 dark:text-cyan-400" />
                <h1 className="text-xl font-bold">{isRTL ? 'مكتبة التمارين' : 'Training Library'}</h1>
              </div>
            </div>
            {isStaff && (
              <Button
                onClick={() => setShowUploadModal(true)}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isRTL ? 'رفع فيديو' : 'Upload Video'}
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Tabs for Drills vs Videos */}
      <div className="container pt-4">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'drills' ? 'default' : 'outline'}
            onClick={() => setActiveTab('drills')}
            className={activeTab === 'drills' ? 'bg-cyan-600' : 'border-border text-muted-foreground'}
          >
            <Dumbbell className="h-4 w-4 mr-2" />
            {isRTL ? 'التمارين' : 'Drills'}
          </Button>
          <Button
            variant={activeTab === 'videos' ? 'default' : 'outline'}
            onClick={() => setActiveTab('videos')}
            className={activeTab === 'videos' ? 'bg-cyan-600' : 'border-border text-muted-foreground'}
          >
            <Video className="h-4 w-4 mr-2" />
            {isRTL ? 'فيديوهات تدريبية' : 'Training Videos'}
            {trainingVideos.length > 0 && (
              <Badge className="ml-2 bg-cyan-500">{trainingVideos.length}</Badge>
            )}
          </Button>
        </div>
      </div>

      {activeTab === 'drills' && (
      <div className="container py-6 space-y-6">
        {/* Search and Filter */}
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isRTL ? 'ابحث عن تمرين...' : 'Search drills...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-muted border-border text-foreground"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className={`whitespace-nowrap ${
                        selectedCategory === category.id 
                          ? `${category.color} text-white` 
                          : 'border-border text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      {isRTL ? category.labelAr : category.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recommended For You Section */}
        {recommendedDrills.length > 0 && selectedCategory === 'all' && (
          <Card className="brand-gradient-subtle border-cyan-700">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                {isRTL ? 'موصى به لك' : 'Recommended For You'}
                <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500">
                  {isRTL ? 'بناءً على تحليل الفيديو' : 'Based on Video Analysis'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {recommendedDrills.map(({ drill, reason, reasonAr }) => (
                  <Card 
                    key={drill.id} 
                    className="bg-card/80 border-cyan-600 cursor-pointer hover:border-cyan-400 transition-colors"
                    onClick={() => setSelectedDrill(drill)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getCategoryColor(drill.category)}`}>
                          {(() => {
                            const Icon = getCategoryIcon(drill.category);
                            return <Icon className="h-5 w-5 text-foreground" />;
                          })()}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground">
                            {isRTL ? drill.titleAr : drill.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isRTL ? reasonAr : reason}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge className="bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-xs">
                              +{drill.pointsReward} {isRTL ? 'نقطة' : 'pts'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {drill.duration} {isRTL ? 'دقيقة' : 'min'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Drills Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDrills.map((drill) => {
            const isCompleted = completedDrills.includes(drill.id);
            const Icon = getCategoryIcon(drill.category);
            const difficultyInfo = DIFFICULTY_LABELS[drill.difficulty as keyof typeof DIFFICULTY_LABELS];
            
            return (
              <Card 
                key={drill.id} 
                className={`bg-card/50 border-border cursor-pointer hover:border-cyan-500 transition-all group ${
                  isCompleted ? 'ring-2 ring-green-500/50' : ''
                }`}
                onClick={() => setSelectedDrill(drill)}
              >
                <div className="relative">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center bg-card/80">
                      <Icon className="h-12 w-12 text-gray-600" />
                    </div>
                    {/* Play overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                      <div className="w-14 h-14 rounded-full bg-cyan-500 flex items-center justify-center">
                        <Play className="h-6 w-6 text-foreground ml-1" />
                      </div>
                    </div>
                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {drill.duration} {isRTL ? 'د' : 'min'}
                    </div>
                    {/* Completed badge */}
                    {isCompleted && (
                      <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-foreground line-clamp-2">
                      {isRTL ? drill.titleAr : drill.title}
                    </h3>
                    <Badge className={`${difficultyInfo.color} text-white text-xs shrink-0`}>
                      {isRTL ? difficultyInfo.ar : difficultyInfo.en}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {isRTL ? drill.descriptionAr : drill.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <Badge className={`${getCategoryColor(drill.category)} text-white text-xs`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {isRTL 
                          ? CATEGORIES.find(c => c.id === drill.category)?.labelAr 
                          : CATEGORIES.find(c => c.id === drill.category)?.label
                        }
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                      <Star className="h-3 w-3 fill-current" />
                      <span className="text-xs">{drill.avgRating}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                    <span>+{drill.pointsReward} {isRTL ? 'نقطة' : 'points'}</span>
                    <span>{drill.completionCount.toLocaleString()} {isRTL ? 'إكمال' : 'completed'}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredDrills.length === 0 && (
          <Card className="bg-card/50 border-border">
            <CardContent className="p-12 text-center">
              <Dumbbell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {isRTL ? 'لا توجد تمارين' : 'No drills found'}
              </h3>
              <p className="text-muted-foreground">
                {isRTL 
                  ? 'جرب تغيير الفئة أو البحث بكلمات مختلفة' 
                  : 'Try changing the category or search with different keywords'
                }
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      )}

      {/* Drill Detail Modal */}
      <Dialog open={!!selectedDrill} onOpenChange={() => setSelectedDrill(null)}>
        <DialogContent className="bg-card border-border text-foreground max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDrill && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2">
                  {(() => {
                    const Icon = getCategoryIcon(selectedDrill.category);
                    return <Icon className={`h-6 w-6 ${getCategoryColor(selectedDrill.category).replace('bg-', 'text-')}`} />;
                  })()}
                  {isRTL ? selectedDrill.titleAr : selectedDrill.title}
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Video Player */}
                {showVideo ? (
                  <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                    <iframe
                      ref={videoRef}
                      src={selectedDrill.videoUrl}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                      onClick={() => setShowVideo(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div 
                    className="aspect-video bg-muted rounded-lg overflow-hidden relative cursor-pointer group"
                    onClick={() => setShowVideo(true)}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {(() => {
                        const Icon = getCategoryIcon(selectedDrill.category);
                        return <Icon className="h-16 w-16 text-gray-600" />;
                      })()}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                      <div className="w-20 h-20 rounded-full bg-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="h-10 w-10 text-foreground ml-1" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Drill Info */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Clock className="h-5 w-5 text-cyan-700 dark:text-cyan-400 mx-auto mb-1" />
                    <div className="text-lg font-bold">{selectedDrill.duration}</div>
                    <div className="text-xs text-muted-foreground">{isRTL ? 'دقيقة' : 'minutes'}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Trophy className="h-5 w-5 text-yellow-700 dark:text-yellow-400 mx-auto mb-1" />
                    <div className="text-lg font-bold">+{selectedDrill.pointsReward}</div>
                    <div className="text-xs text-muted-foreground">{isRTL ? 'نقطة' : 'points'}</div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-3 text-center">
                    <Star className="h-5 w-5 text-orange-700 dark:text-orange-400 mx-auto mb-1" />
                    <div className="text-lg font-bold">{selectedDrill.avgRating}%</div>
                    <div className="text-xs text-muted-foreground">{isRTL ? 'تقييم' : 'rating'}</div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="font-semibold mb-2">{isRTL ? 'الوصف' : 'Description'}</h4>
                  <p className="text-muted-foreground">
                    {isRTL ? selectedDrill.descriptionAr : selectedDrill.description}
                  </p>
                </div>

                {/* Skills Targeted */}
                <div>
                  <h4 className="font-semibold mb-2">{isRTL ? 'المهارات المستهدفة' : 'Skills Targeted'}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDrill.targetsBallControl && (
                      <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">{isRTL ? 'التحكم بالكرة' : 'Ball Control'}</Badge>
                    )}
                    {selectedDrill.targetsPassing && (
                      <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400">{isRTL ? 'التمرير' : 'Passing'}</Badge>
                    )}
                    {selectedDrill.targetsShooting && (
                      <Badge className="bg-red-500/20 text-red-600 dark:text-red-400">{isRTL ? 'التسديد' : 'Shooting'}</Badge>
                    )}
                    {selectedDrill.targetsDribbling && (
                      <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">{isRTL ? 'المراوغة' : 'Dribbling'}</Badge>
                    )}
                    {selectedDrill.targetsSpeed && (
                      <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-400">{isRTL ? 'السرعة' : 'Speed'}</Badge>
                    )}
                    {selectedDrill.targetsPositioning && (
                      <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400">{isRTL ? 'التمركز' : 'Positioning'}</Badge>
                    )}
                    {selectedDrill.targetsFirstTouch && (
                      <Badge className="bg-cyan-500/20 text-cyan-700 dark:text-cyan-400">{isRTL ? 'اللمسة الأولى' : 'First Touch'}</Badge>
                    )}
                    {selectedDrill.targetsHeading && (
                      <Badge className="bg-pink-500/20 text-pink-600 dark:text-pink-400">{isRTL ? 'الرأسيات' : 'Heading'}</Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button 
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                    onClick={() => setShowVideo(true)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {isRTL ? 'شاهد التمرين' : 'Watch Drill'}
                  </Button>
                  <Button 
                    variant="outline"
                    className={`flex-1 ${
                      completedDrills.includes(selectedDrill.id)
                        ? 'bg-green-600 border-green-600 text-white hover:bg-green-700'
                        : 'border-cyan-500 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500/20'
                    }`}
                    onClick={() => handleCompleteDrill(selectedDrill.id)}
                    disabled={completedDrills.includes(selectedDrill.id)}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {completedDrills.includes(selectedDrill.id)
                      ? (isRTL ? 'مكتمل' : 'Completed')
                      : (isRTL ? 'إكمال التمرين' : 'Mark Complete')
                    }
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Video Upload Modal */}
      <VideoUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={() => refetchVideos()}
      />

      {/* Training Videos Section (shown when videos tab is active) */}
      {activeTab === 'videos' && (
        <div className="container pb-6">
          {trainingVideos.length === 0 ? (
            <Card className="bg-card/50 border-border p-8 text-center">
              <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {isRTL ? 'لا توجد فيديوهات بعد' : 'No Videos Yet'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {isRTL 
                  ? 'سيتم إضافة فيديوهات تدريبية قريباً'
                  : 'Training videos will be added soon'
                }
              </p>
              {isStaff && (
                <Button onClick={() => setShowUploadModal(true)} className="bg-cyan-600 hover:bg-cyan-700">
                  <Upload className="h-4 w-4 mr-2" />
                  {isRTL ? 'رفع أول فيديو' : 'Upload First Video'}
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trainingVideos.map((video) => (
                <Card key={video.id} className="bg-card/50 border-border overflow-hidden hover:border-cyan-500 transition-colors cursor-pointer">
                  <div className="relative aspect-video bg-background">
                    {video.thumbnailUrl ? (
                      <img src={video.thumbnailUrl} alt={video.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="h-16 w-16 text-gray-600" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        size="lg"
                        className="bg-cyan-600 hover:bg-cyan-700 rounded-full h-16 w-16"
                        onClick={() => window.open(video.videoUrl, '_blank')}
                      >
                        <Play className="h-8 w-8" />
                      </Button>
                    </div>
                    {video.duration && (
                      <Badge className="absolute bottom-2 right-2 bg-black/70">
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground mb-1">
                      {isRTL && video.titleAr ? video.titleAr : video.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {isRTL && video.descriptionAr ? video.descriptionAr : video.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge className={`${
                          video.difficulty === 'beginner' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                          video.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400' :
                          'bg-orange-500/20 text-orange-700 dark:text-orange-400'
                        }`}>
                          {video.difficulty === 'beginner' ? (isRTL ? 'مبتدئ' : 'Beginner') :
                           video.difficulty === 'intermediate' ? (isRTL ? 'متوسط' : 'Intermediate') :
                           (isRTL ? 'متقدم' : 'Advanced')}
                        </Badge>
                        {video.ageGroup && video.ageGroup !== 'all' && (
                          <Badge variant="outline" className="border-border text-muted-foreground">
                            {video.ageGroup}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye className="h-4 w-4" />
                        <span>{video.viewCount || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
