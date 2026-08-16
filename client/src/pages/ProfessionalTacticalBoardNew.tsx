import { useRef, useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocation } from 'wouter';
import {
  RotateCcw, Save, Download, Pencil, ArrowRight,
  Circle, Square, Eraser, Target, Users, ArrowLeft, Layers, Eye, EyeOff, Plus, Undo2, Redo2, Trash2,
  BookOpen, Sparkles, FolderOpen, Copy, ChevronRight, ChevronLeft, Flag, Brain, AlertTriangle, TrendingUp, Shield, Zap,
  Play, Pause, SkipBack, SkipForward
} from 'lucide-react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

// ─── Types ───────────────────────────────────────────────────────────────────
type DrawingTool = 'none' | 'line' | 'arrow' | 'circle' | 'rect' | 'eraser';
type Formation = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1' | '3-4-3' | '5-3-2';

interface DrawingLayer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  drawings: DrawingElement[];
}

interface Player {
  id: string;
  x: number;
  y: number;
  team: 'home' | 'away';
  number: number;
  label: string;
}

interface DrawingElement {
  id: string;
  type: 'line' | 'arrow' | 'circle' | 'rect';
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  radius?: number;
  color: string;
}

interface TacticalPhaseLocal {
  id?: number;
  phaseNumber: number;
  title: string;
  description?: string;
  homePlayers: Player[];
  awayPlayers: Player[];
  layers: DrawingLayer[];
}

interface AnalysisNote {
  id?: number;
  category: 'strength' | 'weakness' | 'opportunity' | 'threat' | 'general' | 'set_piece' | 'pressing' | 'transition';
  content: string;
  priority: 'low' | 'medium' | 'high';
  relatedPhaseId?: number;
  authorName?: string;
  createdAt?: string;
}

// ─── Formation Positions ─────────────────────────────────────────────────────
const getFormationPositions = (formation: Formation, team: 'home' | 'away'): Player[] => {
  const isHome = team === 'home';
  const base: { x: number; y: number; label: string }[] = [];

  const formations: Record<Formation, { x: number; y: number; label: string }[]> = {
    '4-3-3': [
      { x: 100, y: 400, label: 'GK' }, { x: 250, y: 150, label: 'LB' }, { x: 250, y: 300, label: 'CB' },
      { x: 250, y: 500, label: 'CB' }, { x: 250, y: 650, label: 'RB' }, { x: 450, y: 200, label: 'CM' },
      { x: 450, y: 400, label: 'CM' }, { x: 450, y: 600, label: 'CM' }, { x: 650, y: 150, label: 'LW' },
      { x: 650, y: 400, label: 'ST' }, { x: 650, y: 650, label: 'RW' },
    ],
    '4-4-2': [
      { x: 100, y: 400, label: 'GK' }, { x: 250, y: 150, label: 'LB' }, { x: 250, y: 300, label: 'CB' },
      { x: 250, y: 500, label: 'CB' }, { x: 250, y: 650, label: 'RB' }, { x: 450, y: 150, label: 'LM' },
      { x: 450, y: 300, label: 'CM' }, { x: 450, y: 500, label: 'CM' }, { x: 450, y: 650, label: 'RM' },
      { x: 650, y: 300, label: 'ST' }, { x: 650, y: 500, label: 'ST' },
    ],
    '3-5-2': [
      { x: 100, y: 400, label: 'GK' }, { x: 250, y: 200, label: 'CB' }, { x: 250, y: 400, label: 'CB' },
      { x: 250, y: 600, label: 'CB' }, { x: 400, y: 100, label: 'LWB' }, { x: 450, y: 260, label: 'CM' },
      { x: 450, y: 400, label: 'CM' }, { x: 450, y: 540, label: 'CM' }, { x: 400, y: 700, label: 'RWB' },
      { x: 650, y: 300, label: 'ST' }, { x: 650, y: 500, label: 'ST' },
    ],
    '4-2-3-1': [
      { x: 100, y: 400, label: 'GK' }, { x: 250, y: 150, label: 'LB' }, { x: 250, y: 300, label: 'CB' },
      { x: 250, y: 500, label: 'CB' }, { x: 250, y: 650, label: 'RB' }, { x: 400, y: 300, label: 'CDM' },
      { x: 400, y: 500, label: 'CDM' }, { x: 550, y: 150, label: 'LW' }, { x: 550, y: 400, label: 'CAM' },
      { x: 550, y: 650, label: 'RW' }, { x: 700, y: 400, label: 'ST' },
    ],
    '3-4-3': [
      { x: 100, y: 400, label: 'GK' }, { x: 250, y: 200, label: 'CB' }, { x: 250, y: 400, label: 'CB' },
      { x: 250, y: 600, label: 'CB' }, { x: 450, y: 150, label: 'LM' }, { x: 450, y: 320, label: 'CM' },
      { x: 450, y: 480, label: 'CM' }, { x: 450, y: 650, label: 'RM' }, { x: 650, y: 150, label: 'LW' },
      { x: 650, y: 400, label: 'ST' }, { x: 650, y: 650, label: 'RW' },
    ],
    '5-3-2': [
      { x: 100, y: 400, label: 'GK' }, { x: 250, y: 100, label: 'LWB' }, { x: 250, y: 260, label: 'CB' },
      { x: 250, y: 400, label: 'CB' }, { x: 250, y: 540, label: 'CB' }, { x: 250, y: 700, label: 'RWB' },
      { x: 450, y: 250, label: 'CM' }, { x: 450, y: 400, label: 'CM' }, { x: 450, y: 550, label: 'CM' },
      { x: 650, y: 300, label: 'ST' }, { x: 650, y: 500, label: 'ST' },
    ],
  };

  const homePositions = formations[formation] || formations['4-3-3'];
  if (isHome) {
    base.push(...homePositions);
  } else {
    // Mirror for away team
    base.push(...homePositions.map(p => ({ ...p, x: 1200 - p.x })));
  }

  return base.map((pos, idx) => ({
    id: `${team}-${idx}`,
    x: pos.x, y: pos.y, team, number: idx + 1, label: pos.label,
  }));
};

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 800;
const PLAYER_RADIUS = 20;

const NOTE_CATEGORY_ICONS: Record<string, React.ReactNode> = {
  strength: <TrendingUp className="h-3 w-3 text-green-700 dark:text-green-500" />,
  weakness: <AlertTriangle className="h-3 w-3 text-red-500" />,
  opportunity: <Zap className="h-3 w-3 text-yellow-700 dark:text-yellow-500" />,
  threat: <Shield className="h-3 w-3 text-orange-700 dark:text-orange-500" />,
  general: <Brain className="h-3 w-3 text-blue-500" />,
  set_piece: <Flag className="h-3 w-3 text-purple-500" />,
  pressing: <Target className="h-3 w-3 text-cyan-700 dark:text-cyan-500" />,
  transition: <ArrowRight className="h-3 w-3 text-indigo-500" />,
};

const NOTE_PRIORITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  medium: 'bg-yellow-100 border-yellow-300 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  low: 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:text-green-400',
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfessionalTacticalBoard() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ── Board State ──────────────────────────────────────────────────────────
  const [homeFormation, setHomeFormation] = useState<Formation>('4-3-3');
  const [awayFormation, setAwayFormation] = useState<Formation>('4-4-2');
  const [homeTeamName, setHomeTeamName] = useState('Our Team');
  const [awayTeamName, setAwayTeamName] = useState('Opponent');
  const [homePlayers, setHomePlayers] = useState<Player[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // ── Drawing State ────────────────────────────────────────────────────────
  const [drawingTool, setDrawingTool] = useState<DrawingTool>('none');
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<DrawingElement | null>(null);
  const [undoStack, setUndoStack] = useState<DrawingLayer[][]>([]);
  const [redoStack, setRedoStack] = useState<DrawingLayer[][]>([]);
  const [layers, setLayers] = useState<DrawingLayer[]>([
    { id: 'layer-1', name: 'Defensive Setup', visible: true, color: '#ff4444', drawings: [] },
    { id: 'layer-2', name: 'Attacking Pattern', visible: true, color: '#44ff44', drawings: [] },
    { id: 'layer-3', name: 'Set Pieces', visible: true, color: '#4488ff', drawings: [] },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>('layer-1');
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#ffff00');

  // ── Session / Persistence State ──────────────────────────────────────────
  const [currentSessionId, setCurrentSessionId] = useState<number | undefined>();
  const [sessionTitle, setSessionTitle] = useState('New Tactical Session');
  const [sessionDescription, setSessionDescription] = useState('');
  const [sessionType, setSessionType] = useState<'training' | 'match_prep' | 'post_match' | 'set_piece' | 'free'>('free');
  const [opponent, setOpponent] = useState('');
  const [matchDate, setMatchDate] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);
  const [showTemplatesDialog, setShowTemplatesDialog] = useState(false);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [activeTab, setActiveTab] = useState('board');

  // ── Phases ───────────────────────────────────────────────────────────────
  const [phases, setPhases] = useState<TacticalPhaseLocal[]>([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(2000); // ms per phase
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Analysis Notes ────────────────────────────────────────────────────────
  const [notes, setNotes] = useState<AnalysisNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteCategory, setNewNoteCategory] = useState<AnalysisNote['category']>('general');
  const [newNotePriority, setNewNotePriority] = useState<AnalysisNote['priority']>('medium');

  // ── AI Analysis ───────────────────────────────────────────────────────────
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ── tRPC ─────────────────────────────────────────────────────────────────
  const { data: sessions, refetch: refetchSessions } = trpc.advancedTactical.listSessions.useQuery();
  const { data: dbNotes } = trpc.advancedTactical.getNotes.useQuery(
    { sessionId: currentSessionId! },
    { enabled: !!currentSessionId }
  );
  const { data: dbPhases } = trpc.advancedTactical.getPhases.useQuery(
    { sessionId: currentSessionId! },
    { enabled: !!currentSessionId }
  );
  const { data: templates } = trpc.advancedTactical.getTemplates.useQuery();
  const { data: sessionDetail, refetch: refetchSessionDetail } = trpc.advancedTactical.getSession.useQuery(
    { id: currentSessionId! },
    { enabled: false }
  );

  const saveSessionMut = trpc.advancedTactical.saveSession.useMutation();
  const deleteSessionMut = trpc.advancedTactical.deleteSession.useMutation();
  const savePhaseMut = trpc.advancedTactical.savePhase.useMutation();
  const deletePhaseMut = trpc.advancedTactical.deletePhase.useMutation();
  const addNoteMut = trpc.advancedTactical.addNote.useMutation();
  const deleteNoteMut = trpc.advancedTactical.deleteNote.useMutation();
  const saveTemplateMut = trpc.advancedTactical.saveAsTemplate.useMutation();
  const analyzeSessionMut = trpc.advancedTactical.analyzeSession.useMutation();

  // ── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => { setHomePlayers(getFormationPositions(homeFormation, 'home')); }, [homeFormation]);
  useEffect(() => { setAwayPlayers(getFormationPositions(awayFormation, 'away')); }, [awayFormation]);

  useEffect(() => {
    if (dbNotes) setNotes(dbNotes.map((n: any) => ({
      id: n.id, category: n.category, content: n.content, priority: n.priority,
      relatedPhaseId: n.relatedPhaseId, authorName: n.authorName, createdAt: n.createdAt,
    })));
  }, [dbNotes]);

  useEffect(() => {
    if (dbPhases) setPhases(dbPhases.map((p: any) => ({
      id: p.id, phaseNumber: p.phaseNumber, title: p.title, description: p.description,
      homePlayers: p.homePlayers || [], awayPlayers: p.awayPlayers || [], layers: p.layers || [],
    })));
  }, [dbPhases]);

  // ── Canvas Draw ──────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Pitch background
    ctx.fillStyle = '#2d7a2d';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Pitch stripes
    ctx.fillStyle = '#2a7228';
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(i * 150, 0, 75, CANVAS_HEIGHT);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(50, 50, CANVAS_WIDTH - 100, CANVAS_HEIGHT - 100);

    // Centre line
    ctx.beginPath(); ctx.moveTo(CANVAS_WIDTH / 2, 50); ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT - 50); ctx.stroke();

    // Centre circle
    ctx.beginPath(); ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 80, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'white'; ctx.fill();

    // Penalty areas
    ctx.strokeRect(50, 200, 150, 400);
    ctx.strokeRect(50, 300, 60, 200);
    ctx.strokeRect(CANVAS_WIDTH - 200, 200, 150, 400);
    ctx.strokeRect(CANVAS_WIDTH - 110, 300, 60, 200);

    // Corner arcs
    const corners = [[50, 50], [CANVAS_WIDTH - 50, 50], [50, CANVAS_HEIGHT - 50], [CANVAS_WIDTH - 50, CANVAS_HEIGHT - 50]];
    corners.forEach(([cx, cy]) => {
      ctx.beginPath();
      const startAngle = cx < 100 ? (cy < 100 ? 0 : -Math.PI / 2) : (cy < 100 ? Math.PI / 2 : Math.PI);
      ctx.arc(cx, cy, 15, startAngle, startAngle + Math.PI / 2);
      ctx.stroke();
    });

    // Draw all visible layers
    const drawElement = (d: DrawingElement) => {
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 3;
      switch (d.type) {
        case 'line':
          if (d.endX && d.endY) {
            ctx.beginPath(); ctx.moveTo(d.startX, d.startY); ctx.lineTo(d.endX, d.endY); ctx.stroke();
          }
          break;
        case 'arrow':
          if (d.endX && d.endY) {
            ctx.beginPath(); ctx.moveTo(d.startX, d.startY); ctx.lineTo(d.endX, d.endY); ctx.stroke();
            const angle = Math.atan2(d.endY - d.startY, d.endX - d.startX);
            const hl = 15;
            ctx.beginPath();
            ctx.moveTo(d.endX, d.endY);
            ctx.lineTo(d.endX - hl * Math.cos(angle - Math.PI / 6), d.endY - hl * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(d.endX, d.endY);
            ctx.lineTo(d.endX - hl * Math.cos(angle + Math.PI / 6), d.endY - hl * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
          }
          break;
        case 'circle':
          if (d.radius) { ctx.beginPath(); ctx.arc(d.startX, d.startY, d.radius, 0, Math.PI * 2); ctx.stroke(); }
          break;
        case 'rect':
          if (d.endX && d.endY) ctx.strokeRect(d.startX, d.startY, d.endX - d.startX, d.endY - d.startY);
          break;
      }
    };

    layers.forEach(layer => { if (!layer.visible) return; layer.drawings.forEach(drawElement); });

    // Current drawing preview
    if (currentDrawing && currentDrawing.endX && currentDrawing.endY) {
      ctx.globalAlpha = 0.6;
      drawElement(currentDrawing);
      ctx.globalAlpha = 1;
    }

    // Draw players
    const drawPlayer = (player: Player) => {
      const isHome = player.team === 'home';
      const isSelected = selectedPlayer?.id === player.id;

      // Shadow
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = 6;

      // Player circle
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = isHome ? '#1a56db' : '#dc2626';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#fbbf24' : 'white';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      ctx.shadowBlur = 0;

      // Number
      ctx.fillStyle = 'white';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(player.number), player.x, player.y);

      // Label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 10px Arial';
      ctx.fillText(player.label, player.x, player.y + PLAYER_RADIUS + 12);

      if (isSelected) {
        ctx.beginPath();
        ctx.arc(player.x, player.y, PLAYER_RADIUS + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    };

    homePlayers.forEach(drawPlayer);
    awayPlayers.forEach(drawPlayer);
  }, [homePlayers, awayPlayers, selectedPlayer, layers, currentDrawing]);

  // ── Canvas Events ─────────────────────────────────────────────────────────
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (drawingTool !== 'none' && drawingTool !== 'eraser') {
      setIsDrawing(true);
      setCurrentDrawing({ id: Date.now().toString(), type: drawingTool, startX: x, startY: y, color: drawingColor });
      return;
    }
    if (drawingTool === 'eraser') {
      setLayers(prev => prev.map(l =>
        l.id === activeLayerId
          ? { ...l, drawings: l.drawings.filter(d => Math.sqrt((d.startX - x) ** 2 + (d.startY - y) ** 2) > 30) }
          : l
      ));
      return;
    }
    const clicked = [...homePlayers, ...awayPlayers].find(p => Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) <= PLAYER_RADIUS);
    setSelectedPlayer(clicked || null);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    if (isDrawing && currentDrawing) {
      setCurrentDrawing(prev => prev ? { ...prev, endX: x, endY: y } : null);
      return;
    }
    if (selectedPlayer && e.buttons === 1) {
      if (selectedPlayer.team === 'home') {
        setHomePlayers(prev => prev.map(p => p.id === selectedPlayer.id ? { ...p, x, y } : p));
      } else {
        setAwayPlayers(prev => prev.map(p => p.id === selectedPlayer.id ? { ...p, x, y } : p));
      }
      setSelectedPlayer(prev => prev ? { ...prev, x, y } : null);
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing && currentDrawing && currentDrawing.endX && currentDrawing.endY) {
      let final = { ...currentDrawing, color: drawingColor };
      if (currentDrawing.type === 'circle') {
        final.radius = Math.sqrt((currentDrawing.endX - currentDrawing.startX) ** 2 + (currentDrawing.endY - currentDrawing.startY) ** 2);
      }
      setUndoStack(prev => [...prev, layers.map(l => ({ ...l, drawings: [...l.drawings] }))]);
      setRedoStack([]);
      setLayers(prev => prev.map(l => l.id === activeLayerId ? { ...l, drawings: [...l.drawings, final] } : l));
      setCurrentDrawing(null);
    }
    setIsDrawing(false);
  };

  const handleUndo = useCallback(() => {
    if (!undoStack.length) return;
    setRedoStack(r => [...r, layers.map(l => ({ ...l, drawings: [...l.drawings] }))]);
    setLayers(undoStack[undoStack.length - 1]);
    setUndoStack(u => u.slice(0, -1));
  }, [undoStack, layers]);

  const handleRedo = useCallback(() => {
    if (!redoStack.length) return;
    setUndoStack(u => [...u, layers.map(l => ({ ...l, drawings: [...l.drawings] }))]);
    setLayers(redoStack[redoStack.length - 1]);
    setRedoStack(r => r.slice(0, -1));
  }, [redoStack, layers]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo]);

  // ── Layer Management ──────────────────────────────────────────────────────
  const addLayer = () => {
    const colors = ['#ff6600', '#00ffff', '#ff00ff', '#ffff00', '#ff4444', '#44ff44'];
    const newLayer: DrawingLayer = {
      id: `layer-${Date.now()}`, name: `Layer ${layers.length + 1}`,
      visible: true, color: colors[layers.length % colors.length], drawings: [],
    };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
  };

  const toggleLayerVisibility = (id: string) => setLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  const deleteLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers(prev => prev.filter(l => l.id !== id));
    if (activeLayerId === id) setActiveLayerId(layers[0].id);
  };
  const renameLayer = (id: string, name: string) => setLayers(prev => prev.map(l => l.id === id ? { ...l, name } : l));

  // ── Board Actions ─────────────────────────────────────────────────────────
  const resetBoard = () => {
    setHomePlayers(getFormationPositions(homeFormation, 'home'));
    setAwayPlayers(getFormationPositions(awayFormation, 'away'));
    setLayers(prev => prev.map(l => ({ ...l, drawings: [] })));
    setUndoStack([]); setRedoStack([]); setSelectedPlayer(null);
    toast.success('Board reset!');
  };

  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `tactical-${sessionTitle.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Image exported!');
  };

  // ── Session Save/Load ─────────────────────────────────────────────────────
  const handleSaveSession = async () => {
    try {
      const thumbnailData = canvasRef.current?.toDataURL('image/png', 0.3);
      const result = await saveSessionMut.mutateAsync({
        id: currentSessionId,
        title: sessionTitle,
        description: sessionDescription,
        sessionType,
        homeFormation,
        awayFormation,
        homeTeamName,
        awayTeamName,
        homePlayers,
        awayPlayers,
        layers,
        opponent: opponent || undefined,
        matchDate: matchDate || undefined,
        thumbnailData,
      });
      setCurrentSessionId(result.id);
      refetchSessions();
      setShowSaveDialog(false);
      toast.success('Session saved to database!');
    } catch {
      toast.error('Failed to save session');
    }
  };

  const handleLoadSession = (session: any) => {
    setCurrentSessionId(session.id);
    setSessionTitle(session.title);
    setSessionDescription(session.description || '');
    setSessionType(session.sessionType || 'free');
    setOpponent(session.opponent || '');
    setMatchDate(session.matchDate || '');
    setHomeTeamName(session.homeTeamName || 'Our Team');
    setAwayTeamName(session.awayTeamName || 'Opponent');
    setHomeFormation((session.homeFormation as Formation) || '4-3-3');
    setAwayFormation((session.awayFormation as Formation) || '4-4-2');
    setShowLoadDialog(false);
    toast.success(`Loaded: ${session.title}`);
  };

  // Load full session data (players + layers) when sessionDetail arrives
  useEffect(() => {
    if (!sessionDetail) return;
    if ((sessionDetail as any).homePlayers?.length) setHomePlayers((sessionDetail as any).homePlayers);
    if ((sessionDetail as any).awayPlayers?.length) setAwayPlayers((sessionDetail as any).awayPlayers);
    if ((sessionDetail as any).layers?.length) setLayers((sessionDetail as any).layers);
  }, [sessionDetail]);

  // ── Phase Management ──────────────────────────────────────────────────────
  const captureCurrentAsPhase = async () => {
    if (!currentSessionId) {
      toast.error('Save the session first before adding phases');
      return;
    }
    const phaseNumber = phases.length + 1;
    const title = `Phase ${phaseNumber}`;
    try {
      const result = await savePhaseMut.mutateAsync({
        sessionId: currentSessionId,
        phaseNumber,
        title,
        homePlayers,
        awayPlayers,
        layers,
      });
      const newPhase: TacticalPhaseLocal = {
        id: result.id, phaseNumber, title,
        homePlayers: [...homePlayers], awayPlayers: [...awayPlayers], layers: JSON.parse(JSON.stringify(layers)),
      };
      setPhases(prev => [...prev, newPhase]);
      setCurrentPhaseIndex(phases.length);
      toast.success(`Phase ${phaseNumber} captured!`);
    } catch {
      toast.error('Failed to save phase');
    }
  };

  const loadPhase = (phase: TacticalPhaseLocal) => {
    setHomePlayers(phase.homePlayers);
    setAwayPlayers(phase.awayPlayers);
    setLayers(phase.layers);
    toast.success(`Loaded: ${phase.title}`);
  };

  // ── Auto-Play ─────────────────────────────────────────────────────────────
  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = null;
    }
    setIsAutoPlaying(false);
  }, []);

  const startAutoPlay = useCallback(() => {
    if (phases.length < 2) {
      toast.error('Need at least 2 phases to auto-play');
      return;
    }
    // Start from phase 0 if none selected, or from current
    const startIdx = currentPhaseIndex === null ? 0 : currentPhaseIndex;
    let idx = startIdx;
    // Load first phase immediately
    loadPhase(phases[idx]);
    setCurrentPhaseIndex(idx);
    setActiveTab('board');
    setIsAutoPlaying(true);
    autoPlayRef.current = setInterval(() => {
      setCurrentPhaseIndex(prev => {
        const next = (prev === null ? 0 : prev) + 1;
        if (next >= phases.length) {
          // Reached end — stop
          if (autoPlayRef.current) clearInterval(autoPlayRef.current);
          autoPlayRef.current = null;
          setIsAutoPlaying(false);
          toast.success('Auto-play complete');
          return prev;
        }
        loadPhase(phases[next]);
        return next;
      });
    }, autoPlaySpeed);
  }, [phases, currentPhaseIndex, autoPlaySpeed, loadPhase]);

  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlaying) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  }, [isAutoPlaying, startAutoPlay, stopAutoPlay]);

  // Cleanup interval on unmount
  useEffect(() => { return () => { if (autoPlayRef.current) clearInterval(autoPlayRef.current); }; }, []);

  const deletePhase = async (phase: TacticalPhaseLocal, idx: number) => {
    if (phase.id) {
      try { await deletePhaseMut.mutateAsync({ id: phase.id }); } catch { toast.error('Failed to delete phase'); return; }
    }
    setPhases(prev => prev.filter((_, i) => i !== idx));
    if (currentPhaseIndex === idx) setCurrentPhaseIndex(null);
    toast.success('Phase deleted');
  };

  // ── Analysis Notes ────────────────────────────────────────────────────────
  const addNote = async () => {
    if (!newNoteContent.trim()) return;
    if (!currentSessionId) {
      // Local only
      setNotes(prev => [...prev, { category: newNoteCategory, content: newNoteContent, priority: newNotePriority }]);
      setNewNoteContent('');
      return;
    }
    try {
      const result = await addNoteMut.mutateAsync({
        sessionId: currentSessionId,
        category: newNoteCategory,
        content: newNoteContent,
        priority: newNotePriority,
      });
      setNotes(prev => [...prev, { id: result.id, category: newNoteCategory, content: newNoteContent, priority: newNotePriority }]);
      setNewNoteContent('');
      toast.success('Note added');
    } catch {
      toast.error('Failed to add note');
    }
  };

  const deleteNote = async (note: AnalysisNote, idx: number) => {
    if (note.id && currentSessionId) {
      try { await deleteNoteMut.mutateAsync({ id: note.id }); } catch { toast.error('Failed to delete note'); return; }
    }
    setNotes(prev => prev.filter((_, i) => i !== idx));
  };

  // ── AI Analysis ───────────────────────────────────────────────────────────
  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeSessionMut.mutateAsync({
        sessionId: currentSessionId,
        homeFormation,
        awayFormation,
        homeTeamName,
        awayTeamName,
        sessionType,
        notes: notes.map(n => `[${n.category}] ${n.content}`).join('\n') || undefined,
        phases: phases.map(p => ({ title: p.title, description: p.description })),
      });
      setAiAnalysis(result.analysis);
      setShowAnalysisPanel(true);
      toast.success('AI analysis complete!');
    } catch {
      toast.error('AI analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── Save as Template ──────────────────────────────────────────────────────
  const saveAsTemplate = async () => {
    try {
      await saveTemplateMut.mutateAsync({
        name: sessionTitle,
        category: 'custom',
        homeFormation,
        awayFormation,
        homePlayers,
        awayPlayers,
        layers,
        description: sessionDescription,
      });
      toast.success('Saved as template!');
    } catch {
      toast.error('Failed to save template');
    }
  };

  const loadTemplate = (template: any) => {
    if (template.homeFormation) setHomeFormation(template.homeFormation as Formation);
    if (template.awayFormation) setAwayFormation(template.awayFormation as Formation);
    if (template.homePlayers?.length) setHomePlayers(template.homePlayers);
    if (template.awayPlayers?.length) setAwayPlayers(template.awayPlayers);
    if (template.layers?.length) setLayers(template.layers);
    setShowTemplatesDialog(false);
    toast.success(`Template loaded: ${template.name}`);
  };

  if (authLoading) return <DashboardLayoutSkeleton />;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/advanced-tactical-hub')} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Advanced Tactical Board
              </h1>
              {currentSessionId && (
                <p className="text-xs text-muted-foreground">Session #{currentSessionId} — {sessionTitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowLoadDialog(true)}>
              <FolderOpen className="h-4 w-4 mr-1" /> Load
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowTemplatesDialog(true)}>
              <BookOpen className="h-4 w-4 mr-1" /> Templates
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
            <Button variant="outline" size="sm" onClick={saveAsTemplate}>
              <Copy className="h-4 w-4 mr-1" /> Save as Template
            </Button>
            <Button variant="default" size="sm" onClick={runAIAnalysis} disabled={isAnalyzing}>
              <Sparkles className="h-4 w-4 mr-1" />
              {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
            </Button>
          </div>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="board">Board</TabsTrigger>
            <TabsTrigger value="phases">Phases ({phases.length})</TabsTrigger>
            <TabsTrigger value="notes">Analysis Notes ({notes.length})</TabsTrigger>
            {aiAnalysis && <TabsTrigger value="ai">AI Report</TabsTrigger>}
          </TabsList>

          {/* ── Board Tab ── */}
          <TabsContent value="board" className="space-y-4">
            {/* Controls Row */}
            <Card>
              <CardContent className="pt-4 space-y-4">
                {/* Team Names + Formations */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-600 dark:text-blue-400">Home Team (Blue)</label>
                    <Input value={homeTeamName} onChange={e => setHomeTeamName(e.target.value)} placeholder="Team name" className="h-8 text-sm" />
                    <Select value={homeFormation} onValueChange={v => setHomeFormation(v as Formation)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['4-3-3','4-4-2','3-5-2','4-2-3-1','3-4-3','5-3-2'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-red-600 dark:text-red-400">Away Team (Red)</label>
                    <Input value={awayTeamName} onChange={e => setAwayTeamName(e.target.value)} placeholder="Team name" className="h-8 text-sm" />
                    <Select value={awayFormation} onValueChange={v => setAwayFormation(v as Formation)}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {['4-3-3','4-4-2','3-5-2','4-2-3-1','3-4-3','5-3-2'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Drawing Tools */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Drawing Tools</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { tool: 'none' as DrawingTool, icon: <Users className="h-3.5 w-3.5" />, label: 'Move' },
                      { tool: 'line' as DrawingTool, icon: <Pencil className="h-3.5 w-3.5" />, label: 'Line' },
                      { tool: 'arrow' as DrawingTool, icon: <ArrowRight className="h-3.5 w-3.5" />, label: 'Arrow' },
                      { tool: 'circle' as DrawingTool, icon: <Circle className="h-3.5 w-3.5" />, label: 'Circle' },
                      { tool: 'rect' as DrawingTool, icon: <Square className="h-3.5 w-3.5" />, label: 'Rect' },
                      { tool: 'eraser' as DrawingTool, icon: <Eraser className="h-3.5 w-3.5" />, label: 'Erase' },
                    ].map(({ tool, icon, label }) => (
                      <Button key={tool} variant={drawingTool === tool ? 'default' : 'outline'} size="sm" className="h-8 px-2 text-xs" onClick={() => setDrawingTool(tool)}>
                        {icon}<span className="ml-1">{label}</span>
                      </Button>
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="text-xs text-muted-foreground">Color:</span>
                      <input type="color" value={drawingColor} onChange={e => setDrawingColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer border border-border" />
                    </div>
                    <Button onClick={handleUndo} variant="outline" size="sm" className="h-8 px-2" disabled={!undoStack.length} title="Undo (Ctrl+Z)">
                      <Undo2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button onClick={handleRedo} variant="outline" size="sm" className="h-8 px-2" disabled={!redoStack.length} title="Redo (Ctrl+Y)">
                      <Redo2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Layers */}
                <div>
                  <button onClick={() => setShowLayersPanel(p => !p)} className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                    <Layers className="h-4 w-4" /> Drawing Layers {showLayersPanel ? '▲' : '▼'}
                  </button>
                  {showLayersPanel && (
                    <div className="mt-2 bg-muted/30 rounded-lg p-3 space-y-1.5 border border-border">
                      {layers.map(layer => (
                        <div key={layer.id} className={`flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors ${activeLayerId === layer.id ? 'bg-primary/20 border border-primary/40' : 'hover:bg-muted'}`}
                          onClick={() => { setActiveLayerId(layer.id); setDrawingColor(layer.color); }}>
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: layer.color }} />
                          <input
                            className="text-xs flex-1 bg-transparent border-none outline-none font-medium"
                            value={layer.name}
                            onChange={e => renameLayer(layer.id, e.target.value)}
                            onClick={e => e.stopPropagation()}
                          />
                          <span className="text-xs text-muted-foreground">{layer.drawings.length} shapes</span>
                          <button onClick={e => { e.stopPropagation(); toggleLayerVisibility(layer.id); }} className="p-1 hover:bg-muted rounded">
                            {layer.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                          </button>
                          <button onClick={e => { e.stopPropagation(); deleteLayer(layer.id); }} className="p-1 hover:bg-destructive/20 rounded">
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </button>
                        </div>
                      ))}
                      <button onClick={addLayer} className="w-full flex items-center justify-center gap-1 text-xs py-1.5 rounded-md border border-dashed border-border hover:bg-muted transition-colors">
                        <Plus className="h-3 w-3" /> Add Layer
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 items-center">
                  <Button onClick={resetBoard} variant="outline" size="sm"><RotateCcw className="h-4 w-4 mr-1" />Reset</Button>
                  <Button onClick={exportImage} variant="outline" size="sm"><Download className="h-4 w-4 mr-1" />Export PNG</Button>
                  <Button onClick={captureCurrentAsPhase} variant="outline" size="sm" disabled={!currentSessionId}>
                    <Plus className="h-4 w-4 mr-1" />Capture as Phase
                  </Button>
                  {phases.length > 1 && (
                    <Button
                      size="sm"
                      variant={isAutoPlaying ? 'destructive' : 'secondary'}
                      className="gap-1.5"
                      onClick={toggleAutoPlay}
                    >
                      {isAutoPlaying ? <><Pause className="h-3.5 w-3.5" />Stop Auto-Play</> : <><Play className="h-3.5 w-3.5" />Auto-Play Phases</>}
                    </Button>
                  )}
                  {isAutoPlaying && currentPhaseIndex !== null && (
                    <Badge variant="outline" className="text-primary border-primary animate-pulse">
                      Phase {currentPhaseIndex + 1} / {phases.length}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Canvas */}
            <Card>
              <CardContent className="p-2">
                <div className="w-full overflow-x-auto">
                  <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="border border-border rounded-lg cursor-crosshair w-full max-w-full"
                    style={{ aspectRatio: `${CANVAS_WIDTH}/${CANVAS_HEIGHT}` }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-blue-600 border-blue-300">Blue = {homeTeamName}</Badge>
                  <Badge variant="outline" className="text-red-600 border-red-300">Red = {awayTeamName}</Badge>
                  <span>• Drag players to reposition • Use drawing tools to annotate</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Phases Tab ── */}
          <TabsContent value="phases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Tactical Phases</span>
                  <Button size="sm" onClick={captureCurrentAsPhase} disabled={!currentSessionId}>
                    <Plus className="h-4 w-4 mr-1" />Capture Current Board
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!currentSessionId && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Save className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Save the session first to enable multi-phase capture</p>
                    <Button className="mt-3" size="sm" onClick={() => setShowSaveDialog(true)}>Save Session</Button>
                  </div>
                )}
                {phases.length === 0 && currentSessionId && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No phases yet. Set up the board and click "Capture Current Board" to add a phase.</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {phases.map((phase, idx) => (
                    <div key={idx} className={`border rounded-lg p-4 cursor-pointer transition-colors ${currentPhaseIndex === idx ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="font-medium text-sm">Phase {phase.phaseNumber}: {phase.title}</span>
                          {phase.description && <p className="text-xs text-muted-foreground mt-0.5">{phase.description}</p>}
                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => { loadPhase(phase); setCurrentPhaseIndex(idx); setActiveTab('board'); }}>
                            <ChevronRight className="h-3 w-3 mr-1" />Load
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive" onClick={() => deletePhase(phase, idx)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {phase.layers.reduce((acc, l) => acc + l.drawings.length, 0)} drawings across {phase.layers.length} layers
                      </div>
                    </div>
                  ))}
                </div>
                {phases.length > 1 && (
                  <div className="mt-4 space-y-3">
                    {/* Progress bar */}
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 bg-primary rounded-full transition-all duration-500"
                        style={{ width: currentPhaseIndex !== null ? `${((currentPhaseIndex + 1) / phases.length) * 100}%` : '0%' }}
                      />
                    </div>
                    {/* Phase dots */}
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {phases.map((p, i) => (
                        <button
                          key={i}
                          title={`Phase ${p.phaseNumber}: ${p.title}`}
                          onClick={() => { loadPhase(phases[i]); setCurrentPhaseIndex(i); setActiveTab('board'); }}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            currentPhaseIndex === i ? 'bg-primary scale-125' : 'bg-muted-foreground/40 hover:bg-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    {/* Controls row */}
                    <div className="flex items-center gap-2 justify-center flex-wrap">
                      {/* Skip to start */}
                      <Button variant="outline" size="sm" className="h-8 px-2"
                        disabled={isAutoPlaying || currentPhaseIndex === null || currentPhaseIndex === 0}
                        onClick={() => { loadPhase(phases[0]); setCurrentPhaseIndex(0); setActiveTab('board'); }}>
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      {/* Prev */}
                      <Button variant="outline" size="sm" className="h-8 px-2"
                        disabled={isAutoPlaying || currentPhaseIndex === null || currentPhaseIndex === 0}
                        onClick={() => { const idx = (currentPhaseIndex ?? 1) - 1; loadPhase(phases[idx]); setCurrentPhaseIndex(idx); setActiveTab('board'); }}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      {/* Play / Pause */}
                      <Button
                        size="sm"
                        className={`h-8 px-4 gap-1.5 ${isAutoPlaying ? 'bg-destructive hover:bg-destructive/90 text-white' : 'bg-primary text-primary-foreground'}`}
                        onClick={toggleAutoPlay}
                        disabled={phases.length < 2}
                      >
                        {isAutoPlaying ? <><Pause className="h-4 w-4" />Pause</> : <><Play className="h-4 w-4" />Auto-Play</>}
                      </Button>
                      {/* Next */}
                      <Button variant="outline" size="sm" className="h-8 px-2"
                        disabled={isAutoPlaying || currentPhaseIndex === null || currentPhaseIndex >= phases.length - 1}
                        onClick={() => { const idx = (currentPhaseIndex ?? -1) + 1; loadPhase(phases[idx]); setCurrentPhaseIndex(idx); setActiveTab('board'); }}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                      {/* Skip to end */}
                      <Button variant="outline" size="sm" className="h-8 px-2"
                        disabled={isAutoPlaying || currentPhaseIndex === null || currentPhaseIndex >= phases.length - 1}
                        onClick={() => { const last = phases.length - 1; loadPhase(phases[last]); setCurrentPhaseIndex(last); setActiveTab('board'); }}>
                        <SkipForward className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Phase label + speed */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-sm text-muted-foreground">
                        {currentPhaseIndex !== null
                          ? `Phase ${currentPhaseIndex + 1} of ${phases.length}: ${phases[currentPhaseIndex]?.title}`
                          : 'No phase selected'}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Speed:</span>
                        <Select
                          value={String(autoPlaySpeed)}
                          onValueChange={v => { setAutoPlaySpeed(Number(v)); if (isAutoPlaying) { stopAutoPlay(); } }}
                        >
                          <SelectTrigger className="h-7 w-24 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1000" className="text-xs">Fast (1s)</SelectItem>
                            <SelectItem value="2000" className="text-xs">Normal (2s)</SelectItem>
                            <SelectItem value="3000" className="text-xs">Slow (3s)</SelectItem>
                            <SelectItem value="5000" className="text-xs">Very Slow (5s)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Notes Tab ── */}
          <TabsContent value="notes" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Analysis Notes</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {/* Add note form */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-medium mb-1 block">Category</label>
                      <Select value={newNoteCategory} onValueChange={v => setNewNoteCategory(v as AnalysisNote['category'])}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {['strength','weakness','opportunity','threat','general','set_piece','pressing','transition'].map(c => (
                            <SelectItem key={c} value={c} className="text-xs capitalize">{c.replace('_', ' ')}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium mb-1 block">Priority</label>
                      <Select value={newNotePriority} onValueChange={v => setNewNotePriority(v as AnalysisNote['priority'])}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high" className="text-xs">High</SelectItem>
                          <SelectItem value="medium" className="text-xs">Medium</SelectItem>
                          <SelectItem value="low" className="text-xs">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Add a tactical observation, instruction, or note..."
                    value={newNoteContent}
                    onChange={e => setNewNoteContent(e.target.value)}
                    className="text-sm min-h-[80px]"
                  />
                  <Button size="sm" onClick={addNote} disabled={!newNoteContent.trim()}>
                    <Plus className="h-4 w-4 mr-1" />Add Note
                  </Button>
                </div>

                {/* Notes list */}
                {notes.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground text-sm">No notes yet. Add tactical observations above.</div>
                )}
                <div className="space-y-2">
                  {notes.map((note, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${NOTE_PRIORITY_COLORS[note.priority]}`}>
                      <div className="mt-0.5 shrink-0">{NOTE_CATEGORY_ICONS[note.category]}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">{note.category.replace('_', ' ')}</Badge>
                          <Badge variant="outline" className="text-xs capitalize px-1.5 py-0">{note.priority}</Badge>
                          {note.authorName && <span className="text-xs opacity-70">by {note.authorName}</span>}
                        </div>
                        <p className="text-sm leading-relaxed">{note.content}</p>
                      </div>
                      <button onClick={() => deleteNote(note, idx)} className="shrink-0 p-1 hover:bg-black/10 rounded">
                        <Trash2 className="h-3.5 w-3.5 opacity-60" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── AI Report Tab ── */}
          {aiAnalysis && (
            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Tactical Analysis
                    {aiAnalysis.successProbability && (
                      <Badge variant="outline" className="ml-auto text-sm font-bold">
                        {aiAnalysis.successProbability}% Success Probability
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {aiAnalysis.overallAssessment && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Overall Assessment</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.overallAssessment}</p>
                    </div>
                  )}
                  {aiAnalysis.formationMatchup && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Formation Matchup — {homeFormation} vs {awayFormation}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{aiAnalysis.formationMatchup}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiAnalysis.strengths?.length > 0 && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h3 className="font-semibold text-sm text-green-700 dark:text-green-400 mb-2 flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />Strengths
                        </h3>
                        <ul className="space-y-1">
                          {aiAnalysis.strengths.map((s: string, i: number) => <li key={i} className="text-xs text-green-800 dark:text-green-300">• {s}</li>)}
                        </ul>
                      </div>
                    )}
                    {aiAnalysis.vulnerabilities?.length > 0 && (
                      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <h3 className="font-semibold text-sm text-red-700 dark:text-red-400 mb-2 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />Vulnerabilities
                        </h3>
                        <ul className="space-y-1">
                          {aiAnalysis.vulnerabilities.map((v: string, i: number) => <li key={i} className="text-xs text-red-800 dark:text-red-300">• {v}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                  {aiAnalysis.keyBattles?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2 flex items-center gap-1"><Shield className="h-4 w-4" />Key Battles</h3>
                      <div className="flex flex-wrap gap-2">
                        {aiAnalysis.keyBattles.map((b: string, i: number) => <Badge key={i} variant="secondary" className="text-xs">{b}</Badge>)}
                      </div>
                    </div>
                  )}
                  {aiAnalysis.recommendations?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2 flex items-center gap-1"><Zap className="h-4 w-4" />Tactical Recommendations</h3>
                      <div className="space-y-2">
                        {aiAnalysis.recommendations.map((r: any, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg">
                            <Badge variant={r.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs shrink-0 mt-0.5">{r.phase}</Badge>
                            <p className="text-sm">{r.instruction}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiAnalysis.pressureTriggers?.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-sm mb-2">Pressure Triggers</h3>
                      <ul className="space-y-1">
                        {aiAnalysis.pressureTriggers.map((t: string, i: number) => <li key={i} className="text-sm text-muted-foreground">• {t}</li>)}
                      </ul>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiAnalysis.setPieceAdvantages && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <h3 className="font-semibold text-xs text-purple-700 dark:text-purple-400 mb-1 flex items-center gap-1">
                          <Flag className="h-3.5 w-3.5" />Set Piece Advantages
                        </h3>
                        <p className="text-xs text-purple-800 dark:text-purple-300">{aiAnalysis.setPieceAdvantages}</p>
                      </div>
                    )}
                    {aiAnalysis.substitutionStrategy && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h3 className="font-semibold text-xs text-blue-700 dark:text-blue-400 mb-1">Substitution Strategy</h3>
                        <p className="text-xs text-blue-800 dark:text-blue-300">{aiAnalysis.substitutionStrategy}</p>
                      </div>
                    )}
                  </div>
                  <Button variant="outline" size="sm" onClick={runAIAnalysis} disabled={isAnalyzing}>
                    <Sparkles className="h-4 w-4 mr-1" />{isAnalyzing ? 'Re-analyzing...' : 'Re-run Analysis'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* ── Save Dialog ── */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Save Tactical Session</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input value={sessionTitle} onChange={e => setSessionTitle(e.target.value)} placeholder="e.g. vs Al Ahly — Match Prep" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea value={sessionDescription} onChange={e => setSessionDescription(e.target.value)} placeholder="Optional notes..." className="mt-1 min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Session Type</label>
                <Select value={sessionType} onValueChange={v => setSessionType(v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="match_prep">Match Prep</SelectItem>
                    <SelectItem value="post_match">Post Match</SelectItem>
                    <SelectItem value="set_piece">Set Piece</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Opponent</label>
                <Input value={opponent} onChange={e => setOpponent(e.target.value)} placeholder="e.g. Al Ahly" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Match Date</label>
              <Input type="date" value={matchDate} onChange={e => setMatchDate(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveSession} disabled={saveSessionMut.isPending}>
              {saveSessionMut.isPending ? 'Saving...' : currentSessionId ? 'Update Session' : 'Save Session'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Load Dialog ── */}
      <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Load Tactical Session</DialogTitle></DialogHeader>
          {!sessions?.length && <p className="text-sm text-muted-foreground text-center py-6">No saved sessions yet.</p>}
          <div className="space-y-2">
            {sessions?.map((session: any) => (
              <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => handleLoadSession(session)}>
                <div>
                  <p className="font-medium text-sm">{session.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {session.homeFormation} vs {session.awayFormation}
                    {session.opponent && ` • vs ${session.opponent}`}
                    {session.matchDate && ` • ${session.matchDate}`}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{session.sessionType?.replace('_', ' ')}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="h-7 text-xs">Load</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-destructive"
                    onClick={async e => { e.stopPropagation(); await deleteSessionMut.mutateAsync({ id: session.id }); refetchSessions(); }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Templates Dialog ── */}
      <Dialog open={showTemplatesDialog} onOpenChange={setShowTemplatesDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Tactical Templates</DialogTitle></DialogHeader>
          {!templates?.length && <p className="text-sm text-muted-foreground text-center py-6">No templates yet. Save the current board as a template.</p>}
          <div className="space-y-2">
            {templates?.map((template: any) => (
              <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => loadTemplate(template)}>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{template.name}</p>
                    {template.isSystem && <Badge variant="secondary" className="text-xs">System</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{template.category_tt?.replace('_', ' ')} • {template.homeFormation}</p>
                  {template.description && <p className="text-xs text-muted-foreground mt-0.5">{template.description}</p>}
                </div>
                <Button size="sm" variant="outline" className="h-7 text-xs shrink-0">Use</Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
