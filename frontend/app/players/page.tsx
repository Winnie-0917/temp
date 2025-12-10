"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Link from "next/link";

interface Player {
  id: string;
  name: string;
  country: string;
  country_code: string;
  photo_url: string;
  categories: string[];
  rankings: {
    [key: string]: {
      rank: number;
      points: number;
    };
  };
}

interface PlayerResponse {
  success: boolean;
  players: Player[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const fetchPlayers = async (pageNum: number, searchTerm: string) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: pageNum.toString(),
        per_page: "24",
        search: searchTerm,
      });
      
      // 使用環境變數或預設 API URL
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/players/?${query}`);
      const data: PlayerResponse = await res.json();

      if (data.success) {
        setPlayers(data.players);
        setTotalPages(data.total_pages);
      }
    } catch (error) {
      console.error("Failed to fetch players:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      setPage(1);
      fetchPlayers(1, search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchPlayers(page, search);
  }, [page]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
              選手資料庫
            </h1>
            <p className="text-slate-400 mt-1">
              瀏覽 WTT 世界排名選手，查看詳細數據與分析
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg leading-5 bg-slate-800 text-slate-100 placeholder-slate-400 focus:outline-none focus:bg-slate-700 focus:border-blue-500 transition duration-150 ease-in-out"
              placeholder="搜尋選手姓名或國家..."
              value={search}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="bg-slate-800 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-slate-700 group cursor-pointer"
                  onClick={() => setSelectedPlayer(player)}
                >
                  {/* Photo */}
                  <div className="relative h-64 bg-gradient-to-b from-slate-700 to-slate-900 overflow-hidden">
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.name}
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"%3E%3Ccircle cx="24" cy="24" r="24" fill="%23334155"/%3E%3Cpath d="M24 24c3.3 0 6-2.7 6-6s-2.7-6-6-6-6 2.7-6 6 2.7 6 6 6zm0 3c-4 0-12 2-12 6v3h24v-3c0-4-8-6-12-6z" fill="%2394A3B8"/%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-6xl">🏓</div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent h-20"></div>
                    
                    {/* Rank Badge */}
                    <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-md">
                      Rank #{player.rankings['SEN_SINGLES']?.rank || player.rankings['WOM_SINGLES']?.rank || '?'}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-1 truncate">{player.name}</h3>
                    <div className="flex items-center text-slate-400 text-sm mb-3">
                      <span className="mr-2">{player.country_code}</span>
                      <span className="truncate">{player.country}</span>
                    </div>

                    {/* Categories Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {player.categories.map(cat => (
                        <span key={cat} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded-full">
                          {cat.replace('SEN_', '男').replace('WOM_', '女').replace('MIX_', '混').replace('SINGLES', '單').replace('DOUBLES', '雙')}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link 
                        href={`/youtube?q=${encodeURIComponent(player.name)}`}
                        className="flex items-center justify-center px-3 py-2 bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white rounded-lg text-sm transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📺 找影片
                      </Link>
                      <Link 
                        href={`/player-analysis?player=${encodeURIComponent(player.name)}`}
                        className="flex items-center justify-center px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-sm transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📊 分析
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-10 gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors"
                >
                  上一頁
                </button>
                <span className="px-4 py-2 text-slate-400">
                  第 {page} 頁 / 共 {totalPages} 頁
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-slate-800 rounded-lg disabled:opacity-50 hover:bg-slate-700 transition-colors"
                >
                  下一頁
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Player Detail Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedPlayer(null)}>
          <div className="bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-700" onClick={e => e.stopPropagation()}>
            <div className="relative h-48 bg-gradient-to-r from-blue-900 to-slate-900">
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white transition-colors"
              >
                ✕
              </button>
              <div className="absolute -bottom-16 left-8 flex items-end">
                <div className="w-32 h-32 rounded-xl border-4 border-slate-800 bg-slate-700 overflow-hidden shadow-xl">
                  {selectedPlayer.photo_url ? (
                    <img src={selectedPlayer.photo_url} alt={selectedPlayer.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl">🏓</div>
                  )}
                </div>
                <div className="ml-4 mb-4">
                  <h2 className="text-3xl font-bold text-white">{selectedPlayer.name}</h2>
                  <p className="text-blue-300 flex items-center gap-2">
                    <span className="text-2xl">{selectedPlayer.country_code}</span>
                    {selectedPlayer.country}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-20 px-8 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Rankings */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2">目前排名</h3>
                  <div className="space-y-3">
                    {Object.entries(selectedPlayer.rankings).map(([cat, data]) => (
                      <div key={cat} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-lg">
                        <span className="text-slate-400 text-sm">
                          {cat.replace('SEN_', '男').replace('WOM_', '女').replace('MIX_', '混').replace('SINGLES', '單').replace('DOUBLES', '雙')}
                        </span>
                        <div className="text-right">
                          <div className="text-xl font-bold text-white">#{data.rank}</div>
                          <div className="text-sm text-slate-500">{data.points} 分</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-300 mb-4 border-b border-slate-700 pb-2">快速功能</h3>
                  <div className="space-y-3">
                    <Link 
                      href={`/youtube?q=${encodeURIComponent(selectedPlayer.name)}`}
                      className="block w-full p-4 bg-gradient-to-r from-red-900/50 to-red-800/50 hover:from-red-900 hover:to-red-800 border border-red-700/30 rounded-xl transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-red-200">搜尋比賽影片</span>
                        <span className="text-2xl group-hover:scale-110 transition-transform">📺</span>
                      </div>
                      <p className="text-xs text-red-300/70 mt-1">在 YouTube 上尋找該選手的比賽錄像</p>
                    </Link>

                    <Link 
                      href={`/player-analysis?player=${encodeURIComponent(selectedPlayer.name)}`}
                      className="block w-full p-4 bg-gradient-to-r from-blue-900/50 to-blue-800/50 hover:from-blue-900 hover:to-blue-800 border border-blue-700/30 rounded-xl transition-all group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-blue-200">進行技術分析</span>
                        <span className="text-2xl group-hover:scale-110 transition-transform">📊</span>
                      </div>
                      <p className="text-xs text-blue-300/70 mt-1">分析該選手的得分與失分模式</p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
