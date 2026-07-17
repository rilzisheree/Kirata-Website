#Requires -Version 5.1
<#
.SYNOPSIS
  Registers the PC presence agent to run automatically on Windows login.
  Run this once. To uninstall, run uninstall-startup.ps1.
#>

$TaskName   = "KirataPresenceAgent"
$AgentPath  = Join-Path $PSScriptRoot "agent.ps1"

# Resolve to absolute path
$AgentPath = (Resolve-Path $AgentPath).Path

# Check agent script exists
if (-not (Test-Path $AgentPath)) {
    Write-Host "ERROR: Cannot find agent.ps1 next to this script." -ForegroundColor Red
    Write-Host "Expected: $AgentPath"
    Read-Host "Press Enter to close"
    exit 1
}

# Remove existing task if present
if (Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue) {
    Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    Write-Host "Removed existing task." -ForegroundColor Gray
}

# Build the action: launch PowerShell hidden, running the agent
$Action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-WindowStyle Hidden -NonInteractive -ExecutionPolicy Bypass -File `"$AgentPath`""

# Trigger: on user login
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME

# Settings: restart on failure, run indefinitely
$Settings = New-ScheduledTaskSettingsSet `
    -ExecutionTimeLimit 0 `
    -RestartCount 5 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -StartWhenAvailable

Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $Action `
    -Trigger $Trigger `
    -Settings $Settings `
    -Description "Sends PC presence (apps/games) to kirataslife.space" `
    -RunLevel Highest `
    -Force | Out-Null

Write-Host ""
Write-Host "Done! The presence agent will now start automatically when you log in." -ForegroundColor Green
Write-Host ""
Write-Host "To start it right now without rebooting, run:" -ForegroundColor Cyan
Write-Host "  Start-ScheduledTask -TaskName '$TaskName'" -ForegroundColor White
Write-Host ""

$startNow = Read-Host "Start it now? (y/n)"
if ($startNow -eq 'y') {
    Start-ScheduledTask -TaskName $TaskName
    Write-Host "Agent started." -ForegroundColor Green
}

Write-Host ""
Read-Host "Press Enter to close"
