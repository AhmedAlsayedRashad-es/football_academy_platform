import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { GitCompare, Trophy, Target, Activity, Shield, AlertTriangle, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

const STAT_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

function StatBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="w-full bg-muted rounded-full h-2 mt-1">
      <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function MultiMatchComparison() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isAr = language === "ar";
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: finishedMatches = [], isLoading: loadingList } = trpc.liveMatch.getFinished.useQuery();
  const { data: comparison = [], isLoading: loadingComparison } = trpc.liveMatch.getMultiMatchComparison.useQuery(
    { matchIds: selectedIds },
    { enabled: selectedIds.length >= 2 }
  );

  const toggleMatch = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const stats = [
    { key: "ourGoals", label: isAr ? "أهدافنا" : "Goals Scored", icon: Trophy },
    { key: "opponentGoals", label: isAr ? "أهداف المنافس" : "Goals Conceded", icon: Shield },
    { key: "shots", label: isAr ? "التسديدات" : "Shots", icon: Target },
    { key: "shotsOnTarget", label: isAr ? "على المرمى" : "On Target", icon: Target },
    { key: "possession", label: isAr ? "الاستحواذ %" : "Possession %", icon: Activity },
    { key: "corners", label: isAr ? "الركنيات" : "Corners", icon: Activity },
    { key: "fouls", label: isAr ? "الأخطاء" : "Fouls", icon: AlertTriangle },
    { key: "yellowCards", label: isAr ? "البطاقات الصفراء" : "Yellow Cards", icon: AlertTriangle },
  ];

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1 as any)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> {isAr ? "رجوع" : "Back"}
          </Button>
          <GitCompare className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <div>
            <PageBreadcrumb
              items={[
                { label: "Matches", labelAr: "المباريات", href: "/matches" },
                { label: isAr ? "مقارنة المباريات" : "Multi-Match Comparison" },
              ]}
              className="mb-1 text-muted-foreground"
            />
            <h1 className="text-2xl font-bold text-foreground">
              {isAr ? "مقارنة المباريات" : "Multi-Match Comparison"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isAr ? "قارن بين 2 إلى 4 مباريات منتهية جنباً إلى جنب" : "Compare 2 to 4 finished matches side by side"}
            </p>
          </div>
        </div>

        {/* Match Selector */}
        <Card className="bg-muted border-border">
          <CardHeader>
            <CardTitle className="text-foreground text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              {isAr ? "اختر المباريات (2-4)" : "Select Matches (2–4)"}
              <Badge variant="outline" className="ml-auto text-blue-600 dark:text-blue-400 border-blue-400">
                {selectedIds.length}/4 {isAr ? "محدد" : "selected"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingList ? (
              <p className="text-muted-foreground text-sm">{isAr ? "جاري التحميل..." : "Loading matches..."}</p>
            ) : finishedMatches.length === 0 ? (
              <p className="text-muted-foreground text-sm">{isAr ? "لا توجد مباريات منتهية بعد" : "No finished matches yet. Start a live match to record data."}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(finishedMatches as any[]).map((m: any) => {
                  const isSelected = selectedIds.includes(m.id);
                  const colorIdx = selectedIds.indexOf(m.id);
                  return (
                    <div
                      key={m.id}
                      onClick={() => toggleMatch(m.id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-border bg-muted/50 hover:border-gray-500"
                      }`}
                    >
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleMatch(m.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground font-medium text-sm truncate">vs {m.opponent}</p>
                        <p className="text-muted-foreground text-xs">
                          {m.homeScore}–{m.awayScore} · {m.currentFormation}
                        </p>
                      </div>
                      {isSelected && (
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: STAT_COLORS[colorIdx] }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Comparison Results */}
        {selectedIds.length >= 2 && (
          <>
            {loadingComparison ? (
              <div className="text-center py-12 text-muted-foreground">{isAr ? "جاري المقارنة..." : "Loading comparison..."}</div>
            ) : (comparison as any[]).length >= 2 ? (
              <>
                {/* Score Cards */}
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${(comparison as any[]).length}, 1fr)` }}>
                  {(comparison as any[]).map((m: any, idx: number) => (
                    <Card key={m.matchId} className="bg-muted border-border" style={{ borderTopColor: STAT_COLORS[idx], borderTopWidth: 3 }}>
                      <CardContent className="pt-4 text-center">
                        <div className="text-xs text-muted-foreground mb-1">{isAr ? "ضد" : "vs"}</div>
                        <div className="text-foreground font-bold text-lg truncate">{m.opponent}</div>
                        <div className="text-4xl font-black my-2" style={{ color: STAT_COLORS[idx] }}>
                          {m.homeScore}–{m.awayScore}
                        </div>
                        <Badge variant="outline" className="text-xs" style={{ color: STAT_COLORS[idx], borderColor: STAT_COLORS[idx] }}>
                          {m.formation}
                        </Badge>
                        {m.finishedAt && (
                          <p className="text-muted-foreground text-xs mt-2">
                            {new Date(m.finishedAt).toLocaleDateString()}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Stats Comparison */}
                <Card className="bg-muted border-border">
                  <CardHeader>
                    <CardTitle className="text-foreground text-base">
                      {isAr ? "مقارنة الإحصائيات" : "Statistics Comparison"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {stats.map(({ key, label, icon: Icon }) => {
                      const values = (comparison as any[]).map((m: any) => Number(m[key]) || 0);
                      const maxVal = Math.max(...values, 1);
                      return (
                        <div key={key}>
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground text-sm font-medium">{label}</span>
                          </div>
                          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${(comparison as any[]).length}, 1fr)` }}>
                            {(comparison as any[]).map((m: any, idx: number) => (
                              <div key={m.matchId}>
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-muted-foreground truncate">{m.opponent}</span>
                                  <span className="text-foreground font-bold text-sm">{Number(m[key]) || 0}</span>
                                </div>
                                <StatBar value={Number(m[key]) || 0} max={maxVal} color={STAT_COLORS[idx]} />
                              </div>
                            ))}
                          </div>
                          <Separator className="bg-muted mt-3" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Events Timeline */}
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${(comparison as any[]).length}, 1fr)` }}>
                  {(comparison as any[]).map((m: any, idx: number) => (
                    <Card key={m.matchId} className="bg-muted border-border">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-foreground flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STAT_COLORS[idx] }} />
                          {isAr ? "أحداث" : "Events"}: vs {m.opponent}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {m.events && m.events.length > 0 ? (
                          <div className="space-y-1 max-h-48 overflow-y-auto">
                            {m.events.map((ev: any, i: number) => (
                              <div key={i} className="flex items-center gap-2 text-xs">
                                <span className="text-muted-foreground w-8">{ev.minute}'</span>
                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                  ev.eventType === "goal" ? "bg-green-500/20 text-green-700 dark:text-green-400" :
                                  ev.eventType === "yellow_card" ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400" :
                                  ev.eventType === "red_card" ? "bg-red-500/20 text-red-600 dark:text-red-400" :
                                  "bg-gray-600/50 text-muted-foreground"
                                }`}>
                                  {ev.eventType.replace(/_/g, " ")}
                                </span>
                                {ev.playerName && <span className="text-muted-foreground truncate">{ev.playerName}</span>}
                                {!ev.isOurTeam && <span className="text-muted-foreground text-xs">(opp)</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-xs">{isAr ? "لا توجد أحداث مسجلة" : "No events recorded"}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : null}
          </>
        )}

        {selectedIds.length < 2 && (finishedMatches as any[]).length > 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <GitCompare className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>{isAr ? "اختر مباراتين على الأقل للمقارنة" : "Select at least 2 matches above to compare"}</p>
          </div>
        )}
      </div>
    </>
  );
}
