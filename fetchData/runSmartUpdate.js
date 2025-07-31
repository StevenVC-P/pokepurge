#!/usr/bin/env node

/**
 * Smart Pokemon Data Update
 *
 * This script updates ONLY trashability and recommended counts while preserving
 * ALL existing data including AI-generated notes, role summaries, etc.
 *
 * Use this script when you want to update calculations without losing AI data.
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const WORKING_DIR = __dirname;
const TIMEOUT_DEFAULT = 300000; // 5 minutes
const POKEMON_FILE = path.resolve(__dirname, "..", "public/data/pokemon.json");

// Scripts to run in order (only calculation scripts, no AI)
const SCRIPTS_TO_RUN = [
  { name: "Analyze Meta Attack Types", file: "analyzers/analyzeMetaAttackTypes.js", required: true },
  { name: "Analyze Weakness Impact", file: "analyzers/analyzeWeaknessImpact.js", required: true },
  { name: "Add Weakness Analysis", file: "processors/addWeaknessAnalysis.js", required: true },
  { name: "Update Recommended Count", file: "processors/updateRecommendedCount.js", required: true },
  { name: "Update Trashability", file: "processors/updateTrashability.js", required: true },
  { name: "Update Dynamax Trashability", file: "processors/updateDynamaxTrashability.js", required: true },
  { name: "Update Dynamax Recommended Count", file: "processors/updateDynamaxRecommendedCount.js", required: true },
  { name: "Filter Released Pokemon", file: "processors/filterReleasedPokemon.js", required: true },
];

// Utility functions
function log(message, level = "info") {
  const prefix =
    {
      info: "📋",
      success: "✅",
      error: "❌",
      warning: "⚠️",
    }[level] || "📋";

  console.log(`${prefix} ${message}`);
}

function backupPokemonData() {
  if (!fs.existsSync(POKEMON_FILE)) {
    log("pokemon.json not found - cannot create backup", "error");
    return false;
  }

  const backupFile = POKEMON_FILE.replace(".json", "_backup.json");
  try {
    fs.copyFileSync(POKEMON_FILE, backupFile);
    log(`Created backup: ${path.basename(backupFile)}`, "success");
    return true;
  } catch (error) {
    log(`Failed to create backup: ${error.message}`, "error");
    return false;
  }
}

function validatePokemonData() {
  try {
    const data = JSON.parse(fs.readFileSync(POKEMON_FILE, "utf8"));

    if (!Array.isArray(data) || data.length === 0) {
      log("pokemon.json is not a valid array or is empty", "error");
      return false;
    }

    // Check if AI data exists
    const withAI = data.filter((p) => p.quickRole || p.roleSummary || p.keyTags).length;
    log(`Validated ${data.length} Pokemon (${withAI} have AI data)`, "success");

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
      stdout += data.toString();
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

async function runSmartUpdate() {
  const startTime = Date.now();
  log("🎯 Running Smart Pokemon Data Update (Preserving AI Data)");
  log(`🔍 Working directory: ${WORKING_DIR}`);

  // Validate input data
  if (!validatePokemonData()) {
    log("Input validation failed", "error");
    process.exit(1);
  }

  // Create backup
  if (!backupPokemonData()) {
    log("Backup creation failed", "error");
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

  // Final validation
  if (!validatePokemonData()) {
    log("Output validation failed", "error");
    process.exit(1);
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

  log(`🎉 Smart update completed! (${totalDuration}s)`, "success");
  log(`📊 Updated trashability and recommendations while preserving AI data`, "success");

  // Summary
  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log("\n📋 Update Summary:");
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);

  // Check AI data preservation
  try {
    const data = JSON.parse(fs.readFileSync(POKEMON_FILE, "utf8"));
    const withAI = data.filter((p) => p.quickRole || p.roleSummary || p.keyTags).length;
    console.log(`🤖 AI Data Preserved: ${withAI} Pokemon still have AI notes`);
  } catch (error) {
    log(`Could not verify AI data preservation: ${error.message}`, "warning");
  }

  if (failed > 0) {
    console.log("\n❌ Failed Scripts:");
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.script}: ${r.error}`);
      });
  }
}

// Run the smart update
runSmartUpdate().catch((error) => {
  log(`Smart update failed: ${error.message}`, "error");
  process.exit(1);
});
