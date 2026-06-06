"use client";

import { useEffect, useState } from "react";

interface HistoryEntry {
  id: number;
  feature: string;
  result_text: string;
  confidence: number;
  duration_ms: number;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onReplay: (text: string) => void;
}

const FEATURE_ICONS: Record<string, string> = {
  ocr: "📖",
  detection: "🔍",
  navigation: "🧭",
  scene: "🖼️",
  search: "🔎",
  currency: "💵",
};

export default function HistoryPanel({ isOpen, onClose, onReplay }: Props) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${BASE}/api/history`);
      if (!res.ok) throw new Error("Failed to load history.");
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err: any) {
      setError(err.message || "Could not load scan history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const deleteEntry = async (id: number) => {
    try {
      const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${BASE}/api/history/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete entry.");
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete history item.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-slate-950/90 backdrop-blur-2xl border-l border-white/10 z-[80] shadow-2xl flex flex-col animate-slide-in">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⏳</span>
          <h2 className="text-lg font-black tracking-wide text-white uppercase">Scan History</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider active:scale-95"
        >
          Close ✕
        </button>
      </div>

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {loading && (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            <span className="animate-spin mr-2">⚙️</span> Loading history...
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 gap-2">
            <span className="text-3xl">📭</span>
            <p className="text-sm font-medium">No scan history recorded yet.</p>
          </div>
        )}

        {!loading &&
          !error &&
          history.map((entry) => {
            const timeStr = new Date(entry.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return (
              <div
                key={entry.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2 hover:bg-white/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{FEATURE_ICONS[entry.feature] || "🤖"}</span>
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      {entry.feature}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{timeStr}</span>
                  </div>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-[10px] text-rose-400 hover:text-rose-300 transition-colors uppercase font-bold"
                  >
                    Delete
                  </button>
                </div>
                
                <p className="text-sm text-gray-200 font-light line-clamp-3 leading-relaxed">
                  {entry.result_text || <span className="italic text-gray-500">No output details</span>}
                </p>

                <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/5">
                  <div className="flex gap-3 text-[10px] text-gray-400 font-mono">
                    {entry.confidence !== null && (
                      <span>Conf: {Math.round(entry.confidence * 100)}%</span>
                    )}
                    <span>{entry.duration_ms}ms</span>
                  </div>
                  <button
                    onClick={() => onReplay(entry.result_text)}
                    disabled={!entry.result_text}
                    className="text-[10px] px-3 py-1 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-black uppercase tracking-wider transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    🔊 Replay
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
