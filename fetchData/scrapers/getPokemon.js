// scrape_variants.js
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");

puppeteer.use(StealthPlugin());

const BASE_URL = "https://db.pokemongohub.net/pokemon/";
const RAW_OUTPUT_FILE = path.resolve(__dirname, "../outputs/pokemon-variants-raw.json");
const SUFFIX_TRACKER_FILE = path.resolve(__dirname, "../outputs/form-suffix-tracker.json");

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

async function scrapeAllVariants() {
  const existing = fs.existsSync(RAW_OUTPUT_FILE) ? JSON.parse(fs.readFileSync(RAW_OUTPUT_FILE, "utf-8")) : [];
  const seenKeys = new Set(existing.map(getKey));
  const results = [...existing];

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  for (let id = 1; id <= 1025; id++) {
    const specialForms = (SPECIAL_FORM_WHITELIST_BY_ID[id] || []).map((s) => [s]);
    const formCombos = [[], ...SHADOW_SUFFIXES.map((s) => [s]), ...MEGA_SUFFIXES.map((s) => [s]), ...GIGANTAMAX_SUFFIXES.map((s) => [s]), ...specialForms];

    for (let suffixes of formCombos) {
      const formKey = `${id}-${suffixes.join("_")}`;
      if (seenKeys.has(formKey)) continue;

      console.log(`🔎 Scraping ${formKey}`);
      const entry = await scrapeOne(page, id, suffixes);
      if (entry) {
        results.push(entry);
        seenKeys.add(formKey);
        fs.writeFileSync(RAW_OUTPUT_FILE, JSON.stringify(results, null, 2));
        fs.writeFileSync(SUFFIX_TRACKER_FILE, JSON.stringify(suffixTracker, null, 2));
      }
    }

    await new Promise((res) => setTimeout(res, 500));
  }

  await browser.close();
  console.log(`✅ Finished scraping. Total: ${results.length}`);
}

scrapeAllVariants();
