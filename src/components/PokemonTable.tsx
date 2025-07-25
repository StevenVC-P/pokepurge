import { useEffect, useState } from "react";
import { SmartPagination } from "./SmartPagination";
import type { Pokemon } from "../types/Pokemon";
import spriteMap from "../data/spriteMap.json";
import data from "../data/pokemon.json";

export default function PokemonTable() {
  const [pokemonList, setPokemonList] = useState<Pokemon[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<keyof Pokemon>("id");
  const [sortAsc, setSortAsc] = useState(true);
  const [showDynamaxOnly, setShowDynamaxOnly] = useState(false);
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

  useEffect(() => {
    setPokemonList(data as Pokemon[]);
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
      if (showDynamaxOnly) return p.dynamax;
      return true; // Show all by default
    });

  const sorted = [...filtered].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

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

  return (
    <div className="p-4">
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <select
          value={searchField}
          onChange={(e) => setSearchField(e.target.value as keyof Pokemon | "all")}
          className="border rounded px-2 py-1 text-sm"
        >
          <option value="all">All Fields</option>
          <option value="name">Name</option>
          <option value="base">Base</option>
          <option value="form">Form</option>
          <option value="trashability">Trashability</option>
        </select>

        <input
          type="text"
          placeholder="Search Pokémon..."
          className="p-2 border rounded flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button
          onClick={() => setShowDynamaxOnly((prev) => !prev)}
          className={`px-4 py-1 rounded border text-sm ${
            showDynamaxOnly
              ? "bg-blue-500 text-white border-blue-600"
              : "bg-gray-100 text-gray-800 border-gray-300"
          }`}
        >
          {showDynamaxOnly ? "Showing Only Dynamax" : "Showing All Pokémon"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 shadow rounded">
          <thead className="bg-gray-200 text-left">
            <tr>
              <th className="px-4 py-2">Sprite</th>
              {["id", "name", "base", "trashability", "recommendedCount"].map((key) => (
                <th
                  key={key}
                  className="px-4 py-2 cursor-pointer select-none hover:bg-gray-300 transition"
                  onClick={() => handleSort(key as keyof Pokemon)}
                >
                  {key === "id" ? "#" : key.charAt(0).toUpperCase() + key.slice(1)}
                  {sortKey === key && (sortAsc ? " ▲" : " ▼")}
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

              return (
                <tr
                  key={`${mon.id}-${mon.base}-${form || "Normal"}-${isShadow ? "shadow" : "regular"}`}
                  className="odd:bg-white even:bg-gray-50 hover:bg-yellow-100 transition"
                >
                  <td className="px-4 py-2">
                    {url ? (
                      <img src={url} alt={`${label} ${form}`} className="w-8 h-8" />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2">{mon.id}</td>
                  <td className="px-4 py-2">{label}</td>
                  <td className="px-4 py-2">{mon.base}</td>
                  <td className={`px-4 py-2 rounded ${getColorClass(mon.trashability)}`}>
                    {mon.trashability}
                  </td>
                  <td className="px-4 py-2">{mon.recommendedCount}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

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
