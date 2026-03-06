/**
 * CLI battle runner — proves the engine works without any UI.
 *
 * Usage: npm run battle
 */

import { loadAllData } from "../data/loader.js";
import { BattleEngine } from "../engine/battle/BattleEngine.js";

const { bugmon, moves, typeChart } = loadAllData();

// Pick two random BugMon
const idxA = Math.floor(Math.random() * bugmon.length);
let idxB = Math.floor(Math.random() * bugmon.length);
while (idxB === idxA) idxB = Math.floor(Math.random() * bugmon.length);

const monA = bugmon[idxA];
const monB = bugmon[idxB];

console.log("═══════════════════════════════════════");
console.log("          B U G M O N   B A T T L E");
console.log("═══════════════════════════════════════");
console.log();
console.log(`  ${monA.name} (${monA.type})  vs  ${monB.name} (${monB.type})`);
console.log(`  HP: ${monA.hp}  ATK: ${monA.attack}  DEF: ${monA.defense}  SPD: ${monA.speed}`);
console.log(`  HP: ${monB.hp}  ATK: ${monB.attack}  DEF: ${monB.defense}  SPD: ${monB.speed}`);
console.log();
console.log("───────────────────────────────────────");

const seed = Math.floor(Math.random() * 100000);
const engine = new BattleEngine(monA, monB, moves, typeChart, seed);

// Wire up events for CLI output
engine.events.on("TURN_START", ({ turn }) => {
  console.log();
  console.log(`  Turn ${turn}`);
});

engine.events.on("MOVE_USED", ({ attacker, move, defender, damage, effectiveness }) => {
  let msg = `  ${attacker} used ${move}! ${damage} damage to ${defender}`;
  if (effectiveness > 1) msg += " (super effective!)";
  else if (effectiveness < 1) msg += " (not very effective...)";
  console.log(msg);
});

engine.events.on("MOVE_MISSED", ({ attacker, move }) => {
  console.log(`  ${attacker} used ${move}... but it missed!`);
});

engine.events.on("BUGMON_FAINTED", ({ name }) => {
  console.log(`  ${name} fainted!`);
});

engine.events.on("BATTLE_END", ({ winner, turns }) => {
  const winnerName = winner === "A" ? monA.name : monB.name;
  console.log();
  console.log("───────────────────────────────────────");
  console.log(`  ${winnerName} wins in ${turns} turns!`);
  console.log("═══════════════════════════════════════");
  console.log();
  console.log(`  Seed: ${seed} (replay with same seed for identical result)`);
});

// Run the battle
engine.runAutoBattle();
