import { useState } from 'react';
import { Link , useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';
import {
  ArrowLeft, Calendar, Clock, MapPin, Plus, Trash2, Edit2,
  DollarSign, Check, X
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

export default function CoachSchedule() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRTL = language === 'ar';
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [newSlot, setNewSlot] = useState({
    dayOfWeek: 0,
    startTime: '09:00',
    endTime: '10:00',
    locationId: 1,
    pricePerSession: 500,
    isRecurring: true,
  });

  // Fetch coach's schedule slots
  const { data: slots = [], refetch: refetchSlots } = trpc.privateTraining.getMySlots.useQuery(undefined, {
    enabled: !!user && (user.role === 'coach' || user.role === 'admin'),
  });

  // Fetch locations
  const { data: locations = [] } = trpc.privateTraining.getLocations.useQuery();

  // Mutations
  const addSlotMutation = trpc.privateTraining.addSlot.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم إضافة الموعد بنجاح' : 'Slot added successfully');
      setShowAddModal(false);
      refetchSlots();
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
    },
  });

  const updateSlotMutation = trpc.privateTraining.updateSlot.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم تحديث الموعد بنجاح' : 'Slot updated successfully');
      setEditingSlot(null);
      refetchSlots();
    },
    onError: (error) => {
      toast.error(error.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
    },
  });

  const deleteSlotMutation = trpc.privateTraining.deleteSlot.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم حذف الموعد بنجاح' : 'Slot deleted successfully');
      refetchSlots();
    },
    onError: (error) => {
      toast.error(error.message || (isRTL ? 'حدث خطأ' : 'An error occurred'));
    },
  });

  const resetForm = () => {
    setNewSlot({
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '10:00',
      locationId: 1,
      pricePerSession: 500,
      isRecurring: true,
    });
  };

  const handleAddSlot = () => {
    addSlotMutation.mutate(newSlot);
  };

  const handleUpdateSlot = () => {
    if (!editingSlot) return;
    updateSlotMutation.mutate({
      slotId: editingSlot.id,
      isAvailable: editingSlot.isAvailable,
      startTime: editingSlot.startTime,
      endTime: editingSlot.endTime,
      pricePerSession: editingSlot.pricePerSession,
    });
  };

  const handleDeleteSlot = (slotId: number) => {
    if (confirm(isRTL ? 'هل أنت متأكد من حذف هذا الموعد؟' : 'Are you sure you want to delete this slot?')) {
      deleteSlotMutation.mutate({ slotId });
    }
  };

  const toggleSlotAvailability = (slot: any) => {
    updateSlotMutation.mutate({
      slotId: slot.id,
      isAvailable: !slot.isAvailable,
    });
  };

  // Group slots by day
  const slotsByDay = DAYS.map((_, dayIndex) => 
    slots.filter((slot: any) => slot.dayOfWeek === dayIndex)
      .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
  );

  // Check if user is authorized
  if (!user || (user.role !== 'coach' && user.role !== 'admin')) {
    return (
      <>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Card className="bg-card/50 border-border p-8 text-center max-w-md">
            <h2 className="text-xl font-bold text-foreground mb-4">
              {isRTL ? 'غير مصرح' : 'Unauthorized'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {isRTL
                ? 'هذه الصفحة متاحة للمدربين فقط'
                : 'This page is only available for coaches'
              }
            </p>
            <Link href="/">
              <Button>{isRTL ? 'العودة للرئيسية' : 'Back to Home'}</Button>
            </Link>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
    <div className={` ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-background text-foreground sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <BackButton />
              <Link href="/">
                <img src="/logo-transparent.png" alt="Future Stars Academy" className="h-10" />
              </Link>
              <div className="flex items-center gap-2">
                <Calendar className="h-6 w-6 text-cyan-700 dark:text-cyan-400" />
                <h1 className="text-xl font-bold">{isRTL ? 'إدارة المواعيد' : 'Schedule Management'}</h1>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              {isRTL ? 'إضافة موعد' : 'Add Slot'}
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-cyan-700 dark:text-cyan-400">{slots.length}</div>
              <div className="text-sm text-muted-foreground">{isRTL ? 'إجمالي المواعيد' : 'Total Slots'}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                {slots.filter((s: any) => s.isAvailable).length}
              </div>
              <div className="text-sm text-muted-foreground">{isRTL ? 'متاح' : 'Available'}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                {new Set(slots.map((s: any) => s.dayOfWeek)).size}
              </div>
              <div className="text-sm text-muted-foreground">{isRTL ? 'أيام نشطة' : 'Active Days'}</div>
            </CardContent>
          </Card>
          <Card className="bg-card/50 border-border">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {slots.length > 0 
                  ? Math.round(slots.reduce((sum: number, s: any) => sum + (s.pricePerSession || 0), 0) / slots.length)
                  : 0
                } {isRTL ? 'ج.م' : 'EGP'}
              </div>
              <div className="text-sm text-muted-foreground">{isRTL ? 'متوسط السعر' : 'Avg Price'}</div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Schedule Grid */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-foreground">{isRTL ? 'الجدول الأسبوعي' : 'Weekly Schedule'}</CardTitle>
            <CardDescription className="text-muted-foreground">
              {isRTL 
                ? 'أضف وأدر مواعيد التدريب الخاصة المتاحة'
                : 'Add and manage your available private training slots'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {DAYS.map((day, dayIndex) => (
                <div key={dayIndex} className="space-y-2">
                  <div className="text-center font-semibold text-foreground py-2 bg-muted rounded-t-lg">
                    {isRTL ? DAYS_AR[dayIndex] : day}
                  </div>
                  <div className="space-y-2 min-h-[200px] bg-muted/30 rounded-b-lg p-2">
                    {slotsByDay[dayIndex].length === 0 ? (
                      <div className="text-center text-muted-foreground text-sm py-4">
                        {isRTL ? 'لا توجد مواعيد' : 'No slots'}
                      </div>
                    ) : (
                      slotsByDay[dayIndex].map((slot: any) => (
                        <div 
                          key={slot.id}
                          className={`p-2 rounded-lg text-sm ${
                            slot.isAvailable 
                              ? 'bg-cyan-500/20 border border-cyan-500/30' 
                              : 'bg-gray-500/20 border border-gray-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-foreground font-medium">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <div className="flex items-center gap-1">
                              <button 
                                onClick={() => setEditingSlot(slot)}
                                className="p-1 hover:bg-muted rounded"
                              >
                                <Edit2 className="h-3 w-3 text-muted-foreground" />
                              </button>
                              <button 
                                onClick={() => handleDeleteSlot(slot.id)}
                                className="p-1 hover:bg-red-600/20 rounded"
                              >
                                <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-cyan-700 dark:text-cyan-400">{slot.pricePerSession} {isRTL ? 'ج.م' : 'EGP'}</span>
                            <button
                              onClick={() => toggleSlotAvailability(slot)}
                              className={`px-2 py-0.5 rounded ${
                                slot.isAvailable 
                                  ? 'bg-green-500/20 text-green-700 dark:text-green-400' 
                                  : 'bg-gray-500/20 text-muted-foreground'
                              }`}
                            >
                              {slot.isAvailable 
                                ? (isRTL ? 'متاح' : 'Available') 
                                : (isRTL ? 'غير متاح' : 'Unavailable')
                              }
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Slot Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إضافة موعد جديد' : 'Add New Slot'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {isRTL 
                ? 'أضف موعد تدريب خاص جديد لجدولك'
                : 'Add a new private training slot to your schedule'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>{isRTL ? 'اليوم' : 'Day'}</Label>
              <Select 
                value={newSlot.dayOfWeek.toString()} 
                onValueChange={(v) => setNewSlot({ ...newSlot, dayOfWeek: parseInt(v) })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {DAYS.map((day, i) => (
                    <SelectItem key={i} value={i.toString()} className="text-foreground hover:bg-muted">
                      {isRTL ? DAYS_AR[i] : day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRTL ? 'وقت البداية' : 'Start Time'}</Label>
                <Select 
                  value={newSlot.startTime} 
                  onValueChange={(v) => setNewSlot({ ...newSlot, startTime: v })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time} className="text-foreground hover:bg-muted">
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isRTL ? 'وقت النهاية' : 'End Time'}</Label>
                <Select 
                  value={newSlot.endTime} 
                  onValueChange={(v) => setNewSlot({ ...newSlot, endTime: v })}
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time} className="text-foreground hover:bg-muted">
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>{isRTL ? 'الموقع' : 'Location'}</Label>
              <Select 
                value={newSlot.locationId.toString()} 
                onValueChange={(v) => setNewSlot({ ...newSlot, locationId: parseInt(v) })}
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {locations.map((loc: any) => (
                    <SelectItem key={loc.id} value={loc.id.toString()} className="text-foreground hover:bg-muted">
                      {isRTL ? loc.nameAr || loc.name : loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>{isRTL ? 'السعر (ج.م)' : 'Price (EGP)'}</Label>
              <Input
                type="number"
                value={newSlot.pricePerSession}
                onChange={(e) => setNewSlot({ ...newSlot, pricePerSession: parseInt(e.target.value) || 0 })}
                className="bg-muted border-border"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label>{isRTL ? 'موعد أسبوعي متكرر' : 'Weekly Recurring'}</Label>
              <Switch
                checked={newSlot.isRecurring}
                onCheckedChange={(checked) => setNewSlot({ ...newSlot, isRecurring: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleAddSlot}
              disabled={addSlotMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {addSlotMutation.isPending 
                ? (isRTL ? 'جاري الإضافة...' : 'Adding...') 
                : (isRTL ? 'إضافة' : 'Add Slot')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Slot Modal */}
      <Dialog open={!!editingSlot} onOpenChange={() => setEditingSlot(null)}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تعديل الموعد' : 'Edit Slot'}</DialogTitle>
          </DialogHeader>
          
          {editingSlot && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{isRTL ? 'وقت البداية' : 'Start Time'}</Label>
                  <Select 
                    value={editingSlot.startTime} 
                    onValueChange={(v) => setEditingSlot({ ...editingSlot, startTime: v })}
                  >
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time} className="text-foreground hover:bg-muted">
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{isRTL ? 'وقت النهاية' : 'End Time'}</Label>
                  <Select 
                    value={editingSlot.endTime} 
                    onValueChange={(v) => setEditingSlot({ ...editingSlot, endTime: v })}
                  >
                    <SelectTrigger className="bg-muted border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time} className="text-foreground hover:bg-muted">
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>{isRTL ? 'السعر (ج.م)' : 'Price (EGP)'}</Label>
                <Input
                  type="number"
                  value={editingSlot.pricePerSession}
                  onChange={(e) => setEditingSlot({ ...editingSlot, pricePerSession: parseInt(e.target.value) || 0 })}
                  className="bg-muted border-border"
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>{isRTL ? 'متاح للحجز' : 'Available for Booking'}</Label>
                <Switch
                  checked={editingSlot.isAvailable}
                  onCheckedChange={(checked) => setEditingSlot({ ...editingSlot, isAvailable: checked })}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSlot(null)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleUpdateSlot}
              disabled={updateSlotMutation.isPending}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {updateSlotMutation.isPending 
                ? (isRTL ? 'جاري الحفظ...' : 'Saving...') 
                : (isRTL ? 'حفظ التغييرات' : 'Save Changes')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
