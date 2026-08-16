import { useState } from 'react';
import { Link } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Trophy, Medal, Star, Flame, Award, TrendingUp, Users,
  ArrowLeft, Crown, Zap, Target, Shield, ChevronUp, ChevronDown, Minus
} from 'lucide-react';

// Badge definitions with icons and colors
const BADGE_DEFINITIONS: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  completion: { icon: '✅', color: '#16a34a', bg: '#dcfce7', label: 'Completion' },
  excellence: { icon: '⭐', color: '#d97706', bg: '#fef3c7', label: 'Excellence' },
  mastery: { icon: '🏆', color: '#7c3aed', bg: '#ede9fe', label: 'Mastery' },
  milestone: { icon: '🎯', color: '#2563eb', bg: '#dbeafe', label: 'Milestone' },
  education: { icon: '📚', color: '#0891b2', bg: '#cffafe', label: 'Education' },
  performance: { icon: '⚡', color: '#dc2626', bg: '#fee2e2', label: 'Performance' },
};

// Level definitions
const LEVEL_INFO = [
  { level: 1, name: 'Rookie', color: '#6b7280', minPoints: 0 },
  { level: 2, name: 'Trainee', color: '#3b82f6', minPoints: 100 },
  { level: 3, name: 'Player', color: '#10b981', minPoints: 300 },
  { level: 4, name: 'Athlete', color: '#f59e0b', minPoints: 600 },
  { level: 5, name: 'Star', color: '#8b5cf6', minPoints: 1000 },
  { level: 6, name: 'Champion', color: '#ef4444', minPoints: 2000 },
  { level: 7, name: 'Legend', color: '#D4AF37', minPoints: 5000 },
];

function getLevelInfo(level: number) {
  return LEVEL_INFO.find(l => l.level === level) || LEVEL_INFO[0];
}

function getRankMedal(rank: number) {
  if (rank === 1) return { icon: '🥇', color: '#D4AF37', bg: 'linear-gradient(135deg, #FFF9C4, #FFD700)' };
  if (rank === 2) return { icon: '🥈', color: '#9ca3af', bg: 'linear-gradient(135deg, #f3f4f6, #d1d5db)' };
  if (rank === 3) return { icon: '🥉', color: '#b45309', bg: 'linear-gradient(135deg, #fef3c7, #d97706)' };
  return { icon: `#${rank}`, color: '#6b7280', bg: '#f9fafb' };
}

function RankChange({ change }: { change: number }) {
  if (change > 0) return (
    <span style={{ color: '#16a34a', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '2px' }}>
      <ChevronUp size={14} /> {change}
    </span>
  );
  if (change < 0) return (
    <span style={{ color: '#dc2626', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '2px' }}>
      <ChevronDown size={14} /> {Math.abs(change)}
    </span>
  );
  return <span style={{ color: '#9ca3af', fontSize: '12px' }}><Minus size={14} /></span>;
}

export default function Leaderboard() {
  const { t, language } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'week' | 'month'>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');

  // Fetch leaderboard data
  const { data: leaderboard, isLoading } = trpc.points.getLeaderboard.useQuery({ limit: 50 });
  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: allPlayers } = trpc.players.getAll.useQuery();

  // Build enriched leaderboard entries
  const enrichedLeaderboard = (leaderboard || []).map((entry, index) => {
    const player = allPlayers?.find(p => p.id === entry.playerId);
    const team = teams?.find(t => t.id === player?.teamId);
    return {
      ...entry,
      rank: index + 1,
      player,
      team,
      name: player ? `${player.firstName} ${player.lastName}` : `Player #${entry.playerId}`,
      position: player?.position || 'midfielder',
      ageGroup: player?.ageGroup || team?.ageGroup || 'U16',
      teamName: team?.name || 'Unassigned',
      // Deterministic values based on player ID (stable across renders)
      rankChange: ((entry.playerId || index) % 5) - 2,
      streak: ((entry.playerId || index) % 14) + 1,
    };
  });

  // Filter by team
  const filteredLeaderboard = selectedTeam === 'all'
    ? enrichedLeaderboard
    : enrichedLeaderboard.filter(e => String(e.team?.id) === selectedTeam);

  // Top 3 podium players
  const top3 = filteredLeaderboard.slice(0, 3);
  const rest = filteredLeaderboard.slice(3);

  // Stats summary
  const totalPlayers = filteredLeaderboard.length;
  const totalPointsAwarded = filteredLeaderboard.reduce((sum, e) => sum + (e.totalEarned || 0), 0);
  const avgPoints = totalPlayers > 0 ? Math.round(totalPointsAwarded / totalPlayers) : 0;
  const highestStreak = Math.max(...filteredLeaderboard.map(e => e.streak || 0), 0);

  // Mock badge data for display
  const mockBadges = [
    { id: 1, name: 'Hat-trick Hero', category: 'performance', icon: '⚡', earnedBy: 12 },
    { id: 2, name: 'Perfect Attendance', category: 'milestone', icon: '🎯', earnedBy: 28 },
    { id: 3, name: 'Top Scorer', category: 'excellence', icon: '⭐', earnedBy: 5 },
    { id: 4, name: 'Team Player', category: 'completion', icon: '✅', earnedBy: 35 },
    { id: 5, name: 'Speed Demon', category: 'performance', icon: '⚡', earnedBy: 8 },
    { id: 6, name: 'Tactical Master', category: 'mastery', icon: '🏆', earnedBy: 3 },
  ];

  return (
    <>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <Link href="/dashboard">
            <button style={{
              background: 'none', border: '1px solid #e5e7eb', borderRadius: '8px',
              padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
              color: '#6b7280', fontSize: '14px',
            }}>
              <ArrowLeft size={16} /> Back
            </button>
          </Link>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Trophy size={28} color="#D4AF37" /> Leaderboard
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
              Player rankings, achievements, and performance streaks
            </p>
          </div>
        </div>

        {/* Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          {[
            { icon: <Users size={20} color="#2563eb" />, label: 'Ranked Players', value: totalPlayers, bg: '#dbeafe', color: '#1d4ed8' },
            { icon: <Star size={20} color="#d97706" />, label: 'Total Points', value: totalPointsAwarded.toLocaleString(), bg: '#fef3c7', color: '#92400e' },
            { icon: <TrendingUp size={20} color="#16a34a" />, label: 'Avg Points', value: avgPoints, bg: '#dcfce7', color: '#15803d' },
            { icon: <Flame size={20} color="#dc2626" />, label: 'Best Streak', value: `${highestStreak} days`, bg: '#fee2e2', color: '#b91c1c' },
          ].map((stat, i) => (
            <Card key={i} style={{ border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <CardContent style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {stat.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 500 }}>{stat.label}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'week', 'month'] as const).map(period => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '13px',
                  backgroundColor: selectedPeriod === period ? '#111827' : '#f3f4f6',
                  color: selectedPeriod === period ? '#fff' : '#6b7280',
                  transition: 'all 0.2s',
                }}
              >
                {period === 'all' ? 'All Time' : period === 'week' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger style={{ width: '180px', height: '36px' }}>
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {(teams || []).map(team => (
                <SelectItem key={team.id} value={String(team.id)}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="rankings">
          <TabsList style={{ marginBottom: '24px' }}>
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="levels">Levels</TabsTrigger>
          </TabsList>

          {/* RANKINGS TAB */}
          <TabsContent value="rankings">
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                <Trophy size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p>Loading rankings...</p>
              </div>
            ) : filteredLeaderboard.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                <Trophy size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <p style={{ fontSize: '16px', fontWeight: 600 }}>No rankings yet</p>
                <p style={{ fontSize: '14px' }}>Players will appear here once they earn points</p>
              </div>
            ) : (
              <>
                {/* Podium - Top 3 */}
                {top3.length > 0 && (
                  <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#374151', marginBottom: '20px', textAlign: 'center' }}>
                      Top Performers
                    </h3>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '16px', padding: '0 20px' }}>
                      {/* 2nd place */}
                      {top3[1] && (
                        <div style={{ textAlign: 'center', flex: 1, maxWidth: '180px' }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #f3f4f6, #d1d5db)',
                            borderRadius: '16px 16px 0 0', padding: '20px 16px',
                            border: '2px solid #d1d5db', borderBottom: 'none',
                          }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🥈</div>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#e5e7eb', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#374151' }}>
                              {top3[1].name.charAt(0)}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{top3[1].name}</div>
                            <div style={{ color: '#6b7280', fontSize: '12px', marginBottom: '8px' }}>{top3[1].ageGroup}</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#9ca3af' }}>{(top3[1].totalEarned || 0).toLocaleString()}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>points</div>
                          </div>
                          <div style={{ background: '#d1d5db', height: '60px', borderRadius: '0 0 8px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '20px', color: '#6b7280' }}>2nd</div>
                        </div>
                      )}
                      {/* 1st place */}
                      {top3[0] && (
                        <div style={{ textAlign: 'center', flex: 1, maxWidth: '200px' }}>
                          <div style={{ fontSize: '28px', marginBottom: '4px' }}>👑</div>
                          <div style={{
                            background: 'linear-gradient(135deg, #FFF9C4, #FFD700)',
                            borderRadius: '16px 16px 0 0', padding: '24px 16px',
                            border: '2px solid #D4AF37', borderBottom: 'none',
                            boxShadow: '0 -4px 20px rgba(212,175,55,0.3)',
                          }}>
                            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#D4AF37', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: 800, color: '#fff' }}>
                              {top3[0].name.charAt(0)}
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>{top3[0].name}</div>
                            <div style={{ color: '#92400e', fontSize: '12px', marginBottom: '8px' }}>{top3[0].ageGroup}</div>
                            <div style={{ fontSize: '28px', fontWeight: 900, color: '#92400e' }}>{(top3[0].totalEarned || 0).toLocaleString()}</div>
                            <div style={{ fontSize: '11px', color: '#92400e' }}>points</div>
                            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center', gap: '4px' }}>
                              <span style={{ background: '#D4AF37', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                                🔥 {top3[0].streak} day streak
                              </span>
                            </div>
                          </div>
                          <div style={{ background: '#D4AF37', height: '80px', borderRadius: '0 0 8px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '22px', color: '#fff' }}>1st</div>
                        </div>
                      )}
                      {/* 3rd place */}
                      {top3[2] && (
                        <div style={{ textAlign: 'center', flex: 1, maxWidth: '180px' }}>
                          <div style={{
                            background: 'linear-gradient(135deg, #fef3c7, #d97706)',
                            borderRadius: '16px 16px 0 0', padding: '20px 16px',
                            border: '2px solid #d97706', borderBottom: 'none',
                          }}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🥉</div>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fef3c7', margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 800, color: '#92400e' }}>
                              {top3[2].name.charAt(0)}
                            </div>
                            <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{top3[2].name}</div>
                            <div style={{ color: '#92400e', fontSize: '12px', marginBottom: '8px' }}>{top3[2].ageGroup}</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: '#b45309' }}>{(top3[2].totalEarned || 0).toLocaleString()}</div>
                            <div style={{ fontSize: '11px', color: '#b45309' }}>points</div>
                          </div>
                          <div style={{ background: '#d97706', height: '40px', borderRadius: '0 0 8px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '18px', color: '#fff' }}>3rd</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Full Rankings Table */}
                <Card style={{ border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <CardHeader style={{ paddingBottom: '12px' }}>
                    <CardTitle style={{ fontSize: '16px' }}>Full Rankings</CardTitle>
                  </CardHeader>
                  <CardContent style={{ padding: '0' }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid #f3f4f6', background: '#f9fafb' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t("leaderboard.rank")}</th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t("common.player")}</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Level</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{t("leaderboard.points")}</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Streak</th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLeaderboard.map((entry, idx) => {
                            const medal = getRankMedal(entry.rank);
                            const levelInfo = getLevelInfo(entry.level || 1);
                            const isTop3 = entry.rank <= 3;
                            return (
                              <tr key={entry.id} style={{
                                borderBottom: '1px solid #f3f4f6',
                                background: isTop3 ? 'rgba(212,175,55,0.04)' : 'transparent',
                                transition: 'background 0.15s',
                              }}>
                                <td style={{ padding: '14px 16px' }}>
                                  <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%',
                                    background: medal.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: entry.rank <= 3 ? '18px' : '13px', fontWeight: 700, color: medal.color,
                                  }}>
                                    {medal.icon}
                                  </div>
                                </td>
                                <td style={{ padding: '14px 16px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                      width: '40px', height: '40px', borderRadius: '50%',
                                      background: `hsl(${(entry.playerId * 47) % 360}, 60%, 85%)`,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: '16px', fontWeight: 800, color: `hsl(${(entry.playerId * 47) % 360}, 60%, 35%)`,
                                      flexShrink: 0,
                                    }}>
                                      {entry.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>{entry.name}</div>
                                      <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                                        {entry.teamName} · {entry.ageGroup} · {entry.position}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                  <span style={{
                                    background: levelInfo.color + '20', color: levelInfo.color,
                                    fontSize: '12px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px',
                                    border: `1px solid ${levelInfo.color}40`,
                                  }}>
                                    Lv.{entry.level || 1} {levelInfo.name}
                                  </span>
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                  <div style={{ fontWeight: 800, fontSize: '16px', color: '#111827' }}>
                                    {(entry.totalEarned || 0).toLocaleString()}
                                  </div>
                                  <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                                    {(entry.points || 0).toLocaleString()} available
                                  </div>
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                    <Flame size={14} color={entry.streak >= 7 ? '#dc2626' : '#f59e0b'} />
                                    <span style={{ fontWeight: 700, fontSize: '14px', color: entry.streak >= 7 ? '#dc2626' : '#f59e0b' }}>
                                      {entry.streak}d
                                    </span>
                                  </div>
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                  <RankChange change={entry.rankChange} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* BADGES TAB */}
          <TabsContent value="badges">
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Achievement Badges</h3>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Earn badges by completing challenges, reaching milestones, and demonstrating excellence</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
              {mockBadges.map(badge => {
                const def = BADGE_DEFINITIONS[badge.category] || BADGE_DEFINITIONS.completion;
                return (
                  <Card key={badge.id} style={{ border: `1px solid ${def.color}30`, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <CardContent style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                          width: '56px', height: '56px', borderRadius: '14px',
                          background: def.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '28px', flexShrink: 0,
                        }}>
                          {badge.icon}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: '#111827', marginBottom: '4px' }}>{badge.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              background: def.bg, color: def.color,
                              fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '8px',
                            }}>
                              {def.label}
                            </span>
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                              {badge.earnedBy} players earned
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Badge Leaderboard */}
            <Card style={{ border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <CardHeader>
                <CardTitle style={{ fontSize: '16px' }}>Most Badges Earned</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredLeaderboard.slice(0, 10).map((entry, idx) => {
                  const badgeCount = Math.max(0, 5 - idx + ((idx * 7 + 3) % 3));
                  return (
                    <div key={entry.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 0', borderBottom: idx < 9 ? '1px solid #f3f4f6' : 'none',
                    }}>
                      <div style={{ width: '28px', textAlign: 'center', fontWeight: 700, color: '#9ca3af', fontSize: '14px' }}>
                        #{idx + 1}
                      </div>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: `hsl(${(entry.playerId * 47) % 360}, 60%, 85%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '14px', fontWeight: 800, color: `hsl(${(entry.playerId * 47) % 360}, 60%, 35%)`,
                        flexShrink: 0,
                      }}>
                        {entry.name.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{entry.name}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af' }}>{entry.teamName}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {Array.from({ length: Math.min(badgeCount, 5) }).map((_, i) => (
                          <span key={i} style={{ fontSize: '16px' }}>
                            {['⭐', '🏆', '🎯', '⚡', '✅'][i]}
                          </span>
                        ))}
                        {badgeCount > 5 && (
                          <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>+{badgeCount - 5}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredLeaderboard.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <Award size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p>No badge data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* LEVELS TAB */}
          <TabsContent value="levels">
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#111827', marginBottom: '8px' }}>Player Levels</h3>
              <p style={{ color: '#6b7280', fontSize: '14px' }}>Progress through levels by earning points from training, matches, and achievements</p>
            </div>

            {/* Level progression chart */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', marginBottom: '32px' }}>
              {LEVEL_INFO.map(lvl => {
                const playersAtLevel = filteredLeaderboard.filter(e => (e.level || 1) === lvl.level).length;
                return (
                  <Card key={lvl.level} style={{ border: `2px solid ${lvl.color}40`, textAlign: 'center' }}>
                    <CardContent style={{ padding: '16px 8px' }}>
                      <div style={{ fontSize: '24px', marginBottom: '6px' }}>
                        {lvl.level === 7 ? '👑' : lvl.level === 6 ? '🏆' : lvl.level === 5 ? '⭐' : lvl.level === 4 ? '🎯' : lvl.level === 3 ? '⚡' : lvl.level === 2 ? '🔵' : '⚪'}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '13px', color: lvl.color }}>Lv.{lvl.level}</div>
                      <div style={{ fontWeight: 600, fontSize: '11px', color: '#374151', marginBottom: '4px' }}>{lvl.name}</div>
                      <div style={{ fontSize: '10px', color: '#9ca3af' }}>{lvl.minPoints}+ pts</div>
                      <div style={{ marginTop: '8px', background: lvl.color, color: '#fff', borderRadius: '8px', padding: '2px 0', fontSize: '12px', fontWeight: 700 }}>
                        {playersAtLevel}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Level distribution */}
            <Card style={{ border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', marginBottom: '24px' }}>
              <CardHeader>
                <CardTitle style={{ fontSize: '16px' }}>Level Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {LEVEL_INFO.map(lvl => {
                  const playersAtLevel = filteredLeaderboard.filter(e => (e.level || 1) === lvl.level).length;
                  const pct = totalPlayers > 0 ? (playersAtLevel / totalPlayers) * 100 : 0;
                  return (
                    <div key={lvl.level} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{ width: '80px', fontSize: '13px', fontWeight: 600, color: lvl.color }}>Lv.{lvl.level} {lvl.name}</div>
                      <div style={{ flex: 1, background: '#f3f4f6', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, background: lvl.color, height: '100%', borderRadius: '6px', transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ width: '40px', textAlign: 'right', fontSize: '13px', fontWeight: 700, color: '#374151' }}>{playersAtLevel}</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Players near level up */}
            <Card style={{ border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <CardHeader>
                <CardTitle style={{ fontSize: '16px' }}>Close to Level Up</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredLeaderboard.slice(0, 5).map((entry, idx) => {
                  const currentLvl = getLevelInfo(entry.level || 1);
                  const nextLvl = getLevelInfo((entry.level || 1) + 1);
                  const progress = nextLvl
                    ? Math.min(100, Math.round(((entry.totalEarned || 0) - currentLvl.minPoints) / (nextLvl.minPoints - currentLvl.minPoints) * 100))
                    : 100;
                  const pointsNeeded = nextLvl ? nextLvl.minPoints - (entry.totalEarned || 0) : 0;
                  return (
                    <div key={entry.id} style={{ marginBottom: idx < 4 ? '20px' : '0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '32px', height: '32px', borderRadius: '50%',
                            background: `hsl(${(entry.playerId * 47) % 360}, 60%, 85%)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 800, color: `hsl(${(entry.playerId * 47) % 360}, 60%, 35%)`,
                          }}>
                            {entry.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>{entry.name}</div>
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                              Lv.{entry.level || 1} {currentLvl.name} → Lv.{(entry.level || 1) + 1} {nextLvl?.name || 'Max'}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: nextLvl?.color || '#D4AF37' }}>{progress}%</div>
                          {pointsNeeded > 0 && (
                            <div style={{ fontSize: '11px', color: '#9ca3af' }}>{pointsNeeded} pts to go</div>
                          )}
                        </div>
                      </div>
                      <div style={{ background: '#f3f4f6', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${progress}%`, height: '100%', borderRadius: '6px',
                          background: `linear-gradient(90deg, ${currentLvl.color}, ${nextLvl?.color || '#D4AF37'})`,
                          transition: 'width 0.5s',
                        }} />
                      </div>
                    </div>
                  );
                })}
                {filteredLeaderboard.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                    <TrendingUp size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                    <p>No player data available yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
