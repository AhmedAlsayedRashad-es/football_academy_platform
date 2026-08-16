import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, Activity, CheckCircle2, XCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';

interface GPSImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  liveMatchId: number;
  players: Array<{ id: number; name: string }>;
}

export default function GPSImportDialog({ open, onOpenChange, liveMatchId, players }: GPSImportDialogProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [deviceId, setDeviceId] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; count: number; quality?: { accuracy: number; validPoints: number; totalPoints: number } } | null>(null);

  const startGpsSyncMutation = trpc.liveMatch.startGpsSync.useMutation();
  const importGpsDataMutation = trpc.liveMatch.importGpsDataBatch.useMutation();
  const { data: gpsSync, refetch: refetchGpsSync } = trpc.liveMatch.getGpsSync.useQuery(
    { liveMatchId },
    { enabled: open }
  );

  const handleStartSync = async () => {
    if (!selectedPlayerId) {
      toast({
        title: t('error'),
        description: t('selectPlayer'),
        variant: 'destructive',
      });
      return;
    }

    try {
      await startGpsSyncMutation.mutateAsync({
        liveMatchId,
        playerId: selectedPlayerId,
        deviceId: deviceId || undefined,
      });

      toast({
        title: t('gpsSyncStarted'),
        description: t('gpsSyncStartedSuccess'),
      });

      refetchGpsSync();
    } catch (error) {
      toast({
        title: t('error'),
        description: t('failedToStartGpsSync'),
        variant: 'destructive',
      });
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);

    try {
      // Parse CSV file
      const text = await file.text();
      const lines = text.split('\n').slice(1); // Skip header
      
      const positions = lines
        .filter(line => line.trim())
        .map(line => {
          const [playerId, minute, x, y, speed, heartRate] = line.split(',');
          return {
            playerId: parseInt(playerId),
            minute: parseInt(minute),
            xPosition: parseFloat(x),
            yPosition: parseFloat(y),
            speed: speed ? parseInt(speed) : undefined,
            heartRate: heartRate ? parseInt(heartRate) : undefined,
          };
        });

      // Validate data quality
      const validPositions = positions.filter(p => 
        !isNaN(p.xPosition) && 
        !isNaN(p.yPosition) && 
        p.xPosition >= 0 && p.xPosition <= 800 &&
        p.yPosition >= 0 && p.yPosition <= 800 &&
        (!p.speed || (p.speed >= 0 && p.speed <= 50)) &&
        (!p.heartRate || (p.heartRate >= 40 && p.heartRate <= 220))
      );
      
      const accuracy = (validPositions.length / positions.length) * 100;

      // The endpoint takes lat/long and re-derives pitch coords as `value * 100`,
      // so divide here to round-trip the positions unchanged.
      const result = await importGpsDataMutation.mutateAsync({
        liveMatchId,
        gpsData: validPositions.map(p => ({
          playerId: p.playerId,
          timestamp: new Date(p.minute * 60_000).toISOString(),
          latitude: p.yPosition / 100,
          longitude: p.xPosition / 100,
          speed: p.speed,
          heartRate: p.heartRate,
        })),
      });

      setImportResult({ 
        success: true, 
        count: result.imported,
        quality: {
          accuracy,
          validPoints: validPositions.length,
          totalPoints: positions.length
        }
      });
      toast({
        title: t('gpsDataImported'),
        description: `${result.imported} ${t('dataPointsImported')}`,
      });
    } catch (error) {
      setImportResult({ success: false, count: 0 });
      toast({
        title: t('error'),
        description: t('failedToImportGpsData'),
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('gpsIntegration')}</DialogTitle>
          <DialogDescription>
            {t('gpsIntegrationDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Live GPS Sync Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t('liveGpsSync')}
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label>{t('selectPlayer')}</Label>
                <Select
                  value={selectedPlayerId?.toString() || ''}
                  onValueChange={(value) => setSelectedPlayerId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectPlayer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {players.map(player => (
                      <SelectItem key={player.id} value={player.id.toString()}>
                        {player.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{t('deviceId')} ({t('optional')})</Label>
                <Input
                  value={deviceId}
                  onChange={(e) => setDeviceId(e.target.value)}
                  placeholder="GPS-001"
                />
              </div>

              <Button
                onClick={handleStartSync}
                disabled={!selectedPlayerId || startGpsSyncMutation.isPending}
                className="w-full"
              >
                {startGpsSyncMutation.isPending ? t('starting') : t('startGpsSync')}
              </Button>
            </div>

            {/* Active Syncs */}
            {gpsSync && gpsSync.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium">{t('activeSyncs')}</h4>
                {gpsSync.map(sync => {
                  const player = players.find(p => p.id === sync.playerId);
                  return (
                    <div key={sync.id} className="flex items-center justify-between p-2 bg-secondary/20 rounded">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          sync.syncStatus === 'active' ? 'bg-green-500 animate-pulse' :
                          sync.syncStatus === 'paused' ? 'bg-yellow-500' :
                          sync.syncStatus === 'error' ? 'bg-red-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="text-sm">{player?.name}</span>
                        {sync.deviceId && (
                          <span className="text-xs text-muted-foreground">({sync.deviceId})</span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sync.dataPoints} {t('dataPoints')}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* File Import Section */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {t('importGpsFile')}
            </h3>
            
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t('importGpsFileDescription')}
              </p>

              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileImport}
                  disabled={importing}
                  className="hidden"
                  id="gps-file-input"
                />
                <label
                  htmlFor="gps-file-input"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {importing ? t('importing') : t('clickToUploadCsv')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    CSV format: playerId, minute, x, y, speed, heartRate
                  </span>
                </label>
              </div>

              {importResult && (
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    importResult.success ? 'bg-green-500/10 text-green-700' : 'bg-red-500/10 text-red-700'
                  }`}>
                    {importResult.success ? (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        <span>{importResult.count} {t('dataPointsImported')}</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5" />
                        <span>{t('importFailed')}</span>
                      </>
                    )}
                  </div>
                  {importResult.quality && (
                    <div className="text-sm space-y-1 p-3 bg-secondary/20 rounded-lg">
                      <div className="flex justify-between">
                        <span>{t('dataQuality')}:</span>
                        <span className="font-semibold">{importResult.quality.accuracy.toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>{t('validPoints')}:</span>
                        <span>{importResult.quality.validPoints} / {importResult.quality.totalPoints}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-sm mb-2">{t('instructions')}</h4>
            <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
              <li>{t('gpsInstruction1')}</li>
              <li>{t('gpsInstruction2')}</li>
              <li>{t('gpsInstruction3')}</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
