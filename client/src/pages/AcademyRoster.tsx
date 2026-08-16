import React, { useState } from 'react';
import {Users, Trophy, Target, Award, ArrowLeft} from 'lucide-react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


interface Player {
  id: number;
  name: string;
  position: string;
  jerseyNumber: number;
  rating: number;
  pace: number;
  shooting: number;
  passing: number;
  dribbling: number;
  defense: number;
  physical: number;
  image?: string;
}

interface Team {
  id: number;
  name: string;
  coach: string;
  players: Player[];
  ageGroup: string;
}

export default function AcademyRoster() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'academy' | 'main'>('academy');

  // Sample data - will be replaced with API calls
  const academyTeams: Team[] = [
    {
      id: 1,
      name: 'U12 Academy',
      coach: 'Ahmed Hassan',
      ageGroup: 'U12',
      players: [
        {
          id: 1,
          name: 'Mohamed Ali',
          position: 'Forward',
          jerseyNumber: 10,
          rating: 78,
          pace: 82,
          shooting: 75,
          passing: 70,
          dribbling: 80,
          defense: 45,
          physical: 72,
        },
        {
          id: 2,
          name: 'Karim Samir',
          position: 'Midfielder',
          jerseyNumber: 8,
          rating: 75,
          pace: 78,
          shooting: 68,
          passing: 82,
          dribbling: 76,
          defense: 60,
          physical: 70,
        },
        {
          id: 3,
          name: 'Hassan Ibrahim',
          position: 'Defender',
          jerseyNumber: 4,
          rating: 72,
          pace: 75,
          shooting: 50,
          passing: 70,
          dribbling: 65,
          defense: 85,
          physical: 80,
        },
      ],
    },
    {
      id: 2,
      name: 'U14 Academy',
      coach: 'Fatima Al-Mansouri',
      ageGroup: 'U14',
      players: [
        {
          id: 4,
          name: 'Youssef Kamal',
          position: 'Forward',
          jerseyNumber: 9,
          rating: 82,
          pace: 85,
          shooting: 80,
          passing: 75,
          dribbling: 85,
          defense: 50,
          physical: 76,
        },
      ],
    },
    {
      id: 3,
      name: 'U16 Academy',
      coach: 'Omar Khalil',
      ageGroup: 'U16',
      players: [
        {
          id: 5,
          name: 'Marwan Khaled',
          position: 'Goalkeeper',
          jerseyNumber: 1,
          rating: 80,
          pace: 60,
          shooting: 30,
          passing: 65,
          dribbling: 40,
          defense: 88,
          physical: 85,
        },
      ],
    },
  ];

  const mainTeams: Team[] = [
    {
      id: 101,
      name: 'U12 Main Team',
      coach: 'Ahmed Hassan',
      ageGroup: 'U12',
      players: [
        {
          id: 11,
          name: 'Ali Hassan',
          position: 'Forward',
          jerseyNumber: 7,
          rating: 85,
          pace: 88,
          shooting: 85,
          passing: 78,
          dribbling: 87,
          defense: 48,
          physical: 78,
        },
      ],
    },
    {
      id: 102,
      name: 'U14 Main Team',
      coach: 'Fatima Al-Mansouri',
      ageGroup: 'U14',
      players: [
        {
          id: 12,
          name: 'Sayed El-Shenawy',
          position: 'Midfielder',
          jerseyNumber: 6,
          rating: 88,
          pace: 85,
          shooting: 75,
          passing: 88,
          dribbling: 85,
          defense: 70,
          physical: 82,
        },
      ],
    },
    {
      id: 103,
      name: 'U16 Main Team',
      coach: 'Omar Khalil',
      ageGroup: 'U16',
      players: [
        {
          id: 13,
          name: 'Hassan Farouk',
          position: 'Defender',
          jerseyNumber: 3,
          rating: 84,
          pace: 80,
          shooting: 55,
          passing: 78,
          dribbling: 72,
          defense: 90,
          physical: 88,
        },
      ],
    },
  ];

  const teams = viewMode === 'academy' ? academyTeams : mainTeams;

  const getRatingColor = (rating: number) => {
    if (rating >= 85) return 'from-yellow-400 to-yellow-600';
    if (rating >= 80) return 'from-green-400 to-green-600';
    if (rating >= 75) return 'from-blue-400 to-blue-600';
    return 'from-purple-400 to-purple-600';
  };

  return (
    <>
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          
          <BackButton />
<h1 className="text-4xl font-bold text-foreground mb-2 flex items-center gap-3">
            <Users className="w-10 h-10 text-emerald-700 dark:text-emerald-400" />
            Academy Roster
          </h1>
          <p className="text-muted-foreground">View academy and main teams by age group</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setViewMode('academy')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              viewMode === 'academy'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/50'
                : 'bg-muted text-muted-foreground hover:bg-muted'
            }`}
          >
            <Target className="w-5 h-5 inline mr-2" />
            Academy Teams
          </button>
          <button
            onClick={() => setViewMode('main')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              viewMode === 'main'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/50'
                : 'bg-muted text-muted-foreground hover:bg-muted'
            }`}
          >
            <Trophy className="w-5 h-5 inline mr-2" />
            Main Teams
          </button>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {teams.map((team) => (
            <div
              key={team.id}
              className="bg-card rounded-xl overflow-hidden border border-border hover:border-emerald-500 transition-all"
            >
              {/* Team Header */}
              <div className="brand-gradient p-6">
                <h2 className="text-2xl font-bold text-white mb-2">{team.name}</h2>
                <p className="text-emerald-100 flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  Coach: {team.coach}
                </p>
              </div>

              {/* Players List */}
              <div className="p-6">
                <div className="space-y-4">
                  {team.players.map((player) => (
                    <div
                      key={player.id}
                      className="bg-muted/50 rounded-lg p-4 hover:bg-muted/50 transition-all border border-border"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{player.name}</h3>
                          <p className="text-muted-foreground text-sm">
                            {player.position} • #{player.jerseyNumber}
                          </p>
                        </div>
                        <div className={`bg-gradient-to-br ${getRatingColor(player.rating)} p-3 rounded-lg text-center`}>
                          <p className="text-foreground font-bold text-lg">{player.rating}</p>
                          <p className="text-foreground text-xs">Rating</p>
                        </div>
                      </div>

                      {/* Skills Bar */}
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="bg-muted rounded p-2">
                          <p className="text-muted-foreground">Pace</p>
                          <div className="w-full bg-muted rounded h-1.5 mt-1">
                            <div
                              className="bg-red-500 h-1.5 rounded"
                              style={{ width: `${player.pace}%` }}
                            />
                          </div>
                        </div>
                        <div className="bg-muted rounded p-2">
                          <p className="text-muted-foreground">Shooting</p>
                          <div className="w-full bg-muted rounded h-1.5 mt-1">
                            <div
                              className="bg-yellow-500 h-1.5 rounded"
                              style={{ width: `${player.shooting}%` }}
                            />
                          </div>
                        </div>
                        <div className="bg-muted rounded p-2">
                          <p className="text-muted-foreground">Passing</p>
                          <div className="w-full bg-muted rounded h-1.5 mt-1">
                            <div
                              className="bg-green-500 h-1.5 rounded"
                              style={{ width: `${player.passing}%` }}
                            />
                          </div>
                        </div>
                        <div className="bg-muted rounded p-2">
                          <p className="text-muted-foreground">Dribbling</p>
                          <div className="w-full bg-muted rounded h-1.5 mt-1">
                            <div
                              className="bg-blue-500 h-1.5 rounded"
                              style={{ width: `${player.dribbling}%` }}
                            />
                          </div>
                        </div>
                        <div className="bg-muted rounded p-2">
                          <p className="text-muted-foreground">Defense</p>
                          <div className="w-full bg-muted rounded h-1.5 mt-1">
                            <div
                              className="bg-purple-500 h-1.5 rounded"
                              style={{ width: `${player.defense}%` }}
                            />
                          </div>
                        </div>
                        <div className="bg-muted rounded p-2">
                          <p className="text-muted-foreground">Physical</p>
                          <div className="w-full bg-muted rounded h-1.5 mt-1">
                            <div
                              className="bg-orange-500 h-1.5 rounded"
                              style={{ width: `${player.physical}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {team.players.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">No players in this team yet</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}
