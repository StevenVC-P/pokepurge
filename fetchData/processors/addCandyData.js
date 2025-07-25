const fs = require("fs");
const axios = require("axios");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../outputs/pokemon-variants.json");
const OUTPUT_PATH = path.resolve(__dirname, "../outputs/pokemon-variants-with-candy.json");

const nameFixMapPath = path.resolve(__dirname, "../outputs/nameFixMap.json");
const { nameFixMap } = JSON.parse(fs.readFileSync(nameFixMapPath, "utf-8"));

const variants = JSON.parse(fs.readFileSync(INPUT_PATH, "utf-8"));

// Cache to avoid redundant API calls
const candyCache = {};

// Utility to pause (to respect rate limits)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getCandyName(baseName) {
  const normalized = nameFixMap[baseName] || baseName.toLowerCase();

  if (candyCache[normalized]) return candyCache[normalized];

  try {
    const speciesRes = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${normalized}`);

    const evoChainUrl = speciesRes.data.evolution_chain.url;

    const evoRes = await axios.get(evoChainUrl);
    const rootSpecies = evoRes.data.chain.species.name;

    const candyName = capitalize(rootSpecies);
    candyCache[normalized] = candyName;
    await sleep(200);
    return candyName;
  } catch (err) {
    console.log("baseName", baseName);
    console.log("normalized", normalized);
    console.warn(`⚠️ Failed to fetch candy for ${baseName}:`, err.response?.status || err.message);
    return null;
  }
}
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

(async () => {
  // Check if output already exists
  if (fs.existsSync(OUTPUT_PATH)) {
    console.log(`✅ Output already exists: ${OUTPUT_PATH}`);
    return;
  }

  for (const variant of variants) {
    const base = variant.base;
    const candy = await getCandyName(base);
    variant.candy = candy || "Unknown Candy";
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(variants, null, 2));
  console.log(`✅ Candy names added to ${OUTPUT_PATH}`);
})();
