#!/bin/bash
# ==============================================
# Table Tennis AI - 部署腳本
# ==============================================

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數定義
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 檢查 Docker
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安裝，請先安裝 Docker"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker 服務未運行"
        exit 1
    fi
    
    print_success "Docker 環境正常"
}

# 檢查環境變數
check_env() {
    if [ ! -f ".env" ]; then
        print_warning ".env 檔案不存在，將使用預設配置"
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_success "已從 .env.example 建立 .env"
        fi
    fi
}

# 開發環境啟動
dev() {
    print_header "🔧 啟動開發環境"
    check_docker
    check_env
    
    docker compose -f docker-compose.dev.yml up --build
}

# 生產環境部署
deploy() {
    print_header "🚀 部署生產環境"
    check_docker
    check_env
    
    # 構建並啟動
    docker compose -f docker-compose.optimized.yml up --build -d
    
    print_success "部署完成！"
    echo ""
    echo "🌐 前端: http://localhost:3000"
    echo "📡 後端: http://localhost:5000"
}

# 停止服務
stop() {
    print_header "🛑 停止服務"
    
    docker compose -f docker-compose.optimized.yml down 2>/dev/null || true
    docker compose -f docker-compose.dev.yml down 2>/dev/null || true
    
    print_success "服務已停止"
}

# 查看日誌
logs() {
    docker compose -f docker-compose.optimized.yml logs -f
}

# 清理
clean() {
    print_header "🧹 清理 Docker 資源"
    
    stop
    
    docker system prune -f
    docker volume prune -f
    
    print_success "清理完成"
}

# 健康檢查
health() {
    print_header "🏥 健康檢查"
    
    echo "檢查後端..."
    if curl -s http://localhost:5000/health | grep -q "ok"; then
        print_success "後端服務正常"
    else
        print_error "後端服務異常"
    fi
    
    echo "檢查前端..."
    if curl -s http://localhost:3000 > /dev/null; then
        print_success "前端服務正常"
    else
        print_error "前端服務異常"
    fi
}

# 顯示幫助
help() {
    echo "Table Tennis AI 部署腳本"
    echo ""
    echo "用法: ./deploy.sh [命令]"
    echo ""
    echo "命令:"
    echo "  dev      啟動開發環境（支援熱重載）"
    echo "  deploy   部署生產環境"
    echo "  stop     停止所有服務"
    echo "  logs     查看服務日誌"
    echo "  clean    清理 Docker 資源"
    echo "  health   健康檢查"
    echo "  help     顯示此幫助訊息"
}

# 主邏輯
case "$1" in
    dev)
        dev
        ;;
    deploy)
        deploy
        ;;
    stop)
        stop
        ;;
    logs)
        logs
        ;;
    clean)
        clean
        ;;
    health)
        health
        ;;
    help|*)
        help
        ;;
esac
