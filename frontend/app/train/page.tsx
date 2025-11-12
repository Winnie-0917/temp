'use client';

import { useState } from 'react';
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

export default function TrainPage() {
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

  const handleStartTraining = async () => {
    setIsTraining(true);
    setError('');
    setLogs([]);
    setResult(null);
    setProgress({ status: 'initializing', message: '正在初始化...' });

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
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
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
            模型訓練
          </h2>
          <p className="mt-2 text-slate-600">配置並訓練您的 AI 模型</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Configuration */}
          <div className="space-y-6">
            {/* Model Configuration */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200/50 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-emerald-900 mb-6">
                模型配置
              </h2>
              
              <div className="space-y-5">
                {/* Model Type */}
                <div>
                  <label className="block text-sm font-medium text-emerald-700 mb-2">
                    模型類型
                  </label>
                  <select
                    value={config.model_type}
                    onChange={(e) => setConfig({ ...config, model_type: e.target.value })}
                    disabled={isTraining}
                    className="w-full px-4 py-2.5 bg-white border border-emerald-300 rounded-xl text-emerald-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:opacity-40"
                  >
                    <option value="basic">Basic LSTM</option>
                    <option value="advanced">Advanced LSTM</option>
                  </select>
                </div>

                {/* Epochs */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-gray-900 dark:accent-white disabled:opacity-40"
                  />
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span>50</span>
                    <span>300</span>
                  </div>
                </div>

                {/* Batch Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    批次大小
                  </label>
                  <select
                    value={config.batch_size}
                    onChange={(e) => setConfig({ ...config, batch_size: parseInt(e.target.value) })}
                    disabled={isTraining}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 disabled:opacity-40"
                  >
                    <option value="16">16</option>
                    <option value="32">32</option>
                    <option value="64">64</option>
                  </select>
                </div>

                {/* Learning Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    學習率
                  </label>
                  <select
                    value={config.learning_rate}
                    onChange={(e) => setConfig({ ...config, learning_rate: parseFloat(e.target.value) })}
                    disabled={isTraining}
                    className="w-full px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600 disabled:opacity-40"
                  >
                    <option value="0.0001">0.0001</option>
                    <option value="0.001">0.001</option>
                    <option value="0.01">0.01</option>
                  </select>
                </div>

                {/* Data Augmentation */}
                <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
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
                      <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-gray-400 dark:peer-focus:ring-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-900 dark:peer-checked:bg-white peer-disabled:opacity-40"></div>
                    </div>
                  </label>
                  
                  {config.use_augmentation && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
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
                        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-gray-900 dark:accent-white disabled:opacity-40"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={handleStartTraining}
                disabled={isTraining}
                className="w-full mt-6 px-6 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full font-medium transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              >
                {isTraining ? '訓練中...' : '開始訓練'}
              </button>
            </div>

            {/* Training Info */}
            <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                訓練資訊
              </h3>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2 font-light">
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
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  訓練進度
                </h2>

                {/* Progress Bar */}
                {progress?.current_epoch && progress?.total_epochs && (
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">
                        Epoch {progress.current_epoch} / {progress.total_epochs}
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        {getProgressPercentage().toFixed(0)}%
                      </span>
                    </div>
                    <div className="bg-gray-200 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gray-900 dark:bg-white h-full rounded-full transition-all duration-300"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Metrics */}
                {progress && (progress.accuracy !== undefined || progress.loss !== undefined) && (
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {progress.accuracy !== undefined && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">準確率</div>
                        <div className="text-2xl font-light text-gray-900 dark:text-white tabular-nums">
                          {(progress.accuracy * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {progress.val_accuracy !== undefined && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">驗證準確率</div>
                        <div className="text-2xl font-light text-gray-900 dark:text-white tabular-nums">
                          {(progress.val_accuracy * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {progress.loss !== undefined && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">損失</div>
                        <div className="text-2xl font-light text-gray-900 dark:text-white tabular-nums">
                          {progress.loss.toFixed(4)}
                        </div>
                      </div>
                    )}
                    {progress.val_loss !== undefined && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">驗證損失</div>
                        <div className="text-2xl font-light text-gray-900 dark:text-white tabular-nums">
                          {progress.val_loss.toFixed(4)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Status Message */}
                {progress?.message && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
                    {progress.message}
                  </div>
                )}
              </div>
            )}

            {/* Training Logs */}
            {logs.length > 0 && (
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  訓練日誌
                </h2>
                <div className="bg-gray-900 dark:bg-black rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs">
                  {logs.slice(-10).map((log, index) => (
                    <div key={index} className="text-gray-300 dark:text-gray-400 mb-1">
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-400 mb-2">
                  錯誤
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
            )}

            {/* Training Result */}
            {result && (
              <div className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-800/50 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  訓練完成
                </h2>
                
                <div className="text-center py-6 mb-6">
                  <div className="text-6xl mb-4">🎉</div>
                  <div className="text-2xl font-light text-gray-900 dark:text-white mb-2">
                    訓練成功
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    模型已儲存並可供使用
                  </div>
                </div>

                {result.final_accuracy && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">最終準確率</div>
                      <div className="text-3xl font-light text-gray-900 dark:text-white">
                        {(result.final_accuracy * 100).toFixed(1)}%
                      </div>
                    </div>
                    {result.final_val_accuracy && (
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 text-center">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">驗證準確率</div>
                        <div className="text-3xl font-light text-gray-900 dark:text-white">
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
      </main>
    </div>
  );
}
