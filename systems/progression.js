// XP and leveling system
// Core loop: defeat/capture bugmon → earn XP → level up → stats grow → repeat

const MAX_LEVEL = 20;

// XP needed to reach next level from current level
export function xpToNextLevel(level) {
  return level * 25;
}

// Calculate total XP needed from level 1 to target level
export function totalXPForLevel(level) {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += xpToNextLevel(i);
  }
  return total;
}

// XP reward for defeating a wild BugMon
export function defeatXP(enemyLevel) {
  return enemyLevel * 10 + 5;
}

// XP reward for capturing a wild BugMon
export function captureXP(enemyLevel) {
  return enemyLevel * 8 + 3;
}

// Apply level-up stat growth to a BugMon
// Returns array of level-up messages
export function applyXP(mon, xpGained) {
  if (!mon.level) mon.level = 1;
  if (!mon.xp) mon.xp = 0;

  mon.xp += xpGained;
  const messages = [];

  while (mon.level < MAX_LEVEL && mon.xp >= xpToNextLevel(mon.level)) {
    mon.xp -= xpToNextLevel(mon.level);
    mon.level++;

    // Stat growth
    const hpGain = 2;
    const atkGain = mon.level % 2 === 0 ? 1 : 0;
    const defGain = mon.level % 2 === 1 ? 1 : 0;
    const spdGain = mon.level % 3 === 0 ? 1 : 0;

    mon.hp += hpGain;
    mon.attack += atkGain;
    mon.defense += defGain;
    mon.speed += spdGain;
    mon.currentHP += hpGain; // Heal the HP gained

    let gains = `+${hpGain} HP`;
    if (atkGain) gains += ` +${atkGain} ATK`;
    if (defGain) gains += ` +${defGain} DEF`;
    if (spdGain) gains += ` +${spdGain} SPD`;

    messages.push({
      level: mon.level,
      name: mon.name,
      gains
    });
  }

  return messages;
}

// Initialize a BugMon with level data
export function initMonLevel(mon, level) {
  mon.level = level || 1;
  mon.xp = 0;

  // Scale stats from base (level 1) to target level
  for (let i = 2; i <= mon.level; i++) {
    mon.hp += 2;
    mon.attack += i % 2 === 0 ? 1 : 0;
    mon.defense += i % 2 === 1 ? 1 : 0;
    mon.speed += i % 3 === 0 ? 1 : 0;
  }
  mon.currentHP = mon.hp;
}

// Pick a wild BugMon level based on player's strongest mon
export function wildLevel(playerParty) {
  const maxLevel = Math.max(...playerParty.map(m => m.level || 1));
  // Wild mons range from maxLevel-2 to maxLevel+1, clamped to 1-MAX_LEVEL
  const min = Math.max(1, maxLevel - 2);
  const max = Math.min(MAX_LEVEL, maxLevel + 1);
  return min + Math.floor(Math.random() * (max - min + 1));
}
