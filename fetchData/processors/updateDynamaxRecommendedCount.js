/**
 * DYNAMAX POKEMON RECOMMENDED COUNT CALCULATOR
 *
 * Calculates how many copies of each Dynamax Pokemon a player should keep based on:
 * - Max Battle participation requirements (only dynamax can enter)
 * - Gigantamax raid team building (need multiple strong dynamax)
 * - Type coverage for different Max Battle encounters
 * - Power Spot placement utility (stationed Pokemon provide bonuses)
 * - Collection value for limited availability Pokemon
 *
 * DYNAMAX-SPECIFIC LOGIC:
 * - Max Battle teams require 1-4 dynamax Pokemon per battle
 * - Gigantamax raids need strong teams of dynamax Pokemon
 * - Power Spot placement provides ongoing benefits
 * - Limited availability makes collection more valuable
 * - Different meta than regular Pokemon battles
 *
 * CALCULATION APPROACH:
 * - Base count for Max Battle participation
 * - Bonus for strong performance in Max Battle scenarios
 * - Type coverage bonuses for versatility
 * - Team building considerations for Gigantamax raids
 * - Hard cap at 3 (reasonable for dynamax collection)
 */

const fs = require("fs");
const path = require("path");

// INPUT/OUTPUT PATHS
const INPUT_PATH = path.resolve(__dirname, "../../public/data/pokemon.json");
const OUTPUT_PATH = path.resolve(__dirname, "../../public/data/pokemon.json");

// For debugging specific Pokemon
const current = "";

/**
 * DYNAMAX RECOMMENDED COUNT CALCULATION
 *
 * Different logic than regular Pokemon due to unique Max Battle mechanics
 */
const calcDynamaxRecommendedCount = (mon) => {
  let totalCount = 0;

  // 🎯 1. MAX BATTLE PARTICIPATION BASE
  // Every dynamax Pokemon gets at least 1 for basic Max Battle access
  totalCount += 1;

  if (mon.name === current) {
    console.log(`Base Max Battle participation: +1`);
  }

  // 🥊 2. PERFORMANCE-BASED BONUSES
  // Strong performers get additional copies for team building
  const leagues = mon.leagues || {};
  const pvpScores = Object.values(leagues)
    .filter((league) => league && league.score)
    .map((league) => league.score);

  let performanceBonus = 0;
  if (pvpScores.length > 0) {
    const maxPvpScore = Math.max(...pvpScores);
    const avgPvpScore = pvpScores.reduce((a, b) => a + b, 0) / pvpScores.length;

    // Elite performers (95+) - essential for Gigantamax teams
    if (maxPvpScore >= 95) {
      performanceBonus += 2;
      if (mon.name === current) {
        console.log(`Elite PvP performance (${maxPvpScore}): +2`);
      }
    }
    // Strong performers (85+) - valuable for Max Battles
    else if (maxPvpScore >= 85) {
      performanceBonus += 1;
      if (mon.name === current) {
        console.log(`Strong PvP performance (${maxPvpScore}): +1`);
      }
    }
    // Consistent performers (avg 75+) - reliable team members
    else if (avgPvpScore >= 75) {
      performanceBonus += 1;
      if (mon.name === current) {
        console.log(`Consistent PvP performance (avg ${avgPvpScore.toFixed(1)}): +1`);
      }
    }
  }

  totalCount += performanceBonus;

  // 🏆 3. RAID UTILITY BONUS
  // Strong raid performers are valuable for Max Battle mechanics
  let raidBonus = 0;
  if (mon.raidTier) {
    const raidValues = {
      "S Tier": 2,
      "A+ Tier": 1,
      "A Tier": 1,
      "B+ Tier": 1,
      "B Tier": 0,
      "C Tier": 0,
    };
    raidBonus = raidValues[mon.raidTier] || 0;

    if (raidBonus > 0 && mon.name === current) {
      console.log(`Raid tier bonus (${mon.raidTier}): +${raidBonus}`);
    }
  }

  totalCount += raidBonus;

  // 🌟 4. TYPE COVERAGE BONUS
  // Versatile Pokemon with multiple type coverage get bonus for team building
  const bestTypes = mon.bestTypes || [];
  let typeBonus = 0;

  if (bestTypes.length >= 4) {
    typeBonus = 1; // Very versatile
    if (mon.name === current) {
      console.log(`High type coverage (${bestTypes.length} types): +1`);
    }
  }

  totalCount += typeBonus;

  // 🎭 5. LEGENDARY/SPECIAL BONUS
  // Legendary and special Pokemon get extra value due to rarity
  let specialBonus = 0;
  const isLegendaryMythical = mon.name.includes("Articuno") || mon.name.includes("Zapdos") || mon.name.includes("Moltres") || mon.name.includes("Mewtwo") || mon.name.includes("Raikou") || mon.name.includes("Entei") || mon.name.includes("Suicune") || mon.name.includes("Zacian") || mon.name.includes("Zamazenta") || mon.name.includes("Urshifu");

  if (isLegendaryMythical) {
    specialBonus = 1;
    if (mon.name === current) {
      console.log(`Legendary/Mythical bonus: +1`);
    }
  }

  totalCount += specialBonus;

  // 🎯 6. GIGANTAMAX FORM BONUS
  // Pokemon that can become Gigantamax get extra value
  const hasGigantamaxForm = mon.form === "normal" && ["Venusaur", "Charizard", "Blastoise", "Butterfree", "Meowth", "Machamp", "Gengar", "Kingler", "Lapras", "Eevee", "Snorlax", "Rillaboom", "Cinderace", "Inteleon", "Toxtricity"].includes(mon.base);

  let gigantamaxBonus = 0;
  if (hasGigantamaxForm) {
    gigantamaxBonus = 1;
    if (mon.name === current) {
      console.log(`Gigantamax form available: +1`);
    }
  }

  totalCount += gigantamaxBonus;

  // 🎯 7. APPLY DYNAMAX-SPECIFIC CAP
  // Cap at 3 for dynamax Pokemon (more reasonable than regular 6)
  const finalCount = Math.min(3, totalCount);

  if (mon.name === current) {
    console.log(`\n🧪 Dynamax Debug: ${mon.name}`);
    console.log("Performance Bonus:", performanceBonus);
    console.log("Raid Bonus:", raidBonus);
    console.log("Type Coverage Bonus:", typeBonus);
    console.log("Special Bonus:", specialBonus);
    console.log("Gigantamax Bonus:", gigantamaxBonus);
    console.log("Total Before Cap:", totalCount);
    console.log("Final Recommended:", finalCount);
  }

  return finalCount;
};

/**
 * MAIN EXECUTION
 * Process only dynamax Pokemon and update their recommendedCount
 */
const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
let dynamaxCount = 0;

const updated = data.map((mon) => {
  // Only process dynamax Pokemon
  if (mon.dynamax === true) {
    dynamaxCount++;
    const newRecommendedCount = calcDynamaxRecommendedCount(mon);

    if (mon.name === current) {
      console.log(`DEBUG: ${current} → Dynamax recommendedCount: ${mon.recommendedCount} → ${newRecommendedCount}`);
    }

    // Store original recommendedCount before overwriting
    return {
      ...mon,
      regularRecommendedCount: mon.recommendedCount, // Store original recommendedCount
      recommendedCount: newRecommendedCount, // Update with dynamax recommendedCount
    };
  }

  // Return non-dynamax Pokemon unchanged
  return mon;
});

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updated, null, 2));
console.log(`✅ Updated ${dynamaxCount} Dynamax Pokémon recommendedCount → saved to ${path.basename(OUTPUT_PATH)}`);
