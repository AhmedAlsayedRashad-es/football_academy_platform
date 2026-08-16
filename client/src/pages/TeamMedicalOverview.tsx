import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackButton } from '@/components/BackButton';
import {
  ArrowLeft, Heart, AlertTriangle, CheckCircle, Activity,
  Users, Stethoscope, Bell, Trophy, Shield, Loader2
} from "lucide-react";

function getStatusColor(status: string) {
  switch (status) {
    case "active": return "bg-green-500/10 text-green-600 border-green-500/20";
    case "injured": return "bg-red-500/10 text-red-600 border-red-500/20";
    case "trial": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
    default: return "bg-gray-500/10 text-gray-600 border-gray-500/20";
  }
}

function TeamMedicalSection({
  sectionTitle, sectionIcon, teams, allInjuries, navigate, isRTL,
}: {
  sectionTitle: string; sectionIcon: React.ReactNode; teams: any[];
  allInjuries: any[]; navigate: (path: string) => void; isRTL: boolean;
}) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const { data: teamPlayers, isLoading: teamPlayersLoading } = trpc.teams.getPlayers.useQuery(
    { teamId: selectedTeamId! }, { enabled: !!selectedTeamId }
  );
  const { data: allSectionPlayers, isLoading: allPlayersLoading } = trpc.players.getAll.useQuery(
    undefined, { enabled: !selectedTeamId }
  );
  const isLoading = selectedTeamId ? teamPlayersLoading : allPlayersLoading;
  const sectionTeamIds = new Set(teams.map((t: any) => t.id));
  const rawPlayers = selectedTeamId ? teamPlayers : allSectionPlayers;
  const players = selectedTeamId
    ? rawPlayers
    : (rawPlayers as any[] | undefined)?.filter((p: any) => p.teamId && sectionTeamIds.has(p.teamId));
  const injuredPlayers = players?.filter((p: any) => p.status === "injured") || [];
  const activePlayers = players?.filter((p: any) => p.status === "active") || [];
  const injuryRate = players?.length ? Math.round((injuredPlayers.length / players.length) * 100) : 0;
  const availabilityRate = 100 - injuryRate;
  const playerIds = new Set(players?.map((p: any) => p.id) || []);
  const sectionInjuries = (allInjuries || []).filter(
    (inj: any) => playerIds.has(inj.playerId) && inj.status === "active"
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        {sectionIcon}
        <h2 className="text-xl font-bold">{sectionTitle}</h2>
        <Badge variant="outline" className="ml-auto">{teams.length} {isRTL ? "\u0641\u0631\u064a\u0642" : "teams"}</Badge>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Users className="h-4 w-4 text-blue-500" />, bg: "bg-blue-500/10", value: players?.length ?? 0, label: isRTL ? "\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0644\u0627\u0639\u0628\u064a\u0646" : "Total Players" },
          { icon: <CheckCircle className="h-4 w-4 text-green-700 dark:text-green-500" />, bg: "bg-green-500/10", value: activePlayers.length, label: isRTL ? "\u062c\u0627\u0647\u0632 \u0644\u0644\u062a\u062f\u0631\u064a\u0628" : "Fit to Train" },
          { icon: <AlertTriangle className="h-4 w-4 text-red-500" />, bg: "bg-red-500/10", value: injuredPlayers.length, label: isRTL ? "\u0645\u0635\u0627\u0628\u0648\u0646" : "Injured" },
          { icon: <Activity className="h-4 w-4 text-orange-700 dark:text-orange-500" />, bg: "bg-orange-500/10", value: availabilityRate + "%", label: isRTL ? "\u0646\u0633\u0628\u0629 \u0627\u0644\u062c\u0627\u0647\u0632\u064a\u0629" : "Availability" },
        ].map((s, i) => (
          <Card key={i}><CardContent className="p-3 flex items-center gap-3">
            <div className={"w-9 h-9 rounded-lg " + s.bg + " flex items-center justify-center shrink-0"}>{s.icon}</div>
            <div><div className="text-xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
          </CardContent></Card>
        ))}
      </div>
      <Card><CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{isRTL ? "\u0627\u0644\u0641\u0631\u064a\u0642:" : "Team:"}</span>
          <button onClick={() => setSelectedTeamId(null)}
            className={"px-3 py-1 rounded-full text-xs font-medium transition-colors " + (!selectedTeamId ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80")}>
            {isRTL ? "\u0627\u0644\u0643\u0644" : "All"}
          </button>
          {teams.map((team: any) => (
            <button key={team.id} onClick={() => setSelectedTeamId(team.id)}
              className={"px-3 py-1 rounded-full text-xs font-medium transition-colors " + (selectedTeamId === team.id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80")}>
              {team.name}
            </button>
          ))}
        </div>
      </CardContent></Card>
      {sectionInjuries.length > 0 && (
        <Alert className="border-red-500/30 bg-red-500/5">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700 text-sm">
            <strong>{sectionInjuries.length} {isRTL ? "\u0625\u0635\u0627\u0628\u0629 \u0646\u0634\u0637\u0629" : "active injuries"}</strong>
            {isRTL ? " \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645" : " in this section"}
          </AlertDescription>
        </Alert>
      )}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Stethoscope className="h-4 w-4" />
            {isRTL ? "\u0627\u0644\u062d\u0627\u0644\u0629 \u0627\u0644\u0637\u0628\u064a\u0629 \u0644\u0644\u0627\u0639\u0628\u064a\u0646" : "Player Medical Status"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : !players || players.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>{isRTL ? "\u0644\u0627 \u064a\u0648\u062c\u062f \u0644\u0627\u0639\u0628\u0648\u0646 \u0641\u064a \u0647\u0630\u0627 \u0627\u0644\u0642\u0633\u0645" : "No players found in this section"}</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {players.map((player: any) => {
                const playerInjuries = (allInjuries || []).filter((inj: any) => inj.playerId === player.id && inj.status === "active");
                const currentInjury = playerInjuries[0];
                return (
                  <div key={player.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => navigate("/player/" + player.id + "/medical")}>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {player.firstName?.[0]}{player.lastName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{player.firstName} {player.lastName}</span>
                        <Badge variant="outline" className={"text-xs shrink-0 " + getStatusColor(player.status)}>{player.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{(player.position || "").replace(/_/g, " ") || "\u2014"} \u00b7 #{player.jerseyNumber || "\u2014"}</div>
                      {currentInjury ? (
                        <div className="mt-1.5 text-xs flex items-center gap-1 text-red-600">
                          <AlertTriangle className="w-3 h-3" />{currentInjury.injuryType} \u2014 {currentInjury.bodyPart}
                        </div>
                      ) : player.status === "active" && (
                        <div className="mt-1.5 text-xs flex items-center gap-1 text-green-600">
                          <CheckCircle className="w-3 h-3" />{isRTL ? "\u062c\u0627\u0647\u0632 \u0644\u0644\u062a\u062f\u0631\u064a\u0628" : "Fit for training"}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2 text-blue-700">
            <Activity className="w-4 h-4" />
            {isRTL ? "\u062a\u0648\u0635\u064a\u0629 \u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a \u0644\u062d\u0645\u0644 \u0627\u0644\u062a\u062f\u0631\u064a\u0628" : "AI Training Load Recommendation"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {isRTL
              ? ("\u0628\u0646\u0627\u0621\u064b \u0639\u0644\u0649 \u0627\u0644\u062d\u0627\u0644\u0629 \u0627\u0644\u0637\u0628\u064a\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629 (" + availabilityRate + "% \u062c\u0627\u0647\u0632\u064a\u0629\u060c " + sectionInjuries.length + " \u0625\u0635\u0627\u0628\u0629 \u0646\u0634\u0637\u0629):")
              : ("Based on current squad medical status (" + availabilityRate + "% availability, " + sectionInjuries.length + " active injuries):")}
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {[
              { label: isRTL ? "\u0627\u0644\u0634\u062f\u0629 \u0627\u0644\u0645\u0648\u0635\u0649 \u0628\u0647\u0627" : "Recommended Intensity", value: availabilityRate >= 80 ? "High (8-9 RPE)" : availabilityRate >= 60 ? "Moderate (6-7 RPE)" : "Low (4-5 RPE)" },
              { label: isRTL ? "\u0645\u062f\u0629 \u0627\u0644\u062c\u0644\u0633\u0629" : "Session Duration", value: availabilityRate >= 80 ? "90-120 min" : availabilityRate >= 60 ? "60-90 min" : "45-60 min" },
              { label: isRTL ? "\u0645\u062d\u0648\u0631 \u0627\u0644\u062a\u0631\u0643\u064a\u0632" : "Focus Area", value: availabilityRate >= 80 ? "Tactical + Physical" : availabilityRate >= 60 ? "Technical + Tactical" : "Recovery + Technical" },
            ].map((item, i) => (
              <div key={i} className="p-3 rounded-lg bg-background border">
                <div className="text-xs font-medium text-muted-foreground mb-1">{item.label}</div>
                <div className={"text-base font-bold " + (availabilityRate >= 80 ? "text-green-600" : availabilityRate >= 60 ? "text-yellow-600" : "text-red-600")}>{item.value}</div>
              </div>
            ))}
          </div>
          {injuredPlayers.length > 0 && (
            <Alert className="border-yellow-500/30 bg-yellow-500/5">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-700 text-sm">
                <strong>{injuredPlayers.length} {isRTL ? "\u0644\u0627\u0639\u0628 \u0645\u0633\u062a\u0628\u0639\u062f \u0645\u0646 \u0627\u0644\u062a\u062f\u0631\u064a\u0628 \u0627\u0644\u0643\u0627\u0645\u0644:" : "player(s) excluded from full training:"}</strong>{" "}
                {injuredPlayers.map((p: any) => p.firstName + " " + p.lastName).join(", ")}.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function TeamMedicalOverview() {
  const [, navigate] = useLocation();
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [activeTab, setActiveTab] = useState("main");
  const { data: allTeams } = trpc.teams.getAll.useQuery();
  const { data: allInjuries } = trpc.injuries.getActive.useQuery();
  const mainTeams = (allTeams as any[] | undefined)?.filter((t: any) => t.teamType === "main") ?? [];
  const academyTeams = (allTeams as any[] | undefined)?.filter((t: any) => t.teamType === "academy") ?? [];

  return (
    <>
      <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
        <div>
              <BackButton />
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500" />
                {isRTL ? "\u0627\u0644\u0646\u0638\u0631\u0629 \u0627\u0644\u0637\u0628\u064a\u0629 \u0644\u0644\u0641\u0631\u0642" : "Team Medical Overview"}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {isRTL ? "\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u062d\u0627\u0644\u0629 \u0627\u0644\u0637\u0628\u064a\u0629 \u0644\u0644\u0627\u0639\u0628\u064a\u0646 \u0648\u0627\u0644\u0625\u0635\u0627\u0628\u0627\u062a \u0648\u062c\u0627\u0647\u0632\u064a\u0629 \u0627\u0644\u062a\u062f\u0631\u064a\u0628" : "Monitor player medical status, injuries, and training load readiness"}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-2 shrink-0">
              <Bell className="w-4 h-4" />
              {isRTL
                ? ("\u062a\u0646\u0628\u064a\u0647\u0627\u062a \u0637\u0628\u064a\u0629 (" + ((allInjuries as any[] | undefined)?.length ?? 0) + ")")
                : ("Medical Alerts (" + ((allInjuries as any[] | undefined)?.length ?? 0) + ")")}
            </Button>
          </div>
        </div>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-sm">
            <TabsTrigger value="main" className="gap-2">
              <Trophy className="h-4 w-4 text-yellow-700 dark:text-yellow-500" />
              {isRTL ? "\u0627\u0644\u0641\u0631\u0642 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629" : "Main Teams"}
              <Badge variant="secondary" className="ml-1 text-xs">{mainTeams.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="academy" className="gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              {isRTL ? "\u0641\u0631\u0642 \u0627\u0644\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629" : "Academy Teams"}
              <Badge variant="secondary" className="ml-1 text-xs">{academyTeams.length}</Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="main" className="mt-5">
            {mainTeams.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>{isRTL ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0631\u0642 \u0631\u0626\u064a\u0633\u064a\u0629 \u0628\u0639\u062f" : "No main teams found"}</p>
              </CardContent></Card>
            ) : (
              <TeamMedicalSection sectionTitle={isRTL ? "\u0627\u0644\u0641\u0631\u0642 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629" : "Main Teams"}
                sectionIcon={<Trophy className="h-6 w-6 text-yellow-700 dark:text-yellow-500" />}
                teams={mainTeams} allInjuries={allInjuries as any[] ?? []} navigate={navigate} isRTL={isRTL} />
            )}
          </TabsContent>
          <TabsContent value="academy" className="mt-5">
            {academyTeams.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">
                <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>{isRTL ? "\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0631\u0642 \u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629 \u0628\u0639\u062f" : "No academy teams found"}</p>
              </CardContent></Card>
            ) : (
              <TeamMedicalSection sectionTitle={isRTL ? "\u0641\u0631\u0642 \u0627\u0644\u0623\u0643\u0627\u062f\u064a\u0645\u064a\u0629" : "Academy Teams"}
                sectionIcon={<Shield className="h-6 w-6 text-blue-500" />}
                teams={academyTeams} allInjuries={allInjuries as any[] ?? []} navigate={navigate} isRTL={isRTL} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
