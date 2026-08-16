import { useState } from "react";
import * as React from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useParentChild } from "@/contexts/ParentChildContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Download, Share2, Star, Zap, Target, Shield, Activity, TrendingUp } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import { useRef, useState as useStateAlias } from "react";
import html2canvas from "html2canvas";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip
} from "recharts";

// Derive a FIFA-style overall rating from player stats
function calcOverall(stats: any): number {
  if (!stats) return 65;
  const pace = stats.speed ?? 70;
  const shooting = stats.shooting ?? 65;
  const passing = stats.passing ?? 68;
  const dribbling = stats.dribbling ?? 72;
  const defending = stats.defending ?? 60;
  const physical = stats.physical ?? 70;
  return Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);
}

function getRatingColor(rating: number): string {
  if (rating >= 85) return "#FFD700"; // gold
  if (rating >= 75) return "#C0C0C0"; // silver
  if (rating >= 65) return "#CD7F32"; // bronze
  return "#4ade80"; // green for youth
}

function getPositionAbbr(position: string): string {
  const map: Record<string, string> = {
    goalkeeper: "GK",
    defender: "CB",
    midfielder: "CM",
    forward: "ST",
  };
  return map[position] ?? position?.toUpperCase().slice(0, 3) ?? "MF";
}

interface SkillStat {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

export default function PlayerFIFACard() {
  // Team type filter
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const teamTypeFilter = searchParams.get('team') as 'main' | 'academy' | null;
  const [selectedTeamTypeFilter, setSelectedTeamTypeFilter] = React.useState<'all' | 'main' | 'academy'>(
    teamTypeFilter || 'all'
  );
  const cardRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();
  const [isDownloading, setIsDownloading] = useStateAlias(false);
  const { user } = useAuth();

  function handleWhatsAppShare() {
    const text = encodeURIComponent(
      `⚽ Check out ${playerName}'s Future Stars Academy Player Card!\n\n` +
      `📊 Overall Rating: ${overall}\n` +
      `📍 Position: ${position}\n` +
      `⭐ Level: ${playerLevel}\n` +
      `🏆 Points: ${pointsData?.points ?? 0}\n\n` +
      `🏟️ Future Stars Academy — Building Champions Since 1907`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${playerName.replace(/\s+/g, '_')}_card.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Download failed', e);
    } finally {
      setIsDownloading(false);
    }
  }
  const { selectedChildId, linkedPlayers: parentLinkedPlayers } = useParentChild();
  const [, navigate] = useLocation();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [selectorTeamId, setSelectorTeamId] = useState<number>(0);

  // Determine which player to show
  const isPlayer = user?.role === "player";
  const isParent = user?.role === "parent";
  const isStaff = ["admin", "coach", "physical_trainer"].includes(user?.role ?? "");

  // Get all players for staff
  const { data: allPlayers } = trpc.players.getAll.useQuery(undefined, { enabled: isStaff });
  const { data: allTeams = [] } = trpc.teams.getAll.useQuery(undefined, { enabled: isStaff });
  const mainTeams = (allTeams as any[]).filter((t: any) => t.teamType === 'main');
  const academyTeams = (allTeams as any[]).filter((t: any) => t.teamType === 'academy');

  // Get player profile
  const selectedChildPlayer = isParent && selectedChildId
    ? parentLinkedPlayers.find((p: any) => p.id.toString() === selectedChildId)
    : null;
  const targetPlayerId = isPlayer
    ? undefined // will use user-linked player
    : isParent && selectedChildPlayer
    ? selectedChildPlayer.id
    : selectedPlayerId;

  const { data: playerData } = trpc.players.getById.useQuery(
    { id: targetPlayerId! },
    { enabled: !!targetPlayerId }
  );

  // Get performance stats (latest metric)
  const { data: perfStats } = trpc.performance.getLatest.useQuery(
    { playerId: targetPlayerId! },
    { enabled: !!targetPlayerId }
  );

  // Get attendance rate
  const { data: attendanceData } = trpc.attendance.getPlayerAttendance.useQuery(
    { playerId: targetPlayerId!, dateRange: 'season' },
    { enabled: !!targetPlayerId }
  );

  // Get points
  const { data: pointsData } = trpc.points.getPlayerPoints.useQuery(
    { playerId: targetPlayerId! },
    { enabled: !!targetPlayerId }
  );

  // Derive level from points
  const playerLevel = Math.floor((pointsData?.points ?? 0) / 500) + 1;

  // Build skill stats from real data or defaults
  const skillStats: SkillStat[] = [
    { label: "Speed", value: perfStats?.topSpeed ? Math.min(99, Math.round(perfStats.topSpeed * 3)) : 72, icon: <Zap className="w-4 h-4" />, color: "#f59e0b" },
    { label: "Dribbling", value: perfStats?.dribbles ?? 74, icon: <Activity className="w-4 h-4" />, color: "#3b82f6" },
    { label: "First Touch", value: perfStats?.touches ? Math.min(99, Math.round(perfStats.touches / 5)) : 70, icon: <Target className="w-4 h-4" />, color: "#10b981" },
    { label: "Agility", value: perfStats?.sprints ? Math.min(99, 60 + perfStats.sprints) : 68, icon: <TrendingUp className="w-4 h-4" />, color: "#8b5cf6" },
    { label: "Power", value: perfStats?.distanceCovered ? Math.min(99, Math.round(Number(perfStats.distanceCovered) / 100)) : 71, icon: <Shield className="w-4 h-4" />, color: "#ef4444" },
    { label: "Two-Footed", value: perfStats?.successfulDribbles ? Math.min(99, 50 + perfStats.successfulDribbles) : 55, icon: <Star className="w-4 h-4" />, color: "#ec4899" },
  ];

  const radarData = skillStats.map(s => ({ subject: s.label, value: s.value, fullMark: 99 }));
  const overall = calcOverall({
    speed: skillStats[0].value,
    shooting: skillStats[4].value,
    passing: skillStats[2].value,
    dribbling: skillStats[1].value,
    defending: skillStats[5].value,
    physical: skillStats[3].value,
  });
  const ratingColor = getRatingColor(overall);

  const player = playerData;
  const playerName = player ? `${player.firstName} ${player.lastName}` : "Select a Player";
  const position = getPositionAbbr(player?.position ?? "midfielder");

  return (
    <>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold">Player Card</h1>
            <p className="text-muted-foreground text-sm">FIFA-style skill profile</p>
          </div>
        </div>

        {/* Staff player selector */}
        {isStaff && (
          <div className="mb-6 space-y-3 p-4 bg-muted/30 rounded-xl border border-border">
            {/* Step 1: Team Type */}
            <div>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-wide text-muted-foreground">
                {language === 'ar' ? '① اختر نوع الفريق' : '① Select Team Type'}
              </label>
              <div className="flex gap-2 flex-wrap">
                {[{v:'all',en:'All',ar:'الكل'},{v:'main',en:'⚽ Main Team',ar:'⚽ الفريق الأول'},{v:'academy',en:'🛡️ Academy',ar:'🛡️ الأكاديمية'}].map(opt => (
                  <button key={opt.v} onClick={() => { setSelectedTeamTypeFilter(opt.v as any); setSelectorTeamId(0); setSelectedPlayerId(null); }}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      selectedTeamTypeFilter === opt.v ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                    }`}>
                    {language === 'ar' ? opt.ar : opt.en}
                  </button>
                ))}
              </div>
            </div>
            {/* Step 2: Sub-team */}
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-muted-foreground">
                {language === 'ar' ? '② اختر الفريق الفرعي (اختياري)' : '② Filter by Sub-team (optional)'}
              </label>
              <Select value={selectorTeamId ? String(selectorTeamId) : ""} onValueChange={v => { setSelectorTeamId(Number(v)); setSelectedPlayerId(null); }}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder={language === 'ar' ? 'كل الفرق...' : 'All sub-teams...'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">{language === 'ar' ? 'كل الفرق' : 'All teams'}</SelectItem>
                  {(selectedTeamTypeFilter === 'all' || selectedTeamTypeFilter === 'main') && mainTeams.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                  {(selectedTeamTypeFilter === 'all' || selectedTeamTypeFilter === 'academy') && academyTeams.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Step 3: Player */}
            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wide text-muted-foreground">
                {language === 'ar' ? '③ اختر اللاعب' : '③ Select Player'}
              </label>
              <Select value={selectedPlayerId ? String(selectedPlayerId) : ""} onValueChange={(v) => setSelectedPlayerId(Number(v))}>
                <SelectTrigger className="w-72">
                  <SelectValue placeholder="Select a player to view card..." />
                </SelectTrigger>
                <SelectContent>
                  {(allPlayers || []).filter((p: any) => {
                    const typeMatch = selectedTeamTypeFilter === 'all' || 
                      (allTeams as any[]).some((t: any) => t.id === p.teamId && t.teamType === selectedTeamTypeFilter);
                    const teamMatch = selectorTeamId > 0 ? p.teamId === selectorTeamId : true;
                    return typeMatch && teamMatch;
                  }).map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      #{p.jerseyNumber} {p.firstName} {p.lastName} — {p.ageGroup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {!targetPlayerId && !isPlayer ? (
          <Card>
            <CardContent className="p-16 text-center text-muted-foreground">
              <Star className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">Select a player to view their card</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FIFA Card Visual */}
            <div className="flex justify-center">
              <div
                ref={cardRef}
                className="relative w-72 rounded-2xl overflow-hidden shadow-2xl"
                style={{
                  background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)`,
                  border: `2px solid ${ratingColor}`,
                  minHeight: "420px",
                }}
              >
                {/* Card Header */}
                <div className="p-5 pb-2">
                  <div className="flex justify-between items-start">
                    <div className="text-center">
                      <div className="text-5xl font-black" style={{ color: ratingColor }}>{overall}</div>
                      <div className="text-xs font-bold tracking-widest mt-1" style={{ color: ratingColor }}>{position}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-foreground/60 text-xs">AL AHLY</div>
                      <div className="text-foreground/60 text-xs">ACADEMY</div>
                      <div className="w-9 h-9 mt-1 ml-auto flex items-center justify-center">
                        <img src="/logo-transparent.png" alt="Future Stars FC" className="w-9 h-9 object-contain" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Player Avatar */}
                <div className="flex justify-center py-3">
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center text-4xl font-black"
                    style={{
                      background: `radial-gradient(circle, ${ratingColor}33, ${ratingColor}11)`,
                      border: `3px solid ${ratingColor}`,
                      color: ratingColor,
                    }}
                  >
                    {player ? player.firstName[0] + player.lastName[0] : "??"}
                  </div>
                </div>

                {/* Player Name */}
                <div className="text-center px-4 pb-3">
                  <div className="text-foreground font-black text-xl tracking-wide uppercase">
                    {player?.lastName ?? "PLAYER"}
                  </div>
                  <div className="text-foreground/60 text-sm">{player?.firstName ?? ""}</div>
                  <div className="flex justify-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs border-white/30 text-foreground/70">
                      #{player?.jerseyNumber ?? "--"}
                    </Badge>
                    <Badge variant="outline" className="text-xs border-white/30 text-foreground/70">
                      {player?.ageGroup ?? "Academy"}
                    </Badge>
                  </div>
                </div>

                {/* 6 Skill Stats */}
                <div className="grid grid-cols-3 gap-1 px-4 pb-5">
                  {skillStats.map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                      <div className="text-foreground/50 text-xs">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Bottom accent */}
                <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, transparent, ${ratingColor}, transparent)` }} />
              </div>
            </div>

            {/* Stats Panel */}
            <div className="space-y-4">
              {/* Radar Chart */}
              <Card>
                <CardContent className="pt-4 pb-2">
                  <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">Skills Radar</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis angle={90} domain={[0, 99]} tick={false} />
                      <Radar
                        name="Skills"
                        dataKey="value"
                        stroke={ratingColor}
                        fill={ratingColor}
                        fillOpacity={0.25}
                        strokeWidth={2}
                      />
                      <Tooltip formatter={(v) => [`${v}`, "Rating"]} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-black text-green-700 dark:text-green-500">
                      {attendanceData?.attendanceRate ?? 0}%
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Attendance</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-black text-amber-700 dark:text-amber-500">
                      {pointsData?.points ?? 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Points</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-black text-blue-500">
                      {playerLevel}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">Level</div>
                  </CardContent>
                </Card>
              </div>

              {/* Skill Bars */}
              <Card>
                <CardContent className="pt-4">
                  <h3 className="font-semibold text-sm mb-3 text-muted-foreground uppercase tracking-wide">Skill Breakdown</h3>
                  <div className="space-y-3">
                    {skillStats.map((stat) => (
                      <div key={stat.label} className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 w-28 shrink-0" style={{ color: stat.color }}>
                          {stat.icon}
                          <span className="text-xs font-medium text-foreground">{stat.label}</span>
                        </div>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${stat.value}%`, background: stat.color }}
                          />
                        </div>
                        <span className="text-sm font-bold w-8 text-right">{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={handleDownload} disabled={isDownloading}>
                  <Download className="w-4 h-4" />
                  {isDownloading ? 'Exporting...' : 'Download PNG'}
                </Button>
                <Button variant="outline" className="flex-1 gap-2" onClick={handleWhatsAppShare}>
                  <Share2 className="w-4 h-4" />
                  Share on WhatsApp
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
