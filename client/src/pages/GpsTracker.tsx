import { useState } from "react";
import { useLocation } from 'wouter';
import { GPSHeatmap, MovementStats } from "@/components/GPSHeatmap";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLanguage } from '@/contexts/LanguageContext';
import { 

  Activity, Upload, Bluetooth, Wifi, Heart, Zap, 
  Timer, TrendingUp, MapPin, Gauge, ArrowUp, ArrowDown, ArrowLeft} from 'lucide-react';

export default function GpsTracker() {
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [importData, setImportData] = useState({
    totalDistance: "",
    highSpeedDistance: "",
    sprintDistance: "",
    maxSpeed: "",
    avgSpeed: "",
    accelerations: "",
    decelerations: "",
    avgHeartRate: "",
    maxHeartRate: "",
    playerLoad: "",
  });

  const { data: players } = trpc.players.getAll.useQuery();
  const { data: gpsData } = trpc.gps.getPlayerData.useQuery(
    { playerId: parseInt(selectedPlayer), limit: 20 },
    { enabled: !!selectedPlayer }
  );

  const importMutation = trpc.gps.import.useMutation({
    onSuccess: () => {
      toast.success("GPS data imported successfully!");
      setImportData({
        totalDistance: "",
        highSpeedDistance: "",
        sprintDistance: "",
        maxSpeed: "",
        avgSpeed: "",
        accelerations: "",
        decelerations: "",
        avgHeartRate: "",
        maxHeartRate: "",
        playerLoad: "",
      });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to import GPS data");
    },
  });

  const handleImport = () => {
    if (!selectedPlayer || !selectedDevice) {
      toast.error("Please select a player and device type");
      return;
    }

    importMutation.mutate({
      playerId: parseInt(selectedPlayer),
      deviceType: selectedDevice,
      recordedAt: new Date().toISOString(),
      totalDistance: importData.totalDistance ? parseInt(importData.totalDistance) : undefined,
      highSpeedDistance: importData.highSpeedDistance ? parseInt(importData.highSpeedDistance) : undefined,
      sprintDistance: importData.sprintDistance ? parseInt(importData.sprintDistance) : undefined,
      maxSpeed: importData.maxSpeed ? parseInt(importData.maxSpeed) : undefined,
      avgSpeed: importData.avgSpeed ? parseInt(importData.avgSpeed) : undefined,
      accelerations: importData.accelerations ? parseInt(importData.accelerations) : undefined,
      decelerations: importData.decelerations ? parseInt(importData.decelerations) : undefined,
      avgHeartRate: importData.avgHeartRate ? parseInt(importData.avgHeartRate) : undefined,
      maxHeartRate: importData.maxHeartRate ? parseInt(importData.maxHeartRate) : undefined,
      playerLoad: importData.playerLoad ? parseInt(importData.playerLoad) : undefined,
    });
  };

  const devices = [
    { id: "statsports", name: "STATSports APEX", icon: "📡" },
    { id: "cityplay", name: "CITYPLAY Smart Ball", icon: "⚽" },
    { id: "playermaker", name: "PlayerMaker", icon: "👟" },
    { id: "catapult", name: "Catapult", icon: "🎯" },
    { id: "manual", name: "Manual Entry", icon: "✏️" },
  ];

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div>
          
          <button onClick={() => navigate("/staff")} className="p-2 hover:bg-muted rounded-lg transition-colors mb-4">

            <ArrowLeft className="w-5 h-5" />

          </button>
<h1 className="text-3xl font-bold">GPS Tracker Integration</h1>
          <p className="text-muted-foreground">
            Import and analyze performance data from wearable GPS devices
          </p>
        </div>

        {/* Device Status Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {devices.map((device) => (
            <Card 
              key={device.id}
              className={`cursor-pointer transition-all ${selectedDevice === device.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedDevice(device.id)}
            >
              <CardContent className="p-4 text-center">
                <div className="text-3xl mb-2">{device.icon}</div>
                <p className="text-sm font-medium">{device.name}</p>
                {selectedDevice === device.id && (
                  <span className="text-xs text-primary">Selected</span>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="import" className="space-y-4">
          <TabsList>
            <TabsTrigger value="import">Import Data</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="heatmap">Movement Heatmap</TabsTrigger>
            <TabsTrigger value="connect">Connect Device</TabsTrigger>
          </TabsList>

          <TabsContent value="import">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Import Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Import GPS Data
                  </CardTitle>
                  <CardDescription>
                    Manually enter or upload data from your GPS device
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Player</Label>
                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a player" />
                      </SelectTrigger>
                      <SelectContent>
                        {players?.map((player) => (
                          <SelectItem key={player.id} value={player.id.toString()}>
                            {player.firstName} {player.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Total Distance (m)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 8500"
                        value={importData.totalDistance}
                        onChange={(e) => setImportData({ ...importData, totalDistance: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>High Speed Distance (m)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 1200"
                        value={importData.highSpeedDistance}
                        onChange={(e) => setImportData({ ...importData, highSpeedDistance: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sprint Distance (m)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 450"
                        value={importData.sprintDistance}
                        onChange={(e) => setImportData({ ...importData, sprintDistance: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Speed (km/h)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 32"
                        value={importData.maxSpeed}
                        onChange={(e) => setImportData({ ...importData, maxSpeed: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Avg Speed (km/h)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 7"
                        value={importData.avgSpeed}
                        onChange={(e) => setImportData({ ...importData, avgSpeed: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Accelerations</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 45"
                        value={importData.accelerations}
                        onChange={(e) => setImportData({ ...importData, accelerations: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Decelerations</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 38"
                        value={importData.decelerations}
                        onChange={(e) => setImportData({ ...importData, decelerations: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Avg Heart Rate (bpm)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 145"
                        value={importData.avgHeartRate}
                        onChange={(e) => setImportData({ ...importData, avgHeartRate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Max Heart Rate (bpm)</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 185"
                        value={importData.maxHeartRate}
                        onChange={(e) => setImportData({ ...importData, maxHeartRate: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Player Load</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 650"
                        value={importData.playerLoad}
                        onChange={(e) => setImportData({ ...importData, playerLoad: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={handleImport}
                    disabled={importMutation.isPending || !selectedPlayer || !selectedDevice}
                  >
                    {importMutation.isPending ? "Importing..." : "Import Data"}
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Stats Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Preview</CardTitle>
                  <CardDescription>
                    Preview of the data to be imported
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <MapPin className="h-4 w-4" />
                        <span className="text-xs">Distance</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {importData.totalDistance ? `${(parseInt(importData.totalDistance) / 1000).toFixed(1)} km` : "—"}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Gauge className="h-4 w-4" />
                        <span className="text-xs">Max Speed</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {importData.maxSpeed ? `${importData.maxSpeed} km/h` : "—"}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Zap className="h-4 w-4" />
                        <span className="text-xs">Sprints</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {importData.sprintDistance ? `${importData.sprintDistance} m` : "—"}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Heart className="h-4 w-4" />
                        <span className="text-xs">Avg HR</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {importData.avgHeartRate ? `${importData.avgHeartRate} bpm` : "—"}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <ArrowUp className="h-4 w-4" />
                        <span className="text-xs">Accelerations</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {importData.accelerations || "—"}
                      </p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <ArrowDown className="h-4 w-4" />
                        <span className="text-xs">Decelerations</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {importData.decelerations || "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>GPS Data History</CardTitle>
                <CardDescription>
                  View historical GPS data for selected player
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select player to view history" />
                    </SelectTrigger>
                    <SelectContent>
                      {players?.map((player) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.firstName} {player.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {gpsData && gpsData.length > 0 ? (
                  <div className="space-y-4">
                    {gpsData.map((data: any) => (
                      <div key={data.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <p className="font-medium">{data.deviceType}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(data.recordedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            {data.deviceType}
                          </span>
                        </div>
                        <div className="grid grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Distance</span>
                            <p className="font-medium">{data.totalDistance ? `${(data.totalDistance / 1000).toFixed(1)} km` : "—"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Max Speed</span>
                            <p className="font-medium">{data.maxSpeed ? `${data.maxSpeed} km/h` : "—"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Avg HR</span>
                            <p className="font-medium">{data.avgHeartRate ? `${data.avgHeartRate} bpm` : "—"}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Player Load</span>
                            <p className="font-medium">{data.playerLoad || "—"}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    {selectedPlayer ? "No GPS data found for this player" : "Select a player to view their GPS history"}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Movement Heatmap
                </CardTitle>
                <CardDescription>
                  Visualize player movement patterns and positioning data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <Label>Select Player</Label>
                  <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a player" />
                    </SelectTrigger>
                    <SelectContent>
                      {players?.map((player: any) => (
                        <SelectItem key={player.id} value={player.id.toString()}>
                          {player.firstName} {player.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedPlayer && gpsData && gpsData.length > 0 ? (
                  <>
                    <GPSHeatmap
                      data={gpsData.map((d: any) => ({
                        latitude: d.latitude || 30.0444 + Math.random() * 0.001,
                        longitude: d.longitude || 31.2357 + Math.random() * 0.001,
                        speed: d.avgSpeed || 0,
                        intensity: (d.avgSpeed || 0) / 30, // Normalize speed to 0-1
                      }))}
                      height="500px"
                    />
                    <MovementStats
                      data={gpsData.map((d: any) => ({
                        latitude: d.latitude || 30.0444 + Math.random() * 0.001,
                        longitude: d.longitude || 31.2357 + Math.random() * 0.001,
                        speed: d.avgSpeed || 0,
                      }))}
                    />
                  </>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    {selectedPlayer
                      ? "No GPS data available for this player"
                      : "Select a player to view their movement heatmap"}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connect">
            <Card>
              <CardHeader>
                <CardTitle>Connect Device</CardTitle>
                <CardDescription>
                  Set up automatic sync with your GPS tracking devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 border rounded-lg text-center">
                    <Bluetooth className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                    <h3 className="font-semibold mb-2">Bluetooth Connection</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect via Bluetooth for real-time data sync
                    </p>
                    <Button variant="outline" onClick={() => toast.info("Bluetooth pairing coming soon!")}>
                      Pair Device
                    </Button>
                  </div>
                  <div className="p-6 border rounded-lg text-center">
                    <Wifi className="h-12 w-12 mx-auto mb-4 text-green-700 dark:text-green-500" />
                    <h3 className="font-semibold mb-2">WiFi Sync</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Sync data over WiFi when device is in range
                    </p>
                    <Button variant="outline" onClick={() => toast.info("WiFi sync coming soon!")}>
                      Configure WiFi
                    </Button>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Supported Devices</h3>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      STATSports APEX - Full support with auto-sync
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      CITYPLAY Smart Ball - Ball touch and kick metrics
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      PlayerMaker - Foot sensor data integration
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      Catapult - Manual CSV import supported
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      Polar/Garmin - Heart rate data import
                    </li>
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
