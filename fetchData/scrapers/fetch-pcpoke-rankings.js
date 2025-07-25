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
  little_element: {
    url: "https://pvpoke.com/data/rankings/element/overall/rankings-500.json",
  },
  hisui: {
    url: "https://pvpoke.com/data/rankings/hisui/overall/rankings-1500.json",
  },
  sunshine: {
    url: "https://pvpoke.com/data/rankings/sunshine/overall/rankings-1500.json",
  },
  aurora: {
    url: "https://pvpoke.com/data/rankings/aurora/overall/rankings-1500.json",
  },
  onyx: {
    url: "https://pvpoke.com/data/rankings/onyx/overall/rankings-1500.json",
  },
  battlefrontierultra: {
    url: "https://pvpoke.com/data/rankings/battlefrontierultra/overall/rankings-2500.json",
  },
  battlefrontiermaster: {
    url: "https://pvpoke.com/data/rankings/battlefrontiermaster/overall/rankings-10000.json",
  },
  ascension: {
    url: "https://pvpoke.com/data/rankings/ascension/overall/rankings-1500.json",
  },
  devonchampionship: {
    url: "https://pvpoke.com/data/rankings/devonchampionship/overall/rankings-1500.json",
  },
  pillar2: {
    url: "https://pvpoke.com/data/rankings/pillar2/overall/rankings-1500.json",
  },
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
