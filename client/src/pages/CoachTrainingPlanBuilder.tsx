import { useState, useCallback } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../_core/hooks/useAuth";
import { trpc } from "../lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Calendar, Plus, Trash2, Brain, Download, Save, Clock,
  Target, Dumbbell, Shield, Zap, Users, CheckCircle,
  Loader2, FileText, ChevronDown, ChevronUp,
  Video, ListOrdered, Settings, ArrowRight, Activity, Timer
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface SessionBlock {
  id: string;
  phase: "warmup" | "technical" | "tactical" | "physical" | "game" | "cooldown";
  title: string;
  durationMins: number;
  description: string;
  instructions: string;
  videoUrl?: string;
  drillCategory: string;
  intensity: "low" | "medium" | "high";
  equipment?: string;
}

interface TrainingSession {
  id: string;
  sessionNumber: number;
  weekNumber: number;
  dayOfWeek: string;
  title: string;
  focus: string;
  objectives: string[];
  blocks: SessionBlock[];
  notes: string;
  intensity: "low" | "medium" | "high" | "very-high";
}

interface TrainingPlan {
  title: string;
  ageGroup: string;
  level: "beginner" | "intermediate" | "advanced";
  totalWeeks: number;
  sessionsPerWeek: number;
  sessionDurationMins: number;
  objective: string;
  sessions: TrainingSession[];
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PHASE_CONFIG = {
  warmup:    { label: "Warm-Up",         labelAr: "الإحماء",       color: "bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30",  icon: Activity,  defaultMins: 10 },
  technical: { label: "Technical",       labelAr: "تقني",          color: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30",        icon: Target,    defaultMins: 20 },
  tactical:  { label: "Tactical",        labelAr: "تكتيكي",        color: "bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30",  icon: Brain,     defaultMins: 20 },
  physical:  { label: "Physical",        labelAr: "بدني",          color: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",           icon: Dumbbell,  defaultMins: 15 },
  game:      { label: "Small-Sided Game",labelAr: "لعبة مصغرة",   color: "bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30",     icon: Users,     defaultMins: 20 },
  cooldown:  { label: "Cool-Down",       labelAr: "التهدئة",       color: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-400 border-cyan-500/30",        icon: Shield,    defaultMins: 10 },
};

const DRILL_TEMPLATES: Record<string, { title: string; description: string; instructions: string; videoUrl?: string }[]> = {
  warmup: [
    { title: "Dynamic Stretching Circuit", description: "Full body dynamic warm-up: leg swings, arm circles, hip rotations", instructions: "1. Jog 2 laps around pitch\n2. High knees x 20m\n3. Butt kicks x 20m\n4. Leg swings (forward/sideways) x 10 each\n5. Arm circles x 10 each direction\n6. Hip rotations x 10 each direction", videoUrl: "https://www.youtube.com/watch?v=NyBmRZgMTas" },
    { title: "Rondo 4v1 Warm-Up", description: "Light possession rondo to activate passing and movement", instructions: "1. Set up 8x8m square\n2. 4 players outside, 1 in middle\n3. Keep possession with 1-2 touch passing\n4. Rotate middle player every 3 touches lost\n5. Focus on quality of touch, not intensity", videoUrl: "https://www.youtube.com/watch?v=M5JxnEJqkMo" },
    { title: "Agility Ladder Warm-Up", description: "Footwork activation using agility ladder patterns", instructions: "1. Two-feet in each rung x 2\n2. Lateral shuffle x 2\n3. In-in-out-out x 2\n4. Single leg hops x 2\n5. Keep light on feet, arms relaxed", videoUrl: "https://www.youtube.com/watch?v=NyBmRZgMTas" },
  ],
  technical: [
    { title: "Passing & Receiving - Pairs", description: "Short passing with correct technique focusing on weight and accuracy", instructions: "1. Players in pairs 10m apart\n2. Pass with inside of foot, receive with sole\n3. Alternate feet every 5 passes\n4. Progress: add movement after each pass\n5. Coaching points: locked ankle, follow through, body shape", videoUrl: "https://www.youtube.com/watch?v=M5JxnEJqkMo" },
    { title: "1v1 Dribbling Moves", description: "Practice 3 specific dribbling moves to beat defenders", instructions: "1. Set up 5x10m channels with cone defender\n2. Approach at speed, execute move at cone\n3. Move 1: Step-over + burst\n4. Move 2: Inside cut + acceleration\n5. Move 3: Cruyff turn\n6. 3 reps each move, both feet", videoUrl: "https://www.youtube.com/watch?v=3Rl0BFKX-Jg" },
    { title: "First Touch Drill - Volleys", description: "Control balls played at various heights and angles", instructions: "1. Server plays ball at chest/thigh/feet\n2. Receiver controls with correct surface\n3. Immediately play back to server\n4. 10 reps then switch\n5. Progress: control and turn away from server", videoUrl: "https://www.youtube.com/watch?v=vFvMFNKmXMo" },
    { title: "Crossing & Finishing", description: "Wide players deliver crosses for strikers to finish", instructions: "1. Wide player receives from GK\n2. Drives to byline\n3. Delivers cross to 2 strikers making runs\n4. Near post, far post, cut-back variations\n5. Rotate positions every 5 crosses", videoUrl: "https://www.youtube.com/watch?v=Yl5BNguO7HY" },
    { title: "Shooting from Distance", description: "Long-range shooting technique and power development", instructions: "1. Player receives ball 25m from goal\n2. Set body shape, non-kicking foot beside ball\n3. Strike through center of ball with laces\n4. Follow through toward target\n5. 5 shots each player, both feet", videoUrl: "https://www.youtube.com/watch?v=Yl5BNguO7HY" },
  ],
  tactical: [
    { title: "4-3-3 Attacking Patterns", description: "Rehearse specific attacking combinations in the 4-3-3 system", instructions: "1. Set up half pitch with 11 players\n2. Pattern A: LB overlaps, winger cuts inside, CM arrives late\n3. Pattern B: CB carries forward, triggers pressing\n4. Walk through 3x, then at 75% speed\n5. Finish with live execution", videoUrl: "https://www.youtube.com/watch?v=M5JxnEJqkMo" },
    { title: "Pressing Triggers Drill", description: "Coordinate team pressing from specific triggers", instructions: "1. Identify 3 triggers: back pass to GK, ball to CB, slow pass\n2. On trigger: nearest player presses, others shift\n3. Practice in 8v8 on half pitch\n4. Coach calls triggers, team reacts\n5. Reward successful presses", videoUrl: "https://www.youtube.com/watch?v=Qm7kBsGDhFo" },
    { title: "Defensive Shape 4-4-2", description: "Maintain compact defensive block and transition to attack", instructions: "1. Set up 10v10 on 3/4 pitch\n2. Defending team holds 4-4-2 shape\n3. Compact lines, max 25m between lines\n4. On ball recovery: immediate transition\n5. Focus: communication, cover shadows", videoUrl: "https://www.youtube.com/watch?v=Qm7kBsGDhFo" },
    { title: "Counter-Attack Patterns", description: "Fast transition from defense to attack in 3v2 and 4v3 situations", instructions: "1. Start with 6v6 possession\n2. On coach signal: defending team wins ball\n3. Immediate counter: 3 players forward\n4. Outnumber defenders 3v2\n5. Finish within 6 seconds of winning ball", videoUrl: "https://www.youtube.com/watch?v=M5JxnEJqkMo" },
  ],
  physical: [
    { title: "Speed & Agility Circuit", description: "High-intensity speed and agility stations", instructions: "1. Station 1: 10m sprint x 4\n2. Station 2: Agility ladder (2 patterns) x 3\n3. Station 3: Cone slalom x 3\n4. Station 4: Reactive sprint (coach points direction)\n5. 30s rest between stations, 2 rounds total", videoUrl: "https://www.youtube.com/watch?v=NyBmRZgMTas" },
    { title: "Plyometric Power Training", description: "Explosive jumping and bounding exercises for power development", instructions: "1. Box jumps x 8\n2. Broad jumps x 8\n3. Lateral bounds x 10 each side\n4. Single leg hops x 6 each\n5. 90s rest between sets, 3 sets total\n6. Land softly, absorb impact", videoUrl: "https://www.youtube.com/watch?v=NyBmRZgMTas" },
    { title: "Endurance Runs with Ball", description: "Maintain technical quality under physical fatigue", instructions: "1. Players dribble around cones for 3 minutes\n2. On whistle: sprint to nearest cone\n3. Recover jog for 30s\n4. Repeat 6 times\n5. Maintain ball control throughout", videoUrl: "https://www.youtube.com/watch?v=NyBmRZgMTas" },
  ],
  game: [
    { title: "3v3 + GK Small-Sided Game", description: "High intensity game to develop quick decisions and 1v1 quality", instructions: "1. 30x20m pitch, small goals\n2. 3v3 + GKs\n3. No restrictions, free play\n4. Rotate teams every 4 minutes\n5. Coaching points from sideline only", videoUrl: "https://www.youtube.com/watch?v=M5JxnEJqkMo" },
    { title: "5v5 Possession Game", description: "Maintain possession under pressure with transition moments", instructions: "1. 40x30m pitch\n2. Team keeps possession scores 1 point per 5 consecutive passes\n3. On turnover: immediate press\n4. 8 minutes per game\n5. Encourage quick combinations", videoUrl: "https://www.youtube.com/watch?v=M5JxnEJqkMo" },
    { title: "7v7 Full Game with Constraints", description: "Full game applying session themes with specific constraints", instructions: "1. 60x40m pitch\n2. Apply session theme (e.g. must play through midfield)\n3. Constraint: max 3 touches in own half\n4. 12 minutes each half\n5. Debrief after game", videoUrl: "https://www.youtube.com/watch?v=M5JxnEJqkMo" },
  ],
  cooldown: [
    { title: "Static Stretching Routine", description: "Full body static stretches to aid recovery", instructions: "1. Quad stretch: 30s each leg\n2. Hamstring stretch: 30s each leg\n3. Hip flexor lunge: 30s each\n4. Calf stretch: 30s each\n5. Shoulder cross-body: 20s each\n6. Breathe deeply throughout", videoUrl: "https://www.youtube.com/watch?v=NyBmRZgMTas" },
    { title: "Light Jog & Breathing", description: "Easy jog to lower heart rate gradually", instructions: "1. Light jog 2 laps around pitch\n2. Reduce pace each lap\n3. Finish with 1 minute walking\n4. Deep breathing x 5\n5. Team huddle for feedback", videoUrl: "https://www.youtube.com/watch?v=NyBmRZgMTas" },
  ],
};

const DAYS = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const AGE_GROUPS = ["U8", "U10", "U12", "U14", "U16", "U18", "Senior"];

function generateId() { return Math.random().toString(36).substr(2, 9); }

function buildDefaultSession(sessionNumber: number, weekNumber: number, dayOfWeek: string, durationMins: number, focus: string): TrainingSession {
  const warmupMins = Math.max(8, Math.round(durationMins * 0.12));
  const technicalMins = Math.round(durationMins * 0.25);
  const tacticalMins = Math.round(durationMins * 0.22);
  const physicalMins = Math.round(durationMins * 0.15);
  const gameMins = Math.round(durationMins * 0.18);
  const cooldownMins = Math.max(5, durationMins - warmupMins - technicalMins - tacticalMins - physicalMins - gameMins);

  const blocks: SessionBlock[] = [
    { id: generateId(), phase: "warmup",    title: DRILL_TEMPLATES.warmup[0].title,    durationMins: warmupMins,    description: DRILL_TEMPLATES.warmup[0].description,    instructions: DRILL_TEMPLATES.warmup[0].instructions,    videoUrl: DRILL_TEMPLATES.warmup[0].videoUrl,    drillCategory: "warmup",    intensity: "low",    equipment: "Cones, Agility Ladder" },
    { id: generateId(), phase: "technical", title: DRILL_TEMPLATES.technical[0].title, durationMins: technicalMins, description: DRILL_TEMPLATES.technical[0].description, instructions: DRILL_TEMPLATES.technical[0].instructions, videoUrl: DRILL_TEMPLATES.technical[0].videoUrl, drillCategory: "passing",   intensity: "medium", equipment: "Balls, Cones" },
    { id: generateId(), phase: "tactical",  title: DRILL_TEMPLATES.tactical[0].title,  durationMins: tacticalMins,  description: DRILL_TEMPLATES.tactical[0].description,  instructions: DRILL_TEMPLATES.tactical[0].instructions,  videoUrl: DRILL_TEMPLATES.tactical[0].videoUrl,  drillCategory: "tactical",  intensity: "medium", equipment: "Bibs, Cones, Goals" },
    { id: generateId(), phase: "physical",  title: DRILL_TEMPLATES.physical[0].title,  durationMins: physicalMins,  description: DRILL_TEMPLATES.physical[0].description,  instructions: DRILL_TEMPLATES.physical[0].instructions,  videoUrl: DRILL_TEMPLATES.physical[0].videoUrl,  drillCategory: "physical",  intensity: "high",   equipment: "Cones, Agility Ladder" },
    { id: generateId(), phase: "game",      title: DRILL_TEMPLATES.game[0].title,      durationMins: gameMins,      description: DRILL_TEMPLATES.game[0].description,      instructions: DRILL_TEMPLATES.game[0].instructions,      videoUrl: DRILL_TEMPLATES.game[0].videoUrl,      drillCategory: "game",      intensity: "high",   equipment: "Goals, Bibs, Balls" },
    { id: generateId(), phase: "cooldown",  title: DRILL_TEMPLATES.cooldown[0].title,  durationMins: cooldownMins,  description: DRILL_TEMPLATES.cooldown[0].description,  instructions: DRILL_TEMPLATES.cooldown[0].instructions,  videoUrl: DRILL_TEMPLATES.cooldown[0].videoUrl,  drillCategory: "recovery",  intensity: "low",    equipment: "None" },
  ];

  return { id: generateId(), sessionNumber, weekNumber, dayOfWeek, title: `Session ${sessionNumber} – Week ${weekNumber}`, focus, objectives: ["Improve technical quality", "Apply tactical concepts", "Build physical conditioning"], blocks, notes: "", intensity: "medium" };
}

// ─── Block Editor ─────────────────────────────────────────────────────────────
function BlockEditor({ block, onUpdate, onDelete, language }: { block: SessionBlock; onUpdate: (b: SessionBlock) => void; onDelete: () => void; language: string }) {
  const [expanded, setExpanded] = useState(false);
  const phase = PHASE_CONFIG[block.phase];
  const PhaseIcon = phase.icon;

  return (
    <div className={`border rounded-lg overflow-hidden ${expanded ? "border-blue-500/50" : "border-border"}`}>
      <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50" onClick={() => setExpanded(!expanded)}>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border font-medium ${phase.color}`}>
          <PhaseIcon className="w-3 h-3" />
          {language === "ar" ? phase.labelAr : phase.label}
        </span>
        <span className="text-foreground text-sm font-medium flex-1 truncate">{block.title}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Timer className="w-3 h-3" />{block.durationMins}m</span>
          {block.videoUrl && <Video className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>

      {expanded && (
        <div className="p-4 border-t border-border bg-card/50 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Block Title</Label>
              <Input value={block.title} onChange={e => onUpdate({ ...block, title: e.target.value })} className="bg-muted border-border text-foreground text-sm h-8" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Duration (min)</Label>
              <Input type="number" min={5} max={60} value={block.durationMins} onChange={e => onUpdate({ ...block, durationMins: parseInt(e.target.value) || 10 })} className="bg-muted border-border text-foreground text-sm h-8" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Phase</Label>
              <Select value={block.phase} onValueChange={v => onUpdate({ ...block, phase: v as SessionBlock["phase"] })}>
                <SelectTrigger className="bg-muted border-border text-foreground text-sm h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(PHASE_CONFIG).map(([k, c]) => <SelectItem key={k} value={k}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Intensity</Label>
              <Select value={block.intensity} onValueChange={v => onUpdate({ ...block, intensity: v as SessionBlock["intensity"] })}>
                <SelectTrigger className="bg-muted border-border text-foreground text-sm h-8"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
            <Input value={block.description} onChange={e => onUpdate({ ...block, description: e.target.value })} className="bg-muted border-border text-foreground text-sm h-8" />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Step-by-Step Instructions</Label>
            <Textarea value={block.instructions} onChange={e => onUpdate({ ...block, instructions: e.target.value })} className="bg-muted border-border text-foreground text-sm min-h-[90px] resize-none" placeholder={"1. First step\n2. Second step\n3. Coaching points..."} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Video URL (YouTube)</Label>
              <Input value={block.videoUrl || ""} onChange={e => onUpdate({ ...block, videoUrl: e.target.value })} className="bg-muted border-border text-foreground text-sm h-8" placeholder="https://youtube.com/watch?v=..." />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Equipment Needed</Label>
              <Input value={block.equipment || ""} onChange={e => onUpdate({ ...block, equipment: e.target.value })} className="bg-muted border-border text-foreground text-sm h-8" placeholder="Cones, Balls, Bibs..." />
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Quick Templates</Label>
            <div className="flex flex-wrap gap-1.5">
              {(DRILL_TEMPLATES[block.phase] || []).map((t, i) => (
                <button key={i} onClick={() => onUpdate({ ...block, title: t.title, description: t.description, instructions: t.instructions, videoUrl: t.videoUrl })} className="text-xs px-2 py-1 bg-muted hover:bg-muted text-muted-foreground rounded border border-border transition-colors">{t.title}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-end pt-1">
            <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-900/20 text-xs h-7">
              <Trash2 className="w-3 h-3 mr-1" />Remove Block
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Session Editor ───────────────────────────────────────────────────────────
function SessionEditor({ session, onUpdate, language }: { session: TrainingSession; onUpdate: (s: TrainingSession) => void; language: string }) {
  const [expanded, setExpanded] = useState(false);
  const totalMins = session.blocks.reduce((s, b) => s + b.durationMins, 0);

  const addBlock = (phase: SessionBlock["phase"]) => {
    const templates = DRILL_TEMPLATES[phase] || [];
    const t = templates[0] || { title: `New ${phase} block`, description: "", instructions: "", videoUrl: "" };
    const newBlock: SessionBlock = { id: generateId(), phase, title: t.title, durationMins: PHASE_CONFIG[phase].defaultMins, description: t.description, instructions: t.instructions, videoUrl: t.videoUrl, drillCategory: phase, intensity: phase === "warmup" || phase === "cooldown" ? "low" : "medium", equipment: "Cones, Balls" };
    onUpdate({ ...session, blocks: [...session.blocks, newBlock] });
  };

  const updateBlock = (idx: number, updated: SessionBlock) => { const b = [...session.blocks]; b[idx] = updated; onUpdate({ ...session, blocks: b }); };
  const deleteBlock = (idx: number) => { onUpdate({ ...session, blocks: session.blocks.filter((_, i) => i !== idx) }); };

  const intensityColor = { low: "text-green-700 dark:text-green-400", medium: "text-yellow-700 dark:text-yellow-400", high: "text-orange-700 dark:text-orange-400", "very-high": "text-red-600 dark:text-red-400" }[session.intensity];

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-3 p-4 bg-muted/60 cursor-pointer hover:bg-muted" onClick={() => setExpanded(!expanded)}>
        <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shrink-0">{session.sessionNumber}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-semibold text-sm truncate">{session.title}</span>
            <Badge variant="outline" className="text-xs border-border text-muted-foreground shrink-0">Wk {session.weekNumber}</Badge>
          </div>
          <div className="flex items-center gap-3 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{session.dayOfWeek}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Timer className="w-3 h-3" />{totalMins} min</span>
            <span className={`text-xs flex items-center gap-1 ${intensityColor}`}><Zap className="w-3 h-3" />{session.intensity}</span>
            <span className="text-xs text-muted-foreground">{session.blocks.length} blocks</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </div>

      {expanded && (
        <div className="p-4 space-y-4 bg-card/30">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Session Title</Label>
              <Input value={session.title} onChange={e => onUpdate({ ...session, title: e.target.value })} className="bg-muted border-border text-foreground text-sm h-8" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Focus Area</Label>
              <Input value={session.focus} onChange={e => onUpdate({ ...session, focus: e.target.value })} className="bg-muted border-border text-foreground text-sm h-8" placeholder="e.g. Passing & Movement" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Overall Intensity</Label>
              <Select value={session.intensity} onValueChange={v => onUpdate({ ...session, intensity: v as TrainingSession["intensity"] })}>
                <SelectTrigger className="bg-muted border-border text-foreground text-sm h-8"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low</SelectItem><SelectItem value="medium">Medium</SelectItem><SelectItem value="high">High</SelectItem><SelectItem value="very-high">Very High</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Session Objectives (one per line)</Label>
            <Textarea value={session.objectives.join("\n")} onChange={e => onUpdate({ ...session, objectives: e.target.value.split("\n").filter(Boolean) })} className="bg-muted border-border text-foreground text-sm min-h-[65px] resize-none" placeholder={"Improve passing accuracy\nApply pressing triggers\nBuild team shape"} />
          </div>

          {/* Blocks */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm text-muted-foreground font-semibold flex items-center gap-2">
                <ListOrdered className="w-4 h-4" />Session Blocks
                <span className="text-xs text-muted-foreground font-normal">({totalMins} min)</span>
              </Label>
              <div className="flex gap-1 flex-wrap justify-end">
                {Object.keys(PHASE_CONFIG).map(phase => {
                  const cfg = PHASE_CONFIG[phase as keyof typeof PHASE_CONFIG];
                  return (
                    <button key={phase} onClick={() => addBlock(phase as SessionBlock["phase"])} className={`text-xs px-2 py-0.5 rounded border transition-colors ${cfg.color} hover:opacity-80`}>
                      + {language === "ar" ? cfg.labelAr : cfg.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-2">
              {session.blocks.map((block, idx) => (
                <BlockEditor key={block.id} block={block} onUpdate={u => updateBlock(idx, u)} onDelete={() => deleteBlock(idx)} language={language} />
              ))}
            </div>
            {session.blocks.length === 0 && (
              <div className="text-center py-5 text-muted-foreground text-sm border border-dashed border-border rounded-lg">No blocks yet. Add phases above.</div>
            )}
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Coach Notes</Label>
            <Textarea value={session.notes} onChange={e => onUpdate({ ...session, notes: e.target.value })} className="bg-muted border-border text-foreground text-sm min-h-[55px] resize-none" placeholder="Any special notes for this session..." />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CoachTrainingPlanBuilder() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const [step, setStep] = useState<"setup" | "sessions">("setup");
  const [plan, setPlan] = useState<TrainingPlan>({ title: "", ageGroup: "U14", level: "intermediate", totalWeeks: 4, sessionsPerWeek: 3, sessionDurationMins: 90, objective: "", sessions: [] });
  const [aiLoading, setAiLoading] = useState(false);
  const [activeWeek, setActiveWeek] = useState(1);
  const aiChat = trpc.ai.chat.useMutation();

  const totalSessions = plan.totalWeeks * plan.sessionsPerWeek;

  const generateSessions = useCallback(() => {
    const sessions: TrainingSession[] = [];
    const focusRotation = ["Technical & Passing", "Tactical & Defending", "Physical & Shooting", "Mixed Game Play"];
    const intensityPattern: TrainingSession["intensity"][] = ["medium", "high", "low"];
    let num = 1;
    for (let week = 1; week <= plan.totalWeeks; week++) {
      const weekDays = DAYS.slice(0, plan.sessionsPerWeek);
      for (let s = 0; s < plan.sessionsPerWeek; s++) {
        const session = buildDefaultSession(num, week, weekDays[s], plan.sessionDurationMins, focusRotation[(num - 1) % focusRotation.length]);
        session.intensity = intensityPattern[(num - 1) % intensityPattern.length];
        sessions.push(session);
        num++;
      }
    }
    setPlan(prev => ({ ...prev, sessions }));
    setStep("sessions");
    toast.success(`Generated ${sessions.length} sessions across ${plan.totalWeeks} weeks!`);
  }, [plan.totalWeeks, plan.sessionsPerWeek, plan.sessionDurationMins]);

  const updateSession = (idx: number, updated: TrainingSession) => {
    const sessions = [...plan.sessions];
    sessions[idx] = updated;
    setPlan(prev => ({ ...prev, sessions }));
  };

  const handleAIEnhance = async () => {
    if (!plan.objective) { toast.error("Please set a plan objective first"); return; }
    setAiLoading(true);
    try {
      const prompt = `You are an expert football coach. Create a ${plan.totalWeeks}-week training plan overview for ${plan.ageGroup} (${plan.level} level), ${plan.sessionsPerWeek} sessions/week, ${plan.sessionDurationMins} min each. Objective: ${plan.objective}. Provide: 1) Weekly themes, 2) Session focus rotation, 3) Progression notes, 4) Key coaching points for this age group. Be concise and practical.`;
      await aiChat.mutateAsync({ message: prompt, currentPage: "training_plan" });
      toast.success("AI suggestions ready! Check console for details.");
    } catch {
      toast.error("AI enhancement failed");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSave = () => {
    if (!plan.title) { toast.error("Please enter a plan title"); return; }
    const saved = JSON.parse(localStorage.getItem("coachTrainingPlans") || "[]");
    saved.unshift({ ...plan, id: generateId(), savedAt: new Date().toISOString() });
    localStorage.setItem("coachTrainingPlans", JSON.stringify(saved.slice(0, 20)));
    toast.success("Training plan saved!");
  };

  const handleExport = () => {
    const content = plan.sessions.map(s => {
      const blocks = s.blocks.map(b => `  [${PHASE_CONFIG[b.phase].label} - ${b.durationMins}min] ${b.title}\n  ${b.description}\n  Instructions:\n${b.instructions.split("\n").map(l => "    " + l).join("\n")}\n  Equipment: ${b.equipment || "N/A"}`).join("\n\n");
      return `SESSION ${s.sessionNumber} - Week ${s.weekNumber} (${s.dayOfWeek})\nTitle: ${s.title} | Focus: ${s.focus} | Intensity: ${s.intensity}\nTotal: ${s.blocks.reduce((a, b) => a + b.durationMins, 0)} min\nObjectives:\n${s.objectives.map(o => "  • " + o).join("\n")}\n\nBlocks:\n${blocks}\n\nCoach Notes: ${s.notes || "None"}\n${"─".repeat(60)}`;
    }).join("\n\n");
    const text = `TRAINING PLAN: ${plan.title}\nAge Group: ${plan.ageGroup} | Level: ${plan.level}\nDuration: ${plan.totalWeeks} weeks | ${plan.sessionsPerWeek} sessions/week | ${plan.sessionDurationMins} min/session\nObjective: ${plan.objective}\n\n${"═".repeat(60)}\n\n${content}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan.title.replace(/\s+/g, "_")}_training_plan.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Plan exported!");
  };

  // ─── STEP 1: Setup ─────────────────────────────────────────────────────────
  if (step === "setup") {
    return (
      <>
      <div className="text-foreground p-4 md:p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Training Plan Builder</h1>
              <p className="text-muted-foreground text-sm">Create a complete multi-week training programme with detailed sessions</p>
            </div>
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2"><Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />Plan Configuration</CardTitle>
              <CardDescription>Set up the parameters for your training plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-muted-foreground mb-1.5 block">Plan Title *</Label>
                <Input value={plan.title} onChange={e => setPlan(p => ({ ...p, title: e.target.value }))} placeholder="e.g. U14 Pre-Season Programme – August 2025" className="bg-muted border-border text-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground mb-1.5 block">Age Group</Label>
                  <Select value={plan.ageGroup} onValueChange={v => setPlan(p => ({ ...p, ageGroup: v }))}>
                    <SelectTrigger className="bg-muted border-border text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent>{AGE_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground mb-1.5 block">Level</Label>
                  <Select value={plan.level} onValueChange={v => setPlan(p => ({ ...p, level: v as TrainingPlan["level"] }))}>
                    <SelectTrigger className="bg-muted border-border text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="beginner">Beginner</SelectItem><SelectItem value="intermediate">Intermediate</SelectItem><SelectItem value="advanced">Advanced</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration Controls */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl border border-border">
                {[
                  { label: "Number of Weeks", value: plan.totalWeeks, min: 1, max: 16, step: 1, key: "totalWeeks", color: "text-blue-600 dark:text-blue-400", unit: "weeks" },
                  { label: "Sessions Per Week", value: plan.sessionsPerWeek, min: 1, max: 7, step: 1, key: "sessionsPerWeek", color: "text-green-700 dark:text-green-400", unit: "sessions/wk" },
                  { label: "Session Duration", value: plan.sessionDurationMins, min: 30, max: 180, step: 15, key: "sessionDurationMins", color: "text-orange-700 dark:text-orange-400", unit: "minutes" },
                ].map(ctrl => (
                  <div key={ctrl.key} className="text-center">
                    <Label className="text-muted-foreground text-xs mb-2 block">{ctrl.label}</Label>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setPlan(p => ({ ...p, [ctrl.key]: Math.max(ctrl.min, (p as any)[ctrl.key] - ctrl.step) }))} className="w-7 h-7 rounded-full bg-muted hover:bg-muted text-foreground flex items-center justify-center font-bold">−</button>
                      <span className={`text-xl font-bold ${ctrl.color} w-10 text-center`}>{ctrl.value}</span>
                      <button onClick={() => setPlan(p => ({ ...p, [ctrl.key]: Math.min(ctrl.max, (p as any)[ctrl.key] + ctrl.step) }))} className="w-7 h-7 rounded-full bg-muted hover:bg-muted text-foreground flex items-center justify-center font-bold">+</button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{ctrl.unit}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg text-sm">
                <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="text-blue-600 dark:text-blue-300">
                  This plan will have <strong>{totalSessions} total sessions</strong> across {plan.totalWeeks} weeks,
                  totalling <strong>{Math.round(totalSessions * plan.sessionDurationMins / 60)} hours</strong> of training.
                </span>
              </div>

              <div>
                <Label className="text-muted-foreground mb-1.5 block">Main Objective / Goal</Label>
                <Textarea value={plan.objective} onChange={e => setPlan(p => ({ ...p, objective: e.target.value }))} placeholder="e.g. Improve team possession play, develop pressing triggers, and build physical conditioning for the upcoming season..." className="bg-muted border-border text-foreground min-h-[80px] resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <Button onClick={generateSessions} disabled={!plan.title} className="flex-1 bg-blue-600 hover:bg-blue-700">
                  <ArrowRight className="w-4 h-4 mr-2" />Generate {totalSessions} Sessions
                </Button>
                <Button variant="outline" onClick={handleAIEnhance} disabled={aiLoading || !plan.objective} className="border-purple-500/50 text-purple-600 dark:text-purple-400 hover:bg-purple-900/20">
                  {aiLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}AI Suggest
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </>
    );
  }

  // ─── STEP 2: Sessions ──────────────────────────────────────────────────────
  const weekSessions = plan.sessions.filter(s => s.weekNumber === activeWeek);

  return (
    <>
    <div className="text-foreground p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold">{plan.title}</h1>
            <p className="text-muted-foreground text-sm">{plan.ageGroup} • {plan.level} • {plan.totalWeeks}wk • {plan.sessionsPerWeek}/wk • {plan.sessionDurationMins}min</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setStep("setup")} className="border-border text-muted-foreground hover:text-foreground"><Settings className="w-4 h-4 mr-1" />Settings</Button>
            <Button variant="outline" size="sm" onClick={handleSave} className="border-green-500/50 text-green-700 dark:text-green-400 hover:bg-green-900/20"><Save className="w-4 h-4 mr-1" />Save</Button>
            <Button variant="outline" size="sm" onClick={handleExport} className="border-blue-500/50 text-blue-600 dark:text-blue-400 hover:bg-blue-900/20"><FileText className="w-4 h-4 mr-1" />Export</Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Sessions", value: plan.sessions.length, icon: Calendar, color: "text-blue-600 dark:text-blue-400" },
            { label: "Total Hours", value: `${Math.round(plan.sessions.reduce((a, s) => a + s.blocks.reduce((x, b) => x + b.durationMins, 0), 0) / 60)}h`, icon: Clock, color: "text-green-700 dark:text-green-400" },
            { label: "Weeks", value: plan.totalWeeks, icon: Target, color: "text-orange-700 dark:text-orange-400" },
            { label: "Total Blocks", value: plan.sessions.reduce((a, s) => a + s.blocks.length, 0), icon: ListOrdered, color: "text-purple-600 dark:text-purple-400" },
          ].map((stat, i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-3 flex items-center gap-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div><p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p><p className="text-xs text-muted-foreground">{stat.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Week Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {Array.from({ length: plan.totalWeeks }, (_, i) => i + 1).map(week => (
            <button key={week} onClick={() => setActiveWeek(week)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeWeek === week ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
              Week {week} <span className="ml-1 text-xs opacity-70">({plan.sessions.filter(s => s.weekNumber === week).length})</span>
            </button>
          ))}
        </div>

        {/* Sessions */}
        <div className="space-y-3">
          {weekSessions.map(session => {
            const idx = plan.sessions.findIndex(s => s.id === session.id);
            return <SessionEditor key={session.id} session={session} onUpdate={u => updateSession(idx, u)} language={language} />;
          })}
        </div>

        {/* Add Session */}
        <div className="mt-4">
          <Button variant="outline" onClick={() => {
            const wSess = plan.sessions.filter(s => s.weekNumber === activeWeek);
            const newSession = buildDefaultSession(plan.sessions.length + 1, activeWeek, DAYS[wSess.length % DAYS.length], plan.sessionDurationMins, "Mixed");
            setPlan(prev => ({ ...prev, sessions: [...prev.sessions, newSession] }));
          }} className="w-full border-dashed border-border text-muted-foreground hover:text-foreground hover:border-gray-500">
            <Plus className="w-4 h-4 mr-2" />Add Session to Week {activeWeek}
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
