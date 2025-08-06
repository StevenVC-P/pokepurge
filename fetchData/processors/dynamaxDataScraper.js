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
    console.log("📊 Target: Current Max Battle bosses, difficulty levels, counters");
    console.log("-".repeat(60));

    try {
      // Try to scrape current Max Battle data, fallback to known data if blocked
      await this.scrapeCurrentMaxBattles();
      await this.scrapeMaxMondaySchedule();
      await this.scrapeGigantamaxGuides();

      // If no data was scraped (due to blocking), use known Max Battle data
      if (Object.keys(this.dynamaxData.raids).length === 0) {
        console.log("🔄 Using known Max Battle data as fallback...");
        await this.loadKnownMaxBattleData();
      }

      // Process and enhance data
      await this.processMaxBattleData();
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
   * Scrape current Max Battle bosses and schedule
   */
  async scrapeCurrentMaxBattles() {
    console.log("🌐 Scraping current Max Battle data...");

    try {
      // Scrape the Max Monday schedule page
      const scheduleResponse = await axios.get(`${this.sources.pokemonGoHub.baseUrl}/post/guide/spotlight-raid-hours/`, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(scheduleResponse.data);

      // Extract Max Monday schedule
      const maxMondayData = [];
      $('h3:contains("Max Mondays"), h2:contains("Max Mondays")')
        .next()
        .find("tr")
        .each((i, row) => {
          const cells = $(row).find("td");
          if (cells.length >= 2) {
            const date = $(cells[0]).text().trim();
            const pokemonName = $(cells[1]).text().trim();

            if (pokemonName && pokemonName !== "Max Monday") {
              maxMondayData.push({
                date: date,
                pokemon: pokemonName,
                difficulty: 1, // Max Mondays are currently 1-star
                type: "max-monday",
                source: "pokemongohub-schedule",
              });
            }
          }
        });

      console.log(`  Found ${maxMondayData.length} Max Monday bosses`);

      // Store the data
      maxMondayData.forEach((boss) => {
        this.dynamaxData.raids[boss.pokemon] = {
          difficulty: boss.difficulty,
          type: boss.type,
          date: boss.date,
          counters: [], // Will be populated by type effectiveness
          url: `${this.sources.pokemonGoHub.baseUrl}/post/guide/spotlight-raid-hours/`,
          lastUpdated: new Date().toISOString(),
        };
      });

      this.dynamaxData.metadata.totalRaids = maxMondayData.length;
      this.dynamaxData.metadata.sources.push("pokemongohub-max-mondays");
    } catch (error) {
      console.warn("⚠️  Max Battle schedule scraping failed:", error.message);
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
   * Scrape Max Monday schedule for upcoming bosses
   */
  async scrapeMaxMondaySchedule() {
    console.log("🌐 Scraping Max Monday schedule...");

    try {
      // Get the current events page for more Max Battle info
      const eventsResponse = await axios.get(`${this.sources.pokemonGoHub.baseUrl}/post/event/pokemon-go-august-2025-events/`, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(eventsResponse.data);

      // Look for Dynamax/Max Battle mentions in events
      const maxBattleEvents = [];
      $("h2, h3, h4").each((i, heading) => {
        const text = $(heading).text();
        if (text.includes("Dynamax") || text.includes("Max Battle") || text.includes("Gigantamax")) {
          const nextContent = $(heading).nextUntil("h1, h2, h3, h4").text();

          // Extract Pokemon names and difficulty info
          const pokemonMatches = nextContent.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);
          if (pokemonMatches) {
            pokemonMatches.forEach((pokemon) => {
              if (this.isValidPokemonName(pokemon)) {
                maxBattleEvents.push({
                  pokemon: pokemon,
                  difficulty: this.inferDifficulty(nextContent),
                  type: text.includes("Gigantamax") ? "gigantamax" : "dynamax",
                  source: "pokemongohub-events",
                });
              }
            });
          }
        }
      });

      console.log(`  Found ${maxBattleEvents.length} Max Battle events`);

      // Add to raids data
      maxBattleEvents.forEach((event) => {
        if (!this.dynamaxData.raids[event.pokemon]) {
          this.dynamaxData.raids[event.pokemon] = {
            difficulty: event.difficulty,
            type: event.type,
            counters: [],
            url: `${this.sources.pokemonGoHub.baseUrl}/post/event/pokemon-go-august-2025-events/`,
            lastUpdated: new Date().toISOString(),
          };
        }
      });
    } catch (error) {
      console.warn("⚠️  Max Monday schedule scraping failed:", error.message);
    }
  }

  /**
   * Scrape Gigantamax specific guides
   */
  async scrapeGigantamaxGuides() {
    console.log("🌐 Scraping Gigantamax guides...");

    try {
      // Search for Gigantamax guides on Pokemon GO Hub
      const searchResponse = await axios.get(`${this.sources.pokemonGoHub.baseUrl}/post/category/guide/`, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(searchResponse.data);
      const gigantamaxGuides = [];

      // Find Gigantamax-specific guides
      $("a").each((i, element) => {
        const href = $(element).attr("href");
        const title = $(element).text().trim();

        if (href && title && title.toLowerCase().includes("gigantamax")) {
          gigantamaxGuides.push({
            url: href.startsWith("http") ? href : `${this.sources.pokemonGoHub.baseUrl}${href}`,
            title: title,
            pokemon: this.extractPokemonName(title),
            difficulty: this.inferGigantamaxDifficulty(title),
          });
        }
      });

      console.log(`  Found ${gigantamaxGuides.length} Gigantamax guides`);

      // Process each guide
      for (const guide of gigantamaxGuides.slice(0, 5)) {
        await this.scrapeGigantamaxGuide(guide);
        await this.delay(1000);
      }
    } catch (error) {
      console.warn("⚠️  Gigantamax guides scraping failed:", error.message);
    }
  }

  /**
   * Scrape individual Gigantamax guide for counter data
   */
  async scrapeGigantamaxGuide(guide) {
    try {
      console.log(`  📖 Scraping Gigantamax guide: ${guide.title}`);

      const response = await axios.get(guide.url, {
        timeout: 10000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      const $ = cheerio.load(response.data);

      // Extract counter information from the guide
      const counters = [];
      $('h2:contains("Counter"), h3:contains("Counter"), h2:contains("Best"), h3:contains("Best")').each((i, heading) => {
        const section = $(heading).nextUntil("h1, h2, h3").text();
        const pokemonMatches = section.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g);

        if (pokemonMatches) {
          pokemonMatches.forEach((pokemon) => {
            if (this.isValidPokemonName(pokemon)) {
              counters.push({
                pokemon: pokemon,
                effectiveness: "super-effective",
                moveType: this.inferMoveType(pokemon),
                role: "Attacker",
              });
            }
          });
        }
      });

      // Store the data
      if (guide.pokemon && counters.length > 0) {
        this.dynamaxData.raids[guide.pokemon] = {
          difficulty: guide.difficulty,
          type: "gigantamax",
          counters: counters,
          url: guide.url,
          lastUpdated: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.warn(`    ⚠️  Failed to scrape Gigantamax guide ${guide.title}:`, error.message);
    }
  }

  /**
   * Load known Max Battle data when scraping fails
   */
  async loadKnownMaxBattleData() {
    console.log("📊 Loading known Max Battle data...");

    // Current Max Monday bosses (August 2025) - 1-star difficulty
    const maxMondayBosses = [
      { name: "Omanyte", difficulty: 1, type: "max-monday", date: "August 4" },
      { name: "Trubbish", difficulty: 1, type: "max-monday", date: "August 11" },
      { name: "Chansey", difficulty: 1, type: "max-monday", date: "August 25" },
      { name: "Pidove", difficulty: 1, type: "max-monday", date: "September 1" },
    ];

    // Known Gigantamax bosses - higher difficulty
    const gigantamaxBosses = [
      { name: "Butterfree", difficulty: 3, type: "gigantamax" },
      { name: "Charizard", difficulty: 4, type: "gigantamax" },
      { name: "Blastoise", difficulty: 4, type: "gigantamax" },
      { name: "Venusaur", difficulty: 4, type: "gigantamax" },
    ];

    // Other known Dynamax Pokemon that appear in Max Battles
    const dynamaxBosses = [
      { name: "Bulbasaur", difficulty: 1, type: "dynamax" },
      { name: "Ivysaur", difficulty: 2, type: "dynamax" },
      { name: "Charmander", difficulty: 1, type: "dynamax" },
      { name: "Charmeleon", difficulty: 2, type: "dynamax" },
      { name: "Squirtle", difficulty: 1, type: "dynamax" },
      { name: "Wartortle", difficulty: 2, type: "dynamax" },
      { name: "Caterpie", difficulty: 1, type: "dynamax" },
      { name: "Metapod", difficulty: 1, type: "dynamax" },
      { name: "Lapras", difficulty: 3, type: "dynamax" },
    ];

    // Combine all known bosses
    const allBosses = [...maxMondayBosses, ...gigantamaxBosses, ...dynamaxBosses];

    // Add to raids data
    allBosses.forEach((boss) => {
      this.dynamaxData.raids[boss.name] = {
        difficulty: boss.difficulty,
        type: boss.type,
        date: boss.date || null,
        counters: [], // Will be populated by type effectiveness
        url: "https://pokemongohub.net/post/guide/spotlight-raid-hours/",
        lastUpdated: new Date().toISOString(),
        source: "known-data",
      };
    });

    this.dynamaxData.metadata.totalRaids = allBosses.length;
    this.dynamaxData.metadata.sources.push("known-max-battle-data");
    this.dynamaxData.metadata.version = "1.1.0-real-data";

    console.log(`  ✅ Loaded ${allBosses.length} known Max Battle bosses`);
  }

  /**
   * Process Max Battle data and generate type effectiveness
   */
  async processMaxBattleData() {
    console.log("⚙️  Processing Max Battle data...");

    // Generate counters based on type effectiveness for each raid boss
    Object.keys(this.dynamaxData.raids).forEach((bossName) => {
      const boss = this.dynamaxData.raids[bossName];
      const bossTypes = this.inferPokemonTypes(bossName);

      if (bossTypes.length > 0) {
        boss.types = bossTypes;
        boss.counters = this.generateCountersForBoss(bossName, bossTypes, boss.difficulty);
      }
    });

    console.log(`  ✅ Processed ${Object.keys(this.dynamaxData.raids).length} Max Battle bosses`);
  }

  /**
   * Generate counters for a specific boss based on type effectiveness
   */
  generateCountersForBoss(bossName, bossTypes, difficulty) {
    const counters = [];

    // Get super effective types against this boss
    bossTypes.forEach((defenseType) => {
      Object.entries(this.typeChart.superEffective).forEach(([attackType, defendingTypes]) => {
        if (defendingTypes.includes(defenseType)) {
          // Find Pokemon of this attacking type
          const attackingPokemon = this.getTopPokemonOfType(attackType, difficulty);
          attackingPokemon.forEach((pokemon) => {
            counters.push({
              pokemon: pokemon,
              effectiveness: "super-effective",
              moveType: attackType,
              role: "Attacker",
              reason: `${attackType} beats ${defenseType}`,
            });
          });
        }
      });
    });

    return counters.slice(0, 8); // Limit to top 8 counters
  }

  /**
   * Get top Pokemon of a specific type for countering
   */
  getTopPokemonOfType(type, difficulty) {
    // Common strong Pokemon by type for Max Battles
    const topPokemonByType = {
      Fire: ["Charizard", "Moltres", "Entei", "Blaziken"],
      Water: ["Blastoise", "Gyarados", "Swampert", "Kyogre"],
      Grass: ["Venusaur", "Sceptile", "Roserade", "Leafeon"],
      Electric: ["Raikou", "Zapdos", "Magnezone", "Electivire"],
      Ice: ["Articuno", "Mamoswine", "Glaceon", "Weavile"],
      Fighting: ["Machamp", "Lucario", "Conkeldurr", "Terrakion"],
      Poison: ["Gengar", "Crobat", "Toxicroak", "Roserade"],
      Ground: ["Garchomp", "Excadrill", "Groudon", "Rhyperior"],
      Flying: ["Rayquaza", "Dragonite", "Salamence", "Togekiss"],
      Psychic: ["Mewtwo", "Alakazam", "Espeon", "Gardevoir"],
      Bug: ["Scizor", "Heracross", "Volcarona", "Genesect"],
      Rock: ["Tyranitar", "Rampardos", "Terrakion", "Golem"],
      Ghost: ["Gengar", "Giratina", "Chandelure", "Drifblim"],
      Dragon: ["Rayquaza", "Dragonite", "Salamence", "Garchomp"],
      Dark: ["Tyranitar", "Darkrai", "Hydreigon", "Absol"],
      Steel: ["Metagross", "Dialga", "Excadrill", "Scizor"],
      Fairy: ["Gardevoir", "Togekiss", "Clefable", "Sylveon"],
    };

    return topPokemonByType[type] || [];
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

  /**
   * Helper methods for data processing
   */
  isValidPokemonName(name) {
    // Basic validation for Pokemon names
    const validNames = ["Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree", "Omanyte", "Omastar", "Trubbish", "Garbodor", "Chansey", "Blissey", "Pidove", "Tranquill", "Unfezant", "Lapras", "Raikou", "Entei", "Suicune"];
    return validNames.includes(name) || name.length > 3;
  }

  inferDifficulty(content) {
    // Infer difficulty from content text
    if (content.includes("3-star") || content.includes("Tier 3")) return 3;
    if (content.includes("4-star") || content.includes("Tier 4")) return 4;
    if (content.includes("5-star") || content.includes("Tier 5")) return 5;
    if (content.includes("Gigantamax")) return 4; // Gigantamax are typically harder
    return 1; // Default to 1-star for Max Mondays
  }

  inferGigantamaxDifficulty(title) {
    // Gigantamax battles are typically 3-4 star difficulty
    if (title.includes("Butterfree")) return 3;
    if (title.includes("Charizard") || title.includes("Blastoise") || title.includes("Venusaur")) return 4;
    return 3; // Default for Gigantamax
  }

  inferMoveType(pokemon) {
    // Infer primary move type based on Pokemon
    const moveTypes = {
      Charizard: "Fire",
      Blastoise: "Water",
      Venusaur: "Grass",
      Raikou: "Electric",
      Entei: "Fire",
      Suicune: "Water",
      Butterfree: "Bug",
      Lapras: "Water",
      Chansey: "Normal",
    };
    return moveTypes[pokemon] || "Normal";
  }

  inferPokemonTypes(pokemonName) {
    // Basic type inference for common Pokemon
    const typeMap = {
      Bulbasaur: ["Grass", "Poison"],
      Ivysaur: ["Grass", "Poison"],
      Venusaur: ["Grass", "Poison"],
      Charmander: ["Fire"],
      Charmeleon: ["Fire"],
      Charizard: ["Fire", "Flying"],
      Squirtle: ["Water"],
      Wartortle: ["Water"],
      Blastoise: ["Water"],
      Caterpie: ["Bug"],
      Metapod: ["Bug"],
      Butterfree: ["Bug", "Flying"],
      Omanyte: ["Rock", "Water"],
      Omastar: ["Rock", "Water"],
      Trubbish: ["Poison"],
      Garbodor: ["Poison"],
      Chansey: ["Normal"],
      Blissey: ["Normal"],
      Pidove: ["Normal", "Flying"],
      Tranquill: ["Normal", "Flying"],
      Unfezant: ["Normal", "Flying"],
      Lapras: ["Water", "Ice"],
      Raikou: ["Electric"],
      Entei: ["Fire"],
      Suicune: ["Water"],
    };
    return typeMap[pokemonName] || ["Normal"];
  }

  extractPokemonName(title) {
    // Extract Pokemon name from guide title
    const matches = title.match(/(?:Gigantamax\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    return matches ? matches[1].trim() : null;
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
