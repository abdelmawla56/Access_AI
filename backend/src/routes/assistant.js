const express = require("express");
const router = express.Router();
const axios = require("axios");

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// In-memory conversation history per session (simple: single shared session for demo)
const conversationHistory = [];
const MAX_HISTORY = 10;

const SYSTEM_PROMPT = `You are Symbio, a compassionate AI assistant embedded in smart accessibility glasses
for visually impaired users. You must:
- Be concise (max 2 sentences unless the user needs detail)
- Always be warm, encouraging, and calm
- When given scene context (detected objects), use it to answer location/navigation questions
- Avoid markdown formatting — responses are spoken aloud via text-to-speech
- If asked to describe something, be spatial and directional (left, right, center, near, far)`;

/**
 * POST /api/assistant/chat
 * Body: { message: string, context?: string }
 * Returns: { reply: string, history: [] }
 */
router.post("/chat", async (req, res) => {
  const { message, context } = req.body;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "message is required" });
  }

  // Build contextual user turn
  const userText = context
    ? `[Scene context: ${context}]\n\nUser: ${message}`
    : `User: ${message}`;

  // Add to history
  conversationHistory.push({ role: "user", parts: [{ text: userText }] });
  if (conversationHistory.length > MAX_HISTORY * 2) {
    conversationHistory.splice(0, 2); // drop oldest pair
  }

  // If no API key, return a graceful mock response
  if (!GEMINI_API_KEY) {
    const fallback =
      "AI assistant is not configured. Please add a GEMINI_API_KEY to the backend environment file.";
    conversationHistory.push({ role: "model", parts: [{ text: fallback }] });
    return res.json({ reply: fallback, configured: false });
  }

  try {
    const payload = {
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: conversationHistory,
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 0.7,
      },
    };

    const response = await axios.post(GEMINI_URL, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });

    const reply =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I could not generate a response. Please try again.";

    conversationHistory.push({ role: "model", parts: [{ text: reply }] });

    res.json({ reply, configured: true });
  } catch (err) {
    const errMsg = err.response?.data?.error?.message || err.message;
    console.error("[ASSISTANT]", errMsg);
    // Return a fallback rather than crashing
    const fallback = "I had trouble connecting to the AI service. Please try again shortly.";
    res.json({ reply: fallback, error: errMsg, configured: !!GEMINI_API_KEY });
  }
});

/**
 * DELETE /api/assistant/history
 * Clears conversation history
 */
router.delete("/history", (_req, res) => {
  conversationHistory.length = 0;
  res.json({ ok: true, message: "Conversation history cleared." });
});

module.exports = router;
