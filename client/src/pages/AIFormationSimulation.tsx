import { useState, useEffect, useRef } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { useLocation } from 'wouter';
import {Play, Pause, RotateCcw, Sparkles, Loader2, FastForward, Rewind, GitCompare, Download, ArrowLeft, CheckCircle2, BookmarkPlus, Save, Upload, Camera, Clock} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import { AIBreadcrumb } from "@/components/AIBreadcrumb";
import { useLanguage } from '@/contexts/LanguageContext';


type Formation = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';
type TacticalScenario = 'attack' | 'defense' | 'counter' | 'possession';

interface Player {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  team: 'home' | 'away';
  number: number;
  label: string;
  role: string;
}

interface MovementKeyframe {
  time: number;
  description: string;
  players: { id: string; x: number; y: number }[];
}

export default function AIFormationSimulation() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const canvasRef1 = useRef<HTMLCanvasElement>(null);
  const canvasRef2 = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  const { t, language } = useLanguage();
  const [comparisonMode, setComparisonMode] = useState(false);
  
  // Formation 1 (left side)
  const [formation1, setFormation1] = useState<Formation>('4-3-3');
  const [scenario1, setScenario1] = useState<TacticalScenario>('attack');
  const [players1, setPlayers1] = useState<Player[]>([]);
  const [keyframes1, setKeyframes1] = useState<MovementKeyframe[]>([]);
  const [description1, setDescription1] = useState('');
  
  // Formation 2 (right side - for comparison)
  const [formation2, setFormation2] = useState<Formation>('4-4-2');
  const [scenario2, setScenario2] = useState<TacticalScenario>('attack');
  const [players2, setPlayers2] = useState<Player[]>([]);
  const [keyframes2, setKeyframes2] = useState<MovementKeyframe[]>([]);
  const [description2, setDescription2] = useState('');
  
  // Shared controls
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [comparisonInsights, setComparisonInsights] = useState('');
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateNotes, setTemplateNotes] = useState('');
  const [savedTemplates, setSavedTemplates] = useState<Array<{name: string; formation: Formation; scenario: TacticalScenario; notes: string; savedAt: string}>>(() => {
    try {
      return JSON.parse(localStorage.getItem('formationTemplates') || '[]');
    } catch { return []; }
  });
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareTemplateIndex, setShareTemplateIndex] = useState<number | null>(null);
  const [scrubberPosition, setScrubberPosition] = useState(0);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formationHistory, setFormationHistory] = useState<Array<{id: string; formation: Formation; scenario: TacticalScenario; timestamp: string; description: string}>>(() => {
    try {
      return JSON.parse(localStorage.getItem('formationHistory') || '[]');
    } catch { return []; }
  });
  const [showCustomizeDialog, setShowCustomizeDialog] = useState(false);
  const [customInfo, setCustomInfo] = useState<{title: string; subtitle: string; notes: string}>(() => {
    try {
      return JSON.parse(localStorage.getItem('formationCustomInfo') || '{"title": "Formation Analysis", "subtitle": "Tactical Breakdown", "notes": ""}');
    } catch { return {title: 'Formation Analysis', subtitle: 'Tactical Breakdown', notes: ''}; }
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'pen' | 'arrow' | 'circle' | 'text' | null>(null);
  const [drawingColor, setDrawingColor] = useState('#FF0000');
  const [playerBgColor, setPlayerBgColor] = useState('#3b82f6');
  const [playerTextColor, setPlayerTextColor] = useState('#ffffff');
  const [pitchColor, setPitchColor] = useState('#2d5016');
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const drawingContextRef = useRef<CanvasRenderingContext2D | null>(null);
  const drawingCanvas2Ref = useRef<HTMLCanvasElement>(null);
  const drawingContext2Ref = useRef<CanvasRenderingContext2D | null>(null);
  const [annotations, setAnnotations] = useState<{canvas1: string; canvas2: string}>(() => {
    try {
      return JSON.parse(localStorage.getItem('formationAnnotations') || '{"canvas1": "", "canvas2": ""}');
    } catch { return {canvas1: '', canvas2: ''}; }
  });
  const [drawingHistory, setDrawingHistory] = useState<{canvas1: string[]; canvas2: string[]}>({canvas1: [], canvas2: []});
  const [historyIndex, setHistoryIndex] = useState<{canvas1: number; canvas2: number}>({canvas1: -1, canvas2: -1});
  const [drawingLayers, setDrawingLayers] = useState<Array<{id: string; name: string; visible: boolean; blendMode: 'normal' | 'multiply' | 'screen' | 'overlay'; opacity: number; data: {canvas1: string; canvas2: string}}>>(() => {
    try {
      return JSON.parse(localStorage.getItem('drawingLayers') || '[]');
    } catch { return []; }
  });
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  const { data: teams } = trpc.teams.getAll.useQuery();

  // Declare all mutations together before any useEffect calls
  const generateSimulationMutation = trpc.aiFormation.generateSimulation.useMutation();
  const compareFormationsMutation = trpc.aiFormation.compareFormations.useMutation();

  // Redirect unauthenticated users - must be in useEffect, not inline render logic

  const handleScreenshot = (canvasRef: React.RefObject<HTMLCanvasElement | null>, label: string) => {
    if (!canvasRef.current) return;
    // Composite pitch canvas + annotation canvas so annotations are preserved
    const pitchCanvas = canvasRef.current;
    const annotCanvas = drawingCanvasRef.current;
    const composite = document.createElement('canvas');
    composite.width = pitchCanvas.width;
    composite.height = pitchCanvas.height;
    const ctx = composite.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(pitchCanvas, 0, 0);
    if (annotCanvas) ctx.drawImage(annotCanvas, 0, 0);
    const link = document.createElement('a');
    link.href = composite.toDataURL('image/png');
    link.download = `formation-${label}-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    toast.success(`Screenshot saved with annotations: ${label}`);
  };

  const handleAddToHistory = () => {
    const newEntry = {
      id: Date.now().toString(),
      formation: formation1,
      scenario: scenario1,
      timestamp: new Date().toLocaleString(),
      description: description1 || `${formation1} - ${scenario1}`
    };
    const updated = [newEntry, ...formationHistory].slice(0, 20); // Keep last 20
    setFormationHistory(updated);
    localStorage.setItem('formationHistory', JSON.stringify(updated));
    toast.success('Formation added to history');
  };

  const handleLoadFromHistory = (entry: typeof formationHistory[0]) => {
    setFormation1(entry.formation);
    setScenario1(entry.scenario);
    toast.success(`Loaded: ${entry.description}`);
  };

  const handleSaveCustomInfo = () => {
    localStorage.setItem('formationCustomInfo', JSON.stringify(customInfo));
    setShowCustomizeDialog(false);
    toast.success('Custom information saved');
  };
  const handleBatchExport = async () => {
    try {
      const zip = new JSZip();
      
      // Add templates
      if (savedTemplates.length > 0) {
        const templatesFolder = zip.folder('templates');
        savedTemplates.forEach((template, idx) => {
          templatesFolder?.file(`template_${idx + 1}.json`, JSON.stringify(template, null, 2));
        });
      }
      
      // Add history
      if (formationHistory.length > 0) {
        const historyFolder = zip.folder('history');
        formationHistory.forEach((entry, idx) => {
          historyFolder?.file(`history_${idx + 1}.json`, JSON.stringify(entry, null, 2));
        });
      }
      
      // Add custom info
      zip.file('custom_info.json', JSON.stringify(customInfo, null, 2));
      
      // Generate and download
      const blob = await zip.generateAsync({type: 'blob'});
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `formation-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      toast.success('Backup exported successfully!');
    } catch (err) {
      toast.error('Failed to export backup');
    }
  };

  const getScaledCoords = (e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingMode) return;
    setIsDrawing(true);
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const { x, y } = getScaledCoords(e, canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingContextRef.current = ctx;
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingMode || !drawingContextRef.current) return;
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const { x, y } = getScaledCoords(e, canvas);
    const ctx = drawingContextRef.current;
    if (drawingMode === 'pen') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (drawingContextRef.current) {
      drawingContextRef.current.closePath();
    }
    setIsDrawing(false);
  };

  const clearDrawing = () => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  const saveAnnotations = () => {
    if (!drawingCanvasRef.current) return;
    const canvas1Data = drawingCanvasRef.current.toDataURL();
    const canvas2Data = drawingCanvas2Ref.current?.toDataURL() || '';
    const updated = {canvas1: canvas1Data, canvas2: canvas2Data};
    setAnnotations(updated);
    localStorage.setItem('formationAnnotations', JSON.stringify(updated));
  };

  const loadAnnotations = () => {
    if (!drawingCanvasRef.current || !annotations.canvas1) return;
    const img = new Image();
    img.onload = () => {
      const ctx = drawingCanvasRef.current?.getContext('2d');
      if (ctx) ctx.drawImage(img, 0, 0);
    };
    img.src = annotations.canvas1;
    
    if (drawingCanvas2Ref.current && annotations.canvas2) {
      const img2 = new Image();
      img2.onload = () => {
        const ctx2 = drawingCanvas2Ref.current?.getContext('2d');
        if (ctx2) ctx2.drawImage(img2, 0, 0);
      };
      img2.src = annotations.canvas2;
    }
  };

  const startDrawing2 = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!drawingMode) return;
    setIsDrawing(true);
    const canvas = drawingCanvas2Ref.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = drawingColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y);
    drawingContext2Ref.current = ctx;
  };

  const draw2 = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !drawingMode || !drawingContext2Ref.current) return;
    
    const canvas = drawingCanvas2Ref.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = drawingContext2Ref.current;
    
    if (drawingMode === 'pen') {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const stopDrawing2 = () => {
    if (drawingContext2Ref.current) {
      drawingContext2Ref.current.closePath();
    }
    setIsDrawing(false);
  };

  const clearDrawing2 = () => {
    const canvas = drawingCanvas2Ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };
  const recordDrawingState = (canvasNum: 1 | 2) => {
    const canvas = canvasNum === 1 ? drawingCanvasRef.current : drawingCanvas2Ref.current;
    if (!canvas) return;
    
    const canvasKey = canvasNum === 1 ? 'canvas1' : 'canvas2';
    const state = canvas.toDataURL();
    
    const newHistory = {...drawingHistory};
    newHistory[canvasKey] = newHistory[canvasKey].slice(0, historyIndex[canvasKey] + 1);
    newHistory[canvasKey].push(state);
    
    setDrawingHistory(newHistory);
    setHistoryIndex({...historyIndex, [canvasKey]: newHistory[canvasKey].length - 1});
  };

  const undo = (canvasNum: 1 | 2) => {
    const canvasKey = canvasNum === 1 ? 'canvas1' : 'canvas2';
    const canvas = canvasNum === 1 ? drawingCanvasRef.current : drawingCanvas2Ref.current;
    if (!canvas || historyIndex[canvasKey] <= 0) return;
    
    const newIndex = historyIndex[canvasKey] - 1;
    const state = drawingHistory[canvasKey][newIndex];
    
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
    };
    img.src = state;
    
    setHistoryIndex({...historyIndex, [canvasKey]: newIndex});
  };

  const redo = (canvasNum: 1 | 2) => {
    const canvasKey = canvasNum === 1 ? 'canvas1' : 'canvas2';
    const canvas = canvasNum === 1 ? drawingCanvasRef.current : drawingCanvas2Ref.current;
    if (!canvas || historyIndex[canvasKey] >= drawingHistory[canvasKey].length - 1) return;
    
    const newIndex = historyIndex[canvasKey] + 1;
    const state = drawingHistory[canvasKey][newIndex];
    
    const img = new Image();
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      }
    };
    img.src = state;
    
    setHistoryIndex({...historyIndex, [canvasKey]: newIndex});
  };

  const createNewLayer = () => {
    const layerId = `layer-${Date.now()}`;
    const newLayer = {
      id: layerId,
      name: `Layer ${drawingLayers.length + 1}`,
      visible: true,
      blendMode: 'normal' as const,
      opacity: 1,
      data: {canvas1: '', canvas2: ''}
    };
    const updated = [...drawingLayers, newLayer];
    setDrawingLayers(updated);
    setActiveLayerId(layerId);
    localStorage.setItem('drawingLayers', JSON.stringify(updated));
  };

  const renameLayer = (layerId: string, newName: string) => {
    const updated = drawingLayers.map((l: any) => l.id === layerId ? {...l, name: newName} : l);
    setDrawingLayers(updated);
    localStorage.setItem('drawingLayers', JSON.stringify(updated));
  };

  const toggleLayerVisibility = (layerId: string) => {
    const updated = drawingLayers.map((l: any) => l.id === layerId ? {...l, visible: !l.visible} : l);
    setDrawingLayers(updated);
    localStorage.setItem('drawingLayers', JSON.stringify(updated));
  };

  const deleteLayer = (layerId: string) => {
    const updated = drawingLayers.filter((l: any) => l.id !== layerId);
    setDrawingLayers(updated);
    if (activeLayerId === layerId) setActiveLayerId(updated.length > 0 ? updated[0].id : null);
    localStorage.setItem('drawingLayers', JSON.stringify(updated));
  };

  const saveCurrentToLayer = (layerId: string) => {
    if (!drawingCanvasRef.current || !drawingCanvas2Ref.current) return;
    const updated = drawingLayers.map((l: any) => 
      l.id === layerId ? {
        ...l,
        data: {
          canvas1: drawingCanvasRef.current?.toDataURL() || '',
          canvas2: drawingCanvas2Ref.current?.toDataURL() || ''
        }
      } : l
    );
    setDrawingLayers(updated);
    localStorage.setItem('drawingLayers', JSON.stringify(updated));
    toast.success(`Saved to layer: ${updated.find(l => l.id === layerId)?.name}`);
  };


  const setLayerBlendMode = (layerId: string, blendMode: 'normal' | 'multiply' | 'screen' | 'overlay') => {
    const updated = drawingLayers.map((l: any) => l.id === layerId ? {...l, blendMode} : l);
    setDrawingLayers(updated);
    localStorage.setItem('drawingLayers', JSON.stringify(updated));
  };

  const setLayerOpacity = (layerId: string, opacity: number) => {
    const updated = drawingLayers.map((l: any) => l.id === layerId ? {...l, opacity: Math.max(0, Math.min(1, opacity))} : l);
    setDrawingLayers(updated);
    localStorage.setItem('drawingLayers', JSON.stringify(updated));
  };

  const createPresetLayer = (presetName: string, description: string) => {
    const layerId = `preset-${presetName}-${Date.now()}`;
    const newLayer = {
      id: layerId,
      name: presetName,
      visible: true,
      blendMode: 'normal' as const,
      opacity: 1,
      data: {canvas1: '', canvas2: ''}
    };
    const updated = [...drawingLayers, newLayer];
    setDrawingLayers(updated);
    setActiveLayerId(layerId);
    localStorage.setItem('drawingLayers', JSON.stringify(updated));
    toast.success(`Created preset layer: ${presetName}`);
  };

  const duplicateLayer = (layerId: string) => {
    const layer = drawingLayers.find(l => l.id === layerId);
    if (!layer) return;

    const newLayerId = `layer-${Date.now()}`;
    const newLayer = {
      ...layer,
      id: newLayerId,
      name: `${layer.name} (Copy)`
    };
    const updated = [...drawingLayers, newLayer];
    setDrawingLayers(updated);
    setActiveLayerId(newLayerId);
    localStorage.setItem('drawingLayers', JSON.stringify(updated));
    toast.success(`Duplicated layer: ${newLayer.name}`);
  };

  const [animationMode, setAnimationMode] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [currentAnimationLayer, setCurrentAnimationLayer] = useState(0);

  const startLayerAnimation = () => {
    if (drawingLayers.length < 2) {
      toast.error('Need at least 2 layers to animate');
      return;
    }
    setAnimationMode(true);
    setCurrentAnimationLayer(0);
  };

  useEffect(() => {
    if (!animationMode || drawingLayers.length < 2) return;

    const interval = setInterval(() => {
      setCurrentAnimationLayer(prev => {
        const next = (prev + 1) % drawingLayers.length;
        if (next === 0) {
          setAnimationMode(false);
          toast.success('Layer animation complete');
        }
        return next;
      });
    }, 2000 / animationSpeed);

    return () => clearInterval(interval);
  }, [animationMode, drawingLayers.length, animationSpeed]);

  useEffect(() => {
    if (!animationMode) return;
    const layer = drawingLayers[currentAnimationLayer];
    if (layer) loadLayerDrawing(layer.id);
  }, [currentAnimationLayer, animationMode]);

  const loadLayerDrawing = (layerId: string) => {
    const layer = drawingLayers.find(l => l.id === layerId);
    if (!layer) return;
    
    const loadCanvas = (canvas: HTMLCanvasElement | null, data: string) => {
      if (!canvas || !data) return;
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
        }
      };
      img.src = data;
    };
    
    loadCanvas(drawingCanvasRef.current, layer.data.canvas1);
    loadCanvas(drawingCanvas2Ref.current, layer.data.canvas2);
    setActiveLayerId(layerId);
    toast.success(`Loaded layer: ${layer.name}`);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          undo(1);
        } else if (e.key === 'y') {
          e.preventDefault();
          redo(1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingHistory, historyIndex]);








    useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
    }
  }, [authLoading, user]);

  // NOTE: CANVAS_WIDTH depends on comparisonMode state
  const CANVAS_WIDTH = comparisonMode ? 600 : 1200;
  const CANVAS_HEIGHT = 800;
  const PLAYER_RADIUS = 20;
  const FPS = 30;

  const getInitialPositions = (formation: Formation): Player[] => {
    const positions: { x: number; y: number; label: string; role: string }[] = [];
    const width = comparisonMode ? 600 : 1200;
    
    switch (formation) {
      case '4-3-3':
        positions.push({ x: width * 0.08, y: 400, label: 'GK', role: 'Goalkeeper' });
        positions.push({ x: width * 0.21, y: 150, label: 'LB', role: 'Left Back' });
        positions.push({ x: width * 0.21, y: 300, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 500, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 650, label: 'RB', role: 'Right Back' });
        positions.push({ x: width * 0.38, y: 200, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 400, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 600, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.54, y: 150, label: 'LW', role: 'Left Winger' });
        positions.push({ x: width * 0.54, y: 400, label: 'ST', role: 'Striker' });
        positions.push({ x: width * 0.54, y: 650, label: 'RW', role: 'Right Winger' });
        break;
      case '4-4-2':
        positions.push({ x: width * 0.08, y: 400, label: 'GK', role: 'Goalkeeper' });
        positions.push({ x: width * 0.21, y: 150, label: 'LB', role: 'Left Back' });
        positions.push({ x: width * 0.21, y: 300, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 500, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 650, label: 'RB', role: 'Right Back' });
        positions.push({ x: width * 0.38, y: 150, label: 'LM', role: 'Left Midfielder' });
        positions.push({ x: width * 0.38, y: 300, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 500, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 650, label: 'RM', role: 'Right Midfielder' });
        positions.push({ x: width * 0.54, y: 300, label: 'ST', role: 'Striker' });
        positions.push({ x: width * 0.54, y: 500, label: 'ST', role: 'Striker' });
        break;
      case '3-5-2':
        positions.push({ x: width * 0.08, y: 400, label: 'GK', role: 'Goalkeeper' });
        positions.push({ x: width * 0.21, y: 200, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 400, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 600, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.38, y: 100, label: 'LM', role: 'Left Midfielder' });
        positions.push({ x: width * 0.38, y: 250, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 400, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 550, label: 'CM', role: 'Central Midfielder' });
        positions.push({ x: width * 0.38, y: 700, label: 'RM', role: 'Right Midfielder' });
        positions.push({ x: width * 0.54, y: 300, label: 'ST', role: 'Striker' });
        positions.push({ x: width * 0.54, y: 500, label: 'ST', role: 'Striker' });
        break;
      case '4-2-3-1':
        positions.push({ x: width * 0.08, y: 400, label: 'GK', role: 'Goalkeeper' });
        positions.push({ x: width * 0.21, y: 150, label: 'LB', role: 'Left Back' });
        positions.push({ x: width * 0.21, y: 300, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 500, label: 'CB', role: 'Center Back' });
        positions.push({ x: width * 0.21, y: 650, label: 'RB', role: 'Right Back' });
        positions.push({ x: width * 0.33, y: 300, label: 'CDM', role: 'Defensive Midfielder' });
        positions.push({ x: width * 0.33, y: 500, label: 'CDM', role: 'Defensive Midfielder' });
        positions.push({ x: width * 0.46, y: 150, label: 'LW', role: 'Left Winger' });
        positions.push({ x: width * 0.46, y: 400, label: 'CAM', role: 'Attacking Midfielder' });
        positions.push({ x: width * 0.46, y: 650, label: 'RW', role: 'Right Winger' });
        positions.push({ x: width * 0.58, y: 400, label: 'ST', role: 'Striker' });
        break;
      default:
        return getInitialPositions('4-3-3');
    }

    return positions.map((pos, idx) => ({
      id: `player-${idx}`,
      x: pos.x,
      y: pos.y,
      targetX: pos.x,
      targetY: pos.y,
      team: 'home',
      number: idx + 1,
      label: pos.label,
      role: pos.role
    }));
  };

  useEffect(() => {
    setPlayers1(getInitialPositions(formation1));
    setKeyframes1([]);
    setCurrentFrame(0);
  }, [formation1, comparisonMode]);

  useEffect(() => {
    if (comparisonMode) {
      setPlayers2(getInitialPositions(formation2));
      setKeyframes2([]);
      setCurrentFrame(0);
    }
  }, [formation2, comparisonMode]);

  const generateAISimulation = async () => {
    setIsGenerating(true);
    try {
      if (comparisonMode) {
        // Generate both simulations
        const [result1, result2] = await Promise.all([
          generateSimulationMutation.mutateAsync({
            formation: formation1,
            scenario: scenario1,
            duration: 10
          }),
          generateSimulationMutation.mutateAsync({
            formation: formation2,
            scenario: scenario2,
            duration: 10
          })
        ]);
        
        setKeyframes1(result1.keyframes);
        setDescription1(result1.description);
        setKeyframes2(result2.keyframes);
        setDescription2(result2.description);
        
        // Get AI comparison insights
        const comparisonResult = await compareFormationsMutation.mutateAsync({
          formation1,
          scenario1,
          formation2,
          scenario2
        });
        setComparisonInsights(comparisonResult.insights);
        
        toast.success("Comparison simulations generated successfully!");
      } else {
        // Generate single simulation
        const result = await generateSimulationMutation.mutateAsync({
          formation: formation1,
          scenario: scenario1,
          duration: 10
        });
        setKeyframes1(result.keyframes);
        setDescription1(result.description);
        toast.success("AI simulation generated successfully!");
      }
      setIsGenerating(false);
    } catch (error: any) {
      toast.error("Failed to generate simulation: " + error.message);
      setIsGenerating(false);
    }
  };

  const drawPitch = (ctx: CanvasRenderingContext2D, width: number) => {
    // Clear canvas
    ctx.fillStyle = pitchColor;
    ctx.fillRect(0, 0, width, CANVAS_HEIGHT);

    // Draw pitch markings
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(50, 50, width - 100, CANVAS_HEIGHT - 100);

    // Center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 50);
    ctx.lineTo(width / 2, CANVAS_HEIGHT - 50);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, CANVAS_HEIGHT / 2, 80, 0, Math.PI * 2);
    ctx.stroke();

    // Left penalty area
    ctx.strokeRect(50, 200, 150, 400);
    ctx.strokeRect(50, 300, 60, 200);

    // Right penalty area
    ctx.strokeRect(width - 200, 200, 150, 400);
    ctx.strokeRect(width - 110, 300, 60, 200);
  };

   const drawPlayers = (ctx: CanvasRenderingContext2D, playerPositions: Player[]) => {
    playerPositions.forEach((player: any) => {
      // Player circle
      ctx.fillStyle = playerBgColor;
      ctx.beginPath();
      ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      // Border
      ctx.strokeStyle = playerTextColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      // Number
      ctx.fillStyle = playerTextColor;
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(player.number.toString(), player.x, player.y);

      // Label
      ctx.font = '10px Arial';
      ctx.fillText(player.label, player.x, player.y + PLAYER_RADIUS + 12);

      // Movement trail
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(player.x, player.y);
      ctx.lineTo(player.targetX, player.targetY);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  };

  useEffect(() => {
    const canvas1 = canvasRef1.current;
    if (!canvas1) return;

    const ctx1 = canvas1.getContext('2d');
    if (!ctx1) return;

    drawPitch(ctx1, CANVAS_WIDTH);

    if (keyframes1.length > 0 && currentFrame < keyframes1.length) {
      const frame = keyframes1[currentFrame];
      const currentPlayers = players1.map((player: any) => {
        const framePlayer = frame.players.find(p => p.id === player.id);
        if (framePlayer) {
          // Clamp positions within pitch boundaries (pitch is drawn with 50px margin)
          const clampedX = Math.max(55 + PLAYER_RADIUS, Math.min(CANVAS_WIDTH - 55 - PLAYER_RADIUS, framePlayer.x));
          const clampedY = Math.max(55 + PLAYER_RADIUS, Math.min(CANVAS_HEIGHT - 55 - PLAYER_RADIUS, framePlayer.y));
          return { ...player, x: clampedX, y: clampedY };
        }
        return player;
      });
      drawPlayers(ctx1, currentPlayers);

      // Draw frame info
      ctx1.fillStyle = '#ffffff';
      ctx1.font = '14px Arial';
      ctx1.fillText(frame.description, 20, 30);
      ctx1.fillText(`Frame: ${currentFrame + 1}/${keyframes1.length}`, 20, 50);
    } else {
      drawPlayers(ctx1, players1);
    }
  }, [players1, keyframes1, currentFrame, comparisonMode]);

  useEffect(() => {
    if (!comparisonMode) return;
    
    const canvas2 = canvasRef2.current;
    if (!canvas2) return;

    const ctx2 = canvas2.getContext('2d');
    if (!ctx2) return;

    drawPitch(ctx2, CANVAS_WIDTH);

    if (keyframes2.length > 0 && currentFrame < keyframes2.length) {
      const frame = keyframes2[currentFrame];
      const currentPlayers = players2.map((player: any) => {
        const framePlayer = frame.players.find(p => p.id === player.id);
        if (framePlayer) {
          // Clamp positions within pitch boundaries (pitch is drawn with 50px margin)
          const clampedX = Math.max(55 + PLAYER_RADIUS, Math.min(CANVAS_WIDTH - 55 - PLAYER_RADIUS, framePlayer.x));
          const clampedY = Math.max(55 + PLAYER_RADIUS, Math.min(CANVAS_HEIGHT - 55 - PLAYER_RADIUS, framePlayer.y));
          return { ...player, x: clampedX, y: clampedY };
        }
        return player;
      });
      drawPlayers(ctx2, currentPlayers);

      // Draw frame info
      ctx2.fillStyle = '#ffffff';
      ctx2.font = '14px Arial';
      ctx2.fillText(frame.description, 20, 30);
      ctx2.fillText(`Frame: ${currentFrame + 1}/${keyframes2.length}`, 20, 50);
    } else {
      drawPlayers(ctx2, players2);
    }
  }, [players2, keyframes2, currentFrame, comparisonMode]);

  useEffect(() => {
    if (isPlaying && keyframes1.length > 0) {
      const maxFrames = comparisonMode ? Math.max(keyframes1.length, keyframes2.length) : keyframes1.length;
      animationRef.current = window.setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= maxFrames - 1) {
            setIsPlaying(false);
            setSimulationComplete(true);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / (FPS * playbackSpeed));
    } else {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [isPlaying, keyframes1, keyframes2, playbackSpeed, comparisonMode]);

  const handlePlayPause = () => {
    if (keyframes1.length === 0) {
      toast.error("Generate a simulation first!");
      return;
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setCurrentFrame(0);
    setIsPlaying(false);
    setSimulationComplete(false);
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }
    const newTemplate = {
      name: templateName.trim(),
      formation: formation1,
      scenario: scenario1,
      notes: templateNotes.trim(),
      savedAt: new Date().toISOString(),
    };
    const updated = [newTemplate, ...savedTemplates];
    setSavedTemplates(updated);
    localStorage.setItem('formationTemplates', JSON.stringify(updated));
    setShowSaveTemplateDialog(false);
    setTemplateName('');
    setTemplateNotes('');
    toast.success(`Template "${newTemplate.name}" saved!`);
  };

  const handleLoadTemplate = (template: typeof savedTemplates[0]) => {
    setFormation1(template.formation);
    setScenario1(template.scenario);
    toast.success(`Loaded template: ${template.name}`);
  };

  const handleDeleteTemplate = (index: number) => {
    const updated = savedTemplates.filter((_, i) => i !== index);
    setSavedTemplates(updated);
    localStorage.setItem('formationTemplates', JSON.stringify(updated));
    toast.success('Template deleted');
  };

  const handleShareTemplate = (index: number) => {
    setShareTemplateIndex(index);
    setShowShareDialog(true);
  };

  const handleExportTemplate = (index: number) => {
    const template = savedTemplates[index];
    const json = JSON.stringify(template, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${template.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template exported!');
  };

  const handleCopyShareLink = () => {
    if (shareTemplateIndex === null) return;
    const template = savedTemplates[shareTemplateIndex];
    const json = JSON.stringify(template);
    const encoded = btoa(json);
    const shareLink = `${window.location.origin}${window.location.pathname}?template=${encoded}`;
    navigator.clipboard.writeText(shareLink);
    toast.success('Share link copied to clipboard!');
    setShowShareDialog(false);
  };


  const handleImportTemplate = () => {
    try {
      const template = JSON.parse(importJsonText);
      if (!template.name || !template.formation || !template.scenario) {
        toast.error('Invalid template format');
        return;
      }
      const updated = [template, ...savedTemplates];
      setSavedTemplates(updated);
      localStorage.setItem('formationTemplates', JSON.stringify(updated));
      setShowImportDialog(false);
      setImportJsonText('');
      toast.success(`Template "${template.name}" imported!`);
    } catch (e) {
      toast.error('Failed to parse JSON');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        setImportJsonText(json);
      } catch (err) {
        toast.error('Failed to read file');
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const maxFrames = comparisonMode ? Math.max(keyframes1.length, keyframes2.length) : keyframes1.length;
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentFrame < maxFrames - 1) {
            setCurrentFrame(currentFrame + 1);
            setIsPlaying(false);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentFrame > 0) {
            setCurrentFrame(currentFrame - 1);
            setIsPlaying(false);
          }
          break;
        case 'KeyR':
          e.preventDefault();
          handleReset();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentFrame, isPlaying, keyframes1, keyframes2, comparisonMode]);


    const handleStepForward = () => {
    const maxFrames = comparisonMode ? Math.max(keyframes1.length, keyframes2.length) : keyframes1.length;
    if (currentFrame < maxFrames - 1) {
      setCurrentFrame(prev => prev + 1);
    }
  };

  const handleStepBackward = () => {
    if (currentFrame > 0) {
      setCurrentFrame(prev => prev - 1);
    }
  };

  const toggleComparisonMode = () => {
    setComparisonMode(!comparisonMode);
    setKeyframes1([]);
    setKeyframes2([]);
    setCurrentFrame(0);
    setIsPlaying(false);
    setComparisonInsights('');
  };

  const exportComparisonToPDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPos = 20;

    // Title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Formation Comparison Report', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Formation 1 Details
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Formation 1', 20, yPos);
    yPos += 8;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Formation: ${formation1}`, 25, yPos);
    yPos += 6;
    pdf.text(`Scenario: ${scenario1}`, 25, yPos);
    yPos += 10;
    
    if (description1) {
      pdf.setFontSize(10);
      const lines1 = pdf.splitTextToSize(description1, pageWidth - 50);
      pdf.text(lines1, 25, yPos);
      yPos += lines1.length * 5 + 10;
    }

    // Formation 2 Details
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Formation 2', 20, yPos);
    yPos += 8;
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Formation: ${formation2}`, 25, yPos);
    yPos += 6;
    pdf.text(`Scenario: ${scenario2}`, 25, yPos);
    yPos += 10;
    
    if (description2) {
      pdf.setFontSize(10);
      const lines2 = pdf.splitTextToSize(description2, pageWidth - 50);
      pdf.text(lines2, 25, yPos);
      yPos += lines2.length * 5 + 10;
    }

    // Add new page for comparison insights
    if (comparisonInsights) {
      pdf.addPage();
      yPos = 20;
      
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AI Tactical Analysis', 20, yPos);
      yPos += 10;
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const insightLines = pdf.splitTextToSize(comparisonInsights, pageWidth - 40);
      pdf.text(insightLines, 20, yPos);
    }

    // Save PDF
    pdf.save(`formation-comparison-${formation1}-vs-${formation2}.pdf`);
    toast.success('PDF exported successfully!');
  };

  return (
    <>
      <div className="space-y-6">
        {/* Keyboard Shortcuts Help */}
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <p className="text-sm font-semibold mb-3">Keyboard Shortcuts:</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div><kbd className="bg-white dark:bg-gray-800 px-2 py-1 rounded border">Space</kbd> Play/Pause</div>
              <div><kbd className="bg-white dark:bg-gray-800 px-2 py-1 rounded border">→</kbd> Next Frame</div>
              <div><kbd className="bg-white dark:bg-gray-800 px-2 py-1 rounded border">←</kbd> Prev Frame</div>
              <div><kbd className="bg-white dark:bg-gray-800 px-2 py-1 rounded border">R</kbd> Reset</div>
            </div>
          </CardContent>
        </Card>


        <div>
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => navigate("/advanced-tactical-hub")} className="p-2 hover:bg-muted rounded-lg transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </button>
          </div>
          <AIBreadcrumb toolLabel={language === 'ar' ? 'محاكاة التشكيلة AI' : 'AI Formation Simulation'}/>
<h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-primary" />
            AI Formation Simulation
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-powered tactical movement simulation with animated player positioning
          </p>
        </div>

        {/* Comparison Mode Toggle */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Comparison Mode</h3>
                <p className="text-sm text-muted-foreground">Compare two formations side-by-side</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={toggleComparisonMode} variant={comparisonMode ? "default" : "outline"}>
                  <GitCompare className="h-4 w-4 mr-2" />
                  {comparisonMode ? "Single Mode" : "Compare Formations"}
                </Button>
                {comparisonMode && comparisonInsights && (
                  <Button onClick={exportComparisonToPDF} variant="outline" className="border-green-500 text-green-600 hover:bg-green-50">
                    <Download className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Simulation Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`grid ${comparisonMode ? 'grid-cols-2' : 'grid-cols-1'} gap-6`}>
              {/* Formation 1 Controls */}
              <div className="space-y-4">
                {comparisonMode && <h3 className="font-semibold text-blue-600">Formation 1</h3>}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Formation</label>
                    <Select value={formation1} onValueChange={(v) => setFormation1(v as Formation)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="4-3-3">4-3-3</SelectItem>
                        <SelectItem value="4-4-2">4-4-2</SelectItem>
                        <SelectItem value="3-5-2">3-5-2</SelectItem>
                        <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tactical Scenario</label>
                    <Select value={scenario1} onValueChange={(v) => setScenario1(v as TacticalScenario)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="attack">Attack</SelectItem>
                        <SelectItem value="defense">Defense</SelectItem>
                        <SelectItem value="counter">Counter-Attack</SelectItem>
                        <SelectItem value="possession">Possession</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {description1 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100">{description1}</p>
                  </div>
                )}
              </div>

              {/* Formation 2 Controls (Comparison Mode) */}
              {comparisonMode && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-green-600">Formation 2</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Formation</label>
                      <Select value={formation2} onValueChange={(v) => setFormation2(v as Formation)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4-3-3">4-3-3</SelectItem>
                          <SelectItem value="4-4-2">4-4-2</SelectItem>
                          <SelectItem value="3-5-2">3-5-2</SelectItem>
                          <SelectItem value="4-2-3-1">4-2-3-1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tactical Scenario</label>
                      <Select value={scenario2} onValueChange={(v) => setScenario2(v as TacticalScenario)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="attack">Attack</SelectItem>
                          <SelectItem value="defense">Defense</SelectItem>
                          <SelectItem value="counter">Counter-Attack</SelectItem>
                          <SelectItem value="possession">Possession</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {description2 && (
                    <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-sm text-green-900 dark:text-green-100">{description2}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Playback Speed: {playbackSpeed}x</label>
              <Slider
                value={[playbackSpeed]}
                onValueChange={(v) => setPlaybackSpeed(v[0])}
                min={0.5}
                max={3}
                step={0.5}
                className="w-full"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={generateAISimulation} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Simulation
                  </>
                )}
              </Button>

              <Button onClick={handlePlayPause} variant="outline" disabled={keyframes1.length === 0}>
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Play
                  </>
                )}
              </Button>

              <Button onClick={handleStepBackward} variant="outline" size="icon" disabled={currentFrame === 0}>
                <Rewind className="h-4 w-4" />
              </Button>

              <Button onClick={handleStepForward} variant="outline" size="icon" disabled={currentFrame >= keyframes1.length - 1}>
                <FastForward className="h-4 w-4" />
              </Button>

              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>

              <Button onClick={() => handleScreenshot(canvasRef1, 'formation1')} variant="outline" disabled={keyframes1.length === 0}>
                <Camera className="h-4 w-4 mr-2" />
                Screenshot
              </Button>

              <Button onClick={handleAddToHistory} variant="outline" disabled={keyframes1.length === 0}>
                <Clock className="h-4 w-4 mr-2" />
                Add to History
              </Button>

              <Button onClick={() => setShowCustomizeDialog(true)} variant="outline">
                Customize Info
              </Button>
            </div>

            {/* Player & Pitch Color Customization */}
            <div className="space-y-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <label className="text-sm font-medium text-green-900 dark:text-green-100">Player & Pitch Colors</label>
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Player Color</label>
                  <input
                    type="color"
                    value={playerBgColor}
                    onChange={(e) => setPlayerBgColor(e.target.value)}
                    className="w-10 h-9 rounded cursor-pointer border"
                    title="Player background color"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Number Color</label>
                  <input
                    type="color"
                    value={playerTextColor}
                    onChange={(e) => setPlayerTextColor(e.target.value)}
                    className="w-10 h-9 rounded cursor-pointer border"
                    title="Player number/text color"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground">Pitch Color</label>
                  <input
                    type="color"
                    value={pitchColor}
                    onChange={(e) => setPitchColor(e.target.value)}
                    className="w-10 h-9 rounded cursor-pointer border"
                    title="Pitch background color"
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setPlayerBgColor('#3b82f6'); setPlayerTextColor('#ffffff'); setPitchColor('#2d5016'); }}
                >
                  Reset Colors
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  style={{ backgroundColor: '#cc0000', color: '#ffffff', borderColor: '#cc0000' }}
                  onClick={() => { setPlayerBgColor('#cc0000'); setPlayerTextColor('#ffffff'); setPitchColor('#2d5016'); }}
                >
                  Future Stars FC Red
                </Button>
              </div>
            </div>
            {/* Drawing Tools */}
            <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <label className="text-sm font-medium text-blue-900 dark:text-blue-100">Tactical Annotations</label>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setDrawingMode(drawingMode === 'pen' ? null : 'pen')}
                  variant={drawingMode === 'pen' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1"
                >
                  Pen
                </Button>
                <Button
                  onClick={() => setDrawingMode(drawingMode === 'arrow' ? null : 'arrow')}
                  variant={drawingMode === 'arrow' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1"
                >
                  ➜ Arrow
                </Button>
                <Button
                  onClick={() => setDrawingMode(drawingMode === 'circle' ? null : 'circle')}
                  variant={drawingMode === 'circle' ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1"
                >
                  Circle
                </Button>
                <input
                  type="color"
                  value={drawingColor}
                  onChange={(e) => setDrawingColor(e.target.value)}
                  className="w-10 h-9 rounded cursor-pointer border"
                  title="Annotation color"
                />
                <Button onClick={clearDrawing} variant="outline" size="sm">
                  Clear
                </Button>
                <Button onClick={saveAnnotations} variant="outline" size="sm" className="bg-green-100 hover:bg-green-200">
                  Save Annotations
                </Button>
                <Button 
                  onClick={() => undo(1)} 
                  variant="outline" 
                  size="sm"
                  disabled={historyIndex.canvas1 <= 0}
                  title="Ctrl+Z"
                >
                  ↶ Undo
                </Button>
                <Button 
                  onClick={() => redo(1)} 
                  variant="outline" 
                  size="sm"
                  disabled={historyIndex.canvas1 >= drawingHistory.canvas1.length - 1}
                  title="Ctrl+Y"
                >
                  ↷ Redo
                </Button>
              </div>
            </div>

            {comparisonMode && comparisonInsights && (
              <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border-2 border-purple-200 dark:border-purple-800">
                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI Comparison Insights
                </h4>
                <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap">{comparisonInsights}</p>
              </div>
            )}
            {drawingLayers.length >= 2 && (
              <div className="space-y-2 pt-2 border-t">
                <div className="text-xs font-semibold text-gray-600">Layer Animation:</div>
                <Button 
                  onClick={startLayerAnimation}
                  disabled={animationMode}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {animationMode ? '▶️ Animating...' : '▶️ Animate Layers'}
                </Button>
                {animationMode && (
                  <div className="space-y-2">
                    <div className="text-xs text-center text-gray-600">
                      {currentAnimationLayer + 1} / {drawingLayers.length}
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.5"
                      value={animationSpeed}
                      onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
                      className="w-full"
                      title="Animation speed"
                    />
                    <div className="text-xs text-center text-muted-foreground">Speed: {animationSpeed}x</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Simulation Complete Badge */}
        {simulationComplete && (
          <div className="flex items-center justify-center gap-3 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-200 font-semibold text-lg">Simulation Complete ✓</span>
            <span className="text-green-600 dark:text-green-400 text-sm">All {keyframes1.length} frames played</span>
          </div>
        )}

        {/* Canvas + Comparison Insights Side by Side */}
        <div className={`grid ${comparisonMode && comparisonInsights ? 'grid-cols-1 xl:grid-cols-3' : comparisonMode ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
          <Card className={comparisonMode && comparisonInsights ? 'xl:col-span-1' : ''}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                {comparisonMode && <CardTitle className="text-blue-600">Formation 1: {formation1}</CardTitle>}
                {!comparisonMode && <CardTitle>Formation: {formation1} — {scenario1}</CardTitle>}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTemplateName(`${formation1} ${scenario1}`);
                    setShowSaveTemplateDialog(true);
                  }}
                  className="border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950"
                >
                  <BookmarkPlus className="h-4 w-4 mr-1" />
                  Save Template
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="w-full overflow-x-auto relative">
                <canvas
                  ref={canvasRef1}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  className="border border-gray-300 rounded-lg block"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                {drawingMode && (
                  <canvas
                    ref={drawingCanvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="absolute top-0 left-0 border border-blue-300 rounded-lg cursor-crosshair"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                )}
              </div>
              <div className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Blue = Your Team</Badge>
                  {keyframes1.length > 0 && (
                    <Badge variant="secondary">{currentFrame + 1} / {keyframes1.length} frames</Badge>
                  )}
                </div>
                {keyframes1.length > 0 && (
                  <div className="space-y-1">
                    <input
                      type="range"
                      min="0"
                      max={keyframes1.length - 1}
                      value={currentFrame}
                      onChange={(e) => {
                        const newFrame = parseInt(e.target.value);
                        setCurrentFrame(newFrame);
                        setIsPlaying(false);
                        setScrubberPosition(newFrame);
                      }}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0s</span>
                      <span>{((keyframes1.length - 1) / FPS).toFixed(1)}s</span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {comparisonMode && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-green-600">Formation 2: {formation2}</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="w-full overflow-x-auto">
                  <canvas
                    ref={canvasRef2}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="border border-gray-300 rounded-lg block"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                </div>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Blue = Your Team</Badge>
                    {keyframes2.length > 0 && (
                      <Badge variant="secondary">{currentFrame + 1} / {keyframes2.length} frames</Badge>
                    )}
                  </div>
                  {keyframes2.length > 0 && (
                    <div className="space-y-1">
                      <input
                        type="range"
                        min="0"
                        max={keyframes2.length - 1}
                        value={currentFrame}
                        onChange={(e) => {
                          const newFrame = parseInt(e.target.value);
                          setCurrentFrame(newFrame);
                          setIsPlaying(false);
                          setScrubberPosition(newFrame);
                        }}
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>0s</span>
                        <span>{((keyframes2.length - 1) / FPS).toFixed(1)}s</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparison Insights Panel - shown alongside canvases in comparison mode */}
          {comparisonMode && comparisonInsights && (
            <Card className="border-2 border-purple-200 dark:border-purple-800 xl:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-purple-700 dark:text-purple-300 flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  AI Comparison Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">Formation 1: {formation1}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">Scenario: {scenario1}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="w-3 h-3 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-green-700 dark:text-green-300 mb-1">Formation 2: {formation2}</p>
                      <p className="text-xs text-green-600 dark:text-green-400">Scenario: {scenario2}</p>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <p className="text-sm text-purple-800 dark:text-purple-200 whitespace-pre-wrap leading-relaxed">{comparisonInsights}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Import Template Button */}
        <div className="flex gap-2">
          <Button
            onClick={() => setShowImportDialog(true)}
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <Upload className="h-4 w-4" />
            Import Template
          </Button>
        </div>

        {/* Saved Templates */}
        {savedTemplates.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookmarkPlus className="h-5 w-5 text-amber-700 dark:text-amber-500" />
                  Saved Formation Templates
                </CardTitle>
                {(savedTemplates.length > 0 || formationHistory.length > 0) && (
                  <Button onClick={handleBatchExport} variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" />
                    Export All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {savedTemplates.map((template, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm">{template.name}</p>
                      <button
                        onClick={() => handleDeleteTemplate(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-600 text-xs"
                      >✕</button>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">{template.formation}</Badge>
                      <Badge variant="secondary" className="text-xs capitalize">{template.scenario}</Badge>
                    </div>
                    {template.notes && <p className="text-xs text-muted-foreground">{template.notes}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(template.savedAt).toLocaleDateString()}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7"
                        onClick={() => handleLoadTemplate(template)}
                      >
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7 text-blue-600 hover:text-blue-700"
                        onClick={() => handleShareTemplate(index)}
                      >
                        Share
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs h-7 text-green-600 hover:text-green-700"
                        onClick={() => handleExportTemplate(index)}
                      >
                        Export
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Share Template Dialog */}
        <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookmarkPlus className="h-5 w-5 text-blue-500" />
                Share Formation Template
              </DialogTitle>
            </DialogHeader>
            {shareTemplateIndex !== null && (
              <div className="space-y-4 py-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <p className="font-semibold text-sm mb-1">{savedTemplates[shareTemplateIndex].name}</p>
                  <p className="text-xs text-muted-foreground">{savedTemplates[shareTemplateIndex].formation} - {savedTemplates[shareTemplateIndex].scenario}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Share options:</p>
                  <Button
                    onClick={handleCopyShareLink}
                    className="w-full justify-start text-left h-auto py-3 px-3 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="text-lg">🔗</div>
                      <div>
                        <p className="font-semibold text-sm">Copy Share Link</p>
                        <p className="text-xs">Share via email or messaging</p>
                      </div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => {
                      handleExportTemplate(shareTemplateIndex);
                      setShowShareDialog(false);
                    }}
                    className="w-full justify-start text-left h-auto py-3 px-3 bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className="text-lg">📥</div>
                      <div>
                        <p className="font-semibold text-sm">Download JSON</p>
                        <p className="text-xs">Save as file for backup</p>
                      </div>
                    </div>
                  </Button>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowShareDialog(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Template Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-500" />
                Import Formation Template
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload JSON File</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                  className="w-full"
                >
                  Choose File
                </Button>
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or paste JSON</span>
                </div>
              </div>
              <div className="space-y-2">
                <Textarea
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='{"name": "My Formation", "formation": "4-3-3", "scenario": "attack", "notes": "...", "savedAt": "..."}'
                  className="min-h-[150px] font-mono text-xs"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>Cancel</Button>
              <Button
                onClick={handleImportTemplate}
                disabled={!importJsonText.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Import
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Formation History Dialog */}
        <Dialog open={formationHistory.length > 0 && false} onOpenChange={() => {}}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                Formation History Timeline
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {formationHistory.map((entry, idx) => (
                <div key={entry.id} className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition" onClick={() => handleLoadFromHistory(entry)}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{entry.formation} - {entry.scenario}</p>
                      <p className="text-xs text-muted-foreground">{entry.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">{entry.timestamp}</p>
                    </div>
                    <Badge variant="outline">{idx + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Customize Information Dialog */}
        <Dialog open={showCustomizeDialog} onOpenChange={setShowCustomizeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Customize Display Information
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={customInfo.title}
                  onChange={(e) => setCustomInfo({...customInfo, title: e.target.value})}
                  placeholder="e.g. Formation Analysis"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Subtitle</label>
                <Input
                  value={customInfo.subtitle}
                  onChange={(e) => setCustomInfo({...customInfo, subtitle: e.target.value})}
                  placeholder="e.g. Tactical Breakdown"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Additional Notes</label>
                <Textarea
                  value={customInfo.notes}
                  onChange={(e) => setCustomInfo({...customInfo, notes: e.target.value})}
                  placeholder="Add any custom notes or observations..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-xs text-blue-700 dark:text-blue-300">Preview: <span className="font-semibold">{customInfo.title}</span> - {customInfo.subtitle}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCustomizeDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveCustomInfo} className="bg-blue-600 hover:bg-blue-700">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Save Template Dialog */}
        <Dialog open={showSaveTemplateDialog} onOpenChange={setShowSaveTemplateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Save className="h-5 w-5 text-amber-700 dark:text-amber-500" />
                Save Formation Template
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Template Name *</label>
                <Input
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder={`e.g. ${formation1} ${scenario1} vs high press`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Formation</p>
                  <p className="font-semibold">{formation1}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground">Scenario</p>
                  <p className="font-semibold capitalize">{scenario1}</p>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <Textarea
                  value={templateNotes}
                  onChange={(e) => setTemplateNotes(e.target.value)}
                  placeholder="Add coaching notes, opponent context, or tactical rationale..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSaveTemplateDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveTemplate} className="bg-amber-500 hover:bg-amber-600 text-black">
                <Save className="h-4 w-4 mr-2" />
                Save Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
