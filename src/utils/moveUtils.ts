// Utility functions for working with optimized move data

export interface Move {
  id: string;
  name: string;
  type: string;
  category: "fast" | "charge";
  power: number;
  energyGain?: number; // Fast moves only
  energyCost?: number; // Charge moves only
  turns?: number; // Fast moves only
  cooldown?: number;
  buffs?: number[] | null;
  buffApplyChance?: string | null;
  buffTarget?: string | null;
  moveId?: string;
}

export interface MovesDatabase {
  [moveId: string]: Move;
}

export interface OptimizedMoves {
  fast?: string; // Move ID reference
  charge1?: string; // Move ID reference
  charge2?: string; // Move ID reference
}

export interface FullMoves {
  fast?: Move;
  charge1?: Move;
  charge2?: Move;
}

// Cache for moves database
let movesCache: MovesDatabase | null = null;

/**
 * Load the moves database (cached after first load)
 */
export async function loadMovesDatabase(): Promise<MovesDatabase> {
  if (movesCache) {
    return movesCache;
  }
  
  try {
    const response = await fetch('/data/moves.json');
    if (!response.ok) {
      throw new Error(`Failed to load moves database: ${response.statusText}`);
    }
    
    movesCache = await response.json();
    return movesCache!;
  } catch (error) {
    console.error('Error loading moves database:', error);
    throw error;
  }
}

/**
 * Convert optimized move references to full move objects
 */
export function expandMoves(optimizedMoves: OptimizedMoves, movesDatabase: MovesDatabase): FullMoves {
  const expanded: FullMoves = {};
  
  if (optimizedMoves.fast && movesDatabase[optimizedMoves.fast]) {
    expanded.fast = movesDatabase[optimizedMoves.fast];
  }
  
  if (optimizedMoves.charge1 && movesDatabase[optimizedMoves.charge1]) {
    expanded.charge1 = movesDatabase[optimizedMoves.charge1];
  }
  
  if (optimizedMoves.charge2 && movesDatabase[optimizedMoves.charge2]) {
    expanded.charge2 = movesDatabase[optimizedMoves.charge2];
  }
  
  return expanded;
}

/**
 * Get a specific move by ID
 */
export function getMove(moveId: string, movesDatabase: MovesDatabase): Move | null {
  return movesDatabase[moveId] || null;
}

/**
 * Get all moves of a specific type
 */
export function getMovesByType(type: string, movesDatabase: MovesDatabase): Move[] {
  return Object.values(movesDatabase).filter(move => 
    move.type.toLowerCase() === type.toLowerCase()
  );
}

/**
 * Get all moves of a specific category
 */
export function getMovesByCategory(category: "fast" | "charge", movesDatabase: MovesDatabase): Move[] {
  return Object.values(movesDatabase).filter(move => move.category === category);
}

/**
 * Calculate STAB (Same Type Attack Bonus) for moves
 */
export function calculateSTAB(moves: FullMoves, pokemonTypes: string[]): {
  fast: boolean;
  charge1: boolean;
  charge2: boolean;
} {
  const normalizedTypes = pokemonTypes.map(t => t.toLowerCase());
  
  return {
    fast: moves.fast ? normalizedTypes.includes(moves.fast.type.toLowerCase()) : false,
    charge1: moves.charge1 ? normalizedTypes.includes(moves.charge1.type.toLowerCase()) : false,
    charge2: moves.charge2 ? normalizedTypes.includes(moves.charge2.type.toLowerCase()) : false,
  };
}

/**
 * Calculate moveset statistics
 */
export function calculateMovesetStats(moves: FullMoves, pokemonTypes: string[] = []) {
  if (!moves.fast || !moves.charge1) return null;

  const fast = moves.fast;
  const charge1 = moves.charge1;
  const charge2 = moves.charge2;

  // Calculate basic stats
  const turnsToCharge1 = charge1.energyCost ? Math.ceil(charge1.energyCost / (fast.energyGain || 1)) : null;
  const turnsToCharge2 = charge2?.energyCost ? Math.ceil(charge2.energyCost / (fast.energyGain || 1)) : null;

  // Calculate DPS and EPS
  const fastDPS = fast.power / (fast.turns || 1);
  const fastEPS = (fast.energyGain || 0) / (fast.turns || 1);

  // Calculate charge move efficiency (damage per energy)
  const charge1DPE = charge1.energyCost ? charge1.power / charge1.energyCost : 0;
  const charge2DPE = charge2?.energyCost ? charge2.power / charge2.energyCost : 0;

  // Calculate STAB
  const stab = calculateSTAB(moves, pokemonTypes);

  return {
    turnsToCharge1,
    turnsToCharge2,
    fastDPS: Math.round(fastDPS * 100) / 100,
    fastEPS: Math.round(fastEPS * 100) / 100,
    charge1DPE: Math.round(charge1DPE * 1000) / 1000,
    charge2DPE: Math.round(charge2DPE * 1000) / 1000,
    hasSecondCharge: !!charge2,
    stab
  };
}
