/**
 * BugMon engine — public API
 */

export { BattleEngine } from "./engine/battle/BattleEngine.js";
export { EventBus } from "./engine/events/EventBus.js";
export { GameStateMachine } from "./engine/state/GameState.js";
export { loadAllData, loadBugMon, loadMoves, loadTypeChart } from "./data/loader.js";

export type { BugMonData, MoveData, TypeChart, BugMonInstance } from "./data/types.js";
export type { BattleState, TurnResult, AttackResult } from "./engine/battle/BattleState.js";
export type { GameState } from "./engine/state/GameState.js";
