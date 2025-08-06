import React, { useState, useEffect } from 'react';
import { Pokemon } from '../types/Pokemon';
import { loadPokemonData } from '../utils/dataLoader';
import { getTrashabilityColor, getTypeColor } from '../utils/pokemonUtils';

interface PokemonPerformanceComparisonProps {
  pokemon: Pokemon;
}

export const PokemonPerformanceComparison: React.FC<PokemonPerformanceComparisonProps> = ({ pokemon }) => {
  const [allPokemon, setAllPokemon] = useState<Pokemon[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparisonType, setComparisonType] = useState<'type' | 'tier' | 'role'>('type');

  useEffect(() => {
    loadPokemonData()
      .then(setAllPokemon)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading comparison data...</div>;

  // Get comparison Pokemon based on selected type
  const getComparisonPokemon = () => {
    let filtered: Pokemon[] = [];

    switch (comparisonType) {
      case 'type':
        // Find Pokemon that share at least one type
        filtered = allPokemon.filter(p => 
          p.id !== pokemon.id && 
          p.types.some(type => pokemon.types.includes(type))
        );
        break;
      case 'tier':
        // Find Pokemon in the same trashability tier
        filtered = allPokemon.filter(p => 
          p.id !== pokemon.id && 
          p.trashability === pokemon.trashability
        );
        break;
      case 'role':
        // Find Pokemon with similar roles (if available)
        const currentRole = pokemon.quickRole || pokemon.roleSummary;
        if (currentRole) {
          filtered = allPokemon.filter(p => 
            p.id !== pokemon.id && 
            (p.quickRole === pokemon.quickRole || 
             (p.roleSummary && currentRole && p.roleSummary.includes(currentRole.split(' ')[0])))
          );
        }
        break;
    }

    // Sort by best overall performance and limit to top 5
    return filtered
      .sort((a, b) => {
        const aMaxScore = Math.max(...Object.values(a.leagues).map(l => l?.score || 0));
        const bMaxScore = Math.max(...Object.values(b.leagues).map(l => l?.score || 0));
        return bMaxScore - aMaxScore;
      })
      .slice(0, 5);
  };

  const comparisonPokemon = getComparisonPokemon();

  // Calculate relative performance metrics
  const getRelativePerformance = (targetPokemon: Pokemon) => {
    const currentMaxScore = Math.max(...Object.values(pokemon.leagues).map(l => l?.score || 0));
    const targetMaxScore = Math.max(...Object.values(targetPokemon.leagues).map(l => l?.score || 0));
    
    return {
      scoreDifference: targetMaxScore - currentMaxScore,
      trashabilityComparison: getTrashabilityRank(targetPokemon.trashability) - getTrashabilityRank(pokemon.trashability),
      recommendedCountDiff: targetPokemon.recommendedCount - pokemon.recommendedCount
    };
  };

  const getTrashabilityRank = (tier: string) => {
    const ranks = { 'Essential': 6, 'Valuable': 5, 'Reliable': 4, 'Useful': 3, 'Niche': 2, 'Trash': 1 };
    return ranks[tier as keyof typeof ranks] || 0;
  };

  const renderComparisonCard = (compPokemon: Pokemon) => {
    const performance = getRelativePerformance(compPokemon);
    const maxScore = Math.max(...Object.values(compPokemon.leagues).map(l => l?.score || 0));
    
    return (
      <div key={compPokemon.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
              {compPokemon.name}
            </h5>
            <div className="flex gap-1">
              {compPokemon.types.map(type => (
                <span key={type} className={`text-xs text-white px-1 py-0.5 rounded ${getTypeColor(type)}`}>
                  {type}
                </span>
              ))}
            </div>
          </div>
          <span className={`text-xs px-2 py-1 rounded ${getTrashabilityColor(compPokemon.trashability)}`}>
            {compPokemon.trashability}
          </span>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Best Score:</span>
            <span className={`font-medium ${
              performance.scoreDifference > 0 
                ? 'text-green-600 dark:text-green-400' 
                : performance.scoreDifference < 0 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {maxScore.toFixed(1)}
              {performance.scoreDifference !== 0 && (
                <span className="ml-1">
                  ({performance.scoreDifference > 0 ? '+' : ''}{performance.scoreDifference.toFixed(1)})
                </span>
              )}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Recommended:</span>
            <span className={`font-medium ${
              performance.recommendedCountDiff > 0 
                ? 'text-green-600 dark:text-green-400' 
                : performance.recommendedCountDiff < 0 
                ? 'text-red-600 dark:text-red-400' 
                : 'text-gray-900 dark:text-gray-100'
            }`}>
              {compPokemon.recommendedCount}
              {performance.recommendedCountDiff !== 0 && (
                <span className="ml-1">
                  ({performance.recommendedCountDiff > 0 ? '+' : ''}{performance.recommendedCountDiff})
                </span>
              )}
            </span>
          </div>

          {/* League comparison */}
          <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-3 gap-1 text-xs">
              {['great', 'ultra', 'master'].map(league => {
                const currentScore = pokemon.leagues[league as keyof typeof pokemon.leagues]?.score || 0;
                const compScore = compPokemon.leagues[league as keyof typeof compPokemon.leagues]?.score || 0;
                const diff = compScore - currentScore;
                
                return (
                  <div key={league} className="text-center">
                    <div className="text-gray-500 dark:text-gray-400 capitalize">{league.slice(0,3)}</div>
                    <div className={`font-medium ${
                      diff > 5 ? 'text-green-600 dark:text-green-400' :
                      diff < -5 ? 'text-red-600 dark:text-red-400' :
                      'text-gray-700 dark:text-gray-300'
                    }`}>
                      {compScore.toFixed(0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          📊 Performance Comparison
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Compare with similar Pokemon in the meta
        </div>
      </div>

      <div className="p-6">
        {/* Comparison Type Selector */}
        <div className="mb-6">
          <div className="flex gap-2">
            {[
              { key: 'type', label: 'Same Type', icon: '🔥' },
              { key: 'tier', label: 'Same Tier', icon: '🏆' },
              { key: 'role', label: 'Same Role', icon: '⚔️' }
            ].map(option => (
              <button
                key={option.key}
                onClick={() => setComparisonType(option.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  comparisonType === option.key
                    ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-600'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {option.icon} {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Current Pokemon Summary */}
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            {pokemon.name} (Current)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-blue-600 dark:text-blue-400">Best Score</div>
              <div className="font-bold text-blue-900 dark:text-blue-100">
                {Math.max(...Object.values(pokemon.leagues).map(l => l?.score || 0)).toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-blue-600 dark:text-blue-400">Tier</div>
              <div className="font-bold text-blue-900 dark:text-blue-100">
                {pokemon.trashability}
              </div>
            </div>
            <div>
              <div className="text-blue-600 dark:text-blue-400">Recommended</div>
              <div className="font-bold text-blue-900 dark:text-blue-100">
                {pokemon.recommendedCount}
              </div>
            </div>
            <div>
              <div className="text-blue-600 dark:text-blue-400">Types</div>
              <div className="flex gap-1">
                {pokemon.types.map(type => (
                  <span key={type} className={`text-xs text-white px-1 py-0.5 rounded ${getTypeColor(type)}`}>
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Comparison Results */}
        {comparisonPokemon.length > 0 ? (
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Similar Pokemon ({comparisonType === 'type' ? 'Shared Types' : comparisonType === 'tier' ? 'Same Tier' : 'Similar Role'})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {comparisonPokemon.map(renderComparisonCard)}
            </div>
            
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              * Numbers in parentheses show difference compared to {pokemon.name}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-lg mb-2">🔍</div>
            <div>No comparable Pokemon found for the selected criteria</div>
            <div className="text-sm mt-1">Try a different comparison type</div>
          </div>
        )}
      </div>
    </div>
  );
};
