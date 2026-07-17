import { Router } from "express";

const router = Router();

let cachedAccessToken: string | null = null;
let tokenExpiresAt = 0;
// updated when Spotify returns a rolling refresh token
let rollingRefreshToken: string | null = null;

function getEnv(key: string): string | null {
  return (process.env[key] ?? "").trim() || null;
}

function getRefreshToken(): string | null {
  return rollingRefreshToken ?? getEnv("SPOTIFY_REFRESH_TOKEN");
}

const HARDCODED_REDIRECT = "https://kirataslife.space/api/spotify/callback";

function getRedirectUri(_req: any): string {
  return getEnv("SPOTIFY_REDIRECT_URI") ?? HARDCODED_REDIRECT;
}

// GET /spotify/auth — start OAuth flow (one-time setup)
router.get("/spotify/auth", (req, res) => {
  const clientId = getEnv("SPOTIFY_CLIENT_ID");
  if (!clientId) { res.status(500).send("SPOTIFY_CLIENT_ID not set"); return; }

  const redirectUri = getRedirectUri(req);
  const scope = "user-read-recently-played";
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.send(`
    <html><body style="font-family:monospace;padding:2rem;background:#111;color:#eee">
      <h2 style="color:#1DB954">Spotify Auth Setup</h2>
      <p>Redirect URI the server will use:</p>
      <pre style="background:#222;padding:1rem;border-radius:8px">${redirectUri}</pre>
      <p>Make sure this exact URL is in your <a href="https://developer.spotify.com/dashboard" style="color:#1DB954">Spotify app</a>'s Redirect URIs, then click below:</p>
      <a href="${authUrl}" style="display:inline-block;background:#1DB954;color:#000;padding:.75rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:bold">Authorize with Spotify →</a>
    </body></html>
  `);
});

// GET /spotify/callback — exchange code, store refresh token
router.get("/spotify/callback", async (req, res) => {
  const code = req.query["code"] as string | undefined;
  if (!code) { res.status(400).send("Missing code"); return; }

  const clientId     = getEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = getEnv("SPOTIFY_CLIENT_SECRET");
  if (!clientId || !clientSecret) { res.status(500).send("Spotify credentials not set"); return; }

  const redirectUri = getRedirectUri(req);

  try {
    const body = new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri });
    const resp = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
      body: body.toString(),
    });
    const data = await resp.json() as any;
    if (!data.refresh_token) {
      res.status(500).send("No refresh token returned: " + JSON.stringify(data));
      return;
    }
    rollingRefreshToken = data.refresh_token;
    res.send(`
      <html><body style="font-family:monospace;padding:2rem;background:#111;color:#eee">
        <h2 style="color:#1DB954">✅ Authorized!</h2>
        <p>Set this as <strong>SPOTIFY_REFRESH_TOKEN</strong> in Replit and Railway:</p>
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

  const refreshToken = getRefreshToken();
  const clientId     = getEnv("SPOTIFY_CLIENT_ID");
  const clientSecret = getEnv("SPOTIFY_CLIENT_SECRET");
  if (!refreshToken || !clientId || !clientSecret) return null;

  try {
    const body = new URLSearchParams({ grant_type: "refresh_token", refresh_token: refreshToken });
    const resp = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type":  "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
      body: body.toString(),
    });
    const data = await resp.json() as any;
    if (!data.access_token) return null;
    cachedAccessToken = data.access_token;
    tokenExpiresAt    = Date.now() + (data.expires_in ?? 3600) * 1000;
    if (data.refresh_token) rollingRefreshToken = data.refresh_token;
    return cachedAccessToken;
  } catch {
    return null;
  }
}

// GET /spotify/debug — verify which env vars Railway can see (no values exposed)
router.get("/spotify/debug", (_req, res) => {
  res.json({
    hasClientId:        !!getEnv("SPOTIFY_CLIENT_ID"),
    hasClientSecret:    !!getEnv("SPOTIFY_CLIENT_SECRET"),
    hasRefreshToken:    !!getEnv("SPOTIFY_REFRESH_TOKEN"),
    refreshTokenLength: getEnv("SPOTIFY_REFRESH_TOKEN")?.length ?? 0,
    usingRollingToken:  !!rollingRefreshToken,
    hasCachedToken:     !!cachedAccessToken,
  });
});

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
