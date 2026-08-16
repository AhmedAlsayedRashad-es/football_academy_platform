import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { DashboardLayoutSkeleton } from '@/components/DashboardLayoutSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import {
  Brain,
  Play,
  Star,
  TrendingUp,
  Target,
  Zap,
  ArrowLeft,
  Video,
  ChevronRight,
  Loader2,
  RefreshCw,
  Award,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { AIBreadcrumb } from "@/components/AIBreadcrumb";
import { useLanguage } from '@/contexts/LanguageContext';



function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

function getYouTubeEmbed(url: string): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?autoplay=1`;
}

const skillColors: Record<string, string> = {
  ball_control: 'bg-blue-500',
  passing: 'bg-green-500',
  shooting: 'bg-red-500',
  dribbling: 'bg-purple-500',
  speed_agility: 'bg-yellow-500',
  positioning: 'bg-cyan-500',
  heading: 'bg-orange-500',
  fitness: 'bg-pink-500',
  tactical: 'bg-indigo-500',
};

const skillLabels: Record<string, string> = {
  ball_control: 'Ball Control',
  passing: 'Passing',
  shooting: 'Shooting',
  dribbling: 'Dribbling',
  speed_agility: 'Speed & Agility',
  positioning: 'Positioning',
  heading: 'Heading',
  fitness: 'Fitness',
  tactical: 'Tactical',
};

// Sample recommendations for demo when no DB data is available
const SAMPLE_RECOMMENDATIONS = [
  {
    id: 1001,
    title: 'Advanced Passing Drills - La Masia Style',
    description: 'Master short-passing combinations used by elite academies worldwide',
    videoUrl: 'https://www.youtube.com/watch?v=5S4sMHBPJDk',
    category: 'passing',
    difficulty: 'intermediate',
    reason: 'Improve your passing accuracy (score: 54/100)',
    matchScore: 92,
    viewCount: 1240,
  },
  {
    id: 1002,
    title: 'Ball Control Mastery - First Touch Exercises',
    description: 'Develop elite first touch and close ball control under pressure',
    videoUrl: 'https://www.youtube.com/watch?v=oBWbVBLMEIo',
    category: 'ball_control',
    difficulty: 'beginner',
    reason: 'Improve your ball control (score: 48/100)',
    matchScore: 88,
    viewCount: 890,
  },
  {
    id: 1003,
    title: 'Speed & Agility Training - Sprint Mechanics',
    description: 'Explosive speed training used by professional footballers',
    videoUrl: 'https://www.youtube.com/watch?v=4IcBqJxuSMI',
    category: 'speed_agility',
    difficulty: 'advanced',
    reason: 'Improve your speed & agility (score: 52/100)',
    matchScore: 85,
    viewCount: 2100,
  },
  {
    id: 1004,
    title: 'Shooting Technique - Power & Accuracy',
    description: 'Learn proper shooting mechanics for maximum power and precision',
    videoUrl: 'https://www.youtube.com/watch?v=jNHIs_Kx_1M',
    category: 'shooting',
    difficulty: 'intermediate',
    reason: 'Maintain your strong shooting skills (score: 72/100)',
    matchScore: 78,
    viewCount: 3400,
  },
  {
    id: 1005,
    title: 'Tactical Positioning - Off-Ball Movement',
    description: 'Understand intelligent movement and positioning without the ball',
    videoUrl: 'https://www.youtube.com/watch?v=FIqPKPjPKsI',
    category: 'tactical',
    difficulty: 'advanced',
    reason: 'Improve your tactical awareness (score: 58/100)',
    matchScore: 82,
    viewCount: 1560,
  },
  {
    id: 1006,
    title: 'Dribbling Skills - 1v1 Situations',
    description: 'Master dribbling techniques to beat defenders in 1v1 situations',
    videoUrl: 'https://www.youtube.com/watch?v=zMQNFe3OQFE',
    category: 'dribbling',
    difficulty: 'intermediate',
    reason: 'Improve your dribbling (score: 61/100)',
    matchScore: 75,
    viewCount: 2890,
  },
];

export default function AIVideoRecommendations() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | undefined>(undefined);
  const [playingVideo, setPlayingVideo] = useState<any>(null);

  const { data: players } = trpc.players.getAll.useQuery(undefined, {
    enabled: user?.role === 'admin' || user?.role === 'coach',
  });

  const { data: recData, isLoading, refetch } = trpc.trainingVideos.getAIRecommendations.useQuery(
    { playerId: selectedPlayerId },
    { enabled: !!user }
  );

  const incrementViews = trpc.trainingVideos.incrementViews.useMutation();

  const handlePlayVideo = (video: any) => {
    setPlayingVideo(video);
    incrementViews.mutate({ id: video.id });
  };

  if (authLoading) return <DashboardLayoutSkeleton />;

  const isStaff = user?.role === 'admin' || user?.role === 'coach';
  const recommendations = recData?.recommendations || [];
  const skillProfile = recData?.skillProfile;

  const getSkillScore = (skill: string): number => {
    if (!skillProfile) return 50;
    const map: Record<string, number> = {
      ball_control: skillProfile.ballControl || 50,
      passing: skillProfile.passing || 50,
      shooting: skillProfile.shooting || 50,
      dribbling: skillProfile.dribbling || 50,
      speed_agility: Math.round(((skillProfile.speed || 50) + (skillProfile.agility || 50)) / 2),
      positioning: skillProfile.positioning || 50,
      heading: skillProfile.heading || 50,
      fitness: skillProfile.stamina || 50,
      tactical: skillProfile.decisionMaking || 50,
    };
    return map[skill] || 50;
  };

  const weakSkills = Object.keys(skillLabels).filter(s => getSkillScore(s) < 60).slice(0, 3);
  const strongSkills = Object.keys(skillLabels).filter(s => getSkillScore(s) >= 70).slice(0, 3);
  
  // Use sample data when no real recommendations available
  const displayRecommendations = recommendations.length > 0 ? recommendations : SAMPLE_RECOMMENDATIONS;
  const isUsingSampleData = recommendations.length === 0;

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <AIBreadcrumb toolLabel={language === 'ar' ? 'توصيات فيديو AI' : 'AI Video Recommendations'}/>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="w-8 h-8 text-purple-500" />
              AI Video Recommendations
            </h1>
            <p className="text-muted-foreground mt-1">
              Personalized training videos based on your skill profile
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Player Selector (for coaches/admins) */}
        {isStaff && players && players.length > 0 && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-4">
                <Target className="w-5 h-5 text-orange-700 dark:text-orange-500" />
                <span className="font-medium">Select Player:</span>
                <Select
                  value={selectedPlayerId?.toString() || 'auto'}
                  onValueChange={v => setSelectedPlayerId(v === 'auto' ? undefined : parseInt(v))}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select a player..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">My Profile (Auto)</SelectItem>
                    {players.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.firstName} {p.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Skill Profile Summary */}
        {skillProfile && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-red-200 dark:border-red-900/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
                  <TrendingUp className="w-4 h-4" />
                  Areas to Improve
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weakSkills.length > 0 ? (
                  <div className="space-y-2">
                    {weakSkills.map(skill => (
                      <div key={skill}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{skillLabels[skill]}</span>
                          <span className="text-red-500 font-medium">{getSkillScore(skill)}/100</span>
                        </div>
                        <Progress value={getSkillScore(skill)} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">All skills above 60 — great work!</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-green-200 dark:border-green-900/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-green-600 dark:text-green-400">
                  <Award className="w-4 h-4" />
                  Strong Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                {strongSkills.length > 0 ? (
                  <div className="space-y-2">
                    {strongSkills.map(skill => (
                      <div key={skill}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{skillLabels[skill]}</span>
                          <span className="text-green-700 dark:text-green-500 font-medium">{getSkillScore(skill)}/100</span>
                        </div>
                        <Progress value={getSkillScore(skill)} className="h-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Keep training to build strong skills!</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-purple-200 dark:border-purple-900/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <BarChart3 className="w-4 h-4" />
                  Overall Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Technical</span>
                    <span className="font-medium">{skillProfile.technicalOverall || 50}/100</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Physical</span>
                    <span className="font-medium">{skillProfile.physicalOverall || 50}/100</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Mental</span>
                    <span className="font-medium">{skillProfile.mentalOverall || 50}/100</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Defensive</span>
                    <span className="font-medium">{skillProfile.defensiveOverall || 50}/100</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-700 dark:text-yellow-500" />
              AI Recommended Videos
              <Badge variant="secondary">{displayRecommendations.length} videos</Badge>
              {isUsingSampleData && (
                <Badge className="bg-blue-600 text-white text-xs">Demo Data</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <span className="ml-3 text-muted-foreground">AI analyzing your skill profile...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayRecommendations.map((video: any) => {
                  const thumbnail = video.thumbnailUrl || getYouTubeThumbnail(video.videoUrl);
                  const categoryColor = skillColors[video.category] || 'bg-gray-500';
                  const matchScore = video.matchScore || 70;

                  return (
                    <div
                      key={video.id}
                      className="group cursor-pointer rounded-xl overflow-hidden border border-border hover:shadow-lg transition-all"
                      onClick={() => handlePlayVideo(video)}
                    >
                      {/* Thumbnail */}
                      <div className="relative aspect-video bg-card overflow-hidden">
                        {thumbnail ? (
                          <img
                            src={thumbnail}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-12 h-12 text-slate-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                            <Play className="w-6 h-6 text-slate-900 ml-1" />
                          </div>
                        </div>
                        {/* AI Match Score */}
                        <div className="absolute top-2 right-2">
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold text-white ${
                            matchScore >= 80 ? 'bg-red-500' : matchScore >= 60 ? 'bg-orange-500' : 'bg-slate-600'
                          }`}>
                            <Star className="w-3 h-3" />
                            {matchScore}% match
                          </div>
                        </div>
                        {/* Category Badge */}
                        <div className="absolute bottom-2 left-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium text-white ${categoryColor}`}>
                            {skillLabels[video.category] || video.category}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <h3 className="font-semibold text-sm line-clamp-2 mb-1">{video.title}</h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{video.reason}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="capitalize">{video.difficulty || 'beginner'}</span>
                          <span className="flex items-center gap-1">
                            <ChevronRight className="w-3 h-3" />
                            Watch
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* No skill profile notice */}
        {!skillProfile && !isLoading && (
          <Card className="border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-950/20">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    No Skill Assessment Found
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Ask your coach to complete a skill assessment for you to get personalized AI video recommendations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Video Player Dialog */}
      <Dialog open={!!playingVideo} onOpenChange={() => setPlayingVideo(null)}>
        <DialogContent className="max-w-4xl p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>{playingVideo?.title}</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            {playingVideo && (
              <>
                {getYouTubeEmbed(playingVideo.videoUrl) ? (
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={getYouTubeEmbed(playingVideo.videoUrl)!}
                      className="w-full h-full"
                      allowFullScreen
                      allow="autoplay; encrypted-media"
                    />
                  </div>
                ) : (
                  <video
                    src={playingVideo.videoUrl}
                    controls
                    autoPlay
                    className="w-full rounded-lg"
                  />
                )}
                {playingVideo.description && (
                  <p className="mt-3 text-sm text-muted-foreground">{playingVideo.description}</p>
                )}
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Why AI recommended this:
                  </p>
                  <p className="text-sm text-purple-600 dark:text-purple-400 mt-1">{playingVideo.reason}</p>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
