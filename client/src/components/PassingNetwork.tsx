interface PassingConnection {
  from: number;
  to: number;
  count: number;
  success: number;
}

interface PlayerNode {
  id: number;
  x: number;
  y: number;
  number: number;
  name: string;
  passes: number;
}

interface PassingNetworkProps {
  players?: PlayerNode[];
  connections?: PassingConnection[];
  teamColor?: string;
  isRTL?: boolean;
}

export default function PassingNetwork({
  players,
  connections,
  teamColor = '#22c55e',
  isRTL = false,
}: PassingNetworkProps) {
  // Default data for demonstration
  const defaultPlayers: PlayerNode[] = players || [
    { id: 1, x: 10, y: 50, number: 1, name: 'GK', passes: 15 },
    { id: 2, x: 25, y: 25, number: 2, name: 'RB', passes: 28 },
    { id: 3, x: 25, y: 50, number: 4, name: 'CB', passes: 42 },
    { id: 4, x: 25, y: 75, number: 3, name: 'LB', passes: 31 },
    { id: 5, x: 45, y: 35, number: 6, name: 'CDM', passes: 56 },
    { id: 6, x: 45, y: 65, number: 8, name: 'CM', passes: 48 },
    { id: 7, x: 65, y: 25, number: 7, name: 'RW', passes: 22 },
    { id: 8, x: 65, y: 50, number: 10, name: 'CAM', passes: 38 },
    { id: 9, x: 65, y: 75, number: 11, name: 'LW', passes: 25 },
    { id: 10, x: 80, y: 50, number: 9, name: 'ST', passes: 18 },
  ];

  const defaultConnections: PassingConnection[] = connections || [
    { from: 1, to: 3, count: 12, success: 11 },
    { from: 3, to: 5, count: 18, success: 16 },
    { from: 3, to: 6, count: 14, success: 13 },
    { from: 5, to: 6, count: 22, success: 20 },
    { from: 5, to: 8, count: 15, success: 13 },
    { from: 6, to: 8, count: 16, success: 14 },
    { from: 6, to: 9, count: 12, success: 10 },
    { from: 2, to: 7, count: 10, success: 8 },
    { from: 4, to: 9, count: 11, success: 9 },
    { from: 8, to: 10, count: 14, success: 11 },
    { from: 7, to: 10, count: 8, success: 6 },
    { from: 9, to: 10, count: 9, success: 7 },
  ];

  const getPlayerById = (id: number) => defaultPlayers.find(p => p.id === id);

  const getLineWidth = (count: number) => {
    if (count >= 20) return 3;
    if (count >= 15) return 2.5;
    if (count >= 10) return 2;
    return 1.5;
  };

  const getLineOpacity = (successRate: number) => {
    return 0.4 + (successRate * 0.5);
  };

  const getNodeSize = (passes: number) => {
    if (passes >= 50) return 5;
    if (passes >= 40) return 4.5;
    if (passes >= 30) return 4;
    if (passes >= 20) return 3.5;
    return 3;
  };

  return (
    <div className="relative w-full aspect-[3/2] bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl overflow-hidden">
      <svg viewBox="0 0 100 66.67" className="absolute inset-0 w-full h-full">
        {/* Pitch outline (simplified) */}
        <rect x="2" y="2" width="96" height="62.67" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" />
        <line x1="50" y1="2" x2="50" y2="64.67" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" />
        <circle cx="50" cy="33.33" r="9.15" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.3" />

        {/* Passing connections */}
        {defaultConnections.map((conn, idx) => {
          const fromPlayer = getPlayerById(conn.from);
          const toPlayer = getPlayerById(conn.to);
          if (!fromPlayer || !toPlayer) return null;

          const successRate = conn.success / conn.count;
          
          return (
            <line
              key={idx}
              x1={fromPlayer.x}
              y1={fromPlayer.y * 0.6267 + 2}
              x2={toPlayer.x}
              y2={toPlayer.y * 0.6267 + 2}
              stroke={teamColor}
              strokeWidth={getLineWidth(conn.count)}
              strokeOpacity={getLineOpacity(successRate)}
              strokeLinecap="round"
            />
          );
        })}

        {/* Player nodes */}
        {defaultPlayers.map(player => (
          <g key={player.id}>
            <circle
              cx={player.x}
              cy={player.y * 0.6267 + 2}
              r={getNodeSize(player.passes)}
              fill={teamColor}
              stroke="white"
              strokeWidth="0.3"
            />
            <text
              x={player.x}
              y={player.y * 0.6267 + 2 + 0.8}
              textAnchor="middle"
              fill="white"
              fontSize="2.5"
              fontWeight="bold"
            >
              {player.number}
            </text>
          </g>
        ))}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs text-foreground/70">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: teamColor }} />
            <span>{isRTL ? 'حجم = عدد التمريرات' : 'Size = Pass count'}</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-6 h-0.5" style={{ backgroundColor: teamColor, opacity: 0.4 }} />
          <span>→</span>
          <div className="w-6 h-1" style={{ backgroundColor: teamColor, opacity: 0.9 }} />
          <span>{isRTL ? 'سُمك = تكرار' : 'Thickness = Frequency'}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="absolute top-2 right-2 bg-black/50 rounded-lg px-3 py-2 text-white text-xs">
        <p className="font-semibold mb-1">{isRTL ? 'إحصائيات التمرير' : 'Passing Stats'}</p>
        <p>{isRTL ? 'إجمالي التمريرات:' : 'Total Passes:'} {defaultPlayers.reduce((sum, p) => sum + p.passes, 0)}</p>
        <p>{isRTL ? 'دقة التمرير:' : 'Pass Accuracy:'} {Math.round(
          defaultConnections.reduce((sum, c) => sum + c.success, 0) / 
          defaultConnections.reduce((sum, c) => sum + c.count, 0) * 100
        )}%</p>
      </div>
    </div>
  );
}
