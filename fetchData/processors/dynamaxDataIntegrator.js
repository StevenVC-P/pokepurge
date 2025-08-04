#!/usr/bin/env node

/**
 * Dynamax Data Integrator
 *
 * Integrates scraped Dynamax battle data with existing Pokemon data to enhance:
 * - Recommended count calculations (more copies for versatile counters)
 * - Trashability assessments (boost Pokemon effective against Tier 3+ raids)
 * - AI analysis and notes (add Max Battle context)
 * - UI effectiveness displays (show what each Pokemon counters/weak to)
 */

const fs = require("fs");
const path = require("path");

class DynamaxDataIntegrator {
  constructor() {
    this.pokemonDataPath = path.join(__dirname, "../../public/data/pokemon.json");
    this.dynamaxDataPath = path.join(__dirname, "../../public/data/dynamax-battle-data.json");
    this.outputPath = this.pokemonDataPath; // Update in place

    this.pokemonData = [];
    this.dynamaxData = {};
    this.integrationStats = {
      enhanced: 0,
      newCounters: 0,
      trashabilityBoosts: 0,
      aiEnhancements: 0,
    };
  }

  /**
   * Main integration process
   */
  async integrate() {
    console.log("🔥 Starting Dynamax Data Integration...");
    console.log("🎯 Enhancing: Recommended counts, trashability, AI notes, UI data");
    console.log("-".repeat(60));

    try {
      // Load data
      await this.loadData();

      // Integration processes
      await this.enhanceRecommendedCounts();
      await this.boostTrashabilityForCounters();
      await this.addMaxBattleContext();
      await this.generateEffectivenessData();

      // Save enhanced data
      await this.saveData();

      console.log("\n✅ Dynamax data integration complete!");
      this.generateIntegrationReport();
    } catch (error) {
      console.error("❌ Error during integration:", error.message);
      throw error;
    }
  }

  /**
   * Load Pokemon and Dynamax data
   */
  async loadData() {
    console.log("📂 Loading data files...");

    // Load Pokemon data
    if (fs.existsSync(this.pokemonDataPath)) {
      this.pokemonData = JSON.parse(fs.readFileSync(this.pokemonDataPath, "utf8"));
      console.log(`  ✅ Loaded ${this.pokemonData.length} Pokemon`);
    } else {
      throw new Error("Pokemon data file not found");
    }

    // Load Dynamax data (if available)
    if (fs.existsSync(this.dynamaxDataPath)) {
      this.dynamaxData = JSON.parse(fs.readFileSync(this.dynamaxDataPath, "utf8"));
      console.log(`  ✅ Loaded Dynamax data: ${this.dynamaxData.metadata?.totalRaids || 0} raids, ${this.dynamaxData.metadata?.totalCounters || 0} counters`);
    } else {
      console.log("  ⚠️  No Dynamax data found - using fallback type effectiveness");
      this.dynamaxData = this.generateFallbackData();
    }
  }

  /**
   * Enhance recommended counts based on Max Battle utility
   */
  async enhanceRecommendedCounts() {
    console.log("⚙️  Enhancing recommended counts...");

    this.pokemonData.forEach((pokemon) => {
      const counterData = this.dynamaxData.counters?.[pokemon.name];

      if (counterData && counterData.effectiveAgainst?.length > 0) {
        const originalCount = pokemon.dynamax ? pokemon.recommendedCount : pokemon.regularRecommendedCount;
        const currentCount = originalCount || 0;

        // Calculate bonus based on versatility and tier effectiveness
        let bonus = 0;

        // Bonus for being effective against multiple raid bosses
        if (counterData.effectiveAgainst.length >= 3) bonus += 1;
        if (counterData.effectiveAgainst.length >= 5) bonus += 1;

        // Bonus for being effective against high-tier raids
        if (counterData.averageTier >= 4) bonus += 1;
        if (counterData.averageTier >= 5) bonus += 1;

        // Apply bonus (max 3 for Dynamax, 6 for regular)
        if (bonus > 0) {
          const maxCount = pokemon.dynamax ? 3 : 6;
          const newCount = Math.min(currentCount + bonus, maxCount);

          if (pokemon.dynamax) {
            pokemon.recommendedCount = newCount;
          } else {
            pokemon.regularRecommendedCount = newCount;
          }

          // Track enhancement
          if (newCount > currentCount) {
            this.integrationStats.enhanced++;
            this.integrationStats.newCounters++;
          }
        }
      }
    });

    console.log(`  ✅ Enhanced ${this.integrationStats.newCounters} Pokemon recommended counts`);
  }

  /**
   * Boost trashability for effective Max Battle counters
   */
  async boostTrashabilityForCounters() {
    console.log("⚙️  Boosting trashability for Max Battle counters...");

    this.pokemonData.forEach((pokemon) => {
      const counterData = this.dynamaxData.counters?.[pokemon.name];

      if (counterData && counterData.effectiveAgainst?.length > 0) {
        const currentTrashability = pokemon.dynamax ? pokemon.trashability : pokemon.regularTrashability;

        // Determine boost based on Max Battle effectiveness
        let targetTier = null;

        // Strong boost for versatile high-tier counters
        if (counterData.effectiveAgainst.length >= 3 && counterData.averageTier >= 4) {
          targetTier = "Essential";
        }
        // Moderate boost for good counters
        else if (counterData.effectiveAgainst.length >= 2 || counterData.averageTier >= 4) {
          targetTier = "Valuable";
        }
        // Small boost for any Tier 3+ effectiveness
        else if (counterData.averageTier >= 3) {
          targetTier = "Reliable";
        }

        // Apply boost if it improves current tier
        if (targetTier && this.isTrashabilityImprovement(currentTrashability, targetTier)) {
          if (pokemon.dynamax) {
            pokemon.trashability = targetTier;
          } else {
            pokemon.regularTrashability = targetTier;
          }

          this.integrationStats.trashabilityBoosts++;
        }
      }
    });

    console.log(`  ✅ Boosted trashability for ${this.integrationStats.trashabilityBoosts} Pokemon`);
  }

  /**
   * Add Max Battle context to AI analysis
   */
  async addMaxBattleContext() {
    console.log("⚙️  Adding Max Battle context to AI analysis...");

    this.pokemonData.forEach((pokemon) => {
      const counterData = this.dynamaxData.counters?.[pokemon.name];
      const vulnerabilityData = this.dynamaxData.vulnerabilities?.[pokemon.name];

      if (pokemon.dynamax && (counterData || vulnerabilityData)) {
        // Enhance Dynamax role summary
        if (counterData?.effectiveAgainst?.length > 0) {
          const targets = counterData.effectiveAgainst.slice(0, 3).join(", ");
          const maxBattleContext = ` Dominates Max Battles against ${targets} and similar raid bosses.`;

          if (pokemon.dynamaxRoleSummary) {
            pokemon.dynamaxRoleSummary += maxBattleContext;
          } else if (pokemon.roleSummary) {
            pokemon.dynamaxRoleSummary = pokemon.roleSummary + maxBattleContext;
          }
        }

        // Enhance Dynamax notes
        if (counterData || vulnerabilityData) {
          let maxBattleNotes = "";

          if (counterData?.effectiveAgainst?.length > 0) {
            maxBattleNotes += `Excellent Max Battle counter with effectiveness against ${counterData.effectiveAgainst.length} different raid bosses. `;
          }

          if (vulnerabilityData?.weakTo?.length > 0) {
            const topCounter = vulnerabilityData.topCounters?.[0];
            if (topCounter) {
              maxBattleNotes += `Vulnerable to ${topCounter.pokemon} and other ${topCounter.role?.toLowerCase() || "counter"} types in Max Battles. `;
            }
          }

          if (maxBattleNotes) {
            if (pokemon.dynamaxNotes) {
              pokemon.dynamaxNotes += " " + maxBattleNotes.trim();
            } else if (pokemon.notes) {
              pokemon.dynamaxNotes = pokemon.notes + " " + maxBattleNotes.trim();
            } else {
              pokemon.dynamaxNotes = maxBattleNotes.trim();
            }

            this.integrationStats.aiEnhancements++;
          }
        }
      }
    });

    console.log(`  ✅ Enhanced AI analysis for ${this.integrationStats.aiEnhancements} Pokemon`);
  }

  /**
   * Generate effectiveness data for UI display
   */
  async generateEffectivenessData() {
    console.log("⚙️  Generating effectiveness data for UI...");

    // Get all Dynamax Pokemon for cross-referencing
    const allDynamaxPokemon = this.pokemonData.filter((p) => p.dynamax);

    this.pokemonData.forEach((pokemon) => {
      if (pokemon.dynamax) {
        // Generate effective against data based on type matchups
        pokemon.maxBattleEffectiveAgainst = this.generateEffectiveAgainstData(pokemon, allDynamaxPokemon);

        // Generate vulnerable to data based on type matchups
        pokemon.maxBattleVulnerableTo = this.generateVulnerableToData(pokemon, allDynamaxPokemon);
      }
    });

    console.log(`  ✅ Generated effectiveness data for ${allDynamaxPokemon.length} Dynamax Pokemon`);
  }

  /**
   * Generate effective against data for a Pokemon
   */
  generateEffectiveAgainstData(pokemon, allDynamaxPokemon) {
    const effectiveAgainst = [];

    // Check each of this Pokemon's types against all other Dynamax Pokemon
    for (const attackType of pokemon.types) {
      for (const target of allDynamaxPokemon) {
        if (target.name === pokemon.name) continue; // Skip self

        // Check if this attack type is super effective against target
        for (const defenseType of target.types) {
          if (this.isTypeEffective(attackType, defenseType)) {
            const moveInfo = {
              moveName: this.getMaxMoveForType(attackType),
              moveType: attackType,
              reason: `${attackType} beats ${defenseType}`,
            };

            effectiveAgainst.push({
              name: target.name,
              tier: this.inferRaidTier(target),
              effectiveness: "super-effective",
              moveInfo: moveInfo,
            });
            break; // Only add once per target
          }
        }
      }
    }

    // Remove duplicates and limit to top 10 for UI performance
    const uniqueTargets = effectiveAgainst.filter((item, index, self) => index === self.findIndex((t) => t.name === item.name));

    return uniqueTargets.slice(0, 10);
  }

  /**
   * Generate vulnerable to data for a Pokemon
   */
  generateVulnerableToData(pokemon, allDynamaxPokemon) {
    const vulnerableTo = [];

    // Check what types are super effective against this Pokemon
    for (const attacker of allDynamaxPokemon) {
      if (attacker.name === pokemon.name) continue; // Skip self

      for (const attackType of attacker.types) {
        for (const defenseType of pokemon.types) {
          if (this.isTypeEffective(attackType, defenseType)) {
            const moveInfo = {
              moveName: this.getMaxMoveForType(attackType),
              moveType: attackType,
              reason: `${attackType} beats ${defenseType}`,
            };

            vulnerableTo.push({
              name: attacker.name,
              role: this.inferRole(attacker),
              effectiveness: "super-effective",
              moveInfo: moveInfo,
            });
            break; // Only add once per attacker
          }
        }
      }
    }

    // Remove duplicates and limit to top 8 for UI performance
    const uniqueCounters = vulnerableTo.filter((item, index, self) => index === self.findIndex((t) => t.name === item.name));

    return uniqueCounters.slice(0, 8);
  }

  /**
   * Infer raid tier based on Pokemon stats/rarity
   */
  inferRaidTier(pokemon) {
    // Use trashability as a proxy for raid tier
    if (pokemon.trashability === "Essential") return 5;
    if (pokemon.trashability === "Valuable") return 4;
    if (pokemon.trashability === "Reliable") return 3;
    return 3; // Default tier
  }

  /**
   * Infer role based on Pokemon characteristics
   */
  inferRole(pokemon) {
    // Use dynamax role if available, but make it more logical
    if (pokemon.dynamaxRole?.primary) {
      const role = pokemon.dynamaxRole.primary;
      // Convert confusing role assignments to clearer ones
      if (role === "Healer" && this.isOffensivePokemon(pokemon)) {
        return "Attacker";
      }
      return role;
    }

    // Fallback based on Pokemon characteristics
    if (pokemon.name.includes("Shadow")) return "Attacker";
    if (pokemon.name.includes("Gigantamax")) return "Defender";

    // Base form logic - early evolutions are usually more defensive
    if (this.isBasicForm(pokemon)) return "Defender";
    if (this.isOffensivePokemon(pokemon)) return "Attacker";

    return "Attacker"; // Default role
  }

  /**
   * Check if Pokemon is clearly offensive
   */
  isOffensivePokemon(pokemon) {
    const offensiveNames = ["Charmander", "Charmeleon", "Charizard", "Machop", "Machamp", "Alakazam", "Gengar", "Dragonite", "Mewtwo", "Tyranitar"];

    const offensiveTypes = ["Fire", "Fighting", "Electric", "Dragon", "Dark"];

    return offensiveNames.some((name) => pokemon.name.includes(name)) || pokemon.types.some((type) => offensiveTypes.includes(type));
  }

  /**
   * Check if Pokemon is a basic/early form
   */
  isBasicForm(pokemon) {
    const basicForms = ["Caterpie", "Metapod", "Weedle", "Kakuna", "Magikarp", "Bulbasaur", "Squirtle", "Charmander"];

    return basicForms.some((name) => pokemon.name.includes(name));
  }

  /**
   * Get effectiveness reasoning for UI display
   */
  getEffectivenessReason(attackerTypes, defenderTypes) {
    if (!attackerTypes || !defenderTypes) return null;

    // Find which attacker type is super effective and get the move
    for (const attackType of attackerTypes) {
      for (const defenseType of defenderTypes) {
        if (this.isTypeEffective(attackType, defenseType)) {
          const moveName = this.getMaxMoveForType(attackType);
          return {
            moveName: moveName,
            moveType: attackType,
            reason: `${attackType} beats ${defenseType}`,
          };
        }
      }
    }

    return null;
  }

  /**
   * Get vulnerability reasoning for UI display
   */
  getVulnerabilityReason(defenderTypes, attackerTypes) {
    if (!defenderTypes || !attackerTypes) return null;

    // Find which attacker type is super effective against defender
    for (const attackType of attackerTypes) {
      for (const defenseType of defenderTypes) {
        if (this.isTypeEffective(attackType, defenseType)) {
          const moveName = this.getMaxMoveForType(attackType);
          return {
            moveName: moveName,
            moveType: attackType,
            reason: `${attackType} beats ${defenseType}`,
          };
        }
      }
    }

    return null;
  }

  /**
   * Get Max Move name for a given type
   */
  getMaxMoveForType(type) {
    const maxMoves = {
      Normal: "Max Strike",
      Fire: "Max Flare",
      Water: "Max Geyser",
      Electric: "Max Lightning",
      Grass: "Max Overgrowth",
      Ice: "Max Hailstorm",
      Fighting: "Max Knuckle",
      Poison: "Max Ooze",
      Ground: "Max Quake",
      Flying: "Max Airstream",
      Psychic: "Max Mindstorm",
      Bug: "Max Flutterby",
      Rock: "Max Rockfall",
      Ghost: "Max Phantasm",
      Dragon: "Max Wyrmwind",
      Dark: "Max Darkness",
      Steel: "Max Steelspike",
      Fairy: "Max Starfall",
    };

    return maxMoves[type] || `Max ${type}`;
  }

  /**
   * Check if attack type is super effective against defense type
   */
  isTypeEffective(attackType, defenseType) {
    const typeChart = {
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
    };

    return typeChart[attackType]?.includes(defenseType) || false;
  }

  /**
   * Infer target types from name
   */
  inferTargetTypes(targetName) {
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

    return typeMap[targetName] || ["Normal"];
  }

  /**
   * Infer counter types from name
   */
  inferCounterTypes(counterName) {
    return this.inferTargetTypes(counterName);
  }

  /**
   * Generate fallback data when scraping isn't available
   */
  generateFallbackData() {
    console.log("  🔄 Generating fallback Dynamax data...");

    // Basic type effectiveness for common Dynamax scenarios
    return {
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: "1.0.0-fallback",
        sources: ["type-chart-analysis"],
        totalRaids: 0,
        totalCounters: 0,
      },
      raids: {},
      counters: {},
      vulnerabilities: {},
      typeEffectiveness: {
        // Basic type chart - can be expanded
        superEffective: {
          Ground: ["Electric", "Fire", "Poison", "Rock", "Steel"],
          Water: ["Fire", "Ground", "Rock"],
          Grass: ["Ground", "Rock", "Water"],
          Electric: ["Flying", "Water"],
          Ice: ["Dragon", "Flying", "Grass", "Ground"],
        },
      },
    };
  }

  /**
   * Check if new trashability is an improvement
   */
  isTrashabilityImprovement(current, target) {
    const hierarchy = ["Trash", "Niche", "Useful", "Reliable", "Valuable", "Essential"];
    const currentIndex = hierarchy.indexOf(current);
    const targetIndex = hierarchy.indexOf(target);

    return targetIndex > currentIndex;
  }

  /**
   * Save enhanced Pokemon data
   */
  async saveData() {
    console.log("💾 Saving enhanced Pokemon data...");

    // Create backup
    const backupPath = this.pokemonDataPath.replace(".json", `-backup-${Date.now()}.json`);
    fs.copyFileSync(this.pokemonDataPath, backupPath);
    console.log(`  📋 Backup created: ${path.basename(backupPath)}`);

    // Save enhanced data
    fs.writeFileSync(this.outputPath, JSON.stringify(this.pokemonData, null, 2));
    console.log(`  ✅ Enhanced data saved to: ${path.basename(this.outputPath)}`);
  }

  /**
   * Generate integration report
   */
  generateIntegrationReport() {
    console.log("\n📊 DYNAMAX INTEGRATION SUMMARY");
    console.log("=".repeat(40));
    console.log(`⚔️  Enhanced Pokemon: ${this.integrationStats.enhanced}`);
    console.log(`📈 Recommended count boosts: ${this.integrationStats.newCounters}`);
    console.log(`🎯 Trashability improvements: ${this.integrationStats.trashabilityBoosts}`);
    console.log(`🤖 AI analysis enhancements: ${this.integrationStats.aiEnhancements}`);

    // Show examples of enhanced Pokemon
    const enhancedPokemon = this.pokemonData.filter((p) => p.maxBattleEffectiveAgainst?.length > 0 || p.maxBattleVulnerableTo?.length > 0);

    if (enhancedPokemon.length > 0) {
      console.log("\n🔥 Top Enhanced Pokemon:");
      enhancedPokemon.slice(0, 5).forEach((pokemon) => {
        const effectiveCount = pokemon.maxBattleEffectiveAgainst?.length || 0;
        const vulnerableCount = pokemon.maxBattleVulnerableTo?.length || 0;
        console.log(`  ${pokemon.name} - Effective vs ${effectiveCount}, Vulnerable to ${vulnerableCount}`);
      });
    }

    console.log("\n🎯 Next Steps:");
    console.log("  • Run AI analysis to incorporate Max Battle context");
    console.log("  • Update UI to display effectiveness data");
    console.log("  • Schedule regular scraping for new raid bosses");
  }
}

// CLI execution
if (require.main === module) {
  const integrator = new DynamaxDataIntegrator();
  integrator.integrate().catch(console.error);
}

module.exports = DynamaxDataIntegrator;
