import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Upload, 
  Video, 
  Brain,
  Target,
  TrendingUp,
  TrendingDown,
  Users,
  Zap,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';

interface VideoAnalysisResult {
  formation: string;
  playingStyle: string;
  strengths: string[];
  weaknesses: string[];
  keyPlayers: Array<{
    number: number;
    position: string;
    threat: 'high' | 'medium' | 'low';
    description: string;
  }>;
  tacticalPatterns: string[];
  recommendations: string[];
}

export default function OpponentVideoAnalysis() {
  const { t, language } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showJerseyDialog, setShowJerseyDialog] = useState(false);
  const [jerseyColor, setJerseyColor] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const analyzeVideoMutation = trpc.analysis.analyzeOpponentVideo.useMutation();
  const [, navigate] = useLocation();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        toast.error('File size must be less than 500MB');
        return;
      }
      setSelectedFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      toast.success('Video loaded successfully');
    }
  };

  const handleAnalyzeClick = () => {
    if (!selectedFile) {
      toast.error('Please select a video file first');
      return;
    }
    setShowJerseyDialog(true);
  };

  const handleAnalyze = async () => {
    setShowJerseyDialog(false);
    setIsAnalyzing(true);
    setUploadProgress(0);

    try {
      // Upload video
      if (!selectedFile) {
        toast.error('Please select a video file');
        return;
      }
      
      const formData = new FormData();
      formData.append('video', selectedFile);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            resolve(response.videoUrl);
          } else {
            reject(new Error('Upload failed'));
          }
        });
        xhr.addEventListener('error', () => reject(new Error('Upload failed')));
        xhr.open('POST', '/api/upload-video');
        xhr.send(formData);
      });

      const videoUrl = await uploadPromise;
      toast.success('Video uploaded, analyzing...');

      // Analyze with AI
      const result = await analyzeVideoMutation.mutateAsync({ 
        videoUrl,
        opponentJerseyColor: jerseyColor || undefined
      });
      
      setAnalysisResult(result as VideoAnalysisResult);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Failed to analyze video');
    } finally {
      setIsAnalyzing(false);
      setUploadProgress(0);
    }
  };

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <>
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <button onClick={() => navigate('/video-analysis')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> Back to Video Analysis
          </button>
          <h1 className="text-4xl font-bold text-gray-900">Opponent Video Analysis</h1>
          <p className="text-gray-600 mt-2">تحليل فيديو الفريق المنافس بالذكاء الاصطناعي</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Upload & Preview */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Upload Opponent Match Video
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {!videoUrl ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <Button
                        onClick={() => fileInputRef.current?.click()}
                        className="mb-2"
                      >
                        Select Video File
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        Upload a match video of your opponent (Max 500MB)
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supported formats: MP4, MOV, AVI, WebM
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <video
                      ref={videoRef}
                      src={videoUrl}
                      controls
                      className="w-full rounded-lg"
                      style={{ maxHeight: '400px' }}
                    />
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Change Video
                      </Button>
                      <Button
                        onClick={handleAnalyzeClick}
                        disabled={isAnalyzing}
                        className="min-w-32"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Brain className="h-4 w-4 mr-2" />
                            Analyze with AI
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {isAnalyzing && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading video...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Analysis Progress */}
              {isAnalyzing && uploadProgress === 100 && (
                <div className="flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  <span className="text-blue-600 font-medium">
                    AI is analyzing the video... This may take 1-2 minutes
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Formation Detection</div>
                  <div className="text-xs text-muted-foreground">Identify opponent's formation</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Strengths Analysis</div>
                  <div className="text-xs text-muted-foreground">Find what they do well</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Weakness Detection</div>
                  <div className="text-xs text-muted-foreground">Exploit their vulnerabilities</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center shrink-0">
                  <Target className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Key Players</div>
                  <div className="text-xs text-muted-foreground">Identify dangerous players</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-sm">Tactical Patterns</div>
                  <div className="text-xs text-muted-foreground">Understand their play style</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Formation & Playing Style */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Formation & Playing Style
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Formation</div>
                  <div className="text-2xl font-bold text-blue-600">{analysisResult.formation}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Playing Style</div>
                  <div className="text-lg font-semibold">{analysisResult.playingStyle}</div>
                </div>
              </CardContent>
            </Card>

            {/* Strengths */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Strengths
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.strengths.map((strength, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      <span className="text-sm">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Weaknesses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                  Weaknesses to Exploit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysisResult.weaknesses.map((weakness, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                      <span className="text-sm">{weakness}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Key Players */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-yellow-600" />
                  Key Players to Watch
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.keyPlayers.map((player, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {player.number}
                          </div>
                          <div>
                            <div className="font-semibold text-sm">{player.position}</div>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getThreatColor(player.threat)}`}>
                          {player.threat.toUpperCase()} THREAT
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{player.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Tactical Patterns */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Tactical Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysisResult.tacticalPatterns.map((pattern, idx) => (
                    <li key={idx} className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg">
                      <Zap className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
                      <span className="text-sm">{pattern}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Tactical Recommendations */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Tactical Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {analysisResult.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Use in Tactical Simulation Button */}
            <Card className="lg:col-span-2 border-2 border-blue-300 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Ready to Plan Your Strategy?</h3>
                    <p className="text-sm text-gray-600">
                      Transfer this analysis to Tactical Simulation Lab to create your match plan
                    </p>
                  </div>
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      // Store analysis in sessionStorage for cross-page access
                      sessionStorage.setItem('opponentAnalysis', JSON.stringify(analysisResult));
                      toast.success('Analysis transferred! Redirecting to Tactical Simulation...');
                      setTimeout(() => {
                        navigate('/tactical-simulation');
                      }, 1000);
                    }}
                  >
                    <Target className="h-5 w-5 mr-2" />
                    Use in Tactical Simulation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Jersey Color Dialog */}
      <Dialog open={showJerseyDialog} onOpenChange={setShowJerseyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Opponent Team Jersey Color</DialogTitle>
            <DialogDescription>
              ما هو لون قميص الفريق المنافس؟ (اختياري - يساعد على تحديد الفريق بدقة)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="jersey-color">Jersey Color / لون القميص</Label>
              <Input
                id="jersey-color"
                placeholder="e.g., Red, Blue, Yellow, Green..."
                value={jerseyColor}
                onChange={(e) => setJerseyColor(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Examples: Red, Blue, Yellow, Green, White, Black, Orange, Purple
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowJerseyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAnalyze}>
              Start Analysis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
