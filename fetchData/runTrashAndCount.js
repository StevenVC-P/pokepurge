#!/usr/bin/env node

/**
 * Quick run script for updating only trashability and recommended count
 * Skips all scrapers and other processors for fast updates
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Configuration
const CONFIG = {
  PROCESSOR_TIMEOUT: 60000, // 1 minute for processors
  VERBOSE: process.argv.includes("--verbose") || process.argv.includes("-v"),
  OUTPUTS_DIR: path.join(__dirname, "outputs"),
};

// Only the scripts we need for trash and recommended count
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
  const timestamp = new Date().toISOString();
  const prefix =
    {
      info: "📋",
      success: "✅",
      warning: "⚠️",
      error: "❌",
      debug: "🔍",
    }[level] || "📋";

  console.log(`${prefix} ${message}`);
  if (CONFIG.VERBOSE) {
    console.log(`   [${timestamp}]`);
  }
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
          if (shouldRetry(error, scriptPath)) {
            log(`⚠️ Attempt ${attempt} failed for ${scriptPath}: ${error.message}`, "warning");
            continue;
          } else {
            reject(error);
            return;
          }
        } else {
          reject(error);
          return;
        }
      }
    }
  });
}

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

function shouldRetry(error, scriptPath) {
  const errorMessage = error.message.toLowerCase();

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

async function validateOutputs() {
  const requiredFiles = [path.join(__dirname, "../public/data/pokemon.json")];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required output file missing: ${file}`);
    }

    const stats = fs.statSync(file);
    if (stats.size === 0) {
      throw new Error(`Output file is empty: ${file}`);
    }

    // Validate JSON structure
    if (file.endsWith(".json")) {
      try {
        const content = JSON.parse(fs.readFileSync(file, "utf-8"));
        if (Array.isArray(content) && content.length === 0) {
          throw new Error(`JSON file has no data: ${file}`);
        }
      } catch (err) {
        throw new Error(`Invalid JSON in file: ${file} - ${err.message}`);
      }
    }
  }

  log("✅ All output files validated successfully", "success");
}

async function main() {
  const startTime = Date.now();

  log("🎯 Running Trashability and Recommended Count Update", "info");
  log(`📁 Working directory: ${__dirname}`, "debug");

  try {
    // Ensure output directories exist
    if (!fs.existsSync(CONFIG.OUTPUTS_DIR)) {
      fs.mkdirSync(CONFIG.OUTPUTS_DIR, { recursive: true });
    }

    // Run all scripts sequentially
    for (const script of SCRIPTS_TO_RUN) {
      try {
        await runScript(script.file, CONFIG.PROCESSOR_TIMEOUT);
      } catch (error) {
        if (script.required) {
          throw error;
        } else {
          log(`⚠️ Optional script failed: ${script.name} - ${error.message}`, "warning");
        }
      }
    }

    // Validate outputs
    await validateOutputs();

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
    log(`🎉 Trashability and Recommended Count update completed! (${totalDuration}s)`, "success");

    // Show summary
    const pokemonFile = path.join(__dirname, "../public/data/pokemon.json");
    if (fs.existsSync(pokemonFile)) {
      const pokemon = JSON.parse(fs.readFileSync(pokemonFile, "utf-8"));
      log(`📊 Updated ${pokemon.length} Pokemon with fresh trashability and recommended counts`, "info");
    }
  } catch (err) {
    log(`💥 Update failed: ${err.message}`, "error");
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  log("🛑 Update interrupted by user", "warning");
  process.exit(130);
});

process.on("SIGTERM", () => {
  log("🛑 Update terminated", "warning");
  process.exit(143);
});

if (require.main === module) {
  main();
}
