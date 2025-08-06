#!/usr/bin/env node

/**
 * Max Move Analyzer
 *
 * Analyzes Pokemon stats, types, and movesets to determine:
 * - Recommended Max Moves (Attack, Guard, Spirit)
 * - Optimal Dynamax role (Attacker, Defender, Healer, Hybrid)
 * - Strategic recommendations for Max Battles
 */

const fs = require("fs");
const path = require("path");

class MaxMoveAnalyzer {
  constructor() {
    this.pokemonDataPath = path.join(__dirname, "../../public/data/pokemon.json");
    this.pokemonData = [];

    // Max Move database with type mappings
    this.maxMoves = {
      // Max Attack moves (based on fast move type)
      attack: {
        Normal: { name: "Max Strike", power: 130, effect: "Powerful Normal-type Max Move" },
        Fire: { name: "Max Flare", power: 130, effect: "Powerful Fire-type Max Move" },
        Water: { name: "Max Geyser", power: 130, effect: "Powerful Water-type Max Move" },
        Electric: { name: "Max Lightning", power: 130, effect: "Powerful Electric-type Max Move" },
        Grass: { name: "Max Overgrowth", power: 130, effect: "Powerful Grass-type Max Move" },
        Ice: { name: "Max Hailstorm", power: 130, effect: "Powerful Ice-type Max Move" },
        Fighting: { name: "Max Knuckle", power: 130, effect: "Powerful Fighting-type Max Move" },
        Poison: { name: "Max Ooze", power: 130, effect: "Powerful Poison-type Max Move" },
        Ground: { name: "Max Quake", power: 130, effect: "Powerful Ground-type Max Move" },
        Flying: { name: "Max Airstream", power: 130, effect: "Powerful Flying-type Max Move" },
        Psychic: { name: "Max Mindstorm", power: 130, effect: "Powerful Psychic-type Max Move" },
        Bug: { name: "Max Flutterby", power: 130, effect: "Powerful Bug-type Max Move" },
        Rock: { name: "Max Rockfall", power: 130, effect: "Powerful Rock-type Max Move" },
        Ghost: { name: "Max Phantasm", power: 130, effect: "Powerful Ghost-type Max Move" },
        Dragon: { name: "Max Wyrmwind", power: 130, effect: "Powerful Dragon-type Max Move" },
        Dark: { name: "Max Darkness", power: 130, effect: "Powerful Dark-type Max Move" },
        Steel: { name: "Max Steelspike", power: 130, effect: "Powerful Steel-type Max Move" },
        Fairy: { name: "Max Starfall", power: 130, effect: "Powerful Fairy-type Max Move" },
      },

      // Support moves
      guard: { name: "Max Guard", effect: "Protects from damage and draws aggro" },
      spirit: { name: "Max Spirit", effect: "Heals team based on user HP" },
    };

    // Role determination thresholds
    this.roleThresholds = {
      attacker: { minAttack: 200, minOffensiveTypes: 1 },
      defender: { minDefense: 180, minHP: 150 },
      healer: { minHP: 200, minBulk: 350 }, // HP + Defense combined
    };
  }

  /**
   * Main analysis function
   */
  async analyze() {
    console.log("🔥 Starting Max Move Analysis...");
    console.log("📊 Analyzing moves, roles, and strategies");
    console.log("-".repeat(60));

    try {
      await this.loadData();
      await this.analyzeMaxMoves();
      await this.determineDynamaxRoles();
      await this.saveData();

      console.log("\n✅ Max Move analysis complete!");
      this.generateAnalysisReport();
    } catch (error) {
      console.error("❌ Error during analysis:", error.message);
      throw error;
    }
  }

  /**
   * Load Pokemon data
   */
  async loadData() {
    console.log("📂 Loading Pokemon data...");

    if (fs.existsSync(this.pokemonDataPath)) {
      this.pokemonData = JSON.parse(fs.readFileSync(this.pokemonDataPath, "utf8"));
      console.log(`  ✅ Loaded ${this.pokemonData.length} Pokemon`);
    } else {
      throw new Error("Pokemon data file not found");
    }
  }

  /**
   * Analyze and recommend Max Moves for each Dynamax Pokemon
   */
  async analyzeMaxMoves() {
    console.log("⚙️  Analyzing Max Move recommendations...");

    let analyzedCount = 0;

    this.pokemonData.forEach((pokemon) => {
      if (pokemon.dynamax) {
        const recommendations = this.generateMaxMoveRecommendations(pokemon);
        if (recommendations.length > 0) {
          pokemon.maxMoveRecommendations = recommendations;
          analyzedCount++;
        }
      }
    });

    console.log(`  ✅ Generated Max Move recommendations for ${analyzedCount} Dynamax Pokemon`);
  }

  /**
   * Generate Max Move recommendations for a specific Pokemon
   */
  generateMaxMoveRecommendations(pokemon) {
    const recommendations = [];
    const stats = this.estimateStats(pokemon);
    const primaryType = pokemon.types[0];
    const secondaryType = pokemon.types[1];

    // Determine role-based move priorities
    const role = this.analyzeDynamaxRole(pokemon);

    // Role-based move recommendations
    if (role.primary === "Attacker") {
      // Attackers prioritize Max Attack moves
      this.addAttackMoves(recommendations, pokemon, "Primary", "Secondary");

      // Add specific support moves based on secondary role
      if (role.secondary === "Healer") {
        recommendations.push({
          moveName: "Max Spirit",
          moveType: "Support",
          category: "Spirit",
          priority: "Situational",
          description: `Heals ~8%/12%/16% of your max HP (${stats.hp}) to all allies (Level 1-3). Secondary healer capability.`,
        });
      }
      if (role.secondary === "Defender") {
        recommendations.push({
          moveName: "Max Guard",
          moveType: "Support",
          category: "Guard",
          priority: "Situational",
          description: "Shields add 20/40/60 HP (Level 1-3). Draws aggro to protect teammates. Secondary tank capability.",
        });
      }
    } else if (role.primary === "Defender") {
      // Defenders (Tanks) prioritize Max Guard
      recommendations.push({
        moveName: "Max Guard",
        moveType: "Support",
        category: "Guard",
        priority: "Primary",
        description: "Shields add 20/40/60 HP (Level 1-3). Draws aggro to protect teammates. Essential for tank role.",
      });

      // Add Max Spirit if they have secondary Healer capability (before attack moves)
      if (role.secondary === "Healer") {
        recommendations.push({
          moveName: "Max Spirit",
          moveType: "Support",
          category: "Spirit",
          priority: "Secondary",
          description: `Heals ~8%/12%/16% of your max HP (${stats.hp}) to all allies (Level 1-3). Secondary healer capability.`,
        });
        this.addAttackMoves(recommendations, pokemon, "Situational", "Situational");
      } else {
        this.addAttackMoves(recommendations, pokemon, "Secondary", "Situational");
      }
    } else if (role.primary === "Healer") {
      // Healers prioritize Max Spirit
      recommendations.push({
        moveName: "Max Spirit",
        moveType: "Support",
        category: "Spirit",
        priority: "Primary",
        description: `Heals ~8%/12%/16% of your max HP (${stats.hp}) to all allies (Level 1-3). Critical for team survival.`,
      });

      // Add Max Guard if they have secondary Defender capability (before attack moves)
      if (role.secondary === "Defender") {
        recommendations.push({
          moveName: "Max Guard",
          moveType: "Support",
          category: "Guard",
          priority: "Secondary",
          description: "Shields add 20/40/60 HP (Level 1-3). Draws aggro to protect teammates. Secondary tank capability.",
        });
        this.addAttackMoves(recommendations, pokemon, "Situational", "Situational");
      } else {
        this.addAttackMoves(recommendations, pokemon, "Secondary", "Situational");
      }
    }

    return recommendations;
  }

  /**
   * Add Max Attack moves to recommendations based on available fast moves
   */
  addAttackMoves(recommendations, pokemon, primaryPriority, secondaryPriority) {
    // Use comprehensive fast move data if available
    if (pokemon.dynamaxFastMoves && pokemon.dynamaxFastMoves.length > 0) {
      pokemon.dynamaxFastMoves.forEach((fastMove, index) => {
        const moveType = fastMove.type;
        const maxMove = this.maxMoves.attack[moveType];

        if (maxMove) {
          // Determine priority based on STAB and order
          let priority;
          if (index === 0) {
            priority = primaryPriority; // First move gets primary priority
          } else if (fastMove.stab) {
            priority = secondaryPriority; // STAB moves get secondary priority
          } else {
            priority = "Situational"; // Coverage moves are situational
          }

          // Create description based on STAB and EPS
          const stabText = fastMove.stab ? "STAB bonus" : "type coverage";
          const epsText = `${fastMove.eps} EPS`;
          const priorityText = priority === primaryPriority ? "Primary attack option" : priority === secondaryPriority ? "Alternative attack option" : "Coverage attack option";

          recommendations.push({
            moveName: maxMove.name,
            moveType: moveType,
            category: "Attack",
            priority: priority,
            description: `${maxMove.effect}. ${priorityText} with ${stabText}. Fast move: ${fastMove.moveName} (${epsText}).`,
          });
        }
      });
    } else {
      // Fallback to type-based recommendations if no fast move data
      const primaryType = pokemon.types[0];
      const secondaryType = pokemon.types[1];

      // Primary type attack move
      if (this.maxMoves.attack[primaryType]) {
        const move = this.maxMoves.attack[primaryType];
        recommendations.push({
          moveName: move.name,
          moveType: primaryType,
          category: "Attack",
          priority: primaryPriority,
          description: `${move.effect}. ${primaryPriority === "Primary" ? "Main damage dealer with STAB bonus." : "Attack option with STAB bonus."}`,
        });
      }

      // Secondary type attack move (if dual-type)
      if (secondaryType && this.maxMoves.attack[secondaryType] && secondaryType !== primaryType) {
        const move = this.maxMoves.attack[secondaryType];
        recommendations.push({
          moveName: move.name,
          moveType: secondaryType,
          category: "Attack",
          priority: secondaryPriority,
          description: `${move.effect}. ${secondaryPriority === "Secondary" ? "Alternative attack with type coverage." : "Situational attack option."}`,
        });
      }
    }
  }

  /**
   * Add support moves (Guard/Spirit) to recommendations
   */
  addSupportMoves(recommendations, stats, priority, skipSpirit = false) {
    const bulk = stats.hp + stats.defense;

    // Max Guard for tanky Pokemon
    if (bulk > 350 || stats.defense > 180) {
      recommendations.push({
        moveName: "Max Guard",
        moveType: "Support",
        category: "Guard",
        priority: priority,
        description: "Shields add 20/40/60 HP (Level 1-3). Draws aggro to protect teammates.",
      });
    }

    // Max Spirit for high HP Pokemon (unless it's already primary)
    if (!skipSpirit && stats.hp > 200) {
      recommendations.push({
        moveName: "Max Spirit",
        moveType: "Support",
        category: "Spirit",
        priority: priority,
        description: `Heals ~8%/12%/16% of your max HP (${stats.hp}) to all allies (Level 1-3).`,
      });
    }
  }

  /**
   * Determine optimal Dynamax role for each Pokemon
   */
  async determineDynamaxRoles() {
    console.log("⚙️  Determining Dynamax roles...");

    let rolesAssigned = 0;

    this.pokemonData.forEach((pokemon) => {
      if (pokemon.dynamax) {
        const role = this.analyzeDynamaxRole(pokemon);
        if (role) {
          pokemon.dynamaxRole = role;
          rolesAssigned++;
        }
      }
    });

    console.log(`  ✅ Assigned Dynamax roles to ${rolesAssigned} Pokemon`);
  }

  /**
   * Analyze and determine the best Dynamax role for a Pokemon
   */
  analyzeDynamaxRole(pokemon) {
    const stats = this.estimateStats(pokemon);
    const types = pokemon.types;

    // Calculate role scores
    const attackerScore = this.calculateAttackerScore(stats, types, pokemon);
    const defenderScore = this.calculateDefenderScore(stats, types, pokemon);
    const healerScore = this.calculateHealerScore(stats, types, pokemon);

    // Determine primary role
    const scores = [
      { role: "Attacker", score: attackerScore },
      { role: "Defender", score: defenderScore },
      { role: "Healer", score: healerScore },
    ].sort((a, b) => b.score - a.score);

    const primary = scores[0];
    const secondary = scores[1].score > 60 ? scores[1].role : undefined;

    // Generate reasoning
    const reasoning = this.generateRoleReasoning(primary, secondary, stats, pokemon);

    return {
      primary: primary.role,
      secondary: secondary,
      confidence: Math.round(primary.score),
      reasoning: reasoning,
    };
  }

  /**
   * Calculate attacker role score
   */
  calculateAttackerScore(stats, types, pokemon) {
    let score = 0;

    // Base attack stat contribution (0-40 points)
    score += Math.min(stats.attack / 6, 40);

    // Offensive typing bonus (0-20 points)
    const offensiveTypes = ["Fire", "Water", "Electric", "Grass", "Fighting", "Rock", "Ground"];
    const offensiveTypeCount = types.filter((type) => offensiveTypes.includes(type)).length;
    score += offensiveTypeCount * 10;

    // Max Battle effectiveness bonus (0-30 points)
    if (pokemon.maxBattleEffectiveAgainst?.length > 0) {
      score += Math.min(pokemon.maxBattleEffectiveAgainst.length * 10, 30);
    }

    // Speed consideration (0-10 points)
    if (stats.speed > 100) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Calculate defender (tank) role score
   * Tank role: Uses Max Guard to absorb damage and draw aggro
   */
  calculateDefenderScore(stats, types, pokemon) {
    let score = 0;

    // Defense stat is crucial for tanking (0-40 points)
    score += Math.min(stats.defense / 6, 40);

    // HP contributes to survivability (0-25 points)
    score += Math.min(stats.hp / 10, 25);

    // Defensive typing bonus (0-20 points)
    const tankTypes = ["Steel", "Rock", "Water", "Grass", "Fairy", "Psychic"];
    const tankTypeCount = types.filter((type) => tankTypes.includes(type)).length;
    score += tankTypeCount * 10;

    // Bulk calculation - tanks need good combined stats (0-15 points)
    const bulk = stats.hp + stats.defense;
    if (bulk > 400) score += 15;
    else if (bulk > 350) score += 10;
    else if (bulk > 300) score += 5;

    // Penalty if HP is too high relative to defense (better as healer)
    const hpToDefenseRatio = stats.hp / stats.defense;
    if (hpToDefenseRatio > 1.5) score -= 10; // High HP/low DEF = better healer

    // Known tank Pokemon bonus
    const tankPokemon = ["Zamazenta", "Metagross", "Zacian", "Steelix", "Aggron"];
    if (tankPokemon.includes(pokemon.base)) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Calculate healer role score
   * Healer role: Uses Max Spirit to heal team based on user's HP
   */
  calculateHealerScore(stats, types, pokemon) {
    let score = 0;

    // HP stat is most important for healing effectiveness (0-50 points)
    score += Math.min(stats.hp / 4, 50);

    // Survivability matters but less than HP (0-20 points)
    score += Math.min(stats.defense / 12, 20);

    // Supportive typing bonus (0-15 points)
    const healerTypes = ["Normal", "Fairy", "Psychic", "Water"];
    const healerTypeCount = types.filter((type) => healerTypes.includes(type)).length;
    score += healerTypeCount * 7.5;

    // High HP to defense ratio bonus (good for healing) (0-15 points)
    const hpToDefenseRatio = stats.hp / stats.defense;
    if (hpToDefenseRatio > 1.5) score += 15; // High HP/moderate DEF = good healer
    else if (hpToDefenseRatio > 1.2) score += 10;

    // Penalty for glass cannon builds (fragile attackers)
    if (stats.attack > 220 && stats.hp < 180) score -= 15;

    // Special bonus for known healer Pokemon
    const healerPokemon = ["Blissey", "Chansey", "Snorlax", "Lapras", "Wailord", "Greedent"];
    if (healerPokemon.includes(pokemon.base)) score += 20;

    return Math.max(Math.min(score, 100), 0);
  }

  /**
   * Generate role reasoning explanation
   */
  generateRoleReasoning(primary, secondary, stats, pokemon) {
    const reasons = [];

    if (primary.role === "Attacker") {
      reasons.push(`High attack stat (${stats.attack})`);
      if (pokemon.maxBattleEffectiveAgainst?.length > 0) {
        reasons.push(`effective against ${pokemon.maxBattleEffectiveAgainst.length} raid bosses`);
      }
    } else if (primary.role === "Defender") {
      reasons.push(`Strong defensive stats (${stats.defense} DEF, ${stats.hp} HP)`);
      const bulk = stats.hp + stats.defense;
      reasons.push(`excellent bulk (${bulk} combined)`);
    } else if (primary.role === "Healer") {
      reasons.push(`High HP for team healing (${stats.hp})`);
      reasons.push("optimal for Max Spirit effectiveness");
    }

    if (secondary) {
      reasons.push(`secondary ${secondary.toLowerCase()} capability`);
    }

    return reasons.join(", ") + ".";
  }

  /**
   * Estimate Pokemon stats (simplified calculation)
   */
  estimateStats(pokemon) {
    // Base stat estimates (these would ideally come from actual base stats)
    const baseStats = this.getBaseStatEstimate(pokemon.base);

    return {
      attack: baseStats.attack,
      defense: baseStats.defense,
      hp: baseStats.hp,
      speed: baseStats.speed,
    };
  }

  /**
   * Get base stat estimates for Pokemon
   */
  getBaseStatEstimate(pokemonBase) {
    // Simplified stat database - in production, this would be comprehensive
    const statDatabase = {
      Venusaur: { attack: 198, defense: 189, hp: 190, speed: 190 },
      Charizard: { attack: 223, defense: 173, hp: 186, speed: 200 },
      Blastoise: { attack: 171, defense: 207, hp: 188, speed: 186 },
      Excadrill: { attack: 255, defense: 129, hp: 242, speed: 188 },
      Raikou: { attack: 241, defense: 195, hp: 207, speed: 241 },
      Moltres: { attack: 251, defense: 184, hp: 207, speed: 251 },
      Snorlax: { attack: 190, defense: 169, hp: 330, speed: 86 },
      Lapras: { attack: 165, defense: 180, hp: 277, speed: 165 },
    };

    return statDatabase[pokemonBase] || { attack: 200, defense: 180, hp: 200, speed: 180 };
  }

  /**
   * Save enhanced Pokemon data
   */
  async saveData() {
    console.log("💾 Saving enhanced Pokemon data...");

    // Create backup
    const backupPath = this.pokemonDataPath.replace(".json", `-maxmove-backup-${Date.now()}.json`);
    fs.copyFileSync(this.pokemonDataPath, backupPath);
    console.log(`  📋 Backup created: ${path.basename(backupPath)}`);

    // Save enhanced data
    fs.writeFileSync(this.pokemonDataPath, JSON.stringify(this.pokemonData, null, 2));
    console.log(`  ✅ Enhanced data saved`);
  }

  /**
   * Generate analysis report
   */
  generateAnalysisReport() {
    const dynamaxPokemon = this.pokemonData.filter((p) => p.dynamax);
    const withMoves = dynamaxPokemon.filter((p) => p.maxMoveRecommendations?.length > 0);
    const withRoles = dynamaxPokemon.filter((p) => p.dynamaxRole);

    console.log("\n📊 MAX MOVE ANALYSIS SUMMARY");
    console.log("=".repeat(40));
    console.log(`🎯 Dynamax Pokemon: ${dynamaxPokemon.length}`);
    console.log(`💥 With Max Move recommendations: ${withMoves.length}`);
    console.log(`🎭 With role assignments: ${withRoles.length}`);

    // Role distribution
    const roleDistribution = {};
    withRoles.forEach((p) => {
      const role = p.dynamaxRole.primary;
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
    });

    console.log("\n🎭 Role Distribution:");
    Object.entries(roleDistribution).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} Pokemon`);
    });

    // Top examples
    console.log("\n🔥 Example Recommendations:");
    withMoves.slice(0, 3).forEach((pokemon) => {
      const primaryMove = pokemon.maxMoveRecommendations.find((m) => m.priority === "Primary");
      const role = pokemon.dynamaxRole?.primary || "Unknown";
      console.log(`  ${pokemon.name}: ${primaryMove?.moveName || "N/A"} (${role})`);
    });
  }
}

// CLI execution
if (require.main === module) {
  const analyzer = new MaxMoveAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = MaxMoveAnalyzer;
