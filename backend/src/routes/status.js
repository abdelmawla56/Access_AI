const express = require("express");
const router = express.Router();

// GET /api/status – returns current app state
router.get("/", (req, res) => {
  const { activeFeature, isProcessing, debugMode, lastResult, healthData } = req.app.locals.appState;
  res.json({ activeFeature, isProcessing, debugMode, lastResult, healthData });
});

// POST /api/status/feature – switch active feature
router.post("/feature", (req, res) => {
  const { feature } = req.body;
  const valid = ["ocr", "detection", "navigation", "none"];
  if (!valid.includes(feature)) {
    return res.status(400).json({ error: `Invalid feature. Choose from: ${valid.join(", ")}` });
  }

  const appState = req.app.locals.appState;
  appState.activeFeature = feature;
  appState.lastResult = null;
  appState.isProcessing = false;

  // Broadcast to all WS clients
  const message = JSON.stringify({
    type: "STATE",
    payload: { activeFeature: feature, isProcessing: false, debugMode: appState.debugMode, lastResult: null },
  });
  appState.clients.forEach((client) => {
    try { if (client.readyState === 1) client.send(message); } catch (_) {}
  });

  res.json({ ok: true, activeFeature: feature });
});

// POST /api/status/debug – toggle debug mode
router.post("/debug", (req, res) => {
  const appState = req.app.locals.appState;
  appState.debugMode = !!req.body.debug;
  res.json({ ok: true, debugMode: appState.debugMode });
});

module.exports = router;
