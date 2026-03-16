# .env.local에서 환경변수 로드
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.+)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
}

$headers = @{
    'accept'='application/json'
    'tenant'=$env:EAM_TENANT
    'organization'=$env:EAM_ORGANIZATION
    'Authorization'="Basic $($env:EAM_AUTH_TOKEN)"
}

Write-Host "=== Testing different pagination parameters ==="
Write-Host ""

# Test 1: No params (default)
Write-Host "1. No params (default):"
$r = Invoke-RestMethod -Uri 'https://se1.eam.hxgnsmartcloud.com:443/axis/restservices/permittowork' -Headers $headers
Write-Host "   Returned: $($r.Result.ResultData.DATARECORD.Count) records"
Write-Host "   Total in DB: $($r.Result.ResultData.RECORDS)"
Write-Host ""

# Test 2: recordlimit=200
Write-Host "2. recordlimit=200:"
$r = Invoke-RestMethod -Uri 'https://se1.eam.hxgnsmartcloud.com:443/axis/restservices/permittowork?recordlimit=200' -Headers $headers
Write-Host "   Returned: $($r.Result.ResultData.DATARECORD.Count) records"
Write-Host ""

# Test 3: recordlimit=1000
Write-Host "3. recordlimit=1000:"
$r = Invoke-RestMethod -Uri 'https://se1.eam.hxgnsmartcloud.com:443/axis/restservices/permittowork?recordlimit=1000' -Headers $headers
Write-Host "   Returned: $($r.Result.ResultData.DATARECORD.Count) records"
Write-Host ""

# Test 4: cursorposition=51 (next page)
Write-Host "4. cursorposition=51 (trying page 2):"
$r = Invoke-RestMethod -Uri 'https://se1.eam.hxgnsmartcloud.com:443/axis/restservices/permittowork?cursorposition=51' -Headers $headers
Write-Host "   Returned: $($r.Result.ResultData.DATARECORD.Count) records"
Write-Host "   Current cursor: $($r.Result.ResultData.CURRENTCURSORPOSITION)"
Write-Host "   Next cursor: $($r.Result.ResultData.NEXTCURSORPOSITION)"
