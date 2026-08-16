import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, CheckCircle2, ArrowRight, Users, ArrowLeft} from 'lucide-react';
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

export default function ParentOnboarding() {
  const [, navigate] = useLocation();
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  const utils = trpc.useUtils();
  const { data: allPlayers, isLoading } = trpc.players.getAll.useQuery();
  
  const linkParentMutation = trpc.parentRelations.link.useMutation({
    onSuccess: () => {
      toast.success("Successfully linked to player!");
      setConfirmDialogOpen(false);
      // Redirect to dashboard after successful linking
      setTimeout(() => {
        setLocation("/dashboard");
      }, 1500);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to link to player");
    },
  });

  const completeOnboardingMutation = trpc.users.completeOnboarding.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
  });

  // Filter players based on search query
  const filteredPlayers = allPlayers?.filter(player => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
    const jerseyNumber = player.jerseyNumber?.toString() || "";
    const ageGroup = player.ageGroup?.toLowerCase() || "";
    
    return fullName.includes(query) || 
           jerseyNumber.includes(query) || 
           ageGroup.includes(query);
  }) || [];

  const handleLinkPlayer = async () => {
    if (!selectedPlayer) return;

    try {
      await linkParentMutation.mutateAsync({
        playerId: selectedPlayer.id,
        relationship: "parent",
        isPrimary: true,
      });

      // Mark onboarding as complete
      await completeOnboardingMutation.mutateAsync();
    } catch (error) {
      console.error("Error linking player:", error);
    }
  };

  const getPositionLabel = (position: string) => {
    const labels: Record<string, string> = {
      goalkeeper: "Goalkeeper",
      defender: "Defender",
      midfielder: "Midfielder",
      forward: "Forward",
    };
    return labels[position] || position;
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      goalkeeper: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500",
      defender: "bg-blue-500/10 text-blue-500 border-blue-500",
      midfielder: "bg-green-500/10 text-green-700 dark:text-green-500 border-green-500",
      forward: "bg-red-500/10 text-red-500 border-red-500",
    };
    return colors[position] || "bg-slate-500/10 text-muted-foreground border-slate-500";
  };

  return (
    <div >
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="container py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-foreground" />
            </div>
            <div>
              
              <BackButton />
<h1 className="text-2xl font-bold text-foreground">Welcome to Future Stars Academy</h1>
              <p className="text-muted-foreground">Let's connect you with your child's profile</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-6xl">
        {/* Welcome Card */}
        <Card className="bg-card border-border mb-6">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-700 dark:text-emerald-500" />
              Your Account Has Been Approved!
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              To get started, please search for and link your child's player profile. This will allow you to:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-500" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Track Performance</p>
                  <p className="text-sm text-muted-foreground">View detailed performance metrics and progress</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-500" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Monitor Attendance</p>
                  <p className="text-sm text-muted-foreground">Stay updated on training and match attendance</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-500" />
                </div>
                <div>
                  <p className="text-foreground font-medium">Receive Updates</p>
                  <p className="text-sm text-muted-foreground">Get notifications about your child's development</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-500" />
                </div>
                <div>
                  <p className="text-foreground font-medium">View Nutrition Plans</p>
                  <p className="text-sm text-muted-foreground">Access personalized meal plans and nutrition logs</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Section */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Find Your Child's Profile</CardTitle>
            <CardDescription className="text-muted-foreground">
              Search by name, jersey number, or age group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Label htmlFor="search" className="text-foreground mb-2">Search Players</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="search"
                  type="text"
                  placeholder="e.g., Mohamed Ali, #10, U12..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-muted border-border text-foreground pl-10"
                />
              </div>
            </div>

            {/* Players Grid */}
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading players...</div>
            ) : filteredPlayers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No players found</p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Try a different search term" : "No players available in the system"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlayers.map((player) => (
                  <Card
                    key={player.id}
                    className="bg-muted border-border hover:border-emerald-500 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedPlayer(player);
                      setConfirmDialogOpen(true);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        {player.photoUrl ? (
                          <img
                            src={player.photoUrl}
                            alt={`${player.firstName} ${player.lastName}`}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center">
                            <Users className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-foreground font-semibold truncate">
                            {player.firstName} {player.lastName}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {player.jerseyNumber && (
                              <Badge variant="outline" className="bg-muted text-muted-foreground border-slate-500">
                                #{player.jerseyNumber}
                              </Badge>
                            )}
                            {player.ageGroup && (
                              <Badge variant="outline" className="bg-muted text-muted-foreground border-slate-500">
                                {player.ageGroup}
                              </Badge>
                            )}
                          </div>
                          <div className="mt-2">
                            <Badge variant="outline" className={getPositionColor(player.position)}>
                              {getPositionLabel(player.position)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 border-emerald-600 text-emerald-700 dark:text-emerald-500 hover:bg-emerald-600 hover:text-white"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Link to This Player
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Confirm Player Link</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Are you sure you want to link your account to this player?
              </DialogDescription>
            </DialogHeader>
            {selectedPlayer && (
              <div className="py-4">
                <Card className="bg-muted border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {selectedPlayer.photoUrl ? (
                        <img
                          src={selectedPlayer.photoUrl}
                          alt={`${selectedPlayer.firstName} ${selectedPlayer.lastName}`}
                          className="w-20 h-20 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-slate-600 rounded-full flex items-center justify-center">
                          <Users className="w-10 h-10 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-foreground">
                          {selectedPlayer.firstName} {selectedPlayer.lastName}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          {selectedPlayer.jerseyNumber && (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-slate-500">
                              #{selectedPlayer.jerseyNumber}
                            </Badge>
                          )}
                          {selectedPlayer.ageGroup && (
                            <Badge variant="outline" className="bg-muted text-muted-foreground border-slate-500">
                              {selectedPlayer.ageGroup}
                            </Badge>
                          )}
                          <Badge variant="outline" className={getPositionColor(selectedPlayer.position)}>
                            {getPositionLabel(selectedPlayer.position)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmDialogOpen(false)}
                disabled={linkParentMutation.isPending}
                className="border-border text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLinkPlayer}
                disabled={linkParentMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {linkParentMutation.isPending ? (
                  "Linking..."
                ) : (
                  <>
                    Confirm & Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
