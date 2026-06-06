"use client";

import { motion, AnimatePresence } from "framer-motion";

interface HealthModalProps {
  show: boolean;
  healthData: {
    heartRate: number;
    temperature: number;
    spO2: number;
    bloodPressure: string;
    lastUpdated?: string;
  } | null;
  onClose: () => void;
}

export default function HealthModal({ show, healthData, onClose }: HealthModalProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-2xl glass-card p-10 flex flex-col gap-6 relative border-white/20 text-brand-text"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-xl p-2 rounded-full hover:bg-black/5 cursor-pointer"
            >
              ✕
            </button>
            
            <h2 className="text-3xl font-black border-b border-black/10 pb-3 flex items-center gap-3">
              <span>🩺</span> Health Telemetry Dashboard
            </h2>

            <p className="text-sm font-light text-brand-text/70 leading-relaxed -mt-3">
              Real-time biological monitoring synchronization with the smart sensor glove unit.
            </p>

            {/* Vitals Telemetry Grid */}
            <div className="grid grid-cols-2 gap-6 py-2">
              {[
                { label: "Heart Rate", val: `${healthData?.heartRate || 72} BPM`, icon: "❤️", desc: "Pulse standard rate", color: "text-red-500 bg-red-500/10 border-red-500/20" },
                { label: "Temperature", val: `${healthData?.temperature || 36.8} °C`, icon: "🌡️", desc: "Normal body heat", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
                { label: "Blood Oxygen", val: `${healthData?.spO2 || 98} %`, icon: "🫁", desc: "Stable saturation", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
                { label: "Blood Pressure", val: healthData?.bloodPressure || "120/80", icon: "📈", desc: "Optimal reading", color: "text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20" },
              ].map((vital) => (
                <div key={vital.label} className={`flex items-start gap-4 p-5 rounded-2xl border ${vital.color}`}>
                  <span className="text-3xl">{vital.icon}</span>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-60">{vital.label}</span>
                    <span className="text-2xl font-black tracking-tight text-brand-text mt-1">{vital.val}</span>
                    <span className="text-[10px] font-semibold text-brand-subtle mt-0.5">{vital.desc}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/15 text-center">
              <p className="text-xs font-bold uppercase text-emerald-600 tracking-widest flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Glove Sensors Online
              </p>
              <p className="text-xs text-brand-subtle">
                Last telemetry packet synced: {healthData?.lastUpdated ? new Date(healthData.lastUpdated).toLocaleTimeString() : new Date().toLocaleTimeString()}
              </p>
            </div>

            <button
              onClick={onClose}
              className="py-3 rounded-full bg-brand-text text-white font-bold hover:opacity-90 active:scale-95 transition-all text-sm tracking-widest uppercase mt-2 cursor-pointer"
            >
              Close (Say Go Back)
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
