/**
 * Game state machine — controls top-level game flow.
 * The engine only cares about these states. UI is a consumer.
 */

export type GameState = "menu" | "battle" | "idle";

export class GameStateMachine {
  private state: GameState = "menu";
  private listeners: Array<(from: GameState, to: GameState) => void> = [];

  getState(): GameState {
    return this.state;
  }

  transition(to: GameState): void {
    const from = this.state;
    this.state = to;
    for (const listener of this.listeners) {
      listener(from, to);
    }
  }

  onTransition(listener: (from: GameState, to: GameState) => void): void {
    this.listeners.push(listener);
  }
}
