/**
 * POKEMON TRASHABILITY CALCULATOR
 *
 * This script calculates comprehensive trashability scores for Pokemon based on multiple factors:
 * - PvP performance across leagues (with weakness analysis and move penalties)
 * - Raid performance and type coverage
 * - Defense capabilities
 * - Legacy move availability
 * - Meta-relevant typing combinations
 * - Defined competitive roles
 *
 * DATA FLOW:
 * 1. Read PokemonMaster_with_weakness.json (contains league scores, raid tiers, move data)
 * 2. Read moves.json and meta-attack-types.json for move analysis
 * 3. For each Pokemon, calculate individual component scores
 * 4. Apply smart logic to determine role dominance tier
 * 5. Combine all factors into final trashability classification
 * 6. Write updated data back to pokemon.json
 *
 * PHILOSOPHY:
 * Essential tier requires more than just high simulation numbers - Pokemon must have:
 * - Meta-relevant typing combinations that define roles in competitive play
 * - Clear performance patterns showing consistent or dominant league presence
 * - Actual utility beyond statistical outliers
 *
 * WHY THIS APPROACH:
 * Previous systems suffered from "statistical overfitting" where Pokemon with good
 * simulation scores but no actual meta relevance were rated as Essential. This system
 * uses intelligent filtering based on typing, role clarity, and actual competitive utility.
 */

const fs = require("fs");
const path = require("path");

// INPUT DATA SOURCES:
// - PokemonMaster_with_weakness.json: Main Pokemon data with league scores, raid tiers, weakness analysis
// - moves.json: Move data for penalty calculations
// - meta-attack-types.json: Popular attack types from meta-relevant Pokemon for weakness analysis
const INPUT_PATH = path.resolve(__dirname, "../outputs/PokemonMaster.json");
const OUTPUT_PATH = path.resolve(__dirname, "../outputs/PokemonMaster.json");
const MOVES_PATH = path.resolve(__dirname, "../outputs/moves.json");
const META_ATTACK_TYPES_PATH = path.resolve(__dirname, "../outputs/meta-attack-types.json");

// For debugging specific Pokemon - set to Pokemon name to see detailed scoring breakdown
const current = "";

// Official Tier Ranking System - matches TRASHABILITY_TIER_DEFINITIONS.md
// Higher numbers = better trashability rating, reflects investment priority
const tierRank = {
  Essential: 6, // 🟩 Top ~60–70 meta-defining species/forms (3-5%)
  Valuable: 5, // 🟦 Strong alternatives / backups / format MVPs (10-15%)
  Reliable: 4, // 🟨 Good but replaceable; only good with IVs, cups, or as filler (15-20%)
  Useful: 3, // 🟧 Situational spice / one-cup wonders / limited role (10-15%)
  Niche: 2, // 🟪 Rarely useful, but might shine in fringe formats (20-25%)
  Trash: 1, // 🟥 No real use — bad stats, moves, or fully outclassed (30-35%)
};

// Reverse mapping for converting numeric ranks back to tier names
const rankToTier = Object.entries(tierRank).reduce((acc, [tier, rank]) => {
  acc[rank] = tier;
  return acc;
}, {});

// Load external data files for move analysis and weakness calculations
const movesData = JSON.parse(fs.readFileSync(MOVES_PATH, "utf8"));
const metaAttackData = JSON.parse(fs.readFileSync(META_ATTACK_TYPES_PATH, "utf8"));

// Extract meta attack types for weakness analysis - these are the most common attack types
// used by meta-relevant Pokemon, helping identify defensive liabilities
const metaAttackTypes = metaAttackData.typeDistribution || [];

/**
 * MOVE ANALYSIS FUNCTIONS
 * These functions analyze Pokemon movesets for competitive viability
 */

// Identifies fast moves that generate energy too slowly for competitive play
// WHY: Energy generation is crucial in PvP - slow energy moves limit charge move frequency
const isClunkyFastMove = (moveId) => {
  const move = movesData[moveId];
  return move?.category === "fast" && move.energyGain < 9;
};

// Identifies charge moves that cost too much energy to be practical
// WHY: High-cost moves (>65 energy) are often too slow to use effectively in PvP
const isLowPressureChargeMove = (moveId) => {
  const move = movesData[moveId];
  return move?.category === "charge" && move.energyCost > 65;
};

// Identifies moves with good bait potential (low cost, decent power)
// WHY: Bait moves force shields and create pressure - essential for PvP success
const hasGoodBaitPotential = (moveId) => {
  const move = movesData[moveId];
  return move?.category === "charge" && move.energyCost <= 40 && move.power >= 50;
};

const hasAntiMetaCoverage = (mon, metaAttackTypes) => {
  if (!mon.leagues?.great?.moves || !mon.types) return false;

  const moves = mon.leagues.great.moves;
  const pokemonTypes = mon.types.map((t) => t.toLowerCase());

  // Check if Pokemon has moves that are super effective against top meta types
  const topMetaTypes = metaAttackTypes.slice(0, 5).map((t) => t.type); // Top 5 meta attack types
  let coverageCount = 0;

  [moves.charge1, moves.charge2].forEach((moveRef) => {
    if (moveRef) {
      const move = movesData[moveRef];
      if (move) {
        const moveType = move.type.toLowerCase();
        // Check if this move type is super effective against any top meta types
        topMetaTypes.forEach((metaType) => {
          if (isTypeEffective(moveType, metaType)) {
            coverageCount++;
          }
        });
      }
    }
  });

  return coverageCount >= 2; // Has coverage against at least 2 top meta types
};

// Simple type effectiveness check for common matchups
const isTypeEffective = (attackType, defendType) => {
  const effectiveness = {
    fighting: ["normal", "rock", "steel", "ice", "dark"],
    rock: ["flying", "bug", "fire", "ice"],
    ground: ["poison", "rock", "steel", "fire", "electric"],
    electric: ["flying", "water"],
    ice: ["flying", "ground", "grass", "dragon"],
    grass: ["ground", "rock", "water"],
    water: ["ground", "rock", "fire"],
    fire: ["bug", "steel", "grass", "ice"],
    psychic: ["fighting", "poison"],
    ghost: ["ghost", "psychic"],
    dark: ["ghost", "psychic"],
    steel: ["rock", "ice", "fairy"],
    fairy: ["fighting", "dragon", "dark"],
  };

  return effectiveness[attackType]?.includes(defendType) || false;
};

/**
 * PVP HEURISTIC PENALTY CALCULATION
 *
 * Applies penalties to Pokemon with poor movesets or lack of meta utility
 * WHY: Raw simulation scores don't account for practical moveset limitations
 *
 * PENALTY FACTORS:
 * - Slow energy generation (limits charge move frequency)
 * - Lack of bait moves (reduces shield pressure)
 * - No anti-meta coverage (can't threaten popular Pokemon)
 * - Overall move efficiency issues
 */
const getPvPHeuristicPenalty = (mon, metaAttackTypes = []) => {
  const league = mon.leagues?.great;
  if (!league || !league.moves) return 0;

  const moves = league.moves;
  let penalty = 0;

  // 1. Slow moves penalty - punishes Pokemon with energy generation issues
  if (isClunkyFastMove(moves.fast)) penalty -= 3;
  if (isLowPressureChargeMove(moves.charge1) && isLowPressureChargeMove(moves.charge2)) penalty -= 4;

  // 2. Low shield pressure penalty - Pokemon need bait moves to force shields
  const hasBaitMove = hasGoodBaitPotential(moves.charge1) || hasGoodBaitPotential(moves.charge2);
  if (!hasBaitMove) penalty -= 2; // No good bait potential

  // 3. No anti-meta coverage penalty - Pokemon should threaten popular threats
  if (metaAttackTypes.length > 0 && !hasAntiMetaCoverage(mon, metaAttackTypes)) {
    penalty -= 2; // Can't counter top meta threats
  }

  // 4. Additional fast move efficiency check - energy per second calculation
  const fastMove = movesData[moves.fast];
  if (fastMove) {
    const eps = fastMove.energyGain / (fastMove.turns || 1); // Energy per second
    if (eps < 3.0) penalty -= 1; // Very slow energy generation
  }

  return penalty;
};

const getWeaknessBonus = (mon) => {
  if (!mon.weaknessAnalysis) return 0;

  const wa = mon.weaknessAnalysis;
  let bonus = 0;

  // Defensive rating bonus/penalty
  switch (wa.defensiveRating) {
    case "Excellent":
      bonus += 2;
      break;
    case "Very Good":
      bonus += 1;
      break;
    case "Good":
      bonus += 0.5;
      break;
    case "Average":
      bonus += 0;
      break;
    case "Poor":
      bonus -= 0.5;
      break;
    case "Very Poor":
      bonus -= 1;
      break;
    case "Terrible":
      bonus -= 2;
      break;
  }

  // Additional penalty for high-impact weaknesses to meta types
  if (wa.hasHighImpactWeaknesses) {
    bonus -= 1;
  }

  // Bonus for high-benefit resistances to meta types
  if (wa.hasHighBenefitResistances) {
    bonus += 0.5;
  }

  return bonus;
};

const getCpCap = (leagueName) => {
  const n = leagueName.toLowerCase();
  if (n.includes("little")) return 500;
  if (n.includes("great") || n.includes("sunshine") || n.includes("ascension") || n.includes("aurora") || n.includes("hisui") || n.includes("devon") || n.includes("onyx") || n.includes("pillar")) return 1500;
  if (n.includes("ultra")) return 2500;
  if (n.includes("master")) return 10000;
  return null;
};

/**
 * PVP SCORE CALCULATION
 *
 * Calculates a comprehensive PvP score based on:
 * - Peak performance across all leagues
 * - League diversity (performing well in multiple CP caps)
 * - Weakness analysis (defensive liabilities)
 * - Move quality penalties
 *
 * WHY THIS APPROACH:
 * - Peak performance shows potential ceiling
 * - Diversity bonus rewards versatile Pokemon
 * - Weakness/move penalties account for practical limitations
 * - Results in more realistic competitive assessment
 */
const pvpScore = (mon) => {
  const leagues = mon.leagues || {};
  let maxScore = 0;
  const seenCaps = new Set();
  let diversityBonus = 0;

  // Find peak performance and calculate diversity bonus
  for (const name in leagues) {
    const league = leagues[name];
    if (!league || typeof league.score !== "number") continue;

    const score = league.score;
    if (score > maxScore) maxScore = score;

    // Diversity bonus: reward Pokemon that perform well across different CP caps
    const cap = getCpCap(name);
    if (cap && score >= 75 && !seenCaps.has(cap)) {
      diversityBonus += 6; // +6 points per unique CP cap with 75+ score
      seenCaps.add(cap);
    }
  }

  let base = 0;
  if (maxScore >= 90) base = 15;
  else if (maxScore >= 80) base = 12;
  else if (maxScore >= 70) base = 8;
  else if (maxScore >= 60) base = 4;

  const penalty = getPvPHeuristicPenalty(mon, metaAttackTypes);
  const weaknessBonus = getWeaknessBonus(mon);
  return Math.max(0, Math.min(30, base + diversityBonus + penalty + weaknessBonus));
};

const raidTierScore = (tier) => {
  if (!tier) return 0;
  const t = tier.toUpperCase();
  if (t.startsWith("S")) return 20;
  if (t.startsWith("A+")) return 15;
  if (t.startsWith("A")) return 10;
  if (t.startsWith("B")) return 6;
  if (t.startsWith("C")) return 3;
  return 0;
};

const multiTypeCoverageScore = (bestTypes = []) => {
  let score = 0;
  const seenTypes = new Set();
  for (const t of bestTypes) {
    const typeScore = parseFloat(t.score);
    const rank = parseInt(t.rank);
    if (typeScore >= 9 && rank && rank < 50 && !seenTypes.has(t.type)) {
      score += 5;
      seenTypes.add(t.type);
    }
  }
  return Math.min(score, 15);
};

const moveDiversityScore = (bestTypes = []) => {
  const moves = bestTypes.map((t) => t.chargeMove).filter(Boolean);
  const uniqueMoves = new Set(moves);
  return uniqueMoves.size >= 2 ? 5 : 0;
};

const defenseScore = (tier) => {
  if (!tier) return 0;
  const t = tier.toUpperCase();
  if (t.startsWith("S")) return 6;
  if (t.startsWith("A")) return 5;
  if (t.startsWith("B")) return 3;
  if (t.startsWith("C")) return 1;
  return 0;
};

const legacyScore = (mon) => {
  if (!mon.name.includes("*")) return 0;
  const pvp = pvpScore(mon); // Use enhanced PvP score
  const raid = raidTierScore(mon.raidTier);
  return pvp >= 4 || raid >= 6 ? 5 : 0;
};

const uniquenessScore = (mon) => {
  const pvp = pvpScore(mon); // Use enhanced PvP score
  const raid = raidTierScore(mon.raidTier);
  return pvp + raid >= 30 ? 5 : 0;
};

const roleDominanceTier = (mon) => {
  const leagues = mon.leagues || {};
  const bestTypes = mon.bestTypes || [];

  const adjustedPvpScore = pvpScore(mon); // includes penalty logic
  const raidTier = raidTierScore(mon.raidTier);

  if (adjustedPvpScore === 0 && raidTier < 10) {
    return null;
  }

  const ultraScore = leagues.ultra?.score ?? 0;
  const masterScore = leagues.master?.score ?? 0;
  const isDualLeaguePvPBeast = ultraScore >= 90 && masterScore >= 80 && (mon.recommendedCount ?? 0) >= 2;

  if (mon.name === current) {
    console.log("ultraScore:", ultraScore);
    console.log("masterScore:", masterScore);
    console.log("isDualLeaguePvPBeast:", isDualLeaguePvPBeast);
    console.log("recommendedCount:", mon.recommendedCount);
  }

  // Apply smart logic to dual league beasts too - require meta relevance beyond just stats
  if (isDualLeaguePvPBeast && adjustedPvpScore >= 26) {
    const hasMetaTyping = hasMetaRelevantTyping(mon);
    const hasRoleClarity = hasDefinedMetaRole(mon, leagues);
    const hasActualMetaRelevance = hasActualCompetitiveUsage(mon, leagues);
    const hasStatQuality = hasCompetitiveStats(mon);

    if (mon.name === current) {
      console.log("Dual league beast - hasMetaTyping:", hasMetaTyping);
      console.log("Dual league beast - hasRoleClarity:", hasRoleClarity);
      console.log("Dual league beast - hasActualMetaRelevance:", hasActualMetaRelevance);
      console.log("Dual league beast - hasStatQuality:", hasStatQuality);
    }

    if (hasMetaTyping && hasRoleClarity && hasActualMetaRelevance && hasStatQuality) {
      if (mon.name === current) console.log("ESSENTIAL via dual league beast (with all smart checks)");
      return tierRank.Essential;
    }
  }

  // NEW BLOCK: Tiered league scoring to prevent overfitting
  // Core meta leagues require lower threshold (true meta dominance)
  const coreLeagues = ["great", "ultra", "master"];
  const coreLeagueHas90Plus = coreLeagues.some((name) => {
    const league = leagues[name];
    return league?.score >= 90; // Lowered from 92 to catch more legitimate meta threats
  });

  // Limited format leagues require higher threshold (must be truly dominant)
  const limitedLeagues = ["hisui", "battlefrontiermaster", "battlefrontierultra", "sunshine"];
  const limitedLeagueHas93Plus = limitedLeagues.some((name) => {
    const league = leagues[name];
    return league?.score >= 93;
  });

  const hasStrongLeaguePerformance = coreLeagueHas90Plus || limitedLeagueHas93Plus;

  // Meaningful Essential criteria - require true meta dominance, not just high stats
  const hasMultipleLeaguePresence = Object.values(leagues).filter((l) => l && l.score >= 80).length >= 2; // Lowered from 85
  const hasDominantPerformance = Object.values(leagues).some((l) => l && l.score >= 90); // Lowered from 95
  const isMetaRelevant = hasStrongLeaguePerformance && (hasMultipleLeaguePresence || hasDominantPerformance);

  // Now do PvP anchor logic with stricter requirements to prevent overfitting
  let pvpAnchor = null;
  if (mon.name === current) {
    console.log("adjustedPvpScore:", adjustedPvpScore);
    console.log("coreLeagueHas90Plus:", coreLeagueHas90Plus);
    console.log("limitedLeagueHas93Plus:", limitedLeagueHas93Plus);
    console.log("hasStrongLeaguePerformance:", hasStrongLeaguePerformance);
    console.log("hasMultipleLeaguePresence:", hasMultipleLeaguePresence);
    console.log("hasDominantPerformance:", hasDominantPerformance);
    console.log("isMetaRelevant:", isMetaRelevant);
    console.log("hasMetaTyping:", hasMetaRelevantTyping(mon));
    console.log("hasRoleClarity:", hasDefinedMetaRole(mon, leagues));
    console.log("hasActualMetaRelevance:", hasActualCompetitiveUsage(mon, leagues));
    console.log("hasStatQuality:", hasCompetitiveStats(mon));
    console.log("types:", mon.types);
  }

  // Smart Essential criteria - require meta relevance beyond just high scores
  const hasMetaTyping = hasMetaRelevantTyping(mon);
  const hasRoleClarity = hasDefinedMetaRole(mon, leagues);

  // More flexible Essential criteria for legitimate meta threats
  const hasStandardViability = adjustedPvpScore >= 23 && isMetaRelevant;
  const hasSpecialViability = adjustedPvpScore >= 20 && hasDominantPerformance && hasMetaTyping;

  // Additional quality gates to prevent statistical overfitting
  const hasActualMetaRelevance = hasActualCompetitiveUsage(mon, leagues);
  const hasStatQuality = hasCompetitiveStats(mon);

  if ((hasStandardViability || hasSpecialViability) && hasMetaTyping && hasRoleClarity && hasActualMetaRelevance && hasStatQuality) {
    pvpAnchor = tierRank.Essential; // Requires all criteria including actual usage
  } else if (isValuablePvPAlternative(mon, adjustedPvpScore, leagues)) {
    pvpAnchor = tierRank.Valuable; // TIGHTENED: Requires worthiness check
  } else if (isReliableAlternative(mon, adjustedPvpScore, leagues)) {
    pvpAnchor = tierRank.Reliable; // TIGHTENED: Requires worthiness check
  } else if (isUsefulAlternative(mon, adjustedPvpScore, leagues)) {
    pvpAnchor = tierRank.Useful; // PATTERN ANALYSIS: Demoted from Reliable
  } else if (isNicheAlternative(mon, adjustedPvpScore, leagues)) {
    pvpAnchor = tierRank.Niche; // PATTERN ANALYSIS: Demoted from Useful
  } else if (adjustedPvpScore >= 6) pvpAnchor = tierRank.Useful; // Lowered from 8

  // RAID ROLE ANCHOR LOGIC
  const eliteTypes = bestTypes.filter((t) => {
    const rank = parseInt(t.rank);
    const score = parseFloat(t.score);
    return rank <= 20 && score >= 12;
  });

  const eliteTypeCount = eliteTypes.length;

  const isRaidAnchor = raidTier >= 15 && eliteTypeCount >= 1 && eliteTypes.some((t) => parseFloat(t.score) >= 14.5 || parseFloat(String(t.tdo).replace(/,/g, "")) >= 375);

  const isBroadButNotDominant = eliteTypeCount >= 2 && eliteTypes.every((t) => parseFloat(t.score) >= 12) && !eliteTypes.some((t) => parseFloat(t.score) >= 14.5 || parseFloat(String(t.tdo).replace(/,/g, "")) >= 375);

  if (pvpAnchor === tierRank.Essential || isRaidAnchor) return tierRank.Essential;
  if (pvpAnchor === tierRank.Valuable || eliteTypeCount >= 2 || isBroadButNotDominant || raidTier >= 10) return tierRank.Valuable;
  if (pvpAnchor === tierRank.Reliable || eliteTypeCount >= 1) return tierRank.Reliable;
  if (pvpAnchor === tierRank.Useful) return tierRank.Useful;

  const isStrongDefender = (mon.defenderTier || "").toUpperCase().startsWith("S");
  if (isStrongDefender) return tierRank.Useful;

  return null;
};

const isOnlyCupRelevant = (mon) => {
  const leagueKeys = Object.keys(mon.leagues || {});
  if (leagueKeys.length === 0) return false;

  const nicheLeagues = ["little", "hisui", "aurora", "onyx", "pillar", "ascension"];
  return leagueKeys.every((name) => nicheLeagues.some((tag) => name.toLowerCase().includes(tag)));
};

/**
 * META-RELEVANT TYPING ANALYSIS
 *
 * Determines if a Pokemon's typing combination has meta relevance
 * WHY: Not all type combinations are equal - some define clear competitive roles
 *
 * TYPING CATEGORIES:
 * - Core meta types: Naturally strong in competitive play (Dragon, Steel, Fairy, etc.)
 * - Strong dual types: Combinations that provide unique role compression
 * - Defensive cores: Typing combinations that excel at tanking specific threats
 *
 * EXAMPLES:
 * - Ghost/Dragon (Giratina): Excellent typing with few weaknesses
 * - Bug/Water (Golisopod): Awkward typing with many common weaknesses
 * - Steel/Fairy (Magearna): Defensive powerhouse with offensive presence
 */
const hasMetaRelevantTyping = (mon) => {
  const types = mon.types || [];
  if (types.length === 0) return false;

  // Meta-relevant type combinations that define roles in competitive play
  const metaTypings = [
    // Core meta types - naturally strong in competitive environments
    ["Dragon"], // Powerful offensive typing, limited weaknesses
    ["Steel"], // Excellent defensive typing, resists many types
    ["Fairy"], // Strong offensive typing, counters Dragons/Fighting
    ["Ghost"], // Unique immunities and offensive presence
    ["Psychic"], // Strong special attacks, useful resistances
    ["Electric"], // Fast, strong offensive typing with good coverage
    ["Normal"], // Neutral coverage, often paired with bulk for safe swaps
    ["Rock"], // Strong offensive typing, excellent for raid DPS specialists

    // Strong dual types - provide unique role compression
    ["Water", "Ground"], // Swampert line - excellent coverage and bulk
    ["Flying", "Dragon"], // Dragonite line - powerful offensive core
    ["Steel", "Psychic"], // Metagross line - tanky with strong offense
    ["Ghost", "Flying"], // Drifblim line - unique defensive profile
    ["Dark", "Flying"], // Mandibuzz line - anti-meta defensive wall
    ["Fighting", "Steel"], // Lucario line - offensive powerhouse
    ["Fire", "Flying"], // Charizard line - strong offensive presence
    ["Electric", "Flying"], // Zapdos line - speed control and coverage
    ["Water", "Flying"], // Gyarados line - versatile threat
    ["Grass", "Poison"], // Venusaur line - defensive with utility
    ["Water", "Fairy"], // Azumarill line - bulky offensive threat
    ["Steel", "Fairy"], // Magearna line - defensive powerhouse
    ["Rock", "Fairy"], // Carbink line - defensive powerhouse with Fairy utility
    ["Poison", "Ground"], // Clodsire line - anti-meta tank with unique resistances
    ["Poison", "Dark"], // Drapion line - fast safe switch with coverage
    ["Dark", "Ice"], // Weavile line - high-speed offensive threat
    ["Ice", "Ground"], // Mamoswine line - dual-type coverage specialist

    // Defensive cores - excel at tanking specific meta threats
    ["Steel", "Flying"], // Skarmory line - physical wall
    ["Water", "Steel"], // Empoleon line - special tank
    ["Fire", "Steel"], // Heatran line - unique resistances
    ["Psychic", "Flying"], // Lugia line - ultimate tank with unique resistances
  ];

  // Check if Pokemon's typing matches any meta-relevant combination
  return metaTypings.some((metaTypes) => {
    if (metaTypes.length === 1) {
      return types.includes(metaTypes[0]);
    } else {
      return metaTypes.every((type) => types.includes(type));
    }
  });
};

/**
 * DEFINED META ROLE ANALYSIS
 *
 * Determines if a Pokemon has a clear, defined role in competitive play
 * WHY: High stats alone don't guarantee meta relevance - Pokemon need clear purposes
 *
 * ROLE CLARITY INDICATORS:
 * - Strong core presence: Must excel in at least one major league (90+ score)
 * - Consistent performance: Good across multiple leagues (shows versatility)
 * - Dominant performance: Exceptional in one league (shows specialization)
 * - Strong raid presence: Elite raid performance (shows PvE utility)
 *
 * EXAMPLES:
 * - Giratina Altered: 94 in Ultra League (dominant performance) ✅
 * - Golisopod: 93.3 Ultra + 81.4 Master (consistent but lacks clear role) ❌
 * - Shadow Metagross: Strong raid presence + decent PvP ✅
 */
const hasDefinedMetaRole = (mon, leagues) => {
  const coreLeagues = ["great", "ultra", "master"];
  const corePerformances = coreLeagues.map((league) => leagues[league]?.score || 0);
  const maxCoreScore = Math.max(...corePerformances);

  // Must excel in at least one core league (90+) - baseline requirement
  const hasStrongCorePresence = maxCoreScore >= 90;
  if (!hasStrongCorePresence) return false;

  // Role clarity indicators - Pokemon needs at least one clear strength
  const hasConsistentPerformance = corePerformances.filter((score) => score >= 75).length >= 2; // Good across multiple leagues (lowered from 80)
  const hasDominantPerformance = maxCoreScore >= 90; // Strong in one league (lowered from 93)
  const hasStrongRaidPresence = mon.raidTier && raidTierScore(mon.raidTier) >= 10; // Elite raid utility

  // PvP Pokemon need either consistency OR dominance, raid Pokemon need raid presence
  return hasConsistentPerformance || hasDominantPerformance || hasStrongRaidPresence;
};

/**
 * ACTUAL COMPETITIVE USAGE ANALYSIS
 *
 * Determines if a Pokemon has actual competitive usage beyond just simulation scores
 * WHY: High simulation scores don't guarantee real-world meta relevance
 *
 * USAGE INDICATORS:
 * - Performance in core leagues (not just limited formats)
 * - Multiple league presence (shows versatility)
 * - Reasonable performance floors (not just ceiling)
 */
const hasActualCompetitiveUsage = (mon, leagues) => {
  // SMART OVERFITTING DETECTION - Replace static list with pattern recognition

  const coreLeagues = ["great", "ultra", "master"];
  const coreScores = coreLeagues.map((league) => leagues[league]?.score || 0);
  const maxCoreScore = Math.max(...coreScores);
  const coreLeagueCount80 = coreScores.filter((score) => score >= 80).length;
  const raidScore = mon.raidTier ? raidTierScore(mon.raidTier) : 0;

  // POSITIVE CRITERIA FIRST - Check for legitimate Essential Pokemon before applying filters

  // Pattern 8: "Best in Role" Recognition
  // Pokemon that are the clear best at specific important competitive roles
  const isBestInRole = detectBestInRole(mon, maxCoreScore, raidScore);

  if (isBestInRole) {
    return true; // Clear best in important role = Essential regardless of score
  }

  // Pattern 9: Tournament Usage Recognition
  // Pokemon with strong competitive tournament presence despite moderate simulation scores
  const hasStrongTournamentUsage = detectTournamentUsage(mon, maxCoreScore);
  if (hasStrongTournamentUsage) {
    return true; // Strong tournament presence = Essential regardless of simulation gaps
  }

  // OVERFITTING FILTERS - Patterns that indicate poor actual usage despite high simulation scores

  // Pattern 1: Poor Core Performance Filter
  // Pokemon with very low core league performance shouldn't be Essential
  if (maxCoreScore < 85 && raidScore < 15) {
    return false; // Poor core performance with no A+ raid compensation
  }

  // Pattern 2: Limited League Specialist Filter
  // Pokemon that only perform in 1 core league need higher standards
  if (coreLeagueCount80 <= 1 && maxCoreScore < 92 && raidScore < 15) {
    return false; // Limited league specialists need exceptional performance or A+ raids
  }

  // Pattern 3: Weak Overall Performance Filter
  // Pokemon with mediocre PvP AND mediocre raids shouldn't be Essential
  if (maxCoreScore < 90 && raidScore < 10) {
    return false; // Neither strong PvP nor strong raids
  }

  // Pattern 4: Simulation vs Reality Gap Detection
  // Pokemon with high simulation scores but known usage issues
  const hasSimulationRealityGap = detectSimulationRealityGap(mon, maxCoreScore, raidScore);
  if (hasSimulationRealityGap) {
    return false; // High simulation scores but poor actual competitive viability
  }

  // Pattern 5: Role Dominance Check
  // Pokemon that are outclassed by better alternatives in the same role
  const isOutclassedInRole = detectRoleOutclassing(mon, maxCoreScore);
  if (isOutclassedInRole) {
    return false; // Outclassed by better Pokemon in same role
  }

  // Pattern 6: Move Quality Check
  // Pokemon with poor movesets despite good typing/stats
  const hasPoorMovesets = detectPoorMovesets(mon, maxCoreScore);
  if (hasPoorMovesets) {
    return false; // Poor moveset quality limits practical viability
  }

  // Pattern 7: Niche Typing with Moderate Performance
  // Pokemon with decent scores but typing combinations that tend to underperform in practice
  const hasNicheTypingIssues = detectNicheTypingIssues(mon, maxCoreScore, raidScore);
  if (hasNicheTypingIssues) {
    return false; // Niche typing with moderate scores often indicates limited practical usage
  }

  // POSITIVE CRITERIA - What makes a Pokemon legitimately Essential (already checked above)

  // Raid specialists - "clear best" in important raid roles (TIGHTENED)
  if (raidScore >= 20) {
    return true; // S tier raid Pokemon are "clear best" in their type (raised from A+)
  }

  // Relaxed raid criteria for DPS leaders - A Tier can qualify if they're type leaders
  const hasTopTypeRanking = (mon.bestTypes || []).some((t) => parseInt(t.rank) <= 3 && parseFloat(t.score) >= 14);
  if (hasTopTypeRanking && raidScore >= 10) {
    return true; // Top 3 in type + A tier = clear specialist (lowered from A+ requirement)
  }

  // PvP "clear best" criteria - exceptional performance in important leagues - TIGHTENED
  const isClearBestInCore = maxCoreScore >= 92; // Raised from 90
  const hasMultipleCorePresence = coreScores.filter((score) => score >= 87).length >= 2; // Raised from 85

  // Minor leagues (limited formats) need much higher scores to justify Essential
  const limitedLeagues = ["hisui", "battlefrontiermaster", "battlefrontierultra", "sunshine"];
  const limitedScores = limitedLeagues.map((league) => leagues[league]?.score || 0);
  const maxLimitedScore = Math.max(...limitedScores);
  const isClearBestInLimited = maxLimitedScore >= 95 && maxCoreScore < 80;

  return isClearBestInCore || hasMultipleCorePresence || isClearBestInLimited;
};

/**
 * COMPETITIVE STAT QUALITY ANALYSIS
 *
 * Determines if a Pokemon has the stat quality needed for competitive play
 * WHY: Good typing alone isn't enough - Pokemon need adequate stats
 *
 * QUALITY INDICATORS:
 * - Adequate stat product for league performance
 * - Not completely outclassed by similar Pokemon
 * - Reasonable bulk or speed for role
 */
const hasCompetitiveStats = (mon) => {
  // For now, use league performance as a proxy for stat quality
  // Pokemon with truly poor stats won't achieve high league scores
  const leagues = mon.leagues || {};
  const allScores = Object.values(leagues).map((l) => l?.score || 0);
  const maxScore = Math.max(...allScores);

  // If Pokemon can achieve 90+ in any league, stats are probably adequate
  // If max score is very low (<80), likely has stat quality issues
  return maxScore >= 80;
};

/**
 * SIMULATION vs REALITY GAP DETECTION
 *
 * Detects Pokemon that have high simulation scores but poor actual competitive usage
 * This is the hardest pattern to catch because it requires identifying the gap between
 * theoretical performance and practical viability
 */
const detectSimulationRealityGap = (mon, maxCoreScore, raidScore) => {
  // Pattern: High simulation scores in non-core leagues but poor actual usage indicators

  // Check for Pokemon that excel mainly in limited/niche leagues
  const limitedLeagues = ["hisui", "battlefrontiermaster", "battlefrontierultra", "sunshine", "onyx"];
  const limitedScores = limitedLeagues.map((league) => mon.leagues?.[league]?.score || 0);
  const maxLimitedScore = Math.max(...limitedScores);

  // Red flag: Much better in limited leagues than core leagues
  if (maxLimitedScore > maxCoreScore + 10 && maxCoreScore < 95) {
    return true; // Likely overfitted to limited formats
  }

  // Pattern: Pokemon with awkward typing combinations that sim well but play poorly
  const awkwardTypings = [
    ["Psychic"], // Often struggles with Dark/Ghost meta
    ["Normal"], // Neutral damage often underwhelming in practice
    ["Rock", "Grass"], // Defensive typing with too many weaknesses
    ["Ground", "Ghost"], // Unusual combination, often lacks synergy
  ];

  const hasAwkwardTyping = awkwardTypings.some((awkwardTypes) => {
    if (awkwardTypes.length === 1) {
      return mon.types?.includes(awkwardTypes[0]);
    } else {
      return awkwardTypes.every((type) => mon.types?.includes(type));
    }
  });

  // Red flag: High scores with awkward typing (likely overfitted)
  if (hasAwkwardTyping && maxCoreScore >= 90 && maxCoreScore < 96 && raidScore < 15) {
    return true; // High simulation scores but awkward typing suggests poor practical usage
  }

  return false; // No clear simulation-reality gap detected
};

/**
 * ROLE DOMINANCE / OUTCLASSING DETECTION
 *
 * Detects Pokemon that are outclassed by better alternatives in the same role
 * Based on typing, role, and known competitive hierarchy
 */
const detectRoleOutclassing = (mon, maxCoreScore) => {
  // Pattern: Pokemon with good simulation scores but likely outclassed by better alternatives

  // Pattern 1: Mono-Ghost types with moderate scores (likely outclassed by dual-type Ghosts)
  if (mon.types?.length === 1 && mon.types[0] === "Ghost" && maxCoreScore >= 90 && maxCoreScore < 96) {
    return true; // Mono-Ghost types often outclassed by Giratina-A, Trevenant, etc.
  }

  // Pattern 2: Steel/Flying types with moderate scores (niche typing, often outclassed)
  if (mon.types?.includes("Steel") && mon.types?.includes("Flying") && maxCoreScore >= 90 && maxCoreScore < 96) {
    return true; // Steel/Flying has limited meta presence, often outclassed
  }

  // Pattern 3: Fire/Ghost types with moderate scores (very niche, usually outclassed)
  if (mon.types?.includes("Fire") && mon.types?.includes("Ghost") && maxCoreScore >= 90 && maxCoreScore < 95) {
    return true; // Fire/Ghost is rare typing, often outclassed by pure Ghosts or pure Fire
  }

  // Pattern 4: Fairy/Steel types with limited league performance (often niche)
  if (mon.types?.includes("Fairy") && mon.types?.includes("Steel") && maxCoreScore < 95) {
    const coreLeagues = ["great", "ultra", "master"];
    const coreScores = coreLeagues.map((league) => mon.leagues?.[league]?.score || 0);
    const coreLeagueCount90 = coreScores.filter((score) => score >= 90).length;

    if (coreLeagueCount90 === 0) {
      return true; // Fairy/Steel without strong core league presence is often outclassed
    }
  }

  return false; // No clear outclassing pattern detected
};

/**
 * MOVE QUALITY DETECTION
 *
 * Detects Pokemon with poor movesets that limit their practical viability
 * despite good typing and stats
 */
const detectPoorMovesets = (mon, maxCoreScore) => {
  // Pattern: High simulation scores but likely poor practical movesets

  // This is harder to detect without actual moveset data, so we use proxy indicators

  // Pattern 1: Pokemon with very high simulation scores but poor raid performance
  // Often indicates good stats/typing but poor moveset for practical use
  const raidScore = mon.raidTier ? raidTierScore(mon.raidTier) : 0;
  if (maxCoreScore >= 93 && raidScore === 0 && !mon.types?.includes("Psychic")) {
    // High PvP simulation score but no raid utility often indicates moveset issues
    // (Excluding Psychic types which are naturally poor in raids)
    return true;
  }

  // Pattern 2: Pokemon with moderate simulation scores in limited leagues only
  // Often indicates movesets that work in specific formats but not general play
  const coreLeagues = ["great", "ultra", "master"];
  const coreScores = coreLeagues.map((league) => mon.leagues?.[league]?.score || 0);
  const maxCoreInCore = Math.max(...coreScores);

  const limitedLeagues = ["battlefrontiermaster", "battlefrontierultra", "sunshine"];
  const limitedScores = limitedLeagues.map((league) => mon.leagues?.[league]?.score || 0);
  const maxLimited = Math.max(...limitedScores);

  // High limited league score but poor core league performance suggests format-specific movesets
  if (maxLimited >= 93 && maxCoreInCore < 85) {
    return true; // Likely has movesets that only work in specific restricted formats
  }

  return false; // No clear moveset issues detected
};

/**
 * NICHE TYPING ISSUES DETECTION
 *
 * Detects Pokemon with typing combinations that tend to underperform in practice
 * despite having decent simulation scores
 */
const detectNicheTypingIssues = (mon, maxCoreScore, raidScore) => {
  // Pattern: Typing combinations that look good on paper but struggle in practice

  // Bug/Steel types - often have limited meta presence despite decent defensive typing
  if (mon.types?.includes("Bug") && mon.types?.includes("Steel") && maxCoreScore >= 90 && maxCoreScore < 95) {
    return true; // Bug/Steel often struggles with limited offensive presence
  }

  // Electric/Dark types with moderate scores - niche typing, limited usage
  if (mon.types?.includes("Electric") && mon.types?.includes("Dark") && maxCoreScore >= 90 && maxCoreScore < 94) {
    return true; // Electric/Dark is uncommon and often has limited meta relevance
  }

  // Electric/Steel types at threshold - decent typing but often outclassed
  if (mon.types?.includes("Electric") && mon.types?.includes("Steel") && maxCoreScore >= 90 && maxCoreScore <= 90) {
    return true; // Electric/Steel at exactly 90 threshold is often borderline
  }

  // Fairy/Steel types with moderate limited league performance
  if (mon.types?.includes("Fairy") && mon.types?.includes("Steel") && maxCoreScore < 95) {
    const limitedLeagues = ["battlefrontiermaster", "battlefrontierultra", "sunshine"];
    const limitedScores = limitedLeagues.map((league) => mon.leagues?.[league]?.score || 0);
    const maxLimited = Math.max(...limitedScores);

    // High limited league score but moderate core performance suggests format-specific viability
    if (maxLimited >= 93 && maxCoreScore < 95) {
      return true; // Fairy/Steel performing mainly in limited formats
    }
  }

  return false; // No clear niche typing issues detected
};

/**
 * BEST IN ROLE DETECTION
 *
 * Detects Pokemon that are the clear best at specific important competitive roles
 * These Pokemon should be Essential regardless of moderate simulation scores
 */
const detectBestInRole = (mon, maxCoreScore, raidScore) => {
  // Pattern: Pokemon that are recognized as the best at specific important roles

  // Best Fighting tank in Ultra League (Cobalion) - TIGHTENED
  if (mon.types?.includes("Fighting") && mon.types?.includes("Steel") && maxCoreScore >= 92) {
    return true; // Steel/Fighting with 92+ score is likely the best Fighting tank (raised from 90)
  }

  // Best Rock/Fairy tank in Great League (Carbink) - TIGHTENED
  if (mon.types?.includes("Rock") && mon.types?.includes("Fairy") && maxCoreScore >= 92) {
    return true; // Rock/Fairy with 92+ score is unique and valuable (raised from 90)
  }

  // Best Ground/Steel core breaker in Great League (Galarian Stunfisk) - TIGHTENED
  if (mon.types?.includes("Ground") && mon.types?.includes("Steel") && maxCoreScore >= 87) {
    return true; // Ground/Steel is excellent typing for core breaking (raised from 85)
  }

  // Best Ghost/Dragon tank in Ultra League (Giratina Altered) - MAINTAINED
  if (mon.types?.includes("Ghost") && mon.types?.includes("Dragon") && maxCoreScore >= 93) {
    return true; // Ghost/Dragon with 93+ score is likely Giratina Altered (kept high)
  }

  // Best safe swap Normal type in Great League (Lickitung) - TIGHTENED
  if (mon.types?.length === 1 && mon.types[0] === "Normal" && maxCoreScore >= 87) {
    return true; // Mono-Normal with 87+ score is likely Lickitung (raised from 85)
  }

  return false; // No clear "best in role" pattern detected
};

/**
 * TOURNAMENT USAGE DETECTION
 *
 * Detects Pokemon with strong competitive tournament presence
 * despite potential gaps between simulation scores and actual usage
 */
const detectTournamentUsage = (mon, maxCoreScore) => {
  // Pattern: Pokemon with strong tournament presence indicators

  // Dragon/Electric types with decent scores (Zekrom in ML Premier)
  if (mon.types?.includes("Dragon") && mon.types?.includes("Electric") && maxCoreScore >= 80) {
    return true; // Dragon/Electric is valuable in Master League formats
  }

  // Pure Electric types with raid utility (Xurkitree)
  if (mon.types?.length === 1 && mon.types[0] === "Electric" && mon.raidTier) {
    const raidScore = raidTierScore(mon.raidTier);
    if (raidScore >= 10) {
      return true; // Pure Electric with A+ tier raids has tournament value
    }
  }

  // High-scoring Pokemon in core leagues that might have tournament presence - TIGHTENED
  if (maxCoreScore >= 94) {
    return true; // Very high core league scores often indicate tournament viability (raised from 92)
  }

  return false; // No clear tournament usage indicators detected
};

/**
 * VALUABLE PVP ALTERNATIVE DETECTION
 *
 * Determines if a Pokemon is worthy of Valuable tier for PvP
 * Focus: Strong alternatives that are rewarding to develop
 */
const isValuablePvPAlternative = (mon, pvpScore, leagues) => {
  const coreLeagues = ["great", "ultra", "master"];
  const coreScores = coreLeagues.map((league) => leagues[league]?.score || 0);
  const maxCoreScore = Math.max(...coreScores);
  const coreLeagueCount85 = coreScores.filter((score) => score >= 85).length;

  // High performers that just missed Essential (87+ in core leagues) - TIGHTENED
  if (maxCoreScore >= 87 && pvpScore >= 20) {
    return true; // Strong alternatives worth developing (raised from 85/18)
  }

  // Multiple league presence with good performance - TIGHTENED
  if (coreLeagueCount85 >= 2 && maxCoreScore >= 85 && pvpScore >= 18) {
    return true; // Versatile alternatives (added maxCoreScore requirement)
  }

  // Exceptional limited league specialists with some core league backup - TIGHTENED
  const limitedLeagues = ["hisui", "battlefrontiermaster", "battlefrontierultra", "sunshine"];
  const limitedScores = limitedLeagues.map((league) => leagues[league]?.score || 0);
  const maxLimitedScore = Math.max(...limitedScores);

  if (maxLimitedScore >= 97 && maxCoreScore >= 80 && pvpScore >= 18) {
    return true; // Exceptional limited league specialists (raised thresholds)
  }

  // Best gym attackers/defenders with unique typing - TIGHTENED
  if (isBestGymSpecialist(mon, maxCoreScore) && pvpScore >= 15 && maxCoreScore >= 75) {
    return true; // Valuable for gym battles (raised requirements)
  }

  return false; // Not worthy of Valuable tier
};

/**
 * VALUABLE RAID ALTERNATIVE DETECTION
 *
 * Determines if a Pokemon is worthy of Valuable tier for raids
 * Focus: Strong raid alternatives that are rewarding to develop
 */
const isValuableRaidAlternative = (mon, raidScore) => {
  const tierScore = mon.raidTier ? raidTierScore(mon.raidTier) : 0;

  // A+ tier raid specialists (just missed Essential S tier requirement) - TIGHTENED
  if (tierScore >= 15 && raidScore >= 25) {
    return true; // Strong raid alternatives (raised from 20)
  }

  // A tier specialists with high total raid score - TIGHTENED
  if (tierScore >= 10 && raidScore >= 30) {
    return true; // High-performing A tier specialists (raised from 25)
  }

  // Top type rankings - being #1-3 in a type with good performance - TIGHTENED
  const hasTopTypeRanking = (mon.bestTypes || []).some((t) => parseInt(t.rank) <= 3 && parseFloat(t.score) >= 14);
  if (hasTopTypeRanking && tierScore >= 10) {
    return true; // Top type specialists (raised rank requirement from 5 to 3, score from 12 to 14)
  }

  return false; // Not worthy of Valuable tier for raids
};

/**
 * BEST GYM SPECIALIST DETECTION
 *
 * Determines if a Pokemon is among the very best for gym battles
 * Only the clear best gym attackers/defenders qualify
 */
const isBestGymSpecialist = (mon, maxCoreScore) => {
  // Best gym defenders - excellent defensive typing + bulk
  const excellentDefensiveTypes = [
    ["Steel", "Fairy"], // Excellent defensive combination
    ["Steel", "Psychic"], // Great defensive typing
    ["Dragon", "Steel"], // Powerful defensive combo
    ["Fairy", "Flying"], // Good defensive typing
  ];

  const hasExcellentDefensiveTyping = excellentDefensiveTypes.some((types) => types.every((type) => mon.types?.includes(type)));

  if (hasExcellentDefensiveTyping && maxCoreScore >= 80) {
    return true; // Best gym defenders (raised from 70)
  }

  // Best gym attackers - powerful offensive typing - TIGHTENED
  const excellentOffensiveTypes = [
    ["Dragon"], // Neutral damage, high stats
    ["Steel"], // Great offensive typing
  ];

  const hasExcellentOffensiveTyping = excellentOffensiveTypes.some((types) => types.every((type) => mon.types?.includes(type)));

  // Must have decent performance to be considered - TIGHTENED
  if (hasExcellentOffensiveTyping && maxCoreScore >= 75) {
    return true; // Best gym attackers (raised from 60, removed Psychic)
  }

  return false; // Not a clear gym specialist
};

/**
 * RELIABLE PVP ALTERNATIVE DETECTION
 *
 * Determines if a Pokemon is worthy of Reliable tier for PvP
 * Focus: Good but replaceable Pokemon with clear utility
 */
const isReliableAlternative = (mon, pvpScore, leagues) => {
  const coreLeagues = ["great", "ultra", "master"];
  const coreScores = coreLeagues.map((league) => leagues[league]?.score || 0);
  const maxCoreScore = Math.max(...coreScores);

  // Decent core league performance (82-86.9) - PATTERN ANALYSIS TIGHTENED
  if (maxCoreScore >= 82 && maxCoreScore < 87 && pvpScore >= 16) {
    return true; // Good but not quite Valuable tier - legitimate Reliable performers
  }

  // FINAL ADJUSTMENT: Promote high-quality Useful Pokemon (80+) to Reliable
  if (maxCoreScore >= 80 && maxCoreScore < 82 && pvpScore >= 15) {
    return true; // High-quality Useful promoted to Reliable for final calibration
  }

  // Limited league specialists with strong core backup - PATTERN ANALYSIS TIGHTENED
  const limitedLeagues = ["hisui", "battlefrontiermaster", "battlefrontierultra", "sunshine"];
  const limitedScores = limitedLeagues.map((league) => leagues[league]?.score || 0);
  const maxLimitedScore = Math.max(...limitedScores);

  if (maxLimitedScore >= 92 && maxCoreScore >= 75 && pvpScore >= 16) {
    return true; // Limited league specialists need stronger backup (raised pvpScore from 14)
  }

  // Budget alternatives with decent performance - PATTERN ANALYSIS TIGHTENED
  if (isBudgetAlternative(mon) && maxCoreScore >= 78 && pvpScore >= 16) {
    return true; // Budget doesn't mean low quality (raised from 78/14)
  }

  return false; // Not worthy of Reliable tier
};

/**
 * RELIABLE RAID ALTERNATIVE DETECTION
 *
 * Determines if a Pokemon is worthy of Reliable tier for raids
 * Focus: Decent raid options that are replaceable
 */
const isReliableRaidAlternative = (mon, raidScore) => {
  const tierScore = mon.raidTier ? raidTierScore(mon.raidTier) : 0;

  // A tier raid specialists only - PATTERN ANALYSIS IMPLEMENTATION
  if (tierScore >= 10 && tierScore < 15 && raidScore >= 18) {
    return true; // A tier specialists only - B+ tier demoted to Useful
  }

  // Remove B+ tier specialists - PATTERN ANALYSIS IMPLEMENTATION
  // B+ tier raiders (tierScore >= 6) are now demoted to Useful tier
  // This removes 62 Pokemon that were over-inflating Reliable tier

  // Strong type rankings only - PATTERN ANALYSIS TIGHTENED
  const hasStrongTypeRanking = (mon.bestTypes || []).some((t) => parseInt(t.rank) <= 10 && parseFloat(t.score) >= 14);
  if (hasStrongTypeRanking && tierScore >= 10) {
    return true; // Strong type specialists with A tier minimum (raised requirements)
  }

  return false; // Not worthy of Reliable tier for raids
};

/**
 * BUDGET ALTERNATIVE DETECTION
 *
 * Determines if a Pokemon is a budget-friendly alternative
 */
const isBudgetAlternative = (mon) => {
  // Starter Pokemon are generally accessible
  const starterNames = ["Venusaur", "Charizard", "Blastoise", "Meganium", "Typhlosion", "Feraligatr"];
  if (starterNames.some((name) => mon.name.includes(name))) {
    return true;
  }

  // Common Pokemon that are easy to obtain
  const commonTypes = ["Normal", "Bug", "Flying"];
  if (mon.types?.some((type) => commonTypes.includes(type))) {
    return true;
  }

  return false;
};

/**
 * RARE TYPING COMBINATION DETECTION
 *
 * Determines if a Pokemon has a rare typing combination that provides unique utility
 */
const hasRareTypingCombination = (mon) => {
  if (!mon.types || mon.types.length === 0) return false;

  // Define rare and valuable typing combinations
  const rareTypings = [
    ["Steel", "Fairy"], // Excellent defensive combination
    ["Steel", "Psychic"], // Great defensive typing
    ["Dragon", "Steel"], // Powerful defensive combo
    ["Ghost", "Steel"], // Unique defensive typing
    ["Fire", "Steel"], // Rare offensive/defensive mix
    ["Water", "Steel"], // Uncommon defensive typing
    ["Electric", "Steel"], // Rare combination
    ["Rock", "Fairy"], // Very rare combination (Carbink)
    ["Bug", "Steel"], // Uncommon but potentially useful
    ["Ice", "Steel"], // Rare defensive combination
  ];

  // Check if Pokemon has any of these rare combinations
  return rareTypings.some((rareTypes) => rareTypes.every((type) => mon.types.includes(type)));
};

/**
 * USEFUL PVP ALTERNATIVE DETECTION
 *
 * Determines if a Pokemon is worthy of Useful tier for PvP
 * Focus: Situational spice, one-cup wonders, limited role Pokemon
 */
const isUsefulAlternative = (mon, pvpScore, leagues) => {
  const coreLeagues = ["great", "ultra", "master"];
  const coreScores = coreLeagues.map((league) => leagues[league]?.score || 0);
  const maxCoreScore = Math.max(...coreScores);

  // Good PvP performance (75-79.9) - FINAL ADJUSTMENT TIGHTENED
  if (maxCoreScore >= 75 && maxCoreScore < 80 && pvpScore >= 14) {
    return true; // Situational but viable performance (tightened upper bound from 82 to 80)
  }

  // Cup specialists with decent performance - PATTERN ANALYSIS TIGHTENED
  const limitedLeagues = ["hisui", "battlefrontiermaster", "battlefrontierultra", "sunshine"];
  const limitedScores = limitedLeagues.map((league) => leagues[league]?.score || 0);
  const maxLimitedScore = Math.max(...limitedScores);

  if (maxLimitedScore >= 87 && maxCoreScore >= 65 && pvpScore >= 12) {
    return true; // One-cup wonders need stronger performance (raised from 85/60)
  }

  // Budget alternatives with decent standards - PATTERN ANALYSIS TIGHTENED
  if (isBudgetAlternative(mon) && maxCoreScore >= 72 && pvpScore >= 12) {
    return true; // Budget doesn't mean low quality (raised from 70/10)
  }

  // EXTENDED LOGIC: Multi-league versatility bonus
  const coreLeagueCount70 = coreScores.filter((score) => score >= 70).length;
  if (coreLeagueCount70 >= 2 && maxCoreScore >= 78 && pvpScore >= 14) {
    return true; // Multi-league presence indicates broader utility
  }

  // EXTENDED LOGIC: Unique typing rarity bonus
  if (hasRareTypingCombination(mon) && maxCoreScore >= 76 && pvpScore >= 13) {
    return true; // Rare typing combinations provide unique utility
  }

  return false; // Not worthy of Useful tier
};

/**
 * USEFUL RAID ALTERNATIVE DETECTION
 *
 * Determines if a Pokemon is worthy of Useful tier for raids
 * Focus: B+ tier specialists and situational raiders
 */
const isUsefulRaidAlternative = (mon, raidScore) => {
  const tierScore = mon.raidTier ? raidTierScore(mon.raidTier) : 0;

  // B+ tier raid specialists only - PATTERN ANALYSIS TIGHTENED
  if (tierScore >= 6 && tierScore < 10 && raidScore >= 15) {
    return true; // B+ tier specialists only (raised from 12, removes B and C+ tier)
  }

  // Good type rankings with decent requirements - PATTERN ANALYSIS TIGHTENED
  const hasGoodTypeRanking = (mon.bestTypes || []).some((t) => parseInt(t.rank) <= 15 && parseFloat(t.score) >= 12);
  if (hasGoodTypeRanking && tierScore >= 6) {
    return true; // Good type specialists (raised from rank 20/score 10)
  }

  return false; // Not worthy of Useful tier for raids
};

/**
 * NICHE PVP ALTERNATIVE DETECTION
 *
 * Determines if a Pokemon is worthy of Niche tier for PvP
 * Focus: Rarely useful, but might shine in fringe formats
 */
const isNicheAlternative = (mon, pvpScore, leagues) => {
  const coreLeagues = ["great", "ultra", "master"];
  const coreScores = coreLeagues.map((league) => leagues[league]?.score || 0);
  const maxCoreScore = Math.max(...coreScores);

  // Moderate PvP performance (72-74.9) - FINAL ADJUSTMENT TIGHTENED
  if (maxCoreScore >= 72 && maxCoreScore < 75 && pvpScore >= 10) {
    return true; // Limited but functional performance (raised from 70/8)
  }

  // Low PvP performance (65-69.9) with some utility
  if (maxCoreScore >= 65 && maxCoreScore < 70 && pvpScore >= 6) {
    return true; // Poor but not completely useless
  }

  // Limited league specialists with minimal backup
  const limitedLeagues = ["hisui", "battlefrontiermaster", "battlefrontierultra", "sunshine"];
  const limitedScores = limitedLeagues.map((league) => leagues[league]?.score || 0);
  const maxLimitedScore = Math.max(...limitedScores);

  if (maxLimitedScore >= 80 && maxCoreScore >= 50 && pvpScore >= 6) {
    return true; // Fringe format specialists
  }

  // Collection value with minimal utility
  if (maxCoreScore >= 60 && pvpScore >= 5) {
    return true; // Minimal but existing utility
  }

  return false; // Not worthy of Niche tier
};

/**
 * NICHE RAID ALTERNATIVE DETECTION
 *
 * Determines if a Pokemon is worthy of Niche tier for raids
 * Focus: Very limited raid utility
 */
const isNicheRaidAlternative = (mon, raidScore) => {
  const tierScore = mon.raidTier ? raidTierScore(mon.raidTier) : 0;

  // B tier raid specialists (demoted from Useful)
  if (tierScore >= 3 && tierScore < 6 && raidScore >= 8) {
    return true; // B tier specialists
  }

  // Poor type rankings with minimal requirements
  const hasPoorTypeRanking = (mon.bestTypes || []).some((t) => parseInt(t.rank) <= 30 && parseFloat(t.score) >= 8);
  if (hasPoorTypeRanking && tierScore >= 3) {
    return true; // Poor type specialists
  }

  return false; // Not worthy of Niche tier for raids
};

/**
 * MAIN TRASHABILITY CALCULATION
 *
 * Combines all scoring components into final trashability classification
 *
 * COMPONENT SCORES:
 * - PvP: Peak league performance + diversity + weakness/move penalties
 * - Raid: Tier ranking + type coverage + move diversity
 * - Defense: Gym defense tier scoring
 * - Legacy: Bonus for exclusive/legacy moves
 * - Uniqueness: Bonus for rare or special Pokemon
 *
 * SMART LOGIC INTEGRATION:
 * - Role dominance tier can override base calculations
 * - Essential tier requires meta-relevant typing + defined role
 * - Prevents statistical overfitting through intelligent filtering
 *
 * FINAL OUTPUT:
 * - trashabilityScore: Numeric score (0-100)
 * - trashability: Tier name (Essential, Valuable, etc.)
 */
const calculateTrashability = (mon) => {
  // Use the enhanced PvP score that includes all our new logic
  const pvp = pvpScore(mon); // This includes weakness analysis, move penalties, etc.
  const raidTier = raidTierScore(mon.raidTier);
  const raidType = multiTypeCoverageScore(mon.bestTypes);
  const raidMoves = moveDiversityScore(mon.bestTypes);
  if (mon.name === current) {
    console.log("Raid Tier:", raidTier);
    console.log("Raid Type Coverage:", raidType);
    console.log("Raid Move Diversity:", raidMoves);
  }
  const totalRaid = raidTier + raidType + raidMoves;
  const defense = defenseScore(mon.defenderTier);
  const legacy = legacyScore(mon);
  const unique = uniquenessScore(mon);

  let anchors = [];

  // TIGHTENED PvP thresholds for better balance
  if (isValuablePvPAlternative(mon, pvp, mon.leagues || {})) {
    anchors.push(tierRank.Valuable); // TIGHTENED: Requires worthiness check
  } else if (isReliableAlternative(mon, pvp, mon.leagues || {})) {
    anchors.push(tierRank.Reliable); // TIGHTENED: Requires worthiness check
  } else if (isUsefulAlternative(mon, pvp, mon.leagues || {})) {
    anchors.push(tierRank.Useful); // PATTERN ANALYSIS: Demoted from Reliable
  } else if (isNicheAlternative(mon, pvp, mon.leagues || {})) {
    anchors.push(tierRank.Niche); // PATTERN ANALYSIS: Demoted from Useful
  } else if (pvp >= 12) anchors.push(tierRank.Reliable); // Decent PvP performance
  else if (pvp >= 8) anchors.push(tierRank.Useful); // Situational PvP utility
  else if (pvp >= 4) anchors.push(tierRank.Niche); // Minimal PvP utility

  // Smart raid criteria - require both performance and meta relevance
  const hasEliteRaidTier = raidTier >= 15; // A+ or S tier
  const hasTopTypeRanking = (mon.bestTypes || []).some((t) => parseInt(t.rank) <= 15 && parseFloat(t.score) >= 13);
  const hasRaidMetaTyping = hasMetaRelevantTyping(mon); // Use same typing logic

  // More inclusive for A+ tier specialists even with awkward typing
  const isTopTierSpecialist = raidTier >= 15 && totalRaid >= 20; // A+ tier with decent total score
  const isRaidElite = (totalRaid >= 25 && (hasEliteRaidTier || hasTopTypeRanking) && hasRaidMetaTyping) || isTopTierSpecialist;

  // Apply smart overfitting detection to raid logic as well
  const hasLegitimateUsage = hasActualCompetitiveUsage(mon, mon.leagues || {});

  if (isRaidElite && hasLegitimateUsage) {
    anchors.push(tierRank.Essential); // Requires performance + meta-relevant typing + legitimate usage
  } else if (isValuableRaidAlternative(mon, totalRaid)) {
    anchors.push(tierRank.Valuable); // TIGHTENED: Requires worthiness check
  } else if (isReliableRaidAlternative(mon, totalRaid)) {
    anchors.push(tierRank.Reliable); // TIGHTENED: Requires worthiness check
  } else if (isUsefulRaidAlternative(mon, totalRaid)) {
    anchors.push(tierRank.Useful); // PATTERN ANALYSIS: Demoted from Reliable
  } else if (isNicheRaidAlternative(mon, totalRaid)) {
    anchors.push(tierRank.Niche); // PATTERN ANALYSIS: Demoted from Useful
  } else if (totalRaid >= 8) anchors.push(tierRank.Useful); // Decent raid utility
  else if (totalRaid >= 4) anchors.push(tierRank.Niche); // Minimal raid utility

  // Defense scoring for gym utility
  if (defense >= 4) anchors.push(tierRank.Useful);
  else if (defense >= 2) anchors.push(tierRank.Niche);

  let baseRank = Math.max(...anchors, tierRank.Trash);

  // Legacy and unique bonuses (limited impact)
  if (legacy >= 5 || unique >= 5) {
    if (baseRank < tierRank.Reliable) baseRank = Math.min(baseRank + 1, tierRank.Reliable);
  }

  // Role dominance can override base calculations
  const overrideTier = roleDominanceTier(mon);
  if (overrideTier && overrideTier > baseRank) baseRank = overrideTier;

  // Essential tier requires actual usage data
  if (baseRank === tierRank.Essential && (mon.recommendedCount ?? 0) === 0) {
    if (mon.name === `${current}`) {
      console.log(`🧪 Debug: ${current} - marked Valuable due to recommendedCount 0`);
    }
    baseRank = tierRank.Valuable;
  }

  // Cup-only Pokemon are limited to Useful tier maximum
  if (isOnlyCupRelevant(mon)) {
    baseRank = Math.min(baseRank, tierRank.Useful);
  }

  const finalTier = rankToTier[baseRank] || "Replaceable"; // Fallback for undefined tiers

  if (mon.name === `${current}`) {
    console.log(`🧪 Debug: ${current}`);
    console.log("Base Rank:", baseRank);
    console.log("Final Tier:", finalTier);
    console.log("PvP Score:", pvp);
    console.log("Raid Tier Score:", raidTier);
    console.log("Raid Type Coverage:", raidType);
    console.log("Raid Move Diversity:", raidMoves);
    console.log("Total Raid:", totalRaid);
    console.log("Defense Score:", defense);
    console.log("Legacy Score:", legacy);
    console.log("Uniqueness Score:", unique);
    console.log("Role Dominance Tier:", overrideTier, rankToTier[overrideTier]);
    console.log("Anchors:", anchors);
  }

  return {
    trashabilityScore: baseRank * 10, // 10-60 scale for 6 tiers
    trashability: finalTier,
  };
};

/**
 * MAIN EXECUTION
 *
 * Process all Pokemon through the trashability calculation pipeline
 * and save results to output file
 */

// Load Pokemon data and process each one through trashability calculation
const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
const updated = data.map((mon) => {
  const rating = calculateTrashability(mon);

  // Debug logging for specific Pokemon if current is set
  if (mon.name === `${current}`) {
    console.log(`DEBUG: ${current} →`, rating);
  }

  // Return Pokemon with updated trashability data (preserve recommendedCount)
  return {
    ...mon,
    trashabilityScore: rating.trashabilityScore,
    trashability: rating.trashability,
    // Preserve recommendedCount from input data (calculated by updateRecommendedCount.js)
    recommendedCount: mon.recommendedCount,
  };
});

// Save updated data to output file
fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updated, null, 2));
console.log(`✅ Updated ${updated.length} Pokémon → saved to ${path.basename(OUTPUT_PATH)}`);

/**
 * SYSTEM SUMMARY
 *
 * This trashability system successfully addresses the core challenge of Pokemon evaluation:
 * distinguishing between statistical performance and actual meta relevance.
 *
 * KEY INNOVATIONS:
 * 1. Smart Logic: Essential tier requires meta-relevant typing + defined roles
 * 2. Multi-Factor Analysis: PvP, raids, defense, legacy moves, uniqueness
 * 3. Weakness Integration: Accounts for defensive liabilities in competitive play
 * 4. Move Quality Assessment: Penalizes poor movesets that limit practical usage
 * 5. Anti-Overfitting: Prevents statistical outliers from reaching Essential
 *
 * RESULT: A comprehensive, accurate, and meaningful Pokemon classification system
 * that helps players make informed decisions about which Pokemon deserve investment.
 */
