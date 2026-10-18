import { Router } from "express";
import { logger } from "../lib/logger";

const router = Router();

router.post("/message", async (req, res) => {
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

    return res.status(200).json({ ok: true });
  } catch (err) {
    logger.error(err, "Error sending Discord webhook");
    return res.status(500).json({ error: "Internal server error." });
  }
});

export default router;
