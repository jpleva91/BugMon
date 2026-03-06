/**
 * Deterministic battle engine.
 *
 * - Pure logic, no UI dependencies
 * - Seeded RNG for reproducible battles
 * - Emits events for any consumer (CLI, browser, simulation)
 */

import type { BugMonData, MoveData, TypeChart } from "../../data/types.js";
import type { AttackResult, BattleState, TurnResult } from "./BattleState.js";
import { createBugMonInstance } from "./BattleState.js";
import { SeededRNG, calcDamage, checkAccuracy } from "./DamageCalculator.js";
import { EventBus } from "../events/EventBus.js";

export class BattleEngine {
  private state: BattleState;
  private moves: MoveData[];
  private typeChart: TypeChart | null;
  private rng: SeededRNG;
  readonly events: EventBus;

  constructor(
    teamAData: BugMonData,
    teamBData: BugMonData,
    moves: MoveData[],
    typeChart: TypeChart | null = null,
    seed: number = Date.now()
  ) {
    this.moves = moves;
    this.typeChart = typeChart;
    this.rng = new SeededRNG(seed);
    this.events = new EventBus();

    this.state = {
      teamA: createBugMonInstance(teamAData, moves),
      teamB: createBugMonInstance(teamBData, moves),
      turn: 0,
      phase: "select",
      winner: null,
      turnLog: [],
    };
  }

  getState(): Readonly<BattleState> {
    return this.state;
  }

  /** Execute a full turn given move choices for both sides */
  executeTurn(moveIdA: string, moveIdB: string): TurnResult {
    const moveA = this.moves.find((m) => m.id === moveIdA);
    const moveB = this.moves.find((m) => m.id === moveIdB);
    if (!moveA || !moveB) throw new Error(`Unknown move: ${moveIdA} or ${moveIdB}`);

    this.state.turn++;
    this.state.phase = "resolve";

    this.events.emit("TURN_START", { turn: this.state.turn });

    // Deduct PP
    this.deductPP(this.state.teamA, moveIdA);
    this.deductPP(this.state.teamB, moveIdB);

    // Speed determines order
    const aFirst = this.state.teamA.data.speed >= this.state.teamB.data.speed;

    const firstAttacker = aFirst ? this.state.teamA : this.state.teamB;
    const firstDefender = aFirst ? this.state.teamB : this.state.teamA;
    const firstMove = aFirst ? moveA : moveB;
    const secondAttacker = aFirst ? this.state.teamB : this.state.teamA;
    const secondDefender = aFirst ? this.state.teamA : this.state.teamB;
    const secondMove = aFirst ? moveB : moveA;

    const firstResult = this.resolveAttack(firstAttacker, firstMove, firstDefender);
    let secondResult: AttackResult | null = null;

    if (!firstResult.fainted) {
      secondResult = this.resolveAttack(secondAttacker, secondMove, secondDefender);
    }

    const turnResult: TurnResult = {
      turn: this.state.turn,
      first: firstResult,
      second: secondResult,
    };
    this.state.turnLog.push(turnResult);

    // Check for battle end
    if (this.state.teamB.currentHP <= 0) {
      this.state.phase = "end";
      this.state.winner = "A";
      this.events.emit("BUGMON_FAINTED", { name: this.state.teamB.data.name, team: "B" });
      this.events.emit("BATTLE_END", { winner: "A", turns: this.state.turn });
    } else if (this.state.teamA.currentHP <= 0) {
      this.state.phase = "end";
      this.state.winner = "B";
      this.events.emit("BUGMON_FAINTED", { name: this.state.teamA.data.name, team: "A" });
      this.events.emit("BATTLE_END", { winner: "B", turns: this.state.turn });
    } else {
      this.state.phase = "select";
    }

    return turnResult;
  }

  /** Run a fully automated battle — both sides pick random moves */
  runAutoBattle(): BattleState {
    this.events.emit("BATTLE_START", {
      teamA: this.state.teamA.data.name,
      teamB: this.state.teamB.data.name,
    });

    while (this.state.phase !== "end") {
      const moveA = this.pickRandomMove(this.state.teamA);
      const moveB = this.pickRandomMove(this.state.teamB);
      this.executeTurn(moveA, moveB);
    }

    return this.state;
  }

  isOver(): boolean {
    return this.state.phase === "end";
  }

  private resolveAttack(
    attacker: import("../../data/types.js").BugMonInstance,
    move: MoveData,
    defender: import("../../data/types.js").BugMonInstance
  ): AttackResult {
    const hit = checkAccuracy(move, this.rng);

    if (!hit) {
      this.events.emit("MOVE_MISSED", { attacker: attacker.data.name, move: move.name });
      return {
        attacker: attacker.data.name,
        defender: defender.data.name,
        move,
        damage: 0,
        effectiveness: 1,
        hit: false,
        defenderHPAfter: defender.currentHP,
        fainted: false,
      };
    }

    const { damage, effectiveness } = calcDamage(attacker, move, defender, this.typeChart, this.rng);
    defender.currentHP = Math.max(0, defender.currentHP - damage);

    this.events.emit("MOVE_USED", {
      attacker: attacker.data.name,
      move: move.name,
      defender: defender.data.name,
      damage,
      effectiveness,
    });

    return {
      attacker: attacker.data.name,
      defender: defender.data.name,
      move,
      damage,
      effectiveness,
      hit: true,
      defenderHPAfter: defender.currentHP,
      fainted: defender.currentHP <= 0,
    };
  }

  private deductPP(bugmon: import("../../data/types.js").BugMonInstance, moveId: string): void {
    if (bugmon.pp[moveId] !== undefined && bugmon.pp[moveId] > 0) {
      bugmon.pp[moveId]--;
      if (bugmon.pp[moveId] === 0) {
        this.events.emit("PP_DEPLETED", { bugmon: bugmon.data.name, move: moveId });
      }
    }
  }

  private pickRandomMove(bugmon: import("../../data/types.js").BugMonInstance): string {
    // Prefer moves with PP remaining
    const available = bugmon.data.moves.filter((id) => (bugmon.pp[id] ?? 0) > 0);
    const pool = available.length > 0 ? available : bugmon.data.moves;
    const idx = this.rng.nextInt(0, pool.length - 1);
    return pool[idx];
  }
}
