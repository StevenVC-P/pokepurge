const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../outputs/PokemonMaster_updated.json");
const MOVES_PATH = path.resolve(__dirname, "../outputs/moves.json");
const OUTPUT_PATH = path.resolve(__dirname, "../outputs/meta-attack-types.json");

// Thresholds for meta relevance
const META_THRESHOLDS = {
  // PvP score thresholds by league
  great: 75, // Score >= 75 in Great League
  ultra: 75, // Score >= 75 in Ultra League
  master: 70, // Score >= 70 in Master League (slightly lower due to fewer viable Pokemon)

  // Usage weight multipliers
  weights: {
    great: 1.0, // Great League baseline
    ultra: 0.9, // Ultra League slightly less popular
    master: 0.7, // Master League less accessible
  },
};

function loadData() {
  console.log("📊 Loading Pokemon and moves data...");

  const pokemon = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  const moves = JSON.parse(fs.readFileSync(MOVES_PATH, "utf8"));

  console.log(`✅ Loaded ${pokemon.length} Pokemon and ${Object.keys(moves).length} moves`);
  return { pokemon, moves };
}

function isMetaRelevant(pokemon) {
  if (!pokemon.leagues) return false;

  // Check if Pokemon meets meta thresholds in any league
  const leagues = pokemon.leagues;

  const greatMeta = leagues.great && leagues.great.score >= META_THRESHOLDS.great;
  const ultraMeta = leagues.ultra && leagues.ultra.score >= META_THRESHOLDS.ultra;
  const masterMeta = leagues.master && leagues.master.score >= META_THRESHOLDS.master;

  return greatMeta || ultraMeta || masterMeta;
}

function calculateUsageWeight(pokemon) {
  let totalWeight = 0;

  if (!pokemon.leagues) return 0;

  const leagues = pokemon.leagues;

  // Great League weight
  if (leagues.great && leagues.great.score >= META_THRESHOLDS.great) {
    const scoreBonus = Math.min((leagues.great.score - META_THRESHOLDS.great) / 25, 1); // 0-1 bonus
    totalWeight += META_THRESHOLDS.weights.great * (1 + scoreBonus);
  }

  // Ultra League weight
  if (leagues.ultra && leagues.ultra.score >= META_THRESHOLDS.ultra) {
    const scoreBonus = Math.min((leagues.ultra.score - META_THRESHOLDS.ultra) / 25, 1);
    totalWeight += META_THRESHOLDS.weights.ultra * (1 + scoreBonus);
  }

  // Master League weight
  if (leagues.master && leagues.master.score >= META_THRESHOLDS.master) {
    const scoreBonus = Math.min((leagues.master.score - META_THRESHOLDS.master) / 30, 1);
    totalWeight += META_THRESHOLDS.weights.master * (1 + scoreBonus);
  }

  return totalWeight;
}

function analyzeAttackTypes(pokemon, moves) {
  console.log("🎯 Analyzing meta attack types...");

  const typeUsage = {};
  const moveUsage = {};
  let totalMetaPokemon = 0;
  let totalUsageWeight = 0;

  pokemon.forEach((mon) => {
    if (!isMetaRelevant(mon)) return;

    totalMetaPokemon++;
    const weight = calculateUsageWeight(mon);
    totalUsageWeight += weight;

    // Analyze moves from each league where Pokemon is meta
    Object.entries(mon.leagues || {}).forEach(([leagueName, league]) => {
      if (!league || !league.moves) return;

      const leagueWeight = weight * (META_THRESHOLDS.weights[leagueName] || 0.5);

      // Helper function to check STAB and calculate weighted usage
      const addMoveUsage = (move, weight) => {
        const moveType = move.type.toLowerCase();
        const pokemonTypes = (mon.types || []).map((t) => t.toLowerCase());

        // Check for STAB (Same Type Attack Bonus)
        const isSTAB = pokemonTypes.includes(moveType);
        const stabMultiplier = isSTAB ? 1.5 : 1.0; // STAB moves are 1.5x more threatening
        const effectiveWeight = weight * stabMultiplier;

        // Add to type usage with STAB consideration
        typeUsage[moveType] = (typeUsage[moveType] || 0) + effectiveWeight;

        // Track move usage with STAB info
        const moveName = move.name;
        if (!moveUsage[moveName]) {
          moveUsage[moveName] = {
            type: moveType,
            usage: 0,
            category: move.category,
            stabUsage: 0,
            nonStabUsage: 0,
          };
        }
        moveUsage[moveName].usage += effectiveWeight;

        if (isSTAB) {
          moveUsage[moveName].stabUsage += weight;
        } else {
          moveUsage[moveName].nonStabUsage += weight;
        }
      };

      // Analyze fast move
      if (league.moves.fast) {
        const move = moves[league.moves.fast];
        if (move) {
          addMoveUsage(move, leagueWeight);
        }
      }

      // Analyze charge moves
      [league.moves.charge1, league.moves.charge2].forEach((moveRef) => {
        if (moveRef) {
          const move = moves[moveRef];
          if (move) {
            addMoveUsage(move, leagueWeight);
          }
        }
      });
    });
  });

  console.log(`📈 Analyzed ${totalMetaPokemon} meta-relevant Pokemon`);
  console.log(`⚖️ Total usage weight: ${totalUsageWeight.toFixed(1)}`);

  return { typeUsage, moveUsage, totalMetaPokemon, totalUsageWeight };
}

function processResults(typeUsage, moveUsage, totalUsageWeight) {
  console.log("📊 Processing analysis results...");

  // Convert to percentages and sort
  const typeStats = Object.entries(typeUsage)
    .map(([type, usage]) => ({
      type,
      usage: usage,
      percentage: (usage / totalUsageWeight) * 100,
      rank: 0,
    }))
    .sort((a, b) => b.usage - a.usage)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  const moveStats = Object.entries(moveUsage)
    .map(([name, data]) => ({
      name,
      type: data.type,
      category: data.category,
      usage: data.usage,
      percentage: (data.usage / totalUsageWeight) * 100,
      stabUsage: data.stabUsage || 0,
      nonStabUsage: data.nonStabUsage || 0,
      stabPercentage: data.stabUsage ? (data.stabUsage / (data.stabUsage + data.nonStabUsage)) * 100 : 0,
      rank: 0,
    }))
    .sort((a, b) => b.usage - a.usage)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  // Separate fast and charge moves
  const fastMoves = moveStats.filter((m) => m.category === "fast").slice(0, 20);
  const chargeMoves = moveStats.filter((m) => m.category === "charge").slice(0, 30);

  return {
    summary: {
      totalMetaPokemon: typeStats.length > 0 ? Math.round(totalUsageWeight) : 0,
      analysisDate: new Date().toISOString(),
      thresholds: META_THRESHOLDS,
    },
    typeDistribution: typeStats,
    topFastMoves: fastMoves,
    topChargeMoves: chargeMoves,
    allMoves: moveStats,
  };
}

function generateReport(results) {
  console.log("\n📋 META ATTACK TYPE ANALYSIS REPORT");
  console.log("=====================================");

  console.log(`\n🎯 Top 10 Attack Types:`);
  results.typeDistribution.slice(0, 10).forEach((type) => {
    console.log(`${type.rank}. ${type.type.charAt(0).toUpperCase() + type.type.slice(1)}: ${type.percentage.toFixed(1)}%`);
  });

  console.log(`\n⚡ Top 10 Fast Moves (with STAB analysis):`);
  results.topFastMoves.slice(0, 10).forEach((move) => {
    const stabInfo = move.stabPercentage > 0 ? ` [${move.stabPercentage.toFixed(0)}% STAB]` : "";
    console.log(`${move.rank}. ${move.name} (${move.type}): ${move.percentage.toFixed(1)}%${stabInfo}`);
  });

  console.log(`\n💥 Top 10 Charge Moves (with STAB analysis):`);
  results.topChargeMoves.slice(0, 10).forEach((move) => {
    const stabInfo = move.stabPercentage > 0 ? ` [${move.stabPercentage.toFixed(0)}% STAB]` : "";
    console.log(`${move.rank}. ${move.name} (${move.type}): ${move.percentage.toFixed(1)}%${stabInfo}`);
  });

  // Identify dominant types (>5% usage)
  const dominantTypes = results.typeDistribution.filter((t) => t.percentage >= 5);
  console.log(`\n🏆 Dominant Attack Types (≥5% usage):`);
  dominantTypes.forEach((type) => {
    console.log(`- ${type.type.charAt(0).toUpperCase() + type.type.slice(1)}: ${type.percentage.toFixed(1)}%`);
  });

  // STAB analysis summary
  const highStabMoves = results.allMoves.filter((m) => m.stabPercentage >= 70);
  const lowStabMoves = results.allMoves.filter((m) => m.stabPercentage < 30 && m.stabPercentage > 0);

  console.log(`\n🎯 STAB Analysis Summary:`);
  console.log(`- High STAB moves (≥70% STAB usage): ${highStabMoves.length}`);
  console.log(`- Coverage moves (<30% STAB usage): ${lowStabMoves.length}`);

  if (highStabMoves.length > 0) {
    console.log(`\n🔥 Most STAB-dependent moves:`);
    highStabMoves.slice(0, 5).forEach((move) => {
      console.log(`- ${move.name} (${move.type}): ${move.stabPercentage.toFixed(0)}% STAB`);
    });
  }

  if (lowStabMoves.length > 0) {
    console.log(`\n🎭 Popular coverage moves:`);
    lowStabMoves.slice(0, 5).forEach((move) => {
      console.log(`- ${move.name} (${move.type}): ${move.stabPercentage.toFixed(0)}% STAB`);
    });
  }

  return dominantTypes;
}

function main() {
  console.log("🎯 Starting meta attack type analysis...");

  try {
    // Load data
    const { pokemon, moves } = loadData();

    // Analyze attack types
    const { typeUsage, moveUsage, totalMetaPokemon, totalUsageWeight } = analyzeAttackTypes(pokemon, moves);

    // Process results
    const results = processResults(typeUsage, moveUsage, totalUsageWeight);

    // Generate report
    const dominantTypes = generateReport(results);

    // Save results
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    console.log(`\n💾 Analysis saved to: ${OUTPUT_PATH}`);

    console.log("\n🎉 Meta attack type analysis completed!");

    return results;
  } catch (error) {
    console.error("❌ Error during analysis:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeAttackTypes,
  isMetaRelevant,
  calculateUsageWeight,
  loadData,
  processResults,
  META_THRESHOLDS,
};
