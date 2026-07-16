import { Router } from "express";
import {
  GetPresenceResponse,
  UpdatePresenceBody,
} from "@workspace/api-zod";

const router = Router();

// In-memory presence store — updated by the desktop app via PUT /api/presence
// Default state: offline with no activity
let presenceStore: {
  status: "online" | "idle" | "offline";
  currentApp: string | null;
  currentGame: string | null;
  currentSong: string | null;
  currentSongArtist: string | null;
  currentSongAlbumArt: string | null;
  timeSpent: string | null;
  activityIcon: string | null;
  uptime: string | null;
  lastUpdated: string;
} = {
  status: "offline",
  currentApp: null,
  currentGame: null,
  currentSong: null,
  currentSongArtist: null,
  currentSongAlbumArt: null,
  timeSpent: null,
  activityIcon: null,
  uptime: null,
  lastUpdated: new Date().toISOString(),
};

// GET /api/presence — returns current presence
router.get("/presence", (req, res) => {
  const parsed = GetPresenceResponse.safeParse(presenceStore);
  if (!parsed.success) {
    req.log.error({ error: parsed.error }, "Presence store is in invalid state");
    res.status(500).json({ error: "Internal presence state error" });
    return;
  }
  res.set("Cache-Control", "no-store");
  res.json(parsed.data);
});

// PUT /api/presence — update presence (called by desktop app)
// Protected by PRESENCE_SECRET bearer token when the env var is set.
router.put("/presence", (req, res) => {
  const secret = process.env["PRESENCE_SECRET"];
  if (secret) {
    const auth = req.headers["authorization"] ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (token !== secret) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
  }

  const parsed = UpdatePresenceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid presence payload", details: parsed.error.issues });
    return;
  }

  presenceStore = {
    status: parsed.data.status,
    currentApp: parsed.data.currentApp ?? null,
    currentGame: parsed.data.currentGame ?? null,
    currentSong: parsed.data.currentSong ?? null,
    currentSongArtist: parsed.data.currentSongArtist ?? null,
    currentSongAlbumArt: parsed.data.currentSongAlbumArt ?? null,
    timeSpent: parsed.data.timeSpent ?? null,
    activityIcon: parsed.data.activityIcon ?? null,
    uptime: (parsed.data as any).uptime ?? null,
    lastUpdated: new Date().toISOString(),
  };

  req.log.info({ status: presenceStore.status }, "Presence updated");
  res.json(presenceStore);
});

export default router;
