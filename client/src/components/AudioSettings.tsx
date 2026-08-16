import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/contexts/LanguageContext';
import { Volume2, VolumeX, Bell } from 'lucide-react';
import { audioNotifications } from '@/lib/audioNotifications';

export default function AudioSettings() {
  const { language } = useLanguage();
  const [enabled, setEnabled] = useState(audioNotifications.isEnabled());
  const [volume, setVolume] = useState(audioNotifications.getVolume() * 100);

  useEffect(() => {
    audioNotifications.requestPermission();
  }, []);

  const handleEnabledChange = (checked: boolean) => {
    setEnabled(checked);
    audioNotifications.setEnabled(checked);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    audioNotifications.setVolume(newVolume / 100);
  };

  const handleTest = () => {
    audioNotifications.testAudio();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5" />
        <h3 className="text-lg font-bold">
          {language === 'ar' ? 'إعدادات التنبيهات الصوتية' : 'Audio Alert Settings'}
        </h3>
      </div>

      <div className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <Label htmlFor="audio-enabled" className="flex flex-col gap-1">
            <span className="font-semibold">
              {language === 'ar' ? 'تفعيل التنبيهات الصوتية' : 'Enable Audio Alerts'}
            </span>
            <span className="text-sm text-muted-foreground font-normal">
              {language === 'ar' 
                ? 'تلقي تنبيهات صوتية للأحداث المهمة' 
                : 'Receive audio notifications for critical events'}
            </span>
          </Label>
          <Switch
            id="audio-enabled"
            checked={enabled}
            onCheckedChange={handleEnabledChange}
          />
        </div>

        {/* Volume Control */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="font-semibold">
              {language === 'ar' ? 'مستوى الصوت' : 'Volume Level'}
            </Label>
            <span className="text-sm text-muted-foreground">{Math.round(volume)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <VolumeX className="h-4 w-4 text-muted-foreground" />
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={5}
              disabled={!enabled}
              className="flex-1"
            />
            <Volume2 className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Test Button */}
        <Button 
          variant="outline" 
          onClick={handleTest}
          disabled={!enabled}
          className="w-full"
        >
          {language === 'ar' ? 'اختبار الصوت' : 'Test Audio'}
        </Button>

        {/* Alert Types Info */}
        <div className="space-y-2 pt-4 border-t">
          <p className="text-sm font-semibold mb-3">
            {language === 'ar' ? 'أنواع التنبيهات:' : 'Alert Types:'}
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{language === 'ar' ? 'إجهاد حرج (>80%)' : 'Critical Fatigue (>80%)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500" />
              <span>{language === 'ar' ? 'إجهاد عالي (>65%)' : 'High Fatigue (>65%)'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>{language === 'ar' ? 'توصيات تكتيكية' : 'Tactical Recommendations'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span>{language === 'ar' ? 'فرص تسجيل الأهداف' : 'Goal Opportunities'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-500" />
              <span>{language === 'ar' ? 'البطاقات والإصابات' : 'Cards & Injuries'}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
