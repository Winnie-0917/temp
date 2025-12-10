"""
YouTube 比賽分析模組
下載 YouTube 影片並使用 Gemini AI 分析失分回放
"""
import os
import re
import tempfile
import subprocess
from typing import Optional, Dict, Any, List
from pathlib import Path


class YouTubeDownloader:
    """YouTube 影片下載器"""
    
    def __init__(self, output_dir: str = None):
        self.output_dir = output_dir or tempfile.gettempdir()
        os.makedirs(self.output_dir, exist_ok=True)
    
    def extract_video_id(self, url: str) -> Optional[str]:
        """
        從 YouTube URL 提取影片 ID
        
        支援格式:
        - https://www.youtube.com/watch?v=VIDEO_ID
        - https://youtu.be/VIDEO_ID
        - https://www.youtube.com/embed/VIDEO_ID
        """
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        return None
    
    def download(self, url: str, max_duration: int = 600) -> Dict[str, Any]:
        """
        下載 YouTube 影片
        
        Args:
            url: YouTube 影片 URL
            max_duration: 最大下載時長（秒），預設 10 分鐘
            
        Returns:
            包含影片資訊和檔案路徑的字典
        """
        video_id = self.extract_video_id(url)
        if not video_id:
            raise ValueError("無效的 YouTube URL")
        
        output_path = os.path.join(self.output_dir, f"{video_id}.mp4")
        
        # 使用 yt-dlp 作為 Python 模組下載
        try:
            import yt_dlp
            
            ydl_opts = {
                'format': 'best[height<=720][ext=mp4]/best[height<=720]/best',
                'outtmpl': output_path,
                'noplaylist': True,
                'max_filesize': 500 * 1024 * 1024,  # 500MB
                'quiet': True,
                'no_warnings': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                
            if not os.path.exists(output_path):
                # 有時候檔名會有不同的副檔名
                possible_files = [f for f in os.listdir(self.output_dir) if f.startswith(video_id)]
                if possible_files:
                    actual_file = os.path.join(self.output_dir, possible_files[0])
                    if actual_file != output_path:
                        os.rename(actual_file, output_path)
                else:
                    raise RuntimeError("影片下載失敗，檔案不存在")
            
            return {
                'success': True,
                'video_id': video_id,
                'file_path': output_path,
                'title': info.get('title', '未知'),
                'duration': info.get('duration', 0),
                'url': url
            }
            
        except ImportError:
            raise RuntimeError("找不到 yt-dlp，請先安裝: pip install yt-dlp")
        except Exception as e:
            raise RuntimeError(f"下載失敗: {str(e)}")
    
    def _get_video_info(self, url: str) -> Dict[str, Any]:
        """取得影片資訊"""
        try:
            import yt_dlp
            
            ydl_opts = {
                'quiet': True,
                'no_warnings': True,
                'skip_download': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
            return {
                'success': True,
                'title': info.get('title', ''),
                'description': info.get('description', ''),
                'duration': info.get('duration', 0),
                'thumbnail': info.get('thumbnail', ''),
                'channel': info.get('uploader', '')
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }

    def get_video_info(self, url: str) -> Dict[str, Any]:
        """公開方法：取得影片資訊"""
        return self._get_video_info(url)
    
    def download_segment(self, url: str, start_time: int, duration: int = 30) -> str:
        """
        下載影片的特定片段
        
        Args:
            url: YouTube 影片 URL
            start_time: 開始時間（秒）
            duration: 片段長度（秒）
            
        Returns:
            片段檔案路徑
        """
        video_id = self.extract_video_id(url)
        output_path = os.path.join(self.output_dir, f"{video_id}_{start_time}_{duration}.mp4")
        
        cmd = [
            'yt-dlp',
            '-f', 'best[height<=720][ext=mp4]/best[height<=720]/best',
            '--download-sections', f'*{start_time}-{start_time + duration}',
            '-o', output_path,
            url
        ]
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            if result.returncode == 0 and os.path.exists(output_path):
                return output_path
        except:
            pass
        
        raise RuntimeError("片段下載失敗")

    def cut_local_segment(self, input_path: str, start_time: float, end_time: float, output_path: str) -> bool:
        """
        從本地影片切割片段
        """
        # 確保輸出目錄存在
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        try:
            start = float(start_time)
            end = float(end_time)
            duration = end - start
            
            if duration <= 0:
                print(f"⚠️ 片段長度無效: {start} -> {end}")
                return False
            
            # 使用 -ss 在 -i 之前 (Fast Seek)，並使用 -t 指定持續時間
            # 這是最準確且快速的切割方式
            cmd = [
                'ffmpeg',
                '-y',
                '-ss', str(start),
                '-i', input_path,
                '-t', str(duration),
                '-c:v', 'libx264',
                '-preset', 'ultrafast',
                '-c:a', 'aac',
                output_path
            ]
            
            print(f"✂️ 切割影片: {start}s -> {end}s (長度: {duration}s)")
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode != 0:
                print(f"❌ FFmpeg 錯誤: {result.stderr}")
                return False
                
            return os.path.exists(output_path)
            
        except Exception as e:
            print(f"切割影片失敗: {e}")
            return False



class MatchAnalyzer:
    """比賽分析器 - 使用 Gemini AI 分析比賽影片"""
    
    def __init__(self, api_key: str = None):
        import google.generativeai as genai
        from dotenv import load_dotenv
        
        load_dotenv()
        self.api_key = api_key or os.getenv('GEMINI_API_KEY')
        
        if not self.api_key:
            raise ValueError("需要 GEMINI_API_KEY")
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-3.0-pro-preview')
    
    def analyze_match(self, video_path: str, player_focus: str = None, player2_focus: str = None, description1: str = None, description2: str = None) -> Dict[str, Any]:
        """
        分析完整比賽影片
        
        Args:
            video_path: 影片檔案路徑
            player_focus: 關注選手/選手1
            player2_focus: 選手2 (可選)
            description1: 選手1 特徵描述
            description2: 選手2 特徵描述
            
        Returns:
            分析結果
        """
        import google.generativeai as genai
        
        print(f"📹 正在上傳影片: {video_path}")
        
        # 上傳影片到 Gemini
        video_file = genai.upload_file(path=video_path)
        
        # 等待處理完成
        import time
        while video_file.state.name == "PROCESSING":
            print("⏳ 處理中...")
            time.sleep(5)
            video_file = genai.get_file(video_file.name)
        
        if video_file.state.name == "FAILED":
            raise RuntimeError("影片處理失敗")
        
        print("🤖 正在分析比賽...")
        
        # 建立分析提示
        prompt = self._build_analysis_prompt(player_focus, player2_focus, description1, description2)
        
        # 呼叫 Gemini 分析
        response = self.model.generate_content(
            [video_file, prompt],
            generation_config={
                "max_output_tokens": 8192,
                "temperature": 0.4,
            }
        )
        
        # 解析回應
        analysis = self._parse_response(response.text)
        
        # 切割影片片段
        print(f"🎬 開始切割影片片段，來源: {video_path}")
        try:
            video_filename = os.path.basename(video_path)
            video_id = os.path.splitext(video_filename)[0]
            
            # 定義片段儲存路徑 (相對於 backend)
            # 這裡使用相對路徑確保在 Docker 中也能運作
            base_clip_dir = os.path.join('uploads', 'clips', video_id)
            abs_clip_dir = os.path.abspath(base_clip_dir)
            print(f"📁 影片片段儲存目錄: {abs_clip_dir}")
            
            downloader = YouTubeDownloader()
            
            # 處理得分片段
            wins_count = 0
            if 'point_wins' in analysis:
                for point in analysis['point_wins']:
                    start = point.get('start_seconds')
                    end = point.get('end_seconds')
                    print(f"  🎯 得分片段 {point.get('id')}: start={start}, end={end}")
                    if start is not None and end is not None:
                        clip_filename = f"win_{point['id']}.mp4"
                        clip_path = os.path.join(abs_clip_dir, clip_filename)
                        if downloader.cut_local_segment(video_path, start, end, clip_path):
                            # 儲存相對路徑供前端使用 (API 會提供靜態文件服務)
                            point['clip_path'] = f"/uploads/clips/{video_id}/{clip_filename}"
                            wins_count += 1
                            print(f"    ✅ 成功: {point['clip_path']}")
                        else:
                            print(f"    ❌ 失敗")
            print(f"📊 得分片段切割完成: {wins_count} 個")
                            
            # 處理失分片段
            losses_count = 0
            if 'point_losses' in analysis:
                for point in analysis['point_losses']:
                    start = point.get('start_seconds')
                    end = point.get('end_seconds')
                    print(f"  🎯 失分片段 {point.get('id')}: start={start}, end={end}")
                    if start is not None and end is not None:
                        clip_filename = f"loss_{point['id']}.mp4"
                        clip_path = os.path.join(abs_clip_dir, clip_filename)
                        if downloader.cut_local_segment(video_path, start, end, clip_path):
                            point['clip_path'] = f"/uploads/clips/{video_id}/{clip_filename}"
                            losses_count += 1
                            print(f"    ✅ 成功: {point['clip_path']}")
                        else:
                            print(f"    ❌ 失敗")
            print(f"📊 失分片段切割完成: {losses_count} 個")
                            
        except Exception as e:
            print(f"⚠️ 切割片段時發生錯誤: {e}")
            import traceback
            traceback.print_exc()
        
        # 清理上傳的檔案
        try:
            genai.delete_file(video_file.name)
        except:
            pass
        
        return analysis
    
    def _build_analysis_prompt(self, player_focus: str = None, player2_focus: str = None, description1: str = None, description2: str = None) -> str:
        """建立分析提示詞"""
        
        # 定義選手與描述
        p1_name = player_focus if player_focus else "選手A"
        p1_desc = f"({description1})" if description1 else ""
        
        p2_info = ""
        mode_instruction = ""
        
        if player2_focus:
            p2_name = player2_focus
            p2_desc = f"({description2})" if description2 else ""
            
            p1_full = f"**{p1_name}** {p1_desc}"
            p2_full = f"**{p2_name}** {p2_desc}"
            
            mode_instruction = f"""
## 👥 雙人對戰模式

本影片為 **{p1_full}** 對戰 **{p2_full}**。
請分析雙方的每一分勝負。

**選手識別資訊**：
- {p1_full}
- {p2_full}
"""
        else:
            # 單人模式
            p1_full = f"**{p1_name}** {p1_desc}"
            mode_instruction = f"""
## 👤 單人關注模式

特別關注 **{p1_full}** 的表現。
請分析 {p1_name} 的得分與失分。

**選手識別資訊**：
- {p1_full}
"""

        return f"""你是一位世界级專業桌球教練和比賽分析師，擁有多年國際賽事分析經驗。請逐幀仔細觀看這段桌球比賽影片，並提供精確的分析報告。

{mode_instruction}

## 🎯 分析目標

請識別比賽中的**每一個完整回合**并進行分析。這需要你：
1. 精確識別發球時刻（選手拋球動作開始）
2. 追蹤球的軌跡直到死球
3. 判斷得分方並分析原因

## 📊 得分判定標準（關鍵！）

### ✅ 判定「得分」的畫面特徵：
1. **球落在對手半場桌面外**（出界）→ 擊球者得分
2. **球撞網後未過網**（下網）→ 擊球者對手得分
3. **球彈兩次或更多**（對手未能接到）→ 擊球者得分
4. **發球直接得分**（ACE 或對手接發失誤）→ 發球者得分
5. **裁判舉手指示**：注意裁判手勢方向
6. **比分板變動**：若可見，以比分板為準

### ❌ 判定「失誤」的情況：
1. **我方擊球出界/下網** → 對手得分（我方失分）
2. **發球失誤**（觸網/出界）→ 對手得分
3. **接發球失誤**（直接出界）→ 發球者得分

### ⚠️ 精確判斷技巧：
1. **看最後觸球的選手**：如果最後觸球者擊球出界，則對手得分
2. **聽聲音**：球落地聲 vs 球落桌聲音不同
3. **看選手反應**：得分者通常會有慶祝動作或準備下一分
4. **看裁判**：裁判會用手指向得分方
5. **若有計分板**：確認分數變動

## ⏱️ 時間標記規則（核心重點！）

**🎬 優先使用慢動作回放時間：**

大多數專業賽事直播會在每一分結束後 **播放慢動作回放**。
**請優先使用回放畫面的時間點作為 `start_seconds`**，原因：
1. 回放畫面更清晰，球的軌跡更容易追蹤
2. 回放通常會標示關鍵動作
3. 比原始比賽畫面更適合教學分析

**精確定位方法：**
1. 找到該分的**慢動作回放開始**時刻 = `start_seconds`
2. 找到**回放結束**（或下一分發球前）= `end_seconds`
3. 若無回放，則使用原始比賽畫面：發球前 2 秒 → 死球後 2 秒

**新增欄位說明：**
- `replay_start_seconds`: 慢動作回放開始的時間（如果有）
- `start_seconds`: **優先填入回放時間**，若無則填原始比賽時間
- `has_replay`: true/false 標記是否有回放畫面

**驗證規則：**
- 每一分的 `end_seconds` 必須 **小於** 下一分的 `start_seconds`
- 時間戳必須是**連續遞增**的

## 🎬 慢動作回放識別

**慢動作回放的特徵：**
1. 畫面速度明顯變慢
2. 可能有 "Replay"、"Slow Motion"、"精彩回放" 等文字
3. 通常在得分後 2-5 秒出現
4. 畫面可能有特殊邊框或濾鏡效果

## ❌ 排除的畫面（不記錄時間點）

1. **比賽暫停**：選手擦汗、喝水、與教練交談
2. **非比賽畫面**：過場動畫、觀眾鏡頭、贊助商廣告
3. **撿球畫面**：選手撿球不算比賽進行中

## 📝 輸出格式 (JSON)

請輸出以下 JSON 格式（僅輸出 JSON，不要有其他文字）：

```json
{{
  "match_overview": {{
    "match_type": "單打或雙打",
    "player1_info": "{p1_name} 的識別特徵（衣服顏色、持拍手）",
    "player2_info": "對手/選手2 的識別特徵（衣服顏色、持拍手）",
    "score_summary": "最終比分 (如 11:9, 11:7, 11:5)",
    "total_points_analyzed": "分析的總回合數",
    "key_moments": "關鍵轉折點描述"
  }},
  "points": [
    {{
      "id": 1,
      "serve_time": "發球動作開始的精確秒數 (float)",
      "dead_ball_time": "死球瞬間的精確秒數 (float)",
      "start_seconds": "serve_time - 2 (float)",
      "end_seconds": "dead_ball_time + 2 (float)",
      "timestamp_display": "MM:SS",
      "server": "發球者名字",
      "winner": "{p1_name} 或 對手",
      "win_reason": "得分原因（主動得分/對手失誤）",
      "win_type": "致勝球類型（正手攻擊/反手拉球/發球直接得分等）",
      "description": "完整回合描述：從發球到死球的過程",
      "rally_length": "回合拍數（估計多少拍）",
      "key_technique": "決定勝負的關鍵技術",
      "tactic": "使用的戰術"
    }}
  ],
  "player1_analysis": {{
    "name": "{p1_name}",
    "ratings": {{
       "serve": 8.5,
       "receive": 7.0,
       "attack": 9.0,
       "defense": 6.5,
       "tactics": 8.0
    }},
    "strengths": [ {{"title": "優點標題", "description": "詳細說明"}} ],
    "weaknesses": [ {{"title": "待改善項目", "description": "詳細說明"}} ],
    "suggestions": [ {{"title": "訓練建議", "description": "如何改進"}} ]
  }},
  "player2_analysis": {{
    "name": "{player2_focus if player2_focus else '對手'}",
    "ratings": {{
       "serve": 8.0,
       "receive": 7.5,
       "attack": 8.5,
       "defense": 8.5,
       "tactics": 9.0
    }},
    "strengths": [ {{"title": "優點標題", "description": "詳細說明"}} ],
    "weaknesses": [ {{"title": "待改善項目", "description": "詳細說明"}} ],
    "suggestions": [ {{"title": "訓練建議", "description": "如何改進"}} ]
  }},
  "summary": {{
    "overall_assessment": "整體比賽戰術總評，描述勝負關鍵與比賽流向",
    "tactical_analysis": "雙方戰術博弈的深度分析",
    "encouragement": "給選手的鼓勵話語",
    "main_issue": "主要需要改善的問題"
  }}
}}
```

## ⚡ 重要提醒

1. **準確性優先**：寧可少分析幾個不確定的回合，也不要錯誤判斷得分方。
2. **時間戳驗證**：確保所有時間戳按順序遞增。
3. **五維評分**：根據比賽實際表現客觀評分 (0-10)，不要給所有項目都打很高或很低的分。
4. **繁體中文**：所有輸出使用繁體中文。
5. **完整分析**：盡可能分析所有可見的完整回合。
"""

    def _parse_response(self, response_text: str) -> Dict[str, Any]:
        """解析 Gemini 回應"""
        import json
        
        # 嘗試從回應中提取 JSON
        try:
            # 移除可能的 markdown 代碼塊標記
            clean_text = response_text.strip()
            if clean_text.startswith('```json'):
                clean_text = clean_text[7:]
            if clean_text.startswith('```'):
                clean_text = clean_text[3:]
            if clean_text.endswith('```'):
                clean_text = clean_text[:-3]
            clean_text = clean_text.strip()
            
            # 解析 JSON
            parsed = json.loads(clean_text)
            
            # --- 相容性轉換 ---
            # 新版 Prompt 回傳 'points' 列表，需轉換為舊版的 point_wins / point_losses
            # 這裡假設如果沒有特別指定 player_focus，則第一位選手或者 winner 是 '關注選手' 為 Win
            
            point_wins = []
            point_losses = []
            
            if 'points' in parsed:
                # 新版結構
                for p in parsed['points']:
                    # 簡易判斷：如果沒有明確指定 player_focus，我們暫時無法精確區分
                    # 但通常前端會傳入 player_focus。
                    # 這裡我們將所有 points 都保留，但在前端顯示時可能需要過濾。
                    # 為相容舊版，直接轉換欄位
                    
                    # 暫時將所有點都放入 wins/losses，這取決於 winner 欄位
                    # 但這裏我們不知道 "Player 1" 是誰，除非我們有 context。
                    # 不過，我們可以直接把 'points' 傳回去，讓前端處理。
                    # 為了舊版相容，我們嘗試轉換：
                    
                    winner = p.get('winner', '')
                    # 假設主要關注的是 player1_analysis 中的 name
                    p1_name = parsed.get('player1_analysis', {}).get('name', '')
                    
                    base_point = {
                        "id": p.get('id'),
                        "start_seconds": p.get('start_seconds'),
                        "end_seconds": p.get('end_seconds'),
                        "timestamp_display": p.get('timestamp_display'),
                        "description": p.get('description'),
                        "serve_time": p.get('serve_time'),
                        "dead_ball_time": p.get('dead_ball_time'),
                        "winner": winner
                    }
                    
                    # 判斷是 Win 還是 Loss (相對於 Player 1)
                    # 如果 winner 包含 p1_name (模糊比對)
                    is_p1_win = False
                    if p1_name and p1_name in winner:
                        is_p1_win = True
                    elif "選手A" in winner: # Default name
                        is_p1_win = True
                    
                    if is_p1_win:
                        win_point = base_point.copy()
                        win_point['win_type'] = p.get('win_reason', '得分')
                        win_point['key_technique'] = p.get('key_technique')
                        win_point['tactical_value'] = p.get('tactic')
                        point_wins.append(win_point)
                    else:
                        loss_point = base_point.copy()
                        loss_point['loss_type'] = p.get('win_reason', '失分') # 對手的得分原因 = 我的失分原因 (+/-)
                        loss_point['technical_issue'] = p.get('key_technique') # 對手的技術 = 我的問題? 不一定，先這樣映射
                        point_losses.append(loss_point)

            else:
                # 舊版結構 (Fallback)
                point_wins = parsed.get('point_wins', [])
                point_losses = parsed.get('point_losses', [])
            
            # 合併新舊結構的 Strengths/Weaknesses
            strengths = parsed.get('strengths', parsed.get('player1_analysis', {}).get('strengths', []))
            weaknesses = parsed.get('weaknesses', parsed.get('player1_analysis', {}).get('weaknesses', []))
            suggestions = parsed.get('training_suggestions', parsed.get('player1_analysis', {}).get('suggestions', []))
            summary_section = parsed.get('summary', {})
            
            # --- 結束相容性轉換 ---
            
            # 生成人類可讀的分析文字
            raw_analysis = self._generate_readable_analysis(parsed)
            
            return {
                'success': True,
                'raw_analysis': raw_analysis,
                'structured_data': parsed,
                'point_wins': point_wins,
                'point_losses': point_losses,
                'points': parsed.get('points', []), # 保留完整 points 列表供新版前端使用
                'player1_analysis': parsed.get('player1_analysis'),
                'player2_analysis': parsed.get('player2_analysis'),
                'match_overview': parsed.get('match_overview', {}),
                'sections': {
                    'match_overview': parsed.get('match_overview', {}),
                    'strengths': strengths,
                    'weaknesses': weaknesses,
                    'training_suggestions': suggestions,
                    'summary': summary_section
                }
            }
        except json.JSONDecodeError as e:
            print(f"⚠️ JSON 解析失敗，使用原始文字: {e}")
            # 如果無法解析 JSON，回退到原始文字
            return {
                'success': True,
                'raw_analysis': response_text,
                'structured_data': None,
                'point_wins': [],
                'point_losses': [],
                'sections': self._extract_sections(response_text)
            }
    
    def _generate_readable_analysis(self, data: Dict[str, Any]) -> str:
        """從結構化數據生成可讀的分析報告"""
        lines = []
        
        # 比賽概況
        overview = data.get('match_overview', {})
        lines.append("## 📊 比賽概況")
        lines.append(f"- 比賽類型：{overview.get('match_type', '未知')}")
        lines.append(f"- 比分概況：{overview.get('score_summary', '未知')}")
        lines.append(f"- 關鍵轉折：{overview.get('key_moments', '無')}")
        lines.append("")
        
        # 得分分析
        point_wins = data.get('point_wins', [])
        if point_wins:
            lines.append("## 🌟 得分回放分析")
            for i, win in enumerate(point_wins, 1):
                lines.append(f"\n### 得分 {i} [{win.get('timestamp_display', '??:??')}]")
                lines.append(f"- **得分方式**: {win.get('win_type', '未知')}")
                lines.append(f"- **情況描述**: {win.get('description', '')}")
                if win.get('key_technique'):
                    lines.append(f"- **關鍵技術**: {win.get('key_technique')}")
                if win.get('tactical_value'):
                    lines.append(f"- **戰術價值**: {win.get('tactical_value')}")
            lines.append("")

        # 失分分析
        point_losses = data.get('point_losses', [])
        if point_losses:
            lines.append("## 🎯 失分回放分析")
            for i, loss in enumerate(point_losses, 1):
                lines.append(f"\n### 失分 {i} [{loss.get('timestamp_display', '??:??')}]")
                lines.append(f"- **失分方式**: {loss.get('loss_type', '未知')}")
                lines.append(f"- **情況描述**: {loss.get('description', '')}")
                if loss.get('technical_issue'):
                    lines.append(f"- **技術問題**: {loss.get('technical_issue')}")
                if loss.get('position_issue'):
                    lines.append(f"- **站位問題**: {loss.get('position_issue')}")
                if loss.get('judgment_issue'):
                    lines.append(f"- **判斷失誤**: {loss.get('judgment_issue')}")
                lines.append(f"- **改進建議**: {loss.get('improvement', '')}")
            lines.append("")
        
        # 優點
        strengths = data.get('strengths', [])
        if strengths:
            lines.append("## 💪 選手優點")
            for s in strengths:
                lines.append(f"- **{s.get('title', '')}**: {s.get('description', '')}")
            lines.append("")
        
        # 弱點
        weaknesses = data.get('weaknesses', [])
        if weaknesses:
            lines.append("## ⚠️ 選手弱點")
            for w in weaknesses:
                lines.append(f"- **{w.get('title', '')}**: {w.get('description', '')}")
            lines.append("")
        
            lines.append("")
        
        # 選手評分
        p1_analysis = data.get('player1_analysis', {})
        p2_analysis = data.get('player2_analysis', {})
        
        if p1_analysis.get('ratings') or p2_analysis.get('ratings'):
             lines.append("## 📊 選手能力評分")
             
             if p1_analysis.get('ratings'):
                 r = p1_analysis['ratings']
                 name = p1_analysis.get('name', '選手1')
                 lines.append(f"### {name}")
                 lines.append(f"- 發球: {r.get('serve', 0)}")
                 lines.append(f"- 接發球: {r.get('receive', 0)}")
                 lines.append(f"- 進攻: {r.get('attack', 0)}")
                 lines.append(f"- 防守: {r.get('defense', 0)}")
                 lines.append(f"- 戰術: {r.get('tactics', 0)}")
                 
             if p2_analysis.get('ratings'):
                 r = p2_analysis['ratings']
                 name = p2_analysis.get('name', '選手2')
                 lines.append(f"\n### {name}")
                 lines.append(f"- 發球: {r.get('serve', 0)}")
                 lines.append(f"- 接發球: {r.get('receive', 0)}")
                 lines.append(f"- 進攻: {r.get('attack', 0)}")
                 lines.append(f"- 防守: {r.get('defense', 0)}")
                 lines.append(f"- 戰術: {r.get('tactics', 0)}")
             lines.append("")

        # 訓練建議
        suggestions = data.get('training_suggestions', [])
        if suggestions:
            lines.append("## 📈 訓練建議")
            for s in suggestions:
                lines.append(f"- **{s.get('title', '')}**: {s.get('description', '')}")
                if s.get('frequency'):
                    lines.append(f"  - 建議頻率：{s.get('frequency')}")
            lines.append("")
        
        # 總結
        summary = data.get('summary', {})
        if summary:
            lines.append("## 🏆 總結")
            if summary.get('overall_rating'):
                lines.append(f"- 整體評分：{summary.get('overall_rating')}/10")
            if summary.get('main_issue'):
                lines.append(f"- 主要問題：{summary.get('main_issue')}")
            if summary.get('encouragement'):
                lines.append(f"- {summary.get('encouragement')}")
        
        return "\n".join(lines)
    
    def _extract_sections(self, text: str) -> Dict[str, str]:
        """從回應中提取各個章節"""
        sections = {}
        
        # 使用正則表達式提取各章節
        section_patterns = [
            (r'## 📊 比賽概況\n(.*?)(?=## |$)', 'match_overview'),
            (r'## 🎯 失分回放分析\n(.*?)(?=## |$)', 'point_loss_analysis'),
            (r'## 💪 選手優點\n(.*?)(?=## |$)', 'strengths'),
            (r'## ⚠️ 選手弱點\n(.*?)(?=## |$)', 'weaknesses'),
            (r'## 📈 訓練建議\n(.*?)(?=## |$)', 'training_suggestions'),
            (r'## 🏆 總結\n(.*?)(?=## |$)', 'summary'),
        ]
        
        for pattern, key in section_patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                sections[key] = match.group(1).strip()
        
        return sections


class YouTubeMatchAnalyzer:
    """YouTube 比賽分析器 - 整合下載和分析功能"""
    
    def __init__(self, api_key: str = None, temp_dir: str = None):
        self.downloader = YouTubeDownloader(temp_dir)
        self.analyzer = MatchAnalyzer(api_key)
        self.temp_dir = temp_dir or tempfile.gettempdir()
    
    def analyze_youtube_match(
        self, 
        youtube_url: str, 
        player_focus: str = None,
        player2_focus: str = None,
        description1: str = None,
        description2: str = None,
        keep_video: bool = False
    ) -> Dict[str, Any]:
        """
        分析 YouTube 桌球比賽影片
        
        Args:
            youtube_url: YouTube 影片 URL
            player_focus: 選手1
            player2_focus: 選手2
            description1: 選手1 描述
            description2: 選手2 描述
            keep_video: 是否保留下載的影片
            
        Returns:
            完整分析結果
        """
        video_info = None
        video_path = None
        
        try:
            # 1. 下載影片
            print("📥 正在下載 YouTube 影片...")
            video_info = self.downloader.download(youtube_url)
            video_path = video_info['file_path']
            
            print(f"✅ 下載完成: {video_info['title']}")
            print(f"   時長: {video_info['duration']} 秒")
            
            # 2. 分析影片
            print("\n🔍 開始分析比賽...")
            analysis = self.analyzer.analyze_match(video_path, player_focus, player2_focus, description1, description2)
            
            # 3. 組合結果
            result = {
                'success': True,
                'video_info': {
                    'title': video_info['title'],
                    'url': youtube_url,
                    'duration': video_info['duration'],
                    'video_id': video_info['video_id']
                },
                'analysis': analysis
            }
            
            return result
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'video_info': video_info
            }
        
        finally:
            # 清理暫存檔案
            if video_path and not keep_video and os.path.exists(video_path):
                try:
                    os.remove(video_path)
                    print("🧹 已清理暫存影片")
                except:
                    pass


def analyze_youtube_video(url: str, player_focus: str = None) -> Dict[str, Any]:
    """
    便捷函數：分析 YouTube 桌球比賽影片
    
    Args:
        url: YouTube 影片 URL
        player_focus: 要關注的選手（可選）
        
    Returns:
        分析結果
    """
    analyzer = YouTubeMatchAnalyzer()
    return analyzer.analyze_youtube_match(url, player_focus)


if __name__ == '__main__':
    # 測試用
    import sys
    
    if len(sys.argv) > 1:
        url = sys.argv[1]
        player = sys.argv[2] if len(sys.argv) > 2 else None
        
        print(f"🏓 開始分析: {url}")
        if player:
            print(f"👤 關注選手: {player}")
        
        result = analyze_youtube_video(url, player)
        
        if result['success']:
            print("\n" + "=" * 60)
            print("📋 分析報告")
            print("=" * 60)
            print(result['analysis']['raw_analysis'])
        else:
            print(f"\n❌ 分析失敗: {result['error']}")
    else:
        print("用法: python youtube_analyzer.py <YouTube URL> [選手名稱]")
        print("範例: python youtube_analyzer.py https://www.youtube.com/watch?v=xxxxx 林昀儒")
