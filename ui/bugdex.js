// BugDex - Collection tracker for captured BugMon
import { wasPressed } from '../engine/input.js';
import { drawSprite } from '../sprites/sprites.js';

const STORAGE_KEY = 'bugmon_bugdex';

let bugdexData = null;

export function initBugDex() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      bugdexData = JSON.parse(saved);
    }
  } catch (e) { /* ignore storage errors */ }

  if (!bugdexData) {
    bugdexData = { captures: {}, seen: {}, totalCaptures: 0 };
  }
}

export function recordSeen(monsterId) {
  if (!bugdexData) initBugDex();
  bugdexData.seen[monsterId] = true;
  saveBugDex();
}

export function recordCapture(monsterId) {
  if (!bugdexData) initBugDex();
  bugdexData.seen[monsterId] = true;

  if (!bugdexData.captures[monsterId]) {
    bugdexData.captures[monsterId] = { count: 0, firstCaptured: new Date().toISOString() };
  }
  bugdexData.captures[monsterId].count++;
  bugdexData.totalCaptures++;
  saveBugDex();
}

export function getBugDexData() {
  if (!bugdexData) initBugDex();
  return bugdexData;
}

function saveBugDex() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bugdexData));
  } catch (e) { /* ignore storage errors */ }
}

export function handleBugDexInput() {
  // Return true if BugDex should close
  return wasPressed('Escape') || wasPressed('b') || wasPressed('B');
}

export function drawBugDex(ctx, monstersData, rarityTiers) {
  if (!bugdexData) initBugDex();

  const W = 480;
  const H = 320;

  // Background
  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, W, H);

  // Title
  ctx.fillStyle = '#e94560';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('B U G D E X', W / 2, 24);

  // Stats bar
  const seenCount = Object.keys(bugdexData.seen).length;
  const capturedCount = Object.keys(bugdexData.captures).length;
  ctx.font = '11px monospace';
  ctx.fillStyle = '#888';
  ctx.fillText(`Seen: ${seenCount}/${monstersData.length}  Captured: ${capturedCount}/${monstersData.length}  Total catches: ${bugdexData.totalCaptures}`, W / 2, 42);

  // Grid: 5 columns x 4 rows
  const cols = 5;
  const cellW = 88;
  const cellH = 62;
  const startX = (W - cols * cellW) / 2;
  const startY = 52;

  monstersData.forEach((mon, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * cellW;
    const y = startY + row * cellH;

    const isCaptured = !!bugdexData.captures[mon.id];
    const isSeen = !!bugdexData.seen[mon.id];

    // Cell background
    ctx.fillStyle = '#16213e';
    ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

    // Rarity border
    if (rarityTiers && mon.rarity && rarityTiers[mon.rarity]) {
      ctx.strokeStyle = rarityTiers[mon.rarity].color;
      ctx.lineWidth = isCaptured ? 2 : 1;
    } else {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
    }
    ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);

    if (isCaptured) {
      // Show sprite (small) and name
      const spriteSize = 28;
      const spriteX = x + (cellW - spriteSize) / 2;
      const spriteY = y + 6;
      if (!mon.sprite || !drawSprite(ctx, mon.sprite, spriteX, spriteY, spriteSize, spriteSize)) {
        ctx.fillStyle = mon.color;
        ctx.fillRect(spriteX, spriteY, spriteSize, spriteSize);
      }

      // Name
      ctx.fillStyle = '#fff';
      ctx.font = '8px monospace';
      ctx.textAlign = 'center';
      const displayName = mon.name.length > 12 ? mon.name.slice(0, 11) + '.' : mon.name;
      ctx.fillText(displayName, x + cellW / 2, y + 42);

      // Capture count badge
      ctx.fillStyle = '#e94560';
      ctx.font = '8px monospace';
      ctx.textAlign = 'right';
      ctx.fillText('x' + bugdexData.captures[mon.id].count, x + cellW - 6, y + 54);
      ctx.textAlign = 'left';
    } else if (isSeen) {
      // Silhouette - dark shape with question marks
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(x + 30, y + 8, 28, 28);
      ctx.fillStyle = '#444';
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('?', x + cellW / 2, y + 30);

      ctx.fillStyle = '#555';
      ctx.font = '8px monospace';
      ctx.fillText('???', x + cellW / 2, y + 42);
    } else {
      // Never encountered - empty slot with ID number
      ctx.fillStyle = '#222';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('#' + String(mon.id).padStart(2, '0'), x + cellW / 2, y + 34);
    }
  });

  ctx.textAlign = 'left';

  // Footer
  ctx.fillStyle = '#555';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('Press B or ESC to close', W / 2, H - 8);
  ctx.textAlign = 'left';
}
