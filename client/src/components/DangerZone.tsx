import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { Target, Shield, Swords, Loader2, TrendingUp } from 'lucide-react';
import { Streamdown } from '@/components/MarkdownRenderer';

interface DangerZoneProps {
  matchId: number;
}

export default function DangerZone({ matchId }: DangerZoneProps) {
  const { t, language } = useLanguage();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Fetch danger zone data
  const { data: zoneData, isLoading } = trpc.liveMatch.getDangerZones.useQuery(
    { matchId },
    { enabled: !!matchId, refetchInterval: 15000 }
  );

  // Generate AI insights mutation
  const generateInsights = trpc.liveMatch.generateZoneInsights.useMutation({
    onSuccess: (data) => {
      setAiInsights(data.insights);
      setLoadingInsights(false);
    },
    onError: () => {
      setLoadingInsights(false);
    },
  });

  useEffect(() => {
    if (zoneData && !aiInsights && !loadingInsights) {
      setLoadingInsights(true);
      generateInsights.mutate({ matchId });
    }
  }, [zoneData]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!zoneData) {
    return (
      <Card className="p-6">
        <p className="text-center text-muted-foreground">
          {language === 'ar' ? 'لا توجد بيانات مناطق الخطر' : 'No danger zone data available'}
        </p>
      </Card>
    );
  }

  const getZoneColor = (intensity: number) => {
    if (intensity >= 80) return 'bg-red-500';
    if (intensity >= 60) return 'bg-orange-500';
    if (intensity >= 40) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getZoneOpacity = (intensity: number) => {
    return Math.max(0.3, intensity / 100);
  };

  return (
    <div className="space-y-6">
      {/* Pitch Visualization */}
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          {language === 'ar' ? 'خريطة مناطق الخطر' : 'Danger Zone Heatmap'}
        </h3>
        
        {/* Football Pitch */}
        <div className="relative w-full aspect-[2/1] bg-green-700 rounded-lg overflow-hidden border-4 border-white">
          {/* Pitch markings */}
          <div className="absolute inset-0">
            {/* Center line */}
            <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/50" />
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/50 rounded-full" />
            {/* Penalty areas */}
            <div className="absolute top-1/4 left-0 w-1/6 h-1/2 border-2 border-r-0 border-white/50" />
            <div className="absolute top-1/4 right-0 w-1/6 h-1/2 border-2 border-l-0 border-white/50" />
          </div>

          {/* Danger Zones Overlay */}
          {zoneData.zones.map((zone, index) => {
            const positions: Record<string, any> = {
              'left_attack': { top: '10%', left: '70%', width: '25%', height: '35%' },
              'center_attack': { top: '30%', left: '70%', width: '25%', height: '40%' },
              'right_attack': { top: '55%', left: '70%', width: '25%', height: '35%' },
              'left_midfield': { top: '10%', left: '40%', width: '30%', height: '35%' },
              'center_midfield': { top: '30%', left: '40%', width: '30%', height: '40%' },
              'right_midfield': { top: '55%', left: '40%', width: '30%', height: '35%' },
              'left_defense': { top: '10%', left: '5%', width: '30%', height: '35%' },
              'center_defense': { top: '30%', left: '5%', width: '30%', height: '40%' },
              'right_defense': { top: '55%', left: '5%', width: '30%', height: '35%' },
            };

            const pos = positions[zone.zoneName] || { top: '50%', left: '50%', width: '20%', height: '20%' };

            return (
              <div
                key={index}
                className={`absolute ${getZoneColor(zone.intensity)} cursor-pointer hover:opacity-90 transition-opacity`}
                style={{
                  ...pos,
                  opacity: getZoneOpacity(zone.intensity),
                }}
                onClick={() => setSelectedZone(zone.zoneName === selectedZone ? null : zone.zoneName)}
              >
                {selectedZone === zone.zoneName && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs font-bold">
                    {zone.intensity}%
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span>{language === 'ar' ? 'خطر عالي' : 'High Danger'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span>{language === 'ar' ? 'خطر متوسط' : 'Medium Danger'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span>{language === 'ar' ? 'خطر منخفض' : 'Low Danger'}</span>
          </div>
        </div>
      </Card>

      {/* Zone Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Swords className="h-6 w-6 text-red-500" />
            <h3 className="font-bold">
              {language === 'ar' ? 'مناطق الهجوم' : 'Attacking Zones'}
            </h3>
          </div>
          <div className="space-y-3">
            {zoneData.zones
              .filter(z => z.zoneName.includes('attack'))
              .map((zone, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{zone.zoneName.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getZoneColor(zone.intensity)}`}
                        style={{ width: `${zone.intensity}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{zone.intensity}%</span>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'الأحداث:' : 'Events:'} {zoneData.attackingEvents}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="h-6 w-6 text-blue-500" />
            <h3 className="font-bold">
              {language === 'ar' ? 'مناطق الدفاع' : 'Defensive Zones'}
            </h3>
          </div>
          <div className="space-y-3">
            {zoneData.zones
              .filter(z => z.zoneName.includes('defense'))
              .map((zone, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm capitalize">{zone.zoneName.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getZoneColor(zone.intensity)}`}
                        style={{ width: `${zone.intensity}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{zone.intensity}%</span>
                  </div>
                </div>
              ))}
          </div>
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              {language === 'ar' ? 'الأحداث:' : 'Events:'} {zoneData.defensiveEvents}
            </p>
          </div>
        </Card>
      </div>

      {/* AI Tactical Insights */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">
            {language === 'ar' ? 'رؤى تكتيكية من الذكاء الاصطناعي' : 'AI Tactical Insights'}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoadingInsights(true);
              generateInsights.mutate({ matchId });
            }}
            disabled={loadingInsights}
          >
            {loadingInsights ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {language === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                {language === 'ar' ? 'تحليل جديد' : 'Refresh Analysis'}
              </>
            )}
          </Button>
        </div>
        
        {loadingInsights ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : aiInsights ? (
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <Streamdown>{aiInsights}</Streamdown>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            {language === 'ar' ? 'انقر على "تحليل جديد" للحصول على رؤى الذكاء الاصطناعي' : 'Click "Refresh Analysis" to get AI insights'}
          </p>
        )}
      </Card>
    </div>
  );
}
