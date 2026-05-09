import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Users,
  Plus,
  Shuffle,
  Sparkles,
  TrendingUp,
  Loader2,
  Search,
  CheckSquare,
  Eraser,
  UserCheck,
  RefreshCw,
  Share2,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import type { Player, PlayerDraft, Position } from './types/player';
import { api } from './api/players';
import { TEAM_COLORS, ATTENDING_KEY, TEAMS_COUNT_KEY, LOCKED_KEY } from './lib/constants';
import { computeOverall, teamSum, generateBalancedTeams } from './lib/teams';
import { shareOnWhatsApp } from './lib/share';
import PlayerModal from './components/PlayerModal';
import PlayerCard from './components/PlayerCard';
import TeamCard from './components/TeamCard';

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [attending, setAttending] = useState<Set<string>>(new Set());
  const [numTeams, setNumTeams] = useState(3);
  const [teams, setTeams] = useState<Player[][] | null>(null);
  const [editing, setEditing] = useState<Player | 'new' | null>(null);
  const [search, setSearch] = useState('');
  const [filterPos, setFilterPos] = useState<'all' | Position>('all');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
const [locked, setLocked] = useState<Map<string, number>>(() => {
    try {
      const raw = localStorage.getItem(LOCKED_KEY);
      if (!raw) return new Map();
      return new Map(JSON.parse(raw) as [string, number][]);
    } catch {
      return new Map();
    }
  });
  const [draggingPlayer, setDraggingPlayer] = useState<{ player: Player; fromTeamIdx: number } | null>(null);
  const [touchDragTargetIdx, setTouchDragTargetIdx] = useState<number | null>(null);
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('isAdmin') === '1');
  const [editingAsGuest, setEditingAsGuest] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminLoading, setAdminLoading] = useState(false);
  // useRef imported for potential future use; satisfies linter
  const _ref = useRef(null);
  void _ref;

  useEffect(() => {
    (async () => {
      try {
        const fetched = await api.getAll();
        setPlayers(fetched);
        const savedAttending = localStorage.getItem(ATTENDING_KEY);
        if (savedAttending) setAttending(new Set(JSON.parse(savedAttending) as string[]));
        const savedCount = localStorage.getItem(TEAMS_COUNT_KEY);
        if (savedCount) setNumTeams(parseInt(savedCount) || 3);
      } catch (e) {
        console.error('Failed to load players', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persistAttending = (next: Set<string>) => {
    setAttending(next);
    localStorage.setItem(ATTENDING_KEY, JSON.stringify([...next]));
  };

  const persistTeamsCount = (n: number) => {
    setNumTeams(n);
    localStorage.setItem(TEAMS_COUNT_KEY, String(n));
  };

  const persistLocked = (next: Map<string, number>) => {
    setLocked(next);
    localStorage.setItem(LOCKED_KEY, JSON.stringify([...next]));
  };

  const handleLockToggle = (playerId: string, teamIdx: number | null) => {
    const next = new Map(locked);
    if (teamIdx === null || locked.get(playerId) === teamIdx) next.delete(playerId);
    else next.set(playerId, teamIdx);
    persistLocked(next);
  };

  const handleClearLocks = () => persistLocked(new Map());

  const handleDrop = (playerId: string, fromTeamIdx: number, toTeamIdx: number) => {
    if (fromTeamIdx === toTeamIdx) return;
    setTeams((prev) => {
      if (!prev) return prev;
      const next = prev.map((t) => [...t]);
      const src = next[fromTeamIdx];
      const tgt = next[toTeamIdx];
      if (!src || !tgt) return prev;
      const idx = src.findIndex((p) => p.id === playerId);
      if (idx === -1) return prev;
      const [player] = src.splice(idx, 1);
      tgt.push(player!);
      return next;
    });
  };

  const handleSave = async (data: Player | PlayerDraft) => {
    if ('id' in data) {
      const updated = await api.update(data.id, data);
      setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    } else {
      const created = await api.create(data);
      setPlayers((prev) => [...prev, created]);
    }
    setTeams(null);
  };

  const handleDelete = async (id: string) => {
    await api.remove(id);
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    const next = new Set(attending);
    next.delete(id);
    persistAttending(next);
    const nextLocked = new Map(locked);
    nextLocked.delete(id);
    persistLocked(nextLocked);
    setTeams(null);
  };

  const toggleAttending = (id: string) => {
    const next = new Set(attending);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    persistAttending(next);
    setTeams(null);
  };

  const selectAllVisible = (ids: string[]) => {
    const next = new Set(attending);
    ids.forEach((id) => next.add(id));
    persistAttending(next);
    setTeams(null);
  };

  const clearAttending = () => {
    persistAttending(new Set());
    setTeams(null);
  };

  const handleGenerate = () => {
    const attendingPlayers = players.filter((p) => attending.has(p.id));
    if (attendingPlayers.length < numTeams * 2) return;
    setGenerating(true);
    setTeams(null);
    setTimeout(() => {
      const result = generateBalancedTeams(attendingPlayers, numTeams, false, locked);
      setTeams(result);
      setGenerating(false);
      setTimeout(() => {
        document.getElementById('teams-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }, 400);
  };

  const handleReshuffle = () => {
    const attendingPlayers = players.filter((p) => attending.has(p.id));
    if (attendingPlayers.length < numTeams * 2) return;
    setGenerating(true);
    setTeams(null);
    setTimeout(() => {
      setTeams(generateBalancedTeams(attendingPlayers, numTeams, true, locked));
      setGenerating(false);
    }, 400);
  };

  const handleAdminLogin = async () => {
    if (!adminPasswordInput) return;
    setAdminLoading(true);
    setAdminError('');
    try {
      const ok = await api.verifyAdmin(adminPasswordInput);
      if (ok) {
        sessionStorage.setItem('isAdmin', '1');
        setIsAdmin(true);
        setShowAdminModal(false);
        setAdminPasswordInput('');
      }
    } catch {
      setAdminError('סיסמה שגויה');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('isAdmin');
    setIsAdmin(false);
  };

  const filteredPlayers = useMemo(() => {
    let result = players;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (filterPos !== 'all') result = result.filter((p) => p.position === filterPos);
    return [...result].sort((a, b) => {
      const aAtt = attending.has(a.id) ? 1 : 0;
      const bAtt = attending.has(b.id) ? 1 : 0;
      if (aAtt !== bAtt) return bAtt - aAtt;
      return computeOverall(b) - computeOverall(a);
    });
  }, [players, search, filterPos, attending]);

  const attendingCount = attending.size;

  if (loading) {
    return (
      <div className='min-h-screen bg-stone-950 flex items-center justify-center'>
        <Loader2 className='animate-spin text-orange-500' size={36} />
      </div>
    );
  }

  return (
    <div
      dir='rtl'
      className='min-h-screen bg-stone-950 text-stone-100'
      style={{
        fontFamily: "'Rubik', system-ui, -apple-system, sans-serif",
        backgroundImage:
          'radial-gradient(circle at 20% 0%, rgba(249,115,22,0.08), transparent 50%), radial-gradient(circle at 80% 100%, rgba(16,185,129,0.06), transparent 50%)',
      }}
    >
      <style>{`
        input[type="range"] { -webkit-appearance: none; height: 6px; background: #292524; border-radius: 3px; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #f97316; border-radius: 50%; cursor: pointer; border: 2px solid #1c1917; }
        input[type="range"]::-moz-range-thumb { width: 18px; height: 18px; background: #f97316; border-radius: 50%; cursor: pointer; border: 2px solid #1c1917; }
      `}</style>

      <div className='max-w-6xl mx-auto px-4 py-6 md:py-8'>
        <header className='mb-6'>
          <div className='flex items-start justify-between'>
            <div>
              <div className='flex items-center gap-2 text-orange-400 text-xs font-black uppercase tracking-[0.25em] mb-1'>
                <span className='w-8 h-px bg-orange-500' />
                BASKETBALL · 5 ON 5
              </div>
              <h1 className='text-3xl md:text-5xl font-black tracking-tight leading-none'>
                Hoop<span className='text-orange-500'>Teams</span>
              </h1>
              <p className='text-stone-400 text-sm mt-2 max-w-md'>סמן מי הגיע היום וקבל קבוצות מאוזנות בלחיצה</p>
            </div>
            <button
              onClick={() => isAdmin ? handleAdminLogout() : setShowAdminModal(true)}
              className={`mt-1 flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition ${
                isAdmin
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                  : 'bg-stone-900 border-stone-700 text-stone-500 hover:text-stone-300 hover:border-stone-600'
              }`}
              title={isAdmin ? 'צא ממצב מנהל' : 'כניסת מנהל'}
            >
              {isAdmin ? <><ShieldCheck size={14} /> מנהל</> : <Lock size={14} />}
            </button>
          </div>
        </header>

        <div className='bg-gradient-to-l from-stone-900 to-stone-900/50 border border-stone-800 rounded-2xl p-4 mb-6'>
          <div className='flex flex-wrap items-center gap-3 md:gap-4'>
            <div className='flex items-baseline gap-2'>
              <UserCheck size={20} className='text-orange-400 self-center' />
              <div>
                <span className='text-3xl font-black tabular-nums text-orange-400'>{attendingCount}</span>
                <span className='text-sm text-stone-500 mr-1'>/ {players.length} שחקנים</span>
              </div>
            </div>
            <div className='flex items-center gap-2 mr-auto'>
              <span className='text-xs text-stone-500 font-bold'>קבוצות:</span>
              <div className='flex bg-stone-950 border border-stone-700 rounded-lg overflow-hidden'>
                {[2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={isAdmin ? () => persistTeamsCount(n) : undefined}
                    className={`px-3 py-1.5 text-sm font-black tabular-nums transition ${
                      numTeams === n ? 'bg-orange-500 text-white' : isAdmin ? 'text-stone-400 hover:text-stone-100' : 'text-stone-600 cursor-default'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={!isAdmin || attendingCount < numTeams * 2 || generating}
              className='bg-orange-500 hover:bg-orange-400 disabled:bg-stone-800 disabled:text-stone-600 disabled:cursor-not-allowed text-white font-black px-5 md:px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-orange-500/20'
            >
              {generating ? (
                <>
                  <Loader2 className='animate-spin' size={18} />
                  מאזן...
                </>
              ) : (
                <>
                  <Shuffle size={18} />
                  צור קבוצות
                </>
              )}
            </button>
            {isAdmin && locked.size > 0 && (
              <button
                onClick={handleClearLocks}
                className='text-xs text-stone-500 hover:text-amber-400 font-bold transition flex items-center gap-1'
              >
                <Lock size={12} />
                נקה נעילות
              </button>
            )}
          </div>
          {attendingCount > 0 && attendingCount < numTeams * 2 && (
            <p className='text-xs text-amber-400 mt-2 mr-7'>
              ⚠️ נדרשים לפחות {numTeams * 2} שחקנים ל-{numTeams} קבוצות
            </p>
          )}
        </div>

        {teams && teams.length > 0 && (
          <section id='teams-section' className='mb-8'>
            <div className='flex items-center justify-between mb-4 flex-wrap gap-2'>
              <h2 className='text-2xl font-black flex items-center gap-2'>
                <Sparkles className='text-orange-400' size={22} />
                הקבוצות
              </h2>
              <div className='flex items-center gap-2'>
                <div className='text-xs text-stone-400 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-lg flex items-center gap-2'>
                  <TrendingUp size={14} />
                  <span>
                    הפרש:{' '}
                    <strong className='text-stone-200 tabular-nums'>
                      {(teamSum(teams[0]!) - teamSum(teams[teams.length - 1]!)).toFixed(0)}
                    </strong>
                  </span>
                </div>
                <button
                  onClick={() => shareOnWhatsApp(teams)}
                  className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-900 hover:bg-green-800 text-green-400 font-bold text-xs transition border border-green-800'
                  title='שתף בוואטסאפ'
                >
                  <Share2 size={14} />
                  שתף
                </button>
                <button
                  onClick={handleReshuffle}
                  disabled={!isAdmin || generating}
                  className='flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed text-stone-300 font-bold text-xs transition border border-stone-700'
                  title='סדר מחדש'
                >
                  {generating ? <Loader2 size={14} className='animate-spin' /> : <RefreshCw size={14} />}
                  סדר מחדש
                </button>
              </div>
            </div>
            <div
              className={`grid grid-cols-1 ${
                teams.length === 2 ? 'md:grid-cols-2' : teams.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'
              } gap-4`}
            >
              {teams.map((team, idx) => (
                <TeamCard
                  key={idx}
                  team={team}
                  color={TEAM_COLORS[idx % TEAM_COLORS.length]!}
                  teamIdx={idx}
                  onDragStart={(player) => setDraggingPlayer({ player, fromTeamIdx: idx })}
                  onDrop={handleDrop}
                  onDragEnd={() => { setDraggingPlayer(null); setTouchDragTargetIdx(null); }}
                  draggingPlayer={draggingPlayer}
                  locked={locked}
                  onLockToggle={handleLockToggle}
                  isTouchDragOver={touchDragTargetIdx === idx}
                  onTouchDragOver={setTouchDragTargetIdx}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          </section>
        )}

        <section className='mb-8'>
          <div className='flex items-center justify-between mb-3 flex-wrap gap-2'>
            <h2 className='text-lg font-black flex items-center gap-2'>
              <Users size={18} className='text-stone-400' />
              סגל
              <span className='text-xs font-bold text-stone-500 bg-stone-800 px-2 py-0.5 rounded tabular-nums'>{players.length}</span>
            </h2>
            {isAdmin && (
              <div className='flex gap-2'>
                <button
                  onClick={() => { setEditingAsGuest(false); setEditing('new'); }}
                  className='bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-100 font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition text-sm'
                >
                  <Plus size={16} />
                  שחקן חדש
                </button>
                <button
                  onClick={() => { setEditingAsGuest(true); setEditing('new'); }}
                  className='bg-amber-500/10 hover:bg-amber-500/20 border border-amber-600/40 text-amber-400 font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition text-sm'
                >
                  <Plus size={16} />
                  אורח
                </button>
              </div>
            )}
          </div>

          {players.length > 0 && (
            <div className='bg-stone-900 border border-stone-800 rounded-xl p-3 mb-3'>
              <div className='flex flex-wrap gap-2 items-center'>
                <div className='relative flex-1 min-w-[180px]'>
                  <Search size={16} className='absolute right-3 top-1/2 -translate-y-1/2 text-stone-500' />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder='חיפוש שחקן...'
                    className='w-full bg-stone-950 border border-stone-700 rounded-lg pr-9 pl-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-stone-600 transition'
                  />
                </div>
                <div className='flex bg-stone-950 border border-stone-700 rounded-lg overflow-hidden text-xs'>
                  {(
                    [
                      { key: 'all', label: 'הכול' },
                      { key: 'guard', label: 'G' },
                      { key: 'forward', label: 'F' },
                      { key: 'center', label: 'C' },
                    ] as { key: 'all' | Position; label: string }[]
                  ).map((f) => (
                    <button
                      key={f.key}
                      onClick={() => setFilterPos(f.key)}
                      className={`px-3 py-2 font-bold transition ${
                        filterPos === f.key ? 'bg-stone-700 text-stone-100' : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                {isAdmin && (
                  <div className='flex gap-1'>
                    <button
                      onClick={() => selectAllVisible(filteredPlayers.map((p) => p.id))}
                      className='bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition text-xs'
                      title='סמן את כל המוצגים'
                    >
                      <CheckSquare size={14} />
                      בחר הכל
                    </button>
                    {attendingCount > 0 && (
                      <button
                        onClick={clearAttending}
                        className='bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-rose-400 font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition text-xs'
                        title='נקה את כל הסימונים'
                      >
                        <Eraser size={14} />
                        נקה
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {players.length === 0 ? (
            <div className='bg-stone-900/50 border-2 border-dashed border-stone-800 rounded-2xl p-12 text-center'>
              <div className='text-5xl mb-3'>🏀</div>
              <h3 className='text-xl font-black mb-1'>בנה את הסגל שלך</h3>
              <p className='text-stone-400 text-sm mb-5'>
                הוסף את כל השחקנים בקבוצה.
                <br />
                בכל פעם שתבוא לשחק תסמן רק מי שהגיע.
              </p>
              {isAdmin && (
                <button
                  onClick={() => setEditing('new')}
                  className='bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-lg inline-flex items-center gap-2'
                >
                  <Plus size={16} />
                  הוסף שחקן ראשון
                </button>
              )}
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className='bg-stone-900/50 border border-stone-800 rounded-xl p-8 text-center'>
              <p className='text-stone-500 text-sm'>לא נמצאו שחקנים</p>
            </div>
          ) : (
            <div className='max-h-[55vh] md:max-h-none overflow-y-auto'>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2'>
                {filteredPlayers.map((p) => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    attending={attending.has(p.id)}
                    onToggle={() => toggleAttending(p.id)}
                    onEdit={() => setEditing(p)}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <footer className='text-center text-xs text-stone-600 mt-12 pb-4'>
          <p>לחץ על שחקן לסימון נוכחות · אייקון העיפרון לעריכה · נשמר אוטומטית</p>
        </footer>
      </div>

      {editing && (
        <PlayerModal
          player={editing === 'new' ? null : editing}
          defaultIsGuest={editing === 'new' ? editingAsGuest : undefined}
          onSave={handleSave}
          onClose={() => { setEditing(null); setEditingAsGuest(false); }}
          onDelete={handleDelete}
        />
      )}

      {showAdminModal && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4'
          onClick={() => { setShowAdminModal(false); setAdminPasswordInput(''); setAdminError(''); }}
        >
          <div
            className='w-full max-w-sm bg-stone-900 border border-stone-700 rounded-2xl p-6 shadow-2xl'
            onClick={(e) => e.stopPropagation()}
            dir='rtl'
          >
            <div className='flex items-center gap-2 mb-4'>
              <Lock size={18} className='text-amber-400' />
              <h3 className='text-lg font-black'>כניסת מנהל</h3>
            </div>
            <p className='text-stone-400 text-sm mb-4'>הזן את הסיסמה כדי לערוך שחקנים</p>
            <input
              autoFocus
              type='password'
              value={adminPasswordInput}
              onChange={(e) => { setAdminPasswordInput(e.target.value); setAdminError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdminLogin(); }}
              placeholder='סיסמה'
              className='w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-500/60 transition mb-1'
            />
            {adminError && <p className='text-rose-400 text-xs mb-3'>{adminError}</p>}
            {!adminError && <div className='mb-3' />}
            <div className='flex gap-2 justify-end'>
              <button
                onClick={() => { setShowAdminModal(false); setAdminPasswordInput(''); setAdminError(''); }}
                className='px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 font-bold text-sm'
              >
                ביטול
              </button>
              <button
                onClick={handleAdminLogin}
                disabled={adminLoading || !adminPasswordInput}
                className='px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 font-bold text-sm text-stone-900 flex items-center gap-1.5'
              >
                {adminLoading ? <Loader2 size={14} className='animate-spin' /> : <Unlock size={14} />}
                כניסה
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
