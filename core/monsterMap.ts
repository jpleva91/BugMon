export interface Monster {
  name: string;
  type: string;
  sprite: string;
  hp: number;
  xp: number;
  rarity: "common" | "uncommon" | "rare" | "legendary";
  attacks: string[];
  flavor: string;
}

// Error pattern → Monster mapping
const monsterRegistry: Record<string, Monster> = {
  TypeError: {
    name: "NullPointerMon",
    type: "TypeError",
    sprite: `
    ╔══════════╗
    ║  ◉    ◉  ║
    ║    null   ║
    ║  \\______/ ║
    ╚══════════╝`,
    hp: 30,
    xp: 25,
    rarity: "common",
    attacks: ["Inspect variable", "Add null guard", "Write test"],
    flavor: "It feeds on undefined properties and missing checks.",
  },

  ReferenceError: {
    name: "UndefinedMon",
    type: "ReferenceError",
    sprite: `
    ╔══════════╗
    ║  ?    ?   ║
    ║   undef   ║
    ║  ~~~~~~~~ ║
    ╚══════════╝`,
    hp: 25,
    xp: 20,
    rarity: "common",
    attacks: ["Declare variable", "Check scope", "Add import"],
    flavor: "Born from variables that were never declared.",
  },

  SyntaxError: {
    name: "ParseDragon",
    type: "SyntaxError",
    sprite: `
    ╔══════════╗
    ║  >{  }<  ║
    ║  ;_;_;_; ║
    ║  /\\/\\/\\  ║
    ╚══════════╝`,
    hp: 20,
    xp: 15,
    rarity: "common",
    attacks: ["Fix syntax", "Check brackets", "Lint file"],
    flavor: "A dragon made of mismatched brackets and missing semicolons.",
  },

  RangeError: {
    name: "OffByOneMon",
    type: "RangeError",
    sprite: `
    ╔══════════╗
    ║  [0..n]  ║
    ║   ±  1   ║
    ║  >_____< ║
    ╚══════════╝`,
    hp: 35,
    xp: 30,
    rarity: "uncommon",
    attacks: ["Check bounds", "Fix loop", "Add guard clause"],
    flavor: "Always one step ahead. Or behind. It's never sure.",
  },

  PromiseRejection: {
    name: "AsyncGhostMon",
    type: "PromiseRejection",
    sprite: `
    ╔══════════╗
    ║  ~o   o~ ║
    ║  await.. ║
    ║  ~~~~~~~ ║
    ╚══════════╝`,
    hp: 45,
    xp: 40,
    rarity: "uncommon",
    attacks: ["Add try/catch", "Handle rejection", "Add .catch()"],
    flavor: "A ghost that haunts unhandled promises. It waits forever.",
  },

  StackOverflow: {
    name: "RecursoBeast",
    type: "StackOverflow",
    sprite: `
    ╔══════════╗
    ║  ∞    ∞  ║
    ║  call me ║
    ║  call me ║
    ╚══════════╝`,
    hp: 50,
    xp: 45,
    rarity: "rare",
    attacks: ["Add base case", "Use iteration", "Limit depth"],
    flavor: "It calls itself. Then calls itself. Then calls itself. Then...",
  },

  MemoryLeak: {
    name: "MemoryLeechMon",
    type: "MemoryLeak",
    sprite: `
    ╔══════════╗
    ║  ●~~~~●  ║
    ║  HEAP++  ║
    ║  ●~~~~●  ║
    ╚══════════╝`,
    hp: 60,
    xp: 55,
    rarity: "rare",
    attacks: ["Clear references", "Fix listener", "Profile heap"],
    flavor: "It grows. Slowly. Silently. Until everything stops.",
  },

  ENOENT: {
    name: "FilePhantom",
    type: "ENOENT",
    sprite: `
    ╔══════════╗
    ║  📁 → ?  ║
    ║  ENOENT  ║
    ║  _______ ║
    ╚══════════╝`,
    hp: 20,
    xp: 15,
    rarity: "common",
    attacks: ["Check path", "Create file", "Fix config"],
    flavor: "It points to files that don't exist. Or do they?",
  },

  ECONNREFUSED: {
    name: "ConnectionWraith",
    type: "ECONNREFUSED",
    sprite: `
    ╔══════════╗
    ║  ✕ ── ✕  ║
    ║  refused  ║
    ║  ~~~~~~~~ ║
    ╚══════════╝`,
    hp: 35,
    xp: 30,
    rarity: "uncommon",
    attacks: ["Check server", "Verify port", "Check firewall"],
    flavor: "The connection was refused. It takes it personally.",
  },

  Timeout: {
    name: "TimeoutTurtle",
    type: "Timeout",
    sprite: `
    ╔══════════╗
    ║  🐢 ...  ║
    ║  waiting  ║
    ║  zzz...  ║
    ╚══════════╝`,
    hp: 40,
    xp: 35,
    rarity: "uncommon",
    attacks: ["Increase timeout", "Optimize query", "Add caching"],
    flavor: "It's still loading. Please wait. Please. Wait.",
  },

  Segfault: {
    name: "SegfaultHydra",
    type: "Segfault",
    sprite: `
    ╔══════════╗
    ║ 🐉🐉🐉  ║
    ║ SIGSEGV  ║
    ║ 0xDEAD   ║
    ╚══════════╝`,
    hp: 80,
    xp: 100,
    rarity: "legendary",
    attacks: ["Check pointers", "Valgrind", "Rewrite in Rust"],
    flavor: "The legendary beast. Many have tried. Few have survived.",
  },

  Unknown: {
    name: "MysteryMon",
    type: "Unknown",
    sprite: `
    ╔══════════╗
    ║  ?    ?   ║
    ║    ???    ║
    ║  ?_?_?_? ║
    ╚══════════╝`,
    hp: 25,
    xp: 20,
    rarity: "common",
    attacks: ["Read stacktrace", "Google it", "Ask teammate"],
    flavor: "Nobody knows what this is. Not even itself.",
  },
};

// Match an error string to a monster
export function matchMonster(errorText: string): Monster {
  const patterns: [RegExp, string][] = [
    [/TypeError/i, "TypeError"],
    [/ReferenceError/i, "ReferenceError"],
    [/SyntaxError/i, "SyntaxError"],
    [/RangeError/i, "RangeError"],
    [/UnhandledPromiseRejection|PromiseRejection|unhandled.*reject/i, "PromiseRejection"],
    [/Maximum call stack|stack overflow|RangeError.*call stack/i, "StackOverflow"],
    [/heap out of memory|memory leak|allocation failed/i, "MemoryLeak"],
    [/ENOENT|no such file/i, "ENOENT"],
    [/ECONNREFUSED|connection refused/i, "ECONNREFUSED"],
    [/timeout|ETIMEDOUT|ESOCKETTIMEDOUT/i, "Timeout"],
    [/segmentation fault|SIGSEGV|segfault/i, "Segfault"],
  ];

  for (const [regex, key] of patterns) {
    if (regex.test(errorText)) {
      return monsterRegistry[key];
    }
  }

  return monsterRegistry["Unknown"];
}

export function getAllMonsters(): Monster[] {
  return Object.values(monsterRegistry);
}

export function getMonsterByName(name: string): Monster | undefined {
  return Object.values(monsterRegistry).find((m) => m.name === name);
}
