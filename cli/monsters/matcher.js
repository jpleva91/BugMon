// Monster matcher — maps parsed errors to BugMon creatures

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let monsters = null;

function loadMonsters() {
  if (monsters) return monsters;
  const dataPath = join(__dirname, '..', '..', 'data', 'monsters.json');
  monsters = JSON.parse(readFileSync(dataPath, 'utf8'));
  return monsters;
}

/**
 * Find the best matching BugMon for a parsed error.
 * @param {{type: string, message: string, rawLines: string[]}} error - Parsed error from error-parser
 * @returns {{monster: object, confidence: number}}
 */
export function matchMonster(error) {
  const allMonsters = loadMonsters();
  const fullText = [error.message, ...error.rawLines].join(' ').toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const monster of allMonsters) {
    if (!monster.errorPatterns) continue;

    let score = 0;
    for (const pattern of monster.errorPatterns) {
      if (fullText.includes(pattern.toLowerCase())) {
        // Longer patterns are more specific = higher confidence
        score += pattern.length;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = monster;
    }
  }

  // Fallback: match by error type to monster type
  if (!bestMatch) {
    bestMatch = matchByErrorType(error.type, allMonsters);
    bestScore = 5; // low confidence
  }

  // Ultimate fallback
  if (!bestMatch) {
    bestMatch = allMonsters.find(m => m.name === 'OffByOne') || allMonsters[0];
    bestScore = 1;
  }

  return {
    monster: bestMatch,
    confidence: Math.min(1, bestScore / 30),
  };
}

/**
 * Fallback: map error parser type to monster type.
 */
function matchByErrorType(errorType, allMonsters) {
  const typeMap = {
    'null-reference': 'memory',
    'type-mismatch': 'logic',
    'type-error': 'logic',
    'syntax': 'syntax',
    'undefined-reference': 'memory',
    'stack-overflow': 'runtime',
    'range-error': 'runtime',
    'network': 'backend',
    'file-not-found': 'frontend',
    'permission': 'devops',
    'import': 'backend',
    'unhandled-promise': 'testing',
    'broken-pipe': 'backend',
    'memory-leak': 'memory',
    'regex': 'testing',
    'assertion': 'testing',
    'deprecated': 'backend',
    'generic': 'logic',
  };

  const monsterType = typeMap[errorType];
  if (!monsterType) return null;

  // Pick a random monster of the matching type for variety
  const candidates = allMonsters.filter(m => m.type === monsterType);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/**
 * Get all monsters for BugDex display.
 * @returns {object[]}
 */
export function getAllMonsters() {
  return loadMonsters();
}
