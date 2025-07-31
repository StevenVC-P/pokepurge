#!/usr/bin/env node

/**
 * Complete Pokemon Data Update Pipeline
 *
 * This script runs the complete pipeline in the correct order to ensure:
 * 1. AI role summaries are generated first
 * 2. Trashability and recommended counts are calculated after
 * 3. All data is preserved throughout the process
 *
 * Use this script when you want to update everything while preserving AI notes.
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const WORKING_DIR = __dirname;
const TIMEOUT_DEFAULT = 300000; // 5 minutes
const AI_TIMEOUT = 1800000; // 30 minutes for AI processing

// Scripts to run in the correct order
const SCRIPTS_TO_RUN = [
  // AI processing first (before calculations that might overwrite data)
  { name: "Generate AI Role Summaries", file: "processors/addRoleSummaryAndNotesLocal.js", required: true, timeout: AI_TIMEOUT },

  // Analysis and calculations (after AI data is in place)
  { name: "Analyze Meta Attack Types", file: "analyzers/analyzeMetaAttackTypes.js", required: true },
  { name: "Analyze Weakness Impact", file: "analyzers/analyzeWeaknessImpact.js", required: true },
  { name: "Add Weakness Analysis", file: "processors/addWeaknessAnalysis.js", required: true },
  { name: "Update Recommended Count", file: "processors/updateRecommendedCount.js", required: true },
  { name: "Update Trashability", file: "processors/updateTrashability.js", required: true },
  { name: "Update Dynamax Trashability", file: "processors/updateDynamaxTrashability.js", required: true },
  { name: "Update Dynamax Recommended Count", file: "processors/updateDynamaxRecommendedCount.js", required: true },

  // Final cleanup
  { name: "Filter Released Pokemon", file: "processors/filterReleasedPokemon.js", required: true },
];

// Utility functions
function log(message, level = "info") {
  const timestamp = new Date().toISOString();
  const prefix =
    {
      info: "📋",
      success: "✅",
      error: "❌",
      warning: "⚠️",
    }[level] || "📋";

  console.log(`${prefix} ${message}`);
}

function validateOutputFiles() {
  const requiredFiles = ["public/data/pokemon.json"];

  const missingFiles = requiredFiles.filter((file) => {
    const fullPath = path.resolve(__dirname, "..", file);
    return !fs.existsSync(fullPath);
  });

  if (missingFiles.length > 0) {
    log(`Missing required files: ${missingFiles.join(", ")}`, "error");
    return false;
  }

  // Validate pokemon.json structure
  try {
    const pokemonPath = path.resolve(__dirname, "..", "public/data/pokemon.json");
    const pokemonData = JSON.parse(fs.readFileSync(pokemonPath, "utf8"));

    if (!Array.isArray(pokemonData) || pokemonData.length === 0) {
      log("pokemon.json is not a valid array or is empty", "error");
      return false;
    }

    // Check if first Pokemon has required fields
    const firstPokemon = pokemonData[0];
    const requiredFields = ["id", "name", "base", "types"];
    const missingFields = requiredFields.filter((field) => !(field in firstPokemon));

    if (missingFields.length > 0) {
      log(`Pokemon data missing required fields: ${missingFields.join(", ")}`, "error");
      return false;
    }

    log(`Validated pokemon.json with ${pokemonData.length} Pokemon`, "success");
    return true;
  } catch (error) {
    log(`Error validating pokemon.json: ${error.message}`, "error");
    return false;
  }
}

function runScript(scriptConfig) {
  return new Promise((resolve, reject) => {
    const { name, file, timeout = TIMEOUT_DEFAULT } = scriptConfig;
    const scriptPath = path.resolve(WORKING_DIR, file);

    log(`Starting: ${file}`);

    if (!fs.existsSync(scriptPath)) {
      const error = `Script not found: ${scriptPath}`;
      log(error, "error");
      reject(new Error(error));
      return;
    }

    const startTime = Date.now();
    const child = spawn("node", [scriptPath], {
      cwd: WORKING_DIR,
      stdio: ["inherit", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      const output = data.toString();
      stdout += output;
      // Show real-time output for long-running processes
      if (timeout > 300000) {
        // Show output for processes longer than 5 minutes
        process.stdout.write(output);
      }
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    const timeoutId = setTimeout(() => {
      child.kill("SIGTERM");
      reject(new Error(`Script ${name} timed out after ${timeout / 1000} seconds`));
    }, timeout);

    child.on("close", (code) => {
      clearTimeout(timeoutId);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);

      if (code === 0) {
        log(`Completed: ${file} (${duration}s)`, "success");
        resolve({ stdout, stderr, duration });
      } else {
        const error = `Script ${name} failed with exit code ${code}`;
        log(error, "error");
        if (stderr) log(`Error output: ${stderr}`, "error");
        reject(new Error(error));
      }
    });

    child.on("error", (error) => {
      clearTimeout(timeoutId);
      log(`Error running ${name}: ${error.message}`, "error");
      reject(error);
    });
  });
}

async function runAllScripts() {
  const startTime = Date.now();
  log("🎯 Running Complete Pokemon Data Update Pipeline");
  log(`🔍 Working directory: ${WORKING_DIR}`);

  // Check if pokemon.json exists before starting
  const pokemonPath = path.resolve(__dirname, "..", "public/data/pokemon.json");
  if (!fs.existsSync(pokemonPath)) {
    log("pokemon.json not found. Please run the full data collection first.", "error");
    process.exit(1);
  }

  const results = [];

  for (const script of SCRIPTS_TO_RUN) {
    try {
      const result = await runScript(script);
      results.push({ script: script.name, success: true, duration: result.duration });
    } catch (error) {
      results.push({ script: script.name, success: false, error: error.message });

      if (script.required) {
        log(`Required script failed: ${script.name}`, "error");
        log("Stopping pipeline execution", "error");
        process.exit(1);
      } else {
        log(`Optional script failed: ${script.name}`, "warning");
      }
    }
  }

  // Validate output files
  if (!validateOutputFiles()) {
    log("Output validation failed", "error");
    process.exit(1);
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

  log(`🎉 Complete pipeline finished! (${totalDuration}s)`, "success");
  log(`📊 Updated Pokemon data with AI notes, trashability, and recommendations`, "success");

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log("\n📋 Pipeline Summary:");
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log("\n❌ Failed Scripts:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.script}: ${r.error}`);
      });
  }
}

// Run the pipeline
runAllScripts().catch((error) => {
  log(`Pipeline failed: ${error.message}`, "error");
  process.exit(1);
});
