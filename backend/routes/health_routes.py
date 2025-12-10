"""
健康檢查路由
"""
from flask import jsonify
from . import health_bp


@health_bp.route('/')
def serve_index():
    """首頁"""
    from flask import current_app
    return current_app.send_static_file('index.html')


@health_bp.get('/health')
def health():
    """健康檢查端點"""
    return jsonify({'status': 'ok'})


@health_bp.get('/api/health')
def api_health():
    """API 健康檢查端點"""
    return jsonify({'status': 'ok', 'message': 'Server is running'})
