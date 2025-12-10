'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../components/Navbar';

interface TrainingConfig {
  model_type: string;
  epochs: number;
  batch_size: number;
  learning_rate: number;
  use_augmentation: boolean;
  augment_factor: number;
}

interface TrainingProgress {
  status: string;
  current_epoch?: number;
  total_epochs?: number;
  accuracy?: number;
  val_accuracy?: number;
  loss?: number;
  val_loss?: number;
  message?: string;
}

interface TrainingClip {
  id: string;
  player_name: string;
  label: string;
  description: string;
  clip_path: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

function TrainPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'train' | 'dataset'>('train');
  
  useEffect(() => {
    if (tabParam === 'dataset') {
      setActiveTab('dataset');
    }
  }, [tabParam]);

  const [config, setConfig] = useState<TrainingConfig>({
    model_type: 'basic',
    epochs: 150,
    batch_size: 32,
    learning_rate: 0.001,
    use_augmentation: true,
    augment_factor: 3,
  });

  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState<TrainingProgress | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  // Dataset State
  const [clips, setClips] = useState<TrainingClip[]>([]);
  const [isLoadingClips, setIsLoadingClips] = useState(false);
  const [datasetStats, setDatasetStats] = useState({ total: 0, approved: 0, pending: 0 });

  useEffect(() => {
    if (activeTab === 'dataset') {
      fetchClips();
    }
  }, [activeTab]);

  const fetchClips = async () => {
    setIsLoadingClips(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auto-train/clips`);
      const data = await response.json();
      if (data.success) {
        setClips(data.clips);
        // Calculate stats
        const stats = data.clips.reduce((acc: any, clip: TrainingClip) => {
          acc.total++;
          if (clip.status === 'approved') acc.approved++;
          if (clip.status === 'pending') acc.pending++;
          return acc;
        }, { total: 0, approved: 0, pending: 0 });
        setDatasetStats(stats);
      }
    } catch (err) {
      console.error('Failed to fetch clips:', err);
    } finally {
      setIsLoadingClips(false);
    }
  };

  const [isAutoLabeling, setIsAutoLabeling] = useState(false);

  const handleAutoLabel = async () => {
    setIsAutoLabeling(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auto-label`, {
        method: 'POST',
      });
      const data = await response.json();
      alert(`自動標註完成！\n處理: ${data.processed}\nGood: ${data.good}\nNormal: ${data.normal}\nBad: ${data.bad}`);
      fetchClips(); // Refresh list
    } catch (error) {
      console.error('Auto label error:', error);
      alert('自動標註失敗');
    } finally {
      setIsAutoLabeling(false);
    }
  };

  const handleDeleteClip = async (clipId: string) => {
    if (!confirm('確定要刪除此片段嗎？')) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auto-train/clips/${clipId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchClips();
      } else {
        alert('刪除失敗');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('刪除時發生錯誤');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('確定要清空所有訓練資料嗎？此動作無法復原！')) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/auto-train/clips`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        alert('已清空所有資料');
        fetchClips();
      } else {
        alert('清空失敗');
      }
    } catch (error) {
      console.error('Clear all error:', error);
      alert('清空時發生錯誤');
    }
  };

  const handleStartTraining = async () => {
    setIsTraining(true);
    setError('');
    setLogs([]);
    setResult(null);
    setProgress({ status: 'initializing', message: '正在初始化...' });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      
      // 1. 先匯出資料
      setProgress({ status: 'syncing', message: '正在同步訓練資料...' });
      try {
        const exportResponse = await fetch(`${apiUrl}/api/auto-train/export`, {
          method: 'POST',
        });
        
        if (exportResponse.ok) {
           const exportData = await exportResponse.json();
           setLogs(prev => [...prev, `資料同步完成: ${JSON.stringify(exportData.stats)}`]);
        } else {
           console.warn("資料同步請求失敗");
           setLogs(prev => [...prev, "警告: 資料同步失敗，將嘗試使用現有資料訓練"]);
        }
      } catch (e) {
        console.warn("資料同步錯誤", e);
        setLogs(prev => [...prev, "警告: 無法連接到資料同步服務"]);
      }

      // 2. 開始訓練
      setProgress({ status: 'initializing', message: '正在啟動訓練...' });
      const response = await fetch(`${apiUrl}/api/train`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '訓練啟動失敗');
      }

      const data = await response.json();
      
      if (data.task_id) {
        pollTrainingStatus(data.task_id);
      }
    } catch (err: any) {
      setError(err.message || '訓練啟動時發生錯誤');
      setIsTraining(false);
    }
  };

  const pollTrainingStatus = async (taskId: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`${apiUrl}/api/train/status/${taskId}`);
        const data = await response.json();

        setProgress(data);

        if (data.logs) {
          setLogs((prev) => [...prev, ...data.logs]);
        }

        if (data.status === 'completed') {
          clearInterval(intervalId);
          setIsTraining(false);
          setResult(data.result);
        } else if (data.status === 'failed') {
          clearInterval(intervalId);
          setIsTraining(false);
          setError(data.message || '訓練失敗');
        }
      } catch (err) {
        console.error('輪詢狀態時出錯:', err);
      }
    }, 2000);
  };

  const getProgressPercentage = () => {
    if (!progress?.current_epoch || !progress?.total_epochs) return 0;
    return (progress.current_epoch / progress.total_epochs) * 100;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-semibold text-neutral-900">
              模型訓練中心
            </h2>
            <p className="mt-2 text-neutral-500">管理訓練資料集並訓練 AI 模型</p>
          </div>
          
          {/* Tabs */}
          <div className="flex bg-white rounded-lg p-1 border border-neutral-200">
            <button
              onClick={() => setActiveTab('train')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'train' 
                  ? 'bg-neutral-900 text-white shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              模型訓練
            </button>
            <button
              onClick={() => setActiveTab('dataset')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'dataset' 
                  ? 'bg-neutral-900 text-white shadow-sm' 
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              資料集管理
            </button>
          </div>
        </div>

        {activeTab === 'train' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
            {/* Left Column - Configuration */}
            <div className="space-y-6">
              {/* Model Configuration */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-neutral-900 mb-6">
                  模型配置
                </h2>
                
                <div className="space-y-5">
                  {/* Model Type */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      模型類型
                    </label>
                    <select
                      value={config.model_type}
                      onChange={(e) => setConfig({ ...config, model_type: e.target.value })}
                      disabled={isTraining}
                      className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-40"
                    >
                      <option value="basic">Basic LSTM</option>
                      <option value="advanced">Advanced LSTM</option>
                    </select>
                  </div>

                  {/* Epochs */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      訓練輪數: <span className="font-semibold">{config.epochs}</span>
                    </label>
                    <input
                      type="range"
                      min="50"
                      max="300"
                      step="10"
                      value={config.epochs}
                      onChange={(e) => setConfig({ ...config, epochs: parseInt(e.target.value) })}
                      disabled={isTraining}
                      className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-neutral-900 disabled:opacity-40"
                    />
                    <div className="flex justify-between text-xs text-neutral-400 mt-1">
                      <span>50</span>
                      <span>300</span>
                    </div>
                  </div>

                  {/* Batch Size */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      批次大小
                    </label>
                    <select
                      value={config.batch_size}
                      onChange={(e) => setConfig({ ...config, batch_size: parseInt(e.target.value) })}
                      disabled={isTraining}
                      className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-40"
                    >
                      <option value="16">16</option>
                      <option value="32">32</option>
                      <option value="64">64</option>
                    </select>
                  </div>

                  {/* Learning Rate */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      學習率
                    </label>
                    <select
                      value={config.learning_rate}
                      onChange={(e) => setConfig({ ...config, learning_rate: parseFloat(e.target.value) })}
                      disabled={isTraining}
                      className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-40"
                    >
                      <option value="0.0001">0.0001</option>
                      <option value="0.001">0.001</option>
                      <option value="0.01">0.01</option>
                    </select>
                  </div>

                  {/* Data Augmentation */}
                  <div className="pt-2 border-t border-neutral-100">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm font-medium text-neutral-700">
                        資料擴增
                      </span>
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={config.use_augmentation}
                          onChange={(e) => setConfig({ ...config, use_augmentation: e.target.checked })}
                          disabled={isTraining}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neutral-900 peer-disabled:opacity-40"></div>
                      </div>
                    </label>
                    
                    {config.use_augmentation && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                          擴增倍數: <span className="font-semibold">{config.augment_factor}x</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={config.augment_factor}
                          onChange={(e) => setConfig({ ...config, augment_factor: parseInt(e.target.value) })}
                          disabled={isTraining}
                          className="w-full h-2 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-neutral-900 disabled:opacity-40"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Start Button */}
                <button
                  onClick={handleStartTraining}
                  disabled={isTraining}
                  className="w-full mt-6 px-6 py-3.5 bg-neutral-900 text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-800 active:scale-[0.98]"
                >
                  {isTraining ? '訓練中...' : '開始訓練'}
                </button>
              </div>

              {/* Training Info */}
              <div className="bg-neutral-100 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-neutral-900 mb-3">
                  訓練資訊
                </h3>
                <div className="text-xs text-neutral-600 space-y-2 font-light">
                  <p>• 請確保已準備足夠的訓練資料（建議每類至少 30 個樣本）</p>
                  <p>• 訓練過程中請勿關閉瀏覽器</p>
                  <p>• 較高的訓練輪數可能需要更長時間</p>
                  <p>• 資料擴增可以提升模型泛化能力</p>
                </div>
              </div>
            </div>

            {/* Right Column - Progress & Results */}
            <div className="space-y-6">
              {/* Training Progress */}
              {(isTraining || progress) && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-6">
                    訓練進度
                  </h2>

                  {/* Progress Bar */}
                  {progress?.current_epoch && progress?.total_epochs && (
                    <div className="mb-6">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-neutral-600">
                          Epoch {progress.current_epoch} / {progress.total_epochs}
                        </span>
                        <span className="text-neutral-900 font-medium">
                          {getProgressPercentage().toFixed(0)}%
                        </span>
                      </div>
                      <div className="bg-neutral-100 rounded-full h-3 overflow-hidden">
                        <div 
                          className="bg-neutral-900 h-full rounded-full transition-all duration-300"
                          style={{ width: `${getProgressPercentage()}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Metrics */}
                  {progress && (progress.accuracy !== undefined || progress.loss !== undefined) && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      {typeof progress.accuracy === 'number' && (
                        <div className="bg-neutral-50 rounded-xl p-4">
                          <div className="text-xs text-neutral-500 mb-1">準確率</div>
                          <div className="text-2xl font-light text-neutral-900 tabular-nums">
                            {(progress.accuracy * 100).toFixed(1)}%
                          </div>
                        </div>
                      )}
                      {typeof progress.val_accuracy === 'number' && (
                        <div className="bg-neutral-50 rounded-xl p-4">
                          <div className="text-xs text-neutral-500 mb-1">驗證準確率</div>
                          <div className="text-2xl font-light text-neutral-900 tabular-nums">
                            {(progress.val_accuracy * 100).toFixed(1)}%
                          </div>
                        </div>
                      )}
                      {typeof progress.loss === 'number' && (
                        <div className="bg-neutral-50 rounded-xl p-4">
                          <div className="text-xs text-neutral-500 mb-1">損失</div>
                          <div className="text-2xl font-light text-neutral-900 tabular-nums">
                            {progress.loss.toFixed(4)}
                          </div>
                        </div>
                      )}
                      {typeof progress.val_loss === 'number' && (
                        <div className="bg-neutral-50 rounded-xl p-4">
                          <div className="text-xs text-neutral-500 mb-1">驗證損失</div>
                          <div className="text-2xl font-light text-neutral-900 tabular-nums">
                            {progress.val_loss.toFixed(4)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Status Message */}
                  {progress?.message && (
                    <div className="text-sm text-neutral-600 bg-neutral-50 rounded-xl p-3">
                      {progress.message}
                    </div>
                  )}
                </div>
              )}

              {/* Training Logs */}
              {logs.length > 0 && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                    訓練日誌
                  </h2>
                  <div className="bg-neutral-900 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs">
                    {logs.slice(-10).map((log, index) => (
                      <div key={index} className="text-neutral-300 mb-1">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
                  <h3 className="text-sm font-semibold text-red-900 mb-2">
                    錯誤
                  </h3>
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                </div>
              )}

              {/* Training Result */}
              {result && (
                <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-6">
                    訓練完成
                  </h2>
                  
                  <div className="text-center py-6 mb-6">
                    <div className="text-6xl mb-4">🎉</div>
                    <div className="text-2xl font-light text-neutral-900 mb-2">
                      訓練成功
                    </div>
                    <div className="text-sm text-neutral-500">
                      模型已儲存並可供使用
                    </div>
                  </div>

                  {result.final_accuracy && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-neutral-50 rounded-xl p-4 text-center">
                        <div className="text-xs text-neutral-500 mb-2">最終準確率</div>
                        <div className="text-3xl font-light text-neutral-900">
                          {(result.final_accuracy * 100).toFixed(1)}%
                        </div>
                      </div>
                      {result.final_val_accuracy && (
                        <div className="bg-neutral-50 rounded-xl p-4 text-center">
                          <div className="text-xs text-neutral-500 mb-2">驗證準確率</div>
                          <div className="text-3xl font-light text-neutral-900">
                            {(result.final_val_accuracy * 100).toFixed(1)}%
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Dataset Management View */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-neutral-900">資料集管理</h2>
              
              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                  <input
                    type="text"
                    placeholder="輸入 YouTube 影片連結..."
                    className="w-full px-4 py-2 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        const url = e.currentTarget.value;
                        if (!url) return;
                        
                        setIsAutoLabeling(true);
                        try {
                          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                          const response = await fetch(`${apiUrl}/api/auto-label`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ youtube_url: url })
                          });
                          const data = await response.json();
                          if (data.success) {
                            alert(`YouTube 影片處理完成！\n分類結果: ${data.quality}\n理由: ${data.reason}`);
                            fetchClips();
                          } else {
                            alert(`處理失敗: ${data.error}`);
                          }
                        } catch (error) {
                          console.error('YouTube processing error:', error);
                          alert('處理失敗');
                        } finally {
                          setIsAutoLabeling(false);
                          e.currentTarget.value = '';
                        }
                      }
                    }}
                  />
                </div>
                
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors whitespace-nowrap"
                >
                  清空資料
                </button>
                <button
                  onClick={handleAutoLabel}
                  disabled={isAutoLabeling}
                  className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors whitespace-nowrap ${
                    isAutoLabeling 
                      ? 'bg-neutral-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isAutoLabeling ? 'AI 處理中...' : '✨ 掃描本地/YT'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                <div className="text-sm text-neutral-500 mb-1">總片段數</div>
                <div className="text-3xl font-semibold text-neutral-900">{datasetStats.total}</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                <div className="text-sm text-neutral-500 mb-1">已核准</div>
                <div className="text-3xl font-semibold text-emerald-600">{datasetStats.approved}</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                <div className="text-sm text-neutral-500 mb-1">待審核</div>
                <div className="text-3xl font-semibold text-amber-600">{datasetStats.pending}</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-900">訓練資料列表</h3>
              </div>
              
              {isLoadingClips ? (
                <div className="p-12 text-center text-neutral-500">載入中...</div>
              ) : clips.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">選手</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">標籤</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">描述</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">狀態</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">建立時間</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase tracking-wider">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {clips.map((clip, index) => (
                        <tr key={`${clip.id}-${index}`} className="hover:bg-neutral-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{clip.player_name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-600">{clip.label}</td>
                          <td className="px-6 py-4 text-sm text-neutral-600 max-w-xs truncate">{clip.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              clip.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                              clip.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {clip.status === 'approved' ? '已核准' : clip.status === 'rejected' ? '已拒絕' : '待審核'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                            {new Date(clip.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleDeleteClip(clip.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              刪除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-neutral-500">
                  目前沒有訓練資料，請先至「選手分析」頁面進行分析並匯入。
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function TrainPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-neutral-50 flex items-center justify-center">載入中...</div>}>
      <TrainPageContent />
    </Suspense>
  );
}
