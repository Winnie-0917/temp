import requests
import json

headers = {
    'accept': 'application/json',
    'origin': 'https://www.worldtabletennis.com',
    'referer': 'https://www.worldtabletennis.com/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
}

def test_player_details(ittf_id):
    # Try different endpoints
    endpoints = [
        f'https://wtt-web-frontdoor-withoutcache-cqakg0andqf5hchn.a01.azurefd.net/player/{ittf_id}',
        f'https://wtt-web-frontdoor-withoutcache-cqakg0andqf5hchn.a01.azurefd.net/player/{ittf_id}/details',
        f'https://wtt-web-frontdoor-withoutcache-cqakg0andqf5hchn.a01.azurefd.net/common/player/{ittf_id}',
        f'https://wtt-web-frontdoor-withoutcache-cqakg0andqf5hchn.a01.azurefd.net/ranking/player/{ittf_id}',
    ]
    
    for url in endpoints:
        try:
            print(f"Testing {url}...")
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                print(f"SUCCESS: {url}")
                print(json.dumps(response.json(), indent=2)[:500])
                return
            else:
                print(f"Failed: {response.status_code}")
        except Exception as e:
            print(f"Error: {e}")

# Test with Wang Chuqin (121558) or Lin Shidong (137237)
test_player_details('121558')
