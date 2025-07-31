/**
 * PVPOKE DATA MERGER
 *
 * This script merges Pokemon data from multiple sources to create a comprehensive dataset:
 * - PokemonMaster_updated.json: Base Pokemon data with stats and moves
 * - pokemon-pvpoke-conversion.json: Mapping between our naming and PvPoke IDs
 * - pokemon_types.json: Type information for each Pokemon form
 * - rankings/*.json: League performance data from PvPoke simulations
 *
 * DATA FLOW:
 * 1. Load base Pokemon data and create lookup maps
 * 2. Process each league ranking file to extract performance scores
 * 3. Match Pokemon using conversion mapping (handles form variations)
 * 4. Merge type information using Pokemon ID and form
 * 5. Combine all data into comprehensive Pokemon objects
 * 6. Output condensed meta dataset for trashability analysis
 *
 * WHY THIS APPROACH:
 * - PvPoke provides the most accurate league performance simulations
 * - Multiple data sources ensure comprehensive coverage
 * - Conversion mapping handles naming inconsistencies between sources
 * - Type data is essential for weakness analysis and meta typing logic
 */

const fs = require("fs");
const path = require("path");

// INPUT DATA SOURCES
const MASTER_PATH = path.resolve(__dirname, "../outputs/PokemonMaster_updated.json");
const CONVERSION_PATH = path.resolve(__dirname, "../outputs/pokemon-pvpoke-conversion.json");
const TYPES_PATH = path.resolve(__dirname, "../outputs/pogoapi_data/pokemon_types.json");
const RANKINGS_DIR = path.resolve(__dirname, "../outputs/rankings");
const OUTPUT_PATH = path.resolve(__dirname, "../outputs/pokemon-condensed-meta.json");

// Load all data sources
const masterList = JSON.parse(fs.readFileSync(MASTER_PATH, "utf8"));
const conversionList = JSON.parse(fs.readFileSync(CONVERSION_PATH, "utf8"));
const typesData = JSON.parse(fs.readFileSync(TYPES_PATH, "utf8"));

// Get all league ranking files for processing
const rankingsFiles = fs.readdirSync(RANKINGS_DIR).filter((f) => f.endsWith(".json"));

/**
 * LOOKUP MAP CREATION
 * These maps enable efficient data matching across different naming conventions
 */

// Build lookup from our name/base/form to PvPoke species ID
// WHY: Different data sources use different naming conventions for Pokemon forms
// This conversion map ensures we can match Pokemon across all sources
const conversionMap = new Map();
for (const entry of conversionList) {
  const key = `${entry.ourBase}|${entry.ourForm}`;
  conversionMap.set(key, entry.pvpokeSpeciesId);
}

// Build types lookup from pokemon_id and form to types array
// WHY: Type information is crucial for weakness analysis and meta typing logic
// Must handle form variations (normal, shadow, mega, etc.)
const typesMap = new Map();
for (const typeEntry of typesData) {
  // Store both original form and common variations for better matching
  const originalForm = typeEntry.form || "normal";
  const key = `${typeEntry.pokemon_id}|${originalForm}`;
  typesMap.set(key, typeEntry.type);

  // Also add common case variations to improve matching
  if (originalForm !== "normal") {
    const variations = [originalForm.toLowerCase(), originalForm.charAt(0).toUpperCase() + originalForm.slice(1).toLowerCase(), originalForm.charAt(0).toLowerCase() + originalForm.slice(1)];

    variations.forEach((variation) => {
      if (variation !== originalForm) {
        const varKey = `${typeEntry.pokemon_id}|${variation}`;
        typesMap.set(varKey, typeEntry.type);
      }
    });
  }
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

  // Get types for this Pokemon with smart fallback logic
  const typesKey = `${mon.id}|${mon.form}`;
  let types = typesMap.get(typesKey);

  // If no types found, try intelligent fallback
  if (!types) {
    const form = mon.form.toLowerCase();

    // Try case variations first (e.g., "Crowned_Sword" vs "Crowned_sword")
    const caseVariations = [`${mon.id}|${mon.form.toLowerCase()}`, `${mon.id}|${mon.form.charAt(0).toUpperCase() + mon.form.slice(1).toLowerCase()}`, `${mon.id}|${mon.form.charAt(0).toLowerCase() + mon.form.slice(1)}`];

    for (const variation of caseVariations) {
      types = typesMap.get(variation);
      if (types) break;
    }

    // For Shadow forms, try the base form without "Shadow"
    if (!types && form.includes("shadow")) {
      const baseForm = mon.form.replace(/_?shadow/gi, "").replace(/^_|_$/g, "") || "normal";
      const shadowFallbacks = [`${mon.id}|${baseForm}`, `${mon.id}|${baseForm.toLowerCase()}`, `${mon.id}|${baseForm.charAt(0).toUpperCase() + baseForm.slice(1).toLowerCase()}`];

      for (const fallback of shadowFallbacks) {
        types = typesMap.get(fallback);
        if (types) break;
      }
    }

    // For special forms, try to find the base regional variant
    if (!types && (form.includes("shadow") || form.includes("mega") || form.includes("gigantamax"))) {
      // Try regional variants first
      const regionalPrefixes = ["alola", "galar", "galarian", "hisui", "hisuian", "paldean"];

      for (const prefix of regionalPrefixes) {
        if (form.includes(prefix)) {
          // Try the regional form without the special suffix
          const regionalKey = `${mon.id}|${prefix === "galarian" ? "Galarian" : prefix.charAt(0).toUpperCase() + prefix.slice(1)}`;
          types = typesMap.get(regionalKey);
          if (types) break;
        }
      }
    }

    // If still no types, fall back to normal form
    if (!types) {
      const normalFallbacks = [`${mon.id}|normal`, `${mon.id}|Normal`, `${mon.id}|`];

      for (const fallback of normalFallbacks) {
        types = typesMap.get(fallback);
        if (types) break;
      }
    }
  }

  // Final fallback to empty array
  types = types || [];

  final.push({
    id: mon.id,
    name: mon.name,
    base: mon.base,
    form: mon.form,
    types: types,
    candy: mon.candy,
    dynamax: mon.dynamax,
    trashability: mon.trashability,
    recommendedCount: mon.recommendedCount,
    url: mon.url,
    raidTier: mon.raidTier,
    defenderTier: mon.defenderTier,
    bestTypes: mon.bestTypes,
    leagues,
  });
}

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(final, null, 2));
console.log(`✅ Output written to ${OUTPUT_PATH}`);
