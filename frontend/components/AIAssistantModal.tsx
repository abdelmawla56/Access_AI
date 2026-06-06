"use client";

import { useEffect, useRef } from "react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface Props {
  isOpen: boolean;
  messages: Message[];
  isListening: boolean;
  isResponding: boolean;
  onClose: () => void;
  onClearHistory: () => void;
}

export default function AIAssistantModal({
  isOpen,
  messages,
  isListening,
  isResponding,
  onClose,
  onClearHistory,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-brand-dark/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in">
      <div className="w-full max-w-4xl h-[85vh] bg-white/40 border border-white/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-brand-border flex items-center justify-between bg-white/20">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <h2 className="font-extrabold text-sm uppercase tracking-widest text-brand-text">
              Symbio Assistant Mode
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClearHistory}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-brand-text border border-white/5 active:scale-95 transition-all"
            >
              🧹 Clear Chat
            </button>
            <button
              onClick={onClose}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-brand-danger/20 hover:bg-brand-danger/30 text-brand-text active:scale-95 transition-all"
            >
              ✕ Exit
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-thin"
        >
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 max-w-md mx-auto">
              <span className="text-4xl animate-bounce">🤖</span>
              <h3 className="text-xl font-bold text-brand-text">Hello, I am Symbio</h3>
              <p className="text-brand-muted text-sm leading-relaxed">
                I can see what is around you and answer any questions. Say{" "}
                <span className="text-brand-accent font-bold italic">"Ask AI [message]"</span> or just speak to begin our conversation.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[75%] rounded-3xl p-4 flex flex-col gap-1 transition-all duration-300 ${
                  msg.role === "user"
                    ? "bg-brand-accent text-white rounded-tr-none self-end"
                    : "bg-white/50 text-brand-text border border-white/10 rounded-tl-none self-start"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  {msg.role === "user" ? "You" : "Symbio"}
                </span>
                <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
              </div>
            ))
          )}

          {isResponding && (
            <div className="bg-white/50 text-brand-text border border-white/10 rounded-3xl rounded-tl-none p-4 max-w-[75%] self-start flex flex-col gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                Symbio
              </span>
              <div className="flex gap-1.5 items-center px-1">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-text/50 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-text/50 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-brand-text/50 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
        </div>

        {/* Bottom Speech Visualizer Indicator */}
        <div className="p-6 border-t border-brand-border bg-white/20 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3">
            {isListening ? (
              <div className="flex items-center gap-1.5 h-8">
                <span className="w-1 h-3 bg-brand-accent rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-1 h-6 bg-brand-accent rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1 h-8 bg-brand-accent rounded-full animate-bounce [animation-delay:0.3s]" />
                <span className="w-1 h-5 bg-brand-accent rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="w-1 h-2 bg-brand-accent rounded-full animate-bounce [animation-delay:0.5s]" />
              </div>
            ) : isResponding ? (
              <div className="flex items-center gap-1.5 h-8">
                <span className="w-1 h-2 bg-brand-cyan rounded-full animate-bounce [animation-delay:0.1s]" />
                <span className="w-1 h-5 bg-brand-cyan rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1 h-8 bg-brand-cyan rounded-full animate-bounce [animation-delay:0.3s]" />
                <span className="w-1 h-6 bg-brand-cyan rounded-full animate-bounce [animation-delay:0.4s]" />
                <span className="w-1 h-3 bg-brand-cyan rounded-full animate-bounce [animation-delay:0.5s]" />
              </div>
            ) : (
              <span className="w-3 h-3 rounded-full bg-brand-subtle" />
            )}
            <p className="text-xs font-bold uppercase tracking-wider text-brand-text">
              {isListening
                ? "Listening to you..."
                : isResponding
                ? "Symbio is speaking..."
                : "Idle — Say 'Hey assistant' to reply"}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
