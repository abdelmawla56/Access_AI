"use client";

interface Props {
  target: string;
  found: boolean;
  position: string | null;
  hint: string;
  isSearching: boolean;
  onCancel: () => void;
}

export default function ObjectSearchPanel({
  target,
  found,
  position,
  hint,
  isSearching,
  onCancel,
}: Props) {
  return (
    <div className="w-full glass-card p-6 flex flex-col gap-5 border border-white/20 shadow-lg rounded-3xl float-5 rise-in">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-brand-pink text-lg animate-pulse">🔍</span>
          <h2 className="text-brand-text font-black text-xs uppercase tracking-[0.2em]">
            Smart Object Search
          </h2>
        </div>
        <button
          onClick={onCancel}
          className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-text active:scale-95 transition-all border border-brand-danger/20"
        >
          Cancel Search
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">
            Search Target
          </span>
          <p className="text-2xl font-black text-brand-text capitalize tracking-tight">
            {target || "None (Say 'find [object]')"}
          </p>
        </div>

        {isSearching && (
          <div className="flex items-center gap-3 bg-brand-pink/5 border border-brand-pink/20 rounded-2xl p-4">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-pink opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-pink"></span>
            </span>
            <p className="text-xs text-brand-text font-bold uppercase tracking-wider animate-pulse">
              Scanning environment continuously...
            </p>
          </div>
        )}

        {target && (
          <div
            className={`rounded-2xl p-5 border transition-all duration-300 ${
              found
                ? "bg-brand-emerald/10 border-brand-emerald/30 text-brand-text"
                : "bg-white/30 border-white/10 text-brand-muted"
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">{found ? "✨" : "📡"}</span>
              <span className="text-[10px] font-black uppercase tracking-widest">
                {found ? "Object Located" : "Scanning"}
              </span>
            </div>
            <p className="text-base font-bold leading-relaxed">{hint}</p>
            {found && position && (
              <div className="mt-3 inline-block bg-brand-emerald text-white text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                📍 {position}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
