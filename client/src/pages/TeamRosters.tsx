import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, Trophy, Shield, Star, TrendingUp, Target,
  Activity, Zap, Award, ChevronRight, ArrowLeft} from 'lucide-react';
import { Link, useLocation} from 'wouter';
import { BackButton } from '@/components/BackButton';


interface Player {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  ageGroup: string | null;
  teamId: number | null;
  status: string | null;
  photoUrl: string | null;
  jerseyNumber: number | null;
}

interface Team {
  id: number;
  name: string;
  ageGroup: string;
  teamType: string | null;
  description: string | null;
}

export default function TeamRosters() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [activeTab, setActiveTab] = useState<string>("main");

  const { data: players } = trpc.players.getAll.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();

  const getTeamById = (teamId: number | null) => {
    if (!teamId || !teams) return null;
    return teams.find(t => t.id === teamId);
  };

  const getPositionLabel = (position: string) => {
    const positions: Record<string, { en: string; ar: string }> = {
      goalkeeper: { en: 'GK', ar: 'حارس' },
      defender: { en: 'DEF', ar: 'دفاع' },
      midfielder: { en: 'MID', ar: 'وسط' },
      forward: { en: 'FWD', ar: 'هجوم' },
    };
    return positions[position]?.[isRTL ? 'ar' : 'en'] || position;
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      goalkeeper: 'bg-yellow-500',
      defender: 'bg-blue-500',
      midfielder: 'bg-green-500',
      forward: 'bg-red-500',
    };
    return colors[position] || 'bg-gray-500';
  };

  // Group players by team type
  const mainTeamPlayers = players?.filter(p => {
    const team = getTeamById(p.teamId);
    return team?.teamType === 'main';
  }) || [];

  const academyPlayers = players?.filter(p => {
    const team = getTeamById(p.teamId);
    return team?.teamType === 'academy' || (p.teamId && !team?.teamType);
  }) || [];

  // Group by position
  const groupByPosition = (playerList: Player[]) => {
    return {
      goalkeepers: playerList.filter(p => p.position === 'goalkeeper'),
      defenders: playerList.filter(p => p.position === 'defender'),
      midfielders: playerList.filter(p => p.position === 'midfielder'),
      forwards: playerList.filter(p => p.position === 'forward'),
    };
  };

  const mainGrouped = groupByPosition(mainTeamPlayers);
  const academyGrouped = groupByPosition(academyPlayers);

  // Team stats
  const mainTeams = teams?.filter(t => t.teamType === 'main') || [];
  const academyTeams = teams?.filter(t => t.teamType === 'academy' || !t.teamType) || [];

  const PlayerCard = ({ player, showStats = true }: { player: Player; showStats?: boolean }) => (
    <div className="group relative bg-card border rounded-xl p-4 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start gap-4">
        {/* Player Avatar */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-card flex items-center justify-center text-foreground font-bold text-xl">
            {player.jerseyNumber || player.firstName[0]}
          </div>
          <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${getPositionColor(player.position)} flex items-center justify-center`}>
            <span className="text-foreground text-xs font-bold">{getPositionLabel(player.position)}</span>
          </div>
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate">
            {player.firstName} {player.lastName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {player.ageGroup || 'N/A'} • #{player.jerseyNumber || '-'}
          </p>
          
          {showStats && (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Activity className="w-3 h-3" />
                <span>{isRTL ? 'نشط' : 'Active'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="w-3 h-3 text-yellow-700 dark:text-yellow-500" />
                <span>4.5</span>
              </div>
            </div>
          )}
        </div>

        {/* View Profile Link */}
        <Link href={`/player/${player.id}`}>
          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>
    </div>
  );

  const PositionSection = ({ 
    title, 
    titleAr, 
    players, 
    icon: Icon, 
    color 
  }: { 
    title: string; 
    titleAr: string; 
    players: Player[]; 
    icon: React.ElementType;
    color: string;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-foreground" />
        </div>
        <h3 className="font-semibold text-lg">
          {isRTL ? titleAr : title}
          <span className="ml-2 text-sm font-normal text-muted-foreground">({players.length})</span>
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {players.map(player => (
          <PlayerCard key={player.id} player={player} />
        ))}
        {players.length === 0 && (
          <p className="text-muted-foreground text-sm col-span-full">
            {isRTL ? 'لا يوجد لاعبون' : 'No players'}
          </p>
        )}
      </div>
    </div>
  );

  const TeamRosterView = ({ 
    grouped, 
    teamType 
  }: { 
    grouped: ReturnType<typeof groupByPosition>; 
    teamType: 'main' | 'academy';
  }) => (
    <div className="space-y-8">
      {/* Team Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="brand-gradient-subtle border-yellow-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{grouped.goalkeepers.length}</p>
            <p className="text-sm text-muted-foreground">{isRTL ? 'حراس المرمى' : 'Goalkeepers'}</p>
          </CardContent>
        </Card>
        <Card className="brand-gradient-subtle border-blue-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{grouped.defenders.length}</p>
            <p className="text-sm text-muted-foreground">{isRTL ? 'المدافعون' : 'Defenders'}</p>
          </CardContent>
        </Card>
        <Card className="brand-gradient-subtle border-green-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{grouped.midfielders.length}</p>
            <p className="text-sm text-muted-foreground">{isRTL ? 'لاعبو الوسط' : 'Midfielders'}</p>
          </CardContent>
        </Card>
        <Card className="brand-gradient-subtle border-red-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{grouped.forwards.length}</p>
            <p className="text-sm text-muted-foreground">{isRTL ? 'المهاجمون' : 'Forwards'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Position Sections */}
      <PositionSection 
        title="Goalkeepers" 
        titleAr="حراس المرمى" 
        players={grouped.goalkeepers}
        icon={Shield}
        color="bg-yellow-500"
      />
      <PositionSection 
        title="Defenders" 
        titleAr="المدافعون" 
        players={grouped.defenders}
        icon={Shield}
        color="bg-blue-500"
      />
      <PositionSection 
        title="Midfielders" 
        titleAr="لاعبو الوسط" 
        players={grouped.midfielders}
        icon={Zap}
        color="bg-green-500"
      />
      <PositionSection 
        title="Forwards" 
        titleAr="المهاجمون" 
        players={grouped.forwards}
        icon={Target}
        color="bg-red-500"
      />
    </div>
  );

  return (
    <>
    <div className={`container mx-auto p-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="mb-8">
        
        <BackButton />
<h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
          <Users className="w-8 h-8" />
          {isRTL ? 'قوائم الفرق' : 'Team Rosters'}
        </h1>
        <p className="text-muted-foreground">
          {isRTL 
            ? 'عرض تشكيلة الفريق الأول وفريق الأكاديمية'
            : 'View Main Team and Academy Team rosters'}
        </p>
      </div>

      {/* Team Comparison Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="brand-gradient-subtle border-gold/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gold" />
              {isRTL ? 'الفريق الأول' : 'Main Team'}
            </CardTitle>
            <CardDescription>
              {isRTL ? 'للدوريات والبطولات الرسمية' : 'For leagues and official tournaments'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold">{mainTeamPlayers.length}</p>
                <p className="text-sm text-muted-foreground">{isRTL ? 'لاعب' : 'Players'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{mainTeams.length} {isRTL ? 'فريق' : 'Teams'}</p>
                <Badge className="bg-gold text-foreground mt-1">
                  {isRTL ? 'الدرجة الأولى' : 'Class A'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="brand-gradient-subtle border-blue-500/30">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              {isRTL ? 'فريق الأكاديمية' : 'Academy Team'}
            </CardTitle>
            <CardDescription>
              {isRTL ? 'للتدريب والكؤوس الودية' : 'For training and friendly cups'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-4xl font-bold">{academyPlayers.length}</p>
                <p className="text-sm text-muted-foreground">{isRTL ? 'لاعب' : 'Players'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{academyTeams.length} {isRTL ? 'فريق' : 'Teams'}</p>
                <Badge variant="outline" className="border-blue-500 text-blue-600 mt-1">
                  {isRTL ? 'تطوير' : 'Development'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Team Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="main" className="gap-2">
            <Trophy className="w-4 h-4" />
            {isRTL ? 'الفريق الأول' : 'Main Team'}
          </TabsTrigger>
          <TabsTrigger value="academy" className="gap-2">
            <Shield className="w-4 h-4" />
            {isRTL ? 'الأكاديمية' : 'Academy'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="main">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-gold" />
                {isRTL ? 'تشكيلة الفريق الأول' : 'Main Team Roster'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? `${mainTeamPlayers.length} لاعب في الفريق الأول`
                  : `${mainTeamPlayers.length} players in the Main Team`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {mainTeamPlayers.length > 0 ? (
                <TeamRosterView grouped={mainGrouped} teamType="main" />
              ) : (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {isRTL ? 'لا يوجد لاعبون في الفريق الأول' : 'No players in Main Team'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {isRTL 
                      ? 'قم بتعيين اللاعبين من صفحة تعيين الفرق'
                      : 'Assign players from the Team Assignment page'}
                  </p>
                  <Link href="/admin/team-assignment">
                    <Button>
                      {isRTL ? 'تعيين اللاعبين' : 'Assign Players'}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academy">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-500" />
                {isRTL ? 'تشكيلة فريق الأكاديمية' : 'Academy Team Roster'}
              </CardTitle>
              <CardDescription>
                {isRTL 
                  ? `${academyPlayers.length} لاعب في فريق الأكاديمية`
                  : `${academyPlayers.length} players in the Academy Team`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {academyPlayers.length > 0 ? (
                <TeamRosterView grouped={academyGrouped} teamType="academy" />
              ) : (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {isRTL ? 'لا يوجد لاعبون في الأكاديمية' : 'No players in Academy'}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {isRTL 
                      ? 'قم بتعيين اللاعبين من صفحة تعيين الفرق'
                      : 'Assign players from the Team Assignment page'}
                  </p>
                  <Link href="/admin/team-assignment">
                    <Button>
                      {isRTL ? 'تعيين اللاعبين' : 'Assign Players'}
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
