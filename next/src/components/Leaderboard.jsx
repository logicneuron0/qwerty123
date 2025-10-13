"use client";

import { useState, useEffect, useMemo } from 'react';
import { Trophy } from 'lucide-react';

// Define the core faction properties, keeping the visual identity via icon/emoji
const FACTIONS_DATA = {
  heirs: { name: 'Heirs', icon: '👑' },
  investigators: { name: 'Investigators', icon: '🔍' },
  treasurers: { name: 'Treasurers', icon: '💰' },
  researchers: { name: 'Researchers', icon: '📚' }
};

// Custom accent color for the desired maroon/deep red look
const ACCENT_COLOR_CLASS = 'border-red-800 text-red-600';

export default function Leaderboard() {
  const [factionLeaderboard, setFactionLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLeaderboardData();
  }, []);

  const fetchLeaderboardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // NOTE: We assume the API endpoint provides data for all factions with their total scores
      const response = await fetch('/api/leaderboard');
      const data = await response.json();

      if (data.success) {
        // The API response structure must be checked here. 
        // We assume data.factionLeaderboard is an array of { _id: 'factionKey', totalScore: number }
        setFactionLeaderboard(data.factionLeaderboard || []);
      } else {
        setError(data.message || 'Failed to load leaderboard');
      }
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError('Could not connect to server or API failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Memoize the sorted and merged list for display
  const rankedFactions = useMemo(() => {
    // 1. Create a map for easy lookup of fetched scores
    const scoresMap = new Map(
      factionLeaderboard.map(f => [f._id, f.totalScore || 0])
    );

    // 2. Combine static faction data with live scores
    const mergedList = Object.keys(FACTIONS_DATA).map(key => ({
      id: key,
      ...FACTIONS_DATA[key],
      totalScore: scoresMap.get(key) || 0 // Default to 0 if no score is fetched
    }));

    // 3. Sort the list: highest score first
    mergedList.sort((a, b) => b.totalScore - a.totalScore);

    return mergedList;
  }, [factionLeaderboard]);

  // Helper component for a ranked row
  const FactionRow = ({ faction, rank }) => {
    const isTopRank = rank === 1;

    return (
      <div 
        className={`flex items-center justify-between py-4 px-6 border-b border-gray-900 transition-all duration-200
          ${isTopRank ? 'bg-red-900/40' : 'hover:bg-gray-900'}
        `}
      >
        {/* Rank (Left Side) */}
        <div className={`w-10 text-xl mr-12 font-bold ${ACCENT_COLOR_CLASS}`}>
          {rank === 1 ? (
            <Trophy className="w-6 h-6 text-yellow-400 inline-block mr-2" fill="currentColor" />
          ) : (
            `${rank}`
          )}
        </div>

        {/* Faction Name (Middle) */}
        <div className="flex-1 flex items-center gap-3">
          <span className="text-2xl">{faction.icon}</span>
          <h3 className="text-xl font-semibold text-white uppercase tracking-wider">
            {faction.name}
          </h3>
        </div>

        {/* Total Points (Right Side) */}
        <div className="text-right">
          <p className="text-3xl font-extrabold text-white tracking-wider">
            {faction.totalScore.toLocaleString()}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-black py-8 px-4 font-inter rounded-2xl w-1/2 my-20">
      <div className="max-w-xl mx-auto">
        
        {/* Leaderboard Title */}
        <div className="text-center mb-10 pb-4 border-b-2 border-red-800">
          <h1 className="text-xl font-extrabold uppercase tracking-widest text-white">
            <span className={ACCENT_COLOR_CLASS}>Faction LEADERBOARD</span> 
          </h1>
          <p className="text-gray-400 mt-2 text-lg">The Battle for Supremacy</p>
        </div>

        {/* Loading/Error States */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-400 mt-4">Loading faction scores...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-600 rounded-xl p-6 text-center">
            <p className="text-red-400 text-lg">{error}</p>
            <button
              onClick={fetchLeaderboardData}
              className="mt-4 px-6 py-2 bg-red-700 hover:bg-red-800 text-white font-semibold rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Faction Leaderboard Table */}
        {!isLoading && !error && (
          <div className={`bg-gray-900 rounded-xl shadow-[0_0_20px_rgba(193,0,0,0.5)] border ${ACCENT_COLOR_CLASS} overflow-hidden`}>
            
            {/* Table Header (simplified) */}
            <div className={`flex items-center justify-between py-3 px-6 uppercase tracking-wider font-bold text-sm text-gray-400 border-b ${ACCENT_COLOR_CLASS}`}>
              <span className="w-10">Rank</span>
              <span className="flex-1">Faction</span>
              <span className="text-right">Points</span>
            </div>

            {/* List of Ranked Factions */}
            <div className="divide-y divide-gray-800">
              {rankedFactions.map((faction, index) => (
                <FactionRow key={faction.id} faction={faction} rank={index + 1} />
              ))}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
