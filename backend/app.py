"""
Table Tennis AI - 主應用程式入口
重構版本 - 採用模組化架構
"""
import os
import sys

# 確保可以導入本地模組
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from apscheduler.schedulers.background import BackgroundScheduler

from config import get_config
from routes import register_blueprints
from services.ranking_service import RankingService

# 全域 SocketIO 實例
socketio = None


def create_app() -> Flask:
    """
    應用程式工廠函數
    
    Returns:
        Flask 應用程式實例
    """
    global socketio
    
    config = get_config()
    
    # 建立 Flask 應用
    app = Flask(__name__, static_folder=config.paths.BASE_DIR)
    
    # 配置 CORS
    CORS(app, origins=config.cors.ALLOWED_ORIGINS)
    
    # 初始化 SocketIO
    socketio = SocketIO(
        app,
        cors_allowed_origins="*",
        async_mode='threading',
        logger=False,
        engineio_logger=False
    )
    
    # 註冊藍圖
    register_blueprints(app)
    
    # 初始化即時分析路由
    try:
        from routes.live_routes import live_bp, init_live_routes
        app.register_blueprint(live_bp, url_prefix='/api')
        init_live_routes(socketio)
        print("✅ 即時分析服務已啟用")
    except Exception as e:
        print(f"⚠️ 即時分析服務初始化失敗: {e}")
    
    # 初始化預測路由
    try:
        from routes.predict_routes import predict_bp
        app.register_blueprint(predict_bp)
        print("✅ 比賽預測服務已啟用")
    except Exception as e:
        print(f"⚠️ 比賽預測服務初始化失敗: {e}")
    
    # 初始化自動訓練路由
    try:
        from routes.auto_train_routes import auto_train_bp
        app.register_blueprint(auto_train_bp)
        print("✅ 自動訓練服務已啟用")
    except Exception as e:
        print(f"⚠️ 自動訓練服務初始化失敗: {e}")
    
    # 註冊上傳檔案路由
    @app.route('/uploads/<path:filename>')
    def serve_uploads(filename: str):
        uploads_dir = os.path.join(app.root_path, 'uploads')
        return send_from_directory(uploads_dir, filename)

    # 註冊通用靜態檔案路由 (放在最後避免覆蓋 API 路由)
    @app.route('/static/<path:filename>')
    def serve_static(filename: str):
        full_path = os.path.join(config.paths.BASE_DIR, filename)
        if os.path.exists(full_path) and os.path.commonpath(
            [config.paths.BASE_DIR, os.path.abspath(full_path)]
        ) == config.paths.BASE_DIR:
            return send_from_directory(config.paths.BASE_DIR, filename)
        return jsonify({'error': 'file not found'}), 404
    
    return app


def setup_scheduler(app: Flask) -> BackgroundScheduler:
    """
    設定排程器
    
    Args:
        app: Flask 應用程式
        
    Returns:
        排程器實例
    """
    config = get_config()
    
    if not config.scheduler.ENABLED:
        return None
    
    ranking_service = RankingService()
    
    scheduler = BackgroundScheduler()
    scheduler.add_job(
        func=ranking_service.update_all,
        trigger="interval",
        hours=config.scheduler.UPDATE_INTERVAL_HOURS
    )
    scheduler.start()
    
    return scheduler


def init_ranking_data():
    """初始化排名資料"""
    print("📊 初始化排名資料...")
    try:
        ranking_service = RankingService()
        ranking_service.update_all()
        print("✅ 排名資料初始化完成")
    except Exception as e:
        print(f"⚠️ 初始化排名資料失敗: {e}")


# 建立應用程式實例
app = create_app()


if __name__ == '__main__':
    config = get_config()
    
    # 初始化資料
    init_ranking_data()
    
    # 設定排程器
    scheduler = setup_scheduler(app)
    
    print(f"""
    🏓 Table Tennis AI Server
    ========================
    🌐 Host: {config.server.HOST}
    🔌 Port: {config.server.PORT}
    🔧 Environment: {config.app.ENV}
    🔄 Scheduler: {'Enabled' if config.scheduler.ENABLED else 'Disabled'}
    📡 WebSocket: Enabled (即時分析)
    """)
    
    # 使用 SocketIO 啟動伺服器
    socketio.run(
        app,
        host=config.server.HOST,
        port=config.server.PORT,
        debug=config.app.DEBUG,
        allow_unsafe_werkzeug=True
    )
