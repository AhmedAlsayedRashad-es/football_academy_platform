import { useState } from "react";
import { useLocation } from 'wouter';
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { BackButton } from '@/components/BackButton';
import {
  Search, Filter, Users, Trophy, Shield, ArrowUpDown, 
  ChevronUp, ChevronDown, UserCheck, AlertCircle, ArrowLeft} from 'lucide-react';

interface Player {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  ageGroup: string | null;
  teamId: number | null;
  status: string | null;
  photoUrl: string | null;
}

interface Team {
  id: number;
  name: string;
  ageGroup: string;
  teamType: string | null;
}

export default function TeamAssignment() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTeamId, setNewTeamId] = useState<string>("");

  const { data: players, refetch: refetchPlayers } = trpc.players.getAll.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();

  const updatePlayerTeam = trpc.players.updateTeam.useMutation({
    onSuccess: () => {
      toast({
        title: isRTL ? "تم التحديث" : "Updated",
        description: isRTL ? "تم تحديث فريق اللاعب بنجاح" : "Player team assignment updated successfully",
      });
      refetchPlayers();
      setIsDialogOpen(false);
      setSelectedPlayer(null);
      setNewTeamId("");
    },
    onError: (error) => {
      toast({
        title: isRTL ? "خطأ" : "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAssignTeam = () => {
    if (!selectedPlayer || !newTeamId) return;
    updatePlayerTeam.mutate({ 
      playerId: selectedPlayer.id, 
      teamId: newTeamId === "none" ? null : parseInt(newTeamId) 
    });
  };

  const openAssignDialog = (player: Player) => {
    setSelectedPlayer(player);
    setNewTeamId(player.teamId?.toString() || "none");
    setIsDialogOpen(true);
  };

  const getTeamById = (teamId: number | null) => {
    if (!teamId || !teams) return null;
    return teams.find(t => t.id === teamId);
  };

  const getTeamTypeBadge = (teamType: string | null) => {
    if (teamType === 'main') {
      return (
        <Badge className="bg-gold text-foreground">
          <Trophy className="w-3 h-3 mr-1" />
          {isRTL ? 'الفريق الأول' : 'Main Team'}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-blue-500 text-blue-600">
        <Shield className="w-3 h-3 mr-1" />
        {isRTL ? 'الأكاديمية' : 'Academy'}
      </Badge>
    );
  };

  const getPositionLabel = (position: string) => {
    const positions: Record<string, { en: string; ar: string }> = {
      goalkeeper: { en: 'Goalkeeper', ar: 'حارس مرمى' },
      defender: { en: 'Defender', ar: 'مدافع' },
      midfielder: { en: 'Midfielder', ar: 'وسط' },
      forward: { en: 'Forward', ar: 'مهاجم' },
    };
    return positions[position]?.[isRTL ? 'ar' : 'en'] || position;
  };

  const filteredPlayers = players?.filter((player) => {
    const matchesSearch = 
      player.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTeam = teamFilter === "all" || 
      (teamFilter === "none" && !player.teamId) ||
      (player.teamId?.toString() === teamFilter);
    
    const matchesPosition = positionFilter === "all" || player.position === positionFilter;
    
    return matchesSearch && matchesTeam && matchesPosition;
  });

  // Group teams by type
  const mainTeams = teams?.filter(t => t.teamType === 'main') || [];
  const academyTeams = teams?.filter(t => t.teamType === 'academy' || !t.teamType) || [];

  // Stats
  const totalPlayers = players?.length || 0;
  const mainTeamPlayers = players?.filter(p => {
    const team = getTeamById(p.teamId);
    return team?.teamType === 'main';
  }).length || 0;
  const academyPlayers = players?.filter(p => {
    const team = getTeamById(p.teamId);
    return team?.teamType === 'academy' || (p.teamId && !team?.teamType);
  }).length || 0;
  const unassignedPlayers = players?.filter(p => !p.teamId).length || 0;

  return (
    <>
    <div className={`container mx-auto p-6 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'إجمالي اللاعبين' : 'Total Players'}</p>
                <p className="text-2xl font-bold">{totalPlayers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gold-light dark:bg-gold rounded-lg">
                <Trophy className="w-5 h-5 text-gold dark:text-gold" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'الفريق الأول' : 'Main Team'}</p>
                <p className="text-2xl font-bold">{mainTeamPlayers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'الأكاديمية' : 'Academy'}</p>
                <p className="text-2xl font-bold">{academyPlayers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{isRTL ? 'غير معين' : 'Unassigned'}</p>
                <p className="text-2xl font-bold">{unassignedPlayers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          
          <BackButton />
<CardTitle className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="w-6 h-6" />
            {isRTL ? 'تعيين الفرق' : 'Team Assignment'}
          </CardTitle>
          <CardDescription>
            {isRTL 
              ? 'قم بتعيين اللاعبين إلى الفريق الأول أو فريق الأكاديمية'
              : 'Assign players to Main Team or Academy Team'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 h-4 w-4 text-muted-foreground`} />
              <Input
                placeholder={isRTL ? 'البحث بالاسم' : 'Search by name'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={isRTL ? 'pr-10' : 'pl-10'}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={isRTL ? 'اختر الفريق' : 'Select Team'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'جميع الفرق' : 'All Teams'}</SelectItem>
                  <SelectItem value="none">{isRTL ? 'غير معين' : 'Unassigned'}</SelectItem>
                  {teams?.map((team) => (
                    <SelectItem key={team.id} value={team.id.toString()}>
                      {team.name} ({team.teamType === 'main' ? (isRTL ? 'أول' : 'Main') : (isRTL ? 'أكاديمية' : 'Academy')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder={isRTL ? 'المركز' : 'Position'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? 'جميع المراكز' : 'All Positions'}</SelectItem>
                  <SelectItem value="goalkeeper">{isRTL ? 'حارس مرمى' : 'Goalkeeper'}</SelectItem>
                  <SelectItem value="defender">{isRTL ? 'مدافع' : 'Defender'}</SelectItem>
                  <SelectItem value="midfielder">{isRTL ? 'وسط' : 'Midfielder'}</SelectItem>
                  <SelectItem value="forward">{isRTL ? 'مهاجم' : 'Forward'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isRTL ? 'اللاعب' : 'Player'}</TableHead>
                  <TableHead>{isRTL ? 'المركز' : 'Position'}</TableHead>
                  <TableHead>{isRTL ? 'الفئة العمرية' : 'Age Group'}</TableHead>
                  <TableHead>{isRTL ? 'الفريق الحالي' : 'Current Team'}</TableHead>
                  <TableHead>{isRTL ? 'نوع الفريق' : 'Team Type'}</TableHead>
                  <TableHead className="text-right">{isRTL ? 'الإجراءات' : 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      {isRTL ? 'لا يوجد لاعبون' : 'No players found'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlayers?.map((player) => {
                    const team = getTeamById(player.teamId);
                    return (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-card flex items-center justify-center text-foreground font-bold">
                              {player.firstName[0]}{player.lastName[0]}
                            </div>
                            <div>
                              <p className="font-semibold">{player.firstName} {player.lastName}</p>
                              <p className="text-xs text-muted-foreground">ID: {player.id}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{getPositionLabel(player.position)}</Badge>
                        </TableCell>
                        <TableCell>{player.ageGroup || '-'}</TableCell>
                        <TableCell>
                          {team ? (
                            <span className="font-medium">{team.name}</span>
                          ) : (
                            <span className="text-muted-foreground italic">
                              {isRTL ? 'غير معين' : 'Unassigned'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {team ? getTeamTypeBadge(team.teamType) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              {isRTL ? 'لا يوجد' : 'None'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openAssignDialog(player)}
                            className="gap-1"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                            {isRTL ? 'تعيين' : 'Assign'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              {isRTL ? 'تعيين الفريق' : 'Assign Team'}
            </DialogTitle>
            <DialogDescription>
              {isRTL 
                ? `تعيين ${selectedPlayer?.firstName} ${selectedPlayer?.lastName} إلى فريق`
                : `Assign ${selectedPlayer?.firstName} ${selectedPlayer?.lastName} to a team`}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPlayer && (
            <div className="space-y-4 py-4">
              {/* Player Info */}
              <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-muted to-card flex items-center justify-center text-foreground font-bold text-lg">
                  {selectedPlayer.firstName[0]}{selectedPlayer.lastName[0]}
                </div>
                <div>
                  <p className="font-semibold">{selectedPlayer.firstName} {selectedPlayer.lastName}</p>
                  <p className="text-sm text-muted-foreground">
                    {getPositionLabel(selectedPlayer.position)} • {selectedPlayer.ageGroup || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Team Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {isRTL ? 'اختر الفريق' : 'Select Team'}
                </label>
                <select
                  value={newTeamId}
                  onChange={e => setNewTeamId(e.target.value)}
                  className="w-full h-10 px-3 py-2 text-sm border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>{isRTL ? 'اختر فريقاً...' : 'Choose a team...'}</option>
                  <option value="none">{isRTL ? 'بدون فريق' : 'No Team'}</option>
                  {mainTeams.length > 0 && (
                    <optgroup label={isRTL ? 'الفريق الأول' : 'Main Teams'}>
                      {mainTeams.map((team: any) => (
                        <option key={team.id} value={team.id.toString()}>{team.name} ({team.ageGroup})</option>
                      ))}
                    </optgroup>
                  )}
                  {academyTeams.length > 0 && (
                    <optgroup label={isRTL ? 'فرق الأكاديمية' : 'Academy Teams'}>
                      {academyTeams.map((team: any) => (
                        <option key={team.id} value={team.id.toString()}>{team.name} ({team.ageGroup})</option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              {/* Promotion/Demotion Indicator */}
              {selectedPlayer.teamId && newTeamId && newTeamId !== "none" && (
                <div className="p-3 rounded-lg bg-muted">
                  {(() => {
                    const currentTeam = getTeamById(selectedPlayer.teamId);
                    const targetTeam = teams?.find(t => t.id === parseInt(newTeamId));
                    
                    if (currentTeam?.teamType === 'academy' && targetTeam?.teamType === 'main') {
                      return (
                        <div className="flex items-center gap-2 text-green-600">
                          <ChevronUp className="w-5 h-5" />
                          <span className="font-medium">
                            {isRTL ? 'ترقية إلى الفريق الأول' : 'Promotion to Main Team'}
                          </span>
                        </div>
                      );
                    } else if (currentTeam?.teamType === 'main' && targetTeam?.teamType === 'academy') {
                      return (
                        <div className="flex items-center gap-2 text-orange-600">
                          <ChevronDown className="w-5 h-5" />
                          <span className="font-medium">
                            {isRTL ? 'نقل إلى الأكاديمية' : 'Move to Academy'}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleAssignTeam}
              disabled={updatePlayerTeam.isPending}
            >
              {updatePlayerTeam.isPending 
                ? (isRTL ? 'جاري الحفظ...' : 'Saving...') 
                : (isRTL ? 'حفظ التعيين' : 'Save Assignment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
