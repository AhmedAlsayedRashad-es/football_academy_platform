import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Clock, Users, Target, Zap, TrendingUp, ArrowLeft, Radio } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

export default function RealtimeMatchTracking() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [matchTime, setMatchTime] = useState(0);
  const [isLive, setIsLive] = useState(true);
  const [selectedMatchId, setSelectedMatchId] = useState<string>('');

  // Live matches from DB
  const { data: liveMatches = [] } = trpc.liveMatch.getAll.useQuery();
  const { data: allMatches = [] } = trpc.matches.getAll.useQuery();

  // Build match selector options: live matches first, then recent past matches
  const matchOptions = [
    ...liveMatches.map((m: any) => ({ id: `live-${m.id}`, label: `LIVE: ${m.teamName || 'Our Team'} vs ${m.opponent}`, isLive: true })),
    ...allMatches.slice(0, 8).map((m: any) => ({ id: `past-${m.id}`, label: `${m.homeTeam || 'Home'} vs ${m.awayTeam || 'Away'} (${m.matchDate ? new Date(m.matchDate).toLocaleDateString() : 'N/A'})`, isLive: false })),
  ];

  // Selected match data (live match takes priority)
  const selectedLive = selectedMatchId.startsWith('live-')
    ? liveMatches.find((m: any) => `live-${m.id}` === selectedMatchId)
    : null;
  const selectedPast = selectedMatchId.startsWith('past-')
    ? allMatches.find((m: any) => `past-${m.id}` === selectedMatchId)
    : null;
  const [selectedTeam, setSelectedTeam] = useState<'team1' | 'team2'>('team1');

  // Simulate real-time match updates
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      setMatchTime(prev => (prev + 1) % 5400); // 90 minutes
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  const minutes = Math.floor(matchTime / 60);
  const seconds = matchTime % 60;

  // Real-time match data
  const matchData = {
    team1: {
      name: 'Manchester City',
      logo: '🔵',
      score: 2,
      possession: 58,
      shots: 12,
      shotsOnTarget: 5,
      passes: 450,
      passAccuracy: 82,
      tackles: 18,
      interceptions: 8,
      fouls: 6,
      corners: 4,
      players: [
        { number: 1, name: 'Ederson', position: 'GK', touches: 32, passes: 28, passAccuracy: 89 },
        { number: 2, name: 'Walker', position: 'RB', touches: 68, passes: 52, passAccuracy: 81 },
        { number: 3, name: 'Dias', position: 'CB', touches: 95, passes: 78, passAccuracy: 92 },
        { number: 4, name: 'Akanji', position: 'CB', touches: 82, passes: 65, passAccuracy: 88 },
        { number: 5, name: 'Cancelo', position: 'LB', touches: 71, passes: 58, passAccuracy: 85 },
        { number: 6, name: 'Rodri', position: 'CM', touches: 112, passes: 98, passAccuracy: 91 },
        { number: 8, name: 'Gundogan', position: 'CM', touches: 89, passes: 76, passAccuracy: 84 },
        { number: 10, name: 'Grealish', position: 'LW', touches: 78, passes: 52, passAccuracy: 79 },
        { number: 7, name: 'Mahrez', position: 'RW', touches: 65, passes: 41, passAccuracy: 75 },
        { number: 9, name: 'Haaland', position: 'ST', touches: 48, passes: 18, passAccuracy: 72 },
        { number: 11, name: 'Alvarez', position: 'ST', touches: 52, passes: 24, passAccuracy: 74 }
      ]
    },
    team2: {
      name: 'Liverpool',
      logo: '🔴',
      score: 1,
      possession: 42,
      shots: 8,
      shotsOnTarget: 3,
      passes: 320,
      passAccuracy: 79,
      tackles: 22,
      interceptions: 12,
      fouls: 8,
      corners: 3,
      players: [
        { number: 1, name: 'Alisson', position: 'GK', touches: 28, passes: 24, passAccuracy: 86 },
        { number: 66, name: 'Alexander-Arnold', position: 'RB', touches: 62, passes: 48, passAccuracy: 80 },
        { number: 4, name: 'Van Dijk', position: 'CB', touches: 88, passes: 72, passAccuracy: 90 },
        { number: 32, name: 'Matip', position: 'CB', touches: 76, passes: 61, passAccuracy: 87 },
        { number: 26, name: 'Robertson', position: 'LB', touches: 68, passes: 54, passAccuracy: 82 },
        { number: 3, name: 'Fabinho', position: 'CM', touches: 105, passes: 92, passAccuracy: 88 },
        { number: 14, name: 'Henderson', position: 'CM', touches: 82, passes: 71, passAccuracy: 81 },
        { number: 11, name: 'Salah', position: 'RW', touches: 72, passes: 45, passAccuracy: 76 },
        { number: 17, name: 'Nunez', position: 'ST', touches: 58, passes: 22, passAccuracy: 70 },
        { number: 23, name: 'Diaz', position: 'LW', touches: 65, passes: 38, passAccuracy: 74 },
        { number: 9, name: 'Firmino', position: 'ST', touches: 44, passes: 18, passAccuracy: 68 }
      ]
    }
  };

  const team1 = matchData.team1;
  const team2 = matchData.team2;
  const currentTeam = selectedTeam === 'team1' ? team1 : team2;

  // Real-time performance data
  const performanceTimeline = [
    { time: '0-15min', team1Possession: 55, team2Possession: 45, team1Shots: 2, team2Shots: 1 },
    { time: '15-30min', team1Possession: 60, team2Possession: 40, team1Shots: 5, team2Shots: 2 },
    { time: '30-45min', team1Possession: 58, team2Possession: 42, team1Shots: 8, team2Shots: 3 },
    { time: '45-60min', team1Possession: 57, team2Possession: 43, team1Shots: 10, team2Shots: 5 },
    { time: '60-75min', team1Possession: 59, team2Possession: 41, team1Shots: 12, team2Shots: 7 }
  ];

  const playerPerformance = currentTeam.players.map(p => ({
    ...p,
    rating: 6.5 + Math.random() * 3.5,
    distance: 8000 + Math.random() * 2000
  }));

  return (
    <>
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
                    <BackButton />
          <h1 className="text-4xl font-bold text-foreground mb-2">Live Match Tracking</h1>
          <p className="text-muted-foreground">Real-time performance analytics and live statistics</p>
          {matchOptions.length > 0 && (
            <div className="mt-4 max-w-sm">
              <Select value={selectedMatchId} onValueChange={setSelectedMatchId}>
                <SelectTrigger className="bg-muted border-border text-foreground">
                  <SelectValue placeholder="Select a match to track..." />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {matchOptions.map(opt => (
                    <SelectItem key={opt.id} value={opt.id} className="text-foreground">
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Live Match Score */}
        <Card className="bg-card border-border mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              {/* Team 1 */}
              <div className="text-center flex-1">
                <div className="text-5xl mb-2">{team1.logo}</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{team1.name}</h2>
                <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">{team1.score}</div>
              </div>

              {/* Match Time */}
              <div className="flex-1 text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-green-700 dark:text-green-500 animate-pulse" />
                  <span className="text-muted-foreground">LIVE</span>
                </div>
                <div className="text-5xl font-bold text-foreground font-mono">
                  {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                </div>
                <Button
                  onClick={() => setIsLive(!isLive)}
                  className="mt-4 bg-muted hover:bg-slate-600"
                >
                  {isLive ? 'Pause' : 'Resume'}
                </Button>
              </div>

              {/* Team 2 */}
              <div className="text-center flex-1">
                <div className="text-5xl mb-2">{team2.logo}</div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{team2.name}</h2>
                <div className="text-6xl font-bold text-red-600 dark:text-red-400">{team2.score}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Possession</p>
                  <p className="text-2xl font-bold text-foreground">{team1.possession}%</p>
                </div>
                <div className="text-3xl text-blue-500">⚽</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Shots</p>
                  <p className="text-2xl font-bold text-foreground">{team1.shots}</p>
                </div>
                <Target className="w-8 h-8 text-orange-700 dark:text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Pass Accuracy</p>
                  <p className="text-2xl font-bold text-foreground">{team1.passAccuracy}%</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-700 dark:text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Tackles</p>
                  <p className="text-2xl font-bold text-foreground">{team1.tackles}</p>
                </div>
                <Users className="w-8 h-8 text-green-700 dark:text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Tabs */}
        <Tabs defaultValue="performance" className="space-y-4">
          <TabsList className="bg-card border-border">
            <TabsTrigger value="performance" className="text-muted-foreground">Performance Timeline</TabsTrigger>
            <TabsTrigger value="players" className="text-muted-foreground">Player Stats</TabsTrigger>
            <TabsTrigger value="comparison" className="text-muted-foreground">Team Comparison</TabsTrigger>
            <TabsTrigger value="heatmap" className="text-muted-foreground">Position Heatmap</TabsTrigger>
          </TabsList>

          {/* Performance Timeline */}
          <TabsContent value="performance">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Match Performance Timeline</CardTitle>
                <CardDescription className="text-muted-foreground">Possession and shots over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="time" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#e2e8f0' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="team1Possession" stroke="#3b82f6" strokeWidth={2} name="City Possession" />
                    <Line type="monotone" dataKey="team2Possession" stroke="#ef4444" strokeWidth={2} name="Liverpool Possession" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Player Stats */}
          <TabsContent value="players">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Player Performance - {currentTeam.name}</CardTitle>
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => setSelectedTeam('team1')}
                    className={selectedTeam === 'team1' ? 'bg-blue-600' : 'bg-muted'}
                  >
                    {team1.name}
                  </Button>
                  <Button
                    onClick={() => setSelectedTeam('team2')}
                    className={selectedTeam === 'team2' ? 'bg-red-600' : 'bg-muted'}
                  >
                    {team2.name}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-muted-foreground">#</th>
                        <th className="text-left py-3 px-4 text-muted-foreground">Player</th>
                        <th className="text-left py-3 px-4 text-muted-foreground">Position</th>
                        <th className="text-left py-3 px-4 text-muted-foreground">Touches</th>
                        <th className="text-left py-3 px-4 text-muted-foreground">Passes</th>
                        <th className="text-left py-3 px-4 text-muted-foreground">Accuracy</th>
                        <th className="text-left py-3 px-4 text-muted-foreground">Rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playerPerformance.map(player => (
                        <tr key={player.number} className="border-b border-border hover:bg-muted">
                          <td className="py-3 px-4 text-foreground font-semibold">{player.number}</td>
                          <td className="py-3 px-4 text-foreground">{player.name}</td>
                          <td className="py-3 px-4 text-muted-foreground">{player.position}</td>
                          <td className="py-3 px-4 text-foreground">{player.touches}</td>
                          <td className="py-3 px-4 text-foreground">{player.passes}</td>
                          <td className="py-3 px-4 text-green-700 dark:text-green-400">{player.passAccuracy}%</td>
                          <td className="py-3 px-4 text-yellow-700 dark:text-yellow-400 font-semibold">{player.rating.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Comparison */}
          <TabsContent value="comparison">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Team Statistics Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: 'Possession', team1: team1.possession, team2: team2.possession },
                    { label: 'Shots', team1: team1.shots, team2: team2.shots },
                    { label: 'Shots on Target', team1: team1.shotsOnTarget, team2: team2.shotsOnTarget },
                    { label: 'Pass Accuracy', team1: team1.passAccuracy, team2: team2.passAccuracy },
                    { label: 'Tackles', team1: team1.tackles, team2: team2.tackles },
                    { label: 'Interceptions', team1: team1.interceptions, team2: team2.interceptions }
                  ].map((stat, idx) => (
                    <div key={idx}>
                      <div className="flex justify-between mb-2">
                        <span className="text-muted-foreground">{stat.label}</span>
                        <span className="text-muted-foreground">{stat.team1} - {stat.team2}</span>
                      </div>
                      <div className="flex gap-2 h-6 bg-muted rounded overflow-hidden">
                        <div
                          className="bg-blue-600"
                          style={{ width: `${(stat.team1 / (stat.team1 + stat.team2)) * 100}%` }}
                        />
                        <div
                          className="bg-red-600"
                          style={{ width: `${(stat.team2 / (stat.team1 + stat.team2)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Heatmap */}
          <TabsContent value="heatmap">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Player Position Heatmap</CardTitle>
                <CardDescription className="text-muted-foreground">Where players spend most time on the pitch</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-green-900 rounded-lg aspect-video flex items-center justify-center relative overflow-hidden">
                  {/* Pitch markings */}
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1280 720">
                    {/* Center line */}
                    <line x1="640" y1="0" x2="640" y2="720" stroke="white" strokeWidth="2" opacity="0.3" />
                    {/* Center circle */}
                    <circle cx="640" cy="360" r="90" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
                    {/* Penalty areas */}
                    <rect x="0" y="180" width="160" height="360" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
                    <rect x="1120" y="180" width="160" height="360" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
                  </svg>

                  {/* Player positions with heatmap */}
                  {currentTeam.players.map((player, idx) => (
                    <div
                      key={player.number}
                      className="absolute w-8 h-8 rounded-full flex items-center justify-center text-foreground text-xs font-bold"
                      style={{
                        left: `${Math.random() * 80 + 10}%`,
                        top: `${Math.random() * 80 + 10}%`,
                        backgroundColor: `rgba(59, 130, 246, ${0.3 + Math.random() * 0.7})`
                      }}
                      title={player.name}
                    >
                      {player.number}
                    </div>
                  ))}

                  <p className="absolute bottom-4 left-4 text-foreground text-sm">
                    Darker = More time on pitch
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export Button */}
        <div className="mt-8 flex gap-4">
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700 h-12">
            Download Match Report
          </Button>
          <Button className="flex-1 bg-muted hover:bg-slate-600 h-12">
            Export Statistics
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
