$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

$base = "C:\Users\Diego\petita-projeto"
$prodDir = Join-Path $base "produtos"
$pagesDir = Join-Path $base "pages"
New-Item -ItemType Directory -Force $prodDir | Out-Null
New-Item -ItemType Directory -Force $pagesDir | Out-Null

$UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"
$headers = @{ "User-Agent" = $UA }

$urls = @(
  "https://petita.com.br/linha-premium-cherie/",
  "https://petita.com.br/linha-premium-duke/",
  "https://petita.com.br/linha-premium-filhotes/",
  "https://petita.com.br/linha-premium-petit/",
  "https://petita.com.br/linha-plus/",
  "https://petita.com.br/linha-refeicao/",
  "https://petita.com.br/acessorios/",
  "https://petita.com.br/linha-anplas/"
)

function Slugify($s) {
  if (-not $s) { return "produto" }
  $s = $s.ToLower()
  $s = $s -replace '[áàâãä]','a' -replace '[éèêë]','e' -replace '[íìîï]','i' -replace '[óòôõö]','o' -replace '[úùûü]','u' -replace 'ç','c'
  $s = $s -replace '[^a-z0-9]+','-'
  $s = $s.Trim('-')
  if ($s.Length -gt 60) { $s = $s.Substring(0,60) }
  if (-not $s) { $s = "produto" }
  return $s
}

$results = @()
$failed = @()

foreach ($url in $urls) {
  $linha = ($url -replace 'https://petita.com.br/','' ).Trim('/')
  $htmlPath = Join-Path $pagesDir "$linha.html"
  try {
    $resp = Invoke-WebRequest -Uri $url -Headers $headers -UseBasicParsing -TimeoutSec 30
    $html = $resp.Content
    Set-Content -Path $htmlPath -Value $html -Encoding UTF8
  } catch {
    Write-Host "FAIL page: $url -> $($_.Exception.Message)"
    $failed += $url
    Start-Sleep -Milliseconds 800
    continue
  }
  Start-Sleep -Milliseconds 800

  # Extract img tags
  $imgMatches = [regex]::Matches($html, '<img\b[^>]*>', 'IgnoreCase')
  $seen = @{}
  foreach ($m in $imgMatches) {
    $tag = $m.Value
    $src = $null
    $srcMatch = [regex]::Match($tag, '(?:data-src|src)\s*=\s*"([^"]+)"', 'IgnoreCase')
    if ($srcMatch.Success) { $src = $srcMatch.Groups[1].Value }
    if (-not $src) { continue }
    if ($src -notmatch '/wp-content/uploads/') { continue }
    $low = $src.ToLower()
    if ($low -match 'logo|favicon|banner|icon|header|footer') { continue }
    if ($seen.ContainsKey($src)) { continue }
    $seen[$src] = $true

    $alt = ""
    $altMatch = [regex]::Match($tag, 'alt\s*=\s*"([^"]*)"', 'IgnoreCase')
    if ($altMatch.Success) { $alt = $altMatch.Groups[1].Value }

    # Find nearest heading before img (within 500 chars)
    $idx = $m.Index
    $startIdx = [Math]::Max(0, $idx - 500)
    $window = $html.Substring($startIdx, $idx - $startIdx)
    $hMatches = [regex]::Matches($window, '<h[2-4][^>]*>(.*?)</h[2-4]>', 'IgnoreCase,Singleline')
    $heading = ""
    if ($hMatches.Count -gt 0) {
      $heading = $hMatches[$hMatches.Count - 1].Groups[1].Value
      $heading = [regex]::Replace($heading, '<[^>]+>', '').Trim()
    }

    $nome = if ($alt) { $alt } elseif ($heading) { $heading } else { ([System.IO.Path]::GetFileNameWithoutExtension($src)) }
    $descricao = $heading

    $ext = [System.IO.Path]::GetExtension(($src -split '\?')[0])
    if (-not $ext) { $ext = ".jpg" }
    $slug = Slugify($nome)
    $fname = "$linha-$slug$ext"
    $localPath = Join-Path $prodDir $fname

    # avoid collision
    $c = 1
    while (Test-Path $localPath) {
      $fname = "$linha-$slug-$c$ext"
      $localPath = Join-Path $prodDir $fname
      $c++
    }

    try {
      Invoke-WebRequest -Uri $src -Headers $headers -UseBasicParsing -TimeoutSec 30 -OutFile $localPath
    } catch {
      Write-Host "FAIL img: $src"
      continue
    }
    Start-Sleep -Milliseconds 200

    $size = (Get-Item $localPath).Length
    if ($size -lt 5120) {
      Remove-Item $localPath -Force
      continue
    }

    $results += [PSCustomObject]@{
      linha = $linha
      nome = $nome
      descricao = $descricao
      image_url = $src
      image_local = "produtos/$fname"
      source_url = $url
      size_kb = [math]::Round($size/1024,1)
    }
  }
}

# Write JSON
$json = $results | ConvertTo-Json -Depth 4
Set-Content -Path (Join-Path $base "produtos.json") -Value $json -Encoding UTF8

# Write MD
$md = "# Produtos Petita`n`n"
$grouped = $results | Group-Object linha
foreach ($g in $grouped) {
  $md += "## $($g.Name)`n`n"
  foreach ($p in $g.Group) {
    $md += "### $($p.nome)`n`n"
    $md += "![$($p.nome)]($($p.image_local))`n`n"
    if ($p.descricao -and $p.descricao -ne $p.nome) { $md += "$($p.descricao)`n`n" }
    $md += "- Source: $($p.source_url)`n`n"
  }
}
Set-Content -Path (Join-Path $base "produtos.md") -Value $md -Encoding UTF8

# Summary
$totalSize = (Get-ChildItem $prodDir -File | Measure-Object Length -Sum).Sum
Write-Host "=== SUMMARY ==="
Write-Host "Total images: $($results.Count)"
Write-Host "Folder size KB: $([math]::Round($totalSize/1024,1))"
Write-Host "Failed pages: $($failed -join ', ')"
Write-Host "--- Distribution ---"
$results | Group-Object linha | ForEach-Object { Write-Host "$($_.Name): $($_.Count)" }
Write-Host "--- First 3 examples ---"
$results | Select-Object -First 3 | ForEach-Object { Write-Host "[$($_.linha)] $($_.nome) -> $($_.image_url)" }
Write-Host "--- All sizes ---"
$results | ForEach-Object { Write-Host "$($_.image_local) - $($_.size_kb) KB" }
