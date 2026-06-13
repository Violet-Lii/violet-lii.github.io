# GitHub Pages 部署脚本 - 使用 GitHub API
# 使用方法：在 PowerShell 中运行 .\deploy.ps1
# 首次需要提供 GitHub Personal Access Token (classic)

param(
    [Parameter(Mandatory=$false)]
    [string]$Token,
    
    [Parameter(Mandatory=$false)]
    [string]$Owner = "violet-lii",
    
    [Parameter(Mandatory=$false)]
    [string]$Repo = "violet-lii.github.io",

    [Parameter(Mandatory=$false)]
    [string]$Branch = "main"
)

$ErrorActionPreference = "Stop"

# 如果没有提供 Token，尝试从环境变量读取
if ([string]::IsNullOrEmpty($Token)) {
    $Token = $env:GH_TOKEN
}

if ([string]::IsNullOrEmpty($Token)) {
    Write-Host "❌ 需要 GitHub Personal Access Token" -ForegroundColor Red
    Write-Host ""
    Write-Host "创建 Token 步骤：" -ForegroundColor Yellow
    Write-Host "1. 访问 https://github.com/settings/tokens" -ForegroundColor Cyan
    Write-Host "2. 点击『Generate new token (classic)'" -ForegroundColor Yellow
    Write-Host "3. Note: `e.g. 3d-room-deploy" -ForegroundColor Yellow
    Write-Host "4. Scopes: 勾选 『repo』 (完全控制私有仓库)" -ForegroundColor Yellow
    Write-Host "5. 点击『Generate token』并复制" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "然后重新运行: .\deploy.ps1 -Token 'ghp_xxxx'" -ForegroundColor Green
    exit 1
}

Write-Host "🚀 开始部署 3D 房间到 GitHub Pages..." -ForegroundColor Cyan
Write-Host "   仓库: $Owner/$Repo" -ForegroundColor Gray
Write-Host "   分支: $Branch" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $Token"
    "Accept" = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
}

$baseUrl = "https://api.github.com"
$projectRoot = $PSScriptRoot

# ===== 1. 获取当前仓库分支信息 =====
Write-Host "📡 检查仓库状态..." -ForegroundColor Cyan
try {
    $repoInfo = Invoke-RestMethod -Uri "$baseUrl/repos/$Owner/$Repo" -Headers $headers -Method GET
    Write-Host "   ✅ 仓库存在: $($repoInfo.full_name)" -ForegroundColor Green
    Write-Host "   默认分支: $($repoInfo.default_branch)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ 仓库不存在或无权限: $Owner/$Repo" -ForegroundColor Red
    Write-Host "   请确保仓库已创建且 Token 有权限" -ForegroundColor Yellow
    exit 1
}

# ===== 2. 获取当前分支最新 commit SHA =====
Write-Host "📡 获取分支信息..." -ForegroundColor Cyan
try {
    $branchInfo = Invoke-RestMethod -Uri "$baseUrl/repos/$Owner/$Repo/branches/$Branch" -Headers $headers -Method GET
    $latestCommitSha = $branchInfo.commit.sha
    Write-Host "   最新 commit: $latestCommitSha" -ForegroundColor Gray
} catch {
    Write-Host "   ⚠️ 分支不存在，将创建新分支" -ForegroundColor Yellow
    $latestCommitSha = $null
}

# ===== 3. 获取所有文件并准备上传 =====
Write-Host "📂 扫描项目文件..." -ForegroundColor Cyan
$files = @()
$excludePatterns = @('.git', '.gitignore', 'deploy.ps1', 'README.md', 'HOW_TO_RUN.md', 'TASK_ARTIFACT', 'assets', 'content')

Get-ChildItem -Path $projectRoot -Recurse -File | ForEach-Object {
    $relativePath = $_.FullName.Substring($projectRoot.Length + 1).Replace('\', '/')
    
    $excluded = $false
    foreach ($pattern in $excludePatterns) {
        if ($relativePath -match $pattern -or $_.Name -match $pattern) {
            $excluded = $true
            break
        }
    }
    
    if (-not $excluded) {
        $files += @{
            path = $relativePath
            fullPath = $_.FullName
            size = $_.Length
        }
    }
}

Write-Host "   找到 $($files.Count) 个文件待上传" -ForegroundColor Gray
$files | ForEach-Object { Write-Host "   + $($_.path) ($([Math]::Round($_.size/1KB, 1)) KB)" -ForegroundColor Gray }

# ===== 4. 创建 GitHub Trees =====
Write-Host ""
Write-Host "🌳 构建文件树..." -ForegroundColor Cyan

$treeItems = @()
foreach ($file in $files) {
    $contentBytes = [System.IO.File]::ReadAllBytes($file.fullPath)
    $contentBase64 = [Convert]::ToBase64String($contentBytes)
    
    $blob = @{
        path = $file.path
        mode = "100644"
        type = "blob"
        content = [System.Text.Encoding]::UTF8.GetString($contentBytes)
        encoding = "utf-8"
    }
    $treeItems += $blob
}

# ===== 5. 获取当前 tree SHA =====
$currentTreeSha = $null
if ($latestCommitSha) {
    try {
        $commitUrl = "$baseUrl/repos/$Owner/$Repo/git/commits/$latestCommitSha"
        $commitInfo = Invoke-RestMethod -Uri $commitUrl -Headers $headers -Method GET
        $currentTreeSha = $commitInfo.tree.sha
        Write-Host "   当前 tree SHA: $currentTreeSha" -ForegroundColor Gray
    } catch {
        Write-Host "   ⚠️ 无法获取当前 tree" -ForegroundColor Yellow
    }
}

# ===== 6. 为每个文件创建 blob 并获取 SHA =====
Write-Host ""
Write-Host "📦 上传文件到 GitHub..." -ForegroundColor Cyan
$blobShas = @{}
$failedFiles = @()

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.fullPath)
    $contentBase64 = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes($content))
    
    $body = @{
        content = $content
        encoding = "utf-8"
    } | ConvertTo-Json -Compress
    
    try {
        $blobUrl = "$baseUrl/repos/$Owner/$Repo/git/blobs"
        $blob = Invoke-RestMethod -Uri $blobUrl -Headers $headers -Method POST -Body $body -ContentType "application/json"
        $blobShas[$file.path] = $blob.sha
        Write-Host "   ✅ $($file.path)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $($file.path): $($_.Exception.Message)" -ForegroundColor Red
        $failedFiles += $file.path
    }
}

if ($failedFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️ 以下文件上传失败:" -ForegroundColor Yellow
    $failedFiles | ForEach-Object { Write-Host "   - $_" -ForegroundColor Yellow }
}

# ===== 7. 创建新 tree =====
Write-Host ""
Write-Host "🌲 创建新 tree..." -ForegroundColor Cyan
$treeArray = @()
foreach ($file in $files) {
    if ($blobShas.ContainsKey($file.path)) {
        $treeArray += @{
            path = $file.path
            mode = "100644"
            type = "blob"
            sha = $blobShas[$file.path]
        }
    }
}

$newTreeBody = @{
    tree = $treeArray
} | ConvertTo-Json -Depth 10

try {
    $newTree = Invoke-RestMethod -Uri "$baseUrl/repos/$Owner/$Repo/git/trees" -Headers $headers -Method POST -Body $newTreeBody -ContentType "application/json"
    Write-Host "   新 tree SHA: $($newTree.sha)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ 创建 tree 失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ===== 8. 创建新 commit =====
Write-Host ""
Write-Host "📝 创建 commit..." -ForegroundColor Cyan
$commitMessage = "[Auto Deploy] 3D房间 V2 - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

$commitBody = @{
    message = $commitMessage
    tree = $newTree.sha
} | ConvertTo-Json

if ($latestCommitSha) {
    $commitBodyObj = @{
        message = $commitMessage
        tree = $newTree.sha
        parents = @($latestCommitSha)
    }
    $commitBody = $commitBodyObj | ConvertTo-Json
}

try {
    $newCommit = Invoke-RestMethod -Uri "$baseUrl/repos/$Owner/$Repo/git/commits" -Headers $headers -Method POST -Body $commitBody -ContentType "application/json"
    Write-Host "   新 commit: $($newCommit.sha)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ 创建 commit 失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ===== 9. 更新分支引用 =====
Write-Host ""
Write-Host "🔄 更新分支..." -ForegroundColor Cyan
$refBody = @{
    sha = $newCommit.sha
    force = $true
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$baseUrl/repos/$Owner/$Repo/git/refs/heads/$Branch" -Headers $headers -Method PATCH -Body $refBody -ContentType "application/json" | Out-Null
    Write-Host "   ✅ 分支已更新" -ForegroundColor Green
} catch {
    Write-Host "   ❌ 更新分支失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ===== 10. 启用 GitHub Pages =====
Write-Host ""
Write-Host "⚙️  配置 GitHub Pages..." -ForegroundColor Cyan

# 检查 GitHub Pages 当前状态
try {
    $pagesInfo = Invoke-RestMethod -Uri "$baseUrl/repos/$Owner/$Repo/pages" -Headers $headers -Method GET
    $pagesSource = $pagesInfo.source
    Write-Host "   GitHub Pages 已配置: $($pagesInfo.status)" -ForegroundColor Green
    Write-Host "   来源: $($pagesSource.branch) / $($pagesSource.path)" -ForegroundColor Gray
} catch {
    # 尝试启用 GitHub Pages
    Write-Host "   正在启用 GitHub Pages..." -ForegroundColor Yellow
    $pagesBody = @{
        source = @{
            branch = $Branch
            path = "/"
        }
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$baseUrl/repos/$Owner/$Repo/pages" -Headers $headers -Method POST -Body $pagesBody -ContentType "application/json" | Out-Null
        Write-Host "   ✅ GitHub Pages 已启用" -ForegroundColor Green
    } catch {
        Write-Host "   ⚠️ 启用 Pages 失败（可能需要仓库设置中手动配置）" -ForegroundColor Yellow
        Write-Host "   请访问: https://github.com/$Owner/$Repo/settings/pages" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "🎉 部署完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📍 访问地址: https://$Owner.github.io" -ForegroundColor Cyan
Write-Host "⏱️  生效时间: 约 1-2 分钟" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 如 GitHub Pages 未自动启用：" -ForegroundColor Yellow
Write-Host "   1. 访问 https://github.com/$Owner/$Repo/settings/pages" -ForegroundColor Cyan
Write-Host "   2. Source 选择『Deploy from a branch』" -ForegroundColor Yellow
Write-Host "   3. Branch 选择『main / (root)』" -ForegroundColor Yellow
Write-Host "   4. 点击 Save" -ForegroundColor Yellow
Write-Host ""
