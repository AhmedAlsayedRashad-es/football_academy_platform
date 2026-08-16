import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { Video, Target, TrendingUp, Film, ArrowRight, Play } from "lucide-react";
import { useLocation } from "wouter";

export function AdvancedFeaturesWidgets() {
  const [, setLocation] = useLocation();

  // Mock data for now - these would be real tRPC queries in production
  const recentVideoAnalyses = [
    { id: 1, title: "Match vs Elite Academy", date: "2 hours ago", thumbnail: null },
    { id: 2, title: "Training Session - Passing Drills", date: "5 hours ago", thumbnail: null },
    { id: 3, title: "U16 Match Highlights", date: "Yesterday", thumbnail: null },
  ];

  const tacticalScenarios = {
    total: 12,
    recent: [
      { id: 1, name: "4-3-3 Counter Attack", created: "Today" },
      { id: 2, name: "High Pressing Setup", created: "Yesterday" },
    ]
  };

  const xgStats = {
    lastMatch: {
      opponent: "Elite Academy",
      ourXg: 2.3,
      theirXg: 1.1,
      ourGoals: 3,
      theirGoals: 1,
      result: "win"
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Recent Video Analyses Widget */}
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Video className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Video Analysis</CardTitle>
                <CardDescription className="text-xs">Recent analyses</CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/videos')}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {recentVideoAnalyses.map((video) => (
            <div 
              key={video.id}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => setLocation('/videos')}
            >
              <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                <Play className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{video.title}</p>
                <p className="text-xs text-muted-foreground">{video.date}</p>
              </div>
            </div>
          ))}
          <Button 
            variant="outline" 
            className="w-full mt-2"
            onClick={() => setLocation('/videos')}
          >
            View All Analyses
          </Button>
        </CardContent>
      </Card>

      {/* Tactical Scenarios Widget */}
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-chart-2/10">
                <Target className="h-4 w-4 text-chart-2" />
              </div>
              <div>
                <CardTitle className="text-base">Tactical Lab</CardTitle>
                <CardDescription className="text-xs">Scenarios created</CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/tactical-simulation-lab')}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-4">
            <div className="text-4xl font-bold text-chart-2">{tacticalScenarios.total}</div>
            <p className="text-sm text-muted-foreground mt-1">Total scenarios</p>
          </div>
          
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Recently Created</p>
            {tacticalScenarios.recent.map((scenario) => (
              <div 
                key={scenario.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <span className="text-sm truncate">{scenario.name}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">{scenario.created}</span>
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setLocation('/tactical-simulation-lab')}
          >
            Open Tactical Lab
          </Button>
        </CardContent>
      </Card>

      {/* xG Statistics Widget */}
      <Card className="card-hover">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/10">
                <TrendingUp className="h-4 w-4 text-accent" />
              </div>
              <div>
                <CardTitle className="text-base">xG Analytics</CardTitle>
                <CardDescription className="text-xs">Latest match stats</CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/xg-analytics')}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">vs {xgStats.lastMatch.opponent}</span>
              <span className={`font-semibold ${
                xgStats.lastMatch.result === 'win' ? 'text-primary' : 
                xgStats.lastMatch.result === 'loss' ? 'text-destructive' : 
                'text-muted-foreground'
              }`}>
                {xgStats.lastMatch.ourGoals} - {xgStats.lastMatch.theirGoals}
              </span>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Expected Goals (xG)</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{xgStats.lastMatch.ourXg}</div>
                  <div className="text-xs text-muted-foreground">Our xG</div>
                </div>
                <div className="text-muted-foreground">vs</div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-muted-foreground">{xgStats.lastMatch.theirXg}</div>
                  <div className="text-xs text-muted-foreground">Their xG</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs text-primary font-medium">
                Outperformed xG by {(xgStats.lastMatch.ourGoals - xgStats.lastMatch.ourXg).toFixed(1)} goals
              </p>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setLocation('/xg-analytics')}
          >
            View Full Analytics
          </Button>
        </CardContent>
      </Card>

      {/* Video Clip Library Widget */}
      <Card className="card-hover lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-chart-3/10">
                <Film className="h-4 w-4 text-chart-3" />
              </div>
              <div>
                <CardTitle className="text-base">Video Clip Library</CardTitle>
                <CardDescription className="text-xs">Tagged highlights and key moments</CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setLocation('/video-clip-library')}
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['Goals', 'Assists', 'Key Passes', 'Defensive Actions'].map((tag, i) => (
              <div 
                key={tag}
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors text-center"
                onClick={() => setLocation('/video-clip-library')}
              >
                <div className="text-2xl font-bold">{[15, 8, 23, 31][i]}</div>
                <div className="text-xs text-muted-foreground mt-1">{tag}</div>
              </div>
            ))}
          </div>
          <Button 
            variant="outline" 
            className="w-full mt-4"
            onClick={() => setLocation('/video-clip-library')}
          >
            Browse Clip Library
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
