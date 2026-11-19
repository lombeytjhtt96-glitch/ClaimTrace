# PowerShell Archive Restorer for BPJS Kesehatan Data Sampel 2015-2024
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  BPJS Kesehatan Data Sampel 2015-2024 Archive Restorer   " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Menggabungkan bagian arsip dari archive_parts..." -ForegroundColor Yellow

$outputFile = "Data sampel 2015-2024.zip"
$parts = Get-ChildItem "archive_parts\data_sampel_2015_2024.zip.part_*" | Sort-Object Name

if ($parts.Count -eq 0) {
    Write-Host "Error: Berkas archive_parts tidak ditemukan!" -ForegroundColor Red
    exit 1
}

$outStream = [System.IO.File]::Create((Join-Path (Get-Location) $outputFile))
foreach ($p in $parts) {
    Write-Host "  -> Menyambung $($p.Name)..."
    $bytes = [System.IO.File]::ReadAllBytes($p.FullName)
    $outStream.Write($bytes, 0, $bytes.Length)
}
$outStream.Close()

Write-Host "Penggabungan selesai. Memverifikasi hash SHA-256..." -ForegroundColor Yellow
$hash = (Get-FileHash $outputFile -Algorithm SHA256).Hash.ToLower()
$expected = "300b56936c813fd911c984032a1fd80c79f1584efadfa03079f6e5d6c42bc4f3"

if ($hash -eq $expected) {
    Write-Host "✅ [SUKSES] Hash SHA-256 terverifikasi 100% cocok!" -ForegroundColor Green
    Write-Host "Berkas: $outputFile ($((Get-Item $outputFile).Length) bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ [GAGAL] Hash tidak cocok! Diharapkan: $expected, Dihasilkan: $hash" -ForegroundColor Red
    exit 1
}
