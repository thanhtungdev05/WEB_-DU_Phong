param(
    [switch]$Extended
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Push-Location $Root

function Section($name) {
    Write-Host ""
    Write-Host "=== $name ==="
}

try {
    $failed = $false

    Section "Python syntax/tests"
    if (Test-Path ".venv\Scripts\python.exe") {
        $py = ".venv\Scripts\python.exe"
    } elseif (Get-Command python -ErrorAction SilentlyContinue) {
        $py = "python"
    } else {
        Write-Warning "Python not found."
        $py = $null
    }

    if ($py) {
        & $py -m compileall -q run_all.py admin_app tests
        if ($LASTEXITCODE -ne 0) { $failed = $true }

        & $py -m unittest discover -s tests -p "test_*.py"
        if ($LASTEXITCODE -ne 0) { $failed = $true }

        if (Test-Path "admin_app\manage.py") {
            & $py admin_app\manage.py check
            if ($LASTEXITCODE -ne 0) { $failed = $true }
        }

        if (Test-Path ".venv\Scripts\ruff.exe") {
            Section "Ruff"
            & ".venv\Scripts\ruff.exe" check run_all.py admin_app tests\test_dispatcher_security.py
	    if ($LASTEXITCODE -ne 0) { $failed = $true }
            & ".venv\Scripts\ruff.exe" format --check run_all.py admin_app tests\test_dispatcher_security.py
	    if ($LASTEXITCODE -ne 0) { $failed = $true }
        }
    }

    Section "PHP syntax/regressions"
    if (Get-Command php -ErrorAction SilentlyContinue) {
        $phpFiles = Get-ChildItem api -Recurse -Filter *.php -File
        foreach ($file in $phpFiles) {
            & php -l $file.FullName | Out-Host
            if ($LASTEXITCODE -ne 0) { $failed = $true; break }
        }

        $phpTests = Get-ChildItem tests -Filter "test_*.php" -File -ErrorAction SilentlyContinue
        foreach ($test in $phpTests) {
            & php $test.FullName
            if ($LASTEXITCODE -ne 0) { $failed = $true }
        }
    } else {
        Write-Warning "PHP not found in PATH."
    }

    Section "Node regression scripts"
    if (Get-Command node -ErrorAction SilentlyContinue) {
        $nodeTests = Get-ChildItem tests -Filter "test_*.js" -File -ErrorAction SilentlyContinue
        foreach ($test in $nodeTests) {
            & node $test.FullName
            if ($LASTEXITCODE -ne 0) { $failed = $true }
        }

        if ($Extended -and (Test-Path "node_modules\.bin\eslint.cmd")) {
            & ".\node_modules\.bin\eslint.cmd" .
            if ($LASTEXITCODE -ne 0) { $failed = $true }
        }
        if ($Extended -and (Test-Path "node_modules\.bin\prettier.cmd")) {
            & ".\node_modules\.bin\prettier.cmd" --check "**/*.{js,css,html,json,md}"
            if ($LASTEXITCODE -ne 0) { $failed = $true }
        }
    } else {
        Write-Warning "Node not found in PATH."
    }

    if ($Extended) {
        Section "Composer quality/security"
        if (Get-Command composer -ErrorAction SilentlyContinue) {
            & composer validate --strict
            if ($LASTEXITCODE -ne 0) { $failed = $true }
            & composer audit
            if ($LASTEXITCODE -ne 0) { $failed = $true }
        }

        if (Test-Path "vendor\bin\phpstan.bat") {
            Section "PHPStan"
            & "vendor\bin\phpstan.bat" analyse
            if ($LASTEXITCODE -ne 0) { $failed = $true }
        } elseif (Test-Path "vendor\bin\phpstan") {
            Section "PHPStan"
            & php "vendor\bin\phpstan" analyse
            if ($LASTEXITCODE -ne 0) { $failed = $true }
        }

        if ($py) {
            Section "Python dependency audit"
            try {
                & $py -m pip_audit
                if ($LASTEXITCODE -ne 0) { $failed = $true }
            } catch {
                Write-Warning "pip-audit is not installed."
            }
        }
    }

    if ($failed) {
        Write-Error "One or more checks failed."
        exit 1
    }

    Write-Host ""
    Write-Host "All executed checks passed."
}
finally {
    Pop-Location
}
