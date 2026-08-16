import { useAuth } from "@/_core/hooks/useAuth";
import { useParentChild } from "@/contexts/ParentChildContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Plus, Brain, Heart, Target, Users, Shield, Zap, AlertTriangle, TrendingUp, ArrowLeft} from 'lucide-react';
import { toast } from "sonner";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


function MentalScoreGauge({ label, value, icon: Icon, color }: { 
  label: string; 
  value: number; 
  icon: React.ElementType;
  color: string;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-primary';
    if (score >= 6) return 'text-chart-4';
    if (score >= 4) return 'text-accent';
    return 'text-destructive';
  };

  return (
    <div className="p-4 rounded-xl bg-muted/50 border border-border text-center">
      <Icon className={`h-6 w-6 mx-auto mb-2 ${color}`} />
      <div className={`text-3xl font-bold mb-1 ${getScoreColor(value)}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full rounded-full ${getScoreColor(value).replace('text-', 'bg-')}`}
          style={{ width: `${value * 10}%` }}
        />
      </div>
    </div>
  );
}

function ConductAssessmentDialog() {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [formData, setFormData] = useState({
    assessmentDate: new Date().toISOString().split('T')[0],
    confidenceLevel: 5,
    anxietyLevel: 5,
    motivationLevel: 5,
    focusLevel: 5,
    resilienceScore: 5,
    teamworkScore: 5,
    leadershipScore: 5,
    stressLevel: 5,
    notes: '',
    recommendations: '',
  });

  const { data: players } = trpc.players.getAll.useQuery();
  const utils = trpc.useUtils();
  
  const createAssessment = trpc.mental.create.useMutation({
    onSuccess: () => {
      toast.success('Mental assessment recorded');
      setOpen(false);
      utils.mental.getPlayerAssessments.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to record assessment');
    },
  });

  const calculateOverallScore = () => {
    const scores = [
      formData.confidenceLevel,
      10 - formData.anxietyLevel, // Invert anxiety (lower is better)
      formData.motivationLevel,
      formData.focusLevel,
      formData.resilienceScore,
      formData.teamworkScore,
      formData.leadershipScore,
      10 - formData.stressLevel, // Invert stress (lower is better)
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) {
      toast.error('Please select a player');
      return;
    }
    createAssessment.mutate({
      playerId: parseInt(selectedPlayer),
      ...formData,
      overallMentalScore: calculateOverallScore(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Conduct Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mental Health Assessment</DialogTitle>
          <DialogDescription>
            Evaluate the player's psychological state and well-being.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Player</Label>
                <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    {players?.map((player: any) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Assessment Date</Label>
                <Input
                  type="date"
                  value={formData.assessmentDate}
                  onChange={(e) => setFormData({ ...formData, assessmentDate: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Psychological Metrics (1-10)</h4>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Confidence Level</Label>
                  <span className="text-sm font-medium">{formData.confidenceLevel}</span>
                </div>
                <Slider
                  value={[formData.confidenceLevel]}
                  onValueChange={([value]) => setFormData({ ...formData, confidenceLevel: value })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Anxiety Level</Label>
                  <span className="text-sm font-medium">{formData.anxietyLevel}</span>
                </div>
                <Slider
                  value={[formData.anxietyLevel]}
                  onValueChange={([value]) => setFormData({ ...formData, anxietyLevel: value })}
                  min={1}
                  max={10}
                  step={1}
                  className="[&_[role=slider]]:bg-destructive"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Motivation Level</Label>
                  <span className="text-sm font-medium">{formData.motivationLevel}</span>
                </div>
                <Slider
                  value={[formData.motivationLevel]}
                  onValueChange={([value]) => setFormData({ ...formData, motivationLevel: value })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Focus Level</Label>
                  <span className="text-sm font-medium">{formData.focusLevel}</span>
                </div>
                <Slider
                  value={[formData.focusLevel]}
                  onValueChange={([value]) => setFormData({ ...formData, focusLevel: value })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Resilience</Label>
                  <span className="text-sm font-medium">{formData.resilienceScore}</span>
                </div>
                <Slider
                  value={[formData.resilienceScore]}
                  onValueChange={([value]) => setFormData({ ...formData, resilienceScore: value })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Teamwork</Label>
                  <span className="text-sm font-medium">{formData.teamworkScore}</span>
                </div>
                <Slider
                  value={[formData.teamworkScore]}
                  onValueChange={([value]) => setFormData({ ...formData, teamworkScore: value })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Leadership</Label>
                  <span className="text-sm font-medium">{formData.leadershipScore}</span>
                </div>
                <Slider
                  value={[formData.leadershipScore]}
                  onValueChange={([value]) => setFormData({ ...formData, leadershipScore: value })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Stress Level</Label>
                  <span className="text-sm font-medium">{formData.stressLevel}</span>
                </div>
                <Slider
                  value={[formData.stressLevel]}
                  onValueChange={([value]) => setFormData({ ...formData, stressLevel: value })}
                  min={1}
                  max={10}
                  step={1}
                  className="[&_[role=slider]]:bg-destructive"
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Observations during the assessment..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Recommendations</Label>
                <Textarea
                  value={formData.recommendations}
                  onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
                  placeholder="Suggested interventions or exercises..."
                  rows={3}
                />
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg text-center">
              <div className="text-sm text-muted-foreground mb-1">Calculated Overall Score</div>
              <div className="text-3xl font-bold text-primary">{calculateOverallScore()}</div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAssessment.isPending}>
              {createAssessment.isPending ? 'Saving...' : 'Save Assessment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Mental() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { selectedChildId } = useParentChild();
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  
  // For parents, get their linked children; for staff, get all players
  const { data: players } = user?.role === 'parent' 
    ? trpc.parentRelations.getLinkedPlayers.useQuery()
    : trpc.players.getAll.useQuery();
  
  // Auto-select child for parents
  useEffect(() => {
    if (user?.role === 'parent' && selectedChildId && !selectedPlayer) {
      setSelectedPlayer(selectedChildId);
    }
  }, [user, selectedChildId, selectedPlayer]);
  const { data: assessments } = trpc.mental.getPlayerAssessments.useQuery(
    { playerId: parseInt(selectedPlayer), limit: 10 },
    { enabled: !!selectedPlayer }
  );

  const latestAssessment = assessments?.[0];

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            
            <BackButton />
<h1 className="text-2xl font-bold tracking-tight">Mental Coaching</h1>
            <p className="text-muted-foreground">
              Psychological assessments and mental wellness tracking
            </p>
          </div>
          <ConductAssessmentDialog />
        </div>

        {/* Player Selection */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap">Select Player:</Label>
              <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue placeholder="Choose a player to view" />
                </SelectTrigger>
                <SelectContent>
                  {players?.map((player: any) => (
                    <SelectItem key={player.id} value={player.id.toString()}>
                      {player.firstName} {player.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedPlayer && latestAssessment ? (
          <div className="space-y-6">
            {/* Overall Score */}
            <Card className="brand-gradient-subtle border-chart-2/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold mb-1">Mental Wellness Score</h2>
                    <p className="text-sm text-muted-foreground">
                      Last assessed: {new Date(latestAssessment.assessmentDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-5xl font-bold text-chart-2">
                      {latestAssessment.overallMentalScore || '--'}
                    </div>
                    <p className="text-sm text-muted-foreground">out of 100</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mental Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
              <MentalScoreGauge
                label="Confidence"
                value={latestAssessment.confidenceLevel || 0}
                icon={Shield}
                color="text-primary"
              />
              <MentalScoreGauge
                label="Anxiety"
                value={latestAssessment.anxietyLevel || 0}
                icon={AlertTriangle}
                color="text-destructive"
              />
              <MentalScoreGauge
                label="Motivation"
                value={latestAssessment.motivationLevel || 0}
                icon={Zap}
                color="text-chart-3"
              />
              <MentalScoreGauge
                label="Focus"
                value={latestAssessment.focusLevel || 0}
                icon={Target}
                color="text-chart-4"
              />
              <MentalScoreGauge
                label="Resilience"
                value={latestAssessment.resilienceScore || 0}
                icon={Heart}
                color="text-primary"
              />
              <MentalScoreGauge
                label="Teamwork"
                value={latestAssessment.teamworkScore || 0}
                icon={Users}
                color="text-chart-2"
              />
              <MentalScoreGauge
                label="Leadership"
                value={latestAssessment.leadershipScore || 0}
                icon={TrendingUp}
                color="text-accent"
              />
              <MentalScoreGauge
                label="Stress"
                value={latestAssessment.stressLevel || 0}
                icon={Brain}
                color="text-destructive"
              />
            </div>

            {/* Notes and Recommendations */}
            <div className="grid gap-6 lg:grid-cols-2">
              {latestAssessment.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle>Assessment Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{latestAssessment.notes}</p>
                  </CardContent>
                </Card>
              )}
              {latestAssessment.recommendations && (
                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{latestAssessment.recommendations}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Mental Progress Chart */}
            {assessments && assessments.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-chart-2" />
                    Mental Progress Over Time
                  </CardTitle>
                  <CardDescription>Track psychological development across assessments</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={[...assessments].reverse().map((a, i) => ({
                        date: new Date(a.assessmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        Overall: a.overallMentalScore || 0,
                        Confidence: a.confidenceLevel || 0,
                        Motivation: a.motivationLevel || 0,
                        Focus: a.focusLevel || 0,
                        Resilience: a.resilienceScore || 0,
                      }))}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="Confidence" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Motivation" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Focus" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="Resilience" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Assessment History */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment History</CardTitle>
                <CardDescription>Previous mental health evaluations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessments?.map((assessment, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                      <div className="text-center min-w-[80px]">
                        <div className="text-2xl font-bold text-chart-2">{assessment.overallMentalScore || '--'}</div>
                        <div className="text-xs text-muted-foreground">Score</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium mb-1">
                          {new Date(assessment.assessmentDate).toLocaleDateString()}
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>Conf: {assessment.confidenceLevel}</span>
                          <span>Anx: {assessment.anxietyLevel}</span>
                          <span>Mot: {assessment.motivationLevel}</span>
                          <span>Foc: {assessment.focusLevel}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : selectedPlayer ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No assessments found</h3>
              <p className="text-muted-foreground mb-4">
                Conduct the first mental health assessment for this player
              </p>
              <ConductAssessmentDialog />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
              <p className="text-muted-foreground">
                Choose a player from the dropdown above to view their mental health data
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
