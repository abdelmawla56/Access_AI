"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Contact {
  name: string;
  phone: string;
  relationship: string;
}

interface EmergencyOverlayProps {
  show: boolean;
  timer: number;
  onCancel: () => void;
  gpsCoords: { latitude: number; longitude: number } | null;
  contacts: Contact[];
}

export default function EmergencyOverlay({
  show,
  timer,
  onCancel,
  gpsCoords,
  contacts,
}: EmergencyOverlayProps) {
  // Beep sound alert synthesized on each second change
  useEffect(() => {
    if (show && timer > 0) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(988, audioCtx.currentTime); // B5 note - urgent
          gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.2);
        }
      } catch (e) {
        console.error("Audio synth error:", e);
      }
    }
  }, [timer, show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-red-950/98 backdrop-blur-2xl text-white p-6 text-center overflow-y-auto"
        >
          {/* Pulse backdrop circle */}
          <div className="absolute w-[80vw] h-[80vw] max-w-[500px] max-h-[500px] bg-red-600/15 blur-[100px] rounded-full animate-pulse pointer-events-none"></div>

          <motion.div
            initial={{ scale: 0.94, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 20 }}
            className="max-w-3xl z-10 flex flex-col items-center gap-6 my-auto"
          >
            <span className="text-6xl animate-bounce">🚨</span>
            <h2 className="text-4xl md:text-5xl font-black tracking-wide uppercase text-red-100">
              EMERGENCY SOS ACTIVE
            </h2>

            {/* Countdown and Location section */}
            <div className="flex flex-col md:flex-row gap-6 items-center justify-center w-full mt-2">
              {/* Huge Countdown Display */}
              <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-8 border-red-500 bg-red-900/40 shadow-[0_0_40px_rgba(239,68,68,0.5)] flex-shrink-0">
                <span className="text-6xl font-black font-mono text-red-100">
                  {timer}
                </span>
              </div>

              {/* GPS status and info */}
              <div className="bg-white/10 border border-white/10 rounded-2xl p-4 text-left max-w-sm w-full">
                <span className="text-[9px] font-black text-red-300 uppercase tracking-widest block mb-1">
                  Broadcasting Coordinates
                </span>
                {gpsCoords ? (
                  <div className="font-mono text-xs text-red-100 flex flex-col gap-1">
                    <div>Latitude: <span className="font-bold">{gpsCoords.latitude.toFixed(6)}</span></div>
                    <div>Longitude: <span className="font-bold">{gpsCoords.longitude.toFixed(6)}</span></div>
                  </div>
                ) : (
                  <p className="text-xs text-red-200 animate-pulse">
                    Locating GPS coordinates via satellite...
                  </p>
                )}
              </div>
            </div>

            {/* Medical Info Card & Emergency Contacts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full text-left">
              {/* Medical Card */}
              <div className="bg-white/10 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
                <span className="text-[9px] font-black text-red-300 uppercase tracking-widest border-b border-white/10 pb-1.5">
                  Medical Profile Card
                </span>
                <div className="text-xs flex flex-col gap-1">
                  <div>Blood Type: <span className="font-bold text-red-100">O Positive</span></div>
                  <div>Allergies: <span className="font-bold text-red-100">Penicillin</span></div>
                  <div>Conditions: <span className="font-bold text-red-100">Visually Impaired</span></div>
                  <div>Primary Physician: <span className="font-bold text-red-100">Dr. Sarah Cole</span></div>
                </div>
              </div>

              {/* Contacts to notify */}
              <div className="bg-white/10 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
                <span className="text-[9px] font-black text-red-300 uppercase tracking-widest border-b border-white/10 pb-1.5">
                  Emergency Contacts to Notify
                </span>
                {contacts.length === 0 ? (
                  <p className="text-xs text-red-200 italic">
                    Local Emergency Services (911) will be dialed.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto scrollbar-thin">
                    {contacts.map((c, i) => (
                      <div key={i} className="text-xs text-red-100 flex justify-between">
                        <span className="font-bold">{c.name} ({c.relationship})</span>
                        <span className="font-mono text-red-200 opacity-80">{c.phone}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 w-full mt-2">
              <button
                onClick={onCancel}
                className="w-full py-4 rounded-2xl bg-white text-red-950 text-xl font-black tracking-widest hover:bg-red-100 transition-all border-2 border-red-200 active:scale-95 shadow-xl uppercase cursor-pointer"
              >
                ❌ Cancel SOS (Say "Cancel")
              </button>
              <p className="text-xs font-semibold tracking-widest text-red-400 uppercase">
                Or say "Stop" / "Abort" / "Go Back" to abort
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import { useEffect } from "react";
