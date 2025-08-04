/**
 * DYNAMAX AI-POWERED ANALYSIS GENERATOR
 *
 * Uses a local LLM (via Ollama) to generate Max Battle-specific analysis for dynamax Pokemon:
 * - Max Battle utility and strategy
 * - Gigantamax form advantages
 * - Dynamax transformation benefits
 * - Max Battle team composition
 * - Investment priority for Max Battles
 *
 * DYNAMAX ROLE SUMMARY: AI-generated Max Battle-focused role description
 * DYNAMAX NOTES: AI-generated detailed Max Battle strategy and usage
 * DYNAMAX TAGS: AI-generated Max Battle-specific tags
 * DYNAMAX QUICK ROLE: AI-generated concise Max Battle role
 *
 * REQUIREMENTS:
 * - Ollama installed locally (https://ollama.ai/)
 * - A suitable model downloaded (e.g., llama3.1:8b, mistral, codellama)
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const INPUT_PATH = path.resolve(__dirname, "../../public/data/pokemon.json");
const OUTPUT_PATH = path.resolve(__dirname, "../../public/data/pokemon.json");

// Local AI Configuration
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3:latest";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

/**
 * OLLAMA API INTERFACE
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
          console.log(`Retrying... (${retries} attempts left)`);
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
        resolve(response.response || "No response generated");
      } catch (error) {
        if (retries > 0) {
          console.log(`JSON parse error, retrying... (${retries} attempts left)`);
          setTimeout(() => {
            callOllama(prompt, retries - 1)
              .then(resolve)
              .catch(reject);
          }, 1000);
        } else {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      }
    });
  });
};

/**
 * FORMAT DYNAMAX POKEMON DATA FOR AI ANALYSIS
 */
const formatDynamaxData = (mon) => {
  const data = [];

  // Basic info
  data.push(`Name: ${mon.name}`);
  data.push(`Form: ${mon.form}`);
  data.push(`Types: ${mon.types?.join("/") || "Unknown"}`);

  // Dynamax-specific data
  data.push(`Dynamax Trashability: ${mon.trashability}`);
  data.push(`Dynamax Score: ${mon.dynamaxScore || "N/A"}`);

  // Check if it's a Gigantamax form
  if (mon.form === "Gigantamax") {
    data.push(`Special: Gigantamax form with enhanced Max Battle abilities`);
  }

  // Type effectiveness data
  if (mon.maxBattleEffectiveAgainst?.length > 0) {
    const targets = mon.maxBattleEffectiveAgainst
      .slice(0, 3)
      .map((t) => t.name)
      .join(", ");
    data.push(`Effective Against: ${targets}`);
  }

  // Best type performance (if available)
  if (mon.bestTypes && Array.isArray(mon.bestTypes)) {
    const typePerformance = mon.bestTypes
      .slice(0, 2)
      .map((typeData) => `${typeData.type}: ${typeData.dps || "N/A"} DPS`)
      .join(", ");
    if (typePerformance) data.push(`Type Performance: ${typePerformance}`);
  }

  return data.join("\n");
};

/**
 * DYNAMAX ROLE SUMMARY PROMPT
 */
const generateDynamaxRoleSummaryPrompt = (mon) => {
  const pokemonData = formatDynamaxData(mon);

  return `🎯 Prompt: Generate Pokémon Dynamax Battle Analysis
Your goal is to generate a short but helpful analysis of a Pokémon's role and viability in Dynamax Battles in Pokémon GO, aimed at casual but informed players.

Data: ${pokemonData}

Focus on:
- Max Battle performance only (no PvP league mentions)
- Attack type effectiveness (how good is it as a [Type] attacker?)
- Ranking within its type (best Fire option? solid Water choice?)
- Max Battle role (damage dealer, tank, support)

Output Format:
Analysis: One or two sentences about Max Battle performance. Focus on attack types and how it ranks among Pokemon of that type.

Examples:
- Charizard serves as a solid Fire-type attacker in Max Battles with strong Fire moves and decent bulk. It ranks among the better Fire options for Max Battle teams.
- Venusaur excels as a premier Grass-type damage dealer with powerful Grass moves and good survivability. One of the top Grass attackers available for Max Battles.

Analysis:`;
};

/**
 * DYNAMAX NOTES PROMPT
 */
const generateDynamaxNotesPrompt = (mon) => {
  const pokemonData = formatDynamaxData(mon);

  return `Pokemon GO Max Battle Tips for Casual Players

Data: ${pokemonData}

Write 2-3 short sentences about using this Pokemon. Be casual and helpful.

Include:
- What it does well (tanks, hits hard, supports team)
- What types it beats
- Simple advice (worth upgrading, use against X, good teammate)

Keep sentences short. No fluff.

Analysis:`;
};

/**
 * DYNAMAX TAGS PROMPT
 */
const generateDynamaxTagsPrompt = (mon) => {
  const pokemonData = formatDynamaxData(mon);

  return `🎯 Generate Pokémon Dynamax Battle Tags

Data: ${pokemonData}

Tags: Up to 3 short callouts. Choose from: High DPS, Bulky, Reliable Pick, Team Player, Niche Use, Great Starter, Late Game Closer, Glass Cannon, Fast Charged, AoE Coverage, Status Setter, Best in Fire, Best in Water, Best in Grass, Best in Electric, Gigantamax Elite, Budget Option, Keep Multiple

Examples:
- High DPS, Glass Cannon, Best in Grass
- Reliable Pick, Team Player
- Bulky, Late Game Closer

Tags:`;
};

/**
 * DYNAMAX QUICK ROLE PROMPT
 */
const generateDynamaxQuickRolePrompt = (mon) => {
  const pokemonData = formatDynamaxData(mon);

  return `🎯 Generate Pokémon Dynamax Battle Role

Data: ${pokemonData}

Role: Choose one of the following: Blaster, Tank, Healer, Flexible, Setup, or Bench. You can combine two (e.g., Blaster + Healer) if justified.

Examples:
- Blaster (high damage dealer)
- Tank (absorbs damage)
- Healer (supports team)
- Flexible (multiple roles)
- Setup (enables team)
- Bench (situational use)

Role:`;
};

/**
 * GENERATE DYNAMAX AI CONTENT
 */
const generateDynamaxRoleSummary = async (mon) => {
  try {
    const prompt = generateDynamaxRoleSummaryPrompt(mon);
    const response = await callOllama(prompt);
    let cleanSummary = response
      .replace(/^(Summary:|Role Summary:|Analysis:)\s*/i, "")
      .replace(/['"]/g, "")
      .replace(/^-\s*/, "")
      .trim();

    const sentences = cleanSummary.split(". ");
    cleanSummary = sentences.slice(0, 2).join(". ");
    if (!cleanSummary.endsWith(".")) cleanSummary += ".";

    return cleanSummary || "Max Battle analysis unavailable.";
  } catch (error) {
    console.error(`Error generating dynamax role summary for ${mon.name}:`, error.message);
    return "Max Battle analysis unavailable.";
  }
};

const generateDynamaxNotes = async (mon) => {
  try {
    const prompt = generateDynamaxNotesPrompt(mon);
    const response = await callOllama(prompt);
    let cleanNotes = response
      .replace(/^(Analysis:|Notes:|Strategy:)\s*/i, "")
      .replace(/['"]/g, "")
      .trim();

    return cleanNotes || "Max Battle strategy analysis unavailable.";
  } catch (error) {
    console.error(`Error generating dynamax notes for ${mon.name}:`, error.message);
    return "Max Battle strategy analysis unavailable.";
  }
};

const generateDynamaxTags = async (mon) => {
  try {
    const prompt = generateDynamaxTagsPrompt(mon);
    const response = await callOllama(prompt);
    let cleanTags = response
      .replace(/^(Tags:|Keywords:)\s*/i, "")
      .replace(/['"]/g, "")
      .trim();

    // Parse tags and clean them up
    const tags = cleanTags
      .split(/[,\n]/)
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
      .slice(0, 3); // Limit to 3 tags

    return tags.length > 0 ? tags : ["Max Battle"];
  } catch (error) {
    console.error(`Error generating dynamax tags for ${mon.name}:`, error.message);
    return ["Max Battle"];
  }
};

const generateDynamaxQuickRole = async (mon) => {
  try {
    const prompt = generateDynamaxQuickRolePrompt(mon);
    const response = await callOllama(prompt);
    let cleanRole = response
      .replace(/^(Role:|Quick Role:)\s*/i, "")
      .replace(/['"]/g, "")
      .trim();

    return cleanRole || "Max Battle";
  } catch (error) {
    console.error(`Error generating dynamax quick role for ${mon.name}:`, error.message);
    return "Max Battle";
  }
};

/**
 * FALLBACK FUNCTIONS FOR WHEN AI IS NOT AVAILABLE
 */
const generateFallbackRoleSummary = (mon) => {
  const tier = mon.trashability || "Useful";
  const form = mon.form === "Gigantamax" ? "Gigantamax " : "";
  const types = mon.types?.join("/") || "Unknown";

  if (mon.form === "Gigantamax") {
    return `${form}${mon.base} is an essential Max Battle elite with enhanced Gigantamax abilities and superior Max Move power. High priority for Max Battle teams.`;
  } else {
    const roleMap = {
      Essential: "essential Max Battle core",
      Valuable: "valuable Max Battle option",
      Reliable: "reliable Max Battle performer",
      Useful: "useful Max Battle participant",
      Niche: "niche Max Battle specialist",
      Trash: "limited Max Battle utility",
    };

    return `${mon.name} is a ${roleMap[tier] || "useful Max Battle participant"} with ${types} typing and dynamax transformation benefits. Worth considering for Max Battle teams.`;
  }
};

const generateFallbackNotes = (mon) => {
  const form = mon.form === "Gigantamax" ? "Gigantamax " : "";
  const types = mon.types?.join(" and ") || "unknown";

  if (mon.form === "Gigantamax") {
    return `${form}${mon.base} excels in Max Battles with enhanced stats, unique Max Moves, and superior team synergy. The Gigantamax form provides significant advantages over regular dynamax Pokemon, making it a premium choice for competitive Max Battle strategies. Prioritize investment for serious Max Battle participation.`;
  } else {
    return `${mon.name} contributes to Max Battle teams through dynamax transformation, providing increased HP and access to powerful Max Moves. The ${types} typing offers strategic coverage in the Max Battle meta. Consider as part of a balanced Max Battle roster based on team composition needs.`;
  }
};

const generateFallbackTags = (mon) => {
  if (mon.form === "Gigantamax") {
    return ["Gigantamax Elite", "Max Battle Core", "Team Anchor"];
  }

  const tier = mon.trashability || "Useful";
  const tagMap = {
    Essential: ["Max Battle Core", "Team Anchor", "High Priority"],
    Valuable: ["Max Attacker", "Versatile Max", "Solid Choice"],
    Reliable: ["Max Defender", "Balanced Max", "Team Support"],
    Useful: ["Max Support", "Budget Option", "Situational"],
    Niche: ["Niche Max", "Specialist", "Limited Use"],
    Trash: ["Budget Option", "Limited Use", "Filler"],
  };

  return tagMap[tier] || ["Max Battle", "Dynamax", "Transformation"];
};

const generateFallbackQuickRole = (mon) => {
  if (mon.form === "Gigantamax") {
    return "Gigantamax Elite";
  }

  const tier = mon.trashability || "Useful";
  const roleMap = {
    Essential: "Max Battle Core",
    Valuable: "Max Attacker",
    Reliable: "Max Defender",
    Useful: "Max Support",
    Niche: "Niche Max",
    Trash: "Budget Max",
  };

  return roleMap[tier] || "Max Battle";
};

/**
 * MAIN PROCESSOR FUNCTION
 */
const addDynamaxAIAnalysis = async () => {
  console.log("🤖 Starting Dynamax AI Analysis Generation...");

  const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  const dynamaxPokemon = data.filter((mon) => mon.dynamax === true);

  console.log(`📊 Found ${dynamaxPokemon.length} dynamax Pokemon to analyze`);

  // Check if Ollama is available (force fallback for testing)
  let aiAvailable = false;
  if (process.argv.includes("--force-ai")) {
    try {
      await callOllama("test", 1);
      aiAvailable = true;
      console.log("✅ Local AI (Ollama) detected - generating full analysis");
    } catch (error) {
      console.log("⚠️  Local AI not available - using intelligent fallback analysis");
    }
  } else {
    console.log("⚠️  Using intelligent fallback analysis (use --force-ai to enable AI)");
  }

  let processed = 0;
  const total = dynamaxPokemon.length;

  for (const mon of dynamaxPokemon) {
    try {
      console.log(`🔄 Processing ${mon.name} (${++processed}/${total})`);

      if (aiAvailable) {
        // Generate all dynamax-specific AI content
        const [roleSummary, notes, tags, quickRole] = await Promise.all([generateDynamaxRoleSummary(mon), generateDynamaxNotes(mon), generateDynamaxTags(mon), generateDynamaxQuickRole(mon)]);

        // Store in dynamax-specific fields
        mon.dynamaxRoleSummary = roleSummary;
        mon.dynamaxNotes = notes;
        mon.dynamaxKeyTags = tags;
        mon.dynamaxQuickRole = quickRole;

        // Small delay to avoid overwhelming the AI
        await new Promise((resolve) => setTimeout(resolve, 500));
      } else {
        // Use intelligent fallback based on dynamax data
        mon.dynamaxRoleSummary = generateFallbackRoleSummary(mon);
        mon.dynamaxNotes = generateFallbackNotes(mon);
        mon.dynamaxKeyTags = generateFallbackTags(mon);
        mon.dynamaxQuickRole = generateFallbackQuickRole(mon);
      }
    } catch (error) {
      console.error(`❌ Error processing ${mon.name}:`, error.message);
      // Set fallback values
      mon.dynamaxRoleSummary = generateFallbackRoleSummary(mon);
      mon.dynamaxNotes = generateFallbackNotes(mon);
      mon.dynamaxKeyTags = generateFallbackTags(mon);
      mon.dynamaxQuickRole = generateFallbackQuickRole(mon);
    }
  }

  // Update the full dataset
  const updatedData = data.map((mon) => {
    const dynamaxMon = dynamaxPokemon.find((d) => d.name === mon.name);
    return dynamaxMon || mon;
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(updatedData, null, 2));
  console.log(`✅ Generated dynamax AI analysis for ${processed} Pokemon → saved to ${path.basename(OUTPUT_PATH)}`);
};

/**
 * DEMO MODE - Show prompts without calling AI
 */
const runDemo = () => {
  console.log("🎭 DYNAMAX AI ANALYSIS DEMO MODE");
  console.log("Showing prompts that would be sent to local AI...\n");

  const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  const sampleDynamax = data.filter((mon) => mon.dynamax === true).slice(0, 2);

  sampleDynamax.forEach((mon) => {
    console.log("=".repeat(60));
    console.log(`🎯 SAMPLE PROMPTS FOR: ${mon.name}`);
    console.log("=".repeat(60));

    console.log("\n📝 DYNAMAX ROLE SUMMARY PROMPT:");
    console.log(generateDynamaxRoleSummaryPrompt(mon));

    console.log("\n📝 DYNAMAX NOTES PROMPT:");
    console.log(generateDynamaxNotesPrompt(mon));

    console.log("\n📝 DYNAMAX TAGS PROMPT:");
    console.log(generateDynamaxTagsPrompt(mon));

    console.log("\n📝 DYNAMAX QUICK ROLE PROMPT:");
    console.log(generateDynamaxQuickRolePrompt(mon));

    console.log("\n" + "=".repeat(60));
  });

  console.log("\n💡 To run with actual AI generation:");
  console.log("1. Install Ollama: https://ollama.ai/");
  console.log("2. Download a model: ollama pull llama3:latest");
  console.log("3. Start Ollama service");
  console.log("4. Run without --demo flag");
};

// Check if running in demo mode
if (process.argv.includes("--demo")) {
  runDemo();
} else {
  addDynamaxAIAnalysis();
}

module.exports = {
  generateDynamaxRoleSummary,
  generateDynamaxNotes,
  generateDynamaxTags,
  generateDynamaxQuickRole,
  generateDynamaxRoleSummaryPrompt,
  generateDynamaxNotesPrompt,
  generateDynamaxTagsPrompt,
  generateDynamaxQuickRolePrompt,
  addDynamaxAIAnalysis,
};
