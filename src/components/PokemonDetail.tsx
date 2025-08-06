import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Pokemon } from '../types/Pokemon';
import { loadPokemonData, loadSpriteMap } from '../utils/dataLoader';
import {
  findPokemonByIdOrSlug,
  getDisplayName,
  getTrashabilityColor,
  getTypeColor
} from '../utils/pokemonUtils';
import { PokemonMovesetAnalysis } from './PokemonMovesetAnalysis';
import { PokemonCompetitiveContext } from './PokemonCompetitiveContext';
import { PokemonPerformanceComparison } from './PokemonPerformanceComparison';

const PokemonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [pokemonData, setPokemonData] = useState<Pokemon[]>([]);
  const [spriteMap, setSpriteMap] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDynamaxData, setShowDynamaxData] = useState(false);

  // Utility function to format move names
  const formatMoveName = (moveName: string) => {
    if (!moveName) return '';
    // Remove prefixes like 'fast_' or 'charge_' and replace underscores with spaces
    return moveName
      .replace(/^(fast_|charge_)/, '')
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Utility function to get appropriate tag colors based on content
  const getTagColor = (tag: string) => {
    const tagLower = tag.toLowerCase();

    // Performance/Power related tags
    if (tagLower.includes('high dps') || tagLower.includes('powerful') || tagLower.includes('elite') || tagLower.includes('top tier') ||
        tagLower.includes('strong') || tagLower.includes('damage') || tagLower.includes('attacker') || tagLower.includes('dps')) {
      return 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700';
    }

    // Defensive/Tanky tags
    if (tagLower.includes('bulky') || tagLower.includes('tank') || tagLower.includes('defensive') || tagLower.includes('wall') ||
        tagLower.includes('defender') || tagLower.includes('sturdy') || tagLower.includes('durable') || tagLower.includes('tough')) {
      return 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700';
    }

    // Speed/Fast tags
    if (tagLower.includes('fast') || tagLower.includes('quick') || tagLower.includes('speedy') || tagLower.includes('agile') ||
        tagLower.includes('swift') || tagLower.includes('rapid')) {
      return 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700';
    }

    // Reliable/Consistent tags
    if (tagLower.includes('reliable') || tagLower.includes('consistent') || tagLower.includes('stable') || tagLower.includes('solid') ||
        tagLower.includes('dependable') || tagLower.includes('steady') || tagLower.includes('safe')) {
      return 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700';
    }

    // Meta/Popular tags
    if (tagLower.includes('meta') || tagLower.includes('popular') || tagLower.includes('common') || tagLower.includes('staple') ||
        tagLower.includes('mainstream') || tagLower.includes('standard') || tagLower.includes('core')) {
      return 'bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700';
    }

    // Niche/Spice tags
    if (tagLower.includes('niche') || tagLower.includes('spice') || tagLower.includes('unique') || tagLower.includes('specialist') ||
        tagLower.includes('situational') || tagLower.includes('specific') || tagLower.includes('tech') || tagLower.includes('counter')) {
      return 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700';
    }

    // Support/Utility tags
    if (tagLower.includes('support') || tagLower.includes('utility') || tagLower.includes('versatile') || tagLower.includes('flexible') ||
        tagLower.includes('multi-role') || tagLower.includes('adaptable') || tagLower.includes('helper')) {
      return 'bg-teal-100 dark:bg-teal-800 text-teal-800 dark:text-teal-200 border-teal-300 dark:border-teal-700';
    }

    // Glass Cannon/Fragile tags
    if (tagLower.includes('glass cannon') || tagLower.includes('fragile') || tagLower.includes('squishy') ||
        tagLower.includes('frail') || tagLower.includes('vulnerable')) {
      return 'bg-pink-100 dark:bg-pink-800 text-pink-800 dark:text-pink-200 border-pink-300 dark:border-pink-700';
    }

    // Energy/Charge related tags
    if (tagLower.includes('energy') || tagLower.includes('charge') || tagLower.includes('bait') || tagLower.includes('pressure')) {
      return 'bg-indigo-100 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 border-indigo-300 dark:border-indigo-700';
    }

    // Budget/Accessible tags
    if (tagLower.includes('budget') || tagLower.includes('accessible') || tagLower.includes('cheap') || tagLower.includes('f2p')) {
      return 'bg-emerald-100 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700';
    }

    // Default color for unmatched tags
    return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-700';
  };

  useEffect(() => {
    const loadPokemon = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Load Pokemon data and sprite map
        const [loadedPokemonData, spriteMapData] = await Promise.all([
          loadPokemonData(),
          loadSpriteMap()
        ]);
        setPokemonData(loadedPokemonData);
        setSpriteMap(spriteMapData);

        // Find Pokemon by ID or slug using utility function
        const foundPokemon = findPokemonByIdOrSlug(loadedPokemonData, id);
        setPokemon(foundPokemon || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Pokemon data');
        console.error('Error loading Pokemon data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPokemon();
  }, [id]);

  // Get sprite URL for Pokemon (same logic as PokemonTable)
  const getSpriteUrl = (pokemon: Pokemon): string => {
    const { name, base, form } = pokemon;

    // Try multiple lookup strategies
    const lookupKeys = [name, base];
    const formKeys = [form, form === "normal" ? "" : form, form === "Normal" ? "" : form];

    for (const key of lookupKeys) {
      if (spriteMap[key]) {
        for (const formKey of formKeys) {
          if (spriteMap[key][formKey]) {
            return spriteMap[key][formKey];
          }
        }
      }
    }

    // Fallback: try to construct a basic PokeAPI URL using the ID
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`;
  };

  // Helper functions to get display data based on toggle state
  const getDisplayTrashability = () => {
    if (!pokemon) return '';
    if (showDynamaxData && pokemon.dynamax) {
      return pokemon.trashability; // Show dynamax trashability
    }
    if (pokemon.dynamax && pokemon.regularTrashability) {
      return pokemon.regularTrashability; // Show regular trashability for dynamax Pokemon
    }
    return pokemon.trashability; // Fallback for non-dynamax Pokemon
  };

  const getDisplayRecommendedCount = () => {
    if (!pokemon) return 0;
    if (showDynamaxData && pokemon.dynamax) {
      return pokemon.recommendedCount; // Show dynamax recommendedCount
    }
    if (pokemon.dynamax && pokemon.regularRecommendedCount !== undefined) {
      return pokemon.regularRecommendedCount; // Show regular recommendedCount for dynamax Pokemon
    }
    return pokemon.recommendedCount; // Fallback for non-dynamax Pokemon
  };

  const getDisplayAIData = () => {
    if (!pokemon) return { tags: [], summary: '', notes: '', hasData: false };
    if (showDynamaxData && pokemon.dynamax) {
      const hasDynamaxData = !!(pokemon.dynamaxRoleSummary || pokemon.dynamaxKeyTags?.length);
      return {
        tags: pokemon.dynamaxKeyTags || pokemon.keyTags || [],
        summary: pokemon.dynamaxRoleSummary || pokemon.roleSummary || '',
        notes: pokemon.dynamaxNotes || pokemon.notes || '',
        hasData: hasDynamaxData || !!(pokemon.roleSummary)
      };
    }
    return {
      tags: pokemon.keyTags || [],
      summary: pokemon.roleSummary || '',
      notes: pokemon.notes || '',
      hasData: !!(pokemon.roleSummary)
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Pokemon data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Failed to Load Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <Link
              to="/"
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Pokemon Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            The Pokemon you're looking for doesn't exist or has been removed.
          </p>
          <Link 
            to="/" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Pokemon List
          </Link>
        </div>
      </div>
    );
  }

  // Get display name for the Pokemon
  const isShadow = pokemon?.name.includes("Shadow") || false;
  const form = pokemon?.form === "Normal" ? "" : pokemon?.form || "";
  const displayName = pokemon ? getDisplayName(pokemon.base, form, isShadow) : "";

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <li>
            <Link
              to="/"
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Pokemon List
            </Link>
          </li>
          <li>
            <span className="mx-2">/</span>
          </li>
          <li className="text-gray-900 dark:text-gray-100 font-medium">
            {displayName}
          </li>
        </ol>
      </nav>

      {/* Dynamax Toggle (only show for Dynamax Pokemon) */}
      {pokemon.dynamax && (
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDynamaxData(false)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                !showDynamaxData
                  ? "bg-blue-500 text-white border-blue-600 shadow-md"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              📋 Regular Data
            </button>
            <button
              onClick={() => setShowDynamaxData(true)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                showDynamaxData
                  ? "bg-purple-500 text-white border-purple-600 shadow-md"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              🔥 Dynamax Data
            </button>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {showDynamaxData ? "Showing Max Battle performance" : "Showing regular Pokemon performance"}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Pokemon Image */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center p-2">
              {pokemon && (
                <img
                  src={getSpriteUrl(pokemon)}
                  alt={`${displayName} sprite`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    // Fallback to placeholder if image fails to load
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling!.style.display = 'flex';
                  }}
                />
              )}
              <div className="w-full h-full flex items-center justify-center text-4xl" style={{ display: 'none' }}>
                🔮
              </div>
            </div>
          </div>
          
          {/* Pokemon Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-3">
              {displayName}
              {pokemon.dynamax && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  showDynamaxData
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700'
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700'
                }`}>
                  {showDynamaxData ? '🔥 Dynamax Mode' : '📋 Regular Mode'}
                </span>
              )}
            </h1>
            
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {/* Types */}
              {pokemon.types.map((type) => (
                <span
                  key={type}
                  className={`px-3 py-1 rounded-full text-white text-sm font-medium ${getTypeColor(type)}`}
                >
                  {type}
                </span>
              ))}
              
              {/* Form */}
              {pokemon.form !== 'normal' && (
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                  {pokemon.form}
                </span>
              )}
              
              {/* Dynamax */}
              {pokemon.dynamax && (
                <span className="px-3 py-1 bg-purple-600 text-white rounded-full text-sm font-medium">
                  Dynamax
                </span>
              )}
            </div>
            
            {/* Key Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {showDynamaxData ? 'Dynamax Trashability' : 'Trashability'}
                </div>
                <div className={`inline-block px-2 py-1 rounded text-sm font-medium mt-1 ${getTrashabilityColor(getDisplayTrashability())}`}>
                  {getDisplayTrashability()}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {showDynamaxData ? 'Dynamax Recommended' : 'Recommended'}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {getDisplayRecommendedCount()} copies
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">Candy</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {pokemon.candy}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">Pokemon ID</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  #{pokemon.id}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Role Summary */}
      {(() => {
        const aiData = getDisplayAIData();
        if (!aiData.hasData) {
          return (
            <div className={`mb-6 border rounded-lg p-4 ${
              showDynamaxData
                ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
            }`}>
              <h2 className={`text-lg font-semibold mb-2 ${
                showDynamaxData
                  ? 'text-purple-900 dark:text-purple-100'
                  : 'text-blue-900 dark:text-blue-100'
              }`}>
                {showDynamaxData ? 'Dynamax AI Analysis' : 'AI Analysis'}
              </h2>
              <p className={`text-sm ${
                showDynamaxData
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                {showDynamaxData
                  ? 'Dynamax AI analysis not yet available for this Pokemon.'
                  : 'AI analysis not yet available for this Pokemon.'}
              </p>
            </div>
          );
        }
        return aiData.summary && (
          <div className={`mb-6 border rounded-lg p-4 ${
            showDynamaxData
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          }`}>
            <h2 className={`text-lg font-semibold mb-2 ${
              showDynamaxData
                ? 'text-purple-900 dark:text-purple-100'
                : 'text-blue-900 dark:text-blue-100'
            }`}>
              {showDynamaxData ? 'Dynamax AI Analysis' : 'AI Analysis'}
            </h2>
            <p className={`mb-2 ${
              showDynamaxData
                ? 'text-purple-800 dark:text-purple-200'
                : 'text-blue-800 dark:text-blue-200'
            }`}>
              {aiData.summary}
            </p>

            {aiData.tags && aiData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {aiData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded text-xs border ${getTagColor(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* Enhanced League Performance - Only show in Regular mode */}
      {!showDynamaxData && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            PvP League Performance
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {['great', 'ultra', 'master'].map((league) => {
              const leagueData = pokemon.leagues[league as keyof typeof pokemon.leagues];
              const leagueName = league.charAt(0).toUpperCase() + league.slice(1) + ' League';
              const cpCap = league === 'great' ? '1500' : league === 'ultra' ? '2500' : '∞';

              // Determine performance tier based on score
              const getPerformanceTier = (score: number) => {
                if (score >= 90) return { tier: 'Meta', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
                if (score >= 80) return { tier: 'Strong', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' };
                if (score >= 70) return { tier: 'Viable', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
                if (score >= 60) return { tier: 'Niche', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-900/20' };
                return { tier: 'Poor', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' };
              };

              const performanceTier = leagueData?.score ? getPerformanceTier(leagueData.score) : null;

              return (
                <div key={league} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* League Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {leagueName}
                      </h3>
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        CP ≤ {cpCap}
                      </span>
                    </div>
                    {performanceTier && (
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${performanceTier.bg} ${performanceTier.color}`}>
                        {performanceTier.tier} Tier
                      </div>
                    )}
                  </div>

                  {/* League Content */}
                  <div className="p-6">
                    {leagueData ? (
                      <div className="space-y-4">
                        {/* Score and Rating */}
                        <div className="grid grid-cols-2 gap-4">
                          {leagueData.score && (
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Performance Score</div>
                              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {leagueData.score.toFixed(1)}
                                <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">/100</span>
                              </div>
                            </div>
                          )}

                          {leagueData.rating && (
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Overall Rating</div>
                              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {leagueData.rating}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Stats Breakdown */}
                        {leagueData.stats && (
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Optimal Stats</div>
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400">ATK</div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                  {leagueData.stats.atk.toFixed(1)}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400">DEF</div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                  {leagueData.stats.def.toFixed(1)}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-gray-500 dark:text-gray-400">HP</div>
                                <div className="font-semibold text-gray-900 dark:text-gray-100">
                                  {leagueData.stats.hp}
                                </div>
                              </div>
                            </div>
                            {leagueData.stats.product && (
                              <div className="text-center mt-2">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Stat Product</div>
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  {leagueData.stats.product.toLocaleString()}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Moveset Preview */}
                        {leagueData.moves && (
                          <div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Optimal Moveset</div>
                            <div className="space-y-1">
                              {leagueData.moves.fast && (
                                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 rounded px-2 py-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded font-medium">
                                      Fast
                                    </span>
                                    <span className="text-gray-900 dark:text-gray-100 font-medium text-xs">
                                      {formatMoveName(leagueData.moves.fast)}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {leagueData.moves.charge1 && (
                                <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 rounded px-2 py-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded font-medium">
                                      Charge
                                    </span>
                                    <span className="text-gray-900 dark:text-gray-100 font-medium text-xs">
                                      {formatMoveName(leagueData.moves.charge1)}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {leagueData.moves.charge2 && (
                                <div className="flex items-center justify-between bg-purple-50 dark:bg-purple-900/20 rounded px-2 py-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-0.5 rounded font-medium">
                                      Charge
                                    </span>
                                    <span className="text-gray-900 dark:text-gray-100 font-medium text-xs">
                                      {formatMoveName(leagueData.moves.charge2)}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Performance Indicators */}
                        {leagueData.movesetStats && (
                          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">Move Performance</div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Fast DPS:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100 ml-1">
                                  {leagueData.movesetStats.fastDPS.toFixed(1)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Fast EPS:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100 ml-1">
                                  {leagueData.movesetStats.fastEPS.toFixed(1)}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 dark:text-gray-400 text-center py-8">
                        <div className="text-sm">No {leagueName.toLowerCase()} data available</div>
                        <div className="text-xs mt-1">This Pokemon may not be viable in this league</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Type Effectiveness & Weakness Analysis - Only show in Regular mode */}
      {!showDynamaxData && pokemon.weaknessAnalysis && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              🛡️ Defensive Analysis
            </h3>
            <div className="flex items-center gap-4 mt-2">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                pokemon.weaknessAnalysis.defensiveRating === 'Excellent'
                  ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                  : pokemon.weaknessAnalysis.defensiveRating === 'Good'
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                  : pokemon.weaknessAnalysis.defensiveRating === 'Average'
                  ? 'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200'
                  : pokemon.weaknessAnalysis.defensiveRating === 'Poor'
                  ? 'bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200'
                  : 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
              }`}>
                {pokemon.weaknessAnalysis.defensiveRating} Defense
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Net Score: <span className="font-medium">{pokemon.weaknessAnalysis.netDefensiveScore}</span>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Major Weaknesses */}
              <div>
                <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                  ⚠️ Major Weaknesses ({pokemon.weaknessAnalysis.weaknessCount} total)
                </h4>
                {pokemon.weaknessAnalysis.majorWeaknesses.length > 0 ? (
                  <div className="space-y-2">
                    {pokemon.weaknessAnalysis.majorWeaknesses.slice(0, 5).map((weakness, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-white text-xs font-medium ${getTypeColor(weakness.type)}`}>
                            {weakness.type}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {weakness.effectiveness}x damage
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {weakness.usage.toFixed(1)}% meta usage
                          </div>
                          <div className="text-sm font-medium text-red-600 dark:text-red-400">
                            Impact: {weakness.impact.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {pokemon.weaknessAnalysis.majorWeaknesses.length > 5 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{pokemon.weaknessAnalysis.majorWeaknesses.length - 5} more weaknesses
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No major weaknesses to common meta types
                  </div>
                )}
              </div>

              {/* Major Resistances */}
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2">
                  🛡️ Major Resistances ({pokemon.weaknessAnalysis.resistanceCount} total)
                </h4>
                {pokemon.weaknessAnalysis.majorResistances.length > 0 ? (
                  <div className="space-y-2">
                    {pokemon.weaknessAnalysis.majorResistances.slice(0, 5).map((resistance, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-white text-xs font-medium ${getTypeColor(resistance.type)}`}>
                            {resistance.type}
                          </span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {resistance.effectiveness}x damage
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {resistance.usage.toFixed(1)}% meta usage
                          </div>
                          <div className="text-sm font-medium text-green-600 dark:text-green-400">
                            Benefit: {resistance.benefit.toFixed(1)}
                          </div>
                        </div>
                      </div>
                    ))}
                    {pokemon.weaknessAnalysis.majorResistances.length > 5 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                        +{pokemon.weaknessAnalysis.majorResistances.length - 5} more resistances
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                    No major resistances to common meta types
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Defensive Summary:</strong> This Pokemon has a{' '}
                <span className="font-medium">{pokemon.weaknessAnalysis.defensiveRating.toLowerCase()}</span> defensive profile
                {pokemon.weaknessAnalysis.hasHighImpactWeaknesses && (
                  <span className="text-red-600 dark:text-red-400"> with significant vulnerabilities to meta threats</span>
                )}
                {pokemon.weaknessAnalysis.hasHighBenefitResistances && (
                  <span className="text-green-600 dark:text-green-400"> and valuable resistances to common attacks</span>
                )}.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Moveset Analysis - Only show in Regular mode */}
      {!showDynamaxData && (
        <PokemonMovesetAnalysis pokemon={pokemon} />
      )}

      {/* Dynamax Battle Performance - Only show in Dynamax mode */}
      {showDynamaxData && (
        <div className="mb-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
            🔥 Max Battle Performance
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Effective Against Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                ⚔️ Effective Against
              </h4>

              {/* Type-Specific Counters */}
              {(pokemon as any).typeSpecificCounters && (pokemon as any).typeSpecificCounters.length > 0 && (
                <div className="mb-4">
                  {(pokemon as any).typeSpecificCounters.map((typeData: any, index: number) => (
                    <div key={index} className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-white text-xs font-medium ${getTypeColor(typeData.moveType)}`}>
                          {typeData.moveType}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Counters:</span>
                      </h5>
                      <div className="space-y-2">
                        {typeData.counters.map((target: any, counterIndex: number) => (
                          <div key={counterIndex} className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                            <div className="flex flex-col">
                              <span className="font-medium text-green-800 dark:text-green-200">
                                {target.name}
                              </span>
                              {target.moveInfo && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {target.moveInfo.moveName}
                                  </span>
                                  <span className={`px-1.5 py-0.5 rounded text-white text-xs font-medium ${getTypeColor(target.moveInfo.moveType)}`}>
                                    {target.moveInfo.moveType}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs">
                                {target.difficulty}★
                              </span>
                              <span className="text-xs text-green-600 dark:text-green-400">
                                {target.effectiveness === 'super-effective' ? '2x' : '1x'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}


            </div>

            {/* Counters Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                ⚔️ Counters
              </h4>
              {pokemon.maxBattleVulnerableTo && pokemon.maxBattleVulnerableTo.filter(counter => !counter.difficulty || counter.difficulty >= 3).length > 0 ? (
                <div className="space-y-2">
                  {pokemon.maxBattleVulnerableTo.filter(counter => !counter.difficulty || counter.difficulty >= 3).map((counter, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                      <div className="flex flex-col">
                        <span className="font-medium text-red-800 dark:text-red-200">
                          {counter.name}
                        </span>
                        {(counter as any).moveInfo && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {(counter as any).moveInfo.moveName}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-white text-xs font-medium ${getTypeColor((counter as any).moveInfo.moveType)}`}>
                              {(counter as any).moveInfo.moveType}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                          {counter.role}
                        </span>
                        <span className="text-xs text-red-600 dark:text-red-400">
                          {counter.effectiveness === 'super-effective' ? '2x' : '1x'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  No specific Max Battle counter data available. Check type weaknesses for general guidance.
                </div>
              )}
            </div>

            {/* Fast Move Recommendations Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                ⚡ Fastest Moves by Type
              </h4>
              {pokemon.dynamaxFastMoves && pokemon.dynamaxFastMoves.length > 0 ? (
                <div className="space-y-2">
                  {pokemon.dynamaxFastMoves.map((move, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <span className="font-medium text-blue-800 dark:text-blue-200">
                        {move.moveName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-white text-xs font-medium ${getTypeColor(move.type)}`}>
                          {move.type}
                        </span>
                        {move.stab && (
                          <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 rounded text-xs font-medium">
                            STAB
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No fast move recommendations available
                </p>
              )}
            </div>
          </div>

          {/* Max Moves & Strategy Section */}
          <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              💥 Max Moves & Strategy
            </h4>

            {pokemon.maxMoveRecommendations && pokemon.maxMoveRecommendations.length > 0 ? (
              <div className="space-y-4">
                {/* Dynamax Role */}
                {pokemon.dynamaxRole && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-purple-900 dark:text-purple-100">
                        🎭 Optimal Role: {pokemon.dynamaxRole.primary}
                        {pokemon.dynamaxRole.secondary && ` / ${pokemon.dynamaxRole.secondary}`}
                      </span>
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded text-xs">
                        {pokemon.dynamaxRole.confidence}% confidence
                      </span>
                    </div>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                      {pokemon.dynamaxRole.reasoning}
                    </p>
                  </div>
                )}

                {/* Max Move Recommendations */}
                <div>
                  <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Recommended Max Moves:</h5>
                  <div className="grid grid-cols-1 gap-3">
                    {pokemon.maxMoveRecommendations.map((move, index) => (
                      <div key={index} className={`p-3 rounded-lg border ${
                        move.priority === 'Primary'
                          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                          : move.priority === 'Secondary'
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {move.moveName}
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              move.category === 'Attack'
                                ? 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
                                : move.category === 'Guard'
                                ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                                : 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                            }`}>
                              {move.category}
                            </span>
                            {move.moveType !== 'Support' && (
                              <span className={`px-2 py-1 rounded text-xs text-white ${getTypeColor(move.moveType)}`}>
                                {move.moveType}
                              </span>
                            )}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${
                            move.priority === 'Primary'
                              ? 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                              : move.priority === 'Secondary'
                              ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                              : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                          }`}>
                            {move.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {move.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Max Move analysis will be available after running the data pipeline. This Pokemon's optimal moves and role will be determined based on stats, typing, and battle effectiveness.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Raid Performance - Only show in Regular mode */}
      {!showDynamaxData && pokemon.bestTypes && pokemon.bestTypes.length > 0 && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              ⚔️ Raid Attack Performance
            </h3>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Damage output analysis for raid battles
            </div>
          </div>

          <div className="p-6">
            {/* Type Coverage Overview */}
            <div className="mb-6">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Type Coverage ({pokemon.bestTypes.length} type{pokemon.bestTypes.length !== 1 ? 's' : ''})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pokemon.bestTypes.map((typeData, index) => {
                  // Determine performance tier based on rank
                  const getPerformanceTier = (rank: number) => {
                    if (rank <= 3) return { tier: 'Elite', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800' };
                    if (rank <= 10) return { tier: 'Top Tier', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800' };
                    if (rank <= 25) return { tier: 'Strong', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800' };
                    if (rank <= 50) return { tier: 'Viable', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800' };
                    return { tier: 'Niche', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20', border: 'border-gray-200 dark:border-gray-800' };
                  };

                  const performanceTier = getPerformanceTier(typeData.rank);
                  const isSTAB = pokemon.types.includes(typeData.type);

                  return (
                    <div key={index} className={`rounded-lg p-4 border ${performanceTier.bg} ${performanceTier.border}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-white text-sm font-medium ${getTypeColor(typeData.type)}`}>
                            {typeData.type}
                          </span>
                          {isSTAB && (
                            <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                              STAB
                            </span>
                          )}
                        </div>
                        <div className={`text-xs font-medium px-2 py-1 rounded ${performanceTier.bg} ${performanceTier.color}`}>
                          {performanceTier.tier}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">DPS</span>
                          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {typeData.score}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Global Rank</span>
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            #{typeData.rank}
                          </span>
                        </div>
                        {isSTAB && (
                          <div className="text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 px-2 py-1 rounded">
                            +25% STAB bonus included
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Raid Utility Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Performance Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Best Type:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {pokemon.bestTypes[0]?.type} (#{pokemon.bestTypes[0]?.rank})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Peak DPS:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {pokemon.bestTypes[0]?.score}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Type Coverage:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {pokemon.bestTypes.length} type{pokemon.bestTypes.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">STAB Types:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {pokemon.bestTypes.filter(t => pokemon.types.includes(t.type)).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Raid Recommendations */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">Raid Recommendations</h4>
                <div className="space-y-2 text-sm">
                  {pokemon.bestTypes[0]?.rank <= 10 ? (
                    <div className="text-green-700 dark:text-green-300">
                      ✅ <strong>Excellent</strong> raid attacker for {pokemon.bestTypes[0]?.type}-type raids
                    </div>
                  ) : pokemon.bestTypes[0]?.rank <= 25 ? (
                    <div className="text-blue-700 dark:text-blue-300">
                      ✅ <strong>Strong</strong> raid option for {pokemon.bestTypes[0]?.type}-type coverage
                    </div>
                  ) : pokemon.bestTypes[0]?.rank <= 50 ? (
                    <div className="text-yellow-700 dark:text-yellow-300">
                      ⚠️ <strong>Viable</strong> budget option for {pokemon.bestTypes[0]?.type}-type raids
                    </div>
                  ) : (
                    <div className="text-gray-700 dark:text-gray-300">
                      ℹ️ <strong>Niche</strong> use for specific {pokemon.bestTypes[0]?.type}-type scenarios
                    </div>
                  )}

                  {pokemon.bestTypes.length > 1 && (
                    <div className="text-blue-700 dark:text-blue-300">
                      🔄 Versatile attacker with {pokemon.bestTypes.length} type coverage options
                    </div>
                  )}

                  {pokemon.bestTypes.filter(t => pokemon.types.includes(t.type)).length > 0 && (
                    <div className="text-purple-700 dark:text-purple-300">
                      ⭐ Benefits from STAB bonus on {pokemon.bestTypes.filter(t => pokemon.types.includes(t.type)).length} type{pokemon.bestTypes.filter(t => pokemon.types.includes(t.type)).length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Competitive Context & Rankings - Only show in Regular mode */}
      {!showDynamaxData && (
        <PokemonCompetitiveContext pokemon={pokemon} />
      )}

      {/* Performance Comparison - Only show in Regular mode */}
      {!showDynamaxData && (
        <PokemonPerformanceComparison pokemon={pokemon} />
      )}

      {/* Tier Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {!showDynamaxData && pokemon.raidTier && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Raid Tier
            </h3>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {pokemon.raidTier}
            </div>
          </div>
        )}

        {!showDynamaxData && pokemon.defenderTier && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Defender Tier
            </h3>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {pokemon.defenderTier}
            </div>
          </div>
        )}
      </div>

      {/* Evolution Information */}
      {(pokemon.base !== pokemon.name || pokemon.candy !== pokemon.name) && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Evolution Information
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {pokemon.base !== pokemon.name && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Base Form</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {pokemon.base}
                </div>
              </div>
            )}
            {pokemon.candy !== pokemon.name && (
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Candy Type</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {pokemon.candy}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related Pokemon */}
      {(() => {
        const relatedPokemon = pokemonData.filter(p =>
          p.base === pokemon.base && p.id !== pokemon.id
        );

        if (relatedPokemon.length > 0) {
          return (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Other Forms of {pokemon.base}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {relatedPokemon.map((relatedMon) => {
                  const relatedIsShadow = relatedMon.name.includes("Shadow");
                  const relatedForm = relatedMon.form === "Normal" ? "" : relatedMon.form;
                  const relatedDisplayName = getDisplayName(relatedMon.base, relatedForm, relatedIsShadow);

                  return (
                    <Link
                      key={relatedMon.id}
                      to={`/pokemon/${relatedMon.id}`}
                      className="block p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                        {relatedDisplayName}
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTrashabilityColor(relatedMon.trashability)}`}>
                          {relatedMon.trashability}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {relatedMon.recommendedCount} copies
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Navigation */}
      <div className="flex justify-center">
        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          ← Back to Pokemon List
        </Link>
      </div>
    </div>
  );
};

export default PokemonDetail;
