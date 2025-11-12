"""
快速測試失誤分析 API
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def test_config():
    """測試配置端點"""
    print("🧪 測試 1: 檢查配置...")
    try:
        response = requests.get(f"{BASE_URL}/api/analyze-failure/config")
        if response.status_code == 200:
            config = response.json()
            print(f"✅ 配置端點正常")
            print(f"   Gemini 可用: {config.get('gemini_available')}")
            print(f"   支援格式: {', '.join(config.get('supported_formats', []))}")
            return True
        else:
            print(f"❌ 配置端點錯誤: {response.status_code}")
            print(f"   回應: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 無法連接到伺服器: {e}")
        return False

def test_health():
    """測試健康檢查"""
    print("\n🧪 測試 2: 健康檢查...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ 伺服器運行正常")
            return True
        else:
            print(f"❌ 健康檢查失敗: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 無法連接: {e}")
        return False

def test_rankings():
    """測試排名 API"""
    print("\n🧪 測試 3: 排名 API...")
    try:
        response = requests.get(f"{BASE_URL}/api/rankings/SEN_SINGLES")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 排名 API 正常")
            if 'data' in data and 'Result' in data['data']:
                print(f"   選手數量: {len(data['data']['Result'])}")
            return True
        else:
            print(f"❌ 排名 API 錯誤: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 請求失敗: {e}")
        return False

if __name__ == "__main__":
    print("="*60)
    print("      失誤分析 API 快速測試")
    print("="*60)
    print()
    
    results = []
    results.append(("健康檢查", test_health()))
    results.append(("排名 API", test_rankings()))
    results.append(("失誤分析配置", test_config()))
    
    print("\n" + "="*60)
    print("測試摘要")
    print("="*60)
    
    for name, passed in results:
        status = "✅ 通過" if passed else "❌ 失敗"
        print(f"{status}: {name}")
    
    total_passed = sum(1 for _, p in results if p)
    print(f"\n總計: {total_passed}/{len(results)} 通過")
    print("="*60)
    
    if total_passed == len(results):
        print("\n🎉 所有測試通過！失誤分析系統已就緒。")
        print("\n📍 測試頁面:")
        print(f"   {BASE_URL}/failure_analysis.html")
    else:
        print("\n⚠️  部分測試失敗，請檢查容器日誌:")
        print("   docker logs tabletennis-backend")
