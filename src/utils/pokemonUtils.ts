import { Pokemon } from '../types/Pokemon';

/**
 * Generate a SEO-friendly URL slug for a Pokemon
 */
export const generatePokemonSlug = (pokemon: Pokemon): string => {
  const { name, id } = pokemon;
  
  // Create a URL-friendly version of the name
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
  
  // Include ID to ensure uniqueness (in case of duplicate names)
  return `${id}-${slug}`;
};

/**
 * Parse a Pokemon slug back to ID
 */
export const parsePokemonSlug = (slug: string): number | null => {
  const match = slug.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : null;
};

/**
 * Find Pokemon by ID or slug
 */
export const findPokemonByIdOrSlug = (pokemonList: Pokemon[], identifier: string): Pokemon | null => {
  // Try to parse as ID first
  const id = parseInt(identifier, 10);
  if (!isNaN(id)) {
    return pokemonList.find(p => p.id === id) || null;
  }
  
  // Try to parse as slug
  const parsedId = parsePokemonSlug(identifier);
  if (parsedId) {
    return pokemonList.find(p => p.id === parsedId) || null;
  }
  
  // Fallback: try to match by name (case-insensitive)
  const normalizedIdentifier = identifier.toLowerCase().replace(/-/g, ' ');
  return pokemonList.find(p => 
    p.name.toLowerCase() === normalizedIdentifier
  ) || null;
};

/**
 * Get display name for a Pokemon (handles forms and shadows)
 */
export const getDisplayName = (base: string, form: string, isShadow: boolean): string => {
  const isAlreadyShadow = form.toLowerCase().includes("shadow");
  // Don't show "normal" form in the display name
  const regionPrefix = form && form !== "Normal" && form !== "normal" ? `${form} ` : "";
  const shadowSuffix = isShadow && !isAlreadyShadow ? " (Shadow)" : "";
  return `${regionPrefix}${base}${shadowSuffix}`;
};

/**
 * Get trashability color classes
 */
export const getTrashabilityColor = (trashability: string): string => {
  const colors = {
    'Essential': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Valuable': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Reliable': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Useful': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'Niche': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Trash': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[trashability as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
};

/**
 * Get Pokemon type color classes
 */
export const getTypeColor = (type: string): string => {
  const colors = {
    'Normal': 'bg-gray-400',
    'Fire': 'bg-red-500',
    'Water': 'bg-blue-500',
    'Electric': 'bg-yellow-400',
    'Grass': 'bg-green-500',
    'Ice': 'bg-blue-300',
    'Fighting': 'bg-red-700',
    'Poison': 'bg-purple-500',
    'Ground': 'bg-yellow-600',
    'Flying': 'bg-indigo-400',
    'Psychic': 'bg-pink-500',
    'Bug': 'bg-green-400',
    'Rock': 'bg-yellow-800',
    'Ghost': 'bg-purple-700',
    'Dragon': 'bg-indigo-700',
    'Dark': 'bg-gray-800',
    'Steel': 'bg-gray-500',
    'Fairy': 'bg-pink-300',
  };
  return colors[type as keyof typeof colors] || 'bg-gray-400';
};
