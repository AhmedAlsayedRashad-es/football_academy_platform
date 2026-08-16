import { PageHelp } from "@/components/PageHelp";
import { useAuth } from "@/_core/hooks/useAuth";
import { useParentChild } from "@/contexts/ParentChildContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Plus, Apple, Droplets, Flame, Beef, Wheat, Cookie, ArrowLeft, Calendar, Clock, FileDown } from 'lucide-react';
import { toast } from "sonner";
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';

const PLAN_DURATIONS = [
  { value: '1', label: 'Single Day', days: 1 },
  { value: '7', label: '1 Week', days: 7 },
  { value: '14', label: '2 Weeks', days: 14 },
  { value: '30', label: '1 Month', days: 30 },
  { value: '90', label: '3 Months', days: 90 },
];

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_training', 'post_training'] as const;
type MealType = typeof MEAL_TYPES[number];

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function MacroCard({ 
  label, 
  value, 
  target, 
  unit, 
  icon: Icon, 
  color 
}: { 
  label: string; 
  value: number; 
  target: number;
  unit: string;
  icon: React.ElementType;
  color: string;
}) {
  const percentage = Math.min((value / target) * 100, 100);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-xs text-muted-foreground">{Math.round(percentage)}%</span>
        </div>
        <div className="text-2xl font-bold mb-1">
          {value}<span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>
        </div>
        <div className="text-xs text-muted-foreground mb-2">{label}</div>
        <Progress value={percentage} className="h-1.5" />
        <div className="text-xs text-muted-foreground mt-1">Target: {target}{unit}</div>
      </CardContent>
    </Card>
  );
}

function CreateMealPlanDialog() {
  const { t, language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [planDuration, setPlanDuration] = useState('1');
  const [isCreatingMulti, setIsCreatingMulti] = useState(false);
  const [formData, setFormData] = useState({
    playerId: '',
    title: '',
    planDate: new Date().toISOString().split('T')[0],
    mealType: 'lunch' as MealType,
    foods: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    hydrationMl: '',
    notes: '',
  });

  const { data: players } = trpc.players.getAll.useQuery();
  const utils = trpc.useUtils();
  
  const createMealPlan = trpc.nutrition.createMealPlan.useMutation({
    onSuccess: () => {
      utils.nutrition.getPlayerMealPlans.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create meal plan');
    },
  });

  const selectedDuration = PLAN_DURATIONS.find(d => d.value === planDuration) || PLAN_DURATIONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.playerId) {
      toast.error('Please select a player');
      return;
    }

    const days = selectedDuration.days;

    if (days === 1) {
      // Single day plan
      createMealPlan.mutate({
        ...formData,
        playerId: parseInt(formData.playerId),
        calories: formData.calories ? parseInt(formData.calories) : undefined,
        protein: formData.protein ? parseInt(formData.protein) : undefined,
        carbs: formData.carbs ? parseInt(formData.carbs) : undefined,
        fats: formData.fats ? parseInt(formData.fats) : undefined,
        hydrationMl: formData.hydrationMl ? parseInt(formData.hydrationMl) : undefined,
      }, {
        onSuccess: () => {
          toast.success('Meal plan created');
          setOpen(false);
        }
      });
    } else {
      // Multi-day plan: create one entry per day
      setIsCreatingMulti(true);
      try {
        const mealTypesPerDay: MealType[] = ['breakfast', 'lunch', 'dinner'];
        let created = 0;
        const totalEntries = days * mealTypesPerDay.length;

        for (let day = 0; day < days; day++) {
          const date = addDays(formData.planDate, day);
          for (const mealType of mealTypesPerDay) {
            await createMealPlan.mutateAsync({
              playerId: parseInt(formData.playerId),
              title: `${formData.title || 'Meal Plan'} - Day ${day + 1} (${mealType.replace('_', ' ')})`,
              planDate: date,
              mealType,
              foods: formData.foods || '',
              calories: formData.calories ? parseInt(formData.calories) : undefined,
              protein: formData.protein ? parseInt(formData.protein) : undefined,
              carbs: formData.carbs ? parseInt(formData.carbs) : undefined,
              fats: formData.fats ? parseInt(formData.fats) : undefined,
              hydrationMl: formData.hydrationMl ? parseInt(formData.hydrationMl) : undefined,
              notes: formData.notes || undefined,
            });
            created++;
          }
        }
        toast.success(`${selectedDuration.label} meal plan created! (${created} meal entries across ${days} days)`);
        utils.nutrition.getPlayerMealPlans.invalidate();
        setOpen(false);
      } catch (err: any) {
        toast.error('Failed to create multi-day plan: ' + (err.message || 'Unknown error'));
      } finally {
        setIsCreatingMulti(false);
      }
    }
  };

  const isPending = createMealPlan.isPending || isCreatingMulti;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Create Meal Plan
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Meal Plan</DialogTitle>
          <DialogDescription>
            Design a personalized nutrition plan for a player — single day or multi-week.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Player + Start Date */}
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
                    {players?.map((player: any) => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.firstName} {player.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.planDate}
                  onChange={(e) => setFormData({ ...formData, planDate: e.target.value })}
                />
              </div>
            </div>

            {/* Plan Duration */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Plan Duration
              </Label>
              <div className="flex flex-wrap gap-2">
                {PLAN_DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setPlanDuration(d.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      planDuration === d.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-foreground border-border hover:bg-muted'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              {selectedDuration.days > 1 && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                  <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>
                    This will create <strong>{selectedDuration.days * 3}</strong> meal entries (breakfast, lunch, dinner) across <strong>{selectedDuration.days}</strong> days starting {formData.planDate}.
                    {selectedDuration.days >= 30 && ' This may take a moment.'}
                  </span>
                </div>
              )}
            </div>

            {/* Title + Meal Type */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan Title</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Match Day Fuel"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Meal Type {selectedDuration.days > 1 && <span className="text-muted-foreground text-xs">(per-day template)</span>}</Label>
                <Select
                  value={formData.mealType}
                  onValueChange={(value: any) => setFormData({ ...formData, mealType: value })}
                  disabled={selectedDuration.days > 1}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">{t("nutrition.breakfast")}</SelectItem>
                    <SelectItem value="lunch">{t("nutrition.lunch")}</SelectItem>
                    <SelectItem value="dinner">{t("nutrition.dinner")}</SelectItem>
                    <SelectItem value="snack">Snack</SelectItem>
                    <SelectItem value="pre_training">{t("nutrition.preTraining")}</SelectItem>
                    <SelectItem value="post_training">{t("nutrition.postTraining")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Foods</Label>
              <Textarea
                value={formData.foods}
                onChange={(e) => setFormData({ ...formData, foods: e.target.value })}
                placeholder="List the foods and portions..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("nutrition.calories")}</Label>
                <Input
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="kcal"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Protein (g)</Label>
                <Input
                  type="number"
                  value={formData.protein}
                  onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                  placeholder="g"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Carbs (g)</Label>
                <Input
                  type="number"
                  value={formData.carbs}
                  onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                  placeholder="g"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Fats (g)</Label>
                <Input
                  type="number"
                  value={formData.fats}
                  onChange={(e) => setFormData({ ...formData, fats: e.target.value })}
                  placeholder="g"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Hydration (ml)</Label>
              <Input
                type="number"
                value={formData.hydrationMl}
                onChange={(e) => setFormData({ ...formData, hydrationMl: e.target.value })}
                placeholder="e.g., 500"
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional instructions..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isCreatingMulti
                  ? 'Creating plan entries...'
                  : 'Creating...'
                : selectedDuration.days > 1
                  ? `Create ${selectedDuration.label} Plan`
                  : 'Create Plan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

async function exportNutritionPDF(mealPlans: any[], playerName: string, date: string, totals: any) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 15;
  let y = margin;
  // Header
  doc.setFillColor(22, 163, 74);
  doc.rect(0, 0, pageW, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Nutrition Plan', margin, 12);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Player: ' + playerName, margin, 20);
  doc.text('Date: ' + new Date(date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), pageW - margin, 20, { align: 'right' });
  y = 36;
  // Macro Summary
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Nutrition Summary', margin, y);
  y += 6;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  const macros = [
    { label: 'Calories', value: totals.calories + ' kcal', color: [251, 146, 60] as [number,number,number] },
    { label: 'Protein', value: totals.protein + 'g', color: [239, 68, 68] as [number,number,number] },
    { label: 'Carbs', value: totals.carbs + 'g', color: [234, 179, 8] as [number,number,number] },
    { label: 'Fats', value: totals.fats + 'g', color: [59, 130, 246] as [number,number,number] },
    { label: 'Hydration', value: totals.hydration + 'ml', color: [14, 165, 233] as [number,number,number] },
  ];
  const colW = (pageW - 2 * margin) / macros.length;
  macros.forEach((m, i) => {
    const x = margin + i * colW;
    doc.setFillColor(m.color[0], m.color[1], m.color[2]);
    doc.roundedRect(x, y, colW - 3, 16, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(m.label, x + (colW - 3) / 2, y + 5, { align: 'center' });
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(m.value, x + (colW - 3) / 2, y + 12, { align: 'center' });
    doc.setFont('helvetica', 'normal');
  });
  y += 22;
  // Meal Plans
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Meal Plans', margin, y);
  y += 6;
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  const mealTypeColors: Record<string, [number,number,number]> = {
    breakfast: [251, 191, 36], lunch: [34, 197, 94], dinner: [99, 102, 241],
    snack: [249, 115, 22], pre_training: [239, 68, 68], post_training: [14, 165, 233],
  };
  for (const meal of mealPlans) {
    if (y > 265) { doc.addPage(); y = margin; }
    const color = mealTypeColors[meal.mealType] || [100, 100, 100] as [number,number,number];
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin, y, 4, 12, 'F');
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(meal.title || 'Meal', margin + 7, y + 5);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(meal.mealType.replace('_', ' ').toUpperCase(), margin + 7, y + 10);
    const macroStr = [
      meal.calories > 0 ? meal.calories + ' kcal' : '',
      meal.protein > 0 ? 'P: ' + meal.protein + 'g' : '',
      meal.carbs > 0 ? 'C: ' + meal.carbs + 'g' : '',
      meal.fats > 0 ? 'F: ' + meal.fats + 'g' : '',
    ].filter(Boolean).join('  ·  ');
    if (macroStr) {
      doc.setTextColor(60, 60, 60);
      doc.text(macroStr, pageW - margin, y + 5, { align: 'right' });
    }
    y += 13;
    if (meal.foods) {
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(meal.foods, pageW - 2 * margin - 10);
      doc.text(lines, margin + 7, y);
      y += lines.length * 4 + 2;
    }
    if (meal.notes) {
      doc.setFontSize(8);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'italic');
      doc.text('Note: ' + meal.notes, margin + 7, y);
      doc.setFont('helvetica', 'normal');
      y += 5;
    }
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, pageW - margin, y);
    y += 4;
  }
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('Generated by Football Academy Platform  ·  ' + new Date().toLocaleDateString(), pageW / 2, 290, { align: 'center' });
  doc.save('nutrition-plan-' + playerName.replace(/\s+/g, '-').toLowerCase() + '-' + date + '.pdf');
}

function MealCard({ meal }: { meal: any }) {
  const getMealTypeIcon = (type: string) => {
    const icons: Record<string, React.ElementType> = {
      breakfast: Cookie,
      lunch: Apple,
      dinner: Beef,
      snack: Cookie,
      pre_training: Flame,
      post_training: Droplets,
    };
    return icons[type] || Apple;
  };

  const getMealTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      breakfast: 'bg-accent/20 text-accent',
      lunch: 'bg-primary/20 text-primary',
      dinner: 'bg-chart-2/20 text-chart-2',
      snack: 'bg-chart-3/20 text-chart-3',
      pre_training: 'bg-destructive/20 text-destructive',
      post_training: 'bg-chart-4/20 text-chart-4',
    };
    return colors[type] || 'bg-muted text-muted-foreground';
  };

  const Icon = getMealTypeIcon(meal.mealType);
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${getMealTypeColor(meal.mealType)}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm truncate">{meal.title}</h4>
              <Badge variant="outline" className="text-xs capitalize shrink-0">
                {meal.mealType.replace('_', ' ')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground capitalize">{meal.mealType.replace('_', ' ')}</p>
            {meal.foods && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{meal.foods}</p>
            )}
            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
              {meal.calories > 0 && <span>{meal.calories} kcal</span>}
              {meal.protein > 0 && <span>P: {meal.protein}g</span>}
              {meal.carbs > 0 && <span>C: {meal.carbs}g</span>}
              {meal.fats > 0 && <span>F: {meal.fats}g</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Nutrition() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { selectedChildId } = useParentChild();
  const [, navigate] = useLocation();
  const [selectedPlayer, setSelectedPlayer] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: players } = trpc.players.getAll.useQuery();

  const effectivePlayerId = user?.role === 'player'
    ? players?.find((p: any) => p.userId === user.id)?.id?.toString() || ''
    : selectedChildId
      ? selectedChildId.toString()
      : selectedPlayer;

  const { data: mealPlans } = trpc.nutrition.getPlayerMealPlans.useQuery(
    { playerId: parseInt(effectivePlayerId), date: selectedDate },
    { enabled: !!effectivePlayerId }
  );

  const { data: nutritionLogs } = trpc.nutrition.getNutritionLogs?.useQuery?.(
    { playerId: parseInt(effectivePlayerId) },
    { enabled: !!effectivePlayerId }
  ) ?? { data: null };

  // Calculate totals from meal plans
  const totals = mealPlans?.reduce(
    (acc: any, meal: any) => ({
      calories: acc.calories + (meal.calories || 0),
      protein: acc.protein + (meal.protein || 0),
      carbs: acc.carbs + (meal.carbs || 0),
      fats: acc.fats + (meal.fats || 0),
      hydration: acc.hydration + (meal.hydrationMl || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, hydration: 0 }
  ) || { calories: 0, protein: 0, carbs: 0, fats: 0, hydration: 0 };

  const isStaff = user?.role === 'admin' || user?.role === 'nutritionist' || user?.role === 'coach';

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/staff")} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{t("nutrition.title")}</h1>
              <p className="text-sm text-muted-foreground">Manage meal plans and track nutrition</p>
            </div>
          </div>
          {isStaff && <CreateMealPlanDialog />}
        </div>

        {/* Player + Date Selection (staff only) */}
        {isStaff && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="space-y-1 flex-1 min-w-[180px]">
                  <Label>Player</Label>
                  <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select player..." />
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
                <div className="space-y-1">
                  <Label className="whitespace-nowrap">Date:</Label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {effectivePlayerId ? (
          <div className="space-y-6">
            {/* Macro Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MacroCard label="Calories" value={totals.calories} target={2500} unit="kcal" icon={Flame} color="bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400" />
              <MacroCard label="Protein" value={totals.protein} target={150} unit="g" icon={Beef} color="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400" />
              <MacroCard label="Carbs" value={totals.carbs} target={300} unit="g" icon={Wheat} color="bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400" />
              <MacroCard label="Hydration" value={totals.hydration} target={2500} unit="ml" icon={Droplets} color="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400" />
            </div>

            {/* Meal Plans */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Meal Plan for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
                    <CardDescription>
                      {mealPlans?.length || 0} meal{mealPlans?.length !== 1 ? 's' : ''} planned
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {mealPlans && mealPlans.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const playerData = players?.find((p: any) => p.id.toString() === effectivePlayerId);
                          const playerName = playerData ? playerData.firstName + ' ' + playerData.lastName : 'Player';
                          exportNutritionPDF(mealPlans, playerName, selectedDate, totals);
                        }}
                        className="text-xs gap-1"
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        Export PDF
                      </Button>
                    )}
                    {isStaff && <CreateMealPlanDialog />}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {mealPlans && mealPlans.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {mealPlans.map((meal: any) => (
                      <MealCard key={meal.id} meal={meal} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Apple className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No meal plans for this date</p>
                    {isStaff && <p className="text-xs mt-1">Use "Create Meal Plan" to add one</p>}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Nutrition History */}
            {nutritionLogs && nutritionLogs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Nutrition Logs</CardTitle>
                  <CardDescription>Last 7 days of tracked nutrition</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {nutritionLogs.map((log: any, i: number) => (
                      <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                        <div className="text-sm font-medium min-w-[100px]">
                          {new Date(log.logDate).toLocaleDateString()}
                        </div>
                        <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Cal:</span> {log.totalCalories || 0}
                          </div>
                          <div>
                            <span className="text-muted-foreground">P:</span> {log.totalProtein || 0}g
                          </div>
                          <div>
                            <span className="text-muted-foreground">C:</span> {log.totalCarbs || 0}g
                          </div>
                          <div>
                            <span className="text-muted-foreground">F:</span> {log.totalFats || 0}g
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Apple className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Select a Player</h3>
              <p className="text-muted-foreground">
                Choose a player to view and manage their nutrition plans
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      <PageHelp pageKey="nutrition" />
    </>
  );
}
