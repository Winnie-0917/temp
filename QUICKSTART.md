# 🏓 Table Tennis AI - 快速開始指南

## 📋 目錄
1. [系統需求](#系統需求)
2. [快速部署](#快速部署)
3. [開發環境](#開發環境)
4. [雲端部署](#雲端部署)

---

## 系統需求

### 必要軟體
- **Docker Desktop** 4.0+
- **Git**

### 可選軟體（開發用）
- Python 3.11+
- Node.js 20+

---

## 快速部署

### Windows

```powershell
# 1. 克隆專案
git clone https://github.com/Winnie-0917/Table-tennis-AI.git
cd Table-tennis-AI

# 2. 配置環境變數
Copy-Item backend\.env.example backend\.env
# 編輯 backend\.env 填入 GEMINI_API_KEY

# 3. 一鍵部署
.\deploy.ps1 deploy

# 4. 訪問服務
# 前端: http://localhost:3000
# 後端: http://localhost:5000
```

### Linux / macOS

```bash
# 1. 克隆專案
git clone https://github.com/Winnie-0917/Table-tennis-AI.git
cd Table-tennis-AI

# 2. 配置環境變數
cp backend/.env.example backend/.env
# 編輯 backend/.env 填入 GEMINI_API_KEY

# 3. 給予執行權限
chmod +x deploy.sh

# 4. 一鍵部署
./deploy.sh deploy

# 5. 訪問服務
# 前端: http://localhost:3000
# 後端: http://localhost:5000
```

---

## 開發環境

### 啟動開發模式

開發模式支援熱重載，修改程式碼後自動更新。

```powershell
# Windows
.\deploy.ps1 dev

# Linux/macOS
./deploy.sh dev
```

### 手動啟動（不使用 Docker）

#### 後端
```powershell
cd backend
pip install -r requirements.txt
python app_new.py
```

#### 前端
```powershell
cd frontend
npm install
npm run dev
```

---

## 常用命令

| 命令 | Windows | Linux/macOS | 說明 |
|------|---------|-------------|------|
| 開發模式 | `.\deploy.ps1 dev` | `./deploy.sh dev` | 啟動開發環境 |
| 生產部署 | `.\deploy.ps1 deploy` | `./deploy.sh deploy` | 部署生產環境 |
| 停止服務 | `.\deploy.ps1 stop` | `./deploy.sh stop` | 停止所有服務 |
| 查看日誌 | `.\deploy.ps1 logs` | `./deploy.sh logs` | 查看服務日誌 |
| 健康檢查 | `.\deploy.ps1 health` | `./deploy.sh health` | 檢查服務狀態 |
| 清理資源 | `.\deploy.ps1 clean` | `./deploy.sh clean` | 清理 Docker 資源 |

---

## 雲端部署

### Zeabur 部署

1. 前往 [Zeabur](https://zeabur.com)
2. 建立新專案
3. 從 GitHub 導入此儲存庫
4. 設定環境變數：
   - `GEMINI_API_KEY`: 你的 Gemini API 金鑰
   - `NEXT_PUBLIC_API_URL`: 後端服務 URL
5. 部署完成！

詳細說明請參考 [ZEABUR_DEPLOYMENT.md](./ZEABUR_DEPLOYMENT.md)

### Railway 部署

```bash
# 安裝 Railway CLI
npm install -g @railway/cli

# 登入
railway login

# 初始化專案
railway init

# 部署
railway up
```

### 自建伺服器

```bash
# 在伺服器上
git clone https://github.com/Winnie-0917/Table-tennis-AI.git
cd Table-tennis-AI

# 配置環境
cp backend/.env.example backend/.env
nano backend/.env  # 編輯配置

# 部署（使用優化版 Docker Compose）
docker compose -f docker-compose.optimized.yml up -d
```

---

## 環境變數說明

| 變數名 | 必填 | 預設值 | 說明 |
|--------|------|--------|------|
| `GEMINI_API_KEY` | ✅ | - | Gemini AI API 金鑰 |
| `PORT` | ❌ | 5000 | 後端服務端口 |
| `FRONTEND_PORT` | ❌ | 3000 | 前端服務端口 |
| `FLASK_ENV` | ❌ | production | 環境模式 |
| `DEBUG` | ❌ | false | 除錯模式 |
| `ALLOWED_ORIGINS` | ❌ | * | CORS 允許來源 |
| `SCHEDULER_ENABLED` | ❌ | true | 排程器開關 |

---

## 問題排解

### Docker 啟動失敗
```powershell
# 確認 Docker 正在運行
docker info

# 重新構建映像
docker compose -f docker-compose.optimized.yml build --no-cache
```

### 後端無法連接
```powershell
# 檢查後端日誌
docker logs tabletennis-backend

# 測試健康檢查
curl http://localhost:5000/health
```

### 前端無法訪問 API
```powershell
# 確認環境變數
echo $env:NEXT_PUBLIC_API_URL

# 檢查網路
docker network ls
```

---

## 📚 更多資源

- [架構重構說明](./REFACTORING_GUIDE.md)
- [未來發展規劃](./ROADMAP.md)
- [API 文件](./backend/README.md)
- [失誤分析指南](./backend/FAILURE_ANALYSIS_GUIDE.md)
