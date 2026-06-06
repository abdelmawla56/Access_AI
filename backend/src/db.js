/**
 * db.js — SQLite database initialization via better-sqlite3.
 * 
 * Tables:
 *   feedback     — user ratings and comments
 *   scan_history — log of every AI scan result
 */

const path = require("path");
const fs = require("fs");

// Ensure /data directory exists
const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;
try {
  const Database = require("better-sqlite3");
  db = new Database(path.join(dataDir, "accessai.db"));
  console.log("[DB] SQLite connected (better-sqlite3)");
} catch (err) {
  // Fallback: in-memory store if native compilation failed
  console.warn("[DB] better-sqlite3 unavailable, using in-memory fallback:", err.message);
  db = null;
}

// ─── Schema ──────────────────────────────────────────────────────────────────
if (db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS feedback (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      rating     INTEGER NOT NULL,
      comment    TEXT,
      user_email TEXT,
      feature    TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS scan_history (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      feature     TEXT NOT NULL,
      result_text TEXT,
      confidence  REAL,
      duration_ms INTEGER,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

// ─── In-memory fallback store (used when better-sqlite3 unavailable) ──────────
const memStore = { feedback: [], scanHistory: [] };

// ─── Prepared statements (or in-memory equivalents) ──────────────────────────
const insertFeedback = db
  ? db.prepare("INSERT INTO feedback (rating, comment, user_email, feature) VALUES (?, ?, ?, ?)")
  : {
      run: (rating, comment, email, feature) => {
        memStore.feedback.push({ rating, comment, user_email: email, feature, created_at: new Date().toISOString() });
        return { lastInsertRowid: memStore.feedback.length };
      },
    };

const getFeedback = db
  ? db.prepare("SELECT * FROM feedback ORDER BY created_at DESC LIMIT 50")
  : { all: () => memStore.feedback.slice(-50).reverse() };

const insertScan = db
  ? db.prepare("INSERT INTO scan_history (feature, result_text, confidence, duration_ms) VALUES (?, ?, ?, ?)")
  : {
      run: (feature, text, conf, ms) => {
        memStore.scanHistory.push({ feature, result_text: text, confidence: conf, duration_ms: ms, created_at: new Date().toISOString() });
        return { lastInsertRowid: memStore.scanHistory.length };
      },
    };

const getHistory = db
  ? db.prepare("SELECT * FROM scan_history ORDER BY created_at DESC LIMIT 20")
  : { all: () => memStore.scanHistory.slice(-20).reverse() };

const deleteHistoryById = db
  ? db.prepare("DELETE FROM scan_history WHERE id = ?")
  : {
      run: (id) => {
        const idx = memStore.scanHistory.findIndex((_, i) => i + 1 === id);
        if (idx > -1) memStore.scanHistory.splice(idx, 1);
        return { changes: idx > -1 ? 1 : 0 };
      },
    };

module.exports = { db, insertFeedback, getFeedback, insertScan, getHistory, deleteHistoryById };
