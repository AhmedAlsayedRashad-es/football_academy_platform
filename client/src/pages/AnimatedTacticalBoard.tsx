import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, Play, Pause, SkipBack, SkipForward, Plus, Trash2,
  Download, RotateCcw, Zap, ChevronRight, Users, UserCheck, Flame
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from '@/contexts/LanguageContext';

// ===================== TYPES =====================
interface PlayerMarker {
  id: string;
  label: string;   // position label (GK, CB, etc.) or jersey number if assigned
  team: "home" | "away";
  color: string;
  jerseyNumber?: number;
  playerName?: string;
}
interface PlayerPosition {
  playerId: string;
  x: number;
  y: number;
}
interface TacticalStep {
  id: string;
  label: string;
  positions: PlayerPosition[];
  description?: string;
}
interface TacticalSequence {
  id: string;
  name: string;
  players: PlayerMarker[];
  steps: TacticalStep[];
}

// ===================== CONSTANTS =====================
const HOME_COLOR = "#ef4444";
const AWAY_COLOR = "#3b82f6";
const BALL_COLOR = "#fbbf24";

// Player definitions for each team size
const PLAYERS_11: PlayerMarker[] = [
  { id: "h1", label: "GK", team: "home", color: HOME_COLOR },
  { id: "h2", label: "LB", team: "home", color: HOME_COLOR },
  { id: "h3", label: "CB", team: "home", color: HOME_COLOR },
  { id: "h4", label: "CB", team: "home", color: HOME_COLOR },
  { id: "h5", label: "RB", team: "home", color: HOME_COLOR },
  { id: "h6", label: "CM", team: "home", color: HOME_COLOR },
  { id: "h7", label: "CM", team: "home", color: HOME_COLOR },
  { id: "h8", label: "LW", team: "home", color: HOME_COLOR },
  { id: "h9", label: "ST", team: "home", color: HOME_COLOR },
  { id: "h10", label: "RW", team: "home", color: HOME_COLOR },
  { id: "h11", label: "CAM", team: "home", color: HOME_COLOR },
  { id: "a1", label: "GK", team: "away", color: AWAY_COLOR },
  { id: "a2", label: "LB", team: "away", color: AWAY_COLOR },
  { id: "a3", label: "CB", team: "away", color: AWAY_COLOR },
  { id: "a4", label: "CB", team: "away", color: AWAY_COLOR },
  { id: "a5", label: "RB", team: "away", color: AWAY_COLOR },
  { id: "a6", label: "CM", team: "away", color: AWAY_COLOR },
  { id: "a7", label: "CM", team: "away", color: AWAY_COLOR },
  { id: "a8", label: "LW", team: "away", color: AWAY_COLOR },
  { id: "a9", label: "ST", team: "away", color: AWAY_COLOR },
  { id: "a10", label: "RW", team: "away", color: AWAY_COLOR },
  { id: "a11", label: "CAM", team: "away", color: AWAY_COLOR },
  { id: "ball", label: "⚽", team: "home", color: BALL_COLOR },
];

const PLAYERS_9: PlayerMarker[] = [
  { id: "h1", label: "GK", team: "home", color: HOME_COLOR },
  { id: "h2", label: "LB", team: "home", color: HOME_COLOR },
  { id: "h3", label: "CB", team: "home", color: HOME_COLOR },
  { id: "h4", label: "RB", team: "home", color: HOME_COLOR },
  { id: "h5", label: "CM", team: "home", color: HOME_COLOR },
  { id: "h6", label: "CM", team: "home", color: HOME_COLOR },
  { id: "h7", label: "LW", team: "home", color: HOME_COLOR },
  { id: "h8", label: "ST", team: "home", color: HOME_COLOR },
  { id: "h9", label: "RW", team: "home", color: HOME_COLOR },
  { id: "a1", label: "GK", team: "away", color: AWAY_COLOR },
  { id: "a2", label: "LB", team: "away", color: AWAY_COLOR },
  { id: "a3", label: "CB", team: "away", color: AWAY_COLOR },
  { id: "a4", label: "RB", team: "away", color: AWAY_COLOR },
  { id: "a5", label: "CM", team: "away", color: AWAY_COLOR },
  { id: "a6", label: "CM", team: "away", color: AWAY_COLOR },
  { id: "a7", label: "LW", team: "away", color: AWAY_COLOR },
  { id: "a8", label: "ST", team: "away", color: AWAY_COLOR },
  { id: "a9", label: "RW", team: "away", color: AWAY_COLOR },
  { id: "ball", label: "⚽", team: "home", color: BALL_COLOR },
];

const PLAYERS_7: PlayerMarker[] = [
  { id: "h1", label: "GK", team: "home", color: HOME_COLOR },
  { id: "h2", label: "LB", team: "home", color: HOME_COLOR },
  { id: "h3", label: "CB", team: "home", color: HOME_COLOR },
  { id: "h4", label: "RB", team: "home", color: HOME_COLOR },
  { id: "h5", label: "CM", team: "home", color: HOME_COLOR },
  { id: "h6", label: "LW", team: "home", color: HOME_COLOR },
  { id: "h7", label: "ST", team: "home", color: HOME_COLOR },
  { id: "a1", label: "GK", team: "away", color: AWAY_COLOR },
  { id: "a2", label: "LB", team: "away", color: AWAY_COLOR },
  { id: "a3", label: "CB", team: "away", color: AWAY_COLOR },
  { id: "a4", label: "RB", team: "away", color: AWAY_COLOR },
  { id: "a5", label: "CM", team: "away", color: AWAY_COLOR },
  { id: "a6", label: "LW", team: "away", color: AWAY_COLOR },
  { id: "a7", label: "ST", team: "away", color: AWAY_COLOR },
  { id: "ball", label: "⚽", team: "home", color: BALL_COLOR },
];

// Starting positions for each team size
function getStartPositions(size: 7 | 9 | 11): PlayerPosition[] {
  if (size === 11) return [
    { playerId: "h1", x: 8, y: 50 },
    { playerId: "h2", x: 22, y: 20 }, { playerId: "h3", x: 22, y: 40 },
    { playerId: "h4", x: 22, y: 60 }, { playerId: "h5", x: 22, y: 80 },
    { playerId: "h6", x: 40, y: 35 }, { playerId: "h7", x: 40, y: 65 },
    { playerId: "h8", x: 55, y: 20 }, { playerId: "h9", x: 60, y: 50 },
    { playerId: "h10", x: 55, y: 80 }, { playerId: "h11", x: 50, y: 50 },
    { playerId: "a1", x: 92, y: 50 },
    { playerId: "a2", x: 78, y: 20 }, { playerId: "a3", x: 78, y: 40 },
    { playerId: "a4", x: 78, y: 60 }, { playerId: "a5", x: 78, y: 80 },
    { playerId: "a6", x: 65, y: 35 }, { playerId: "a7", x: 65, y: 65 },
    { playerId: "a8", x: 72, y: 20 }, { playerId: "a9", x: 75, y: 50 },
    { playerId: "a10", x: 72, y: 80 }, { playerId: "a11", x: 68, y: 50 },
    { playerId: "ball", x: 50, y: 50 },
  ];
  if (size === 9) return [
    { playerId: "h1", x: 8, y: 50 },
    { playerId: "h2", x: 22, y: 20 }, { playerId: "h3", x: 22, y: 50 }, { playerId: "h4", x: 22, y: 80 },
    { playerId: "h5", x: 40, y: 35 }, { playerId: "h6", x: 40, y: 65 },
    { playerId: "h7", x: 58, y: 20 }, { playerId: "h8", x: 62, y: 50 }, { playerId: "h9", x: 58, y: 80 },
    { playerId: "a1", x: 92, y: 50 },
    { playerId: "a2", x: 78, y: 20 }, { playerId: "a3", x: 78, y: 50 }, { playerId: "a4", x: 78, y: 80 },
    { playerId: "a5", x: 65, y: 35 }, { playerId: "a6", x: 65, y: 65 },
    { playerId: "a7", x: 55, y: 20 }, { playerId: "a8", x: 58, y: 50 }, { playerId: "a9", x: 55, y: 80 },
    { playerId: "ball", x: 50, y: 50 },
  ];
  // 7-a-side
  return [
    { playerId: "h1", x: 8, y: 50 },
    { playerId: "h2", x: 22, y: 20 }, { playerId: "h3", x: 22, y: 50 }, { playerId: "h4", x: 22, y: 80 },
    { playerId: "h5", x: 40, y: 50 },
    { playerId: "h6", x: 55, y: 25 }, { playerId: "h7", x: 58, y: 50 },
    { playerId: "a1", x: 92, y: 50 },
    { playerId: "a2", x: 78, y: 20 }, { playerId: "a3", x: 78, y: 50 }, { playerId: "a4", x: 78, y: 80 },
    { playerId: "a5", x: 62, y: 50 },
    { playerId: "a6", x: 68, y: 25 }, { playerId: "a7", x: 70, y: 50 },
    { playerId: "ball", x: 50, y: 50 },
  ];
}

function buildDefaultSequence(size: 7 | 9 | 11): TacticalSequence {
  const players = size === 11 ? PLAYERS_11 : size === 9 ? PLAYERS_9 : PLAYERS_7;
  const pos1 = getStartPositions(size);
  const pos2 = pos1.map(p => {
    if (p.playerId.startsWith("h") && p.playerId !== "h1") return { ...p, x: Math.min(90, p.x + 8) };
    if (p.playerId === "ball") return { ...p, x: Math.min(90, p.x + 10) };
    return p;
  });
  const pos3 = pos2.map(p => {
    if (p.playerId.startsWith("h") && p.playerId !== "h1") return { ...p, x: Math.min(90, p.x + 10) };
    if (p.playerId === "ball") return { ...p, x: Math.min(90, p.x + 12) };
    return p;
  });
  return {
    id: "seq1",
    name: size === 7 ? "7-a-side Counter Attack" : size === 9 ? "9-a-side Build-up Play" : "11-a-side Wide Overload",
    players,
    steps: [
      { id: "s1", label: "Step 1", positions: pos1, description: "Starting formation" },
      { id: "s2", label: "Step 2", positions: pos2, description: "Forward press" },
      { id: "s3", label: "Step 3", positions: pos3, description: "Final third entry" },
    ],
  };
}

// ===================== INTERPOLATION =====================
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function interpolatePositions(from: PlayerPosition[], to: PlayerPosition[], t: number): PlayerPosition[] {
  return from.map(fp => {
    const tp = to.find(p => p.playerId === fp.playerId);
    if (!tp) return fp;
    return { playerId: fp.playerId, x: lerp(fp.x, tp.x, t), y: lerp(fp.y, tp.y, t) };
  });
}

// ===================== PITCH CANVAS =====================
function PitchCanvas({
  positions, players, onDragPlayer, isDraggable, heatmapData, movementPaths, animProgress,
}: {
  positions: PlayerPosition[];
  players: PlayerMarker[];
  onDragPlayer?: (playerId: string, x: number, y: number) => void;
  isDraggable?: boolean;
  heatmapData?: { x: number; y: number; team: 'home' | 'away' }[];
  movementPaths?: { playerId: string; from: { x: number; y: number }; to: { x: number; y: number }; team: 'home' | 'away' | 'ball' }[];
  animProgress?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { t, language } = useLanguage();
  const [dragging, setDragging] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ id: string; name: string; x: number; y: number } | null>(null);

  function getRelPos(e: React.MouseEvent | React.TouchEvent) {
    const rect = containerRef.current!.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)),
    };
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!dragging || !isDraggable || !onDragPlayer) return;
    const { x, y } = getRelPos(e);
    onDragPlayer(dragging, x, y);
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-green-900 rounded-lg overflow-hidden select-none"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setDragging(null)}
      onMouseLeave={() => { setDragging(null); setTooltip(null); }}
    >
      {/* Movement path arrows overlay */}
      {movementPaths && movementPaths.length > 0 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 8 }}>
          <defs>
            <marker id="arr-home" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#ef4444" opacity="0.9" />
            </marker>
            <marker id="arr-away" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#60a5fa" opacity="0.9" />
            </marker>
            <marker id="arr-ball" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#fbbf24" opacity="0.9" />
            </marker>
          </defs>
          {movementPaths.map((path, i) => {
            const dx = path.to.x - path.from.x;
            const dy = path.to.y - path.from.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 1.5) return null;
            const color = path.team === 'home' ? '#ef4444' : path.team === 'away' ? '#60a5fa' : '#fbbf24';
            const markerId = path.team === 'home' ? 'arr-home' : path.team === 'away' ? 'arr-away' : 'arr-ball';
            const angle = Math.atan2(dy, dx);
            const shorten = 3.5;
            const toX = path.to.x - Math.cos(angle) * shorten;
            const toY = path.to.y - Math.sin(angle) * shorten;
            return (
              <line
                key={i}
                x1={`${path.from.x}%`} y1={`${path.from.y}%`}
                x2={`${toX}%`} y2={`${toY}%`}
                stroke={color}
                strokeWidth="2"
                strokeDasharray="7 4"
                opacity="0.8"
                markerEnd={`url(#${markerId})`}
              />
            );
          })}
        </svg>
      )}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" width="1600" height="900" fill="#166534" />
        {[0,1,2,3,4,5,6,7].map(i => (
          <rect key={i} x={i * 200} y="0" width="200" height="900" fill={i % 2 === 0 ? "#15803d" : "#166534"} opacity="0.5" />
        ))}
        {/* Pitch markings */}
        <rect x="40" y="40" width="1520" height="820" fill="none" stroke="white" strokeWidth="3" opacity="0.7" />
        <line x1="800" y1="40" x2="800" y2="860" stroke="white" strokeWidth="2" opacity="0.7" />
        <circle cx="800" cy="450" r="110" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
        <circle cx="800" cy="450" r="5" fill="white" opacity="0.7" />
        {/* Left penalty area */}
        <rect x="40" y="255" width="240" height="390" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
        <rect x="40" y="345" width="90" height="210" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
        <circle cx="280" cy="450" r="4" fill="white" opacity="0.7" />
        {/* Right penalty area */}
        <rect x="1320" y="255" width="240" height="390" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
        <rect x="1470" y="345" width="90" height="210" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
        <circle cx="1320" cy="450" r="4" fill="white" opacity="0.7" />
        {/* Goals */}
        <rect x="10" y="380" width="30" height="140" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
        <rect x="1560" y="380" width="30" height="140" fill="none" stroke="white" strokeWidth="2" opacity="0.7" />
        {/* Heatmap overlay */}
        {heatmapData && heatmapData.length > 0 && (
          <g>
            <defs>
              {heatmapData.map((pt, i) => (
                <radialGradient key={i} id={`hg${i}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={pt.team === 'home' ? '#ef4444' : '#3b82f6'} stopOpacity="0.45" />
                  <stop offset="100%" stopColor={pt.team === 'home' ? '#ef4444' : '#3b82f6'} stopOpacity="0" />
                </radialGradient>
              ))}
            </defs>
            {heatmapData.map((pt, i) => (
              <ellipse
                key={i}
                cx={pt.x * 16}
                cy={pt.y * 9}
                rx="130"
                ry="110"
                fill={`url(#hg${i})`}
              />
            ))}
          </g>
        )}
      </svg>
      {/* Player markers */}
      {positions.map(pos => {
        const player = players.find(p => p.id === pos.playerId);
        if (!player) return null;
        const isBall = player.id === "ball";
        // Show jersey number if assigned, otherwise position label
        const displayLabel = isBall ? "⚽" : (player.jerseyNumber != null ? String(player.jerseyNumber) : player.label);
        // Ball bounce: scale oscillates between 1.0 and 1.35 using a sine wave during animation
        const t = animProgress ?? 0;
        const ballBounce = isBall ? 1 + 0.35 * Math.abs(Math.sin(t * Math.PI * 2)) : 1;
        const ballSize = Math.round(32 * ballBounce);
        const ballGlow = isBall && t > 0.05
          ? `0 0 ${Math.round(8 + 10 * Math.abs(Math.sin(t * Math.PI * 2)))}px 4px rgba(251,191,36,0.8), 0 2px 8px rgba(0,0,0,0.6)`
          : isBall ? "0 0 8px 3px rgba(251,191,36,0.5), 0 2px 8px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.5)";
        return (
          <div
            key={pos.playerId}
            className={`absolute flex flex-col items-center justify-center ${isDraggable ? "cursor-grab active:cursor-grabbing" : "pointer-events-none"}`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -50%) scale(${isBall ? ballBounce : 1})`,
              zIndex: isBall ? 25 : 10,
              transition: isBall ? "none" : undefined,
            }}
            onMouseDown={isDraggable ? (e) => { e.preventDefault(); setDragging(pos.playerId); } : undefined}
            onMouseEnter={() => {
              if (player.playerName) {
                setTooltip({ id: pos.playerId, name: player.playerName, x: pos.x, y: pos.y });
              }
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            {/* Ball shadow on pitch */}
            {isBall && (
              <div
                style={{
                  position: "absolute",
                  width: ballSize * 0.9,
                  height: ballSize * 0.35,
                  borderRadius: "50%",
                  background: "rgba(0,0,0,0.35)",
                  bottom: -6,
                  left: "50%",
                  transform: "translateX(-50%)",
                  filter: "blur(3px)",
                  zIndex: -1,
                }}
              />
            )}
            <div
              className="flex items-center justify-center rounded-full font-bold text-foreground"
              style={{
                width: isBall ? ballSize : 34,
                height: isBall ? ballSize : 34,
                backgroundColor: isBall ? "transparent" : player.color,
                fontSize: isBall ? Math.round(ballSize * 0.65) : (player.jerseyNumber != null ? 12 : 10),
                border: isBall ? "none" : "2px solid rgba(255,255,255,0.85)",
                boxShadow: ballGlow,
              }}
            >
              {displayLabel}
            </div>
            {/* Player name label below marker */}
            {!isBall && player.playerName && (
              <div
                className="text-foreground font-semibold text-center leading-tight mt-0.5"
                style={{
                  fontSize: 9,
                  textShadow: "0 1px 3px rgba(0,0,0,0.9)",
                  maxWidth: 60,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {player.playerName.split(" ")[0]}
              </div>
            )}
          </div>
        );
      })}
      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute bg-card text-foreground text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-30 border border-border"
          style={{ left: `${tooltip.x}%`, top: `${Math.max(5, tooltip.y - 10)}%`, transform: "translate(-50%, -100%)" }}
        >
          {tooltip.name}
        </div>
      )}
    </div>
  );
}

// ===================== MAIN COMPONENT =====================
export default function AnimatedTacticalBoard() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [teamSize, setTeamSize] = useState<7 | 9 | 11>(11);
  const [sequence, setSequence] = useState<TacticalSequence>(() => buildDefaultSequence(11));
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [animProgress, setAnimProgress] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [editingStep, setEditingStep] = useState<string | null>(null);
  const [showAssignPanel, setShowAssignPanel] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedAwayTeamId, setSelectedAwayTeamId] = useState<number | null>(null);
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);
  const stepIdxRef = useRef(0);

  // Fetch teams for player assignment
  const teamsQuery = trpc.teams.getAll.useQuery(undefined, { staleTime: 60000 });
  // Fetch players for selected home team
  const playersQuery = trpc.teams.getPlayers.useQuery(
    { teamId: selectedTeamId! },
    { enabled: selectedTeamId != null, staleTime: 30000 }
  );
  // Fetch players for selected away team
  const awayPlayersQuery = trpc.teams.getPlayers.useQuery(
    { teamId: selectedAwayTeamId! },
    { enabled: selectedAwayTeamId != null, staleTime: 30000 }
  );

  // When team size changes, rebuild the sequence
  function handleTeamSizeChange(size: 7 | 9 | 11) {
    setTeamSize(size);
    setIsPlaying(false);
    setCurrentStepIdx(0);
    setAnimProgress(0);
    setEditingStep(null);
    progressRef.current = 0;
    stepIdxRef.current = 0;
    setSequence(buildDefaultSequence(size));
    toast({ title: `Switched to ${size}-a-side`, description: `Formation reset for ${size} players per team.` });
  }

  // Assign a real player to a home team slot
  function assignPlayerToSlot(slotId: string, playerId: number | null) {
    const dbPlayers = playersQuery.data as any[] | undefined;
    setSequence(prev => ({
      ...prev,
      players: prev.players.map(p => {
        if (p.id !== slotId) return p;
        if (playerId === null) {
          const base = (teamSize === 11 ? PLAYERS_11 : teamSize === 9 ? PLAYERS_9 : PLAYERS_7).find(b => b.id === slotId);
          return { ...p, jerseyNumber: undefined, playerName: undefined, label: base?.label || p.label };
        }
        const dbPlayer = dbPlayers?.find((dp: any) => dp.id === playerId);
        if (!dbPlayer) return p;
        return {
          ...p,
          jerseyNumber: dbPlayer.jerseyNumber ?? undefined,
          playerName: `${dbPlayer.firstName} ${dbPlayer.lastName}`,
        };
      }),
    }));
  }
  // Assign a real player to an away team slot
  function assignAwayPlayerToSlot(slotId: string, playerId: number | null) {
    const dbPlayers = awayPlayersQuery.data as any[] | undefined;
    setSequence(prev => ({
      ...prev,
      players: prev.players.map(p => {
        if (p.id !== slotId) return p;
        if (playerId === null) {
          const base = (teamSize === 11 ? PLAYERS_11 : teamSize === 9 ? PLAYERS_9 : PLAYERS_7).find(b => b.id === slotId);
          return { ...p, jerseyNumber: undefined, playerName: undefined, label: base?.label || p.label };
        }
        const dbPlayer = dbPlayers?.find((dp: any) => dp.id === playerId);
        if (!dbPlayer) return p;
        return {
          ...p,
          jerseyNumber: dbPlayer.jerseyNumber ?? undefined,
          playerName: `${dbPlayer.firstName} ${dbPlayer.lastName}`,
        };
      }),
    }));
  }

  // Compute displayed positions (interpolated between steps)
  const displayedPositions = (() => {
    const steps = sequence.steps;
    if (steps.length === 0) return [];
    if (currentStepIdx >= steps.length - 1 || animProgress === 0) {
      return steps[Math.min(currentStepIdx, steps.length - 1)]?.positions || [];
    }
    const from = steps[currentStepIdx].positions;
    const to = steps[currentStepIdx + 1].positions;
    return interpolatePositions(from, to, animProgress);
  })();

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      const fps = 30;
      const stepDuration = speed * 1000;
      const tickMs = 1000 / fps;
      const increment = tickMs / stepDuration;
      animRef.current = setInterval(() => {
        progressRef.current += increment;
        if (progressRef.current >= 1) {
          progressRef.current = 0;
          const nextIdx = stepIdxRef.current + 1;
          if (nextIdx >= sequence.steps.length - 1) {
            stepIdxRef.current = sequence.steps.length - 1;
            setCurrentStepIdx(sequence.steps.length - 1);
            setAnimProgress(0);
            setIsPlaying(false);
            if (animRef.current) clearInterval(animRef.current);
            return;
          }
          stepIdxRef.current = nextIdx;
          setCurrentStepIdx(nextIdx);
        }
        setAnimProgress(progressRef.current);
      }, tickMs);
    } else {
      if (animRef.current) clearInterval(animRef.current);
    }
    return () => { if (animRef.current) clearInterval(animRef.current); };
  }, [isPlaying, speed, sequence.steps.length]);

  function handlePlay() {
    if (currentStepIdx >= sequence.steps.length - 1) {
      stepIdxRef.current = 0; progressRef.current = 0;
      setCurrentStepIdx(0); setAnimProgress(0);
    }
    stepIdxRef.current = currentStepIdx;
    progressRef.current = animProgress;
    setIsPlaying(true);
  }
  function handlePause() { setIsPlaying(false); }
  function handleReset() {
    setIsPlaying(false);
    stepIdxRef.current = 0; progressRef.current = 0;
    setCurrentStepIdx(0); setAnimProgress(0);
  }
  function handlePrevStep() {
    setIsPlaying(false);
    const idx = Math.max(0, currentStepIdx - 1);
    stepIdxRef.current = idx; progressRef.current = 0;
    setCurrentStepIdx(idx); setAnimProgress(0);
  }
  function handleNextStep() {
    setIsPlaying(false);
    const idx = Math.min(sequence.steps.length - 1, currentStepIdx + 1);
    stepIdxRef.current = idx; progressRef.current = 0;
    setCurrentStepIdx(idx); setAnimProgress(0);
  }
  function handleAddStep() {
    const lastStep = sequence.steps[sequence.steps.length - 1];
    const newStep: TacticalStep = {
      id: `s${Date.now()}`,
      label: `Step ${sequence.steps.length + 1}`,
      positions: lastStep ? [...lastStep.positions] : getStartPositions(teamSize),
      description: "",
    };
    setSequence(prev => ({ ...prev, steps: [...prev.steps, newStep] }));
    setCurrentStepIdx(sequence.steps.length);
    setAnimProgress(0);
    setEditingStep(newStep.id);
    toast({ title: "Step added", description: "Drag players to set their positions for this step." });
  }
  function handleDeleteStep(stepId: string) {
    if (sequence.steps.length <= 1) {
      toast({ title: "Cannot delete", description: "Need at least one step.", variant: "destructive" });
      return;
    }
    setSequence(prev => ({ ...prev, steps: prev.steps.filter(s => s.id !== stepId) }));
    setCurrentStepIdx(prev => Math.max(0, prev - 1));
    if (editingStep === stepId) setEditingStep(null);
  }
  function handleDragPlayer(playerId: string, x: number, y: number) {
    if (!editingStep) return;
    setSequence(prev => ({
      ...prev,
      steps: prev.steps.map(step => {
        if (step.id !== editingStep) return step;
        return {
          ...step,
          positions: step.positions.map(pos =>
            pos.playerId === playerId ? { ...pos, x, y } : pos
          ),
        };
      }),
    }));
  }
  function handleUpdateStepDesc(stepId: string, desc: string) {
    setSequence(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, description: desc } : s),
    }));
  }
  function handleExport() {
    const json = JSON.stringify(sequence, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tactical-sequence-${sequence.name.replace(/\s+/g, "-")}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported!", description: "Tactical sequence saved as JSON." });
  }

  const isEditMode = !!editingStep;
  const homePlayers = sequence.players.filter(p => p.team === "home" && p.id !== "ball");
  const awayPlayers = sequence.players.filter(p => p.team === "away" && p.id !== "ball");
  const dbPlayers = (playersQuery.data as any[] | undefined) || [];
  const awayDbPlayers = (awayPlayersQuery.data as any[] | undefined) || [];
  const teams = (teamsQuery.data as any[] | undefined) || [];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/advanced-tactical-hub")} className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-700 dark:text-yellow-400" />
                Animated Tactical Board
              </h1>
              <p className="text-sm text-muted-foreground">Create step-by-step tactical animations with player movement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={`border-border gap-1.5 ${showAssignPanel ? "bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-600" : "text-muted-foreground"}`}
              onClick={() => setShowAssignPanel(v => !v)}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Assign Players
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`border-border gap-1.5 ${showHeatmap ? "bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-600" : "text-muted-foreground"}`}
              onClick={() => setShowHeatmap(v => !v)}
              title="Toggle position heatmap overlay"
            >
              <Flame className="w-3.5 h-3.5" />
              Heatmap
            </Button>
            <Button variant="outline" size="sm" className="border-border text-muted-foreground gap-1.5" onClick={handleExport}>
              <Download className="w-3.5 h-3.5" />Export JSON
            </Button>
          </div>
        </div>

        {/* Team Size Selector */}
        <Card className="bg-card border-border">
          <div className="p-4 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
              <span className="text-sm font-medium">Team Size:</span>
            </div>
            {([7, 9, 11] as const).map(size => (
              <button
                key={size}
                onClick={() => handleTeamSizeChange(size)}
                className={`px-5 py-2 rounded-lg text-sm font-bold border-2 transition-all ${
                  teamSize === size
                    ? "bg-yellow-500 border-yellow-400 text-black"
                    : "bg-muted border-border text-muted-foreground hover:border-yellow-600"
                }`}
              >
                {size}-a-side
              </button>
            ))}
            <span className="text-xs text-muted-foreground ml-2">
              {teamSize === 7 ? "3-1-2 formation" : teamSize === 9 ? "3-2-3 formation" : "4-2-3-1 formation"}
              {" · "}{teamSize} home + {teamSize} away players
            </span>
          </div>
        </Card>

        {/* Assign Players Panel */}
        {showAssignPanel && (
          <Card className="bg-card border-yellow-700">
            <div className="p-4 space-y-4">
              <h3 className="text-sm font-semibold text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                <UserCheck className="w-4 h-4" />
                Assign Real Players to Slots
              </h3>
              <p className="text-xs text-muted-foreground">
                Jersey numbers replace position labels on the pitch. Hover a marker to see the full name.
              </p>

              {/* ── HOME TEAM ── */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HOME_COLOR }} />
                    <span className="text-xs font-semibold text-red-600 dark:text-red-300">Home Team</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Team:</span>
                    <Select
                      value={selectedTeamId ? String(selectedTeamId) : ""}
                      onValueChange={v => setSelectedTeamId(v ? Number(v) : null)}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground text-xs h-7 w-44">
                        <SelectValue placeholder="Select team…" />
                      </SelectTrigger>
                      <SelectContent className="bg-muted border-border">
                        {teams.map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)} className="text-foreground text-xs">{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {homePlayers.map(slot => (
                    <div key={slot.id} className="bg-muted rounded-lg p-2 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-foreground" style={{ backgroundColor: HOME_COLOR }}>
                          {slot.jerseyNumber != null ? slot.jerseyNumber : slot.label}
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{slot.label} slot</span>
                      </div>
                      {slot.playerName && (
                        <p className="text-xs text-red-600 dark:text-red-300 truncate">{slot.playerName}</p>
                      )}
                      <Select
                        value={slot.playerName ? String(dbPlayers.find((p: any) => `${p.firstName} ${p.lastName}` === slot.playerName)?.id || "__unassign__") : "__unassign__"}
                        onValueChange={v => assignPlayerToSlot(slot.id, v === "__unassign__" ? null : Number(v))}
                        disabled={!selectedTeamId || playersQuery.isLoading}
                      >
                        <SelectTrigger className="bg-muted border-border text-foreground text-xs h-7">
                          <SelectValue placeholder={selectedTeamId ? "Pick player…" : "Select team first"} />
                        </SelectTrigger>
                        <SelectContent className="bg-muted border-border">
                          <SelectItem value="__unassign__" className="text-muted-foreground text-xs">— Unassign —</SelectItem>
                          {dbPlayers.map((p: any) => (
                            <SelectItem key={p.id} value={String(p.id)} className="text-foreground text-xs">
                              {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ""}{p.firstName} {p.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── AWAY TEAM ── */}
              <div className="border-t border-border pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: AWAY_COLOR }} />
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-300">Away Team</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Team:</span>
                    <Select
                      value={selectedAwayTeamId ? String(selectedAwayTeamId) : ""}
                      onValueChange={v => setSelectedAwayTeamId(v ? Number(v) : null)}
                    >
                      <SelectTrigger className="bg-muted border-border text-foreground text-xs h-7 w-44">
                        <SelectValue placeholder="Select team…" />
                      </SelectTrigger>
                      <SelectContent className="bg-muted border-border">
                        {teams.map((t: any) => (
                          <SelectItem key={t.id} value={String(t.id)} className="text-foreground text-xs">{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {awayPlayers.map(slot => (
                    <div key={slot.id} className="bg-muted rounded-lg p-2 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-foreground" style={{ backgroundColor: AWAY_COLOR }}>
                          {slot.jerseyNumber != null ? slot.jerseyNumber : slot.label}
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{slot.label} slot</span>
                      </div>
                      {slot.playerName && (
                        <p className="text-xs text-blue-600 dark:text-blue-300 truncate">{slot.playerName}</p>
                      )}
                      <Select
                        value={slot.playerName ? String(awayDbPlayers.find((p: any) => `${p.firstName} ${p.lastName}` === slot.playerName)?.id || "__unassign__") : "__unassign__"}
                        onValueChange={v => assignAwayPlayerToSlot(slot.id, v === "__unassign__" ? null : Number(v))}
                        disabled={!selectedAwayTeamId || awayPlayersQuery.isLoading}
                      >
                        <SelectTrigger className="bg-muted border-border text-foreground text-xs h-7">
                          <SelectValue placeholder={selectedAwayTeamId ? "Pick player…" : "Select team first"} />
                        </SelectTrigger>
                        <SelectContent className="bg-muted border-border">
                          <SelectItem value="__unassign__" className="text-muted-foreground text-xs">— Unassign —</SelectItem>
                          {awayDbPlayers.map((p: any) => (
                            <SelectItem key={p.id} value={String(p.id)} className="text-foreground text-xs">
                              {p.jerseyNumber != null ? `#${p.jerseyNumber} ` : ""}{p.firstName} {p.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-4">
          {/* LEFT: Steps panel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Sequence Steps</h2>
              <Button size="sm" className="gap-1 bg-yellow-600 hover:bg-yellow-700 h-7 text-xs" onClick={handleAddStep}>
                <Plus className="w-3 h-3" />Add Step
              </Button>
            </div>
            {sequence.steps.map((step, idx) => (
              <div
                key={step.id}
                className={`rounded-lg border p-3 cursor-pointer transition-all ${
                  currentStepIdx === idx
                    ? "border-yellow-500 bg-yellow-900/20"
                    : "border-border bg-card hover:border-border"
                }`}
                onClick={() => { setIsPlaying(false); setCurrentStepIdx(idx); setAnimProgress(0); stepIdxRef.current = idx; progressRef.current = 0; }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${currentStepIdx === idx ? "bg-yellow-500 text-black" : "bg-muted text-muted-foreground"}`}>
                      {idx + 1}
                    </div>
                    <span className="text-sm font-medium text-foreground">{step.label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); setEditingStep(editingStep === step.id ? null : step.id); setCurrentStepIdx(idx); }}
                      className={`p-1 rounded text-xs ${editingStep === step.id ? "bg-yellow-600 text-black" : "text-muted-foreground hover:text-yellow-400"}`}
                      title="Edit positions"
                    >✏️</button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteStep(step.id); }}
                      className="p-1 rounded text-muted-foreground hover:text-red-400"
                    ><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
                {step.description && (
                  <p className="text-xs text-muted-foreground mt-1.5 ml-8">{step.description}</p>
                )}
                {editingStep === step.id && (
                  <div className="mt-2 ml-8" onClick={e => e.stopPropagation()}>
                    <Input
                      value={step.description || ""}
                      onChange={e => handleUpdateStepDesc(step.id, e.target.value)}
                      placeholder="Describe this step..."
                      className="bg-muted border-border text-foreground text-xs h-7"
                    />
                  </div>
                )}
              </div>
            ))}
            {/* Legend */}
            <Card className="bg-card border-border">
              <div className="p-3 space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase">Legend</h3>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: HOME_COLOR }} />
                  <span className="text-xs text-muted-foreground">Home Team ({teamSize} players)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full" style={{ backgroundColor: AWAY_COLOR }} />
                  <span className="text-xs text-muted-foreground">Away Team ({teamSize} players)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">⚽</span>
                  <span className="text-xs text-muted-foreground">Ball</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Numbers shown = jersey numbers when players are assigned</p>
              </div>
            </Card>
            {/* Speed control */}
            <Card className="bg-card border-border">
              <div className="p-3 space-y-2">
                <h3 className="text-xs font-medium text-muted-foreground uppercase">Animation Speed</h3>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Fast</span>
                  <Slider
                    min={0.5} max={3} step={0.5} value={[speed]}
                    onValueChange={([v]) => setSpeed(v)}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground">Slow</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">{speed}s per step</p>
              </div>
            </Card>
          </div>

          {/* RIGHT: Pitch + controls */}
          <div className="lg:col-span-3 space-y-4">
            {isEditMode && (
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 text-sm text-yellow-800 dark:text-yellow-300">
                ✏️ <strong>Edit Mode:</strong> Drag players on the pitch to set their positions for Step {currentStepIdx + 1}. Click the pencil icon again to exit edit mode.
              </div>
            )}
            <PitchCanvas
              positions={displayedPositions}
              players={sequence.players}
              onDragPlayer={handleDragPlayer}
              isDraggable={isEditMode}
              animProgress={isPlaying ? animProgress : 0}
              heatmapData={showHeatmap ? sequence.steps.flatMap(step =>
                step.positions.flatMap(pos => {
                  const player = sequence.players.find(p => p.id === pos.playerId);
                  if (!player || player.id === 'ball') return [];
                  return [{ x: pos.x, y: pos.y, team: player.team }];
                })
              ) : undefined}
              movementPaths={(() => {
                // Show movement arrows from current step to next step
                const steps = sequence.steps;
                if (steps.length < 2 || currentStepIdx >= steps.length - 1) return [];
                const fromStep = steps[currentStepIdx];
                const toStep = steps[currentStepIdx + 1];
                return fromStep.positions.flatMap(fromPos => {
                  const toPos = toStep.positions.find(p => p.playerId === fromPos.playerId);
                  if (!toPos) return [];
                  const player = sequence.players.find(p => p.id === fromPos.playerId);
                  if (!player) return [];
                  const dx = toPos.x - fromPos.x;
                  const dy = toPos.y - fromPos.y;
                  if (Math.sqrt(dx * dx + dy * dy) < 1.5) return [];
                  return [{ playerId: fromPos.playerId, from: { x: fromPos.x, y: fromPos.y }, to: { x: toPos.x, y: toPos.y }, team: player.id === 'ball' ? 'ball' as const : player.team }];
                });
              })()}
            />
            {/* Playback controls */}
            <Card className="bg-card border-border">
              <div className="p-4">
                <div className="flex items-center justify-center gap-3">
                  <Button variant="outline" size="sm" className="border-border text-muted-foreground w-9 h-9 p-0" onClick={handleReset} title="Reset">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="border-border text-muted-foreground w-9 h-9 p-0" onClick={handlePrevStep} disabled={currentStepIdx === 0 && !isPlaying}>
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  {isPlaying ? (
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 w-12 h-12 p-0 rounded-full" onClick={handlePause}>
                      <Pause className="w-5 h-5" />
                    </Button>
                  ) : (
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700 w-12 h-12 p-0 rounded-full" onClick={handlePlay} disabled={sequence.steps.length < 2}>
                      <Play className="w-5 h-5" />
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="border-border text-muted-foreground w-9 h-9 p-0" onClick={handleNextStep} disabled={currentStepIdx >= sequence.steps.length - 1 && !isPlaying}>
                    <SkipForward className="w-4 h-4" />
                  </Button>
                </div>
                {/* Progress bar */}
                <div className="mt-4 space-y-2">
                  <div className="flex gap-1">
                    {sequence.steps.map((step, idx) => (
                      <button
                        key={step.id}
                        className={`flex-1 h-2 rounded-full transition-all ${
                          idx < currentStepIdx ? "bg-yellow-500" :
                          idx === currentStepIdx ? "bg-yellow-400" : "bg-muted"
                        }`}
                        onClick={() => { setIsPlaying(false); setCurrentStepIdx(idx); setAnimProgress(0); stepIdxRef.current = idx; progressRef.current = 0; }}
                        title={step.label}
                      />
                    ))}
                  </div>
                  {isPlaying && (
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full transition-none" style={{ width: `${animProgress * 100}%` }} />
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    {sequence.steps.map((step, idx) => (
                      <span key={step.id} className={idx === currentStepIdx ? "text-yellow-700 dark:text-yellow-400" : ""}>{step.label}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
            {/* Instructions */}
            <Card className="bg-card border-border">
              <div className="p-4">
                <h3 className="text-sm font-medium text-foreground mb-2">How to create a tactical sequence</h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-yellow-700 dark:text-yellow-400 mt-0.5 shrink-0" />Select <strong className="text-foreground">7, 9 or 11-a-side</strong> to set team size</div>
                  <div className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-yellow-700 dark:text-yellow-400 mt-0.5 shrink-0" />Click <strong className="text-foreground">Assign Players</strong> to show real jersey numbers</div>
                  <div className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-yellow-700 dark:text-yellow-400 mt-0.5 shrink-0" />Click <strong className="text-foreground">Add Step</strong> to add a new movement phase</div>
                  <div className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-yellow-700 dark:text-yellow-400 mt-0.5 shrink-0" />Click the ✏️ icon on a step to enter edit mode</div>
                  <div className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-yellow-700 dark:text-yellow-400 mt-0.5 shrink-0" />Drag players on the pitch to set their positions</div>
                  <div className="flex items-start gap-2"><ChevronRight className="w-3 h-3 text-yellow-700 dark:text-yellow-400 mt-0.5 shrink-0" />Press <strong className="text-foreground">Play</strong> to animate the full sequence</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
