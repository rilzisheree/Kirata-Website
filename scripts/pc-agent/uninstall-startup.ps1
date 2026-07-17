#Requires -Version 5.1
<#
.SYNOPSIS
  Removes the PC presence agent from Windows startup.
#>

$TaskName = "KirataPresenceAgent"

if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Stop-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Presence agent removed from startup." -ForegroundColor Green
} else {
    Write-Host "No startup task found (already removed)." -ForegroundColor Yellow
}

Write-Host ""
Read-Host "Press Enter to close"
