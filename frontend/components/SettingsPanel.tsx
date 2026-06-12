"use client";

import React from "react";
import { AccessAISettings } from "@/hooks/useSettings";
interface Props {
  isOpen: boolean;
  onClose: () => void;
  settings: AccessAISettings;
  onSettingChange: <K extends keyof AccessAISettings>(key: K, value: AccessAISettings[K]) => void;
}

export default function SettingsPanel({
  isOpen,
  onClose,
  settings,
  onSettingChange,
}: Props) {
    // Helper to change camera facing mode
  const handleCameraFacingChange = (mode: "environment" | "user") => {
    onSettingChange('cameraFacing', mode as AccessAISettings['cameraFacing']);
  };

  // Focus trap: focus first control on open
  const firstRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (isOpen && firstRef.current) {
      const focusable = firstRef.current.querySelector<HTMLElement>('input, select, button');
      focusable?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-full sm:w-[400px] bg-slate-950/90 backdrop-blur-2xl border-r border-white/10 z-[80] shadow-2xl flex flex-col animate-slide-in-left">
      {/* Header */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚙️</span>
          <h2 className="text-lg font-black tracking-wide text-white uppercase">System Settings</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider active:scale-95"
        >
          Close ✕
        </button>
      </div>

      {/* Settings Options */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8" ref={firstRef}>
        
        {/* TTS Speed */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-black uppercase tracking-wider text-sky-400" htmlFor="tts-speed">
            Speech Rate (TTS Speed)
          </label>
          <div className="flex items-center gap-4">
            <input
              id="tts-speed"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.ttsSpeed}
              onChange={(e) => onSettingChange('ttsSpeed', parseFloat(e.target.value))}
              className="flex-1 accent-sky-400 cursor-pointer bg-white/10 h-1.5 rounded-lg appearance-none"
            />
            <span className="text-sm font-mono text-white font-bold w-12 text-right">
              {settings.ttsSpeed.toFixed(1)}x
            </span>
          </div>
          <p className="text-[10px] text-gray-400 italic leading-relaxed">
            Adjust the rate at which voice instructions are synthesized.
          </p>
        </div>

        {/* OCR Language */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-black uppercase tracking-wider text-sky-400" htmlFor="ocr-lang">
            OCR Language
          </label>
          <select
            id="ocr-lang"
            value={settings.ocrLanguage}
            onChange={(e) => onSettingChange('ocrLanguage', e.target.value as AccessAISettings['ocrLanguage'])}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl p-3 text-sm focus:outline-none focus:border-sky-400/50"
          >
            <option value="eng" className="bg-slate-900">English Only</option>
            <option value="ara" className="bg-slate-900">Arabic Only</option>
            <option value="eng+ara" className="bg-slate-900">English and Arabic (Dual)</option>
          </select>
          <p className="text-[10px] text-gray-400 italic leading-relaxed">
            Choose the language model used for printed text recognition.
          </p>
        </div>

        {/* YOLO Confidence Threshold */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-black uppercase tracking-wider text-sky-400" htmlFor="yolo-confidence">
            Object Detection Threshold
          </label>
          <div className="flex items-center gap-4">
            <input
              id="yolo-confidence"
              type="range"
              min="0.3"
              max="0.9"
              step="0.05"
              value={settings.confidenceThreshold}
              onChange={(e) => onSettingChange('confidenceThreshold', parseFloat(e.target.value))}
              className="flex-1 accent-sky-400 cursor-pointer bg-white/10 h-1.5 rounded-lg appearance-none"
            />
            <span className="text-sm font-mono text-white font-bold w-12 text-right">
              {Math.round(settings.confidenceThreshold * 100)}%
            </span>
          </div>
          <p className="text-[10px] text-gray-400 italic leading-relaxed">
            Configure YOLO inference sensitivity. Lower detects more items; higher reduces false alarms.
          </p>
        </div>

        {/* Camera Facing Mode */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-black uppercase tracking-wider text-sky-400" htmlFor="camera-facing">
            Active Camera Lens
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => handleCameraFacingChange('environment')}
              className={`flex-1 p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                settings.cameraFacing === "environment"
                  ? "bg-sky-500/20 border-sky-400 text-sky-300"
                  : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              Back (Env)
            </button>
            <button
              onClick={() => handleCameraFacingChange('user')}
              className={`flex-1 p-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${
                settings.cameraFacing === "user"
                  ? "bg-sky-500/20 border-sky-400 text-sky-300"
                  : "bg-white/5 border-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              Front (Self)
            </button>
          </div>
          <p className="text-[10px] text-gray-400 italic leading-relaxed">
            Switch between back environment lens and front selfie lens.
          </p>
        </div>

      </div>
    </div>
  );
}
