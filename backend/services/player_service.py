import os
import json
from typing import List, Dict, Any, Optional

class PlayerService:
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data')
        self.categories = ['SEN_SINGLES', 'SEN_DOUBLES', 'WOM_SINGLES', 'WOM_DOUBLES']
        self.players_cache = {}
        self._load_all_players()

    def _load_all_players(self):
        """載入所有類別的選手資料並建立索引"""
        self.players_cache = {}
        
        # Map SubEventCode to internal category names
        subevent_map = {
            'MDI': 'SEN_SINGLES',
            'WSI': 'WOM_SINGLES',
            'MD': 'SEN_DOUBLES',
            'WD': 'WOM_DOUBLES',
            'XD': 'MIX_DOUBLES'
        }

        # Files to check
        files_to_check = ['SEN_SINGLES', 'SEN_DOUBLES', 'WOM_SINGLES', 'WOM_DOUBLES', 'MIX_DOUBLES']
        
        for file_key in files_to_check:
            file_path = os.path.join(self.data_dir, f'{file_key}.json')
            if os.path.exists(file_path):
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if 'data' in data and 'Result' in data['data']:
                            for item in data['data']['Result']:
                                # Determine category from SubEventCode
                                sub_event = item.get('SubEventCode')
                                category = subevent_map.get(sub_event, file_key)
                                
                                # Check if it is a pair (Doubles)
                                if 'PairId' in item:
                                    # Process Player 1
                                    self._process_player(item, '1', category)
                                    # Process Player 2 (suffix '1d' based on observation)
                                    self._process_player(item, '1d', category)
                                else:
                                    # Process Single Player
                                    self._process_player(item, '', category)
                                    
                except Exception as e:
                    print(f"Error loading {file_key}: {e}")

    def _process_player(self, item: Dict, suffix: str, category: str):
        """處理單個選手資料並更新 cache"""
        # Construct field names based on suffix
        id_field = f'IttfId{suffix}'
        name_field = f'PlayerName{suffix}'
        country_field = f'CountryName{suffix}'
        country_code_field = f'CountryCode{suffix}'
        
        ittf_id = item.get(id_field)
        if not ittf_id:
            return

        # Points field varies between singles and doubles files
        points = item.get('RankingPointsYTD') or item.get('Points')
        
        if ittf_id in self.players_cache:
            if category not in self.players_cache[ittf_id]['categories']:
                self.players_cache[ittf_id]['categories'].append(category)
            
            # Update ranking for this category
            self.players_cache[ittf_id]['rankings'][category] = {
                'rank': item.get('CurrentRank'),
                'points': points
            }
        else:
            self.players_cache[ittf_id] = {
                'id': ittf_id,
                'name': item.get(name_field),
                'country': item.get(country_field),
                'country_code': item.get(country_code_field),
                'photo_url': item.get('PhotoUrl'), # PhotoUrl might not exist in doubles, but get() handles it
                'categories': [category],
                'rankings': {
                    category: {
                        'rank': item.get('CurrentRank'),
                        'points': points
                    }
                }
            }

    def get_all_players(self, page=1, per_page=20, search=None) -> Dict[str, Any]:
        """取得所有選手列表（支援分頁與搜尋）"""
        # 重新載入以確保資料最新
        self._load_all_players()
        
        all_players = list(self.players_cache.values())
        
        # 搜尋過濾
        if search:
            search_lower = search.lower()
            all_players = [
                p for p in all_players 
                if search_lower in p['name'].lower() or 
                   search_lower in p['country'].lower() or
                   search_lower in p['id']
            ]
        
        # 排序：優先顯示有單打排名的，且排名高的
        def sort_key(p):
            rank = 9999
            if 'SEN_SINGLES' in p['rankings']:
                try:
                    rank = int(p['rankings']['SEN_SINGLES']['rank'])
                except:
                    pass
            elif 'WOM_SINGLES' in p['rankings']:
                try:
                    rank = int(p['rankings']['WOM_SINGLES']['rank'])
                except:
                    pass
            return rank

        all_players.sort(key=sort_key)
        
        # 分頁
        total = len(all_players)
        start_idx = (page - 1) * per_page
        end_idx = start_idx + per_page
        
        return {
            'players': all_players[start_idx:end_idx],
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page
        }

    def get_player_details(self, player_id: str) -> Optional[Dict[str, Any]]:
        """取得特定選手詳細資料"""
        # 重新載入以確保資料最新
        self._load_all_players()
        return self.players_cache.get(player_id)

    def find_player_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """
        根據名稱尋找選手（模糊比對）
        
        Args:
            name: 選手名稱（中文或英文）
            
        Returns:
            找到的選手資料，包含 photo_url
        """
        if not name:
            return None
            
        self._load_all_players()
        name_lower = name.lower().strip()
        
        # 精確比對
        for player in self.players_cache.values():
            player_name = player.get('name', '').lower()
            if player_name == name_lower:
                return player
        
        # 部分比對（名字包含搜尋詞）
        for player in self.players_cache.values():
            player_name = player.get('name', '').lower()
            if name_lower in player_name or player_name in name_lower:
                return player
        
        # 處理 "姓名" vs "名姓" 格式（如 "Lin Yun-Ju" vs "Yun-Ju Lin"）
        name_parts = name_lower.replace('-', ' ').split()
        if len(name_parts) >= 2:
            for player in self.players_cache.values():
                player_name = player.get('name', '').lower().replace('-', ' ')
                # 檢查所有名字部分是否都在選手名字中
                if all(part in player_name for part in name_parts):
                    return player
        
        return None

_player_service = None

def get_player_service():
    global _player_service
    if _player_service is None:
        _player_service = PlayerService()
    return _player_service
