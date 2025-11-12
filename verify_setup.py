"""
快速驗證腳本 - 測試失誤分析系統的所有組件
"""
import os
import sys

def print_header(title):
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60 + "\n")

def check_file_exists(filepath, description):
    """檢查檔案是否存在"""
    if os.path.exists(filepath):
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description} 不存在: {filepath}")
        return False

def main():
    print_header("失誤分析系統 - 檔案驗證")
    
    files_to_check = [
        ("backend/failure_analyzer.py", "失誤分析模組"),
        ("backend/test_failure_analyzer.py", "測試腳本"),
        ("backend/FAILURE_ANALYSIS_GUIDE.md", "使用指南"),
        ("backend/.env.example", "環境變數範例"),
        ("backend/start_failure_analysis.ps1", "啟動腳本"),
        ("backend/requirements.txt", "依賴清單"),
        ("backend/app.py", "Flask 應用"),
        ("failure_analysis.html", "測試網頁"),
        ("README.MD", "專案說明")
    ]
    
    all_exist = True
    for filepath, description in files_to_check:
        if not check_file_exists(filepath, description):
            all_exist = False
    
    print_header("依賴檢查")
    
    # 檢查 requirements.txt 內容
    print("檢查 requirements.txt 中的新依賴...")
    try:
        with open("backend/requirements.txt", "r", encoding="utf-8") as f:
            content = f.read()
            
        required_packages = [
            "google-generativeai",
            "pillow",
            "python-dotenv"
        ]
        
        for package in required_packages:
            if package in content.lower():
                print(f"✅ {package} 已加入 requirements.txt")
            else:
                print(f"❌ {package} 未在 requirements.txt 中")
                all_exist = False
    except Exception as e:
        print(f"❌ 無法讀取 requirements.txt: {e}")
        all_exist = False
    
    print_header("API 端點檢查")
    
    # 檢查 app.py 中的新 API
    print("檢查 app.py 中的 API 端點...")
    try:
        with open("backend/app.py", "r", encoding="utf-8") as f:
            content = f.read()
        
        endpoints = [
            "/api/analyze-failure",
            "/api/analyze-failure/batch",
            "/api/analyze-failure/config"
        ]
        
        for endpoint in endpoints:
            if endpoint in content:
                print(f"✅ API 端點已新增: {endpoint}")
            else:
                print(f"❌ API 端點缺失: {endpoint}")
                all_exist = False
    except Exception as e:
        print(f"❌ 無法讀取 app.py: {e}")
        all_exist = False
    
    print_header("README 更新檢查")
    
    # 檢查 README 是否包含失誤分析說明
    try:
        with open("README.MD", "r", encoding="utf-8") as f:
            content = f.read()
        
        keywords = [
            "失誤分析",
            "Gemini",
            "FAILURE_ANALYSIS_GUIDE"
        ]
        
        for keyword in keywords:
            if keyword in content:
                print(f"✅ README 包含關鍵字: {keyword}")
            else:
                print(f"⚠️  README 缺少關鍵字: {keyword}")
    except Exception as e:
        print(f"❌ 無法讀取 README.MD: {e}")
    
    print_header("驗證總結")
    
    if all_exist:
        print("✅ 所有檔案和配置都已正確設定！")
        print("\n📋 下一步:")
        print("1. cd backend")
        print("2. 複製 .env.example 為 .env，並填入 GEMINI_API_KEY")
        print("3. pip install -r requirements.txt")
        print("4. python test_failure_analyzer.py （測試基本功能）")
        print("5. python app.py （啟動伺服器）")
        print("6. 訪問 http://localhost:5000/failure_analysis.html")
    else:
        print("❌ 部分檔案或配置缺失，請檢查上方錯誤訊息")
    
    print("\n" + "="*60 + "\n")

if __name__ == "__main__":
    main()
