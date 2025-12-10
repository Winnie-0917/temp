"""
排名服務
處理 WTT 排名資料的獲取、快取和過濾
"""
from typing import Dict, List, Optional, Any
from crawler import TableTennisRankingCrawler


class RankingService:
    """排名服務類別"""
    
    # 類別映射
    CATEGORY_FILTER_MAP = {
        'SEN_SINGLES': 'MDI',  # 男子單打
        'SEN_DOUBLES': 'MD',   # 男子雙打
        'WOM_SINGLES': 'WSI',  # 女子單打
        'WOM_DOUBLES': 'WD',   # 女子雙打
        'MIX_DOUBLES': 'XD'    # 混合雙打
    }
    
    VALID_CATEGORIES = ['SEN_SINGLES', 'SEN_DOUBLES', 'WOM_SINGLES', 'WOM_DOUBLES', 'MIX_DOUBLES']
    
    def __init__(self):
        self.crawler = TableTennisRankingCrawler()
    
    def get_ranking(self, category: str) -> Optional[Dict[str, Any]]:
        """
        取得特定類別的排名資料
        
        Args:
            category: 排名類別
            
        Returns:
            過濾後的排名資料
        """
        if category not in self.VALID_CATEGORIES:
            return None
        
        # 嘗試讀取快取
        data = self.crawler.load_data(category)
        
        # 如果沒有資料，立即抓取
        if not data:
            print(f"首次抓取 {category} 資料...")
            self.crawler.fetch_ranking(category)
            data = self.crawler.load_data(category)
        
        if not data:
            return None
        
        # 過濾和排序資料
        return self._filter_ranking_data(data, category)
    
    def _filter_ranking_data(self, data: Dict, category: str) -> Dict:
        """
        過濾排名資料
        
        Args:
            data: 原始排名資料
            category: 排名類別
            
        Returns:
            過濾後的資料
        """
        if 'data' not in data or 'Result' not in data['data']:
            return data
        
        original_result = data['data']['Result']
        sub_event_code = self.CATEGORY_FILTER_MAP.get(category)
        
        if sub_event_code:
            filtered_result = [
                player for player in original_result 
                if player.get('SubEventCode') == sub_event_code
            ]
        else:
            filtered_result = original_result
        
        # 按照 CurrentRank 排序
        filtered_result.sort(key=lambda x: int(x.get('CurrentRank', 999999)))
        
        # 更新資料
        data['data']['Result'] = filtered_result
        data['data']['TotalRecords'] = len(filtered_result)
        
        return data
    
    def get_all_rankings(self) -> Dict[str, Any]:
        """取得所有排名資料"""
        all_data = {}
        
        for category in self.VALID_CATEGORIES:
            data = self.crawler.load_data(category)
            if data:
                all_data[category] = data
        
        return all_data
    
    def update_all(self) -> Dict[str, Any]:
        """更新所有排名資料"""
        return self.crawler.update_all_rankings()
    
    def get_scheduler(self):
        """取得爬蟲實例用於排程"""
        return self.crawler
