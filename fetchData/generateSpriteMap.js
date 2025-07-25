const fs = require("fs");
const path = require("path");

// Load your Pokémon list
const pokemonData = require("../src/data/pokemon.json");

// Initialize sprite map
const spriteMap = {};

const regionalFormMap = {
  Alolan: "alola",
  Galarian: "galar",
  Hisuian: "hisui",
  Paldean: "paldea",
};

pokemonData.forEach((mon) => {
  const name = mon.name;
  const baseName = name.replace(/\s*\(Shadow\)/i, "");
  const form = mon.form;
  const id = mon.id;

  // Skip if no visual representation is wanted
  if (mon.trashability === "Trash" && mon.recommendedCount === 0) return;

  // Create entries for both the full name and base name for better lookup
  const keys = [name, baseName];

  keys.forEach((key) => {
    if (!spriteMap[key]) {
      spriteMap[key] = {};
    }
  });

  let url = "";

  if (form === "normal" || form === "Normal") {
    url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  } else if (regionalFormMap[form]) {
    const region = regionalFormMap[form];
    url = `https://play.pokemonshowdown.com/sprites/ani/${baseName.toLowerCase()}-${region}.gif`;
  } else if (form.includes("Mega")) {
    // For Mega forms, try to use the base sprite for now
    url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  } else {
    url = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
  }

  // Store under multiple keys for better lookup
  keys.forEach((key) => {
    spriteMap[key][form] = url;
    // Also store under normalized form names
    if (form === "normal" || form === "Normal") {
      spriteMap[key][""] = url; // Empty string for normal form
      spriteMap[key]["normal"] = url;
      spriteMap[key]["Normal"] = url;
    }
  });
});

// Write to file
const outputPath = path.join(__dirname, "../src/data/spriteMap.json");
fs.writeFileSync(outputPath, JSON.stringify(spriteMap, null, 2));
console.log("✅ spriteMap.json has been generated!");
