const fs = require("fs");
const path = require("path");

const MASTER_PATH = path.resolve(__dirname, "../outputs/pokemon-variants-validated.json");
const CONVERSION_PATH = path.resolve(__dirname, "../outputs/pokemon-pvpoke-conversion.json");
const RANKINGS_DIR = path.resolve(__dirname, "../outputs/rankings");
const OUTPUT_PATH = path.resolve(__dirname, "../outputs/pokemon-condensed-meta.json");

const masterList = JSON.parse(fs.readFileSync(MASTER_PATH, "utf8"));
const conversionList = JSON.parse(fs.readFileSync(CONVERSION_PATH, "utf8"));

const rankingsFiles = fs.readdirSync(RANKINGS_DIR).filter((f) => f.endsWith(".json"));

// Build lookup from our name/base/form to pvpoke id
const conversionMap = new Map();
for (const entry of conversionList) {
  const key = `${entry.ourBase}|${entry.ourForm}`;
  conversionMap.set(key, entry.pvpokeSpeciesId);
}

// Load all rankings by league
const leagueRankings = {};
for (const file of rankingsFiles) {
  const leagueName = path.basename(file, ".json");
  const leagueData = JSON.parse(fs.readFileSync(path.join(RANKINGS_DIR, file), "utf8"));
  leagueRankings[leagueName] = {};
  for (const mon of leagueData) {
    leagueRankings[leagueName][mon.speciesId] = {
      rating: mon.rating,
      score: mon.score,
      scoreDetails: mon.scores,
      moveset: mon.moveset,
      stats: mon.stats,
    };
  }
}

// Build final result
const final = [];
for (const mon of masterList) {
  const key = `${mon.base}|${mon.form}`;
  const speciesId = conversionMap.get(key);
  if (!speciesId) continue;

  const leagues = {};
  for (const league of Object.keys(leagueRankings)) {
    leagues[league] = leagueRankings[league][speciesId] || null;
  }

  final.push({
    id: mon.id,
    name: mon.name,
    base: mon.base,
    form: mon.form,
    candy: mon.candy,
    dynamax: mon.dynamax,
    trashability: mon.trashability,
    recommendedCount: mon.recommendedCount,
    url: mon.url,
    leagues,
  });
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(final, null, 2));
console.log(`✅ Output written to ${OUTPUT_PATH}`);
