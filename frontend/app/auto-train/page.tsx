"use client";

import { useState, useEffect, useCallback } from "react";
import Navbar from "../components/Navbar";

interface TrainingClip {
  clip_id: string;
  source_video: string;
  source_type: string;
  start_time: number;
  end_time: number;
  label: string;
  label_confidence: number;
  description: string;
  error_type: string | null;
  status: string;
  created_at: string;
  processed_at: string | null;
  skeleton_path: string | null;
}

interface Statistics {
  total: number;
  by_status: Record<string, number>;
  by_label: Record<string, number>;
  by_source: Record<string, number>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const labelColors: Record<string, string> = {
  bad: "bg-red-500",
  good: "bg-green-500",
  normal: "bg-yellow-500",
};

const statusColors: Record<string, string> = {
  pending: "bg-orange-500",
  approved: "bg-blue-500",
  rejected: "bg-gray-500",
  processed: "bg-green-600",
};

const labelNames: Record<string, string> = {
  bad: "失誤",
  good: "得分",
  normal: "一般",
};

export default function AutoTrainPage() {
  const [clips, setClips] = useState<TrainingClip[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());

  const fetchClips = useCallback(async () => {
    try {
      const url =
        filterStatus === "all"
          ? `${API_URL}/api/auto-train/clips`
          : `${API_URL}/api/auto-train/clips?status=${filterStatus}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setClips(data.clips);
      }
    } catch (err) {
      console.error("Failed to fetch clips:", err);
    }
  }, [filterStatus]);

  const fetchStatistics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auto-train/statistics`);
      const data = await res.json();
      if (data.success) {
        setStatistics(data.statistics);
      }
    } catch (err) {
      console.error("Failed to fetch statistics:", err);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchClips(), fetchStatistics()]);
      setLoading(false);
    };
    loadData();
  }, [fetchClips]);

  const handleApprove = async (clipId: string, label?: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auto-train/clips/${clipId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(label ? { label } : {}),
      });
      const data = await res.json();
      if (data.success) {
        await fetchClips();
        await fetchStatistics();
      }
    } catch (err) {
      console.error("Failed to approve:", err);
    }
  };

  const handleReject = async (clipId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auto-train/clips/${clipId}/reject`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        await fetchClips();
        await fetchStatistics();
      }
    } catch (err) {
      console.error("Failed to reject:", err);
    }
  };

  const handleUpdateLabel = async (clipId: string, label: string) => {
    try {
      const res = await fetch(`${API_URL}/api/auto-train/clips/${clipId}/label`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchClips();
      }
    } catch (err) {
      console.error("Failed to update label:", err);
    }
  };

  const handleProcess = async (clipId: string) => {
    setProcessing(clipId);
    try {
      const res = await fetch(`${API_URL}/api/auto-train/clips/${clipId}/process`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        await fetchClips();
        await fetchStatistics();
      } else {
        alert(`處理失敗: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to process:", err);
      alert("處理失敗");
    } finally {
      setProcessing(null);
    }
  };

  const handleProcessAll = async () => {
    if (!confirm("確定要處理所有已核准的片段嗎？這可能需要一些時間。")) {
      return;
    }
    
    setProcessing("all");
    try {
      const res = await fetch(`${API_URL}/api/auto-train/process-all`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        alert(`處理完成！成功: ${data.success}，失敗: ${data.failed}`);
        await fetchClips();
        await fetchStatistics();
      }
    } catch (err) {
      console.error("Failed to process all:", err);
    } finally {
      setProcessing(null);
    }
  };

  const handleCopyToTraining = async () => {
    if (!confirm("確定要將處理完成的資料複製到訓練資料夾嗎？")) {
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/auto-train/copy-to-training`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        alert(`複製完成！\n失誤: ${data.copied.bad}\n得分: ${data.copied.good}\n一般: ${data.copied.normal}`);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleBatchApprove = async () => {
    for (const clipId of selectedClips) {
      await handleApprove(clipId);
    }
    setSelectedClips(new Set());
  };

  const handleBatchReject = async () => {
    for (const clipId of selectedClips) {
      await handleReject(clipId);
    }
    setSelectedClips(new Set());
  };

  const toggleSelect = (clipId: string) => {
    const newSelected = new Set(selectedClips);
    if (newSelected.has(clipId)) {
      newSelected.delete(clipId);
    } else {
      newSelected.add(clipId);
    }
    setSelectedClips(newSelected);
  };

  const selectAll = () => {
    const pendingIds = clips.filter((c) => c.status === "pending").map((c) => c.clip_id);
    setSelectedClips(new Set(pendingIds));
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getYouTubeEmbedUrl = (clip: TrainingClip): string => {
    const match = clip.source_video.match(/[?&]v=([^&]+)/);
    const videoId = match ? match[1] : "";
    const start = Math.floor(clip.start_time);
    return `https://www.youtube.com/embed/${videoId}?start=${start}&autoplay=0`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* 標題 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🎯 自動訓練資料管理
          </h1>
          <p className="text-gray-400">
            審核 YouTube 分析的失分片段，建立訓練資料集
          </p>
        </div>

        {/* 統計卡片 */}
        {statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-gray-800/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-white">{statistics.total}</div>
              <div className="text-gray-400 text-sm">總片段</div>
            </div>
            <div className="bg-orange-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-orange-400">
                {statistics.by_status.pending || 0}
              </div>
              <div className="text-gray-400 text-sm">待審核</div>
            </div>
            <div className="bg-blue-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">
                {statistics.by_status.approved || 0}
              </div>
              <div className="text-gray-400 text-sm">已核准</div>
            </div>
            <div className="bg-green-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-green-400">
                {statistics.by_status.processed || 0}
              </div>
              <div className="text-gray-400 text-sm">已處理</div>
            </div>
            <div className="bg-red-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-red-400">
                {statistics.by_label.bad || 0}
              </div>
              <div className="text-gray-400 text-sm">失誤</div>
            </div>
            <div className="bg-emerald-900/50 rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-emerald-400">
                {statistics.by_label.good || 0}
              </div>
              <div className="text-gray-400 text-sm">得分</div>
            </div>
          </div>
        )}

        {/* 操作列 */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
          {/* 篩選 */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400">篩選:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-700 text-white rounded px-3 py-2"
            >
              <option value="all">全部</option>
              <option value="pending">待審核</option>
              <option value="approved">已核准</option>
              <option value="processed">已處理</option>
              <option value="rejected">已拒絕</option>
            </select>
          </div>

          {/* 批次操作 */}
          <div className="flex items-center gap-2">
            {selectedClips.size > 0 && (
              <>
                <span className="text-gray-400">
                  已選擇 {selectedClips.size} 個
                </span>
                <button
                  onClick={handleBatchApprove}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  批次核准
                </button>
                <button
                  onClick={handleBatchReject}
                  className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                >
                  批次拒絕
                </button>
              </>
            )}
            <button
              onClick={selectAll}
              className="px-3 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
            >
              全選待審核
            </button>
          </div>

          {/* 處理操作 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleProcessAll}
              disabled={processing === "all"}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50"
            >
              {processing === "all" ? "處理中..." : "🔄 處理所有核准"}
            </button>
            <button
              onClick={handleCopyToTraining}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-500"
            >
              📁 複製到訓練資料夾
            </button>
          </div>
        </div>

        {/* 片段列表 */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <div className="text-gray-400 mt-4">載入中...</div>
          </div>
        ) : clips.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-6xl mb-4">📭</div>
            <div>尚無訓練片段</div>
            <div className="text-sm mt-2">
              使用 YouTube 分析功能後，失分片段會自動匯入這裡
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {clips.map((clip) => (
              <div
                key={clip.clip_id}
                className={`bg-gray-800/50 rounded-xl overflow-hidden border-2 ${
                  selectedClips.has(clip.clip_id)
                    ? "border-purple-500"
                    : "border-transparent"
                }`}
              >
                {/* 影片預覽 */}
                <div className="aspect-video bg-black relative">
                  {clip.source_type === "youtube" && (
                    <iframe
                      src={getYouTubeEmbedUrl(clip)}
                      className="w-full h-full"
                      allowFullScreen
                    />
                  )}
                  {/* 標籤 */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    <span
                      className={`px-2 py-1 rounded text-xs text-white ${
                        labelColors[clip.label] || "bg-gray-500"
                      }`}
                    >
                      {labelNames[clip.label] || clip.label}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs text-white ${
                        statusColors[clip.status] || "bg-gray-500"
                      }`}
                    >
                      {clip.status}
                    </span>
                  </div>
                  {/* 選擇框 */}
                  {clip.status === "pending" && (
                    <button
                      onClick={() => toggleSelect(clip.clip_id)}
                      className={`absolute top-2 right-2 w-6 h-6 rounded border-2 ${
                        selectedClips.has(clip.clip_id)
                          ? "bg-purple-500 border-purple-500"
                          : "border-white bg-transparent"
                      }`}
                    >
                      {selectedClips.has(clip.clip_id) && (
                        <span className="text-white">✓</span>
                      )}
                    </button>
                  )}
                </div>

                {/* 資訊 */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400 text-sm">
                      ID: {clip.clip_id}
                    </span>
                    <span className="text-gray-400 text-sm">
                      {formatTime(clip.start_time)} - {formatTime(clip.end_time)}
                    </span>
                  </div>
                  
                  {clip.error_type && (
                    <div className="text-red-400 font-medium mb-1">
                      {clip.error_type}
                    </div>
                  )}
                  
                  <div className="text-gray-300 text-sm mb-3">
                    {clip.description}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>信心度: {(clip.label_confidence * 100).toFixed(0)}%</span>
                    <span>{new Date(clip.created_at).toLocaleDateString()}</span>
                  </div>

                  {/* 操作按鈕 */}
                  {clip.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(clip.clip_id)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 text-sm"
                      >
                        ✓ 核准
                      </button>
                      <button
                        onClick={() => handleReject(clip.clip_id)}
                        className="flex-1 px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 text-sm"
                      >
                        ✗ 拒絕
                      </button>
                      <select
                        value={clip.label}
                        onChange={(e) => handleUpdateLabel(clip.clip_id, e.target.value)}
                        className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
                      >
                        <option value="bad">失誤</option>
                        <option value="good">得分</option>
                        <option value="normal">一般</option>
                      </select>
                    </div>
                  )}

                  {clip.status === "approved" && (
                    <button
                      onClick={() => handleProcess(clip.clip_id)}
                      disabled={processing === clip.clip_id}
                      className="w-full px-3 py-2 bg-purple-600 text-white rounded hover:bg-purple-500 disabled:opacity-50 text-sm"
                    >
                      {processing === clip.clip_id ? "處理中..." : "🔄 處理 (下載+骨架)"}
                    </button>
                  )}

                  {clip.status === "processed" && (
                    <div className="text-center text-green-400 text-sm">
                      ✓ 已處理完成
                    </div>
                  )}

                  {clip.status === "rejected" && (
                    <div className="text-center text-gray-500 text-sm">
                      已拒絕
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
