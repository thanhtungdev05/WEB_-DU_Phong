param(
    [string]$ProjectRoot = (Get-Location).Path,
    [switch]$InstallExtendedTools
)

$ErrorActionPreference = "Stop"
$KitRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = (Resolve-Path $ProjectRoot).Path

function EnsureDir([string]$p) {
    if (-not (Test-Path $p)) { New-Item -ItemType Directory -Path $p | Out-Null }
}

function CopyIfMissing([string]$src, [string]$dst) {
    if (-not (Test-Path $dst)) {
        EnsureDir (Split-Path -Parent $dst)
        Copy-Item $src $dst
        Write-Host "Created: $dst"
    } else {
        Write-Host "Preserved existing: $dst"
    }
}

function AppendMarked([string]$path, [string]$marker, [string]$content) {
    if (Test-Path $path) {
        $existing = Get-Content $path -Raw
        if ($existing -match [regex]::Escape($marker)) {
            Write-Host "Already configured: $path"
            return
        }
        Add-Content $path "`r`n$content"
    } else {
        Set-Content $path $content -Encoding UTF8
    }
    Write-Host "Updated: $path"
}

Write-Host "FPT project: $ProjectRoot"

# Skills
$skillSource = Join-Path $KitRoot ".agents\skills"
$skillDest = Join-Path $ProjectRoot ".agents\skills"
EnsureDir $skillDest

Get-ChildItem $skillSource -Directory | ForEach-Object {
    $dst = Join-Path $skillDest $_.Name
    EnsureDir $dst
    Copy-Item (Join-Path $_.FullName "SKILL.md") (Join-Path $dst "SKILL.md") -Force
    Write-Host "Installed skill: $($_.Name)"
}

# AGENTS stack block
$block = Get-Content (Join-Path $KitRoot "templates\AGENTS_FPT_STACK_BLOCK.txt") -Raw
AppendMarked (Join-Path $ProjectRoot "AGENTS.md") "<!-- BEGIN FPT ACTUAL STACK -->" $block

# Scripts
EnsureDir (Join-Path $ProjectRoot "scripts")
Copy-Item (Join-Path $KitRoot "scripts\check.ps1") (Join-Path $ProjectRoot "scripts\check.ps1") -Force
Copy-Item (Join-Path $KitRoot "scripts\check.sh") (Join-Path $ProjectRoot "scripts\check.sh") -Force

# Python dev tools in existing/new .venv
$venv = Join-Path $ProjectRoot ".venv"
$py = Join-Path $venv "Scripts\python.exe"
if (-not (Test-Path $py)) {
    if (Get-Command py -ErrorAction SilentlyContinue) {
        & py -3 -m venv $venv
    } elseif (Get-Command python -ErrorAction SilentlyContinue) {
        & python -m venv $venv
    }
}
if (Test-Path $py) {
    & $py -m pip install --upgrade pip
    & $py -m pip install --upgrade ruff pytest pytest-django pip-audit
    CopyIfMissing (Join-Path $KitRoot "templates\ruff.toml") (Join-Path $ProjectRoot "ruff.toml")
    CopyIfMissing (Join-Path $KitRoot "templates\pytest.ini") (Join-Path $ProjectRoot "pytest.ini")
}

if ($InstallExtendedTools) {
    # Optional Node lint/format setup, only if no package.json currently exists.
    if (-not (Test-Path (Join-Path $ProjectRoot "package.json"))) {
        Copy-Item (Join-Path $KitRoot "templates\package.json") (Join-Path $ProjectRoot "package.json")
        Copy-Item (Join-Path $KitRoot "templates\eslint.config.mjs") (Join-Path $ProjectRoot "eslint.config.mjs")
        Copy-Item (Join-Path $KitRoot "templates\.prettierrc.json") (Join-Path $ProjectRoot ".prettierrc.json")
        if (Get-Command npm -ErrorAction SilentlyContinue) {
            Push-Location $ProjectRoot
            try { npm install } finally { Pop-Location }
        }
    } else {
        Write-Warning "package.json already exists; Node tooling not modified."
    }

    # Optional PHP static-analysis tools.
    if (Get-Command composer -ErrorAction SilentlyContinue) {
        Push-Location $ProjectRoot
        try {
            composer require --dev phpstan/phpstan friendsofphp/php-cs-fixer phpunit/phpunit --no-interaction
        } finally { Pop-Location }
        CopyIfMissing (Join-Path $KitRoot "templates\phpstan.neon.dist") (Join-Path $ProjectRoot "phpstan.neon.dist")
        CopyIfMissing (Join-Path $KitRoot "templates\.php-cs-fixer.dist.php") (Join-Path $ProjectRoot ".php-cs-fixer.dist.php")
    } else {
        Write-Warning "Composer not found; PHP extended tooling skipped."
    }
}

Write-Host ""
Write-Host "Setup complete."
Write-Host "Restart Antigravity so Codex reloads AGENTS.md and skills."
Write-Host "Run focused checks with: .\scripts\check.ps1"
Write-Host "Run extended checks with: .\scripts\check.ps1 -Extended"
