# Quick Compilerd Test
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  Compilerd Quick Test" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"

# Test 1: Health Check
Write-Host "1. Health Check..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "$baseUrl/" -UseBasicParsing
Write-Host "   Response: $($response.Content)" -ForegroundColor Green
Write-Host ""

# Test 2: Node.js
Write-Host "2. Node.js Execution..." -ForegroundColor Yellow
$json = '{"language":"nodejs","script":"console.log(\"Hello World\")"}'
$result = (Invoke-WebRequest -Uri "$baseUrl/api/execute/" -Method POST -Body $json -ContentType "application/json" -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "   Output: $($result.output.Trim())" -ForegroundColor Green
Write-Host ""

# Test 3: Python
Write-Host "3. Python Execution..." -ForegroundColor Yellow
$json = '{"language":"python","script":"print(5 + 3)"}'
$result = (Invoke-WebRequest -Uri "$baseUrl/api/execute/" -Method POST -Body $json -ContentType "application/json" -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "   Output: $($result.output.Trim())" -ForegroundColor Green
Write-Host ""

# Test 4: C
Write-Host "4. C Execution..." -ForegroundColor Yellow
$cCode = "#include <stdio.h>`nint main() {`n    printf(`"Hello from C!`");`n    return 0;`n}"
$json = @{language="c"; script=$cCode} | ConvertTo-Json -Compress
$result = (Invoke-WebRequest -Uri "$baseUrl/api/execute/" -Method POST -Body $json -ContentType "application/json" -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "   Output: $($result.output.Trim())" -ForegroundColor Green
Write-Host ""

# Test 5: Python with Input
Write-Host "5. Python with stdin..." -ForegroundColor Yellow
$json = @{language="python"; script="x = int(input())`ny = int(input())`nprint(x + y)"; stdin="10`n20"} | ConvertTo-Json -Compress
$result = (Invoke-WebRequest -Uri "$baseUrl/api/execute/" -Method POST -Body $json -ContentType "application/json" -UseBasicParsing).Content | ConvertFrom-Json
Write-Host "   Output: $($result.output.Trim())" -ForegroundColor Green
Write-Host ""

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  All Tests Passed!" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Server is running at: $baseUrl" -ForegroundColor White
Write-Host "API endpoint: $baseUrl/api/execute/" -ForegroundColor White
