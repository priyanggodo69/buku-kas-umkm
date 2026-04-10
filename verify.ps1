$idx = Select-String -Path "index.html" -Pattern "API_BASE"
Write-Host "=== index.html API_BASE ==="
foreach ($m in $idx) { Write-Host $m.Line.Trim() }

$link = Select-String -Path "index.html" -Pattern "lk_umkm.html"
Write-Host "=== index.html link lk_umkm ==="
foreach ($m in $link) { Write-Host $m.Line.Trim() }

$lk = Select-String -Path "lk_umkm.html" -Pattern "API_BASE"
Write-Host "=== lk_umkm.html API_BASE ==="
foreach ($m in $lk) { Write-Host $m.Line.Trim() }

$logout = Select-String -Path "lk_umkm.html" -Pattern "location.href"
Write-Host "=== lk_umkm.html logout ==="
foreach ($m in $logout) { Write-Host $m.Line.Trim() }
