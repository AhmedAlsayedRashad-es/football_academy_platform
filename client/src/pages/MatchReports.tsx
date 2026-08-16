import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Calendar,
  TrendingUp,
  Target,
  Users,
  Activity,
  Award,
  Clock,
  MapPin,
  Plus,
  ArrowLeft,
  Download,
  Brain,
  Loader2,
  Trophy,
  Swords,
  BarChart3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';

export default function MatchReports() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { toast } = useToast();

  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [generatedReport, setGeneratedReport] = useState<string | null>(null);
  const [matchInfo, setMatchInfo] = useState<any>(null);
  const [filterTeam, setFilterTeam] = useState<string>('all');

  // Fetch all matches
  const { data: matches = [], isLoading: matchesLoading } = trpc.matches.getAll.useQuery(undefined);

  // Fetch teams for filter
  const { data: teams = [] } = trpc.teams.getAll.useQuery(undefined);

  // AI report generation
  const generateReport = trpc.matchReports.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedReport(data.report);
      setMatchInfo(data.matchInfo);
      toast({ 
        title: isRTL ? 'تم إنشاء التقرير ✓' : 'Report Generated ✓',
        description: isRTL ? 'تم تحليل المباراة بالذكاء الاصطناعي' : 'AI match analysis complete'
      });
    },
    onError: (err) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const handleGenerateReport = () => {
    if (!selectedMatchId) {
      toast({ title: isRTL ? 'اختر مباراة أولاً' : 'Select a match first', variant: 'destructive' });
      return;
    }
    setGeneratedReport(null);
    generateReport.mutate({ matchId: selectedMatchId });
  };

  const handleExportPDF = () => {
    if (!generatedReport) return;
    const blob = new Blob([generatedReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `match-report-${matchInfo?.opponent || 'unknown'}-${matchInfo?.date || 'date'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: isRTL ? 'تم التصدير ✓' : 'Exported ✓' });
  };

  const selectedMatch = (matches as any[]).find((m: any) => m.id === selectedMatchId);

  const filteredMatches = filterTeam === 'all' 
    ? (matches as any[]) 
    : (matches as any[]).filter((m: any) => m.teamId === parseInt(filterTeam));

  const getResultBadge = (result: string) => {
    const map: Record<string, { label: string; labelAr: string; className: string }> = {
      win: { label: 'Win', labelAr: 'فوز', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
      draw: { label: 'Draw', labelAr: 'تعادل', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
      loss: { label: 'Loss', labelAr: 'خسارة', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
    };
    const r = map[result] || { label: result, labelAr: result, className: 'bg-gray-100 text-gray-700' };
    return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${r.className}`}>{isRTL ? r.labelAr : r.label}</span>;
  };

  return (
    <>
      <div className="p-4 md:p-6 max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/analytics')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              {isRTL ? 'تقارير المباريات' : 'Match Reports'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isRTL ? 'تحليل شامل للمباريات بالذكاء الاصطناعي' : 'Comprehensive AI-powered match analysis'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Match Selector */}
          <div className="lg:col-span-1 space-y-4">
            {/* Filter */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Swords className="w-4 h-4 text-primary" />
                  {isRTL ? 'اختر مباراة' : 'Select Match'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Team filter */}
                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder={isRTL ? 'كل الفرق' : 'All Teams'} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{isRTL ? 'كل الفرق' : 'All Teams'}</SelectItem>
                    {(teams as any[]).map((team: any) => (
                      <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Match list */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {matchesLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />)}
                    </div>
                  ) : filteredMatches.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Swords className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      {isRTL ? 'لا توجد مباريات' : 'No matches found'}
                    </div>
                  ) : (
                    filteredMatches.map((match: any) => (
                      <button
                        key={match.id}
                        onClick={() => { setSelectedMatchId(match.id); setGeneratedReport(null); }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedMatchId === match.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          {match.result ? getResultBadge(match.result) : (
                            <span className="text-xs text-muted-foreground">{isRTL ? 'لم تُلعب' : 'Not played'}</span>
                          )}
                          <span className="text-sm font-bold">
                            {match.teamScore !== null && match.opponentScore !== null 
                              ? `${match.teamScore}-${match.opponentScore}` 
                              : '-'}
                          </span>
                        </div>
                        <div className="font-medium text-sm truncate">
                          {isRTL ? 'ضد' : 'vs'} {match.opponent || (isRTL ? 'منافس' : 'Opponent')}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          <Calendar className="w-3 h-3" />
                          {match.matchDate ? new Date(match.matchDate).toLocaleDateString() : '-'}
                          {match.matchType && (
                            <Badge variant="outline" className="text-xs py-0 px-1">{match.matchType}</Badge>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Generate button */}
            {selectedMatchId && (
              <Button
                className="w-full gap-2"
                onClick={handleGenerateReport}
                disabled={generateReport.isPending}
              >
                {generateReport.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                {isRTL ? 'إنشاء تقرير ذكي' : 'Generate AI Report'}
              </Button>
            )}

            {/* Stats summary for selected match */}
            {selectedMatch && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{isRTL ? 'ملخص المباراة' : 'Match Summary'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isRTL ? 'المنافس' : 'Opponent'}</span>
                    <span className="font-medium">{selectedMatch.opponent || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isRTL ? 'النتيجة' : 'Result'}</span>
                    <span>{selectedMatch.result ? getResultBadge(selectedMatch.result) : '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isRTL ? 'النوع' : 'Type'}</span>
                    <span className="font-medium capitalize">{selectedMatch.matchType || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isRTL ? 'الملعب' : 'Venue'}</span>
                    <span className="font-medium">{selectedMatch.venue || (selectedMatch.isHome ? 'Home' : 'Away')}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Report Display */}
          <div className="lg:col-span-2">
            {!selectedMatchId ? (
              <Card className="h-full flex items-center justify-center min-h-64">
                <div className="text-center text-muted-foreground p-8">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">{isRTL ? 'اختر مباراة من القائمة' : 'Select a match from the list'}</p>
                  <p className="text-sm mt-1">{isRTL ? 'ثم اضغط "إنشاء تقرير ذكي"' : 'Then click "Generate AI Report"'}</p>
                </div>
              </Card>
            ) : generateReport.isPending ? (
              <Card className="h-full flex items-center justify-center min-h-64">
                <div className="text-center p-8">
                  <Loader2 className="w-12 h-12 mx-auto mb-3 animate-spin text-primary" />
                  <p className="font-medium">{isRTL ? 'جاري تحليل المباراة...' : 'Analyzing match...'}</p>
                  <p className="text-sm text-muted-foreground mt-1">{isRTL ? 'الذكاء الاصطناعي يراجع البيانات' : 'AI is reviewing match data'}</p>
                </div>
              </Card>
            ) : generatedReport ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-primary" />
                      {isRTL ? 'تقرير المباراة الذكي' : 'AI Match Report'}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleExportPDF}>
                        <Download className="w-4 h-4 mr-1" />
                        {isRTL ? 'تصدير' : 'Export'}
                      </Button>
                    </div>
                  </div>
                  {matchInfo && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center gap-1">
                        <Swords className="w-3 h-3" />
                        {isRTL ? 'ضد' : 'vs'} {matchInfo.opponent}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {matchInfo.date ? new Date(matchInfo.date).toLocaleDateString() : '-'}
                      </span>
                      {matchInfo.result && getResultBadge(matchInfo.result)}
                      <span className="font-bold">{matchInfo.score}</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 rounded-lg p-4 border">
                      {generatedReport}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-full flex items-center justify-center min-h-64">
                <div className="text-center text-muted-foreground p-8">
                  <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">
                    {isRTL ? 'مباراة محددة' : 'Match selected'}
                  </p>
                  <p className="text-sm mt-1">
                    {isRTL ? 'اضغط "إنشاء تقرير ذكي" لتحليل المباراة' : 'Click "Generate AI Report" to analyze this match'}
                  </p>
                  <Button className="mt-4 gap-2" onClick={handleGenerateReport}>
                    <Brain className="w-4 h-4" />
                    {isRTL ? 'إنشاء تقرير ذكي' : 'Generate AI Report'}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
