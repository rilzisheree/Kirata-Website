import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

// In-memory rate limit store: ip → last sent timestamp (ms)
const rateLimitStore = new Map<string, number>();
const COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

router.post("/message", async (req, res) => {
  // Prefer x-forwarded-for (real user IP via Replit proxy) over socket address
  const forwarded = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim();
  const socketAddr = req.socket.remoteAddress ?? "unknown";
  // Skip rate limiting for internal/loopback addresses (health checks, shell tests)
  const isInternal = !forwarded && (socketAddr === "127.0.0.1" || socketAddr === "::1" || socketAddr === "::ffff:127.0.0.1");
  const ip = forwarded || socketAddr;

  // Rate limit check (skip for internal loopback — those are server-side tests)
  const lastSent = isInternal ? undefined : rateLimitStore.get(ip);
  if (lastSent !== undefined) {
    const elapsed = Date.now() - lastSent;
    if (elapsed < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000 / 60);
      return res.status(429).json({
        error: "rate_limited",
        retryAfterMinutes: remaining,
      });
    }
  }

  const { message, name, attachmentUrl } = req.body as { message?: string; name?: string; attachmentUrl?: string };

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(400).json({ error: "Message is required." });
  }

  const trimmed = message.trim();
  if (trimmed.length > 2000) {
    return res.status(400).json({ error: "Message too long (max 2000 chars)." });
  }

  const senderName = (name && typeof name === "string" && name.trim().length > 0)
    ? name.trim()
    : "anonymous";

  const trimmedUrl = (attachmentUrl && typeof attachmentUrl === "string" && attachmentUrl.trim().length > 0)
    ? attachmentUrl.trim()
    : null;

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    logger.warn("DISCORD_WEBHOOK_URL not set — message dropped");
    return res.status(503).json({ error: "Messaging not configured." });
  }

  try {
    const embed: Record<string, unknown> = {
      title: "📬 New message from your bio site",
      description: trimmed,
      color: 0x06b6d4, // cyan-500
      fields: [
        { name: "From", value: senderName, inline: true },
        ...(trimmedUrl ? [{ name: "Attachment", value: trimmedUrl, inline: false }] : []),
      ],
      footer: { text: `ip: ${ip}` },
      timestamp: new Date().toISOString(),
    };

    const payload = {
      username: "kirata's bio",
      avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
      embeds: [embed],
    };

    const webhookRes = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!webhookRes.ok) {
      const text = await webhookRes.text();
      logger.error({ status: webhookRes.status, body: text }, "Discord webhook failed");
      return res.status(502).json({ error: "Failed to deliver message." });
    }

    // Record the send time for rate limiting
    rateLimitStore.set(ip, Date.now());

    // Cleanup old entries every 1000 requests to prevent unbounded growth
    if (rateLimitStore.size > 1000) {
      const cutoff = Date.now() - COOLDOWN_MS;
      for (const [key, ts] of rateLimitStore) {
        if (ts < cutoff) rateLimitStore.delete(key);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    logger.error(err, "Error sending Discord webhook");
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
