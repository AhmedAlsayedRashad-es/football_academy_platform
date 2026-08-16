import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  FileText, Download, Trash2, Plus, Search, Filter, Users, 
  ArrowLeft, Upload, Eye, Calendar, User
} from 'lucide-react';
import { useAuth } from "@/_core/hooks/useAuth";
import { DashboardLayoutSkeleton } from "@/components/DashboardLayoutSkeleton";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';

interface PlayerAttachment {
  id: number;
  playerId: number;
  playerName: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
  description?: string;
}

export default function PlayerAttachments() {
  const [, navigate] = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDescription, setUploadDescription] = useState("");

  const { data: teams = [], isLoading: teamsLoading } = trpc.teams.getAll.useQuery();
  const { data: players = [], isLoading: playersLoading } = trpc.players.getByTeam.useQuery(
    { teamId: selectedTeamId || 0 },
    { enabled: !!selectedTeamId }
  );
  const { data: attachments = [], isLoading: attachmentsLoading, refetch: refetchAttachments } = trpc.playerAttachments.getByPlayer.useQuery(
    { playerId: selectedPlayerId || 0 },
    { enabled: !!selectedPlayerId }
  );

  const uploadFileMutation = trpc.upload.uploadFile.useMutation();

  const uploadAttachment = trpc.playerAttachments.upload.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Attachment uploaded successfully" });
      refetchAttachments();
      setShowUploadDialog(false);
      setUploadFile(null);
      setUploadDescription("");
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteAttachment = trpc.playerAttachments.delete.useMutation({
    onSuccess: () => {
      toast({ title: "Success", description: "Attachment deleted" });
      refetchAttachments();
    },
    onError: (err) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (authLoading) return <DashboardLayoutSkeleton />;
  if (!user) return null;

  const filteredPlayers = players.filter(p => 
    !search || `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  );

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const selectedPlayer = players.find(p => p.id === selectedPlayerId);

  const handleUpload = () => {
    if (!uploadFile || !selectedPlayerId) {
      toast({ title: "Error", description: "Please select a file and player", variant: "destructive" });
      return;
    }
    const file = uploadFile;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      try {
        const uploaded = await uploadFileMutation.mutateAsync({
          fileData: base64Data,
          fileName: file.name,
          contentType: file.type,
        });
        uploadAttachment.mutate({
          playerId: selectedPlayerId,
          fileName: file.name,
          fileUrl: uploaded.url,
          fileType: file.type,
          description: uploadDescription,
        });
      } catch (err: any) {
        toast({ title: "Error", description: err.message || "Failed to upload file", variant: "destructive" });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <BackButton />
            <h1 className="text-2xl font-bold text-foreground">Player Attachments</h1>
            <p className="text-muted-foreground text-sm">Manage player documents and files by team</p>
          </div>
          <Button
            className="bg-red-700 hover:bg-red-600 text-white"
            onClick={() => setShowUploadDialog(true)}
            disabled={!selectedPlayerId}
          >
            <Plus className="w-4 h-4 mr-2" /> Upload Document
          </Button>
        </div>

        {/* Team Selection */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground flex items-center gap-2">
              <Users className="w-5 h-5" /> Select Team
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {teamsLoading ? (
                <div className="text-muted-foreground">Loading teams...</div>
              ) : (
                teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setSelectedPlayerId(null);
                    }}
                    className={`p-3 rounded-lg border transition-colors text-left ${
                      selectedTeamId === team.id
                        ? "border-red-500 bg-red-900/30 text-white"
                        : "border-border bg-muted hover:border-gray-500 text-muted-foreground"
                    }`}
                  >
                    <div className="font-semibold text-sm">{team.name}</div>
                    <div className="text-xs text-muted-foreground">{team.ageGroup}</div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Player Selection */}
        {selectedTeamId && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <User className="w-5 h-5" /> Select Player
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search players..."
                  className="pl-9 bg-muted border-border text-foreground"
                />
              </div>

              {playersLoading ? (
                <div className="text-muted-foreground">Loading players...</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  {filteredPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayerId(player.id)}
                      className={`p-3 rounded-lg border transition-colors text-left ${
                        selectedPlayerId === player.id
                          ? "border-red-500 bg-red-900/30"
                          : "border-border bg-muted hover:border-gray-500"
                      }`}
                    >
                      <div className="font-semibold text-foreground">
                        {player.firstName} {player.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {player.position} • {player.ageGroup}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Attachments List */}
        {selectedPlayerId && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5" /> 
                {selectedPlayer ? `${selectedPlayer.firstName} ${selectedPlayer.lastName}'s Documents` : 'Documents'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attachmentsLoading ? (
                <div className="text-muted-foreground">Loading attachments...</div>
              ) : attachments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-muted-foreground">No documents uploaded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{attachment.fileName}</div>
                          {attachment.description && (
                            <div className="text-xs text-muted-foreground truncate">{attachment.description}</div>
                          )}
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(attachment.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300"
                          onClick={() => window.open(attachment.fileUrl, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300"
                          onClick={() => deleteAttachment.mutate({ id: attachment.id })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upload Dialog */}
        {showUploadDialog && (
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Upload Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-muted-foreground text-sm">Select File</label>
                  <input
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="w-full mt-1 px-3 py-2 bg-muted border border-border text-foreground rounded-md"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground text-sm">Description (Optional)</label>
                  <Input
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="e.g., Medical Certificate, Birth Certificate..."
                    className="bg-muted border-border text-foreground mt-1"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setShowUploadDialog(false)}>Cancel</Button>
                  <Button
                    className="bg-red-700 hover:bg-red-600 text-white"
                    onClick={handleUpload}
                    disabled={!uploadFile}
                  >
                    <Upload className="w-4 h-4 mr-2" /> Upload
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </>
  );
}
