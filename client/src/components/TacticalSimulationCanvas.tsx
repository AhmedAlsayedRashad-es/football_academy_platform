import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Play, Pause, RotateCcw, Download } from 'lucide-react';

interface Player {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  color: string;
  number: number;
  role: string;
}

interface TacticalSimulationCanvasProps {
  teamFormation: string;
  opponentFormation: string;
  tactic: string;
  onExportVideo?: () => void;
}

export default function TacticalSimulationCanvas({
  teamFormation,
  opponentFormation,
  tactic,
  onExportVideo
}: TacticalSimulationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frame, setFrame] = useState(0);
  const animationRef = useRef<number | undefined>(undefined);
  
  const PITCH_WIDTH = 800;
  const PITCH_HEIGHT = 600;
  const PLAYER_RADIUS = 12;

  // Initialize players based on formations
  const initializePlayers = () => {
    const players: Player[] = [];
    
    // Your team (blue) - 4-3-3 formation
    const yourTeamPositions = [
      { x: 100, y: 300, role: 'GK' },  // Goalkeeper
      { x: 200, y: 150, role: 'LB' },  // Left Back
      { x: 200, y: 250, role: 'CB' },  // Center Back 1
      { x: 200, y: 350, role: 'CB' },  // Center Back 2
      { x: 200, y: 450, role: 'RB' },  // Right Back
      { x: 350, y: 200, role: 'CM' },  // Central Midfielder 1
      { x: 350, y: 300, role: 'CM' },  // Central Midfielder 2
      { x: 350, y: 400, role: 'CM' },  // Central Midfielder 3
      { x: 550, y: 150, role: 'LW' },  // Left Winger
      { x: 550, y: 300, role: 'ST' },  // Striker
      { x: 550, y: 450, role: 'RW' }   // Right Winger
    ];

    yourTeamPositions.forEach((pos, i) => {
      players.push({
        id: i,
        x: pos.x,
        y: pos.y,
        targetX: pos.x,
        targetY: pos.y,
        color: '#3b82f6',
        number: i + 1,
        role: pos.role
      });
    });

    // Opponent team (red) - 4-4-2 formation
    const opponentPositions = [
      { x: 700, y: 300, role: 'GK' },
      { x: 600, y: 150, role: 'LB' },
      { x: 600, y: 250, role: 'CB' },
      { x: 600, y: 350, role: 'CB' },
      { x: 600, y: 450, role: 'RB' },
      { x: 450, y: 150, role: 'LM' },
      { x: 450, y: 250, role: 'CM' },
      { x: 450, y: 350, role: 'CM' },
      { x: 450, y: 450, role: 'RM' },
      { x: 250, y: 250, role: 'ST' },
      { x: 250, y: 350, role: 'ST' }
    ];

    opponentPositions.forEach((pos, i) => {
      players.push({
        id: i + 11,
        x: pos.x,
        y: pos.y,
        targetX: pos.x,
        targetY: pos.y,
        color: '#ef4444',
        number: i + 1,
        role: pos.role
      });
    });

    return players;
  };

  const [players, setPlayers] = useState<Player[]>([]);

  // Initialize players on mount
  useEffect(() => {
    setPlayers(initializePlayers());
  }, []);

  // Animation sequence for "Wide Attack with Pace" tactic
  const animateTactic = (frameNum: number) => {
    const newPlayers = [...players];
    const phase = Math.floor(frameNum / 60) % 4; // 4 phases, 60 frames each

    switch (phase) {
      case 0: // Phase 1: Fullbacks push high
        // Left Back pushes forward
        newPlayers[1].targetX = 350;
        newPlayers[1].targetY = 100;
        // Right Back pushes forward
        newPlayers[4].targetX = 350;
        newPlayers[4].targetY = 500;
        // Wingers stay wide
        newPlayers[8].targetX = 650;
        newPlayers[8].targetY = 100;
        newPlayers[10].targetX = 650;
        newPlayers[10].targetY = 500;
        break;

      case 1: // Phase 2: Ball to winger
        // Midfielder moves to pass
        newPlayers[6].targetX = 400;
        newPlayers[6].targetY = 300;
        // Right Winger receives
        newPlayers[10].targetX = 600;
        newPlayers[10].targetY = 450;
        // Opponent fullback tries to close down
        newPlayers[11].targetX = 550;
        newPlayers[11].targetY = 450;
        break;

      case 2: // Phase 3: 1v1 situation
        // Winger attacks fullback
        newPlayers[10].targetX = 650;
        newPlayers[10].targetY = 400;
        // Fullback pushed high creates 2v1
        newPlayers[4].targetX = 600;
        newPlayers[4].targetY = 500;
        // Striker makes run to far post
        newPlayers[9].targetX = 700;
        newPlayers[9].targetY = 250;
        break;

      case 3: // Phase 4: Cross and finish
        // YOUR TEAM - Winger crosses
        newPlayers[10].targetX = 700;
        newPlayers[10].targetY = 450;
        // Striker at far post
        newPlayers[9].targetX = 720;
        newPlayers[9].targetY = 280;
        // Left winger also arrives
        newPlayers[8].targetX = 680;
        newPlayers[8].targetY = 320;
        // Midfielder arrives late
        newPlayers[6].targetX = 650;
        newPlayers[6].targetY = 300;
        
        // OPPONENT TEAM - Desperate defense
        newPlayers[11].targetX = 700; // GK stays in goal
        newPlayers[11].targetY = 300;
        newPlayers[13].targetX = 700; // CBs in the box
        newPlayers[13].targetY = 280;
        newPlayers[14].targetX = 700;
        newPlayers[14].targetY = 320;
        newPlayers[15].targetX = 680; // RB tracks winger
        newPlayers[15].targetY = 400;
        newPlayers[16].targetX = 620; // Midfielders drop deep
        newPlayers[16].targetY = 250;
        newPlayers[17].targetX = 620;
        newPlayers[17].targetY = 350;
        break;
    }

    // Smooth movement towards target
    newPlayers.forEach(player => {
      player.x += (player.targetX - player.x) * 0.05;
      player.y += (player.targetY - player.y) * 0.05;
    });

    setPlayers(newPlayers);
  };

  // Draw function
  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    // Draw pitch
    drawPitch(ctx);

    // Draw passing lanes (if in certain phases)
    if (frame > 60 && frame < 180) {
      drawPassingLanes(ctx);
    }

    // Draw players
    players.forEach(player => {
      drawPlayer(ctx, player);
    });

    // Draw tactical annotations
    drawAnnotations(ctx);
  };

  const drawPitch = (ctx: CanvasRenderingContext2D) => {
    // Grass background
    const gradient = ctx.createLinearGradient(0, 0, 0, PITCH_HEIGHT);
    gradient.addColorStop(0, '#2d5016');
    gradient.addColorStop(1, '#1a3d0a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, PITCH_WIDTH, PITCH_HEIGHT);

    // Pitch lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(50, 50, PITCH_WIDTH - 100, PITCH_HEIGHT - 100);

    // Center line
    ctx.beginPath();
    ctx.moveTo(PITCH_WIDTH / 2, 50);
    ctx.lineTo(PITCH_WIDTH / 2, PITCH_HEIGHT - 50);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(PITCH_WIDTH / 2, PITCH_HEIGHT / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty areas
    ctx.strokeRect(50, 180, 100, 240);
    ctx.strokeRect(PITCH_WIDTH - 150, 180, 100, 240);

    // Goal areas
    ctx.strokeRect(50, 240, 40, 120);
    ctx.strokeRect(PITCH_WIDTH - 90, 240, 40, 120);
  };

  const drawPlayer = (ctx: CanvasRenderingContext2D, player: Player) => {
    // Player circle
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // White border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Player number
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.number.toString(), player.x, player.y);

    // Role label
    ctx.font = '10px Arial';
    ctx.fillStyle = player.color === '#3b82f6' ? '#3b82f6' : '#ef4444';
    ctx.fillText(player.role, player.x, player.y + 22);
  };

  const drawPassingLanes = (ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // Draw lines between key players
    // Midfielder to Right Winger
    ctx.beginPath();
    ctx.moveTo(players[6].x, players[6].y);
    ctx.lineTo(players[10].x, players[10].y);
    ctx.stroke();

    // Right Back to Right Winger
    ctx.beginPath();
    ctx.moveTo(players[4].x, players[4].y);
    ctx.lineTo(players[10].x, players[10].y);
    ctx.stroke();

    // Right Winger to Striker
    ctx.beginPath();
    ctx.moveTo(players[10].x, players[10].y);
    ctx.lineTo(players[9].x, players[9].y);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  const drawAnnotations = (ctx: CanvasRenderingContext2D) => {
    const phase = Math.floor(frame / 60) % 4;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(10, 10, 300, 60);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    
    const annotations = [
      'Phase 1: Fullbacks push high',
      'Phase 2: Ball played to winger',
      'Phase 3: 1v1 situation created',
      'Phase 4: Cross to far post'
    ];
    
    ctx.fillText(annotations[phase], 20, 35);
    ctx.font = '12px Arial';
    ctx.fillText(`Frame: ${frame} | Tactic: ${tactic}`, 20, 55);
  };

  // Animation loop
  useEffect(() => {
    if (isPlaying) {
      const animate = () => {
        setFrame(f => f + 1);
        animateTactic(frame);
        draw();
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, frame]);

  // Initial draw
  useEffect(() => {
    draw();
  }, [players]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setFrame(0);
    setPlayers(initializePlayers());
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={PITCH_WIDTH}
          height={PITCH_HEIGHT}
          className="border-2 border-slate-300 dark:border-slate-700 rounded-lg w-full"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button onClick={handlePlayPause} size="lg">
          {isPlaying ? (
            <>
              <Pause className="mr-2 h-5 w-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-5 w-5" />
              Play
            </>
          )}
        </Button>
        
        <Button onClick={handleReset} variant="outline" size="lg">
          <RotateCcw className="mr-2 h-5 w-5" />
          Reset
        </Button>

        <Button onClick={onExportVideo} variant="default" size="lg">
          <Download className="mr-2 h-5 w-5" />
          Export Video
        </Button>
      </div>

      <div className="p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-2">Legend:</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Your Team</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Opponent Team</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-white opacity-30"></div>
            <span>Passing Lanes</span>
          </div>
        </div>
      </div>
    </div>
  );
}
