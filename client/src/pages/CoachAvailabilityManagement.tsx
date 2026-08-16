import { useState } from "react";
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Clock, Plus, Calendar, Loader2, Trash2, ArrowLeft} from 'lucide-react';
import { useLocation } from 'wouter';
import { BackButton } from '@/components/BackButton';


const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_OF_WEEK_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const TIME_SLOTS = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];
const SESSION_TYPES = [{ value: 'all', label: 'All Types', labelAr: 'جميع الأنواع' }, { value: 'training', label: 'Training Only', labelAr: 'التدريب فقط' }, { value: 'private', label: 'Private Sessions', labelAr: 'جلسات خاصة' }];

export default function CoachAvailabilityManagement() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '17:00',
    sessionType: 'all',
    isAvailable: true,
    notes: '',
  });

  const utils = trpc.useUtils();
  const { data: availability, isLoading } = trpc.coachAvailability.getAll.useQuery();

  const setAvailability = trpc.coachAvailability.set.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم حفظ التوفر بنجاح' : 'Availability saved successfully');
      utils.coachAvailability.getAll.invalidate();
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteAvailability = trpc.coachAvailability.delete.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم حذف التوفر' : 'Availability deleted');
      utils.coachAvailability.getAll.invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const resetForm = () => {
    setFormData({ dayOfWeek: 0, startTime: '09:00', endTime: '17:00', sessionType: 'all', isAvailable: true, notes: '' });
  };

  const handleSave = () => {
    setAvailability.mutate({
      ...formData,
      sessionType: formData.sessionType as "private" | "all" | "group" | "consultation",
    });
  };

  const handleDelete = (id: number) => {
    if (confirm(isRTL ? 'هل أنت متأكد من الحذف؟' : 'Are you sure you want to delete this?')) {
      deleteAvailability.mutate({ id });
    }
  };

  const myAvailability = availability?.filter(a => a.coachId === user?.id) || [];
  const groupedByDay = DAYS_OF_WEEK.map((day, index) => ({
    day,
    dayAr: DAYS_OF_WEEK_AR[index],
    dayIndex: index,
    slots: myAvailability.filter(a => a.dayOfWeek === index),
  }));

  if (authLoading) return <DashboardLayoutSkeleton />;

  return (
    <>
      <div className={`container mx-auto p-6 \${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            
            <BackButton />
<h1 className="text-3xl font-bold flex items-center gap-2">
              <Clock className="w-8 h-8" />
              {isRTL ? 'إدارة التوفر' : 'Availability Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL ? 'حدد أوقات توفرك للتدريب' : 'Set your availability for training sessions'}
            </p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            {isRTL ? 'إضافة توفر' : 'Add Availability'}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : (
          <div className="space-y-4">
            {groupedByDay.map(({ day, dayAr, dayIndex, slots }) => (
              <Card key={dayIndex}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5" />
                    {isRTL ? dayAr : day}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {slots.length === 0 ? (
                    <p className="text-muted-foreground text-sm">{isRTL ? 'لا يوجد توفر محدد' : 'No availability set'}</p>
                  ) : (
                    <div className="space-y-2">
                      {slots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant={slot.isAvailable ? 'default' : 'secondary'}>
                              {slot.startTime} - {slot.endTime}
                            </Badge>
                            <Badge variant="outline">
                              {SESSION_TYPES.find(t => t.value === slot.sessionType)?.[isRTL ? 'labelAr' : 'label']}
                            </Badge>
                            {slot.notes && <span className="text-sm text-muted-foreground">{slot.notes}</span>}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(slot.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                {isRTL ? 'إضافة توفر جديد' : 'Add New Availability'}
              </DialogTitle>
              <DialogDescription>
                {isRTL ? 'حدد أوقات توفرك للتدريب' : 'Set your available times for training'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>{isRTL ? 'اليوم' : 'Day'}</Label>
                <Select value={String(formData.dayOfWeek)} onValueChange={(v) => setFormData({ ...formData, dayOfWeek: parseInt(v) })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map((day, i) => (
                      <SelectItem key={i} value={String(i)}>{isRTL ? DAYS_OF_WEEK_AR[i] : day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>{isRTL ? 'وقت البداية' : 'Start Time'}</Label>
                  <Select value={formData.startTime} onValueChange={(v) => setFormData({ ...formData, startTime: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{isRTL ? 'وقت النهاية' : 'End Time'}</Label>
                  <Select value={formData.endTime} onValueChange={(v) => setFormData({ ...formData, endTime: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIME_SLOTS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'نوع الجلسة' : 'Session Type'}</Label>
                <Select value={formData.sessionType} onValueChange={(v) => setFormData({ ...formData, sessionType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{isRTL ? t.labelAr : t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'متاح' : 'Available'}</Label>
                <Switch checked={formData.isAvailable} onCheckedChange={(c) => setFormData({ ...formData, isAvailable: c })} />
              </div>

              <div className="space-y-2">
                <Label>{isRTL ? 'ملاحظات' : 'Notes'}</Label>
                <Textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder={isRTL ? 'ملاحظات اختيارية...' : 'Optional notes...'} rows={2} />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>{isRTL ? 'إلغاء' : 'Cancel'}</Button>
              <Button onClick={handleSave} disabled={setAvailability.isPending}>
                {setAvailability.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isRTL ? 'إضافة' : 'Add'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
