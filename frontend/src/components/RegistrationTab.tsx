import { useState, useEffect, useCallback } from 'react';
import { Phone, CheckCircle2, Clock, Lock, RefreshCw, LogOut, Loader2, Users, UserCheck, Share2 } from 'lucide-react';
import { registrationApi } from '../api/registration';
import type { RegistrationState, RegisterResult } from '../types/registration';

export default function RegistrationTab() {
  const [state, setState] = useState<RegistrationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [myResult, setMyResult] = useState<RegisterResult | null>(null);
  const [unregistering, setUnregistering] = useState(false);

  const fetchState = useCallback(async () => {
    try {
      const data = await registrationApi.getState();
      setState(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 30_000);
    return () => clearInterval(interval);
  }, [fetchState]);

  const handleRegister = async () => {
    if (!phone.trim()) { setError('הזן מספר טלפון'); return; }
    if (!name.trim()) { setError('הזן את השם שלך'); return; }
    setSubmitting(true);
    setError('');
    try {
      const result = await registrationApi.register(phone.trim(), name.trim());
      setMyResult(result);
      await fetchState();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'שגיאה, נסה שוב';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnregister = async () => {
    if (!phone.trim()) return;
    setUnregistering(true);
    try {
      await registrationApi.unregister(phone.trim());
      setMyResult(null);
      setPhone('');
      setName('');
      await fetchState();
    } catch {
      // silent
    } finally {
      setUnregistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  if (!state) return null;

  const confirmed = state.registrations.filter(r => r.status === 'confirmed');
  const waitlist = state.registrations.filter(r => r.status === 'waitlist');
  const spotsLeft = Math.max(0, state.maxPlayers - confirmed.length);

  const registeredNames = new Set(state.registrations.map(r => r.displayName));
  const waitlistNames = new Set(waitlist.map(r => r.displayName));

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-black text-stone-100">
              {state.gameLabel || 'הרשמה למשחק'}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {state.isOpen ? (
                <>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    הרשמה פתוחה
                  </span>
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`📣 ההרשמה פתוחה${state.gameLabel ? ` ל${state.gameLabel}` : ''}!\nלהרשמה: ${window.location.href}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-600/15 border border-emerald-600/30 hover:bg-emerald-600/25 rounded-full px-2.5 py-1 transition min-h-[28px]"
                  >
                    <Share2 size={11} />
                    שתף בוואטסאפ
                  </a>
                </>
              ) : state.opensAt ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-1">
                  <Clock size={11} />
                  נפתחת {new Date(state.opensAt).toLocaleString('he-IL', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 bg-stone-800 border border-stone-700 rounded-full px-2.5 py-1">
                  <Lock size={11} />
                  הרשמה סגורה
                </span>
              )}
            </div>
          </div>
          <button onClick={fetchState} className="text-stone-600 hover:text-stone-400 p-1 transition" title="רענן">
            <RefreshCw size={15} />
          </button>
        </div>

        {myResult ? (
          <div className={`rounded-xl p-4 border ${
            myResult.status === 'confirmed'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {myResult.status === 'confirmed' ? (
                  <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
                ) : (
                  <Clock size={22} className="text-amber-400 shrink-0" />
                )}
                <div>
                  <div className={`font-black text-sm ${myResult.status === 'confirmed' ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {myResult.status === 'confirmed' ? 'אתה מגיע! 🏀' : 'אתה ברשימת ההמתנה'}
                  </div>
                  <div className="text-xs text-stone-400 mt-0.5">
                    {myResult.displayName} · מקום #{myResult.position}
                  </div>
                </div>
              </div>
              <button
                onClick={handleUnregister}
                disabled={unregistering}
                className="text-xs text-stone-500 hover:text-rose-400 font-bold flex items-center gap-1 transition"
              >
                {unregistering ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                ביטול הרשמה
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleRegister(); }}
              placeholder="השם שלך"
              className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/60 transition"
            />
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter') handleRegister(); }}
                  placeholder="מספר טלפון (0501234567)"
                  dir="ltr"
                  className="w-full bg-stone-950 border border-stone-700 rounded-xl pr-9 pl-3 py-3 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/60 transition"
                />
              </div>
              <button
                onClick={handleRegister}
                disabled={submitting || !state.isOpen}
                className="bg-orange-500 hover:bg-orange-400 disabled:bg-stone-800 disabled:text-stone-600 disabled:cursor-not-allowed text-white font-black px-4 py-3 rounded-xl flex items-center gap-1.5 transition text-sm shrink-0"
              >
                {submitting ? <Loader2 size={15} className="animate-spin" /> : 'הרשם'}
              </button>
            </div>
            {error && <p className="text-rose-400 text-xs">{error}</p>}
          </div>
        )}
      </div>

      {/* Spots counter */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-emerald-400 tabular-nums">{confirmed.length}</div>
          <div className="text-[10px] text-stone-500 font-bold uppercase mt-0.5">מגיעים</div>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-stone-300 tabular-nums">{state.maxPlayers}</div>
          <div className="text-[10px] text-stone-500 font-bold uppercase mt-0.5">מקומות</div>
        </div>
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 text-center">
          <div className={`text-2xl font-black tabular-nums ${spotsLeft > 0 ? 'text-orange-400' : 'text-rose-400'}`}>{spotsLeft}</div>
          <div className="text-[10px] text-stone-500 font-bold uppercase mt-0.5">נותרו</div>
        </div>
      </div>

      {/* Confirmed list */}
      {confirmed.length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-800">
            <Users size={15} className="text-emerald-400" />
            <span className="text-sm font-black text-emerald-400">מגיעים ({confirmed.length}/{state.maxPlayers})</span>
          </div>
          <div className="divide-y divide-stone-800/50">
            {confirmed.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-emerald-400 tabular-nums">{r.position}</span>
                </div>
                <span className="text-sm font-bold text-stone-200 flex-1">{r.displayName}</span>
                <CheckCircle2 size={14} className="text-emerald-500/60" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Waitlist */}
      {waitlist.length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-800">
            <Clock size={15} className="text-amber-400" />
            <span className="text-sm font-black text-amber-400">רשימת המתנה ({waitlist.length})</span>
          </div>
          <div className="divide-y divide-stone-800/50">
            {waitlist.map(r => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 opacity-70">
                <div className="w-6 h-6 rounded-full bg-stone-700 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-stone-400 tabular-nums">{r.position}</span>
                </div>
                <span className="text-sm font-bold text-stone-400 flex-1">{r.displayName}</span>
                <Clock size={14} className="text-amber-500/50" />
              </div>
            ))}
          </div>
        </div>
      )}

      {state.registrations.length === 0 && (
        <div className="bg-stone-900/50 border-2 border-dashed border-stone-800 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-stone-500 text-sm">עדיין אף אחד לא נרשם</p>
        </div>
      )}

      {/* Group members — only visible once someone has registered */}
      {state.members.length > 0 && state.registrations.length > 0 && (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-800">
            <UserCheck size={15} className="text-stone-400" />
            <span className="text-sm font-black text-stone-300">חברי הקבוצה</span>
            <span className="text-xs font-bold text-stone-600 bg-stone-800 px-1.5 py-0.5 rounded tabular-nums">{state.members.length}</span>
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {state.members.map((m, i) => {
              const isConfirmed = registeredNames.has(m.name) && !waitlistNames.has(m.name);
              const isWaitlist = waitlistNames.has(m.name);
              return (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                    isConfirmed
                      ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-300'
                      : isWaitlist
                      ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400'
                      : 'bg-stone-800/50 border border-stone-700/50 text-stone-500'
                  }`}
                >
                  {isConfirmed ? (
                    <CheckCircle2 size={11} className="text-emerald-400 shrink-0" />
                  ) : isWaitlist ? (
                    <Clock size={11} className="text-amber-400 shrink-0" />
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-600 shrink-0" />
                  )}
                  <span className="truncate">{m.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
