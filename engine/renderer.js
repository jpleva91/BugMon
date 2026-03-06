// Canvas rendering
import { drawSprite } from '../sprites/sprites.js';
import { getTileTexture, getGrassFrame, getBattleBackground } from '../sprites/tiles.js';
import { xpToNextLevel } from '../systems/progression.js';

const TILE = 32;
const COLORS = {
  player: '#3498db'
};

let ctx;
let frameCount = 0;

export function initRenderer(canvas) {
  ctx = canvas.getContext('2d');
}

export function drawMap(mapData) {
  frameCount++;
  for (let y = 0; y < mapData.height; y++) {
    for (let x = 0; x < mapData.width; x++) {
      const tile = mapData.tiles[y][x];
      let texture;
      if (tile === 1) {
        texture = getTileTexture('wall');
      } else if (tile === 2) {
        texture = getGrassFrame(frameCount);
      } else {
        texture = getTileTexture('ground');
      }
      ctx.drawImage(texture, x * TILE, y * TILE);
    }
  }
}

export function drawPlayer(player) {
  const px = player.x * TILE;
  const py = player.y * TILE;

  // Try sprite first
  const spriteName = `player_${player.dir}`;
  if (drawSprite(ctx, spriteName, px, py, TILE, TILE)) return;

  // Fallback: colored square with direction triangle
  ctx.fillStyle = COLORS.player;
  ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);

  ctx.fillStyle = '#2980b9';
  const cx = px + TILE / 2;
  const cy = py + TILE / 2;
  ctx.beginPath();
  if (player.dir === 'up') {
    ctx.moveTo(cx, py + 2);
    ctx.lineTo(cx - 4, py + 10);
    ctx.lineTo(cx + 4, py + 10);
  } else if (player.dir === 'down') {
    ctx.moveTo(cx, py + TILE - 2);
    ctx.lineTo(cx - 4, py + TILE - 10);
    ctx.lineTo(cx + 4, py + TILE - 10);
  } else if (player.dir === 'left') {
    ctx.moveTo(px + 2, cy);
    ctx.lineTo(px + 10, cy - 4);
    ctx.lineTo(px + 10, cy + 4);
  } else {
    ctx.moveTo(px + TILE - 2, cy);
    ctx.lineTo(px + TILE - 10, cy - 4);
    ctx.lineTo(px + TILE - 10, cy + 4);
  }
  ctx.fill();
}

export function drawHUD(player, bugdexInfo) {
  const mon = player.party[0];
  const level = mon.level || 1;
  const xp = mon.xp || 0;
  const xpNeeded = xpToNextLevel(level);

  // Top bar
  ctx.fillStyle = 'rgba(0,0,0,0.75)';
  ctx.fillRect(0, 0, 480, 28);

  ctx.fillStyle = '#fff';
  ctx.font = '11px monospace';
  ctx.fillText(`Lv.${level} ${mon.name}  HP:${Math.ceil(mon.currentHP)}/${mon.hp}  Party:${player.party.length}`, 5, 12);

  // XP bar
  const xpBarX = 5;
  const xpBarY = 17;
  const xpBarW = 120;
  ctx.fillStyle = '#333';
  ctx.fillRect(xpBarX, xpBarY, xpBarW, 6);
  ctx.fillStyle = '#3498db';
  ctx.fillRect(xpBarX, xpBarY, xpBarW * (xp / xpNeeded), 6);
  ctx.fillStyle = '#aaa';
  ctx.font = '8px monospace';
  ctx.fillText(`XP:${xp}/${xpNeeded}`, xpBarX + xpBarW + 4, xpBarY + 5);

  // BugDex count (top right)
  if (bugdexInfo) {
    ctx.fillStyle = '#f1c40f';
    ctx.font = '10px monospace';
    ctx.fillText(`DEX:${bugdexInfo.caught}/${bugdexInfo.total}`, 410, 12);
  }

  // Menu hint
  ctx.fillStyle = '#666';
  ctx.font = '9px monospace';
  ctx.fillText('[M]enu', 430, 24);
}

export function drawBattle(battle, movesData, typeColors) {
  // Background
  const bg = getBattleBackground();
  if (bg) {
    ctx.drawImage(bg, 0, 0);
  } else {
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 480, 320);
  }

  // Enemy BugMon (top right)
  if (!battle.enemy.sprite || !drawSprite(ctx, battle.enemy.sprite, 320, 40, 64, 64)) {
    ctx.fillStyle = battle.enemy.color;
    ctx.fillRect(320, 40, 64, 64);
  }
  ctx.fillStyle = '#fff';
  ctx.font = '14px monospace';
  const enemyLabel = `Lv.${battle.enemy.level || 1} ${battle.enemy.name}`;
  ctx.fillText(enemyLabel, 280, 30);
  if (typeColors && battle.enemy.type) {
    drawTypeBadge(enemyLabel, 280, 30, battle.enemy.type, typeColors);
  }
  drawHPBar(300, 110, 100, battle.enemy.currentHP, battle.enemy.hp);

  // Player BugMon (bottom left)
  const playerMon = battle.playerMon;
  if (!playerMon.sprite || !drawSprite(ctx, playerMon.sprite, 80, 140, 64, 64)) {
    ctx.fillStyle = playerMon.color;
    ctx.fillRect(80, 140, 64, 64);
  }
  ctx.fillStyle = '#fff';
  const playerLabel = `Lv.${playerMon.level || 1} ${playerMon.name}`;
  ctx.fillText(playerLabel, 40, 130);
  if (typeColors && playerMon.type) {
    drawTypeBadge(playerLabel, 40, 130, playerMon.type, typeColors);
  }
  drawHPBar(60, 210, 100, playerMon.currentHP, playerMon.hp);

  // XP bar under player mon HP
  const xp = playerMon.xp || 0;
  const xpNeeded = xpToNextLevel(playerMon.level || 1);
  ctx.fillStyle = '#222';
  ctx.fillRect(60, 222, 100, 4);
  ctx.fillStyle = '#3498db';
  ctx.fillRect(60, 222, 100 * (xp / xpNeeded), 4);

  // Menu area
  ctx.fillStyle = '#16213e';
  ctx.fillRect(0, 240, 480, 80);
  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 240, 480, 80);

  if (battle.state === 'menu') {
    const options = ['Fight', 'Capture', 'Run'];
    options.forEach((opt, i) => {
      ctx.fillStyle = i === battle.menuIndex ? '#e94560' : '#fff';
      ctx.font = '16px monospace';
      ctx.fillText(opt, 20 + i * 160, 275);
    });
  } else if (battle.state === 'fight') {
    const moves = playerMon.moves;
    moves.forEach((moveId, i) => {
      const move = movesData.find(m => m.id === moveId);
      if (move) {
        // Type color dot
        if (typeColors && move.type) {
          ctx.fillStyle = typeColors[move.type] || '#fff';
          ctx.beginPath();
          ctx.arc(14 + i * 160, 271, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = i === battle.moveIndex ? '#e94560' : '#fff';
        ctx.font = '14px monospace';
        ctx.fillText(move.name, 22 + i * 160, 275);
      }
    });
  } else if (battle.state === 'message') {
    ctx.fillStyle = '#fff';
    ctx.font = '14px monospace';
    ctx.fillText(battle.message, 20, 275);
  }
}

export function drawMenu(menuState, monstersData) {
  ctx.fillStyle = '#0f0f23';
  ctx.fillRect(0, 0, 480, 320);

  ctx.strokeStyle = '#e94560';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, 472, 312);

  if (menuState.screen === 'main') {
    drawMainMenu(menuState);
  } else if (menuState.screen === 'bugdex') {
    drawBugDex(menuState, monstersData);
  } else if (menuState.screen === 'party') {
    drawParty(menuState);
  } else if (menuState.screen === 'stats') {
    drawStatsScreen(menuState);
  }
}

function drawMainMenu(menuState) {
  ctx.fillStyle = '#e94560';
  ctx.font = '20px monospace';
  ctx.fillText('MENU', 200, 40);

  const options = ['BugDex', 'Party', 'Stats', 'Save', 'Close'];
  options.forEach((opt, i) => {
    ctx.fillStyle = i === menuState.index ? '#e94560' : '#fff';
    ctx.font = '16px monospace';
    const marker = i === menuState.index ? '> ' : '  ';
    ctx.fillText(marker + opt, 160, 80 + i * 35);
  });

  if (menuState.saveMessage) {
    ctx.fillStyle = '#2ecc71';
    ctx.font = '12px monospace';
    ctx.fillText(menuState.saveMessage, 170, 270);
  }
}

function drawBugDex(menuState, monstersData) {
  ctx.fillStyle = '#f1c40f';
  ctx.font = '18px monospace';
  ctx.fillText(`BugDex  ${menuState.bugdexInfo.caught}/${menuState.bugdexInfo.total} caught`, 20, 35);

  // Completion bar
  const pct = menuState.bugdexInfo.total > 0 ? menuState.bugdexInfo.caught / menuState.bugdexInfo.total : 0;
  ctx.fillStyle = '#333';
  ctx.fillRect(20, 42, 200, 8);
  ctx.fillStyle = '#f1c40f';
  ctx.fillRect(20, 42, 200 * pct, 8);

  const dex = menuState.bugdexData;
  const startIdx = menuState.dexScroll || 0;
  const perPage = 10;

  if (!monstersData) return;

  for (let i = 0; i < perPage && startIdx + i < monstersData.length; i++) {
    const mon = monstersData[startIdx + i];
    const entry = dex[mon.id];
    const y = 70 + i * 22;
    const isSelected = i === (menuState.dexIndex || 0);

    ctx.fillStyle = isSelected ? '#e94560' : '#888';
    ctx.font = '12px monospace';

    if (entry && entry.caught) {
      ctx.fillStyle = isSelected ? '#e94560' : '#fff';
      ctx.fillText(`#${String(mon.id).padStart(2, '0')} ${mon.name}`, 30, y);
      // Type badge
      ctx.fillStyle = mon.color;
      ctx.beginPath();
      ctx.arc(22, y - 4, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (entry && entry.seen) {
      ctx.fillStyle = isSelected ? '#e94560' : '#aaa';
      ctx.fillText(`#${String(mon.id).padStart(2, '0')} ${mon.name}`, 30, y);
      ctx.fillStyle = '#555';
      ctx.font = '10px monospace';
      ctx.fillText('(seen)', 200, y);
    } else {
      ctx.fillText(`#${String(mon.id).padStart(2, '0')} ???`, 30, y);
    }
  }

  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  ctx.fillText('[B] Back  [UP/DOWN] Scroll', 20, 305);
}

function drawParty(menuState) {
  ctx.fillStyle = '#3498db';
  ctx.font = '18px monospace';
  ctx.fillText('Party', 20, 35);

  const party = menuState.party;
  party.forEach((mon, i) => {
    const y = 60 + i * 42;
    const isSelected = i === (menuState.partyIndex || 0);

    // Background
    ctx.fillStyle = isSelected ? 'rgba(233, 69, 96, 0.2)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(20, y - 12, 440, 36);

    // Color dot
    ctx.fillStyle = mon.color;
    ctx.beginPath();
    ctx.arc(34, y + 5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Name and level
    ctx.fillStyle = isSelected ? '#e94560' : '#fff';
    ctx.font = '13px monospace';
    ctx.fillText(`Lv.${mon.level || 1} ${mon.name}`, 46, y + 2);

    // Type
    ctx.fillStyle = '#888';
    ctx.font = '10px monospace';
    ctx.fillText(mon.type, 46, y + 16);

    // HP bar
    const hpPct = Math.max(0, mon.currentHP / mon.hp);
    ctx.fillStyle = '#333';
    ctx.fillRect(250, y - 2, 80, 8);
    ctx.fillStyle = hpPct > 0.5 ? '#2ecc71' : hpPct > 0.2 ? '#f39c12' : '#e74c3c';
    ctx.fillRect(250, y - 2, 80 * hpPct, 8);
    ctx.fillStyle = '#aaa';
    ctx.font = '10px monospace';
    ctx.fillText(`${Math.ceil(mon.currentHP)}/${mon.hp}`, 335, y + 5);

    // Stats
    ctx.fillStyle = '#777';
    ctx.fillText(`ATK:${mon.attack} DEF:${mon.defense} SPD:${mon.speed}`, 250, y + 18);
  });

  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  ctx.fillText('[B] Back', 20, 305);
}

function drawStatsScreen(menuState) {
  ctx.fillStyle = '#2ecc71';
  ctx.font = '18px monospace';
  ctx.fillText('Stats', 20, 35);

  const s = menuState.statsData;
  const lines = [
    `Battles Won:     ${s.battlesWon}`,
    `Battles Lost:    ${s.battlesLost}`,
    `Captures:        ${s.captures}`,
    `Total XP Earned: ${s.totalXP}`,
    `Steps Taken:     ${s.steps}`,
    `Times Fled:      ${s.runsAway}`,
    `Highest Level:   ${s.highestLevel}`
  ];

  lines.forEach((line, i) => {
    ctx.fillStyle = '#fff';
    ctx.font = '13px monospace';
    ctx.fillText(line, 40, 70 + i * 28);
  });

  // BugDex completion
  const info = menuState.bugdexInfo;
  ctx.fillStyle = '#f1c40f';
  ctx.font = '13px monospace';
  ctx.fillText(`BugDex: ${info.caught}/${info.total} (${Math.floor((info.caught / info.total) * 100)}%)`, 40, 70 + lines.length * 28 + 10);

  ctx.fillStyle = '#666';
  ctx.font = '10px monospace';
  ctx.fillText('[B] Back', 20, 305);
}

function drawTypeBadge(name, nameX, nameY, type, typeColors) {
  ctx.font = '14px monospace';
  const nameWidth = ctx.measureText(name).width;
  const label = type.toUpperCase();
  ctx.font = '9px monospace';
  const labelWidth = ctx.measureText(label).width;
  const badgeX = nameX + nameWidth + 6;
  const badgeY = nameY - 10;
  const badgeW = labelWidth + 8;
  const badgeH = 13;

  ctx.fillStyle = typeColors[type] || '#555';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 3);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.fillText(label, badgeX + 4, nameY - 1);
}

function drawHPBar(x, y, width, current, max) {
  const pct = Math.max(0, current / max);
  ctx.fillStyle = '#333';
  ctx.fillRect(x, y, width, 10);
  ctx.fillStyle = pct > 0.5 ? '#2ecc71' : pct > 0.2 ? '#f39c12' : '#e74c3c';
  ctx.fillRect(x, y, width * pct, 10);
  ctx.fillStyle = '#fff';
  ctx.font = '10px monospace';
  ctx.fillText(`${Math.max(0, Math.ceil(current))}/${max}`, x + width + 5, y + 9);
}

export function clear() {
  ctx.clearRect(0, 0, 480, 320);
}
