/**
 * Battle state model — pure data, no logic.
 * The BattleEngine operates on this state immutably.
 */

import type { BugMonInstance, MoveData } from "../../data/types.js";

export type BattlePhase = "select" | "resolve" | "fainted" | "end";

export interface BattleState {
  teamA: BugMonInstance;
  teamB: BugMonInstance;
  turn: number;
  phase: BattlePhase;
  winner: "A" | "B" | null;
  turnLog: TurnResult[];
}

export interface TurnResult {
  turn: number;
  first: AttackResult;
  second: AttackResult | null; // null if first attack causes faint
}

export interface AttackResult {
  attacker: string;
  defender: string;
  move: MoveData;
  damage: number;
  effectiveness: number;
  hit: boolean;
  defenderHPAfter: number;
  fainted: boolean;
}

export function createBugMonInstance(
  data: import("../../data/types.js").BugMonData,
  moves: MoveData[]
): BugMonInstance {
  const pp: Record<string, number> = {};
  for (const moveId of data.moves) {
    const move = moves.find((m) => m.id === moveId);
    if (move) pp[moveId] = move.pp;
  }
  return { data, currentHP: data.hp, pp };
}
