import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  teamId: number;
  isRTL: boolean;
  currentMonth: number;
  currentYear: number;
  onRecordPayment: (player: any) => void;
}

export default function SubscriptionTeamMembers({ teamId, isRTL, currentMonth, currentYear, onRecordPayment }: Props) {
  const { data: members = [], isLoading } = trpc.privateSubscriptions.getByTeam.useQuery({ teamId });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
      </div>
    );
  }

  if (!Array.isArray(members) || members.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {isRTL ? 'لا يوجد لاعبون في هذا الفريق بعد' : 'No players in this team yet'}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header row */}
      <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground px-3 pb-1 border-b">
        <span className="col-span-2">{isRTL ? 'اللاعب' : 'Player'}</span>
        <span className="text-center">{isRTL ? 'الرسوم الشهرية' : 'Monthly Fee'}</span>
        <span className="text-center">{isRTL ? 'الحالة' : 'Status'}</span>
        <span className="text-center">{isRTL ? 'إجراء' : 'Action'}</span>
      </div>

      {(members as any[]).map((member: any) => {
        const status: 'active' | 'overdue' | 'pending' = member.subscriptionStatus || 'pending';
        const statusConfig = {
          active: { icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-700 dark:text-green-400" />, label: isRTL ? 'مدفوع' : 'Paid', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
          overdue: { icon: <XCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />, label: isRTL ? 'متأخر' : 'Overdue', color: 'bg-red-500/10 text-red-600 dark:text-red-400' },
          pending: { icon: <Clock className="w-3.5 h-3.5 text-yellow-700 dark:text-yellow-400" />, label: isRTL ? 'معلق' : 'Pending', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
        }[status] || { icon: <Clock className="w-3.5 h-3.5 text-muted-foreground" />, label: status, color: 'bg-gray-500/10 text-muted-foreground' };

        return (
          <div key={member.memberId} className="grid grid-cols-5 gap-2 items-center p-3 rounded-lg hover:bg-muted/30 transition-colors">
            {/* Player info */}
            <div className="col-span-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0 overflow-hidden">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{member.firstName?.[0]}{member.lastName?.[0]}</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{member.firstName} {member.lastName}</p>
                <p className="text-xs text-muted-foreground truncate">{member.position}</p>
              </div>
            </div>

            {/* Monthly fee */}
            <div className="text-center">
              <span className="text-sm font-semibold">
                {member.monthlyFee ? `${member.monthlyFee} ${isRTL ? 'ج' : 'EGP'}` : '—'}
              </span>
            </div>

            {/* Status badge */}
            <div className="flex justify-center">
              <Badge className={`text-xs gap-1 ${statusConfig.color}`}>
                {statusConfig.icon}
                {statusConfig.label}
              </Badge>
            </div>

            {/* Action */}
            <div className="flex justify-center">
              <Button
                size="sm"
                variant={status === 'active' ? 'outline' : 'default'}
                className="h-7 text-xs gap-1"
                onClick={() => onRecordPayment(member)}
              >
                <CreditCard className="w-3 h-3" />
                {status === 'active' ? (isRTL ? 'تحديث' : 'Update') : (isRTL ? 'تسجيل دفع' : 'Record')}
              </Button>
            </div>
          </div>
        );
      })}

      {/* Total row */}
      <div className="flex items-center justify-between pt-2 mt-2 border-t text-sm">
        <span className="text-muted-foreground">{isRTL ? 'الإجمالي المتوقع:' : 'Expected total:'}</span>
        <span className="font-bold text-primary">
          {(members as any[]).reduce((acc: number, m: any) => acc + (Number(m.monthlyFee) || 0), 0)} {isRTL ? 'جنيه' : 'EGP'}
        </span>
      </div>
    </div>
  );
}
