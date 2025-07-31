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
  SCRAPER_TIMEOUT: 3600000, // 1 hour for scrapers (Pokemon scraping takes time)
  PROCESSOR_TIMEOUT: 60000, // 1 minute for processors
  BUILDER_TIMEOUT: 120000, // 2 minutes for builders
  AI_TIMEOUT: 7200000, // 2 hours for AI processing (Llama takes time)

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
      { name: "PvPoke Moves", file: "scrapers/fetch-pvpoke-moves.js", required: true },
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
      { name: "Add Moves Data", file: "processors/addMovesData.js", required: true },
      { name: "Filter Official Leagues", file: "processors/filterOfficialLeagues.js", required: true },
      { name: "Extract Moves to Separate File", file: "processors/extractMovesToSeparateFile.js", required: true },
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
      { name: "Generate AI Role Summaries", file: "processors/addRoleSummaryAndNotesLocal.js", required: true, timeout: CONFIG.AI_TIMEOUT },
      { name: "Analyze Meta Attack Types", file: "analyzers/analyzeMetaAttackTypes.js", required: true },
      { name: "Analyze Weakness Impact", file: "analyzers/analyzeWeaknessImpact.js", required: true },
      { name: "Add Weakness Analysis", file: "processors/addWeaknessAnalysis.js", required: true },
      { name: "Update Recommended Count", file: "processors/updateRecommendedCount.js", required: true },
      { name: "Update Trashability", file: "processors/updateTrashability.js", required: true },
      { name: "Update Dynamax Trashability", file: "processors/updateDynamaxTrashability.js", required: true },
      { name: "Update Dynamax Recommended Count", file: "processors/updateDynamaxRecommendedCount.js", required: true },
      { name: "Filter Released Pokemon", file: "processors/filterReleasedPokemon.js", required: true },
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

function runScript(scriptPath, timeout = 60000, retries = 2) {
  return new Promise(async (resolve, reject) => {
    const fullPath = path.join(__dirname, scriptPath);

    if (!fs.existsSync(fullPath)) {
      reject(new Error(`Script not found: ${fullPath}`));
      return;
    }

    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        if (attempt > 1) {
          log(`🔄 Retry attempt ${attempt - 1}/${retries} for: ${scriptPath}`, "warning");
          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, Math.min(5000 * attempt, 30000)));
        } else {
          log(`Starting: ${scriptPath}`, "info");
        }

        const result = await runScriptAttempt(fullPath, scriptPath, timeout);
        log(`Completed: ${scriptPath}`, "success");
        resolve(result);
        return;
      } catch (error) {
        if (attempt <= retries) {
          // Check if we should retry based on error type
          if (shouldRetry(error, scriptPath)) {
            log(`⚠️ Attempt ${attempt} failed for ${scriptPath}: ${error.message}`, "warning");
            continue;
          } else {
            // Don't retry for certain errors
            reject(error);
            return;
          }
        } else {
          // Final attempt failed
          reject(error);
          return;
        }
      }
    }
  });
}

/**
 * Single script execution attempt
 */
function runScriptAttempt(fullPath, scriptPath, timeout) {
  return new Promise((resolve, reject) => {
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
        if (!CONFIG.VERBOSE && output) {
          console.log(output.trim());
        }
        resolve({ code, output, errorOutput });
      } else {
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

/**
 * Determine if a script should be retried based on error type
 */
function shouldRetry(error, scriptPath) {
  const errorMessage = error.message.toLowerCase();

  // Don't retry timeouts for very long-running scripts (they likely completed partially)
  if (errorMessage.includes("timeout") && scriptPath.includes("getPokemon.js")) {
    log(`⏭️ Skipping retry for timeout on ${scriptPath} - likely has partial progress`, "info");
    return false;
  }

  // Retry network-related errors
  if (errorMessage.includes("network") || errorMessage.includes("connection") || errorMessage.includes("econnreset") || errorMessage.includes("enotfound") || errorMessage.includes("fetch") || errorMessage.includes("socket") || errorMessage.includes("dns")) {
    return true;
  }

  // Don't retry syntax errors, file not found, or permission errors
  if (errorMessage.includes("syntax") || errorMessage.includes("enoent") || errorMessage.includes("cannot find module") || errorMessage.includes("permission denied") || errorMessage.includes("eacces")) {
    return false;
  }

  // Retry other temporary errors
  return true;
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
          const timeout = script.timeout || phase.timeout;
          await runScript(script.file, timeout);
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
  --skip-builders     Skip the data building phase (includes AI processing)
  --verbose, -v       Show detailed output from scripts
  --help, -h          Show this help message

Pipeline Phases:
  1. Scraping:   Fetch Pokemon data, rankings, moves, raid tiers
  2. Processing: Clean, merge, and analyze data
  3. Building:   Generate final datasets + AI role summaries (2+ hours)

AI Processing:
  - Uses local Llama3 model to generate role summaries and notes
  - Requires Ollama to be installed and running
  - Processes ~1,620 Pokemon (estimated 2 hours)

Examples:
  node runAll.js                    # Run complete pipeline with AI
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
