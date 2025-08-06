import React from 'react';
import { Pokemon } from '../types/Pokemon';
import { getTrashabilityColor } from '../utils/pokemonUtils';

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

interface PokemonCompetitiveContextProps {
  pokemon: Pokemon;
}

export const PokemonCompetitiveContext: React.FC<PokemonCompetitiveContextProps> = ({ pokemon }) => {
  // Calculate meta relevance based on league scores
  const getMetaRelevance = () => {
    const scores = Object.values(pokemon.leagues).map(league => league?.score || 0);
    const maxScore = Math.max(...scores);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    if (maxScore >= 90) return { level: 'Meta Defining', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' };
    if (maxScore >= 80) return { level: 'Meta Relevant', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20' };
    if (maxScore >= 70) return { level: 'Competitive Viable', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' };
    if (maxScore >= 60) return { level: 'Niche Viable', color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
    return { level: 'Limited Use', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-50 dark:bg-gray-900/20' };
  };

  // Get role explanation based on AI analysis and stats
  const getRoleExplanation = () => {
    const role = pokemon.quickRole || pokemon.roleSummary;
    if (!role) return null;

    const roleKeywords = {
      'tank': 'Focuses on absorbing damage and providing bulk for the team',
      'attacker': 'Specializes in dealing high damage output',
      'closer': 'Excels at finishing off weakened opponents',
      'lead': 'Strong opening Pokemon that can handle common leads',
      'safe swap': 'Reliable switch-in that can handle multiple threats',
      'spice': 'Unexpected pick that can catch opponents off-guard',
      'wall': 'Defensive specialist that resists common attack types',
      'glass cannon': 'High damage output but fragile defensively'
    };

    const matchedRole = Object.keys(roleKeywords).find(key => 
      role.toLowerCase().includes(key)
    );

    return matchedRole ? {
      name: matchedRole.charAt(0).toUpperCase() + matchedRole.slice(1),
      description: roleKeywords[matchedRole]
    } : null;
  };

  // Calculate league versatility
  const getLeagueVersatility = () => {
    const viableLeagues = Object.entries(pokemon.leagues)
      .filter(([_, data]) => data && data.score && data.score >= 60)
      .length;
    
    if (viableLeagues >= 3) return { level: 'Multi-League', description: 'Viable across all major leagues' };
    if (viableLeagues === 2) return { level: 'Dual-League', description: 'Strong in multiple leagues' };
    if (viableLeagues === 1) return { level: 'Specialist', description: 'Focused on one league' };
    return { level: 'Limited', description: 'Struggles in competitive play' };
  };

  // Get investment recommendation
  const getInvestmentRecommendation = () => {
    const trashability = pokemon.trashability;
    const recommendedCount = pokemon.recommendedCount;
    
    if (trashability === 'Essential') {
      return {
        priority: 'High Priority',
        color: 'text-green-600 dark:text-green-400',
        bg: 'bg-green-50 dark:bg-green-900/20',
        description: `Highly recommended investment. Keep ${recommendedCount} copies.`
      };
    } else if (trashability === 'Valuable') {
      return {
        priority: 'Medium Priority',
        color: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        description: `Good investment option. Keep ${recommendedCount} copies.`
      };
    } else if (trashability === 'Reliable') {
      return {
        priority: 'Situational',
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        description: `Consider for specific needs. Keep ${recommendedCount} copies.`
      };
    } else {
      return {
        priority: 'Low Priority',
        color: 'text-gray-600 dark:text-gray-400',
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        description: `Limited competitive value. Keep ${recommendedCount} copies if any.`
      };
    }
  };

  const metaRelevance = getMetaRelevance();
  const roleExplanation = getRoleExplanation();
  const versatility = getLeagueVersatility();
  const investment = getInvestmentRecommendation();

  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          🏆 Competitive Analysis
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Meta relevance, role analysis, and investment recommendations
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Meta Relevance & Role */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Meta Standing</h4>
              <div className={`inline-flex items-center px-4 py-2 rounded-lg ${metaRelevance.bg}`}>
                <span className={`font-medium ${metaRelevance.color}`}>
                  {metaRelevance.level}
                </span>
              </div>
            </div>

            {roleExplanation && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Competitive Role</h4>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                  <div className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                    {roleExplanation.name}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {roleExplanation.description}
                  </div>
                </div>
              </div>
            )}

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">League Versatility</h4>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {versatility.level}
                </span>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  • {versatility.description}
                </span>
              </div>
            </div>
          </div>

          {/* Investment & Trashability */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Investment Priority</h4>
              <div className={`rounded-lg p-4 border ${investment.bg}`}>
                <div className={`font-medium mb-2 ${investment.color}`}>
                  {investment.priority}
                </div>
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {investment.description}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Trashability Tier</h4>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrashabilityColor(pokemon.trashability)}`}>
                  {pokemon.trashability}
                </span>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Score: {pokemon.trashabilityScore?.toFixed(1) || 'N/A'}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Recommended Copies</h4>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {pokemon.recommendedCount}
                </span>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {pokemon.recommendedCount === 0 ? 'Transfer all' : 
                   pokemon.recommendedCount === 1 ? 'Keep one copy' :
                   `Keep ${pokemon.recommendedCount} copies`}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Performance Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(pokemon.leagues).map(([league, data]) => {
              if (!data || !data.score) return null;
              
              const leagueName = league.charAt(0).toUpperCase() + league.slice(1);
              const getScoreColor = (score: number) => {
                if (score >= 80) return 'text-green-600 dark:text-green-400';
                if (score >= 70) return 'text-blue-600 dark:text-blue-400';
                if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
                return 'text-gray-600 dark:text-gray-400';
              };

              return (
                <div key={league} className="text-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{leagueName}</div>
                  <div className={`text-xl font-bold ${getScoreColor(data.score)}`}>
                    {data.score.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {data.rating || 'Unrated'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Analysis */}
        {(pokemon.roleSummary || pokemon.notes) && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">AI Analysis</h4>
            {pokemon.roleSummary && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-3">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {pokemon.roleSummary}
                </div>
              </div>
            )}
            {pokemon.keyTags && pokemon.keyTags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {pokemon.keyTags.map((tag, index) => (
                  <span
                    key={index}
                    className={`px-2 py-1 rounded text-xs font-medium border ${getTagColor(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
