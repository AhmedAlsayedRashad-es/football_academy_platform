import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Play, RotateCcw, Zap, Target, Flag, AlertCircle,
  ChevronRight, TrendingUp, Users, Brain, Shield, Save, FolderOpen, Trash2,
  Link2, Copy, Pencil, Check, Mic, MicOff, Volume2, GripVertical
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Vec2 { x: number; y: number; }
interface AnimPlayer {
  id: number; pos: Vec2; targetPos: Vec2; color: string; number: number; role: string;
  minPlayers?: number; // minimum team size for this player to appear (7, 9, or 11)
  team: 'attack' | 'defend' | 'gk';
  waypoints?: Vec2[]; // optional intermediate waypoints for curved multi-segment paths
  defenseTarget?: Vec2; // where this player moves during the defensive response phase
}
interface BallKeyframe { t: number; pos: Vec2; }

interface Scenario {
  id: string;
  label: string;
  type: 'corner' | 'penalty' | 'freekick';
  description: string;
  successRate: number;
  players: AnimPlayer[];
  ballPath: BallKeyframe[];
  tips: string[];
}

// ─── Pitch dimensions (canvas units) ─────────────────────────────────────────
const CW = 800;
const CH = 500;
const GOAL_W = 80;

// ─── Scenario definitions ─────────────────────────────────────────────────────
// team field: 'attack' = our team (blue), 'defend' = opponent (red), 'gk' = goalkeeper (green)
// minPlayers: player only appears when team size >= this value
const SCENARIOS: Scenario[] = [
  // ── CORNER KICK – Near Post Flick-On ──────────────────────────────────────
  {
    id: 'corner_near_post',
    label: 'Corner – Near Post Run',
    type: 'corner',
    description: 'Inswinging corner aimed at the near post. Runner flicks on for a second attacker arriving at the far post.',
    successRate: 28,
    tips: [
      'Delivery must be fast and low to the near post (6-yard box edge)',
      'Near-post runner times run to arrive just before the ball',
      'Far-post runner holds position until the flick-on',
      'Midfielder stays outside the box for a potential clearance',
    ],
    players: [
      // Attackers (our team) – minPlayers controls who appears
      { id: 1, pos: { x: 20, y: CH / 2 }, targetPos: { x: 20, y: CH / 2 }, color: '#3b82f6', number: 9, role: 'Taker', team: 'attack', minPlayers: 7 },
      { id: 2, pos: { x: CW * 0.72, y: CH * 0.35 }, targetPos: { x: CW * 0.82, y: CH * 0.42 }, color: '#3b82f6', number: 7, role: 'Near Post Runner', team: 'attack', minPlayers: 7 },
      { id: 3, pos: { x: CW * 0.65, y: CH * 0.55 }, targetPos: { x: CW * 0.88, y: CH * 0.55 }, color: '#3b82f6', number: 10, role: 'Far Post Runner', team: 'attack', minPlayers: 7 },
      { id: 4, pos: { x: CW * 0.60, y: CH * 0.45 }, targetPos: { x: CW * 0.75, y: CH * 0.48 }, color: '#3b82f6', number: 11, role: 'Central Runner', team: 'attack', minPlayers: 9 },
      { id: 5, pos: { x: CW * 0.55, y: CH * 0.65 }, targetPos: { x: CW * 0.68, y: CH * 0.62 }, color: '#3b82f6', number: 6, role: 'Second Ball', team: 'attack', minPlayers: 11 },
      // Defenders (opponent)
      { id: 6, pos: { x: CW * 0.80, y: CH * 0.40 }, targetPos: { x: CW * 0.83, y: CH * 0.44 }, defenseTarget: { x: CW * 0.80, y: CH * 0.38 }, color: '#ef4444', number: 4, role: 'Defender', team: 'defend', minPlayers: 7 },
      { id: 7, pos: { x: CW * 0.85, y: CH * 0.55 }, targetPos: { x: CW * 0.88, y: CH * 0.52 }, defenseTarget: { x: CW * 0.83, y: CH * 0.62 }, color: '#ef4444', number: 5, role: 'Defender', team: 'defend', minPlayers: 7 },
      { id: 8, pos: { x: CW * 0.78, y: CH * 0.60 }, targetPos: { x: CW * 0.81, y: CH * 0.56 }, color: '#ef4444', number: 3, role: 'Defender', team: 'defend', minPlayers: 9 },
      { id: 9, pos: { x: CW * 0.82, y: CH * 0.30 }, targetPos: { x: CW * 0.85, y: CH * 0.34 }, color: '#ef4444', number: 2, role: 'Defender', team: 'defend', minPlayers: 11 },
      { id: 10, pos: { x: CW * 0.75, y: CH * 0.70 }, targetPos: { x: CW * 0.78, y: CH * 0.66 }, color: '#ef4444', number: 6, role: 'Defender', team: 'defend', minPlayers: 11 },
      // Goalkeeper
      { id: 11, pos: { x: CW * 0.96, y: CH / 2 }, targetPos: { x: CW * 0.96, y: CH * 0.42 }, color: '#22c55e', number: 1, role: 'Goalkeeper', team: 'gk', minPlayers: 7 },
      // Extra attackers (holding midfielders/defenders)
      { id: 12, pos: { x: CW * 0.38, y: CH * 0.28 }, targetPos: { x: CW * 0.44, y: CH * 0.30 }, color: '#3b82f6', number: 8, role: 'CM Hold', team: 'attack', minPlayers: 11 },
      { id: 13, pos: { x: CW * 0.38, y: CH * 0.72 }, targetPos: { x: CW * 0.44, y: CH * 0.70 }, color: '#3b82f6', number: 4, role: 'CM Hold', team: 'attack', minPlayers: 11 },
      { id: 14, pos: { x: CW * 0.22, y: CH * 0.22 }, targetPos: { x: CW * 0.28, y: CH * 0.24 }, color: '#3b82f6', number: 2, role: 'RB Hold', team: 'attack', minPlayers: 11 },
      { id: 15, pos: { x: CW * 0.22, y: CH * 0.78 }, targetPos: { x: CW * 0.28, y: CH * 0.76 }, color: '#3b82f6', number: 3, role: 'LB Hold', team: 'attack', minPlayers: 11 },
      { id: 16, pos: { x: CW * 0.10, y: CH * 0.50 }, targetPos: { x: CW * 0.16, y: CH * 0.50 }, color: '#3b82f6', number: 5, role: 'CB Hold', team: 'attack', minPlayers: 11 },
      // Extra defenders (midfielders)
      { id: 17, pos: { x: CW * 0.65, y: CH * 0.22 }, targetPos: { x: CW * 0.72, y: CH * 0.28 }, color: '#ef4444', number: 7, role: 'Mid Defend', team: 'defend', minPlayers: 11 },
      { id: 18, pos: { x: CW * 0.65, y: CH * 0.78 }, targetPos: { x: CW * 0.72, y: CH * 0.72 }, color: '#ef4444', number: 8, role: 'Mid Defend', team: 'defend', minPlayers: 11 },
      { id: 19, pos: { x: CW * 0.58, y: CH * 0.50 }, targetPos: { x: CW * 0.64, y: CH * 0.48 }, color: '#ef4444', number: 10, role: 'CDM', team: 'defend', minPlayers: 11 },
      { id: 20, pos: { x: CW * 0.70, y: CH * 0.15 }, targetPos: { x: CW * 0.76, y: CH * 0.20 }, color: '#ef4444', number: 11, role: 'Winger', team: 'defend', minPlayers: 11 },
      { id: 21, pos: { x: CW * 0.70, y: CH * 0.85 }, targetPos: { x: CW * 0.76, y: CH * 0.80 }, color: '#ef4444', number: 9, role: 'Winger', team: 'defend', minPlayers: 11 },
    ],
    ballPath: [
      { t: 0, pos: { x: 20, y: CH / 2 } },
      { t: 0.3, pos: { x: CW * 0.55, y: CH * 0.30 } },
      { t: 0.55, pos: { x: CW * 0.82, y: CH * 0.42 } },
      { t: 0.75, pos: { x: CW * 0.88, y: CH * 0.50 } },
      { t: 1.0, pos: { x: CW * 0.92, y: CH * 0.52 } },
    ],
  },
  // ── CORNER KICK – Short Corner ────────────────────────────────────────────
  {
    id: 'corner_short',
    label: 'Corner – Short Combination',
    type: 'corner',
    description: 'Short corner to create a better crossing angle, pulling defenders out of position.',
    successRate: 22,
    tips: [
      'Second player must make a sharp run to receive the short pass',
      'Taker immediately moves to create a 2v1 on the corner',
      'Cross should be aimed at the penalty spot',
      'Three attackers must time their runs into the box simultaneously',
    ],
    players: [
      { id: 1, pos: { x: 20, y: CH / 2 }, targetPos: { x: 20, y: CH / 2 }, color: '#3b82f6', number: 9, role: 'Taker', team: 'attack', minPlayers: 7 },
      { id: 2, pos: { x: 60, y: CH * 0.60 }, targetPos: { x: 40, y: CH * 0.55 }, color: '#3b82f6', number: 8, role: 'Short Runner', team: 'attack', minPlayers: 7 },
      { id: 3, pos: { x: CW * 0.70, y: CH * 0.40 }, targetPos: { x: CW * 0.85, y: CH * 0.45 }, color: '#3b82f6', number: 7, role: 'Box Runner 1', team: 'attack', minPlayers: 7 },
      { id: 4, pos: { x: CW * 0.65, y: CH * 0.55 }, targetPos: { x: CW * 0.82, y: CH * 0.55 }, color: '#3b82f6', number: 10, role: 'Box Runner 2', team: 'attack', minPlayers: 9 },
      { id: 5, pos: { x: CW * 0.60, y: CH * 0.65 }, targetPos: { x: CW * 0.78, y: CH * 0.62 }, color: '#3b82f6', number: 11, role: 'Box Runner 3', team: 'attack', minPlayers: 11 },
      { id: 6, pos: { x: CW * 0.80, y: CH * 0.42 }, targetPos: { x: CW * 0.80, y: CH * 0.42 }, color: '#ef4444', number: 4, role: 'Defender', team: 'defend', minPlayers: 7 },
      { id: 7, pos: { x: CW * 0.85, y: CH * 0.55 }, targetPos: { x: CW * 0.88, y: CH * 0.52 }, defenseTarget: { x: CW * 0.83, y: CH * 0.62 }, color: '#ef4444', number: 5, role: 'Defender', team: 'defend', minPlayers: 7 },
      { id: 8, pos: { x: CW * 0.78, y: CH * 0.30 }, targetPos: { x: CW * 0.78, y: CH * 0.30 }, color: '#ef4444', number: 3, role: 'Defender', team: 'defend', minPlayers: 9 },
      { id: 9, pos: { x: CW * 0.82, y: CH * 0.68 }, targetPos: { x: CW * 0.82, y: CH * 0.68 }, color: '#ef4444', number: 2, role: 'Defender', team: 'defend', minPlayers: 11 },
      { id: 10, pos: { x: CW * 0.96, y: CH / 2 }, targetPos: { x: CW * 0.96, y: CH * 0.40 }, color: '#22c55e', number: 1, role: 'Goalkeeper', team: 'gk', minPlayers: 7 },
      // Extra attackers
      { id: 11, pos: { x: CW * 0.40, y: CH * 0.28 }, targetPos: { x: CW * 0.40, y: CH * 0.28 }, color: '#3b82f6', number: 6, role: 'CM Hold', team: 'attack', minPlayers: 11 },
      { id: 12, pos: { x: CW * 0.40, y: CH * 0.72 }, targetPos: { x: CW * 0.40, y: CH * 0.72 }, color: '#3b82f6', number: 4, role: 'CM Hold', team: 'attack', minPlayers: 11 },
      { id: 13, pos: { x: CW * 0.22, y: CH * 0.22 }, targetPos: { x: CW * 0.22, y: CH * 0.22 }, color: '#3b82f6', number: 2, role: 'RB Hold', team: 'attack', minPlayers: 11 },
      { id: 14, pos: { x: CW * 0.22, y: CH * 0.78 }, targetPos: { x: CW * 0.22, y: CH * 0.78 }, color: '#3b82f6', number: 3, role: 'LB Hold', team: 'attack', minPlayers: 11 },
      { id: 15, pos: { x: CW * 0.10, y: CH * 0.50 }, targetPos: { x: CW * 0.10, y: CH * 0.50 }, color: '#3b82f6', number: 5, role: 'CB Hold', team: 'attack', minPlayers: 11 },
      // Extra defenders
      { id: 16, pos: { x: CW * 0.65, y: CH * 0.22 }, targetPos: { x: CW * 0.65, y: CH * 0.22 }, color: '#ef4444', number: 6, role: 'Mid Defend', team: 'defend', minPlayers: 11 },
      { id: 17, pos: { x: CW * 0.65, y: CH * 0.78 }, targetPos: { x: CW * 0.65, y: CH * 0.78 }, color: '#ef4444', number: 7, role: 'Mid Defend', team: 'defend', minPlayers: 11 },
      { id: 18, pos: { x: CW * 0.58, y: CH * 0.50 }, targetPos: { x: CW * 0.58, y: CH * 0.50 }, color: '#ef4444', number: 8, role: 'CDM', team: 'defend', minPlayers: 11 },
      { id: 19, pos: { x: CW * 0.72, y: CH * 0.15 }, targetPos: { x: CW * 0.72, y: CH * 0.15 }, color: '#ef4444', number: 9, role: 'Winger', team: 'defend', minPlayers: 11 },
      { id: 20, pos: { x: CW * 0.72, y: CH * 0.85 }, targetPos: { x: CW * 0.72, y: CH * 0.85 }, color: '#ef4444', number: 10, role: 'Winger', team: 'defend', minPlayers: 11 },
    ],
    ballPath: [
      { t: 0, pos: { x: 20, y: CH / 2 } },
      { t: 0.25, pos: { x: 40, y: CH * 0.55 } },
      { t: 0.50, pos: { x: 30, y: CH * 0.50 } },
      { t: 0.70, pos: { x: CW * 0.55, y: CH * 0.28 } },
      { t: 0.85, pos: { x: CW * 0.82, y: CH * 0.50 } },
      { t: 1.0, pos: { x: CW * 0.90, y: CH * 0.52 } },
    ],
  },
  // ── PENALTY KICK – Power Shot ─────────────────────────────────────────────
  {
    id: 'penalty_power',
    label: 'Penalty – Power Shot (Low Corner)',
    type: 'penalty',
    description: 'Hard, low shot aimed at the bottom corner. Goalkeeper dives the wrong way.',
    successRate: 78,
    tips: [
      'Choose your corner before the run-up — commit and do not change',
      'Short run-up (3–5 steps) for maximum power and accuracy',
      'Plant foot points to the opposite side of the target',
      'Strike through the ball with the laces, keep head down',
      'Follow through low to keep the shot on target',
    ],
    players: [
      { id: 1, pos: { x: CW * 0.60, y: CH / 2 }, targetPos: { x: CW * 0.76, y: CH / 2 }, color: '#3b82f6', number: 9, role: 'Taker', team: 'attack', minPlayers: 7 },
      { id: 2, pos: { x: CW * 0.65, y: CH * 0.22 }, targetPos: { x: CW * 0.65, y: CH * 0.22 }, color: '#3b82f6', number: 10, role: 'Rebound Runner', team: 'attack', minPlayers: 9 },
      { id: 3, pos: { x: CW * 0.65, y: CH * 0.78 }, targetPos: { x: CW * 0.65, y: CH * 0.78 }, color: '#3b82f6', number: 7, role: 'Rebound Runner', team: 'attack', minPlayers: 11 },
      { id: 4, pos: { x: CW * 0.97, y: CH / 2 }, targetPos: { x: CW * 0.97, y: CH * 0.35 }, color: '#22c55e', number: 1, role: 'Goalkeeper', team: 'gk', minPlayers: 7 },
      // Extra attackers waiting outside box
      { id: 5, pos: { x: CW * 0.62, y: CH * 0.25 }, targetPos: { x: CW * 0.62, y: CH * 0.25 }, color: '#3b82f6', number: 7, role: 'Rebound Wait', team: 'attack', minPlayers: 11 },
      { id: 6, pos: { x: CW * 0.62, y: CH * 0.75 }, targetPos: { x: CW * 0.62, y: CH * 0.75 }, color: '#3b82f6', number: 11, role: 'Rebound Wait', team: 'attack', minPlayers: 11 },
      { id: 7, pos: { x: CW * 0.50, y: CH * 0.35 }, targetPos: { x: CW * 0.50, y: CH * 0.35 }, color: '#3b82f6', number: 8, role: 'CM Hold', team: 'attack', minPlayers: 11 },
      { id: 8, pos: { x: CW * 0.50, y: CH * 0.65 }, targetPos: { x: CW * 0.50, y: CH * 0.65 }, color: '#3b82f6', number: 6, role: 'CM Hold', team: 'attack', minPlayers: 11 },
      // Defenders on edge of box
      { id: 9, pos: { x: CW * 0.62, y: CH * 0.38 }, targetPos: { x: CW * 0.68, y: CH * 0.42 }, color: '#ef4444', number: 5, role: 'Box Edge', team: 'defend', minPlayers: 11 },
      { id: 10, pos: { x: CW * 0.62, y: CH * 0.62 }, targetPos: { x: CW * 0.68, y: CH * 0.58 }, color: '#ef4444', number: 4, role: 'Box Edge', team: 'defend', minPlayers: 11 },
      { id: 11, pos: { x: CW * 0.55, y: CH * 0.28 }, targetPos: { x: CW * 0.62, y: CH * 0.34 }, color: '#ef4444', number: 3, role: 'Box Edge', team: 'defend', minPlayers: 11 },
      { id: 12, pos: { x: CW * 0.55, y: CH * 0.72 }, targetPos: { x: CW * 0.62, y: CH * 0.66 }, color: '#ef4444', number: 2, role: 'Box Edge', team: 'defend', minPlayers: 11 },
    ],
    ballPath: [
      { t: 0, pos: { x: CW * 0.76, y: CH / 2 } },
      { t: 0.4, pos: { x: CW * 0.85, y: CH / 2 } },
      { t: 0.75, pos: { x: CW * 0.93, y: CH * 0.54 } },
      { t: 1.0, pos: { x: CW * 0.97, y: CH * 0.58 } },
    ],
  },
  // ── PENALTY KICK – Panenka ────────────────────────────────────────────────
  {
    id: 'penalty_panenka',
    label: 'Penalty – Panenka (Chip)',
    type: 'penalty',
    description: 'Delicate chip down the center as the goalkeeper dives to a side.',
    successRate: 65,
    tips: [
      'Only use Panenka when goalkeeper is known to dive early',
      'Slow, deliberate run-up to force the keeper to commit',
      'Scoop under the ball with the instep — no follow-through',
      'Keep your nerve — hesitation will result in a weak shot',
    ],
    players: [
      { id: 1, pos: { x: CW * 0.60, y: CH / 2 }, targetPos: { x: CW * 0.76, y: CH / 2 }, color: '#3b82f6', number: 9, role: 'Taker', team: 'attack', minPlayers: 7 },
      { id: 2, pos: { x: CW * 0.97, y: CH / 2 }, targetPos: { x: CW * 0.97, y: CH * 0.68 }, color: '#22c55e', number: 1, role: 'Goalkeeper', team: 'gk', minPlayers: 7 },
    ],
    ballPath: [
      { t: 0, pos: { x: CW * 0.76, y: CH / 2 } },
      { t: 0.4, pos: { x: CW * 0.85, y: CH * 0.46 } },
      { t: 0.75, pos: { x: CW * 0.93, y: CH * 0.48 } },
      { t: 1.0, pos: { x: CW * 0.97, y: CH * 0.50 } },
    ],
  },
  // ── FREE KICK – Direct Shot (Wall) ────────────────────────────────────────
  {
    id: 'freekick_direct',
    label: 'Free Kick – Direct Shot Over Wall',
    type: 'freekick',
    description: 'Curling shot over the defensive wall into the top corner.',
    successRate: 18,
    tips: [
      'Strike the lower half of the ball with the instep for topspin dip',
      'Aim 1 meter over the wall — ball will dip sharply',
      'Approach at a 30–45° angle for natural curl',
      'Decoy runner can distract the goalkeeper',
      'Wall must be set at exactly 9.15m from the ball',
    ],
    players: [
      { id: 1, pos: { x: CW * 0.35, y: CH * 0.38 }, targetPos: { x: CW * 0.42, y: CH * 0.36 }, color: '#3b82f6', number: 10, role: 'Shooter', team: 'attack', minPlayers: 7 },
      { id: 2, pos: { x: CW * 0.38, y: CH * 0.45 }, targetPos: { x: CW * 0.44, y: CH * 0.50 }, color: '#3b82f6', number: 9, role: 'Decoy', team: 'attack', minPlayers: 7 },
      { id: 3, pos: { x: CW * 0.55, y: CH * 0.35 }, targetPos: { x: CW * 0.75, y: CH * 0.40 }, waypoints: [{ x: CW * 0.62, y: CH * 0.28 }, { x: CW * 0.70, y: CH * 0.34 }], color: '#3b82f6', number: 7, role: 'Box Runner', team: 'attack', minPlayers: 9 },
      { id: 4, pos: { x: CW * 0.52, y: CH * 0.65 }, targetPos: { x: CW * 0.72, y: CH * 0.58 }, waypoints: [{ x: CW * 0.58, y: CH * 0.74 }, { x: CW * 0.66, y: CH * 0.64 }], color: '#3b82f6', number: 11, role: 'Far Runner', team: 'attack', minPlayers: 11 },
      // Wall (opponent) — 7-a-side has 2 in wall, 9-a-side has 3, 11-a-side has 4
      { id: 5, pos: { x: CW * 0.50, y: CH * 0.38 }, targetPos: { x: CW * 0.50, y: CH * 0.30 }, defenseTarget: { x: CW * 0.60, y: CH * 0.36 }, color: '#ef4444', number: 5, role: 'Wall', team: 'defend', minPlayers: 7 },
      { id: 6, pos: { x: CW * 0.50, y: CH * 0.43 }, targetPos: { x: CW * 0.50, y: CH * 0.35 }, defenseTarget: { x: CW * 0.60, y: CH * 0.42 }, color: '#ef4444', number: 4, role: 'Wall', team: 'defend', minPlayers: 7 },
      { id: 7, pos: { x: CW * 0.50, y: CH * 0.48 }, targetPos: { x: CW * 0.50, y: CH * 0.40 }, defenseTarget: { x: CW * 0.60, y: CH * 0.48 }, color: '#ef4444', number: 3, role: 'Wall', team: 'defend', minPlayers: 9 },
      { id: 8, pos: { x: CW * 0.50, y: CH * 0.53 }, targetPos: { x: CW * 0.50, y: CH * 0.45 }, defenseTarget: { x: CW * 0.60, y: CH * 0.54 }, color: '#ef4444', number: 6, role: 'Wall', team: 'defend', minPlayers: 11 },
      { id: 9, pos: { x: CW * 0.88, y: CH / 2 }, targetPos: { x: CW * 0.88, y: CH * 0.42 }, color: '#22c55e', number: 1, role: 'Goalkeeper', team: 'gk', minPlayers: 7 },
      // Extra attackers
      { id: 10, pos: { x: CW * 0.22, y: CH * 0.30 }, targetPos: { x: CW * 0.30, y: CH * 0.32 }, color: '#3b82f6', number: 8, role: 'CM Hold', team: 'attack', minPlayers: 11 },
      { id: 11, pos: { x: CW * 0.22, y: CH * 0.70 }, targetPos: { x: CW * 0.30, y: CH * 0.68 }, color: '#3b82f6', number: 6, role: 'CM Hold', team: 'attack', minPlayers: 11 },
      { id: 12, pos: { x: CW * 0.12, y: CH * 0.22 }, targetPos: { x: CW * 0.18, y: CH * 0.24 }, color: '#3b82f6', number: 2, role: 'RB Hold', team: 'attack', minPlayers: 11 },
      { id: 13, pos: { x: CW * 0.12, y: CH * 0.78 }, targetPos: { x: CW * 0.18, y: CH * 0.76 }, color: '#3b82f6', number: 3, role: 'LB Hold', team: 'attack', minPlayers: 11 },
      { id: 14, pos: { x: CW * 0.08, y: CH * 0.50 }, targetPos: { x: CW * 0.14, y: CH * 0.50 }, color: '#3b82f6', number: 5, role: 'CB Hold', team: 'attack', minPlayers: 11 },
      // Extra defenders
      { id: 15, pos: { x: CW * 0.62, y: CH * 0.22 }, targetPos: { x: CW * 0.68, y: CH * 0.28 }, defenseTarget: { x: CW * 0.74, y: CH * 0.38 }, color: '#ef4444', number: 7, role: 'Mid Defend', team: 'defend', minPlayers: 11 },
      { id: 16, pos: { x: CW * 0.62, y: CH * 0.78 }, targetPos: { x: CW * 0.68, y: CH * 0.72 }, defenseTarget: { x: CW * 0.74, y: CH * 0.62 }, color: '#ef4444', number: 8, role: 'Mid Defend', team: 'defend', minPlayers: 11 },
      { id: 17, pos: { x: CW * 0.55, y: CH * 0.50 }, targetPos: { x: CW * 0.62, y: CH * 0.46 }, color: '#ef4444', number: 10, role: 'CDM', team: 'defend', minPlayers: 11 },
      { id: 18, pos: { x: CW * 0.72, y: CH * 0.15 }, targetPos: { x: CW * 0.78, y: CH * 0.22 }, color: '#ef4444', number: 9, role: 'Winger', team: 'defend', minPlayers: 11 },
      { id: 19, pos: { x: CW * 0.72, y: CH * 0.85 }, targetPos: { x: CW * 0.78, y: CH * 0.78 }, color: '#ef4444', number: 11, role: 'Winger', team: 'defend', minPlayers: 11 },
    ],
    ballPath: [
      { t: 0, pos: { x: CW * 0.35, y: CH * 0.38 } },
      { t: 0.35, pos: { x: CW * 0.52, y: CH * 0.28 } },
      { t: 0.65, pos: { x: CW * 0.72, y: CH * 0.32 } },
      { t: 0.85, pos: { x: CW * 0.85, y: CH * 0.38 } },
      { t: 1.0, pos: { x: CW * 0.90, y: CH * 0.42 } },
    ],
  },
  // ── FREE KICK – Layoff Combination ───────────────────────────────────────
  {
    id: 'freekick_layoff',
    label: 'Free Kick – Layoff Combination',
    type: 'freekick',
    description: 'Short layoff to a runner arriving late, creating a shooting opportunity outside the wall.',
    successRate: 24,
    tips: [
      'Fake shot from the main taker to freeze the wall and goalkeeper',
      'Layoff must be precise — 1–2 touch maximum',
      'Shooter arrives at full pace to strike first time',
      'Timing of the run is critical — must be onside at the moment of the pass',
    ],
    players: [
      { id: 1, pos: { x: CW * 0.35, y: CH * 0.42 }, targetPos: { x: CW * 0.42, y: CH * 0.40 }, color: '#3b82f6', number: 10, role: 'Fake Shooter', team: 'attack', minPlayers: 7 },
      { id: 2, pos: { x: CW * 0.37, y: CH * 0.50 }, targetPos: { x: CW * 0.44, y: CH * 0.48 }, color: '#3b82f6', number: 8, role: 'Layoff', team: 'attack', minPlayers: 7 },
      { id: 3, pos: { x: CW * 0.28, y: CH * 0.62 }, targetPos: { x: CW * 0.42, y: CH * 0.52 }, waypoints: [{ x: CW * 0.32, y: CH * 0.72 }, { x: CW * 0.38, y: CH * 0.60 }], color: '#3b82f6', number: 11, role: 'Late Runner', team: 'attack', minPlayers: 7 },
      { id: 4, pos: { x: CW * 0.60, y: CH * 0.38 }, targetPos: { x: CW * 0.78, y: CH * 0.42 }, color: '#3b82f6', number: 7, role: 'Box Runner', team: 'attack', minPlayers: 9 },
      { id: 5, pos: { x: CW * 0.58, y: CH * 0.62 }, targetPos: { x: CW * 0.76, y: CH * 0.58 }, color: '#3b82f6', number: 9, role: 'Far Runner', team: 'attack', minPlayers: 11 },
      // Wall
      { id: 6, pos: { x: CW * 0.50, y: CH * 0.40 }, targetPos: { x: CW * 0.50, y: CH * 0.40 }, color: '#ef4444', number: 5, role: 'Wall', team: 'defend', minPlayers: 7 },
      { id: 7, pos: { x: CW * 0.50, y: CH * 0.46 }, targetPos: { x: CW * 0.50, y: CH * 0.46 }, color: '#ef4444', number: 4, role: 'Wall', team: 'defend', minPlayers: 7 },
      { id: 8, pos: { x: CW * 0.50, y: CH * 0.52 }, targetPos: { x: CW * 0.50, y: CH * 0.52 }, color: '#ef4444', number: 3, role: 'Wall', team: 'defend', minPlayers: 9 },
      { id: 9, pos: { x: CW * 0.88, y: CH / 2 }, targetPos: { x: CW * 0.88, y: CH * 0.44 }, color: '#22c55e', number: 1, role: 'Goalkeeper', team: 'gk', minPlayers: 7 },
    ],
    ballPath: [
      { t: 0, pos: { x: CW * 0.35, y: CH * 0.42 } },
      { t: 0.30, pos: { x: CW * 0.37, y: CH * 0.50 } },
      { t: 0.55, pos: { x: CW * 0.42, y: CH * 0.52 } },
      { t: 0.75, pos: { x: CW * 0.60, y: CH * 0.50 } },
      { t: 0.90, pos: { x: CW * 0.82, y: CH * 0.48 } },
      { t: 1.0, pos: { x: CW * 0.90, y: CH * 0.50 } },
    ],
  },

  // ── CORNER KICK – Zonal Overload ─────────────────────────────────────────
  {
    id: 'corner_zonal_overload',
    label: 'Corner – Zonal Overload',
    type: 'corner',
    description: 'Three attackers flood the 6-yard box while a decoy runner drags defenders to the far post.',
    successRate: 31,
    tips: [
      'Delivery must be whipped to the penalty spot at head height',
      'Decoy runner must commit defenders before the ball is struck',
      'Three attackers in the 6-yard box create numerical advantage',
      'Midfielder holds outside the box for a potential second ball',
      'Timing: all runs start simultaneously as the taker begins approach',
    ],
    players: [
      { id: 1, pos: { x: 20, y: CH * 0.15 }, targetPos: { x: 20, y: CH * 0.15 }, color: '#3b82f6', number: 7, role: 'Taker', team: 'attack', minPlayers: 7 },
      { id: 2, pos: { x: CW * 0.68, y: CH * 0.70 }, targetPos: { x: CW * 0.88, y: CH * 0.65 }, color: '#3b82f6', number: 9, role: 'Far Post Decoy', team: 'attack', minPlayers: 7 },
      { id: 3, pos: { x: CW * 0.62, y: CH * 0.40 }, targetPos: { x: CW * 0.84, y: CH * 0.38 }, color: '#3b82f6', number: 10, role: 'Near Box Runner', team: 'attack', minPlayers: 7 },
      { id: 4, pos: { x: CW * 0.58, y: CH * 0.52 }, targetPos: { x: CW * 0.86, y: CH * 0.50 }, color: '#3b82f6', number: 6, role: 'Central Box Runner', team: 'attack', minPlayers: 9 },
      { id: 5, pos: { x: CW * 0.55, y: CH * 0.30 }, targetPos: { x: CW * 0.80, y: CH * 0.32 }, color: '#3b82f6', number: 11, role: 'Third Box Runner', team: 'attack', minPlayers: 9 },
      { id: 6, pos: { x: CW * 0.48, y: CH * 0.55 }, targetPos: { x: CW * 0.60, y: CH * 0.52 }, color: '#3b82f6', number: 8, role: 'Second Ball', team: 'attack', minPlayers: 11 },
      // Defenders
      { id: 7, pos: { x: CW * 0.82, y: CH * 0.35 }, targetPos: { x: CW * 0.82, y: CH * 0.35 }, color: '#ef4444', number: 5, role: 'Zonal Defender', team: 'defend', minPlayers: 7 },
      { id: 8, pos: { x: CW * 0.85, y: CH * 0.50 }, targetPos: { x: CW * 0.85, y: CH * 0.50 }, color: '#ef4444', number: 4, role: 'Zonal Defender', team: 'defend', minPlayers: 7 },
      { id: 9, pos: { x: CW * 0.80, y: CH * 0.62 }, targetPos: { x: CW * 0.80, y: CH * 0.62 }, color: '#ef4444', number: 3, role: 'Zonal Defender', team: 'defend', minPlayers: 9 },
      { id: 10, pos: { x: CW * 0.75, y: CH * 0.25 }, targetPos: { x: CW * 0.75, y: CH * 0.25 }, color: '#ef4444', number: 2, role: 'Man Marker', team: 'defend', minPlayers: 11 },
      { id: 11, pos: { x: CW * 0.96, y: CH / 2 }, targetPos: { x: CW * 0.96, y: CH * 0.38 }, color: '#22c55e', number: 1, role: 'Goalkeeper', team: 'gk', minPlayers: 7 },
    ],
    ballPath: [
      { t: 0, pos: { x: 20, y: CH * 0.15 } },
      { t: 0.25, pos: { x: CW * 0.45, y: CH * 0.20 } },
      { t: 0.55, pos: { x: CW * 0.75, y: CH * 0.35 } },
      { t: 0.78, pos: { x: CW * 0.86, y: CH * 0.42 } },
      { t: 1.0, pos: { x: CW * 0.90, y: CH * 0.48 } },
    ],
  },

  // ── CORNER KICK – Reverse Inswinger ──────────────────────────────────────
  {
    id: 'corner_reverse_inswinger',
    label: 'Corner – Reverse Inswinger',
    type: 'corner',
    description: 'Left-footed inswinging corner from the right side, bending away from the goalkeeper into the danger zone.',
    successRate: 26,
    tips: [
      'Left-footed taker required for natural inswing from right corner',
      'Ball should bend away from the goalkeeper — hard to claim',
      'Tall header target positions at the near post to flick on',
      'Second runner peels away from the near post to the penalty spot',
      'Goalkeeper is forced to come or stay — both create danger',
    ],
    players: [
      { id: 1, pos: { x: CW - 20, y: CH * 0.15 }, targetPos: { x: CW - 20, y: CH * 0.15 }, color: '#3b82f6', number: 11, role: 'Left-Foot Taker', team: 'attack', minPlayers: 7 },
      { id: 2, pos: { x: CW * 0.78, y: CH * 0.30 }, targetPos: { x: CW * 0.88, y: CH * 0.38 }, color: '#3b82f6', number: 6, role: 'Near Post Header', team: 'attack', minPlayers: 7 },
      { id: 3, pos: { x: CW * 0.72, y: CH * 0.50 }, targetPos: { x: CW * 0.84, y: CH * 0.52 }, color: '#3b82f6', number: 9, role: 'Penalty Spot Run', team: 'attack', minPlayers: 7 },
      { id: 4, pos: { x: CW * 0.65, y: CH * 0.38 }, targetPos: { x: CW * 0.80, y: CH * 0.42 }, color: '#3b82f6', number: 10, role: 'Second Runner', team: 'attack', minPlayers: 9 },
      { id: 5, pos: { x: CW * 0.60, y: CH * 0.62 }, targetPos: { x: CW * 0.78, y: CH * 0.60 }, color: '#3b82f6', number: 7, role: 'Far Post Runner', team: 'attack', minPlayers: 11 },
      // Defenders
      { id: 6, pos: { x: CW * 0.84, y: CH * 0.35 }, targetPos: { x: CW * 0.84, y: CH * 0.35 }, color: '#ef4444', number: 5, role: 'Defender', team: 'defend', minPlayers: 7 },
      { id: 7, pos: { x: CW * 0.88, y: CH * 0.52 }, targetPos: { x: CW * 0.88, y: CH * 0.52 }, color: '#ef4444', number: 4, role: 'Defender', team: 'defend', minPlayers: 7 },
      { id: 8, pos: { x: CW * 0.80, y: CH * 0.62 }, targetPos: { x: CW * 0.80, y: CH * 0.62 }, color: '#ef4444', number: 3, role: 'Defender', team: 'defend', minPlayers: 9 },
      { id: 9, pos: { x: CW * 0.96, y: CH / 2 }, targetPos: { x: CW * 0.96, y: CH * 0.35 }, color: '#22c55e', number: 1, role: 'Goalkeeper', team: 'gk', minPlayers: 7 },
    ],
    ballPath: [
      { t: 0, pos: { x: CW - 20, y: CH * 0.15 } },
      { t: 0.30, pos: { x: CW * 0.82, y: CH * 0.22 } },
      { t: 0.60, pos: { x: CW * 0.88, y: CH * 0.35 } },
      { t: 0.80, pos: { x: CW * 0.90, y: CH * 0.44 } },
      { t: 1.0, pos: { x: CW * 0.92, y: CH * 0.50 } },
    ],
  },

  // ── FREE KICK – Double Wall Runner ───────────────────────────────────────
  {
    id: 'freekick_double_runner',
    label: 'Free Kick – Double Wall Runner',
    type: 'freekick',
    description: 'Two attackers sprint through gaps in the wall as the ball is struck, creating confusion and blocking the goalkeeper\'s view.',
    successRate: 21,
    tips: [
      'Runners must time their sprint to pass the wall just as the ball is struck',
      'One runner goes left of wall, one goes right — split the goalkeeper\'s vision',
      'Shooter aims low to the far post corner',
      'If the shot is blocked, runners are perfectly placed for the rebound',
      'Requires precise coordination — practice the timing extensively',
    ],
    players: [
      { id: 1, pos: { x: CW * 0.32, y: CH * 0.45 }, targetPos: { x: CW * 0.32, y: CH * 0.45 }, color: '#3b82f6', number: 10, role: 'Shooter', team: 'attack', minPlayers: 7 },
      { id: 2, pos: { x: CW * 0.38, y: CH * 0.35 }, targetPos: { x: CW * 0.68, y: CH * 0.38 }, color: '#3b82f6', number: 9, role: 'Left Wall Runner', team: 'attack', minPlayers: 7 },
      { id: 3, pos: { x: CW * 0.38, y: CH * 0.58 }, targetPos: { x: CW * 0.68, y: CH * 0.55 }, color: '#3b82f6', number: 7, role: 'Right Wall Runner', team: 'attack', minPlayers: 7 },
      { id: 4, pos: { x: CW * 0.55, y: CH * 0.30 }, targetPos: { x: CW * 0.80, y: CH * 0.35 }, color: '#3b82f6', number: 11, role: 'Box Runner', team: 'attack', minPlayers: 9 },
      { id: 5, pos: { x: CW * 0.28, y: CH * 0.60 }, targetPos: { x: CW * 0.28, y: CH * 0.60 }, color: '#3b82f6', number: 8, role: 'Decoy', team: 'attack', minPlayers: 11 },
      // Wall
      { id: 6, pos: { x: CW * 0.50, y: CH * 0.38 }, targetPos: { x: CW * 0.50, y: CH * 0.38 }, color: '#ef4444', number: 5, role: 'Wall', team: 'defend', minPlayers: 7 },
      { id: 7, pos: { x: CW * 0.50, y: CH * 0.44 }, targetPos: { x: CW * 0.50, y: CH * 0.44 }, color: '#ef4444', number: 4, role: 'Wall', team: 'defend', minPlayers: 7 },
      { id: 8, pos: { x: CW * 0.50, y: CH * 0.50 }, targetPos: { x: CW * 0.50, y: CH * 0.50 }, color: '#ef4444', number: 3, role: 'Wall', team: 'defend', minPlayers: 9 },
      { id: 9, pos: { x: CW * 0.50, y: CH * 0.56 }, targetPos: { x: CW * 0.50, y: CH * 0.56 }, color: '#ef4444', number: 6, role: 'Wall', team: 'defend', minPlayers: 11 },
      { id: 10, pos: { x: CW * 0.88, y: CH / 2 }, targetPos: { x: CW * 0.88, y: CH * 0.58 }, color: '#22c55e', number: 1, role: 'Goalkeeper', team: 'gk', minPlayers: 7 },
    ],
    ballPath: [
      { t: 0, pos: { x: CW * 0.32, y: CH * 0.45 } },
      { t: 0.25, pos: { x: CW * 0.48, y: CH * 0.38 } },
      { t: 0.55, pos: { x: CW * 0.65, y: CH * 0.40 } },
      { t: 0.78, pos: { x: CW * 0.80, y: CH * 0.44 } },
      { t: 1.0, pos: { x: CW * 0.90, y: CH * 0.56 } },
    ],
  },

  // ── FREE KICK – Dummy Run Decoy ───────────────────────────────────────────
  {
    id: 'freekick_dummy_decoy',
    label: 'Free Kick – Dummy Run Decoy',
    type: 'freekick',
    description: 'First player runs over the ball as a dummy, second player strikes with the element of surprise.',
    successRate: 29,
    tips: [
      'Dummy runner must be convincing — full run-up, eyes on the ball',
      'Shooter waits until the dummy runner has fully passed the ball',
      'Strike the ball immediately — no hesitation after the dummy',
      'Aim for the opposite corner to where the goalkeeper is leaning',
      'Works best when the dummy runner is the team\'s known set-piece specialist',
    ],
    players: [
      { id: 1, pos: { x: CW * 0.33, y: CH * 0.40 }, targetPos: { x: CW * 0.42, y: CH * 0.44 }, color: '#3b82f6', number: 9, role: 'Dummy Runner', team: 'attack', minPlayers: 7 },
      { id: 2, pos: { x: CW * 0.30, y: CH * 0.52 }, targetPos: { x: CW * 0.30, y: CH * 0.52 }, color: '#3b82f6', number: 10, role: 'Actual Shooter', team: 'attack', minPlayers: 7 },
      { id: 3, pos: { x: CW * 0.58, y: CH * 0.35 }, targetPos: { x: CW * 0.78, y: CH * 0.38 }, color: '#3b82f6', number: 7, role: 'Box Runner', team: 'attack', minPlayers: 9 },
      { id: 4, pos: { x: CW * 0.55, y: CH * 0.65 }, targetPos: { x: CW * 0.76, y: CH * 0.60 }, color: '#3b82f6', number: 11, role: 'Far Runner', team: 'attack', minPlayers: 11 },
      // Wall
      { id: 5, pos: { x: CW * 0.48, y: CH * 0.40 }, targetPos: { x: CW * 0.48, y: CH * 0.40 }, color: '#ef4444', number: 5, role: 'Wall', team: 'defend', minPlayers: 7 },
      { id: 6, pos: { x: CW * 0.48, y: CH * 0.46 }, targetPos: { x: CW * 0.48, y: CH * 0.46 }, color: '#ef4444', number: 4, role: 'Wall', team: 'defend', minPlayers: 7 },
      { id: 7, pos: { x: CW * 0.48, y: CH * 0.52 }, targetPos: { x: CW * 0.48, y: CH * 0.52 }, color: '#ef4444', number: 3, role: 'Wall', team: 'defend', minPlayers: 9 },
      { id: 8, pos: { x: CW * 0.88, y: CH / 2 }, targetPos: { x: CW * 0.88, y: CH * 0.38 }, color: '#22c55e', number: 1, role: 'Goalkeeper', team: 'gk', minPlayers: 7 },
    ],
    ballPath: [
      { t: 0, pos: { x: CW * 0.33, y: CH * 0.46 } },
      { t: 0.20, pos: { x: CW * 0.40, y: CH * 0.44 } },
      { t: 0.45, pos: { x: CW * 0.55, y: CH * 0.36 } },
      { t: 0.70, pos: { x: CW * 0.72, y: CH * 0.34 } },
      { t: 0.88, pos: { x: CW * 0.85, y: CH * 0.38 } },
      { t: 1.0, pos: { x: CW * 0.90, y: CH * 0.42 } },
    ],
  },

  // ── PENALTY – Stutter Run ─────────────────────────────────────────────────
  {
    id: 'penalty_stutter',
    label: 'Penalty – Stutter Run',
    type: 'penalty',
    description: 'Deliberate stutter in the run-up to force the goalkeeper to commit early, then place the ball to the opposite side.',
    successRate: 72,
    tips: [
      'Stutter step must be natural — not exaggerated or it looks obvious',
      'Watch the goalkeeper\'s hips — they reveal the dive direction',
      'After the stutter, make the final decision in the last 2 steps',
      'Strike with the inside of the foot for placement — not power',
      'Mental composure is critical — breathe deeply before the run-up',
    ],
    players: [
      { id: 1, pos: { x: CW * 0.58, y: CH / 2 }, targetPos: { x: CW * 0.76, y: CH / 2 }, color: '#3b82f6', number: 10, role: 'Taker (Stutter)', team: 'attack', minPlayers: 7 },
      { id: 2, pos: { x: CW * 0.97, y: CH / 2 }, targetPos: { x: CW * 0.97, y: CH * 0.32 }, color: '#22c55e', number: 1, role: 'Goalkeeper', team: 'gk', minPlayers: 7 },
    ],
    ballPath: [
      { t: 0, pos: { x: CW * 0.76, y: CH / 2 } },
      { t: 0.15, pos: { x: CW * 0.78, y: CH / 2 } },
      { t: 0.30, pos: { x: CW * 0.80, y: CH / 2 } }, // stutter pause
      { t: 0.50, pos: { x: CW * 0.84, y: CH * 0.48 } },
      { t: 0.75, pos: { x: CW * 0.92, y: CH * 0.60 } }, // opposite to keeper dive
      { t: 1.0, pos: { x: CW * 0.97, y: CH * 0.64 } },
    ],
  },
];



// ─── Formation → Pitch Positions ─────────────────────────────────────────────
// Returns normalized positions [0..1] for each outfield player slot (left=our half)
// Goalkeeper is always at x=0.05, y=0.5
const FORMATION_POSITIONS: Record<string, Array<{x: number; y: number}>> = {
  '4-3-3': [
    {x:0.05,y:0.50}, // GK
    {x:0.22,y:0.15},{x:0.22,y:0.38},{x:0.22,y:0.62},{x:0.22,y:0.85}, // DEF
    {x:0.42,y:0.25},{x:0.42,y:0.50},{x:0.42,y:0.75}, // MID
    {x:0.62,y:0.18},{x:0.62,y:0.50},{x:0.62,y:0.82}, // FWD
  ],
  '4-4-2': [
    {x:0.05,y:0.50},
    {x:0.22,y:0.15},{x:0.22,y:0.38},{x:0.22,y:0.62},{x:0.22,y:0.85},
    {x:0.42,y:0.15},{x:0.42,y:0.38},{x:0.42,y:0.62},{x:0.42,y:0.85},
    {x:0.62,y:0.35},{x:0.62,y:0.65},
  ],
  '4-2-3-1': [
    {x:0.05,y:0.50},
    {x:0.22,y:0.15},{x:0.22,y:0.38},{x:0.22,y:0.62},{x:0.22,y:0.85},
    {x:0.38,y:0.38},{x:0.38,y:0.62},
    {x:0.52,y:0.18},{x:0.52,y:0.50},{x:0.52,y:0.82},
    {x:0.65,y:0.50},
  ],
  '3-5-2': [
    {x:0.05,y:0.50},
    {x:0.22,y:0.28},{x:0.22,y:0.50},{x:0.22,y:0.72},
    {x:0.38,y:0.10},{x:0.38,y:0.32},{x:0.38,y:0.50},{x:0.38,y:0.68},{x:0.38,y:0.90},
    {x:0.60,y:0.35},{x:0.60,y:0.65},
  ],
  '3-4-3': [
    {x:0.05,y:0.50},
    {x:0.22,y:0.28},{x:0.22,y:0.50},{x:0.22,y:0.72},
    {x:0.40,y:0.15},{x:0.40,y:0.38},{x:0.40,y:0.62},{x:0.40,y:0.85},
    {x:0.62,y:0.18},{x:0.62,y:0.50},{x:0.62,y:0.82},
  ],
  '5-3-2': [
    {x:0.05,y:0.50},
    {x:0.18,y:0.10},{x:0.22,y:0.30},{x:0.22,y:0.50},{x:0.22,y:0.70},{x:0.18,y:0.90},
    {x:0.42,y:0.25},{x:0.42,y:0.50},{x:0.42,y:0.75},
    {x:0.62,y:0.35},{x:0.62,y:0.65},
  ],
  '4-1-4-1': [
    {x:0.05,y:0.50},
    {x:0.22,y:0.15},{x:0.22,y:0.38},{x:0.22,y:0.62},{x:0.22,y:0.85},
    {x:0.35,y:0.50},
    {x:0.50,y:0.15},{x:0.50,y:0.38},{x:0.50,y:0.62},{x:0.50,y:0.85},
    {x:0.65,y:0.50},
  ],
  '4-3-2-1': [
    {x:0.05,y:0.50},
    {x:0.22,y:0.15},{x:0.22,y:0.38},{x:0.22,y:0.62},{x:0.22,y:0.85},
    {x:0.38,y:0.22},{x:0.38,y:0.50},{x:0.38,y:0.78},
    {x:0.52,y:0.35},{x:0.52,y:0.65},
    {x:0.65,y:0.50},
  ],
};

// Get formation positions scaled to canvas size
function getFormationPositions(formation: string, side: 'left' | 'right'): Array<{x:number;y:number}> {
  const positions = FORMATION_POSITIONS[formation] ?? FORMATION_POSITIONS['4-3-3'];
  return positions.map(p => ({
    x: side === 'left' ? p.x * CW : (1 - p.x) * CW,
    y: p.y * CH,
  }));
}

// ─── Interpolation helpers ────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function lerpVec(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}
// Quadratic Bezier: P = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
function bezierVec(p0: Vec2, p1: Vec2, p2: Vec2, t: number): Vec2 {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}
// Get player position along multi-waypoint path at progress t (0-1)
function getPlayerPos(player: AnimPlayer, t: number): Vec2 {
  if (!player.waypoints || player.waypoints.length === 0) {
    return t === 0 ? player.pos : lerpVec(player.pos, player.targetPos, Math.min(t * 1.5, 1));
  }
  // Build full path: [pos, ...waypoints, targetPos]
  const path = [player.pos, ...player.waypoints, player.targetPos];
  const segments = path.length - 1;
  const scaledT = Math.min(t * 1.5, 1); // speed up to finish by t=0.67
  const segT = scaledT * segments;
  const segIdx = Math.min(Math.floor(segT), segments - 1);
  const localT = segT - segIdx;
  const p0 = path[segIdx];
  const p2 = path[segIdx + 1];
  // Midpoint control point for smooth curve
  const p1: Vec2 = {
    x: (p0.x + p2.x) / 2 + (p2.y - p0.y) * 0.15,
    y: (p0.y + p2.y) / 2 - (p2.x - p0.x) * 0.15,
  };
  return bezierVec(p0, p1, p2, localT);
}
function getBallPos(path: BallKeyframe[], t: number): Vec2 {
  if (t <= 0) return path[0].pos;
  if (t >= 1) return path[path.length - 1].pos;
  for (let i = 0; i < path.length - 1; i++) {
    if (t >= path[i].t && t <= path[i + 1].t) {
      const local = (t - path[i].t) / (path[i + 1].t - path[i].t);
      return lerpVec(path[i].pos, path[i + 1].pos, local);
    }
  }
  return path[path.length - 1].pos;
}

// ─── Filter players by team size ─────────────────────────────────────────────
function filterPlayers(
  players: AnimPlayer[],
  ourCount: number,
  opponentCount: number
): AnimPlayer[] {
  return players.filter(p => {
    const minP = p.minPlayers ?? 7;
    if (p.team === 'attack') return ourCount >= minP;
    if (p.team === 'defend') return opponentCount >= minP;
    if (p.team === 'gk') return opponentCount >= minP; // GK always appears if opponent has players
    return true;
  });
}

// ─── Canvas Renderer ──────────────────────────────────────────────────────────
function drawPitch(ctx: CanvasRenderingContext2D, type: Scenario['type'], playerCount: number) {
  // Grass — slightly smaller pitch for 7-a-side
  const pitchAlpha = playerCount <= 7 ? 0.85 : 1;
  ctx.fillStyle = '#2d6a2d';
  ctx.fillRect(0, 0, CW, CH);

  // Stripes
  for (let i = 0; i < 8; i++) {
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(i * (CW / 8), 0, CW / 8, CH);
    }
  }

  ctx.strokeStyle = `rgba(255,255,255,${pitchAlpha * 0.8})`;
  ctx.lineWidth = 2;

  if (type === 'penalty') {
    const GL = CW - 10;
    const SPOT_X = Math.round(GL - CW * 0.22);
    const PA_L = GL - Math.round(CW * 0.30);
    const PA_TOP = Math.round(CH * 0.15);
    const PA_BOT = Math.round(CH * 0.85);
    ctx.strokeRect(PA_L, PA_TOP, GL - PA_L, PA_BOT - PA_TOP);
    const SB_L = GL - Math.round(CW * 0.10);
    const SB_TOP = Math.round(CH * 0.32);
    const SB_BOT = Math.round(CH * 0.68);
    ctx.strokeRect(SB_L, SB_TOP, GL - SB_L, SB_BOT - SB_TOP);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(GL, CH / 2 - GOAL_W / 2, 22, GOAL_W);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(SPOT_X, CH / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(SPOT_X, CH / 2, 90, -Math.PI * 0.50, Math.PI * 0.50);
    ctx.stroke();
  } else if (type === 'corner') {
    ctx.strokeRect(20, 20, CW - 40, CH - 40);
    ctx.beginPath(); ctx.moveTo(CW / 2, 20); ctx.lineTo(CW / 2, CH - 20); ctx.stroke();
    ctx.beginPath(); ctx.arc(CW / 2, CH / 2, 60, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeRect(CW - 20 - CW * 0.28, CH / 2 - CH * 0.30, CW * 0.28, CH * 0.60);
    ctx.strokeRect(20, CH / 2 - CH * 0.30, CW * 0.28, CH * 0.60);
    ctx.lineWidth = 3;
    ctx.strokeRect(CW - 20, CH / 2 - GOAL_W / 2, 20, GOAL_W);
    ctx.strokeRect(0, CH / 2 - GOAL_W / 2, 20, GOAL_W);
    ctx.lineWidth = 1.5;
    [{ x: 20, y: 20 }, { x: 20, y: CH - 20 }, { x: CW - 20, y: 20 }, { x: CW - 20, y: CH - 20 }].forEach(c => {
      ctx.beginPath(); ctx.arc(c.x, c.y, 15, 0, Math.PI * 2); ctx.stroke();
    });
  } else {
    ctx.strokeRect(20, 20, CW - 40, CH - 40);
    ctx.strokeRect(CW - 20 - CW * 0.28, CH / 2 - CH * 0.30, CW * 0.28, CH * 0.60);
    ctx.lineWidth = 3;
    ctx.strokeRect(CW - 20, CH / 2 - GOAL_W / 2, 20, GOAL_W);
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(CW * 0.50, CH * 0.45, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Show player count badge on pitch
  if (playerCount < 11) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(CW / 2 - 60, 25, 120, 22);
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${playerCount}-a-side format`, CW / 2, 36);
  }
}

function drawPlayers(ctx: CanvasRenderingContext2D, players: AnimPlayer[], progress: number, defenseProgress: number = 0) {
  players.forEach(p => {
    // During defense phase, defenders move to their defenseTarget
    let pos: Vec2;
    if (defenseProgress > 0 && p.defenseTarget && p.team !== 'attack') {
      // Blend from current attack position to defenseTarget
      const attackPos = getPlayerPos(p, 1); // where they ended up after attack phase
      pos = lerpVec(attackPos, p.defenseTarget, Math.min(defenseProgress * 1.4, 1));
    } else {
      pos = progress === 0 ? p.pos : getPlayerPos(p, progress);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath(); ctx.ellipse(pos.x + 2, pos.y + 14, 10, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(p.number), pos.x, pos.y);
    if (p.targetPos.x !== p.pos.x || p.targetPos.y !== p.pos.y) {
      // Draw curved path through waypoints
      const pathPts = [p.pos, ...(p.waypoints || []), p.targetPos];
      ctx.strokeStyle = p.color + '88';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(pathPts[0].x, pathPts[0].y);
      for (let i = 1; i < pathPts.length; i++) {
        const prev = pathPts[i - 1];
        const curr = pathPts[i];
        const cpx = (prev.x + curr.x) / 2 + (curr.y - prev.y) * 0.15;
        const cpy = (prev.y + curr.y) / 2 - (curr.x - prev.x) * 0.15;
        ctx.quadraticCurveTo(cpx, cpy, curr.x, curr.y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // Arrowhead at final target
      const last = pathPts[pathPts.length - 1];
      const prev2 = pathPts[pathPts.length - 2];
      const angle = Math.atan2(last.y - prev2.y, last.x - prev2.x);
      ctx.fillStyle = p.color + 'cc';
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(last.x - 10 * Math.cos(angle - 0.4), last.y - 10 * Math.sin(angle - 0.4));
      ctx.lineTo(last.x - 10 * Math.cos(angle + 0.4), last.y - 10 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
    }
  });
}

function drawBall(ctx: CanvasRenderingContext2D, pos: Vec2, progress: number) {
  const scale = 1 + Math.sin(progress * Math.PI) * 0.3;
  ctx.save();
  ctx.translate(pos.x, pos.y);
  ctx.scale(scale, scale);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath(); ctx.ellipse(2, 10, 8, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(0, 0, 4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SetPieceSimulation() {
  const [, navigate] = useLocation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Auto-load scenario from URL query param (shared link)
  const urlScenarioId = typeof window !== 'undefined'
    ? parseInt(new URLSearchParams(window.location.search).get('scenario') || '', 10) || null
    : null;
  const sharedScenarioQuery = trpc.tactical.getSetPieceScenarioById.useQuery(
    { id: urlScenarioId! },
    { enabled: urlScenarioId != null, staleTime: Infinity }
  );
  const animRef = useRef<number | null>(null);
  // ── Drag-and-drop state ──────────────────────────────────────────────────
  const [customPositions, setCustomPositions] = useState<Record<number, {x:number;y:number}>>({});
  const dragStateRef = useRef<{playerId: number; offsetX: number; offsetY: number} | null>(null);
  // ─── Draw Mode state ──────────────────────────────────────────────────────
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [drawColor, setDrawColor] = useState('#facc15'); // yellow default
  const [drawnArrows, setDrawnArrows] = useState<Array<{from: {x:number;y:number}; to: {x:number;y:number}; color: string}>>([]);
  const drawStartRef = useRef<{x:number;y:number} | null>(null);
  const isDrawingRef = useRef(false);
  const isDraggingRef = useRef(false);
  // ─── Defense Phase state (Phase 2: progress 0-1 for defensive response) ──
  const [defenseProgress, setDefenseProgress] = useState(0);
  const [isDefensePhase, setIsDefensePhase] = useState(false);
  const defenseAnimRef = useRef<number | null>(null);
  // ── Voice / Tactical Plan state ──────────────────────────────────────────
  const [tacticalPlan, setTacticalPlan] = useState(
    'Player 9 makes a near-post run timed to arrive just before the ball. Player 10 holds at the far post. Player 7 waits at the penalty spot for any clearance or second ball.'
  );
  const [isRecording, setIsRecording] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const recognitionRef = useRef<any>(null);
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'corner' | 'penalty' | 'freekick'>('corner');
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(SCENARIOS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const DEMO_AI_TIPS = {
    successProbability: 72,
    primaryRoutine: "Near-Post Flick-On with Far-Post Runner",
    description: "The taker delivers a driven ball to the near post. Player #9 flicks it on with a glancing header, while Player #10 attacks the far post at full sprint. Player #7 holds at the penalty spot for any clearance.",
    exploitedWeakness: "Opponent's right center-back is slow to react to near-post deliveries — exploit with early timing.",
    playerRoles: [
      { role: "Taker (#8)", instruction: "Drive the ball to the near post at head height — no loft." },
      { role: "Near-Post Runner (#9)", instruction: "Time your run to arrive just before the ball — flick on." },
      { role: "Far-Post Runner (#10)", instruction: "Hold your run until the taker begins delivery — attack the far post." },
      { role: "Penalty Spot (#7)", instruction: "Hold position for any clearance or second ball." },
    ],
    alternativeRoutine: "Short corner to #6, pull-back cross to #10 arriving late at the far post.",
    keyTiming: "Runner must start movement when the taker's foot is 2 steps from the ball.",
  };
  const [aiTips, setAiTips] = useState<any>(DEMO_AI_TIPS);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [opponentFormation, setOpponentFormation] = useState('4-4-2');
  const [opponentPlayerCount, setOpponentPlayerCount] = useState('11');
  const [ourPlayerCount, setOurPlayerCount] = useState('11');
  const [opponentTeamInfo, setOpponentTeamInfo] = useState('');
  const [ourFormation, setOurFormation] = useState('4-3-3');
  const [matchContext, setMatchContext] = useState('');

  const generateSetPieceTips = trpc.tactical.generateSetPieceTips.useMutation();
  // ── Save / Load Scenarios ──────────────────────────────────────────────────
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadPanel, setShowLoadPanel] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [scenarioTags, setScenarioTags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const saveScenario = trpc.tactical.saveSetPieceScenario.useMutation({
    onSuccess: () => {
      toast.success('Scenario saved!');
      setShowSaveDialog(false);
      setScenarioName('');
      setScenarioTags([]);
      setTagInput('');
      savedScenariosQuery.refetch();
    },
    onError: (e) => toast.error('Save failed: ' + e.message),
  });
  const savedScenariosQuery = trpc.tactical.listSetPieceScenarios.useQuery(
    { type: activeTab, teamSize: parseInt(ourPlayerCount), search: searchQuery || undefined, tag: activeTagFilter || undefined },
    { enabled: showLoadPanel }
  );
  const deleteScenario = trpc.tactical.deleteSetPieceScenario.useMutation({
    onSuccess: () => { toast.success('Scenario deleted'); savedScenariosQuery.refetch(); },
  });
  const [editingNotesId, setEditingNotesId] = useState<number | null>(null);
  const [editingNotesText, setEditingNotesText] = useState('');
  const updateNotes = trpc.tactical.updateSetPieceScenarioNotes.useMutation({
    onSuccess: () => { toast.success('Notes updated'); savedScenariosQuery.refetch(); setEditingNotesId(null); },
    onError: (e) => toast.error('Update failed: ' + e.message),
  });
  function copyShareLink(id: number) {
    const url = `${window.location.origin}/set-piece-simulation?scenario=${id}`;
    navigator.clipboard.writeText(url).then(() => toast.success('Link copied to clipboard!')).catch(() => {
      toast.info('Share link: ' + url);
    });
  }
  // Collect all unique tags from loaded scenarios for the filter bar
  const allTags = Array.from(new Set((savedScenariosQuery.data ?? []).flatMap((s: any) => s.tags ?? []))) as string[];
  function addTag() {
    const t = tagInput.trim();
    if (t && !scenarioTags.includes(t) && scenarioTags.length < 10) {
      setScenarioTags(prev => [...prev, t]);
      setTagInput('');
    }
  }
  function removeTag(t: string) { setScenarioTags(prev => prev.filter(x => x !== t)); }
  function handleSaveScenario() {
    if (!scenarioName.trim()) { toast.error('Please enter a scenario name'); return; }
    saveScenario.mutate({
      name: scenarioName.trim(),
      type: activeTab,
      teamSize: parseInt(ourPlayerCount),
      ourFormation,
      opponentFormation,
      scenarioData: {
        scenarioId: selectedScenario.id,
        ourPlayerCount,
        opponentPlayerCount,
        opponentTeamInfo,
        matchContext,
      },
      notes: matchContext || undefined,
      tags: scenarioTags.length > 0 ? scenarioTags : undefined,
    });
  }
  function handleLoadScenario(saved: any) {
    const data = saved.scenarioData as any;
    if (data?.scenarioId) {
      const found = SCENARIOS.find(s => s.id === data.scenarioId);
      if (found) setSelectedScenario(found);
    }
    if (data?.ourPlayerCount) setOurPlayerCount(data.ourPlayerCount);
    if (data?.opponentPlayerCount) setOpponentPlayerCount(data.opponentPlayerCount);
    if (saved.ourFormation) setOurFormation(saved.ourFormation);
    if (saved.opponentFormation) setOpponentFormation(saved.opponentFormation);
    if (data?.opponentTeamInfo) setOpponentTeamInfo(data.opponentTeamInfo);
    if (data?.matchContext) setMatchContext(data.matchContext);
    setShowLoadPanel(false);
    toast.success('Loaded: ' + saved.name);
  }

  // Auto-load shared scenario from URL when data arrives
  useEffect(() => {
    if (sharedScenarioQuery.data) {
      handleLoadScenario(sharedScenarioQuery.data);
      toast.success('Shared scenario loaded: ' + (sharedScenarioQuery.data as any).name);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sharedScenarioQuery.data]);
  const tabScenarios = SCENARIOS.filter(s => s.type === activeTab);

  // Compute visible players based on player counts
  const visiblePlayers = filterPlayers(
    selectedScenario.players,
    parseInt(ourPlayerCount),
    parseInt(opponentPlayerCount)
  );

  // Apply formation positions to our team players when formation changes
  useEffect(() => {
    const formationPositions = getFormationPositions(ourFormation, 'left');
    const attackPlayers = selectedScenario.players.filter(p => p.team === 'attack');
    const updates: Record<number, {x:number;y:number}> = {};
    attackPlayers.forEach((p, idx) => {
      if (idx < formationPositions.length) {
        updates[p.id] = formationPositions[idx];
      }
    });
    setCustomPositions(prev => ({ ...prev, ...updates }));
  }, [ourFormation, selectedScenario]);

  // Apply opponent formation positions when opponentFormation changes
  useEffect(() => {
    const formationPositions = getFormationPositions(opponentFormation, 'right');
    const defendPlayers = selectedScenario.players.filter(p => p.team === 'defend' || p.team === 'gk');
    const updates: Record<number, {x:number;y:number}> = {};
    defendPlayers.forEach((p, idx) => {
      if (idx < formationPositions.length) {
        updates[p.id] = formationPositions[idx];
      }
    });
    setCustomPositions(prev => ({ ...prev, ...updates }));
  }, [opponentFormation, selectedScenario]);

  useEffect(() => {
    const first = SCENARIOS.find(s => s.type === activeTab);
    if (first) { setSelectedScenario(first); setProgress(0); setIsPlaying(false); setAiTips(null); setCustomPositions({}); }
  }, [activeTab]);

  // Reset animation when player counts change
  useEffect(() => {
    setProgress(0);
    setIsPlaying(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
  }, [ourPlayerCount, opponentPlayerCount]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;
    const duration = 3000;
    const start = performance.now() - progress * duration;
    function frame(now: number) {
      const t = Math.min((now - start) / duration, 1);
      setProgress(t);
      if (t < 1) {
        animRef.current = requestAnimationFrame(frame);
      } else {
        setIsPlaying(false);
        // Start defensive response phase after 400ms delay
        setTimeout(() => {
          setIsDefensePhase(true);
          const defStart = performance.now();
          const DEFENSE_DURATION = 1800;
          const defAnimate = (now: number) => {
            const dp = Math.min((now - defStart) / DEFENSE_DURATION, 1);
            setDefenseProgress(dp);
            if (dp < 1) {
              defenseAnimRef.current = requestAnimationFrame(defAnimate);
            }
          };
          defenseAnimRef.current = requestAnimationFrame(defAnimate);
        }, 400);
      }
    }
    animRef.current = requestAnimationFrame(frame);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [isPlaying]);

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, CW, CH);
    drawPitch(ctx, selectedScenario.type, Math.min(parseInt(ourPlayerCount), parseInt(opponentPlayerCount)));
    // Apply custom positions (from drag or formation) to players
    const playersWithCustomPos = visiblePlayers.map(p => {
      if (customPositions[p.id]) {
        // Preserve the movement delta from the original scenario
        const dx = p.targetPos.x - p.pos.x;
        const dy = p.targetPos.y - p.pos.y;
        const newPos = customPositions[p.id];
        return { ...p, pos: newPos, targetPos: { x: newPos.x + dx, y: newPos.y + dy } };
      }
      return p;
    });
    drawPlayers(ctx, playersWithCustomPos, progress, isDefensePhase ? defenseProgress : 0);
    const ballPos = getBallPos(selectedScenario.ballPath, progress);
    drawBall(ctx, ballPos, progress);
    if (progress > 0) {
      for (let i = 1; i <= 5; i++) {
        const tp = Math.max(0, progress - i * 0.04);
        const trailPos = getBallPos(selectedScenario.ballPath, tp);
        ctx.fillStyle = `rgba(255,255,255,${0.15 - i * 0.025})`;
        ctx.beginPath();
        ctx.arc(trailPos.x, trailPos.y, 5 - i * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // Draw coach-drawn arrows on top
    drawnArrows.forEach(arrow => {
      ctx.strokeStyle = arrow.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(arrow.from.x, arrow.from.y);
      ctx.lineTo(arrow.to.x, arrow.to.y);
      ctx.stroke();
      const angle = Math.atan2(arrow.to.y - arrow.from.y, arrow.to.x - arrow.from.x);
      ctx.fillStyle = arrow.color;
      ctx.beginPath();
      ctx.moveTo(arrow.to.x, arrow.to.y);
      ctx.lineTo(arrow.to.x - 14 * Math.cos(angle - 0.4), arrow.to.y - 14 * Math.sin(angle - 0.4));
      ctx.lineTo(arrow.to.x - 14 * Math.cos(angle + 0.4), arrow.to.y - 14 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fill();
    });
  }, [progress, selectedScenario, visiblePlayers, drawnArrows, defenseProgress, isDefensePhase]);

  const handlePlay = () => {
    setDefenseProgress(0);
    setIsDefensePhase(false);
    if (defenseAnimRef.current) cancelAnimationFrame(defenseAnimRef.current);
    if (progress >= 1) setProgress(0);
    setIsPlaying(true);
  };

  const handleReset = () => {
    setIsPlaying(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    if (defenseAnimRef.current) cancelAnimationFrame(defenseAnimRef.current);
    setProgress(0);
    setDefenseProgress(0);
    setIsDefensePhase(false);
  };

  const handleGetAITips = async () => {
    setIsLoadingAI(true);
    try {
      const setPieceType = activeTab === 'freekick' ? 'free_kick' : activeTab;
      const result = await generateSetPieceTips.mutateAsync({
        setPieceType: setPieceType as 'corner' | 'penalty' | 'free_kick',
        ourFormation,
        opponentFormation,
        opponentPlayerCount: parseInt(opponentPlayerCount),
        opponentTeamInfo: opponentTeamInfo || undefined,
        matchContext: matchContext || undefined,
      });
      setAiTips(result);
      toast.success('AI set-piece analysis generated!');
    } catch (e) {
      toast.error('Could not generate AI tips. Please try again.');
    } finally {
      setIsLoadingAI(false);
    }
  };

  const typeColors: Record<string, string> = {
    corner: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
    penalty: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
    freekick: 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30',
  };

  const playerCountOptions = [
    { value: '11', label: '11 players (full)' },
    { value: '9', label: '9 players (9-a-side)' },
    { value: '7', label: '7 players (7-a-side)' },
  ];

  return (
    <>
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <BackButton />
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Target className="w-8 h-8 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Set Piece Simulation</h1>
              <p className="text-muted-foreground">Animated corner, penalty & free kick tactical scenarios</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="space-y-4">
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                  <Flag className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  Select Scenario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="grid grid-cols-3 bg-muted w-full">
                    <TabsTrigger value="corner" className="text-xs data-[state=active]:bg-blue-600">Corner</TabsTrigger>
                    <TabsTrigger value="penalty" className="text-xs data-[state=active]:bg-red-600">Penalty</TabsTrigger>
                    <TabsTrigger value="freekick" className="text-xs data-[state=active]:bg-amber-600">Free Kick</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="space-y-2">
                  {tabScenarios.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSelectedScenario(s); handleReset(); setAiTips(null); setCustomPositions({}); }}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedScenario.id === s.id
                          ? 'bg-slate-600 border-slate-400'
                          : 'bg-muted/50 border-border hover:bg-muted'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-foreground text-sm font-medium">{s.label}</span>
                        <Badge className={`text-xs ${typeColors[s.type]}`}>{s.successRate}%</Badge>
                      </div>
                      <p className="text-muted-foreground text-xs line-clamp-2">{s.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Setup */}
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Team Setup
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-muted-foreground text-xs mb-1 block">Our Formation</Label>
                    <Select value={ourFormation} onValueChange={setOurFormation}>
                      <SelectTrigger className="bg-muted border-border text-foreground text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {['4-3-3','4-4-2','4-2-3-1','3-5-2','3-4-3','5-3-2','4-5-1','3-3-1','2-3-1','2-4-1'].map(f => (
                          <SelectItem key={f} value={f} className="text-foreground text-xs">{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs mb-1 block">Opponent Formation</Label>
                    <Select value={opponentFormation} onValueChange={setOpponentFormation}>
                      <SelectTrigger className="bg-muted border-border text-foreground text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border">
                        {['4-4-2','4-3-3','4-2-3-1','3-5-2','5-4-1','5-3-2','4-1-4-1','3-3-1','2-3-1'].map(f => (
                          <SelectItem key={f} value={f} className="text-foreground text-xs">{f}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Our team player count */}
                <div>
                  <Label className="text-muted-foreground text-xs mb-1 block flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                    Our Players on Field
                  </Label>
                  <Select value={ourPlayerCount} onValueChange={setOurPlayerCount}>
                    <SelectTrigger className="bg-muted border-border text-foreground text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {playerCountOptions.map(o => (
                        <SelectItem key={o.value} value={o.value} className="text-foreground text-xs">{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Opponent player count */}
                <div>
                  <Label className="text-muted-foreground text-xs mb-1 block flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-red-500 inline-block" />
                    Opponent Players on Field
                  </Label>
                  <Select value={opponentPlayerCount} onValueChange={setOpponentPlayerCount}>
                    <SelectTrigger className="bg-muted border-border text-foreground text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {[11,10,9,8,7].map(n => (
                        <SelectItem key={n} value={String(n)} className="text-foreground text-xs">
                          {n} players {n < 11 ? `(${11-n} red card${11-n>1?'s':''})` : '(full)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Opponent Info for AI Analysis */}
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />
                  AI Analysis Inputs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs mb-1 block">Scouting Notes (optional)</Label>
                  <Textarea
                    value={opponentTeamInfo}
                    onChange={e => setOpponentTeamInfo(e.target.value)}
                    placeholder="e.g., Tall GK who stays on line, weak near post..."
                    className="bg-muted border-border text-foreground text-xs min-h-[60px] resize-none placeholder:text-slate-500"
                  />
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs mb-1 block">Match Context (optional)</Label>
                  <Textarea
                    value={matchContext}
                    onChange={e => setMatchContext(e.target.value)}
                    placeholder="e.g., 85th min, losing 1-0, must score..."
                    className="bg-muted border-border text-foreground text-xs min-h-[50px] resize-none placeholder:text-slate-500"
                  />
                </div>
                <Button
                  onClick={handleGetAITips}
                  disabled={isLoadingAI}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs"
                >
                  <Brain className="w-3 h-3 mr-1.5" />
                  {isLoadingAI ? 'Analyzing…' : 'Generate AI Set-Piece Plan'}
                </Button>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Base Success Rate</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${selectedScenario.successRate}%` }}
                      />
                    </div>
                    <span className="text-foreground text-sm font-bold">{selectedScenario.successRate}%</span>
                  </div>
                </div>
                {aiTips && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">AI Success Estimate</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500" style={{ width: `${aiTips.successProbability}%` }} />
                      </div>
                      <span className="text-purple-600 dark:text-purple-400 text-sm font-bold">{aiTips.successProbability}%</span>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Our Players</span>
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">{visiblePlayers.filter(p => p.team === 'attack').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Opponent Players</span>
                  <span className="text-red-600 dark:text-red-400 text-sm font-bold">{visiblePlayers.filter(p => p.team === 'defend' || p.team === 'gk').length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Type</span>
                  <Badge className={`text-xs capitalize ${typeColors[selectedScenario.type]}`}>
                    {selectedScenario.type === 'freekick' ? 'Free Kick' : selectedScenario.type}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Legend */}
            <Card className="bg-card/50 border-border">
              <CardContent className="pt-4">
                <p className="text-muted-foreground text-xs font-medium mb-2">Legend</p>
                <div className="space-y-1.5">
                  {[
                    { color: '#3b82f6', label: 'Your Team' },
                    { color: '#ef4444', label: 'Opponent / Wall' },
                    { color: '#22c55e', label: 'Goalkeeper' },
                  ].map(l => (
                    <div key={l.label} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-white/30" style={{ background: l.color }} />
                      <span className="text-muted-foreground text-xs">{l.label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center – Canvas + AI Result */}
          <div className="xl:col-span-2 space-y-4">
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-foreground text-sm">{selectedScenario.label}</CardTitle>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      {ourPlayerCount}v{opponentPlayerCount} format
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={handlePlay}
                      disabled={isPlaying}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      {progress >= 1 ? 'Replay' : isPlaying ? 'Playing…' : 'Play'}
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleReset} className="border-border text-muted-foreground">
                      <RotateCcw className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={isDrawMode ? "default" : "outline"}
                      onClick={() => setIsDrawMode(v => !v)}
                      className={isDrawMode ? "bg-yellow-500 text-black hover:bg-yellow-400" : "border-yellow-600 text-yellow-400 hover:bg-yellow-900/30"}
                      title="Draw Mode: draw movement arrows on the pitch"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      {isDrawMode ? 'Drawing' : 'Draw'}
                    </Button>
                    {isDrawMode && (
                      <>
                        <div className="flex items-center gap-1">
                          {['#facc15','#3b82f6','#ef4444','#22c55e','#ffffff'].map(c => (
                            <button
                              key={c}
                              onClick={() => setDrawColor(c)}
                              className={`w-5 h-5 rounded-full border-2 transition-transform ${drawColor === c ? 'border-white scale-125' : 'border-transparent'}`}
                              style={{ background: c }}
                              title={c}
                            />
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDrawnArrows([])}
                          className="border-red-600 text-red-600 dark:text-red-400 hover:bg-red-900/30"
                          title="Clear all drawn arrows"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="outline" onClick={() => setShowSaveDialog(v => !v)} className="border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-900/30 gap-1">
                      <Save className="w-3 h-3" />Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setShowLoadPanel(v => !v); savedScenariosQuery.refetch(); }} className="border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-900/30 gap-1">
                      <FolderOpen className="w-3 h-3" />Load
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const canvas = canvasRef.current;
                        if (!canvas) return;
                        const link = document.createElement('a');
                        link.download = `setpiece-${selectedScenario.id}.png`;
                        link.href = canvas.toDataURL('image/png');
                        link.click();
                        toast.success('Pitch exported as PNG!');
                      }}
                      className="border-purple-600 text-purple-600 dark:text-purple-400 hover:bg-purple-900/30 gap-1"
                      title="Export pitch as PNG image"
                    >
                      <Copy className="w-3 h-3" />Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative w-full" style={{ paddingBottom: `${(CH / CW) * 100}%` }}>
                  <canvas
                    ref={canvasRef}
                    width={CW}
                    height={CH}
                    {...{} as any} className={`absolute inset-0 w-full h-full rounded-lg ${isDrawMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"}`}
                    style={{ imageRendering: 'crisp-edges', touchAction: 'none' }}
                    onPointerDown={(e) => {
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      const rect = canvas.getBoundingClientRect();
                      const scaleX = CW / rect.width;
                      const scaleY = CH / rect.height;
                      const mx = (e.clientX - rect.left) * scaleX;
                      const my = (e.clientY - rect.top) * scaleY;
                      if (isDrawMode) {
                        // Draw Mode: start drawing an arrow
                        drawStartRef.current = { x: mx, y: my };
                        isDrawingRef.current = true;
                        canvas.setPointerCapture(e.pointerId);
                        e.preventDefault();
                        return;
                      }
                      // Drag Mode: find closest player within 20px
                      const playersWithCustomPos = visiblePlayers.map(p =>
                        customPositions[p.id] ? { ...p, pos: customPositions[p.id] } : p
                      );
                      let closest: typeof playersWithCustomPos[0] | null = null;
                      let minDist = 20;
                      playersWithCustomPos.forEach(p => {
                        const dist = Math.hypot(mx - p.pos.x, my - p.pos.y);
                        if (dist < minDist) { minDist = dist; closest = p; }
                      });
                      if (closest) {
                        isDraggingRef.current = true;
                        dragStateRef.current = { playerId: (closest as any).id, offsetX: mx - (closest as any).pos.x, offsetY: my - (closest as any).pos.y };
                        canvas.setPointerCapture(e.pointerId);
                        e.preventDefault();
                      }
                    }}
                    onPointerMove={(e) => {
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      const rect = canvas.getBoundingClientRect();
                      const scaleX = CW / rect.width;
                      const scaleY = CH / rect.height;
                      const mx = (e.clientX - rect.left) * scaleX;
                      const my = (e.clientY - rect.top) * scaleY;
                      if (isDrawMode) return; // live preview handled on pointerUp
                      if (!isDraggingRef.current || !dragStateRef.current) return;
                      const newX = Math.max(12, Math.min(CW - 12, mx - dragStateRef.current.offsetX));
                      const newY = Math.max(12, Math.min(CH - 12, my - dragStateRef.current.offsetY));
                      setCustomPositions(prev => ({
                        ...prev,
                        [dragStateRef.current!.playerId]: { x: newX, y: newY }
                      }));
                      e.preventDefault();
                    }}
                    onPointerUp={(e) => {
                      const canvas = canvasRef.current;
                      if (!canvas) return;
                      const rect = canvas.getBoundingClientRect();
                      const scaleX = CW / rect.width;
                      const scaleY = CH / rect.height;
                      const mx = (e.clientX - rect.left) * scaleX;
                      const my = (e.clientY - rect.top) * scaleY;
                      if (isDrawMode && isDrawingRef.current && drawStartRef.current) {
                        const dist = Math.hypot(mx - drawStartRef.current.x, my - drawStartRef.current.y);
                        if (dist > 15) {
                          setDrawnArrows(prev => [...prev, { from: drawStartRef.current!, to: { x: mx, y: my }, color: drawColor }]);
                        }
                        isDrawingRef.current = false;
                        drawStartRef.current = null;
                        return;
                      }
                      isDraggingRef.current = false;
                      dragStateRef.current = null;
                    }}
                  />
                </div>
                <p className="text-muted-foreground text-xs mt-1 flex items-center gap-1">
                  {isDefensePhase && defenseProgress < 1
                    ? <><Shield className="w-3 h-3 text-red-600 dark:text-red-400 animate-pulse" /><span className="text-red-600 dark:text-red-400">Defensive response playing…</span></>
                    : isDefensePhase && defenseProgress >= 1
                    ? <><Shield className="w-3 h-3 text-red-600 dark:text-red-400" /><span className="text-red-600 dark:text-red-400">Defensive response complete</span></>
                    : isDrawMode
                    ? <><Pencil className="w-3 h-3 text-yellow-700 dark:text-yellow-400" /><span className="text-yellow-700 dark:text-yellow-400">Draw Mode: click and drag on pitch to draw movement arrows</span></>
                    : <><GripVertical className="w-3 h-3" /> Drag any player token to reposition • Use Draw Mode to annotate runs</>
                  }
                </p>
                <div className="mt-3 w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${progress * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Scenario Dialog */}
            {showSaveDialog && (
              <Card className="bg-amber-900/20 border-amber-700">
                <CardContent className="pt-4 pb-3 space-y-3">
                  <p className="text-amber-700 dark:text-amber-300 text-sm font-semibold flex items-center gap-2">
                    <Save className="w-4 h-4" /> Save Current Scenario
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Saves the current scenario type (<strong className="text-foreground">{activeTab}</strong>), team size (<strong className="text-foreground">{ourPlayerCount}v{opponentPlayerCount}</strong>), formations, and context for later use.
                  </p>
                  {/* Name */}
                  <div className="flex gap-2">
                    <Input
                      value={scenarioName}
                      onChange={e => setScenarioName(e.target.value)}
                      placeholder="e.g. Corner vs 4-4-2 deep block"
                      className="bg-card border-border text-foreground text-xs flex-1"
                      onKeyDown={e => e.key === 'Enter' && handleSaveScenario()}
                    />
                    <Button size="sm" onClick={handleSaveScenario} disabled={saveScenario.isPending} className="bg-amber-600 hover:bg-amber-700 text-black gap-1">
                      <Save className="w-3 h-3" />{saveScenario.isPending ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                  {/* Tags */}
                  <div className="space-y-1.5">
                    <p className="text-xs text-muted-foreground">Tags <span className="text-slate-600">(optional — press Enter to add)</span></p>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        placeholder="e.g. deep block, late game, vs 4-4-2"
                        className="bg-card border-border text-foreground text-xs flex-1"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                      />
                      <Button size="sm" variant="outline" className="border-amber-600 text-amber-700 dark:text-amber-400 h-8" onClick={addTag}>Add</Button>
                    </div>
                    {scenarioTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {scenarioTags.map(t => (
                          <span key={t} className="inline-flex items-center gap-1 bg-amber-900/40 border border-amber-700 text-amber-700 dark:text-amber-300 text-xs px-2 py-0.5 rounded-full">
                            {t}
                            <button onClick={() => removeTag(t)} className="text-amber-700 dark:text-amber-500 hover:text-red-600 dark:hover:text-red-400">×</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
            {/* Load Saved Scenarios Panel */}
            {showLoadPanel && (
              <Card className="bg-blue-900/20 border-blue-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-blue-600 dark:text-blue-300 text-sm flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Saved Scenarios — {activeTab} ({ourPlayerCount}v{opponentPlayerCount})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Search bar */}
                  <Input
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setActiveTagFilter(null); savedScenariosQuery.refetch(); }}
                    placeholder="Search by name, notes or tag…"
                    className="bg-card border-border text-foreground text-xs h-8"
                  />
                  {/* Tag filter chips */}
                  {allTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      <button
                        onClick={() => { setActiveTagFilter(null); savedScenariosQuery.refetch(); }}
                        className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                          activeTagFilter === null ? 'bg-blue-600 border-blue-500 text-white' : 'border-border text-muted-foreground hover:border-blue-500'
                        }`}
                      >All</button>
                      {allTags.map(t => (
                        <button
                          key={t}
                          onClick={() => { setActiveTagFilter(activeTagFilter === t ? null : t); savedScenariosQuery.refetch(); }}
                          className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                            activeTagFilter === t ? 'bg-blue-600 border-blue-500 text-white' : 'border-border text-muted-foreground hover:border-blue-500'
                          }`}
                        >{t}</button>
                      ))}
                    </div>
                  )}
                  {savedScenariosQuery.isLoading && <p className="text-muted-foreground text-xs">Loading…</p>}
                  {savedScenariosQuery.data && savedScenariosQuery.data.length === 0 && (
                    <p className="text-muted-foreground text-xs">
                      {searchQuery || activeTagFilter ? 'No scenarios match your search.' : 'No saved scenarios for this type and team size yet. Set up a scenario and click Save.'}
                    </p>
                  )}
                  {savedScenariosQuery.data?.map((s: any) => (
                    <div key={s.id} className="space-y-1.5">
                    <div className="flex items-start justify-between bg-card rounded-lg px-3 py-2 gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-xs font-semibold truncate">{s.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {s.ourFormation} vs {s.opponentFormation} · {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                        {s.notes && <p className="text-muted-foreground text-xs truncate">{s.notes}</p>}
                        {s.tags && s.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {s.tags.map((t: string) => (
                              <button
                                key={t}
                                onClick={() => { setActiveTagFilter(t); savedScenariosQuery.refetch(); }}
                                className="text-xs bg-blue-900/50 border border-blue-700 text-blue-600 dark:text-blue-300 px-1.5 py-0 rounded-full hover:bg-blue-800/60"
                              >{t}</button>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs px-2" onClick={() => handleLoadScenario(s)}>
                          Load
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          className="border-border text-muted-foreground hover:bg-muted h-7 w-7 p-0"
                          title="Edit notes"
                          onClick={() => {
                            if (editingNotesId === s.id) { setEditingNotesId(null); }
                            else { setEditingNotesId(s.id); setEditingNotesText(s.notes || ''); }
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm" variant="outline"
                          className="border-border text-muted-foreground hover:bg-muted h-7 w-7 p-0"
                          title="Copy shareable link"
                          onClick={() => copyShareLink(s.id)}
                        >
                          <Link2 className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="border-red-700 text-red-600 dark:text-red-400 hover:bg-red-900/30 h-7 w-7 p-0" onClick={() => deleteScenario.mutate({ id: s.id })}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {/* Inline notes editor */}
                    {editingNotesId === s.id && (
                      <div className="space-y-1.5 px-1">
                        <Textarea
                          value={editingNotesText}
                          onChange={e => setEditingNotesText(e.target.value)}
                          placeholder="Add coaching notes, observations, or context…"
                          className="bg-muted border-border text-foreground text-xs min-h-[70px] resize-none"
                          rows={3}
                        />
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" className="border-border text-muted-foreground h-7 text-xs" onClick={() => setEditingNotesId(null)}>Cancel</Button>
                          <Button
                            size="sm"
                            className="bg-green-700 hover:bg-green-800 text-white h-7 text-xs gap-1"
                            disabled={updateNotes.isPending}
                            onClick={() => updateNotes.mutate({ id: s.id, notes: editingNotesText })}
                          >
                            <Check className="w-3 h-3" />{updateNotes.isPending ? 'Saving…' : 'Save Notes'}
                          </Button>
                        </div>
                      </div>
                    )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
            {/* Tactical Plan + Voice Input */}
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-green-700 dark:text-green-400" />
                  Tactical Plan — Voice or Text
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground text-xs">Describe your set-piece plan by voice or text. The AI will simulate it and give feedback.</p>
                <div className="flex gap-2">
                  <Textarea
                    value={tacticalPlan}
                    onChange={e => setTacticalPlan(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: اللاعب رقم 7 يركض نحو العمود القريب، اللاعب رقم 10 يقف على حافة المنطقة ويسدد إذا تم إبعاد الكرة...' : 'e.g. Player 7 makes a near-post run, player 10 holds at the edge of the box and shoots if the ball is cleared...'}
                    className="bg-muted border-border text-foreground text-xs min-h-[80px] flex-1"
                  />
                </div>
                {voiceTranscript && (
                  <p className="text-green-700 dark:text-green-400 text-xs bg-green-900/20 border border-green-500/30 rounded p-2">
                    {language === 'ar' ? 'تم التحويل: ' : 'Transcribed: '}{voiceTranscript}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isRecording ? 'destructive' : 'outline'}
                    className={isRecording ? 'bg-red-600 hover:bg-red-700' : 'border-green-600 text-green-400 hover:bg-green-900/30'}
                    onClick={() => {
                      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                      if (!SpeechRecognition) {
                        toast.error('Voice input not supported in this browser. Please use Chrome.');
                        return;
                      }
                      if (isRecording) {
                        recognitionRef.current?.stop();
                        setIsRecording(false);
                        return;
                      }
                      const recognition = new SpeechRecognition();
                      recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US';
                      recognition.continuous = true;
                      recognition.interimResults = true;
                      recognition.onresult = (event: any) => {
                        let transcript = '';
                        for (let i = 0; i < event.results.length; i++) {
                          transcript += event.results[i][0].transcript;
                        }
                        setVoiceTranscript(transcript);
                        setTacticalPlan(transcript);
                      };
                      recognition.onend = () => setIsRecording(false);
                      recognition.onerror = () => { setIsRecording(false); toast.error('Voice recognition error'); };
                      recognitionRef.current = recognition;
                      recognition.start();
                      setIsRecording(true);
                    }}
                  >
                    {isRecording ? <><MicOff className="w-3 h-3 mr-1" />{language === 'ar' ? 'إيقاف التسجيل' : 'Stop Recording'}</> : <><Mic className="w-3 h-3 mr-1" />{language === 'ar' ? 'تسجيل صوتي' : 'Record Voice'}</>}
                  </Button>
                  <Button
                    size="sm"
                    disabled={!tacticalPlan.trim() || isSimulating}
                    className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                    onClick={async () => {
                      if (!tacticalPlan.trim()) return;
                      setIsSimulating(true);
                      try {
                        const result = await generateSetPieceTips.mutateAsync({
                          setPieceType: (activeTab === 'freekick' ? 'free_kick' : activeTab) as any,
                          ourFormation,
                          opponentFormation,
                          opponentPlayerCount: parseInt(opponentPlayerCount),
                          opponentTeamInfo: opponentTeamInfo || undefined,
                          matchContext: tacticalPlan,
                        });
                        setSimulationResult(result);
                        setAiTips(result);
                        toast.success('Tactical plan simulated!');
                      } catch {
                        toast.error('Simulation failed. Please try again.');
                      } finally {
                        setIsSimulating(false);
                      }
                    }}
                  >
                    <Brain className="w-3 h-3 mr-1" />
                    {isSimulating ? (language === 'ar' ? 'جارٍ المحاكاة...' : 'Simulating...') : (language === 'ar' ? 'محاكاة الخطة' : 'Simulate Plan')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Analysis Result */}
            {aiTips && (
              <Card className="bg-purple-900/30 border-purple-500/40">
                <CardHeader className="pb-2">
                  <CardTitle className="text-purple-600 dark:text-purple-300 text-sm flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    AI Set-Piece Analysis
                    <Badge className="bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30 text-xs ml-auto">
                      {aiTips.successProbability}% Success Estimate
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-purple-800/30 rounded-lg">
                    <p className="text-purple-200 text-sm font-semibold mb-1">🎯 {aiTips.primaryRoutine}</p>
                    <p className="text-muted-foreground text-xs">{aiTips.description}</p>
                  </div>
                  {aiTips.exploitedWeakness && (
                    <div className="flex items-start gap-2 p-2 bg-red-900/20 border border-red-500/30 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-red-600 dark:text-red-300 text-xs font-medium">Opponent Weakness Exploited</p>
                        <p className="text-muted-foreground text-xs">{aiTips.exploitedWeakness}</p>
                      </div>
                    </div>
                  )}
                  {aiTips.playerRoles && aiTips.playerRoles.length > 0 && (
                    <div>
                      <p className="text-muted-foreground text-xs font-medium mb-2 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Player Instructions
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {aiTips.playerRoles.map((pr: any, i: number) => (
                          <div key={i} className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-amber-700 dark:text-amber-400 text-xs font-semibold">{pr.role}</p>
                            <p className="text-muted-foreground text-xs">{pr.instruction}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    {aiTips.alternativeRoutine && (
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground text-xs font-medium">Alternative Routine</p>
                        <p className="text-foreground text-xs">{aiTips.alternativeRoutine}</p>
                      </div>
                    )}
                    {aiTips.keyTiming && (
                      <div className="p-2 bg-muted/50 rounded-lg">
                        <p className="text-muted-foreground text-xs font-medium flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Timing</p>
                        <p className="text-foreground text-xs">{aiTips.keyTiming}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Default Coaching Tips */}
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-foreground text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  Scenario Coaching Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selectedScenario.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                      <ChevronRight className="w-3 h-3 text-amber-700 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground text-xs">{tip}</span>
                    </div>
                  ))}
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
