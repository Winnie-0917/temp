import os
import shutil
import glob
from typing import Dict, List
from failure_analyzer import FailureAnalyzer
from youtube_analyzer import YouTubeDownloader

class AutoLabeler:
    def __init__(self, upload_dir='uploads/unlabeled', base_dir='.'):
        self.upload_dir = os.path.join(base_dir, upload_dir)
        self.base_dir = base_dir
        self.analyzer = FailureAnalyzer()
        
        # 確保目錄存在
        os.makedirs(self.upload_dir, exist_ok=True)
        self._ensure_target_dirs()
        
    def _ensure_target_dirs(self):
        """確保目標資料夾存在"""
        for quality in ['good', 'normal', 'bad']:
            path = os.path.join(self.base_dir, f'{quality}_input_movid')
            os.makedirs(path, exist_ok=True)
            
    def process_youtube_video(self, url: str) -> Dict:
        """
        下載並分類 YouTube 影片
        
        Args:
            url: YouTube 影片 URL
            
        Returns:
            處理結果
        """
        try:
            print(f"📥 正在下載 YouTube 影片: {url}")
            downloader = YouTubeDownloader(output_dir=self.upload_dir)
            download_result = downloader.download(url)
            
            if not download_result['success']:
                raise RuntimeError("下載失敗")
                
            video_path = download_result['file_path']
            filename = os.path.basename(video_path)
            print(f"🎬 下載完成，開始分析: {filename}")
            
            # 1. 使用 Gemini 分類
            analysis = self.analyzer.classify_video_quality(video_path)
            quality = analysis.get('quality', 'normal')
            reason = analysis.get('reason', '無理由')
            
            # 2. 移動檔案
            target_dir = os.path.join(self.base_dir, f'{quality}_input_movid')
            target_path = os.path.join(target_dir, filename)
            
            # 如果目標檔案已存在，添加後綴
            if os.path.exists(target_path):
                base, ext = os.path.splitext(filename)
                import time
                timestamp = int(time.time())
                target_path = os.path.join(target_dir, f"{base}_{timestamp}{ext}")
            
            shutil.move(video_path, target_path)
            
            print(f"✅ 已分類為 {quality}: {reason}")
            
            return {
                'success': True,
                'filename': filename,
                'quality': quality,
                'reason': reason,
                'path': target_path
            }
            
        except Exception as e:
            print(f"❌ YouTube 處理失敗: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    def process_unlabeled_videos(self) -> Dict:
        """
        處理所有未標記的影片
        
        Returns:
            處理結果統計
        """
        # 支援的影片格式
        extensions = ['*.mp4', '*.avi', '*.MOV', '*.mov']
        video_files = []
        for ext in extensions:
            video_files.extend(glob.glob(os.path.join(self.upload_dir, ext)))
            
        results = {
            'total': len(video_files),
            'processed': 0,
            'good': 0,
            'normal': 0,
            'bad': 0,
            'errors': 0,
            'details': []
        }
        
        print(f"🔍 發現 {len(video_files)} 個未標記影片")
        
        for video_path in video_files:
            try:
                filename = os.path.basename(video_path)
                print(f"🎬 正在分析: {filename}")
                
                # 1. 使用 Gemini 分類
                analysis = self.analyzer.classify_video_quality(video_path)
                quality = analysis.get('quality', 'normal')
                reason = analysis.get('reason', '無理由')
                
                # 2. 移動檔案
                target_dir = os.path.join(self.base_dir, f'{quality}_input_movid')
                target_path = os.path.join(target_dir, filename)
                
                # 如果目標檔案已存在，添加後綴
                if os.path.exists(target_path):
                    base, ext = os.path.splitext(filename)
                    import time
                    timestamp = int(time.time())
                    target_path = os.path.join(target_dir, f"{base}_{timestamp}{ext}")
                
                shutil.move(video_path, target_path)
                
                # 3. 更新統計
                results['processed'] += 1
                results[quality] += 1
                results['details'].append({
                    'filename': filename,
                    'quality': quality,
                    'reason': reason,
                    'status': 'success'
                })
                
                print(f"✅ 已分類為 {quality}: {reason}")
                
            except Exception as e:
                print(f"❌ 處理失敗 {video_path}: {e}")
                results['errors'] += 1
                results['details'].append({
                    'filename': os.path.basename(video_path),
                    'error': str(e),
                    'status': 'error'
                })
                
        return results

if __name__ == '__main__':
    # 測試
    labeler = AutoLabeler()
    print(labeler.process_unlabeled_videos())
