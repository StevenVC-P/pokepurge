const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../pokemon.json");

function analyzeTrashabilityDistribution(pokemon) {
  console.log("🎯 TRASHABILITY SYSTEM VALIDATION");
  console.log("==================================");
  
  // Distribution analysis
  const distribution = {};
  const scoreDistribution = {};
  
  pokemon.forEach(mon => {
    distribution[mon.trashability] = (distribution[mon.trashability] || 0) + 1;
    const scoreRange = Math.floor(mon.trashabilityScore / 10) * 10;
    scoreDistribution[scoreRange] = (scoreDistribution[scoreRange] || 0) + 1;
  });
  
  console.log("\n📊 Trashability Distribution:");
  Object.entries(distribution)
    .sort(([,a], [,b]) => b - a)
    .forEach(([tier, count]) => {
      const percentage = (count / pokemon.length * 100).toFixed(1);
      console.log(`${tier}: ${count} (${percentage}%)`);
    });
  
  console.log("\n📊 Score Distribution:");
  Object.entries(scoreDistribution)
    .sort(([a], [b]) => parseInt(b) - parseInt(a))
    .forEach(([score, count]) => {
      const percentage = (count / pokemon.length * 100).toFixed(1);
      console.log(`${score}: ${count} (${percentage}%)`);
    });
  
  return { distribution, scoreDistribution };
}

function analyzeScoreComponents(pokemon) {
  console.log("\n🔍 SCORE COMPONENT ANALYSIS");
  console.log("============================");
  
  const components = {
    pvpOnly: 0,
    raidOnly: 0,
    defenseOnly: 0,
    multiRole: 0,
    noRole: 0
  };
  
  const pvpScores = [];
  const weaknessImpacts = [];
  const examples = {
    excellent: [],
    valuable: [],
    reliable: [],
    useful: [],
    trash: []
  };
  
  pokemon.forEach(mon => {
    // Simulate component scores (simplified)
    const hasPvP = mon.leagues && Object.values(mon.leagues).some(l => l && l.score >= 70);
    const hasRaid = mon.raidTier && !mon.raidTier.toLowerCase().includes('not');
    const hasDefense = mon.defenderTier && !mon.defenderTier.toLowerCase().includes('not');
    
    let roleCount = 0;
    if (hasPvP) roleCount++;
    if (hasRaid) roleCount++;
    if (hasDefense) roleCount++;
    
    if (roleCount === 0) components.noRole++;
    else if (roleCount === 1) {
      if (hasPvP) components.pvpOnly++;
      else if (hasRaid) components.raidOnly++;
      else components.defenseOnly++;
    } else {
      components.multiRole++;
    }
    
    // Collect PvP scores for analysis
    if (mon.leagues?.great?.score) {
      pvpScores.push(mon.leagues.great.score);
    }
    
    // Collect weakness impacts
    if (mon.weaknessAnalysis?.totalImpact !== undefined) {
      weaknessImpacts.push(mon.weaknessAnalysis.totalImpact);
    }
    
    // Collect examples by tier
    const tier = mon.trashability.toLowerCase();
    if (examples[tier] && examples[tier].length < 3) {
      examples[tier].push({
        name: mon.name,
        types: mon.types?.join('/') || 'Unknown',
        score: mon.trashabilityScore,
        pvpScore: mon.leagues?.great?.score || 0,
        weaknessRating: mon.weaknessAnalysis?.defensiveRating || 'N/A',
        raidTier: mon.raidTier || 'None'
      });
    }
  });
  
  console.log("\n🎭 Role Distribution:");
  Object.entries(components).forEach(([role, count]) => {
    const percentage = (count / pokemon.length * 100).toFixed(1);
    console.log(`${role}: ${count} (${percentage}%)`);
  });
  
  // PvP score statistics
  if (pvpScores.length > 0) {
    const avgPvP = pvpScores.reduce((a, b) => a + b, 0) / pvpScores.length;
    const maxPvP = Math.max(...pvpScores);
    const minPvP = Math.min(...pvpScores);
    console.log(`\n⚔️ PvP Score Stats: Avg ${avgPvP.toFixed(1)}, Range ${minPvP}-${maxPvP}`);
  }
  
  // Weakness impact statistics
  if (weaknessImpacts.length > 0) {
    const avgWeakness = weaknessImpacts.reduce((a, b) => a + b, 0) / weaknessImpacts.length;
    const maxWeakness = Math.max(...weaknessImpacts);
    const minWeakness = Math.min(...weaknessImpacts);
    console.log(`🛡️ Weakness Impact Stats: Avg ${avgWeakness.toFixed(1)}, Range ${minWeakness.toFixed(1)} to ${maxWeakness.toFixed(1)}`);
  }
  
  return { components, examples };
}

function validateLogicCoherence(pokemon) {
  console.log("\n🧪 LOGIC COHERENCE VALIDATION");
  console.log("==============================");
  
  let issues = [];
  let validations = 0;
  
  pokemon.forEach(mon => {
    validations++;
    
    // Check 1: High PvP score but low trashability
    const greatScore = mon.leagues?.great?.score || 0;
    if (greatScore >= 90 && mon.trashabilityScore < 70) {
      issues.push({
        type: "High PvP, Low Trash",
        pokemon: mon.name,
        pvpScore: greatScore,
        trashScore: mon.trashabilityScore,
        reason: "Possible weakness penalty or move issues"
      });
    }
    
    // Check 2: Excellent defense but still trash
    if (mon.weaknessAnalysis?.defensiveRating === 'Excellent' && mon.trashabilityScore < 50) {
      issues.push({
        type: "Excellent Defense, Low Score",
        pokemon: mon.name,
        defensiveRating: mon.weaknessAnalysis.defensiveRating,
        trashScore: mon.trashabilityScore,
        reason: "Defense bonus not enough to overcome other penalties"
      });
    }
    
    // Check 3: Terrible defense but high score
    if (mon.weaknessAnalysis?.defensiveRating === 'Terrible' && mon.trashabilityScore >= 90) {
      issues.push({
        type: "Terrible Defense, High Score",
        pokemon: mon.name,
        defensiveRating: mon.weaknessAnalysis.defensiveRating,
        trashScore: mon.trashabilityScore,
        reason: "Strong PvP/Raid performance overcoming weakness penalty"
      });
    }
  });
  
  console.log(`\n✅ Validated ${validations} Pokemon`);
  console.log(`⚠️ Found ${issues.length} potential logic issues`);
  
  if (issues.length > 0) {
    console.log("\n🔍 Issue Analysis:");
    const issueTypes = {};
    issues.forEach(issue => {
      issueTypes[issue.type] = (issueTypes[issue.type] || 0) + 1;
    });
    
    Object.entries(issueTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count} cases`);
    });
    
    console.log("\n📝 Example Issues:");
    issues.slice(0, 5).forEach(issue => {
      console.log(`- ${issue.pokemon}: ${issue.reason}`);
    });
  }
  
  return issues;
}

function generateRecommendations(distribution, components, issues) {
  console.log("\n💡 SYSTEM RECOMMENDATIONS");
  console.log("==========================");
  
  const recommendations = [];
  
  // Check distribution balance
  const trashPercent = (distribution.distribution.Trash || 0) / Object.values(distribution.distribution).reduce((a, b) => a + b, 0) * 100;
  const essentialPercent = (distribution.distribution.Essential || 0) / Object.values(distribution.distribution).reduce((a, b) => a + b, 0) * 100;
  
  if (trashPercent > 30) {
    recommendations.push("🔧 Consider reducing trash threshold - too many Pokemon marked as trash");
  }
  if (trashPercent < 10) {
    recommendations.push("🔧 Consider increasing trash threshold - too few Pokemon marked as trash");
  }
  if (essentialPercent > 15) {
    recommendations.push("🔧 Consider raising Essential requirements - too many Essential Pokemon");
  }
  if (essentialPercent < 3) {
    recommendations.push("🔧 Consider lowering Essential requirements - too few Essential Pokemon");
  }
  
  // Check role balance
  if (components.components.noRole > components.components.multiRole) {
    recommendations.push("🎯 Many Pokemon have no clear role - consider adjusting thresholds");
  }
  
  // Check logic issues
  if (issues.length > 50) {
    recommendations.push("⚠️ High number of logic inconsistencies - review scoring weights");
  }
  
  if (recommendations.length === 0) {
    recommendations.push("✅ System appears well-balanced!");
  }
  
  recommendations.forEach(rec => console.log(rec));
  
  return recommendations;
}

function main() {
  console.log("🎯 Starting trashability system validation...");
  
  const pokemon = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  console.log(`📊 Loaded ${pokemon.length} Pokemon for analysis`);
  
  // Run all analyses
  const distribution = analyzeTrashabilityDistribution(pokemon);
  const components = analyzeScoreComponents(pokemon);
  const issues = validateLogicCoherence(pokemon);
  const recommendations = generateRecommendations(distribution, components, issues);
  
  console.log("\n🎉 Validation completed!");
  
  return {
    distribution,
    components,
    issues,
    recommendations
  };
}

if (require.main === module) {
  main();
}

module.exports = { analyzeTrashabilityDistribution, analyzeScoreComponents, validateLogicCoherence };
