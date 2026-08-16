import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { FileText, Loader2, Download, Sparkles, TrendingUp, Users, Target, Award, ArrowLeft} from 'lucide-react';
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import jsPDF from 'jspdf';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MatchReportGenerator() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null);
  const [report, setReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: matches, isLoading: matchesLoading } = trpc.matches.getAll.useQuery();

  const generateReport = trpc.matchReports.generate.useMutation({
    onSuccess: (data) => {
      setReport(data.report);
      setIsGenerating(false);
      toast.success("Match report generated successfully!");
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error("Failed to generate report: " + error.message);
    },
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) {
    setLocation("/");
    return null;
  }

  const handleGenerate = () => {
    if (!selectedMatchId) {
      toast.error("Please select a match");
      return;
    }
    setIsGenerating(true);
    setReport(null);
    generateReport.mutate({ matchId: selectedMatchId });
  };

  const handleExportPDF = () => {
    if (!report) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = margin;

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Match Report', margin, yPosition);
    yPosition += 15;

    // Date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, margin, yPosition);
    yPosition += 10;

    // Divider
    doc.setLineWidth(0.5);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;

    // Content
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(report, maxWidth);
    
    for (const line of lines) {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 7;
    }

    doc.save(`match-report-${selectedMatchId}-${Date.now()}.pdf`);
    toast.success("PDF exported successfully!");
  };

  // Parse report sections
  const parseReport = (text: string) => {
    const sections = {
      overview: "",
      keyMoments: [] as string[],
      playerRatings: [] as string[],
      tacticalAnalysis: [] as string[],
      recommendations: [] as string[],
    };

    const lines = text.split('\n').filter(line => line.trim());
    let currentSection = 'overview';
    let overviewLines: string[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('key moment') || lower.includes('highlight')) {
        currentSection = 'keyMoments';
      } else if (lower.includes('player rating') || lower.includes('performance')) {
        currentSection = 'playerRatings';
      } else if (lower.includes('tactical') || lower.includes('strategy')) {
        currentSection = 'tacticalAnalysis';
      } else if (lower.includes('recommend') || lower.includes('suggestion')) {
        currentSection = 'recommendations';
      } else if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        const content = line.replace(/^[-•]\s*/, '').trim();
        if (content && currentSection !== 'overview') {
          // `overview` is a string while the rest are arrays, so narrow before pushing.
          const bucket = sections[currentSection as keyof typeof sections];
          if (Array.isArray(bucket)) bucket.push(content);
        }
      } else if (currentSection === 'overview' && line.trim()) {
        overviewLines.push(line.trim());
      }
    }

    sections.overview = overviewLines.join(' ');
    return sections;
  };

  const parsedReport = report ? parseReport(report) : null;
  const selectedMatch = matches?.find(m => m.id === selectedMatchId);

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          
          <button onClick={() => navigate("/match-reports")} className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">

            <ArrowLeft className="w-5 h-5" />

          </button>
<h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            Match Report Generator
          </h1>
          <p className="text-muted-foreground mt-2">
            Generate comprehensive AI-powered match reports with analysis and insights
          </p>
        </div>

        {/* Match Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Match</CardTitle>
            <CardDescription>Choose a match to generate a detailed report</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <Select
                  value={selectedMatchId?.toString() || ""}
                  onValueChange={(value) => setSelectedMatchId(parseInt(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a match" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    {matchesLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading matches...
                      </SelectItem>
                    ) : matches && matches.length > 0 ? (
                      matches.map((match) => (
                        <SelectItem key={match.id} value={match.id.toString()}>
                          {match.opponent} - {new Date(match.matchDate).toLocaleDateString()} 
                          {match.result && ` (${match.result})`}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No matches available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={handleGenerate} 
                disabled={!selectedMatchId || isGenerating}
                className="gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>

            {selectedMatch && (
              <div className="flex gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{selectedMatch.matchType}</Badge>
                <Badge variant="outline">{selectedMatch.venue}</Badge>
                {selectedMatch.result && (
                  <Badge variant={selectedMatch.result === 'win' ? 'default' : selectedMatch.result === 'loss' ? 'destructive' : 'secondary'}>
                    {selectedMatch.result}
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isGenerating && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing match data and generating report...</p>
              <p className="text-sm text-muted-foreground">This may take a few moments</p>
            </CardContent>
          </Card>
        )}

        {/* Report Display */}
        {parsedReport && !isGenerating && (
          <div className="space-y-4">
            {/* Export Button */}
            <div className="flex justify-end">
              <Button onClick={handleExportPDF} variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>

            {/* Overview */}
            {parsedReport.overview && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Match Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {parsedReport.overview}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Key Moments */}
            {parsedReport.keyMoments.length > 0 && (
              <Card className="border-blue-500/20 bg-blue-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    Key Moments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {parsedReport.keyMoments.map((moment, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 bg-blue-500/10 text-blue-700 border-blue-500/20">
                          {idx + 1}
                        </Badge>
                        <span className="text-sm flex-1">{moment}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Player Ratings */}
            {parsedReport.playerRatings.length > 0 && (
              <Card className="border-green-500/20 bg-green-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-green-700 dark:text-green-500" />
                    Player Ratings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {parsedReport.playerRatings.map((rating, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 bg-green-500/10 text-green-700 border-green-500/20">
                          ★
                        </Badge>
                        <span className="text-sm flex-1">{rating}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Tactical Analysis */}
            {parsedReport.tacticalAnalysis.length > 0 && (
              <Card className="border-purple-500/20 bg-purple-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-500" />
                    Tactical Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {parsedReport.tacticalAnalysis.map((analysis, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 bg-purple-500/10 text-purple-700 border-purple-500/20">
                          ⚡
                        </Badge>
                        <span className="text-sm flex-1">{analysis}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {parsedReport.recommendations.length > 0 && (
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-700 dark:text-orange-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {parsedReport.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Badge variant="outline" className="mt-0.5 bg-orange-500/10 text-orange-700 border-orange-500/20">
                          {idx + 1}
                        </Badge>
                        <span className="text-sm flex-1">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Fallback: Show raw report if parsing failed */}
            {!parsedReport.overview && 
             parsedReport.keyMoments.length === 0 && 
             parsedReport.playerRatings.length === 0 && 
             parsedReport.tacticalAnalysis.length === 0 && 
             parsedReport.recommendations.length === 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Match Report</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap text-sm">{report}</pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {!report && !isGenerating && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <div className="text-center space-y-2">
                <p className="text-lg font-semibold">No Report Generated Yet</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Select a match from the dropdown above and click "Generate Report" to create 
                  a comprehensive AI-powered analysis with key moments, player ratings, and tactical insights.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
