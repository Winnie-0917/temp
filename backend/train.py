import cv2
import os
import numpy as np
import mediapipe as mp
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers # type: ignore
import pickle

class PoseFeatureExtractor:
    """從骨架影片中提取特徵"""
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
            model_complexity=1
        )
        # 排除臉部關鍵點（1-10），保留鼻子（0）和身體（11-32）
        self.face_landmark_indices = set(range(1, 11))
    
    def extract_features_from_video(self, video_path, max_frames=150):
        """
        從影片中提取骨架關鍵點特徵
        
        Args:
            video_path: 影片路徑
            max_frames: 最大幀數（用於統一長度）
        
        Returns:
            numpy array: 特徵向量 (max_frames, num_landmarks, 3)
        """
        cap = cv2.VideoCapture(video_path)
        features = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            
            # 轉換為 RGB
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = self.pose.process(rgb_frame)
            
            # 提取關鍵點（只保留鼻子和身體）
            frame_features = []
            if results.pose_landmarks:
                for idx, landmark in enumerate(results.pose_landmarks.landmark):
                    if idx not in self.face_landmark_indices:
                        frame_features.append([
                            landmark.x,
                            landmark.y,
                            landmark.z
                        ])
            else:
                # 如果沒有檢測到姿勢，使用零向量
                num_landmarks = 23  # 鼻子(1) + 身體(22) = 23
                frame_features = [[0.0, 0.0, 0.0] for _ in range(num_landmarks)]
            
            features.append(frame_features)
            
            if len(features) >= max_frames:
                break
        
        cap.release()
        
        # 如果影片太短，用最後一幀填充
        while len(features) < max_frames:
            if features:
                features.append(features[-1])
            else:
                num_landmarks = 23
                features.append([[0.0, 0.0, 0.0] for _ in range(num_landmarks)])
        
        return np.array(features[:max_frames])


class VideoClassifier:
    """影片分類器"""
    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_extractor = PoseFeatureExtractor()
        self.classes = ['bad', 'normal', 'good']
        self.max_frames = 150
        self.num_landmarks = 23  # 鼻子(1) + 身體(22)
    
    def load_data(self, data_folders):
        """
        載入訓練資料
        
        Args:
            data_folders: dict，格式為 {'good': 'good_output_movid', 'normal': 'normal_output_movid', 'bad': 'bad_output_movid'}
        
        Returns:
            X: 特徵數據
            y: 標籤
        """
        X = []
        y = []
        
        for label, folder_path in data_folders.items():
            if not os.path.exists(folder_path):
                print(f"警告：資料夾 {folder_path} 不存在，跳過")
                continue
            
            print(f"載入 {label} 類別的資料...")
            video_files = [
                f for f in os.listdir(folder_path)
                if f.lower().endswith((".mp4", ".avi", ".mov", ".mkv"))
            ]
            
            for filename in video_files:
                video_path = os.path.join(folder_path, filename)
                try:
                    features = self.feature_extractor.extract_features_from_video(
                        video_path, self.max_frames
                    )
                    X.append(features)
                    y.append(self.classes.index(label))
                    print(f"  已載入: {filename}")
                except Exception as e:
                    print(f"  錯誤：無法載入 {filename}: {e}")
        
        if len(X) == 0:
            raise ValueError("沒有載入任何資料！請檢查資料夾路徑和檔案。")
        
        X = np.array(X)
        y = np.array(y)
        
        print(f"\n總共載入 {len(X)} 個影片")
        print(f"特徵形狀: {X.shape}")
        print(f"標籤分布: {np.bincount(y)}")
        
        return X, y
    
    def build_model(self, input_shape):
        """建立 LSTM 模型"""
        model = keras.Sequential([
            # 輸入層
            layers.Input(shape=input_shape),
            
            # LSTM 層
            layers.LSTM(128, return_sequences=True),
            layers.Dropout(0.3),
            layers.LSTM(64, return_sequences=False),
            layers.Dropout(0.3),
            
            # 全連接層
            layers.Dense(64, activation='relu'),
            layers.Dropout(0.3),
            layers.Dense(32, activation='relu'),
            
            # 輸出層（3個類別）
            layers.Dense(3, activation='softmax')
        ])
        
        model.compile(
            optimizer=keras.optimizers.Adam(learning_rate=0.001),
            loss='sparse_categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def train(self, data_folders, epochs=50, batch_size=16, validation_split=0.2):
        """
        訓練模型
        
        Args:
            data_folders: dict，格式為 {'good': 'good_output_movid', ...}
            epochs: 訓練輪數
            batch_size: 批次大小
            validation_split: 驗證集比例
        """
        print("=" * 50)
        print("開始載入資料...")
        print("=" * 50)
        
        # 載入資料
        X, y = self.load_data(data_folders)
        
        # 資料預處理：標準化
        # 將 (samples, frames, landmarks, 3) 重塑為 (samples, frames, landmarks*3)
        n_samples, n_frames, n_landmarks, n_coords = X.shape
        X_reshaped = X.reshape(n_samples, n_frames, n_landmarks * n_coords)
        
        # 標準化
        self.scaler = StandardScaler()
        X_scaled = np.array([
            self.scaler.fit_transform(sample) for sample in X_reshaped
        ])
        
        # 分割訓練集和驗證集
        X_train, X_val, y_train, y_val = train_test_split(
            X_scaled, y, test_size=validation_split, random_state=42, stratify=y
        )
        
        print(f"\n訓練集大小: {X_train.shape}")
        print(f"驗證集大小: {X_val.shape}")
        
        # 建立模型
        input_shape = (n_frames, n_landmarks * n_coords)
        self.model = self.build_model(input_shape)
        
        print("\n模型架構:")
        self.model.summary()
        
        # 訓練模型
        print("\n" + "=" * 50)
        print("開始訓練...")
        print("=" * 50)
        
        history = self.model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=epochs,
            batch_size=batch_size,
            verbose=1
        )
        
        # 評估模型
        print("\n" + "=" * 50)
        print("評估模型...")
        print("=" * 50)
        
        train_loss, train_acc = self.model.evaluate(X_train, y_train, verbose=0)
        val_loss, val_acc = self.model.evaluate(X_val, y_val, verbose=0)
        
        print(f"訓練準確率: {train_acc:.4f}")
        print(f"驗證準確率: {val_acc:.4f}")
        
        return history
    
    def save_model(self, model_path='pose_classifier_model.h5', scaler_path='scaler.pkl'):
        """儲存模型和標準化器"""
        if self.model is None:
            raise ValueError("模型尚未訓練！")
        
        self.model.save(model_path)
        with open(scaler_path, 'wb') as f:
            pickle.dump(self.scaler, f)
        
        print(f"\n模型已儲存至: {model_path}")
        print(f"標準化器已儲存至: {scaler_path}")
    
    def load_model(self, model_path='pose_classifier_model.h5', scaler_path='scaler.pkl'):
        """載入模型和標準化器"""
        self.model = keras.models.load_model(model_path)
        with open(scaler_path, 'rb') as f:
            self.scaler = pickle.load(f)
        
        print(f"模型已載入: {model_path}")
        print(f"標準化器已載入: {scaler_path}")
    
    def predict(self, video_path):
        """
        預測單個影片的分類
        
        Args:
            video_path: 影片路徑
        
        Returns:
            dict: 包含預測類別和機率
        """
        if self.model is None:
            raise ValueError("模型尚未載入！請先訓練或載入模型。")
        
        # 提取特徵
        features = self.feature_extractor.extract_features_from_video(
            video_path, self.max_frames
        )
        
        # 預處理
        n_frames, n_landmarks, n_coords = features.shape
        features_reshaped = features.reshape(1, n_frames, n_landmarks * n_coords)
        features_scaled = np.array([
            self.scaler.transform(sample) for sample in features_reshaped
        ])
        
        # 預測
        predictions = self.model.predict(features_scaled, verbose=0)
        predicted_class_idx = np.argmax(predictions[0])
        predicted_class = self.classes[predicted_class_idx]
        confidence = predictions[0][predicted_class_idx]
        
        # 所有類別的機率
        probabilities = {
            self.classes[i]: float(predictions[0][i])
            for i in range(len(self.classes))
        }
        
        return {
            'predicted_class': predicted_class,
            'confidence': float(confidence),
            'probabilities': probabilities
        }


def main():
    """主函數"""
    # 定義資料資料夾
    data_folders = {
        'good': 'good_output_movid',
        'normal': 'normal_output_movid',
        'bad': 'bad_output_movid'
    }
    
    # 創建分類器
    classifier = VideoClassifier()
    
    # 訓練模型
    print("開始訓練模型...")
    classifier.train(
        data_folders,
        epochs=50,
        batch_size=16,
        validation_split=0.2
    )
    
    # 儲存模型
    classifier.save_model()
    
    print("\n" + "=" * 50)
    print("訓練完成！")
    print("=" * 50)


if __name__ == "__main__":
    main()

