import { useState } from 'react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Send, Calendar, Users, TrendingUp, Clock, CheckCircle, AlertTriangle, BarChart3 } from 'lucide-react';

export default function AutoReportsHub() {
  const { language } = useLanguage();
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [reportType, setReportType] = useState<string>('weekly');
  const [generating, setGenerating] = useState(false);

  const teams = trpc.teams.getAll.useQuery();

  // Report templates
  const reportTemplates = [
    {
      id: 'weekly-player',
      title: language === 'ar' ? 'تقرير اللاعب الأسبوعي' : 'Weekly Player Report',
      description: language === 'ar' ? 'ملخص أداء كل لاعب خلال الأسبوع' : 'Weekly performance summary for each player',
      frequency: language === 'ar' ? 'أسبوعي' : 'Weekly',
      icon: Users,
      color: 'text-blue-500',
      includes: language === 'ar' 
        ? ['الحضور', 'الأداء البدني', 'المهارات الفنية', 'السلوك', 'توصيات المدرب']
        : ['Attendance', 'Physical Performance', 'Technical Skills', 'Behavior', 'Coach Recommendations'],
    },
    {
      id: 'monthly-team',
      title: language === 'ar' ? 'تقرير الفريق الشهري' : 'Monthly Team Report',
      description: language === 'ar' ? 'تحليل شامل لأداء الفريق خلال الشهر' : 'Comprehensive team performance analysis for the month',
      frequency: language === 'ar' ? 'شهري' : 'Monthly',
      icon: BarChart3,
      color: 'text-green-700 dark:text-green-500',
      includes: language === 'ar'
        ? ['نتائج المباريات', 'إحصائيات الأداء', 'تطور اللاعبين', 'الإصابات', 'التوصيات']
        : ['Match Results', 'Performance Stats', 'Player Development', 'Injuries', 'Recommendations'],
    },
    {
      id: 'seasonal',
      title: language === 'ar' ? 'التقرير الموسمي الشامل' : 'Seasonal Comprehensive Report',
      description: language === 'ar' ? 'تقرير شامل لنهاية الموسم مع تحليل كامل' : 'End-of-season comprehensive report with full analysis',
      frequency: language === 'ar' ? 'موسمي' : 'Seasonal',
      icon: TrendingUp,
      color: 'text-purple-500',
      includes: language === 'ar'
        ? ['ملخص الموسم', 'أفضل اللاعبين', 'التطور العام', 'المقارنة بالموسم السابق', 'خطة الموسم القادم']
        : ['Season Summary', 'Top Players', 'Overall Development', 'Previous Season Comparison', 'Next Season Plan'],
    },
    {
      id: 'parent-report',
      title: language === 'ar' ? 'تقرير ولي الأمر' : 'Parent Report',
      description: language === 'ar' ? 'تقرير مبسط لولي الأمر عن تقدم ابنه' : 'Simplified report for parents about their child\'s progress',
      frequency: language === 'ar' ? 'أسبوعي' : 'Weekly',
      icon: FileText,
      color: 'text-orange-700 dark:text-orange-500',
      includes: language === 'ar'
        ? ['الحضور', 'التقييم العام', 'نقاط القوة', 'مجالات التحسين', 'رسالة المدرب']
        : ['Attendance', 'Overall Rating', 'Strengths', 'Areas for Improvement', 'Coach Message'],
    },
    {
      id: 'admin-financial',
      title: language === 'ar' ? 'التقرير المالي والإداري' : 'Financial & Admin Report',
      description: language === 'ar' ? 'تقرير مالي وإداري شامل للإدارة' : 'Comprehensive financial and administrative report for management',
      frequency: language === 'ar' ? 'شهري' : 'Monthly',
      icon: Calendar,
      color: 'text-red-500',
      includes: language === 'ar'
        ? ['الإيرادات', 'المصروفات', 'الاشتراكات', 'معدل الحضور', 'إحصائيات التسجيل']
        : ['Revenue', 'Expenses', 'Subscriptions', 'Attendance Rate', 'Enrollment Stats'],
    },
    {
      id: 'injury-report',
      title: language === 'ar' ? 'تقرير الإصابات والتعافي' : 'Injury & Recovery Report',
      description: language === 'ar' ? 'ملخص حالات الإصابة والتعافي' : 'Summary of injury cases and recovery progress',
      frequency: language === 'ar' ? 'أسبوعي' : 'Weekly',
      icon: AlertTriangle,
      color: 'text-yellow-700 dark:text-yellow-500',
      includes: language === 'ar'
        ? ['الإصابات الحالية', 'مراحل التعافي', 'العودة للعب', 'الإحصائيات', 'التوصيات الطبية']
        : ['Current Injuries', 'Recovery Stages', 'Return to Play', 'Statistics', 'Medical Recommendations'],
    },
  ];

  // Recent generated reports (mock data)
  const recentReports = [
    { id: 1, title: language === 'ar' ? 'تقرير أسبوعي - فريق U14' : 'Weekly Report - U14 Team', date: '2026-06-01', status: 'sent', recipients: 12 },
    { id: 2, title: language === 'ar' ? 'تقرير شهري - مايو 2026' : 'Monthly Report - May 2026', date: '2026-05-31', status: 'generated', recipients: 0 },
    { id: 3, title: language === 'ar' ? 'تقرير ولي أمر - أحمد محمد' : 'Parent Report - Ahmed Mohamed', date: '2026-05-28', status: 'sent', recipients: 2 },
    { id: 4, title: language === 'ar' ? 'تقرير الإصابات - الأسبوع 22' : 'Injury Report - Week 22', date: '2026-05-27', status: 'generated', recipients: 0 },
    { id: 5, title: language === 'ar' ? 'تقرير أسبوعي - فريق U16' : 'Weekly Report - U16 Team', date: '2026-05-25', status: 'sent', recipients: 15 },
  ];

  // Scheduled reports
  const scheduledReports = [
    { id: 1, template: 'weekly-player', nextRun: '2026-06-08', team: 'U14', active: true },
    { id: 2, template: 'monthly-team', nextRun: '2026-06-30', team: 'All', active: true },
    { id: 3, template: 'parent-report', nextRun: '2026-06-08', team: 'U12', active: true },
    { id: 4, template: 'injury-report', nextRun: '2026-06-08', team: 'All', active: false },
  ];

  const [reportOutput, setReportOutput] = useState<string>('');
  const [reportTitle, setReportTitle] = useState<string>('');
  const [showReportDialog, setShowReportDialog] = useState(false);

  const generateInsightsMutation = trpc.ai.generateDataInsights.useMutation({
    onSuccess: (data: any) => {
      setReportOutput(data?.insights || data?.content || 'Report generated successfully.');
      setShowReportDialog(true);
      setGenerating(false);
      toast.success(language === 'ar' ? 'تم إنشاء التقرير بنجاح!' : 'Report generated successfully!');
    },
    onError: () => {
      setGenerating(false);
      toast.error(language === 'ar' ? 'فشل في إنشاء التقرير' : 'Failed to generate report');
    }
  });

  const handleGenerateReport = async (templateId: string) => {
    const template = reportTemplates.find(t => t.id === templateId);
    if (!template) return;
    setGenerating(true);
    setReportTitle(template.title);
    generateInsightsMutation.mutate({ dataType: templateId, dataset: [], timeframe: 'current' });
  };

  return (
    <>
      <div className="p-6 space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">
              {language === 'ar' ? 'مركز التقارير التلقائية' : 'Auto Reports Center'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {language === 'ar' 
                ? 'إنشاء وجدولة وإرسال التقارير تلقائياً بنقرة واحدة'
                : 'Generate, schedule, and send reports automatically with one click'}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={language === 'ar' ? 'اختر الفريق' : 'Select Team'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'ar' ? 'كل الفرق' : 'All Teams'}</SelectItem>
                {teams.data?.map((team: any) => (
                  <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تقارير هذا الشهر' : 'Reports This Month'}</p>
                <p className="text-2xl font-bold">24</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Send className="h-5 w-5 text-green-700 dark:text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'تم إرسالها' : 'Sent'}</p>
                <p className="text-2xl font-bold">18</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'مجدولة' : 'Scheduled'}</p>
                <p className="text-2xl font-bold">4</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Users className="h-5 w-5 text-orange-700 dark:text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{language === 'ar' ? 'المستلمون' : 'Recipients'}</p>
                <p className="text-2xl font-bold">156</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates">{language === 'ar' ? 'قوالب التقارير' : 'Report Templates'}</TabsTrigger>
            <TabsTrigger value="history">{language === 'ar' ? 'السجل' : 'History'}</TabsTrigger>
            <TabsTrigger value="scheduled">{language === 'ar' ? 'المجدولة' : 'Scheduled'}</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reportTemplates.map((template) => (
                <Card key={template.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <template.icon className={`h-5 w-5 ${template.color}`} />
                        <CardTitle className="text-base">{template.title}</CardTitle>
                      </div>
                      <Badge variant="outline">{template.frequency}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                    <div className="space-y-1 mb-4">
                      <p className="text-xs font-medium text-muted-foreground">
                        {language === 'ar' ? 'يتضمن:' : 'Includes:'}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {template.includes.map((item, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">{item}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => handleGenerateReport(template.id)}
                        disabled={generating}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        {generating 
                          ? (language === 'ar' ? 'جاري الإنشاء...' : 'Generating...')
                          : (language === 'ar' ? 'إنشاء PDF' : 'Generate PDF')}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Send className="h-3 w-3 mr-1" />
                        {language === 'ar' ? 'إرسال' : 'Send'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-start p-3 text-sm font-medium">{language === 'ar' ? 'التقرير' : 'Report'}</th>
                        <th className="text-start p-3 text-sm font-medium">{language === 'ar' ? 'التاريخ' : 'Date'}</th>
                        <th className="text-start p-3 text-sm font-medium">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                        <th className="text-start p-3 text-sm font-medium">{language === 'ar' ? 'المستلمون' : 'Recipients'}</th>
                        <th className="text-start p-3 text-sm font-medium">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentReports.map((report) => (
                        <tr key={report.id} className="border-t">
                          <td className="p-3 text-sm">{report.title}</td>
                          <td className="p-3 text-sm text-muted-foreground">{report.date}</td>
                          <td className="p-3">
                            <Badge variant={report.status === 'sent' ? 'default' : 'secondary'}>
                              {report.status === 'sent' 
                                ? (language === 'ar' ? 'تم الإرسال' : 'Sent')
                                : (language === 'ar' ? 'تم الإنشاء' : 'Generated')}
                            </Badge>
                          </td>
                          <td className="p-3 text-sm">{report.recipients}</td>
                          <td className="p-3">
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost"><Download className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost"><Send className="h-3 w-3" /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Scheduled Tab */}
          <TabsContent value="scheduled" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {language === 'ar' ? 'التقارير المجدولة' : 'Scheduled Reports'}
                  </CardTitle>
                  <Button size="sm">
                    {language === 'ar' ? 'إضافة جدولة' : 'Add Schedule'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {scheduledReports.map((schedule) => {
                    const template = reportTemplates.find(t => t.id === schedule.template);
                    return (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {template && <template.icon className={`h-5 w-5 ${template.color}`} />}
                          <div>
                            <p className="text-sm font-medium">{template?.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {language === 'ar' ? 'الفريق:' : 'Team:'} {schedule.team} | {language === 'ar' ? 'التالي:' : 'Next:'} {schedule.nextRun}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={schedule.active ? 'default' : 'secondary'}>
                            {schedule.active 
                              ? (language === 'ar' ? 'نشط' : 'Active')
                              : (language === 'ar' ? 'متوقف' : 'Paused')}
                          </Badge>
                          <Button size="sm" variant="ghost">
                            {schedule.active 
                              ? (language === 'ar' ? 'إيقاف' : 'Pause')
                              : (language === 'ar' ? 'تفعيل' : 'Activate')}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Generate Section */}
        <Card>
          <CardHeader>
            <CardTitle>{language === 'ar' ? 'إنشاء تقرير سريع' : 'Quick Generate'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'نوع التقرير' : 'Report Type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">{language === 'ar' ? 'أسبوعي' : 'Weekly'}</SelectItem>
                  <SelectItem value="monthly">{language === 'ar' ? 'شهري' : 'Monthly'}</SelectItem>
                  <SelectItem value="seasonal">{language === 'ar' ? 'موسمي' : 'Seasonal'}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'ar' ? 'الفريق' : 'Team'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{language === 'ar' ? 'كل الفرق' : 'All Teams'}</SelectItem>
                  {teams.data?.map((team: any) => (
                    <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={() => handleGenerateReport(reportType)} disabled={generating}>
                  <Download className="h-4 w-4 mr-2" />
                  {generating 
                    ? (language === 'ar' ? 'جاري الإنشاء...' : 'Generating...')
                    : (language === 'ar' ? 'إنشاء PDF' : 'Generate PDF')}
                </Button>
                <Button variant="outline">
                  <Send className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'إنشاء وإرسال' : 'Generate & Send'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Report Output Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-500" />
                {reportTitle}
              </h2>
              <button onClick={() => setShowReportDialog(false)} className="text-muted-foreground hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                {reportOutput}
              </div>
            </div>
            <div className="flex gap-2 p-4 border-t">
              <button
                onClick={() => {
                  const blob = new Blob([reportOutput], { type: 'text/plain' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${reportTitle.replace(/\s+/g, '_')}.txt`;
                  a.click();
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Download className="h-4 w-4" />
                {language === 'ar' ? 'تنزيل التقرير' : 'Download Report'}
              </button>
              <button onClick={() => setShowReportDialog(false)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50">
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
