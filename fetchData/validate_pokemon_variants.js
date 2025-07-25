const fs = require("fs");
const path = require("path");

// Load files
const STATS_PATH = path.resolve(__dirname, "outputs/pokemon_stats.json");
const TYPES_PATH = path.resolve(__dirname, "outputs/pogoapi_data/pokemon_types.json");
const VARIANTS_PATH = path.resolve(__dirname, "outputs/pokemon-variants-with-candy.json");
const CLEANED_OUTPUT = path.resolve(__dirname, "outputs/pokemon-variants-validated.json");
const REMOVED_OUTPUT = path.resolve(__dirname, "outputs/removed_pokemon_names.json");

// Helpers
function normalize(form) {
  return (form || "Normal").trim().toLowerCase();
}

function makeKey(id, form) {
  return `${parseInt(id)}:::${normalize(form)}`;
}

function loadJson(p) {
  if (!fs.existsSync(p)) throw new Error(`❌ Missing: ${p}`);
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function getStatSignature(entry) {
  return `${entry.base_attack}-${entry.base_defense}-${entry.base_stamina}`;
}

function getTypeSignature(types) {
  return types ? types.sort().join("-") : "";
}

function isSpecialForm(form) {
  const normalizedForm = normalize(form);
  return normalizedForm.includes("shadow") || normalizedForm.includes("mega") || normalizedForm.includes("gigantamax") || normalizedForm.includes("gigamax");
}

function main() {
  const stats = loadJson(STATS_PATH);
  const types = loadJson(TYPES_PATH);
  const variants = loadJson(VARIANTS_PATH);

  const validStats = new Set();

  // Create maps for stats and types
  const statsMap = new Map(); // key -> {attack, defense, stamina}
  const typesMap = new Map(); // key -> [type1, type2]

  // Build stats and types maps
  for (const stat of stats) {
    const key = makeKey(stat.pokemon_id, stat.form);
    statsMap.set(key, {
      attack: stat.base_attack,
      defense: stat.base_defense,
      stamina: stat.base_stamina,
    });
  }

  for (const typeEntry of types) {
    const key = makeKey(typeEntry.pokemon_id, typeEntry.form);
    typesMap.set(key, typeEntry.type);
  }

  // Group by pokemon_id to find duplicates with same stats AND types
  const pokemonGroups = {};

  for (const entry of stats) {
    const pokemonId = parseInt(entry.pokemon_id);
    const statSig = getStatSignature(entry);
    const key = makeKey(entry.pokemon_id, entry.form);
    const typeData = typesMap.get(key) || [];
    const typeSig = getTypeSignature(typeData);
    const combinedSig = `${statSig}|${typeSig}`;

    if (!pokemonGroups[pokemonId]) pokemonGroups[pokemonId] = {};
    if (!pokemonGroups[pokemonId][combinedSig]) pokemonGroups[pokemonId][combinedSig] = [];
    pokemonGroups[pokemonId][combinedSig].push(entry);
  }

  // Determine which forms to keep
  for (const pokemonId in pokemonGroups) {
    for (const combinedSig in pokemonGroups[pokemonId]) {
      const formsWithSameStatsAndTypes = pokemonGroups[pokemonId][combinedSig];

      if (formsWithSameStatsAndTypes.length === 1) {
        // Only one form with these stats+types, keep it
        const entry = formsWithSameStatsAndTypes[0];
        validStats.add(makeKey(entry.pokemon_id, entry.form));
      } else {
        // Multiple forms with same stats+types, apply priority logic
        let selectedForm = null;

        // Priority 1: Special forms (mega, shadow, gigantamax) - keep all
        const specialForms = formsWithSameStatsAndTypes.filter((entry) => isSpecialForm(entry.form));
        for (const specialForm of specialForms) {
          validStats.add(makeKey(specialForm.pokemon_id, specialForm.form));
        }

        // Priority 2: For non-special forms, prefer "normal" form if it exists
        const nonSpecialForms = formsWithSameStatsAndTypes.filter((entry) => !isSpecialForm(entry.form));
        if (nonSpecialForms.length > 0) {
          const normalForm = nonSpecialForms.find((entry) => normalize(entry.form) === "normal");
          if (normalForm) {
            selectedForm = normalForm;
          } else {
            // If no normal form, keep the first non-special form alphabetically
            selectedForm = nonSpecialForms.sort((a, b) => a.form.localeCompare(b.form))[0];
          }

          if (selectedForm) {
            validStats.add(makeKey(selectedForm.pokemon_id, selectedForm.form));
          }
        }
      }
    }
  }

  const cleaned = [];
  const removedNames = [];

  for (const variant of variants) {
    const key = makeKey(variant.id, variant.form);

    // Check if this variant is in our valid set, or if it's a special form that should always be allowed
    const isValid = validStats.has(key) || isSpecialForm(variant.form);

    if (isValid) {
      cleaned.push(variant);
    } else {
      removedNames.push(variant.name);
    }
  }

  fs.writeFileSync(CLEANED_OUTPUT, JSON.stringify(cleaned, null, 2));
  fs.writeFileSync(REMOVED_OUTPUT, JSON.stringify(removedNames, null, 2));

  console.log(`✅ Cleaned: ${cleaned.length}`);
  console.log(`❌ Removed: ${removedNames.length}`);
  console.log(`📝 Saved cleaned list to: ${CLEANED_OUTPUT}`);
  console.log(`📝 Saved removed names to: ${REMOVED_OUTPUT}`);
}

main();
