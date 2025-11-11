import os
from train import VideoClassifier
from skeleton import PoseExtractor
import sys

def predict_video(video_path):
    
    # 檢查檔案是否存在
    if not os.path.exists(video_path):
        print(f"錯誤：找不到影片檔案 {video_path}")
        return
    
    # 檢查模型是否存在
    if not os.path.exists('pose_classifier_model.h5'):
        print("錯誤：找不到訓練好的模型！")
        print("請先執行 train.py 來訓練模型。")
        return
    
    # 創建分類器並載入模型
    print("載入模型...")
    classifier = VideoClassifier()
    classifier.load_model()

    print(f"\n正在分析影片: {video_path}")

    result = classifier.predict(video_path)
    
    # 顯示結果
    print("\n" + "=" * 50)
    print("預測結果")
    print("=" * 50)
    print(f"預測類別: {result['predicted_class'].upper()}")
    print(f"信心度: {result['confidence']:.2%}")
    print("\n所有類別的機率:")
    for class_name, prob in result['probabilities'].items():
        bar_length = int(prob * 30)
        bar = "█" * bar_length + "░" * (30 - bar_length)
        print(f"  {class_name:8s}: {prob:.2%} {bar}")
    print("=" * 50)
    
    return result


def main():
    video_path = sys.argv[1] if len(sys.argv) > 1 else None
    predict_video(video_path)


if __name__ == "__main__":
    main()

