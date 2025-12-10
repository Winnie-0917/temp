'use client';

import { useState, useEffect, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import Navbar from '../components/Navbar';

export default function LiveCameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const newSocket = io(`${socketUrl}/live`);

    newSocket.on('connect', () => {
      console.log('Connected to live server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected');
      setIsConnected(false);
      setIsAnalyzing(false);
    });

    newSocket.on('prediction', (data) => {
      setPrediction(data);
    });

    newSocket.on('alert', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 5));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, frameRate: 30 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("無法存取攝影機");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const toggleAnalysis = () => {
    if (!socket) return;

    if (isAnalyzing) {
      socket.emit('stop_analysis');
      setIsAnalyzing(false);
    } else {
      socket.emit('start_analysis', { 
        player_focus: 'user',
        use_local_model: true 
      });
      setIsAnalyzing(true);
    }
  };

  // Frame processing loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isAnalyzing && videoRef.current && canvasRef.current && socket) {
      intervalId = setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const frameData = canvas.toDataURL('image/jpeg', 0.7);
            socket.emit('video_frame', { frame: frameData });
          }
        }
      }, 100); // Send frame every 100ms (10fps)
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAnalyzing, socket]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900">即時動作分析</h1>
          <p className="mt-2 text-neutral-600">使用攝影機即時分析您的擊球動作</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Camera View */}
          <div className="lg:col-span-2">
            <div className="bg-black rounded-2xl overflow-hidden shadow-lg relative aspect-video">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {/* Overlay Info */}
              {prediction && (
                <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md rounded-xl p-4 text-white">
                  <div className="text-xs text-gray-300 mb-1">即時判定</div>
                  <div className={`text-3xl font-bold ${
                    prediction.prediction === 'good' ? 'text-emerald-400' :
                    prediction.prediction === 'bad' ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {prediction.prediction?.toUpperCase() || '分析中...'}
                  </div>
                  <div className="text-xs text-gray-300 mt-1">
                    信心度: {(prediction.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-center">
              <button
                onClick={toggleAnalysis}
                className={`px-8 py-3 rounded-full font-semibold text-lg transition-all ${
                  isAnalyzing 
                    ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                } shadow-lg`}
              >
                {isAnalyzing ? '⏹ 停止分析' : '▶ 開始分析'}
              </button>
            </div>
          </div>

          {/* Analysis Panel */}
          <div className="space-y-6">
            {/* Probabilities */}
            {prediction?.probabilities && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200">
                <h3 className="font-semibold text-neutral-900 mb-4">動作評分</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-emerald-700">Good</span>
                      <span className="font-medium">{(prediction.probabilities.good * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-300"
                        style={{ width: `${prediction.probabilities.good * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-yellow-700">Normal</span>
                      <span className="font-medium">{(prediction.probabilities.normal * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 transition-all duration-300"
                        style={{ width: `${prediction.probabilities.normal * 100}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-red-700">Bad</span>
                      <span className="font-medium">{(prediction.probabilities.bad * 100).toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: `${prediction.probabilities.bad * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Alerts */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-neutral-200 h-[400px] overflow-y-auto">
              <h3 className="font-semibold text-neutral-900 mb-4">AI 教練建議</h3>
              <div className="space-y-3">
                {alerts.length === 0 ? (
                  <div className="text-center text-neutral-400 py-8">
                    等待分析結果...
                  </div>
                ) : (
                  alerts.map((alert, idx) => (
                    <div key={idx} className="bg-neutral-50 rounded-xl p-4 border border-neutral-100">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {alert.alert_type === 'success' ? '🎉' : 
                           alert.alert_type === 'warning' ? '⚠️' : '💡'}
                        </span>
                        <span className="font-medium text-neutral-900">{alert.title}</span>
                      </div>
                      <p className="text-sm text-neutral-600">{alert.message}</p>
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
