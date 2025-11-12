FROM python:3.11-slim

WORKDIR /app

# 安裝系統依賴 (OpenCV 和 MediaPipe 需要的庫)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    libgomp1 \
    libgthread-2.0-0 \
    libavcodec-dev \
    libavformat-dev \
    libswscale-dev \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# 複製依賴檔案
COPY requirements.txt .

# 安裝 Python 依賴
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用程式碼
COPY . .

# 創建數據目錄
RUN mkdir -p data

# 暴露端口
EXPOSE 5000

# 啟動應用
CMD ["python", "app.py"]
