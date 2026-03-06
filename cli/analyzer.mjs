/**
 * BugMon Error Analyzer
 *
 * Parses real runtime errors and stack traces, classifies them
 * as BugMon encounters, and generates fix suggestions.
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const monsters = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'monsters.json'), 'utf-8'));

// Map real error patterns to BugMon creatures
const ERROR_PATTERNS = [
  {
    pattern: /Cannot read propert(?:y|ies) .+ of (undefined|null)/i,
    bugmon: 'NullPointer',
    fixes: [
      'Add optional chaining (?.) before the property access',
      'Add a null/undefined guard before this line',
      'Check the return value of the function that produces this object',
    ],
  },
  {
    pattern: /(?:is not defined|is not a function)/i,
    bugmon: 'NullPointer',
    fixes: [
      'Check that the variable/function is imported or declared',
      'Verify the spelling matches the definition',
      'Ensure the module is installed (npm install)',
    ],
  },
  {
    pattern: /Maximum call stack size exceeded/i,
    bugmon: 'StackOverflow',
    fixes: [
      'Add a base case to your recursive function',
      'Convert recursion to iteration',
      'Check for accidental infinite recursion (e.g. circular references)',
    ],
  },
  {
    pattern: /out of memory|heap|allocation failed/i,
    bugmon: 'MemoryLeak',
    fixes: [
      'Check for unbounded data structures (arrays/maps that grow forever)',
      'Ensure event listeners and timers are cleaned up',
      'Use --max-old-space-size to increase Node.js heap limit',
    ],
  },
  {
    pattern: /EADDRINUSE|ECONNREFUSED|ECONNRESET|EPIPE|ENOTFOUND/i,
    bugmon: 'BrokenPipe',
    fixes: [
      'Check that the target service is running',
      'Verify the port is not already in use (lsof -i :PORT)',
      'Add connection retry logic with exponential backoff',
    ],
  },
  {
    pattern: /Unexpected token|SyntaxError|Unexpected end of/i,
    bugmon: 'SpaghettiCode',
    fixes: [
      'Check for missing or extra brackets, parentheses, or commas',
      'Validate JSON input with a linter',
      'Ensure the file is valid JavaScript/TypeScript',
    ],
  },
  {
    pattern: /UnhandledPromiseRejection|unhandled promise/i,
    bugmon: 'UnhandledPromise',
    fixes: [
      'Add .catch() to the promise chain',
      'Use try/catch with async/await',
      'Add a global unhandledRejection handler for debugging',
    ],
  },
  {
    pattern: /ERR_REQUIRE_ESM|ERR_MODULE_NOT_FOUND|MODULE_NOT_FOUND/i,
    bugmon: 'DeprecatedAPI',
    fixes: [
      'Check import paths and file extensions (.mjs, .js)',
      'Ensure "type": "module" is set in package.json if using ESM',
      'Verify the dependency is installed in node_modules',
    ],
  },
  {
    pattern: /ETIMEOUT|ETIMEDOUT|timeout/i,
    bugmon: 'InfiniteLoop',
    fixes: [
      'Increase the timeout threshold if the operation is legitimately slow',
      'Check for infinite loops or blocking operations',
      'Add a circuit breaker or cancellation token',
    ],
  },
  {
    pattern: /index.*out of.*(?:range|bounds)|RangeError(?!.*call stack)/i,
    bugmon: 'IndexOutOfBounds',
    fixes: [
      'Validate array index before access (check .length)',
      'Check for off-by-one errors in loop bounds',
      'Use Array.at() for safer access with bounds checking',
    ],
  },
  {
    pattern: /ENOENT|no such file or directory/i,
    bugmon: '404NotFound',
    fixes: [
      'Verify the file path exists before reading',
      'Check for typos in the file path',
      'Use path.resolve() for reliable absolute paths',
    ],
  },
  {
    pattern: /race condition|data race|concurrent/i,
    bugmon: 'RaceCondition',
    fixes: [
      'Add mutex/locking around shared state',
      'Use atomic operations where possible',
      'Serialize concurrent access with a queue',
    ],
  },
  {
    pattern: /MERGE.*CONFLICT|merge conflict/i,
    bugmon: 'MergeConflict',
    fixes: [
      'Resolve conflict markers (<<<<<<, ======, >>>>>>)',
      'Use git mergetool for visual conflict resolution',
      'Rebase onto the target branch to reduce conflicts',
    ],
  },
  {
    pattern: /callback.*hell|nested.*callback/i,
    bugmon: 'CallbackHell',
    fixes: [
      'Refactor callbacks to async/await',
      'Use Promise.all() for parallel operations',
      'Extract nested callbacks into named functions',
    ],
  },
  {
    pattern: /deprecated|deprecation warning/i,
    bugmon: 'DeprecatedAPI',
    fixes: [
      'Check the migration guide for the updated API',
      'Pin the dependency version to avoid breaking changes',
      'Replace deprecated calls with their modern equivalents',
    ],
  },
  {
    pattern: /regex|regular expression.*backtrack/i,
    bugmon: 'RegexDenial',
    fixes: [
      'Simplify the regex to avoid catastrophic backtracking',
      'Use atomic groups or possessive quantifiers',
      'Consider using a string method instead of regex',
    ],
  },
  {
    pattern: /deadlock|lock.*order|circular.*wait/i,
    bugmon: 'Deadlock',
    fixes: [
      'Establish a consistent lock ordering',
      'Use lock timeouts to detect deadlocks',
      'Reduce the scope of locked sections',
    ],
  },
  {
    pattern: /fork|spawn.*ENOMEM|too many process/i,
    bugmon: 'ForkBomb',
    fixes: [
      'Limit child process spawning with a pool',
      'Check for runaway recursive process creation',
      'Set ulimit to cap maximum processes',
    ],
  },
  {
    pattern: /AssertionError|assert|expect.*to/i,
    bugmon: 'RegexDenial',
    fixes: [
      'Check the expected vs actual values in the assertion',
      'Verify test fixtures and mock data are up to date',
      'Ensure the code under test matches the specification',
    ],
  },
  {
    pattern: /git.*blame|who wrote/i,
    bugmon: 'GitBlame',
    fixes: [
      'Use git log --follow for full file history',
      'Check git blame with -w to ignore whitespace changes',
      'Focus on fixing the bug, not finding who introduced it',
    ],
  },
  {
    pattern: /CSS|layout|float|flexbox|grid.*overflow/i,
    bugmon: 'CSSFloat',
    fixes: [
      'Replace float with flexbox or CSS grid',
      'Add overflow: hidden to containing elements',
      'Use browser DevTools to inspect the computed layout',
    ],
  },
  {
    pattern: /docker|container|EACCES.*permission/i,
    bugmon: 'GitBlame',
    fixes: [
      'Check file permissions and ownership',
      'Run with appropriate user in Dockerfile (USER directive)',
      'Verify volume mount permissions match the container user',
    ],
  },
];

// Rarity tiers based on how commonly developers encounter each error
const RARITY_MAP = {
  'NullPointer': 'Common',
  'MemoryLeak': 'Uncommon',
  'RaceCondition': 'Rare',
  'Deadlock': 'Rare',
  'StackOverflow': 'Uncommon',
  'InfiniteLoop': 'Common',
  'MergeConflict': 'Common',
  'SpaghettiCode': 'Common',
  'CSSFloat': 'Common',
  '404NotFound': 'Common',
  'DeprecatedAPI': 'Uncommon',
  'BrokenPipe': 'Uncommon',
  'GitBlame': 'Uncommon',
  'ForkBomb': 'Legendary',
  'UnhandledPromise': 'Common',
  'RegexDenial': 'Rare',
  'CallbackHell': 'Uncommon',
  'Heisenbug': 'Legendary',
  'OffByOne': 'Common',
  'IndexOutOfBounds': 'Common',
};

/**
 * Parse a stack trace string and extract structured information.
 */
export function parseStackTrace(raw) {
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  // Extract the error message (first non-empty line)
  let message = '';
  let errorType = '';
  for (const line of lines) {
    const match = line.match(/^(\w+(?:Error|Exception|Warning)?)\s*:\s*(.+)/);
    if (match) {
      errorType = match[1];
      message = match[2];
      break;
    }
    if (!message) message = line;
  }

  // Extract file locations from stack frames
  const locations = [];
  for (const line of lines) {
    const frameMatch = line.match(/at\s+(?:(.+?)\s+)?\(?(.+?):(\d+):(\d+)\)?/);
    if (frameMatch) {
      locations.push({
        fn: frameMatch[1] || '<anonymous>',
        file: frameMatch[2],
        line: parseInt(frameMatch[3], 10),
        col: parseInt(frameMatch[4], 10),
      });
    }
  }

  return { errorType, message, locations, raw };
}

/**
 * Classify an error string into a BugMon encounter.
 */
export function classify(errorText) {
  const parsed = parseStackTrace(errorText);
  const fullText = errorText.toLowerCase();

  let bestMatch = null;
  let confidence = 0;

  for (const entry of ERROR_PATTERNS) {
    if (entry.pattern.test(errorText)) {
      // Calculate confidence based on specificity
      const patternSpecificity = entry.pattern.source.length;
      const score = Math.min(0.95, 0.5 + patternSpecificity / 200);
      if (score > confidence) {
        confidence = score;
        bestMatch = entry;
      }
    }
  }

  // Fallback: try to match by error type name
  if (!bestMatch && parsed.errorType) {
    const typeMap = {
      'TypeError': 'NullPointer',
      'ReferenceError': 'NullPointer',
      'SyntaxError': 'SpaghettiCode',
      'RangeError': 'IndexOutOfBounds',
      'URIError': '404NotFound',
      'EvalError': 'CallbackHell',
    };
    const fallbackName = typeMap[parsed.errorType];
    if (fallbackName) {
      bestMatch = ERROR_PATTERNS.find(e => e.bugmon === fallbackName) || {
        bugmon: fallbackName,
        fixes: ['Inspect the error message and stack trace for clues'],
      };
      confidence = 0.4;
    }
  }

  // Last resort fallback
  if (!bestMatch) {
    bestMatch = {
      bugmon: 'Heisenbug',
      fixes: [
        'This error is unusual — add logging to narrow down the cause',
        'Try to reproduce in isolation',
        'Check recent changes with git diff',
      ],
    };
    confidence = 0.2;
  }

  const monster = monsters.find(m => m.name === bestMatch.bugmon) || monsters[0];
  const rarity = RARITY_MAP[monster.name] || 'Uncommon';

  return {
    monster,
    rarity,
    confidence: Math.round(confidence * 100) / 100,
    fixes: bestMatch.fixes,
    parsed,
  };
}
