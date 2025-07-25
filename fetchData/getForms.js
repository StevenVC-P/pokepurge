const axios = require("axios");
const fs = require("fs");

async function fetchAllFormSuffixes() {
  try {
    const url = "https://pogoapi.net/api/v1/pokemon_forms.json";
    const { data } = await axios.get(url);

    const uniqueForms = new Set();

    Object.values(data).forEach((entry) => {
      const raw = entry.form_name?.trim() || entry.form?.trim();
      if (raw && raw.toLowerCase() !== "normal") {
        uniqueForms.add(raw);
      }
    });

    const sortedForms = [...uniqueForms].sort();

    // Print results
    console.log("✅ Unique Form Suffixes:\n");
    sortedForms.forEach((form) => console.log(form));

    // Save to file
    fs.writeFileSync("pogo_unique_forms.json", JSON.stringify(sortedForms, null, 2));
    console.log(`\n✅ Saved ${sortedForms.length} unique forms to pogo_unique_forms.json`);
  } catch (err) {
    console.error("❌ Failed to fetch or process form data:", err.message);
  }
}

fetchAllFormSuffixes();
