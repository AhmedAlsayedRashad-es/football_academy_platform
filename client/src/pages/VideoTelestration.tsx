import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Video, Pencil, Circle, Square, Minus, Type,
  Trash2, Download, Save, Undo, ArrowRight, Star, Zap,
  Users, MessageSquare, Upload, Play, RotateCcw,
  Maximize2, X, ChevronLeft, ChevronRight, BookOpen,
  Clock, Layers, Presentation, SkipBack, SkipForward,
  PauseCircle, PlayCircle, Brain, Sparkles, Target,
  TrendingUp, FileText, Settings, Eye, EyeOff, Plus,
  ChevronDown, ChevronUp, Wand2, BarChart3, Flag,
  RefreshCw, CheckCircle, AlertCircle, Loader2, Copy,
  Share2, Printer, Volume2, VolumeX, Maximize, Minimize,
  Grid3X3, Move, Crosshair, Triangle, Pentagon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';
import { MarkdownContent } from '@/components/MarkdownContent';

// ─── Types ─────────────────────────────────────────────────────────────────
type DrawTool =
  | "arrow" | "movement_path" | "circle" | "team_zone" | "rectangle"
  | "line" | "freehand" | "player_label" | "team_label" | "tactical_box"
  | "spotlight" | "spotlight_burst" | "text"
  | "animated_arrow" | "curved_path" | "player_circle" | "motion_trail" | "offside_line" | "penalty_arc";

interface Annotation {
  id?: number;
  type: DrawTool;
  color: string;
  data: any;
  timestamp: number;
  label?: string;
}

interface SavedFrame {
  id: string;
  title: string;
  annotations: Annotation[];
  videoTime: number;
  thumbnail?: string;
  matchTag?: { opponent: string; matchDate: string; matchMinute: string; phaseOfPlay: string; };
}

type AIPanel = "none" | "analyze" | "auto" | "report" | "formation";
type SidePanel = "tools" | "ai" | "library" | "frames";

// ─── Formation Options ──────────────────────────────────────────────────────
const FORMATIONS = [
  "4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "5-3-2", "4-1-4-1",
  "3-4-3", "4-3-2-1", "4-5-1", "3-4-1-2", "4-2-2-2", "5-4-1"
];

const PHASES_OF_PLAY = [
  { id: "attack", label: "Attack", icon: "⚔️", color: "#ef4444" },
  { id: "defense", label: "Defense", icon: "🛡️", color: "#3b82f6" },
  { id: "transition_attack", label: "Trans. Attack", icon: "⚡", color: "#f97316" },
  { id: "transition_defense", label: "Trans. Defense", icon: "🔄", color: "#8b5cf6" },
  { id: "set_piece_attack", label: "Set Piece Att.", icon: "🎯", color: "#10b981" },
  { id: "set_piece_defense", label: "Set Piece Def.", icon: "🧱", color: "#6366f1" },
  { id: "pressing", label: "High Press", icon: "🔥", color: "#ec4899" },
  { id: "build_up", label: "Build-Up", icon: "🏗️", color: "#14b8a6" },
];

// ─── Color Palette ──────────────────────────────────────────────────────────
const COLORS = [
  { hex: "#ef4444", name: "Red" },
  { hex: "#f97316", name: "Orange" },
  { hex: "#eab308", name: "Yellow" },
  { hex: "#22c55e", name: "Green" },
  { hex: "#06b6d4", name: "Cyan" },
  { hex: "#3b82f6", name: "Blue" },
  { hex: "#a855f7", name: "Purple" },
  { hex: "#ffffff", name: "White" },
  { hex: "#000000", name: "Black" },
  { hex: "#f43f5e", name: "Rose" },
];

// ─── Teams ──────────────────────────────────────────────────────────────────
const TEAMS = [
  { name: "Future Stars FC", color: "#cc0000" },
  { name: "Zamalek", color: "#1a1a2e" },
  { name: "Team A", color: "#00bcd4" },
  { name: "Team B", color: "#e53935" },
  { name: "Custom", color: "#00ff88" },
];

// ─── Annotation Templates ───────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: "counter_press", name: "Counter-Press Trigger", category: "Pressing",
    icon: "🔥", color: "#ec4899",
    annotations: [
      { type: 'team_zone' as DrawTool, color: '#ec4899', data: { x1: 600, y1: 200, x2: 1200, y2: 700, teamName: 'PRESS ZONE', teamColor: '#ec4899' }, timestamp: 0 },
      { type: 'arrow' as DrawTool, color: '#ef4444', data: { x1: 700, y1: 350, x2: 550, y2: 450 }, timestamp: 0 },
      { type: 'arrow' as DrawTool, color: '#ef4444', data: { x1: 900, y1: 300, x2: 750, y2: 400 }, timestamp: 0 },
      { type: 'arrow' as DrawTool, color: '#ef4444', data: { x1: 1100, y1: 350, x2: 950, y2: 450 }, timestamp: 0 },
      { type: 'tactical_box' as DrawTool, color: '#ec4899', data: { x: 400, y: 720, teamName: 'COUNTER-PRESS', text: 'TRIGGER: BALL PLAYED BACK. IMMEDIATE 3-MAN PRESS. TRAP ON SIDELINE. WIN BALL HIGH.' }, timestamp: 0 },
    ],
  },
  {
    id: "tiki_taka", name: "Tiki-Taka Build-Up", category: "Possession",
    icon: "🏗️", color: "#14b8a6",
    annotations: [
      { type: 'team_zone' as DrawTool, color: '#14b8a6', data: { x1: 40, y1: 200, x2: 900, y2: 700, teamName: 'BUILD-UP ZONE', teamColor: '#14b8a6' }, timestamp: 0 },
      { type: 'movement_path' as DrawTool, color: '#06b6d4', data: { x1: 200, y1: 450, x2: 500, y2: 350 }, timestamp: 0 },
      { type: 'movement_path' as DrawTool, color: '#06b6d4', data: { x1: 500, y1: 350, x2: 800, y2: 400 }, timestamp: 0 },
      { type: 'movement_path' as DrawTool, color: '#22c55e', data: { x1: 800, y1: 400, x2: 1100, y2: 300 }, timestamp: 0 },
      { type: 'tactical_box' as DrawTool, color: '#14b8a6', data: { x: 400, y: 720, teamName: 'POSSESSION', text: 'BUILD-UP: GK → CB → PIVOT → FULLBACK OVERLAP. SWITCH PLAY TO BREAK PRESS.' }, timestamp: 0 },
    ],
  },
  {
    id: "counter_attack", name: "Counter Attack", category: "Transition",
    icon: "⚡", color: "#f97316",
    annotations: [
      { type: 'spotlight_burst' as DrawTool, color: '#f97316', data: { x: 400, y: 450, radius: 60 }, timestamp: 0 },
      { type: 'arrow' as DrawTool, color: '#f97316', data: { x1: 400, y1: 450, x2: 800, y2: 350 }, timestamp: 0 },
      { type: 'arrow' as DrawTool, color: '#f97316', data: { x1: 800, y1: 350, x2: 1300, y2: 250 }, timestamp: 0 },
      { type: 'movement_path' as DrawTool, color: '#eab308', data: { x1: 300, y1: 500, x2: 1200, y2: 300 }, timestamp: 0 },
      { type: 'tactical_box' as DrawTool, color: '#f97316', data: { x: 400, y: 700, teamName: 'COUNTER', text: 'WIN BALL → IMMEDIATE VERTICAL. STRIKER RUNS IN BEHIND. WINGER SUPPORTS.' }, timestamp: 0 },
    ],
  },
  {
    id: "high_line", name: "High Defensive Line", category: "Defending",
    icon: "🛡️", color: "#3b82f6",
    annotations: [
      { type: 'line' as DrawTool, color: '#ef4444', data: { x1: 40, y1: 350, x2: 1560, y2: 350 }, timestamp: 0 },
      { type: 'arrow' as DrawTool, color: '#ef4444', data: { x1: 800, y1: 500, x2: 800, y2: 360 }, timestamp: 0 },
      { type: 'tactical_box' as DrawTool, color: '#3b82f6', data: { x: 400, y: 700, teamName: 'DEFEND', text: 'HIGH LINE — OFFSIDE TRAP. BACK 4 HOLD AT HALFWAY. GK SWEEPS BEHIND.' }, timestamp: 0 },
    ],
  },
  {
    id: "corner_routine", name: "Corner Routine", category: "Set Pieces",
    icon: "🎯", color: "#10b981",
    annotations: [
      { type: 'movement_path' as DrawTool, color: '#06b6d4', data: { x1: 1560, y1: 860, x2: 1200, y2: 400 }, timestamp: 0 },
      { type: 'arrow' as DrawTool, color: '#22c55e', data: { x1: 900, y1: 600, x2: 1200, y2: 400 }, timestamp: 0 },
      { type: 'arrow' as DrawTool, color: '#eab308', data: { x1: 1100, y1: 700, x2: 1300, y2: 450 }, timestamp: 0 },
      { type: 'spotlight' as DrawTool, color: '#06b6d4', data: { x: 1200, y: 400, radius: 55 }, timestamp: 0 },
      { type: 'tactical_box' as DrawTool, color: '#10b981', data: { x: 200, y: 700, teamName: 'SET PIECE', text: 'CORNER: NEAR POST DELIVERY. R1 FLICKS ON. R2 FAR POST. R3 EDGE OF BOX.' }, timestamp: 0 },
    ],
  },
  {
    id: "overload_flank", name: "Flank Overload", category: "Attack",
    icon: "⚔️", color: "#ef4444",
    annotations: [
      { type: 'team_zone' as DrawTool, color: '#ef4444', data: { x1: 1100, y1: 100, x2: 1560, y2: 860, teamName: 'OVERLOAD', teamColor: '#ef4444' }, timestamp: 0 },
      { type: 'arrow' as DrawTool, color: '#22c55e', data: { x1: 1200, y1: 600, x2: 1400, y2: 400 }, timestamp: 0 },
      { type: 'arrow' as DrawTool, color: '#06b6d4', data: { x1: 1000, y1: 500, x2: 1300, y2: 350 }, timestamp: 0 },
      { type: 'movement_path' as DrawTool, color: '#eab308', data: { x1: 1300, y1: 350, x2: 1450, y2: 200 }, timestamp: 0 },
      { type: 'tactical_box' as DrawTool, color: '#ef4444', data: { x: 200, y: 700, teamName: 'ATTACK', text: '3v2 FLANK OVERLOAD. WINGER + FULLBACK + CM. CROSS OR CUTBACK.' }, timestamp: 0 },
    ],
  },
];

// ─── Canvas Drawing Engine ──────────────────────────────────────────────────
function drawAnnotation(ctx: CanvasRenderingContext2D, ann: Annotation) {
  const d = ann.data;
  ctx.save();

  switch (ann.type) {
    case "arrow": {
      const dx = d.x2 - d.x1, dy = d.y2 - d.y1;
      const angle = Math.atan2(dy, dx);
      const headLen = 22;
      ctx.strokeStyle = ann.color; ctx.fillStyle = ann.color;
      ctx.lineWidth = 4; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(d.x2, d.y2);
      ctx.lineTo(d.x2 - headLen * Math.cos(angle - Math.PI / 6), d.y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(d.x2 - headLen * Math.cos(angle + Math.PI / 6), d.y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath(); ctx.fill();
      break;
    }
    case "movement_path": {
      ctx.strokeStyle = ann.color || "#00aaff"; ctx.lineWidth = 3;
      ctx.setLineDash([12, 8]); ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2); ctx.stroke();
      ctx.setLineDash([]);
      break;
    }
    case "circle": {
      const rx = Math.abs(d.x2 - d.x1) / 2, ry = Math.abs(d.y2 - d.y1) / 2;
      const cx = (d.x1 + d.x2) / 2, cy = (d.y1 + d.y2) / 2;
      ctx.strokeStyle = ann.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI); ctx.stroke();
      break;
    }
    case "team_zone": {
      const rx = Math.abs(d.x2 - d.x1) / 2, ry = Math.abs(d.y2 - d.y1) / 2;
      const cx = (d.x1 + d.x2) / 2, cy = (d.y1 + d.y2) / 2;
      const tc = d.teamColor || "#00bcd4";
      ctx.globalAlpha = 0.3; ctx.fillStyle = tc;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI); ctx.fill();
      ctx.globalAlpha = 0.85; ctx.strokeStyle = tc; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.max(14, Math.min(rx / 4, 24))}px Arial`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(d.teamName || "TEAM", cx, cy);
      break;
    }
    case "rectangle": {
      ctx.strokeStyle = ann.color; ctx.lineWidth = 3;
      ctx.strokeRect(d.x1, d.y1, d.x2 - d.x1, d.y2 - d.y1);
      break;
    }
    case "line": {
      ctx.strokeStyle = ann.color; ctx.lineWidth = 3; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2); ctx.stroke();
      break;
    }
    case "freehand": {
      if (!d.points || d.points.length < 2) break;
      ctx.strokeStyle = ann.color; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(d.points[0].x, d.points[0].y);
      for (let i = 1; i < d.points.length; i++) ctx.lineTo(d.points[i].x, d.points[i].y);
      ctx.stroke();
      break;
    }
    case "player_label": {
      ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(d.labelX, d.labelY + 20); ctx.lineTo(d.playerX, d.playerY); ctx.stroke();
      const boxW = 180, boxH = 44;
      const bx = d.labelX - boxW / 2, by = d.labelY - boxH / 2;
      ctx.fillStyle = "rgba(10,10,10,0.95)"; ctx.strokeStyle = ann.color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 13px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText((d.playerName || "PLAYER").toUpperCase(), d.labelX, d.labelY - 8);
      ctx.fillStyle = ann.color; ctx.font = "11px Arial";
      ctx.fillText((d.position || "").toUpperCase(), d.labelX, d.labelY + 9);
      ctx.fillStyle = ann.color; ctx.beginPath(); ctx.arc(d.playerX, d.playerY, 6, 0, 2 * Math.PI); ctx.fill();
      break;
    }
    case "team_label": {
      const boxW = 200, boxH = 36;
      const bx = d.x - boxW / 2, by = d.y - boxH / 2;
      ctx.fillStyle = "rgba(10,10,10,0.95)"; ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(bx, by, boxW, boxH, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffffff"; ctx.font = "bold 14px Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText((d.teamName || "TEAM").toUpperCase(), d.x, d.y);
      break;
    }
    case "tactical_box": {
      const maxW = 280, padding = 12;
      ctx.font = "12px Arial";
      const words = (d.text || "").split(" ");
      const lines: string[] = [];
      let current = "";
      for (const w of words) {
        const test = current ? current + " " + w : w;
        if (ctx.measureText(test).width > maxW - padding * 2) { if (current) lines.push(current); current = w; }
        else current = test;
      }
      if (current) lines.push(current);
      const lineH = 18, headerH = 30, boxH = headerH + lines.length * lineH + padding;
      ctx.fillStyle = "rgba(8,8,8,0.96)"; ctx.strokeStyle = ann.color; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.roundRect(d.x, d.y, maxW, boxH, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = ann.color; ctx.globalAlpha = 0.2;
      ctx.beginPath(); ctx.roundRect(d.x, d.y, maxW, headerH, [6, 6, 0, 0]); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = ann.color; ctx.font = "bold 11px Arial"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText((d.teamName || "ANALYSIS").toUpperCase(), d.x + padding, d.y + headerH / 2);
      ctx.fillStyle = "#e0e0e0"; ctx.font = "11px Arial"; ctx.textBaseline = "top";
      lines.forEach((line, i) => ctx.fillText(line, d.x + padding, d.y + headerH + padding / 2 + i * lineH));
      break;
    }
    case "spotlight": {
      const cx = d.x, cy = d.y, r = d.radius || 40;
      const grad = ctx.createRadialGradient(cx, cy, r * 0.3, cx, cy, r);
      grad.addColorStop(0, "rgba(255,220,0,0.65)");
      grad.addColorStop(0.6, "rgba(255,180,0,0.3)");
      grad.addColorStop(1, "rgba(255,150,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.45, 0, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = "rgba(255,220,0,0.9)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.7, r * 0.32, 0, 0, 2 * Math.PI); ctx.stroke();
      break;
    }
    case "spotlight_burst": {
      const cx = d.x, cy = d.y, rays = 8, outerR = d.radius || 60, innerR = outerR * 0.35;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, outerR);
      grad.addColorStop(0, "rgba(255,255,255,0.95)");
      grad.addColorStop(0.4, "rgba(255,220,100,0.6)");
      grad.addColorStop(1, "rgba(255,180,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      for (let i = 0; i < rays * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / rays - Math.PI / 2;
        if (i === 0) ctx.moveTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
        else ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
      }
      ctx.closePath(); ctx.fill();
      break;
    }
    case "text": {
      ctx.fillStyle = ann.color; ctx.font = "bold 18px Arial"; ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(d.text || "Text", d.x, d.y);
      break;
    }
    // ── KlipDraw-inspired tools ──────────────────────────────────────────────
    case "animated_arrow": {
      const dx = d.x2 - d.x1, dy = d.y2 - d.y1;
      const angle = Math.atan2(dy, dx);
      const headLen = 28;
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2); ctx.stroke();
      const grad = ctx.createLinearGradient(d.x1, d.y1, d.x2, d.y2);
      grad.addColorStop(0, ann.color + '88'); grad.addColorStop(1, ann.color);
      ctx.strokeStyle = grad; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2); ctx.stroke();
      ctx.fillStyle = ann.color;
      for (const offset of [0, headLen * 0.6]) {
        const tx = d.x2 - offset * Math.cos(angle), ty = d.y2 - offset * Math.sin(angle);
        ctx.beginPath(); ctx.moveTo(tx, ty);
        ctx.lineTo(tx - headLen * Math.cos(angle - Math.PI/6), ty - headLen * Math.sin(angle - Math.PI/6));
        ctx.lineTo(tx - headLen * Math.cos(angle + Math.PI/6), ty - headLen * Math.sin(angle + Math.PI/6));
        ctx.closePath(); ctx.fill();
      }
      break;
    }
    case "curved_path": {
      const cpx = (d.x1 + d.x2) / 2 + (d.y2 - d.y1) * 0.4;
      const cpy = (d.y1 + d.y2) / 2 - (d.x2 - d.x1) * 0.4;
      ctx.strokeStyle = ann.color; ctx.lineWidth = 3.5;
      ctx.setLineDash([14, 8]); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.quadraticCurveTo(cpx, cpy, d.x2, d.y2); ctx.stroke();
      ctx.setLineDash([]);
      const t = 0.98;
      const ex = (1-t)*(1-t)*d.x1 + 2*(1-t)*t*cpx + t*t*d.x2;
      const ey = (1-t)*(1-t)*d.y1 + 2*(1-t)*t*cpy + t*t*d.y2;
      const ex2 = (1-0.95)*(1-0.95)*d.x1 + 2*(1-0.95)*0.95*cpx + 0.95*0.95*d.x2;
      const ey2 = (1-0.95)*(1-0.95)*d.y1 + 2*(1-0.95)*0.95*cpy + 0.95*0.95*d.y2;
      const ang = Math.atan2(ey - ey2, ex - ex2);
      const hl = 20;
      ctx.fillStyle = ann.color;
      ctx.beginPath(); ctx.moveTo(d.x2, d.y2);
      ctx.lineTo(d.x2 - hl * Math.cos(ang - Math.PI/6), d.y2 - hl * Math.sin(ang - Math.PI/6));
      ctx.lineTo(d.x2 - hl * Math.cos(ang + Math.PI/6), d.y2 - hl * Math.sin(ang + Math.PI/6));
      ctx.closePath(); ctx.fill();
      break;
    }
    case "player_circle": {
      const cx = d.x, cy = d.y, r = d.radius || 30;
      ctx.strokeStyle = ann.color; ctx.lineWidth = 3;
      ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.arc(cx, cy, r + 8, 0, 2 * Math.PI); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = ann.color;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.font = `bold ${Math.max(14, r * 0.7)}px Arial`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(d.number || '1', cx, cy);
      if (d.name) {
        ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.strokeStyle = ann.color; ctx.lineWidth = 1;
        const tw = ctx.measureText(d.name).width + 12;
        ctx.beginPath(); ctx.roundRect(cx - tw/2, cy + r + 4, tw, 20, 3); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.font = '11px Arial'; ctx.textBaseline = 'middle';
        ctx.fillText(d.name, cx, cy + r + 14);
      }
      break;
    }
    case "motion_trail": {
      if (!d.points || d.points.length < 2) break;
      const pts = d.points;
      for (let i = 0; i < pts.length; i++) {
        const alpha = (i + 1) / pts.length;
        const radius = 3 + alpha * 6;
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = ann.color;
        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, radius, 0, 2 * Math.PI); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (pts.length >= 2) {
        const last = pts[pts.length - 1], prev = pts[pts.length - 2];
        const ang2 = Math.atan2(last.y - prev.y, last.x - prev.x);
        ctx.fillStyle = ann.color;
        ctx.beginPath(); ctx.moveTo(last.x, last.y);
        ctx.lineTo(last.x - 18 * Math.cos(ang2 - Math.PI/6), last.y - 18 * Math.sin(ang2 - Math.PI/6));
        ctx.lineTo(last.x - 18 * Math.cos(ang2 + Math.PI/6), last.y - 18 * Math.sin(ang2 + Math.PI/6));
        ctx.closePath(); ctx.fill();
      }
      break;
    }
    case "offside_line": {
      ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 4; ctx.lineCap = 'square';
      ctx.setLineDash([20, 8]);
      ctx.beginPath(); ctx.moveTo(d.x1, d.y1); ctx.lineTo(d.x2, d.y2); ctx.stroke();
      ctx.setLineDash([]);
      const midX = (d.x1 + d.x2) / 2, midY = (d.y1 + d.y2) / 2;
      ctx.fillStyle = '#ef4444'; ctx.globalAlpha = 0.9;
      ctx.beginPath(); ctx.roundRect(midX - 50, midY - 14, 100, 28, 4); ctx.fill();
      ctx.globalAlpha = 1; ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('OFFSIDE', midX, midY);
      break;
    }
    case "penalty_arc": {
      const cx2 = d.x, cy2 = d.y, r2 = d.radius || 80;
      ctx.strokeStyle = ann.color; ctx.lineWidth = 3;
      ctx.setLineDash([10, 6]);
      ctx.beginPath(); ctx.arc(cx2, cy2, r2, 0, 2 * Math.PI); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.15; ctx.fillStyle = ann.color;
      ctx.beginPath(); ctx.arc(cx2, cy2, r2, 0, 2 * Math.PI); ctx.fill();
      ctx.globalAlpha = 1;
      break;
    }
  }
  ctx.restore();
}

// ─── Pitch SVG ──────────────────────────────────────────────────────────────
function PitchSVG() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d3d1a" />
          <stop offset="100%" stopColor="#0a2e14" />
        </linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#pitchGrad)" />
      {[0,1,2,3,4,5,6,7].map(i => (
        <rect key={i} x={i*200} y="0" width="200" height="900" fill={i%2===0 ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)"} />
      ))}
      <rect x="40" y="40" width="1520" height="820" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2.5" />
      <line x1="800" y1="40" x2="800" y2="860" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <circle cx="800" cy="450" r="130" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <circle cx="800" cy="450" r="5" fill="rgba(255,255,255,0.6)" />
      <rect x="40" y="265" width="250" height="370" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <rect x="40" y="355" width="90" height="190" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <circle cx="190" cy="450" r="85" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="8,6" />
      <circle cx="190" cy="450" r="4" fill="rgba(255,255,255,0.5)" />
      <rect x="1310" y="265" width="250" height="370" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
      <rect x="1470" y="355" width="90" height="190" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <circle cx="1410" cy="450" r="85" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeDasharray="8,6" />
      <circle cx="1410" cy="450" r="4" fill="rgba(255,255,255,0.5)" />
      <rect x="40" y="390" width="0" height="120" fill="rgba(255,255,255,0.6)" strokeWidth="4" stroke="rgba(255,255,255,0.6)" />
      <rect x="1560" y="390" width="0" height="120" fill="rgba(255,255,255,0.6)" strokeWidth="4" stroke="rgba(255,255,255,0.6)" />
      <circle cx="800" cy="40" r="4" fill="rgba(255,255,255,0.3)" />
      <circle cx="800" cy="860" r="4" fill="rgba(255,255,255,0.3)" />
      <circle cx="40" cy="40" r="4" fill="rgba(255,255,255,0.3)" />
      <circle cx="1560" cy="40" r="4" fill="rgba(255,255,255,0.3)" />
      <circle cx="40" cy="860" r="4" fill="rgba(255,255,255,0.3)" />
      <circle cx="1560" cy="860" r="4" fill="rgba(255,255,255,0.3)" />
    </svg>
  );
}

// ─── Tool Groups ─────────────────────────────────────────────────────────────
const TOOL_GROUPS = [
  {
    label: "Tactical", color: "text-red-400",
    tools: [
      { id: "arrow" as DrawTool, icon: ArrowRight, label: "Arrow", shortcut: "A" },
      { id: "animated_arrow" as DrawTool, icon: Zap, label: "Bold Arrow", shortcut: "W" },
      { id: "movement_path" as DrawTool, icon: Minus, label: "Run Path", shortcut: "R" },
      { id: "curved_path" as DrawTool, icon: TrendingUp, label: "Curved Run", shortcut: "V" },
      { id: "team_zone" as DrawTool, icon: Circle, label: "Team Zone", shortcut: "Z" },
    ],
  },
  {
    label: "KlipDraw", color: "text-orange-400",
    tools: [
      { id: "player_circle" as DrawTool, icon: Users, label: "Player Circle", shortcut: "N" },
      { id: "motion_trail" as DrawTool, icon: Sparkles, label: "Motion Trail", shortcut: "M" },
      { id: "offside_line" as DrawTool, icon: Minus, label: "Offside Line", shortcut: "O" },
      { id: "penalty_arc" as DrawTool, icon: Target, label: "Penalty Arc", shortcut: "K" },
    ],
  },
  {
    label: "Labels", color: "text-blue-400",
    tools: [
      { id: "player_label" as DrawTool, icon: Users, label: "Player Label", shortcut: "P" },
      { id: "team_label" as DrawTool, icon: Square, label: "Team Label", shortcut: "T" },
      { id: "tactical_box" as DrawTool, icon: MessageSquare, label: "Tactic Box", shortcut: "B" },
    ],
  },
  {
    label: "Effects", color: "text-yellow-400",
    tools: [
      { id: "spotlight" as DrawTool, icon: Star, label: "Spotlight", shortcut: "S" },
      { id: "spotlight_burst" as DrawTool, icon: Zap, label: "Flash Burst", shortcut: "F" },
    ],
  },
  {
    label: "Draw", color: "text-green-400",
    tools: [
      { id: "circle" as DrawTool, icon: Circle, label: "Circle", shortcut: "C" },
      { id: "rectangle" as DrawTool, icon: Square, label: "Rectangle", shortcut: "Q" },
      { id: "line" as DrawTool, icon: Minus, label: "Line", shortcut: "L" },
      { id: "freehand" as DrawTool, icon: Pencil, label: "Freehand", shortcut: "D" },
      { id: "text" as DrawTool, icon: Type, label: "Text", shortcut: "X" },
    ],
  },
];

// ─── Main Component ──────────────────────────────────────────────────────────
export default function VideoTelestration() {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // YouTube helper
  function getYouTubeId(url: string): string | null {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  // ── State ──────────────────────────────────────────────────────────────────
  const { t, language } = useLanguage();
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
  const [directVideoUrlInput, setDirectVideoUrlInput] = useState<string>('');
  const [tool, setTool] = useState<DrawTool>("arrow");
  const [color, setColor] = useState("#ef4444");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoints, setCurrentPoints] = useState<{ x: number; y: number }[]>([]);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState(TEAMS[0]);
  const [formation, setFormation] = useState("4-3-3");
  const [phaseOfPlay, setPhaseOfPlay] = useState("attack");

  // Video state
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  // UI state
  const [sidePanel, setSidePanel] = useState<SidePanel>("tools");
  const [aiPanel, setAiPanel] = useState<AIPanel>("none");
  const [showTemplates, setShowTemplates] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showGrid, setShowGrid] = useState(false);

  // Saved frames / presentation
  const [savedFrames, setSavedFrames] = useState<SavedFrame[]>([]);
  const [isPresentMode, setIsPresentMode] = useState(false);
  const [presentIndex, setPresentIndex] = useState(0);

  // AI state
  const [aiSceneDesc, setAiSceneDesc] = useState("");
  const [aiMatchContext, setAiMatchContext] = useState("");
  const [aiAnalysisResult, setAiAnalysisResult] = useState<string | null>(null);
  const [aiReportResult, setAiReportResult] = useState<string | null>(null);
  const [matchTitle, setMatchTitle] = useState("Future Stars FC vs Opponent");
  const [homeTeam, setHomeTeam] = useState("Future Stars FC");
  const [awayTeam, setAwayTeam] = useState("Opponent");
  const [matchScore, setMatchScore] = useState("");

  // Match tagging
  const [matchTags, setMatchTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // ── Annotation Playback Mode ──────────────────────────────────────────────
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [playbackVisible, setPlaybackVisible] = useState<Annotation[]>([]);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(600); // ms per step
  const [isStepMode, setIsStepMode] = useState(false);

  // ── Inline Input Overlay ──────────────────────────────────────────────────
  interface InlineInput {
    type: 'player' | 'text' | 'frame';
    x: number; // canvas pixel x (for positioning overlay)
    y: number; // canvas pixel y
    canvasX: number; // logical canvas coord
    canvasY: number;
    resolve: (val: Record<string, string> | null) => void;
  }
  const [inlineInput, setInlineInput] = useState<InlineInput | null>(null);
  const [inlineValues, setInlineValues] = useState<Record<string, string>>({});

  function showInlineInput(type: InlineInput['type'], canvasX: number, canvasY: number, canvasEl: HTMLCanvasElement): Promise<Record<string, string> | null> {
    const rect = canvasEl.getBoundingClientRect();
    const px = (canvasX / 1600) * rect.width + rect.left;
    const py = (canvasY / 900) * rect.height + rect.top;
    return new Promise(resolve => {
      const defaults: Record<string, string> = type === 'player'
        ? { playerName: '', position: 'MF', number: '1' }
        : type === 'text'
        ? { text: '' }
        : { title: `Frame ${savedFrames.length + 1}` };
      setInlineValues(defaults);
      setInlineInput({ type, x: px, y: py, canvasX, canvasY, resolve });
    });
  }

  // ── Formation Overlay ──────────────────────────────────────────────────────
  const [showFormationOverlay, setShowFormationOverlay] = useState(false);
  const FORMATION_POSITIONS: Record<string, { x: number; y: number; pos: string }[]> = {
    '4-3-3': [
      { x: 120, y: 450, pos: 'GK' },
      { x: 320, y: 200, pos: 'LB' }, { x: 320, y: 340, pos: 'CB' }, { x: 320, y: 560, pos: 'CB' }, { x: 320, y: 700, pos: 'RB' },
      { x: 560, y: 280, pos: 'CM' }, { x: 560, y: 450, pos: 'CM' }, { x: 560, y: 620, pos: 'CM' },
      { x: 800, y: 200, pos: 'LW' }, { x: 800, y: 450, pos: 'ST' }, { x: 800, y: 700, pos: 'RW' },
    ],
    '4-4-2': [
      { x: 120, y: 450, pos: 'GK' },
      { x: 320, y: 200, pos: 'LB' }, { x: 320, y: 350, pos: 'CB' }, { x: 320, y: 550, pos: 'CB' }, { x: 320, y: 700, pos: 'RB' },
      { x: 560, y: 200, pos: 'LM' }, { x: 560, y: 370, pos: 'CM' }, { x: 560, y: 530, pos: 'CM' }, { x: 560, y: 700, pos: 'RM' },
      { x: 800, y: 340, pos: 'ST' }, { x: 800, y: 560, pos: 'ST' },
    ],
    '4-2-3-1': [
      { x: 120, y: 450, pos: 'GK' },
      { x: 300, y: 200, pos: 'LB' }, { x: 300, y: 360, pos: 'CB' }, { x: 300, y: 540, pos: 'CB' }, { x: 300, y: 700, pos: 'RB' },
      { x: 500, y: 370, pos: 'DM' }, { x: 500, y: 530, pos: 'DM' },
      { x: 680, y: 200, pos: 'LW' }, { x: 680, y: 450, pos: 'CAM' }, { x: 680, y: 700, pos: 'RW' },
      { x: 850, y: 450, pos: 'ST' },
    ],
    '3-5-2': [
      { x: 120, y: 450, pos: 'GK' },
      { x: 300, y: 280, pos: 'CB' }, { x: 300, y: 450, pos: 'CB' }, { x: 300, y: 620, pos: 'CB' },
      { x: 520, y: 160, pos: 'LWB' }, { x: 520, y: 340, pos: 'CM' }, { x: 520, y: 450, pos: 'CM' }, { x: 520, y: 560, pos: 'CM' }, { x: 520, y: 740, pos: 'RWB' },
      { x: 780, y: 340, pos: 'ST' }, { x: 780, y: 560, pos: 'ST' },
    ],
    '5-3-2': [
      { x: 120, y: 450, pos: 'GK' },
      { x: 280, y: 160, pos: 'LWB' }, { x: 280, y: 300, pos: 'CB' }, { x: 280, y: 450, pos: 'CB' }, { x: 280, y: 600, pos: 'CB' }, { x: 280, y: 740, pos: 'RWB' },
      { x: 520, y: 300, pos: 'CM' }, { x: 520, y: 450, pos: 'CM' }, { x: 520, y: 600, pos: 'CM' },
      { x: 760, y: 340, pos: 'ST' }, { x: 760, y: 560, pos: 'ST' },
    ],
  };

  function startAnnotationPlayback() {
    if (annotations.length === 0) {
      toast({ title: 'No annotations to play', description: 'Draw some annotations first.', variant: 'destructive' });
      return;
    }
    setIsPlaybackMode(true);
    setPlaybackVisible([]);
    setPlaybackIndex(0);
  }

  function stopAnnotationPlayback() {
    setIsPlaybackMode(false);
    if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current);
  }

  useEffect(() => {
    if (!isPlaybackMode || isStepMode) return;
    if (playbackIndex >= annotations.length) {
      // Playback complete — keep all visible for 2s then stop
      playbackTimerRef.current = setTimeout(() => setIsPlaybackMode(false), 2000);
      return;
    }
    playbackTimerRef.current = setTimeout(() => {
      setPlaybackVisible(prev => [...prev, annotations[playbackIndex]]);
      setPlaybackIndex(i => i + 1);
    }, playbackSpeed);
    return () => { if (playbackTimerRef.current) clearTimeout(playbackTimerRef.current); };
  }, [isPlaybackMode, isStepMode, playbackIndex, annotations, playbackSpeed]);

  function stepForward() {
    if (playbackIndex < annotations.length) {
      setPlaybackVisible(prev => [...prev, annotations[playbackIndex]]);
      setPlaybackIndex(i => i + 1);
    } else {
      setIsPlaybackMode(false);
    }
  }

  function stepBackward() {
    if (playbackIndex > 0) {
      setPlaybackIndex(i => i - 1);
      setPlaybackVisible(prev => prev.slice(0, -1));
    }
  }

  // tRPC
  const clips = trpc.videoAnalysisAdvanced.getMyClips.useQuery();
  const analyzeTacticalScene = trpc.analysis.analyzeTacticalScene.useMutation();
  const generateAutoAnnotations = trpc.analysis.generateAutoAnnotations.useMutation();
  const generateMatchReport = trpc.analysis.generateMatchReport.useMutation();
  const detectFormation = trpc.analysis.detectFormation.useMutation();

  const youtubeId = uploadedVideoUrl ? getYouTubeId(uploadedVideoUrl) : null;

  // ── Canvas Redraw ──────────────────────────────────────────────────────────
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showAnnotations) return;
    // In playback mode, draw only the progressively revealed annotations
    const visible = isPlaybackMode
      ? playbackVisible
      : annotations.filter(a => a.timestamp <= currentTimestamp + 0.5);
    visible.forEach((ann, idx) => {
      // Fade-in effect: last added annotation gets a glow
      if (isPlaybackMode && idx === visible.length - 1) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        ctx.shadowBlur = 18;
        ctx.shadowColor = ann.color;
      }
      drawAnnotation(ctx, ann);
      if (isPlaybackMode && idx === visible.length - 1) ctx.restore();
    });
    if (showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= 1600; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 900); ctx.stroke(); }
      for (let y = 0; y <= 900; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1600, y); ctx.stroke(); }
    }
  }, [annotations, currentTimestamp, showAnnotations, showGrid, isPlaybackMode, playbackVisible]);

  useEffect(() => { redrawCanvas(); }, [redrawCanvas]);

  // ── Canvas Coords ──────────────────────────────────────────────────────────
  function getCanvasCoords(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 1600,
      y: ((e.clientY - rect.top) / rect.height) * 900,
    };
  }

  // ── Mouse Handlers ─────────────────────────────────────────────────────────
  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const pt = getCanvasCoords(e);
    setIsDrawing(true);
    setStartPoint(pt);
    if (tool === "freehand") setCurrentPoints([pt]);
    if (tool === "player_label") {
      setIsDrawing(false);
      const canvas = canvasRef.current!;
      showInlineInput('player', pt.x, pt.y, canvas).then(vals => {
        if (!vals) return;
        setAnnotations(prev => [...prev, {
          type: "player_label", color, timestamp: currentTimestamp,
          data: { x: pt.x, y: pt.y, playerName: vals.playerName || 'PLAYER', position: vals.position || 'MF', labelX: pt.x, labelY: pt.y - 80, playerX: pt.x, playerY: pt.y }
        }]);
      });
    } else if (tool === "player_circle") {
      setIsDrawing(false);
      const canvas = canvasRef.current!;
      showInlineInput('player', pt.x, pt.y, canvas).then(vals => {
        if (!vals) return;
        setAnnotations(prev => [...prev, {
          type: "player_circle", color, timestamp: currentTimestamp,
          data: { x: pt.x, y: pt.y, radius: 30, number: vals.number || '1', name: vals.playerName || undefined }
        }]);
      });
    } else if (tool === "tactical_box") {
      setIsDrawing(false);
      const canvas = canvasRef.current!;
      showInlineInput('text', pt.x, pt.y, canvas).then(vals => {
        if (!vals) return;
        setAnnotations(prev => [...prev, {
          type: "tactical_box", color, timestamp: currentTimestamp,
          data: { x: pt.x, y: pt.y, teamName: selectedTeam.name.toUpperCase(), text: vals.text || 'TACTICAL ANALYSIS' }
        }]);
      });
    } else if (tool === "team_label") {
      setIsDrawing(false);
      const canvas = canvasRef.current!;
      showInlineInput('text', pt.x, pt.y, canvas).then(vals => {
        if (!vals) return;
        setAnnotations(prev => [...prev, {
          type: "team_label", color, timestamp: currentTimestamp,
          data: { x: pt.x, y: pt.y, teamName: vals.text || selectedTeam.name }
        }]);
      });
    } else if (tool === "text") {
      setIsDrawing(false);
      const canvas = canvasRef.current!;
      showInlineInput('text', pt.x, pt.y, canvas).then(vals => {
        if (!vals) return;
        setAnnotations(prev => [...prev, {
          type: "text", color, timestamp: currentTimestamp,
          data: { x: pt.x, y: pt.y, text: vals.text || 'Text' }
        }]);
      });
    } else if (tool === "spotlight" || tool === "spotlight_burst") {
      setAnnotations(prev => [...prev, {
        type: tool, color, timestamp: currentTimestamp,
        data: { x: pt.x, y: pt.y, radius: 55 }
      }]);
      setIsDrawing(false);
    } else if (tool === "motion_trail") {
      setCurrentPoints([pt]);
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !startPoint) return;
    const pt = getCanvasCoords(e);
    if (tool === "freehand") setCurrentPoints(prev => [...prev, pt]);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    redrawCanvas();
    ctx.save();
    const preview: Annotation = { type: tool, color, timestamp: currentTimestamp, data: {} };
    if (["arrow", "animated_arrow", "movement_path", "curved_path", "line", "circle", "rectangle", "team_zone", "offside_line"].includes(tool)) {
      preview.data = { x1: startPoint.x, y1: startPoint.y, x2: pt.x, y2: pt.y, teamName: selectedTeam.name.toUpperCase(), teamColor: selectedTeam.color };
    } else if (tool === "freehand") {
      preview.data = { points: [...currentPoints, pt] };
    } else if (tool === "motion_trail") {
      setCurrentPoints(prev => [...prev, pt]);
      preview.data = { points: [...currentPoints, pt] };
    }
    drawAnnotation(ctx, preview);
    ctx.restore();
  }

  function handleMouseUp(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing || !startPoint) return;
    const pt = getCanvasCoords(e);
    setIsDrawing(false);
    if (["arrow", "animated_arrow", "movement_path", "curved_path", "line", "offside_line"].includes(tool)) {
      const dx = pt.x - startPoint.x, dy = pt.y - startPoint.y;
      if (Math.sqrt(dx * dx + dy * dy) < 10) { setStartPoint(null); return; }
      setAnnotations(prev => [...prev, { type: tool, color, timestamp: currentTimestamp, data: { x1: startPoint.x, y1: startPoint.y, x2: pt.x, y2: pt.y } }]);
    } else if (["circle", "rectangle"].includes(tool)) {
      setAnnotations(prev => [...prev, { type: tool, color, timestamp: currentTimestamp, data: { x1: startPoint.x, y1: startPoint.y, x2: pt.x, y2: pt.y } }]);
    } else if (tool === "team_zone") {
      setAnnotations(prev => [...prev, { type: tool, color, timestamp: currentTimestamp, data: { x1: startPoint.x, y1: startPoint.y, x2: pt.x, y2: pt.y, teamName: selectedTeam.name.toUpperCase(), teamColor: selectedTeam.color } }]);
    } else if (tool === "freehand" && currentPoints.length > 1) {
      setAnnotations(prev => [...prev, { type: tool, color, timestamp: currentTimestamp, data: { points: currentPoints } }]);
      setCurrentPoints([]);
    } else if (tool === "motion_trail" && currentPoints.length > 1) {
      setAnnotations(prev => [...prev, { type: "motion_trail", color, timestamp: currentTimestamp, data: { points: [...currentPoints, pt] } }]);
      setCurrentPoints([]);
    }
    setStartPoint(null);
  }

  // ── Video Handlers ─────────────────────────────────────────────────────────
  function handleVideoLoaded() {
    if (videoRef.current) setVideoDuration(videoRef.current.duration);
  }
  function handleVideoTimeUpdate() {
    if (videoRef.current) { setVideoCurrentTime(videoRef.current.currentTime); setCurrentTimestamp(videoRef.current.currentTime); }
  }
  function handleVideoPlayPause() {
    if (!videoRef.current) return;
    if (isVideoPlaying) videoRef.current.pause(); else videoRef.current.play();
  }
  function handleScrub(e: React.ChangeEvent<HTMLInputElement>) {
    const t = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = t;
    setVideoCurrentTime(t); setCurrentTimestamp(t);
  }
  function formatTime(s: number) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  function handleExportFrame() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = 1600; exportCanvas.height = 900;
    const ctx = exportCanvas.getContext("2d")!;
    ctx.fillStyle = "#0d3d1a";
    ctx.fillRect(0, 0, 1600, 900);
    if (videoRef.current && uploadedVideoUrl && !youtubeId) ctx.drawImage(videoRef.current, 0, 0, 1600, 900);
    annotations.forEach(a => drawAnnotation(ctx, a));
    const link = document.createElement("a");
    link.download = `tactical-frame-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
    toast({ title: "Frame exported!", description: "Tactical frame saved as PNG." });
  }

  function handleSaveFrame() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = rect.left + rect.width / 2;
    const py = rect.top + rect.height / 2;
    showInlineInput('frame', 800, 450, canvas).then(vals => {
      if (!vals) return;
      const title = vals.title || `Frame ${savedFrames.length + 1}`;
      setSavedFrames(prev => [...prev, { id: Date.now().toString(), title, annotations: [...annotations], videoTime: videoCurrentTime }]);
      toast({ title: 'Frame saved!', description: `"${title}" added to presentation.` });
    });
  }

  // ── AI Handlers ────────────────────────────────────────────────────────────
  async function handleAIAnalyze() {
    if (!aiSceneDesc.trim()) {
      toast({ title: "Describe the scene first", description: "Enter what tactical situation you want analyzed.", variant: "destructive" });
      return;
    }
    setAiAnalysisResult(null);
    try {
      const result = await analyzeTacticalScene.mutateAsync({
        sceneDescription: aiSceneDesc,
        formation,
        phaseOfPlay,
        teamColor: selectedTeam.color,
        matchContext: aiMatchContext || undefined,
      });
      setAiAnalysisResult(result.analysis);
    } catch {
      toast({ title: "AI Analysis failed", variant: "destructive" });
    }
  }

  async function handleAutoAnnotate() {
    try {
      const result = await generateAutoAnnotations.mutateAsync({
        phaseOfPlay: phaseOfPlay as any,
        formation,
        teamColor: selectedTeam.color,
        scenario: aiSceneDesc || undefined,
      });
      if (result.annotations && result.annotations.length > 0) {
        setAnnotations(prev => [...prev, ...result.annotations.map((a: any) => ({ ...a, timestamp: currentTimestamp }))]);
        toast({ title: `✨ ${result.annotations.length} AI annotations added!`, description: `Auto-generated for ${phaseOfPlay} phase in ${formation}.` });
      } else {
        toast({ title: "No annotations generated", description: "Try a different phase or scenario.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Auto-annotation failed", variant: "destructive" });
    }
  }

  async function handleGenerateReport() {
    try {
      const result = await generateMatchReport.mutateAsync({
        matchTitle,
        homeTeam,
        awayTeam,
        score: matchScore || undefined,
        keyMoments: matchTags,
        tacticalNotes: aiSceneDesc || undefined,
        annotationCount: annotations.length,
      });
      setAiReportResult(result.report);
    } catch {
      toast({ title: "Report generation failed", variant: "destructive" });
    }
  }

  function handleLoadDemo() {
    setUploadedVideoUrl('https://www.youtube.com/watch?v=X0we8220k74');
    setAnnotations([
      // Man City high press zone
      { type: 'team_zone', color: '#6CABDD', data: { x1: 800, y1: 100, x2: 1560, y2: 650, teamName: 'MAN CITY PRESS', teamColor: '#6CABDD' }, timestamp: 0 },
      // Man United defensive block
      { type: 'team_zone', color: '#DA291C', data: { x1: 40, y1: 300, x2: 700, y2: 800, teamName: 'MAN UTD BLOCK', teamColor: '#DA291C' }, timestamp: 0 },
      // De Bruyne through ball path
      { type: 'movement_path', color: '#6CABDD', data: { x1: 780, y1: 450, x2: 1100, y2: 280 }, timestamp: 0 },
      // Striker run in behind
      { type: 'arrow', color: '#22c55e', data: { x1: 900, y1: 500, x2: 1300, y2: 250 }, timestamp: 0 },
      // Fullback overlap
      { type: 'arrow', color: '#eab308', data: { x1: 1200, y1: 600, x2: 1450, y2: 350 }, timestamp: 0 },
      // Spotlight on key player
      { type: 'spotlight', color: '#6CABDD', data: { x: 780, y: 450, radius: 60 }, timestamp: 0 },
      // Player label
      { type: 'player_label', color: '#6CABDD', data: { x: 780, y: 450, playerName: 'DE BRUYNE', position: 'CAM', labelX: 820, labelY: 360, playerX: 780, playerY: 450 }, timestamp: 0 },
      // Offside line
      { type: 'offside_line', color: '#ef4444', data: { x1: 40, y1: 300, x2: 1560, y2: 300 }, timestamp: 0 },
      // Tactical analysis box
      { type: 'tactical_box', color: '#6CABDD', data: { x: 400, y: 730, teamName: 'MAN CITY ATTACK', text: 'DE BRUYNE SWITCHES PLAY → STRIKER RUNS IN BEHIND HIGH LINE → FULLBACK OVERLAPS FOR 3v2 ON FLANK.' }, timestamp: 0 },
    ]);
    toast({ title: 'Man City vs Man United — 2024 Community Shield', description: '9 tactical annotations loaded. Draw more with the tools on the left.' });
  }

  // ── Present Mode ──────────────────────────────────────────────────────────
  if (isPresentMode && savedFrames.length > 0) {
    const frame = savedFrames[presentIndex];
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-foreground font-bold text-sm tracking-widest uppercase">Tactical Presentation</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground text-sm">{presentIndex + 1} / {savedFrames.length}</span>
            <button onClick={() => setIsPresentMode(false)} className="text-muted-foreground hover:text-foreground p-1"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex-1 relative flex items-center justify-center bg-black p-8">
          <div className="relative w-full max-w-6xl" style={{ aspectRatio: "16/9" }}>
            <PitchSVG />
            <canvas
              ref={canvasRef}
              width={1600} height={900}
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 py-4 bg-card border-t border-border">
          <button onClick={() => { setPresentIndex(i => Math.max(0, i - 1)); setAnnotations(savedFrames[Math.max(0, presentIndex - 1)].annotations); }} disabled={presentIndex === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronLeft className="w-8 h-8" /></button>
          <span className="text-foreground font-semibold text-lg">{frame.title}</span>
          <button onClick={() => { setPresentIndex(i => Math.min(savedFrames.length - 1, i + 1)); setAnnotations(savedFrames[Math.min(savedFrames.length - 1, presentIndex + 1)].annotations); }} disabled={presentIndex === savedFrames.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30"><ChevronRight className="w-8 h-8" /></button>
        </div>
      </div>
    );
  }

  // ── Main Render ────────────────────────────────────────────────────────────
  return (
    <>
      <div className="flex flex-col h-screen bg-[#070b0f] text-white overflow-hidden">

        {/* ── Top Bar ── */}
        <div className="shrink-0 flex items-center gap-3 px-4 py-2.5 bg-[#0d1117] border-b border-white/8 z-10">
          {/* Back Button */}
          <BackButton />
          {/* Left: Logo + Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
              <Video className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <p className="text-foreground font-bold text-sm leading-none">Tactical Annotator</p>
              <p className="text-muted-foreground text-xs leading-none mt-0.5">AI-Powered Video Analysis</p>
            </div>
          </div>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Match Info */}
          <div className="flex items-center gap-2 flex-1">
            <input
              value={homeTeam}
              onChange={e => setHomeTeam(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-foreground w-28 focus:outline-none focus:border-red-500/50"
              placeholder="Home Team"
            />
            <span className="text-muted-foreground text-xs font-bold">vs</span>
            <input
              value={awayTeam}
              onChange={e => setAwayTeam(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-foreground w-28 focus:outline-none focus:border-red-500/50"
              placeholder="Away Team"
            />
            <input
              value={matchScore}
              onChange={e => setMatchScore(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-foreground w-16 text-center focus:outline-none focus:border-red-500/50"
              placeholder="0 - 0"
            />
          </div>

          {/* Formation + Phase */}
          <div className="flex items-center gap-2">
            <select
              value={formation}
              onChange={e => setFormation(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              {FORMATIONS.map(f => <option key={f} value={f} className="bg-card">{f}</option>)}
            </select>
            <select
              value={phaseOfPlay}
              onChange={e => setPhaseOfPlay(e.target.value)}
              className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-blue-500/50 cursor-pointer"
            >
              {PHASES_OF_PLAY.map(p => <option key={p.id} value={p.id} className="bg-card">{p.icon} {p.label}</option>)}
            </select>
          </div>

          <div className="w-px h-8 bg-white/10 mx-1" />

          {/* Right: Actions */}
          <div className="flex items-center gap-1.5">
            <button onClick={() => setShowAnnotations(v => !v)} className={`p-1.5 rounded transition-colors ${showAnnotations ? "text-foreground bg-white/10" : "text-muted-foreground hover:text-foreground"}`} title="Toggle annotations">
              {showAnnotations ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button onClick={() => setShowGrid(v => !v)} className={`p-1.5 rounded transition-colors ${showGrid ? "text-foreground bg-white/10" : "text-muted-foreground hover:text-foreground"}`} title="Toggle grid">
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowFormationOverlay(v => !v)}
              className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-semibold transition-colors ${showFormationOverlay ? 'bg-yellow-600/60 text-yellow-200 border border-yellow-500/40' : 'text-muted-foreground hover:text-foreground hover:bg-white/10'}`}
              title="Toggle formation overlay"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Formation</span>
            </button>
            <button onClick={handleSaveFrame} disabled={annotations.length === 0} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors disabled:opacity-30" title="Save frame">
              <Save className="w-4 h-4" />
            </button>
            {annotations.length > 0 && (
              <div className="flex items-center gap-1">
                {isPlaybackMode && isStepMode && (
                  <>
                    <button onClick={stepBackward} disabled={playbackIndex === 0}
                      className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-foreground disabled:opacity-30 transition-colors" title="Step back">
                      <SkipBack className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={stepForward} disabled={playbackIndex >= annotations.length}
                      className="p-1.5 rounded bg-white/10 hover:bg-white/20 text-foreground disabled:opacity-30 transition-colors" title="Step forward">
                      <SkipForward className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                {!isPlaybackMode && (
                  <>
                    <button
                      onClick={() => { setIsStepMode(false); startAnnotationPlayback(); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold transition-colors"
                      title="Auto-play annotations">
                      <PlayCircle className="w-3.5 h-3.5" /> Play
                    </button>
                    <button
                      onClick={() => { setIsStepMode(true); startAnnotationPlayback(); }}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-blue-700 hover:bg-blue-600 text-white text-xs font-semibold transition-colors"
                      title="Step through annotations">
                      <SkipForward className="w-3.5 h-3.5" /> Step
                    </button>
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/10">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <input type="range" min={200} max={1500} step={100} value={playbackSpeed}
                        onChange={e => setPlaybackSpeed(Number(e.target.value))}
                        className="w-16 h-1 accent-orange-500 cursor-pointer"
                        title={`Speed: ${playbackSpeed}ms per step`} />
                      <span className="text-[10px] text-muted-foreground w-8">{playbackSpeed}ms</span>
                    </div>
                  </>
                )}
                {isPlaybackMode && (
                  <button
                    onClick={stopAnnotationPlayback}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors animate-pulse"
                  >
                    <PauseCircle className="w-3.5 h-3.5" /> Stop ({playbackIndex}/{annotations.length})
                  </button>
                )}
              </div>
            )}
            {savedFrames.length > 0 && (
              <button onClick={() => setIsPresentMode(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors">
                <Presentation className="w-3.5 h-3.5" />
                Present ({savedFrames.length})
              </button>
            )}
            <button onClick={handleExportFrame} disabled={annotations.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-green-700 hover:bg-green-600 text-white text-xs font-semibold transition-colors disabled:opacity-30">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* ── Main Body ── */}
        <div className="flex-1 flex overflow-hidden">

          {/* ── Left Panel ── */}
          <div className="w-56 shrink-0 flex flex-col bg-[#0d1117] border-r border-white/8 overflow-hidden">

            {/* Panel Tabs */}
            <div className="flex border-b border-white/8">
              {([
                { id: "tools", icon: Pencil, label: "Tools" },
                { id: "ai", icon: Brain, label: "AI" },
                { id: "library", icon: BookOpen, label: "Library" },
                { id: "frames", icon: Layers, label: "Frames" },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSidePanel(tab.id)}
                  className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${sidePanel === tab.id ? "text-foreground border-b-2 border-red-500 bg-white/5" : "text-muted-foreground hover:text-muted-foreground"}`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-4 scrollbar-thin scrollbar-thumb-white/10">

              {/* ── TOOLS PANEL ── */}
              {sidePanel === "tools" && (
                <>
                  {/* Team selector */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Team</p>
                    <div className="space-y-0.5">
                      {TEAMS.map(t => (
                        <button key={t.name} onClick={() => setSelectedTeam(t)}
                          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${selectedTeam.name === t.name ? "bg-white/10 text-foreground" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}>
                          <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                          {t.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tool groups */}
                  {TOOL_GROUPS.map(group => (
                    <div key={group.label}>
                      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${group.color}`}>{group.label}</p>
                      <div className="space-y-0.5">
                        {group.tools.map(t => {
                          const Icon = t.icon;
                          return (
                            <button key={t.id} onClick={() => setTool(t.id)}
                              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${tool === t.id ? "bg-red-700/60 text-white border border-red-600/40" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"}`}>
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="flex-1 text-left">{t.label}</span>
                              <span className="text-[9px] text-gray-600 font-mono">{t.shortcut}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Color picker */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Color</p>
                    <div className="grid grid-cols-5 gap-1.5">
                      {COLORS.map(c => (
                        <button key={c.hex} onClick={() => setColor(c.hex)} title={c.name}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${color === c.hex ? "scale-125 border-white shadow-lg" : "border-white/20 hover:border-white/50"}`}
                          style={{ backgroundColor: c.hex }} />
                      ))}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full border-2 border-white/30" style={{ backgroundColor: color }} />
                      <input type="color" value={color} onChange={e => setColor(e.target.value)}
                        className="flex-1 h-6 rounded cursor-pointer bg-transparent border-0" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1.5">
                    <button onClick={() => setAnnotations(prev => prev.slice(0, -1))} disabled={annotations.length === 0}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-white/5 hover:bg-white/10 text-muted-foreground text-xs border border-white/10 transition-colors disabled:opacity-30">
                      <Undo className="w-3.5 h-3.5" /> Undo
                    </button>
                    <button onClick={() => setAnnotations([])} disabled={annotations.length === 0}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded bg-white/5 hover:bg-red-900/30 text-muted-foreground hover:text-red-400 text-xs border border-white/10 transition-colors disabled:opacity-30">
                      <RotateCcw className="w-3.5 h-3.5" /> Clear All
                    </button>
                  </div>

                  {annotations.length > 0 && (
                    <div className="text-center">
                      <span className="text-xs text-muted-foreground">{annotations.length} annotation{annotations.length !== 1 ? "s" : ""}</span>
                    </div>
                  )}
                </>
              )}

              {/* ── AI PANEL ── */}
              {sidePanel === "ai" && (
                <div className="space-y-3">
                  <div className="brand-gradient-subtle flex items-center gap-2 p-2 rounded-lg border border-purple-500/20">
                    <Brain className="w-4 h-4 text-purple-400 shrink-0" />
                    <p className="text-xs text-purple-200 font-medium">AI Tactical Engine</p>
                  </div>

                  {/* Scene description */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Scene Description</p>
                    <textarea
                      value={aiSceneDesc}
                      onChange={e => setAiSceneDesc(e.target.value)}
                      placeholder="Describe the tactical situation... e.g. 'Team pressing high, fullback overlapping, striker making diagonal run'"
                      className="w-full bg-white/5 border border-white/10 rounded p-2 text-xs text-foreground placeholder-gray-600 resize-none focus:outline-none focus:border-purple-500/50 h-20"
                    />
                  </div>

                  {/* Match context */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Match Context</p>
                    <input
                      value={aiMatchContext}
                      onChange={e => setAiMatchContext(e.target.value)}
                      placeholder="e.g. 75th min, 1-0 up, need to defend lead"
                      className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-foreground placeholder-gray-600 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  {/* AI Actions */}
                  <div className="space-y-1.5">
                    <button onClick={handleAIAnalyze} disabled={analyzeTacticalScene.isPending}
                      className="brand-gradient w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white text-xs font-semibold transition-all disabled:opacity-50">
                      {analyzeTacticalScene.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                      AI Tactical Analysis
                    </button>
                    <button onClick={handleAutoAnnotate} disabled={generateAutoAnnotations.isPending}
                      className="brand-gradient w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white text-xs font-semibold transition-all disabled:opacity-50">
                      {generateAutoAnnotations.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                      Auto-Annotate Phase
                    </button>
                    <button onClick={handleGenerateReport} disabled={generateMatchReport.isPending}
                      className="brand-gradient w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white text-xs font-semibold transition-all disabled:opacity-50">
                      {generateMatchReport.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                      Generate Match Report
                    </button>
                  </div>

                  {/* AI Analysis Result */}
                  {aiAnalysisResult && (
                    <div className="rounded-lg border border-purple-500/30 bg-purple-900/10 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest">AI Analysis</p>
                        <button onClick={() => { navigator.clipboard.writeText(aiAnalysisResult); toast({ title: "Copied!" }); }}
                          className="text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                        <MarkdownContent content={aiAnalysisResult} className="text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {/* Match Report Result */}
                  {aiReportResult && (
                    <div className="rounded-lg border border-orange-500/30 bg-orange-900/10 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-widest">Match Report</p>
                        <button onClick={() => { navigator.clipboard.writeText(aiReportResult); toast({ title: "Copied!" }); }}
                          className="text-muted-foreground hover:text-foreground"><Copy className="w-3 h-3" /></button>
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                        <MarkdownContent content={aiReportResult} className="text-muted-foreground" />
                      </div>
                    </div>
                  )}

                  {/* Match Tags */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1.5">Key Moments</p>
                    <div className="flex gap-1 mb-1.5">
                      <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter" && tagInput.trim()) { setMatchTags(prev => [...prev, tagInput.trim()]); setTagInput(""); } }}
                        placeholder="Add moment tag..."
                        className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-foreground placeholder-gray-600 focus:outline-none" />
                      <button onClick={() => { if (tagInput.trim()) { setMatchTags(prev => [...prev, tagInput.trim()]); setTagInput(""); } }}
                        className="px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-foreground transition-colors">+</button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {matchTags.map((tag, i) => (
                        <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-900/40 border border-blue-500/30 text-blue-800 dark:text-blue-300 text-[10px]">
                          {tag}
                          <button onClick={() => setMatchTags(prev => prev.filter((_, j) => j !== i))} className="text-blue-400 hover:text-foreground"><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── LIBRARY PANEL ── */}
              {sidePanel === "library" && (
                <div className="space-y-3">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Tactical Templates</p>

                  {/* Phase quick-filter */}
                  <div className="flex flex-wrap gap-1">
                    {["All", "Attack", "Defending", "Possession", "Transition", "Set Pieces", "Pressing"].map(cat => (
                      <button key={cat} className="px-2 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-foreground text-[10px] border border-white/10 transition-colors">
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Templates */}
                  {TEMPLATES.map(tmpl => (
                    <div key={tmpl.id} className="rounded-lg border border-white/10 bg-white/3 hover:bg-white/6 transition-colors overflow-hidden">
                      <div className="flex items-center gap-2 p-2">
                        <span className="text-lg">{tmpl.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{tmpl.name}</p>
                          <p className="text-[10px] text-muted-foreground">{tmpl.category}</p>
                        </div>
                        <button
                          onClick={() => { setAnnotations(tmpl.annotations.map(a => ({ ...a, timestamp: currentTimestamp }))); toast({ title: `${tmpl.icon} Template applied`, description: tmpl.name }); }}
                          className="px-2 py-1 rounded text-[10px] font-semibold text-foreground transition-colors"
                          style={{ backgroundColor: tmpl.color + "40", border: `1px solid ${tmpl.color}60` }}>
                          Apply
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Video Source */}
                  <div className="pt-2 border-t border-white/10">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Video Source</p>
                    <div className="space-y-1.5">
                      <button onClick={() => fileInputRef.current?.click()}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-muted-foreground text-xs border border-white/10 transition-colors">
                        <Upload className="w-3.5 h-3.5" /> Upload Video
                      </button>
                      <input ref={fileInputRef} type="file" accept="video/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) setUploadedVideoUrl(URL.createObjectURL(f)); }} />
                      <div className="flex gap-1">
                        <input value={directVideoUrlInput} onChange={e => setDirectVideoUrlInput(e.target.value)}
                          placeholder="YouTube or MP4 URL..."
                          className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-foreground placeholder-gray-600 focus:outline-none focus:border-blue-500/50" />
                        <button onClick={() => { if (directVideoUrlInput.trim()) { setUploadedVideoUrl(directVideoUrlInput.trim()); setDirectVideoUrlInput(""); } }}
                          className="px-2 py-1 bg-blue-700/40 hover:bg-blue-700/60 text-blue-300 text-xs rounded border border-blue-600/40 transition-colors">
                          Load
                        </button>
                      </div>
                      <button onClick={handleLoadDemo}
                        className="brand-gradient-subtle w-full flex items-center gap-2 px-3 py-2 rounded-lg text-yellow-300 text-xs border border-yellow-600/30 transition-colors">
                        <Zap className="w-3.5 h-3.5" /> Load Demo Match
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── FRAMES PANEL ── */}
              {sidePanel === "frames" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Saved Frames</p>
                    <span className="text-[10px] text-gray-600">{savedFrames.length} frames</span>
                  </div>
                  {savedFrames.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <Layers className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs">No frames saved yet</p>
                      <p className="text-[10px] mt-1">Draw annotations and click Save</p>
                    </div>
                  ) : (
                    savedFrames.map((frame, i) => (
                      <div key={frame.id} className="rounded-lg border border-white/10 bg-white/3 p-2 flex items-center gap-2">
                        <div className="w-8 h-8 rounded bg-green-900/40 flex items-center justify-center text-xs font-bold text-green-400">{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">{frame.title}</p>
                          <p className="text-[10px] text-muted-foreground">{frame.annotations.length} annotations</p>
                        </div>
                        <button onClick={() => { setAnnotations(frame.annotations); setCurrentTimestamp(frame.videoTime); toast({ title: `Loaded: ${frame.title}` }); }}
                          className="text-muted-foreground hover:text-foreground p-1"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setSavedFrames(prev => prev.filter(f => f.id !== frame.id))}
                          className="text-gray-600 hover:text-red-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ))
                  )}
                  {savedFrames.length > 0 && (
                    <button onClick={() => setIsPresentMode(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-700/40 hover:bg-blue-700/60 text-blue-300 text-xs border border-blue-600/40 transition-colors">
                      <Presentation className="w-3.5 h-3.5" /> Start Presentation
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Canvas Area ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#070b0f]">

            {/* Phase of Play Indicator */}
            <div className="shrink-0 flex items-center gap-2 px-4 py-1.5 bg-[#0d1117]/80 border-b border-white/5">
              {PHASES_OF_PLAY.filter(p => p.id === phaseOfPlay).map(p => (
                <div key={p.id} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: p.color }} />
                  <span className="text-xs font-semibold" style={{ color: p.color }}>{p.icon} {p.label.toUpperCase()}</span>
                </div>
              ))}
              <span className="text-gray-600 text-xs mx-2">·</span>
              <span className="text-muted-foreground text-xs font-mono">{formation}</span>
              <span className="text-gray-600 text-xs mx-2">·</span>
              <span className="text-muted-foreground text-xs">{homeTeam} vs {awayTeam}</span>
              {matchScore && <><span className="text-gray-600 text-xs mx-1">·</span><span className="text-foreground text-xs font-bold">{matchScore}</span></>}
              <div className="flex-1" />
              <span className="text-gray-600 text-xs font-mono">{annotations.length} annotations</span>
              {videoCurrentTime > 0 && <span className="text-gray-600 text-xs font-mono ml-2">⏱ {formatTime(videoCurrentTime)}</span>}
            </div>

            {/* Canvas + Video */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-3">
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative" style={{ aspectRatio: "16/9", maxHeight: "100%", maxWidth: "100%", width: "100%" }}>

                  {/* Video or Pitch */}
                  {uploadedVideoUrl ? (
                    youtubeId ? (
                      <iframe
                        className="absolute inset-0 w-full h-full rounded-xl"
                        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0&modestbranding=1&enablejsapi=1`}
                        title="Football Match"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ border: 'none', zIndex: 0 }}
                      />
                    ) : (
                      <video
                        ref={videoRef}
                        src={uploadedVideoUrl}
                        className="absolute inset-0 w-full h-full object-cover rounded-xl"
                        controls={false}
                        muted={isMuted}
                        onTimeUpdate={handleVideoTimeUpdate}
                        onLoadedMetadata={handleVideoLoaded}
                        onPlay={() => setIsVideoPlaying(true)}
                        onPause={() => setIsVideoPlaying(false)}
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 rounded-xl overflow-hidden">
                      <PitchSVG />
                      {/* No-video overlay */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/20">
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600/30 to-red-900/30 border border-red-500/20 flex items-center justify-center mx-auto mb-3">
                            <Video className="w-8 h-8 text-red-400 opacity-60" />
                          </div>
                          <p className="text-foreground/60 text-sm font-medium">Tactical Canvas Ready</p>
                          <p className="text-foreground/30 text-xs mt-1">Upload a video or draw directly on the pitch</p>
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-foreground text-sm border border-white/20 transition-colors">
                            <Upload className="w-4 h-4" /> Upload Video
                          </button>
                          <button onClick={handleLoadDemo}
                            className="brand-gradient-subtle flex items-center gap-2 px-4 py-2 rounded-lg text-yellow-200 text-sm border border-yellow-600/30 transition-colors">
                            <Zap className="w-4 h-4" /> Demo Match
                          </button>
                        </div>
                        <div className="flex gap-2">
                          {TEMPLATES.slice(0, 3).map(tmpl => (
                            <button key={tmpl.id}
                              onClick={() => { setAnnotations(tmpl.annotations.map(a => ({ ...a, timestamp: 0 }))); toast({ title: `${tmpl.icon} ${tmpl.name} loaded` }); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors"
                              style={{ backgroundColor: tmpl.color + "20", borderColor: tmpl.color + "40", color: tmpl.color }}>
                              {tmpl.icon} {tmpl.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Drawing Canvas */}
                  <canvas
                    ref={canvasRef}
                    width={1600} height={900}
                    className="absolute inset-0 w-full h-full rounded-xl"
                    style={{ cursor: "crosshair", zIndex: 10 }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={() => { if (isDrawing) { setIsDrawing(false); setStartPoint(null); } }}
                  />

                  {/* Active Tool Badge */}
                  <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 border border-white/10 backdrop-blur-sm">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                    <span className="text-foreground text-xs font-medium capitalize">{tool.replace("_", " ")}</span>
                  </div>

                  {/* Formation Overlay */}
                  {showFormationOverlay && (() => {
                    const positions = FORMATION_POSITIONS[formation] || FORMATION_POSITIONS['4-3-3'];
                    return (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1600 900" style={{ zIndex: 15 }}>
                        {positions.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r={28} fill={selectedTeam.color + 'cc'} stroke="white" strokeWidth="2" />
                            <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="11" fontWeight="bold">{i === 0 ? 'GK' : i}</text>
                            <text x={p.x} y={p.y + 44} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize="10" fontWeight="600">{p.pos}</text>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}

                  {/* AI Loading Overlay */}
                  {(analyzeTacticalScene.isPending || generateAutoAnnotations.isPending) && (
                    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/50 rounded-xl backdrop-blur-sm">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-purple-600/30 border border-purple-500/50 flex items-center justify-center">
                          <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
                        </div>
                        <p className="text-foreground text-sm font-semibold">AI Analyzing...</p>
                        <p className="text-muted-foreground text-xs">Processing tactical scene</p>
                      </div>
                    </div>
                  )}

                  {/* Inline Input Overlay */}
                  {inlineInput && (
                    <div
                      className="fixed z-50 bg-[#1a1f2e] border border-white/20 rounded-xl shadow-2xl p-4 w-72"
                      style={{
                        left: Math.min(inlineInput.x + 12, window.innerWidth - 300),
                        top: Math.min(inlineInput.y + 12, window.innerHeight - 200),
                      }}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-foreground text-xs font-semibold uppercase tracking-widest">
                          {inlineInput.type === 'player' ? 'Player Info' : inlineInput.type === 'frame' ? 'Save Frame' : 'Add Text'}
                        </p>
                        <button onClick={() => { inlineInput.resolve(null); setInlineInput(null); }} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="space-y-2">
                        {inlineInput.type === 'player' && (
                          <>
                            <input autoFocus placeholder="Player name" value={inlineValues.playerName || ''}
                              onChange={e => setInlineValues(v => ({ ...v, playerName: e.target.value }))}
                              className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500/50" />
                            <div className="flex gap-2">
                              <input placeholder="Position (MF)" value={inlineValues.position || ''}
                                onChange={e => setInlineValues(v => ({ ...v, position: e.target.value }))}
                                className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500/50" />
                              <input placeholder="#" value={inlineValues.number || ''}
                                onChange={e => setInlineValues(v => ({ ...v, number: e.target.value }))}
                                className="w-14 bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500/50" />
                            </div>
                          </>
                        )}
                        {inlineInput.type === 'text' && (
                          <textarea autoFocus placeholder="Enter text..." value={inlineValues.text || ''}
                            onChange={e => setInlineValues(v => ({ ...v, text: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none h-16" />
                        )}
                        {inlineInput.type === 'frame' && (
                          <input autoFocus placeholder="Frame title" value={inlineValues.title || ''}
                            onChange={e => setInlineValues(v => ({ ...v, title: e.target.value }))}
                            className="w-full bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-foreground placeholder-gray-500 focus:outline-none focus:border-blue-500/50" />
                        )}
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => { inlineInput.resolve(null); setInlineInput(null); }}
                          className="flex-1 px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-muted-foreground text-xs border border-white/10 transition-colors">Cancel</button>
                        <button
                          onClick={() => { inlineInput.resolve(inlineValues); setInlineInput(null); }}
                          onKeyDown={e => { if (e.key === 'Enter') { inlineInput.resolve(inlineValues); setInlineInput(null); } }}
                          className="flex-1 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors">Confirm</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Video Controls ── */}
            {uploadedVideoUrl && !youtubeId && videoDuration > 0 && (
              <div className="shrink-0 bg-[#0d1117] border-t border-white/8 px-4 py-2">
                <div className="flex items-center gap-3">
                  <button onClick={handleVideoPlayPause} className="text-foreground hover:text-green-400 transition-colors">
                    {isVideoPlaying ? <PauseCircle className="w-6 h-6" /> : <PlayCircle className="w-6 h-6" />}
                  </button>
                  <button onClick={() => { setIsMuted(v => !v); if (videoRef.current) videoRef.current.muted = !isMuted; }}
                    className="text-muted-foreground hover:text-foreground transition-colors">
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <span className="text-muted-foreground text-xs font-mono w-10 shrink-0">{formatTime(videoCurrentTime)}</span>
                  <div className="flex-1 relative h-5 flex items-center">
                    <input type="range" min={0} max={videoDuration} step={0.1} value={videoCurrentTime}
                      onChange={handleScrub}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ background: `linear-gradient(to right, #ef4444 ${(videoCurrentTime / videoDuration) * 100}%, rgba(255,255,255,0.1) 0%)` }}
                    />
                    {/* Annotation markers */}
                    {annotations.map((ann, i) => (
                      <div key={i} className="absolute w-1 h-3 rounded-full bg-yellow-400 opacity-70 pointer-events-none"
                        style={{ left: `${(ann.timestamp / videoDuration) * 100}%`, transform: "translateX(-50%)" }} />
                    ))}
                  </div>
                  <span className="text-gray-600 text-xs font-mono w-10 shrink-0 text-right">{formatTime(videoDuration)}</span>
                  <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoCurrentTime - 5); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"><SkipBack className="w-4 h-4" /></button>
                  <button onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(videoDuration, videoCurrentTime + 5); }}
                    className="text-muted-foreground hover:text-foreground transition-colors"><SkipForward className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            {/* ── Status Bar ── */}
            <div className="shrink-0 flex items-center gap-4 px-4 py-1.5 bg-[#0d1117] border-t border-white/5 text-[10px] text-gray-600">
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Ready
              </span>
              <span>Tool: <span className="text-muted-foreground capitalize">{tool.replace("_", " ")}</span></span>
              <span>Color: <span className="font-mono" style={{ color }}>{color}</span></span>
              <span>Formation: <span className="text-muted-foreground">{formation}</span></span>
              <div className="flex-1" />
              <span className="text-gray-700">Future Stars Academy · Tactical Annotator v2.0</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
