#!/usr/bin/env node

/**
 * Filter out unreleased Pokemon from the final dataset
 * Removes Pokemon that have no actual game data (empty leagues, bestTypes, etc.)
 */

const fs = require("fs");
const path = require("path");

const INPUT_FILE = path.resolve(__dirname, "../pokemon.json");
const OUTPUT_FILE = path.resolve(__dirname, "../../public/data/pokemon.json");

console.log("🔄 Loading Pokemon data...");

// Read the current data
const data = JSON.parse(fs.readFileSync(INPUT_FILE, "utf8"));

console.log(`📊 Loaded ${data.length} Pokemon from pokemon.json`);

// Filter function to identify released Pokemon
function isReleasedPokemon(mon) {
  // Pokemon is considered "released" if it has ANY of the following:
  // 1. PvP league data (at least one league with data)
  // 2. Raid performance data (bestTypes with entries)
  // 3. Raid tier information
  // 4. Defender tier information

  const hasLeagueData = mon.leagues && Object.keys(mon.leagues).length > 0;
  const hasRaidData = mon.bestTypes && mon.bestTypes.length > 0;
  const hasRaidTier = mon.raidTier && mon.raidTier !== null;
  const hasDefenderTier = mon.defenderTier && mon.defenderTier !== null;

  return hasLeagueData || hasRaidData || hasRaidTier || hasDefenderTier;
}

// Filter out unreleased Pokemon
const releasedPokemon = data.filter(isReleasedPokemon);
const unreleasedPokemon = data.filter((mon) => !isReleasedPokemon(mon));

console.log(`\n📋 Filtering Results:`);
console.log(`✅ Released Pokemon: ${releasedPokemon.length}`);
console.log(`❌ Unreleased Pokemon: ${unreleasedPokemon.length}`);

if (unreleasedPokemon.length > 0) {
  console.log(`\n🚫 Removing unreleased Pokemon:`);
  unreleasedPokemon.slice(0, 10).forEach((mon) => {
    console.log(`   - ${mon.name} (${mon.form})`);
  });
  if (unreleasedPokemon.length > 10) {
    console.log(`   ... and ${unreleasedPokemon.length - 10} more`);
  }
}

// Save the filtered data
console.log(`\n💾 Saving filtered data...`);
fs.writeFileSync(OUTPUT_FILE, JSON.stringify(releasedPokemon, null, 2));

// Verification
const verification = JSON.parse(fs.readFileSync(OUTPUT_FILE, "utf8"));
console.log(`✅ Verification: ${verification.length} released Pokemon saved successfully`);

console.log(`📁 Saved to: ${OUTPUT_FILE}`);

// Summary
console.log(`\n📊 Summary:`);
console.log(`   Original: ${data.length} Pokemon`);
console.log(`   Released: ${releasedPokemon.length} Pokemon`);
console.log(`   Removed: ${unreleasedPokemon.length} unreleased Pokemon`);
console.log(`   Reduction: ${((unreleasedPokemon.length / data.length) * 100).toFixed(1)}%`);
