param(
    [switch]$Execute,
    [switch]$ReplaceTarget,
    [string]$ConfirmTargetDatabase = ''
)

$ErrorActionPreference = 'Stop'
$sourceUrl = $env:NEON_SOURCE_DATABASE_URL
$targetUrl = $env:NEON_TARGET_DATABASE_URL

if ([string]::IsNullOrWhiteSpace($sourceUrl) -or [string]::IsNullOrWhiteSpace($targetUrl)) {
    throw 'Set NEON_SOURCE_DATABASE_URL and NEON_TARGET_DATABASE_URL in the current shell.'
}

$sourceUri = [Uri]$sourceUrl
$targetUri = [Uri]$targetUrl
$sourceDatabase = $sourceUri.AbsolutePath.TrimStart('/')
$targetDatabase = $targetUri.AbsolutePath.TrimStart('/')

if ($sourceUri.Host -eq $targetUri.Host -and $sourceDatabase -eq $targetDatabase) {
    throw 'Source and target resolve to the same database.'
}

Write-Host "Source: $($sourceUri.Host)/$sourceDatabase"
Write-Host "Target: $($targetUri.Host)/$targetDatabase"
Write-Host "Mode:   $(if ($ReplaceTarget) { 'replace target' } else { 'restore into empty target' })"

if (-not $Execute) {
    Write-Host 'Dry run only. Re-run with -Execute and -ConfirmTargetDatabase <database-name> after putting the app in maintenance/read-only mode.'
    exit 0
}

if ($ConfirmTargetDatabase -ne $targetDatabase) {
    throw "Target confirmation must exactly equal '$targetDatabase'."
}

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue) -or -not (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
    throw 'pg_dump and pg_restore must be installed and available on PATH.'
}

$dumpPath = Join-Path ([IO.Path]::GetTempPath()) ("ftc-neon-failback-{0}.dump" -f [Guid]::NewGuid())
try {
    & pg_dump --format=custom --no-owner --no-acl --file $dumpPath --dbname $sourceUrl
    if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed; target was not changed.' }

    $restoreArgs = @('--exit-on-error', '--no-owner', '--no-acl', '--dbname', $targetUrl)
    if ($ReplaceTarget) {
        $restoreArgs = @('--clean', '--if-exists') + $restoreArgs
    }
    $restoreArgs += $dumpPath
    & pg_restore @restoreArgs
    if ($LASTEXITCODE -ne 0) { throw 'pg_restore failed. Keep the application pointed at the source database and inspect the target.' }

    Write-Host 'Restore completed. Run migrations and verification before changing DATABASE_URL.'
} finally {
    if (Test-Path -LiteralPath $dumpPath) {
        Remove-Item -LiteralPath $dumpPath -Force
    }
}
