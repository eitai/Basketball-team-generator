import type { Player } from '../types/player';
import { CATEGORIES } from './constants';

type CategoryKey = (typeof CATEGORIES)[number]['key'];

export const computeOverall = (p: Player): number => {
  const vals = CATEGORIES.map(c => (p[c.key as CategoryKey] as number) ?? 5);
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
};

// 70% general rating, 30% category average
export const computeBalancingScore = (p: Player): number =>
  Math.round(computeOverall(p) * 0.3 + (p.generalRating ?? 5) * 0.7);

export const teamSum = (t: Player[]): number =>
  t.reduce((s, p) => s + computeBalancingScore(p), 0);

export const teamAvg = (t: Player[]): number =>
  t.length ? teamSum(t) / t.length : 0;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function generateBalancedTeams(
  players: Player[],
  numTeams = 3,
  randomize = false,
  locked: Map<string, number> = new Map()
): Player[][] {
  if (players.length === 0 || numTeams < 1) return [];
  const base = [...players].sort((a, b) => computeBalancingScore(b) - computeBalancingScore(a));

  // When randomizing, shuffle players within same-rating groups so the snake
  // draft starts from a different arrangement each time.
  const sorted = randomize
    ? base.reduce<Player[]>((acc, p, i, arr) => {
        const sc = computeBalancingScore(p);
        if (i === 0 || computeBalancingScore(arr[i - 1]!) !== sc) {
          let end = i + 1;
          while (end < arr.length && computeBalancingScore(arr[end]!) === sc) end++;
          acc.push(...shuffle(arr.slice(i, end)));
        }
        return acc;
      }, [])
    : base;

  const lockedInRange = players.filter(p => {
    const idx = locked.get(p.id);
    return idx !== undefined && idx >= 0 && idx < numTeams;
  });
  const freePlayers = sorted.filter(p => {
    const idx = locked.get(p.id);
    return idx === undefined || idx < 0 || idx >= numTeams;
  });

  const teams: Player[][] = Array.from({ length: numTeams }, () => []);
  lockedInRange.forEach(p => {
    teams[locked.get(p.id)!]!.push(p);
  });

  // Each team's target total size — distribute extras to teams with fewer locked players
  const baseTarget = Math.floor(players.length / numTeams);
  const extraSlots = players.length % numTeams;
  const teamsByLocked = [...Array(numTeams).keys()].sort((a, b) => teams[a].length - teams[b].length);
  const targets = new Array<number>(numTeams).fill(baseTarget);
  for (let i = 0; i < extraSlots; i++) targets[teamsByLocked[i]] += 1;
  const freeNeeded = teams.map((t, i) => Math.max(0, targets[i] - t.length));
  // Snake draft respecting per-team quotas
  const remaining = [...freeNeeded];
  const draftOrder: number[] = [];
  while (remaining.some(r => r > 0)) {
    for (let t = 0; t < numTeams; t++) {
      if (remaining[t] > 0) { draftOrder.push(t); remaining[t]--; }
    }
    if (!remaining.some(r => r > 0)) break;
    for (let t = numTeams - 1; t >= 0; t--) {
      if (remaining[t] > 0) { draftOrder.push(t); remaining[t]--; }
    }
  }

  freePlayers.forEach((player, i) => {
    if (draftOrder[i] !== undefined) teams[draftOrder[i]!].push(player);
  });


  const totalCenters = players.filter(p => p.position === 'center').length;
  const idealCenters = totalCenters / numTeams;
  const totalBallHandlers = players.filter(p => p.ballHandler).length;
  const maxBhPerTeam = Math.ceil(totalBallHandlers / numTeams);
  // Highest-rated ball handler — should always be on the team with fewest BH
  const topBH = sorted.find(p => p.ballHandler) ?? null;

  const score = (tms: Player[][]): number => {
    const sums = tms.map(teamSum);
    const mean = sums.reduce((a, b) => a + b, 0) / sums.length;
    const sumVariance = sums.reduce((s, x) => s + (x - mean) ** 2, 0) / sums.length;

    let positionPenalty = 0;
    tms.forEach(team => {
      const centers = team.filter(p => p.position === 'center').length;
      if (totalCenters >= numTeams && centers === 0) positionPenalty += 500;
      if (centers > Math.ceil(idealCenters)) positionPenalty += 25 * (centers - Math.ceil(idealCenters));
    });

    let ballHandlerPenalty = 0;
    if (totalBallHandlers >= numTeams) {
      tms.forEach(team => {
        if (!team.some(p => p.ballHandler)) ballHandlerPenalty += 100;
      });
    }

    // Penalize if top BH's team has more BH than the team with the fewest BH
    // (top BH should always be on the team with the minimum number of BH)
    let bhConcentrationPenalty = 0;
    if (totalBallHandlers > 1 && topBH) {
      const topBHTeamIdx = tms.findIndex(t => t.some(p => p.id === topBH.id));
      if (topBHTeamIdx >= 0) {
        const topBHCount = tms[topBHTeamIdx]!.filter(p => p.ballHandler).length;
        const otherMinBH = Math.min(...tms.filter((_, i) => i !== topBHTeamIdx).map(t => t.filter(p => p.ballHandler).length));
        if (topBHCount > otherMinBH) bhConcentrationPenalty += (topBHCount - otherMinBH) * 300;
      }
    }
    // Also prevent any team from exceeding the max threshold
    if (totalBallHandlers > 1) {
      tms.forEach(team => {
        const count = team.filter(p => p.ballHandler).length;
        if (count > maxBhPerTeam) bhConcentrationPenalty += (count - maxBhPerTeam) * 200;
      });
    }

    const topPlayers = sorted.slice(0, numTeams);
    const teamsWithStars = new Set<number>();
    topPlayers.forEach(p => { tms.forEach((t, i) => { if (t.includes(p)) teamsWithStars.add(i); }); });
    const starPenalty = (numTeams - teamsWithStars.size) * 40;
    const topHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const topPerTeam = tms.map(t => t.filter(p => topHalf.includes(p)).length);
    const topMean = topPerTeam.reduce((a, b) => a + b, 0) / numTeams;
    const topVariance = topPerTeam.reduce((s, x) => s + (x - topMean) ** 2, 0) / numTeams;
    return sumVariance + positionPenalty + ballHandlerPenalty + bhConcentrationPenalty + starPenalty + topVariance * 8;
  };

  let improved = true;
  let iters = 0;
  while (improved && iters < 300) {
    improved = false;
    iters++;
    let bestDelta = 0;
    let bestSwap: { i: number; j: number; pi: number; pj: number } | null = null;
    const baseScore = score(teams);
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        for (let pi = 0; pi < teams[i].length; pi++) {
          if (locked.has(teams[i][pi]!.id)) continue;
          for (let pj = 0; pj < teams[j].length; pj++) {
            if (locked.has(teams[j][pj]!.id)) continue;
            const a = teams[i][pi]!;
            const b = teams[j][pj]!;
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
      const a = teams[i][pi]!;
      const b = teams[j][pj]!;
      teams[i][pi] = b; teams[j][pj] = a;
      improved = true;
    }
  }

  // When there are fewer centers than teams, move them to the weakest teams.
  if (totalCenters > 0 && totalCenters < numTeams) {
    const byStrength = [...teams].sort((a, b) => teamSum(a) - teamSum(b));
    for (let slot = 0; slot < totalCenters; slot++) {
      const weakTeam = byStrength[slot]!;
      if (weakTeam.some(p => p.position === 'center')) continue;
      for (let s = totalCenters; s < byStrength.length; s++) {
        const strongTeam = byStrength[s]!;
        const cIdx = strongTeam.findIndex(p => p.position === 'center' && !locked.has(p.id));
        if (cIdx < 0) continue;
        const center = strongTeam[cIdx]!;
        let bestIdx = 0;
        let bestDiff = Infinity;
        weakTeam.forEach((p, i) => {
          if (p.position !== 'center' && !locked.has(p.id)) {
            const diff = Math.abs(computeOverall(p) - computeOverall(center));
            if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
          }
        });
        strongTeam[cIdx] = weakTeam[bestIdx]!;
        weakTeam[bestIdx] = center;
        break;
      }
    }
  }

  // When there are fewer ball handlers than teams, move them to the weakest teams.
  if (totalBallHandlers > 0 && totalBallHandlers < numTeams) {
    const byStrength = [...teams].sort((a, b) => teamSum(a) - teamSum(b));
    for (let slot = 0; slot < totalBallHandlers; slot++) {
      const weakTeam = byStrength[slot]!;
      if (weakTeam.some(p => p.ballHandler)) continue;
      // Find a stronger team that has a ball handler
      for (let s = totalBallHandlers; s < byStrength.length; s++) {
        const strongTeam = byStrength[s]!;
        const bhIdx = strongTeam.findIndex(p => p.ballHandler && !locked.has(p.id));
        if (bhIdx < 0) continue;
        const bh = strongTeam[bhIdx]!;
        // Swap with the non-BH player in weakTeam closest in rating
        let bestIdx = 0;
        let bestDiff = Infinity;
        weakTeam.forEach((p, i) => {
          if (!p.ballHandler && !locked.has(p.id)) {
            const diff = Math.abs(computeOverall(p) - computeOverall(bh));
            if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
          }
        });
        strongTeam[bhIdx] = weakTeam[bestIdx]!;
        weakTeam[bestIdx] = bh;
        break;
      }
    }
  }

  if (locked.size === 0) teams.sort((a, b) => teamSum(b) - teamSum(a));
  return teams;
}
