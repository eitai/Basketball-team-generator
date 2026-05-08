import axios from 'axios';
import type { Player, PlayerDraft } from '../types/player';

const BASE = '/api/players';

export const api = {
  getAll: () =>
    axios.get<Player[]>(BASE).then(r => r.data),

  create: (draft: PlayerDraft) =>
    axios.post<Player>(BASE, draft).then(r => r.data),

  update: (id: string, draft: Partial<PlayerDraft>) =>
    axios.put<Player>(`${BASE}/${id}`, draft).then(r => r.data),

  remove: (id: string) =>
    axios.delete(`${BASE}/${id}`),

  removeAll: () =>
    axios.delete(BASE),
};
