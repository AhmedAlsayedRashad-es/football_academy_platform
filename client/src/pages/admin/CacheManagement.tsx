import { useState } from "react";
import { useLocation } from 'wouter';
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  TrendingUp, 
  Clock, 
  Zap,
  BarChart3,
  AlertCircle, ArrowLeft} from 'lucide-react';
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';
import { BackButton } from '@/components/BackButton';


export default function CacheManagement() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [refreshKey, setRefreshKey] = useState(0);

  // Get cache statistics
  const { data: stats, isLoading, refetch } = trpc.cache.getStats.useQuery(undefined, {
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Clear all cache mutation
  const clearAllMutation = trpc.cache.clearAll.useMutation({
    onSuccess: () => {
      toast.success("All cache cleared successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to clear cache: ${error.message}`);
    },
  });

  // Clear function cache mutation
  const clearFunctionMutation = trpc.cache.clearFunction.useMutation({
    onSuccess: (_, variables) => {
      toast.success(`Cleared cache for ${variables.functionName}`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to clear function cache: ${error.message}`);
    },
  });

  // Clean expired cache mutation
  const cleanExpiredMutation = trpc.cache.cleanExpired.useMutation({
    onSuccess: (data) => {
      toast.success(`Cleaned ${data.count} expired cache entries`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to clean expired cache: ${error.message}`);
    },
  });

  // Run warmup mutation
  const runWarmupMutation = trpc.cache.runWarmup.useMutation({
    onSuccess: (data) => {
      toast.success(`Cache warmup complete: ${data.totalSuccess} entries created in ${(data.duration / 1000).toFixed(1)}s`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to run cache warmup: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
      </>
    );
  }

  const totalHitRate = stats?.totalEntries 
    ? ((stats.totalHits / stats.totalEntries) * 100).toFixed(1)
    : "0.0";

  return (
    <>
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          
              <BackButton />
<h1 className="text-3xl font-bold tracking-tight">AI Cache Management</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage AI response caching system
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => cleanExpiredMutation.mutate()}
            disabled={cleanExpiredMutation.isPending}
          >
            <Clock className="w-4 h-4 mr-2" />
            Clean Expired
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              if (confirm("Run cache warmup? This will pre-populate frequently-requested analyses and may take several minutes.")) {
                runWarmupMutation.mutate();
              }
            }}
            disabled={runWarmupMutation.isPending}
          >
            <Zap className="w-4 h-4 mr-2" />
            {runWarmupMutation.isPending ? "Running..." : "Run Warmup"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to clear ALL cache? This cannot be undone.")) {
                clearAllMutation.mutate();
              }
            }}
            disabled={clearAllMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEntries || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cached responses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hits</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalHits || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cache hits served
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHitRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Cache effectiveness
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Functions Cached</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.byFunction ? Object.keys(stats.byFunction).length : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Unique AI functions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="by-function">By Function</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance</CardTitle>
              <CardDescription>
                Real-time statistics and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {stats?.totalEntries === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Cache Entries</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    The cache is currently empty. Cache entries will appear here as AI functions are called.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Average Hits Per Entry</p>
                      <p className="text-2xl font-bold">
                        {stats?.totalEntries 
                          ? (stats.totalHits / stats.totalEntries).toFixed(2)
                          : "0.00"}
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="text-sm font-medium">Cache Efficiency</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {stats?.totalHits || 0} API calls saved
                      </p>
                    </div>
                    <Badge variant="default" className="text-lg px-4 py-2">
                      {totalHitRate}%
                    </Badge>
                  </div>

                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-semibold mb-2">Performance Impact</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-green-700 dark:text-green-500" />
                        <span>Reduced AI API calls by {stats?.totalHits || 0}</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>Estimated time saved: {((stats?.totalHits || 0) * 2).toFixed(0)}s</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                        <span>Cost savings: ~${((stats?.totalHits || 0) * 0.002).toFixed(2)}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Function Tab */}
        <TabsContent value="by-function" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache by Function</CardTitle>
              <CardDescription>
                Breakdown of cache usage per AI function
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!stats?.byFunction || Object.keys(stats.byFunction).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Database className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Function Data</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    No AI functions have been cached yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(stats.byFunction).map(([functionName, data]) => {
                    const hitRate = data.count > 0 
                      ? ((data.hits / data.count) * 100).toFixed(1)
                      : "0.0";
                    
                    return (
                      <div
                        key={functionName}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold">{functionName}</h4>
                            <Badge variant="secondary">{data.count} entries</Badge>
                            <Badge variant="outline">{data.hits} hits</Badge>
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Hit Rate: {hitRate}%</span>
                            <span>•</span>
                            <span>Avg Hits: {(data.hits / data.count).toFixed(2)}</span>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Clear all cache for ${functionName}?`)) {
                              clearFunctionMutation.mutate({ functionName });
                            }
                          }}
                          disabled={clearFunctionMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Settings</CardTitle>
              <CardDescription>
                Configure cache behavior and TTL (Time To Live)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-semibold">Cache TTL Configuration</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Player Analysis</p>
                    <p className="text-muted-foreground">1 hour</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Training Plans</p>
                    <p className="text-muted-foreground">24 hours</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Match Strategy</p>
                    <p className="text-muted-foreground">6 hours</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Opponent Analysis</p>
                    <p className="text-muted-foreground">48 hours</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Parent Reports</p>
                    <p className="text-muted-foreground">12 hours</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Injury Prediction</p>
                    <p className="text-muted-foreground">2 hours</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Nutrition Plans</p>
                    <p className="text-muted-foreground">24 hours</p>
                  </div>
                  <div className="p-3 border rounded-lg">
                    <p className="font-medium">Video Analysis</p>
                    <p className="text-muted-foreground">12 hours</p>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-semibold mb-2">Cache Behavior</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Cache entries automatically expire after their TTL period</li>
                  <li>• Expired entries are cleaned up automatically</li>
                  <li>• Cache keys are generated from function parameters</li>
                  <li>• Hit count tracks how many times each entry is reused</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}
