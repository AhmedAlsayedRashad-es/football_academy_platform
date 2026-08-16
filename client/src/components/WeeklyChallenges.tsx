import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Target, 
  Clock,
  CheckCircle2,
  Gift,
  Flame
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

export default function WeeklyChallenges() {
  const { language } = useLanguage();
  const utils = trpc.useUtils();
  
  // Fetch user challenges
  const { data: userChallenges = [], isLoading } = trpc.dataAnalysis.getUserChallenges.useQuery();
  
  // Claim reward mutation
  const claimReward = trpc.dataAnalysis.claimReward.useMutation({
    onSuccess: (data) => {
      toast.success(
        language === 'ar' ? 'تم استلام المكافأة!' : 'Reward Claimed!',
        {
          description: language === 'ar' 
            ? `حصلت على: ${data.reward?.value}` 
            : `You earned: ${data.reward?.value}`
        }
      );
      utils.dataAnalysis.getUserChallenges.invalidate();
      utils.dataAnalysis.getUserBadges.invalidate();
    },
    onError: () => {
      toast.error(
        language === 'ar' ? 'خطأ' : 'Error',
        {
          description: language === 'ar' 
            ? 'فشل استلام المكافأة' 
            : 'Failed to claim reward'
        }
      );
    }
  });

  const handleClaimReward = (challengeId: number) => {
    claimReward.mutate({ challengeId });
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'quiz_streak':
        return <Flame className="h-5 w-5" />;
      case 'perfect_score':
        return <Target className="h-5 w-5" />;
      case 'multiple_courses':
        return <Trophy className="h-5 w-5" />;
      case 'high_average':
        return <CheckCircle2 className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  const getProgressPercentage = (challenge: any) => {
    const criteria = challenge.criteria as any;
    const progress = challenge.progress || 0;
    
    switch (challenge.type) {
      case 'quiz_streak':
        return (progress / (criteria.count || 5)) * 100;
      case 'perfect_score':
        return progress === 1 ? 100 : 0;
      case 'multiple_courses':
        return (progress / (criteria.count || 3)) * 100;
      case 'high_average':
        return (progress / (criteria.threshold || 85)) * 100;
      default:
        return 0;
    }
  };

  const getProgressText = (challenge: any) => {
    const criteria = challenge.criteria as any;
    const progress = challenge.progress || 0;
    
    switch (challenge.type) {
      case 'quiz_streak':
        return `${progress}/${criteria.count || 5} ${language === 'ar' ? 'أيام' : 'days'}`;
      case 'perfect_score':
        return progress === 1 
          ? (language === 'ar' ? 'مكتمل!' : 'Completed!') 
          : (language === 'ar' ? 'غير مكتمل' : 'Not completed');
      case 'multiple_courses':
        return `${progress}/${criteria.count || 3} ${language === 'ar' ? 'كورسات' : 'courses'}`;
      case 'high_average':
        return `${progress}/${criteria.threshold || 85}%`;
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  if (userChallenges.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            {language === 'ar' ? 'التحديات الأسبوعية' : 'Weekly Challenges'}
          </CardTitle>
          <CardDescription>
            {language === 'ar' ? 'لا توجد تحديات نشطة حالياً' : 'No active challenges at the moment'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {language === 'ar' ? 'التحديات الأسبوعية' : 'Weekly Challenges'}
        </CardTitle>
        <CardDescription>
          {language === 'ar' 
            ? 'أكمل التحديات واحصل على مكافآت' 
            : 'Complete challenges and earn rewards'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {userChallenges.map((challenge) => {
            const progressPercentage = getProgressPercentage(challenge);
            const isCompleted = challenge.completed;
            const isClaimed = challenge.rewardClaimed;
            const daysLeft = Math.ceil(
              (new Date(challenge.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <div
                key={challenge.id}
                className={`p-4 rounded-lg border-2 ${
                  isCompleted 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-300 dark:border-green-700'
                    : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : 'bg-blue-500 text-white'
                    }`}>
                      {getChallengeIcon(challenge.type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg mb-1">{challenge.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{challenge.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {daysLeft > 0 
                          ? `${daysLeft} ${language === 'ar' ? 'يوم متبقي' : 'days left'}`
                          : language === 'ar' ? 'ينتهي اليوم' : 'Ends today'}
                      </div>
                    </div>
                  </div>
                  {isCompleted && !isClaimed && (
                    <Button
                      size="sm"
                      onClick={() => handleClaimReward(challenge.challengeId)}
                      disabled={claimReward.isPending}
                      className="ml-2"
                    >
                      <Gift className="h-4 w-4 mr-1" />
                      {language === 'ar' ? 'استلم' : 'Claim'}
                    </Button>
                  )}
                  {isClaimed && (
                    <Badge variant="outline" className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {language === 'ar' ? 'مُستلم' : 'Claimed'}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {language === 'ar' ? 'التقدم' : 'Progress'}
                    </span>
                    <span className="font-semibold">{getProgressText(challenge)}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
