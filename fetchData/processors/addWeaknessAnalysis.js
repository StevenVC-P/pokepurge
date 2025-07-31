const fs = require("fs");
const path = require("path");
const { calculateWeaknessImpact } = require("../analyzers/analyzeWeaknessImpact");

const INPUT_PATH = path.resolve(__dirname, "../outputs/pokemon-condensed-meta.json");
const META_ATTACK_TYPES_PATH = path.resolve(__dirname, "../outputs/meta-attack-types.json");
const OUTPUT_PATH = path.resolve(__dirname, "../outputs/PokemonMaster_with_weakness.json");

function loadData() {
  console.log("📊 Loading Pokemon and meta attack data...");

  const pokemon = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  const metaData = JSON.parse(fs.readFileSync(META_ATTACK_TYPES_PATH, "utf8"));

  console.log(`✅ Loaded ${pokemon.length} Pokemon and ${metaData.typeDistribution.length} meta attack types`);
  return { pokemon, metaAttackTypes: metaData.typeDistribution };
}

function addWeaknessAnalysis(pokemon, metaAttackTypes) {
  console.log("🎯 Adding weakness analysis to Pokemon...");

  let processedCount = 0;
  let withTypesCount = 0;

  const enhanced = pokemon.map((mon) => {
    processedCount++;

    // Skip Pokemon without types
    if (!mon.types || mon.types.length === 0) {
      return {
        ...mon,
        weaknessAnalysis: null,
      };
    }

    withTypesCount++;

    // Calculate weakness impact
    const weaknessAnalysis = calculateWeaknessImpact(
      mon.types.map((t) => t.toLowerCase()),
      metaAttackTypes
    );

    return {
      ...mon,
      weaknessAnalysis: {
        totalImpact: weaknessAnalysis.totalImpact,
        defensiveRating: weaknessAnalysis.defensiveRating,
        weaknessCount: weaknessAnalysis.weaknessCount,
        resistanceCount: weaknessAnalysis.resistanceCount,
        majorWeaknesses: weaknessAnalysis.weaknesses
          .filter((w) => w.severity === "high")
          .map((w) => ({
            type: w.type,
            effectiveness: w.effectiveness,
            usage: w.usage,
            impact: w.finalImpact,
          })),
        majorResistances: weaknessAnalysis.resistances
          .filter((r) => r.benefit === "high")
          .map((r) => ({
            type: r.type,
            effectiveness: r.effectiveness,
            usage: r.usage,
            benefit: Math.abs(r.finalImpact),
          })),
        // Summary stats for easy access
        hasHighImpactWeaknesses: weaknessAnalysis.weaknesses.some((w) => w.severity === "high"),
        hasHighBenefitResistances: weaknessAnalysis.resistances.some((r) => r.benefit === "high"),
        netDefensiveScore: Math.round((10 - weaknessAnalysis.totalImpact) * 10) / 10, // Higher is better
      },
    };
  });

  console.log(`✅ Processed ${processedCount} Pokemon`);
  console.log(`📊 ${withTypesCount} Pokemon have weakness analysis`);
  console.log(`📊 ${processedCount - withTypesCount} Pokemon skipped (no types)`);

  return enhanced;
}

function generateWeaknessReport(pokemon) {
  console.log("\n📋 POKEMON WEAKNESS ANALYSIS REPORT");
  console.log("====================================");

  // Filter Pokemon with weakness analysis
  const analyzed = pokemon.filter((p) => p.weaknessAnalysis);

  // Best defensive Pokemon
  const bestDefensive = analyzed
    .filter((p) => p.weaknessAnalysis.totalImpact <= 0)
    .sort((a, b) => a.weaknessAnalysis.totalImpact - b.weaknessAnalysis.totalImpact)
    .slice(0, 10);

  console.log(`\n🛡️ Best Defensive Pokemon (Low Weakness Impact):`);
  bestDefensive.forEach((mon, index) => {
    const wa = mon.weaknessAnalysis;
    console.log(`${index + 1}. ${mon.name} (${mon.types.join("/")}): ${wa.defensiveRating} (${wa.totalImpact >= 0 ? "+" : ""}${wa.totalImpact})`);
  });

  // Worst defensive Pokemon
  const worstDefensive = analyzed.sort((a, b) => b.weaknessAnalysis.totalImpact - a.weaknessAnalysis.totalImpact).slice(0, 10);

  console.log(`\n💀 Most Vulnerable Pokemon (High Weakness Impact):`);
  worstDefensive.forEach((mon, index) => {
    const wa = mon.weaknessAnalysis;
    console.log(`${index + 1}. ${mon.name} (${mon.types.join("/")}): ${wa.defensiveRating} (+${wa.totalImpact})`);
  });

  // Type distribution analysis
  const typeStats = {};
  analyzed.forEach((mon) => {
    const typeKey = mon.types.join("/");
    if (!typeStats[typeKey]) {
      typeStats[typeKey] = {
        count: 0,
        totalImpact: 0,
        avgImpact: 0,
        examples: [],
      };
    }
    typeStats[typeKey].count++;
    typeStats[typeKey].totalImpact += mon.weaknessAnalysis.totalImpact;
    if (typeStats[typeKey].examples.length < 3) {
      typeStats[typeKey].examples.push(mon.name);
    }
  });

  // Calculate averages and sort
  Object.values(typeStats).forEach((stat) => {
    stat.avgImpact = stat.totalImpact / stat.count;
  });

  const sortedTypes = Object.entries(typeStats)
    .filter(([type, stat]) => stat.count >= 3) // Only types with 3+ Pokemon
    .sort(([, a], [, b]) => a.avgImpact - b.avgImpact)
    .slice(0, 10);

  console.log(`\n🏆 Best Type Combinations (3+ Pokemon):`);
  sortedTypes.forEach(([type, stat], index) => {
    console.log(`${index + 1}. ${type}: ${stat.avgImpact.toFixed(1)} avg impact (${stat.count} Pokemon)`);
  });

  // Summary statistics
  const totalAnalyzed = analyzed.length;
  const excellentDefense = analyzed.filter((p) => p.weaknessAnalysis.defensiveRating === "Excellent").length;
  const terribleDefense = analyzed.filter((p) => p.weaknessAnalysis.defensiveRating === "Terrible").length;
  const avgImpact = analyzed.reduce((sum, p) => sum + p.weaknessAnalysis.totalImpact, 0) / totalAnalyzed;

  console.log(`\n📊 Summary Statistics:`);
  console.log(`- Total analyzed: ${totalAnalyzed} Pokemon`);
  console.log(`- Excellent defense: ${excellentDefense} (${((excellentDefense / totalAnalyzed) * 100).toFixed(1)}%)`);
  console.log(`- Terrible defense: ${terribleDefense} (${((terribleDefense / totalAnalyzed) * 100).toFixed(1)}%)`);
  console.log(`- Average weakness impact: ${avgImpact.toFixed(2)}`);
}

function main() {
  console.log("🎯 Starting weakness analysis integration...");

  try {
    // Load data
    const { pokemon, metaAttackTypes } = loadData();

    // Add weakness analysis
    const enhanced = addWeaknessAnalysis(pokemon, metaAttackTypes);

    // Generate report
    generateWeaknessReport(enhanced);

    // Save enhanced data
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(enhanced, null, 2));
    console.log(`\n💾 Enhanced Pokemon data saved to: ${OUTPUT_PATH}`);

    console.log("\n🎉 Weakness analysis integration completed!");

    return enhanced;
  } catch (error) {
    console.error("❌ Error during weakness analysis:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { addWeaknessAnalysis, loadData };
