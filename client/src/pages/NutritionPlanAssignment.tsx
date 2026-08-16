import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Apple, Users, Calendar, CheckCircle2, ChevronRight,
  Utensils, Flame, Dumbbell, Wheat, Droplets, Clock,
  Search, Filter, ArrowLeft
} from "lucide-react";

const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  pre_training: "Pre-Training",
  post_training: "Post-Training",
};

const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: "bg-yellow-100 text-yellow-800 border-yellow-200",
  lunch: "bg-green-100 text-green-800 border-green-200",
  dinner: "bg-blue-100 text-blue-800 border-blue-200",
  snack: "bg-purple-100 text-purple-800 border-purple-200",
  pre_training: "bg-orange-100 text-orange-800 border-orange-200",
  post_training: "bg-red-100 text-red-800 border-red-200",
};

export default function NutritionPlanAssignment() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().split("T")[0];
  });
  const [notes, setNotes] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState<number>(2);
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<{ success: boolean; created: number; players: string[] } | null>(null);

  const { data: templates = [], isLoading: templatesLoading } = trpc.nutrition.getTemplates.useQuery();
  const { data: teams = [] } = trpc.teams.getAll.useQuery();
  const { data: teamPlayers = [] } = trpc.players.getByTeam.useQuery({ teamId: selectedTeamId });

  const assignMutation = trpc.nutrition.assignPlanToPlayer.useMutation();

  const filteredPlayers = teamPlayers.filter((p: any) =>
    playerSearch === "" ||
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(playerSearch.toLowerCase()) ||
    (p.position ?? "").toLowerCase().includes(playerSearch.toLowerCase())
  );

  const togglePlayer = (id: number) => {
    setSelectedPlayers(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => setSelectedPlayers(filteredPlayers.map((p: any) => p.id));
  const clearAll = () => setSelectedPlayers([]);

  const handleAssign = async () => {
    if (!selectedTemplate || selectedPlayers.length === 0 || !startDate || !endDate) return;
    setIsAssigning(true);
    try {
      let totalCreated = 0;
      const assignedNames: string[] = [];
      for (const playerId of selectedPlayers) {
        const result = await assignMutation.mutateAsync({
          playerId,
          templateTitle: selectedTemplate.title,
          startDate,
          endDate,
          notes: notes || undefined,
        });
        totalCreated += result.created;
        const player = teamPlayers.find((p: any) => p.id === playerId);
        if (player) assignedNames.push(`${player.firstName} ${player.lastName}`);
      }
      setAssignmentResult({ success: true, created: totalCreated, players: assignedNames });
      setStep(3);
      toast({
        title: "Plan Assigned Successfully",
        description: `"${selectedTemplate.title}" assigned to ${selectedPlayers.length} player(s) — ${totalCreated} meal entries created.`,
      });
    } catch (err: any) {
      toast({ title: "Assignment Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsAssigning(false);
    }
  };

  const resetWorkflow = () => {
    setStep(1);
    setSelectedTemplate(null);
    setSelectedPlayers([]);
    setNotes("");
    setAssignmentResult(null);
  };

  const dayCount = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)
    : 0;

  return (
    <>
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/nutrition")} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
          <Apple className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Nutrition Plan Assignment</h1>
          <p className="text-muted-foreground text-sm">Assign meal plan templates to players for a specific date range</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2">
        {[
          { n: 1, label: "Choose Template" },
          { n: 2, label: "Select Players & Dates" },
          { n: 3, label: "Confirm" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${step === s.n ? "bg-green-600 text-white" : step > s.n ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
              {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : <span className="w-4 h-4 flex items-center justify-center">{s.n}</span>}
              {s.label}
            </div>
            {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </div>

      {/* Step 1: Choose Template */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Step 1 — Select a Nutrition Plan Template</h2>
          {templatesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-lg bg-muted animate-pulse" />)}
            </div>
          ) : templates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Apple className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>No nutrition plan templates found.</p>
                <p className="text-xs mt-1">Create meal plans in the Nutrition section first.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template: any) => {
                const totalCals = template.meals.reduce((s: number, m: any) => s + (m.calories ?? 0), 0);
                const totalProtein = template.meals.reduce((s: number, m: any) => s + (m.protein ?? 0), 0);
                const totalCarbs = template.meals.reduce((s: number, m: any) => s + (m.carbs ?? 0), 0);
                const totalFats = template.meals.reduce((s: number, m: any) => s + (m.fats ?? 0), 0);
                const isSelected = selectedTemplate?.title === template.title;

                return (
                  <Card
                    key={template.title}
                    className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? "ring-2 ring-green-500 shadow-md" : "hover:ring-1 hover:ring-green-200"}`}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base leading-tight">{template.title}</CardTitle>
                        {isSelected && <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-500 flex-shrink-0" />}
                      </div>
                      <CardDescription>{template.meals.length} meal types / day</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Meal types */}
                      <div className="flex flex-wrap gap-1">
                        {template.meals.map((m: any) => (
                          <span key={m.mealType} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${MEAL_TYPE_COLORS[m.mealType] ?? "bg-gray-100 text-gray-700"}`}>
                            {MEAL_TYPE_LABELS[m.mealType] ?? m.mealType}
                          </span>
                        ))}
                      </div>
                      {/* Macros */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Flame className="h-3.5 w-3.5 text-orange-700 dark:text-orange-500" />
                          <span className="text-muted-foreground">Calories:</span>
                          <span className="font-medium">{totalCals} kcal</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Dumbbell className="h-3.5 w-3.5 text-blue-500" />
                          <span className="text-muted-foreground">Protein:</span>
                          <span className="font-medium">{totalProtein}g</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Wheat className="h-3.5 w-3.5 text-yellow-700 dark:text-yellow-500" />
                          <span className="text-muted-foreground">Carbs:</span>
                          <span className="font-medium">{totalCarbs}g</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Droplets className="h-3.5 w-3.5 text-purple-500" />
                          <span className="text-muted-foreground">Fats:</span>
                          <span className="font-medium">{totalFats}g</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedTemplate}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Next: Select Players <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Select Players & Dates */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <h2 className="text-lg font-semibold">Step 2 — Select Players & Date Range</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Player Selection */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <Select value={String(selectedTeamId)} onValueChange={v => setSelectedTeamId(Number(v))}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map((t: any) => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search players..."
                    value={playerSearch}
                    onChange={e => setPlayerSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={selectAll}>All</Button>
                <Button variant="outline" size="sm" onClick={clearAll}>Clear</Button>
              </div>

              <div className="text-sm text-muted-foreground">
                {selectedPlayers.length} of {filteredPlayers.length} players selected
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto pr-1">
                {filteredPlayers.map((player: any) => {
                  const isSelected = selectedPlayers.includes(player.id);
                  return (
                    <div
                      key={player.id}
                      onClick={() => togglePlayer(player.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "hover:bg-muted/50"}`}
                    >
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? "border-green-500 bg-green-500" : "border-muted-foreground/40"}`}>
                        {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-foreground" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{player.firstName} {player.lastName}</p>
                        <p className="text-xs text-muted-foreground capitalize">{player.position} · #{player.jerseyNumber ?? "—"}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Date Range & Notes */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" /> Date Range
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Start Date</Label>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">End Date</Label>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} />
                  </div>
                  {dayCount > 0 && (
                    <div className="flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 dark:text-green-400 font-medium">{dayCount} days</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Selected Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="font-medium text-sm">{selectedTemplate?.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{selectedTemplate?.meals?.length} meals/day</p>
                </CardContent>
              </Card>

              <div className="space-y-1.5">
                <Label className="text-xs">Notes (optional)</Label>
                <Textarea
                  placeholder="Add any special instructions for this assignment..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Summary */}
              {selectedPlayers.length > 0 && dayCount > 0 && selectedTemplate && (
                <div className="bg-muted/50 rounded-lg p-3 text-xs space-y-1">
                  <p className="font-medium">Assignment Summary</p>
                  <p className="text-muted-foreground">{selectedPlayers.length} player(s) × {dayCount} days × {selectedTemplate.meals.length} meals</p>
                  <p className="font-medium text-green-600">{selectedPlayers.length * dayCount * selectedTemplate.meals.length} meal entries will be created</p>
                </div>
              )}

              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={selectedPlayers.length === 0 || !startDate || !endDate || isAssigning}
                onClick={handleAssign}
              >
                {isAssigning ? "Assigning..." : "Assign Plan to Players"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Success */}
      {step === 3 && assignmentResult && (
        <div className="space-y-4">
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
            <CardContent className="py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-700 dark:text-green-400">Plan Assigned Successfully!</h2>
                <p className="text-muted-foreground mt-1">
                  <span className="font-medium">"{selectedTemplate?.title}"</span> has been assigned to {assignmentResult.players.length} player(s).
                </p>
              </div>
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{assignmentResult.players.length}</p>
                  <p className="text-muted-foreground">Players</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{dayCount}</p>
                  <p className="text-muted-foreground">Days</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{assignmentResult.created}</p>
                  <p className="text-muted-foreground">Meal Entries</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {assignmentResult.players.map(name => (
                  <Badge key={name} variant="secondary" className="bg-green-100 text-green-700">{name}</Badge>
                ))}
              </div>
              <div className="flex gap-3 justify-center pt-2">
                <Button variant="outline" onClick={resetWorkflow}>
                  Assign Another Plan
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => navigate("/nutrition")}
                >
                  <Utensils className="h-4 w-4 mr-2" /> View in Nutrition
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    </>
  );
}
