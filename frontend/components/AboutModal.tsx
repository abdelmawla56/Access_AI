"use client";

import { motion, AnimatePresence } from "framer-motion";

interface AboutModalProps {
  show: boolean;
  onClose: () => void;
}

export default function AboutModal({ show, onClose }: AboutModalProps) {
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
              <span>ℹ️</span> About Symbio Tech
            </h2>
            
            <p className="text-lg leading-relaxed font-normal text-brand-text/90">
              <strong>Symbio Tech</strong> is a state-of-the-art AI-Driven Smart Assistive Ecosystem.
            </p>
            
            <p className="text-base leading-relaxed font-light text-brand-text/80">
              This project represents an embedded system integration of <strong>Computer Vision Glasses</strong> and <strong>Sensor-Based Gloves</strong> designed to provide inclusive accessibility for blind, visually impaired, and speech-impaired individuals.
            </p>

            <div className="bg-brand-cyan/10 p-5 rounded-2xl border border-brand-cyan/20">
              <h3 className="font-bold text-sm tracking-widest uppercase text-brand-cyan mb-2">Designed & Developed by</h3>
              <p className="text-base font-bold text-brand-text">Youssef Elmawla & Team</p>
              <p className="text-xs text-brand-subtle">Zewail City of Science, Technology and Innovation</p>
              <p className="text-xs text-brand-subtle mt-1 font-semibold">Contact: s-youssef.elmawla@zewailcity.edu.eg</p>
            </div>

            <button
              onClick={onClose}
              className="py-3 rounded-full bg-brand-text text-white font-bold hover:opacity-90 active:scale-95 transition-all text-sm tracking-widest uppercase mt-4 cursor-pointer"
            >
              Close (Say Go Back)
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
