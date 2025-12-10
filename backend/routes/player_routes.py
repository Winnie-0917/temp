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


# ==================== 選手檔案 API ====================

@player_bp.route('/profile/<player_name>', methods=['GET'])
def get_player_profile(player_name):
    """取得選手分析檔案"""
    try:
        from services.player_profile_service import get_player_profile_service
        
        service = get_player_profile_service()
        profile = service.get_player_profile(player_name)
        
        if not profile:
            return jsonify({
                "success": False,
                "error": "Player profile not found"
            }), 404
            
        return jsonify({
            "success": True,
            "profile": profile
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@player_bp.route('/profiles', methods=['GET'])
def get_all_player_profiles():
    """取得所有已分析選手的檔案摘要"""
    try:
        from services.player_profile_service import get_player_profile_service
        
        limit = int(request.args.get('limit', 50))
        service = get_player_profile_service()
        profiles = service.get_all_player_profiles(limit)
        
        return jsonify({
            "success": True,
            "profiles": profiles,
            "total": len(profiles)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@player_bp.route('/profiles/search', methods=['GET'])
def search_player_profiles():
    """搜尋已分析的選手"""
    try:
        from services.player_profile_service import get_player_profile_service
        
        query = request.args.get('q', '')
        if not query:
            return jsonify({
                "success": False,
                "error": "Missing search query"
            }), 400
            
        service = get_player_profile_service()
        results = service.search_players(query)
        
        return jsonify({
            "success": True,
            "results": results,
            "total": len(results)
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
