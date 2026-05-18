import axios from 'axios';
import type { RegistrationState, AllowedPhone, RegisterResult, GameSettings } from '../types/registration';

const BASE = '/api/registration';

function adminHeaders(password: string) {
  return { 'x-admin-password': password };
}

export const registrationApi = {
  getState: () =>
    axios.get<RegistrationState>(BASE).then(r => r.data),

  register: (phone: string, name: string) =>
    axios.post<RegisterResult>(`${BASE}/register`, { phone, name }).then(r => r.data),

  unregister: (phone: string) =>
    axios.delete(`${BASE}/me`, { data: { phone } }),

  // Admin
  getSettings: (password: string) =>
    axios.get<RegistrationState>(BASE, { headers: adminHeaders(password) }).then(r => r.data),

  updateSettings: (password: string, data: Partial<GameSettings & { opensAt: string | null }>) =>
    axios.put<GameSettings>(`${BASE}/settings`, data, { headers: adminHeaders(password) }).then(r => r.data),

  clearRegistrations: (password: string) =>
    axios.delete(`${BASE}/all`, { headers: adminHeaders(password) }),

  removeRegistration: (password: string, id: string) =>
    axios.delete(`${BASE}/${id}`, { headers: adminHeaders(password) }),

  getAllowedPhones: (password: string) =>
    axios.get<AllowedPhone[]>(`${BASE}/allowed-phones`, { headers: adminHeaders(password) }).then(r => r.data),

  addAllowedPhone: (password: string, phone: string, name: string) =>
    axios.post<AllowedPhone>(`${BASE}/allowed-phones`, { phone, name }, { headers: adminHeaders(password) }).then(r => r.data),

  bulkImport: (password: string, lines: string) =>
    axios.post<{ added: number; updated: number; invalid: string[] }>(
      `${BASE}/allowed-phones/bulk`,
      { lines },
      { headers: adminHeaders(password) }
    ).then(r => r.data),

  removeAllowedPhone: (password: string, id: string) =>
    axios.delete(`${BASE}/allowed-phones/${id}`, { headers: adminHeaders(password) }),

  linkPhoneToPlayer: (password: string, phoneId: string, playerId: string | null) =>
    axios.put<AllowedPhone>(`${BASE}/allowed-phones/${phoneId}/link`, { playerId }, { headers: adminHeaders(password) }).then(r => r.data),
};
