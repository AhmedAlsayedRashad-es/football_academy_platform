import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { FileText, Download, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Streamdown } from '@/components/MarkdownRenderer';
import { useToast } from '@/hooks/use-toast';

interface PostMatchReportProps {
  matchId: number;
}

export default function PostMatchReport({ matchId }: PostMatchReportProps) {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState<any>(null);

  // Generate report mutation
  const generateReport = trpc.liveMatch.generatePostMatchReport.useMutation({
    onSuccess: (data) => {
      setReport(data);
      setGenerating(false);
      toast({
        title: language === 'ar' ? 'تم إنشاء التقرير' : 'Report Generated',
        description: language === 'ar' ? 'تم إنشاء تقرير ما بعد المباراة بنجاح' : 'Post-match report generated successfully',
      });
    },
    onError: () => {
      setGenerating(false);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في إنشاء التقرير' : 'Failed to generate report',
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = () => {
    setGenerating(true);
    generateReport.mutate({ matchId });
  };

  const handleDownloadPDF = () => {
    toast({
      title: language === 'ar' ? 'قريباً' : 'Coming Soon',
      description: language === 'ar' ? 'سيتم إضافة تصدير PDF قريباً' : 'PDF export will be added soon',
    });
  };

  const handleEmailReport = () => {
    toast({
      title: language === 'ar' ? 'قريباً' : 'Coming Soon',
      description: language === 'ar' ? 'سيتم إضافة إرسال البريد الإلكتروني قريباً' : 'Email delivery will be added soon',
    });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h3 className="text-lg font-bold">
              {language === 'ar' ? 'تقرير ما بعد المباراة' : 'Post-Match Report'}
            </h3>
          </div>
          
          {!report && (
            <Button
              onClick={handleGenerate}
              disabled={generating}
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {language === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'إنشاء تقرير' : 'Generate Report'}
                </>
              )}
            </Button>
          )}

          {report && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تحميل PDF' : 'Download PDF'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleEmailReport}>
                <Mail className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'إرسال بالبريد' : 'Email Report'}
              </Button>
            </div>
          )}
        </div>

        {!report && !generating && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">
              {language === 'ar' 
                ? 'قم بإنشاء تقرير شامل لما بعد المباراة مع تحليل AI' 
                : 'Generate a comprehensive post-match report with AI analysis'}
            </p>
            <Button onClick={handleGenerate}>
              {language === 'ar' ? 'إنشاء التقرير الآن' : 'Generate Report Now'}
            </Button>
          </div>
        )}

        {generating && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">
              {language === 'ar' 
                ? 'الذكاء الاصطناعي يقوم بتحليل المباراة...' 
                : 'AI is analyzing the match...'}
            </p>
          </div>
        )}

        {report && (
          <div className="space-y-6">
            {/* Match Summary */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-5 w-5 text-green-700 dark:text-green-500" />
                <h4 className="font-semibold text-lg">
                  {language === 'ar' ? 'ملخص المباراة' : 'Match Summary'}
                </h4>
              </div>
              <Card className="p-4 bg-secondary/20">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <Streamdown>{report.matchSummary}</Streamdown>
                </div>
              </Card>
            </div>

            {/* Tactical Analysis */}
            <div>
              <h4 className="font-semibold text-lg mb-3">
                {language === 'ar' ? 'التحليل التكتيكي' : 'Tactical Analysis'}
              </h4>
              <Card className="p-4 bg-secondary/20">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <Streamdown>{report.tacticalAnalysis}</Streamdown>
                </div>
              </Card>
            </div>

            {/* Key Moments */}
            <div>
              <h4 className="font-semibold text-lg mb-3">
                {language === 'ar' ? 'اللحظات الحاسمة' : 'Key Moments'}
              </h4>
              <Card className="p-4 bg-secondary/20">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <Streamdown>{report.keyMoments}</Streamdown>
                </div>
              </Card>
            </div>

            {/* Player Performances */}
            <div>
              <h4 className="font-semibold text-lg mb-3">
                {language === 'ar' ? 'أداء اللاعبين' : 'Player Performances'}
              </h4>
              <Card className="p-4 bg-secondary/20">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <Streamdown>{report.playerPerformances}</Streamdown>
                </div>
              </Card>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-semibold text-lg mb-3">
                {language === 'ar' ? 'التوصيات' : 'Recommendations'}
              </h4>
              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <Streamdown>{report.recommendations}</Streamdown>
                </div>
              </Card>
            </div>

            {/* Regenerate Button */}
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                {language === 'ar' ? 'إعادة إنشاء التقرير' : 'Regenerate Report'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
