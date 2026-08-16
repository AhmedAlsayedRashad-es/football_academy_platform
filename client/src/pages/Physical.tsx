import { useAuth } from "@/_core/hooks/useAuth";
import { useParentChild } from "@/contexts/ParentChildContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Plus, Dumbbell, AlertTriangle, CheckCircle, Clock, Calendar, Activity, ArrowLeft} from 'lucide-react';
import { toast } from "sonner";
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


function CreateWorkoutDialog() {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    playerId: '',
    teamId: '',
    title: '',
    description: '',
    category: 'strength' as const,
    difficulty: 'intermediate' as const,
    durationMinutes: '',
    exercises: '',
    scheduledDate: new Date().toISOString().split('T')[0],
  });

  const { data: players } = trpc.players.getAll.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();
  const utils = trpc.useUtils();
  
  const createWorkout = trpc.workouts.create.useMutation({
    onSuccess: () => {
      toast.success('Workout plan created');
      setOpen(false);
      utils.workouts.getPlayerPlans.invalidate();
      utils.workouts.getTeamPlans.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create workout');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWorkout.mutate({
      ...formData,
      playerId: formData.playerId ? parseInt(formData.playerId) : undefined,
      teamId: formData.teamId ? parseInt(formData.teamId) : undefined,
      durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Create Workout
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Workout Plan</DialogTitle>
          <DialogDescription>
            Design a new training workout for a player or team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Core Strength Session"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Assign to Player</Label>
                <Select
                  value={formData.playerId}
                  onValueChange={(value) => setFormData({ ...formData, playerId: value === 'none' ? '' : value, teamId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select player" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {players?.map((player: any) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Or Team</Label>
                <Select
                  value={formData.teamId}
                  onValueChange={(value) => setFormData({ ...formData, teamId: value === 'none' ? '' : value, playerId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {teams?.map((team) => (
                      <SelectItem key={team.id} value={team.id.toString()}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: any) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="endurance">Endurance</SelectItem>
                    <SelectItem value="agility">Agility</SelectItem>
                    <SelectItem value="flexibility">Flexibility</SelectItem>
                    <SelectItem value="recovery">Recovery</SelectItem>
                    <SelectItem value="match_prep">Match Prep</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  placeholder="60"
                />
              </div>
              <div className="space-y-2">
                <Label>Scheduled Date</Label>
                <Input
                  type="date"
                  value={formData.scheduledDate}
                  onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Workout objectives and notes..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Exercises</Label>
              <Textarea
                value={formData.exercises}
                onChange={(e) => setFormData({ ...formData, exercises: e.target.value })}
                placeholder="List exercises, sets, reps..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createWorkout.isPending}>
              {createWorkout.isPending ? 'Creating...' : 'Create Workout'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReportInjuryDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    playerId: '',
    injuryType: '',
    bodyPart: '',
    severity: 'moderate' as const,
    injuryDate: new Date().toISOString().split('T')[0],
    expectedRecoveryDate: '',
    treatment: '',
    notes: '',
  });

  const { data: players } = trpc.players.getAll.useQuery();
  const utils = trpc.useUtils();
  
  const createInjury = trpc.injuries.create.useMutation({
    onSuccess: () => {
      toast.success('Injury reported');
      setOpen(false);
      utils.injuries.getActive.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to report injury');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.playerId) {
      toast.error('Please select a player');
      return;
    }
    createInjury.mutate({
      ...formData,
      playerId: parseInt(formData.playerId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Report Injury
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Injury</DialogTitle>
          <DialogDescription>
            Document a player injury for tracking and recovery management.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Player</Label>
              <Select
                value={formData.playerId}
                onValueChange={(value) => setFormData({ ...formData, playerId: value })}
              >
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Injury Type</Label>
                <Input
                  value={formData.injuryType}
                  onChange={(e) => setFormData({ ...formData, injuryType: e.target.value })}
                  placeholder="e.g., Muscle strain"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Body Part</Label>
                <Input
                  value={formData.bodyPart}
                  onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
                  placeholder="e.g., Left hamstring"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select
                  value={formData.severity}
                  onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Injury Date</Label>
                <Input
                  type="date"
                  value={formData.injuryDate}
                  onChange={(e) => setFormData({ ...formData, injuryDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expected Recovery Date</Label>
              <Input
                type="date"
                value={formData.expectedRecoveryDate}
                onChange={(e) => setFormData({ ...formData, expectedRecoveryDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Treatment</Label>
              <Textarea
                value={formData.treatment}
                onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                placeholder="Treatment plan and protocols..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional observations..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive" disabled={createInjury.isPending}>
              {createInjury.isPending ? 'Reporting...' : 'Report Injury'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WorkoutCard({ workout, onComplete }: { workout: any; onComplete: () => void }) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      strength: 'bg-primary/20 text-primary',
      endurance: 'bg-chart-2/20 text-chart-2',
      agility: 'bg-chart-3/20 text-chart-3',
      flexibility: 'bg-chart-4/20 text-chart-4',
      recovery: 'bg-accent/20 text-accent',
      match_prep: 'bg-destructive/20 text-destructive',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  const markComplete = trpc.workouts.markComplete.useMutation({
    onSuccess: () => {
      toast.success('Workout marked as complete');
      onComplete();
    },
  });

  return (
    <Card className={workout.isCompleted ? 'opacity-60' : ''}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold">{workout.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className={getCategoryColor(workout.category)}>
                {workout.category}
              </Badge>
              {workout.difficulty && (
                <Badge variant="outline" className="capitalize">
                  {workout.difficulty}
                </Badge>
              )}
            </div>
          </div>
          {workout.isCompleted ? (
            <CheckCircle className="h-5 w-5 text-primary" />
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => markComplete.mutate({ id: workout.id })}
              disabled={markComplete.isPending}
            >
              Complete
            </Button>
          )}
        </div>
        
        {workout.description && (
          <p className="text-sm text-muted-foreground mb-3">{workout.description}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {workout.durationMinutes && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{workout.durationMinutes} min</span>
            </div>
          )}
          {workout.scheduledDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(workout.scheduledDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Physical() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { selectedChildId } = useParentChild();
  const [selectedPlayer, setSelectedPlayer] = useState<string>('none');
  
  // For parents, get their linked children; for staff, get all players
  const { data: players } = user?.role === 'parent' 
    ? trpc.parentRelations.getLinkedPlayers.useQuery()
    : trpc.players.getAll.useQuery();
  
  // Auto-select child for parents
  useEffect(() => {
    if (user?.role === 'parent' && selectedChildId && (!selectedPlayer || selectedPlayer === 'none')) {
      setSelectedPlayer(selectedChildId);
    }
  }, [user, selectedChildId, selectedPlayer]);
  const { data: activeInjuries } = trpc.injuries.getActive.useQuery();
  const { data: workouts, refetch: refetchWorkouts } = trpc.workouts.getPlayerPlans.useQuery(
    { playerId: parseInt(selectedPlayer) },
    { enabled: !!selectedPlayer && selectedPlayer !== 'none' }
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            
            <BackButton />
<h1 className="text-2xl font-bold tracking-tight">Physical Training</h1>
            <p className="text-muted-foreground">
              Workout plans, injury tracking, and recovery management
            </p>
          </div>
          <div className="flex gap-2">
            <ReportInjuryDialog />
            <CreateWorkoutDialog />
          </div>
        </div>

        <Tabs defaultValue="workouts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="workouts">Workouts</TabsTrigger>
            <TabsTrigger value="injuries">
              Injuries
              {activeInjuries && activeInjuries.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs">
                  {activeInjuries.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workouts" className="space-y-6">
            {/* Player Selection */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <Label className="whitespace-nowrap">Select Player:</Label>
                  <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                    <SelectTrigger className="max-w-xs">
                      <SelectValue placeholder="Choose a player" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- Choose a player --</SelectItem>
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

            {selectedPlayer && selectedPlayer !== 'none' && workouts && workouts.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workouts.map((workout) => (
                  <WorkoutCard 
                    key={workout.id} 
                    workout={workout} 
                    onComplete={() => refetchWorkouts()}
                  />
                ))}
              </div>
            ) : selectedPlayer ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No workouts found</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a workout plan for this player
                  </p>
                  <CreateWorkoutDialog />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Dumbbell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
                  <p className="text-muted-foreground">
                    Choose a player to view their workout plans
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="injuries" className="space-y-6">
            {activeInjuries && activeInjuries.length > 0 ? (
              <div className="space-y-4">
                {activeInjuries.map((injury: any) => (
                  <Card key={injury.id} className="border-destructive/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <h3 className="font-semibold">{injury.injuryType}</h3>
                            <Badge variant="destructive" className="capitalize">
                              {injury.severity}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {injury.bodyPart}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>Injured: {new Date(injury.injuryDate).toLocaleDateString()}</span>
                            {injury.expectedRecoveryDate && (
                              <span>Expected recovery: {new Date(injury.expectedRecoveryDate).toLocaleDateString()}</span>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {injury.status}
                        </Badge>
                      </div>
                      {injury.treatment && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-sm"><strong>Treatment:</strong> {injury.treatment}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Activity className="h-12 w-12 mx-auto text-primary mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Injuries</h3>
                  <p className="text-muted-foreground">
                    All players are currently healthy
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
