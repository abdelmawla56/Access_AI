const express = require("express");
const router = express.Router();
const axios = require("axios");
const FormData = require("form-data");
const upload = require("../middleware/upload");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * POST /api/scene/describe
 * Sends camera frame to AI service, gets natural language scene description.
 */
router.post("/describe", upload.single("frame"), async (req, res) => {
  const appState = req.app.locals.appState;

  if (!req.file) {
    return res.status(400).json({ error: "No image frame provided." });
  }

  appState.isProcessing = true;
  broadcastState(appState);

  try {
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: "frame.jpg",
      contentType: req.file.mimetype,
    });
    form.append("confidence", "0.35");

    const startTs = Date.now();
    const response = await axios.post(`${AI_URL}/scene`, form, {
      headers: form.getHeaders(),
      timeout: 25000,
    });

    const processingMs = Date.now() - startTs;
    const { description, detections, environment, objectCount, fps } = response.data;

    const result = {
      description,
      detections: detections || [],
      environment: environment || "unknown",
      objectCount: objectCount || 0,
      fps: fps || null,
      processingMs,
    };

    appState.lastResult = { feature: "scene", ...result };
    appState.isProcessing = false;
    broadcastState(appState);

    res.json({ ok: true, ...result });
  } catch (err) {
    appState.isProcessing = false;
    broadcastState(appState);
    const msg = err.response?.data?.detail || err.message || "Scene understanding failed";
    console.error("[SCENE]", msg);
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
