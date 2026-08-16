import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import { Shield, AlertTriangle, CheckCircle, Activity, ArrowLeft, Brain, Zap } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from 'wouter';


export default function InjuryPrevention() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [bodyPart, setBodyPart] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [notes, setNotes] = useState("");

  const [assessmentResult, setAssessmentResult] = useState<any>(null);
  const createAssessment = trpc.injuryPrevention.createAssessment.useMutation();
  const { data: assessments, refetch } = trpc.injuryPrevention.getMyAssessments.useQuery();

  const handleSubmitAssessment = async () => {
    if (!bodyPart || !riskLevel) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى ملء جميع الحقول المطلوبة" : "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const result = await createAssessment.mutateAsync({
        bodyPart: bodyPart || undefined,
        riskLevel: riskLevel as 'low' | 'moderate' | 'high' | 'critical' | undefined,
        notes: notes || undefined,
      });
      setAssessmentResult(result);

      toast({
        title: language === 'ar' ? "نجح" : "Success",
        description: language === 'ar' ? "تم حفظ التقييم بنجاح" : "Assessment saved successfully",
      });

      setBodyPart("");
      setRiskLevel("");
      setNotes("");
      refetch();
    } catch (error) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "فشل حفظ التقييم" : "Failed to save assessment",
        variant: "destructive",
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-100 dark:bg-green-950';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950';
      case 'high':
        return 'text-red-600 bg-red-100 dark:bg-red-950';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-950';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low':
        return <CheckCircle className="h-5 w-5" />;
      case 'moderate':
        return <AlertTriangle className="h-5 w-5" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Activity className="h-5 w-5" />;
    }
  };

  return (
    <>
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/coach/injury-tracking")} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Shield className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'الوقاية من الإصابات' : 'Injury Prevention'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تقييم مخاطر الإصابة والتوصيات الوقائية' : 'Injury risk assessment and preventive recommendations'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Assessment Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              {language === 'ar' ? 'تقييم جديد' : 'New Assessment'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'قم بتقييم مخاطر الإصابة لأجزاء الجسم المختلفة' 
                : 'Assess injury risk for different body parts'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bodyPart">
                {language === 'ar' ? 'جزء الجسم' : 'Body Part'}
              </Label>
              <Select value={bodyPart} onValueChange={setBodyPart}>
                <SelectTrigger id="bodyPart">
                  <SelectValue placeholder={language === 'ar' ? 'اختر جزء الجسم' : 'Select body part'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="knee">
                    {language === 'ar' ? 'الركبة' : 'Knee'}
                  </SelectItem>
                  <SelectItem value="ankle">
                    {language === 'ar' ? 'الكاحل' : 'Ankle'}
                  </SelectItem>
                  <SelectItem value="hamstring">
                    {language === 'ar' ? 'أوتار الركبة' : 'Hamstring'}
                  </SelectItem>
                  <SelectItem value="groin">
                    {language === 'ar' ? 'الفخذ' : 'Groin'}
                  </SelectItem>
                  <SelectItem value="shoulder">
                    {language === 'ar' ? 'الكتف' : 'Shoulder'}
                  </SelectItem>
                  <SelectItem value="back">
                    {language === 'ar' ? 'الظهر' : 'Back'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="riskLevel">
                {language === 'ar' ? 'مستوى الخطر' : 'Risk Level'}
              </Label>
              <Select value={riskLevel} onValueChange={setRiskLevel}>
                <SelectTrigger id="riskLevel">
                  <SelectValue placeholder={language === 'ar' ? 'اختر مستوى الخطر' : 'Select risk level'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    {language === 'ar' ? 'منخفض' : 'Low'}
                  </SelectItem>
                  <SelectItem value="moderate">
                    {language === 'ar' ? 'متوسط' : 'Medium'}
                  </SelectItem>
                  <SelectItem value="high">
                    {language === 'ar' ? 'عالي' : 'High'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">
                {language === 'ar' ? 'ملاحظات' : 'Notes'}
              </Label>
              <Textarea
                id="notes"
                placeholder={language === 'ar' ? 'أضف أي ملاحظات أو أعراض...' : 'Add any notes or symptoms...'}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </div>

            <Button
              onClick={handleSubmitAssessment}
              disabled={createAssessment.isPending}
              className="w-full"
            >
              {createAssessment.isPending
                ? (language === 'ar' ? 'جاري التحليل بالذكاء الاصطناعي...' : 'AI Analyzing...')
                : (language === 'ar' ? 'تشغيل تقييم المخاطر' : 'Run Risk Assessment')}
            </Button>
          </CardContent>
        </Card>

        {/* AI Result or Risk Summary */}
        <div className="space-y-4">
          {assessmentResult && (
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Brain className="h-5 w-5" />
                  {language === 'ar' ? 'نتيجة التحليل الذكي' : 'AI Analysis Result'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm font-medium">{language === 'ar' ? 'درجة الخطر' : 'Risk Score'}</span>
                  <span className={`text-2xl font-bold ${
                    (assessmentResult.overallRiskScore ?? 0) > 60 ? 'text-red-600' :
                    (assessmentResult.overallRiskScore ?? 0) > 30 ? 'text-yellow-600' : 'text-green-600'
                  }`}>{assessmentResult.overallRiskScore ?? '--'}/100</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                    assessmentResult.riskLevel === 'high' || assessmentResult.riskLevel === 'critical' ? 'bg-red-100 text-red-700' :
                    assessmentResult.riskLevel === 'moderate' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                  }`}>{assessmentResult.riskLevel} risk</span>
                  {assessmentResult.recommendedRestDays > 0 && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {assessmentResult.recommendedRestDays} {language === 'ar' ? 'أيام راحة' : 'rest days'}
                    </span>
                  )}
                </div>
                {assessmentResult.specificRecommendations && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">{language === 'ar' ? 'التوصيات:' : 'Recommendations:'}</p>
                    <ul className="space-y-1">
                      {(assessmentResult.specificRecommendations as string[]).map((rec: string, i: number) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <Zap className="h-3.5 w-3.5 mt-0.5 text-primary flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {assessmentResult.aiAnalysis && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground line-clamp-4">{assessmentResult.aiAnalysis}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {language === 'ar' ? 'ملخص المخاطر' : 'Risk Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    {language === 'ar' ? 'مخاطر منخفضة' : 'Low Risk'}
                  </span>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {assessments?.filter(a => a.riskLevel === 'low').length || 0}
                </p>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    {language === 'ar' ? 'مخاطر متوسطة' : 'Medium Risk'}
                  </span>
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                  {assessments?.filter(a => a.riskLevel === 'moderate').length || 0}
                </p>
              </div>

              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    {language === 'ar' ? 'مخاطر عالية' : 'High Risk'}
                  </span>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                  {assessments?.filter(a => a.riskLevel === 'high').length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Assessments */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ar' ? 'التقييمات الأخيرة' : 'Recent Assessments'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {assessments && assessments.length > 0 ? (
            <div className="space-y-3">
              {assessments.slice(0, 5).map((assessment) => (
                <div 
                  key={assessment.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getRiskColor(assessment.riskLevel ?? 'low')}`}>
                      {getRiskIcon(assessment.riskLevel ?? 'low')}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{(assessment.predictedInjuryTypes as any[])?.[0]?.bodyPart || 'General'}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(assessment.assessmentDate).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(assessment.riskLevel ?? 'low')}`}>
                    {assessment.riskLevel === 'low' ? (language === 'ar' ? 'منخفض' : 'Low') :
                     assessment.riskLevel === 'moderate' ? (language === 'ar' ? 'متوسط' : 'Medium') :
                     (language === 'ar' ? 'عالي' : 'High')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {language === 'ar' ? 'لا توجد تقييمات بعد' : 'No assessments yet'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
