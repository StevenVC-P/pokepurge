// Pokemon GO type effectiveness chart
// Values: 2.56 = double super effective, 1.6 = super effective, 1.0 = neutral, 0.625 = not very effective, 0.39 = double not very effective

const TYPE_EFFECTIVENESS = {
  normal: {
    rock: 0.625,
    ghost: 0.39,
    steel: 0.625
  },
  fighting: {
    normal: 1.6,
    flying: 0.625,
    poison: 0.625,
    rock: 1.6,
    bug: 0.625,
    ghost: 0.39,
    steel: 1.6,
    fire: 1.0,
    water: 1.0,
    grass: 1.0,
    electric: 1.0,
    psychic: 0.625,
    ice: 1.6,
    dragon: 1.0,
    dark: 1.6,
    fairy: 0.625
  },
  flying: {
    fighting: 1.6,
    rock: 0.625,
    bug: 1.6,
    steel: 0.625,
    grass: 1.6,
    electric: 0.625
  },
  poison: {
    fighting: 1.0,
    poison: 0.625,
    ground: 0.625,
    rock: 0.625,
    bug: 1.0,
    ghost: 0.625,
    steel: 0.39,
    grass: 1.6,
    fairy: 1.6
  },
  ground: {
    flying: 0.39,
    poison: 1.6,
    bug: 0.625,
    steel: 1.6,
    fire: 1.6,
    grass: 0.625,
    electric: 1.6
  },
  rock: {
    fighting: 0.625,
    flying: 1.6,
    ground: 0.625,
    bug: 1.6,
    steel: 0.625,
    fire: 1.6,
    ice: 1.6
  },
  bug: {
    fighting: 0.625,
    flying: 0.625,
    poison: 0.625,
    ghost: 0.625,
    steel: 0.625,
    fire: 0.625,
    grass: 1.6,
    psychic: 1.6,
    dark: 1.6,
    fairy: 0.625
  },
  ghost: {
    normal: 0.39,
    ghost: 1.6,
    psychic: 1.6,
    dark: 0.625
  },
  steel: {
    rock: 1.6,
    steel: 0.625,
    fire: 0.625,
    water: 0.625,
    electric: 0.625,
    ice: 1.6,
    fairy: 1.6
  },
  fire: {
    rock: 0.625,
    bug: 1.6,
    steel: 1.6,
    fire: 0.625,
    water: 0.625,
    grass: 1.6,
    ice: 1.6,
    dragon: 0.625
  },
  water: {
    ground: 1.6,
    rock: 1.6,
    fire: 1.6,
    water: 0.625,
    grass: 0.625,
    dragon: 0.625
  },
  grass: {
    flying: 0.625,
    poison: 0.625,
    ground: 1.6,
    rock: 1.6,
    bug: 0.625,
    steel: 0.625,
    fire: 0.625,
    water: 1.6,
    grass: 0.625,
    dragon: 0.625
  },
  electric: {
    flying: 1.6,
    ground: 0.39,
    water: 1.6,
    grass: 0.625,
    electric: 0.625,
    dragon: 0.625
  },
  psychic: {
    fighting: 1.6,
    poison: 1.6,
    steel: 0.625,
    psychic: 0.625,
    dark: 0.39
  },
  ice: {
    flying: 1.6,
    ground: 1.6,
    steel: 0.625,
    fire: 0.625,
    water: 0.625,
    grass: 1.6,
    ice: 0.625,
    dragon: 1.6
  },
  dragon: {
    steel: 0.625,
    dragon: 1.6,
    fairy: 0.39
  },
  dark: {
    fighting: 0.625,
    ghost: 1.6,
    psychic: 1.6,
    dark: 0.625,
    fairy: 0.625
  },
  fairy: {
    poison: 0.625,
    steel: 0.625,
    fire: 0.625,
    fighting: 1.6,
    dragon: 1.6,
    dark: 1.6
  }
};

/**
 * Get the effectiveness multiplier of an attacking type against a defending type
 * @param {string} attackType - The attacking type
 * @param {string} defendType - The defending type
 * @returns {number} - Effectiveness multiplier (0.39, 0.625, 1.0, 1.6, or 2.56)
 */
function getEffectiveness(attackType, defendType) {
  const attack = attackType.toLowerCase();
  const defend = defendType.toLowerCase();
  
  if (!TYPE_EFFECTIVENESS[attack]) return 1.0;
  
  return TYPE_EFFECTIVENESS[attack][defend] || 1.0;
}

/**
 * Calculate the total effectiveness of an attack against a dual-type Pokemon
 * @param {string} attackType - The attacking type
 * @param {string[]} defendTypes - Array of defending types (1 or 2 types)
 * @returns {number} - Total effectiveness multiplier
 */
function getEffectivenessVsDualType(attackType, defendTypes) {
  if (!defendTypes || defendTypes.length === 0) return 1.0;
  
  let multiplier = 1.0;
  
  for (const defendType of defendTypes) {
    multiplier *= getEffectiveness(attackType, defendType);
  }
  
  return multiplier;
}

/**
 * Get all weaknesses for a Pokemon's type combination
 * @param {string[]} pokemonTypes - Array of Pokemon's types
 * @returns {Object} - Object with attack types as keys and effectiveness as values
 */
function getWeaknesses(pokemonTypes) {
  const weaknesses = {};
  
  // All possible attack types
  const allTypes = Object.keys(TYPE_EFFECTIVENESS);
  
  for (const attackType of allTypes) {
    const effectiveness = getEffectivenessVsDualType(attackType, pokemonTypes);
    if (effectiveness > 1.0) {
      weaknesses[attackType] = effectiveness;
    }
  }
  
  return weaknesses;
}

/**
 * Get all resistances for a Pokemon's type combination
 * @param {string[]} pokemonTypes - Array of Pokemon's types
 * @returns {Object} - Object with attack types as keys and effectiveness as values
 */
function getResistances(pokemonTypes) {
  const resistances = {};
  
  // All possible attack types
  const allTypes = Object.keys(TYPE_EFFECTIVENESS);
  
  for (const attackType of allTypes) {
    const effectiveness = getEffectivenessVsDualType(attackType, pokemonTypes);
    if (effectiveness < 1.0) {
      resistances[attackType] = effectiveness;
    }
  }
  
  return resistances;
}

/**
 * Categorize effectiveness values into readable labels
 * @param {number} effectiveness - Effectiveness multiplier
 * @returns {string} - Human-readable effectiveness label
 */
function getEffectivenessLabel(effectiveness) {
  if (effectiveness >= 2.5) return "Double Super Effective";
  if (effectiveness >= 1.5) return "Super Effective";
  if (effectiveness > 1.0) return "Effective";
  if (effectiveness === 1.0) return "Neutral";
  if (effectiveness >= 0.6) return "Not Very Effective";
  if (effectiveness >= 0.4) return "Double Not Very Effective";
  return "Immune";
}

module.exports = {
  TYPE_EFFECTIVENESS,
  getEffectiveness,
  getEffectivenessVsDualType,
  getWeaknesses,
  getResistances,
  getEffectivenessLabel
};
