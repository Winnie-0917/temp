"""
WTT 歷史對戰數據收集器
從多個來源收集桌球選手對戰記錄
"""
import os
import json
import time
import random
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path


@dataclass
class MatchRecord:
    """比賽記錄"""
    match_id: str
    date: str
    tournament: str
    round: str
    player1_name: str
    player1_country: str
    player1_rank: int
    player2_name: str
    player2_country: str
    player2_rank: int
    winner: str  # "player1" or "player2"
    score: str  # e.g., "3-1" or "4-2"
    sets: List[str]  # e.g., ["11-9", "11-7", "9-11", "11-5"]
    match_type: str  # "singles" or "doubles"
    gender: str  # "men" or "women" or "mixed"
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class WTTDataCollector:
    """WTT 數據收集器"""
    
    def __init__(self, data_dir: str = None):
        self.data_dir = data_dir or os.path.join(
            os.path.dirname(__file__), '..', 'data', 'wtt_matches'
        )
        os.makedirs(self.data_dir, exist_ok=True)
        
        self.matches_file = os.path.join(self.data_dir, 'matches.json')
        self.players_file = os.path.join(self.data_dir, 'players.json')
        self.h2h_file = os.path.join(self.data_dir, 'head_to_head.json')
        
        self.matches: List[MatchRecord] = []
        self.players: Dict[str, Dict] = {}
        self.h2h: Dict[str, Dict] = {}  # head-to-head records
        
        self._load_data()
    
    def _load_data(self):
        """載入現有數據"""
        if os.path.exists(self.matches_file):
            with open(self.matches_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.matches = [MatchRecord(**m) for m in data]
        
        if os.path.exists(self.players_file):
            with open(self.players_file, 'r', encoding='utf-8') as f:
                self.players = json.load(f)
        
        if os.path.exists(self.h2h_file):
            with open(self.h2h_file, 'r', encoding='utf-8') as f:
                self.h2h = json.load(f)
    
    def _save_data(self):
        """儲存數據"""
        with open(self.matches_file, 'w', encoding='utf-8') as f:
            json.dump([m.to_dict() for m in self.matches], f, ensure_ascii=False, indent=2)
        
        with open(self.players_file, 'w', encoding='utf-8') as f:
            json.dump(self.players, f, ensure_ascii=False, indent=2)
        
        with open(self.h2h_file, 'w', encoding='utf-8') as f:
            json.dump(self.h2h, f, ensure_ascii=False, indent=2)
    
    def generate_training_data(self) -> List[MatchRecord]:
        """
        生成訓練數據
        由於 WTT API 不公開，我們使用合成的歷史數據
        基於真實的世界排名和合理的比賽結果
        """
        print("📊 生成訓練數據...")
        
        # 頂尖選手資料（基於真實排名）
        top_players = {
            "men": [
                {"name": "Wang Chuqin", "country": "CHN", "rank": 1, "style": "攻擊型", "rating": 95},
                {"name": "Fan Zhendong", "country": "CHN", "rank": 2, "style": "攻擊型", "rating": 94},
                {"name": "Ma Long", "country": "CHN", "rank": 3, "style": "全面型", "rating": 93},
                {"name": "Liang Jingkun", "country": "CHN", "rank": 4, "style": "攻擊型", "rating": 91},
                {"name": "Lin Shidong", "country": "CHN", "rank": 5, "style": "攻擊型", "rating": 90},
                {"name": "Tomokazu Harimoto", "country": "JPN", "rank": 6, "style": "攻擊型", "rating": 89},
                {"name": "Hugo Calderano", "country": "BRA", "rank": 7, "style": "攻擊型", "rating": 88},
                {"name": "Lin Yun-Ju", "country": "TPE", "rank": 8, "style": "快攻型", "rating": 87},
                {"name": "Truls Moregard", "country": "SWE", "rank": 9, "style": "攻擊型", "rating": 86},
                {"name": "Felix Lebrun", "country": "FRA", "rank": 10, "style": "攻擊型", "rating": 85},
                {"name": "Quadri Aruna", "country": "NGR", "rank": 11, "style": "力量型", "rating": 84},
                {"name": "Lim Jonghoon", "country": "KOR", "rank": 12, "style": "防守型", "rating": 83},
                {"name": "Dimitrij Ovtcharov", "country": "GER", "rank": 13, "style": "全面型", "rating": 82},
                {"name": "Patrick Franziska", "country": "GER", "rank": 14, "style": "攻擊型", "rating": 81},
                {"name": "Darko Jorgic", "country": "SLO", "rank": 15, "style": "攻擊型", "rating": 80},
            ],
            "women": [
                {"name": "Sun Yingsha", "country": "CHN", "rank": 1, "style": "攻擊型", "rating": 96},
                {"name": "Wang Manyu", "country": "CHN", "rank": 2, "style": "攻擊型", "rating": 94},
                {"name": "Chen Meng", "country": "CHN", "rank": 3, "style": "全面型", "rating": 93},
                {"name": "Wang Yidi", "country": "CHN", "rank": 4, "style": "攻擊型", "rating": 91},
                {"name": "Shin Yubin", "country": "KOR", "rank": 5, "style": "快攻型", "rating": 89},
                {"name": "Hina Hayata", "country": "JPN", "rank": 6, "style": "攻擊型", "rating": 88},
                {"name": "Mima Ito", "country": "JPN", "rank": 7, "style": "快攻型", "rating": 87},
                {"name": "Cheng I-Ching", "country": "TPE", "rank": 8, "style": "全面型", "rating": 85},
                {"name": "Bernadette Szocs", "country": "ROU", "rank": 9, "style": "攻擊型", "rating": 83},
                {"name": "Adriana Diaz", "country": "PUR", "rank": 10, "style": "攻擊型", "rating": 82},
            ]
        }
        
        # 儲存選手資料
        for gender, players in top_players.items():
            for p in players:
                player_id = f"{p['name'].lower().replace(' ', '_')}"
                self.players[player_id] = {
                    "name": p["name"],
                    "country": p["country"],
                    "rank": p["rank"],
                    "style": p["style"],
                    "rating": p["rating"],
                    "gender": gender
                }
        
        # 比賽類型
        tournaments = [
            "WTT Champions", "WTT Grand Smash", "WTT Contender",
            "WTT Star Contender", "World Championships", "Olympic Games"
        ]
        
        rounds = ["Final", "Semi-Final", "Quarter-Final", "Round of 16", "Round of 32", "Group Stage"]
        
        # 生成模擬比賽記錄
        generated_matches = []
        match_id = 1
        
        for gender, players in top_players.items():
            # 每對選手生成 2-5 場歷史對戰
            for i, p1 in enumerate(players):
                for p2 in players[i+1:]:
                    num_matches = random.randint(2, 5)
                    
                    for _ in range(num_matches):
                        # 根據 rating 計算勝率
                        rating_diff = p1["rating"] - p2["rating"]
                        p1_win_prob = 0.5 + (rating_diff / 100)  # 簡單線性模型
                        p1_win_prob = max(0.2, min(0.8, p1_win_prob))  # 限制在 20%-80%
                        
                        winner = "player1" if random.random() < p1_win_prob else "player2"
                        
                        # 生成比分
                        if random.random() < 0.3:  # 30% 機率是 4-0 或 4-1
                            if winner == "player1":
                                score = random.choice(["4-0", "4-1"])
                            else:
                                score = random.choice(["0-4", "1-4"])
                        else:
                            if winner == "player1":
                                score = random.choice(["4-2", "4-3"])
                            else:
                                score = random.choice(["2-4", "3-4"])
                        
                        # 生成局分
                        sets = self._generate_sets(score)
                        
                        # 生成日期 (過去2年)
                        days_ago = random.randint(1, 730)
                        match_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
                        
                        match = MatchRecord(
                            match_id=f"WTT{match_id:06d}",
                            date=match_date,
                            tournament=random.choice(tournaments),
                            round=random.choice(rounds),
                            player1_name=p1["name"],
                            player1_country=p1["country"],
                            player1_rank=p1["rank"],
                            player2_name=p2["name"],
                            player2_country=p2["country"],
                            player2_rank=p2["rank"],
                            winner=winner,
                            score=score,
                            sets=sets,
                            match_type="singles",
                            gender=gender
                        )
                        
                        generated_matches.append(match)
                        match_id += 1
        
        self.matches = generated_matches
        
        # 計算 H2H 記錄
        self._calculate_h2h()
        
        # 儲存數據
        self._save_data()
        
        print(f"✅ 生成了 {len(generated_matches)} 場比賽記錄")
        print(f"   選手數: {len(self.players)}")
        print(f"   H2H 記錄數: {len(self.h2h)}")
        
        return self.matches
    
    def _generate_sets(self, score: str) -> List[str]:
        """根據總比分生成局分"""
        parts = score.split("-")
        p1_sets = int(parts[0])
        p2_sets = int(parts[1])
        
        sets = []
        for _ in range(p1_sets):
            # 贏的局
            loser_score = random.randint(5, 9)
            sets.append(f"11-{loser_score}")
        
        for _ in range(p2_sets):
            # 輸的局
            loser_score = random.randint(5, 9)
            sets.append(f"{loser_score}-11")
        
        random.shuffle(sets)
        return sets
    
    def _calculate_h2h(self):
        """計算 Head-to-Head 記錄"""
        self.h2h = {}
        
        for match in self.matches:
            # 創建雙向的 H2H 記錄
            key1 = f"{match.player1_name}|{match.player2_name}"
            key2 = f"{match.player2_name}|{match.player1_name}"
            
            if key1 not in self.h2h:
                self.h2h[key1] = {
                    "player1": match.player1_name,
                    "player2": match.player2_name,
                    "player1_wins": 0,
                    "player2_wins": 0,
                    "matches": []
                }
            
            if match.winner == "player1":
                self.h2h[key1]["player1_wins"] += 1
            else:
                self.h2h[key1]["player2_wins"] += 1
            
            self.h2h[key1]["matches"].append({
                "date": match.date,
                "tournament": match.tournament,
                "score": match.score,
                "winner": match.player1_name if match.winner == "player1" else match.player2_name
            })
    
    def get_player_stats(self, player_name: str) -> Dict[str, Any]:
        """取得選手統計數據"""
        stats = {
            "name": player_name,
            "total_matches": 0,
            "wins": 0,
            "losses": 0,
            "win_rate": 0.0,
            "avg_sets_won": 0.0,
            "avg_sets_lost": 0.0,
            "recent_form": [],  # 最近 5 場
            "by_round": {},
            "by_opponent_rank": {
                "vs_top5": {"wins": 0, "losses": 0},
                "vs_top10": {"wins": 0, "losses": 0},
                "vs_top20": {"wins": 0, "losses": 0}
            }
        }
        
        player_matches = []
        
        for match in self.matches:
            if match.player1_name == player_name:
                is_winner = match.winner == "player1"
                opponent_rank = match.player2_rank
                score_parts = match.score.split("-")
                sets_won = int(score_parts[0])
                sets_lost = int(score_parts[1])
            elif match.player2_name == player_name:
                is_winner = match.winner == "player2"
                opponent_rank = match.player1_rank
                score_parts = match.score.split("-")
                sets_won = int(score_parts[1])
                sets_lost = int(score_parts[0])
            else:
                continue
            
            stats["total_matches"] += 1
            
            if is_winner:
                stats["wins"] += 1
            else:
                stats["losses"] += 1
            
            stats["avg_sets_won"] += sets_won
            stats["avg_sets_lost"] += sets_lost
            
            # 按輪次統計
            if match.round not in stats["by_round"]:
                stats["by_round"][match.round] = {"wins": 0, "losses": 0}
            if is_winner:
                stats["by_round"][match.round]["wins"] += 1
            else:
                stats["by_round"][match.round]["losses"] += 1
            
            # 按對手排名統計
            if opponent_rank <= 5:
                if is_winner:
                    stats["by_opponent_rank"]["vs_top5"]["wins"] += 1
                else:
                    stats["by_opponent_rank"]["vs_top5"]["losses"] += 1
            if opponent_rank <= 10:
                if is_winner:
                    stats["by_opponent_rank"]["vs_top10"]["wins"] += 1
                else:
                    stats["by_opponent_rank"]["vs_top10"]["losses"] += 1
            if opponent_rank <= 20:
                if is_winner:
                    stats["by_opponent_rank"]["vs_top20"]["wins"] += 1
                else:
                    stats["by_opponent_rank"]["vs_top20"]["losses"] += 1
            
            player_matches.append({
                "date": match.date,
                "result": "W" if is_winner else "L"
            })
        
        if stats["total_matches"] > 0:
            stats["win_rate"] = stats["wins"] / stats["total_matches"]
            stats["avg_sets_won"] /= stats["total_matches"]
            stats["avg_sets_lost"] /= stats["total_matches"]
        
        # 最近 5 場
        player_matches.sort(key=lambda x: x["date"], reverse=True)
        stats["recent_form"] = [m["result"] for m in player_matches[:5]]
        
        return stats
    
    def get_h2h(self, player1: str, player2: str) -> Optional[Dict]:
        """取得兩位選手的對戰記錄"""
        key1 = f"{player1}|{player2}"
        key2 = f"{player2}|{player1}"
        
        if key1 in self.h2h:
            return self.h2h[key1]
        elif key2 in self.h2h:
            # 反轉結果
            h2h = self.h2h[key2]
            return {
                "player1": player1,
                "player2": player2,
                "player1_wins": h2h["player2_wins"],
                "player2_wins": h2h["player1_wins"],
                "matches": h2h["matches"]
            }
        
        return None
    
    def get_all_players(self) -> List[Dict]:
        """取得所有選手列表"""
        return list(self.players.values())


if __name__ == "__main__":
    collector = WTTDataCollector()
    collector.generate_training_data()
    
    # 測試
    stats = collector.get_player_stats("Wang Chuqin")
    print(f"\n📊 {stats['name']} 統計:")
    print(f"   勝率: {stats['win_rate']:.1%}")
    print(f"   最近狀態: {' '.join(stats['recent_form'])}")
