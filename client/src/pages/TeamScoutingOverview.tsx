import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Target, TrendingUp, AlertTriangle, Star, Search, Filter,
  ChevronRight, BarChart3, Users, ArrowUpRight, ArrowLeft
} from "lucide-react";

const POTENTIAL_COLORS: Record<string, string> = {
  elite: "bg-yellow-500 text-yellow-950",
  high: "bg-green-500 text-white",
  medium: "bg-blue-500 text-white",
  low: "bg-gray-400 text-white",
};

const POTENTIAL_LABELS: Record<string, string> = {
  elite: "Elite",
  high: "High",
  medium: "Medium",
  low: "Low",
};

function RatingCircle({ value, color }: { value: number; color: string }) {
  const r = 20;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#e5e7eb" strokeWidth="4" />
      <circle
        cx="26" cy="26" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 26 26)"
      />
      <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor">{value}</text>
    </svg>
  );
}

export default function TeamScoutingOverview() {
  const params = useParams<{ teamId: string }>();
  const [, navigate] = useLocation();
  const teamId = parseInt(params.teamId || "0");
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [potentialFilter, setPotentialFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");

  const { data: profiles = [], isLoading } = trpc.scoutingProfiles.getByTeam.useQuery(
    { teamId },
    { enabled: !!teamId }
  );

  const { data: team } = trpc.teams.getById.useQuery({ id: teamId }, { enabled: !!teamId });

  const filtered = profiles.filter((p: any) => {
    const matchesSearch = !search || p.playerName?.toLowerCase().includes(search.toLowerCase());
    const matchesPotential = potentialFilter === "all" || p.potentialRating === potentialFilter;
    const matchesPosition = positionFilter === "all" || p.position?.toLowerCase() === positionFilter.toLowerCase();
    return matchesSearch && matchesPotential && matchesPosition;
  });

  const avgRating = profiles.length > 0
    ? Math.round(profiles.reduce((sum: number, p: any) => sum + (p.overallRating ?? 0), 0) / profiles.length)
    : 0;

  const eliteCount = profiles.filter((p: any) => p.potentialRating === "elite").length;
  const highCount = profiles.filter((p: any) => p.potentialRating === "high").length;

  return (
    <>
      <div className="container py-6 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div>
              <PageBreadcrumb
                items={[
                  { label: "Scouting", labelAr: "الاستكشاف", href: "/scouting" },
                  { label: team ? team.name : "Team Scouting", labelAr: "استكشاف الفريق" },
                ]}
                className="mb-1"
              />
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Team Scouting Overview
              </h1>
              {team && <p className="text-muted-foreground text-sm">{team.name}</p>}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto text-primary mb-1" />
            <p className="text-2xl font-bold">{profiles.length}</p>
            <p className="text-xs text-muted-foreground">Players Assessed</p>
          </Card>
          <Card className="p-4 text-center">
            <BarChart3 className="h-6 w-6 mx-auto text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{avgRating}</p>
            <p className="text-xs text-muted-foreground">Avg Overall Rating</p>
          </Card>
          <Card className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto text-yellow-700 dark:text-yellow-500 mb-1" />
            <p className="text-2xl font-bold">{eliteCount}</p>
            <p className="text-xs text-muted-foreground">Elite Potential</p>
          </Card>
          <Card className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto text-green-700 dark:text-green-500 mb-1" />
            <p className="text-2xl font-bold">{highCount}</p>
            <p className="text-xs text-muted-foreground">High Potential</p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search players..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={potentialFilter} onValueChange={setPotentialFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Potential" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Potential</SelectItem>
              <SelectItem value="elite">Elite</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
          <Select value={positionFilter} onValueChange={setPositionFilter}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Position" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Positions</SelectItem>
              {["GK","CB","LB","RB","CDM","CM","CAM","LW","RW","ST","CF"].map(p => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Player Cards Grid */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading scouting data...</div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No scouting reports found for this team.</p>
            <p className="text-sm text-muted-foreground mt-1">Open a player profile and click "Scouting" to create one.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((profile: any) => (
              <Card key={profile.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/player/${profile.playerId}/scouting`)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile.avatarUrl} />
                        <AvatarFallback>{profile.playerName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-sm">{profile.playerName}</p>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs py-0">{profile.position}</Badge>
                          <Badge className={`text-xs py-0 ${POTENTIAL_COLORS[profile.potentialRating ?? 'medium']}`}>
                            {POTENTIAL_LABELS[profile.potentialRating ?? 'medium']}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Ratings Row */}
                  <div className="flex justify-around mb-3">
                    <div className="text-center">
                      <RatingCircle value={profile.overallRating ?? 50} color="#6366f1" />
                      <p className="text-xs text-muted-foreground mt-1">Overall</p>
                    </div>
                    <div className="text-center">
                      <RatingCircle value={profile.technicalRating ?? 50} color="#3b82f6" />
                      <p className="text-xs text-muted-foreground mt-1">Technical</p>
                    </div>
                    <div className="text-center">
                      <RatingCircle value={profile.physicalRating ?? 50} color="#22c55e" />
                      <p className="text-xs text-muted-foreground mt-1">Physical</p>
                    </div>
                    <div className="text-center">
                      <RatingCircle value={profile.mentalRating ?? 50} color="#a855f7" />
                      <p className="text-xs text-muted-foreground mt-1">Mental</p>
                    </div>
                  </div>

                  {/* Positions */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Now:</span>
                      <span className="font-bold text-green-600">{profile.recommendedPosition ?? "—"}</span>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">Future:</span>
                      <span className="font-bold text-blue-600">{profile.futurePosition ?? "—"}</span>
                    </div>
                  </div>

                  {/* Top Strength */}
                  {profile.strengthPoints?.length > 0 && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded text-xs text-green-700 dark:text-green-400 flex items-start gap-1">
                      <Star className="h-3 w-3 flex-shrink-0 mt-0.5" />
                      {profile.strengthPoints[0]}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
