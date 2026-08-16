import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Target, GitCompare } from "lucide-react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function ComparePanel({ opponents, coaches }: { opponents: any[]; coaches: any[] }) {
  const [compareType, setCompareType] = useState<"opponents" | "coaches">("opponents");
  const [leftId, setLeftId] = useState<string>("none");
  const [rightId, setRightId] = useState<string>("none");

  const items = compareType === "opponents" ? opponents : coaches;
  const getLabel = (item: any) => compareType === "opponents" ? item.team_name : item.name;

  const leftItem = items.find((i: any) => String(i.id) === leftId);
  const rightItem = items.find((i: any) => String(i.id) === rightId);

  const leftOpp = compareType === "opponents" ? leftItem : null;
  const rightOpp = compareType === "opponents" ? rightItem : null;
  const leftCoach = compareType === "coaches" ? leftItem : null;
  const rightCoach = compareType === "coaches" ? rightItem : null;

  const oppChartData = leftOpp && rightOpp ? {
    labels: ["Avg Goals Scored", "Avg Goals Conceded", "Win Rate %"],
    datasets: [
      {
        label: leftOpp.team_name,
        data: [
          parseFloat(leftOpp.avg_goals_scored) || 0,
          parseFloat(leftOpp.avg_goals_conceded) || 0,
          leftOpp.matches_played ? Math.round((leftOpp.wins / leftOpp.matches_played) * 100) : 0
        ],
        backgroundColor: "rgba(59,130,246,0.7)", borderColor: "#2563eb", borderWidth: 2
      },
      {
        label: rightOpp.team_name,
        data: [
          parseFloat(rightOpp.avg_goals_scored) || 0,
          parseFloat(rightOpp.avg_goals_conceded) || 0,
          rightOpp.matches_played ? Math.round((rightOpp.wins / rightOpp.matches_played) * 100) : 0
        ],
        backgroundColor: "rgba(239,68,68,0.7)", borderColor: "#dc2626", borderWidth: 2
      }
    ]
  } : null;

  const coachChartData = leftCoach && rightCoach ? {
    labels: ["Win Rate %", "Years Experience"],
    datasets: [
      { label: leftCoach.name, data: [leftCoach.win_rate || 0, leftCoach.years_experience || 0], backgroundColor: "rgba(59,130,246,0.7)", borderColor: "#2563eb", borderWidth: 2 },
      { label: rightCoach.name, data: [rightCoach.win_rate || 0, rightCoach.years_experience || 0], backgroundColor: "rgba(239,68,68,0.7)", borderColor: "#dc2626", borderWidth: 2 }
    ]
  } : null;

  const chartData = oppChartData || coachChartData;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg border overflow-hidden">
          <button
            onClick={() => { setCompareType("opponents"); setLeftId("none"); setRightId("none"); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${compareType === "opponents" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >Teams</button>
          <button
            onClick={() => { setCompareType("coaches"); setLeftId("none"); setRightId("none"); }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${compareType === "coaches" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
          >Coaches</button>
        </div>
        <Select value={leftId} onValueChange={setLeftId}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Select Left..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— None —</SelectItem>
            {items.map((i: any) => <SelectItem key={i.id} value={String(i.id)}>{getLabel(i)}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground font-bold">vs</span>
        <Select value={rightId} onValueChange={setRightId}>
          <SelectTrigger className="w-44 h-9"><SelectValue placeholder="Select Right..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">— None —</SelectItem>
            {items.map((i: any) => <SelectItem key={i.id} value={String(i.id)}>{getLabel(i)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {leftItem && rightItem ? (
        <div className="space-y-5">
          {chartData && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Statistical Comparison</CardTitle></CardHeader>
              <CardContent>
                <div style={{ height: "220px" }}>
                  <Bar
                    data={chartData}
                    options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "top" } }, scales: { y: { beginAtZero: true } } }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {[leftItem, rightItem].map((item: any, idx: number) => (
              <Card key={idx} className={`border-2 ${idx === 0 ? "border-blue-200 dark:border-blue-800" : "border-red-200 dark:border-red-800"}`}>
                <CardHeader className="pb-2">
                  <CardTitle className={`text-sm ${idx === 0 ? "text-blue-600" : "text-red-600"}`}>
                    {compareType === "opponents" ? item.team_name : item.name}
                  </CardTitle>
                  {compareType === "opponents" && <CardDescription className="text-xs">{item.country} · {item.league} · {item.typical_formation}</CardDescription>}
                  {compareType === "coaches" && <CardDescription className="text-xs">{item.nationality} · {item.team_name} · {item.preferred_formation}</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {compareType === "opponents" && (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">Playing Style</span><span className="font-medium text-right max-w-[60%] truncate">{item.playing_style || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Pressing</span><span className="font-medium">{item.pressing_intensity || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Def. Line</span><span className="font-medium">{item.defensive_line || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Buildup</span><span className="font-medium">{item.buildup_style || "—"}</span></div>
                      <Separator className="my-2" />
                      <p className="text-xs font-semibold text-muted-foreground">Strengths</p>
                      <p className="text-xs bg-green-50 dark:bg-green-900/20 rounded p-2">{item.strengths || "—"}</p>
                      <p className="text-xs font-semibold text-muted-foreground">Weaknesses</p>
                      <p className="text-xs bg-red-50 dark:bg-red-900/20 rounded p-2">{item.weaknesses || "—"}</p>
                      <p className="text-xs font-semibold text-muted-foreground">Set Pieces</p>
                      <p className="text-xs bg-yellow-50 dark:bg-yellow-900/20 rounded p-2">{item.set_piece_strengths || "—"}</p>
                    </>
                  )}
                  {compareType === "coaches" && (
                    <>
                      <div className="flex justify-between"><span className="text-muted-foreground">Win Rate</span><span className="font-bold text-green-600">{item.win_rate ? `${item.win_rate}%` : "—"}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Experience</span><span className="font-medium">{item.years_experience ? `${item.years_experience} yrs` : "—"}</span></div>
                      <Separator className="my-2" />
                      <p className="text-xs text-muted-foreground">Tactical Philosophy</p>
                      <p className="text-xs bg-blue-50 dark:bg-blue-900/20 rounded p-2">{item.tactical_philosophy || "—"}</p>
                      <p className="text-xs text-muted-foreground">Pressing Style</p>
                      <p className="text-xs">{item.pressing_style || "—"}</p>
                      <p className="text-xs text-muted-foreground">Known Weaknesses</p>
                      <p className="text-xs bg-red-50 dark:bg-red-900/20 rounded p-2">{item.known_weaknesses || "—"}</p>
                      <p className="text-xs text-muted-foreground">Big Match Record</p>
                      <p className="text-xs">{item.big_match_record || "—"}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {compareType === "opponents" && leftOpp && rightOpp && (
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><Target className="h-4 w-4" />Tactical Superiority Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-3 text-sm">
                  <div className={`rounded-lg p-3 text-center ${parseFloat(leftOpp.avg_goals_scored) > parseFloat(rightOpp.avg_goals_scored) ? "bg-blue-100 dark:bg-blue-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                    <p className="text-xs text-muted-foreground mb-1">Attack Threat</p>
                    <p className="font-bold">{parseFloat(leftOpp.avg_goals_scored) > parseFloat(rightOpp.avg_goals_scored) ? leftOpp.team_name : rightOpp.team_name}</p>
                    <p className="text-xs">{Math.max(parseFloat(leftOpp.avg_goals_scored), parseFloat(rightOpp.avg_goals_scored))} goals/game</p>
                  </div>
                  <div className={`rounded-lg p-3 text-center ${parseFloat(leftOpp.avg_goals_conceded) < parseFloat(rightOpp.avg_goals_conceded) ? "bg-blue-100 dark:bg-blue-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                    <p className="text-xs text-muted-foreground mb-1">Defensive Solidity</p>
                    <p className="font-bold">{parseFloat(leftOpp.avg_goals_conceded) < parseFloat(rightOpp.avg_goals_conceded) ? leftOpp.team_name : rightOpp.team_name}</p>
                    <p className="text-xs">{Math.min(parseFloat(leftOpp.avg_goals_conceded), parseFloat(rightOpp.avg_goals_conceded))} conceded/game</p>
                  </div>
                  <div className={`rounded-lg p-3 text-center ${(leftOpp.wins || 0) / (leftOpp.matches_played || 1) > (rightOpp.wins || 0) / (rightOpp.matches_played || 1) ? "bg-blue-100 dark:bg-blue-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
                    <p className="text-xs text-muted-foreground mb-1">Win Consistency</p>
                    <p className="font-bold">{(leftOpp.wins || 0) / (leftOpp.matches_played || 1) > (rightOpp.wins || 0) / (rightOpp.matches_played || 1) ? leftOpp.team_name : rightOpp.team_name}</p>
                    <p className="text-xs">{Math.max(Math.round(((leftOpp.wins || 0) / (leftOpp.matches_played || 1)) * 100), Math.round(((rightOpp.wins || 0) / (rightOpp.matches_played || 1)) * 100))}% win rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="text-center py-16">
          <CardContent>
            <GitCompare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">Select Two {compareType === "opponents" ? "Teams" : "Coaches"} to Compare</h3>
            <p className="text-muted-foreground text-sm">Add {compareType === "opponents" ? "opponent profiles" : "coach profiles"} first, then select two to compare side by side.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
