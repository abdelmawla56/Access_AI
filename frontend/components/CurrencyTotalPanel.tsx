"use client";

interface CurrencyScan {
  currency: string;
  confidence: number;
  timestamp: string;
}

interface Props {
  scans: CurrencyScan[];
  total: number;
  onReset: () => void;
}

export default function CurrencyTotalPanel({ scans, total, onReset }: Props) {
  return (
    <div className="w-full glass-card p-6 flex flex-col gap-6 border border-white/20 shadow-lg rounded-3xl float-6 rise-in">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-amber-500 text-lg">💰</span>
          <h2 className="text-brand-text font-black text-xs uppercase tracking-[0.2em]">
            Currency Calculator
          </h2>
        </div>
        {total > 0 && (
          <button
            onClick={onReset}
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-text active:scale-95 transition-all border border-brand-danger/20"
          >
            Reset Calculator
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Box */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">
            Running Session Total
          </span>
          <span className="text-5xl font-black text-brand-text tracking-tight">
            ${total.toFixed(2)}
          </span>
          <span className="text-[10px] text-brand-muted mt-2 font-bold uppercase tracking-wider">
            Accumulated from scans
          </span>
        </div>

        {/* History Box */}
        <div className="bg-white/30 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 min-h-[120px] max-h-[180px] overflow-y-auto">
          <span className="text-[10px] font-black text-brand-muted uppercase tracking-widest border-b border-white/5 pb-1">
            Recognition Log ({scans.length})
          </span>
          {scans.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-center">
              <p className="text-xs text-brand-subtle italic">No bills scanned yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {scans.map((scan, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-white/40 border border-white/5 rounded-xl px-3 py-2 text-xs"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-brand-text capitalize">{scan.currency}</span>
                    <span className="text-[9px] text-brand-subtle">{scan.timestamp}</span>
                  </div>
                  <span className="font-mono text-brand-accent font-black">
                    {Math.round(scan.confidence * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
