import { useState, useEffect, useMemo } from "react";
import {
  Trash2,
  Edit3,
  Users,
  Trophy,
  Plus,
  Shuffle,
  X,
  Save,
  Sparkles,
  TrendingUp,
  Loader2,
  RotateCcw,
  Search,
  Check,
  CheckSquare,
  Eraser,
  UserCheck,
} from "lucide-react";

const POSITIONS = {
  guard: { label: "גארד", short: "G" },
  forward: { label: "פורוורד", short: "F" },
  center: { label: "סנטר", short: "C" },
};

const CATEGORIES = [
  { key: "defense", label: "הגנה" },
  { key: "offense", label: "התקפה" },
  { key: "shooting", label: "קליעה" },
  { key: "passing", label: "מסירות" },
  { key: "rebounding", label: "ריבאונדים" },
  { key: "fitness", label: "כושר" },
];

const TEAM_COLORS = [
  { name: "כתום", bg: "bg-orange-500", bgSoft: "bg-orange-500/10", border: "border-orange-500/40", text: "text-orange-400", glow: "shadow-orange-500/20" },
  { name: "ירוק", bg: "bg-emerald-500", bgSoft: "bg-emerald-500/10", border: "border-emerald-500/40", text: "text-emerald-400", glow: "shadow-emerald-500/20" },
  { name: "כחול", bg: "bg-sky-500", bgSoft: "bg-sky-500/10", border: "border-sky-500/40", text: "text-sky-400", glow: "shadow-sky-500/20" },
  { name: "סגול", bg: "bg-violet-500", bgSoft: "bg-violet-500/10", border: "border-violet-500/40", text: "text-violet-400", glow: "shadow-violet-500/20" },
];

const PLAYERS_KEY = "bball_players_v2";
const ATTENDING_KEY = "bball_attending_v2";
const TEAMS_COUNT_KEY = "bball_teams_count_v2";

const computeOverall = (p) => Math.min(...CATEGORIES.map((c) => p[c.key] ?? 5));
const teamSum = (t) => t.reduce((s, p) => s + computeOverall(p), 0);
const teamAvg = (t) => (t.length ? teamSum(t) / t.length : 0);
const uid = () => Math.random().toString(36).slice(2, 10);

function generateBalancedTeams(players, numTeams = 3) {
  if (players.length === 0 || numTeams < 1) return [];
  const sorted = [...players].sort((a, b) => computeOverall(b) - computeOverall(a));
  const teams = Array.from({ length: numTeams }, () => []);
  sorted.forEach((player, i) => {
    const round = Math.floor(i / numTeams);
    const pos = i % numTeams;
    const teamIdx = round % 2 === 0 ? pos : numTeams - 1 - pos;
    teams[teamIdx].push(player);
  });

  const totalCenters = players.filter((p) => p.position === "center").length;
  const idealCenters = totalCenters / numTeams;

  const score = (tms) => {
    const sums = tms.map(teamSum);
    const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
    const sumVariance = sums.reduce((s, x) => s + (x - mean) ** 2, 0) / sums.length;
    let positionPenalty = 0;
    tms.forEach((team) => {
      const centers = team.filter((p) => p.position === "center").length;
      if (totalCenters >= numTeams && centers === 0) positionPenalty += 80;
      if (centers > Math.ceil(idealCenters)) positionPenalty += 25 * (centers - Math.ceil(idealCenters));
    });
    const topPlayers = sorted.slice(0, numTeams);
    const teamsWithStars = new Set();
    topPlayers.forEach((p) => { tms.forEach((t, i) => { if (t.includes(p)) teamsWithStars.add(i); }); });
    const starPenalty = (numTeams - teamsWithStars.size) * 40;
    const topHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const topPerTeam = tms.map((t) => t.filter((p) => topHalf.includes(p)).length);
    const topMean = topPerTeam.reduce((a, b) => a + b, 0) / numTeams;
    const topVariance = topPerTeam.reduce((s, x) => s + (x - topMean) ** 2, 0) / numTeams;
    return sumVariance + positionPenalty + starPenalty + topVariance * 8;
  };

  let improved = true;
  let iters = 0;
  while (improved && iters < 300) {
    improved = false;
    iters++;
    let bestDelta = 0;
    let bestSwap = null;
    const baseScore = score(teams);
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        for (let pi = 0; pi < teams[i].length; pi++) {
          for (let pj = 0; pj < teams[j].length; pj++) {
            const a = teams[i][pi]; const b = teams[j][pj];
            teams[i][pi] = b; teams[j][pj] = a;
            const newScore = score(teams);
            const delta = newScore - baseScore;
            if (delta < bestDelta - 1e-9) { bestDelta = delta; bestSwap = { i, j, pi, pj }; }
            teams[i][pi] = a; teams[j][pj] = b;
          }
        }
      }
    }
    if (bestSwap) {
      const { i, j, pi, pj } = bestSwap;
      const a = teams[i][pi]; const b = teams[j][pj];
      teams[i][pi] = b; teams[j][pj] = a;
      improved = true;
    }
  }
  teams.sort((a, b) => teamSum(b) - teamSum(a));
  return teams;
}

function PlayerModal({ player, onSave, onClose, onDelete }) {
  const [draft, setDraft] = useState(
    player || { id: uid(), name: "", position: "guard", defense: 5, offense: 5, shooting: 5, passing: 5, rebounding: 5, fitness: 5 }
  );
  const overall = computeOverall(draft);
  const isValid = draft.name.trim().length > 0;
  const update = (k, v) => setDraft((d) => ({ ...d, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-700 bg-stone-950">
          <h3 className="text-xl font-black text-stone-100 tracking-tight">{player ? "עריכת שחקן" : "הוספת שחקן"}</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-200 transition"><X size={22} /></button>
        </div>
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">שם השחקן</label>
            <input autoFocus value={draft.name} onChange={(e) => update("name", e.target.value)} placeholder="לדוגמה: דני" className="w-full bg-stone-950 border border-stone-700 rounded-lg px-4 py-3 text-stone-100 placeholder-stone-600 focus:outline-none focus:border-orange-500 transition" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-2">תפקיד</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(POSITIONS).map(([key, { label }]) => (
                <button key={key} onClick={() => update("position", key)} className={`py-3 px-2 rounded-lg font-bold text-sm transition border ${draft.position === key ? "bg-orange-500 border-orange-500 text-white" : "bg-stone-950 border-stone-700 text-stone-400 hover:border-stone-500"}`}>{label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-400 mb-3">קטגוריות (1–10)</label>
            <div className="space-y-3">
              {CATEGORIES.map((cat) => (
                <div key={cat.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-stone-300 font-medium">{cat.label}</span>
                    <span className="text-sm font-black tabular-nums text-stone-100 bg-stone-800 px-2 py-0.5 rounded">{draft[cat.key]}</span>
                  </div>
                  <input type="range" min="1" max="10" step="1" value={draft[cat.key]} onChange={(e) => update(cat.key, parseInt(e.target.value))} className="w-full accent-orange-500" />
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-l from-orange-500/20 to-orange-500/5 border border-orange-500/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-xs text-orange-300/80 font-bold uppercase tracking-wider">דירוג כללי</div>
              <div className="text-xs text-stone-500">(הקטגוריה הנמוכה ביותר)</div>
            </div>
            <div className="text-4xl font-black text-orange-400 tabular-nums">{overall}</div>
          </div>
        </div>
        <div className="px-6 py-4 bg-stone-950 border-t border-stone-700 flex items-center justify-between gap-3">
          {player ? (
            <button onClick={() => { onDelete(player.id); onClose(); }} className="text-rose-400 hover:text-rose-300 font-bold text-sm flex items-center gap-1.5"><Trash2 size={16} />מחק</button>
          ) : (<span />)}
          <div className="flex gap-2">
            <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold transition">ביטול</button>
            <button onClick={() => { if (isValid) { onSave(draft); onClose(); } }} disabled={!isValid} className="px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:bg-stone-700 disabled:text-stone-500 text-white font-bold transition flex items-center gap-1.5"><Save size={16} />שמירה</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlayerCard({ player, attending, onToggle, onEdit }) {
  const overall = computeOverall(player);
  const pos = POSITIONS[player.position];
  return (
    <div className={`relative group rounded-xl border transition-all ${attending ? "bg-stone-900 border-orange-500/60 shadow-md shadow-orange-500/10" : "bg-stone-900/40 border-stone-800 hover:border-stone-700"}`}>
      <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="absolute top-1 left-1 w-7 h-7 rounded-md bg-stone-800/80 hover:bg-stone-700 text-stone-400 hover:text-stone-100 flex items-center justify-center opacity-60 hover:opacity-100 transition z-10" aria-label="ערוך"><Edit3 size={13} /></button>
      <button onClick={onToggle} className="w-full p-3 text-right">
        <div className="flex items-start gap-2">
          <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition ${attending ? "bg-orange-500" : "border-2 border-stone-600 group-hover:border-stone-400"}`}>
            {attending && <Check size={13} className="text-white" strokeWidth={3} />}
          </div>
          <div className="min-w-0 flex-1">
            <div className={`font-bold truncate text-sm ${attending ? "text-stone-100" : "text-stone-400"}`}>{player.name}</div>
            <div className="text-xs text-stone-500 mt-0.5">{pos.label}</div>
          </div>
          <div className={`flex flex-col items-center justify-center w-10 h-10 rounded-lg shrink-0 font-black text-base tabular-nums transition ${!attending ? "bg-stone-800/40 text-stone-500" : overall >= 8 ? "bg-orange-500/20 text-orange-300 border border-orange-500/40" : overall >= 6 ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : overall >= 4 ? "bg-sky-500/20 text-sky-300 border border-sky-500/40" : "bg-stone-700/40 text-stone-400 border border-stone-700"}`}>{overall}</div>
        </div>
      </button>
    </div>
  );
}

function TeamCard({ team, color }) {
  const sum = teamSum(team);
  const avg = teamAvg(team);
  const sorted = [...team].sort((a, b) => computeOverall(b) - computeOverall(a));
  const positions = team.reduce((acc, p) => { acc[p.position] = (acc[p.position] || 0) + 1; return acc; }, {});
  return (
    <div className={`bg-stone-900 border ${color.border} rounded-2xl overflow-hidden shadow-xl ${color.glow}`}>
      <div className={`${color.bg} px-5 py-3`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-white/80 font-bold uppercase tracking-wider">קבוצה</div>
            <div className="text-2xl font-black text-white">{color.name}</div>
          </div>
          <Trophy className="text-white/80" size={28} />
        </div>
      </div>
      <div className={`${color.bgSoft} grid grid-cols-3 divide-x divide-stone-700/50 border-b border-stone-700/50`} dir="ltr">
        <div className="px-3 py-2.5 text-center">
          <div className="text-[10px] text-stone-400 font-bold uppercase">סה״כ</div>
          <div className="text-xl font-black text-stone-100 tabular-nums">{sum}</div>
        </div>
        <div className="px-3 py-2.5 text-center">
          <div className="text-[10px] text-stone-400 font-bold uppercase">ממוצע</div>
          <div className="text-xl font-black text-stone-100 tabular-nums">{avg.toFixed(1)}</div>
        </div>
        <div className="px-3 py-2.5 text-center">
          <div className="text-[10px] text-stone-400 font-bold uppercase">הרכב</div>
          <div className="text-xs font-bold text-stone-100 mt-1.5 tabular-nums">{positions.guard || 0}G·{positions.forward || 0}F·{positions.center || 0}C</div>
        </div>
      </div>
      <div className="p-3 space-y-1.5" dir="rtl">
        {sorted.map((p, i) => {
          const ov = computeOverall(p);
          return (
            <div key={p.id} className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-stone-800/60">
              <div className={`text-xs font-black ${color.text} w-4 tabular-nums`}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-stone-100 truncate text-sm">{p.name}</div>
                <div className="text-[10px] text-stone-500">{POSITIONS[p.position].label}</div>
              </div>
              <div className="text-base font-black text-stone-100 tabular-nums">{ov}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function BasketballTeamGenerator() {
  const [players, setPlayers] = useState([]);
  const [attending, setAttending] = useState(new Set());
  const [numTeams, setNumTeams] = useState(3);
  const [teams, setTeams] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [filterPos, setFilterPos] = useState("all");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, a, t] = await Promise.all([
          window.storage.get(PLAYERS_KEY).catch(() => null),
          window.storage.get(ATTENDING_KEY).catch(() => null),
          window.storage.get(TEAMS_COUNT_KEY).catch(() => null),
        ]);
        if (p?.value) setPlayers(JSON.parse(p.value));
        if (a?.value) setAttending(new Set(JSON.parse(a.value)));
        if (t?.value) setNumTeams(parseInt(t.value) || 3);
      } catch (e) {} finally { setLoading(false); }
    })();
  }, []);

  const persistPlayers = async (next) => {
    setPlayers(next);
    try { await window.storage.set(PLAYERS_KEY, JSON.stringify(next)); } catch (e) {}
  };
  const persistAttending = async (next) => {
    setAttending(next);
    try { await window.storage.set(ATTENDING_KEY, JSON.stringify([...next])); } catch (e) {}
  };
  const persistTeamsCount = async (n) => {
    setNumTeams(n);
    try { await window.storage.set(TEAMS_COUNT_KEY, String(n)); } catch (e) {}
  };

  const handleSave = (player) => {
    const exists = players.find((p) => p.id === player.id);
    if (exists) persistPlayers(players.map((p) => (p.id === player.id ? player : p)));
    else persistPlayers([...players, player]);
    setTeams(null);
  };
  const handleDelete = (id) => {
    persistPlayers(players.filter((p) => p.id !== id));
    const next = new Set(attending); next.delete(id); persistAttending(next);
    setTeams(null);
  };
  const toggleAttending = (id) => {
    const next = new Set(attending);
    if (next.has(id)) next.delete(id); else next.add(id);
    persistAttending(next);
    setTeams(null);
  };
  const selectAllVisible = (ids) => {
    const next = new Set(attending); ids.forEach((id) => next.add(id)); persistAttending(next);
    setTeams(null);
  };
  const clearAttending = () => { persistAttending(new Set()); setTeams(null); };

  const handleGenerate = () => {
    const attendingPlayers = players.filter((p) => attending.has(p.id));
    if (attendingPlayers.length < numTeams * 2) return;
    setGenerating(true);
    setTeams(null);
    setTimeout(() => {
      const result = generateBalancedTeams(attendingPlayers, numTeams);
      setTeams(result);
      setGenerating(false);
      setTimeout(() => {
        document.getElementById("teams-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }, 400);
  };

  const handleResetAll = async () => {
    await persistPlayers([]);
    await persistAttending(new Set());
    setTeams(null);
    setShowResetConfirm(false);
  };

  const filteredPlayers = useMemo(() => {
    let result = players;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (filterPos !== "all") result = result.filter((p) => p.position === filterPos);
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
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" size={36} />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-stone-950 text-stone-100" style={{ fontFamily: "'Rubik', system-ui, -apple-system, sans-serif", backgroundImage: "radial-gradient(circle at 20% 0%, rgba(249,115,22,0.08), transparent 50%), radial-gradient(circle at 80% 100%, rgba(16,185,129,0.06), transparent 50%)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;700;800;900&display=swap');
        input[type="range"] { -webkit-appearance: none; height: 6px; background: #292524; border-radius: 3px; }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 18px; height: 18px; background: #f97316; border-radius: 50%; cursor: pointer; border: 2px solid #1c1917; }
        input[type="range"]::-moz-range-thumb { width: 18px; height: 18px; background: #f97316; border-radius: 50%; cursor: pointer; border: 2px solid #1c1917; }
      `}</style>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        <header className="mb-6">
          <div className="flex items-center gap-2 text-orange-400 text-xs font-black uppercase tracking-[0.25em] mb-1">
            <span className="w-8 h-px bg-orange-500" />
            BASKETBALL · 5 ON 5
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none">
            מחולל<span className="text-orange-500"> קבוצות</span>
          </h1>
          <p className="text-stone-400 text-sm mt-2 max-w-md">סמן מי הגיע היום וקבל קבוצות מאוזנות בלחיצה</p>
        </header>

        <div className="bg-gradient-to-l from-stone-900 to-stone-900/50 border border-stone-800 rounded-2xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-3 md:gap-4">
            <div className="flex items-baseline gap-2">
              <UserCheck size={20} className="text-orange-400 self-center" />
              <div>
                <span className="text-3xl font-black tabular-nums text-orange-400">{attendingCount}</span>
                <span className="text-sm text-stone-500 mr-1">/ {players.length} סומנו היום</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mr-auto">
              <span className="text-xs text-stone-500 font-bold">קבוצות:</span>
              <div className="flex bg-stone-950 border border-stone-700 rounded-lg overflow-hidden">
                {[2, 3, 4].map((n) => (
                  <button key={n} onClick={() => persistTeamsCount(n)} className={`px-3 py-1.5 text-sm font-black tabular-nums transition ${numTeams === n ? "bg-orange-500 text-white" : "text-stone-400 hover:text-stone-100"}`}>{n}</button>
                ))}
              </div>
            </div>
            <button onClick={handleGenerate} disabled={attendingCount < numTeams * 2 || generating} className="bg-orange-500 hover:bg-orange-400 disabled:bg-stone-800 disabled:text-stone-600 disabled:cursor-not-allowed text-white font-black px-5 md:px-6 py-3 rounded-xl flex items-center gap-2 transition shadow-lg shadow-orange-500/20">
              {generating ? (<><Loader2 className="animate-spin" size={18} />מאזן...</>) : (<><Shuffle size={18} />צור קבוצות</>)}
            </button>
          </div>
          {attendingCount > 0 && attendingCount < numTeams * 2 && (
            <p className="text-xs text-amber-400 mt-2 mr-7">⚠️ נדרשים לפחות {numTeams * 2} שחקנים ל-{numTeams} קבוצות</p>
          )}
        </div>

        {teams && teams.length > 0 && (
          <section id="teams-section" className="mb-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-2xl font-black flex items-center gap-2">
                <Sparkles className="text-orange-400" size={22} />הקבוצות
              </h2>
              <div className="text-xs text-stone-400 bg-stone-900 border border-stone-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
                <TrendingUp size={14} />
                <span>הפרש: <strong className="text-stone-200 tabular-nums">{(teamSum(teams[0]) - teamSum(teams[teams.length - 1])).toFixed(0)}</strong></span>
              </div>
            </div>
            <div className={`grid grid-cols-1 ${teams.length === 2 ? "md:grid-cols-2" : teams.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2 lg:grid-cols-4"} gap-4`}>
              {teams.map((team, idx) => (<TeamCard key={idx} team={team} color={TEAM_COLORS[idx % TEAM_COLORS.length]} />))}
            </div>
          </section>
        )}

        <section className="mb-8">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Users size={18} className="text-stone-400" />סגל
              <span className="text-xs font-bold text-stone-500 bg-stone-800 px-2 py-0.5 rounded tabular-nums">{players.length}</span>
            </h2>
            <button onClick={() => setEditing("new")} className="bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-100 font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition text-sm">
              <Plus size={16} />שחקן חדש
            </button>
          </div>

          {players.length > 0 && (
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-3 mb-3">
              <div className="flex flex-wrap gap-2 items-center">
                <div className="relative flex-1 min-w-[180px]">
                  <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש שחקן..." className="w-full bg-stone-950 border border-stone-700 rounded-lg pr-9 pl-3 py-2 text-sm text-stone-100 placeholder-stone-600 focus:outline-none focus:border-stone-600 transition" />
                </div>
                <div className="flex bg-stone-950 border border-stone-700 rounded-lg overflow-hidden text-xs">
                  {[{ key: "all", label: "הכול" }, { key: "guard", label: "G" }, { key: "forward", label: "F" }, { key: "center", label: "C" }].map((f) => (
                    <button key={f.key} onClick={() => setFilterPos(f.key)} className={`px-3 py-2 font-bold transition ${filterPos === f.key ? "bg-stone-700 text-stone-100" : "text-stone-400 hover:text-stone-200"}`}>{f.label}</button>
                  ))}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => selectAllVisible(filteredPlayers.map((p) => p.id))} className="bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition text-xs" title="סמן את כל המוצגים">
                    <CheckSquare size={14} />בחר הכל
                  </button>
                  {attendingCount > 0 && (
                    <button onClick={clearAttending} className="bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-rose-400 font-bold px-3 py-2 rounded-lg flex items-center gap-1 transition text-xs" title="נקה את כל הסימונים">
                      <Eraser size={14} />נקה
                    </button>
                  )}
                </div>
                <button onClick={() => setShowResetConfirm(true)} className="text-stone-600 hover:text-rose-400 font-bold p-2 rounded-lg transition" title="איפוס מלא של הסגל">
                  <RotateCcw size={14} />
                </button>
              </div>
            </div>
          )}

          {players.length === 0 ? (
            <div className="bg-stone-900/50 border-2 border-dashed border-stone-800 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-3">🏀</div>
              <h3 className="text-xl font-black mb-1">בנה את הסגל שלך</h3>
              <p className="text-stone-400 text-sm mb-5">הוסף את כל השחקנים בקבוצה (אפשר עד ~60).<br />בכל פעם שתבוא לשחק תסמן רק מי שהגיע.</p>
              <button onClick={() => setEditing("new")} className="bg-orange-500 hover:bg-orange-400 text-white font-bold px-5 py-2.5 rounded-lg inline-flex items-center gap-2">
                <Plus size={16} />הוסף שחקן ראשון
              </button>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-8 text-center">
              <p className="text-stone-500 text-sm">לא נמצאו שחקנים</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {filteredPlayers.map((p) => (
                <PlayerCard key={p.id} player={p} attending={attending.has(p.id)} onToggle={() => toggleAttending(p.id)} onEdit={() => setEditing(p)} />
              ))}
            </div>
          )}
        </section>

        <footer className="text-center text-xs text-stone-600 mt-12 pb-4">
          <p>לחץ על שחקן לסימון נוכחות · אייקון העיפרון לעריכה · נשמר אוטומטית</p>
        </footer>
      </div>

      {editing && (<PlayerModal player={editing === "new" ? null : editing} onSave={handleSave} onClose={() => setEditing(null)} onDelete={handleDelete} />)}

      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowResetConfirm(false)}>
          <div className="w-full max-w-sm bg-stone-900 border border-stone-700 rounded-2xl p-6 shadow-2xl" onClick={(e) => e.stopPropagation()} dir="rtl">
            <h3 className="text-xl font-black mb-2">למחוק את כל הסגל?</h3>
            <p className="text-stone-400 text-sm mb-5">פעולה זו תמחק את כל ה-{players.length} השחקנים. אי אפשר לבטל.</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowResetConfirm(false)} className="px-4 py-2 rounded-lg bg-stone-800 hover:bg-stone-700 font-bold">ביטול</button>
              <button onClick={handleResetAll} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 font-bold">כן, מחק</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
