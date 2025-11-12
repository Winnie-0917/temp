'use client';

import { useState } from 'react';
import Link from 'next/link';

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
    setProgress({ status: 'initializing', message: '正在初始化訓練...' });

    try {
      const response = await fetch('http://localhost:5000/api/train', {
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
        // 開始輪詢訓練狀態
        pollTrainingStatus(data.task_id);
      }
    } catch (err: any) {
      setError(err.message || '訓練啟動時發生錯誤');
      setIsTraining(false);
    }
  };

  const pollTrainingStatus = async (taskId: string) => {
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/train/status/${taskId}`);
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
    }, 2000); // 每2秒更新一次
  };

  const handleStopTraining = async () => {
    // TODO: 實作停止訓練的 API
    setIsTraining(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                ← 返回首頁
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                🧠 模型訓練中心
              </h1>
            </div>
            <Link
              href="/analyze"
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            >
              🎥 動作分析
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左側：訓練配置 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              訓練配置
            </h2>

            <div className="space-y-6">
              {/* 模型架構 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  模型架構
                </label>
                <select
                  value={config.model_type}
                  onChange={(e) =>
                    setConfig({ ...config, model_type: e.target.value })
                  }
                  disabled={isTraining}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="basic">Basic LSTM（基礎）</option>
                  <option value="bidirectional">Bidirectional LSTM（雙向）</option>
                  <option value="deep">Deep LSTM（深層）</option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {config.model_type === 'basic' && '適合初次訓練，速度較快'}
                  {config.model_type === 'bidirectional' && '同時考慮前後文脈絡，準確率較高'}
                  {config.model_type === 'deep' && '深層網路，需要更多資料'}
                </p>
              </div>

              {/* 訓練輪數 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  訓練輪數 (Epochs): {config.epochs}
                </label>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={config.epochs}
                  onChange={(e) =>
                    setConfig({ ...config, epochs: parseInt(e.target.value) })
                  }
                  disabled={isTraining}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>50</span>
                  <span>300</span>
                </div>
              </div>

              {/* 批次大小 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  批次大小 (Batch Size)
                </label>
                <select
                  value={config.batch_size}
                  onChange={(e) =>
                    setConfig({ ...config, batch_size: parseInt(e.target.value) })
                  }
                  disabled={isTraining}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="16">16（記憶體較小）</option>
                  <option value="32">32（推薦）</option>
                  <option value="64">64（記憶體較大）</option>
                </select>
              </div>

              {/* 學習率 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  學習率 (Learning Rate)
                </label>
                <select
                  value={config.learning_rate}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      learning_rate: parseFloat(e.target.value),
                    })
                  }
                  disabled={isTraining}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="0.0001">0.0001（較慢但穩定）</option>
                  <option value="0.001">0.001（推薦）</option>
                  <option value="0.01">0.01（較快但可能不穩）</option>
                </select>
              </div>

              {/* 資料增強 */}
              <div>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={config.use_augmentation}
                    onChange={(e) =>
                      setConfig({ ...config, use_augmentation: e.target.checked })
                    }
                    disabled={isTraining}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    使用資料增強
                  </span>
                </label>
                <p className="ml-8 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  自動擴充訓練資料，提升模型泛化能力
                </p>
              </div>

              {/* 增強因子 */}
              {config.use_augmentation && (
                <div className="ml-8">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    增強因子: {config.augment_factor}x
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={config.augment_factor}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        augment_factor: parseInt(e.target.value),
                      })
                    }
                    disabled={isTraining}
                    className="w-full"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    每個原始樣本生成 {config.augment_factor} 個增強版本
                  </p>
                </div>
              )}

              {/* 開始訓練按鈕 */}
              <div className="pt-4">
                {!isTraining ? (
                  <button
                    onClick={handleStartTraining}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>🚀</span>
                    <span>開始訓練</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopTraining}
                    className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>⏹️</span>
                    <span>停止訓練</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 右側：訓練狀態與日誌 */}
          <div className="space-y-6">
            {/* 訓練進度 */}
            {progress && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  訓練進度
                </h2>

                <div className="space-y-4">
                  {/* 狀態指示器 */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        progress.status === 'training'
                          ? 'bg-blue-500 animate-pulse'
                          : progress.status === 'completed'
                          ? 'bg-green-500'
                          : progress.status === 'failed'
                          ? 'bg-red-500'
                          : 'bg-gray-500'
                      }`}
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {progress.status === 'initializing' && '初始化中...'}
                      {progress.status === 'training' && '訓練中...'}
                      {progress.status === 'completed' && '✅ 訓練完成'}
                      {progress.status === 'failed' && '❌ 訓練失敗'}
                    </span>
                  </div>

                  {/* Epoch 進度 */}
                  {progress.current_epoch && progress.total_epochs && (
                    <div>
                      <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <span>Epoch {progress.current_epoch} / {progress.total_epochs}</span>
                        <span>
                          {Math.round((progress.current_epoch / progress.total_epochs) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{
                            width: `${(progress.current_epoch / progress.total_epochs) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 指標 */}
                  {(progress.accuracy || progress.loss) && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {progress.accuracy !== undefined && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                          <div className="text-xs text-gray-600 dark:text-gray-400">訓練準確率</div>
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                            {(progress.accuracy * 100).toFixed(2)}%
                          </div>
                        </div>
                      )}
                      {progress.val_accuracy !== undefined && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                          <div className="text-xs text-gray-600 dark:text-gray-400">驗證準確率</div>
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {(progress.val_accuracy * 100).toFixed(2)}%
                          </div>
                        </div>
                      )}
                      {progress.loss !== undefined && (
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                          <div className="text-xs text-gray-600 dark:text-gray-400">訓練損失</div>
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {progress.loss.toFixed(4)}
                          </div>
                        </div>
                      )}
                      {progress.val_loss !== undefined && (
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                          <div className="text-xs text-gray-600 dark:text-gray-400">驗證損失</div>
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {progress.val_loss.toFixed(4)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {progress.message && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {progress.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 錯誤訊息 */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">❌</span>
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-300">錯誤</p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 訓練結果 */}
            {result && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                  🎉 訓練完成
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">測試集準確率</span>
                    <span className="font-bold text-green-600 dark:text-green-400">
                      {(result.test_accuracy * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700 dark:text-gray-300">訓練時間</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {result.training_time}
                    </span>
                  </div>
                  {result.model_path && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        ✅ 模型已儲存至: {result.model_path}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 訓練日誌 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                訓練日誌
              </h2>
              <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm">
                {logs.length === 0 ? (
                  <p className="text-gray-500">等待訓練開始...</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="text-green-400 mb-1">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
