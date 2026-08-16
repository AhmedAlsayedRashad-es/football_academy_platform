import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Check, AlertCircle } from 'lucide-react';

export default function WhatsAppSettings() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const { data: user } = trpc.auth.me.useQuery();
  
  const [whatsappPhone, setWhatsappPhone] = useState(user?.whatsappPhone || '');
  const [enabled, setEnabled] = useState(user?.whatsappNotifications || false);
  const [isSaving, setIsSaving] = useState(false);

  const updateSettings = trpc.users.updateWhatsAppSettings.useMutation({
    onSuccess: () => {
      setIsSaving(false);
      toast({
        title: language === 'ar' ? 'تم الحفظ' : 'Saved',
        description: language === 'ar' ? 'تم حفظ إعدادات WhatsApp' : 'WhatsApp settings saved',
      });
    },
    onError: () => {
      setIsSaving(false);
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'فشل في حفظ الإعدادات' : 'Failed to save settings',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (enabled && !whatsappPhone) {
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'يرجى إدخال رقم WhatsApp' : 'Please enter WhatsApp number',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    updateSettings.mutate({
      whatsappPhone: whatsappPhone || null,
      whatsappNotifications: enabled,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-bold">
          {language === 'ar' ? 'إعدادات WhatsApp' : 'WhatsApp Settings'}
        </h3>
      </div>

      <div className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <Label htmlFor="whatsapp-enabled" className="flex flex-col gap-1">
            <span className="font-semibold">
              {language === 'ar' ? 'تفعيل إشعارات WhatsApp' : 'Enable WhatsApp Notifications'}
            </span>
            <span className="text-sm text-muted-foreground font-normal">
              {language === 'ar' 
                ? 'تلقي تنبيهات المباراة والتقارير عبر WhatsApp' 
                : 'Receive match alerts and reports via WhatsApp'}
            </span>
          </Label>
          <Switch
            id="whatsapp-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="whatsapp-phone" className="font-semibold">
            {language === 'ar' ? 'رقم WhatsApp' : 'WhatsApp Number'}
          </Label>
          <Input
            id="whatsapp-phone"
            type="tel"
            placeholder="+966 50 123 4567"
            value={whatsappPhone}
            onChange={(e) => setWhatsappPhone(e.target.value)}
            disabled={!enabled}
            dir="ltr"
          />
          <p className="text-xs text-muted-foreground">
            {language === 'ar' 
              ? 'أدخل الرقم بالصيغة الدولية (مثال: +966501234567)' 
              : 'Enter number in international format (e.g., +966501234567)'}
          </p>
        </div>

        {/* Notification Types */}
        {enabled && (
          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm font-semibold mb-3">
              {language === 'ar' ? 'ستتلقى إشعارات عن:' : 'You will receive notifications for:'}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>{language === 'ar' ? 'تنبيهات الإجهاد الحرجة' : 'Critical fatigue alerts'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>{language === 'ar' ? 'الأهداف والبطاقات' : 'Goals and cards'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>{language === 'ar' ? 'الإصابات' : 'Injuries'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>{language === 'ar' ? 'التوصيات التكتيكية' : 'Tactical recommendations'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>{language === 'ar' ? 'تقارير ما بعد المباراة' : 'Post-match reports'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Setup Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="font-semibold">
                {language === 'ar' ? 'ملاحظة مهمة:' : 'Important Note:'}
              </p>
              <p className="text-muted-foreground">
                {language === 'ar' 
                  ? 'يتطلب إرسال رسائل WhatsApp إعداد حساب WhatsApp Business API. يرجى الاتصال بالمسؤول لإعداد التكامل.' 
                  : 'Sending WhatsApp messages requires WhatsApp Business API setup. Please contact administrator to configure integration.'}
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSave}
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? (
            language === 'ar' ? 'جاري الحفظ...' : 'Saving...'
          ) : (
            language === 'ar' ? 'حفظ الإعدادات' : 'Save Settings'
          )}
        </Button>
      </div>
    </Card>
  );
}
