import { useState } from 'react';

interface PlayerPosition {
  id: number;
  x: number;
  y: number;
  number: number;
  name?: string;
  isTeam: boolean;
}

interface HeatmapZone {
  zone: string;
  intensity: number;
}

interface TacticalBoardProps {
  players?: PlayerPosition[];
  heatmapData?: HeatmapZone[];
  showHeatmap?: boolean;
  teamColor?: string;
  opponentColor?: string;
  isRTL?: boolean;
}

export default function TacticalBoard({
  players = [],
  heatmapData = [],
  showHeatmap = false,
  teamColor = '#22c55e',
  opponentColor = '#ef4444',
  isRTL = false,
}: TacticalBoardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);

  // Default player positions if none provided
  const defaultPlayers: PlayerPosition[] = players.length > 0 ? players : [
    // Team players (green)
    { id: 1, x: 10, y: 50, number: 1, name: 'GK', isTeam: true },
    { id: 2, x: 25, y: 20, number: 2, name: 'RB', isTeam: true },
    { id: 3, x: 25, y: 40, number: 4, name: 'CB', isTeam: true },
    { id: 4, x: 25, y: 60, number: 5, name: 'CB', isTeam: true },
    { id: 5, x: 25, y: 80, number: 3, name: 'LB', isTeam: true },
    { id: 6, x: 45, y: 30, number: 6, name: 'CDM', isTeam: true },
    { id: 7, x: 45, y: 70, number: 8, name: 'CM', isTeam: true },
    { id: 8, x: 60, y: 20, number: 7, name: 'RW', isTeam: true },
    { id: 9, x: 60, y: 50, number: 10, name: 'CAM', isTeam: true },
    { id: 10, x: 60, y: 80, number: 11, name: 'LW', isTeam: true },
    { id: 11, x: 75, y: 50, number: 9, name: 'ST', isTeam: true },
    // Opponent players (red)
    { id: 12, x: 90, y: 50, number: 1, isTeam: false },
    { id: 13, x: 75, y: 25, number: 2, isTeam: false },
    { id: 14, x: 75, y: 45, number: 4, isTeam: false },
    { id: 15, x: 75, y: 55, number: 5, isTeam: false },
    { id: 16, x: 75, y: 75, number: 3, isTeam: false },
  ];

  // Heatmap zones configuration
  const heatmapZones = [
    { id: 'leftWing', x: 0, y: 0, width: 20, height: 100 },
    { id: 'leftMidfield', x: 20, y: 0, width: 20, height: 100 },
    { id: 'center', x: 40, y: 0, width: 20, height: 100 },
    { id: 'rightMidfield', x: 60, y: 0, width: 20, height: 100 },
    { id: 'rightWing', x: 80, y: 0, width: 20, height: 100 },
  ];

  const getHeatmapIntensity = (zoneId: string): number => {
    const zone = heatmapData.find(h => h.zone === zoneId);
    return zone ? zone.intensity : 0;
  };

  const getHeatmapColor = (intensity: number): string => {
    if (intensity === 0) return 'transparent';
    const alpha = Math.min(intensity / 100 * 0.6, 0.6);
    if (intensity > 30) return `rgba(239, 68, 68, ${alpha})`; // Red for high
    if (intensity > 20) return `rgba(249, 115, 22, ${alpha})`; // Orange for medium
    if (intensity > 10) return `rgba(234, 179, 8, ${alpha})`; // Yellow for low
    return `rgba(34, 197, 94, ${alpha})`; // Green for very low
  };

  return (
    <div className="relative w-full aspect-[3/2] bg-gradient-to-b from-green-600 to-green-700 rounded-xl overflow-hidden shadow-lg">
      {/* Pitch markings */}
      <svg viewBox="0 0 100 66.67" className="absolute inset-0 w-full h-full">
        {/* Heatmap overlay */}
        {showHeatmap && heatmapZones.map(zone => (
          <rect
            key={zone.id}
            x={zone.x}
            y={0}
            width={zone.width}
            height={66.67}
            fill={getHeatmapColor(getHeatmapIntensity(zone.id))}
          />
        ))}

        {/* Pitch outline */}
        <rect x="2" y="2" width="96" height="62.67" fill="none" stroke="white" strokeWidth="0.3" />
        
        {/* Center line */}
        <line x1="50" y1="2" x2="50" y2="64.67" stroke="white" strokeWidth="0.3" />
        
        {/* Center circle */}
        <circle cx="50" cy="33.33" r="9.15" fill="none" stroke="white" strokeWidth="0.3" />
        <circle cx="50" cy="33.33" r="0.5" fill="white" />
        
        {/* Left penalty area */}
        <rect x="2" y="13.84" width="16.5" height="38.99" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="2" y="22.17" width="5.5" height="22.33" fill="none" stroke="white" strokeWidth="0.3" />
        <circle cx="11" cy="33.33" r="0.5" fill="white" />
        <path d="M 18.5 24.84 A 9.15 9.15 0 0 1 18.5 41.82" fill="none" stroke="white" strokeWidth="0.3" />
        
        {/* Right penalty area */}
        <rect x="81.5" y="13.84" width="16.5" height="38.99" fill="none" stroke="white" strokeWidth="0.3" />
        <rect x="92.5" y="22.17" width="5.5" height="22.33" fill="none" stroke="white" strokeWidth="0.3" />
        <circle cx="89" cy="33.33" r="0.5" fill="white" />
        <path d="M 81.5 24.84 A 9.15 9.15 0 0 0 81.5 41.82" fill="none" stroke="white" strokeWidth="0.3" />
        
        {/* Corner arcs */}
        <path d="M 2 3 A 1 1 0 0 0 3 2" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 97 2 A 1 1 0 0 0 98 3" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 2 63.67 A 1 1 0 0 1 3 64.67" fill="none" stroke="white" strokeWidth="0.3" />
        <path d="M 97 64.67 A 1 1 0 0 1 98 63.67" fill="none" stroke="white" strokeWidth="0.3" />

        {/* Players */}
        {defaultPlayers.map(player => (
          <g key={player.id} onClick={() => setSelectedPlayer(player.id)}>
            <circle
              cx={player.x}
              cy={player.y * 0.6267 + 2}
              r={selectedPlayer === player.id ? 3.5 : 3}
              fill={player.isTeam ? teamColor : opponentColor}
              stroke={selectedPlayer === player.id ? 'white' : 'rgba(0,0,0,0.3)'}
              strokeWidth={selectedPlayer === player.id ? 0.5 : 0.2}
              className="cursor-pointer transition-all hover:r-3.5"
              style={{ filter: selectedPlayer === player.id ? 'drop-shadow(0 0 3px white)' : 'none' }}
            />
            <text
              x={player.x}
              y={player.y * 0.6267 + 2 + 1}
              textAnchor="middle"
              fill="white"
              fontSize="2"
              fontWeight="bold"
              className="pointer-events-none"
            >
              {player.number}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-xs text-foreground/80">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: teamColor }} />
            <span>{isRTL ? 'فريقك' : 'Your Team'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: opponentColor }} />
            <span>{isRTL ? 'الخصم' : 'Opponent'}</span>
          </div>
        </div>
        {showHeatmap && (
          <div className="flex items-center gap-1">
            <span>{isRTL ? 'كثافة:' : 'Intensity:'}</span>
            <div className="flex">
              <div className="w-4 h-3 bg-green-500/40" />
              <div className="w-4 h-3 bg-yellow-500/40" />
              <div className="w-4 h-3 bg-orange-500/40" />
              <div className="w-4 h-3 bg-red-500/40" />
            </div>
          </div>
        )}
      </div>

      {/* Selected player info */}
      {selectedPlayer && (
        <div className="absolute top-2 right-2 bg-black/70 rounded-lg px-3 py-2 text-white text-sm">
          <p className="font-bold">
            #{defaultPlayers.find(p => p.id === selectedPlayer)?.number} {defaultPlayers.find(p => p.id === selectedPlayer)?.name}
          </p>
        </div>
      )}
    </div>
  );
}
