"""
排名相關路由
處理 WTT 排名資料的查詢和更新
"""
from flask import jsonify
from . import ranking_bp
from services.ranking_service import RankingService

# 服務實例
ranking_service = RankingService()


@ranking_bp.route('/rankings/<category>', methods=['GET'])
def get_ranking(category: str):
    """
    取得特定類別的排名資料
    
    Args:
        category: 排名類別 (SEN_SINGLES, SEN_DOUBLES)
    """
    valid_categories = ['SEN_SINGLES', 'SEN_DOUBLES']
    
    if category not in valid_categories:
        return jsonify({
            'error': '無效的類別',
            'valid_categories': valid_categories
        }), 400
    
    data = ranking_service.get_ranking(category)
    
    if data:
        return jsonify(data), 200
    else:
        return jsonify({'error': '無法取得資料'}), 500


@ranking_bp.route('/rankings', methods=['GET'])
def get_all_rankings():
    """取得所有排名資料"""
    all_data = ranking_service.get_all_rankings()
    return jsonify(all_data), 200


@ranking_bp.route('/update', methods=['POST'])
def manual_update():
    """手動觸發資料更新"""
    results = ranking_service.update_all()
    return jsonify({
        'message': '更新完成',
        'results': results
    }), 200
