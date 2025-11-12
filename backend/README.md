# 桌球排名後端 API

## 安裝

```bash
pip install -r requirements.txt
```

## 啟動服務

```bash
python app.py
```

服務將運行在 http://localhost:5000

## API 端點

- `GET /api/rankings/<category>` - 取得特定類別排名
  - category: SEN_SINGLES, WOM_SINGLES, SEN_DOUBLES, WOM_DOUBLES
  
- `GET /api/rankings` - 取得所有排名

- `POST /api/update` - 手動觸發資料更新

- `GET /api/health` - 健康檢查

## 自動更新

系統會每小時自動更新一次資料。
