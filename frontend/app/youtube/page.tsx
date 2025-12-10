'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';
import PointLossCarousel from './components/PointLossCarousel';

interface VideoInfo {
  title: string;
  duration: number;
  thumbnail?: string;
  uploader?: string;
}

interface HistoryRecord {
  record_id: string;
  video_id: string;
  video_title: string;
  video_url: string;
  thumbnail_url: string;
  player_focus: string | null;
  created_at: string;
  video_duration: number;
}

interface PointLoss {
  id: number;
  timestamp_seconds: number;
  timestamp_display: string;
  loss_type: string;
  description: string;
  technical_issue?: string;
  position_issue?: string;
  judgment_issue?: string;
  improvement: string;
  severity: number;
}

interface AnalysisResult {
  success: boolean;
  record_id?: string;
  video_info?: {
    title: string;
    url: string;
    duration: number;
    video_id: string;
  };
  analysis?: {
    raw_analysis: string;
    point_losses?: PointLoss[];
    structured_data?: any;
    sections?: Record<string, any>;
  };
  error?: string;
}

export default function YouTubeAnalysisPage() {
  const [url, setUrl] = useState('');
  const [playerFocus, setPlayerFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  // 載入歷史紀錄
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/youtube/history`);
      const data = await response.json();
      if (data.success) {
        setHistory(data.records || []);
      }
    } catch (e) {
      console.error('載入歷史紀錄失敗:', e);
    }
  };

  // 驗證 YouTube URL
  const validateUrl = async (inputUrl: string) => {
    if (!inputUrl) {
      setVideoInfo(null);
      return;
    }

    setValidating(true);
    try {
      const response = await fetch(`${apiUrl}/api/youtube/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: inputUrl })
      });
      
      const data = await response.json();
      
      if (data.valid && data.video_info) {
        setVideoInfo(data.video_info);
        setError(null);
      } else {
        setVideoInfo(null);
        if (inputUrl.length > 10) {
          setError('無效的 YouTube URL');
        }
      }
    } catch (e) {
      console.error('驗證失敗:', e);
    } finally {
      setValidating(false);
    }
  };

  // 分析影片
  const analyzeVideo = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(`${apiUrl}/api/youtube/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          player_focus: playerFocus || undefined
        })
      });

      const data: AnalysisResult = await response.json();
      
      if (data.success) {
        setResult(data);
        // 重新載入歷史紀錄
        fetchHistory();
      } else {
        setError(data.error || '分析失敗');
      }
    } catch (e) {
      setError('連線失敗，請確認後端服務是否運行');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* 標題 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            🎬 YouTube 比賽分析
          </h1>
          <p className="mt-3 text-slate-600">
            輸入 YouTube 桌球比賽影片，AI 將自動分析失分回放並提供改進建議
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* 左側：輸入區域 */}
          <div className="lg:col-span-2">
            {/* 輸入區域 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 mb-8">
              <div className="space-y-4">
                {/* YouTube URL 輸入 */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    YouTube 影片網址
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => {
                        setUrl(e.target.value);
                        validateUrl(e.target.value);
                      }}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-slate-800"
                    />
                {validating && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {/* 影片預覽 */}
            {videoInfo && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-2xl">▶</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-800 line-clamp-1">
                    {videoInfo.title}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {videoInfo.uploader} • {formatDuration(videoInfo.duration)}
                  </p>
                </div>
                <span className="text-green-600 font-medium">✓ 有效</span>
              </div>
            )}

            {/* 選手名稱輸入（可選） */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                關注選手（可選）
              </label>
              <input
                type="text"
                value={playerFocus}
                onChange={(e) => setPlayerFocus(e.target.value)}
                placeholder="例如：林昀儒、樊振東"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-slate-800"
              />
              <p className="mt-1 text-sm text-slate-500">
                指定要重點分析的選手，AI 將特別關注該選手的表現
              </p>
            </div>

            {/* 分析按鈕 */}
            <button
              onClick={analyzeVideo}
              disabled={!url || loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                !url || loading
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 text-white hover:shadow-lg hover:scale-[1.02]'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  分析中... 這可能需要幾分鐘
                </span>
              ) : (
                '🔍 開始分析比賽'
              )}
            </button>

            {/* 錯誤提示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                ❌ {error}
              </div>
            )}
          </div>
        </div>

        {/* 載入中提示 */}
        {loading && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-8 text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">正在分析比賽影片...</h3>
            <div className="text-slate-600 space-y-1">
              <p>📥 下載影片中...</p>
              <p>🤖 AI 正在觀看比賽...</p>
              <p>📊 分析失分原因...</p>
            </div>
            <p className="mt-4 text-sm text-slate-500">
              這可能需要 2-5 分鐘，請耐心等待
            </p>
          </div>
        )}

        {/* 分析結果 */}
        {result && result.success && (
          <div className="space-y-6">
            {/* 影片資訊 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  🎬 影片資訊
                </h2>
                {result.record_id && (
                  <Link
                    href={`/youtube/${result.record_id}`}
                    className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    查看完整報告 →
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">標題：</span>
                  <span className="text-slate-800 font-medium">{result.video_info?.title}</span>
                </div>
                <div>
                  <span className="text-slate-500">時長：</span>
                  <span className="text-slate-800 font-medium">
                    {result.video_info?.duration ? formatDuration(result.video_info.duration) : '未知'}
                  </span>
                </div>
              </div>
            </div>

            {/* 失誤點輪播分析 */}
            {result.analysis?.point_losses && result.analysis.point_losses.length > 0 && result.video_info?.video_id && (
              <PointLossCarousel
                pointLosses={result.analysis.point_losses}
                videoId={result.video_info.video_id}
                videoUrl={result.video_info.url || url}
              />
            )}

            {/* 完整分析報告（文字版） */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                📋 完整分析報告
              </h2>
              <div className="prose prose-slate max-w-none">
                <div 
                  className="whitespace-pre-wrap text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: result.analysis?.raw_analysis
                      ?.replace(/## /g, '<h2 class="text-lg font-bold mt-6 mb-3">')
                      ?.replace(/### /g, '<h3 class="text-md font-semibold mt-4 mb-2">')
                      ?.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      ?.replace(/\n/g, '<br/>') || ''
                  }}
                />
              </div>
            </div>
          </div>
        )}

            {/* 使用說明 */}
            {!result && !loading && (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="font-bold text-slate-800 mb-4">💡 使用說明</h3>
                <ul className="space-y-2 text-slate-600">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">1.</span>
                    貼上 YouTube 桌球比賽影片的網址
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">2.</span>
                    （可選）輸入要重點關注的選手名稱
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-500">3.</span>
                    點擊「開始分析」，AI 將自動分析失分原因並提供建議
                  </li>
                </ul>
                <div className="mt-4 p-3 bg-amber-50 rounded-lg text-sm text-amber-700">
                  ⚠️ 建議使用 10 分鐘以內的比賽精華片段，效果最佳
                </div>
              </div>
            )}
          </div>

          {/* 右側：歷史紀錄 */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  📚 分析紀錄
                </h2>
                <span className="text-sm text-slate-500">{history.length} 筆</span>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-2">📭</div>
                  <p>尚無分析紀錄</p>
                  <p className="text-sm mt-1">分析影片後將自動保存</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {history.map((record) => (
                    <Link
                      key={record.record_id}
                      href={`/youtube/${record.record_id}`}
                      className="block group"
                    >
                      <div className="bg-gradient-to-r from-slate-50 to-purple-50 rounded-xl p-3 hover:shadow-md transition-all hover:scale-[1.02] border border-transparent hover:border-purple-200">
                        {/* 縮圖 */}
                        <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-slate-200">
                          {record.thumbnail_url ? (
                            <img
                              src={record.thumbnail_url}
                              alt={record.video_title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-500 to-purple-500">
                              <span className="text-white text-3xl">🎬</span>
                            </div>
                          )}
                          {/* 時長標籤 */}
                          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                            {formatDuration(record.video_duration)}
                          </div>
                        </div>
                        
                        {/* 標題 */}
                        <h3 className="font-medium text-slate-800 text-sm line-clamp-2 group-hover:text-purple-600 transition-colors">
                          {record.video_title}
                        </h3>
                        
                        {/* 日期與關注選手 */}
                        <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
                          <span>{formatDate(record.created_at)}</span>
                          {record.player_focus && (
                            <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
                              {record.player_focus}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
