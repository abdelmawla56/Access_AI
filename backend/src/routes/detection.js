const express = require("express");
const router = express.Router();
const axios = require("axios");
const FormData = require("form-data");
const upload = require("../middleware/upload");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * POST /api/detection/analyze
 * Forwards camera frame to YOLOv8, returns detected objects with
 * bounding boxes, labels, and confidence scores.
 */
router.post("/analyze", upload.single("frame"), async (req, res) => {
  const appState = req.app.locals.appState;

  if (!req.file) {
    return res.status(400).json({ error: "No image frame provided." });
  }

  const validFeatures = ["detection", "navigation"];
  if (!validFeatures.includes(appState.activeFeature)) {
    return res.status(409).json({ error: "Detection feature is not active." });
  }

  appState.isProcessing = true;
  broadcastState(appState);

  try {
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: "frame.jpg",
      contentType: req.file.mimetype,
    });
    form.append("confidence", req.body.confidence || "0.4");

    const startTs = Date.now();
    const response = await axios.post(`${AI_URL}/detect`, form, {
      headers: form.getHeaders(),
      timeout: 20000,
    });

    const processingMs = Date.now() - startTs;
    const detections = response.data.detections || [];
    const fps = response.data.fps || null;

    const result = {
      detections,
      count: detections.length,
      fps,
      processingMs,
    };

    appState.lastResult = { feature: "detection", ...result };
    appState.isProcessing = false;
    broadcastState(appState);

    res.json({ ok: true, ...result });
  } catch (err) {
    appState.isProcessing = false;
    broadcastState(appState);
    const msg = err.response?.data?.detail || err.message || "Detection failed";
    console.error("[DETECTION]", msg);
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
