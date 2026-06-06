const express = require("express");
const router = express.Router();
const axios = require("axios");
const FormData = require("form-data");
const upload = require("../middleware/upload");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * POST /api/search/scan
 * Sends camera frame and search target to AI service.
 */
router.post("/scan", upload.single("frame"), async (req, res) => {
  const appState = req.app.locals.appState;
  const { target } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: "No image frame provided." });
  }

  if (!target) {
    return res.status(400).json({ error: "Search target is required." });
  }

  appState.isProcessing = true;
  broadcastState(appState);

  try {
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: "frame.jpg",
      contentType: req.file.mimetype,
    });
    form.append("target", target);
    form.append("confidence", "0.35");

    const startTs = Date.now();
    const response = await axios.post(`${AI_URL}/search`, form, {
      headers: form.getHeaders(),
      timeout: 25000,
    });

    const processingMs = Date.now() - startTs;
    const { found, matches, position, hint, fps } = response.data;

    const result = {
      found,
      target,
      matches: matches || [],
      position: position || null,
      hint,
      fps: fps || null,
      processingMs,
    };

    // Persist to scan history in SQLite
    try {
      const { insertScan } = require("../db");
      const maxConf = matches.length > 0
        ? Number(Math.max(...matches.map(m => m.confidence)).toFixed(4))
        : 0;
      insertScan.run("search", hint, maxConf, processingMs);
    } catch (dbErr) {
      console.error("[DB] Failed to insert search scan history:", dbErr.message);
    }

    appState.lastResult = { feature: "search", ...result };
    appState.isProcessing = false;
    broadcastState(appState);

    res.json({ ok: true, ...result });
  } catch (err) {
    appState.isProcessing = false;
    broadcastState(appState);
    const msg = err.response?.data?.detail || err.message || "Object search failed";
    console.error("[SEARCH]", msg);
    res.status(500).json({ error: msg });
  }
});

module.exports = router;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function broadcastState(appState) {
  const payload = JSON.stringify({
    type: "STATE",
    payload: {
      activeFeature: appState.activeFeature,
      isProcessing: appState.isProcessing,
      debugMode: appState.debugMode,
      lastResult: appState.lastResult,
    },
  });
  appState.clients.forEach((client) => {
    try { if (client.readyState === 1) client.send(payload); } catch (_) {}
  });
}
