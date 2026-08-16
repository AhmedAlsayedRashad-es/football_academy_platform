import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { DashboardLayoutSkeleton } from '@/components/DashboardLayoutSkeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc';
import { useLocation } from 'wouter';
import {Database,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Users,
  Calendar,
  Activity,
  Trophy,
  Brain,
  Apple,
  Dumbbell,
  Target, ArrowLeft} from 'lucide-react';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';

export default function AdminDataManagement() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [output, setOutput] = useState<string>('');

  const populateData = trpc.admin.populateData.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(language === 'ar' ? 'تم إنشاء البيانات بنجاح' : 'Data populated successfully');
        setOutput(data.output || '');
      } else {
        toast.error(data.message);
        setOutput(data.output || data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message);
      setOutput(error.message);
    },
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation('/');
    return null;
  }

  if (user.role !== 'admin') {
    return (
      <>
        <div className="flex items-center justify-center h-96">
          <Card className="w-96">
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                {language === 'ar' 
                  ? 'هذه الصفحة متاحة للمسؤولين فقط' 
                  : 'This page is only available to admins'}
              </p>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const handlePopulateData = () => {
    if (confirm(language === 'ar' 
      ? 'هل أنت متأكد من رغبتك في إنشاء بيانات تجريبية؟ سيتم إضافة العديد من السجلات إلى قاعدة البيانات.' 
      : 'Are you sure you want to populate sample data? This will add many records to the database.')) {
      setOutput('');
      populateData.mutate();
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            
            <BackButton />
<h1 className="text-3xl font-bold flex items-center gap-3">
              <Database className="h-8 w-8 text-primary" />
              {language === 'ar' ? 'إدارة البيانات' : 'Data Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' 
                ? 'إنشاء وإدارة بيانات النظام' 
                : 'Populate and manage system data'}
            </p>
          </div>
        </div>

        {/* Warning Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {language === 'ar' ? 'تحذير' : 'Warning'}
          </AlertTitle>
          <AlertDescription>
            {language === 'ar' 
              ? 'هذه الأدوات مخصصة للمسؤولين فقط. استخدمها بحذر لأنها ستضيف بيانات إلى قاعدة البيانات.' 
              : 'These tools are for administrators only. Use with caution as they will add data to the database.'}
          </AlertDescription>
        </Alert>

        {/* Data Population Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              {language === 'ar' ? 'إنشاء بيانات تجريبية شاملة' : 'Populate Comprehensive Sample Data'}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'إنشاء بيانات تجريبية واقعية لاختبار جميع ميزات النظام' 
                : 'Generate realistic sample data to test all system features'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-blue-500" />
                <span>{language === 'ar' ? '100+ لاعب' : '100+ Players'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Trophy className="h-4 w-4 text-yellow-700 dark:text-yellow-500" />
                <span>{language === 'ar' ? '6 فرق' : '6 Teams'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-green-700 dark:text-green-500" />
                <span>{language === 'ar' ? '30 جلسة تدريب' : '30 Training Sessions'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-red-500" />
                <span>{language === 'ar' ? '25 مباراة' : '25 Matches'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Brain className="h-4 w-4 text-purple-500" />
                <span>{language === 'ar' ? 'تقييمات نفسية' : 'Mental Assessments'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Apple className="h-4 w-4 text-pink-500" />
                <span>{language === 'ar' ? 'خطط تغذية' : 'Nutrition Plans'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Dumbbell className="h-4 w-4 text-orange-700 dark:text-orange-500" />
                <span>{language === 'ar' ? 'تمارين بدنية' : 'Physical Workouts'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-cyan-700 dark:text-cyan-500" />
                <span>{language === 'ar' ? 'خطط تطوير' : 'Development Plans'}</span>
              </div>
            </div>

            <Button 
              onClick={handlePopulateData} 
              disabled={populateData.isPending}
              size="lg"
              className="w-full"
            >
              {populateData.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'ar' ? 'جاري الإنشاء...' : 'Populating...'}
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'إنشاء البيانات التجريبية' : 'Populate Sample Data'}
                </>
              )}
            </Button>

            {/* Output Display */}
            {output && (
              <div className="mt-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500" />
                  <span className="font-semibold">
                    {language === 'ar' ? 'النتيجة:' : 'Output:'}
                  </span>
                </div>
                <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                  {output}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              {language === 'ar' ? 'ماذا يتضمن؟' : 'What\'s Included?'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'ar' 
                    ? '6 فرق (U9 إلى U19) مع أسماء واقعية' 
                    : '6 teams (U9 to U19) with realistic names'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'ar' 
                    ? '100+ لاعب بأسماء مصرية وبيانات واقعية' 
                    : '100+ players with Egyptian names and realistic data'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'ar' 
                    ? 'مقاييس أداء شاملة لكل لاعب' 
                    : 'Comprehensive performance metrics for each player'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'ar' 
                    ? 'سجلات مباريات مع إحصائيات اللاعبين' 
                    : 'Match records with player statistics'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'ar' 
                    ? 'جلسات تدريب متنوعة (فنية، تكتيكية، بدنية)' 
                    : 'Diverse training sessions (technical, tactical, physical)'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'ar' 
                    ? 'تقييمات نفسية وخطط تغذية وتمارين بدنية' 
                    : 'Mental assessments, nutrition plans, and physical workouts'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-500 mt-0.5 flex-shrink-0" />
                <span>
                  {language === 'ar' 
                    ? 'خطط تطوير فردية مع أهداف وتقدم' 
                    : 'Individual development plans with goals and progress'}
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
