require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const expressWs = require("express-ws");

const ocrRouter = require("./routes/ocr");
const detectionRouter = require("./routes/detection");
const navigationRouter = require("./routes/navigation");
const statusRouter = require("./routes/status");
const feedbackRouter = require("./routes/feedback");
const assistantRouter = require("./routes/assistant");
const sceneRouter = require("./routes/scene");
const searchRouter = require("./routes/search");

const app = express();
expressWs(app); // Attach WebSocket support

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: "*" }));
app.use(morgan("dev"));
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// ─── Shared State ─────────────────────────────────────────────────────────────
// Tracks which feature is currently active across all routes
const appState = {
  activeFeature: "none", // "ocr" | "detection" | "navigation" | "none" | "health" | "emergency" | "about" | "rating"
  isProcessing: false,
  lastResult: null,
  debugMode: false,
  clients: new Set(), // WebSocket clients
  healthData: {
    heartRate: 72,
    temperature: 36.8,
    spO2: 98,
    bloodPressure: "120/80",
    lastUpdated: new Date().toISOString()
  }
};
app.locals.appState = appState;

// Periodic health data fluctuation mock (simulates live glove input updates)
setInterval(() => {
  if (appState.healthData) {
    appState.healthData.heartRate = Math.floor(70 + Math.random() * 8); // fluctuates between 70-77
    appState.healthData.temperature = parseFloat((36.5 + Math.random() * 0.5).toFixed(1)); // 36.5 - 37.0
    appState.healthData.spO2 = Math.floor(97 + Math.random() * 3); // 97 - 99
    appState.healthData.lastUpdated = new Date().toISOString();
  }
}, 5000);

// Glove buffering state
let gloveBuffer = "";
let gloveTimeout = null;

function handleGloveChar(char) {
  if (gloveTimeout) {
    clearTimeout(gloveTimeout);
    gloveTimeout = null;
  }

  const cleanChar = char.trim();
  if (char === " " || cleanChar === "") {
    // Space or pause
    if (gloveBuffer.length > 0) {
      broadcast(appState, { type: "GLOVE_WORD", payload: { word: gloveBuffer } });
      gloveBuffer = "";
    }
  } else {
    gloveBuffer += cleanChar;
    broadcast(appState, { type: "GLOVE_CHAR", payload: { char: cleanChar, buffer: gloveBuffer } });
    
    // 3 seconds pause detection
    gloveTimeout = setTimeout(() => {
      if (gloveBuffer.length > 0) {
        broadcast(appState, { type: "GLOVE_WORD", payload: { word: gloveBuffer } });
        gloveBuffer = "";
      }
    }, 3000);
  }
}

// ─── WebSocket – live state push ────────────────────────────────────────────
app.ws("/ws", (ws) => {
  console.log("[WS] Client connected");
  appState.clients.add(ws);

  // Send current state immediately on connect
  ws.send(JSON.stringify({ type: "STATE", payload: getPublicState(appState) }));

  ws.on("message", (msg) => {
    try {
      const { type, payload } = JSON.parse(msg);
      if (type === "SET_FEATURE") {
        appState.activeFeature = payload.feature || "none";
        broadcast(appState, { type: "STATE", payload: getPublicState(appState) });
      }
      if (type === "SET_DEBUG") {
        appState.debugMode = !!payload.debug;
        broadcast(appState, { type: "STATE", payload: getPublicState(appState) });
      }
      if (type === "GLOVE_TEXT") {
        const char = payload.char || "";
        handleGloveChar(char);
      }
    } catch (_) {}
  });

  ws.on("close", () => {
    appState.clients.delete(ws);
    console.log("[WS] Client disconnected");
  });
});

// ─── REST Routes ───────────────────────────────────────────────────────────────
app.use("/api/ocr", ocrRouter);
app.use("/api/detection", detectionRouter);
app.use("/api/navigation", navigationRouter);
app.use("/api/status", statusRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/scene", sceneRouter);
app.use("/api/search", searchRouter);

// Health check
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  res.status(500).json({ error: err.message || "Internal server error" });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on http://localhost:${PORT}`);
  console.log(`🤖 AI Service expected at ${process.env.AI_SERVICE_URL}\n`);
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getPublicState(state) {
  return {
    activeFeature: state.activeFeature,
    isProcessing: state.isProcessing,
    debugMode: state.debugMode,
    lastResult: state.lastResult,
    healthData: state.healthData,
  };
}

function broadcast(state, message) {
  const payload = JSON.stringify(message);
  state.clients.forEach((client) => {
    try {
      if (client.readyState === 1) client.send(payload);
    } catch (_) {}
  });
}
