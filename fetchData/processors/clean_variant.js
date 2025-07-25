// clean_variants.js
const fs = require("fs");
const path = require("path");

const INPUT_FILE = path.resolve(__dirname, "../outputs/pokemon-variants-raw.json");
const OUTPUT_FILE = path.resolve(__dirname, "../outputs/pokemon-variants.json");
const RULESET_PATH = path.resolve(__dirname, "../config/ruleset.json");
const CATEGORIES_PATH = path.resolve(__dirname, "../config/form_categories.json");

const ruleset = JSON.parse(fs.readFileSync(RULESET_PATH, "utf-8"));
const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, "utf-8"));

const whitelistPatterns = Object.entries(categories.SPECIAL_FORM_WHITELIST).map(([key, ids]) => {
  const pattern = key.replace(/_/g, "[\\s_\\-]*");
  return { key, regex: new RegExp(pattern, "gi"), ids: new Set(ids) };
});

function extractBaseName(name, form = "", id) {
  const formAliases = {
    Alola: "Alolan",
    Galarian: "Galarian",
    Hisuian: "Hisuian",
    Paldea: "Paldean",
    Mega_X: "Mega X",
    Mega_Y: "Mega Y",
    Apex_Shadow: "Apex",
    Origin_Shadow: "Origin",
    Standard_Shadow: "Standard",
    Galarian_Zen_Shadow: "Zen",
    Galarian_Standard_Shadow: "Standard",
    Shadow_Rider: "Shadow",
    Ice_Rider: "Ice",
  };

  const extraFragments = ["Shadow", "Mega", "Mega X", "Mega Y", "Gigantamax", "Alolan", "Alola", "Galarian", "Galar", "Hisuian", "Hisui", "Paldean", "Paldea", "Apex", "Origin", "Standard", "Complete", "Forme", "Ultra", "Therian", "Incarnate", "Attack", "Defense", "Speed", "Normal", "Rider"];

  let result = name;

  // Reorder "Alolan Shadow" → "Shadow Alolan"
  result = result.replace(/\b(Galarian|Alolan|Hisuian|Paldean)\s+(Shadow)\b/gi, "$2 $1");

  // Normalize form for pattern matching
  const normalizedForm = formAliases[form] || form;
  const normalizedTokens = new Set();

  // Break multi-part forms into normalized tokens
  normalizedForm.split(/[_\-\s]/).forEach((part) => {
    const alias = formAliases[part] || part;
    if (alias) normalizedTokens.add(alias.toLowerCase());
  });

  // Also use the form itself (raw) as a fallback match
  normalizedTokens.add(form.toLowerCase());

  // Remove form tokens from the name
  let nameWords = result.split(/\s+/);
  nameWords = nameWords.filter((word) => !normalizedTokens.has(word.toLowerCase()));

  // Remove extraFragments (clean-up step)
  nameWords = nameWords.filter((word) => !extraFragments.includes(word));

  result = nameWords.join(" ").trim();

  // Final cleanups
  result = result
    .replace(/\(.*?\)/g, "")
    .replace(/\b(Forme|Form|Mode|Size|Apex)\b/gi, "")
    .replace(/[^a-zA-Z0-9\s'.:♀♂é\-]/g, "")
    .replace(/\s{2,}/g, " ")
    .replace(/^N\s+/i, "")
    .replace(/\bTauros\b\s+\bTauros\b/, "Tauros")
    .trim();

  // Capitalize
  if (result.length >= 1) {
    result = result[0].toUpperCase() + result.slice(1);
  }

  return result;
}

function process() {
  const raw = JSON.parse(fs.readFileSync(INPUT_FILE, "utf-8"));
  const cleaned = raw.map((entry) => ({
    ...entry,
    base: extractBaseName(entry.name, entry.form, entry.id),
    trashability: "Replaceable",
    recommendedCount: 1,
  }));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(cleaned, null, 2));
  console.log(`✅ Cleaned ${cleaned.length} entries.`);
}

process();
