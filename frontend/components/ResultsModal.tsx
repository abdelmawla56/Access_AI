"use client";

import { motion, AnimatePresence } from "framer-motion";

interface ResultsModalProps {
  show: boolean;
  onClose: () => void;
  feature: string;
  text?: string;
  currency?: string;
  hint?: string;
  detections?: { label: string; confidence: number }[];
  error?: string | null;
  onReadAloud?: () => void;
}

export default function ResultsModal({
  show,
  onClose,
  feature,
  text,
  currency,
  hint,
  detections,
  error,
  onReadAloud,
}: ResultsModalProps) {
  const hasResults = text || currency || hint || (detections && detections.length > 0) || error;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="results-panel"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 60 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="absolute left-[calc(50%+290px)] top-1/2 -translate-y-1/2 w-[340px] pointer-events-auto bg-white/60 backdrop-blur-xl p-6 rounded-[2rem] flex flex-col gap-5 border border-white/70 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.12)] text-[#2d2d3a] z-40"
        >
          {/* ── Header ─────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <h2 className="text-lg font-black flex items-center gap-2 text-[#2d2d3a]">
              <span>📊</span> Data Center
            </h2>
            <button
              onClick={onClose}
              aria-label="Close results panel"
              className="w-8 h-8 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center text-[#6b6b8a] hover:text-[#2d2d3a] transition-all active:scale-90 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {/* ── Content ────────────────────────────────────────────────── */}
          <div className="flex flex-col gap-4 min-h-[160px]">

            {/* Empty state */}
            {!hasResults && (
              <div className="flex flex-col items-center justify-center h-full pt-6 opacity-60">
                <span className="text-4xl mb-3">📡</span>
                <p className="italic text-gray-600 font-medium text-sm">Awaiting scan data...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-200 text-sm">
                <span className="font-bold">Error: </span>{error}
              </div>
            )}

            {/* OCR */}
            {feature === "ocr" && text !== undefined && !error && (
              <div>
                <h3 className="font-bold text-[#6ab4e8] mb-2 uppercase tracking-widest text-xs">
                  Detected Text
                </h3>
                <div className="bg-white/60 p-4 rounded-xl border border-white/50 max-h-48 overflow-y-auto scrollbar-thin">
                  {text
                    ? <p className="text-base leading-relaxed whitespace-pre-wrap">{text}</p>
                    : <p className="italic text-gray-500 text-sm">No text detected.</p>
                  }
                </div>
                {text && onReadAloud && (
                  <button
                    onClick={onReadAloud}
                    className="mt-3 bg-[#6ab4e8] text-white px-5 py-2 rounded-full font-bold shadow-sm hover:opacity-90 flex items-center gap-2 cursor-pointer transition-all text-sm active:scale-95"
                  >
                    <span>🔊</span> Read Aloud
                  </button>
                )}
              </div>
            )}

            {/* Currency */}
            {feature === "currency" && currency !== undefined && !error && (
              <div>
                <h3 className="font-bold text-[#6ab4e8] mb-2 uppercase tracking-widest text-xs">
                  Currency Identified
                </h3>
                <div className="bg-white/60 p-6 rounded-xl border border-white/50 text-center">
                  {currency
                    ? <p className="text-4xl font-black text-[#2d2d3a]">{currency}</p>
                    : <p className="italic text-gray-500 text-sm">No currency detected.</p>
                  }
                </div>
              </div>
            )}

            {/* Object Detection */}
            {feature === "detection" && detections !== undefined && !error && (
              <div>
                <h3 className="font-bold text-[#a881e6] mb-3 uppercase tracking-widest text-xs">
                  Objects Detected ({detections.length})
                </h3>
                {detections.length === 0 ? (
                  <p className="italic text-gray-500 font-medium text-sm">Field of view clear.</p>
                ) : (
                  <ul className="flex flex-wrap gap-2">
                    {detections.map((d, i) => (
                      <li
                        key={i}
                        className="px-3 py-1.5 bg-[#f0eaff] border border-[#d8cbf2] rounded-full shadow-sm flex items-center gap-1.5 transition-all hover:scale-105"
                      >
                        <span className="text-[#a881e6] text-xs">●</span>
                        <span className="capitalize font-bold text-[#2d2d3a] text-sm">{d.label}</span>
                        <span className="text-[10px] text-[#8b75ba] font-black tracking-wider">
                          {Math.round(d.confidence * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Navigation */}
            {feature === "navigation" && hint && !error && (
              <div>
                <h3 className="font-bold text-[#6ab4e8] mb-2 uppercase tracking-widest text-xs">
                  Spatial Guidance
                </h3>
                <div className="bg-white/60 p-4 rounded-xl border border-white/50">
                  <p className="text-base font-bold leading-relaxed">{hint}</p>
                </div>
              </div>
            )}

            {/* Scene Description */}
            {feature === "scene" && hint && !error && (
              <div>
                <h3 className="font-bold text-[#6ab4e8] mb-2 uppercase tracking-widest text-xs">
                  Scene Description
                </h3>
                <div className="bg-white/60 p-4 rounded-xl border border-white/50 max-h-48 overflow-y-auto scrollbar-thin">
                  <p className="text-sm font-medium leading-relaxed">{hint}</p>
                </div>
                {onReadAloud && (
                  <button
                    onClick={onReadAloud}
                    className="mt-3 bg-[#6ab4e8] text-white px-5 py-2 rounded-full font-bold shadow-sm hover:opacity-90 flex items-center gap-2 cursor-pointer transition-all text-sm active:scale-95"
                  >
                    <span>🔊</span> Read Aloud
                  </button>
                )}
              </div>
            )}

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
