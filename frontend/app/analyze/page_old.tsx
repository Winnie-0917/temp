'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AnalyzePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [videoPreview, setVideoPreview] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        setError('請選擇影片檔案（如 .mp4, .avi, .mov）');
        return;
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        setError('檔案大小不能超過 100MB');
        return;
      }
      setSelectedFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setResult(null);
      setError('');
      setUploadProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('video/')) {
      if (file.size > 100 * 1024 * 1024) {
        setError('檔案大小不能超過 100MB');
        return;
      }
      setSelectedFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setResult(null);
      setError('');
      setUploadProgress(0);
    } else {
      setError('請拖曳影片檔案');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('請先選擇影片檔案');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const apiUrl = typeof window !== 'undefined' 
        ? 'http://localhost:5000' 
        : 'http://backend:5000';
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(`${apiUrl}/analyze`, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '分析失敗');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || '分析時發生錯誤，請確認後端服務已啟動');
    } finally {
      setLoading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setVideoPreview('');
    setResult(null);
    setError('');
    setUploadProgress(0);
  };

  const getClassBadgeColor = (className: string) => {
    switch (className?.toLowerCase()) {
      case 'good':
        return 'bg-green-500';
      case 'normal':
        return 'bg-yellow-500';
      case 'bad':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getClassEmoji = (className: string) => {
    switch (className?.toLowerCase()) {
      case 'good':
        return '🎉';
      case 'normal':
        return '👍';
      case 'bad':
        return '⚠️';
      default:
        return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                🎥 桌球動作分析
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                上傳影片進行動作品質分析
              </p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              返回首頁
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              上傳影片
            </h2>
            {selectedFile && !loading && (
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
              >
                重新選擇
              </button>
            )}
          </div>
          
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
              selectedFile 
                ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
            }`}
          >
            <input
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
              id="fileInput"
              disabled={loading}
            />
            <label htmlFor="fileInput" className="cursor-pointer">
              <div className="text-6xl mb-4">{selectedFile ? '✅' : '⬆'}</div>
              <div className="text-gray-600 dark:text-gray-400">
                {selectedFile ? (
                  <>
                    <div className="font-medium text-green-600 dark:text-green-400 mb-2">
                      檔案已選擇
                    </div>
                    <div className="text-sm">
                      {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  </>
                ) : (
                  <>
                    拖曳影片到這裡，或{' '}
                    <span className="text-blue-600 dark:text-blue-400 hover:underline">
                      選擇檔案
                    </span>
                    <div className="text-xs mt-2 text-gray-400">
                      支援格式：MP4, AVI, MOV（最大 100MB）
                    </div>
                  </>
                )}
              </div>
            </label>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>上傳進度</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!selectedFile || loading}
            className="mt-6 w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>分析中，請稍候...</span>
              </>
            ) : (
              <>
                <span>🚀</span>
                <span>上傳並分析</span>
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-medium text-red-800 dark:text-red-400">分析失敗</p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
                  <p className="text-xs text-red-500 dark:text-red-500 mt-2">
                    💡 提示：請確認影片格式正確且後端服務正常運行
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Video Preview */}
        {videoPreview && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              影片預覽
            </h2>
            <video
              src={videoPreview}
              controls
              className="w-full rounded-lg"
            />
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                分析結果
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-3xl">{getClassEmoji(result.predicted_class)}</span>
                <span className={`px-4 py-2 rounded-full text-white font-bold ${getClassBadgeColor(result.predicted_class)}`}>
                  {result.predicted_class?.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  模型信心度
                </p>
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {(result.confidence * 100).toFixed(1)}%
                </p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all duration-1000 ${getClassBadgeColor(result.predicted_class)}`}
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                各類別機率分布
              </h3>
              <div className="space-y-3">
                {result.probabilities && Object.entries(result.probabilities)
                  .sort((a: any, b: any) => b[1] - a[1])
                  .map(([className, probability]: [string, any]) => (
                    <div key={className} className="flex items-center gap-4">
                      <span className="text-2xl">{getClassEmoji(className)}</span>
                      <span className="w-24 font-medium text-gray-900 dark:text-white uppercase">
                        {className}
                      </span>
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-10 overflow-hidden">
                        <div
                          className={`h-10 flex items-center justify-end pr-3 transition-all duration-1000 ${getClassBadgeColor(className)}`}
                          style={{ width: `${probability * 100}%` }}
                        >
                          {probability > 0.1 && (
                            <span className="text-sm text-white font-medium">
                              {(probability * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="w-16 text-right text-sm font-medium text-gray-600 dark:text-gray-400">
                        {(probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-medium">💡 提示：</span> 
                {result.predicted_class === 'good' && ' 動作品質優良！繼續保持這個姿勢。'}
                {result.predicted_class === 'normal' && ' 動作還不錯，可以針對細節再做改進。'}
                {result.predicted_class === 'bad' && ' 建議調整動作，可參考專業教練指導。'}
              </p>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
              >
                分析另一個影片
              </button>
              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                🖨️ 列印報告
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
