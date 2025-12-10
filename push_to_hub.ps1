param(
    [Parameter(Mandatory=$true)]
    [string]$DockerUsername
)

$ErrorActionPreference = "Stop"

Write-Host "=== Table Tennis AI Docker Hub Deploy Script ==="
Write-Host "Target Docker Hub User: $DockerUsername"

# 1. Login to Docker Hub
Write-Host "`n[1/5] Logging in to Docker Hub..."
docker login
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker login failed."
}

# 2. Build Images
Write-Host "`n[2/5] Building latest images..."
docker-compose build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed."
}

# 3. Tag Images
Write-Host "`n[3/5] Tagging images..."
# Note: Docker Compose v2 uses project name based on folder, usually 'table-tennis-ai'
# We check if the images exist
$backendImage = "table-tennis-ai-backend"
$frontendImage = "table-tennis-ai-frontend"

if (-not (docker images -q $backendImage)) {
    Write-Warning "Image $backendImage not found. Trying table-tennis-ai_backend..."
    $backendImage = "table-tennis-ai_backend"
}

docker tag "$backendImage`:latest" "$DockerUsername/tabletennis-backend:latest"
docker tag "$frontendImage`:latest" "$DockerUsername/tabletennis-frontend:latest"

# 4. Push Images
Write-Host "`n[4/5] Pushing images to Docker Hub..."
Write-Host "Pushing backend..."
docker push "$DockerUsername/tabletennis-backend:latest"
Write-Host "Pushing frontend..."
docker push "$DockerUsername/tabletennis-frontend:latest"

# 5. Update K8s Manifests
Write-Host "`n[5/5] Updating Kubernetes manifests..."

$backendFile = "k8s\backend.yaml"
$frontendFile = "k8s\frontend.yaml"

# Update Backend Image
$backendContent = Get-Content $backendFile -Raw
$backendContent = $backendContent -replace 'image: .*tabletennis-backend:latest', "image: $DockerUsername/tabletennis-backend:latest"
$backendContent = $backendContent -replace 'imagePullPolicy: IfNotPresent', "imagePullPolicy: Always"
Set-Content -Path $backendFile -Value $backendContent

# Update Frontend Image
$frontendContent = Get-Content $frontendFile -Raw
$frontendContent = $frontendContent -replace 'image: .*tabletennis-frontend:latest', "image: $DockerUsername/tabletennis-frontend:latest"
$frontendContent = $frontendContent -replace 'imagePullPolicy: IfNotPresent', "imagePullPolicy: Always"
Set-Content -Path $frontendFile -Value $frontendContent

Write-Host "`n✅ Success! Images pushed and K8s manifests updated."
Write-Host "To deploy to Kubernetes, run:"
Write-Host "kubectl apply -f k8s/"
