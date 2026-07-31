# ============================================================
#   DIAGNOSTICO COMPLETO - HERUPU JARVIS
#   Rode no PowerShell (como Administrador de preferencia)
#   Uso:  powershell -ExecutionPolicy Bypass -File Diagnostico-JARVIS.ps1
# ============================================================

$ErrorActionPreference = "SilentlyContinue"
function Titulo($t) { Write-Host "`n===== $t =====" -ForegroundColor Cyan }
function Ok($t)     { Write-Host "  [OK]   $t" -ForegroundColor Green }
function Aviso($t)  { Write-Host "  [!]    $t" -ForegroundColor Yellow }
function Erro($t)   { Write-Host "  [ERRO] $t" -ForegroundColor Red }

Write-Host "`n############ DIAGNOSTICO HERUPU JARVIS ############" -ForegroundColor Magenta
Write-Host " Data: $(Get-Date)"

# ---------- 1. FERRAMENTAS BASE ----------
Titulo "1. Ferramentas instaladas"
foreach ($cmd in "node","npm","git","claude","python") {
    $p = (Get-Command $cmd -ErrorAction SilentlyContinue).Source
    if ($p) {
        $ver = & $cmd --version 2>$null | Select-Object -First 1
        Ok "$cmd -> $ver  ($p)"
    } else {
        Erro "$cmd NAO encontrado no PATH"
    }
}

# ---------- 2. LOCALIZAR A PASTA DO JARVIS ----------
Titulo "2. Localizando a pasta do JARVIS (server.js)"
$candidatos = @(
    "$PSScriptRoot",
    "$PSScriptRoot\..",
    "$env:USERPROFILE\Desktop",
    "$env:USERPROFILE\Documents",
    "$env:USERPROFILE"
)
$jarvis = $null
foreach ($base in $candidatos) {
    $hit = Get-ChildItem -Path $base -Filter "server.js" -Recurse -Depth 3 -ErrorAction SilentlyContinue |
           Where-Object { $_.FullName -notmatch "node_modules" } | Select-Object -First 1
    if ($hit) { $jarvis = Split-Path $hit.FullName; break }
}
if ($jarvis) { Ok "Pasta do JARVIS: $jarvis" }
else { Erro "server.js NAO encontrado. Edite a variavel \$jarvis manualmente no topo."; }

# ---------- 3. ARQUIVOS ESSENCIAIS ----------
if ($jarvis) {
    Titulo "3. Arquivos essenciais"
    foreach ($f in "server.js","package.json",".env") {
        if (Test-Path "$jarvis\$f") { Ok "$f presente" } else { Erro "$f FALTANDO" }
    }
    if (Test-Path "$jarvis\node_modules") { Ok "node_modules presente" }
    else { Erro "node_modules FALTANDO -> rode: npm install" }

    # ---------- 4. CONFERIR .env ----------
    Titulo "4. Configuracao (.env)"
    if (Test-Path "$jarvis\.env") {
        $envc = Get-Content "$jarvis\.env"
        $okey = ($envc | Select-String "OPENAI_API_KEY=").ToString()
        if ($okey -match "COLE_SUA_CHAVE_AQUI" -or $okey -match "OPENAI_API_KEY=\s*$") {
            Erro "OPENAI_API_KEY vazia/placeholder -> voz nao funciona"
        } elseif ($okey -match "sk-") { Ok "OPENAI_API_KEY configurada" }
        else { Aviso "OPENAI_API_KEY em formato inesperado" }
        $porta = ($envc | Select-String "PORT=").ToString() -replace "PORT=",""
        if (-not $porta) { $porta = "3000" }
        Ok "Porta configurada: $porta"
    }
}
if (-not $porta) { $porta = "3000" }

# ---------- 5. PROCESSO NODE / PORTA ----------
Titulo "5. Processo e porta ($porta)"
$nodeProcs = Get-Process node -ErrorAction SilentlyContinue
if ($nodeProcs) { Ok "$($nodeProcs.Count) processo(s) node.exe rodando (PIDs: $($nodeProcs.Id -join ', '))" }
else { Erro "Nenhum node.exe rodando -> JARVIS esta desligada" }

$conn = Get-NetTCPConnection -LocalPort $porta -State Listen -ErrorAction SilentlyContinue
if ($conn) { Ok "Porta $porta esta ESCUTANDO (PID $($conn.OwningProcess | Select-Object -First 1))" }
else { Erro "Porta $porta NAO esta escutando" }

# ---------- 6. TESTE HTTP ----------
Titulo "6. Teste de resposta HTTP (localhost:$porta)"
try {
    $r = Invoke-WebRequest "http://localhost:$porta" -TimeoutSec 10 -UseBasicParsing
    Ok "HTTP $($r.StatusCode) -> JARVIS respondendo!"
} catch {
    Erro "Sem resposta em http://localhost:$porta -> $($_.Exception.Message)"
}

# ---------- 7. LOGS ----------
Titulo "7. Ultimas linhas dos logs"
foreach ($log in "install-log.txt","jarvis.log","error.log","npm-debug.log") {
    $lp = if ($jarvis) { "$jarvis\$log" } else { $log }
    if (Test-Path $lp) {
        Write-Host "  --- $log (ultimas 15 linhas) ---" -ForegroundColor DarkGray
        Get-Content $lp -Tail 15 | ForEach-Object { Write-Host "    $_" }
    }
}

# ---------- 8. RESUMO ----------
Titulo "RESUMO / PROXIMO PASSO"
Write-Host @"
  Se a porta $porta NAO esta escutando e nao ha node.exe:
     cd `"$jarvis`"
     node server.js
     (deixe a janela aberta e observe a PRIMEIRA linha de erro)

  Se der erro de modulo (Cannot find module):  npm install
  Se erro de OPENAI_API_KEY:                    edite o arquivo .env
  Copie a saida COMPLETA deste diagnostico e a primeira mensagem
  de erro do 'node server.js' para analise.
"@ -ForegroundColor White

Write-Host "`n############ FIM DO DIAGNOSTICO ############`n" -ForegroundColor Magenta
