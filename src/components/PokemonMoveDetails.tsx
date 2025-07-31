import React, { useState, useEffect } from 'react';
import { Pokemon, OptimizedMoves } from '../types/Pokemon';
import { loadMovesDatabase, expandMoves, FullMoves, MovesDatabase } from '../utils/moveUtils';

interface PokemonMoveDetailsProps {
  pokemon: Pokemon;
  leagueName: 'great' | 'ultra' | 'master';
}

export const PokemonMoveDetails: React.FC<PokemonMoveDetailsProps> = ({ 
  pokemon, 
  leagueName 
}) => {
  const [movesDatabase, setMovesDatabase] = useState<MovesDatabase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMovesDatabase()
      .then(setMovesDatabase)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500">Loading moves...</div>;
  if (error) return <div className="text-red-500">Error loading moves: {error}</div>;
  if (!movesDatabase) return <div className="text-gray-500">No moves data available</div>;

  const leagueData = pokemon.leagues[leagueName];
  if (!leagueData || !leagueData.moves) {
    return <div className="text-gray-500">No {leagueName} league data available</div>;
  }

  const fullMoves = expandMoves(leagueData.moves, movesDatabase);

  const getTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      normal: 'bg-gray-400',
      fire: 'bg-red-500',
      water: 'bg-blue-500',
      electric: 'bg-yellow-400',
      grass: 'bg-green-500',
      ice: 'bg-blue-200',
      fighting: 'bg-red-700',
      poison: 'bg-purple-500',
      ground: 'bg-yellow-600',
      flying: 'bg-indigo-400',
      psychic: 'bg-pink-500',
      bug: 'bg-green-400',
      rock: 'bg-yellow-800',
      ghost: 'bg-purple-700',
      dragon: 'bg-indigo-700',
      dark: 'bg-gray-800',
      steel: 'bg-gray-600',
      fairy: 'bg-pink-300',
    };
    return colors[type.toLowerCase()] || 'bg-gray-400';
  };

  const renderMove = (move: any, label: string, isSTAB: boolean) => {
    if (!move) return null;

    return (
      <div className="border rounded-lg p-3 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-800">{label}</h4>
          {isSTAB && (
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
              STAB
            </span>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{move.name}</span>
            <span className={`text-xs text-white px-2 py-1 rounded ${getTypeColor(move.type)}`}>
              {move.type}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>Power: <span className="font-medium">{move.power}</span></div>
            {move.energyGain && (
              <div>Energy: <span className="font-medium">+{move.energyGain}</span></div>
            )}
            {move.energyCost && (
              <div>Cost: <span className="font-medium">{move.energyCost}</span></div>
            )}
            {move.turns && (
              <div>Turns: <span className="font-medium">{move.turns}</span></div>
            )}
          </div>
          
          {move.buffs && (
            <div className="text-xs text-gray-500">
              Buffs: {move.buffs.join(', ')} 
              {move.buffApplyChance && ` (${move.buffApplyChance}% chance)`}
            </div>
          )}
        </div>
      </div>
    );
  };

  const stats = leagueData.movesetStats;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold capitalize">
          {leagueName} League Moveset
        </h3>
        <div className="text-sm text-gray-600">
          Score: <span className="font-medium">{leagueData.score}</span>
        </div>
      </div>

      <div className="grid gap-3">
        {renderMove(fullMoves.fast, 'Fast Move', stats?.stab.fast || false)}
        {renderMove(fullMoves.charge1, 'Charge Move 1', stats?.stab.charge1 || false)}
        {renderMove(fullMoves.charge2, 'Charge Move 2', stats?.stab.charge2 || false)}
      </div>

      {stats && (
        <div className="bg-gray-50 rounded-lg p-3">
          <h4 className="font-semibold text-gray-800 mb-2">Moveset Analysis</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Fast DPS: <span className="font-medium">{stats.fastDPS}</span></div>
            <div>Fast EPS: <span className="font-medium">{stats.fastEPS}</span></div>
            {stats.turnsToCharge1 && (
              <div>Turns to Charge 1: <span className="font-medium">{stats.turnsToCharge1}</span></div>
            )}
            {stats.turnsToCharge2 && (
              <div>Turns to Charge 2: <span className="font-medium">{stats.turnsToCharge2}</span></div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
