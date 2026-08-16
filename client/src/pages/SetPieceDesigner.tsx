import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from '@/contexts/LanguageContext';
import {
  ArrowLeft,
  Save,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Target,
  Circle,
  ArrowRight,
  Move,
  Users,
  Flag,
  Crosshair,
} from "lucide-react";

// Set piece types
const SET_PIECE_TYPES = [
  { id: "corner_left", label: "Corner Kick (Left)", icon: Flag },
  { id: "corner_right", label: "Corner Kick (Right)", icon: Flag },
  { id: "free_kick_central", label: "Free Kick (Central)", icon: Target },
  { id: "free_kick_left", label: "Free Kick (Left)", icon: Target },
  { id: "free_kick_right", label: "Free Kick (Right)", icon: Target },
  { id: "throw_in", label: "Throw In", icon: ArrowRight },
  { id: "penalty", label: "Penalty Kick", icon: Crosshair },
  { id: "goal_kick", label: "Goal Kick", icon: Target },
];

interface Player {
  id: number;
  x: number;
  y: number;
  number: number;
  isOpponent: boolean;
  movements: { x: number; y: number; delay: number }[];
}

interface SetPiece {
  id: number;
  name: string;
  type: string;
  players: Player[];
  ballPath: { x: number; y: number }[];
  notes: string;
}

export default function SetPieceDesigner() {
  const { user } = useAuth();
  const pitchRef = useRef<HTMLDivElement>(null);
  
  // State
  const { t, language } = useLanguage();
  const [setPieceType, setSetPieceType] = useState("corner_left");
  const [setPieceName, setSetPieceName] = useState("");
  const [notes, setNotes] = useState("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [ballPath, setBallPath] = useState<{ x: number; y: number }[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [activeMode, setActiveMode] = useState<"move" | "path" | "ball">("move");
  const [isDragging, setIsDragging] = useState(false);

  // Initialize with default positions based on set piece type
  useEffect(() => {
    initializeSetPiece(setPieceType);
  }, [setPieceType]);

  const initializeSetPiece = (type: string) => {
    let initialPlayers: Player[] = [];
    let initialBallPath: { x: number; y: number }[] = [];

    if (type === "corner_left") {
      // Ball position at left corner
      initialBallPath = [{ x: 2, y: 2 }];
      // Attacking players in the box
      initialPlayers = [
        { id: 1, x: 2, y: 2, number: 7, isOpponent: false, movements: [] }, // Corner taker
        { id: 2, x: 35, y: 15, number: 9, isOpponent: false, movements: [{ x: 45, y: 10, delay: 0 }] },
        { id: 3, x: 40, y: 20, number: 11, isOpponent: false, movements: [{ x: 50, y: 12, delay: 0.2 }] },
        { id: 4, x: 55, y: 18, number: 10, isOpponent: false, movements: [{ x: 55, y: 8, delay: 0.1 }] },
        { id: 5, x: 60, y: 22, number: 8, isOpponent: false, movements: [{ x: 58, y: 15, delay: 0.3 }] },
        { id: 6, x: 65, y: 15, number: 4, isOpponent: false, movements: [{ x: 62, y: 10, delay: 0.2 }] },
        // Defenders (react to corner - track attackers)
        { id: 7, x: 50, y: 8, number: 3, isOpponent: true, movements: [{ x: 48, y: 10, delay: 0.1 }, { x: 46, y: 9, delay: 0.3 }] },
        { id: 8, x: 45, y: 12, number: 5, isOpponent: true, movements: [{ x: 43, y: 11, delay: 0.15 }, { x: 44, y: 10, delay: 0.35 }] },
        { id: 9, x: 55, y: 10, number: 6, isOpponent: true, movements: [{ x: 54, y: 9, delay: 0.1 }, { x: 53, y: 8, delay: 0.25 }] },
        { id: 10, x: 50, y: 5, number: 1, isOpponent: true, movements: [{ x: 51, y: 6, delay: 0.2 }, { x: 50, y: 5, delay: 0.5 }] }, // GK
      ];
    } else if (type === "free_kick_central") {
      initialBallPath = [{ x: 50, y: 30 }];
      initialPlayers = [
        { id: 1, x: 50, y: 30, number: 10, isOpponent: false, movements: [] }, // Free kick taker
        { id: 2, x: 48, y: 30, number: 7, isOpponent: false, movements: [] }, // Decoy
        { id: 3, x: 40, y: 15, number: 9, isOpponent: false, movements: [{ x: 45, y: 8, delay: 0 }] },
        { id: 4, x: 55, y: 15, number: 11, isOpponent: false, movements: [{ x: 52, y: 8, delay: 0.1 }] },
        // Wall (jumps when ball is struck)
        { id: 5, x: 45, y: 22, number: 4, isOpponent: true, movements: [{ x: 45, y: 21, delay: 0.4 }, { x: 45, y: 22, delay: 0.6 }] },
        { id: 6, x: 48, y: 22, number: 5, isOpponent: true, movements: [{ x: 48, y: 21, delay: 0.4 }, { x: 48, y: 22, delay: 0.6 }] },
        { id: 7, x: 51, y: 22, number: 6, isOpponent: true, movements: [{ x: 51, y: 21, delay: 0.4 }, { x: 51, y: 22, delay: 0.6 }] },
        { id: 8, x: 54, y: 22, number: 8, isOpponent: true, movements: [{ x: 54, y: 21, delay: 0.4 }, { x: 54, y: 22, delay: 0.6 }] },
        { id: 9, x: 50, y: 5, number: 1, isOpponent: true, movements: [{ x: 52, y: 6, delay: 0.5 }, { x: 48, y: 6, delay: 0.8 }] }, // GK dives
      ];
    } else {
      // Default setup
      initialPlayers = [
        { id: 1, x: 50, y: 50, number: 10, isOpponent: false, movements: [] },
      ];
      initialBallPath = [{ x: 50, y: 50 }];
    }

    setPlayers(initialPlayers);
    setBallPath(initialBallPath);
    setAnimationProgress(0);
    setIsAnimating(false);
  };

  const handleMouseDown = (e: React.MouseEvent, playerId: number) => {
    if (activeMode === "move") {
      e.preventDefault();
      setSelectedPlayer(playerId);
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || selectedPlayer === null || !pitchRef.current) return;

    const rect = pitchRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.max(2, Math.min(98, x));
    const clampedY = Math.max(2, Math.min(98, y));

    setPlayers((prev) =>
      prev.map((p) =>
        p.id === selectedPlayer ? { ...p, x: clampedX, y: clampedY } : p
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setSelectedPlayer(null);
  };

  const handlePitchClick = (e: React.MouseEvent) => {
    if (!pitchRef.current) return;

    const rect = pitchRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeMode === "path" && selectedPlayer !== null) {
      // Add movement point for selected player
      setPlayers((prev) =>
        prev.map((p) =>
          p.id === selectedPlayer
            ? { ...p, movements: [...p.movements, { x, y, delay: p.movements.length * 0.2 }] }
            : p
        )
      );
    } else if (activeMode === "ball") {
      // Add ball path point
      setBallPath((prev) => [...prev, { x, y }]);
    }
  };

  const addPlayer = (isOpponent: boolean) => {
    const newPlayer: Player = {
      id: Date.now(),
      x: 50,
      y: 50,
      number: players.filter((p) => p.isOpponent === isOpponent).length + 1,
      isOpponent,
      movements: [],
    };
    setPlayers([...players, newPlayer]);
  };

  const removePlayer = (playerId: number) => {
    setPlayers(players.filter((p) => p.id !== playerId));
    if (selectedPlayer === playerId) {
      setSelectedPlayer(null);
    }
  };

  const clearMovements = () => {
    setPlayers((prev) => prev.map((p) => ({ ...p, movements: [] })));
    setBallPath(ballPath.slice(0, 1));
  };

  const playAnimation = () => {
    setIsAnimating(true);
    setAnimationProgress(0);

    const duration = 3000; // 3 seconds
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setAnimationProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  };

  const getAnimatedPosition = (player: Player) => {
    if (!isAnimating || player.movements.length === 0) {
      return { x: player.x, y: player.y };
    }

    // Find the current movement based on progress
    const totalMovements = player.movements.length;
    const currentIndex = Math.floor(animationProgress * totalMovements);
    const localProgress = (animationProgress * totalMovements) % 1;

    if (currentIndex >= totalMovements) {
      const lastMove = player.movements[totalMovements - 1];
      return { x: lastMove.x, y: lastMove.y };
    }

    const startPos = currentIndex === 0 ? { x: player.x, y: player.y } : player.movements[currentIndex - 1];
    const endPos = player.movements[currentIndex];

    return {
      x: startPos.x + (endPos.x - startPos.x) * localProgress,
      y: startPos.y + (endPos.y - startPos.y) * localProgress,
    };
  };

  const getAnimatedBallPosition = () => {
    if (!isAnimating || ballPath.length <= 1) {
      return ballPath[0] || { x: 50, y: 50 };
    }

    const totalPoints = ballPath.length - 1;
    const currentIndex = Math.floor(animationProgress * totalPoints);
    const localProgress = (animationProgress * totalPoints) % 1;

    if (currentIndex >= totalPoints) {
      return ballPath[totalPoints];
    }

    const startPos = ballPath[currentIndex];
    const endPos = ballPath[currentIndex + 1];

    return {
      x: startPos.x + (endPos.x - startPos.x) * localProgress,
      y: startPos.y + (endPos.y - startPos.y) * localProgress,
    };
  };

  return (
    <>
    <div >
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/advanced-tactical-hub">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <PageBreadcrumb
                  items={[
                    { label: "Tactical Hub", labelAr: "مركز التكتيك", href: "/advanced-tactical-hub" },
                    { label: "Set Piece Designer", labelAr: "مصمم الكرات الثابتة" },
                  ]}
                  className="mb-1 text-muted-foreground"
                />
                <h1 className="text-2xl font-bold text-foreground">Set Piece Designer</h1>
                <p className="text-muted-foreground text-sm">Create and animate set piece routines</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearMovements}
                className="border-border text-muted-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear Paths
              </Button>
              <Button
                size="sm"
                onClick={playAnimation}
                disabled={isAnimating}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {isAnimating ? "Playing..." : "Play Animation"}
              </Button>
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border text-foreground">
                  <DialogHeader>
                    <DialogTitle>Save Set Piece</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Name</label>
                      <Input
                        value={setPieceName}
                        onChange={(e) => setSetPieceName(e.target.value)}
                        placeholder="e.g., Near Post Corner"
                        className="bg-muted border-border text-foreground mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Notes</label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Key instructions for players..."
                        className="bg-muted border-border text-foreground mt-1"
                        rows={4}
                      />
                    </div>
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                      Save Set Piece
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Set Piece Type */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-lg">Set Piece Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Select value={setPieceType} onValueChange={setSetPieceType}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-muted border-border">
                    {SET_PIECE_TYPES.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tools */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-lg">Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant={activeMode === "move" ? "default" : "outline"}
                  className={`w-full justify-start ${activeMode === "move" ? "bg-emerald-600" : "border-border text-muted-foreground"}`}
                  onClick={() => setActiveMode("move")}
                >
                  <Move className="w-4 h-4 mr-2" />
                  Move Players
                </Button>
                <Button
                  variant={activeMode === "path" ? "default" : "outline"}
                  className={`w-full justify-start ${activeMode === "path" ? "bg-emerald-600" : "border-border text-muted-foreground"}`}
                  onClick={() => setActiveMode("path")}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Draw Player Path
                </Button>
                <Button
                  variant={activeMode === "ball" ? "default" : "outline"}
                  className={`w-full justify-start ${activeMode === "ball" ? "bg-emerald-600" : "border-border text-muted-foreground"}`}
                  onClick={() => setActiveMode("ball")}
                >
                  <Circle className="w-4 h-4 mr-2" />
                  Draw Ball Path
                </Button>
              </CardContent>
            </Card>

            {/* Players */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Players
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => addPlayer(false)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Team
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => addPlayer(true)}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Opponent
                  </Button>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer ${
                        selectedPlayer === player.id
                          ? "bg-emerald-600/30 border border-emerald-500"
                          : "bg-muted hover:bg-slate-600"
                      }`}
                      onClick={() => setSelectedPlayer(player.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            player.isOpponent ? "bg-red-500" : "bg-blue-500"
                          }`}
                        >
                          {player.number}
                        </div>
                        <span className="text-muted-foreground text-sm">
                          {player.isOpponent ? "Opponent" : "Team"} #{player.number}
                        </span>
                        {player.movements.length > 0 && (
                          <Badge variant="outline" className="text-xs border-emerald-500 text-emerald-700 dark:text-emerald-400">
                            {player.movements.length} moves
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePlayer(player.id);
                        }}
                        className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/20 h-6 w-6 p-0"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-lg">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Select "Move Players" to drag players</p>
                <p>• Select a player, then "Draw Path" to add movement points</p>
                <p>• Use "Draw Ball Path" to show ball trajectory</p>
                <p>• Click "Play Animation" to see the routine</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Pitch Area */}
          <div className="lg:col-span-3">
            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                <div
                  ref={pitchRef}
                  className="brand-gradient relative w-full aspect-[4/3] cursor-crosshair select-none"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onClick={handlePitchClick}
                >
                  {/* Pitch markings - Half pitch view */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 75"
                    preserveAspectRatio="none"
                  >
                    {/* Outer boundary */}
                    <rect
                      x="2"
                      y="2"
                      width="96"
                      height="71"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    {/* Goal line */}
                    <line
                      x1="2"
                      y1="2"
                      x2="98"
                      y2="2"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    {/* Penalty area */}
                    <rect
                      x="20"
                      y="2"
                      width="60"
                      height="20"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    {/* 6-yard box */}
                    <rect
                      x="35"
                      y="2"
                      width="30"
                      height="8"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    {/* Goal */}
                    <rect
                      x="42"
                      y="0"
                      width="16"
                      height="2"
                      fill="none"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth="0.4"
                    />
                    {/* Penalty spot */}
                    <circle cx="50" cy="15" r="0.5" fill="rgba(255,255,255,0.5)" />
                    {/* Penalty arc */}
                    <path
                      d="M 35 22 A 12 12 0 0 0 65 22"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    {/* Corner arcs */}
                    <path
                      d="M 2 5 A 3 3 0 0 0 5 2"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <path
                      d="M 95 2 A 3 3 0 0 0 98 5"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                  </svg>

                  {/* Ball path lines */}
                  {ballPath.length > 1 && (
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <polyline
                        points={ballPath.map((p) => `${p.x}%,${(p.y / 100) * 75}%`).join(" ")}
                        fill="none"
                        stroke="white"
                        strokeWidth="2"
                        strokeDasharray="5,5"
                        opacity="0.6"
                      />
                    </svg>
                  )}

                  {/* Player movement paths */}
                  {players.map((player) =>
                    player.movements.length > 0 ? (
                      <svg key={`path-${player.id}`} className="absolute inset-0 w-full h-full pointer-events-none">
                        <polyline
                          points={[
                            `${player.x}%,${(player.y / 100) * 75}%`,
                            ...player.movements.map((m) => `${m.x}%,${(m.y / 100) * 75}%`),
                          ].join(" ")}
                          fill="none"
                          stroke={player.isOpponent ? "#ef4444" : "#3b82f6"}
                          strokeWidth="2"
                          strokeDasharray="4,4"
                          opacity="0.5"
                        />
                      </svg>
                    ) : null
                  )}

                  {/* Ball */}
                  {(() => {
                    const ballPos = getAnimatedBallPosition();
                    return (
                      <div
                        className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-white shadow-lg border-2 border-border z-20"
                        style={{
                          left: `${ballPos.x}%`,
                          top: `${(ballPos.y / 100) * 75}%`,
                          transition: isAnimating ? "none" : "all 0.1s",
                        }}
                      />
                    );
                  })()}

                  {/* Players */}
                  {players.map((player) => {
                    const pos = getAnimatedPosition(player);
                    return (
                      <div
                        key={player.id}
                        className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center text-xs font-bold text-white cursor-grab active:cursor-grabbing shadow-lg z-10 ${
                          player.isOpponent ? "bg-red-500" : "bg-blue-500"
                        } ${selectedPlayer === player.id ? "ring-2 ring-white ring-offset-2 ring-offset-green-700" : ""}`}
                        style={{
                          left: `${pos.x}%`,
                          top: `${(pos.y / 100) * 75}%`,
                          transition: isAnimating ? "none" : "all 0.1s",
                        }}
                        onMouseDown={(e) => handleMouseDown(e, player.id)}
                      >
                        {player.number}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Animation Progress */}
            {isAnimating && (
              <Card className="bg-card border-border mt-4">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground text-sm">Animation Progress:</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${animationProgress * 100}%` }}
                      />
                    </div>
                    <span className="text-foreground text-sm">{Math.round(animationProgress * 100)}%</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
