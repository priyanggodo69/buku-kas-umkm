$ErrorActionPreference = "Stop"

# === Buat index.html dari file Supabase ===
$srcMain = 'c:\Users\priyanggodo\Latihan_JS\2UMKM_Pendaftaran UMKM_Tambah Menu Produk yang dijual_Github & Supabase.html'
$content = [System.IO.File]::ReadAllText($srcMain, [System.Text.Encoding]::UTF8)

$content = $content.Replace("const API_BASE = 'http://localhost:3000/api';", "const API_BASE = '/api';")
$content = $content.Replace('href="LK_UMKM2.html"', 'href="lk_umkm.html"')

[System.IO.File]::WriteAllText('c:\Users\priyanggodo\Latihan_JS\index.html', $content, [System.Text.Encoding]::UTF8)
Write-Host "OK: index.html berhasil dibuat"

# === Buat lk_umkm.html dari LK_UMKM2.html ===
$srcLK = 'c:\Users\priyanggodo\Latihan_JS\LK_UMKM2.html'
$content2 = [System.IO.File]::ReadAllText($srcLK, [System.Text.Encoding]::UTF8)

$content2 = $content2.Replace("const API_BASE = 'http://localhost:3000/api';", "const API_BASE = '/api';")
$content2 = $content2.Replace("window.location.href = '2UMKM_Pendaftaran UMKM_Tambah Menu Produk yang dijual_Github & Supabase.html';", "window.location.href = 'index.html';")

[System.IO.File]::WriteAllText('c:\Users\priyanggodo\Latihan_JS\lk_umkm.html', $content2, [System.Text.Encoding]::UTF8)
Write-Host "OK: lk_umkm.html berhasil dibuat"

Write-Host "Selesai!"
