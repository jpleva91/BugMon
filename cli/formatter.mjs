/**
 * BugMon Terminal Formatter
 *
 * Renders BugMon encounters as styled terminal output.
 * Works in any terminal with ANSI color support.
 */

// ANSI color helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
};

const TYPE_COLORS = {
  memory: c.red,
  logic: c.yellow,
  runtime: c.magenta,
  syntax: c.cyan,
  frontend: c.blue,
  backend: c.green,
  devops: c.yellow,
  testing: c.yellow,
};

const RARITY_STYLE = {
  'Common': c.white,
  'Uncommon': c.green,
  'Rare': c.blue,
  'Legendary': `${c.bold}${c.yellow}`,
};

const RARITY_LABEL = {
  'Common': '   Common',
  'Uncommon': ' Uncommon',
  'Rare': '     Rare',
  'Legendary': 'Legendary',
};

/**
 * Format a single BugMon encounter for terminal display.
 */
export function formatEncounter(result) {
  const { monster, rarity, confidence, fixes, parsed } = result;
  const typeColor = TYPE_COLORS[monster.type] || c.white;
  const rarityStyle = RARITY_STYLE[rarity] || c.white;
  const lines = [];

  // Header
  lines.push('');
  lines.push(`${c.dim}${'~'.repeat(56)}${c.reset}`);
  lines.push(`${c.bold}  WILD BUGMON ENCOUNTERED!${c.reset}`);
  lines.push(`${c.dim}${'~'.repeat(56)}${c.reset}`);
  lines.push('');

  // Monster name and type
  lines.push(`  ${typeColor}${c.bold}${monster.name}${c.reset}  ${c.dim}[${monster.type.toUpperCase()}]${c.reset}  ${rarityStyle}${RARITY_LABEL[rarity] || rarity}${c.reset}`);
  lines.push('');

  // Stats bar
  const hpBar = renderBar(monster.hp, 50, c.green);
  lines.push(`  ${c.dim}HP${c.reset}  ${hpBar} ${monster.hp}`);
  lines.push(`  ${c.dim}ATK${c.reset} ${monster.attack}  ${c.dim}DEF${c.reset} ${monster.defense}  ${c.dim}SPD${c.reset} ${monster.speed}  ${c.dim}Confidence${c.reset} ${formatConfidence(confidence)}`);
  lines.push('');

  // Location
  if (parsed.locations.length > 0) {
    const loc = parsed.locations[0];
    lines.push(`  ${c.dim}Location:${c.reset}  ${c.bold}${loc.file}:${loc.line}${c.reset}`);
    if (loc.fn !== '<anonymous>') {
      lines.push(`  ${c.dim}Function:${c.reset}  ${loc.fn}`);
    }
    lines.push('');
  }

  // Error message
  if (parsed.message) {
    lines.push(`  ${c.dim}Error:${c.reset}  ${c.red}${parsed.message}${c.reset}`);
    lines.push('');
  }

  // Suggested fixes
  lines.push(`  ${c.bold}Suggested attacks:${c.reset}`);
  lines.push('');
  for (let i = 0; i < fixes.length; i++) {
    lines.push(`  ${c.green}[${i + 1}]${c.reset} ${fixes[i]}`);
  }

  lines.push('');
  lines.push(`${c.dim}${'~'.repeat(56)}${c.reset}`);
  lines.push('');

  return lines.join('\n');
}

/**
 * Format a summary of multiple encounters (for log analysis).
 */
export function formatRaid(results) {
  const lines = [];

  lines.push('');
  lines.push(`${c.bold}${c.red}  BUGMON RAID${c.reset}  ${c.dim}${results.length} bug${results.length === 1 ? '' : 's'} detected${c.reset}`);
  lines.push(`${c.dim}${'='.repeat(56)}${c.reset}`);
  lines.push('');

  // Tally by BugMon type
  const tally = {};
  for (const r of results) {
    const key = r.monster.name;
    tally[key] = tally[key] || { count: 0, monster: r.monster, rarity: r.rarity };
    tally[key].count++;
  }

  const sorted = Object.values(tally).sort((a, b) => b.count - a.count);

  for (const entry of sorted) {
    const typeColor = TYPE_COLORS[entry.monster.type] || c.white;
    const rarityStyle = RARITY_STYLE[entry.rarity] || c.white;
    const count = entry.count > 1 ? ` x${entry.count}` : '';
    lines.push(`  ${typeColor}${c.bold}${entry.monster.name}${c.reset}${count}  ${c.dim}[${entry.monster.type.toUpperCase()}]${c.reset}  ${rarityStyle}${entry.rarity}${c.reset}`);
  }

  lines.push('');
  lines.push(`${c.dim}${'='.repeat(56)}${c.reset}`);
  lines.push('');

  // Then show each encounter in detail
  for (const result of results) {
    lines.push(formatEncounter(result));
  }

  return lines.join('\n');
}

/**
 * Render a simple ASCII progress bar.
 */
function renderBar(value, max, color) {
  const width = 20;
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  return `${color}${'█'.repeat(filled)}${c.dim}${'░'.repeat(empty)}${c.reset}`;
}

/**
 * Format confidence as a colored percentage.
 */
function formatConfidence(conf) {
  const pct = Math.round(conf * 100);
  let color = c.red;
  if (pct >= 70) color = c.green;
  else if (pct >= 40) color = c.yellow;
  return `${color}${pct}%${c.reset}`;
}
