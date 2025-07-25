#!/usr/bin/env node

/**
 * Master orchestration script for Pokemon GO data pipeline
 * Runs all data fetching, processing, and building scripts in the correct order
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG = {
  // Timeouts in milliseconds
  SCRAPER_TIMEOUT: 900000, // 15 minutes for scrapers (Pokemon scraping takes time)
  PROCESSOR_TIMEOUT: 60000, // 1 minute for processors
  BUILDER_TIMEOUT: 120000, // 2 minutes for builders

  // Directories
  SCRAPERS_DIR: path.join(__dirname, "scrapers"),
  PROCESSORS_DIR: path.join(__dirname, "processors"),
  BUILDERS_DIR: path.join(__dirname, "builders"),
  OUTPUTS_DIR: path.join(__dirname, "outputs"),
  CONFIG_DIR: path.join(__dirname, "config"),

  // Skip certain steps for faster testing
  SKIP_SCRAPERS: process.argv.includes("--skip-scrapers"),
  SKIP_PROCESSORS: process.argv.includes("--skip-processors"),
  SKIP_BUILDERS: process.argv.includes("--skip-builders"),
  VERBOSE: process.argv.includes("--verbose") || process.argv.includes("-v"),
};

// Pipeline definition - order matters!
const PIPELINE = [
  // Phase 1: Data Scraping (can run in parallel)
  {
    phase: "scraping",
    parallel: true,
    skip: CONFIG.SKIP_SCRAPERS,
    timeout: CONFIG.SCRAPER_TIMEOUT,
    scripts: [
      { name: "Pokemon Variants", file: "scrapers/getPokemon.js", required: true },
      { name: "PvPoke Rankings", file: "scrapers/fetch-pcpoke-rankings.js", required: true },
      { name: "Best by Type", file: "scrapers/ScrapeBestByType.js", required: false },
      { name: "Raid Tiers", file: "scrapers/scrapeRaidTiers.js", required: false },
      { name: "Gym Defenders", file: "scrapers/scrapeGymDefndersTiers.js", required: false },
    ],
  },

  // Phase 2: Data Processing (sequential)
  {
    phase: "processing",
    parallel: false,
    skip: CONFIG.SKIP_PROCESSORS,
    timeout: CONFIG.PROCESSOR_TIMEOUT,
    scripts: [
      { name: "Clean Variants", file: "processors/clean_variant.js", required: true },
      { name: "Add Candy Data", file: "processors/addCandyData.js", required: true },
      { name: "Validate Pokemon Availability", file: "validate_pokemon_variants.js", required: true },
      { name: "Create Conversion Doc", file: "processors/createConversionDoc.js", required: true },
      { name: "Merge PvPoke Data", file: "processors/MergePvpokeData.js", required: true },
    ],
  },

  // Phase 3: Building Final Data (sequential)
  {
    phase: "building",
    parallel: false,
    skip: CONFIG.SKIP_BUILDERS,
    timeout: CONFIG.BUILDER_TIMEOUT,
    scripts: [
      { name: "Build Pokemon Master", file: "builders/buildPokemonMaster.js", required: true },
      { name: "Update Recommended Count", file: "processors/updateRecommendedCount.js", required: true },
      { name: "Update Trashability", file: "processors/updateTrashability.js", required: true },
    ],
  },
];

// Utility functions
function log(message, level = "info") {
  const timestamp = new Date().toISOString();
  const prefix =
    {
      info: "📋",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      debug: "🔍",
    }[level] || "📋";

  console.log(`${prefix} [${timestamp}] ${message}`);
}

function runScript(scriptPath, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, scriptPath);

    if (!fs.existsSync(fullPath)) {
      reject(new Error(`Script not found: ${fullPath}`));
      return;
    }

    log(`Starting: ${scriptPath}`, "info");

    const child = spawn("node", [fullPath], {
      stdio: CONFIG.VERBOSE ? "inherit" : "pipe",
      cwd: __dirname,
    });

    let output = "";
    let errorOutput = "";

    if (!CONFIG.VERBOSE) {
      child.stdout?.on("data", (data) => {
        output += data.toString();
      });

      child.stderr?.on("data", (data) => {
        errorOutput += data.toString();
      });
    }

    const timer = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Script timeout: ${scriptPath} (${timeout}ms)`));
    }, timeout);

    child.on("close", (code) => {
      clearTimeout(timer);

      if (code === 0) {
        log(`Completed: ${scriptPath}`, "success");
        if (!CONFIG.VERBOSE && output) {
          console.log(output.trim());
        }
        resolve({ code, output, errorOutput });
      } else {
        log(`Failed: ${scriptPath} (exit code: ${code})`, "error");
        if (errorOutput) {
          console.error(errorOutput.trim());
        }
        reject(new Error(`Script failed: ${scriptPath} (exit code: ${code})`));
      }
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(new Error(`Script error: ${scriptPath} - ${err.message}`));
    });
  });
}

async function runPhase(phase) {
  log(`🚀 Starting phase: ${phase.phase}`, "info");

  if (phase.skip) {
    log(`⏭️ Skipping phase: ${phase.phase}`, "warning");
    return;
  }

  const startTime = Date.now();

  try {
    if (phase.parallel) {
      // Run scripts in parallel
      const promises = phase.scripts.map((script) =>
        runScript(script.file, phase.timeout).catch((err) => {
          if (script.required) {
            throw err;
          } else {
            log(`Optional script failed: ${script.name} - ${err.message}`, "warning");
            return null;
          }
        })
      );

      await Promise.all(promises);
    } else {
      // Run scripts sequentially
      for (const script of phase.scripts) {
        try {
          await runScript(script.file, phase.timeout);
        } catch (err) {
          if (script.required) {
            throw err;
          } else {
            log(`Optional script failed: ${script.name} - ${err.message}`, "warning");
          }
        }
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`✨ Phase completed: ${phase.phase} (${duration}s)`, "success");
  } catch (err) {
    log(`💥 Phase failed: ${phase.phase} - ${err.message}`, "error");
    throw err;
  }
}

async function validateOutputs() {
  log("🔍 Running final validation...", "info");

  try {
    const { validateStage } = require("./validate.js");
    await validateStage("complete");
  } catch (err) {
    throw new Error(`Validation failed: ${err.message}`);
  }
}

async function main() {
  const startTime = Date.now();

  log("🎯 Starting Pokemon GO data pipeline", "info");
  log(`📁 Working directory: ${__dirname}`, "debug");

  if (CONFIG.SKIP_SCRAPERS) log("⏭️ Skipping scrapers", "warning");
  if (CONFIG.SKIP_PROCESSORS) log("⏭️ Skipping processors", "warning");
  if (CONFIG.SKIP_BUILDERS) log("⏭️ Skipping builders", "warning");

  try {
    // Ensure output directories exist
    if (!fs.existsSync(CONFIG.OUTPUTS_DIR)) {
      fs.mkdirSync(CONFIG.OUTPUTS_DIR, { recursive: true });
    }

    // Run all phases
    for (const phase of PIPELINE) {
      await runPhase(phase);
    }

    // Validate outputs
    await validateOutputs();

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`🎉 Pipeline completed successfully! (${totalDuration}s)`, "success");
  } catch (err) {
    log(`💥 Pipeline failed: ${err.message}`, "error");
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  log("🛑 Pipeline interrupted by user", "warning");
  process.exit(130);
});

process.on("SIGTERM", () => {
  log("🛑 Pipeline terminated", "warning");
  process.exit(143);
});

// Show help
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
Pokemon GO Data Pipeline Runner

Usage: node runAll.js [options]

Options:
  --skip-scrapers     Skip the data scraping phase
  --skip-processors   Skip the data processing phase  
  --skip-builders     Skip the data building phase
  --verbose, -v       Show detailed output from scripts
  --help, -h          Show this help message

Examples:
  node runAll.js                    # Run complete pipeline
  node runAll.js --skip-scrapers    # Skip scraping, process existing data
  node runAll.js -v                 # Run with verbose output
`);
  process.exit(0);
}

// Run the pipeline
if (require.main === module) {
  main();
}

module.exports = { runScript, runPhase, CONFIG, PIPELINE };
