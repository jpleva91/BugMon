// Random encounter logic with rarity-weighted spawning
import { playEncounterAlert, playRareEncounter, playVeryRareEncounter, playLegendaryEncounter } from '../audio/sound.js';

let monstersData = [];
let rarityData = null;

export function setMonstersData(data) {
  monstersData = data;
}

export function setRarityData(data) {
  rarityData = data;
}

function pickRarityTier() {
  if (!rarityData) return null;
  const tiers = rarityData.tiers;
  const tierKeys = Object.keys(tiers);
  const totalWeight = tierKeys.reduce((sum, key) => sum + tiers[key].weight, 0);
  let roll = Math.random() * totalWeight;

  for (const key of tierKeys) {
    roll -= tiers[key].weight;
    if (roll <= 0) return key;
  }
  return tierKeys[tierKeys.length - 1];
}

function playEncounterSound(rarity) {
  if (rarity === 'legendary') {
    playLegendaryEncounter();
  } else if (rarity === 'veryrare') {
    playVeryRareEncounter();
  } else if (rarity === 'rare') {
    playRareEncounter();
  } else {
    playEncounterAlert();
  }
}

export function checkEncounter(tile) {
  // Only trigger in tall grass (tile 2), 10% chance
  if (tile !== 2) return null;
  if (Math.random() > 0.10) return null;

  let template;

  if (rarityData) {
    // Two-step weighted selection: pick tier, then pick monster within tier
    const tier = pickRarityTier();
    const candidates = monstersData.filter(m => m.rarity === tier);
    if (candidates.length === 0) {
      // Fallback if tier has no monsters
      template = monstersData[Math.floor(Math.random() * monstersData.length)];
    } else {
      template = candidates[Math.floor(Math.random() * candidates.length)];
    }
  } else {
    // Fallback: uniform random (backwards compatible)
    template = monstersData[Math.floor(Math.random() * monstersData.length)];
  }

  playEncounterSound(template.rarity);

  return {
    ...template,
    currentHP: template.hp
  };
}
