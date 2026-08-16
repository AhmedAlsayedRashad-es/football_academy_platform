import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MatchEventRecorder } from "@/components/MatchEventRecorder";
import { FourPhasesAnalysis } from "@/components/FourPhasesAnalysis";
import { RealTimeStatsPanel } from "@/components/RealTimeStatsPanel";
import { SessionManager } from "@/components/SessionManager";
import { HeatmapVisualization } from "@/components/HeatmapVisualization";
import { AnimatedSequencePlayer } from "@/components/AnimatedSequencePlayer";
import { GitCompare } from "lucide-react";
import { ArrowLeft, Save, Upload, Sparkles, Download, FileUp } from "lucide-react";
import { Link } from "wouter";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { exportEventsToCSV, downloadCSV, readCSVFile, importEventsFromCSV, convertCSVToInternalFormat, validateCSV } from "@/lib/csvUtils";
import { useLanguage } from '@/contexts/LanguageContext';

export default function MatchEventRecording() {
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const [events, setEvents] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (authLoading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return null;
  }

  const handleSaveEvents = async () => {
    if (events.length === 0) {
      toast.error("No events to save");
      return;
    }
    setIsSaving(true);
    try {
      // Export events to CSV file for download/archiving
      const csvContent = exportEventsToCSV(events, {
        homeTeam: "Future Stars Academy",
        awayTeam: "Opponent Team",
        date: new Date().toISOString(),
      });
      const filename = `match_events_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
      toast.success(`Saved and exported ${events.length} events to CSV`);
    } catch (error) {
      toast.error("Failed to save events");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoDetect = async () => {
    toast.info("Video auto-detection feature coming soon! Upload a match video to automatically detect all events.");
  };

  const handleExportCSV = () => {
    if (events.length === 0) {
      toast.error("No events to export");
      return;
    }

    try {
      const csvContent = exportEventsToCSV(events, {
        homeTeam: "Future Stars Academy",
        awayTeam: "Opponent Team",
        date: new Date().toISOString(),
      });
      
      const filename = `match_events_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csvContent, filename);
      
      toast.success(`Exported ${events.length} events to CSV`);
    } catch (error) {
      toast.error("Failed to export CSV");
      console.error(error);
    }
  };

  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please select a CSV file");
      return;
    }

    try {
      const csvContent = await readCSVFile(file);
      
      // Validate CSV
      const validation = validateCSV(csvContent);
      if (!validation.valid) {
        toast.error(`CSV validation failed: ${validation.errors[0]}`);
        console.error("Validation errors:", validation.errors);
        return;
      }

      // Parse and convert events
      const csvEvents = importEventsFromCSV(csvContent);
      const internalEvents = convertCSVToInternalFormat(csvEvents);
      
      setEvents(internalEvents);
      toast.success(`Imported ${internalEvents.length} events from CSV`);
    } catch (error) {
      toast.error("Failed to import CSV");
      console.error(error);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const calculateSummary = () => {
    const shots = events.filter(e => e.type === "shot");
    const passes = events.filter(e => e.type === "pass");
    const defensive = events.filter(e => e.type === "defensive");
    
    const goals = shots.filter(s => s.outcome === "goal").length;
    const totalXG = shots.reduce((sum, s) => sum + (s.xG || 0), 0);
    const completedPasses = passes.filter(p => p.completed).length;
    const passAccuracy = passes.length > 0 ? (completedPasses / passes.length) * 100 : 0;

    return {
      shots: shots.length,
      goals,
      totalXG: totalXG.toFixed(2),
      passes: passes.length,
      passAccuracy: passAccuracy.toFixed(1),
      defensiveActions: defensive.length,
    };
  };

  const summary = calculateSummary();

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/matches">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Match Event Recording</h1>
              <p className="text-muted-foreground">
                Record shots, passes, and defensive actions to generate xG analytics
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <SessionManager 
              events={events}
              onLoadSession={(loadedEvents) => setEvents(loadedEvents)}
            />
            <Link href="/coach/player-comparison">
              <Button variant="outline">
                <GitCompare className="h-4 w-4 mr-2" />
                Compare Sessions
              </Button>
            </Link>
            <Button variant="outline" onClick={handleImportCSV}>
              <FileUp className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={handleExportCSV} disabled={events.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline" onClick={handleAutoDetect}>
              <Sparkles className="h-4 w-4 mr-2" />
              Auto-Detect
            </Button>
            <Button onClick={handleSaveEvents} disabled={events.length === 0 || isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Events"}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Summary Stats */}
        {events.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Shots</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.shots}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{summary.goals}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total xG</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalXG}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Passes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.passes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pass Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.passAccuracy}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Defensive</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.defensiveActions}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Card */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-100">How to Use</CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300">
              Follow these steps to record match events and generate xG analytics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">1</Badge>
              <p>Select the event type you want to record (Shot, Pass, or Defensive Action)</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">2</Badge>
              <p>Configure the event details (outcome, body part, completion status, etc.)</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">3</Badge>
              <p>Click "Start Recording" and then click on the pitch where the event occurred</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">4</Badge>
              <p>For passes, click twice: once for start position, once for end position</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">5</Badge>
              <p>Review your recorded events in the list below the pitch</p>
            </div>
            <div className="flex items-start gap-2">
              <Badge variant="secondary" className="mt-0.5">6</Badge>
              <p>Click "Save Events" to store the data and view it in xG Analytics Dashboard</p>
            </div>
          </CardContent>
        </Card>

        {/* Real-Time Statistics Panel */}
        {events.length > 0 && (
          <RealTimeStatsPanel events={events} />
        )}

        {/* Event Recorder */}
        <MatchEventRecorder onEventsChange={setEvents} />

               {/* Animated Sequence Player */}
        {events.length > 0 && <AnimatedSequencePlayer events={events} />}

        {/* Heatmap Visualization */}
        {events.length > 0 && <HeatmapVisualization events={events} />}

        {/* Four Phases Analysis */}
        {events.length > 0 && <FourPhasesAnalysis events={events} />}

        {/* Next Steps */}
        {events.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>What's Next?</CardTitle>
              <CardDescription>
                After saving your events, you can view detailed analytics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">xG Analytics Dashboard</p>
                  <p className="text-sm text-muted-foreground">View shot maps, pass maps, and player statistics</p>
                </div>
                <Link href="/xg-analytics">
                  <Button variant="outline">View Analytics</Button>
                </Link>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Match Management</p>
                  <p className="text-sm text-muted-foreground">Link events to specific matches and track performance</p>
                </div>
                <Link href="/matches">
                  <Button variant="outline">Go to Matches</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
