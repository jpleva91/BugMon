/**
 * Type-safe event bus for decoupled communication between engine systems.
 * All game events flow through here — battle actions, state transitions, etc.
 */

export type EventHandler<T = unknown> = (payload: T) => void;

export interface BattleEvents {
  BATTLE_START: { teamA: string; teamB: string };
  TURN_START: { turn: number };
  MOVE_USED: { attacker: string; move: string; defender: string; damage: number; effectiveness: number };
  MOVE_MISSED: { attacker: string; move: string };
  BUGMON_FAINTED: { name: string; team: "A" | "B" };
  BATTLE_END: { winner: "A" | "B"; turns: number };
  PP_DEPLETED: { bugmon: string; move: string };
}

type EventMap = BattleEvents & Record<string, unknown>;

export class EventBus {
  private handlers = new Map<string, EventHandler[]>();
  private log: Array<{ event: string; payload: unknown; timestamp: number }> = [];
  private recording = false;

  on<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    const list = this.handlers.get(event as string) ?? [];
    list.push(handler as EventHandler);
    this.handlers.set(event as string, list);
  }

  off<K extends keyof EventMap>(event: K, handler: EventHandler<EventMap[K]>): void {
    const list = this.handlers.get(event as string);
    if (!list) return;
    const idx = list.indexOf(handler as EventHandler);
    if (idx >= 0) list.splice(idx, 1);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    if (this.recording) {
      this.log.push({ event: event as string, payload, timestamp: Date.now() });
    }
    const list = this.handlers.get(event as string);
    if (!list) return;
    for (const handler of list) {
      handler(payload);
    }
  }

  /** Start recording events for replay/debugging */
  startRecording(): void {
    this.recording = true;
    this.log = [];
  }

  stopRecording(): Array<{ event: string; payload: unknown; timestamp: number }> {
    this.recording = false;
    return [...this.log];
  }

  getLog(): Array<{ event: string; payload: unknown; timestamp: number }> {
    return [...this.log];
  }

  clear(): void {
    this.handlers.clear();
    this.log = [];
    this.recording = false;
  }
}
