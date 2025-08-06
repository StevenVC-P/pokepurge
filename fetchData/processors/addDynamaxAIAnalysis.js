// addDynamaxAIAnalysis.js (REWRITTEN for clarity, structure, and AI quality)

const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const INPUT_PATH = path.resolve(__dirname, "../../public/data/pokemon.json");
const OUTPUT_PATH = path.resolve(__dirname, "../../public/data/pokemon.json");
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3:latest";
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";

const callOllama = async (prompt, retries = 3) => {
  return new Promise((resolve, reject) => {
    const requestData = JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: { temperature: 0.7, top_p: 0.9, max_tokens: 300 },
    });

    const curl = spawn("curl", ["-X", "POST", "-H", "Content-Type: application/json", "-d", requestData, `${OLLAMA_HOST}/api/generate`]);
    let responseData = "";

    curl.stdout.on("data", (data) => (responseData += data.toString()));
    curl.stderr.on("data", (data) => console.error("🛑 Curl Error:", data.toString()));

    curl.on("close", (code) => {
      if (code !== 0) {
        return retries > 0
          ? setTimeout(
              () =>
                callOllama(prompt, retries - 1)
                  .then(resolve)
                  .catch(reject),
              1000
            )
          : reject(new Error(`Curl failed with code ${code}`));
      }

      try {
        const result = JSON.parse(responseData);
        resolve(result.response || "");
      } catch (err) {
        return retries > 0
          ? setTimeout(
              () =>
                callOllama(prompt, retries - 1)
                  .then(resolve)
                  .catch(reject),
              1000
            )
          : reject(new Error(`Parse error: ${err.message}`));
      }
    });
  });
};

// Type effectiveness chart
const TYPE_EFFECTIVENESS = {
  Fire: ["Grass", "Bug", "Ice", "Steel"],
  Water: ["Fire", "Ground", "Rock"],
  Grass: ["Water", "Ground", "Rock"],
  Electric: ["Water", "Flying"],
  Flying: ["Fighting", "Bug", "Grass"],
  Fighting: ["Normal", "Rock", "Steel", "Ice", "Dark"],
  Poison: ["Grass", "Fairy"],
  Ground: ["Fire", "Electric", "Poison", "Rock", "Steel"],
  Rock: ["Fire", "Ice", "Flying", "Bug"],
  Bug: ["Grass", "Psychic", "Dark"],
  Ghost: ["Ghost", "Psychic"],
  Steel: ["Rock", "Ice", "Fairy"],
  Psychic: ["Fighting", "Poison"],
  Ice: ["Flying", "Ground", "Grass", "Dragon"],
  Dragon: ["Dragon"],
  Dark: ["Ghost", "Psychic"],
  Fairy: ["Fighting", "Dragon", "Dark"],
  Normal: [],
};

// Trashability tier rankings for comparison
const TRASHABILITY_RANK = {
  Essential: 6,
  Valuable: 5,
  Reliable: 4,
  Useful: 3,
  Niche: 2,
  Trash: 1,
};

/**
 * Analyze evolution potential and provide context for AI analysis
 */
const analyzeEvolutionPotential = (mon, allData) => {
  if (!allData || !mon.candy) return null;

  // Find all Pokemon in the same evolution family (same candy)
  const evolutionFamily = allData.filter(
    (p) =>
      p.candy === mon.candy &&
      p.dynamax === true && // Only consider Dynamax-enabled Pokemon
      p.form.includes("Shadow") === mon.form.includes("Shadow") // Same shadow status
  );

  if (evolutionFamily.length <= 1) return null;

  // Define evolution hierarchy - Gigantamax > Final Evolution > Middle Evolution > Base
  const getEvolutionRank = (pokemon) => {
    if (pokemon.form.includes("Gigantamax")) return 4; // Highest priority

    // Determine evolution stage by name patterns and known evolutions
    const name = pokemon.name;
    const isBaseForm = ["Charmander", "Squirtle", "Bulbasaur", "Caterpie", "Grookey", "Scorbunny", "Sobble", "Machop", "Pidove", "Drilbur"].includes(name);
    const isMiddleForm = ["Charmeleon", "Wartortle", "Ivysaur", "Metapod", "Thwackey", "Raboot", "Drizzile", "Machoke", "Tranquill"].includes(name);
    const isFinalForm = ["Charizard", "Blastoise", "Venusaur", "Butterfree", "Rillaboom", "Cinderace", "Inteleon", "Machamp", "Unfezant", "Excadrill"].includes(name);

    if (isFinalForm) return 3;
    if (isMiddleForm) return 2;
    if (isBaseForm) return 1;

    // Fallback: use trashability as secondary sort
    return TRASHABILITY_RANK[pokemon.trashability] || 0;
  };

  // Sort family by evolution rank first, then by trashability
  const sortedFamily = evolutionFamily.sort((a, b) => {
    const aRank = getEvolutionRank(a);
    const bRank = getEvolutionRank(b);

    if (aRank !== bRank) return bRank - aRank; // Higher evolution rank first

    // If same evolution rank, sort by trashability
    const aTier = TRASHABILITY_RANK[a.trashability] || 0;
    const bTier = TRASHABILITY_RANK[b.trashability] || 0;
    return bTier - aTier;
  });

  const currentIndex = sortedFamily.findIndex((p) => p.name === mon.name);
  const bestInFamily = sortedFamily[0];
  const isCurrentBest = bestInFamily.name === mon.name;

  // Generate evolution context
  if (isCurrentBest) {
    // This is the best in the family
    const worseMembers = sortedFamily.slice(1);
    if (worseMembers.length > 0) {
      const worseNames = worseMembers.map((p) => p.name).slice(0, 2);
      return `Best evolution in ${mon.candy.replace(" Candy", "")} family. Outclasses ${worseNames.join(", ")}.`;
    }
  } else {
    // This is not the best - compare to the best
    const currentRank = getEvolutionRank(mon);
    const bestRank = getEvolutionRank(bestInFamily);

    if (bestRank > currentRank) {
      if (bestInFamily.form.includes("Gigantamax")) {
        return `Evolution potential: ${bestInFamily.name} (Gigantamax form) significantly outperforms this form in Max Battles.`;
      } else {
        return `Evolution potential: ${bestInFamily.name} (${bestInFamily.trashability}) is the stronger evolution choice.`;
      }
    } else {
      return `Evolution family: Similar performance to ${bestInFamily.name}.`;
    }
  }

  return null;
};

const formatDynamaxData = (mon, allData) => {
  const lines = [];
  lines.push(`Name: ${mon.name}`);
  lines.push(`Form: ${mon.form}`);
  lines.push(`Types: ${mon.types?.join("/")}`);
  lines.push(`Trashability: ${mon.trashability}`);
  lines.push(`Recommended Count: ${mon.recommendedCount}`);

  // Add evolution analysis
  const evolutionInfo = analyzeEvolutionPotential(mon, allData);
  if (evolutionInfo) {
    lines.push(`Evolution Context: ${evolutionInfo}`);
  }

  // Enhanced Effective Against with type effectiveness
  const effectiveAgainst = [];

  // Add existing maxBattleEffectiveAgainst data (Pokemon names)
  if (mon.maxBattleEffectiveAgainst?.length) {
    const highTierTargets = mon.maxBattleEffectiveAgainst
      .filter((t) => t.difficulty >= 4) // Only 4★ and 5★ targets
      .map((t) => `${t.name} (${t.difficulty}★)`)
      .slice(0, 3);

    if (highTierTargets.length > 0) {
      effectiveAgainst.push(`High-Tier Targets: ${highTierTargets.join(", ")}`);
    } else {
      // Fallback to any targets if no high-tier ones exist
      const pokemonNames = mon.maxBattleEffectiveAgainst.map((t) => t.name).slice(0, 3);
      effectiveAgainst.push(`Beats: ${pokemonNames.join(", ")}`);
    }
  }

  // Add type effectiveness from Max move types
  if (mon.maxMoveRecommendations?.length) {
    const maxMoveTypes = mon.maxMoveRecommendations
      .filter((move) => move.category === "Attack")
      .map((move) => move.moveType)
      .filter((type, index, arr) => arr.indexOf(type) === index); // Remove duplicates

    const typeEffectiveness = [];
    maxMoveTypes.forEach((type) => {
      const effective = TYPE_EFFECTIVENESS[type];
      if (effective && effective.length > 0) {
        typeEffectiveness.push(`${type} beats ${effective.join(", ")}`);
      }
    });

    if (typeEffectiveness.length > 0) {
      effectiveAgainst.push(`Type Coverage: ${typeEffectiveness.join(" | ")}`);
    }
  }

  // Add fast move type coverage from dynamaxFastMoves
  if (mon.dynamaxFastMoves?.length) {
    const fastMoveTypes = mon.dynamaxFastMoves.map((move) => `${move.type} (${move.moveName}, ${move.eps} EPS)`).slice(0, 3);

    if (fastMoveTypes.length > 0) {
      effectiveAgainst.push(`Fast Move Options: ${fastMoveTypes.join(", ")}`);
    }
  }

  if (effectiveAgainst.length > 0) {
    lines.push(`Effective Against: ${effectiveAgainst.join(" | ")}`);
  }

  if (mon.bestTypes?.length) {
    lines.push(
      `Type Performance: ${mon.bestTypes
        .slice(0, 2)
        .map((t) => `${t.type}: ${t.dps} DPS`)
        .join(", ")}`
    );
  }
  return lines.filter(Boolean).join("\n");
};

const generatePrompt = (mon, type, allData) => {
  const data = formatDynamaxData(mon, allData);
  if (type === "summary") {
    return `Write a conversational Max Battle analysis in 2-3 short paragraphs. Sound knowledgeable but approachable.

PARAGRAPH 1: Opening + Tier effectiveness (1-2 sentences)
- Which Max Battle tiers (1★-6★) this works best in
- Brief mention of its role/strength

PARAGRAPH 2: Evolution context + Survivability (1-2 sentences)
- Why someone would use this form (if not the best evolution)
- How tough it is (can it survive a few hits?)

PARAGRAPH 3: Investment advice (1 sentence)
- Smart, practical tip for casual players

Use natural language. Be helpful and informative without being overly casual or using greetings.
Separate paragraphs with double line breaks (\\n\\n).

\n\n${data}\n\nAnalysis:`;
  }
  if (type === "notes") {
    return `Write 1-2 practical strategy tips in short paragraphs. Be helpful and informative.

PARAGRAPH 1: Turn strategy + Key matchups (1-2 sentences)
- Best turn sequence (like "Start with Max Guard to tank, then Max Spirit to heal your team")
- Which bosses this Pokemon wrecks

PARAGRAPH 2 (if needed): Resource tips (1 sentence)
- Smart resource advice (evolution priorities, budget tips, etc.)

Keep it natural and helpful. No greetings, bullet points, or overly casual language.
Separate paragraphs with double line breaks (\\n\\n).

\n\n${data}\n\nNotes:`;
  }
  if (type === "tags") {
    return `Provide exactly 3 tags describing this Pokémon’s role in Max Battles.
Output ONLY the tags, separated by commas. No explanations or extra text.
Use Max Battle-specific terms like: High DPS, Tank, Healer, Meta Relevant, Budget Option, Evolution Target, Solo Viable, Team Support, Max Guard User, Max Spirit User, Early Lead, Finisher, Boss Killer, etc.

Example output: High DPS, Reliable Pick, Meta Relevant

\n\n${data}\n\nTags:`;
  }
  if (type === "quickRole") {
    return `Assign a Max Battle role to this Pokémon based on optimal strategy.

Primary Role (choose one): Attacker, Tank, Healer
Optional Sub-Role: Max Guard User, Max Spirit User, Early Lead, Finisher, Support, Solo Carry

Consider:
- Max Move access and synergy
- 3-turn survivability
- Team utility vs solo performance
- Boss tier effectiveness

Format like: "Attacker + Max Guard User" or just "Healer"

\n\n${data}\n\nRole:`;
  }
};

const clean = (text = "") => {
  return text
    .replace(/^(Analysis|Notes|Tags|Role)[:\s]*/i, "")
    .replace(/['"`]/g, "")
    .replace(/^[-\s]*/, "")
    .replace(/^\n+/, "")
    .trim();
};

const generate = async (mon, type, fallback, allData) => {
  try {
    const prompt = generatePrompt(mon, type, allData);
    const raw = await callOllama(prompt);
    const cleaned = clean(raw);
    return cleaned.length > 30 ? cleaned : fallback(mon);
  } catch (err) {
    console.warn(`⚠️ AI ${type} failed for ${mon.name}, using fallback.`);
    return fallback(mon);
  }
};

const generateAll = async (mon, allData) => {
  mon.dynamaxRoleSummary = await generate(mon, "summary", generateFallbackSummary, allData);
  mon.dynamaxNotes = await generate(mon, "notes", generateFallbackNotes, allData);
  const rawTags = await generate(mon, "tags", generateFallbackTags, allData);
  mon.dynamaxKeyTags = Array.isArray(rawTags)
    ? rawTags.slice(0, 3)
    : rawTags
        .split(/[,\n]/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0 && !t.includes(":") && !t.toLowerCase().includes("tag"))
        .slice(0, 3);
  mon.dynamaxQuickRole = await generate(mon, "quickRole", generateFallbackQuickRole, allData);

  // Add type-specific Pokemon counters for UI display
  if (mon.maxMoveRecommendations?.length && mon.maxBattleEffectiveAgainst?.length) {
    const maxMoveTypes = mon.maxMoveRecommendations
      .filter((move) => move.category === "Attack")
      .map((move) => move.moveType)
      .filter((type, index, arr) => arr.indexOf(type) === index); // Remove duplicates

    // Group effective Pokemon by the move types that are effective against them
    mon.typeSpecificCounters = maxMoveTypes
      .map((moveType) => {
        const effectiveTypes = TYPE_EFFECTIVENESS[moveType] || [];

        // Find all Dynamax Pokemon (3★ and up) that have types weak to this move type
        const allPotentialCounters = allData
          .filter((pokemon) => {
            if (!pokemon.dynamax || !pokemon.types) return false;
            // Check if any of the Pokemon's types are weak to this move type
            return pokemon.types.some((pokemonType) => effectiveTypes.includes(pokemonType));
          })
          .map((pokemon) => {
            const weakType = pokemon.types.find((t) => effectiveTypes.includes(t));

            // Check if this Pokemon is in the existing maxBattleEffectiveAgainst list
            const existingTarget = mon.maxBattleEffectiveAgainst?.find((t) => t.name === pokemon.name);

            return {
              name: pokemon.name,
              difficulty: existingTarget?.difficulty || 2, // Default difficulty if not in existing list
              effectiveness: "super-effective",
              moveInfo: {
                moveName: `Max ${moveType === "Fire" ? "Flare" : moveType === "Flying" ? "Airstream" : moveType === "Dragon" ? "Wyrmwind" : moveType}`,
                moveType: moveType,
                reason: `${moveType} beats ${weakType}`,
              },
            };
          })
          .filter((counter) => counter.difficulty >= 3) // Only show 3★ and up
          .sort((a, b) => {
            // Prioritize Pokemon that are already in maxBattleEffectiveAgainst
            const aInList = mon.maxBattleEffectiveAgainst?.some((t) => t.name === a.name);
            const bInList = mon.maxBattleEffectiveAgainst?.some((t) => t.name === b.name);
            if (aInList && !bInList) return -1;
            if (!aInList && bInList) return 1;
            return a.difficulty - b.difficulty; // Then sort by difficulty
          });

        return {
          moveType: moveType,
          effectiveAgainst: effectiveTypes,
          counters: allPotentialCounters.slice(0, 3), // Limit to top 3 for each type
        };
      })
      .filter((item) => item.counters.length > 0);
  }
};

const generateFallbackSummary = (mon) => `${mon.name} fills an Attacker role in Max Battles with strong performance. Recommended count: ${mon.recommendedCount}.`;
const generateFallbackNotes = (mon) => `Best used when you need reliable ${mon.types?.join("/")} coverage.`;
const generateFallbackTags = (mon) => ["Reliable Pick", "High DPS"];
const generateFallbackQuickRole = (mon) => "Attacker";

const run = async () => {
  const data = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
  let dynamaxMons = data.filter((mon) => mon.dynamax);

  // Test mode: Only process specific Pokemon if test flags are present
  if (process.argv.includes("--test-charizard")) {
    dynamaxMons = dynamaxMons.filter((mon) => mon.name === "Charizard");
    console.log(`🧪 TEST MODE: Only processing Charizard`);
  } else if (process.argv.includes("--test-charmander")) {
    dynamaxMons = dynamaxMons.filter((mon) => mon.name === "Charmander");
    console.log(`🧪 TEST MODE: Only processing Charmander`);
  } else if (process.argv.includes("--test-charmander-family")) {
    dynamaxMons = dynamaxMons.filter((mon) => mon.candy === "Charmander");
    console.log(`🧪 TEST MODE: Only processing Charmander evolution family`);
  }

  console.log(`🔍 Found ${dynamaxMons.length} Dynamax Pokémon`);

  for (const mon of dynamaxMons) {
    console.log(`🧠 Processing: ${mon.name}`);
    await generateAll(mon, data);
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2));
  console.log(`✅ Output written to ${OUTPUT_PATH}`);
};

run();
