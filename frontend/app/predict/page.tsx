"use client";

import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";

interface Player {
  name: string;
  country: string;
  rank: number;
  style: string;
  rating: number;
  gender: string;
}

interface Prediction {
  player1: string;
  player2: string;
  player1_win_prob: number;
  player2_win_prob: number;
  predicted_winner: string;
  confidence: number;
  suggested_score: string;
  factors: {
    ranking: {
      player1_rank: number;
      player2_rank: number;
      advantage: string;
    };
    rating: {
      player1_rating: number;
      player2_rating: number;
      advantage: string;
    };
    head_to_head: {
      player1_wins: number;
      player2_wins: number;
      advantage: string | null;
    };
    recent_form: {
      player1_form: string;
      player2_form: string;
      advantage: string | null;
    };
    style_matchup: {
      player1_style: string;
      player2_style: string;
      matchup_score: number;
    };
  };
}

interface TacticSuggestion {
  category: string;
  title: string;
  description: string;
  priority: number;
  based_on: string;
}

interface Tactics {
  player: string;
  opponent: string;
  overall_strategy: string;
  key_points: string[];
  suggestions: TacticSuggestion[];
  opponent_weaknesses: string[];
  player_strengths: string[];
  risk_factors: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// 國旗 emoji 對照
const countryFlags: Record<string, string> = {
  CHN: "🇨🇳",
  JPN: "🇯🇵",
  KOR: "🇰🇷",
  TPE: "🇹🇼",
  GER: "🇩🇪",
  SWE: "🇸🇪",
  FRA: "🇫🇷",
  BRA: "🇧🇷",
  NGR: "🇳🇬",
  SLO: "🇸🇮",
  ROU: "🇷🇴",
  PUR: "🇵🇷",
};

export default function PredictPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [gender, setGender] = useState<"men" | "women">("men");
  const [player1, setPlayer1] = useState<string>("");
  const [player2, setPlayer2] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [tactics, setTactics] = useState<Tactics | null>(null);
  const [activeTab, setActiveTab] = useState<"prediction" | "tactics">(
    "prediction"
  );
  const [error, setError] = useState<string>("");

  // 載入選手列表
  useEffect(() => {
    fetchPlayers();
  }, [gender]);

  const fetchPlayers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/predict/players?gender=${gender}`);
      const data = await res.json();
      if (data.success) {
        setPlayers(data.players);
        // 重設選擇
        setPlayer1("");
        setPlayer2("");
        setPrediction(null);
        setTactics(null);
      }
    } catch (err) {
      console.error("Failed to fetch players:", err);
    }
  };

  const handlePredict = async () => {
    if (!player1 || !player2) {
      setError("請選擇兩位選手");
      return;
    }
    if (player1 === player2) {
      setError("請選擇兩位不同的選手");
      return;
    }

    setError("");
    setLoading(true);
    setPrediction(null);
    setTactics(null);

    try {
      // 同時獲取預測和戰術建議
      const [predRes, tacticsRes] = await Promise.all([
        fetch(`${API_URL}/api/predict/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player1, player2 }),
        }),
        fetch(`${API_URL}/api/predict/tactics`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player: player1, opponent: player2 }),
        }),
      ]);

      const predData = await predRes.json();
      const tacticsData = await tacticsRes.json();

      if (predData.success) {
        setPrediction(predData.prediction);
      } else {
        setError(predData.error || "預測失敗");
      }

      if (tacticsData.success) {
        setTactics(tacticsData.tactics);
      }
    } catch (err) {
      setError("連接伺服器失敗");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPlayerInfo = (name: string): Player | undefined => {
    return players.find((p) => p.name === name);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* 標題 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🏓 WTT 比賽預測
          </h1>
          <p className="text-gray-400">
            基於機器學習的比賽結果預測與戰術建議
          </p>
        </div>

        {/* 選手選擇區 */}
        <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 mb-8">
          {/* 性別切換 */}
          <div className="flex justify-center mb-6">
            <div className="bg-gray-700/50 rounded-lg p-1 inline-flex">
              <button
                onClick={() => setGender("men")}
                className={`px-6 py-2 rounded-md transition ${
                  gender === "men"
                    ? "bg-blue-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                男子
              </button>
              <button
                onClick={() => setGender("women")}
                className={`px-6 py-2 rounded-md transition ${
                  gender === "women"
                    ? "bg-pink-600 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                女子
              </button>
            </div>
          </div>

          {/* 選手選擇 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Player 1 */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                選手 1
              </label>
              <select
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">選擇選手...</option>
                {players.map((p) => (
                  <option key={p.name} value={p.name} disabled={p.name === player2}>
                    {countryFlags[p.country] || "🏳️"} {p.name} (#{p.rank})
                  </option>
                ))}
              </select>
              {player1 && getPlayerInfo(player1) && (
                <div className="mt-2 text-sm text-gray-400">
                  打法: {getPlayerInfo(player1)?.style} | 評分:{" "}
                  {getPlayerInfo(player1)?.rating}
                </div>
              )}
            </div>

            {/* VS */}
            <div className="flex justify-center">
              <span className="text-4xl font-bold text-gray-500">VS</span>
            </div>

            {/* Player 2 */}
            <div>
              <label className="block text-gray-400 text-sm mb-2">
                選手 2
              </label>
              <select
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">選擇選手...</option>
                {players.map((p) => (
                  <option key={p.name} value={p.name} disabled={p.name === player1}>
                    {countryFlags[p.country] || "🏳️"} {p.name} (#{p.rank})
                  </option>
                ))}
              </select>
              {player2 && getPlayerInfo(player2) && (
                <div className="mt-2 text-sm text-gray-400">
                  打法: {getPlayerInfo(player2)?.style} | 評分:{" "}
                  {getPlayerInfo(player2)?.rating}
                </div>
              )}
            </div>
          </div>

          {/* 預測按鈕 */}
          <div className="flex justify-center mt-6">
            <button
              onClick={handlePredict}
              disabled={loading || !player1 || !player2}
              className={`px-8 py-3 rounded-lg font-bold text-lg transition ${
                loading || !player1 || !player2
                  ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500"
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  分析中...
                </span>
              ) : (
                "🔮 開始預測"
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 text-center text-red-400">{error}</div>
          )}
        </div>

        {/* 預測結果區 */}
        {prediction && (
          <div className="space-y-6">
            {/* Tab 切換 */}
            <div className="flex justify-center">
              <div className="bg-gray-800/50 rounded-lg p-1 inline-flex">
                <button
                  onClick={() => setActiveTab("prediction")}
                  className={`px-6 py-2 rounded-md transition ${
                    activeTab === "prediction"
                      ? "bg-blue-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  📊 預測結果
                </button>
                <button
                  onClick={() => setActiveTab("tactics")}
                  className={`px-6 py-2 rounded-md transition ${
                    activeTab === "tactics"
                      ? "bg-green-600 text-white"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  🎯 戰術建議
                </button>
              </div>
            </div>

            {/* 預測結果 Tab */}
            {activeTab === "prediction" && (
              <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6">
                {/* 勝率對比 */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {(prediction.player1_win_prob * 100).toFixed(1)}%
                    </div>
                    <div className="text-gray-400">{prediction.player1}</div>
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg text-gray-500">預測比分</div>
                      <div className="text-3xl font-bold text-yellow-400">
                        {prediction.suggested_score}
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">
                      {(prediction.player2_win_prob * 100).toFixed(1)}%
                    </div>
                    <div className="text-gray-400">{prediction.player2}</div>
                  </div>
                </div>

                {/* 勝率進度條 */}
                <div className="mb-8">
                  <div className="h-4 bg-gray-700 rounded-full overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                      style={{
                        width: `${prediction.player1_win_prob * 100}%`,
                      }}
                    />
                    <div
                      className="bg-gradient-to-r from-red-400 to-red-500 transition-all duration-500"
                      style={{
                        width: `${prediction.player2_win_prob * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* 預測勝者 */}
                <div className="text-center mb-8">
                  <div className="inline-block bg-gradient-to-r from-yellow-600 to-yellow-500 rounded-lg px-6 py-3">
                    <span className="text-lg">🏆 預測勝者: </span>
                    <span className="text-xl font-bold">
                      {prediction.predicted_winner}
                    </span>
                    <span className="text-sm ml-2 opacity-75">
                      (信心度: {(prediction.confidence * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* 因素分析 */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* 排名 */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-2">📊 世界排名</div>
                    <div className="flex justify-between items-center">
                      <span className="text-white">
                        #{prediction.factors.ranking.player1_rank}
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          prediction.factors.ranking.advantage ===
                          prediction.player1
                            ? "bg-blue-600"
                            : "bg-red-600"
                        }`}
                      >
                        ↑ {prediction.factors.ranking.advantage}
                      </span>
                      <span className="text-white">
                        #{prediction.factors.ranking.player2_rank}
                      </span>
                    </div>
                  </div>

                  {/* 評分 */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-2">⭐ 實力評分</div>
                    <div className="flex justify-between items-center">
                      <span className="text-white">
                        {prediction.factors.rating.player1_rating}
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          prediction.factors.rating.advantage ===
                          prediction.player1
                            ? "bg-blue-600"
                            : "bg-red-600"
                        }`}
                      >
                        ↑ {prediction.factors.rating.advantage}
                      </span>
                      <span className="text-white">
                        {prediction.factors.rating.player2_rating}
                      </span>
                    </div>
                  </div>

                  {/* H2H */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-2">🤝 歷史對戰</div>
                    <div className="flex justify-between items-center">
                      <span className="text-white">
                        {prediction.factors.head_to_head.player1_wins} 勝
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          prediction.factors.head_to_head.advantage ===
                          prediction.player1
                            ? "bg-blue-600"
                            : prediction.factors.head_to_head.advantage ===
                              prediction.player2
                            ? "bg-red-600"
                            : "bg-gray-600"
                        }`}
                      >
                        {prediction.factors.head_to_head.advantage
                          ? `↑ ${prediction.factors.head_to_head.advantage}`
                          : "平手"}
                      </span>
                      <span className="text-white">
                        {prediction.factors.head_to_head.player2_wins} 勝
                      </span>
                    </div>
                  </div>

                  {/* 近期狀態 */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-2">📈 近期狀態</div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-white font-mono">
                        {prediction.factors.recent_form.player1_form}
                      </span>
                      <span
                        className={`px-2 py-1 rounded ${
                          prediction.factors.recent_form.advantage ===
                          prediction.player1
                            ? "bg-blue-600"
                            : prediction.factors.recent_form.advantage ===
                              prediction.player2
                            ? "bg-red-600"
                            : "bg-gray-600"
                        }`}
                      >
                        {prediction.factors.recent_form.advantage
                          ? `↑ ${prediction.factors.recent_form.advantage}`
                          : "相當"}
                      </span>
                      <span className="text-white font-mono">
                        {prediction.factors.recent_form.player2_form}
                      </span>
                    </div>
                  </div>

                  {/* 打法 */}
                  <div className="bg-gray-700/50 rounded-lg p-4 md:col-span-2">
                    <div className="text-gray-400 text-sm mb-2">🏓 打法對決</div>
                    <div className="flex justify-between items-center">
                      <span className="text-white">
                        {prediction.factors.style_matchup.player1_style}
                      </span>
                      <span
                        className={`text-sm px-2 py-1 rounded ${
                          prediction.factors.style_matchup.matchup_score > 0
                            ? "bg-blue-600"
                            : prediction.factors.style_matchup.matchup_score < 0
                            ? "bg-red-600"
                            : "bg-gray-600"
                        }`}
                      >
                        {prediction.factors.style_matchup.matchup_score > 0
                          ? `${prediction.player1} 有優勢`
                          : prediction.factors.style_matchup.matchup_score < 0
                          ? `${prediction.player2} 有優勢`
                          : "無明顯相剋"}
                      </span>
                      <span className="text-white">
                        {prediction.factors.style_matchup.player2_style}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 戰術建議 Tab */}
            {activeTab === "tactics" && tactics && (
              <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white">
                    🎯 {tactics.player} vs {tactics.opponent} 戰術分析
                  </h3>
                </div>

                {/* 整體策略 */}
                <div className="bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg p-4 mb-6">
                  <div className="text-yellow-400 font-bold mb-2">
                    📋 整體策略
                  </div>
                  <p className="text-white">{tactics.overall_strategy}</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 關鍵要點 */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-green-400 font-bold mb-3">
                      🔑 關鍵要點
                    </div>
                    <ul className="space-y-2">
                      {tactics.key_points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-green-400">•</span>
                          <span className="text-white">{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 選手優勢 */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-blue-400 font-bold mb-3">
                      💪 你的優勢
                    </div>
                    <ul className="space-y-2">
                      {tactics.player_strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-blue-400">✓</span>
                          <span className="text-white">{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 對手弱點 */}
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-red-400 font-bold mb-3">
                      ⚠️ 對手弱點
                    </div>
                    <ul className="space-y-2">
                      {tactics.opponent_weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-red-400">•</span>
                          <span className="text-white">{w}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 風險因素 */}
                  {tactics.risk_factors.length > 0 && (
                    <div className="bg-gray-700/50 rounded-lg p-4">
                      <div className="text-orange-400 font-bold mb-3">
                        ⚡ 風險因素
                      </div>
                      <ul className="space-y-2">
                        {tactics.risk_factors.map((r, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-orange-400">!</span>
                            <span className="text-white">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 具體建議 */}
                <div className="mt-6">
                  <div className="text-purple-400 font-bold mb-4">
                    💡 具體戰術建議
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tactics.suggestions.map((s, i) => (
                      <div
                        key={i}
                        className="bg-gray-700/50 rounded-lg p-4 border-l-4"
                        style={{
                          borderLeftColor:
                            s.category === "發球"
                              ? "#3b82f6"
                              : s.category === "接發球"
                              ? "#10b981"
                              : s.category === "相持"
                              ? "#f59e0b"
                              : s.category === "心理"
                              ? "#ec4899"
                              : "#8b5cf6",
                        }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">
                            {s.category}
                          </span>
                          <span className="text-white font-medium">
                            {s.title}
                          </span>
                        </div>
                        <p className="text-gray-300 text-sm">{s.description}</p>
                        <div className="text-xs text-gray-500 mt-2">
                          依據: {s.based_on}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
