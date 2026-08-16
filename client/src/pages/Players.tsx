import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { Search, Plus, Filter, User, Activity, Brain, Dumbbell, Apple, ArrowLeft, Camera, Loader2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useLocation, useSearch } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { BackButton } from '@/components/BackButton';
import { StaggerContainer, StaggerItem } from '@/components/PageTransition';

function PlayerCard({ player }: { player: any }) {
  const [, setLocation] = useLocation();
  
  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'badge-active',
      injured: 'badge-injured',
      trial: 'badge-trial',
      inactive: 'badge-inactive',
    };
    return badges[status] || badges.inactive;
  };

  const getPositionColor = (position: string) => {
    const colors: Record<string, string> = {
      goalkeeper: 'bg-chart-3/20 text-chart-3',
      defender: 'bg-chart-4/20 text-chart-4',
      midfielder: 'bg-primary/20 text-primary',
      forward: 'bg-destructive/20 text-destructive',
    };
    return colors[position] || 'bg-muted text-muted-foreground';
  };

  return (
    <Card className="card-hover cursor-pointer" onClick={() => setLocation(`/player/${player.id}`)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="player-avatar bg-primary/20 text-primary">
            {player.firstName?.charAt(0)}{player.lastName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{player.firstName} {player.lastName}</h3>
              {player.jerseyNumber && (
                <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">#{player.jerseyNumber}</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getPositionColor(player.position)}`}>
                {player.position}
              </span>
              <span className={getStatusBadge(player.status)}>
                {player.status}
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {player.ageGroup && <span>{player.ageGroup}</span>}
              {player.preferredFoot && <span>{player.preferredFoot} foot</span>}
              {player.academyCode && (
                <span className="font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded text-xs">
                  {player.academyCode}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <Activity className="h-4 w-4 mx-auto text-primary mb-1" />
            <div className="text-xs text-muted-foreground">Technical</div>
          </div>
          <div className="text-center">
            <Dumbbell className="h-4 w-4 mx-auto text-chart-2 mb-1" />
            <div className="text-xs text-muted-foreground">Physical</div>
          </div>
          <div className="text-center">
            <Brain className="h-4 w-4 mx-auto text-chart-3 mb-1" />
            <div className="text-xs text-muted-foreground">Mental</div>
          </div>
          <div className="text-center">
            <Apple className="h-4 w-4 mx-auto text-chart-4 mb-1" />
            <div className="text-xs text-muted-foreground">Nutrition</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AddPlayerDialog() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'medical'>('basic');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    position: 'midfielder' as const,
    preferredFoot: 'right' as const,
    ageGroup: '',
    jerseyNumber: '',
    height: '',
    weight: '',
    nationality: '',
    phone: '',
    bio: '',
    photoUrl: '',
  });
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await fetch('/api/upload-avatar', { method: 'POST', credentials: 'include', body: fd });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFormData(prev => ({ ...prev, photoUrl: data.url || '' }));
      toast.success('Photo uploaded');
    } catch { toast.error('Failed to upload photo'); }
    finally { setPhotoUploading(false); }
  };
  const [medicalData, setMedicalData] = useState({
    bloodType: '',
    allergies: '',
    chronicConditions: '',
    emergencyContact: '',
    notes: '',
  });

  const utils = trpc.useUtils();
  const createPlayer = trpc.players.create.useMutation();

  const saveMedical = trpc.medical.saveMedicalData.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await createPlayer.mutateAsync({
        ...formData,
        jerseyNumber: formData.jerseyNumber ? parseInt(formData.jerseyNumber) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        nationality: formData.nationality || undefined,
        phone: formData.phone || undefined,
        bio: formData.bio || undefined,
        photoUrl: formData.photoUrl || undefined,
      });
      // Save medical data if any fields filled
      const hasMedical = Object.values(medicalData).some(v => v.trim() !== '');
      if (hasMedical && result?.id) {
        await saveMedical.mutateAsync({ playerId: result.id, ...medicalData }).catch(() => {});
      }
      toast.success('Player added successfully');
      utils.players.getAll.invalidate();
      setOpen(false);
      setFormData({ firstName: '', lastName: '', dateOfBirth: '', position: 'midfielder', preferredFoot: 'right', ageGroup: '', jerseyNumber: '', height: '', weight: '', nationality: '', phone: '', bio: '', photoUrl: '' });
      setMedicalData({ bloodType: '', allergies: '', chronicConditions: '', emergencyContact: '', notes: '' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add player');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gradient-primary text-primary-foreground">
          <Plus className="h-4 w-4 mr-2" />
          Add Player
        </Button>
      </DialogTrigger>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Player</DialogTitle>
          <DialogDescription>
            Enter the player's information to add them to the academy.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Photo Upload */}
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-full overflow-hidden bg-muted border-2 border-border flex items-center justify-center">
                {formData.photoUrl ? (
                  <img src={formData.photoUrl} alt="Player" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-7 w-7 text-muted-foreground" />
                )}
                <button type="button" onClick={() => photoInputRef.current?.click()} disabled={photoUploading}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-full">
                  {photoUploading ? <Loader2 className="h-4 w-4 text-foreground animate-spin" /> : <Camera className="h-4 w-4 text-foreground" />}
                </button>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground">Player Photo</p>
                <p>Click the circle to upload (max 5MB)</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="jerseyNumber">Jersey Number</Label>
                <Input
                  id="jerseyNumber"
                  type="number"
                  value={formData.jerseyNumber}
                  onChange={(e) => setFormData({ ...formData, jerseyNumber: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value: any) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                    <SelectItem value="defender">Defender</SelectItem>
                    <SelectItem value="midfielder">Midfielder</SelectItem>
                    <SelectItem value="forward">Forward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="preferredFoot">Preferred Foot</Label>
                <Select
                  value={formData.preferredFoot}
                  onValueChange={(value: any) => setFormData({ ...formData, preferredFoot: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Height, Weight, Nationality, Phone */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input type="number" placeholder="e.g. 175" value={formData.height} onChange={e => setFormData({...formData, height: e.target.value})} min={100} max={220} />
              </div>
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" placeholder="e.g. 70" value={formData.weight} onChange={e => setFormData({...formData, weight: e.target.value})} min={30} max={150} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nationality</Label>
                <Input placeholder="e.g. Egyptian" value={formData.nationality} onChange={e => setFormData({...formData, nationality: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" placeholder="e.g. 01012345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ageGroup">Age Group</Label>
              <Select
                value={formData.ageGroup}
                onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="U8">U8</SelectItem>
                  <SelectItem value="U10">U10</SelectItem>
                  <SelectItem value="U12">U12</SelectItem>
                  <SelectItem value="U14">U14</SelectItem>
                  <SelectItem value="U16">U16</SelectItem>
                  <SelectItem value="U18">U18</SelectItem>
                  <SelectItem value="U21">U21</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label>Bio / Notes (Optional)</Label>
              <Textarea placeholder="Brief description about the player..." value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="resize-none h-16" />
            </div>
          {/* Medical Section Toggle */}
          <div className="border-t border-gray-200 pt-3">
            <button type="button"
              onClick={() => setActiveSection(activeSection === 'medical' ? 'basic' : 'medical')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
              {activeSection === 'medical' ? '▲ Hide Medical Info' : '▼ Add Medical Info (Optional)'}
            </button>
          </div>

          {activeSection === 'medical' && (
            <div className="grid gap-3 py-2 border border-blue-100 rounded-lg p-3 bg-blue-50/30">
              <p className="text-xs text-muted-foreground">Medical data will be saved to the player's medical profile.</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Blood Type</Label>
                  <Select value={medicalData.bloodType} onValueChange={(v) => setMedicalData({...medicalData, bloodType: v})}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => <SelectItem key={bt} value={bt}>{bt}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Emergency Contact</Label>
                  <Input className="h-8 text-xs" placeholder="Name & phone" value={medicalData.emergencyContact} onChange={(e) => setMedicalData({...medicalData, emergencyContact: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Known Allergies</Label>
                <Input className="h-8 text-xs" placeholder="e.g. Penicillin, Pollen" value={medicalData.allergies} onChange={(e) => setMedicalData({...medicalData, allergies: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Chronic Conditions</Label>
                <Input className="h-8 text-xs" placeholder="e.g. Asthma, Diabetes" value={medicalData.chronicConditions} onChange={(e) => setMedicalData({...medicalData, chronicConditions: e.target.value})} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Medical Notes</Label>
                <Input className="h-8 text-xs" placeholder="Any other notes" value={medicalData.notes} onChange={(e) => setMedicalData({...medicalData, notes: e.target.value})} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPlayer.isPending}>
              {createPlayer.isPending ? 'Adding...' : 'Add Player'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function Players() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const { language } = useLanguage();
  
  // Get team type from URL query parameter
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const teamType = params.get('team') as 'main' | 'academy' | null;
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  // Fetch all teams of the given type for the team selector
  const { data: teamsOfType } = trpc.teams.getByType.useQuery(
    { teamType: teamType! },
    { enabled: !!teamType }
  );

  // Fetch players based on selected team or team type
  const { data: allPlayers, isLoading: allLoading } = trpc.players.getAll.useQuery(
    undefined,
    { enabled: !teamType }
  );
  const { data: teamTypePlayers, isLoading: typeLoading } = trpc.players.getByTeamType.useQuery(
    { teamType: teamType! },
    { enabled: !!teamType && !selectedTeamId }
  );
  const { data: specificTeamPlayers, isLoading: specificLoading } = trpc.teams.getPlayers.useQuery(
    { teamId: selectedTeamId! },
    { enabled: !!selectedTeamId }
  );

  const players = selectedTeamId ? specificTeamPlayers : (teamType ? teamTypePlayers : allPlayers);
  const isLoading = selectedTeamId ? specificLoading : (teamType ? typeLoading : allLoading);

  const selectedTeamName = teamsOfType?.find((t: any) => t.id === selectedTeamId)?.name;
  const pageTitle = selectedTeamName
    ? selectedTeamName
    : teamType === 'main'
    ? (language === 'ar' ? 'لاعبي الفريق الأول' : 'Main Team Players')
    : teamType === 'academy'
    ? (language === 'ar' ? 'لاعبي الأكاديمية' : 'Academy Team Players')
    : (language === 'ar' ? 'جميع اللاعبين' : 'All Players');

  const filteredPlayers = players?.filter((player) => {
    const matchesSearch = 
      player.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.lastName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = positionFilter === 'all' || player.position === positionFilter;
    const matchesStatus = statusFilter === 'all' || player.status === statusFilter;
    return matchesSearch && matchesPosition && matchesStatus;
  });

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            
              <BackButton />
<h1 className="text-2xl font-bold tracking-tight">{pageTitle}</h1>
            <p className="text-muted-foreground">
              {teamType 
                ? (language === 'ar' ? `إدارة وتتبع لاعبي ${teamType === 'main' ? 'الفريق الأول' : 'الأكاديمية'}` : `Manage and track ${teamType === 'main' ? 'main team' : 'academy'} players`)
                : (language === 'ar' ? 'إدارة وتتبع جميع لاعبي الأكاديمية' : 'Manage and track all academy players')}
            </p>
          </div>
          <AddPlayerDialog />
        </div>

        {/* Arabic description banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm" dir="rtl">
          <p className="font-semibold text-green-800 text-right">⚽ {language === 'ar' ? 'إدارة اللاعبين' : 'إدارة اللاعبين | Player Management'}</p>
          <p className="text-green-700 text-right text-xs mt-1">
            {language === 'ar'
              ? 'هنا يمكنك عرض وإدارة جميع اللاعبين — اضغط على بطاقة اللاعب لعرض تفاصيله، أو اضغط على إضافة لاعب لإضافة لاعب جديد'
              : 'عرض وإدارة جميع اللاعبين | اضغط على بطاقة اللاعب لعرض تفاصيله | اضغط على إضافة لاعب لإضافة لاعب جديد'}
          </p>
        </div>

        {/* Team Selector - only shown when teamType is set */}
        {teamType && teamsOfType && teamsOfType.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                  {language === 'ar' ? 'اختر الفريق:' : 'Filter by Team:'}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedTeamId(null)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      !selectedTeamId ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                    }`}
                  >
                    {language === 'ar' ? 'الكل' : 'All Teams'}
                  </button>
                  {teamsOfType.map((team: any) => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedTeamId === team.id ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {team.name}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                  <SelectItem value="defender">Defender</SelectItem>
                  <SelectItem value="midfielder">Midfielder</SelectItem>
                  <SelectItem value="forward">Forward</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="injured">Injured</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Players Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPlayers && filteredPlayers.length > 0 ? (
          <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPlayers.map((player) => (
              <StaggerItem key={player.id}>
                <PlayerCard player={player} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No players found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || positionFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Add your first player to get started'}
              </p>
              {!searchQuery && positionFilter === 'all' && statusFilter === 'all' && (
                <AddPlayerDialog />
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
