"""
模型訓練路由
處理模型訓練的啟動和狀態查詢
"""
from flask import request, jsonify
import uuid
import threading
from . import training_bp
from services.training_service import TrainingService
from services.auto_labeler import AutoLabeler

# 訓練任務存儲
training_tasks = {}
training_service = TrainingService(training_tasks)


@training_bp.post('/train')
def start_training():
    """啟動模型訓練"""
    try:
        config = request.get_json()
        
        # 驗證配置
        required_fields = ['model_type', 'epochs', 'batch_size', 'learning_rate']
        for field in required_fields:
            if field not in config:
                return jsonify({'error': f'缺少必要參數: {field}'}), 400
        
        # 生成任務 ID
        task_id = str(uuid.uuid4())
        
        # 初始化任務狀態
        training_tasks[task_id] = {
            'status': 'initializing',
            'message': '正在初始化訓練...',
            'config': config,
            'logs': [],
            'current_epoch': 0,
            'total_epochs': config['epochs']
        }
        
        # 在背景執行緒中啟動訓練
        training_thread = threading.Thread(
            target=training_service.run_training,
            args=(task_id, config)
        )
        training_thread.daemon = True
        training_thread.start()
        
        return jsonify({
            'task_id': task_id,
            'message': '訓練已啟動'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@training_bp.get('/train/status/<task_id>')
def get_training_status(task_id: str):
    """取得訓練狀態"""
    if task_id not in training_tasks:
        return jsonify({'error': '找不到該訓練任務'}), 404
    
    task = training_tasks[task_id]
    
    # 只返回最新的日誌
    recent_logs = task.get('logs', [])[-10:] if 'logs' in task else []
    
    response = {
        'status': task['status'],
        'message': task.get('message', ''),
        'current_epoch': task.get('current_epoch', 0),
        'total_epochs': task.get('total_epochs', 0),
        'accuracy': task.get('accuracy'),
        'val_accuracy': task.get('val_accuracy'),
        'loss': task.get('loss'),
        'val_loss': task.get('val_loss'),
        'logs': recent_logs
    }
    
    if task['status'] == 'completed':
        response['result'] = task.get('result', {})
    
    return jsonify(response), 200


@training_bp.post('/auto-label')
def auto_label_videos():
    """自動標註影片 (支援本地與 YouTube)"""
    try:
        data = request.get_json()
        labeler = AutoLabeler()
        
        # 如果有提供 YouTube URL
        if data and 'youtube_url' in data:
            result = labeler.process_youtube_video(data['youtube_url'])
            return jsonify(result)
            
        # 否則處理本地未標記影片
        results = labeler.process_unlabeled_videos()
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


