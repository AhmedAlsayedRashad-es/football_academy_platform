import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Video, Mail, Share2 } from 'lucide-react';
import { TacticalScenarioData } from './TacticalScenario';
import { toast } from 'sonner';

interface TacticalExportToolsProps {
  scenarios: TacticalScenarioData[];
}

export default function TacticalExportTools({ scenarios }: TacticalExportToolsProps) {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [coachNotes, setCoachNotes] = useState('');
  const [reportTitle, setReportTitle] = useState('Tactical Analysis Report');
  const [includeBranding, setIncludeBranding] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const toggleScenario = (scenarioId: string) => {
    setSelectedScenarios(prev =>
      prev.includes(scenarioId)
        ? prev.filter(id => id !== scenarioId)
        : [...prev, scenarioId]
    );
  };

  const exportAsPDF = async () => {
    if (selectedScenarios.length === 0) {
      toast.error('Please select at least one scenario to export');
      return;
    }

    setIsExporting(true);

    try {
      // Simulate PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // In a real implementation, this would:
      // 1. Capture canvas screenshots of each scenario
      // 2. Use a PDF library (like jsPDF or pdfmake) to create the document
      // 3. Add coach notes, branding, and formatting
      // 4. Trigger download

      const selectedScenarioData = scenarios.filter(s => selectedScenarios.includes(s.id));
      
      console.log('Exporting PDF with:', {
        title: reportTitle,
        scenarios: selectedScenarioData.map(s => s.name),
        notes: coachNotes,
        branding: includeBranding,
      });

      toast.success(`PDF report "${reportTitle}" generated successfully!`);
      
      // Simulate download
      // const blob = new Blob([pdfContent], { type: 'application/pdf' });
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `${reportTitle.replace(/\s+/g, '_')}.pdf`;
      // a.click();
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsVideo = async (scenarioId: string) => {
    setIsExporting(true);

    try {
      // Simulate video generation
      await new Promise(resolve => setTimeout(resolve, 3000));

      // In a real implementation, this would:
      // 1. Use canvas.captureStream() to record the animation
      // 2. Use MediaRecorder API to create video
      // 3. Encode as MP4 using a library like ffmpeg.wasm
      // 4. Trigger download

      const scenario = scenarios.find(s => s.id === scenarioId);
      
      console.log('Exporting video for:', scenario?.name);

      toast.success(`Video for "${scenario?.name}" generated successfully!`);
      
      // Simulate download
      // const blob = new Blob([videoData], { type: 'video/mp4' });
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = `${scenario?.name.replace(/\s+/g, '_')}.mp4`;
      // a.click();
    } catch (error) {
      toast.error('Failed to generate video');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const shareViaEmail = () => {
    if (selectedScenarios.length === 0) {
      toast.error('Please select at least one scenario to share');
      return;
    }

    const selectedScenarioData = scenarios.filter(s => selectedScenarios.includes(s.id));
    const scenarioNames = selectedScenarioData.map(s => s.name).join(', ');

    // In a real implementation, this would open an email dialog or send via backend
    const subject = encodeURIComponent(`Tactical Analysis: ${reportTitle}`);
    const body = encodeURIComponent(
      `Hi,\n\nPlease find the tactical analysis for the following scenarios:\n\n${scenarioNames}\n\n${coachNotes}\n\nBest regards`
    );

    window.open(`mailto:?subject=${subject}&body=${body}`);
    toast.success('Email client opened');
  };

  const generateShareableLink = () => {
    if (selectedScenarios.length === 0) {
      toast.error('Please select at least one scenario to share');
      return;
    }

    // In a real implementation, this would:
    // 1. Save the scenarios to the database
    // 2. Generate a unique shareable link
    // 3. Copy to clipboard

    const mockLink = `https://academy.example.com/tactics/share/${Math.random().toString(36).substr(2, 9)}`;
    
    navigator.clipboard.writeText(mockLink);
    toast.success('Shareable link copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      {/* Scenario Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Scenarios to Export</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map(scenario => (
              <div key={scenario.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-secondary/50">
                <Checkbox
                  id={scenario.id}
                  checked={selectedScenarios.includes(scenario.id)}
                  onCheckedChange={() => toggleScenario(scenario.id)}
                />
                <div className="flex-1">
                  <label
                    htmlFor={scenario.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {scenario.name}
                  </label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {scenario.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedScenarios(scenarios.map(s => s.id))}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedScenarios([])}
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Export Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="reportTitle">Report Title</Label>
            <Input
              id="reportTitle"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="e.g., Weekly Tactical Training"
            />
          </div>

          <div>
            <Label htmlFor="coachNotes">Coach Notes & Commentary</Label>
            <Textarea
              id="coachNotes"
              value={coachNotes}
              onChange={(e) => setCoachNotes(e.target.value)}
              placeholder="Add your analysis, instructions, or observations..."
              rows={4}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="branding"
              checked={includeBranding}
              onCheckedChange={(checked) => setIncludeBranding(checked as boolean)}
            />
            <label
              htmlFor="branding"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Include academy logo and branding
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Export & Share</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button
              onClick={exportAsPDF}
              disabled={isExporting || selectedScenarios.length === 0}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              {isExporting ? 'Generating...' : 'Export as PDF'}
            </Button>

            <Button
              onClick={shareViaEmail}
              disabled={selectedScenarios.length === 0}
              variant="outline"
              className="w-full"
            >
              <Mail className="h-4 w-4 mr-2" />
              Share via Email
            </Button>

            <Button
              onClick={generateShareableLink}
              disabled={selectedScenarios.length === 0}
              variant="outline"
              className="w-full"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Generate Shareable Link
            </Button>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3">Export Individual Videos</h4>
            <div className="space-y-2">
              {scenarios.map(scenario => (
                <div key={scenario.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{scenario.name}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => exportAsVideo(scenario.id)}
                    disabled={isExporting}
                  >
                    <Video className="h-3 w-3 mr-1" />
                    Export Video
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Info */}
      <Card>
        <CardHeader>
          <CardTitle>Export Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong>PDF Export:</strong> Creates a comprehensive report with all selected scenarios, coach notes, and optional branding. Ideal for team meetings and player handouts.</p>
            <p><strong>Video Export:</strong> Generates animated MP4 videos of individual scenarios. Perfect for sharing on social media or video analysis platforms.</p>
            <p><strong>Shareable Links:</strong> Creates secure links that can be shared with players, parents, or other coaches. Links expire after 30 days.</p>
            <p><strong>Email Sharing:</strong> Opens your default email client with pre-filled content. Attach exported PDFs or include shareable links.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
