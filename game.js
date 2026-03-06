// BugMon - Entry point and game loop
import { initRenderer, drawMap, drawPlayer, drawHUD, drawBattle, drawMenu, clear } from './engine/renderer.js';
import { clearJustPressed, wasPressed } from './engine/input.js';
import { getState, setState, STATES } from './engine/state.js';
import { loadMap, getMap, getTile } from './world/map.js';
import { getPlayer, updatePlayer } from './world/player.js';
import { setMonstersData, checkEncounter } from './world/encounters.js';
import { setMovesData, setTypeData, startBattle, getBattle, updateBattle, movesData } from './battle/battleEngine.js';
import { preloadAll } from './sprites/sprites.js';
import { initTileTextures } from './sprites/tiles.js';
import { startTransition, updateTransition, getTransition, drawTransitionOverlay } from './engine/transition.js';
import { initMonLevel } from './systems/progression.js';
import { initBugDex, markCaught, getDex, getSeenCount, getCaughtCount, getTotalSpecies } from './systems/bugdex.js';
import { getStats, addStep } from './systems/stats.js';
import { saveGame, loadGame, hasSave } from './systems/save.js';
import { playMenuOpen, playMenuNav, playMenuConfirm, playMenuCancel, playSaveSuccess } from './audio/sound.js';

let lastTime = 0;
let typeColors = null;
let monstersDataRef = null;

// Menu state
let menuState = {
  screen: 'main',
  index: 0,
  dexScroll: 0,
  dexIndex: 0,
  partyIndex: 0,
  saveMessage: null,
  saveMessageTimer: 0,
  bugdexInfo: null,
  bugdexData: null,
  statsData: null,
  party: null
};

async function init() {
  const canvas = document.getElementById('game');
  initRenderer(canvas);

  // Load data
  const [monstersRes, movesRes, typesRes] = await Promise.all([
    fetch('data/monsters.json'),
    fetch('data/moves.json'),
    fetch('data/types.json')
  ]);
  const monsters = await monstersRes.json();
  const moves = await movesRes.json();
  const types = await typesRes.json();

  monstersDataRef = monsters;
  setMonstersData(monsters);
  setMovesData(moves);
  setTypeData(types);
  typeColors = types.typeColors;
  initBugDex(monsters.length);

  // Preload sprite images
  await preloadAll(monsters);

  await loadMap();
  initTileTextures();

  // Try to load saved game
  const save = loadGame();
  const player = getPlayer();

  if (save) {
    // Restore saved state
    player.x = save.player.x;
    player.y = save.player.y;
    player.dir = save.player.dir;
    player.party = save.player.party;

    // Import bugdex and stats
    const { importDex } = await import('./systems/bugdex.js');
    const { importStats } = await import('./systems/stats.js');
    importDex(save.bugdex || {});
    importStats(save.stats || {});
  } else {
    // Give player a starter BugMon at level 5
    const starter = { ...monsters[0] };
    initMonLevel(starter, 5);
    player.party.push(starter);
    markCaught(starter.id);
  }

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
    // Check for menu open
    if (wasPressed('m') || wasPressed('M')) {
      openMenu();
      return;
    }

    const tile = updatePlayer(dt);
    if (tile !== null) {
      addStep();
      const wildMon = checkEncounter(tile);
      if (wildMon) {
        setState(STATES.BATTLE_TRANSITION);
        startTransition(wildMon);
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
  } else if (state === STATES.MENU) {
    updateMenu(dt);
  }
}

function openMenu() {
  playMenuOpen();
  menuState = {
    screen: 'main',
    index: 0,
    dexScroll: 0,
    dexIndex: 0,
    partyIndex: 0,
    saveMessage: null,
    saveMessageTimer: 0,
    bugdexInfo: { seen: getSeenCount(), caught: getCaughtCount(), total: getTotalSpecies() },
    bugdexData: getDex(),
    statsData: getStats(),
    party: getPlayer().party
  };
  setState(STATES.MENU);
}

function updateMenu(dt) {
  // Save message timer
  if (menuState.saveMessageTimer > 0) {
    menuState.saveMessageTimer -= dt;
    if (menuState.saveMessageTimer <= 0) {
      menuState.saveMessage = null;
    }
  }

  if (menuState.screen === 'main') {
    updateMainMenu();
  } else if (menuState.screen === 'bugdex') {
    updateBugDexMenu();
  } else if (menuState.screen === 'party') {
    updatePartyMenu();
  } else if (menuState.screen === 'stats') {
    updateSubMenu();
  }
}

function updateMainMenu() {
  const optionCount = 5;

  if (wasPressed('ArrowUp')) { menuState.index = Math.max(0, menuState.index - 1); playMenuNav(); }
  if (wasPressed('ArrowDown')) { menuState.index = Math.min(optionCount - 1, menuState.index + 1); playMenuNav(); }

  if (wasPressed('Escape')) {
    playMenuCancel();
    setState(STATES.EXPLORE);
    return;
  }

  if (wasPressed('Enter') || wasPressed(' ')) {
    playMenuConfirm();
    if (menuState.index === 0) {
      menuState.screen = 'bugdex';
      menuState.dexIndex = 0;
      menuState.dexScroll = 0;
    } else if (menuState.index === 1) {
      menuState.screen = 'party';
      menuState.partyIndex = 0;
    } else if (menuState.index === 2) {
      menuState.screen = 'stats';
      menuState.statsData = getStats();
      menuState.bugdexInfo = { seen: getSeenCount(), caught: getCaughtCount(), total: getTotalSpecies() };
    } else if (menuState.index === 3) {
      const ok = saveGame();
      if (ok) {
        playSaveSuccess();
        menuState.saveMessage = 'Game saved!';
      } else {
        menuState.saveMessage = 'Save failed!';
      }
      menuState.saveMessageTimer = 2000;
    } else if (menuState.index === 4) {
      setState(STATES.EXPLORE);
    }
  }
}

function updateBugDexMenu() {
  const totalMons = monstersDataRef ? monstersDataRef.length : 0;
  const perPage = 10;

  if (wasPressed('ArrowUp')) {
    if (menuState.dexIndex > 0) {
      menuState.dexIndex--;
      playMenuNav();
    } else if (menuState.dexScroll > 0) {
      menuState.dexScroll--;
      playMenuNav();
    }
  }
  if (wasPressed('ArrowDown')) {
    if (menuState.dexIndex < perPage - 1 && menuState.dexScroll + menuState.dexIndex < totalMons - 1) {
      menuState.dexIndex++;
      playMenuNav();
    } else if (menuState.dexScroll + perPage < totalMons) {
      menuState.dexScroll++;
      playMenuNav();
    }
  }

  if (wasPressed('Escape')) {
    playMenuCancel();
    menuState.screen = 'main';
  }
}

function updatePartyMenu() {
  const partySize = getPlayer().party.length;

  if (wasPressed('ArrowUp')) { menuState.partyIndex = Math.max(0, menuState.partyIndex - 1); playMenuNav(); }
  if (wasPressed('ArrowDown')) { menuState.partyIndex = Math.min(partySize - 1, menuState.partyIndex + 1); playMenuNav(); }

  if (wasPressed('Escape')) {
    playMenuCancel();
    menuState.screen = 'main';
  }
}

function updateSubMenu() {
  if (wasPressed('Escape')) {
    playMenuCancel();
    menuState.screen = 'main';
  }
}

function render() {
  clear();
  const state = getState();

  const ctx = document.getElementById('game').getContext('2d');

  if (state === STATES.EXPLORE) {
    drawMap(getMap());
    drawPlayer(getPlayer());
    drawHUD(getPlayer(), { caught: getCaughtCount(), total: getTotalSpecies() });
  } else if (state === STATES.BATTLE_TRANSITION) {
    drawTransitionOverlay(ctx, 480, 320, () => {
      drawMap(getMap());
      drawPlayer(getPlayer());
    });
  } else if (state === STATES.BATTLE) {
    const battle = getBattle();
    if (battle) {
      drawBattle(battle, movesData, typeColors);
    }
  } else if (state === STATES.MENU) {
    drawMenu(menuState, monstersDataRef);
  }
}

init().catch(err => console.error('BugMon failed to start:', err));
