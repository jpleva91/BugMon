/**
 * Core data types for BugMon.
 * These define the shape of data loaded from JSON — the engine's contract.
 */

export interface BugMonData {
  id: number;
  name: string;
  type: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  moves: string[];
  color?: string;
  sprite?: string;
  description?: string;
}

export interface MoveData {
  id: string;
  name: string;
  power: number;
  accuracy: number;
  pp: number;
  type: string;
}

export interface TypeChart {
  types: string[];
  typeColors: Record<string, string>;
  effectiveness: Record<string, Record<string, number>>;
}

/** Runtime instance of a BugMon in battle */
export interface BugMonInstance {
  data: BugMonData;
  currentHP: number;
  pp: Record<string, number>; // moveId -> remaining PP
}
