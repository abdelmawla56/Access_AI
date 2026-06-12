"use client";

import { useEffect, useRef, useState, KeyboardEvent } from "react";

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
  onSendMessage?: (message: string) => void;
}

export default function AIAssistantModal({
  isOpen,
  messages,
  isListening,
  isResponding,
  onClose,
  onClearHistory,
  onSendMessage,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [inputText, setInputText] = useState("");
  const [isExiting, setIsExiting] = useState(false);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setIsExiting(false);
    }
  }, [isOpen]);

  // ── Send typed message ───────────────────────────────────────────────────
  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isResponding) return;
    setInputText("");
    onSendMessage?.(trimmed);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── End chat with brief transition ───────────────────────────────────────
  const handleEndChat = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsExiting(false);
      onClose();
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 transition-all duration-500 ${
        isExiting
          ? "opacity-0 scale-95 pointer-events-none"
          : "opacity-100 scale-100"
      }`}
      style={{ background: "rgba(10,10,20,0.88)", backdropFilter: "blur(20px)" }}
    >
      <div className="w-full max-w-4xl h-[85vh] bg-white/40 border border-white/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative transition-all duration-300">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-b border-white/20 flex items-center justify-between bg-white/20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#a78bfa] animate-pulse" />
            <h2 className="font-extrabold text-sm uppercase tracking-widest text-[#2d2d3a]">
              Symbio AI Assistant
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClearHistory}
              className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/30 hover:bg-white/50 text-[#6b6b8a] border border-white/30 active:scale-95 transition-all"
            >
              🧹 Clear
            </button>
            {/* ── END CHAT BUTTON ──────────────────────────────────────── */}
            <button
              onClick={handleEndChat}
              aria-label="End chat and return to main view"
              className="text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white border border-rose-400/40 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
            >
              ✕ End Chat
            </button>
          </div>
        </div>

        {/* ── Conversation List ────────────────────────────────────── */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 scrollbar-thin"
        >
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 max-w-md mx-auto my-auto">
              <span className="text-5xl animate-bounce">🤖</span>
              <h3 className="text-xl font-bold text-[#2d2d3a]">Hello, I am Symbio</h3>
              <p className="text-[#6b6b8a] text-sm leading-relaxed">
                I can see what is around you and answer any questions. Say{" "}
                <span className="text-[#a78bfa] font-bold italic">"Ask AI [message]"</span> or
                type below to begin.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {["What do you see?", "Describe the scene", "Any obstacles?", "Help me navigate"].map((q) => (
                  <button
                    key={q}
                    onClick={() => onSendMessage?.(q)}
                    className="px-4 py-2 rounded-full bg-white/60 border border-white/50 text-[#6b6b8a] text-xs font-semibold hover:bg-white/80 hover:text-[#2d2d3a] transition-all active:scale-95"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`max-w-[78%] rounded-3xl p-4 flex flex-col gap-1 transition-all duration-300 ${
                  msg.role === "user"
                    ? "bg-[#a78bfa] text-white rounded-tr-none self-end shadow-md"
                    : "bg-white/70 text-[#2d2d3a] border border-white/40 rounded-tl-none self-start shadow-sm"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  {msg.role === "user" ? "You" : "Symbio"}
                </span>
                <p className="text-sm md:text-base leading-relaxed">{msg.text}</p>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {isResponding && (
            <div className="bg-white/70 text-[#2d2d3a] border border-white/40 rounded-3xl rounded-tl-none p-4 max-w-[78%] self-start flex flex-col gap-2 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">Symbio</span>
              <div className="flex gap-1.5 items-center px-1 py-1">
                <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-bounce [animation-delay:0.15s]" />
                <span className="w-2 h-2 rounded-full bg-[#a78bfa] animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
          )}
        </div>

        {/* ── Voice status indicator ───────────────────────────────── */}
        <div className="px-6 py-2 border-t border-white/20 bg-white/10 flex items-center justify-center gap-3 flex-shrink-0">
          {isListening ? (
            <div className="flex items-center gap-1.5 h-5">
              {[0.1, 0.2, 0.3, 0.4, 0.5].map((delay, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-[#a78bfa] animate-bounce"
                  style={{ height: `${[12, 20, 28, 18, 10][i]}px`, animationDelay: `${delay}s` }}
                />
              ))}
            </div>
          ) : (
            <span className="w-2 h-2 rounded-full bg-gray-300" />
          )}
          <p className="text-xs font-bold uppercase tracking-wider text-[#6b6b8a]">
            {isListening
              ? "Listening — speak your question"
              : isResponding
              ? "Symbio is thinking..."
              : "Voice idle — type below or say 'Ask AI [message]'"}
          </p>
        </div>

        {/* ── Text Input Bar ───────────────────────────────────────── */}
        <div className="px-4 py-4 border-t border-white/20 bg-white/20 flex items-center gap-3 flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            disabled={isResponding}
            aria-label="Message to AI assistant"
            className="flex-1 bg-white/60 border border-white/50 rounded-2xl px-4 py-3 text-sm text-[#2d2d3a] placeholder-[#a89bc2] outline-none focus:border-[#a78bfa]/60 focus:bg-white/80 transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isResponding}
            aria-label="Send message"
            className="w-11 h-11 rounded-2xl bg-[#a78bfa] hover:bg-[#8b5cf6] text-white font-bold flex items-center justify-center transition-all active:scale-90 disabled:opacity-40 disabled:cursor-not-allowed shadow-md text-lg"
          >
            ↑
          </button>
        </div>

      </div>
    </div>
  );
}
