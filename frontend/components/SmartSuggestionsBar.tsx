"use client";

import { useEffect, useState } from "react";

interface Props {
  suggestion: string | null;
  onDismiss: () => void;
}

export default function SmartSuggestionsBar({ suggestion, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (suggestion) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        // Delay parent update to match fade-out transition
        setTimeout(onDismiss, 300);
      }, 6000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [suggestion, onDismiss]);

  if (!suggestion || !visible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 w-full max-w-lg px-4 transition-all duration-300 animate-rise-in">
      <div className="bg-brand-dark/90 backdrop-blur-md border border-brand-accent/30 shadow-lg shadow-brand-accent/5 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xl animate-bounce">💡</span>
          <div className="flex flex-col gap-0.5">
            <span className="text-[9px] font-black text-brand-accent uppercase tracking-[0.2em]">
              Smart Suggestion
            </span>
            <p className="text-xs text-brand-text font-bold leading-snug">
              {suggestion}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="text-brand-muted hover:text-brand-text text-xs flex items-center justify-center p-1 rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-90"
          aria-label="Dismiss suggestion"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
