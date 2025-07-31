const fs = require("fs");
const path = require("path");
const axios = require("axios");

const OUTPUT_DIR = path.resolve(__dirname, "../outputs");
const GAMEMASTER_URL = "https://pvpoke.com/data/gamemaster.json";

async function fetchPvPokeGamemaster() {
  console.log("🎯 Fetching PvPoke gamemaster data...");
  
  try {
    const response = await axios.get(GAMEMASTER_URL, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const gamemaster = response.data;
    console.log(`✅ Fetched gamemaster data (${Object.keys(gamemaster).length} sections)`);

    // Extract moves data
    const moves = gamemaster.moves || {};
    console.log(`📦 Found ${Object.keys(moves).length} moves`);

    // Process and clean moves data
    const processedMoves = {};
    
    for (const [moveId, moveData] of Object.entries(moves)) {
      // Skip if not a proper move object
      if (!moveData || typeof moveData !== 'object') continue;
      
      const processed = {
        moveId: moveId,
        name: moveData.name || moveId,
        type: moveData.type || "Normal",
        category: moveData.energyGain ? "Fast Move" : "Charge Move",
        power: moveData.power || 0,
        energy: moveData.energyGain || moveData.energy || 0,
        cooldown: moveData.cooldown || 0,
        damageWindow: moveData.damageWindow || 0,
        buffs: moveData.buffs || null,
        buffApplyChance: moveData.buffApplyChance || null,
        buffTarget: moveData.buffTarget || null
      };

      // Add category-specific fields
      if (processed.category === "Fast Move") {
        processed.energyGain = processed.energy;
        processed.turns = Math.round((moveData.cooldown || 0) / 500); // Convert to turns
      } else {
        processed.energyCost = Math.abs(processed.energy);
      }

      processedMoves[moveId] = processed;
    }

    // Separate fast and charge moves
    const fastMoves = {};
    const chargeMoves = {};

    for (const [moveId, moveData] of Object.entries(processedMoves)) {
      if (moveData.category === "Fast Move") {
        fastMoves[moveId] = moveData;
      } else {
        chargeMoves[moveId] = moveData;
      }
    }

    // Save processed moves data
    const movesOutputPath = path.join(OUTPUT_DIR, "pvpoke-moves.json");
    const fastMovesPath = path.join(OUTPUT_DIR, "pvpoke-fast-moves.json");
    const chargeMovesPath = path.join(OUTPUT_DIR, "pvpoke-charge-moves.json");

    fs.writeFileSync(movesOutputPath, JSON.stringify(processedMoves, null, 2));
    fs.writeFileSync(fastMovesPath, JSON.stringify(fastMoves, null, 2));
    fs.writeFileSync(chargeMovesPath, JSON.stringify(chargeMoves, null, 2));

    console.log(`✅ Saved all moves to: ${movesOutputPath}`);
    console.log(`✅ Saved fast moves to: ${fastMovesPath}`);
    console.log(`✅ Saved charge moves to: ${chargeMovesPath}`);
    console.log(`📊 Fast moves: ${Object.keys(fastMoves).length}`);
    console.log(`📊 Charge moves: ${Object.keys(chargeMoves).length}`);

    // Also save raw gamemaster for reference
    const rawGamemasterPath = path.join(OUTPUT_DIR, "pvpoke-gamemaster-raw.json");
    fs.writeFileSync(rawGamemasterPath, JSON.stringify(gamemaster, null, 2));
    console.log(`✅ Saved raw gamemaster to: ${rawGamemasterPath}`);

    return {
      allMoves: processedMoves,
      fastMoves,
      chargeMoves,
      totalMoves: Object.keys(processedMoves).length
    };

  } catch (error) {
    console.error("❌ Error fetching PvPoke gamemaster:", error.message);
    throw error;
  }
}

async function main() {
  try {
    const result = await fetchPvPokeGamemaster();
    console.log("🎉 PvPoke moves data fetch completed successfully!");
    console.log(`📈 Total moves processed: ${result.totalMoves}`);
    console.log(`⚡ Fast moves: ${Object.keys(result.fastMoves).length}`);
    console.log(`💥 Charge moves: ${Object.keys(result.chargeMoves).length}`);
  } catch (error) {
    console.error("💥 Failed to fetch PvPoke moves data:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fetchPvPokeGamemaster };
