const fs = require("fs");
const path = require("path");
const { getWeaknesses, getResistances, getEffectivenessVsDualType } = require("../data/typeEffectiveness");

const META_ATTACK_TYPES_PATH = path.resolve(__dirname, "../outputs/meta-attack-types.json");
const OUTPUT_PATH = path.resolve(__dirname, "../outputs/weakness-impact-analysis.json");

// Weakness impact scoring weights
const IMPACT_WEIGHTS = {
  // Base multipliers for effectiveness levels
  effectiveness: {
    2.56: 10,  // Double super effective
    1.6: 6,    // Super effective
    1.0: 0,    // Neutral (no impact)
    0.625: -3, // Not very effective (resistance bonus)
    0.39: -5   // Double not very effective (strong resistance bonus)
  },
  
  // Usage frequency multiplier (how common the attack type is in meta)
  usageMultiplier: {
    high: 1.5,    // >30% usage
    medium: 1.2,  // 15-30% usage
    low: 1.0,     // 5-15% usage
    rare: 0.7     // <5% usage
  }
};

function loadMetaAttackData() {
  console.log("📊 Loading meta attack type analysis...");
  
  try {
    const metaData = JSON.parse(fs.readFileSync(META_ATTACK_TYPES_PATH, "utf8"));
    console.log(`✅ Loaded meta analysis with ${metaData.typeDistribution.length} attack types`);
    return metaData;
  } catch (error) {
    console.error("❌ Error loading meta attack data:", error.message);
    console.log("💡 Run analyzeMetaAttackTypes.js first to generate the required data");
    process.exit(1);
  }
}

function getUsageCategory(percentage) {
  if (percentage >= 30) return 'high';
  if (percentage >= 15) return 'medium';
  if (percentage >= 5) return 'low';
  return 'rare';
}

function calculateWeaknessImpact(pokemonTypes, metaAttackTypes) {
  const weaknesses = getWeaknesses(pokemonTypes);
  const resistances = getResistances(pokemonTypes);
  
  let totalImpact = 0;
  let weaknessDetails = [];
  let resistanceDetails = [];
  
  // Calculate weakness impact
  Object.entries(weaknesses).forEach(([attackType, effectiveness]) => {
    const metaType = metaAttackTypes.find(t => t.type === attackType);
    const usage = metaType ? metaType.percentage : 0;
    const usageCategory = getUsageCategory(usage);
    
    const baseImpact = IMPACT_WEIGHTS.effectiveness[effectiveness] || 0;
    const usageMultiplier = IMPACT_WEIGHTS.usageMultiplier[usageCategory];
    const impact = baseImpact * usageMultiplier * (usage / 100);
    
    totalImpact += impact;
    
    weaknessDetails.push({
      type: attackType,
      effectiveness,
      usage: usage,
      usageCategory,
      baseImpact,
      finalImpact: impact,
      severity: impact >= 3 ? 'high' : impact >= 1 ? 'medium' : 'low'
    });
  });
  
  // Calculate resistance bonus (negative impact = good for defense)
  Object.entries(resistances).forEach(([attackType, effectiveness]) => {
    const metaType = metaAttackTypes.find(t => t.type === attackType);
    const usage = metaType ? metaType.percentage : 0;
    const usageCategory = getUsageCategory(usage);
    
    const baseImpact = IMPACT_WEIGHTS.effectiveness[effectiveness] || 0;
    const usageMultiplier = IMPACT_WEIGHTS.usageMultiplier[usageCategory];
    const impact = baseImpact * usageMultiplier * (usage / 100);
    
    totalImpact += impact; // This will be negative, reducing total impact
    
    resistanceDetails.push({
      type: attackType,
      effectiveness,
      usage: usage,
      usageCategory,
      baseImpact,
      finalImpact: impact,
      benefit: Math.abs(impact) >= 2 ? 'high' : Math.abs(impact) >= 0.5 ? 'medium' : 'low'
    });
  });
  
  // Sort by impact/benefit
  weaknessDetails.sort((a, b) => b.finalImpact - a.finalImpact);
  resistanceDetails.sort((a, b) => a.finalImpact - b.finalImpact); // Most negative first
  
  return {
    totalImpact: Math.round(totalImpact * 100) / 100,
    weaknessCount: weaknessDetails.length,
    resistanceCount: resistanceDetails.length,
    weaknesses: weaknessDetails,
    resistances: resistanceDetails,
    defensiveRating: calculateDefensiveRating(totalImpact)
  };
}

function calculateDefensiveRating(totalImpact) {
  // Convert impact score to defensive rating
  if (totalImpact <= -5) return 'Excellent';
  if (totalImpact <= -2) return 'Very Good';
  if (totalImpact <= 0) return 'Good';
  if (totalImpact <= 3) return 'Average';
  if (totalImpact <= 6) return 'Poor';
  if (totalImpact <= 10) return 'Very Poor';
  return 'Terrible';
}

function analyzeAllTypeCominations(metaAttackTypes) {
  console.log("🎯 Analyzing all type combinations...");
  
  const allTypes = ['normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost', 
                   'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon', 
                   'dark', 'fairy'];
  
  const results = [];
  
  // Single types
  allTypes.forEach(type => {
    const analysis = calculateWeaknessImpact([type], metaAttackTypes);
    results.push({
      types: [type],
      typeString: type,
      ...analysis
    });
  });
  
  // Dual types (sample of common combinations)
  const commonDualTypes = [
    ['water', 'ground'], ['grass', 'poison'], ['normal', 'flying'], ['bug', 'flying'],
    ['rock', 'ground'], ['fire', 'flying'], ['water', 'flying'], ['electric', 'flying'],
    ['psychic', 'flying'], ['ice', 'flying'], ['steel', 'flying'], ['dragon', 'flying'],
    ['water', 'ice'], ['grass', 'fighting'], ['fire', 'fighting'], ['water', 'fighting'],
    ['steel', 'psychic'], ['dark', 'flying'], ['ghost', 'poison'], ['fairy', 'flying']
  ];
  
  commonDualTypes.forEach(types => {
    const analysis = calculateWeaknessImpact(types, metaAttackTypes);
    results.push({
      types: types,
      typeString: types.join('/'),
      ...analysis
    });
  });
  
  // Sort by defensive rating (best to worst)
  results.sort((a, b) => a.totalImpact - b.totalImpact);
  
  console.log(`📊 Analyzed ${results.length} type combinations`);
  return results;
}

function generateWeaknessReport(typeAnalysis, metaAttackTypes) {
  console.log("\n📋 WEAKNESS IMPACT ANALYSIS REPORT");
  console.log("===================================");
  
  console.log(`\n🏆 Best Defensive Types:`);
  typeAnalysis.slice(0, 10).forEach((combo, index) => {
    console.log(`${index + 1}. ${combo.typeString}: ${combo.defensiveRating} (${combo.totalImpact >= 0 ? '+' : ''}${combo.totalImpact})`);
  });
  
  console.log(`\n💀 Worst Defensive Types:`);
  typeAnalysis.slice(-10).reverse().forEach((combo, index) => {
    console.log(`${index + 1}. ${combo.typeString}: ${combo.defensiveRating} (+${combo.totalImpact})`);
  });
  
  console.log(`\n⚡ Most Threatening Attack Types:`);
  const threatLevels = {};
  typeAnalysis.forEach(combo => {
    combo.weaknesses.forEach(weakness => {
      if (!threatLevels[weakness.type]) {
        threatLevels[weakness.type] = { totalThreat: 0, count: 0 };
      }
      threatLevels[weakness.type].totalThreat += weakness.finalImpact;
      threatLevels[weakness.type].count += 1;
    });
  });
  
  const sortedThreats = Object.entries(threatLevels)
    .map(([type, data]) => ({
      type,
      avgThreat: data.totalThreat / data.count,
      totalThreat: data.totalThreat,
      count: data.count
    }))
    .sort((a, b) => b.avgThreat - a.avgThreat)
    .slice(0, 10);
  
  sortedThreats.forEach((threat, index) => {
    const metaUsage = metaAttackTypes.find(t => t.type === threat.type)?.percentage || 0;
    console.log(`${index + 1}. ${threat.type}: ${threat.avgThreat.toFixed(1)} avg impact (${metaUsage.toFixed(1)}% meta usage)`);
  });
}

function main() {
  console.log("🎯 Starting weakness impact analysis...");
  
  try {
    // Load meta attack type data
    const metaData = loadMetaAttackData();
    
    // Analyze type combinations
    const typeAnalysis = analyzeAllTypeCominations(metaData.typeDistribution);
    
    // Generate report
    generateWeaknessReport(typeAnalysis, metaData.typeDistribution);
    
    // Prepare output data
    const results = {
      summary: {
        analysisDate: new Date().toISOString(),
        metaDataSource: META_ATTACK_TYPES_PATH,
        totalTypeCombinations: typeAnalysis.length,
        impactWeights: IMPACT_WEIGHTS
      },
      metaAttackTypes: metaData.typeDistribution,
      typeAnalysis: typeAnalysis,
      bestDefensive: typeAnalysis.slice(0, 20),
      worstDefensive: typeAnalysis.slice(-20).reverse()
    };
    
    // Save results
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(results, null, 2));
    console.log(`\n💾 Analysis saved to: ${OUTPUT_PATH}`);
    
    console.log("\n🎉 Weakness impact analysis completed!");
    
    return results;
    
  } catch (error) {
    console.error("❌ Error during analysis:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { 
  calculateWeaknessImpact, 
  analyzeAllTypeCominations,
  IMPACT_WEIGHTS,
  getUsageCategory
};
