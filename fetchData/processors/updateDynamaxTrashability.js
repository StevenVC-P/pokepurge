/**
 * DYNAMAX POKEMON TRASHABILITY CALCULATOR
 *
 * This script calculates trashability scores specifically for Dynamax Pokemon based on their unique mechanics:
 * - Max Battle utility (only Dynamax Pokemon can participate)
 * - Gateway role for Gigantamax content (40-player raids)
 * - Enhanced moves and 3-turn Dynamax transformation
 * - Different raid performance characteristics
 * - Collectibility value for Max Battle participation
 *
 * DYNAMAX-SPECIFIC CONSIDERATIONS:
 * - Max Battle participation requirement (only dynamax can enter)
 * - Gigantamax raid prerequisites (need dynamax for teams)
 * - Enhanced HP and special moves during transformation
 * - Limited availability and collection value
 * - Different meta than regular Pokemon
 *
 * DATA FLOW:
 * 1. Read pokemon.json (output from regular trashability processor)
 * 2. Filter for dynamax Pokemon (dynamax: true)
 * 3. Apply dynamax-specific scoring logic
 * 4. Update trashability and scores for dynamax Pokemon only
 * 5. Save updated data back to pokemon.json
 */

const fs = require("fs");
const path = require("path");

// INPUT/OUTPUT PATHS
const INPUT_PATH = path.resolve(__dirname, "../pokemon.json");
const OUTPUT_PATH = path.resolve(__dirname, "../pokemon.json");

// For debugging specific Pokemon
const current = "";

/**
 * DYNAMAX-SPECIFIC SCORING COMPONENTS
 */

/**
 * Max Battle Utility Score
 * Dynamax Pokemon are the ONLY way to participate in Max Battles
 * This gives them inherent utility regardless of stats
 */
const maxBattleUtilityScore = (mon) => {
  // Base utility for being able to participate in Max Battles
  let score = 15; // Significant base value for exclusive access

  // Bonus for strong PvP performance (translates to Max Battle effectiveness)
  const leagues = mon.leagues || {};
  const pvpScores = Object.values(leagues)
    .filter((league) => league && league.score)
    .map((league) => league.score);

  if (pvpScores.length > 0) {
    const maxPvpScore = Math.max(...pvpScores);
    if (maxPvpScore >= 85) score += 10; // Strong performer
    else if (maxPvpScore >= 75) score += 5; // Decent performer
  }

  // Bonus for raid utility (Max Battles have raid-like mechanics)
  if (mon.raidTier) {
    const raidBonus = {
      "S Tier": 10,
      "A+ Tier": 8,
      "A Tier": 6,
      "B+ Tier": 4,
      "B Tier": 2,
      "C Tier": 1,
    };
    score += raidBonus[mon.raidTier] || 0;
  }

  return Math.min(score, 35); // Cap at 35
};

/**
 * Gigantamax Gateway Score
 * Dynamax Pokemon are required to participate in Gigantamax raids
 * This creates additional utility beyond their individual performance
 */
const gigantamaxGatewayScore = (mon) => {
  // Base gateway value - all dynamax Pokemon enable Gigantamax participation
  let score = 10;

  // Higher value for Pokemon that are likely to be used in Gigantamax teams
  const leagues = mon.leagues || {};
  const hasStrongPerformance = Object.values(leagues).some((league) => league && league.score >= 80);

  if (hasStrongPerformance) {
    score += 8; // More likely to be used in actual Gigantamax teams
  }

  // Bonus for type coverage utility
  const bestTypes = mon.bestTypes || [];
  if (bestTypes.length >= 3) {
    score += 5; // Versatile for different Gigantamax encounters
  }

  return score;
};

/**
 * Dynamax Transformation Bonus
 * Account for the enhanced capabilities during Dynamax transformation
 */
const dynamaxTransformationScore = (mon) => {
  let score = 5; // Base transformation value

  // Bonus based on base stats quality (better stats = better transformation)
  const leagues = mon.leagues || {};
  const statProducts = Object.values(leagues)
    .filter((league) => league && league.stats && league.stats.product)
    .map((league) => league.stats.product);

  if (statProducts.length > 0) {
    const maxProduct = Math.max(...statProducts);
    if (maxProduct >= 2000) score += 8;
    else if (maxProduct >= 1500) score += 5;
    else if (maxProduct >= 1000) score += 3;
  }

  return score;
};

/**
 * Collectibility and Rarity Score
 * Dynamax Pokemon have limited availability and collection value
 */
const collectibilityScore = (mon) => {
  let score = 8; // Base collectibility for limited availability

  // Higher value for legendary/mythical Pokemon
  const isLegendaryMythical = mon.name.includes("Articuno") || mon.name.includes("Zapdos") || mon.name.includes("Moltres") || mon.name.includes("Mewtwo") || mon.name.includes("Raikou") || mon.name.includes("Entei") || mon.name.includes("Suicune") || mon.name.includes("Zacian") || mon.name.includes("Zamazenta");

  if (isLegendaryMythical) {
    score += 12; // Legendary dynamax are especially valuable
  }

  // Bonus for Pokemon with Gigantamax forms (extra collectibility)
  const hasGigantamaxForm =
    mon.form === "normal" &&
    // Check if there's a corresponding Gigantamax form in the data
    // This is a simplified check - in practice you'd cross-reference the full dataset
    ["Venusaur", "Charizard", "Blastoise", "Butterfree", "Meowth", "Machamp", "Gengar", "Kingler", "Lapras", "Eevee", "Snorlax", "Rillaboom", "Cinderace", "Inteleon", "Toxtricity"].includes(mon.base);

  if (hasGigantamaxForm) {
    score += 6; // Can eventually become Gigantamax
  }

  return score;
};

/**
 * DYNAMAX TRASHABILITY TIER MAPPING
 * Different thresholds than regular Pokemon due to unique utility
 */
const dynamaxTierRank = {
  Essential: 6, // 50+ points - Must-have for Max Battles
  Valuable: 5, // 40-49 points - Strong Max Battle utility
  Reliable: 4, // 30-39 points - Solid Max Battle option
  Useful: 3, // 20-29 points - Situational Max Battle use
  Niche: 2, // 10-19 points - Limited Max Battle utility
  Trash: 1, // 0-9 points - Poor Max Battle performance
};

const dynamaxRankToTier = {
  6: "Essential",
  5: "Valuable",
  4: "Reliable",
  3: "Useful",
  2: "Niche",
  1: "Trash",
};

/**
 * MAIN DYNAMAX TRASHABILITY CALCULATION
 * Combines dynamax-specific scoring components
 */
const calculateDynamaxTrashability = (mon) => {
  const maxBattleUtility = maxBattleUtilityScore(mon);
  const gigantamaxGateway = gigantamaxGatewayScore(mon);
  const transformation = dynamaxTransformationScore(mon);
  const collectibility = collectibilityScore(mon);

  const totalScore = maxBattleUtility + gigantamaxGateway + transformation + collectibility;

  // Determine tier based on total score
  let tier = dynamaxTierRank.Trash;
  if (totalScore >= 50) tier = dynamaxTierRank.Essential;
  else if (totalScore >= 40) tier = dynamaxTierRank.Valuable;
  else if (totalScore >= 30) tier = dynamaxTierRank.Reliable;
  else if (totalScore >= 20) tier = dynamaxTierRank.Useful;
  else if (totalScore >= 10) tier = dynamaxTierRank.Niche;

  if (mon.name === current) {
    console.log(`🧪 Dynamax Debug: ${current}`);
    console.log("Max Battle Utility:", maxBattleUtility);
    console.log("Gigantamax Gateway:", gigantamaxGateway);
    console.log("Transformation:", transformation);
    console.log("Collectibility:", collectibility);
    console.log("Total Score:", totalScore);
    console.log("Final Tier:", dynamaxRankToTier[tier]);
  }

  return {
    trashabilityScore: tier * 10, // Convert to 10-60 scale
    trashability: dynamaxRankToTier[tier],
    dynamaxScore: totalScore, // Store raw score for analysis
  };
};

/**
 * MAIN EXECUTION
 * Process only dynamax Pokemon and update their trashability
 */
const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
let dynamaxCount = 0;

const updated = data.map((mon) => {
  // Only process dynamax Pokemon
  if (mon.dynamax === true) {
    dynamaxCount++;
    const dynamaxRating = calculateDynamaxTrashability(mon);

    if (mon.name === current) {
      console.log(`DEBUG: ${current} → Dynamax rating:`, dynamaxRating);
    }

    // Store original values before overwriting
    return {
      ...mon,
      regularTrashability: mon.trashability, // Store original trashability
      regularTrashabilityScore: mon.trashabilityScore, // Store original score
      trashabilityScore: dynamaxRating.trashabilityScore, // Update with dynamax score
      trashability: dynamaxRating.trashability, // Update with dynamax trashability
      dynamaxScore: dynamaxRating.dynamaxScore, // Store raw dynamax score
    };
  }

  // Return non-dynamax Pokemon unchanged
  return mon;
});

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updated, null, 2));
console.log(`✅ Updated ${dynamaxCount} Dynamax Pokémon trashability → saved to ${path.basename(OUTPUT_PATH)}`);
