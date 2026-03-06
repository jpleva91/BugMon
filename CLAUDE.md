# CLAUDE.md — AI Assistant Guide for BugMon

## Project Overview

BugMon is a Pokémon-style monster-taming RPG browser game themed around software bugs. Players explore a tile-based world, encounter wild "BugMon" (creatures named after programming bugs like NullPointer, Deadlock, StackOverflow), battle them with turn-based combat, and catch them for their party.

**Key characteristics:**
- 100% client-side, zero external dependencies
- Vanilla JavaScript (ES6 modules), HTML5 Canvas 2D, Web Audio API
- No build tools, no bundler, no framework
- ~1,650 lines of source code
- Deployed to GitHub Pages

## Quick Start

No build step required. Serve with any static file server:

```bash
python3 -m http.server
# Then open http://localhost:8000
```

## Project Structure

```
BugMon/
├── index.html              # Entry point (canvas, inline CSS, touch controls)
├── game.js                 # Game loop orchestration (entry point for JS)
├── package.json            # Node.js config for simulation scripts
│
├── engine/                 # Core framework systems
│   ├── state.js            # Game state machine (EXPLORE, BATTLE_TRANSITION, BATTLE, MENU)
│   ├── input.js            # Unified keyboard + touch input
│   ├── renderer.js         # Canvas 2D drawing
│   └── transition.js       # Battle transition animation
│
├── world/                  # Overworld / exploration
│   ├── map.js              # Map data, tile queries, collision
│   ├── player.js           # Player state, movement, party
│   └── encounters.js       # Random wild encounter logic (10% in tall grass)
│
├── battle/                 # Combat systems
│   ├── battleEngine.js     # Turn-based battle state machine
│   └── damage.js           # Damage calculation formula
│
├── audio/                  # Sound synthesis (no audio files)
│   └── sound.js            # Web Audio API synthesized effects
│
├── sprites/                # Pixel art and rendering
│   ├── sprites.js          # Image loader with preload/fallback
│   ├── tiles.js            # Procedural tile texture generation
│   └── *.png               # 64x64 battle sprites, 32x32 player sprites
│
├── data/                   # Game content (JSON, data-driven)
│   ├── monsters.json       # 12 BugMon definitions (stats, moves, types)
│   ├── moves.json          # 17 move definitions
│   ├── types.json          # 4 types + effectiveness chart
│   └── map.json            # 15x10 tile grid
│
├── simulation/             # Headless battle simulation CLI
│   ├── cli.js              # CLI entry point
│   ├── simulator.js        # Round-robin battle runner
│   ├── headlessBattle.js   # Pure game logic with seeded RNG
│   ├── strategies.js       # AI move selection strategies
│   ├── report.js           # Statistics report generation
│   └── rng.js              # Seeded PRNG (mulberry32)
│
├── .github/workflows/
│   └── deploy.yml          # GitHub Pages auto-deploy on push to main
│
├── ARCHITECTURE.md         # Detailed technical architecture
├── ROADMAP.md              # Milestone planning and feature backlog
└── README.md               # User-facing guide
```

## Development Commands

```bash
# Run battle simulation (default: 10,000 battles)
node simulation/cli.js

# Quick simulation (1,000 battles)
npm run simulate:quick

# Full simulation (50,000 battles)
npm run simulate:full

# Custom simulation
node simulation/cli.js --battles 5000 --strategy type-aware --seed 42
```

## Architecture & Key Patterns

### ES6 Modules
All source uses ES6 `import`/`export`. No CommonJS, no bundler. Browser loads `game.js` as a module via `<script type="module">`.

### Data Injection via Setters
JSON data files are loaded asynchronously with `fetch()` in `game.js`, then passed to modules through setter functions:
```js
// In game.js
const monsters = await fetch('data/monsters.json').then(r => r.json());
setMonstersData(monsters);
```
Do NOT import JSON directly in modules — always receive data through the existing setter pattern.

### Game State Machine
Defined in `engine/state.js`. Four states:
- **EXPLORE** — grid-based overworld movement
- **BATTLE_TRANSITION** — flash + fade animation (860ms)
- **BATTLE** — turn-based combat with menu system
- **MENU** — settings/party management (future)

### Battle Flow
```
menu (Fight/Capture/Run)
  ├→ fight → pick move → execute turn → message → next
  ├→ capture → HP-based probability check
  └→ run → always succeeds
```
Turn order: faster BugMon goes first (ties: player wins). Battle uses a message queue pattern with callbacks for action chaining.

### Damage Formula
```
damage = (power + attack - floor(defense / 2) + random(1-3)) * typeMultiplier
```
Type multipliers: 0.5x (not effective), 1.0x (neutral), 1.5x (super effective).

### Module State
Each module manages its own mutable state object. No global store, no event bus. Direct read/write within modules.

### Sprite System
PNG sprites are preloaded at startup. If a sprite fails to load, a colored rectangle fallback is rendered. Tile textures are procedurally generated at runtime (no tile image files).

## Coding Conventions

- **camelCase** for functions and variables
- **UPPER_SNAKE_CASE** for constants (e.g., `STATES`, `TILE`)
- **const/let** only, no `var`
- Arrow functions preferred
- No external dependencies — keep it zero-dependency
- `imageSmoothingEnabled = false` on canvas for crisp pixel art
- All audio is synthesized at runtime via Web Audio API (no audio files)
- Try-catch around AudioContext creation (browser compatibility)
- Console.error for startup failures, null checks for optional data

## Data Formats

### monsters.json
```json
{ "id": 1, "name": "NullPointer", "type": "memory",
  "hp": 30, "attack": 8, "defense": 4, "speed": 6,
  "moves": ["segfault", "hotfix"], "color": "#e74c3c",
  "sprite": "nullpointer", "description": "..." }
```

### moves.json
```json
{ "id": "segfault", "name": "SegFault", "power": 10, "type": "memory" }
```

### types.json
4 types: `memory`, `logic`, `runtime`, `syntax`. Effectiveness chart is a nested object mapping attacker type → defender type → multiplier.

### map.json
`{ "width": 15, "height": 10, "tiles": [[...], ...] }` — tile values: 0=ground, 1=wall, 2=grass.

## CI/CD

GitHub Pages auto-deploy on push to `main` or `master` via `.github/workflows/deploy.yml`. No build step — the entire directory is uploaded as-is.

## Testing

No formal test framework. Validation is done through:
1. **Manual browser testing** — open in browser, play the game
2. **Battle simulation CLI** — runs thousands of headless battles with seeded RNG to verify balance and catch regressions in combat logic

## When Adding New Content

### New BugMon
1. Add entry to `data/monsters.json` following existing schema
2. Add 64x64 PNG sprite to `sprites/` (filename matches `sprite` field)
3. Ensure moves referenced exist in `data/moves.json`
4. Run simulation to verify balance: `npm run simulate:quick`

### New Moves
1. Add entry to `data/moves.json` following existing schema
2. Ensure the move's `type` exists in `data/types.json`

### New Map Tiles
1. Add tile type constant and collision logic in `world/map.js`
2. Add procedural texture generation in `sprites/tiles.js`
3. Update `data/map.json` with new tile values
