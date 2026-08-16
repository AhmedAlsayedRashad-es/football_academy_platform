import { useState } from 'react';
import { Link , useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { BackButton } from '@/components/BackButton';
import {
  Gift, Star, Trophy, ShoppingBag, Ticket,
  Award, ArrowLeft, Coins, TrendingUp, Users, User
} from 'lucide-react';

export default function Rewards() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  const [selectedReward, setSelectedReward] = useState<any>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);

  // Fetch teams and players
  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: allPlayers } = trpc.players.getAll.useQuery();
  const { data: rewards } = trpc.rewards.getAll.useQuery();
  const { data: leaderboard } = trpc.points.getLeaderboard.useQuery({ limit: 10 });

  // Get player points for selected player
  const playerId = selectedPlayer || 1;
  const { data: playerPoints } = trpc.points.getPlayerPoints.useQuery({ playerId });
  
  const redeemMutation = trpc.rewards.redeem.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(isRTL ? 'تم استبدال المكافأة بنجاح!' : 'Reward redeemed successfully!');
        setShowConfirmDialog(false);
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    }
  });

  const handleRedeem = () => {
    if (selectedReward && selectedPlayer) {
      redeemMutation.mutate({ playerId: selectedPlayer, rewardId: selectedReward.id });
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'merchandise': return <ShoppingBag className="h-5 w-5" />;
      case 'training': return <Trophy className="h-5 w-5" />;
      case 'experience': return <Ticket className="h-5 w-5" />;
      case 'gift': return <Gift className="h-5 w-5" />;
      default: return <Award className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'merchandise': return 'bg-blue-500';
      case 'training': return 'bg-green-500';
      case 'experience': return 'bg-purple-500';
      case 'gift': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Mock teams if not loaded
  const mockTeams = teams || [
    { id: 1, name: 'U12 Eagles', ageGroup: 'U12' },
    { id: 2, name: 'U14 Lions', ageGroup: 'U14' },
    { id: 3, name: 'U16 Tigers', ageGroup: 'U16' },
  ];

  // Mock players if not loaded
  const mockPlayers = allPlayers || [
    { id: 1, firstName: 'Ahmed', lastName: 'Hassan', teamId: 1, position: 'forward' },
    { id: 2, firstName: 'Mohamed', lastName: 'Ali', teamId: 1, position: 'midfielder' },
    { id: 3, firstName: 'Omar', lastName: 'Khaled', teamId: 2, position: 'defender' },
    { id: 4, firstName: 'Youssef', lastName: 'Ibrahim', teamId: 2, position: 'goalkeeper' },
    { id: 5, firstName: 'Karim', lastName: 'Mostafa', teamId: 3, position: 'forward' },
  ];

  // Filter players by selected team
  const filteredPlayers = selectedTeam === 'all' 
    ? mockPlayers 
    : mockPlayers.filter((p: any) => p.teamId === parseInt(selectedTeam));

  // Mock rewards - use fallback if rewards is empty or undefined
  const mockRewards = (rewards && rewards.length > 0) ? rewards : [
    { id: 1, name: 'Academy T-Shirt', nameAr: 'تيشيرت الأكاديمية', pointsCost: 500, category: 'merchandise', description: 'Official Future Stars Academy training t-shirt', stock: 10 },
    { id: 2, name: 'Private Training Session', nameAr: 'جلسة تدريب خاصة', pointsCost: 1000, category: 'training', description: '1-hour private session with a coach', stock: 5 },
    { id: 3, name: 'Match Day Experience', nameAr: 'تجربة يوم المباراة', pointsCost: 2000, category: 'experience', description: 'VIP experience at a professional match', stock: 2 },
    { id: 4, name: 'Football', nameAr: 'كرة قدم', pointsCost: 300, category: 'gift', description: 'Official training football', stock: 20 },
    { id: 5, name: 'Water Bottle', nameAr: 'زجاجة مياه', pointsCost: 200, category: 'merchandise', description: 'Academy branded water bottle', stock: 50 },
    { id: 6, name: 'Goalkeeper Gloves', nameAr: 'قفازات حارس مرمى', pointsCost: 800, category: 'merchandise', description: 'Professional goalkeeper gloves', stock: 8 },
  ];

  const mockPoints = playerPoints || { points: 750, level: 2, totalEarned: 1250 };
  
  // Use fallback if leaderboard is empty or undefined
  const mockLeaderboard = (leaderboard && leaderboard.length > 0) ? leaderboard : [
    { playerId: 1, points: 2500, level: 3 },
    { playerId: 2, points: 2100, level: 3 },
    { playerId: 3, points: 1800, level: 2 },
  ];

  return (
    <>
    <div className={` ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <header className="bg-background text-foreground sticky top-0 z-40">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <BackButton />
            <Link href="/">
              <img src="/logo-transparent.png" alt="Future Stars Academy" className="h-10" />
            </Link>
            <h1 className="text-xl font-bold">{isRTL ? 'المكافآت' : 'Rewards'}</h1>
          </div>
        </div>
      </header>

      {/* Team Tabs */}
      <div className="bg-card border-b border-border">
        <div className="container py-3">
          <Tabs value={selectedTeam} onValueChange={setSelectedTeam}>
            <TabsList className="bg-background/50 w-full justify-start overflow-x-auto">
              <TabsTrigger value="all" className="data-[state=active]:bg-cyan-600">
                <Users className="h-4 w-4 mr-2" />
                {isRTL ? 'جميع الفرق' : 'All Teams'}
              </TabsTrigger>
              {mockTeams.map((team: any) => (
                <TabsTrigger 
                  key={team.id} 
                  value={team.id.toString()}
                  className="data-[state=active]:bg-cyan-600"
                >
                  {team.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Players Selection */}
      <div className="container py-4">
        <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
          <User className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
          {isRTL ? 'اختر اللاعب' : 'Select Player'}
        </h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filteredPlayers.map((player: any) => (
            <Button
              key={player.id}
              variant={selectedPlayer === player.id ? 'default' : 'outline'}
              className={`flex-shrink-0 ${
                selectedPlayer === player.id 
                  ? 'bg-cyan-600 hover:bg-cyan-700' 
                  : 'border-border text-muted-foreground hover:bg-muted'
              }`}
              onClick={() => setSelectedPlayer(player.id)}
            >
              {player.firstName} {player.lastName}
            </Button>
          ))}
        </div>
      </div>

      {/* Points Summary - Only show when player is selected */}
      {selectedPlayer && (
        <div className="brand-gradient py-6">
          <div className="container">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-sm opacity-80">{isRTL ? 'نقاط اللاعب' : 'Player Points'}</p>
                <p className="text-4xl font-bold flex items-center gap-2">
                  <Coins className="h-8 w-8" />
                  {mockPoints.points.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <Badge className="bg-white/20 text-white mb-1">
                  {isRTL ? 'المستوى' : 'Level'} {mockPoints.level}
                </Badge>
                <p className="text-sm opacity-80">
                  {isRTL ? 'إجمالي المكتسب' : 'Total Earned'}: {mockPoints.totalEarned.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Player Selected Message */}
      {!selectedPlayer && (
        <div className="container py-8">
          <Card className="bg-card/50 border-border">
            <CardContent className="py-8 text-center">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {isRTL ? 'اختر لاعباً لعرض نقاطه ومكافآته' : 'Select a player to view their points and rewards'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Leaderboard Preview */}
      {selectedPlayer && (
        <div className="container py-4">
          <Card className="bg-card/50 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-yellow-700 dark:text-yellow-400" />
                {isRTL ? 'المتصدرين' : 'Leaderboard'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {mockLeaderboard.slice(0, 3).map((entry: any, index: number) => (
                  <div 
                    key={entry.playerId}
                    className={`flex-shrink-0 text-center p-3 rounded-lg ${
                      index === 0 ? 'bg-yellow-500/20' : 
                      index === 1 ? 'bg-gray-400/20' : 
                      'bg-amber-700/20'
                    }`}
                  >
                    <div className={`text-2xl mb-1 ${
                      index === 0 ? 'text-yellow-700 dark:text-yellow-400' : 
                      index === 1 ? 'text-muted-foreground' : 
                      'text-amber-600'
                    }`}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                    <p className="text-foreground font-semibold">{entry.points.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? 'نقطة' : 'pts'}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rewards Grid */}
      {selectedPlayer && (
        <div className="container py-4 pb-8">
          <h2 className="text-foreground font-semibold mb-4 flex items-center gap-2">
            <Gift className="h-5 w-5 text-cyan-700 dark:text-cyan-400" />
            {isRTL ? 'المكافآت المتاحة' : 'Available Rewards'}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {mockRewards.map((reward: any) => {
              const canAfford = mockPoints.points >= reward.pointsCost;
              return (
                <Card 
                  key={reward.id}
                  className={`bg-card/50 border-border cursor-pointer transition-all hover:scale-105 ${
                    !canAfford ? 'opacity-60' : ''
                  }`}
                  onClick={() => {
                    if (canAfford) {
                      setSelectedReward(reward);
                      setShowConfirmDialog(true);
                    } else {
                      toast.error(isRTL ? 'نقاط غير كافية' : 'Insufficient points');
                    }
                  }}
                >
                  <CardContent className="p-4">
                    <div className={`w-10 h-10 rounded-full ${getCategoryColor(reward.category)} flex items-center justify-center text-white mb-3`}>
                      {getCategoryIcon(reward.category)}
                    </div>
                    <h3 className="text-foreground font-semibold text-sm mb-1">
                      {isRTL ? reward.nameAr : reward.name}
                    </h3>
                    <p className="text-muted-foreground text-xs mb-2 line-clamp-2">
                      {reward.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-yellow-700 dark:text-yellow-400 font-bold flex items-center gap-1">
                        <Coins className="h-4 w-4" />
                        {reward.pointsCost}
                      </span>
                      {reward.stock <= 5 && (
                        <Badge variant="outline" className="text-red-600 dark:text-red-400 border-red-400 text-xs">
                          {reward.stock} {isRTL ? 'متبقي' : 'left'}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'تأكيد الاستبدال' : 'Confirm Redemption'}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedReward && (
                <>
                  {isRTL 
                    ? `هل تريد استبدال ${selectedReward.pointsCost} نقطة مقابل "${selectedReward.nameAr}"؟`
                    : `Redeem ${selectedReward.pointsCost} points for "${selectedReward.name}"?`
                  }
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleRedeem}
              disabled={redeemMutation.isPending || (selectedReward && mockPoints.points < selectedReward.pointsCost)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              {redeemMutation.isPending 
                ? (isRTL ? 'جاري...' : 'Processing...') 
                : (isRTL ? 'استبدال' : 'Redeem')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
