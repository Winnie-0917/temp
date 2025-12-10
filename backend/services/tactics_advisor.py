"""
戰術建議系統
根據選手特點和對戰數據提供賽前戰術建議
"""
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import random

from services.wtt_data_collector import WTTDataCollector
from services.prediction_model import MatchPredictor


@dataclass
class TacticSuggestion:
    """戰術建議"""
    category: str  # 發球、接發、相持、心理
    title: str
    description: str
    priority: int  # 1-5, 5 最重要
    based_on: str  # 建議依據


@dataclass
class MatchTactics:
    """比賽戰術分析"""
    player: str
    opponent: str
    overall_strategy: str
    key_points: List[str]
    suggestions: List[TacticSuggestion]
    opponent_weaknesses: List[str]
    player_strengths: List[str]
    risk_factors: List[str]
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "player": self.player,
            "opponent": self.opponent,
            "overall_strategy": self.overall_strategy,
            "key_points": self.key_points,
            "suggestions": [asdict(s) for s in self.suggestions],
            "opponent_weaknesses": self.opponent_weaknesses,
            "player_strengths": self.player_strengths,
            "risk_factors": self.risk_factors
        }


class TacticsAdvisor:
    """戰術建議顧問"""
    
    def __init__(self):
        self.data_collector = WTTDataCollector()
        self.predictor = MatchPredictor()
        
        # 打法特點資料庫
        self.style_characteristics = {
            "攻擊型": {
                "strengths": ["正手拉球威力大", "主動進攻意識強", "得分能力強"],
                "weaknesses": ["防守相對薄弱", "容易急躁失誤", "對付削球較吃力"],
                "counter_tactics": ["控制落點減少其進攻機會", "多用短球控制節奏", "誘使其主動失誤"]
            },
            "防守型": {
                "strengths": ["防守穩健", "耐心好", "失誤少"],
                "weaknesses": ["主動得分能力弱", "節奏較慢", "面對強攻易被動"],
                "counter_tactics": ["加強進攻壓力", "變化落點和旋轉", "不要陪打相持"]
            },
            "快攻型": {
                "strengths": ["出手速度快", "近台能力強", "擅長搶攻"],
                "weaknesses": ["中遠台能力弱", "旋轉變化較少", "力量相對不足"],
                "counter_tactics": ["退台拉開距離", "加強旋轉變化", "用力量壓制"]
            },
            "全面型": {
                "strengths": ["技術全面", "戰術多變", "適應能力強"],
                "weaknesses": ["沒有明顯殺手鐧", "可能缺乏特點", "高壓下選擇困難"],
                "counter_tactics": ["發揮自己特長", "找到其相對弱點", "保持自己節奏"]
            },
            "力量型": {
                "strengths": ["力量大速度快", "正手殺傷力強", "氣勢足"],
                "weaknesses": ["細膩技術不足", "小球處理較弱", "體力消耗大"],
                "counter_tactics": ["多用短球和轉不轉", "消耗其體力", "利用其急躁心理"]
            }
        }
        
        # 發球戰術庫
        self.serve_tactics = [
            {"title": "側旋短球搶攻", "desc": "發正手位側旋短球，準備三板搶攻"},
            {"title": "奔球突襲", "desc": "突然發長球奔向對方正手或反手大角度"},
            {"title": "下旋控制", "desc": "發下旋短球控制節奏，等待機會"},
            {"title": "逆旋轉迷惑", "desc": "使用逆旋轉發球製造對方接發失誤"},
            {"title": "反手位急長", "desc": "發向對方反手位的急長球，壓制其反手"}
        ]
        
        # 接發球戰術庫
        self.receive_tactics = [
            {"title": "擺短控制", "desc": "用擺短回接，不讓對方輕易起板"},
            {"title": "劈長搶攻", "desc": "劈長至對方反手，準備搶攻"},
            {"title": "挑打突擊", "desc": "判斷準確後直接挑打得分"},
            {"title": "晃撇變線", "desc": "用晃撇技術打亂對方節奏"},
            {"title": "反手擰拉", "desc": "直接反手擰拉搶先上手"}
        ]
        
        # 相持戰術庫
        self.rally_tactics = [
            {"title": "正手連續進攻", "desc": "利用正手優勢持續施壓"},
            {"title": "反手相持為主", "desc": "穩定反手相持，等待正手機會"},
            {"title": "落點變化", "desc": "大範圍調動對方，消耗其體力"},
            {"title": "節奏變化", "desc": "快慢結合，打亂對方節奏"},
            {"title": "旋轉變化", "desc": "加減旋轉，製造對方失誤"}
        ]
    
    def generate_tactics(self, player: str, opponent: str) -> MatchTactics:
        """為選手生成對戰戰術建議"""
        
        # 取得選手資訊
        player_info = None
        opponent_info = None
        for p in self.data_collector.players.values():
            if p["name"] == player:
                player_info = p
            if p["name"] == opponent:
                opponent_info = p
        
        if not player_info or not opponent_info:
            raise ValueError(f"找不到選手資料: {player} 或 {opponent}")
        
        # 取得預測結果
        prediction = self.predictor.predict(player, opponent)
        
        # 取得對戰記錄
        h2h = self.data_collector.get_h2h(player, opponent)
        
        # 取得選手統計
        player_stats = self.data_collector.get_player_stats(player)
        opponent_stats = self.data_collector.get_player_stats(opponent)
        
        # 決定整體策略
        overall_strategy = self._determine_strategy(
            player_info, opponent_info, prediction, h2h
        )
        
        # 生成關鍵要點
        key_points = self._generate_key_points(
            player_info, opponent_info, prediction
        )
        
        # 生成具體建議
        suggestions = self._generate_suggestions(
            player_info, opponent_info, prediction, h2h
        )
        
        # 分析對手弱點
        opponent_weaknesses = self._analyze_weaknesses(opponent_info, opponent_stats)
        
        # 分析選手優勢
        player_strengths = self._analyze_strengths(player_info, player_stats)
        
        # 分析風險因素
        risk_factors = self._analyze_risks(
            player_info, opponent_info, prediction, h2h
        )
        
        return MatchTactics(
            player=player,
            opponent=opponent,
            overall_strategy=overall_strategy,
            key_points=key_points,
            suggestions=suggestions,
            opponent_weaknesses=opponent_weaknesses,
            player_strengths=player_strengths,
            risk_factors=risk_factors
        )
    
    def _determine_strategy(
        self, 
        player: Dict, 
        opponent: Dict, 
        prediction, 
        h2h: Optional[Dict]
    ) -> str:
        """決定整體戰略"""
        
        win_prob = prediction.player1_win_prob
        rank_diff = player["rank"] - opponent["rank"]
        
        # 分析歷史對戰
        h2h_advantage = None
        if h2h:
            total = h2h["player1_wins"] + h2h["player2_wins"]
            if total > 0:
                win_rate = h2h["player1_wins"] / total
                if win_rate > 0.6:
                    h2h_advantage = "有利"
                elif win_rate < 0.4:
                    h2h_advantage = "不利"
        
        # 根據情況決定策略
        if win_prob > 0.7:
            return f"你是本場比賽的大熱門（勝率 {win_prob:.0%}）。保持自己的比賽節奏，發揮正常水準即可。不要輕敵，專注於每一分。"
        elif win_prob > 0.55:
            if h2h_advantage == "有利":
                return f"你略佔優勢（勝率 {win_prob:.0%}），且歷史對戰有利。延續過去成功的戰術，保持信心，按部就班執行計劃。"
            else:
                return f"雙方實力接近，你稍佔上風（勝率 {win_prob:.0%}）。發揮自己的技術特點，減少無謂失誤，在關鍵分上更加專注。"
        elif win_prob > 0.45:
            return f"這是一場勢均力敵的比賽（勝率 {win_prob:.0%}）。誰能更好地執行戰術、減少失誤，誰就能獲勝。保持冷靜，做好打硬仗的準備。"
        elif win_prob > 0.3:
            if h2h_advantage == "有利":
                return f"雖然對手實力略強（勝率 {win_prob:.0%}），但你歷史對戰佔優。相信自己，發揮克制對手的戰術特點。"
            else:
                return f"對手實力較強（勝率 {win_prob:.0%}）。放開打，積極搏殺，用變化打亂對手節奏。輸球正常，贏球就是收穫。"
        else:
            return f"面對強大的對手（勝率 {win_prob:.0%}）。以學習心態參賽，大膽發揮，爭取每一分。無論結果如何，都是寶貴的經驗。"
    
    def _generate_key_points(
        self, 
        player: Dict, 
        opponent: Dict, 
        prediction
    ) -> List[str]:
        """生成關鍵要點"""
        points = []
        
        opponent_style = opponent.get("style", "攻擊型")
        player_style = player.get("style", "攻擊型")
        
        # 根據對手打法提供要點
        if opponent_style == "攻擊型":
            points.append("控制發球落點，減少對手搶攻機會")
            points.append("多用短球和變化，不要陪對手對攻")
        elif opponent_style == "防守型":
            points.append("保持進攻節奏，不要被對手的穩健帶入相持")
            points.append("注意力量和落點的變化，尋找得分機會")
        elif opponent_style == "快攻型":
            points.append("適當退台，利用旋轉和力量壓制")
            points.append("發球可以多用長球，破壞對手近台優勢")
        elif opponent_style == "力量型":
            points.append("多用短球和細膩技術消耗對手")
            points.append("避免正面對攻，用落點調動對方")
        else:
            points.append("發揮自己特長，按照自己的節奏比賽")
        
        # 通用要點
        points.append("做好每一個發球和接發球")
        points.append("關鍵分保持冷靜，相信自己的訓練")
        
        return points
    
    def _generate_suggestions(
        self, 
        player: Dict, 
        opponent: Dict, 
        prediction,
        h2h: Optional[Dict]
    ) -> List[TacticSuggestion]:
        """生成具體戰術建議"""
        suggestions = []
        
        opponent_style = opponent.get("style", "攻擊型")
        style_info = self.style_characteristics.get(opponent_style, {})
        
        # 發球建議
        serve = random.choice(self.serve_tactics)
        suggestions.append(TacticSuggestion(
            category="發球",
            title=serve["title"],
            description=serve["desc"],
            priority=5,
            based_on=f"針對對手 {opponent_style} 的接發球特點"
        ))
        
        # 接發球建議
        receive = random.choice(self.receive_tactics)
        suggestions.append(TacticSuggestion(
            category="接發球",
            title=receive["title"],
            description=receive["desc"],
            priority=5,
            based_on="搶先上手控制比賽節奏"
        ))
        
        # 相持建議
        rally = random.choice(self.rally_tactics)
        suggestions.append(TacticSuggestion(
            category="相持",
            title=rally["title"],
            description=rally["desc"],
            priority=4,
            based_on=f"利用對手 {opponent_style} 的相對弱點"
        ))
        
        # 針對對手弱點的建議
        if style_info.get("counter_tactics"):
            for i, tactic in enumerate(style_info["counter_tactics"][:2]):
                suggestions.append(TacticSuggestion(
                    category="戰術要點",
                    title=f"克制策略 {i+1}",
                    description=tactic,
                    priority=4,
                    based_on=f"針對 {opponent_style} 的克制戰術"
                ))
        
        # 心理建議
        if prediction.player1_win_prob < 0.4:
            suggestions.append(TacticSuggestion(
                category="心理",
                title="放鬆心態",
                description="面對強敵，放下包袱，專注於發揮自己的水準",
                priority=4,
                based_on="對手實力較強的情況"
            ))
        elif prediction.player1_win_prob > 0.6:
            suggestions.append(TacticSuggestion(
                category="心理",
                title="保持專注",
                description="不要輕敵，每一分都認真對待，穩紮穩打",
                priority=4,
                based_on="你是本場比賽的優勢方"
            ))
        else:
            suggestions.append(TacticSuggestion(
                category="心理",
                title="相信自己",
                description="雙方實力接近，關鍵在於執行力和專注度",
                priority=4,
                based_on="勢均力敵的對決"
            ))
        
        return suggestions
    
    def _analyze_weaknesses(self, opponent: Dict, stats: Dict) -> List[str]:
        """分析對手弱點"""
        weaknesses = []
        
        style = opponent.get("style", "攻擊型")
        style_info = self.style_characteristics.get(style, {})
        
        if style_info.get("weaknesses"):
            weaknesses.extend(style_info["weaknesses"])
        
        # 根據統計數據分析
        if stats.get("by_opponent_rank", {}).get("vs_top5", {}).get("losses", 0) > 2:
            weaknesses.append("面對頂級選手時勝率不高")
        
        if stats.get("by_round", {}).get("Final", {}).get("losses", 0) > stats.get("by_round", {}).get("Final", {}).get("wins", 0):
            weaknesses.append("決賽經驗可能是弱項")
        
        return weaknesses[:5]  # 最多返回5個弱點
    
    def _analyze_strengths(self, player: Dict, stats: Dict) -> List[str]:
        """分析選手優勢"""
        strengths = []
        
        style = player.get("style", "攻擊型")
        style_info = self.style_characteristics.get(style, {})
        
        if style_info.get("strengths"):
            strengths.extend(style_info["strengths"])
        
        # 根據統計數據分析
        if stats.get("win_rate", 0) > 0.6:
            strengths.append(f"整體勝率優秀 ({stats['win_rate']:.0%})")
        
        recent_form = stats.get("recent_form", [])
        if recent_form.count("W") >= 4:
            strengths.append("近期狀態火熱")
        
        return strengths[:5]
    
    def _analyze_risks(
        self, 
        player: Dict, 
        opponent: Dict, 
        prediction,
        h2h: Optional[Dict]
    ) -> List[str]:
        """分析風險因素"""
        risks = []
        
        # 歷史對戰不利
        if h2h:
            total = h2h["player1_wins"] + h2h["player2_wins"]
            if total > 0 and h2h["player1_wins"] / total < 0.4:
                risks.append("歷史對戰處於劣勢，可能存在心理負擔")
        
        # 排名差距
        if opponent.get("rank", 999) < player.get("rank", 999) - 3:
            risks.append("對手排名較高，實力上有一定差距")
        
        # 打法相剋
        matchup = self._check_style_disadvantage(player.get("style"), opponent.get("style"))
        if matchup:
            risks.append(matchup)
        
        return risks
    
    def _check_style_disadvantage(self, player_style: str, opponent_style: str) -> Optional[str]:
        """檢查打法是否處於劣勢"""
        disadvantages = {
            ("防守型", "攻擊型"): "防守型面對攻擊型可能較為被動",
            ("力量型", "快攻型"): "力量型可能跟不上快攻型的節奏",
        }
        return disadvantages.get((player_style, opponent_style))


# 新增 API 端點到 predict_routes.py
def get_tactics_for_api(player: str, opponent: str) -> Dict[str, Any]:
    """API 用的戰術建議函數"""
    advisor = TacticsAdvisor()
    tactics = advisor.generate_tactics(player, opponent)
    return tactics.to_dict()


if __name__ == "__main__":
    advisor = TacticsAdvisor()
    
    tactics = advisor.generate_tactics("Fan Zhendong", "Wang Chuqin")
    
    print(f"\n🎯 {tactics.player} vs {tactics.opponent} 戰術分析")
    print(f"\n📋 整體策略:")
    print(f"   {tactics.overall_strategy}")
    
    print(f"\n🔑 關鍵要點:")
    for point in tactics.key_points:
        print(f"   • {point}")
    
    print(f"\n💡 具體建議:")
    for s in tactics.suggestions:
        print(f"   [{s.category}] {s.title}: {s.description}")
