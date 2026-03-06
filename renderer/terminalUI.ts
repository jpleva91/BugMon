import chalk from "chalk";
import { Monster } from "../core/monsterMap";
import { ParsedError } from "../core/parseErrors";

const RARITY_COLORS: Record<string, (s: string) => string> = {
  common: chalk.white,
  uncommon: chalk.green,
  rare: chalk.blue,
  legendary: chalk.yellow,
};

function hpBar(hp: number, maxHp: number = hp): string {
  const barLength = 20;
  const filled = Math.round((hp / maxHp) * barLength);
  const empty = barLength - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);

  if (hp / maxHp > 0.5) return chalk.green(bar);
  if (hp / maxHp > 0.25) return chalk.yellow(bar);
  return chalk.red(bar);
}

export function renderEncounter(monster: Monster, error: ParsedError): string {
  const rarityColor = RARITY_COLORS[monster.rarity] || chalk.white;
  const rarityLabel = rarityColor(`[${monster.rarity.toUpperCase()}]`);

  const location = error.file
    ? chalk.dim(`  File: ${error.file}${error.line ? `:${error.line}` : ""}`)
    : "";

  const lines = [
    "",
    chalk.red("━".repeat(50)),
    "",
    chalk.bold.red(`  🐛 Wild ${monster.name} appeared!  `) + rarityLabel,
    "",
    chalk.cyan(monster.sprite),
    "",
    chalk.dim(`  "${monster.flavor}"`),
    "",
    `  HP: ${hpBar(monster.hp)} ${chalk.bold(String(monster.hp))}`,
    `  XP: ${chalk.yellow("+" + monster.xp)}`,
    "",
    chalk.bold("  ⚔️  Attack options:"),
    ...monster.attacks.map(
      (a, i) => `  ${chalk.cyan(`[${i + 1}]`)} ${a}`
    ),
    "",
    chalk.white(`  Error: ${chalk.red(error.message)}`),
    location,
    "",
    chalk.red("━".repeat(50)),
    "",
  ];

  return lines.filter(Boolean).join("\n");
}

export function renderDefeat(monster: Monster): string {
  return [
    "",
    chalk.green("━".repeat(50)),
    "",
    chalk.bold.green(`  ⚔️  ${monster.name} defeated!`),
    chalk.yellow(`  +${monster.xp} XP`),
    "",
    chalk.green("━".repeat(50)),
    "",
  ].join("\n");
}

export function renderWelcome(): string {
  return [
    "",
    chalk.bold.cyan("  ╔══════════════════════════════════════╗"),
    chalk.bold.cyan("  ║") + chalk.bold.white("       🐛  B U G M O N  🐛           ") + chalk.bold.cyan("║"),
    chalk.bold.cyan("  ║") + chalk.dim("     Gotta catch 'em all...           ") + chalk.bold.cyan("║"),
    chalk.bold.cyan("  ╚══════════════════════════════════════╝"),
    "",
    chalk.dim("  Watching for bugs..."),
    "",
  ].join("\n");
}

export function renderStats(
  encountered: number,
  defeated: number,
  totalXp: number
): string {
  return [
    "",
    chalk.bold("  📊 Session Stats"),
    chalk.dim("  ─────────────────"),
    `  Encountered: ${chalk.red(String(encountered))}`,
    `  Defeated:    ${chalk.green(String(defeated))}`,
    `  Total XP:    ${chalk.yellow(String(totalXp))}`,
    "",
  ].join("\n");
}

export function renderBugDex(
  captured: Map<string, number>
): string {
  const lines = [
    "",
    chalk.bold.cyan("  📖 BugDex"),
    chalk.dim("  ─────────────────"),
  ];

  if (captured.size === 0) {
    lines.push(chalk.dim("  No monsters captured yet. Go find some bugs!"));
  } else {
    for (const [name, count] of captured) {
      lines.push(`  ${chalk.white(name)} ${chalk.dim("×")} ${chalk.yellow(String(count))}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}
