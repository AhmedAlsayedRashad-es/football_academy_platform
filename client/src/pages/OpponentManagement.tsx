import { useState } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Search, Target, TrendingUp, Users } from "lucide-react";
// import { useToast } from "@/components/ui/use-toast";
import { useLanguage } from '@/contexts/LanguageContext';

export default function OpponentManagement() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  // const { toast } = useToast();
  
  const [newOpponent, setNewOpponent] = useState({
    name: "",
    league: "",
    ageGroup: "",
    coachName: "",
    typicalFormation: "",
    notes: "",
  });

  const opponentsQuery = trpc.opponents.getAll.useQuery();
    const createMutation = trpc.opponents.create.useMutation({
    onSuccess: () => {
      console.log({
        title: "Success",
        description: "Opponent team added successfully",
      });
      setIsDialogOpen(false);
      setNewOpponent({
        name: "",
        league: "",
        ageGroup: "",
        coachName: "",
        typicalFormation: "",
        notes: "",
      });
      opponentsQuery.refetch();
    },
    onError: (error: any) => {
      console.log({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredOpponents = opponentsQuery.data?.filter((opp: any) =>
    opp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    opp.league?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateOpponent = () => {
    if (!newOpponent.name) {
      console.log({
        title: "Error",
        description: "Opponent name is required",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate(newOpponent);
  };

  return (
    <>
      <div className="container mx-auto py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Opposition Analysis</h1>
              <p className="text-muted-foreground">
                Manage opponent teams and generate AI-powered match strategies
              </p>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Opponent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add New Opponent Team</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Team Name *</Label>
                  <Input
                    id="name"
                    value={newOpponent.name}
                    onChange={(e) => setNewOpponent({ ...newOpponent, name: e.target.value })}
                    placeholder="Enter opponent team name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="league">League/Competition</Label>
                    <Input
                      id="league"
                      value={newOpponent.league}
                      onChange={(e) => setNewOpponent({ ...newOpponent, league: e.target.value })}
                      placeholder="e.g., U15 Premier League"
                    />
                  </div>
                  <div>
                    <Label htmlFor="ageGroup">Age Group</Label>
                    <Input
                      id="ageGroup"
                      value={newOpponent.ageGroup}
                      onChange={(e) => setNewOpponent({ ...newOpponent, ageGroup: e.target.value })}
                      placeholder="e.g., U15, U17"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="coachName">Coach Name</Label>
                    <Input
                      id="coachName"
                      value={newOpponent.coachName}
                      onChange={(e) => setNewOpponent({ ...newOpponent, coachName: e.target.value })}
                      placeholder="Opponent coach name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="formation">Typical Formation</Label>
                    <Input
                      id="formation"
                      value={newOpponent.typicalFormation}
                      onChange={(e) => setNewOpponent({ ...newOpponent, typicalFormation: e.target.value })}
                      placeholder="e.g., 4-4-2, 4-3-3"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={newOpponent.notes}
                    onChange={(e) => setNewOpponent({ ...newOpponent, notes: e.target.value })}
                    placeholder="Any additional information about the opponent..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOpponent} disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Adding..." : "Add Opponent"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search opponents by name or league..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Opponents Grid */}
        {opponentsQuery.isLoading ? (
          <div className="text-center py-12">Loading opponents...</div>
        ) : filteredOpponents.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No opponents found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "Try adjusting your search" : "Add your first opponent to start analyzing"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Opponent
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpponents.map((opponent: any) => (
              <Link key={opponent.id} href={`/opponent/${opponent.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      {opponent.name}
                    </CardTitle>
                    <CardDescription>
                      {opponent.league || "No league specified"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {opponent.ageGroup && (
                      <div className="text-sm">
                        <span className="font-medium">Age Group:</span> {opponent.ageGroup}
                      </div>
                    )}
                    {opponent.typicalFormation && (
                      <div className="text-sm">
                        <span className="font-medium">Formation:</span> {opponent.typicalFormation}
                      </div>
                    )}
                    {opponent.coachName && (
                      <div className="text-sm">
                        <span className="font-medium">Coach:</span> {opponent.coachName}
                      </div>
                    )}
                    <div className="pt-4 flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        Analyze
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
