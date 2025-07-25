const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../outputs/PokemonMaster.json");
const OUTPUT_PATH = path.resolve(__dirname, "../outputs/PokemonMaster_updated.json");

const current = "Shadow Ho-Oh";

// CP cap logic with known leagues
const getCpCap = (leagueName) => {
  const normalized = leagueName.toLowerCase();

  if (normalized.includes("little")) return 500;
  if (normalized.includes("great") || normalized.includes("sunshine") || normalized.includes("ascension") || normalized.includes("aurora") || normalized.includes("hisui") || normalized.includes("devon") || normalized.includes("onyx") || normalized.includes("pillar")) return 1500;
  if (normalized.includes("ultra") || normalized.includes("battlefrontierultra")) return 2500;
  if (normalized.includes("master") || normalized.includes("battlefrontiermaster")) return 10000;

  return null;
};
// Point logic
const raidTierPoints = (tier) => {
  if (!tier) return 0;
  const t = tier.toUpperCase();
  if (t.startsWith("S")) return 3;
  if (t.startsWith("A+")) return 2;
  if (t.startsWith("A") || t.startsWith("B")) return 1;
  return 0;
};

const bestTypePoints = (bestTypes, raidTier) => {
  if (!Array.isArray(bestTypes) || raidTierPoints(raidTier) < 1) return 0;
  return bestTypes.reduce((sum, t) => {
    const score = parseFloat(t.score || 0);
    const rank = parseInt(t.rank);
    if (score >= 9 && rank && rank < 50) return sum + 1;
    return sum;
  }, 0);
};

const pvpPoints = (leagues) => {
  const seenCaps = new Set();
  let score = 0;
  for (const leagueName in leagues) {
    const league = leagues[leagueName];
    if (!league || typeof league.score !== "number") continue;

    const cpCap = getCpCap(leagueName);
    if (!cpCap || seenCaps.has(cpCap)) continue;

    if (league.score >= 75) {
      score += 1;
      seenCaps.add(cpCap);
    }
  }
  return Math.min(score, 2);
};

const defenderPoints = (tier, hasOtherRoles) => {
  if (!tier) return 0;
  const t = tier.toUpperCase();
  if ((t.startsWith("A") || t.startsWith("B")) && !hasOtherRoles) return 1;
  return 0;
};

const calcRecommendedCount = (mon) => {
  const pvp = pvpPoints(mon.leagues || {});
  const raid = raidTierPoints(mon.raidTier);
  const type = (() => {
    if (!Array.isArray(mon.bestTypes) || raid < 1) return 0;

    const strongTypes = mon.bestTypes.filter((t) => {
      const score = parseFloat(t.score || 0);
      const rank = parseInt(t.rank);
      return score >= 12 && rank && rank <= 25;
    });

    if (strongTypes.length >= 2) return 3; // dual strong roles
    if (strongTypes.length === 1) return 2; // niche but elite role
    return 0;
  })();
  const def = defenderPoints(mon.defenderTier, pvp > 0 || raid > 0);

  // Meta anchor must be uniquely relevant in PvP (1 major league only) and scoring 90+
  const isMetaPvPAnchor = (() => {
    const leagues = mon.leagues || {};
    const majorScores = Object.entries(leagues)
      .filter(([k]) => ["great", "ultra", "master"].includes(k.toLowerCase()))
      .map(([, l]) => l?.score ?? 0)
      .filter((score) => score >= 75);

    return majorScores.length === 1 && majorScores[0] >= 90;
  })();

  let score = pvp + raid + type + def;
  if (isMetaPvPAnchor) score += 1.5;

  if (mon.name === current) {
    console.log(`🧪 Debug: ${mon.name}`);
    console.log("PvP Points:", pvp);
    console.log("Raid Tier Points:", raid);
    console.log("Type Points:", type);
    console.log("Defender Points:", def);
    console.log("isMetaPvPAnchor?", isMetaPvPAnchor);
    console.log("Score (with bonuses):", score.toFixed(2));
    console.log("Ultra Score:", mon.leagues?.ultra?.score ?? 0);
    console.log("Master Score:", mon.leagues?.master?.score ?? 0);
  }

  // Final conversion to recommendedCount
  if (score >= 9) return 3;
  if (score >= 6) return 2;
  if (score >= 3.5) return 1;
  return 0;
};



// Load and update
const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));

const updated = data.map((mon) => ({
  ...mon,
  recommendedCount: calcRecommendedCount(mon),
}));

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updated, null, 2));
console.log(`✅ Updated ${updated.length} Pokémon → saved to baulbausrsample_updated.json`);
