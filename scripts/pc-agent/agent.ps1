#Requires -Version 5.1

# ==============================================================
#  CONFIG -- edit these two lines before running
# ==============================================================
$ApiUrl = "https://kiratawebsitetesting.up.railway.app/api/presence"
$Secret = "imjoo4422"

$IntervalSecs         = 30
$IdleThresholdMinutes = 5
# ==============================================================

# Force TLS 1.2 (required by most modern HTTPS hosts)
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Keep the window open if anything goes wrong
trap {
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host ""
    Read-Host "Press Enter to close"
    exit 1
}

# Validate config
if ($ApiUrl -like "*YOUR_*" -or $Secret -like "*YOUR_*") {
    Write-Host "You need to edit the CONFIG section at the top of this file first." -ForegroundColor Yellow
    Write-Host "Set your Railway URL and your PRESENCE_SECRET value." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to close"
    exit 1
}

# Load Win32 APIs
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
"@
}

# Known games: process name (lowercase) -> display name
$Games = @{
    "valorant-win64-shipping"        = "VALORANT"
    "valorant"                       = "VALORANT"
    "riotclientux"                   = "VALORANT"
    "robloxplayerbeta"               = "Roblox"
    "robloxplayer"                   = "Roblox"
    "javaw"                          = "Minecraft"
    "minecraft"                      = "Minecraft"
    "cs2"                            = "CS2"
    "csgo"                           = "CS:GO"
    "leagueoflegends"                = "League of Legends"
    "fortniteclient-win64-shipping"  = "Fortnite"
    "r5apex"                         = "Apex Legends"
    "genshinimpact"                  = "Genshin Impact"
    "rocketleague"                   = "Rocket League"
    "destiny2"                       = "Destiny 2"
    "eldenring"                      = "Elden Ring"
    "gtav"                           = "GTA V"
}

# Known apps: process name (lowercase) -> display name
$Apps = @{
    "code"             = "VS Code"
    "windowsterminal"  = "Windows Terminal"
    "powershell"       = "PowerShell"
    "pwsh"             = "PowerShell"
    "chrome"           = "Google Chrome"
    "firefox"          = "Firefox"
    "msedge"           = "Microsoft Edge"
    "discord"          = "Discord"
    "spotify"          = "Spotify"
    "figma"            = "Figma"
    "obsidian"         = "Obsidian"
    "slack"            = "Slack"
    "notion"           = "Notion"
    "steam"            = "Steam"
    "rider64"          = "JetBrains Rider"
    "idea64"           = "IntelliJ IDEA"
    "webstorm64"       = "WebStorm"
    "notepad++"        = "Notepad++"
}

function Get-ForegroundProcessName {
    try {
        $hwnd = [BioAgent.Win32]::GetForegroundWindow()
        $pid  = 0
        [BioAgent.Win32]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
        if ($pid -eq 0) { return $null }
        return (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName
    } catch {
        return $null
    }
}

function Format-TimeSpent([int]$seconds) {
    if ($seconds -lt 60)   { return "${seconds}s" }
    if ($seconds -lt 3600) { $m = [int]($seconds / 60); return "${m}m" }
    $h = [int]($seconds / 3600)
    $m = [int](($seconds % 3600) / 60)
    if ($m -eq 0) { return "${h}h" }
    return "${h}h ${m}m"
}

function Send-Presence($body) {
    try {
        $json   = $body | ConvertTo-Json -Compress
        $status = curl.exe -s -o NUL -w "%{http_code}" -X PUT $ApiUrl `
            -H "Content-Type: application/json" `
            -H "Authorization: Bearer $Secret" `
            --data $json `
            --max-time 10
        return ($status -match "^2")
    } catch {
        Write-Host "  Send failed: $_" -ForegroundColor DarkRed
        return $false
    }
}

# State
$currentActivity = $null
$activityStart   = $null

Write-Host "PC Presence Agent running. Sending to $ApiUrl" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop."
Write-Host ""

while ($true) {
    $procName  = Get-ForegroundProcessName
    $idleMs    = [BioAgent.Win32]::GetIdleMs()
    $idleMins  = $idleMs / 60000.0
    $isIdle    = $idleMins -ge $IdleThresholdMinutes
    $procLower = if ($procName) { $procName.ToLower() } else { "" }

    $gameName = $null
    $appName  = $null

    if ($procName -and -not $isIdle) {
        if ($Games.ContainsKey($procLower)) {
            $gameName = $Games[$procLower]
        } elseif ($Apps.ContainsKey($procLower)) {
            $appName = $Apps[$procLower]
        } else {
            $appName = (Get-Culture).TextInfo.ToTitleCase($procLower)
        }
    }

    $activityKey = if ($gameName) { "game:$gameName" } elseif ($appName) { "app:$appName" } else { "idle" }
    if ($activityKey -ne $currentActivity) {
        $currentActivity = $activityKey
        $activityStart   = Get-Date
    }
    $elapsed   = if ($activityStart) { [int]((Get-Date) - $activityStart).TotalSeconds } else { 0 }
    $timeSpent = if ($elapsed -ge 60) { Format-TimeSpent $elapsed } else { $null }

    $status = if ($isIdle) { "idle" } elseif ($procName) { "online" } else { "offline" }

    $payload = @{
        status      = $status
        currentGame = $gameName
        currentApp  = $appName
        timeSpent   = $timeSpent
    }

    $ok = Send-Presence $payload

    $color    = if ($status -eq "online") { "Green" } elseif ($status -eq "idle") { "Yellow" } else { "Gray" }
    $activity = if ($gameName) { "game: $gameName" } elseif ($appName) { "app: $appName" } else { "(nothing)" }
    $result   = if ($ok) { "OK" } else { "!!" }
    $ts       = Get-Date -Format "HH:mm:ss"
    $line     = "[$ts] $result  $status -- $activity"
    if ($timeSpent) { $line += "  ($timeSpent)" }
    Write-Host $line -ForegroundColor $color

    Start-Sleep -Seconds $IntervalSecs
}
