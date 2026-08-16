import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Save, FolderOpen, Trash2, Edit2, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SessionManagerProps {
  events: any[];
  onLoadSession: (events: any[]) => void;
  homeTeam?: string;
  awayTeam?: string;
  matchDate?: Date;
}

export function SessionManager({ events, onLoadSession, homeTeam, awayTeam, matchDate }: SessionManagerProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [loadDialogOpen, setLoadDialogOpen] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);

  const utils = trpc.useUtils();

  // Queries
  const { data: sessions = [], isLoading } = trpc.matchEventSessions.list.useQuery();

  // Mutations
  const saveMutation = trpc.matchEventSessions.save.useMutation({
    onSuccess: (data) => {
      setCurrentSessionId(data.sessionId);
      utils.matchEventSessions.list.invalidate();
      toast.success(`Session "${sessionName}" has been saved successfully.`);
      setSaveDialogOpen(false);
      setSessionName('');
    },
    onError: (error) => {
      toast.error(`Save failed: ${error.message}`);
    },
  });

  const updateMutation = trpc.matchEventSessions.update.useMutation({
    onSuccess: () => {
      utils.matchEventSessions.list.invalidate();
      toast.success("Your changes have been auto-saved.");
    },
  });

  const deleteMutation = trpc.matchEventSessions.delete.useMutation({
    onSuccess: () => {
      utils.matchEventSessions.list.invalidate();
      toast.success("Session has been removed.");
    },
  });

  const renameMutation = trpc.matchEventSessions.rename.useMutation({
    onSuccess: () => {
      utils.matchEventSessions.list.invalidate();
      toast.success("Session name has been updated.");
    },
  });

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !currentSessionId || events.length === 0) return;

    const autoSaveTimer = setTimeout(() => {
      updateMutation.mutate({
        sessionId: currentSessionId,
        events,
      });
    }, 30000); // Auto-save every 30 seconds

    return () => clearTimeout(autoSaveTimer);
  }, [events, currentSessionId, autoSaveEnabled]);

  const handleSave = () => {
    if (!sessionName.trim()) {
      toast.error("Please enter a session name.");
      return;
    }

    saveMutation.mutate({
      sessionName,
      events,
      homeTeam,
      awayTeam,
      matchDate,
      metadata: {
        eventCount: events.length,
        savedAt: new Date().toISOString(),
      },
    });
  };

  const handleLoad = (session: any) => {
    onLoadSession(session.events);
    setCurrentSessionId(session.id);
    setLoadDialogOpen(false);
    toast.success(`Loaded "${session.sessionName}" with ${session.events.length} events.`);
  };

  const handleDelete = (sessionId: number, sessionName: string) => {
    if (confirm(`Are you sure you want to delete "${sessionName}"?`)) {
      deleteMutation.mutate({ sessionId });
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
    }
  };

  const handleRename = (sessionId: number) => {
    const newName = prompt("Enter new session name:");
    if (newName && newName.trim()) {
      renameMutation.mutate({ sessionId, newName: newName.trim() });
    }
  };

  return (
    <div className="flex gap-2">
      {/* Save Button */}
      <Button
        onClick={() => setSaveDialogOpen(true)}
        variant="outline"
        size="sm"
        disabled={events.length === 0}
        className="gap-2"
      >
        <Save className="h-4 w-4" />
        Save Session
      </Button>

      {/* Load Button */}
      <Button
        onClick={() => setLoadDialogOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <FolderOpen className="h-4 w-4" />
        Load Session
      </Button>

      {/* Auto-save indicator */}
      {currentSessionId && autoSaveEnabled && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          Auto-saving...
        </div>
      )}

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Match Event Session</DialogTitle>
            <DialogDescription>
              Save your current match event recording to resume later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="session-name">Session Name</Label>
              <Input
                id="session-name"
                placeholder="e.g., Arsenal vs Chelsea - First Half"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {events.length} events will be saved
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Load Dialog */}
      <Dialog open={loadDialogOpen} onOpenChange={setLoadDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Load Match Event Session</DialogTitle>
            <DialogDescription>
              Select a saved session to resume your match event recording.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No saved sessions found. Start recording and save your first session!
              </div>
            ) : (
              sessions.map((session: any) => (
                <Card key={session.id} className="hover:bg-accent/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{session.sessionName}</h4>
                        <div className="text-sm text-muted-foreground mt-1 space-y-1">
                          {session.homeTeam && session.awayTeam && (
                            <div>{session.homeTeam} vs {session.awayTeam}</div>
                          )}
                          <div>{session.events.length} events recorded</div>
                          <div>
                            Last updated: {format(new Date(session.updatedAt), 'PPp')}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRename(session.id)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(session.id, session.sessionName)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleLoad(session)}
                        >
                          Load
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoadDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
