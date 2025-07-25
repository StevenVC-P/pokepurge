#!/usr/bin/env node

/**
 * Validation script for Pokemon GO data pipeline
 * Validates data integrity and completeness at each stage
 */

const fs = require('fs');
const path = require('path');

// Load configuration
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config/pipeline.json'), 'utf8'));

function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🔍'
  }[level] || '📋';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function validateFileExists(filePath, required = true) {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  
  if (!exists && required) {
    throw new Error(`Required file missing: ${filePath}`);
  }
  
  if (exists) {
    const stats = fs.statSync(fullPath);
    log(`✓ ${filePath} (${(stats.size / 1024).toFixed(1)}KB)`, 'success');
    return true;
  } else {
    log(`✗ ${filePath} (optional, missing)`, 'warning');
    return false;
  }
}

function validateJsonFile(filePath, validator = null) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    const data = JSON.parse(content);
    
    if (validator) {
      validator(data, filePath);
    }
    
    return data;
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err.message}`);
  }
}

function validatePokemonVariants(data, filePath) {
  if (!Array.isArray(data)) {
    throw new Error(`${filePath}: Expected array, got ${typeof data}`);
  }
  
  if (data.length < config.validation.min_pokemon_count) {
    throw new Error(`${filePath}: Too few Pokemon (${data.length} < ${config.validation.min_pokemon_count})`);
  }
  
  if (data.length > config.validation.max_pokemon_count) {
    throw new Error(`${filePath}: Too many Pokemon (${data.length} > ${config.validation.max_pokemon_count})`);
  }
  
  // Check required fields
  const requiredFields = ['id', 'name', 'base', 'form'];
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const pokemon = data[i];
    for (const field of requiredFields) {
      if (!(field in pokemon)) {
        throw new Error(`${filePath}: Missing field '${field}' in Pokemon ${i}`);
      }
    }
  }
  
  log(`${filePath}: ${data.length} Pokemon validated`, 'success');
}

function validateRankings(data, filePath) {
  if (!Array.isArray(data)) {
    throw new Error(`${filePath}: Expected array, got ${typeof data}`);
  }
  
  if (data.length === 0) {
    throw new Error(`${filePath}: Empty rankings file`);
  }
  
  // Check first few entries have required fields
  const requiredFields = ['speciesId', 'rating', 'score'];
  for (let i = 0; i < Math.min(5, data.length); i++) {
    const entry = data[i];
    for (const field of requiredFields) {
      if (!(field in entry)) {
        throw new Error(`${filePath}: Missing field '${field}' in entry ${i}`);
      }
    }
  }
  
  log(`${filePath}: ${data.length} rankings validated`, 'success');
}

function validateTiers(data, filePath) {
  if (typeof data !== 'object' || data === null) {
    throw new Error(`${filePath}: Expected object, got ${typeof data}`);
  }
  
  const tierCount = Object.keys(data).length;
  if (tierCount === 0) {
    throw new Error(`${filePath}: No tiers found`);
  }
  
  // Check each tier has Pokemon
  for (const [tier, pokemon] of Object.entries(data)) {
    if (!Array.isArray(pokemon)) {
      throw new Error(`${filePath}: Tier '${tier}' is not an array`);
    }
    if (pokemon.length === 0) {
      log(`${filePath}: Tier '${tier}' is empty`, 'warning');
    }
  }
  
  log(`${filePath}: ${tierCount} tiers validated`, 'success');
}

function validateFinalPokemon(data, filePath) {
  validatePokemonVariants(data, filePath);
  
  // Additional checks for final Pokemon data
  const requiredFields = ['trashability', 'recommendedCount', 'leagues'];
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const pokemon = data[i];
    for (const field of requiredFields) {
      if (!(field in pokemon)) {
        throw new Error(`${filePath}: Missing field '${field}' in Pokemon ${i}`);
      }
    }
    
    // Check trashability values
    const validTrashability = ['Essential', 'Valuable', 'Reliable', 'Useful', 'Niche', 'Replaceable', 'Outclassed', 'Legacy-Only', 'Trap', 'Trash'];
    if (!validTrashability.includes(pokemon.trashability)) {
      throw new Error(`${filePath}: Invalid trashability '${pokemon.trashability}' for Pokemon ${i}`);
    }
    
    // Check recommendedCount is a number
    if (typeof pokemon.recommendedCount !== 'number' || pokemon.recommendedCount < 0) {
      throw new Error(`${filePath}: Invalid recommendedCount for Pokemon ${i}`);
    }
  }
  
  log(`${filePath}: Final Pokemon data validated`, 'success');
}

async function validateStage(stageName) {
  log(`🔍 Validating ${stageName} stage...`, 'info');
  
  switch (stageName) {
    case 'scraping':
      // Validate scraping outputs
      validateFileExists('outputs/pokemon-variants-raw.json');
      validateJsonFile('outputs/pokemon-variants-raw.json', validatePokemonVariants);
      
      validateFileExists('outputs/rankings/great.json');
      validateFileExists('outputs/rankings/ultra.json');
      validateFileExists('outputs/rankings/master.json');
      
      // Optional files
      validateFileExists('outputs/best-per-type.json', false);
      validateFileExists('outputs/raid-tiers.json', false);
      validateFileExists('outputs/gym-defender-tiers.json', false);
      
      if (fs.existsSync(path.join(__dirname, 'outputs/rankings/great.json'))) {
        validateJsonFile('outputs/rankings/great.json', validateRankings);
      }
      break;
      
    case 'processing':
      // Validate processing outputs
      validateFileExists('outputs/pokemon-variants.json');
      validateJsonFile('outputs/pokemon-variants.json', validatePokemonVariants);
      
      validateFileExists('outputs/pokemon-variants-with-candy.json');
      validateJsonFile('outputs/pokemon-variants-with-candy.json', validatePokemonVariants);
      
      validateFileExists('outputs/pokemon-pvpoke-conversion.json');
      validateFileExists('outputs/pokemon-condensed-meta.json');
      break;
      
    case 'building':
      // Validate building outputs
      validateFileExists('outputs/PokemonMaster.json');
      validateFileExists('outputs/PokemonMaster_updated.json');
      validateFileExists('pokemon.json');
      
      validateJsonFile('pokemon.json', validateFinalPokemon);
      break;
      
    case 'complete':
      // Validate all required files exist
      for (const file of config.validation.required_files) {
        validateFileExists(file);
      }
      
      // Validate final output
      validateJsonFile('pokemon.json', validateFinalPokemon);
      
      log('🎉 Complete pipeline validation passed!', 'success');
      break;
      
    default:
      throw new Error(`Unknown validation stage: ${stageName}`);
  }
  
  log(`✅ ${stageName} stage validation passed`, 'success');
}

async function main() {
  const stage = process.argv[2] || 'complete';
  
  try {
    await validateStage(stage);
  } catch (err) {
    log(`💥 Validation failed: ${err.message}`, 'error');
    process.exit(1);
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Pokemon GO Data Pipeline Validator

Usage: node validate.js [stage]

Stages:
  scraping     Validate scraping stage outputs
  processing   Validate processing stage outputs  
  building     Validate building stage outputs
  complete     Validate complete pipeline (default)

Examples:
  node validate.js                # Validate complete pipeline
  node validate.js scraping       # Validate only scraping outputs
  node validate.js processing     # Validate only processing outputs
`);
  process.exit(0);
}

// Run validation
if (require.main === module) {
  main();
}

module.exports = { validateStage, validateFileExists, validateJsonFile };
