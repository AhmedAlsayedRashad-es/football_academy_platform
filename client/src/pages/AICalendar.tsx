import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Calendar, Loader2, Sparkles, Clock, TrendingUp, AlertCircle, CheckCircle2, ArrowLeft} from 'lucide-react';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AIBreadcrumb } from "@/components/AIBreadcrumb";
import { useLanguage } from "@/contexts/LanguageContext";


export default function AICalendar() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [schedule, setSchedule] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: teams, isLoading: teamsLoading } = trpc.teams.getAll.useQuery();
  const { data: upcomingMatches } = trpc.matches.getAll.useQuery();

  const generateSchedule = trpc.aiCalendar.generateSchedule.useMutation({
    onSuccess: (data) => {
      setSchedule(data);
      setIsGenerating(false);
      toast.success("Training schedule generated successfully!");
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error("Failed to generate schedule: " + error.message);
    },
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const handleGenerate = () => {
    if (!selectedTeamId) {
      toast.error("Please select a team");
      return;
    }
    setIsGenerating(true);
    setSchedule(null);
    generateSchedule.mutate({ teamId: selectedTeamId });
  };

  const selectedTeam = teams?.find(t => t.id === selectedTeamId);
  const teamMatches = upcomingMatches?.filter(m => m.teamId === selectedTeamId) || [];

  // Parse schedule
  const parseSchedule = (data: any) => {
    if (!data || !data.schedule) return null;
    
    const text = data.schedule;
    const days = [];
    const lines = text.split('\n').filter((line: string) => line.trim());
    
    let currentDay: any = null;
    
    for (const line of lines) {
      // Check if line is a day header
      if (line.match(/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Day \d+)/i)) {
        if (currentDay) days.push(currentDay);
        currentDay = {
          day: line.trim().replace(/[:-]/g, '').trim(),
          sessions: [],
          focus: '',
          intensity: 'medium'
        };
      } else if (currentDay && line.trim().startsWith('-')) {
        const content = line.replace(/^[-•]\s*/, '').trim();
        if (content.toLowerCase().includes('focus:')) {
          currentDay.focus = content.replace(/focus:/i, '').trim();
        } else if (content.toLowerCase().includes('intensity:')) {
          const intensityMatch = content.match(/(low|medium|high)/i);
          if (intensityMatch) currentDay.intensity = intensityMatch[1].toLowerCase();
        } else if (content) {
          currentDay.sessions.push(content);
        }
      }
    }
    
    if (currentDay) days.push(currentDay);
    
    return {
      days,
      insights: data.insights || '',
      teamStats: data.teamStats || {}
    };
  };

  const parsedSchedule = schedule ? parseSchedule(schedule) : null;

  const getIntensityColor = (intensity: string) => {
    switch (intensity.toLowerCase()) {
      case 'high': return 'bg-red-500/10 text-red-700 border-red-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
      case 'low': return 'bg-green-500/10 text-green-700 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          
          <AIBreadcrumb toolLabel={language === 'ar' ? 'التقويم الذكي AI' : 'AI Smart Calendar'}/>
<h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            AI Training Calendar
          </h1>
          <p className="text-muted-foreground mt-2">
            Smart training schedule suggestions based on performance patterns and match dates
          </p>
        </div>

        {/* Team Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Generate Schedule</CardTitle>
            <CardDescription>Select a team to generate an optimized training schedule</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Select
                  value={selectedTeamId?.toString() || ""}
                  onValueChange={(value) => setSelectedTeamId(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a team" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    {teamsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading teams...
                      </SelectItem>
                    ) : teams && teams.length > 0 ? (
                      teams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name} ({team.ageGroup})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No teams available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={!selectedTeamId || isGenerating}
                className="gap-2"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5" />
                    Generate Schedule
                  </>
                )}
              </Button>
            </div>

            {selectedTeam && (
              <div className="space-y-2">
                <div className="flex gap-2 text-sm">
                  <Badge variant="outline">{selectedTeam.name}</Badge>
                  <Badge variant="outline">{selectedTeam.ageGroup}</Badge>
                </div>
                {teamMatches.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <strong>Upcoming Matches:</strong> {teamMatches.length} scheduled
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isGenerating && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing team performance and match schedule...</p>
              <p className="text-sm text-muted-foreground">Creating optimized training plan</p>
            </CardContent>
          </Card>
        )}

        {/* Schedule Display */}
        {parsedSchedule && !isGenerating && (
          <div className="space-y-4">
            {/* Insights */}
            {parsedSchedule.insights && (
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {parsedSchedule.insights}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Team Stats */}
            {parsedSchedule.teamStats && Object.keys(parsedSchedule.teamStats).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Team Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(parsedSchedule.teamStats).map(([key, value]: [string, any]) => (
                      <div key={key} className="text-center p-3 border rounded-lg">
                        <div className="text-sm text-muted-foreground capitalize mb-1">{key}</div>
                        <div className="text-2xl font-bold">{value}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weekly Schedule */}
            {parsedSchedule.days && parsedSchedule.days.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Weekly Training Schedule
                  </CardTitle>
                  <CardDescription>AI-optimized training plan for the week</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {parsedSchedule.days.map((day: any, idx: number) => (
                      <Card key={idx} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{day.day}</CardTitle>
                            <Badge variant="outline" className={getIntensityColor(day.intensity)}>
                              {day.intensity} intensity
                            </Badge>
                          </div>
                          {day.focus && (
                            <CardDescription className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Focus: {day.focus}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          {day.sessions.length > 0 ? (
                            <ul className="space-y-2">
                              {day.sessions.map((session: string, sIdx: number) => (
                                <li key={sIdx} className="flex items-start gap-2 text-sm">
                                  <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500 mt-0.5 flex-shrink-0" />
                                  <span>{session}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">Rest day - Recovery and regeneration</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fallback: Show raw schedule */}
            {(!parsedSchedule.days || parsedSchedule.days.length === 0) && schedule && (
              <Card>
                <CardHeader>
                  <CardTitle>Training Schedule</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap text-sm">{schedule.schedule}</pre>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!schedule && !isGenerating && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Calendar className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">No Schedule Generated Yet</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Select a team and click "Generate Schedule" to create an AI-optimized training plan 
                  that considers performance patterns, match dates, and recovery periods.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-purple-500 mt-0.5" />
              <div>
                <p className="font-medium mb-1">How AI Calendar Works</p>
                <p className="text-sm text-muted-foreground">
                  The AI analyzes your team's recent performance data, identifies weak areas, considers 
                  upcoming match dates, and generates an optimized weekly training schedule with appropriate 
                  intensity levels and recovery periods.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
