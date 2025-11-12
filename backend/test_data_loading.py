"""
測試訓練資料是否正確載入
"""

import os
import sys
import glob
import numpy as np

# 將 backend 目錄加入路徑
sys.path.insert(0, os.path.dirname(__file__))

from skeleton import PoseExtractor

def test_data_loading():
    """測試資料載入"""
    print("=" * 60)
    print("測試訓練資料載入")
    print("=" * 60)
    
    # 定義類別對應
    class_map = {'good': 0, 'normal': 1, 'bad': 2}
    
    # 初始化骨架提取器
    pose_extractor = PoseExtractor()
    
    total_samples = 0
    sample_shapes = []
    
    # 掃描各個類別的影片資料夾
    for class_name, class_id in class_map.items():
        folder = f'{class_name}_input_movid'
        print(f"\n檢查資料夾: {folder}")
        
        if not os.path.exists(folder):
            print(f"  ❌ 資料夾不存在")
            continue
        
        video_files = glob.glob(os.path.join(folder, '*.mp4')) + \
                      glob.glob(os.path.join(folder, '*.avi')) + \
                      glob.glob(os.path.join(folder, '*.MOV'))
        
        print(f"  找到 {len(video_files)} 個影片")
        
        if len(video_files) == 0:
            continue
        
        # 測試第一個影片
        test_video = video_files[0]
        print(f"  測試影片: {os.path.basename(test_video)}")
        
        try:
            # 提取骨架特徵
            pose_data = pose_extractor.extract_pose_data(test_video)
            
            if pose_data is None or len(pose_data) == 0:
                print(f"    ❌ 未提取到骨架資料")
                continue
            
            # 將骨架資料轉換為數值陣列
            landmarks_array = []
            for frame_data in pose_data:
                if frame_data['landmarks'] is not None:
                    frame_landmarks = []
                    for lm in frame_data['landmarks']:
                        frame_landmarks.extend([lm['x'], lm['y'], lm['z']])
                    landmarks_array.append(frame_landmarks)
            
            if len(landmarks_array) == 0:
                print(f"    ❌ 未偵測到有效幀")
                continue
            
            # 轉換為 numpy 陣列
            landmarks_array = np.array(landmarks_array)
            
            print(f"    ✅ 原始形狀: {landmarks_array.shape}")
            print(f"       總幀數: {landmarks_array.shape[0]}")
            print(f"       特徵數: {landmarks_array.shape[1]}")
            
            # 檢查特徵維度
            if landmarks_array.shape[1] != 69:
                print(f"    ⚠️  特徵維度不符 (預期 69，實際 {landmarks_array.shape[1]})")
                print(f"       關鍵點數量: {landmarks_array.shape[1] // 3}")
            else:
                print(f"    ✅ 特徵維度正確 (23 個關鍵點 × 3 座標 = 69)")
            
            sample_shapes.append(landmarks_array.shape)
            total_samples += len(video_files)
            
        except Exception as e:
            print(f"    ❌ 處理錯誤: {e}")
            import traceback
            traceback.print_exc()
    
    print("\n" + "=" * 60)
    print("總結")
    print("=" * 60)
    print(f"預估總樣本數: {total_samples}")
    
    if sample_shapes:
        print(f"\n範例形狀:")
        for i, shape in enumerate(sample_shapes):
            print(f"  類別 {i+1}: {shape}")
    else:
        print("  ❌ 未成功載入任何樣本")
    
    print("\n建議:")
    print("  1. 確保每個資料夾至少有 30 個影片")
    print("  2. 影片格式: MP4, AVI, MOV")
    print("  3. 影片內容清晰，能看到完整人體")
    print("=" * 60)


if __name__ == '__main__':
    test_data_loading()
