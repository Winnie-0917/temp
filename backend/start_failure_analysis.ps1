# ===================================
# 失誤分析系統 - 快速啟動腳本
# ===================================

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  桌球失誤分析系統 - 快速啟動" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# 檢查是否在 backend 目錄
if (-Not (Test-Path "requirements.txt")) {
    Write-Host "❌ 錯誤: 請在 backend 目錄下執行此腳本" -ForegroundColor Red
    Write-Host "   cd backend" -ForegroundColor Yellow
    Write-Host "   ./start_failure_analysis.ps1" -ForegroundColor Yellow
    exit 1
}

# 步驟 1: 檢查 Python
Write-Host "📦 步驟 1: 檢查 Python 環境..." -ForegroundColor Yellow
python --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 未找到 Python，請先安裝 Python 3.8+" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Python 已安裝" -ForegroundColor Green
Write-Host ""

# 步驟 2: 安裝依賴
Write-Host "📦 步驟 2: 安裝依賴套件..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 依賴安裝失敗" -ForegroundColor Red
    exit 1
}
Write-Host "✅ 依賴安裝完成" -ForegroundColor Green
Write-Host ""

# 步驟 3: 檢查 .env 檔案
Write-Host "🔑 步驟 3: 檢查環境變數設定..." -ForegroundColor Yellow
if (-Not (Test-Path ".env")) {
    Write-Host "⚠️  未找到 .env 檔案" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "是否要建立 .env 檔案？(Y/N)" -ForegroundColor Cyan
    $createEnv = Read-Host
    
    if ($createEnv -eq "Y" -or $createEnv -eq "y") {
        Write-Host ""
        Write-Host "請輸入您的 Gemini API 金鑰:" -ForegroundColor Cyan
        Write-Host "(可在 https://aistudio.google.com/app/apikey 取得)" -ForegroundColor Gray
        $apiKey = Read-Host
        
        @"
# Google Gemini API 金鑰
GEMINI_API_KEY=$apiKey

# Flask 配置
FLASK_ENV=development
PORT=5000
"@ | Out-File -FilePath ".env" -Encoding utf8
        
        Write-Host "✅ .env 檔案已建立" -ForegroundColor Green
    } else {
        Write-Host "⚠️  未建立 .env 檔案，將使用基礎分析模式（不含 Gemini AI）" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ .env 檔案已存在" -ForegroundColor Green
}
Write-Host ""

# 步驟 4: 測試系統
Write-Host "🧪 步驟 4: 測試失誤分析系統..." -ForegroundColor Yellow
python test_failure_analyzer.py
Write-Host ""

# 步驟 5: 啟動伺服器
Write-Host "🚀 步驟 5: 啟動 Flask 伺服器..." -ForegroundColor Yellow
Write-Host ""
Write-Host "伺服器啟動後，請訪問:" -ForegroundColor Cyan
Write-Host "  http://localhost:5000/failure_analysis.html" -ForegroundColor Green
Write-Host ""
Write-Host "按 Ctrl+C 停止伺服器" -ForegroundColor Gray
Write-Host ""

python app.py
