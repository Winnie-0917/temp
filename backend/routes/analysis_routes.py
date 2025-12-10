"""
動作分析路由
處理影片上傳和動作品質分析
"""
from flask import request, jsonify
from werkzeug.utils import secure_filename
import os
from . import analysis_bp
from config import get_config

config = get_config()


@analysis_bp.post('/analyze')
def analyze_video():
    """分析上傳的桌球動作影片"""
    if 'file' not in request.files:
        return jsonify({'error': '沒有收到檔案欄位 file'}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'error': '未選擇檔案'}), 400

    filename = secure_filename(file.filename)
    save_path = os.path.join(config.paths.UPLOAD_DIR, filename)
    
    try:
        file.save(save_path)
    except Exception as e:
        return jsonify({'error': f'無法儲存檔案: {e}'}), 500

    try:
        # 延遲導入避免啟動時載入過重
        from services.prediction_service import PredictionService
        prediction_service = PredictionService()
        result = prediction_service.predict(save_path)
        
        if not result:
            return jsonify({'error': '分析失敗或回傳結果為空'}), 500

        return jsonify({
            'predicted_class': result.get('predicted_class'),
            'confidence': result.get('confidence'),
            'probabilities': result.get('probabilities', {}),
            'filename': filename
        })
    except Exception as e:
        return jsonify({'error': f'分析時發生錯誤: {e}'}), 500
