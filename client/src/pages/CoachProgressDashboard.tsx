import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { PageSkeleton } from "@/components/PageSkeleton";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Star,
  Target,
  Activity,
  Award,
  Clock,
  ChevronRight,
  ArrowLeft,
  BarChart3,
  User,
  Dumbbell
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from '@/contexts/LanguageContext';

export default function CoachProgressDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  const { data: playerOverview, isLoading: loadingOverview } = trpc.coachProgress.getPlayerOverview.useQuery();
  const { data: myStats, isLoading: loadingStats } = trpc.coachProgress.getMyStats.useQuery();
  const { data: playerProgress, isLoading: loadingProgress } = trpc.coachProgress.getPlayerProgress.useQuery(
    { playerId: selectedPlayerId! },
    { enabled: !!selectedPlayerId }
  );

  const isCoach = user?.role === 'coach' || user?.role === 'admin';

  if (loadingOverview || loadingStats) {
    return (
      <>
        <div >
          <PageSkeleton cards={4} rows={5} />
        </div>
      </>
    );
  }
    if (!isCoach) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="max-w-md">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">This page is only accessible to coaches.</p>
              <Link href="/">
                <Button className="mt-4">Go Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
    <div >
      {/* Header */}
      <div className="brand-gradient text-white">
        <div className="container py-8">
          <Link href="/booking-management">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-8 w-8" />
            <div>
              <h1 className="text-3xl font-bold">Player Progress Dashboard</h1>
              <p className="text-indigo-100 mt-1">
                Monitor your players' development and performance
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Coach Stats Overview */}
        {myStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{myStats.uniquePlayers || 0}</p>
                    <p className="text-xs text-muted-foreground">Total Players</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{myStats.completedSessions || 0}</p>
                    <p className="text-xs text-muted-foreground">Sessions Done</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{(myStats.avgRating || 0).toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Award className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{myStats.totalReviews || 0}</p>
                    <p className="text-xs text-muted-foreground">Reviews</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{(myStats.totalRevenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Total EGP</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="players" className="space-y-6">
          <TabsList>
            <TabsTrigger value="players" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              My Players
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Player Details
            </TabsTrigger>
          </TabsList>

          {/* Players Tab */}
          <TabsContent value="players">
            <Card>
              <CardHeader>
                <CardTitle>Players You've Trained</CardTitle>
                <CardDescription>
                  Click on a player to view their detailed progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingOverview ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading players...
                  </div>
                ) : !playerOverview || playerOverview.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Players Yet</h3>
                    <p className="text-muted-foreground">
                      You haven't conducted any private training sessions yet.
                    </p>
                    <Link href="/coach-schedule">
                      <Button className="mt-4">
                        Set Up Your Schedule
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {playerOverview.map((player) => (
                      <div 
                        key={player.playerId}
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          selectedPlayerId === player.playerId 
                            ? 'bg-primary/5 border-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedPlayerId(player.playerId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                              {player.playerFirstName?.[0]}{player.playerLastName?.[0]}
                            </div>
                            <div>
                              <h3 className="font-semibold">
                                {player.playerFirstName} {player.playerLastName}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <span>{player.playerPosition || 'Position TBD'}</span>
                                <span>•</span>
                                <span>{player.playerAgeGroup || 'Age TBD'}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="font-semibold">{player.completedSessions || 0}</p>
                              <p className="text-xs text-muted-foreground">Sessions</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Last Session</p>
                              <p className="text-sm">{formatDate(player.lastSession)}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Player Details Tab */}
          <TabsContent value="progress">
            {!selectedPlayerId ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
                  <p className="text-muted-foreground">
                    Choose a player from the "My Players" tab to view their detailed progress.
                  </p>
                </CardContent>
              </Card>
            ) : loadingProgress ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading player progress...
              </div>
            ) : playerProgress ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Attendance & Training */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Attendance & Training
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Attendance Rate</span>
                        <span className="text-sm font-semibold">
                          {playerProgress.attendance.totalSessions > 0 
                            ? Math.round((playerProgress.attendance.attendedSessions / playerProgress.attendance.totalSessions) * 100)
                            : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={playerProgress.attendance.totalSessions > 0 
                          ? (playerProgress.attendance.attendedSessions / playerProgress.attendance.totalSessions) * 100
                          : 0} 
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {playerProgress.attendance.attendedSessions} of {playerProgress.attendance.totalSessions} sessions attended
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">Drill Completion</span>
                        <span className="text-sm font-semibold">
                          {playerProgress.drillProgress.totalAssigned > 0 
                            ? Math.round((playerProgress.drillProgress.completed / playerProgress.drillProgress.totalAssigned) * 100)
                            : 0}%
                        </span>
                      </div>
                      <Progress 
                        value={playerProgress.drillProgress.totalAssigned > 0 
                          ? (playerProgress.drillProgress.completed / playerProgress.drillProgress.totalAssigned) * 100
                          : 0} 
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {playerProgress.drillProgress.completed} of {playerProgress.drillProgress.totalAssigned} drills completed
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Match Performance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Match Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-3xl font-bold text-primary">
                          {playerProgress.matchStats.totalMatches || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Matches</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-3xl font-bold text-green-600">
                          {playerProgress.matchStats.totalGoals || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Goals</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-3xl font-bold text-blue-600">
                          {playerProgress.matchStats.totalAssists || 0}
                        </p>
                        <p className="text-sm text-muted-foreground">Assists</p>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <p className="text-3xl font-bold text-yellow-600">
                          {Math.round(playerProgress.matchStats.avgMinutesPlayed || 0)}
                        </p>
                        <p className="text-sm text-muted-foreground">Avg Minutes</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Skill Scores */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Dumbbell className="h-5 w-5" />
                      Skill Development
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {playerProgress.skillScores && playerProgress.skillScores.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { name: 'Ball Control', score: playerProgress.skillScores[0]?.ballControl || 0 },
                          { name: 'First Touch', score: playerProgress.skillScores[0]?.firstTouch || 0 },
                          { name: 'Dribbling', score: playerProgress.skillScores[0]?.dribbling || 0 },
                          { name: 'Passing', score: playerProgress.skillScores[0]?.passing || 0 },
                          { name: 'Shooting', score: playerProgress.skillScores[0]?.shooting || 0 },
                          { name: 'Crossing', score: playerProgress.skillScores[0]?.crossing || 0 },
                          { name: 'Heading', score: playerProgress.skillScores[0]?.heading || 0 },
                        ].map((skill, index) => (
                          <div key={index} className="text-center">
                            <div className="relative w-20 h-20 mx-auto mb-2">
                              <svg className="w-20 h-20 transform -rotate-90">
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="36"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="none"
                                  className="text-muted"
                                />
                                <circle
                                  cx="40"
                                  cy="40"
                                  r="36"
                                  stroke="currentColor"
                                  strokeWidth="8"
                                  fill="none"
                                  strokeDasharray={`${(skill.score / 100) * 226} 226`}
                                  className="text-primary"
                                />
                              </svg>
                              <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                                {skill.score}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{skill.name}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No skill assessments recorded yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">
                    Unable to load player progress data.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Quick Links */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/coach-reminders">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <Clock className="h-8 w-8 text-green-600" />
                <div>
                  <h3 className="font-semibold">Session Reminders</h3>
                  <p className="text-sm text-muted-foreground">Send WhatsApp reminders</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/coach-schedule">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold">My Schedule</h3>
                  <p className="text-sm text-muted-foreground">Manage availability</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/training-library">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <Dumbbell className="h-8 w-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Training Library</h3>
                  <p className="text-sm text-muted-foreground">Assign drills to players</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/skill-assessment">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-6 flex items-center gap-4">
                <Target className="h-8 w-8 text-orange-600" />
                <div>
                  <h3 className="font-semibold">Skill Assessment</h3>
                  <p className="text-sm text-muted-foreground">Rate player skills</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
