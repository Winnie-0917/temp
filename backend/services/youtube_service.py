"""
YouTube 分析服務
處理 YouTube 比賽影片的下載和分析
"""
from typing import Dict, Any, Optional
import os


class YouTubeAnalysisService:
    """YouTube 分析服務類別"""
    
    def __init__(self):
        self._analyzer = None
    
    def _get_analyzer(self):
        """延遲載入分析器"""
        if self._analyzer is None:
            from youtube_analyzer import YouTubeMatchAnalyzer
            self._analyzer = YouTubeMatchAnalyzer()
        return self._analyzer
    
    def analyze(
        self, 
        youtube_url: str, 
        player_focus: str = None,
        player2_focus: str = None,
        description1: str = None,
        description2: str = None
    ) -> Dict[str, Any]:
        """
        分析 YouTube 比賽影片
        
        Args:
            youtube_url: YouTube 影片 URL
            player_focus: 選手1
            player2_focus: 選手2
            description1: 選手1 描述
            description2: 選手2 描述
            
        Returns:
            分析結果
        """
        analyzer = self._get_analyzer()
        return analyzer.analyze_youtube_match(youtube_url, player_focus, player2_focus, description1, description2)
    
    def validate_url(self, url: str) -> bool:
        """
        驗證 YouTube URL 是否有效
        
        Args:
            url: 要驗證的 URL
            
        Returns:
            是否為有效的 YouTube URL
        """
        from youtube_analyzer import YouTubeDownloader
        downloader = YouTubeDownloader()
        return downloader.extract_video_id(url) is not None
    
    def get_video_info(self, youtube_url: str) -> Dict[str, Any]:
        """
        取得 YouTube 影片資訊（不下載）
        
        Args:
            youtube_url: YouTube 影片 URL
            
        Returns:
            影片資訊
        """
        from youtube_analyzer import YouTubeDownloader
        from services.metadata_extractor import MetadataExtractor
        
        downloader = YouTubeDownloader()
        info = downloader._get_video_info(youtube_url)
        
        if info:
            # 自動識別選手
            extractor = MetadataExtractor()
            players = extractor.extract_players(info.get('title', ''), info.get('description', ''))
            info['detected_players'] = players
            
        return info
