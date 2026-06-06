"use client";
import { Feature } from "@/lib/api";

interface Props {
  active: Feature;
  onChange: (f: Feature) => void;
  disabled?: boolean;
}

const FEATURES: { id: Feature; label: string; icon: string; desc: string; color: string }[] = [
  { id: "ocr",        label: "Text Reader",   icon: "📖", desc: "Extract printed text", color: "cyan" },
  { id: "detection",  label: "Object Vision", icon: "🔍", desc: "Identify surroundings", color: "violet" },
  { id: "navigation", label: "Navigator",     icon: "🧭", desc: "Spatial guidance",     color: "emerald" },
  { id: "none",       label: "Standby",       icon: "⏸",  desc: "Zero-G mode",          color: "subtle" },
];

export default function FeatureSelector({ active, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full px-2 rise-in rise-in-3" role="radiogroup" aria-label="Select feature">
      {FEATURES.map((f, idx) => (
        <button
          key={f.id}
          id={`feature-btn-${f.id}`}
          role="radio"
          aria-checked={active === f.id}
          aria-label={`${f.label}: ${f.desc}`}
          disabled={disabled}
          onClick={() => onChange(f.id)}
          className={`
            group relative flex flex-col items-center gap-3 p-5 rounded-3xl transition-all duration-500
            glass-card border border-white/5
            ${idx % 2 === 0 ? "float-1" : "float-2"}
            ${active === f.id ? "feature-active scale-105" : "hover:scale-[1.02] hover:bg-white/10 opacity-70 hover:opacity-100"}
            ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          {/* Neon Icon */}
          <span className={`text-4xl transition-all duration-500 holo-icon ${active === f.id ? "scale-110" : "grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100"}`} aria-hidden="true">
            {f.icon}
          </span>
          
          <div className="flex flex-col items-center gap-1">
            <span className={`text-sm font-bold tracking-tight transition-colors ${active === f.id ? "text-white" : "text-brand-muted"}`}>
              {f.label}
            </span>
            <span className="text-[10px] text-brand-subtle uppercase tracking-widest font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              {f.desc}
            </span>
          </div>

          {/* Holographic dot indicator */}
          {active === f.id && (
            <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-brand-cyan shadow-[0_0_10px_#22d3ee] animate-pulse" />
          )}
        </button>
      ))}
    </div>
  );
}
