const axios = require("axios");
const fs = require("fs");
const path = require("path");

async function fetchAllPokemonNames() {
  try {
    const response = await axios.get("https://pokeapi.co/api/v2/pokemon?limit=100000");
    const names = response.data.results.map((p) => p.name);

    const outputPath = path.resolve(__dirname, "pokemon_names.txt");
    fs.writeFileSync(outputPath, names.join("\n"), "utf-8");

    console.log(`✅ Saved ${names.length} Pokémon names to ${outputPath}`);
  } catch (err) {
    console.error("❌ Failed to fetch Pokémon names:", err.message);
  }
}

fetchAllPokemonNames();
