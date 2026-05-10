import type { Player } from '../types/player';
import { POSITIONS, TEAM_COLORS } from './constants';
import { teamAvg } from './teams';

const COLOR_EMOJI: Record<string, string> = {
  כתום: '🟠',
  ירוק: '🟢',
  כחול: '🔵',
  סגול: '🟣',
};

export function formatTeamsForWhatsApp(teams: Player[][]): string {
  const lines: string[] = ['🏀 קבוצות להיום\n'];
  teams.forEach((team, i) => {
    const color = TEAM_COLORS[i % TEAM_COLORS.length]!;
    const emoji = COLOR_EMOJI[color.name] ?? '';
    lines.push(`\nקבוצה ${color.name} ${emoji}`);
    team.forEach((p, rank) => {
      const pos = POSITIONS[p.position].label;
      const bh = p.ballHandler ? ' ⭐' : '';
      lines.push(`${rank + 1}. ${p.name}${bh} (${pos})`);
    });
    lines.push(`ממוצע: ${teamAvg(team).toFixed(1)}`);
  });
  lines.push('\הופק ע"י HoopTeams🏀');
  return lines.join('\n');
}

export function shareOnWhatsApp(teams: Player[][]): void {
  const text = formatTeamsForWhatsApp(teams);
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
}
