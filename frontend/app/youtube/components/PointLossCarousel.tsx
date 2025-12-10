'use client';

import { useState } from 'react';

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

interface PointLossCarouselProps {
  pointLosses: PointLoss[];
  videoId: string;
  videoUrl: string;
}

export default function PointLossCarousel({ pointLosses, videoId, videoUrl }: PointLossCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [key, setKey] = useState(0);

  if (!pointLosses || pointLosses.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 text-center">
        <p className="text-slate-500">沒有找到失誤點分析</p>
      </div>
    );
  }

  const currentLoss = pointLosses[currentIndex];
  
  // 產生 YouTube 嵌入 URL - 循環播放失誤片段
  const startTime = Math.max(0, currentLoss.timestamp_seconds - 2);
  const endTime = currentLoss.timestamp_seconds + 3;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?start=${startTime}&end=${endTime}&autoplay=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&mute=1&showinfo=0&iv_load_policy=3&disablekb=1`;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? pointLosses.length - 1 : prev - 1));
    setKey(k => k + 1);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === pointLosses.length - 1 ? 0 : prev + 1));
    setKey(k => k + 1);
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
    setKey(k => k + 1);
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return 'bg-red-500';
    if (severity >= 3) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  const getSeverityText = (severity: number) => {
    if (severity >= 4) return '嚴重';
    if (severity >= 3) return '中等';
    return '輕微';
  };

  // 格式化時間顯示
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const hasIssues = currentLoss.technical_issue || currentLoss.position_issue || currentLoss.judgment_issue;

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden">
      {/* 標題列 */}
      <div className="bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🎯 失誤點分析
          </h2>
          <div className="text-white/80 text-sm">
            {currentIndex + 1} / {pointLosses.length}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* 影片回顧區 - 全寬大畫面 */}
        <div className="mb-6">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black shadow-2xl">
            {/* iframe 容器 - 放大並裁切掉 YouTube logo */}
            <div className="absolute inset-0 overflow-hidden">
              <iframe
                key={`${videoId}-${currentIndex}-${key}`}
                src={embedUrl}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] pointer-events-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
            
            {/* 時間標籤 - 更醒目 */}
            <div className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-3">
              <span className="text-white animate-pulse text-lg">●</span>
              <span className="font-bold text-lg font-mono tracking-wider">
                {formatTime(currentLoss.timestamp_seconds)}
              </span>
            </div>
            
            {/* 嚴重程度標籤 */}
            <div className={`absolute top-4 right-4 ${getSeverityColor(currentLoss.severity)} text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg`}>
              {getSeverityText(currentLoss.severity)}
            </div>

            {/* 循環播放標籤 */}
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2">
              🔄 自動循環播放
            </div>
            
            {/* 失誤類型標籤 */}
            <div className="absolute bottom-4 right-4 bg-red-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-bold shadow-lg">
              {currentLoss.loss_type}
            </div>
          </div>
        </div>

        {/* 失誤分析卡片 */}
        <div className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-xl p-5 border border-purple-100">
          {/* 描述 */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-500 mb-2">📝 情況描述</h4>
            <p className="text-slate-700 bg-white rounded-lg p-3 shadow-sm">{currentLoss.description}</p>
          </div>

          {/* 問題分析 - 橫向排列 */}
          {hasIssues && (
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              {currentLoss.technical_issue && (
                <div className="bg-orange-50 border-l-4 border-orange-400 rounded-r-lg p-3">
                  <h4 className="text-xs font-bold text-orange-600 mb-1">🔧 技術問題</h4>
                  <p className="text-sm text-orange-800">{currentLoss.technical_issue}</p>
                </div>
              )}
              
              {currentLoss.position_issue && (
                <div className="bg-blue-50 border-l-4 border-blue-400 rounded-r-lg p-3">
                  <h4 className="text-xs font-bold text-blue-600 mb-1">📍 站位問題</h4>
                  <p className="text-sm text-blue-800">{currentLoss.position_issue}</p>
                </div>
              )}
              
              {currentLoss.judgment_issue && (
                <div className="bg-purple-50 border-l-4 border-purple-400 rounded-r-lg p-3">
                  <h4 className="text-xs font-bold text-purple-600 mb-1">🧠 判斷失誤</h4>
                  <p className="text-sm text-purple-800">{currentLoss.judgment_issue}</p>
                </div>
              )}
            </div>
          )}

          {/* 改進建議 */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="text-sm font-bold text-green-700 mb-2 flex items-center gap-2">
              ✨ 改進建議
            </h4>
            <p className="text-green-800">{currentLoss.improvement}</p>
          </div>
        </div>

        {/* 導航控制 */}
        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
          <button
            onClick={goToPrevious}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-medium"
          >
            <span>←</span>
            <span>上一個</span>
          </button>

          <div className="flex items-center gap-2 overflow-x-auto px-4">
            {pointLosses.map((loss, index) => (
              <button
                key={loss.id}
                onClick={() => goToIndex(index)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                  index === currentIndex
                    ? 'bg-purple-500 text-white scale-110 shadow-lg'
                    : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <button
            onClick={goToNext}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-medium"
          >
            <span>下一個</span>
            <span>→</span>
          </button>
        </div>

        {/* 時間軸快速跳轉 */}
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-slate-600 mb-3">⏱️ 時間軸快速跳轉</h4>
          <div className="flex flex-wrap gap-2">
            {pointLosses.map((loss, index) => (
              <button
                key={loss.id}
                onClick={() => goToIndex(index)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                  index === currentIndex
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-600'
                }`}
              >
                <span className="font-mono">{formatTime(loss.timestamp_seconds)}</span>
                <span className="ml-2 text-xs opacity-75">{loss.loss_type}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
