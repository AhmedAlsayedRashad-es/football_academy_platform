import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle, Activity, Zap, TrendingUp, Loader2, User } from 'lucide-react';
import { Streamdown } from '@/components/MarkdownRenderer';
import { Badge } from '@/components/ui/badge';
import { audioNotifications } from '@/lib/audioNotifications';

interface FatigueAlertProps {
  matchId: number;
}

export default function FatigueAlert({ matchId }: FatigueAlertProps) {
  const { t, language } = useLanguage();
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<string>('');
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Fetch fatigue data
  const { data: fatigueData, isLoading, refetch } = trpc.liveMatch.getFatigueData.useQuery(
    { matchId },
    { enabled: !!matchId, refetchInterval: 10000 } // Refresh every 10 seconds
  );

  // Generate AI recommendations mutation
  const generateRecommendations = trpc.liveMatch.generateFatigueRecommendations.useMutation({
    onSuccess: (data) => {
      setAiRecommendations(data.recommendations);
      setLoadingRecommendations(false);
    },
    onError: () => {
      setLoadingRecommendations(false);
    },
  });

  useEffect(() => {
    if (fatigueData && fatigueData.highRiskPlayers.length > 0 && !aiRecommendations && !loadingRecommendations) {
      setLoadingRecommendations(true);
      generateRecommendations.mutate({ matchId });
    }
  }, [fatigueData]);

  // Trigger audio alerts for critical fatigue
  useEffect(() => {
    if (!fatigueData) return;

    const criticalPlayers = fatigueData.highRiskPlayers.filter(p => p.riskLevel === 'critical');
    const highRiskPlayers = fatigueData.highRiskPlayers.filter(p => p.riskLevel === 'high');

    if (criticalPlayers.length > 0) {
      audioNotifications.playAlert(
        'fatigue_critical',
        `Critical fatigue: ${criticalPlayers.map(p => p.playerName).join(', ')}`
      );
    } else if (highRiskPlayers.length > 0) {
      audioNotifications.playAlert(
        'fatigue_high',
        `High fatigue risk: ${highRiskPlayers.length} player(s)`
      );
    }
  }, [fatigueData?.highRiskPlayers.length]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!fatigueData) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          {language === 'ar' ? 'لا توجد بيانات إجهاد متاحة' : 'No fatigue data available'}
        </p>
      </Card>
    );
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getRiskLabel = (risk: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      critical: { ar: 'حرج', en: 'Critical' },
      high: { ar: 'عالي', en: 'High' },
      medium: { ar: 'متوسط', en: 'Medium' },
      low: { ar: 'منخفض', en: 'Low' },
    };
    return language === 'ar' ? labels[risk]?.ar : labels[risk]?.en;
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <Card className="p-6 border-l-4 border-l-orange-500">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-orange-700 dark:text-orange-500 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-2">
              {language === 'ar' ? 'تنبيهات الإجهاد الذكية' : 'Intelligent Fatigue Alerts'}
            </h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-500">{fatigueData.highRiskPlayers.length}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'خطر عالي' : 'High Risk'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-500">{fatigueData.mediumRiskPlayers.length}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'خطر متوسط' : 'Medium Risk'}
                </p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-700 dark:text-green-500">{fatigueData.lowRiskPlayers.length}</p>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'خطر منخفض' : 'Low Risk'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoadingRecommendations(true);
                generateRecommendations.mutate({ matchId });
              }}
              disabled={loadingRecommendations}
            >
              {loadingRecommendations ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  {language === 'ar' ? 'تحديث التوصيات' : 'Refresh Recommendations'}
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Player List */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {language === 'ar' ? 'حالة اللاعبين' : 'Player Status'}
        </h3>
        <div className="space-y-3">
          {[...fatigueData.highRiskPlayers, ...fatigueData.mediumRiskPlayers, ...fatigueData.lowRiskPlayers].map((player) => (
            <div
              key={player.playerId}
              className="flex items-center justify-between p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors cursor-pointer"
              onClick={() => setSelectedPlayer(player.playerId === selectedPlayer ? null : player.playerId)}
            >
              <div className="flex items-center gap-3 flex-1">
                <div className={`w-3 h-3 rounded-full ${getRiskColor(player.riskLevel)}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <p className="font-semibold">{player.playerName}</p>
                    <Badge variant="outline" className="text-xs">
                      {getRiskLabel(player.riskLevel)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-sm text-muted-foreground">
                    <span>{language === 'ar' ? 'المسافة:' : 'Distance:'} {player.distanceCovered.toFixed(1)} km</span>
                    <span>{language === 'ar' ? 'السرعات:' : 'Sprints:'} {player.sprintCount}</span>
                    <span>{language === 'ar' ? 'الإجهاد:' : 'Fatigue:'} {player.fatigueScore}%</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{player.fatigueScore}%</p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ar' ? 'مستوى الإجهاد' : 'Fatigue Level'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* AI Recommendations */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">
            {language === 'ar' ? 'توصيات الذكاء الاصطناعي' : 'AI Recommendations'}
          </h3>
        </div>
        
        {loadingRecommendations ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : aiRecommendations ? (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Streamdown>{aiRecommendations}</Streamdown>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            {language === 'ar' ? 'انقر على "تحديث التوصيات" للحصول على توصيات الذكاء الاصطناعي' : 'Click "Refresh Recommendations" to get AI recommendations'}
          </p>
        )}
      </Card>

      {/* Fatigue Trend Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {language === 'ar' ? 'اتجاه الإجهاد' : 'Fatigue Trend'}
        </h3>
        <div className="h-48 flex items-end justify-around gap-2">
          {fatigueData.trendData.map((point, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary rounded-t transition-all"
                style={{ height: `${point.value}%` }}
              />
              <span className="text-xs text-muted-foreground">{point.minute}'</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
