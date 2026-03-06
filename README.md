# BugMon

**Pokemon-style encounters for runtime errors.**

[![npm version](https://img.shields.io/npm/v/bugmon.svg)](https://www.npmjs.com/package/bugmon)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Play the Game](https://img.shields.io/badge/Play-BugMon%20RPG-orange.svg)](https://jpleva91.github.io/BugMon/)

> Your bugs are monsters. Catch them all.

```
$ bugmon app.js

╔════════════════════════════════════════╗
║       BUGMON ENCOUNTER                 ║
╚════════════════════════════════════════╝

      ╭──────╮
      │ ×  × │
      │  __  │
      ╰──┬┬──╯
         ││
      ╭──┘└──╮
      │ NULL  │
      ╰──────╯

  A wild NullPointerMon appeared!

  Type:   memory
  Error:  TypeError
  File:   userService.js
  Line:   42
  HP:     ████████████████████ 30/30

  TypeError: Cannot read properties of null (reading 'name')

  ⚔️  NullPointerMon defeated!
  +25 XP
```

## Install

```bash
npx bugmon your-script.js
```

That's it. No config. No flags. No setup.

Or install globally:

```bash
npm install -g bugmon
```

## How It Works

BugMon wraps your Node.js script. When it crashes, the error becomes a monster encounter:

1. **Run** your script through BugMon
2. **Encounter** the bug as a monster with ASCII art, type, and HP bar
3. **See** the real error message, file, and line number
4. **Defeat** the bug by fixing your code

Clean runs get a checkmark. Broken code gets a battle.

## The BugDex

Every JavaScript error maps to a BugMon. This is a taxonomy of programming bugs.

```bash
bugmon --bugdex
```

### Common

| Monster | Error Type | Description |
|---------|-----------|-------------|
| **NullPointerMon** | TypeError | `Cannot read properties of null` |
| **ParseDragon** | SyntaxError | `Unexpected token` |
| **GhostVarMon** | ReferenceError | `x is not defined` |
| **StackOverflow** | RangeError | `Maximum call stack size exceeded` |
| **IndexOutOfBounds** | RangeError | Array index errors |

### Uncommon

| Monster | Error Type | Description |
|---------|-----------|-------------|
| **AsyncPhantom** | Promise Rejection | Unhandled async errors |
| **InfiniteLoop** | Timeout | Heap out of memory, timeouts |
| **JSONGoblin** | SyntaxError | Bad JSON parsing |
| **ImportWraith** | Module Error | `Cannot find module` |

### Rare

| Monster | Error Type | Description |
|---------|-----------|-------------|
| **RaceGremlin** | Race Condition | Concurrent access bugs |
| **LeakHydra** | Memory Leak | Heap/buffer/file descriptor leaks |

### Legendary

| Monster | Error Type | Description |
|---------|-----------|-------------|
| **Heisenbug** | Segfault | The bug that changes when you observe it |
| **ForkBomb** | Process Error | Permission denied, spawn failures |

## The Game

BugMon is also a playable RPG — a Pokemon-style game where the monsters are software bugs.

**[Play Now](https://jpleva91.github.io/BugMon/)** — runs in your browser, zero install.

- 20 BugMon to discover and capture
- 8 types: Memory, Logic, Runtime, Syntax, Frontend, Backend, DevOps, Testing
- 25 moves with type effectiveness matchups
- Turn-based combat, capture mechanic, tile-based exploration
- Pixel art sprites, synthesized audio, mobile touch controls
- Zero dependencies — vanilla JS, HTML5 Canvas

## Add Your Own Monsters

BugMon is hackable. Add a monster by editing `data/monsters.json`:

```json
{
  "id": 21,
  "name": "YourBugName",
  "type": "frontend",
  "hp": 30, "attack": 7, "defense": 5, "speed": 6,
  "moves": ["cacheinvalidation", "hotfix"],
  "color": "#3498db",
  "sprite": "yourbugname"
}
```

For the CLI, add error mappings in `cli/bugdex.js`. PRs welcome.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

## Project Structure

```
BugMon
├─ CLI (core tool)
│  ├─ cli/bugmon.js        Entry point — npx bugmon <file>
│  ├─ cli/bugdex.js        Error → monster mapping
│  └─ cli/encounter.js     Terminal UI rendering
│
├─ Game (companion RPG)
│  ├─ game.js              Game loop
│  ├─ engine/              State machine, input, rendering
│  ├─ battle/              Turn-based combat
│  ├─ world/               Map, player, encounters
│  ├─ audio/               Synthesized sound effects
│  └─ sprites/             Pixel art
│
└─ Data (shared)
   ├─ data/monsters.json   20 BugMon definitions
   ├─ data/moves.json      25 move definitions
   └─ data/types.json      8-type effectiveness chart
```

## License

MIT

## Links

- [Play the Game](https://jpleva91.github.io/BugMon/)
- [Contributing Guide](CONTRIBUTING.md)
- [Architecture](ARCHITECTURE.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
