/**
 * DYNAMAX FAST MOVE ANALYZER
 *
 * Analyzes all fast moves to recommend the best ones for Dynamax Pokemon
 * based on energy generation speed (EPS - Energy Per Second) for filling Max meters.
 *
 * Key Metrics:
 * - EPS (Energy Per Second) = energyGain / turns
 * - Higher EPS = Faster Max meter charging
 * - Considers STAB (Same Type Attack Bonus) for damage types
 *
 * Output: Recommended fast moves by type for optimal Max meter generation
 */

const fs = require("fs");
const path = require("path");

class DynamaxFastMoveAnalyzer {
  constructor() {
    this.movesPath = path.resolve(__dirname, "../../public/data/moves.json");
    this.outputPath = path.resolve(__dirname, "../../public/data/dynamax-fast-moves.json");
    this.pokemonPath = path.resolve(__dirname, "../../public/data/pokemon.json");

    this.movesData = {};
    this.pokemonData = [];
    this.fastMovesByType = {};
    this.recommendations = {};
  }

  /**
   * Main analysis function
   */
  async analyze() {
    console.log("⚡ Starting Dynamax Fast Move Analysis...");
    console.log("🎯 Goal: Find fastest energy-generating moves for Max meter charging");
    console.log("-".repeat(60));

    try {
      await this.loadData();
      await this.analyzeFastMoves();
      await this.generateRecommendations();
      await this.addRecommendationsToPokemon();
      await this.saveResults();

      console.log("\n✅ Dynamax Fast Move Analysis Complete!");
      this.generateSummaryReport();
    } catch (error) {
      console.error("❌ Error during analysis:", error.message);
      throw error;
    }
  }

  /**
   * Load moves and Pokemon data
   */
  async loadData() {
    console.log("📂 Loading data files...");

    // Load moves data
    this.movesData = JSON.parse(fs.readFileSync(this.movesPath, "utf8"));
    const totalMoves = Object.keys(this.movesData).length;
    console.log(`  📊 Loaded ${totalMoves} moves`);

    // Load Pokemon data
    this.pokemonData = JSON.parse(fs.readFileSync(this.pokemonPath, "utf8"));
    const dynamaxCount = this.pokemonData.filter((p) => p.dynamax).length;
    console.log(`  🔥 Loaded ${this.pokemonData.length} Pokemon (${dynamaxCount} Dynamax)`);

    // Load PvPoke gamemaster data for complete movesets
    const gamemasterPath = path.join(__dirname, "../outputs/pvpoke-gamemaster-raw.json");
    if (fs.existsSync(gamemasterPath)) {
      const gamemasterData = JSON.parse(fs.readFileSync(gamemasterPath, "utf8"));
      this.pvpokeData = gamemasterData.pokemon || [];
      console.log(`  🎯 Loaded ${this.pvpokeData.length} Pokemon from PvPoke gamemaster`);

      // Create lookup map for fast access
      this.pvpokeLookup = new Map();
      this.pvpokeData.forEach((pokemon) => {
        this.pvpokeLookup.set(pokemon.speciesId, pokemon);
        // Also add shadow variant lookup
        if (pokemon.speciesId.endsWith("_shadow")) {
          const baseId = pokemon.speciesId.replace("_shadow", "");
          this.pvpokeLookup.set(baseId + "_shadow", pokemon);
        }
      });
    } else {
      console.warn("  ⚠️ PvPoke gamemaster data not found - using limited moveset data");
      this.pvpokeData = [];
      this.pvpokeLookup = new Map();
    }
  }

  /**
   * Analyze all fast moves by type and EPS
   */
  async analyzeFastMoves() {
    console.log("⚡ Analyzing fast moves by type and energy generation...");

    // Group fast moves by type
    Object.values(this.movesData).forEach((move) => {
      if (move.category === "fast" && move.energyGain && move.turns) {
        const type = move.type;
        const eps = move.energyGain / move.turns; // Energy Per Second
        const dps = move.power / move.turns; // Damage Per Second

        if (!this.fastMovesByType[type]) {
          this.fastMovesByType[type] = [];
        }

        this.fastMovesByType[type].push({
          ...move,
          eps: Math.round(eps * 100) / 100,
          dps: Math.round(dps * 100) / 100,
          efficiency: Math.round((eps * 2 + dps) * 100) / 100, // Weighted toward energy
        });
      }
    });

    // Sort moves by EPS within each type
    Object.keys(this.fastMovesByType).forEach((type) => {
      this.fastMovesByType[type].sort((a, b) => {
        // Primary sort: EPS (higher is better)
        if (b.eps !== a.eps) return b.eps - a.eps;
        // Secondary sort: DPS (higher is better)
        return b.dps - a.dps;
      });
    });

    const typeCount = Object.keys(this.fastMovesByType).length;
    console.log(`  ✅ Analyzed fast moves for ${typeCount} types`);
  }

  /**
   * Generate move recommendations by type
   */
  async generateRecommendations() {
    console.log("🎯 Generating fast move recommendations...");

    this.recommendations = {
      metadata: {
        version: "1.0.0",
        generatedAt: new Date().toISOString(),
        description: "Fast move recommendations for Dynamax Pokemon based on energy generation speed",
        criteria: {
          primary: "Energy Per Second (EPS)",
          secondary: "Damage Per Second (DPS)",
          goal: "Fastest Max meter charging",
        },
      },
      byType: {},
      topOverall: [],
    };

    // Generate recommendations by type
    Object.entries(this.fastMovesByType).forEach(([type, moves]) => {
      const topMoves = moves.slice(0, 3); // Top 3 moves per type

      this.recommendations.byType[type] = {
        recommended: topMoves.map((move) => ({
          name: move.name,
          id: move.id,
          eps: move.eps,
          dps: move.dps,
          efficiency: move.efficiency,
          energyGain: move.energyGain,
          turns: move.turns,
          power: move.power,
          reasoning: this.generateMoveReasoning(move, moves),
        })),
        alternativeCount: Math.max(0, moves.length - 3),
      };
    });

    // Generate top overall moves (cross-type)
    const allMoves = Object.values(this.fastMovesByType).flat();
    allMoves.sort((a, b) => b.eps - a.eps);

    this.recommendations.topOverall = allMoves.slice(0, 10).map((move) => ({
      name: move.name,
      type: move.type,
      eps: move.eps,
      dps: move.dps,
      efficiency: move.efficiency,
      reasoning: `${move.eps} EPS - ${this.getEPSRating(move.eps)} energy generation`,
    }));

    console.log(`  ✅ Generated recommendations for ${Object.keys(this.recommendations.byType).length} types`);
  }

  /**
   * Generate reasoning for move recommendation
   */
  generateMoveReasoning(move, allMovesOfType) {
    const rank = allMovesOfType.findIndex((m) => m.id === move.id) + 1;
    const epsRating = this.getEPSRating(move.eps);

    if (rank === 1) {
      return `Best ${move.type} fast move for Max meter charging (${move.eps} EPS)`;
    } else {
      return `${this.getOrdinal(rank)} best ${move.type} move - ${epsRating} energy generation`;
    }
  }

  /**
   * Get EPS rating description
   */
  getEPSRating(eps) {
    if (eps >= 4.5) return "Excellent";
    if (eps >= 4.0) return "Very Good";
    if (eps >= 3.5) return "Good";
    if (eps >= 3.0) return "Average";
    return "Below Average";
  }

  /**
   * Get ordinal number (1st, 2nd, 3rd, etc.)
   */
  getOrdinal(num) {
    const suffixes = ["th", "st", "nd", "rd"];
    const v = num % 100;
    return num + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
  }

  /**
   * Get Pokemon's available fast moves from their movesets
   */
  getPokemonFastMoves(pokemon) {
    const availableFastMoves = new Set();

    // First try to get comprehensive moveset from PvPoke gamemaster data
    const pokemonId = this.getPokemonSpeciesId(pokemon);
    const pvpokeData = this.pvpokeLookup.get(pokemonId);

    if (pvpokeData && pvpokeData.fastMoves) {
      // Add all fast moves from PvPoke gamemaster
      pvpokeData.fastMoves.forEach((move) => {
        availableFastMoves.add(move.toLowerCase());
      });
    }

    // Also check league movesets as fallback/supplement
    if (pokemon.leagues) {
      Object.values(pokemon.leagues).forEach((league) => {
        if (league.moveset && league.moveset.length > 0) {
          // First move in moveset is typically the fast move
          const fastMove = league.moveset[0];
          if (fastMove) {
            availableFastMoves.add(fastMove.toLowerCase());
          }
        }
      });
    }

    return Array.from(availableFastMoves);
  }

  /**
   * Convert Pokemon name to PvPoke species ID format
   */
  getPokemonSpeciesId(pokemon) {
    let speciesId = pokemon.base || pokemon.name;

    // Convert to lowercase and replace spaces/special chars
    speciesId = speciesId
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");

    // Handle shadow forms
    if (pokemon.form === "Shadow" || pokemon.name.includes("Shadow")) {
      speciesId += "_shadow";
    }

    // Handle other common form variations (but skip "normal" and "Normal" forms)
    if (pokemon.form && pokemon.form.toLowerCase() !== "normal" && pokemon.form.toLowerCase() !== "shadow") {
      const formId = pokemon.form
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
      speciesId += "_" + formId;
    }

    return speciesId;
  }

  /**
   * Find best fast move for a type that Pokemon can actually learn
   */
  findBestLearnableFastMove(pokemon, type) {
    const availableFastMoves = this.getPokemonFastMoves(pokemon);
    const typeRecommendations = this.recommendations.byType[type.toLowerCase()];

    if (!typeRecommendations || !typeRecommendations.recommended.length) {
      return null;
    }

    // Find the best move of this type that the Pokemon can actually learn
    for (const move of typeRecommendations.recommended) {
      const moveId = move.id.toLowerCase();
      const altMoveId = move.name.toLowerCase().replace(/\s+/g, "_");

      if (availableFastMoves.some((available) => available.includes(moveId) || available.includes(altMoveId) || available.includes(move.name.toLowerCase()))) {
        return move;
      }
    }

    return null;
  }

  /**
   * Get all types that Pokemon can learn fast moves for
   */
  getPokemonLearnableTypes(pokemon) {
    const availableFastMoves = this.getPokemonFastMoves(pokemon);
    const learnableTypes = new Set();

    // Check each type's moves to see if Pokemon can learn any
    Object.entries(this.recommendations.byType).forEach(([type, typeData]) => {
      if (typeData.recommended && typeData.recommended.length > 0) {
        // Check if Pokemon can learn any move of this type
        const canLearnType = typeData.recommended.some((move) => {
          const moveId = move.id.toLowerCase();
          const altMoveId = move.name.toLowerCase().replace(/\s+/g, "_");

          return availableFastMoves.some((available) => available.includes(moveId) || available.includes(altMoveId) || available.includes(move.name.toLowerCase()));
        });

        if (canLearnType) {
          learnableTypes.add(type);
        }
      }
    });

    return Array.from(learnableTypes);
  }

  /**
   * Add fast move recommendations to Pokemon data
   */
  async addRecommendationsToPokemon() {
    console.log("🔥 Adding fast move recommendations to Dynamax Pokemon...");

    let enhancedCount = 0;

    this.pokemonData.forEach((pokemon) => {
      if (pokemon.dynamax && pokemon.types) {
        const fastMoveRecommendations = [];

        // Get all types this Pokemon can learn fast moves for
        const learnableTypes = this.getPokemonLearnableTypes(pokemon);

        // Find the best move for each learnable type
        learnableTypes.forEach((type) => {
          const bestMove = this.findBestLearnableFastMove(pokemon, type);
          if (bestMove) {
            // Check if this is a STAB move (matches Pokemon's types)
            const isStab = pokemon.types.some((pokemonType) => pokemonType.toLowerCase() === type.toLowerCase());

            fastMoveRecommendations.push({
              type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize type
              moveName: bestMove.name,
              moveId: bestMove.id,
              eps: bestMove.eps,
              dps: bestMove.dps,
              stab: isStab,
              reasoning: `${bestMove.eps} EPS - ${this.getEPSRating(bestMove.eps)} energy generation`,
            });
          }
        });

        // Sort by EPS (highest first), then by STAB (STAB moves first)
        fastMoveRecommendations.sort((a, b) => {
          if (a.stab !== b.stab) return b.stab - a.stab; // STAB first
          return b.eps - a.eps; // Then by EPS
        });

        if (fastMoveRecommendations.length > 0) {
          pokemon.dynamaxFastMoves = fastMoveRecommendations;
          enhancedCount++;
        }
      }
    });

    console.log(`  ✅ Enhanced ${enhancedCount} Dynamax Pokemon with fast move recommendations`);
  }

  /**
   * Save results to files
   */
  async saveResults() {
    console.log("💾 Saving analysis results...");

    // Save fast move recommendations
    fs.writeFileSync(this.outputPath, JSON.stringify(this.recommendations, null, 2));
    console.log(`  📊 Fast move recommendations saved to: ${this.outputPath}`);

    // Save updated Pokemon data
    fs.writeFileSync(this.pokemonPath, JSON.stringify(this.pokemonData, null, 2));
    console.log(`  🔥 Updated Pokemon data saved to: ${this.pokemonPath}`);
  }

  /**
   * Generate summary report
   */
  generateSummaryReport() {
    console.log("\n📊 DYNAMAX FAST MOVE ANALYSIS SUMMARY");
    console.log("=".repeat(50));

    // Top EPS moves overall
    console.log("\n⚡ TOP ENERGY GENERATION MOVES:");
    this.recommendations.topOverall.slice(0, 5).forEach((move, index) => {
      console.log(`  ${index + 1}. ${move.name} (${move.type}) - ${move.eps} EPS`);
    });

    // Type coverage
    console.log(`\n🎯 TYPE COVERAGE: ${Object.keys(this.recommendations.byType).length} types analyzed`);

    // Enhanced Pokemon count
    const enhancedPokemon = this.pokemonData.filter((p) => p.dynamaxFastMoves).length;
    console.log(`🔥 ENHANCED POKEMON: ${enhancedPokemon} Dynamax Pokemon with recommendations`);

    console.log("\n💡 USAGE:");
    console.log("  • Use Primary moves for STAB damage + fast charging");
    console.log("  • Use Alternative moves for different matchups");
    console.log("  • Use Coverage moves for type effectiveness");
    console.log("  • Higher EPS = Faster Max move usage");
  }
}

// CLI execution
if (require.main === module) {
  const analyzer = new DynamaxFastMoveAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = DynamaxFastMoveAnalyzer;
