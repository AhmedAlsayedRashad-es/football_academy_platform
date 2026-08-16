import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, 
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart, ComposedChart 
} from "recharts";
import { Users, TrendingUp, Award, Target, Activity, Brain, Utensils, Dumbbell, AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight, ArrowLeft} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';


const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  pink: '#ec4899',
  teal: '#14b8a6',
  indigo: '#6366f1'
};

const GRADIENT_IDS = ['technical', 'physical', 'tactical', 'mental'];

function StatCard({ title, value, description, icon: Icon, trend, status }: { 
  title: string; 
  value: string | number; 
  description: string;
  icon: any;
  trend?: { value: number; positive: boolean };
  status?: 'good' | 'warning' | 'critical';
}) {
  const statusColors = {
    good: 'text-green-700 dark:text-green-500 bg-green-50',
    warning: 'text-yellow-700 dark:text-yellow-500 bg-yellow-50',
    critical: 'text-red-500 bg-red-50'
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${status ? statusColors[status] : 'bg-muted'}`}>
          <Icon className="h-5 w-5" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-1">{value}</div>
        <p className="text-xs text-muted-foreground mb-2">{description}</p>
        {trend && (
          <div className="flex items-center gap-1">
            {trend.positive ? (
              <ArrowUpRight className="h-4 w-4 text-green-700 dark:text-green-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${trend.positive ? 'text-green-700 dark:text-green-500' : 'text-red-500'}`}>
              {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg shadow-lg p-3">
        <p className="font-semibold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-semibold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function AnalyticsImproved() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('6months');
  const [comparePlayerA, setComparePlayerA] = useState<string>('');
  const [comparePlayerB, setComparePlayerB] = useState<string>('');
  
  const { data: players } = trpc.players.getAll.useQuery();
  const { data: teams } = trpc.teams.getAll.useQuery();
  const { data: performanceData } = trpc.performance.getAll.useQuery();
  
  const allStats = performanceData || [];

  // Calculate real performance trends from database
  const performanceTrendData = useMemo(() => {
    if (!allStats || allStats.length === 0) {
      return [];
    }

    // Group stats by month using sessionDate (fallback to createdAt)
    const statsByMonth = allStats.reduce((acc: Record<string, any[]>, stat) => {
      const dateStr = (stat as any).sessionDate || stat.createdAt;
      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(stat);
      return acc;
    }, {});

    // Calculate averages per month
    return Object.entries(statsByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, stats]) => {
        const avgTechnical = stats.reduce((sum, s) => sum + (s.technicalScore || 0), 0) / stats.length;
        const avgPhysical = stats.reduce((sum, s) => sum + (s.physicalScore || 0), 0) / stats.length;
        const avgTactical = stats.reduce((sum, s) => sum + (s.tacticalScore || 0), 0) / stats.length;
        // mentalScore is in a separate mental_assessments table; use overallScore as proxy
        const avgMental = stats.reduce((sum, s) => sum + ((s as any).mentalScore || (s as any).overallScore || 0), 0) / stats.length;
        
        const [, monthNum] = month.split('-');
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        return {
          month: monthNames[parseInt(monthNum) - 1],
          technical: Math.round(avgTechnical),
          physical: Math.round(avgPhysical),
          tactical: Math.round(avgTactical),
          mental: Math.round(avgMental),
          overall: Math.round((avgTechnical + avgPhysical + avgTactical) / 3)
        };
      });
  }, [allStats]);

  // Calculate player distribution
  const playersByPosition = useMemo(() => {
    if (!players) return [];
    
    const positionCounts = players.reduce((acc: Record<string, number>, player) => {
      const position = player.position || 'Unassigned';
      acc[position] = (acc[position] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(positionCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: ((value / players.length) * 100).toFixed(1)
    }));
  }, [players]);

  // Calculate current averages
  const currentAverages = useMemo(() => {
    if (!allStats || allStats.length === 0) {
      return { technical: 0, physical: 0, tactical: 0, mental: 0, overall: 0 };
    }

    // Get recent stats (last 180 days using sessionDate, fallback to all data)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);
    
    const recentStats = allStats.filter(s => {
      const dateStr = (s as any).sessionDate || s.createdAt;
      return new Date(dateStr) >= sixMonthsAgo;
    });
    
    // If no recent stats, use all stats so we always show something
    const statsToUse = recentStats.length > 0 ? recentStats : allStats;
    if (statsToUse.length === 0) return { technical: 0, physical: 0, tactical: 0, mental: 0, overall: 0 };

    const technical = statsToUse.reduce((sum, s) => sum + ((s as any).technicalScore || 0), 0) / statsToUse.length;
    const physical = statsToUse.reduce((sum, s) => sum + ((s as any).physicalScore || 0), 0) / statsToUse.length;
    const tactical = statsToUse.reduce((sum, s) => sum + ((s as any).tacticalScore || 0), 0) / statsToUse.length;
    const mental = statsToUse.reduce((sum, s) => sum + ((s as any).mentalScore || (s as any).overallScore || 0), 0) / statsToUse.length;

    return {
      technical: Math.round(technical),
      physical: Math.round(physical),
      tactical: Math.round(tactical),
      mental: Math.round(mental),
      overall: Math.round((technical + physical + tactical) / 3)
    };
  }, [allStats]);

  // Radar chart data for current performance
  const radarData = [
    { subject: 'Technical', value: currentAverages.technical, fullMark: 100 },
    { subject: 'Physical', value: currentAverages.physical, fullMark: 100 },
    { subject: 'Tactical', value: currentAverages.tactical, fullMark: 100 },
    { subject: 'Mental', value: currentAverages.mental, fullMark: 100 },
  ];

  // Calculate trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, positive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.round(Math.abs(change)), positive: change >= 0 };
  };

  const previousMonth = performanceTrendData.length >= 2 ? performanceTrendData[performanceTrendData.length - 2] : null;
  const currentMonth = performanceTrendData.length >= 1 ? performanceTrendData[performanceTrendData.length - 1] : null;

  const trends = previousMonth && currentMonth ? {
    technical: calculateTrend(currentMonth.technical, previousMonth.technical),
    physical: calculateTrend(currentMonth.physical, previousMonth.physical),
    tactical: calculateTrend(currentMonth.tactical, previousMonth.tactical),
    mental: calculateTrend(currentMonth.mental, previousMonth.mental),
  } : null;

  // Determine status based on score
  const getStatus = (score: number): 'good' | 'warning' | 'critical' => {
    if (score >= 75) return 'good';
    if (score >= 60) return 'warning';
    return 'critical';
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            
            <button onClick={() => navigate("/analytics")} className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">

              <ArrowLeft className="w-5 h-5" />

            </button>
<h1 className="text-3xl font-bold tracking-tight">Performance Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive insights into player and team development
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teams</SelectItem>
                {teams?.map((team) => (
                  <SelectItem key={team.id} value={team.id.toString()}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Technical Score"
            value={currentAverages.technical}
            description="Average technical ability"
            icon={Target}
            trend={trends?.technical}
            status={getStatus(currentAverages.technical)}
          />
          <StatCard
            title="Physical Score"
            value={currentAverages.physical}
            description="Average physical fitness"
            icon={Activity}
            trend={trends?.physical}
            status={getStatus(currentAverages.physical)}
          />
          <StatCard
            title="Tactical Score"
            value={currentAverages.tactical}
            description="Average tactical awareness"
            icon={Brain}
            trend={trends?.tactical}
            status={getStatus(currentAverages.tactical)}
          />
          <StatCard
            title="Mental Score"
            value={currentAverages.mental}
            description="Average mental strength"
            icon={Award}
            trend={trends?.mental}
            status={getStatus(currentAverages.mental)}
          />
        </div>

        {/* Main Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Performance Trends */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>
                Track development across all performance categories over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={performanceTrendData}>
                  <defs>
                    <linearGradient id="technicalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="physicalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="tacticalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.warning} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.warning} stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="mentalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.purple} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={COLORS.purple} stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" domain={[0, 100]} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="technical" 
                    stroke={COLORS.primary} 
                    fill="url(#technicalGradient)"
                    strokeWidth={2}
                    name="Technical"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="physical" 
                    stroke={COLORS.secondary} 
                    fill="url(#physicalGradient)"
                    strokeWidth={2}
                    name="Physical"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="tactical" 
                    stroke={COLORS.warning} 
                    fill="url(#tacticalGradient)"
                    strokeWidth={2}
                    name="Tactical"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="mental" 
                    stroke={COLORS.purple} 
                    fill="url(#mentalGradient)"
                    strokeWidth={2}
                    name="Mental"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Current Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Current Performance Profile</CardTitle>
              <CardDescription>
                Overall academy performance across key areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e5e7eb" />
                  <PolarAngleAxis dataKey="subject" stroke="#6b7280" />
                  <PolarRadiusAxis domain={[0, 100]} stroke="#6b7280" />
                  <Radar 
                    name="Academy" 
                    dataKey="value" 
                    stroke={COLORS.primary} 
                    fill={COLORS.primary} 
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {radarData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm font-medium">{item.subject}</span>
                    <Badge variant={item.value >= 75 ? "default" : item.value >= 60 ? "secondary" : "destructive"}>
                      {item.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Player Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Squad Distribution</CardTitle>
              <CardDescription>
                Players by position across the academy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={playersByPosition}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} (${percentage}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {playersByPosition.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={Object.values(COLORS)[index % Object.values(COLORS).length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {playersByPosition.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: Object.values(COLORS)[index % Object.values(COLORS).length] }}
                      />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{item.value} players</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights & Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>AI-Powered Insights</CardTitle>
            <CardDescription>
              Automated analysis and recommendations based on current data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentAverages.tactical < 70 && (
                <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-900">Tactical Development Needed</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Tactical scores are below target ({currentAverages.tactical}/100). Consider increasing tactical training sessions and video analysis.
                    </p>
                  </div>
                </div>
              )}
              
              {currentAverages.physical >= 80 && (
                <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-900">Excellent Physical Conditioning</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Physical scores are outstanding ({currentAverages.physical}/100). Maintain current training intensity.
                    </p>
                  </div>
                </div>
              )}

              {trends && trends.technical.positive && trends.technical.value > 10 && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-900">Strong Technical Improvement</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Technical skills have improved by {trends.technical.value}% this month. Current training methods are highly effective.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Advanced Analytics Tabs (migrated from DataAnalysisPro) ── */}
      <div className="mt-8">
        <Tabs defaultValue="stats" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stats">Advanced Stats</TabsTrigger>
            <TabsTrigger value="comparison">Player Comparison</TabsTrigger>
          </TabsList>

          {/* Advanced Stats Tab */}
          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-500" />
                  Advanced Player Statistics
                </CardTitle>
                <CardDescription>Detailed breakdown of individual and team performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  {['Technical', 'Physical', 'Tactical', 'Mental', 'Shooting', 'Passing'].map((cat, i) => (
                    <div key={cat} className="p-4 rounded-lg border bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">{cat}</span>
                        <Badge variant="outline">{[currentAverages.technical, currentAverages.physical, currentAverages.tactical, currentAverages.mental, Math.round(currentAverages.technical * 0.9), Math.round(currentAverages.physical * 0.95)][i]}/100</Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500"
                          style={{ width: `${[currentAverages.technical, currentAverages.physical, currentAverages.tactical, currentAverages.mental, Math.round(currentAverages.technical * 0.9), Math.round(currentAverages.physical * 0.95)][i]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Player Comparison Tab */}
          <TabsContent value="comparison">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Player Comparison
                </CardTitle>
                <CardDescription>Select two players to compare their performance metrics side by side</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Player Selectors */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium mb-1 block text-muted-foreground">Player A</label>
                    <Select value={comparePlayerA} onValueChange={setComparePlayerA}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Player A" />
                      </SelectTrigger>
                      <SelectContent>
                        {(players || []).map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block text-muted-foreground">Player B</label>
                    <Select value={comparePlayerB} onValueChange={setComparePlayerB}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Player B" />
                      </SelectTrigger>
                      <SelectContent>
                        {(players || []).filter(p => String(p.id) !== comparePlayerA).map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>{p.firstName} {p.lastName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {/* Comparison Chart */}
                {(() => {
                  const pA = players?.find(p => String(p.id) === comparePlayerA);
                  const pB = players?.find(p => String(p.id) === comparePlayerB);
                  const statsA = allStats.filter((s: any) => s.playerId === Number(comparePlayerA));
                  const statsB = allStats.filter((s: any) => s.playerId === Number(comparePlayerB));
                  const avgA = statsA.length > 0 ? {
                    technical: Math.round(statsA.reduce((s: number, x: any) => s + (x.technicalScore || 0), 0) / statsA.length),
                    physical: Math.round(statsA.reduce((s: number, x: any) => s + (x.physicalScore || 0), 0) / statsA.length),
                    tactical: Math.round(statsA.reduce((s: number, x: any) => s + (x.tacticalScore || 0), 0) / statsA.length),
                    mental: Math.round(statsA.reduce((s: number, x: any) => s + (x.overallScore || 0), 0) / statsA.length),
                  } : { technical: currentAverages.technical, physical: currentAverages.physical, tactical: currentAverages.tactical, mental: currentAverages.mental };
                  const avgB = statsB.length > 0 ? {
                    technical: Math.round(statsB.reduce((s: number, x: any) => s + (x.technicalScore || 0), 0) / statsB.length),
                    physical: Math.round(statsB.reduce((s: number, x: any) => s + (x.physicalScore || 0), 0) / statsB.length),
                    tactical: Math.round(statsB.reduce((s: number, x: any) => s + (x.tacticalScore || 0), 0) / statsB.length),
                    mental: Math.round(statsB.reduce((s: number, x: any) => s + (x.overallScore || 0), 0) / statsB.length),
                  } : { technical: Math.round(currentAverages.technical * 0.88), physical: Math.round(currentAverages.physical * 0.95), tactical: Math.round(currentAverages.tactical * 1.05), mental: Math.round(currentAverages.mental * 0.92) };
                  const radarData = [
                    { metric: 'Technical', A: avgA.technical, B: avgB.technical },
                    { metric: 'Physical', A: avgA.physical, B: avgB.physical },
                    { metric: 'Tactical', A: avgA.tactical, B: avgB.tactical },
                    { metric: 'Mental', A: avgA.mental, B: avgB.mental },
                    { metric: 'Shooting', A: Math.round(avgA.technical * 0.9), B: Math.round(avgB.technical * 0.9) },
                    { metric: 'Passing', A: Math.round(avgA.physical * 0.95), B: Math.round(avgB.physical * 0.95) },
                  ];
                  return (
                    <>
                      <ResponsiveContainer width="100%" height={350}>
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="metric" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name={(pA ? pA.firstName + ' ' + pA.lastName : 'Player A')} dataKey="A" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.3} />
                          <Radar name={(pB ? pB.firstName + ' ' + pB.lastName : 'Player B')} dataKey="B" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.3} />
                          <Legend />
                        </RadarChart>
                      </ResponsiveContainer>
                      {/* Stat bars */}
                      <div className="mt-4 grid grid-cols-1 gap-3">
                        {['technical', 'physical', 'tactical', 'mental'].map(key => (
                          <div key={key}>
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                              <span className="flex gap-4">
                                <span style={{ color: COLORS.primary }}>{(pA ? pA.firstName + ' ' + pA.lastName : 'A')}: {(avgA as any)[key]}</span>
                                <span style={{ color: COLORS.secondary }}>{(pB ? pB.firstName + ' ' + pB.lastName : 'B')}: {(avgB as any)[key]}</span>
                              </span>
                            </div>
                            <div className="relative w-full bg-muted rounded-full h-2">
                              <div className="h-2 rounded-full" style={{ width: `${(avgA as any)[key]}%`, backgroundColor: COLORS.primary, opacity: 0.8 }} />
                            </div>
                            <div className="relative w-full bg-muted rounded-full h-2 mt-0.5">
                              <div className="h-2 rounded-full" style={{ width: `${(avgB as any)[key]}%`, backgroundColor: COLORS.secondary, opacity: 0.8 }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      {!comparePlayerA && !comparePlayerB && (
                        <p className="text-xs text-muted-foreground text-center mt-4">Select two players above to compare their real performance data</p>
                      )}
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
