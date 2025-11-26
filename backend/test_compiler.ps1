# Test the compiler API
$policy = @"
role admin {
    resource document {
        read allow
    }
}
"@

$body = @{ code = $policy } | ConvertTo-Json
Write-Host "Sending policy to compiler..." -ForegroundColor Cyan
Write-Host "Policy:`n$policy`n" -ForegroundColor Yellow

try {
    $result = Invoke-RestMethod -Uri "http://localhost:5000/api/compile" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "✓ Compilation successful!" -ForegroundColor Green
    Write-Host "`nResponse:`n" -ForegroundColor Cyan
    $result | ConvertTo-Json -Depth 5
} catch {
    Write-Host "✗ Compilation failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
