import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Activity, TrendingUp, Target, Award, Calendar, Brain, ArrowLeft} from 'lucide-react';
import { useLocation } from 'wouter';
import { BackButton } from '@/components/BackButton';


export default function PerformanceDashboard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<"week" | "month" | "season" | "all">("month");

  // Fetch player data based on user role
  const { data: players } = trpc.players.getAll.useQuery();
  const { data: playerMetrics } = trpc.playermaker.getPlayerMetrics.useQuery(
    { playerId: selectedPlayerId!, dateRange },
    { enabled: !!selectedPlayerId }
  );
  const { data: attendance } = trpc.attendance.getPlayerAttendance.useQuery(
    { playerId: selectedPlayerId!, dateRange },
    { enabled: !!selectedPlayerId }
  );
  const { data: skillAssessments } = trpc.skillScores.getLatest.useQuery(
    { playerId: selectedPlayerId! },
    { enabled: !!selectedPlayerId }
  );
  // analyzePlayer is a mutation, so it can't be driven by useQuery — run it when
  // the selected player changes and read the result off the mutation.
  const analyzePlayer = trpc.aiCoach.analyzePlayer.useMutation();
  const aiRecommendations = analyzePlayer.data;
  useEffect(() => {
    if (selectedPlayerId) {
      analyzePlayer.mutate({ playerId: selectedPlayerId });
    }
  }, [selectedPlayerId]);

  // Set default player if not selected
  if (!selectedPlayerId && players && players.length > 0) {
    setSelectedPlayerId(players[0].id);
  }

  const selectedPlayer = players?.find(p => p.id === selectedPlayerId);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            
            <BackButton />
<h1 className="text-3xl font-bold">
              {language === "ar" ? "لوحة الأداء" : "Performance Dashboard"}
            </h1>
            <p className="text-muted-foreground">
              {language === "ar" 
                ? "تتبع شامل للأداء والتقدم" 
                : "Comprehensive performance tracking and progress"}
            </p>
          </div>
          
          <div className="flex gap-3">
            {/* Player Selector */}
            <Select value={selectedPlayerId?.toString()} onValueChange={(val) => setSelectedPlayerId(parseInt(val))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={language === "ar" ? "اختر لاعب" : "Select Player"} />
              </SelectTrigger>
              <SelectContent>
                {players?.map((player) => (
                  <SelectItem key={player.id} value={player.id.toString()}>
                    {`${player.firstName} ${player.lastName}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Selector */}
            <Select value={dateRange} onValueChange={(val: any) => setDateRange(val)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">{language === "ar" ? "أسبوع" : "Week"}</SelectItem>
                <SelectItem value="month">{language === "ar" ? "شهر" : "Month"}</SelectItem>
                <SelectItem value="season">{language === "ar" ? "موسم" : "Season"}</SelectItem>
                <SelectItem value="all">{language === "ar" ? "الكل" : "All Time"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "معدل الحضور" : "Attendance Rate"}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{attendance?.attendanceRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                {attendance?.totalSessions || 0} {language === "ar" ? "جلسة" : "sessions"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "متوسط المسافة" : "Avg Distance"}
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {playerMetrics?.avgDistance?.toFixed(1) || 0} km
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "لكل جلسة" : "per session"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "متوسط اللمسات" : "Avg Touches"}
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {playerMetrics?.avgTouches?.toFixed(0) || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "لكل جلسة" : "per session"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {language === "ar" ? "تقييم الأداء" : "Performance Rating"}
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {skillAssessments?.overallRating || 0}/100
              </div>
              <p className="text-xs text-muted-foreground">
                {language === "ar" ? "التقييم الشامل" : "Overall score"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="playermaker" className="space-y-4">
          <TabsList>
            <TabsTrigger value="playermaker">
              {language === "ar" ? "تحليلات PlayerMaker" : "PlayerMaker Analytics"}
            </TabsTrigger>
            <TabsTrigger value="attendance">
              {language === "ar" ? "الحضور" : "Attendance"}
            </TabsTrigger>
            <TabsTrigger value="skills">
              {language === "ar" ? "تطور المهارات" : "Skill Progression"}
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              {language === "ar" ? "توصيات الذكاء الاصطناعي" : "AI Recommendations"}
            </TabsTrigger>
          </TabsList>

          {/* PlayerMaker Analytics Tab */}
          <TabsContent value="playermaker" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Distance Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "المسافة المقطوعة" : "Distance Covered"}</CardTitle>
                  <CardDescription>
                    {language === "ar" ? "المسافة لكل جلسة" : "Distance per session"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={playerMetrics?.distanceHistory || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="distance" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Touches Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "لمسات الكرة" : "Ball Touches"}</CardTitle>
                  <CardDescription>
                    {language === "ar" ? "اللمسات لكل جلسة" : "Touches per session"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={playerMetrics?.touchesHistory || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="total" stroke="#82ca9d" name={language === "ar" ? "الإجمالي" : "Total"} />
                      <Line type="monotone" dataKey="left" stroke="#8884d8" name={language === "ar" ? "اليسار" : "Left"} />
                      <Line type="monotone" dataKey="right" stroke="#ffc658" name={language === "ar" ? "اليمين" : "Right"} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Sprint Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "إحصائيات السرعة" : "Sprint Statistics"}</CardTitle>
                  <CardDescription>
                    {language === "ar" ? "السرعة والركضات السريعة" : "Speed and sprint metrics"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={playerMetrics?.sprintHistory || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="topSpeed" stroke="#ff7300" name={language === "ar" ? "أقصى سرعة" : "Top Speed"} />
                      <Line type="monotone" dataKey="sprints" stroke="#387908" name={language === "ar" ? "الركضات" : "Sprints"} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Team Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "مقارنة مع الفريق" : "Team Comparison"}</CardTitle>
                  <CardDescription>
                    {language === "ar" ? "أداءك مقارنة بمتوسط الفريق" : "Your performance vs team average"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {playerMetrics?.teamComparison?.map((metric: any) => (
                      <div key={metric.name} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{language === "ar" ? metric.nameAr : metric.name}</span>
                          <span className="font-medium">{metric.playerValue} / {metric.teamAvg}</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${metric.playerValue > metric.teamAvg ? 'bg-green-500' : 'bg-orange-500'}`}
                            style={{ width: `${(metric.playerValue / metric.teamAvg) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "معدل الحضور" : "Attendance Trend"}</CardTitle>
                  <CardDescription>
                    {language === "ar" ? "نسبة الحضور بمرور الوقت" : "Attendance rate over time"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={attendance?.attendanceHistory || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="rate" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "سجل الحضور" : "Attendance Record"}</CardTitle>
                  <CardDescription>
                    {language === "ar" ? "آخر 10 جلسات" : "Last 10 sessions"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {attendance?.recentSessions?.map((session: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                        <span className="text-sm">{session.date}</span>
                        <span className={`text-sm font-medium ${session.attended ? 'text-green-700 dark:text-green-500' : 'text-red-500'}`}>
                          {session.attended 
                            ? (language === "ar" ? "حضر" : "Attended")
                            : (language === "ar" ? "غاب" : "Missed")}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Radar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "ملف المهارات" : "Skills Profile"}</CardTitle>
                  <CardDescription>
                    {language === "ar" ? "التقييم الحالي للمهارات" : "Current skills assessment"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    {/* radarData/progressionData aren't returned by the skills
                        endpoint yet, so these charts render empty until it does. */}
                    <RadarChart data={(skillAssessments as { radarData?: unknown[] } | undefined)?.radarData || []}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="skill" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      <Radar name={selectedPlayer ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}` : undefined} dataKey="value" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Skill Progression */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === "ar" ? "تطور المهارات" : "Skill Progression"}</CardTitle>
                  <CardDescription>
                    {language === "ar" ? "التقدم بمرور الوقت" : "Progress over time"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={(skillAssessments as { progressionData?: unknown[] } | undefined)?.progressionData || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="technical" stroke="#8884d8" />
                      <Line type="monotone" dataKey="physical" stroke="#82ca9d" />
                      <Line type="monotone" dataKey="tactical" stroke="#ffc658" />
                      <Line type="monotone" dataKey="mental" stroke="#ff7300" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  {language === "ar" ? "توصيات الذكاء الاصطناعي" : "AI-Powered Recommendations"}
                </CardTitle>
                <CardDescription>
                  {language === "ar" 
                    ? "توصيات مخصصة بناءً على أدائك" 
                    : "Personalized recommendations based on your performance"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiRecommendations ? (
                  <div className="space-y-6">
                    {/* Strengths */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-green-600">
                        {language === "ar" ? "نقاط القوة" : "Strengths"}
                      </h3>
                      <ul className="space-y-2">
                        {aiRecommendations.strengths?.map((strength: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600 mt-1" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Areas for Improvement */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 text-orange-600">
                        {language === "ar" ? "مجالات التحسين" : "Areas for Improvement"}
                      </h3>
                      <ul className="space-y-2">
                        {aiRecommendations.weaknesses?.map((weakness: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <Target className="h-4 w-4 text-orange-600 mt-1" />
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Training Recommendations */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3">
                        {language === "ar" ? "توصيات التدريب" : "Training Recommendations"}
                      </h3>
                      <div className="space-y-3">
                        {aiRecommendations.recommendations?.map((rec: any, index: number) => (
                          <Card key={index}>
                            <CardContent className="pt-4">
                              <h4 className="font-medium mb-2">{rec.title}</h4>
                              <p className="text-sm text-muted-foreground">{rec.description}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {language === "ar" 
                      ? "جاري تحميل التوصيات..." 
                      : "Loading recommendations..."}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
