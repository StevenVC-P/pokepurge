const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../outputs/pokemon-condensed-meta.json");
const FAST_MOVES_PATH = path.resolve(__dirname, "../outputs/pvpoke-fast-moves.json");
const CHARGE_MOVES_PATH = path.resolve(__dirname, "../outputs/pvpoke-charge-moves.json");
const OUTPUT_PATH = path.resolve(__dirname, "../outputs/pokemon-with-moves.json");

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    console.error(`❌ Error loading ${filePath}:`, error.message);
    return null;
  }
}

function createMoveNameToIdMap(fastMoves, chargeMoves) {
  const nameToId = {};

  // Map fast moves
  for (const [id, move] of Object.entries(fastMoves)) {
    const normalizedName = move.name.toUpperCase().replace(/\s+/g, "_");
    nameToId[normalizedName] = { id, move, category: "fast" };
  }

  // Map charge moves
  for (const [id, move] of Object.entries(chargeMoves)) {
    const normalizedName = move.name.toUpperCase().replace(/\s+/g, "_");
    nameToId[normalizedName] = { id, move, category: "charge" };
  }

  return nameToId;
}

function enhanceLeagueDataWithMoves(leagueData, fastMoves, chargeMoves, moveNameMap) {
  if (!leagueData || !leagueData.moveset) return leagueData;

  const [fastMoveName, chargeMove1Name, chargeMove2Name] = leagueData.moveset;

  // Get move details using name mapping
  const fastMoveData = moveNameMap[fastMoveName];
  const chargeMove1Data = moveNameMap[chargeMove1Name];
  const chargeMove2Data = chargeMove2Name ? moveNameMap[chargeMove2Name] : null;

  const fastMove = fastMoveData?.move;
  const chargeMove1 = chargeMove1Data?.move;
  const chargeMove2 = chargeMove2Data?.move;

  // Create enhanced moveset with full move data
  const enhancedMoveset = {
    fast: fastMove
      ? {
          moveId: fastMoveData?.id,
          name: fastMove.name,
          type: fastMove.type,
          power: fastMove.power,
          energyGain: fastMove.energyGain,
          turns: fastMove.turns,
          cooldown: fastMove.cooldown,
        }
      : null,

    charge1: chargeMove1
      ? {
          moveId: chargeMove1Data?.id,
          name: chargeMove1.name,
          type: chargeMove1.type,
          power: chargeMove1.power,
          energyCost: chargeMove1.energyCost,
          buffs: chargeMove1.buffs,
          buffApplyChance: chargeMove1.buffApplyChance,
          buffTarget: chargeMove1.buffTarget,
        }
      : null,

    charge2: chargeMove2
      ? {
          moveId: chargeMove2Data?.id,
          name: chargeMove2.name,
          type: chargeMove2.type,
          power: chargeMove2.power,
          energyCost: chargeMove2.energyCost,
          buffs: chargeMove2.buffs,
          buffApplyChance: chargeMove2.buffApplyChance,
          buffTarget: chargeMove2.buffTarget,
        }
      : null,
  };

  // Return enhanced league data
  return {
    ...leagueData,
    moveset: leagueData.moveset, // Keep original array for compatibility
    moves: enhancedMoveset, // Add detailed moves data
  };
}

function calculateMovesetStats(moves) {
  if (!moves || !moves.fast || !moves.charge1) return null;

  const fast = moves.fast;
  const charge1 = moves.charge1;
  const charge2 = moves.charge2;

  // Calculate basic stats
  const turnsToCharge1 = charge1 ? Math.ceil(charge1.energyCost / fast.energyGain) : null;
  const turnsToCharge2 = charge2 ? Math.ceil(charge2.energyCost / fast.energyGain) : null;

  // Calculate DPS and EPS
  const fastDPS = fast.power / fast.turns;
  const fastEPS = fast.energyGain / fast.turns;

  // Calculate charge move efficiency (damage per energy)
  const charge1DPE = charge1 ? charge1.power / charge1.energyCost : 0;
  const charge2DPE = charge2 ? charge2.power / charge2.energyCost : 0;

  return {
    turnsToCharge1,
    turnsToCharge2,
    fastDPS: Math.round(fastDPS * 100) / 100,
    fastEPS: Math.round(fastEPS * 100) / 100,
    charge1DPE: Math.round(charge1DPE * 1000) / 1000,
    charge2DPE: Math.round(charge2DPE * 1000) / 1000,
    hasSecondCharge: !!charge2,
    stab: {
      fast: false, // Will be calculated when we have Pokemon types
      charge1: false,
      charge2: false,
    },
  };
}

function main() {
  console.log("🎯 Adding moves data to Pokemon...");

  // Load data
  const pokemonData = loadJson(INPUT_PATH);
  const fastMoves = loadJson(FAST_MOVES_PATH);
  const chargeMoves = loadJson(CHARGE_MOVES_PATH);

  if (!pokemonData || !fastMoves || !chargeMoves) {
    console.error("❌ Failed to load required data files");
    process.exit(1);
  }

  console.log(`📊 Processing ${pokemonData.length} Pokemon...`);
  console.log(`⚡ Fast moves available: ${Object.keys(fastMoves).length}`);
  console.log(`💥 Charge moves available: ${Object.keys(chargeMoves).length}`);

  // Create move name to ID mapping
  const moveNameMap = createMoveNameToIdMap(fastMoves, chargeMoves);
  console.log(`🗺️ Created mapping for ${Object.keys(moveNameMap).length} move names`);

  let enhancedCount = 0;
  let movesetStatsCount = 0;

  // Process each Pokemon
  const enhancedPokemon = pokemonData.map((pokemon) => {
    const enhanced = { ...pokemon };

    // Process each league's moveset
    if (pokemon.leagues) {
      for (const [leagueName, leagueData] of Object.entries(pokemon.leagues)) {
        if (leagueData && leagueData.moveset) {
          enhanced.leagues[leagueName] = enhanceLeagueDataWithMoves(leagueData, fastMoves, chargeMoves, moveNameMap);

          // Add moveset statistics
          const moves = enhanced.leagues[leagueName].moves;
          if (moves) {
            const stats = calculateMovesetStats(moves);
            if (stats) {
              // Calculate STAB (Same Type Attack Bonus) - normalize case
              if (pokemon.types) {
                const normalizedTypes = pokemon.types.map((t) => t.toLowerCase());
                stats.stab.fast = normalizedTypes.includes(moves.fast.type.toLowerCase());
                stats.stab.charge1 = moves.charge1 ? normalizedTypes.includes(moves.charge1.type.toLowerCase()) : false;
                stats.stab.charge2 = moves.charge2 ? normalizedTypes.includes(moves.charge2.type.toLowerCase()) : false;
              }

              enhanced.leagues[leagueName].movesetStats = stats;
              movesetStatsCount++;
            }
            enhancedCount++;
          }
        }
      }
    }

    return enhanced;
  });

  // Save enhanced data
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(enhancedPokemon, null, 2));

  console.log(`✅ Enhanced ${enhancedCount} league movesets with detailed move data`);
  console.log(`📈 Generated moveset statistics for ${movesetStatsCount} entries`);
  console.log(`💾 Saved enhanced Pokemon data to: ${OUTPUT_PATH}`);
}

if (require.main === module) {
  main();
}

module.exports = { enhanceLeagueDataWithMoves, calculateMovesetStats };
