const express = require("express");
const router = express.Router();
const axios = require("axios");
const FormData = require("form-data");
const upload = require("../middleware/upload");

const AI_URL = process.env.AI_SERVICE_URL || "http://localhost:8000";

// Frame-width zones (as fraction of image width)
const ZONES = {
  LEFT: [0, 0.33],
  CENTER: [0.33, 0.67],
  RIGHT: [0.67, 1.0],
};

/**
 * POST /api/navigation/guide
 * Uses object detections to generate simple spoken navigation instructions.
 * Returns: direction + spoken_hint + obstacle_list
 */
router.post("/guide", upload.single("frame"), async (req, res) => {
  const appState = req.app.locals.appState;

  if (!req.file) {
    return res.status(400).json({ error: "No image frame provided." });
  }

  if (appState.activeFeature !== "navigation") {
    return res.status(409).json({ error: "Navigation feature is not active." });
  }

  appState.isProcessing = true;
  broadcastState(appState);

  try {
    const form = new FormData();
    form.append("file", req.file.buffer, {
      filename: "frame.jpg",
      contentType: req.file.mimetype,
    });
    form.append("confidence", "0.4");

    const startTs = Date.now();
    const response = await axios.post(`${AI_URL}/detect`, form, {
      headers: form.getHeaders(),
      timeout: 20000,
    });

    const processingMs = Date.now() - startTs;
    const detections = response.data.detections || [];
    const imageWidth = response.data.image_width || 640;

    // Build per-zone obstacle lists and detailed obstacle structures
    const zones = { LEFT: [], CENTER: [], RIGHT: [] };
    const obstacles = detections.map(det => {
      const x1 = det.bbox[0];
      const y1 = det.bbox[1];
      const x2 = det.bbox[2];
      const y2 = det.bbox[3];
      const w_box = x2 - x1;
      const cx = (x1 + x2) / 2;
      const fraction = cx / imageWidth;

      if (fraction < 0.33) zones.LEFT.push(det.label);
      else if (fraction < 0.67) zones.CENTER.push(det.label);
      else zones.RIGHT.push(det.label);

      // Distance estimation heuristic: object width relative to frame width
      const boxWidthFraction = w_box / imageWidth;
      const distance = Math.max(0.5, Math.min(8.0, Number((0.35 / Math.max(0.01, boxWidthFraction)).toFixed(1))));

      // Clock position
      let clockPosition = "12 o'clock";
      if (fraction < 0.15) clockPosition = "9 o'clock";
      else if (fraction < 0.35) clockPosition = "10 o'clock";
      else if (fraction < 0.45) clockPosition = "11 o'clock";
      else if (fraction < 0.55) clockPosition = "12 o'clock";
      else if (fraction < 0.65) clockPosition = "1 o'clock";
      else if (fraction < 0.85) clockPosition = "2 o'clock";
      else clockPosition = "3 o'clock";

      // Severity scoring
      let severity = 1; // low
      const label = det.label.toLowerCase();
      const highRisk = ["person", "car", "bus", "truck", "motorcycle", "bicycle", "dog", "cat", "stairs"];
      const medRisk = ["chair", "table", "desk", "sofa", "bed", "door", "bench", "suitcase", "backpack", "pottedplant"];

      if (highRisk.some(item => label.includes(item))) {
        severity = 3;
      } else if (medRisk.some(item => label.includes(item))) {
        severity = 2;
      }

      return {
        label: det.label,
        confidence: det.confidence,
        bbox: det.bbox,
        distance,
        clockPosition,
        severity,
      };
    });

    // Generate spoken hint using detailed obstacles
    const hint = buildNavigationHint(obstacles);

    const result = {
      zones,
      obstacles,
      hint,
      obstacleCount: detections.length,
      processingMs,
      fps: response.data.fps || null,
    };

    appState.lastResult = { feature: "navigation", ...result };
    appState.isProcessing = false;
    broadcastState(appState);

    res.json({ ok: true, ...result });
  } catch (err) {
    appState.isProcessing = false;
    broadcastState(appState);
    const msg = err.response?.data?.detail || err.message || "Navigation failed";
    console.error("[NAV]", msg);
    res.status(500).json({ error: msg });
  }
});

// ─── Navigation Logic ─────────────────────────────────────────────────────────
function buildNavigationHint(obstacles) {
  if (obstacles.length === 0) {
    return "Path is clear. You can move forward safely.";
  }

  // Sort obstacles by severity descending, then by distance ascending
  const sorted = [...obstacles].sort((a, b) => b.severity - a.severity || a.distance - b.distance);

  // Generate spoken descriptions
  const descriptions = sorted.map(obs => {
    const distText = obs.distance <= 1.2 ? "very close" : obs.distance <= 3.0 ? "nearby" : "ahead";
    return `${obs.label} at ${obs.clockPosition} (${distText}, ${obs.distance} meters)`;
  });

  let hint = "";
  if (descriptions.length > 3) {
    hint = `Multiple obstacles: ${descriptions.slice(0, 3).join(", ")}, and others. `;
  } else {
    hint = `Obstacles: ${descriptions.join(", ")}. `;
  }

  // Suggest movement based on the highest severity/closest obstacle
  const primary = sorted[0];
  if (primary.severity >= 2 && primary.distance <= 2.0) {
    if (primary.clockPosition.includes("12") || primary.clockPosition.includes("11") || primary.clockPosition.includes("1")) {
      // Obstacle directly in front. Find a clear direction or suggest side step
      const hasLeftObstacle = obstacles.some(o => o.clockPosition.includes("9") || o.clockPosition.includes("10"));
      const hasRightObstacle = obstacles.some(o => o.clockPosition.includes("2") || o.clockPosition.includes("3"));

      if (!hasLeftObstacle) {
        hint += `Step to your left to clear the ${primary.label}.`;
      } else if (!hasRightObstacle) {
        hint += `Step to your right to clear the ${primary.label}.`;
      } else {
        hint += `Stop and wait. Path is blocked on both sides.`;
      }
    } else {
      hint += `Proceed carefully, keeping clear of the ${primary.label} on your ${primary.clockPosition.includes("9") || primary.clockPosition.includes("10") ? "left" : "right"}.`;
    }
  } else {
    hint += "You can proceed with caution.";
  }

  return hint;
}

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
