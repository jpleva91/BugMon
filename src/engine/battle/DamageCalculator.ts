/**
 * Deterministic damage calculation.
 * Uses a seeded RNG so battles can be replayed exactly.
 */

import type { BugMonInstance, MoveData, TypeChart } from "../../data/types.js";

/** Simple seeded PRNG (mulberry32) for deterministic battles */
export class SeededRNG {
  private state: number;

  constructor(seed: number) {
    this.state = seed;
  }

  /** Returns a float in [0, 1) */
  next(): number {
    this.state |= 0;
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Returns an integer in [min, max] inclusive */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }
}

export function calcDamage(
  attacker: BugMonInstance,
  move: MoveData,
  defender: BugMonInstance,
  typeChart: TypeChart | null,
  rng: SeededRNG
): { damage: number; effectiveness: number } {
  const random = rng.nextInt(1, 3);
  let dmg = move.power + attacker.data.attack - Math.floor(defender.data.defense / 2) + random;

  let effectiveness = 1.0;
  if (typeChart && move.type && defender.data.type) {
    effectiveness = typeChart.effectiveness[move.type]?.[defender.data.type] ?? 1.0;
  }
  dmg = Math.floor(dmg * effectiveness);

  return { damage: Math.max(1, dmg), effectiveness };
}

export function checkAccuracy(move: MoveData, rng: SeededRNG): boolean {
  return rng.next() * 100 < move.accuracy;
}
