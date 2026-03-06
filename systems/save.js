// Save/Load system using localStorage

import { getPlayer } from '../world/player.js';
import { exportDex, importDex } from './bugdex.js';
import { exportStats, importStats } from './stats.js';

const SAVE_KEY = 'bugmon_save';

export function saveGame() {
  const player = getPlayer();
  const data = {
    version: 1,
    timestamp: Date.now(),
    player: {
      x: player.x,
      y: player.y,
      dir: player.dir,
      party: player.party.map(mon => ({
        id: mon.id,
        name: mon.name,
        type: mon.type,
        hp: mon.hp,
        attack: mon.attack,
        defense: mon.defense,
        speed: mon.speed,
        currentHP: mon.currentHP,
        moves: mon.moves,
        color: mon.color,
        sprite: mon.sprite,
        level: mon.level || 1,
        xp: mon.xp || 0
      }))
    },
    bugdex: exportDex(),
    stats: exportStats()
  };

  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    return false;
  }
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

export function deleteSave() {
  localStorage.removeItem(SAVE_KEY);
}
