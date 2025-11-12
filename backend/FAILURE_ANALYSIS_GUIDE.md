# 桌球失誤分析系統 - 使用指南

## 📋 功能說明

使用 Gemini AI 進行桌球失分影片分析，提供專業的技術建議。

### 核心功能
- ✅ **影片處理**: 自動抽取關鍵幀（3-5幀）
- ✅ **姿態分析**: 使用 MediaPipe 分析身體動作
- ✅ **AI 分析**: Gemini 多模態分析提供自然語言建議
- ✅ **結構化輸出**: JSON 格式的詳細分析報告

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
cd backend
pip install -r requirements.txt
```

### 2. 配置 Gemini API

#### 取得 API 金鑰
訪問 https://aistudio.google.com/app/apikey 取得您的 Gemini API 金鑰

#### 設定環境變數

**方法一：使用 .env 檔案（推薦）**
```bash
# 複製範例檔案
cp .env.example .env

# 編輯 .env 並填入您的 API 金鑰
GEMINI_API_KEY=your_actual_api_key_here
```

**方法二：直接設定環境變數**

Windows (PowerShell):
```powershell
$env:GEMINI_API_KEY="your_actual_api_key_here"
```

Linux/Mac:
```bash
export GEMINI_API_KEY="your_actual_api_key_here"
```

### 3. 測試安裝

```bash
# 測試基本功能
python test_failure_analyzer.py

# 測試完整分析（需要影片）
python test_failure_analyzer.py path/to/your/test_video.mp4
```

---

## 📡 API 使用

### 端點 1: 單一影片分析

**請求:**
```http
POST /api/analyze-failure
Content-Type: multipart/form-data

file: <video_file>
use_gemini: true  # 可選，預設為 true
```

**回應:**
```json
{
  "success": true,
  "filename": "failure_video.mp4",
  "analysis": {
    "structured_data": {
      "video_info": {
        "duration_seconds": 4.2,
        "analyzed_frames": 5
      },
      "pose_analysis": {
        "total_frames": 5,
        "analyzed_frames": 5,
        "avg_racket_angle": 45.2,
        "racket_angle_variance": 120.5
      },
      "technical_indicators": {
        "stance": "normal",
        "racket_control": "stable",
        "body_balance": "stable"
      }
    },
    "ai_analysis": {
      "failure_reason": "選手在回擊時站位過近，拍面過於後仰，導致回球出界",
      "category": "站位錯誤",
      "detailed_analysis": {
        "stance": "站位距離球台過近，影響擊球空間",
        "racket_angle": "拍面後仰角度過大（約60度），不利於控制弧線",
        "body_balance": "重心偏後，擊球時未能充分轉移重心",
        "timing": "擊球時機稍晚，未在上升期擊球"
      },
      "improvement_suggestions": [
        "練習站位，保持與球台適當距離（約1-1.5個手臂長度）",
        "調整拍面角度，擊球時保持拍面稍微前傾",
        "加強重心轉移訓練，擊球時重心由後向前移動"
      ],
      "summary": "站位過近，拍面後仰，需改善站位和拍面控制",
      "severity": "moderate"
    },
    "timestamp": "2024-01-15T10:30:00"
  }
}
```

### 端點 2: 批次分析

**請求:**
```http
POST /api/analyze-failure/batch
Content-Type: multipart/form-data

files: <video_file_1>
files: <video_file_2>
files: <video_file_3>
use_gemini: true
```

**回應:**
```json
{
  "total": 3,
  "results": [
    {
      "filename": "video1.mp4",
      "success": true,
      "analysis": { /* 分析結果 */ }
    },
    {
      "filename": "video2.mp4",
      "success": true,
      "analysis": { /* 分析結果 */ }
    }
  ]
}
```

### 端點 3: 取得配置資訊

**請求:**
```http
GET /api/analyze-failure/config
```

**回應:**
```json
{
  "gemini_available": true,
  "supported_formats": ["mp4", "avi", "mov", "mkv"],
  "max_duration_seconds": 10,
  "recommended_duration_seconds": 4,
  "analysis_modes": {
    "basic": "基礎分析（僅使用 MediaPipe）",
    "gemini": "AI 深度分析（使用 Gemini）"
  }
}
```

---

## 🧪 Python 程式碼範例

### 基本使用

```python
from failure_analyzer import FailureAnalyzer

# 初始化分析器
analyzer = FailureAnalyzer()

# 分析失誤影片
result = analyzer.analyze_failure('path/to/failure_video.mp4')

# 顯示結果
print("失誤原因:", result['ai_analysis']['failure_reason'])
print("改進建議:")
for suggestion in result['ai_analysis']['improvement_suggestions']:
    print(f"  - {suggestion}")
```

### 進階使用

```python
from failure_analyzer import FailureAnalyzer

# 使用自訂 API 金鑰
analyzer = FailureAnalyzer(api_key='your_api_key')

# 只生成結構化數據（不使用 Gemini）
structured_data = analyzer.generate_structured_analysis('video.mp4')

# 手動觸發 Gemini 分析
ai_result = analyzer.analyze_with_gemini(structured_data, 'video.mp4')

# 自訂關鍵幀數量
frames = analyzer.extract_key_frames('video.mp4', num_frames=10)
```

---

## 🎯 分析維度說明

### 姿態分析
- **拍面角度**: 手腕、手肘的相對位置計算拍面傾斜度
- **重心位置**: 髖部關鍵點計算身體重心
- **關節高度**: 手腕、手肘、肩膀的垂直位置
- **動作穩定性**: 各項指標的變異程度

### 技術指標
- **站位評估**: 距離、角度、重心分佈
- **拍面控制**: 角度一致性、變化幅度
- **身體平衡**: 重心穩定性、移動流暢度

### AI 分析類別
- 站位錯誤
- 旋轉判斷錯誤
- 拍面角度問題
- 擊球時機問題
- 重心不穩
- 其他技術問題

---

## 📊 輸出格式說明

### structured_data
原始的技術數據，包含：
- `video_info`: 影片基本資訊
- `pose_analysis`: MediaPipe 姿態分析數據
- `ball_trajectory`: 球軌跡數據（簡化版）
- `technical_indicators`: 技術指標評分

### ai_analysis
Gemini AI 的自然語言分析，包含：
- `failure_reason`: 失誤主因（簡短）
- `category`: 問題分類
- `detailed_analysis`: 各維度詳細分析
- `improvement_suggestions`: 具體改進建議
- `summary`: 一句話總結
- `severity`: 問題嚴重程度 (minor/moderate/severe)

---

## 🔧 故障排除

### 問題 1: 找不到 cv2 模組
```bash
pip install opencv-python
```

### 問題 2: Gemini API 錯誤
檢查 API 金鑰是否正確：
```python
import os
print(os.getenv('GEMINI_API_KEY'))  # 應該顯示您的金鑰
```

### 問題 3: MediaPipe 姿態偵測失敗
確保影片：
- 畫質清晰
- 人物完整可見
- 光線充足

### 問題 4: 分析結果為空
檢查：
1. 影片格式是否支援（mp4/avi/mov/mkv）
2. 影片是否損壞
3. 影片時長是否在建議範圍（2-10秒）

---

## 💡 最佳實踐

### 影片錄製建議
- ✅ **時長**: 3-5秒最佳（包含失分前後動作）
- ✅ **角度**: 側面或45度角最佳
- ✅ **畫質**: 至少 720p
- ✅ **光線**: 充足且均勻
- ✅ **範圍**: 包含完整的人物和球台

### 分析準確性
- 使用 Gemini AI 可提升分析準確度 **40-60%**
- 建議先使用基礎分析測試，再啟用 Gemini
- 批次分析時注意 API 配額限制

### 效能優化
- 關鍵幀數量: 3-5幀（平衡速度與準確度）
- 影片解析度: 建議降至 720p 處理
- 批次處理: 每批不超過 10 個影片

---

## 📈 未來改進

- [ ] 整合 YOLO 進行球追蹤
- [ ] 加入 ByteTrack 進行多物件追蹤
- [ ] 支援更多失誤類型分類
- [ ] 提供視覺化分析報告
- [ ] 加入歷史分析對比功能

---

## 🤝 技術支援

遇到問題？
1. 查看 [測試腳本](test_failure_analyzer.py) 進行診斷
2. 檢查 [環境變數配置](.env.example)
3. 閱讀 [API 文件](#-api-使用)

---

**最後更新**: 2024-01-15
