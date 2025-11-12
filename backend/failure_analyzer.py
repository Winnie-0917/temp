"""
桌球失誤分析模組 - 使用 Gemini AI
分析失分原因並提供改進建議
"""
import os
import json
import base64
import cv2
import numpy as np
from typing import Dict, List, Tuple, Optional
import google.generativeai as genai
from skeleton import PoseExtractor
from dotenv import dotenv_values

class FailureAnalyzer:
    def __init__(self, api_key: Optional[str] = None):
        """
        初始化失誤分析器
        
        Args:
            api_key: Gemini API 金鑰（若無則從環境變數讀取）
        """
        # 直接從 .env 檔案讀取
        if not api_key:
            env_config = dotenv_values('.env')
            api_key = env_config.get('GEMINI_API_KEY') or os.getenv('GEMINI_API_KEY')
        
        self.api_key = api_key
        if self.api_key:
            genai.configure(api_key=self.api_key)
            # 使用 Gemini 2.5 Pro 模型
            self.model = genai.GenerativeModel('gemini-2.5-pro')
        else:
            self.model = None
            print("⚠️  未設定 GEMINI_API_KEY，將使用基礎分析模式")
        
        self.pose_extractor = PoseExtractor()
    
    def extract_key_frames(self, video_path: str, num_frames: int = 5) -> List[np.ndarray]:
        """
        從影片中抽取關鍵幀
        
        Args:
            video_path: 影片路徑
            num_frames: 要抽取的幀數
            
        Returns:
            關鍵幀列表
        """
        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # 均勻分佈選取幀
        frame_indices = np.linspace(0, total_frames - 1, num_frames, dtype=int)
        
        frames = []
        for idx in frame_indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ret, frame = cap.read()
            if ret:
                frames.append(frame)
        
        cap.release()
        return frames
    
    def analyze_pose_sequence(self, frames: List[np.ndarray]) -> Dict:
        """
        分析姿態序列
        
        Args:
            frames: 影像幀列表
            
        Returns:
            結構化的姿態分析數據
        """
        pose_data = []
        
        for i, frame in enumerate(frames):
            # 使用 MediaPipe 提取姿態
            results = self.pose_extractor.extract_pose(frame)
            
            if results and results.pose_landmarks:
                landmarks = results.pose_landmarks.landmark
                
                # 計算關鍵點位置
                right_wrist = landmarks[16]  # 右手腕
                right_elbow = landmarks[14]  # 右手肘
                right_shoulder = landmarks[12]  # 右肩
                
                # 計算拍面角度（簡化版）
                wrist_pos = np.array([right_wrist.x, right_wrist.y])
                elbow_pos = np.array([right_elbow.x, right_elbow.y])
                arm_vector = wrist_pos - elbow_pos
                racket_angle = np.degrees(np.arctan2(arm_vector[1], arm_vector[0]))
                
                # 計算重心位置
                left_hip = landmarks[23]
                right_hip = landmarks[24]
                center_of_mass = {
                    'x': (left_hip.x + right_hip.x) / 2,
                    'y': (left_hip.y + right_hip.y) / 2,
                    'z': (left_hip.z + right_hip.z) / 2
                }
                
                pose_data.append({
                    'frame_index': i,
                    'racket_angle': float(racket_angle),
                    'wrist_height': float(right_wrist.y),
                    'elbow_height': float(right_elbow.y),
                    'shoulder_height': float(right_shoulder.y),
                    'center_of_mass': center_of_mass,
                    'confidence': float(np.mean([lm.visibility for lm in landmarks]))
                })
        
        return {
            'total_frames': len(frames),
            'analyzed_frames': len(pose_data),
            'pose_sequence': pose_data,
            'avg_racket_angle': float(np.mean([p['racket_angle'] for p in pose_data])) if pose_data else 0,
            'racket_angle_variance': float(np.var([p['racket_angle'] for p in pose_data])) if pose_data else 0
        }
    
    def estimate_ball_trajectory(self, frames: List[np.ndarray]) -> Dict:
        """
        估計球的軌跡（簡化版）
        
        Args:
            frames: 影像幀列表
            
        Returns:
            球軌跡分析數據
        """
        # 這裡可以用 YOLO 等物件偵測，目前用簡化版
        # 實際應用建議使用專門的球追蹤算法
        
        return {
            'trajectory_detected': False,
            'ball_speed': 'medium',
            'spin_type': 'unknown',
            'landing_position': 'unknown',
            'note': '需要更精確的球追蹤模型來獲得詳細軌跡'
        }
    
    def generate_structured_analysis(self, video_path: str) -> Dict:
        """
        生成結構化分析數據
        
        Args:
            video_path: 影片路徑
            
        Returns:
            完整的結構化分析
        """
        # 1. 抽取關鍵幀
        frames = self.extract_key_frames(video_path, num_frames=5)
        
        # 2. 分析姿態
        pose_analysis = self.analyze_pose_sequence(frames)
        
        # 3. 分析球軌跡（簡化版）
        trajectory = self.estimate_ball_trajectory(frames)
        
        # 4. 獲取影片資訊
        cap = cv2.VideoCapture(video_path)
        duration = cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS)
        cap.release()
        
        return {
            'video_info': {
                'duration_seconds': float(duration),
                'analyzed_frames': len(frames)
            },
            'pose_analysis': pose_analysis,
            'ball_trajectory': trajectory,
            'technical_indicators': {
                'stance': self._evaluate_stance(pose_analysis),
                'racket_control': self._evaluate_racket_control(pose_analysis),
                'body_balance': self._evaluate_balance(pose_analysis)
            }
        }
    
    def _evaluate_stance(self, pose_analysis: Dict) -> str:
        """評估站位"""
        if not pose_analysis['pose_sequence']:
            return 'unknown'
        
        # 簡化評估邏輯
        avg_angle = pose_analysis['avg_racket_angle']
        if abs(avg_angle) > 60:
            return 'too_tilted'
        elif abs(avg_angle) < 20:
            return 'too_flat'
        return 'normal'
    
    def _evaluate_racket_control(self, pose_analysis: Dict) -> str:
        """評估拍面控制"""
        variance = pose_analysis['racket_angle_variance']
        if variance > 500:
            return 'unstable'
        elif variance > 200:
            return 'moderate'
        return 'stable'
    
    def _evaluate_balance(self, pose_analysis: Dict) -> str:
        """評估身體平衡"""
        if not pose_analysis['pose_sequence']:
            return 'unknown'
        
        # 檢查重心變化
        com_y_values = [p['center_of_mass']['y'] for p in pose_analysis['pose_sequence']]
        variance = np.var(com_y_values)
        
        if variance > 0.01:
            return 'unstable'
        return 'stable'
    
    def analyze_with_gemini(self, structured_data: Dict, video_path: Optional[str] = None) -> Dict:
        """
        使用 Gemini AI 進行深度分析
        
        Args:
            structured_data: 結構化分析數據
            video_path: 影片路徑（可選，用於直接分析）
            
        Returns:
            Gemini 分析結果
        """
        if not self.model:
            return {
                'error': 'Gemini API 未配置',
                'fallback_analysis': self._basic_analysis(structured_data)
            }
        
        try:
            # 構建提示詞
            prompt = f"""
你是一位專業的桌球教練。請根據以下技術數據，分析選手在這段影片中的失誤原因。

📊 技術數據：
{json.dumps(structured_data, indent=2, ensure_ascii=False)}

請以 JSON 格式輸出分析結果：
{{
  "failure_reason": "失分的主要原因（50字以內）",
  "category": "技術類別（站位錯誤/旋轉判斷錯誤/拍面角度/時間差/重心不穩/其他）",
  "detailed_analysis": {{
    "stance": "站位分析",
    "racket_angle": "拍面角度分析",
    "body_balance": "身體平衡分析",
    "timing": "擊球時機分析"
  }},
  "improvement_suggestions": [
    "具體改進建議1",
    "具體改進建議2",
    "具體改進建議3"
  ],
  "summary": "一句話總結（30字以內）",
  "severity": "問題嚴重程度（minor/moderate/severe）"
}}

請用繁體中文回答，專注於技術分析和實用建議。
"""
            
            # 呼叫 Gemini API
            if video_path and os.path.exists(video_path):
                # 影片直接分析模式
                with open(video_path, 'rb') as f:
                    video_data = f.read()
                
                video_base64 = base64.b64encode(video_data).decode('utf-8')
                
                response = self.model.generate_content([
                    {"text": prompt},
                    {"inline_data": {"mime_type": "video/mp4", "data": video_base64}}
                ])
            else:
                # 純文字分析模式
                response = self.model.generate_content(prompt)
            
            # 解析回應
            result_text = response.text
            print(f"📝 Gemini 原始回應長度: {len(result_text)}")
            print(f"📝 Gemini 原始回應前 500 字元:\n{result_text[:500]}")
            
            # 嘗試提取 JSON
            try:
                # 移除可能的 markdown 標記
                if '```json' in result_text:
                    result_text = result_text.split('```json')[1].split('```')[0]
                elif '```' in result_text:
                    result_text = result_text.split('```')[1].split('```')[0]
                
                analysis_result = json.loads(result_text.strip())
                print(f"✅ JSON 解析成功")
                print(f"📊 解析結果: {json.dumps(analysis_result, ensure_ascii=False, indent=2)}")
                analysis_result['source'] = 'gemini'
                return analysis_result
            
            except json.JSONDecodeError as je:
                # 如果無法解析 JSON，返回原始文字
                print(f"❌ JSON 解析失敗: {str(je)}")
                print(f"🔍 嘗試解析的文字:\n{result_text}")
                return {
                    'source': 'gemini',
                    'raw_response': result_text,
                    'parsed': False
                }
        
        except Exception as e:
            print(f"❌ Gemini 分析失敗: {str(e)}")
            return {
                'error': str(e),
                'fallback_analysis': self._basic_analysis(structured_data)
            }
    
    def _basic_analysis(self, structured_data: Dict) -> Dict:
        """基礎分析（當 Gemini 不可用時）"""
        tech_indicators = structured_data.get('technical_indicators', {})
        pose_analysis = structured_data.get('pose_analysis', {})
        
        issues = []
        suggestions = []
        
        # 根據技術指標給出建議
        if tech_indicators.get('stance') == 'too_tilted':
            issues.append('拍面過於傾斜')
            suggestions.append('調整拍面角度，保持適中的傾斜度')
        
        if tech_indicators.get('racket_control') == 'unstable':
            issues.append('拍面控制不穩定')
            suggestions.append('加強手腕穩定性訓練，保持一致的擊球動作')
        
        if tech_indicators.get('body_balance') == 'unstable':
            issues.append('重心不穩')
            suggestions.append('注意保持下盤穩定，擊球時重心下壓')
        
        if not issues:
            issues.append('無明顯技術問題')
            suggestions.append('繼續保持良好的技術動作')
        
        return {
            'source': 'basic',
            'failure_reason': '、'.join(issues),
            'category': '技術問題',
            'improvement_suggestions': suggestions,
            'summary': f"主要問題：{issues[0]}" if issues else "動作良好",
            'severity': 'moderate' if len(issues) > 1 else 'minor'
        }
    
    def analyze_failure(self, video_path: str, use_gemini: bool = True) -> Dict:
        """
        完整的失誤分析流程
        
        Args:
            video_path: 影片路徑
            use_gemini: 是否使用 Gemini 分析
            
        Returns:
            完整分析結果
        """
        print(f"🎬 開始分析影片: {video_path}")
        
        # 1. 生成結構化數據
        print("📊 生成結構化分析數據...")
        structured_data = self.generate_structured_analysis(video_path)
        
        # 2. 使用 Gemini 分析（或基礎分析）
        if use_gemini and self.model:
            print("🤖 使用 Gemini AI 進行深度分析...")
            ai_analysis = self.analyze_with_gemini(structured_data, video_path)
        else:
            print("📝 使用基礎分析模式...")
            ai_analysis = self._basic_analysis(structured_data)
        
        # 3. 合併結果
        return {
            'structured_data': structured_data,
            'ai_analysis': ai_analysis,
            'timestamp': self._get_timestamp()
        }
    
    def _get_timestamp(self) -> str:
        """獲取時間戳"""
        from datetime import datetime
        return datetime.now().isoformat()


# 測試代碼
if __name__ == '__main__':
    # 測試分析器
    analyzer = FailureAnalyzer()
    
    # 測試影片路徑
    test_video = 'uploads/test_video.mp4'
    
    if os.path.exists(test_video):
        result = analyzer.analyze_failure(test_video)
        print("\n" + "="*50)
        print("分析結果：")
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        print(f"⚠️  測試影片不存在: {test_video}")
