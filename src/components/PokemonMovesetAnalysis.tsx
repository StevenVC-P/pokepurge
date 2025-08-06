import React, { useState, useEffect } from 'react';
import { Pokemon, LeagueData } from '../types/Pokemon';
import { loadMovesDatabase, expandMoves, MovesDatabase } from '../utils/moveUtils';
import { getTypeColor } from '../utils/pokemonUtils';

interface PokemonMovesetAnalysisProps {
  pokemon: Pokemon;
}

export const PokemonMovesetAnalysis: React.FC<PokemonMovesetAnalysisProps> = ({ pokemon }) => {
  const [movesDatabase, setMovesDatabase] = useState<MovesDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLeague, setExpandedLeague] = useState<string | null>(null);

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

  useEffect(() => {
    loadMovesDatabase()
      .then(setMovesDatabase)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading moveset analysis...</div>;
  if (error) return <div className="text-red-500">Error loading moves: {error}</div>;
  if (!movesDatabase) return <div className="text-gray-500">No moves data available</div>;

  const leagues = ['great', 'ultra', 'master'] as const;
  const availableLeagues = leagues.filter(league => pokemon.leagues[league]);

  if (availableLeagues.length === 0) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-center py-8">
        No moveset data available for any league
      </div>
    );
  }

  const renderMoveDetails = (move: any, label: string, isSTAB: boolean, moveStats?: any) => {
    if (!move) return null;

    return (
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{label}</h5>
            {isSTAB && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                STAB
              </span>
            )}
          </div>
          <span className={`text-xs text-white px-2 py-1 rounded font-medium ${getTypeColor(move.type)}`}>
            {move.type}
          </span>
        </div>

        <div className="mb-2">
          <div className="font-medium text-gray-900 dark:text-gray-100">{formatMoveName(move.name)}</div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Power:</span>
            <span className="font-medium text-gray-900 dark:text-gray-100 ml-1">{move.power}</span>
          </div>

          {move.energyGain && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Energy:</span>
              <span className="font-medium text-green-600 dark:text-green-400 ml-1">+{move.energyGain}</span>
            </div>
          )}

          {move.energyCost && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Cost:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400 ml-1">{move.energyCost}</span>
            </div>
          )}

          {move.turns && (
            <div>
              <span className="text-gray-600 dark:text-gray-400">Turns:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100 ml-1">{move.turns}</span>
            </div>
          )}
        </div>

        {move.buffs && (
          <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded border border-purple-200 dark:border-purple-800">
            <div className="text-xs text-purple-700 dark:text-purple-300">
              <strong>Effect:</strong> Stat changes possible
              {move.buffApplyChance && (
                <span className="ml-1">({move.buffApplyChance} chance)</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderLeagueMoveset = (league: string, leagueData: LeagueData) => {
    if (!leagueData.moves) return null;

    const fullMoves = expandMoves(leagueData.moves, movesDatabase);
    const stats = leagueData.movesetStats;
    const leagueName = league.charAt(0).toUpperCase() + league.slice(1);
    const isExpanded = expandedLeague === league;

    return (
      <div key={league} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <button
          onClick={() => setExpandedLeague(isExpanded ? null : league)}
          className="w-full px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700 text-left hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {leagueName} League Moveset
              </h4>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Score: {leagueData.score?.toFixed(1)} • Click to {isExpanded ? 'collapse' : 'expand'} details
              </div>
            </div>
            <div className="text-gray-400 dark:text-gray-500">
              {isExpanded ? '▼' : '▶'}
            </div>
          </div>
        </button>

        {isExpanded && (
          <div className="p-6">
            {/* Compact Moveset Overview */}
            <div className="mb-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
              <h5 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 text-sm flex items-center gap-2">
                ⚡ Optimal Moveset
              </h5>
              <div className="grid grid-cols-1 gap-2">
                {fullMoves.fast && (
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded px-3 py-2 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-medium">
                        Fast
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium text-sm">
                        {formatMoveName(fullMoves.fast.name)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs text-white px-2 py-1 rounded font-medium ${getTypeColor(fullMoves.fast.type)}`}>
                        {fullMoves.fast.type}
                      </span>
                      {pokemon.types.includes(fullMoves.fast.type) && (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded font-medium">
                          STAB
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {fullMoves.charge1 && (
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded px-3 py-2 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded font-medium">
                        Charge
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium text-sm">
                        {formatMoveName(fullMoves.charge1.name)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs text-white px-2 py-1 rounded font-medium ${getTypeColor(fullMoves.charge1.type)}`}>
                        {fullMoves.charge1.type}
                      </span>
                      {pokemon.types.includes(fullMoves.charge1.type) && (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded font-medium">
                          STAB
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {fullMoves.charge2 && (
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded px-3 py-2 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded font-medium">
                        Charge
                      </span>
                      <span className="text-gray-900 dark:text-gray-100 font-medium text-sm">
                        {formatMoveName(fullMoves.charge2.name)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className={`text-xs text-white px-2 py-1 rounded font-medium ${getTypeColor(fullMoves.charge2.type)}`}>
                        {fullMoves.charge2.type}
                      </span>
                      {pokemon.types.includes(fullMoves.charge2.type) && (
                        <span className="text-xs bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded font-medium">
                          STAB
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Move Analysis */}
            <div className="space-y-3">
              <h5 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Detailed Move Analysis</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {renderMoveDetails(
                  fullMoves.fast,
                  'Fast Move',
                  pokemon.types.includes(fullMoves.fast?.type || ''),
                  stats
                )}
                {renderMoveDetails(
                  fullMoves.charge1,
                  'Charge Move 1',
                  pokemon.types.includes(fullMoves.charge1?.type || ''),
                  stats
                )}
                {renderMoveDetails(
                  fullMoves.charge2,
                  'Charge Move 2',
                  pokemon.types.includes(fullMoves.charge2?.type || ''),
                  stats
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            {stats && (
              <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-sm">Performance Metrics</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="text-center">
                    <div className="text-blue-600 dark:text-blue-400">Fast DPS</div>
                    <div className="font-bold text-blue-900 dark:text-blue-100">{stats.fastDPS.toFixed(1)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-600 dark:text-blue-400">Fast EPS</div>
                    <div className="font-bold text-blue-900 dark:text-blue-100">{stats.fastEPS.toFixed(1)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-blue-600 dark:text-blue-400">C1 DPE</div>
                    <div className="font-bold text-blue-900 dark:text-blue-100">{stats.charge1DPE.toFixed(1)}</div>
                  </div>
                  {stats.hasSecondCharge && (
                    <div className="text-center">
                      <div className="text-blue-600 dark:text-blue-400">C2 DPE</div>
                      <div className="font-bold text-blue-900 dark:text-blue-100">{stats.charge2DPE.toFixed(1)}</div>
                    </div>
                  )}
                </div>

                {(stats.turnsToCharge1 || stats.turnsToCharge2) && (
                  <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-700">
                    <div className="grid grid-cols-2 gap-3 text-xs text-center">
                      {stats.turnsToCharge1 && (
                        <div>
                          <div className="text-blue-600 dark:text-blue-400">Turns to C1</div>
                          <div className="font-bold text-blue-900 dark:text-blue-100">{stats.turnsToCharge1}</div>
                        </div>
                      )}
                      {stats.turnsToCharge2 && (
                        <div>
                          <div className="text-blue-600 dark:text-blue-400">Turns to C2</div>
                          <div className="font-bold text-blue-900 dark:text-blue-100">{stats.turnsToCharge2}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          ⚡ Moveset Analysis
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Detailed breakdown of optimal movesets for each league
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {availableLeagues.map(league => 
            renderLeagueMoveset(league, pokemon.leagues[league]!)
          )}
        </div>
      </div>
    </div>
  );
};
