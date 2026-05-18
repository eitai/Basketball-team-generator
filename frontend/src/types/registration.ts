export interface RegistrationEntry {
  id: string;
  displayName: string;
  phone: string; // masked
  registeredAt: string;
  status: 'confirmed' | 'waitlist';
  position: number;
}

export interface GameSettings {
  isOpen: boolean;
  opensAt: string | null;
  maxPlayers: number;
  gameLabel: string;
}

export interface RegistrationState extends GameSettings {
  registrations: RegistrationEntry[];
  members: { name: string }[];
}

export interface AllowedPhone {
  id: string;
  phone: string;
  name: string;
  playerId: string | null;
  player: { id: string; name: string; position: string } | null;
  createdAt: string;
}

export interface RegisterResult {
  alreadyRegistered: boolean;
  displayName: string;
  position: number;
  status: 'confirmed' | 'waitlist';
}
