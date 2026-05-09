export type Position = 'guard' | 'forward' | 'center';

export interface Player {
  id: string;
  name: string;
  position: Position;
  defense: number;
  offense: number;
  shooting: number;
  passing: number;
  rebounding: number;
  fitness: number;
  ballHandler: boolean;
  generalRating: number;
  isGuest: boolean;
}

export type PlayerDraft = Omit<Player, 'id'>;
