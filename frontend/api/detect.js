// Vercel Serverless Function wrapper for object detection
// This file forwards the request to the existing backend logic.
// It expects a POST with a multipart/form‑data field named "file" (the image).
// The actual detection code lives in `../backend/src/routes/ai-proxy.js` – we import the handler
// and invoke it with Vercel's request/response objects.

const path = require('path');
const detectHandler = require('../../../backend/src/routes/ai-proxy.js'); // adjust if needed

module.exports = async (req, res) => {
  // Vercel gives us a plain Node HTTP request; we need to mimic Express.
  // The imported handler expects (req, res) from Express, which are compatible enough.
  // Ensure body parsing – Vercel already parses JSON; for multipart we rely on the original handler.
  await detectHandler(req, res);
};
