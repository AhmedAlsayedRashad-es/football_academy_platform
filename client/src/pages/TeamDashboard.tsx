import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayoutSkeleton } from '@/components/DashboardLayoutSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc';
import { useLocation, useSearch } from 'wouter';
import { Users, Trophy, Shield, Activity, Calendar, Target, TrendingUp, Heart, BarChart3, ChevronRight, Loader2, Filter, ArrowLeft } from 'lucide-react';
import { BackButton } from '@/components/BackButton';

export default function TeamDashboard() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();

  // Get team type from URL query parameter
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const teamType = params.get('team') as 'main' | 'academy' | null;

  // Selected specific team ID (null = show all teams of this type)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  // Fetch all teams of this type
  const { data: teams, isLoading: teamsLoading } = trpc.teams.getByType.useQuery(
    { teamType: teamType! },
    { enabled: !!teamType }
  );

  // Fetch players - either by specific team or by team type
  const { data: playersByTeam, isLoading: playersByTeamLoading } = trpc.players.getByTeam.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );
  const { data: playersByType, isLoading: playersByTypeLoading } = trpc.players.getByTeamType.useQuery(
    { teamType: teamType! },
    { enabled: !!teamType && !selectedTeamId }
  );

  const players = selectedTeamId ? playersByTeam : playersByType;
  const playersLoading = selectedTeamId ? playersByTeamLoading : playersByTypeLoading;

  const { data: coaches, isLoading: coachesLoading } = trpc.teams.getAllCoachAssignments.useQuery();

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation('/');
    return null;
  }

  const isLoading = teamsLoading || playersLoading || coachesLoading;

  // Filter coaches for selected team or team type
  const teamCoaches = coaches?.filter(c =>
    selectedTeamId
      ? c.teamId === selectedTeamId
      : c.teamType === teamType
  ) || [];

  // Calculate statistics
  const totalPlayers = players?.length || 0;
  const activePlayers = players?.filter(p => p.status === 'active').length || 0;
  const injuredPlayers = players?.filter(p => p.status === 'injured').length || 0;
  const trialPlayers = players?.filter(p => p.status === 'trial').length || 0;

  // Position distribution
  const positionStats = {
    goalkeeper: players?.filter(p => p.position === 'goalkeeper').length || 0,
    defender: players?.filter(p => p.position === 'defender').length || 0,
    midfielder: players?.filter(p => p.position === 'midfielder').length || 0,
    forward: players?.filter(p => p.position === 'forward').length || 0,
  };

  // Age group distribution
  const ageGroups = players?.reduce((acc, player) => {
    const group = player.ageGroup || 'Unknown';
    acc[group] = (acc[group] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Selected team info
  const selectedTeam = teams?.find(t => t.id === selectedTeamId);
  const pageTitle = selectedTeam
    ? selectedTeam.name
    : teamType === 'main'
    ? (language === 'ar' ? 'لوحة تحكم الفريق الأول' : 'Main Team Dashboard')
    : teamType === 'academy'
    ? (language === 'ar' ? 'لوحة تحكم الأكاديمية' : 'Academy Dashboard')
    : (language === 'ar' ? 'لوحة التحكم' : 'Dashboard');

  const pageSubtitle = selectedTeam
    ? `${selectedTeam.ageGroup || ''} · ${selectedTeam.teamType === 'main' ? 'Main Team' : 'Academy'}`
    : teamType === 'main' ? 'Overview of Main Team' : 'Overview of Academy Teams';

  if (!teamType) {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <Card className="w-96">
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar'
                  ? 'يرجى اختيار فريق من القائمة الجانبية'
                  : 'Please select a team from the sidebar'}
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Team Selector */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${teamType === 'main' ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-blue-100 dark:bg-blue-900'}`}>
              {teamType === 'main' ? (
                <Trophy className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              )}
            </div>
            <div>
              
              <BackButton />
<h1 className="text-3xl font-bold">{pageTitle}</h1>
              <p className="text-muted-foreground">{pageSubtitle}</p>
            </div>
          </div>

          {/* Team Filter Selector */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select
              value={selectedTeamId ? String(selectedTeamId) : 'all'}
              onValueChange={(val) => setSelectedTeamId(val === 'all' ? null : Number(val))}
            >
              <SelectTrigger className="w-52">
                <SelectValue placeholder={language === 'ar' ? 'اختر الفريق' : 'Select Team'} />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">
                  {language === 'ar' ? 'جميع الفرق' : 'All Teams'}
                </SelectItem>
                {teams?.map(team => (
                  <SelectItem key={team.id} value={String(team.id)}>
                    {team.name} {team.ageGroup ? `(${team.ageGroup})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'إجمالي اللاعبين' : 'Total Players'}
                      </p>
                      <p className="text-2xl font-bold">{totalPlayers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                      <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'اللاعبين النشطين' : 'Active Players'}
                      </p>
                      <p className="text-2xl font-bold">{activePlayers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900 rounded-lg">
                      <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'المصابين' : 'Injured'}
                      </p>
                      <p className="text-2xl font-bold">{injuredPlayers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                      <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {language === 'ar' ? 'تحت التجربة' : 'On Trial'}
                      </p>
                      <p className="text-2xl font-bold">{trialPlayers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Teams Overview (when no specific team selected) */}
            {!selectedTeamId && teams && teams.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {language === 'ar' ? 'الفرق' : 'Teams'} ({teams.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {teams.map(team => {
                      const teamPlayerCount = (playersByType as any[])?.filter((p: any) => p.teamId === team.id).length ?? 0;
                      return (
                        <div
                          key={team.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors border border-transparent hover:border-primary/20"
                          onClick={() => setSelectedTeamId(team.id)}
                        >
                          <div>
                            <p className="font-semibold">{team.name}</p>
                            {team.ageGroup && (
                              <p className="text-xs text-muted-foreground">{team.ageGroup}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold" title={`${teamPlayerCount} players`}>
                              {teamPlayerCount}
                            </span>
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Position Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {language === 'ar' ? 'توزيع المراكز' : 'Position Distribution'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{language === 'ar' ? 'حراس المرمى' : 'Goalkeepers'}</span>
                        <span>{positionStats.goalkeeper}</span>
                      </div>
                      <Progress value={totalPlayers > 0 ? (positionStats.goalkeeper / totalPlayers) * 100 : 0} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{language === 'ar' ? 'المدافعين' : 'Defenders'}</span>
                        <span>{positionStats.defender}</span>
                      </div>
                      <Progress value={totalPlayers > 0 ? (positionStats.defender / totalPlayers) * 100 : 0} className="h-2 bg-blue-100 [&>div]:bg-blue-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{language === 'ar' ? 'لاعبي الوسط' : 'Midfielders'}</span>
                        <span>{positionStats.midfielder}</span>
                      </div>
                      <Progress value={totalPlayers > 0 ? (positionStats.midfielder / totalPlayers) * 100 : 0} className="h-2 bg-green-100 [&>div]:bg-green-500" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{language === 'ar' ? 'المهاجمين' : 'Forwards'}</span>
                        <span>{positionStats.forward}</span>
                      </div>
                      <Progress value={totalPlayers > 0 ? (positionStats.forward / totalPlayers) * 100 : 0} className="h-2 bg-red-100 [&>div]:bg-red-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Age Groups */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    {language === 'ar' ? 'الفئات العمرية' : 'Age Groups'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(ageGroups).sort().map(([group, count]) => (
                      <div key={group} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                        <span className="font-medium">{group}</span>
                        <Badge variant="secondary">{count} {language === 'ar' ? 'لاعب' : 'players'}</Badge>
                      </div>
                    ))}
                    {Object.keys(ageGroups).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        {language === 'ar' ? 'لا توجد بيانات' : 'No data available'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Coaching Staff */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {language === 'ar' ? 'الطاقم الفني' : 'Coaching Staff'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teamCoaches.map((coach) => (
                      <div key={coach.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{coach.coachName || coach.coachEmail}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {coach.role?.replace('_', ' ')}
                            </Badge>
                            {coach.isPrimary && (
                              <Badge className="text-xs bg-yellow-500">
                                {language === 'ar' ? 'رئيسي' : 'Primary'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {teamCoaches.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        {language === 'ar' ? 'لم يتم تعيين مدربين' : 'No coaches assigned'}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{language === 'ar' ? 'إجراءات سريعة' : 'Quick Actions'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setLocation(`/players?team=${teamType}${selectedTeamId ? `&teamId=${selectedTeamId}` : ''}`)}
                  >
                    <Users className="h-6 w-6" />
                    <span>{language === 'ar' ? 'عرض اللاعبين' : 'View Players'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setLocation(`/training?team=${teamType}`)}
                  >
                    <Calendar className="h-6 w-6" />
                    <span>{language === 'ar' ? 'التدريب' : 'Training'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setLocation(`/matches?team=${teamType}`)}
                  >
                    <Trophy className="h-6 w-6" />
                    <span>{language === 'ar' ? 'المباريات' : 'Matches'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-4 flex flex-col items-center gap-2"
                    onClick={() => setLocation(`/analytics?team=${teamType}`)}
                  >
                    <TrendingUp className="h-6 w-6" />
                    <span>{language === 'ar' ? 'التحليلات' : 'Analytics'}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Players */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{language === 'ar' ? 'أحدث اللاعبين' : 'Recent Players'}</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setLocation(`/players?team=${teamType}`)}>
                  {language === 'ar' ? 'عرض الكل' : 'View All'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players?.slice(0, 5).map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => setLocation(`/players/${player.id}/scorecard`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-medium">
                          {player.firstName?.charAt(0)}{player.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{player.firstName} {player.lastName}</p>
                          <p className="text-sm text-muted-foreground">{player.position} • {player.ageGroup}</p>
                        </div>
                      </div>
                      <Badge variant={player.status === 'active' ? 'default' : player.status === 'injured' ? 'destructive' : 'secondary'}>
                        {player.status}
                      </Badge>
                    </div>
                  ))}
                  {(!players || players.length === 0) && (
                    <p className="text-muted-foreground text-center py-4">
                      {language === 'ar' ? 'لا يوجد لاعبين' : 'No players found'}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
