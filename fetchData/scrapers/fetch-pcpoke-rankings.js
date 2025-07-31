const axios = require("axios");
const fs = require("fs");
const path = require("path");

const RANKINGS_DIR = path.join(__dirname, "../outputs/rankings");

const leagues = {
  great: {
    url: "https://pvpoke.com/data/rankings/all/overall/rankings-1500.json",
  },
  ultra: {
    url: "https://pvpoke.com/data/rankings/all/overall/rankings-2500.json",
  },
  master: {
    url: "https://pvpoke.com/data/rankings/all/overall/rankings-10000.json",
  },
  // Non-official leagues removed to reduce data size and processing time
};
async function fetchAndSave(league, url) {
  const filepath = path.join(RANKINGS_DIR, `${league}.json`);
  try {
    const { data } = await axios.get(url);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    console.log(`✅ Saved: ${filepath}`);
  } catch (err) {
    console.error(`❌ Failed to fetch ${league}: ${err.message}`);
  }
}

(async () => {
  if (!fs.existsSync(RANKINGS_DIR)) fs.mkdirSync(RANKINGS_DIR);

  for (const [league, { url }] of Object.entries(leagues)) {
    await fetchAndSave(league, url);
  }

  console.log("🎉 All leagues fetched.");
})();
