// scrape_variants.js
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");

puppeteer.use(StealthPlugin());

const BASE_URL = "https://db.pokemongohub.net/pokemon/";
const RAW_OUTPUT_FILE = path.resolve(__dirname, "../outputs/pokemon-variants-raw.json");
const SUFFIX_TRACKER_FILE = path.resolve(__dirname, "../outputs/form-suffix-tracker.json");
const PROGRESS_FILE = path.resolve(__dirname, "../outputs/pokemon-scraping-progress.json");

const RULESET_PATH = path.resolve(__dirname, "../config/ruleset.json");
const CATEGORIES_PATH = path.resolve(__dirname, "../config/form_categories.json");

const ruleset = JSON.parse(fs.readFileSync(RULESET_PATH, "utf-8"));
const categories = JSON.parse(fs.readFileSync(CATEGORIES_PATH, "utf-8"));

const TRACKED_CATEGORIES = new Set(ruleset.rules.tracked_categories);
const suffixTracker = {};

const SHADOW_SUFFIXES = categories.shadow;
const MEGA_SUFFIXES = categories.mega || [];
const GIGANTAMAX_SUFFIXES = categories.gigantamax || [];

const SPECIAL_FORM_WHITELIST_BY_ID = reverseWhitelist(categories.SPECIAL_FORM_WHITELIST);

function reverseWhitelist(suffixMap) {
  const reversed = {};
  for (const [suffix, ids] of Object.entries(suffixMap)) {
    for (const id of ids) {
      if (!reversed[id]) reversed[id] = [];
      reversed[id].push(suffix);
    }
  }
  return reversed;
}

function getKey(entry) {
  return `${entry.id}-${entry.form}`;
}

function getCategory(form) {
  for (const [category, suffixes] of Object.entries(categories)) {
    if (Array.isArray(suffixes) && suffixes.includes(form)) return category;
  }
  return null;
}

function buildSuffixString(suffixes) {
  return suffixes.length ? `-${suffixes.join("_")}` : "";
}

async function scrapeOne(page, id, suffixes) {
  const suffixString = buildSuffixString(suffixes);
  const url = `${BASE_URL}${id}${suffixString}`;

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    const content = await page.content();
    if (content.includes("Pokémon not available yet")) return null;

    const result = await page.evaluate(() => {
      const titleEl = document.querySelector("h1");
      const title = titleEl?.innerText?.trim() || null;
      const section = Array.from(document.querySelectorAll("h2, h3")).find((el) => el.innerText?.includes("Dynamax"));
      const para = section?.nextElementSibling?.innerText || "";
      const canDynamax = para.toLowerCase().includes("can dynamax in pokémon go");

      return { name: title, canDynamax };
    });

    if (!result.name || !result.name.match(/[a-zA-Z]/)) throw new Error("Invalid name extracted");

    const form = suffixes.length > 0 ? suffixes.join("_") : "normal";
    const cat = getCategory(form);
    if (cat && TRACKED_CATEGORIES.has(cat)) {
      if (!suffixTracker[form]) suffixTracker[form] = [];
      suffixTracker[form].push(id);
    }

    return {
      id,
      name: result.name,
      form,
      dynamax: result.canDynamax,
      url,
    };
  } catch (err) {
    console.warn(`⚠️ Failed on ${url}:`, err.message);
    return null;
  }
}

// Progress tracking functions
function saveProgress(currentId, results) {
  const progress = {
    lastProcessedId: currentId,
    totalResults: results.length,
    timestamp: new Date().toISOString(),
    completed: currentId >= 1025,
  };
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    try {
      const progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
      console.log(`📋 Resuming from Pokemon ID ${progress.lastProcessedId + 1} (${progress.totalResults} results so far)`);
      return progress.lastProcessedId;
    } catch (err) {
      console.warn("⚠️ Could not load progress, starting from beginning");
      return 0;
    }
  }
  return 0;
}

async function scrapeAllVariants() {
  const existing = fs.existsSync(RAW_OUTPUT_FILE) ? JSON.parse(fs.readFileSync(RAW_OUTPUT_FILE, "utf-8")) : [];
  const seenKeys = new Set(existing.map(getKey));
  const results = [...existing];

  // Load progress to resume from where we left off
  const startId = Math.max(1, loadProgress() + 1);
  console.log(`🚀 Starting Pokemon scraping from ID ${startId} to 1025`);

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Add error handling for browser crashes
  browser.on("disconnected", () => {
    console.log("⚠️ Browser disconnected, progress has been saved");
  });

  let id = startId;
  try {
    for (id = startId; id <= 1025; id++) {
      const specialForms = (SPECIAL_FORM_WHITELIST_BY_ID[id] || []).map((s) => [s]);
      const formCombos = [[], ...SHADOW_SUFFIXES.map((s) => [s]), ...MEGA_SUFFIXES.map((s) => [s]), ...GIGANTAMAX_SUFFIXES.map((s) => [s]), ...specialForms];

      let pokemonProcessed = false;
      for (let suffixes of formCombos) {
        const formKey = `${id}-${suffixes.join("_")}`;
        if (seenKeys.has(formKey)) continue;

        console.log(`🔎 Scraping ${formKey}`);
        const entry = await scrapeOne(page, id, suffixes);
        if (entry) {
          results.push(entry);
          seenKeys.add(formKey);
          pokemonProcessed = true;

          // Save progress after each successful scrape
          fs.writeFileSync(RAW_OUTPUT_FILE, JSON.stringify(results, null, 2));
          fs.writeFileSync(SUFFIX_TRACKER_FILE, JSON.stringify(suffixTracker, null, 2));
        }
      }

      // Save progress after completing each Pokemon ID
      if (pokemonProcessed || id % 10 === 0) {
        saveProgress(id, results);
      }

      // Progress reporting
      if (id % 50 === 0) {
        const progress = (((id - startId + 1) / (1025 - startId + 1)) * 100).toFixed(1);
        console.log(`📊 Progress: ${progress}% (${id}/1025) - ${results.length} total results`);
      }

      await new Promise((res) => setTimeout(res, 500));
    }
  } catch (error) {
    console.error(`❌ Error during scraping at ID ${id}:`, error.message);
    saveProgress(id - 1, results); // Save progress before the failed ID
    throw error;
  } finally {
    await browser.close();
  }

  // Mark as completed
  saveProgress(1025, results);
  console.log(`✅ Finished scraping. Total: ${results.length}`);
}

scrapeAllVariants();
