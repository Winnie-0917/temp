"""
失誤分析路由
處理失誤影片分析和 AI 建議
"""
from flask import request, jsonify
from werkzeug.utils import secure_filename
import os
import uuid
from . import failure_bp
from config import get_config

config = get_config()


@failure_bp.route('/analyze-failure', methods=['POST'])
def analyze_failure():
    """分析失分影片並提供 AI 建議"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '沒有收到檔案欄位 file'}), 400

        file = request.files['file']
        if not file or file.filename == '':
            return jsonify({'error': '未選擇檔案'}), 400

        # 儲存影片
        filename = secure_filename(file.filename)
        save_path = os.path.join(config.paths.UPLOAD_DIR, f'failure_{uuid.uuid4()}_{filename}')
        file.save(save_path)

        # 是否使用 Gemini AI
        use_gemini = request.form.get('use_gemini', 'true').lower() == 'true'
        
        # 延遲導入
        from services.failure_service import FailureService
        failure_service = FailureService()
        
        # 執行分析
        print(f"🎬 開始分析失誤影片: {filename}")
        result = failure_service.analyze(save_path, use_gemini=use_gemini)
        
        return jsonify({
            'success': True,
            'filename': filename,
            'analysis': result,
            'video_path': save_path
        }), 200

    except Exception as e:
        print(f"❌ 分析失敗: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@failure_bp.route('/analyze-failure/batch', methods=['POST'])
def analyze_failure_batch():
    """批次分析多個失誤影片"""
    try:
        if 'files' not in request.files:
            return jsonify({'error': '沒有收到檔案欄位 files'}), 400

        files = request.files.getlist('files')
        if not files or len(files) == 0:
            return jsonify({'error': '未選擇檔案'}), 400

        use_gemini = request.form.get('use_gemini', 'true').lower() == 'true'
        
        from services.failure_service import FailureService
        failure_service = FailureService()
        
        results = []
        for file in files:
            if file and file.filename:
                filename = secure_filename(file.filename)
                save_path = os.path.join(config.paths.UPLOAD_DIR, f'failure_{uuid.uuid4()}_{filename}')
                file.save(save_path)
                
                try:
                    analysis = failure_service.analyze(save_path, use_gemini=use_gemini)
                    results.append({
                        'filename': filename,
                        'success': True,
                        'analysis': analysis
                    })
                except Exception as e:
                    results.append({
                        'filename': filename,
                        'success': False,
                        'error': str(e)
                    })
        
        return jsonify({
            'total': len(files),
            'results': results
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@failure_bp.route('/analyze-failure/config', methods=['GET'])
def get_analysis_config():
    """取得分析配置資訊"""
    try:
        from services.failure_service import FailureService
        failure_service = FailureService()
        gemini_available = failure_service.is_gemini_available()
        
        return jsonify({
            'gemini_available': gemini_available,
            'supported_formats': config.ai.SUPPORTED_VIDEO_FORMATS,
            'max_duration_seconds': config.ai.MAX_VIDEO_DURATION,
            'recommended_duration_seconds': config.ai.RECOMMENDED_VIDEO_DURATION,
            'analysis_modes': {
                'basic': '基礎分析（僅使用 MediaPipe）',
                'gemini': 'AI 深度分析（使用 Gemini）'
            }
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500
