"use client";

interface MemoryItem {
  label: string;
  timestamp: string;
  feature: string;
  count: number;
}

interface Props {
  memory: MemoryItem[];
  onClear: () => void;
}

export default function EnvMemoryPanel({ memory, onClear }: Props) {
  return (
    <div className="w-full glass-card p-6 flex flex-col gap-5 border border-white/20 shadow-lg rounded-3xl float-7 rise-in">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-brand-accent text-lg">🧠</span>
          <h2 className="text-brand-text font-black text-xs uppercase tracking-[0.2em]">
            Environment Memory
          </h2>
        </div>
        {memory.length > 0 && (
          <button
            onClick={onClear}
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-brand-danger/10 hover:bg-brand-danger/20 text-brand-text active:scale-95 transition-all border border-brand-danger/20"
          >
            Clear Memory
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {memory.length === 0 ? (
          <div className="text-center py-8 bg-white/30 rounded-2xl border border-white/5">
            <p className="text-xs text-brand-subtle italic">Memory is empty. Points are added as you scan.</p>
          </div>
        ) : (
          <div className="relative border-l border-white/20 pl-4 ml-2 flex flex-col gap-4 max-h-[300px] overflow-y-auto scrollbar-thin pr-1">
            {memory.map((item, idx) => (
              <div key={idx} className="relative flex flex-col gap-1.5">
                {/* Timeline node icon */}
                <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-accent border-2 border-white/90 shadow-sm" />
                
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-brand-accent uppercase tracking-widest">
                    {item.feature}
                  </span>
                  <span className="text-[9px] text-brand-subtle">{item.timestamp}</span>
                </div>

                <div className="bg-white/40 border border-white/5 rounded-xl p-3 flex items-center justify-between hover:bg-white/55 transition-all">
                  <span className="text-sm font-bold text-brand-text capitalize">
                    {item.label}
                  </span>
                  {item.count > 1 && (
                    <span className="bg-brand-accent/15 text-brand-accent text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Seen {item.count}x
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
