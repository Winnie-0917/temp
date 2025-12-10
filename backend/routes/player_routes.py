from flask import request, jsonify
from services.player_service import get_player_service
from . import player_bp

@player_bp.route('/', methods=['GET'])
def get_players():
    """取得選手列表"""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        search = request.args.get('search')
        
        service = get_player_service()
        result = service.get_all_players(page, per_page, search)
        
        return jsonify({
            "success": True,
            **result
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@player_bp.route('/<player_id>', methods=['GET'])
def get_player(player_id):
    """取得單一選手詳情"""
    try:
        service = get_player_service()
        player = service.get_player_details(player_id)
        
        if not player:
            return jsonify({
                "success": False,
                "error": "Player not found"
            }), 404
            
        return jsonify({
            "success": True,
            "player": player
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
