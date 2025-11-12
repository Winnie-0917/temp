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
      // 在瀏覽器中,直接連接到 localhost:5000
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🏓 桌球世界排名分析平台
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                即時追蹤全球桌球選手排名數據
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/train"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                🧠 模型訓練
              </Link>
              <Link
                href="/analyze"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                🎥 動作分析
              </Link>
              <button
                onClick={handleManualUpdate}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '更新中...' : '手動更新'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Selector */}
        <CategorySelector
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categoryNames={categoryNames}
        />

        {/* Stats Cards */}
        {!loading && rankingData && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              前五大國家/地區分布
            </h2>
            <div className="space-y-3">
              {getCountryDistribution().map(([country, count], index) => (
                <div key={country} className="flex items-center gap-4">
                  <span className="w-8 text-center font-bold text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </span>
                  <span className="flex-1 font-medium text-gray-900 dark:text-white">
                    {country}
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-full flex items-center justify-end pr-2"
                      style={{ width: `${(count / getTotalPlayers()) * 100}%` }}
                    >
                      <span className="text-xs text-white font-medium">
                        {count}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ranking Table */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : rankingData ? (
          <>
            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              最後更新: {new Date(lastUpdate).toLocaleString('zh-TW')}
            </div>
            <RankingTable data={getTopPlayers()} category={selectedCategory} />
          </>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">暫無數據</p>
          </div>
        )}
      </main>
    </div>
  );
}
