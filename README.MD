# 🏓 Table Tennis AI Platform

一個整合**世界排名顯示**與**動作分析**的桌球智能平台，採用明亮舒適的現代化 UI 設計。

## ✨ 功能特色

### 📊 排名系統
- **即時 WTT 排名**：自動抓取世界桌球排名數據
- **多類別支援**：男子單打、男子雙打
- **視覺化統計**：選手數量、國家分布、前二十名展示
- **自動更新**：每小時自動更新排名數據

### 🎥 動作分析
- **AI 動作識別**：基於 MediaPipe + LSTM 的動作品質分析
- **三級評分**：優良 / 一般 / 不良
- **信心度顯示**：機率分布與視覺化
- **即時分析**：上傳影片立即獲得反饋

### � 失誤分析（NEW!）
- **Gemini AI 整合**：使用 Google Gemini 進行深度分析
- **自然語言建議**：專業教練級的改進建議
- **多維度分析**：站位、拍面角度、身體平衡、擊球時機
- **結構化數據**：完整的技術指標與姿態數據
- **雙模式支援**：基礎分析 / AI 深度分析

### �🧠 模型訓練
- **網頁訓練介面**：無需命令列，直接在瀏覽器訓練
- **彈性配置**：模型類型、訓練輪數、批次大小、學習率
- **即時進度**：訓練進度、準確率、損失值即時顯示
- **資料擴增**：支援 1-5 倍資料擴增

## 🎨 設計特色

### 明亮舒適配色
- **首頁**：琥珀橙色調（Amber-Orange） 🍊
- **分析頁**：藍紫色調（Blue-Indigo） 💙
- **訓練頁**：翡翠綠色調（Emerald-Teal） 💚

### 現代化 UI
- 毛玻璃效果（Backdrop Blur）
- 漸層按鈕與進度條
- 流暢動畫與過渡效果
- 響應式設計

## 🚀 快速開始

### 前置需求
- Docker & Docker Compose
- Git

### 安裝步驟

1. **克隆專案**
```bash
git clone https://github.com/hank31169638/cloud_tennis.git
cd cloud_tennis
```

2. **啟動服務**
```bash
docker-compose up -d
```

3. **訪問平台**
- 前端：http://localhost:3000
- 後端 API：http://localhost:5000

### 停止服務
```bash
docker-compose down
```

## 📁 專案結構

```
Table-tennis-AI/
├── backend/                    # Flask 後端
│   ├── app.py                 # 主應用程式
│   ├── crawler.py             # WTT 排名爬蟲
│   ├── failure_analyzer.py    # 失誤分析模組（Gemini AI）🆕
│   ├── train_web.py           # 網頁訓練腳本
│   ├── train_optimized.py     # 優化訓練腳本
│   ├── skeleton.py            # MediaPipe 骨架提取
│   ├── user_movid_predict.py  # 影片預測
│   ├── test_failure_analyzer.py # 失誤分析測試腳本 🆕
│   ├── requirements.txt       # Python 依賴
│   ├── .env.example           # 環境變數範例 🆕
│   ├── FAILURE_ANALYSIS_GUIDE.md # 失誤分析使用指南 🆕
│   ├── Dockerfile             # 後端容器配置
│   ├── good_input_movid/      # 優良動作訓練影片
│   ├── normal_input_movid/    # 一般動作訓練影片
│   ├── bad_input_movid/       # 不良動作訓練影片
│   └── data/                  # 排名數據緩存
│
├── frontend/                   # Next.js 前端
│   ├── app/
│   │   ├── page.tsx           # 首頁（排名顯示）
│   │   ├── analyze/page.tsx   # 分析頁面
│   │   ├── train/page.tsx     # 訓練頁面
│   │   ├── layout.tsx         # 佈局組件
│   │   └── components/        # React 組件
│   ├── package.json           # Node.js 依賴
│   └── Dockerfile             # 前端容器配置
│
├── failure_analysis.html       # 失誤分析測試頁面 🆕
└── docker-compose.yml          # 容器編排配置
```

## 🛠️ 技術棧

### 後端
- **框架**：Flask 3.0.0
- **機器學習**：TensorFlow 2.13+, MediaPipe 0.10+
- **AI 分析**：Google Generative AI (Gemini 1.5 Pro) 🆕
- **影像處理**：OpenCV 4.8+, Pillow 10.0+
- **排程**：APScheduler
- **容器**：Docker

### 前端
- **框架**：Next.js 15
- **語言**：TypeScript
- **樣式**：Tailwind CSS
- **UI 組件**：React 18+

### 機器學習
- **架構**：LSTM (150 frames × 23 landmarks × 3 coords)
- **標準化**：StandardScaler
- **分類**：3 類別（good / normal / bad）

### AI 分析（NEW!）
- **模型**：Gemini 1.5 Pro / 2.5 Pro
- **能力**：多模態分析（影片 + 結構化數據）
- **輸出**：自然語言 + JSON 結構化建議

## 📖 使用指南

### 1. 查看排名
- 訪問首頁即可查看最新排名
- 切換類別按鈕選擇單打/雙打
- 點擊「更新」按鈕手動更新數據

### 2. 分析動作
1. 點擊「🎥 分析」按鈕進入分析頁面
2. 上傳或拖曳影片檔案（支援 MP4, AVI, MOV）
3. 點擊「開始分析」
4. 查看分析結果與建議

### 3. 失誤分析（NEW!）🤖
1. 訪問 `http://localhost:5000/failure_analysis.html`
2. 上傳 3-5 秒的失分影片片段
3. 選擇是否使用 Gemini AI 深度分析
4. 獲得專業的失誤原因分析與改進建議

**配置 Gemini API：**
```bash
cd backend
cp .env.example .env
# 編輯 .env，填入您的 GEMINI_API_KEY
```

**詳細說明：** 參考 [backend/FAILURE_ANALYSIS_GUIDE.md](backend/FAILURE_ANALYSIS_GUIDE.md)

### 4. 訓練模型
1. 點擊「🧠 訓練」按鈕進入訓練頁面
2. 配置訓練參數（模型類型、輪數、批次大小等）
3. 開啟資料擴增（可選）
4. 點擊「開始訓練」
5. 即時監控訓練進度

### 準備訓練資料
將影片放入對應資料夾：
- `backend/good_input_movid/` - 優良動作影片
- `backend/normal_input_movid/` - 一般動作影片
- `backend/bad_input_movid/` - 不良動作影片

**最低要求**：每類至少 10 個影片（共 30 個）  
**建議數量**：每類 30+ 個影片（共 90+ 個）

## 🔧 開發指南

### 本地開發（後端）
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 本地開發（前端）
```bash
cd frontend
npm install
npm run dev
```

### 重建容器
```bash
docker-compose up --build -d
```

### 查看日誌
```bash
docker-compose logs -f
```

## 📝 API 文檔

### 排名 API
- `GET /api/rankings` - 獲取所有排名
- `GET /api/rankings/<category>` - 獲取特定類別排名
- `POST /api/update` - 手動更新排名數據

### 分析 API
- `POST /analyze` - 上傳影片進行分析
  - 參數：`file` (影片檔案)
  - 返回：`{ classification, confidence, probabilities }`

### 失誤分析 API（NEW!）🆕
- `POST /api/analyze-failure` - 單一影片失誤分析
  - 參數：`file` (影片檔案), `use_gemini` (是否使用 Gemini)
  - 返回：`{ success, analysis: { structured_data, ai_analysis } }`
  
- `POST /api/analyze-failure/batch` - 批次失誤分析
  - 參數：`files` (多個影片), `use_gemini`
  - 返回：`{ total, results: [...] }`
  
- `GET /api/analyze-failure/config` - 取得分析配置
  - 返回：支援格式、Gemini 可用性等

### 訓練 API
- `POST /api/train` - 啟動訓練任務
- `GET /api/train/status/<task_id>` - 查詢訓練狀態

## 🎯 未來計畫

- [ ] 支援更多排名類別（女子單打、女子雙打、混雙）
- [ ] 增加歷史排名趨勢圖
- [ ] 失誤分析整合至前端（Next.js 頁面）🆕
- [ ] YOLO + ByteTrack 球追蹤整合 🆕
- [ ] 影片分析結果視覺化報告 🆕
- [ ] 模型效能優化與量化
- [ ] 多語言支援
- [ ] 行動裝置 APP

## 🤝 貢獻

歡迎提交 Issue 或 Pull Request！

## 📄 授權

MIT License

## 👨‍💻 作者

Hank - [GitHub](https://github.com/hank31169638)

## 🙏 致謝

- World Table Tennis (WTT) - 排名數據來源
- MediaPipe - 姿態估計
- Google Gemini - AI 深度分析 🆕
- TensorFlow - 深度學習框架
- TensorFlow - 機器學習框架
- Next.js - 前端框架

---

**⭐ 如果這個專案對你有幫助，請給個星星！**
