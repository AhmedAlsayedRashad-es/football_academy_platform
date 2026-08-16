import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/_core/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Target, User, Calendar, AlertCircle, Loader2 } from 'lucide-react';

interface DrillAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  drill: {
    id: string;
    name: string;
    nameAr?: string;
    category?: string;
    duration?: string;
    priority?: string;
  };
  improvementArea?: string;
  videoAnalysisId?: number;
}

export default function DrillAssignmentModal({
  isOpen,
  onClose,
  drill,
  improvementArea,
  videoAnalysisId,
}: DrillAssignmentModalProps) {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<string>(drill.priority || 'medium');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get all players for selection
  const { data: players, isLoading: playersLoading } = trpc.players.getAll.useQuery(undefined, {
    enabled: isOpen,
  });

  const assignDrillMutation = trpc.drillAssignments.assign.useMutation({
    onSuccess: () => {
      toast.success(isRTL ? 'تم تعيين التمرين للاعب بنجاح!' : 'Drill assigned to player successfully!');
      onClose();
      resetForm();
    },
    onError: (error) => {
      console.error('Assignment error:', error);
      toast.error(isRTL ? 'حدث خطأ أثناء تعيين التمرين' : 'Error assigning drill');
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const resetForm = () => {
    setSelectedPlayerId('');
    setDueDate('');
    setPriority(drill.priority || 'medium');
    setReason('');
  };

  const handleSubmit = () => {
    if (!selectedPlayerId) {
      toast.error(isRTL ? 'يرجى اختيار لاعب' : 'Please select a player');
      return;
    }

    setIsSubmitting(true);
    assignDrillMutation.mutate({
      playerId: parseInt(selectedPlayerId),
      drillId: drill.id,
      drillName: drill.name,
      drillNameAr: drill.nameAr,
      category: drill.category,
      improvementArea: improvementArea,
      reason: reason || (isRTL ? `تم التعيين بناءً على تحليل الفيديو - ${improvementArea}` : `Assigned based on video analysis - ${improvementArea}`),
      dueDate: dueDate || undefined,
      priority: priority as 'high' | 'medium' | 'low',
      videoAnalysisId: videoAnalysisId,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border text-foreground max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
            {isRTL ? 'تعيين تمرين للاعب' : 'Assign Drill to Player'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Drill Info */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">{isRTL ? 'التمرين المختار' : 'Selected Drill'}</div>
            <div className="font-medium text-foreground">{isRTL ? drill.nameAr || drill.name : drill.name}</div>
            {drill.duration && (
              <div className="text-xs text-muted-foreground mt-1">{drill.duration}</div>
            )}
          </div>

          {/* Improvement Area */}
          {improvementArea && (
            <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                {isRTL ? 'مجال التحسين' : 'Improvement Area'}
              </div>
              <div className="text-muted-foreground text-sm mt-1">{improvementArea}</div>
            </div>
          )}

          {/* Player Selection */}
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              {isRTL ? 'اختر اللاعب' : 'Select Player'} *
            </Label>
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue placeholder={isRTL ? 'اختر لاعب...' : 'Choose a player...'} />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {playersLoading ? (
                  <div className="p-2 text-center text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                  </div>
                ) : players && players.length > 0 ? (
                  players.map((player: any) => (
                    <SelectItem key={player.id} value={player.id.toString()} className="text-foreground">
                      {player.firstName} {player.lastName} - {player.ageGroup || 'N/A'}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-center text-muted-foreground">
                    {isRTL ? 'لا يوجد لاعبين' : 'No players found'}
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {isRTL ? 'تاريخ الاستحقاق (اختياري)' : 'Due Date (Optional)'}
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-muted border-border text-foreground"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">{isRTL ? 'الأولوية' : 'Priority'}</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                <SelectItem value="high" className="text-red-600 dark:text-red-400">
                  {isRTL ? 'عالية' : 'High'}
                </SelectItem>
                <SelectItem value="medium" className="text-yellow-700 dark:text-yellow-400">
                  {isRTL ? 'متوسطة' : 'Medium'}
                </SelectItem>
                <SelectItem value="low" className="text-green-700 dark:text-green-400">
                  {isRTL ? 'منخفضة' : 'Low'}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Coach Notes */}
          <div className="space-y-2">
            <Label className="text-muted-foreground">{isRTL ? 'ملاحظات المدرب (اختياري)' : 'Coach Notes (Optional)'}</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={isRTL ? 'أضف ملاحظات للاعب...' : 'Add notes for the player...'}
              className="bg-muted border-border text-foreground placeholder:text-gray-500 min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border text-muted-foreground hover:bg-muted"
          >
            {isRTL ? 'إلغاء' : 'Cancel'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedPlayerId}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {isRTL ? 'جاري التعيين...' : 'Assigning...'}
              </>
            ) : (
              <>
                <Target className="h-4 w-4 mr-2" />
                {isRTL ? 'تعيين التمرين' : 'Assign Drill'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
