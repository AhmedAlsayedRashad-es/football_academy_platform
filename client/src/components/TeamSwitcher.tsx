import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Trophy, Shield, Users } from 'lucide-react';
import { useLocation } from 'wouter';

interface TeamSwitcherProps {
  currentTeamType?: 'main' | 'academy' | null;
  onTeamChange?: (teamType: 'main' | 'academy' | null) => void;
}

const roleLabels: Record<string, { en: string; ar: string }> = {
  head_coach: { en: 'Head Coach', ar: 'المدرب الرئيسي' },
  assistant_coach: { en: 'Assistant', ar: 'مساعد' },
  goalkeeper_coach: { en: 'GK Coach', ar: 'مدرب حراس' },
  fitness_coach: { en: 'Fitness', ar: 'لياقة' },
  analyst: { en: 'Analyst', ar: 'محلل' },
};

export function TeamSwitcher({ currentTeamType, onTeamChange }: TeamSwitcherProps) {
  const { language } = useLanguage();
  const [, navigate] = useLocation();
  
  // Get the coach's assigned teams
  const { data: myTeams, isLoading } = trpc.teams.getMyTeams.useQuery();
  
  if (isLoading || !myTeams || myTeams.length === 0) {
    return null;
  }

  const handleTeamSelect = (teamType: 'main' | 'academy' | null) => {
    if (onTeamChange) {
      onTeamChange(teamType);
    }
    // Navigate to the team's dashboard
    if (teamType === 'main') {
      navigate('/players?team=main');
    } else if (teamType === 'academy') {
      navigate('/players?team=academy');
    } else {
      navigate('/dashboard');
    }
  };

  const currentTeamLabel = currentTeamType === 'main' 
    ? (language === 'ar' ? 'الفريق الأول' : 'Main Team')
    : currentTeamType === 'academy'
    ? (language === 'ar' ? 'الأكاديمية' : 'Academy')
    : (language === 'ar' ? 'جميع الفرق' : 'All Teams');

  // Group teams by type
  const mainTeams = myTeams.filter(t => t.teamType === 'main');
  const academyTeams = myTeams.filter(t => t.teamType === 'academy');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {currentTeamType === 'main' ? (
            <Trophy className="h-4 w-4 text-yellow-700 dark:text-yellow-500" />
          ) : currentTeamType === 'academy' ? (
            <Shield className="h-4 w-4 text-blue-500" />
          ) : (
            <Users className="h-4 w-4" />
          )}
          {currentTeamLabel}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>
          {language === 'ar' ? 'الفرق المعينة' : 'My Assigned Teams'}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => handleTeamSelect(null)}
          className={!currentTeamType ? 'bg-accent' : ''}
        >
          <Users className="h-4 w-4 mr-2" />
          {language === 'ar' ? 'جميع الفرق' : 'All Teams'}
        </DropdownMenuItem>
        
        {mainTeams.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {language === 'ar' ? 'الفريق الأول' : 'Main Team'}
            </DropdownMenuLabel>
            {mainTeams.map((team) => (
              <DropdownMenuItem 
                key={team.id}
                onClick={() => handleTeamSelect('main')}
                className={currentTeamType === 'main' ? 'bg-accent' : ''}
              >
                <Trophy className="h-4 w-4 mr-2 text-yellow-700 dark:text-yellow-500" />
                <div className="flex-1">
                  <div className="font-medium">{team.teamName}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    {team.ageGroup}
                    {team.role && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {roleLabels[team.role]?.[language] || team.role}
                      </Badge>
                    )}
                    {team.isPrimary && (
                      <Badge className="text-[10px] px-1 py-0 bg-yellow-500">
                        {language === 'ar' ? 'رئيسي' : 'Primary'}
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
        
        {academyTeams.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {language === 'ar' ? 'فرق الأكاديمية' : 'Academy Teams'}
            </DropdownMenuLabel>
            {academyTeams.map((team) => (
              <DropdownMenuItem 
                key={team.id}
                onClick={() => handleTeamSelect('academy')}
                className={currentTeamType === 'academy' ? 'bg-accent' : ''}
              >
                <Shield className="h-4 w-4 mr-2 text-blue-500" />
                <div className="flex-1">
                  <div className="font-medium">{team.teamName}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    {team.ageGroup}
                    {team.role && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        {roleLabels[team.role]?.[language] || team.role}
                      </Badge>
                    )}
                    {team.isPrimary && (
                      <Badge className="text-[10px] px-1 py-0 bg-blue-500">
                        {language === 'ar' ? 'رئيسي' : 'Primary'}
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
