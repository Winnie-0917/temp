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
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 升級 pip
RUN pip install --upgrade pip

# 複製並安裝大型依賴 (分層快取)
COPY requirements-heavy.txt .
RUN pip install --no-cache-dir -r requirements-heavy.txt

# 複製並安裝其餘依賴
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 複製應用程式碼
COPY . .

# 創建數據目錄
RUN mkdir -p data uploads

# 暴露端口
EXPOSE 5000

# 啟動應用
CMD ["python", "app.py"]
