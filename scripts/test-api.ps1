# .env.local에서 환경변수 로드
Get-Content .env.local | ForEach-Object {
    if ($_ -match '^([^#][^=]+)=(.+)$') {
        [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
}

$response = Invoke-RestMethod -Uri 'https://se1.eam.hxgnsmartcloud.com:443/axis/restservices/permittowork' -Headers @{
    'accept'='application/json'
    'tenant'=$env:EAM_TENANT
    'organization'=$env:EAM_ORGANIZATION
    'Authorization'="Basic $($env:EAM_AUTH_TOKEN)"
}

$records = $response.Result.ResultData.DATARECORD

Write-Host "=== Valve-related records (FCV, PCV, LCV, HV, XV, etc.) ==="
Write-Host "Total records: $($records.Count)"
Write-Host ""

$valvePatterns = @('FCV', 'PCV', 'LCV', 'HV', 'XV', 'CV', 'Valve', '밸브')

$records | Where-Object {
    $desc = $_.PERMITTOWORKID.DESCRIPTION
    $equip = $_.EQUIPMENTID.EQUIPMENTCODE
    $found = $false
    foreach ($pattern in $valvePatterns) {
        if ($desc -like "*$pattern*" -or $equip -like "*$pattern*") {
            $found = $true
            break
        }
    }
    $found
} | ForEach-Object {
    $date = if ($_.DATEREQUIRED) {
        "$([System.DateTimeOffset]::FromUnixTimeMilliseconds($_.DATEREQUIRED.YEAR).Year)-$($_.DATEREQUIRED.MONTH.ToString('00'))-$($_.DATEREQUIRED.DAY.ToString('00'))"
    } else { "N/A" }

    Write-Host "[$($_.PERMITTOWORKID.PERMITTOWORKCODE)] $date"
    Write-Host "  $($_.PERMITTOWORKID.DESCRIPTION)"
    Write-Host "  Equipment: $($_.EQUIPMENTID.EQUIPMENTCODE)"
    Write-Host ""
}
