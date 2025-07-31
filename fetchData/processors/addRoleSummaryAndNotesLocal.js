/**
 * LOCAL AI-POWERED ROLE SUMMARY AND NOTES GENERATOR
 *
 * Uses a local LLM (via Ollama) to generate natural language role summaries and notes for Pokemon based on:
 * - PvP performance across leagues (Great, Ultra, Master)
 * - Raid utility and type rankings
 * - Gym defense capabilities
 * - Recommended count and investment priority
 * - Special forms and unique characteristics
 *
 * ROLE SUMMARY: AI-generated concise 1-2 sentence description of primary role and value
 * NOTES: AI-generated detailed explanation of strengths, weaknesses, and usage recommendations
 *
 * REQUIREMENTS:
 * - Ollama installed locally (https://ollama.ai/)
 * - A suitable model downloaded (e.g., llama3.1:8b, mistral, codellama)
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const INPUT_PATH = path.resolve(__dirname, "../outputs/PokemonMaster.json");
const OUTPUT_PATH = path.resolve(__dirname, "../../public/data/pokemon.json");

// Local AI Configuration
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3:latest"; // Default model
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

/**
 * OLLAMA API INTERFACE
 * Communicates with local Ollama instance
 */
const callOllama = async (prompt, retries = 3) => {
  return new Promise((resolve, reject) => {
    const requestData = {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        max_tokens: 300,
      },
    };

    const postData = JSON.stringify(requestData);

    // Use curl to make the request (cross-platform)
    const curl = spawn("curl", ["-X", "POST", "-H", "Content-Type: application/json", "-d", postData, `${OLLAMA_HOST}/api/generate`]);

    let responseData = "";
    let errorData = "";

    curl.stdout.on("data", (data) => {
      responseData += data.toString();
    });

    curl.stderr.on("data", (data) => {
      errorData += data.toString();
    });

    curl.on("close", (code) => {
      if (code !== 0) {
        if (retries > 0) {
          console.log(`Retrying Ollama call... (${retries} attempts left)`);
          setTimeout(() => {
            callOllama(prompt, retries - 1)
              .then(resolve)
              .catch(reject);
          }, 1000);
        } else {
          reject(new Error(`Curl failed with code ${code}: ${errorData}`));
        }
        return;
      }

      try {
        const response = JSON.parse(responseData);
        if (response.error) {
          throw new Error(response.error);
        }
        resolve(response.response.trim());
      } catch (error) {
        if (retries > 0) {
          console.log(`Retrying Ollama call... (${retries} attempts left)`);
          setTimeout(() => {
            callOllama(prompt, retries - 1)
              .then(resolve)
              .catch(reject);
          }, 1000);
        } else {
          reject(error);
        }
      }
    });
  });
};

/**
 * CHECK OLLAMA AVAILABILITY
 */
const checkOllamaAvailability = async () => {
  try {
    await callOllama("Test connection", 1);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * POKEMON DATA FORMATTER
 * Formats Pokemon data into a readable prompt for the local AI
 */
const formatPokemonData = (mon) => {
  const leagues = mon.leagues || {};
  const raidTier = mon.raidTier || "No raid data";
  const defenderTier = mon.defenderTier || "No defense data";
  const bestTypes = mon.bestTypes || [];
  const recommendedCount = mon.recommendedCount || 0;

  // Format PvP performance
  let pvpPerformance = "PvP Performance:\n";
  Object.entries(leagues).forEach(([league, data]) => {
    if (data && data.score) {
      pvpPerformance += `- ${league.charAt(0).toUpperCase() + league.slice(1)} League: ${data.score}/100\n`;
    }
  });

  // Format raid performance
  let raidPerformance = `Raid Performance: ${raidTier}\n`;
  if (bestTypes.length > 0) {
    raidPerformance += "Top type rankings:\n";
    bestTypes.slice(0, 5).forEach((type) => {
      raidPerformance += `- ${type.type}: Rank ${type.rank}\n`;
    });
  }

  // Format defense
  let defenseInfo = `Gym Defense: ${defenderTier}\n`;

  // Format special characteristics
  let specialInfo = "";
  if (mon.form && mon.form !== "normal") {
    if (mon.form.includes("Shadow")) {
      specialInfo += "- Shadow form: Higher attack, lower defense\n";
    } else if (mon.form.includes("Mega")) {
      specialInfo += "- Mega evolution: Temporary power boost\n";
    } else if (mon.form.includes("Gigantamax")) {
      specialInfo += "- Gigantamax form: Max Battle mechanics\n";
    } else {
      specialInfo += `- Special form: ${mon.form}\n`;
    }
  }

  return `Pokemon: ${mon.name}
Types: ${mon.types ? mon.types.join(", ") : "Unknown"}
Recommended Count: ${recommendedCount}

${pvpPerformance}
${raidPerformance}
${defenseInfo}
${specialInfo}`;
};

/**
 * LOCAL AI PROMPT GENERATORS
 */
const generateQuickRolePrompt = (mon) => {
  const pokemonData = formatPokemonData(mon);

  return `Pokemon GO Role Classification

Data: ${pokemonData}

Respond with ONLY one of these exact phrases:
- "Meta Threat"
- "Raid Specialist"
- "PvP Specialist"
- "Great League Star"
- "Ultra League Star"
- "Master League Star"
- "Glass Cannon"
- "Bulky Defender"
- "Niche Pick"
- "Collection Only"
- "Transfer Candidate"

Response:`;
};

const generateKeyTagsPrompt = (mon) => {
  const pokemonData = formatPokemonData(mon);

  return `Pokemon GO Tag Classification

Data: ${pokemonData}

Respond with EXACTLY 2-3 tags from this list, separated by commas:
High DPS, Glass Cannon, Bulky, Meta Relevant, Niche Use, Top Tier, Investment Priority, Fragile, Tanky, Fast Moves, Coverage, Limited Use, Situational, Budget Option, Elite TM

Example: "High DPS, Glass Cannon" or "Bulky, Meta Relevant, Top Tier"

Tags:`;
};

const generateRoleSummaryPrompt = (mon) => {
  const pokemonData = formatPokemonData(mon);

  return `Pokemon GO Summary

Data: ${pokemonData}

Write exactly 1-2 sentences using these terms: Meta-defining, Strong, Solid, Situational, Limited, No competitive value

Format: "[Pokemon] is a [tier] [role] with [key strength]. [Investment advice]."

Examples:
- "Mewtwo is a meta-defining raid specialist with elite psychic attacking power. High investment priority."
- "Azumarill is a solid PvP option for Great League with excellent bulk. Worth developing."
- "Tropius is a limited niche specialist for specific coverage. Keep one copy."

Summary:`;
};

const generateNotesPrompt = (mon) => {
  const pokemonData = formatPokemonData(mon);

  return `Pokemon GO Analysis

Data: ${pokemonData}

Write exactly 3-4 sentences in this format:
"Rated [tier] due to [reason]. PvP performance shows [specific scores/leagues]. Raid performance ranks [position] in [type]. Recommended count: [number] for [reason]."

Example:
"Rated Essential due to exceptional Great League performance. PvP performance shows 95.2 score in Great League with top-tier bulk. Raid performance ranks 3rd in Psychic-type with elite DPS. Recommended count: 6 for maximum utility across all formats."

Analysis:`;
};

/**
 * LOCAL AI-POWERED GENERATION FUNCTIONS
 */
const generateLocalAIQuickRole = async (mon) => {
  try {
    const prompt = generateQuickRolePrompt(mon);
    const response = await callOllama(prompt);
    // Clean up the response to extract just the role
    let cleanRole = response
      .replace(/^(Response:|Role:|Quick Role:)\s*/i, "")
      .replace(/['"]/g, "")
      .replace(/^-\s*/, "")
      .trim();

    // Take only the first line if there are multiple lines
    cleanRole = cleanRole.split("\n")[0].trim();

    return cleanRole || "Collection Only";
  } catch (error) {
    console.error(`Error generating quick role for ${mon.name}:`, error.message);
    return "Collection Only";
  }
};

const generateLocalAIKeyTags = async (mon) => {
  try {
    const prompt = generateKeyTagsPrompt(mon);
    const response = await callOllama(prompt);
    // Clean up the response to extract just the tags
    let tagsText = response
      .replace(/^(Tags:|Key Tags.*?):\s*/i, "")
      .replace(/^-\s*/, "")
      .trim();

    // Take only the first line if there are multiple lines
    tagsText = tagsText.split("\n")[0].trim();

    // Parse comma-separated tags and clean them up
    const tags = tagsText
      .split(",")
      .map((tag) => tag.trim().replace(/["\[\]]/g, ""))
      .filter((tag) => tag.length > 0 && tag.length <= 20);

    return tags.slice(0, 3) || ["Basic"]; // Ensure max 3 tags
  } catch (error) {
    console.error(`Error generating key tags for ${mon.name}:`, error.message);
    return ["Basic"];
  }
};

const generateLocalAIRoleSummary = async (mon) => {
  try {
    const prompt = generateRoleSummaryPrompt(mon);
    const response = await callOllama(prompt);
    // Clean up the response to extract just the summary
    let cleanSummary = response
      .replace(/^(Summary:|Role Summary:|Analysis:)\s*/i, "")
      .replace(/['"]/g, "")
      .replace(/^-\s*/, "")
      .trim();

    // Take only the first 2 sentences
    const sentences = cleanSummary.split(". ");
    cleanSummary = sentences.slice(0, 2).join(". ");
    if (!cleanSummary.endsWith(".")) cleanSummary += ".";

    return cleanSummary || "No competitive analysis available.";
  } catch (error) {
    console.error(`Error generating role summary for ${mon.name}:`, error.message);
    return "No competitive analysis available.";
  }
};

const generateLocalAIDetailedNotes = async (mon) => {
  try {
    const prompt = generateNotesPrompt(mon);
    const response = await callOllama(prompt);
    // Clean up the response to extract just the notes
    let cleanNotes = response
      .replace(/^(Notes:|Detailed Notes:|Analysis:)\s*/i, "")
      .replace(/['"]/g, "")
      .replace(/^-\s*/, "")
      .trim();

    // Take only the first 4 sentences
    const sentences = cleanNotes.split(". ");
    cleanNotes = sentences.slice(0, 4).join(". ");
    if (!cleanNotes.endsWith(".")) cleanNotes += ".";

    return cleanNotes || `Performance analysis available. Check PvP leagues, raid utility, and defense capabilities for detailed evaluation.`;
  } catch (error) {
    console.error(`Error generating notes for ${mon.name}:`, error.message);
    return `Performance analysis available. Check PvP leagues, raid utility, and defense capabilities for detailed evaluation.`;
  }
};

/**
 * BATCH PROCESSING FOR LOCAL AI
 */
const processLocalAIPokemonBatch = async (pokemon, batchSize = 2) => {
  const results = [];

  for (let i = 0; i < pokemon.length; i += batchSize) {
    const batch = pokemon.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(pokemon.length / batchSize);
    const progress = ((i / pokemon.length) * 100).toFixed(1);

    console.log(`🤖 Processing batch ${batchNum}/${totalBatches} (${progress}% complete) - Pokemon ${i + 1}-${Math.min(i + batchSize, pokemon.length)}`);

    const batchPromises = batch.map(async (mon) => {
      const [quickRole, keyTags, roleSummary, notes] = await Promise.all([generateLocalAIQuickRole(mon), generateLocalAIKeyTags(mon), generateLocalAIRoleSummary(mon), generateLocalAIDetailedNotes(mon)]);

      return {
        ...mon,
        quickRole,
        keyTags,
        roleSummary,
        notes,
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Small delay between batches to prevent overwhelming local model
    if (i + batchSize < pokemon.length) {
      console.log("Waiting 1 second before next batch...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
};

/**
 * MAIN LOCAL AI PROCESSING FUNCTION
 */
const addLocalAIRoleSummaryAndNotes = async () => {
  console.log("🤖 Adding Local AI-Generated Role Summary and Notes to Pokemon data...");
  console.log(`📡 Using model: ${OLLAMA_MODEL} at ${OLLAMA_HOST}`);

  // Check if Ollama is available
  console.log("🔍 Checking Ollama availability...");
  const isAvailable = await checkOllamaAvailability();

  if (!isAvailable) {
    console.error("❌ Ollama is not available. Please ensure:");
    console.error("1. Ollama is installed (https://ollama.ai/)");
    console.error("2. Ollama service is running");
    console.error(`3. Model '${OLLAMA_MODEL}' is downloaded`);
    console.error("4. Ollama is accessible at " + OLLAMA_HOST);
    console.error("\nTo install and setup Ollama:");
    console.error("1. Download from https://ollama.ai/");
    console.error("2. Run: ollama pull " + OLLAMA_MODEL);
    console.error("3. Start Ollama service");
    process.exit(1);
  }

  console.log("✅ Ollama is available and ready!");

  const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));

  // Process all Pokemon - can be limited for testing by adding .slice(0, 10)
  const pokemonToProcess = data;
  console.log(`🚀 Processing ${pokemonToProcess.length} Pokemon with Local AI`);

  try {
    const updatedData = await processLocalAIPokemonBatch(pokemonToProcess, 2); // Small batch size for local processing

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updatedData, null, 2));
    console.log(`✅ Successfully added local AI-generated role summaries and notes to ${updatedData.length} Pokemon`);
    console.log(`📁 Output saved to: ${OUTPUT_PATH}`);

    // Show a sample result
    if (updatedData.length > 0) {
      console.log("\n📋 Sample Result:");
      console.log(`Pokemon: ${updatedData[0].name}`);
      console.log(`Quick Role: ${updatedData[0].quickRole}`);
      console.log(`Key Tags: ${JSON.stringify(updatedData[0].keyTags)}`);
      console.log(`Role Summary: ${updatedData[0].roleSummary}`);
      console.log(`Notes: ${updatedData[0].notes}`);
    }
  } catch (error) {
    console.error("❌ Error processing Pokemon data:", error);
    process.exit(1);
  }
};

// Check if we should run in demo mode (without Ollama)
if (process.argv.includes("--demo")) {
  console.log("🎭 Running in DEMO mode - showing Local AI prompts without Ollama calls");

  const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  const samplePokemon = data.slice(0, 3);

  samplePokemon.forEach((mon, index) => {
    console.log(`\n=== LOCAL AI DEMO ${index + 1}: ${mon.name} ===`);
    console.log("\n📝 QUICK ROLE PROMPT:");
    console.log(generateQuickRolePrompt(mon));
    console.log("\n📝 KEY TAGS PROMPT:");
    console.log(generateKeyTagsPrompt(mon));
    console.log("\n📝 ROLE SUMMARY PROMPT:");
    console.log(generateRoleSummaryPrompt(mon));
    console.log("\n📝 DETAILED NOTES PROMPT:");
    console.log(generateNotesPrompt(mon));
    console.log("\n" + "=".repeat(50));
  });

  console.log("\n💡 To run with actual Local AI generation:");
  console.log("1. Install Ollama: https://ollama.ai/");
  console.log("2. Download a model: ollama pull llama3:latest");
  console.log("3. Start Ollama service");
  console.log("4. Run without --demo flag");
} else {
  // Run the Local AI processor
  addLocalAIRoleSummaryAndNotes();
}
