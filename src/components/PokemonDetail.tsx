import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Pokemon } from '../types/Pokemon';
import { loadPokemonData } from '../utils/dataLoader';
import {
  findPokemonByIdOrSlug,
  getDisplayName,
  getTrashabilityColor,
  getTypeColor
} from '../utils/pokemonUtils';

const PokemonDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPokemon = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Load Pokemon data
        const pokemonData = await loadPokemonData();

        // Find Pokemon by ID or slug using utility function
        const foundPokemon = findPokemonByIdOrSlug(pokemonData, id);
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

      {/* Header */}
      <div className="mb-6">
        
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Pokemon Image */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <span className="text-4xl">🔮</span> {/* Placeholder - we'll add sprites later */}
            </div>
          </div>
          
          {/* Pokemon Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {displayName}
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
                <div className="text-sm text-gray-600 dark:text-gray-400">Trashability</div>
                <div className={`inline-block px-2 py-1 rounded text-sm font-medium mt-1 ${getTrashabilityColor(pokemon.trashability)}`}>
                  {pokemon.trashability}
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">Recommended</div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {pokemon.recommendedCount} copies
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
      {pokemon.roleSummary && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
            AI Analysis
          </h2>
          <p className="text-blue-800 dark:text-blue-200 mb-2">{pokemon.roleSummary}</p>
          {pokemon.quickRole && (
            <div className="text-sm">
              <span className="font-medium text-blue-900 dark:text-blue-100">Role: </span>
              <span className="text-blue-700 dark:text-blue-300">{pokemon.quickRole}</span>
            </div>
          )}
          {pokemon.keyTags && pokemon.keyTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {pokemon.keyTags.map((tag, index) => (
                <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* League Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {['great', 'ultra', 'master'].map((league) => {
          const leagueData = pokemon.leagues[league as keyof typeof pokemon.leagues];
          const leagueName = league.charAt(0).toUpperCase() + league.slice(1) + ' League';
          
          return (
            <div key={league} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {leagueName}
              </h3>
              
              {leagueData ? (
                <div className="space-y-3">
                  {leagueData.score && (
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {leagueData.score.toFixed(1)}
                      </div>
                    </div>
                  )}
                  
                  {leagueData.rating && (
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Rating</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {leagueData.rating}
                      </div>
                    </div>
                  )}
                  
                  {leagueData.stats && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">ATK</div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {leagueData.stats.atk.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">DEF</div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {leagueData.stats.def.toFixed(1)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">HP</div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {leagueData.stats.hp}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-center py-4">
                  No data available
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Raid Performance */}
      {pokemon.bestTypes && pokemon.bestTypes.length > 0 && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Raid Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pokemon.bestTypes.map((typeData, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-white text-sm font-medium ${getTypeColor(typeData.type)}`}>
                    {typeData.type}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Rank #{typeData.rank}
                  </span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {typeData.score} DPS
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tier Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {pokemon.raidTier && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Raid Tier
            </h3>
            <div className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {pokemon.raidTier}
            </div>
          </div>
        )}

        {pokemon.defenderTier && (
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

      {/* Dynamax Information */}
      {pokemon.dynamax && pokemon.dynamaxTrashability && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Dynamax Performance
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Dynamax Trashability</div>
              <div className={`inline-block px-2 py-1 rounded text-sm font-medium mt-1 ${getTrashabilityColor(pokemon.dynamaxTrashability)}`}>
                {pokemon.dynamaxTrashability}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Dynamax Recommended</div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {pokemon.dynamaxRecommendedCount} copies
              </div>
            </div>
          </div>
        </div>
      )}

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
