import { useState, useEffect, useCallback } from 'react';
import {
  Settings, Users, Phone, Plus, Trash2, CheckCircle2, Clock,
  Loader2, X, Link, Unlink
} from 'lucide-react';
import { registrationApi } from '../api/registration';
import { api as playerApi } from '../api/players';
import type { RegistrationState, AllowedPhone, RegistrationEntry } from '../types/registration';
import type { Player } from '../types/player';

interface Props {
  adminPassword: string;
}

export default function AdminRegistrationPanel({ adminPassword }: Props) {
  const [state, setState] = useState<RegistrationState | null>(null);
  const [allowedPhones, setAllowedPhones] = useState<AllowedPhone[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [linkingId, setLinkingId] = useState<string | null>(null);

  // Settings form
  const [gameLabel, setGameLabel] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [opensAt, setOpensAt] = useState('');
  const [maxPlayers, setMaxPlayers] = useState(18);

  // Add phone form
  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [addingPhone, setAddingPhone] = useState(false);
  const [addError, setAddError] = useState('');

  // Confirm clear
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [s, phones, allPlayers] = await Promise.all([
        registrationApi.getState(),
        registrationApi.getAllowedPhones(adminPassword),
        playerApi.getAll(),
      ]);
      setState(s);
      setAllowedPhones(phones);
      setPlayers(allPlayers);
      setGameLabel(s.gameLabel);
      setIsOpen(s.isOpen);
      setMaxPlayers(s.maxPlayers);
      setOpensAt(s.opensAt ? new Date(s.opensAt).toISOString().slice(0, 16) : '');
    } finally {
      setLoading(false);
    }
  }, [adminPassword]);

  useEffect(() => { load(); }, [load]);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await registrationApi.updateSettings(adminPassword, {
        gameLabel,
        isOpen,
        maxPlayers,
        opensAt: opensAt ? new Date(opensAt).toISOString() : null,
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleAddPhone = async () => {
    if (!newPhone.trim()) { setAddError('נדרש מספר טלפון'); return; }
    setAddingPhone(true);
    setAddError('');
    try {
      await registrationApi.addAllowedPhone(adminPassword, newPhone.trim(), newName.trim());
      setNewPhone('');
      setNewName('');
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'שגיאה';
      setAddError(msg);
    } finally {
      setAddingPhone(false);
    }
  };

  const handleRemovePhone = async (id: string) => {
    try {
      await registrationApi.removeAllowedPhone(adminPassword, id);
      setAllowedPhones(prev => prev.filter(p => p.id !== id));
    } catch {
      alert('שגיאה במחיקה, נסה שוב');
    }
  };

  const handleLinkPlayer = async (phoneId: string, playerId: string | null) => {
    setLinkingId(phoneId);
    try {
      const updated = await registrationApi.linkPhoneToPlayer(adminPassword, phoneId, playerId);
      setAllowedPhones(prev => prev.map(p => p.id === phoneId ? updated : p));
    } finally {
      setLinkingId(null);
    }
  };

  const handleRemoveRegistration = async (id: string) => {
    await registrationApi.removeRegistration(adminPassword, id);
    setState(prev => prev ? { ...prev, registrations: prev.registrations.filter(r => r.id !== id) } : prev);
  };

  const handleClearAll = async () => {
    setClearing(true);
    try {
      await registrationApi.clearRegistrations(adminPassword);
      setState(prev => prev ? { ...prev, registrations: [] } : prev);
      setConfirmClear(false);
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-orange-500" size={32} />
      </div>
    );
  }

  const confirmed = (state?.registrations ?? []).filter((r: RegistrationEntry) => r.status === 'confirmed');
  const waitlist = (state?.registrations ?? []).filter((r: RegistrationEntry) => r.status === 'waitlist');

  return (
    <div className="space-y-5">
      {/* Game settings */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-black flex items-center gap-2 text-stone-200">
          <Settings size={16} className="text-orange-400" />
          הגדרות משחק
        </h3>

        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">שם המשחק (מוצג לחברים)</label>
          <input
            value={gameLabel}
            onChange={e => setGameLabel(e.target.value)}
            placeholder='למשל: "שישי 23/05 – מגרש פאוולי"'
            className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/60 transition"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">מקסימום שחקנים</label>
            <div className="flex gap-1">
              {[12, 15, 16, 18, 20].map(n => (
                <button
                  key={n}
                  onClick={() => setMaxPlayers(n)}
                  className={`flex-1 py-2 rounded-lg text-xs font-black tabular-nums transition border ${
                    maxPlayers === n
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-stone-950 border-stone-700 text-stone-400 hover:border-stone-500'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">פתיחה אוטומטית ב</label>
            <input
              type="datetime-local"
              value={opensAt}
              onChange={e => setOpensAt(e.target.value)}
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-orange-500/60 transition"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOpen(v => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${isOpen ? 'bg-emerald-500' : 'bg-stone-700'}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${isOpen ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <span className={`text-sm font-bold ${isOpen ? 'text-emerald-400' : 'text-stone-500'}`}>
              {isOpen ? 'הרשמה פתוחה' : 'הרשמה סגורה'}
            </span>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-black px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 transition"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : null}
            שמור הגדרות
          </button>
        </div>
      </div>

      {/* Registrations list */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800">
          <h3 className="text-base font-black flex items-center gap-2 text-stone-200">
            <Users size={16} className="text-orange-400" />
            רשימת נרשמים ({state?.registrations.length ?? 0})
          </h3>
          {(state?.registrations.length ?? 0) > 0 && (
            <button
              onClick={() => setConfirmClear(true)}
              className="text-xs text-stone-600 hover:text-rose-400 font-bold flex items-center gap-1 transition"
            >
              <Trash2 size={12} />
              נקה הכל
            </button>
          )}
        </div>

        {confirmed.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-emerald-500/5 border-b border-stone-800/50">
              <span className="text-xs font-black text-emerald-500 uppercase tracking-wider">מגיעים ({confirmed.length})</span>
            </div>
            {confirmed.map((r: RegistrationEntry) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-stone-800/30">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-emerald-400">{r.position}</span>
                </div>
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span className="text-sm font-bold text-stone-200 flex-1">{r.displayName}</span>
                <span className="text-xs text-stone-600 tabular-nums">{r.phone}</span>
                <button onClick={() => handleRemoveRegistration(r.id)} className="text-stone-700 hover:text-rose-400 transition p-0.5">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {waitlist.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-amber-500/5 border-b border-stone-800/50">
              <span className="text-xs font-black text-amber-500 uppercase tracking-wider">המתנה ({waitlist.length})</span>
            </div>
            {waitlist.map((r: RegistrationEntry) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-stone-800/30 opacity-70">
                <div className="w-6 h-6 rounded-full bg-stone-700 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-stone-400">{r.position}</span>
                </div>
                <Clock size={13} className="text-amber-500 shrink-0" />
                <span className="text-sm font-bold text-stone-400 flex-1">{r.displayName}</span>
                <span className="text-xs text-stone-600 tabular-nums">{r.phone}</span>
                <button onClick={() => handleRemoveRegistration(r.id)} className="text-stone-700 hover:text-rose-400 transition p-0.5">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {(state?.registrations.length ?? 0) === 0 && (
          <div className="px-4 py-8 text-center text-stone-600 text-sm">עדיין אין נרשמים</div>
        )}
      </div>

      {/* Allowed phones */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-stone-800">
          <h3 className="text-base font-black flex items-center gap-2 text-stone-200">
            <Phone size={16} className="text-orange-400" />
            רשימת מורשים ({allowedPhones.length})
          </h3>
        </div>

        {/* Add single phone */}
        <div className="p-4 border-b border-stone-800">
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => { setNewName(e.target.value); setAddError(''); }}
              placeholder="שם (אופציונלי)"
              className="flex-1 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/60 transition"
            />
            <input
              value={newPhone}
              onChange={e => { setNewPhone(e.target.value); setAddError(''); }}
              placeholder="0501234567"
              dir="ltr"
              className="w-32 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/60 transition"
            />
            <button
              onClick={handleAddPhone}
              disabled={addingPhone}
              className="bg-stone-700 hover:bg-stone-600 disabled:opacity-50 text-stone-100 font-bold px-3 py-2 rounded-lg transition"
            >
              {addingPhone ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            </button>
          </div>
          {addError && <p className="text-rose-400 text-xs mt-1">{addError}</p>}
        </div>

        {/* Phones list */}
        <div className="divide-y divide-stone-800/40 max-h-96 overflow-y-auto">
          {allowedPhones.map(p => (
            <div key={p.id} className="px-4 py-2.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-stone-200">
                    {p.name || <span className="text-stone-600 italic">ללא שם</span>}
                  </span>
                  <span className="text-xs text-stone-600 tabular-nums mr-2" dir="ltr">{p.phone}</span>
                </div>
                {linkingId === p.id
                  ? <Loader2 size={13} className="animate-spin text-stone-500 shrink-0" />
                  : <button onClick={() => handleRemovePhone(p.id)} className="text-stone-500 hover:text-rose-400 transition p-0.5 shrink-0"><X size={14} /></button>
                }
              </div>
              {/* Player link dropdown */}
              <div className="flex items-center gap-2">
                {p.player
                  ? <span className="inline-flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                      <Link size={10} />{p.player.name}
                    </span>
                  : <span className="text-xs text-stone-600 italic">לא משוייך לשחקן</span>
                }
                <select
                  value={p.playerId ?? ''}
                  onChange={e => handleLinkPlayer(p.id, e.target.value || null)}
                  disabled={linkingId === p.id}
                  className="mr-auto text-xs bg-stone-800 border border-stone-700 rounded-lg px-2 py-1 text-stone-300 focus:outline-none focus:border-orange-500/60 transition"
                >
                  <option value="">— שייך לשחקן</option>
                  {players.filter(pl => !pl.isGuest).map(pl => (
                    <option key={pl.id} value={pl.id}>{pl.name}</option>
                  ))}
                </select>
                {p.playerId && (
                  <button onClick={() => handleLinkPlayer(p.id, null)} className="text-stone-600 hover:text-rose-400 transition">
                    <Unlink size={12} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {allowedPhones.length === 0 && (
            <div className="px-4 py-6 text-center text-stone-600 text-sm">הרשימה ריקה — הוסף חברים</div>
          )}
        </div>
      </div>

      {/* Confirm clear modal */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setConfirmClear(false)}>
          <div className="w-full max-w-sm bg-stone-900 border border-stone-700 rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()} dir="rtl">
            <h3 className="text-lg font-black mb-2">לנקות את כל ההרשמות?</h3>
            <p className="text-stone-400 text-sm mb-5">כל {state?.registrations.length} הנרשמים יימחקו. לא ניתן לבטל.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmClear(false)} className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 font-bold text-sm">ביטול</button>
              <button onClick={handleClearAll} disabled={clearing} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-60 font-bold text-sm flex items-center gap-1.5">
                {clearing ? <Loader2 size={13} className="animate-spin" /> : null}
                כן, נקה
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
