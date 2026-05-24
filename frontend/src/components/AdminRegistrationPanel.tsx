import { useState, useEffect, useCallback } from 'react';
import {
  Settings, Users, Phone, Plus, Trash2, CheckCircle2, Clock,
  Loader2, X, ChevronDown, ChevronUp, AlertCircle,
  Pencil, UserPlus, Share2
} from 'lucide-react';
import { registrationApi } from '../api/registration';
import { api as playerApi } from '../api/players';
import PlayerModal from './PlayerModal';
import type { RegistrationState, AllowedPhone, RegistrationEntry } from '../types/registration';
import type { Player, PlayerDraft } from '../types/player';

interface Props {
  adminPassword: string;
}

export default function AdminRegistrationPanel({ adminPassword }: Props) {
  const [state, setState] = useState<RegistrationState | null>(null);
  const [allowedPhones, setAllowedPhones] = useState<AllowedPhone[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  // Bulk import
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ added: number; updated: number; invalid: string[] } | null>(null);

  // Confirm clear
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  // Admin register
  const [adminRegOpen, setAdminRegOpen] = useState(false);
  const [adminRegPhone, setAdminRegPhone] = useState('');
  const [adminRegName, setAdminRegName] = useState('');
  const [adminRegLoading, setAdminRegLoading] = useState(false);
  const [adminRegResult, setAdminRegResult] = useState<{ alreadyRegistered: boolean; displayName: string; position: number; status: 'confirmed' | 'waitlist' } | null>(null);
  const [adminRegError, setAdminRegError] = useState('');

  // Mark player attending
  const [markPlayerId, setMarkPlayerId] = useState('');
  const [markingPlayer, setMarkingPlayer] = useState(false);
  const [markPlayerResult, setMarkPlayerResult] = useState<string | null>(null);

  // Edit player (from allowed phones)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editingPhoneId, setEditingPhoneId] = useState<string | null>(null); // phone to auto-link after new player create

  const load = useCallback(async () => {
    try {
      const [s, phones, allPlayers] = await Promise.all([
        registrationApi.getState(),
        registrationApi.getAllowedPhones(adminPassword),
        playerApi.getAll(),
      ]);
      setState(s);
      setAllowedPhones(Array.isArray(phones) ? phones : []);
      setPlayers(Array.isArray(allPlayers) ? allPlayers : []);
      setGameLabel(s.gameLabel);
      setIsOpen(s.isOpen);
      setMaxPlayers(s.maxPlayers);
      setOpensAt(s.opensAt ? new Date(s.opensAt).toISOString().slice(0, 16) : '');
    } catch {
      // silent — show empty state rather than crash
    } finally {
      setLoading(false);
    }
  }, [adminPassword]);

  useEffect(() => { load(); }, [load]);

  const saveSettings = useCallback(async (overrides: { isOpen?: boolean; gameLabel?: string; maxPlayers?: number; opensAt?: string } = {}) => {
    setSaving(true);
    try {
      const effectiveOpensAt = 'opensAt' in overrides ? overrides.opensAt : opensAt;
      await registrationApi.updateSettings(adminPassword, {
        gameLabel: overrides.gameLabel ?? gameLabel,
        isOpen: overrides.isOpen ?? isOpen,
        maxPlayers: overrides.maxPlayers ?? maxPlayers,
        opensAt: effectiveOpensAt ? new Date(effectiveOpensAt).toISOString() : null,
      });
      await load();
    } finally {
      setSaving(false);
    }
  }, [adminPassword, gameLabel, isOpen, maxPlayers, opensAt, load]);

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

  const handleRemoveRegistration = async (id: string) => {
    await registrationApi.removeRegistration(adminPassword, id);
    setState(prev => prev ? { ...prev, registrations: prev.registrations.filter(r => r.id !== id) } : prev);
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;
    setBulkLoading(true);
    setBulkResult(null);
    try {
      const result = await registrationApi.bulkImport(adminPassword, bulkText);
      setBulkResult(result);
      setBulkText('');
      await load();
    } finally {
      setBulkLoading(false);
    }
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

  const handleAdminRegister = async () => {
    if (!adminRegPhone.trim() || !adminRegName.trim()) { setAdminRegError('נדרשים שם ומספר טלפון'); return; }
    setAdminRegLoading(true);
    setAdminRegError('');
    setAdminRegResult(null);
    try {
      const result = await registrationApi.adminRegister(adminPassword, adminRegPhone.trim(), adminRegName.trim());
      setAdminRegResult(result);
      setAdminRegPhone('');
      setAdminRegName('');
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'שגיאה';
      setAdminRegError(msg);
    } finally {
      setAdminRegLoading(false);
    }
  };

  const handleMarkPlayer = async () => {
    if (!markPlayerId) return;
    setMarkingPlayer(true);
    setMarkPlayerResult(null);
    try {
      const result = await registrationApi.markPlayerAttending(adminPassword, markPlayerId);
      const label = result.alreadyRegistered ? `כבר רשום (מקום #${result.position})` : `נוסף! מקום #${result.position}`;
      setMarkPlayerResult(`${result.displayName} — ${label}`);
      setMarkPlayerId('');
      await load();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'שגיאה';
      setMarkPlayerResult(`שגיאה: ${msg}`);
    } finally {
      setMarkingPlayer(false);
    }
  };

  const handleSaveEditedPlayer = async (data: Player | PlayerDraft, phone?: string) => {
    if (editingPlayer) {
      await playerApi.update(editingPlayer.id, data as Partial<PlayerDraft>);
    } else {
      const created = await playerApi.create(data as PlayerDraft);
      if (editingPhoneId) {
        await registrationApi.linkPhoneToPlayer(adminPassword, editingPhoneId, created.id);
      } else if (phone && !(data as PlayerDraft).isGuest) {
        try {
          const allowedPhone = await registrationApi.addAllowedPhone(adminPassword, phone, (data as PlayerDraft).name);
          await registrationApi.linkPhoneToPlayer(adminPassword, allowedPhone.id, created.id);
        } catch {
          // silent
        }
      }
    }
    await load();
    setEditingPlayer(null);
    setEditingPhoneId(null);
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

  function fmtTime(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    const time = d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    if (d.toDateString() === now.toDateString()) return time;
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' }) + ' ' + time;
  }

  return (
    <div className="space-y-5">
      {/* Game settings */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-base font-black flex items-center gap-2 text-stone-200">
          <Settings size={16} className="text-orange-400" />
          הגדרות משחק
        </h3>

        {/* Open/Close toggle — dominant */}
        <button
          onClick={() => { const v = !isOpen; setIsOpen(v); saveSettings({ isOpen: v }); }}
          disabled={saving}
          className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${
            isOpen
              ? 'bg-emerald-500/10 border-emerald-500/40 hover:bg-emerald-500/15'
              : 'bg-stone-950 border-stone-700 hover:border-stone-600'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-8 rounded-full transition-all duration-300 relative shrink-0 ${isOpen ? 'bg-emerald-500' : 'bg-stone-700'}`}>
              <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-300 ${isOpen ? 'right-1' : 'left-1'}`} />
            </div>
            <div className="text-right">
              <div className={`text-lg font-black leading-tight ${isOpen ? 'text-emerald-300' : 'text-stone-400'}`}>
                {isOpen ? 'הרשמה פתוחה' : 'הרשמה סגורה'}
              </div>
              <div className="text-xs text-stone-600 mt-0.5">
                {isOpen ? 'לחץ לסגירה ומחיקת הנרשמים' : 'לחץ לפתיחת ההרשמה'}
              </div>
            </div>
          </div>
          {saving
            ? <Loader2 size={18} className="animate-spin text-stone-500 shrink-0" />
            : <div className={`w-3 h-3 rounded-full shrink-0 ${isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-stone-700'}`} />
          }
        </button>

        <div>
          <label className="block text-xs font-bold text-stone-500 uppercase tracking-wider mb-1.5">שם המשחק (מוצג לחברים)</label>
          <input
            value={gameLabel}
            onChange={e => setGameLabel(e.target.value)}
            onBlur={() => saveSettings()}
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
                  onClick={() => { setMaxPlayers(n); saveSettings({ maxPlayers: n }); }}
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
              onBlur={() => saveSettings()}
              className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 focus:outline-none focus:border-orange-500/60 transition"
            />
          </div>
        </div>
        {isOpen && state && (
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`📣 ההרשמה פתוחה${state.gameLabel ? ` ל${state.gameLabel}` : ''}!\nלהרשמה: ${window.location.origin + window.location.pathname}#register`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 bg-emerald-600/15 border border-emerald-600/30 hover:bg-emerald-600/25 rounded-full px-3 py-2 transition"
          >
            <Share2 size={12} />
            שתף — הרשמה פתוחה
          </a>
        )}
      </div>

      {/* Registrations list */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-stone-800">
          <h3 className="text-base font-black flex items-center gap-2 text-stone-200">
            <Users size={16} className="text-orange-400" />
            רשימת נרשמים ({state?.registrations.length ?? 0})
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setAdminRegOpen(v => !v); setAdminRegResult(null); setAdminRegError(''); }}
              className="text-xs font-bold flex items-center gap-1 text-stone-400 hover:text-emerald-300 transition min-h-[32px] px-1"
            >
              <UserPlus size={13} />
              הרשמה ידנית
              {adminRegOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {(state?.registrations.length ?? 0) > 0 && (
              <button
                onClick={() => setConfirmClear(true)}
                className="text-xs text-stone-600 hover:text-rose-400 font-bold flex items-center gap-1 transition min-h-[32px] px-1"
              >
                <Trash2 size={12} />
                נקה הכל
              </button>
            )}
          </div>
        </div>

        {/* Admin manual registration */}
        {adminRegOpen && (
          <div className="px-4 py-3 border-b border-stone-800 bg-stone-950/50 space-y-2">
            <input
              value={adminRegName}
              onChange={e => { setAdminRegName(e.target.value); setAdminRegError(''); setAdminRegResult(null); }}
              onKeyDown={e => { if (e.key === 'Enter') handleAdminRegister(); }}
              placeholder="שם"
              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/60 transition min-h-[44px]"
            />
            <div className="flex gap-2">
              <input
                value={adminRegPhone}
                onChange={e => { setAdminRegPhone(e.target.value); setAdminRegError(''); setAdminRegResult(null); }}
                onKeyDown={e => { if (e.key === 'Enter') handleAdminRegister(); }}
                placeholder="0501234567"
                dir="ltr"
                className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/60 transition min-h-[44px]"
              />
              <button
                onClick={handleAdminRegister}
                disabled={adminRegLoading}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 shrink-0 min-h-[44px] text-sm"
              >
                {adminRegLoading ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
                הרשם
              </button>
            </div>
            {adminRegError && (
              <p className="text-rose-400 text-xs">{adminRegError}</p>
            )}
            {adminRegResult && (
              <div className={`flex items-center gap-2 text-xs font-bold rounded-lg px-3 py-2 ${
                adminRegResult.status === 'confirmed'
                  ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
              }`}>
                {adminRegResult.status === 'confirmed' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                {adminRegResult.alreadyRegistered ? 'כבר רשום — ' : 'נרשם! — '}
                {adminRegResult.displayName}
                {' · '}
                {adminRegResult.status === 'confirmed' ? 'מאושר' : 'המתנה'}
                {' · מקום #'}{adminRegResult.position}
              </div>
            )}
          </div>
        )}

        {/* Mark player attending */}
        {(() => {
          const registeredNames = new Set((state?.registrations ?? []).map(r => r.displayName));
          const unregisteredPlayers = players.filter(p => !p.isGuest && !registeredNames.has(p.name));
          return (
            <div className="px-4 py-3 border-b border-stone-800 bg-stone-950/30">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">סמן שחקן כמגיע</p>
              <div className="flex gap-2">
                <select
                  value={markPlayerId}
                  onChange={e => { setMarkPlayerId(e.target.value); setMarkPlayerResult(null); }}
                  className="flex-1 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-100 focus:outline-none focus:border-orange-500/60 transition min-h-[44px]"
                >
                  <option value="">— בחר שחקן</option>
                  {unregisteredPlayers.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleMarkPlayer}
                  disabled={markingPlayer || !markPlayerId}
                  className="bg-stone-700 hover:bg-stone-600 disabled:opacity-50 text-stone-100 font-black px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 shrink-0 min-h-[44px] text-sm"
                >
                  {markingPlayer ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                  סמן כמגיע
                </button>
              </div>
              {markPlayerResult && (
                <p className={`text-xs mt-1.5 font-bold ${markPlayerResult.startsWith('שגיאה') ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {markPlayerResult.startsWith('שגיאה') ? markPlayerResult : `✓ ${markPlayerResult}`}
                </p>
              )}
            </div>
          );
        })()}

        {confirmed.length > 0 && (
          <div>
            <div className="px-4 py-2 bg-emerald-500/5 border-b border-stone-800/50">
              <span className="text-xs font-black text-emerald-500 uppercase tracking-wider">מגיעים ({confirmed.length})</span>
            </div>
            {confirmed.map((r: RegistrationEntry) => (
              <div key={r.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-stone-800/30">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-emerald-400">{r.position}</span>
                </div>
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span className="text-sm font-bold text-stone-200 flex-1 min-w-0 truncate">{r.displayName}</span>
                <span className="text-xs text-stone-500 tabular-nums shrink-0">{fmtTime(r.registeredAt)}</span>
                <button onClick={() => handleRemoveRegistration(r.id)} className="text-stone-700 hover:text-rose-400 transition min-h-[32px] min-w-[32px] flex items-center justify-center shrink-0">
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
              <div key={r.id} className="flex items-center gap-2 px-4 py-2.5 border-b border-stone-800/30 opacity-70">
                <div className="w-6 h-6 rounded-full bg-stone-700 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-black text-stone-400">{r.position}</span>
                </div>
                <Clock size={13} className="text-amber-500 shrink-0" />
                <span className="text-sm font-bold text-stone-400 flex-1 min-w-0 truncate">{r.displayName}</span>
                <span className="text-xs text-stone-500 tabular-nums shrink-0">{fmtTime(r.registeredAt)}</span>
                <button onClick={() => handleRemoveRegistration(r.id)} className="text-stone-700 hover:text-rose-400 transition min-h-[32px] min-w-[32px] flex items-center justify-center shrink-0">
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
            רשימת שחקנים ({allowedPhones.length})
          </h3>
        </div>

        {/* Add single phone */}
        <div className="p-4 border-b border-stone-800 space-y-2">
          <input
            value={newName}
            onChange={e => { setNewName(e.target.value); setAddError(''); }}
            onKeyDown={e => { if (e.key === 'Enter') handleAddPhone(); }}
            placeholder="שם (אופציונלי)"
            className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/60 transition"
          />
          <div className="flex gap-2">
            <input
              value={newPhone}
              onChange={e => { setNewPhone(e.target.value); setAddError(''); }}
              onKeyDown={e => { if (e.key === 'Enter') handleAddPhone(); }}
              placeholder="0501234567"
              dir="ltr"
              className="flex-1 bg-stone-950 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500/60 transition"
            />
            <button
              onClick={handleAddPhone}
              disabled={addingPhone}
              className="bg-stone-700 hover:bg-stone-600 disabled:opacity-50 text-stone-100 font-bold px-4 py-2.5 rounded-lg transition flex items-center gap-1.5 min-h-[44px]"
            >
              {addingPhone ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              <span className="text-sm">הוסף</span>
            </button>
          </div>
          {addError && <p className="text-rose-400 text-xs mt-1">{addError}</p>}
        </div>

        {/* Bulk import */}
        <div className="border-b border-stone-800">
          <button
            onClick={() => { setBulkOpen(v => !v); setBulkResult(null); }}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-bold text-stone-400 hover:text-stone-200 transition"
          >
            <span>ייבוא מרובה</span>
            {bulkOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {bulkOpen && (
            <div className="px-4 pb-4 space-y-2">
              <p className="text-xs text-stone-500">שורה לכל חבר: <span dir="ltr" className="font-mono">שם: 0501234567</span> או <span dir="ltr" className="font-mono">0501234567</span></p>
              <textarea
                value={bulkText}
                onChange={e => { setBulkText(e.target.value); setBulkResult(null); }}
                rows={5}
                dir="ltr"
                placeholder={'ישראל ישראלי: 0501234567\nשרה כהן: 0521234567'}
                className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-100 placeholder-stone-600 font-mono focus:outline-none focus:border-orange-500/60 transition resize-none"
              />
              {bulkResult && (
                <div className="space-y-1">
                  <p className="text-xs text-emerald-400 font-bold">
                    נוספו {bulkResult.added} · עודכנו {bulkResult.updated}
                  </p>
                  {bulkResult.invalid.length > 0 && (
                    <div className="flex items-start gap-1.5">
                      <AlertCircle size={12} className="text-rose-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-rose-400">לא תקינים: {bulkResult.invalid.join(', ')}</p>
                    </div>
                  )}
                </div>
              )}
              <button
                onClick={handleBulkImport}
                disabled={bulkLoading || !bulkText.trim()}
                className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-black px-4 py-2 rounded-lg text-sm flex items-center gap-1.5 transition"
              >
                {bulkLoading ? <Loader2 size={14} className="animate-spin" /> : null}
                ייבא
              </button>
            </div>
          )}
        </div>

        {/* Phones list */}
        <div className="divide-y divide-stone-800/40 max-h-96 overflow-y-auto">
          {allowedPhones.map(p => (
            <div key={p.id} className="flex items-center gap-2 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-stone-200 truncate">
                  {p.name || <span className="text-stone-600 italic">ללא שם</span>}
                </div>
                <div className="text-xs text-stone-500 tabular-nums mt-0.5" dir="ltr">{p.phone}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    if (p.player) {
                      const fullPlayer = players.find(pl => pl.id === p.player!.id);
                      if (fullPlayer) { setEditingPlayer(fullPlayer); setEditingPhoneId(null); }
                    } else {
                      setEditingPlayer(null); setEditingPhoneId(p.id);
                    }
                  }}
                  className="text-stone-500 hover:text-orange-400 transition min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg"
                  title="ערוך שחקן"
                >
                  <Pencil size={13} />
                </button>
                <button onClick={() => handleRemovePhone(p.id)} className="text-stone-500 hover:text-rose-400 transition min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg">
                  <X size={14} />
                </button>
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

      {/* Edit/create player modal */}
      {(editingPlayer || editingPhoneId) && (
        <PlayerModal
          player={editingPlayer}
          defaultName={!editingPlayer ? (allowedPhones.find(p => p.id === editingPhoneId)?.name ?? '') : undefined}
          showPhone={!editingPlayer && !editingPhoneId}
          onSave={handleSaveEditedPlayer}
          onClose={() => { setEditingPlayer(null); setEditingPhoneId(null); }}
          onDelete={() => { setEditingPlayer(null); setEditingPhoneId(null); }}
        />
      )}
    </div>
  );
}
