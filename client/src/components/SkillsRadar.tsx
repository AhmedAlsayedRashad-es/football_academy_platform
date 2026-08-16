import { useEffect, useRef } from 'react';

interface SkillsRadarProps {
  skills: {
    twoFooted: number;
    dribbling: number;
    firstTouch: number;
    agility: number;
    speed: number;
    power: number;
  };
  size?: number;
  showLabels?: boolean;
  showTrends?: boolean;
  previousSkills?: {
    twoFooted: number;
    dribbling: number;
    firstTouch: number;
    agility: number;
    speed: number;
    power: number;
  };
}

export function SkillsRadar({ skills, size = 280, showLabels = true, showTrends = false, previousSkills }: SkillsRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const skillLabels = [
    { key: 'twoFooted', label: 'Two-footed', angle: -90 },
    { key: 'dribbling', label: 'Dribbling', angle: -30 },
    { key: 'firstTouch', label: 'First touch', angle: 30 },
    { key: 'agility', label: 'Agility', angle: 90 },
    { key: 'speed', label: 'Speed', angle: 150 },
    { key: 'power', label: 'Power', angle: 210 },
  ];

  const centerX = size / 2;
  const centerY = size / 2;
  const radius = (size / 2) - 60; // More room for labels

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, size, size);

    // Draw grid circles
    for (let i = 1; i <= 5; i++) {
      const r = (radius / 5) * i;
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw grid lines
    skillLabels.forEach(({ angle }) => {
      const rad = (angle * Math.PI) / 180;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(rad) * radius,
        centerY + Math.sin(rad) * radius
      );
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw skill polygon
    ctx.beginPath();
    skillLabels.forEach(({ key, angle }, index) => {
      const value = skills[key as keyof typeof skills] || 0;
      const r = (value / 100) * radius;
      const rad = (angle * Math.PI) / 180;
      const x = centerX + Math.cos(rad) * r;
      const y = centerY + Math.sin(rad) * r;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(79, 209, 197, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#4fd1c5';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw skill points
    skillLabels.forEach(({ key, angle }) => {
      const value = skills[key as keyof typeof skills] || 0;
      const r = (value / 100) * radius;
      const rad = (angle * Math.PI) / 180;
      const x = centerX + Math.cos(rad) * r;
      const y = centerY + Math.sin(rad) * r;

      // Point color based on value
      let color = '#ef4444'; // red
      if (value >= 80) color = '#22c55e'; // green
      else if (value >= 60) color = '#f59e0b'; // amber
      else if (value >= 40) color = '#f97316'; // orange

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

  }, [skills, size, centerX, centerY, radius]);

  const getSkillColor = (value: number) => {
    if (value >= 80) return 'text-green-700 dark:text-green-500';
    if (value >= 60) return 'text-amber-700 dark:text-amber-500';
    if (value >= 40) return 'text-orange-700 dark:text-orange-500';
    return 'text-red-500';
  };

  const getTrend = (current: number, previous?: number) => {
    if (!previous) return null;
    if (current > previous) return '▲';
    if (current < previous) return '▼';
    return null;
  };

  // Calculate position for labels at the actual data point on the graph
  const getDataPointPosition = (key: string, angle: number) => {
    const value = skills[key as keyof typeof skills] || 0;
    const r = (value / 100) * radius;
    const rad = (angle * Math.PI) / 180;
    
    // Position the label at the data point with slight offset outward
    const labelOffset = 28;
    const x = centerX + Math.cos(rad) * (r + labelOffset);
    const y = centerY + Math.sin(rad) * (r + labelOffset);
    
    return { x, y };
  };

  return (
    <div className="relative" style={{ width: size, height: size, margin: '0 auto' }}>
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="absolute inset-0"
      />
      
      {showLabels && (
        <div className="absolute inset-0 pointer-events-none">
          {skillLabels.map(({ key, label, angle }) => {
            const value = skills[key as keyof typeof skills] || 0;
            const { x, y } = getDataPointPosition(key, angle);
            const trend = showTrends && previousSkills 
              ? getTrend(value, previousSkills[key as keyof typeof previousSkills])
              : null;

            return (
              <div
                key={key}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 text-center"
                style={{ left: x, top: y }}
              >
                <div className={`text-base font-bold ${getSkillColor(value)}`}>
                  {value}
                  {trend && (
                    <span className={`text-xs ml-0.5 ${trend === '▲' ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {trend}
                    </span>
                  )}
                </div>
                <div className="text-[9px] text-muted-foreground whitespace-nowrap leading-tight">{label}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SkillsRadar;
