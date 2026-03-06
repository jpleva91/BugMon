// BugMon - Entry point and game loop
import { initRenderer, drawMap, drawPlayer, drawBattle, clear } from './engine/renderer.js';
import { clearJustPressed, wasPressed } from './engine/input.js';
import { getState, setState, STATES } from './engine/state.js';
import { loadMap, getMap, getTile } from './world/map.js';
import { getPlayer, updatePlayer } from './world/player.js';
import { setMonstersData, setRarityData as setEncounterRarityData, checkEncounter } from './world/encounters.js';
import { setMovesData, setTypeData, setRarityData as setBattleRarityData, startBattle, getBattle, updateBattle, movesData } from './battle/battleEngine.js';
import { preloadAll } from './sprites/sprites.js';
import { initTileTextures } from './sprites/tiles.js';
import { startTransition, updateTransition, getTransition, drawTransitionOverlay } from './engine/transition.js';
import { initBugDex, recordSeen, drawBugDex, handleBugDexInput, getBugDexData } from './ui/bugdex.js';
import { initStreak, getStreakData, drawStreakHUD } from './ui/streak.js';

let lastTime = 0;
let typeColors = null;
let rarityData = null;
let monstersRef = null;

async function init() {
  const canvas = document.getElementById('game');
  initRenderer(canvas);

  // Load data
  const [monstersRes, movesRes, typesRes, rarityRes] = await Promise.all([
    fetch('data/monsters.json'),
    fetch('data/moves.json'),
    fetch('data/types.json'),
    fetch('data/rarity.json')
  ]);
  const monsters = await monstersRes.json();
  const moves = await movesRes.json();
  const types = await typesRes.json();
  const rarity = await rarityRes.json();

  setMonstersData(monsters);
  setMovesData(moves);
  setTypeData(types);
  setEncounterRarityData(rarity);
  setBattleRarityData(rarity);
  typeColors = types.typeColors;
  rarityData = rarity;
  monstersRef = monsters;

  // Initialize persistence systems
  initBugDex();
  initStreak();

  // Preload sprite images (gracefully falls back if PNGs don't exist yet)
  await preloadAll(monsters);

  await loadMap();
  initTileTextures();

  // Give player a starter BugMon
  const player = getPlayer();
  const starter = { ...monsters[0], currentHP: monsters[0].hp };
  player.party.push(starter);

  // Start game loop
  requestAnimationFrame(loop);
}

function loop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  update(dt);
  render();
  clearJustPressed();

  requestAnimationFrame(loop);
}

function update(dt) {
  const state = getState();

  if (state === STATES.EXPLORE) {
    // Open BugDex with 'b' key
    if (wasPressed('b') || wasPressed('B')) {
      setState(STATES.BUGDEX);
      return;
    }

    const tile = updatePlayer(dt);
    if (tile !== null) {
      const wildMon = checkEncounter(tile);
      if (wildMon) {
        recordSeen(wildMon.id);

        // Look up rarity announcement
        let announcementText = null;
        let announcementColor = null;
        if (rarityData && wildMon.rarity) {
          announcementText = rarityData.encounterText[wildMon.rarity] || null;
          if (announcementText && rarityData.tiers[wildMon.rarity]) {
            announcementColor = rarityData.tiers[wildMon.rarity].color;
          }
        }

        setState(STATES.BATTLE_TRANSITION);
        startTransition(wildMon, announcementText, announcementColor);
      }
    }
  } else if (state === STATES.BATTLE_TRANSITION) {
    const wildMon = updateTransition(dt);
    if (wildMon) {
      setState(STATES.BATTLE);
      startBattle(wildMon);
    }
  } else if (state === STATES.BATTLE) {
    updateBattle(dt);
  } else if (state === STATES.BUGDEX) {
    if (handleBugDexInput()) {
      setState(STATES.EXPLORE);
    }
  }
}

function render() {
  clear();
  const state = getState();

  const ctx = document.getElementById('game').getContext('2d');

  if (state === STATES.EXPLORE) {
    drawMap(getMap());
    drawPlayer(getPlayer());

    // HUD - show party info and streak
    const player = getPlayer();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, 480, 20);
    ctx.fillStyle = '#fff';
    ctx.font = '12px monospace';
    const mon = player.party[0];
    ctx.fillText(`${mon.name} HP:${Math.ceil(mon.currentHP)}/${mon.hp} Party:${player.party.length}`, 5, 14);

    // Streak display
    drawStreakHUD(ctx, 350, 14);

    // BugDex hint
    ctx.fillStyle = '#555';
    ctx.font = '10px monospace';
    ctx.fillText('[B] BugDex', 420, 14);
  } else if (state === STATES.BATTLE_TRANSITION) {
    drawTransitionOverlay(ctx, 480, 320, () => {
      drawMap(getMap());
      drawPlayer(getPlayer());
    });
  } else if (state === STATES.BATTLE) {
    const battle = getBattle();
    if (battle) {
      const rarityTiers = rarityData ? rarityData.tiers : null;
      drawBattle(battle, movesData, typeColors, rarityTiers);
    }
  } else if (state === STATES.BUGDEX) {
    const rarityTiers = rarityData ? rarityData.tiers : null;
    drawBugDex(ctx, monstersRef, rarityTiers);
  }
}

init().catch(err => console.error('BugMon failed to start:', err));
