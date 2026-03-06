/**
 * Data loader — reads JSON files and returns typed game data.
 * Works in Node.js (CLI/simulation) via fs, not browser fetch.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { BugMonData, MoveData, TypeChart } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../data");

export function loadBugMon(): BugMonData[] {
  const raw = readFileSync(resolve(DATA_DIR, "monsters.json"), "utf-8");
  return JSON.parse(raw);
}

export function loadMoves(): MoveData[] {
  const raw = readFileSync(resolve(DATA_DIR, "moves.json"), "utf-8");
  return JSON.parse(raw);
}

export function loadTypeChart(): TypeChart {
  const raw = readFileSync(resolve(DATA_DIR, "types.json"), "utf-8");
  return JSON.parse(raw);
}

export function loadAllData() {
  return {
    bugmon: loadBugMon(),
    moves: loadMoves(),
    typeChart: loadTypeChart(),
  };
}
