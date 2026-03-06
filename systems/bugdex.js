// BugDex - tracks encountered and captured BugMon

const dex = {};
let totalSpecies = 0;

export function initBugDex(monsterCount) {
  totalSpecies = monsterCount;
}

// Mark a BugMon as seen (encountered in battle)
export function markSeen(monId) {
  if (!dex[monId]) {
    dex[monId] = { seen: true, caught: false };
  } else {
    dex[monId].seen = true;
  }
}

// Mark a BugMon as caught
export function markCaught(monId) {
  if (!dex[monId]) {
    dex[monId] = { seen: true, caught: true };
  } else {
    dex[monId].seen = true;
    dex[monId].caught = true;
  }
}

export function getDex() {
  return dex;
}

export function getSeenCount() {
  return Object.values(dex).filter(e => e.seen).length;
}

export function getCaughtCount() {
  return Object.values(dex).filter(e => e.caught).length;
}

export function getTotalSpecies() {
  return totalSpecies;
}

export function getCompletion() {
  if (totalSpecies === 0) return 0;
  return Math.floor((getCaughtCount() / totalSpecies) * 100);
}

// For save/load
export function exportDex() {
  return { ...dex };
}

export function importDex(data) {
  Object.keys(data).forEach(id => {
    dex[id] = { ...data[id] };
  });
}
