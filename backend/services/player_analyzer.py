"""
選手表現分析模組
分析特定選手的得分與失分片段，並進行動作品質標註
"""
import os
import json
import time
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum


class ActionQuality(Enum):
    """動作品質評級"""
    GOOD = "good"        # 優秀動作，值得學習
    NORMAL = "normal"    # 一般動作，可參考
    BAD = "bad"          # 需改進動作，作為反面教材


@dataclass
class AnalyzedClip:
    """分析後的片段"""
    clip_id: int
    timestamp_seconds: int
    timestamp_display: str
    is_point_won: bool           # True=得分, False=失分
    point_type: str              # 得分/失分方式
    description: str             # 情況描述
    
    # AI 動作品質分析
    action_quality: str          # good/normal/bad
    quality_reason: str          # 品質評定原因
    technical_score: int         # 技術評分 1-10
    
    # 動作細節
    footwork_analysis: str       # 腳步分析
    stroke_analysis: str         # 擊球分析
    positioning_analysis: str    # 位置分析
    timing_analysis: str         # 時機分析
    
    # 學習價值
    learning_value: str          # 這個片段的學習價值
    training_suggestion: str     # 訓練建議
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class PlayerPerformanceAnalyzer:
    """選手表現分析器"""
    
    def __init__(self, api_key: str = None):
        import google.generativeai as genai
        from dotenv import load_dotenv
        
        load_dotenv()
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        
        if not self.api_key:
            raise ValueError("需要 GEMINI_API_KEY")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-2.0-flash')
    
    def analyze_player_performance(
        self, 
        video_path: str, 
        player_name: str,
        player_description: str = None
    ) -> Dict[str, Any]:
        """
        分析特定選手的完整表現
        
        Args:
            video_path: 影片路徑
            player_name: 選手名稱
            player_description: 選手描述（幫助識別，如「穿紅色衣服」）
        
        Returns:
            包含得分和失分分析的完整報告
        """
        import google.generativeai as genai
        
        print(f"📹 正在上傳影片進行 {player_name} 表現分析...")
        
        # 上傳影片
        video_file = genai.upload_file(path=video_path)
        
        # 等待處理
        while video_file.state.name == "PROCESSING":
            print("⏳ 處理中...")
            time.sleep(5)
            video_file = genai.get_file(video_file.name)
        
        if video_file.state.name == "FAILED":
            raise RuntimeError("影片處理失敗")
        
        print(f"🤖 正在分析 {player_name} 的表現...")
        
        # 建立分析提示
        prompt = self._build_player_analysis_prompt(player_name, player_description)
        
        # 呼叫 Gemini
        response = self.model.generate_content(
            [video_file, prompt],
            generation_config={
                "max_output_tokens": 12000,
                "temperature": 0.3,
            }
        )
        
        # 解析結果
        result = self._parse_player_analysis(response.text, player_name)
        
        # 清理
        try:
            genai.delete_file(video_file.name)
        except:
            pass
        
        return result
    
    def _build_player_analysis_prompt(self, player_name: str, player_description: str = None) -> str:
        """建立選手分析提示詞"""
        
        player_identify = f"（{player_description}）" if player_description else ""
        
        return f"""你是一位專業的桌球教練和動作分析專家。請仔細觀看這段桌球比賽影片，
針對選手 **{player_name}** {player_identify} 進行詳細的表現分析。

## 分析任務

請識別 {player_name} 在比賽中的：
1. **得分片段** - {player_name} 成功得分的回合
2. **失分片段** - {player_name} 失誤或被對手得分的回合

## 重要：動作品質評估標準

對於每個片段，請根據 **動作本身的品質** 進行評估（而非僅依據結果）：

### 🟢 GOOD（優秀）- 適合作為正面訓練教材
- 動作流暢、技術標準
- 腳步到位、重心穩定
- 擊球時機準確
- 戰術選擇正確
- 即使失分，動作本身仍然標準值得學習

### 🟡 NORMAL（一般）- 作為參考素材
- 動作基本正確但不夠精煉
- 有小瑕疵但整體可接受
- 一般水平的技術表現

### 🔴 BAD（需改進）- 作為反面教材
- 明顯的技術錯誤
- 腳步混亂、重心失衡
- 擊球動作變形
- 時機判斷嚴重失誤
- 這類動作需要避免

請按照以下 JSON 格式輸出：

```json
{{
  "player_name": "{player_name}",
  "match_summary": {{
    "total_points_won": 識別到的得分數,
    "total_points_lost": 識別到的失分數,
    "overall_performance": "整體表現評價",
    "key_strengths": ["強項1", "強項2"],
    "key_weaknesses": ["弱點1", "弱點2"]
  }},
  "points_won": [
    {{
      "clip_id": 1,
      "timestamp_seconds": 精確的影片秒數,
      "timestamp_display": "MM:SS",
      "is_point_won": true,
      "point_type": "得分方式（如：正手拉球得分、發球直接得分等）",
      "description": "這個得分的詳細情況描述",
      "action_quality": "good/normal/bad",
      "quality_reason": "為什麼給這個動作品質評級",
      "technical_score": 技術評分1-10,
      "footwork_analysis": "腳步分析",
      "stroke_analysis": "擊球動作分析",
      "positioning_analysis": "位置和站位分析",
      "timing_analysis": "時機把握分析",
      "learning_value": "這個片段對訓練的價值",
      "training_suggestion": "基於此片段的訓練建議"
    }}
  ],
  "points_lost": [
    {{
      "clip_id": 1,
      "timestamp_seconds": 精確的影片秒數,
      "timestamp_display": "MM:SS",
      "is_point_won": false,
      "point_type": "失分方式（如：反手失誤、接發球出界等）",
      "description": "這個失分的詳細情況描述",
      "action_quality": "good/normal/bad",
      "quality_reason": "為什麼給這個動作品質評級（注意：失分也可能是good動作）",
      "technical_score": 技術評分1-10,
      "footwork_analysis": "腳步分析",
      "stroke_analysis": "擊球動作分析",
      "positioning_analysis": "位置和站位分析",
      "timing_analysis": "時機把握分析",
      "learning_value": "這個片段對訓練的價值（正面或反面教材）",
      "training_suggestion": "基於此片段的訓練建議"
    }}
  ],
  "training_recommendations": [
    {{
      "priority": 1,
      "area": "需要訓練的領域",
      "description": "具體的訓練方法",
      "related_clips": [相關片段的clip_id列表]
    }}
  ]
}}
```

## 重要提醒

1. **timestamp_seconds 必須準確** - 這將用於擷取訓練片段
2. **action_quality 基於動作品質，不是結果** - 失分但動作標準可以是 good，得分但動作很差可以是 bad
3. **盡可能識別所有明顯的得分和失分** - 至少各 3-5 個
4. **請使用繁體中文**
5. **只輸出 JSON，不要有其他文字**
"""

    def _parse_player_analysis(self, response_text: str, player_name: str) -> Dict[str, Any]:
        """解析選手分析結果"""
        import json
        
        try:
            # 清理 markdown 標記
            clean_text = response_text.strip()
            if clean_text.startswith('```json'):
                clean_text = clean_text[7:]
            if clean_text.startswith('```'):
                clean_text = clean_text[3:]
            if clean_text.endswith('```'):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()
            
            parsed = json.loads(clean_text)
            
            # 標準化輸出
            return {
                "success": True,
                "player_name": player_name,
                "match_summary": parsed.get("match_summary", {}),
                "points_won": parsed.get("points_won", []),
                "points_lost": parsed.get("points_lost", []),
                "all_clips": self._merge_and_sort_clips(
                    parsed.get("points_won", []),
                    parsed.get("points_lost", [])
                ),
                "training_recommendations": parsed.get("training_recommendations", []),
                "quality_distribution": self._calculate_quality_distribution(
                    parsed.get("points_won", []),
                    parsed.get("points_lost", [])
                ),
                "raw_response": response_text
            }
            
        except json.JSONDecodeError as e:
            print(f"⚠️ JSON 解析失敗: {e}")
            return {
                "success": False,
                "player_name": player_name,
                "error": str(e),
                "raw_response": response_text,
                "points_won": [],
                "points_lost": [],
                "all_clips": []
            }
    
    def _merge_and_sort_clips(self, points_won: List, points_lost: List) -> List[Dict]:
        """合併並按時間排序所有片段"""
        all_clips = []
        
        for clip in points_won:
            clip["is_point_won"] = True
            all_clips.append(clip)
        
        for clip in points_lost:
            clip["is_point_won"] = False
            all_clips.append(clip)
        
        # 按時間排序
        all_clips.sort(key=lambda x: x.get("timestamp_seconds", 0))
        
        return all_clips
    
    def _calculate_quality_distribution(self, points_won: List, points_lost: List) -> Dict[str, Any]:
        """計算動作品質分布"""
        all_clips = points_won + points_lost
        
        distribution = {
            "total": len(all_clips),
            "good": 0,
            "normal": 0,
            "bad": 0,
            "by_result": {
                "won": {"good": 0, "normal": 0, "bad": 0, "total": len(points_won)},
                "lost": {"good": 0, "normal": 0, "bad": 0, "total": len(points_lost)}
            }
        }
        
        for clip in points_won:
            quality = clip.get("action_quality", "normal")
            distribution[quality] = distribution.get(quality, 0) + 1
            distribution["by_result"]["won"][quality] += 1
        
        for clip in points_lost:
            quality = clip.get("action_quality", "normal")
            distribution[quality] = distribution.get(quality, 0) + 1
            distribution["by_result"]["lost"][quality] += 1
        
        return distribution


def analyze_player_from_youtube(
    youtube_url: str,
    player_name: str,
    player_description: str = None
) -> Dict[str, Any]:
    """
    從 YouTube 影片分析選手表現
    
    Args:
        youtube_url: YouTube 影片 URL
        player_name: 選手名稱
        player_description: 選手描述
    
    Returns:
        完整的分析結果
    """
    from youtube_analyzer import YouTubeDownloader
    
    # 下載影片
    downloader = YouTubeDownloader()
    download_result = downloader.download(youtube_url)
    
    if not download_result.get("success"):
        raise RuntimeError("影片下載失敗")
    
    # 分析選手表現
    analyzer = PlayerPerformanceAnalyzer()
    result = analyzer.analyze_player_performance(
        download_result["file_path"],
        player_name,
        player_description
    )
    
    # 加入影片資訊
    result["video_info"] = {
        "url": youtube_url,
        "video_id": download_result.get("video_id"),
        "title": download_result.get("title"),
        "duration": download_result.get("duration")
    }
    
    # 清理暫存檔案
    try:
        os.remove(download_result["file_path"])
    except:
        pass
    
    return result


if __name__ == "__main__":
    # 測試
    analyzer = PlayerPerformanceAnalyzer()
    print("PlayerPerformanceAnalyzer 初始化成功")
