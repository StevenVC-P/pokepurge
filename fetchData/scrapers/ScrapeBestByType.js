const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const fs = require("fs");
const path = require("path");

puppeteer.use(StealthPlugin());

const types = ["normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost", "steel", "fire", "water", "grass", "electric", "psychic", "ice", "dragon", "dark", "fairy"];

(async () => {
  console.log("🌐 Launching browser...");
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36");

  const results = [];

  for (const type of types) {
    const url = `https://db.pokemongohub.net/pokemon-list/best-per-type/${type}`;
    console.log(`🌍 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 0 });

    console.log(`⏳ Waiting for ${type} data to render...`);
    await new Promise((resolve) => setTimeout(resolve, 8000));

    const data = [];
    let pageIndex = 1;

    while (true) {
      console.log(`🔍 Extracting page ${pageIndex} for type: ${type}...`);
      const pageData = await page.evaluate((type) => {
        const rows = document.querySelectorAll("section.DataGrid_dataGridWrapper__G48Cu tbody tr");
        const parsed = [];

        rows.forEach((row) => {
          const columns = row.querySelectorAll("td");

          const rank = columns[0]?.textContent?.trim();
          const name = columns[1]?.textContent?.trim();
          const fastMove = columns[2]?.textContent?.trim();
          const chargeMove = columns[3]?.textContent?.trim();
          const dps = columns[4]?.textContent?.trim();
          const tdo = columns[5]?.textContent?.trim();
          const score = columns[6]?.textContent?.trim();

          if (name && rank) {
            parsed.push({ type, rank, name, fastMove, chargeMove, dps, tdo, score });
          }
        });

        return parsed;
      }, type);

      data.push(...pageData);

      const nextButton = await page.$("button:has(img[src*='chevron-right.svg'])");
      const isDisabled = await page.evaluate((el) => el.disabled, nextButton);

      if (!nextButton || isDisabled) break;
      await nextButton.click();
      await new Promise((resolve) => setTimeout(resolve, 3000));
      pageIndex++;
    }

    console.log(`📦 Found ${data.length} total entries for ${type}`);
    results.push(...data);
  }

  const outputPath = path.resolve(__dirname, "../outputs/best-per-type.json");
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`✅ Scraped and saved all type data to ${outputPath}`);

  await browser.close();
})();
