const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../outputs/PokemonMaster_updated.json");
const OUTPUT_PATH = path.resolve(__dirname, "../pokemon.json");

const current = "Shadow Ho-Oh";

const tierRank = {
  Essential: 10,
  Valuable: 9,
  Reliable: 8,
  Useful: 7,
  Niche: 6,
  Replaceable: 5,
  Outclassed: 4,
  "Legacy-Only": 3,
  Trap: 2,
  Trash: 1,
};

const rankToTier = Object.entries(tierRank).reduce((acc, [tier, rank]) => {
  acc[rank] = tier;
  return acc;
}, {});

const getCpCap = (leagueName) => {
  const n = leagueName.toLowerCase();
  if (n.includes("little")) return 500;
  if (n.includes("great") || n.includes("sunshine") || n.includes("ascension") || n.includes("aurora") || n.includes("hisui") || n.includes("devon") || n.includes("onyx") || n.includes("pillar")) return 1500;
  if (n.includes("ultra")) return 2500;
  if (n.includes("master")) return 10000;
  return null;
};

const pvpScore = (leagues = {}) => {
  let maxScore = 0;
  const seenCaps = new Set();
  let diversityBonus = 0;

  for (const name in leagues) {
    const league = leagues[name];
    if (!league || typeof league.score !== "number") continue;

    const score = league.score;
    if (score > maxScore) maxScore = score;

    const cap = getCpCap(name);
    if (cap && score >= 75 && !seenCaps.has(cap)) {
      diversityBonus += 6;
      seenCaps.add(cap);
    }
  }

  let base = 0;
  if (maxScore >= 90) base = 15;
  else if (maxScore >= 80) base = 12;
  else if (maxScore >= 70) base = 8;
  else if (maxScore >= 60) base = 4;

  return Math.min(30, base + diversityBonus);
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
  const pvp = pvpScore(mon.leagues);
  const raid = raidTierScore(mon.raidTier);
  return pvp >= 4 || raid >= 6 ? 5 : 0;
};

const uniquenessScore = (mon) => {
  const pvp = pvpScore(mon.leagues);
  const raid = raidTierScore(mon.raidTier);
  return pvp + raid >= 30 ? 5 : 0;
};

const roleDominanceTier = (mon) => {
  const leagues = mon.leagues || {};
  const bestTypes = mon.bestTypes || [];

  const ultraScore = leagues.ultra?.score ?? 0;
  const masterScore = leagues.master?.score ?? 0;

  const isDualLeaguePvPBeast = ultraScore >= 90 && masterScore >= 80 && (mon.recommendedCount ?? 0) >= 2;
  if (mon.name === current) {
    console.log("📊 Ultra:", ultraScore, "Master:", masterScore, "Rec:", mon.recommendedCount);
    console.log("📈 isDualLeaguePvPBeast:", isDualLeaguePvPBeast);
  }
  if (isDualLeaguePvPBeast) {
    console.log(`🧪 Debug: ${current} -marked Essential isDualLeaguePvPBeast`);
    return tierRank.Essential;
  }

  const majorLeagues = ["great", "ultra", "master"];
  const minorLeagues = ["hisui", "sunshine"];
  let majorCount90 = 0,
    majorCount75 = 0,
    majorCount65 = 0;
  let minorCount90 = 0,
    minorCount75 = 0,
    minorCount65 = 0;

  let maxScore = 0;

  for (const name in leagues) {
    const league = leagues[name];
    if (!league || typeof league.score !== "number") continue;

    const score = league.score;
    if (score > maxScore) maxScore = score;

    const lname = name.toLowerCase();
    const isMajor = majorLeagues.includes(lname);
    const isMinor = minorLeagues.some((tag) => lname.includes(tag));

    if (isMajor) {
      if (score >= 92.5) majorCount90++;
      else if (score >= 75) majorCount75++;
      else if (score >= 65) majorCount65++;
    } else if (isMinor) {
      if (score >= 95) minorCount90++;
      else if (score >= 75) minorCount75++;
      else if (score >= 65) minorCount65++;
    }
  }

  let pvpAnchor = null;
  const isSoloMetaDefiner = majorCount75 === 1 && maxScore >= 90 && (mon.recommendedCount ?? 0) > 0;

  if (mon.name === current) {
    console.log(`🧪 Debug: ${current}`);
    console.log("majorCount75:", majorCount75);
    console.log("maxScore:", maxScore);
    console.log("isSoloMetaDefiner:", isSoloMetaDefiner);
  }

  if ((majorCount75 >= 2 && maxScore >= 90 && (mon.recommendedCount ?? 0) >= 2) || isSoloMetaDefiner) {
    console.log(`🧪 Debug: ${current} -marked Essential`);
    pvpAnchor = tierRank.Essential;
  } else if (minorCount90 >= 1 || majorCount75 >= 1) pvpAnchor = tierRank.Valuable;
  else if (majorCount65 >= 1) pvpAnchor = tierRank.Reliable;
  else if (minorCount90 >= 2) pvpAnchor = tierRank.Valuable;
  else if (minorCount75 >= 2) pvpAnchor = tierRank.Reliable;
  else if (minorCount65 >= 1) pvpAnchor = tierRank.Useful;

  const eliteTypes = bestTypes.filter((t) => {
    const rank = parseInt(t.rank);
    const score = parseFloat(t.score);
    return rank <= 20 && score >= 12;
  });

  const eliteTypeCount = eliteTypes.length;
  const raidTier = raidTierScore(mon.raidTier);

  const isRaidAnchor = raidTier >= 15 && eliteTypeCount >= 1 && eliteTypes.some((t) => parseFloat(t.score) >= 14.5 || parseFloat(String(t.tdo).replace(/,/g, "")) >= 375);

  const isBroadButNotDominant = eliteTypeCount >= 2 && eliteTypes.every((t) => parseFloat(t.score) >= 12) && !eliteTypes.some((t) => parseFloat(t.score) >= 14.5 || parseFloat(String(t.tdo).replace(/,/g, "")) >= 375);

  if (mon.name === current) {
    console.log("🔍 Elite Type Breakdown:");
    eliteTypes.forEach((t) => {
      console.log({
        type: t.type,
        score: parseFloat(t.score),
        tdo: parseFloat(String(t.tdo).replace(/,/g, "")),
        scoreRaw: t.score,
        tdoRaw: t.tdo,
      });
    });
    console.log("isRaidAnchor?", isRaidAnchor);
    console.log("isBroadButNotDominant?", isBroadButNotDominant);
  }

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

const calculateTrashability = (mon) => {
  const pvp = pvpScore(mon.leagues);
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

  if (pvp >= 15) anchors.push(tierRank.Reliable);
  else if (pvp >= 8) anchors.push(tierRank.Useful);

  if (totalRaid >= 36) {
    console.log("totalRaid >= 36");
    anchors.push(tierRank.Essential);
  
  }  else if (totalRaid >= 30) anchors.push(tierRank.Valuable);
  else if (totalRaid >= 20) anchors.push(tierRank.Reliable);
  else if (totalRaid >= 10) anchors.push(tierRank.Useful);

  if (defense >= 5) anchors.push(tierRank.Useful);
  else if (defense >= 3) anchors.push(tierRank.Niche);

  let baseRank = Math.max(...anchors, tierRank.Trash);
  if (legacy >= 5 || unique >= 5) {
    if (baseRank < tierRank.Valuable) baseRank++;
  }

  const overrideTier = roleDominanceTier(mon);
  if (overrideTier && overrideTier > baseRank) baseRank = overrideTier;

  if (baseRank === tierRank.Essential && (mon.recommendedCount ?? 0) === 0) {
    if (mon.name === `${current}`) {
      console.log(`🧪 Debug: ${current} -marked Valuable due to recommendedCount 0`);
    }
    baseRank = tierRank.Valuable;
  }

  if (isOnlyCupRelevant(mon)) {
    baseRank = Math.min(baseRank, tierRank.Useful);
  }

  const finalTier = rankToTier[baseRank];

  if (mon.name === `${current}`) {
    console.log(`🧪 Debug: ${current}`);
    console.log("PvP Score:", pvp);
    console.log("Raid Tier Score:", raidTier);
    console.log("Raid Type Coverage:", raidType);
    console.log("Raid Move Diversity:", raidMoves);
    console.log("Total Raid:", totalRaid);
    console.log("Defense Score:", defense);
    console.log("Legacy Score:", legacy);
    console.log("Uniqueness Score:", unique);
    console.log("Role Dominance Tier:", overrideTier, rankToTier[overrideTier]);
  }

  return {
    trashabilityScore: baseRank * 10,
    trashability: finalTier,
  };
};

const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
const updated = data.map((mon) => {
  const rating = calculateTrashability(mon);
  if (mon.name === `${current}`) {
    console.log(`DEBUG: ${current} →`, rating);
  }
  return {
    ...mon,
    trashabilityScore: rating.trashabilityScore,
    trashability: rating.trashability,
  };
});

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updated, null, 2));
console.log(`✅ Updated ${updated.length} Pokémon → saved to ${path.basename(OUTPUT_PATH)}`);
