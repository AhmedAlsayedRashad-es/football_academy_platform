import { useState } from 'react';
import { Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlayerCardProps {
  player: {
    name: string;
    position: string;
    photoUrl?: string;
    club?: string;
    nationality?: string;
    skills: {
      twoFooted: number;
      dribbling: number;
      firstTouch: number;
      agility: number;
      speed: number;
      power: number;
    };
  };
  onClose?: () => void;
}

export function PlayerCard({ player, onClose }: PlayerCardProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${player.name} - Player Card`,
          text: `Check out ${player.name}'s stats at Future Stars Academy!`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
    setIsSharing(false);
  };

  const getSkillColor = (value: number) => {
    if (value >= 80) return 'text-green-700 dark:text-green-400';
    if (value >= 60) return 'text-yellow-700 dark:text-yellow-400';
    if (value >= 40) return 'text-orange-700 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground/70 hover:text-foreground"
        >
          <X className="h-8 w-8" />
        </button>
      )}

      {/* FIFA-style Card */}
      <div className="relative w-[320px] rounded-2xl overflow-hidden" style={{
        background: 'linear-gradient(145deg, #1a365d 0%, #0f2744 50%, #1a365d 100%)',
        border: '3px solid #4fd1c5',
        boxShadow: '0 0 30px rgba(79, 209, 197, 0.3)',
      }}>
        {/* Decorative lightning bolt */}
        <div className="absolute inset-0 opacity-20">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M50 10 L60 45 L45 45 L55 90 L40 50 L55 50 Z" fill="#4fd1c5" />
          </svg>
        </div>

        <div className="relative p-6">
          {/* Header with club and nationality */}
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded bg-white/10 flex items-center justify-center">
              <span className="text-xs text-foreground/70">{player.club || 'FSFC'}</span>
            </div>
            <div className="text-center">
              <span className="text-lg font-bold text-cyan-700 dark:text-cyan-400">{player.position}</span>
            </div>
            <div className="w-12 h-12 rounded overflow-hidden">
              {player.nationality === 'Egypt' ? (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-1 bg-red-600" />
                  <div className="flex-1 bg-white" />
                  <div className="flex-1 bg-black" />
                </div>
              ) : (
                <div className="w-full h-full bg-white/10" />
              )}
            </div>
          </div>

          {/* Player Photo */}
          <div className="flex justify-center mb-4">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-cyan-400/50 bg-gradient-to-b from-gray-300 to-gray-400">
              {player.photoUrl ? (
                <img src={player.photoUrl} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-gray-600">
                  {player.name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          {/* Player Name */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-foreground tracking-wider uppercase">
              {player.name.split(' ').pop()}
            </h2>
          </div>

          {/* Divider */}
          <div className="border-t border-cyan-400/30 mb-4" />

          {/* Skills */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`text-2xl font-bold ${getSkillColor(player.skills.twoFooted)}`}>
                {player.skills.twoFooted}
              </span>
              <span className="text-cyan-700 dark:text-cyan-300 uppercase tracking-wide text-sm">Two-Footed</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-2xl font-bold ${getSkillColor(player.skills.dribbling)}`}>
                {player.skills.dribbling}
              </span>
              <span className="text-cyan-700 dark:text-cyan-300 uppercase tracking-wide text-sm">Dribbling</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-2xl font-bold ${getSkillColor(player.skills.firstTouch)}`}>
                {player.skills.firstTouch}
              </span>
              <span className="text-cyan-700 dark:text-cyan-300 uppercase tracking-wide text-sm">First Touch</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-2xl font-bold ${getSkillColor(player.skills.agility)}`}>
                {player.skills.agility}
              </span>
              <span className="text-cyan-700 dark:text-cyan-300 uppercase tracking-wide text-sm">Agility</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-2xl font-bold ${getSkillColor(player.skills.speed)}`}>
                {player.skills.speed}
              </span>
              <span className="text-cyan-700 dark:text-cyan-300 uppercase tracking-wide text-sm">Speed</span>
            </div>
            <div className="flex justify-between items-center">
              <span className={`text-2xl font-bold ${getSkillColor(player.skills.power)}`}>
                {player.skills.power}
              </span>
              <span className="text-cyan-700 dark:text-cyan-300 uppercase tracking-wide text-sm">Power</span>
            </div>
          </div>

          {/* Powered by */}
          <div className="mt-6 text-center text-xs text-foreground/40">
            Powered by
            <div className="text-cyan-700 dark:text-cyan-400 font-semibold">Future Stars Academy</div>
          </div>
        </div>
      </div>

      {/* Share Button */}
      <Button
        onClick={handleShare}
        disabled={isSharing}
        className="absolute bottom-8 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full px-8 py-3"
      >
        <Share2 className="w-5 h-5 mr-2" />
        Share
      </Button>
    </div>
  );
}

export default PlayerCard;
