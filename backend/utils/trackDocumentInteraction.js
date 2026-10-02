const crypto = require("crypto");
const DocumentInteraction = require("../models/DocumentInteraction");

const WINDOWS = { view: 30 * 60 * 1000, download: 5 * 60 * 1000 };

const normalizeSessionId = (value) => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (raw && raw.length <= 128 && /^[a-zA-Z0-9._:-]+$/.test(raw)) return raw;
  return crypto.createHash("sha256").update(`${value || "anonymous"}`).digest("hex").slice(0, 64);
};

const claimInteraction = async ({ documentId, type, sessionId }) => {
  const windowMs = WINDOWS[type];
  if (!windowMs) return true;
  const bucket = Math.floor(Date.now() / windowMs);
  const normalizedSession = normalizeSessionId(sessionId);
  try {
    await DocumentInteraction.create({ documentId, type, sessionId: normalizedSession, bucket });
    return true;
  } catch (error) {
    if (error?.code === 11000) return false;
    throw error;
  }
};

module.exports = { claimInteraction, normalizeSessionId, WINDOWS };
