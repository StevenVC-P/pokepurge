const fs = require("fs");
const axios = require("axios");

async function fetchJSON(url, filename) {
  const res = await axios.get(url);
  fs.writeFileSync(filename, JSON.stringify(res.data, null, 2));
  console.log(`✅ Saved ${filename}`);
  return res.data;
}

function extractForms(formEntries) {
  const mega = [];
  const gmax = [];

  for (const entry of Object.values(formEntries)) {
    const form = entry.form || "";
    if (form.toLowerCase().startsWith("mega")) mega.push(entry);
    if (form.toLowerCase() === "gigantamax") gmax.push(entry);
  }

  return { mega, gmax };
}

async function main() {
  const forms = await fetchJSON("https://pogoapi.net/api/v1/pokemon_forms.json", "pokemon_forms.json");
  const shadow = await fetchJSON("https://pogoapi.net/api/v1/shadow_pokemon.json", "shadow_pokemon.json");
  const types = await fetchJSON("https://pogoapi.net/api/v1/pokemon_types.json", "pokemon_types.json");

  const { mega, gmax } = extractForms(forms);
  fs.writeFileSync("mega_forms.json", JSON.stringify(mega, null, 2));
  fs.writeFileSync("gigantamax_forms.json", JSON.stringify(gmax, null, 2));
  fs.writeFileSync("pokemon_types.json", JSON.stringify(types, null, 2));

  console.log(`\n📊 Summary:`);
  console.log(`   🔹 Mega forms: ${mega.length}`);
  console.log(`   🔹 Gigantamax forms: ${gmax.length}`);
  console.log(`   🔹 Shadow forms: ${Object.keys(shadow).length}`);
}

main().catch(console.error);
