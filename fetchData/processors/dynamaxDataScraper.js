#!/usr/bin/env node

/**
 * Dynamax Data Scraper
 *
 * Scrapes Dynamax battle data from multiple sources to enhance:
 * - Recommended count calculations
 * - Trashability assessments
 * - AI analysis and notes
 * - UI effectiveness displays
 *
 * Focus: Tier 3+ Dynamax battles, type effectiveness, specific counters
 */

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cheerio = require("cheerio");

class DynamaxDataScraper {
  constructor() {
    this.sources = {
      pokemonGoHub: {
        baseUrl: "https://pokemongohub.net",
        searchPaths: ["/post/guide/how-to-beat-dynamax-", "/post/guide/how-to-beat-gigantamax-", "/post/guide/dynamax-", "/post/tag/max-battle/"],
      },
      gamePress: {
        baseUrl: "https://pokemongo.gamepress.gg",
        searchPaths: ["/p/dynamax-", "/raid-boss-list", "/comprehensive-dps-spreadsheet"],
      },
    };

    this.dynamaxData = {
      raids: {}, // Max Battle boss data with counters
      counters: {}, // What each Pokemon counters effectively (with types)
      vulnerabilities: {}, // What each Pokemon is vulnerable to (with types)
      typeEffectiveness: {}, // Max Battle type effectiveness chart
      metadata: {
        lastUpdated: new Date().toISOString(),
        sources: [],
        totalRaids: 0,
        totalCounters: 0,
      },
    };

    this.outputPath = path.join(__dirname, "../../public/data/dynamax-battle-data.json");

    // Type effectiveness chart for Pokemon GO
    this.typeChart = this.initializeTypeChart();
  }

  /**
   * Initialize Pokemon GO type effectiveness chart
   */
  initializeTypeChart() {
    return {
      // Super effective relationships (attacker type -> defender types)
      superEffective: {
        Fire: ["Grass", "Ice", "Bug", "Steel"],
        Water: ["Fire", "Ground", "Rock"],
        Electric: ["Water", "Flying"],
        Grass: ["Water", "Ground", "Rock"],
        Ice: ["Grass", "Ground", "Flying", "Dragon"],
        Fighting: ["Normal", "Ice", "Rock", "Dark", "Steel"],
        Poison: ["Grass", "Fairy"],
        Ground: ["Fire", "Electric", "Poison", "Rock", "Steel"],
        Flying: ["Electric", "Grass", "Fighting"],
        Psychic: ["Fighting", "Poison"],
        Bug: ["Grass", "Psychic", "Dark"],
        Rock: ["Fire", "Ice", "Flying", "Bug"],
        Ghost: ["Psychic", "Ghost"],
        Dragon: ["Dragon"],
        Dark: ["Psychic", "Ghost"],
        Steel: ["Ice", "Rock", "Fairy"],
        Fairy: ["Fighting", "Dragon", "Dark"],
      },
      // Not very effective relationships
      notVeryEffective: {
        Fire: ["Fire", "Water", "Rock", "Dragon"],
        Water: ["Water", "Grass", "Dragon"],
        Electric: ["Electric", "Grass", "Ground", "Dragon"],
        Grass: ["Fire", "Grass", "Poison", "Flying", "Bug", "Dragon", "Steel"],
        Ice: ["Fire", "Water", "Ice", "Steel"],
        Fighting: ["Poison", "Flying", "Psychic", "Bug", "Ghost", "Fairy"],
        Poison: ["Poison", "Ground", "Rock", "Ghost", "Steel"],
        Ground: ["Grass", "Bug", "Flying"],
        Flying: ["Electric", "Rock", "Steel"],
        Psychic: ["Psychic", "Steel"],
        Bug: ["Fire", "Fighting", "Poison", "Flying", "Ghost", "Steel", "Fairy"],
        Rock: ["Fighting", "Ground", "Steel"],
        Ghost: ["Dark"],
        Dragon: ["Steel"],
        Dark: ["Fighting", "Dark", "Fairy"],
        Steel: ["Fire", "Water", "Electric", "Steel"],
        Fairy: ["Fire", "Poison", "Steel"],
      },
    };
  }

  /**
   * Main scraping orchestrator
   */
  async scrapeAll() {
    console.log("🔥 Starting Max Battle Data Scraping...");
    console.log("📊 Target: Dynamax raids, type effectiveness, specific counters");
    console.log("-".repeat(60));

    try {
      // Scrape from reliable sources
      await this.scrapePokemonGoHub();
      await this.scrapeGamePress();

      // Process and enhance data
      await this.processTypeEffectiveness();
      await this.generateCounterMappings();
      await this.addTypeEffectivenessReasons();

      // Save results
      await this.saveData();

      console.log("\n✅ Max Battle data scraping complete!");
      this.generateSummaryReport();
    } catch (error) {
      console.error("❌ Error during scraping:", error.message);
      throw error;
    }
  }

  /**
   * Add type effectiveness reasoning to counter data
   */
  addTypeEffectivenessReasons() {
    console.log("⚙️  Adding type effectiveness explanations...");

    Object.keys(this.dynamaxData.raids).forEach((bossName) => {
      const boss = this.dynamaxData.raids[bossName];
      if (boss.counters) {
        boss.counters.forEach((counter) => {
          // Add type effectiveness explanation
          counter.typeReason = this.getTypeEffectivenessReason(counter.moveType, boss.types || this.inferBossTypes(bossName));
        });
      }
    });

    // Also add to vulnerability data
    Object.keys(this.dynamaxData.vulnerabilities).forEach((pokemonName) => {
      const vuln = this.dynamaxData.vulnerabilities[pokemonName];
      if (vuln.topCounters) {
        vuln.topCounters.forEach((counter) => {
          counter.typeReason = this.getTypeEffectivenessReason(counter.moveType, this.inferPokemonTypes(pokemonName));
        });
      }
    });

    console.log("  ✅ Added type effectiveness explanations");
  }

  /**
   * Get type effectiveness reasoning
   */
  getTypeEffectivenessReason(attackType, defenderTypes) {
    if (!attackType || !defenderTypes) return "";

    const superEffectiveAgainst = this.typeChart.superEffective[attackType] || [];
    const effectiveTypes = defenderTypes.filter((type) => superEffectiveAgainst.includes(type));

    if (effectiveTypes.length > 0) {
      return `${attackType} beats ${effectiveTypes.join("/")}`;
    }

    return `${attackType} type move`;
  }

  /**
   * Infer Pokemon types from name (fallback method)
   */
  inferPokemonTypes(pokemonName) {
    // Common type mappings for major raid bosses
    const typeMap = {
      Charizard: ["Fire", "Flying"],
      Blastoise: ["Water"],
      Venusaur: ["Grass", "Poison"],
      Raikou: ["Electric"],
      Moltres: ["Fire", "Flying"],
      Articuno: ["Ice", "Flying"],
      Zapdos: ["Electric", "Flying"],
      Latias: ["Dragon", "Psychic"],
      Latios: ["Dragon", "Psychic"],
    };

    return typeMap[pokemonName] || ["Normal"];
  }

  /**
   * Infer boss types from name
   */
  inferBossTypes(bossName) {
    return this.inferPokemonTypes(bossName);
  }

  /**
   * Scrape Pokemon GO Hub for Dynamax guides
   */
  async scrapePokemonGoHub() {
    console.log("🌐 Scraping Pokemon GO Hub...");

    try {
      // Get list of Dynamax guides
      const guidesResponse = await axios.get(`${this.sources.pokemonGoHub}/post/category/guide/`, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(guidesResponse.data);
      const dynamaxGuides = [];

      // Find Dynamax-related guide links
      $('a[href*="dynamax"], a[href*="max-battle"]').each((i, element) => {
        const href = $(element).attr("href");
        const title = $(element).text().trim();

        if (href && title && (title.includes("Dynamax") || title.includes("Max Battle"))) {
          dynamaxGuides.push({
            url: href.startsWith("http") ? href : `${this.sources.pokemonGoHub}${href}`,
            title: title,
            pokemon: this.extractPokemonName(title),
          });
        }
      });

      console.log(`  Found ${dynamaxGuides.length} Dynamax guides`);

      // Scrape individual guides (limit to prevent overload)
      for (const guide of dynamaxGuides.slice(0, 10)) {
        await this.scrapeIndividualGuide(guide);
        await this.delay(1000); // Rate limiting
      }
    } catch (error) {
      console.warn("⚠️  Pokemon GO Hub scraping failed:", error.message);
    }
  }

  /**
   * Scrape individual Dynamax guide
   */
  async scrapeIndividualGuide(guide) {
    try {
      console.log(`  📖 Scraping: ${guide.title}`);

      const response = await axios.get(guide.url, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      // Extract raid tier information
      const tierMatch = guide.title.match(/Tier (\d+)/i);
      const tier = tierMatch ? parseInt(tierMatch[1]) : null;

      if (!tier || tier < 3) return; // Only process Tier 3+

      // Extract counter data
      const counters = [];
      $('table tr, .counter-list li, [class*="attacker"]').each((i, element) => {
        const text = $(element).text();
        const pokemonMatch = text.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);

        if (pokemonMatch) {
          const pokemon = pokemonMatch[1].trim();
          const effectiveness = this.parseEffectiveness(text);

          if (pokemon && effectiveness) {
            counters.push({
              pokemon: pokemon,
              effectiveness: effectiveness,
              moveType: this.extractMoveType(text),
              role: this.extractRole(text), // Attacker, Defender, Healer
            });
          }
        }
      });

      // Store raid data
      if (guide.pokemon && counters.length > 0) {
        this.dynamaxData.raids[guide.pokemon] = {
          tier: tier,
          counters: counters,
          url: guide.url,
          lastUpdated: new Date().toISOString(),
        };

        // Update counter mappings
        counters.forEach((counter) => {
          if (!this.dynamaxData.counters[counter.pokemon]) {
            this.dynamaxData.counters[counter.pokemon] = [];
          }

          this.dynamaxData.counters[counter.pokemon].push({
            target: guide.pokemon,
            tier: tier,
            effectiveness: counter.effectiveness,
            role: counter.role,
          });
        });
      }
    } catch (error) {
      console.warn(`    ⚠️  Failed to scrape ${guide.title}:`, error.message);
    }
  }

  /**
   * Scrape GamePress for DPS/TDO data
   */
  async scrapeGamePress() {
    console.log("🌐 Scraping GamePress...");

    try {
      // GamePress has comprehensive DPS data that can inform Dynamax effectiveness
      const dpsResponse = await axios.get(`${this.sources.gamePress}/comprehensive-dps-spreadsheet`, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      // Note: GamePress data is often in embedded spreadsheets or requires API access
      // This is a placeholder for future implementation when we have better access
      console.log("  📊 GamePress DPS data integration planned for future update");
    } catch (error) {
      console.warn("⚠️  GamePress scraping failed:", error.message);
    }
  }

  /**
   * Scrape community data from Reddit and other sources
   */
  async scrapeCommunityData() {
    console.log("🌐 Scraping community data...");

    try {
      // Search for recent Dynamax tier lists and analysis
      const searchTerms = ["Dynamax tier list", "Max Battle guide", "Dynamax counters"];

      for (const term of searchTerms) {
        // Note: Reddit API requires authentication for extensive scraping
        // This is a placeholder for community data integration
        console.log(`  🔍 Searching for: ${term}`);
      }

      console.log("  📊 Community data integration planned for future update");
    } catch (error) {
      console.warn("⚠️  Community data scraping failed:", error.message);
    }
  }

  /**
   * Process effectiveness data and create type charts
   */
  async processEffectivenessData() {
    console.log("⚙️  Processing effectiveness data...");

    // Create type effectiveness mappings for Max Battles
    this.dynamaxData.typeEffectiveness = {
      superEffective: {},
      notVeryEffective: {},
      noEffect: {},
    };

    // Process counter data to determine what each Pokemon is effective against
    Object.entries(this.dynamaxData.counters).forEach(([pokemon, targets]) => {
      const effectiveAgainst = targets.filter((t) => t.effectiveness === "super-effective" || t.tier >= 4).map((t) => t.target);

      if (effectiveAgainst.length > 0) {
        this.dynamaxData.counters[pokemon] = {
          ...this.dynamaxData.counters[pokemon],
          effectiveAgainst: effectiveAgainst,
          averageTier: targets.reduce((sum, t) => sum + t.tier, 0) / targets.length,
        };
      }
    });
  }

  /**
   * Generate counter mappings for UI display
   */
  async generateCounterMappings() {
    console.log("⚙️  Generating counter mappings...");

    // Create vulnerability mappings (what counters each Pokemon)
    Object.entries(this.dynamaxData.raids).forEach(([raidBoss, data]) => {
      this.dynamaxData.vulnerabilities[raidBoss] = {
        tier: data.tier,
        weakTo: data.counters.map((c) => ({
          pokemon: c.pokemon,
          effectiveness: c.effectiveness,
          role: c.role,
        })),
        topCounters: data.counters.filter((c) => c.effectiveness === "super-effective").slice(0, 5),
      };
    });
  }

  /**
   * Save processed data
   */
  async saveData() {
    console.log("💾 Saving Dynamax data...");

    const output = {
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: "1.0.0",
        sources: Object.keys(this.sources),
        totalRaids: Object.keys(this.dynamaxData.raids).length,
        totalCounters: Object.keys(this.dynamaxData.counters).length,
      },
      raids: this.dynamaxData.raids,
      counters: this.dynamaxData.counters,
      vulnerabilities: this.dynamaxData.vulnerabilities,
      typeEffectiveness: this.dynamaxData.typeEffectiveness,
    };

    // Ensure directory exists
    const dir = path.dirname(this.outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.outputPath, JSON.stringify(output, null, 2));
    console.log(`  ✅ Data saved to: ${this.outputPath}`);
  }

  /**
   * Generate summary report
   */
  generateSummaryReport() {
    const raidCount = Object.keys(this.dynamaxData.raids).length;
    const counterCount = Object.keys(this.dynamaxData.counters).length;

    console.log("\n📊 DYNAMAX DATA SUMMARY");
    console.log("=".repeat(40));
    console.log(`🎯 Tier 3+ Raids: ${raidCount}`);
    console.log(`⚔️  Counter Pokemon: ${counterCount}`);
    console.log(`🛡️  Vulnerabilities: ${Object.keys(this.dynamaxData.vulnerabilities).length}`);

    if (raidCount > 0) {
      console.log("\n🔥 Top Raid Bosses:");
      Object.entries(this.dynamaxData.raids)
        .slice(0, 5)
        .forEach(([boss, data]) => {
          console.log(`  ${boss} (Tier ${data.tier}) - ${data.counters.length} counters`);
        });
    }

    if (counterCount > 0) {
      console.log("\n⚔️  Top Counters:");
      Object.entries(this.dynamaxData.counters)
        .sort((a, b) => (b[1].effectiveAgainst?.length || 0) - (a[1].effectiveAgainst?.length || 0))
        .slice(0, 5)
        .forEach(([pokemon, data]) => {
          const targets = data.effectiveAgainst?.length || 0;
          console.log(`  ${pokemon} - Effective against ${targets} bosses`);
        });
    }
  }

  // Helper methods
  extractPokemonName(title) {
    const match = title.match(/(?:Dynamax|Gigantamax)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    return match ? match[1].trim() : null;
  }

  parseEffectiveness(text) {
    if (text.toLowerCase().includes("super effective") || text.includes("2x")) return "super-effective";
    if (text.toLowerCase().includes("not very effective") || text.includes("0.5x")) return "not-very-effective";
    if (text.toLowerCase().includes("no effect") || text.includes("0x")) return "no-effect";
    return "neutral";
  }

  extractMoveType(text) {
    const types = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground", "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"];
    return types.find((type) => text.includes(type)) || null;
  }

  extractRole(text) {
    if (text.toLowerCase().includes("attacker") || text.toLowerCase().includes("dps")) return "Attacker";
    if (text.toLowerCase().includes("defender") || text.toLowerCase().includes("tank")) return "Defender";
    if (text.toLowerCase().includes("healer") || text.toLowerCase().includes("support")) return "Healer";
    return "Attacker"; // Default
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// CLI execution
if (require.main === module) {
  const scraper = new DynamaxDataScraper();
  scraper.scrapeAll().catch(console.error);
}

module.exports = DynamaxDataScraper;
