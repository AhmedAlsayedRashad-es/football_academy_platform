import { useEffect, useRef, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PlayerHeatmapProps {
  liveMatchId: number;
  players: Array<{ id: number; name: string }>;
}

export default function PlayerHeatmap({ liveMatchId, players }: PlayerHeatmapProps) {
  const { t } = useLanguage();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [showAllPlayers, setShowAllPlayers] = useState(false);

  const { data: heatmapData, refetch } = trpc.liveMatch.getHeatmap.useQuery(
    { liveMatchId, playerId: selectedPlayerId! },
    { enabled: !!selectedPlayerId && !showAllPlayers, refetchInterval: 30000 }
  );

  const { data: allPositions } = trpc.liveMatch.getPositions.useQuery(
    { liveMatchId },
    { enabled: showAllPlayers, refetchInterval: 30000 }
  );

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw pitch
    drawPitch(ctx, canvas.width, canvas.height);

    if (showAllPlayers && allPositions) {
      // Draw all player positions
      drawAllPlayerPositions(ctx, canvas.width, canvas.height, allPositions);
    } else if (heatmapData && heatmapData.length > 0) {
      // Draw heatmap
      drawHeatmap(ctx, canvas.width, canvas.height, heatmapData);
    }
  }, [heatmapData, allPositions, showAllPlayers]);

  const drawPitch = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Pitch background
    ctx.fillStyle = '#1a5f3a';
    ctx.fillRect(0, 0, width, height);

    // Pitch lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Outer boundary
    ctx.strokeRect(10, 10, width - 20, height - 20);

    // Center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 10);
    ctx.lineTo(width / 2, height - 10);
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 50, 0, 2 * Math.PI);
    ctx.stroke();

    // Center spot
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 3, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Penalty areas
    const penaltyWidth = 100;
    const penaltyHeight = 200;
    
    // Left penalty area
    ctx.strokeRect(10, (height - penaltyHeight) / 2, penaltyWidth, penaltyHeight);
    
    // Right penalty area
    ctx.strokeRect(width - penaltyWidth - 10, (height - penaltyHeight) / 2, penaltyWidth, penaltyHeight);

    // Goal areas
    const goalWidth = 40;
    const goalHeight = 100;
    
    // Left goal area
    ctx.strokeRect(10, (height - goalHeight) / 2, goalWidth, goalHeight);
    
    // Right goal area
    ctx.strokeRect(width - goalWidth - 10, (height - goalHeight) / 2, goalWidth, goalHeight);

    // Penalty spots
    ctx.beginPath();
    ctx.arc(10 + penaltyWidth * 0.6, height / 2, 3, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(width - 10 - penaltyWidth * 0.6, height / 2, 3, 0, 2 * Math.PI);
    ctx.fill();
  };

  const drawHeatmap = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    data: Array<{ x: number; y: number; intensity: number }>
  ) => {
    const pitchWidth = width - 20;
    const pitchHeight = height - 20;

    data.forEach(point => {
      const x = 10 + (point.x / 100) * pitchWidth;
      const y = 10 + (point.y / 100) * pitchHeight;
      const radius = 30;

      // Create radial gradient
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      
      // Color based on intensity (red = high, yellow = medium, transparent = low)
      const alpha = point.intensity * 0.6;
      if (point.intensity > 0.7) {
        gradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.5})`);
      } else if (point.intensity > 0.4) {
        gradient.addColorStop(0, `rgba(255, 200, 0, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 0, ${alpha * 0.5})`);
      } else {
        gradient.addColorStop(0, `rgba(100, 255, 100, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(100, 255, 100, ${alpha * 0.3})`);
      }
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    });
  };

  const drawAllPlayerPositions = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    positions: Array<{ playerId: number; xPosition: number; yPosition: number }>
  ) => {
    const pitchWidth = width - 20;
    const pitchHeight = height - 20;

    // Group positions by player
    const playerPositions: { [key: number]: Array<{ x: number; y: number }> } = {};
    positions.forEach(pos => {
      if (!playerPositions[pos.playerId]) {
        playerPositions[pos.playerId] = [];
      }
      playerPositions[pos.playerId].push({
        x: 10 + (pos.xPosition / 100) * pitchWidth,
        y: 10 + (pos.yPosition / 100) * pitchHeight,
      });
    });

    // Draw positions for each player with different colors
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    let colorIndex = 0;

    Object.values(playerPositions).forEach(positions => {
      ctx.fillStyle = colors[colorIndex % colors.length];
      ctx.globalAlpha = 0.6;
      
      positions.forEach(pos => {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, 2 * Math.PI);
        ctx.fill();
      });
      
      colorIndex++;
    });
    
    ctx.globalAlpha = 1.0;
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `heatmap-${selectedPlayerId || 'all'}-${Date.now()}.png`;
    link.href = canvasRef.current.toDataURL();
    link.click();
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t('playerHeatmap')}</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            {t('refresh')}
          </Button>
          <Button size="sm" variant="outline" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1" />
            {t('download')}
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <div className="flex-1">
          <Select
            value={selectedPlayerId?.toString() || ''}
            onValueChange={(value) => {
              setSelectedPlayerId(parseInt(value));
              setShowAllPlayers(false);
            }}
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
        <Button
          variant={showAllPlayers ? 'default' : 'outline'}
          onClick={() => setShowAllPlayers(!showAllPlayers)}
        >
          {t('showAllPlayers')}
        </Button>
      </div>

      <div className="relative bg-secondary/20 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full h-auto"
        />
        {!selectedPlayerId && !showAllPlayers && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            <p>{t('selectPlayerToViewHeatmap')}</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(to right, rgba(100, 255, 100, 0.6), rgba(255, 200, 0, 0.6), rgba(255, 0, 0, 0.6))' }} />
          <span className="text-muted-foreground">{t('lowToHighIntensity')}</span>
        </div>
        <div className="text-muted-foreground">
          {t('autoRefreshEvery30Seconds')}
        </div>
      </div>
    </Card>
  );
}
