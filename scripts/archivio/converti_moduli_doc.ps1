# Converte in .docx i moduli VV.F. "MOD. PIN 2" e "MOD. PIN 3" rimasti in formato .doc (vecchio Word), così l'app può leggerli.
# Non tocca gli originali: le copie vanno in <archivio>\_AGGIORNAMENTI\Moduli convertiti\<amministratore>\<cartella pratica>\.
# Richiede Word installato. Uso:  powershell -File converti_moduli_doc.ps1 [-Archivio "E:\ARCHIVIO 2026"]
param([string]$Archivio = 'E:\ARCHIVIO 2026')

$ErrorActionPreference = 'Stop'
$destRadice = Join-Path $Archivio '_AGGIORNAMENTI\Moduli convertiti'
# "PIN 3", "PIN. 3", "PIN_3_…" sì; "PIN 3.1", "PIN 2.1", "PIN_2_2_…" no
$rx = 'PIN[.\s_]*(2|3)(?!\.\d|_\d{1,2}(?!\d))'

$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$word.AutomationSecurity = 3   # nessuna macro
$fatti = 0; $saltati = 0; $errori = 0
try {
  foreach ($amm in Get-ChildItem -LiteralPath $Archivio -Directory | Where-Object { $_.Name -notmatch '^_' }) {
    $lavori = Join-Path $amm.FullName '01_LAVORI'
    if (-not (Test-Path -LiteralPath $lavori)) { $lavori = $amm.FullName }
    $cpi = @('CPI', '01_CPI') | ForEach-Object { Join-Path $lavori $_ } | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
    if (-not $cpi) { continue }
    foreach ($pratica in Get-ChildItem -LiteralPath $cpi -Directory) {
      $files = Get-ChildItem -LiteralPath $pratica.FullName -Recurse -File -Filter *.doc -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -ieq '.doc' -and $_.Name -notlike '~$*' -and $_.Name -match $rx -and $_.FullName -notmatch '(?i)\\foto' }
      foreach ($f in $files) {
        $dest = Join-Path (Join-Path (Join-Path $destRadice $amm.Name) $pratica.Name) ($f.BaseName + '.docx')
        if ((Test-Path -LiteralPath $dest) -and ((Get-Item -LiteralPath $dest).LastWriteTime -ge $f.LastWriteTime)) { $saltati++; continue }
        try {
          New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
          $doc = $word.Documents.Open([string]$f.FullName, $false, $true, $false)   # sola lettura
          $doc.SaveAs2([string]$dest, 16)                                            # wdFormatXMLDocument
          $doc.Close($false)
          $fatti++
        } catch {
          $errori++
          try { $doc.Close($false) } catch {}
        }
      }
    }
  }
} finally {
  $word.Quit()
}
"Convertiti: $fatti - già presenti: $saltati - errori: $errori"
