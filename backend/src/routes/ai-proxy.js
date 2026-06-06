/**
 * ai-proxy.js — Factory function for simple AI-proxy route handlers.
 * 
 * Replaces the near-identical ocr.js and detection.js route handlers.
 * Routes with unique logic (navigation, scene, search) keep their own files.
 */

const express = require("express");
const axios = require("axios");
const FormData = require("form-data");
const upload = require("../middleware/upload");

const AI_URL = () => process.env.AI_SERVICE_URL || "http://localhost:8000";

/**
 * Create an Express router that proxies multipart image uploads to a Python endpoint.
 * 
 * @param {string} pythonEndpoint - Path on the AI service (e.g. "/ocr", "/detect")
 * @param {string} featureName    - The feature name for appState tracking (e.g. "ocr", "detection")
 * @returns {express.Router}
 */
function createAIProxyRoute(pythonEndpoint, featureName) {
  const router = express.Router();

  router.post("/scan", upload.single("frame"), async (req, res) => {
    const appState = req.app.locals.appState;

    if (!req.file) {
      return res.status(400).json({ error: "No image frame provided." });
    }

    // Feature-gate check: only allow when matching feature is active
    // (detection also allows "navigation" feature for compatibility)
    const allowedFeatures = featureName === "detection"
      ? [featureName, "navigation"]
      : [featureName];

    if (!allowedFeatures.includes(appState.activeFeature)) {
      return res.status(409).json({
        error: `${featureName} feature is not active. Switch features first.`,
      });
    }

    appState.isProcessing = true;
    broadcastState(appState);

    try {
      const form = new FormData();
      form.append("file", req.file.buffer, {
        filename: "frame.jpg",
        contentType: req.file.mimetype,
      });

      // Forward optional confidence param if present
      if (req.body.confidence) {
        form.append("confidence", req.body.confidence);
      }

      // Forward optional lang param for OCR
      if (req.body.lang) {
        form.append("lang", req.body.lang);
      }

      const startTs = Date.now();
      const endpoint = pythonEndpoint.startsWith("?")
        ? `${AI_URL()}${pythonEndpoint}`
        : `${AI_URL()}${pythonEndpoint}`;

      const response = await axios.post(endpoint, form, {
        headers: form.getHeaders(),
        timeout: 15000,
        params: req.query, // forward query params like ?lang=ara
      });

      const processingMs = Date.now() - startTs;
      const data = response.data;

      // Build unified result object
      const result = {
        ...data,
        processingMs,
      };

      // Persist to scan history in SQLite
      try {
        const { insertScan } = require("../db");
        let resultText = "";
        let confidence = null;
        if (featureName === "ocr") {
          resultText = result.text || "";
          confidence = result.confidence || 0;
        } else if (featureName === "detection") {
          const detections = result.detections || [];
          resultText = detections.map(d => d.label).join(", ");
          confidence = detections.length > 0
            ? Number((detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length).toFixed(4))
            : 0;
        }
        insertScan.run(featureName, resultText, confidence, processingMs);
      } catch (dbErr) {
        console.error(`[DB] Failed to insert scan history for ${featureName}:`, dbErr.message);
      }

      appState.lastResult = { feature: featureName, ...result };
      appState.isProcessing = false;
      broadcastState(appState);

      res.json({ ok: true, ...result });
    } catch (err) {
      appState.isProcessing = false;
      broadcastState(appState);

      const msg = err.response?.data?.detail || err.message || `${featureName} failed`;
      console.error(`[${featureName.toUpperCase()}]`, msg);
      res.status(500).json({ error: msg });
    }
  });

  return router;
}

module.exports = { createAIProxyRoute };

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
