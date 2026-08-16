import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, BookOpen, Plus, CheckCircle, Clock, User, Play, Dumbbell, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-blue-500/10 text-blue-700",
  in_progress: "bg-yellow-500/10 text-yellow-700",
  completed: "bg-green-500/10 text-green-700",
  skipped: "bg-gray-500/10 text-gray-700",
};

export default function DrillAssignmentSystem() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [showAssign, setShowAssign] = useState(false);
  const [filterPlayerId, setFilterPlayerId] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [assignPlayerId, setAssignPlayerId] = useState("");
  const [assignDrillId, setAssignDrillId] = useState("");
  const [assignDueDate, setAssignDueDate] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  const { data: assignments, refetch } = trpc.drillAssignments.getAll.useQuery();
  const { data: players } = trpc.players.getAll.useQuery();
  const { data: drills } = trpc.drillLibrary.getAll.useQuery({});

  const createAssignment = trpc.drillAssignments.assign.useMutation({
    onSuccess: () => {
      refetch();
      setShowAssign(false);
      setAssignPlayerId(""); setAssignDrillId(""); setAssignDueDate(""); setAssignNotes("");
      toast({ title: "Drill assigned successfully" });
    },
  });

  const updateStatus = trpc.drillAssignments.updateStatus.useMutation({
    onSuccess: () => { refetch(); toast({ title: "Status updated" }); },
  });

  const filteredAssignments = assignments?.filter((a: any) => {
    if (filterPlayerId !== "all" && a.playerId.toString() !== filterPlayerId) return false;
    if (filterStatus !== "all" && a.status !== filterStatus) return false;
    return true;
  }) || [];

  const getPlayer = (id: number) => players?.find((p: any) => p.id === id);
  const getDrill = (id: number) => drills?.find((d: any) => d.id === id);

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <BackButton />
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              Drill Assignment System
            </h1>
            <p className="text-muted-foreground">Assign drills from the library to players as homework with tracking</p>
          </div>
          <Dialog open={showAssign} onOpenChange={setShowAssign}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" />Assign Drill</Button>
            </DialogTrigger>
            <DialogContent className="bg-card text-foreground border-border">
              <DialogHeader><DialogTitle>Assign Drill to Player</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Player</Label>
                  <Select value={assignPlayerId} onValueChange={setAssignPlayerId}>
                    <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                      <SelectValue placeholder="Select player..." />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      {players?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id.toString()} className="text-foreground">
                          {p.firstName} {p.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Drill</Label>
                  <Select value={assignDrillId} onValueChange={setAssignDrillId}>
                    <SelectTrigger className="bg-muted border-border text-foreground mt-1">
                      <SelectValue placeholder="Select drill..." />
                    </SelectTrigger>
                    <SelectContent className="bg-muted border-border">
                      {drills?.map((d: any) => (
                        <SelectItem key={d.id} value={d.id.toString()} className="text-foreground">
                          {d.title} ({d.skillArea})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date (optional)</Label>
                  <Input type="date" value={assignDueDate} onChange={e => setAssignDueDate(e.target.value)}
                    className="bg-muted border-border text-foreground mt-1" />
                </div>
                <div>
                  <Label>Coach Notes</Label>
                  <Textarea value={assignNotes} onChange={e => setAssignNotes(e.target.value)}
                    placeholder="Instructions, focus areas, repetitions..."
                    className="bg-muted border-border text-foreground mt-1" rows={3} />
                </div>
                <Button onClick={() => createAssignment.mutate({
                  playerId: parseInt(assignPlayerId),
                  drillId: assignDrillId,
                  drillName: drills?.find((d: any) => d.id.toString() === assignDrillId)?.title || "Drill",
                  dueDate: assignDueDate || undefined,
                  reason: assignNotes || undefined,
                })} disabled={!assignPlayerId || !assignDrillId || createAssignment.isPending} className="w-full">
                  {createAssignment.isPending ? "Assigning..." : "Assign Drill"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          {["pending", "in_progress", "completed", "skipped"].map(status => {
            const count = assignments?.filter((a: any) => a.status === status).length || 0;
            /* Keys must match the drill_assignments.status enum; "assigned" was a
               stale name, so icons["pending"] came back undefined and rendering
               <undefined /> tore the whole page down through the error boundary. */
            const icons: Record<string, any> = { pending: Clock, in_progress: Play, completed: CheckCircle, skipped: User };
            const Icon = icons[status] ?? Clock;
            return (
              <Card key={status}>
                <CardContent className="p-6 text-center">
                  <div className="text-3xl font-bold">{count}</div>
                  <div className="text-sm text-muted-foreground mt-1 capitalize">{status.replace("_", " ")}</div>
                  <Icon className="w-5 h-5 mx-auto mt-2 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Filter by Player:</Label>
                <Select value={filterPlayerId} onValueChange={setFilterPlayerId}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Players</SelectItem>
                    {players?.map((p: any) => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.firstName} {p.lastName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm whitespace-nowrap">Status:</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assignments List */}
        <div className="space-y-3">
          {filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center text-muted-foreground">
                <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No drill assignments yet</p>
                <p className="text-sm mt-1">Click "Assign Drill" to give players homework from the drill library</p>
              </CardContent>
            </Card>
          ) : filteredAssignments.map((assignment: any) => {
            const player = getPlayer(assignment.playerId);
            const drill = getDrill(assignment.drillId);
            return (
              <Card key={assignment.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Dumbbell className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{drill?.title || "Unknown Drill"}</span>
                          <Badge variant="outline" className={"text-xs " + (STATUS_COLORS[assignment.status] || "")}>
                            {assignment.status.replace("_", " ")}
                          </Badge>
                          {drill?.skillArea && (
                            <Badge variant="outline" className="text-xs bg-purple-500/10 text-purple-700">
                              {drill.skillArea}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                          {player && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />{player.firstName} {player.lastName}
                            </span>
                          )}
                          {assignment.dueDate && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {assignment.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{assignment.notes}"</p>
                        )}
                        {assignment.playerFeedback && (
                          <div className="mt-2 p-2 rounded bg-green-500/5 border border-green-500/20">
                            <p className="text-xs text-green-700">
                              <Star className="w-3 h-3 inline mr-1" />Player feedback: {assignment.playerFeedback}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {assignment.status !== "completed" && (
                        <Button size="sm" variant="outline" className="text-xs h-7"
                          onClick={() => updateStatus.mutate({ id: assignment.id, status: "completed" })}>
                          <CheckCircle className="w-3 h-3 mr-1" />Done
                        </Button>
                      )}
                      {assignment.status === "assigned" && (
                        <Button size="sm" variant="outline" className="text-xs h-7"
                          onClick={() => updateStatus.mutate({ id: assignment.id, status: "in_progress" })}>
                          <Play className="w-3 h-3 mr-1" />Start
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </>
  );
}
