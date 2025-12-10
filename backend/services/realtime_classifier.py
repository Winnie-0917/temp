import numpy as np
import tensorflow as tf
import joblib
import os
from collections import deque
from skeleton import PoseExtractor

class RealtimeClassifier:
    def __init__(self, model_path='pose_classifier_model.h5', scaler_path='scaler.pkl'):
        self.model_path = model_path
        self.scaler_path = scaler_path
        self.model = None
        self.scaler = None
        self.pose_extractor = PoseExtractor()
        
        # 緩衝區設定
        self.max_frames = 150
        self.num_features = 69  # 23 landmarks * 3 coords
        self.frame_buffer = deque(maxlen=self.max_frames)
        self.classes = ['good', 'normal', 'bad']
        
        self.load_model()
        
    def load_model(self):
        """載入模型和標準化器"""
        if os.path.exists(self.model_path):
            try:
                self.model = tf.keras.models.load_model(self.model_path)
                print(f"✅ 模型已載入: {self.model_path}")
            except Exception as e:
                print(f"❌ 模型載入失敗: {e}")
        
        if os.path.exists(self.scaler_path):
            try:
                self.scaler = joblib.load(self.scaler_path)
                print(f"✅ Scaler 已載入: {self.scaler_path}")
            except Exception as e:
                print(f"❌ Scaler 載入失敗: {e}")

    def process_frame(self, frame):
        """
        處理單一影像幀
        
        Returns:
            dict: 包含預測結果（如果緩衝區已滿）和骨架數據
        """
        # 1. 提取骨架
        results = self.pose_extractor.pose.process(frame)
        landmarks_data = []
        
        if results.pose_landmarks:
            # 提取 23 個關鍵點 (排除臉部 1-10)
            for idx, landmark in enumerate(results.pose_landmarks.landmark):
                if idx not in self.pose_extractor.face_landmark_indices:
                    landmarks_data.extend([landmark.x, landmark.y, landmark.z])
        else:
            # 沒偵測到人，填 0
            landmarks_data = [0.0] * self.num_features
            
        # 2. 加入緩衝區
        self.frame_buffer.append(landmarks_data)
        
        result = {
            'has_pose': bool(results.pose_landmarks),
            'prediction': None,
            'confidence': 0.0
        }
        
        # 3. 如果緩衝區滿了，進行預測 (每 10 幀預測一次，避免過度運算)
        if len(self.frame_buffer) == self.max_frames and self.model and self.scaler:
            # 轉換為 numpy array
            sequence = np.array(self.frame_buffer)
            
            # 標準化
            sequence_reshaped = sequence.reshape(-1, self.num_features)
            sequence_scaled = self.scaler.transform(sequence_reshaped)
            X = sequence_scaled.reshape(1, self.max_frames, self.num_features)
            
            # 預測
            pred = self.model.predict(X, verbose=0)[0]
            class_idx = np.argmax(pred)
            
            result['prediction'] = self.classes[class_idx]
            result['confidence'] = float(pred[class_idx])
            result['probabilities'] = {
                'good': float(pred[0]),
                'normal': float(pred[1]),
                'bad': float(pred[2])
            }
            
        return result

    def reset(self):
        """重置緩衝區"""
        self.frame_buffer.clear()
