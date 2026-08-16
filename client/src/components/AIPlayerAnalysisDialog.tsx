import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Sparkles, Loader2, TrendingUp, AlertTriangle, Target } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AIPlayerAnalysisDialogProps {
  playerId: number;
  playerName: string;
}

export function AIPlayerAnalysisDialog({ playerId, playerName }: AIPlayerAnalysisDialogProps) {
  const [open, setOpen] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzePlayer = trpc.aiCoach.analyzePlayer.useMutation({
    onSuccess: (data) => {
      setAnalysis(data.analysis);
      setIsAnalyzing(false);
      toast.success("AI analysis complete!");
    },
    onError: (error) => {
      setIsAnalyzing(false);
      toast.error("Failed to analyze player: " + error.message);
    },
  });

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    analyzePlayer.mutate({ playerId });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen && !analysis) {
      // Auto-analyze when dialog opens
      handleAnalyze();
    }
  };

  // Parse analysis text to extract sections
  const parseAnalysis = (text: string) => {
    const sections = {
      strengths: [] as string[],
      weaknesses: [] as string[],
      recommendations: [] as string[],
      overview: "",
    };

    const lines = text.split('\n').filter(line => line.trim());
    let currentSection = 'overview';
    let overviewLines: string[] = [];

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (lower.includes('strength') || lower.includes('قوة')) {
        currentSection = 'strengths';
      } else if (lower.includes('weakness') || lower.includes('ضعف')) {
        currentSection = 'weaknesses';
      } else if (lower.includes('recommend') || lower.includes('توصي')) {
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

  const parsedAnalysis = analysis ? parseAnalysis(analysis) : null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Sparkles className="h-4 w-4" />
          AI Analysis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Player Analysis: {playerName}
          </DialogTitle>
          <DialogDescription>
            Comprehensive AI-powered performance analysis and recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Analyzing player performance data...</p>
              <p className="text-sm text-muted-foreground">This may take a few seconds</p>
            </div>
          )}

          {!isAnalyzing && !analysis && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Sparkles className="h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">Click the button below to start AI analysis</p>
              <Button onClick={handleAnalyze} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Analyze Player
              </Button>
            </div>
          )}

          {parsedAnalysis && (
            <div className="space-y-4">
              {/* Overview */}
              {parsedAnalysis.overview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {parsedAnalysis.overview}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Strengths */}
              {parsedAnalysis.strengths.length > 0 && (
                <Card className="border-green-500/20 bg-green-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-700 dark:text-green-500" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {parsedAnalysis.strengths.map((strength, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5 bg-green-500/10 text-green-700 border-green-500/20">
                            ✓
                          </Badge>
                          <span className="text-sm flex-1">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Weaknesses */}
              {parsedAnalysis.weaknesses.length > 0 && (
                <Card className="border-orange-500/20 bg-orange-500/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-700 dark:text-orange-500" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {parsedAnalysis.weaknesses.map((weakness, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5 bg-orange-500/10 text-orange-700 border-orange-500/20">
                            !
                          </Badge>
                          <span className="text-sm flex-1">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {parsedAnalysis.recommendations.length > 0 && (
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {parsedAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5 bg-primary/10 text-primary border-primary/20">
                            {idx + 1}
                          </Badge>
                          <span className="text-sm flex-1">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Fallback: Show raw analysis if parsing failed */}
              {!parsedAnalysis.overview && 
               parsedAnalysis.strengths.length === 0 && 
               parsedAnalysis.weaknesses.length === 0 && 
               parsedAnalysis.recommendations.length === 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap text-sm">{analysis}</pre>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Refresh button */}
              <div className="flex justify-center pt-2">
                <Button onClick={handleAnalyze} variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Re-analyze
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
