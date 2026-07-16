#Requires -Version 5.1
<#
.SYNOPSIS
    PC Presence Agent — reports your active window and idle state to your bio site.

.DESCRIPTION
    Run this on your Windows PC. It detects what app or game you have focused,
    whether you're idle, and sends that data to your bio API every 30 seconds.

.NOTES
    Edit the CONFIG section below, then run:
        powershell -ExecutionPolicy Bypass -File agent.ps1
#>

# ═══════════════════════════════════════════════════════════════
#  CONFIG — set these before running
# ═══════════════════════════════════════════════════════════════
$ApiUrl  = "https://YOUR_DEPLOYED_URL/api/presence"   # e.g. https://yourdomain.com/api/presence
$Secret  = "YOUR_PRESENCE_SECRET"                      # Must match PRESENCE_SECRET on the server
$IntervalSecs         = 30    # How often to report (seconds)
$IdleThresholdMinutes = 5     # Minutes of no input before you're considered "idle"
# ═══════════════════════════════════════════════════════════════

# Load Win32 APIs once (GetForegroundWindow + GetWindowThreadProcessId + GetLastInputInfo)
if (-not ([System.Management.Automation.PSTypeName]'BioAgent.Win32').Type) {
    Add-Type -Namespace BioAgent -Name Win32 -MemberDefinition @"
        [System.Runtime.InteropServices.DllImport("user32.dll")]
        public static extern System.IntPtr GetForegroundWindow();

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        public static extern uint GetWindowThreadProcessId(System.IntPtr hWnd, out uint lpdwProcessId);

        [System.Runtime.InteropServices.StructLayout(System.Runtime.InteropServices.LayoutKind.Sequential)]
        public struct LASTINPUTINFO { public uint cbSize; public uint dwTime; }

        [System.Runtime.InteropServices.DllImport("user32.dll")]
        public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);

        public static uint GetIdleMs() {
            var lii = new LASTINPUTINFO();
            lii.cbSize = (uint)System.Runtime.InteropServices.Marshal.SizeOf(lii);
            GetLastInputInfo(ref lii);
            return (uint)(System.Environment.TickCount - (int)lii.dwTime);
        }
"@ -ErrorAction SilentlyContinue
}

# Known games: process name (lowercase) → display name
$Games = @{
    "valorant-win64-shipping" = "VALORANT"
    "valorant"                = "VALORANT"
    "riotclientux"            = "VALORANT"
    "robloxplayerbeta"        = "Roblox"
    "robloxplayer"            = "Roblox"
    "javaw"                   = "Minecraft"
    "minecraft"               = "Minecraft"
    "cs2"                     = "CS2"
    "csgo"                    = "CS:GO"
    "leagueoflegends"         = "League of Legends"
    "fortniteclient-win64-shipping" = "Fortnite"
    "genshinimpact"           = "Genshin Impact"
    "r5apex"                  = "Apex Legends"
    "overwatch"               = "Overwatch"
    "destiny2"                = "Destiny 2"
    "eldenring"               = "Elden Ring"
    "witcher3"                = "The Witcher 3"
    "cyberpunk2077"           = "Cyberpunk 2077"
    "gtav"                    = "GTA V"
    "rocketleague"            = "Rocket League"
}

# Known apps: process name (lowercase) → display name + emoji
$Apps = @{
    "code"              = @{ Name = "VS Code";           Icon = "󰨞" }
    "code - insiders"   = @{ Name = "VS Code Insiders";  Icon = "󰨞" }
    "windowsterminal"   = @{ Name = "Windows Terminal";  Icon = "" }
    "powershell"        = @{ Name = "PowerShell";        Icon = "" }
    "pwsh"              = @{ Name = "PowerShell";        Icon = "" }
    "chrome"            = @{ Name = "Google Chrome";     Icon = "" }
    "firefox"           = @{ Name = "Firefox";           Icon = "" }
    "msedge"            = @{ Name = "Microsoft Edge";    Icon = "" }
    "discord"           = @{ Name = "Discord";           Icon = "" }
    "spotify"           = @{ Name = "Spotify";           Icon = "" }
    "figma"             = @{ Name = "Figma";             Icon = "" }
    "photoshop"         = @{ Name = "Photoshop";         Icon = "" }
    "rider64"           = @{ Name = "JetBrains Rider";   Icon = "" }
    "idea64"            = @{ Name = "IntelliJ IDEA";     Icon = "" }
    "webstorm64"        = @{ Name = "WebStorm";          Icon = "" }
    "pycharm64"         = @{ Name = "PyCharm";           Icon = "" }
    "notepad++"         = @{ Name = "Notepad++";         Icon = "" }
    "obsidian"          = @{ Name = "Obsidian";          Icon = "" }
    "slack"             = @{ Name = "Slack";             Icon = "" }
    "notion"            = @{ Name = "Notion";            Icon = "" }
    "steam"             = @{ Name = "Steam";             Icon = "" }
}

function Get-ForegroundProcessName {
    try {
        $hwnd = [BioAgent.Win32]::GetForegroundWindow()
        $pid  = 0
        [BioAgent.Win32]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
        if ($pid -eq 0) { return $null }
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        return $proc.ProcessName
    } catch {
        return $null
    }
}

function Format-TimeSpent([int]$seconds) {
    if ($seconds -lt 60)          { return "${seconds}s" }
    if ($seconds -lt 3600)        { $m = [int]($seconds / 60); return "${m}m" }
    $h = [int]($seconds / 3600); $m = [int](($seconds % 3600) / 60)
    if ($m -eq 0)                 { return "${h}h" }
    return "${h}h ${m}m"
}

function Send-Presence($body) {
    try {
        $json    = $body | ConvertTo-Json -Compress
        $headers = @{
            "Content-Type"  = "application/json"
            "Authorization" = "Bearer $Secret"
        }
        $response = Invoke-RestMethod -Uri $ApiUrl -Method Put -Body $json -Headers $headers -TimeoutSec 10
        return $true
    } catch {
        Write-Warning "Failed to send presence: $_"
        return $false
    }
}

# ─── State tracking ────────────────────────────────────────────
$currentActivity = $null
$activityStart   = $null

Write-Host "PC Presence Agent started. Reporting every ${IntervalSecs}s to $ApiUrl" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

while ($true) {
    $procName   = Get-ForegroundProcessName
    $idleMs     = [BioAgent.Win32]::GetIdleMs()
    $idleMins   = $idleMs / 60000.0
    $isIdle     = $idleMins -ge $IdleThresholdMinutes

    $procLower  = if ($procName) { $procName.ToLower() } else { "" }

    # Determine activity
    $gameName   = $null
    $appName    = $null
    $appIcon    = $null

    if ($procName -and -not $isIdle) {
        if ($Games.ContainsKey($procLower)) {
            $gameName = $Games[$procLower]
        } elseif ($Apps.ContainsKey($procLower)) {
            $appName = $Apps[$procLower].Name
            $appIcon = $Apps[$procLower].Icon
        } else {
            # Fallback: use the raw process name, capitalised nicely
            $appName = (Get-Culture).TextInfo.ToTitleCase($procName.ToLower())
        }
    }

    # Track time in current activity
    $activityKey = if ($gameName) { "game:$gameName" } elseif ($appName) { "app:$appName" } else { "idle" }
    if ($activityKey -ne $currentActivity) {
        $currentActivity = $activityKey
        $activityStart   = Get-Date
    }
    $elapsed    = if ($activityStart) { [int]((Get-Date) - $activityStart).TotalSeconds } else { 0 }
    $timeSpent  = if ($elapsed -ge 60) { Format-TimeSpent $elapsed } else { $null }

    # Build payload
    $status = if ($isIdle) { "idle" } elseif ($procName) { "online" } else { "offline" }
    $payload = @{
        status      = $status
        currentGame = $gameName
        currentApp  = $appName
        activityIcon = $appIcon
        timeSpent   = $timeSpent
    }

    $ok = Send-Presence $payload

    # Console feedback
    $statusColor = if ($status -eq "online") { "Green" } elseif ($status -eq "idle") { "Yellow" } else { "Gray" }
    $activity    = if ($gameName) { "🎮 $gameName" } elseif ($appName) { "💻 $appName" } else { "(nothing)" }
    $ts          = Get-Date -Format "HH:mm:ss"
    $sent        = if ($ok) { "OK" } else { "!!" }
    Write-Host "[$ts] $sent  $status — $activity$(if ($timeSpent) { "  ($timeSpent)" })" -ForegroundColor $statusColor

    Start-Sleep -Seconds $IntervalSecs
}
