// Random encounter logic
import { playEncounterAlert } from '../audio/sound.js';
import { wildLevel, initMonLevel } from '../systems/progression.js';
import { getPlayer } from './player.js';

let monstersData = [];

export function setMonstersData(data) {
  monstersData = data;
}

export function checkEncounter(tile) {
  // Only trigger in tall grass (tile 2), 10% chance
  if (tile !== 2) return null;
  if (Math.random() > 0.10) return null;

  playEncounterAlert();

  // Pick a random wild BugMon with scaled level
  const template = monstersData[Math.floor(Math.random() * monstersData.length)];
  const player = getPlayer();
  const level = wildLevel(player.party);

  const wild = { ...template };
  initMonLevel(wild, level);

  return wild;
}
