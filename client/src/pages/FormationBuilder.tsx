import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { toast } from 'sonner';
import { trpc } from "@/lib/trpc";
import { PageSkeleton } from "@/components/PageSkeleton";
import PageBreadcrumb from "@/components/PageBreadcrumb";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Trash2, Plus, Users, RotateCcw, Download, Upload } from "lucide-react";
import { useLanguage } from '@/contexts/LanguageContext';

// Formation templates with positions
const FORMATION_TEMPLATES: Record<string, { name: string; positions: { x: number; y: number; role: string }[] }> = {
  // Small-Sided Game Formations
  "2-1-1 (5v5)": {
    name: "2-1-1 (5v5)",
    positions: [
      { x: 50, y: 90, role: "GK" },
      { x: 30, y: 70, role: "CB" },
      { x: 70, y: 70, role: "CB" },
      { x: 50, y: 45, role: "CM" },
      { x: 50, y: 20, role: "ST" },
    ],
  },
  "1-2-1 (5v5)": {
    name: "1-2-1 (5v5)",
    positions: [
      { x: 50, y: 90, role: "GK" },
      { x: 50, y: 70, role: "CB" },
      { x: 30, y: 45, role: "CM" },
      { x: 70, y: 45, role: "CM" },
      { x: 50, y: 20, role: "ST" },
    ],
  },
  "2-2-2 (7v7)": {
    name: "2-2-2 (7v7)",
    positions: [
      { x: 50, y: 90, role: "GK" },
      { x: 30, y: 70, role: "CB" },
      { x: 70, y: 70, role: "CB" },
      { x: 30, y: 45, role: "CM" },
      { x: 70, y: 45, role: "CM" },
      { x: 35, y: 20, role: "ST" },
      { x: 65, y: 20, role: "ST" },
    ],
  },
  "3-2-1 (7v7)": {
    name: "3-2-1 (7v7)",
    positions: [
      { x: 50, y: 90, role: "GK" },
      { x: 25, y: 70, role: "CB" },
      { x: 50, y: 70, role: "CB" },
      { x: 75, y: 70, role: "CB" },
      { x: 35, y: 45, role: "CM" },
      { x: 65, y: 45, role: "CM" },
      { x: 50, y: 20, role: "ST" },
    ],
  },
  "3-3-2 (9v9)": {
    name: "3-3-2 (9v9)",
    positions: [
      { x: 50, y: 90, role: "GK" },
      { x: 25, y: 70, role: "CB" },
      { x: 50, y: 70, role: "CB" },
      { x: 75, y: 70, role: "CB" },
      { x: 20, y: 45, role: "LM" },
      { x: 50, y: 45, role: "CM" },
      { x: 80, y: 45, role: "RM" },
      { x: 35, y: 20, role: "ST" },
      { x: 65, y: 20, role: "ST" },
    ],
  },
  "3-2-3 (9v9)": {
    name: "3-2-3 (9v9)",
    positions: [
      { x: 50, y: 90, role: "GK" },
      { x: 25, y: 70, role: "CB" },
      { x: 50, y: 70, role: "CB" },
      { x: 75, y: 70, role: "CB" },
      { x: 35, y: 50, role: "CM" },
      { x: 65, y: 50, role: "CM" },
      { x: 20, y: 25, role: "LW" },
      { x: 50, y: 20, role: "ST" },
      { x: 80, y: 25, role: "RW" },
    ],
  },
  "2-3-3 (9v9)": {
    name: "2-3-3 (9v9)",
    positions: [
      { x: 50, y: 90, role: "GK" },
      { x: 30, y: 70, role: "CB" },
      { x: 70, y: 70, role: "CB" },
      { x: 25, y: 50, role: "LM" },
      { x: 50, y: 50, role: "CM" },
      { x: 75, y: 50, role: "RM" },
      { x: 20, y: 25, role: "LW" },
      { x: 50, y: 20, role: "ST" },
      { x: 80, y: 25, role: "RW" },
    ],
  },
  "4-4-2": {
    name: "4-4-2",
    positions: [
      { x: 50, y: 90, role: "GK" },
      { x: 15, y: 70, role: "LB" },
      { x: 35, y: 70, role: "CB" },
      { x: 65, y: 70, role: "CB" },
      { x: 85, y: 70, role: "RB" },
      { x: 15, y: 45, role: "LM" },
      { x: 35, y: 45, role: "CM" },
      { x: 65, y: 45, role: "CM" },
      { x: 85, y: 45, role: "RM" },
      { x: 35, y: 20, role: "ST" },
      { x: 65, y: 20, role: "ST" },
    ],
  },
  "4-3-3": {
    name: "4-3-3",
    positions: [
      { x: 50, y: 90, role: "GK" },
      { x: 15, y: 70, role: "LB" },
      { x: 35, y: 70, role: "CB" },
      { x: 65, y: 70, role: "CB" },
      { x: 85, y: 70, role: "RB" },
      { x: 30, y: 45, role: "CM" },
      { x: 50, y: 50, role: "CDM" },
      { x: 70, y: 45, role: "CM" },
      { x: 20, y: 20, role: "LW" },
      { x: 50, y: 15, role: "ST" },
      { x: 80, y: 20, role: "RW" },
    ],
  },
  "3-5-2": {
    name: "3-5-2",
    positions: [
      { x: 50, y: 90, role: "GK" },
      { x: 25, y: 70, role: "CB" },
      { x: 50, y: 70, role: "CB" },
      { x: 75, y: 70, role: "CB" },
      { x: 10, y: 45, role: "LWB" },
      { x: 30, y: 50, role: "CM" },
      { x: 50, y: 45, role: "CDM" },
      { x: 70, y: 50, role: "CM" },
      { x: 90, y: 45, role: "RWB" },
      { x: 35, y: 20, role: "ST" },
      { x: 65, y: 20, role: "ST" },
    ],
  },
  "4-2-3-1": {
    name: "4-2-3-1",
    positions: [
      { x: 50, y: 90, role: "GK" },
      { x: 15, y: 70, role: "LB" },
      { x: 35, y: 70, role: "CB" },
      { x: 65, y: 70, role: "CB" },
      { x: 85, y: 70, role: "RB" },
      { x: 35, y: 55, role: "CDM" },
      { x: 65, y: 55, role: "CDM" },
      { x: 20, y: 35, role: "LW" },
      { x: 50, y: 35, role: "CAM" },
      { x: 80, y: 35, role: "RW" },
      { x: 50, y: 15, role: "ST" },
    ],
  },
  "5-3-2": {
    name: "5-3-2",
    positions: [
      { x: 50, y: 90, role: "GK" },
      { x: 10, y: 70, role: "LWB" },
      { x: 30, y: 75, role: "CB" },
      { x: 50, y: 75, role: "CB" },
      { x: 70, y: 75, role: "CB" },
      { x: 90, y: 70, role: "RWB" },
      { x: 30, y: 45, role: "CM" },
      { x: 50, y: 50, role: "CDM" },
      { x: 70, y: 45, role: "CM" },
      { x: 35, y: 20, role: "ST" },
      { x: 65, y: 20, role: "ST" },
    ],
  },
  "4-1-4-1": {
    name: "4-1-4-1",
    positions: [
      { x: 50, y: 90, role: "GK" },
      { x: 15, y: 70, role: "LB" },
      { x: 35, y: 70, role: "CB" },
      { x: 65, y: 70, role: "CB" },
      { x: 85, y: 70, role: "RB" },
      { x: 50, y: 55, role: "CDM" },
      { x: 15, y: 40, role: "LM" },
      { x: 38, y: 40, role: "CM" },
      { x: 62, y: 40, role: "CM" },
      { x: 85, y: 40, role: "RM" },
      { x: 50, y: 15, role: "ST" },
    ],
  },
};

interface PlayerPosition {
  id: number;
  x: number;
  y: number;
  role: string;
  playerName?: string;
  playerId?: number;
}

export default function FormationBuilder() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [positions, setPositions] = useState<PlayerPosition[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("4-4-2");
  const [formationName, setFormationName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>();
  const pitchRef = useRef<HTMLDivElement>(null);

  const teamsQuery = trpc.teams.getAll.useQuery();
  const formationsQuery = trpc.tactics.getFormationTemplates.useQuery();
  const createFormation = trpc.tactics.createFormation.useMutation();
  const isLoading = teamsQuery.isLoading || formationsQuery.isLoading;

  // Initialize with default formation
  useEffect(() => {
    loadTemplate("4-4-2");
  }, []);

  const loadTemplate = (templateName: string) => {
    const template = FORMATION_TEMPLATES[templateName];
    if (template) {
      setSelectedTemplate(templateName);
      setPositions(
        template.positions.map((pos, idx) => ({
          id: idx + 1,
          x: pos.x,
          y: pos.y,
          role: pos.role,
        }))
      );
    }
  };

  const handleMouseDown = (e: React.MouseEvent, positionId: number) => {
    e.preventDefault();
    setSelectedPosition(positionId);
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || selectedPosition === null || !pitchRef.current) return;

    const rect = pitchRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Clamp values between 5 and 95
    const clampedX = Math.max(5, Math.min(95, x));
    const clampedY = Math.max(5, Math.min(95, y));

    setPositions((prev) =>
      prev.map((pos) =>
        pos.id === selectedPosition ? { ...pos, x: clampedX, y: clampedY } : pos
      )
    );
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setSelectedPosition(null);
  };

  const handleSaveFormation = async () => {
    if (!formationName.trim()) {
      toast.warning("Please enter a formation name");
      return;
    }

    try {
      await createFormation.mutateAsync({
        name: formationName,
        templateName: selectedTemplate,
        description: description || undefined,
        positions: JSON.stringify(positions),
        teamId: selectedTeamId,
        isTemplate: false,
      });
      setShowSaveDialog(false);
      setFormationName("");
      setDescription("");
      toast.success("Formation saved successfully!");
    } catch (error) {
      console.error("Failed to save formation:", error);
      toast.error("Failed to save formation");
    }
  };

  const resetFormation = () => {
    loadTemplate(selectedTemplate);
  };

  const updatePlayerRole = (positionId: number, newRole: string) => {
    setPositions((prev) =>
      prev.map((pos) => (pos.id === positionId ? { ...pos, role: newRole } : pos))
    );
  };

  if (isLoading) {
    return (
      <>
      <div className="p-6">
        <PageSkeleton rows={4} cards={3} />
      </div>
      </>
    );
  }

  return (
    <>
    <div >
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/advanced-tactical-hub">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <PageBreadcrumb
                  items={[
                    { label: "Tactical Hub", labelAr: "مركز التكتيك", href: "/advanced-tactical-hub" },
                    { label: "Formation Builder", labelAr: "بناء التشكيلات" },
                  ]}
                  className="mb-1 text-muted-foreground"
                />
                <h1 className="text-2xl font-bold text-foreground">Formation Builder</h1>
                <p className="text-muted-foreground text-sm">Drag players to customize your formation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={resetFormation} className="border-border text-muted-foreground">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <Save className="w-4 h-4 mr-2" />
                    Save Formation
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-card border-border text-foreground">
                  <DialogHeader>
                    <DialogTitle>Save Formation</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Formation Name</label>
                      <Input
                        value={formationName}
                        onChange={(e) => setFormationName(e.target.value)}
                        placeholder="e.g., Match Day Formation"
                        className="bg-muted border-border text-foreground mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Description (optional)</label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Notes about this formation..."
                        className="bg-muted border-border text-foreground mt-1"
                        rows={3}
                      />
                    </div>
                    {teamsQuery.data && teamsQuery.data.length > 0 && (
                      <div>
                        <label className="text-sm text-muted-foreground">Team (optional)</label>
                        <Select
                          value={selectedTeamId?.toString() || ""}
                          onValueChange={(v) => setSelectedTeamId(v ? parseInt(v) : undefined)}
                        >
                          <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                            <SelectValue placeholder="Select a team" />
                          </SelectTrigger>
                          <SelectContent className="bg-muted border-border">
                            {teamsQuery.data.map((team) => (
                              <SelectItem key={team.id} value={team.id.toString()}>
                                {team.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <Button
                      onClick={handleSaveFormation}
                      disabled={createFormation.isPending}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      {createFormation.isPending ? "Saving..." : "Save Formation"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Formation Templates */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Formation Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {Object.keys(FORMATION_TEMPLATES).map((template) => (
                  <Button
                    key={template}
                    variant={selectedTemplate === template ? "default" : "outline"}
                    className={`w-full justify-start ${
                      selectedTemplate === template
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                    onClick={() => loadTemplate(template)}
                  >
                    {template}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Position Legend */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-lg">Position Roles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-xs font-bold text-black">
                      GK
                    </div>
                    <span className="text-muted-foreground">Goalkeeper</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                      CB
                    </div>
                    <span className="text-muted-foreground">Center Back</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-xs font-bold text-white">
                      CM
                    </div>
                    <span className="text-muted-foreground">Midfielder</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold text-white">
                      ST
                    </div>
                    <span className="text-muted-foreground">Striker</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-foreground text-lg">Instructions</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-2">
                <p>• Click and drag players to reposition them</p>
                <p>• Click on a player to edit their role</p>
                <p>• Use templates as starting points</p>
                <p>• Save formations for match preparation</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Pitch Area */}
          <div className="lg:col-span-3">
            <Card className="bg-card border-border overflow-hidden">
              <CardContent className="p-0">
                <div
                  ref={pitchRef}
                  className="brand-gradient relative w-full aspect-[3/4] cursor-crosshair select-none"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Pitch markings */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox="0 0 100 130"
                    preserveAspectRatio="none"
                  >
                    {/* Outer boundary */}
                    <rect
                      x="2"
                      y="2"
                      width="96"
                      height="126"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    {/* Center line */}
                    <line
                      x1="2"
                      y1="65"
                      x2="98"
                      y2="65"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    {/* Center circle */}
                    <circle
                      cx="50"
                      cy="65"
                      r="12"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <circle cx="50" cy="65" r="0.8" fill="rgba(255,255,255,0.5)" />
                    {/* Top penalty area */}
                    <rect
                      x="20"
                      y="2"
                      width="60"
                      height="20"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <rect
                      x="32"
                      y="2"
                      width="36"
                      height="8"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <circle cx="50" cy="15" r="0.8" fill="rgba(255,255,255,0.5)" />
                    {/* Bottom penalty area */}
                    <rect
                      x="20"
                      y="108"
                      width="60"
                      height="20"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <rect
                      x="32"
                      y="120"
                      width="36"
                      height="8"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <circle cx="50" cy="115" r="0.8" fill="rgba(255,255,255,0.5)" />
                    {/* Corner arcs */}
                    <path
                      d="M 2 5 A 3 3 0 0 0 5 2"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <path
                      d="M 95 2 A 3 3 0 0 0 98 5"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <path
                      d="M 2 125 A 3 3 0 0 1 5 128"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                    <path
                      d="M 95 128 A 3 3 0 0 1 98 125"
                      fill="none"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="0.3"
                    />
                  </svg>

                  {/* Player positions */}
                  {positions.map((pos) => {
                    const getPositionColor = (role: string) => {
                      if (role === "GK") return "bg-yellow-500 text-black";
                      if (["CB", "LB", "RB", "LWB", "RWB"].includes(role)) return "bg-blue-500 text-white";
                      if (["CM", "CDM", "CAM", "LM", "RM"].includes(role)) return "bg-green-500 text-white";
                      return "bg-red-500 text-white";
                    };

                    return (
                      <div
                        key={pos.id}
                        className={`absolute w-10 h-10 -ml-5 -mt-5 rounded-full ${getPositionColor(
                          pos.role
                        )} flex items-center justify-center text-xs font-bold cursor-grab active:cursor-grabbing shadow-lg transition-transform hover:scale-110 ${
                          selectedPosition === pos.id ? "ring-2 ring-white ring-offset-2 ring-offset-green-700" : ""
                        }`}
                        style={{
                          left: `${pos.x}%`,
                          top: `${(pos.y / 100) * 76.9}%`, // Adjust for aspect ratio
                        }}
                        onMouseDown={(e) => handleMouseDown(e, pos.id)}
                      >
                        {pos.role}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Current Formation Info */}
            <Card className="bg-card border-border mt-4">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-foreground font-semibold">Current Formation: {selectedTemplate}</h3>
                    <p className="text-muted-foreground text-sm">
                      {positions.length} players positioned
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-border text-muted-foreground">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" className="border-border text-muted-foreground">
                      <Upload className="w-4 h-4 mr-2" />
                      Import
                    </Button>
                  </div>
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
