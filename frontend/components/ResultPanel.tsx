"use client";

interface DebugInfo {
  fps?: number | null;
  confidence?: number | null;
  processingMs?: number | null;
  speechConfidence?: number | null;
  ocrAccuracy?: number | null;
  model?: string;
}

interface Props {
  feature: string;
  text?: string;
  currency?: string;
  glove?: string;
  hint?: string;
  detections?: { label: string; confidence: number }[];
  error?: string | null;
  debugMode: boolean;
  debug?: DebugInfo;
  onReadAloud?: () => void;
}

export default function ResultPanel({
  feature, text, currency, glove, hint, detections, error, debugMode, debug, onReadAloud,
}: Props) {
  if (feature === "none" && !glove) {
    return (
      <div className="w-full glass-card p-8 text-center float-3 rise-in rise-in-5 border-white/5">
        <p className="text-brand-muted text-sm tracking-wide leading-relaxed font-medium">
          Select a system module or say <br/>
          <span className="text-brand-cyan font-bold neon-cyan italic">"Start Vision"</span> to begin scanning.
        </p>
      </div>
    );
  }

  return (
    <div
      className="w-full glass-card p-6 flex flex-col gap-6 float-4 rise-in rise-in-5 border-white/10"
      aria-live="polite"
      aria-label="AI result"
    >
      {/* Error State */}
      {error && (
        <div className="flex items-start gap-4 bg-brand-danger/10 border border-brand-danger/30 rounded-2xl p-4 animate-pulse">
          <span className="text-2xl">⚠️</span>
          <p className="text-brand-danger text-sm font-bold tracking-tight">{error}</p>
        </div>
      )}

      {/* OCR Result View */}
      {feature === "ocr" && text !== undefined && !error && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-brand-cyan font-black text-xs uppercase tracking-[0.2em] neon-cyan">
              Transmission Data
            </h2>
            {text && onReadAloud && (
              <button
                id="read-aloud-btn"
                onClick={onReadAloud}
                className="text-[10px] uppercase tracking-widest px-4 py-2 rounded-full glass-card hover:bg-white/10 transition-all font-black text-white active:scale-95"
              >
                🔊 Play Audio
              </button>
            )}
          </div>
          <div className="bg-white/5 rounded-2xl p-5 min-h-[100px] border border-white/5">
            {text ? (
              <p className="text-brand-text text-base leading-relaxed font-light">{text}</p>
            ) : (
              <p className="text-brand-subtle italic text-sm">No text detected in optical field.</p>
            )}
          </div>
        </div>
      )}

      {/* Currency Result View */}
      {feature === "currency" && currency !== undefined && !error && (
        <div className="flex flex-col gap-5">
          <h2 className="text-yellow-400 font-black text-xs uppercase tracking-[0.2em] border-b border-white/5 pb-3">
            Currency Analysis
          </h2>
          <div className="bg-yellow-400/10 rounded-2xl p-6 border border-yellow-400/30 text-center">
            {currency ? (
              <p className="text-yellow-300 text-3xl font-black tracking-tight">{currency}</p>
            ) : (
              <p className="text-brand-subtle italic text-sm">No currency detected.</p>
            )}
          </div>
        </div>
      )}

      {/* Glove Sign Output (Always overlays if present recently) */}
      {glove && (
        <div className="flex flex-col gap-5 mt-2">
          <h2 className="text-brand-accent font-black text-xs uppercase tracking-[0.2em] border-b border-white/5 pb-3">
            Glove Translation
          </h2>
          <div className="bg-brand-accent/10 rounded-2xl p-6 border border-brand-accent/30 text-center animate-pulse">
            <p className="text-white text-4xl font-black tracking-widest">{glove}</p>
          </div>
        </div>
      )}

      {/* Detection Result View */}
      {feature === "detection" && detections !== undefined && !error && (
        <div className="flex flex-col gap-5">
          <h2 className="text-brand-violet font-black text-xs uppercase tracking-[0.2em] neon-violet border-b border-white/5 pb-3">
            Object Array Detected ({detections.length})
          </h2>
          {detections.length === 0 ? (
            <p className="text-brand-subtle italic text-sm">Field of view clear.</p>
          ) : (
            <ul className="flex flex-wrap gap-3" aria-label="Detected objects">
              {detections.map((d, i) => (
                <li
                  key={i}
                  className="detection-badge badge-in"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <span className="opacity-60 mr-2">●</span>
                  <span className="capitalize">{d.label}</span>
                  <span className="ml-2 font-mono text-[10px] text-brand-cyan">
                    {Math.round(d.confidence * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Navigation Hint View */}
      {feature === "navigation" && hint && !error && (
        <div className="flex flex-col gap-5">
          <h2 className="text-brand-emerald font-black text-xs uppercase tracking-[0.2em] border-b border-white/5 pb-3" style={{ textShadow: '0 0 15px #10b981' }}>
            Spatial Guidance
          </h2>
          <div className="bg-brand-emerald/5 rounded-2xl p-6 border border-brand-emerald/20">
            <p className="text-white text-xl font-bold tracking-tight leading-tight">{hint}</p>
          </div>
        </div>
      )}

      {/* Scene Result View */}
      {feature === "scene" && hint && !error && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-brand-accent font-black text-xs uppercase tracking-[0.2em] border-b border-white/5 pb-3">
              Scene Description
            </h2>
            {onReadAloud && (
              <button
                id="read-scene-btn"
                onClick={onReadAloud}
                className="text-[10px] uppercase tracking-widest px-4 py-2 rounded-full glass-card hover:bg-white/10 transition-all font-black text-white active:scale-95 animate-pulse"
              >
                🔊 Play Audio
              </button>
            )}
          </div>
          <div className="bg-brand-accent/5 rounded-2xl p-6 border border-brand-accent/20">
            <p className="text-brand-text text-lg font-bold leading-relaxed">{hint}</p>
          </div>
        </div>
      )}

      {/* Telemetry Debug Panel */}
      {debugMode && debug && (
        <div className="mt-3 border-t border-white/10 pt-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-brand-cyan/70">Live Telemetry</span>
          </div>
          <div className="grid grid-cols-3 gap-2">

            {/* FPS */}
            <div className="flex flex-col gap-1 bg-white/5 rounded-xl p-2.5 border border-white/5">
              <span className="text-[7px] font-black uppercase tracking-widest text-brand-subtle">FPS</span>
              <span className={`text-[13px] font-black font-mono ${
                (debug.fps ?? 0) >= 24 ? 'text-emerald-400' :
                (debug.fps ?? 0) >= 12 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {debug.fps != null ? debug.fps : <span className="text-white/20">—</span>}
              </span>
            </div>

            {/* Detection Confidence */}
            <div className="flex flex-col gap-1 bg-white/5 rounded-xl p-2.5 border border-white/5">
              <span className="text-[7px] font-black uppercase tracking-widest text-brand-subtle">Det. Conf</span>
              <span className={`text-[13px] font-black font-mono ${
                (debug.confidence ?? 0) >= 80 ? 'text-emerald-400' :
                (debug.confidence ?? 0) >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {debug.confidence != null ? `${debug.confidence}%` : <span className="text-white/20">—</span>}
              </span>
            </div>

            {/* Response Latency */}
            <div className="flex flex-col gap-1 bg-white/5 rounded-xl p-2.5 border border-white/5">
              <span className="text-[7px] font-black uppercase tracking-widest text-brand-subtle">Latency</span>
              <span className={`text-[13px] font-black font-mono ${
                (debug.processingMs ?? 9999) <= 500 ? 'text-emerald-400' :
                (debug.processingMs ?? 9999) <= 1500 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {debug.processingMs != null ? `${debug.processingMs}ms` : <span className="text-white/20">—</span>}
              </span>
            </div>

            {/* Speech Recognition Confidence */}
            <div className="flex flex-col gap-1 bg-white/5 rounded-xl p-2.5 border border-white/5">
              <span className="text-[7px] font-black uppercase tracking-widest text-brand-subtle">Speech</span>
              <span className={`text-[13px] font-black font-mono ${
                (debug.speechConfidence ?? 0) >= 0.8 ? 'text-emerald-400' :
                (debug.speechConfidence ?? 0) >= 0.5 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {debug.speechConfidence != null
                  ? `${Math.round(debug.speechConfidence * 100)}%`
                  : <span className="text-white/20">—</span>}
              </span>
            </div>

            {/* OCR Accuracy */}
            <div className="flex flex-col gap-1 bg-white/5 rounded-xl p-2.5 border border-white/5">
              <span className="text-[7px] font-black uppercase tracking-widest text-brand-subtle">OCR Acc</span>
              <span className={`text-[13px] font-black font-mono ${
                (debug.ocrAccuracy ?? 0) >= 80 ? 'text-emerald-400' :
                (debug.ocrAccuracy ?? 0) >= 50 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {debug.ocrAccuracy != null ? `${debug.ocrAccuracy}%` : <span className="text-white/20">—</span>}
              </span>
            </div>

            {/* Current Model */}
            <div className="flex flex-col gap-1 bg-white/5 rounded-xl p-2.5 border border-white/5 col-span-1">
              <span className="text-[7px] font-black uppercase tracking-widest text-brand-subtle">Model</span>
              <span className="text-[10px] font-black font-mono text-brand-cyan truncate" title={debug.model}>
                {debug.model ?? <span className="text-white/20">—</span>}
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
