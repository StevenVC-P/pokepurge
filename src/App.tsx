import React from "react";
import PokemonTable from "./components/PokemonTable";

function App() {
  return (
    <div className="min-h-screen bg-gray-100 text-black p-4">
      <h1 className="text-3xl font-bold mb-4">PokePurge</h1>
      <PokemonTable />
    </div>
  );
}

export default App;
