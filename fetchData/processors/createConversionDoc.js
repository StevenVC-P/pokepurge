const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../outputs/pokemon-variants-validated.json");
const OUTPUT_PATH = path.resolve(__dirname, "../outputs/pokemon-pvpoke-conversion.json");
const OVERRIDES_PATH = path.resolve(__dirname, "../config/base-name-overrides.json");

// Load base name overrides
const baseOverrides = JSON.parse(fs.readFileSync(OVERRIDES_PATH, "utf8"));

function speciesIdFromMasterEntry(pokemon) {
  let base = pokemon.base.toLowerCase().trim();

  // Use override if present, otherwise strip non-alphanumerics
  base = baseOverrides[base] || base.replace(/[^a-z0-9]/g, "");

  const form = (pokemon.form || "").toLowerCase();
  const parts = form ? form.split("_") : [];

  let id = base;

  // Region-based suffix
  if (parts.includes("alola")) id += "_alolan";
  else if (parts.includes("galar") || parts.includes("galarian")) id += "_galarian";
  else if (parts.includes("hisui") || parts.includes("hisuian")) id += "_hisuian";

  // Append other forms (e.g., "dragon") only if they exist
  const specialExcludes = ["alola", "galar", "galarian", "hisui", "hisuian", "shadow", "normal"];
  const other = parts.filter((p) => !specialExcludes.includes(p));
  if (other.length > 0) {
    id += "_" + other.join("_");
  }

  // Always append _shadow last if applicable
  if (parts.includes("shadow")) {
    id += "_shadow";
  }

  return id;
}

function main() {
  const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));

  const output = data.map((entry) => ({
    pvpokeSpeciesId: speciesIdFromMasterEntry(entry),
    ourName: entry.name,
    ourBase: entry.base,
    ourForm: entry.form,
  }));

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`✅ Saved conversion map to: ${OUTPUT_PATH}`);
}

main();
