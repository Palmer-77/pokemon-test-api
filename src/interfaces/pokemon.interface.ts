export interface Pokemon {
  id: number;
  num: string;
  name: string;
  img?: string;
  type: string[];
  height?: string;
  weight?: string;
  candy?: string;
  egg?: string;
  multipliers?: number[] | null;
  weaknesses: string[];
  spawn_chance: number;
  avg_spawns: number;
  spawn_time: string;
  prev_evolution?: { num: string; name: string }[];
} 