import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Calendar, Loader2, Download, Sparkles, Target, TrendingUp, AlertTriangle, CheckCircle, ArrowLeft} from 'lucide-react';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLanguage } from '@/contexts/LanguageContext';

export default function TrainingSessionPlanner() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [duration, setDuration] = useState<'week' | 'month'>('week');
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [plan, setPlan] = useState<string | null>(null);
  const [teamStats, setTeamStats] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: teams, isLoading: teamsLoading } = trpc.teams.getAll.useQuery();

  const generatePlan = trpc.aiCoach.generateTrainingPlan.useMutation({
    onSuccess: (data) => {
      setPlan(data.plan);
      setTeamStats(data.teamStats);
      setIsGenerating(false);
      toast.success("Training plan generated successfully!");
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error("Failed to generate plan: " + error.message);
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
    setPlan(null);
    setTeamStats(null);
    
    const focusAreasArray = focusAreas.length > 0 
      ? focusAreas as ('technical' | 'tactical' | 'physical' | 'mental')[]
      : undefined;
    
    generatePlan.mutate({ 
      teamId: selectedTeamId, 
      duration,
      focusAreas: focusAreasArray
    });
  };

  const toggleFocusArea = (area: string) => {
    setFocusAreas(prev => 
      prev.includes(area) 
        ? prev.filter(a => a !== area)
        : [...prev, area]
    );
  };

  const handleExportText = () => {
    if (!plan) return;

    const selectedTeam = teams?.find(t => t.id === selectedTeamId);
    const content = `TRAINING SESSION PLAN\n\nTeam: ${selectedTeam?.name || 'Unknown'}\nDuration: ${duration === 'week' ? '1 Week' : '1 Month'}\nGenerated: ${new Date().toLocaleDateString()}\n\n${plan}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `training-plan-${selectedTeamId}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Training plan exported!");
  };

  const selectedTeam = teams?.find(t => t.id === selectedTeamId);

  // Parse plan sections
  const parsePlan = (text: string) => {
    const sections = {
      overview: "",
      sessions: [] as string[],
      drills: [] as string[],
      outcomes: [] as string[],
    };

    const lines = text.split('\n').filter(line => line.trim());
    let currentSection = 'overview';
    let overviewLines: string[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('day ') || lower.includes('week ') || lower.includes('session')) {
        currentSection = 'sessions';
      } else if (lower.includes('drill') || lower.includes('exercise')) {
        currentSection = 'drills';
      } else if (lower.includes('outcome') || lower.includes('expected') || lower.includes('goal')) {
        currentSection = 'outcomes';
      } else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        const content = line.replace(/^[-•]\s*/, '').trim();
        if (content && currentSection !== 'overview') {
          // `overview` is a string while the rest are arrays, so narrow before pushing.
          const bucket = sections[currentSection as keyof typeof sections];
          if (Array.isArray(bucket)) bucket.push(content);
        }
      } else if (currentSection === 'overview' && line.trim()) {
        overviewLines.push(line.trim());
      }
    }

    sections.overview = overviewLines.join(' ');
    return sections;
  };

  const parsedPlan = plan ? parsePlan(plan) : null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-700 dark:text-green-500";
    if (score >= 70) return "text-yellow-700 dark:text-yellow-500";
    return "text-red-500";
  };

  const getScoreStatus = (score: number) => {
    if (score >= 80) return { icon: CheckCircle, label: "Strong", color: "green" };
    if (score >= 70) return { icon: TrendingUp, label: "Adequate", color: "yellow" };
    return { icon: AlertTriangle, label: "Needs Improvement", color: "red" };
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          
          <button onClick={() => navigate('/training')} className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">

            <ArrowLeft className="w-5 h-5" />

          </button>
<h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            Training Session Planner
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate personalized training plans based on team weaknesses and performance data
          </p>
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Configuration</CardTitle>
            <CardDescription>Select team, duration, and focus areas for the training plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Team Selection */}
            <div className="space-y-2">
              <Label>Select Team</Label>
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

            {/* Duration Selection */}
            <div className="space-y-2">
              <Label>Plan Duration</Label>
              <Select value={duration} onValueChange={(value) => setDuration(value as 'week' | 'month')}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[10001]">
                  <SelectItem value="week">1 Week</SelectItem>
                  <SelectItem value="month">1 Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Focus Areas */}
            <div className="space-y-3">
              <Label>Focus Areas (Optional - Leave empty for balanced plan)</Label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'technical', label: 'Technical Skills', icon: Target },
                  { value: 'tactical', label: 'Tactical Awareness', icon: TrendingUp },
                  { value: 'physical', label: 'Physical Fitness', icon: TrendingUp },
                  { value: 'mental', label: 'Mental Strength', icon: Target },
                ].map((area) => (
                  <div key={area.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={area.value}
                      checked={focusAreas.includes(area.value)}
                      onCheckedChange={() => toggleFocusArea(area.value)}
                    />
                    <Label
                      htmlFor={area.value}
                      className="text-sm font-normal cursor-pointer flex items-center gap-2"
                    >
                      <area.icon className="h-4 w-4" />
                      {area.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <Button 
              onClick={handleGenerate} 
              disabled={!selectedTeamId || isGenerating}
              className="w-full gap-2"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating Plan...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Training Plan
                </>
              )}
            </Button>

            {selectedTeam && (
              <div className="flex gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{selectedTeam.name}</Badge>
                <Badge variant="outline">{selectedTeam.ageGroup}</Badge>
                <Badge variant="outline">{duration === 'week' ? '7 Days' : '4 Weeks'}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Performance Stats */}
        {teamStats && (
          <Card>
            <CardHeader>
              <CardTitle>Team Performance Overview</CardTitle>
              <CardDescription>Current performance levels across all areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Technical', value: teamStats.technical, key: 'technical' },
                  { label: 'Physical', value: teamStats.physical, key: 'physical' },
                  { label: 'Tactical', value: teamStats.tactical, key: 'tactical' },
                  { label: 'Mental', value: teamStats.mental, key: 'mental' },
                ].map((stat) => {
                  const status = getScoreStatus(parseFloat(stat.value));
                  const StatusIcon = status.icon;
                  return (
                    <div key={stat.key} className="text-center p-4 border rounded-lg">
                      <div className="text-sm text-muted-foreground mb-2">{stat.label}</div>
                      <div className={`text-3xl font-bold ${getScoreColor(parseFloat(stat.value))}`}>
                        {stat.value}
                      </div>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <StatusIcon className={`h-4 w-4 text-${status.color}-500`} />
                        <span className={`text-xs text-${status.color}-500`}>{status.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isGenerating && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing team performance and generating personalized plan...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </CardContent>
          </Card>
        )}

        {/* Plan Display */}
        {parsedPlan && !isGenerating && (
          <div className="space-y-4">
            {/* Export Button */}
            <div className="flex justify-end">
              <Button onClick={handleExportText} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export Plan
              </Button>
            </div>

            {/* Overview */}
            {parsedPlan.overview && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Training Plan Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {parsedPlan.overview}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Sessions */}
            {parsedPlan.sessions.length > 0 && (
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Training Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {parsedPlan.sessions.map((session, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 border rounded-lg bg-background">
                        <Badge variant="outline" className="mt-0.5 bg-blue-500/10 text-blue-700 border-blue-500/20">
                          {idx + 1}
                        </Badge>
                        <span className="text-sm flex-1">{session}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Drills */}
            {parsedPlan.drills.length > 0 && (
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-700 dark:text-green-500" />
                    Recommended Drills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {parsedPlan.drills.map((drill, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 bg-green-500/10 text-green-700 border-green-500/20">
                          ✓
                        </Badge>
                        <span className="text-sm flex-1">{drill}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Expected Outcomes */}
            {parsedPlan.outcomes.length > 0 && (
              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    Expected Outcomes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {parsedPlan.outcomes.map((outcome, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 bg-purple-500/10 text-purple-700 border-purple-500/20">
                          →
                        </Badge>
                        <span className="text-sm flex-1">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Fallback: Show raw plan if parsing failed */}
            {!parsedPlan.overview && 
             parsedPlan.sessions.length === 0 && 
             parsedPlan.drills.length === 0 && 
             parsedPlan.outcomes.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Training Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">{plan}</pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!plan && !isGenerating && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Calendar className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">No Training Plan Generated Yet</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Select a team, choose the plan duration, and optionally select focus areas. 
                  Our AI will analyze team weaknesses and generate a personalized training plan 
                  with specific drills and expected outcomes.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
