// Player stats tracking

const stats = {
  battlesWon: 0,
  captures: 0,
  totalXP: 0,
  steps: 0,
  battlesLost: 0,
  runsAway: 0,
  highestLevel: 1
};

export function getStats() {
  return stats;
}

export function addBattleWon() { stats.battlesWon++; }
export function addCapture() { stats.captures++; }
export function addXP(amount) { stats.totalXP += amount; }
export function addStep() { stats.steps++; }
export function addBattleLost() { stats.battlesLost++; }
export function addRunAway() { stats.runsAway++; }

export function updateHighestLevel(level) {
  if (level > stats.highestLevel) stats.highestLevel = level;
}

// For save/load
export function exportStats() {
  return { ...stats };
}

export function importStats(data) {
  Object.assign(stats, data);
}
