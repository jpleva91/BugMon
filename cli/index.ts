#!/usr/bin/env node

import { spawn } from "child_process";
import { matchMonster } from "../core/monsterMap";
import { parseError } from "../core/parseErrors";
import {
  renderEncounter,
  renderDefeat,
  renderWelcome,
  renderStats,
  renderBugDex,
} from "../renderer/terminalUI";

// Session state
let encountered = 0;
let defeated = 0;
let totalXp = 0;
const bugDex = new Map<string, number>();
const seenErrors = new Set<string>();

function handleErrorText(text: string): void {
  // Deduplicate rapid-fire identical errors
  const errorKey = text.trim().slice(0, 200);
  if (seenErrors.has(errorKey)) return;
  seenErrors.add(errorKey);

  // Clear dedup cache periodically
  if (seenErrors.size > 100) seenErrors.clear();

  const parsed = parseError(text);
  if (!parsed) return;

  const monster = matchMonster(parsed.raw);
  encountered++;

  console.log(renderEncounter(monster, parsed));

  // Auto-defeat after a moment (simulates the dev fixing it)
  setTimeout(() => {
    defeated++;
    totalXp += monster.xp;
    bugDex.set(monster.name, (bugDex.get(monster.name) || 0) + 1);
    console.log(renderDefeat(monster));
  }, 2000);
}

function watchCommand(args: string[]): void {
  if (args.length === 0) {
    console.log(renderWelcome());
    console.log("  Usage: bugmon watch <command>");
    console.log("  Example: bugmon watch npm test");
    console.log("           bugmon watch node app.js");
    console.log("           bugmon watch cargo build");
    console.log("");
    process.exit(1);
  }

  console.log(renderWelcome());

  const command = args[0];
  const commandArgs = args.slice(1);

  const child = spawn(command, commandArgs, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: true,
  });

  // Buffer for accumulating partial lines
  let stderrBuffer = "";

  child.stdout?.on("data", (data: Buffer) => {
    const text = data.toString();
    process.stdout.write(text);

    // Some tools output errors to stdout
    if (/Error:|error\[/i.test(text)) {
      handleErrorText(text);
    }
  });

  child.stderr?.on("data", (data: Buffer) => {
    const text = data.toString();
    process.stderr.write(text);
    stderrBuffer += text;

    // Process when we hit a newline (likely end of error)
    if (stderrBuffer.includes("\n")) {
      handleErrorText(stderrBuffer);
      stderrBuffer = "";
    }
  });

  child.on("close", (code: number | null) => {
    // Flush remaining buffer
    if (stderrBuffer) {
      handleErrorText(stderrBuffer);
    }

    if (encountered > 0) {
      console.log(renderStats(encountered, defeated, totalXp));
      console.log(renderBugDex(bugDex));
    }

    process.exit(code ?? 0);
  });

  // Handle Ctrl+C gracefully
  process.on("SIGINT", () => {
    child.kill("SIGINT");
    if (encountered > 0) {
      console.log(renderStats(encountered, defeated, totalXp));
      console.log(renderBugDex(bugDex));
    }
    process.exit(0);
  });
}

function demoCommand(): void {
  console.log(renderWelcome());

  const demoErrors = [
    `TypeError: Cannot read properties of undefined (reading 'name')
    at UserService.getUser (/src/services/userService.ts:42:15)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`,

    `UnhandledPromiseRejectionWarning: Error: Connection refused
    at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1141:16)
    at DatabasePool.connect (/src/db/pool.ts:23:9)`,

    `RangeError: Maximum call stack size exceeded
    at TreeNode.traverse (/src/utils/tree.ts:15:8)
    at TreeNode.traverse (/src/utils/tree.ts:15:8)
    at TreeNode.traverse (/src/utils/tree.ts:15:8)`,
  ];

  let i = 0;
  const interval = setInterval(() => {
    if (i >= demoErrors.length) {
      clearInterval(interval);
      setTimeout(() => {
        console.log(renderStats(encountered, defeated, totalXp));
        console.log(renderBugDex(bugDex));
      }, 3000);
      return;
    }
    handleErrorText(demoErrors[i]);
    i++;
  }, 4000);
}

// CLI argument parsing
const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case "watch":
    watchCommand(args.slice(1));
    break;

  case "demo":
    demoCommand();
    break;

  case "dex":
    console.log(renderBugDex(bugDex));
    break;

  case "stats":
    console.log(renderStats(encountered, defeated, totalXp));
    break;

  case "--help":
  case "-h":
  case undefined:
    console.log(renderWelcome());
    console.log("  Commands:");
    console.log("    bugmon watch <cmd>  Watch a command for errors");
    console.log("    bugmon demo         Run a demo encounter");
    console.log("    bugmon --help       Show this help");
    console.log("");
    console.log("  Examples:");
    console.log("    bugmon watch npm test");
    console.log("    bugmon watch node server.js");
    console.log("    bugmon watch python main.py");
    console.log("    bugmon watch cargo build");
    console.log("");
    break;

  default:
    // Treat as a command to watch
    watchCommand(args);
    break;
}
