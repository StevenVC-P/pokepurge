const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../outputs/pokemon-official-leagues.json");
const POKEMON_OUTPUT_PATH = path.resolve(__dirname, "../outputs/pokemon-optimized.json");
const MOVES_OUTPUT_PATH = path.resolve(__dirname, "../outputs/moves.json");

function extractAndOptimizeMoves(pokemonData) {
  console.log("🎯 Extracting moves to separate file...");
  
  const movesDatabase = {};
  const moveIdCounter = { fast: 1, charge: 1 };
  
  // First pass: collect all unique moves
  pokemonData.forEach(pokemon => {
    if (!pokemon.leagues) return;
    
    Object.values(pokemon.leagues).forEach(league => {
      if (!league.moves) return;
      
      // Process fast move
      if (league.moves.fast) {
        const move = league.moves.fast;
        const moveKey = `fast_${move.name.toLowerCase().replace(/\s+/g, '_')}`;
        
        if (!movesDatabase[moveKey]) {
          movesDatabase[moveKey] = {
            id: moveKey,
            name: move.name,
            type: move.type,
            category: "fast",
            power: move.power,
            energyGain: move.energyGain,
            turns: move.turns,
            cooldown: move.cooldown,
            moveId: move.moveId
          };
        }
      }
      
      // Process charge moves
      [league.moves.charge1, league.moves.charge2].forEach(move => {
        if (!move) return;
        
        const moveKey = `charge_${move.name.toLowerCase().replace(/\s+/g, '_')}`;
        
        if (!movesDatabase[moveKey]) {
          movesDatabase[moveKey] = {
            id: moveKey,
            name: move.name,
            type: move.type,
            category: "charge",
            power: move.power,
            energyCost: move.energyCost,
            buffs: move.buffs,
            buffApplyChance: move.buffApplyChance,
            buffTarget: move.buffTarget,
            moveId: move.moveId
          };
        }
      });
    });
  });
  
  console.log(`📦 Extracted ${Object.keys(movesDatabase).length} unique moves`);
  
  // Second pass: replace move objects with references
  const optimizedPokemon = pokemonData.map(pokemon => {
    const optimized = { ...pokemon };
    
    if (pokemon.leagues) {
      optimized.leagues = {};
      
      Object.entries(pokemon.leagues).forEach(([leagueName, league]) => {
        optimized.leagues[leagueName] = { ...league };
        
        if (league.moves) {
          const optimizedMoves = {};
          
          // Replace fast move with reference
          if (league.moves.fast) {
            const moveKey = `fast_${league.moves.fast.name.toLowerCase().replace(/\s+/g, '_')}`;
            optimizedMoves.fast = moveKey;
          }
          
          // Replace charge moves with references
          if (league.moves.charge1) {
            const moveKey = `charge_${league.moves.charge1.name.toLowerCase().replace(/\s+/g, '_')}`;
            optimizedMoves.charge1 = moveKey;
          }
          
          if (league.moves.charge2) {
            const moveKey = `charge_${league.moves.charge2.name.toLowerCase().replace(/\s+/g, '_')}`;
            optimizedMoves.charge2 = moveKey;
          }
          
          optimized.leagues[leagueName].moves = optimizedMoves;
        }
      });
    }
    
    return optimized;
  });
  
  return { optimizedPokemon, movesDatabase };
}

function calculateOptimization(originalData, optimizedData, movesData) {
  const originalSize = JSON.stringify(originalData).length;
  const optimizedSize = JSON.stringify(optimizedData).length;
  const movesSize = JSON.stringify(movesData).length;
  const totalOptimizedSize = optimizedSize + movesSize;
  
  const reduction = ((originalSize - totalOptimizedSize) / originalSize * 100).toFixed(1);
  
  console.log("\n📊 Optimization Results:");
  console.log(`Original pokemon.json: ${Math.round(originalSize/1024)}KB`);
  console.log(`Optimized pokemon.json: ${Math.round(optimizedSize/1024)}KB`);
  console.log(`New moves.json: ${Math.round(movesSize/1024)}KB`);
  console.log(`Total size: ${Math.round(totalOptimizedSize/1024)}KB`);
  console.log(`Size reduction: ${reduction}% (${Math.round((originalSize-totalOptimizedSize)/1024)}KB saved)`);
  
  return {
    originalSize,
    optimizedSize,
    movesSize,
    totalOptimizedSize,
    reduction: parseFloat(reduction)
  };
}

function validateOptimization(originalData, optimizedData, movesDatabase) {
  console.log("\n🔍 Validating optimization...");
  
  // Check that we can reconstruct the original data
  let validationErrors = 0;
  
  originalData.slice(0, 10).forEach((original, index) => {
    const optimized = optimizedData[index];
    
    if (!original.leagues || !optimized.leagues) return;
    
    Object.entries(original.leagues).forEach(([leagueName, originalLeague]) => {
      const optimizedLeague = optimized.leagues[leagueName];
      
      if (!originalLeague.moves || !optimizedLeague.moves) return;
      
      // Validate fast move
      if (originalLeague.moves.fast) {
        const moveRef = optimizedLeague.moves.fast;
        const reconstructedMove = movesDatabase[moveRef];
        
        if (!reconstructedMove || reconstructedMove.name !== originalLeague.moves.fast.name) {
          validationErrors++;
          console.log(`❌ Fast move mismatch for ${original.name} in ${leagueName}`);
        }
      }
      
      // Validate charge moves
      ['charge1', 'charge2'].forEach(chargeSlot => {
        if (originalLeague.moves[chargeSlot]) {
          const moveRef = optimizedLeague.moves[chargeSlot];
          const reconstructedMove = movesDatabase[moveRef];
          
          if (!reconstructedMove || reconstructedMove.name !== originalLeague.moves[chargeSlot].name) {
            validationErrors++;
            console.log(`❌ ${chargeSlot} mismatch for ${original.name} in ${leagueName}`);
          }
        }
      });
    });
  });
  
  if (validationErrors === 0) {
    console.log("✅ Validation passed - optimization is correct");
  } else {
    console.log(`❌ Validation failed with ${validationErrors} errors`);
  }
  
  return validationErrors === 0;
}

function main() {
  console.log("🎯 Starting moves optimization...");
  
  // Load data
  const originalData = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  console.log(`📊 Loaded ${originalData.length} Pokemon from: ${INPUT_PATH}`);
  
  // Extract and optimize moves
  const { optimizedPokemon, movesDatabase } = extractAndOptimizeMoves(originalData);
  
  // Calculate optimization benefits
  const stats = calculateOptimization(originalData, optimizedPokemon, movesDatabase);
  
  // Validate optimization
  const isValid = validateOptimization(originalData, optimizedPokemon, movesDatabase);
  
  if (!isValid) {
    console.error("❌ Optimization validation failed - aborting");
    process.exit(1);
  }
  
  // Save optimized files
  fs.writeFileSync(POKEMON_OUTPUT_PATH, JSON.stringify(optimizedPokemon, null, 2));
  fs.writeFileSync(MOVES_OUTPUT_PATH, JSON.stringify(movesDatabase, null, 2));
  
  console.log(`\n💾 Saved optimized Pokemon data to: ${POKEMON_OUTPUT_PATH}`);
  console.log(`💾 Saved moves database to: ${MOVES_OUTPUT_PATH}`);
  
  console.log("\n🎉 Moves optimization completed successfully!");
  
  return stats;
}

if (require.main === module) {
  main();
}

module.exports = { extractAndOptimizeMoves, calculateOptimization };
