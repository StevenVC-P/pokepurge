const fs = require("fs");
const path = require("path");

// Load all data files
const condensed = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../outputs/pokemon-optimized.json")));
const raidTiers = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../outputs/raid-tiers.json")));
const defenderTiers = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../outputs/gym-defender-tiers.json")));
const bestPerType = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../outputs/best-per-type.json")));

const outputPath = path.resolve(__dirname, "../outputs/PokemonMaster.json");

const raidMap = {};
for (const [tier, names] of Object.entries(raidTiers)) {
  names.forEach((name) => {
    raidMap[name.trim()] = tier;
  });
}

const defenderMap = {};
for (const [tier, names] of Object.entries(defenderTiers)) {
  names.forEach((name) => {
    defenderMap[name.trim()] = tier;
  });
}

const bestTypeMap = {};
bestPerType.forEach((entry) => {
  const key = entry.name.trim();
  if (!bestTypeMap[key]) bestTypeMap[key] = [];
  bestTypeMap[key].push({
    type: entry.type,
    rank: entry.rank,
    fastMove: entry.fastMove,
    chargeMove: entry.chargeMove,
    dps: entry.dps,
    tdo: entry.tdo,
    score: entry.score,
  });
});

// Build final dataset
const masterList = condensed.map((mon) => {
  const name = mon.name.trim();

  return {
    ...mon,
    raidTier: raidMap[name] || null,
    defenderTier: defenderMap[name] || null,
    bestTypes: bestTypeMap[name] || [],
  };
});

fs.writeFileSync(outputPath, JSON.stringify(masterList, null, 2));
console.log(`✅ Master file written to ${outputPath}`);
