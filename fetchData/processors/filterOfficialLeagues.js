const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../outputs/pokemon-with-moves.json");
const OUTPUT_PATH = path.resolve(__dirname, "../outputs/pokemon-official-leagues.json");

// Define official leagues only
const OFFICIAL_LEAGUES = ["great", "ultra", "master"];

function filterOfficialLeagues(pokemonData) {
  console.log("🎯 Filtering to official leagues only...");
  
  let totalLeaguesRemoved = 0;
  let pokemonWithData = 0;
  
  const filtered = pokemonData.map(pokemon => {
    const filtered = { ...pokemon };
    
    if (pokemon.leagues) {
      const originalLeagues = Object.keys(pokemon.leagues);
      const filteredLeagues = {};
      
      // Keep only official leagues
      for (const league of OFFICIAL_LEAGUES) {
        if (pokemon.leagues[league]) {
          filteredLeagues[league] = pokemon.leagues[league];
        }
      }
      
      filtered.leagues = filteredLeagues;
      
      // Count removed leagues
      const removedCount = originalLeagues.length - Object.keys(filteredLeagues).length;
      totalLeaguesRemoved += removedCount;
      
      if (Object.keys(filteredLeagues).length > 0) {
        pokemonWithData++;
      }
    }
    
    return filtered;
  });
  
  console.log(`✅ Filtered ${pokemonData.length} Pokemon`);
  console.log(`📊 Removed ${totalLeaguesRemoved} non-official league entries`);
  console.log(`🎮 ${pokemonWithData} Pokemon have official league data`);
  console.log(`🏆 Kept leagues: ${OFFICIAL_LEAGUES.join(", ")}`);
  
  return filtered;
}

function calculateDataReduction(originalData, filteredData) {
  const originalSize = JSON.stringify(originalData).length;
  const filteredSize = JSON.stringify(filteredData).length;
  const reduction = ((originalSize - filteredSize) / originalSize * 100).toFixed(1);
  
  console.log(`📉 Data size reduction: ${reduction}% (${Math.round(originalSize/1024/1024*10)/10}MB → ${Math.round(filteredSize/1024/1024*10)/10}MB)`);
}

function validateOfficialLeagues(filteredData) {
  console.log("\n🔍 Validating filtered data...");
  
  const samplePokemon = filteredData.find(p => p.leagues && Object.keys(p.leagues).length > 0);
  if (samplePokemon) {
    const leagues = Object.keys(samplePokemon.leagues);
    console.log(`✅ Sample Pokemon leagues: ${leagues.join(", ")}`);
    
    // Check if any non-official leagues remain
    const nonOfficial = leagues.filter(l => !OFFICIAL_LEAGUES.includes(l));
    if (nonOfficial.length > 0) {
      console.warn(`⚠️ Warning: Non-official leagues still present: ${nonOfficial.join(", ")}`);
    } else {
      console.log("✅ All leagues are official");
    }
  }
  
  // Count Pokemon with each league
  const leagueCounts = {};
  OFFICIAL_LEAGUES.forEach(league => {
    leagueCounts[league] = filteredData.filter(p => p.leagues && p.leagues[league]).length;
  });
  
  console.log("\n📊 Pokemon count per official league:");
  Object.entries(leagueCounts).forEach(([league, count]) => {
    console.log(`- ${league.charAt(0).toUpperCase() + league.slice(1)} League: ${count} Pokemon`);
  });
}

function main() {
  console.log("🎯 Starting official leagues filter...");
  
  // Load data
  const originalData = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  console.log(`📊 Loaded ${originalData.length} Pokemon from: ${INPUT_PATH}`);
  
  // Filter to official leagues only
  const filteredData = filterOfficialLeagues(originalData);
  
  // Calculate data reduction
  calculateDataReduction(originalData, filteredData);
  
  // Validate results
  validateOfficialLeagues(filteredData);
  
  // Save filtered data
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(filteredData, null, 2));
  console.log(`\n💾 Saved official leagues data to: ${OUTPUT_PATH}`);
  
  console.log("\n🎉 Official leagues filtering completed!");
}

if (require.main === module) {
  main();
}

module.exports = { filterOfficialLeagues, OFFICIAL_LEAGUES };
