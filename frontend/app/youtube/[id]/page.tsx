'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import PointLossCarousel from '../components/PointLossCarousel';

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

interface AnalysisRecord {
  record_id: string;
  video_id: string;
  video_title: string;
  video_url: string;
  video_duration: number;
  thumbnail_url: string;
  player_focus: string | null;
  analysis_result: {
    raw_analysis: string;
    structured_data?: {
      match_overview?: any;
      point_losses?: PointLoss[];
      strengths?: any[];
      weaknesses?: any[];
      training_suggestions?: any[];
      summary?: any;
    };
    point_losses?: PointLoss[];
    sections?: Record<string, any>;
  };
  created_at: string;
}

export default function AnalysisDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recordId = params.id as string;
  
  const [record, setRecord] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchRecord();
  }, [recordId]);

  const fetchRecord = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/youtube/history/${recordId}`);
      const data = await response.json();
      
      if (data.success) {
        setRecord(data.record);
      } else {
        setError(data.error || '載入失敗');
      }
    } catch (e) {
      setError('連線失敗');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('確定要刪除這筆分析紀錄嗎？')) return;
    
    try {
      await fetch(`${apiUrl}/api/youtube/history/${recordId}`, {
        method: 'DELETE'
      });
      router.push('/youtube');
    } catch (e) {
      alert('刪除失敗');
    }
  };

  const handleImportToTraining = async () => {
    if (!record) return;
    
    setImporting(true);
    setImportResult(null);
    
    try {
      // 轉換 point_losses 格式
      const pointLosses = record.analysis_result?.point_losses?.map(pl => ({
        timestamp: pl.timestamp_display,
        error_type: pl.loss_type,
        description: pl.description
      })) || [];

      const analysisData = {
        video_url: record.video_url,
        point_losses: pointLosses
      };

      const response = await fetch(`${apiUrl}/api/auto-train/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_result: analysisData,
          auto_approve: false
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setImportResult({ success: true, count: data.imported_count });
      } else {
        setImportResult({ success: false, error: data.error });
      }
    } catch (e) {
      setImportResult({ success: false, error: '連線失敗' });
    } finally {
      setImporting(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 text-lg">❌ {error || '找不到此紀錄'}</p>
            <Link href="/youtube" className="mt-4 inline-block text-purple-600 hover:underline">
              ← 返回分析頁面
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* 返回按鈕 */}
        <div className="mb-6">
          <Link 
            href="/youtube" 
            className="inline-flex items-center gap-2 text-slate-600 hover:text-purple-600 transition-colors"
          >
            <span>←</span>
            <span>返回分析頁面</span>
          </Link>
        </div>

        {/* 影片資訊卡片 */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden mb-8">
          <div className="md:flex">
            {/* 縮圖 */}
            <div className="md:w-2/5 relative">
              <img 
                src={record.thumbnail_url} 
                alt={record.video_title}
                className="w-full h-64 md:h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${record.video_id}/hqdefault.jpg`;
                }}
              />
              <a 
                href={record.video_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
              >
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-3xl ml-1">▶</span>
                </div>
              </a>
            </div>
            
            {/* 資訊 */}
            <div className="md:w-3/5 p-6">
              <h1 className="text-2xl font-bold text-slate-800 mb-4 line-clamp-2">
                {record.video_title}
              </h1>
              
              <div className="space-y-3 text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⏱️</span>
                  <span>影片長度：{formatDuration(record.video_duration)}</span>
                </div>
                
                {record.player_focus && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    <span>關注選手：<strong className="text-purple-600">{record.player_focus}</strong></span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <span className="text-lg">📅</span>
                  <span>分析時間：{formatDate(record.created_at)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔗</span>
                  <a 
                    href={record.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                  >
                    在 YouTube 觀看
                  </a>
                </div>
              </div>

              {/* 操作按鈕 */}
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={record.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <span>▶</span> 觀看影片
                </a>
                <button
                  onClick={handleImportToTraining}
                  disabled={importing}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {importing ? '匯入中...' : '🎯 匯入訓練'}
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-red-100 hover:text-red-600 transition-colors"
                >
                  🗑️ 刪除紀錄
                </button>
              </div>
              
              {/* 匯入結果 */}
              {importResult && (
                <div className={`mt-4 p-3 rounded-lg text-sm ${
                  importResult.success 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {importResult.success 
                    ? `✅ 已匯入 ${importResult.count} 個失分片段到訓練資料！` 
                    : `❌ 匯入失敗: ${importResult.error}`}
                  {importResult.success && (
                    <Link href="/auto-train" className="ml-2 underline hover:no-underline">
                      前往審核 →
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 失誤點輪播分析 */}
        {record.analysis_result?.point_losses && record.analysis_result.point_losses.length > 0 && (
          <div className="mb-8">
            <PointLossCarousel
              pointLosses={record.analysis_result.point_losses}
              videoId={record.video_id}
              videoUrl={record.video_url}
            />
          </div>
        )}

        {/* 分析報告（文字版） */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
            <span className="text-3xl">📋</span>
            完整分析報告
          </h2>
          
          <div className="prose prose-slate max-w-none">
            <div 
              className="whitespace-pre-wrap text-slate-700 leading-relaxed analysis-content"
              dangerouslySetInnerHTML={{ 
                __html: record.analysis_result?.raw_analysis
                  ?.replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-8 mb-4 text-purple-700 border-b pb-2">$1</h2>')
                  ?.replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-6 mb-3 text-slate-800">$1</h3>')
                  ?.replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
                  ?.replace(/- (.*)/g, '<li class="ml-4">$1</li>')
                  ?.replace(/(\d+)\. (.*)/g, '<li class="ml-4"><span class="font-semibold">$1.</span> $2</li>')
                  || '<p class="text-slate-500">無分析內容</p>'
              }}
            />
          </div>
        </div>

        {/* 底部操作 */}
        <div className="mt-8 flex justify-between items-center">
          <Link 
            href="/youtube" 
            className="text-purple-600 hover:underline"
          >
            ← 返回分析頁面
          </Link>
          
          <Link
            href="/youtube"
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:shadow-lg transition-shadow"
          >
            🎬 分析新影片
          </Link>
        </div>
      </main>
    </div>
  );
}
