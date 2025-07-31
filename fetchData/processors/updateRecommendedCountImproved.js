/**
 * IMPROVED RECOMMENDED COUNT CALCULATOR
 *
 * Calculates how many copies of each Pokemon a player should keep based on:
 * - PvP performance across different CP-capped leagues (1 per CP cap)
 * - Gym defense capabilities (1 if viable)
 * - Raid utility for different type coverage roles (1 per useful damage type)
 * - Hard cap at 6 to prevent excessive hoarding
 *
 * IMPROVED CALCULATION LOGIC:
 * - PvP: +1 for each unique CP cap where Pokemon scores 75+ (+2 bonus if score 95+)
 * - Defense: +1 if A/B/S tier defender (+2 bonus if S tier)
 * - Raids: +1 for each distinct type where Pokemon excels (+2 bonus if rank 1-3)
 * - Best-in-role bonuses reward the absolute best Pokemon in each category
 *
 * WHY THIS APPROACH:
 * - Aligns with trashability assessment pathways
 * - Different CP caps require different IV spreads
 * - Each useful damage type justifies a separate copy
 * - Defense utility is independent of offensive roles
 * - Caps at 6 total to prevent excessive hoarding recommendations
 */

const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../outputs/PokemonMaster.json");
const OUTPUT_PATH = path.resolve(__dirname, "../outputs/PokemonMaster_updated.json");

// For debugging specific Pokemon
const current = "Mega Rayquaza";

// CP cap logic - determines which league category a Pokemon belongs to
const getCpCap = (leagueName) => {
  const name = leagueName.toLowerCase();
  if (name.includes("little")) return 500; // Little Cup format
  if (name.includes("great") || name.includes("sunshine") || name.includes("ascension") || name.includes("aurora") || name.includes("hisui") || name.includes("devon") || name.includes("onyx") || name.includes("pillar")) return 1500; // Great League and special cups
  if (name.includes("ultra") || name.includes("battlefrontierultra")) return 2500; // Ultra League
  if (name.includes("master") || name.includes("battlefrontiermaster")) return 10000; // Master League (no cap)
  return null;
};

/**
 * IMPROVED RECOMMENDED COUNT CALCULATION
 *
 * Aligns with trashability assessment by considering actual utility pathways:
 * - 1 per CP cap for PvP (different IV spreads needed)
 * - 1 for gym defense (if viable)
 * - 1 for every useful damage type in raids
 * - Hard cap at 6 to prevent excessive hoarding
 */
const calcRecommendedCount = (mon) => {
  const leagues = mon.leagues || {};
  let totalCount = 0;

  // 🥊 1. PVP ANALYSIS — 1 per CP cap + bonus for best-in-league
  // Aligned with trashability: only count if performance justifies the investment
  const cpCaps = new Set();
  let pvpBestInRoleBonus = 0;

  for (const name in leagues) {
    const score = leagues[name]?.score ?? 0;
    const cap = getCpCap(name);
    const isMajor = ["great", "ultra", "master"].some((l) => name.toLowerCase().includes(l));

    // Use trashability-aligned thresholds: 75+ for genuine utility
    if (isMajor && score >= 75 && cap && !cpCaps.has(cap)) {
      totalCount++;
      cpCaps.add(cap);

      // BEST-IN-ROLE BONUS: +2 additional copies if score 95+ (elite performance)
      if (score >= 95) {
        pvpBestInRoleBonus += 2;

        if (mon.name === current) {
          console.log(`PvP +1 + BEST-IN-ROLE +2: ${name} (${score}) - CP cap ${cap}`);
        }
      } else {
        if (mon.name === current) {
          console.log(`PvP +1: ${name} (${score}) - CP cap ${cap}`);
        }
      }
    }
  }

  totalCount += pvpBestInRoleBonus;

  // 🛡️ 2. GYM DEFENSE — 1 if viable defender + bonus for best defenders
  // Only add if it's actually a good defender (A/B/S tier)
  const defTier = (mon.defenderTier || "").toUpperCase();
  let defenseBestInRoleBonus = 0;

  if (defTier.startsWith("A") || defTier.startsWith("B") || defTier.startsWith("S")) {
    totalCount++;

    // BEST-IN-ROLE BONUS: +2 additional copies if S tier (the very best defenders)
    if (defTier.startsWith("S")) {
      defenseBestInRoleBonus += 2;

      if (mon.name === current) {
        console.log(`Gym Defense +1 + BEST-IN-ROLE +2: ${defTier} tier`);
      }
    } else {
      if (mon.name === current) {
        console.log(`Gym Defense +1: ${defTier} tier`);
      }
    }
  }

  totalCount += defenseBestInRoleBonus;

  // 🔥 3. RAID ANALYSIS — 1 for every useful damage type + bonus for best-in-role
  // Aligned with trashability: count distinct type roles where Pokemon excels
  const usefulTypes = new Set();
  let raidBestInRoleBonus = 0;

  // Check bestTypes for legitimate type coverage roles
  (mon.bestTypes || []).forEach((typeData) => {
    const score = parseFloat(typeData.score || 0);
    const rank = parseInt(typeData.rank || "999", 10);

    // Use trashability-aligned thresholds: score 12+ and rank 25+ indicates useful type coverage
    if (score >= 12 && rank <= 25) {
      usefulTypes.add(typeData.type);

      // BEST-IN-ROLE BONUS: +2 additional copies if rank 1-3 (the very best)
      if (rank <= 3) {
        raidBestInRoleBonus += 2;

        if (mon.name === current) {
          console.log(`Raid Type +1 + BEST-IN-ROLE +2: ${typeData.type} (score: ${score}, rank: ${rank})`);
        }
      } else {
        if (mon.name === current) {
          console.log(`Raid Type +1: ${typeData.type} (score: ${score}, rank: ${rank})`);
        }
      }
    }
  });

  totalCount += usefulTypes.size + raidBestInRoleBonus;

  // 🎯 4. APPLY HARD CAP
  const finalCount = Math.min(6, totalCount);

  if (mon.name === current) {
    console.log(`\n🧪 Debug: ${mon.name}`);
    console.log("PvP CP Caps:", Array.from(cpCaps));
    console.log("PvP Best-in-Role Bonus:", pvpBestInRoleBonus);
    console.log("Gym Defense:", defTier);
    console.log("Defense Best-in-Role Bonus:", defenseBestInRoleBonus);
    console.log("Useful Raid Types:", Array.from(usefulTypes));
    console.log("Raid Best-in-Role Bonus:", raidBestInRoleBonus);
    console.log("Total Before Cap:", totalCount);
    console.log("Final Recommended:", finalCount);
  }

  return finalCount;
};

// Run and update
const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
const updated = data.map((mon) => ({
  ...mon,
  recommendedCount: calcRecommendedCount(mon),
}));
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updated, null, 2));
console.log(`✅ Updated ${updated.length} Pokémon → saved to ${path.basename(OUTPUT_PATH)}`);
