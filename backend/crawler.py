import requests
import json
import os
from datetime import datetime

class TableTennisRankingCrawler:
    def __init__(self):
        self.headers = {
            'accept': 'application/json',
            'accept-language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'content-type': 'application/json',
            'origin': 'https://www.worldtabletennis.com',
            'priority': 'u=1, i',
            'referer': 'https://www.worldtabletennis.com/',
            'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
            'sec-ch-ua-mobile': '?1',
            'sec-ch-ua-platform': '"Android"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'cross-site',
            'user-agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36',
        }
        self.data_dir = os.path.join(os.path.dirname(__file__), 'data')
        os.makedirs(self.data_dir, exist_ok=True)
    
    def fetch_ranking(self, category='SEN_SINGLES'):
        """
        抓取桌球排名資料
        category: SEN_SINGLES (男單), SEN_DOUBLES (男雙), 
                  WOM_SINGLES (女單), WOM_DOUBLES (女雙)
        """
        params = {
            'q': str(datetime.now().timestamp()),
        }
        
        url = f'https://wtt-web-frontdoor-withoutcache-cqakg0andqf5hchn.a01.azurefd.net/ranking/{category}.json'
        
        try:
            response = requests.get(url, params=params, headers=self.headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # 儲存資料
            self.save_data(category, data)
            return data
        except Exception as e:
            print(f"錯誤: {category} 抓取失敗 - {str(e)}")
            return None
    
    def save_data(self, category, data):
        """儲存資料到 JSON 檔案"""
        file_path = os.path.join(self.data_dir, f'{category}.json')
        
        # 加上更新時間
        data_with_timestamp = {
            'updated_at': datetime.now().isoformat(),
            'category': category,
            'data': data
        }
        
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data_with_timestamp, f, ensure_ascii=False, indent=2)
        
        print(f"✓ {category} 資料已儲存")
    
    def load_data(self, category='SEN_SINGLES'):
        """讀取已儲存的資料"""
        file_path = os.path.join(self.data_dir, f'{category}.json')
        
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return None
    
    def update_all_rankings(self):
        """更新所有排名資料"""
        categories = ['SEN_SINGLES', 'SEN_DOUBLES']
        results = {}
        
        for category in categories:
            print(f"正在抓取 {category}...")
            data = self.fetch_ranking(category)
            results[category] = 'success' if data else 'failed'
        
        return results

if __name__ == '__main__':
    crawler = TableTennisRankingCrawler()
    results = crawler.update_all_rankings()
    print("\n更新結果:", results)
