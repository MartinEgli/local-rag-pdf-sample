$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $repoRoot 'fixtures\pdf-source'
$targetRoot = Join-Path $repoRoot 'sources\pdfs'
$browserCandidates = @(
    'C:\Program Files\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Google\Chrome\Application\chrome.exe',
    'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
    'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
)
$browser = $browserCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (-not $browser) {
    throw 'Microsoft Edge or Google Chrome is required to generate the PDF fixtures.'
}

New-Item -ItemType Directory -Path $targetRoot -Force | Out-Null
foreach ($html in Get-ChildItem -LiteralPath $sourceRoot -Filter '*.html' -File) {
    $pdf = Join-Path $targetRoot ($html.BaseName + '.pdf')
    $uri = [Uri]::new($html.FullName).AbsoluteUri
    $profileRoot = Join-Path $env:TEMP ('local-rag-pdf-sample-' + [guid]::NewGuid().ToString('N'))
    New-Item -ItemType Directory -Path $profileRoot -Force | Out-Null
    & $browser --headless=new --disable-gpu --no-pdf-header-footer "--user-data-dir=$profileRoot" "--print-to-pdf=$pdf" $uri | Out-Null
    if (-not (Test-Path -LiteralPath $pdf)) {
        throw "PDF generation failed: $pdf"
    }
    Write-Host "Generated $pdf"
}
