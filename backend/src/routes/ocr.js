const express = require("express");
const router = express.Router();
const axios = require("axios");
const FormData = require("form-data");
const upload = require("../middleware/upload");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * POST /api/ocr/scan
 * Accepts a camera frame (image), forwards to Python AI service,
 * returns extracted text.
 */
router.post("/scan", upload.single("frame"), async (req, res) => {
  const appState = req.app.locals.appState;

  if (!req.file) {
    return res.status(400).json({ error: "No image frame provided." });
  }

  if (appState.activeFeature !== "ocr") {
    return res.status(409).json({ error: "OCR feature is not active. Switch features first." });
  }

  appState.isProcessing = true;
  broadcastState(appState);

  try {
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: "frame.jpg",
      contentType: req.file.mimetype,
    });

    const startTs = Date.now();
    const response = await axios.post(`${AI_URL}/ocr`, form, {
      headers: form.getHeaders(),
      timeout: 15000,
    });

    const processingMs = Date.now() - startTs;
    const result = {
      text: response.data.text || "",
      confidence: response.data.confidence || null,
      wordCount: (response.data.text || "").trim().split(/\s+/).filter(Boolean).length,
      processingMs,
    };

    appState.lastResult = { feature: "ocr", ...result };
    appState.isProcessing = false;
    broadcastState(appState);

    res.json({ ok: true, ...result });
  } catch (err) {
    appState.isProcessing = false;
    broadcastState(appState);

    const msg = err.response?.data?.detail || err.message || "OCR failed";
    console.error("[OCR]", msg);
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
