import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import PokemonTable from "./components/PokemonTable";
import PokemonDetail from "./components/PokemonDetail";
import { LeaderboardAd, RectangleAd, HalfPageAd } from "./components/AdSpace";
import ThemeToggle from "./components/ThemeToggle";
import { useTheme } from "./hooks/useTheme";

function App() {
  // Initialize theme hook to ensure dark mode is applied
  useTheme();

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Header with Ad Space */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PP</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PokePurge
              </h1>
              <span className="hidden sm:inline-block text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                Pokemon GO Inventory Manager
              </span>
              <ThemeToggle />
            </div>

            {/* Header Ad Space - Horizontal Banner */}
            <div className="flex-shrink-0">
              <LeaderboardAd slot="1234567890" className="hidden lg:block" />
              {/* Mobile ad for smaller screens */}
              <div className="lg:hidden">
                <RectangleAd slot="1234567891" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content with Sidebar Ad */}
      <div className="max-w-7xl mx-auto flex gap-6 p-4">
        {/* Sidebar Ad Space */}
        <aside className="hidden xl:block flex-shrink-0">
          <div className="sticky top-24">
            <HalfPageAd slot="1234567892" />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Routes>
            <Route path="/" element={<PokemonTable />} />
            <Route path="/pokemon/:id" element={<PokemonDetail />} />
          </Routes>
        </main>

        {/* Right Sidebar Ad Space */}
        <aside className="hidden xl:block flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <RectangleAd slot="1234567893" />
            <RectangleAd slot="1234567894" />
          </div>
        </aside>
      </div>

      {/* Footer Ad Space */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-center mb-4">
            <LeaderboardAd slot="1234567895" />
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>&copy; 2025 PokePurge. Pokemon GO inventory management tool.</p>
            <p className="mt-1">Pokemon GO is a trademark of Niantic, Inc.</p>
          </div>
        </div>
      </footer>
      </div>
    </Router>
  );
}

export default App;
