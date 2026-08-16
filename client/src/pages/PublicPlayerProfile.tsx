import React from 'react';
import { useParams } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft, Share2, User, Star, Trophy, Target, BarChart2,
  Video, Calendar, Shirt, Zap, Brain, Shield, Flag, Ruler, Weight
} from 'lucide-react';
import { useLocation } from 'wouter';
import { toast } from 'sonner';

const POSITION_COLORS: Record<string, string> = {
  goalkeeper: 'bg-yellow-500',
  defender: 'bg-blue-500',
  midfielder: 'bg-green-500',
  forward: 'bg-red-500',
};

const POSITION_LABELS: Record<string, string> = {
  goalkeeper: 'Goalkeeper / حارس مرمى',
  defender: 'Defender / مدافع',
  midfielder: 'Midfielder / لاعب وسط',
  forward: 'Forward / مهاجم',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  technical: <Zap className="w-4 h-4" />,
  physical: <Shield className="w-4 h-4" />,
  mental: <Brain className="w-4 h-4" />,
  defensive: <Shield className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  technical: 'bg-blue-500',
  physical: 'bg-green-500',
  mental: 'bg-purple-500',
  defensive: 'bg-orange-500',
};

export default function PublicPlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const playerId = parseInt(id || '0', 10);

  const { data: player, isLoading, error } = trpc.players.getPublicProfile.useQuery(
    { id: playerId },
    { enabled: !!playerId }
  );

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success('Profile link copied to clipboard!');
    } else {
      toast.info('Share this URL: ' + url);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">Loading player profile...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Player Not Found</h2>
          <p className="text-muted-foreground mb-6">This player profile is not available or has been set to private.</p>
          <Button onClick={() => navigate('/')} variant="outline" className="text-foreground border-border">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const positionColor = POSITION_COLORS[player.position?.toLowerCase() || ''] || 'bg-slate-500';
  const positionLabel = POSITION_LABELS[player.position?.toLowerCase() || ''] || player.position;

  // Build skill bars from the skills object (single row with category columns)
  const skillsByCategory: Record<string, { skill: string; score: number }[]> = {};
  if (player.skills) {
    const s = player.skills as Record<string, any>;
    const cats: Record<string, string[]> = {
      technical: ['ballControl', 'dribbling', 'passing', 'shooting', 'crossing', 'firstTouch'],
      physical: ['speed', 'strength', 'stamina', 'agility', 'jumping'],
      mental: ['decisionMaking', 'positioning', 'leadership', 'communication'],
      defensive: ['tackling', 'marking', 'heading', 'interceptions'],
    };
    for (const [cat, keys] of Object.entries(cats)) {
      const items = keys
        .filter((k: any) => s[k] !== null && s[k] !== undefined)
        .map((k: any) => ({ skill: k.replace(/([A-Z])/g, ' $1').trim(), score: s[k] as number }));
      if (items.length > 0) skillsByCategory[cat] = items;
    }
  }

  return (
    <div >
      {/* Header Bar */}
      <div className="bg-card/80 backdrop-blur border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo-transparent.png" alt="Academy Logo" className="w-8 h-8 object-contain" />
            <span className="text-foreground font-bold text-sm">Future Stars Academy</span>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-border text-muted-foreground hover:text-foreground" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => navigate('/')}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Home
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Hero Card */}
        <Card className="bg-card border-border overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMSI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMTUiLz48L2c+PC9zdmc+')] bg-repeat" />
              </div>
              <div className="relative p-6 md:p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center border-4 border-green-500 shadow-xl">
                      {player.photoUrl ? (
                        <img src={player.photoUrl} alt={player.firstName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-white text-4xl md:text-5xl font-bold">
                          {player.firstName?.[0]}{player.lastName?.[0]}
                        </span>
                      )}
                    </div>
                    {/* Jersey number badge */}
                    {player.jerseyNumber && (
                      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-2 border-border shadow">
                        <span className="text-foreground font-bold text-sm">#{player.jerseyNumber}</span>
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                      <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                        {player.firstName} {player.lastName}
                      </h1>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
                      <Badge className={`${positionColor} text-white border-0 px-3 py-1`}>
                        {positionLabel}
                      </Badge>
                      {player.ageGroup && (
                        <Badge variant="outline" className="border-slate-500 text-muted-foreground">
                          {player.ageGroup}
                        </Badge>
                      )}
                      {player.nationality && (
                        <Badge variant="outline" className="border-slate-500 text-muted-foreground">
                          <Flag className="w-3 h-3 mr-1" />
                          {player.nationality}
                        </Badge>
                      )}
                    </div>

                    {/* Physical Stats */}
                    <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                      {player.dateOfBirth && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear()} years old
                          </span>
                        </div>
                      )}
                      {player.height && (
                        <div className="flex items-center gap-1">
                          <Ruler className="w-4 h-4" />
                          <span>{player.height} cm</span>
                        </div>
                      )}
                      {player.weight && (
                        <div className="flex items-center gap-1">
                          <Weight className="w-4 h-4" />
                          <span>{player.weight} kg</span>
                        </div>
                      )}
                      {player.preferredFoot && (
                        <div className="flex items-center gap-1">
                          <Shirt className="w-4 h-4" />
                          <span>{player.preferredFoot} foot</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Overall Rating */}
                  {player.skills?.overallRating && (
                    <div className="flex-shrink-0 text-center">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-xl">
                        <div>
                          <div className="text-2xl font-bold text-black">{Math.round(player.skills.overallRating)}</div>
                          <div className="text-xs text-black/70">Rating</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Match Stats */}
        {player.stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Matches', value: player.stats?.matchesPlayed || 0, icon: <Trophy className="w-5 h-5 text-yellow-700 dark:text-yellow-400" /> },
              { label: 'Goals', value: player.stats?.totalGoals || 0, icon: <Target className="w-5 h-5 text-green-700 dark:text-green-400" /> },
              { label: 'Assists', value: player.stats?.totalAssists || 0, icon: <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" /> },
              { label: 'Avg Rating', value: player.stats?.avgRating ? Number(player.stats.avgRating).toFixed(1) : 'N/A', icon: <Star className="w-5 h-5 text-orange-700 dark:text-orange-400" /> },
            ].map((stat) => (
              <Card key={stat.label} className="bg-card border-border text-center">
                <CardContent className="p-4">
                  <div className="flex justify-center mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Skill Scores */}
          {Object.keys(skillsByCategory).length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  Skill Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(skillsByCategory).map(([category, skills]) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[category] || 'bg-slate-500'}`} />
                      <span className="text-sm font-semibold text-muted-foreground capitalize">{category}</span>
                    </div>
                    <div className="space-y-2 pl-4">
                      {skills.map((s) => (
                        <div key={s.skill}>
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>{s.skill}</span>
                            <span className="font-semibold text-foreground">{s.score}/100</span>
                          </div>
                          <Progress value={s.score} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Development Goals */}
          {player.goals && player.goals.length > 0 && (
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground flex items-center gap-2">
                  <Target className="w-5 h-5 text-green-700 dark:text-green-400" />
                  Development Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
          {player.goals.map((goal: any) => (
            <div key={goal.id} className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm text-foreground font-medium">{goal.title}</span>
                <Badge
                  className={`text-xs ml-2 flex-shrink-0 ${
                    goal.completed ? 'bg-green-600' : 'bg-blue-600'
                  } text-white border-0`}
                >
                  {goal.completed ? 'Completed' : 'In Progress'}
                </Badge>
              </div>
              {goal.progress !== null && (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progress</span>
                    <span>{goal.progress}%</span>
                  </div>
                  <Progress value={goal.progress} className="h-1.5" />
                </>
              )}
            </div>
          ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Media Gallery */}
        {player.taggedMedia && player.taggedMedia.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-foreground flex items-center gap-2">
                <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Media Gallery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {player.taggedMedia.map((media: any) => (
                  <div key={media.id} className="relative group rounded-lg overflow-hidden bg-muted aspect-video">
                    {media.thumbnailUrl ? (
                      <img src={media.thumbnailUrl} alt={media.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-foreground text-xs text-center px-2">{media.title}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <Separator className="bg-muted mb-4" />
          <p className="text-muted-foreground text-sm">
            Player profile powered by <span className="text-green-700 dark:text-green-400 font-semibold">Future Stars Academy</span> Management Platform
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3 border-border text-muted-foreground hover:text-foreground"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share this Profile
          </Button>
        </div>
      </div>
    </div>
  );
}
