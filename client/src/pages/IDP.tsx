import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Plus, Target, CheckCircle, Circle, TrendingUp, Calendar, Flag, Award, ArrowLeft} from 'lucide-react';
import { toast } from "sonner";
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


function CreateIDPDialog() {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    playerId: '',
    seasonYear: new Date().getFullYear().toString(),
    shortTermGoals: '',
    longTermGoals: '',
    technicalObjectives: '',
    physicalObjectives: '',
    mentalObjectives: '',
    nutritionObjectives: '',
    strengthsAnalysis: '',
    areasForImprovement: '',
    actionPlan: '',
    reviewDate: '',
  });

  const { data: players } = trpc.players.getAll.useQuery();
  const utils = trpc.useUtils();
  
  const createIDP = trpc.idp.create.useMutation({
    onSuccess: () => {
      toast.success('Individual Development Plan created');
      setOpen(false);
      utils.idp.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create IDP');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.playerId) {
      toast.error('Please select a player');
      return;
    }
    createIDP.mutate({
      ...formData,
      playerId: parseInt(formData.playerId),
      seasonYear: parseInt(formData.seasonYear),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Create IDP
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Individual Development Plan</DialogTitle>
          <DialogDescription>
            Define goals and objectives for a player's development journey.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
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
                    {players?.map((player) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Season Year</Label>
                <Input
                  type="number"
                  value={formData.seasonYear}
                  onChange={(e) => setFormData({ ...formData, seasonYear: e.target.value })}
                  min={2020}
                  max={2030}
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Goals</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Short-term Goals (3-6 months)</Label>
                  <Textarea
                    value={formData.shortTermGoals}
                    onChange={(e) => setFormData({ ...formData, shortTermGoals: e.target.value })}
                    placeholder="Immediate objectives to achieve..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Long-term Goals (1-2 years)</Label>
                  <Textarea
                    value={formData.longTermGoals}
                    onChange={(e) => setFormData({ ...formData, longTermGoals: e.target.value })}
                    placeholder="Career and development aspirations..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Development Objectives</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Technical</Label>
                  <Textarea
                    value={formData.technicalObjectives}
                    onChange={(e) => setFormData({ ...formData, technicalObjectives: e.target.value })}
                    placeholder="Skills to develop..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Physical</Label>
                  <Textarea
                    value={formData.physicalObjectives}
                    onChange={(e) => setFormData({ ...formData, physicalObjectives: e.target.value })}
                    placeholder="Fitness goals..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mental</Label>
                  <Textarea
                    value={formData.mentalObjectives}
                    onChange={(e) => setFormData({ ...formData, mentalObjectives: e.target.value })}
                    placeholder="Psychological growth..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nutrition</Label>
                  <Textarea
                    value={formData.nutritionObjectives}
                    onChange={(e) => setFormData({ ...formData, nutritionObjectives: e.target.value })}
                    placeholder="Dietary goals..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Analysis</h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Strengths</Label>
                  <Textarea
                    value={formData.strengthsAnalysis}
                    onChange={(e) => setFormData({ ...formData, strengthsAnalysis: e.target.value })}
                    placeholder="Current strengths to build upon..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Areas for Improvement</Label>
                  <Textarea
                    value={formData.areasForImprovement}
                    onChange={(e) => setFormData({ ...formData, areasForImprovement: e.target.value })}
                    placeholder="Weaknesses to address..."
                    rows={2}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Action Plan</Label>
              <Textarea
                value={formData.actionPlan}
                onChange={(e) => setFormData({ ...formData, actionPlan: e.target.value })}
                placeholder="Steps to achieve the objectives..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Review Date</Label>
              <Input
                type="date"
                value={formData.reviewDate}
                onChange={(e) => setFormData({ ...formData, reviewDate: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createIDP.isPending}>
              {createIDP.isPending ? 'Creating...' : 'Create IDP'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddMilestoneDialog({ idpId }: { idpId: number }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'technical' as const,
    targetDate: '',
    targetValue: '',
  });

  const utils = trpc.useUtils();
  
  const addMilestone = trpc.idp.addMilestone.useMutation({
    onSuccess: () => {
      toast.success('Milestone added');
      setOpen(false);
      utils.idp.getMilestones.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to add milestone');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMilestone.mutate({
      idpId,
      ...formData,
      targetValue: formData.targetValue ? parseInt(formData.targetValue) : undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="h-3 w-3 mr-1" />
          Add Milestone
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Add Milestone</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Improve pass accuracy to 85%"
                required
              />
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
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="physical">Physical</SelectItem>
                    <SelectItem value="mental">Mental</SelectItem>
                    <SelectItem value="nutrition">Nutrition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Value</Label>
                <Input
                  type="number"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                  placeholder="e.g., 85"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Target Date</Label>
              <Input
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Details about this milestone..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={addMilestone.isPending}>
              {addMilestone.isPending ? 'Adding...' : 'Add Milestone'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MilestoneItem({ milestone, onUpdate }: { milestone: any; onUpdate: () => void }) {
  const updateMilestone = trpc.idp.updateMilestone.useMutation({
    onSuccess: () => {
      toast.success('Milestone updated');
      onUpdate();
    },
  });

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      technical: 'bg-primary/20 text-primary',
      physical: 'bg-chart-2/20 text-chart-2',
      mental: 'bg-chart-3/20 text-chart-3',
      nutrition: 'bg-chart-4/20 text-chart-4',
    };
    return colors[category] || 'bg-muted text-muted-foreground';
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${milestone.isCompleted ? 'bg-primary/5 border-primary/20' : ''}`}>
      <button
        onClick={() => updateMilestone.mutate({ 
          id: milestone.id, 
          isCompleted: !milestone.isCompleted,
          currentValue: milestone.isCompleted ? undefined : milestone.targetValue
        })}
        className="mt-0.5"
      >
        {milestone.isCompleted ? (
          <CheckCircle className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={`font-medium ${milestone.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
            {milestone.title}
          </h4>
          <Badge variant="secondary" className={getCategoryColor(milestone.category)}>
            {milestone.category}
          </Badge>
        </div>
        {milestone.description && (
          <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
        )}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {milestone.targetDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(milestone.targetDate).toLocaleDateString()}</span>
            </div>
          )}
          {milestone.targetValue && (
            <div className="flex items-center gap-1">
              <Flag className="h-3 w-3" />
              <span>Target: {milestone.targetValue}</span>
            </div>
          )}
          {milestone.currentValue !== null && (
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>Current: {milestone.currentValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IDPCard({ idp }: { idp: any }) {
  const { data: milestones, refetch } = trpc.idp.getMilestones.useQuery({ idpId: idp.id });
  
  const completedMilestones = milestones?.filter((m: any) => m.isCompleted).length || 0;
  const totalMilestones = milestones?.length || 0;
  const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              {idp.player?.firstName} {idp.player?.lastName}
            </CardTitle>
            <CardDescription>Season {idp.seasonYear}</CardDescription>
          </div>
          <Badge variant={idp.status === 'active' ? 'default' : 'secondary'} className="capitalize">
            {idp.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {completedMilestones} of {totalMilestones} milestones completed
          </p>
        </div>

        <Tabs defaultValue="goals" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="goals" className="flex-1">Goals</TabsTrigger>
            <TabsTrigger value="milestones" className="flex-1">Milestones</TabsTrigger>
            <TabsTrigger value="analysis" className="flex-1">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="goals" className="space-y-4 mt-4">
            {idp.shortTermGoals && (
              <div>
                <h4 className="text-sm font-medium mb-1">Short-term Goals</h4>
                <p className="text-sm text-muted-foreground">{idp.shortTermGoals}</p>
              </div>
            )}
            {idp.longTermGoals && (
              <div>
                <h4 className="text-sm font-medium mb-1">Long-term Goals</h4>
                <p className="text-sm text-muted-foreground">{idp.longTermGoals}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 pt-2">
              {idp.technicalObjectives && (
                <div className="p-3 rounded-lg bg-primary/10">
                  <h5 className="text-xs font-medium text-primary mb-1">Technical</h5>
                  <p className="text-xs text-muted-foreground">{idp.technicalObjectives}</p>
                </div>
              )}
              {idp.physicalObjectives && (
                <div className="p-3 rounded-lg bg-chart-2/10">
                  <h5 className="text-xs font-medium text-chart-2 mb-1">Physical</h5>
                  <p className="text-xs text-muted-foreground">{idp.physicalObjectives}</p>
                </div>
              )}
              {idp.mentalObjectives && (
                <div className="p-3 rounded-lg bg-chart-3/10">
                  <h5 className="text-xs font-medium text-chart-3 mb-1">Mental</h5>
                  <p className="text-xs text-muted-foreground">{idp.mentalObjectives}</p>
                </div>
              )}
              {idp.nutritionObjectives && (
                <div className="p-3 rounded-lg bg-chart-4/10">
                  <h5 className="text-xs font-medium text-chart-4 mb-1">Nutrition</h5>
                  <p className="text-xs text-muted-foreground">{idp.nutritionObjectives}</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <AddMilestoneDialog idpId={idp.id} />
            </div>
            {milestones && milestones.length > 0 ? (
              <div className="space-y-3">
                {milestones.map((milestone: any) => (
                  <MilestoneItem key={milestone.id} milestone={milestone} onUpdate={() => refetch()} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Award className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No milestones yet</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4 mt-4">
            {idp.strengthsAnalysis && (
              <div>
                <h4 className="text-sm font-medium mb-1">Strengths</h4>
                <p className="text-sm text-muted-foreground">{idp.strengthsAnalysis}</p>
              </div>
            )}
            {idp.areasForImprovement && (
              <div>
                <h4 className="text-sm font-medium mb-1">Areas for Improvement</h4>
                <p className="text-sm text-muted-foreground">{idp.areasForImprovement}</p>
              </div>
            )}
            {idp.actionPlan && (
              <div>
                <h4 className="text-sm font-medium mb-1">Action Plan</h4>
                <p className="text-sm text-muted-foreground">{idp.actionPlan}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function IDP() {
  const [, navigate] = useLocation();
  const { data: idps } = trpc.idp.getAll.useQuery();

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            
            <BackButton />
<h1 className="text-2xl font-bold tracking-tight">Individual Development Plans</h1>
            <p className="text-muted-foreground">
              Track player goals, milestones, and development progress
            </p>
          </div>
          <CreateIDPDialog />
        </div>

        {idps && idps.length > 0 ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {idps.map((idp: any) => (
              <IDPCard key={idp.id} idp={idp} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Development Plans</h3>
              <p className="text-muted-foreground mb-4">
                Create individual development plans to track player progress
              </p>
              <CreateIDPDialog />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
