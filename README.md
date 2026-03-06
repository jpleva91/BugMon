# BugMon

**Debugging tool with game aesthetics. Every error is a wild encounter.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Play Now](https://img.shields.io/badge/Play-GitHub%20Pages-orange.svg)](https://jpleva91.github.io/BugMon/)

> Your errors are monsters. Catch them all.

BugMon wraps your dev commands and turns runtime errors into monster encounters. TypeError? That's a **NullPointer**. Stack overflow? Meet **StackOverflow**. Fix bugs, earn XP, fill your BugDex.

```
╔════════════════════════════════════════════════╗
║  Wild NullPointer appeared!                    ║
║                                                ║
║    ╔══╗                                        ║
║    ║▓▓║                                        ║
║   ╔╝  ╚╗                                       ║
║   ║ ?? ║                                       ║
║   ╚════╝                                       ║
║                                                ║
║  Type: MEMORY    HP: ██████████ 30             ║
║                                                ║
║  Cannot read properties of null (reading       ║
║  'foo')                                        ║
║                                                ║
║  >> src/user.service.ts:42:19                  ║
║                                                ║
║  Tip: Check if the object exists before        ║
║       accessing its properties. Use optional   ║
║       chaining (?.) or a null check.           ║
╚════════════════════════════════════════════════╝
  +110 XP | NEW BugDex entry!
```

## Install

```bash
npm install -g bugmon
```

## Usage

```bash
# Wrap any command — errors become BugMon encounters
bugmon watch -- npm run dev
bugmon watch -- node server.js
bugmon watch -- npx tsc --noEmit

# Check your BugDex (Pokédex for bugs)
bugmon dex

# View your bug hunter stats
bugmon stats
```

## How It Works

1. `bugmon watch` spawns your command and intercepts stderr
2. Errors are parsed and matched to one of 20 BugMon creatures
3. An encounter card appears with the monster, error details, file location, and a fix tip
4. The error is recorded in your BugDex (`~/.bugmon/bugdex.json`)
5. You earn XP — first encounters give bonus points

**Errors still pass through.** BugMon augments your error output, never hides it.

## The Roster

20 BugMon across 8 types, each mapped to real error patterns:

| BugMon | Type | Catches |
|--------|------|---------|
| **NullPointer** | Memory | `TypeError: Cannot read properties of null` |
| **RaceCondition** | Logic | Race conditions, concurrent access |
| **MemoryLeak** | Memory | Heap out of memory, ENOMEM |
| **Deadlock** | Logic | Deadlocks, lock timeouts |
| **OffByOne** | Logic | Off-by-one, boundary errors |
| **MergeConflict** | Syntax | `SyntaxError`, parsing errors |
| **CallbackHell** | Runtime | `is not a function` |
| **Heisenbug** | Logic | Intermittent, flaky errors |
| **InfiniteLoop** | Runtime | Maximum call stack, timeouts |
| **SpaghettiCode** | Syntax | Circular dependencies |
| **StackOverflow** | Runtime | `RangeError: Maximum call stack` |
| **IndexOutOfBounds** | Memory | `ReferenceError`, out of range |
| **CSSFloat** | Frontend | CSS/layout/rendering errors |
| **404NotFound** | Frontend | ENOENT, file not found, 404 |
| **DeprecatedAPI** | Backend | Deprecated warnings, missing modules |
| **BrokenPipe** | Backend | ECONNREFUSED, socket hang up |
| **GitBlame** | DevOps | Permission denied, EACCES |
| **ForkBomb** | DevOps | Too many open files, EMFILE |
| **UnhandledPromise** | Testing | Unhandled promise rejections |
| **RegexDenial** | Testing | Invalid regex, backtracking |

## XP System

| Event | XP |
|-------|---:|
| Encounter a bug | +10 |
| First encounter of a BugMon | +100 |
| Fix a bug (error gone on re-run) | +50 |

Level up as you squash more bugs.

## Browser Game

BugMon also lives as a playable browser game at **[jpleva91.github.io/BugMon](https://jpleva91.github.io/BugMon/)** — explore a tile-based world, battle wild BugMon, and capture them with a turn-based combat system.

<p align="center">
  <img src="sprites/nullpointer.png" width="64" alt="NullPointer">
  <img src="sprites/racecondition.png" width="64" alt="RaceCondition">
  <img src="sprites/memoryleak.png" width="64" alt="MemoryLeak">
  <img src="sprites/deadlock.png" width="64" alt="Deadlock">
  <img src="sprites/offbyone.png" width="64" alt="OffByOne">
  <img src="sprites/mergeconflict.png" width="64" alt="MergeConflict">
  <img src="sprites/callbackhell.png" width="64" alt="CallbackHell">
  <img src="sprites/heisenbug.png" width="64" alt="Heisenbug">
</p>

## Architecture

```
BugMon/
├── cli/                    # CLI debugging tool
│   ├── bin.js              # Entry point
│   ├── core/               # Error & stacktrace parsers
│   ├── monsters/           # Error → monster matching
│   ├── bugdex/             # BugDex persistence
│   ├── ui/                 # Terminal renderer (ANSI)
│   └── adapters/           # CLI watch adapter
├── data/                   # Shared monster/move/type data (JSON)
├── engine/                 # Browser game engine
├── battle/                 # Turn-based battle system
├── world/                  # Map, player, encounters
├── audio/                  # Synthesized sound effects
└── sprites/                # Pixel art sprites
```

## Contributing

We welcome contributions! Ways to contribute:

- **Add a new BugMon** — edit `data/monsters.json` with a new error pattern
- **Add a new sprite** — drop a 64x64 PNG into `sprites/`
- **Improve error matching** — better patterns, more edge cases
- **New adapters** — VSCode extension, GitHub bot, dev server overlay

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## Design Principles

- **Zero dependencies** — vanilla JS, raw ANSI codes, Node.js built-ins only
- **Don't swallow errors** — augment, never replace
- **Tiny** — fast install, no bloat
- **Adapter pattern** — CLI today, VSCode/GitHub tomorrow

## License

MIT
