#!/usr/bin/env node

/**
 * Summary script to show the current organization of the fetchData pipeline
 */

const fs = require('fs');
const path = require('path');

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    return `${sizeKB}KB`;
  } catch {
    return 'N/A';
  }
}

function listFiles(dir, prefix = '') {
  const items = [];
  try {
    const files = fs.readdirSync(dir).sort();
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        items.push(`${prefix}📂 ${file}/`);
        items.push(...listFiles(fullPath, prefix + '  '));
      } else {
        const size = getFileSize(fullPath);
        const icon = file.endsWith('.js') ? '🔧' : file.endsWith('.json') ? '📄' : '📝';
        items.push(`${prefix}${icon} ${file} (${size})`);
      }
    }
  } catch (err) {
    items.push(`${prefix}❌ Error reading directory: ${err.message}`);
  }
  return items;
}

function showPipelineStatus() {
  console.log('🎯 Pokemon GO Data Pipeline Organization\n');
  
  // Show main structure
  console.log('📁 Project Structure:');
  const structure = listFiles(__dirname);
  structure.forEach(item => console.log(item));
  
  console.log('\n📊 Pipeline Summary:');
  
  // Count scripts by category
  const scrapers = fs.readdirSync(path.join(__dirname, 'scrapers')).filter(f => f.endsWith('.js')).length;
  const processors = fs.readdirSync(path.join(__dirname, 'processors')).filter(f => f.endsWith('.js')).length;
  const builders = fs.readdirSync(path.join(__dirname, 'builders')).filter(f => f.endsWith('.js')).length;
  
  console.log(`  🤖 Scrapers: ${scrapers} scripts`);
  console.log(`  ⚙️ Processors: ${processors} scripts`);
  console.log(`  🏗️ Builders: ${builders} scripts`);
  
  // Check for key output files
  console.log('\n📋 Key Output Files:');
  const keyFiles = [
    'pokemon.json',
    'outputs/PokemonMaster.json',
    'outputs/pokemon-variants.json',
    'outputs/pokemon-condensed-meta.json'
  ];
  
  keyFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const exists = fs.existsSync(fullPath);
    const status = exists ? '✅' : '❌';
    const size = exists ? getFileSize(fullPath) : 'Missing';
    console.log(`  ${status} ${file} (${size})`);
  });
  
  console.log('\n🚀 Quick Start Commands:');
  console.log('  node runAll.js              # Run complete pipeline');
  console.log('  node runAll.js --skip-scrapers  # Skip scraping phase');
  console.log('  node validate.js            # Validate all outputs');
  console.log('  node runAll.js --help       # Show all options');
  
  console.log('\n📖 Documentation:');
  console.log('  📝 README.md               # Complete documentation');
  console.log('  ⚙️ config/pipeline.json    # Pipeline configuration');
  console.log('  🔍 validate.js             # Data validation');
}

if (require.main === module) {
  showPipelineStatus();
}

module.exports = { showPipelineStatus, listFiles, getFileSize };
