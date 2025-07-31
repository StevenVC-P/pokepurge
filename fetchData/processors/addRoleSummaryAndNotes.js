/**
 * AI-POWERED ROLE SUMMARY AND NOTES GENERATOR
 *
 * Uses OpenAI API to generate natural language role summaries and notes for Pokemon based on:
 * - PvP performance across leagues (Great, Ultra, Master)
 * - Raid utility and type rankings
 * - Gym defense capabilities
 * - Recommended count and investment priority
 * - Special forms and unique characteristics
 *
 * ROLE SUMMARY: AI-generated concise 1-2 sentence description of primary role and value
 * NOTES: AI-generated detailed explanation of strengths, weaknesses, and usage recommendations
 */

const fs = require("fs");
const path = require("path");
const https = require("https");

const INPUT_PATH = path.resolve(__dirname, "../outputs/PokemonMaster.json");
const OUTPUT_PATH = path.resolve(__dirname, "../../public/data/pokemon.json");

// OpenAI API Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

// Check if running in demo mode first
const isDemoMode = process.argv.includes("--demo");

if (!OPENAI_API_KEY && !isDemoMode) {
  console.error("❌ OPENAI_API_KEY environment variable is required");
  console.log("Please set your OpenAI API key:");
  console.log("export OPENAI_API_KEY=your_api_key_here");
  console.log("Or run with --demo flag to see sample prompts");
  process.exit(1);
}

/**
 * RATE LIMITING AND API UTILITIES
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * OPENAI API CALL FUNCTION
 * Makes a request to OpenAI API with proper error handling
 */
const callOpenAI = async (prompt, retries = 3) => {
  const requestData = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are a Pokemon GO expert who creates concise, helpful role summaries and detailed notes for Pokemon based on their competitive performance data. Focus on practical advice for players.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 500,
    temperature: 0.7,
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(requestData);

    const options = {
      hostname: "api.openai.com",
      port: 443,
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Length": Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            throw new Error(response.error.message);
          }
          resolve(response.choices[0].message.content.trim());
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on("error", (error) => {
      if (retries > 0) {
        console.log(`Retrying API call... (${retries} attempts left)`);
        setTimeout(() => {
          callOpenAI(prompt, retries - 1)
            .then(resolve)
            .catch(reject);
        }, 1000);
      } else {
        reject(error);
      }
    });

    req.write(postData);
    req.end();
  });
};

/**
 * POKEMON DATA FORMATTER
 * Formats Pokemon data into a readable prompt for the AI
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
 * AI PROMPT GENERATORS
 */
const generateRoleSummaryPrompt = (mon) => {
  const pokemonData = formatPokemonData(mon);

  return `Based on the following Pokemon GO performance data, generate a concise 1-2 sentence role summary that describes this Pokemon's primary competitive value and role.

${pokemonData}

Guidelines:
- Be concise but informative (1-2 sentences max)
- Focus on the Pokemon's strongest competitive aspects
- Include practical advice (keep/transfer/invest)
- Use terms like "Meta-defining", "Strong", "Solid", "Situational", "Limited", or "No competitive value"
- Mention specific strengths (PvP leagues, raid types, defense)

Example formats:
- "Meta-defining raid specialist with elite psychic/ghost attacking power. High investment priority."
- "Solid PvP option for Great League with decent defensive typing. Worth developing."
- "Limited niche specialist for specific raid coverage. Keep one copy."
- "No competitive value - transfer for candy."

Role Summary:`;
};

const generateNotesPrompt = (mon) => {
  const pokemonData = formatPokemonData(mon);

  return `Based on the following Pokemon GO performance data, generate detailed notes explaining this Pokemon's competitive value, strengths, weaknesses, and usage recommendations.

${pokemonData}

Guidelines:
- Explain WHY this Pokemon has its performance rating
- Detail specific PvP, raid, and defense capabilities
- Mention any special form benefits/drawbacks
- Provide clear usage recommendations
- Be informative but concise (3-5 sentences)
- Include specific numbers/rankings when relevant

Example format:
"Rated [Tier] due to [reason]. Strong PvP performance in [leagues] with [specific scores]. [Raid tier] raid performance with top rankings in [types]. [Defense info if relevant]. [Recommended count explanation]. [Special form notes if applicable]."

Detailed Notes:`;
};

/**
 * AI-POWERED GENERATION FUNCTIONS
 */
const generateAIRoleSummary = async (mon) => {
  try {
    const prompt = generateRoleSummaryPrompt(mon);
    const response = await callOpenAI(prompt);
    return response.replace(/^Role Summary:\s*/i, "").trim();
  } catch (error) {
    console.error(`Error generating role summary for ${mon.name}:`, error.message);
    return `Pokemon with recommended count of ${mon.recommendedCount || 0}. Performance data available for analysis.`;
  }
};

const generateAIDetailedNotes = async (mon) => {
  try {
    const prompt = generateNotesPrompt(mon);
    const response = await callOpenAI(prompt);
    return response.replace(/^Detailed Notes:\s*/i, "").trim();
  } catch (error) {
    console.error(`Error generating notes for ${mon.name}:`, error.message);
    return `Performance analysis available. Check PvP leagues, raid utility, and defense capabilities for detailed evaluation.`;
  }
};

/**
 * BATCH PROCESSING WITH RATE LIMITING
 */
const processPokemonBatch = async (pokemon, batchSize = 5) => {
  const results = [];

  for (let i = 0; i < pokemon.length; i += batchSize) {
    const batch = pokemon.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(pokemon.length / batchSize)} (Pokemon ${i + 1}-${Math.min(i + batchSize, pokemon.length)})...`);

    const batchPromises = batch.map(async (mon) => {
      const [roleSummary, notes] = await Promise.all([generateAIRoleSummary(mon), generateAIDetailedNotes(mon)]);

      return {
        ...mon,
        roleSummary,
        notes,
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Rate limiting: wait between batches
    if (i + batchSize < pokemon.length) {
      console.log("Waiting 2 seconds to respect API rate limits...");
      await sleep(2000);
    }
  }

  return results;
};

/**
 * MAIN AI-POWERED PROCESSING FUNCTION
 */
const addAIRoleSummaryAndNotes = async () => {
  console.log("🤖 Adding AI-Generated Role Summary and Notes to Pokemon data...");
  console.log("⚠️  This will use OpenAI API and may take some time due to rate limiting.");

  const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));

  // For testing, process only first 10 Pokemon. Remove this limit for full processing.
  const testData = data.slice(0, 10);
  console.log(`🧪 Processing ${testData.length} Pokemon for testing (remove limit for full dataset)`);

  try {
    const updatedData = await processPokemonBatch(testData, 3); // Smaller batch size for API limits

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updatedData, null, 2));
    console.log(`✅ Successfully added AI-generated role summaries and notes to ${updatedData.length} Pokemon`);
    console.log(`📁 Output saved to: ${OUTPUT_PATH}`);

    // Show a sample result
    if (updatedData.length > 0) {
      console.log("\n📋 Sample Result:");
      console.log(`Pokemon: ${updatedData[0].name}`);
      console.log(`Role Summary: ${updatedData[0].roleSummary}`);
      console.log(`Notes: ${updatedData[0].notes}`);
    }
  } catch (error) {
    console.error("❌ Error processing Pokemon data:", error);
    process.exit(1);
  }
};

// Check if we should run in demo mode (without API key)
if (process.argv.includes("--demo")) {
  console.log("🎭 Running in DEMO mode - showing AI prompts without API calls");

  const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  const samplePokemon = data.slice(0, 3);

  samplePokemon.forEach((mon, index) => {
    console.log(`\n=== DEMO ${index + 1}: ${mon.name} ===`);
    console.log("\n📝 ROLE SUMMARY PROMPT:");
    console.log(generateRoleSummaryPrompt(mon));
    console.log("\n📝 DETAILED NOTES PROMPT:");
    console.log(generateNotesPrompt(mon));
    console.log("\n" + "=".repeat(50));
  });

  console.log("\n💡 To run with actual AI generation, set OPENAI_API_KEY and run without --demo flag");
} else {
  // Run the AI processor
  addAIRoleSummaryAndNotes();
}
