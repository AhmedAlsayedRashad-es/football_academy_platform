import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Trophy, Calendar, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export function StreakTracker() {
  const utils = trpc.useUtils();
  
  const { data: streak, isLoading: streakLoading } = trpc.streak.getStreak.useQuery();
  const { data: rewards } = trpc.streak.getStreakRewards.useQuery();
  const { data: leaderboard } = trpc.streak.getLeaderboard.useQuery();
  
  const updateStreakMutation = trpc.streak.updateStreak.useMutation({
    onSuccess: (data) => {
      utils.streak.getStreak.invalidate();
      
      if (data.milestoneReached) {
        // sonner's toast takes (message, options), not a single object.
        toast.success(`🔥 ${data.currentStreak} Day Streak!`, {
          description: `Congratulations! You've reached a new milestone!`,
        });
      }
    },
  });

  // Check and update streak on component mount
  useEffect(() => {
    updateStreakMutation.mutate();
  }, []);

  if (streakLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || 0;
  const totalLogins = streak?.totalLogins || 0;

  // Find next milestone
  const milestones = [3, 7, 14, 30, 60, 90, 180, 365];
  const nextMilestone = milestones.find(m => m > currentStreak) || 365;
  const progress = (currentStreak / nextMilestone) * 100;

  return (
    <div className="space-y-6">
      {/* Main Streak Card */}
      <Card className="p-6 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background border-orange-200 dark:border-orange-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
              <Flame className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {currentStreak} Day{currentStreak !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-muted-foreground">Current Streak</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Trophy className="h-4 w-4" />
              <span className="text-sm">Best: {longestStreak} days</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Total: {totalLogins} logins</span>
            </div>
          </div>
        </div>

        {/* Progress to Next Milestone */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Next milestone: {nextMilestone} days</span>
            <span className="font-medium">{currentStreak}/{nextMilestone}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </Card>

      {/* Milestone Rewards */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-orange-600" />
          Streak Milestones
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {milestones.slice(0, 8).map((milestone) => {
            const achieved = currentStreak >= milestone;
            const reward = rewards?.find(r => r.streakDays === milestone);
            
            return (
              <div
                key={milestone}
                className={`p-3 rounded-lg border-2 text-center transition-all ${
                  achieved
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20'
                    : 'border-muted bg-muted/30'
                }`}
              >
                <div className={`text-2xl font-bold ${achieved ? 'text-orange-600' : 'text-muted-foreground'}`}>
                  {milestone}
                </div>
                <div className="text-xs text-muted-foreground mt-1">days</div>
                {achieved && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    ✓ Earned
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Leaderboard */}
      <Card className="p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          Top Streakers
        </h4>
        <div className="space-y-2">
          {leaderboard?.slice(0, 5).map((entry, index) => (
            <div
              key={entry.userId}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
            >
              <div className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                  index === 1 ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' :
                  index === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {index + 1}
                </div>
                <span className="font-medium">{entry.userName || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-700 dark:text-orange-500" />
                <span className="font-bold">{entry.currentStreak}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
