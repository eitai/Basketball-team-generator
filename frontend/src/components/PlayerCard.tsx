import { Edit3, Check } from 'lucide-react';
import type { Player } from '../types/player';
import { POSITIONS } from '../lib/constants';
import { computeOverall } from '../lib/teams';

interface Props {
  player: Player;
  attending: boolean;
  onToggle: () => void;
  onEdit: () => void;
  isAdmin: boolean;
}

export default function PlayerCard({ player, attending, onToggle, onEdit, isAdmin }: Props) {
  const overall = computeOverall(player);
  const pos = POSITIONS[player.position];

  return (
    <div
      className={`relative group rounded-xl border transition-all ${
        attending
          ? 'bg-stone-900 border-orange-500/60 shadow-md shadow-orange-500/10'
          : player.isGuest
          ? 'bg-stone-900/40 border-dashed border-amber-700/50 hover:border-amber-600/70'
          : 'bg-stone-900/40 border-stone-800 hover:border-stone-700'
      }`}
    >
      {isAdmin && (
        <button
          onClick={e => { e.stopPropagation(); onEdit(); }}
          className="absolute top-1 left-1 w-7 h-7 rounded-md bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-100 flex items-center justify-center opacity-60 hover:opacity-100 transition z-10"
          aria-label="ערוך"
        >
          <Edit3 size={13} />
        </button>
      )}

      <button onClick={isAdmin ? onToggle : undefined} className={`w-full p-3 text-right ${!isAdmin ? 'cursor-default' : ''}`}>
        <div className="flex items-start gap-2">
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition ${
              attending ? 'bg-orange-500' : 'border-2 border-stone-600 group-hover:border-stone-400'
            }`}
          >
            {attending && <Check size={13} className="text-white" strokeWidth={3} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`font-bold truncate text-sm ${attending ? 'text-stone-100' : 'text-stone-400'}`}>
              {player.name}
            </div>
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span className="text-xs text-stone-500">{pos.label}</span>
              {player.ballHandler && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-sky-400">
                  🏀 מוביל
                </span>
              )}
              {player.isGuest && (
                <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1 rounded">
                  אורח
                </span>
              )}
            </div>
          </div>
          <div
            className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg shrink-0 font-black text-base tabular-nums transition ${
              !attending
                ? 'bg-stone-800/40 text-stone-500'
                : overall >= 8
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                : overall >= 6
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : overall >= 4
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                : 'bg-stone-700/40 text-stone-400 border border-stone-700'
            }`}
          >
            {overall}
          </div>
        </div>
      </button>
    </div>
  );
}
