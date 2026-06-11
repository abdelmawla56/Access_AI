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
  show, onClose, feature, text, currency, hint, detections, error, onReadAloud
}: ResultsModalProps) {
  // Ensure we don't render if it's not open or if there are no results to show
  const hasResults = text || currency || hint || detections || error;

  return (
    <AnimatePresence>
      {show && hasResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-2xl glass-card p-10 flex flex-col gap-6 relative border-white/20 text-[#2d2d3a]"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-xl p-2 rounded-full hover:bg-black/5 cursor-pointer text-gray-500 hover:text-gray-900"
            >
              ✕
            </button>
            
            <h2 className="text-3xl font-black border-b border-black/10 pb-3 flex items-center gap-3" style={{ color: '#2d2d3a' }}>
              <span>📊</span> Scan Results
            </h2>

            <div className="flex flex-col gap-4">
              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-lg border border-red-200">
                  <span className="font-bold">Error:</span> {error}
                </div>
              )}
              
              {feature === "ocr" && text !== undefined && !error && (
                <div>
                  <h3 className="font-bold text-[#6ab4e8] mb-2 uppercase tracking-widest text-sm">Detected Text</h3>
                  <div className="bg-white/50 p-4 rounded-xl border border-white/40">
                    {text ? <p className="text-lg leading-relaxed">{text}</p> : <p className="italic text-gray-500">No text detected.</p>}
                  </div>
                  {text && onReadAloud && (
                    <button onClick={onReadAloud} className="mt-4 bg-[#6ab4e8] text-white px-6 py-2.5 rounded-full font-bold shadow-sm hover:opacity-90 flex items-center gap-2 cursor-pointer transition-all">
                      <span>🔊</span> Read Aloud
                    </button>
                  )}
                </div>
              )}

              {feature === "currency" && currency !== undefined && !error && (
                <div>
                  <h3 className="font-bold text-[#6ab4e8] mb-2 uppercase tracking-widest text-sm">Currency Analysis</h3>
                  <div className="bg-white/50 p-6 rounded-xl border border-white/40 text-center">
                    {currency ? <p className="text-5xl font-black text-[#2d2d3a]">{currency}</p> : <p className="italic text-gray-500">No currency detected.</p>}
                  </div>
                </div>
              )}

              {feature === "detection" && detections !== undefined && !error && (
                <div>
                  <h3 className="font-bold text-[#6ab4e8] mb-2 uppercase tracking-widest text-sm">Object Array Detected ({detections.length})</h3>
                  {detections.length === 0 ? (
                    <p className="italic text-gray-500">Field of view clear.</p>
                  ) : (
                    <ul className="flex flex-wrap gap-2">
                      {detections.map((d, i) => (
                        <li key={i} className="px-4 py-2 bg-white/70 border border-white/40 rounded-full font-medium shadow-sm flex items-center gap-2">
                          <span className="capitalize">{d.label}</span>
                          <span className="text-xs text-[#6ab4e8] font-bold bg-blue-50 px-2 py-0.5 rounded-full">{Math.round(d.confidence * 100)}%</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {feature === "navigation" && hint && !error && (
                <div>
                  <h3 className="font-bold text-[#6ab4e8] mb-2 uppercase tracking-widest text-sm">Spatial Guidance</h3>
                  <div className="bg-white/50 p-6 rounded-xl border border-white/40">
                    <p className="text-xl font-bold">{hint}</p>
                  </div>
                </div>
              )}

              {feature === "scene" && hint && !error && (
                <div>
                  <h3 className="font-bold text-[#6ab4e8] mb-2 uppercase tracking-widest text-sm">Scene Description</h3>
                  <div className="bg-white/50 p-6 rounded-xl border border-white/40">
                    <p className="text-lg font-bold leading-relaxed">{hint}</p>
                  </div>
                  {onReadAloud && (
                    <button onClick={onReadAloud} className="mt-4 bg-[#6ab4e8] text-white px-6 py-2.5 rounded-full font-bold shadow-sm hover:opacity-90 flex items-center gap-2 cursor-pointer transition-all">
                      <span>🔊</span> Read Aloud
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="py-3 rounded-full bg-[#2d2d3a] text-white font-bold hover:opacity-90 active:scale-95 transition-all text-sm tracking-widest uppercase mt-4 cursor-pointer"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
