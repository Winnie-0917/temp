"""
即時分析 WebSocket 路由
處理 WebSocket 連接和即時視訊分析
"""
import asyncio
import base64
import json
import time
from flask import request, Blueprint
from flask_socketio import emit, join_room, leave_room
from typing import Dict, Any

# 這個模組需要在 app.py 中與 SocketIO 一起初始化
live_bp = Blueprint('live', __name__)

# 全域分析服務實例（由 app.py 設置）
analysis_sessions: Dict[str, Any] = {}


def init_live_routes(socketio):
    """初始化即時分析的 WebSocket 事件處理"""
    
    @socketio.on('connect', namespace='/live')
    def handle_connect():
        """處理 WebSocket 連接"""
        session_id = request.sid
        print(f"🔌 即時分析連接: {session_id}")
        emit('connected', {
            'session_id': session_id,
            'message': '已連接到即時分析服務'
        })
    
    @socketio.on('disconnect', namespace='/live')
    def handle_disconnect():
        """處理斷開連接"""
        session_id = request.sid
        print(f"🔌 即時分析斷開: {session_id}")
        
        # 清理會話
        if session_id in analysis_sessions:
            analysis_sessions[session_id]['service'].stop_session()
            del analysis_sessions[session_id]
    
    @socketio.on('video_frame', namespace='/live')
    def handle_video_frame(data):
        """處理視訊幀 (支援 Gemini 和 本地模型)"""
        session_id = request.sid
        
        if session_id not in analysis_sessions:
            return
        
        session = analysis_sessions[session_id]
        service = session['service']
        local_classifier = session.get('local_classifier')
        frame_data = data.get('frame')  # base64 編碼的圖片
        
        if frame_data:
            # 1. 本地模型分析 (同步執行，因為需要即時回饋)
            if local_classifier:
                try:
                    import cv2
                    import numpy as np
                    
                    # 移除 data:image/jpeg;base64, 前綴
                    if ',' in frame_data:
                        base64_data = frame_data.split(',')[1]
                    else:
                        base64_data = frame_data
                        
                    image_bytes = base64.b64decode(base64_data)
                    nparr = np.frombuffer(image_bytes, np.uint8)
                    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    
                    if frame is not None:
                        # 轉換為 RGB
                        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        result = local_classifier.process_frame(frame_rgb)
                        
                        if result['prediction']:
                            emit('prediction', result, namespace='/live', room=session_id)
                except Exception as e:
                    print(f"Local model error: {e}")

            # 2. Gemini 分析 (異步)
            asyncio.create_task(process_frame_async(service, frame_data, session_id, socketio))

    @socketio.on('start_analysis', namespace='/live')
    def handle_start_analysis(data):
        """開始即時分析"""
        session_id = request.sid
        player_focus = data.get('player_focus')
        use_local_model = data.get('use_local_model', True)
        
        try:
            from services.live_analysis_service import LiveAnalysisService
            from services.realtime_classifier import RealtimeClassifier
            
            service = LiveAnalysisService()
            
            # 初始化本地模型
            local_classifier = None
            if use_local_model:
                local_classifier = RealtimeClassifier()
            
            # 設置回調函數
            def alert_callback(alert):
                emit('alert', alert.to_dict(), namespace='/live', room=session_id)
            
            service.set_alert_callback(alert_callback)
            service.start_session(player_focus)
            
            # 儲存會話
            analysis_sessions[session_id] = {
                'service': service,
                'local_classifier': local_classifier,
                'start_time': time.time(),
                'player_focus': player_focus
            }
            
            emit('analysis_started', {
                'success': True,
                'message': '即時分析已開始',
                'player_focus': player_focus
            })
            
            print(f"🎬 開始即時分析: {session_id}")
            
        except Exception as e:
            emit('error', {
                'message': f'啟動分析失敗: {str(e)}'
            })
    
    @socketio.on('update_score', namespace='/live')
    def handle_update_score(data):
        """更新比分"""
        session_id = request.sid
        
        if session_id not in analysis_sessions:
            return
        
        service = analysis_sessions[session_id]['service']
        player1_score = data.get('player1_score', 0)
        player2_score = data.get('player2_score', 0)
        
        service.update_score(player1_score, player2_score)
        
        emit('score_updated', {
            'player1_score': player1_score,
            'player2_score': player2_score
        })
    
    @socketio.on('manual_alert', namespace='/live')
    def handle_manual_alert(data):
        """手動發送提醒"""
        session_id = request.sid
        
        if session_id not in analysis_sessions:
            return
        
        service = analysis_sessions[session_id]['service']
        message = data.get('message', '')
        
        if message:
            service.manual_alert(message)
    
    @socketio.on('get_state', namespace='/live')
    def handle_get_state():
        """取得當前狀態"""
        session_id = request.sid
        
        if session_id in analysis_sessions:
            service = analysis_sessions[session_id]['service']
            state = service.get_current_state()
            emit('state', state)
        else:
            emit('state', {
                'is_analyzing': False,
                'match_state': None,
                'recent_alerts': [],
                'total_alerts': 0
            })


async def process_frame_async(service, frame_data, session_id, socketio):
    """異步處理視訊幀"""
    try:
        result = await service.process_frame(frame_data)
        if result:
            # 發送分析結果
            socketio.emit('frame_analysis', result, namespace='/live', room=session_id)
    except Exception as e:
        print(f"幀處理錯誤: {e}")


# HTTP API 端點（用於查詢狀態）
@live_bp.route('/live/sessions', methods=['GET'])
def get_active_sessions():
    """取得活躍的分析會話"""
    sessions = []
    for sid, data in analysis_sessions.items():
        sessions.append({
            'session_id': sid,
            'start_time': data['start_time'],
            'player_focus': data['player_focus'],
            'state': data['service'].get_current_state()
        })
    
    return {
        'success': True,
        'sessions': sessions,
        'total': len(sessions)
    }


@live_bp.route('/live/health', methods=['GET'])
def live_health():
    """健康檢查"""
    return {
        'status': 'ok',
        'service': 'live_analysis',
        'active_sessions': len(analysis_sessions)
    }
