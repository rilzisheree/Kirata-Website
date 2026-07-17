import { Router } from "express";

const router = Router();

const CLIENT_ID     = process.env["SPOTIFY_CLIENT_ID"];
const CLIENT_SECRET = process.env["SPOTIFY_CLIENT_SECRET"];
let   refreshToken  = process.env["SPOTIFY_REFRESH_TOKEN"] ?? null;
let   cachedAccessToken: string | null = null;
let   tokenExpiresAt = 0;

const REDIRECT_URI = "https://kiratawebsitetesting.up.railway.app/api/spotify/callback";

function getRedirectUri(_req: any): string {
  return process.env["SPOTIFY_REDIRECT_URI"] ?? REDIRECT_URI;
}

// GET /spotify/auth — start OAuth flow (one-time setup)
router.get("/spotify/auth", (req, res) => {
  if (!CLIENT_ID) {
    res.status(500).send("SPOTIFY_CLIENT_ID not set");
    return;
  }
  const redirectUri  = getRedirectUri(req);
  const scope        = "user-read-recently-played";
  const authUrl      = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  // Show confirmation page so the redirect URI is visible before proceeding
  res.send(`
    <html><body style="font-family:monospace;padding:2rem;background:#111;color:#eee">
      <h2 style="color:#1DB954">Spotify Auth Setup</h2>
      <p>The server will use this <strong>redirect URI</strong>:</p>
      <pre style="background:#222;padding:1rem;border-radius:8px">${redirectUri}</pre>
      <p>Make sure this exact URL is added in your <a href="https://developer.spotify.com/dashboard" style="color:#1DB954">Spotify app's</a> Redirect URIs list, then click below:</p>
      <a href="${authUrl}" style="display:inline-block;background:#1DB954;color:#000;padding:.75rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:bold">Authorize with Spotify →</a>
    </body></html>
  `);
});

// GET /spotify/callback — exchange code, display refresh token for copy-paste
router.get("/spotify/callback", async (req, res) => {
  const code = req.query["code"] as string | undefined;
  if (!code) { res.status(400).send("Missing code"); return; }
  if (!CLIENT_ID || !CLIENT_SECRET) { res.status(500).send("Spotify credentials not set"); return; }

  const redirectUri = getRedirectUri(req);

  try {
    const body = new URLSearchParams({
      grant_type:   "authorization_code",
      code,
      redirect_uri: redirectUri,
    });
    const resp = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: body.toString(),
    });
    const data = await resp.json() as any;
    if (!data.refresh_token) {
      res.status(500).send("No refresh token returned: " + JSON.stringify(data));
      return;
    }
    refreshToken = data.refresh_token;
    res.send(`
      <html><body style="font-family:monospace;padding:2rem;background:#111;color:#eee">
        <h2 style="color:#1DB954">✅ Authorized!</h2>
        <p>Copy this value and set it as the <strong>SPOTIFY_REFRESH_TOKEN</strong> secret in Replit and Railway:</p>
        <pre style="background:#222;padding:1rem;border-radius:8px;word-break:break-all">${data.refresh_token}</pre>
        <p style="color:#888">You can close this tab after copying.</p>
      </body></html>
    `);
  } catch (err) {
    res.status(500).send("OAuth error: " + String(err));
  }
});

async function getAccessToken(): Promise<string | null> {
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60_000) return cachedAccessToken;
  if (!refreshToken || !CLIENT_ID || !CLIENT_SECRET) return null;

  try {
    const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });
    const resp = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
      },
      body: body.toString(),
    });
    const data = await resp.json() as any;
    if (!data.access_token) return null;
    cachedAccessToken = data.access_token;
    tokenExpiresAt    = Date.now() + (data.expires_in ?? 3600) * 1000;
    if (data.refresh_token) refreshToken = data.refresh_token; // rolling refresh
    return cachedAccessToken;
  } catch {
    return null;
  }
}

// GET /spotify/recent — recently played tracks
router.get("/spotify/recent", async (req, res) => {
  res.set("Cache-Control", "no-store");

  const token = await getAccessToken();
  if (!token) {
    res.status(503).json({ error: "Spotify not configured" });
    return;
  }

  try {
    const resp = await fetch("https://api.spotify.com/v1/me/player/recently-played?limit=15", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resp.ok) {
      res.status(resp.status).json({ error: "Spotify API error" });
      return;
    }
    const data = await resp.json() as any;
    const tracks = (data.items ?? []).map((item: any) => ({
      name:       item.track.name,
      artist:     item.track.artists.map((a: any) => a.name).join(", "),
      albumArt:   item.track.album.images?.[1]?.url ?? item.track.album.images?.[0]?.url ?? null,
      spotifyUrl: item.track.external_urls?.spotify ?? null,
      playedAt:   item.played_at,
    }));
    res.json({ tracks });
  } catch (err) {
    req.log.error({ err }, "Spotify recent fetch failed");
    res.status(500).json({ error: "Failed to fetch tracks" });
  }
});

export default router;
