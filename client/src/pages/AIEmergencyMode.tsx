import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  Zap, 
  Play, 
  Pause, 
  RotateCcw,
  RefreshCw,
  TrendingUp,
  Users,
  Target,
  Activity,
  Brain,
  Eye,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { AIBreadcrumb } from "@/components/AIBreadcrumb";
import { useLanguage } from '@/contexts/LanguageContext';


interface Player {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  number: number;
  role: string;
  color: string;
  team: 'home' | 'away';
  path?: Array<{x: number, y: number}>;
  instruction?: string;
}

interface TacticalPlan {
  tactic: string;
  successRate: number;
  description: string;
  formationChange: string;
  weaknessDetected: string;
  keyInstructions: string[];
  timing: string;
}

const FORMATIONS: Record<string, number[][]> = {
  // ── 11v11 formations ──────────────────────────────────────────────────────
  '4-4-2': [[50], [150, 150, 150, 150], [300, 300, 300, 300], [450, 450]],
  '4-3-3': [[50], [150, 150, 150, 150], [300, 300, 300], [450, 450, 450]],
  '3-5-2': [[50], [150, 150, 150], [280, 280, 280, 280, 280], [420, 420]],
  '3-4-3': [[50], [150, 150, 150], [280, 280, 280, 280], [420, 420, 420]],
  '4-2-3-1': [[50], [150, 150, 150, 150], [250, 250], [350, 350, 350], [450]],
  '4-2-2': [[50], [150, 150, 150, 150], [280, 280], [400, 400]],
  '3-4-1': [[50], [150, 150, 150], [280, 280, 280, 280], [400]],
  // ── 9v9 formations ────────────────────────────────────────────────────────
  '3-3-2 (9v9)': [[50], [150, 150, 150], [280, 280, 280], [400, 400]],
  '2-3-3 (9v9)': [[50], [150, 150], [280, 280, 280], [400, 400, 400]],
  '3-2-3 (9v9)': [[50], [150, 150, 150], [280, 280], [400, 400, 400]],
  '2-4-2 (9v9)': [[50], [150, 150], [280, 280, 280, 280], [400, 400]],
  '4-3-1 (9v9)': [[50], [150, 150, 150, 150], [280, 280, 280], [400]],
  // ── 7v7 formations ────────────────────────────────────────────────────────
  '2-3-1 (7v7)': [[50], [160, 160], [290, 290, 290], [420]],
  '3-2-1 (7v7)': [[50], [160, 160, 160], [290, 290], [420]],
  '2-2-2 (7v7)': [[50], [160, 160], [290, 290], [420, 420]],
  '1-3-2 (7v7)': [[50], [160], [290, 290, 290], [420, 420]],
  '3-1-2 (7v7)': [[50], [160, 160, 160], [290], [420, 420]],
};

const OPPONENT_FORMATIONS: Record<string, number[][]> = {
  // ── 11v11 opponent formations ──────────────────────────────────────────────────────
  '4-4-2': [[850], [750, 750, 750, 750], [600, 600, 600, 600], [500, 500]],
  '4-4-1': [[850], [750, 750, 750, 750], [600, 600, 600, 600], [500]],
  '4-3-3': [[850], [750, 750, 750, 750], [620, 620, 620], [500, 500, 500]],
  '4-5-1': [[850], [750, 750, 750, 750], [600, 600, 600, 600, 600], [480]],
  '5-4-1': [[850], [750, 750, 750, 750, 750], [600, 600, 600, 600], [480]],
  '5-3-2': [[850], [750, 750, 750, 750, 750], [620, 620, 620], [500, 500]],
  '3-5-2': [[850], [750, 750, 750], [620, 620, 620, 620, 620], [500, 500]],
  // ── 9v9 opponent formations ──────────────────────────────────────────────────────
  '3-3-2 (9v9)': [[850], [750, 750, 750], [600, 600, 600], [480, 480]],
  '2-3-3 (9v9)': [[850], [750, 750], [600, 600, 600], [480, 480, 480]],
  '3-2-3 (9v9)': [[850], [750, 750, 750], [600, 600], [480, 480, 480]],
  '2-4-2 (9v9)': [[850], [750, 750], [600, 600, 600, 600], [480, 480]],
  // ── 7v7 opponent formations ──────────────────────────────────────────────────────
  '2-3-1 (7v7)': [[850], [760, 760], [620, 620, 620], [500]],
  '3-2-1 (7v7)': [[850], [760, 760, 760], [620, 620], [500]],
  '2-2-2 (7v7)': [[850], [760, 760], [620, 620], [500, 500]],
  '1-3-2 (7v7)': [[850], [760], [620, 620, 620], [500, 500]],
};

export default function AIEmergencyMode() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t, language } = useLanguage();
  const [matchMinute, setMatchMinute] = useState('70');
  const [currentScore, setCurrentScore] = useState('0-1');
  const [playerCount, setPlayerCount] = useState('11');
  const [currentFormation, setCurrentFormation] = useState('4-3-3');
  const [opponentFormation, setOpponentFormation] = useState('4-4-1');
  
  const [opponentPlayerCount, setOpponentPlayerCount] = useState('11');
  const [opponentTeamInfo, setOpponentTeamInfo] = useState('');
  const [, navigate] = useLocation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tacticalPlan, setTacticalPlan] = useState<TacticalPlan | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [opponentPlayers, setOpponentPlayers] = useState<Player[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [frame, setFrame] = useState(0);
  const frameRef = useRef(0);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showGhosting, setShowGhosting] = useState(true);
  const [showPaths, setShowPaths] = useState(true);
  
  // Landscape pitch dimensions
  const PITCH_WIDTH = 900;
  const PITCH_HEIGHT = 600;
  const PLAYER_RADIUS = 18;

  // Was pointed at suggestFormation, whose input/output are a different shape —
  // generateEmergencyPlan is the procedure this screen is actually built around.
  const generateEmergencyPlan = trpc.tactical.generateEmergencyPlan.useMutation();
  const suggestFormationMutation = trpc.tactical.suggestFormation.useMutation();
  const [formationSuggestion, setFormationSuggestion] = useState<any>(null);
  const [isSuggestingFormation, setIsSuggestingFormation] = useState(false);
  const [ourSquadStrengths, setOurSquadStrengths] = useState('');

  const handleSuggestFormation = async () => {
    setIsSuggestingFormation(true);
    try {
      const result = await suggestFormationMutation.mutateAsync({
        ourFormation: currentFormation,
        ourSquadStrengths: ourSquadStrengths || undefined,
        opponentFormation,
        opponentPlayerCount: parseInt(opponentPlayerCount),
        opponentTeamInfo: opponentTeamInfo || undefined,
      });
      setFormationSuggestion(result);
      // Auto-apply suggested formation
      setCurrentFormation(result.suggestedFormation);
      toast.success(`AI suggests ${result.suggestedFormation} formation (${result.confidenceScore}% confidence)`);
    } catch (error) {
      console.error('Failed to suggest formation:', error);
      toast.error('Failed to get formation suggestion');
    } finally {
      setIsSuggestingFormation(false);
    }
  };

  // Get Y positions for a line of players
  const getYPositions = (count: number, pitchHeight: number): number[] => {
    const margin = 80;
    const availableHeight = pitchHeight - (margin * 2);
    const positions: number[] = [];
    
    if (count === 1) {
      return [pitchHeight / 2];
    }
    
    const spacing = availableHeight / (count - 1);
    for (let i = 0; i < count; i++) {
      positions.push(margin + (spacing * i));
    }
    return positions;
  };

  // Initialize YOUR team players (blue, left side, attacking right)
  const initializeHomePlayers = (formation: string, count: number): Player[] => {
    const playerPositions: Player[] = [];
    
    // Parse formation string to get line counts
    const formationKey = formation in FORMATIONS ? formation : '4-3-3';
    const lines = formationKey.split('-').map(n => parseInt(n));
    
    // X positions for each line (GK, DEF, MID, ATT)
    const xPositions = [60, 160, 320, 480];
    
    let playerId = 1;
    
    // Add goalkeeper
    playerPositions.push({
      id: playerId++,
      x: xPositions[0],
      y: PITCH_HEIGHT / 2,
      targetX: xPositions[0],
      targetY: PITCH_HEIGHT / 2,
      number: 1,
      role: 'GK',
      color: '#22c55e', // Green for GK
      team: 'home',
      path: []
    });
    
    // Add outfield players based on formation
    lines.forEach((lineCount, lineIndex) => {
      const xPos = xPositions[lineIndex + 1] || xPositions[xPositions.length - 1];
      const yPositions = getYPositions(lineCount, PITCH_HEIGHT);
      const role = lineIndex === 0 ? 'DEF' : lineIndex === lines.length - 1 ? 'ATT' : 'MID';
      
      yPositions.forEach((yPos, idx) => {
        if (playerId <= count) {
          playerPositions.push({
            id: playerId,
            x: xPos,
            y: yPos,
            targetX: xPos,
            targetY: yPos,
            number: playerId,
            role,
            color: '#3b82f6', // Blue for your team
            team: 'home',
            path: []
          });
          playerId++;
        }
      });
    });
    
    return playerPositions;
  };

  // Initialize OPPONENT players (red, right side) - respects opponentPlayerCount
  const initializeOpponentPlayers = (formation: string, count: number = 11): Player[] => {
    const playerPositions: Player[] = [];
    
    const formationKey = formation in OPPONENT_FORMATIONS ? formation : '4-4-1';
    const lines = formationKey.split('-').map(n => parseInt(n));
    
    // X positions for opponent (mirrored - GK on right)
    const xPositions = [840, 740, 580, 420];
    
    let playerId = 1;
    
    // Add goalkeeper
    playerPositions.push({
      id: playerId++,
      x: xPositions[0],
      y: PITCH_HEIGHT / 2,
      targetX: xPositions[0],
      targetY: PITCH_HEIGHT / 2,
      number: 1,
      role: 'GK',
      color: '#dc2626', // Red for opponent GK
      team: 'away',
      path: []
    });
    
    // Add outfield players, capped by count
    lines.forEach((lineCount, lineIndex) => {
      const xPos = xPositions[lineIndex + 1] || xPositions[xPositions.length - 1];
      const yPositions = getYPositions(lineCount, PITCH_HEIGHT);
      const role = lineIndex === 0 ? 'DEF' : lineIndex === lines.length - 1 ? 'ATT' : 'MID';
      
      yPositions.forEach((yPos) => {
        if (playerId <= count) {
          playerPositions.push({
            id: playerId,
            x: xPos,
            y: yPos,
            targetX: xPos,
            targetY: yPos,
            number: playerId,
            role,
            color: '#ef4444', // Red for opponent
            team: 'away',
            path: []
          });
          playerId++;
        }
      });
    });
    
    return playerPositions;
  };

  // Initialize players on component mount and when formations/counts change
  useEffect(() => {
    const homePlayers = initializeHomePlayers(currentFormation, parseInt(playerCount));
    const awayPlayers = initializeOpponentPlayers(opponentFormation, parseInt(opponentPlayerCount));
    setPlayers(homePlayers);
    setOpponentPlayers(awayPlayers);
  }, [currentFormation, opponentFormation, playerCount, opponentPlayerCount]);

  const handleGeneratePlan = async () => {
    setIsAnalyzing(true);
    
    try {
      const result = await generateEmergencyPlan.mutateAsync({
        matchMinute: parseInt(matchMinute),
        currentScore,
        playerCount: parseInt(playerCount),
        opponentPlayerCount: parseInt(opponentPlayerCount),
        currentFormation,
        opponentFormation,
        opponentTeamInfo: opponentTeamInfo || undefined
      });
      
      setTacticalPlan(result);
      
      // Update players with new formation from AI
      const newPlayers = initializeHomePlayers(result.formationChange || currentFormation, parseInt(playerCount));
      setPlayers(newPlayers);
      
      // Generate tactical paths for attacking players
      // generateTacticalPaths(newPlayers, planResult);
      
      toast.success('Emergency plan generated!');
    } catch (error) {
      console.error('Failed to generate plan:', error);
      toast.error('Failed to generate emergency plan');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateTacticalPaths = (playerList: Player[], plan: TacticalPlan) => {
    const updatedPlayers = playerList.map(player => {
      if (player.role === 'ATT') {
        // Attacking runs towards goal (moving right)
        const targetX = Math.min(player.x + 200, 750);
        const targetY = player.y + (Math.random() - 0.5) * 100;
        return {
          ...player,
          path: [
            { x: player.x, y: player.y },
            { x: player.x + 100, y: player.y + (targetY - player.y) * 0.5 },
            { x: targetX, y: Math.max(80, Math.min(520, targetY)) }
          ],
          targetX,
          targetY: Math.max(80, Math.min(520, targetY)),
          instruction: 'Diagonal Run - Attack Space'
        };
      } else if (player.role === 'MID') {
        // Midfielders support the attack
        const targetX = player.x + 80;
        return {
          ...player,
          path: [
            { x: player.x, y: player.y },
            { x: targetX, y: player.y }
          ],
          targetX,
          targetY: player.y,
          instruction: 'Support Run'
        };
      }
      return player;
    });
    
    setPlayers(updatedPlayers);
  };

  // Draw professional football pitch (landscape orientation)
  const drawPitch = (ctx: CanvasRenderingContext2D) => {
    // Grass background with stripes
    ctx.fillStyle = '#2d5a1d';
    ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);
    
    // Alternating grass stripes
    ctx.fillStyle = '#326b22';
    for (let i = 0; i < 12; i += 2) {
      ctx.fillRect(i * (PITCH_WIDTH / 12), 0, PITCH_WIDTH / 12, PITCH_HEIGHT);
    }

    // Pitch outline
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, PITCH_WIDTH - 60, PITCH_HEIGHT - 60);
    
    // Center line (vertical)
    ctx.beginPath();
    ctx.moveTo(PITCH_WIDTH / 2, 30);
    ctx.lineTo(PITCH_WIDTH / 2, PITCH_HEIGHT - 30);
    ctx.stroke();
    
    // Center circle
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH / 2, PITCH_HEIGHT / 2, 70, 0, Math.PI * 2);
    ctx.stroke();
    
    // Center spot
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH / 2, PITCH_HEIGHT / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    
    // LEFT penalty area (your goal)
    ctx.strokeRect(30, 150, 120, 300);
    // Left goal area
    ctx.strokeRect(30, 220, 50, 160);
    // Left penalty spot
    ctx.beginPath();
    ctx.arc(120, PITCH_HEIGHT / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    // Left goal
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(20, 250, 10, 100);
    
    // RIGHT penalty area (opponent goal - target)
    ctx.strokeRect(PITCH_WIDTH - 150, 150, 120, 300);
    // Right goal area
    ctx.strokeRect(PITCH_WIDTH - 80, 220, 50, 160);
    // Right penalty spot
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH - 120, PITCH_HEIGHT / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    // Right goal (TARGET)
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(PITCH_WIDTH - 30, 250, 10, 100);
    
    // Corner arcs
    ctx.beginPath();
    ctx.arc(30, 30, 15, 0, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH - 30, 30, 15, Math.PI / 2, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(30, PITCH_HEIGHT - 30, 15, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH - 30, PITCH_HEIGHT - 30, 15, Math.PI, Math.PI * 1.5);
    ctx.stroke();
    
    // Direction arrow (attacking right)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(PITCH_WIDTH - 100, 25);
    ctx.lineTo(PITCH_WIDTH - 60, 15);
    ctx.lineTo(PITCH_WIDTH - 60, 10);
    ctx.lineTo(PITCH_WIDTH - 40, 20);
    ctx.lineTo(PITCH_WIDTH - 60, 30);
    ctx.lineTo(PITCH_WIDTH - 60, 25);
    ctx.lineTo(PITCH_WIDTH - 100, 25);
    ctx.fill();
    
    // Labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOUR TEAM →', 200, 20);
    ctx.fillText('← OPPONENT', PITCH_WIDTH - 200, 20);
  };

  const drawHeatmap = (ctx: CanvasRenderingContext2D) => {
    if (!showHeatmap || !tacticalPlan) return;
    
    // Draw pressure zones based on tactical analysis
    const zones = [
      { x: 700, y: 200, radius: 100, intensity: 0.6, label: 'WEAK ZONE', color: 'green' },
      { x: 680, y: 400, radius: 90, intensity: 0.5, label: 'TARGET', color: 'yellow' },
      { x: 400, y: 300, radius: 70, intensity: 0.3, label: 'CONTROL', color: 'blue' }
    ];
    
    zones.forEach(zone => {
      const gradient = ctx.createRadialGradient(zone.x, zone.y, 0, zone.x, zone.y, zone.radius);
      
      if (zone.color === 'green') {
        gradient.addColorStop(0, `rgba(34, 197, 94, ${zone.intensity})`);
        gradient.addColorStop(1, 'rgba(34, 197, 94, 0)');
      } else if (zone.color === 'yellow') {
        gradient.addColorStop(0, `rgba(234, 179, 8, ${zone.intensity})`);
        gradient.addColorStop(1, 'rgba(234, 179, 8, 0)');
      } else {
        gradient.addColorStop(0, `rgba(59, 130, 246, ${zone.intensity})`);
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
      }
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.radius, 0, Math.PI * 2);
      ctx.fill();
      
      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(zone.label, zone.x, zone.y);
    });
  };

  const drawGhostPlayers = (ctx: CanvasRenderingContext2D) => {
    if (!showGhosting) return;
    
    players.forEach(player => {
      if (player.path && player.path.length > 1) {
        const lastPos = player.path[player.path.length - 1];
        
        // Ghost player at target position
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        
        ctx.beginPath();
        ctx.arc(lastPos.x, lastPos.y, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.setLineDash([]);
      }
    });
  };

  const drawPlayerPaths = (ctx: CanvasRenderingContext2D) => {
    if (!showPaths) return;
    
    players.forEach(player => {
      if (player.path && player.path.length > 1) {
        ctx.strokeStyle = player.role === 'ATT' ? '#fbbf24' : '#60a5fa';
        ctx.lineWidth = 3;
        ctx.setLineDash([]);
        
        // Draw path
        ctx.beginPath();
        ctx.moveTo(player.path[0].x, player.path[0].y);
        
        for (let i = 1; i < player.path.length; i++) {
          ctx.lineTo(player.path[i].x, player.path[i].y);
        }
        ctx.stroke();
        
        // Draw arrowhead
        if (player.path.length >= 2) {
          const lastIdx = player.path.length - 1;
          const p1 = player.path[lastIdx - 1];
          const p2 = player.path[lastIdx];
          const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
          
          ctx.fillStyle = player.role === 'ATT' ? '#fbbf24' : '#60a5fa';
          ctx.beginPath();
          ctx.moveTo(p2.x, p2.y);
          ctx.lineTo(p2.x - 15 * Math.cos(angle - Math.PI / 6), p2.y - 15 * Math.sin(angle - Math.PI / 6));
          ctx.lineTo(p2.x - 15 * Math.cos(angle + Math.PI / 6), p2.y - 15 * Math.sin(angle + Math.PI / 6));
          ctx.closePath();
          ctx.fill();
        }
      }
    });
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
    // Player circle with shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.number.toString(), player.x, player.y);
  };

  const handleReset = () => {
    setIsSimulating(false);
    setFrame(0);
    frameRef.current = 0;
    const homePlayers = initializeHomePlayers(currentFormation, parseInt(playerCount));
    const awayPlayers = initializeOpponentPlayers(opponentFormation);
    setPlayers(homePlayers);
    setOpponentPlayers(awayPlayers);
    setTacticalPlan(null);
  };

  // Animation loop - fixed stale closure by using ref for frame counter
  useEffect(() => {
    if (!isSimulating) return;
    
    const interval = setInterval(() => {
      frameRef.current += 1;
      const currentFrame = frameRef.current;
      setFrame(currentFrame);
      
      // Stop simulation after full cycle (120 frames = ~6 seconds)
      if (currentFrame >= 120) {
        setIsSimulating(false);
        frameRef.current = 0;
        return;
      }
      
      setPlayers(prevPlayers => 
        prevPlayers.map(player => {
          if (player.path && player.path.length > 1) {
            const progress = Math.min(currentFrame / 100, 1);
            const pathIndex = Math.floor(progress * (player.path.length - 1));
            const nextIndex = Math.min(pathIndex + 1, player.path.length - 1);
            const localProgress = (progress * (player.path.length - 1)) - pathIndex;
            
            const currentPos = player.path[pathIndex];
            const nextPos = player.path[nextIndex];
            
            return {
              ...player,
              x: currentPos.x + (nextPos.x - currentPos.x) * localProgress,
              y: currentPos.y + (nextPos.y - currentPos.y) * localProgress
            };
          }
          // Players without paths do a subtle idle bob
          return player;
        })
      );
    }, 50);
    
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);
    
    // Draw pitch
    drawPitch(ctx);
    
    // Draw heatmap
    drawHeatmap(ctx);
    
    // Draw ghost players
    drawGhostPlayers(ctx);
    
    // Draw paths
    drawPlayerPaths(ctx);
    
    // Draw opponent players
    opponentPlayers.forEach(player => drawPlayer(ctx, player));
    
    // Draw your team players
    players.forEach(player => drawPlayer(ctx, player));
    
  }, [players, opponentPlayers, showHeatmap, showGhosting, showPaths, tacticalPlan]);

  return (
    <>
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <AIBreadcrumb toolLabel="AI Emergency Mode" />
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">AI Emergency Mode</h1>
              <p className="text-muted-foreground">Real-time tactical adjustments when you need to change the game</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <Card className="bg-card/50 border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Match Situation
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                Enter current match details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Minute</Label>
                  <Input
                    type="number"
                    value={matchMinute}
                    onChange={(e) => setMatchMinute(e.target.value)}
                    className="bg-muted border-border text-foreground"
                    min="1"
                    max="90"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground">Score</Label>
                  <Input
                    value={currentScore}
                    onChange={(e) => setCurrentScore(e.target.value)}
                    className="bg-muted border-border text-foreground"
                    placeholder="0-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Your Players</Label>
                <Select value={playerCount} onValueChange={setPlayerCount}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[7, 8, 9, 10, 11].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} players</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-muted-foreground">Your Formation</Label>
                <Select value={currentFormation} onValueChange={setCurrentFormation}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(FORMATIONS).map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-muted-foreground">Opponent Formation</Label>
                <Select value={opponentFormation} onValueChange={setOpponentFormation}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(OPPONENT_FORMATIONS).map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-muted-foreground">Opponent Players</Label>
                <Select value={opponentPlayerCount} onValueChange={setOpponentPlayerCount}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[7, 8, 9, 10, 11].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n} players{n < 11 ? ' (reduced)' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-muted-foreground">Opponent Scouting Notes (optional)</Label>
                <textarea
                  value={opponentTeamInfo}
                  onChange={(e) => setOpponentTeamInfo(e.target.value)}
                  className="w-full bg-muted border border-border text-foreground rounded-md p-2 text-sm resize-none"
                  rows={3}
                  placeholder="e.g. Slow right back, strong aerial team, press high..."
                />
              </div>

              <div>
                <Label className="text-muted-foreground">Our Squad Strengths (optional)</Label>
                <Input
                  value={ourSquadStrengths}
                  onChange={(e) => setOurSquadStrengths(e.target.value)}
                  className="bg-muted border-border text-foreground"
                  placeholder="e.g. Fast wingers, strong in the air, good pressing..."
                />
              </div>
              <Button
                onClick={handleSuggestFormation}
                disabled={isSuggestingFormation}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSuggestingFormation ? (
                  <><Brain className="w-4 h-4 mr-2 animate-pulse" />Analyzing Opponent...</>
                ) : (
                  <><Target className="w-4 h-4 mr-2" />AI Suggest Formation vs Opponent</>
                )}
              </Button>
              {formationSuggestion && (
                <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 dark:text-blue-300 font-semibold text-sm">AI Formation Suggestion</span>
                    <Badge className="bg-blue-600 text-white">{formationSuggestion.confidenceScore}% confidence</Badge>
                  </div>
                  <div className="text-foreground font-bold text-lg">{formationSuggestion.suggestedFormation}</div>
                  <div className="text-muted-foreground text-xs">{formationSuggestion.tacticalApproach}</div>
                  <div className="text-muted-foreground text-xs">{formationSuggestion.rationale}</div>
                  {formationSuggestion.opponentWeaknesses?.length > 0 && (
                    <div>
                      <div className="text-red-600 dark:text-red-400 text-xs font-semibold mb-1">Opponent Weaknesses:</div>
                      {formationSuggestion.opponentWeaknesses.map((w: string, i: number) => (
                        <div key={i} className="text-muted-foreground text-xs">• {w}</div>
                      ))}
                    </div>
                  )}
                  {formationSuggestion.setPieceStrategy && (
                    <div className="bg-yellow-900/20 border border-yellow-500/20 rounded p-2">
                      <div className="text-yellow-700 dark:text-yellow-400 text-xs font-semibold">Set Piece Strategy:</div>
                      <div className="text-muted-foreground text-xs">{formationSuggestion.setPieceStrategy}</div>
                    </div>
                  )}
                </div>
              )}
              <Button 
                onClick={handleGeneratePlan}
                disabled={isAnalyzing}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {isAnalyzing ? (
                  <>
                    <Brain className="w-4 h-4 mr-2 animate-pulse" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Emergency Plan
                  </>
                )}
              </Button>

              {/* Visualization Controls */}
              {tacticalPlan && (
                <div className="pt-4 border-t border-border space-y-2">
                  <Label className="text-sm font-semibold text-muted-foreground">Visualization</Label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={showHeatmap}
                        onChange={(e) => setShowHeatmap(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Heatmap Overlays</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={showGhosting}
                        onChange={(e) => setShowGhosting(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Ghost Players</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={showPaths}
                        onChange={(e) => setShowPaths(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Movement Paths</span>
                    </label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Canvas Panel */}
          <Card className="lg:col-span-2 bg-card/50 border-border">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-foreground flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Tactical Board
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Blue = Your Team (attacking →) | Red = Opponent
                  </CardDescription>
                </div>
                
                {tacticalPlan && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (!isSimulating) {
                          frameRef.current = 0;
                          setFrame(0);
                        }
                        setIsSimulating(!isSimulating);
                      }}
                      className="border-border text-muted-foreground hover:bg-muted"
                    >
                      {isSimulating ? (
                        <>
                          <Pause className="w-4 h-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          {frame > 0 && !isSimulating ? 'Replay' : 'Play'}
                        </>
                      )}
                    </Button>
                    {frame > 0 && !isSimulating && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          frameRef.current = 0;
                          setFrame(0);
                          // Re-generate paths from current tactical plan
                          if (tacticalPlan) {
                            const newPlayers = initializeHomePlayers(currentFormation, parseInt(playerCount));
                            generateTacticalPaths(newPlayers, tacticalPlan);
                          }
                          setTimeout(() => setIsSimulating(true), 100);
                        }}
                        className="border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-900/30"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Replay
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleReset}
                      className="border-border text-muted-foreground hover:bg-muted"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={PITCH_WIDTH}
                  height={PITCH_HEIGHT}
                  className="w-full border-2 border-border rounded-lg"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>

              {/* Legend */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span>Your Team</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <span>Opponent</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Weak Zone</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Target Area</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tactical Plan Output */}
        {tacticalPlan && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="bg-card/50 border-border border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Recommended Tactic
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {tacticalPlan.tactic}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {tacticalPlan.description}
                  </p>
                  <Badge variant="outline" className="mt-2 border-border text-muted-foreground">
                    {tacticalPlan.formationChange}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border border-l-4 border-l-yellow-500">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Gap Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-700 dark:text-yellow-500 mt-1" />
                    <p className="text-sm text-muted-foreground">
                      {tacticalPlan.weaknessDetected}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-border border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-green-700 dark:text-green-400">
                    {tacticalPlan.successRate}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Probability of reaching penalty area
                  </p>
                  <div className="text-sm font-medium text-orange-700 dark:text-orange-400 mt-2">
                    ⏱️ {tacticalPlan.timing}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3 bg-card/50 border-border border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-lg text-foreground flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Key Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tacticalPlan.keyInstructions.map((instruction, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                      <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-sm text-muted-foreground">{instruction}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
