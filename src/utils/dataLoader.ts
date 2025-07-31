import { Pokemon } from '../types/Pokemon';

// Cache for loaded data to avoid repeated fetches
const dataCache = new Map<string, any>();

/**
 * Generic function to fetch JSON data with caching and error handling
 * @param url - The URL to fetch data from
 * @param cacheKey - Key to use for caching the data
 * @returns Promise that resolves to the parsed JSON data
 */
async function fetchJsonData<T>(url: string, cacheKey: string): Promise<T> {
  // Return cached data if available
  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey);
  }

  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache the data for future use
    dataCache.set(cacheKey, data);
    
    return data;
  } catch (error) {
    console.error(`Error loading data from ${url}:`, error);
    throw new Error(`Failed to load data from ${url}. Please check your connection and try again.`);
  }
}

/**
 * Load Pokemon data from the public API endpoint
 * @returns Promise that resolves to an array of Pokemon
 */
export async function loadPokemonData(): Promise<Pokemon[]> {
  return fetchJsonData<Pokemon[]>('/data/pokemon.json', 'pokemon');
}

/**
 * Load sprite map data from the public API endpoint
 * @returns Promise that resolves to the sprite map object
 */
export async function loadSpriteMap(): Promise<Record<string, Record<string, string>>> {
  return fetchJsonData<Record<string, Record<string, string>>>('/data/spriteMap.json', 'spriteMap');
}

/**
 * Load moves data from the public API endpoint
 * @returns Promise that resolves to the moves data object
 */
export async function loadMovesData(): Promise<Record<string, any>> {
  return fetchJsonData<Record<string, any>>('/data/moves.json', 'moves');
}

/**
 * Clear the data cache (useful for development or when data needs to be refreshed)
 */
export function clearDataCache(): void {
  dataCache.clear();
}

/**
 * Check if data is cached
 * @param cacheKey - The cache key to check
 * @returns boolean indicating if the data is cached
 */
export function isDataCached(cacheKey: string): boolean {
  return dataCache.has(cacheKey);
}
