"use client";

import { useState } from "react";

interface CommandGroup {
  category: string;
  commands: { text: string; description: string }[];
}

const COMMAND_GROUPS: CommandGroup[] = [
  {
    category: "Navigation & System",
    commands: [
      { text: '"Hey Symbio"', description: "Wake word to start listening" },
      { text: '"Start Vision" / "Scan"', description: "Activate current scanning mode" },
      { text: '"Navigation"', description: "Switch to Real-time Navigation" },
      { text: '"Stop Vision"', description: "Deactivate active scanning mode" },
    ],
  },
  {
    category: "AI & Scene Analysis",
    commands: [
      { text: '"Describe Scene" / "What\'s around me"', description: "Describe full spatial layout" },
      { text: '"Find [object]" / "Where is my [object]"', description: "Continuous search for target object" },
      { text: '"Ask AI [message]" / "Hey assistant"', description: "Engage Gemini Assistant" },
      { text: '"Read this"', description: "Read printed text using OCR" },
    ],
  },
  {
    category: "Tools & Assistance",
    commands: [
      { text: '"Currency"', description: "Switch to Currency Recognition" },
      { text: '"Total" / "Reset Total"', description: "Hear accumulated total / clear total" },
      { text: '"What did you see" / "Have you seen [object]"', description: "Query session memory" },
      { text: '"Glove Mode"', description: "Switch to Sign-Language Glove translation" },
      { text: '"Emergency" / "SOS"', description: "Trigger Emergency Assistance mode" },
    ],
  },
];

export default function VoiceCommandsGuide() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: "fixed", top: "100px", left: "24px", zIndex: 9999 }}>
      {isOpen ? (
        <div className="w-80 max-h-[500px] flex flex-col glass-card border border-white/20 shadow-2xl rounded-3xl p-5 overflow-hidden transition-all duration-300 animate-rise-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-brand-accent text-lg">🎙️</span>
              <h3 className="font-bold text-sm tracking-wide text-brand-text uppercase">Voice Command HUD</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-brand-muted text-xs flex items-center justify-center transition-all active:scale-95"
              aria-label="Close guide"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 max-h-[380px]">
            {COMMAND_GROUPS.map((group, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <h4 className="text-[10px] font-black text-brand-accent uppercase tracking-widest">
                  {group.category}
                </h4>
                <div className="flex flex-col gap-1.5">
                  {group.commands.map((cmd, cmdIdx) => (
                    <div
                      key={cmdIdx}
                      className="bg-white/5 border border-white/5 rounded-xl p-2.5 flex flex-col gap-1 hover:bg-white/10 transition-colors"
                    >
                      <code className="text-xs font-mono font-bold text-brand-accent hover:text-brand-accentHover">
                        {cmd.text}
                      </code>
                      <span className="text-[11px] text-brand-muted leading-snug">
                        {cmd.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-brand-accent text-white px-5 py-3 rounded-full shadow-lg shadow-brand-accent/20 hover:bg-brand-accentHover transition-all active:scale-95 hover:scale-105 font-bold text-xs uppercase tracking-widest border border-white/15"
          aria-label="Open voice commands guide"
        >
          <span>🎙️</span>
          <span>Voice Commands</span>
        </button>
      )}
    </div>
  );
}
