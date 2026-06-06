require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const expressWs = require("express-ws");
const rateLimit = require("express-rate-limit");

// ─── Route imports ────────────────────────────────────────────────────────────
const { createAIProxyRoute } = require("./routes/ai-proxy");
const navigationRouter = require("./routes/navigation");
const statusRouter = require("./routes/status");
const feedbackRouter = require("./routes/feedback");
const assistantRouter = require("./routes/assistant");
const sceneRouter = require("./routes/scene");
const searchRouter = require("./routes/search");
const historyRouter = require("./routes/history");
const currencyRouter = require("./routes/currency");

const app = express();
expressWs(app); // Attach WebSocket support

// ─── Rate Limiters ────────────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests, slow down." },
});

app.use(globalLimiter);

// ─── CORS — locked to known origins ───────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g. curl, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

app.use(morgan("dev"));
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ─── Shared State ─────────────────────────────────────────────────────────────
const appState = {
  activeFeature: "none",
  isProcessing: false,
  lastResult: null,
  debugMode: false,
  clients: new Set(),
  healthData: {
    heartRate: 72,
    temperature: 36.8,
    spO2: 98,
    bloodPressure: "120/80",
    lastUpdated: new Date().toISOString()
  }
};
app.locals.appState = appState;

// Periodic health data fluctuation mock
setInterval(() => {
  if (appState.healthData) {
    appState.healthData.heartRate = Math.floor(70 + Math.random() * 8);
    appState.healthData.temperature = parseFloat((36.5 + Math.random() * 0.5).toFixed(1));
    appState.healthData.spO2 = Math.floor(97 + Math.random() * 3);
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
    if (gloveBuffer.length > 0) {
      broadcast(appState, { type: "GLOVE_WORD", payload: { word: gloveBuffer } });
      gloveBuffer = "";
    }
  } else {
    gloveBuffer += cleanChar;
    broadcast(appState, { type: "GLOVE_CHAR", payload: { char: cleanChar, buffer: gloveBuffer } });

    gloveTimeout = setTimeout(() => {
      if (gloveBuffer.length > 0) {
        broadcast(appState, { type: "GLOVE_WORD", payload: { word: gloveBuffer } });
        gloveBuffer = "";
      }
    }, 3000);
  }
}

// ─── WebSocket – live state push ─────────────────────────────────────────────
app.ws("/ws", (ws) => {
  console.log("[WS] Client connected");
  appState.clients.add(ws);

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

// ─── REST Routes ─────────────────────────────────────────────────────────────
// AI proxy routes — use factory + strict rate limiter
app.use("/api/ocr", aiLimiter, createAIProxyRoute("/ocr", "ocr"));
app.use("/api/detection", aiLimiter, createAIProxyRoute("/detect", "detection"));
app.use("/api/navigation", aiLimiter, navigationRouter);
app.use("/api/scene", aiLimiter, sceneRouter);
app.use("/api/search", aiLimiter, searchRouter);
app.use("/api/currency", aiLimiter, currencyRouter);
app.use("/api/status", statusRouter);
app.use("/api/feedback", feedbackRouter);
app.use("/api/assistant", assistantRouter);
app.use("/api/history", historyRouter);

// Health check
app.get("/health", (_req, res) => res.json({ ok: true, ts: Date.now() }));

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("[ERROR]", err.message);
  const status = err.message.includes("CORS") ? 403 :
                 err.message.includes("file type") ? 415 : 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Backend running on http://localhost:${PORT}`);
  console.log(`🤖 AI Service expected at ${process.env.AI_SERVICE_URL || "http://localhost:8000"}\n`);
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
