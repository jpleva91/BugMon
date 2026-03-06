#!/usr/bin/env node

/**
 * BugMon CLI — Debugging Intelligence Layer
 *
 * Usage:
 *   bugmon run <command>      Wrap a command and analyze errors
 *   bugmon analyze <file>     Analyze a log file for errors
 *   bugmon scan               Read errors from stdin (pipe-friendly)
 *   bugmon dex                Show the full BugDex
 *
 * Examples:
 *   bugmon run node server.js
 *   bugmon run npm test
 *   cat error.log | bugmon scan
 *   bugmon analyze /var/log/app.log
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { classify } from './analyzer.mjs';
import { formatEncounter, formatRaid } from './formatter.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ANSI helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'run':
    runCommand(args.slice(1));
    break;
  case 'analyze':
    analyzeFile(args[1]);
    break;
  case 'scan':
    scanStdin();
    break;
  case 'dex':
    showDex();
    break;
  case '--help':
  case '-h':
  case undefined:
    showHelp();
    break;
  default:
    console.error(`${c.red}Unknown command: ${command}${c.reset}`);
    showHelp();
    process.exit(1);
}

/**
 * Wrap a command, capture stderr, and analyze errors as BugMon encounters.
 */
function runCommand(cmdArgs) {
  if (cmdArgs.length === 0) {
    console.error(`${c.red}Usage: bugmon run <command> [args...]${c.reset}`);
    process.exit(1);
  }

  const child = spawn(cmdArgs[0], cmdArgs.slice(1), {
    stdio: ['inherit', 'inherit', 'pipe'],
    shell: true,
  });

  let stderrBuf = '';

  child.stderr.on('data', (data) => {
    const text = data.toString();
    stderrBuf += text;
    // Pass through stderr in real time (dimmed)
    process.stderr.write(`${c.dim}${text}${c.reset}`);
  });

  child.on('close', (code) => {
    if (code !== 0 && stderrBuf.trim()) {
      const errors = splitErrors(stderrBuf);
      if (errors.length === 0) return;

      const results = errors.map(e => classify(e));

      if (results.length === 1) {
        console.log(formatEncounter(results[0]));
      } else {
        console.log(formatRaid(results));
      }
    }
    process.exit(code ?? 1);
  });

  child.on('error', (err) => {
    console.error(`${c.red}Failed to start command: ${err.message}${c.reset}`);
    process.exit(1);
  });
}

/**
 * Analyze a log file for errors.
 */
function analyzeFile(filePath) {
  if (!filePath) {
    console.error(`${c.red}Usage: bugmon analyze <file>${c.reset}`);
    process.exit(1);
  }

  if (!existsSync(filePath)) {
    console.error(`${c.red}File not found: ${filePath}${c.reset}`);
    process.exit(1);
  }

  const content = readFileSync(filePath, 'utf-8');
  const errors = splitErrors(content);

  if (errors.length === 0) {
    console.log(`\n${c.green}  No bugs detected! Your BugDex remains empty.${c.reset}\n`);
    return;
  }

  const results = errors.map(e => classify(e));
  console.log(formatRaid(results));
}

/**
 * Read errors from stdin (pipe-friendly).
 */
function scanStdin() {
  let input = '';

  process.stdin.setEncoding('utf-8');

  process.stdin.on('data', (chunk) => {
    input += chunk;
  });

  process.stdin.on('end', () => {
    if (!input.trim()) {
      console.log(`\n${c.green}  No input received. Pipe an error to analyze.${c.reset}\n`);
      return;
    }

    const errors = splitErrors(input);
    if (errors.length === 0) {
      // Treat the entire input as one error
      const result = classify(input);
      console.log(formatEncounter(result));
      return;
    }

    const results = errors.map(e => classify(e));
    if (results.length === 1) {
      console.log(formatEncounter(results[0]));
    } else {
      console.log(formatRaid(results));
    }
  });
}

/**
 * Show the full BugDex.
 */
function showDex() {
  const monsters = JSON.parse(readFileSync(join(__dirname, '..', 'data', 'monsters.json'), 'utf-8'));

  const RARITY_MAP = {
    'NullPointer': 'Common',     'MemoryLeak': 'Uncommon',
    'RaceCondition': 'Rare',     'Deadlock': 'Rare',
    'StackOverflow': 'Uncommon', 'InfiniteLoop': 'Common',
    'MergeConflict': 'Common',   'SpaghettiCode': 'Common',
    'CSSFloat': 'Common',        '404NotFound': 'Common',
    'DeprecatedAPI': 'Uncommon', 'BrokenPipe': 'Uncommon',
    'GitBlame': 'Uncommon',      'ForkBomb': 'Legendary',
    'UnhandledPromise': 'Common','RegexDenial': 'Rare',
    'CallbackHell': 'Uncommon',  'Heisenbug': 'Legendary',
    'OffByOne': 'Common',        'IndexOutOfBounds': 'Common',
  };

  const TYPE_COLORS = {
    memory: c.red, logic: c.yellow, runtime: '\x1b[35m',
    syntax: c.cyan, frontend: '\x1b[34m', backend: c.green,
    devops: c.yellow, testing: c.yellow,
  };

  const RARITY_COLORS = {
    'Common': '\x1b[37m', 'Uncommon': c.green,
    'Rare': '\x1b[34m', 'Legendary': `${c.bold}${c.yellow}`,
  };

  console.log('');
  console.log(`${c.bold}  BUGDEX${c.reset}  ${c.dim}${monsters.length} species catalogued${c.reset}`);
  console.log(`${c.dim}${'='.repeat(60)}${c.reset}`);
  console.log('');
  console.log(`  ${c.dim}#    Name                Type       Rarity      HP ATK DEF SPD${c.reset}`);
  console.log(`  ${c.dim}${'-'.repeat(56)}${c.reset}`);

  for (const m of monsters) {
    const rarity = RARITY_MAP[m.name] || 'Uncommon';
    const tc = TYPE_COLORS[m.type] || '';
    const rc = RARITY_COLORS[rarity] || '';
    const num = String(m.id).padStart(3, '0');
    const name = m.name.padEnd(20);
    const type = m.type.padEnd(10);
    const rar = rarity.padEnd(10);
    console.log(`  ${c.dim}${num}${c.reset}  ${tc}${c.bold}${name}${c.reset} ${c.dim}${type}${c.reset} ${rc}${rar}${c.reset}  ${m.hp}  ${m.attack}   ${m.defense}   ${m.speed}`);
  }

  console.log('');
  console.log(`${c.dim}${'='.repeat(60)}${c.reset}`);
  console.log('');
}

/**
 * Split raw error output into individual error blocks.
 */
function splitErrors(text) {
  // Split on common error boundaries
  const errorPattern = /^(?:\w*Error|\w*Exception|FATAL|ERROR|Uncaught|Unhandled)[\s:]/gm;
  const matches = [...text.matchAll(errorPattern)];

  if (matches.length === 0) {
    // If no clear error boundaries, check if it looks like an error at all
    if (/error|exception|fail|reject|ENOENT|ECONNREFUSED/i.test(text)) {
      return [text.trim()];
    }
    return [];
  }

  const errors = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const block = text.slice(start, end).trim();
    if (block) errors.push(block);
  }

  return errors;
}

/**
 * Show CLI help.
 */
function showHelp() {
  console.log(`
${c.bold}BugMon${c.reset} — Debugging Intelligence Layer

${c.bold}Usage:${c.reset}
  ${c.cyan}bugmon run${c.reset} <command>      Wrap a command and analyze errors
  ${c.cyan}bugmon analyze${c.reset} <file>     Analyze a log file for errors
  ${c.cyan}bugmon scan${c.reset}               Read errors from stdin (pipe-friendly)
  ${c.cyan}bugmon dex${c.reset}                Show the full BugDex

${c.bold}Examples:${c.reset}
  ${c.dim}# Wrap a Node.js command${c.reset}
  bugmon run node server.js

  ${c.dim}# Wrap test runner${c.reset}
  bugmon run npm test

  ${c.dim}# Pipe an error${c.reset}
  echo "TypeError: Cannot read property 'id' of undefined" | bugmon scan

  ${c.dim}# Analyze a log file${c.reset}
  bugmon analyze /var/log/app/error.log

  ${c.dim}# Browse all BugMon${c.reset}
  bugmon dex
`);
}
