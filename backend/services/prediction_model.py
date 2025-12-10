"""
WTT 比賽勝率預測模型
使用機器學習預測桌球比賽結果
"""
import os
import json
import numpy as np
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass
from pathlib import Path

# 嘗試導入 sklearn，如果沒有則使用簡單模型
try:
    from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
    from sklearn.model_selection import train_test_split
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import accuracy_score, classification_report
    import joblib
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False
    print("⚠️ sklearn 未安裝，使用簡化預測模型")

from services.wtt_data_collector import WTTDataCollector


@dataclass
class PredictionResult:
    """預測結果"""
    player1: str
    player2: str
    player1_win_prob: float
    player2_win_prob: float
    predicted_winner: str
    confidence: float
    factors: Dict[str, Any]
    suggested_score: str
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "player1": self.player1,
            "player2": self.player2,
            "player1_win_prob": round(self.player1_win_prob, 3),
            "player2_win_prob": round(self.player2_win_prob, 3),
            "predicted_winner": self.predicted_winner,
            "confidence": round(self.confidence, 3),
            "factors": self.factors,
            "suggested_score": self.suggested_score
        }


class MatchPredictor:
    """比賽預測器"""
    
    def __init__(self):
        self.data_collector = WTTDataCollector()
        self.model = None
        self.scaler = StandardScaler() if HAS_SKLEARN else None
        self.model_path = os.path.join(
            os.path.dirname(__file__), '..', 'data', 'wtt_matches', 'predictor_model.joblib'
        )
        self.feature_names = [
            'rank_diff',           # 排名差距
            'rating_diff',         # 評分差距
            'h2h_win_rate',        # 歷史對戰勝率
            'recent_form_diff',    # 近期狀態差距
            'tournament_exp_diff', # 賽事經驗差距
            'style_matchup',       # 打法相剋值
        ]
        
        self._load_or_train_model()
    
    def _load_or_train_model(self):
        """載入或訓練模型"""
        if os.path.exists(self.model_path) and HAS_SKLEARN:
            try:
                saved = joblib.load(self.model_path)
                self.model = saved['model']
                self.scaler = saved['scaler']
                print("✅ 載入已訓練的預測模型")
                return
            except Exception as e:
                print(f"⚠️ 載入模型失敗: {e}")
        
        # 確保有訓練數據
        if len(self.data_collector.matches) == 0:
            print("📊 生成訓練數據...")
            self.data_collector.generate_training_data()
        
        # 訓練模型
        self._train_model()
    
    def _extract_features(self, player1: str, player2: str) -> np.ndarray:
        """提取特徵向量"""
        # 取得選手資料
        p1_stats = self.data_collector.get_player_stats(player1)
        p2_stats = self.data_collector.get_player_stats(player2)
        
        p1_info = None
        p2_info = None
        for p in self.data_collector.players.values():
            if p["name"] == player1:
                p1_info = p
            if p["name"] == player2:
                p2_info = p
        
        if not p1_info or not p2_info:
            raise ValueError(f"找不到選手資料: {player1} 或 {player2}")
        
        # 排名差距 (負數表示 player1 排名較好)
        rank_diff = p2_info["rank"] - p1_info["rank"]
        
        # 評分差距
        rating_diff = p1_info["rating"] - p2_info["rating"]
        
        # 歷史對戰勝率
        h2h = self.data_collector.get_h2h(player1, player2)
        if h2h and (h2h["player1_wins"] + h2h["player2_wins"]) > 0:
            h2h_win_rate = h2h["player1_wins"] / (h2h["player1_wins"] + h2h["player2_wins"])
        else:
            h2h_win_rate = 0.5  # 無對戰記錄時使用中性值
        
        # 近期狀態 (最近5場勝率)
        p1_recent = p1_stats["recent_form"]
        p2_recent = p2_stats["recent_form"]
        p1_form = p1_recent.count("W") / max(len(p1_recent), 1)
        p2_form = p2_recent.count("W") / max(len(p2_recent), 1)
        recent_form_diff = p1_form - p2_form
        
        # 賽事經驗 (總比賽數)
        tournament_exp_diff = (p1_stats["total_matches"] - p2_stats["total_matches"]) / 10
        
        # 打法相剋值 (簡化版本)
        style_matchup = self._calculate_style_matchup(p1_info["style"], p2_info["style"])
        
        features = np.array([
            rank_diff,
            rating_diff,
            h2h_win_rate,
            recent_form_diff,
            tournament_exp_diff,
            style_matchup
        ])
        
        return features
    
    def _calculate_style_matchup(self, style1: str, style2: str) -> float:
        """計算打法相剋值"""
        # 簡化的打法相剋矩陣
        # 正值表示 style1 對 style2 有優勢
        matchup_matrix = {
            ("攻擊型", "防守型"): 0.2,
            ("攻擊型", "快攻型"): 0.0,
            ("攻擊型", "全面型"): -0.1,
            ("攻擊型", "力量型"): 0.1,
            ("防守型", "攻擊型"): -0.2,
            ("防守型", "快攻型"): 0.1,
            ("防守型", "全面型"): 0.0,
            ("防守型", "力量型"): 0.2,
            ("快攻型", "攻擊型"): 0.0,
            ("快攻型", "防守型"): -0.1,
            ("快攻型", "全面型"): 0.1,
            ("快攻型", "力量型"): 0.15,
            ("全面型", "攻擊型"): 0.1,
            ("全面型", "防守型"): 0.0,
            ("全面型", "快攻型"): -0.1,
            ("全面型", "力量型"): 0.05,
            ("力量型", "攻擊型"): -0.1,
            ("力量型", "防守型"): -0.2,
            ("力量型", "快攻型"): -0.15,
            ("力量型", "全面型"): -0.05,
        }
        
        return matchup_matrix.get((style1, style2), 0.0)
    
    def _train_model(self):
        """訓練預測模型"""
        print("🎓 訓練預測模型...")
        
        X = []  # 特徵
        y = []  # 標籤 (1 = player1 勝, 0 = player2 勝)
        
        for match in self.data_collector.matches:
            try:
                features = self._extract_features(match.player1_name, match.player2_name)
                X.append(features)
                y.append(1 if match.winner == "player1" else 0)
            except Exception as e:
                continue
        
        if len(X) < 10:
            print("⚠️ 訓練數據不足")
            return
        
        X = np.array(X)
        y = np.array(y)
        
        if HAS_SKLEARN:
            # 標準化特徵
            X_scaled = self.scaler.fit_transform(X)
            
            # 分割訓練/測試集
            X_train, X_test, y_train, y_test = train_test_split(
                X_scaled, y, test_size=0.2, random_state=42
            )
            
            # 訓練隨機森林模型
            self.model = GradientBoostingClassifier(
                n_estimators=100,
                max_depth=5,
                random_state=42
            )
            self.model.fit(X_train, y_train)
            
            # 評估
            y_pred = self.model.predict(X_test)
            accuracy = accuracy_score(y_test, y_pred)
            print(f"✅ 模型訓練完成，準確率: {accuracy:.1%}")
            
            # 儲存模型
            os.makedirs(os.path.dirname(self.model_path), exist_ok=True)
            joblib.dump({
                'model': self.model,
                'scaler': self.scaler
            }, self.model_path)
            print(f"💾 模型已儲存至 {self.model_path}")
        else:
            print("⚠️ 使用簡化預測模型 (無 sklearn)")
    
    def predict(self, player1: str, player2: str) -> PredictionResult:
        """預測比賽結果"""
        try:
            features = self._extract_features(player1, player2)
        except ValueError as e:
            raise e
        
        # 取得選手資料用於因素分析
        p1_stats = self.data_collector.get_player_stats(player1)
        p2_stats = self.data_collector.get_player_stats(player2)
        h2h = self.data_collector.get_h2h(player1, player2)
        
        p1_info = None
        p2_info = None
        for p in self.data_collector.players.values():
            if p["name"] == player1:
                p1_info = p
            if p["name"] == player2:
                p2_info = p
        
        if HAS_SKLEARN and self.model is not None:
            # 使用 ML 模型預測
            features_scaled = self.scaler.transform(features.reshape(1, -1))
            prob = self.model.predict_proba(features_scaled)[0]
            player1_win_prob = prob[1]
            player2_win_prob = prob[0]
        else:
            # 簡化預測：基於排名和評分
            rating_diff = p1_info["rating"] - p2_info["rating"]
            base_prob = 0.5 + (rating_diff / 50)  # 評分差 50 分約等於 100% 勝率差
            
            # 加入 H2H 調整
            if h2h:
                total_h2h = h2h["player1_wins"] + h2h["player2_wins"]
                if total_h2h > 0:
                    h2h_factor = (h2h["player1_wins"] / total_h2h - 0.5) * 0.2
                    base_prob += h2h_factor
            
            player1_win_prob = max(0.05, min(0.95, base_prob))
            player2_win_prob = 1 - player1_win_prob
        
        # 決定勝者
        predicted_winner = player1 if player1_win_prob > 0.5 else player2
        confidence = max(player1_win_prob, player2_win_prob)
        
        # 建立因素分析
        factors = {
            "ranking": {
                "player1_rank": p1_info["rank"] if p1_info else None,
                "player2_rank": p2_info["rank"] if p2_info else None,
                "advantage": player1 if (p1_info and p2_info and p1_info["rank"] < p2_info["rank"]) else player2
            },
            "rating": {
                "player1_rating": p1_info["rating"] if p1_info else None,
                "player2_rating": p2_info["rating"] if p2_info else None,
                "advantage": player1 if (p1_info and p2_info and p1_info["rating"] > p2_info["rating"]) else player2
            },
            "head_to_head": {
                "player1_wins": h2h["player1_wins"] if h2h else 0,
                "player2_wins": h2h["player2_wins"] if h2h else 0,
                "advantage": None
            },
            "recent_form": {
                "player1_form": " ".join(p1_stats["recent_form"]) if p1_stats["recent_form"] else "N/A",
                "player2_form": " ".join(p2_stats["recent_form"]) if p2_stats["recent_form"] else "N/A",
                "advantage": None
            },
            "style_matchup": {
                "player1_style": p1_info["style"] if p1_info else None,
                "player2_style": p2_info["style"] if p2_info else None,
                "matchup_score": self._calculate_style_matchup(
                    p1_info["style"] if p1_info else "攻擊型",
                    p2_info["style"] if p2_info else "攻擊型"
                )
            }
        }
        
        # 計算 H2H 優勢
        if h2h:
            if h2h["player1_wins"] > h2h["player2_wins"]:
                factors["head_to_head"]["advantage"] = player1
            elif h2h["player2_wins"] > h2h["player1_wins"]:
                factors["head_to_head"]["advantage"] = player2
        
        # 計算近期狀態優勢
        p1_form_rate = p1_stats["recent_form"].count("W") / max(len(p1_stats["recent_form"]), 1)
        p2_form_rate = p2_stats["recent_form"].count("W") / max(len(p2_stats["recent_form"]), 1)
        if p1_form_rate > p2_form_rate:
            factors["recent_form"]["advantage"] = player1
        elif p2_form_rate > p1_form_rate:
            factors["recent_form"]["advantage"] = player2
        
        # 預測比分
        suggested_score = self._suggest_score(player1_win_prob)
        
        return PredictionResult(
            player1=player1,
            player2=player2,
            player1_win_prob=player1_win_prob,
            player2_win_prob=player2_win_prob,
            predicted_winner=predicted_winner,
            confidence=confidence,
            factors=factors,
            suggested_score=suggested_score
        )
    
    def _suggest_score(self, win_prob: float) -> str:
        """根據勝率建議比分"""
        if win_prob > 0.5:
            if win_prob > 0.8:
                return "4-0"
            elif win_prob > 0.7:
                return "4-1"
            elif win_prob > 0.6:
                return "4-2"
            else:
                return "4-3"
        else:
            loss_prob = 1 - win_prob
            if loss_prob > 0.8:
                return "0-4"
            elif loss_prob > 0.7:
                return "1-4"
            elif loss_prob > 0.6:
                return "2-4"
            else:
                return "3-4"
    
    def get_players(self, gender: str = None) -> List[Dict]:
        """取得選手列表"""
        players = self.data_collector.get_all_players()
        if gender:
            players = [p for p in players if p.get("gender") == gender]
        return sorted(players, key=lambda x: x.get("rank", 999))
    
    def get_match_preview(self, player1: str, player2: str) -> Dict[str, Any]:
        """取得比賽預覽（包含預測和詳細分析）"""
        prediction = self.predict(player1, player2)
        
        p1_stats = self.data_collector.get_player_stats(player1)
        p2_stats = self.data_collector.get_player_stats(player2)
        h2h = self.data_collector.get_h2h(player1, player2)
        
        return {
            "prediction": prediction.to_dict(),
            "player1_stats": p1_stats,
            "player2_stats": p2_stats,
            "head_to_head": h2h,
            "analysis_time": __import__('datetime').datetime.now().isoformat()
        }


if __name__ == "__main__":
    predictor = MatchPredictor()
    
    # 測試預測
    result = predictor.predict("Wang Chuqin", "Fan Zhendong")
    print(f"\n🏓 預測結果:")
    print(f"   {result.player1} vs {result.player2}")
    print(f"   勝率: {result.player1_win_prob:.1%} vs {result.player2_win_prob:.1%}")
    print(f"   預測勝者: {result.predicted_winner}")
    print(f"   信心度: {result.confidence:.1%}")
    print(f"   預測比分: {result.suggested_score}")
