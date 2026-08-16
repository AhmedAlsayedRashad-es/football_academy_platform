import { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  RotateCcw, Users, Target, TrendingUp, Shield, Swords,
  Activity, Layers, Camera, Gauge, Brain, Zap, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

type PlanningPhase = 'defense' | 'transition' | 'attack';

interface Player {
  id: number; x: number; y: number; number: number;
  name: string; team: 'home' | 'away'; role: string; color: string;
}

interface Formation { name: string; positions: Array<{ x: number; y: number; role: string }>; }
interface StrategyRecommendation { id: string; title: string; description: string; phase: PlanningPhase; effectiveness: number; }

const FORMATIONS: Record<string, Formation> = {
  '4-4-2': { name: '4-4-2', positions: [
    { x: 50, y: 90, role: 'GK' },
    { x: 15, y: 75, role: 'LB' }, { x: 35, y: 75, role: 'CB' }, { x: 65, y: 75, role: 'CB' }, { x: 85, y: 75, role: 'RB' },
    { x: 15, y: 55, role: 'LM' }, { x: 35, y: 55, role: 'CM' }, { x: 65, y: 55, role: 'CM' }, { x: 85, y: 55, role: 'RM' },
    { x: 35, y: 30, role: 'ST' }, { x: 65, y: 30, role: 'ST' },
  ]},
  '4-3-3': { name: '4-3-3', positions: [
    { x: 50, y: 90, role: 'GK' },
    { x: 15, y: 75, role: 'LB' }, { x: 35, y: 75, role: 'CB' }, { x: 65, y: 75, role: 'CB' }, { x: 85, y: 75, role: 'RB' },
    { x: 25, y: 55, role: 'CM' }, { x: 50, y: 50, role: 'CDM' }, { x: 75, y: 55, role: 'CM' },
    { x: 15, y: 25, role: 'LW' }, { x: 50, y: 20, role: 'CF' }, { x: 85, y: 25, role: 'RW' },
  ]},
  '3-5-2': { name: '3-5-2', positions: [
    { x: 50, y: 90, role: 'GK' },
    { x: 25, y: 75, role: 'CB' }, { x: 50, y: 78, role: 'CB' }, { x: 75, y: 75, role: 'CB' },
    { x: 10, y: 55, role: 'LWB' }, { x: 30, y: 55, role: 'CM' }, { x: 50, y: 52, role: 'CDM' }, { x: 70, y: 55, role: 'CM' }, { x: 90, y: 55, role: 'RWB' },
    { x: 35, y: 28, role: 'ST' }, { x: 65, y: 28, role: 'ST' },
  ]},
  '4-2-3-1': { name: '4-2-3-1', positions: [
    { x: 50, y: 90, role: 'GK' },
    { x: 15, y: 75, role: 'LB' }, { x: 35, y: 75, role: 'CB' }, { x: 65, y: 75, role: 'CB' }, { x: 85, y: 75, role: 'RB' },
    { x: 35, y: 60, role: 'CDM' }, { x: 65, y: 60, role: 'CDM' },
    { x: 15, y: 42, role: 'LAM' }, { x: 50, y: 40, role: 'CAM' }, { x: 85, y: 42, role: 'RAM' },
    { x: 50, y: 22, role: 'ST' },
  ]},
  '5-3-2': { name: '5-3-2', positions: [
    { x: 50, y: 90, role: 'GK' },
    { x: 10, y: 72, role: 'LWB' }, { x: 25, y: 78, role: 'CB' }, { x: 50, y: 80, role: 'CB' }, { x: 75, y: 78, role: 'CB' }, { x: 90, y: 72, role: 'RWB' },
    { x: 25, y: 52, role: 'CM' }, { x: 50, y: 50, role: 'CM' }, { x: 75, y: 52, role: 'CM' },
    { x: 35, y: 28, role: 'ST' }, { x: 65, y: 28, role: 'ST' },
  ]},
  '4-5-1': { name: '4-5-1', positions: [
    { x: 50, y: 90, role: 'GK' },
    { x: 15, y: 75, role: 'LB' }, { x: 35, y: 75, role: 'CB' }, { x: 65, y: 75, role: 'CB' }, { x: 85, y: 75, role: 'RB' },
    { x: 10, y: 55, role: 'LM' }, { x: 28, y: 55, role: 'CM' }, { x: 50, y: 52, role: 'CDM' }, { x: 72, y: 55, role: 'CM' }, { x: 90, y: 55, role: 'RM' },
    { x: 50, y: 22, role: 'ST' },
  ]},
};

const AI_STRATEGIES: StrategyRecommendation[] = [
  { id: '1', title: 'High Press', description: 'Press high up the pitch to win the ball in dangerous areas. Requires high fitness and coordinated pressing triggers.', phase: 'defense', effectiveness: 85 },
  { id: '2', title: 'Counter Attack', description: 'Absorb pressure and hit on the break with pace. Keep defensive shape and transition quickly through midfield.', phase: 'transition', effectiveness: 78 },
  { id: '3', title: 'Possession Build-Up', description: 'Patient build-up from the back, drawing opponents out of position before exploiting spaces.', phase: 'attack', effectiveness: 82 },
  { id: '4', title: 'Low Block', description: 'Compact defensive shape with two banks of four. Deny space in behind and look to counter.', phase: 'defense', effectiveness: 75 },
  { id: '5', title: 'Wing Overloads', description: 'Overload wide areas with overlapping full-backs and wide forwards to create crossing opportunities.', phase: 'attack', effectiveness: 80 },
];

function drawPitch(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#2d6a2d'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 10; i++) { if (i % 2 === 0) { ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(0, (h / 10) * i, w, h / 10); } }
  const pad = 20, pw = w - pad * 2, ph = h - pad * 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, pw, ph);
  ctx.beginPath(); ctx.moveTo(pad, pad + ph / 2); ctx.lineTo(pad + pw, pad + ph / 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(pad + pw / 2, pad + ph / 2, ph * 0.12, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(pad + pw / 2, pad + ph / 2, 3, 0, Math.PI * 2); ctx.fill();
  const paW = pw * 0.4, paH = ph * 0.14;
  ctx.strokeRect(pad + (pw - paW) / 2, pad, paW, paH);
  ctx.strokeRect(pad + (pw - paW) / 2, pad + ph - paH, paW, paH);
  const gaW = pw * 0.2, gaH = ph * 0.06;
  ctx.strokeRect(pad + (pw - gaW) / 2, pad, gaW, gaH);
  ctx.strokeRect(pad + (pw - gaW) / 2, pad + ph - gaH, gaW, gaH);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3;
  const goalW = pw * 0.1, goalDepth = 8;
  ctx.strokeRect(pad + (pw - goalW) / 2, pad - goalDepth, goalW, goalDepth);
  ctx.strokeRect(pad + (pw - goalW) / 2, pad + ph, goalW, goalDepth);
  ctx.fillStyle = 'white';
  ctx.beginPath(); ctx.arc(pad + pw / 2, pad + paH * 0.75, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(pad + pw / 2, pad + ph - paH * 0.75, 3, 0, Math.PI * 2); ctx.fill();
}

function pitchToCanvas(x: number, y: number, w: number, h: number): [number, number] {
  const pad = 20; return [pad + (x / 100) * (w - pad * 2), pad + (y / 100) * (h - pad * 2)];
}
function canvasToPitch(cx: number, cy: number, w: number, h: number): [number, number] {
  const pad = 20, pw = w - pad * 2, ph = h - pad * 2;
  return [Math.max(0, Math.min(100, ((cx - pad) / pw) * 100)), Math.max(0, Math.min(100, ((cy - pad) / ph) * 100))];
}

export default function TacticalSimulation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { language } = useLanguage();
  const [homeFormation, setHomeFormation] = useState('4-4-2');
  const [awayFormation, setAwayFormation] = useState('4-3-3');
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [homeTeamName, setHomeTeamName] = useState('Your Team');
  const [awayTeamName, setAwayTeamName] = useState('Opponent Team');
  const [homeColor, setHomeColor] = useState('#1a73e8');
  const [awayColor, setAwayColor] = useState('#e53935');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [draggingPlayer, setDraggingPlayer] = useState<Player | null>(null);
  const [showOffsideLine, setShowOffsideLine] = useState(false);
  const [showMarkingLines, setShowMarkingLines] = useState(false);
  const [showAIAdvice, setShowAIAdvice] = useState(false);
  const [aiAdviceText, setAiAdviceText] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<PlanningPhase>('defense');
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyRecommendation | null>(null);
  const [drawingMode, setDrawingMode] = useState<'none' | 'arrow'>('none');
  const [arrows, setArrows] = useState<Array<{ x1: number; y1: number; x2: number; y2: number; color: string }>>([]);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawColor, setDrawColor] = useState('#FFFF00');

  const buildPlayers = useCallback((formation: string, team: 'home' | 'away', color: string): Player[] => {
    const f = FORMATIONS[formation] ?? FORMATIONS['4-4-2'];
    return f.positions.map((pos, i) => ({
      id: team === 'home' ? i : i + 100,
      x: team === 'home' ? pos.x : 100 - pos.x,
      y: team === 'home' ? pos.y : 100 - pos.y,
      number: i + 1, name: `${pos.role} ${i + 1}`, team, role: pos.role, color,
    }));
  }, []);

  useEffect(() => { setHomePlayers(buildPlayers(homeFormation, 'home', homeColor)); }, [homeFormation, homeColor, buildPlayers]);
  useEffect(() => { setAwayPlayers(buildPlayers(awayFormation, 'away', awayColor)); }, [awayFormation, awayColor, buildPlayers]);

  const render = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const w = canvas.width, h = canvas.height;
    drawPitch(ctx, w, h);
    arrows.forEach(arrow => {
      const [x1, y1] = pitchToCanvas(arrow.x1, arrow.y1, w, h);
      const [x2, y2] = pitchToCanvas(arrow.x2, arrow.y2, w, h);
      ctx.strokeStyle = arrow.color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      const angle = Math.atan2(y2 - y1, x2 - x1);
      ctx.fillStyle = arrow.color; ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - 12 * Math.cos(angle - 0.4), y2 - 12 * Math.sin(angle - 0.4));
      ctx.lineTo(x2 - 12 * Math.cos(angle + 0.4), y2 - 12 * Math.sin(angle + 0.4));
      ctx.closePath(); ctx.fill();
    });
    if (showOffsideLine) {
      const defenders = awayPlayers.filter(p => p.role.includes('B') || p.role === 'GK');
      if (defenders.length > 0) {
        const lastDefY = Math.min(...defenders.map(p => p.y));
        const [, oy] = pitchToCanvas(50, lastDefY, w, h);
        ctx.strokeStyle = 'rgba(255,200,0,0.8)'; ctx.lineWidth = 2; ctx.setLineDash([8, 4]);
        ctx.beginPath(); ctx.moveTo(20, oy); ctx.lineTo(w - 20, oy); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(255,200,0,0.9)'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('OFFSIDE LINE', 25, oy - 4);
      }
    }
    if (showMarkingLines) {
      homePlayers.forEach(hp => {
        const nearest = awayPlayers.reduce<Player | null>((best, ap) => {
          if (!best) return ap;
          return Math.hypot(hp.x - ap.x, hp.y - ap.y) < Math.hypot(hp.x - best.x, hp.y - best.y) ? ap : best;
        }, null);
        if (nearest) {
          const [hx, hy] = pitchToCanvas(hp.x, hp.y, w, h);
          const [ax, ay] = pitchToCanvas(nearest.x, nearest.y, w, h);
          ctx.strokeStyle = 'rgba(255,255,100,0.4)'; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
          ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(ax, ay); ctx.stroke(); ctx.setLineDash([]);
        }
      });
    }
    [...homePlayers, ...awayPlayers].forEach(player => {
      const [cx, cy] = pitchToCanvas(player.x, player.y, w, h);
      const r = 14, isSelected = selectedPlayer?.id === player.id;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx + 2, cy + 2, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = player.color; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = isSelected ? '#FFD700' : 'white'; ctx.lineWidth = isSelected ? 3 : 1.5; ctx.stroke();
      ctx.fillStyle = 'white'; ctx.font = `bold ${r * 0.9}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(player.number), cx, cy);
      ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = '9px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(player.role, cx, cy + r + 2);
    });
  }, [homePlayers, awayPlayers, selectedPlayer, showOffsideLine, showMarkingLines, arrows]);

  useEffect(() => { render(); }, [render]);

  const getPlayerAt = useCallback((px: number, py: number): Player | null => {
    const canvas = canvasRef.current; if (!canvas) return null;
    const [pitchX, pitchY] = canvasToPitch(px, py, canvas.width, canvas.height);
    for (const player of [...homePlayers, ...awayPlayers]) {
      if (Math.hypot(player.x - pitchX, player.y - pitchY) < 4) return player;
    }
    return null;
  }, [homePlayers, awayPlayers]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [(e.clientX - rect.left) * (canvasRef.current!.width / rect.width), (e.clientY - rect.top) * (canvasRef.current!.height / rect.height)];
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const [px, py] = getCanvasCoords(e);
    if (drawingMode === 'arrow') {
      const [pitchX, pitchY] = canvasToPitch(px, py, canvasRef.current!.width, canvasRef.current!.height);
      setDrawStart({ x: pitchX, y: pitchY }); return;
    }
    const player = getPlayerAt(px, py);
    if (player) { setDraggingPlayer(player); setSelectedPlayer(player); } else setSelectedPlayer(null);
  }, [drawingMode, getPlayerAt]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingPlayer) return;
    const [px, py] = getCanvasCoords(e);
    const [pitchX, pitchY] = canvasToPitch(px, py, canvasRef.current!.width, canvasRef.current!.height);
    if (draggingPlayer.team === 'home') setHomePlayers(prev => prev.map(p => p.id === draggingPlayer.id ? { ...p, x: pitchX, y: pitchY } : p));
    else setAwayPlayers(prev => prev.map(p => p.id === draggingPlayer.id ? { ...p, x: pitchX, y: pitchY } : p));
  }, [draggingPlayer]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (drawStart && drawingMode === 'arrow') {
      const [px, py] = getCanvasCoords(e);
      const [pitchX, pitchY] = canvasToPitch(px, py, canvasRef.current!.width, canvasRef.current!.height);
      setArrows(prev => [...prev, { x1: drawStart.x, y1: drawStart.y, x2: pitchX, y2: pitchY, color: drawColor }]);
      setDrawStart(null);
    }
    setDraggingPlayer(null);
  }, [drawStart, drawingMode, drawColor]);

  const getTouchCoords = (e: React.TouchEvent<HTMLCanvasElement>): [number, number] => {
    const touch = e.touches[0], rect = canvasRef.current!.getBoundingClientRect();
    return [(touch.clientX - rect.left) * (canvasRef.current!.width / rect.width), (touch.clientY - rect.top) * (canvasRef.current!.height / rect.height)];
  };

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const [px, py] = getTouchCoords(e);
    const player = getPlayerAt(px, py);
    if (player) { setDraggingPlayer(player); setSelectedPlayer(player); }
  }, [getPlayerAt]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); if (!draggingPlayer) return;
    const [px, py] = getTouchCoords(e);
    const [pitchX, pitchY] = canvasToPitch(px, py, canvasRef.current!.width, canvasRef.current!.height);
    if (draggingPlayer.team === 'home') setHomePlayers(prev => prev.map(p => p.id === draggingPlayer.id ? { ...p, x: pitchX, y: pitchY } : p));
    else setAwayPlayers(prev => prev.map(p => p.id === draggingPlayer.id ? { ...p, x: pitchX, y: pitchY } : p));
  }, [draggingPlayer]);

  const handleTouchEnd = useCallback(() => setDraggingPlayer(null), []);

  const resetFormations = () => {
    setHomePlayers(buildPlayers(homeFormation, 'home', homeColor));
    setAwayPlayers(buildPlayers(awayFormation, 'away', awayColor));
    setArrows([]); setSelectedPlayer(null); toast.success('Formations reset');
  };

  const saveScreenshot = () => {
    const canvas = canvasRef.current; if (!canvas) return;
    const link = document.createElement('a'); link.download = 'tactical-board.png'; link.href = canvas.toDataURL('image/png'); link.click();
    toast.success('Screenshot saved');
  };

  const handleGetAIAdvice = async () => {
    setIsLoadingAI(true); setShowAIAdvice(true);
    try {
      const strategyContext = selectedStrategy ? `Selected strategy: ${selectedStrategy.title}` : '';
      setAiAdviceText(`Tactical analysis for ${homeTeamName} (${homeFormation}) vs ${awayTeamName} (${awayFormation}) in the ${currentPhase} phase.\n\n${strategyContext}\n\nKey considerations:\n• ${homeFormation} vs ${awayFormation} creates a ${FORMATIONS[homeFormation]?.positions.filter(p => p.role.includes('M') || p.role === 'CDM' || p.role === 'CAM').length ?? 0}-v-${FORMATIONS[awayFormation]?.positions.filter(p => p.role.includes('M') || p.role === 'CDM' || p.role === 'CAM').length ?? 0} midfield battle\n• In the ${currentPhase} phase, maintain positional discipline and exploit the formation mismatch\n• ${currentPhase === 'defense' ? 'Maintain a compact shape and deny space between the lines' : currentPhase === 'transition' ? 'React quickly to ball loss/gain — first 5 seconds are critical' : 'Create overloads in wide areas and exploit space behind their defensive line'}`);
    } catch { setAiAdviceText('Unable to load AI advice at this time.'); }
    finally { setIsLoadingAI(false); }
  };

  const phaseColors: Record<PlanningPhase, string> = { defense: 'bg-blue-600', transition: 'bg-yellow-600', attack: 'bg-red-600' };
  const filteredStrategies = AI_STRATEGIES.filter(s => s.phase === currentPhase);

  return (
    <>
    <div className="text-foreground p-4" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="w-6 h-6 text-green-700 dark:text-green-400" />{language === 'ar' ? 'المحاكاة التكتيكية' : 'Tactical Simulation'}</h1>
            <p className="text-muted-foreground text-sm">{language === 'ar' ? 'لوحة تكتيكية تفاعلية — اسحب اللاعبين لإعادة تموضعهم' : 'Interactive 2D tactical board — drag players to reposition'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-1 space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Users className="w-4 h-4 text-green-700 dark:text-green-400" />Team Setup</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Home Team</label>
                  <div className="flex gap-2">
                    <Input value={homeTeamName} onChange={e => setHomeTeamName(e.target.value)} className="bg-muted border-border text-sm flex-1" placeholder="Home team name" />
                    <input type="color" value={homeColor} onChange={e => setHomeColor(e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-border" title="Home color" />
                  </div>
                  <Select value={homeFormation} onValueChange={setHomeFormation}>
                    <SelectTrigger className="mt-1 bg-muted border-border text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.keys(FORMATIONS).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Away Team</label>
                  <div className="flex gap-2">
                    <Input value={awayTeamName} onChange={e => setAwayTeamName(e.target.value)} className="bg-muted border-border text-sm flex-1" placeholder="Away team name" />
                    <input type="color" value={awayColor} onChange={e => setAwayColor(e.target.value)} className="w-10 h-9 rounded cursor-pointer border border-border" title="Away color" />
                  </div>
                  <Select value={awayFormation} onValueChange={setAwayFormation}>
                    <SelectTrigger className="mt-1 bg-muted border-border text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.keys(FORMATIONS).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />Overlays</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant={showOffsideLine ? 'default' : 'outline'} size="sm" className="w-full justify-start text-xs" onClick={() => setShowOffsideLine(v => !v)}>
                  {showOffsideLine ? <Eye className="w-3 h-3 mr-2" /> : <EyeOff className="w-3 h-3 mr-2" />}Offside Line
                </Button>
                <Button variant={showMarkingLines ? 'default' : 'outline'} size="sm" className="w-full justify-start text-xs" onClick={() => setShowMarkingLines(v => !v)}>
                  {showMarkingLines ? <Eye className="w-3 h-3 mr-2" /> : <EyeOff className="w-3 h-3 mr-2" />}Marking Lines
                </Button>
                <div className="border-t border-border pt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ background: drawColor }} />
                    <span className="text-xs text-muted-foreground">Arrow Color</span>
                    <input type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)} className="w-6 h-6 ml-auto rounded cursor-pointer" />
                  </div>
                  <Button variant={drawingMode === 'arrow' ? 'default' : 'outline'} size="sm" className="w-full justify-start text-xs" onClick={() => setDrawingMode(m => m === 'arrow' ? 'none' : 'arrow')}>
                    <Zap className="w-3 h-3 mr-2" />{drawingMode === 'arrow' ? 'Drawing… (click to stop)' : 'Draw Arrow'}
                  </Button>
                  {arrows.length > 0 && <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-red-600 dark:text-red-400 mt-1" onClick={() => setArrows([])}>Clear Arrows ({arrows.length})</Button>}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardContent className="pt-4 space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={resetFormations}><RotateCcw className="w-3 h-3 mr-2" /> Reset Formations</Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs" onClick={saveScreenshot}><Camera className="w-3 h-3 mr-2" /> Save Screenshot</Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs text-purple-600 dark:text-purple-400 border-purple-700" onClick={handleGetAIAdvice} disabled={isLoadingAI}><Brain className="w-3 h-3 mr-2" />{isLoadingAI ? 'Analyzing...' : 'Get AI Advice'}</Button>
              </CardContent>
            </Card>
            {selectedPlayer && (
              <Card className="bg-card border-yellow-700">
                <CardHeader className="pb-2"><CardTitle className="text-sm text-yellow-700 dark:text-yellow-400">Selected Player</CardTitle></CardHeader>
                <CardContent className="text-xs space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Role</span><Badge variant="outline" className="text-xs">{selectedPlayer.role}</Badge></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Team</span><span style={{ color: selectedPlayer.color }}>{selectedPlayer.team === 'home' ? homeTeamName : awayTeamName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Position</span><span>({selectedPlayer.x.toFixed(0)}, {selectedPlayer.y.toFixed(0)})</span></div>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="xl:col-span-2">
            <Card className="bg-card border-border">
              <CardContent className="p-2">
                <canvas ref={canvasRef} width={600} height={800} className="w-full rounded"
                  style={{ maxHeight: '70vh', objectFit: 'contain', cursor: drawingMode === 'arrow' ? 'crosshair' : draggingPlayer ? 'grabbing' : 'grab' }}
                  onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} />
                <p className="text-center text-xs text-muted-foreground mt-1">Drag players to reposition • {homePlayers.length + awayPlayers.length} players on pitch</p>
              </CardContent>
            </Card>
          </div>
          <div className="xl:col-span-1 space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-orange-700 dark:text-orange-400" />Planning Phase</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(['defense', 'transition', 'attack'] as PlanningPhase[]).map(phase => (
                  <Button key={phase} variant={currentPhase === phase ? 'default' : 'outline'} size="sm" className={`w-full justify-start text-xs capitalize ${currentPhase === phase ? phaseColors[phase] : ''}`} onClick={() => setCurrentPhase(phase)}>
                    {phase === 'defense' && <Shield className="w-3 h-3 mr-2" />}
                    {phase === 'transition' && <Zap className="w-3 h-3 mr-2" />}
                    {phase === 'attack' && <Swords className="w-3 h-3 mr-2" />}
                    {phase.charAt(0).toUpperCase() + phase.slice(1)}
                  </Button>
                ))}
              </CardContent>
            </Card>
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-700 dark:text-green-400" />Strategies</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {filteredStrategies.map(strategy => (
                  <button key={strategy.id} className={`w-full text-left p-2 rounded border text-xs transition-colors ${selectedStrategy?.id === strategy.id ? 'border-green-500 bg-green-900/30' : 'border-border hover:border-gray-500'}`} onClick={() => setSelectedStrategy(s => s?.id === strategy.id ? null : strategy)}>
                    <div className="flex justify-between items-center mb-1"><span className="font-semibold">{strategy.title}</span><Badge variant="outline" className="text-xs">{strategy.effectiveness}%</Badge></div>
                    <p className="text-muted-foreground leading-relaxed">{strategy.description}</p>
                  </button>
                ))}
              </CardContent>
            </Card>
            {showAIAdvice && (
              <Card className="bg-card border-purple-700">
                <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2 text-purple-600 dark:text-purple-400"><Brain className="w-4 h-4" />AI Tactical Advice</CardTitle></CardHeader>
                <CardContent>
                  {isLoadingAI ? <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />Analyzing...</div>
                    : <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">{aiAdviceText}</p>}
                </CardContent>
              </Card>
            )}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Gauge className="w-4 h-4 text-cyan-700 dark:text-cyan-400" />Formation Analysis</CardTitle></CardHeader>
              <CardContent className="text-xs space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">{homeTeamName}</span><Badge className="bg-blue-700 text-xs">{homeFormation}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{awayTeamName}</span><Badge className="bg-red-700 text-xs">{awayFormation}</Badge></div>
                <div className="border-t border-border pt-2 space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Midfield</span><span className="text-yellow-400">{FORMATIONS[homeFormation]?.positions.filter(p => p.role.includes('M') || p.role === 'CDM' || p.role === 'CAM').length ?? 0} vs {FORMATIONS[awayFormation]?.positions.filter(p => p.role.includes('M') || p.role === 'CDM' || p.role === 'CAM').length ?? 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Attackers</span><span className="text-green-400">{FORMATIONS[homeFormation]?.positions.filter(p => p.role.includes('W') || p.role === 'ST' || p.role === 'CF').length ?? 0} vs {FORMATIONS[awayFormation]?.positions.filter(p => p.role.includes('W') || p.role === 'ST' || p.role === 'CF').length ?? 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Defenders</span><span className="text-blue-600 dark:text-blue-400">{FORMATIONS[homeFormation]?.positions.filter(p => p.role.includes('B')).length ?? 0} vs {FORMATIONS[awayFormation]?.positions.filter(p => p.role.includes('B')).length ?? 0}</span></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
