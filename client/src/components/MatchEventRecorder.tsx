import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Target, Navigation, Shield, Trash2, Check, X, Undo2, Redo2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

type EventType = "shot" | "pass" | "defensive";

interface ShotEvent {
  type: "shot";
  x: number;
  y: number;
  outcome: "goal" | "miss" | "saved";
  bodyPart: "foot" | "head" | "other";
  assistType: "open_play" | "corner" | "free_kick" | "through_ball" | "cross";
  xG: number;
}

interface PassEvent {
  type: "pass";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  completed: boolean;
  xA: number;
}

interface DefensiveEvent {
  type: "defensive";
  x: number;
  y: number;
  actionType: "tackle" | "interception" | "block" | "clearance";
  success: boolean;
}

type MatchEvent = ShotEvent | PassEvent | DefensiveEvent;

interface MatchEventRecorderProps {
  matchId?: number;
  onEventsChange?: (events: MatchEvent[]) => void;
}

export function MatchEventRecorder({ matchId, onEventsChange }: MatchEventRecorderProps) {
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const [currentEventType, setCurrentEventType] = useState<EventType>("shot");
  const [isRecording, setIsRecording] = useState(false);
  const pitchRef = useRef<HTMLDivElement>(null);
  
  // Undo/Redo history
  const [history, setHistory] = useState<MatchEvent[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Temporary state for multi-step events (like passes)
  const [passStart, setPassStart] = useState<{ x: number; y: number } | null>(null);

  // Shot recording state
  const [shotOutcome, setShotOutcome] = useState<"goal" | "miss" | "saved">("miss");
  const [shotBodyPart, setShotBodyPart] = useState<"foot" | "head" | "other">("foot");
  const [shotAssistType, setShotAssistType] = useState<"open_play" | "corner" | "free_kick" | "through_ball" | "cross">("open_play");

  // Defensive action state
  const [defensiveActionType, setDefensiveActionType] = useState<"tackle" | "interception" | "block" | "clearance">("tackle");
  const [defensiveSuccess, setDefensiveSuccess] = useState(true);

  // Pass state
  const [passCompleted, setPassCompleted] = useState(true);

  // Phase and Zone state
  const [currentPhase, setCurrentPhase] = useState<"in_possession" | "out_possession" | "attacking_transition" | "defensive_transition">("in_possession");
  const [currentZone, setCurrentZone] = useState<"build_up" | "progression" | "finishing">("progression");

  const calculateXG = (x: number, y: number, outcome: string, bodyPart: string): number => {
    // Simple xG calculation based on distance and angle
    const goalX = 100;
    const goalY = 50;
    const distance = Math.sqrt(Math.pow(goalX - x, 2) + Math.pow(goalY - y, 2));
    
    let baseXG = Math.max(0, 1 - (distance / 100));
    
    // Adjust for body part
    if (bodyPart === "head") baseXG *= 0.7;
    if (bodyPart === "other") baseXG *= 0.5;
    
    // Adjust for outcome (for realism)
    if (outcome === "goal") baseXG = Math.max(baseXG, 0.3);
    
    return Math.min(1, Math.max(0, baseXG));
  };

  const calculateXA = (startX: number, startY: number, endX: number, endY: number, completed: boolean): number => {
    // Simple xA calculation based on pass end location
    const goalX = 100;
    const goalY = 50;
    const distanceToGoal = Math.sqrt(Math.pow(goalX - endX, 2) + Math.pow(goalY - endY, 2));
    
    let baseXA = Math.max(0, 1 - (distanceToGoal / 80));
    
    if (!completed) baseXA = 0;
    
    return Math.min(0.8, Math.max(0, baseXA));
  };

  const handlePitchClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isRecording) return;

    const rect = pitchRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (currentEventType === "shot") {
      const xG = calculateXG(x, y, shotOutcome, shotBodyPart);
      const newEvent: any = {
        type: "shot",
        x,
        y,
        outcome: shotOutcome,
        bodyPart: shotBodyPart,
        assistType: shotAssistType,
        xG,
        phase: currentPhase,
        zone: currentZone,
      };
      const updatedEvents = [...events, newEvent];
      updateEventsWithHistory(updatedEvents);
      toast.success(`Shot recorded (xG: ${xG.toFixed(2)})`);
    } else if (currentEventType === "pass") {
      if (!passStart) {
        setPassStart({ x, y });
        toast.info("Click end position for pass");
      } else {
        const xA = calculateXA(passStart.x, passStart.y, x, y, passCompleted);
        const newEvent: any = {
          type: "pass",
          startX: passStart.x,
          startY: passStart.y,
          endX: x,
          endY: y,
          completed: passCompleted,
          xA,
          phase: currentPhase,
          zone: currentZone,
        };
        const updatedEvents = [...events, newEvent];
        updateEventsWithHistory(updatedEvents);
        setPassStart(null);
        toast.success(`Pass recorded (xA: ${xA.toFixed(2)})`);
      }
    } else if (currentEventType === "defensive") {
      const newEvent: any = {
        type: "defensive",
        x,
        y,
        actionType: defensiveActionType,
        success: defensiveSuccess,
        phase: currentPhase,
        zone: currentZone,
      };
      const updatedEvents = [...events, newEvent];
      updateEventsWithHistory(updatedEvents);
      toast.success(`${defensiveActionType} recorded`);
    }
  };

  const updateEventsWithHistory = (newEvents: MatchEvent[]) => {
    // Remove any future history when adding new event
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newEvents);
    
    // Limit history to 50 steps to prevent memory issues
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
    setEvents(newEvents);
    onEventsChange?.(newEvents);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousEvents = history[newIndex];
      setEvents(previousEvents);
      onEventsChange?.(previousEvents);
      toast.success("Undone");
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextEvents = history[newIndex];
      setEvents(nextEvents);
      onEventsChange?.(nextEvents);
      toast.success("Redone");
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const deleteEvent = (index: number) => {
    const updatedEvents = events.filter((_, i) => i !== index);
    updateEventsWithHistory(updatedEvents);
    toast.success("Event deleted");
  };

  const clearAll = () => {
    if (events.length === 0) return;
    
    if (window.confirm(`Are you sure you want to clear all ${events.length} events? This action can be undone.`)) {
      updateEventsWithHistory([]);
      toast.success("All events cleared");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Match Event Recorder</CardTitle>
          <CardDescription>
            {isRTL ? "انقر على الملعب لتسجيل التسديدات والتمريرات والأفعال الدفاعية" : "Click on the pitch to record shots, passes, and defensive actions"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Phase and Zone Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1">Match Phase <span className="text-xs text-muted-foreground">(مرحلة اللعب)</span></label>
              <Select value={currentPhase} onValueChange={(v: any) => setCurrentPhase(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_possession">{isRTL ? "مع الكرة" : "In Possession"}</SelectItem>
                  <SelectItem value="out_possession">{isRTL ? "بدون الكرة" : "Out of Possession"}</SelectItem>
                  <SelectItem value="attacking_transition">{isRTL ? "انتقال هجومي" : "Attacking Transition"}</SelectItem>
                  <SelectItem value="defensive_transition">{isRTL ? "انتقال دفاعي" : "Defensive Transition"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block flex items-center gap-1">Pitch Zone <span className="text-xs text-muted-foreground">(منطقة الملعب)</span></label>
              <Select value={currentZone} onValueChange={(v: any) => setCurrentZone(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="build_up">{isRTL ? "بناء الهجوم (الثلث الدفاعي)" : "Build Up (Defensive Third)"}</SelectItem>
                  <SelectItem value="progression">{isRTL ? "التقدم (الثلث الأوسط)" : "Progression (Middle Third)"}</SelectItem>
                  <SelectItem value="finishing">{isRTL ? "الإنهاء (الثلث الهجومي)" : "Finishing (Attacking Third)"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Event Type Selector */}
          <Tabs value={currentEventType} onValueChange={(v) => setCurrentEventType(v as EventType)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="shot">
                <Target className="h-4 w-4 mr-2" />
                Shots
              </TabsTrigger>
              <TabsTrigger value="pass">
                <Navigation className="h-4 w-4 mr-2" />
                Passes
              </TabsTrigger>
              <TabsTrigger value="defensive">
                <Shield className="h-4 w-4 mr-2" />
                Defensive
              </TabsTrigger>
            </TabsList>

            <TabsContent value="shot" className="space-y-3 mt-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-1">Outcome <span className="text-xs text-muted-foreground">(نتيجة التسديدة)</span></label>
                  <Select value={shotOutcome} onValueChange={(v: any) => setShotOutcome(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goal">{isRTL ? "هدف" : "Goal"}</SelectItem>
                      <SelectItem value="miss">{isRTL ? "تفويت" : "Miss"}</SelectItem>
                      <SelectItem value="saved">{isRTL ? "إنقاذ" : "Saved"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block flex items-center gap-1">Body Part <span className="text-xs text-muted-foreground">(جزء الجسم)</span></label>
                  <Select value={shotBodyPart} onValueChange={(v: any) => setShotBodyPart(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="foot">Foot</SelectItem>
                      <SelectItem value="head">Head</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Assist Type</label>
                  <Select value={shotAssistType} onValueChange={(v: any) => setShotAssistType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open_play">Open Play</SelectItem>
                      <SelectItem value="corner">Corner</SelectItem>
                      <SelectItem value="free_kick">Free Kick</SelectItem>
                      <SelectItem value="through_ball">Through Ball</SelectItem>
                      <SelectItem value="cross">Cross</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="pass" className="space-y-3 mt-4">
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium">Pass Completed</label>
                <Button
                  variant={passCompleted ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPassCompleted(!passCompleted)}
                >
                  {passCompleted ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                  {passCompleted ? "Completed" : "Incomplete"}
                </Button>
              </div>
              {passStart && (
                <div className="text-sm text-muted-foreground">
                  Click on the pitch to mark the end position of the pass
                </div>
              )}
            </TabsContent>

            <TabsContent value="defensive" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Action Type</label>
                  <Select value={defensiveActionType} onValueChange={(v: any) => setDefensiveActionType(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tackle">Tackle</SelectItem>
                      <SelectItem value="interception">Interception</SelectItem>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="clearance">Clearance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Success</label>
                  <Button
                    variant={defensiveSuccess ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDefensiveSuccess(!defensiveSuccess)}
                    className="w-full"
                  >
                    {defensiveSuccess ? <Check className="h-4 w-4 mr-2" /> : <X className="h-4 w-4 mr-2" />}
                    {defensiveSuccess ? "Successful" : "Failed"}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Recording Toggle */}
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={() => {
              setIsRecording(!isRecording);
              setPassStart(null);
              toast.info(isRecording ? "Recording stopped" : "Click on pitch to record events");
            }}
            className="w-full"
          >
            {isRecording ? "Stop Recording" : "Start Recording"}
          </Button>

          {/* Interactive Pitch */}
          <div
            ref={pitchRef}
            onClick={handlePitchClick}
            className={`relative w-full aspect-[2/1] bg-gradient-to-b from-green-600 to-green-700 rounded-lg overflow-hidden ${
              isRecording ? "cursor-crosshair" : "cursor-not-allowed"
            } border-4 border-white`}
            style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "10% 10%",
            }}
          >
            {/* Pitch markings */}
            <div className="absolute inset-0">
              {/* Center line */}
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/40" />
              {/* Center circle */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full border-2 border-white/40" />
              {/* Penalty areas */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/6 h-2/5 border-2 border-l-0 border-white/40" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/6 h-2/5 border-2 border-r-0 border-white/40" />
              {/* Goal areas */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/12 h-1/5 border-2 border-l-0 border-white/40" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/12 h-1/5 border-2 border-r-0 border-white/40" />
            </div>

            {/* Render events */}
            {events.map((event, index) => {
              if (event.type === "shot") {
                return (
                  <div
                    key={index}
                    className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white"
                    style={{
                      left: `${event.x}%`,
                      top: `${event.y}%`,
                      backgroundColor: event.outcome === "goal" ? "#10b981" : event.outcome === "saved" ? "#f59e0b" : "#ef4444",
                    }}
                    title={`Shot: ${event.outcome} (xG: ${event.xG.toFixed(2)})`}
                  />
                );
              } else if (event.type === "pass") {
                return (
                  <svg
                    key={index}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={{ overflow: "visible" }}
                  >
                    <defs>
                      <marker
                        id={`arrowhead-${index}`}
                        markerWidth="10"
                        markerHeight="10"
                        refX="9"
                        refY="3"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 10 3, 0 6"
                          fill={event.completed ? "#3b82f6" : "#ef4444"}
                        />
                      </marker>
                    </defs>
                    <line
                      x1={`${event.startX}%`}
                      y1={`${event.startY}%`}
                      x2={`${event.endX}%`}
                      y2={`${event.endY}%`}
                      stroke={event.completed ? "#3b82f6" : "#ef4444"}
                      strokeWidth="2"
                      markerEnd={`url(#arrowhead-${index})`}
                    />
                  </svg>
                );
              } else if (event.type === "defensive") {
                return (
                  <div
                    key={index}
                    className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${event.x}%`,
                      top: `${event.y}%`,
                    }}
                  >
                    <Shield
                      className="w-full h-full"
                      style={{
                        color: event.success ? "#10b981" : "#ef4444",
                        fill: event.success ? "#10b981" : "#ef4444",
                      }}
                    />
                  </div>
                );
              }
              return null;
            })}

            {/* Pass start indicator */}
            {passStart && (
              <div
                className="absolute w-4 h-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500 border-2 border-white animate-pulse"
                style={{
                  left: `${passStart.x}%`,
                  top: `${passStart.y}%`,
                }}
              />
            )}
          </div>

          {/* Event List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Recorded Events ({events.length})</h4>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleUndo}
                  disabled={historyIndex === 0}
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                {events.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {events.map((event, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                  <div className="flex items-center gap-2">
                    {event.type === "shot" && (
                      <>
                        <Target className="h-4 w-4" />
                        <span>Shot: {event.outcome}</span>
                        <Badge variant="secondary">xG: {event.xG.toFixed(2)}</Badge>
                      </>
                    )}
                    {event.type === "pass" && (
                      <>
                        <Navigation className="h-4 w-4" />
                        <span>Pass: {event.completed ? "Completed" : "Incomplete"}</span>
                        <Badge variant="secondary">xA: {event.xA.toFixed(2)}</Badge>
                      </>
                    )}
                    {event.type === "defensive" && (
                      <>
                        <Shield className="h-4 w-4" />
                        <span>{event.actionType}: {event.success ? "Success" : "Failed"}</span>
                      </>
                    )}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => deleteEvent(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {events.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No events recorded yet. Click "Start Recording" and then click on the pitch.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
