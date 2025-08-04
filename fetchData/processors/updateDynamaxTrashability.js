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
const INPUT_PATH = path.resolve(__dirname, "../../public/data/pokemon.json");
const OUTPUT_PATH = path.resolve(__dirname, "../../public/data/pokemon.json");

// For debugging specific Pokemon
const current = "";

// Cache for data-driven detection
let gigantamaxBasesCache = null;
let legendaryBasesCache = null;
let typeMetaCache = null;

/**
 * DATA-DRIVEN DETECTION HELPERS
 * These functions analyze the actual dataset to avoid hardcoded lists
 */

/**
 * Build cache of Pokemon bases that have Gigantamax forms
 * @param {Array} allPokemon - Full Pokemon dataset
 * @returns {Set} Set of base names that have Gigantamax forms
 */
const buildGigantamaxBasesCache = (allPokemon) => {
  if (gigantamaxBasesCache) return gigantamaxBasesCache;

  gigantamaxBasesCache = new Set();
  allPokemon.forEach((mon) => {
    if (mon.form === "Gigantamax") {
      gigantamaxBasesCache.add(mon.base);
    }
  });

  console.log(`🔍 Found ${gigantamaxBasesCache.size} Pokemon with Gigantamax forms:`, Array.from(gigantamaxBasesCache).sort());
  return gigantamaxBasesCache;
};

/**
 * Build cache of legendary/mythical Pokemon bases
 * Uses comprehensive legendary list and cross-references with actual data
 * @param {Array} allPokemon - Full Pokemon dataset
 * @returns {Set} Set of base names that are legendary/mythical
 */
const buildLegendaryBasesCache = (allPokemon) => {
  if (legendaryBasesCache) return legendaryBasesCache;

  // Comprehensive legendary/mythical list (Gen 1-8)
  const knownLegendaries = new Set([
    // Gen 1
    "Articuno",
    "Zapdos",
    "Moltres",
    "Mewtwo",
    "Mew",
    // Gen 2
    "Raikou",
    "Entei",
    "Suicune",
    "Lugia",
    "Ho-Oh",
    "Celebi",
    // Gen 3
    "Regirock",
    "Regice",
    "Registeel",
    "Latios",
    "Latias",
    "Kyogre",
    "Groudon",
    "Rayquaza",
    "Jirachi",
    "Deoxys",
    // Gen 4
    "Uxie",
    "Mesprit",
    "Azelf",
    "Dialga",
    "Palkia",
    "Heatran",
    "Regigigas",
    "Giratina",
    "Cresselia",
    "Phione",
    "Manaphy",
    "Darkrai",
    "Shaymin",
    "Arceus",
    // Gen 5
    "Victini",
    "Cobalion",
    "Terrakion",
    "Virizion",
    "Tornadus",
    "Thundurus",
    "Reshiram",
    "Zekrom",
    "Landorus",
    "Kyurem",
    "Keldeo",
    "Meloetta",
    "Genesect",
    // Gen 6
    "Xerneas",
    "Yveltal",
    "Zygarde",
    "Diancie",
    "Hoopa",
    "Volcanion",
    // Gen 7
    "Type: Null",
    "Silvally",
    "Tapu Koko",
    "Tapu Lele",
    "Tapu Bulu",
    "Tapu Fini",
    "Cosmog",
    "Cosmoem",
    "Solgaleo",
    "Lunala",
    "Necrozma",
    "Magearna",
    "Marshadow",
    "Zeraora",
    // Gen 8
    "Zacian",
    "Zamazenta",
    "Eternatus",
    "Kubfu",
    "Urshifu",
    "Regieleki",
    "Regidrago",
    "Glastrier",
    "Spectrier",
    "Calyrex",
    // Special cases
    "Meltan",
    "Melmetal",
  ]);

  legendaryBasesCache = new Set();
  allPokemon.forEach((mon) => {
    if (knownLegendaries.has(mon.base)) {
      legendaryBasesCache.add(mon.base);
    }
  });

  console.log(`🔍 Found ${legendaryBasesCache.size} legendary/mythical Pokemon in dataset:`, Array.from(legendaryBasesCache).sort());
  return legendaryBasesCache;
};

/**
 * Build type meta analysis for Max Battle relevance
 * @param {Array} allPokemon - Full Pokemon dataset
 * @returns {Object} Type meta analysis data
 */
const buildTypeMetaCache = (allPokemon) => {
  if (typeMetaCache) return typeMetaCache;

  const typeStats = {};
  const typePerformance = {};

  allPokemon.forEach((mon) => {
    if (!mon.types || !Array.isArray(mon.types)) return;

    mon.types.forEach((type) => {
      if (!typeStats[type]) {
        typeStats[type] = { count: 0, totalScore: 0, topPerformers: 0 };
      }

      typeStats[type].count++;

      // Analyze PvP performance as proxy for Max Battle effectiveness
      const leagues = mon.leagues || {};
      const scores = Object.values(leagues)
        .filter((league) => league && league.score)
        .map((league) => league.score);

      if (scores.length > 0) {
        const maxScore = Math.max(...scores);
        typeStats[type].totalScore += maxScore;
        if (maxScore >= 85) typeStats[type].topPerformers++;
      }

      // Factor in raid performance
      if (mon.raidTier && !["D Tier", "C Tier"].includes(mon.raidTier)) {
        typeStats[type].topPerformers += 0.5;
      }
    });
  });

  // Calculate type meta relevance scores
  Object.keys(typeStats).forEach((type) => {
    const stats = typeStats[type];
    const avgScore = stats.totalScore / stats.count || 0;
    const topPerformerRatio = stats.topPerformers / stats.count || 0;

    typePerformance[type] = {
      avgScore,
      topPerformerRatio,
      metaRelevance: avgScore * 0.6 + topPerformerRatio * 40, // Weighted score
      count: stats.count,
    };
  });

  typeMetaCache = { typeStats, typePerformance };
  console.log(`🔍 Built type meta analysis for ${Object.keys(typeStats).length} types`);
  return typeMetaCache;
};

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
 * Now uses data-driven detection instead of hardcoded lists
 */
const collectibilityScore = (mon, allPokemon) => {
  let score = 8; // Base collectibility for limited availability

  // Build caches if not already done
  const legendaryBases = buildLegendaryBasesCache(allPokemon);
  const gigantamaxBases = buildGigantamaxBasesCache(allPokemon);

  // Higher value for legendary/mythical Pokemon (data-driven detection)
  const isLegendaryMythical = legendaryBases.has(mon.base);
  if (isLegendaryMythical) {
    score += 12; // Legendary dynamax are especially valuable
    if (mon.name === current) {
      console.log(`Legendary bonus: +12 (${mon.base} is legendary)`);
    }
  }

  // Bonus for Pokemon with Gigantamax forms (cross-referenced with actual data)
  const hasGigantamaxForm = mon.form === "normal" && gigantamaxBases.has(mon.base);
  if (hasGigantamaxForm) {
    score += 6; // Can eventually become Gigantamax
    if (mon.name === current) {
      console.log(`Gigantamax potential bonus: +6 (${mon.base} has Gigantamax form)`);
    }
  }

  // Additional rarity bonus for special forms
  if (mon.form && !["normal", "Gigantamax"].includes(mon.form)) {
    score += 2; // Special forms are more collectible
    if (mon.name === current) {
      console.log(`Special form bonus: +2 (form: ${mon.form})`);
    }
  }

  if (mon.name === current) {
    console.log(`Collectibility total: ${score} (base: 8, legendary: ${isLegendaryMythical ? 12 : 0}, gigantamax: ${hasGigantamaxForm ? 6 : 0})`);
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
 * Enhanced Type Coverage Score for Max Battle Meta
 * Analyzes type effectiveness and meta relevance dynamically
 */
const typeMetaCoverageScore = (mon, allPokemon) => {
  let score = 0;

  if (!mon.types || !Array.isArray(mon.types)) return score;

  const typeMeta = buildTypeMetaCache(allPokemon);

  mon.types.forEach((type) => {
    const typeData = typeMeta.typePerformance[type];
    if (typeData) {
      // Award points based on type meta relevance
      if (typeData.metaRelevance >= 70) {
        score += 3; // High meta relevance type
      } else if (typeData.metaRelevance >= 50) {
        score += 2; // Moderate meta relevance
      } else if (typeData.metaRelevance >= 30) {
        score += 1; // Some meta relevance
      }

      // Bonus for rare but powerful types
      if (typeData.count < 50 && typeData.avgScore >= 75) {
        score += 2; // Rare but strong type
      }

      if (mon.name === current) {
        console.log(`Type ${type}: meta relevance ${typeData.metaRelevance.toFixed(1)}, avg score ${typeData.avgScore.toFixed(1)}, count ${typeData.count}`);
      }
    }
  });

  if (mon.name === current) {
    console.log(`Type meta coverage score: ${score}`);
  }

  return Math.min(score, 8); // Cap at 8 points
};

/**
 * Get base form performance data for Gigantamax inheritance
 * @param {Object} mon - Current Pokemon
 * @param {Array} allPokemon - Full dataset
 * @returns {Object|null} Base form Pokemon data
 */
const getBaseFormData = (mon, allPokemon) => {
  if (mon.form !== "Gigantamax") return null;

  return allPokemon.find((p) => p.base === mon.base && p.form === "normal" && p.dynamax === true);
};

/**
 * MAIN DYNAMAX TRASHABILITY CALCULATION
 * Combines dynamax-specific scoring components with data-driven detection
 * Includes Gigantamax inheritance logic
 */
const calculateDynamaxTrashability = (mon, allPokemon) => {
  const maxBattleUtility = maxBattleUtilityScore(mon);
  const gigantamaxGateway = gigantamaxGatewayScore(mon);
  const transformation = dynamaxTransformationScore(mon);
  const collectibility = collectibilityScore(mon, allPokemon);
  const typeCoverage = typeMetaCoverageScore(mon, allPokemon);

  let totalScore = maxBattleUtility + gigantamaxGateway + transformation + collectibility + typeCoverage;

  // GIGANTAMAX INHERITANCE LOGIC
  // Gigantamax forms should never be worse than their base form
  if (mon.form === "Gigantamax") {
    const baseForm = getBaseFormData(mon, allPokemon);
    if (baseForm && baseForm.trashability) {
      const baseFormTier = dynamaxTierRank[baseForm.trashability] || 1;
      const currentTier = totalScore >= 50 ? 6 : totalScore >= 40 ? 5 : totalScore >= 30 ? 4 : totalScore >= 20 ? 3 : totalScore >= 10 ? 2 : 1;

      if (currentTier < baseFormTier) {
        // Boost score to match base form tier + Gigantamax premium
        const minScoreForBaseTier = baseFormTier === 6 ? 50 : baseFormTier === 5 ? 40 : baseFormTier === 4 ? 30 : baseFormTier === 3 ? 20 : baseFormTier === 2 ? 10 : 0;
        totalScore = Math.max(totalScore, minScoreForBaseTier + 5); // +5 Gigantamax premium

        if (mon.name === current) {
          console.log(`🎯 Gigantamax Inheritance: Base form ${baseForm.name} is ${baseForm.trashability} (tier ${baseFormTier})`);
          console.log(`🎯 Boosted score from ${totalScore - 5} to ${totalScore} to maintain tier hierarchy`);
        }
      }
    }
  }

  // Determine tier based on final score
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
    console.log("Type Coverage:", typeCoverage);
    console.log("Final Score:", totalScore);
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
    const dynamaxRating = calculateDynamaxTrashability(mon, data);

    if (mon.name === current) {
      console.log(`DEBUG: ${current} → Dynamax rating:`, dynamaxRating);
    }

    // Store original values before overwriting
    const updatedMon = {
      ...mon,
      regularTrashability: mon.trashability, // Store original trashability
      regularTrashabilityScore: mon.trashabilityScore, // Store original score
      trashabilityScore: dynamaxRating.trashabilityScore, // Update with dynamax score
      trashability: dynamaxRating.trashability, // Update with dynamax trashability
      dynamaxScore: dynamaxRating.dynamaxScore, // Store raw dynamax score
    };

    if (mon.name === current) {
      console.log(`DEBUG: Updated ${current} trashability:`, updatedMon.trashability);
      console.log(`DEBUG: Updated ${current} trashabilityScore:`, updatedMon.trashabilityScore);
    }

    return updatedMon;
  }

  // Return non-dynamax Pokemon unchanged
  return mon;
});

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updated, null, 2));
console.log(`✅ Updated ${dynamaxCount} Dynamax Pokémon trashability → saved to ${path.basename(OUTPUT_PATH)}`);
