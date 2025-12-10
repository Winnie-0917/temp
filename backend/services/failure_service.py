"""
失誤分析服務
處理失誤影片分析和 Gemini AI 整合
"""
from typing import Dict, Any, Optional


class FailureService:
    """失誤分析服務類別"""
    
    def __init__(self):
        self._analyzer = None
    
    def _get_analyzer(self):
        """延遲載入分析器"""
        if self._analyzer is None:
            from failure_analyzer import FailureAnalyzer
            self._analyzer = FailureAnalyzer()
        return self._analyzer
    
    def analyze(self, video_path: str, use_gemini: bool = True) -> Dict[str, Any]:
        """
        分析失誤影片
        
        Args:
            video_path: 影片路徑
            use_gemini: 是否使用 Gemini AI
            
        Returns:
            分析結果
        """
        analyzer = self._get_analyzer()
        return analyzer.analyze_failure(video_path, use_gemini=use_gemini)
    
    def is_gemini_available(self) -> bool:
        """
        檢查 Gemini API 是否可用
        
        Returns:
            是否可用
        """
        analyzer = self._get_analyzer()
        return analyzer.model is not None
    
    def get_config(self) -> Dict[str, Any]:
        """
        取得分析配置
        
        Returns:
            配置資訊
        """
        from config import get_config
        config = get_config()
        
        return {
            'gemini_available': self.is_gemini_available(),
            'supported_formats': config.ai.SUPPORTED_VIDEO_FORMATS,
            'max_duration_seconds': config.ai.MAX_VIDEO_DURATION,
            'recommended_duration_seconds': config.ai.RECOMMENDED_VIDEO_DURATION,
        }
