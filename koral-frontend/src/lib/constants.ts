export const POSITIONS = {
  guard:   { label: 'גארד',    short: 'G' },
  forward: { label: 'פורוורד', short: 'F' },
  center:  { label: 'סנטר',    short: 'C' },
} as const;

export const CATEGORIES = [
  { key: 'defense',     label: 'הגנה'      },
  { key: 'offense',    label: 'התקפה'     },
  { key: 'shooting',   label: 'קליעה'     },
  { key: 'passing',    label: 'מסירות'    },
  { key: 'rebounding', label: 'ריבאונדים' },
  { key: 'fitness',    label: 'כושר'      },
] as const;

export const TEAM_COLORS = [
  { name: 'כתום', bg: 'bg-orange-500',  bgSoft: 'bg-orange-500/10',  border: 'border-orange-500/40',  text: 'text-orange-400',  glow: 'shadow-orange-500/20', ring: 'ring-orange-500'  },
  { name: 'ירוק',  bg: 'bg-emerald-500', bgSoft: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400', glow: 'shadow-emerald-500/20', ring: 'ring-emerald-500' },
  { name: 'כחול',  bg: 'bg-sky-500',     bgSoft: 'bg-sky-500/10',     border: 'border-sky-500/40',     text: 'text-sky-400',     glow: 'shadow-sky-500/20',    ring: 'ring-sky-500'     },
  { name: 'סגול', bg: 'bg-violet-500',  bgSoft: 'bg-violet-500/10',  border: 'border-violet-500/40',  text: 'text-violet-400',  glow: 'shadow-violet-500/20', ring: 'ring-violet-500'  },
] as const;

export type TeamColor = (typeof TEAM_COLORS)[number];

export const ATTENDING_KEY   = 'koral_attending_v1';
export const TEAMS_COUNT_KEY = 'koral_teams_count_v1';
export const LOCKED_KEY      = 'koral_locked_v1';
