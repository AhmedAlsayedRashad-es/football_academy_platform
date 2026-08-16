import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Save, 
  Play, 
  Trash2, 
  Plus, 
  ArrowRight, 
  Circle, 
  Move,
  Undo,
  Redo
} from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface Player {
  id: string;
  x: number;
  y: number;
  role: string;
  number: number;
  color: string;
}

interface Arrow {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  type: 'pass' | 'run' | 'press';
}

interface MovementPath {
  playerId: string;
  waypoints: { x: number; y: number; timestamp: number }[];
}

type EditorMode = 'select' | 'add_player' | 'move_player' | 'add_arrow' | 'add_path';

export default function CustomScenarioBuilder() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Scenario data
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [formation, setFormation] = useState('4-3-3');
  const [duration, setDuration] = useState(10);
  
  // Editor state
  const [players, setPlayers] = useState<Player[]>([]);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [movementPaths, setMovementPaths] = useState<MovementPath[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [editorMode, setEditorMode] = useState<EditorMode>('select');
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null);
  const [arrowType, setArrowType] = useState<'pass' | 'run' | 'press'>('pass');
  const [currentPath, setCurrentPath] = useState<{ playerId: string; waypoints: { x: number; y: number; timestamp: number }[] } | null>(null);
  
  // History for undo/redo
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const width = 600;
  const height = 900;

  // Draw pitch
  const drawPitch = (ctx: CanvasRenderingContext2D) => {
    const pitchColor = '#2d5016';
    const lineColor = '#ffffff';
    const lineWidth = 2;

    ctx.fillStyle = pitchColor;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;

    // Outer boundary
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // Center line
    ctx.beginPath();
    ctx.moveTo(20, height / 2);
    ctx.lineTo(width - 20, height / 2);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 60, 0, Math.PI * 2);
    ctx.stroke();

    // Penalty areas
    const penaltyAreaWidth = 200;
    const penaltyAreaHeight = 100;
    ctx.strokeRect((width - penaltyAreaWidth) / 2, 20, penaltyAreaWidth, penaltyAreaHeight);
    ctx.strokeRect((width - penaltyAreaWidth) / 2, height - 20 - penaltyAreaHeight, penaltyAreaWidth, penaltyAreaHeight);
  };

  // Draw players
  const drawPlayers = (ctx: CanvasRenderingContext2D) => {
    players.forEach(player => {
      const x = (player.x / 100) * (width - 40) + 20;
      const y = (player.y / 100) * (height - 40) + 20;

      // Highlight selected player
      if (player.id === selectedPlayer) {
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw player circle
      ctx.fillStyle = player.color;
      ctx.beginPath();
      ctx.arc(x, y, 15, 0, Math.PI * 2);
      ctx.fill();

      // Draw number
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.number.toString(), x, y);

      // Draw role below
      ctx.font = '10px Arial';
      ctx.fillText(player.role, x, y + 25);
    });
  };

  // Draw arrows
  const drawArrows = (ctx: CanvasRenderingContext2D) => {
    arrows.forEach(arrow => {
      const fromX = (arrow.from.x / 100) * (width - 40) + 20;
      const fromY = (arrow.from.y / 100) * (height - 40) + 20;
      const toX = (arrow.to.x / 100) * (width - 40) + 20;
      const toY = (arrow.to.y / 100) * (height - 40) + 20;

      ctx.strokeStyle = arrow.type === 'pass' ? '#3b82f6' : arrow.type === 'run' ? '#10b981' : '#ef4444';
      ctx.lineWidth = 3;
      ctx.setLineDash(arrow.type === 'run' ? [5, 5] : []);

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      // Arrowhead
      const angle = Math.atan2(toY - fromY, toX - fromX);
      const arrowSize = 10;
      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle - Math.PI / 6),
        toY - arrowSize * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(toX, toY);
      ctx.lineTo(
        toX - arrowSize * Math.cos(angle + Math.PI / 6),
        toY - arrowSize * Math.sin(angle + Math.PI / 6)
      );
      ctx.stroke();
      ctx.setLineDash([]);
    });
  };

  // Draw movement paths
  const drawMovementPaths = (ctx: CanvasRenderingContext2D) => {
    movementPaths.forEach(path => {
      if (path.waypoints.length < 2) return;

      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      const firstPoint = path.waypoints[0];
      const firstX = (firstPoint.x / 100) * (width - 40) + 20;
      const firstY = (firstPoint.y / 100) * (height - 40) + 20;
      ctx.moveTo(firstX, firstY);

      path.waypoints.slice(1).forEach(point => {
        const x = (point.x / 100) * (width - 40) + 20;
        const y = (point.y / 100) * (height - 40) + 20;
        ctx.lineTo(x, y);
      });

      ctx.stroke();
      ctx.setLineDash([]);

      // Draw waypoints
      path.waypoints.forEach(point => {
        const x = (point.x / 100) * (width - 40) + 20;
        const y = (point.y / 100) * (height - 40) + 20;
        ctx.fillStyle = '#a855f7';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  };

  // Render canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);
    drawPitch(ctx);
    drawArrows(ctx);
    drawMovementPaths(ctx);
    drawPlayers(ctx);
  }, [players, arrows, movementPaths, selectedPlayer]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert to percentage coordinates
    const percentX = ((clickX - 20) / (width - 40)) * 100;
    const percentY = ((clickY - 20) / (height - 40)) * 100;

    if (percentX < 0 || percentX > 100 || percentY < 0 || percentY > 100) return;

    if (editorMode === 'add_player') {
      const newPlayer: Player = {
        id: `player-${Date.now()}`,
        x: percentX,
        y: percentY,
        role: 'CM',
        number: players.length + 1,
        color: '#3b82f6',
      };
      setPlayers([...players, newPlayer]);
      saveToHistory();
    } else if (editorMode === 'select') {
      // Check if clicked on a player
      const clickedPlayer = players.find(p => {
        const dx = p.x - percentX;
        const dy = p.y - percentY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < 5; // 5% threshold
      });

      setSelectedPlayer(clickedPlayer ? clickedPlayer.id : null);
    } else if (editorMode === 'add_arrow') {
      if (!arrowStart) {
        setArrowStart({ x: percentX, y: percentY });
      } else {
        const newArrow: Arrow = {
          id: `arrow-${Date.now()}`,
          from: arrowStart,
          to: { x: percentX, y: percentY },
          type: arrowType,
        };
        setArrows([...arrows, newArrow]);
        setArrowStart(null);
        saveToHistory();
      }
    } else if (editorMode === 'add_path') {
      if (!currentPath && selectedPlayer) {
        setCurrentPath({
          playerId: selectedPlayer,
          waypoints: [{ x: percentX, y: percentY, timestamp: 0 }],
        });
      } else if (currentPath) {
        const lastTimestamp = currentPath.waypoints[currentPath.waypoints.length - 1].timestamp;
        setCurrentPath({
          ...currentPath,
          waypoints: [...currentPath.waypoints, { x: percentX, y: percentY, timestamp: lastTimestamp + 2 }],
        });
      }
    }
  };

  // Save to history for undo/redo
  const saveToHistory = () => {
    const state = { players, arrows, movementPaths };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setPlayers(prevState.players);
      setArrows(prevState.arrows);
      setMovementPaths(prevState.movementPaths);
      setHistoryIndex(historyIndex - 1);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setPlayers(nextState.players);
      setArrows(nextState.arrows);
      setMovementPaths(nextState.movementPaths);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Finish adding path
  const finishPath = () => {
    if (currentPath && currentPath.waypoints.length > 1) {
      setMovementPaths([...movementPaths, currentPath]);
      setCurrentPath(null);
      saveToHistory();
    }
  };

  // Delete selected player
  const deleteSelectedPlayer = () => {
    if (selectedPlayer) {
      setPlayers(players.filter(p => p.id !== selectedPlayer));
      setSelectedPlayer(null);
      saveToHistory();
    }
  };

  // Save scenario
  const handleSave = () => {
    if (!scenarioName) {
      toast.error('Please enter a scenario name');
      return;
    }

    // Convert to TacticalScenarioData format
    const scenarioData = {
      name: scenarioName,
      description: scenarioDescription,
      formation,
      duration,
      initialPositions: players.map(p => ({ x: p.x, y: p.y, role: p.role, number: p.number })),
      arrows: arrows.map(a => ({ from: a.from, to: a.to, type: a.type })),
      movements: movementPaths.map(path => ({
        playerId: parseInt(path.playerId.split('-')[1]),
        role: players.find(p => p.id === path.playerId)?.role || 'CM',
        color: players.find(p => p.id === path.playerId)?.color || '#3b82f6',
        path: path.waypoints,
      })),
    };

    console.log('Saving scenario:', scenarioData);

    toast.success('Scenario saved successfully!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Canvas */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Pitch Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <canvas
              ref={canvasRef}
              width={width}
              height={height}
              onClick={handleCanvasClick}
              className="border rounded-lg cursor-crosshair mx-auto"
              style={{ maxWidth: '100%', height: 'auto' }}
            />

            {/* Editor Mode Buttons */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant={editorMode === 'select' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditorMode('select')}
              >
                <Move className="h-4 w-4 mr-1" />
                Select
              </Button>
              <Button
                variant={editorMode === 'add_player' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditorMode('add_player')}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Player
              </Button>
              <Button
                variant={editorMode === 'add_arrow' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditorMode('add_arrow')}
              >
                <ArrowRight className="h-4 w-4 mr-1" />
                Add Arrow
              </Button>
              <Button
                variant={editorMode === 'add_path' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEditorMode('add_path')}
                disabled={!selectedPlayer}
              >
                <Circle className="h-4 w-4 mr-1" />
                Add Path
              </Button>
              {currentPath && (
                <Button size="sm" onClick={finishPath} variant="secondary">
                  Finish Path
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={handleUndo} disabled={historyIndex <= 0}>
                <Undo className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleRedo} disabled={historyIndex >= history.length - 1}>
                <Redo className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="destructive" onClick={deleteSelectedPlayer} disabled={!selectedPlayer}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Scenario Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Scenario Name</Label>
              <Input
                id="name"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                placeholder="e.g., Wing Overload Attack"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
                placeholder="Describe the tactical scenario..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="formation">Formation</Label>
              <Select value={formation} onValueChange={setFormation}>
                <SelectTrigger id="formation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4-3-3">4-3-3</SelectItem>
                  <SelectItem value="4-4-2">4-4-2</SelectItem>
                  <SelectItem value="3-5-2">3-5-2</SelectItem>
                  <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                  <SelectItem value="3-4-3">3-4-3</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min={5}
                max={30}
              />
            </div>

            {editorMode === 'add_arrow' && (
              <div>
                <Label htmlFor="arrowType">Arrow Type</Label>
                <Select value={arrowType} onValueChange={(v) => setArrowType(v as any)}>
                  <SelectTrigger id="arrowType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pass">Pass (Blue)</SelectItem>
                    <SelectItem value="run">Run (Green)</SelectItem>
                    <SelectItem value="press">Press (Red)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button onClick={handleSave} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Scenario
            </Button>
          </CardContent>
        </Card>

        {selectedPlayer && (
          <Card>
            <CardHeader>
              <CardTitle>Selected Player</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Role</Label>
                <Input
                  value={players.find(p => p.id === selectedPlayer)?.role || ''}
                  onChange={(e) => {
                    setPlayers(players.map(p =>
                      p.id === selectedPlayer ? { ...p, role: e.target.value } : p
                    ));
                  }}
                />
              </div>
              <div>
                <Label>Number</Label>
                <Input
                  type="number"
                  value={players.find(p => p.id === selectedPlayer)?.number || 0}
                  onChange={(e) => {
                    setPlayers(players.map(p =>
                      p.id === selectedPlayer ? { ...p, number: parseInt(e.target.value) } : p
                    ));
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
