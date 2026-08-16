import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { trpc } from "@/lib/trpc";
import { Upload, Video, TrendingUp, Award, Target, ArrowLeft, User, MapPin, Star, Plus, X, ExternalLink, Play } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from 'wouter';
import { Badge } from "@/components/ui/badge";
import { BackButton } from '@/components/BackButton';

function getYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url);
  if (!id) return null;
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export default function ScoutNetwork() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { language } = useLanguage();
  const [playerName, setPlayerName] = useState("");
  const [playerAge, setPlayerAge] = useState("");
  const [playerPosition, setPlayerPosition] = useState("");
  const [currentClub, setCurrentClub] = useState("");
  const [location, setLocation] = useState("");
  const [videoUrls, setVideoUrls] = useState<string[]>([""]);
  const [analyzing, setAnalyzing] = useState(false);
  const [reportResult, setReportResult] = useState<any>(null);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);

  const createReport = trpc.scoutNetwork.createReport.useMutation();
  const { data: reports, refetch } = trpc.scoutNetwork.getReports.useQuery({});

  const positions = ["GK", "CB", "LB", "RB", "CDM", "CM", "CAM", "LW", "RW", "ST", "CF"];

  const addVideoUrl = () => {
    if (videoUrls.length < 5) {
      setVideoUrls([...videoUrls, ""]);
    }
  };

  const removeVideoUrl = (index: number) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  };

  const updateVideoUrl = (index: number, value: string) => {
    const updated = [...videoUrls];
    updated[index] = value;
    setVideoUrls(updated);
  };

  const handleAnalyze = async () => {
    if (!playerName.trim()) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: language === 'ar' ? "يرجى إدخال اسم اللاعب" : "Please enter player name",
        variant: "destructive",
      });
      return;
    }

    const validUrls = videoUrls.filter(u => u.trim());
    const primaryVideoUrl = validUrls[0] || undefined;

    setAnalyzing(true);
    try {
      const report = await createReport.mutateAsync({
        playerName,
        playerAge: playerAge ? parseInt(playerAge) : undefined,
        playerPosition: playerPosition || undefined,
        currentClub: currentClub || undefined,
        location: location || undefined,
        videoUrl: primaryVideoUrl,
      });
      setReportResult(report);
      toast({
        title: language === 'ar' ? "نجح" : "Success",
        description: language === 'ar' ? "تم إنشاء التقرير الكشفي بنجاح" : `Scout report created successfully${validUrls.length > 1 ? ` (${validUrls.length} videos analyzed)` : ''}`,
      });
      setPlayerName("");
      setPlayerAge("");
      setPlayerPosition("");
      setCurrentClub("");
      setLocation("");
      setVideoUrls([""]);
      refetch();
    } catch (error: any) {
      toast({
        title: language === 'ar' ? "خطأ" : "Error",
        description: error?.message || (language === 'ar' ? "فشل إنشاء التقرير" : "Failed to create report"),
        variant: "destructive",
      });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BackButton />
        <Video className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">
            {language === 'ar' ? 'شبكة الكشافة الذكية' : 'AI Scout Network'}
          </h1>
          <p className="text-muted-foreground">
            {language === 'ar' ? 'تحليل المواهب بالذكاء الاصطناعي عبر 20 مقياساً' : 'AI-powered talent identification across 20 metrics — submit up to 5 videos per player'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Report Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {language === 'ar' ? 'إنشاء تقرير كشفي' : 'Create Scout Report'}
            </CardTitle>
            <CardDescription>
              {language === 'ar'
                ? 'أدخل بيانات اللاعب لتحليل الموهبة بالذكاء الاصطناعي'
                : 'Enter player details and up to 5 video URLs for comprehensive AI talent analysis'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="playerName">
                {language === 'ar' ? 'اسم اللاعب *' : 'Player Name *'}
              </Label>
              <Input
                id="playerName"
                placeholder={language === 'ar' ? 'محمد أحمد' : 'John Smith'}
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="playerAge">{language === 'ar' ? 'العمر' : 'Age'}</Label>
                <Input
                  id="playerAge"
                  type="number"
                  placeholder="18"
                  min="8"
                  max="40"
                  value={playerAge}
                  onChange={(e) => setPlayerAge(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>{language === 'ar' ? 'المركز' : 'Position'}</Label>
                <Select value={playerPosition} onValueChange={setPlayerPosition}>
                  <SelectTrigger>
                    <SelectValue placeholder={language === 'ar' ? 'اختر مركزاً' : 'Select position'} />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(pos => (
                      <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentClub">{language === 'ar' ? 'النادي الحالي' : 'Current Club'}</Label>
              <Input
                id="currentClub"
                placeholder={language === 'ar' ? 'اسم النادي' : 'Club name'}
                value={currentClub}
                onChange={(e) => setCurrentClub(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{language === 'ar' ? 'الموقع' : 'Location'}</Label>
              <Input
                id="location"
                placeholder={language === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt'}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Multiple Video URLs */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{language === 'ar' ? 'روابط فيديو اللاعب (حتى 5 روابط)' : 'Player Video URLs (up to 5)'}</Label>
                {videoUrls.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addVideoUrl}
                    className="h-7 text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add Video
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {videoUrls.map((url, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 relative">
                        <Input
                          placeholder={`Video ${index + 1}: https://youtube.com/watch?v=...`}
                          value={url}
                          onChange={(e) => updateVideoUrl(index, e.target.value)}
                          className="pr-8"
                        />
                        {url && getYouTubeId(url) && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <Play className="w-4 h-4 text-green-700 dark:text-green-500" />
                          </div>
                        )}
                      </div>
                      {videoUrls.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVideoUrl(index)}
                          className="h-9 w-9 p-0 text-red-600 dark:text-red-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {/* YouTube thumbnail preview */}
                    {url && getYouTubeThumbnail(url) && (
                      <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <img
                          src={getYouTubeThumbnail(url)!}
                          alt="Video thumbnail"
                          className="w-16 h-9 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-green-700 dark:text-green-500 font-medium">✓ YouTube video detected</p>
                          <p className="text-xs text-muted-foreground truncate">{url}</p>
                        </div>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {language === 'ar'
                  ? 'أضف روابط يوتيوب أو فيميو أو روابط مباشرة لمقاطع الفيديو'
                  : 'Add YouTube, Vimeo, or direct video links. Multiple videos improve analysis accuracy.'}
              </p>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={analyzing || !playerName.trim()}
              className="w-full"
            >
              {analyzing
                ? (language === 'ar' ? 'جاري التحليل بالذكاء الاصطناعي...' : 'AI Analyzing...')
                : (language === 'ar' ? 'إنشاء تقرير كشفي' : `Create Scout Report${videoUrls.filter(u => u.trim()).length > 0 ? ` (${videoUrls.filter(u => u.trim()).length} video${videoUrls.filter(u => u.trim()).length > 1 ? 's' : ''})` : ''}`)}
            </Button>
          </CardContent>
        </Card>

        {/* Results / Metrics */}
        <div className="space-y-4">
          {reportResult ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Star className="h-5 w-5" />
                  {language === 'ar' ? 'نتائج التقرير' : 'Report Results'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: language === 'ar' ? 'التقني' : 'Technical', value: reportResult.technicalScore, color: 'text-blue-600' },
                    { label: language === 'ar' ? 'البدني' : 'Physical', value: reportResult.physicalScore, color: 'text-green-600' },
                    { label: language === 'ar' ? 'التكتيكي' : 'Tactical', value: reportResult.tacticalScore, color: 'text-purple-600' },
                    { label: language === 'ar' ? 'الذهني' : 'Mental', value: reportResult.mentalScore, color: 'text-orange-600' },
                  ].map(metric => (
                    <div key={metric.label} className="p-3 bg-muted rounded-lg text-center">
                      <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                      <p className={`text-2xl font-bold ${metric.color}`}>{metric.value || '--'}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-primary/10 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground mb-1">{language === 'ar' ? 'التقييم الإجمالي' : 'Overall Score'}</p>
                  <p className="text-3xl font-bold text-primary">{reportResult.overallScore || '--'}</p>
                  {reportResult.potentialLevel && (
                    <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full mt-1 inline-block capitalize">
                      {reportResult.potentialLevel} {language === 'ar' ? 'إمكانية' : 'Potential'}
                    </span>
                  )}
                </div>
                {reportResult.strengths && reportResult.strengths.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 text-green-600">{language === 'ar' ? 'نقاط القوة:' : 'Strengths:'}</p>
                    <ul className="text-sm space-y-1">
                      {reportResult.strengths.slice(0, 3).map((s: string, i: number) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  {language === 'ar' ? 'مقاييس التحليل (20 مقياساً)' : 'Analysis Metrics (20 Metrics)'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: language === 'ar' ? 'المهارات التقنية' : 'Technical Skills', desc: language === 'ar' ? 'التحكم، التمرير، التسديد، المراوغة' : 'Ball control, passing, shooting, dribbling', icon: Award, color: 'text-blue-500' },
                  { label: language === 'ar' ? 'الوعي التكتيكي' : 'Tactical Awareness', desc: language === 'ar' ? 'التمركز، الرؤية، صنع القرار' : 'Positioning, vision, decision making', icon: Target, color: 'text-purple-500' },
                  { label: language === 'ar' ? 'اللياقة البدنية' : 'Physical Fitness', desc: language === 'ar' ? 'السرعة، التسارع، الرشاقة، التحمل' : 'Speed, acceleration, agility, stamina', icon: TrendingUp, color: 'text-green-700 dark:text-green-500' },
                  { label: language === 'ar' ? 'الصفات الذهنية' : 'Mental Attributes', desc: language === 'ar' ? 'القيادة، الهدوء، الإصرار' : 'Leadership, composure, determination', icon: User, color: 'text-orange-700 dark:text-orange-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <item.icon className={`h-5 w-5 mt-0.5 ${item.color}`} />
                    <div>
                      <p className="font-medium text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-1">Pro Tip: Multiple Videos</p>
                  <p className="text-xs text-blue-600 dark:text-blue-300">
                    Submit multiple video clips (match highlights, training sessions, skill demos) for more accurate and comprehensive AI analysis. The more context provided, the better the scouting report.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'ar' ? 'التقارير الأخيرة' : 'Recent Reports'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports && reports.length > 0 ? (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id}>
                  <div
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                  >
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{report.playerName}</p>
                        <p className="text-sm text-muted-foreground">
                          {report.playerPosition && `${report.playerPosition} • `}
                          {report.currentClub && `${report.currentClub} • `}
                          {new Date(report.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {report.videoUrl && (
                        <Badge variant="outline" className="text-xs">
                          <Video className="w-3 h-3 mr-1" />
                          Video
                        </Badge>
                      )}
                      {report.overallScore && (
                        <div className="text-center">
                          <p className="text-lg font-bold text-primary">{report.overallScore}</p>
                          <p className="text-xs text-muted-foreground">{language === 'ar' ? 'إجمالي' : 'Overall'}</p>
                        </div>
                      )}
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        report.potentialLevel === 'elite' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                        report.potentialLevel === 'high' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                        report.potentialLevel === 'medium' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                        'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {report.potentialLevel
                          ? report.potentialLevel.charAt(0).toUpperCase() + report.potentialLevel.slice(1)
                          : (language === 'ar' ? 'قيد التحليل' : 'Analyzing')}
                      </span>
                    </div>
                  </div>
                  {/* Expanded report details */}
                  {expandedReport === report.id && (
                    <div className="mt-2 p-4 bg-muted/30 rounded-lg border border-border/50 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { label: 'Technical', value: report.technicalScore, color: 'text-blue-500' },
                          { label: 'Physical', value: report.physicalScore, color: 'text-green-700 dark:text-green-500' },
                          { label: 'Tactical', value: report.tacticalScore, color: 'text-purple-500' },
                          { label: 'Mental', value: report.mentalScore, color: 'text-orange-700 dark:text-orange-500' },
                        ].map(m => (
                          <div key={m.label} className="text-center p-2 bg-background rounded">
                            <p className={`text-xl font-bold ${m.color}`}>{m.value || '--'}</p>
                            <p className="text-xs text-muted-foreground">{m.label}</p>
                          </div>
                        ))}
                      </div>
                      {report.strengths && Array.isArray(report.strengths) && report.strengths.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-700 dark:text-green-500 mb-1">Strengths:</p>
                          <div className="flex flex-wrap gap-1">
                            {(report.strengths as string[]).map((s, i) => (
                              <span key={i} className="px-2 py-0.5 bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {report.videoUrl && (
                        <div>
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Video:</p>
                          <a
                            href={report.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {report.videoUrl}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {language === 'ar' ? 'لا توجد تقارير بعد. أنشئ أول تقرير كشفي!' : 'No reports yet. Create your first scout report!'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
