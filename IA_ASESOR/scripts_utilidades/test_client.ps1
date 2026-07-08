# test_client.ps1
# Script PowerShell para validar el estado del servidor de IA y RAG (Nodo 3) desde MarketingPost (Nodo 4).
# Uso: .\test_client.ps1 -ServerUrl "http://100.x.x.I7:8000" -Query "¿Que melaminas tienen en stock?"

param (
    [string]$ServerUrl = "http://localhost:8000",
    [string]$Query = "¿Cuales son las recomendaciones para cortar melamina de 18mm?"
)

Write-Host "=== TESTEANDO ECOSISTEMA DE IA (ALVAREZ PLACAS) ===" -ForegroundColor Cyan
Write-Host "Servidor de Destino (Nodo 3): $ServerUrl" -ForegroundColor Yellow
Write-Host ""

# 1. Validar el estado general de la API
$statusUrl = "$ServerUrl/api/chat/status"
Write-Host "[*] Solicitando estado del Servidor..." -ForegroundColor Gray
try {
    $statusResponse = Invoke-RestMethod -Uri $statusUrl -Method Get -TimeoutSec 5
    Write-Host "[+] API CONECTADA CORRECTAMENTE" -ForegroundColor Green
    Write-Host "    - Nodo: $($statusResponse.node)"
    Write-Host "    - Base de Datos: $($statusResponse.database_vectorial)"
    Write-Host "    - Ollama Status: $($statusResponse.ollama.status)"
    Write-Host "    - Modelo Inferencia: $($statusResponse.ollama.model_inferencia)"
    Write-Host "    - Modelo Embeddings: $($statusResponse.ollama.model_embeddings)"
} catch {
    Write-Host "[-] ERROR: No se pudo conectar al endpoint de estado ($statusUrl)" -ForegroundColor Red
    Write-Host "    Detalle: $_" -ForegroundColor DarkRed
    Exit
}

Write-Host ""

# 2. Enviar consulta de prueba
$queryUrl = "$ServerUrl/api/chat/query"
Write-Host "[*] Enviando consulta de prueba RAG: `"$Query`"" -ForegroundColor Gray

$body = @{
    query = $Query
    history = @()
} | ConvertTo-Json

try {
    $t_start = Get-Date
    $queryResponse = Invoke-RestMethod -Uri $queryUrl -Method Post -ContentType "application/json" -Body $body -TimeoutSec 30
    $t_end = Get-Date
    $elapsed = ($t_end - $t_start).TotalSeconds

    if ($queryResponse.success) {
        Write-Host "[+] RESPUESTA OBTENIDA EN $($elapsed.ToString('F2')) SEGUNDOS" -ForegroundColor Green
        Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
        Write-Host $queryResponse.answer -ForegroundColor White
        Write-Host "--------------------------------------------------------" -ForegroundColor DarkGray
        Write-Host "[*] Fuentes de informacion utilizadas:" -ForegroundColor Gray
        foreach ($source in $queryResponse.sources) {
            Write-Host "    - Fragmento: $($source.id) | Score de Similitud: $($source.score)"
        }
    } else {
        Write-Host "[-] El servidor reporto un fallo en la respuesta." -ForegroundColor Red
    }
} catch {
    Write-Host "[-] ERROR: Fallo al enviar la consulta al endpoint ($queryUrl)" -ForegroundColor Red
    Write-Host "    Detalle: $_" -ForegroundColor DarkRed
}

Write-Host ""
Write-Host "=== FIN DE LA PRUEBA ===" -ForegroundColor Cyan
