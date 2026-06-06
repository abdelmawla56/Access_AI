"use client";

interface GloveLog {
  text: string;
  timestamp: string;
}

interface Props {
  history: GloveLog[];
  currentWord: string;
  onClear: () => void;
}

export default function GloveHistoryPanel({
  history,
  currentWord,
  onClear,
}: Props) {
  return (
    <div className="w-full glass-card p-6 flex flex-col gap-5 border border-white/20 shadow-lg rounded-3xl float-8 rise-in">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-brand-accent text-lg">🧤</span>
          <h2 className="text-brand-text font-black text-xs uppercase tracking-[0.2em]">
            Glove Translation
          </h2>
        </div>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-text active:scale-95 transition-all border border-brand-danger/20"
          >
            Clear History
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {/* Current Word / Buffer */}
        <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-brand-accent uppercase tracking-widest mb-1.5">
            Current Word Building Buffer
          </span>
          <p className="text-3xl font-black text-brand-text tracking-widest min-h-[40px] uppercase">
            {currentWord || <span className="opacity-25 font-light text-xl italic lowercase">waiting for gestures...</span>}
          </p>
        </div>

        {/* Translation Log */}
        <div className="flex flex-col gap-2.5 max-h-[180px] overflow-y-auto pr-1">
          <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest border-b border-white/5 pb-1">
            Translation Log ({history.length})
          </span>
          {history.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-xs text-brand-subtle italic">No phrases buffered yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {history.map((log, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white/40 border border-white/5 rounded-xl px-3 py-2 text-xs"
                >
                  <span className="font-bold text-brand-text uppercase tracking-wider">{log.text}</span>
                  <span className="text-[9px] text-brand-subtle">{log.timestamp}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
