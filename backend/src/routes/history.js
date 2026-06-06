/**
 * history.js — Scan history API
 * GET  /api/history       — last 20 scan results from SQLite
 * DELETE /api/history/:id — remove a specific scan entry
 */

const express = require("express");
const router = express.Router();
const { getHistory, deleteHistoryById } = require("../db");

// GET /api/history
router.get("/", (_req, res) => {
  try {
    const rows = getHistory.all();
    res.json({ ok: true, history: rows });
  } catch (err) {
    console.error("[HISTORY] get error:", err.message);
    res.status(500).json({ error: "Failed to fetch history." });
  }
});

// DELETE /api/history/:id
router.delete("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid id." });
  }
  try {
    const result = deleteHistoryById.run(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Entry not found." });
    }
    res.json({ ok: true, deleted: id });
  } catch (err) {
    console.error("[HISTORY] delete error:", err.message);
    res.status(500).json({ error: "Failed to delete entry." });
  }
});

module.exports = router;
