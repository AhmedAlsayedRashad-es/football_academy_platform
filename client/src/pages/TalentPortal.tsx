import { useState } from 'react';
import { Link , useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';
import {
  ArrowLeft, Search, Filter, Globe, Star, Eye, 
  Play, MapPin, Calendar, Ruler, Weight, Footprints,
  Trophy, Target, TrendingUp, Mail, Share2, Heart,
  Video, Award, Users, ChevronRight, Sparkles
} from 'lucide-react';

// Mock player data for talent portal
const MOCK_PLAYERS = [
  {
    id: 1,
    name: 'Ahmed Hassan',
    nameAr: 'أحمد حسن',
    age: 14,
    position: 'Forward',
    positionAr: 'مهاجم',
    nationality: 'Egypt',
    nationalityAr: 'مصر',
    flag: '🇪🇬',
    club: 'Future Stars Academy',
    height: 168,
    weight: 56,
    preferredFoot: 'Right',
    preferredFootAr: 'يمنى',
    overallRating: 78,
    potentialRating: 89,
    skills: { pace: 82, shooting: 75, passing: 70, dribbling: 85, defending: 45, physical: 68 },
    highlights: 3,
    views: 1250,
    inquiries: 8,
    isVerified: true,
    isFeatured: true,
    videoUrl: '/videos/ahmed-highlights.mp4',
    bio: 'Explosive forward with excellent dribbling and pace. Strong 1v1 ability.',
    bioAr: 'مهاجم سريع مع مهارات مراوغة ممتازة. قدرة قوية في المواجهات الفردية.',
  },
  {
    id: 2,
    name: 'Omar Khaled',
    nameAr: 'عمر خالد',
    age: 15,
    position: 'Midfielder',
    positionAr: 'لاعب وسط',
    nationality: 'Egypt',
    nationalityAr: 'مصر',
    flag: '🇪🇬',
    club: 'Future Stars Academy',
    height: 172,
    weight: 62,
    preferredFoot: 'Left',
    preferredFootAr: 'يسرى',
    overallRating: 76,
    potentialRating: 86,
    skills: { pace: 70, shooting: 68, passing: 82, dribbling: 75, defending: 65, physical: 72 },
    highlights: 2,
    views: 890,
    inquiries: 5,
    isVerified: true,
    isFeatured: false,
    videoUrl: '/videos/omar-highlights.mp4',
    bio: 'Creative midfielder with excellent vision and passing range.',
    bioAr: 'لاعب وسط مبدع مع رؤية ممتازة ومدى تمرير واسع.',
  },
  {
    id: 3,
    name: 'Youssef Ali',
    nameAr: 'يوسف علي',
    age: 13,
    position: 'Defender',
    positionAr: 'مدافع',
    nationality: 'Egypt',
    nationalityAr: 'مصر',
    flag: '🇪🇬',
    club: 'Future Stars Academy',
    height: 175,
    weight: 65,
    preferredFoot: 'Right',
    preferredFootAr: 'يمنى',
    overallRating: 74,
    potentialRating: 84,
    skills: { pace: 68, shooting: 45, passing: 72, dribbling: 60, defending: 80, physical: 78 },
    highlights: 1,
    views: 650,
    inquiries: 3,
    isVerified: true,
    isFeatured: false,
    videoUrl: '/videos/youssef-highlights.mp4',
    bio: 'Strong central defender with excellent aerial ability and leadership.',
    bioAr: 'مدافع مركزي قوي مع قدرة هوائية ممتازة وقيادة.',
  },
  {
    id: 4,
    name: 'Karim Mohamed',
    nameAr: 'كريم محمد',
    age: 14,
    position: 'Goalkeeper',
    positionAr: 'حارس مرمى',
    nationality: 'Egypt',
    nationalityAr: 'مصر',
    flag: '🇪🇬',
    club: 'Future Stars Academy',
    height: 180,
    weight: 70,
    preferredFoot: 'Right',
    preferredFootAr: 'يمنى',
    overallRating: 75,
    potentialRating: 87,
    skills: { diving: 78, handling: 76, kicking: 72, reflexes: 80, speed: 65, positioning: 74 },
    highlights: 2,
    views: 720,
    inquiries: 4,
    isVerified: true,
    isFeatured: false,
    videoUrl: '/videos/karim-highlights.mp4',
    bio: 'Agile goalkeeper with excellent reflexes and shot-stopping ability.',
    bioAr: 'حارس مرمى رشيق مع ردود فعل ممتازة وقدرة على صد التسديدات.',
  },
];

const POSITIONS = [
  { value: 'all', label: 'All Positions', labelAr: 'جميع المراكز' },
  { value: 'forward', label: 'Forward', labelAr: 'مهاجم' },
  { value: 'midfielder', label: 'Midfielder', labelAr: 'لاعب وسط' },
  { value: 'defender', label: 'Defender', labelAr: 'مدافع' },
  { value: 'goalkeeper', label: 'Goalkeeper', labelAr: 'حارس مرمى' },
];

const AGE_RANGES = [
  { value: 'all', label: 'All Ages', labelAr: 'جميع الأعمار' },
  { value: 'u12', label: 'Under 12', labelAr: 'تحت 12' },
  { value: 'u14', label: 'Under 14', labelAr: 'تحت 14' },
  { value: 'u16', label: 'Under 16', labelAr: 'تحت 16' },
  { value: 'u18', label: 'Under 18', labelAr: 'تحت 18' },
];

export default function TalentPortal() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [ageFilter, setAgeFilter] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState<typeof MOCK_PLAYERS[0] | null>(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [watchlist, setWatchlist] = useState<number[]>([]);

  const filteredPlayers = MOCK_PLAYERS.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.nameAr.includes(searchQuery);
    const matchesPosition = positionFilter === 'all' || 
                           player.position.toLowerCase() === positionFilter;
    const matchesAge = ageFilter === 'all' ||
                      (ageFilter === 'u12' && player.age < 12) ||
                      (ageFilter === 'u14' && player.age < 14) ||
                      (ageFilter === 'u16' && player.age < 16) ||
                      (ageFilter === 'u18' && player.age < 18);
    return matchesSearch && matchesPosition && matchesAge;
  });

  const handleViewPlayer = (player: typeof MOCK_PLAYERS[0]) => {
    setSelectedPlayer(player);
    setShowPlayerModal(true);
  };

  const handleAddToWatchlist = (playerId: number) => {
    if (watchlist.includes(playerId)) {
      setWatchlist(prev => prev.filter(id => id !== playerId));
      toast.success(isRTL ? 'تمت الإزالة من قائمة المراقبة' : 'Removed from watchlist');
    } else {
      setWatchlist(prev => [...prev, playerId]);
      toast.success(isRTL ? 'تمت الإضافة إلى قائمة المراقبة' : 'Added to watchlist');
    }
  };

  const handleSendInquiry = (player: typeof MOCK_PLAYERS[0]) => {
    toast.success(isRTL 
      ? `تم إرسال استفسار عن ${player.nameAr}` 
      : `Inquiry sent for ${player.name}`);
  };

  const getSkillColor = (value: number) => {
    if (value >= 80) return 'text-green-700 dark:text-green-400';
    if (value >= 70) return 'text-yellow-700 dark:text-yellow-400';
    if (value >= 60) return 'text-orange-700 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <>
    <div className={` ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-background text-foreground sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton />
              <Link href="/">
                <img src="/logo-transparent.png" alt="Future Stars Academy" className="h-10" />
              </Link>
              <div className="flex items-center gap-2">
                <Globe className="h-6 w-6 text-cyan-700 dark:text-cyan-400" />
                <h1 className="text-xl font-bold">{isRTL ? 'بوابة المواهب' : 'Talent Portal'}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan-600">
                <Users className="h-3 w-3 mr-1" />
                {MOCK_PLAYERS.length} {isRTL ? 'لاعب' : 'Players'}
              </Badge>
              {watchlist.length > 0 && (
                <Badge className="bg-pink-600">
                  <Heart className="h-3 w-3 mr-1" />
                  {watchlist.length}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Hero Section */}
        <div className="brand-gradient-subtle rounded-2xl p-8 border border-cyan-700">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="h-8 w-8 text-cyan-700 dark:text-cyan-400" />
            <h2 className="text-2xl font-bold text-foreground">
              {isRTL ? 'اكتشف المواهب الواعدة' : 'Discover Promising Talents'}
            </h2>
          </div>
          <p className="text-muted-foreground mb-6 max-w-2xl">
            {isRTL 
              ? 'منصة عالمية لاكتشاف المواهب الشابة. تصفح ملفات اللاعبين، شاهد مقاطع الفيديو، وتواصل مع أفضل المواهب من أكاديمية Future Stars Academy.'
              : 'A global platform for discovering young talents. Browse player profiles, watch video highlights, and connect with the best talents from Future Stars Academy.'}
          </p>
          
          {/* Search & Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'ابحث عن لاعب...' : 'Search players...'}
                className="pl-10 bg-card border-border text-foreground"
              />
            </div>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-[180px] bg-card border-border text-foreground">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {POSITIONS.map(pos => (
                  <SelectItem key={pos.value} value={pos.value} className="text-foreground hover:bg-muted">
                    {isRTL ? pos.labelAr : pos.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ageFilter} onValueChange={setAgeFilter}>
              <SelectTrigger className="w-[180px] bg-card border-border text-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {AGE_RANGES.map(age => (
                  <SelectItem key={age.value} value={age.value} className="text-foreground hover:bg-muted">
                    {isRTL ? age.labelAr : age.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Featured Players */}
        {filteredPlayers.some(p => p.isFeatured) && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
              {isRTL ? 'اللاعبون المميزون' : 'Featured Players'}
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPlayers.filter(p => p.isFeatured).map(player => (
                <Card 
                  key={player.id} 
                  className="brand-gradient-subtle border-yellow-600 hover:border-yellow-500 transition-all cursor-pointer"
                  onClick={() => handleViewPlayer(player)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center text-2xl font-bold text-white">
                          {player.overallRating}
                        </div>
                        <div>
                          <h4 className="text-foreground font-bold text-lg">{isRTL ? player.nameAr : player.name}</h4>
                          <p className="text-muted-foreground text-sm flex items-center gap-1">
                            <span>{player.flag}</span>
                            {isRTL ? player.positionAr : player.position}
                          </p>
                          <p className="text-muted-foreground text-xs">{player.age} {isRTL ? 'سنة' : 'years old'}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {player.isVerified && (
                          <Badge className="bg-blue-600 text-xs">
                            {isRTL ? 'موثق' : 'Verified'}
                          </Badge>
                        )}
                        <Badge className="bg-yellow-600 text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          {isRTL ? 'مميز' : 'Featured'}
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {isRTL ? player.bioAr : player.bio}
                    </p>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" /> {player.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <Video className="h-4 w-4" /> {player.highlights}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-cyan-700 dark:text-cyan-400">
                        {isRTL ? 'عرض الملف' : 'View Profile'}
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Players */}
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
            {isRTL ? 'جميع اللاعبين' : 'All Players'}
            <Badge variant="outline" className="ml-2 text-muted-foreground">
              {filteredPlayers.length}
            </Badge>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPlayers.map(player => (
              <Card 
                key={player.id} 
                className="bg-card/50 border-border hover:border-cyan-600 transition-all cursor-pointer group"
                onClick={() => handleViewPlayer(player)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-lg font-bold text-white">
                      {player.overallRating}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-foreground font-semibold">{isRTL ? player.nameAr : player.name}</h4>
                      <p className="text-muted-foreground text-sm flex items-center gap-1">
                        <span>{player.flag}</span>
                        {isRTL ? player.positionAr : player.position}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`${watchlist.includes(player.id) ? 'text-pink-500' : 'text-muted-foreground'} hover:text-pink-600 dark:hover:text-pink-500`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToWatchlist(player.id);
                      }}
                    >
                      <Heart className={`h-5 w-5 ${watchlist.includes(player.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>{player.age} {isRTL ? 'سنة' : 'yrs'}</span>
                    <span>{player.height}cm</span>
                    <span>{isRTL ? player.preferredFootAr : player.preferredFoot}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Eye className="h-4 w-4" /> {player.views}
                    </div>
                    <div className="flex items-center gap-1 text-cyan-700 dark:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play className="h-4 w-4" />
                      {player.highlights} {isRTL ? 'فيديو' : 'videos'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <p className="text-muted-foreground">{isRTL ? 'لا يوجد لاعبون مطابقون للبحث' : 'No players match your search'}</p>
          </div>
        )}
      </div>

      {/* Player Detail Modal */}
      <Dialog open={showPlayerModal} onOpenChange={setShowPlayerModal}>
        <DialogContent className="bg-background border-border text-foreground max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedPlayer && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white">
                      {selectedPlayer.overallRating}
                    </div>
                    <div>
                      <DialogTitle className="text-2xl">
                        {isRTL ? selectedPlayer.nameAr : selectedPlayer.name}
                      </DialogTitle>
                      <DialogDescription className="text-muted-foreground">
                        {selectedPlayer.flag} {isRTL ? selectedPlayer.positionAr : selectedPlayer.position} • {selectedPlayer.club}
                      </DialogDescription>
                      <div className="flex items-center gap-2 mt-2">
                        {selectedPlayer.isVerified && (
                          <Badge className="bg-blue-600">{isRTL ? 'موثق' : 'Verified'}</Badge>
                        )}
                        <Badge variant="outline" className="text-cyan-700 dark:text-cyan-400 border-cyan-600">
                          {isRTL ? 'الإمكانية:' : 'Potential:'} {selectedPlayer.potentialRating}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="bg-card">
                  <TabsTrigger value="overview">{isRTL ? 'نظرة عامة' : 'Overview'}</TabsTrigger>
                  <TabsTrigger value="skills">{isRTL ? 'المهارات' : 'Skills'}</TabsTrigger>
                  <TabsTrigger value="videos">{isRTL ? 'الفيديوهات' : 'Videos'}</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-card p-4 rounded-lg text-center">
                      <Calendar className="h-5 w-5 text-cyan-700 dark:text-cyan-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-foreground">{selectedPlayer.age}</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'العمر' : 'Age'}</p>
                    </div>
                    <div className="bg-card p-4 rounded-lg text-center">
                      <Ruler className="h-5 w-5 text-cyan-700 dark:text-cyan-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-foreground">{selectedPlayer.height}cm</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'الطول' : 'Height'}</p>
                    </div>
                    <div className="bg-card p-4 rounded-lg text-center">
                      <Weight className="h-5 w-5 text-cyan-700 dark:text-cyan-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-foreground">{selectedPlayer.weight}kg</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'الوزن' : 'Weight'}</p>
                    </div>
                    <div className="bg-card p-4 rounded-lg text-center">
                      <Footprints className="h-5 w-5 text-cyan-700 dark:text-cyan-400 mx-auto mb-2" />
                      <p className="text-lg font-bold text-foreground">{isRTL ? selectedPlayer.preferredFootAr : selectedPlayer.preferredFoot}</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'القدم المفضلة' : 'Preferred Foot'}</p>
                    </div>
                  </div>

                  <Card className="bg-card border-border">
                    <CardContent className="p-4">
                      <h4 className="text-foreground font-semibold mb-2">{isRTL ? 'نبذة' : 'Bio'}</h4>
                      <p className="text-muted-foreground">{isRTL ? selectedPlayer.bioAr : selectedPlayer.bio}</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-card p-4 rounded-lg text-center">
                      <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                      <p className="text-xl font-bold text-foreground">{selectedPlayer.views}</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'مشاهدات' : 'Views'}</p>
                    </div>
                    <div className="bg-card p-4 rounded-lg text-center">
                      <Mail className="h-5 w-5 text-green-700 dark:text-green-400 mx-auto mb-2" />
                      <p className="text-xl font-bold text-foreground">{selectedPlayer.inquiries}</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'استفسارات' : 'Inquiries'}</p>
                    </div>
                    <div className="bg-card p-4 rounded-lg text-center">
                      <Video className="h-5 w-5 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                      <p className="text-xl font-bold text-foreground">{selectedPlayer.highlights}</p>
                      <p className="text-xs text-muted-foreground">{isRTL ? 'فيديوهات' : 'Highlights'}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="mt-4">
                  <div className="space-y-4">
                    {Object.entries(selectedPlayer.skills).map(([skill, value]) => (
                      <div key={skill} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground capitalize">
                            {isRTL ? {
                              pace: 'السرعة',
                              shooting: 'التسديد',
                              passing: 'التمرير',
                              dribbling: 'المراوغة',
                              defending: 'الدفاع',
                              physical: 'القوة البدنية',
                              diving: 'الغوص',
                              handling: 'الإمساك',
                              kicking: 'الركل',
                              reflexes: 'ردود الفعل',
                              speed: 'السرعة',
                              positioning: 'التمركز'
                            }[skill] || skill : skill}
                          </span>
                          <span className={getSkillColor(value as number)}>{value}</span>
                        </div>
                        <Progress value={value as number} className="h-2" />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="videos" className="mt-4">
                  <div className="bg-card rounded-lg p-8 text-center">
                    <Play className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {isRTL 
                        ? `${selectedPlayer.highlights} فيديو متاح للمشاهدة` 
                        : `${selectedPlayer.highlights} highlight videos available`}
                    </p>
                    <Button className="bg-cyan-600 hover:bg-cyan-700">
                      <Play className="h-4 w-4 mr-2" />
                      {isRTL ? 'مشاهدة الفيديوهات' : 'Watch Highlights'}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-6 flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleAddToWatchlist(selectedPlayer.id)}
                  className={watchlist.includes(selectedPlayer.id) ? 'border-pink-500 text-pink-500' : ''}
                >
                  <Heart className={`h-4 w-4 mr-2 ${watchlist.includes(selectedPlayer.id) ? 'fill-current' : ''}`} />
                  {watchlist.includes(selectedPlayer.id) 
                    ? (isRTL ? 'في قائمة المراقبة' : 'In Watchlist')
                    : (isRTL ? 'إضافة للمراقبة' : 'Add to Watchlist')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast.success(isRTL ? 'تم نسخ الرابط' : 'Link copied');
                  }}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {isRTL ? 'مشاركة' : 'Share'}
                </Button>
                <Button 
                  className="bg-cyan-600 hover:bg-cyan-700"
                  onClick={() => handleSendInquiry(selectedPlayer)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {isRTL ? 'إرسال استفسار' : 'Send Inquiry'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
