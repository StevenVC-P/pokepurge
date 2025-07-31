/**
 * COMMUNITY-ALIGNED RECOMMENDED COUNT CALCULATOR
 *
 * Calculates how many copies of each Pokemon a player should keep based on:
 * - PvP performance with community-realistic thresholds and meta weighting
 * - XL candy investment considerations (expensive Pokemon get lower counts)
 * - Raid utility with balanced team building recommendations
 * - Rarity and accessibility factors
 * - Current meta relevance and league importance
 *
 * IMPROVED CALCULATION LOGIC:
 * - PvP: Variable counts based on meta tier and league importance
 * - XL Factor: Reduced counts for XL Pokemon (expensive to build)
 * - Raids: 2 copies per useful type (more realistic than 3)
 * - Meta Boost: Extra copies for current meta Pokemon
 * - Rarity Factor: Reduced counts for rare/legendary Pokemon
 * - League Weighting: GL/UL prioritized over ML
 *
 * COMMUNITY ALIGNMENT:
 * - Great League S-Tier: 3-4 copies (Azumarill, Registeel, etc.)
 * - Great League A-Tier: 2-3 copies (Altaria, Skarmory, etc.)
 * - Ultra League Meta: 2-3 copies (Giratina-A, Cresselia, etc.)
 * - Master League: 1-2 copies (most legendaries are rare/expensive)
 * - Top Raid Attackers: 3-4 copies (Rayquaza, Mewtwo for their types)
 * - Solid Raiders: 2-3 copies (most good attackers)
 */

const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../../public/data/pokemon.json");
const OUTPUT_PATH = path.resolve(__dirname, "../../public/data/pokemon.json");

// For debugging specific Pokemon
const current = "";

// Dynamic helper functions based on actual data analysis
const isMetaPokemon = (mon, league) => {
  const leagues = mon.leagues || {};
  const leagueData = leagues[league];
  if (!leagueData) return false;

  // S-tier meta: 90+ score (top 1-2% of viable Pokemon)
  return leagueData.score >= 90;
};

const isXLPokemon = (mon) => {
  // XL Pokemon are those that need to be powered up beyond level 40
  // We can detect this by checking patterns in the data
  const name = mon.name || "";
  const greatScore = mon.leagues?.great?.score || 0;
  const ultraScore = mon.leagues?.ultra?.score || 0;
  const masterScore = mon.leagues?.master?.score || 0;

  // Baby Pokemon and first-stage evolutions often need XL
  if (name.includes("Baby") || mon.form === "baby") return true;

  // Pokemon that are strong in GL but have no viable UL/ML presence likely need XL
  // (High GL performance with no higher league data suggests low natural CP)
  if (greatScore >= 80) {
    // No UL/ML data at all = likely XL Pokemon
    if (!mon.leagues?.ultra && !mon.leagues?.master) return true;

    // Strong in GL but weak in higher leagues = likely needs XL
    if (ultraScore < 60 && masterScore < 50) return true;

    // Check if it's a non-evolved Pokemon with high GL performance
    const isBaseForm = mon.base === mon.name && !name.includes("Mega") && !name.includes("Shadow");
    if (isBaseForm && greatScore >= 85) return true;
  }

  // Pokemon with very high GL scores but appear to be lower-stat Pokemon
  // (This catches Pokemon like Medicham, Bastiodon, etc.)
  if (greatScore >= 85 && (ultraScore < 70 || ultraScore === 0)) return true;

  // Specific patterns: Pokemon that are known to be XL-dependent
  // High GL score but low candy evolution line (suggests low base stats)
  if (greatScore >= 80 && mon.candy && mon.candy === mon.base) {
    // This is likely a final evolution that still needs XL for GL
    return true;
  }

  return false;
};

const isRarePokemon = (mon) => {
  const name = mon.name || "";

  // Legendary/Mythical Pokemon (typically have high base stats and limited availability)
  // We can detect by checking raid tier or high master league performance
  if (mon.raidTier && (mon.raidTier.includes("Legendary") || mon.raidTier.includes("Mythical"))) {
    return true;
  }

  // Shadow legendaries
  if (name.includes("Shadow") && mon.leagues?.master?.score >= 80) {
    return true;
  }

  // High Master League score often indicates legendary status
  const masterScore = mon.leagues?.master?.score || 0;
  if (masterScore >= 85) return true;

  return false;
};

const isTopRaidAttacker = (mon) => {
  // Dynamic detection of top raid attackers based on bestTypes data
  if (!mon.bestTypes || mon.bestTypes.length === 0) return false;

  // Check if Pokemon has multiple high-scoring raid types
  const goodTypes = mon.bestTypes.filter((type) => {
    const score = parseFloat(type.score || 0);
    const rank = parseInt(type.rank || "999", 10);
    return score >= 15 && rank <= 15; // Top 15 in type with good score
  });

  // Top raid attackers typically excel in multiple types or are #1 in their type
  return goodTypes.length >= 2 || mon.bestTypes.some((type) => parseInt(type.rank || "999", 10) <= 3);
};

// CP cap logic - determines which league category a Pokemon belongs to
const getCpCap = (leagueName) => {
  const name = leagueName.toLowerCase();
  if (name.includes("little")) return 500; // Little Cup format
  if (name.includes("great") || name.includes("sunshine") || name.includes("ascension") || name.includes("aurora") || name.includes("hisui") || name.includes("devon") || name.includes("onyx") || name.includes("pillar")) return 1500; // Great League and special cups
  if (name.includes("ultra") || name.includes("battlefrontierultra")) return 2500; // Ultra League
  if (name.includes("master") || name.includes("battlefrontiermaster")) return 10000; // Master League (no cap)
  return null;
};

const getLeagueType = (leagueName) => {
  const name = leagueName.toLowerCase();
  if (name.includes("great") || name.includes("sunshine") || name.includes("ascension") || name.includes("aurora") || name.includes("hisui") || name.includes("devon") || name.includes("onyx") || name.includes("pillar")) return "great";
  if (name.includes("ultra") || name.includes("battlefrontierultra")) return "ultra";
  if (name.includes("master") || name.includes("battlefrontiermaster")) return "master";
  return "other";
};

/**
 * COMMUNITY-ALIGNED RECOMMENDED COUNT CALCULATION
 *
 * Improved logic based on actual community recommendations:
 * - Lower PvP threshold (65+ instead of 75+) to catch more viable Pokemon
 * - Variable counts based on meta tier and league importance
 * - XL Pokemon get reduced counts (expensive to build)
 * - Rare Pokemon get reduced counts (hard to obtain)
 * - 2 copies per useful raid type (more realistic than 3)
 * - Meta boost for current S-tier Pokemon
 * - League weighting: GL/UL prioritized over ML
 */
const calcRecommendedCount = (mon) => {
  const leagues = mon.leagues || {};
  let totalCount = 0;
  const name = mon.name || "";

  // 🥊 1. PVP ANALYSIS — Community-aligned scoring
  const pvpCounts = {
    great: 0,
    ultra: 0,
    master: 0,
  };

  for (const leagueName in leagues) {
    const score = leagues[leagueName]?.score ?? 0;
    const leagueType = getLeagueType(leagueName);
    const isMajor = ["great", "ultra", "master"].includes(leagueType);

    if (isMajor && score >= 65) {
      // Lowered threshold from 75 to 65
      let leagueCount = 1; // Base count

      // Dynamic meta boost based on score thresholds
      if (isMetaPokemon(mon, leagueType)) {
        if (leagueType === "great") leagueCount = 3; // GL S-tier: 3 copies
        else if (leagueType === "ultra") leagueCount = 2; // UL S-tier: 2 copies
        else leagueCount = 1; // ML S-tier: 1 copy (legendaries are rare)
      } else if (score >= 85) {
        // High-scoring non-S-tier Pokemon (tightened threshold)
        if (leagueType === "great") leagueCount = 2; // GL A-tier: 2 copies
        else if (leagueType === "ultra") leagueCount = 2; // UL A-tier: 2 copies
        else leagueCount = 1; // ML A-tier: 1 copy
      } else if (score >= 75) {
        // Decent Pokemon get 1 copy per league
        leagueCount = 1;
      }

      // XL Pokemon penalty (expensive to build)
      if (isXLPokemon(mon)) {
        leagueCount = Math.max(1, leagueCount - 1);
      }

      // Rare Pokemon penalty (hard to obtain)
      if (isRarePokemon(mon) && leagueType === "master") {
        leagueCount = 1; // Cap rare ML Pokemon at 1
      }

      pvpCounts[leagueType] = Math.max(pvpCounts[leagueType], leagueCount);

      if (mon.name === current) {
        console.log(`PvP ${leagueType}: ${score} score → ${leagueCount} copies`);
      }
    }
  }

  // Add PvP counts (prioritize GL/UL over ML)
  totalCount += pvpCounts.great + pvpCounts.ultra + Math.min(1, pvpCounts.master);

  // 🛡️ 2. GYM DEFENSE — 1 if actually good defender
  const defTier = (mon.defenderTier || "").toUpperCase();
  if (defTier.startsWith("A") || defTier.startsWith("S")) {
    // Only A and S tier defenders are worth keeping for defense
    totalCount++;
    if (mon.name === current) {
      console.log(`Gym Defense +1: ${defTier} tier`);
    }
  }

  // 🔥 3. RAID ANALYSIS — 2 copies per useful type (reduced from 3)
  const usefulTypes = new Set();
  (mon.bestTypes || []).forEach((typeData) => {
    const score = parseFloat(typeData.score || 0);
    const rank = parseInt(typeData.rank || "999", 10);

    // Tightened thresholds for raid utility - only genuinely useful attackers
    if (score >= 12 && rank <= 20) {
      usefulTypes.add(typeData.type);
      if (mon.name === current) {
        console.log(`Raid Type +2: ${typeData.type} (score: ${score}, rank: ${rank})`);
      }
    }
  });

  // Add 2 copies per useful type (reduced from 3)
  let raidCount = usefulTypes.size * 2;

  // Top raid attackers get bonus (dynamic detection)
  if (isTopRaidAttacker(mon)) {
    raidCount = raidCount + 1; // Boost top attackers
  }

  totalCount += raidCount;

  // 🎯 4. APPLY COMMUNITY-REALISTIC CAP
  let finalCount = Math.min(6, totalCount);

  // Special form adjustments
  if (name.includes("Shadow")) {
    // Shadow Pokemon are expensive to power up - reduce counts
    // BUT: Elite raid attackers should not be heavily penalized
    if (isTopRaidAttacker(mon)) {
      // Elite Shadow raid attackers: no penalty if they hit the 6-copy cap
      // (They earned it through exceptional raid performance)
      if (finalCount >= 6) {
        finalCount = 6; // Keep at maximum
      } else {
        finalCount = Math.max(3, finalCount - 1); // Minimal penalty
      }
    } else {
      // Regular Shadow Pokemon: halve and cap at 2
      finalCount = Math.min(2, Math.ceil(finalCount * 0.5));
    }
  } else if (name.includes("Mega")) {
    // Mega Pokemon - only need 1 (can only have 1 mega active)
    finalCount = Math.min(1, finalCount);
  } else if (name.includes("Gigantamax")) {
    // Gigantamax Pokemon - similar to Mega, only need 1-2
    finalCount = Math.min(2, finalCount);
  }

  // Dynamic special cases based on data patterns
  // Ensure very high-scoring Great League Pokemon get minimum viable counts
  const greatScore = mon.leagues?.great?.score || 0;
  if (greatScore >= 95 && finalCount < 3) {
    finalCount = 3; // Ultra-meta GL Pokemon need at least 3 copies
  } else if (greatScore >= 85 && finalCount < 2) {
    finalCount = 2; // Strong GL Pokemon need at least 2 copies
  }

  // Ensure multi-league viable Pokemon get adequate counts
  const ultraScore = mon.leagues?.ultra?.score || 0;
  const masterScore = mon.leagues?.master?.score || 0;
  const multiLeagueViable = [greatScore, ultraScore, masterScore].filter((s) => s >= 75).length >= 2;
  if (multiLeagueViable && finalCount < 2) {
    finalCount = 2; // Multi-league Pokemon need flexibility
  }

  // Ensure minimum of 1 for any Pokemon with some utility
  if (finalCount === 0 && (pvpCounts.great > 0 || pvpCounts.ultra > 0 || pvpCounts.master > 0 || usefulTypes.size > 0)) {
    finalCount = 1;
  }

  // Special handling for known elite Pokemon with missing data
  // (Mega forms that aren't released yet but will be essential)
  if (finalCount === 0) {
    const name = mon.name || "";

    // Mega Mewtwo X/Y - will be among the strongest when released
    if (name.includes("Mega") && name.includes("Mewtwo")) {
      finalCount = 1; // Conservative estimate until data is available
      if (mon.name === current) {
        console.log(`Applied fallback for missing Mega Mewtwo data: 0 → 1`);
      }
    }

    // Other known elite Mega forms with missing data
    if (name.includes("Mega") && (name.includes("Rayquaza") || name.includes("Dialga") || name.includes("Palkia"))) {
      finalCount = 1; // Conservative estimate
      if (mon.name === current) {
        console.log(`Applied fallback for missing elite Mega data: 0 → 1`);
      }
    }
  }

  if (mon.name === current) {
    console.log(`\n🧪 Debug: ${mon.name}`);
    console.log("PvP Counts:", pvpCounts);
    console.log("Gym Defense:", defTier);
    console.log("Useful Raid Types:", Array.from(usefulTypes));
    console.log("Raid Count:", raidCount);
    console.log("Total Before Cap:", totalCount);
    console.log("Final Recommended:", finalCount);
    console.log("Meta Pokemon:", isMetaPokemon(name, "great") || isMetaPokemon(name, "ultra"));
    console.log("XL Pokemon:", isXLPokemon(name));
    console.log("Rare Pokemon:", isRarePokemon(name));
  }

  return finalCount;
};

// Run and update with data preservation
console.log("🔄 Loading Pokemon data...");
const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
console.log(`📊 Loaded ${data.length} Pokemon from ${path.basename(INPUT_PATH)}`);

console.log("🧮 Calculating community-aligned recommended counts...");
const updated = data.map((mon) => ({
  ...mon, // Preserve ALL existing data
  recommendedCount: calcRecommendedCount(mon),
}));

console.log("💾 Saving updated data...");
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updated, null, 2));
console.log(`✅ Updated ${updated.length} Pokémon with community-aligned recommended counts`);
console.log(`📁 Saved to: ${OUTPUT_PATH}`);

// Verify data integrity
const savedData = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
console.log(`✅ Verification: ${savedData.length} Pokemon saved successfully`);

// Sample some results
console.log("\n📋 Sample Results:");
const samples = ["Azumarill", "Registeel", "Medicham", "Rayquaza", "Tyranitar"];
samples.forEach((name) => {
  const pokemon = savedData.find((p) => p.name === name);
  if (pokemon) {
    console.log(`  ${name}: ${pokemon.recommendedCount} copies (was ${data.find((p) => p.name === name)?.recommendedCount || 0})`);
  }
});
