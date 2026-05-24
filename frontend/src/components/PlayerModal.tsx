import { useState } from 'react';
import { X, Save, Trash2, Phone } from 'lucide-react';
import type { Player, PlayerDraft, Position } from '../types/player';
import { POSITIONS, CATEGORIES } from '../lib/constants';
import { computeOverall } from '../lib/teams';

interface Props {
  player: Player | null;
  onSave: (data: Player | PlayerDraft, phone?: string) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  defaultIsGuest?: boolean;
  defaultName?: string;
  showPhone?: boolean;
}

type DraftState = PlayerDraft & { id?: string };

export default function PlayerModal({ player, onSave, onClose, onDelete, defaultIsGuest = false, defaultName = '', showPhone = false }: Props) {
  const [draft, setDraft] = useState<DraftState>(
    player
      ? { ...player, ballHandler: player.ballHandler ?? false, generalRating: player.generalRating ?? 5, isGuest: player.isGuest ?? false }
      : { name: defaultName, position: 'guard', defense: 5, offense: 5, shooting: 5, passing: 5, rebounding: 5, fitness: 5, ballHandler: false, generalRating: 5, isGuest: defaultIsGuest }
  );
  const [phone, setPhone] = useState('');
  const overall = computeOverall(draft as Player);
  const isValid = draft.name.trim().length > 0;
  const update = <K extends keyof DraftState>(k: K, v: DraftState[K]) =>
    setDraft(d => ({ ...d, [k]: v }));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700 bg-stone-950">
          <h3 className="text-xl font-black text-stone-100 tracking-tight">
            {player ? 'עריכת שחקן' : 'הוספת שחקן'}
          </h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 transition">
            <X size={22} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              שם השחקן
            </label>
            <input
              value={draft.name}
              onChange={e => update('name', e.target.value)}
              placeholder="לדוגמה: דני"
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-4 py-3 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
              תפקיד
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(POSITIONS).map(([key, { label }]) => (
                <button
                  key={key}
                  onClick={() => update('position', key as Position)}
                  className={`py-3 px-2 rounded-lg font-bold text-sm transition border ${
                    draft.position === key
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-stone-950 border-stone-700 text-stone-400 hover:border-stone-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => update('ballHandler', !draft.ballHandler)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition ${
              draft.ballHandler
                ? 'bg-sky-500/15 border-sky-500/50 text-sky-300'
                : 'bg-stone-950 border-stone-700 text-stone-400 hover:border-stone-500'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm">
              🏀 רכז
            </div>
            <div className={`w-10 h-5 rounded-full transition relative ${draft.ballHandler ? 'bg-sky-500' : 'bg-stone-700'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${draft.ballHandler ? 'right-0.5' : 'left-0.5'}`} />
            </div>
          </button>

          <button
            type="button"
            onClick={() => update('isGuest', !draft.isGuest)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition ${
              draft.isGuest
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                : 'bg-stone-950 border-stone-700 text-stone-400 hover:border-stone-500'
            }`}
          >
            <div className="flex flex-col items-start gap-0.5">
              <span className="font-bold text-sm">👤 שחקן אורח</span>
              {draft.isGuest && <span className="text-[10px] text-amber-400/70">יימחק אוטומטית אחרי 24 שעות</span>}
            </div>
            <div className={`w-10 h-5 rounded-full transition relative ${draft.isGuest ? 'bg-amber-500' : 'bg-stone-700'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${draft.isGuest ? 'right-0.5' : 'left-0.5'}`} />
            </div>
          </button>

          {showPhone && !draft.isGuest && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">
                טלפון (לרשימת שחקנים)
              </label>
              <div className="relative">
                <Phone size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0501234567"
                  dir="ltr"
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg pr-9 pl-4 py-3 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>
          )}

          <div className="bg-gradient-to-l from-sky-500/10 to-sky-500/5 border border-sky-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-black text-sky-300">יכולת כללית</div>
                <div className="text-xs text-stone-500">תרומה לקבוצה — משקל עיקרי באיזון</div>
              </div>
              <span className="text-2xl font-black tabular-nums text-sky-400">{draft.generalRating}</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={draft.generalRating}
              onChange={e => update('generalRating', parseInt(e.target.value) as DraftState['generalRating'])}
              className="w-full accent-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">
              קטגוריות (1–10)
            </label>
            <div className="space-y-3">
              {CATEGORIES.map(cat => (
                <div key={cat.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-stone-300 font-medium">{cat.label}</span>
                    <span className="text-sm font-black tabular-nums text-stone-100 bg-stone-800 px-2 py-0.5 rounded">
                      {draft[cat.key as keyof DraftState] as number}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={draft[cat.key as keyof DraftState] as number}
                    onChange={e =>
                      update(
                        cat.key as keyof DraftState,
                        parseInt(e.target.value) as DraftState[typeof cat.key]
                      )
                    }
                    className="w-full accent-orange-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-l from-orange-500/20 to-orange-500/5 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-orange-300/80 font-bold uppercase tracking-wider">
                דירוג כללי
              </div>
              <div className="text-xs text-stone-500">(ממוצע כל הקטגוריות)</div>
            </div>
            <div className="text-4xl font-black text-orange-400 tabular-nums">{overall}</div>
          </div>
        </div>

        <div className="px-6 py-4 bg-stone-950 border-t border-stone-700 flex items-center justify-between gap-3">
          {player ? (
            <button
              onClick={() => { onDelete(player.id); onClose(); }}
              className="text-rose-400 hover:text-rose-300 font-bold text-sm flex items-center gap-1.5"
            >
              <Trash2 size={16} />מחק
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold transition"
            >
              ביטול
            </button>
            <button
              onClick={() => {
                if (isValid) {
                  onSave(draft.id ? (draft as Player) : (draft as PlayerDraft), phone.trim() || undefined);
                  onClose();
                }
              }}
              disabled={!isValid}
              className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:bg-stone-700 disabled:text-stone-500 text-white font-bold transition flex items-center gap-1.5"
            >
              <Save size={16} />שמירה
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
