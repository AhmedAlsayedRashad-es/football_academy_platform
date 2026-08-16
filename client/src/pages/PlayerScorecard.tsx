import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useParams, useLocation } from "wouter";
import { 
  ArrowLeft, 
  Target, 
  Zap, 
  Brain, 
  Shield, 
  TrendingUp,
  Star,
  Activity,
  Footprints,
  Timer,
  Award,
  Sparkles,
  Play,
  Calendar
} from "lucide-react";
import { AIPlayerAnalysisDialog } from "@/components/AIPlayerAnalysisDialog";
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';

// Radar chart component for skill visualization
function SkillRadar({ skills }: { skills: { name: string; value: number }[] }) {
  const size = 200;
  const center = size / 2;
  const radius = 80;
  const angleStep = (2 * Math.PI) / skills.length;

  const points = skills.map((skill, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (skill.value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
      labelX: center + (radius + 25) * Math.cos(angle),
      labelY: center + (radius + 25) * Math.sin(angle),
      name: skill.name,
      value: skill.value,
    };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';

  // Background grid
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const gridPaths = gridLevels.map(level => {
    const gridPoints = skills.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const r = level * radius;
      return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
    });
    return gridPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  });

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Grid */}
      {gridPaths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeOpacity={0.1} />
      ))}
      {/* Axes */}
      {skills.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke="currentColor"
            strokeOpacity={0.1}
          />
        );
      })}
      {/* Data polygon */}
      <path d={pathD} fill="hsl(var(--primary))" fillOpacity={0.3} stroke="hsl(var(--primary))" strokeWidth={2} />
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="hsl(var(--primary))" />
      ))}
      {/* Labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.labelX}
          y={p.labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[10px] fill-muted-foreground"
        >
          {p.name}
        </text>
      ))}
    </svg>
  );
}

// Skill bar component
function SkillBar({ name, value, icon: Icon }: { name: string; value: number; icon?: any }) {
  const getColor = (val: number) => {
    if (val >= 80) return "bg-green-500";
    if (val >= 60) return "bg-emerald-500";
    if (val >= 40) return "bg-yellow-500";
    if (val >= 20) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {name}
        </span>
        <span className="font-bold">{value}</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full ${getColor(value)} transition-all duration-500`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

// Foot preference visualization
function FootPreference({ left, right, preferred }: { left: number; right: number; preferred: string }) {
  return (
    <div className="flex items-center justify-center gap-8 py-4">
      <div className="text-center">
        <div className={`text-4xl mb-2 ${preferred === 'left' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Footprints className="h-12 w-12 mx-auto transform -scale-x-100" />
        </div>
        <div className="text-2xl font-bold">{left}</div>
        <div className="text-sm text-muted-foreground">Left Foot</div>
        {preferred === 'left' && <Badge className="mt-1">Preferred</Badge>}
      </div>
      <div className="h-20 w-px bg-border" />
      <div className="text-center">
        <div className={`text-4xl mb-2 ${preferred === 'right' ? 'text-primary' : 'text-muted-foreground'}`}>
          <Footprints className="h-12 w-12 mx-auto" />
        </div>
        <div className="text-2xl font-bold">{right}</div>
        <div className="text-sm text-muted-foreground">Right Foot</div>
        {preferred === 'right' && <Badge className="mt-1">Preferred</Badge>}
      </div>
    </div>
  );
}

export default function PlayerScorecard() {
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const playerId = parseInt(params.id || "0");

  const { data: player, isLoading: playerLoading } = trpc.players.getById.useQuery(
    { id: playerId },
    { enabled: playerId > 0 }
  );

  const { data: skillScore, isLoading: skillsLoading } = trpc.skillScores.getLatest.useQuery(
    { playerId },
    { enabled: playerId > 0 }
  );

  const { data: matchStats } = trpc.matchStats.getByPlayer.useQuery(
    { playerId },
    { enabled: playerId > 0 }
  );

  const { data: aiRecommendation } = trpc.aiTraining.getLatest.useQuery(
    { playerId },
    { enabled: playerId > 0 }
  );

  const generateRecommendation = trpc.aiTraining.generate.useMutation({
    onSuccess: () => {
      toast.success("AI training recommendations generated!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const isLoading = playerLoading || skillsLoading;

  // Calculate career stats from match history
  const careerStats = matchStats?.reduce(
    (acc, stat) => ({
      matches: acc.matches + 1,
      goals: acc.goals + (stat.goals || 0),
      assists: acc.assists + (stat.assists || 0),
      minutesPlayed: acc.minutesPlayed + (stat.minutesPlayed || 0),
    }),
    { matches: 0, goals: 0, assists: 0, minutesPlayed: 0 }
  ) || { matches: 0, goals: 0, assists: 0, minutesPlayed: 0 };

  // Technical skills for radar chart
  const technicalSkills = skillScore ? [
    { name: "Control", value: skillScore.ballControl || 50 },
    { name: "Touch", value: skillScore.firstTouch || 50 },
    { name: "Dribble", value: skillScore.dribbling || 50 },
    { name: "Pass", value: skillScore.passing || 50 },
    { name: "Shoot", value: skillScore.shooting || 50 },
    { name: "Cross", value: skillScore.crossing || 50 },
  ] : [];

  // Physical skills for radar chart
  const physicalSkills = skillScore ? [
    { name: "Speed", value: skillScore.speed || 50 },
    { name: "Accel", value: skillScore.acceleration || 50 },
    { name: "Agility", value: skillScore.agility || 50 },
    { name: "Stamina", value: skillScore.stamina || 50 },
    { name: "Strength", value: skillScore.strength || 50 },
    { name: "Jump", value: skillScore.jumping || 50 },
  ] : [];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/players")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Player Scorecard</h1>
              <p className="text-muted-foreground">Comprehensive performance analysis</p>
            </div>
          </div>
          {player && (
            <AIPlayerAnalysisDialog 
              playerId={player.id} 
              playerName={`${player.firstName} ${player.lastName}`}
            />
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : player ? (
          <>
            {/* Player Header Card */}
            <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  {/* Player Photo */}
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center text-4xl font-bold">
                      {player.firstName[0]}{player.lastName[0]}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-bold">
                      {player.jerseyNumber || "?"}
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-2xl font-bold">{player.firstName} {player.lastName}</h2>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                      <Badge variant="secondary">{player.position}</Badge>
                      <Badge variant="outline">{player.ageGroup}</Badge>
                      <Badge variant="outline">{player.preferredFoot} footed</Badge>
                    </div>
                  </div>

                  {/* Overall Rating */}
                  <div className="text-center">
                    <div className="relative w-24 h-24">
                      <svg className="w-24 h-24 transform -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeOpacity={0.1} strokeWidth="8" fill="none" />
                        <circle
                          cx="48"
                          cy="48"
                          r="40"
                          stroke="hsl(var(--primary))"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(skillScore?.overallRating || 50) * 2.51} 251`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{skillScore?.overallRating || 50}</span>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Overall Rating</div>
                  </div>

                  {/* Potential */}
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{skillScore?.potentialRating || 60}</div>
                    <div className="text-sm text-muted-foreground">Potential</div>
                  </div>
                </div>

                {/* Career Stats */}
                <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/50">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{careerStats.matches}</div>
                    <div className="text-sm text-muted-foreground">Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{careerStats.goals}</div>
                    <div className="text-sm text-muted-foreground">Goals</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{careerStats.assists}</div>
                    <div className="text-sm text-muted-foreground">Assists</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{Math.round(careerStats.minutesPlayed / 60)}h</div>
                    <div className="text-sm text-muted-foreground">Playing Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills Tabs */}
            <Tabs defaultValue="technical" className="space-y-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="technical" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Technical
                </TabsTrigger>
                <TabsTrigger value="physical" className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Physical
                </TabsTrigger>
                <TabsTrigger value="mental" className="flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Mental
                </TabsTrigger>
                <TabsTrigger value="defensive" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Defensive
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Training
                </TabsTrigger>
              </TabsList>

              {/* Technical Tab */}
              <TabsContent value="technical">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Technical Skills
                      </CardTitle>
                      <CardDescription>Ball handling and technique abilities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SkillRadar skills={technicalSkills} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Skill Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <SkillBar name="Ball Control" value={skillScore?.ballControl || 50} />
                      <SkillBar name="First Touch" value={skillScore?.firstTouch || 50} />
                      <SkillBar name="Dribbling" value={skillScore?.dribbling || 50} />
                      <SkillBar name="Passing" value={skillScore?.passing || 50} />
                      <SkillBar name="Shooting" value={skillScore?.shooting || 50} />
                      <SkillBar name="Crossing" value={skillScore?.crossing || 50} />
                      <SkillBar name="Heading" value={skillScore?.heading || 50} />
                    </CardContent>
                  </Card>

                  {/* Foot Preference */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Footprints className="h-5 w-5" />
                        Foot Preference & Two-Footed Ability
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FootPreference
                        left={skillScore?.leftFootScore || 50}
                        right={skillScore?.rightFootScore || 50}
                        preferred={player.preferredFoot || 'right'}
                      />
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm">Two-Footed Ability</span>
                          <span className="font-bold">{skillScore?.twoFootedScore || 50}%</span>
                        </div>
                        <Progress value={skillScore?.twoFootedScore || 50} className="h-3" />
                        <p className="text-sm text-muted-foreground mt-2">
                          Weak foot usage: {skillScore?.weakFootUsage || 0}% of total touches
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Physical Tab */}
              <TabsContent value="physical">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Physical Attributes
                      </CardTitle>
                      <CardDescription>Athletic and physical capabilities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <SkillRadar skills={physicalSkills} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Physical Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <SkillBar name="Speed" value={skillScore?.speed || 50} icon={Zap} />
                      <SkillBar name="Acceleration" value={skillScore?.acceleration || 50} icon={TrendingUp} />
                      <SkillBar name="Agility" value={skillScore?.agility || 50} icon={Activity} />
                      <SkillBar name="Stamina" value={skillScore?.stamina || 50} icon={Timer} />
                      <SkillBar name="Strength" value={skillScore?.strength || 50} icon={Shield} />
                      <SkillBar name="Jumping" value={skillScore?.jumping || 50} icon={TrendingUp} />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Mental Tab */}
              <TabsContent value="mental">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        Mental Attributes
                      </CardTitle>
                      <CardDescription>Decision making and game intelligence</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <SkillBar name="Positioning" value={skillScore?.positioning || 50} />
                      <SkillBar name="Vision" value={skillScore?.vision || 50} />
                      <SkillBar name="Composure" value={skillScore?.composure || 50} />
                      <SkillBar name="Decision Making" value={skillScore?.decisionMaking || 50} />
                      <SkillBar name="Work Rate" value={skillScore?.workRate || 50} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Mental Overall</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-primary">{skillScore?.mentalOverall || 50}</div>
                        <div className="text-muted-foreground mt-2">Mental Score</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Defensive Tab */}
              <TabsContent value="defensive">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Defensive Skills
                      </CardTitle>
                      <CardDescription>Defensive capabilities and awareness</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <SkillBar name="Marking" value={skillScore?.marking || 50} />
                      <SkillBar name="Tackling" value={skillScore?.tackling || 50} />
                      <SkillBar name="Interceptions" value={skillScore?.interceptions || 50} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Defensive Overall</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-primary">{skillScore?.defensiveOverall || 50}</div>
                        <div className="text-muted-foreground mt-2">Defensive Score</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* AI Training Tab */}
              <TabsContent value="ai">
                <div className="space-y-6">
                  {aiRecommendation ? (
                    <>
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5" />
                            AI Training Recommendations
                          </CardTitle>
                          <CardDescription>
                            Generated on {new Date(aiRecommendation.generatedDate).toLocaleDateString()}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Priority Areas */}
                          <div>
                            <h4 className="font-semibold mb-3">Priority Focus Areas</h4>
                            <div className="flex flex-wrap gap-2">
                              {aiRecommendation.priorityMetric1 && (
                                <Badge variant="destructive">{aiRecommendation.priorityMetric1}</Badge>
                              )}
                              {aiRecommendation.priorityMetric2 && (
                                <Badge variant="secondary">{aiRecommendation.priorityMetric2}</Badge>
                              )}
                              {aiRecommendation.priorityMetric3 && (
                                <Badge variant="outline">{aiRecommendation.priorityMetric3}</Badge>
                              )}
                            </div>
                          </div>

                          {/* Strengths & Weaknesses */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold mb-2 text-green-700 dark:text-green-500">Strengths</h4>
                              <div className="flex flex-wrap gap-1">
                                {JSON.parse(aiRecommendation.strengthsIdentified || '[]').map((s: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-green-700 dark:text-green-500 border-green-500">{s}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2 text-orange-700 dark:text-orange-500">Areas to Improve</h4>
                              <div className="flex flex-wrap gap-1">
                                {JSON.parse(aiRecommendation.weaknessesIdentified || '[]').map((w: string, i: number) => (
                                  <Badge key={i} variant="outline" className="text-orange-700 dark:text-orange-500 border-orange-500">{w}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Recommended Drills */}
                          <div>
                            <h4 className="font-semibold mb-3">Recommended Drills</h4>
                            <div className="grid md:grid-cols-2 gap-3">
                              {JSON.parse(aiRecommendation.recommendedDrills || '[]').slice(0, 6).map((drill: any, i: number) => (
                                <div key={i} className="p-3 bg-muted rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{drill.name}</span>
                                    <Badge variant="secondary">{drill.duration} min</Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">{drill.description}</p>
                                  <Badge variant="outline" className="mt-2">{drill.targetArea}</Badge>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Weak Foot Training */}
                          {aiRecommendation.weakFootTraining && (
                            <div>
                              <h4 className="font-semibold mb-2">Weak Foot Development</h4>
                              <p className="text-muted-foreground">{aiRecommendation.weakFootTraining}</p>
                            </div>
                          )}

                          {/* Position Specific */}
                          {aiRecommendation.positionSpecificDrills && (
                            <div>
                              <h4 className="font-semibold mb-2">Position-Specific Training</h4>
                              <p className="text-muted-foreground">{aiRecommendation.positionSpecificDrills}</p>
                            </div>
                          )}

                          {/* Progress */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold">Training Progress</span>
                              <span>{aiRecommendation.completionProgress}%</span>
                            </div>
                            <Progress value={aiRecommendation.completionProgress || 0} />
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No AI Recommendations Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Generate personalized training recommendations based on player performance data
                        </p>
                        <Button
                          onClick={() => generateRecommendation.mutate({ playerId })}
                          disabled={generateRecommendation.isPending}
                        >
                          {generateRecommendation.isPending ? "Generating..." : "Generate AI Recommendations"}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {aiRecommendation && (
                    <Button
                      variant="outline"
                      onClick={() => generateRecommendation.mutate({ playerId })}
                      disabled={generateRecommendation.isPending}
                    >
                      {generateRecommendation.isPending ? "Generating..." : "Regenerate Recommendations"}
                    </Button>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Player not found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
