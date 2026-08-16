import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft, ChevronLeft, ChevronRight, Plus, Calendar,
  Trophy, Shield, Swords, Star, MapPin, Edit, Trash2, Eye, Download, ExternalLink
} from 'lucide-react';

// iCal export utility
function generateICalEvent(match: any): string {
  const date = new Date(match.matchDate);
  const dateStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const title = match.opponent ? `vs ${match.opponent}` : 'Match';
  const location = match.venue || 'Future Stars FC Training Ground';
  const uid = `match-${match.id}@futurestars-academy.com`;
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${dateStr}`,
    `DTEND:${endDateStr}`,
    `SUMMARY:${(match.matchType || 'MATCH').toUpperCase()} - ${title}`,
    `LOCATION:${location}`,
    `DESCRIPTION:${match.notes || 'Future Stars Academy Match'}`,
    'END:VEVENT',
  ].join('\r\n');
}

function downloadICalFile(matches: any[], filename: string) {
  const events = matches.map(generateICalEvent).join('\r\n');
  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Future Stars Academy//Football Schedule//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Future Stars Academy Schedule',
    'X-WR-TIMEZONE:Africa/Cairo',
    events,
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ical], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getGoogleCalendarUrl(match: any): string {
  const date = new Date(match.matchDate);
  const startStr = date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = new Date(date.getTime() + 2 * 60 * 60 * 1000);
  const endStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const title = encodeURIComponent(`${(match.matchType || 'MATCH').toUpperCase()} - vs ${match.opponent || 'TBD'}`);
  const location = encodeURIComponent(match.venue || 'Future Stars FC Training Ground');
  const details = encodeURIComponent(match.notes || 'Future Stars Academy Match');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&location=${location}&details=${details}`;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MATCH_TYPE_CONFIG = {
  friendly: { label: 'Friendly', color: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30', icon: Swords },
  league: { label: 'League', color: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30', icon: Trophy },
  cup: { label: 'Cup', color: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30', icon: Star },
  tournament: { label: 'Tournament', color: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30', icon: Shield },
  training_match: { label: 'Training Match', color: 'bg-gray-500/20 text-muted-foreground border-gray-500/30', icon: Calendar },
};

const RESULT_CONFIG = {
  win: { label: 'W', color: 'bg-green-500 text-white' },
  draw: { label: 'D', color: 'bg-yellow-500 text-black' },
  loss: { label: 'L', color: 'bg-red-500 text-white' },
};

const TRAINING_TYPE_CONFIG = {
  technical: { label: 'Technical', color: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/30' },
  tactical: { label: 'Tactical', color: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30' },
  physical: { label: 'Physical', color: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30' },
  recovery: { label: 'Recovery', color: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
  friendly_match: { label: 'Friendly Match', color: 'bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30' },
};

interface MatchFormData {
  teamId: string;
  matchDate: string;
  matchType: 'friendly' | 'league' | 'cup' | 'tournament' | 'training_match';
  opponent: string;
  venue: string;
  isHome: boolean;
  teamScore: string;
  opponentScore: string;
  result: 'win' | 'draw' | 'loss' | '';
  notes: string;
  competitionName: string;
}

interface TrainingSession {
  id: number;
  teamId: number;
  date: string;
  startTime: string;
  endTime: string;
  type: 'technical' | 'tactical' | 'physical' | 'recovery' | 'friendly_match';
  location?: string;
  notes?: string;
}

const DEFAULT_FORM: MatchFormData = {
  teamId: '',
  matchDate: '',
  matchType: 'league',
  opponent: '',
  venue: '',
  isHome: true,
  teamScore: '',
  opponentScore: '',
  result: '',
  notes: '',
  competitionName: '',
};

export default function TeamScheduleCalendar() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const isStaff = user?.role === 'admin' || user?.role === 'coach';

  const currentYear = new Date().getFullYear();
  const { t, language } = useLanguage();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedMatchType, setSelectedMatchType] = useState<string | null>(null);
  const [competitionFilter, setCompetitionFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'year' | 'month'>('year');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [formData, setFormData] = useState<MatchFormData>(DEFAULT_FORM);

  // Fetch teams
  const { data: teams = [] } = trpc.teams.getAll.useQuery();

  // Fetch matches for selected team
  const { data: allMatches = [], refetch: refetchMatches } = trpc.matches.getAll.useQuery();

  // Derive unique competition names from matches
  const competitionNames = Array.from(
    new Set(
      allMatches
        .map((m: any) => m.competitionName || m.competition_name)
        .filter(Boolean) as string[]
    )
  ).sort();

  // Filter matches by team, year, match type, and competition name
  const filteredMatches = allMatches.filter((match: any) => {
    const matchYear = new Date(match.matchDate).getFullYear();
    const matchesYear = matchYear === selectedYear;
    const matchesTeam = selectedTeamId === null || match.teamId === selectedTeamId;
    const matchesType = selectedMatchType === null || match.matchType === selectedMatchType;
    const compName = match.competitionName || match.competition_name || '';
    const matchesComp = !competitionFilter || compName.toLowerCase().includes(competitionFilter.toLowerCase());
    return matchesYear && matchesTeam && matchesType && matchesComp;
  });

  // Create match mutation
  const createMatch = trpc.matches.create.useMutation({
    onSuccess: () => {
      toast.success('Match added to schedule!');
      setShowCreateDialog(false);
      setFormData(DEFAULT_FORM);
      refetchMatches();
    },
    onError: (err) => toast.error(err.message || 'Failed to create match'),
  });

  // Update match mutation
  const updateMatch = trpc.matches.update.useMutation({
    onSuccess: () => {
      toast.success('Match updated!');
      setShowEditDialog(false);
      setSelectedMatch(null);
      refetchMatches();
    },
    onError: (err) => toast.error(err.message || 'Failed to update match'),
  });

  const handleCreateMatch = () => {
    if (!formData.matchDate || !formData.opponent) {
      toast.error('Please fill in date and opponent');
      return;
    }
    createMatch.mutate({
      teamId: formData.teamId ? parseInt(formData.teamId) : undefined,
      matchDate: formData.matchDate,
      matchType: formData.matchType,
      opponent: formData.opponent || undefined,
      venue: formData.venue || undefined,
      isHome: formData.isHome,
      teamScore: formData.teamScore ? parseInt(formData.teamScore) : undefined,
      opponentScore: formData.opponentScore ? parseInt(formData.opponentScore) : undefined,
      result: formData.result || undefined,
      notes: formData.notes || undefined,
      competitionName: formData.competitionName || undefined,
    });
  };

  const handleUpdateMatch = () => {
    if (!selectedMatch) return;
    updateMatch.mutate({
      id: selectedMatch.id,
      teamScore: formData.teamScore ? parseInt(formData.teamScore) : undefined,
      opponentScore: formData.opponentScore ? parseInt(formData.opponentScore) : undefined,
      result: formData.result || undefined,
      notes: formData.notes || undefined,
    });
  };

  const openEditDialog = (match: any) => {
    setSelectedMatch(match);
    setFormData({
      ...DEFAULT_FORM,
      teamScore: match.teamScore?.toString() || '',
      opponentScore: match.opponentScore?.toString() || '',
      result: match.result || '',
      notes: match.notes || '',
    });
    setShowEditDialog(true);
  };

  const openViewDialog = (match: any) => {
    setSelectedMatch(match);
    setShowViewDialog(true);
  };

  // Get matches for a specific month
  const getMatchesForMonth = (monthIndex: number) => {
    return filteredMatches.filter(match => {
      const matchDate = new Date(match.matchDate);
      return matchDate.getMonth() === monthIndex;
    }).sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());
  };

  // Get matches for a specific day in month view
  const getMatchesForDay = (day: number) => {
    return filteredMatches.filter(match => {
      const matchDate = new Date(match.matchDate);
      return matchDate.getMonth() === selectedMonth && matchDate.getDate() === day;
    });
  };

  // Get days in month for calendar grid
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Stats
  const stats = {
    total: filteredMatches.length,
    wins: filteredMatches.filter(m => m.result === 'win').length,
    draws: filteredMatches.filter(m => m.result === 'draw').length,
    losses: filteredMatches.filter(m => m.result === 'loss').length,
    upcoming: filteredMatches.filter(m => new Date(m.matchDate) > new Date()).length,
  };

  const MatchCard = ({ match, compact = false }: { match: any; compact?: boolean }) => {
    const typeConfig = MATCH_TYPE_CONFIG[match.matchType as keyof typeof MATCH_TYPE_CONFIG] || MATCH_TYPE_CONFIG.friendly;
    const TypeIcon = typeConfig.icon;
    const matchDate = new Date(match.matchDate);
    const isPast = matchDate < new Date();
    const resultConfig = match.result ? RESULT_CONFIG[match.result as keyof typeof RESULT_CONFIG] : null;

    if (compact) {
      return (
        <div
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-xs cursor-pointer hover:opacity-80 transition-opacity border ${typeConfig.color}`}
          onClick={() => openViewDialog(match)}
        >
          <TypeIcon className="w-3 h-3 flex-shrink-0" />
          <span className="truncate font-medium">{match.opponent || 'TBD'}</span>
          {resultConfig && (
            <span className={`ml-auto px-1 rounded text-xs font-bold ${resultConfig.color}`}>
              {resultConfig.label}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className={`p-3 rounded-lg border ${typeConfig.color} hover:opacity-90 transition-opacity`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TypeIcon className="w-4 h-4 flex-shrink-0" />
            <div className="min-w-0">
              <div className="font-semibold text-sm truncate">
                {match.isHome ? 'vs' : '@'} {match.opponent || 'TBD'}
              </div>
              <div className="text-xs opacity-75 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                {matchDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                {match.venue && (
                  <>
                    <MapPin className="w-3 h-3 ml-1" />
                    <span className="truncate">{match.venue}</span>
                  </>
                )}
              </div>
              {match.competitionName && (
                <div className="text-xs opacity-60 mt-0.5 flex items-center gap-1">
                  <Trophy className="w-3 h-3" />
                  <span className="truncate">{match.competitionName}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {resultConfig ? (
              <div className="text-center">
                <div className={`px-2 py-0.5 rounded text-xs font-bold ${resultConfig.color}`}>
                  {match.teamScore}-{match.opponentScore}
                </div>
              </div>
            ) : (
              <Badge variant="outline" className="text-xs opacity-75">
                {isPast ? 'Played' : 'Upcoming'}
              </Badge>
            )}
            <div className="flex gap-1">
              <button
                onClick={() => openViewDialog(match)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              {isStaff && (
                <button
                  onClick={() => openEditDialog(match)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="p-4 md:p-6 space-y-6">
        {/* Header */}
        <div>
          <button
            onClick={() => navigate('/matches')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Team Schedule Calendar</h1>
              <p className="text-muted-foreground mt-1">Full year view of matches, tournaments, and fixtures</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => {
                  if (filteredMatches.length === 0) {
                    toast.error('No matches to export');
                    return;
                  }
                  downloadICalFile(filteredMatches, `futurestars-schedule-${selectedYear}.ics`);
                  toast.success(`Exported ${filteredMatches.length} matches as iCal file`);
                }}
                className="border-green-600 text-green-700 dark:text-green-400 hover:bg-green-900/30"
                title="Download iCal file for Apple Calendar / Outlook"
              >
                <Download className="w-4 h-4 mr-2" />
                Export iCal
              </Button>
              {isStaff && (
                <Button
                  onClick={() => {
                    setFormData({ ...DEFAULT_FORM, matchDate: new Date().toISOString().split('T')[0] });
                    setShowCreateDialog(true);
                  }}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Match
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Year selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedYear(y => y - 1)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-bold text-lg min-w-[60px] text-center">{selectedYear}</span>
            <button
              onClick={() => setSelectedYear(y => y + 1)}
              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Team filter */}
          <Select
            value={selectedTeamId?.toString() || 'all'}
            onValueChange={(v) => setSelectedTeamId(v === 'all' ? null : parseInt(v))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View mode toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              onClick={() => setViewMode('year')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'year' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              Year
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === 'month' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Match Type Filter Chips */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedMatchType(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              selectedMatchType === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            All Types
          </button>
          {Object.entries(MATCH_TYPE_CONFIG).map(([type, config]) => {
            const Icon = config.icon;
            const isActive = selectedMatchType === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedMatchType(isActive ? null : type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  isActive
                    ? config.color + ' border-current'
                    : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                }`}
              >
                <Icon className="w-3 h-3" />
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Competition Name Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Trophy className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Filter by competition name…"
              value={competitionFilter}
              onChange={e => setCompetitionFilter(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
            {competitionFilter && (
              <button
                onClick={() => setCompetitionFilter('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <span className="text-xs">×</span>
              </button>
            )}
          </div>
          {/* Quick-pick competition chips (from existing matches) */}
          {competitionNames.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {competitionNames.slice(0, 6).map((name: string) => (
                <button
                  key={name}
                  onClick={() => setCompetitionFilter(competitionFilter === name ? '' : name)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                    competitionFilter === name
                      ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                      : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'Total Matches', value: stats.total, color: 'text-blue-500' },
            { label: 'Wins', value: stats.wins, color: 'text-green-700 dark:text-green-500' },
            { label: 'Draws', value: stats.draws, color: 'text-yellow-700 dark:text-yellow-500' },
            { label: 'Losses', value: stats.losses, color: 'text-red-500' },
            { label: 'Upcoming', value: stats.upcoming, color: 'text-purple-500' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-3 text-center">
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Year View */}
        {viewMode === 'year' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {MONTHS.map((month, monthIndex) => {
              const monthMatches = getMatchesForMonth(monthIndex);
              const hasMatches = monthMatches.length > 0;
              return (
                <Card
                  key={month}
                  className={`${hasMatches ? 'border-primary/30' : ''} hover:shadow-md transition-shadow`}
                >
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-semibold">{month}</CardTitle>
                      <div className="flex items-center gap-2">
                        {hasMatches && (
                          <Badge variant="secondary" className="text-xs">
                            {monthMatches.length} match{monthMatches.length !== 1 ? 'es' : ''}
                          </Badge>
                        )}
                        <button
                          onClick={() => {
                            setSelectedMonth(monthIndex);
                            setViewMode('month');
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    {monthMatches.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No matches scheduled</p>
                    ) : (
                      <div className="space-y-1.5">
                        {monthMatches.slice(0, 4).map(match => (
                          <MatchCard key={match.id} match={match} />
                        ))}
                        {monthMatches.length > 4 && (
                          <button
                            onClick={() => {
                              setSelectedMonth(monthIndex);
                              setViewMode('month');
                            }}
                            className="text-xs text-primary hover:underline w-full text-center pt-1"
                          >
                            +{monthMatches.length - 4} more matches
                          </button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Month View */}
        {viewMode === 'month' && (
          <div className="space-y-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  if (selectedMonth === 0) {
                    setSelectedMonth(11);
                    setSelectedYear(y => y - 1);
                  } else {
                    setSelectedMonth(m => m - 1);
                  }
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold">{MONTHS[selectedMonth]} {selectedYear}</h2>
              <button
                onClick={() => {
                  if (selectedMonth === 11) {
                    setSelectedMonth(0);
                    setSelectedYear(y => y + 1);
                  } else {
                    setSelectedMonth(m => m + 1);
                  }
                }}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Calendar grid */}
            <Card>
              <CardContent className="p-4">
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar days */}
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells for first day offset */}
                  {Array.from({ length: getFirstDayOfMonth(selectedMonth, selectedYear) }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[80px]" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: getDaysInMonth(selectedMonth, selectedYear) }).map((_, i) => {
                    const day = i + 1;
                    const dayMatches = getMatchesForDay(day);
                    const isToday =
                      new Date().getDate() === day &&
                      new Date().getMonth() === selectedMonth &&
                      new Date().getFullYear() === selectedYear;

                    return (
                      <div
                        key={day}
                        className={`min-h-[80px] p-1 rounded-lg border transition-colors ${
                          isToday ? 'border-primary bg-primary/5' : 'border-transparent hover:border-border'
                        }`}
                      >
                        <div className={`text-xs font-semibold mb-1 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                          {day}
                        </div>
                        <div className="space-y-0.5">
                          {dayMatches.map(match => (
                            <MatchCard key={match.id} match={match} compact />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Month match list */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  {MONTHS[selectedMonth]} Fixtures ({getMatchesForMonth(selectedMonth).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getMatchesForMonth(selectedMonth).length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">No matches scheduled for this month</p>
                ) : (
                  <div className="space-y-2">
                    {getMatchesForMonth(selectedMonth).map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Match Type Legend */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              {Object.entries(MATCH_TYPE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div key={key} className={`flex items-center gap-1.5 px-2 py-1 rounded border text-xs ${config.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                    {config.label}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Match Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule New Match</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={formData.matchDate}
                  onChange={e => setFormData({ ...formData, matchDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Match Type *</Label>
                <Select
                  value={formData.matchType}
                  onValueChange={v => setFormData({ ...formData, matchType: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(MATCH_TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label>Opponent *</Label>
              <Input
                placeholder="Opponent team name"
                value={formData.opponent}
                onChange={e => setFormData({ ...formData, opponent: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Venue</Label>
                <Input
                  placeholder="Stadium / Location"
                  value={formData.venue}
                  onChange={e => setFormData({ ...formData, venue: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label>Team</Label>
                <Select
                  value={formData.teamId}
                  onValueChange={v => setFormData({ ...formData, teamId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id.toString()}>{team.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Label>Home / Away:</Label>
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  onClick={() => setFormData({ ...formData, isHome: true })}
                  className={`px-3 py-1.5 text-sm transition-colors ${formData.isHome ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                  Home
                </button>
                <button
                  onClick={() => setFormData({ ...formData, isHome: false })}
                  className={`px-3 py-1.5 text-sm transition-colors ${!formData.isHome ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                >
                  Away
                </button>
              </div>
            </div>

            {['league', 'cup', 'tournament'].includes(formData.matchType) && (
              <div className="space-y-1">
                <Label>
                  {formData.matchType === 'league' ? 'League Name' : formData.matchType === 'cup' ? 'Cup Name' : 'Tournament Name'}
                </Label>
                <Input
                  placeholder={formData.matchType === 'league' ? 'e.g. Egyptian Premier League' : formData.matchType === 'cup' ? 'e.g. Egypt Cup' : 'e.g. Cairo Tournament'}
                  value={formData.competitionName}
                  onChange={e => setFormData({ ...formData, competitionName: e.target.value })}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Any additional notes..."
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateMatch} disabled={createMatch.isPending}>
              {createMatch.isPending ? 'Scheduling...' : 'Schedule Match'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Match Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Match Result</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4 py-2">
              <div className="p-3 bg-muted rounded-lg">
                <div className="font-semibold">{selectedMatch.isHome ? 'vs' : '@'} {selectedMatch.opponent}</div>
                <div className="text-sm text-muted-foreground">
                  {new Date(selectedMatch.matchDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label>Our Score</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.teamScore}
                    onChange={e => setFormData({ ...formData, teamScore: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Opp. Score</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.opponentScore}
                    onChange={e => setFormData({ ...formData, opponentScore: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Result</Label>
                  <Select
                    value={formData.result}
                    onValueChange={v => setFormData({ ...formData, result: v as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Result" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="win">Win</SelectItem>
                      <SelectItem value="draw">Draw</SelectItem>
                      <SelectItem value="loss">Loss</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Label>Match Notes</Label>
                <Input
                  placeholder="Match notes, key moments..."
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateMatch} disabled={updateMatch.isPending}>
              {updateMatch.isPending ? 'Saving...' : 'Save Result'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Match Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Match Details</DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-4 py-2">
              {(() => {
                const typeConfig = MATCH_TYPE_CONFIG[selectedMatch.matchType as keyof typeof MATCH_TYPE_CONFIG] || MATCH_TYPE_CONFIG.friendly;
                const TypeIcon = typeConfig.icon;
                const resultConfig = selectedMatch.result ? RESULT_CONFIG[selectedMatch.result as keyof typeof RESULT_CONFIG] : null;
                return (
                  <>
                    <div className={`p-4 rounded-lg border ${typeConfig.color}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <TypeIcon className="w-5 h-5" />
                        <span className="font-semibold text-sm">{typeConfig.label}</span>
                        {resultConfig && (
                          <span className={`ml-auto px-2 py-0.5 rounded font-bold text-sm ${resultConfig.color}`}>
                            {selectedMatch.teamScore}-{selectedMatch.opponentScore} {resultConfig.label}
                          </span>
                        )}
                      </div>
                      <div className="text-xl font-bold">
                        {selectedMatch.isHome ? 'vs' : '@'} {selectedMatch.opponent || 'TBD'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground text-xs mb-0.5">Date</div>
                        <div className="font-medium">
                          {new Date(selectedMatch.matchDate).toLocaleDateString('en-GB', {
                            weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-xs mb-0.5">Location</div>
                        <div className="font-medium">{selectedMatch.isHome ? 'Home' : 'Away'}</div>
                      </div>
                      {selectedMatch.venue && (
                        <div className="col-span-2">
                          <div className="text-muted-foreground text-xs mb-0.5">Venue</div>
                          <div className="font-medium flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {selectedMatch.venue}
                          </div>
                        </div>
                      )}
                      {selectedMatch.notes && (
                        <div className="col-span-2">
                          <div className="text-muted-foreground text-xs mb-0.5">Notes</div>
                          <div className="text-sm">{selectedMatch.notes}</div>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>Close</Button>
            {selectedMatch && (
              <Button
                variant="outline"
                className="border-green-600 text-green-700 dark:text-green-400 hover:bg-green-900/30"
                onClick={() => window.open(getGoogleCalendarUrl(selectedMatch), '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Add to Google Calendar
              </Button>
            )}
            {isStaff && selectedMatch && (
              <Button
                onClick={() => {
                  setShowViewDialog(false);
                  openEditDialog(selectedMatch);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Result
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
