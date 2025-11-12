'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import RankingTable from './components/RankingTable';
import StatsCard from './components/StatsCard';
import CategorySelector from './components/CategorySelector';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState('SEN_SINGLES');
  const [rankingData, setRankingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string>('');

  const categoryNames: { [key: string]: string } = {
    'SEN_SINGLES': '男子單打',
    'SEN_DOUBLES': '男子雙打',
  };

  useEffect(() => {
    fetchRankingData(selectedCategory);
  }, [selectedCategory]);

  const fetchRankingData = async (category: string) => {
    setLoading(true);
    try {
      const apiUrl = typeof window !== 'undefined' 
        ? 'http://localhost:5000' 
        : 'http://backend:5000';
      const response = await fetch(`${apiUrl}/api/rankings/${category}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setRankingData(data);
      setLastUpdate(data.updated_at || new Date().toISOString());
    } catch (error) {
      console.error('獲取數據失敗:', error);
      setRankingData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpdate = async () => {
    setLoading(true);
    try {
      const apiUrl = typeof window !== 'undefined' 
        ? 'http://localhost:5000' 
        : 'http://backend:5000';
      await fetch(`${apiUrl}/api/update`, { method: 'POST' });
      fetchRankingData(selectedCategory);
    } catch (error) {
      console.error('更新數據失敗:', error);
      setLoading(false);
    }
  };

  const getRankingList = () => {
    if (!rankingData?.data?.Result) return [];
    return rankingData.data.Result;
  };

  const getTopPlayers = () => {
    const list = getRankingList();
    return list.slice(0, 20);
  };

  const getTotalPlayers = () => {
    return getRankingList().length;
  };

  const getCountryDistribution = () => {
    const list = getRankingList();
    const countries: { [key: string]: number } = {};
    list.forEach((player: any) => {
      const country = player.CountryName || '未知';
      countries[country] = (countries[country] || 0) + 1;
    });
    return Object.entries(countries)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header - 明亮設計 */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-orange-200/50 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-orange-900 tracking-tight">
                Table Tennis <span className="text-amber-600">Platform</span>
              </h1>
              <p className="mt-1 text-xs text-orange-700/70 font-light">
                World Rankings & Motion Analysis
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/train"
                className="group px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:from-emerald-600 hover:to-teal-600"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">🧠</span>
                  <span>訓練</span>
                </span>
              </Link>
              <Link
                href="/analyze"
                className="group px-5 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:from-blue-600 hover:to-cyan-600"
              >
                <span className="flex items-center gap-2">
                  <span className="text-base">🎥</span>
                  <span>分析</span>
                </span>
              </Link>
              <button
                onClick={handleManualUpdate}
                disabled={loading}
                className="px-5 py-2.5 bg-white border border-orange-300 text-orange-700 text-sm font-medium rounded-full hover:bg-orange-50 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? '更新中' : '更新'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Category Selector */}
        <div className="mb-8">
          <CategorySelector
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categoryNames={categoryNames}
          />
        </div>

        {/* Stats Cards */}
        {!loading && rankingData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatsCard
              title="總選手數"
              value={getTotalPlayers()}
              icon="👥"
              color="blue"
            />
            <StatsCard
              title="前二十名"
              value={getTopPlayers().length}
              icon="🏆"
              color="yellow"
            />
            <StatsCard
              title="參賽國家"
              value={getCountryDistribution().length}
              icon="🌍"
              color="green"
            />
          </div>
        )}

        {/* Country Distribution */}
        {!loading && rankingData && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200/50 p-8 mb-8 shadow-sm">
            <h2 className="text-lg font-semibold text-orange-900 mb-6">
              國家分布
            </h2>
            <div className="space-y-4">
              {getCountryDistribution().map(([country, count], index) => (
                <div key={country} className="flex items-center gap-4">
                  <span className="w-6 text-center text-sm font-medium text-orange-400">
                    {index + 1}
                  </span>
                  <span className="w-32 font-medium text-orange-900 text-sm">
                    {country}
                  </span>
                  <div className="flex-1 bg-orange-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${(count / getTotalPlayers()) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-sm font-medium text-orange-700">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ranking Table */}
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64">
            <div className="w-12 h-12 border-3 border-orange-300 border-t-orange-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-orange-600 font-light">載入中</p>
          </div>
        ) : rankingData ? (
          <div>
            <div className="mb-4 text-xs text-orange-600/70 font-light">
              更新時間: {new Date(lastUpdate).toLocaleString('zh-TW')}
            </div>
            <RankingTable data={getTopPlayers()} category={selectedCategory} />
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-orange-200/50 p-16 text-center shadow-sm">
            <p className="text-orange-400 font-light">暫無數據</p>
          </div>
        )}
      </main>
    </div>
  );
}
