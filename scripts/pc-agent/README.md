# PC Presence Agent

A PowerShell script that runs on your Windows PC and reports your current activity (active app/game + idle status) to your bio site every 30 seconds.

## Requirements

- Windows 10 / 11
- PowerShell 5.1+ (built in — no install needed)
- Your bio site deployed and the API URL handy

## Setup

1. **Open `agent.ps1`** in Notepad or any editor.

2. **Edit the CONFIG section** at the top:

   ```powershell
   $ApiUrl  = "https://YOUR_DEPLOYED_URL/api/presence"   # ← your site's API URL
   $Secret  = "YOUR_PRESENCE_SECRET"                      # ← copy from your server env
   ```

   The `PRESENCE_SECRET` value is the same secret you set in your Replit environment variables.

3. **Run it:**

   Right-click `agent.ps1` → **Run with PowerShell**

   Or from a terminal:
   ```powershell
   powershell -ExecutionPolicy Bypass -File agent.ps1
   ```

4. **Keep it running** in the background. You can minimize the window.

## What it reports

| Situation | Status shown on site |
|-----------|---------------------|
| You're actively using your PC | 🟢 Online + current app/game |
| No input for 5+ minutes | 🟡 Idle |
| Script not running / PC off | ⚫ Offline |

## Auto-start on login (optional)

To have the agent start automatically when you log in to Windows:

1. Press `Win + R`, type `shell:startup`, press Enter.
2. Create a shortcut to this file in that folder.
3. Right-click the shortcut → Properties → set **Target** to:
   ```
   powershell.exe -ExecutionPolicy Bypass -WindowStyle Minimized -File "C:\path\to\agent.ps1"
   ```

## Tuning

| Variable | Default | What it controls |
|----------|---------|-----------------|
| `$IntervalSecs` | `30` | How often (in seconds) to report |
| `$IdleThresholdMinutes` | `5` | Minutes of no input before "idle" |

## Troubleshooting

- **"Unauthorized" errors** — Make sure `$Secret` in the script matches `PRESENCE_SECRET` in your server environment exactly.
- **Site shows "offline" even while running** — Check that `$ApiUrl` points to the deployed URL (not `localhost`).
- **Execution Policy error** — Run `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` once in PowerShell as admin.
