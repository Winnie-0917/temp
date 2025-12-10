"""
比賽預測 API 路由
"""
from flask import request, jsonify
from services.prediction_model import MatchPredictor
from services.tactics_advisor import TacticsAdvisor
from . import predict_bp

# 初始化預測器
predictor = None


def get_predictor():
    global predictor
    if predictor is None:
        predictor = MatchPredictor()
    return predictor


@predict_bp.route('/health', methods=['GET'])
def health_check():
    """健康檢查"""
    return jsonify({
        "status": "ok",
        "service": "prediction"
    })


@predict_bp.route('/players', methods=['GET'])
def get_players():
    """取得選手列表"""
    try:
        gender = request.args.get('gender')
        pred = get_predictor()
        players = pred.get_players(gender)
        return jsonify({
            "success": True,
            "players": players
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@predict_bp.route('/match', methods=['POST'])
def predict_match():
    """預測比賽結果"""
    try:
        data = request.get_json()
        player1 = data.get('player1')
        player2 = data.get('player2')
        
        if not player1 or not player2:
            return jsonify({
                "success": False,
                "error": "請提供兩位選手名稱"
            }), 400
        
        if player1 == player2:
            return jsonify({
                "success": False,
                "error": "請選擇兩位不同的選手"
            }), 400
        
        pred = get_predictor()
        result = pred.predict(player1, player2)
        
        return jsonify({
            "success": True,
            "prediction": result.to_dict()
        })
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@predict_bp.route('/preview', methods=['POST'])
def match_preview():
    """取得比賽預覽（包含詳細分析）"""
    try:
        data = request.get_json()
        player1 = data.get('player1')
        player2 = data.get('player2')
        
        if not player1 or not player2:
            return jsonify({
                "success": False,
                "error": "請提供兩位選手名稱"
            }), 400
        
        pred = get_predictor()
        preview = pred.get_match_preview(player1, player2)
        
        return jsonify({
            "success": True,
            **preview
        })
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@predict_bp.route('/stats/<player_name>', methods=['GET'])
def player_stats(player_name: str):
    """取得選手統計數據"""
    try:
        pred = get_predictor()
        stats = pred.data_collector.get_player_stats(player_name)
        
        if stats["total_matches"] == 0:
            return jsonify({
                "success": False,
                "error": f"找不到選手 {player_name} 的數據"
            }), 404
        
        return jsonify({
            "success": True,
            "stats": stats
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@predict_bp.route('/h2h', methods=['GET'])
def head_to_head():
    """取得兩位選手的對戰記錄"""
    try:
        player1 = request.args.get('player1')
        player2 = request.args.get('player2')
        
        if not player1 or not player2:
            return jsonify({
                "success": False,
                "error": "請提供兩位選手名稱"
            }), 400
        
        pred = get_predictor()
        h2h = pred.data_collector.get_h2h(player1, player2)
        
        if not h2h:
            return jsonify({
                "success": True,
                "h2h": None,
                "message": "這兩位選手沒有對戰記錄"
            })
        
        return jsonify({
            "success": True,
            "h2h": h2h
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


# 戰術建議實例
tactics_advisor = None


def get_tactics_advisor():
    global tactics_advisor
    if tactics_advisor is None:
        tactics_advisor = TacticsAdvisor()
    return tactics_advisor


@predict_bp.route('/tactics', methods=['POST'])
def get_tactics():
    """取得戰術建議"""
    try:
        data = request.get_json()
        player = data.get('player')
        opponent = data.get('opponent')
        
        if not player or not opponent:
            return jsonify({
                "success": False,
                "error": "請提供選手和對手名稱"
            }), 400
        
        advisor = get_tactics_advisor()
        tactics = advisor.generate_tactics(player, opponent)
        
        return jsonify({
            "success": True,
            "tactics": tactics.to_dict()
        })
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
