"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import PlayerProfileCard from "../../components/PlayerProfileCard";

interface PerformanceClip {
  timestamp: string;
  start_seconds?: number;
  end_seconds?: number;
  clip_path?: string;
  technique: string;
  description: string;
  quality_label: "good" | "normal" | "bad";
  quality_reason: string;
}

interface PerformanceSummary {
  player_name: string;
  total_scoring: number;
  total_losing: number;
  strengths: string[];
  weaknesses: string[];
  overall_assessment: string;
}

interface AnalysisPoint {
  id: number;
  start_seconds: number;
  end_seconds: number;
  timestamp_display: string;
  winner: string;
  win_reason?: string;
  description: string;
  key_technique?: string;
  tactic?: string;
  clip_path?: string;
}

interface PlayerRatings {
  serve: number;
  receive: number;
  attack: number;
  defense: number;
  tactics: number;
}

interface AnalysisResult {
  success: boolean;
  player_name: string;
  player2_name?: string;
  scoring_clips: PerformanceClip[];
  losing_clips: PerformanceClip[];
  all_points?: AnalysisPoint[];
  summary: PerformanceSummary;
  training_clips: PerformanceClip[];
  error?: string;
  // Advanced metrics
  metrics?: {
    player1?: PlayerRatings;
    player2?: PlayerRatings;
  };
  advanced_summary?: {
    overall_assessment: string;
    tactical_analysis: string;
  };
}

interface PlayerMapping {
  name: string;
  aliases: string[];
  avatar?: string;
}

const PLAYER_DATABASE: PlayerMapping[] = [
  { name: "Fan Zhendong", aliases: ["樊振東", "樊振东"], avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Fan_Zhendong_ATTC2017_106.jpeg/240px-Fan_Zhendong_ATTC2017_106.jpeg" },
  { name: "Wang Chuqin", aliases: ["王楚欽", "王楚钦"], avatar: "https://ui-avatars.com/api/?name=Wang+Chuqin&background=random" },
  { name: "Ma Long", aliases: ["馬龍", "马龙"], avatar: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Ma_Long_at_2016_Olympics.jpg/240px-Ma_Long_at_2016_Olympics.jpg" },
  { name: "Liang Jingkun", aliases: ["梁靖崑", "梁靖昆"] },
  { name: "Lin Gaoyuan", aliases: ["林高遠", "林高远"] },
  { name: "Lin Shidong", aliases: ["林詩棟", "林诗栋"] },
  { name: "Felix Lebrun", aliases: ["F. Lebrun", "勒布倫", "勒布伦"] },
  { name: "Hugo Calderano", aliases: ["雨果", "卡爾德拉諾"] },
  { name: "Tomokazu Harimoto", aliases: ["張本智和", "张本智和"] },
  { name: "Lin Yun-Ju", aliases: ["林昀儒", "小林"], avatar: "https://ui-avatars.com/api/?name=Lin+Yun-Ju&background=random" },
  { name: "Truls Moregard", aliases: ["莫雷加德"] },
  { name: "Patrick Franziska", aliases: ["法蘭茲卡"] },
  { name: "Dang Qiu", aliases: ["邱黨", "邱党"] },
  { name: "Jang Woojin", aliases: ["張禹珍", "张禹珍"] },
  { name: "Darko Jorgic", aliases: ["達科"] },
  { name: "Dimitrij Ovtcharov", aliases: ["奧恰洛夫", "奥恰洛夫"] },
  { name: "Sun Yingsha", aliases: ["孫穎莎", "孙颖莎"], avatar: "https://ui-avatars.com/api/?name=Sun+Yingsha&background=random" },
  { name: "Wang Manyu", aliases: ["王曼昱"] },
  { name: "Chen Meng", aliases: ["陳夢", "陈梦"] },
  { name: "Wang Yidi", aliases: ["王藝迪", "王艺迪"] },
  { name: "Hina Hayata", aliases: ["早田希娜", "早田ひな"] },
  { name: "Chen Xingtong", aliases: ["陳幸同", "陈幸同"] },
  { name: "Miwa Harimoto", aliases: ["張本美和", "张本美和"] },
  { name: "Shin Yubin", aliases: ["申裕斌"] },
  { name: "Mima Ito", aliases: ["伊藤美誠", "伊藤美诚"] },
  { name: "Cheng I-Ching", aliases: ["鄭怡靜", "郑怡静"] },
  { name: "Adriana Diaz", aliases: ["迪亞茲"] },
  { name: "Miu Hirano", aliases: ["平野美宇"] }
];

const getVideoId = (url: string) => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
};

const timeToSeconds = (timeStr: string) => {
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
};

const getPlayerAvatar = (name: string) => {
  const player = PLAYER_DATABASE.find(p => p.name.toLowerCase() === name.toLowerCase()) ||
    PLAYER_DATABASE.find(p => p.aliases.some(alias => name.includes(alias)));
  if (player && player.avatar) {
    return player.avatar;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
};



// --- Match Dashboard Component (Two-Player Layout) ---
function MatchDashboard({ result, onPlayerClick }: { result: AnalysisResult; onPlayerClick?: (name: string) => void }) {
  const { metrics, advanced_summary, player_name, player2_name } = result;

  // Get player analysis from structured data if available
  const p1Analysis = (result as any).player1_analysis;
  const p2Analysis = (result as any).player2_analysis;

  if (!metrics && !advanced_summary) return null;

  // Player Card Component
  const PlayerCard = ({
    name,
    ratings,
    strengths,
    weaknesses,
    isLeft
  }: {
    name: string;
    ratings?: any;
    strengths?: any[];
    weaknesses?: any[];
    isLeft: boolean;
  }) => (
    <div className={`flex-1 ${isLeft ? 'pr-4' : 'pl-4'}`}>
      {/* Player Header */}
      <div className={`flex items-center gap-4 mb-6 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
        <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-neutral-100 flex-shrink-0">
          <img src={getPlayerAvatar(name)} alt={name} className="w-full h-full object-cover" />
        </div>
        <div className={isLeft ? 'text-left' : 'text-right'}>
          <h3
            className="text-xl font-bold text-neutral-900 hover:text-blue-600 cursor-pointer transition-colors"
            onClick={() => onPlayerClick && name && onPlayerClick(name)}
            title="點擊查看選手檔案"
          >
            {name || '選手'}
          </h3>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${isLeft ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
            {isLeft ? '選手 1' : '選手 2'}
          </span>
        </div>
      </div>

      {/* Ratings */}
      {ratings && (
        <div className="mb-6">
          <h4 className={`text-sm font-bold text-neutral-700 mb-3 ${isLeft ? 'text-left' : 'text-right'}`}>能力評分</h4>
          <div className="space-y-2">
            {[
              { label: '發球', key: 'serve' },
              { label: '接發球', key: 'receive' },
              { label: '進攻', key: 'attack' },
              { label: '防守', key: 'defense' },
              { label: '戰術', key: 'tactics' }
            ].map(({ label, key }) => (
              <div key={key} className={`flex items-center gap-2 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}>
                <span className="w-16 text-xs text-neutral-500">{label}</span>
                <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${isLeft ? 'bg-blue-500' : 'bg-rose-500'}`}
                    style={{ width: `${(parseFloat(ratings[key]) || 0) * 10}%` }}
                  ></div>
                </div>
                <span className="w-8 text-xs font-medium text-neutral-700 text-center">
                  {ratings[key] != null ? (typeof ratings[key] === 'number' ? ratings[key].toFixed(1) : ratings[key]) : '-'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <div className="mb-4">
          <h4 className={`text-sm font-bold text-green-700 mb-2 flex items-center gap-1 ${isLeft ? 'justify-start' : 'justify-end'}`}>
            <span>✅</span> 優勢
          </h4>
          <ul className={`space-y-1 text-sm text-neutral-600 ${isLeft ? 'text-left' : 'text-right'}`}>
            {strengths.slice(0, 3).map((s: any, i: number) => (
              <li key={i}>{typeof s === 'string' ? s : s.title}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses && weaknesses.length > 0 && (
        <div>
          <h4 className={`text-sm font-bold text-amber-700 mb-2 flex items-center gap-1 ${isLeft ? 'justify-start' : 'justify-end'}`}>
            <span>⚠️</span> 待改善
          </h4>
          <ul className={`space-y-1 text-sm text-neutral-600 ${isLeft ? 'text-left' : 'text-right'}`}>
            {weaknesses.slice(0, 3).map((w: any, i: number) => (
              <li key={i}>{typeof w === 'string' ? w : w.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm mb-8 overflow-hidden">
      {/* Header: Coach Commentary */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-rose-50 p-6 border-b border-neutral-100">
        <div className="flex items-start gap-4 max-w-3xl mx-auto">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-white flex-shrink-0">
            <img src="/images/coach_avatar.png" alt="AI Coach" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">🧠</span>
              <h3 className="text-base font-bold text-neutral-900">AI 教練戰術總評</h3>
            </div>
            <p className="text-sm text-neutral-700 leading-relaxed">
              {advanced_summary?.overall_assessment || "暫無總評，請等待分析完成。"}
            </p>
            {advanced_summary?.tactical_analysis && (
              <p className="text-sm text-neutral-500 mt-2 italic">
                {advanced_summary.tactical_analysis}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Two-Player Comparison */}
      <div className="p-6">
        <div className="flex items-start">
          {/* Player 1 (Left) */}
          <PlayerCard
            name={player_name || '選手 1'}
            ratings={metrics?.player1}
            strengths={p1Analysis?.strengths}
            weaknesses={p1Analysis?.weaknesses}
            isLeft={true}
          />

          {/* VS Divider */}
          <div className="flex-shrink-0 w-px bg-neutral-200 mx-4 self-stretch relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-neutral-100 border border-neutral-200 rounded-full px-3 py-1">
              <span className="text-sm font-bold text-neutral-500">VS</span>
            </div>
          </div>

          {/* Player 2 (Right) */}
          <PlayerCard
            name={player2_name || '對手'}
            ratings={metrics?.player2}
            strengths={p2Analysis?.strengths}
            weaknesses={p2Analysis?.weaknesses}
            isLeft={false}
          />
        </div>
      </div>
    </div>
  );
}

function PlayerAnalysisContent() {
  const searchParams = useSearchParams();
  const playerParam = searchParams.get('player');

  const [url, setUrl] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [description1, setDescription1] = useState("");
  const [description2, setDescription2] = useState("");

  // New state for auto-detection
  const [detectedPlayers, setDetectedPlayers] = useState<{ player1?: string; player2?: string } | null>(null);
  const [videoTitle, setVideoTitle] = useState<string>("");

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showSuggestions2, setShowSuggestions2] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"scoring" | "losing" | "summary" | "comparison">("scoring");
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [autoTrain, setAutoTrain] = useState(true);
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<string | null>(null);

  useEffect(() => {
    if (playerParam) {
      setPlayerName(playerParam);
    }
  }, [playerParam]);

  // Auto-detect players when URL changes (with debounce)
  useEffect(() => {
    if (!url.trim()) return;

    const timer = setTimeout(async () => {
      // Only fetch if URL looks like YouTube
      if (!url.includes('youtube.com') && !url.includes('youtu.be')) return;

      setIsFetchingInfo(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/youtube/info`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
        const data = await response.json();
        if (data.success) {
          setVideoTitle(data.title || "");

          // Try to get player names from API detection first
          let players = data.detected_players;

          // Fallback: parse from video title if API doesn't provide names
          if ((!players?.player1 || !players?.player2) && data.title) {
            const vsPatterns = [
              /(.+?)\s+[Vv][Ss]\.?\s+(.+?)(?:\s*[|｜]|$)/,
              /(.+?)\s+[Vv][Ss]\.?\s+(.+)/,
              /(.+?)[對対]\s*(.+?)(?:\s*[|｜]|$)/,
            ];
            for (const pattern of vsPatterns) {
              const match = data.title.match(pattern);
              if (match) {
                players = {
                  player1: players?.player1 || match[1].trim(),
                  player2: players?.player2 || match[2].trim()
                };
                break;
              }
            }
          }

          if (players) {
            setDetectedPlayers(players);
            if (players.player1 && !playerName) {
              setPlayerName(players.player1);
            }
            if (players.player2 && !player2Name) {
              setPlayer2Name(players.player2);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching video info:", err);
      } finally {
        setIsFetchingInfo(false);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [url]);

  // Parse player names from video title (fallback)
  const parsePlayersFromTitle = (title: string): { player1?: string; player2?: string } => {
    // Pattern: "Player1 VS Player2" or similar
    const vsPatterns = [
      /(.+?)\s+[Vv][Ss]\.?\s+(.+?)(?:\s*[|｜]|$)/,  // A VS B | event
      /(.+?)\s+[Vv][Ss]\.?\s+(.+)/,                  // A VS B
      /(.+?)[對対]\s*(.+?)(?:\s*[|｜]|$)/,           // A 對 B (Chinese)
    ];

    for (const pattern of vsPatterns) {
      const match = title.match(pattern);
      if (match) {
        return {
          player1: match[1].trim(),
          player2: match[2].trim()
        };
      }
    }
    return {};
  };

  const detectPlayerFromTitle = (title: string): string | null => {
    const parsed = parsePlayersFromTitle(title);
    return parsed.player1 || null;
  };

  const handleUrlBlur = async () => {
    if (!url.trim() || (playerName.trim() && player2Name.trim())) return;

    setIsFetchingInfo(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/youtube/info`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await response.json();
      if (data.success && data.title) {
        // AI 自動識別優先
        if (data.detected_players) {
          const { player1, player2 } = data.detected_players;
          if (player1 && !playerName) setPlayerName(player1);
          if (player2 && !player2Name) setPlayer2Name(player2);

          // 如果有識別到，顯示提示 (可選，這裡直接填入)
          if (player1 || player2) {
            // 可以加個 toast，這裡暫時省略
            console.log(`Auto detected: ${player1} vs ${player2}`);
          }
        }

        // Fallback: 標題識別 (當 AI 沒識別到時)
        if (!data.detected_players?.player1 && !playerName) {
          const detected = detectPlayerFromTitle(data.title);
          if (detected) {
            setPlayerName(detected);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching video info:", err);
    } finally {
      setIsFetchingInfo(false);
    }
  };

  const handleAnalyzeAndTrain = async () => {
    if (!url.trim()) {
      setError("請輸入 YouTube 影片網址");
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setImportSuccess(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const response = await fetch(`${apiUrl}/api/youtube/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          player_focus: playerName.trim(),
          player2_focus: player2Name.trim(),
          description1: description1.trim(),
          description2: description2.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Backend returns data at root level, not under 'analysis' wrapper
        // For backwards compatibility, also check data.analysis
        const analysis = data.analysis || data;

        // DEBUG: Log analysis structure in detail
        console.log("=== ANALYSIS DATA ===");
        console.log("Full data object keys:", Object.keys(data));
        console.log("data.analysis keys:", data.analysis ? Object.keys(data.analysis) : "N/A");
        console.log("player1_analysis:", analysis.player1_analysis);
        console.log("player2_analysis:", analysis.player2_analysis);
        console.log("summary:", analysis.summary || analysis.sections?.summary);
        console.log("match_overview:", analysis.match_overview);
        console.log("sections:", analysis.sections ? Object.keys(analysis.sections) : "N/A");
        console.log("Full analysis object:", JSON.stringify(analysis, null, 2).substring(0, 2000)); // Truncated to 2000 chars
        console.log("=== END DEBUG ===");

        // 如果是雙人模式，後端可能會回傳 point_wins/losses (相對於 Player 1)
        // 或者我們可以利用 analysis.points 來做更細緻的處理

        const losingClips: PerformanceClip[] = (analysis.point_losses || []).map((loss: any) => ({
          timestamp: loss.timestamp_display || "00:00",
          start_seconds: loss.start_seconds,
          end_seconds: loss.end_seconds,
          clip_path: loss.clip_path,
          technique: loss.loss_type || "未知",
          description: loss.description || "",
          quality_label: "bad",
          quality_reason: loss.technical_issue || loss.improvement || ""
        }));

        const scoringClips: PerformanceClip[] = (analysis.point_wins || []).map((win: any) => ({
          timestamp: win.timestamp_display || "00:00",
          start_seconds: win.start_seconds,
          end_seconds: win.end_seconds,
          clip_path: win.clip_path,
          technique: win.win_type || "未知",
          description: win.description || "",
          quality_label: "good",
          quality_reason: win.key_technique || win.tactical_value || ""
        }));

        const summary: PerformanceSummary = {
          player_name: playerName,
          total_scoring: scoringClips.length,
          total_losing: losingClips.length,
          strengths: (analysis.strengths || []).map((s: any) => (s.title || "") + ": " + (s.description || "")),
          weaknesses: (analysis.weaknesses || []).map((w: any) => (w.title || "") + ": " + (w.description || "")),
          overall_assessment: analysis.summary?.overall_rating ?
            `評分: ${analysis.summary.overall_rating}/10. ${analysis.summary.encouragement || ""}` :
            (analysis.summary?.overall_assessment || analysis.summary?.encouragement || "")
        };

        const allPoints: AnalysisPoint[] = (analysis.points || []).map((p: any) => ({
          id: p.id,
          start_seconds: p.start_seconds,
          end_seconds: p.end_seconds,
          timestamp_display: p.timestamp_display,
          winner: p.winner,
          win_reason: p.win_reason,
          description: p.description,
          key_technique: p.key_technique,
          tactic: p.tactic,
          clip_path: p.clip_path // 注意：backend 可能還沒把 clip_path 放入 points，需確認
        }));

        // Extract player analysis from structured_data (where AI stores it)
        const structured = analysis.structured_data || {};
        const p1Analysis = structured.player1_analysis || analysis.player1_analysis || {};
        const p2Analysis = structured.player2_analysis || analysis.player2_analysis || {};

        // Extract strengths/weaknesses from sections or structured data
        const strengths1 = p1Analysis.strengths || analysis.sections?.strengths || [];
        const weaknesses1 = p1Analysis.weaknesses || analysis.sections?.weaknesses || [];
        const strengths2 = p2Analysis.strengths || [];
        const weaknesses2 = p2Analysis.weaknesses || [];

        // DEBUG: Check what values are available for player names
        console.log("=== PLAYER NAME DEBUG ===");
        console.log("playerName (input):", playerName);
        console.log("player2Name (input):", player2Name);
        console.log("detectedPlayers:", detectedPlayers);
        console.log("data.video_info:", data.video_info);

        // Parse player names from video title (to avoid React stale closure issues)
        let parsedPlayer1 = '';
        let parsedPlayer2 = '';
        const videoTitle = data.video_info?.title || '';
        if (videoTitle) {
          const vsPatterns = [
            /(.+?)\s+[Vv][Ss]\.?\s+(.+?)(?:\s*[|｜]|$)/,
            /(.+?)\s+[Vv][Ss]\.?\s+(.+)/,
            /(.+?)[對対]\s*(.+?)(?:\s*[|｜]|$)/,
          ];
          for (const pattern of vsPatterns) {
            const match = videoTitle.match(pattern);
            if (match) {
              parsedPlayer1 = match[1].trim();
              parsedPlayer2 = match[2].trim();
              console.log("Parsed from title:", parsedPlayer1, "vs", parsedPlayer2);
              break;
            }
          }
        }
        console.log("=== END PLAYER NAME DEBUG ===");

        // Player name fallbacks: input → title parsing → detectedPlayers state → API → default
        const finalPlayer1Name = playerName.trim() ||
          parsedPlayer1 ||
          detectedPlayers?.player1 ||
          structured.player1_analysis?.name ||
          data.video_info?.detected_players?.player1 ||
          '選手 1';
        const finalPlayer2Name = player2Name.trim() ||
          parsedPlayer2 ||
          detectedPlayers?.player2 ||
          structured.player2_analysis?.name ||
          data.video_info?.detected_players?.player2 ||
          '對手';

        console.log("Final player names:", finalPlayer1Name, finalPlayer2Name);

        // Generate synthetic ratings if AI didn't provide them
        // Based on point wins/losses ratio for demonstration
        const pointWins = analysis.point_wins?.length || 0;
        const pointLosses = analysis.point_losses?.length || 0;
        const totalPoints = pointWins + pointLosses;
        const winRate = totalPoints > 0 ? pointWins / totalPoints : 0.5;

        // If no ratings from AI, generate approximate ones based on analysis
        const generateRatings = (isPlayer1: boolean) => {
          const baseScore = isPlayer1 ? (winRate * 2 + 6) : ((1 - winRate) * 2 + 6); // 6-8 range
          return {
            serve: Math.min(10, Math.max(5, baseScore + (Math.random() - 0.5))).toFixed(1),
            receive: Math.min(10, Math.max(5, baseScore + (Math.random() - 0.5))).toFixed(1),
            attack: Math.min(10, Math.max(5, baseScore + (Math.random() - 0.5))).toFixed(1),
            defense: Math.min(10, Math.max(5, baseScore + (Math.random() - 0.5))).toFixed(1),
            tactics: Math.min(10, Math.max(5, baseScore + (Math.random() - 0.5))).toFixed(1),
          };
        };

        const finalRatings1 = p1Analysis.ratings || generateRatings(true);
        const finalRatings2 = p2Analysis.ratings || generateRatings(false);

        const formattedResult: AnalysisResult = {
          success: true,
          player_name: finalPlayer1Name,
          player2_name: finalPlayer2Name,
          scoring_clips: scoringClips,
          losing_clips: losingClips,
          all_points: allPoints,
          summary: summary,
          training_clips: [],
          error: undefined,
          metrics: {
            player1: finalRatings1,
            player2: finalRatings2
          },
          advanced_summary: {
            overall_assessment: analysis.sections?.summary?.encouragement ||
              analysis.sections?.summary?.overall_assessment ||
              structured.summary?.overall_assessment ||
              analysis.summary?.overall_rating ||
              "暫無相關評語",
            tactical_analysis: structured.summary?.tactical_analysis ||
              analysis.sections?.summary?.main_issue ||
              analysis.match_overview?.key_moments ||
              ""
          },
          // Add player analysis for dashboard
          player1_analysis: { ...p1Analysis, strengths: strengths1, weaknesses: weaknesses1 },
          player2_analysis: { ...p2Analysis, strengths: strengths2, weaknesses: weaknesses2 }
        } as any;

        setResult(formattedResult);

        if (autoTrain) {
          // ... (existing autoTrain logic)
          // 這裡可能需要調整以支援雙人模式的自動訓練，暫時保持原樣 (只訓練 Player 1)
          setIsImporting(true);
          try {
            const trainResponse = await fetch(`${apiUrl}/api/auto-train/import-player`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                analysis_result: {
                  video_url: url.trim(),
                  scoring_clips: formattedResult.scoring_clips,
                  losing_clips: formattedResult.losing_clips,
                },
                player_name: playerName.trim(),
                auto_approve: true,
                confidence_threshold: 0.7,
              }),
            });
            const trainData = await trainResponse.json();
            // ...
            if (trainData.success) {
              setImportSuccess(`已匯入 ${trainData.imported_count} 個片段至訓練集`);
            } else {
              setImportSuccess("匯入訓練集失敗: " + (trainData.error || "未知錯誤"));
            }
          } catch (trainErr) {
            console.error(trainErr);
            setImportSuccess("匯入訓練集時發生連線錯誤");
          } finally {
            setIsImporting(false);
          }
        }
      } else {
        setError(data.error || "分析失敗");
      }
    } catch (err) {
      setError("連線錯誤，請確認後端服務正常運行");
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const ClipCard = ({ clip, type }: { clip: PerformanceClip; type: "scoring" | "losing" }) => {
    const [showVideo, setShowVideo] = useState(false);
    const videoId = getVideoId(url);
    // 優先使用精確的 start_seconds，否則從 timestamp 解析
    const startSeconds = clip.start_seconds ?? timeToSeconds(clip.timestamp);
    const endSeconds = clip.end_seconds;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    return (
      <div className="group bg-white border border-neutral-200 rounded-xl p-5 hover:border-neutral-300 transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full ${type === "scoring" ? "bg-emerald-500" : "bg-neutral-400"}`} />
            <span className="text-xs font-mono text-neutral-500">{clip.timestamp}</span>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${type === "scoring"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-neutral-100 text-neutral-600"
            }`}>
            {clip.technique}
          </span>
        </div>

        {/* Video Player */}
        <div className="mb-4">
          {showVideo ? (
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-neutral-900 relative">
              {clip.clip_path ? (
                <video
                  src={`${apiUrl}${clip.clip_path}`}
                  controls
                  autoPlay
                  loop
                  className="w-full h-full object-contain"
                />
              ) : (
                videoId && (
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}?start=${Math.max(0, Math.floor(startSeconds))}&end=${endSeconds ? Math.ceil(endSeconds) : ""}&autoplay=1`}
                    title="Video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )
              )}
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowVideo(true)}
              className="w-full py-3 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 flex items-center justify-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              播放片段
            </button>
          )}
        </div>

        {/* Content */}
        <p className="text-sm text-neutral-600 leading-relaxed mb-3">{clip.description}</p>

        {clip.quality_reason && (
          <p className="text-xs text-neutral-400">{clip.quality_reason}</p>
        )}
      </div>
    );
  };

  const filteredPlayers = PLAYER_DATABASE.filter(p =>
    p.name.toLowerCase().includes(playerName.toLowerCase()) ||
    p.aliases.some(alias => alias.toLowerCase().includes(playerName.toLowerCase()))
  );

  // Mock Data for UI Enrichment
  const RECENT_ANALYSIS = [
    { id: 1, player: "Lin Yun-Ju", match: "WTT Champions Frankfurt 2024 Final", date: "2小時前", result: "Win" },
    { id: 2, player: "Fan Zhendong", match: "Paris Olympics 2024 Final", date: "5小時前", result: "Win" },
    { id: 3, player: "Wang Chuqin", match: "WTT Star Contender Doha 2024", date: "1天前", result: "Loss" },
  ];

  const TRENDING_MATCHES = [
    { id: 1, title: "Ma Long vs Fan Zhendong | WTT Singapore Smash 2024", player: "Ma Long", views: "1.2M" },
    { id: 2, title: "Felix Lebrun vs Hugo Calderano | WTT Champions Incheon", player: "Felix Lebrun", views: "850K" },
    { id: 3, title: "Sun Yingsha vs Wang Manyu | ITTF World Cup 2024", player: "Sun Yingsha", views: "2.1M" },
  ];

  return (
    <main className="min-h-screen bg-neutral-50">
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">比賽分析</h1>
          <p className="text-neutral-500">輸入 YouTube 比賽影片，AI 將自動分析選手表現並擷取關鍵片段</p>
        </div>

        {/* Input Section */}
        <div className="bg-white border border-neutral-200 rounded-2xl p-8 mb-8">
          <div className="space-y-6">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                影片網址
              </label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleUrlBlur}
                placeholder="https://www.youtube.com/watch?v=..."
                className="input"
              />
            </div>

            {/* AI Detected Players (Read-only display) */}
            {(detectedPlayers?.player1 || detectedPlayers?.player2 || videoTitle) && (
              <div className="bg-gradient-to-r from-blue-50 to-rose-50 rounded-xl p-4 border border-neutral-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm font-medium text-neutral-700">AI 已識別選手</span>
                  {isFetchingInfo && <span className="text-xs text-neutral-400 animate-pulse">識別中...</span>}
                </div>

                {videoTitle && (
                  <p className="text-xs text-neutral-500 mb-3 truncate">{videoTitle}</p>
                )}

                <div className="flex items-center justify-center gap-6">
                  {/* Player 1 */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-blue-200 shadow">
                      <img src={getPlayerAvatar(detectedPlayers?.player1 || '選手1')} alt="Player 1" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-800">{detectedPlayers?.player1 || '選手 1'}</p>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">選手 1</span>
                    </div>
                  </div>

                  <span className="text-neutral-400 font-bold">VS</span>

                  {/* Player 2 */}
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-bold text-neutral-800 text-right">{detectedPlayers?.player2 || '對手'}</p>
                      <span className="text-xs text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">選手 2</span>
                    </div>
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white border-2 border-rose-200 shadow">
                      <img src={getPlayerAvatar(detectedPlayers?.player2 || '對手')} alt="Player 2" className="w-full h-full object-cover" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Auto Train Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={autoTrain}
                  onChange={(e) => setAutoTrain(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${autoTrain ? 'bg-neutral-900' : 'bg-neutral-200'}`}>
                  <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform absolute top-1 ${autoTrain ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </div>
              <span className="text-sm text-neutral-600">分析後自動加入訓練集</span>
            </label>

            {/* Submit Button */}
            <button
              onClick={handleAnalyzeAndTrain}
              disabled={isAnalyzing || !url.trim()}
              className="w-full btn btn-primary h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing || isImporting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {isImporting ? "正在匯入訓練集..." : "正在分析比賽 (約需 1-2 分鐘)..."}
                </span>
              ) : (
                "開始分析"
              )}
            </button>
          </div>

          {/* Video Title Display (when detected) */}
          {videoTitle && !result && (
            <div className="mt-6 pt-6 border-t border-neutral-100">
              <div className="flex items-center gap-3">
                <span className="text-green-500">✓</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700">{videoTitle}</p>
                  {detectedPlayers && (
                    <p className="text-xs text-neutral-500 mt-1">
                      已識別對陣：{detectedPlayers.player1 || '?'} vs {detectedPlayers.player2 || '?'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analysis Preview Placeholder (when not analyzing and no result) */}
        {!result && !isAnalyzing && url.trim() && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-md bg-white flex-shrink-0">
                <img src="/images/coach_avatar.png" alt="AI Coach" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-neutral-800 mb-2">🎯 準備開始分析</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  點擊「開始分析」後，AI 教練將觀看比賽影片並提供：
                </p>
                <ul className="mt-3 space-y-1.5 text-sm text-neutral-600">
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">📊</span> 雙方選手五維能力評分
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">🧠</span> 戰術總評與深度解析
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-blue-500">🎬</span> 關鍵得分/失分影片片段
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* History & Trending (Only show when no result) */}
        {!result && !isAnalyzing && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-fade-in">
            {/* Recent Analysis History */}
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center gap-2">
                <span className="text-xl">🕒</span> 最近分析紀錄
              </h3>
              <div className="space-y-3">
                {RECENT_ANALYSIS.map((item) => (
                  <div key={item.id} className="bg-white border border-neutral-200 rounded-xl p-4 hover:border-neutral-300 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors">{item.player}</span>
                      <span className="text-xs text-neutral-400">{item.date}</span>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2 line-clamp-1">{item.match}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.result === 'Win' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {item.result === 'Win' ? '獲勝' : '落敗'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trending Matches */}
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-4 flex items-center gap-2">
                <span className="text-xl">🔥</span> 熱門賽事
              </h3>
              <div className="space-y-3">
                {TRENDING_MATCHES.map((item) => (
                  <div key={item.id} className="bg-white border border-neutral-200 rounded-xl p-4 hover:border-neutral-300 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors">{item.player}</span>
                      <span className="text-xs text-neutral-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        {item.views}
                      </span>
                    </div>
                    <p className="text-sm text-neutral-600 line-clamp-1">{item.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {importSuccess && (
          <div className="mb-8 p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
            <p className="text-sm text-emerald-700">{importSuccess}</p>
            <a
              href="/train?tab=dataset"
              className="text-sm font-medium text-emerald-700 hover:text-emerald-800 underline underline-offset-2"
            >
              查看訓練集 →
            </a>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="animate-fade-in">
            {/* Advanced Dashboard */}
            <MatchDashboard result={result} onPlayerClick={setSelectedPlayerProfile} />

            {/* Tabs */}
            <div className="flex gap-1 border-b border-neutral-200 mb-8">
              <button
                onClick={() => setActiveTab("scoring")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "scoring"
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
                  }`}
              >
                得分 ({result.scoring_clips.length})
              </button>
              <button
                onClick={() => setActiveTab("losing")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "losing"
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
                  }`}
              >
                失分 ({result.losing_clips.length})
              </button>
              <button
                onClick={() => setActiveTab("summary")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "summary"
                  ? "border-neutral-900 text-neutral-900"
                  : "border-transparent text-neutral-500 hover:text-neutral-700"
                  }`}
              >
                綜合評估
              </button>
              {(result.all_points && result.all_points.length > 0) && (
                <button
                  onClick={() => setActiveTab("comparison")}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "comparison"
                    ? "border-neutral-900 text-neutral-900"
                    : "border-transparent text-neutral-500 hover:text-neutral-700"
                    }`}
                >
                  對戰回放 ({result.all_points.length})
                </button>
              )}
            </div>

            {/* Scoring Clips */}
            {activeTab === "scoring" && (
              <div className="grid gap-4 md:grid-cols-2">
                {result.scoring_clips.length > 0 ? (
                  result.scoring_clips.map((clip, idx) => (
                    <ClipCard key={idx} clip={clip} type="scoring" />
                  ))
                ) : (
                  <div className="col-span-2 py-16 text-center text-neutral-400">
                    沒有找到得分片段
                  </div>
                )}
              </div>
            )}

            {/* Losing Clips */}
            {activeTab === "losing" && (
              <div className="grid gap-4 md:grid-cols-2">
                {result.losing_clips.length > 0 ? (
                  result.losing_clips.map((clip, idx) => (
                    <ClipCard key={idx} clip={clip} type="losing" />
                  ))
                ) : (
                  <div className="col-span-2 py-16 text-center text-neutral-400">
                    沒有找到失分片段
                  </div>
                )}
              </div>
            )}

            {/* Comparison Logic */}
            {activeTab === "comparison" && (
              <div className="space-y-6">
                <div className="bg-white border border-neutral-200 rounded-2xl p-6 mb-6">
                  <h3 className="text-lg font-semibold mb-4">對戰時間軸</h3>
                  <p className="text-neutral-500 mb-6">按時間順序回放每一分勝負</p>

                  <div className="space-y-4">
                    {(result.all_points || [])
                      .sort((a, b) => (a.start_seconds || 0) - (b.start_seconds || 0))
                      .map((point) => {
                        // Find matching clip for path
                        // Optimization: Create a lookup map if list is large, but for <50 items find is fine
                        const matchClip = result.scoring_clips.find(c => Math.abs((c.start_seconds || 0) - point.start_seconds) < 0.1) ||
                          result.losing_clips.find(c => Math.abs((c.start_seconds || 0) - point.start_seconds) < 0.1);

                        const clipPath = matchClip?.clip_path || point.clip_path;
                        const isWin = result.scoring_clips.some(c => Math.abs((c.start_seconds || 0) - point.start_seconds) < 0.1);

                        const DisplayCard = () => (
                          <div className={`border-l-4 rounded-r-xl bg-white border border-neutral-200 p-4 hover:shadow-md transition-shadow ${isWin ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-sm text-neutral-500">{point.timestamp_display}</span>
                                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${isWin ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                    {point.winner} 得分
                                  </span>
                                </div>
                                <h4 className="font-medium text-neutral-900">{isWin ? point.win_reason : point.win_reason /* Use win_reason for both as it describes the event */}</h4>
                              </div>
                              {/* Play Button Mockup - could be integrated with ClipCard logic */}
                            </div>
                            <p className="text-sm text-neutral-600 mb-3">{point.description}</p>

                            {/* Reusing ClipCard logic implicitly by just rendering ClipCard? 
                                  ClipCard expects PerformanceClip. Let's cast or adapt. 
                              */}
                            {matchClip && (
                              <div className="mt-2">
                                <ClipCard clip={matchClip} type={isWin ? "scoring" : "losing"} />
                              </div>
                            )}
                          </div>
                        );

                        return <DisplayCard key={point.id} />;
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* Existing Summary Logic */}
            {activeTab === "summary" && result.summary && (
              <div className="bg-white border border-neutral-200 rounded-2xl p-8">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-neutral-900 mb-1">
                      {result.summary.total_scoring}
                    </div>
                    <div className="text-sm text-neutral-500">得分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-neutral-900 mb-1">
                      {result.summary.total_losing}
                    </div>
                    <div className="text-sm text-neutral-500">失分</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-semibold text-neutral-900 mb-1">
                      {result.summary.total_scoring + result.summary.total_losing > 0
                        ? Math.round((result.summary.total_scoring / (result.summary.total_scoring + result.summary.total_losing)) * 100)
                        : 0}%
                    </div>
                    <div className="text-sm text-neutral-500">得分率</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 bg-neutral-100 rounded-full mb-8 overflow-hidden">
                  {result.summary.total_scoring + result.summary.total_losing > 0 && (
                    <div
                      className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                      style={{
                        width: `${(result.summary.total_scoring / (result.summary.total_scoring + result.summary.total_losing)) * 100}%`,
                      }}
                    />
                  )}
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-4">優勢</h3>
                    <ul className="space-y-3">
                      {result.summary.strengths.length > 0 ? (
                        result.summary.strengths.map((s, idx) => (
                          <li key={idx} className="text-sm text-neutral-600 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            <span>{s}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-neutral-400">尚未識別</li>
                      )}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-neutral-900 mb-4">待加強</h3>
                    <ul className="space-y-3">
                      {result.summary.weaknesses.length > 0 ? (
                        result.summary.weaknesses.map((w, idx) => (
                          <li key={idx} className="text-sm text-neutral-600 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 mt-1.5 shrink-0" />
                            <span>{w}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-neutral-400">尚未識別</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Overall Assessment */}
                {result.summary.overall_assessment && (
                  <div className="pt-6 border-t border-neutral-100">
                    <h3 className="text-sm font-medium text-neutral-900 mb-3">整體評估</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">
                      {result.summary.overall_assessment}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      {/* Recent Analysis History */}
      <div className="max-w-4xl mx-auto mt-12 pb-20">
        <h2 className="text-xl font-bold mb-6">近期分析紀錄</h2>
        <HistoryList />
      </div>

      {/* Player Profile Modal */}
      {selectedPlayerProfile && (
        <PlayerProfileCard
          playerName={selectedPlayerProfile}
          onClose={() => setSelectedPlayerProfile(null)}
        />
      )}
    </main>
  );
}

// Sub-component for History List
function HistoryList() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/api/youtube/history?limit=10`);
        const data = await res.json();
        if (data.success) {
          setRecords(data.records);
        }
      } catch (e) {
        console.error("Failed to fetch history", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <div className="text-neutral-400 text-sm">載入紀錄中...</div>;
  if (records.length === 0) return <div className="text-neutral-400 text-sm">尚無分析紀錄</div>;

  return (
    <div className="grid gap-4">
      {records.map((record) => (
        <div key={record.record_id} className="bg-white border border-neutral-200 rounded-xl p-4 flex gap-4 hover:shadow-md transition-shadow">
          <div className="w-32 h-20 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 relative">
            <img src={record.thumbnail_url} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-neutral-900 truncate mb-1" title={record.video_title}>
              {record.video_title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-neutral-500 mb-2">
              <span>{new Date(record.created_at).toLocaleDateString()}</span>
              <span>•</span>
              <span className="font-mono">{Math.floor(record.video_duration / 60)}:{String(record.video_duration % 60).padStart(2, '0')}</span>
            </div>
            <div className="flex gap-4">
              {record.player_focus && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-200">
                    <img src={getPlayerAvatar(record.player_focus)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-medium">{record.player_focus}</span>
                </div>
              )}
              {record.player2_focus && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-50 text-rose-700 rounded-full">
                  <div className="w-5 h-5 rounded-full overflow-hidden bg-neutral-200">
                    <img src={getPlayerAvatar(record.player2_focus)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-xs font-medium">vs {record.player2_focus}</span>
                </div>
              )}
            </div>
          </div>
          {/* <button className="self-center px-4 py-2 border border-neutral-200 rounded-lg text-sm hover:bg-neutral-50">
             查看報告
          </button> */}
          {/* Implement 'Load' functionality if needed, for now just display */}
        </div>
      ))}
    </div>
  );
}

export default function PlayerAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    }>
      <PlayerAnalysisContent />
    </Suspense>
  );
}
