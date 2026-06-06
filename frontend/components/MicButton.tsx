"use client";

interface Props {
  isListening: boolean;
  isProcessing: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export default function MicButton({ isListening, isProcessing, onToggle, disabled }: Props) {
  const label = isListening ? "Stop listening" : "Start listening";

  return (
    <div className="relative flex flex-col items-center justify-center gap-12 py-8 rise-in rise-in-2">
      <div className="relative flex items-center justify-center">
        {/* Ripple rings when listening */}
        {isListening && (
          <>
            <span className="absolute w-40 h-40 rounded-full border border-brand-cyan/30 animate-ripple-out" />
            <span className="absolute w-32 h-32 rounded-full border border-brand-cyan/50 animate-ripple-out [animation-delay:0.6s]" />
          </>
        )}

        {/* The Mercury Orb */}
        <button
          id="mic-toggle-btn"
          onClick={onToggle}
          disabled={disabled}
          aria-label={label}
          aria-pressed={isListening}
          className={`
            relative z-10 w-28 h-28 rounded-full transition-all duration-500
            flex items-center justify-center text-4xl
            focus:outline-none focus:ring-4 focus:ring-brand-accent/40
            ${isListening
              ? "mercury-orb listening scale-110"
              : "mercury-orb hover:scale-105 active:scale-95"
            }
            ${disabled ? "opacity-30 cursor-not-allowed grayscale" : "cursor-pointer"}
          `}
        >
          {isProcessing ? (
            <span className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin-fast" />
          ) : (
            <span className={`transition-transform duration-500 ${isListening ? "scale-110" : ""}`}>
              {isListening ? "🎙️" : "🎤"}
            </span>
          )}
        </button>
      </div>

      {/* Status label with glow */}
      <div className="flex flex-col items-center gap-1">
        <span
          aria-live="polite"
          className={`
            text-sm font-black tracking-[0.2em] uppercase transition-all duration-500
            ${isProcessing ? "text-brand-warning animate-pulse" : isListening ? "text-brand-cyan neon-cyan" : "text-brand-muted"}
          `}
        >
          {isProcessing ? "Analyzing Environment" : isListening ? "Voice Active" : "Standby"}
        </span>
        <p className="text-[10px] text-brand-subtle font-mono uppercase tracking-widest">
          {isListening ? "Listening for commands..." : "Tap to activate Assistant"}
        </p>
      </div>
    </div>
  );
}
