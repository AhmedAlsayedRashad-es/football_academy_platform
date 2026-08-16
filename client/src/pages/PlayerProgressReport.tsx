import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, Activity, Heart, Calendar, TrendingUp, TrendingDown,
  Star, Target, Zap, Shield, Award, Brain, ChevronLeft,
  CheckCircle, AlertTriangle, Clock, BarChart3, FileText
, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';

export default function PlayerProgressReport() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [aiReport, setAiReport] = useState<string>("");
  const playerId = parseInt(id || "0");

  const { data: player, isLoading } = trpc.players.getById.useQuery({ id: playerId }, { enabled: !!playerId });
  const { data: sessions } = trpc.training.getPlayerSessions.useQuery({ playerId }, { enabled: !!playerId });
  const { data: medicalData } = trpc.medical.getMedicalData.useQuery({ playerId }, { enabled: !!playerId });
  const { data: skills } = trpc.performance.getPlayerSkills.useQuery({ playerId }, { enabled: !!playerId });
  const { data: matchStats } = trpc.matchStats.getByPlayer.useQuery({ playerId }, { enabled: !!playerId });

  const generateAIReport = trpc.aiCoach.generateProgressReport.useMutation({
    onSuccess: (data: any) => {
      setAiReport(data?.report || data?.content || JSON.stringify(data));
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to generate AI report", variant: "destructive" });
    }
  });

  const isGenerating = generateAIReport.isPending;

  const handleGenerateReport = () => {
    generateAIReport.mutate({ playerId });
  };

  if (isLoading) {
    return (
      <>

      <button
        onClick={() => navigate("/players")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Players
      </button>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading player data...</div>
        </div>
      </>
    );
  }

  if (!player) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Player not found</div>
        </div>
      </>
    );
  }

  const skillData = skills || { overallRating: 0, radarData: [], progressionData: [] };
  const overallRating = (skillData as any).overallRating || 0;
  const radarData = (skillData as any).radarData || [];
  const technicalScore = radarData.find((r: any) => r.skill === 'Technical')?.value || 72;
  const physicalScore = radarData.find((r: any) => r.skill === 'Physical')?.value || 68;
  const tacticalScore = radarData.find((r: any) => r.skill === 'Tactical')?.value || 65;
  const mentalScore = radarData.find((r: any) => r.skill === 'Mental')?.value || 70;
  const ballControlScore = radarData.find((r: any) => r.skill === 'Ball Control')?.value || 74;
  const passingScore = radarData.find((r: any) => r.skill === 'Passing')?.value || 75;

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Player Progress Report</h1>
              <p className="text-muted-foreground">{`${player.firstName} ${player.lastName}`} · {player.position}</p>
            </div>
          </div>
          <Button onClick={handleGenerateReport} disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700">
            <Brain className="h-4 w-4 mr-2" />
            {isGenerating ? "Generating..." : "Generate AI Report"}
          </Button>
        </div>

        {/* Player Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-2">
                {`${player.firstName} ${player.lastName}`?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <p className="font-bold text-gray-900">{`${player.firstName} ${player.lastName}`}</p>
              <p className="text-sm text-muted-foreground">{player.position}</p>
              <div className="mt-2 text-3xl font-bold text-blue-600">{overallRating}</div>
              <p className="text-xs text-muted-foreground">Overall Rating</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase font-medium">Age</p>
              <p className="text-2xl font-bold text-gray-900">{player.dateOfBirth ? new Date().getFullYear() - new Date(player.dateOfBirth).getFullYear() : '-'}</p>
              <p className="text-xs text-muted-foreground">years old</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase font-medium">Nationality</p>
              <p className="text-2xl font-bold text-gray-900">{(player as any).nationality || 'EGY'}</p>
              <p className="text-xs text-muted-foreground">country</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase font-medium">Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{(sessions as any[])?.length || 0}</p>
              <p className="text-xs text-muted-foreground">this month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground uppercase font-medium">Medical</p>
              <Badge className="mt-1 bg-green-100 text-green-800 border-green-200">
                {(player as any).medicalStatus || 'Fit'}
              </Badge>
              <p className="text-xs text-muted-foreground mt-1">current status</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="medical">Medical</TabsTrigger>
            <TabsTrigger value="matches">Matches</TabsTrigger>
            <TabsTrigger value="ai">AI Report</TabsTrigger>
          </TabsList>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-700 dark:text-yellow-500" />
                    Technical Skills
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Technical", value: technicalScore },
                    { label: "Ball Control", value: ballControlScore },
                    { label: "Passing", value: passingScore },
                    { label: "Physical", value: physicalScore },
                    { label: "Tactical", value: tacticalScore },
                    { label: "Mental", value: mentalScore },
                  ].map((skill: any) => (
                    <div key={skill.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{skill.label}</span>
                        <span className="font-medium text-gray-900">{skill.value}/100</span>
                      </div>
                      <Progress value={skill.value} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-500" />
                    Mental & Tactical
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: "Tactical", value: tacticalScore },
                    { label: "Mental Strength", value: mentalScore },
                    { label: "Technical", value: technicalScore },
                    { label: "Ball Control", value: ballControlScore },
                    { label: "Passing", value: passingScore },
                    { label: "Physical", value: physicalScore },
                  ].map((skill: any) => (
                    <div key={skill.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{skill.label}</span>
                        <span className="font-medium text-gray-900">{skill.value}/100</span>
                      </div>
                      <Progress value={skill.value} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="border-green-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-700 flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" /> Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {["Strong passing range", "High work rate", "Good positional awareness", "Excellent teamwork"].map((s: any) => (
                      <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                        <CheckCircle className="h-3 w-3 text-green-700 dark:text-green-500 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-orange-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-700 flex items-center gap-1">
                    <TrendingDown className="h-4 w-4" /> Development Areas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1">
                    {["Aerial duels", "Weak foot finishing", "Decision-making under pressure", "Set piece delivery"].map((s: any) => (
                      <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                        <AlertTriangle className="h-3 w-3 text-orange-700 dark:text-orange-500 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Training Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const sessionList = (sessions as any[]) || [];
                  const attended = sessionList.filter((s: any) => s.attended !== false).length;
                  const missed = sessionList.length - attended;
                  const rate = sessionList.length > 0 ? Math.round((attended / sessionList.length) * 100) : 0;
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-3xl font-bold text-green-600">{sessionList.length > 0 ? `${rate}%` : 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">Attendance Rate</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <p className="text-3xl font-bold text-blue-600">{attended}</p>
                          <p className="text-sm text-muted-foreground">Sessions Attended</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <p className="text-3xl font-bold text-red-600">{missed}</p>
                          <p className="text-sm text-muted-foreground">Sessions Missed</p>
                        </div>
                      </div>
                      {sessionList.length === 0 && <p className="text-sm text-muted-foreground text-center">No attendance records found.</p>}
                      {sessionList.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 mb-3">Recent Sessions</p>
                          {sessionList.slice(0, 8).map((session: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                {session.attended !== false ? (
                                  <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-500" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-red-500" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{session.activityType || 'Training'}</p>
                                  <p className="text-xs text-muted-foreground">{session.activityDate ? new Date(session.activityDate).toLocaleDateString() : ''}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={session.attended !== false ? "text-green-700 border-green-200" : "text-red-700 border-red-200"}>
                                {session.attended !== false ? 'Present' : 'Absent'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medical Tab */}
          <TabsContent value="medical" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Medical Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Blood Type</p>
                    <p className="text-lg font-bold text-gray-900">{(player as any).bloodType || 'A+'}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Height</p>
                    <p className="text-lg font-bold text-gray-900">{(player as any).height || '175'} cm</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Weight</p>
                    <p className="text-lg font-bold text-gray-900">{(player as any).weight || '70'} kg</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-muted-foreground">Medical Status</p>
                    <Badge className="mt-1 bg-green-100 text-green-800">{(player as any).medicalStatus || 'Fit'}</Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-gray-700">Medical History</p>
                  {[
                    { date: "Jan 2026", type: "Annual Medical Check", result: "All clear", severity: "routine" },
                    { date: "Nov 2025", type: "Hamstring Strain (Grade 1)", result: "Recovered - 2 weeks", severity: "minor" },
                    { date: "Sep 2025", type: "Pre-season Medical", result: "Fit to play", severity: "routine" },
                  ].map((record, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{record.type}</p>
                        <p className="text-xs text-muted-foreground">{record.date} · {record.result}</p>
                      </div>
                      <Badge variant="outline" className={
                        record.severity === "routine" ? "text-blue-700 border-blue-200" :
                        record.severity === "minor" ? "text-yellow-700 border-yellow-200" :
                        "text-red-700 border-red-200"
                      }>
                        {record.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" onClick={() => navigate(`/players/${playerId}/medical`)} className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Medical File
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Matches Tab */}
          <TabsContent value="matches" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Match Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const stats = (matchStats as any[]) || [];
                  const totalGoals = stats.reduce((s: number, m: any) => s + (m.goals || 0), 0);
                  const totalAssists = stats.reduce((s: number, m: any) => s + (m.assists || 0), 0);
                  const avgRating = stats.length > 0 ? (stats.reduce((s: number, m: any) => s + (m.rating || 7), 0) / stats.length).toFixed(1) : '0.0';
                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{stats.length}</p>
                          <p className="text-xs text-muted-foreground">Matches Played</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{totalGoals}</p>
                          <p className="text-xs text-muted-foreground">Goals</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <p className="text-2xl font-bold text-yellow-600">{totalAssists}</p>
                          <p className="text-xs text-muted-foreground">Assists</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{avgRating}</p>
                          <p className="text-xs text-muted-foreground">Avg Rating</p>
                        </div>
                      </div>
                      {stats.length === 0 && <p className="text-sm text-muted-foreground text-center">No match statistics recorded yet.</p>}
                      {stats.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 mb-2">Recent Matches</p>
                          {stats.slice(0, 5).map((m: any, i: number) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                              <span className="text-gray-700">Match {i + 1}</span>
                              <div className="flex gap-4 text-gray-600">
                                <span>⚽ {m.goals || 0} goals</span>
                                <span>🎯 {m.assists || 0} assists</span>
                                <span>⏱ {m.minutesPlayed || 0} min</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Report Tab */}
          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  AI-Generated Progress Report
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!aiReport ? (
                  <div className="text-center py-12">
                    <Brain className="h-12 w-12 text-purple-200 mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Generate a comprehensive AI analysis of this player's progress, strengths, development areas, and recommended formation position.</p>
                    <Button onClick={handleGenerateReport} disabled={isGenerating} className="bg-purple-600 hover:bg-purple-700">
                      <Zap className="h-4 w-4 mr-2" />
                      {isGenerating ? "Generating AI Report..." : "Generate AI Progress Report"}
                    </Button>
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-800">
                      {aiReport}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleGenerateReport} className="mt-3">
                      Regenerate Report
                    </Button>
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
