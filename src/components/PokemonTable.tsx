import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SmartPagination } from "./SmartPagination";
import type { Pokemon } from "../types/Pokemon";
import { loadPokemonData, loadSpriteMap } from "../utils/dataLoader";
import { generatePokemonSlug } from "../utils/pokemonUtils";

export default function PokemonTable() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [spriteMap, setSpriteMap] = useState<Record<string, Record<string, string>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Pokemon>("id");
  const [sortAsc, setSortAsc] = useState(true);
  const [showDynamaxOnly, setShowDynamaxOnly] = useState(false);

  const [showColorKey, setShowColorKey] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [searchField, setSearchField] = useState<keyof Pokemon | "all">("all");

  const trashabilityRank: Record<string, number> = {
    Essential: 10,
    Valuable: 9,
    Reliable: 8,
    Useful: 7,
    Niche: 6,
    Replaceable: 5,
    Outclassed: 4,
    "Legacy-Only": 3,
    Trap: 2,
    Trash: 1,
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load both Pokemon data and sprite map in parallel
        const [pokemonData, spriteMapData] = await Promise.all([
          loadPokemonData(),
          loadSpriteMap()
        ]);

        setPokemonList(pokemonData);
        setSpriteMap(spriteMapData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
        console.error('Error loading Pokemon data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 on filter change
  }, [search, showDynamaxOnly, sortKey, sortAsc]);

  const filtered = pokemonList
    .filter((p) => {
      const term = search.toLowerCase();
      if (!term) return true;
      if (searchField === "all") {
        return `${p.name} ${p.form} ${p.base} ${p.trashability}`
          .toLowerCase()
          .includes(term);
      } else {
        const fieldValue = (p[searchField] ?? "").toString().toLowerCase();
        return fieldValue.includes(term);
      }
    })
    .filter((p) => {
      if (showDynamaxOnly) {
        // When showing Dynamax only, include all Dynamax Pokemon (including Gigantamax)
        return p.dynamax || p.form.includes('Gigantamax');
      } else {
        // When showing all Pokemon, exclude Gigantamax forms (they're Dynamax-specific)
        return !p.form.includes('Gigantamax');
      }
    });

  const sorted = [...filtered].sort((a, b) => {
    // Get the appropriate values based on dynamax filter
    const getDisplayValue = (pokemon: Pokemon, key: keyof Pokemon) => {
      if (key === "trashability") {
        if (showDynamaxOnly && pokemon.dynamax) {
          return pokemon.trashability; // Show dynamax trashability when filtering for dynamax only
        }
        if (pokemon.dynamax && pokemon.regularTrashability) {
          return pokemon.regularTrashability; // Show regular trashability for dynamax Pokemon when not filtering
        }
        return pokemon.trashability; // Fallback for non-dynamax Pokemon
      }

      if (key === "recommendedCount") {
        if (showDynamaxOnly && pokemon.dynamax) {
          return pokemon.recommendedCount; // Show dynamax recommendedCount when filtering for dynamax only
        }
        if (pokemon.dynamax && pokemon.regularRecommendedCount !== undefined) {
          return pokemon.regularRecommendedCount; // Show regular recommendedCount for dynamax Pokemon when not filtering
        }
        return pokemon.recommendedCount; // Fallback for non-dynamax Pokemon
      }

      return pokemon[key];
    };

    const aVal = getDisplayValue(a, sortKey);
    const bVal = getDisplayValue(b, sortKey);

    if (sortKey === "trashability") {
      const aRank = trashabilityRank[aVal as string] ?? 0;
      const bRank = trashabilityRank[bVal as string] ?? 0;
      return sortAsc ? aRank - bRank : bRank - aRank;
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortAsc ? aVal - bVal : bVal - aVal;
    }

    return sortAsc
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = sorted.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (key: keyof Pokemon) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const getDisplayName = (base: string, form: string, isShadow: boolean): string => {
    const isAlreadyShadow = form.toLowerCase().includes("shadow");
    // Don't show "normal" form in the display name
    const regionPrefix = form && form !== "Normal" && form !== "normal" ? `${form} ` : "";
    const shadowSuffix = isShadow && !isAlreadyShadow ? " (Shadow)" : "";
    return `${regionPrefix}${base}${shadowSuffix}`;
  };

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

  const getColorClass = (value: string) =>
    colorMap[value.trim()] || colorMap.Default;

  // Helper function to get evolution family information
  const getEvolutionInfo = (pokemon: Pokemon) => {
    // Find all Pokemon in the same evolution family (same candy)
    const family = pokemonList.filter(p =>
      p.candy === pokemon.candy &&
      p.form.includes('Shadow') === pokemon.form.includes('Shadow') // Same shadow status
    );

    // Find the strongest member in the family
    const familyTiers = family.map(p => trashabilityRank[p.trashability] || 0);
    const maxTier = Math.max(...familyTiers);
    const strongestMember = family.find(p => (trashabilityRank[p.trashability] || 0) === maxTier);

    return {
      family,
      strongestMember,
      maxTier
    };
  };

  const colorMap: Record<string, string> = {
    Essential: "bg-purple-600 text-white",
    Valuable: "bg-indigo-500 text-white",
    Reliable: "bg-green-400 text-green-900",
    Useful: "bg-teal-200 text-teal-900",
    Niche: "bg-blue-100 text-blue-800",
    Replaceable: "bg-yellow-200 text-yellow-800",
    Outclassed: "bg-orange-200 text-orange-800",
    "Legacy-Only": "bg-pink-200 text-pink-800",
    Trap: "bg-red-300 text-red-900",
    Trash: "bg-red-800 text-white",
    Default: "bg-gray-200 text-gray-800",
  };

  const tierDescriptions: Record<string, string> = {
    Essential: "Must keep - Meta defining",
    Valuable: "Very useful - Strong alternatives",
    Reliable: "Good options - Solid performers",
    Useful: "Situational value - Worth keeping",
    Niche: "Limited use - Consider keeping",
    Trash: "Safe to transfer"
  };

  // Define the 6 main tiers in order from best to worst
  const mainTiers = ['Essential', 'Valuable', 'Reliable', 'Useful', 'Niche', 'Trash'];



  // Calculate tier distribution for current filtered view
  const currentViewStats = {
    total: sorted.length,
    tierDistribution: sorted.reduce((acc, p) => {
      // Get display trashability based on dynamax filter
      let displayTrashability = p.trashability;
      if (showDynamaxOnly && p.dynamax) {
        displayTrashability = p.trashability;
      } else if (p.dynamax && p.regularTrashability) {
        displayTrashability = p.regularTrashability;
      }

      acc[displayTrashability] = (acc[displayTrashability] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  // Show loading state
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

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Failed to Load Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Trashability Color Key */}
      <div className="mb-4">
        <div className="p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg max-w-4xl">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setShowColorKey(!showColorKey)}
          >
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">🎨 Trashability Tiers</h3>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {showColorKey ? '▼ Hide' : '▶ Show'}
            </span>
          </div>
          {showColorKey && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs mt-2">
              {mainTiers.map((tier) => (
                <div key={tier} className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${colorMap[tier]}`}>
                    {tier}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400 text-xs">
                    {tierDescriptions[tier]}
                  </span>
                </div>
              ))}
            </div>
          )}
          {showColorKey && (
            <div className="text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600 pt-2 mt-2">
              <div className="mb-1">
                <strong>Evolution Column Legend:</strong> 🏆 = Best in family • → = Shows strongest evolution
              </div>
              <div className="text-blue-600 dark:text-blue-400">
                <strong>Note:</strong> Gigantamax Pokemon only appear when viewing Dynamax Pokemon
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Current View Statistics */}
      {(search || showDynamaxOnly) && (
        <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-300">
          <strong>Current View:</strong> {currentViewStats.total} Pokemon
          {search && !showDynamaxOnly && ' (excluding Gigantamax)'}
           •
          {Object.entries(currentViewStats.tierDistribution)
            .sort((a, b) => (trashabilityRank[b[0]] || 0) - (trashabilityRank[a[0]] || 0))
            .slice(0, 5) // Show top 5 tiers
            .map(([tier, count]) => ` ${tier}: ${count}`)
            .join(' • ')}
          {Object.keys(currentViewStats.tierDistribution).length > 5 && ' • ...'}
        </div>
      )}

      {/* Enhanced Search and Filter Section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Controls */}
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value as keyof Pokemon | "all")}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">🔍 All Fields</option>
              <option value="name">📛 Name</option>
              <option value="base">🏠 Base</option>
              <option value="form">🔄 Form</option>
              <option value="trashability">⭐ Trashability</option>
              <option value="candy">🍬 Evolution Family</option>
            </select>

            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search Pokémon..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-gray-200 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                🔍
              </div>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Filter Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDynamaxOnly((prev) => !prev)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                showDynamaxOnly
                  ? "bg-blue-500 text-white border-blue-600 shadow-md"
                  : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
              }`}
            >
              {showDynamaxOnly ? "🔥 Dynamax Only" : "📋 All Pokémon"}
            </button>
          </div>
        </div>

        {/* Tips and Stats */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
            💡 Tip: Click column headers to sort • Gigantamax Pokemon only show in Dynamax view
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">
            Showing {paginated.length} of {sorted.length} Pokemon
          </div>
        </div>
      </div>

      {/* Top Pagination */}
      <div className="mb-4">
        <SmartPagination
          currentPage={currentPage}
          totalPages={Math.ceil(sorted.length / itemsPerPage)}
          perPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Enhanced Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Sprite
                </th>
                {["id", "name", "base", "types", "trashability", "recommendedCount", "quickRole"].map((key) => (
                  <th
                    key={key}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                      key !== "quickRole" ? "cursor-pointer select-none hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" : ""
                    }`}
                    onClick={() => key !== "quickRole" ? handleSort(key as keyof Pokemon) : undefined}
                  >
                    <div className="flex items-center gap-1">
                      <span>
                        {key === "id" ? "#" :
                         key === "quickRole" ? "Role" :
                         key === "recommendedCount" ? "Recommended" :
                         key.charAt(0).toUpperCase() + key.slice(1)}
                      </span>
                      {sortKey === key && (
                        <span className="text-blue-500">
                          {sortAsc ? "▲" : "▼"}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          <tbody>
            {paginated.map((mon) => {
              const isShadow = mon.name.includes("Shadow");
              const form = mon.form === "Normal" ? "" : mon.form;
              const label = getDisplayName(mon.base, form, isShadow);
              const url = getSpriteUrl(mon);

              // Get display values based on dynamax filter
              const getDisplayTrashability = () => {
                if (showDynamaxOnly && mon.dynamax) {
                  return mon.trashability; // Show dynamax trashability when filtering for dynamax only
                }
                if (mon.dynamax && mon.regularTrashability) {
                  return mon.regularTrashability; // Show regular trashability for dynamax Pokemon when not filtering
                }
                return mon.trashability; // Fallback for non-dynamax Pokemon
              };

              const getDisplayRecommendedCount = () => {
                if (showDynamaxOnly && mon.dynamax) {
                  return mon.recommendedCount; // Show dynamax recommendedCount when filtering for dynamax only
                }
                if (mon.dynamax && mon.regularRecommendedCount !== undefined) {
                  return mon.regularRecommendedCount; // Show regular recommendedCount for dynamax Pokemon when not filtering
                }
                return mon.recommendedCount; // Fallback for non-dynamax Pokemon
              };

              const displayTrashability = getDisplayTrashability();
              const displayRecommendedCount = getDisplayRecommendedCount();

              return (
                <tr
                  key={`${mon.id}-${mon.base}-${form || "Normal"}-${isShadow ? "shadow" : "regular"}`}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      {url ? (
                        <img
                          src={url}
                          alt={`${label} ${form}`}
                          className="w-10 h-10 object-contain rounded-lg bg-gray-50 dark:bg-gray-700 p-1"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 text-xs">
                          ?
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400">#{mon.id}</td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/pokemon/${generatePokemonSlug(mon)}`}
                      className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline transition-colors"
                    >
                      {label}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">{mon.base}</td>
                  <td className="px-4 py-3">
                    {mon.types && mon.types.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {mon.types.map((type, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600"
                          >
                            {type}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getColorClass(displayTrashability)}`}>
                      {displayTrashability}
                      {showDynamaxOnly && mon.dynamax && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          Dynamax
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{displayRecommendedCount}</span>
                      {showDynamaxOnly && mon.dynamax && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                          Dynamax
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2 min-w-[120px]">
                    {mon.quickRole ? (
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded whitespace-nowrap">
                        {mon.quickRole}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                        Analyzing...
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {/* Bottom Pagination */}
      <div className="mt-4">
        <SmartPagination
          currentPage={currentPage}
          totalPages={Math.ceil(sorted.length / itemsPerPage)}
          perPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onPerPageChange={(val) => {
            setItemsPerPage(val);
            setCurrentPage(1);
          }}
        />
      </div>
    </div>
  );
}
