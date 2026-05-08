import { useState } from 'react';
import { Trophy, GripVertical, Lock } from 'lucide-react';
import type { Player } from '../types/player';
import type { TeamColor } from '../lib/constants';
import { POSITIONS } from '../lib/constants';
import { computeOverall, teamSum, teamAvg } from '../lib/teams';

interface Props {
  team: Player[];
  color: TeamColor;
  teamIdx: number;
  onDragStart: (player: Player) => void;
  onDrop: (playerId: string, fromTeamIdx: number, toTeamIdx: number) => void;
  onDragEnd: () => void;
  draggingPlayer: { player: Player; fromTeamIdx: number } | null;
  locked: Map<string, number>;
  onLockToggle: (playerId: string, teamIdx: number | null) => void;
  isTouchDragOver: boolean;
  onTouchDragOver: (teamIdx: number | null) => void;
}

export default function TeamCard({ team, color, teamIdx, onDragStart, onDrop, onDragEnd, draggingPlayer, locked, onLockToggle, isTouchDragOver, onTouchDragOver }: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const isOver = isDragOver || isTouchDragOver;

  const sum = teamSum(team);
  const avg = teamAvg(team);
  const sorted = [...team].sort((a, b) => computeOverall(b) - computeOverall(a));
  const positions = team.reduce<Record<string, number>>((acc, p) => {
    acc[p.position] = (acc[p.position] || 0) + 1;
    return acc;
  }, {});

  const previewTeam = isOver && draggingPlayer && draggingPlayer.fromTeamIdx !== teamIdx
    ? [...team, draggingPlayer.player]
    : null;
  const previewSum = previewTeam ? teamSum(previewTeam) : null;
  const previewAvg = previewTeam ? teamAvg(previewTeam) : null;

  const handleTouchStart = (p: Player) => (e: React.TouchEvent) => {
    e.stopPropagation();
    onDragStart(p);

    let currentTarget: number | null = null;

    const handleMove = (te: TouchEvent) => {
      te.preventDefault();
      const touch = te.touches[0];
      if (!touch) return;
      const el = document.elementFromPoint(touch.clientX, touch.clientY);
      let node: Element | null = el;
      while (node && !node.hasAttribute('data-team-idx')) node = node.parentElement;
      const tIdx = node ? parseInt(node.getAttribute('data-team-idx')!, 10) : null;
      if (tIdx !== currentTarget) {
        currentTarget = tIdx;
        onTouchDragOver(tIdx);
      }
    };

    const handleEnd = () => {
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      onTouchDragOver(null);
      if (currentTarget !== null && currentTarget !== teamIdx) {
        onDrop(p.id, teamIdx, currentTarget);
      }
      onDragEnd();
    };

    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
  };

  return (
    <div
      data-team-idx={teamIdx}
      className={`bg-stone-900 border rounded-2xl overflow-hidden shadow-xl transition-all ${
        isOver
          ? `border-transparent ring-2 ring-offset-1 ring-offset-stone-950 ${color.ring} scale-[1.01]`
          : `${color.border} ${color.glow}`
      }`}
      onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={e => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false);
      }}
      onDrop={e => {
        e.preventDefault();
        setIsDragOver(false);
        try {
          const { playerId, fromTeamIdx } = JSON.parse(e.dataTransfer.getData('text/plain')) as { playerId: string; fromTeamIdx: number };
          onDrop(playerId, fromTeamIdx, teamIdx);
        } catch {}
      }}
    >
      <div className={`${color.bg} px-5 py-3`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-white/80 font-bold uppercase tracking-wider">קבוצה</div>
            <div className="text-2xl font-black text-white">{color.name}</div>
          </div>
          <Trophy className="text-white/80" size={28} />
        </div>
      </div>

      <div
        className={`${color.bgSoft} grid grid-cols-3 divide-x divide-stone-700/50 border-b border-stone-700/50`}
        dir="ltr"
      >
        <div className="px-3 py-2.5 text-center">
          <div className="text-[10px] text-stone-400 font-bold uppercase">סה״כ</div>
          <div className="text-xl font-black text-stone-100 tabular-nums">
            {isOver && previewSum !== null ? previewSum : sum}
          </div>
        </div>
        <div className="px-3 py-2.5 text-center">
          <div className="text-[10px] text-stone-400 font-bold uppercase">ממוצע</div>
          <div className={`text-xl font-black tabular-nums transition-colors ${isOver && previewAvg !== null ? 'text-amber-400' : 'text-stone-100'}`}>
            {isOver && previewAvg !== null ? previewAvg.toFixed(1) : avg.toFixed(1)}
          </div>
        </div>
        <div className="px-3 py-2.5 text-center">
          <div className="text-[10px] text-stone-400 font-bold uppercase">הרכב</div>
          <div className="text-xs font-bold text-stone-100 mt-1.5 tabular-nums">
            {positions['guard'] || 0}G·{positions['forward'] || 0}F·{positions['center'] || 0}C
          </div>
        </div>
      </div>

      <div className="p-3 space-y-1.5" dir="rtl">
        {sorted.map((p, i) => {
          const ov = computeOverall(p);
          return (
            <div
              key={p.id}
              draggable
              onDragStart={e => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ playerId: p.id, fromTeamIdx: teamIdx }));
                e.dataTransfer.effectAllowed = 'move';
                onDragStart(p);
              }}
              onDragEnd={onDragEnd}
              onTouchStart={handleTouchStart(p)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-stone-800/60 cursor-grab active:cursor-grabbing touch-none"
            >
              <GripVertical size={13} className="text-stone-600 shrink-0" />
              <div className={`text-xs font-black ${color.text} w-4 tabular-nums`}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-stone-100 truncate text-sm">{p.name}</div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-stone-500">{POSITIONS[p.position].label}</span>
                  {p.ballHandler && (
                    <span className="flex items-center gap-0.5 text-[10px] font-bold text-sky-400">
                      🏀 מוביל
                    </span>
                  )}
                </div>
              </div>
              <div className="text-base font-black text-stone-100 tabular-nums">{ov}</div>
              <button
                onClick={e => { e.stopPropagation(); onLockToggle(p.id, locked.get(p.id) === teamIdx ? null : teamIdx); }}
                className={`w-6 h-6 rounded-md flex items-center justify-center transition shrink-0 ${
                  locked.get(p.id) === teamIdx
                    ? `${color.bg} text-white opacity-100`
                    : 'text-stone-600 hover:text-stone-300 opacity-50 hover:opacity-100'
                }`}
                title={locked.get(p.id) === teamIdx ? 'בטל נעילה' : 'נעל לקבוצה זו'}
              >
                <Lock size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
