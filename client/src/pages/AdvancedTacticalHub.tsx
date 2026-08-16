import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { useToast } from "../hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft, Brain, Target, Map, TrendingUp, Shield, Zap,
  BarChart2, Activity, Eye, ChevronRight, Play, RefreshCw,
  AlertTriangle, CheckCircle, Star, Layers, GitBranch, Crosshair
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface ShotEvent {
  x: number; y: number; xg: number; type: "goal" | "saved" | "missed" | "blocked";
  player: string; minute: number;
}

interface CounterPlan {
  weakness: string; strategy: string; keyPlayers: string[];
  formation: string; priority: "high" | "medium" | "low";
}

// ─── Sample Data ─────────────────────────────────────────────────────────────
const SAMPLE_SHOTS: ShotEvent[] = [
  { x: 72, y: 50, xg: 0.42, type: "goal", player: "Omar Kamal", minute: 23 },
  { x: 78, y: 38, xg: 0.28, type: "saved", player: "Ahmed Hassan", minute: 37 },
  { x: 65, y: 55, xg: 0.15, type: "missed", player: "Youssef Ali", minute: 51 },
  { x: 82, y: 48, xg: 0.61, type: "goal", player: "Omar Kamal", minute: 67 },
  { x: 70, y: 42, xg: 0.19, type: "blocked", player: "Mahmoud Saad", minute: 72 },
  { x: 75, y: 52, xg: 0.33, type: "saved", player: "Ahmed Hassan", minute: 81 },
  { x: 88, y: 45, xg: 0.72, type: "goal", player: "Karim Nasser", minute: 88 },
  { x: 60, y: 35, xg: 0.08, type: "missed", player: "Tarek Ibrahim", minute: 14 },
];

const OPPOSITION_WEAKNESSES = [
  { area: "High Press Vulnerability", score: 78, detail: "Struggles when pressed above their own half" },
  { area: "Set Piece Defense", score: 65, detail: "Concedes 40% of goals from set pieces" },
  { area: "Left Flank Exposure", score: 71, detail: "Right back tends to push high, leaving space" },
  { area: "Transition Speed", score: 58, detail: "Slow to recover when losing possession" },
  { area: "Aerial Duels", score: 62, detail: "Weak in aerial challenges in the box" },
];

const COUNTER_PLANS: CounterPlan[] = [
  {
    weakness: "High Press Vulnerability",
    strategy: "Play long balls over the press to exploit space behind their defensive line. Use quick vertical passes to bypass the press and target the channels with pace.",
    keyPlayers: ["Omar Kamal (pace)", "Ahmed Hassan (long ball)"],
    formation: "4-3-3 with high wingers",
    priority: "high"
  },
  {
    weakness: "Left Flank Exposure",
    strategy: "Overload the right side of attack. Use overlapping runs from right back + right winger combinations. Deliver early crosses before their left back recovers.",
    keyPlayers: ["Youssef Ali (right wing)", "Mahmoud Saad (right back)"],
    formation: "4-2-3-1 right overload",
    priority: "high"
  },
  {
    weakness: "Set Piece Defense",
    strategy: "Design 3-4 specific corner routines targeting the near post and far post. Use decoy runners to create confusion. Assign your tallest players to key zones.",
    keyPlayers: ["Karim Nasser (aerial)", "Tarek Ibrahim (delivery)"],
    formation: "Set piece specialist lineup",
    priority: "medium"
  },
];

const PASS_NETWORK_NODES = [
  { id: 1, name: "GK", x: 50, y: 5, connections: [4, 5, 6], passes: 18 },
  { id: 2, name: "RB", x: 85, y: 22, connections: [4, 7, 9], passes: 34 },
  { id: 3, name: "CB", x: 65, y: 18, connections: [1, 4, 5, 6], passes: 42 },
  { id: 4, name: "CB", x: 35, y: 18, connections: [1, 3, 5, 6], passes: 38 },
  { id: 5, name: "LB", x: 15, y: 22, connections: [4, 6, 8], passes: 31 },
  { id: 6, name: "CDM", x: 50, y: 35, connections: [3, 4, 7, 8, 9], passes: 67 },
  { id: 7, name: "RM", x: 80, y: 50, connections: [2, 6, 9, 11], passes: 45 },
  { id: 8, name: "LM", x: 20, y: 50, connections: [5, 6, 10, 11], passes: 41 },
  { id: 9, name: "CAM", x: 65, y: 62, connections: [6, 7, 10, 11], passes: 53 },
  { id: 10, name: "ST", x: 35, y: 68, connections: [8, 9, 11], passes: 29 },
  { id: 11, name: "CF", x: 50, y: 75, connections: [9, 10], passes: 22 },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function ShotMapTab() {
  const { t, language } = useLanguage();
  const [hoveredShot, setHoveredShot] = useState<ShotEvent | null>(null);
  const totalXG = SAMPLE_SHOTS.reduce((s, sh) => s + sh.xg, 0).toFixed(2);
  const goals = SAMPLE_SHOTS.filter(s => s.type === "goal").length;

  const shotColor = (type: ShotEvent["type"]) => {
    switch (type) {
      case "goal": return "#22c55e";
      case "saved": return "#3b82f6";
      case "missed": return "#f59e0b";
      case "blocked": return "#ef4444";
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Pitch */}
      <div className="col-span-2">
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
            <Crosshair size={16} className="text-red-500" /> Shot Map — xG Analysis
          </h3>
          <div className="relative" style={{ paddingBottom: "60%", background: "#1a2e1a", borderRadius: 8, border: "2px solid #2d5a2d" }}>
            {/* Pitch markings */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none">
              {/* Outer boundary */}
              <rect x="2" y="2" width="96" height="56" fill="none" stroke="#2d5a2d" strokeWidth="0.5"/>
              {/* Center circle */}
              <circle cx="50" cy="30" r="9" fill="none" stroke="#2d5a2d" strokeWidth="0.4"/>
              <line x1="50" y1="2" x2="50" y2="58" stroke="#2d5a2d" strokeWidth="0.4"/>
              {/* Penalty areas */}
              <rect x="2" y="15" width="16" height="30" fill="none" stroke="#2d5a2d" strokeWidth="0.4"/>
              <rect x="82" y="15" width="16" height="30" fill="none" stroke="#2d5a2d" strokeWidth="0.4"/>
              {/* Goal areas */}
              <rect x="2" y="22" width="6" height="16" fill="none" stroke="#2d5a2d" strokeWidth="0.4"/>
              <rect x="92" y="22" width="6" height="16" fill="none" stroke="#2d5a2d" strokeWidth="0.4"/>
              {/* Goals */}
              <rect x="0" y="26" width="2" height="8" fill="#888"/>
              <rect x="98" y="26" width="2" height="8" fill="#888"/>
            </svg>
            {/* Shots */}
            {SAMPLE_SHOTS.map((shot, i) => (
              <div
                key={i}
                className="absolute cursor-pointer transition-transform hover:scale-150"
                style={{
                  left: `${shot.x}%`, top: `${shot.y}%`,
                  transform: "translate(-50%, -50%)",
                  width: `${Math.max(12, shot.xg * 40)}px`,
                  height: `${Math.max(12, shot.xg * 40)}px`,
                  borderRadius: shot.type === "goal" ? "50%" : "4px",
                  background: shotColor(shot.type),
                  opacity: 0.85,
                  border: shot.type === "goal" ? "2px solid white" : "none",
                  zIndex: 10
                }}
                onMouseEnter={() => setHoveredShot(shot)}
                onMouseLeave={() => setHoveredShot(null)}
              />
            ))}
            {/* Tooltip */}
            {hoveredShot && (
              <div className="absolute top-2 left-2 bg-card border border-border rounded-lg p-3 text-xs z-20 min-w-40">
                <div className="font-bold text-foreground">{hoveredShot.player}</div>
                <div className="text-muted-foreground">Min {hoveredShot.minute}' · xG: <span className="text-yellow-700 dark:text-yellow-400">{hoveredShot.xg}</span></div>
                <div style={{ color: shotColor(hoveredShot.type) }} className="capitalize font-semibold">{hoveredShot.type}</div>
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="flex gap-4 mt-3 flex-wrap">
            {[["goal","#22c55e","Goal"],["saved","#3b82f6","Saved"],["missed","#f59e0b","Missed"],["blocked","#ef4444","Blocked"]].map(([type, color, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div style={{ width:10, height:10, background: color, borderRadius: type==="goal"?"50%":"2px" }}/>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
            <span className="text-xs text-muted-foreground ml-auto">Circle size = xG value</span>
          </div>
        </div>
      </div>

      {/* Stats panel */}
      <div className="flex flex-col gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-muted-foreground text-xs mb-1">Total xG</div>
          <div className="text-4xl font-bold text-yellow-700 dark:text-yellow-400">{totalXG}</div>
          <div className="text-muted-foreground text-xs mt-1">Expected Goals</div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-muted-foreground text-xs mb-1">Actual Goals</div>
          <div className="text-4xl font-bold text-green-700 dark:text-green-400">{goals}</div>
          <div className="text-muted-foreground text-xs mt-1">
            {goals > parseFloat(totalXG) ? "↑ Overperforming xG" : "↓ Underperforming xG"}
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-muted-foreground text-xs mb-3">Shot Breakdown</div>
          {[["Goals","goal","#22c55e"],["Saved","saved","#3b82f6"],["Missed","missed","#f59e0b"],["Blocked","blocked","#ef4444"]].map(([label, type, color]) => {
            const count = SAMPLE_SHOTS.filter(s => s.type === type).length;
            return (
              <div key={type} className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{label}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div style={{ width: `${(count/SAMPLE_SHOTS.length)*100}%`, background: color }} className="h-full rounded-full"/>
                  </div>
                  <span className="text-xs font-bold" style={{ color }}>{count}</span>
                </div>
              </div>
            );
          })}
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-muted-foreground text-xs mb-2">Top Shooter</div>
          <div className="text-foreground font-semibold">Omar Kamal</div>
          <div className="text-yellow-700 dark:text-yellow-400 text-sm">xG: 1.03 · 2 Goals</div>
          <div className="text-muted-foreground text-xs mt-1">Conversion Rate: 100%</div>
        </div>
      </div>
    </div>
  );
}

function PassNetworkTab() {
  const [selectedNode, setSelectedNode] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <div className="bg-card rounded-xl p-4 border border-border">
          <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
            <GitBranch size={16} className="text-blue-600 dark:text-blue-400" /> Pass Network — Inspired by StatsBomb
          </h3>
          <div className="relative" style={{ paddingBottom: "65%", background: "#1a2e1a", borderRadius: 8, border: "2px solid #2d5a2d" }}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 65" preserveAspectRatio="none">
              {/* Pitch lines */}
              <rect x="2" y="2" width="96" height="61" fill="none" stroke="#2d5a2d" strokeWidth="0.5"/>
              <line x1="50" y1="2" x2="50" y2="63" stroke="#2d5a2d" strokeWidth="0.4"/>
              <circle cx="50" cy="32.5" r="9" fill="none" stroke="#2d5a2d" strokeWidth="0.4"/>
              <rect x="2" y="17" width="16" height="31" fill="none" stroke="#2d5a2d" strokeWidth="0.4"/>
              <rect x="82" y="17" width="16" height="31" fill="none" stroke="#2d5a2d" strokeWidth="0.4"/>

              {/* Pass connections */}
              {PASS_NETWORK_NODES.map(node =>
                node.connections.map(targetId => {
                  const target = PASS_NETWORK_NODES.find(n => n.id === targetId);
                  if (!target) return null;
                  const isSelected = selectedNode === node.id || selectedNode === targetId;
                  return (
                    <line
                      key={`${node.id}-${targetId}`}
                      x1={node.x} y1={node.y * 65 / 100}
                      x2={target.x} y2={target.y * 65 / 100}
                      stroke={isSelected ? "#60a5fa" : "#3b82f6"}
                      strokeWidth={isSelected ? 1.5 : 0.6}
                      opacity={isSelected ? 0.9 : 0.35}
                    />
                  );
                })
              )}

              {/* Player nodes */}
              {PASS_NETWORK_NODES.map(node => {
                const r = Math.max(2.5, node.passes / 20);
                const isSelected = selectedNode === node.id;
                return (
                  <g key={node.id} onClick={() => setSelectedNode(isSelected ? null : node.id)} style={{ cursor: "pointer" }}>
                    <circle
                      cx={node.x} cy={node.y * 65 / 100}
                      r={r + (isSelected ? 1 : 0)}
                      fill={isSelected ? "#ef4444" : "#cc0000"}
                      stroke="white" strokeWidth="0.5"
                    />
                    <text
                      x={node.x} y={node.y * 65 / 100 - r - 1}
                      textAnchor="middle" fontSize="2.5" fill="white" fontWeight="bold"
                    >
                      {node.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Click on a player node to highlight their connections. Node size = pass volume.</p>
        </div>
      </div>

      {/* Pass stats */}
      <div className="flex flex-col gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-muted-foreground text-xs mb-3">Top Passers</div>
          {[...PASS_NETWORK_NODES].sort((a,b) => b.passes - a.passes).slice(0,5).map((node, i) => (
            <div key={node.id} className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-4">{i+1}.</span>
                <span className="text-sm text-foreground">{node.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div style={{ width: `${(node.passes/67)*100}%` }} className="h-full bg-blue-500 rounded-full"/>
                </div>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">{node.passes}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-muted-foreground text-xs mb-2">Network Insights</div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0"/>
              <span>CDM is the primary hub — 67 passes, highest connectivity</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1 shrink-0"/>
              <span>CAM bridges midfield to attack with 53 passes</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 shrink-0"/>
              <span>Right side overload: RB+RM combination most active</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1 shrink-0"/>
              <span>CF isolated — needs better support from midfield</span>
            </div>
          </div>
        </div>
        {selectedNode && (
          <div className="bg-card rounded-xl p-4 border border-red-800">
            <div className="text-red-600 dark:text-red-400 text-xs mb-2">Selected: {PASS_NETWORK_NODES.find(n=>n.id===selectedNode)?.name}</div>
            <div className="text-foreground font-bold text-2xl">{PASS_NETWORK_NODES.find(n=>n.id===selectedNode)?.passes}</div>
            <div className="text-muted-foreground text-xs">Total passes</div>
            <div className="text-muted-foreground text-xs mt-1">
              {PASS_NETWORK_NODES.find(n=>n.id===selectedNode)?.connections.length} direct connections
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CounterPlanTab() {
  const { language } = useLanguage();
  const [selectedWeakness, setSelectedWeakness] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [aiPlan, setAiPlan] = useState<any>(null);
  const { toast } = useToast();
  const generateCounterPlanMutation = trpc.ai.generateCounterPlan.useMutation();
  const handleGenerate = async (weakness: string) => {
    setGenerating(true);
    setSelectedWeakness(weakness);
    const w = OPPOSITION_WEAKNESSES.find(x => x.area === weakness);
    try {
      const result = await generateCounterPlanMutation.mutateAsync({
        weakness,
        weaknessDetail: w?.detail,
        ourFormation: '4-3-3',
        ourPlayStyle: 'High press, possession-based football',
      });
      setAiPlan(result);
      toast({ title: 'Counter-Plan Generated', description: `AI tactical plan for "${weakness}" is ready.` });
    } catch (err) {
      toast({ title: language === 'ar' ? 'خطأ' : 'Error', description: language === 'ar' ? 'فشل في إنشاء الخطة التكتيكية. يرجى المحاولة مرة أخرى.' : 'Failed to generate counter-plan. Please try again.', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Weakness analysis */}
      <div>
        <div className="bg-card rounded-xl p-4 border border-border mb-4">
          <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
            <Eye size={16} className="text-orange-700 dark:text-orange-400" /> Opposition Weakness Analysis
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Based on last 5 matches analysis. Click a weakness to generate a counter-plan.</p>
          {OPPOSITION_WEAKNESSES.map((w, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg mb-2 cursor-pointer border transition-all ${
                selectedWeakness === w.area
                  ? "border-red-600 bg-red-900/20"
                  : "border-border bg-muted/50 hover:border-border"
              }`}
              onClick={() => handleGenerate(w.area)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-semibold text-foreground">{w.area}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${w.score >= 70 ? "text-red-600 dark:text-red-400" : w.score >= 60 ? "text-yellow-700 dark:text-yellow-400" : "text-green-700 dark:text-green-400"}`}>
                    {w.score}%
                  </span>
                  <ChevronRight size={14} className="text-muted-foreground"/>
                </div>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-1">
                <div
                  style={{ width: `${w.score}%`, background: w.score >= 70 ? "#ef4444" : w.score >= 60 ? "#f59e0b" : "#22c55e" }}
                  className="h-full rounded-full"
                />
              </div>
              <p className="text-xs text-muted-foreground">{w.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Counter-plan output */}
      <div>
        <div className="bg-card rounded-xl p-4 border border-border mb-4">
          <h3 className="text-foreground font-semibold mb-3 flex items-center gap-2">
            <Shield size={16} className="text-green-700 dark:text-green-400" /> AI Counter-Plan Generator
            <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">Inspired by Wyscout</span>
          </h3>

          {!selectedWeakness && !generating && (
            <div className="text-center py-12 text-muted-foreground">
              <Shield size={40} className="mx-auto mb-3 opacity-30"/>
              <p className="text-sm">Select an opposition weakness from the left panel to generate a tactical counter-plan</p>
            </div>
          )}

          {generating && (
            <div className="text-center py-12">
              <RefreshCw size={32} className="mx-auto mb-3 text-red-500 animate-spin"/>
              <p className="text-sm text-muted-foreground">Analyzing opposition data...</p>
              <p className="text-xs text-gray-600 mt-1">Generating tactical counter-plan</p>
            </div>
          )}

          {!generating && selectedWeakness && aiPlan && (
            <div>
              <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold mb-3 ${
                aiPlan.riskLevel === 'high' ? 'bg-red-900/40 text-red-600 dark:text-red-400' :
                aiPlan.riskLevel === 'medium' ? 'bg-yellow-900/40 text-yellow-700 dark:text-yellow-400' :
                'bg-green-900/40 text-green-700 dark:text-green-400'
              }`}>
                <AlertTriangle size={12}/>
                {aiPlan.riskLevel?.toUpperCase()} RISK · {aiPlan.successRate}% SUCCESS RATE
              </div>

              <h4 className="text-red-600 dark:text-red-400 font-bold text-sm mb-2">Targeting: {selectedWeakness}</h4>

              <div className="bg-muted rounded-lg p-3 mb-3">
                <div className="text-xs text-muted-foreground mb-2">Tactical Strategy</div>
                <p className="text-sm text-foreground leading-relaxed">{aiPlan.strategy}</p>
              </div>

              {aiPlan.keyInstructions?.length > 0 && (
                <div className="bg-muted rounded-lg p-3 mb-3">
                  <div className="text-xs text-muted-foreground mb-2">Key Instructions</div>
                  {aiPlan.keyInstructions.map((inst: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 mb-1">
                      <CheckCircle size={12} className="text-green-700 dark:text-green-400 mt-0.5 flex-shrink-0"/>
                      <span className="text-sm text-foreground">{inst}</span>
                    </div>
                  ))}
                </div>
              )}

              {aiPlan.playerRoles?.length > 0 && (
                <div className="bg-muted rounded-lg p-3 mb-3">
                  <div className="text-xs text-muted-foreground mb-2">Player Roles</div>
                  {aiPlan.playerRoles.map((role: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <Star size={12} className="text-yellow-700 dark:text-yellow-400"/>
                      <span className="text-sm text-foreground">{role}</span>
                    </div>
                  ))}
                </div>
              )}

              {aiPlan.bestMoments?.length > 0 && (
                <div className="bg-muted rounded-lg p-3 mb-3">
                  <div className="text-xs text-muted-foreground mb-2">Best Moments to Execute</div>
                  {aiPlan.bestMoments.map((moment: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <Zap size={12} className="text-orange-700 dark:text-orange-400"/>
                      <span className="text-sm text-foreground">{moment}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => handleGenerate(selectedWeakness)}
                className="w-full bg-red-700 hover:bg-red-600 text-white text-sm font-semibold py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <RefreshCw size={14}/> Regenerate Plan
              </button>
            </div>
          )}
        </div>

        {/* Integration info */}
        <div className="bg-card rounded-xl p-4 border border-yellow-900/40">
          <div className="text-yellow-700 dark:text-yellow-400 text-xs font-bold mb-2 flex items-center gap-1.5">
            <Zap size={12}/> INTEGRATION AVAILABLE
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            This analysis can be enhanced with <strong className="text-foreground">Wyscout API</strong> (600+ leagues, 550K player profiles) or <strong className="text-foreground">StatsBomb Open Data</strong> for real match event data. Contact us to enable live data feeds.
          </p>
        </div>
      </div>
    </div>
  );
}

function HeatmapTab() {
  const { data: allPlayers = [] } = trpc.players.getAll.useQuery();
  const players: string[] = (allPlayers as any[]).length > 0
    ? (allPlayers as any[]).map((p: any) => `${p.firstName} ${p.lastName}`)
    : ["Omar Kamal", "Ahmed Hassan", "Youssef Ali", "Mahmoud Saad", "Karim Nasser"];
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const currentPlayer = selectedPlayer || players[0] || "Omar Kamal";

  // Generate heatmap grid data
  const generateHeatData = (playerName: string) => {
    const seed = playerName.length;
    return Array.from({ length: 10 }, (_, row) =>
      Array.from({ length: 15 }, (_, col) => {
        // Position-based heat generation
        const isForward = seed % 3 === 0;
        const isMid = seed % 3 === 1;
        const baseX = isForward ? 0.7 : isMid ? 0.5 : 0.3;
        const baseY = 0.5;
        const dist = Math.sqrt(Math.pow((col/14) - baseX, 2) + Math.pow((row/9) - baseY, 2));
        return Math.max(0, 1 - dist * 2 + Math.random() * 0.3);
      })
    );
  };

  const heatData = generateHeatData(currentPlayer);
  const maxVal = Math.max(...heatData.flat());
  const heatColor = (val: number) => {
    const norm = val / maxVal;
    if (norm < 0.2) return "transparent";
    if (norm < 0.4) return "rgba(59,130,246,0.3)";
    if (norm < 0.6) return "rgba(234,179,8,0.5)";
    if (norm < 0.8) return "rgba(249,115,22,0.65)";
    return "rgba(239,68,68,0.8)";
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-2">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-foreground font-semibold flex items-center gap-2">
              <Map size={16} className="text-orange-700 dark:text-orange-400"/> Player Heatmap
            </h3>
            <select
              value={currentPlayer}
              onChange={e => setSelectedPlayer(e.target.value)}
              className="bg-muted text-foreground text-sm rounded-lg px-3 py-1.5 border border-border"
            >
              {players.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="relative" style={{ paddingBottom: "60%", background: "#1a2e1a", borderRadius: 8, border: "2px solid #2d5a2d" }}>
            {/* Pitch lines */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none" style={{ zIndex: 2 }}>
              <rect x="2" y="2" width="96" height="56" fill="none" stroke="#2d5a2d" strokeWidth="0.5"/>
              <line x1="50" y1="2" x2="50" y2="58" stroke="#2d5a2d" strokeWidth="0.4"/>
              <circle cx="50" cy="30" r="9" fill="none" stroke="#2d5a2d" strokeWidth="0.4"/>
              <rect x="2" y="15" width="16" height="30" fill="none" stroke="#2d5a2d" strokeWidth="0.4"/>
              <rect x="82" y="15" width="16" height="30" fill="none" stroke="#2d5a2d" strokeWidth="0.4"/>
            </svg>
            {/* Heatmap cells */}
            <div className="absolute inset-0 grid" style={{ gridTemplateRows: "repeat(10,1fr)", gridTemplateColumns: "repeat(15,1fr)", zIndex: 1 }}>
              {heatData.flat().map((val, i) => (
                <div key={i} style={{ background: heatColor(val), transition: "background 0.3s" }}/>
              ))}
            </div>
          </div>
          {/* Color scale */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-xs text-muted-foreground">Low</span>
            <div className="flex-1 h-2 rounded-full" style={{ background: "linear-gradient(90deg, rgba(59,130,246,0.3), rgba(234,179,8,0.5), rgba(249,115,22,0.65), rgba(239,68,68,0.8))" }}/>
            <span className="text-xs text-muted-foreground">High</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-muted-foreground text-xs mb-2">Player Profile</div>
          <div className="text-foreground font-bold text-lg">{selectedPlayer}</div>
          <div className="text-muted-foreground text-sm">Forward · Future Stars FC U-21</div>
          <div className="mt-3 space-y-2">
            {[["Distance Covered","11.2 km"],["High Intensity Runs","23"],["Sprint Count","18"],["Touches","67"],["Duels Won","71%"]].map(([label, val]) => (
              <div key={label} className="flex justify-between text-xs">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground font-semibold">{val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="text-muted-foreground text-xs mb-2">Zone Analysis</div>
          {[["Final Third","High","#ef4444"],["Middle Third","Medium","#f59e0b"],["Own Third","Low","#22c55e"]].map(([zone, level, color]) => (
            <div key={zone} className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{zone}</span>
              <span className="text-xs font-bold" style={{ color }}>{level}</span>
            </div>
          ))}
        </div>
        <div className="bg-card rounded-xl p-4 border border-yellow-900/40">
          <div className="text-yellow-700 dark:text-yellow-400 text-xs font-bold mb-1 flex items-center gap-1">
            <Zap size={11}/> BEPRO-STYLE INSIGHT
          </div>
          <p className="text-xs text-muted-foreground">This player covers 78% of their activity in the final third — ideal for high-press systems. Consider pairing with a deeper-lying forward.</p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdvancedTacticalHub() {
  const { data: teams } = trpc.teams.getAll.useQuery();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const selectedTeam = teams?.find(t => t.id === selectedTeamId);
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"shotmap" | "passnet" | "heatmap" | "counterplan" | "aianalysis">("shotmap");

  const tabs = [
    { id: "shotmap", label: "xG Shot Map", icon: <Target size={15}/>, color: "text-green-700 dark:text-green-400" },
    { id: "passnet", label: "Pass Network", icon: <GitBranch size={15}/>, color: "text-blue-600 dark:text-blue-400" },
    { id: "heatmap", label: "Player Heatmap", icon: <Map size={15}/>, color: "text-orange-700 dark:text-orange-400" },
    { id: "counterplan", label: "Counter-Plan AI", icon: <Shield size={15}/>, color: "text-red-600 dark:text-red-400" },
    { id: "aianalysis", label: "AI Tactical Analysis", icon: <Brain size={15}/>, color: "text-purple-600 dark:text-purple-400" },
  ] as const;

  return (
    <>
    <div className="text-foreground">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => navigate("/dashboard")} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={20}/>
            </button>
            <div>
              <h1 className="text-xl font-bold flex items-center gap-2">
                <Brain size={22} className="text-red-500"/>
                Advanced Tactical Intelligence Hub
              </h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Professional-grade analysis inspired by Wyscout · StatsBomb · BEPRO · Hudl
              </p>
            </div>
          </div>

          {/* Platform badges */}
          <div className="flex gap-2 flex-wrap">
            {[
              { name: "Wyscout-Style", desc: "Opposition scouting & counter-plans", color: "bg-blue-900/40 border-blue-700/40 text-blue-600 dark:text-blue-300" },
              { name: "StatsBomb-Style", desc: "xG, pass maps, 3000+ events/match", color: "bg-purple-900/40 border-purple-700/40 text-purple-600 dark:text-purple-300" },
              { name: "BEPRO-Style", desc: "AI video + heatmap analysis", color: "bg-orange-900/40 border-orange-700/40 text-orange-700 dark:text-orange-300" },
              { name: "Hudl-Style", desc: "Tactical video breakdown", color: "bg-green-900/40 border-green-700/40 text-green-700 dark:text-green-300" },
            ].map(badge => (
              <div key={badge.name} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs ${badge.color}`}>
                <CheckCircle size={11}/>
                <span className="font-semibold">{badge.name}</span>
                <span className="opacity-70">· {badge.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-card border-b border-border px-6">
        <div className="max-w-7xl mx-auto flex gap-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === tab.id
                  ? `border-red-500 ${tab.color}`
                  : "border-transparent text-muted-foreground hover:text-muted-foreground"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === "shotmap" && <ShotMapTab/>}
        {activeTab === "passnet" && <PassNetworkTab/>}
        {activeTab === "heatmap" && <HeatmapTab/>}
        {activeTab === "counterplan" && <CounterPlanTab/>}
        {activeTab === "aianalysis" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Formation Analysis */}
              <div className="bg-card rounded-xl p-5 border border-border">
                <h3 className="text-base font-bold flex items-center gap-2 mb-4">
                  <Brain size={18} className="text-purple-600 dark:text-purple-400"/>
                  AI Formation Analysis
                </h3>
                <div className="space-y-3">
                  {[
                    { label: "Pressing Intensity", value: 78, color: "bg-red-500" },
                    { label: "Possession Control", value: 64, color: "bg-blue-500" },
                    { label: "Defensive Shape", value: 82, color: "bg-green-500" },
                    { label: "Transition Speed", value: 71, color: "bg-orange-500" },
                    { label: "Set Piece Threat", value: 55, color: "bg-purple-500" },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{item.label}</span>
                        <span className="text-foreground font-semibold">{item.value}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Tactical Recommendations */}
              <div className="bg-card rounded-xl p-5 border border-border">
                <h3 className="text-base font-bold flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-yellow-700 dark:text-yellow-400"/>
                  AI Tactical Recommendations
                </h3>
                <div className="space-y-3">
                  {[
                    { priority: "HIGH", text: "Exploit left flank — opponent's right back averages 62m/game, leaving space in behind.", color: "border-red-500 bg-red-900/20" },
                    { priority: "MED", text: "Press trigger: when opponent plays to their #6, activate immediate 3-man press.", color: "border-yellow-500 bg-yellow-900/20" },
                    { priority: "MED", text: "Set piece opportunity: opponent concedes 42% of goals from corners — near-post delivery.", color: "border-yellow-500 bg-yellow-900/20" },
                    { priority: "LOW", text: "Consider 4-3-3 → 4-2-3-1 mid-game transition if leading after 70 min.", color: "border-blue-500 bg-blue-900/20" },
                  ].map((rec, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${rec.color}`}>
                      <span className={`text-xs font-bold mr-2 ${rec.priority === 'HIGH' ? 'text-red-600 dark:text-red-400' : rec.priority === 'MED' ? 'text-yellow-700 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}`}>[{rec.priority}]</span>
                      <span className="text-sm text-muted-foreground">{rec.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Key Metrics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "xG For", value: "1.84", icon: <Target size={16} className="text-green-700 dark:text-green-400"/>, sub: "+0.3 vs avg" },
                { label: "xG Against", value: "0.92", icon: <Shield size={16} className="text-blue-600 dark:text-blue-400"/>, sub: "-0.2 vs avg" },
                { label: "PPDA", value: "8.4", icon: <Activity size={16} className="text-orange-700 dark:text-orange-400"/>, sub: "High press" },
                { label: "Field Tilt", value: "61%", icon: <TrendingUp size={16} className="text-purple-600 dark:text-purple-400"/>, sub: "Dominant" },
              ].map(m => (
                <div key={m.label} className="bg-card rounded-xl p-4 border border-border text-center">
                  <div className="flex justify-center mb-1">{m.icon}</div>
                  <div className="text-2xl font-bold text-foreground">{m.value}</div>
                  <div className="text-xs text-muted-foreground">{m.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{m.sub}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
