# Kubernetes 部署指南

本指南將協助您將 Table Tennis AI 部署到 Kubernetes (K8s) 環境。

## 1. 前置準備

確保您已安裝以下工具：
- Docker Desktop (開啟 Kubernetes) 或 Minikube
- kubectl
- PowerShell

## 2. 推送映像檔到 Docker Hub

為了讓 K8s 能夠拉取您的映像檔，您需要將它們推送到 Docker Hub。

1. 執行我們準備好的腳本 (請將 `your_username` 替換為您的 Docker Hub 帳號)：

```powershell
.\push_to_hub.ps1 -DockerUsername "your_username"
```

此腳本會自動：
- 登入 Docker Hub
- 重新構建並標記映像檔
- 推送到 Docker Hub
- 自動更新 `k8s/backend.yaml` 和 `k8s/frontend.yaml` 中的映像檔名稱

## 3. 部署到 Kubernetes

### 步驟 1: 設定 API Key Secret

編輯 `k8s/secret.yaml`，填入您的 Gemini API Key：

```yaml
stringData:
  gemini-api-key: "您的_REAL_API_KEY"
```

然後建立 Secret：

```bash
kubectl apply -f k8s/secret.yaml
```

### 步驟 2: 部署應用程式

應用所有 K8s 設定檔：

```bash
kubectl apply -f k8s/
```

### 步驟 3: 驗證部署

查看 Pod 狀態：

```bash
kubectl get pods
```

查看服務狀態：

```bash
kubectl get services
```

## 4. 本地測試 (Docker Desktop K8s)

如果您使用 Docker Desktop 的 Kubernetes，服務應該可以通過 `localhost` 訪問：

- 前端: http://localhost:3000
- 後端 API: http://localhost:5000

如果使用 Minikube，您需要執行：

```bash
minikube tunnel
```
或者使用 `minikube service frontend` 來獲取訪問 URL。

## 5. 常見問題

**Q: Pod 狀態顯示 ImagePullBackOff?**
A: 請檢查 `k8s/backend.yaml` 和 `k8s/frontend.yaml` 中的 image 名稱是否正確，以及是否已成功推送到 Docker Hub。

**Q: 無法連接後端?**
A: 確保 Secret 已正確建立，且 API Key 有效。可以使用 `kubectl logs <backend-pod-name>` 查看日誌。
