import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import {
  Camera, Apple, TrendingUp, Flame, Droplet, ArrowLeft,
  Upload, CheckCircle, AlertCircle, Utensils, Zap,
  BarChart2, Target, RefreshCw, Eye, AlertTriangle
} from "lucide-react";
import { useLocation } from "wouter";
import { useLanguage } from '@/contexts/LanguageContext';

const DAILY_GOALS = { calories: 2800, protein: 140, carbs: 350, fat: 80, fiber: 30 };

interface AnalysisResult {
  isFood: boolean;
  reason?: string;
  mealName?: string;
  nutritionScore?: number;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  hydration?: number;
  summary?: string;
  recommendations?: string[];
}

export default function NutritionAI() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { t, language } = useLanguage();
  const [mealDescription, setMealDescription] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<"log" | "history" | "goals">("log");

  const analyzeImage = trpc.nutritionAI.analyzeImage.useMutation();
  const logMeal = trpc.nutritionAI.logMeal.useMutation();
  const { data: mealLogs, refetch } = trpc.nutritionAI.getMealLogs.useQuery({});

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image under 10MB", variant: "destructive" });
      return;
    }
    setPhotoFile(file);
    setAnalysisResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    toast({ title: "Photo ready", description: "Click 'Analyze Meal' to get AI nutritional breakdown" });
  };

  const handleAnalyze = async () => {
    if (!photoFile && !mealDescription.trim()) {
      toast({ title: "No input", description: "Please upload a photo or describe your meal", variant: "destructive" });
      return;
    }
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      // The procedure's output isn't typed, so pin it to the shape this screen renders.
      const result = (await analyzeImage.mutateAsync({
        imageBase64: photoPreview || `data:text/plain;base64,${btoa('text-only')}`,
        mealDescription: mealDescription.trim() || undefined,
      })) as AnalysisResult;
      setAnalysisResult(result);
      if (!result.isFood) {
        toast({
          title: "Not a food image",
          description: result.reason || "Please upload a photo of a meal or food item",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Analysis complete!",
          description: `${result.calories} kcal detected — Score: ${result.nutritionScore}/100`
        });
      }
    } catch (err: any) {
      toast({ title: "Analysis failed", description: err.message || "Please try again", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogMeal = async () => {
    if (!analysisResult?.isFood) {
      toast({ title: "Error", description: "Please analyze a valid meal first", variant: "destructive" });
      return;
    }
    try {
      await logMeal.mutateAsync({
        mealDescription: analysisResult.mealName || mealDescription,
        calories: analysisResult.calories,
        photoUrl: photoPreview || undefined,
      });
      toast({ title: "Meal logged!", description: "Added to your nutrition diary" });
      setMealDescription("");
      setPhotoPreview(null);
      setPhotoFile(null);
      setAnalysisResult(null);
      refetch();
    } catch {
      toast({ title: "Error", description: "Failed to log meal", variant: "destructive" });
    }
  };

  const scoreColor = (s: number) => s >= 80 ? "text-green-700 dark:text-green-400" : s >= 60 ? "text-yellow-700 dark:text-yellow-400" : "text-red-600 dark:text-red-400";
  const scoreBar = (s: number) => s >= 80 ? "bg-green-500" : s >= 60 ? "bg-yellow-500" : "bg-red-500";

  return (
    <>
    <div className="text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/features-hub")} className="p-2 rounded-lg bg-muted hover:bg-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Apple className="text-green-700 dark:text-green-400" size={28} /> Nutrition AI
            </h1>
            <p className="text-muted-foreground text-sm">Upload meal photos for instant AI calorie &amp; nutrition analysis</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-muted/50 rounded-xl p-1">
          {[
            { id: "log", label: "Log Meal" },
            { id: "history", label: "History" },
            { id: "goals", label: "Daily Goals" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "log" | "history" | "goals")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id ? "bg-green-600 text-white" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Log Meal */}
        {activeTab === "log" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Panel */}
            <div className="space-y-4">
              {/* Photo Upload */}
              <div className="bg-muted/50 border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Camera size={16} className="text-green-700 dark:text-green-400" /> Upload Meal Photo
                </h3>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Meal" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      onClick={() => { setPhotoPreview(null); setPhotoFile(null); setAnalysisResult(null); }}
                      className="absolute top-2 right-2 bg-red-600 rounded-full p-1 hover:bg-red-700"
                    >
                      <AlertCircle size={14} />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/70 rounded-lg px-2 py-1 text-xs text-green-400 flex items-center gap-1">
                      <CheckCircle size={12} /> Photo ready for analysis
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-48 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-3 hover:border-green-500 hover:bg-green-500/5 transition-all cursor-pointer"
                  >
                    <Upload size={32} className="text-muted-foreground" />
                    <div className="text-center">
                      <p className="text-muted-foreground text-sm font-medium">Click to upload meal photo</p>
                      <p className="text-gray-600 text-xs">JPG, PNG, WEBP up to 10MB</p>
                    </div>
                  </button>
                )}
              </div>

              {/* Text Description */}
              <div className="bg-muted/50 border border-border rounded-xl p-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Utensils size={16} className="text-blue-600 dark:text-blue-400" /> Or Describe Your Meal
                </h3>
                <textarea
                  value={mealDescription}
                  onChange={e => setMealDescription(e.target.value)}
                  placeholder="e.g. Grilled chicken breast with brown rice and steamed broccoli..."
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-foreground text-sm placeholder-gray-500 resize-none focus:ring-2 focus:ring-green-500 focus:outline-none"
                  rows={4}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || (!photoFile && !mealDescription.trim())}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                >
                  {isAnalyzing ? (
                    <><RefreshCw size={18} className="animate-spin" /> Analyzing...</>
                  ) : (
                    <><Zap size={18} /> Analyze Meal</>
                  )}
                </button>
                <button
                  onClick={() => {
                    setMealDescription('Grilled chicken breast (200g) with brown rice (150g), steamed broccoli (100g), and a side salad with olive oil dressing. Post-training recovery meal.');
                    setAnalysisResult({
                      isFood: true,
                      mealName: 'Post-Training Recovery Meal — Grilled Chicken & Brown Rice',
                      nutritionScore: 88,
                      calories: 620,
                      protein: 52,
                      carbs: 68,
                      fat: 14,
                      fiber: 8,
                      hydration: 72,
                      summary: 'Excellent post-training recovery meal. High protein content (52g) supports muscle repair and growth after intense training. Complex carbohydrates from brown rice replenish glycogen stores efficiently. Broccoli provides essential vitamins C and K, plus anti-inflammatory compounds. The olive oil dressing adds healthy monounsaturated fats. This meal is well-balanced for an athlete\'s recovery needs.',
                      recommendations: [
                        'Add a banana or dates for faster glycogen replenishment within 30 minutes post-training',
                        'Consider adding 250ml of chocolate milk or a protein shake immediately after training before this meal',
                        'Increase portion of broccoli to 150g for more fiber and micronutrients',
                        'Hydration: Drink 500-750ml of water with this meal to support recovery',
                        'Timing: Consume within 45-90 minutes post-training for optimal muscle protein synthesis',
                        'Consider adding turmeric or ginger to reduce inflammation after intense sessions',
                      ],
                    });
                    toast({ title: 'Sample Nutrition Analysis Loaded', description: 'Post-training recovery meal analysis with full macro breakdown.' });
                  }}
                  className="px-4 bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-700 dark:text-yellow-400 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all border border-yellow-600/30 text-sm"
                >
                  <Eye size={16} /> Demo
                </button>
                {analysisResult?.isFood && (
                  <button
                    onClick={handleLogMeal}
                    disabled={logMeal.isPending}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
                  >
                    <CheckCircle size={18} /> Log to Diary
                  </button>
                )}
              </div>
            </div>

            {/* Analysis Result Panel */}
            <div>
              {isAnalyzing && (
                <div className="bg-muted/50 border border-green-500/30 rounded-xl p-6 flex flex-col items-center justify-center gap-4 h-full min-h-[300px]">
                  <RefreshCw size={40} className="text-green-700 dark:text-green-400 animate-spin" />
                  <p className="text-green-700 dark:text-green-400 font-medium">AI analyzing your meal...</p>
                  <p className="text-muted-foreground text-sm text-center">Detecting ingredients, estimating portions, calculating macros</p>
                </div>
              )}

              {!isAnalyzing && !analysisResult && (
                <div className="bg-muted/50 border border-border rounded-xl p-6 flex flex-col items-center justify-center gap-4 h-full min-h-[300px]">
                  <Eye size={48} className="text-gray-600" />
                  <p className="text-muted-foreground text-center">Upload a photo or describe your meal, then click <strong className="text-green-700 dark:text-green-400">Analyze Meal</strong> to get instant nutritional breakdown</p>
                </div>
              )}

              {!isAnalyzing && analysisResult && (
                <>
                  {/* Not food error */}
                  {!analysisResult.isFood ? (
                    <div className="bg-red-900/30 border border-red-700/50 rounded-xl p-6">
                      <div className="flex items-start gap-3">
                        <AlertTriangle size={28} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-bold text-red-600 dark:text-red-300 text-lg mb-2">Not a Food Image</h3>
                          <p className="text-muted-foreground text-sm leading-relaxed">
                            {analysisResult.reason || "The uploaded image does not appear to contain food or a meal."}
                          </p>
                          <p className="text-muted-foreground text-sm mt-3">
                            Please upload a clear photo of a meal, dish, or food item for nutritional analysis.
                          </p>
                          <button
                            onClick={() => { setPhotoPreview(null); setPhotoFile(null); setAnalysisResult(null); }}
                            className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                          >
                            Try Again with a Meal Photo
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Food analysis results */
                    <div className="bg-muted/50 border border-green-500/30 rounded-xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-foreground text-lg">{analysisResult.mealName}</h3>
                        <div className={`text-2xl font-bold ${scoreColor(analysisResult.nutritionScore || 0)}`}>
                          {analysisResult.nutritionScore}<span className="text-sm">/100</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>Nutrition Score</span>
                          <span className={scoreColor(analysisResult.nutritionScore || 0)}>
                            {(analysisResult.nutritionScore || 0) >= 80 ? "Excellent" : (analysisResult.nutritionScore || 0) >= 60 ? "Good" : "Poor"}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full">
                          <div className={`h-2 rounded-full ${scoreBar(analysisResult.nutritionScore || 0)}`} style={{ width: `${analysisResult.nutritionScore}%` }} />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Calories", value: analysisResult.calories, unit: "kcal", color: "text-orange-700 dark:text-orange-400", Icon: Flame },
                          { label: "Protein", value: analysisResult.protein, unit: "g", color: "text-blue-600 dark:text-blue-400", Icon: Zap },
                          { label: "Carbs", value: analysisResult.carbs, unit: "g", color: "text-yellow-700 dark:text-yellow-400", Icon: TrendingUp },
                          { label: "Fat", value: analysisResult.fat, unit: "g", color: "text-red-600 dark:text-red-400", Icon: Droplet },
                          { label: "Fiber", value: analysisResult.fiber, unit: "g", color: "text-green-700 dark:text-green-400", Icon: Apple },
                          { label: "Hydration", value: analysisResult.hydration, unit: "%", color: "text-cyan-700 dark:text-cyan-400", Icon: Droplet },
                        ].map(m => (
                          <div key={m.label} className="bg-muted/50 rounded-lg p-2 text-center">
                            <m.Icon size={14} className={`${m.color} mx-auto mb-1`} />
                            <div className={`text-lg font-bold ${m.color}`}>{m.value}<span className="text-xs">{m.unit}</span></div>
                            <div className="text-xs text-muted-foreground">{m.label}</div>
                          </div>
                        ))}
                      </div>
                      {analysisResult.summary && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm text-muted-foreground">{analysisResult.summary}</p>
                        </div>
                      )}
                      {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2">AI Recommendations:</p>
                          <ul className="space-y-1">
                            {analysisResult.recommendations.map((tip, i) => (
                              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                                <CheckCircle size={12} className="text-green-700 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                {tip}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB: History */}
        {activeTab === "history" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-foreground">Meal History</h2>
              <span className="text-sm text-muted-foreground">{mealLogs?.length || 0} meals logged</span>
            </div>
            {mealLogs && mealLogs.length > 0 ? (
              mealLogs.map((log: any, i: number) => (
                <div key={i} className="bg-muted/50 border border-border rounded-xl p-4 flex items-center gap-4">
                  {log.photoUrl ? (
                    <img src={log.photoUrl} alt="meal" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <Utensils size={24} className="text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{log.mealType?.replace('_', ' ') || 'Meal'}</p>
                    <p className="text-sm text-muted-foreground">{new Date(log.mealTime || log.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-orange-700 dark:text-orange-400 font-bold">{log.totalCalories || "—"}</div>
                    <div className="text-xs text-muted-foreground">kcal</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Utensils size={48} className="mx-auto mb-3 text-gray-700" />
                <p>No meals logged yet. Start by analyzing your first meal!</p>
              </div>
            )}
          </div>
        )}

        {/* TAB: Daily Goals */}
        {activeTab === "goals" && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-foreground mb-4">Daily Nutritional Goals</h2>
            <div className="bg-muted/50 border border-border rounded-xl p-4 mb-4">
              <p className="text-sm text-muted-foreground">Based on a professional football player's requirements (training day). Adjust based on your position and training intensity.</p>
            </div>
            {[
              { label: "Calories", current: mealLogs?.reduce((s: number, l: any) => s + (l.totalCalories || 0), 0) || 0, goal: DAILY_GOALS.calories, unit: "kcal", color: "bg-orange-500" },
              { label: "Protein", current: mealLogs?.reduce((s: number, l: any) => s + (l.totalProtein || 0), 0) || 0, goal: DAILY_GOALS.protein, unit: "g", color: "bg-blue-500" },
              { label: "Carbohydrates", current: mealLogs?.reduce((s: number, l: any) => s + (l.totalCarbs || 0), 0) || 0, goal: DAILY_GOALS.carbs, unit: "g", color: "bg-yellow-500" },
              { label: "Fat", current: mealLogs?.reduce((s: number, l: any) => s + (l.totalFat || 0), 0) || 0, goal: DAILY_GOALS.fat, unit: "g", color: "bg-red-500" },
              { label: "Fiber", current: 0, goal: DAILY_GOALS.fiber, unit: "g", color: "bg-green-500" },
            ].map(item => {
              const pct = Math.min(100, Math.round((item.current / item.goal) * 100));
              return (
                <div key={item.label} className="bg-muted/50 border border-border rounded-xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="text-sm text-muted-foreground">{item.current} / {item.goal} {item.unit}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full">
                    <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>{pct}% of daily goal</span>
                    <span>{item.goal - item.current} {item.unit} remaining</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
