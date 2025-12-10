# ==============================================
# Table Tennis AI - PowerShell 部署腳本
# ==============================================

param(
    [Parameter(Position=0)]
    [ValidateSet("dev", "deploy", "stop", "logs", "clean", "health", "help")]
    [string]$Command = "help"
)

# 顏色函數
function Write-Header($message) {
    Write-Host "========================================" -ForegroundColor Blue
    Write-Host $message -ForegroundColor Blue
    Write-Host "========================================" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

# 檢查 Docker
function Test-Docker {
    try {
        docker info 2>&1 | Out-Null
        Write-Success "Docker 環境正常"
        return $true
    }
    catch {
        Write-Error "Docker 未安裝或未運行"
        return $false
    }
}

# 檢查環境變數
function Test-Env {
    if (-not (Test-Path ".env")) {
        Write-Warning ".env 檔案不存在"
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Success "已從 .env.example 建立 .env"
        }
    }
}

# 開發環境
function Start-Dev {
    Write-Header "🔧 啟動開發環境"
    
    if (-not (Test-Docker)) { return }
    Test-Env
    
    docker compose -f docker-compose.dev.yml up --build
}

# 生產環境部署
function Start-Deploy {
    Write-Header "🚀 部署生產環境"
    
    if (-not (Test-Docker)) { return }
    Test-Env
    
    docker compose -f docker-compose.optimized.yml up --build -d
    
    Write-Success "部署完成！"
    Write-Host ""
    Write-Host "🌐 前端: http://localhost:3000"
    Write-Host "📡 後端: http://localhost:5000"
}

# 停止服務
function Stop-Services {
    Write-Header "🛑 停止服務"
    
    docker compose -f docker-compose.optimized.yml down 2>$null
    docker compose -f docker-compose.dev.yml down 2>$null
    
    Write-Success "服務已停止"
}

# 查看日誌
function Get-Logs {
    docker compose -f docker-compose.optimized.yml logs -f
}

# 清理
function Clear-Docker {
    Write-Header "🧹 清理 Docker 資源"
    
    Stop-Services
    
    docker system prune -f
    docker volume prune -f
    
    Write-Success "清理完成"
}

# 健康檢查
function Test-Health {
    Write-Header "🏥 健康檢查"
    
    Write-Host "檢查後端..."
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
        if ($response.status -eq "ok") {
            Write-Success "後端服務正常"
        }
    }
    catch {
        Write-Error "後端服務異常"
    }
    
    Write-Host "檢查前端..."
    try {
        Invoke-WebRequest -Uri "http://localhost:3000" -Method Get | Out-Null
        Write-Success "前端服務正常"
    }
    catch {
        Write-Error "前端服務異常"
    }
}

# 顯示幫助
function Show-Help {
    Write-Host "Table Tennis AI 部署腳本" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "用法: .\deploy.ps1 [命令]"
    Write-Host ""
    Write-Host "命令:"
    Write-Host "  dev      啟動開發環境（支援熱重載）"
    Write-Host "  deploy   部署生產環境"
    Write-Host "  stop     停止所有服務"
    Write-Host "  logs     查看服務日誌"
    Write-Host "  clean    清理 Docker 資源"
    Write-Host "  health   健康檢查"
    Write-Host "  help     顯示此幫助訊息"
}

# 主邏輯
switch ($Command) {
    "dev"    { Start-Dev }
    "deploy" { Start-Deploy }
    "stop"   { Stop-Services }
    "logs"   { Get-Logs }
    "clean"  { Clear-Docker }
    "health" { Test-Health }
    "help"   { Show-Help }
    default  { Show-Help }
}
